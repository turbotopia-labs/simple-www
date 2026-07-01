# Media Library

Media library support applies from `v2.3.0`.

## Folder

Place local assets in:

```text
media/
```

Files are served from:

```text
/media/<path>
```

Example front matter:

```md
---
title: Project with image
image: /media/projects/example.jpg
imageAlt: Example project photo
---
```

Example Markdown:

```md
![Example](/media/projects/example.jpg)
```

## API

Server mode exposes a read-only media index at:

```text
/api/media
```

The index includes each file path, URL, MIME type, size, and modified time.

## Static Export

Static export copies local assets to:

```text
dist/media/
```

It also writes the media index to:

```text
dist/data/media.json
```

## Docker

Docker mounts `media/` to `/app/media`, so local assets stay on the host.

## Notes

- The media library is file-based.
- Add, replace, or delete files directly in `media/`.
- Admin shows the media list when admin editing is enabled.
- Keep filenames simple and URL-safe where possible.
