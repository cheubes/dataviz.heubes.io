# Functional specification: Layers of Heritage

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Les strates du patrimoine | Quarante-cinq mille monuments historiques français, de leur plus ancienne pierre connue à aujourd'hui : une carte qui se construit sous vos yeux, siècle après siècle. |
| EN | Layers of Heritage | Forty-five thousand French historic monuments, from their oldest known stone to today: a map that builds itself before your eyes, century after century. |

**Long FR presentation:**
> Depuis 1840, l'État protège des monuments jugés dignes de conservation : châteaux, églises, ponts, lavoirs, gares... La base Mérimée du ministère de la Culture recense aujourd'hui près de quarante-cinq mille édifices protégés en France métropolitaine, chacun daté de sa plus ancienne campagne de construction connue.
>
> Cette carte les fait apparaître dans l'ordre chronologique de leur construction plutôt que de leur protection : des vestiges antiques épars jusqu'à la densité du bâti du dix-neuvième siècle, en passant par les grandes vagues romane, gothique et classique. Une teinte de plus en plus sombre marque la profondeur du temps : chaque point ajouté est une strate de plus dans la construction du pays.

**Long EN presentation:**
> Since 1840, the French state has protected buildings deemed worth preserving: castles, churches, bridges, wash houses, railway stations... The Ministry of Culture's Mérimée database now lists nearly forty-five thousand protected buildings in mainland France, each dated to its oldest known construction phase.
>
> This map reveals them in the chronological order of their construction rather than their protection: from scattered antique remains to the density of nineteenth-century building, passing through the great Romanesque, Gothic, and Classical waves. A progressively darker shade marks the depth of time: each point added is one more layer in the construction of the country.

## Goal

To show, through the chronological accumulation of points on a real map of metropolitan France, the major construction layers of protected heritage, from the oldest to the most recent.

## Content (mount area)

- Illustrated map of metropolitan France (silhouette, no tile basemap, see "Rendering" in `technical-specifications.md`), enriched with the main rivers and roads to provide geographic landmarks (added after the first implementation, user feedback, see "Preprocessing" in `data-model.md` for the selection criteria).
- Points representing each monument, appearing at its real position at the simulated moment corresponding to its construction century, with an increasingly dark shade as simulated time advances (see "Palette" in `technical-specifications.md`).
- Indicator of the current simulated period (century, or archaeological era for the ancient base, see "Client-side derived fields" in `data-model.md`).
- Counter of the number of monuments visible at the current simulated instant (see "Client-side derived fields" in `data-model.md`).
- Simple filter by nature of protection (Classified / Registered / Both).
- Playback controls: Play/Pause button; speed selector (Slow / Normal / Fast); year slider (`<input type="range">`), from year 0 to the most recent construction year kept.
- Detail card on hover/tap of a monument, with a link to its reference record.

## Interactions

- **Autoplay:** starts as soon as the page loads, in a continuous loop (same convention as `satellites-in-orbit` and `light-pollution`, see their `functional-specifications.md`). Monuments predating year 0 (Prehistory to the end of the Iron Age, 4.75% of the dataset, see "Interpreting the construction century" in `data-model.md`) appear already present on the map from the very first instant of each pass, as a motionless base: with a strictly linear time scale over such a wide range (from -20,000 to today), their very low density would otherwise have compressed the Romanesque, Gothic and Classical waves into a fraction of a second of the animation (decision validated with the user, see "Animation" in `technical-specifications.md`). The animated simulated time then runs through the timeline from year 0 to the most recent construction year kept; once the map is fully built, a short pause (same mechanism as `satellites-in-orbit`) precedes the return to the base and a new pass.
- **Play/Pause:** stops or resumes the accumulation at the current simulated instant (including during the final pause of a pass).
- **Playback speed:** Slow / Normal / Fast, "Normal" by default (same three speeds as `satellites-in-orbit` and `light-pollution`). Changes the pace of the accumulation, not the duration of the final pause.
- **Protection filter:** Classified / Registered / Both, "Both" by default. Changes the displayed points and the counter, without restarting the running animation.
- **Year slider:** one step per year, over the animated range (year 0 to the most recent construction year kept, see "Autoplay" above; the ancient base is not part of it, always displayed whatever the slider position). Moving it manually (drag or keyboard) pauses autoplay and immediately rebuilds the map up to the chosen year, including backwards (same convention as the `light-pollution` slider, see its `functional-specifications.md`, except that here it replays an accumulation rather than recoloring a frozen state). Moving it to its maximum value triggers the same final pause as the animation naturally reaching its end.
- **Zoom/pan:** free on the map (mouse/wheel, touch), to observe a regional concentration (e.g. the Loire châteaux, the Parisian density) once it has appeared. Backed by zoom in/zoom out/reset buttons overlaid on the map (same controls as `paris-trees`, see its `functional-specifications.md`), disabled at the bounds of the zoom scale.
- **Hover/tap on a monument:** detail card (name, commune/department, construction century, nature of the protection, building category, link to the reference record on the Plateforme Ouverte du Patrimoine of the Ministry of Culture, added after the first implementation, user feedback). Works at any time, including during playback, on monuments that have already appeared. The link is only clickable once the card is pinned (click/tap on the monument): on simple hover, the card follows the pointer and would be impossible to reach without closing before the link could be clicked.
- **Initial view:** "Both" filter, whole map of France visible with the ancient base already displayed (see "Autoplay" above), autoplay already running, counter reflecting this base rather than zero (1,790 monuments with the "Both" filter, fewer with a single protection filter).
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the protection filter, the year and the framing are restored. A shared year opens the map paused on the accumulation reached at that year (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the map opens paused on the complete accumulation, at the last construction year of the dataset.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Monuments historiques par période de construction et par protection" / "Historic monuments by construction period and protection".
- **Rows:** in chronological order, one per period for monuments that have one (Paleolithic to the Gallo-Roman era), then one per century for monuments dated by century, with the same labels as the visualization.
- **Columns:** Classified; Registered; Total.
- **Total row:** all monuments.

## States

- **Loading:** while `monuments.json` and the basemap are fetched and the animation initializes; mount area reserved without layout shift.
- **Error:** failure to fetch either of the two files → error message, no silent empty map.
- **Empty:** a single "Classified" or "Registered" filter that leaves no monument at a given instant (a situation expected only at the very beginning of playback, before the first monument of the active filter appears) → no error message, the map simply remains empty until the first point of the chosen filter.

## Responsive

- Playback controls, protection filter and century indicator repositioned below the map rather than overlaid, with sufficiently large touch targets.
- Pan/zoom by touch gesture; detail card on tap on a monument rather than on hover.

## Accessibility (known limitation)

The main interaction (animated map, zoom/pan, hover on monuments) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without fallback, in accordance with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The Play/Pause button, the speed selector, the protection filter, the year slider and the zoom buttons remain keyboard-accessible (standard `<button>`/`<select>`/`<input type="range">` elements), to make it possible to stop content that moves continuously without intervention (necessary since playback loops indefinitely, same rationale as `satellites-in-orbit`), to browse the timeline and to zoom without depending on the animated map itself.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

Monument names (`name`), their communes (`commune`) and their categories (`category`) are only available in French in the source; displayed as is in the English version of the page, without translation (comparable to the species names of `paris-trees`, see its `functional-specifications.md`).
