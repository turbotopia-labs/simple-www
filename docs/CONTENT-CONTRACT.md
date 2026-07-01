# Content Contract

This contract applies from `v1.1.0`.

## File location

Content files live in module folders:

```text
content/<module>/<slug>.md
```

Examples:

```text
content/news/welcome.md
content/blog/first-post.md
content/projects/example-project.md
```

## Slugs

The default slug comes from the file name without `.md`.

Rules:

- Use lowercase letters, numbers, and hyphens.
- Avoid spaces and underscores in file names.
- Keep slugs unique inside each module.
- A front matter `slug` value can override the file name.

Duplicate slugs do not stop the site, but they are returned in `/api/site` under `warnings` and logged by the server.

## Front matter

Front matter is optional, but recommended:

```md
---
title: Page title
date: 2026-06-30
category: general
summary: Short summary
slug: page-title
draft: false
tags: [notes, release]
updated: 2026-07-01
author: Author name
image: /images/example.jpg
imageAlt: Example image
pinned: false
priority: 0
canonicalUrl: https://example.com/page
---
```

Supported fields:

- `title`: Display title. Defaults to the slug.
- `date`: Sort date. Newest dates appear first.
- `category`: Single category. Defaults to `general`.
- `summary`: Short text shown on module list cards and before the full body.
- `slug`: Optional slug override.
- `draft`: Set to `true` to hide the file from the site.
- `tags`: Optional list. Use `[one, two]` or `one, two`.
- `updated`: Optional update date in `YYYY-MM-DD`.
- `author`: Optional author name.
- `image`: Optional image URL or relative path.
- `imageAlt`: Alt text for `image`.
- `pinned`: Optional boolean. Pinned entries sort before unpinned entries.
- `priority`: Optional integer. Higher priority sorts first inside pinned/unpinned groups.
- `canonicalUrl`: Optional canonical URL.
- `status`: Project status.
- `link`: Related page or external URL.
- `repository`: Project repository URL.
- `file`: Download file URL.
- `version`: Download or release version.
- `sku`: Store product SKU.
- `price`: Store product price text.
- `checkoutUrl`: Optional external checkout URL for store entries.
- `paymentProvider`: Optional provider name for handoff metadata.
- `paymentProviderProductId`: Optional provider product identifier.
- `paymentProviderPriceId`: Optional provider price identifier.

## Validation

Validation checks:

- `title` is required for every module.
- `date` and `updated` must use real `YYYY-MM-DD` dates when present.
- `draft` and `pinned` must be booleans.
- `priority` must be an integer.
- `link`, `repository`, `file`, `image`, `canonicalUrl`, and `checkoutUrl` must be safe URLs or relative paths.
- Slugs must normalize to lowercase letters, numbers, and hyphens.

Module required fields:

- `news`: `title`, `date`
- `blog`: `title`, `date`
- `projects`: `title`, `status`
- `downloads`: `title`, `version`
- `store`: `title`, `sku`, `price`
- custom modules: `title`

Module optional fields:

- All modules: `category`, `summary`, `slug`, `draft`, `tags`, `updated`, `author`, `image`, `imageAlt`, `pinned`, `priority`, `canonicalUrl`
- `projects`: `link`, `repository`
- `downloads`: `file`, `link`
- `store`: `link`, `checkoutUrl`, `paymentProvider`, `paymentProviderProductId`, `paymentProviderPriceId`

## Body

The body starts after front matter. Module list cards show a short summary or excerpt. The full body is shown on the entry page at:

```text
#/<module>/<slug>
```

The renderer supports common Markdown:

- Headings `#` through `######`.
- Paragraphs.
- Bold, italic, strikethrough, and inline code.
- Links and images.
- Unordered and ordered lists.
- Blockquotes.
- Fenced code blocks.
- Horizontal rules.
- Tables.

## Migration from v1.0.0

Existing v1.0.0 content remains valid except where module-specific validation now requires fields during validation.
Add missing `date` values to news/blog entries, `status` to projects, `version` to downloads, and `sku`/`price` to store entries before treating validation as release-blocking.

The new fields are optional and additive. `pinned` defaults to `false`, `priority` defaults to `0`, and empty URL/image fields are ignored.

## Empty Modules

Modules can define their own empty state in `data/config.json`:

```json
"blog": {
  "label": "Blog",
  "enabled": true,
  "emptyState": "No blog posts have been published yet."
}
```
