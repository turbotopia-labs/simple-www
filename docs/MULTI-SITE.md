# Multi-Site Support

Multi-site support applies from `v1.7.0`.

Single-site mode remains the default. If `SITE_ID` is not set, simple-www uses:

```text
content/
data/
dist/
```

## Site Roots

Multi-site mode is selected with `SITE_ID`:

```powershell
$env:SITE_ID = "example"
node server.js
```

Site roots are configured in `data/sites.json`:

```json
{
  "sites": {
    "main": {
      "root": ".",
      "exportDir": "dist",
      "baseUrl": "http://127.0.0.1:6625"
    },
    "example": {
      "root": "sites/example",
      "exportDir": "sites/example/dist",
      "baseUrl": "https://example.com"
    }
  }
}
```

With `SITE_ID=example`, simple-www uses:

```text
sites/example/content/
sites/example/data/
sites/example/dist/
```

If `baseUrl` is set in `data/sites.json`, it overrides `site.baseUrl` from that site's config.

## Per-Site Config

Each site can have its own config:

```text
sites/example/data/config.json
sites/example/data/config.yaml
sites/example/data/config.yml
```

If a per-site config is missing, built-in defaults are used.

## Static Export

Export uses the active site:

```powershell
$env:SITE_ID = "example"
node scripts/export.js
```

The output goes to that site's configured `exportDir`.

## Docker

Run one container per site with a different `SITE_ID` and port:

```yaml
services:
  simple-www-main:
    build: .
    ports:
      - "6625:6625"
    environment:
      PORT: "6625"
      SITE_ID: "main"
    volumes:
      - ./content:/app/content
      - ./data:/app/data

  simple-www-example:
    build: .
    ports:
      - "6626:6625"
    environment:
      PORT: "6625"
      SITE_ID: "example"
    volumes:
      - ./data:/app/data
      - ./sites:/app/sites
```

Reverse proxies can route hostnames to the matching container.

## Migration From Single-Site

1. Keep the existing site as-is, or register it as `main` with `root: "."`.
2. Create a new site root such as `sites/example/`.
3. Copy or create `sites/example/content/`.
4. Copy or create `sites/example/data/config.json`.
5. Add the site to `data/sites.json`.
6. Run with `SITE_ID=example`.
7. Export with `SITE_ID=example` when building static files.

Back up `content/`, `data/`, and `sites/` before reorganizing site roots.
