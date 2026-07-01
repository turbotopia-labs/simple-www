# Comments

Comments apply from `v1.5.0`.

## Enable

Comments are disabled by default.

Enable them in config:

```json
"site": {
  "commentsEnabled": true
}
```

Comment review requires local admin editing:

```json
"site": {
  "adminEditing": true,
  "commentsEnabled": true
},
"modules": {
  "admin": {
    "enabled": true
  }
}
```

Restart the server after changing config.

## Storage

Comments are local and file-backed only.

Files are stored under:

```text
data/comments/<module>/<slug>.json
```

Each comment has:

- `id`
- `author`
- `body`
- `date`
- `approved`
- `hidden`

New comments are saved with:

```json
{
  "approved": false,
  "hidden": false
}
```

Only comments with `approved: true` and `hidden: false` are shown publicly.

## Admin Review

When admin editing and comments are enabled, the admin module shows a comment review panel.

Available actions:

- approve
- unapprove
- hide
- show

## Privacy

The comment form stores the submitted author name, comment text, and submission date. Do not ask users to submit private or sensitive information.

No external comment provider is used. No email, IP address, cookie, or account field is intentionally stored by simple-www comments.

Reverse proxies and web servers may still log requests separately.

## Backups

Back up `data/comments/` together with `content/` and `data/config.*`.

Docker mounts `data/`, so comment files remain on the host when using the provided compose setup.

Static export does not include a working comment API. Comments require server mode.
