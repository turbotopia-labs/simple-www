# Content Contract

This contract applies from `v0.2.0`.

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
---
```

Supported fields:

- `title`: Display title. Defaults to the slug.
- `date`: Sort date. Newest dates appear first.
- `category`: Single category. Defaults to `general`.
- `summary`: Short text shown before the body.
- `slug`: Optional slug override.
- `draft`: Set to `true` to hide the file from the site.
- `tags`: Optional list. Use `[one, two]` or `one, two`.
- `status`: Project status.
- `link`: Related page or external URL.
- `repository`: Project repository URL.
- `file`: Download file URL.
- `version`: Download or release version.
- `sku`: Store product SKU.
- `price`: Store product price text.

## Body

The body starts after front matter. The current renderer supports:

- `#`, `##`, and `###` headings.
- Paragraphs.
- Unordered lists with `-`.

## Empty Modules

Modules can define their own empty state in `data/config.json`:

```json
"blog": {
  "label": "Blog",
  "enabled": true,
  "emptyState": "No blog posts have been published yet."
}
```
