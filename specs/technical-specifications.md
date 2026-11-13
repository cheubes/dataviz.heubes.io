# Technical specifications

## Tech stack

### Site generation

- **Astro**, static output (`output: 'static'`), no server rendering.
- `compressHTML: true` in `astro.config.mjs`: Astro 7 switched by default to the `'jsx'` mode, which removes whitespace between inline elements ("À propos · Réalisée par…", download links separated by commas). The `true` value keeps Astro 5's behavior: the rendered text remained identical word for word during the version upgrade.
- The files of `public/` read at build time (covers, downloadable data) are located from the project root (`process.cwd()`), not from `import.meta.url`: the latter designates the location of the compiled file, which changes from one Vite version to another (broken during the upgrade to Astro 7).
- **Content collections** (`src/content.config.ts`, Zod schema) for the visualizations (see "File structure" below). The themes (see "Theme" in `data-model.md`) are a closed enum carried by this collection's schema, not a separate collection: they have no content or page of their own (see "Content and structure" in `home-page.md`).
- `.astro` components for the shared chrome (layout, header, footer, language selector, catalog tile). Each visualization adds its own components (see "Rules common to all visualizations").

### CSS / UI

- Native CSS with custom variables, no CSS framework (no Bootstrap, no Tailwind), no SASS/LESS.
- The design values (colors, typography, spacing) are defined in `style-guide.md`, not here.

### Fonts

- **Ubuntu**, weights 300 / 400 / 500 / 700 (see "Typography" in `style-guide.md`), hosted by the site itself: woff2 files in `public/fonts/ubuntu/`, accompanied by their license (`UFL.txt`, Ubuntu Font Licence 1.0), declared by `@font-face` rules at the top of `src/styles/global.css` (`font-display: swap`).
- Only the `latin` and `latin-ext` subsets are hosted, with the Unicode ranges (`unicode-range`) of Google Fonts, from which they were downloaded once: they cover French and the diacritics of proper nouns. The browser only downloads the weights and subsets that the page uses. A character outside these ranges falls back to the fallback font (`sans-serif`).
- Reason: no request to a third-party service when a page is displayed (neither Google Fonts, nor a CDN), which avoids transmitting visitors' IP addresses to a third party and removes two external connections on first display.

### JavaScript and visualizations

- Vanilla JS/TS for the shared chrome (language selector, detection and persistence of the preference, catalog theme filter).
- No JS framework imposed for the chrome (no React/Vue/Svelte by default).
- Each visualization freely chooses its rendering technique and its libraries (D3, Observable Plot, deck.gl, Three.js, Canvas 2D...), scoped to its own page via Astro islands (see "Rules common to all visualizations").

### What we don't use

- Own backend or API.
- Database.
- Cookies or tracking. The language preference is remembered via `localStorage` (see "Multilingual" in `functional-specifications.md`), no data sent to a server.
- Analytics for now (to be reassessed if a need for audience measurement arises, with a privacy-respecting tool rather than Google Analytics, to be discussed before adding).

---

## Hosting and deployment

- **Host:** GitHub Pages
- **Repository:** `https://github.com/cheubes/dataviz.heubes.io`
- **Domain:** `dataviz.heubes.io` (`public/CNAME` file)
- **Deployment:** GitHub Actions (`.github/workflows/deploy.yml`), triggered on push to `main`: Astro build then publication via `actions/deploy-pages`. GitHub Pages does not build Astro natively: the repository's Pages source must be set to "GitHub Actions", not to a branch.
- **Generator:** Astro, static output in `dist/`. The `build` script of `package.json` chains `astro check && astro build`: type checking (`.ts` and `.astro` files) always precedes generation, locally as well as on deployment, and a type error makes the build fail before any publication. Since `withastro/action` runs this same `build` script, the workflow has no checking step of its own.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

`withastro/action@v6` installs the dependencies, builds and already publishes the Pages artifact internally (`actions/upload-pages-artifact`): adding that step a second time causes a conflict ("an artifact with this name already exists on the workflow run"). The major versions above are those that run on Node.js 24 (avoids the Node.js 20 deprecation warning on GitHub Actions runners); to be readjusted if new major versions come out in the meantime.

