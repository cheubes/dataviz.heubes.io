# Technical specifications: Layers of Heritage

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Data source

Dataset "Immeubles protégés au titre des monuments historiques" (data.gouv.fr / Ministry of Culture), see "Source dataset" and "Preprocessing" in `data-model.md`. One-off retrieval at preprocessing time, not on every build (see "Rules common to all visualizations" in the general `technical-specifications.md`), despite the weekly update of the source.

## Rendering

**Canvas 2D, not SVG**, same family of choices as `bird-migrations`, `satellites-in-orbit` and `paris-trees`: large number of points (37,661, see `data-model.md`).

- **Basemap:** silhouette of metropolitan France, `public/data/monument-layers/basemap.json` (copy of `public/data/biodiversity/basemap.json`, TopoJSON, 18 KB, see "Preprocessing" in `data-model.md`). `d3.geoMercator()` projection with `fitExtent` directly on the France geometry (`topojson-client` to convert the topology into a feature), same mechanism as `biodiversity`. Drawn on a background canvas, redrawn only on resize or on a change of zoom transform.
- **Rivers and road network** (`public/data/monument-layers/rivers.json`, `roads.json`, see "Preprocessing" in `data-model.md`): drawn on the same background canvas, within the same clip as the silhouette (France itself), same structure as the streets/Seine basemap of `paris-trees`: rivers first, roads on top (a road crossing a river remains visible), silhouette border drawn last, outside the clip. Blue tint for rivers (`#a8c5da`, same tint as the Seine of `paris-trees`), ochre tint for the road network (`#c9a97e`, more pronounced than the nearly invisible street color of `paris-trees`: this network (motorways and expressways, see "Preprocessing" in `data-model.md`) remains sparser than a dense urban grid and needs more contrast to be readable). Stroke widths `1.5px`/`1px` divided by `transform.k`, like the other strokes on this map, to stay visually constant when zooming. Both files, entirely derived from OpenStreetMap (see "Source dataset" in `data-model.md` for the history of successive revisions toward more precision), have grown significantly compared with their first version based on Natural Earth (see "Output format" in `data-model.md` for the sizes): no effect on rendering beyond the initial loading time and the memory taken up by these geometries, which take part in no per-frame computation (unlike the monument positions, see "Monuments" below); full page loading time measured during implementation at around one second in local development conditions despite the total data size (see "Points decided during implementation" below).
- **Monuments:** foreground canvas, base positions (before zoom transform) projected once per resize and indexed in a grid for hover (same mechanism as `paris-trees`, coarser grid: 37,661 points versus 194,315). Points are static once they have appeared (no movement): each new point (monument whose simulated construction year has just been reached) is painted on top of the existing canvas applying the current zoom transform, no full redraw on every frame. A change of protection filter, a change of zoom transform, a resize, a move of the year slider or the return to the base at the end of a pass (see "Animation" below) clears the foreground canvas and rebuilds the accumulation already reached in a single pass before resuming the frame-by-frame accumulation (same mechanism as `satellites-in-orbit`).
- **Zoom/pan:** `d3-zoom` attached to the foreground canvas (`d3-selection` required to attach it), same mechanism as `paris-trees` (transform applied to the drawing, never baked into the stored base positions). Backed by zoom in/zoom out/reset buttons (`ZOOM_BUTTON_STEP` 1.5, same values and mechanism as `paris-trees`: `zoomBehavior.scaleBy`/`.transform` applied via `d3-selection` rather than a manual recomputation of the transform), overlaid on the top-right corner of the map, disabled at the bounds `[1, MAX_ZOOM]`. `MAX_ZOOM` 1,000, not 40 as in `paris-trees` (user feedback, raised in two steps: 40 → 200 judged still insufficient → 1,000): the starting view covers the whole of metropolitan France (~1,000 km) rather than a single city, so a proportionally larger zoom factor is needed to reach a comparable ground scale (distinguishing nearby monuments within the same commune, or reading the detail of the road network, see above); verified during implementation that monuments overlapping at country scale are clearly distinguishable once zoomed to this bound, detail card and road network still readable, no floating-point precision artifact at this zoom level (the footprint of France being well within the range without precision loss of a double-precision Mercator projection).
- D3 used for computations (geographic projection, sequential color scale via `d3-scale`, animation loop via `d3-timer`, zoom via `d3-zoom`/`d3-selection`), not for DOM rendering of the points.

