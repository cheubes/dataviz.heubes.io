# Technical specifications: Tomorrow's Medical Desert

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: implemented.**

## Data source

DREES (XLSX) and data.gouv.fr (TopoJSON) files, see "Source dataset" and "Preprocessing" in `data-model.md`. One-off retrieval and join at preprocessing time, not at each build.

## Rendering

**Canvas 2D**, the largest volume on the site to date (34,728 commune polygons). `d3.geoMercator()` projection with `fitExtent` on the full extent of the commune collection (`topojson-client`, `feature()`).

**Departure from the framing draft, on three points, all technical simplifications adopted after measuring the actual constraints:**

1. **Today/tomorrow toggle: two pre-rendered canvases with a CSS fade, not a per-commune color interpolation.** The draft considered `d3-interpolate` to animate each commune individually from one hue to the other, which would have required redrawing the 34,728 polygons at each frame of the transition (potentially dozens of times in a few hundred milliseconds). Instead: `canvasToday` and `canvasTomorrow` are each drawn only once on load (and on resize), stacked, and the toggle animates only the CSS opacity (`transition: opacity`) of the second over the first. The visual result (a progressive fade between the two states) is identical to what the functional spec asked for, at a much lower rendering cost (no polygon redraw during the transition itself).
2. **Hover/tap: index canvas by "color picking", not a point-in-polygon test.** Testing whether the cursor belongs to one of the 34,728 polygons at each mouse move (even with a grid spatial index like `paris-trees`) remained more costly than necessary. Instead: a third invisible canvas (`indexCanvas`), never transformed by zoom/pan, where each commune is filled with a unique color derived from its index in the array (`(r<<16)|(g<<8)|b`). Hover reads a single pixel (`getImageData(x,y,1,1)`) to retrieve the commune instantly, whatever the number of polygons: constant rather than linear complexity.
3. **Zoom/pan by CSS transform of the layer, not by redrawing at the projection.** The site's other map visualizations (`bird-migrations`, `monument-layers`...) recompute the projection and redraw on zoom. Here, the `d3-zoom` zoom drives a CSS transform (`translate`/`scale`) applied to a `<div>` wrapping the three canvases (today, tomorrow, visible index but not the hidden index canvas): no polygon redraw during zoom/pan, only a transform of the already-rendered bitmap. Each canvas is rendered at a resolution higher than the display (`RENDER_OVERSAMPLE = 2`, on top of `devicePixelRatio`) to stay sharp within the chosen zoom range (`scaleExtent [1, 8]`, narrower than the 1,000 of `monument-layers`: zoomed bitmap content degrades beyond a certain factor, unlike points redrawn at each frame). **Pitfall:** `d3-zoom` is attached to the stage (`dv-medical-deserts__stage`), which does not move, and not to the interaction canvas, which lives in the transformed layer. Attached to the canvas, it computed the pointer position relative to a box already translated and enlarged: once the map was zoomed, the wheel no longer kept the targeted point under the cursor and dragging moved the map only by a fraction of the mouse movement (divided by the zoom factor). A filter restricts gestures to the canvas, so that the zoom buttons placed on the stage do not trigger a pan.

## Palette

**Sequential** palette (see "Dataviz palette" in `style-guide.md`): the APL is a continuous order, not categories. `d3.scaleLinear<string>().domain([0, 1.5, 6.5]).range(['#eef5fc', '#3987e5', '#0d366b']).clamp(true)` (`d3-scale` alone, not `d3-scale-chromatic`, which would have been a new undiscussed dependency for an equivalent result). Domain set on the actual distribution measured during implementation (see "Actual distribution" in `data-model.md`), not on the raw maximum. Same domain and same scale used for both states of the toggle.

**Three-stop scale rather than a simple linear gradient, a per-visualization deviation from the style guide default** (see "Dataviz palette" in `style-guide.md`, documented deviation clause): a simple linear gradient over the whole `[0, 6.5]` domain places the editorial threshold of 1.5 (chosen to highlight the communes with the most degraded access to care) at only 23% of the gradient, not enough to make it stand out. Instead, the light extreme hue `#eef5fc` (barely lighter than step 100, `#cde2fb`, of the style guide, to remain visually distinct from `--dv-surface`, `#ffffff`, and avoid any confusion with a missing commune, see "Pitfall encountered and fixed" in `data-model.md`) is reached at 0, a saturated intermediate hue (`#3987e5`, step 400 of the style guide) at the 1.5 threshold, and the dark hue `#0d366b` (step 700, unchanged) at the top of the domain (6.5). The gradient is thus concentrated below 1.5 and gentler above, while remaining readable over the rest of the distribution (median at 2.84, see "Actual distribution" in `data-model.md`).

## New dependencies

| Dependency | Use | Scope |
|---|---|---|
| `d3-geo` | Projection, drawing of the commune polygons (`geoPath`) | Scoped to this visualization (Astro island) |
| `d3-scale` | Sequential color scale | Same |
| `d3-zoom` | Pan/zoom (mouse and touch), driven by CSS rather than by redrawing (see "Rendering" above) | Same |
| `d3-selection` | Required by `d3-zoom` to attach to the stage (see "Rendering" above, point 3) | Same |
| `topojson-client` | Conversion of TopoJSON → `Feature[]` usable by `d3-geo` | Same |

**`d3-interpolate` is ultimately not used** (see "Rendering" above, point 1) despite its presence in the framing draft.

## Progressive loading

`communes.json` (9.0 MB, see "File size" in `data-model.md`) is fetched via `fetch` then read as a stream (`response.body.getReader()`) rather than with a simple `.json()`: the actual progress (percentage of bytes received over `content-length`) feeds the loading indicator (see "States" in `functional-specifications.md`), the full body being parsed (`JSON.parse`) only once entirely received.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom`; detail card triggered by `pointerdown`/`click` rather than `pointermove` on touch.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `view` | `tomorrow` ("Sans les médecins de 65 ans et plus" state) | "Aujourd'hui" state |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole of metropolitan France |

- **Framing despite the CSS-transform zoom** (see "Rendering" above, point 3): the transformed layer has its origin at `0 0` (`transform-origin`) and its canvases have the dimensions of the map area, on which the projection is framed. The `d3-zoom` transform therefore maps the projection's pixels to those of the map area exactly as on the redrawn maps, and the common format applies without adaptation.
- The zoom buttons animate their transform (`transition`): the URL is written on the `end` event, at the end of the transition.
- `view=tomorrow` is applied before the map's first sizing, before any style computation of the canvases: the map opens directly in that state instead of playing the toggle's CSS fade on load.
