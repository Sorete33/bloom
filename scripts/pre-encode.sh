#!/usr/bin/env bash
# Pre-encode media for the web. Run before every `hugo` build (CI runs it too).
#
# Videos (*.mp4, *.mov, *.m4v in assets/images):
#   H.264 yuv420p (universal playback), max 720px wide, CRF 30 capped at ~1200kbps,
#   AAC audio ~96kbps, +faststart for progressive playback.
# Images (*.jpg, *.jpeg, *.png):
#   Downscale sources larger than 2000px and/or 1MB to max 2000px, JPEG q85 / PNG q90.
#
# A file is replaced only when the re-encoded output is >=10% smaller, so the script
# is idempotent: already-optimized files produce identical bytes and never churn.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEDIA_DIR="$ROOT/assets/images"

VIDEO_MAXRATE="1200k"
VIDEO_BUFSIZE="2400k"
IMAGE_MAX_PX="2000"
IMAGE_QUALITY_JPEG="85"
IMAGE_QUALITY_PNG="90"
MIN_SAVING_PCT="10"

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required" >&2; exit 1; }
command -v magick >/dev/null 2>&1 || { echo "imagemagick (magick) is required" >&2; exit 1; }
[[ -d "$MEDIA_DIR" ]] || { echo "media dir not found: $MEDIA_DIR" >&2; exit 1; }

replace_if_smaller() {
  local src="$1" tmp="$2"
  local src_size tmp_size min
  src_size="$(stat -c %s "$src")"
  tmp_size="$(stat -c %s "$tmp")"
  min=$(( src_size * (100 - MIN_SAVING_PCT) / 100 ))
  if (( tmp_size < min )); then
    echo "  compressed $(basename "$src") ($(numfmt --to=iec "$src_size") -> $(numfmt --to=iec "$tmp_size"))"
    mv -f "$tmp" "$src"
  else
    rm -f "$tmp"
  fi
}

compress_video() {
  local src="$1" tmp
  tmp="$(mktemp --suffix=.mp4)"
  trap 'rm -f "$tmp"' RETURN
  ffmpeg -y -nostdin -loglevel error \
    -i "$src" \
    -c:v libx264 -preset slow -crf 30 -maxrate "$VIDEO_MAXRATE" -bufsize "$VIDEO_BUFSIZE" \
    -vf "scale='min(720,iw)':-2" \
    -pix_fmt yuv420p \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    "$tmp"
  replace_if_smaller "$src" "$tmp"
}

compress_image() {
  local src="$1" tmp ext q
  case "${src,,}" in
    *.jpg|*.jpeg) ext="jpg" q="$IMAGE_QUALITY_JPEG" ;;
    *.png) ext="png" q="$IMAGE_QUALITY_PNG" ;;
    *) return 0 ;;
  esac
  tmp="$(mktemp --suffix=".$ext")"
  trap 'rm -f "$tmp"' RETURN
  magick "$src" -auto-orient -resize "${IMAGE_MAX_PX}x${IMAGE_MAX_PX}>" -strip -quality "$q" "$tmp"
  replace_if_smaller "$src" "$tmp"
}

vcount=0; icount=0
printf 'Encoding videos...\n'
while IFS= read -r -d '' src; do
  compress_video "$src"
  vcount=$((vcount + 1))
done < <(find "$MEDIA_DIR" -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) -size +300k -print0)

printf 'Optimizing images...\n'
while IFS= read -r -d '' src; do
  compress_image "$src"
  icount=$((icount + 1))
done < <(find "$MEDIA_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -size +1M -print0)

printf 'Done: %d videos, %d images checked.\n' "$vcount" "$icount"
