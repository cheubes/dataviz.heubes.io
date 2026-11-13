# Technical specifications: The Orbital Rush

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: implemented.**

## Data source

CelesTrak SATCAT, full catalog in CSV format (`https://celestrak.org/pub/satcat.csv`, see "Source dataset" and "Preprocessing" in `data-model.md` for the choice of this format over `records.php`). One-off retrieval at preprocessing time, not at every build (see "Rules common to all visualizations" in the general `technical-specifications.md`): in line with CelesTrak's usage policy, which discourages repeated requests and recommends retrieving data only when needed. Attribution citation (CelesTrak, USSPACECOM/Space-Track.org) in the page's source credit block (see "Source dataset" in `data-model.md` for the license decision).

## Rendering

**Canvas 2D, not SVG**, same choice as `bird-migrations` and for the same reason: a large number of points (20,020, see `data-model.md`), beyond the reach of performant SVG rendering.

- Globe: real Earth silhouette (continents/oceans, no country borders), `d3-geo` orthographic projection (`geoOrthographic`, `clipAngle(90)` to show only the visible hemisphere), on a dedicated background canvas. Unlike the initial choice (plain circle with a radial gradient, no geography), this canvas is now redrawn at every frame rather than only on resize, to carry the continuous rotation (see "Animation" below). Basemap `public/data/satellites-in-orbit/basemap.json`, TopoJSON object `land` (a single merged geometry) from the `world-atlas` package (Natural Earth data, public domain), converted to GeoJSON client-side via `topojson-client`: same source and same processing (reduction to the `land` object only) as the `bird-migrations` basemap, retrieved independently for this visualization rather than shared between the two (each visualization has its own data under `public/data/<viz-slug>/`, see "File structure" in the general `technical-specifications.md`). 92 KB.
- Swarm of points: foreground canvas, overlaid on the globe canvas. Unlike `bird-migrations` (moving points with a trail effect), the points here are static once they have appeared: no need to clear/redraw the whole swarm at every frame. Each new point (a satellite whose simulated launch date has just been reached) is simply painted over the existing canvas. A region filter change, a manual move of the year slider (see "Year slider" below) or a pass restart (see "Animation" below) clears the foreground canvas and rebuilds the already accumulated swarm in a single pass before resuming frame-by-frame accumulation. The halo of points does not follow the globe's rotation (see "Point positioning" below): the two canvases are animated independently, only the globe one rotates.
- D3 used for computations (categorical color scale per region via `d3-scale`, time scale for the animation, geographic projection and path drawing via `d3-geo`, animation loop via `d3-timer`), not for DOM rendering of the points or the continents.
- Globe colors, decorative, outside the dataviz palette (see "Palette" below for the distinction with the regions' categorical palette): ocean `#b7c2ca`, continents `#c7c0a8`, outline `#8b959c`, neutral and desaturated tones, chosen so that the swarm's brightly colored points remain the only saturated element of the composition.

## Point positioning

No real orbit is represented (explicit decision, see scoping discussions): each satellite occupies a position in a halo around the globe, not its real orbital position.

- Angle: drawn uniformly between 0 and 360°.
- Radius: drawn within a fixed band beyond the globe's radius (e.g. between 1.15 and 1.6 times the globe's radius), to give the swarm a sense of depth without carrying any orbital meaning (no correspondence with real altitude).
- Deterministic draw, derived from the satellite's index in `satellites.json` (e.g. a pseudo-random generator with a fixed seed) rather than a true `Math.random()`: the layout stays identical between a page load and a pass restart (see "Animation" below), no redraw at every loop.
- Fixed position in the screen's frame of reference, independent of the globe's rotation (see "Rendering" above): a point does not follow the underlying continental silhouette as it rotates, consistent with its position carrying no orbital meaning.

## Animation

