# v1 Compatibility

simple-www `v2.8.0` keeps single-site v1 usage working by default.

## Compatible Defaults

These v1 paths and commands still work when `SITE_ID` is not set:

```text
content/
data/
media/
dist/
node server.js
node scripts/export.js
node scripts/validate.js
docker compose up --build
```

Existing JSON/YAML config files still load from:

```text
data/config.json
data/config.yaml
data/config.yml
```

Existing Markdown files under `content/<module>/` remain supported.

## Additive v2 Features

The v2 release ships the v1.x feature set as stable:

- expanded content contract
- JSON/CSV content import and export
- theme packs
- custom module manifests
- optional local comments
- optional store checkout handoff metadata
- optional multi-site roots

These features are opt-in unless already configured.

## Breaking Changes

No breaking changes are required for default single-site operation.

Potential compatibility notes:

- Content validation is stricter than early v1. Missing module-required fields may fail `node scripts/validate.js`.
- `SITE_ID` changes active `content/`, `data/`, `media/`, comments, and export paths. Leave it unset for v1-style behavior.
- Comments, store checkout links, admin editing, and custom modules remain disabled unless explicitly enabled.

## Migration

To stay in v1-style single-site mode, do nothing.

To adopt v2 multi-site mode, follow `docs/MULTI-SITE.md`.

Back up `content/`, `data/`, `media/`, and `sites/` before moving site roots or running bulk imports.