## Animation

**Two phases, decided with the user after measuring the actual distribution** (see "Points decided during implementation" below):

1. **Static base** (on mount, before the timer starts, then on each new pass): monuments with a strictly negative construction year (before year 0, 1,790 out of 37,661, see "Interpreting the construction century" in `data-model.md`) are painted all at once on the foreground canvas, with the index cursor advanced to the first monument with a year ≥ 0. Counter and period indicator reflect this state from the first render, no animated transition on this base.
2. **Animated sweep** (`d3-timer` loop): the cursor continues from the end of the base, driven by a continuous simulated year on a linear scale (`d3-scale`) from the domain `[0, most recent construction year kept]` (1950 at preprocessing time, see "Points decided during implementation" below for why this bound rather than `generatedAt`) to `[0, TOTAL_DURATION_MS]` (30,000 ms at normal speed), with the advance modulated by the selected playback speed (see "Playback speed" below). Continuous loop rather than a single pass (revised since the initial framing, see discussions with the user): at the end of the pass, a pause (`HOLD_AT_END_MS`, 2,500 ms, same mechanism and same duration as `satellites-in-orbit`) keeps the fully built map on screen before returning to the base and restarting a full sweep.

## Playback speed

Three speeds (Slow / Normal / Fast), same factors as `satellites-in-orbit` and `light-pollution` (`{ slow: 0.5, normal: 1, fast: 2 }`): multiplies the `playedMs` increment on each frame, changes neither the duration of the final pause (`HOLD_AT_END_MS`) nor the domain of the time scale. Native `<select>` element, same choice as the two other visualizations (see their `technical-specifications.md`).

Since `monuments.json` is sorted by ascending `constructionYear` (see "Validation constraints" in `data-model.md`), a simple index cursor is enough to determine the new points to paint on each frame, no full traversal of the array.

Displayed simulated period (see "Client-side derived fields" in `data-model.md`): recomputed only when it changes (like the year indicator of `satellites-in-orbit`), from the last monument painted (base included).

## Year slider

Native `<input type="range">` element, same choice as `light-pollution` (see "Year slider" in its `technical-specifications.md`): no complex interaction to handle, the native semantics and keyboard accessibility are sufficient (see "Accessibility" in `functional-specifications.md`). Bounds `[0, most recent construction year kept]` (see "Animation" above), not `[oldest year, ...]`: the ancient base is always displayed, the slider range covers only what it actually drives. No `<datalist>` of tick marks, unlike `light-pollution`: this range is continuous (1,950 possible years, each a valid position), without a small set of "reference" years to materialize as notches.

Unlike the `light-pollution` slider (which recolors a frozen state, with no notion of history), this one drives an accumulation: moving it implies being able to go backwards, which a simple index cursor advance (`revealOne`, used by the per-frame animation loop) does not allow. A dedicated function (`seekToCursor`, binary search in the sorted array to find the index corresponding to the chosen year) recounts the protections from the start and rebuilds the foreground canvas in one pass, same mechanism as `redrawForeground` (see "Rendering" above) rather than an incremental drawing.

- **Interruption by the manual slider:** the slider's `input` event sets `playing` to `false` (same convention as `light-pollution`), to prevent autoplay from moving the slider while the visitor is manipulating it. `playedMs` is recomputed by inverting the time scale (`simYearScale.invert`), so that resuming autoplay continues from the chosen position rather than jumping elsewhere.
- Moving the slider to its maximum value triggers the same `holding` state (pause before looping, see "Animation" above) as the animation naturally reaching its end; since `playing` is set to `false` by the scrub, however, the pause does not progress until the visitor restarts playback.

