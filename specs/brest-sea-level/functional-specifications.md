# Functional specification: The Sea Is Rising in Brest

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | La mer monte à Brest | Depuis 1807, le marégraphe de Brest mesure le niveau de la mer. Stable tout au long du dix-neuvième siècle, il a monté d'environ 24 cm depuis 1900, et deux fois et demie plus vite depuis 1993 qu'au vingtième siècle. |
| EN | The Sea Is Rising in Brest | Since 1807, the Brest tide gauge has recorded the level of the sea. Flat throughout the nineteenth century, it has risen by about 24 cm since 1900, two and a half times faster since 1993 than during the twentieth century. |

Figures: see "Measured statistics" in `data-model.md` (+23.6 cm for the 2014-2023 mean relative to the nineteenth-century mean level; 1.3 mm/yr over 1900-1992 versus 3.2 mm/yr over 1993-2023). In the frontmatter and body of `brest-sea-level.fr.md`, the spaces before ":" and ";" are non-breaking (U+00A0, see "Typography" in `style-guide.md`).

**Long FR presentation (proposal):**
> Au fond de la rade, sur un quai du port militaire, un marégraphe mesure la hauteur de la mer depuis 1807. C'est l'une des plus longues séries de mesures du niveau marin au monde : plus de deux siècles de moyennes annuelles, complétées au fil des ans à partir des archives par le Shom et l'université de La Rochelle, et rassemblées par le Permanent Service for Mean Sea Level (PSMSL), qui les ramène toutes à un même repère fixe.
>
> Pendant tout le dix-neuvième siècle, la mer ne bouge pas : d'une année à l'autre, elle monte ou descend de quelques centimètres, sans tendance. À partir du début du vingtième siècle, elle se met à monter, d'un peu plus d'un millimètre par an, puis de plus en plus vite : depuis 1993, elle gagne plus de trois millimètres par an. En moyenne sur la dernière décennie, elle se tient environ 24 cm plus haut qu'au dix-neuvième siècle.
>
> Le marégraphe mesure la mer par rapport au quai : si le sol s'enfonce, la mer semble monter d'autant. À Brest, ce mouvement du sol est faible : nul selon le nivellement historique, un enfoncement d'environ un millimètre par an selon des mesures de gravimétrie récentes. Il n'est pas retiré des chiffres présentés ici. La série a aussi ses trous : quelques années manquent au dix-neuvième siècle, et le bombardement de Brest en 1944 interrompt les mesures jusqu'en 1953. Aucune de ces lacunes n'est comblée.

**Long EN presentation (proposal):**
> At the far end of the roadstead, on a quay of the naval harbour, a tide gauge has been measuring the height of the sea since 1807. It is one of the longest sea-level records in the world: more than two centuries of annual means, gradually completed from the archives by Shom, the French navy's hydrographic and oceanographic service, and the University of La Rochelle, and gathered by the Permanent Service for Mean Sea Level (PSMSL), which refers them all to the same fixed benchmark.
>
> Throughout the nineteenth century, the sea does not move: from one year to the next it rises or falls by a few centimetres, with no trend. From the early twentieth century it starts to rise, by just over a millimetre a year, then faster and faster: since 1993 it has been gaining more than three millimetres a year. Averaged over the last decade, it stands about 24 cm higher than in the nineteenth century.
>
> The tide gauge measures the sea relative to the quay: if the ground sinks, the sea appears to rise by as much. In Brest this ground motion is small: none according to historical levelling, a sinking of about a millimetre a year according to recent gravity measurements. It is not removed from the figures shown here. The record also has holes: a few years are missing in the nineteenth century, and the bombing of Brest in 1944 interrupts the measurements until 1953. None of these gaps is filled in.

The exact location of the tide gauge ("sur un quai du port militaire") is to be confirmed before publication (see "Points to validate" in `technical-specifications.md`).

## Goal

