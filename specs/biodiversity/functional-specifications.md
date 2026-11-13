# Functional specification: French Biodiversity

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | La biodiversité française | Des millions d'observations citoyennes dessinent la carte du vivant en France. |
| EN | French Biodiversity | Millions of citizen observations map the living world across France. |

**Long FR presentation:**
> Chaque année, des millions d'observations d'espèces sont consignées en France par des naturalistes amateurs et professionnels, puis versées dans des bases de données mondiales. Visualisées ensemble, elles révèlent des concentrations, des absences, des corridors écologiques. Cette carte invite à filtrer par grand groupe taxonomique et par saison, pour voir comment le vivant occupe et traverse le territoire.

**Long EN presentation:**
> Every year, millions of species observations are recorded across France by amateur and professional naturalists, then contributed to global databases. Visualised together, they reveal concentrations, absences, ecological corridors. This map invites you to filter by major taxonomic group and by season, to see how life occupies and crosses the territory.

## Goal

Show the geographic distribution of observed living organisms in metropolitan France, and allow exploring its variations by major taxonomic group and by season.

## Content (mount area)

- Map of metropolitan France (illustrated silhouette, no tile background, see `technical-specifications.md`), with a grid of hexagonal cells colored according to the active taxonomic group.
- Legend of taxonomic groups (color + label), using the official categorical palette (see `technical-specifications.md`).
- Filter by taxonomic group (six groups + "Tous les groupes").
- Filter by season (four seasons + "Toutes saisons").
- "Données en direct" toggle (see "Live data" mode below).
- Contextual tooltip on hover/tap of a cell.

## Interactions

- **Taxonomic group filter:** single selection (radio), "Tous les groupes" by default. An active group recolors the grid according to the intensity of the selected group (instead of a mix of colors per cell).
- **Season filter:** single selection, "Toutes saisons" by default. Combines with the group filter (e.g. "Oiseaux" + "Hiver").
- **"Données en direct" toggle:** queries the GBIF search API for the current filter combination (see `data-model.md`) and displays individual occurrences as raw points on top of (or instead of) the hexagonal grid. A filter change while this mode is active automatically reruns the request. Returning to the default mode instantly redisplays the precomputed snapshot (no page reload).
- **Hover / tap on a cell:** tooltip with the number of observations (for the current filter), the dominant group if "Tous les groupes" is active, an example species.
- **No zoom or panning** (departure from the initial intent, explicit request during implementation): the map stays fixed, always framed on the whole silhouette of France (see "Initial view" below, which therefore describes the only view rather than a mere starting state). Simplifies interaction in favor of the filters and the tooltip alone; see "Accessibility" below for the effect on the already documented limitation.
- **Initial (and only) view:** whole metropolitan France visible, no active filter beyond the defaults ("Tous les groupes", "Toutes saisons"), default mode (not "live data").
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the group and the season are restored. The "Données en direct" toggle never is, since it queries GBIF: a link always opens the precomputed grid, and the recipient enables the mode themselves if they wish (see "State in the URL" in `technical-specifications.md`).

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Observations recensées par GBIF, par groupe taxonomique et par saison" / "Occurrences recorded by GBIF, by taxonomic group and season".
- **Rows:** the six taxonomic groups, in filter order.
- **Columns:** Winter; Spring; Summer; Autumn; Total. Number of observations, summed over all cells of the map.
- **Total row:** "Tous les groupes".
- Live data (GBIF toggle) is not included: the table describes the precomputed snapshot, like the default map.

## States

- **Loading:** while the precomputed JSON (`public/data/biodiversity/hexbins.json`) and the background silhouette are retrieved and the grid initializes; mount area reserved without layout shift (see "Visualization page" in `style-guide.md`).
- **Error:** failure to retrieve the precomputed JSON → error message, no silent empty map.
- **Empty:** a group + season combination with no observation at all (all cells at zero) → message saying so rather than a visually empty map with no explanation.
- **Loading (live data mode):** GBIF request in progress → indicator dedicated to the toggle, distinct from the initial loading state.
- **Error (live data mode):** failure or excessive slowness of the GBIF API → explicit message, offer to return to the default mode rather than getting stuck on a failure state.
- **Empty (live data mode):** zero GBIF results for the filter combination → dedicated message.

## Responsive

Adapted touch version (see "Responsive" in the general `technical-specifications.md`, applied here):

- Tooltip on tap rather than on hover; a second tap elsewhere on the map closes it.
- Filters (group, season) as buttons stacked/wrapping according to the available width, rather than a single forced horizontal row.

## Accessibility (known limitation)

The main interaction (map, hovering cells) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`).

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary, by keyboard and screen reader.

## Untranslated content

Scientific species names (`topSpecies`, e.g. *Turdus merula*) stay in Latin, untranslated, in both languages: standard taxonomic convention, not data to localize.
