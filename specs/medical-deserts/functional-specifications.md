# Functional specification: Tomorrow's Medical Desert

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Le désert médical de demain | Trente-quatre mille sept cent vingt-huit communes, deux cartes en une : l'accès aux médecins généralistes aujourd'hui, et ce qu'il devient sans ceux qui partent bientôt à la retraite. |
| EN | Tomorrow's Medical Desert | Thirty-four thousand seven hundred and twenty-eight communes, two maps in one: access to general practitioners today, and what it becomes without those about to retire. |

**Long FR presentation (proposal):**
> L'accessibilité potentielle localisée (APL) mesure, commune par commune, le nombre de consultations de médecine générale réellement accessibles par habitant et par an. Calculé chaque année par la DREES, cet indicateur existe aussi dans une version restreinte aux médecins de moins de soixante-cinq ans : une photographie de ce que deviendrait l'accès aux soins si les praticiens les plus proches de la retraite cessaient leur activité.
>
> Cette carte fait basculer la France entière d'un état à l'autre. Certaines communes ne bougent presque pas ; d'autres, dont l'accès aux soins ne tient aujourd'hui qu'à un seul médecin âgé, basculent d'un coup dans le désert médical.

**Long EN presentation (proposal):**
> The APL indicator (accessibilité potentielle localisée) measures, commune by commune, the number of general practitioner consultations actually accessible per resident per year. Calculated annually by DREES, this indicator also exists in a version restricted to doctors under sixty-five: a snapshot of what healthcare access would become if the practitioners closest to retirement stopped working.
>
> This map switches the whole of France from one state to the other. Some communes barely move; others, whose access to care today hinges on a single aging doctor, fall into medical desert territory overnight.

## Goal

Show, on an actual map of the communes of metropolitan France, the gap between current access to general practitioners and access once the practitioners close to retirement have left.

## Content (mount area)

- Choropleth map of metropolitan France, one shape per commune (34,728, including Paris, Lyon and Marseille aggregated from their arrondissements, see "Join" in `data-model.md`), colored according to its APL level (see "Palette" in `technical-specifications.md`).
- "Aujourd'hui" / "Sans les médecins de 65 ans et plus" toggle, which recolors the whole map.
- Legend of the sequential palette, with the label of the measure ("APL (consultations accessibles par habitant et par an)") so that the scale remains understandable independently of the presentation text.
- Detail card on hover/tap of a commune (name, department, current APL, APL without those aged 65 and over, population).

## Interactions

- **Today/tomorrow toggle:** a control (two-state button) recolors the whole map between the two APL values, with a short animated color transition rather than an instant change (see "Rendering" in `technical-specifications.md`), so that the visitor sees the affected communes tip over, not just notices a different state.
- **Hover/tap on a commune:** detail card with both APL values, whatever the state of the toggle (both figures remain visible together in the card, not only the one currently shown on the map).
- **Zoom/pan:** free on the map (mouse/wheel, touch), necessary to distinguish the communes in dense areas (urban areas).
- **No filter by department/region:** the whole territory remains visible at all times, zoom is enough to explore a specific area.
- **Initial view:** whole of metropolitan France visible, "Aujourd'hui" state of the toggle.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the state of the toggle and the framing are restored. A link taken in the "Sans les médecins de 65 ans et plus" state opens the map directly in that state, without replaying the toggle's fade.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the zoom buttons reframe the map without animation. The fade between the "today" and "tomorrow" maps is kept: it changes opacity without moving anything.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Accès aux médecins généralistes par département, aujourd'hui et sans les médecins de 65 ans et plus" / "Access to general practitioners by department, today and without doctors aged 65+".
- **Rows:** the 96 departments of metropolitan France, in the order of their code (`01` to `95`, `2A` and `2B` in their place). First cell: code and name of the department. The department is the only readable level between the commune (34,728 rows) and the region (13 rows, too coarse for the angle of the visualization), hence a longer table than average.
- **Columns:** Population; APL today; APL without those aged 65 and over; Population below the threshold today (%); Population below the threshold tomorrow (%). A department's APL is the mean of the APL of its communes weighted by their population. The threshold is the one that structures the map's palette, 1.5 consultations per resident per year (see "Palette" in `technical-specifications.md`).
- **Total row:** "France métropolitaine", computed in the same way over all communes.
- **Department names:** absent from the data file (only the code is there). Static list of the 96 official names (Code officiel géographique of INSEE) in the table module, not translated, like the commune names.

## States

- **Loading:** the time for `communes.json` to be fetched and the map to initialize; mount area reserved without layout shift. Large file (9.0 MB, 2.3 MB compressed, see "File size" in `data-model.md`): a loading progress indicator (percentage, reading of the network stream) is displayed during the download, in the spirit of `paris-trees`.
- **Error:** JSON fetch failure → error message, no silent empty map.
- **Empty:** not applicable here (no filter that could reduce the display to nothing).

## Responsive

- Pan/zoom by touch gesture, detail card on tap of a commune rather than on hover.
- Toggle and legend repositioned below the map rather than overlaid.

## Accessibility (known limitation)

The main interaction (choropleth map, zoom/pan, hover over communes) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in accordance with the project's default rule. The today/tomorrow toggle remains keyboard accessible (standard native element).

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary, by keyboard and screen reader.

## Untranslated content

Commune and department names remain identical in both languages (proper nouns); no untranslated content to report beyond the general rules.
