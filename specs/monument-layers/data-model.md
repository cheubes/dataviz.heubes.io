# Data model: Layers of Heritage

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Immeubles protégés au titre des monuments historiques (base Mérimée) | Ministère de la Culture | https://www.data.gouv.fr/datasets/immeubles-proteges-au-titre-des-monuments-historiques-2/ | Licence Ouverte v2.0 | 2026-09-10 |
| Cours d'eau (tracé) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-10 |
| Réseau routier (autoroutes et voies rapides) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-10 |

The Mérimée dataset is updated every week (Thursday) by the Ministry of Culture; it covers all buildings protected since the first law of 1840. The CSV export is used (`https://ministere-culture.s3.sbg.io.cloud.ovh.net/POP/merimee.csv`, 46,760 records, ~100 MB), rather than the equivalent GeoJSON export (~223 MB): same data, pipe-delimited format (`|`) simpler to process as a stream, coordinates already carried by a dedicated field (`coordonnees_au_format_WGS84`, see "Source fields used" below) which makes the GeoJSON geometry redundant for this need. The raw volume includes many fields not used here (architectural description, materials, state of preservation, and above all a `Copyright` field holding a legal notice repeated in full on each of the 46,760 rows, which largely dominates the size of the raw file): the file produced by this visualization (see "Output format" below) keeps only the useful fields.

The basemap is enriched with rivers and a road network via the Overpass API (OpenStreetMap), the same source as the Seine and street outlines of `paris-trees` but at the scale of the country rather than a single city (see "Preprocessing" below). Chosen over Natural Earth (first version of these two layers, see history below) for much higher geographic precision, explicitly requested by the user for both layers in succession: OpenStreetMap is mapped at a local resolution whereas Natural Earth remains calibrated for world atlases. **History:** rivers first used Natural Earth (17 stylized segments), then OpenStreetMap ("sois plus précis sur les cours d'eau"); roads first used Natural Earth alone for the intercity network, supplemented by OpenStreetMap in only nineteen large cities ("ajoute des axes routiers, notamment dans les grandes villes"), then OpenStreetMap entirely across all of France ("sois plus précis sur les axes routiers"), so Natural Earth is no longer used by this visualization.

## Chosen scope

- **Geographic: metropolitan France only**, same decision as `biodiversity` (see "Geographic coverage" in its `data-model.md`): monuments in overseas departments and collectivities are excluded (department codes 971 to 976 present in the source), as a single-silhouette map does not lend itself to their very different scale without an inset layout. Corsica (departments 2A/2B), however, remains included: it is part of metropolitan France in the sense of this exclusion, as for `biodiversity` (same basemap, see "Basemap" below). Two records attached to two departments at once (`Departement_format_numerique` of the form `"01;71"`) are attached to the first code of the field, a negligible case (2 records out of 46,760).
- **Protection status: classified and registered combined**, no subset: the chosen angle (construction layers, see `functional-specifications.md`) benefits from the full density rather than a partial subset.

## Source fields used

| Mérimée database field (CSV column name) | Usage |
|---|---|
| `Titre_editorial_de_la_notice` | Displayed name (falls back to the commune if empty) |
| `Commune_forme_editoriale` (fallback `Commune_forme_index`) | Commune, detail card |
| `Departement_format_numerique`, `Departement_en_lettres` | Grouping by department (see "Output format"), detail card |
| `coordonnees_au_format_WGS84` | Position on the map (`"lat,lng"` string, WGS84) |
| `Siecle_de_la_campagne_principale_de_construction` | Position on the simulated timeline (see "Interpreting the construction century" below) |
| `Typologie_de_la_protection` | Nature of the protection (classified/registered), detail card |
| `Denomination_de_l_edifice` | Category displayed in the detail card (château, church, bridge...), no dedicated filter or color (see framing discussions: risk of running into the same palette problem as `satellites-in-orbit` and `paris-trees` with a high number of categories, ruled out here by keeping it out of the filterable/colored dimensions) |
| `Reference` | Record identifier (e.g. `PA00081518`), used to build the link to the reference record (see "Link to the reference record" below); never displayed as is |

## Interpreting the construction century

The source field sometimes holds several construction campaigns, separated by `;` (e.g. `"12e siècle;16e siècle"` for a remodeled building). The **oldest** campaign mentioned is kept as the representative `constructionYear`, consistent with the "layers" angle: this date represents the founding layer of the building rather than its later remodelings.

