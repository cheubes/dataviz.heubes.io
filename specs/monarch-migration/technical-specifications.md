# Technical specifications: The Monarch Migration

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Map technology

D3 v7, same stack as `bird-migrations`, no Leaflet.

- **Basemap, rivers, relief: direct reuse of the `bird-migrations` assets, copied (not referenced) into `public/data/monarch-migration/`.** `basemap.json` (land silhouette), `rivers.json` (rivers) and `relief.webp` (shaded relief) already cover the whole world, not only the Europe/Africa rectangle framed by `bird-migrations` (see "Worldwide coverage" in its `data-model.md` and "Basemap"/"Rivers"/"Relief" in its `technical-specifications.md`): the three files are copied as is, with no new extraction or new preprocessing, only the framing changes. Copy rather than direct reference between folders, consistent with "each visualization has its own data" (see `CLAUDE.md`): each `public/data/<viz-slug>/` folder remains self-contained, at the cost of a duplication (basemap + relief + rivers, about 1.2 MB) judged reasonable in light of the rest of the site.
- **Projection:** `d3.geoNaturalEarth1` (same choice as `bird-migrations`), `fitExtent` on a North America rectangle (128°W-62°W, 12°N-54°N), i.e. the footprint of the density grid (14°N-52°N, 125°W-65°W, see "Preprocessing" in `data-model.md`) with a small margin. Framing ring oriented clockwise (and not following the RFC 7946 convention), as in `bird-migrations`: the spherical winding rule of `d3-geo` is inverted, and a counterclockwise ring is read as "everything except this rectangle", which frames the whole world. The world map is not displayed in full here: only North America is (see "Initial view" in `functional-specifications.md`).
- **Zoom:** `d3-zoom`, `scaleExtent [1, 6]`, identical to `bird-migrations`. The default regional framing makes a higher cap unnecessary, as was considered when the map was a world map (see "Refocused scope" in `data-model.md`).

## Relief: alignment on resize

Same mechanism as `bird-migrations` (see its section of the same name in its `technical-specifications.md`): `relief.webp` is a static image pre-rendered once, realigned on each resize via a pair of `fitExtent` calls (once on a fixed reference rectangle to obtain the calibration scale/translation, once on the framing actually displayed to derive the scale/offset to apply to the image).

**No recalibration is needed, contrary to what a first version of this spec anticipated.** The calibration computation (`RELIEF_REF_WIDTH`/`HEIGHT`/`ORIGIN_X`/`ORIGIN_Y`, and the Europe/Africa rectangle of `bird-migrations`) is reused strictly identically in `render.ts` (`REFERENCE_VIEW_BOUNDS`), without ever being displayed: it serves only as a calibration anchor. The framing actually displayed (`VIEW_BOUNDS`, North America) is a second, independent rectangle. Geometric justification: the projection (`geoNaturalEarth1`, default rotation/center, never modified) is the same in both visualizations, and `fitExtent` fully recomputes scale and translation on each call from the geometry and the target rectangle provided, so the affine relationship between the calibration frame and any displayed frame remains valid as long as the projection itself does not change. Regenerating `relief.webp` or computing new constants would have been unnecessary and risked introducing the exact misalignment this mechanism seeks to avoid (see "Potential pitfall to watch out for" in the `technical-specifications.md` of `bird-migrations`).

**Verified on screen, at this regional framing where an offset would be immediately visible:** relief, coastline and rivers stay aligned (implementation screenshots, in January and in August).

## Rendering

**Canvas 2D**, two stacked layers: background (silhouette, relief, rivers, redrawn on resize and on zoom) and density (cleared and fully redrawn on each frame: it represents a current state, not a trail that accumulates like the trajectories of `bird-migrations`).