## Detail card

Added after the first implementation (user feedback, see "Link to the reference record" in `data-model.md`): link built client-side (`https://www.pop.culture.gouv.fr/notice/merimee/{reference}`) added as the last line of the existing card, `target="_blank" rel="noopener"` (same convention already used for the links of the source credit block in `[viz].astro`/`fr/[viz].astro`), color `--dv-gold` (the only accent color available on the dark background of the card, `--dv-header-bg`, consistent with its use elsewhere on the dark surfaces of the site, see "Colors" in `style-guide.md`).

**Toggling `pointer-events` according to the pinned state:** the card stays `pointer-events: none` on simple hover (it follows the pointer and disappears as soon as the mouse moves away, see "Hover/tap on a monument" in `functional-specifications.md`); a clickable link in this state would be unreachable anyway, the card closing before the pointer reaches it. Switched to `pointer-events: auto` only once pinned (`pinned`, on click/tap), so that the link becomes actually clickable; reset to `none` when the card closes (`hideTooltip`). Without this toggle, a click on the link would pass through the card to the underlying canvas and trigger its own point selection logic rather than activating the link.

## Palette

**Sequential** palette (see "Dataviz palette" in `style-guide.md`), not the categorical palette: an explicit decision by the user (see framing discussions), which avoids the problem encountered on `satellites-in-orbit` and `paris-trees` (too many categories for the eight guaranteed hues, requiring a documented exception) since no categorical dimension is color-encoded here.

- Blue base hue by default (steps 100/`#cde2fb` to 700/`#0d366b` of the style guide, same bounds as `SEQUENTIAL_BLUE` in `biodiversity/render.ts`): `scaleLinear<string>().domain([oldest year kept, most recent year kept]).range(['#cde2fb', '#0d366b']).clamp(true)`, domain computed over the whole dataset (ancient base included, mechanically compressed near the light bound given its extreme age compared with the rest of the domain, consistent with the "older = lighter" principle).
- Unlike `satellites-in-orbit` (categorical color by zone) and `paris-trees` (categorical color by genus), the color here does not serve as a filter: the available filter (nature of the protection, see "Interactions" in `functional-specifications.md`) is independent of the color.

## Dependencies

