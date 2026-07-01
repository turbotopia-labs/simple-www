# Public Contract for v1.6.0

This contract is stable for `v1.6.0`. Changes after `v1.6.0` should be additive unless a documented breaking release is planned.

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
- `checkoutUrl`
- `paymentProvider`
- `paymentProviderProductId`
- `paymentProviderPriceId`

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
- `contactEmail`
- `theme`
- `layout`
- `adminEditing`
- `commentsEnabled`
- `storePaymentsEnabled`

Stable module fields:

- `label`
- `enabled`
- `emptyState`
- `order`
- `sort`
- `limit`

Custom module manifests live in:

- `modules/<module-id>.json`

Stable manifest fields:

- `id`
- `label`
- `enabled`
- `emptyState`
- `order`
- `sort`
- `limit`
- `fields`
- `views`
- `validation`

See `docs/CONFIG.md` for defaults and validation.

## HTTP Endpoints

Stable server-mode endpoints:

- `/`
- `/api/site`
- `/api/comments`
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
- `/api/admin/comments`

Admin editing remains disabled unless `site.adminEditing` is `true`.

Local comments remain disabled unless `site.commentsEnabled` is `true`.

Comment storage:

- `data/comments/<module>/<slug>.json`

## Static Export

Stable export output:

- `dist/index.html`
- `dist/app.js`
- `dist/styles.css`
- `dist/themes/*.css`
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

## Content Import and Export

Stable CLI tools:

- `node scripts/content-export.js --out <file.json|file.csv>`
- `node scripts/content-import.js --file <file.json|file.csv> --dry-run`

Import duplicate handling:

- `--duplicates fail`
- `--duplicates skip`
- `--duplicates replace`

## Compatibility Rule

After `v1.0.0`, changes should be additive where possible. Breaking changes must update this file, `CHANGELOG.md`, and related docs.
