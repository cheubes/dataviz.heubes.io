# Functional specification: Paris, Tree by Tree

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

**Status: implemented.**

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Paris, arbre par arbre | 194 000 arbres de Paris, recensés un par un : explorez-les par quartier, par genre ou par nom d'espèce. |
| EN | Paris, Tree by Tree | 194,000 of Paris's trees, mapped one by one: explore them by district, genus, or species name. |

**Long FR presentation:**
> La Ville de Paris tient un inventaire de son patrimoine arboré : arbres d'alignement le long des rues, arbres des jardins, des bois et des équipements municipaux. Cette carte affiche 194 000 arbres de cet inventaire, chacun positionné à son emplacement réel dans les vingt arrondissements de la ville (le jeu source recense aussi environ 25 000 arbres plantés dans des cimetières parisiens extraterritoriaux, en dehors de la ville elle-même ; ils ne sont pas repris ici, hors du périmètre géographique de cette carte).
>
> Aucune thèse à suivre ici : c'est une forêt à parcourir. Zoomez sur un quartier, filtrez par genre dominant (platanes, marronniers, tilleuls...), ou cherchez une espèce précise pour voir où elle pousse dans la ville. L'inventaire, mis à jour chaque semaine par la Ville de Paris, ne couvre pas les arbres du domaine privé ni la totalité du patrimoine municipal : une photographie partielle, mais la plus complète disponible en open data.

**Long EN presentation:**
> The City of Paris maintains an inventory of its tree stock: street trees, park trees, woodland trees, and trees on municipal grounds. This map displays 194,000 trees from that inventory, each placed at its real location within the city's twenty districts (the source dataset also lists about 25,000 trees planted in extraterritorial Paris-owned cemeteries, outside the city itself; they aren't included here, outside this map's geographic scope).
>
> There's no argument to follow here: it's a forest to wander through. Zoom into a district, filter by dominant genus (plane trees, horse chestnuts, lime trees...), or search for a specific species to see where it grows across the city. The inventory, updated weekly by the City of Paris, doesn't cover privately-owned trees or the full extent of the municipal tree stock: a partial picture, but the most complete one available as open data.

## Goal

Let visitors freely explore, without an imposed thesis, the entire tree stock recorded by the City of Paris: where the trees grow, which genera dominate, where to find a specific species.

## Content (mount area)

- Stylized map of Paris's twenty arrondissements (silhouette, no tile background, see "Rendering" in `technical-specifications.md`), with one point per tree at its real position.
- Legend of the eight dominant genera + "Other" (color + localized common name), doubling as an interactive filter (see "Genus filter" below).
- Search field (common or scientific name of a species).
- Visual highlighting of the trees marked "remarkable" by the City of Paris.
- Counter of the number of currently visible trees (see "Client-side derived fields" in `data-model.md`).
- Detail card on hover/tap of a tree.
- **Added after another review** (user feedback: the gardens with national status, Luxembourg, Jardin des Plantes, Tuileries, Palais-Royal, remain empty areas on the map, absent from the municipal inventory, see "Noted absence" in `data-model.md`): "Jardins nationaux (OpenStreetMap)" checkbox, **enabled by default** (adjusted following later user feedback; initially disabled). Displays these four gardens as hollow rings in a light gray outside the categorical palette (not solid points colored by genus: almost all of these trees have neither a genus nor any other known attribute, see "Source dataset" in `data-model.md`). They take part in neither the genus filter, nor the search, nor the visible tree counter: a dataset too different in reliability to be silently mixed with the rest (see "Source dataset" in `data-model.md`). An `*` reference mark on the checkbox label points to a footnote below the map, which carries the caveat (partial community coverage, approximate positions): **moved there and made permanent following user feedback** (visible whether the box is checked or not, rather than a text shown only when the box is checked).

## Interactions

