# Functional specification: The Sun's Heartbeat

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Le cœur battant du Soleil | Depuis 1749, les taches solaires battent au rythme d'un cycle d'environ onze ans : vingt-cinq pulsations enroulées en spirale, du minimum de Dalton au cycle 25 en cours. |
| EN | The Sun's Heartbeat | Since 1749, sunspots have pulsed to a cycle of about eleven years: twenty-five beats wound into a spiral, from the Dalton Minimum to the ongoing cycle 25. |

**Long FR presentation:**
> Depuis 1749, des astronomes comptent les taches qui constellent la surface du Soleil. Mis bout à bout, ces comptages dessinent un pouls : le nombre de taches monte, culmine puis retombe presque à zéro, environ tous les onze ans. Vingt-cinq cycles se sont succédé depuis que Rudolf Wolf a commencé à les numéroter, et aucun ne ressemble tout à fait à un autre : certains durent neuf ans, d'autres près de quatorze. Au début du dix-neuvième siècle, pendant le minimum de Dalton, le Soleil a presque cessé de battre ; un siècle et demi plus tard, le cycle 19 a été le plus intense jamais mesuré. Enroulée en spirale, un tour par cycle, la série révèle aussi une règle discrète : plus un cycle est intense, plus il monte vite. Les nombres affichés sont ceux de la version 2.0 de la série, recalibrée en 2015 : ils sont nettement plus élevés que ceux de nombreuses sources antérieures.

**Long EN presentation:**
> Since 1749, astronomers have counted the spots scattered across the surface of the Sun. Strung together, these counts trace a pulse: the number of spots rises, peaks, then falls back almost to zero, roughly every eleven years. Twenty-five cycles have followed one another since Rudolf Wolf began numbering them, and no two are quite alike: some last nine years, others nearly fourteen. In the early nineteenth century, during the Dalton Minimum, the Sun's heart almost stopped; a century and a half later, cycle 19 was the strongest ever recorded. Wound into a spiral, one turn per cycle, the series also reveals a quiet rule: the stronger a cycle, the faster it rises. The figures shown come from version 2.0 of the series, recalibrated in 2015: they are markedly higher than those found in many older sources.

Theme: `space` (see "Theme" in the general `data-model.md`). Expected related visualizations: `satellites-in-orbit` and, if published, `exoplanets` (specified in parallel, same single theme).

## Goal

Show, on a spiral where each turn is a solar cycle, the Sun's activity month by month since 1749, to make readable at a glance the irregularity of the cycles, the Dalton Minimum, the record cycles and the position of the ongoing cycle 25.

## Chosen form

**A spiral, one turn per cycle, with variable pitch.** Each turn runs from one official minimum (see "Cycle definition" in `data-model.md`) to the next, clockwise from twelve o'clock: all minima fall at twelve o'clock, and the angle at which a turn peaks tells the share of the cycle spent rising. The gap between two turns depends on the strength of the cycles it separates: a weak cycle is a tight turn, a strong cycle a wide turn, without any trace ever spilling onto the next turn (geometric rule: see "Spiral geometry" in `technical-specifications.md`).

What the form makes visible, measured on the data (see "Measured statistics" in `data-model.md`):

- **The Dalton Minimum:** two consecutive turns, almost flat and tight (cycles 5 and 6, smoothed maxima of 82.0 and 81.2), in the inner third of the spiral.
- **The record cycles:** the widest turn is that of cycle 19 (285.0); the highest peak of the monthly trace, that of May 1778 (cycle 3, 398.2).
- **The Waldmeier effect:** strong turns peak early (cycle 3 at a third of the turn, 35 months of rise out of 111), weak turns late (cycle 5 past the halfway point, 82 months out of 147). Correlation of −0.75 between rise and strength over cycles 1 to 24: this is the quiet rule announced by the presentation.
- **The ongoing cycle 25:** the outer, unfinished turn, which stops at the last available month.

Alternatives ruled out (to be confirmed, see "Points to validate" in `technical-specifications.md`):

- **Fixed-period spiral (one turn = 11 years, the initial idea):** cycles last from 108 to 163 months; with a fixed period, the minima drift by up to 85° from one turn to the next, the peaks wander around the dial and the eye can no longer compare two cycles. The drift tells the irregularity of the durations, but that irregularity can also be read in the chosen form (yearly ticks, see "Content" below) without sacrificing comparison.
- **Constant pitch:** with 26 turns over the available radius, one has to choose between a crushed amplitude (about ten pixels for all cycles) and traces that overlap over two or three turns around the strong cycles. Variable pitch makes space itself an encoding of strength, like growth rings.
- **Overlaid cycles aligned on their minimum** (the reference chart of heliophysicists): precise comparison of shapes, but it loses the chronology (the succession of the two weak Dalton cycles, the beat over time) and is nothing like an original piece. The table view (see below) covers the numerical comparison.

