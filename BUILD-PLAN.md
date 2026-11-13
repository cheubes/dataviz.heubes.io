# Incremental build plan

Twenty-five steps, each demonstrable in a browser before moving on to the next. See `CLAUDE.md` for the structure of `specs/` and the rules for using the specifications.

Each step has a ready-to-use prompt to start it, except step 8, whose prompt depends on a dataset choice not yet made. Steps 2 to 6 rely on a throwaway test visualization (see step 2), since no real first visualization has been chosen at this stage: step 7 removes this test content, replaced by the real first visualization in step 8, before deployment (step 9).

## ✅ 1. Astro skeleton + shared chrome

`astro.config.mjs`, `package.json`, `BaseLayout.astro` with a sticky header and a footer (colors, typography, emoji language selector, not yet functional) on an empty page. See "File structure" in `technical-specifications.md` and `style-guide.md` ("Header", "Footer", "Colors", "Typography").

**Criterion:** `astro dev` runs, the header and footer follow the style guide, with nothing dynamic yet.

**Status:** done.

**Prompt:**
```
Implement step 1 of the build plan (BUILD-PLAN.md): Astro skeleton and shared chrome.

Initialize the Astro project (astro.config.mjs, package.json, see "Dependencies" in
technical-specifications.md), then src/layouts/BaseLayout.astro, src/components/Header.astro
and src/components/Footer.astro, following style-guide.md: CSS variables (src/styles/global.css,
see "Colors" and "Spacing, grid and responsive"), Ubuntu font loaded via Google Fonts
(see "Fonts" in technical-specifications.md), sticky header and footer (language selector
with flag emojis, not yet functional, visual only, CC BY-NC-SA 4.0 notice).

Create a minimal test page (src/pages/index.astro) to check the display. Do not build
any functionality beyond this step (no visualization content, no JS).

Completion criterion: astro dev runs, the header and footer display correctly in the
style guide colors on this test page.
```

## ✅ 2. Content collections + test visualization

`src/content/config.ts` (schema of the `visualizations` collection, see "File structure" in `technical-specifications.md`), a test visualization (throwaway content, unrelated to any real upcoming visualization), to validate the schema in both languages.

**Criterion:** the Astro build passes with this content; introducing a missing or wrongly typed field in the frontmatter makes it fail.

**Status:** done.

**Prompt:**
```
Implement step 2 of the build plan (BUILD-PLAN.md): content collections and
test visualization.

Create src/content/config.ts with the schema of the visualizations collection, following
"Content collections schema" in technical-specifications.md and the attributes in
data-model.md ("Visualization", "Source dataset").

Add a test visualization (src/content/visualizations/test-viz.fr.md and .en.md), with
a complete frontmatter and a dummy dataset, explicitly marked as throwaway content to be
removed in step 7.

Completion criterion: astro build passes with this content; deliberately remove a required field
from the frontmatter and check that the build fails, then put it back.
```

## ✅ 3. Home page (catalog)

Tile grid, lazy loading, empty state. See `home-page.md`.

**Criterion:** the test visualization's tile is displayed and leads to its page.

**Status:** done.

**Prompt:**
```
Implement step 3 of the build plan (BUILD-PLAN.md): home page.

Build src/pages/index.astro, src/pages/fr/index.astro and src/components/VizCard.astro,
following home-page.md: tile grid (lazy-loaded cover, title, summary), empty state
(no published visualization).

Completion criterion: the test visualization's tile (step 2) is displayed on the home page, in both
languages, and leads to its page (even if that page does not exist yet: the link may be
broken at this stage).
```

## ✅ 4. Visualization page (generic template)

Cover, title, summary, long presentation, source credit block, reserved mount area (still empty), back link. See "Visualization page" in `style-guide.md`.

**Criterion:** the test visualization's page is displayed with all its presentation content; the mount area reserves its height without content.

**Status:** done.

**Prompt:**
```
Implement step 4 of the build plan (BUILD-PLAN.md): visualization page (generic
template).

Build src/pages/[viz].astro and src/pages/fr/[viz].astro (getStaticPaths from the
visualizations collection, see "Content collections and page generation" in
technical-specifications.md), following "Visualization page" in style-guide.md:
cover, title as h1, summary, long presentation (markdown body), dataset credit
block, reserved mount area (still empty at this stage, no real visualization), link
back to the catalog.

Completion criterion: clicking the test tile from the home page (step 3) opens its page, with
all its presentation content displayed correctly in both languages.
```

## ✅ 5. Full multilingual support

Language detection on first visit, `localStorage` persistence, `/fr/` prefix, unavailability message (`404.astro`). See "Multilingual" in `functional-specifications.md` and "Architecture" in `technical-specifications.md`.

**Criterion:** switching language keeps the navigation context; visiting an untranslated URL displays the unavailability message in the right language.

**Status:** done.

**Prompt:**
```
Implement step 5 of the build plan (BUILD-PLAN.md): full multilingual support.

Build the functional language selector (browser language detection on first
visit, fallback to English, persistence via localStorage after a manual change) and
src/pages/404.astro (unavailability message localized according to the /fr/ prefix), following
"Multilingual" in functional-specifications.md and "Untranslated content" /
"Language detection and persistence" in technical-specifications.md.

Completion criterion: switching language via the selector keeps the navigation context;
visiting a visualization URL that does not exist in a language displays the
unavailability message in that language rather than the generic 404.
```