---

## Dependencies (pinned versions)

Indicative, to be reconfirmed at implementation time:

- `astro` (7.x, which requires Node.js 22.12 or newer; the deployment workflow runs on Node 24, the default value of `withastro/action@v6`)
- `@astrojs/sitemap` (see "SEO")
- `typescript` and `@astrojs/check` (development dependencies: type checking by `astro check`, not a UI framework, see "Hosting and deployment")
  - The `d3-*` and `topojson-client` modules do not ship their type declarations: they come from the `@types/d3-*` packages (one per d3 module used) and `@types/topojson-client`, as development dependencies. Any new d3 dependency adds its corresponding `@types` package.
  - No `as any` in d3 calls: zoom calls are written `zoomBehavior.scaleBy(select(...), k)` rather than `select(...).call(zoomBehavior.scaleBy, k)`, whose overloads cannot be typed without a cast; constant geometries passed to `fitExtent`/`path` are typed `Polygon` (`geojson`) rather than declared `as const`, whose read-only arrays are rejected; arc generators with constant accessors are typed `d3Arc<null>()` and called with `null`.
  - Known limitation: the TopoJSON basemaps loaded at runtime remain annotated `any` (`basemapTopology: any`, `fetchJson<any>`), so the geometries extracted from them partly escape checking. Typing them (`Topology` from `topojson-specification`) will be done as each visualization is modified.
