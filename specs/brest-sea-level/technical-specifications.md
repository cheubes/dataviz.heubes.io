# Technical specifications: The Sea Is Rising in Brest

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Data source

PSMSL annual RLR file for the Brest station (identifier `1`), retrieved once during preprocessing then frozen in `public/data/brest-sea-level/sea-level.json` (see "Preprocessing" and "Output format" in `data-model.md`). No call to the PSMSL at runtime or at build time.

## Rendering

SVG, like `grape-harvest-almanac`: a single series of 187 points, a few hundred stones for the wall, no volume concern that would justify Canvas. A single `<svg>` drawn in this order (from back to front):

1. **Wall:** courses and stones (see "Procedural wall" below).
2. **Water:** an area (`d3.area`) from the foot of the wall up to the annual level, then the surface line (`d3.line`) on top.
3. **Gap labels** (text).
4. **Engraved trends:** three straight segments and their labels.
5. **Playhead, vertical hover line, tooltip.**
6. **Tide scale**, in its own column to the right of the wall (see "Tide scale" below).

**Scales:** `d3.scaleLinear` for the years (x axis, domain `[1807, last year + 1]`) and for the deviation from the reference level in cm (y axis, domain rounded to the 5 cm courses that frame the actual extent of the data, i.e. `[-10, +30]` cm today). The wall and the tide scale share exactly the same vertical scale: a given water height is at the same level on both.

**Year positions:** the mean of a year is placed at the middle of the year (`year + 0.5`), as the PSMSL does for its monthly means. The surface is a straight line between consecutive years (`curveLinear`): no smoothing, which would invent values between the published means, nor steps (`curveStep`), which would give staircase water unrelated to the image of the quay.

**Gaps:** `area.defined()` and `line.defined()` cut the water and the surface on any year absent from `years` (see "Output format" in `data-model.md`), same principle as the "Broken lines" of `grape-harvest-almanac`: no water is drawn between two years separated by a gap. A segment reduced to a single year (none today, possible after an update) is drawn as a one-year-wide plateau, to remain visible. Gap labels: above the highest water level of the neighboring years, centered on the gap, only for gaps longer than three years (1836-1845, 1857-1860, 1944-1952); the specific label for 1944-1952 is interface copy (see "Content" in `functional-specifications.md`), not JSON data.

**Corrected mid-tide years (1807-1835):** same water area, but dotted surface (`stroke-dasharray`), drawn as a line segment separate from the following years (a ten-year gap separates them anyway).

**Engraved trends:** each period of `trends` is a segment from `(startYear + 0.5, startLevelMm)` to `(endYear + 0.5, endLevelMm)`, converted to a deviation from the reference level. The three segments do not join (independent regressions, see "Output format" in `data-model.md`): left as they are, without artificial joining. Label above the end of each segment ("1,3 mm/an"), formatted by `Intl.NumberFormat` according to the language; a slope that rounds to zero is displayed as "≈ 0 mm/an". A segment is drawn only once the playhead has passed `endYear` (see "Interactions" in `functional-specifications.md`).

## Procedural wall

No image: the wall is generated in SVG at each layout, from the vertical scale.

- **Courses:** one horizontal band per 5 cm slice of deviation (eight courses for `[-10, +30]` cm). Their height on screen therefore follows directly from the scale: the horizontal joints fall exactly on the 5 cm graduations and serve as grid lines.
- **Stones:** each course is cut into stones of variable width (between 1.2 and 2.2 times the course height), with vertical joints offset from one course to the next (staggered bond). The widths come from a pseudo-random generator with a fixed seed: the wall is identical for all visitors and on every resize to the same size, and does not "flicker" during playback.
- **Graduations:** text engraved at the left edge, on the stone, at each joint that is a multiple of 10 cm ("0", "+10 cm", "+20 cm"; "-10 cm" at the foot if the course exists). The "0" additionally carries the label "niveau moyen du dix-neuvième siècle" / "19th-century mean" on wide enough screens.
- **Year axis:** below the wall, outside the stone, graduations every 25 years (every 50 years on a narrow screen, see "Responsive" below).

**Asset to produce, optional:** drawn decorative elements (mooring bollard, quay ladder set into the wall, granite texture), as minimal inline SVG or provided by the author like the illustrations of `endangered-species`. Not required by this spec: the procedural wall is enough to carry the metaphor, and any added decoration stays within the illustration colors below, without encoding any data. See "Points to validate".

