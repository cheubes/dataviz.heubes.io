# Technical specifications: Paris, Tree by Tree

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: implemented.**

## Data source

Paris Data's Opendatasoft API (`opendata.paris.fr`), datasets "Les arbres", "Arrondissements" and "Tronçons de voies", plus the Overpass API (`overpass-api.de`) for the course of the Seine and the national garden trees (the only two data sources on the site that do not come from Paris Data, see "Source dataset" in `data-model.md` for why). See "Source dataset" and "Preprocessing" in `data-model.md`. One-off retrieval at preprocessing time, not on every build (see "Rules common to all visualizations" in the general `technical-specifications.md`), despite the weekly update of the Paris Data source: consistent with a fully static site, data freshness is not a goal of this visualization.

## Rendering

**Canvas 2D, not SVG**, same choice as `bird-migrations` and `satellites-in-orbit`, here for a significantly larger volume (194,315 trees, versus ten to fifteen thousand for the satellites).

- Basemap: silhouette of the twenty arrondissements (`public/data/paris-trees/districts.json`, see "Preprocessing" in `data-model.md`), `d3.geoMercator` projection framed via `fitExtent`, drawn on a background canvas redrawn only on resize or zoom. **Decided during implementation:** `geoMercator` rather than `geoConicConformal`: over the small extent of Paris (less than 10 km from one edge to the other), the difference in distortion between the two projections is visually imperceptible; Mercator chosen for consistency with `biodiversity` (same `fitExtent` mechanism) and because it does not require calibrating standard parallels.
- **Map area height:** the site's default height (see "Rules common to all visualizations" in the general `technical-specifications.md`), not an adjustment to the actual geographic width/height ratio of Paris (≈ 1.87, derived from `geoBounds` on `districts.json`, corrected for latitude).
- **Street grid** (`public/data/paris-trees/streets.json`, added after a first review: the initial basemap, silhouette + arrondissement outlines only, was deemed too bare) **and the Seine** (`public/data/paris-trees/seine.json`, added right after the same feedback). Both drawn on the same background canvas, in the same coordinate frame as the silhouette, in this order: arrondissement fill, Seine (`#a8c5da`, 3 px, `lineCap`/`lineJoin: round` for a clean rendering at the ends and along the meanders), then street grid (`#f4f2ec`, 0.6 px) on top: the streets (and therefore the bridges) remain visible as they cross the river. Everything is **clipped to the union of the arrondissement polygons** (`ctx.clip()`) so that any overflow of either geometry never extends beyond the silhouette; the arrondissement outlines are then redrawn in a separate, unclipped pass (a clip would have cut off the outer half of the outline stroke). Purely decorative: no interaction, no data derived from these files (see "Validation constraints" in `data-model.md`, unchanged). At the scale of all of Paris with all genera active, these two layers remain largely hidden by the density of the points (194,315 trees); they become clearly visible again as soon as you zoom to neighborhood/street level, or when few genera are active.
- Trees: foreground canvas, one filled circle per tree. Static points (no movement, unlike `bird-migrations`): no trail effect, a full redraw of the foreground canvas is enough on every filter, search or zoom/pan change.
- Point radius: square-root scale (`d3.scaleSqrt`) on `circumferenceCm`, so that the area of the point (not its radius) is proportional to the circumference, the standard convention for proportional circles in cartography.
- Remarkable trees: distinct outline (e.g. a light halo or ring) in addition to the genus color, permanently visible rather than via a separate filter (see "Interactions" in `functional-specifications.md`).
- Search: non-matching trees switch to a reduced opacity rather than being removed from the rendering (see "Interactions" in `functional-specifications.md`); this implies a second drawing pass (non-matching trees first, matching ones on top) so that search results remain visible above the rest of the cloud.
- **Zoom buttons** (`+`/`−`/reset, see "Interactions" in `functional-specifications.md`), added after a review, moved to the top right (initially at the bottom right) during a later review: standard overlaid `<button>` elements, no new zoom mechanism: they call `zoomBehavior.scaleBy` (factor 1.5, no new parameter compared to `scaleExtent`) and `zoomBehavior.transform` (back to `zoomIdentity` for the reset), the two methods already used for zoom on click on an arrondissement. Transform change applied immediately, without an animated transition (consistent with the choice already made for zoom on click on an arrondissement, see "New dependencies" below: no `d3-transition` added). Disabled (`disabled`) at the bounds of `scaleExtent`.
- **National gardens** (`public/data/paris-trees/national-gardens.json`, see "Interactions" in `functional-specifications.md`), added after another review. Rendered on the same foreground canvas as the municipal trees, in the same drawing pass (`redraw()`), but after them: one hollow ring per tree (`stroke` without `fill`, fixed 3 px radius) rather than a solid disc colored by genus. **Color `#a5a4a0`, adjusted following user feedback**: a light gray, exactly halfway between `BASEMAP_FILL` (`#e4e2da`, the basemap) and `OTHER_COLOR` (`#666666`, the gray of the "Other" category), replacing the initial choice (a sienna hue outside the palette), still outside the eight slots of the categorical palette. **Deliberate decision, consistent with the refusal of a generated ninth/tenth hue for Birch and Cypress** (see "Palette" above): these ~3,000 points have, for the most part, neither a genus nor any other reliable attribute (see "Source dataset" in `data-model.md`), so it makes no sense to assign them a genus color on the same footing as the 194,315 municipal trees; the marker shape (ring, not disc) signals a different nature of data, not just a ninth category. Positions precomputed once per resize (`buildGardenPositions`, same mechanism as `buildSpatialIndex` for the municipal trees), but without an index grid: the volume (~3,000) is too low to justify one, a simple array traversed in full is enough for drawing as well as hovering. Checkbox **enabled by default, adjusted following user feedback** (initially disabled); takes part in none of the genus filter, search or visible tree counter computations (see "Interactions" in `functional-specifications.md`). Hover/click priority over the municipal trees when the box is checked, consistent with the visual stacking order (drawn on top).
- **Footnote on the national gardens, moved after a review**: the caveat text (partial coverage, approximate positions) is no longer a conditional text shown only when the box is checked, but a permanent `<p>` after the map, always visible whether the box is checked or not, with an `*` reference mark on the checkbox label (`<sup>` element) and at the start of the text.