## Content (mount area)

- **Control bar**, above the spiral, always visible:
  - legend: solid band ("Moyenne lissée sur 13 mois" / "13-month smoothed mean"), thin line ("Moyenne mensuelle" / "Monthly mean"), reading reminder ("Un tour = un cycle, d'un minimum au suivant" / "One turn = one cycle, from one minimum to the next");
  - cycle selector (dropdown list, see "Interactions");
  - "Passer" / "Skip" button during the opening animation, "Rejouer" / "Replay" afterwards (see "Interactions");
  - summary line for the selected cycle, or a prompt when none is selected (see "Interactions"), on a reserved height so as not to shift the spiral.
- **Spiral (SVG)**, square:
  - 26 turns: the partial cycle 0 at the center (1749-1755, see "Cycle definition" in `data-model.md`), then cycles 1 to 25 outwards;
  - for each turn, a thin baseline (the zero of the sunspot number), a solid band that moves outwards from it according to the 13-month smoothed mean, and a thin line for the monthly mean, more irregular;
  - a dotted radius at twelve o'clock, labeled "Minimum" / "Minimum";
  - small ticks on the baseline of each turn, one per January 1, when the gap between turns allows: a nine-year cycle has nine, a fourteen-year cycle fourteen; the actual duration can thus be read despite turns all scaled to 360°;
  - the start year of a few cycles on the twelve o'clock radius (at least 1749, 1755 and the start year of cycle 25), the others only when the gap between turns leaves room for a label;
  - the end of cycle 25: a dot on the last available month, labeled with that month ("août 2026" / "August 2026"), and the rest of the turn dotted up to twelve o'clock, since the date of the next minimum is not known;
  - the annotated landmarks (see below).
- **Tooltip** on hover or tap (see "Interactions").

## Annotated landmarks

Four landmarks, always displayed, as short labels connected to the spiral by a thin line. Data and anchors: see "Output format" in `data-model.md` (`annotations` field).

| `id` | Anchor | FR label | EN label |
|---|---|---|---|
| `dalton-minimum` | Cycles 5 and 6 | Minimum de Dalton (cycles 5 et 6) | Dalton Minimum (cycles 5 and 6) |
| `record-month` | May 1778, cycle 3 | Mai 1778 : record mensuel, 398,2 | May 1778: monthly record, 398.2 |
| `strongest-cycle` | March 1958, cycle 19 | Cycle 19, le plus intense : 285,0 | Cycle 19, the strongest: 285.0 |
| `current-cycle` | Last available month, cycle 25 | Cycle 25, en cours | Cycle 25, ongoing |

Chosen to cover the arc required by the editorial angle (the slowing heart, the record peaks, the present) and nothing more: the spiral is dense, and each additional label hides part of it. Cycle 24, the weakest in more than a century, remains readable through cycle selection and the table, without a landmark of its own (see "Points to validate" in `technical-specifications.md`). The anchor of `current-cycle` is written by the preprocessing script (last month of the series), not fixed in the spec.

## Interactions

- **Initial view: opening animation.** The trace winds out from the center, from January 1749 to the last available month, at a constant speed in time (about twelve seconds in total, i.e. one beat per half-second; duration to be confirmed, see "Points to validate" in `technical-specifications.md`). The landmarks fade in when the trace reaches their month. During the animation, the control bar button reads "Passer" and immediately displays the complete spiral; the tooltip is inactive. Choosing a cycle (list or click on a turn) also ends the animation. At the end, the spiral is complete, no cycle is selected and the button becomes "Rejouer".
  - **Departure from the "Autoplay" rule** (see "Reduced motion" and "Shareable state in the URL" in the general `functional-specifications.md`), documented here as the rule allows: there is neither pause nor time slider, and therefore no time position in the URL. It is an introduction, not a navigation through time: the final image contains all the information, and a paused image would only show a truncated spiral.
