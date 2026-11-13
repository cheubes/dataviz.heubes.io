# Data model: Tomorrow's Medical Desert

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

Two datasets, both verified directly (files downloaded and inspected):

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Accessibilité potentielle localisée (APL) aux médecins généralistes | Direction de la recherche, des études, de l'évaluation et des statistiques (DREES) | https://www.data.gouv.fr/datasets/accessibilite-potentielle-localisee-apl-aux-professionnels-de-sante/ | Licence Ouverte v2.0 | 2026-09-22 |
| Contours des communes de France simplifié | data.gouv.fr (derived from IGN ADMIN EXPRESS COG) | https://www.data.gouv.fr/datasets/contours-des-communes-de-france-simplifie-avec-regions-et-departement-doutre-mer-rapproches/ | Licence Ouverte v2.0 | 2026-09-22 |

The first (`Indicateur d'APL aux médecins généralistes.xlsx`, 2024 edition, three sheets 2022/2023/2024) covers 34,900 communes (France excluding Mayotte). The second (`a-com2022-topo.json`, TopoJSON, WGS84 coordinates, 13.3 MB raw, object `a_com2022`, 34,955 commune geometries, COG 2022 edition) provides the actual boundaries.

## Chosen angle: tomorrow's medical desert

Decided explicitly with the user (see framing discussions): rather than a simple snapshot of current density, a comparison of the 2024 APL as is with the 2024 APL recomputed without general practitioners aged 65 or over, a forward-looking indicator that DREES already publishes in the same file, not a computation specific to this visualization. Shows concretely how many communes would tip into degraded access if doctors close to retirement stopped practicing.

## Chosen scope

**Metropolitan France only**, same decision as `biodiversity`/`monument-layers`/`paris-trees` (see "Geographic coverage" in `biodiversity/data-model.md`): overseas communes are excluded, since a single-silhouette map does not suit their very different scale without an inset layout. Filtering by department code (departments 971 to 976 excluded, Mayotte already absent from the APL source itself).

## Source fields used

| Field | Source | Use |
|---|---|---|
| `Code commune INSEE` | APL | Join with `codgeo` of the basemap |
| `Commune` | APL | Detail card (redundant with `libgeo` of the basemap, either one is enough) |
| `APL aux médecins généralistes` | APL, sheet "APL 2024" | "Today" value |
| `APL aux médecins généralistes de 65 ans ou moins` | APL, sheet "APL 2024" | "Tomorrow" value (see "Chosen angle" above) |
| `Population totale 2022` | APL | Detail card |
| `codgeo` | Boundaries | Join with `Code commune INSEE` |
| Geometry (polygon) | Boundaries | Silhouette of the commune on the map |

The "62 ans ou moins" and "60 ans ou moins" indicators of the source file are not used: the 65-year threshold (the most directly relevant retirement age) is enough for the chosen angle, and the other two would only have added extra states to the toggle without enriching the story.

## Join

**Resolved during implementation:** out of 34,778 metropolitan APL communes and 34,826 metropolitan boundary geometries (34,955 minus 129 DOM/COM), the join by INSEE commune code results in **34,728 communes in the final file**: 53 APL communes without a matching geometry, 101 geometries without a matching APL value, an expected gap between the two editions (APL 2024 vs COG 2022: commune mergers/splits in the interval). The unmatched ones are excluded rather than published with a missing value, in accordance with the validation constraint below.

**Pitfall encountered and fixed: Paris, Lyon and Marseille missing from the map.** The APL file splits these three cities by arrondissement (codes 75101-75120, 69381-69389, 13201-13216, i.e. 45 rows in total), whereas the basemap carries only one polygon per city (75056, 69123, 13055): no arrondissement row therefore joined the corresponding polygon, and the three largest cities in France silently disappeared from the map. Fixed during preprocessing: the arrondissement codes are mapped to the parent commune code, then aggregated by **mean weighted by the standardized population** (methodology documented by DREES itself for aggregating the APL over an area larger than the commune) rather than a simple mean. The population displayed for these three communes is the sum of the total populations of the arrondissements. Without this fix, the join would have resulted in 34,725 communes (45 arrondissement rows lost, 3 communes gained after aggregation); with it, it results in 34,728.

## Preprocessing (one-off Node script, not committed)

1. Extract the "APL 2024" sheet from the XLSX file (`xlsx`/SheetJS library, used once, not a project dependency).
2. Filter both datasets to metropolitan France (see "Chosen scope" above, filtering on the `97`/`98` prefix of the department/commune code).
3. Map the arrondissement codes of Paris/Lyon/Marseille to their parent commune code (75056/69123/13055) and aggregate the corresponding APL rows by mean weighted by the standardized population (see "Pitfall encountered and fixed" in "Join" above).
4. Join the two datasets by INSEE commune code (see "Join" above).
5. Reduce each geometry to the necessary properties only (see "Output format" below), discarding the basemap fields not used here (`xcl2154`/`ycl2154`, `reg`).
6. Simplify the geometry (`mapshaper -simplify 10%`, CLI tool used once during preprocessing, not a project dependency): 13.2 MB → 9.4 MB, see "File size" below for what follows.
7. Write `public/data/medical-deserts/communes.json` (9.0 MB with the joined properties, 2.3 MB gzip-compressed).

## File size

**Point originally reserved for framing, resolved during implementation.** `communes.json` (9.0 MB, 2.3 MB gzip) remains the heaviest data file on the site to date, by far: an order of magnitude above `paris-trees` (752 KB) or `monument-layers`. An additional simplification pass (`mapshaper -simplify 3%`, tested) reduced the size only marginally (9.1 MB): most of the size does not come from the point density of the boundaries (already fairly simplified at the source) but from the number of communes itself (34,728) and from the property keys repeated in the JSON. Accepted as is: gzip compression (served automatically by GitHub Pages) brings the actual network cost down to 2.3 MB, loaded once with a progress indicator (see "States" in `functional-specifications.md`).

## Output format

```json
{
  "type": "Topology",
  "generatedAt": "2026-09-22",
  "objects": {
    "communes": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Polygon",
          "properties": {
            "codgeo": "01001",
            "name": "L'Abergement-Clémenciat",
            "dep": "01",
            "apl": 1.953,
            "apl65": 1.789,
            "population": 859
          },
          "arcs": []
        }
      ]
    }
  },
  "arcs": []
}
```

Stays in TopoJSON format (not converted back to GeoJSON during preprocessing): the arcs shared between neighboring communes remain shared, consistent with the technique already used for the site's basemaps (see "Basemap" in `bird-migrations/technical-specifications.md`).

## Actual distribution (measured during implementation)

Serves as the basis for the color scale domain (see "Palette" in `technical-specifications.md`): median at 2.84 (APL today), 95th percentile at 5.07, 99th percentile at 6.56, maximum at 23.9 (a handful of very sparsely populated communes with a single practitioner, which would crush the gradient over the rest of the territory if the domain went up to the actual maximum). 513 communes at exactly 0 (no accessible consultation). Chosen domain: `[0, 6.5]`, with clipping (`clamp`), shared by both states of the toggle (see "Chosen angle" above: a shared domain is what makes the comparison honest).

## Validation constraints specific to this visualization

- Each geometry carries numeric `apl` and `apl65` (no commune without a usable value: a commune that cannot be joined to both sources is excluded rather than published with a missing value).
- `codgeo` unique per geometry.
- All geometries belong to a metropolitan department (see "Chosen scope" above).
