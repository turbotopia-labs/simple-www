# Changelog

## 0.3.0 - 2026-07-01

- Added YAML config support while keeping JSON as the default.
- Added startup config validation with clear errors.
- Added `site` metadata for title, description, language, author, timezone, and base URL.
- Added per-module `order`, `sort`, and `limit` config.
- Added documented config defaults.
- Added `simple-www v.{VERSION}` footer title.

## 0.2.0 - 2026-07-01

- Added stable Markdown content contract documentation.
- Added normalized slug handling with duplicate slug warnings.
- Added `draft: true` support to hide content files.
- Added optional `tags` front matter support.
- Added per-module empty state messages.
- Documented content naming rules and folder layout.

## 0.1.0 - 2026-06-30

- Initial project scaffold.
- Added static website engine with Markdown-backed modules.
- Added module toggles for news, projects, blog, downloads, store, and admin.
- Added minimal pre-2010 card-based theme with light/dark mode.
- Added Docker setup for port 6625 with retained content/data folders.
