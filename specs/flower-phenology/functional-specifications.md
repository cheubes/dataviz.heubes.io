# Functional specification: The Flower Calendar

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Le calendrier des fleurs | Quand fleurissent les plantes sauvages en France, et comment ce calendrier se déplace avec le réchauffement. |
| EN | The Flower Calendar | When wild plants flower in France, and how that calendar shifts with warming temperatures. |

**Long FR presentation:**
> La phénologie, l'étude des cycles saisonniers du vivant, est l'un des indices les plus sensibles du changement climatique. En France, des milliers d'observations citoyennes enregistrent chaque année les premières floraisons des plantes sauvages. Visualisées sur un calendrier circulaire, ces données révèlent la beauté des rythmes naturels et, dans leur dérive progressive, l'empreinte discrète du réchauffement.

**Long EN presentation:**
> Phenology, the study of seasonal cycles in nature, is one of the most sensitive indicators of climate change. Across France, thousands of citizen observations record each year the first flowering dates of wild plants. Visualised on a circular calendar, these data reveal the beauty of natural rhythms and, in their slow drift, the quiet imprint of warming temperatures.

## Goal

Show, on a circular calendar, the time of first flowering of wild plants in France, and how that time has shifted between two decades.

## Content (mount area)

- Circular calendar (two rings, each displaying an independently chosen decade), month labels around the edge.
- Species selector (checkboxes or list, up to 15 species displayed simultaneously).
- Two decade selectors, one per ring (see "Decade comparison" below).
- Central title ("Premières floraisons en France" / "First Flowerings in France").
- Contextual tooltip on hover/tap of an arc.

## Interactions

- **Species selector:** multi-select, up to 15 simultaneous species (beyond that, deselect the oldest selection or block an additional selection with a message, to be decided during implementation). Default selection: all species in the list (see "Species selection" in `data-model.md`), so that the first display shows the whole calendar from the start.
- **Decade comparison:** two independent selectors, one for the inner ring and one for the outer ring, each offering the six decades covered by the data (1970s to 2020s, see "Source dataset" in `data-model.md`). Free selection: no ordering constraint between the two rings (the inner ring can carry a more recent decade than the outer one if the visitor chooses so). **Default: 1970s on the inside, 2020s (2020 to today) on the outside** (explicit decision: the maximum available gap, to make the calendar's drift as visible as possible from the start).
- **Hover / tap on an arc:** tooltip with the species name, the median flowering day spelled out (e.g. "15 avril"), the change relative to the other displayed decade (e.g. "-8 jours").
- **Initial view:** complete calendar visible, all species selected, default decades (1970s inner / 2020s outer).
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the displayed species and each ring's decade are restored, including an empty selection. The tooltip is not captured (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): changing the decade redraws the rings without transition, instead of sliding the arcs.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Date médiane de première floraison, par espèce et par décennie" / "Median first-flowering date, by species and decade".
- **Rows:** the twelve species, in checkbox order. First cell: common name in the page language, followed by the scientific name in italics.
- **Columns:** one per decade, with the same labels as the ring selectors (`1970-1979`…), containing the median first-flowering date as day and month ("6 avril" / "April 6"), written "1er" for the first day of the month in French. Last column: **Shift**, difference in days between the last and the first decade, signed ("−26 j" / "−26 d"), a negative value meaning earlier flowering.
- **No total row:** an average across species would make no botanical sense.
- **Not included:** the 10th and 90th percentiles and the number of observations, which would double the width of an already dense table; they remain in the downloadable file.

## States

- **Loading:** while the phenology JSON is retrieved and the calendar initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty calendar.
- **Empty:** no species selected (if the visitor deselects everything) → message inviting them to choose at least one, rather than a calendar with no arcs and no explanation.

## Responsive

Adapted touch version (see "Responsive" in the general `technical-specifications.md`, applied here):

- Tap on an arc for the tooltip rather than hover; a second tap elsewhere closes it.
- Species selector as a dropdown list or horizontally scrolling chips below a certain width threshold, rather than a grid of checkboxes that would take up the full height.
- The circular calendar resizes while keeping its proportions; below a minimum diameter (to be defined during implementation), the month labels are reduced to initials (J, F, M...) rather than overlapping.

## Accessibility (known limitation)

The main interaction (SVG calendar, hover/tap on arcs) is not natively accessible by keyboard or screen reader. Documented as a known limitation, with no fallback, in accordance with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`).

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

Scientific species names (e.g. *Papaver rhoeas*) and botanical family names (e.g. Papaveraceae) remain in Latin, untranslated, in both languages: a standard taxonomic convention, not data to be localized. Only the common names (`nameFr` / `nameEn`) are localized.