- No CSS dependency or icon library: the four Creative Commons icons of the footer are inline SVGs (see "Iconography" in `style-guide.md`).
- No chrome JS dependency beyond vanilla.
- Visualization-specific dependencies: added and documented case by case, discussed before adding (see "Rules common to all visualizations" and the project's global security rules).

---

## File structure

```
/
├── astro.config.mjs
├── package.json
├── scripts/
│   └── check-source-links.mjs         # weekly check of source URLs, see "Source monitoring"
├── public/
│   ├── CNAME
│   ├── logo.png                       # favicon and header logo, see style-guide.md
│   ├── cover-placeholder.svg          # fallback cover, see "Images" in style-guide.md
│   ├── fonts/
│   │   └── ubuntu/                    # self-hosted woff2 and UFL.txt license, see "Fonts"
│   └── data/
│       └── <viz-slug>/
│           └── ...                    # static data consumed by the visualization,
│                                       # see specs/<viz-slug>/data-model.md
├── src/
│   ├── assets/
│   │   └── covers/
│   │       └── <viz-slug>.jpg         # or .png, source of the covers, see data-model.md and "Performance"
│   ├── content.config.ts              # content collections schemas
│   ├── content/
│   │   ├── validation.ts              # cross-file validation rules, see "Data validation"
│   │   ├── about/
│   │   │   ├── about.fr.md            # text of the "About" page, outside the collection, see about-page.md
│   │   │   └── about.en.md
│   │   └── visualizations/
│   │       ├── <viz-slug>.fr.md
│   │       └── <viz-slug>.en.md
│   ├── i18n/
│   │   ├── fr.ts                      # interface copy (labels, unavailability message, theme labels)
│   │   └── en.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── scripts/
│   │   ├── language.ts                # language detection/persistence (Header.astro, LanguageSelector.astro)
│   │   ├── theme-filter.ts            # catalog theme filter (ThemeFilter.astro, VizCard.astro)
│   │   ├── url-state.ts               # shareable state in the URL, see "State in the URL"
│   │   ├── data-table.ts              # common type of the table views, see "Data table view"
│   │   ├── reduced-motion.ts          # reduced motion preference, see "Accessibility"
│   │   ├── structured-data.ts         # schema.org structured data, see "SEO"
│   │   ├── covers.ts                  # WebP covers and sharing image, see "Performance"
│   │   └── viz-stage-height.ts        # mount area height, see "Rules common to all visualizations"
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LanguageSelector.astro
│   │   ├── ThemeFilter.astro          # theme filter chips, see home-page.md
│   │   ├── VizCard.astro              # catalog tile
│   │   ├── RelatedVisualizations.astro # related visualizations (reuses VizCard.astro), see functional-specifications.md
│   │   ├── DataDownloads.astro        # prepared data download, see functional-specifications.md
│   │   ├── DataTable.astro            # data table view, see "Data table view"
│   │   └── visualizations/
│   │       └── <viz-slug>/
│   │           └── ...                # components specific to this visualization
│   ├── pages/
│   │   ├── index.astro                # EN home page
│   │   ├── 404.astro                  # localized unavailability message
│   │   ├── about.astro                # EN "About" page, see about-page.md
│   │   ├── [viz].astro                # EN visualization page
│   │   └── fr/
│   │       ├── index.astro            # FR home page
│   │       ├── about.astro            # FR "About" page
│   │       └── [viz].astro            # FR visualization page
│   └── styles/
│       └── global.css                 # CSS variables (see style-guide.md)
└── specs/
    ├── ...
    └── <viz-slug>/
        ├── data-model.md
        ├── functional-specifications.md
        └── technical-specifications.md
```

### Content collections schema (indicative)

```ts
// src/content.config.ts: to be adjusted during implementation
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const THEMES = ['living', 'climate', 'earth', 'territory', 'space'] as const; // see "Theme" in data-model.md

const visualizations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/visualizations' }), // custom generateId, see below
  schema: z.object({
    lang: z.enum(['fr', 'en']),
    title: z.string(),
    summary: z.string(),
    datasets: z.array(z.object({
      name: z.string(),
      publisher: z.string(),
      url: z.url(),
      license: z.string().optional(),
      retrieved: z.string().optional(),
    })),
    themes: z.array(z.enum(THEMES)).min(1),
    'publication-date': z.string(),
    downloads: z.array(z.string()).optional(), // file names of public/data/<viz-slug>/
  }),
});

export const collections = { visualizations };
```

The exact mapping between the file name (`<viz-slug>.<lang>.md`) and the `slug`/`lang` exposed by the collection (extraction, `getStaticPaths`) is an implementation detail confirmed at step 3 of the build plan (see `BUILD-PLAN.md`): the default `generateId` of the `glob` loader concatenates the base name and the language suffix without a separator (e.g. `test-viz.fr.md` → `test-vizfr`), unsuitable for extracting the `slug`. The `visualizations` collection therefore declares a custom `generateId` that only removes the `.md` extension (e.g. `test-viz.fr.md` → id `test-viz.fr`), and a `getVisualizationSlug` function (exported from `src/content.config.ts`) removes the `.<lang>` suffix from this id to obtain the `slug` used in the URLs.

---

## Architecture (rendering, routing)

### Rendering

The site is entirely static, generated at build time by Astro. No dynamic server-side rendering, no own API.

### URL structure

- `/`: site home page (English, default language)
- `/fr/`: site home page (French)
- `/<viz-slug>/`: a visualization's page (EN)
- `/fr/<viz-slug>/`: a visualization's page (FR)
- `/about/`, `/fr/about/`: "About" page (see `about-page.md`). The `about` slug is therefore reserved: no visualization can take it (see "Validation constraints and rules" in `data-model.md`).

English, the default language, has no prefix; French is prefixed with `/fr/`.

### Content collections and page generation

- `[viz].astro` and `fr/[viz].astro` each generate their paths via `getStaticPaths`, from the entries of the `visualizations` collection filtered by `lang`.
- A visualization not translated into a language simply has no collection entry for that language, hence no page generated at that URL: visiting that URL lands on `404.astro`.
- The related visualizations (see "Related visualizations" in `functional-specifications.md`) are selected at build time by `src/components/RelatedVisualizations.astro`, from the collection entries filtered by the page's language: static HTML, without client JS.
- The prepared data download links (see "Prepared data download" in `functional-specifications.md`) are generated at build time by `src/components/DataDownloads.astro` from the `downloads` attribute. The size of each file is read from disk (`public/data/<viz-slug>/`) and formatted according to the page's language (`Intl.NumberFormat`, decimal units kB/MB). A declared but missing file makes the build fail. The links carry the `download` attribute to force saving rather than displaying the JSON in the tab.

### Untranslated content ("unavailability message")

`src/pages/404.astro` detects the language from the prefix of the requested URL (`/fr/...` or not) to display the unavailability message in the right language (see "Multilingual" in `functional-specifications.md`), rather than GitHub Pages' generic 404 page.

### Interface copy

The interface copy (labels, messages including the unavailability message) is centralized in `src/i18n/fr.ts` and `src/i18n/en.ts`. It is distinct from the visualizations' content, which follows the format documented in `data-model.md`. The French dictionary is declared `satisfies typeof en`: a key present on only one side makes type checking fail, hence the build, instead of displaying `undefined`.

### Language detection and persistence

On the first visit to a URL without a language prefix (English by default), the language is determined client-side by the browser's language (fallback to English if neither French nor English). A URL already prefixed with `/fr/` is never reevaluated by this detection: the URL's explicit prefix is a stronger signal than the browser's language and takes precedence as long as no preference has been remembered. A preference remembered in `localStorage` after a manual change via the selector (see "Multilingual" in `functional-specifications.md`), on the other hand, takes precedence over the visited URL, prefixed or not. This logic runs on every page (shared chrome, `src/components/LanguageSelector.astro`) and redirects, if needed, to the equivalent of the current page in the determined or remembered language; if that equivalent does not exist, the redirect lands on `404.astro` (see "Untranslated content" above).

---

## Rules common to all visualizations

- Each visualization lives in its own Astro component (and, if needed, subcomponents) under `src/components/visualizations/<viz-slug>/`, mounted on the generic visualization page (see "URL structure"). Nothing common is imposed beyond this mounting: the rendering technique (SVG, Canvas, WebGL, DOM), the library or libraries used, and the internal organization of the component are specific to each visualization and documented in its own `technical-specifications.md`.
- Any JS library specific to a visualization is an npm dependency scoped to that visualization: added to `package.json`, loaded only on that visualization's page (Astro island, hydration directive `client:load` / `client:visible` / `client:idle` as needed, to be documented in the visualization's `technical-specifications.md`), never globally. Any new dependency remains subject to discussion before adding.
- The data consumed by a visualization is retrieved and frozen at build time (JSON/CSV file committed under `public/data/<viz-slug>/`, see "File structure" above, generated by a preprocessing script specific to the visualization), unless an explicit need is documented and justified in the visualization's `technical-specifications.md`: consistent with an entirely static site, without dependence on the availability of a third-party API in production.
- The general dataviz palette (see `style-guide.md`) applies by default; a visualization that needs a different palette (e.g. a sequential hue specific to its subject) documents and validates it (dataviz skill script) in its own `technical-specifications.md` rather than improvising colors.
- Common states expected on each visualization's page, unless a documented reason says otherwise: loading (while the data and the visualization initialize), error (data loading failure), empty (filtered or empty dataset depending on the context). The precise visual treatment of each state is specific to the visualization.
- A visualization whose main interaction mode is not natively accessible by keyboard or screen reader (e.g. a Canvas or WebGL rendering) documents it as a known limitation in its own `technical-specifications.md`, rather than passing over it in silence.
- The responsive behavior of a visualization (adaptation or unavailability message on small screens) is specific to each and documented in its `functional-specifications.md`.
- **Default mount area height:** `max(320px, min(width × 0.6, cap))`, recomputed when the window is resized. The cap is the space available between the header and the footer (`window.innerHeight − actual header height − actual footer height`, measured at runtime via `getBoundingClientRect()` rather than via the CSS variables `--dv-header-height`/`--dv-footer-height` of `style-guide.md`, which are indicative and not guaranteed, see "Header" and "Footer" in `style-guide.md`), minus the height already taken by the visualization's controls (legend, filters, playback): the entire mount area (controls included), not only the map or chart, fits in this space. **The 320px floor takes priority over this cap**: on a very short screen (short window, mobile in landscape), a visualization with many controls can therefore slightly exceed the available space rather than become unreadable below 320px. A visualization whose geometry requires it (e.g. a circular rendering that needs a 1:1 ratio) documents and justifies its departure from the height computation (`width × 0.6`) in its own `technical-specifications.md`, but remains subject to the same cap.
- A visualization's controls (filters, legend) always remain visible on screen: no display toggle (e.g. a collapsible `<details>`/`<summary>`) allowing part of them to be hidden, including on small screens.

