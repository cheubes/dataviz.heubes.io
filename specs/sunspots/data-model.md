# Data model: The Sun's Heartbeat

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| Field | Value |
|---|---|
| `name` | International Sunspot Number V2.0 (monthly mean, 13-month smoothed, cycle minima and maxima) |
| `publisher` | WDC-SILSO, Royal Observatory of Belgium, Brussels |
| `url` | https://doi.org/10.24414/qnza-ac80 |
| `license` | CC BY-NC 4.0 |
| `retrieved` | 2026-09-24 |

A single dataset, in the sense of the `datasets` attribute: the three files used (see "Source files" below) are products of the same dataset, published by the same source under the same license and the same DOI.

**`url`: the DOI rather than the download page.** The DOI is the identifier SILSO asks to be cited (see "License and citation" below): showing it in the source credit block reproduces the requested minimal credit as is. Checked at retrieval: it redirects (302) to the landing page of the Royal Observatory of Belgium (`astro.oma.be/doi/ROB-SIDC-SILSO_SunspotNumberV2.html`, 200), which itself links to the download page `https://www.sidc.be/SILSO/datafiles`. The source monitoring script follows redirects (see "Source monitoring" in the general `technical-specifications.md`).

**Temporal coverage:** monthly means from January 1749 to August 2026 (last completed month at retrieval), i.e. 3,332 months, with no missing value. The monthly means go no further back: according to the file description page, the observations compiled by Rudolf Wolf are too sparse before 1749 (only yearly means exist from 1700, not used here).

## License and citation

Checked at retrieval, on three pages of the source:

- **Monthly file description page** (`https://www.sidc.be/SILSO/infosnmtot`, "LICENSE" section): "SILSO data is under CC BY-NC4.0 license [...] which means you can: Share: copy and redistribute the material in any medium or format; Adapt: remix, transform, and build upon the material. As long as you follow the license terms: Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made. [...] NonCommercial: You may not use the material for commercial purposes. No additional restrictions [...]" (punctuation adapted: the source separates each term from its definition with a dash).
- **Download page** (`https://www.sidc.be/SILSO/datafiles`, "Data policy: CC BY-NC"): "The World Data Center SILSO has adopted an open data policy [...] and our sunspot data can be freely downloaded (Licence: CC BY-NC : https://creativecommons.org/licenses/by-nc/4.0). However, we kindly request that proper credit to the WDC-SILSO is explicitely included in any publication using our data (paper article or book, on-line Web content, etc.)."
- **Citation page** (`https://www.sidc.be/SILSO/citations`): suggested minimal credit, **"Source: WDC-SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80"**, or the long variant "Sunspot data from the World Data Center SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80". Bibliographic reference: Clette, F. and Lefèvre, L., *SILSO Sunspot Number V2.0*, 2015, DOI 10.24414/qnza-ac80, published by WDC-SILSO, Royal Observatory of Belgium.

The general data policy of the Royal Observatory of Belgium (`https://www.astro.oma.be/en/information/data-policy/`) confirms the restriction: any commercial use requires the prior written consent of the director general.

**Consequence for this site:** compatible use (non-commercially operated site; its CC0 license, see "Footer" in `style-guide.md`, covers only its original presentation and code and does not extend to this dataset, which remains under CC BY-NC 4.0), same situation as the honey buzzard of `bird-migrations` (CC BY-NC 4.0) and as `volcanic-eruptions` (non-commercial use with citation). The three license obligations are met as follows:

- **Credit:** the page's source credit block (`name`, `publisher`, `license`, link to the DOI), which reproduces the requested minimal credit.
- **Link to the license:** the displayed `license` label ("CC BY-NC 4.0").
- **Indication of changes:** the prepared file restructures the data (see "Preprocessing" below); it carries an attribution notice saying so (`attribution` field, see "Output format"), so that the notice follows it if it is downloaded and shared outside the page (see "Download" in `technical-specifications.md`).

## Version 2.0 (2015 recalibration)

