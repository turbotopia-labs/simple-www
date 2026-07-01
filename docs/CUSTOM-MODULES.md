# Custom Modules

Custom modules apply from `v1.4.0`.

## Folder

Module manifests live in:

```text
modules/<module-id>.json
```

`module-id` must use lowercase letters, numbers, hyphens, or underscores. Built-in modules do not need manifests.

## Manifest

Example:

```json
{
  "id": "links",
  "label": "Links",
  "enabled": false,
  "emptyState": "No links have been added yet.",
  "order": 70,
  "sort": "title-asc",
  "limit": null,
  "fields": [
    {
      "name": "url",
      "label": "URL",
      "type": "url",
      "required": true,
      "list": true,
      "detail": true
    }
  ],
  "views": {
    "list": ["url"],
    "detail": ["url"]
  },
  "validation": {
    "required": ["title", "url"]
  }
}
```

## Supported Field Types

- `string`
- `text`
- `date`
- `boolean`
- `integer`
- `url`
- `tags`

Fields are read from Markdown front matter. Unknown fields are ignored unless they are declared in the manifest.

## Views

`views.list` controls fields shown on module cards.

`views.detail` controls fields shown on full entry pages.

If a view is omitted, fields marked with `list: true` or `detail: true` are used.

## Validation

Manifest validation checks:

- manifest shape
- matching `id`
- supported field types
- known view fields
- known required fields
- valid default module config values

Content validation checks:

- built-in content rules
- custom required fields
- custom field type rules

## Content

Custom content uses the same folder layout:

```text
content/links/example.md
```

```md
---
title: Example link
url: https://example.com
source: Example
rating: 5
---

Notes about the link.
```

## Config Override

Manifest defaults can still be overridden in `data/config.json`:

```json
"modules": {
  "links": {
    "enabled": true,
    "order": 25
  }
}
```

Built-in modules continue to work without plugin manifests.
