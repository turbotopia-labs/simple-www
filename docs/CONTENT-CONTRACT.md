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
lang: en
translationKey: page-title
category: general
summary: Short summary
slug: page-title
draft: false
publishAt: 2026-07-01T08:00:00Z
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
- `lang`: Optional content language. Defaults to the site language when omitted.
- `translationKey`: Optional stable key shared by translated variants of the same entry.
- `category`: Single category. Defaults to `general`.
- `summary`: Short text shown on module list cards and before the full body.
- `slug`: Optional slug override.
- `draft`: Set to `true` to hide the file from the site.
- `publishAt`: Optional scheduled publish date. Use `YYYY-MM-DD` or an ISO date/time such as `2026-07-01T08:00:00Z`.
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
- `untappd`: Untappd beer profile URL for `blog` entries in the `beer-rating` category.
- `rating`: Beer rating from `1.00` through `5.00` for `blog` entries in the `beer-rating` category.
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
- `publishAt` must use `YYYY-MM-DD` or an ISO date/time when present.
- `draft` and `pinned` must be booleans.
- `priority` must be an integer.
- `link`, `repository`, `untappd`, `file`, `image`, `canonicalUrl`, and `checkoutUrl` must be safe URLs or relative paths.
- `rating` must be `1.00` through `5.00` when present.
- Blog entries with `category: beer-rating` require `rating`.
- Slugs must normalize to lowercase letters, numbers, and hyphens.

Module required fields:

- `news`: `title`, `date`
- `blog`: `title`, `date`
- `projects`: `title`, `status`
- `downloads`: `title`, `version`
- `store`: `title`, `sku`, `price`
- custom modules: `title`

Module optional fields:

- All modules: `category`, `summary`, `slug`, `lang`, `translationKey`, `draft`, `publishAt`, `tags`, `updated`, `author`, `image`, `imageAlt`, `pinned`, `priority`, `canonicalUrl`
- `projects`: `link`, `repository`
- `blog` with `category: beer-rating`: `untappd`, `rating`
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

## v3 Preparation Notes

- Use explicit `slug` values for content that is linked from outside the site.
- Use `lang` on translated entries and a shared `translationKey` across translated variants.
- Keep `date` and `updated` as `YYYY-MM-DD`. Use an ISO date/time for `publishAt` when the publish time matters.
- Avoid relying on empty optional fields; omit fields that are not used.
- Treat malformed URLs, booleans, and dates as validation errors before publishing.

## Empty Modules

Modules can define their own empty state in `data/config.json`:

```json
"blog": {
  "label": "Blog",
  "enabled": true,
  "emptyState": "No blog posts have been published yet."
}
```