All already present in `package.json` (introduced by `biodiversity`, `paris-trees` and `satellites-in-orbit`), no new dependency for this visualization: `d3-geo` (projection, `geoPath`), `d3-scale` (sequential scale and time scale), `d3-timer` (animation loop), `d3-zoom` + `d3-selection` (pan/zoom), `topojson-client` (basemap).

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the other visualizations on the site.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom` (same mechanism as `bird-migrations` and `paris-trees`); detail card triggered by `pointerdown`/`click` rather than `pointermove` when `event.pointerType === 'touch'`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `protection` | `classe`, `inscrit` (`protection` identifiers in `monuments.json`) | Both |
| `year` | Whole year from 0 to the most recent construction year kept (bounds of the year slider) | Playback running |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole of France |

- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying it opens the map paused on that year, through the same path as the slider (see "Year slider" above), including the `holding` state at the maximum value: the paused image (the accumulation reached) is meaningful in itself.
- On pause, the year written is the simulated year rounded down to the integer, whereas the year indicator rounds it to the nearest: only rounding down exactly rebuilds the visible monuments (revealed as soon as `constructionYear` ≤ simulated year), the waves of each century being dated to the year `xx50` (see "Interpreting the construction century" in `data-model.md`). The year in the link may therefore differ by one year from the one displayed at the moment of the pause.

## Points decided during implementation

- **Actual distribution of monuments by century, measured on the full CSV (46,760 records):** very heavily concentrated on the second millennium (50% of the monuments kept date from after 1550, 90% from after 1150), with a very sparse long ancient and prehistoric tail (4.75% of monuments before year 0, back to -20,000). A strictly linear time scale over this entire range would have compressed the Romanesque/Gothic/Classical waves into a fraction of a second of the animation, with almost all of the playback time consumed by the nearly empty prehistoric tail. Resolved by the static base + animated sweep from year 0 described in "Animation" above (decision validated with the user).
- **Proportion of records dropped:** 19.46% in total (13.25% without a usable century or period label, 4.85% without valid coordinates, 1.23% outside metropolitan France, 0.11% without a usable protection type, 0.01% with an uninterpreted century format), details in "Measured statistics" of `data-model.md`.
- **Compatibility of the `biodiversity` basemap:** confirmed as is (same geographic extent, no content specific to `biodiversity` in the TopoJSON).
- **Size of `monuments.json`:** 7.92 MB uncompressed, ~1.25 MB compressed (gzip) for 37,661 monuments (6.98 MB / 1.1 MB before the addition of `reference`, see "Link to the reference record" in `data-model.md`), an order of magnitude below `paris-trees` (11.7 MB / 2.2 MB for 194,315 trees) despite a comparable schema, thanks to a smaller number of fields per monument. No compaction into parallel arrays adopted: the compressed size remains reasonable as is.
- **End bound of the animation:** the most recent construction year kept in the dataset (1950, corresponding to the 20th century) rather than `generatedAt` (2026, retrieval date): the dataset covers no construction more recent than the 20th century (see the description of the Mérimée source), extending the sweep to `generatedAt` would only add 76 years of final silence without any new point.
- **Total duration of the animated sweep:** 30,000 ms, a little longer than `satellites-in-orbit` (25,000 ms) given the number of points and the number of chronological waves to distinguish once the ancient base and the sweep are refocused on year 0 to 1950 (see "Animation" above); a comfort value chosen during implementation, not measured through a user test.
- **Displayed period label:** computed client-side rather than carried by `monuments.json` (see "Output format" in `data-model.md` for why); format chosen for a numeric century: Arabic numerals ("16e siècle" / "16th century"), rather than the Roman numerals illustrated in the initial framing draft ("XIIe siècle"), simpler to produce correctly in both languages (English ordinal suffixes 1st/2nd/3rd/nth), and consistent with the already abbreviated format of the source (`Format_abrege_du_siecle_de_construction`, e.g. "16e s.").
- **Overpass queries by relation or by administrative area, never by bounding rectangle:** a search for segments by rectangular footprint (`way["waterway"="river"](bbox France)` or `way["highway"="motorway"](bbox France)`) systematically fails by server timeout on an area as vast as the whole of France (observed on two distinct Overpass instances, for rivers as well as roads). Two workarounds depending on the type of geometry sought: for a river, the named relation (`relation["waterway"="river"]["name"="La Seine"]`) then its member segments (`way(r)`) responds within a few seconds, the API relying on its name/tag index rather than scanning the whole area; for the road network (no single relation per road type), the administrative area of France (`area["ISO3166-1"="FR"][admin_level=2]`) rather than a rectangle, the API this time relying on its precomputed administrative area index (response in 2-3 minutes per road type, slow but reliable, versus a rectangle that systematically fails after the maximum timeout of 180-220 seconds tested).
- **Evolution of the chosen road selection:** nineteen large cities targeted in a first version (Paris, Marseille, Lyon, Toulouse, Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille, Rennes, Reims, Toulon, Saint-Étienne, Le Havre, Grenoble, Dijon, Angers, Nîmes, selected by general renown, no strict population threshold), with the four types `motorway`/`trunk`/`primary`/`secondary` (75,794 segments over this restricted extent, rendering judged too cluttered) then restricted to `motorway`/`trunk` (8,147 segments). Then extended to the whole of France (user feedback: "sois plus précis sur les axes routiers"), keeping only `motorway`/`trunk`: 62,473 segments across the whole country remain lighter than the 75,794 of the first attempt limited to nineteen cities, while giving a road presence everywhere rather than in a sample of cities.
