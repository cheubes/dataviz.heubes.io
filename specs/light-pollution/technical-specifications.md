# Technical specifications: The Sky, Year by Year

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: implemented.**

## Data source

VIIRS VNL annual composites (NOAA Earth Observation Group), see "Source dataset" and "Preprocessing" in `data-model.md`. Mandatory citation (CC BY 4.0) in the page's source credit block.

## Rendering

**SVG, not Canvas**, same choice as `biodiversity`: very small volume (395 cells, see "Grid reuse" in `data-model.md`), far from the threshold that justifies Canvas in the site's other visualizations.

- Hexagonal grid: `d3-geo` to project the polygons (same geometries as `biodiversity/hexbins.json`, see "Grid reuse" in `data-model.md`, hence the same `d3.geoMercator()` projection with `fitExtent`, see "Rendering" in its `technical-specifications.md`).
- Basemap: silhouette of mainland France, `public/data/light-pollution/basemap.json`, TopoJSON object `france` converted to GeoJSON client-side via `topojson-client`. File identical to that of `biodiversity` but **duplicated** rather than shared (see "Grid reuse" in `data-model.md`): each visualization retrieves its own data under `public/data/<viz-slug>/`, same rule and same choice as `satellites-in-orbit` with respect to `bird-migrations`.
- Year change (slider, manual or automatic): recolors the 395 existing SVG paths (update of the `fill` attribute according to the cell's `byYear[year].scale` value), no redrawing of the geometries themselves.
- **Compact mount area** (revised during review): map height lower than the mount areas of the other visualizations at the time (`max(320px, width × 0.6)`); since the legend and controls are now above the map rather than overlaid (see "Content" in `functional-specifications.md`), nothing required reserving a generous map height to leave room for them anymore. This height calculation (since supplemented by a cap tied to the space available between header and footer) has become the default height of all the site's visualizations (see "Rules common to all visualizations" in the general `technical-specifications.md`).

Legend and controls (play/pause, speed, year slider): a single block placed before the map area in the DOM, in normal flow (`display: flex; flex-direction: column`), never `absolute`-positioned over the SVG; simpler than the first implementation (legend/slider overlaid on the map, with separate responsive handling to reposition them below the map on small screens, removed during review) and without the overlap bug it caused on mobile (the legend covered the top of the map).

## Palette

**Sequential** palette (see "Dataviz palette" in `style-guide.md`), same family of choice as `monument-layers`: the sky visibility scale is a continuous order (from the darkest sky to the most polluted), not categories to be told apart pairwise. No exception to document here, unlike `satellites-in-orbit` and `paris-trees`.

- Darkest level (preserved sky) in the lightest tint of the sequential scale, brightest level (heavily polluted sky) in the darkest tint: the opposite choice to `monument-layers` (where dark marked age): here dark marks the intensity of pollution, not a temporal progression carried by color (time is carried by the year slider, not by color, see "Interactions" in `functional-specifications.md`).
- **Same two end tints as `biodiversity`** (`#cde2fb` / `#0d366b`, steps 100 and 700 of `style-guide.md`), interpolated the same way (`d3-scale`, default RGB interpolation of a continuous scale) rather than taken as six distinct named steps from the table. Revised during review (see scoping discussions): a first version picked four intermediate named steps (200/300/400/550) directly from the style guide table, more saturated/distinct in the legend, but visually inconsistent with the continuous gradient of `biodiversity`, the site's other map of France using the same sequential palette. Deliberate trade-off: the intermediate tints lose a little distinctiveness in the legend, in favor of visual consistency between the two maps.
- `d3.scaleLinear<string>().domain([1, 6]).range(['#cde2fb', '#0d366b']).clamp(true)`: linear rather than `scaleSqrt` like `biodiversity` (whose `sqrt` compensates for a very skewed domain of raw counts, with no equivalent here: the domain is already an evenly spaced 1-6 ordinal rank).

## Raster preprocessing

See "Preprocessing" in `data-model.md` for the details of the steps. Notable point specific to this visualization: unlike the site's other preprocessing (one-off Node scripts), this one starts from a geospatial raster and requires a zonal statistics tool (`rasterio`/`rasterstats` in Python), used only once outside the build, not a project dependency (`package.json` unchanged by this choice, same logic as `h3-js` for `biodiversity`).

## New dependencies

No new dependency for the **project**: `d3-geo` (projection), `d3-scale` (`scaleLinear`, continuous gradient between the two end tints of the sequential palette, see "Palette" above), `d3-timer` (autoplay, see "Autoplay" below) and `topojson-client` (conversion of the TopoJSON basemap → GeoJSON, see "Rendering" above) are all already existing dependencies (`d3-timer` already used by `satellites-in-orbit` and `bird-migrations`, `topojson-client` by `biodiversity`, `bird-migrations` and `satellites-in-orbit`), only new to this visualization.

## Year slider

Native `<input type="range">` element rather than a custom component: no complex interaction to handle (no custom drag-and-release, no zoom), native semantics and keyboard accessibility are enough (see "Accessibility" in `functional-specifications.md`). An associated `<datalist>` marks each available year as a notch rather than a continuous slider. Driven both manually (drag/keyboard) and automatically (see "Autoplay" below): in both cases, only its value (`yearSlider.value`) and the `aria-valuetext` attribute are updated, the element is never recreated.

## Autoplay

Same approach as `satellites-in-orbit` (`d3-timer`, time delta measured between frames via `performance.now()` rather than the timer's `elapsed` argument, to be able to freeze progression cleanly when paused):

- **Time steps:** 900 ms per year at Normal speed (`STEP_MS`), modulated by `SPEED_FACTORS` (`{ slow: 0.5, normal: 1, fast: 2 }`, same values as `satellites-in-orbit`); a full pass (12 transitions) therefore lasts about 21.6 s at Slow, 10.8 s at Normal, 5.4 s at Fast.
- **End-of-pass pause:** a fixed 2 s on 2025 (`HOLD_MS`), independent of the chosen speed (same rationale as `satellites-in-orbit`: leave time to read the final state before restarting), before restarting at 2013.
- **Pause:** a simple `playing` flag checked at each timer frame; pausing freezes progression (and the ongoing end-of-pass pause, if any) without stopping or recreating the timer itself.
- **Interruption by the manual slider:** the year slider's `input` event sets `playing` to `false` (and resets the ongoing end-of-pass pause), to prevent autoplay from moving the slider while the visitor is handling it.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the shared mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `year` | Year available in `skybins.json` (2013 to 2025) | Playback running |

- `year` carries the year itself, not the slider index (`yearSlider.value`), so that a link remains readable and survives the addition of a year to the dataset.
- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying `year` opens the map paused on that year.
- A link or a slider set to the last year resumes playback, once restarted, with the brief end-of-pass pause (`HOLD_MS`) before looping back to 2013, rather than staying stuck on that year.
- No framing to capture (fixed map, see "Interactions" in `functional-specifications.md`), nor any filter. The pinned detail card is not captured (transient state).

## Decisions made during implementation

Answers to the points left open by the scoping draft:

- **Actual continuity of the VIIRS VNL composites:** confirmed. v2.1 (2013-2021) and v2.2 (2022-2025) share the same "Annual VNL V2" methodology (EOG publishes this product in versioned annual increments, no algorithm change between the two, unlike the V1→V2 break); no artificial discontinuity observed at the 2021/2022 junction in the resulting series (see "Source dataset" in `data-model.md`). The sharp break observed in the series lies between 2022 and 2023, within the same version, consistent with a real phenomenon rather than a processing artifact (see "Editorial angle" in `functional-specifications.md`).
- **Radiance → level conversion method:** deliberate, documented simplification (not a rigorous Bortle classification, which would require atmospheric propagation modeling out of reach here), six levels calibrated on the actual distribution observed after zonal aggregation, see "Sky visibility scale" in `data-model.md`.
- **Feasibility of download/processing:** confirmed, but heavy: manual download by the user (~4 GB compressed in total, EOG accounts required), zonal processing in Python (`rasterio`/`rasterstats`) in a few minutes once the files are available locally. See "Preprocessing" in `data-model.md`.
- **Geometries of `biodiversity/hexbins.json`:** confirmed usable as is (same 395 cells, same `h3` identifiers, same polygons).
