# Technical specifications: The Grape Harvest Almanac

Supplements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Rendering

D3 v7 (`d3-shape` for the lines, `d3-scale` for the scales); interactions (checkbox, hover, tooltip, click on landmark) in plain JS (`addEventListener`), no `d3-selection`/`d3-transition`. SVG rendering: low data volume (seven regions, at most 654 raw points each, about 4,500 points in total counting the moving averages), no performance concern justifying Canvas, same reasoning as `flower-phenology`.

## Broken lines (data gaps)

Each curve (raw or moving average) is split into as many `<path>` segments as there are continuous ranges of data: no line is drawn between two years separated by a gap, so as not to suggest an interpolation that does not exist in the source data. `d3.line().defined(...)` natively handles this break based on the presence or absence of `dayOffset`/`smoothedDayOffset` for each year (see "Output format" in `data-model.md`).

## Axes

No zoom or pan (removed at the user's request, see also "Interactions" in `functional-specifications.md`): the year scale is fixed, computed once at layout (and recomputed when the window is resized) rather than dynamically rebuilt on each gesture.

- **Year axis (x-axis):** ticks and labels displayed, no shrinking/enlarging possible.
- **Harvest day axis (y-axis):** neither ticks nor labels displayed (removed at the user's request); discreet horizontal gridlines (`var(--dv-gridline)`) are still drawn as a visual reference, and the exact value is read via hover/tap (see "Interactions" in `functional-specifications.md`).

Without zoom/pan, the mount area no longer needs to capture touch gestures for itself (`touch-action: none` removed): normal page scrolling works with a finger over the chart, as on the rest of the site.

## Historical landmarks

Dotted vertical line `1px` `var(--dv-gridline)` over the full height of the plot area, plus a small clickable icon anchored on the year axis. `phylloxera-crisis` (the only landmark covering a period rather than a year, see `data-model.md`) is rendered as a semi-transparent vertical band between `year` and `yearEnd` rather than a simple line, to visually distinguish an interval from a specific moment. The detail panel opened on click (see "Interactions" in `functional-specifications.md`) is positioned as an overlay, anchored to the landmark, without moving the plot.

## Palette

The site's official categorical palette (see "Dataviz palette" in `style-guide.md`), no exception: seven regions, in chronological order of their start date in the dataset (see "Chosen regions" in `data-model.md`), assigned to the first seven fixed slots (out of eight available).

| Region | Slot | Hue |
|---|---|---|
| Bourgogne | 1 | Blue (`#2a78d6`) |
| Vallée du Rhône (sud) | 2 | Orange (`#eb6834`) |
| Bordeaux | 3 | Aqua (`#1baf7a`) |
| Languedoc | 4 | Yellow (`#eda100`) |
| Alsace | 5 | Magenta (`#e87ba4`) |
| Basse vallée de la Loire | 6 | Green (`#008300`) |
| Champagne | 7 | Violet (`#4a3aa7`) |

Seven series as lines: at this number, the official categorical palette moves from the "adjacent" regime (gate-safe up to eight hues for lines that may cross without overlapping as filled areas) to the next tier of the dataviz skill's scale ("5-6: soft cap, legend or small multiples" then "7-8: color token cap"): a decision accepted with the user, who approved the addition despite this tightening rather than proposing small multiples. No direct label at the end of the curves (removed at the user's request along with the y-axis ticks, see "Axes" above): region identification remains carried by the checkbox legend/filter, always visible above the chart (see "Content" in `functional-specifications.md`), and by the tooltip on hover, never by color alone.

## Date conversion

The source data expresses a harvest date as a number of days after August 31, possibly negative (see "Raw data schema" in `data-model.md`). Converted client-side into a readable calendar date (e.g. `31 août + 22 jours` → "22 septembre") for the axis, the tooltips and the landmark detail panel; the reference year used for this calculation (an arbitrary non-leap year) has no effect, only the offset in days from August 31 is meaningful.

## New dependencies

None: `d3-shape` and `d3-scale` are already dependencies of the site (via `bird-migrations`, `flower-phenology`), reused as is, scoped to this visualization by npm convention. No `d3-selection`/`d3-transition`: unlike `bird-migrations`/`flower-phenology`, the interactions are in plain JS (see "Rendering" above).

## Hydration

`client:visible`.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `regions` | Identifiers (`id`, see `data-model.md`) of the checked regions, comma-separated, in checkbox order; empty (`regions=`) if no region is checked | All seven regions |

- An unknown identifier is ignored; a list in which no identifier is recognized is treated as invalid (falls back to all seven regions), so that a broken link does not land on the empty state.
- The detail panel of a historical landmark and the tooltip are not captured: they are transient consultations, not a state of the view.
