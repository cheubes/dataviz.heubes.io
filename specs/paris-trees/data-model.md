# Data model: Paris, Tree by Tree

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

Five datasets. The first three are published by the City of Paris (Paris Data), and the last two by OpenStreetMap: all under the **Open Database License (ODbL)**, a compatible license (same copyleft family):

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Les arbres | Ville de Paris (Direction des Espaces Verts et de l'Environnement) | https://opendata.paris.fr/explore/dataset/les-arbres/ | Open Database License (ODbL) | 2026-09-08 |
| Arrondissements | Ville de Paris (Apur) | https://opendata.paris.fr/explore/dataset/arrondissements/ | Open Database License (ODbL) | 2026-09-08 |
| Tronçons de voies | Ville de Paris (Direction de l'Urbanisme) | https://opendata.paris.fr/explore/dataset/troncon_voie/ | Open Database License (ODbL) | 2026-09-08 |
| La Seine (tracé) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-09 |
| Jardins nationaux (arbres) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-09 |

The first dataset listed 219,360 trees at retrieval time (updated weekly by the source). Producer's disclaimer, carried over as is into the visualization's editorial text (see "Editorial angle" in `functional-specifications.md`): the data is not updated in real time, may show notable discrepancies (particularly in green spaces), and covers neither trees on private land nor the entirety of Paris's tree stock. The second dataset provides the geographic outlines of the twenty arrondissements, used as a stylized basemap (see "Rendering" in `technical-specifications.md`). The third dataset (25,096 street segments, a schematic representation of the centerline of public and private roads, 75056 only, no segment outside Paris) provides the street grid drawn as a discreet overlay on this basemap (added after the first implementation, see "Rendering" in `technical-specifications.md`; not used for tree positions or filtering, purely decorative/contextual).

**The fourth dataset falls outside Paris Data**, the only exception in this visualization (and on the site) to date: no equivalent dataset was found on Paris Data for the course of the river itself (the closest dataset, "Plan de voirie - Voies d'eau", only covers fragmentary administrative footprints around locks/basins, including for the Canal Saint-Martin/de l'Ourcq, not the continuous course of the Seine). Retrieved via the Overpass API (`overpass-api.de`): all `waterway=river` segments within the Paris extent, clipped to the Paris extent. **Corrected after an initial incomplete extraction**: filtering strictly on `name=La Seine` excluded the secondary branches that carry their own name (`La Seine - Bras Marie` around the Île Saint-Louis, `La Seine - Bras de la Monnaie` around the Île de la Cité, `Bras de Gravelle`, `Bras du Chapitre`...), making them disappear from the map even though they are indeed part of the river. Corrected filter: all `waterway=river` segments within the extent, except those named "La Marne" (a distinct river, briefly present in the same extent near Charenton). 56 OSM segments kept out of 69, joined end to end into seventeen chains by matching endpoint coordinates (see "Preprocessing" below): the branches running parallel to the main course (around the islands) remain distinct chains rather than merging with the main chain, which is the intended behavior so that they are drawn as separate branches. Purely decorative, like the street grid.

**The fifth dataset fills a gap reported by the user**: the Jardin du Luxembourg, the Jardin des Plantes, the Jardin des Tuileries and the Jardin du Palais-Royal appear as empty areas on the map, despite their fame. Verified before implementing anything (targeted queries on `les-arbres` with a distance filter around each one): this is not a preprocessing defect, these four gardens are managed by national public institutions rather than by the City of Paris (respectively the Senate, the Muséum national d'Histoire naturelle, the public institution of the Louvre museum, the Centre des monuments nationaux), and are therefore outside the scope of the "Les arbres" dataset by nature: the municipal inventory only covers the assets the City is responsible for. No open tree-by-tree inventory was found published by these four institutions (web search, see scoping discussions). OpenStreetMap, on the other hand, lists `natural=tree` points within the footprint of these four gardens: 528 (Luxembourg), 833 (Jardin des Plantes), 1,458 (Tuileries), 170 (Palais-Royal), 2,989 in total. Treated as a separate dataset, never merged into `trees.json` (see "Chosen scope" and "Output format" below): partial community coverage (about 20% of the ~3,000 actual trees in the Luxembourg according to the Senate) and very sparse attributes compared to the City of Paris source (only 783 of the 2,989 points, 26.2%, carry a `genus` tag; never circumference, height, development stage or ownership): silently mixing the two would lose this difference in reliability, see "Rendering" in `technical-specifications.md` for the distinct visual treatment (checkbox enabled by default, see "Interactions" in `functional-specifications.md` for this choice and its caveat).

**Noted absence:** the "Les arbres" dataset has no planting date or year field (verified by reading the schema). The "age of the tree stock" angle considered for a time during scoping is therefore not usable with this source; no consequence for the angle finally chosen ("free exploration", see `functional-specifications.md`), which does not rely on this data.

## Chosen scope

Decided explicitly with the user during scoping: the entire "Les arbres" dataset, all domains combined (street trees, gardens, woods, municipal facilities...), without filtering or aggregation by zoom level.

**Adjustment discovered during implementation, validated with the user:** the `arrondissement` field of the source dataset actually holds 25 distinct values, not 20. Besides the twenty arrondissements and "BOIS DE BOULOGNE" / "BOIS DE VINCENNES" (unambiguously attached to arrondissements 16 and 12, within whose administrative boundaries they are geographically located), 25,045 trees (11.4% of the dataset) carry the value "HAUTS-DE-SEINE", "SEINE-SAINT-DENIS" or "VAL-DE-MARNE": extraterritorial Parisian cemeteries (e.g. the Bagneux cemetery), geographically outside the twenty-arrondissement area covered by the basemap. These 25,045 trees are **excluded** from the output dataset (user decision, see scoping discussions): the chosen scope is therefore "the entire 'Les arbres' dataset within the twenty arrondissements", not strictly the entire source dataset. **194,315 trees** are kept (219,360 minus 25,045 out of scope; no tree dropped for missing coordinates, see "Preprocessing" below).

## Source fields used

| `les-arbres` field | Usage |
|---|---|
| `idbase` | Tree identifier |
| `genre` | Grouping by dominant genus (see "Grouping by genus" below) and search |
| `espece`, `varieteoucultivar` | Search, detail card on click (see "Interactions" in `functional-specifications.md`) |
| `libellefrancais` | Displayed common name (search, detail card) |
| `circonferenceencm` | Point size (see "Rendering" in `technical-specifications.md`), detail card |
| `hauteurenm` | Detail card |
| `stadedeveloppement` | Detail card |
| `domanialite` | Detail card |
| `arrondissement` | Geographic zoom/filtering by clicking on the map (see "Interactions" in `functional-specifications.md`), converted to an arrondissement number (`district`, see "Output format" below) |
| `remarquable` | Visual highlighting of remarkable trees (see "Interactions" in `functional-specifications.md`) |
| `geo_point_2d` | Position on the map |

`typeemplacement`, `complementadresse`, `adresse` and `idemplacement` are not carried over into the output format: outside the scope of the chosen interactions (see "Interactions" in `functional-specifications.md`).

| `arrondissements` field | Usage |
|---|---|
| `geom` (polygon) | Stylized basemap (silhouette of the twenty arrondissements) |
| `c_ar` (arrondissement number) | Matching with the `arrondissement` field of the "Les arbres" dataset |

## Grouping by genus

Decided explicitly with the user (see scoping discussions): **eight genera** each take a slot of the categorical palette (see "Palette" in `technical-specifications.md`), all other genera are grouped into an "Other" category in a neutral hue, outside the palette.

**Resolved during implementation**, by aggregation on the real data (`group_by=genre`): the eight most frequent genera are, in order, *Platanus* (39,689 trees after the out-of-scope exclusion, see "Chosen scope" above), *Aesculus* (22,314), *Tilia* (20,386), *Acer* (16,534), *Styphnolobium* (10,562), *Prunus* (8,212), *Quercus* (6,048), *Fraxinus* (4,950).

**Adjusted after a second review** (user feedback: add Birch and Cypress as distinct genera): neither is among the eight most frequent genera (*Betula*, 1,982 trees before the out-of-scope exclusion, 1,838 after; *Cupressus* + *x Cupressocyparis*, 1,218 before, 562 after: many cypresses are apparently located in the extraterritorial cemeteries excluded from the scope, a traditional planting in a funerary context). The project's dataviz skill is categorical on this point: never a generated ninth or tenth hue on a layout where all points can touch (see "Palette" in `technical-specifications.md` for details), so moving to ten distinct genera was ruled out. Decision made with the user: *Quercus* and *Fraxinus*, the two least frequent dominant genera of the initial eight, join "Other"; *Betula* and *Cupressus* take their slots. The "Cypress" grouping combines *Cupressus* and *x Cupressocyparis* (both `libellefrancais` = "Cyprès" in the source), but deliberately excludes *Chamaecyparis* (`libellefrancais` = "Faux-cyprès", a distinct genus and name, left in "Other" since it was not explicitly requested).

Common name associated with each `genusId` (derived from the most frequent `libellefrancais` within the genus, confirmed by aggregation):

| `genusId` | Genus | Common name (FR) | Common name (EN) |
|---|---|---|---|
| `platanus` | *Platanus* | Platane | Plane tree |
| `aesculus` | *Aesculus* | Marronnier | Horse chestnut |
| `tilia` | *Tilia* | Tilleul | Lime tree |
| `acer` | *Acer* | Érable | Maple |
| `styphnolobium` | *Styphnolobium* | Sophora | Japanese pagoda tree |
| `prunus` | *Prunus* | Cerisier à fleurs | Ornamental cherry |
| `betula` | *Betula* | Bouleau | Birch |
| `cupressus` | *Cupressus*, *x Cupressocyparis* | Cyprès | Cypress |
| `other` | - (including *Quercus*, *Fraxinus*, *Chamaecyparis*) | Autres | Other |

74,218 trees (38.2%) fall into "Other" (less frequent genera and the two displaced genera, or an empty `genre`: a single tree in the source dataset).

## Preprocessing (done during implementation, outside the build)

Node preprocessing script, in the spirit of those of the other visualizations, run once and not committed (see "Rules common to all visualizations" in the general `technical-specifications.md`):

1. Fetch the full export of the "Les arbres" dataset (`GET /api/explore/v2.1/catalog/datasets/les-arbres/exports/json?limit=-1`, 219,360 trees, 108 MB) and that of the "Arrondissements" dataset (`GET .../datasets/arrondissements/exports/geojson`, 20 polygons).
2. Drop the trees whose `arrondissement` is "HAUTS-DE-SEINE", "SEINE-SAINT-DENIS" or "VAL-DE-MARNE" (25,045 trees, see "Chosen scope" above). No tree in the source dataset has a missing `geo_point_2d` (verified by aggregation before preprocessing, `where=geo_point_2d is null` → 0 results): no trees dropped for invalid coordinates.
3. Convert `arrondissement` to an arrondissement number (`district`): `"PARIS Ne ARRDT"` / `"PARIS 1ER ARRDT"` → *N*; `"BOIS DE BOULOGNE"` → 16; `"BOIS DE VINCENNES"` → 12.
4. Determine the eight dominant genera (see "Grouping by genus" above) and assign a `genusId` to each kept tree (index in `genera`, one of the eight or `"other"`).
5. Deduplicate the (`libellefrancais`, `genre`, `espece`) combinations: 1,093 distinct combinations across 194,315 kept trees (less than 1% unique values). Each combination becomes an entry in the `species` table (see "Output format" below), with a precomputed search field (normalized concatenation of the common name, genus and species, lowercase and without accents); each tree references its entry by `speciesId` rather than repeating the strings.
6. Reduce each kept tree to the necessary fields, round `lat`/`lng` to six decimal places, and write `public/data/paris-trees/trees.json`.
7. Simplify the polygons of the "Arrondissements" dataset (Douglas-Peucker, tolerance 0.0001° ≈ 10 m, implemented directly in the script without an added dependency, same choice as the trajectory simplification of `bird-migrations`) and write `public/data/paris-trees/districts.json`.
8. **Added after the first implementation** (user feedback: basemap deemed too bare): fetch the full export of the "Tronçons de voies" dataset (`GET .../datasets/troncon_voie/exports/json?limit=-1`, 25,096 segments, 16 MB), drop the 2 segments without geometry, simplify each segment (Douglas-Peucker, tolerance 0.00003° ≈ 3 m, finer than the arrondissements one to keep the visual detail of the streets: 78,622 points reduced to 58,228), round to six decimal places, and write `public/data/paris-trees/streets.json`. No field kept beyond the geometry (neither the street name nor the domain): purely decorative, see "Rendering" in `technical-specifications.md`.
9. **Added right after** (user feedback: the Seine was still missing from the basemap): query the Overpass API for `waterway=river` segments clipped to the Paris extent, except those named "La Marne" (56 OSM segments kept out of 69, see "Source dataset" above for the filter correction: an initial strict filter on `name=La Seine` missed the separately named branches around the Île Saint-Louis and the Île de la Cité), join them into chains by matching endpoints (two endpoints identical to seven decimal places are treated as the same point; seventeen chains, the branches parallel to the main course remaining distinct chains rather than merged), without further simplification (volume already minimal), and write `public/data/paris-trees/seine.json`.
10. **Added after another review** (user feedback: the gardens with national status remain empty areas, see "Source dataset" above): for each of the four gardens (Luxembourg, Jardin des Plantes, Tuileries, Palais-Royal), query the Overpass API for `natural=tree` nodes within its geographic footprint (one query per garden, each bounded to a small bounding box specific to that garden, rather than a single query over all of Paris that would have returned municipal trees already present in `trees.json`). Keep only the position and, when present, the `genus`/`species` tags (no other attribute available in the source). Label each kept tree with its garden of origin (`gardenId`) and write `public/data/paris-trees/national-gardens.json`.

## Output format

**`public/data/paris-trees/trees.json`**: encoded as parallel arrays ("structure of arrays") rather than an array of objects, to limit the file size given the volume (see "Data format" in `technical-specifications.md`). The common name, genus and species are not repeated per tree: deduplicated into a `species` table referenced by index (see "Preprocessing" above), the only compaction applied beyond coordinate rounding (see "Data format" in `technical-specifications.md` for the other options considered and why they were not adopted):

```json
{
  "generatedAt": "2026-09-08",
  "genera": [
    { "id": "platanus", "nameFr": "Platane", "nameEn": "Plane tree" },
    { "id": "aesculus", "nameFr": "Marronnier", "nameEn": "Horse chestnut" },
    { "id": "other", "nameFr": "Autres", "nameEn": "Other" }
  ],
  "species": [
    { "commonName": "Platane", "genusLabel": "Platanus", "species": "x hispanica", "searchText": "platane platanus x hispanica" },
    { "commonName": "Marronnier", "genusLabel": "Aesculus", "species": "hippocastanum", "searchText": "marronnier aesculus hippocastanum" }
  ],
  "trees": {
    "lat": [48.8566, 48.857],
    "lng": [2.3522, 2.353],
    "genusId": [0, 1],
    "speciesId": [0, 1],
    "circumferenceCm": [180, 95],
    "heightM": [18, 9],
    "developmentStage": ["Adulte", "Jeune (arbre)"],
    "domain": ["Alignement", "Jardin"],
    "district": [4, 4],
    "remarkable": [false, true]
  }
}
```

The `genera` array lists eight dominant genera plus the `"other"` entry (see "Grouping by genus" above); the color of each genus is not stored in the data, but assigned client-side by order of appearance in `genera` (see "Palette" in `technical-specifications.md`). `trees.genusId` and `trees.speciesId` are indexes into `genera` and `species` respectively, not strings. `trees.developmentStage` and `trees.domain` keep the raw source values (French, untranslated, see "Untranslated content" in `functional-specifications.md`), `null` when the source does not fill in the field. Every array in `trees` has the same length, index by index (the first tree is `lat[0]`/`lng[0]`/`genusId[0]`/...).

**`public/data/paris-trees/districts.json`**: simplified GeoJSON of the twenty arrondissements (`FeatureCollection`, one `Polygon` geometry per arrondissement), with the arrondissement number (`properties.c_ar`) carried by each geometry to enable click-to-zoom (see "Interactions" in `functional-specifications.md`).

**`public/data/paris-trees/streets.json`**: raw geometry (no `Feature`, no properties, purely decorative):

```json
{ "type": "MultiLineString", "coordinates": [[[2.3522, 48.8566], [2.3530, 48.8570]], ...] }
```

25,094 segments (2 dropped for lack of geometry, see "Preprocessing" above), 1.2 MB uncompressed (391 KB gzipped).

**`public/data/paris-trees/seine.json`**: same shape (`MultiLineString`, no properties), seventeen chains (main course, branches around the Île Saint-Louis, the Île de la Cité and the Île aux Cygnes, see "Source dataset" above) totaling 490 points, 10 KB.

**`public/data/paris-trees/national-gardens.json`**: structure similar to `trees.json` (parallel arrays), but a much sparser schema reflecting the minimal one of the source:

```json
{
  "generatedAt": "2026-09-09",
  "gardens": [
    { "id": "luxembourg", "nameFr": "Jardin du Luxembourg", "nameEn": "Luxembourg Gardens" },
    { "id": "jardin-des-plantes", "nameFr": "Jardin des Plantes", "nameEn": "Jardin des Plantes" },
    { "id": "tuileries", "nameFr": "Jardin des Tuileries", "nameEn": "Tuileries Garden" },
    { "id": "palais-royal", "nameFr": "Jardin du Palais-Royal", "nameEn": "Palais-Royal Garden" }
  ],
  "trees": {
    "lat": [48.8463],
    "lng": [2.3378],
    "gardenId": [0],
    "genusLabel": [null],
    "species": [null]
  }
}
```

`gardenId` is an index into `gardens` (same mechanism as `genusId`/`speciesId` in `trees.json`). `genusLabel`/`species` are the raw OSM tags (`genus`/`species`), rarely filled in (26.2%, see "Source dataset" above), `null` otherwise; no deduplication into a separate table like `species` in `trees.json`: the variety of observed combinations (783 trees with a tag) does not justify the effort at this volume. 2,989 trees, 105 KB uncompressed.

## Client-side derived fields (not in the JSON)

- **Number of visible trees:** recomputed on every genus filter or search change (see "Interactions" in `functional-specifications.md`).
- **On-screen point radius:** derived from `circumferenceCm` via a scale (see "Rendering" in `technical-specifications.md`), not stored.

## Validation constraints specific to this visualization

- Each `genusId` referenced in `trees.genusId` is a valid index of `genera` (0 invalid out of 194,315 at generation).
- Each `speciesId` referenced in `trees.speciesId` is a valid index of `species` (0 invalid out of 194,315 at generation).
- All arrays in `trees` have the same length.
- A tree present in `trees` always has a valid position (`lat`/`lng`).
- Each `district` referenced in `trees` matches a `c_ar` present in `districts.json` (guaranteed by the exclusion of out-of-scope trees during preprocessing, see "Chosen scope" above; 0 inconsistencies at generation).
- Each `gardenId` referenced in `national-gardens.json` is a valid index of `gardens`.
