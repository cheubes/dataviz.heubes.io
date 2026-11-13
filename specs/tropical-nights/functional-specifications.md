# Functional specification: Tropical Nights

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: specified, not implemented.**

## Editorial angle

Show the tropical night as a lived experience (a night when you sleep badly because the city no longer cools down) rather than as a temperature average: each night is a cell, and the visitor sees the cells light up, summer after summer, earlier and earlier and further and further north. The figures are raw station readings, not homogenized series (see "Homogenized series" in `data-model.md`): the page says so, without making it the subject.

| Language | Title | Summary |
|---|---|---|
| FR | Les nuits tropicales | Nuit après nuit depuis 1950, les nuits où le thermomètre ne descend pas sous 20 °C dans huit villes françaises : une rareté devenue une saison. |
| EN | Tropical Nights | Night after night since 1950, the nights when the thermometer never drops below 20 °C in eight French cities: once a rarity, now a season. |

**Long FR presentation:**
> Météo-France parle de nuit tropicale quand la température ne descend pas sous 20 °C. C'est une nuit où la ville ne se rafraîchit plus, où le corps récupère mal de la chaleur du jour. Longtemps réservées au littoral méditerranéen, ces nuits gagnent du terrain.
>
> Chaque bloc de cette page est une ville, chaque ligne un été depuis 1950, chaque case une nuit de mai à octobre, allumée quand le thermomètre est resté au-dessus de 20 °C. À Nice, on en comptait une quinzaine par an dans les années 1950, plus de quatre-vingts depuis 2020. À Toulouse, Lyon ou Bordeaux, il y en avait moins de cinq par an jusqu'aux années 1980, plus de dix depuis 2020.
>
> Ces chiffres sont les relevés des stations elles-mêmes, sans correction. Une station déplacée, un aéroport rattrapé par la ville, un parc au cœur de Paris : chaque thermomètre raconte aussi l'histoire de son voisinage, et pas seulement celle du climat.

**Long EN presentation:**
> Météo-France calls a night tropical when the temperature does not drop below 20 °C. It is a night when the city no longer cools down, when the body struggles to recover from the heat of the day. Long confined to the Mediterranean coast, these nights are spreading.
>
> Each block on this page is a city, each row a summer since 1950, each cell a night from May to October, lit when the thermometer stayed above 20 °C. In Nice, there were about fifteen a year in the 1950s, more than eighty a year since 2020. In Toulouse, Lyon or Bordeaux, there were fewer than five a year until the 1980s, more than ten a year since 2020.
>
> These figures are the stations' own readings, uncorrected. A station that moved, an airport swallowed by the city, a park in the heart of Paris: each thermometer also tells the story of its surroundings, not only that of the climate.

The figures quoted come from "Measured facts" in `data-model.md` (per-decade averages). They must be rechecked if the data is retrieved again during implementation; no record of the current year is quoted in this static text, since it depends on the retrieval date.

## Goal

Show, night by night and city by city, how tropical nights went from rare events to a season in their own right, and how this season is spreading across the calendar (earlier in June, later in September) and across the map (from the Mediterranean coast toward Lyon, Bordeaux, Paris).

## Chosen form

**Stacked calendars in small multiples, with a detailed view per city.** For each station, a grid: one row per year (1950 at the top, the current year at the bottom), one column per night from May 1 to October 31 (184 columns), a cell lit when the night is tropical. Read together, the eight grids show two movements at once: the lit patch widens toward the bottom of each grid (time), and from one grid to the next (south to north).

Refinements compared to the initial idea (one calendar per city, to browse one by one):

- **Overview by default** rather than a selected city: the contrast between Nice, 85 tropical nights a year on average since 2020 (more than the 62 nights of July and August), and Strasbourg, almost empty, is the first message, and it requires seeing all eight at the same time, at the same scale.
- **Annual total in the margin** of each row (horizontal bar), in the detailed view: counting cells by eye is not possible, and the bar makes the acceleration of the 1990s and 2020s readable.
- **May to October window**, not the meteorological summer (June-August): the measured data show tropical nights from May 12 to October 24 (see "Measured facts" in `data-model.md`), and their spillover into May and September is part of the point.

Alternatives ruled out:

- **Curve of the annual count per city**: readable but commonplace, and it loses what the grid shows beyond the total (the date, the length of consecutive streaks, such as Nice's 66 nights in a row in 2022).
- **Warming stripes per city**: one color per year, effective but widely reused elsewhere, and, like the curve, it flattens the calendar into a single value.
- **A single grid, city chosen with the selector**: forces comparing from memory; the detailed view remains available for one city, but as a second step.

## Content (mount area)

- **City selector** above the grids: a "Toutes les villes" / "All cities" chip, then one chip per station, in the order of "Chosen stations" in `data-model.md` (Nice first, Strasbourg-Entzheim last). Only one chip active at a time.
- **Legend** on the same line as the selector or just below, always visible: "Nuit tropicale (minimale ≥ 20 °C)" / "Tropical night (minimum ≥ 20 °C)", "Nuit ordinaire" / "Ordinary night", "Pas encore observée" / "Not yet observed". A fourth entry "Donnée manquante" / "Missing data" only appears if the file contains at least one missing night (none with the measured data, see "Chosen stations" in `data-model.md`).
- **Overview** ("All cities" chip): the eight grids in small multiples, each titled with the station label and a summary line contrasting the first and the last complete decade of the table view ("15 par an dans les années 1950, 85 depuis 2020" / "15 a year in the 1950s, 85 since 2020"). Years marked by decade on the left edge of each grid (1950, 1960…), months at the top of the grid (month initial, only once per row of grids).
- **Detailed view** (a city's chip): the grid of that single station, large. Years marked by decade on the left, abbreviated months at the top ("mai", "juin"… / "May", "Jun"…), annual total bar to the right of each row, with the value shown for the hovered row and for the record year. Below the grid, a one-line note: period of the station's Météo-France reference series (SQR), or its absence for Nice (see "Homogenized series" in `data-model.md` and "Points to validate" in `technical-specifications.md`), and position of the station (altitude, "station d'aéroport" or "station urbaine").
- **Tooltip** on hover / tap (see "Interactions" below).

## Interactions

- **City selector:** switching from "All cities" to a city opens its detailed view; clicking a grid in the overview (anywhere in the grid or on its title) does the same with a mouse; by touch, only the grid title opens the detailed view (see "Responsive" below). Going back to "All cities" restores the overview. Changing city in the detailed view replaces the grid without going back through the overview.
- **Cell hover / tap, detailed view:** tooltip giving the night ("Nuit du 24 au 25 juillet 2003" / "Night of 24 to 25 July 2003"), the minimum temperature ("Minimale : 22,4 °C" / "Minimum: 22.4 °C") and the status of the night (tropical, ordinary, missing, not yet observed), then the year's total ("2003 : 16 nuits tropicales"). The hovered row is underlined with a rule across its full width. The "night of D-1 to D" label depends on the TN measurement window, to be confirmed (see "Chosen definition" in `data-model.md`); failing that, the tooltip gives the measurement date ("24 juillet 2003").
- **Row hover / tap, overview:** the cells there are too small to target a night; the tooltip only gives the station, the year and its total ("Nice, 2022 : 104 nuits tropicales"). The hovered row is underlined the same way.
- **Special totals in the tooltip and the total bar:**
  - current year: total followed by its date ("32 nuits au 22 septembre" / "32 nights as of 22 September");
  - incomplete year (see "Missing data and current year" in `data-model.md`): total shown as a minimum ("au moins 12 nuits" / "at least 12 nights"), hatched total bar;
  - tropical night outside the window (Perpignan, April 25, 2002, the only measured occurrence): counted in the total, flagged in the year's tooltip ("dont 1 hors de la période affichée" / "including 1 outside the period shown").
- **No animation or playback:** the grids are static, all years visible from the start. No zoom.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the city of the detailed view is restored; a link without a city opens the overview. The tooltip and the hovered row are not captured (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): no specific effect, since the visualization has neither autoplay nor transitions that move elements; switching from one view to the other is immediate in all cases.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Nombre moyen de nuits tropicales par an (minimale ≥ 20 °C), par station et par décennie" / "Average number of tropical nights per year (minimum ≥ 20 °C), by station and decade".
- **Rows:** the eight stations, in the order of the selector. First cell: station label.
- **Columns:** one per decade, "1950-1959" to "2010-2019", then the current decade bounded by the last complete year ("2020-2025"). Cell: average over the complete years of the decade (see "Missing data and current year" in `data-model.md`), to one decimal place ("15,0" / "15.0"), "n.d." / "n/a" if the decade has no complete year. Last column: **Record**, number of nights and year ("104 (2022)"), followed by "(en cours)" / "(ongoing)" when the record is the current year, which counts right away since a partial total can only increase.
- **No total row:** an average across stations as different as Nice and Strasbourg would be meaningless.
- **Not included:** the night-by-night detail and the TN values, which remain in the downloadable file (see "Download" in `data-model.md`).

## States

- **Loading:** the time it takes for `nights.json` to be retrieved and the grids to initialize; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty grids.
- **Empty:** not applicable. No filter can reduce the display to nothing (one city is always shown, or all eight), and each station carries all its years (see "Validation constraints" in `data-model.md`).

## Responsive

- **Overview:** four grids per row on large screens (two rows), two per row below about 640 px wide (four rows), where the cells become a texture of less than one pixel per night: the grid remains readable as a spreading patch, not night by night. On small screens, the overview exceeds the default height of the mount area (see "Mount area height" in `technical-specifications.md`).
- **Detailed view:** the grid takes the full width; below a cell width of 3 px, the tooltip only gives the year and its total, as in the overview, since a specific night can no longer be targeted by finger.
- **Touch:** tap on a cell or a row for the tooltip rather than hover; a second tap elsewhere closes it. In the overview, the first tap on a grid shows the row's tooltip; opening the detailed view goes through the grid title or the selector, so that the exploration tap does not open another view.
- **City selector:** chips that wrap, never collapsed ("controls always visible" rule, see "Rules common to all visualizations" in the general `technical-specifications.md`).

## Accessibility (known limitation)

The grids are drawn in Canvas (see "Rendering" in `technical-specifications.md`): the cells and their tooltips are accessible neither by keyboard nor by screen reader. Documented as a known limitation, in line with the project's default rule. The city selector remains keyboard accessible (native buttons), and each grid carries a text description (station, averages of the first and last decade, record year).

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

The station labels (Paris-Montsouris, Marseille-Marignane…) stay identical in both languages: they are proper names of places and Météo-France stations. Months, date and number formats, legend and tooltip labels are localized.
