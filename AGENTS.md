# AGENTS.md

Static Hugo site (single-page portfolio) for a tattoo artist in Córdoba, Argentina. No theme, no build tooling beyond Hugo itself — all templates hand-written in `layouts/`.

## Commands

- Local dev: `hugo server -D` (site is `es-AR`; `hugo.toml` `baseURL` is `http://localhost/` and `hugo server` appends the port, e.g. `http://localhost:1313/`). To test from a phone on the LAN, serve with `hugo server -D --bind 0.0.0.0 --baseURL http://<LAN-IP>:1313/` — with the default `localhost` baseURL the phone resolves asset URLs to itself and the site breaks.
- Build: `hugo --minify --baseURL https://Sorete33.github.io/bloom` — CI runs the same with `--baseURL` from the Pages URL. Static asset URLs are built with the `layouts/partials/asset-url.html` partial, which prefixes `.Site.BaseURL` (e.g. `https://Sorete33.github.io/bloom/`). **Never use `absURL` or `relURL`** for site assets: both resolve against the origin and DROP the `/bloom/` base path (they emit `https://Sorete33.github.io/uploads/...`, which 404s in production). `.Permalink` of `resources.Get` output (CSS/JS/images) is safe — it already includes the `/bloom/` base path. A production `--baseURL` is **required**: a plain `hugo --minify` emits `http://localhost/...` URLs that 404 in production.
- Hugo version is pinned to **0.164.0+extended** in `.github/workflows/hugo.yml`; use the same locally
- No tests, linter, or formatter configured.

## Critical gotchas

- **`public/` build output is committed to git** (only Hugo's `resources/` cache is ignored via `.gitignore`). After changing content or templates, regenerate (`rm -rf public && hugo --minify --baseURL https://Sorete33.github.io/bloom`; Hugo does NOT clean stale files on rebuild) and commit the updated `public/` alongside source changes, or CI output and the repo will drift.
- Site content and UI copy are **Spanish (es-AR)** — write new copy in the same register. Dates, tags, and accents matter (tag URLs contain accented segments like `/tags/linea-fina/`).
- **Category strings must match exactly** across three places: portfolio front matter (`category:`), the filter buttons in `layouts/index.html`, and the `category` select options in `static/admin/config.yml`. Allowed values: `Tatuaje (Curado)`, `Tatuaje (Fresco)`, `Diseños`, `Bellas Artes`. The homepage gallery filters on `.Params.category` (singular), not the `categories` taxonomy.
- **Sveltia CMS portfolio collection must use `format: yaml-frontmatter`** (writes `.md` files with YAML front matter). `format: yaml` writes pure `.yml` data files that Hugo ignores — entries silently never appear in the gallery. A `body` markdown field goes below the front matter automatically.
- The artist logs into the CMS with a GitHub **PAT pasted at login** (stored in the phone's localStorage). **Never commit a token or secret to the repo** — `config.yml` and everything under `static/` is served publicly.

## Structure

- `content/_index.md` — homepage content (hero, bio, booking) edited via CMS. `content/portfolio/*.md` — gallery items. Portfolio images are referenced in front matter as absolute `/assets/images/...` paths (see below).
- `layouts/` — `baseof.html` (nav/footer; links the fingerprinted `assets/css/style.css` and `assets/js/main.js`; no public admin link — the artist opens `/admin/` directly), `index.html` (gallery + lightbox, uses `where .Site.RegularPages "Section" "portfolio"`), `single.html`/`list.html` fallbacks, `_markup/render-image.html` (goldmark image render hook: any `![](/assets/...)` in a markdown body becomes an optimized `<picture>`).
- `assets/images/` — **portfolio and bio images**, referenced by absolute `/assets/images/...` paths in front matter. Every image is processed at build time to WebP + AVIF via `layouts/partials/img-src.html` (Hugo Image Processing): `720x960` `Fill` for gallery cards, `1600x` `Resize` for the lightbox, `1200x` for single pages, `1000x` for the bio, `1600x` for the hero `banner_image` and for images embedded in markdown bodies (render hook). Processed output is hashed and published under `/images/`; raw originals in `assets/` are **never published**. Paths not under `/assets/` (e.g. `/uploads/...`) fall back to the raw static URL.
- **CMS uploads are optimized automatically** (portfolio, bio, hero, body markdown) — but Hugo only processes what templates touch: an uploaded image that is never referenced in front matter/body is neither processed nor published (it just grows the git repo). Hugo extended cannot process HEIC/HEIF; the CMS hints say JPG/PNG. Videos cannot be processed by Hugo (hero video lives in `static/uploads/`).
- `static/uploads/` — **non-processed media only**: hero videos (`reel-background.webm` AV1/WebM + `reel-background.mp4` fallback, both without audio), the `reel-background-poster.webp` poster, and the logo PNGs. Not processed by Hugo; referenced by absolute `/uploads/...` paths.
- `assets/css/style.css` and `assets/js/main.js` — compiled with `resources.Minify` + `resources.Fingerprint` in `baseof.html` (hashed filenames → cache busting). JS lazy-loads the hero video via IntersectionObserver (`preload="none"`, `src` set on demand) and injects an AVIF `<source>` into the lightbox when available.
- `static/admin/` — Decap/Sveltia CMS (`/admin/`), GitHub backend on repo `Sorete33/bloom`, branch `main`; media folder `assets/images` (uploads land there and get processed automatically, `public_folder` `/assets/images`).
- `static/_headers` — cache policy (`immutable` for hashed `/css/`, `/js/`, `/images/`). **GitHub Pages ignores it**; it only takes effect if the site is served on Netlify/Cloudflare Pages. Fingerprinted filenames still bust cache on GH Pages via unique URLs.
- `archetypes/default.md` emits TOML front matter (`+++`), but all existing content files use YAML (`---`). Match YAML when hand-writing content.
- `markup.goldmark.renderer.unsafe = true` in `hugo.toml`, so raw HTML in Markdown is rendered.

## Deploy

Push to `main` triggers `.github/workflows/hugo.yml` → GitHub Pages (build with `--minify`, override baseURL, upload `./public`).