Show, in a single panorama, that the mean sea level in Brest remained stable throughout the nineteenth century, that it has been rising since the early twentieth, and that this rise has been accelerating since the 1990s.

## Composition

**Chosen form: the unrolled quay.** A stone quay wall seen from the front, stretched across the full width of the mount area: time runs along the quay, from 1807 on the left to 2023 on the right, and height is read on the stone courses. Each year, the water laps the wall at its mean level: the waterline draws the series, and the water fills everything below. At the end of the quay, on the right, a graduated tide scale shows the level of the chosen year in large type.

**Departure from the initial idea** (a single waterline rising along a wall, animated): a single rising waterline shows the level, not the rate. Yet the subject of the visualization is the acceleration, which can only be seen by comparing periods with one another: time therefore has to be spread out on screen. The unrolled quay keeps the image of the wall and the water (stone courses as graduation, tide scale as readout), while showing at a glance two centuries and their three regimes. The rise "along the wall" remains present: it plays out on the tide scale during playback (see "Interactions").

**Also ruled out:**
- A sliding rate curve (30-year slope, year by year): at a single station, it already reaches 3 mm/yr around 1915-1920 and around 1950, and would suggest past accelerations as strong as the current one (see "What the series does not allow us to claim" in `data-model.md`).
- High-water marks engraved year by year on a vertical wall (one mark per year): 187 lines stacked over 36 cm of height merge together, and the chronological order disappears.

## Content (mount area)

- **The wall:** horizontal stone courses, one course per 5 cm of water height. The joints between courses serve as grid lines. Graduations engraved on the stone at the left edge: "0" for the nineteenth-century mean level (see "Reference level" in `data-model.md`), then "+10 cm", "+20 cm", etc. The height of the wall covers the actual extent of the data (from -7.2 cm in 1808 to +29.2 cm in 2023), with a margin.
- **The water:** surface formed by the annual mean of each year with a value, with water filled below down to the foot of the wall.
- **The gaps:** no water over the years without measurements (see "Actual coverage" in `data-model.md`), the stone stays dry there and a discreet "pas de mesure" label appears above gaps longer than three years. The 1944-1952 gap carries its own label: "1944-1952 : bombardement de Brest, pas de mesure" / "1944-1952: bombing of Brest, no measurements".
- **The years 1807-1835:** water surface as a dotted line, to signal corrected mid-tide levels rather than true means (details in the tooltip).
- **Three engraved trends:** one straight line per period (1807-1899, 1900-1992, 1993-2023), the period's regression line, drawn over the water and the stone (it passes through the middle of the annual means, so sometimes below the surface, sometimes above), labeled with its rate ("≈ 0 mm/an", "1,3 mm/an", "3,2 mm/an" / "≈ 0 mm/yr", "1.3 mm/yr", "3.2 mm/yr"). This is the direct reading of the acceleration.
- **The tide scale:** at the end of the quay, a vertical ruler graduated every centimeter and numbered every 10 cm, on the same vertical scale as the wall. The water rises on it to the level of the chosen year. Above it, in large type: the year and the deviation ("2023 : +29,2 cm"), and below it the caption "par rapport au niveau moyen du dix-neuvième siècle".
- **Controls**, above the quay, never overlaid: play button ("Voir la mer monter" / "Watch the sea rise", then Pause), year slider.
- Tooltip on hover/tap of the wall.

## Interactions

