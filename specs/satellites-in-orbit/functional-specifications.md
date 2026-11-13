# Functional specification: The Orbital Rush

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | La ruée vers l'orbite | Une nuée qui grandit depuis 1957 : l'accélération du nombre de satellites en orbite autour de la Terre, et qui les a lancés. |
| EN | The Orbital Rush | A swarm growing since 1957: the accelerating number of satellites in orbit around Earth, and who launched them. |

**Long FR presentation:**
> Depuis Spoutnik en 1957, des milliers de satellites ont rejoint l'orbite terrestre : stations de navigation, satellites météo, télescopes, engins scientifiques, constellations de télécommunication. Cette visualisation anime, année par année, l'accumulation réelle des satellites toujours en orbite aujourd'hui (actifs ou non), à partir du catalogue tenu par le réseau de surveillance spatiale de l'US Space Force.
>
> Chaque point représente un satellite réel, positionné au moment de son lancement plutôt que sur sa véritable orbite (voir `technical-specifications.md`), coloré selon la zone qui l'a mis en orbite : États-Unis, Russie/URSS, Chine, Europe ou reste du monde. La nuée reste clairsemée pendant les premières décennies de l'ère spatiale, avant de s'épaissir nettement à partir des années deux mille.

**Long EN presentation:**
> Since Sputnik in 1957, thousands of satellites have reached Earth orbit: navigation systems, weather satellites, telescopes, scientific probes, telecommunication constellations. This visualization animates, year by year, the real accumulation of satellites still in orbit today (active or not), drawn from the catalog maintained by the US Space Force's space surveillance network.
>
> Each point represents a real satellite, positioned at the moment of its launch rather than on its actual orbit (see `technical-specifications.md`), colored by the launching region: United States, Russia/USSR, China, Europe, or the rest of the world. The swarm stays sparse through the early decades of the space age, then thickens sharply from the two-thousands onward.

## Goal

Show, through the progressive accumulation of points around a globe dressed with continents and oceans, the acceleration in the number of satellites in orbit since 1957, and the share of each major launching region in that growth.

## Content (mount area)

- Globe dressed with stylized continents and oceans (real Earth silhouette, no country borders, see "Rendering" in `technical-specifications.md`), slowly and continuously rotating, centered in the mount area.
- Swarm of points forming a halo around the globe, each point appearing at the launch time of the satellite it represents; the halo does not rotate with the globe (see "Point positioning" in `technical-specifications.md`).
- Legend of the five regions (color + localized name), doubling as an interactive filter (see "Region filter" below).
- Counter of the total number of satellites in orbit at the current simulated instant (see "Client-side derived fields" in `data-model.md`), recomputed according to the active regions.
- Indicator of the current simulated year.
- Playback controls: Play/Pause button; speed selector (Slow / Normal / Fast, Normal by default); year slider (`<input type="range">`), from the first to the last year of the dataset.

## Interactions

- **Autoplay:** starts as soon as the page loads, with no visitor action, in a continuous loop (like `bird-migrations`, unlike the initial choice made for this visualization): each pass runs from 1958 (first satellite in the dataset still in orbit, Vanguard 1: Sputnik 1, launched in 1957, has since fallen back, see `data-model.md`) to the most recent date in the dataset, pauses on that complete final state (a few seconds, to let "today, X satellites in orbit" read as a culmination rather than as one frame among others) then restarts from 1958.
- **Play/Pause:** stops or resumes the whole animation at the current simulated instant, including the globe's rotation and the end-of-pass pause (see "Accessibility" below: required for content that moves continuously without intervention).
- **Playback speed:** Slow / Normal / Fast, changes the duration of a full pass (Normal: about 25 seconds) without affecting the globe's rotation, which is purely decorative and paced independently (see "Animation" in `technical-specifications.md`).
- **Year slider:** one step per year, over the animated range (first to last year of the dataset). Moving it manually (drag or keyboard) pauses autoplay and immediately rebuilds the swarm up to the chosen year, including backward (same convention as the `light-pollution` and `monument-layers` sliders, see their respective `technical-specifications.md`). Moving it to its maximum value triggers the same final pause as the animation naturally reaching its end.
- **Region filter:** clickable legend, multi-select toggle, one entry per region (color + localized name), all five active by default. Disabling a region removes its points from the displayed swarm and from the total counter, without restarting the current animation.
- **No card per individual satellite:** neither hover nor tap on an isolated point (explicit decision, see scoping discussions): the angle of this visualization is overall density and acceleration, not satellite-by-satellite exploration; such an interaction would also be unreliable on such a dense swarm (points very close to each other toward the end of the animation).
- **Initial view:** all five regions active, simulated year at 1958, counter at zero, Normal speed, autoplay already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the active regions and the chosen year (pause or slider) are restored, the visualization then opening paused on that year. The globe's rotation, purely decorative, is not preserved.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the visualization opens paused on the last year, with the complete swarm and a still globe.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Satellites encore en orbite, par décennie de lancement et par zone" / "Satellites still in orbit, by launch decade and region".
- **Rows:** one per launch decade (1950-1959 to the current decade).
- **Columns:** the five launching regions, in filter order, then Total.
- **Total row:** all decades combined.

## States

- **Loading:** while `satellites.json` is retrieved and the animation initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty globe.
- **Empty:** all regions disabled via the filter → globe with no swarm and counter at zero, with a neutral message noting that no region is selected (a state intended by the visitor's interaction, to be distinguished from the error state above).

## Responsive

- Playback controls (Play/Pause, speed selector) and legend/filter repositioned below the globe rather than overlaid, with sufficiently large touch targets.
- The globe and its halo of points resize with the width of the mount area, with no change in behavior between touch and mouse beyond control targeting (no hover interaction to adapt, see "No card per individual satellite" above).

## Accessibility (known limitation)

The main interaction (animated globe in continuous rotation, accumulation of points) is not natively accessible by keyboard or screen reader. Documented as a known limitation, with no fallback, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The Play/Pause buttons, the legend/filter entries and the year slider remain keyboard accessible (standard `<button>`/`<input type="range">` elements), to make it possible to stop content that moves continuously without intervention (globe rotation included, see "Play/Pause" in "Interactions" above), to filter and to browse the timeline without depending on the animated globe itself.

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary, by keyboard and screen reader.

## Untranslated content

Region names (`nameFr` / `nameEn`, see `data-model.md`) are provided in both languages; no untranslated content to report beyond the general rules.
