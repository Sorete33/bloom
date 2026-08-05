# AGENTS.md

Static Hugo site (single-page portfolio) for a tattoo artist in Córdoba, Argentina. No theme, no build tooling beyond Hugo itself — all templates hand-written in `layouts/`.

## Commands

- Local dev: `hugo server -D` (site is `es-AR`; `hugo.toml` `baseURL` is `http://localhost/` and `hugo server` appends the port, e.g. `http://localhost:1313/`)
- Build: `hugo --minify --baseURL https://Sorete33.github.io/bloom` — CI runs the same with `--baseURL` from the Pages URL. Asset URLs are built with the `layouts/partials/asset-url.html` partial, which prefixes `.Site.BaseURL` (e.g. `https://Sorete33.github.io/bloom/`). **Never use `absURL` or `relURL`** for site assets: both resolve against the origin and DROP the `/bloom/` base path (they emit `https://Sorete33.github.io/uploads/...`, which 404s in production). A production `--baseURL` is **required**: a plain `hugo --minify` emits `http://localhost/...` URLs that 404 in production.
- Hugo version is pinned to **0.164.0+extended** in `.github/workflows/hugo.yml`; use the same locally
- No tests, linter, or formatter configured.

## Critical gotchas

- **`public/` build output is committed to git** (61+ tracked files, and `.hugo_build.lock`). There is no `.gitignore`. After changing content or templates, regenerate and commit the updated `public/` alongside source changes, or CI output and the repo will drift.
- Site content and UI copy are **Spanish (es-AR)** — write new copy in the same register. Dates, tags, and accents matter (tag URLs contain accented segments like `/tags/linea-fina/`).
- **Category strings must match exactly** across three places: portfolio front matter (`category:`), the filter buttons in `layouts/index.html`, and the `category` select options in `static/admin/config.yml`. Allowed values: `Tatuaje (Curado)`, `Tatuaje (Fresco)`, `Diseños`, `Bellas Artes`. The homepage gallery filters on `.Params.category` (singular), not the `categories` taxonomy.
- **Sveltia CMS portfolio collection must use `format: yaml-frontmatter`** (writes `.md` files with YAML front matter). `format: yaml` writes pure `.yml` data files that Hugo ignores — entries silently never appear in the gallery. A `body` markdown field goes below the front matter automatically.
- The artist logs into the CMS with a GitHub **PAT pasted at login** (stored in the phone's localStorage). **Never commit a token or secret to the repo** — `config.yml` and everything under `static/` is served publicly.

## Structure

- `content/_index.md` — homepage content (hero, bio, booking) edited via CMS. `content/portfolio/*.md` — gallery items.
- `layouts/` — `baseof.html` (nav/footer, links `/css/style.css`, `/js/main.js`; no public admin link — the artist opens `/admin/` directly), `index.html` (gallery + lightbox, uses `where .Site.RegularPages "Section" "portfolio"`), `single.html`/`list.html` fallbacks.
- `static/uploads/` — images, referenced by absolute `/uploads/...` paths in front matter. Not processed by Hugo; new images just need to land in `static/uploads/`.
- `static/admin/` — Decap/Sveltia CMS (`/admin/`), GitHub backend on repo `Sorete33/bloom`, branch `main`; media folder `static/uploads`.
- `archetypes/default.md` emits TOML front matter (`+++`), but all existing content files use YAML (`---`). Match YAML when hand-writing content.
- `markup.goldmark.renderer.unsafe = true` in `hugo.toml`, so raw HTML in Markdown is rendered.

## Deploy

Push to `main` triggers `.github/workflows/hugo.yml` → GitHub Pages (build with `--minify`, override baseURL, upload `./public`).
