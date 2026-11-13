# Technical specifications: The Fault Lines

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: implemented.**

## Data source

USGS catalog (`fdsnws/event`) and tectonic plate boundaries (Bird model), see "Source dataset" and "Output format" in `data-model.md`. Citation required for the plate boundaries (ODC-BY, attribution Hugo Ahlenius/Nordpil/Peter Bird) in the page's source credit block.

## Map technology

Same stack as `bird-migrations`/`monarch-migration`/`volcanic-eruptions`, D3 v7.

- **Basemap, rivers, relief: copied from `bird-migrations`** to `public/data/earthquakes/` (`basemap.json`, `rivers.json`, `relief.webp`, identical bytes) rather than referenced from the `bird-migrations` folder: settles the "reservation about how to share across folders" left open by `volcanic-eruptions` (already settled the same way by `monarch-migration`), consistent with "Rules common to all visualizations" (each visualization's data in its own `public/data/<viz-slug>/` folder), at the cost of duplicating ~1.2 MB of data already present elsewhere on the site.
- **Tectonic plate boundaries:** static geometry (`plateBoundaries`, see "Output format" in `data-model.md`) drawn on the background canvas, **outside the clip** of the land silhouette (unlike the rivers): many boundary segments run through open sea (mid-ocean ridges, subduction trenches), and clipping to land would have made them disappear. Color `#b3a696` (see "Basemap (illustration)" in `style-guide.md`, added to that table during implementation), `1px` stroke width divided by `transform.k`.
- **Projection:** `d3.geoNaturalEarth1`, `fitExtent` on the full extent of the land silhouette (`basemap.json`, global coverage confirmed, `bbox` `[-180, -85.6, 180, 83.6]`), same choice as `volcanic-eruptions`. The alignment of `relief.webp` nonetheless reuses as is the Europe/Africa reference rectangle of `bird-migrations` (constants `RELIEF_REF_WIDTH`/`HEIGHT`/`ORIGIN_X`/`ORIGIN_Y`): this rectangle does not describe the view displayed by this visualization but a fixed physical property of the `relief.webp` file itself (the scale/translation at which it was rasterized once and for all), valid for any live `fitExtent` framing, including the global one chosen here: no recalibration needed (see "Points decided during implementation" below for the resolution check).
- **Zoom:** `d3-zoom` on the foreground canvas, `scaleExtent [1, 8]`, paired with zoom in/zoom out/reset buttons at the top right of the world map (same components and same zoom step, `× 1.5`, as `monument-layers`/`paris-trees`), disabled at the scale bounds.

## Rendering

**Canvas 2D**, same mechanism as `volcanic-eruptions` (see "Rendering" in its `technical-specifications.md`), reused almost identically:

- Pulse of an earthquake at the simulated moment of its occurrence: a filled circle whose radius grows from 35% to 100% of the maximum radius (`d3.scaleSqrt`, domain `[6, 9.5]` on the actual magnitude of the catalog, range `[3px, 30px]`) and whose opacity decreases from `0.85` to `0`, over a fixed duration of **850 ms in real time**, independent of the selected playback speed.
- **Difference from `volcanic-eruptions`:** no permanent point at rest. A volcano is a fixed place that pulses several times (see "Volcanoes at rest" in its `technical-specifications.md`); an earthquake is a unique event with no "owning" place to display permanently (the epicenter of a 1906 earthquake has no reason to stay marked in 2026): no discrete point outside the pulse. **Persistence duration** (see "Point hover/tap" in `functional-specifications.md`): decided during implementation as strictly equal to the pulse duration (850 ms) rather than a separate, longer window; an epicenter can only be hovered/tapped while it is visually present on screen, not after it disappears.
- **Text annotation** (notable earthquakes): DOM element overlaid on the Canvas (same approach as the `bird-migrations` tooltip), appearing in sync with the pulse, disappearing after a fixed **2,200 ms in real time** (longer than the pulse itself: time to read a place name, independent of the playback speed).

## Palette

**Sequential** palette on magnitude, same principle as `volcanic-eruptions` on the VEI. No exception to document.

## Animation

- `d3-timer` loop, continuous simulated year over the domain `[1900, 2027]` (127 years, the upper bound going one year beyond the last earthquake in the catalog so that an instant loop restart does not cut off the most recent year), looped continuously, with no end-of-pass pause: same convention as `bird-migrations`/`volcanic-eruptions` rather than the base + sweep of `monument-layers`/`satellites-in-orbit`. **Total cycle duration: 90,000 ms** at "Normal" speed (see "Points decided during implementation" below for the calibration).
- `earthquakes` sorted by ascending `year` (see "Validation constraints" in `data-model.md`), index cursor advanced at each frame. Since `data-model.md` only carries the whole year (no precise date), a dense decade can group more than a thousand earthquakes on a single yearly step: a `simYear` field derived client-side (never persisted in the JSON) spreads the earthquakes of the same year uniformly over the interval `[year, year+1)`, in the chronological order already present in the file: prevents a dense year from triggering all its pulses on the same frame rather than in a steady flow.
- Simulated year displayed via `Intl.DateTimeFormat(lang, { year: 'numeric' })` (sufficient here, unlike `volcanic-eruptions`, which must handle BC years beyond the reach of this API).
- Native **year slider** (`<input type="range">`, domain `[1900, 2026]`, yearly granularity, no tick marks, same component as `monument-layers`/`satellites-in-orbit`), synchronized with the simulated year during autoplay. A manual move (`input`) interrupts autoplay (same convention as those two visualizations: a `scrub` is equivalent to pressing Pause), recomputes `playedMs` by direct inversion of the `simYear` formula, and repositions the index cursor (`cursorForSimYear`, binary search on `simYear`) on the first entry not yet reached. Unlike `monument-layers` (which redraws the accumulated state up to the target year), a jump here simply clears the current pulses/annotation: there is no "map as it was in year X" state to display for a transient event (see "Difference from `volcanic-eruptions`" above), only the continuation of playback from that point produces new pulses.

## New dependencies

No new dependency compared to `bird-migrations`/`volcanic-eruptions`: `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` are enough.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan/zoom via `d3-zoom`, tooltip triggered by `pointerdown`/`click` rather than `pointermove` on touch: same mechanism as `bird-migrations`/`volcanic-eruptions`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `year` | Whole year within the covered period (1900 to the last year of the catalog) | Playback running |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole world map |

- **Deviation from the general temporal position rule:** an earthquake is only an ephemeral pulse that fades once playback stops (see "Interactions" in `functional-specifications.md`), so a paused image on a shared year would be an empty map. A link carrying `year` therefore restarts playback from that year instead of opening it paused. The URL then removes `year` as soon as it mounts, since playback is running: this is the only URL write that does not follow a visitor action.
- **Exception, reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): `year` is not removed on mount and the visualization stays paused on the shared year, the visitor's preference taking precedence over restarting playback. Without `year`, it opens paused at the start of the period.
- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes.