## ✅ 6. SEO and accessibility

`@astrojs/sitemap`, hreflang, meta/Open Graph in `BaseLayout.astro`, then a manual check (keyboard, actual on-screen contrast). See "SEO" and "Accessibility" in `technical-specifications.md`.

**Criterion:** `sitemap.xml` generated, meta tags present, keyboard navigation working on the home page and the visualization page.

**Status:** done.

**Prompt:**
```
Implement step 6 of the build plan (BUILD-PLAN.md): SEO and accessibility.

Add @astrojs/sitemap, the meta and Open Graph tags (title, summary, cover) and the
hreflang links between FR/EN versions of the same page in BaseLayout.astro, following "SEO"
in technical-specifications.md. Then do a manual check in the browser:
keyboard navigation, actual on-screen contrast (the values in style-guide.md were
computed by the dataviz skill's validator, not tested visually here).

Completion criterion: sitemap.xml generated, meta and hreflang tags present, the home page and the
visualization page remain usable with the keyboard.
```

## ✅ 7. Removal of test content

Removes the test category and visualization from step 2: the skeleton site remains functional (home page in its empty state, see `home-page.md`), ready for a first real visualization to be added.

**Criterion:** the home page displays the empty state documented in `home-page.md`, with no error or reference to the test content.

**Status:** done.

**Prompt:**
```
Implement step 7 of the build plan (BUILD-PLAN.md): removal of test content.

Remove the test category and visualization created in step 2 (content, cover),
without modifying the code from the previous steps.

Completion criterion: the home page displays the empty state documented in home-page.md ("Empty: no
visualization published in the current language"), with no build error or reference to the test
content.
```

## ✅ 8. First real visualization

Choice of a first open data dataset and a first visualization angle, documentation of `specs/<viz-slug>/` (see "Structure of `specs/`" in `CLAUDE.md`), then implementation: real content in the `visualizations` collection, interactive rendering in the mount area of the generic template (step 4).

**Criterion:** the real visualization's tile is displayed on the home page in both languages; its page displays the real interactive rendering, not an empty placeholder.

