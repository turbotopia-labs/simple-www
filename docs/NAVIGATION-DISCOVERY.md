# Navigation and Discovery

Navigation and discovery features apply from `v0.6.0`.

## Module Navigation

Enabled modules appear in the navigation bar using their configured `order`.

## Filtering

Each content module can show filters based on the entries it contains:

- Categories from `category`.
- Tags from `tags`.
- Archive values from `date`.

Archive filters use:

- Year: `YYYY`
- Month: `YYYY-MM`

Filters are client-side and do not change content files.

Filter views can be linked with hash URLs:

```text
#/blog/category/notes
#/blog/tag/archive
#/blog/archive/2025
#/blog/archive/2025-12
```

## Search

The module search field filters the current module in the browser.

Search checks:

- title
- summary
- category
- tags
- body text

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
