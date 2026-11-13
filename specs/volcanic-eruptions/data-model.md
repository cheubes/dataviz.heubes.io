# Data model: The Pulse of the Earth

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: implemented.**

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Volcanoes of the World (VOTW) v. 5.4.0, catalog of Holocene eruptions | Smithsonian Institution, Global Volcanism Program (compiled by E. Venzke) | https://volcano.si.edu | Non-commercial use with citation (see "License" below) | 2026-09-22 |

## License

`volcano.si.edu` (HTML pages) blocks automated retrieval (anti-bot protection, confirmed during implementation: direct requests return 403), preventing scraping of the public site. However, the GVP's official web service (`webservices.volcano.si.edu`, GeoServer WFS, see "Data retrieval" below) remains accessible without blocking: this is the route chosen for this visualization, no need to bypass the anti-bot blocking.

Terms of use checked during implementation (page `volcano.si.edu/gvp_termsofuse.cfm`, governed by the Smithsonian Institution's general terms): personal, educational and other non-commercial use explicitly permitted; citation of the author and source required, at minimum "Global Volcanism Program, Smithsonian Institution" with a link to `https://volcano.si.edu/`. Citation specific to the database (page `gvp_votw.cfm`): "Global Volcanism Program, 2026. [Database] Volcanoes of the World (v. 5.4.0; 7 Aug 2026). Distributed by Smithsonian Institution, compiled by Venzke, E.". Since `dataviz.heubes.io` is a non-commercial site (CC BY-NC-SA 4.0), the use is covered by this permission. Same treatment as `satellites-in-orbit`: this is not a definitive legal reading, but a sufficient check for non-commercial use with appropriate citation in the source credit block (see "Visualization page" in `style-guide.md`).

Explicit decision by the user (see scoping discussions): continue with the GVP, the most complete and most cited reference database on the subject, rather than a narrower alternative source (NOAA NCEI, "significant" eruptions with damage, ruled out at this stage).

## Data retrieval

No HTML scraping: the GVP publishes a WFS service (GeoServer) at `https://webservices.volcano.si.edu/geoserver/GVP-VOTW/wfs`, accessible without anti-bot blocking, with direct GeoJSON output (`outputFormat=application/json`). Two layers used:

- `GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes` (1,214 Holocene volcanoes retrieved during implementation).
- `GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions` (11,089 Holocene eruptions retrieved during implementation).

Typical request: `GetFeature&typeName=<layer>&outputFormat=application/json` (pagination via `count`/`startIndex` if needed, not necessary here given the volume). One-off retrieval at preprocessing time (see "Data source" in `technical-specifications.md`), not at every build.

## Chosen angle: pulse of the Earth

Decided explicitly with the user (see scoping discussions), to stand apart from `monument-layers` (one-way chronological accumulation, a point appears once and for all) already on the site: each volcano pulses at each of its real eruptions over a continuous playback **on a loop** across ten thousand years, not an accumulation that only grows. An eruption is not a permanent event like the construction of a monument: it corresponds to an instant, potentially repeated several times per volcano over the covered period.

## Catalog completeness bias (to be documented in the interface)

**Major point of attention, must not be allowed to mislead:** the GVP catalog is markedly more complete for the last few centuries (written sources, direct observation) than for the oldest millennia (identification through geological evidence only, tephrochronology). The visible increase in pulse frequency over the playback therefore largely reflects an improvement in documentary completeness, not only a real intensification of global volcanism. To be made explicit in the long presentation (see `functional-specifications.md`), not only in the specs.

## Source fields used

Layer `Smithsonian_VOTW_Holocene_Volcanoes`:

| GVP field | Usage |
|---|---|
| `Volcano_Number` | Stable, unique identifier (`Volcano_Name` is not: four duplicates found among the 1,214 volcanoes, e.g. two volcanoes named "Flores") |
| `Volcano_Name` | Displayed name (identification, detail card) |
| `Country` | Location in the detail card (see "Volcano hover/tap" in `functional-specifications.md`); filled in for 100% of the 1,214 volcanoes |
| `Latitude`, `Longitude` | Position on the world map |

Layer `Smithsonian_VOTW_Holocene_Eruptions`:

| GVP field | Usage |
|---|---|
| `Volcano_Number` | Reference to the volcano |
| `StartDateYear` | Year of the eruption, position on the simulated timeline (already a point estimate chosen by the GVP, not a range to reduce ourselves) |
| `StartDateYearUncertainty`, `StartDateYearModifier` (`?`/`<`/`>`) | Dating uncertainty, displayed in the detail card only (see "Dating uncertainty" below) |
| `ExplosivityIndexMax` | VEI (0-8 scale), intensity/size of the pulse (see "Rendering" in `technical-specifications.md`); `null` for 2,671 eruptions out of 11,089 (24%, undetermined VEI) |

**Dating uncertainty:** `StartDateYear` is already the year chosen by the GVP (no range to compute), with, where applicable, an uncertainty in ± years (`StartDateYearUncertainty`, present on 2,047 eruptions, 18%) and a precision modifier (`StartDateYearModifier`: `?` uncertain, `<`/`>` before/after this date, 1,496 eruptions concerned). Chosen treatment: `StartDateYear` alone for positioning on the simulated timeline, uncertainty and modifier displayed only in the detail card (e.g. "vers -6050 (± 1600 ans)", "avant 1500").

**Undetermined VEI (24% of eruptions):** treated as a minimal pulse (equivalent to VEI 0 on the size/intensity scale), rather than excluded from the dataset: excluding these eruptions would distort the catalog's real volume and the message about its completeness bias (see "Catalog completeness bias" above), which is precisely more pronounced for the older, less documented periods.

**Pre-Holocene eruptions (-8000):** 111 eruptions out of 11,089 (1%) carry a `StartDateYear` earlier than -8000, outside the "ten thousand years" framing of the editorial angle despite their classification in the GVP's "Holocene_Eruptions" layer. Excluded from the generated dataset (`StartDateYear >= -8000`).

**Eruptions outside the Holocene volcano catalog:** 41 eruptions out of the remaining 10,978 (twenty distinct `Volcano_Number`, e.g. Nevsehir-Acigol Volcanic Complex, Tres Virgenes) reference a volcano missing from the retrieved `Holocene_Volcanoes` layer. Checked during investigation: these twenty volcanoes do exist in the GVP, but are classified in the `Smithsonian_VOTW_Pleistocene_Volcanoes` layer rather than `Holocene_Volcanoes`, a classification inconsistency specific to the GVP (the volcanic edifice is cataloged as "Pleistocene" while an individual eruption attached to it carries a Holocene date), not a retrieval bug in our script. Excluded from the generated dataset just like the pre-8000 eruptions above (this visualization's volcano catalog is scoped specifically to `Holocene_Volcanoes`, see "Data retrieval" above): **10,937 eruptions** in total in `eruptions.json`. None of the 41 reaches the VEI ≥ 6 threshold (see "Selection of eruptions to annotate" below), so no impact on the notable eruptions.

**Volcanoes with no dated eruption in the catalog (27%):** 333 volcanoes out of 1,214 have no eruption in `eruptions.json` (tail of the distribution: most for lack of an entry in the `Holocene_Eruptions` layer, identified through geological evidence with no individually datable eruption, see the GVP's `Evidence_Category`). Kept in `volcanoes` (permanent resting point displayed, see "Volcanoes at rest" in `technical-specifications.md`) but never pulse during the cycle.

## Selection of eruptions to annotate

Decided explicitly with the user (see scoping discussions): eruptions of exceptional magnitude (high VEI and/or historical notoriety) are annotated with text on screen at the time of their pulse (see "Interactions" in `functional-specifications.md`). Criterion chosen during implementation: `VEI >= 6` supplemented by a list of historically well-known names below this threshold (Vesuvius 79, VEI 5 at most in the catalog, the only candidate anticipated below the threshold). 59 eruptions reach VEI ≥ 6 across the whole Holocene catalog, five of which predate -8000 (excluded, see "Pre-Holocene eruptions" above): 54 remain in the generated dataset, plus Vesuvius 79, i.e. **55 notable eruptions** in total. The other candidates anticipated during scoping (Tambora 1812/VEI 7, Krakatau 1883/VEI 6, Pinatubo 1991/VEI 6, Santorini -1610/VEI 7) are all covered by the VEI ≥ 6 threshold, verified as present in the actual catalog.

Note on Tambora: the GVP dates the start of this eruption to 1812, not 1815 as anticipated during scoping (1815 corresponds to the paroxysmal phase, better known historically); the GVP's `StartDateYear` is authoritative for positioning on the timeline, and the long presentation does not cite a precise year for this example to avoid confusion.

**Annotation label:** unlike `earthquakes` (seven hand-picked earthquakes, each with an individually written descriptive `nameFr`/`nameEn` phrase, e.g. "Le séisme de San Francisco"), the volume here (55 notable eruptions on volcanoes that are largely little known to the public, e.g. "Moekeshiwan [Lvinaya Past]", "Tao-Rusyr Caldera") makes a descriptive phrase per eruption disproportionate relative to the objective threshold-based selection adopted. The volcano name (`volcanoes[].name`, already identical in both languages, see "Untranslated content" in `functional-specifications.md`) is enough for the "name and year" annotation required by `functional-specifications.md` ("Content"); no duplicated `nameFr`/`nameEn` field on the eruption, the annotation composes `${name} (${year})` at render time from the referenced volcano.

## Output format

```json
{
  "generatedAt": "2026-09-22",
  "volcanoes": [
    { "id": "211020", "name": "Vesuvius", "country": "Italy", "lat": 40.821, "lng": 14.426 }
  ],
  "eruptions": [
    { "volcanoId": "211020", "year": 79, "vei": 5, "yearUncertainty": null, "yearModifier": null, "notable": true }
  ]
}
```

`id`/`volcanoId`: the GVP's `Volcano_Number` (stable, unique identifier, see "Source fields used"), not a slug of the name. `volcanoes` referenced by `volcanoId` from `eruptions` (fixed, time-independent position, avoids repeating coordinates for every eruption of the same volcano). `vei`: `null` if undetermined, treated as VEI 0 at render time (see "Undetermined VEI" above). `notable` only concerns the eruptions chosen for annotation (see "Selection of eruptions to annotate" above, label composed at render time from the volcano name); absent or `false` for the others.

## Validation constraints specific to this visualization

- Every `volcanoId` referenced in `eruptions` exists in `volcanoes`.
- `eruptions` is sorted by ascending `year`.
- `year >= -8000` for every eruption (see "Pre-Holocene eruptions" above).
