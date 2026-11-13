# Technical specifications: Tropical Nights

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: specified, not implemented.**

## Data source

Météo-France daily base climatological data, prepared once outside the build into `public/data/tropical-nights/nights.json` (see "Preprocessing" and "Output format" in `data-model.md`). No call to a third-party service at runtime.

## Rendering

**Canvas 2D for the cells, SVG for the rest.** The overview draws 8 × 77 × 184 = 113,344 cells (detailed view: 14,168): one SVG `<rect>` per cell would weigh on the DOM and on every hover, with no benefit since the cells are not individually accessible anyway (see "Accessibility" below). Same reasoning as the site's high-volume visualizations, the opposite of `flower-phenology` or `light-pollution` (a few hundred elements, SVG).

- **One canvas per grid** (eight in the overview, one in the detailed view), sized in physical pixels (`devicePixelRatio`) to stay sharp on high-density screens. The cells are filled rectangles; a 1 px gap separates them only when the cell is at least 4 px wide, otherwise they are contiguous (a grid of white rules would crush the color at small sizes).
- **Geometry:** column `i` = night `i` of the window (index 0 = May 1, see "Output format" in `data-model.md`), row `j` = year `1950 + j`, from top to bottom. Cell width and height computed separately (cells are not necessarily square) from the available space.
- **SVG overlay** on top of each canvas, for whatever is text or must stay sharp: decade markers, months, title and summary line of each grid, rule of the hovered row, annual total bars of the detailed view.
- **Hover hit-testing** by arithmetic on the pointer coordinates (`Math.floor((x - x0) / cellWidth)`), with no spatial index: the grid is regular.
- **Change of view or city:** full redraw of the canvases concerned, with no transition (see "Reduced motion" in `functional-specifications.md`). The cost is negligible (a few milliseconds for 113,000 rectangles).

## Palette

No exception to the style guide: three existing values from `style-guide.md`, a single meaningful hue.

| Night state | Color | Origin in `style-guide.md` |
|---|---|---|
| Tropical | `#e34948` | Slot 8 (red) of the categorical palette, light value |
| Ordinary | `#f0efec` | Light neutral midpoint of the diverging palette |
| Not yet observed | No fill (`--dv-surface`) | Interface surface |
| Missing | `--dv-gridline` hatching on `#f0efec` | Interface rule color |

- **Red rather than orange:** measured contrast of red `#e34948` against the ordinary cell `#f0efec`: 3.44:1, against the white surface: 3.95:1, above the 3:1 threshold for a graphical element. Orange (slot 2, `#eb6834`), more evocative of a hot night, only reaches 2.78:1 against the ordinary cell: ruled out. The red also matches the warm pole of the blue ↔ red diverging palette.
- **No per-station encoding:** the stations are separated by layout (one titled grid each), never by color. The red is therefore not used as a "series color" in the sense of the categorical palette, and no other hue is needed.
- **Binary, no TN gradient:** the night is tropical or not, according to Météo-France's definition. Grading the cells by TN value (20 °C, 22 °C, 24 °C…) would add a second reading at the expense of the first; the value stays in the tooltip. Alternative left to "Points to validate".
- **Not yet observed vs ordinary:** the difference rests on the presence or absence of a cell (`#f0efec` versus white, 1.15:1), deliberately subtle so as not to draw the eye, and the legend names it. It only concerns the end of a row in the last year.
- **Annual total bars** (detailed view): the same red `#e34948`, since they measure the same thing as the red cells; hatched for an incomplete year (see "Interactions" in `functional-specifications.md`).
- **Light background**, consistent with the site's fixed light theme (see "Colors" in `style-guide.md`). A night background (dark unlit cells, "lit" tropical nights) would better illustrate the metaphor, but would introduce a dark surface absent from the style guide: alternative left to "Points to validate".

## Mount area height

- **Large screen:** the site's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`), with no deviation. The eight grids (two rows of four) or the detailed grid share the resulting height; the cell height follows from it (on the order of 3 px in the overview and 7 px in the detailed view for a typical desktop window, to be measured).
- **Small screen, overview (documented deviation):** below about 640 px wide, four rows of two grids do not fit in `max(320px, width × 0.6)` without dropping below one pixel per year. The mount area there takes the height of its content, each grid keeping a minimum height of 2 px per year (154 px), and then exceeds the general cap: the page scrolls. Reason: an unreadable grid would be of no interest at all, and the table view remains the fallback. To be validated (see "Points to validate" below).
- **Small screen, detailed view:** default rule, with no deviation (77 rows fit in 320 px).

## New dependencies

