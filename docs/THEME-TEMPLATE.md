# Theme Template Guide

This guide defines the basic rules for creating a simple-www theme pack from
`themes/theme-template.css`.

Theme packs are intentionally small. A basic theme should only set CSS custom
properties used by `public/styles.css`; it should not redefine app structure,
navigation behavior, IDs, or JavaScript-facing selectors.

## Quick Start

1. Copy `themes/theme-template.css` to a new file in `themes/`.
2. Rename the copy with a lowercase theme id, for example `themes/museum.css`.
3. Replace each placeholder color with real light and dark mode values.
4. Set the theme in `data/config.json`:

```json
"site": {
  "theme": "museum"
}
```

5. Run the site and check the home page, module lists, search, forms, and print
   preview.

Theme names must be safe file names. Use letters, numbers, hyphens, and
underscores only. Do not use spaces or path separators.

## Required File Shape

Every basic theme must define two blocks:

```css
:root {
  color-scheme: light;
  --bg: #ffffff;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #000000;
}
```

The light block is used by default. The dark block is used when the browser has
`data-theme="dark"` on the root element.

## Required Variables

Each theme pack must define all of these variables:

- `--bg`: Page background.
- `--panel`: Main panels, cards, and selected tabs.
- `--text`: Primary readable text.
- `--muted`: Secondary text and metadata.
- `--border`: Standard borders.
- `--border-strong`: Active borders and emphasized rules.
- `--link`: Links and linked titles.
- `--accent`: Tags, chips, and soft emphasis.
- `--accent-strong`: Active navigation and selected controls.
- `--shadow`: Low-fi card and panel shadows.
- `--button`: Buttons, filters, and inactive tabs.

Validation only checks that the variables exist, but a useful theme needs both
light and dark values for every variable.

## Basic Color Rules

- Keep `--text` clearly readable against `--bg`, `--panel`, `--button`, and
  `--accent`.
- Keep `--muted` readable but visibly quieter than `--text`.
- Keep `--link` distinct from `--text` and readable on `--panel`.
- Keep `--border` visible against `--bg` and `--panel`.
- Use `--border-strong` for active or focused surfaces; it should be stronger
  than `--border`.
- Use `--accent` as a soft fill, not as the main page color.
- Use `--accent-strong` as a selected state; it must still support readable
  text.
- Use `--shadow` as a subtle flat shadow color, not a glow.
- Use `--button` close to `--panel`, with enough difference to show controls.

Avoid single-color themes where every surface is only a different shade of the
same hue. The app is compact and content-heavy, so small contrast differences
matter.

## Dark Mode Rules

- Do not invert light colors mechanically.
- Keep `--bg` darkest, `--panel` slightly lighter, and `--button` close to the
  panel tone.
- Make `--text` light enough for body copy.
- Make `--muted` less bright than `--text`, but not low contrast.
- Keep `--link` brighter or more saturated than body text.
- Keep borders visible without making the UI look outlined everywhere.

Dark mode should feel like the same theme, not a different brand.

## Layout Rules

Basic themes may adjust small style details when needed, but should stay within
the simple-www layout contract.

Allowed for basic themes:

- CSS variables in `:root` and `:root[data-theme="dark"]`.
- Small spacing tweaks for `.card`, `.layout`, and `.module-nav button`.
- Small border-radius tweaks that preserve the compact, pre-2010 feel.
- Minor typography changes when they remain readable and compact.

Avoid in basic themes:

- Replacing grid or list behavior.
- Hiding module controls, search, filters, or metadata.
- Changing element IDs.
- Changing selectors used by state, such as `[data-layout]`,
  `[aria-current]`, and `[aria-pressed]`.
- Adding remote fonts, remote images, or network dependencies.
- Adding JavaScript.
- Using large animations, decorative overlays, or layout-shifting effects.

If a theme needs structural changes, treat it as an app design change, not a
basic theme pack.

## Accessibility Checks

Before shipping a theme, manually check:

- Body text on page background and card background.
- Link text in cards and detail panels.
- Button text in normal, hover, and selected states.
- Tag/chip text on `--accent`.
- Active tab and selected control states on `--accent-strong`.
- Focus outlines and strong borders.
- Dark mode for the same screens.
- Print preview remains black text on white paper.

Use real content with long titles, summaries, tags, dates, and module metadata.

## Copy Checklist

When creating a new theme from the template:

- File is placed in `themes/<theme-id>.css`.
- Theme id uses only letters, numbers, hyphens, or underscores.
- All required variables exist in light mode.
- All required variables exist in dark mode.
- `color-scheme` is set correctly in both blocks.
- No JavaScript-facing selectors are changed.
- No remote assets or dependencies are introduced.
- `data/config.json` uses the new theme id without `.css`.
- The site is checked in light mode, dark mode, mobile width, and print preview.

## Example

```css
:root {
  color-scheme: light;
  --bg: #f3f5f1;
  --panel: #ffffff;
  --text: #1d211c;
  --muted: #5b6258;
  --border: #aab3a4;
  --border-strong: #6e7a67;
  --link: #47646f;
  --accent: #dde8d3;
  --accent-strong: #c2d4b5;
  --shadow: #d2d8cf;
  --button: #eef1eb;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #1c211b;
  --panel: #262c24;
  --text: #eef2ea;
  --muted: #c1c9ba;
  --border: #505b4b;
  --border-strong: #7c8b74;
  --link: #a8c5cf;
  --accent: #33402d;
  --accent-strong: #46583d;
  --shadow: #121610;
  --button: #22281f;
}
```
