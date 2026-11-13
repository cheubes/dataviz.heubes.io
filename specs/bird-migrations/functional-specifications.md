# Functional specification: The Migration Routes

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

Revised during implementation to stay honest about what the visualization actually shows, rather than the draft's original wording ("thousands of birds"), which described the general phenomenon rather than the actual content of the map; revised again with each species addition (Montagu's harrier, common cuckoo, then European honey buzzard, see "History" in `data-model.md`).

| Language | Title | Summary |
|---|---|---|
| FR | Les routes de migration | Les trajectoires GPS réelles de cigognes, busards et coucous suivis individuellement entre l'Europe et l'Afrique. |
| EN | The Migration Routes | The real GPS trajectories of individually-tracked storks, harriers and cuckoos between Europe and Africa. |

The title and summary were not revised when the honey buzzard (fourth species) was added: "storks, harriers and cuckoos" remains an open editorial phrasing rather than an exhaustive list, and staying accurate text by text at each species addition brings nothing more than an occasional one-off review.

**Long FR presentation:**
> Chaque année, des rapaces, des cigognes et d'autres oiseaux équipés de balises GPS quittent l'Europe pour rejoindre l'Afrique, avant d'effectuer le trajet inverse au printemps. Cette carte anime les trajectoires réelles d'individus suivis dans le cadre de quatre études scientifiques : la cigogne blanche (*Ciconia ciconia*, étude « LifeTrack White Stork Bavaria », Institut Max Planck du comportement animal, 2014-2023), le busard cendré (*Circus pygargus*, Trierweiler et al. 2014), le coucou gris (*Cuculus canorus*, Thorup et al. 2020) et la bondrée apivore (*Pernis apivorus*, Byholm et al. 2025).
>
> Chaque ligne est le voyage réel d'un oiseau, reconstitué à partir de ses positions GPS ou satellite. Les trajectoires révèlent des stratégies et des couloirs très différents selon les espèces : certains oiseaux rejoignent l'Afrique australe en quelques mois, d'autres s'arrêtent bien plus au nord ; le coucou gris emprunte une route en boucle vers l'ouest à travers le Sahel, documentée ici avec un jeu de données plus clairsemé (balises satellite à faible fréquence) que celui des autres espèces ; la bondrée apivore, elle, passe parfois près d'une année entière quasi immobile sur son site d'hivernage avant de repartir.

**Long EN presentation:**
> Every year, GPS-tagged raptors, storks and other birds leave Europe for Africa, before making the return trip in spring. This map animates the real trajectories of individuals tracked as part of four scientific studies: the white stork (*Ciconia ciconia*, "LifeTrack White Stork Bavaria" study, Max Planck Institute of Animal Behavior, 2014-2023), Montagu's harrier (*Circus pygargus*, Trierweiler et al. 2014), the common cuckoo (*Cuculus canorus*, Thorup et al. 2020) and the European honey buzzard (*Pernis apivorus*, Byholm et al. 2025).
>
> Each line is the real journey of a bird, reconstructed from its GPS or satellite positions. The trajectories reveal very different strategies and corridors depending on the species: some birds reach southern Africa within a few months, others stop much further north; the common cuckoo takes a looping route west across the Sahel, documented here with a sparser dataset (low-frequency satellite tags) than the other species; the honey buzzard sometimes stays nearly motionless at its wintering site for almost a full year before setting off again.

## Goal

Show, by animating real GPS trajectories, the migration corridors between Europe and Africa, and the diversity of strategies across species.

## Content (mount area)

- Illustrated Europe/Africa map (silhouette, no tile background, see `technical-specifications.md`).
- Controls on two rows: the species filter alone on the first; the direction filter, then a visual separator (`|`), then the view toggle and the playback controls (in the animated view) on the second.
- Species filter (multi-select toggle).
- Direction filter (Autumn / Spring / Both).
- View toggle (Animated / Static).
- Playback controls, only in the animated view: Play/Pause button, indicator of the current simulated date, speed selector (Slow / Normal / Fast).
- Contextual tooltip on hover/tap of a trajectory.

## Interactions

