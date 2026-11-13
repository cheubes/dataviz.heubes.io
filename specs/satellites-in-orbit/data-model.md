# Data model: The Orbital Rush

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Satellite Catalog (SATCAT) | CelesTrak | https://celestrak.org/satcat/ | Not formalized by CelesTrak; data originating from USSPACECOM (Space-Track.org), redistribution of derived data permitted subject to appropriate citation (see note below) | 2026-09-09 |

**Note on the license:** CelesTrak does not publish an explicit license (no CC, no public domain statement) for the SATCAT catalog. The data ultimately comes from the US Space Force via Space-Track.org, whose user agreement permits redistribution of basic data (including the SATCAT) on condition of appropriate citation to USSPACECOM, while reserving a prior-approval regime for other forms of transfer. Decision made with the user (see scoping discussions): proceed with this source, explicitly citing CelesTrak and USSPACECOM/Space-Track.org in the source credit block (see "Visualization page" in `style-guide.md`), the dataset published here being a derived aggregation (counts per region and per date) rather than a raw republication of the catalog, on a non-commercial site (CC BY-NC-SA). This is not a definitive legal reading: to be revisited if a broader use of the source is ever considered.

Reading confirmed during implementation by Space-Track's public documentation (`space-track.org/documentation#/agreement`): "USSPACECOM has provided express blanket approval for transfer/redistribution of basic SSA data and services accessed via www.Space-Track.org conditioned on appropriate citation", the SATCAT being explicitly listed among the "basic SSA data" covered; any other form of transfer remains subject to prior approval ("The User agrees not to transfer any data or technical information received from this website [...] to any other entity without prior express approval").

## Chosen scope

Decided explicitly with the user (see scoping discussions): **payloads in orbit, active and inactive, excluding debris and rocket stages**. Translated into the SATCAT filter as:

- `OBJECT_TYPE = PAY` (payload, excludes `R/B` rocket body, `DEB` debris, `UNK` unknown);
- `DECAY_DATE` empty (object still in orbit at retrieval time, whether still active or not).

Operational status (`OPS_STATUS_CODE`) is not part of the filter: a satellite that is out of service but still in orbit is still counted, in line with the chosen scope.

## SATCAT fields used

| CelesTrak field | Usage |
|---|---|
| `OBJECT_TYPE` | Scope filtering (keep only `PAY`) |
| `DECAY_DATE` | Scope filtering (keep only objects with no decay date) |
| `OWNER` | Assignment to one of the five launching regions (see "Geographic grouping" below) |
| `LAUNCH_DATE` | Position of the object on the simulated timeline |

`OBJECT_NAME` and `NORAD_CAT_ID` are not carried over into the output format: there is no card per individual satellite in this visualization (see "Interactions" in `functional-specifications.md`), so no reason to ship them to the client.

## Geographic grouping

Five regions, decided explicitly with the user (see scoping discussions): **United States, Russia/USSR, China, Europe, rest of the world**.

Mapping table built from the actual retrieved catalog (106 distinct `OWNER` codes among the retained objects):

