# Data model: The Migration Routes

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

Four datasets, one per species (see "Study selection" below):

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| LifeTrack White Stork Bavaria (2014-2023) | Movebank Data Repository | https://doi.org/10.5441/001/1.v1cs4nn0_2 | CC0 1.0 Universal | 2026-09-07 |
| Migratory connectivity and population specific migration routes in a long-distance migratory bird | Movebank Data Repository | https://doi.org/10.5441/001/1.tb272jc1 | CC0 1.0 Universal | 2026-09-08 |
| Flying on their own wings — young and adult cuckoos respond similarly to long-distance displacement during migration | Movebank Data Repository | https://doi.org/10.5441/001/1.vk36vq82 | CC0 1.0 Universal | 2026-09-08 |
| GPS tracking of honey buzzards in Finland | Movebank Data Repository | https://doi.org/10.5441/001/1.335 | Attribution-NonCommercial 4.0 International | 2026-09-08 |

Only the honey buzzard dataset carries a restriction (non-commercial use): an exception explicitly approved by the user (see "History" below), compatible with the site's already non-commercial license (CC BY-NC-SA, see "Footer" in `style-guide.md`) but more restrictive than the other three datasets (CC0). Displayed as is in the page's source credit block (see "Visualization page" in `style-guide.md`), with no special treatment.

## Study selection (done during implementation)

Four species in v3 (one in v1, three in v2, see "History" below): white stork, Montagu's harrier, common cuckoo, European honey buzzard. Found using the same method (search in the Movebank Data Repository index, `datarepository.movebank.org/server/api/discover/search/objects`).

### White stork (`white-stork`)

