# Technical specifications: Where France Has Burned

Supplements the general `technical-specifications.md`: technical rules specific to this visualization, beyond the rules common to all visualizations.

## Rendering

Canvas 2D (`d3-geo` for the projection and point placement, `d3-zoom` for zoom/pan, `topojson-client` for the basemap), same stack as `monument-layers` and `paris-trees`. Confirmed on the actual volume measured during implementation (see "Measured statistics" in `data-model.md`): up to 4,356 fires displayed simultaneously in the most active year (2022), zoom/pan combined with variable-size points favors Canvas for the same reasons as in `monument-layers`/`paris-trees`.

## Basemap

Reuse of the silhouette basemap of `biodiversity` (`public/data/biodiversity/basemap.json`, copied to `public/data/forest-fires/basemap.json`), same Mercator projection, same illustration colors as the site's other Canvas maps (`#e4e2da` for the silhouette, `#acb2b8` for its outline, see "Basemap (illustration)" in `style-guide.md`; not `--dv-surface`, a correction made to this spec after implementation: that variable is white, it is not the illustration tint reused by `biodiversity`/`monument-layers`/`paris-trees`). No rivers or road network (see "Preprocessing" in `data-model.md`), unlike `monument-layers`.

## Palette

Fire point in a fixed hue, reusing slot 2 of the categorical palette (orange, `#eb6834`, see "Dataviz palette" in `style-guide.md`) as an illustration color for the subject rather than as the encoding of a data category (a single mark type displayed at a time, no series to distinguish by color): same logic as the blue rivers of the basemap, a fixed hue associated with the subject rather than an encoded data value. Light value only (the site has no active dark theme, see "Colors" in `style-guide.md`). No new color value introduced, in line with the project rule (see "Dataviz palette" in `style-guide.md`).

## Point size

Radius proportional to the square root of `burntArea` (area convention, not radius): `d3.scaleSqrt().domain([0, maxBurntArea]).range([1.5, 32])` (in pixels, fixed on-screen size independent of the zoom level, same convention as `monument-layers`), `maxBurntArea` being the actual maximum of the dataset (125,520,000 m², the Landiras fire in 2022). Calibrated on the actual distribution of areas (see "Measured statistics" in `data-model.md`, median 0.1 ha): the 1.5 px floor keeps the very numerous small fires visible and clickable, the 32 px ceiling prevents the Landiras fire from covering a disproportionate portion of the map. Displayed in hectares (`burntArea / 10000`), the unit used by the BDIFF site itself on its individual records (not the storage unit in `fires.json`, see "Output format" in `data-model.md`); up to two decimals in a fire's detail card (a value with 0 decimals would display "0 ha" for half the fires in the dataset, median 1,000 m²), no decimals for the annual total displayed in the control bar.

## Animation

Year slider driven by `d3-timer`, same discrete convention as `light-pollution` (no continuous morphing): each year step replaces all displayed points with those of the corresponding year (no accumulation, see "Interactions" in `functional-specifications.md`), rather than a continuous accumulation like `monument-layers`. Same constants as `light-pollution` (`STEP_MS` 900, `HOLD_MS` 2,000 pause on the last year before looping back to 2006): twenty years to go through (2006-2025) rather than thirteen in `light-pollution` does not justify a different pace. Three speeds (Slow/Normal/Fast, "Normal" by default, same `{ slow: 0.5, normal: 1, fast: 2 }` factors as the rest of the site).

Since `fires.json` is sorted by ascending `year` (see "Validation constraints" below), the index range of each year is computed once at mount (binary search by year), not rebuilt at each frame.

## Zoom/pan

`d3-zoom`, same controls as `monument-layers`/`paris-trees`: free zoom/pan with the mouse (wheel, drag) and by touch (pinch, drag), doubled by zoom in/zoom out/reset buttons (`ZOOM_BUTTON_STEP` 1.5, same value) overlaid on the map, disabled at the bounds `[1, 200]`. `MAX_ZOOM` 200, not 1,000 like `monument-layers`: the latter calibrates its maximum zoom on its cumulative display (up to 37,661 monuments visible simultaneously at the end of the sweep, including several in the same municipality); a year of fires peaks at a few thousand points, so separating nearby incidents requires a proportionally lower zoom factor. Checked visually during implementation (zoom at 200 on a dense area of the Mediterranean rim): points overlapping at country scale become distinguishable, no floating-point precision artifacts at this zoom level.

## Detail card

On hover (or tap) of a point, card displaying municipality (department in parentheses), date, burned area and suspected cause (see "Source fields used" in `data-model.md`), following the pointer. Pinned on click/tap to make the link to the official BDIFF record clickable (see "Link to the official record" in `data-model.md`), same mechanism as `monument-layers` (see "Detail card" in its `technical-specifications.md`): `pointer-events: none` on the card as long as it is not pinned (otherwise it would intercept moves/clicks meant for the underlying canvas), switched to `auto` once pinned.

## Accessibility (known limitation)

Animated map, zoom/pan and hovering over fires not natively accessible by keyboard or screen reader, limitation documented without fallback (see "Accessibility" in `functional-specifications.md`). Play/Pause, speed selector, year slider and zoom buttons remain standard HTML elements, keyboard accessible.

## Dependencies

`d3-geo`, `d3-zoom`, `d3-scale`, `d3-selection`, `d3-timer`, `topojson-client`: all already used elsewhere on the site (see `monument-layers`, `paris-trees`, `satellites-in-orbit`, `light-pollution`), no new npm dependency for this visualization.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Validation constraints specific to this visualization

- `fires` sorted by ascending `year` (see "Animation" above, and "Preprocessing" in `data-model.md`).
- Each `departmentCode` referenced in `fires` exists in `departments`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `year` | Integer year from 2006 to the most recent year available | Playback running |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole of France |

- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying it opens the map paused on that year, in line with the general rule: the paused frame (all of the year's fires) is meaningful in itself.
- A link or a slider set on the last year resumes playback, once restarted, with the brief end-of-pass pause before looping back to 2006 (see "Animation" above), rather than staying stuck on that year.
