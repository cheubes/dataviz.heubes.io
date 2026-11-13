# Functional specification: The Sky, Year by Year

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

Neutral angle, deliberately non-directional (see scoping discussions): the actual data (see "Geographic and temporal coverage" in `data-model.md`) shows a decline in light intensity since 2013, particularly marked since 2022-2023 (plausibly linked to energy-saving measures), not an increase. The initial working title and summary ("La nuit qui recule" / "The Retreating Night", assuming growing light pollution) presupposed the opposite of what the dataset shows: revised accordingly, without asserting a direction, to let the year slider reveal it.

| Language | Title | Summary |
|---|---|---|
| FR | Le ciel, d'année en année | Depuis 2013, des satellites mesurent chaque année la lumière artificielle émise depuis le sol en France : ce qu'on peut encore espérer voir dans le ciel nocturne, région par région. |
| EN | The Sky, Year by Year | Since 2013, satellites have measured the artificial light emitted from the ground across France each year: what you can still hope to see in the night sky, region by region. |

**Long FR presentation:**
> Chaque nuit, des satellites américains mesurent la lumière artificielle émise depuis le sol. Ces données, collectées par le programme VIIRS de la NOAA, permettent de suivre année après année l'intensité de l'éclairage nocturne partout sur Terre.
>
> Cette carte agrège ces mesures sur la France métropolitaine, année par année depuis 2013, et les traduit en une échelle de visibilité du ciel plutôt qu'en unités physiques : ce qu'on peut encore espérer y voir, d'un ciel de campagne où la Voie lactée reste visible à un ciel urbain où seules quelques dizaines d'étoiles percent encore le halo. Déplacez le curseur d'année pour voir comment cette intensité a varié, région par région, depuis 2013.

**Long EN presentation:**
> Every night, American satellites measure the artificial light emitted from the ground. This data, collected by NOAA's VIIRS program, tracks the intensity of nighttime lighting everywhere on Earth, year after year.
>
> This map aggregates these measurements across mainland France, year by year since 2013, translating them into a sky-visibility scale rather than physical units: what you might still hope to see, from a countryside sky where the Milky Way remains visible to an urban sky where only a few dozen stars still pierce through the glow. Move the year slider to see how that intensity has varied, region by region, since 2013.

## Goal

Show, on a grid of mainland France, the change in light intensity since 2013, translated into what it concretely means for observing the night sky, without presupposing the direction of that change (see "Editorial angle" above).

## Content (mount area)

- Legend of the visibility scale and controls (play/pause, speed, year slider) **above the map**, never overlaid: explicit decision (see scoping discussions), reversing the initial choice of a legend/slider floating at the bottom of the map (which, among other things, encroached on Corsica on small screens).
- Hexagonal grid of mainland France (same silhouette and same grid as `biodiversity`), each cell colored according to its level on the visibility scale for the selected year (see "Palette" in `technical-specifications.md`), in a map deliberately more compact than the site's other visualizations (see "Rendering" in `technical-specifications.md`).
- Detail card on hover/tap of a cell.

## Interactions

- **Looping autoplay:** starts as soon as the page loads, with no visitor action (same convention as `satellites-in-orbit`, see "Autoplay" below): reverses the initial "no automatic animation" choice made before this review.
- **Play/Pause:** stops or resumes the slider's automatic progression at the current year (see "Accessibility" below: required for content that moves continuously without intervention).
- **Playback speed:** Slow / Normal / Fast, changes the time spent on each year (see "Autoplay" in `technical-specifications.md`).
- **Year slider:** one step per available year (native `<input type="range">` element). Moving it manually immediately recolors the grid for the chosen year and pauses autoplay (prevents the slider from moving on its own under the visitor's finger/cursor).
- **Cell hover/tap:** detail card giving the visibility level in plain words (e.g. "Vous pourriez y voir la Voie lactée à l'œil nu"), the displayed year, and the measured radiance value for visitors who want the raw data.
- **No zoom or pan**, same decision as `biodiversity` (see "Interactions" in its `functional-specifications.md`): the map stays fixed, always framed on the whole silhouette of France.
- **No additional filter:** unlike the site's other visualizations, there is only one dimension to explore here (time, via the year slider), no category to filter.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): a chosen year (pause or slider) is restored, the map then opening paused on that year.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused on the last available year.

## Autoplay

Each pass starts from 2013 (the oldest year) and advances one year at a time up to 2025 (today), pauses for a few seconds on that final state (same logic as `satellites-in-orbit`: let the most recent year read as a culmination rather than as one frame among others) then restarts from 2013. This reverses the previous "initial view = most recent year" decision: with looping autoplay, there is no longer a frozen "initial state" to favor, the loop systematically shows both bounds (start and culmination).

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Part du territoire par niveau de visibilité du ciel, par année" / "Share of the territory by sky visibility level, by year".
- **Rows:** one per year (2013 to 2025).
- **Columns:** the six levels of the visibility scale, from pristine sky to urban sky, with the labels of the map legend. Cell: share of grid cells in that level (%), the cells all having the same area.
- **No total row:** each row adds up to 100%.

## States

- **Loading:** while `skybins.json` is retrieved and the grid initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty grid.
- **Empty:** not applicable here (the 395 grid cells always carry a value for each available year, see "Validation constraints" in `data-model.md`; no filter can reduce the display to nothing).

## Responsive

Since the legend and controls are always above the map (never overlaid, see "Content" above), their repositioning is no longer a responsive-specific concern: they flow normally in the page at all screen sizes, the playback row (button, speed, slider) simply wrapping onto a new line on narrow screens. Detail card on tap of a cell rather than on hover.

## Accessibility (known limitation)

The per-cell detail card (hover/tap) is not natively accessible by keyboard or screen reader, the same limitation as the `biodiversity` hexagonal grids. Documented as a known limitation, with no fallback, in line with the project's default rule. The year slider remains keyboard accessible (standard `<input type="range">` element): recoloring the grid by year can therefore be driven without a mouse, only the per-cell detail card cannot. The Play/Pause button is required as soon as the content animates continuously without visitor action (same rationale as `satellites-in-orbit`).

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary, by keyboard and screen reader.

## Untranslated content

The visibility scale labels (`scale` in `data-model.md`) are provided in both languages; no untranslated content to report beyond the general rules.
