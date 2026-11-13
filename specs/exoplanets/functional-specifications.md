# Functional specification: The Discovered Worlds

Supplements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: specified, not implemented.** Several choices remain to be confirmed (see "Points to validate" in `technical-specifications.md`).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Les mondes découverts | Plus de six mille planètes confirmées autour d'autres étoiles, apparues année après année depuis 1992 : chaque méthode de détection laisse sa signature dans le nuage, et la place d'une jumelle de la Terre reste presque vide. |
| EN | The Discovered Worlds | More than six thousand confirmed planets around other stars, appearing year after year since 1992: each detection method leaves its own signature in the cloud, and the spot where an Earth twin would sit remains almost empty. |

Theme: `space` (see "Theme" in the general `data-model.md`). The only other visualization in this theme at this stage: `satellites-in-orbit`, which becomes its related visualization.

**Long FR presentation (proposal):**
> En 1992, deux planètes sont découvertes autour d'un pulsar, le cadavre d'une étoile. En 1995, une troisième autour d'une étoile semblable au Soleil, 51 Pegasi. Trente ans plus tard, le NASA Exoplanet Archive en recense plus de six mille, toutes confirmées par des publications scientifiques. Ce graphique les fait apparaître année après année, chacune placée selon sa masse et sa distance à son étoile, les planètes du Système solaire servant de repères.
>
> Presque aucune de ces planètes n'a été vue directement, comme on voit Jupiter dans un télescope : chacune a été trahie par un effet indirect, et chaque méthode ne voit qu'une partie des mondes possibles. Le transit, une baisse de lumière quand la planète passe devant son étoile, repère surtout des planètes très proches de leur étoile, et le télescope Kepler en a validé des centaines d'un coup en 2014 et en 2016. La vitesse radiale, le léger balancement de l'étoile, trouve des planètes massives. La microlentille gravitationnelle voit plus loin, l'imagerie directe seulement des géantes très éloignées. Le nuage dessine donc autant les limites de nos instruments que la population réelle des planètes. Et la région où tomberait une jumelle de la Terre, à la bonne distance d'une étoile comme le Soleil, reste presque vide.

**Long EN presentation (proposal):**
> In 1992, two planets were found orbiting a pulsar, the remnant of a dead star. In 1995, a third one around a Sun-like star, 51 Pegasi. Thirty years later, the NASA Exoplanet Archive lists more than six thousand, all confirmed in the scientific literature. This chart makes them appear year after year, each placed by its mass and its distance to its star, with the planets of the Solar System as landmarks.
>
> Almost none of these planets has been seen the way we see Jupiter through a telescope: each one was betrayed by an indirect effect, and each method only sees part of the possible worlds. The transit, a dip in light as the planet crosses its star, mostly finds planets very close to their star, and the Kepler telescope validated hundreds of them at once in 2014 and 2016. Radial velocity, the slight wobble of the star, finds massive planets. Gravitational microlensing reaches further out, direct imaging only very distant giants. The cloud therefore draws the limits of our instruments as much as the real population of planets. And the region where an Earth twin would fall, at the right distance from a Sun-like star, remains almost empty.

Figures and wording of both presentations to be reviewed once the data file is produced (see "Measurements" in `data-model.md`).

## Goal

Show, through the year-by-year accumulation of points in a mass × distance-to-star plane, that each detection method occupies its own region of this plane, that discoveries arrive in waves tied to instruments (Kepler in 2014 and 2016), and that planets comparable to those of the Solar System, Earth first among them, remain largely out of reach.

## Content (mount area)

- **Scatter plot:** one point per plottable planet (6,327, see "Preprocessing" in `data-model.md`), x = semi-major axis (average distance to the star, in astronomical units), y = mass (in Earth masses), two graduated logarithmic axes (see "Axes" in `technical-specifications.md`). Color by detection method family. Each point appears at the simulated moment of its discovery, with a brief flash, then stays in place.
- **Solar System landmarks:** eight fixed marks (Mercury to Neptune), present from the opening, with their name as a direct, localized label. Visually distinct from the exoplanets (see "Rendering" in `technical-specifications.md`), never filtered.
- **Discovery strip:** below the scatter plot, an annual histogram stacked by family (1992 to 2026), which fills up as playback progresses and carries a marker for the simulated year. It makes visible the 2014 and 2016 peaks that the scatter plot alone only shows through density.
- **Legend of the five families** (color + localized name + number of planets at the simulated year), doubling as an interactive filter (see "Method filter" below).
- **Counter:** total number of confirmed planets at the simulated year, among the active families (see "Client-side derived fields" in `data-model.md`), with a discreet mention of the number of planets not plotted for lack of a known mass or distance.
- **Simulated year indicator**, with the "année en cours" label for the last year when it is partial.
- **Playback controls:** Play/Pause; speed (Slow / Normal / Fast, Normal by default); year slider (`<input type="range">`), from 1992 to the last year in the file.
- **Detail card** on hover or tap of a point (see "Interactions").

