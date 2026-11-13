# Data model: The Discovered Worlds

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

**Status: specified, not implemented.** The figures below were measured on the actual source on 2026-09-24 (public TAP queries), not estimated.

## Source dataset

Two datasets:

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Planetary Systems Composite Parameters (PSCompPars) | NASA Exoplanet Archive (Caltech/IPAC, for NASA) | https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=PSCompPars | Not formalized; free reuse with credit to the archive (see note below) | 2026-09-24 |
| Planetary Fact Sheet (ratios to Earth) | NASA Space Science Data Coordinated Archive (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/planet_table_ratio.html | NASA content, not subject to copyright in the United States, credit to NASA requested | 2026-09-24 |

**Note on the archive's license:** the NASA Exoplanet Archive does not publish an explicit license (neither CC nor a public domain statement) for its tables. Two public texts govern reuse:

- the FAQ (`docs/faq.html`, question 14): "all data contained in the archive have been published and can be used for additional research with the appropriate acknowledgements";
- the acknowledgements page (`docs/acknowledge.html`), which asks that the following text be included in any published material: "This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."

Neither of these texts restricts the redistribution of derived data. The case therefore falls under the "no formalized license but allowing reuse with citation" category of the general rule (see "Prepared data download" in the general `functional-specifications.md`). The acknowledgement text above is included in the source credit block (see "Data source" in `technical-specifications.md`). This is not a definitive legal reading: to be confirmed with the user (see "Points to validate" in `technical-specifications.md`).

**Note on the second dataset:** eight reference values (mass and semi-major axis of the Solar System planets, see "Solar System landmarks" below), read once from the NSSDCA fact sheet (update of March 18, 2025). Official NASA media page: "NASA content [...] generally are not subject to copyright in the United States", with NASA to be credited as the source.

## Choice of table

The `pscomppars` table (one row per confirmed planet, parameters completed from several publications) rather than `ps` (one row per planet and per publication, 40,155 rows measured): the visualization shows a population, one point per planet, without arbitrating between competing publications. The archive itself describes `pscomppars` as intended to "enable a more statistical view of the known exoplanet population" (`docs/pscp_about.html`), at the cost of an internal consistency not guaranteed row by row (parameters from different references), which has no impact on a population cloud.

The archive's inclusion criterion (`docs/exoplanet_criteria.html`): mass or minimum mass less than or equal to 30 Jupiter masses, results published in a peer-reviewed journal. Unconfirmed candidates (TESS, Kepler) are not included and are not used.

## Access

Synchronous TAP service, with no key or authentication:

```
https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=
  select pl_name, disc_year, disc_pubdate, discoverymethod, disc_facility,
         pl_orbsmax, pl_orbper, pl_bmasse, pl_bmassprov, st_mass
  from pscomppars
```

JSON response (array of objects), 6,366 rows, about 2 MB. The service is behind Cloudflare: a query filtering on a reference column (which contains HTML) was blocked during the measurements; the queries above, without such a filter, go through.

## Fields used

| `pscomppars` field | Unit | Usage |
|---|---|---|
| `pl_name` | | Planet name, detail card |
| `disc_year` | year | Position on the simulated timeline, aggregation for the table view |
| `disc_pubdate` | `YYYY-MM` | Order of planets within the same year (see "Preprocessing"), not stored. Filled in for all 6,366 planets, but its year differs from `disc_year` for 1,158 of them: it is not a reliable discovery date, only a secondary sort criterion |
| `discoverymethod` | | Detection method, grouped into five families (see "Grouping of methods") |
| `disc_facility` | | Discovery instrument or observatory, detail card |
| `pl_orbsmax` | astronomical unit (AU) | Horizontal axis: semi-major axis of the orbit, average distance to the star |
| `pl_orbper` | days | Computation of the semi-major axis when `pl_orbsmax` is missing (see "Preprocessing") |
| `st_mass` | solar masses | Same |
| `pl_bmasse` | Earth masses | Vertical axis: mass of the planet |
| `pl_bmassprov` | | Nature of the mass: measured, minimum or estimated (see "Nature of the values") |

`pl_rade` (radius) and `sy_dist` (distance to the Solar System) are not used: the radius does not fit the chosen form (see "Chosen form" in `technical-specifications.md`), and the distance is not encoded.

## Measurements (2026-09-24)

- **6,366 confirmed planets**, around 4,775 stars, discovered from **1992 to 2026** (2026 partial, cut off on September 24). The first two (PSR B1257+12 c and d, 1992) orbit a pulsar; 51 Peg b (1995) is the first around a Sun-like star.
- By method: transit 4,708, radial velocity 1,200, gravitational microlensing 289, direct imaging 97, seven other methods 72 in total (transit timing variations 29, eclipse timing variations 17, orbital brightness modulation 9, pulsar timing 8, astrometry 6, pulsation timing variations 2, disk kinematics 1).
- By year (all methods): fewer than 100 per year until 2010, 872 in 2014 and 1,504 in 2016, then between 150 and 564 per year. The 2014 and 2016 peaks are batch validations from the Kepler telescope (784 Kepler planets in 2014, 1,276 in 2016, including 1,277 planets published in May 2016 across all methods).
- Most productive instruments: Kepler 2,787, TESS 936, K2 549.
- Coordinates of the families in the mass × semi-major axis plane (medians, plotted planets): transit 0.076 AU / 7 Earth masses; radial velocity 0.97 AU / 359; microlensing 2.35 AU / 190; direct imaging 182 AU / 3,970. Four clearly distinct regions, which is the basis for the chosen form (see `technical-specifications.md`).
- Range: semi-major axis from 0.0044 to 19,000 AU (1st and 99th percentiles: 0.013 and 56 AU), mass from 0.02 to 9,535 Earth masses (1st and 99th percentiles: 0.40 and 6,547).
- Region of an "Earth twin" (0.5 to 2 AU, 0.5 to 2 Earth masses): **only two planets**, both by microlensing (OGLE-2016-BLG-1195L b, OGLE-2013-BLG-0341L B b). 75 planets between 0.5 and 2 AU have a mass of 10 Earth masses or less.

## Nature of the values

`pscomppars` fills in missing values by computation (`docs/pscp_calc.html`), which has a direct impact on the vertical axis:

| Nature of the mass (`massKind`) | Source `pl_bmassprov` | Planets |
|---|---|---|
| `measured`: measured mass | `Mass`, `Msin(i)/sin(i)` | 2,469 |
| `minimum`: minimum mass (orbit inclination unknown, mostly radial velocity) | `Msini` | 892 |
| `estimated`: estimated from the radius using the Chen and Kipping (2017) mass-radius relation | `M-R relationship` | 2,974 (transits only, i.e. 63% of them) |
| missing | | 31 |

The semi-major axis and the period, on the other hand, are never computed by the archive (the `pscomppars` documentation only lists radius, mass, density, luminosity, equilibrium temperature, flux and spectroscopic metrics). Excluding estimated masses would remove nearly two thirds of the transits, including the 2014 and 2016 Kepler waves: they are kept and flagged in the detail card (see "Points to validate" in `technical-specifications.md`).

## Grouping of methods

Five families, in decreasing order of counts, which also sets the order of the legend and of the color slots:

| `id` | French | English | Source `discoverymethod` | Planets |
|---|---|---|---|---|
| `transit` | Transit | Transit | `Transit` | 4,708 |
| `radial-velocity` | Vitesse radiale | Radial velocity | `Radial Velocity` | 1,200 |
| `microlensing` | Microlentille | Microlensing | `Microlensing` | 289 |
| `imaging` | Imagerie directe | Direct imaging | `Imaging` | 97 |
| `other` | Autres méthodes | Other methods | The seven other values | 72 |

Beyond five families, counts become invisible (29 planets at most) and the palette would leave the range that stays readable in a scatter plot (see "Palette" in `technical-specifications.md`). A `discoverymethod` value unknown at the next refresh falls into `other` rather than making the preprocessing fail.

## Solar System landmarks

Eight planets, values read from the NSSDCA fact sheet (ratios to Earth):

| `id` | French | English | Semi-major axis (AU) | Mass (Earth masses) |
|---|---|---|---|---|
| `mercury` | Mercure | Mercury | 0.387 | 0.0553 |
| `venus` | Vénus | Venus | 0.723 | 0.815 |
| `earth` | Terre | Earth | 1 | 1 |
| `mars` | Mars | Mars | 1.52 | 0.107 |
| `jupiter` | Jupiter | Jupiter | 5.20 | 317.8 |
| `saturn` | Saturne | Saturn | 9.57 | 95.2 |
| `uranus` | Uranus | Uranus | 19.17 | 14.5 |
| `neptune` | Neptune | Neptune | 30.18 | 17.1 |

Pluto, a dwarf planet, is not included. All eight fall within the axis domains (see "Axes" in `technical-specifications.md`).

## Preprocessing (to be done during implementation, outside the build)

A preprocessing script, in the spirit of those of the other visualizations, rerun manually and not committed (see "Rules common to all visualizations" in the general `technical-specifications.md`):

1. Query the TAP service (see "Access" above), a single query.
2. Group `discoverymethod` into five families (see "Grouping of methods").
3. Semi-major axis: take `pl_orbsmax` (`axisKind: "measured"`). If it is missing and `pl_orbper` and `st_mass` are filled in, compute it using Kepler's third law, `a = (M★ × P²)^(1/3)` with `a` in AU, `M★` in solar masses and `P` in years (`pl_orbper / 365.25`), neglecting the planet's mass (`axisKind: "derived"`). Applies to 422 planets, mostly recent TESS discoveries (123 of the 277 planets of 2026 have no `pl_orbsmax`). Checked on the 5,593 planets that have all three values: median relative deviation of 0.6% from the published semi-major axis, 5.3% at the 90th percentile.
4. Mass: take `pl_bmasse` and translate `pl_bmassprov` into `massKind` (see "Nature of the values").
5. Round semi-major axis and mass to three significant figures.
6. Sort by `disc_year`, then `disc_pubdate`, then `pl_name`, and write `public/data/exoplanets/exoplanets.json`.

Result measured by simulating this processing on the actual response: **6,327 plottable planets** (semi-major axis and mass known), **39 non-plottable** (8 with no semi-major axis and no way to compute it, 31 with no mass). These 39 remain in the file and in the counts (counter, table view), but have no point. Estimated file size: about 1.1 MB, of the same order as `satellites-in-orbit/satellites.json` (892 KB): no compaction needed.

## Output format

```json
{
  "generatedAt": "2026-09-24",
  "methods": [
    { "id": "transit", "nameFr": "Transit", "nameEn": "Transit" },
    { "id": "radial-velocity", "nameFr": "Vitesse radiale", "nameEn": "Radial velocity" },
    { "id": "microlensing", "nameFr": "Microlentille", "nameEn": "Microlensing" },
    { "id": "imaging", "nameFr": "Imagerie directe", "nameEn": "Direct imaging" },
    { "id": "other", "nameFr": "Autres méthodes", "nameEn": "Other methods" }
  ],
  "solarSystem": [
    { "id": "earth", "nameFr": "Terre", "nameEn": "Earth", "semiMajorAxisAu": 1, "massEarth": 1 }
  ],
  "planets": [
    { "name": "51 Peg b", "year": 1995, "methodId": "radial-velocity", "facility": "Haute-Provence Observatory", "semiMajorAxisAu": 0.052, "axisKind": "measured", "massEarth": 194, "massKind": "minimum" }
  ]
}
```

Attribute names in camelCase, like the data files of the other visualizations (`regionId`, `launchDate` in `satellites-in-orbit`). `methodId` and the `id` values in English kebab-case. A family's color is not stored: it is assigned client-side by order of appearance in `methods` (see "Palette" in `technical-specifications.md`). `semiMajorAxisAu`/`axisKind` and `massEarth`/`massKind` are `null` together when the value is missing. `generatedAt` records the retrieval date, used as the dataset's `retrieved`.

## Client-side derived fields (not in the JSON)

- **Intra-year simulated year (`simYear`):** the planets of the same year are spread evenly over `[year, year + 1)`, in file order, same mechanism as `earthquakes` (see "Animation" in its `technical-specifications.md`). Prevents the 1,504 planets of 2016 from appearing in a single frame.
- **Counter:** number of planets (plottable or not) whose `year` is earlier than or equal to the simulated year, among the active families.

## Validation constraints specific to this visualization

- Each `methodId` in `planets` exists in `methods`.
- `planets` is sorted by ascending `year` (simplifies accumulation via an index cursor, see "Animation" in `technical-specifications.md`).
- `semiMajorAxisAu` and `massEarth` are strictly positive when filled in (logarithmic axes).
- `axisKind` is `null` if and only if `semiMajorAxisAu` is `null`; same for `massKind` and `massEarth`.
- `solarSystem` contains exactly the eight planets listed above.
- No planet is silently removed: the number of rows in `planets` equals the number of rows returned by the TAP query.
