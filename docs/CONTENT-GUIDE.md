# Content Guide

Add content as Markdown files under `content/<module>/`.

See `docs/CONTENT-CONTRACT.md` for the stable content contract.
Use `media/` for local images and files referenced from Markdown or front matter.

## Folder layout

Use one folder per module:

```text
content/news/
content/projects/
content/blog/
content/downloads/
content/store/
content/admin/
media/
```

File names become slugs by default. Prefer lowercase names with hyphens:

```text
first-post.md
release-notes.md
example-project.md
```

## Front matter

Use this optional block at the top of each file:

```md
---
title: Page title
date: 2026-06-30
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

- `title`
- `date`
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

Set `draft: true` to hide a file from the site. Set `publishAt` to a future `YYYY-MM-DD` or ISO date/time to keep it hidden until that time. Use `tags` for short labels that can later support filtering.
Use `pinned: true` and higher `priority` values to move important entries upward without changing dates.

## Markdown support

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

Module list cards show `summary` when available. If `summary` is missing, the card uses a short body excerpt. The full Markdown body is shown on the entry page at `#/<module>/<slug>`.
