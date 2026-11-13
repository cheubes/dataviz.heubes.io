# Data model: The Flower Calendar

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| Field | Value |
|---|---|
| `name` | GBIF Occurrence Data (first flowering dates, France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 1.0 / CC BY 4.0 (varies per occurrence, see "Attribution" in the biodiversity `data-model.md` for the same nuance) |
| `retrieved` | 2026-09-08 |

**Temporal coverage:** occurrences with a complete date, from 1970 to the retrieval year (six decades: 1970s to 2020s, see "Decade comparison" in `functional-specifications.md`).

## Species selection (finalized during implementation)

**Principle:** early-flowering species that are well observed in France (many GBIF occurrences per decade, for a reliable median), covering a diversity of families and flowering periods across the year, with a flower color sufficiently distinct from the other chosen species (see "Palette" in `technical-specifications.md`).

**Chosen species** (twelve), checked against an actual GBIF count per decade before being chosen. Two species from the original draft were ruled out during this check and replaced: *Forsythia × intermedia*, a horticultural hybrid almost absent in the wild (62 GBIF occurrences in France over the entire 2020s decade), and *Helianthus annuus*, mostly grown as a field crop rather than wild: both in contradiction with the "wild plants" editorial angle and the selection principle above. Replaced by *Narcissus pseudonarcissus* and *Centaurea cyanus*, two genuinely wild species in France with a solid GBIF volume across the three decades.

| Scientific name | FR common name | EN common name | Family | Color |
|---|---|---|---|---|
| *Prunus spinosa* | Prunellier | Blackthorn | Rosaceae | `#F4F1EA` |
| *Narcissus pseudonarcissus* | Jonquille sauvage | Wild Daffodil | Amaryllidaceae | `#C97A0A` |
| *Taraxacum officinale* | Pissenlit | Dandelion | Asteraceae | `#F0C040` |
| *Papaver rhoeas* | Coquelicot | Poppy | Papaveraceae | `#D94035` |
| *Digitalis purpurea* | Digitale | Foxglove | Plantaginaceae | `#C87BA0` |
| *Lavandula angustifolia* | Lavande | Lavender | Lamiaceae | `#9B72CF` |
| *Centaurea cyanus* | Bleuet | Cornflower | Asteraceae | `#3C5CC4` |
| *Calluna vulgaris* | Bruyère | Heather | Ericaceae | `#BE8CB4` |
| *Convallaria majalis* | Muguet | Lily of the Valley | Asparagaceae | `#EDEAE0` |
| *Rosa canina* | Églantier | Dog Rose | Rosaceae | `#F0A0A0` |
| *Crocus vernus* | Crocus | Crocus | Iridaceae | `#C9A8E8` |
| *Anemone nemorosa* | Anémone des bois | Wood Anemone | Ranunculaceae | `#E5E2D8` |

All twelve species are checked by default on opening (see "Interactions" in `functional-specifications.md`, explicit decision: complete calendar visible from the start rather than a partial selection). With twelve species in total, the cap of fifteen simultaneous species from `functional-specifications.md` is never reached: the "beyond fifteen" behavior was not implemented (see "Species selector" in `technical-specifications.md`).

Colors validated with the dataviz skill's contrast script against the chosen background (`--dv-surface`, see "Palette" in `technical-specifications.md`): the crocus (`#C9A8E8`, lighter than the original draft's `#B89AE0`) and the wild daffodil (`#C97A0A`, a deeper amber than the yellow of the forsythia it replaces) were adjusted to remain distinguishable from the lavender and the dandelion respectively. Pure white (`#FFFFFF`) avoided for the blackthorn, the lily of the valley and the anemone: slightly tinted shades, whose mutual closeness remains an accepted limitation (see "Palette" in `technical-specifications.md`).

## Raw data schema (GBIF source)

| GBIF field | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | France filter (no cartographic use in this visualization) |
| `scientificName` | Species |
| `eventDate` | Observation date, for the day of the year (`doy`) |
| `year` | Grouping by decade |

## Preprocessing (script outside the build, run during implementation)

One-off Node script (not committed, consistent with `bird-migrations`), querying the GBIF API (`api.gbif.org/v1/occurrence/search`, `country=FR`) through facets rather than raw download: GBIF search does not sort its results by date, and the volume per species (up to ~140,000 occurrences/decade for the most common ones) makes complete pagination impractical for what is ultimately a statistic of a few values per decade.

