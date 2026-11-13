# Home page

## Goal

Give the visitor an overview of the catalog of available visualizations and let them access the one that interests them.

## Content and structure

- Site header (see "Header" in `style-guide.md`).
- Theme filter: one chip per theme (see "Theme" in `data-model.md` and "Filter chips (catalog)" in `style-guide.md`), above the tile grid, single selection.
- A grid of tiles of all the visualizations available in the current language (see "Tiles (catalog)" in `style-guide.md`), sorted alphabetically by `slug`: a stable and predictable order, independent of the publication date or of the internal order of Astro collections (which changed between Astro 5 and 7).
- Visualization tile (see "Tiles (catalog)" in `style-guide.md`): cover, title, summary.
- Footer (see "Footer" in `style-guide.md`).

## Interactions

- Click on a tile: navigates to the visualization's page (see `<viz-slug>/functional-specifications.md` for its content).
- Click on a theme chip: selects that theme and automatically deselects the previously active theme (only one active theme at a time); clicking the already active theme deselects it. The grid then displays the visualizations associated with the selected theme; no selected theme displays all available visualizations, the default state. The selection is a display state specific to the current visit: it is neither kept in the URL nor remembered from one visit to the next, unlike the language preference (see "Multilingual" in `functional-specifications.md`).
- Language change via the selector: redisplays the home page in the chosen language (see "Multilingual" in `functional-specifications.md`); the current theme selection is not kept on language change.

## States (loading, error, empty, unavailable)

- Empty: no visualization published in the current language (current state of the site, before any first visualization) → message saying so rather than a blank page or a silently empty grid.
- No results: a theme is selected but no visualization matches it → dedicated message inviting the visitor to choose another theme, distinct from the empty state message above.

## Responsive

The tile grid goes from one to several columns depending on the available width (fluid CSS grid, see "Spacing, grid and responsive" in `style-guide.md`); the header and footer remain accessible without covering the content.
