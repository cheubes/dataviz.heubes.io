# Style guide

Applies to the whole site, including the visualizations: the colors, typography and components defined here are the common base that each visualization uses by default (see "Rules common to all visualizations" in `technical-specifications.md` for what a visualization can adapt, and how).

## Colors

### Interface palette (surfaces and text)

Header and footer in fixed brand colors (navy blue, gold), rest of the interface in neutral gray on a white background.

```css
:root {
  /* Brand identity (header, footer): fixed, no dark variant
     (already dark surfaces by construction, see note below). */
  --dv-header-bg: #2c374c;
  --dv-footer-bg: #444444;
  --dv-gold: #c7b299;

  --dv-surface: #ffffff;
  --dv-page: #ffffff;
  --dv-ink-primary: #444444;
  --dv-ink-secondary: #666666;
  --dv-gridline: #acb2b8;
  --dv-accent: #2a78d6;
}

:root[data-theme="dark"] {
  --dv-surface: #1a1a19;
  --dv-page: #0d0d0d;
  --dv-ink-primary: #ffffff;
  --dv-ink-secondary: #c3c2b7;
  --dv-gridline: #2c2c2a;
  --dv-accent: #3987e5;
}
```

- `--dv-header-bg`, `--dv-footer-bg` and `--dv-gold` are the brand identity of the header and footer (see "Header" and "Footer" below): fixed values, not redefined in dark mode, because the header and footer are already dark surfaces by construction, whatever the theme of the rest of the page. `--dv-gold` serves there as the hover/focus state (text, borders), never as a data category color. `--dv-header-bg` also serves as the hover color of the catalog tiles (see "Tiles (catalog)" below), to tie this state to the brand identity rather than to a neutral color.
- `--dv-accent` (blue, identical to slot 1 of the categorical palette below) carries links and interactive elements on a light background (page body). It is never reused to encode a data category in a visualization that displays several series at the same time: a series' identity always comes from the categorical palette below, never from the accent blue alone. `--dv-gold`, lighter, is not used as a hover color on a light background: its contrast there is insufficient (see "Accessibility" in `technical-specifications.md`), it remains reserved for the dark surfaces of the header and footer.
- The site always stays in light theme, whatever the visitor's system theme: no dark mode for now. The dark values remain defined (`:root[data-theme="dark"]`) but no longer activate automatically via `prefers-color-scheme`: they can only be reached if a future manual toggle sets the `data-theme="dark"` attribute, not implemented at this stage.

### Dataviz palette (for visualizations)

Categorical palette, in this fixed order (never cycled beyond eight series: beyond that, group into "Other" or switch to small multiples):

| Slot | Hue | Light | Dark |
|---|---|---|---|
| 1 | Blue | `#2a78d6` | `#3987e5` |
| 2 | Orange | `#eb6834` | `#d95926` |
| 3 | Aqua | `#1baf7a` | `#199e70` |
| 4 | Yellow | `#eda100` | `#c98500` |
| 5 | Magenta | `#e87ba4` | `#d55181` |
| 6 | Green | `#008300` | `#008300` |
| 7 | Violet | `#4a3aa7` | `#9085e9` |
| 8 | Red | `#e34948` | `#e66767` |

Validated for color-blind reading on adjacent pairs (stacking, bars, lines). On a layout where all pairs can touch (scatter plot, choropleth, small multiples), only the first three slots remain guaranteed pairwise distinguishable: beyond three series in that case, group or switch to small multiples rather than adding a fourth hue. Three hues (magenta, yellow, aqua) fall below 3:1 contrast on light `--dv-surface` as a single thin stroke: a legend and visible direct labels remain the guarantee of readability, not color alone.

Sequential (magnitude, single hue, light → dark), blue by default:

| Step | Hex | Step | Hex | Step | Hex | Step | Hex |
|---|---|---|---|---|---|---|---|
| 100 | `#cde2fb` | 250 | `#86b6ef` | 400 | `#3987e5` | 550 | `#1c5cab` |
| 150 | `#b7d3f6` | 300 | `#6da7ec` | 450 | `#2a78d6` | 600 | `#184f95` |
| 200 | `#9ec5f4` | 350 | `#5598e7` | 500 | `#256abf` | 650 | `#104281` |
| | | | | | | 700 | `#0d366b` |

