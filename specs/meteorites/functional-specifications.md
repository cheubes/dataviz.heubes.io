# Functional specification: What Falls from the Sky

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: specified, not implemented.** Several choices remain to be confirmed (see "Points to validate" in `technical-specifications.md`).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Ce qui nous tombe du ciel | Plus de quarante-cinq mille météorites recensées : celles qu'on a vu tomber suivent les hommes, celles qu'on a trouvées au sol dessinent les glaces de l'Antarctique et les grands déserts. |
| EN | What Falls from the Sky | More than forty-five thousand recorded meteorites: those seen falling follow where people live, those found on the ground trace the Antarctic ice and the great deserts. |

Themes: `space` and `earth` (see "Theme" in the general `data-model.md`). `space` for the object itself, which came from space; `earth` because what the map gives to read is a terrestrial geography, that of ice, deserts and human settlement, closer to `earthquakes` or `volcanic-eruptions` than to `satellites-in-orbit`. Effect on related visualizations: see "Points to validate" in `technical-specifications.md`.

**Long FR presentation (proposal):**
> La Meteoritical Society recense chaque météorite reconnue par la communauté scientifique. Ce planisphère en montre plus de quarante-cinq mille, dans l'état du catalogue en 2013, chacune à l'endroit où elle a été ramassée, sa taille selon sa masse.
>
> Deux populations s'y opposent. Un peu plus d'un millier ont été vues tomber : un témoin a suivi leur chute, puis on les a récupérées. Elles se dispersent là où vivent les hommes, en Europe, en Inde, au Japon, dans l'est des États-Unis. Toutes les autres ont été trouvées au sol, parfois des milliers d'années après leur chute, et elles s'entassent ailleurs : sur les glaces de l'Antarctique, où l'écoulement du glacier les concentre au pied des montagnes et où une pierre sombre se repère de loin, et dans les déserts chauds, du Sahara à Oman, où l'air sec les conserve et où rien ne les cache. Depuis la découverte des premiers champs de glace à météorites, en 1969, ces campagnes de ramassage fournissent l'essentiel du catalogue.
>
> Les météorites tombent pourtant à peu près partout de la même façon. La carte ne montre donc pas où il en tombe, mais où l'on a pu les voir et les chercher. Et elle en oublie : près d'un tiers des météorites trouvées n'ont pas de position connue, dont des milliers de pierres sahariennes vendues sur les marchés sans lieu de découverte.

**Long EN presentation (proposal):**
> The Meteoritical Society records every meteorite recognized by the scientific community. This world map shows more than forty-five thousand of them, as the catalog stood in 2013, each one where it was picked up, sized by its mass.
>
> Two populations stand apart. Just over a thousand were seen falling: a witness followed their fall, and they were then recovered. They are scattered where people live, in Europe, India, Japan, the eastern United States. All the others were found on the ground, sometimes thousands of years after they fell, and they pile up elsewhere: on the Antarctic ice, where the flow of the glaciers gathers them at the foot of mountains and a dark stone stands out from afar, and in hot deserts, from the Sahara to Oman, where dry air preserves them and nothing hides them. Since the first meteorite-rich ice fields were discovered in 1969, these collecting campaigns have supplied most of the catalog.
>
> Yet meteorites fall more or less evenly everywhere. So the map does not show where they fall, but where people could see them and look for them. And it leaves some out: nearly a third of the meteorites found have no known location, among them thousands of Saharan stones sold at markets with no record of where they were found.

Figures and wording of both presentations to be reviewed once the data file is produced (see "Measurements" in `data-model.md`).

## Goal

Show, on a single world map, that the geography of known meteorites is that of their discovery and not that of their fall: observed falls follow the human population, finds follow the terrains where a stone is preserved and spotted (Antarctic ice, hot deserts). The latitudinal profile makes this contrast measurable, despite the stacks of points that partly hide it on the map.

## Content (mount area)

- **Illustrated world map** (world land silhouette, rivers and relief, same files as `earthquakes` and `volcanic-eruptions`, see "Map technology" in `technical-specifications.md`).
- **One point per positioned meteorite** (31,963, see "Positions" in `data-model.md`): color by population (seen falling / found), size by mass class (less than 100 g, 100 g to 10 kg, 10 kg to 1 t, 1 t and more). Observed falls are drawn on top of finds. No artificial scattering of points that share the same position (see "Stacking" below).
- **Latitudinal profile**, to the right of the world map: for each 10° latitude band, aligned with the map, two mirrored bars, the share of observed falls (to the left) and the share of finds (to the right) located in that band. Shares rather than counts, to compare the shape of the two distributions despite a 1 to 28 ratio between the two populations.
- **Antarctic inset**, placed in the South Pacific, an empty area of the world map: Antarctica seen from the South Pole, with the same points. The world map stretches and squashes high latitudes, where more than 70% of positioned finds are located.
- **Legend**, always visible: the two populations (color swatch, label, total count, e.g. "Vues tomber : 1 107"), the four size classes.
- **Unknown location counter**, below the legend: "13 752 météorites sans position connue, non représentées" / "13,752 meteorites with no known location, not shown", followed by the share specific to the displayed population.
- **Display toggle**: All / Seen falling / Found.
- **Zoom in / zoom out / reset buttons**, at the top right of the world map (same controls as `earthquakes`).
- **Detail card** on hover or tap.

