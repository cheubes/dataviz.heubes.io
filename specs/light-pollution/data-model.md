# Data model: The Sky, Year by Year

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| VIIRS Nighttime Lights (VNL), annual composites | NOAA Earth Observation Group | https://eogdata.mines.edu/products/vnl/ | Creative Commons Attribution 4.0 International | 2026-09-09 |

Satellite nighttime radiance data, native resolution of 15 arc seconds (~500 m at the equator), global coverage (65°S to 75°N). Originally public domain (National Oceanic and Atmospheric Administration, a US federal agency), republished by the Earth Observation Group under CC BY 4.0 with a citation requirement. Same primary source as existing light pollution maps (ANPCEN, AVEX, lightpollutionmap.info), used here directly rather than a third-party republication (see scoping discussions).

Two versions of the "Annual VNL V2" product were used to cover the whole period (see "Preprocessing" below): **v2.1** for 2013-2021 and **v2.2** for 2022-2025, EOG publishing this product in versioned annual increments rather than as a single continuously renumbered series. Both versions share the same processing methodology (same filtering thresholds, same "Annual VNL V2" pipeline): unlike the V1→V2 break (an algorithm change documented in the literature), there is no change of method between v2.1 and v2.2, only the addition of subsequent years. No artificial discontinuity found at the 2021/2022 junction in the resulting series (see "Points to validate during implementation" in `technical-specifications.md`).

## Geographic and temporal coverage

- **Geographic: mainland France**, on the same H3 hexagonal grid (resolution 4, 395 cells) already produced for `biodiversity` (see "Grid reuse" below), not the overseas departments, same scope as the site's other visualizations using this grid.
- **Temporal: annual composites from 2013 to 2025** (thirteen years). The 2012 composite was discarded (first VIIRS composite, partial coverage of the year, not comparable with the following ones). Explicit decision by the user (see scoping discussions): show the change over time rather than a snapshot; see "Editorial angle" in `functional-specifications.md` for what this change actually shows (a decline in light intensity, not an increase).

## Grid reuse

Technical decision made on reading `biodiversity/data-model.md`: the 395 H3 cells (resolution 4) and their geometries are reused as is from `public/data/biodiversity/hexbins.json` (same `h3` identifiers, same polygons), rather than a new grid selection/generation. This avoids redoing the work already done for `biodiversity` (filtering out aberrant coastal cells, fixing the ring orientation of H3 polygons, see "Preprocessing" in its `data-model.md`): only new properties (radiance and visibility class per year) are computed for these same cells, not a new geometry.

The mainland France silhouette used as the basemap (see "Rendering" in `technical-specifications.md`) is also identical to that of `biodiversity` (same `basemap.json` file, same geometry), but **duplicated** under `public/data/light-pollution/basemap.json` rather than shared through a cross-visualization fetch: each visualization has its own data under `public/data/<viz-slug>/` (see "File structure" in the general `technical-specifications.md`), same choice as `satellites-in-orbit`, which likewise duplicates its basemap rather than sharing it with `bird-migrations`.

## Sky visibility scale

Explicit decision by the user (see scoping discussions): the measured radiance is translated into a visibility scale inspired by the Bortle scale (the standard reference in amateur astronomy, nine levels from "excellent dark-sky site" to "inner-city sky"), rather than displayed in raw physical units (nW/cm²/sr).

The rigorous conversion from satellite radiance → zenith sky luminance (model by Falchi et al., *The New World Atlas of Artificial Night Sky Brightness*, 2016) requires modeling the atmospheric propagation of light (see e.g. Bühler, Deverchère, Plotard & Vauclair (DarkSkyLab), *Multi-faceted light pollution modelling and its application to the decline of artificial illuminance in France*, arXiv:2510.02977, 2026, which applies this approach to France): out of reach for this site, it is not a simple per-pixel computation. The table below is therefore a deliberate simplification, documented as such rather than presented as a rigorous Bortle classification: Six levels built on raw VIIRS radiance, calibrated on the actual distribution of the 395 cells × 13 years (target breakdown, not strict quantiles), qualitatively anchored on the available literature (usual VIIRS detection threshold ≈ 0.5 nW/cm²/sr for "no significant artificial light"; published field radiances, e.g. Nurbandi et al. 2016, ≈ 0.2-0.7 nW/cm²/sr for a rural/transition sky, ≈ 24-44 nW/cm²/sr for a city sky).

