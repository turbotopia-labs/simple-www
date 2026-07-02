# Changelog

## Unreleased

- Added `beer-rating` blog post support with `untappd` and `rating` front matter.
- Displayed beer ratings with a rating bar and Untappd icon link.
- Tightened spacing between the beer rating label and rating bar.
- Styled the beer rating bar with a discreet Untappd-yellow palette.
- Tightened spacing between project status labels and values.
- Added roadmap progress front matter for blog posts with version-based progress bars.

## 3.0.0 - 2026-07-01

- Shipped stable discovery features.
- Shipped stable editorial workflow.
- Shipped stable media library.
- Shipped stable content collections.
- Shipped stable export hooks.
- Shipped stable tracking-free analytics export.
- Shipped stable i18n contract.
- Kept v1 and v2 compatibility documented.
- Marked known breaking-change status: no intentional breaking changes from `v2.9.0`.

## 2.9.0 - 2026-07-01

- Moved project repository links to a discreet icon beside status.
- Changed the project repository icon to a stylized GitHub mark.
- Reviewed v2 contracts for breaking-change risk before v3.
- Tightened docs around config, content, collections, export, and i18n.
- Marked deprecated and weak behavior before v3.
- Added migration notes from v2.x to v3.0.0.

## 2.8.0 - 2026-07-01

- Added optional local admin accounts behind `adminAccounts.enabled`.
- Added role checks for admin content and comment APIs.
- Added browser-side admin token entry for protected admin workflows.
- Kept admin accounts disabled by default.
- Documented admin account roles and token expectations.

## 2.7.0 - 2026-07-01

- Added config-driven language list with `site.languages`.
- Added `lang` and `translationKey` front matter fields.
- Added a header language selector when multiple languages are configured.
- Filtered module content, collections, and search results by active language.
- Added language counts to tracking-free analytics export.
- Documented translation and i18n workflow.

## 2.6.0 - 2026-07-01

- Added tracking-free analytics export.
- Added `/api/analytics` for server mode.
- Added `dist/data/analytics.json` for static export mode.
- Included content, collection, tag, archive, and media summary counts.

## 2.5.0 - 2026-07-01

- Added opt-in export hooks after successful static export.
- Added CLI command hooks with export-related environment variables.
- Added webhook hooks with JSON export payloads.
- Added `exportHooks.failOnError` and `exportHooks.timeoutMs`.
- Kept export hooks disabled by default.

## 2.4.0 - 2026-07-01

- Added content collections under `content/collections/<collection>/`.
- Added collection routes at `#/collections/<collection>` and `#/collections/<collection>/<slug>`.
- Added collections to site payloads, search index, sitemap, and static export metadata.
- Added `/api/collections` for server mode.
- Kept collections independent from module toggles and module config.

## 2.3.0 - 2026-07-01

- Added local `media/` asset library support.
- Added static serving for `/media/<path>`.
- Added `/api/media` and exported `dist/data/media.json`.
- Copied `media/` into static exports.
- Added media listing to the admin diagnostics view.
- Added Docker volume mount for `media/`.

## 2.2.0 - 2026-07-01

- Added `publishAt` front matter for scheduled publishing.
- Added draft and scheduled entry preview routes.
- Added `/api/preview` for previewing saved unpublished entries.
- Updated admin editing to list and preview draft/scheduled entries.
- Kept drafts and scheduled content out of public content, feeds, static export, and search indexes.

## 2.1.0 - 2026-07-01

- Added generated full-text search index output.
- Added `/api/search-index` for server mode.
- Added `dist/data/search-index.json` for static export mode.
- Updated browser search to use the generated index with a content fallback.
- Added structured Roadmap v3 planning.
- Made link colors more discreet across built-in themes.

## 2.0.0 - 2026-07-01

- Shipped expanded content contract as stable.
- Shipped content import/export tools as stable.
- Shipped theme pack support as stable.
- Shipped custom module support as stable.
- Shipped optional local comments as stable.
- Shipped optional store integration handoff as stable.
- Shipped multi-site support as stable.
- Kept v1 single-site behavior compatible by default.
- Documented v1 compatibility and breaking-change notes.
- Added optional footer contact link driven by `site.contactEmail`.

## 1.7.0 - 2026-07-01

- Added opt-in multi-site support through `SITE_ID` and `data/sites.json`.
- Added per-site `content/`, `data/`, comments, and export output paths.
- Added per-site base URL override handling.
- Kept existing single-site mode as the default when `SITE_ID` is unset.
- Documented Docker deployment and migration from single-site to multi-site.

## 1.6.0 - 2026-07-01

- Added optional store checkout links through `checkoutUrl`.
- Added payment-provider handoff metadata fields.
- Added `site.storePaymentsEnabled`, disabled by default.
- Kept store entries usable as plain product listings without payments.
- Documented payment provider responsibilities and security boundaries.

## 1.5.0 - 2026-07-01

- Added optional local/file-backed comments behind `site.commentsEnabled`.
- Added comment moderation fields: `approved`, `hidden`, `author`, and `date`.
- Added public comment submit/list API.
- Added admin comment review actions for approve, unapprove, hide, and show.
- Kept comments disabled by default.
- Documented comment privacy and backup expectations.

## 1.4.0 - 2026-07-01

- Added `modules/` folder support for custom module manifests.
- Added custom module labels, fields, card/detail views, and validation rules.
- Kept built-in modules working without manifests.
- Added module manifest validation at startup.
- Added example `links` custom module.
- Documented the custom module API.

## 1.3.0 - 2026-07-01

- Added `themes/` folder support and static serving/export.
- Added config-driven `site.theme` selection.
- Added built-in `classic`, `blueprint`, and `ledger` theme packs.
- Kept the current pre-2010 style as the default `classic` theme.
- Added theme validation for required CSS variables.
- Documented safe theme pack structure.

## 1.2.0 - 2026-07-01

- Added content export to JSON and CSV.
- Added content import from JSON and CSV.
- Added import dry-run validation.
- Added explicit duplicate handling with `fail`, `skip`, and `replace`.
- Added import replacement backups under `content/.backups/import/`.
- Documented import/export usage and backup expectations.

## 1.1.0 - 2026-07-01

- Expanded roadmap with v2 planning and post-1.0 milestones.
- Added broader Markdown rendering for common Markdown syntax.
- Changed module cards to show summary/excerpt and link to full entry pages.
- Moved search out of module tools into a discreet universal header search.
- Made tag filtering less visually prominent in module tools.
- Made all module filters more discreet and integrated with the page layout.
- Moved module navigation into the header as bookmark-style tabs.
- Added configurable footer text with `{VERSION}` replacement.
- Added expanded content front matter for `updated`, `author`, `image`, `imageAlt`, `pinned`, `priority`, and `canonicalUrl`.
- Added richer content validation and module-specific required field documentation.
- Added content examples for every supported module and v1.0.0 migration notes.

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