- **Hover / tap:** tooltip for the month closest to the pointer. Content: month and year, cycle number ("Octobre 1957 · cycle 19" / "October 1957 · cycle 19"), monthly mean ("Moyenne mensuelle : 359,4" / "Monthly mean: 359.4"), smoothed mean ("Lissée sur 13 mois : 282,5" / "13-month smoothed: 282.5", line absent for the first six and last six months of the series, which have none). "provisoire" / "provisional" note for a provisional month (see `data-model.md`). For a month before 1818, a caution line: "Avant 1818 : observations éparses, reconstituées par Wolf" / "Before 1818: sparse observations, reconstructed by Wolf".
- **Cycle selection:** by click or tap on a turn, or through the "Cycle" dropdown list ("Tous les cycles" by default, then "Cycle 0 (1749-1755, partiel)", "Cycle 1 (1755-1766)" … "Cycle 25 (depuis 2019)"). The selected turn stays fully visible, the others fade out through an opacity transition. The control bar summary line gives:
  - cycles 1 to 24: "Cycle 19 : avril 1954 → septembre 1964, 10,5 ans. Maximum en mars 1958 (285,0), atteint en 3,9 ans. 1er plus intense sur 25.";
  - cycle 25: "Cycle 25 : depuis décembre 2019, en cours. Maximum en octobre 2024 (160,9), atteint en 4,8 ans. 15e plus intense sur 25.";
  - cycle 0: "Cycle 0 (partiel) : janvier 1749 → janvier 1755, fin d'un cycle commencé avant la série, non numéroté par SILSO.";
  - with no selection, a prompt: "Choisissez un cycle dans la liste, ou touchez un tour de la spirale." / "Pick a cycle from the list, or tap a turn of the spiral."

  The rank compares the smoothed maxima of cycles 1 to 25. A new click on the selected turn, or "Tous les cycles", clears the selection.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the selected cycle is restored. The visualization then opens directly on the complete spiral, without the opening animation: the recipient comes to see a specific cycle, and the animation would hide it from them for a dozen seconds. The tooltip is not captured (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the visualization opens on its final state, the complete spiral, without animation; the button reads "Rejouer" right away and starts the animation on demand, which then plays normally. The opacity transitions of the selection are kept: they do not move anything.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Les 25 cycles solaires numérotés : dates et intensité (nombre de taches lissé sur 13 mois)" / "The 25 numbered solar cycles: dates and strength (13-month smoothed sunspot number)".
- **Rows:** one cycle per row, from cycle 1 to cycle 25, in chronological order. First cell: "Cycle 1" … "Cycle 25". The partial cycle 0 is not included: it is not numbered by SILSO and has no official minimum or maximum.
- **Columns:**
  - **Start** ("Début"): month of the minimum that opens the cycle ("février 1755" / "February 1755");
  - **Maximum** ("Maximum"): month of the maximum ("juin 1761");
  - **Number at maximum** ("Nombre au maximum"): smoothed value at the maximum, one decimal place ("144,1" / "144.1");
  - **Rise** ("Montée"): duration from minimum to maximum, in years with one decimal place ("6,3 ans" / "6.3 yr");
  - **Duration** ("Durée"): duration from minimum to the next minimum ("11,3 ans" / "11.3 yr"), "en cours" / "ongoing" for cycle 25.
- **Total row:** "Moyenne des cycles complets" / "Average of complete cycles" (cycles 1 to 24 at retrieval): number at maximum 178.7, rise 4.4 years, duration 11.0 years; "n.d." / "n/a" for the date columns. It gives the summary's "cycle of about eleven years" in figures. Computed over the cycles flagged complete rather than over a fixed list, so as to stay correct when a cycle 26 appears (see "Preprocessing" in `data-model.md`).
- **Not included:** the 3,332 monthly and smoothed means, which the table cannot summarize in a hundred or so rows; they remain in the downloadable file (see "Download" in `technical-specifications.md`).

## States

- **Loading:** the time for the JSON to be fetched and the spiral to be computed; square mount area reserved with no layout shift.
- **Error:** JSON fetch failure → error message, no silent empty spiral.
- **Empty:** not applicable. No filter can remove data: selecting a cycle fades the others without hiding them. Documented departure from the "Expected common states" rule (see "Rules common to all visualizations" in the general `technical-specifications.md`).

## Responsive

Adapted touch version (see "Responsive" in the general `technical-specifications.md`, applied here):

- The spiral resizes while keeping its square. Below a threshold width (to be defined during implementation, around 480px), the landmarks switch to short labels ("Dalton", "1778", "Cycle 19", "Cycle 25") and only the years 1749 and the start of cycle 25 remain on the twelve o'clock radius.
- Tap on the spiral for the tooltip rather than hover; a second tap elsewhere closes it. A tap also selects the touched cycle, like the click on desktop.
- On a phone screen, the inner turns are only a few pixels apart (especially the two Dalton turns): aiming at a specific turn with a finger is difficult there. The "Cycle" dropdown list is the reliable way to choose one; this is why it duplicates the click on all screens.
- The summary line wraps over several lines; its reserved height follows, so that the spiral does not jump from one cycle to the next.

## Accessibility (known limitation)

The main interaction (SVG spiral, hover and tap on the turns) is not natively accessible by keyboard or screen reader. Documented as a known limitation, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`).

Cycle selection, however, is accessible: the dropdown list is a native `<select>`, and the summary line is announced to screen readers on each change. The key figures of each cycle are therefore accessible without going through the spiral.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

The data is numerical and has nothing to translate; cycle numbers follow Wolf's international numbering, identical in both languages. Only the `attribution` notice of the data file (see "Output format" in `data-model.md`) remains in English, the language of the source and its license: it is not displayed on the page (the source credit block handles that) and only accompanies the downloaded file.
