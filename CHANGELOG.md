# Changelog

## Unreleased

- Expanded roadmap with v2 planning and post-1.0 milestones.
- Added broader Markdown rendering for common Markdown syntax.
- Changed module cards to show summary/excerpt and link to full entry pages.
- Moved search out of module tools into a discreet universal header search.
- Made tag filtering less visually prominent in module tools.
- Made all module filters more discreet and integrated with the page layout.
- Moved module navigation into the header as bookmark-style tabs.
- Added configurable footer text with `{VERSION}` replacement.

## 1.0.0 - 2026-07-01

- Shipped stable Markdown content format.
- Shipped stable JSON/YAML config format.
- Shipped stable module toggle behavior.
- Shipped server mode and static export mode.
- Shipped Docker setup on port `6625`.
- Completed user docs for install, content, config, modules, Docker, and deployment.
- Kept runtime dependencies minimal and optional.
- Moved future ideas to post-1.0 scope.
- Removed the visible skip-to-content link.

## 0.9.0 - 2026-07-01

- Added structured error pages.
- Added `/health` endpoint.
- Added `node scripts/validate.js` content/config validation command.
- Added basic accessibility improvements for keyboard navigation and contrast.
- Added browser smoke checks for home, modules, theme toggle, and API.
- Froze the public content/config contract for `v1.0.0`.

## 0.8.0 - 2026-07-01

- Added local admin editing behind explicit `site.adminEditing`.
- Added create, edit, and delete API for Markdown entries.
- Added admin front matter editor for supported fields.
- Added content validation before saving.
- Kept admin disabled by default.
- Added backups before edit/delete.
- Documented admin workflow, backups, and data-retention expectations.

## 0.7.0 - 2026-07-01

- Added static export to `dist/`.
- Added support for server mode and exported static files.
- Switched frontend asset references to relative URLs.
- Added generated `sitemap.xml`.
- Added generated `robots.txt`.
- Added deployment documentation.

## 0.6.0 - 2026-07-01

- Added client-side category filtering.
- Added client-side tag filtering.
- Added simple client-side search for the active module.
- Added archive filters by year and month where dated content exists.
- Added RSS feeds for news and blog.
- Added JSON feed export for all content and per-module feeds.
- Documented navigation, discovery, and feed URLs.

## 0.5.0 - 2026-07-01

- Added module-specific rendering for projects, downloads, and store entries.
- Added project `status`, `link`, and `repository` metadata.
- Added download `file`, `link`, and `version` metadata.
- Added store `sku`, `price`, and external `link` metadata without payment handling.
- Added blog archive and category filter views.
- Added read-only admin diagnostics for config and content health.
- Documented module features and module-specific front matter.

## 0.4.0 - 2026-07-01

- Refined the minimal pre-2010 card-based theme.
- Kept light/dark mode persistent and added persistent layout selection.
- Added list, cards, and compact layout modes.
- Improved small-screen navigation and header controls.
- Added print-friendly styles.
- Documented theme variables and safe customization points.

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
