# Data model: French Biodiversity

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| Field | Value |
|---|---|
| `name` | GBIF Occurrence Data (France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 / CC BY (varies per individual occurrence, see "Attribution" below) |
| `retrieved` | 2026-09-08 |

Two formal SQL exports (with DOI, see "Preprocessing" below) were used during implementation rather than a generic aggregated use of the search API: `https://doi.org/10.15468/dl.h5srta` (group × season aggregation) and `https://doi.org/10.15468/dl.mmqnrd` (dominance per species), cited individually in the frontmatter `datasets` (`biodiversity.fr.md` / `.en.md`) rather than the generic search URL above.

**Geographic coverage:** metropolitan France only (see "Decisions" below; the overseas departments are out of scope). In practice, the GBIF country code `FR` already covers only metropolitan France: the overseas departments (Guadeloupe, Martinique, French Guiana, Réunion, Mayotte) each carry their own distinct ISO 3166-1 code on the GBIF occurrence side, so no additional exclusion is needed when preprocessing the data itself (see "Preprocessing" below for the equivalent nuance on the basemap, which bundles the overseas departments under the same geometry).

**Temporal coverage:** occurrences with a complete date (day/month/year), 2010 to the preprocessing year. The actual upper bound is that of `retrieved`, never "present" in the literal sense since the data is frozen at build time (see "Rules common to all visualizations" in the general `technical-specifications.md`).

**Attribution:** GBIF aggregates occurrences whose licenses vary per contributing dataset (mostly CC0 and CC BY). The generic credit line (see "Source dataset" above) is enough for an aggregated use of this kind; it does not replace a dedicated DOI citation if a formal GBIF export (with DOI) is used at implementation time.

## Two data modes

This visualization has two modes, one default (frozen data, in line with the common rule), the other a documented exception to that rule (see "Rules common to all visualizations" in the general `technical-specifications.md`, which allows a "documented and justified" exception).

### Default mode: precomputed snapshot

H3 hexagonal grid, aggregated offline, committed as static JSON. No network call to GBIF from the published site in this mode.

### "Live data" mode

Explicit toggle (see `functional-specifications.md`) that queries the GBIF search API live from the browser, for the current filter combination. See "Live data" mode below for the technical details.

**Justification of the exception:** this mode is a deliberate editorial choice (showing that the dataset is alive, beyond the frozen snapshot), not a technical necessity: the default mode remains fully functional without it. It is therefore treated as an optional secondary feature rather than as the page's normal mode of operation.

## Raw data schema (GBIF source)

GBIF fields used during preprocessing, via the SQL Downloads API (see "Preprocessing" below, `occurrence` table):

| GBIF field | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | Position, rounded to 0.1° on the SQL side then assigned to an H3 cell by the local script (see "Preprocessing") |
| `kingdom`, `phylum`, `class` | Determining the taxonomic group (see mapping below) |
| `month` | Determining the observation season (escaped as `"month"` in SQL, collision with a built-in function of the engine, see "Preprocessing") |
| `scientificName` | Computing the dominant species per cell/group |
| `countryCode` | `FR` filter (enough to exclude the overseas departments, see above) |
| `hasCoordinate`, `hasGeospatialIssues` | Quality filter: coordinates present and valid. Plural column name in the SQL Downloads schema, whereas the equivalent search API parameter (see "Live data" mode below) is singular (`hasGeospatialIssue`): a naming inconsistency specific to GBIF, not an implementation error. |
| `year` | Filter from 2010 to the retrieval year (escaped as `"year"` in SQL, same collision as `month`) |

## Taxonomic groups

Single filter (radio, one active group at a time, "Tous les groupes" by default). Reptiles and amphibians are merged into a single filterable group (as in the palette of the original draft), giving six groups:

| Identifier (data) | FR label | EN label | GBIF filter (`class`) |
|---|---|---|---|
| `birds` | Oiseaux | Birds | Aves |
| `mammals` | Mammifères | Mammals | Mammalia |
| `reptiles-amphibians` | Reptiles et amphibiens | Reptiles and amphibians | Reptilia, Amphibia |
| `insects` | Insectes | Insects | Insecta |
| `plants` | Plantes | Plants | Tracheophyta (`phylum`) |
| `fungi` | Champignons | Fungi | Fungi (`kingdom`) |

## Season definition

Meteorological seasons (not calendar seasons), computed from the observation month:

| Identifier | FR label | EN label | Months |
|---|---|---|---|
| `winter` | Hiver | Winter | December, January, February |
| `spring` | Printemps | Spring | March, April, May |
| `summer` | Été | Summer | June, July, August |
| `autumn` | Automne | Autumn | September, October, November |

## Preprocessing (done during implementation)

The approach documented before implementation (querying `occurrence/search` by facet, or downloading the raw occurrences) turned out to be impractical once the actual volume was measured: 123 million France 2010-2026 occurrences with valid coordinates. A raw download would have meant several tens of GB to process locally; a loop of facets per H3 cell (resolution 5, ~15,000 requests) would have taken several hours with a risk of API rate limiting. Method actually used:

1. **Server-side aggregation via the GBIF SQL Downloads API** (`POST /v1/occurrence/download/request`, `format: SQL_TSV_ZIP`, authentication with a GBIF account), which runs a `GROUP BY` on the `occurrence` table before export: the resulting file only contains the already counted combinations, not the individual records. Two SQL queries submitted separately (see DOIs in "Source dataset" above):
   - **Query A** (count): `SELECT ROUND(decimalLatitude,1) AS glat, ROUND(decimalLongitude,1) AS glon, class, phylum, kingdom, "month", COUNT(*) FROM occurrence WHERE countryCode='FR' AND hasCoordinate=TRUE AND hasGeospatialIssues=FALSE AND "year">=2010 AND "year"<=2026 AND "month" IS NOT NULL AND (class IN (...) OR phylum='Tracheophyta' OR kingdom='Fungi') GROUP BY ...`: 665,964 output rows.
   - **Query B** (dominance per species): same filter, grouped by `class, phylum, kingdom, scientificName` without the month: 9,181,740 output rows (a `HAVING COUNT(*) >= 5` clause planned to reduce noise from rare species had to be removed, `HAVING` not being supported by this SQL engine; noise filtering is therefore done in the local script, see point 4).
   - **SQL dialect pitfalls encountered** (documented here for any future SQL Downloads query): identifiers are not escaped with backticks Hive/MySQL style (lexical error), but with double quotes Trino/ANSI style, needed only for `month` and `year`, which collide with built-in functions of the engine (`class` does not have this problem); `HAVING` is not supported; the column is `hasGeospatialIssues` (plural) whereas the equivalent search API parameter is `hasGeospatialIssue` (singular, see table above).
2. **Local Node script** (one-off, not committed, consistent with `bird-migrations`/`flower-phenology`) reading both TSV files as streams (`readline`, without loading the 9.18 million rows of query B into memory: a first naive version exhausted the Node heap):
   - Assigns each row to a taxonomic group (mapping above) and, for query A, to a season (mapping above).
   - **Coarse geographic plausibility filter:** a handful of rows carry `countryCode=FR` but obviously wrong coordinates (off Costa Rica/Panama in this export: an upstream entry/interpretation error at GBIF, which `hasGeospatialIssues=FALSE` does not detect). Rejected before binning via a generous bbox (lon -12 to 12, lat 39 to 52).
   - Aggregates into an H3 grid at **resolution 4** (~1,770 km²/cell), not the resolution 5 planned by the initial spec: besides the gain in request volume mentioned in point 1, the source grid (0.1° rounding, ≈ 8 × 11 km) is almost as large as a resolution 5 cell (≈ 17 km in diameter), which would have introduced a reassignment bias at the edges; at resolution 4 (≈ 45 km in diameter) this bias becomes negligible.
   - For each cell: sums the counters per group **and** per season (query A), and determines the most frequent species per group by summing the per-species counters of query B (the actual maximum, without an artificial threshold: the `HAVING >= 5` initially planned is no longer useful once the data has been brought back locally).
   - **Precise geographic plausibility filter (after binning):** the coarse bbox above is not enough to distinguish a genuine marine/coastal observation from mere geolocation noise: 44% of the 603 cells obtained before this filter had their center outside France's land polygon (up to 579 km offshore). Analysis of density by distance band from the actual coastline (computed on the `basemap.json` polygon): density drops sharply beyond 20-30 km (7.6 M of the 8.6 M "outside polygon" observations fall within the first twenty km; beyond 50 km, 166 cells total only ~195,000 observations, scattered noise rather than a real signal). Cells whose center is more than **30 km** from the coast (point-in-polygon test then distance to the nearest segment, direct geometric computations, with no dependency) are therefore rejected: 208 cells, ~1,260 observations lost on average per rejected cell versus ~283,000 per kept cell. Spotted after a first production pass where the map showed many tiles far out at sea, far from any plausible coast.
   - **Winding pitfall encountered** (to watch for in any programmatically built geometry, already documented for `bird-migrations/render.ts` regarding its framing rectangle): `h3.cellToBoundary(cell, true)` returns the ring counterclockwise (GeoJSON RFC 7946 convention), but d3-geo's spherical winding rule is the opposite for a small local ring. Left as is, each hexagon renders as "everything except this cell" (a huge degenerate polygon covering the whole page, spotted via a real browser test: it blocked all mouse interactions). The ring is therefore reversed (`.reverse()`) before writing.
3. Output: `public/data/biodiversity/hexbins.json` (see "File structure" in the general `technical-specifications.md`, updated for this project): 395 cells.

## Static data format (default mode)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3": "851f8ebfffffff",
        "counts": {
          "birds":                { "spring": 120, "summer": 200, "autumn": 150, "winter": 110 },
          "mammals":               { "spring": 30,  "summer": 40,  "autumn": 35,  "winter": 15 },
          "reptiles-amphibians":   { "spring": 20,  "summer": 45,  "autumn": 10,  "winter": 2 },
          "insects":               { "spring": 90,  "summer": 210, "autumn": 60,  "winter": 5 },
          "plants":                { "spring": 140, "summer": 90,  "autumn": 60,  "winter": 20 },
          "fungi":                 { "spring": 5,   "summer": 15,  "autumn": 80,  "winter": 10 }
        },
        "topSpecies": {
          "birds": "Turdus merula",
          "mammals": "Vulpes vulpes",
          "reptiles-amphibians": "Lacerta bilineata",
          "insects": "Pieris rapae",
          "plants": "Taraxacum officinale",
          "fungi": "Amanita muscaria"
        }
      },
      "geometry": { "type": "Polygon", "coordinates": [ ] }
    }
  ]
}
```

`counts` carries all precomputed group × season combinations: the "all groups" or "all seasons" total displayed for a filter is summed on the client from this structure, with no new network call.

## "Live data" mode

- **Endpoint:** `https://api.gbif.org/v1/occurrence/search` (search API, not `occurrence/download`, which is an asynchronous bulk export unsuited to a request triggered by a filter change).
- **Typical parameters:** `country=FR`, `taxonKey=<id of the selected group>` (repeated if several keys, see table below; omitted if "Tous les groupes"), `month=<month of the selected season>` (repeated per month, or omitted if "Toutes saisons"), `hasCoordinate=true`, `hasGeospatialIssue=false` (singular here, see note on `hasGeospatialIssues` above), `limit=300`.
- **`taxonKey` per group** (verified via `GET /v1/species/match` against the GBIF Backbone Taxonomy):

  | Group | `taxonKey` |
  |---|---|
  | `birds` | 212 (class Aves) |
  | `mammals` | 359 (class Mammalia) |
  | `reptiles-amphibians` | 131 (class Amphibia), 11418114 (Testudines), 11592253 (Squamata), 11493978 (Crocodylia) |
  | `insects` | 216 (class Insecta) |
  | `plants` | 7707728 (phylum Tracheophyta) |
  | `fungi` | 5 (kingdom Fungi) |

  The GBIF backbone no longer recognizes "Reptilia" as a valid class (pro parte synonym with no attached occurrence): reptiles are split there into several classes of equivalent rank (Testudines, Squamata, Crocodylia), hence the multiple keys for this group.
- **Rendering:** raw points (no client-side H3 aggregation, see "Map technology" in `technical-specifications.md`), capped at one page of results (300, without automatic pagination) to stay responsive.
- **Known limitation to document in the interface:** a sample, not an exhaustive view; CORS validated during implementation (`Access-Control-Allow-Origin: *` on `api.gbif.org`, with no restriction).

## Validation constraints specific to this visualization

- Each H3 cell of the output JSON carries the six groups and the four seasons in `counts`, even at zero (no omitted key), to simplify reading on the client.
- The sum of `counts` per group over the four seasons must be consistent with a possible per-group total if one is also exposed (not planned in the format above, computable on the client).