---

## State in the URL

Common mechanism of the shareable state (see "Shareable state in the URL" in `functional-specifications.md`).

- **Medium:** query string (`?year=1964&zoom=3.2,142.3700,38.3200`). Parameter names in English, short, in kebab-case. Lists are comma-separated identifiers, identical to the data identifiers (e.g. `regions=us,china`). These identifiers are never translated labels, so that the URL remains the same in both languages.
- **Common module:** `src/scripts/url-state.ts`.
  - `getUrlParam(name)`: reads a parameter.
  - `setUrlParams({ name: value | null })`: updates the URL via `history.replaceState`. It merges with the existing parameters, removes those whose value is `null` and keeps the fragment.
  - `readZoomParam(projection, width, height, scaleExtent)` / `writeZoomParam(transform, projection, width, height)`: the framing format below, common to zoomable maps.

  Each visualization remains the owner of its parameters: reading, validating and applying them happens in its own `render.ts`, in accordance with "Rules common to all visualizations" above.
- **Writing:**
  - only in response to a visitor action, never from the animation loop;
  - for sliders, on `change` (release) rather than on `input`;
  - for zoom, on the `end` event of `d3-zoom`, at the end of the gesture;
  - for a text search, after a debounce.

  Reason: browsers limit the frequency of `history.replaceState` (Safari: about a hundred calls per 30-second window, beyond which it throws an exception).
