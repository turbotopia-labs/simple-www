# Config

simple-www reads config at startup.

Default lookup order:

1. `CONFIG_FILE` environment variable, if set.
2. `data/config.json`
3. `data/config.yaml`
4. `data/config.yml`
5. Built-in defaults.

JSON remains the default format. YAML support is intentionally small and supports nested objects, strings, booleans, integers, `null`, and inline arrays.

## Site Metadata

```json
"site": {
  "title": "simple-www",
  "description": "A small Markdown-powered website.",
  "language": "en",
  "author": "",
  "timezone": "UTC",
  "baseUrl": "http://127.0.0.1:6625",
  "footerText": "simple-www v.{VERSION}",
  "theme": "classic",
  "layout": "cards",
  "adminEditing": false,
  "commentsEnabled": false
}
```

Defaults:

- `title`: `simple-www`
- `description`: `A small Markdown-powered website.`
- `language`: `en`
- `author`: empty string
- `timezone`: `UTC`
- `baseUrl`: `http://127.0.0.1:6625`
- `footerText`: `simple-www v.{VERSION}`
- `theme`: `classic`
- `layout`: `cards`
- `adminEditing`: `false`
- `commentsEnabled`: `false`

Legacy `siteTitle` and `siteDescription` still work when `site.title` and `site.description` are not set.

`footerText` supports `{VERSION}`, which is replaced with the value from the `VERSION` file.

## Modules

```json
"blog": {
  "label": "Blog",
  "enabled": true,
  "emptyState": "No blog posts have been published yet.",
  "order": 30,
  "sort": "date-desc",
  "limit": null
}
```

Fields:

- `label`: Display name.
- `enabled`: Whether the module appears on the site.
- `emptyState`: Message shown when the module has no published content.
- `order`: Navigation/content loading order. Lower numbers appear first.
- `sort`: Item ordering inside the module.
- `limit`: Maximum visible items. Use `null` for no limit.

Supported `sort` values:

- `date-desc`
- `date-asc`
- `title-asc`
- `title-desc`
- `slug-asc`
- `slug-desc`

Default modules are `news`, `projects`, `blog`, `downloads`, `store`, and `admin`.

Unknown custom modules default to:

```json
{
  "label": "Module Name",
  "enabled": false,
  "emptyState": "No content yet.",
  "order": 1000,
  "sort": "date-desc",
  "limit": null
}
```

Custom module manifests can also live in `modules/<module-id>.json`. Manifest defaults are merged before `data/config.json`, so config can override labels, ordering, enabled state, sort, and limits. See `docs/CUSTOM-MODULES.md`.

## Validation

Config is validated at startup. Invalid config stops the server with a clear error message.

Validation checks:

- `site` must be an object.
- Site metadata values must be strings.
- `site.theme` must match a CSS file in `themes/`.
- `site.layout` must be `list`, `cards`, or `compact`.
- `site.adminEditing` must be true or false.
- `site.commentsEnabled` must be true or false.
- `modules` must be an object.
- Each module must be an object.
- `enabled` must be true or false.
- `order` must be an integer.
- `limit` must be `null` or a non-negative integer.
- `sort` must be one of the supported sort values.
