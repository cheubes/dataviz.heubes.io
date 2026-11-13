# Data model: What Falls from the Sky

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: specified, not implemented.** Several choices remain to be confirmed (see "Points to validate" in `technical-specifications.md`).

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Meteorite Landings | The Meteoritical Society, via the NASA Open Data Portal | https://data.nasa.gov/dataset/meteorite-landings | Not specified by the source ("License not specified"), see "License" below | 2026-09-24 (scouting, to be redone during implementation) |

The dataset is a copy of the Meteoritical Bulletin Database (the reference database of meteorite names, maintained by the Meteoritical Society's nomenclature committee and hosted by the Lunar and Planetary Institute), deposited on NASA's open data portal. Description of the source, quoted as is: "This comprehensive data set from The Meteoritical Society contains information on all of the known meteorite landings." An update note dated May 14, 2013 adds: "Please find an updated data set from The Meteoritical Society that includes more recent meteorites. Under NameType, 'valid' is for most meteorites and 'relict' are for objects that were once meteorites but are now highly altered by weathering on Earth."

## Access (checked 2026-09-24, rechecked 2026-10-23)

The `data.nasa.gov` portal moved from Socrata to CKAN in 2025: the former endpoint `https://data.nasa.gov/resource/gh4g-9sfh.json` and the export `https://data.nasa.gov/api/views/gh4g-9sfh/rows.csv` now return 404. The dataset is kept as "legacy", under two CKAN records:

- **`meteorite-landings`** (historical identifier `https://data.nasa.gov/api/views/gh4g-9sfh`, publisher "data.nasa.gov"): four files under `https://data.nasa.gov/docs/legacy/meteorite_landings/`, `Meteorite_Landings.csv` (3.95 MB), `.json` (full Socrata export with metadata, 12.6 MB), `.xml` and `.rdf`. Each URL redirects (302) to a signed S3 URL, valid for one hour: retrieve with `GET` following redirects, not with `HEAD` (rejected with 403 by S3).
- **`meteorite-landings-api`** (identifier "API-17", publisher "National Aeronautics and Space Administration"): a single file, `gh4g-9sfh.json`, which contains only the first 1,000 rows (default limit of the former Socrata API, frozen as is). **Do not use.**

Chosen file: `Meteorite_Landings.csv`. The `.json` is only used to read the original Socrata metadata (last row update: July 20, 2015).

The portal site responds irregularly: several requests to `data.nasa.gov` pages and CKAN API took over 60 to 100 seconds during scouting, while the files themselves downloaded normally. The weekly source monitoring (see "Source monitoring" in the general `technical-specifications.md`) may therefore classify the page as "Unverified" from time to time.

### Upstream source ruled out: the Meteoritical Bulletin Database

The upstream database (`https://www.lpi.usra.edu/meteor/`) is more complete and up to date: 78,667 valid names according to its re3data record (date of this count not given), versus 45,641 in the NASA copy. It was not chosen:

- it is protected by a Cloudflare verification page ("Just a moment...", 403 response) that blocks any automated retrieval, like `volcano.si.edu` for `volcanic-eruptions`, and no documented web service or export was found to legitimately work around this block (only an RSS feed of new meteorites is mentioned);
- no license is published there: re3data only states "Copyrights", pointing to a Meteoritical Society page that says nothing about it, and the footer reads "© 2005- The Meteoritical Society".

A manual extraction from a browser remains possible but is neither reproducible nor better licensed (see "Points to validate" in `technical-specifications.md`).

## License

Both CKAN records carry `license_id: "notspecified"`, displayed as "License not specified". No text in the record, in the former Socrata export (no `license` or `attribution` field, only an `attributionLink` to `visualizing.org`, a defunct site) or in the upstream database explicitly allows or forbids reuse or redistribution.

NASA's "CC0 unless otherwise noted" policy (Earthdata "Data Use Policy" page) does not cover this case: it targets data "from a NASA-led mission", whereas this catalog is compiled by the Meteoritical Society. The record is published with `accessLevel: "public"`, under the Open Government Data Act, which allows public use without constituting a license.

Chosen consequences:

- **Use in the visualization:** acceptable, with explicit credit to the Meteoritical Society and the NASA portal in the source credit block. This is not a definitive legal reading.
- **Prepared data download:** not offered (no `downloads` attribute). The general rule (see "Prepared data download" in the general `functional-specifications.md`) allows a source "without a formal license but allowing redistribution with citation"; here, nothing allows redistribution, and the upstream source claims copyright. To be confirmed (see "Points to validate" in `technical-specifications.md`).

## Source fields used

| CSV column | Usage |
|---|---|
| `id` | Stable, unique identifier (45,716 distinct values), kept as is |
| `name` | Official name shown in the detail card (also unique, but with spaces and parentheses: `id` remains the identifier) |
| `nametype` | Not exported: 45,641 `Valid`, 75 `Relict` (all found, objects heavily altered by terrestrial weathering). Relicts are kept and treated like the others |
| `recclass` | Petrological class (466 distinct values, e.g. `L6`, `H5`, `Iron, IIIAB`, `Martian (shergottite)`), shown in the detail card without translation |
| `mass (g)` | Mass in grams, point size class (see "Rendering" in `technical-specifications.md`) |
| `fall` | `Fell` (seen falling, then picked up) or `Found` (found on the ground without its fall having been observed): point color and display toggle |
| `year` | Year of fall for `Fell`, year of discovery for `Found`: detail card only |
| `reclat`, `reclong` | Position (decimal degrees, WGS84); `GeoLocation` duplicates these two columns and is not read |

## Measurements (2026-09-24, file `Meteorite_Landings.csv`)

- **45,716 meteorites**, all with distinct names and identifiers.
- **Seen falling: 1,107 (2.4%). Found: 44,609 (97.6%).**
- **Period:** from 861 (Nogata, Japan, the oldest dated fall) to 2013. Only 11 entries date from 2013 and 234 from 2012: the catalog was frozen in spring 2013 (update note of May 14, 2013) and has not been updated since. 291 found meteorites have no year; one carries the year 2101 (Northwest Africa 7701), obviously wrong.
- **1969-1970 break:** 96% of found meteorites were found from 1970 onward (4,909 in the 1970s decade, 17,698 in 2000-2009), after a Japanese expedition discovered, in 1969, concentrations of meteorites on the blue ice of the Yamato Mountains. Observed falls, on the other hand, remain stable, between 40 and 90 per decade since 1860.
- **Mass:** 131 without mass, 19 at 0 g. From 0.1 g to 60 t (Hoba, Namibia, found in 1920). Median 32.6 g. Median of observed falls 2.8 kg, of finds 30.5 g: systematic campaigns in Antarctica mostly collect small fragments.
- **Largest observed falls:** Sikhote-Alin (1947, 23 t), Jilin (1976, 4 t), Allende (1969, 2 t), Kunya-Urgench (1998) and Norton County (1948), 1.1 t each.

### Positions

| Case | Count | Handling |
|---|---|---|
| Missing coordinates | 7,315 (including 10 falls) | Unknown location |
| Exact `0, 0` (fill value) | 6,214 (including 1 fall) | Unknown location |
| Latitude 0 and longitude 35.66667, name "Yamato" | 223 | Unknown location (the Yamato Mountains are in Antarctica, around 71.5° S: missing latitude replaced by 0) |
| Latitude 0, name "Meru" (Kenya) | 1 | Kept: Meru really is on the equator |
| Longitude 354.47333 (Meridiani Planum) | 1 | Excluded from the file: meteorite found on Mars by the Opportunity rover in 2005, in a Martian coordinate system |
| **Usable positions** | **31,963** (1,096 falls, 30,867 finds) | Map points |
| **Unknown location** | **13,752** (11 falls, 13,741 finds) | Counted, not drawn |

Unknown locations are not randomly distributed: 4,300 of the 4,499 "Northwest Africa" (Saharan meteorites bought at Moroccan markets, whose place of discovery is not documented) and more than 8,000 Antarctic meteorites (Yamato, Miller Range, LaPaz Icefield, Dominion Range…) are among them. The map therefore under-represents the Sahara, and the text must say so (see "Editorial angle" in `functional-specifications.md`).

### Concentration

- **Antarctica** (latitude below 60° S): 22,099 positioned meteorites, **71.6% of positioned finds**, and no observed fall.
- **Sahara and Arabian Peninsula** (15° N to 35° N, 20° W to 60° E): 5,579 positioned finds (Dar al Gani, Dhofar, Acfer, Hammadah al Hamra, Jiddat al Harasis, Sayh al Uhaymir…).
- **Stacking:** the 30,867 positioned finds occupy only 13,679 distinct positions (to the thousandth of a degree), versus 1,095 positions for 1,096 falls. Antarctic campaigns often assign the coordinates of the entire ice field: 4,761 Yamato meteorites share the same point (71.50° S, 35.67° E), 3,040 Queen Alexandra Range another (84° S, 168° E).

Distribution by 10° latitude band (usable positions):

| Band | Seen falling | Found | | Band | Seen falling | Found |
|---|---|---|---|---|---|---|
| 80° N to 90° N | 0 | 1 | | 0° to 10° S | 36 | 6 |
| 70° N to 80° N | 0 | 6 | | 10° S to 20° S | 23 | 38 |
| 60° N to 70° N | 14 | 36 | | 20° S to 30° S | 36 | 571 |
| 50° N to 60° N | 164 | 184 | | 30° S to 40° S | 36 | 547 |
| 40° N to 50° N | 271 | 333 | | 40° S to 50° S | 2 | 17 |
| 30° N to 40° N | 242 | 1,487 | | 50° S to 60° S | 0 | 1 |
| 20° N to 30° N | 155 | 3,193 | | 60° S to 70° S | 0 | 1 |
| 10° N to 20° N | 83 | 2,340 | | 70° S to 80° S | 0 | 14,920 |
| 0° to 10° N | 34 | 8 | | 80° S to 90° S | 0 | 7,178 |

Observed falls follow the populated latitudes of the northern hemisphere (61% between 20° N and 50° N); more than 70% of positioned finds are south of 70° S.

### Mass of positioned points

| Class | Seen falling | Found |
|---|---|---|
| Less than 100 g | 73 | 21,073 |
| 100 g to 10 kg | 709 | 8,733 |
| 10 kg to 1 t | 277 | 927 |
| 1 t and more | 5 | 48 |
| Mass missing or zero | 32 | 86 |

## Preprocessing (to be done during implementation, outside the build)

One-off Node script, not committed (same convention as the other visualizations, see for example "Data source" in `specs/volcanic-eruptions/technical-specifications.md`), to be rerun manually if the source changes:

1. Download `Meteorite_Landings.csv` (see "Access" above) and check the number of rows (45,716 at scouting).
2. Exclude Meridiani Planum (longitude outside `[-180, 180]`).
3. Set to unknown location (`lat` and `lng` to `null`) missing coordinates, exact `0, 0` values and zero latitudes of "Yamato" meteorites (see "Positions" above). Any other isolated zero latitude or longitude is checked by hand (only Meru at scouting).
4. Round coordinates to four decimal places (about 11 m, well below the actual precision of the positions).
5. Set `mass` to `null` when it is missing or zero; keep the source's decimals (e.g. 0.1 g).
6. Set `year` to `null` when it is missing or later than the retrieval year (Northwest Africa 7701).
7. Deduplicate `recclass` into a `classes` table, referenced by index (same principle as the `species` table of `paris-trees`).
8. Write `public/data/meteorites/meteorites.json` (see below), sorted finds first, then observed falls, then by decreasing mass within each group, unknown masses last: this is the drawing order (see "Rendering" in `technical-specifications.md`).
9. Copy `basemap.json`, `rivers.json` and `relief.webp` unchanged from `public/data/bird-migrations/` (see "Map technology" in `technical-specifications.md`).

## Output format

**`public/data/meteorites/meteorites.json`**, as parallel arrays rather than an array of objects, given the volume (same choice as `paris-trees/trees.json`):

```json
{
  "generatedAt": "2026-09-24",
  "classes": ["Iron, IVB", "L6", "H5"],
  "meteorites": {
    "id":      [11890, 23593, 1],
    "name":    ["Hoba", "Sikhote-Alin", "Aachen"],
    "classId": [0, 7, 21],
    "mass":    [60000000, 23000000, 21],
    "fell":    [0, 1, 1],
    "year":    [1920, 1947, 1880],
    "lat":     [-19.5833, 46.16, 50.775],
    "lng":     [17.9167, 134.6533, 6.0833]
  }
}
```

- `id`: source identifier, as a number.
- `classId`: index into `classes`.
- `mass`: grams, `null` if unknown or zero.
- `fell`: `1` for an observed fall (`Fell`), `0` for a find (`Found`).
- `year`: `null` if unknown or aberrant.
- `lat`, `lng`: `null` for an unknown location. These meteorites stay in the file: they feed the "unknown location" counter and the table view.

Estimated size: 2.5 to 3 MB uncompressed for 45,715 entries, of the same order as `earthquakes.json` (2 MB). The names, highly repetitive ("Yamato 000593", "Northwest Africa 4502"), compress well on the fly.

## Client-side derived fields (not in the JSON)

- **Size class** of the point, based on `mass` (see "Rendering" in `technical-specifications.md`).
- **10° latitude band** for the latitudinal profile, and shares of each population per band (see "Latitudinal profile" in `technical-specifications.md`).
- **Spatial index** for hover (see "Hover" in `technical-specifications.md`).

## Validation constraints specific to this visualization

- All arrays of `meteorites` have the same length.
- `id` is unique.
- `lat` and `lng` are either both `null` or both finite numbers, within `[-90, 90]` and `[-180, 180]`.
- No position is `0, 0`.
- `fell` is `0` or `1`; `classId` is a valid index into `classes`.
- `mass` is `null` or strictly positive.