- **Density cells:** each grid cell (see "Output format" in `data-model.md`) is painted as a quadrilateral with four projected corners, not as a rectangle defined by two opposite corners: two neighboring cells then share exactly the same points, and the curvature of the projection cannot open a seam between them. Opacity driven by the volume of observations in the current simulated month (linear interpolation between the current month and the next rather than an abrupt change at each month switch, for a progressive "wave" rather than a jerky one), `d3.scalePow` scale with exponent 0.25, alpha from 0 to 0.95, fitted to the global maximum across all cells/months (4,904 observations). **Why such a low exponent:** counts are very uneven (median cell: 28 observations over the year, maximum: 4,904), and a square root (first version, alpha from 0.05 to 0.8) left most cells almost invisible on the beige background, explicit user feedback. With the exponent 0.25, a single observation gives an alpha of about 0.11 and 28 observations about 0.26, while the busiest cell stays at 0.95. The scale starts from zero (and not from a floor) so that a cell fades out gradually, without a jump, when its interpolated value tends toward zero between two months. `DENSITY_CELL_DEGREES = 1` replicated as a constant in `render.ts`, must stay in sync with the preprocessing grid. **Drawing cost:** up to 960 active cells in the busiest month, about three times more than at 2° (331 in August); measured with software rendering in headless Chromium, 60 frames per second sustained (average 16.7 ms, worst frame 18.8 ms over six seconds): no memoization of the projected corners, which would remain an option if a more modest device struggled.
- **Tooltip:** standard HTML DOM element, overlaid on the Canvas, same approach as `bird-migrations`. Percentage relative to the annual maximum *of the cell* (not a global rank), see "Interactions" in `functional-specifications.md`. Cell found from the pointer position by inverse projection (screen to longitude/latitude) then a containment test on the cell, not through a stored pixel geometry.

## New dependencies

No new dependency compared with `bird-migrations`: `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` are sufficient (same list, see "New dependencies" in its `technical-specifications.md`), new only for this visualization.

## Palette

A single series: Orange hue (`#eb6834`, slot 2 of the official categorical palette, see "Dataviz palette" in `style-guide.md`). Slot 1 (Blue) is not used, unlike the default order for a single series: orange evokes the monarch's wings, stands out on the beige silhouette and its relief, and avoids the blue of the rivers (`#a8c5da`, see "Basemap (illustration)" in `style-guide.md`) which would blend with the cells.

**Yellow ruled out after testing:** the hue originally chosen was Yellow (`#eda100`, slot 4, the monarch's color when it was the fourth species of a world map, see "Refocused scope" in `data-model.md`). Compared with orange on the actual rendering (January, April, August, with the same opacity scale), yellow remained too soft on the beige: the faint cells blended into it. Yellow is also one of the three hues below 3:1 contrast on a light background (see "Dataviz palette" in `style-guide.md`), which is not the case for orange.

Here the hue encodes no category: it is the opacity that encodes the volume of observations. Reading relies on the presentation text and the tooltip rather than on color alone (no legend, see "Known limitations" in `functional-specifications.md`).

## Animation

- `d3-timer` loop, driven by a simulated time in days (0-365, cyclic): a single continuous cycle, 36 seconds per year at normal speed.
- Displayed value per cell: linear interpolation between the `count` of the current simulated month and that of the following month (January follows December), according to the elapsed fraction of the current month. The month is that of the simulated date (non-leap reference year), and its fraction is computed over its actual length in days rather than over a twelfth of a year.
- Speed selector (×0.5 / ×1 / ×2) and name of the simulated month (`Intl.DateTimeFormat(lang, { month: 'long' })`): same mechanism as `bird-migrations`.
- Tooltip refreshed on each frame as long as a cell is hovered or pinned; removed if the cell drops to zero in the current simulated month.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the other visualizations on the site.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom`, tooltip triggered by `click` rather than `pointermove` on touch, same mechanism as `bird-migrations`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `month` | Whole month, from 1 (January) to 12 (December) | Playback running |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole of North America |

- **Time position rounded to the month:** the simulated time is a fractional day, but the indicator only displays the month name and the data is monthly (see "Animation" above). `month` is the month displayed at the moment of the pause. A link carrying `month` opens the map paused on the first day of that month, where the interpolation is zero: the image shows exactly that month's counts. It may therefore differ slightly from that of the visitor who shared it, if they paused at the end of the month (interpolation already advanced toward the following month), but the displayed month is the same. A day of the year would have reproduced the image down to the pixel, for a parameter that the interface exposes nowhere.
- `month` is written on pause and removed when playback resumes. No time slider in this visualization.
- The pinned tooltip is not captured (transient state).
