# Technical specifications: The Sun's Heartbeat

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Rendering

D3 v7: `d3-shape` (`lineRadial` for the baselines and the monthly line, `areaRadial` for the smoothed band), `d3-scale` (linear scale from sunspot number to pixels), `d3-timer` (opening animation). Interactions (dropdown list, hover, tap, button) in plain JS (`addEventListener`), without `d3-selection` or `d3-transition`, like `grape-harvest-almanac`. SVG rendering: 3,332 months, i.e. three traces of a few thousand points (baseline, band, monthly line), with no performance concern justifying Canvas.

No map, no TopoJSON.

## Spiral geometry

Notation: for each cycle c (0 to 25), L_c its number of months, P_c the maximum of its smoothed series (non-null values only), k the scale of the sunspot number in pixels, g a fixed gap between turns (around 2px).

- **Angle:** the month of index j within its cycle (j = 0 at the minimum) is placed at θ = 2π · j / L_c, clockwise from twelve o'clock. Each turn is exactly 360°, whatever the duration of the cycle (see "Chosen form" in `functional-specifications.md`).
  - **Incomplete cycles:** cycle 25 (ongoing) and cycle 0 (started before the series) have no known duration. They are given the average duration of complete cycles (132.4 months at retrieval, computed from the data, not hard-coded). Cycle 0 is aligned to end at twelve o'clock: its 73 months occupy the end of its turn, from about 160°. Cycle 25 starts at twelve o'clock; its 81 months cover about 220°, and the rest of the turn is drawn dotted (see "Content" in `functional-specifications.md`).
- **Baseline:** its radius grows linearly along each turn, from R_c at twelve o'clock at the start of the cycle to R_c+1 at the end: a true spiral, continuous from one turn to the next. R_0 is a small inner radius (around 6% of the available radius).
- **Variable pitch:** R_c+1 − R_c = k · max(P_c−1, P_c) + g, with P_−1 = 0. The pitch of a turn therefore covers the strength of the cycle it carries and that of the previous one.
- **Trace:** at a month of value v, the point is at radius base(θ) + k · v, outwards.
- **Non-overlap guarantee** for the smoothed band: at fraction f of the turn, the gap between the baseline of turn c+1 and that of turn c is (1 − f) · (R_c+1 − R_c) + f · (R_c+2 − R_c+1), a combination of two pitches both greater than or equal to k · P_c. There is therefore always at least k · P_c between the two baselines, enough for the band of cycle c. This is why each pitch takes the maximum of two cycles and not the strength of a single one: a pitch based only on the next cycle would let a strong cycle spill over a weak one (cycle 4, 235.3, followed by cycle 5, 82.0).
- **The monthly line may spill over:** monthly means exceed the smoothed mean (by up to 134 more in May 1778). Reserving room for their peak would widen every pitch by about a third, at the expense of amplitude. This thin, translucent line may therefore bite a few pixels into the gap with the next turn; the band, which carries the reading, never spills over.
- **Scale k:** derived from the available radius R_max (half the side of the mount area, minus a margin for labels): k = (R_max − R_0 − 26 · g) / (Σ max(P_c−1, P_c) + P_25). At retrieval, the denominator sum is about 5,460 (sunspot number units). With an available radius of 400px (mount area about 900px wide, possible on a desktop screen), k is about 0.06 px per unit: cycle 19 band about 17px, Dalton turns about 5px. On a phone (available radius about 160px), these values drop to 5px and 1.5px: an accepted limitation, documented in "Responsive" of `functional-specifications.md`.
- **Hover and tap:** the month picked is the one whose radial segment (from the baseline to the smoothed trace) passes closest to the pointer, through an exhaustive search over the 3,332 months on each move (negligible cost; no `d3-quadtree`). Beyond a tolerance (around 12px with a mouse, 20px with a finger), no tooltip. A click or tap selects the cycle of that month.

## Mount area: 1:1 ratio (documented exception)

`aspect-ratio: 1 / 1`, not the default `width × 0.6` height calculation (see "Rules common to all visualizations" in the general `technical-specifications.md`): a spiral requires a square, same reasoning as `flower-phenology`. The common cap applies in the same way: it is the width of the square that is constrained so that the square and the control bar fit between the header and the footer.

Unlike `flower-phenology`, there is no fixed `max-width: 640px` on top of this cap: the readable amplitude depends directly on the radius (see "Scale k" above), and every pixel gained on a large screen benefits the tight turns.

## Opening animation

