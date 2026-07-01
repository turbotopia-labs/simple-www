# Roadmap

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

- Done: Add YAML config support while keeping JSON support.
- Done: Validate config at startup with clear errors.
- Done: Add site metadata: title, description, language, author, timezone, and base URL.
- Done: Add per-module ordering and item limits.
- Done: Add documented defaults for missing config values.

## v0.4.0 - Theme and Layout

- Done: Refine the minimal pre-2010 card-based design.
- Done: Keep light and dark mode persistent.
- Done: Add simple layout options: list, cards, and compact cards.
- Done: Improve small-screen navigation.
- Done: Add print-friendly styles.
- Done: Document theme variables and safe customization points.

## v0.5.0 - Module Features

- Done: News: dated entries with latest-first ordering.
- Done: Projects: status, link, and repository fields.
- Done: Blog: tags, archive view, and category view.
- Done: Downloads: file/link metadata and version field.
- Done: Store: product entries without payment handling.
- Done: Admin: read-only diagnostics page for config and content health.

## v0.6.0 - Navigation and Discovery

- Done: Add category filtering.
- Done: Add tag filtering.
- Done: Add simple client-side search.
- Done: Add archive pages by year/month where relevant.
- Done: Add RSS feed for news and blog.
- Done: Add JSON feed export.

## v0.7.0 - Build and Export

- Done: Add static export to `dist/`.
- Done: Support running as server mode or exported static files.
- Done: Add clean handling for relative URLs and base URL.
- Done: Add generated sitemap.
- Done: Add generated robots.txt.
- Done: Document deployment options.

## v0.8.0 - Admin Workflow

- Done: Add local admin editing workflow behind an explicit config toggle.
- Done: Support create, edit, and delete for Markdown entries.
- Done: Add front matter editor for supported fields.
- Done: Add content validation before saving.
- Done: Keep admin disabled by default.
- Done: Document backup and data-retention expectations.

## v0.9.0 - Hardening

- Done: Add structured error pages.
- Done: Add health endpoint.
- Done: Add content/config validation command.
- Done: Add basic accessibility pass for keyboard navigation and contrast.
- Done: Add browser smoke checks for home, modules, theme toggle, and API.
- Done: Freeze the public content/config contract for v1.0.0.

## v1.0.0 - Stable Release

- Done: Ship stable Markdown content format.
- Done: Ship stable JSON/YAML config format.
- Done: Ship stable module toggle behavior.
- Done: Ship server mode and static export mode.
- Done: Ship Docker setup on port `6625`.
- Done: Ship complete user docs for install, content, config, modules, Docker, and deployment.
- Done: Keep dependencies minimal and optional.
- Done: Mark known future ideas as post-1.0 instead of expanding the release scope.

## v1.x - Post-1.0 Maintenance

- Keep the v1 content/config contract stable.
- Fix bugs without changing the public contract.
- Improve docs where real usage shows gaps.
- Keep dependencies minimal and optional.
- Keep Docker behavior stable on port `6625`.
- Add small compatibility helpers only when they do not expand scope.

## v1.1.0 - Expanded Content Contract

- Done: Add optional front matter fields for common publishing needs:
  - `updated`
  - `author`
  - `image`
  - `imageAlt`
  - `pinned`
  - `priority`
  - `canonicalUrl`
- Done: Add richer validation for URLs, dates, booleans, and required module fields.
- Done: Add per-module required/optional field documentation.
- Done: Add examples for every supported module.
- Done: Add migration notes from the v1.0.0 contract.

## v1.2.0 - Import and Export Tools

- Done: Add content import from JSON.
- Done: Add content import from CSV.
- Done: Add content export to JSON.
- Done: Add content export to CSV.
- Done: Add dry-run validation for imports.
- Done: Add duplicate handling rules for import.
- Done: Document backup expectations before imports.

## v1.3.0 - Theme Packs

- Done: Add `themes/` folder support.
- Done: Add config-driven theme selection.
- Done: Ship a small default theme pack set.
- Done: Keep the current pre-2010 theme as the default.
- Done: Document safe theme pack structure.
- Done: Add theme validation for required CSS variables.

## v1.2.0 - Import and Export Tools

- Add content import from JSON.
- Add content import from CSV.
- Add content export to JSON.
- Add content export to CSV.
- Add dry-run validation for imports.
- Add duplicate handling rules for import.
- Document backup expectations before imports.

## v1.3.0 - Theme Packs

- Add `themes/` folder support.
- Add config-driven theme selection.
- Ship a small default theme pack set.
- Keep the current pre-2010 theme as the default.
- Document safe theme pack structure.
- Add theme validation for required CSS variables.

## v1.4.0 - Plugin-Style Custom Modules

- Add `modules/` folder for custom module definitions.
- Support custom module labels, fields, views, and validation rules.
- Keep built-in modules working without plugins.
- Add module manifest validation.
- Document the custom module API.
- Add example custom module.

## v1.5.0 - Comments

- Add optional comment support behind an explicit config toggle.
- Start with local/file-backed comments only.
- Add moderation fields: approved, hidden, author, date.
- Add admin review for comments.
- Keep comments disabled by default.
- Document privacy and backup expectations.

## v1.6.0 - Store Integrations

- Keep store entries usable without payment handling.
- Add optional external checkout links.
- Add optional payment-provider handoff fields.
- Avoid storing payment data.
- Document provider responsibilities and security boundaries.
- Keep payment integration disabled by default.

## v1.7.0 - Multi-Site Support

- Add config for multiple site roots.
- Support per-site `content/`, `data/`, and export output.
- Add per-site base URL handling.
- Add Docker docs for multi-site deployments.
- Keep single-site mode as the default.
- Document migration from single-site to multi-site.

## v2.0.0 - Stable v2 Release

- Ship expanded content contract.
- Ship import/export tools.
- Ship theme pack support.
- Ship custom module support.
- Ship optional comments.
- Ship optional store integration handoff.
- Ship multi-site support.
- Keep v1 compatibility documented.
- Mark any breaking changes clearly.

## Later Ideas

- Full-text search index generation.
- Draft preview links.
- Scheduled publishing.
- Media library for local assets.
- Content collections independent of modules.
- Webhook or CLI hooks after export.
- Simple analytics export without tracking scripts.
- Translation/i18n support.
- Role-based admin accounts if admin grows beyond local-only use.
