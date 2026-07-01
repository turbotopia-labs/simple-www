# Analytics Export

Analytics export applies from `v2.6.0`.

simple-www does not add tracking scripts, cookies, pixels, or client-side analytics calls.

## Server Mode

Read the generated summary at:

```text
/api/analytics
```

## Static Export

Static export writes:

```text
dist/data/analytics.json
```

## Included Data

The analytics file is generated from site metadata only:

- total module count
- total published module items
- total collection count
- total published collection items
- total media count and bytes
- category counts
- tag counts
- year and month archive counts
- media MIME type counts
- largest media files

## Privacy Boundary

The analytics export does not include:

- visitor counts
- IP addresses
- user agents
- referrers
- sessions
- cookies
- client-side events

For traffic analytics, use server logs or external tooling outside simple-www.
