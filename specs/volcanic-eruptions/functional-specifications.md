# Functional specification: The Pulse of the Earth

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Le pouls du globe | Dix mille ans d'éruptions volcaniques rejouées en boucle : la Terre n'a jamais cessé de trembler, la ceinture de feu à peine visible au repos. |
| EN | The Pulse of the Earth | Ten thousand years of volcanic eruptions replayed on a loop: the Earth has never stopped shaking, the ring of fire barely visible at rest. |

**Long FR presentation:**
> Le Global Volcanism Program de la Smithsonian Institution recense chaque éruption volcanique connue depuis le début de l'Holocène, il y a environ dix mille ans : mille deux cent quatorze volcans, plus de onze mille éruptions documentées, de l'observation directe la plus récente à la trace géologique la plus ancienne.
>
> Ce planisphère fait pulser chaque volcan au moment réel de ses éruptions, rejouées en boucle continue sur l'ensemble de la période. Le rythme s'accélère nettement à mesure que la lecture approche du présent : en partie parce que le volcanisme s'est réellement concentré à certaines périodes, mais aussi, pour une large part, parce que les éruptions récentes sont bien mieux documentées que celles d'il y a plusieurs millénaires, un biais du catalogue à garder à l'esprit plutôt qu'une accélération univoque du phénomène lui-même.

**Long EN presentation:**
> The Smithsonian Institution's Global Volcanism Program records every known volcanic eruption since the start of the Holocene, roughly ten thousand years ago: one thousand two hundred and fourteen volcanoes, over eleven thousand documented eruptions, from the most recent direct observation to the oldest geological trace.
>
> This world map makes every volcano pulse at the real moment of its eruptions, replayed on a continuous loop across the whole period. The pace clearly picks up as the playback nears the present: partly because volcanism has genuinely clustered in certain periods, but largely because recent eruptions are far better documented than those from several millennia ago, a bias in the catalog worth keeping in mind, not a one-directional acceleration of the phenomenon itself.

## Goal

Show, on a world map animated in a continuous loop over ten thousand years, the real rhythm of volcanic eruptions worldwide and their geographic concentration, while conveying the completeness bias of the catalog on which it is based.

## Content (mount area)

- Illustrated world map (global Earth silhouette, rivers and relief, see "Rendering" in `technical-specifications.md`).
- Each volcano pulses (a brief halo that expands and fades) at the simulated time of each of its real eruptions, with the size and intensity of the pulse tied to the volcanic explosivity index (VEI).
- Brief text annotation (name and year) during the pulse of an eruption selected as notable (see "Selection of eruptions to annotate" in `data-model.md`).
- Indicator of the current simulated year, doubled by a native year slider (`<input type="range">`, yearly granularity, same model as `earthquakes`).
- Playback controls: Play/Pause, speed selector (Slow / Normal / Fast), year slider.
- Zoom in/zoom out/reset zoom buttons, at the top right of the world map (same controls as `earthquakes`), in addition to mouse and touch zoom/pan.
- Contextual tooltip on hover/tap of a volcano (fixed position, at any point during playback).

## Interactions

- **Looping autoplay:** starts as soon as the page loads and loops continuously over the whole covered period (ten thousand years), like `bird-migrations`, not a single pass with a frozen final state, unlike `monument-layers`/`glacier-retreat`/`endangered-species` (see "Chosen angle" in `data-model.md`).
- **Play/Pause:** stops or resumes playback at the current simulated instant.
- **Speed:** Slow / Normal / Fast, same factors as `bird-migrations` (×0.5 / ×1 / ×2).
- **Year slider:** can be driven manually (interrupts autoplay, like pressing Pause) or automatically (follows the current playback). Jumping to a year clears the ongoing pulses without displaying frozen ones for that year: only those triggered when playback resumes appear. Volcanoes at rest and their detail card remain available.
- **Volcano hover/tap:** detail card (name, location, total number of eruptions recorded over the period, most recent eruption, maximum VEI reached), accessible at any time, regardless of whether the volcano is pulsing at the current simulated instant.
- **Zoom/pan:** free over the whole world map (mouse/wheel, touch, zoom in/zoom out/reset buttons), useful to tell apart volcanoes close together along the same belt (Indonesia, Japan, Central America in particular).
- **Initial view:** whole world map visible, autoplay already running, somewhere in the cycle (not necessarily at the very start of the ten thousand years).
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the year and the framing are restored. As for `earthquakes`, a shared year restarts playback from that year instead of freezing the map in pause, since a paused image would only show the volcanoes at rest, identical for every year (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused at the start of the period, with the volcanoes at rest and their detail cards available. A shared year then stays paused instead of restarting playback.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Éruptions recensées par millénaire" / "Recorded eruptions by millennium".
- **Rows:** one millennium per row, from 8000 BC to today, with the same year formats as the visualization.
- **Columns:** Eruptions; Eruptions with an explosivity index of 4 or more; Active volcanoes (at least one eruption in the millennium).
- **Total row:** the whole period.
- The table makes the documentation bias described in the presentation directly readable: the last complete millennium alone accounts for nearly two thirds of the recorded eruptions.

## States

- **Loading:** while the volcanoes/eruptions JSON and the basemap are retrieved and the animation initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty map.
- **Empty:** not applicable here (the catalog stays fixed, no filter can reduce the display to nothing).

## Responsive

Same treatment as `bird-migrations`/`monarch-migration` (see "Responsive" in their respective `functional-specifications.md`): pan/zoom by touch gesture, tooltip and detail card on tap, controls repositioned to remain usable on small screens.

## Accessibility (known limitation)

The main interaction (animated world map, zoom/pan, hovering over volcanoes) is not natively accessible by keyboard or screen reader. Documented as a known limitation, with no fallback, in line with the project's default rule. The Play/Pause button remains keyboard accessible (standard `<button>` element), to make it possible to stop content that moves continuously without intervention.

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary, by keyboard and screen reader.

## Untranslated content

Volcano names remain identical or nearly identical in both languages in most cases (proper nouns). The country displayed in the detail card (the GVP's `Country`, see "Source fields used" in `data-model.md`) remains in English in both languages, like the volcano names: it is source data from the catalog, not editorial text of the site, same treatment as the other untranslated fields.