| Level | Radiance (nW/cm²/sr) | FR | EN | Share of cells (13 years combined) |
|---|---|---|---|---|
| 1 | < 0.3 | Ciel remarquable, Voie lactée bien visible | Pristine sky, Milky Way clearly visible | 30% |
| 2 | 0.3-0.6 | Ciel de campagne, halo lumineux distant | Rural sky, faint distant glow | 23% |
| 3 | 0.6-1.2 | Ciel périurbain, Voie lactée affaiblie | Suburban sky, Milky Way washed out | 21% |
| 4 | 1.2-2.5 | Ciel urbain, halo dominant | Urban sky, glow dominates | 15% |
| 5 | 2.5-6 | Ciel de grande ville, quelques dizaines d'étoiles visibles | City sky, only a few dozen stars visible | 8% |
| 6 | > 6 | Ciel de centre-ville, halo omniprésent | Inner-city sky, pervasive glow | 2% |

Bounds tightened toward the low end compared with a first proposal calibrated on point measurements (single pixel, ~500 m): averaging over a 1,770 km² cell (H3 resolution 4) strongly flattens urban peaks (maximum measured over France: 30.7 nW/cm²/sr, a Paris cell, far below the tens of thousands of nW/cm²/sr of a city-center pixel), hence thresholds about ten times lower than the "single pixel" benchmarks in the literature.

## Preprocessing (done during implementation, outside the build)

Unlike the site's other visualizations, preprocessing starts from **raster** data (a grid of pixels), not a tabular export: a "zonal statistics" type of geospatial processing is required, out of reach for a Node script alone without a dedicated dependency. Tool used: Python (`rasterio` 1.4.3 / `rasterstats` 0.21.0, `h3` 4.4.2), in a one-off local virtual environment (not a project dependency, same logic as `h3-js` or `topojson-simplify` for `biodiversity`/`bird-migrations`, see their `technical-specifications.md`).

1. Manual download by the user of the 13 VIIRS VNL "average_masked" annual composites (2013-2025, see "Source dataset" above for the versions), from `eogdata.mines.edu` (account required, OpenID Connect authentication). ~300 MB compressed per year, ~11.6 GB uncompressed each (global rasters of 86401×33601 pixels, WGS84, no regional cropping available since V2).
2. On-the-fly decompression (one file at a time, deleted after processing to limit disk usage) rather than cropping to the France bbox beforehand: `rasterstats.zonal_stats` reads only the window needed around each polygon, explicit cropping brought nothing.
3. For each H3 cell taken from `biodiversity/hexbins.json` and each year, computation of the mean radiance of the pixels contained in the cell polygon (zonal statistics, `rasterstats.zonal_stats`, mean only).
4. Conversion of each mean value into a level of the visibility scale (see "Sky visibility scale" above).
5. Writing of `public/data/light-pollution/skybins.json`.

**Pitfall encountered:** a variable bug (year used as a string key on write, looked up as an integer on read) silently produced an empty `byYear` for all 395 cells, with no error or warning; spotted only by inspecting the generated JSON, not when the script ran.

## Static data format

```json
{
  "type": "FeatureCollection",
  "scale": [
    { "id": 1, "nameFr": "Ciel remarquable, Voie lactée bien visible", "nameEn": "Pristine sky, Milky Way clearly visible" },
    { "id": 5, "nameFr": "Ciel de grande ville, quelques dizaines d'étoiles visibles", "nameEn": "City sky, only a few dozen stars visible" }
  ],
  "years": [2013, 2014, "…", 2024, 2025],
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3": "851f8ebfffffff",
        "byYear": {
          "2013": { "radiance": 0.4, "scale": 2 },
          "2024": { "radiance": 0.2, "scale": 1 }
        }
      },
      "geometry": { "type": "Polygon", "coordinates": [] }
    }
  ]
}
```

`geometry` identical to that of the corresponding cell in `biodiversity/hexbins.json` (see "Grid reuse" above). `scale` references the levels of the table above; `years` lists the thirteen years 2013-2025 (continuity confirmed, see "Source dataset" above and "Points to validate during implementation" in `technical-specifications.md`).

## Validation constraints specific to this visualization

- Each cell carries a `byYear` entry for each year listed in `years`, with no missing year (a cell with no usable data for a year remains an exception to be documented, not a silent absence).
- Each `scale` referenced in `byYear` exists in the top-level `scale` list.
- All 395 cells of `biodiversity/hexbins.json` are present here (same grid geometry, see "Grid reuse" above).
