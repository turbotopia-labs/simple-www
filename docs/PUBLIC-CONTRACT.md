# Public Contract for v2.7.0

This contract is stable for `v2.7.0`. See `docs/V1-COMPATIBILITY.md` for v1 compatibility and breaking-change notes.

## Content

Markdown content lives in:

```text
content/<module>/<slug>.md
```

Supported front matter fields:

- `title`
- `date`
- `lang`
- `translationKey`
- `category`
- `summary`
- `slug`
- `draft`
- `publishAt`
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
2. active site `data/config.json`
3. active site `data/config.yaml`
4. active site `data/config.yml`
5. built-in defaults

Multi-site root config:

- `data/sites.json`
- `SITE_ID`
- `SIMPLE_WWW_SITE`

Stable `site` fields:

- `title`
- `description`
- `language`
- `languages`
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
- `/media/*`
- `/api/site`
- `/api/search-index`
- `/api/media`
- `/api/collections`
- `/api/analytics`
- `/api/preview`
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
- `dist/media/*`
- `dist/data/site.json`
- `dist/data/search-index.json`
- `dist/data/media.json`
- `dist/data/collections.json`
- `dist/data/analytics.json`
- `dist/feed.json`
- `dist/feeds.json`
- `dist/feeds/news.json`
- `dist/feeds/blog.json`
- `dist/feeds/news.xml`
- `dist/feeds/blog.xml`
- `dist/sitemap.xml`
- `dist/robots.txt`
- `dist/404.html`

In multi-site mode, `dist/` means the active site's configured `exportDir`.

Export hooks:

- `exportHooks.enabled`
- `exportHooks.failOnError`
- `exportHooks.timeoutMs`
- `exportHooks.commands`
- `exportHooks.webhooks`

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