[LifeTrack White Stork Bavaria (2014-2023)](https://doi.org/10.5441/001/1.v1cs4nn0_2), Movebank Data Repository, CC0 1.0 Universal license, led by the Max Planck Institute of Animal Behavior (Fiedler, Leppelsack, Leppelsack, Stahl, Wieding, Wikelski). Public study, accessible without an account via the Movebank Data Repository API (DSpace REST, `datarepository.movebank.org/server/api/...`), distinct from the homonymous "live" study on movebank.org (which requires an account). On-board GPS tags (eobs), fixes every 5 minutes.

| `individualId` | Movebank name (anonymized in output) | Southern reach |
|---|---|---|
| `CC_001` | Sophie + / DER AT898 (eobs 2664) | Southern Africa (-29.1°) |
| `CC_002` | Klippi / DER AU955 (e-obs 3018) | Sahel (10.7°N) |
| `CC_003` | Sepp + / DER AF369 (eobs 3949) | Sahel (11.5°N) |
| `CC_004` | Vitus + / DER AT886 (eobs2760) | Sahel (13.5°N) |

### Montagu's harrier (`montagus-harrier`)

[Trierweiler et al. (2014)](https://doi.org/10.5441/001/1.tb272jc1), *Migratory connectivity and population specific migration routes in a long-distance migratory bird*, Proc. R. Soc. B. CC0 license. Rich study (34 individuals, several European populations, several years 2005-2011), **single-satellite Argos Doppler** tags (`sensor-type = argos-doppler-shift`), not GPS like the other three species.

**Anomaly discovered and corrected after the fact:** the first trajectories published for this species showed individuals reaching southern Africa (down to -27.9°), making the map spectacular but wrong. Single-satellite Argos Doppler positioning is intrinsically ambiguous: each measurement produces two possible solutions, symmetrical on either side of the satellite's ground track (two distinct lat/lon pairs in the source file, `location-lat/long` and `argos:lat2/lon2`). The source file keeps one of the two solutions by default, sometimes the wrong one: this is what placed some points in the middle of the Atlantic Ocean or in Greenland, thousands of kilometers from a plausible route. Filtering by Argos quality class (`argos:lc`, standard for this type of data) was not enough on its own: a measurement can be of excellent precision (class 3, 2 or 1) while having kept the wrong one of the two solutions. Corrected by choosing, for each point, whichever of the two solutions is closest to the last accepted point (standard method for resolving this ambiguity); see "Preprocessing" below.

**Consequence:** the actual reach of this species in this dataset is much more modest than announced in the first pass: none of the chosen individuals reaches the Sahara, the actual southern limit lies in the Sahel/Sudanian savanna (roughly 10-16°N). Corrected in the editorial text and in the table below.

| `individualId` | Movebank name | Southern reach |
|---|---|---|
| `CP_001` | Klaus Dieter | Sahel (14.1°N), spring only |
| `CP_002` | Jinthe | Sahel (15.7°N), autumn only |
| `CP_003` | Mathilde | Sahel (10.9°N) |
| `CP_004` | Hanna Luise | Sahel (13.9°N) |
| `CP_006` | Iben | Sahel (14.6°N), autumn only |
| `CP_008` | Tania | Sahel (11.5°N), autumn only |
| `CP_009` | Jo | Gulf of Guinea (10.0°N), spring only |
| `CP_010` | Michael | Sahel (13.6°N), spring only |

(`CP_005` Dominik and `CP_007` Karen ruled out: none of their legs passes the consistency filter once the Doppler ambiguity is resolved; identifiers are not reassigned, hence the gap in the numbering.)

### Common cuckoo (`common-cuckoo`)

[Thorup et al. (2020)](https://doi.org/10.5441/001/1.vk36vq82), *Flying on their own wings: young and adult cuckoos respond similarly to long-distance displacement during migration*, Scientific Reports. CC0 license. Experimental displacement study (cuckoos were captured during migration and displaced by 1,800 km before release); the two individuals chosen here are those whose valid positions (`visible = true`) form a real, usable migration route, not the experimental displacement segments themselves (not included). Very low-frequency Argos/GPS satellite tags (a few points per week, compared with several per hour for the other two species): noticeably more angular trajectories once displayed, accepted as such rather than artificially smoothed. Autumn only for both individuals: no spring return in the available data (tags that stop transmitting, or simply were not tracked long enough).

| `individualId` | Movebank name | Southern/western reach |
|---|---|---|
| `CC2_001` | PB143376 | West Africa (-9.7°), looping route west across the Sahel |
| `CC2_002` | PB143114 | Sahara/Sahel (18.0°N) |

### European honey buzzard (`honey-buzzard`)

[Byholm, Mirski, Vansteelant (2025)](https://doi.org/10.5441/001/1.335), *GPS tracking of honey buzzards in Finland*, Movebank Data Repository, linked to a publication in Animal Behaviour. **Attribution-NonCommercial 4.0 International license** (the only exception to CC0 among this visualization's datasets, see "Source dataset" and "History"). 28 individuals, GPS tags (good frequency, comparable to the stork).

Biological peculiarity that required adapting the preprocessing: the honey buzzards in this study often spend 8 to 9 months nearly motionless at their wintering site (sometimes identical daily positions down to the decimal, a genuinely faithful site rather than a tag failure, confirmed by movement resuming afterwards) and some only set off on their return migration after a full year (a "sabbatical year", a documented behavior in this species). The fixed 120-day window is not enough to capture this return; see "Preprocessing" below for the adaptation made.

| `individualId` | Movebank name | Southern reach |
|---|---|---|
| `PA_001` | Jaana | Southern Africa (-17.8°), autumn and spring |
| `PA_002` | Lars | West Africa (-10.7°), autumn and spring |
| `PA_003` | Senta | Central Africa (-5.6°), autumn only |
| `PA_004` | Matti | Gulf of Guinea (4.4°N), autumn only |
| `PA_005` | Venus | Gulf of Guinea (7.1°N), autumn only |
| `PA_006` | Roosa | Gulf of Guinea (0.2°N), autumn only |
| `PA_007` | Anni | West Africa (-10.2°), autumn only |
| `PA_008` | Mohammed | Central Africa (-6.9°), autumn only |
| `PA_010` | Ulla | Gulf of Guinea (2.8°N), autumn only |

(`PA_009` Edit ruled out: neither its autumn leg nor its spring leg passed the consistency filter.)

Anonymization prefixes per species: `CC` (stork, *Ciconia Ciconia*), `CP` (harrier, *Circus Pygargus*), `CC2` (cuckoo, distinct from `CC` despite the identical initial), `PA` (honey buzzard, *Pernis Apivorus*).

## History

**v1 (a single species):** only the white stork had a usable dataset found in the time available; the other candidates at the time (swallow, black kite, osprey, wood pigeon) had none (e.g. the "Black Kites at the Strait of Gibraltar" dataset, although CC0, only covers a few days around the strait, not a complete migration route).

**v2:** Montagu's harrier and the common cuckoo added at the explicit request of the user, who listed five candidate species (osprey, turtle dove, harrier, honey buzzard, cuckoo). Search redone for these five:
- **Harrier** → Montagu's harrier (*Circus pygargus*), the best documented on Movebank for a complete Europe-Africa migration: dataset found, CC0, added.
- **Cuckoo** → common cuckoo (*Cuculus canorus*): dataset found, CC0, added (see resolution limitation above).
- **Osprey** (*Pandion haliaetus*): no openly accessible Europe-Africa dataset found in the Movebank Data Repository; the CC0 datasets available for this species cover North American populations (wrong geography for this visualization). Still absent.
- **Turtle dove** (*Streptopelia turtur*): no results in the Movebank Data Repository index; existing tracking studies (e.g. the "TURTUR_VLAANDEREN" program) are "live" studies on movebank.org requiring an account, not datasets published in the repository. Still absent.
- **Honey buzzard** (*Pernis apivorus*): a dataset found, but under an Attribution-NonCommercial 4.0 license; set aside at this stage, pending an explicit decision from the user on using an NC license.

**v3:** the user approved using the CC BY-NC license for the honey buzzard (see "Source dataset" above); added.

**v4:** while extending the map framing northward (see "Known limitation: northern framing" in `technical-specifications.md`) to properly show the breeding grounds of the species added in v2, several Montagu's harrier trajectories appeared as aberrant straight lines crossing the entire map. Diagnosis: poorly resolved Argos Doppler positions (see "Montagu's harrier" above), present since v2 but barely visible as long as the restricted framing cut them off out of view. Corrected at the source (see "Preprocessing" below); the Montagu's harrier southern reaches documented in v2 (down to -27.9°) were therefore already wrong and are corrected here.

Osprey and turtle dove remain absent from `tracks.json` for lack of a suitable source; adding them later involves no code change (see "Output format").

**v5 (this revision):** basemap enriched with rivers and shaded relief, at the explicit request of the user. No change to `tracks.json` or to the species; see "Rivers (basemap)" and "Relief (basemap)" below for the sources and preprocessing, and "Rivers" / "Relief: alignment on resize" in `technical-specifications.md` for rendering.

## Rivers (basemap)

Added in v5 (see "History" above), at the explicit request of the user. Source: Natural Earth, "1:50m Rivers + Lake Centerlines" dataset (public domain, no attribution required), same lineage as the land silhouette in `basemap.json` (see "Map technology" in `technical-specifications.md`): consistent with the very zoomed-out scale of this map, unlike the OpenStreetMap/Overpass approach used for `paris-trees` and `monument-layers` (local precision, designed for a city or country map, not suitable here without heavy manual curation of a list of "major rivers" per country).

Retrieved via the community GeoJSON mirror of Natural Earth ([nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector), maintained by a former lead of the Natural Earth project; same public-domain data as the official shapefile, avoids a shapefile → GeoJSON conversion step for a one-off preprocessing), file `ne_50m_rivers_lake_centerlines.geojson`, 462 features worldwide, `retrieved` 2026-09-11.

**Worldwide coverage, not just Europe/Africa:** a first attempt limited the segments kept to those falling within the map's framing rectangle (lng -25/45, lat -36/68, see "Projection" in `technical-specifications.md`), consistent with the fact that zoom/pan remains bounded to this area (see "Interactions" in `functional-specifications.md`), but the land silhouette itself is not clipped to this area (see "Basemap" in `technical-specifications.md`): the rest of the world (Americas, Asia, Oceania) visibly overflows on the sides as soon as the page loads, never requiring a pan to reach it depending on the shape of the window (variable width/height ratio, see "Default mount area height" in the general `technical-specifications.md`). Widened at the explicit request of the user to cover the entire map rather than just this rectangle.

**Preprocessing (one-off script, not committed):** no geographic filter or threshold on the source dataset's `scalerank` attribute (a global threshold would have wrongly excluded very recognizable rivers at the Europe/Africa scale, such as the Rhône or the Po, which carry the lowest rank in this dataset; worldwide coverage makes the question moot anyway). Each source feature (`MultiLineString`, since a river is often split into several segments) is flattened as is. Coordinates rounded to six decimals (same convention as `rivers.json`/`seine.json` in `monument-layers`/`paris-trees`), segments gathered into a single `MultiLineString` geometry with no properties, written to `public/data/bird-migrations/rivers.json`.

**Output format**, same shape as `rivers.json` in `monument-layers`/`seine.json` in `paris-trees`: raw geometry, no `Feature`, no properties, purely decorative (no interaction, no derived data):

```json
{ "type": "MultiLineString", "coordinates": [[[2.3522, 48.8566], [4.8, 47.3]], ...] }
```

895 segments (worldwide coverage), 25,641 points, 566 KB.

## Relief (basemap)

Added in v5 (see "History" above), at the explicit request of the user, explicitly subject to feasibility: the site's first raster asset, a break from the 100% vector silhouette style of the other three maps (`biodiversity`, `flower-phenology`, and `bird-migrations` itself until now), approved after a prototype comparing a "soft" tint and a "strong" tint (soft tint chosen, see "Relief" in `technical-specifications.md`).

Source: Natural Earth, "Gray Earth with Shaded Relief, Water" raster dataset at 1:50m scale (`GRAY_50M_SR_W`, public domain, no attribution required), same lineage as the land silhouette. Retrieved once from the official Natural Earth distribution (`naturalearth.s3.amazonaws.com/50m_raster/GRAY_50M_SR_W.zip`, 11 MB compressed, `retrieved` 2026-09-11): source TIFF 10,800 × 5,400 px, equirectangular grid (1/30° per pixel).

**Worldwide coverage, not just Europe/Africa:** same reason as for the rivers above (user feedback after a first attempt limited to the framing rectangle): an attempt limited to this rectangle left the out-of-frame portions of the silhouette (Americas, Asia, Oceania, visible on the sides as soon as the page loads depending on the shape of the window) as a flat plain beige with no relief or rivers, inconsistent with the rest of the silhouette. See "Relief: alignment on resize" in `technical-specifications.md` for the technique used to align an image whose extent goes far beyond the Europe/Africa framing.

**Preprocessing (one-off Node script, not committed):**

1. Compute the pixel extent of the complete land silhouette (`objects.land` from `basemap.json`, same data as the basemap, bounds computed via `path.bounds()` on the complete geometry rather than on the Europe/Africa rectangle alone) under the map's actual projection (`d3.geoNaturalEarth1`, `d3-geo` module already used client-side) calibrated on the Europe/Africa framing rectangle (`viewBounds`, same calibration as `render.ts` for alignment at render time, see "Reference resolution" below): this extent goes far beyond this rectangle in both dimensions (the Americas and Asia/Oceania overflow far to the left and right), hence an image much larger than the Europe/Africa framing alone.
2. Reproject the source raster (equirectangular) onto this complete extent: for each output pixel, `projection.invert()` gives the corresponding geographic coordinate, whose nearest pixel is sampled in the source TIFF.
3. Tint each pixel by blending the silhouette background color (`#e4e2da`) with a factor derived from the source gray level (shaded relief): `0.78 + 0.22 × (gray level / 255)`, "soft" tint chosen after comparison with a "strong" tint (`0.55 + 0.45 × ...`): a barely perceptible shading that never competes with the trajectory colors or the map's readability.
4. Export as WebP (photographic content with soft gradients, compresses much better than PNG for this type of content), written to `public/data/bird-migrations/relief.webp`.

No clipping to the land silhouette in the asset itself (the ocean remains visible in neutral gray in the source file): clipping is done at render time, via the same vector path (`ctx.clip()`) as the current silhouette fill (see "Relief" in `technical-specifications.md`), so the coastline remains sharp (vector path), only the interior texture is a raster image.

**Reference resolution:** the pixel density (px per degree) used for the entire image is the one calibrated on the Europe/Africa rectangle at 2600 × 4348 px (`RELIEF_REF_WIDTH`/`RELIEF_REF_HEIGHT` in `render.ts`), chosen after trials at several resolutions (1000 to 3200 px wide on this rectangle alone): the source raster (1/30° per pixel) caps the detail actually available over this extent at around 2000-3000 px; beyond that, the image would only add interpolation without any real additional detail. Applied to the complete extent of the silhouette (12,922 × 6,716 px, with an origin `RELIEF_ORIGIN_X`/`RELIEF_ORIGIN_Y` = (-5523, -496) offset from the Europe/Africa rectangle, see "Relief: alignment on resize" in `technical-specifications.md`). The file size remains reasonable despite the much larger surface (WebP compresses this type of soft-gradient content very efficiently): 547 KB for worldwide coverage, compared with 83 KB for the Europe/Africa rectangle alone in the first attempt. Accepted trade-off: at the map's maximum zoom (×6, see "Interactions" in `functional-specifications.md`), the relief texture may soften slightly beyond its native resolution, unlike the coastline (still vector), which stays sharp at every zoom level.

## Raw data schema (Movebank source)

Fields of the study's GPS file used during preprocessing:

| Movebank field | Usage |
|---|---|
| `individual-local-identifier` | Individual identifier (anonymized in output, see "Output format") |
| `location-lat`, `location-long` | GPS position |
| `timestamp` | Timestamp of the position |

## Preprocessing (done during implementation, outside the build)

One one-off script per species (not committed, to be rerun manually if the data or the selection of individuals changes), sharing the same base logic:

1. Download the study's complete GPS/Argos export (a single CSV file for all individuals per study; ≈ 196 MB for the stork, ≈ 13 MB for the harrier, ≈ 12 MB for the honey buzzard, ≈ 22 KB for the cuckoo).
2. Isolate the points of the chosen individuals, keeping only positions marked as valid (`visible = true` in the Movebank CSV; the harrier, cuckoo and honey buzzard datasets contain this flag, unlike the stork dataset).
3. **Harrier only: resolve the Argos Doppler ambiguity:** keep only positions of quality class 3, 2 or 1 (`argos:lc`; classes with no error estimate or explicitly invalid ones are discarded), then, for each remaining position, choose which of the two Doppler solutions (`location-lat/long` or `argos:lat2/lon2`) is closest to the individual's last accepted point (see "Montagu's harrier" above). An implicit speed filter (reject a point if the implied movement exceeds 150 km/h *and* 1,500 km since the last accepted point) is still applied afterwards as a safety net, but no longer triggers on this dataset once the ambiguity is resolved at the source.
4. Convert each date to a day of the year (1-365), "unwrapping" the sequence (+365 at each backward step) to obtain a continuous time axis per individual, independent of the actual calendar year: necessary to replay several birds, tracked in different years, on a single simulated cycle (see "Single calendar cycle" in `functional-specifications.md`).
5. Find the point of minimum latitude (the winter stay) within an initial window (the individual's first ~250 to 430 days depending on the species, so as not to confuse it with a wintering in a later year); split into two legs: `autumn` = 120 days before this point, `spring` = from this point onward (see next step for its duration, which varies by species).
6. **Spring leg duration, adapted per species:** fixed 120-day window for the stork and the harrier (quick return, a few weeks); for the honey buzzard, window extended adaptively until the individual comes back to within 15° of its starting latitude, capped at 700 days (return sometimes very late, or even deferred by a full year, see "European honey buzzard" above). Without this adaptation, no honey buzzard return was captured by the fixed 120-day window used for the other two species.
7. **Consistency filter** (added for the harrier, extended to the honey buzzard, several individuals of which produced a split inconsistent with the raw heuristic): reject an `autumn` leg whose arrival month is not between September and February or whose net latitude change is not at least 15° southward; reject a `spring` leg that does not reach, within its window, a latitude within 15° of the individual's starting latitude. An individual that passes the filter in only one direction appears only for that direction (see per-species tables above).
8. Simplify each leg (Douglas-Peucker, polyline in lat/lng, with no added dependency: implemented directly in the preprocessing script) to reduce the number of points while preserving the general shape of the route. Not applied to the cuckoo (already very few points per individual).
9. Anonymize the individual identifier (`<species-prefix>_<sequential number>`, see prefixes above), with no link to the original Movebank name in the published data. An individual none of whose legs passes the consistency filter (e.g. `CP_005`, `CP_007`) does not appear in the output, but its number is not reassigned to another individual.
10. Merge the four species into a single `public/data/bird-migrations/tracks.json` (200 KB, 32 legs, 1935 points in total) and `public/data/bird-migrations/basemap.json` (worldwide land silhouette, derived from Natural Earth via the `world-atlas` package, `land` object only, without country borders: 90 KB, unchanged).

**Known limitation of the autumn/spring split:** the heuristic (minimum latitude point, consistency filter in step 6) assumes a clear route in one direction, within a reasonable time frame even when adapted per species. Individuals whose behavior departs from this (long, stationary wintering, erratic movements in Africa, return beyond even the extended window) are rejected by the filter rather than mislabeled: several candidate storks, harriers and honey buzzards were ruled out for this reason (see per-species tables above, individuals not listed or listed as "autumn only"/"spring only").

## Output format

```json
{
  "species": [
    { "id": "white-stork", "nameFr": "Cigogne blanche", "nameEn": "White Stork" },
    { "id": "montagus-harrier", "nameFr": "Busard cendré", "nameEn": "Montagu's Harrier" },
    { "id": "common-cuckoo", "nameFr": "Coucou gris", "nameEn": "Common Cuckoo" },
    { "id": "honey-buzzard", "nameFr": "Bondrée apivore", "nameEn": "European Honey Buzzard" }
  ],
  "tracks": [
    {
      "individualId": "CC_001",
      "speciesId": "white-stork",
      "direction": "autumn",
      "points": [
        { "lat": 48.5, "lng": 2.2, "date": "2015-10-11" },
        { "lat": 46.1, "lng": 1.8, "date": "2015-10-14" }
      ]
    }
  ]
}
```

`speciesId` in English kebab-case (see the general conventions of `data-model.md`); the color of each species is not stored in the data (see palette in `technical-specifications.md`), it is assigned client-side by order of appearance in `species`. Adding a species amounts to adding an entry in `species` and its associated `tracks`, with no schema change.

## Client-side derived fields (not in the JSON)

- **Total distance traveled:** computed at display time from the sequence of points (great circle between consecutive points), not precomputed.
- **Migration duration:** difference between the first and the last date of `points`.

## Validation constraints specific to this visualization

- Each `speciesId` referenced in `tracks` exists in `species`.
- Each trajectory (`points`) is sorted by ascending `date`.
- An individual (`individualId`) appears only once per `direction` (one autumn trajectory and, if available, one spring trajectory, never two trajectories for the same direction).
