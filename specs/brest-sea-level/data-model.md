# Data model: The Sea Is Rising in Brest

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| Field | Value |
|---|---|
| `name` | Tide Gauge Data, Brest (station 1): annual mean sea levels, RLR (Revised Local Reference) dataset |
| `publisher` | Permanent Service for Mean Sea Level (PSMSL), National Oceanography Centre; data authority: Shom |
| `url` | https://psmsl.org/data/obtaining/stations/1.php |
| `license` | No formal license: data freely accessible, citation required (Holgate et al. 2013; PSMSL, "Tide Gauge Data") |
| `retrieved` | 2026-09-24 (PSMSL extraction of September 14, 2026), to be updated during implementation |

**Station:** Brest, PSMSL identifier `1`, GLOSS `242`, 48.38285° N, 4.494838° W, data authority Shom. Last update of the station on the PSMSL side: February 20, 2026.

**Files used:**
- Annual (file consumed): https://psmsl.org/data/obtaining/rlr.annual.data/1.rlrdata
- Monthly (consulted for verification, not consumed, see "Monthly data" below): https://psmsl.org/data/obtaining/rlr.monthly.data/1.rlrdata

**Citation requested by the PSMSL** (page "Referencing the Tide Gauge Data Set", https://psmsl.org/data/obtaining/reference.php), to be included in the long presentation or the credit block:
- Permanent Service for Mean Sea Level (PSMSL), 2026, "Tide Gauge Data", Retrieved 14 Sep 2026 from http://www.psmsl.org/data/obtaining/.
- Simon J. Holgate, Andrew Matthews, Philip L. Woodworth, Lesley J. Rickards, Mark E. Tamisiea, Elizabeth Bradshaw, Peter R. Foden, Kathleen M. Gordon, Svetlana Jevrejeva, and Jeff Pugh (2013) New Data Systems and Products at the Permanent Service for Mean Sea Level. Journal of Coastal Research: Volume 29, Issue 3: pp. 493 – 504. doi:10.2112/JCOASTRES-D-12-00175.1.

The PSMSL specifies that the "Retrieved" date must match the "Extracted from Database" date shown on its data pages (September 14, 2026 at the time of verification), not the download date.

## License and data policy (verified)

Verified on 2026-09-24 on the public pages of the three organizations that distribute these measurements:

- **PSMSL (chosen source):** no formal license published (neither on the home page, nor on "About us", nor on the "Obtaining", "Complete dataset" or "Notes" pages). The only written obligation: "When using the tide gauge data set from the PSMSL, we ask that you reference the last paper describing the data set, as well as the data set itself." The re3data registry classifies the repository as "open" access, license "other". Redistribution is neither explicitly allowed nor explicitly forbidden.
- **SONEL** (Système d'Observation du Niveau des Eaux Littorales, which distributes the same means, see below): "Free publication policy for scientific applications" policy, which requires user registration, communication of results, and "not to provide data to a third party", commercial use excluded. More restrictive than the PSMSL: ruled out as a source for this reason.
- **Shom / REFMAR:** the tide gauge observations of the RONIM network (including Brest) are distributed on data.shom.fr under Licence Ouverte 2.0 (Etalab), but as high-frequency and hourly measurements, not as homogenized annual means since 1807. Recomputing two centuries of means from the hourly measurements would go beyond the scope of a visualization and would duplicate reference work already done by the PSMSL and Shom.

Consequence for the download: see "Download" below.

## Station and series: verified facts

- **Station documentation (PSMSL):** the old data come from the original volumes of the "Publications Scientifiques"; 1807-1835 are mid-tide levels (Mean Tide Level, MTL, mean of high and low waters), 1846 onward true mean levels (Mean Sea Level, MSL). The PSMSL applies to the 1807-1835 values of the RLR file an MTL-MSL correction of -23 mm (Wöppelmann et al., Ocean Dynamics, 56, 487-497, 2006), making them comparable to the rest of the series; these years carry the flag `010`. In July 2025, the PSMSL updated the whole series to include historical data recently recovered by Shom and to align its means with those of SONEL.
- **RLR datum:** each RLR series is referred to a single local zero, set by convention at about 7,000 mm below the mean level (to avoid negative values), based on the history of leveling benchmarks provided by the authority. Only the variations matter, not the absolute value. The PSMSL recommends using only the RLR dataset for time series analysis (the "Metric" dataset has no datum continuity).
- **Relative measurement:** a tide gauge measures the sea relative to the quay on which it stands. The series is corrected neither for vertical land motion, nor for atmospheric pressure (inverse barometer effect), nor for glacial isostatic adjustment. In Brest, vertical land motion is small but not demonstrated to be zero: historical leveling showed no more than one millimeter of difference over 73 years between the tide gauge benchmark and a neighboring benchmark, while absolute gravimetry 1998-2022 estimates a slight subsidence of -1.10 ± 0.62 mm/yr ("Absolute gravity measurements at Brest (France) between 1998 and 2022", Earth System Science Data, 17, 5859, 2025). The site therefore speaks of a "relative" sea-level rise in Brest, without inferring the share due to the ocean alone.
- **Older records out of scope:** measurements go back to 1711 (Wöppelmann et al., Geophysical Research Letters, 2008, "Tide gauge datum continuity at Brest since 1711: France's longest sea-level record"), but they are not included in the PSMSL RLR dataset, which starts in 1807. The visualization starts in 1807.

## Raw format (PSMSL, verified)

Annual file `1.rlrdata`: semicolon-delimited text, one line per year, Fortran format `1x,i4,1x,i6,1x,a1,1x,i3`:

```
 1807;  6970;N;010
 1836;-99999;N;000
 2023;  7232;N;000
```

| Column | Content |
|---|---|
| 1 | Year |
| 2 | Annual mean level, in mm above the RLR datum; `-99999` for a year without a value (the series is padded with these fill values between the first and the last year) |
| 3 | Missing days: `N`, or `Y` if a month is missing from the mean or if at least 30 days are missing over the year |
| 4 | Attention flag (octal): `000` none, `001` to be treated with caution, `010` MTL value in an MSL series (corrected to MSL in the RLR file) |

PSMSL rules: a monthly mean is not computed beyond 15 missing days; an annual mean is not computed if more than one month is missing.

## Actual coverage (measured on the September 14, 2026 file)

- **Extent:** 1807 to 2023, i.e. 217 years, of which **187 have values** (86%). The PSMSL shows 88% completeness on its page, computed on months.
- **Gaps (30 years without a value):**

| Gap | Duration | Months with values in the monthly file / remark |
|---|---|---|
| 1836-1845 | 10 years | None. Between the end of the mid-tide measurements (1835) and the start of the true means (1846) |
| 1857-1860 | 4 years | 5 months in 1857, 7 in 1860, none in 1858-1859 |
| 1863-1864 | 2 years | 8 and 10 months |
| 1897 | 1 year | 10 months |
| 1915 | 1 year | None |
| 1937-1938 | 2 years | 7 months in 1937, none in 1938 |
| 1944-1952 | 9 years | 4 months in 1944, none afterwards. Bombing of Brest in August 1944; the continuity of the datum on either side of this break was established by Wöppelmann et al. (2008) |
| 1980 | 1 year | 10 months |

- **Incomplete years (`Y`):** 1847, 1862, 1867, 1868, 1877, 1878, 1891, 1907, 1917, 1922, 1982 (value published but computed with one month or more than 30 days missing).
- **Corrected mid-tide years (`010`):** 1807 to 1835 (29 years).
- **No `001` flag** in the annual series.
- **Why the series stops in 2023:** the monthly file goes up to June 2025, but November and December 2024 are missing: the PSMSL therefore does not compute a 2024 mean, and 2025 is incomplete. The last year of the visualization is 2023; it will move forward with PSMSL updates (see "Preprocessing").

## Monthly data

The monthly file (2,622 lines, 1807.0417 to 2025.4583, 312 months at `-99999`) is not consumed: the subject of the visualization is the trend over two centuries, and monthly means would mostly add the seasonal cycle and storms (a difference of nearly 40 cm between February and October 2023), which would blur the reading of a 24 cm rise. It is used only to verify the annual gaps (see "Actual coverage").

## Reference level

Levels are displayed as a deviation from the **nineteenth-century mean level**: mean of the 76 years with values between 1807 and 1899, i.e. **6,939.7 mm** RLR. The RLR zero has no physical meaning for the visitor, whereas a historical reference directly gives the rise. Robust choice: taking 1846-1899 (true means only, without the corrected mid-tide years) gives 6,942.0 mm, i.e. a 2.3 mm difference, with no visible effect.

## Measured statistics

Computed on the 187 years with values of the annual file, by the author of these specs, during the verification of 2026-09-24 (one-off verification script, not committed). Slopes by ordinary linear regression of the annual means on the years; the uncertainty given is the standard error of the slope, which ignores the autocorrelation of the series and therefore underestimates the actual uncertainty: it is indicative.

**Total rise:**
- 2014-2023 mean: **+23.6 cm** above the nineteenth-century mean level. Editorial rounding: "about 24 cm".
- The 1900-1909 decade is still at the nineteenth-century level (-0.3 cm): practically all of the rise dates from after 1900.
- Annual record: 2023, **+29.2 cm**. The ten highest years of the series are all after 2008; eight fall between 2014 and 2023.
- Lowest year: 1808, -7.2 cm.

**Rate of rise by period:**

| Period | Years with values | Slope (mm/yr) |
|---|---|---|
| 1807-1899 | 76 | 0.0 ± 0.1 |
| 1900-1992 | 80 | 1.3 ± 0.1 |
| 1993-2023 | 31 | 3.2 ± 0.5 |
| Whole series 1807-2023 (reference) | 187 | 1.1 ± 0.05 |
| 1900-2023 (reference) | 111 | 1.6 ± 0.1 |

Split chosen for the visualization (see "Trends by period" in `technical-specifications.md`): the first three rows. 1900 separates a flat nineteenth century from a rising twentieth century; 1993 is the start of satellite altimetry (TOPEX/Poseidon), a conventional break in sea-level budgets, chosen for this reason rather than fitted to the Brest series. Since 1993, the sea has been rising in Brest about two and a half times faster than in the twentieth century.

**What the series does not allow us to claim (to be respected in the copy):**
- A single station carries strong variability from one decade to the next: slopes computed over sliding 30-year windows already reach about 3 mm/yr around 1915-1920 and around 1950, before coming back down. The acceleration is read by comparing long periods, not from an "instantaneous" rate. Ruled out for this reason: a sliding rate curve, which would suggest past accelerations as strong as the current one.
- A 20-year slope (2004-2023: 5.7 ± 0.9 mm/yr) is too sensitive to a few record years (2023) to be quoted.
- Marked jump between the 1900s (-0.3 cm) and 1910s (+7.3 cm) decades, with no explanation in the PSMSL station documentation: neither commented on nor corrected (see "Points to validate" in `technical-specifications.md`).
- None of these values distinguishes the share of the ocean from that of the ground (see "Relative measurement" above).

## Preprocessing (script outside the build, run during implementation)

One-off Node script (not committed, same convention as `grape-harvest-almanac`), from the PSMSL annual file downloaded once (`1.rlrdata`).

1. Read the lines (separator `;`, spaces to be removed), discard the years at `-99999`.
2. Keep for each year with a value: the year, the RLR value in mm (integer, as published), and two booleans derived from the flags: `meanTideLevel` (flag `010`) and `incomplete` (column 3 at `Y`). Stop the script with an error if a year carries the flag `001`: the station documentation would then need to be reread before publication.
3. Compute the reference level (mean of the years with values 1807-1899, rounded to a tenth of a mm) and, for each of the three periods (see "Measured statistics"), the regression line: slope rounded to a tenth of a mm/yr with its standard error, and fitted levels at the two bounds of the period (in mm RLR, to a tenth), which are used to draw the trend without redoing the regression on the client side.
4. Output: `public/data/brest-sea-level/sea-level.json`.

Update: rerunning the script on a new PSMSL file is enough to extend the series (2024 when the PSMSL publishes it); the copy that quotes figures (summary, long presentation, statistics table above) must then be rechecked.

## Output format

```json
{
  "station": { "psmslId": 1, "name": "Brest", "latitude": 48.38285, "longitude": -4.494838 },
  "extractedFromDatabase": "2026-09-14",
  "reference": { "startYear": 1807, "endYear": 1899, "levelMm": 6939.7 },
  "years": [
    { "year": 1807, "levelMm": 6970, "meanTideLevel": true, "incomplete": false },
    { "year": 1847, "levelMm": 6918, "meanTideLevel": false, "incomplete": true },
    { "year": 2023, "levelMm": 7232, "meanTideLevel": false, "incomplete": false }
  ],
  "trends": [
    { "id": "nineteenth-century", "startYear": 1807, "endYear": 1899, "rateMmPerYear": 0.0, "standardError": 0.1, "startLevelMm": 6939.4, "endLevelMm": 6940.1 },
    { "id": "twentieth-century", "startYear": 1900, "endYear": 1992, "rateMmPerYear": 1.3, "standardError": 0.1, "startLevelMm": 6964.1, "endLevelMm": 7079.6 },
    { "id": "satellite-era", "startYear": 1993, "endYear": 2023, "rateMmPerYear": 3.2, "standardError": 0.5, "startLevelMm": 7087.5, "endLevelMm": 7183.2 }
  ]
}
```

`levelMm`: raw RLR value, in mm. The deviation from the reference level (`levelMm - reference.levelMm`) is computed at display time and in the table view, not stored: the file remains traceable line by line back to the PSMSL file. `startLevelMm`/`endLevelMm`: levels of the period's regression line at `startYear` and `endYear`. The three lines are fitted separately: they do not join from one period to the next (a 2.4 cm gap between 1899 and 1900, 0.8 cm between 1992 and 1993), which is expected and remains visible. A year without a value has no entry in `years` (same convention as `grape-harvest-almanac`): the gaps are deduced from the missing years. Expected size: about ten KB.

## Download

No `downloads` attribute: redistribution is explicitly allowed by none of the sources (see "License and data policy" above). The PSMSL publishes no license, and SONEL, which has distributed exactly the same means since 2025, forbids passing them on to third parties. In the sense of the general rule (see "Prepared data download" in the general `functional-specifications.md`), what is missing is therefore the redistribution permission that would make a source without a formal license acceptable. The loss is small for the visitor: the source link, in the credit block, leads to the station page, from which the annual file can be downloaded in one click. To be reopened if the PSMSL or Shom confirm in writing that redistribution with citation is allowed (see "Points to validate" in `technical-specifications.md`).

## Validation constraints specific to this visualization

- `years` is sorted by ascending `year`, without duplicates, and each `levelMm` is a strictly positive integer (never `-99999`).
- `meanTideLevel` is true only for years between 1807 and 1835.
- Each entry of `trends` has a unique `id`; the periods follow one another without overlapping and cover the range of `years` (1807 to the last year).
- `reference.startYear` and `reference.endYear` bound at least one year present in `years`.