- `US` → United States.
- `CIS` → Russia/USSR (the only code in the catalog covering both the USSR and post-1991 Russia; no separate `RUS` code in the retrieved data).
- `PRC` → China.
- European national codes (UN M49 geoscheme, Russia excluded by construction since it has its own region above) and the two pan-European intergovernmental agencies of the sector (`ESA`, `EUME` = EUMETSAT) → Europe: `UK`, `FR`, `GER`, `IT`, `SPN`, `FIN`, `NOR`, `GREC`, `POL`, `SWED`, `LUXE`, `NETH`, `POR`, `BEL`, `DEN`, `SWTZ`, `CZCH`, `UKR`, `BUL`, `HUN`, `SVK`, `SVN`, `ASRA`, `EST`, `HRV`, `ROM`, `MNE`, `BELA`, `LTU`, `ESA`, `EUME`.
- Everything else → rest of the world. In particular all codes of commercial operators or multinational consortia (`SES`, `EUTE`/Eutelsat, `ITSO`/Intelsat, `O3B`, `IM`/Inmarsat, `GLOB`/Globalstar, `ORB`/Orbcomm, `AB`/Arabsat, `AC`/AsiaSat, `ABS`, `NATO`...): these are not launching nations, and assigning them a specific nationality (e.g. `GLOB` → United States, Globalstar's headquarters) would break the simple "country code or official pan-European agency" rule above at the cost of hard-to-defend case-by-case calls (`SES` is registered in Luxembourg but internationally owned, `ITSO`/Intelsat is headquartered in Luxembourg but historically had global governance...). Also in "rest of the world": codes of bi/multinational joint ventures with at least one partner outside Europe (`CHBZ` China-Brazil, `STCT` Singapore-Taiwan, `GRSA` Greece-Saudi Arabia, `RASC` African organization RASCOM), countries outside the UN Europe geoscheme (including `TURK` Turkey and `KAZ` Kazakhstan, respectively Western Asia and Central Asia in that geoscheme), and `TBD` (temporary "to be determined" code).
- Documented exception: `FGER` (Franco-German Symphonie program) and `FRIT` (Franco-Italian Athena-Fidus/Sicral 2 program) are bilateral intergovernmental programs between two states already classified as Europe above → Europe, despite their separate code.

An object whose `OWNER` code has no match in this list falls into "rest of the world" rather than causing preprocessing to fail (fallback rule, no case encountered in practice on the retrieved catalog: all 106 codes were classified explicitly).

## Preprocessing (done during implementation, outside the build)

A preprocessing script, in the spirit of those of the other visualizations (see `data-model.md` of `bird-migrations` or `biodiversity`), rerun manually rather than at every build (see "Rules common to all visualizations" in the general `technical-specifications.md`):

1. Retrieve the full SATCAT catalog from CelesTrak, in the documented CSV format (`https://celestrak.org/pub/satcat.csv`, see "SATCAT Format Documentation" on `celestrak.org/satcat/satcat-format.php`) rather than `records.php`: this is the format CelesTrak explicitly recommends for this kind of full download ("Raw SATCAT Data" on `celestrak.org/satcat/`), and the CSV format is cited in the site's usage policy as the preferred version (the legacy text formats will be limited by catalog numbers exceeding five digits, which was underway at the time of this retrieval). One-off request, no repeated polling, in line with the usage policy (see "Data source" in this visualization's `technical-specifications.md`). 70,587 rows retrieved on 2026-09-09.
2. Filter according to the chosen scope (`OBJECT_TYPE = PAY`, `DECAY_DATE` empty) → 20,020 objects retained.
3. Assign a region to each retained object based on `OWNER` (see "Geographic grouping" above).
4. Reduce each retained object to `{ regionId, launchDate }` (see "Output format" below), sort by ascending `launchDate` and write `public/data/satellites-in-orbit/satellites.json`.

Actual volume: 20,020 objects, higher than the initial estimate (ten to fifteen thousand): the low end did not account for satellites that are out of service but still in orbit (`OPS_STATUS_CODE` left out of the filter by scope choice, see "Chosen scope" above), which weigh significantly in the total. Breakdown: United States 13,723, China 1,577, Russia/USSR 1,713, Europe 1,434, rest of the world 1,573. Output file: 892 KB, below the site's other datasets (e.g. `paris-trees/trees.json`, 12 MB), no compaction needed.

First retained object chronologically: Vanguard 1 (`US`, launched on 1958-03-17), the oldest artificial object still in orbit; Sputnik 1, launched first (1957-10-04), fell back in early 1958 and is therefore not part of this dataset despite its mention in the editorial presentation (see "Editorial angle" in `functional-specifications.md`) as a narrative landmark of the start of the space age rather than as the first point of the dataset itself.

## Output format

```json
{
  "generatedAt": "2026-09-09",
  "regions": [
    { "id": "us", "nameFr": "États-Unis", "nameEn": "United States" },
    { "id": "russia-ussr", "nameFr": "Russie / URSS", "nameEn": "Russia / USSR" },
    { "id": "china", "nameFr": "Chine", "nameEn": "China" },
    { "id": "europe", "nameFr": "Europe", "nameEn": "Europe" },
    { "id": "other", "nameFr": "Reste du monde", "nameEn": "Rest of the world" }
  ],
  "satellites": [
    { "regionId": "us", "launchDate": "1958-03-17" },
    { "regionId": "us", "launchDate": "1958-12-18" }
  ]
}
```

`regionId` in English kebab-case (see general conventions of `data-model.md`); the color of each region is not stored in the data (see palette in this visualization's `technical-specifications.md`), assigned client-side by order of appearance in `regions`. `generatedAt` records the retrieval date of the source catalog (objects in orbit change continuously), used as the dataset's `retrieved` once known.

## Client-side derived fields (not in the JSON)

- **Total count at the current simulated instant:** number of `satellites` whose `launchDate` is on or before the simulated date, among active regions (see "Region filter" in `functional-specifications.md`).
- **Count per region:** same, broken down by `regionId`, for the legend (see "Content" in `functional-specifications.md`).

## Validation constraints specific to this visualization

- Every `regionId` referenced in `satellites` exists in `regions`.
- `satellites` is sorted by ascending `launchDate` (simplifies progressive accumulation during playback, see "Animation" in `technical-specifications.md`).
- An object with no recognized `OWNER` is present with `regionId: "other"`, never silently missing from the output file.
