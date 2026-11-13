# Functional specification: Where France Has Burned

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Où la France a brûlé | Plus de cinquante mille incendies de forêt recensés depuis 2006 : une carte qui les rejoue, année après année, à travers le pays. |
| EN | Where France Has Burned | Over fifty thousand forest fires recorded since 2006: a map replaying them, year by year, across the country. |

**Long FR presentation:**
> Depuis 2006, la Base de Données sur les Incendies de Forêts en France (BDIFF) recense chaque incendie de forêt survenu sur le territoire : sa commune, sa date, la surface qu'il a parcourue. Plus de cinquante mille foyers y sont aujourd'hui répertoriés, très majoritairement concentrés sur le pourtour méditerranéen.
>
> Cette carte rejoue, année après année, où ces incendies se sont produits : chaque point apparaît à la commune où il a démarré, sa taille reflétant la surface brûlée. La part du pourtour méditerranéen dans le total annuel recule doucement sur la période (de sept incendies sur dix en 2006-2010 à six sur dix en 2021-2025), tandis que des foyers plus nombreux apparaissent ailleurs : Bretagne, massif alpin, Normandie, Vosges. Le feu reste concentré sur ses terres historiques, mais il ne s'y cantonne plus tout à fait.

**Long EN presentation:**
> Since 2006, the French Forest Fire Database (BDIFF) has recorded every forest fire on French territory: its municipality, its date, the area it burned. More than fifty thousand fires are now listed, overwhelmingly concentrated around the Mediterranean rim.
>
> This map replays, year by year, where these fires occurred: each point appears at the municipality where it started, its size reflecting the area burned. The Mediterranean rim's share of the annual total slowly recedes over the period (from seven fires in ten in 2006-2010 to six in ten in 2021-2025), while more fires appear elsewhere: Brittany, the Alps, Normandy, the Vosges. Fire remains concentrated on its historical ground, but it no longer stays fully confined to it.

Angle confirmed empirically on the actual data aggregated by year and by department (see "Measured statistics" in `data-model.md`), not presumed: a real but moderate shift, worded accordingly rather than exaggerated.

## Goal

Show, through a year-by-year reconstruction on an actual map of mainland France, where forest fires occur and whether their geographic distribution changes over time.

## Content (mount area)

- Illustrated map of mainland France (silhouette, no tile background, see "Basemap" in `technical-specifications.md`).
- Points representing each fire of the current simulated year (that year only, no accumulation of previous years, see "Interactions" below), at the position of its starting municipality (no more precise coordinates in the source, see "Source fields used" in `data-model.md`), size proportional to the burned area (see "Point size" in `technical-specifications.md`).
- Indicator of the current simulated year.
- Counter of the number of fires and the total burned area for the current simulated year.
- Playback controls: Play/Pause button; speed selector (Slow / Normal / Fast); native year slider (`<input type="range">`), from 2006 to the most recent year available (see "Chosen scope" in `data-model.md`).
- Zoom in/zoom out/reset buttons overlaid on the map, doubling mouse and touch zoom/pan.
- Detail card on hover/tap of a fire, with a link to its official record on the BDIFF site.

## Interactions

- **Autoplay:** starts as soon as the page loads on the first available year (2006), in a continuous loop up to the most recent year, same convention as `satellites-in-orbit`, `light-pollution` and `monument-layers` (see their `functional-specifications.md`): brief pause on the last year before starting over.
- **Play/Pause:** stops or resumes playback at the current simulated year.
- **Playback speed:** Slow / Normal / Fast, "Normal" by default (same three speeds as the site's other animated visualizations).
- **Year slider:** one step per year. Moving it manually (drag or keyboard) pauses autoplay and immediately replaces the displayed points with those of the chosen year, including backwards (same convention as the slider of `light-pollution`, see its `functional-specifications.md`).
- **Zoom/pan:** free on the map (mouse/wheel, touch), to observe a regional concentration (e.g. the Mediterranean rim) once it has appeared. Doubled by zoom in/zoom out/reset buttons (same controls as `monument-layers`/`paris-trees`), disabled at the bounds of the zoom scale.
- **Hover/tap on a fire:** detail card (municipality, department, date, burned area, suspected cause if known, link to the official BDIFF record). The link is only clickable once the card is pinned (click/tap on the point), for the same reason as `monument-layers`: on simple hover, the card follows the pointer and could not be reached without closing before the link can be clicked.
- **Initial view:** whole map of France visible, year 2006 displayed, autoplay already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the year and the framing are restored. A shared year opens the map paused on that year (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused on the last year covered.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Incendies de forêt recensés par la BDIFF, par année" / "Forest fires recorded by the BDIFF, by year".
- **Rows:** one per year covered (2006 to 2025), in chronological order.
- **Columns:** Year; Fires (count); Burned area (sum for the year, in hectares, rounded to the hectare); Largest fire (municipality, department code in parentheses, and area in hectares).
- **Total row:** "2006-2025": total number of fires, total area, and largest fire of the whole period.

## States

- **Loading:** while `fires.json` and the basemap are retrieved and the animation initializes; mount area reserved with no layout shift.
- **Error:** failure to retrieve one of the data files → error message, no silent empty map.
- **Empty:** a year with no fire recorded in the dataset kept → no error message, the map simply stays empty for that year. Case not encountered in the actual data (1,347 incidents in the quietest year, 2024, see "Measured statistics" in `data-model.md`), state handled by construction (the rendering loop iterates over the year's subset, potentially empty) rather than removed for lack of a real case.

## Responsive

- Playback controls and year indicator repositioned below the map rather than overlaid, with sufficiently large touch targets.
- Pan/zoom by touch gesture; detail card on tap of a fire rather than on hover.

## Accessibility (known limitation)

The main interaction (animated map, zoom/pan, hovering over fires) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The Play/Pause button, the speed selector, the year slider and the zoom buttons remain keyboard accessible (standard `<button>`/`<select>`/`<input type="range">` elements), to allow stopping content that moves continuously without intervention (playback loops indefinitely, same rationale as `satellites-in-orbit`) and browsing the timeline without depending on the animated map itself.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

Municipality and department names are only available in French in the source; displayed as is in the English version of the page, without translation (same convention as `paris-trees` and `monument-layers`, see their `functional-specifications.md`).
