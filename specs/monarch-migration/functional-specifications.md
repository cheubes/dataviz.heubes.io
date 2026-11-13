# Functional specification: The Monarch Migration

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | La migration des monarques | Un voyage qu'aucun papillon ne fait en entier : le relais des monarques entre le Mexique et le Canada, mois après mois, à partir de près de 400 000 observations. |
| EN | The Monarch Migration | A journey no single butterfly completes: the monarchs' relay between Mexico and Canada, month after month, drawn from nearly 400,000 observations. |

**Long FR presentation:**
> Un papillon monarque ne fait jamais le trajet complet. La migration qui le porte du Mexique jusqu'au Canada et retour est un relais entre plusieurs générations successives, dont aucune ne connaît le point de départ ni le point d'arrivée du voyage entier.
>
> Cette carte anime, mois après mois, près de 400 000 observations de monarques répertoriées dans GBIF en Amérique du Nord, regroupées sur une grille d'un degré : plus une case est opaque, plus elle recense d'observations à cette période de l'année. La vague remonte du Mexique vers le nord au printemps, atteint le sud du Canada en été, puis reflue vers le sud à l'automne, sans qu'aucun individu ne l'ait vécue en entier. Attention : ce sont des observations, pas un recensement. La densité reflète aussi l'effort d'observation, pas seulement la présence des papillons.

The EN version (`src/content/visualizations/monarch-migration.en.md`) is its faithful translation. The figure "près de 400 000" is that of the displayed dataset (395,170 observations, see "Preprocessing" in `data-model.md`): the initial draft wrongly spoke of "millions d'observations".

## Goal

To show, on a map animated over the course of a year, the monarch migration as a collective wave: a density of observations that moves north and then recedes, without any individual traveling the full route.

## Content (mount area)

- Map of North America (land silhouette, rivers and relief, see "Map technology" in `technical-specifications.md`).
- Grid of 1° × 1° cells, whose opacity varies with the number of observations in the current simulated month.
- Indicator of the current simulated month.
- Playback controls: Play/Pause, speed selector (Slow / Normal / Fast).
- Contextual tooltip on hover/tap of a cell.

## Interactions

- **Autoplay:** starts as soon as the page loads and loops continuously over a simulated year (a single calendar cycle, from January to December then back to January).
- **Speed:** Slow / Normal / Fast, factors ×0.5 / ×1 / ×2 (36 seconds per year at normal speed).
- **Hover/tap on a cell:** tooltip indicating, for the current simulated month, the volume of observations in this cell as a percentage of its own annual maximum (for example "Observations in August: 32% of the annual peak here"). A volume relative to the cell itself, not an absolute count or a global rank: it tells whether the current period is high or low for this precise place, not whether there are more butterflies here than elsewhere. No individual card (no individual to identify). The percentage updates continuously as long as the cell is hovered or pinned, since the month advances under the pointer.
- **Pinning:** a click (or a tap) on a cell pins the tooltip, a click elsewhere removes it.
- **Zoom/pan:** free (mouse/wheel, touch), up to ×6.
- **Initial view:** whole of North America visible, autoplay already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the month and the framing are restored. A shared month opens the map paused at the beginning of that month (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused at the beginning of August. The cycle has no final state: August is the month in which the density covers the most cells and totals the most observations (960 cells, a little over 100,000 observations), i.e. the most complete picture of the wave.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Observations de monarques par mois, en Amérique du Nord" / "Monarch observations by month, in North America".
- **Rows:** the twelve months.
- **Columns:** Observations; Occupied cells (on the one-degree grid); Mean latitude (°N, weighted by the number of observations); Northernmost cell (°N).
- **Total row:** "Year": total observations, number of cells occupied in at least one month, mean latitude and northernmost cell over the whole year.

## States

- **Loading:** while the density file and the basemap are fetched and the animation initializes; mount area reserved without layout shift.
- **Error:** failure to fetch one of the files (or empty density file): error message, no silent empty map.
- **No empty state:** no filter, hence no combination that shows nothing.

## Responsive

Pan/zoom by touch gesture, tooltip and pinning on tap, controls on a single line that wraps on small screens.

## Accessibility (known limitation)

The main interaction (animated map, zoom/pan, hover on cells) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in accordance with the project's default rule. The Play/Pause button remains keyboard-accessible (standard `<button>` element), to make it possible to stop content that moves continuously without intervention.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Known limitations

- **No legend for the opacity scale:** the explanation lies in the presentation text ("plus une case est opaque, plus elle recense d'observations"), not in a dedicated component on the map.
- **Cells visible to the naked eye:** about 100 km per side. A finer step would multiply the number of GBIF requests in the preprocessing, already constrained by the API rate limit (see "Preprocessing" in `data-model.md`).
- **Unstable percentage on low-count cells:** a cell that has only one observation in the year displays 100% of the annual peak in the month of that observation. At 1°, one active cell in five (22%) totals fewer than five observations over the year, and one in three (32%) fewer than ten; the tooltip therefore remains an order of magnitude, not a precise measurement.

## Untranslated content

No scientific name is displayed in the map interface (only the dataset citation, in the credit block, carries *Danaus plexippus*). No untranslated content to report beyond the general rules.
