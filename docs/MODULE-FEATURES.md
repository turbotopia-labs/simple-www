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

Beer rating posts use `category: beer-rating` and can include:

- `untappd`
- `rating`

`untappd` is shown as an icon link. `rating` is shown as a compact rating bar and must be from `1.00` through `5.00`.

```md
---
title: Example beer
date: 2026-07-01
category: beer-rating
summary: Short tasting note.
untappd: https://untappd.com/b/example/1
rating: 4.25
---
```

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
- `checkoutUrl`
- `paymentProvider`
- `paymentProviderProductId`
- `paymentProviderPriceId`

Use `link` for an external product page or contact page. Use `checkoutUrl` for an external checkout page. Checkout links are only shown when `site.storePaymentsEnabled` is true.

Payment provider fields are handoff metadata only. simple-www does not collect, process, store, or validate payment data.

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