Diverging (polarity): blue ↔ red, gray neutral point (`#f0efec` light, `#383835` dark).

Statuses (fixed, never reused for a data series, always accompanied by an icon and a label, never by color alone):

| Role | Hex |
|---|---|
| Success | `#0ca30c` |
| Warning | `#fab219` |
| Serious | `#ec835a` |
| Critical | `#d03b3b` |

A visualization that needs a palette different from this default (e.g. a sequential hue specific to its subject) documents and validates it in its own `technical-specifications.md` rather than improvising colors (see "Rules common to all visualizations" in `technical-specifications.md`).

### Basemap (illustration)

Recurring colors for visualizations with a basemap (territory silhouette, hydrography): illustration colors, fixed whatever the theme, never reused to encode data (outside the dataviz palette above, see for example "Palette" in `specs/satellites-in-orbit/technical-specifications.md`).

| Use | Hex |
|---|---|
| Silhouette (basemap) | `#e4e2da` |
| Hydrography (streams, rivers) | `#a8c5da` |
| Tectonic plate boundaries | `#b3a696` |
| Permanent landmark (dormant volcano) | `#6b6455` |
| Road network | `#c9a97e` |
| Street grid (nearly invisible, high urban density) | `#f4f2ec` |
| Landmark outside the categorical palette (ancillary data without a reliable attribute) | `#a5a4a0` |

Used by `biodiversity`, `light-pollution`, `paris-trees`, `monument-layers`, `bird-migrations`, `monarch-migration`, `earthquakes` (tectonic plate boundaries, specific to the latter), `forest-fires` and `volcanic-eruptions` (permanent landmark, specific to the latter, see "Palette" in `specs/volcanic-eruptions/technical-specifications.md`); road network specific to `monument-layers`, street grid and off-palette landmark specific to `paris-trees` (see "Rendering"/"Interactions" in their respective `technical-specifications.md`); any new visualization with a basemap reuses these hues rather than introducing new ones.

## Typography

- **Font:** Ubuntu, hosted by the site, weights 300 / 400 / 500 / 700 (see "Fonts" in `technical-specifications.md` for loading).
- `font-family: "Ubuntu", sans-serif;` on `body`.

| Use | Size | Weight | Color |
|---|---|---|---|
| `h1` | 2rem | 700 | `--dv-ink-primary` |
| `h2` | 1.5rem | 700 | `--dv-ink-primary` |
| `h3` | 1.125rem | 500 | `--dv-ink-primary` |
| Body text | 1rem | 400 | `--dv-ink-secondary` |
| Secondary text, captions, metadata | 0.875rem | 300 | `--dv-ink-secondary` |

`line-height`: 1.2 for headings, 1.5 for body text.

