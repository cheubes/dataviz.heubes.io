# Data model: The Monarch Migration

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

A single dataset, a set of aggregated occurrences:

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| GBIF Occurrence Data (*Danaus plexippus*, North America) | GBIF.org | https://www.gbif.org/species/5133088 | CC0 / CC BY (varies by occurrence, see "Attribution" in `biodiversity/data-model.md` for the same nuance) | 2026-09-21 |

## A single data mechanic: aggregated density, no individual trajectories

No monarch travels the full route (relay between successive generations, see "Editorial angle" in `functional-specifications.md`): the available data is a cloud of GBIF observations, not individual GPS positions. Same family of source as `flower-phenology`, but aggregated spatially (a North American grid per month) rather than in a radial calendar.

**Refocused scope:** the first implementation of this visualization, under the title "Les grandes migrations", also brought together GPS/Argos trajectories of humpback whales, blue whales and wildebeest (Movebank Data Repository). Refocused on the monarch alone at the user's request; these three datasets, their preprocessing and their rendering have been removed from the code and the data, and remain available in the branch's git history.

## Preprocessing (done during implementation, outside the build)

**Departure from the initial principle (aggregation via the GBIF SQL Downloads API, like `biodiversity`), imposed by an access constraint:** this API requires an authenticated GBIF account (`POST /v1/occurrence/download/request`), unavailable at the time of implementation. Replaced by an equivalent aggregation via the public search API, without authentication:

1. Regular 1° × 1° latitude/longitude grid over North America (14°N-52°N, 125°W-65°W, i.e. 2,280 cells of 38 × 60), fitted to the monarch's range (breeding areas up to southern Canada, migration corridor, overwintering sites in Mexico) rather than to an H3 grid like `biodiversity`. A first version at 2° (570 cells) was refined to 1°: at this regional framing, the 2° cells were too coarse to the naked eye.
2. For each cell: a `GET /v1/occurrence/search` request with `taxonKey=5133088` (*Danaus plexippus*), `hasCoordinate=true`, `hasGeospatialIssue=false`, `geometry` (WKT polygon of the cell) and `facet=month&facetLimit=12&limit=0`: the monthly facet returns in a single request the number of occurrences per month for this cell, without ever downloading an individual record (774,264 georeferenced occurrences on the North American continent before the quality filter and clipping to the grid's footprint, far beyond what full pagination would allow). All years are aggregated, with no filter on the year or on the record type.
   - **Half-open cells `[min, max[`:** GBIF search polygons include their edge, so a point located exactly on the boundary between two cells (coordinates rounded to the degree, which are common) would be counted twice. Verified on latitude 40°: 14 points exactly on it, counted in the cell below; moving to 1° multiplies these boundaries. Each polygon therefore stops `1e-7`° short of its northern edge and of its eastern edge, so that a point belongs to only one cell (the one whose southern or western edge it touches). The first version at 2° counted these points twice.
   - **API rate limit:** three requests in parallel, a pause shared by all calls for the duration of the `Retry-After` (3 seconds) on each 429 error, progress saved cell by cell to resume after an incident. 2,280 cells retrieved without failure in about twenty minutes, with 343 rate-limiting pauses absorbed.
3. Output: one record per (cell, month) combination with at least one occurrence: 7,290 combinations, 1,270 distinct active cells out of the 2,280 (up to 960 active in the busiest month, August), 395,170 observations kept in total. Cell center as `lat`/`lng` (see "Output format" below), `DENSITY_CELL_DEGREES = 1` replicated as a constant in `render.ts` for drawing (see `technical-specifications.md`).

A posteriori check on the mean latitude weighted by month (29°N in January, 41°N in August, back to 30°N in December): consistent with monarch biology (Mexican overwintering, summer expansion northward, autumn migration), no additional reprocessing deemed necessary. Consistency check against the first version at 2°: aggregated to 2°, the 1° dataset gives 395,170 observations versus 395,157, a difference of 13 (0.003%), with no isolated cause (the GBIF database evolves continuously, and the first version counted points located on a boundary twice).

## Output format

`public/data/monarch-migration/density.json`, a flat array:

```json
[
  { "month": 3, "lat": 19.5, "lng": -99.5, "count": 412 }
]
```

- `month`: 1 (January) to 12 (December).
- `lat`, `lng`: center of the 1° × 1° cell (latitudes from 14.5 to 51.5, longitudes from -124.5 to -65.5, always on a half degree).
- `count`: number of observations in the cell that month, all years combined (strictly positive integer: empty combinations are absent).

## Client-side derived fields (not in the JSON)

- **Displayed value per cell, at each instant:** linear interpolation between the `count` of the current month and that of the following month (a missing month counts as zero), see "Animation" in `technical-specifications.md`.
- **Annual maximum per cell:** largest `count` of the cell over the twelve months, denominator of the percentage displayed in the tooltip (see "Interactions" in `functional-specifications.md`).
- **Global maximum:** largest `count` across all cells and all months (4,904), upper bound of the opacity scale.

## Validation constraints specific to this visualization

- `month` between 1 and 12, `count` a strictly positive integer.
- The (`lat`, `lng`, `month`) triplet is unique.
- `lat`, `lng` fall on the centers of the 1° grid (see "Output format").
