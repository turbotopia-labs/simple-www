# Content Collections

Content collections apply from `v2.4.0`.

## Folder Layout

Collections live outside module folders:

```text
content/collections/<collection>/*.md
```

Example:

```text
content/collections/pages/about.md
content/collections/pages/contact.md
content/collections/references/parts.md
```

Collection names become navigation labels. Use lowercase names with hyphens.

## Content Format

Collection entries use the same front matter and Markdown body as module content.

Useful fields:

- `title`
- `date`
- `summary`
- `tags`
- `draft`
- `publishAt`
- `image`
- `imageAlt`
- `canonicalUrl`

Draft and scheduled collection entries stay hidden from public collection views, search indexes, static export metadata, and sitemaps.

## Routes

Collection list:

```text
#/collections/<collection>
```

Collection entry:

```text
#/collections/<collection>/<slug>
```

## API and Export

Server mode exposes collections at:

```text
/api/collections
```

Static export writes:

```text
dist/data/collections.json
```

The main `site.json` payload also includes `collections`, so exported pages can render collection views without server mode.

## Module Independence

Collections are not controlled by `config.modules`.

Use collections for content groups that should not behave like built-in modules, such as simple pages, reference notes, reusable content sets, or side material.

## v3 Preparation Notes

- Keep collection folder names lowercase and hyphenated; they are part of the public route.
- Add `lang` and `translationKey` to translated collection entries.
- Use module content for news/blog/project/download/store behavior, and collections for standalone content groups.
- Do not depend on collection labels being manually configurable before v3.
