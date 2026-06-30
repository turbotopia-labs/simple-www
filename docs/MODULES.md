# Modules

Modules are configured in `data/config.json`, `data/config.yaml`, or `data/config.yml`.

Each module has:

- `label`: Display name.
- `enabled`: Whether it appears on the site.
- `emptyState`: Message shown when the module has no published content.
- `order`: Navigation order. Lower numbers appear first.
- `sort`: Item ordering inside the module.
- `limit`: Maximum number of visible items, or `null`.

Initial modules:

- `news`
- `projects`
- `blog`
- `downloads`
- `store`
- `admin`
