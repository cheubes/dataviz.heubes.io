# Data model: What's Left

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

## History: dropping the IUCN Red List source

Initial angle: history of the IUCN Red List reassessments per species, via its API. Dropped after verification (see scoping discussions): the IUCN website blocks any automated retrieval, including for reading its own terms of use (403 observed on the species pages and on the terms pages), and the API requires a personal account (email, institution) created by the user themselves, with IUCN approval not guaranteed for a visualization project. Explicit decision of the user: change sources rather than depend on this block.

## Source dataset

A distinct official source per species rather than a single source, each publishing real, absolute counts (not a relative index like that of the WWF/ZSL Living Planet Database, ruled out for this reason: incompatible with the icon metaphor, see "Rendering" in `technical-specifications.md`). Each source was consulted directly (no figure taken from an unverified search excerpt):

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Global wild tiger population estimates (2010-2023) | Global Tiger Forum (2010 point: WWF-UK) | https://globaltigerforum.org/wp-content/uploads/2023/07/Press-release_Global-Tiger-Day2023_GTF.pdf | Copyright reserved, citation required | 2026-09-14 |
| Black rhinoceros population (1980-2024) | Our World in Data, African Rhino Specialist Group (AfRSG, IUCN SSC) data; 2024 point: IUCN | https://ourworldindata.org/grapher/black-rhinos | CC BY 4.0 (2024 IUCN point: copyright reserved) | 2026-09-14 |
| National giant panda censuses (1976-2014) | State Forestry Administration of China, relayed by WWF (2014 point: Smithsonian National Zoo) | https://wwfeu.awsassets.panda.org/downloads/pandasurveyqa.doc | Copyright reserved (WWF), citation required | 2026-09-14 |
| Mountain gorilla censuses, Virunga massif and Bwindi-Sarambwe (2003-2019) | International Gorilla Conservation Programme (IGCP) | https://igcp.org/content/uploads/2020/09/Global-mountain-gorilla-population-Dec-2019-IGCP.pdf | Copyright reserved (IGCP), citation required | 2026-09-14 |
| Annual vaquita population estimates (1997-2024) | NOAA Fisheries, citing Jaramillo-Legoretta et al. / Gerrodette et al. / Taylor et al. / CIRVA; 2023-2024 points: report hosted by the IUCN SSC Cetacean Specialist Group | https://www.fisheries.noaa.gov/west-coast/science-data/vaquita-conservation-and-abundance | Public domain (US federal website) | 2026-09-14 |
| Comptages annuels de terriers actifs du grand hamster d'Alsace (2012-2025) | Office français de la biodiversité (OFB), relayed by the Préfecture de la région Grand Est | https://www.prefectures-regions.gouv.fr/irecontenu/telechargement/131694/967059/file/CP-ComptageHamsters-091025.pdf | Licence ouverte (probable, not confirmed on the document itself) | 2026-09-14 |

`worldwildlife.org`, `tigers.panda.org`/`wwf.panda.org` and `iucnredlist.org` systematically block automated retrieval (403): worked around via WWF documents hosted elsewhere, official relays (Smithsonian, IGCP, Global Tiger Forum) or regional WWF pages that responded normally.

## Chosen angle: trajectories of emblematic species

Decided explicitly with the user (see scoping discussions), to stand apart from `biodiversity` (aggregated grid) and `light-pollution` (aggregated change in a grid) already on the site: a small selection of species tracked individually through successive censuses or estimates, not a geographic or statistical aggregation.

## Species selection (confirmed)

The six candidates considered during scoping are all kept, each with a usable real trajectory (see "Output format" below):