Punctuation of French text (interface copy `i18n/fr.ts`, frontmatter and body of the `<viz-slug>.fr.md`, French text embedded in the data such as the `*Fr` fields): a non-breaking space always precedes double punctuation marks (`:`, `;`, `!`, `?`) and ellipses (`…` as well as `...`). It is typed as the U+00A0 character, not as the `&nbsp;` entity, which the frontmatter and JS strings would display literally. Non-localized attributes (e.g. a dataset's `license`, identical between the two languages) remain as published by the source.

Links: never underlined by default (`text-decoration: none`, across the whole site); the affordance comes from the color (`--dv-accent` or `--dv-gold` depending on the surface, see "Colors") and its change on hover/focus, not from underlining. `--dv-accent` is set by default on the global `a` rule (`global.css`), so that every link in running text (Markdown body of a visualization, "About" page) has the style guide color without a rule of its own. Links on a dark surface (header, footer, tooltips) redefine their color locally.

## Spacing, grid and responsive

Spacing scale, in custom CSS variables (no framework):

```css
:root {
  --dv-space-1: 4px;
  --dv-space-2: 8px;
  --dv-space-3: 16px;
  --dv-space-4: 24px;
  --dv-space-5: 32px;
  --dv-space-6: 48px;

  --dv-header-height: 5.5rem;
  --dv-footer-height: 2.5rem;
  --dv-gutter: 12px;
}
```

- `--dv-gutter`: minimal horizontal spacing at the window edge, shared by the page container, the header and the footer (see below); outside the `--dv-space-*` scale.
- Page container (main content): maximum width 1320px, centered, horizontal margin `--dv-gutter`. Does not apply to the header or footer, which are full width (see "Header" and "Footer" below).
- Catalog grid (see "Tiles (catalog)" below): fluid CSS Grid (`repeat(auto-fill, minmax(340px, 1fr))`, `gap: var(--dv-space-4)`), no fixed breakpoint to maintain; this wide tile minimum naturally caps at three columns on desktop (container width), then two and a single one below.
- `--dv-header-height` and `--dv-footer-height` size the sticky header and the fixed footer (see "Header" and "Footer" below); the main content reserves a bottom spacing equal to `--dv-footer-height` so as not to pass under the fixed footer.

## Base UI components

### Header

- **Left**: logo (`public/logo.png`) followed by the site name ("Données Vivantes" / "Living Data" depending on the language, see `i18n/fr.ts` and `i18n/en.ts`) then, below, its tagline ("Explorations visuelles de données ouvertes" / "Visual explorations of open data"), the whole linking to the home page.
- **Right**: language selector, two flags 🇫🇷 / 🇬🇧 stacked vertically (one above the other), with an explicit `aria-label` ("Français" / "English").
- `--dv-header-bg` background (navy blue), white text, `--dv-gold` bottom border.
- Hover/focus of interactive elements (site name, flags): `--dv-gold`.
- Sticky header (`position: sticky`) at the top of the page, indicative height `--dv-header-height` (see "Spacing, grid and responsive").
- Full width, without the page container (no maximum width or centering): its elements (logo/site name, language selector) are as close as possible to the window edge, with only `--dv-gutter` of horizontal spacing.
- No visualization-specific content in the header (no subtitle, no switcher): no notion of universe or alternative view here. The title of the current page is displayed in the main content, not in the chrome.

### Footer

- **Left**: license notice, two Creative Commons icons (see "Iconography") followed by the text "CC0 1.0", linking to `https://creativecommons.org/publicdomain/zero/1.0/deed.fr` or `.../deed.en` depending on the current language, applied to the original presentation and code of the site (public domain dedication, see `LICENSE` at the root of the repository); the license of each source dataset remains that of its source (see "Source dataset" in `data-model.md`), unaffected by this one.
- **Right**: "À propos" / "About" link to the page of the same name (see `about-page.md`), then, separated by a middle dot, the notice "Réalisée par Christophe Heubès" (FR) / "Created by Christophe Heubès" (EN), the name linking to `https://christophe.heubes.org`.
- `--dv-footer-bg` background (dark gray), white text, `--dv-gridline` top border, links in `--dv-gold` on hover.
- Fixed footer (`position: fixed`, anchored at the bottom of the viewport) across the full width, indicative height `--dv-footer-height`; the main content reserves this space at the bottom of the page so as never to pass under it. Vertical padding `--dv-space-2` and `--dv-space-2` spacing between the icons and the text of the license notice.
- Like the header, full width without the page container: its elements are as close as possible to the window edge, with only `--dv-gutter` of horizontal spacing.

### Filter chips (catalog)

- One chip per theme (see "Theme" in `data-model.md`), laid out in a row above the tile grid, wrapping (`flex-wrap`) rather than scrolling horizontally. Pill shape (high `border-radius`), padding `--dv-space-2` horizontal / `--dv-space-1` vertical, `--dv-space-2` spacing between chips.
- Inactive state (theme not selected): `--dv-surface` background, `--dv-ink-secondary` text, `--dv-gridline` border.
- Active state (theme selected): `--dv-header-bg` background, white text, `--dv-header-bg` border: the same brand color as the tile hover (see "Tiles (catalog)" below and the note on `--dv-header-bg` in "Colors" above), contrast well above the WCAG AA minimum (white text on `#2c374c`, ratio ≈ 12:1). Not `--dv-accent`: at 4.4:1 with white text, it falls below the AA 4.5:1 threshold required for text of this size (0.875rem, below the "large text" threshold).
- Hover/focus (inactive state): `--dv-accent` border, consistent with its role as an interactive element on a light background (see "Colors" above). No use of `--dv-gold` here, reserved for the dark surfaces of the header and footer.

### Tiles (catalog)

- Cover (ratio and dimensions: see "Images" below), lazy loaded, `title` as heading, `summary` as body, justified. Text area (title + summary) at a fixed height, summary scrolling vertically beyond that height rather than truncated: each tile keeps the same height whatever the length of the summary.
- `--dv-surface` background, `--dv-ink-primary` title, `--dv-ink-secondary` text, `--dv-gridline` border.
- Hover: slight elevation (shadow) and `--dv-header-bg` border (brand identity).

### Data table

- Collapsible block (`<details>`), closed by default. Its label (`<summary>`) is in `--dv-accent`, as secondary text, preceded by the browser's native triangle, which indicates the open or closed state.
- Table at the full width of the container, secondary text typography (`0.875rem`, weight 300, `--dv-ink-secondary`), headers in weight 500 and `--dv-ink-primary`. Caption (`<caption>`) left-aligned, above the table.
- Horizontal `--dv-gridline` rules between rows, no vertical rules or zebra stripes. Total row separated by a thicker rule (`2px`).
- Numbers right-aligned, in tabular figures (`font-variant-numeric: tabular-nums`) so that units align from one row to the next. Text left-aligned.
- On small screens, the table scrolls horizontally within its own container, never the page (see "Spacing, grid and responsive").

### Visualization page

- `title` as `h1`, `summary` then long presentation (body text of `<viz-slug>.<lang>.md`, see `data-model.md`). No cover displayed at the top of the page (unlike the tile): it remains used as the sharing image (Open Graph meta, see "SEO" in `technical-specifications.md`), not as a visual element of the page itself.
- Mount area of the visualization itself, after the presentation: full-width container, minimum height reserved to avoid a layout shift during its initialization (see the expected "States" in "Rules common to all visualizations" of `technical-specifications.md`). Visual treatment specific to each visualization, documented in its own `functional-specifications.md`.
- Table view, between the mount area and the credit block, when the visualization offers one (see "Data table" above).
- Source credit block, after the mount area: one dataset per line (`name`, `publisher`, `license`, link to `url`, `retrieved`), secondary text.
- Prepared data download, at the end of the credit block, below the list of sources (see "Prepared data download" in `functional-specifications.md`): a label, then one link per file (file name in `--dv-accent`, size in parentheses, separated by commas), and a notice reminding that reuse remains subject to the sources' licenses. Same typography as the source lines (secondary text). No icon. Absent when the visualization declares no file.
- Related visualizations section, after the credit block (selection rule: see "Related visualizations" in `functional-specifications.md`): `h2` title in the same style as that of the credit block, then the catalog tiles reused as is (see "Tiles (catalog)" above), in the same fluid grid as the home page. With fewer than three tiles, they keep the width they would have in the full grid instead of stretching. Section absent when no visualization shares a theme.
- No page-specific link back to the catalog: returning to the home page is done via the header (see "Header" above), common to all pages.

## Images

| Image | Ratio | Minimum dimensions |
|---|---|---|
| Visualization cover | 16:9 | 1200 × 675 px |

`.jpg` (photo) or `.png` (illustration, screenshot) format, depending on the nature of the visualization; no format constraint imposed beyond the ratio and minimum dimensions. `object-fit: cover` in CSS to absorb discrepancies rather than imposing strict cropping.

As long as a visualization's own cover (`src/assets/covers/<viz-slug>.jpg`/`.png`, see `data-model.md`) does not exist, a shared placeholder (`public/cover-placeholder.svg`) is displayed in its place on its tile (and serves as a fallback for its page's sharing image, see "Visualization page" above).

## Iconography

No icon library by default (no new dependency without discussion, see the project's global security rules). The rare icon needs (e.g. external link) use a Unicode character or a minimal inline SVG.

Exception: the two icons of the license notice in the footer (see "Footer" above) reuse the SVG paths of Font Awesome Free 7.3.1 (icons under the CC BY 4.0 license, credited in a comment in `Footer.astro`): `creative-commons`, `creative-commons-zero`, in that order. Inlined in the footer rather than loaded from the library, which is no longer used anywhere. Footer text size (`1em`), each in a `1.25em`-wide box that spaces them, color inherited from the footer (white, gold on hover).
