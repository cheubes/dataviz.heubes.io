# Technical specifications: The Migration Routes

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Map technology

D3 v7 only, no Leaflet (see scoping discussions: consistency across the three visualizations, no dependency on a third-party tile server at runtime).

- **Basemap:** worldwide land silhouette (`public/data/bird-migrations/basemap.json`, see "Preprocessing" in `data-model.md`), TopoJSON `land` object (a single merged geometry, without country borders) from the `world-atlas` package (Natural Earth data, public domain), converted to GeoJSON client-side via `topojson-client`. No clipping to the Europe/Africa outlines alone: the projection is framed on this area (see "Projection" below), the rest of the world exists in the data but overflows outside the visible frame on the sides.
- **Projection:** `d3.geoNaturalEarth1`, framed via `fitExtent` on a geographic rectangle (lng -25 to 45, lat -36 to 68) covering Europe (up to Scandinavia) and Africa. Northern bound raised from 55 to 68° to include the actual breeding grounds of the species added after the stork (see "History" in `data-model.md`).
- **Mount area proportions:** the geographic rectangle above is much taller than it is wide (width/height ratio ≈ 0.59 under this projection), but the mount area height follows the site's default height (see "Rules common to all visualizations" in the general `technical-specifications.md`), not a pixel-perfect fit to this ratio (which would require a height ≈ 1.7 times the width, disproportionate within the site layout): a compromise in favor of a short map rather than a widescreen framing or full fidelity to the geographic ratio, at the cost of an extra band of sea/desert visible on either side of Europe and Africa.
- **Pitfall encountered:** the framing rectangle passed to `fitExtent` must be a **clockwise** ring (North, East, South, West starting from the southwest corner). A counterclockwise ring (the standard GeoJSON RFC 7946 convention) is interpreted by d3-geo as "everything except this rectangle" and frames the whole world instead of the intended area: silent, with no error, to watch out for if this rectangle is modified.
- **Rivers (v5):** `public/data/bird-migrations/rivers.json` (see "Rivers (basemap)" in `data-model.md`), raw `MultiLineString` geometry, **worldwide coverage** (not just the Europe/Africa framing rectangle, see "Basemap" above for the same remark about the silhouette), drawn on the background canvas within the same clip as the land silhouette (`ctx.clip()` on the `landFeature` path, before any relief or river drawing, see "Relief" below), color `#a8c5da`, width `1.5px` divided by `transform.k` to stay visually constant when zooming: same color and same treatment as the rivers of `paris-trees`/`monument-layers`, no geographic filter or curation by name (see "Rivers (basemap)" in `data-model.md` for the reason).
- **Relief (v5):** `public/data/bird-migrations/relief.webp`, pre-tinted raster image (see "Relief (basemap)" in `data-model.md`), drawn on top of the silhouette's flat fill and under the rivers, within the same clip. See "Relief: alignment on resize" below for the technique used to align it with the dynamic projection: the site's first raster asset, unlike the other three maps (100% vector silhouette).

## Trajectory rendering

**Canvas 2D, not SVG**, unlike biodiversity and phenology. Decision made in anticipation of a potentially large volume of trajectories (see scoping discussions); the chosen dataset (32 trajectories, ≈ 1900 points in total across all species, see `data-model.md`) remains light, but the Canvas choice is kept for implementation consistency and its headroom for growth if other species are added.

- D3 is still used for computations (geographic projection, interpolation along a trajectory via `d3.geoInterpolate`, color scale per species via `d3-scale`), not for DOM rendering of the trajectories themselves.
- Two stacked canvases: a background canvas (land silhouette, redrawn only on resize or zoom) and a foreground canvas (trajectories), so that the trail effect applies only to the latter without re-rasterizing the background at each frame.
- Trail effect: at each frame, a semi-transparent rectangle is applied to the foreground canvas with `globalCompositeOperation = 'destination-out'` (progressively erases toward transparency rather than painting an opaque color on top), then the new segment is drawn on top.
- The tooltip (a DOM element, not the map itself) remains standard HTML, overlaid on the Canvas.