- **"Empty" state message** (see "States" in `functional-specifications.md`): `position: absolute; inset: 0` over the foreground canvas, as on the site's other visualizations for this kind of message. **Corrected after user feedback** (bug spotted while testing the addition of the national gardens, then confirmed by the user in normal use): without `pointer-events: none` on this message, it silently intercepted every pointer event on the canvas underneath for as long as it was displayed, including the `d3-zoom` gesture (wheel zoom/pan, touch drag): a filter that accidentally emptied the genus selection made the map unresponsive to mouse/touch until at least one genus was re-enabled. Pre-existing limitation, shared with `bird-migrations` (same construction), not fixed there since no request was made for that visualization.

## Data format

**Parallel array encoding** ("structure of arrays"), not an array of objects (see "Output format" in `data-model.md`): at this volume (194,315 trees), repeating the field names in a classic JSON array of objects would significantly inflate the file size compared to arrays of homogeneous values, without changing the implementation complexity on the client side (indexing by position remains direct).

**Size measured during implementation:** 11.7 MB uncompressed, 2.2 MB compressed (gzip), an order of magnitude significantly higher than the site's other visualizations (`satellites-in-orbit`: a few hundred kilobytes; `bird-migrations`: 200 KB), expected given the volume. Compaction applied, beyond coordinates rounded to six decimal places: `genusId` encoded as a numeric index into `genera` rather than a string, and above all `commonName`/`genusLabel`/`species`/the search text deduplicated into a separate `species` table (1,093 distinct combinations for 194,315 trees, less than 1% unique values, see "Preprocessing" in `data-model.md`): this deduplication is what reduced the file size the most (24.2 MB before, 11.7 MB after), since the repetition of these strings across nearly 200,000 trees largely dominated the file weight. `developmentStage` and `domain` remain repeated raw strings (not indexed): their cardinality is already low (five and nine distinct values), gzip compresses them efficiently, and indexing them would have added an extra lookup table for a marginal gain. No binary format (typed arrays, protobuf...) adopted: the compressed size obtained remains consistent with the rest of the site (readable static data files), without justifying one.

`streets.json` (street grid, see "Rendering" above): 1.2 MB uncompressed, 391 KB compressed (gzip), an ancillary file, not subject to the same volume constraint as `trees.json`. `seine.json` (course of the river, including the branches around the islands): 10 KB, negligible. `national-gardens.json` (national garden trees): 105 KB, also negligible compared to `trees.json`.

## New dependencies

| Dependency | Usage | Scope |
|---|---|---|
| `d3-geo` | Projection, basemap drawing (`geoPath`) | Scoped to this visualization (Astro island) |
| `d3-scale` | Categorical color scale by genus (`scaleOrdinal`), point size scale (`scaleSqrt`) | Same |
| `d3-zoom` | Pan/zoom (mouse and touch), programmatic zoom on click on an arrondissement and via the zoom buttons (see "Rendering" above) | Same |
| `d3-selection` | Required by `d3-zoom` to attach to the canvas | Same |