- **Reading:** once, on mount, after the data has loaded and the first sizing, before the first frame. Each parameter is validated separately (known identifier, finite number, bound respected); an invalid parameter is ignored. Applying the initial state does not rewrite the URL.
- **Framing of zoomable maps:** `zoom=<k>,<lon>,<lat>`.
  - `k`: the `d3-zoom` scale factor, with two decimals.
  - `lon`, `lat`: the geographic coordinates (four decimals) of the center of the visible area, i.e. `projection.invert(transform.invert([width / 2, height / 2]))`.

  Geographic coordinates rather than pixels, so that the link frames the same area whatever the size or ratio of the recipient's screen. On reading, `k` is clamped to the map's `scaleExtent`, the point is reprojected, and the transform `translate(width / 2 − k·x, height / 2 − k·y).scale(k)` is applied via `zoomBehavior.transform`, which also clamps the translation to the `translateExtent`. Parameter absent when `k = 1` (overview).
- **Language change:** `src/components/LanguageSelector.astro` carries over the current query string and fragment, both in the automatic redirect and in the selector's links (read at click time, since the URL changes during the visit).
- **SEO:** a `<link rel="canonical">` without query string, in `BaseLayout.astro`, brings all shared variants back to the page's URL (see "SEO" below).

## Data table view

Common mechanism of the table view (see "Data table view" in `functional-specifications.md`).

- **Computed at build time:** each visualization that offers a table has a `src/components/visualizations/<viz-slug>/table.ts` module. It reads its files of `public/data/<viz-slug>/` from the project root (see "Site generation") and returns a neutral description of the table (`DataTable` type from `src/scripts/data-table.ts`): caption, columns (label, alignment), rows, optional total row. The values there are already formatted according to the language (`Intl.NumberFormat`, `Intl.DateTimeFormat`). The same module provides three common tools: `readDataFile` (reading a file of `public/data/`), `formatOrdinal` ("1er", "2e" / "1st", "2nd") and `formatDate`, which adds the "1er" of the first day of the month that `Intl` does not produce in French.
- **Rendering:** a common component, `src/components/DataTable.astro`, displays this description in a collapsed `<details>`, below the mount area and before the source credit block. The HTML is entirely static: no island, no client JavaScript.
- **Accessibility:** `<table>` with `<caption>`, column headers as `<th scope="col">`, first cell of each row as `<th scope="row">`, total row in a `<tfoot>`. Empty cells carry an explicit label ("n.d." / "n/a"), not a dash.
- **Copy:** column labels, caption and units in the i18n dictionary, under the visualization's key (see "Interface copy").

