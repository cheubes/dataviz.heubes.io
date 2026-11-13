# Data model

## Entities

### Visualization

A visualization is an interactive piece dedicated to an open data dataset. It corresponds to a dedicated URL of the site (`/<viz-slug>/`).

| Attribute | Localized | Description |
|---|---|---|
| `slug` | No | Unique identifier, built from the English title, used in the URL and as the name of the `specs/<viz-slug>/` folder (e.g. `air-pollution`) |
| `lang` | No | Language of this document (`fr` or `en`); used to associate the two documents of the same visualization |
| `title` | Yes | Displayed title |
| `summary` | Yes | Short text displayed on the catalog tile (see "Tiles (catalog)" in `style-guide.md`) and at the top of the visualization's page |
| `datasets` | — | List of open data datasets used (see "Source dataset" below) |
| `themes` | No | One or more theme identifiers, used for filtering the catalog and selecting related visualizations (see "Theme" below, "Content and structure" in `home-page.md` and "Related visualizations" in `functional-specifications.md`) |
| `publication-date` | No | Date of the visualization's first publication, used to order related visualizations (see "Related visualizations" in `functional-specifications.md`) |
| `downloads` | No | Optional. Names of the files of `public/data/<viz-slug>/` offered for download on the visualization's page (e.g. `[trees.json, national-gardens.json]`). Absent: no download link (see "Prepared data download" in `functional-specifications.md`) |

The cover image is not an attribute: it is associated with the visualization by naming convention (see "Images" below).

### Theme

Thematic category associated with a visualization, used for filtering the catalog (see "Content and structure" in `home-page.md`) and for selecting related visualizations on a visualization's page (see "Related visualizations" in `functional-specifications.md`). Closed list, no free vocabulary: any new value is added here before being used in a visualization's frontmatter.

| `id` | French | English |
|---|---|---|
| `living` | Vivant | Life |
| `climate` | Climat | Climate |
| `earth` | Terre | Earth |
| `territory` | Territoire et société | Territory & society |
| `space` | Espace | Space |

A visualization associates one or more of these identifiers via its `themes` attribute (see "Visualization" above). The displayed label is carried by the i18n dictionary (`i18n/fr.ts`, `i18n/en.ts`, see "Interface copy" in `technical-specifications.md`), not by the frontmatter: only the identifiers appear there.

### Source dataset

An open data dataset used by a visualization. A visualization can combine several.

| Attribute | Localized | Description |
|---|---|---|
| `name` | No | Displayed name of the dataset |
| `publisher` | No | Producing organization (e.g. INSEE, data.gouv.fr, Eurostat) |
| `url` | No | URL of the dataset's source page, checked every week (see "Source monitoring" in `technical-specifications.md`) |
| `license` | No | License of the dataset as published by the source (e.g. Licence Ouverte 2.0, ODbL) |
| `retrieved` | No | Date on which the dataset was retrieved: open data evolves, this date documents the version actually used |

The detailed schema of the data actually consumed by a visualization (columns, format, applied transformations) is not carried here: it is specific to each visualization and documented in `specs/<viz-slug>/data-model.md`.

## Data file formats and conventions

### General conventions

- Attribute names (frontmatter keys and data file keys) are in English, in kebab-case.
- A visualization's slug is built from the entity's English title: lowercase ASCII, without accents or spaces, words separated by hyphens (e.g. `air-pollution`, not `Air_Pollution` nor `air pollution`).
- The site is multilingual (French and English). A visualization's `slug` is shared between languages: only its translation varies, not its URL.

### Images

- Cover image of a visualization: `src/assets/covers/<viz-slug>.jpg` or `.png` depending on its nature (photo or illustration/screenshot, see "Images" in `style-guide.md`). It lives in `src/` and not in `public/`: it is the source file from which the build derives the images actually served (see "Performance" in `technical-specifications.md`).
- A single cover file per visualization, shared by both languages (no per-locale variant).

Recommended format, dimensions and ratio: see "Images" in `style-guide.md`.

### File organization

The site is generated with Astro, in content collections (see "File structure" in `technical-specifications.md` for the configuration and exact schema). Each visualization has its presentation attributes (localized and non-localized) carried by two content files, one per language; the data that feeds the visualization itself lives separately, specific to each visualization and documented in `specs/<viz-slug>/data-model.md`.

- `src/content/visualizations/<viz-slug>.fr.md`, `<viz-slug>.en.md`: presentation of the visualization, one file per language. Frontmatter: `lang`, `title`, `summary`, `datasets`, `themes`, `publication-date`, `downloads` (optional). Body text: long presentation (context of the dataset, chosen angle).
- `src/assets/covers/<viz-slug>.jpg` / `.png`: cover image (see "Images" above).

The non-localized attributes (`datasets`, `themes`, `publication-date`, `downloads`) are repeated identically in the frontmatter of both language files rather than centralized separately: the number of fields concerned remains small, so the duplication remains limited.

### Workflow for adding a visualization

1. Choose the visualization's `slug` (built from its English title) and create `specs/<viz-slug>/` with its three files (see `CLAUDE.md` for the expected content of each).
2. Create `src/content/visualizations/<viz-slug>.fr.md` and `<viz-slug>.en.md`, with their complete frontmatter.
3. Add the cover image (`src/assets/covers/<viz-slug>.jpg` or `.png`).
4. Implement the visualization itself according to `specs/<viz-slug>/functional-specifications.md`, `data-model.md` and `technical-specifications.md`.
5. Where applicable, declare the main data files in `downloads`, after checking the licenses of the sources (see "Prepared data download" in `functional-specifications.md`).
6. Validate by running `npm run build`, which fails on any rule not respected (see "Validation constraints and rules" below and "Data validation" in `technical-specifications.md`).
7. Publish.

## Validation constraints and rules

All these rules are checked at build time, except those that the file names guarantee by themselves (identical slug between the two translations, slug uniqueness): the Zod schema covers each file in isolation, and `validateVisualizations` the cross-file rules (see "Data validation" in `technical-specifications.md`).

- A visualization's `slug` is identical for its two translations.
- A visualization `slug` is globally unique, and cannot be `about`, reserved for the "About" page (see "URL structure" in `technical-specifications.md`).
- The `lang` attribute of a visualization file must match the language suffix of its file name (`.fr.md` → `fr`, `.en.md` → `en`).
- For a given language, `<viz-slug>.<lang>.md` exists only if the visualization is available in that language; its absence removes the visualization from that language's catalog (see "Multilingual" in `functional-specifications.md`).
- Each `datasets` entry of a visualization declares at least `name`, `publisher` and `url`.
- A visualization declares at least one theme, chosen from the closed list defined in "Theme" above.
- Each `downloads` entry corresponds to an existing file of `public/data/<viz-slug>/`: the build fails otherwise.
- The values of the non-localized attributes (`datasets`, `themes`, `publication-date`, `downloads`) are identical between `<viz-slug>.fr.md` and `<viz-slug>.en.md` of the same visualization.