Since July 1, 2015, the historical series (known as the "Zurich number", now version 1.0, archived and no longer updated) has been replaced by version 2.0 (page `https://www.sidc.be/SILSO/newdataset`). Two changes matter for this visualization:

- **Change of scale:** the reference observer is no longer Wolf but A. Wolfer, which removes Zurich's conventional factor of 0.6 and multiplies the whole series by 1/0.6. Combined with the corrections, the net increase is about 45% after 1947, according to the source.
- **Corrections of past inhomogeneities** (detailed in Clette et al. 2014, *Space Science Reviews* 186, and Clette and Lefèvre 2016, *Solar Physics* 291).

**Implication:** the figures in the visualization are not comparable to version 1.0 values, still quoted by publications predating 2015. Checked on the archived version 1.0 file (`DATA/ARCHIVE/V1.0/monthssn.dat`): the smoothed maximum of cycle 19 (March 1958) was 201.3 there, versus 285.0 in version 2.0; May 1778 was 238.9 (398.2 in V2.0, i.e. exactly ×1/0.6) and October 1957 253.8 (359.4 in V2.0, i.e. only ×1.42: a correction specific to the period after 1947). **The recalibration changed the holder of the monthly record:** October 1957 in version 1.0, May 1778 in version 2.0. This caveat appears in the long presentation (see `functional-specifications.md`).

## Source files

Three CSV files, semicolon-separated, values left-padded with spaces (to be stripped when parsing). Downloaded from `https://www.sidc.be/SILSO/DATA/`: the `INFO/` path of the description pages does not serve the files (404, verified).

### `SN_m_tot_V2.0.csv`: monthly mean total sunspot number

Arithmetic mean of the daily numbers of all days of the month (daily number: R = Ns + 10 × Ng, Ns being the number of spots and Ng the number of groups over the whole solar disk, according to the DOI landing page). Unitless number.

| Column | Content | Use |
|---|---|---|
| 1 | Year | Monthly key (`month`) |
| 2 | Month | Monthly key (`month`) |
| 3 | Decimal date of mid-month | Not used (recomputed from year and month) |
| 4 | Monthly mean; `-1` = missing value | `value` |
| 5 | Standard deviation of station values; `-1` before 1818 | Not used |
| 6 | Number of observations; `-1` before 1818 | Not used |
| 7 | `1` definitive, `0` provisional | `provisional` |

3,332 rows, January 1749 to August 2026, no `-1` value in column 4. Five provisional months (April to August 2026), "subject to revision" according to the source (usually the last three to six months). February 1824 is the only month with no daily observation at all since 1749: its value (18.0) was interpolated by Wolf between the neighboring months (column 6 at `0`); kept as is.

### `SN_ms_tot_V2.0.csv`: 13-month smoothed monthly mean

13-month "tapered boxcar" running mean centered on the month considered (weight 1, except 0.5 at months −6 and +6, normalized by 1/12). Same columns as the monthly file, column 4 = smoothed value. No value for the first six and last six months of the series (`-1`): smoothed values from July 1749 to February 2026 (3,320 months), the last five of which are provisional (October 2025 to February 2026).

The source states that this series is provided only for compatibility with past publications, and recommends starting from the monthly means for any other smoothing. It remains the reference here because it is the one that conventionally defines the dates of cycle minima and maxima (see "Cycle definition" below): plotting another moving average would make the peaks fall beside the official dates.

### `DATA/Cycles/TableCyclesMiMa.csv`: dates of cycle minima and maxima

Two header rows (`;Min;;;Max;;` then `N°;Year;Month;SN;Year;Month;SN`), encoded in Latin-1 (the `°` in the header is not valid UTF-8), then one row per cycle: number, year and month of the minimum, smoothed value at the minimum, year and month of the maximum, smoothed value at the maximum. 25 rows (cycles 1 to 25).

