# General functional specifications

## Context and goals

The site presents a catalog of interactive, original data visualizations, each exploring an open data dataset with a presentation of its own: there is no generic template replayed dataset after dataset, each visualization is a piece in its own right.

The goal is to give a curious visitor an entry point to this catalog, then let them explore each visualization interactively: understand the dataset that feeds it and manipulate the representation chosen for it.

## Project scope

In scope:

- Browsing the catalog of visualizations, from the home page.
- Filtering the catalog by theme, from the home page (see `home-page.md`).
- Viewing, for each visualization, its dedicated page: presentation of the source dataset, of the context of the chosen presentation, and interaction with the visualization itself.
- Access, from a visualization's page, to the other visualizations that share a theme with it (see "Related visualizations" below).
- Downloading, from a visualization's page, the prepared data it consumes, when the author declares it downloadable (see "Prepared data download" below).
- "About" page: approach, data, making and license of the site (see `about-page.md`).
- Multilingual site (French, English).

See also "Out of scope" below.

## Target users

The site is aimed at visitors curious about dataviz and open data. There is no role distinction on the visitor side: no account, no personal space, no personalized content.

The content (catalog, visualizations) is produced by the site's author directly in the code and the source data (see `data-model.md`), not through an administration interface.

## Main user journeys

1. A visitor arrives on the home page and browses the catalog of visualizations (see `home-page.md`).
2. They choose a visualization that interests them and go to its dedicated page.
3. They discover the context of the dataset (source, license, chosen angle) then interact with the visualization.
4. They return to the catalog, or continue directly to one of the related visualizations suggested at the bottom of the page (see "Related visualizations" below), to explore another visualization.
5. A visitor can also arrive directly on a visualization's page via a shared link, without going through the home page.

## Cross-cutting rules

### Multilingual

- The site is available in French and English.
- On the first visit to a URL without a language prefix (English by default), the displayed language is determined by the browser's language; if the browser indicates a language other than French or English, the site stays in English. A URL explicitly prefixed with `/fr/` always displays French from that first visit: browser detection only applies to the default (unprefixed) entry, never to override an explicit language choice in the URL, including a visualization page opened directly via a shared link (see journey 5 above). A manual language change via the selector is remembered for subsequent visits and then takes precedence over the visited URL (see "Architecture" in `technical-specifications.md` for the storage mechanism). If the equivalent of the visited page does not exist in the determined or remembered language, the visitor lands on the unavailability message rather than on the shared content.
- A language selector, accessible from every page, lets the visitor switch from one language to the other. It preserves the navigation context when the content exists in the other language; otherwise, the page displays a message indicating that this content is not yet available in that language (see "Untranslated content" in `technical-specifications.md`).
- A visualization that is not translated into the current language does not appear in that language's catalog.
- A visualization's presentation text (title, summary, legends, interaction copy) is available in both languages. The data itself is not systematically translated when its nature does not lend itself to it (e.g. municipality names, official categories of a dataset); each `<viz-slug>/functional-specifications.md` specifies, where applicable, what remains untranslated and why.

### Navigation

- Every page lets the visitor return to the site's home page.
- Every page gives access to the "About" page, from the footer (see `about-page.md`).

### Related visualizations

At the bottom of a visualization's page, a section suggests up to three other visualizations that share at least one theme with it (see "Theme" in `data-model.md`). It serves in particular the visitor who arrived via a shared link (journey 5), who did not go through the catalog.

- Candidates: the visualizations available in the current language, excluding the current visualization, sharing at least one theme with it. A visualization not translated into the current language is never suggested: a related tile never leads to the unavailability message.
- Order: number of shared themes descending, then publication date (`publication-date`) descending, then `slug` alphabetically as a stable tie-breaker. The first three are kept.
- No candidate (e.g. only visualization in its theme): the section is entirely absent, title included. It is not filled with thematically unrelated visualizations.
- The selection is determined at site generation: identical for all visitors, neither random nor personalized.

Display: see "Visualization page" in `style-guide.md`.

### Prepared data download

A visualization's page can offer for download the prepared data files it consumes (under `public/data/<viz-slug>/`, see `data-model.md`), to extend the exploration beyond the site.