---

## Data validation

- Structure validation (presence and type of the fields) is native to Astro's content collections via the Zod schema (`src/content.config.ts`): `astro build` fails if a content file does not respect the schema, without a dedicated script.
- The rules that span several files, beyond the reach of a per-file schema (see "Validation constraints and rules" in `data-model.md`), are checked at build time by `validateVisualizations` (`src/content/validation.ts`):
  - equality of the non-localized attributes between `<viz-slug>.fr.md` and `<viz-slug>.en.md`, regardless of key order;
  - match between `lang` and the file name suffix;
  - reserved `about` slug;
  - presence of a mounted visualization component for each visualization of the page's language.

  It is called by `[viz].astro` and `fr/[viz].astro`, in the page body rather than in `getStaticPaths`, which runs in an isolated scope and does not see the component table. It gathers all errors into a single message and makes `astro build` fail, hence also the deployment: no separate script to remember to run, nor added dependency.
- The presence of the cover image is not checked: falling back to the placeholder is intended as long as the cover does not exist (see "Images" in `style-guide.md`).

---

## Source monitoring

The dataset URLs (`url` attribute of each `datasets` entry, see "Source dataset" in `data-model.md`) point to third-party sites that change without notice. They are checked every week, outside the build: a network check in the build would make it dependent on the availability of third-party sites.

- **Script:** `scripts/check-source-links.mjs` (Node, without dependencies), run locally by `npm run check-links`. It reads the URLs in the frontmatter of the content files, deduplicates them and queries them with GET, following redirects, with a 60 s timeout and a retry after a 5xx response, a timeout or an interrupted connection.
- **Three verdicts:**
  - **OK**: response below 400.
  - **Broken**: 404, 410, persistent 5xx error other than 502, 503 and 504, domain not found or connection refused.
  - **Unverified**: any other response (401, 403, 429, 502, 503, 504…), certificate error, timeout. These responses say nothing about the existence of the source: 502, 503 and 504 indicate a temporarily unavailable server or gateway, and the retry after 5 s is not enough to cover an outage of a few minutes or a maintenance (measured in October 2026: a 503 from NOAA, twice in a row, made the run fail while the source responded normally the following week). Measured at setup: GBIF and the Smithsonian block bots behind Cloudflare (403), the BDIFF serves an incomplete certificate chain that Node rejects and that browsers complete, NOAA regularly exceeds the timeout. All of them respond normally in a browser.
- **Workflow:** `.github/workflows/check-source-links.yml`, every Monday at 6:00 UTC and on demand (`workflow_dispatch`), with no permission other than reading the repository. It fails only if it finds a broken link: GitHub then sends its usual failure email. The details of the broken and unverified links, per visualization, appear in the run summary. A link that remains unverified for several weeks should be checked by hand.
- **Known limitation:** GitHub disables the scheduled workflows of a repository that has had no activity for 60 days. They must then be re-enabled in the Actions tab.

---

## Performance

- Catalog covers derived at build time by Astro's image service (`sharp`, a dependency of Astro), via `src/scripts/covers.ts`: WebP in three widths (400, 800 and 1200 px) with a `srcset` and a `sizes` matched to the catalog grid, so that the browser downloads the smallest sufficient version; native lazy loading (`loading="lazy"`). WebP only, without JPEG fallback: all target browsers read it (see "Accessibility"). Measured at setup, on the home page with all tiles loaded: 3,559 KB in JPEG versus 658 KB in WebP on desktop and 204 KB on mobile.
- Sharing image (Open Graph, `image` structured data): a full-size JPEG copy derived from the same source file, social networks expecting this format. Its URL is a hashed name under `/_astro/`, which changes if the cover changes.
- Each Astro island (visualization) hydrates its own JS, without loading the JS of another visualization or of the catalog.
- Non-blocking hydration directives preferred (`client:idle` / `client:visible`) over `client:load` when the interaction is not immediately necessary.
- Cover source file prepared when content is added (progressive JPEG quality ~82, or recompressed PNG for screenshots/illustrations), dimensions as close as possible to the minimums recommended in `style-guide.md`: it serves as the base for all derived images.