**Discrepancy found between SILSO products:** the cycle 25 row has no maximum in this CSV (nor in the TXT `TableCyclesMiMa.txt`, nor on the "Cycles durations" page), whereas the HTML page "Solar Cycles Min/Max" (`https://www.sidc.be/SILSO/cyclesminmax`) shows October 2024, 160.9. This value is also the maximum of the smoothed series over cycle 25, a definitive (not provisional) value at retrieval. Preprocessing therefore takes it from the smoothed series (see below).

## Cycle definition

A cycle runs from one minimum of the 13-month smoothed series to the next minimum, dates published by SILSO (file `TableCyclesMiMa.csv`, see above). Its maximum is the month where the smoothed series peaks. Numbering starts with cycle 1, opened by the February 1755 minimum (Wolf's convention).

- **Cycles 1 to 24:** complete, from the month of the minimum to the month before the next minimum.
- **Cycle 25:** opened by the December 2019 minimum, ongoing; covered up to the last available month (August 2026). Maximum in October 2024 (see "Discrepancy found" above).
- **Cycle 0 (partial):** the 73 months from January 1749 to January 1755, the end of a cycle whose starting minimum predates the series. SILSO does not number it; it is kept so as not to lose any month of the series, flagged incomplete and without official minimum or maximum (see "Points to validate" in `technical-specifications.md`).

## Measured statistics

Measured on the files retrieved on 2026-09-24. Rise: from minimum to maximum. Duration: from minimum to the next minimum (identical to the "Duration" column published by SILSO on the "Cycles durations" page).

| Cycle | Minimum | Smoothed value at minimum | Maximum | Smoothed value at maximum | Rise (months) | Duration (months) | Highest monthly mean of the cycle |
|---|---|---|---|---|---|---|---|
| 1 | 1755-02 | 14.0 | 1761-06 | 144.1 | 76 | 136 | 178.7 (1761-05) |
| 2 | 1766-06 | 18.6 | 1769-09 | 193.0 | 39 | 108 | 263.7 (1769-10) |
| 3 | 1775-06 | 12.0 | 1778-05 | 264.2 | 35 | 111 | 398.2 (1778-05) |
| 4 | 1784-09 | 15.9 | 1788-02 | 235.3 | 41 | 163 | 290.0 (1787-12) |
| 5 | 1798-04 | 5.3 | 1805-02 | 82.0 | 82 | 147 | 103.8 (1804-10) |
| 6 | 1810-07 | 0.0 | 1816-05 | 81.2 | 70 | 154 | 160.3 (1817-03) |
| 7 | 1823-05 | 0.1 | 1829-11 | 119.2 | 78 | 126 | 177.3 (1830-04) |
| 8 | 1833-11 | 12.2 | 1837-03 | 244.9 | 40 | 116 | 343.8 (1836-12) |
| 9 | 1843-07 | 17.6 | 1848-02 | 219.9 | 55 | 149 | 300.6 (1847-10) |
| 10 | 1855-12 | 6.0 | 1860-02 | 186.2 | 50 | 135 | 221.9 (1860-07) |
| 11 | 1867-03 | 9.9 | 1870-08 | 234.0 | 41 | 141 | 293.6 (1870-05) |
| 12 | 1878-12 | 3.7 | 1883-12 | 124.4 | 60 | 135 | 159.6 (1882-04) |
| 13 | 1890-03 | 8.3 | 1894-01 | 146.5 | 46 | 142 | 215.4 (1893-08) |
| 14 | 1902-01 | 4.5 | 1906-02 | 107.1 | 49 | 138 | 180.3 (1907-02) |
| 15 | 1913-07 | 2.5 | 1917-08 | 175.7 | 49 | 121 | 257.7 (1917-08) |
| 16 | 1923-08 | 9.3 | 1928-04 | 130.2 | 56 | 121 | 179.9 (1929-12) |
| 17 | 1933-09 | 5.8 | 1937-04 | 198.6 | 43 | 125 | 275.6 (1938-07) |
| 18 | 1944-02 | 12.9 | 1947-05 | 218.7 | 39 | 122 | 285.0 (1947-05) |
| 19 | 1954-04 | 5.1 | 1958-03 | 285.0 | 47 | 126 | 359.4 (1957-10) |
| 20 | 1964-10 | 14.3 | 1968-11 | 156.6 | 49 | 137 | 192.3 (1969-03) |
| 21 | 1976-03 | 17.8 | 1979-12 | 232.9 | 45 | 126 | 266.9 (1979-09) |
| 22 | 1986-09 | 13.5 | 1989-11 | 212.5 | 38 | 119 | 284.5 (1989-06) |
| 23 | 1996-08 | 11.2 | 2001-11 | 180.3 | 63 | 148 | 244.3 (2000-07) |
| 24 | 2008-12 | 2.2 | 2014-04 | 116.4 | 64 | 132 | 146.1 (2014-02) |
| 25 | 2019-12 | 1.8 | 2024-10 | 160.9 | 58 | ongoing (81 months as of August 2026) | 216.0 (2024-08) |

Facts used for the visualization and its copy:

- **Monthly record:** May 1778, 398.2 (cycle 3). Second: October 1957, 359.4 (cycle 19). Only eight months exceed 300 over the whole series.
- **Strongest cycle:** cycle 19, smoothed maximum 285.0 in March 1958. Followed by cycle 3 (264.2).
- **Weakest cycles:** cycles 6 (81.2) and 5 (82.0), consecutive, which form the Dalton Minimum. Then cycle 14 (107.1) and cycle 24 (116.4), the weakest since cycle 14, i.e. in more than a century.
- **Zero months:** 67 monthly means equal to zero, including 21 consecutive months from October 1809 to June 1811, in the depths of the Dalton Minimum. Last zero month: August 2009. All values before 1818 should be read with caution: SILSO publishes neither standard deviation nor number of observations for them, and the monthly series starts in 1749 only because the observations compiled by Wolf were too sparse before.
- **Duration:** 9.0 years (cycle 2) to 13.6 years (cycle 4); average of cycles 1 to 24: 132.4 months, i.e. 11.0 years.
- **Rise:** 35 months (cycle 3) to 82 months (cycle 5); average of cycles 1 to 24: 52.3 months (4.4 years). Average smoothed maximum of cycles 1 to 24: 178.7.
- **Waldmeier effect** (the stronger a cycle, the faster it rises): correlation of −0.75 between rise and smoothed maximum over cycles 1 to 24. This is what the chosen form makes visible (see "Chosen form" in `functional-specifications.md`).
- **Cycle 25:** smoothed maximum of 160.9 in October 2024, 15th out of 25, clearly above cycle 24. Last monthly mean: 76.0 in August 2026 (provisional); last smoothed value: 99.8 in February 2026 (provisional).
- **Rounding discrepancy:** the smoothed series gives 264.3 in May 1778 where the cycle table publishes 264.2. The table values are authoritative for cycle maxima (see "Preprocessing").

## Preprocessing (script outside the build, run during implementation)

One-off Node script (not committed, consistent with `bird-migrations`, `flower-phenology` and `grape-harvest-almanac`), from the three files downloaded once (see "Source files").

1. Parse the three CSVs: `;` separator, padding spaces stripped, `TableCyclesMiMa.csv` read as Latin-1 and its two header rows skipped.
2. Join monthly mean and smoothed mean by year and month. A `-1` value becomes `null` (only for the smoothed series, at the first six and last six months; a monthly value at `-1` makes the script fail, see "Validation constraints").
3. Carry over the provisional flag (column 7 of the monthly file): `provisional` true for months flagged `0`. The smoothed series flag is not carried over: a provisional smoothed value is provisional because neighboring monthly months are, which the visitor already reads on those months.
4. Build the cycles from `TableCyclesMiMa.csv` (published bounds and maxima), plus the partial cycle 0 (see "Cycle definition"). Cycle 25 maximum missing from the table: take the month and value of the maximum of the smoothed series over that cycle (October 2024, 160.9), checking that they match the HTML page "Solar Cycles Min/Max".
5. No other transformation of the values: no custom smoothing, no recomputation of cycle bounds, no scale conversion.
6. Write the `attribution` notice (see "Output format").
7. Output: `public/data/sunspots/sunspots.json`, minified JSON. Size measured on a throwaway prototype of the format below: about 234 KB.

Updates: the file is frozen at the `retrieved` date, like all visualizations on the site. Rerunning the script later adds the new months and turns provisional months into definitive ones; the day SILSO publishes the end of cycle 25 (next minimum), the cycle table will gain a row 26, which the script picks up without modification.

## Output format

```json
{
  "attribution": "Source: WDC-SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80. Licence: CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/). Retrieved 2026-09-24. Changes: monthly mean and 13-month smoothed series joined by month and converted to JSON, cycle table attached; cycle 25 maximum taken from the smoothed series; values unchanged.",
  "cycles": [
    {
      "number": 19,
      "firstMonth": "1954-04",
      "lastMonth": "1964-09",
      "complete": true,
      "minimumSmoothed": 5.1,
      "maximum": "1958-03",
      "maximumSmoothed": 285.0
    },
    {
      "number": 25,
      "firstMonth": "2019-12",
      "lastMonth": "2026-08",
      "complete": false,
      "minimumSmoothed": 1.8,
      "maximum": "2024-10",
      "maximumSmoothed": 160.9
    }
  ],
  "months": [
    { "month": "1749-01", "value": 96.7, "smoothed": null, "provisional": false },
    { "month": "1778-05", "value": 398.2, "smoothed": 264.3, "provisional": false },
    { "month": "1957-10", "value": 359.4, "smoothed": 282.5, "provisional": false },
    { "month": "2026-08", "value": 76.0, "smoothed": null, "provisional": true }
  ],
  "annotations": [
    {
      "id": "dalton-minimum",
      "cycles": [5, 6],
      "month": null,
      "labelFr": "Minimum de Dalton (cycles 5 et 6)",
      "labelEn": "Dalton Minimum (cycles 5 and 6)"
    },
    {
      "id": "record-month",
      "cycles": [3],
      "month": "1778-05",
      "labelFr": "Mai 1778 : record mensuel, 398,2",
      "labelEn": "May 1778: monthly record, 398.2"
    }
  ]
}
```

- `cycles`: from 0 to 25, in order. `firstMonth`/`lastMonth`: months covered by the cycle in `months`; for cycles 1 to 25, `firstMonth` is the month of the minimum published by SILSO. Cycle 0: `firstMonth` = `1749-01`, `complete` false, `minimumSmoothed`, `maximum` and `maximumSmoothed` set to `null`.
- `months`: one object per month, in order, without gaps. `value`: monthly mean; `smoothed`: 13-month smoothed mean, `null` at the first six and last six months; `provisional`: value subject to revision by SILSO.
- `annotations`: the editorial landmarks of the visualization (full list and labels: see "Annotated landmarks" in `functional-specifications.md`). `cycles`: cycles concerned; `month`: anchor month, `null` for a landmark that designates whole cycles. Carried by the file rather than by the i18n dictionary, like the historical landmarks of `grape-harvest-almanac`: they are facts about the data, anchored to specific months, not interface copy.
- `attribution`: in English, the language of the source and its license; not translated (see "Untranslated content" in `functional-specifications.md`).

## Validation constraints specific to this visualization

Checked by the preprocessing script, which fails rather than writing an inconsistent file:

- `months` is continuous from `1749-01` to the last available month, with no duplicates or gaps (3,332 months at retrieval); no `value` is `null` or negative.
- `smoothed` is `null` exactly at the first six and last six months, and only there.
- The `provisional` months form a continuous final run (never a provisional month followed by a definitive month).
- `cycles` is numbered from 0 to the last cycle without gaps; their `firstMonth`-`lastMonth` ranges follow one another without overlap and cover exactly `months`.
- Each `maximum` falls within its cycle's range; only the last cycle and cycle 0 have `complete` false.
- Each `annotations[].cycles` references only existing cycles; each non-null `month` exists in `months` and belongs to one of the referenced cycles; each `id` is unique.