## New dependencies

| Dependency | Usage | Scope |
|---|---|---|
| `d3-geo` | Projection (`geoNaturalEarth1`), basemap drawing (`geoPath`), interpolation along a route (`geoInterpolate`) | Scoped to this visualization (Astro island) |
| `d3-scale` | Categorical color scale per species (`scaleOrdinal`) | Same |
| `d3-timer` | Animation loop (`timer`, wrapper around `requestAnimationFrame`) | Same |
| `d3-zoom` | Pan/zoom (mouse and touch) on the map | Same |
| `d3-selection` | Required by `d3-zoom` to attach to the canvas (`select(canvas).call(zoom)`) | Same |
| `topojson-client` | Client-side conversion of the TopoJSON basemap → GeoJSON | Same |

The basemap itself (`basemap.json`) is a committed static file (see `data-model.md`), not an npm dependency: `world-atlas` is not added to `package.json`; its `countries-110m.json` file was retrieved once via the jsDelivr CDN then reduced to its `land` object alone. Same logic for the two v5 additions, `rivers.json` and `relief.webp` (see "Rivers (basemap)" and "Relief (basemap)" in `data-model.md`): committed static files, produced by one-off uncommitted scripts, no npm dependency added (the relief preprocessing script reuses `d3-geo`, already present, and `sharp`, already present as a transitive dependency of Astro, without adding it explicitly to the project).

## Palette

Official categorical palette (see "Dataviz palette" in `style-guide.md`). Four species (see "Study selection" in `data-model.md`), assigned in order of appearance in `species`:

| Slot | Hue | Species |
|---|---|---|
| 1 | Blue | White stork |
| 2 | Orange | Montagu's harrier |
| 3 | Aqua | Common cuckoo |
| 4 | Yellow | European honey buzzard |

The next slot (magenta) will apply in this order to the next species added; beyond eight species, revisit the grouping rather than adding a ninth hue (see "Dataviz palette" in `style-guide.md`). Unlike the flower calendar, a bird species' color carries no realistic meaning to preserve: the official palette applies here without exception.

## History of the northern framing

The framing (see "Projection" above) initially remained at lat -36/55, calibrated on the white stork alone (breeding grounds up to ~52°N): since the species added afterwards breed further north (Scandinavia/Finland), the northern portion of their trajectories projected above the visible frame. Widened to 68° at the explicit request of the user rather than left as an accepted limitation (see "Projection" above for the chosen bound and its effect on the mount area proportions).

When widening this framing, several Montagu's harrier trajectories appeared as aberrant straight segments crossing the entire map (previously cut off out of view by the old framing, hence invisible). This was not an artifact of the framing itself but a genuine pre-existing data quality problem, revealed by the new framing: see "Montagu's harrier" and "History" (v4) in `data-model.md` for the diagnosis (Argos Doppler resolution ambiguity) and the fix.

## Relief: alignment on resize

`relief.webp` (see "Relief (basemap)" in `data-model.md`) is a static image, pre-rendered once during preprocessing. The actual mount area, however, changes width/height at every window resize, which recomputes `projection.fitExtent()` on a different rectangle each time (see "Projection" above). A raster image cannot reproject itself on the fly the way `d3-geo` does for the silhouette and the rivers (vector paths, natively reprojected at each frame by `path()`).

**Chosen solution: an affine repositioning of the entire image rather than a runtime reprojection.** `fitExtent` computes a scale and a translation that "contain" a given geometry within a target rectangle while preserving its proportions (a `contain`, never a `stretch`): for the same geometry (`viewBounds`), two calls to `fitExtent` on two different rectangles can therefore only differ by a uniform affine transformation (a scale plus a translation) between their two results, whatever the width/height ratio of each of the two rectangles. `resize()` exploits this property:

1. A first call to `fitExtent()` on the reference rectangle (the one used during preprocessing to calibrate the scale, `RELIEF_REF_WIDTH`/`RELIEF_REF_HEIGHT` in `render.ts`, 2600 × 4348 px, the Europe/Africa rectangle itself, **not** the full extent of `relief.webp`, see next point) captures the reference scale and translation (`refScale`/`refTranslate`).
2. A second call on the actual mount area rectangle (the one used for all the rest of the rendering) leaves the projection in its actual state and gives the actual scale and translation.
3. The ratio of the two scales gives `reliefScale`; the difference between the two translations, weighted by this ratio, gives the anchor point of the reference frame within the actual frame.
4. `drawBasemap()` then positions the entire image in one go, without any pixel-by-pixel recomputation: `basemapCtx.drawImage(reliefImg, reliefOffsetX, reliefOffsetY, reliefImg.naturalWidth * reliefScale, reliefImg.naturalHeight * reliefScale)`.

This recomputation happens at each resize (negligible cost, a second `fitExtent` is still a geometric bounds calculation, not a render), never per frame; zoom/pan (`d3-zoom`) then applies uniformly to the whole scene (silhouette, relief, rivers, trajectories) via the same Canvas transformation (`translate`/`scale` from `transform`), hence with no additional recomputation specific to the relief.

**`relief.webp` covers the entire land silhouette, not just the Europe/Africa reference rectangle** (see "Worldwide coverage" in `data-model.md`): its pixel (0,0) therefore does not correspond to the corner of the reference rectangle, but to an offset point (`RELIEF_ORIGIN_X`/`RELIEF_ORIGIN_Y` in `render.ts`, = (-5523, -496) in the reference rectangle's frame, both negative since the Americas and Asia/Oceania overflow far to the left of and above this rectangle under this projection). `reliefOffsetX`/`reliefOffsetY` (step 3 above) therefore take this offset into account: `reliefOffsetX = liveTranslate[0] - reliefScale * (refTranslate[0] - RELIEF_ORIGIN_X)` (and the equivalent in Y) rather than the simpler formula `liveTranslate[0] - reliefScale * refTranslate[0]`, which would suffice if the image covered exactly the reference rectangle: equivalent to shifting `refTranslate` by this origin before applying the same affine relationship.

**Potential pitfall to watch out for:** `RELIEF_REF_WIDTH`/`RELIEF_REF_HEIGHT`/`RELIEF_ORIGIN_X`/`RELIEF_ORIGIN_Y` (in `render.ts`) must remain strictly identical to the values used by the preprocessing script that generated `relief.webp`, and `viewBounds` must remain strictly identical on both sides (same risk as the framing "Pitfall encountered" above). A divergence between the two produces neither an error nor a warning, only a relief visually misaligned with the silhouette's coastline. If `viewBounds` is modified one day (a new widening of the northern framing, for example, see above) or if the silhouette (`basemap.json`) changes, `relief.webp` must be regenerated with the same preprocessing script (the image's origin and dimensions depend directly on them, see "Relief (basemap)" in `data-model.md`).

## Animation

- `d3-timer` loop, driven by a simulated time in days (0-365, cyclic). A complete calendar cycle lasts 36 seconds at "Normal" speed (see "Interactions" in `functional-specifications.md`), 72 s at "Slow" (×0.5), 18 s at "Fast" (×2).
- Each trajectory is split by day of the year (see "Preprocessing" in `data-model.md`, unwrap already done on the data side); at each frame, an individual's current position is interpolated between its two surrounding points via `d3.geoInterpolate` (interpolation along the great circle, not a simple linear lat/lng average).
- The speed selector changes the advance factor of the simulated time, not the animation's refresh rate (always paced by `requestAnimationFrame` via `d3-timer`).
- Name of the simulated month displayed via `Intl.DateTimeFormat(lang, { month: 'long' })` rather than a custom array of labels: FR/EN localization for free.