- **Genus filter:** clickable legend, multi-select toggle, one entry per dominant genus plus "Other", all active by default. Disabling a genus removes its points from the map and from the visible counter.
- **Species search:** text field, matching on the common name or the scientific name (see `searchText` in `data-model.md`). Matching trees stay at full opacity, the others fade without disappearing (keeps the geographic context of the whole map rather than filtering strictly); empty field → all trees at full opacity.
- **Zoom/pan:** free across the whole map of Paris (mouse/wheel, touch). **Added after a review** (user feedback: zoom control buttons, moved to the top right during a later review, initially at the bottom right): three buttons overlaid at the top right of the map (zoom in, zoom out, reset to the initial view), for explicit access to zoom without depending on the mouse/touch gesture, see "Rendering" in `technical-specifications.md`. Zoom out button disabled at the minimum zoom level, zoom in disabled at the maximum.
- **Click on an arrondissement:** zooms into that arrondissement (see "Rendering" in `technical-specifications.md` for the programmatic zoom mechanism); serves as a shortcut to manual zoom rather than a separate filter, consistent with the choice of a real geographic map (see scoping discussions).
- **Hover/tap of a tree:** detail card (common name, genus and species, circumference, height, development stage, ownership, arrondissement, "remarkable tree" mention where applicable).
- **Hover/tap of a national garden tree** ("Jardins nationaux" checkbox enabled): minimal detail card (genus and species if known, otherwise a generic mention; garden name), consistent with the sparse attributes available for these points (see "Content" above). Takes priority over a nearby municipal tree in case of overlap, consistent with being displayed on top of the rest of the cloud.
- **Point size:** proportional to the trunk circumference (see "Rendering" in `technical-specifications.md`), readable without interaction, complementing the detail card.
- **Initial view:** all genera active, national gardens displayed, empty search, map centered on all of Paris, initial zoom framing the twenty arrondissements.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): the active genera, the search, the "Jardins nationaux" checkbox and the framing (including the one obtained by clicking on an arrondissement) are restored. A tree's detail card is not shared.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Arbres de l'inventaire municipal, par arrondissement" / "Trees in the municipal inventory, by district".
- **Rows:** the twenty arrondissements.
- **Columns:** Trees; Dominant genus (name of the genus and share of the arrondissement's trees, in %), chosen among the named genera: the "Other" category, which groups all minority genera, on its own exceeds plane trees and would win everywhere; Remarkable trees.
- **Total row:** "Paris", with the dominant genus of the whole city.
- The national garden trees (OpenStreetMap) are not included: the table describes the municipal inventory, like the default map.

## States

- **Loading:** the time it takes for the five data files (`trees.json`, `districts.json`, `streets.json`, `seine.json`, `national-gardens.json`) to be fetched and the map to initialize. `trees.json` is significantly larger than on the site's other visualizations (see "Data format" in `technical-specifications.md`): a loading progress indicator is planned rather than a simple binary loaded/not loaded state, so as not to leave a visitor with an empty map and no feedback for several seconds; the four other files, much lighter, do not have this indicator.
- **Error:** failure to fetch one of the five files → error message, no silent empty map.
- **Empty:** search with no match at all, or all genera disabled via the filter → neutral message saying so, rather than a map with no trees and no explanation. **Corrected after user feedback:** this message no longer blocks zoom/pan of the map underneath (`pointer-events: none` on the message, see "Rendering" in `technical-specifications.md`): a visitor who unintentionally empties the filter keeps control of the map rather than seeing it become unresponsive to mouse/touch for as long as the message is displayed.

## Responsive

- Map pan/zoom via touch gestures.
- Detail card on tap of a tree rather than on hover.
- Legend, filter and search field: no overlap with the map to fix on small screens, these elements are already positioned in the normal page flow, above the map area, at all screen sizes (same approach as the site's other visualizations); they rearrange into a column on small screens (see "Responsive" in `technical-specifications.md`), with sufficiently large touch targets (the clickable area of each checkbox extends to the whole label, not just the box).

## Accessibility (known limitation)

The main interaction (point map, touch/mouse pan, hovering over trees) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without a fallback, in line with the project's default rule (see "Rules common to all visualizations" in the general `technical-specifications.md`). The search field, the legend/filter entries, the "Jardins nationaux" checkbox and the zoom buttons remain keyboard accessible (standard `<input>` and `<button>` elements, `aria-label` on the zoom buttons that only have a symbol), to allow filtering and zooming without depending on the mouse/touch gesture on the map itself; panning remains unavailable by keyboard (no pan button added).

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

The common species names (`libellefrancais` in the source dataset) are only available in French; displayed as is in the English version of the page, without translation (comparable to municipality names or official categories of a dataset, see "Multilingual" in the general `functional-specifications.md`). Scientific names (genus, species) are not translated either, being by nature common to both languages.