## Points decided during implementation

- **Public domain status of USGS data formally confirmed**: official USGS policies page ("Copyrights and Credits"), quoted verbatim in `data-model.md`.
- **Start year:** 1900 kept as decided during framing. The distribution by decade measured on the actual catalog (350 events in 1900-1909, gradual and steady rise afterwards, see "Chosen scope" in `data-model.md`) shows no completeness break that would have justified moving this bound earlier or later.
- **Actual volume far above the framing estimate:** 14,453 earthquakes (versus "a few thousand" anticipated, comparable to `volcanic-eruptions`), an order of magnitude denser. Kept as is rather than raising the magnitude threshold to match the initial estimate: the threshold (magnitude ≥ 6) had been decided explicitly with the user for its seismological meaning, not to reach a target volume, and the higher-than-expected density directly serves the editorial angle ("revealing the geological structure through the density of real events alone").
- **Total cycle duration calibrated on this actual density rather than taken from another visualization:** simulation of the maximum number of simultaneously active pulses (850 ms sliding window) on the actual catalog, at several candidate cycle durations: 60,000 ms → up to ~350 simultaneous pulses in the densest decades (2000-2009), 90,000 ms → ~240, 120,000 ms → ~190. Chosen: **90,000 ms**, a compromise between readability (fewer simultaneous pulses than at 60,000 ms) and playback rhythm (a cycle that stays noticeably shorter than the 120,000 ms+ that start to stretch the continuous-loop effect). A comfort value chosen during implementation from this simulation, not from an actual render observed in a browser (see limitation below): to be confirmed visually, as the site's other animated visualizations were after a first observable render.
- **Color of the tectonic plate boundaries:** `#b3a696` (subtle gray-brown), added to "Basemap (illustration)" in `style-guide.md` alongside the silhouette and hydrography already cataloged; to be confirmed visually, like the cycle duration above.
- **Selection of notable earthquakes confirmed on the actual catalog:** the seven candidates anticipated during framing all exist, with their real USGS identifier (see "Selection of earthquakes to annotate" in `data-model.md`), none had to be dropped or replaced.
- **Reuse of `bird-migrations` assets:** copied into `public/data/earthquakes/` rather than referenced from the `bird-migrations` folder (see "Map technology" above), settles the question left open in `volcanic-eruptions`, at least for this visualization (`monarch-migration` settled it the same way).
- **Verification limitation during implementation:** no render in a real browser could be observed during development (runtime environment with no graphical browser available). Astro build and type checking passed, animation logic (pulse triggering, loop restart, no duplicates or omissions) verified by Node simulation directly on the actual `earthquakes.json` file rather than visually. The pulse density, boundary color and cycle duration above therefore remain to be confirmed by a first observed render (`npm run dev`), as documented for the site's other animated visualizations.