Each numeric century (`"16e siècle"`, including its spelling variants `"16è siècle"`, `"1er quart 16e siècle"`, `"2e moitié 16e siècle"`, qualifier ignored) is converted into a representative year: the middle of the century, i.e. `(N-1) × 100 + 50` (e.g. 16th century → 1550), negative for "av. J.-C." mentions (e.g. `"1er siècle av. JC"` → -50). A building with this field not filled in at all is dropped from the dataset (13.25% of records, see "Measured statistics" below), rather than placed arbitrarily on the timeline.

**Non-numeric period labels:** 6.3% of non-empty records (2,925 out of 46,760) carry an archaeological period label rather than a numeric century (`"Néolithique"`, `"Gallo-romain"`, `"Moyen Age"`, `"Antiquité"`...), a proportion too large, and representing precisely the oldest remains ("des vestiges antiques épars", see the editorial angle in `functional-specifications.md`), to simply be dropped like an unfilled century (decision validated with the user). Each label is converted into an approximate representative year via a dedicated lookup table, and associated with an era code (`era`, see "Output format" below) rather than a plain number, to allow a localized display faithful to the original label (e.g. "Néolithique" / "Neolithic") rather than a fabricated century:

| Source label(s) | `era` | Representative year |
|---|---|---|
| Paléolithique (ancien/moyen) | `paleolithic` | -20000 |
| Paléolithique supérieur | `paleolithic` | -15000 |
| Mésolithique | `mesolithic` | -8000 |
| Néolithique (ancien/moyen/récent), Préhistoire (générique) | `neolithic` | -4000 / -3500 |
| Chalcolithique | `chalcolithic` | -2700 |
| Âge du bronze (ancien/moyen/final) | `bronzeAge` | -1800 / -1500 / -1000 |
| Âge du fer (1/2), Protohistoire | `ironAge` | -700 / -500 |
| Gallo-romain, Haut-Empire, République romaine, Antiquité | `galloRoman` | -50 / 100 |
| Bas-Empire | `galloRoman` | 350 |
| Moyen Âge (générique), Haut/Milieu/Fin du Moyen Âge | `middleAges` | 700 / 1000 / 1100 / 1400 |
| Temps modernes | `earlyModern` | 1650 |

These years are approximate by nature (a label such as "Moyen Âge" alone potentially covers ten centuries): their only role is to position the point on the animated timeline (see "Animation" in `technical-specifications.md`) and to sort the dataset, never displayed as is (see "Client-side derived fields" below, the displayed label comes from `era` when present, not from `constructionYear`).

## Nature of the protection

Derived from `Typologie_de_la_protection`, which sometimes holds several values separated by `;` (e.g. a building classified on one part and registered on another): the value contains `"classé"` → `classe` (classification being the strongest level of protection, taking precedence in case of a mix); otherwise `"inscrit"` → `inscrit`; otherwise (empty field, 0.96% of records) the record is dropped. This field is not color-encoded in this visualization (see "Palette" in `technical-specifications.md`), only displayed in the detail card and available as a simple filter (see "Interactions" in `functional-specifications.md`).

## Link to the reference record

Added after the first implementation (user feedback: "serait-il possible sur chaque monument d'avoir un lien vers une page web de référence ?"). Each monument keeps its original `Reference` (Mérimée record identifier, e.g. `PA00081518`, always filled in: no record dropped for lack of this field), used to build a link to its official record on the Plateforme Ouverte du Patrimoine (POP) of the Ministry of Culture: `https://www.pop.culture.gouv.fr/notice/merimee/{reference}`, a platform that republishes and maintains the Mérimée, Palissy and Joconde data, verified during implementation on a sample of records. Link computed client-side from `reference` (see "Client-side derived fields" below), no full URL stored in `monuments.json`: a single URL template for the 37,661 monuments, no need to repeat it.

## Preprocessing