- Driven by `d3-timer`: on each frame, the index of the last displayed month is proportional to the elapsed time (constant speed in time, not along the trace: the outer turns, which are longer, do not slow down the playback). The band, the monthly line and the baselines are drawn up to this index.
- Total duration: about twelve seconds (see "Points to validate").
- The landmark labels fade in through an opacity transition when the trace reaches their month (the last month for `current-cycle`, the first month of cycle 5 for `dalton-minimum`).
- "Passer", selecting a cycle or restoring a cycle from the URL stop the timer and draw the final state directly.
- Reduced motion: `prefersReducedMotion()` (`src/scripts/reduced-motion.ts`) read once at mount; if it is active, the final state is drawn without starting the timer, and "Rejouer" remains available (see "Interactions" in `functional-specifications.md`).

## Palette

The site's official palette (see "Dataviz palette" in `style-guide.md`), no exception: a single series, in **orange, slot 2 (`#eb6834`)**.

- **Why orange:** a single series, no category to distinguish; orange evokes the Sun without a color outside the style guide. The blue of slot 1 remains that of links and interactive elements (`--dv-accent`), which is better not confused with the data on a page where the spiral is clicked. The yellow of slot 4, even more solar, does not reach 3:1 on a white background as a thin line (see `style-guide.md`).
- **Measured contrast** (WCAG luminance formula): `#eb6834` on `--dv-surface` (`#ffffff`) = 3.2:1, above the 3:1 threshold for graphical elements.

| Element | Color |
|---|---|
| Smoothed band | `#eb6834`, translucent fill, solid outer edge (carries the 3.2:1 contrast) |
| Monthly line | `#eb6834`, 1px, translucent (below 3:1: a secondary element, the band carries the reading) |
| Baselines, yearly ticks, twelve o'clock radius, dotted continuation of cycle 25 | `var(--dv-gridline)` |
| Last month dot | `#eb6834`, `var(--dv-ink-primary)` outline |
| Landmark and year labels, leader lines | `var(--dv-ink-secondary)` (secondary text, see "Typography" in `style-guide.md`) and `var(--dv-gridline)` |
| Unselected turns | Same colors, reduced opacity (around 0.2) |

Background: `--dv-surface`, like the rest of the site in its fixed light theme. No new color value is introduced, so nothing needs to be added to `style-guide.md` or validated with the dataviz skill script.

## New dependencies

None. `d3-shape`, `d3-scale` and `d3-timer` are already dependencies of the site (`d3-timer` via `bird-migrations`, `earthquakes`, `satellites-in-orbit` among others), with their `@types` packages (see "Dependencies (pinned versions)" in the general `technical-specifications.md`), reused as is and scoped to this visualization.

## Copy and formats

- Interface copy (legend, control bar, tooltip, summary line, table) in the i18n dictionary, under the `sunspots` key (see "Interface copy" in the general `technical-specifications.md`). Landmark labels: in the data file (see "Output format" in `data-model.md`).
- Months and numbers formatted according to the language (`Intl.DateTimeFormat`, `Intl.NumberFormat`, one decimal place for the sunspot number), including in the table view (`table.ts`, see "Data table view" in the general `technical-specifications.md`).

## Download

**Proposed file: `downloads: [sunspots.json]`** (about 234 KB, see "Preprocessing" in `data-model.md`).

