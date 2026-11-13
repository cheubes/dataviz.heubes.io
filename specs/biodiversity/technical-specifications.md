# Technical specifications: French Biodiversity

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Map technology

D3 v7 only, no Leaflet (see framing discussions: consistency across the three visualizations, no runtime dependency on a third-party tile server, illustrated aesthetic rather than a generic map).

- **Basemap:** SVG silhouette of metropolitan France (`public/data/biodiversity/basemap.json`), derived from the `world-atlas` package (`countries-50m.json`, Natural Earth data, public domain), same source family as `bird-migrations` but at 50m resolution (not 110m) since a single isolated country, more detailed, stays light. Retrieved once via the jsDelivr CDN, the France geometry (id `250`) is extracted from it then retopologized into a standalone TopoJSON file (`france` object, 3 arcs, ~18 KB) via `topojson-server`/`topojson-simplify` (tools used once during preprocessing, not npm dependencies of the project, like `h3-js` below). **Pitfall encountered:** `world-atlas` groups the overseas departments and territories (Mayotte, Réunion, Guadeloupe, French Guiana...) as additional polygons of the same "France" geometry (unlike the GBIF country code, which distinguishes them natively, see `data-model.md`); filtered by bounding box (lon -6 to 10, lat 41 to 52) before retopologizing.
- **Hexagonal grid:** H3 geometries precomputed by the preprocessing script (see `data-model.md`), delivered as GeoJSON polygons in the output JSON. No H3 computation on the client, hence no `h3-js` dependency in the browser (used only by the local preprocessing script, not committed, like `topojson-server` above).
- **Rendering:** SVG (`d3-geo` for the projection, `d3-scale` for the color intensity per cell). `d3.geoMercator()` projection with `fitExtent` directly on the France geometry (no manual framing rectangle as in `bird-migrations`, a single country rather than a multi-continent area).
- **No pan/zoom** (departure from the initial intent, explicit request during implementation, see "Interactions" in `functional-specifications.md`): `d3-zoom` removed, the map stays fixed on the `fitExtent` view (whole silhouette of France always visible). `d3-selection` is therefore no longer needed either (it was only used to attach the zoom behavior).
- **H3 resolution:** 4 (~1,770 km²/cell, 395 cells after coastal filtering), not 5 as initially considered: see "Preprocessing" in `data-model.md` for the rationale (request volume during preparation, and consistency with the granularity of the source grid).

## Map extent

Metropolitan France only, not the overseas departments (see framing discussions: an illustrated map with a single silhouette does not lend itself to the very different scale of the overseas departments without an inset layout, out of scope for this visualization). Two distinct mechanisms ensure this exclusion in practice (see `data-model.md`, "Geographic coverage" and "Preprocessing"): the GBIF country code `FR` already natively excludes the overseas departments on the data side (they each carry their own ISO code), whereas the `world-atlas` basemap bundles them into the same "France" geometry and requires explicit filtering by bounding box.

## New dependencies

| Dependency | Usage | Scope |
|---|---|---|
| `d3-geo`, `d3-scale` | Rendering of the map and the grid (projection, color scales) | Scoped to this visualization (Astro island), see "Rules common to all visualizations" in the general `technical-specifications.md`; already in `package.json` since `bird-migrations`, no addition needed |
| `topojson-client` | Conversion of the TopoJSON basemap → GeoJSON on the client | Same, already present |

No `d3-fetch`: native `fetch` is enough (`fetch('/data/biodiversity/hexbins.json')`), consistent with `bird-migrations`/`flower-phenology` which do the same. `h3-js`, `topojson-server` and `topojson-simplify` (preprocessing only, see `data-model.md`) are not project dependencies: installed once locally (`npm install --no-save`) for the script outside the build, never added to `package.json`.

## Palette

Official categorical palette (see "Dataviz palette" in `style-guide.md`), six groups ≤ eight available slots, assigned in order:

| Slot | Hue | Group |
|---|---|---|
| 1 | Blue | Birds |
| 2 | Orange | Mammals |
| 3 | Aqua | Reptiles and amphibians |
| 4 | Yellow | Insects |
| 5 | Magenta | Plants |
| 6 | Green | Fungi |

**Deliberate departure from the original draft:** the fixed order of the official palette does not allow reproducing the draft's intuitive association "green = plants, brown = fungi". Green falls to fungi here. Flagged for validation at review; to be reordered if another assignment is preferred, as long as the slot order is respected for cross-visualization consistency.

Intensity per cell (number of observations for the current filter): default blue sequential scale (see "Sequential palette" in `style-guide.md`) when "Tous les groupes" is active; hue of the selected group otherwise.

## Filter iconography

No Font Awesome for the group filter buttons (the draft proposed `fa-feather`, `fa-paw`, etc.): `style-guide.md` reserves Font Awesome for the two Creative Commons icons of the footer. **Departure from the initial intent** ("minimalist inline SVG icons per group"): during implementation, a simple color swatch (circle, `--dv-*-swatch`) per group was chosen rather than dedicated pictograms, for consistency with the pattern already established by `bird-migrations` (species) and `flower-phenology` (species): the legend there also serves as the filter, with a color swatch and a label, without iconography specific to each entry.

## "Live data" mode

See `data-model.md` for the endpoint, the parameters and the response format.

- Request triggered on click on the toggle and on each filter change while the mode is active (native `fetch`, no additional HTTP library).
- CORS of the GBIF API (`api.gbif.org`) validated during implementation: `Access-Control-Allow-Origin: *`, with no origin restriction.
- Rendering of raw points: simple SVG circles (native DOM, `document.createElementNS`), no new dependency.
- No local data sent to GBIF: only the filters chosen by the visitor (group, season) become public request parameters, no personal data.

## Hydration

`client:visible` (the map is not critical to the page's first render, see "Performance" in the general `technical-specifications.md`).

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md` for the expected behavior; without pan/zoom (see "Map technology" above), the only touch gesture to handle is the tap on a cell for the tooltip, via the unified Pointer Events API (already used for mouse hover).

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `group` | `birds`, `mammals`, `reptiles-amphibians`, `insects`, `plants`, `fungi` | All groups |
| `season` | `winter`, `spring`, `summer`, `autumn` | All seasons |

- **"Données en direct" toggle excluded:** it is neither written nor read back, since it triggers requests to the GBIF API (see the "live data" mode section above) and a shared link must not cause an external request without action from the visitor. A link therefore always opens the precomputed grid, with the link's group and season. When the mode is active, `group` and `season` keep being written on each filter change.