## Accessibility

- **Target browsers:** latest stable versions of Chrome, Firefox, Safari, Edge.
- WCAG AA contrast for the chrome text (4.5:1 body, 3:1 large text/UI), on the ink/surface roles of `style-guide.md`.
- Semantic HTML for the structure of the pages and the catalog.
- Alternative text on the cover images.
- Default known limitation: each visualization's own interaction mode is not guaranteed to be natively accessible; see "Rules common to all visualizations" above. A visualization that offers a table view (see "Data table view" above) makes it its fallback: the table gives access to the same information by keyboard and screen reader.
- **Reduced motion** (see "Reduced motion" in `functional-specifications.md`): `prefersReducedMotion()` (`src/scripts/reduced-motion.ts`) reads `matchMedia('(prefers-reduced-motion: reduce)')` once, when each visualization mounts. An animated visualization that sees it enabled opens paused on its final state via the same path as a temporal position restored from the URL (see "State in the URL" above), without writing the URL; d3 transitions that move elements take a zero duration. The site's CSS transitions only affect color or opacity: no global `@media (prefers-reduced-motion)` rule is necessary.

## SEO

- Static rendering: each page exists independently at crawl time, without depending on JavaScript for its main content (with the exception of the interactive visualization itself).
- Each visualization has its own indexable URL (see "URL structure").
- `hreflang` / alternate links between the FR and EN versions of the same page, in `BaseLayout.astro`.
- `<link rel="canonical">` to the page's URL without query string, in `BaseLayout.astro`: shared links carrying state (see "State in the URL" above) remain variants of a single indexed page.
- Meta and Open Graph tags (title, description = `summary`, image = cover) generated directly in `BaseLayout.astro`, no dedicated plugin needed (unlike `jekyll-seo-tag`).
- `@astrojs/sitemap` for an automatically generated `sitemap.xml`.
- **schema.org structured data** (JSON-LD), in the `<head>` of each visualization page, built at build time by `src/scripts/structured-data.ts` from the frontmatter:
  - the visualization, as a `CreativeWork`: title, summary, publication date, author, cover, themes, site license (CC BY-NC-SA 4.0), and its cited sources as `isBasedOn` (each as a `Dataset` with publisher, URL and license);
  - when the visualization declares downloadable files (see "Prepared data download" in `functional-specifications.md`), these files as a derived `Dataset`: the summary as description (between 50 and 5,000 characters, as required by Google Dataset Search), one `DataDownload` per file, the same sources as `isBasedOn`, and as license the list of these sources' licenses, since the files remain subject to each of them (same rule as the notice displayed below the download links).

  Rendered by `BaseLayout.astro` (`structuredData` property) in a `<script type="application/ld+json">`, with `<` escaped so that no content text can close the tag.

---

## Naming conventions

| Element | Convention | Example |
|---|---|---|
| Slugs (visualization, theme) | English kebab-case | `air-pollution`, `living` |
| Astro components | PascalCase | `VizCard.astro`, `LanguageSelector.astro` |
| Content / data files | kebab-case | `air-pollution.fr.md` |
| Custom CSS classes | `.dv-` + kebab-case | `.dv-card`, `.dv-header` |
| JS/TS variables | camelCase | `loadDataset()` |
| JS/TS constants | UPPER_SNAKE_CASE | `DEFAULT_LANG` |

## CSS: conventions

- `.dv-` prefix for all custom classes.
- Custom CSS variables for design values, defined in `style-guide.md`.
- No SASS, no LESS.

## JavaScript: conventions

- Vanilla JS/TS ES6+.
- Naming: variables and functions in `camelCase`, constants in `UPPER_SNAKE_CASE`, files in kebab-case (except Astro components, see above).