No `d3-timer` here: unlike the site's two other visualizations with a large point volume, this one animates nothing ("free exploration" angle, no timeline to replay, see `functional-specifications.md`).

## Palette

**Documented exception to the general rule of the dataviz palette** (see "Dataviz palette" in `style-guide.md`), same decision as for `satellites-in-orbit` (see "Palette" in its `technical-specifications.md`): the map is a layout where points can touch, which normally only guarantees three hues distinguishable under color blindness. This visualization nevertheless uses the eight slots of the categorical palette for the dominant genera, an explicit decision of the user (see scoping discussions), compensated by:

- an always-visible legend (color + genus name, not color alone);
- the genus filter (see "Interactions" in `functional-specifications.md`), which allows isolating one or several genera at a time.

| Slot | Hue | Genus |
|---|---|---|
| 1-6 | Blue, orange, aqua, yellow, magenta, green | Plane tree, Horse chestnut, Lime tree, Maple, Japanese pagoda tree, Ornamental cherry (the six most frequent genera, see "Grouping by genus" in `data-model.md`) |
| 7-8 | Purple, red | Birch, Cypress (not among the eight most frequent genera, but added at the user's explicit request; see "Grouping by genus" in `data-model.md` for the decision, made after a second review) |
| - | Neutral gray (`--dv-ink-secondary`), outside the palette | "Other" (including Oak and Ash, moved to make room for Birch and Cypress) |

Assignment by order of appearance in `genera` (see "Output format" in `data-model.md`), same mechanism as the site's two other visualizations with a categorical palette.

**Ninth and tenth hues ruled out, a stricter constraint than anticipated in the first pass:** while discussing the addition of Birch and Cypress, the first option considered was to add them on top of the eight genera already in place (ten distinct genera in total). The project's dataviz skill is categorical on this point, beyond the rule of `style-guide.md`: *"A 9th series is never a generated hue — it folds into 'Other,' small multiples, or composite encoding"*: on a layout where all points can touch (scatter of points, a case already flagged above), this is not just a matter of graphic convention, separation under color blindness is no longer guaranteed regardless of how the hues are arranged. The user, informed of this constraint stricter than the one initially presented, decided to stay at eight slots (replacing two existing genera) rather than force a tenth hue.

## Search

Simple substring matching, case- and accent-insensitive, on the `searchText` field precomputed during preprocessing (see "Preprocessing" in `data-model.md`): no fuzzy search library added (`Fuse.js` or equivalent), the need (finding a species by its approximate name) does not justify this extra dependency at this stage.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations (see "Hydration" in their respective `technical-specifications.md`).

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom` (same mechanism as `bird-migrations`); detail card triggered by `pointerdown`/`click` rather than `pointermove` when `event.pointerType === 'touch'`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `genera` | Comma-separated genus identifiers from `genera` (`platanus,tilia`, `other` for "Other", see "Output format" in `data-model.md`); empty (`genera=`): no active genus ("empty" state) | All genera active |
| `search` | Text typed in the search field, as is (without leading/trailing spaces) | Empty search |
| `gardens` | `off` | National gardens displayed |
| `zoom` | `<k>,<lon>,<lat>` (common format) | All of Paris |

- `search` is written 500 ms after the last keystroke, by a timer distinct from the one (120 ms) that redraws the map: the map follows the typing, the URL only the settled input.
- `genera`: an unknown identifier is ignored; a list in which no identifier is known is ignored entirely (all genera active).
- The "Jardins nationaux" checkbox triggers no request (`national-gardens.json` is a local file, loaded in all cases): it is therefore part of the shared state.
- The click on an arrondissement and the zoom buttons go through `zoomBehavior.transform`/`scaleBy`, which also emit the `end` event: the framing they produce is written like that of a gesture.

## Points resolved during implementation

- The actual eight dominant genera and their associated common name: see "Grouping by genus" in `data-model.md`.
- Size of `trees.json` and compaction applied: see "Data format" above.
- Proportion of trees without valid coordinates: 0 (verified by aggregation, see "Preprocessing" in `data-model.md`); on the other hand, 11.4% of the source dataset turned out to be outside the geographic scope of the twenty arrondissements and was dropped for a different reason (see "Chosen scope" in `data-model.md`).
- Map projection: `geoMercator`, see "Rendering" above.

**Unvalidated known limitation:** the actual loading and first render times on a low-end mobile device could not be measured on a physical device during implementation; the progress indicator (see "States" in `functional-specifications.md`) is in place but its calibration remains indicative, to be adjusted if feedback from real-world use shows it to be necessary.