**Status:** done, fourteen real visualizations at this stage:
- `bird-migrations` (The Migration Routes), real GPS/Argos data (four species, see `specs/bird-migrations/data-model.md`), D3 + Canvas rendering, basemap enriched with rivers and shaded relief (Natural Earth, worldwide coverage, the site's first raster asset, see "Rivers (basemap)"/"Relief (basemap)" in `specs/bird-migrations/data-model.md`), real cover (`public/covers/bird-migrations.jpg`).
- `flower-phenology` (The Flower Calendar), real GBIF occurrence data (twelve wild species, see `specs/flower-phenology/data-model.md`), D3 SVG rendering (arcs), real cover (`public/covers/flower-phenology.jpg`).
- `biodiversity` (French Biodiversity), H3 hexagonal grid (resolution 4, 395 cells) over the silhouette of metropolitan France, GBIF data aggregated via the SQL Downloads API (see `specs/biodiversity/data-model.md`), static D3 SVG rendering (no zoom/pan, removed during review), optional "live data" mode querying the GBIF API from the browser, real cover (`public/covers/biodiversity.jpg`).
- `paris-trees` (Paris, Tree by Tree), 194,315 real trees from the City of Paris "Les arbres" inventory (see `specs/paris-trees/data-model.md` for the chosen scope, adjusted during implementation), Canvas 2D rendering (`d3-geo` + `d3-zoom`, Mercator projection, grid spatial index for hover and render culling) over a basemap with a street network and the Seine (added after review, the latter being the site's only data outside Paris Data, sourced from OpenStreetMap), filter by dominant genus and species search, zoom on click on an arrondissement, real cover (`public/covers/paris-trees.jpg`).
- `satellites-in-orbit` (The Orbital Rush), 20,020 real payloads still in orbit (active or not) from CelesTrak's SATCAT catalog (see `specs/satellites-in-orbit/data-model.md` for the scope and the geographic grouping into five zones), Canvas 2D animation in a continuous loop from 1958 to today (`d3-scale` + `d3-timer` + `d3-geo`/`topojson-client` for the rotating globe, deterministic halo positioning without real orbits), three playback speeds, native year slider (`<input type="range">`, yearly granularity, no tick marks, added after the first implementation on the model of `monument-layers`) controllable manually or automatically, clickable legend doubling as a zone filter, real cover (`public/covers/satellites-in-orbit.jpg`).
- `light-pollution` (The Sky, Year by Year), real VIIRS VNL nighttime radiance (NOAA Earth Observation Group, annual composites 2013-2025, versions v2.1 and v2.2, see `specs/light-pollution/data-model.md`) aggregated on the same H3 hexagonal grid as `biodiversity` (395 cells reused as is) and translated into a six-level sky visibility scale (the site's sequential palette), compact D3 SVG rendering (same Mercator projection as `biodiversity`, deliberately shorter map), legend and controls above the map, autoplay in a loop (`d3-timer`, same convention as `satellites-in-orbit`: starts in 2013, stops on 2025, three speeds, pause button), native year slider (`<input type="range">`) controllable manually or automatically, deliberately neutral editorial angle (the data show a decline in light intensity since 2013, especially since 2022-2023, not an increase as the framing draft assumed), real cover (`public/covers/light-pollution.jpg`).
- `monument-layers` (Layers of Heritage), 37,661 real historic monuments from the Mérimée database (Ministry of Culture, see `specs/monument-layers/data-model.md` for the preprocessing and the measured exclusion statistics), Canvas 2D rendering (`d3-geo` + `d3-zoom`, same France basemap as `biodiversity`) animated chronologically in a continuous loop (`d3-timer`, linear scale, same convention as `satellites-in-orbit`: three speeds, 2.5 s pause on the complete map before each new pass): monuments predating year 0 (4.75% of the dataset, archaeological era rather than numeric century) appear as a static base from the start of each pass, a decision made with the user after measuring the actual distribution, to avoid 90% of the monuments appearing within a fraction of a second of the animated sweep (see "Points decided during implementation" in `specs/monument-layers/technical-specifications.md`), filter by nature of protection (classé/inscrit), native year slider (`<input type="range">`, no tick marks, unlike `light-pollution`) controllable manually or automatically, mouse and touch zoom/pan doubled by zoom in/zoom out/reset buttons (same controls as `paris-trees`, maximum zoom 1,000, raised in two steps based on user feedback), basemap enriched with the network of motorways and expressways across all of France (60,272 segments) and fifteen rivers with precise courses (3,124 segments), entirely from OpenStreetMap via the Overpass API after two passes of increasing precision based on user feedback (Natural Earth, then only nineteen major cities, before full national coverage): queries by named relation or by administrative area rather than by bounding box, the only way to get a response without exceeding the server timeout over an extent as large as France, detail card completed with a link to each monument's official record on the Plateforme Ouverte du Patrimoine (clickable once the card is pinned, not on simple hover), real cover (`public/covers/monument-layers.jpg`).
- `grape-harvest-almanac` (The Grape Harvest Almanac), real grape harvest dates from seven French wine regions (Bourgogne, southern Rhône valley, Bordeaux, Languedoc, Alsace, lower Loire valley, Champagne) over 1354-2007, source Daux et al. 2012 (NOAA/WDS Paleoclimatology, see `specs/grape-harvest-almanac/data-model.md` for the fixed-width parsing pitfall encountered and fixed, and for the choice of regions: Jura and Ile-de-France, although cited as "among the most complete" by the source article, were ruled out because their series stop before 1980), D3 SVG rendering (multi-series timeline, thin raw curve and a more prominent twenty-year moving average per region), four clickable historical landmarks (1540 megadrought, 1816 year without a summer, 1863-1900 phylloxera crisis, 2003 heat wave) with a detail panel, region filter doubling the legend, no zoom/pan or tick marks on the date axis (removed at the user's request after a first version that included them, see "Axes" in `specs/grape-harvest-almanac/technical-specifications.md`), real cover (`public/covers/grape-harvest-almanac.jpg`).
- `endangered-species` (What's Left), real population trajectories of six emblematic species (tiger, black rhinoceros, giant panda, mountain gorilla, vaquita, European hamster of Alsace), each sourced separately from its monitoring body (Global Tiger Forum, Our World in Data/AfRSG, State Forestry Administration of China/WWF, IGCP, NOAA Fisheries/CIRVA, OFB/Préfecture Grand Est; see `specs/endangered-species/data-model.md`: the IUCN Red List source initially chosen was dropped after an observed anti-bot block and uncertainty about the approval of an API token for a visualization project), D3 SVG rendering in small multiples (one card per species, no geographic map), a single generic silhouette as an icon (paw print, minimal inline SVG) whose count per card interpolates (`d3-interpolate`) the population between two known censuses, rendering based solely on headcounts (no categorical dimension, an explicit decision by the user after dropping the IUCN threat category), autoplay in a loop from the oldest census to the most recent (`d3-timer`, same convention as `satellites-in-orbit`/`light-pollution`/`monument-layers`, three speeds, 2 s pause on the last year before looping), native year slider controllable manually or automatically, fixed-size species tiles (icon grid of 10 columns × 8 rows, sized for the actual observed maximum) over an illustrated background specific to each species (six original illustrations by the user, `public/data/endangered-species/<species-id>.jpg`, dark overlay for the legibility of the white text/icons), detail card on hover/tap giving the actual estimate and its trend, real cover (`public/covers/endangered-species.jpg`, same graphic style as the tile backgrounds).
- `earthquakes` (The Fault Lines), real USGS seismic catalog (`fdsnws/event`, 14,453 earthquakes of magnitude 6 and above since 1900, see `specs/earthquakes/data-model.md` for the filtering of nuclear tests excluded from the raw source catalog), tectonic plate boundaries from Bird's model (2003, `fraxen/tectonicplates` repository, ODC-BY license) drawn as a static overlay outside the land clip (also visible at sea), Canvas 2D rendering (`d3-geo` + `d3-zoom`, worldwide Natural Earth projection, basemap/rivers/relief copied from `bird-migrations` into this visualization's own data folder), each earthquake pulses at its actual date (radius and opacity increasing with magnitude, `d3.scaleSqrt`, blue sequential palette) in a continuous loop over one hundred twenty-seven years (`d3-timer`, 90-second cycle at normal speed, three speeds, no permanent point, unlike a volcano), seven historical earthquakes annotated at the time of their pulse (San Francisco 1906, Chile 1960, Alaska 1964, Tangshan 1976, Sumatra-Andaman 2004, Haiti 2010, Tōhoku 2011), detail card on hover/tap limited to the pulse window, native year slider controllable manually or automatically (added after the first implementation, same model as `monument-layers`/`satellites-in-orbit`), zoom in/zoom out/reset buttons at the top right (added at the same time, same model as `monument-layers`/`paris-trees`) in addition to free zoom/pan, real cover (`public/covers/earthquakes.jpg`).
- `monarch-migration` (The Monarch Migration), density of GBIF occurrences of the monarch butterfly (*Danaus plexippus*) aggregated on a regular 1° grid over North America (2,280 cells of which 1,270 are active, 395,170 observations kept, see `specs/monarch-migration/data-model.md`); method adapted during implementation: monthly facets from the public GBIF search API rather than the SQL Downloads API, since no GBIF account was available, with half-open cells so as not to double-count points lying exactly on a boundary (grid refined from 2° to 1° after a first version judged too coarse at the regional framing). Canvas 2D rendering (`d3-geo` + `d3-zoom`) over the `bird-migrations` world basemap (silhouette, relief and rivers copied as is, framed on North America), animated in a continuous loop over a simulated year (`d3-timer`, three speeds, pause button, same convention as `satellites-in-orbit`) with interpolation between months for a progressive wave, tooltip expressed as a percentage of each cell's annual peak, mouse and touch zoom/pan. Refocused on the monarch alone at the user's request: the first implementation, titled "The Great Migrations", also brought together whale and wildebeest trajectories (Movebank), removed from the code and data (see "Refocused scope" in `specs/monarch-migration/data-model.md`); real cover (`public/covers/monarch-migration.jpg`).
- `forest-fires` (Where France Has Burned), 50,946 real forest fires recorded by the BDIFF between 2006 and 2025 in metropolitan France (Ministry of Agriculture/IGN, see `specs/forest-fires/data-model.md` for the preprocessing and the measured exclusion statistics): complete CSV export retrieved in two chained requests (cap of 30,000 results per export on `bdiff.agriculture.gouv.fr/incendies/zip`), geocoded by commune (the BDIFF export carries no coordinates) via Etalab's Découpage administratif API. Canvas 2D rendering (`d3-geo` + `d3-zoom`, same France basemap as `biodiversity`, without hydrography/road enrichment), each fire a fixed orange point whose radius follows the square root of the burned area (`d3.scaleSqrt`, calibrated on the actual distribution of areas), year slider replacing the whole set of points at each step rather than accumulating them (same discrete convention as `light-pollution`, no continuous morphing like `monument-layers`), autoplay in a continuous loop (`d3-timer`, three speeds, 2 s pause on the last year before looping), native year slider controllable manually or automatically, mouse and touch zoom/pan doubled by zoom in/zoom out/reset buttons (maximum zoom 200, lower than `monument-layers`: at most a few thousand points displayed simultaneously per year rather than the total accumulation), detail card on hover/tap (commune, department, date, area in hectares, suspected cause) with a link to the official BDIFF record (clickable once the card is pinned), editorial angle (geographic shift from the Mediterranean rim to the rest of the country) confirmed empirically on the aggregated data rather than presumed at framing, real cover (`public/covers/forest-fires.jpg`).
- `volcanic-eruptions` (The Pulse of the Earth), 10,937 real Holocene volcanic eruptions across 1,214 volcanoes (Smithsonian Global Volcanism Program, Volcanoes of the World catalog v. 5.4.0, retrieved via its WFS web service rather than by scraping the main site, which blocks automated retrieval, see `specs/volcanic-eruptions/data-model.md` for the license check and the measured exclusion statistics), Canvas 2D rendering (`d3-geo` + `d3-zoom`, worldwide Natural Earth projection, basemap/rivers/relief copied from `bird-migrations`): each eruption pulses at its actual date (radius and opacity increasing with VEI, `d3.scaleSqrt`, an orange sequential palette specific to this visualization rather than the default blue reserved by `earthquakes`, see "Palette" in `specs/volcanic-eruptions/technical-specifications.md`) in a continuous loop over about ten thousand years (`d3-timer`, 120-second cycle at normal speed, three speeds), unlike `earthquakes` each volcano keeps a permanent marker point outside its pulse (including the catalog's 333 volcanoes with no dated eruption) and a detail card accessible at any time (name, country, number of recorded eruptions, most recent eruption, maximum VEI), 55 notable eruptions annotated at the time of their pulse (VEI ≥ 6 plus Vesuvius in AD 79), simulated year displayed with an av. J.-C./BC suffix (custom mechanism, beyond the reach of `Intl.DateTimeFormat`), native year slider and zoom in/zoom out/reset buttons (same models as `earthquakes`), real cover (`public/covers/volcanic-eruptions.jpg`).
- `medical-deserts` (Tomorrow's Medical Desert), real DREES APL indicator (localized potential accessibility) to general practitioners crossed with data.gouv.fr/IGN commune boundaries (34,728 communes of metropolitan France after the join, see `specs/medical-deserts/data-model.md` for the measured exclusion statistics): the largest polygon volume on the site to date, which made three technical choices diverge from the framing draft (see "Rendering" in `specs/medical-deserts/technical-specifications.md`): today/tomorrow switch by a CSS cross-fade between two pre-rendered canvases rather than a per-commune color interpolation, hover through an invisible index canvas ("color picking", reading a single pixel) rather than a point-in-polygon test, zoom/pan by CSS transform of the layer rather than a redraw at the projection. Join pitfall encountered and fixed: Paris/Lyon/Marseille are split by arrondissement in the APL source but form a single polygon in the basemap, which made them silently disappear from the map; fixed by mapping the arrondissement codes back to the parent commune code and aggregating by a mean weighted by the standardized population, the DREES methodology (see "Join" in `specs/medical-deserts/data-model.md`). Basemap simplified via `mapshaper` as a one-off CLI (13.2 MB → 9.0 MB, 2.3 MB compressed), streamed loading with a progress indicator. Blue sequential palette, domain set on the actual distribution rather than the raw maximum (a few very sparsely populated communes with a single practitioner would otherwise crush the gradient); three-level scale (documented deviation from the style guide's simple linear gradient) concentrating the contrast below the editorial threshold of 1.5, to bring out the most poorly served communes (see "Palette" in `specs/medical-deserts/technical-specifications.md`). Real cover (`public/covers/medical-deserts.jpg`).

**Prompt:**
```
Implement step 8 of the build plan (BUILD-PLAN.md): first real visualization.

Before writing any code, choose (or confirm with me if not already done) an open data dataset and
a visualization angle, then document specs/<viz-slug>/data-model.md,
specs/<viz-slug>/functional-specifications.md and specs/<viz-slug>/technical-specifications.md
(see "Structure of specs/" in CLAUDE.md): dataset schema, visualization screen
(goal, content, interactions, states, responsive), its own technical choices (rendering
library, interaction technique) beyond the common rules of technical-specifications.md.

Add the visualization to the content collection (src/content/visualizations/<viz-slug>.fr.md and
.en.md, see step 2), with its real frontmatter and its real cover, and implement its rendering
in the mount area of the generic template (step 4), following the specs specific to this
visualization.

Completion criterion: the visualization's tile is displayed on the home page in both languages, and
its page displays the real interactive rendering, not an empty placeholder.
```

## ✅ 9. Deployment

`.github/workflows/deploy.yml`, `public/CNAME`, GitHub Pages source set to "GitHub Actions". See "Hosting and deployment" in `technical-specifications.md`.

**Criterion:** the site is reachable at `dataviz.heubes.io` after a push to `main`.

**Status:** done (workflow and `CNAME` in place; requires manually setting the Pages source to "GitHub Actions" in the repository settings, which cannot be changed from the code).

**Prompt:**
```
Implement step 9 of the build plan (BUILD-PLAN.md): deployment.

Create .github/workflows/deploy.yml and public/CNAME, following "Hosting and deployment"
in technical-specifications.md. Tell me to manually set the repository's GitHub Pages source
to "GitHub Actions" (a repository setting, not changeable from the code).

Completion criterion: after a push to main, the site is reachable at https://dataviz.heubes.io
with the first real visualization from step 8.
```

## ✅ 10. Related visualizations

Section of tiles at the bottom of each visualization page, offering up to three other visualizations with the same theme. See "Related visualizations" in `functional-specifications.md` and "Visualization page" in `style-guide.md`.

**Criterion:** each visualization page displays, after the credit block, the visualizations sharing a theme with it, in the specified order; the section is absent on a visualization that is alone in its theme.

**Status:** done.

**Prompt:**
```
Implement step 10 of the build plan (BUILD-PLAN.md): related visualizations.

Create src/components/RelatedVisualizations.astro (selection at build time, reuses VizCard.astro)
and mount it in src/pages/[viz].astro and src/pages/fr/[viz].astro, following "Related
visualizations" in functional-specifications.md and "Visualization page" in style-guide.md.

Completion criterion: on each page, the related tiles follow the selection and ordering rule
in both languages; a visualization that is alone in its theme displays no section.
```

---

The three candidates initially specified (`specs/biodiversity/`, `specs/bird-migrations/`, `specs/flower-phenology/`) were the first three implemented (step 8, in the order `bird-migrations` → `flower-phenology` → `biodiversity`), followed by ten others (see the list above).

Each step is a natural commit point. Before committing, check that the whole of `specs/` remains consistent with what has just been implemented (see "Before each commit" in `CLAUDE.md`); if the implementation reveals that a spec must change, flag it before applying the update.

## ✅ 11. Prepared data download

Download links for the main data files, at the end of the source credit block, declared visualization by visualization (`downloads` attribute). See "Prepared data download" in `functional-specifications.md`, "Visualization" in `data-model.md` and "Visualization page" in `style-guide.md`.

**Criterion:** each visualization that declares `downloads` displays one link per file with its size, in both languages; a visualization without `downloads` displays nothing; a file that is declared but missing makes the build fail.

**Status:** done.

**Prompt:**
```
Implement step 11 of the build plan (BUILD-PLAN.md): prepared data
download.

Add the optional downloads attribute to the schema (src/content/config.ts), create
src/components/DataDownloads.astro and mount it at the end of the credit block in
src/pages/[viz].astro and src/pages/fr/[viz].astro, following "Prepared data
download" in functional-specifications.md and "Visualization page" in style-guide.md.
Declare the main files of each visualization whose licenses allow it.

Completion criterion: the links and sizes display correctly in both languages; deliberately
removing a declared file makes the build fail.
```

## ✅ 12. Shareable state in the URL

The URL of each visualization page continuously reflects the filters, the temporal position (when paused) and the framing of zoomable maps. Opening the link restores this state, including after a language change. See "Shareable state in the URL" in `functional-specifications.md`, "State in the URL" in `technical-specifications.md` and the section of the same name in each `specs/<viz-slug>/technical-specifications.md`.

**Criterion:** for each visualization, operating its controls updates the URL without creating a history entry. Reopening this URL in a new tab restores the same state, and an invalid value is ignored without error.

**Status:** done.

**Prompt:**
```
Implement step 12 of the build plan (BUILD-PLAN.md): shareable state in the URL.

Create src/scripts/url-state.ts (reading/writing parameters, common framing format),
carry the query string over in LanguageSelector.astro and add a <link rel="canonical"> in
BaseLayout.astro, following "State in the URL" in technical-specifications.md. Then wire up
each visualization (read on mount, write on visitor action) and document its
parameters in its own technical-specifications.md.

Completion criterion: for each visualization, the URL follows the interactions and reopening it
restores the state; invalid parameters are ignored without error.
```

## ✅ 13. "About" page

`/about/` and `/fr/about/` page (approach, data, sharing, making, license, author), accessible from a footer link. See `about-page.md` and "Footer" in `style-guide.md`.

**Criterion:** the page displays in both languages with the same text, the footer link leads to it from every page, and the language selector switches from one version to the other.

**Status:** done.

**Prompt:**
```
Implement step 13 of the build plan (BUILD-PLAN.md): "About" page.

Write src/content/about/about.fr.md and about.en.md from the sections of about-page.md,
describing only what is true of the site, then create src/pages/about.astro and
src/pages/fr/about.astro and add the link to the footer (see "Footer" in
style-guide.md).

Completion criterion: the page displays in both languages, the footer link leads to it
from every page, and the language selector switches from one version to the other.
```

## ✅ 14. Cross-file content validation

The rules in `data-model.md` that span several files (non-localized attributes identical between the two languages, `lang` consistent with the file name, reserved slug, component mounted for each visualization) make the build fail instead of being checked by hand. See "Data validation" in `technical-specifications.md`.

**Criterion:** each of these rules, deliberately broken, makes `npm run build` fail with a message naming the visualization and the field at fault; the real content passes.

**Status:** done.

**Prompt:**
```
Implement step 14 of the build plan (BUILD-PLAN.md): cross-file content
validation.

Create src/content/validation.ts (validateVisualizations) and call it from src/pages/[viz].astro
and src/pages/fr/[viz].astro, following "Data validation" in
technical-specifications.md and "Validation constraints and rules" in data-model.md.

Completion criterion: deliberately breaking each rule makes the build fail with a precise
message; the real content passes.
```

## ✅ 15. Reduced motion

With the `prefers-reduced-motion` system preference, animated visualizations open paused on their final state (or on a documented state when they have none) and transitions that move elements become immediate. See "Reduced motion" in `functional-specifications.md`, "Accessibility" in `technical-specifications.md` and the bullet of the same name in each relevant `specs/<viz-slug>/functional-specifications.md`.

**Criterion:** with the preference emulated, no visualization starts moving on its own, each one opens on the documented state without writing the URL, and Play restarts the animation; without the preference, nothing changes.

**Status:** done.

**Prompt:**
```
Implement step 15 of the build plan (BUILD-PLAN.md): reduced motion.

Create src/scripts/reduced-motion.ts (prefersReducedMotion) and wire each animated visualization
into the path already used to restore a temporal position from the URL, following
"Reduced motion" in functional-specifications.md. Make the d3 transitions that
move elements immediate. Document the opening state of each visualization in its
functional-specifications.md.

Completion criterion: with the preference emulated, no visualization moves on its own and each one
opens on the documented state; without the preference, nothing changes.
```

## ✅ 16. Self-hosted fonts and icons

The Ubuntu font (woff2, latin and latin-ext subsets) is served from `public/fonts/ubuntu/`, and the four Creative Commons icons in the footer are inline SVGs: neither Google Fonts nor Font Awesome on a CDN. See "Fonts" and "Dependencies" in `technical-specifications.md`, "Iconography" in `style-guide.md`.

**Criterion:** displaying any page triggers no request to another domain, and the rendering (font, footer icons) remains identical.

**Status:** done.

**Prompt:**
```
Implement step 16 of the build plan (BUILD-PLAN.md): self-hosted fonts and
icons.

Download the Ubuntu woff2 files once (300/400/500/700, latin and latin-ext subsets) along with
their license into public/fonts/ubuntu/, declare them as @font-face in global.css, replace the
Font Awesome icons in the footer with their inline SVG paths and remove the CDN links from
BaseLayout.astro, following "Fonts" in technical-specifications.md and "Iconography" in
style-guide.md.

Completion criterion: no request to another domain when displaying a page, rendering unchanged.
```

## ✅ 17. Type checking at build time

The `build` script chains `astro check && astro build`: a type error in a `.ts` or `.astro` file makes the build fail, and therefore the deployment, before anything is published. The French dictionary is checked against the English one (`satisfies typeof en`). See "Hosting and deployment", "Dependencies" and "Interface copy" in `technical-specifications.md`.

**Criterion:** a deliberate type error in a `.astro` file, or a key present in only one of the two dictionaries, makes `npm run build` fail; the real code passes.

**Status:** done.

**Prompt:**
```
Implement step 17 of the build plan (BUILD-PLAN.md): type checking at build time.

Add @astrojs/check as a development dependency, run astro check before astro build
in the build script of package.json, and declare the French dictionary satisfies typeof en,
following "Hosting and deployment" and "Interface copy" in technical-specifications.md.

Completion criterion: a deliberate type error (.astro file, missing i18n key) makes
npm run build fail; the real code passes.
```

## ✅ 18. Source link monitoring

Every week, a GitHub workflow checks the dataset URLs and fails if one is broken (404, 410, persistent 5xx other than 502, 503 and 504, domain not found). Responses that say nothing about whether the source exists (anti-bot, rate limiting, temporary unavailability, certificate, timeout) are listed without failing the run. See "Source monitoring" in `technical-specifications.md`.

**Criterion:** `npm run check-links` correctly classifies the real URLs (none broken, the undetermined ones identified); a deliberately broken URL makes the script exit with an error.

**Status:** done.

**Prompt:**
```
Implement step 18 of the build plan (BUILD-PLAN.md): source link
monitoring.

Create scripts/check-source-links.mjs (Node, no dependencies) and
.github/workflows/check-source-links.yml (weekly and on demand), following
"Source monitoring" in technical-specifications.md.

Completion criterion: the real URLs are correctly classified, and a deliberately broken URL
makes the script fail.
```

## ✅ 19. d3 module types

Type declarations for the `d3-*` modules and `topojson-client` (`@types/*`, development dependencies), so that `astro check` verifies d3 calls instead of leaving them as `any`, and removal of the 81 `as any` that bypassed this check on d3 calls. See "Dependencies" in `technical-specifications.md`.

**Criterion:** `astro check` no longer reports any missing type declaration, the rendering code no longer contains any `as any`, and the interactions (zoom, wheel, drag, transitions) behave as before.

**Status:** done.

**Prompt:**
```
Implement step 19 of the build plan (BUILD-PLAN.md): d3 module types.

Add as development dependencies the @types packages matching each d3 module
used and topojson-client, remove the `as any` from d3 calls by fixing the types instead
of working around them, and remove the comments about missing types that have become false, following "Dependencies" in
technical-specifications.md.

Completion criterion: astro check no longer reports any missing declaration and passes without error.
```

## ✅ 20. Upgrade to Astro 7

Version upgrade from Astro 5 to 7, which resolves the vulnerabilities reported by `npm audit` (Astro, `sharp`, `esbuild`). Collections configuration moved to `src/content.config.ts`, `z` imported from `astro/zod`, `compressHTML: true` to keep Astro 5's output, `public/` files located from the project root. See "Site generation" and "Dependencies" in `technical-specifications.md`.

**Criterion:** `npm audit` no longer reports any vulnerability, `npm run build` passes, the rendered text of each page is identical to Astro 5's (except for the catalog order, see below), and the visualizations behave as before.

**Status:** done. Only discrepancy found: Astro 7 lists collection entries in alphabetical order, whereas Astro 5 followed an arbitrary file order. The order of the catalog tiles therefore changed. Decision made afterwards: keep the alphabetical slug order, now enforced explicitly in the code and specified in `home-page.md`.

**Prompt:**
```
Implement step 20 of the build plan (BUILD-PLAN.md): upgrade to Astro 7.

Upgrade astro to 7.x, apply the breaking changes from the v6 and v7 migration guides
(location of the collections configuration, Zod import, compressHTML, paths to
public/), then compare the generated site with Astro 5's (text of each page, screenshots) and
replay the visualizations' interaction scenarios.

Completion criterion: npm audit with no vulnerability, build passing, identical rendering and behavior.
```

## ✅ 21. Data table view

Static summary table, computed at build time and collapsed below the visualization, for all fourteen visualizations: first a pilot of three (`flower-phenology`, `forest-fires`, `medical-deserts`) to settle the component and the style, then the other eleven. See "Data table view" in `functional-specifications.md` and `technical-specifications.md`, "Data table" in `style-guide.md`, and the "Table view" section of each of the three specs.

**Criterion:** each table displays in both languages, with values matching the data, readable without JavaScript, with no horizontal page overflow on mobile; the other visualizations do not display one.

**Status:** done. Each table was specified and validated ("Table view" section of its spec) before implementation.

**Prompt:**
```
Implement step 21 of the build plan (BUILD-PLAN.md): data table view.

Create src/scripts/data-table.ts and src/components/DataTable.astro, then a table.ts for
each visualization that has a "Table view" section in its spec, wired into both pages,
following "Data table view" (functional and technical spec), "Data table"
in style-guide.md and the "Table view" section of each visualization.

Completion criterion: each table displays in both languages with correct values,
without JavaScript and without page overflow on mobile.
```

## ✅ 22. schema.org structured data

Each visualization page describes in JSON-LD the visualization (`CreativeWork`, sources as `isBasedOn`) and, when it offers any, its downloadable files as a derived `Dataset`, eligible for Google Dataset Search. See "SEO" in `technical-specifications.md`.

**Criterion:** the 28 visualization pages carry a valid JSON-LD block; a `Dataset` appears in it only if the visualization offers downloads, with a description of 50 to 5,000 characters and file URLs that exist.

**Status:** done.

**Prompt:**
```
Implement step 22 of the build plan (BUILD-PLAN.md): schema.org structured data.

Create src/scripts/structured-data.ts and render its output in the <head> via a property of
BaseLayout.astro, from both visualization pages, following "SEO" in
technical-specifications.md.

Completion criterion: valid JSON-LD on each visualization page, Dataset present only with
downloads, compliant descriptions and URLs.
```

## ✅ 23. WebP covers

The covers move from `public/covers/` to `src/assets/covers/`, so that the build derives WebP versions in three widths for the catalog tiles, and a JPEG copy for the sharing image. See "Images" in `data-model.md` and "Performance" in `technical-specifications.md`.

**Criterion:** the tiles serve WebP images suited to their display size, the sharing image remains a JPEG, and the weight of the home page images drops markedly (measured: 3,559 KB → 658 KB on desktop, 204 KB on mobile).

**Status:** done.

**Prompt:**
```
Implement step 23 of the build plan (BUILD-PLAN.md): WebP covers.

Move the covers into src/assets/covers/, create src/scripts/covers.ts, render the tiles
with Astro's Image component (WebP, srcset and sizes matched to the grid) and derive the
sharing image as a JPEG, following "Images" in data-model.md and "Performance" in
technical-specifications.md.

Completion criterion: suitable WebP on the tiles, JPEG for sharing, home page weight measured.
```

## 24. Five new visualizations

Complete specs (`data-model.md`, `functional-specifications.md`, `technical-specifications.md`) for five new visualizations, to strengthen the Space and Climate themes, the least represented in the catalog. Each spec relies on an actual check of its source (access, fields, volume, license) and ends with a "Points to validate" section.

- `exoplanets` (The Discovered Worlds), `space` theme: 6,366 confirmed exoplanets (NASA Exoplanet Archive), mass × distance-to-star scatter that fills in year by year, timeline of discoveries by method.
- `meteorites` (What Falls from the Sky), `space` and `earth` themes: 45,716 meteorites (Meteoritical Society catalog, NASA copy frozen in 2013), world map of observed falls / finds, latitudinal profile and Antarctic inset.
- `sunspots` (The Sun's Heartbeat), `space` theme: monthly sunspot number since 1749 (WDC-SILSO), spiral with one turn per cycle.
- `brest-sea-level` (The Sea Is Rising in Brest), `climate` theme: annual mean level of the Brest tide gauge since 1807 (PSMSL), unrolled stone quay and three trend lines.
- `tropical-nights` (Tropical Nights), `climate` theme: nights at 20°C or more since 1950 in eight cities (Météo-France), stacked calendars in small multiples.

**Criterion:** each spec validated by the author, "Points to validate" decided, before implementation.

**Status:** specs written, awaiting validation; no implementation.

## ✅ 25. CC0 license

The presentation and code of the site move from CC BY-NC-SA 4.0 to CC0 1.0 Universal (public domain dedication), with a `LICENSE` file at the root of the repository. Footer notice with the `creative-commons` and `creative-commons-zero` icons, "About" page, `CreativeWork` license in the structured data and README updated. Datasets, the Ubuntu font and the Font Awesome icons keep their own licenses. See "Footer" and "Iconography" in `style-guide.md`, `about-page.md`.

**Criterion:** GitHub detects the CC0 1.0 license, the footer and the "About" page show CC0 1.0 in both languages, and no mention of CC BY-NC-SA remains outside the history of earlier steps.

**Status:** done.

**Prompt:**
```
Implement step 25 of the build plan (BUILD-PLAN.md): CC0 license.

Add the CC0 1.0 Universal text as LICENSE at the root, update the footer notice and icons
("Footer" and "Iconography" in style-guide.md), the "About" page (about-page.md), the site
license in src/scripts/structured-data.ts and the README, and reword the specs that relied
on the former non-commercial license.

Completion criterion: CC0 1.0 shown everywhere, third-party licenses unchanged.
```
