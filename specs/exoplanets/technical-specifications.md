# Technical specifications: The Discovered Worlds

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: specified, not implemented.** The choices listed in "Points to validate" below await the user's confirmation.

## Data source

NASA Exoplanet Archive, `pscomppars` table, queried once through the TAP service at preprocessing time, not at each build (see "Access" and "Preprocessing" in `data-model.md`). Solar System landmarks read from the NSSDCA fact sheet. In the source credit block, the archive's line is supplemented by the acknowledgement text requested by the archive ("This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."), reproduced as is in both languages (see "Source dataset" in `data-model.md`).

Both source URLs (the datasets' `url`) respond 200 to a simple GET request as of 2026-09-24. The archive is behind Cloudflare: an "undetermined" verdict from source monitoring (see "Source monitoring" in the general `technical-specifications.md`) would not necessarily indicate a vanished source.

## Chosen form

**Mass × semi-major axis scatter plot, on two logarithmic axes, filling up year after year**, rather than the radius × orbital period scatter plot considered during scoping. Reason, measured on the data (see "Measurements" and "Nature of the values" in `data-model.md`):

- **Radius × period erases two of the four signatures.** The period is missing for 277 of the 289 microlensing planets and 71 of the 97 direct imaging planets; the radius of 1,130 radial velocity planets, of all microlensing planets and of 52 imaging planets is not measured but computed by the archive from the mass. This plane belongs to transits, and would mostly show Kepler and TESS.
- **Mass × semi-major axis shows them all.** 6,327 planets out of 6,366 have a position in it, and the four major families occupy clearly separate regions (medians: transit 0.076 AU / 7 Earth masses, radial velocity 0.97 AU / 359, microlensing 2.35 AU / 190, imaging 182 AU / 3,970). This is what carries the "each method leaves its signature" angle.
- **The Solar System landmarks have a direct meaning there** (distance to the Sun, mass), and Earth's region (1 AU, 1 Earth mass) is visibly almost empty: only two planets between 0.5 and 2 AU and between 0.5 and 2 Earth masses.

Accepted trade-off: 2,974 transit masses are estimated from the radius (Chen and Kipping relation), and 892 are minimum masses. They remain plotted, flagged in the detail card (see "Points to validate").

**Discovery strip** alongside the scatter plot: an accumulating scatter plot conveys rhythm poorly (a year with 1,504 discoveries is distinguished from a year with 150 only by a denser flash). The stacked annual histogram conveys this rhythm without a full-fledged second chart, and serves as a visual reference for the year slider.

## Rendering

**Canvas 2D for the points, SVG for the rest**, the same split between dense data and chrome as the site's map visualizations:

- **Canvas of settled points:** each planet whose simulated year has been reached is painted onto it once, on top of what is already there (same incremental mechanism as the swarm of `satellites-in-orbit`). A filter change, a manual slider move, a pass restart or a resize clears this canvas and rebuilds it in one pass. Filled disk with a 2.5 px radius (2 px under 480 px wide), opacity 0.75, no outline: overlap increases density where points accumulate.
- **Canvas of flashes:** on top, cleared and redrawn at every frame. A planet's appearance draws a ring in its color, whose radius goes from three times to one times that of the point and whose opacity goes from 1 to 0, over **700 ms in real time**, regardless of playback speed. Up to about a thousand simultaneous flashes during the year 2016 at Normal speed: a thousand arcs per frame stays within a 2D canvas budget.
- **Chrome SVG**, above both canvases, without pointer capture: axes and grid (see "Axes"), Solar System landmarks (empty circle with a 5 px radius, 1.5 px stroke in `--dv-ink-primary`, name in `0.75rem` weight 500, same color, with a `--dv-surface` halo behind the text, `paint-order: stroke`, to remain readable over a dense scatter plot). Above the points, so they are never covered.
- **Strip:** SVG below the scatter plot, fixed height (64 px, 48 px under 480 px wide), one column per year aligned on a band scale (`scaleBand`), stacked segments in legend order. Linear vertical scale common to all years (maximum: 1,504 in 2016), with a minimum height of 1 px for any non-zero year, so that no isolated discovery of the 1990s disappears. A year's segments are only drawn once the simulated year has reached it; vertical marker for the simulated year in `--dv-ink-primary`.
- D3 for computations only (scales, animation loop), not for the DOM: SVG built in native JS (`document.createElementNS`), interactions via `addEventListener`, same approach as `grape-harvest-almanac`.

## Axes

- **X axis:** semi-major axis, `scaleLog`, fixed domain `[0.003, 30000]` AU, which contains all planets (0.0044 to 19,000 AU) and the eight landmarks. Ticks at powers of ten from 0.01 to 10,000, labels formatted according to the language (`Intl.NumberFormat`: "0,01", "10 000" / "0.01", "10,000"). Title: "Distance moyenne à l'étoile (ua, 1 = Terre-Soleil)" / "Average distance to the star (AU, 1 = Earth-Sun)".
- **Y axis:** mass, `scaleLog`, fixed domain `[0.01, 20000]` Earth masses (data: 0.02 to 9,535). Same ticks at powers of ten. Title: "Masse (1 = Terre)" / "Mass (1 = Earth)".
- Grid at powers of ten in `--dv-gridline`, labels in secondary text (`--dv-ink-secondary`, `0.75rem`). On large screens, unlabeled intermediate ticks (2 and 5 of each decade); under 480 px wide, powers of ten only, one label out of two on the x axis.
- Fixed domains rather than computed from the data: the frame for a given year does not change scale during playback (the scatter plot fills up within a stable frame), and a data refresh that stays within these bounds does not affect it. A planet outside the domain at the next refresh is drawn at the edge of the frame rather than omitted, and flagged by the preprocessing.
- No `d3-axis` (not installed): ticks obtained via `scale.ticks()` and drawn by hand, like the year axis of `grape-harvest-almanac`.

## Palette

**Documented exception to the general dataviz palette rule** (see "Dataviz palette" in `style-guide.md`), the same as `satellites-in-orbit`: a scatter plot is a layout where all color pairs can touch, which only guarantees three hues distinguishable under color blindness. This visualization uses five, offset by:

- position, which already carries most of the information: the families occupy distinct regions of the plane (see "Chosen form"), color confirms more than it distinguishes;
- an always visible legend (color + name + count, never color alone);
- the method filter, which isolates a family to remove any ambiguity;
- the method spelled out in full in the detail card.

| Slot | Hue | Family |
|---|---|---|
| 1 | Blue | Transit |
| 2 | Orange | Radial velocity |
| 3 | Aqua | Microlensing |
| 4 | Yellow | Direct imaging |
| 5 | Magenta | Other methods |

Assignment by order of appearance in `methods` (see "Output format" in `data-model.md`), in the fixed slot order. The three families closest in the plane (transit, radial velocity, microlensing, which overlap between 0.05 and 5 AU) get the three slots guaranteed to be pairwise distinguishable. Yellow and magenta, below 3:1 contrast on a white background as thin strokes, are carried by filled disks rather than strokes; direct imaging (yellow) occupies an almost exclusive region (90% of its planets beyond 10 AU). The same colors are used for the strip.

The Solar System landmarks are in `--dv-ink-primary`, outside the categorical palette: they are not a sixth data series but reference chrome, just like the grid.

To be validated with the dataviz skill script during implementation, with the chosen opacity values (see "Rules common to all visualizations" in the general `technical-specifications.md`).

## Animation

- `d3-timer` loop, continuous simulated year over `[1992, last year + 1)`. Linear mapping of playback time → simulated year, one year per second at Normal speed: **35 s per pass** for 1992-2026. Slow (×0.5, 70 s) and Fast (×2, 17.5 s), same `SPEED_FACTORS` mechanism as `satellites-in-orbit`.
- Linear time rather than proportional to the number of discoveries: the sparse early years go by as fast as 2016, and it is this contrast (a handful of points per year, then a thousand at once) that reveals the Kepler waves.
- **End-of-pass hold:** 2.5 s on the complete scatter plot, then both canvases and the strip are cleared and the pass restarts in 1992 (same convention and same duration as `satellites-in-orbit`). Duration multiplied by the speed factor.
- Since `planets` is sorted by `year` (see "Validation constraints" in `data-model.md`), an index cursor advances at each frame. `simYear` (see "Client-side derived fields" in `data-model.md`) spreads the appearance of a year's planets over that whole year. The 39 planets without a position advance the counter and the strip, with no point or flash.
- Simulated year displayed via `Intl.DateTimeFormat(lang, { year: 'numeric' })`. If the last year in the file is also the year of `generatedAt`, it carries the "année en cours" / "current year" label: its strip column is incomplete, which must not be read as a collapse in discoveries.

## Year slider

Native `<input type="range">`, bounds `[1992, last year]` computed from `planets`, yearly granularity, no tick marks: same component and same behavior as `satellites-in-orbit` (see "Year slider" in its `technical-specifications.md`). The `input` event pauses playback; a binary search on `year` finds the last index of the chosen year; the points canvas and the strip are rebuilt in one pass up to the end of that year, flashes canvas cleared; `playedMs` is recomputed by inverting the mapping, so that resuming continues from that point.

## Hover

Linear search, at each `pointermove` (batched to once per frame), for the visible point closest to the pointer within a 6 px radius (12 px on touch), among the settled points and active families, on their screen coordinates precomputed at the last resize. About 6,300 distances per search: negligible, no spatial index. Touch: card on `pointerdown`/`click`, like `volcanic-eruptions`. The card is a DOM element overlaid on the chart, same approach as the tooltip of `bird-migrations`, with the targeted point circled in `--dv-ink-primary` on the flashes canvas.

## New dependencies

None: `d3-scale` (`scaleLog`, `scaleLinear`, `scaleBand`) and `d3-timer` are already dependencies of the site, reused without adding anything to `package.json`.

| Dependency | Usage in this visualization | Scope |
|---|---|---|
| `d3-scale` | Logarithmic scales of the axes, linear scale for time and the strip, band scale for the years | Scoped to this visualization (Astro island) |
| `d3-timer` | Animation loop | Same |

Ruled out: `d3-axis` and `d3-quadtree`, which would be new dependencies (to be discussed before adding), not needed here (ticks drawn by hand, linear search sufficient at the measured volume). No `d3-zoom` or `d3-selection`: no zoom, DOM in native JS.

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`. Reduced motion: `prefersReducedMotion()` (see "Accessibility" in the general `technical-specifications.md`) opens the visualization paused on the last year through the same path as a year restored from the URL, without writing it; the flashes canvas is then never drawn, whether playback is started or not.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Mount area height according to the common rule (`max(320px, min(width × 0.6, cap))`, strip and controls included). On resize, canvases and SVG are resized together and the settled scatter plot is rebuilt in one pass (positions recomputed, no stretching). Under 480 px wide, only the Earth, Jupiter and Neptune landmarks keep their name, to avoid overlapping labels for Mercury, Venus, Earth and Mars, squeezed into less than half a decade on the x axis.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `methods` | Identifiers of the active families (`transit`, `radial-velocity`, `microlensing`, `imaging`, `other`), comma-separated; empty (`methods=`) for no family | All five families active |
| `year` | Integer year within the year slider bounds | Playback running |

- `methods`: unknown identifiers ignored; a non-empty list in which no identifier is known is invalid and leaves all five families active. `methods=` restores the intended empty state (see "States" in `functional-specifications.md`). Written at each legend toggle.
- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying `year` opens the visualization paused, with the scatter plot and strip rebuilt up to the end of that year, like `satellites-in-orbit`. No deviation from the general rule: unlike `earthquakes`, the paused frame is meaningful (the accumulated scatter plot).
- The speed and the detail card are not captured.

## Points to validate

Design decisions to be confirmed by the user before implementation:

1. **Form:** mass × semi-major axis scatter plot rather than the radius × period of the scoping, for the reasons measured in "Chosen form". Alternative ruled out: radius × period, which only shows transits.
2. **Estimated and minimum masses:** kept (2,974 masses estimated from the radius, all transits, and 892 minimum masses), rendered identically to measured masses, nature stated in the detail card only. Alternative: distinguish them visually (empty disk for an estimated mass), at the cost of a second encoding in an already dense scatter plot. Alternative ruled out: exclude them, which would remove 63% of the transits and the Kepler waves.
3. **Semi-major axis computed using Kepler's third law** for 422 planets without `pl_orbsmax` (median deviation of 0.6% from the published values when both exist), flagged in the card. Without this computation, 430 planets, mostly recent TESS discoveries, would have no point.
4. **Grouping into five families** (four main methods + "Other methods" for 72 planets and seven methods).
5. **Palette:** five slots of the categorical palette in a scatter plot, same exception as `satellites-in-orbit`. Alternative: "Other methods" in neutral gray to stay at four hues, which would require adding a value to `style-guide.md`.
6. **Axes:** logarithmic with fixed domains (`[0.003, 30000]` AU, `[0.01, 20000]` Earth masses) encompassing all planets. Alternative: cut at the 1st and 99th percentiles to widen the core of the scatter plot, at the cost of about fifty imaging planets at the edge of the frame.
7. **Starting point in 1992** (planets of the pulsar PSR B1257+12) rather than 1995 as in the scoping: these are the first confirmed planets in the archive, and 51 Peg b (1995) is still named in the presentation.
8. **Stacked annual strip** below the scatter plot: an addition compared to the scoping, to be confirmed, along with its minimum height of 1 px per non-zero year (slight exaggeration of the 1990s).
9. **No zoom or pan** in the scatter plot: to be confirmed, in particular for the dense core of transits (0.01 to 0.3 AU).
10. **Pace:** 35 s per pass at Normal speed (one year per second, linear time), 700 ms flashes, 2.5 s hold. Starting values to be confirmed on a first observed rendering.
11. **Reduced motion:** appearance flashes suppressed even when the visitor starts playback (points appear without a flash). The general `functional-specifications.md` does not explicitly decide this case.
12. **Solar System labels on small screens:** Earth, Jupiter and Neptune only under 480 px.
13. **License and download:** the archive does not publish a formal license but allows reuse "with the appropriate acknowledgements" (see "Source dataset" in `data-model.md`). Proposal: declare `exoplanets.json` in `downloads`, under the "no formalized license but allowing redistribution with citation" sources of the general rule, with the archive's acknowledgement text in the credit block. Caveat: no text from the archive explicitly mentions redistribution; if the user deems this silence insufficient, no `downloads`.
14. **Second credited dataset** for the eight Solar System values (NSSDCA fact sheet) rather than unsourced constants.
15. **Inclusion of 2026, a partial year,** in playback, the strip and the table, with the "année en cours" label, rather than stopping the visualization at the last complete year (2025).
16. **Title, summary and presentations** (see "Editorial angle" in `functional-specifications.md`), single theme `space`.
