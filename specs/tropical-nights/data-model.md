# Data model: Tropical Nights

Complements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: specified, not implemented.**

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Données climatologiques de base - quotidiennes | Météo-France | https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes | Licence Ouverte v2.0 | 2026-09-24 |

Daily data from all stations in metropolitan France and the overseas territories since they opened, published by Météo-France on data.gouv.fr (same dataset, identifier `6569b51ae64326786e4e8e1a`, on the thematic portal https://meteo.data.gouv.fr/datasets/6569b51ae64326786e4e8e1a). Description of the source: "Données climatologiques de toutes les stations de métropole et d'outre-mer depuis leur ouverture, pour tous les paramètres disponibles. Ces données ont subi un contrôle climatologique."

**License** (checked on the data.gouv.fr API, identifier `lov2`, "Licence Ouverte / Open Licence version 2.0"): the reuser is free to "communiquer, la reproduire, la copier", to "adapter, la modifier, l'extraire et la transformer", to "diffuser, la redistribuer, la publier", including commercially, under a single condition: "mentionner la paternité de l''Information' : sa source (a minima le nom du 'Concédant') et la date de la dernière mise à jour de l''Information' réutilisée". The source credit block (Météo-France name, link, `retrieved` date) meets it. Consequence for the download: see "Download" below.

**File organization** (checked 2026-09-24): one compressed CSV file (`.csv.gz`) per department, per period batch and per parameter family, hosted at `https://meteofrance.s3.sbg.io.cloud.ovh.net/data/synchro_ftp/BASE/QUOT/`. Only the "RR-T-Vent" family (precipitation, temperatures, wind) is useful here; the "autres-parametres" family (humidity, radiation, phenomena) is not.

| Batch | File name (example, department 75) | Update |
|---|---|---|
| Before 1950 | `Q_75_avant-1949_RR-T-Vent.csv.gz` | Annual |
| 1950 to year N-2 | `Q_75_previous-1950-2024_RR-T-Vent.csv.gz` | Monthly |
| Last two years | `Q_75_latest-2025-2026_RR-T-Vent.csv.gz` | Daily |

The bounds in the file names shift from one year to the next (`previous-1950-2024` will become `previous-1950-2025`): the preprocessing script resolves the URLs through the resource list of the data.gouv.fr API (`/api/1/datasets/donnees-climatologiques-de-base-quotidiennes/`) rather than hard-coding them. The "before 1950" batch is not used (see "Temporal coverage" below).

Format: `;` separator, decimal point, one row per station and per day, header on the first row. Official field description: resources `Q_descriptif_champs_RR-T-Vent.csv` and `CLIMATOLOGIE_Donnees_quotidiennes_descriptif.pdf` of the same dataset.

## Chosen definition: tropical night

**Daily minimum sheltered temperature (TN) greater than or equal to 20 °C**, in line with Météo-France usage:

- "nuit tropicale (définie par une température ne descendant pas sous les 20 °C la nuit)" (Météo-France, "Une nuit tropicale au cœur de l'hiver !", February 12, 2020, https://meteofrance.com/actualites-et-dossiers/actualites/climat/une-nuit-tropicale-au-coeur-de-lhiver);
- "au moins une nuit tropicale (pas moins de 20 °C)" (Météo-France, "29 juillet - 2 août 2024 : première vague de chaleur de l'année", https://meteofrance.com/actualites-et-dossiers/actualites/premiere-vague-de-chaleur-de-lannee).

A TN value equal to 20.0 °C therefore counts as tropical. The gap with a strict reading (TN > 20 °C) is not negligible: measured on the eight chosen stations, between 8 (Strasbourg-Entzheim) and 151 (Nice) nights from 1950 to 2026 are exactly at 20.0 °C.

No formal definition found in a Météo-France glossary: the two quotations above are news articles, consistent with each other (see "Points to validate" in `technical-specifications.md`).

**TN measurement window:** Météo-France's usual convention (minimum recorded between 18:00 UTC the previous day and 18:00 UTC on day D) is not written in the dataset's description, which describes TN as "température minimale sous abri" without specifying the period. The times of the minimum (field `HTN`, Paris-Montsouris, 15,600 days filled in since 1984) cluster between 3:00 and 6:00 UTC, with a non-zero tail between 18:00 and 23:00 UTC, compatible with this convention without proving it. To be confirmed: it determines the "night of D-1 to D" label of the tooltip (see "Interactions" in `functional-specifications.md`).

## Homogenized series: why raw data

Météo-France publishes two reference products for climate change, checked on data.gouv.fr (both under Licence Ouverte v2.0):

- **LSH (Longues Séries Homogénéisées)**: "Séries mensuelles corrigées par homogénéisation statistique pour les paramètres températures minimales (TN), maximales (TX), insolations (IN) ou précipitations (RR)". Monthly only: a monthly mean of TN cannot be used to count nights, unusable here.
- **SQR (Séries Quotidiennes de Référence)**: "une sélection de données climatologiques quotidiennes pour une période donnée d'une station météorologique", whose period is chosen based on homogeneity breaks, the rate of missing data and station relocations. These are **uncorrected values**: checked on Paris-Montsouris, the 24,107 daily TN values of the SQR (1959-2024) are identical, without exception, to those of the base data. An SQR therefore indicates over which period Météo-France considers the raw series reliable, without correcting anything.

**There is no homogenized daily TN series in open data: the visualization uses the raw base data.** Consequences, to be stated on the page (see "Editorial angle" in `functional-specifications.md`):

- a station relocation, a change of shelter or sensor can create an artificial step in the series. The base file only carries a single position per station (the current coordinates and altitude), so these changes are not visible in it;
- urbanization around a station (urban heat island) mainly warms nighttime minimums, precisely the variable counted here. Paris-Montsouris is a station inside the city limits; the seven others are airport stations, on the outskirts, whose surroundings have also become urbanized since 1950;
- the trend shown therefore mixes climate warming and the local evolution of each station, without the visualization being able to separate them.

TN SQR periods of the chosen stations (file `Liste_SQR_TN_metro.csv`, produced on March 13, 2025), kept as metadata in the output file (`referencePeriod`, see "Output format" below):

| Station | TN SQR period |
|---|---|
| Nice | No TN SQR (LSH homogenized monthly series available, 1959-2023) |
| Perpignan | 1957-2023 |
| Marseille-Marignane | 1983-2023 |
| Toulouse-Blagnac | November 1991-2022 |
| Lyon-Bron | 1982-2022 |
| Bordeaux-Mérignac | 1988-2022 |
| Paris-Montsouris | 1959-2022 |
| Strasbourg-Entzheim | 1951-2022 |

A short SQR period (Toulouse, Bordeaux, Lyon, Marignane) signals homogeneity breaks detected in the monthly series before its start, without giving their amplitude for the daily data.

## Chosen stations

**Principle:** stations in metropolitan France with a continuous daily TN record since 1950, spread from the Mediterranean coast to the northeast, covering the whole observed range (from less than one tropical night a year to more than eighty). Eight stations: the cap of the site's categorical palette, without the stations being color-coded (see "Palette" in `technical-specifications.md`), and a number that fits in small multiples on a desktop screen (see "Content" in `functional-specifications.md`).

**Completeness measurement** ("RR-T-Vent" files of the departments concerned, retrieved 2026-09-24, data up to September 22, 2026): for each of the eight stations, **no missing TN value from May 1 to October 31, from 1950 to 2026**, and all these values carry quality code `1` (validated data).

Order: average number of tropical nights per year over the 1991-2020 normal, descending (which also orders them, roughly, from south to north).

| `id` | Displayed label | `NUM_POSTE` | Météo-France name (`NOM_USUEL`) | Department | Altitude | TN record | 1961-1990 | 1991-2020 |
|---|---|---|---|---|---|---|---|---|
| `nice` | Nice | `06088001` | NICE | 06 | 2 m | 1950-2026 | 28.9 | 56.4 |
| `perpignan` | Perpignan | `66136001` | PERPIGNAN | 66 | 42 m | 1950-2026 | 20.7 | 37.8 |
| `marseille` | Marseille-Marignane | `13054001` | MARIGNANE | 13 | 6 m | 1950-2026 | 17.2 | 35.8 |
| `toulouse` | Toulouse-Blagnac | `31069001` | TOULOUSE-BLAGNAC | 31 | 151 m | 1950-2026 | 2.8 | 11.8 |
| `lyon` | Lyon-Bron | `69029001` | LYON-BRON | 69 | 202 m | 1950-2026 | 2.2 | 11.0 |
| `bordeaux` | Bordeaux-Mérignac | `33281001` | BORDEAUX-MERIGNAC | 33 | 47 m | 1950-2026 | 1.2 | 6.1 |
| `paris` | Paris-Montsouris | `75114001` | PARIS-MONTSOURIS | 75 | 75 m | 1950-2026 | 2.6 | 5.6 |
| `strasbourg` | Strasbourg-Entzheim | `67124001` | STRASBOURG-ENTZHEIM | 67 | 150 m | 1950-2026 | 0.3 | 1.8 |

Columns 1961-1990 and 1991-2020: average number of tropical nights per year over the whole calendar year, measured.

**Ruled out during verification:**

- **Marseille-Observatoire** (`13055001`, urban station, the closest to the center): TN absent or patchy every summer from 2003 to 2018. Replaced by Marignane (Marseille-Provence airport, about twenty kilometers to the northwest, on the shore of the Étang de Berre), whose label "Marseille-Marignane" signals that it is not in the city.
- **Montpellier-Aéroport** (`34154001`) and **Nantes-Bouguenais** (`44020001`): equally complete series, ruled out to stay at eight. Montpellier would duplicate the Mediterranean profile of Perpignan and Marignane (28.6 nights a year over 1991-2020); Nantes would duplicate the profile of Strasbourg (1.5). Replacement candidates if the selection changes (see "Points to validate" in `technical-specifications.md`).

## Measured facts

Measured on the files retrieved on 2026-09-24 (TN ≥ 20 °C, whole calendar year), to be reused as is or remeasured if the data is retrieved again during implementation.

Average number of tropical nights per year, by decade (complete years only: the 2020 column covers 2020-2025, six years):

| Station | 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020-2025 |
|---|---|---|---|---|---|---|---|---|
| Nice | 15.0 | 18.7 | 24.0 | 40.3 | 42.7 | 49.7 | 72.8 | 85.2 |
| Perpignan | 24.9 | 18.0 | 17.4 | 25.8 | 31.7 | 37.2 | 42.7 | 51.7 |
| Marseille-Marignane | 10.3 | 14.8 | 17.2 | 18.7 | 33.5 | 37.1 | 34.9 | 53.0 |
| Toulouse-Blagnac | 3.0 | 1.9 | 1.7 | 4.0 | 9.3 | 11.7 | 13.5 | 23.3 |
| Lyon-Bron | 2.1 | 1.4 | 0.9 | 4.1 | 5.2 | 13.3 | 12.8 | 15.2 |
| Bordeaux-Mérignac | 0.7 | 0.7 | 1.1 | 1.4 | 5.7 | 6.9 | 5.1 | 12.5 |
| Paris-Montsouris | 1.7 | 1.1 | 3.6 | 2.5 | 5.3 | 4.6 | 6.5 | 9.7 |
| Strasbourg-Entzheim | 0.9 | 0.4 | 0.1 | 0.3 | 0.6 | 1.8 | 2.8 | 2.7 |

Records and streaks:

| Station | Record year | Longest streak of consecutive tropical nights | Highest TN |
|---|---|---|---|
| Nice | 2022: 104 nights (2026: 101 as of September 22) | 66 nights, from June 30 to September 3, 2022 | 28.7 °C (August 12, 2025) |
| Perpignan | 2026: 80 nights as of September 22 (2003: 65) | 44 nights, from July 8 to August 20, 2026 | 30.3 °C (August 4, 2018) |
| Marseille-Marignane | 2022: 80 nights | 28 nights, from August 2 to 29, 2003 | 28.3 °C (July 27, 1983) |
| Toulouse-Blagnac | 2026: 47 nights as of September 22 (2022: 34) | 14 nights, from July 8 to 21, 2026 | 27.4 °C (August 24, 2023) |
| Lyon-Bron | 2003: 42 nights | 14 nights, from August 3 to 16, 2003 | 25.7 °C (August 5, 2018) |
| Bordeaux-Mérignac | 2026: 32 nights as of September 22 (2003 and 2022: 20) | 13 nights, from August 4 to 16, 2003 | 26.8 °C (June 25, 2026) |
| Paris-Montsouris | 2026: 32 nights as of September 22 (1976 and 2003: 16) | 14 nights, from June 24 to July 7, 1976 | 26.4 °C (June 25, 2026) |
| Strasbourg-Entzheim | 2026: 13 nights as of September 22 (2015: 8) | 7 nights, from June 23 to 29, 2026 | 23.8 °C (June 23, 2017) |

The 2026 values come from the "last two years" batch, updated daily: they are validated (quality code `1`) but remain the most likely to be revised. A partial count can only increase by the end of the year: a partial record remains a record.

Other findings:

- Years without a single tropical night, from 1950 to 2026: 37 in Strasbourg-Entzheim, 18 in Bordeaux-Mérignac, 12 in Lyon-Bron and in Paris-Montsouris, 6 in Toulouse-Blagnac, none in Nice, Perpignan and Marignane.
- Season: across the eight stations, tropical nights fall from May 12 (Marignane, 2009) to October 24 (Marignane, 2022), with one exception (Perpignan, April 25, 2002). None from November to March, whereas Météo-France reported one elsewhere in the middle of winter (February 2020, article quoted in "Chosen definition" above).

## Preprocessing (script outside the build, run during implementation)

One-off Node script, not committed (same convention as the site's other visualizations, see for example "Preprocessing" in `specs/flower-phenology/data-model.md`), with no dependency: `node:zlib` for decompression, line-by-line reading.

1. Resolve, through the data.gouv.fr API, the URLs of the "RR-T-Vent" files of the "1950 to N-2" and "last two years" batches for the eight departments (06, 13, 31, 33, 66, 67, 69, 75), and download them (from 4 to 19.5 MB compressed per file, about 100 MB in total, measured on 2026-09-24).
2. Keep only the rows of the eight chosen `NUM_POSTE`, and for each `AAAAMMJJ`, `TN` and `QTN`. The same day present in two batches makes the script fail (unexpected overlap between batches).
3. Qualify each day: **tropical** if `TN ≥ 20.0`, **ordinary** if `TN < 20.0`, **missing** if `TN` is empty, if the row is absent, or if `QTN = 2` ("donnée douteuse en cours de vérification"). Codes `0` (protected), `1` (validated) and `9` (filtered, first checks passed) are accepted.
4. For each station and each year from 1950 to the year of the latest data:
   - `count`: number of tropical days over the **whole calendar year**, to stay comparable with the annual counts published by Météo-France;
   - `outsideWindow`: share of `count` falling outside the displayed window (May 1 - October 31, see "Displayed window" below);
   - `tn`: the 184 TN values of the window, in tenths of a degree (integers, to avoid floats), `null` if missing or not yet observed;
   - `missing`: number of missing nights in the window, excluding nights not yet observed;
   - `complete`: `true` if the window has fully elapsed (see `lastObserved` below) and `missing` is at most 9 (5% of the window).
5. `lastObserved`: date of the latest TN value present, common to the eight stations (the earliest of the eight latest dates, so that no station appears ahead of the others).
6. Write `public/data/tropical-nights/nights.json`.

### Displayed window

From **May 1 to October 31**, 184 nights, identical every year (the window does not contain February 29: a column always corresponds to the same date). It covers all the measured tropical nights but one (see "Measured facts" above), which remains counted in `count` and flagged by `outsideWindow`.

### Missing data and current year

A year with missing nights must never look like a cool year:

- **Missing night**: a distinct state, never confused with an ordinary night (see "Palette" in `technical-specifications.md`). It is counted neither as tropical nor as ordinary.
- **Incomplete year** (`complete: false` because `missing` > 9): its count is shown as a minimum ("au moins 12 nuits") and it is excluded from the per-decade averages of the table view. Not applicable with the measured data (no missing night across the eight stations), the rule stays in place for a later retrieval.
- **Current year**: nights after `lastObserved` are "not yet observed", a third state distinct from the other two (as of 2026-09-24: 39 nights, from September 23 to October 31, 2026). The count is shown with its date ("32 nuits au 22 septembre"), and the year is excluded from the per-decade averages as long as it is not complete. It remains included for the records: a partial count can only increase.

## Output format

`public/data/tropical-nights/nights.json` (size measured on a throwaway prototype: about 450 kB, 145 kB gzip-compressed):

```json
{
  "threshold": 20,
  "windowStart": "05-01",
  "windowEnd": "10-31",
  "lastObserved": "2026-09-22",
  "stations": [
    {
      "id": "nice",
      "label": "Nice",
      "stationId": "06088001",
      "stationName": "NICE",
      "latitude": 43.648833,
      "longitude": 7.209,
      "altitude": 2,
      "referencePeriod": null,
      "years": [
        {
          "year": 2022,
          "count": 104,
          "outsideWindow": 0,
          "missing": 0,
          "complete": true,
          "tn": [148, 152, 161, 203, 211, "…"]
        }
      ]
    },
    {
      "id": "paris",
      "label": "Paris-Montsouris",
      "stationId": "75114001",
      "stationName": "PARIS-MONTSOURIS",
      "latitude": 48.821667,
      "longitude": 2.337833,
      "altitude": 75,
      "referencePeriod": { "start": "1959-01-01", "end": "2022-12-31" },
      "years": []
    }
  ]
}
```

- `id`: stable identifier of the station, used in the URL (see "State in the URL" in `technical-specifications.md`); city name in kebab-case, not the `NUM_POSTE`, more readable in a link.
- `label`: displayed label, identical in both languages (see "Untranslated content" in `functional-specifications.md`); `stationName`: raw name from the source, for traceability.
- `tn[i]`: TN of the `i`-th night of the window (index 0 = May 1), in tenths of a degree Celsius. A night is tropical if `tn[i] >= 200`.
- `referencePeriod`: TN SQR period (see "Homogenized series" above), `null` for Nice.
- `latitude`, `longitude`, `altitude`: current position of the station as published (no history of relocations in the source).

## Download

`nights.json` is declared downloadable (`downloads: [nights.json]`): the Licence Ouverte v2.0 allows redistribution and transformation, with mention of the source and the update date, which the credit block already carries (see "Prepared data download" in the general `functional-specifications.md`).

## Validation constraints specific to this visualization

Checked by the preprocessing script, which fails rather than writing an inconsistent file:

- Eight stations, unique `id`s.
- Each station carries one `years` entry per year, from 1950 to the year of `lastObserved`, in order, with no gap.
- Each `tn` array has exactly 184 values.
- `count` equals the number of `tn >= 200` values, plus `outsideWindow`.
- A `null` value in `tn` is either a night after `lastObserved` (last year only) or counted in `missing`.
- `complete` is consistent with `missing` and `lastObserved` (see "Preprocessing" above).