- `d3-timer` loop, driven by a continuous simulated date (not a cyclic day counter like `bird-migrations`: here the scale covers the entire dataset, from the first launch (Vanguard 1, March 17, 1958, see `data-model.md`) to the most recent one).
- Mapping from elapsed playback time → simulated time, linear over the full scale of covered years (`d3-scale`, `scaleLinear`, domain in elapsed playback milliseconds, range in dates). Duration of a full pass at Normal speed: 25 seconds (checked visually during implementation, see "Playback speed" below for the other two speeds).
- **Continuous looping:** unlike the initial choice (single pass, stopping at the most recent date), the animation loops continuously like `bird-migrations`, an explicit decision by the user. Unlike `bird-migrations` (seasonal cycle, "naturally" smooth loop), the 1958 → today pass has no natural join with its own restart: a 2.5-second pause is held on the final state (complete swarm, counter at the total) before clearing the canvases and starting a new pass from 1958, so that this state reads as a culmination rather than cutting abruptly from "today" to "1958".
- **Playback speed:** Slow (×0.5), Normal (×1, default), Fast (×2), same mechanism as `bird-migrations` (`SPEED_FACTORS`, multiplies the playback time accumulated per frame). Changes only the duration of a pass (12.5 to 50 seconds) and of the end-of-pass pause; no effect on the globe's rotation (below), which is paced independently.
- **Globe rotation:** ambient and decorative, at a fixed speed (~3°/second, one full turn roughly every two minutes), not cyclic in the strict sense of "Continuous looping" above since it never restarts from zero. Frozen by Play/Pause together with the rest of the animation (see "Accessibility" in `functional-specifications.md`).
- At each frame, all satellites whose `launchDate` has now been reached and that have not yet been painted are added to the foreground canvas (see "Rendering" above); since `satellites.json` is sorted by ascending date (see "Validation constraints" in `data-model.md`), a simple index cursor is enough, with no full traversal of the array at every frame.
- Simulated year displayed via `Intl.DateTimeFormat(lang, { year: 'numeric' })`, like the simulated month in `bird-migrations`.

## Year slider

Native `<input type="range">` element, same choice as `light-pollution` and `monument-layers` (see "Year slider" in their respective `technical-specifications.md`): no complex interaction to handle, native semantics and keyboard accessibility are enough (see "Accessibility (known limitation)" in `functional-specifications.md`). Bounds `[year of the first retained satellite, year of the last]`, computed from `launchMs` rather than hard-coded. No `<datalist>` of tick marks, unlike `light-pollution`: like `monument-layers`, the range is continuous (every year between the two bounds is a valid position on an accumulation), with no small set of "reference" years to materialize as notches.

Yearly granularity rather than the actual (daily) precision of `launchDate`, consistent with the year indicator displayed elsewhere (above): a binary search (`cursorForYear`) finds the index of the last satellite whose `launchMs` falls no later than December 31 of the chosen year, in the `satellites` array sorted by ascending `launchMs` (see "Validation constraints" in `data-model.md`).

Like the `monument-layers` slider, and unlike the `light-pollution` one (which recolors a frozen state, with no notion of history), this one drives an accumulation: moving it implies being able to go backward, which a simple index cursor advance (the per-frame animation loop, monotonic) does not allow. A dedicated function (`seekToCursor`) recounts the satellites per region from the start and rebuilds the foreground canvas in one pass, same mechanism as `rebuildForeground` (see "Rendering" above) rather than incremental drawing.

- **Interruption by the manual slider:** the slider's `input` event sets `playing` to `false` (same convention as `light-pollution` and `monument-layers`), to prevent autoplay from moving the slider while the visitor is handling it. `playedMs` is recomputed by inverting the time scale (`simTimeScale.invert`), so that resuming autoplay continues from the chosen position rather than jumping elsewhere.
- Moving the slider to its maximum value triggers the same `holding` state (pause before looping, see "Animation" above) as the animation naturally reaching its end; since `playing` is set to `false` by the scrub, however, the pause does not progress until the visitor restarts playback (same behavior as `monument-layers`).

## New dependencies

None: `d3-scale`, `d3-timer`, `d3-geo` and `topojson-client` are already project dependencies (introduced by `bird-migrations`, see its own `technical-specifications.md`), reused here without any addition to `package.json`.