### Stacking

Antarctic campaigns often assign a single position to an entire ice field: up to 4,761 meteorites on the same point (see "Concentration" in `data-model.md`). These stacks are neither scattered nor aggregated into a proportional symbol: that would mean inventing positions or changing the encoding from one region to another. They remain one point, and two elements restore the counts: the detail card, which announces the number of meteorites at the same location, and the latitudinal profile, which counts everything.

## Interactions

- **Display toggle** (three radio buttons): "Toutes" (default), "Vues tomber", "Trouvées". The hidden population fades out through an opacity transition; the latitudinal profile keeps both series but dims the one hidden on the map. The unknown location counter follows the displayed population.
- **Hover / tap on a point**: detail card with name, class (`recclass`), mass (formatted according to the language, in g, kg or t), and "Vue tomber en 1947" / "Trouvée en 1920" (or "année inconnue"). When several meteorites of the displayed population share the hovered position, the card announces their number ("4 761 météorites à cet emplacement"), their split between falls and finds where applicable, and details the most massive one.
- **Hover / tap on a profile band**: counts and shares of each population in the band (e.g. "70° S à 80° S : 0 vue tomber, 14 920 trouvées, 48 % des trouvailles positionnées").
- **Hover / tap on the Antarctic inset**: same detail card as on the world map. The inset can neither be zoomed nor panned.
- **Free zoom / pan** on the world map (mouse wheel, touch gesture, buttons), useful to separate points in deserts and along coasts. Points keep their on-screen size whatever the zoom level. The latitudinal profile follows the vertical zoom, so that its bands stay aligned with the map's latitudes.
- **Initial view:** whole world map, both populations displayed, no playback or animation.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the display toggle and the framing are restored (see "State in the URL" in `technical-specifications.md`).
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the visualization has no autoplay, so it opens in its normal state. Zooming with the buttons is immediate instead of animated. The display toggle fade is kept, since it moves nothing.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Météorites vues tomber et trouvées, par bande de latitude" / "Meteorites seen falling and found, by latitude band".
- **Rows:** one per 10° band, from north to south (from "80° N à 90° N" to "80° S à 90° S", 18 rows), then a "Position inconnue" / "Unknown location" row.
- **Columns:** Seen falling; Found; Share of positioned finds (percentage of all positioned finds that the band contains, empty for the "Position inconnue" row); Most massive (name, mass, and "vue tomber" or "trouvée").
- **Total row:** all meteorites in the file, unknown locations included (1,107 seen falling, 44,608 found), with the most massive one (Hoba, 60 t).
- The table makes legible what stacking hides on the map: the two Antarctic bands alone contain 22,098 finds, and no observed fall.

## States

- **Loading:** while `meteorites.json` and the basemap are retrieved and the map is drawn; mount area reserved without layout shift.
- **Error:** failure to retrieve the JSON or the basemap, error message, no silent empty map.
- **Empty:** not applicable. The catalog is fixed and each toggle state displays at least one population.

## Responsive

- Pan / zoom by touch gesture, detail card on tap, like `earthquakes`.
- Below 640 px wide: the latitudinal profile shrinks to its bars, without band labels (counts and shares remain available on tap); the Antarctic inset moves below the world map instead of overlapping it; the legend and the toggle wrap onto several lines.
- The controls (toggle, legend, counter, zoom buttons) always remain visible, in line with the general rule.

## Accessibility (known limitation)

The main interaction (hovering points on a Canvas, zoom / pan, hovering the profile) is not natively accessible by keyboard or screen reader. The display toggle (native radio buttons) and the zoom buttons remain keyboard accessible.

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary by latitude band, by keyboard and screen reader.

## Untranslated content

Meteorite names are official names assigned by the Meteoritical Society, most often that of the place of discovery (e.g. "Northwest Africa 7701", "Queen Alexandra Range 02100"): displayed as is in both languages. The petrological class (`recclass`, e.g. `L6`, `Iron, IIIAB`, `Martian (shergottite)`) is a scientific nomenclature from the source, also displayed without translation.
