# Functional specification: The Grape Harvest Almanac

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | L'almanach des vendanges | Depuis 1354, la date des vendanges raconte l'histoire du climat en France : sécheresses extrêmes, étés sans fin, crises viticoles et records de précocité. |
| EN | The Grape Harvest Almanac | Since 1354, French grape harvest dates have traced the history of climate in France: extreme droughts, summers that never came, vineyard crises, and record-breaking early harvests. |

**Long FR presentation:**
> Chaque année depuis le quatorzième siècle, des viticulteurs ont noté la date à laquelle ils vendangeaient. Mises bout à bout, ces dates composent l'une des plus longues séries climatiques directement observées au monde : six cent cinquante ans d'étés plus ou moins chauds, racontés depuis sept régions viticoles françaises. On y lit des sécheresses qui ont vidé les rivières, un été qui n'a jamais eu lieu, une crise qui a failli faire disparaître le vignoble, et des records de précocité tout récents.

**Long EN presentation:**
> Every year since the fourteenth century, winegrowers have recorded the date they started picking grapes. Strung together, these dates form one of the longest directly observed climate series in the world: six hundred and fifty years of warmer or cooler summers, told through seven French winegrowing regions. They record droughts that emptied rivers, a summer that never came, a crisis that nearly wiped out French vineyards, and very recent records for early harvests.

## Goal

Show, on a continuous timeline, the evolution of grape harvest dates in seven French winegrowing regions since 1354, and let the reader explore four historical episodes that explain it.

## Content (mount area)

- Horizontal timeline (SVG), graduated year axis (1354-2007) on the x-axis; harvest day on the y-axis, with no ticks displayed (exact value read via hover/tap, see "Interactions" below).
- One thin curve per region (raw annual values) and a bolder overlaid curve (twenty-year moving average), seven regions in total.
- Four historical landmarks on the year axis (see "Historical landmarks" in `data-model.md`): vertical line, clickable/tappable.
- Legend doubling as a region filter (see "Region selection" below).
- Contextual tooltip on hover/tap of a curve.

## Interactions

- **View:** full 1354-2007 range always visible (no zoom or scrolling), seven regions active, raw curves and moving averages all displayed.
- **Hover / tap on a curve:** vertical cursor (crosshair) snapped to the nearest year, tooltip listing, for each active region with data that year, its exact harvest date (e.g. "Bourgogne : 22 octobre").
- **Region selection:** seven checkboxes (one per region), doubling the legend. Unchecking a region hides both its curves (raw and moving average). All seven regions are checked by default.
- **Click/tap on a historical landmark:** opens a detail panel (title, description, see "Historical landmarks" in `data-model.md`); a second tap elsewhere (mobile) or a new click on the landmark (desktop, to close it) closes it, same behavior as the `flower-phenology` tooltip.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the checked regions are restored, including an empty selection. The tooltip and the panel of a historical landmark are not captured (see "State in the URL" in `technical-specifications.md`).

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Date moyenne des vendanges, par siècle et par région (nombre d'années renseignées entre parenthèses)" / "Average harvest date, by century and region (number of recorded years in brackets)".
- **Rows:** one century per row, from the 14th to the 21st.
- **Columns:** one per region, in checkbox order. Cell: average harvest date over the years with data in the century (August 31 + average offset), followed by the number of years in brackets ("26 septembre (99)"), so that the reader can judge the reliability of an average that sometimes rests on only a handful of years. "n.d." when the region has no year in the century.
- **No total row:** an average across all periods would erase the advance of the harvests, which is the subject of the visualization.

## States

- **Loading:** the time for the harvest JSON to be fetched and the timeline to initialize; mount area reserved with no layout shift.
- **Error:** JSON fetch failure → error message, no silent empty timeline.
- **Empty:** no region checked (if the visitor unchecks everything) → message inviting them to check at least one, rather than a timeline with no curve and no explanation.

## Responsive

Adapted touch version (see "Responsive" in the general `technical-specifications.md`, applied here):

- Tap on a curve for the cursor/tooltip rather than hover; a second tap elsewhere closes it.
- Region selector as horizontally scrolling chips below a certain width threshold, rather than a row of checkboxes that would take too much room next to the legend.

## Accessibility (known limitation)

The main interaction (SVG timeline, hover/tap on curves and landmarks) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`).

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.
