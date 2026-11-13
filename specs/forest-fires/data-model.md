# Data model: Where France Has Burned

Supplements the general `data-model.md`: schema of the dataset specific to this visualization.

## Source dataset

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Base de Données sur les Incendies de Forêts en France (BDIFF) | Ministère de l'Agriculture et de la Souveraineté alimentaire / IGN | https://bdiff.agriculture.gouv.fr/ | Licence Ouverte v2.0 | 2026-09-22 |
| API Découpage administratif (communes) | Etalab | https://geo.api.gouv.fr/decoupage-administratif | Licence Ouverte v2.0 | 2026-09-22 |

Since 2006, the BDIFF has centralized data on forest fires occurring across the whole of French territory (mainland France, Corsica, overseas departments and collectivities), at the level of the individual incident (municipality of origin, date, burned area, suspected cause, no precise geographic coordinates, see "Source fields used" below). In January 2023 it absorbed the Prométhée database, which had covered the fifteen departments of the Mediterranean rim since 1973: the period before 2006 is therefore only available for that area, not for the national territory (see "Chosen scope" below). Hosted by IGN on behalf of the Ministry of Agriculture, updated annually (data available up to the year before the current year).

The second source (Etalab's API Découpage administratif) contributes no fires: it only provides the geographic center of each French municipality, used to geocode the BDIFF incidents (see "Source fields used" and "Preprocessing" below).

## Chosen scope

- **Geographic: mainland France only** (Corsica included, overseas departments and collectivities excluded), same decision as `biodiversity`, `monument-layers` and `light-pollution` (see "Geographic coverage" in the `data-model.md` of `biodiversity`): a single-silhouette map does not lend itself to the very different scale of the DOM/COM without an inset layout, not chosen for this first version.
- **Temporal: 2006 to 2025** (2025 being the most recent year available at preprocessing time, 2026 being the current year). Choosing to start in 2006 rather than 1973 (the start date of the former Prométhée) deliberately sets aside a deeper history restricted to the Mediterranean departments only: complete national coverage, consistent with the editorial angle (see `functional-specifications.md`), takes precedence over temporal depth.
- **No minimum area threshold**: the BDIFF records fires from a few square meters (the smallest incident kept is 1 m², see "Measured statistics" below), no additional filter applied during preprocessing.
- **Forest fires only** (BDIFF search parameter `if[type]=F`, applied by default by the site itself without any action from the preprocessing script, see "Preprocessing" below): the BDIFF also covers other types of land (agricultural, etc.) outside the scope of this visualization.

## Source fields used

The BDIFF export (see "Preprocessing" below) provides neither latitude nor longitude, contrary to the initial scoping assumption: only the INSEE code and the name of the starting municipality locate each fire geographically. The position of each point on the map is therefore the center of its municipality (API Découpage administratif), not the precise coordinates of the fire itself.

| Source field (BDIFF, CSV export) | Usage |
|---|---|
| Année, Numéro | Fire identifier, construction of the link to the official record (see "Link to the official record" below) |
| Département | Grouping by department (see "Output format"), detail card |
| Code INSEE | Geocoding by municipality (see "Preprocessing" below) |
| Nom de la commune | Administrative position, detail card |
| Date de première alerte | Year assigned on the timeline (see "Interactions" in `functional-specifications.md`), date displayed in the detail card |
| Surface parcourue (m2) | Point size on the map (see "Point size" in `technical-specifications.md`), detail card |
| Nature | Suspected cause, normalized, in the detail card only, no dedicated filter (see "Interactions" in `functional-specifications.md`); filled in for 52.8% of the incidents kept (see "Measured statistics"), consistent with the scoping assumption on this fill rate |

Additional field, from the API Découpage administratif:

| Source field (Etalab) | Usage |
|---|---|
| `centre` (point) per municipality (INSEE `code`) | Latitude/longitude of each fire (center of its starting municipality, see above) |

## Link to the official record

Each BDIFF fire has an official record available at a URL of the form `https://bdiff.agriculture.gouv.fr/incendie/{année}/{numéro}` (checked during implementation on several records, stable template). Same pattern as the link to the Plateforme Ouverte du Patrimoine in `monument-layers` (see "Link to the reference record" in its `data-model.md`): one identifier kept per fire, link computed client-side from a single URL template, no full URL stored in `fires.json`.

## Preprocessing

One-off script (Node.js rather than Python, outside the project's npm dependencies: the Python interpreter on the implementation machine required accepting an Xcode license, outside the scope of this task; otherwise the same one-off preprocessing logic as `monument-layers`):

1. **Retrieving the export.** Unlike the Mérimée database of `monument-layers`, the BDIFF exposes no static file downloadable in a single request on data.gouv.fr (the resource referenced there points to the portal itself, not to a file). The `bdiff.agriculture.gouv.fr` site does, however, expose a complete CSV export (`GET /incendies/zip`, in a session carrying the search criteria set via `GET /incendies?if[dateAlerteDeb][date]=JJ/MM/AAAA&if[dateAlerteFin][date]=JJ/MM/AAAA`), but capped at 30,000 results per export (explicit error message beyond that). The preprocessing therefore queries two consecutive ranges (2006-2015: 25,367 incidents, 2016-2025: 27,444 incidents, each under the cap) and concatenates the two resulting CSVs.
2. Restriction to forest fires only (`Type de feu : F`, the site's default filter, confirmed in the header of each export) and to mainland France (Corsica included), by excluding the overseas departments (971, 972, 973, 974, 975, 976, 977, 978) on the `Département` field (see "Chosen scope" above).
3. **Geocoding by municipality:** since the BDIFF export carries no coordinates, each incident is matched to its municipality (`Code INSEE`) via the complete export of the API Découpage administratif (`GET /communes?fields=centre,code,nom,departement`, ~35,000 municipalities), and takes the `centre` of that municipality as its position. Incidents whose INSEE code matches no current municipality in this reference are rejected (municipalities merged/delegated since then, whose code has changed, see "Measured statistics" below for the exact volume).
4. Extraction of the year (`Année` field, already separate from the full date in the export) as the assigned year.
5. Normalization of the suspected cause (`Nature`) into a fixed value (see "Output format" below).
6. Sort by ascending year, then write `public/data/forest-fires/fires.json`.

**Basemap:** reuse as is of `public/data/biodiversity/basemap.json` (copied to `public/data/forest-fires/basemap.json`), same geographic extent (mainland France, Corsica included), same TopoJSON format (`objects.france`) consumed in the same way (`topojson-client`), same precedent as `monument-layers` (see "Preprocessing" in its `data-model.md`). No enrichment (rivers, road network): no need for an additional geographic landmark was found during implementation, unlike `monument-layers`/`paris-trees`.

## Output format

```json
{
  "generatedAt": "2026-09-22",
  "departments": [
    { "code": "33", "nameFr": "Gironde", "nameEn": "Gironde" }
  ],
  "fires": [
    {
      "id": "2022-11421",
      "commune": "Landiras",
      "lat": 44.5696,
      "lng": -0.4333,
      "departmentCode": "33",
      "year": 2022,
      "date": "2022-07-12",
      "burntArea": 125520000,
      "cause": "malicious"
    }
  ]
}
```

`departmentCode` references `departments` (list of the 93 mainland departments actually represented in the dataset kept, out of 96 in total, see "Measured statistics"), to avoid repeating the department name on each incident; same `nameFr`/`nameEn` as `monument-layers` (see its `data-model.md` for the convention). `id` takes the year and fire number from the source (`{Année}-{Numéro}`), used to build the link to the official record (see "Link to the official record" above). `lat`/`lng` are the center of the starting municipality (precision ~4 decimals, the one provided by the API Découpage administratif), not the precise coordinates of the fire (see "Source fields used" above). `cause` carries a normalized value (`natural` / `human` / `malicious` / `unknown`, mapped from the source field `Nature`: `Naturelle` → `natural`; `Involontaire (particulier)`, `Involontaire (travaux)`, `Accidentelle` → `human`; `Malveillance` → `malicious`; empty → `unknown`); displayed only in the detail card, never used as a filter or as a color (see "Interactions" in `functional-specifications.md`). `burntArea` in square meters, the unit already used by the source (no conversion during preprocessing); converted to hectares at display time only (see "Point size" in `technical-specifications.md`), the unit used by the BDIFF site itself on its own records.

## Client-side derived fields (not in the JSON)

- **Fire count and total burned area for the current simulated year:** computed from the `fires` whose `year` matches the displayed year (see "Content" in `functional-specifications.md`).
- **Link to the official record** (detail card): `https://bdiff.agriculture.gouv.fr/incendie/{year}/{numéro}`, rebuilt from `id` (see "Link to the official record" above).

## Measured statistics

Measured on the actual export of September 22, 2026:

- **52,811** "forest fire" incidents kept by the BDIFF between 2006 and 2025 (all of France, before geographic filtering).
- **1,378** excluded because located in an overseas department (see "Chosen scope").
- **487** excluded (0.9% of the remainder) for lack of a match in the current municipality reference (INSEE code of a municipality since merged/delegated), spread over 197 distinct INSEE codes, no particular department or year.
- **50,946** incidents kept in `fires.json`, spread over **93** mainland departments (out of 96: missing Paris [75], Hauts-de-Seine [92] and Seine-Saint-Denis [93], where forest is almost nonexistent).
- Suspected cause filled in for **52.8%** of the incidents kept (`natural` 2,916, `human` 15,231, `malicious` 8,732, `unknown` 24,067).
- Burned area (`burntArea`, m²): minimum 1, median 1,000 (0.1 ha), p90 30,924 (≈ 3 ha), p99 511,000 (≈ 51 ha), maximum 125,520,000 (1,255.2 ha), the Landiras fire (Gironde, July 2022), by far the largest of the period.
- By year, from 1,347 incidents (2024) to 4,356 (2022, the most active year of the period); total burned area per year from 2,663 ha (2024) to 58,914 ha (2022).
- Share of the Mediterranean rim (fifteen former Prométhée departments) in the annual total: 70.0% in 2006-2010, 59.6% in 2021-2025, empirically confirming the geographic shift mentioned in the editorial angle (see `functional-specifications.md`), without contradicting or exaggerating it.
