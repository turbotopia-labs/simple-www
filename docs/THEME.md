# Theme and Layout

simple-www uses a small pre-2010 style: plain typography, bordered panels, simple buttons, and light shadows.
The default UI keeps that compact serif identity with classic tab navigation, cleaner panels, and chip-style filters.

## Theme Packs

Theme packs live in `themes/` as plain CSS files. The default pack is:

```text
themes/classic.css
```

Built-in packs:

- `classic`: current pre-2010 default.
- `blueprint`: cooler technical palette.
- `ledger`: warmer document palette.

Select a pack in config:

```json
"site": {
  "theme": "classic"
}
```

The browser loads `themes/<theme>.css` after `public/styles.css`, so packs should override variables only.

## Required Variables

Safe variables to customize:

- `--bg`: Page background.
- `--panel`: Card and button background.
- `--text`: Main text color.
- `--muted`: Secondary text color.
- `--border`: Standard border color.
- `--border-strong`: Active border color.
- `--link`: Link color.
- `--accent`: Tag background.
- `--accent-strong`: Active navigation and selected control background.
- `--shadow`: Card shadow color.
- `--button`: Button background.

Keep colors readable in both `:root` and `:root[data-theme="dark"]`.

Theme validation requires every pack to define all listed variables. Define them for both light and dark modes when possible.

## Safe Customization Points

Prefer editing:

- CSS variables in a file under `themes/`.
- Card spacing in `.card`.
- Layout gaps in `.layout`.
- Module button spacing in `.module-nav button`.

Avoid changing:

- Core layout rules in `public/styles.css` unless the app structure changes.
- Element IDs used by `public/app.js`.
- `data-layout` attribute selectors.
- `aria-current` and `aria-pressed` states.

## Layout Options

The supported layouts are:

- `cards`: Default responsive card grid.
- `list`: One item per row.
- `compact`: Smaller cards for dense browsing.

Set the default layout in config:

```json
"site": {
  "layout": "cards"
}
```

Visitors can change layout in the header. Their choice is saved in local storage.

## Print

Print styles remove navigation and controls, force a white background, and render entries as simple bordered blocks.
