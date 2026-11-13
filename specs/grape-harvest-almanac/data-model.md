# Data model: The Grape Harvest Almanac

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| Field | Value |
|---|---|
| `name` | Western Europe 650 Year Grape Harvest Date Database (Daux et al. 2012) |
| `publisher` | NOAA/NCEI (National Centers for Environmental Information), World Data Service for Paleoclimatology |
| `url` | https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=noaa-historical-13194 |
| `license` | NOAA/NCEI public data (no reuse restriction, no warranty), citation of the source article required: Daux, V., et al. 2012. *An open-access database of grape harvest dates for climate research: data description and quality assessment.* Climate of the Past, 8, 1403-1418. |
| `retrieved` | 2026-09-10 |

**Temporal coverage of the full dataset:** 1354 to 2007 (654 years), 27 composite regional series (22 in France, 5 outside France: Germany, Luxembourg, Northern Italy, Spain, Switzerland). Choice validated with the user: scope restricted to France (see "Chosen regions" below), consistent with the title of the visualization.

## Chosen regions

Seven regions, chosen among the twenty-two French series for their age and their continuity up to the end of the dataset (2007): a recent historical landmark (the 2003 heatwave, see "Historical landmarks" below) must be able to rely on every displayed curve, not just some of them. Two regions nonetheless cited as "among the most complete" by the source article, Jura and Ile-de-France, were ruled out upon empirical checking of the actual dataset: their series end in 1977 and 1978 respectively, with no data at all over the last three decades. Bordeaux, Alsace and Champagne (the dataset's "Champagne 2" series, the more complete of the two Champagne series) were added afterwards, on the same criterion.

| Region | `id` | Start | End | Years with data | Completeness |
|---|---|---|---|---|---|
| Bourgogne | `burgundy` | 1354 | 2006 | 604 | 92% |
| Vallée du Rhône (sud) | `southern-rhone-valley` | 1434 | 2007 | 451 | 79% |
| Bordeaux | `bordeaux` | 1449 | 2006 | 327 | 59% |
| Languedoc | `languedoc` | 1525 | 2007 | 288 | 60% |
| Alsace | `alsace` | 1700 | 2005 | 262 | 86% |
| Basse vallée de la Loire | `lower-loire-valley` | 1802 | 2007 | 203 | 99% |
| Champagne | `champagne` | 1806 | 2006 | 183 | 91% |

Completeness = number of years with a value / number of years between the first and last point of the series (a ratio specific to each series, not to the overall 1354-2007 range).

## Raw data schema (NOAA source)

Fixed-width text file (`europe2012ghd.txt`), three blocks of nine regions ("part 1 of 3", "part 2 of 3", "part 3 of 3"), one row per year from 1354 to 2007, one column per region. A value is the number of days after August 31 (can be negative, e.g. `-10.0` = August 21); an empty cell means there is no data that year for that region.

**Parsing pitfall encountered during checking (to be avoided in preprocessing):** values are right-aligned in their column, the width of each column being derived from the **end** position of the region abbreviation in the header row (e.g. `Bur` at `...Bur|`), not from its **start** position. A naive extraction based on the start position of each label truncates two-digit values (`51.5` becomes `1.5`), with a result that remains a valid number and therefore cannot be detected by a simple presence/absence check: only a check against known values (e.g. 1816 in Burgundy, a harvest delay documented elsewhere) reveals the error. In addition, the "part 2" and "part 3" blocks carry a stray row just below the header, at year 1354: the column abbreviations themselves (`Ger`, `HLV`, `IdF`...) rather than a value, to be explicitly ignored (only Burgundy, in "part 1", has real data in 1354).

## Historical landmarks

Four landmarks, chosen with the user to cover a complete editorial arc (an early extreme from long ago, a late extreme, a period when the data itself degrades, a modern early extreme) rather than only the recent climate drift (already covered by `flower-phenology` and `light-pollution`). Values checked against the series actually chosen.

| `id` | Year(s) | Event | Bourgogne | Rhône (sud) | Bordeaux | Languedoc | Alsace | Basse Loire | Champagne |
|---|---|---|---|---|---|---|---|---|---|
| `drought-1540` | 1540 | European megadrought of 1540, the most severe known from documentary sources over five centuries | September 3 | — | — | — | — | — | — |
| `year-without-summer-1816` | 1816 | "Year without a summer": eruption of Tambora (1815), cold and rainy summers in Europe | October 22 | September 27 | October 27 | — | October 24 | October 11 | — |
| `phylloxera-crisis` | 1863-1900 | Phylloxera crisis: French vineyards are destroyed and then rebuilt on American rootstocks; the source article reports a degradation in the reliability of the GHD series over this period | — (context landmark, not a peak) | | | | | | |
| `heatwave-2003` | 2003 | August 2003 heatwave: among the earliest grape harvests ever recorded | August 21 | September 11 | August 27 | September 21 | September 8 | October 4 | August 27 |

`drought-1540` attaches only Burgundy, the only series with data that year (see `regions` in the output format below). `year-without-summer-1816` does not attach Languedoc or Champagne, which have no data that year (Champagne series started in 1806, with a gap as early as 1816). `phylloxera-crisis` does not anchor any specific peak on a curve: it reads as a period (a vertical band rather than a point marker, see "Historical landmarks" in `technical-specifications.md`).

## Preprocessing (script outside the build, run during implementation)

One-off Node script (not committed, consistent with `bird-migrations` and `flower-phenology`), from the NOAA text file downloaded once (`europe2012ghd.txt`).

1. Parse the three fixed-width blocks following the right-alignment rule described above (column end = end of the header label), ignoring the stray abbreviation row at year 1354 in blocks 2 and 3.
2. Keep only the seven chosen regions (see "Chosen regions").
3. For each region, compute a centered moving average over a twenty-year window (ten years before, ten years after the year considered): window reduced at the edges of the series (first and last decade), value computed only if at least half of the years covered by the effective window have raw data, otherwise `null` (no interpolation that would invent a trend from too few points). Window chosen as a compromise between smoothing the real year-to-year noise (standard deviation of about ten days from one year to the next on the Burgundy series) and preserving responsiveness on series that have gaps, notably Languedoc (60% completeness).
4. Output: `public/data/grape-harvest-almanac/harvest-dates.json`.

## Output format

```json
{
  "regions": [
    {
      "id": "burgundy",
      "nameFr": "Bourgogne",
      "nameEn": "Burgundy",
      "colorSlot": 1,
      "startYear": 1354,
      "endYear": 2006,
      "series": [
        { "year": 1354, "dayOffset": 15.3, "smoothedDayOffset": null },
        { "year": 1355, "dayOffset": 13.4, "smoothedDayOffset": null },
        { "year": 1816, "dayOffset": 51.5, "smoothedDayOffset": 34.8 }
      ]
    }
  ],
  "events": [
    {
      "id": "drought-1540",
      "year": 1540,
      "yearEnd": null,
      "titleFr": "La méga-sécheresse de 1540",
      "titleEn": "The 1540 megadrought",
      "descriptionFr": "La sécheresse la plus sévère connue en Europe par sources documentaires sur cinq siècles : rivières à sec, récoltes calcinées, vendanges parmi les plus précoces de toute la série.",
      "descriptionEn": "The most severe drought documented in Europe over five centuries: dry rivers, scorched harvests, one of the earliest grape harvests in the entire series.",
      "regions": ["burgundy"]
    }
  ]
}
```

`dayOffset`, `smoothedDayOffset`: days after August 31 (can be negative). `smoothedDayOffset` is `null` for a year with no computable moving average (see "Preprocessing" above); `dayOffset` is absent from `series` for a year with no raw data (no entry rather than a `null` value, so as not to weigh down a file that potentially covers 654 years per region).

## Validation constraints specific to this visualization

- Each region declares `startYear`/`endYear` consistent with the first and last years present in `series`.
- `colorSlot` is unique among the seven regions (see "Palette" in `technical-specifications.md`).
- Each `events` `id` is unique; `regions` references only `id`s present in `regions` (empty array allowed for a context landmark such as `phylloxera-crisis`, see "Historical landmarks" above).