One-off script (Python, outside the project's npm dependencies, same logic as the raster preprocessing of `light-pollution`):

1. Retrieval of the full CSV export (see "Source dataset" above).
2. Restriction to metropolitan France by department code (see "Chosen scope" above).
3. Rejection of records without valid coordinates, without a usable century or without a usable protection type (see "Measured statistics" below).
4. Conversion of the chosen century (or period label) into a representative year and, where applicable, into an era code (see "Interpreting the construction century" above).
5. Grouping of the nature of the protection into two values (see "Nature of the protection" above).
6. Sorting by ascending `constructionYear` and writing of `public/data/monument-layers/monuments.json`.

**Basemap:** reuse as is of `public/data/biodiversity/basemap.json` (copied to `public/data/monument-layers/basemap.json`, see "Basemap" in its `technical-specifications.md`), confirmed during implementation: same geographic extent (metropolitan France, Corsica included), same TopoJSON format (`objects.france`) consumed the same way (`topojson-client`). Copied rather than referenced directly in the other `public/data/` folder: each visualization remains independent of another's data files (see "File structure" in the general `technical-specifications.md`), so a future change to the `biodiversity` basemap must not silently break this one.

**Rivers and road network** (added after the first implementation, user feedback: enriched basemap, same request as the streets/Seine basemap of `paris-trees`; precision revised twice in a row afterwards, see "Source dataset" above for the full history):

1. Convert the France geometry of the TopoJSON (`objects.france`) into GeoJSON, to serve as a geographic clipping mask rather than a simple bounding rectangle: a rectangle would have kept fragments of Italian, Spanish or German rivers or roads of which only a corner of their path crosses the rectangular footprint of France.
2. **Rivers:** for each river in a named list recognized as the "main" ones in France (La Seine, La Loire, Le Rhône, La Garonne, La Marne, La Saône, La Dordogne, La Moselle, La Meuse, L'Yonne, Le Doubs, La Vienne, La Durance, Le Tarn), query the Overpass API for the `waterway=river` relation bearing that name and then its member segments (`relation["waterway"="river"]["name"="La Seine"];way(r);out geom;`, fourteen queries combined into one): much faster than a search for segments by geographic area (`way["waterway"="river"](bbox France)`), which systematically fails by timing out on a footprint as large as the whole of France. All rivers use the French definite article in their OpenStreetMap name (convention observed during implementation, e.g. "La Marne" rather than "Marne", already encountered in `paris-trees`, see its `data-model.md`), except for the Rhine (special case below).
3. **Special case of the Rhine:** no relation named in French in OpenStreetMap (mapped as a single international segment, from its Swiss source to its mouth in the Netherlands, under its German name `"Rhein"`, relation note: "Don't map tributaries !"); retrieved separately by its relation identifier.
4. **Road network:** query the Overpass API for `highway` segments of type `motorway` or `trunk` (motorways and expressways) across the whole territory, via the administrative area of France rather than a rectangular geographic area (`area["ISO3166-1"="FR"][admin_level=2];way(area)["highway"="motorway"];`, one query per type, the administrative area index responding within a few minutes whereas a bounding-rectangle search over such a large footprint fails by timing out, as for rivers): 30,958 `motorway` segments and 31,515 `trunk`. Restriction to these two types only (not `primary`/`secondary`): a first attempt limited to nineteen large cities with all four types already returned 75,794 segments over a much smaller extent, for a rendering judged too cluttered given the density of the monument points; `motorway`/`trunk` across all of France remain lighter (62,473 segments) while giving a recognizable road presence everywhere, not only in a sample of cities.
5. Clip both sets to the France polygon (same mechanism as in step 1), simplify (`mapshaper -simplify`, a tool used once during preprocessing, not an npm dependency of the project, like `topojson-server`/`topojson-simplify` for `biodiversity`: 25% for rivers, 15% for the denser road network), round to six decimals, flatten each set into a single `MultiLineString` geometry without properties (see "Output format" below) and write `public/data/monument-layers/rivers.json` and `public/data/monument-layers/roads.json`.

### Measured statistics

Out of 46,760 source records:

| Exclusion | Records | Proportion |
|---|---|---|
| Kept | 37,661 | 80.54% |
| No century or period label filled in | 6,198 | 13.25% |
| No valid coordinates | 2,268 | 4.85% |
| Outside metropolitan France (DOM/COM) | 573 | 1.23% |
| No usable protection type | 53 | 0.11% |
| Uninterpretable century (unexpected format) | 7 | 0.01% |

Of the 37,661 records kept, 1,790 (4.75%) date from before year 0 (see "Interpreting the construction century" above); their handling in the display (static base rather than animated) is documented in `functional-specifications.md` and `technical-specifications.md` ("Animation" sections).

## Output format

```json
{
  "generatedAt": "2026-09-10",
  "departments": [
    { "code": "75", "nameFr": "Paris", "nameEn": "Paris" }
  ],
  "monuments": [
    {
      "name": "Cathédrale Notre-Dame",
      "commune": "Paris",
      "lat": 48.853,
      "lng": 2.349,
      "departmentCode": "75",
      "constructionYear": 1220,
      "protection": "classe",
      "category": "Cathédrale",
      "reference": "PA00086250",
      "era": "middleAges"
    }
  ]
}
```

`departmentCode` references `departments`, to avoid repeating the department name on each of the 37,661 records. A department's `nameFr`/`nameEn` are identical (proper names of French departments, with no established conventional English translation, unlike the names of countries or regions); carried in two fields nonetheless, for consistency with the bilingual format used everywhere else on the site for an object referenced by identifier (e.g. `regions` in `satellites-in-orbit`, `genera` in `paris-trees`).

`reference` was added to the schema after the first implementation (see "Link to the reference record" above): used exclusively to build the link to the official record, never displayed as is in the interface.

`era` is present only for monuments whose year comes from a period label rather than a numeric century (see "Interpreting the construction century" above); absent otherwise. Unlike the initial framing draft, the file does **not** carry a precomputed `centuryLabel`: this label depends on the language (e.g. "12e siècle" / "12th century"), so it is computed client-side from `constructionYear` (and from `era` when present) rather than frozen in a single language at preprocessing, consistent with the handling of derived labels elsewhere on the site (e.g. the year indicator of `satellites-in-orbit`, computed via `Intl.DateTimeFormat` rather than carried by `satellites.json`). See "Client-side derived fields" below.

`commune` was added to the schema of the initial framing draft: required for the detail card (see "commune/department" in `functional-specifications.md`), omitted by oversight in the first version of this spec.

**`public/data/monument-layers/rivers.json`** and **`public/data/monument-layers/roads.json`**: raw geometry (no `Feature`, no properties, purely decorative, see "Preprocessing" above), same shape as `streets.json`/`seine.json` of `paris-trees`:

```json
{ "type": "MultiLineString", "coordinates": [[[2.3522, 48.8566], [4.8, 47.3]], ...] }
```

`rivers.json`: 15 rivers (the fourteen names listed plus the Rhine, 3,124 segments, a river being represented by many disjoint segments in OpenStreetMap), 29,687 points, 624 KB (220 KB compressed). `roads.json`: motorways and expressways across all of France (60,272 segments), 196,530 points, 4.25 MB (1.45 MB compressed). Sizes much larger than the first version of these files based on Natural Earth alone for both layers (9.5 KB and 27 KB), and `roads.json` grew a second time when moving from a simplified intercity network supplemented by nineteen large cities to the full OpenStreetMap coverage of the country (user feedback: "sois plus précis sur les axes routiers"): an accepted trade-off of the geographic precision requested twice, which remains of the same order of magnitude as `monuments.json` (7.92 MB, see "Link to the reference record" above) and reasonable for the site in light of the `paris-trees` precedent (11.7 MB/2.2 MB for a single file, see "Performance" in the general `technical-specifications.md`).

## Client-side derived fields (not in the JSON)

- **Count of monuments visible at the current simulated instant:** number of `monuments` whose `constructionYear` is earlier than or equal to the simulated year, according to the active protection filter (see "Interactions" in `functional-specifications.md`).
- **Displayed period label** (simulated period indicator, detail card): if `era` is present, localized label associated with this code (table in `src/i18n/fr.ts`/`en.ts`); otherwise, century formatted from `constructionYear` (e.g. `1550` → "16e siècle" / "16th century", `-50` → "1er siècle av. J.-C." / "1st century BC").
- **Link to the reference record** (detail card): `https://www.pop.culture.gouv.fr/notice/merimee/{reference}`, a single URL template applied to `reference` (see "Link to the reference record" above).

## Validation constraints specific to this visualization

- Each `departmentCode` referenced in `monuments` exists in `departments`.
- `monuments` is sorted by ascending `constructionYear`.
- A monument present in `monuments` always has `lat`/`lng` and `constructionYear` filled in (records lacking either are dropped at preprocessing, never present with a null value).
- A monument present in `monuments` always has `reference` filled in (field always present in the source, no record dropped for its absence, see "Link to the reference record" above).
