# Functional specification: The Fault Lines

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Les lignes de faille | Plus d'un siècle de séismes majeurs rejoués en boucle : leurs pulses dessinent, sans qu'on ait besoin de le dire, les frontières des plaques tectoniques. |
| EN | The Fault Lines | Over a century of major earthquakes replayed on a loop: their pulses trace, without needing to be told to, the boundaries of the tectonic plates. |

**Long FR presentation (proposal):**
> Depuis le début du vingtième siècle, les sismographes du monde entier enregistrent avec précision la magnitude et la position de chaque séisme majeur. Ce planisphère rejoue, en boucle continue, plus d'un siècle de ces séismes (magnitude 6 et plus), chacun pulsant au moment réel de sa survenue.
>
> En arrière-plan, une fine ligne trace les frontières connues des plaques tectoniques, établies indépendamment par la géophysique. Les deux ne se recoupent pas par hasard : la quasi-totalité des séismes majeurs se concentre le long de ces frontières, la preuve la plus visible et la plus continue du mouvement des plaques qui composent la croûte terrestre.

**Long EN presentation (proposal):**
> Since the early twentieth century, seismographs worldwide have precisely recorded the magnitude and location of every major earthquake. This world map replays, on a continuous loop, over a century of these earthquakes (magnitude 6 and above), each pulsing at the real moment it occurred.
>
> In the background, a thin line traces the known boundaries of the tectonic plates, established independently through geophysics. The two aren't a coincidence: nearly all major earthquakes cluster along these boundaries, the most visible and continuous evidence of the plates that make up the Earth's crust moving against one another.

## Goal

Show, on a world map animated on a continuous loop since 1900, how major earthquakes cluster along tectonic plate boundaries, revealing this geological structure through the density of real events alone.

## Content (mount area)

- Illustrated world map (global land silhouette, rivers and relief, see "Rendering" in `technical-specifications.md`), with the tectonic plate boundaries drawn as a static overlay.
- Each earthquake pulses (a brief halo that expands and fades) at the simulated moment of its real occurrence, pulse size and intensity tied to magnitude.
- Brief text annotation (name and year) during the pulse of an earthquake selected as notable (see "Selection of earthquakes to annotate" in `data-model.md`).
- Indicator of the current simulated year, paired with a native year slider (`<input type="range">`, yearly granularity, added after the first implementation on the model of `monument-layers`/`satellites-in-orbit`).
- Playback controls: Play/Pause, speed selector (Slow / Normal / Fast), year slider.
- Zoom in/zoom out/reset zoom buttons, at the top right of the world map (same controls as `monument-layers`/`paris-trees`), in addition to mouse and touch zoom/pan.
- Contextual tooltip on hover/tap.

## Interactions

Same interactions as `volcanic-eruptions` (see its `functional-specifications.md`), applied to earthquakes:

- **Looping autoplay**, from load, over the whole covered period (since about 1900).
- **Play/Pause**, **speed** (Slow / Normal / Fast).
- **Year slider**: can be driven manually (interrupts autoplay, like pressing Pause) or automatically (follows the current playback). Since an earthquake is not a permanent point, jumping to a given year shows nothing fixed for that year: only the pulses triggered after that jump, when playback resumes, appear (see "Rendering" in `technical-specifications.md`).
- **Point hover/tap**: detail card (location, magnitude, depth, date). Since seismic points are not repeated fixed positions like volcanoes (each earthquake is a unique event, not a place that pulses several times), the detail card is only available at the moment of the pulse or just after (see "Rendering" in `technical-specifications.md` for the persistence duration), not permanently like the volcanoes of `volcanic-eruptions`.
- **Free zoom/pan** over the whole world map (mouse/wheel, touch), paired with zoom in/zoom out/reset buttons for visitors without a wheel or touch gestures.
- **Initial view:** whole world map visible, plate boundaries visible, autoplay already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the year and the framing are restored. A shared year restarts playback from that year instead of freezing the map on pause, since a paused image would have no earthquake to show (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused at the start of the period. Lacking a still image (the pulses fade), it only shows the plate boundaries until Play is pressed. A shared year then stays paused instead of restarting playback.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Séismes de magnitude 6 ou plus, par décennie" / "Earthquakes of magnitude 6 or more, by decade".
- **Rows:** one per decade (1900-1909 to the current decade).
- **Columns:** Earthquakes (magnitude 6 or more); Magnitude 7 or more; Magnitude 8 or more; Strongest earthquake (location as provided by the USGS, year when that label does not already contain it, magnitude).
- **Total row:** the whole period, with the strongest earthquake of the period.

## States

- **Loading:** the time it takes for the earthquakes/plate boundaries JSON and the basemap to be retrieved and the animation to initialize; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty map.
- **Empty:** not applicable here (the catalog stays fixed, no filter can reduce the display to nothing).

## Responsive

Same treatment as `volcanic-eruptions`/`bird-migrations` (see "Responsive" in their respective `functional-specifications.md`): pan/zoom by touch gesture, tooltip and detail card on tap, controls repositioned to stay usable on small screens.

## Accessibility (known limitation)

The main interaction (animated world map, zoom/pan, earthquake hover) is not natively accessible by keyboard or screen reader. Documented as a known limitation, with no fallback, in line with the project's default rule. The Play/Pause button remains keyboard accessible (standard `<button>` element), to allow stopping content that moves continuously without intervention.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

An earthquake's location (`place`, see `data-model.md`) is only available in English in the USGS source; shown as is in the French version of the page, without systematic translation (comparable to the municipality or species names of the site's other visualizations).
