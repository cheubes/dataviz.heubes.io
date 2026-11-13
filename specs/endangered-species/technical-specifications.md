# Technical specifications: What's Left

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Data source

One official source per species (see "Source dataset" in `data-model.md`), not a single IUCN Red List history (source initially chosen, then dropped: see "History: dropping the IUCN Red List source" in `data-model.md`). One-off retrieval at preprocessing time, not on every build.

## Rendering

**SVG, not Canvas**: only four to six small multiples (see "Species selection" in `data-model.md`), nothing like the volume that justified Canvas on the site's map visualizations. **No geographic map** here, unlike `bird-migrations`, `monarch-migration`, `monument-layers` or `light-pollution`: the chosen angle (see "Chosen angle" in `data-model.md`) deliberately has no spatial dimension, each species is a small-multiples card, not a point on a world map.

**Rendering based solely on counts** (explicit decision of the user, see scoping discussions): no categorical dimension displayed (the former IUCN threat category disappears with the dropping of that source, see `data-model.md`), no color ↔ data mapping. The number of icons displayed alone carries the message for the data; color, for its part, comes from an illustration per species rather than a flat hue (see "Illustrated basemap per species" below), a decision reversed during implementation after a first version with a neutral background.

- Each species card displays a grid of simple SVG icons, a single generic silhouette (paw print, see "Iconography" in `style-guide.md`: no icon library, minimal inline SVG) reused for the six species rather than a silhouette specific to each one, consistent with the deliberately stripped-down rendering of this visualization (see above). One icon represents a fixed number of units specific to each species (`iconRatio` in the JSON, see "Output format" in `data-model.md`; e.g. 1 icon = 100 individuals for the tiger, 1 icon = 10 individuals for the vaquita), this ratio being chosen so that the number of icons displayed stays within a readable range (roughly 10 to 80 icons depending on the species) whatever the measurement point.
- The number of icons displayed at a given simulated instant is computed by linear interpolation (`d3.interpolateNumber`) between the two measurement points surrounding that instant, then divided by `iconRatio` and rounded.
- The icons and the species name stay white, constant (no hue per species): the illustrated background (see below) already carries a visual identity specific to each species, the text/data elements on top of it do not need to add a second one.
- The European hamster displays "active burrows" rather than "individuals" in its label and its detail card (`unit` in the JSON, see "Points of attention" in `data-model.md`); the two vaquita points built from a source range display that range (`populationLabel`) in the detail card rather than the midpoint used to compute the number of icons.

## Illustrated basemap per species

Each card has as its background an illustration specific to its species, provided by the user (`public/data/endangered-species/<species-id>.jpg`, one file per species, same name as the `id` in the JSON, see "Output format" in `data-model.md`), rather than a flat hue or the site's categorical palette: decision of the user after discussion (the alternative considered, one hue per species drawn from the categorical palette, was ruled out in favor of an illustration). The six illustrations share the same graphic style (dark navy blue/gold flat colors), provided already at the right ratio for the fixed size of the cards (1040 × 840 px, i.e. the same ratio as 260 × 210 px). Recompressed when added (progressive JPEG quality 82, see "Performance" in the general `technical-specifications.md`), going from 290-480 KB to 93-211 KB each without visible loss.

A semi-transparent dark overlay (`rgba(13, 13, 12, 0.45)`, layered as a `linear-gradient` above the image) ensures sufficient contrast for the species name and the icons (switched to white, see "Rendering" above) whatever the area of the illustration behind them, rather than depending on the brightness of each image at that precise spot.

**Provenance:** original work by the user (confirmed, see scoping discussions), no third-party credit/license mention needed, unlike the population datasets (see "Source dataset" in `data-model.md`).
- **Fixed-size cards** (explicit user feedback after a first version with variable height): the icon grid is a CSS grid with fixed columns and rows (10 columns × 8 rows, 80 slots), sized for the actual observed maximum (77 icons, European hamster in 2024), rather than a height that grows with the number of icons. Unused slots stay empty; the whole card (header included) therefore has the same width and height whatever the species or the simulated instant.

## Animation

- **Looping autoplay** (revised after user feedback; the first version made a single pass without looping, see scoping discussions): `d3-timer` loop advancing year by year over the domain `[earliest measurement point across all species, most recent measurement point]`, a 2 s pause on the last year before looping back to the starting point, same convention as `light-pollution` (`STEP_MS`/`HOLD_MS`).
- **Three speeds** (Slow ×0.5 / Normal ×1 / Fast ×2, same factors as `light-pollution`/`satellites-in-orbit`) applied to the duration per year (`STEP_MS`).
- **Native year slider** (`<input type="range">`, one step per year, with tick marks, same convention as `light-pollution`) synchronized with autoplay; moving it manually pauses playback (same behavior as `light-pollution`).
- All cards share the same simulated timeline: a species whose measurements start later than the others stays at its initial state (first known point) until that date.
- The number of icons at the current simulated year is still computed by interpolation (see "Rendering" above) even though the slider advances year by year: a species with no measurement exactly in the current year displays a count interpolated between its two nearest measurements, not a value frozen until the next real measurement.

## New dependencies

| Dependency | Usage | Scope |
|---|---|---|
| `d3-interpolate` | Interpolation of the population between two known measurement points (`interpolateNumber`) | Scoped to this visualization (Astro island) |
| `d3-timer` | Animation loop (`timer`, a `requestAnimationFrame` wrapper) | Same |

No `d3-scale` here (already a project dependency, but not used by this visualization: advancing year by year does not require a scale, see "Animation" above), nor `d3-geo`, `d3-zoom` or `d3-selection` (see "Rendering" above: no geographic map, no pan/zoom).

## Hydration

`client:visible`, via an `IntersectionObserver` on the mount area, same mechanism as the site's other visualizations.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `year` | Integer year between the year slider bounds (earliest to most recent measurement point, across all species) | Playback running |

- `year` is written on pause (button) and on release of the year slider, and removed when playback resumes. A link carrying `year` opens the small multiples paused on that year.
- A link or a slider set on the last year resumes playback, once restarted, with the brief end-of-pass pause (`HOLD_MS`) before looping back to the first year, rather than staying stuck on that year.
- No filter or framing to capture (see "Interactions" in `functional-specifications.md`). The pinned detail card is not captured (transient state).

## Points decided during implementation

All points left open during scoping are now resolved (see "Source dataset", "Species selection" and "Points of attention settled" in `data-model.md`): real sources and figures verified, six species kept, a single generic silhouette (paw print) and `iconRatio` set per species in the JSON.
