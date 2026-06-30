# simple-www

simple-www is a small static website engine with Markdown content, JSON configuration, and toggleable modules.

## Run locally

```powershell
node server.js
```

Open http://127.0.0.1:6625.

## Run with Docker

```powershell
docker compose up --build
```

The site listens on port `6625`.

## Content

Content lives in `content/<module>/*.md`.

Each Markdown file can start with simple front matter:

```md
---
title: First post
date: 2026-06-30
category: general
summary: Short description
---

Body content here.
```

## Configuration

Site settings and module toggles live in `data/config.json`.

## Documentation

- `docs/CONTENT-GUIDE.md`
- `docs/CATEGORIES.md`
- `docs/ROADMAP.md`
- `docs/MODULES.md`