License check (see "Prepared data download" in the general `functional-specifications.md`): the source is under CC BY-NC 4.0, which explicitly allows sharing and adaptation, subject to credit, a link to the license, indication of changes and non-commercial use (terms quoted in "License and citation" of `data-model.md`). Since the site itself is operated non-commercially, redistributing the prepared file is permitted (under CC BY-NC 4.0, not under the site's CC0 license), as for `bird-migrations` (CC BY-NC 4.0) and `volcanic-eruptions` (non-commercial use with citation). The license is displayed in the credit block just above the link, and the common notice reminds that reuse remains subject to this license.

Particularity: the file itself carries an `attribution` field (source, license, retrieval date, changes made), because the license requires indicating changes and the file, once downloaded, circulates without the page that credits it. No other visualization does this at this stage (see "Points to validate").

## Hydration

`client:visible`: the opening animation starts when the spiral enters the screen, not while the visitor is reading the presentation above it.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`. The control bar summary line is an `aria-live="polite"` region, announced on each selection change; it is not updated during the opening animation, which does not change the selection.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `cycle` | Number of a cycle present in the data (`number`, see `data-model.md`), from `0` to `25` at retrieval | No cycle selected |

- Written on each selection (click, tap or dropdown list), removed when the selection is cleared.
- A present and valid parameter makes the visualization open on the complete spiral, without the opening animation (see "Interactions" in `functional-specifications.md`). An invalid parameter (not an integer, nonexistent cycle) is ignored: the visualization opens as without a parameter, animation included unless reduced motion is on.
- Not captured: the tooltip (transient consultation) and the progress of the opening animation (no time position, see the documented departure in "Interactions" of `functional-specifications.md`).

## Points to validate

Design decisions made in these specs, to be confirmed before implementation. For each: the chosen option, then the alternatives.

1. **Form:** spiral with one turn per cycle, minima aligned at twelve o'clock (see "Chosen form" in `functional-specifications.md`). Ruled out: fixed-period 11-year spiral (the initial idea), overlaid cycles aligned on their minimum.
2. **Pitch varying with strength** (see "Spiral geometry"), which guarantees that no band overlaps the next turn at the cost of a modest amplitude (5 to 17px on a large screen, 1.5 to 5px on a phone). Ruled out: constant pitch with traces overlapping around the strong cycles, more spectacular but less readable.
3. **Two plotted series:** 13-month smoothed band (main reading, defines the official minima and maxima) and translucent monthly line (texture of the pulse, the only trace of the last six months). Ruled out: the smoothed series alone (cycle 25 would stop in February 2026), the monthly series alone (too noisy to compare cycles).
4. **Partial cycle 0** (January 1749 to January 1755) displayed at the center, not numbered by SILSO, excluded from the table. Ruled out: starting the spiral at the February 1755 minimum and losing six years of data, including the 1750 peak.
5. **Provisional duration of incomplete cycles** equal to the average duration of complete cycles (132.4 months), with the rest of the cycle 25 turn dotted. Ruled out: cycle 25 turn left open with no reference duration, which prevents placing its months by angle.
6. **Cycle 25 maximum** (October 2024, 160.9) taken from the smoothed series, since it is missing from the TXT and CSV files of the cycle table, whereas SILSO's HTML page "Solar Cycles Min/Max" shows it (see "Discrepancy found" in `data-model.md`).
7. **Opening animation** of about twelve seconds, with "Passer" and "Rejouer", without pause or position in the URL. Ruled out: static visualization (simpler, but loses the beat that gives the piece its title); full player with pause and slider (a paused image adds nothing here).
8. **Four annotated landmarks** (Dalton, May 1778, cycle 19, cycle 25). Ruled out for now: a fifth landmark on cycle 24, the weakest in more than a century, at the cost of one more label on an already dense spiral.
9. **Yearly ticks** on each turn, to read the actual duration of a cycle scaled to 360°. Ruled out: doing without them and leaving the duration to the table and the summary line.
10. **Cycle dropdown list** in addition to clicking on the spiral, for keyboard, screen reader and tight turns on phones. Ruled out: click-only selection.
11. **Palette:** orange of slot 2, with no exception to the style guide. Ruled out: blue of slot 1 (confused with interactive elements), yellow of slot 4 (insufficient contrast), a "solar" sequential palette specific to the visualization (an exception to validate, with no reading gain for a single series).
12. **Table view:** one row per numbered cycle, five columns (start, maximum, number at maximum, rise, duration) and an average row for complete cycles. Ruled out: one row per decade (splits cycles in two), a column of zero months (a fragile figure before 1818).
13. **Download** of `sunspots.json` with an `attribution` field in the file. Ruled out: no download (nothing in the license requires it), or download without an `attribution` field like the other visualizations (the indication-of-changes notice would then not follow the file).
14. **Dataset `url`:** the DOI (`https://doi.org/10.24414/qnza-ac80`), which SILSO asks to be cited. Ruled out: the download page `https://www.sidc.be/SILSO/datafiles`, more direct but absent from the requested credit.
15. **`name` and `publisher`** in English, as published by the source ("International Sunspot Number V2.0 (…)", "WDC-SILSO, Royal Observatory of Belgium, Brussels"), since these attributes are not localized.
16. **Single theme `space`.** Ruled out: adding `climate`, which would bring `grape-harvest-almanac` and `flower-phenology` into the related visualizations, but would suggest a Sun-climate link that the visualization does not show.
17. **Title, summary and long presentations** (see "Editorial angle" in `functional-specifications.md`), including the caveat about version 2.0. Non-breaking spaces before double punctuation marks are to be entered as U+00A0 in the content files (see "Typography" in `style-guide.md`).