## Static view

Second display mode (see "View toggle" in `functional-specifications.md`), sharing the foreground canvas and the species/direction filtering logic with the animated view rather than duplicating the rendering.

- **Switching to "Static":** stops the `d3-timer` loop (`timer.stop()`) rather than letting it run idle: no unnecessary computation or rendering while the static view is displayed. The foreground canvas is cleared (full `clearRect`, not the progressive erasure of the trail effect) then each active trajectory is drawn in a single pass, from the first to the last point (successive `lineTo` calls on the projected points), with no time interpolation: the static view has no notion of simulated time.
- **Autumn/spring distinction:** `context.setLineDash([6, 4])` for spring trajectories, solid line (`setLineDash([])`) for autumn. No change of hue: the color remains the species code (see "Palette" above), the dashing carries the direction distinction.
- **Hover/tap in static view:** unlike the animated view (a single "head" position per trajectory, updated every frame), the static view must detect the cursor's proximity to any segment of the complete path. Each trajectory keeps its pixel path in memory (recomputed at each drawing, including after a zoom/pan); detection computes the point-to-segment distance (orthogonal projection bounded to the segment) for each segment of the path, and keeps the closest one below the tolerance threshold.
- **Switching to "Animated":** clears the stored pixel path of each trajectory, erases the foreground canvas, restarts the `d3-timer` loop (a new instance rather than a resumed one, to restart from a clean time delta and avoid a large animation jump due to the time spent in static view).
- **Redraw on filter or zoom change:** in the animated view, a filter change is automatically taken into account at the next frame; in the static view, with no active loop, each change (species checkbox, direction radio, zoom/pan) triggers an explicit redraw.
- **Historical note:** it was in the static view, where an entire route is drawn at once, that the poorly resolved Argos Doppler positions of the Montagu's harrier first became visible as long aberrant straight segments (see "History of the northern framing" above and "Montagu's harrier" in `data-model.md`): a genuine data quality defect, revealed by this view rather than caused by it, and corrected at the source since then.

## Hydration

`client:visible`, implemented by an `IntersectionObserver` on the mount area (no `client:*` directive available: the site chrome uses no UI framework, see "JavaScript and visualizations" in the general `technical-specifications.md`): the actual mounting (data fetch, Canvas initialization) is triggered only when approaching the viewport.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom` (pinch to zoom, drag to move, natively supported by this module with both mouse and finger); tooltip triggered by `pointerdown`/`click` rather than `pointermove` when `event.pointerType === 'touch'`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `species` | Species identifiers from `species` separated by commas (`white-stork,common-cuckoo`); empty (`species=`): no active species ("empty" state) | All species active |
| `direction` | `autumn`, `spring` | Both |
| `view` | `static` | Animated view |
| `day` | Simulated day, integer from 0 (January 1) to 364 | Playback in progress |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Entire Europe/Africa area |

- **`day` follows the general temporal position rule, without the `earthquakes` deviation:** when paused, the trails fade but the head of each trajectory active on that day remains drawn, so the paused image does show where each bird is. `day` is written on pause (Play/Pause button) and removed on resume; a link carrying `day` opens the animated view paused on that day (button set to "Play", `aria-pressed="false"`, month displayed). No time slider in this visualization, hence no writing on `change`.
- Whole-day precision: a simulated day lasts about 0.1 s at "Normal" speed, the restored position differs by less than a day from the one seen when paused.
- `day` stays in the URL in the static view: it is not visible there, but returning to the animated view resumes paused on that day (the pause survives the view change, see "Static view" above). A `view=static&day=…` link therefore restores both.
- Not captured, in addition to speed (general rule): the highlighting of an individual and its card pinned on tap, a transient selection just like a tooltip (in the animated view, the head that carries it disappears anyway as soon as the individual leaves its migration period).
- `species`: an unknown identifier is ignored; a list in which no identifier is known is ignored entirely (all species active).
