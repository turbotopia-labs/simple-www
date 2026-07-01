# simple-www

simple-www is a small static website engine with Markdown content, JSON/YAML configuration, and toggleable modules.

Version: `1.4.0`

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

`content/` and `data/` are mounted by Docker so content and config are retained on the host.

## Export static files

```powershell
node scripts/export.js
```

Static files are written to `dist/`.

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

Each Markdown file can start with simple front matter:

```md
---
title: First post
date: 2026-06-30
category: general
summary: Short description
tags: [notes, release]
draft: false
---

Body content here.
```

## Configuration

Site settings and module toggles live in `data/config.json`. `data/config.yaml` and `data/config.yml` are also supported when JSON is not present.

## Documentation

- `docs/CONTENT-GUIDE.md`
- `docs/CONTENT-CONTRACT.md`
- `docs/CONTENT-EXAMPLES.md`
- `docs/CONFIG.md`
- `docs/THEME.md`
- `docs/MODULE-FEATURES.md`
- `docs/CUSTOM-MODULES.md`
- `docs/NAVIGATION-DISCOVERY.md`
- `docs/DEPLOYMENT.md`
- `docs/IMPORT-EXPORT.md`
- `docs/ADMIN-WORKFLOW.md`
- `docs/PUBLIC-CONTRACT.md`
- `docs/CATEGORIES.md`
- `docs/ROADMAP.md`
- `docs/MODULES.md`
