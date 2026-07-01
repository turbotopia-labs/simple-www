# simple-www

simple-www is a small static website engine with Markdown content, JSON/YAML configuration, and toggleable modules.

Version: `2.9.0`

## Install

No package install is required for the runtime. Use Node.js 20+ or Docker.

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

`content/`, `data/`, and `media/` are mounted by Docker so content, config, and local assets are retained on the host.

## Export static files

```powershell
node scripts/export.js
```

Static files are written to `dist/`.

The export includes `dist/data/search-index.json` for full-text search and `dist/media/` for local assets.

## Validate

```powershell
node scripts/validate.js
```

## Import and export content

```powershell
node scripts/content-export.js --out exports/content.json
node scripts/content-import.js --file exports/content.json --dry-run
```

## Dependencies

simple-www has no required npm dependencies. `package.json` only provides convenience scripts.

## Content

Content lives in `content/<module>/*.md`.
Content collections live in `content/collections/<collection>/*.md`.
Local media assets live in `media/` and are served from `/media/<path>`.

Each Markdown file can start with simple front matter:

```md
---
title: First post
date: 2026-06-30
lang: en
translationKey: first-post
category: general
summary: Short description
tags: [notes, release]
draft: false
publishAt: 2026-07-01T08:00:00Z
---

Body content here.
```

## Configuration

Site settings and module toggles live in `data/config.json`. `data/config.yaml` and `data/config.yml` are also supported when JSON is not present.

## Documentation

- `docs/CONTENT-GUIDE.md`
- `docs/CONTENT-CONTRACT.md`
- `docs/CONTENT-COLLECTIONS.md`
- `docs/CONTENT-EXAMPLES.md`
- `docs/CONFIG.md`
- `docs/THEME.md`
- `docs/MODULE-FEATURES.md`
- `docs/STORE-INTEGRATIONS.md`
- `docs/CUSTOM-MODULES.md`
- `docs/NAVIGATION-DISCOVERY.md`
- `docs/DEPLOYMENT.md`
- `docs/MULTI-SITE.md`
- `docs/V1-COMPATIBILITY.md`
- `docs/IMPORT-EXPORT.md`
- `docs/EXPORT-HOOKS.md`
- `docs/ANALYTICS.md`
- `docs/I18N.md`
- `docs/V2-TO-V3-MIGRATION.md`
- `docs/ADMIN-WORKFLOW.md`
- `docs/COMMENTS.md`
- `docs/MEDIA-LIBRARY.md`
- `docs/PUBLIC-CONTRACT.md`
- `docs/CATEGORIES.md`
- `docs/ROADMAP.md`
- `docs/MODULES.md`