- **Species filter:** multi-select toggle, one button per species (color + localized common name), all active by default ("All species"). Deactivating a species removes its trajectories from the current view (animated or static), without restarting the animation. Four species (white stork, Montagu's harrier, common cuckoo, European honey buzzard, see "Study selection" in `data-model.md`); the filter is still built dynamically from the data to accommodate other species without any code change.
- **Direction filter:** Autumn / Spring / Both, "Both" by default. Shared between the two views (see "View toggle" below).
  - In the animated view, "Both" replays a single calendar cycle (January to December) in which autumn and spring trajectories each appear at their actual time of year: the scene shows the complete round trip in a single cycle, not two sequential playbacks.
- **View toggle (Animated / Static):** "Animated" by default (see "Initial view" below).
  - **Static view:** each active trajectory (same species/direction filters as the animated view) is drawn in full at once, from the first to the last point, rather than as a point moving over time. Solid line for autumn trajectories, dashed for spring ones (the two directions of the same individual often overlap almost exactly once drawn in full; the dashing distinguishes them without breaking the per-species color code). The playback controls (Play/Pause, speed, simulated date) disappear, being irrelevant in this view; the animation is suspended (no background computation or rendering) as long as the static view is active.
  - Switching views keeps the current species/direction filters and zoom/pan level.
- **Autoplay (animated view):** the animation starts as soon as the page loads and loops continuously, without any action from the visitor (explicit decision, see scoping discussions). The Play/Pause button allows interrupting it at any time (see "Accessibility" below: necessary for content that moves continuously without intervention).
- **Speed (animated view):** Slow / Normal / Fast selector, "Normal" by default (complete annual cycle in 36 seconds, i.e. ~3 seconds per simulated month of migration). Slow = ×0.5 (72 seconds per cycle), Fast = ×2 (18 seconds).
- **Hover / tap on a trajectory:** highlighting of the individual's trajectory, tooltip with the species, the anonymized identifier ("Individual CC_001"), the total distance traveled (km) and the migration duration (days), see "Client-side derived fields" in `data-model.md`. Works in both views: in the animated view, only the moving head of the trajectory triggers the tooltip; in the static view, any point of the complete path triggers it (easier to target, since the whole route is permanently visible).
- **Zoom / pan:** over the illustrated Europe/Africa area (no free panning beyond). Shared between the two views.
- **Initial view:** entire Europe/Africa area visible, all species active, direction "Both", "Animated" view with the animation already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the active species, the direction, the view, the framing and, if playback was paused, the simulated day are restored; a link taken while paused opens the animation paused on that day. Neither the speed nor the highlighted individual is shared.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the visualization opens on the static view, complete routes drawn, without playback: a paused image of the animated view would only show the position of each bird. A link carrying a day keeps the animated view, paused on that day.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Trajets de migration suivis, par individu" / "Tracked migration journeys, by individual".
- **Rows:** one journey per row (32), grouped by species in the order of the filters, then by individual, autumn before spring. First cell: common name of the species followed by the individual's identifier.
- **Columns:** Direction (autumn, spring); Departure (date); Arrival (date); Duration (days); Distance traveled (km). Duration and distance are computed as in the visualization's detail card.
- **No total row:** adding up journeys of different species would make no sense.

## States

- **Loading:** while the trajectories and the basemap (silhouette, rivers, relief, see `data-model.md` and `technical-specifications.md`) are retrieved and the animation initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve any of this data → error message, no silent empty map.
- **Empty:** species + direction combination with no available trajectory (e.g. a species with no spring data in the chosen study) → message saying so rather than a map with no trajectories and no explanation.

## Responsive

Adapted touch version (see "Responsive" in the general `technical-specifications.md`, applied here):

- Pan/zoom of the map by touch gesture.
- Tooltip and highlighting on tap on a trajectory rather than on hover.
- Controls (filters, speed selector) repositioned below the map rather than overlaid, with sufficiently large touch targets.

## Accessibility (known limitation)

The main interaction (animated map, zoom/pan, hovering over trajectories) is not natively accessible by keyboard or screen reader. Documented as a known limitation, with no fallback, in accordance with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The Play/Pause button (see "Interactions") nevertheless remains keyboard accessible (standard `<button>` element), to allow stopping content that moves continuously without intervention.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

Scientific species names are not displayed directly in the interface (only the localized common names are, see `data-model.md`); no untranslated content to report beyond the general rules.