## Tide scale

Fixed-width column (about 88 px) to the right of the wall, in the same `<svg>`:

- Vertical ruler, graduated every centimeter (short tick), every 5 cm (medium tick) and numbered every 10 cm, on the vertical scale of the wall.
- Water risen to the deviation of the playhead's year, same colors as the wall's water; dry ruler on a year without measurements.
- Above the ruler, as overlaid HTML text (not SVG text, for font size and accessibility): the year as a visual `h3` and the deviation in large type ("+29,2 cm"), then the caption "par rapport au niveau moyen du dix-neuvième siècle" as secondary text. This block is the `aria-live` region described in "Accessibility".

## Palette

A single series: no categorical palette. Two color families, already defined in `style-guide.md`:

| Element | Color | Source in `style-guide.md` |
|---|---|---|
| Water (area, wall and tide scale) | `#86b6ef` | Blue sequential, step 250 |
| Water surface (1.5 px line) | `#1c5cab` | Blue sequential, step 550 |
| Stones | `#e4e2da` | Basemap (illustration): silhouette |
| Joints between stones (1 px) | `#b3a696` | Basemap (illustration): tectonic plate boundaries |
| Engraved trends (2 px line) and their labels | `--dv-ink-primary` | Interface palette |
| Graduations, gap labels, year axis | `--dv-ink-secondary` | Interface palette |
| Playhead, vertical hover line (1 px) | `--dv-ink-secondary` | Interface palette |
| Tide scale face | `--dv-surface` | Interface palette |
| Tide scale graduations | `--dv-ink-primary` | Interface palette |

**Rationale and deviations:**
- **Water in sequential blue**, not in `#a8c5da` (hydrography): here the water is the data itself, and the style guide reserves illustration colors for decoration ("never reused to encode data"). Sequential blue is the site's default magnitude hue.
- **Stones and joints in illustration colors:** the wall is decoration, just like a basemap. It is, however, a new use of these hues, outside a map: the list of visualizations that use them, in "Basemap (illustration)" of `style-guide.md`, will need to mention `brest-sea-level` (see "Points to validate").
- **Contrasts to be checked** with the dataviz skill's validation script, during implementation: WCAG ratios computed while writing these specs: surface `#1c5cab` on stone `#e4e2da` 5.1:1; area `#86b6ef` on stone only 1.6:1, hence the surface line, which alone carries the reading of the level; labels `--dv-ink-primary` (`#444444`) on the water 4.6:1 and on the stone 7.5:1. A 3 px `--dv-surface` halo behind the labels remains planned if reading on the water proves difficult in use.
- No color to distinguish the three trend periods: their labels and their slope are enough, and one hue per period would suggest three series.

## Animation

- `d3-timer` loop, single pass over `[1807, last year]`, one year per step of `STEP_MS` = 70 ms, i.e. about fifteen seconds for 217 years (gaps included: the playhead crosses the gaps at the same pace, so that the on-screen duration remains proportional to time). No loop, no end pause: at the end of the pass, the loop stops on the complete view.
- Each step directly redraws the state of the current year (area and surface cut at the playhead, tide scale, completed trends): no `d3-transition` or CSS transition on moving elements. The reduced motion preference (see "Accessibility" in the general `technical-specifications.md`) therefore has nothing to neutralize; it is read by `prefersReducedMotion()` for form's sake, with no effect, the opening view already being the final paused state (see "Reduced motion" in `functional-specifications.md`).
- Cutting the water at the playhead: a `clipPath` whose width follows the playhead, rather than recomputing the paths at each step.
- Native year slider (`<input type="range">`, one step per year), synchronized with playback; moving it pauses.

## New dependencies

None. `d3-scale`, `d3-shape` and `d3-timer` are already dependencies of the site (with their `@types`), reused identically and scoped to this visualization by the Astro island. No `d3-selection` or `d3-transition`: interactions and updates in native JS, like `grape-harvest-almanac`.

## Table view (computed at build time)

`src/components/visualizations/brest-sea-level/table.ts` (see "Data table view" in the general `technical-specifications.md`) reads `sea-level.json` via `readDataFile`, groups the years by decade (`Math.floor(year / 10) * 10`), and computes for each one the number of years with values, the mean of the deviations, the lowest and the highest year (see "Table view" in `functional-specifications.md`). Deviations converted to cm, formatted with an explicit sign (`Intl.NumberFormat`, `signDisplay: 'exceptZero'`, one decimal place).