## Interactions

- **Autoplay:** starts as soon as the page loads, in a continuous loop, same convention as `satellites-in-orbit`: each pass goes from 1992 to the last year in the file, holds on the complete scatter plot, then starts again from 1992.
- **Play/Pause:** stops or resumes playback at the current simulated year, end-of-pass hold included.
- **Speed:** Slow / Normal / Fast, changes the duration of a pass (see "Animation" in `technical-specifications.md`).
- **Year slider:** one step per year. Moving it (drag or keyboard) pauses playback and immediately rebuilds the scatter plot and the strip up to the end of the chosen year, including backwards (same convention as `satellites-in-orbit` and `monument-layers`). Bringing it to its maximum value triggers the same final hold as the natural end of playback.
- **Method filter:** clickable legend, multi-select toggle, one entry per family, all five active by default. Deactivating a family removes its points from the scatter plot, its share of the strip and its planets from the counter, without interrupting playback. Isolating a single family is the most direct way to see its "signature".
- **Hover/tap on a point:** detail card with the planet's name, the discovery year, the method, the instrument or observatory, the mass (in Earth masses, and in Jupiter masses above 100 Earth masses) and the semi-major axis. The nature of the values is always stated when it is not a direct measurement: "masse minimale", "masse estimée d'après le rayon", "distance calculée d'après la période" (see "Nature of the values" in `data-model.md`). The point closest to the pointer is selected, within a radius of a few pixels; a point hidden by the filter is never targeted.
- **Hover on a Solar System landmark:** no card, the direct label is enough.
- **No zoom or pan:** the two logarithmic axes cover the full range of the data in a single view (see "Points to validate" in `technical-specifications.md`).
- **Initial view:** five active families, simulated year 1992, empty scatter plot except for the Solar System landmarks, Normal speed, playback already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the active families and the chosen year (pause or slider) are restored; the visualization then opens paused on that year, with the scatter plot rebuilt up to its end.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the visualization opens paused on the last year, with the scatter plot and strip complete, without appearance flashes. A year carried by the URL takes precedence and stays paused. If the visitor starts playback, the appearance flashes remain suppressed: they are momentary variations in size and opacity, with no informative value, which the preference invites us to remove.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Exoplanètes confirmées, par année de découverte et méthode de détection" / "Confirmed exoplanets, by discovery year and detection method", supplemented by the data retrieval date, which situates the partial current year.
- **Rows:** one per year, from 1992 to the last year in the file, including years without any discovery (1993) so that the timeline remains continuous (35 rows as of 2026-09-24).
- **Columns:** the five families, in legend order (Transit, Radial velocity, Microlensing, Direct imaging, Other methods), then Total.
- **Aggregation:** all confirmed planets in the file, including the 39 not plotted on the chart for lack of a mass or distance: the table describes discoveries, not points.
- **Total row:** all years combined (6,366 planets as of 2026-09-24).

## States

- **Loading:** while `exoplanets.json` is retrieved and the axes and landmarks are drawn; mount area reserved with no layout shift.
- **Error:** failure to retrieve the JSON → error message, no silent empty chart.
- **Empty:** all families deactivated via the filter → axes and Solar System landmarks only, empty strip, counter at zero, with a neutral message noting that no method is selected (a state intended by the visitor, to be distinguished from the error).

## Responsive

- Legend/filter, counter and playback controls below the chart rather than overlaid, with sufficiently large touch targets (same layout as `satellites-in-orbit`).
- Scatter plot and strip resized with the width of the mount area; axis ticks lightened on small screens (one tick per power of ten instead of the intermediate marks, see "Axes" in `technical-specifications.md`).
- Solar System labels: all eight names on large screens; on small screens, only Earth, Jupiter and Neptune, the other landmarks remaining drawn without a name (see "Points to validate" in `technical-specifications.md`).
- Detail card triggered on tap rather than on hover, closed by a tap elsewhere; scrolling the page with a finger over the chart remains possible (no zoom to capture).

## Accessibility (known limitation)

The main interaction (animated scatter plot drawn on Canvas, hovering over points) is not natively accessible by keyboard or screen reader. Documented as a known limitation, in line with the project's default rule. The Play/Pause buttons, the legend/filter entries, the speed selector and the year slider remain keyboard accessible (standard `<button>`/`<input type="range">` elements), to stop moving content without intervention, filter, and browse the timeline. The counter and the simulated year are not announced continuously during playback (an `aria-live` region chattering at every frame); they are announced when the slider is released.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

The names of planets (`name`) and of instruments or observatories (`facility`) are official designations provided in English by the archive ("Haute-Provence Observatory", "Transiting Exoplanet Survey Satellite (TESS)"): displayed as is in the French version, like the USGS place names in `earthquakes`. The names of the method families and of the Solar System planets are provided in both languages (see `data-model.md`).
