# Roadmap to v1.0.0

simple-www should stay small, file-based, and easy to run. The roadmap favors stable content handling, predictable modules, and clear docs over broad framework work.

## v0.1.x - Foundation

- Serve the static frontend and API on port `6625`.
- Read module settings from `data/config.json`.
- Render Markdown content from `content/<module>/*.md`.
- Support front matter fields: `title`, `date`, `category`, and `summary`.
- Provide starter modules: news, projects, blog, downloads, store, and admin.
- Add Docker and docker-compose setup with retained `content/` and `data/` folders.
- Maintain core docs: `README.md`, `CHANGELOG.md`, `docs/CONTENT-GUIDE.md`, `docs/CATEGORIES.md`, and `docs/ROADMAP.md`.

## v0.2.0 - Content Model

- Done: Define a stable content contract for Markdown files.
- Done: Add slug handling and duplicate slug warnings.
- Done: Add draft support with `draft: true`.
- Done: Add optional `tags` front matter.
- Done: Add per-module empty states.
- Done: Document content naming rules and folder layout.

## v0.3.0 - Config

- Add YAML config support while keeping JSON support.
- Validate config at startup with clear errors.
- Add site metadata: title, description, language, author, timezone, and base URL.
- Add per-module ordering and item limits.
- Add documented defaults for missing config values.

## v0.4.0 - Theme and Layout

- Refine the minimal pre-2010 card-based design.
- Keep light and dark mode persistent.
- Add simple layout options: list, cards, and compact cards.
- Improve small-screen navigation.
- Add print-friendly styles.
- Document theme variables and safe customization points.

## v0.5.0 - Module Features

- News: dated entries with latest-first ordering.
- Projects: status, link, and repository fields.
- Blog: tags, archive view, and category view.
- Downloads: file/link metadata and version field.
- Store: product entries without payment handling.
- Admin: read-only diagnostics page for config and content health.

## v0.6.0 - Navigation and Discovery

- Add category filtering.
- Add tag filtering.
- Add simple client-side search.
- Add archive pages by year/month where relevant.
- Add RSS feed for news and blog.
- Add JSON feed export.

## v0.7.0 - Build and Export

- Add static export to `dist/`.
- Support running as server mode or exported static files.
- Add clean handling for relative URLs and base URL.
- Add generated sitemap.
- Add generated robots.txt.
- Document deployment options.

## v0.8.0 - Admin Workflow

- Add local admin editing workflow behind an explicit config toggle.
- Support create, edit, and delete for Markdown entries.
- Add front matter editor for supported fields.
- Add content validation before saving.
- Keep admin disabled by default.
- Document backup and data-retention expectations.

## v0.9.0 - Hardening

- Add structured error pages.
- Add health endpoint.
- Add content/config validation command.
- Add basic accessibility pass for keyboard navigation and contrast.
- Add browser smoke checks for home, modules, theme toggle, and API.
- Freeze the public content/config contract for v1.0.0.

## v1.0.0 - Stable Release

- Ship stable Markdown content format.
- Ship stable JSON/YAML config format.
- Ship stable module toggle behavior.
- Ship server mode and static export mode.
- Ship Docker setup on port `6625`.
- Ship complete user docs for install, content, config, modules, Docker, and deployment.
- Keep dependencies minimal and optional.
- Mark known future ideas as post-1.0 instead of expanding the release scope.

## Post-1.0 Ideas

- Plugin-style custom modules.
- Theme packs.
- Import/export tools.
- Comment support.
- Payment integration for store.
- Multi-site support.