| Species | Real trajectory |
|---|---|
| Tiger (*Panthera tigris*) | 3,200 (2010) → 3,890 (2016) → 5,574 (2023): historical decline then confirmed recovery |
| Black rhinoceros (*Diceros bicornis*) | 14,785 (1980) → 2,550 (1993, low point) → 6,788 (2024): collapse in the twentieth century, partial recovery since |
| Giant panda (*Ailuropoda melanoleuca*) | ~1,000 (1976) → 1,100 (1988) → 1,590 (2003) → 1,864 (2014): steady increase over four censuses |
| Mountain gorilla (*Gorilla beringei beringei*) | 380 (2003) → 880 (2011) → 1,063 (2019): steady increase, status changed from "critically endangered" to "endangered" in 2018 |
| Vaquita (*Phocoena sinus*) | 567 (1997) → 245 (2008) → 59 (2015) → 30 (2016) → 11 (2023) → 7 (2024): the most extreme decline of the group |
| European hamster (*Cricetus cricetus*) | 242 (2012) → 216 (2015, low point) → 1,155 (2024) → 557 (2025): up-and-down recovery, the only European species of the group |

Target number of four to six species (see "Composition" in `functional-specifications.md`): all six are kept, none ruled out.

## Required fields per species and per measurement point

For each measurement point of a species (census or estimate year, depending on the source chosen for that species, see "Source dataset" above):

| Field | Usage |
|---|---|
| Year of the measurement | Position on the timeline |
| Population estimate (or active burrows, see below) | Number of icons displayed (see "Rendering" in `technical-specifications.md`) |

These sources are chosen specifically because they publish a count at each chosen point: no `null` value to handle in the model (see "Validation constraints" below).

**Points of attention settled during implementation:**
- **European hamster:** the official monitoring counts active burrows in spring, not individuals directly (both prefectural press releases state this explicitly). Field `unit: "burrows"` on this species (the other five carry `unit: "individuals"`); the card and the detail card display "active burrows" rather than "individuals" for this species.
- **Vaquita, 2023 and 2024 points:** the source reports give a range rather than a single number ("8 to 13" in 2023, "6 to 8" in 2024, the latter value explicitly described as a minimum estimate by the report). The `population` field carries the rounded midpoint (11 and 7 respectively), used only to compute the number of icons; the `populationLabel` field carries the range as published, displayed in the detail card instead of the midpoint number.
- **Giant panda, 1976 point:** first census conducted over the 1974-1977 period, representative year chosen (middle of the period). The value itself is approximate in the source (WWF, "around 1,000 pandas", Q&A document attributed to the Chinese forestry administration): the figure widely cited elsewhere (2,459 individuals) could not be confirmed by a directly consulted source, and was therefore ruled out.
- **Mountain gorilla:** population monitored separately in two isolated massifs (Virunga and Bwindi-Sarambwe), never surveyed in the same year. 2003 point (380): census of the Virunga massif alone, at a time when this figure was commonly treated as the species' world total (rigorous monitoring of Bwindi is more recent). 2011 point (880): composite of Virunga 2010 (480, with correction factors) + Bwindi 2011 (400), same method as the world total published by the IGCP. 2019 point (1,063): world total published as is by the IGCP (Virunga 2015-2016: 604, + Bwindi-Sarambwe 2018: 459).

## Output format

```json
{
  "species": [
    {
      "id": "tiger",
      "nameFr": "Tigre",
      "nameEn": "Tiger",
      "unit": "individuals",
      "iconRatio": 100,
      "counts": [
        { "year": 2010, "population": 3200 },
        { "year": 2016, "population": 3890 },
        { "year": 2023, "population": 5574 }
      ]
    }
  ]
}
```

`counts` sorted by ascending `year`, each entry carries a real `population` (never a guessed or interpolated value in the data itself: interpolation remains a display computation, see "Animation" in `technical-specifications.md`), except the two vaquita points above where `population` is the rounded midpoint of a source range, paired with the original `populationLabel` (see "Points of attention" above). `unit` (`"individuals"` or `"burrows"`) and `iconRatio` (number of units represented by one icon, see "Rendering" in `technical-specifications.md`) are fixed per species.

## Validation constraints specific to this visualization

- Each species has at least two points in `counts` (a trajectory requires at least two points).
- Each point carries a non-zero `population`.
- `counts` is sorted by ascending `year`.