## Hydration

`client:visible`.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`. In addition:

- The `<svg>` carries `role="img"` and a static `aria-label` taken from the i18n dictionary, which summarizes the visualization ("Niveau moyen annuel de la mer à Brest de 1807 à 2023 : stable au dix-neuvième siècle, en hausse depuis 1900, plus rapide depuis 1993").
- The tide scale readout block (year and deviation) is an `aria-live="polite"` region, updated only on visitor action (slider, pause), never at each playback step, so as not to flood the screen reader.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

- Mount area height: the site's default computation (`max(320px, min(width × 0.6, cap))`, see "Rules common to all visualizations" in the general `technical-specifications.md`), with no deviation.
- Below 640 px of mount area width (indicative threshold, to be adjusted during implementation): the tide scale column disappears in favor of the compact readout above the wall, the year axis switches to a graduation every 50 years, and the trend labels are reduced to the rate.
- At 360 px wide, a year takes up about 1.5 px: the water remains readable as a surface, and hover snaps to the year closest to the finger.
- No zoom or pan: default `touch-action`, page scrolling works over the quay, as for `grape-harvest-almanac`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `year` | Integer year between 1807 and the last year of `years`, including a year without measurements | Complete view (last year), paused |

- `year` is written on pause (button) and on release of the year slider, and removed when playback starts. A link carrying `year` opens the quay paused on that year.
- The complete view is the default state: a pause or a slider set on the last year removes `year` from the URL instead of writing it, and a `?year=<last year>` link opens the complete view. The URL stays bare in the initial state.
- An out-of-range or non-integer value is ignored (complete view). After an update that extends the series, an old link remains valid and designates the same year.
- The tooltip and the vertical hover line are not captured.

## Points to validate

Design decisions made in these specs, to be confirmed by the author before implementation:

1. **"Unrolled quay" form** (time along the quay, height on the courses, tide scale at the end) rather than the initial idea of a single waterline rising along a wall, to make the acceleration readable (see "Composition" in `functional-specifications.md`).
2. **No autoplay on opening:** the page opens on the complete view, paused, and playback is the visitor's choice. A deliberate departure from most of the site's animated visualizations, which start on their own.
3. **Playback in a single pass of about fifteen seconds, with no speed selector or loop.**
4. **Reference level = 1807-1899 mean** (displayed as "niveau moyen du dix-neuvième siècle"), rather than the RLR zero or a recent period.
5. **Split of the trends into three periods** 1807-1899 / 1900-1992 / 1993-2023, 1993 being chosen as the conventional start of satellite altimetry and not fitted to the series. Alternative ruled out: a sliding rate curve, misleading at a single station (see `data-model.md`).
6. **PSMSL source (annual RLR) rather than SONEL or Shom's hourly measurements** (see "License and data policy" in `data-model.md`).
7. **No prepared data download** (no `downloads` attribute), for lack of explicit redistribution permission. Option: write to the PSMSL (psmsl@noc.ac.uk) or to Shom to obtain written confirmation, then reopen the question.
8. **Update of `style-guide.md`** needed before implementation: add `brest-sea-level` to the list of visualizations that use the "Basemap (illustration)" colors (stones `#e4e2da`, joints `#b3a696`), specifying this use outside a map. Not applied here (outside this visualization's folder).
9. **Water in sequential blue** (steps 250 and 550) rather than in the hydrography hue, and contrasts to be validated by the dataviz skill's script (see "Palette").
10. **Optional illustrated decoration** (bollard, quay ladder, texture): to be produced or not; by default, procedural wall alone, with no asset.
11. **Water surface as a straight line between mid-years**, without smoothing or steps; years 1807-1835 dotted.
12. **`climate` theme only** (`earth` conceivable, since the subject also touches on land motion).
13. **Title and summary** (FR/EN) and long presentation, in particular the wording of vertical land motion (zero according to leveling, about -1 mm/yr according to gravimetry, not corrected).
14. **Exact location of the tide gauge** ("sur un quai du port militaire") to be confirmed before publication, not verified in the sources consulted.
15. **Jump between the 1900s and 1910s decades** (+7.6 cm from one decade to the next), with no explanation in the PSMSL documentation: neither commented on nor corrected, to be kept as is unless a source says otherwise.
16. **Cover image** to be produced (`src/assets/covers/brest-sea-level.png`, capture of the quay in complete view), following the general workflow.
