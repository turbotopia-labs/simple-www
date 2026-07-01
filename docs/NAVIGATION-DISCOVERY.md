# Navigation and Discovery

Navigation and discovery features apply from `v0.6.0`.

## Module Navigation

Enabled modules appear as bookmark-style tabs under the site subtitle using their configured `order`.

Individual entries are available at:

```text
#/<module>/<slug>
```

Module cards link to these entry pages. Cards show `summary` when available, while entry pages show the full Markdown body.

## Filtering

Each content module can show filters based on the entries it contains:

- Categories from `category`.
- Tags from `tags`.
- Archive values from `date`.

Archive filters use:

- Year: `YYYY`
- Month: `YYYY-MM`

Filters are client-side and do not change content files. Filter controls are shown as subdued inline rows above content.

Filter views can be linked with hash URLs:

```text
#/blog/category/notes
#/blog/tag/archive
#/blog/archive/2025
#/blog/archive/2025-12
```

## Search

The header search field searches all published content through a generated full-text index.

Search checks:

- title
- summary
- category
- tags
- body text

Server mode exposes the index at:

- `/api/search-index`

Static export writes the same index to:

- `data/search-index.json`

Search views can be linked with hash URLs:

```text
#/search/raspberry
```

## RSS Feeds

RSS feeds are available for dated news and blog content:

- `/feeds/news.xml`
- `/feeds/blog.xml`

Aliases:

- `/rss/news.xml`
- `/rss/blog.xml`

## JSON Feeds

JSON feed export is available at:

- `/feed.json`: all enabled content
- `/feeds.json`: all enabled content
- `/feeds/news.json`: news only
- `/feeds/blog.json`: blog only

The JSON format follows JSON Feed 1.1 fields where practical.
