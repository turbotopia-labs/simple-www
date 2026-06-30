# Module Features

Module-specific features apply from `v0.5.0`.

## News

News entries use `date` and should normally keep `sort: date-desc` in config.

```md
---
title: News title
date: 2026-07-01
category: general
summary: Short news summary
---
```

## Projects

Project entries can include:

- `status`
- `link`
- `repository`

```md
---
title: Example project
status: active
link: https://example.com/project
repository: https://example.com/repository
---
```

## Blog

Blog entries support archive and category views in the frontend.

- Archive buttons are built from the year in `date`.
- Month archive buttons are built from `YYYY-MM` in `date`.
- Category buttons are built from `category`.
- Tags are shown on each post.

## Downloads

Download entries can include:

- `version`
- `file`
- `link`

Use `file` for a direct local or external file URL. Use `link` for a related info page.

## Store

Store entries are product listings only. simple-www does not handle payments.

Store entries can include:

- `sku`
- `price`
- `link`

Use `link` for an external product page, checkout page, or contact page.

## Admin

The admin module is read-only in `v0.5.0`.

From `v0.8.0`, admin can also edit local Markdown content when both `modules.admin.enabled` and `site.adminEditing` are set to `true`.

It shows:

- loaded config source
- version
- module count
- enabled module count
- published content item count
- warning count
- per-module enabled state, item count, order, sort, and limit

See `docs/ADMIN-WORKFLOW.md` for editing, backups, and data-retention details.