1. For each chosen species and each year (1970 to the retrieval year): `month` facet (one request) to get the number of France occurrences per month, then `day` facet (one request per needed month) on the required months to locate a precise day. A day only appears in the `day` facet if GBIF has actually associated a complete date with it, which natively implements the "complete dates only" filter without having to inspect records one by one.
2. **Deviation from the initial principle ("first observation of the year"), corrected after checking on real records, in two stages:**
   - The raw first occurrence of the year turned out to be dominated, for most species and years, by a spike at the very beginning of January (up to ~10% of the annual volume over the first ten days for some decades). Checked on the raw records (not just the facets): these are not placeholder `01-01` dates (the dates are genuinely `AAAA-01-0X`, spread over several days), but an observation effort bias corresponding to the "New Year Plant Hunt", a recurring citizen observation campaign (around January 1st) that specifically records what is in flower in midwinter, regardless of the species' actual flowering season. Occurrences from the first ten days of January are therefore excluded from the calculation rather than kept.
   - The remaining raw minimum (outside the excluded window) is not a reliable proxy on its own either: some of the chosen species remain identifiable year-round without being in flower (blackthorn bark, persistent heather foliage, dandelion rosette...), which keeps pulling a simple minimum value toward winter. Corrected by using the day of the year corresponding to the **5th percentile** of the distribution (outside the excluded window) rather than its minimum (nearest rank), a robust method for estimating the start of the season that is standard in phenology.
   - The day thus obtained replaces "the first observation" as the annual value used in the next step. This calculation stays entirely within the preprocessing script outside the build: it changes neither the output format (still `medianDoy`/`p10`/`p90`/`observationCount` per decade) nor the dependencies of the visualization itself. **Accepted residual limitation:** for the species most identifiable outside flowering (heather, dog rose in particular), the dates obtained probably remain ahead of the true full-flowering season. This annual value remains a simple proxy for flowering, not a verified phenological measurement: consistent with a popular-science site rather than a scientific analysis tool (see "Incomplete 2020s decade" below for the same nuance).
3. Group the annual values (one per year, method above) by decade: 1970s (1970-1979), 1980s (1980-1989), 1990s (1990-1999), 2000s (2000-2009), 2010s (2010-2019), 2020s (2020 to the retrieval date, incomplete decade, see "Incomplete 2020s decade" below).
4. Compute per species and per decade: median, 10th and 90th percentile of these annual values. `observationCount`: total number of raw occurrences of the species in France over the decade (an indicator of observation density, see "Species selection" above), not the number of annual values used for the median.
5. Output: `public/data/flower-phenology/phenology.json`.

## Incomplete 2020s decade

At build time, the "2020s" decade only covers part of the actual decade (2020 to the `retrieved` year). The median of this partial decade is still displayed as such (default decade of the outer ring, see `functional-specifications.md`), with no weighting or particular statistical warning: consistent with the approach of a popular-science site rather than a scientific analysis tool, but to keep in mind if more rigorous mediation is desired during implementation.

## Output format

Actual excerpt from `public/data/flower-phenology/phenology.json`:

```json
[
  {
    "species": "Papaver rhoeas",
    "nameFr": "Coquelicot",
    "nameEn": "Poppy",
    "family": "Papaveraceae",
    "flowerColor": "#D94035",
    "phenology": {
      "1970s": { "medianDoy": 98, "p10": 80, "p90": 126, "observationCount": 3445 },
      "1980s": { "medianDoy": 112, "p10": 98, "p90": 129, "observationCount": 5278 },
      "1990s": { "medianDoy": 96, "p10": 68, "p90": 115, "observationCount": 15459 },
      "2000s": { "medianDoy": 84, "p10": 66, "p90": 96, "observationCount": 87417 },
      "2010s": { "medianDoy": 101, "p10": 66, "p90": 119, "observationCount": 50379 },
      "2020s": { "medianDoy": 106, "p10": 84, "p90": 114, "observationCount": 12446 }
    }
  }
]
```

`medianDoy`, `p10`, `p90`: day of the year (1-365).

## Validation constraints specific to this visualization

- Each species in the JSON carries all six decades (`1970s`, `1980s`, `1990s`, `2000s`, `2010s`, `2020s`), even if `observationCount` is low for some of them (no decade omitted).
- `flowerColor` is unique among the chosen species (no collision, see correction above) and contrast-validated by the dataviz skill's script (see `technical-specifications.md`).
