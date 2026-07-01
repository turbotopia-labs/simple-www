# Admin Workflow

Admin editing is local-only and disabled by default.

## Enable Admin

Set both values in config:

```json
"site": {
  "adminEditing": true
},
"modules": {
  "admin": {
    "enabled": true
  }
}
```

Restart the server after changing config.

Static exports cannot write content. Admin editing only works in server mode.

## Supported Actions

The admin module supports:

- Create Markdown entries.
- Edit Markdown entries.
- Delete Markdown entries.
- Edit supported front matter fields.
- Validate content before saving.
- Review local comments when `site.commentsEnabled` is true.

Supported fields match `docs/CONTENT-CONTRACT.md`.

## Validation

Before saving, simple-www checks:

- Module exists.
- Slug is present and normalized.
- Create does not overwrite an existing file.
- Edit/delete target an existing file.
- Title is present for create/edit.
- Date uses `YYYY-MM-DD` when provided.
- Draft is true or false.
- Tags are an array or comma-separated string.
- Unsupported front matter fields are rejected.

## Backups

Before edit or delete, the old file is copied to:

```text
content/.backups/<module>/<slug>.<timestamp>.md
```

Create does not make a backup because there is no previous file.

## Data Retention

Docker mounts `content/` and `data/`, so content and config remain on the host.

Recommended practice:

- Back up `content/`.
- Back up `data/`.
- Keep `content/.backups/` when using admin editing.
- Keep `data/comments/` when using local comments.
- Review old backups before deleting them manually.
