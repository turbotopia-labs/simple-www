# Public Contract for v1.1.0

This contract is stable for `v1.1.0`. Changes after `v1.1.0` should be additive unless a documented breaking release is planned.

## Content

Markdown content lives in:

```text
content/<module>/<slug>.md
```

Supported front matter fields:

- `title`
- `date`
- `category`
- `summary`
- `slug`
- `draft`
- `tags`
- `updated`
- `author`
- `image`
- `imageAlt`
- `pinned`
- `priority`
- `canonicalUrl`
- `status`
- `link`
- `repository`
- `file`
- `version`
- `sku`
- `price`

See `docs/CONTENT-CONTRACT.md` for field details.

## Config

Config is read from:

1. `CONFIG_FILE`
2. `data/config.json`
3. `data/config.yaml`
4. `data/config.yml`
5. built-in defaults

Stable `site` fields:

- `title`
- `description`
- `language`
- `author`
- `timezone`
- `baseUrl`
- `footerText`
- `layout`
- `adminEditing`

Stable module fields:

- `label`
- `enabled`
- `emptyState`
- `order`
- `sort`
- `limit`

See `docs/CONFIG.md` for defaults and validation.

## HTTP Endpoints

Stable server-mode endpoints:

- `/`
- `/api/site`
- `/health`
- `/feed.json`
- `/feeds.json`
- `/feeds/news.json`
- `/feeds/blog.json`
- `/feeds/news.xml`
- `/feeds/blog.xml`
- `/rss/news.xml`
- `/rss/blog.xml`

Admin editing endpoint:

- `/api/admin/content`

Admin editing remains disabled unless `site.adminEditing` is `true`.

## Static Export

Stable export output:

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
- `dist/404.html`

## Compatibility Rule

After `v1.0.0`, changes should be additive where possible. Breaking changes must update this file, `CHANGELOG.md`, and related docs.