| Dependency | Usage in this visualization | Scope |
|---|---|---|
| `d3-scale` | Categorical color scale per region (`scaleOrdinal`), time scale (`scaleLinear`) | Scoped to this visualization (Astro island) |
| `d3-timer` | Animation loop (`timer`, wrapper around `requestAnimationFrame`) | Same |
| `d3-geo` | Orthographic projection of the globe (`geoOrthographic`), drawing of the globe and continents on canvas (`geoPath`) | Same |
| `topojson-client` | Conversion of the TopoJSON basemap → GeoJSON client-side | Same |

Unlike `bird-migrations`, no `d3-zoom` or `d3-selection` here: no zoom/pan on the globe (see "Interactions" in `functional-specifications.md`, no interaction of this kind planned).

## Palette

**Documented exception to the general dataviz palette rule** (see "Dataviz palette" in `style-guide.md`): the swarm is a layout in which all points can touch each other ("scatter plot" type), which normally guarantees only three hues that remain distinguishable under color blindness. This visualization nevertheless uses the first five slots of the categorical palette, an explicit decision by the user (see scoping discussions), offset by:

- an always visible legend (color + region name, not color alone);
- the region filter (see "Interactions" in `functional-specifications.md`), which makes it possible to isolate one or more regions at a time to remove any hue ambiguity.

| Slot | Hue | Region |
|---|---|---|
| 1 | Blue | United States |
| 2 | Orange | Russia / USSR |
| 3 | Aqua | China |
| 4 | Yellow | Europe |
| 5 | Magenta | Rest of the world |

Assignment by order of appearance in `regions` (see "Output format" in `data-model.md`), same mechanism as `bird-migrations`.

This categorical palette applies only to the swarm's points: the colors of the globe itself (ocean, continents, see "Rendering" above) are outside its scope, just as the `#e4e2da` tint of the `bird-migrations` basemap is not a slot of the dataviz palette either: these are illustration colors, not colors encoding data.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as `bird-migrations` and `flower-phenology` (see "Hydration" in their respective `technical-specifications.md`): the actual mount (JSON fetch, Canvas initialization) is only triggered as it approaches the viewport.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. The background canvas (globe) and the foreground canvas (swarm) are resized together when the mount area is resized; the already accumulated swarm is rebuilt in a single pass after resizing rather than stretched (same relative positions, recomputed at the new radius).

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the shared mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `regions` | Identifiers of active regions (`us`, `russia-ussr`, `china`, `europe`, `other`), comma-separated; empty (`regions=`) for no region | All five regions active |
| `year` | Integer year between the year slider's bounds | Playback running |

- `regions`: unknown identifiers ignored; a non-empty list with no known identifier is invalid and leaves all five regions active. `regions=` restores the intended empty state (see "States" in `functional-specifications.md`).
- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying `year` opens the visualization paused, through the same path as a manual slider move (see "Year slider" above): the swarm is rebuilt up to December 31 of that year. A pause in the middle of a year is therefore restored at the end of that same year, consistent with the slider's yearly granularity.
- The globe's rotation is not captured: being decorative, it is not a framing chosen by the visitor (see "Animation" above).

## Decisions made during implementation

- Exact mapping of SATCAT `OWNER` codes to the five regions: established on the 106 distinct codes of the actual catalog, see "Geographic grouping" in `data-model.md`.
- Volume and file size: 20,020 objects, 892 KB, no compaction needed (see "Preprocessing" in `data-model.md`).
- Total animation duration: 25 seconds kept after visual check (see "Animation" above).
- Rereading of the exact text of the Space-Track.org user agreement: done (`space-track.org/documentation#/agreement`), confirms the reading adopted on the license (see "Source dataset" in `data-model.md`).
- Globe dressing (continents/oceans, rotation) and continuous looping: added after the first implementation (initially a plain globe with no geography and a single pass with no looping, see "Rendering" and "Animation" above), at the user's explicit request.
- Globe rotation speed (~3°/s) and duration of the end-of-pass pause (2.5 seconds): chosen by default and checked visually, without prior scoping discussion on these two exact values; to be adjusted if needed.
- Year slider added after the first implementation (which offered only Play/Pause and the speed selector), at the user's explicit request, on the model already established by `monument-layers` (continuous yearly slider, with a full rebuild of the swarm on a manual move) rather than that of `light-pollution` (recoloring a frozen state), the latter not applying to a progressive accumulation like this one.