No new dependency: `d3-scale` (`scaleLinear` for the annual total bars) and `d3-selection` (SVG overlay, selector, tooltip) are already site dependencies. Canvas 2D is native. No `d3-axis` axis: the markers (decades, months) are simple positioned texts.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations: the mount area sits below a three-paragraph long introduction, rarely visible on first display.

## Table view

`src/components/visualizations/tropical-nights/table.ts` reads `nights.json` at build time (`readDataFile`, see "Data table view" in the general `technical-specifications.md`) and computes the per-decade averages over the `complete` years, as well as the record (current year included), according to "Table view" in `functional-specifications.md`.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`. Each canvas carries `role="img"` and an `aria-label` generated from the data (station, average of the first and last complete decade, record year), so that a screen reader at least knows what the grid shows; the detail goes through the table view. City selector: native `<button>` elements with `aria-pressed`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md` and "Mount area height" above. The canvases are resized and redrawn when the window is resized (same event as the common height recalculation).

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `city` | `id` of a station in `nights.json` (`nice`, `perpignan`, `marseille`, `toulouse`, `lyon`, `bordeaux`, `paris`, `strasbourg`) | Overview |

- `city` is written on click on a city chip or on a grid of the overview, and removed on returning to "All cities".
- An unknown identifier is ignored: the visualization opens on the overview.
- No temporal position to capture (no playback), nor framing (no zoom). The tooltip and the hovered row are not captured (transient states).

## Points to validate

Design decisions proposed in these three files, to be confirmed before implementation:

1. **Form**: small multiples in the overview by default, detailed view per city as a second step (see "Chosen form" in `functional-specifications.md`), rather than a single city at a time.
2. **Selection of the eight stations**, including Marignane instead of Marseille-Observatoire (patchy from 2003 to 2018), and the exclusion of Montpellier-Aéroport and Nantes-Bouguenais (see "Chosen stations" in `data-model.md`).
3. **"Marseille-Marignane" label** for a station located about twenty kilometers from Marseille, rather than "Marignane" alone (less telling) or "Marseille" (misleading).
4. **TN ≥ 20 °C threshold** (20.0 °C included), based on two Météo-France news articles, for lack of a definition in an official glossary (see "Chosen definition" in `data-model.md`).
5. **TN measurement window** (18:00 UTC the previous day - 18:00 UTC on day D), not confirmed by the source's description: it determines the "Nuit du 24 au 25 juillet" label of the tooltip; failing that, the tooltip gives the measurement date.
6. **Raw rather than homogenized data**, for lack of a homogenized daily TN series in open data, with the caveat in the long introduction (see "Homogenized series" in `data-model.md`).
7. **Display of the SQR periods** in the note below the detailed view. If they are displayed, the dataset "Données changement climatique - SQR (Séries Quotidiennes de Référence)" (Météo-France, https://www.data.gouv.fr/datasets/donnees-changement-climatique-sqr-series-quotidiennes-de-reference, Licence Ouverte v2.0) becomes a second source to credit in `datasets`. Otherwise, remove `referencePeriod` from the output file.
8. **Displayed window from May 1 to October 31**, the only tropical night measured outside the window (Perpignan, April 25, 2002) remaining counted in the total and flagged in the tooltip.
9. **Year order**: 1950 at the top, current year at the bottom (chronological reading from top to bottom, the patch "goes down"), rather than the recent year at the top.
10. **Incomplete year threshold** at more than 9 missing nights out of 184 (5%), and exclusion of incomplete years and of the current year from the per-decade averages (see "Missing data and current year" in `data-model.md`).
11. **Current year displayed** with its nights not yet observed, rather than cutting the series at the last complete year. Corollary: the 2026 records (Perpignan, Toulouse, Bordeaux, Paris, Strasbourg) appear with the "en cours" mention as long as the year is not over.
12. **Palette**: slot 8 red for tropical nights on a light background, binary (see "Palette" above). Alternatives ruled out: slot 2 orange (insufficient contrast), gradient by TN value (a second reading that blurs the first), dark night background (surface outside the style guide, which would require adding colors to `style-guide.md`).
13. **Height deviation on small screens** for the overview (see "Mount area height" above), rather than switching directly to the detailed view below 640 px.
14. **Themes**: `[climate]` alone, which links the visualization to `flower-phenology` and `grape-harvest-almanac`. Adding `territory` (the angle of cities and the urban heat island) would also bring it closer to `paris-trees` or `medical-deserts`, at the cost of a looser thematic link.
15. **Download** of `nights.json` (`downloads: [nights.json]`), permitted by the Licence Ouverte v2.0 (see "Download" in `data-model.md`).
16. **Retrieval date**: the data was measured on 2026-09-24, in the middle of the season. A retrieval after October 31, 2026 would make the year 2026 complete and remove the "not yet observed" state until the following season, without changing the rest of the spec.
