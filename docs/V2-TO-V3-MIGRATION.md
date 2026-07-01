# v2 to v3 Migration Notes

`v3.0.0` is the stable v3 release. It does not intentionally break `v2.9.0` behavior. This document keeps the v2 compatibility notes and migration checklist in one place.

## Breaking-Change Risk Review

- Config: JSON and YAML remain supported. New config should use nested `site.title` and `site.description`; legacy root-level `siteTitle` and `siteDescription` are compatibility aliases.
- Content: the Markdown/front matter contract remains file-based and additive. Empty or malformed optional fields may be rejected more strictly in v3 validation.
- Collections: `content/collections/<collection>/*.md` is the stable folder layout. Collection labels currently come from folder names.
- Export: `dist/` is generated output. Do not edit exported files as source.
- Export hooks: hooks run only after successful static export. Broad shell commands are supported, but should be kept local, explicit, and free of tracked secrets.
- i18n: entries without `lang` remain language-neutral. Translated entries should use explicit `lang` and shared `translationKey`.
- Admin accounts: admin accounts are local token-based controls, not a remote identity system.

## Deprecated or Weak Behavior Before v3

- Legacy `siteTitle` and `siteDescription`: still supported, but new config should use `site.title` and `site.description`.
- Missing `lang` on translated content: still allowed, but translated content should declare `lang`.
- Missing `translationKey` across translated variants: still allowed, but weak for long-term i18n.
- Direct edits in `dist/`: unsupported because export can overwrite them.
- Store payment handoff fields: metadata only. simple-www does not process or store payment data.
- Admin account tokens in tracked config: weak operational practice. Keep tokens local or injected outside public config.

## Migration Checklist

1. Run validation with `node scripts/validate.js`.
2. Move any legacy `siteTitle` and `siteDescription` values into `site.title` and `site.description`.
3. Add `lang` to translated module and collection entries.
4. Add matching `translationKey` values to translated variants of the same entry.
5. Treat `dist/` as disposable generated output and keep source changes in `content/`, `data/`, `media/`, `themes/`, or `public/`.
6. Review `exportHooks` commands and webhooks before enabling `failOnError`.
7. Keep admin tokens out of shared config files when `adminAccounts.enabled` is true.

## v3.0.0 Expectation

v3 keeps the file-based model, server mode, static export mode, and v1/v2 compatibility docs. Any future breaking change must be called out in `docs/PUBLIC-CONTRACT.md`, `CHANGELOG.md`, and the affected feature docs.

## Breaking Changes

There are no intentional breaking changes from `v2.9.0` to `v3.0.0`.
