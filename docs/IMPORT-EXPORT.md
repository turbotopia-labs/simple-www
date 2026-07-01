# Import and Export Tools

Content import/export tools apply from `v1.2.0`.

## Export JSON

```powershell
node scripts/content-export.js --out exports/content.json
```

Export one module:

```powershell
node scripts/content-export.js --out exports/projects.json --module projects
```

JSON output uses:

```json
{
  "version": "1.2.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "items": []
}
```

## Export CSV

```powershell
node scripts/content-export.js --out exports/content.csv
```

CSV includes one row per Markdown file. The `body` column may contain quoted newlines.

## Import JSON

```powershell
node scripts/content-import.js --file exports/content.json --dry-run
node scripts/content-import.js --file exports/content.json
```

JSON imports accept either an array of items or an object with an `items` array.

## Import CSV

```powershell
node scripts/content-import.js --file exports/content.csv --dry-run
node scripts/content-import.js --file exports/content.csv
```

Required import columns:

- `module`
- `title`

`slug` is optional. If missing, it is generated from `title`.

## Dry Run

Use `--dry-run` before every import:

```powershell
node scripts/content-import.js --file exports/content.csv --dry-run
```

Dry run validates all rows and prints the planned `create`, `replace`, or `skip` actions without writing files.

## Duplicate Handling

Duplicate handling is explicit:

- `--duplicates fail`: default. Stop if a target file already exists or if the import contains duplicate targets.
- `--duplicates skip`: keep existing files and skip duplicate rows.
- `--duplicates replace`: overwrite existing files after creating backups.

Example:

```powershell
node scripts/content-import.js --file exports/content.json --duplicates replace
```

## Backups

Before imports, create a project backup or copy the `content/` folder.

When `--duplicates replace` overwrites an existing file, the importer creates a backup under:

```text
content/.backups/import/<module>/<slug>.<timestamp>.md
```

Backups are not created for new files or skipped duplicates.
