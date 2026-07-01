# Deployment

simple-www can run in two modes:

- Server mode
- Static export mode

## Server Mode

Run the Node server:

```powershell
node server.js
```

The server provides:

- `/`
- `/api/site`
- `/health`
- `/feeds/news.xml`
- `/feeds/blog.xml`
- `/feed.json`
- static frontend files
- local admin editing when explicitly enabled

Docker uses server mode:

```powershell
docker compose up --build
```

Set `SITE_ID` to run a configured multi-site root:

```powershell
$env:SITE_ID = "example"
node server.js
```

## Static Export

Build `dist/`:

```powershell
node scripts/export.js
```

The export includes:

- `dist/index.html`
- `dist/app.js`
- `dist/styles.css`
- `dist/data/site.json`
- `dist/feed.json`
- `dist/feeds.json`
- `dist/feeds/news.json`
- `dist/feeds/blog.json`
- `dist/feeds/news.xml`
- `dist/feeds/blog.xml`
- `dist/sitemap.xml`
- `dist/robots.txt`

Upload the contents of `dist/` to any static host.

Static export mode is read-only. Admin editing is not available from exported files.

In multi-site mode, export writes to the active site's configured `exportDir`.

## Validation

Run validation before deployment:

```powershell
node scripts/validate.js
```

The command checks config, content metadata, and duplicate slug warnings.

## Base URL

Set `site.baseUrl` in config before export:

```json
"site": {
  "baseUrl": "https://example.com"
}
```

Feeds, sitemap, and robots.txt use `site.baseUrl`.

In multi-site mode, `data/sites.json` can set a per-site `baseUrl` that overrides the site's config.

## Relative URLs

Frontend assets use relative paths, so exported files can be served from a folder or static host. In server mode, the same files are served from the site root.

See `docs/MULTI-SITE.md` for multi-site Docker examples and migration notes.
