# Export Hooks

Export hooks apply from `v2.5.0`.

Hooks run after `node scripts/export.js` has written all static files.

## Config

Hooks are disabled by default:

```json
"exportHooks": {
  "enabled": false,
  "failOnError": false,
  "timeoutMs": 30000,
  "commands": [],
  "webhooks": []
}
```

## CLI Hooks

Commands run from the project root:

```json
"exportHooks": {
  "enabled": true,
  "commands": [
    "powershell -NoProfile -Command \"Write-Host exported $env:SIMPLE_WWW_VERSION\""
  ]
}
```

Command hooks receive:

- `SIMPLE_WWW_VERSION`
- `SIMPLE_WWW_EXPORT_DIR`
- `SIMPLE_WWW_CONFIG_SOURCE`

## Webhook Hooks

Webhooks use `POST` by default:

```json
"exportHooks": {
  "enabled": true,
  "webhooks": [
    { "url": "https://example.com/export-hook" }
  ]
}
```

Webhook payload:

```json
{
  "version": "2.5.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "exportDir": "dist",
  "configSource": "data/config.json",
  "site": {
    "title": "simple-www",
    "baseUrl": "https://example.com"
  },
  "counts": {
    "content": 0,
    "collections": 0,
    "media": 0
  }
}
```

## Failure Behavior

By default, hook failures are logged and export still succeeds.

Set `failOnError: true` to make a hook failure fail the export command.

## Notes

- Hooks only run for static export.
- Hooks are not run by server mode.
- Keep command hooks local and explicit.
- Do not put secrets directly in tracked config files.

## v3 Preparation Notes

- Prefer small, explicit hooks over broad shell scripts.
- Use `failOnError: true` only when a failed hook should block deployment.
- Keep webhook credentials outside tracked config where possible.
- Treat hook payload fields as stable v2 metadata unless `docs/PUBLIC-CONTRACT.md` marks a breaking change.