- Explicit opt-in: only the files listed in the visualization's `downloads` attribute are offered (see "Visualization" in `data-model.md`). A visualization without `downloads` displays no link.
- What is offered: the main data files, not the context layers (basemap, rivers, roads, relief, illustrations), which are part of the backdrop and are not always credited in `datasets`.
- Licenses: before declaring a file, the author checks that the licenses of the sources it derives from allow its redistribution. A source under all rights reserved excludes the visualization (e.g. `endangered-species`). A non-commercial source, or one without a formal license but allowing redistribution with citation, remains acceptable: the site is itself non-commercial, and the licenses are displayed just above, in the source credit block. A notice reminds visitors that reuse remains subject to these licenses.
- Format: the files are offered as the visualization consumes them, without conversion (no dedicated CSV export) nor documentation of their format on the site. Their structure is designed for rendering, not for reuse.
- Each file is presented with its name and size, so that the visitor knows what they are downloading before clicking (some files exceed 10 MB).

Display: see "Visualization page" in `style-guide.md`.

### Shareable state in the URL

The URL of a visualization's page continuously reflects the state chosen by the visitor. Copying the browser's address is enough to share exactly what they see, and opening that link restores that state (journey 5). There is no dedicated share button.

- Captured state:
  - filters and toggles (regions, species, groups, season, display mode, search…);
  - the temporal position (year, month) of animated visualizations;
  - the framing (zoom level and center) of zoomable maps.
- Uncaptured state:
  - playback speed;
  - hovers and tooltips;
  - any toggle that triggers calls to a third-party service: a shared link must not cause an external request without an action from the visitor.
- Minimal URL: only the elements that differ from the default state appear in the URL. A visualization in its initial state keeps a bare URL.
- Temporal position: it appears in the URL only when playback is paused, whether by the button or by manipulating the slider. Resuming playback removes it. A link carrying a temporal position opens the visualization paused at that moment. A visualization whose paused frame makes no sense can depart from this (e.g. ephemeral pulses that fade as soon as playback stops): it then documents and justifies its own behavior.
- Invalid or unknown values (truncated link, vanished identifier, out-of-range year): each invalid parameter is silently ignored and replaced by its default value, and valid parameters remain applied. No error message.
- History: these updates do not create entries in the browser history. The "back" button leaves the page instead of replaying each click on a filter.
- Language change: the state is preserved. The parameters are the same in both languages (see "Multilingual" above).

Each visualization lists its own parameters in its `technical-specifications.md` ("State in the URL" section). Common mechanism: see "State in the URL" in `technical-specifications.md`.

### Reduced motion

When the visitor has asked their system to reduce animations (`prefers-reduced-motion` preference), the site starts no motion on its own:

- **Autoplay:** an animated visualization opens paused, on its final state, the most informative one without motion (last year, complete accumulation). The Play button remains available: starting playback is then an explicit choice of the visitor, and the animation runs normally. Each animated visualization specifies its opening state in its `functional-specifications.md`, in particular when it has no final state (endless cycle, ephemeral pulses).
- **Transitions that move elements** (sliding arcs, zoom animated by a button): immediate. Color or opacity fades (hover, switching between two maps) are kept, because they move nothing.
- **Shared link:** a temporal position carried by the URL (see "Shareable state in the URL" above) takes precedence over the final state, and the visualization stays paused at that position, including when it would otherwise restart playback. The opening state chosen for reduced motion is never written into the URL: it is not an action of the visitor.
- The preference is read once, when the visualization loads. Changing it during the visit has no effect until the page is reloaded.

### Data table view

Below the mount area, a visualization can offer a summary table of the data it represents. It is a fallback for visitors who cannot read the visualization (screen reader, keyboard navigation), and an access to the exact figures for everyone else.

- **Summary, not raw data:** about a hundred rows at most, aggregated according to what the visualization shows (by decade, by year, by department…). The complete data remains available through the download (see "Prepared data download" above).
- **Static:** the table follows neither the filters, nor the current year, nor the framing. It describes the whole dataset, identical for all visitors, and remains readable without JavaScript.
- **Collapsed by default:** a "Voir les données sous forme de tableau" / "Show the data as a table" block, which the visitor expands. The "controls always visible" rule (see "Rules common to all visualizations" in `technical-specifications.md`) targets the filters and the legend, not this table.
- **Case by case:** each visualization that offers one defines it in its `functional-specifications.md` ("Table view" section): rows, columns, aggregation, order, table caption. A visualization without this section displays no table.
- **Bilingual:** caption, headers, units and number and date formats follow the page's language. Proper nouns (municipalities, departments, scientific names) remain untranslated, as in the visualization.

Display: see "Data table" in `style-guide.md`.

## Out of scope

- User accounts, authentication.
- Content editing via a web interface: content is created and modified directly in the source files (see `data-model.md`).
- Visitor-generated content (comments, contributions).
- Cross-catalog free-text search: to be reassessed when the number of visualizations justifies it more; filtering by theme (see `home-page.md`) covers the need for browsing by subject for now.
