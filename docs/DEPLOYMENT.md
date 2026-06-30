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
- `/feeds/news.xml`
- `/feeds/blog.xml`
- `/feed.json`
- static frontend files

Docker uses server mode:

```powershell
docker compose up --build
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

## Base URL

Set `site.baseUrl` in config before export:

```json
"site": {
  "baseUrl": "https://example.com"
}
```

Feeds, sitemap, and robots.txt use `site.baseUrl`.

## Relative URLs

Frontend assets use relative paths, so exported files can be served from a folder or static host. In server mode, the same files are served from the site root.
