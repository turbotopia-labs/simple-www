# Content Guide

Add content as Markdown files under `content/<module>/`.

See `docs/CONTENT-CONTRACT.md` for the stable content contract.

## Folder layout

Use one folder per module:

```text
content/news/
content/projects/
content/blog/
content/downloads/
content/store/
content/admin/
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
tags: [notes, release]
---
```

Supported fields:

- `title`
- `date`
- `category`
- `summary`
- `slug`
- `draft`
- `tags`

Set `draft: true` to hide a file from the site. Use `tags` for short labels that can later support filtering.

## Markdown support

The current version supports headings, paragraphs, and unordered lists.