- **Initial view:** the whole quay, from 1807 to 2023, paused. All the water is drawn, the three trends are engraved, the tide scale shows 2023. No autoplay on load: the complete view is the most informative state, and a fifteen-second autoplay would hide the acceleration until its end.
- **Playback:** the button starts a single pass from 1807 to 2023 (about fifteen seconds, no speed selector). The water fills from left to right behind a playhead, the tide scale rises and falls with each year, and a period's trend is engraved when the playhead reaches the end of that period. At the end of the pass, the visualization stays on the complete view (no loop). Started from the complete view, playback restarts from 1807; started after a pause midway, it resumes where it stopped.
- **Pause:** freezes the playhead on the current year.
- **Year slider:** native `<input type="range">` from 1807 to 2023, one step per year. Moving it pauses playback and places the playhead on the chosen year: the water is drawn only up to that year, the tide scale shows that year, and only the trends of completed periods are engraved. At 2023, the complete view is restored. A year without measurements remains selectable: the tide scale is then dry and shows "1950 : pas de mesure".
- **Hover / tap on the wall:** vertical line snapped to the nearest year, tooltip with the year, the deviation from the reference level in cm to one decimal place, and the value in mm RLR in parentheses for the curious; additional labels when they apply: "niveau de mi-marée corrigé" (1807-1835), "année incomplète" (flag `Y`), "pas de mesure" (gap). Hover does not move the playhead, and also works to the right of it, on years whose water is not yet drawn.
- **No filter, no zoom:** a single series, entirely visible.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): a chosen year (pause or slider) is restored, the quay opening paused on that year, with water drawn up to it. Without a year in the link, the complete view.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the opening view is already the final state, paused; nothing changes on opening. The play button remains available, and playback runs normally once started. Nothing else to adapt: the playhead advances in one-year jumps and the tide scale follows without interpolated transition, with or without the preference (see "Animation" in `technical-specifications.md`).

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Niveau moyen de la mer à Brest par décennie, en cm par rapport au niveau moyen du dix-neuvième siècle (1807-1899)" / "Mean sea level in Brest by decade, in cm relative to the nineteenth-century mean (1807-1899)".
- **Rows:** one decade per row, from 1800 to 2020 (23 rows), in chronological order. First cell: the decade ("1800-1809"; "2020-2023" for the last, incomplete one).
- **Columns:** Years measured (number of years with values in the decade, e.g. "3" for 1800-1809, which starts in 1807); Mean level (mean of the annual deviations, in cm to one decimal place, signed: "-0,9", "+26,1"); Lowest year (year and deviation: "1808 (-7,2)"); Highest year (likewise: "2023 (+29,2)").
- Decades with gaps keep their row, the number of years measured indicating the missing share (e.g. "4" for 1940-1949). No decade is entirely empty.
- **No total row:** a mean over two centuries would erase the rise, which is the subject of the visualization. The rise itself is read by comparing the first and the last row.

## States

- **Loading:** the time for the JSON to be fetched and the quay to initialize; mount area reserved without layout shift.
- **Error:** JSON fetch failure → error message, no silent empty wall.
- **Empty:** not applicable (a single series, no filter).

## Responsive

- On a narrow screen, the tide scale leaves the end of the quay: it becomes a compact readout above the wall (year and deviation in large type, without the graduated ruler), to leave the full width to the two centuries. Threshold to be set during implementation (see "Responsive" in `technical-specifications.md`).
- Year graduations reduced to centuries and half-centuries (1850, 1900, 1950, 2000) below a certain width threshold.
- Trend labels reduced to the rate alone, without the period label, if space is lacking.
- Tap on the wall for the vertical line and the tooltip rather than hover; a second tap elsewhere closes them.
- Controls always above the quay, the button + slider row wrapping onto two lines if needed.

## Accessibility (known limitation)

Hover/tap on the wall (tooltip per year) is not natively accessible by keyboard or screen reader. Documented as a known limitation, in accordance with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The play button and the year slider remain keyboard accessible (standard `<button>`/`<input type="range">` elements), and the slider, together with the text readout of the tide scale, makes it possible to browse the years by keyboard.

Fallback: the table view (see "Table view" above) gives access to the same data, as a summary by decade, by keyboard and screen reader.

## Untranslated content

The names of the organizations and of the dataset (Permanent Service for Mean Sea Level, "Tide Gauge Data", RLR acronym) and the citation requested by the PSMSL remain as published by the source, in English in both languages. No other untranslated content: the labels shown in the quay (gaps, trends, tooltip) are interface copy, in the i18n dictionary.
