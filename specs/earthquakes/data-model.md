# Data model: The Fault Lines

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

Two datasets:

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Earthquake Catalog (fdsnws/event) | United States Geological Survey (USGS) | https://earthquake.usgs.gov/fdsnws/event/1/ | Public domain, confirmed during implementation on the official USGS policies page ("USGS-authored or produced data and information are considered to be in the U.S. Public Domain") | 2026-09-16 |
| Tectonic plate boundaries (Bird model, 2003) | Peter Bird, redistributed by Hugo Ahlenius/Nordpil (`fraxen/tectonicplates` repository) | https://github.com/fraxen/tectonicplates | Open Data Commons Attribution License (ODC-BY), attribution to Hugo Ahlenius, Nordpil and Peter Bird required | 2026-09-16 |

USGS API queried directly (`fdsnws/event/1/query?format=geojson&starttime=1900-01-01&minmagnitude=6&orderby=time-asc`), native GeoJSON format, rich fields (magnitude, depth, date, location, intensity), no blocking encountered. Plate boundaries retrieved from `GeoJSON/PB2002_boundaries.json` in the `fraxen/tectonicplates` repository (241 boundary segments, each a `LineString`).

## Chosen angle: same mechanics as volcanic-eruptions, plates revealed

Decided explicitly with the user (see framing discussions): a deliberate reuse of the `volcanic-eruptions` mechanism (world map on a continuous loop, each event pulses at its real date, pulse intensity tied to magnitude), rather than forced differentiation. Two elements nonetheless set this visualization apart:

1. **Tectonic plate boundaries drawn as a static overlay** (see "Rendering" in `technical-specifications.md`): the seismic pulses, computed solely from USGS data, come to follow these independently drawn lines (Bird's geophysical model, 2003), making the geological structure visible without stating it in the text.
2. **Radically different time window and volume**: since the start of the instrumental era (~1900) rather than ten thousand years, major earthquakes only (see "Chosen scope" below) rather than the whole of a geological catalog: an order of magnitude of density and rhythm very different from `volcanic-eruptions`, even though the basic visual mechanism is the same.

## Chosen scope

Decided explicitly with the user (see framing discussions): **magnitude ≥ 6.0, since 1900**. Actual volume measured during implementation: **14,453 earthquakes** (1900 to 2026), markedly denser than the "a few thousand" anticipated during framing (see "Points decided during implementation" in `technical-specifications.md` for the effect on the animation calibration). Distribution by decade relatively stable (from 350 events in 1900-1909 to a peak of 1,585 in 2000-2009), no marked completeness bias comparable to the one documented for `volcanic-eruptions`: the magnitude 6 threshold seems high enough to be reliably detected from the start of the instrumental era.

The USGS catalog returned for this query also includes non-seismic events recorded by the same networks (`properties.type`): 69 nuclear tests and 1 explosion, excluded from the output file (see "Validation constraints" below) to keep only `type: "earthquake"` (14,453 of the 14,523 raw events returned by the API).

## USGS fields used

| Field (GeoJSON `properties`/`geometry`) | Usage |
|---|---|
| `mag` | Pulse intensity/size (see "Rendering" in `technical-specifications.md`) |
| `place` | Detail card |
| `time` | Position on the simulated timeline |
| `coordinates` (longitude, latitude, depth) | Position on the world map; depth shown in the detail card, not visually encoded (see framing discussions: magnitude remains the only main visual dimension, like the VEI for `volcanic-eruptions`) |

## Selection of earthquakes to annotate

The seven candidates anticipated during framing were all found in the actual catalog, with their real USGS identifier: San Francisco (`official19060418131226300_12`, M7.9, 1906), Chile (`official19600522191120_30`, M9.5, 1960, the most powerful ever recorded), Alaska (`official19640328033616_30`, M9.2, 1964), Tangshan (`usp0000hjg`, M7.5, 1976, identified by the exact timestamp of the main shock, 1976-07-27T19:42:54 UTC, i.e. July 28 at 3:42 a.m. Beijing time, a well-documented historical date), Sumatra-Andaman (`official20041226005853450_30`, M9.1, 2004), Haiti (`usp000h60h`, M7.0, 2010), Tōhoku (`official20110311054624120_30`, M9.1, 2011). These seven entries carry `notable: true`.

## Output format

```json
{
  "generatedAt": "2026-09-16",
  "plateBoundaries": { "type": "MultiLineString", "coordinates": [] },
  "earthquakes": [
    { "id": "official19060418131226300_12", "lat": 37.75, "lng": -122.55, "year": 1906, "magnitude": 7.9, "depthKm": null, "place": "The 1906 San Francisco, California Earthquake", "notable": true, "nameFr": "Le séisme de San Francisco", "nameEn": "The San Francisco earthquake" }
  ]
}
```

`plateBoundaries` directly carries the plate boundary geometry (see "Source dataset" above), no separate file: a single static dataset, unlike `earthquakes`, which carries the time dimension. `notable`/`nameFr`/`nameEn` only for the selected earthquakes (see "Selection of earthquakes to annotate" above), same convention as `volcanic-eruptions`. `depthKm` is `null` for 103 old earthquakes with no depth recorded in the catalog (mainly the historical events taken from the ISC-GEM centennial catalog, `cent` network): shown as such in the detail card rather than replaced by an invented value. `id` directly reuses the native identifier of the USGS event (`properties.id` / `feature.id` of the source GeoJSON), not a reconstructed identifier.

## Validation constraints specific to this visualization

- `earthquakes` is sorted by ascending `year` (by exact timestamp before simplification to the year, for a stable order between earthquakes of the same year).
- An earthquake marked `notable: true` carries `nameFr` and `nameEn`.
- `plateBoundaries` is a valid geometry (`MultiLineString`), not a full `FeatureCollection`: no need for per-plate properties (name, boundary type) for this visualization, a deliberate simplification compared to the full source dataset.
- `earthquakes` only contains events whose `properties.type` is `"earthquake"` in the USGS response: excludes nuclear tests and explosions recorded by the same seismic networks (see "Chosen scope" above).
