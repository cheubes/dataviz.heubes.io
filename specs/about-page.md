# "About" page

## Goal

Explain to the visitor what the site is and how it is made: the approach of the catalog, the origin and processing of the data, the license and the making. It is a secondary page, accessible from every page, with no role in the discovery of the visualizations themselves.

## Access

- URL `/about/` (EN) and `/fr/about/` (FR): same convention as the visualizations, an English slug shared between languages (see "URL structure" in `technical-specifications.md`).
- "À propos" / "About" link in the footer, on every page (see "Footer" in `style-guide.md`).
- The language selector switches between the two versions (see "Multilingual" in `functional-specifications.md`). The page always exists in both languages.

## Content and structure

- Site header and footer.
- `h1` title "À propos" / "About", then a text in `h2` sections:
  - **The approach**: a catalog of original visualizations, each with a presentation specific to its dataset, without a replayed template.
  - **The data**: public sources, cited on each page with their producer, their license and their retrieval date; data frozen at the time of its preparation; limitations (biases, partial coverage) flagged on the relevant page; download of the prepared data when the licenses allow it (see "Prepared data download" in `functional-specifications.md`).
  - **Sharing a view**: a visualization's address keeps the filters, the paused year and the framing (see "Shareable state in the URL" in `functional-specifications.md`).
  - **How it's made**: static site, visualizations coded one by one, hosting, public source code; no audience measurement and no cookie, only the language preference is remembered in the browser (see "Language detection and persistence" in `technical-specifications.md`); fonts and icons served by the site, without any request to a third-party service when a page is displayed (see "Fonts" in `technical-specifications.md`).
  - **License**: presentation and code of the site under CC BY-NC-SA 4.0; each dataset remains under its source's license (see "Footer" in `style-guide.md`).
  - **Author**: the author's name, linking to their site. No other personal information.
- The text only describes what is true of the site: any change to the specs cited above (new feature, added audience measurement, license change) requires rereading this page.

## Format

- Text written in `src/content/about/about.fr.md` and `about.en.md` (Markdown, without frontmatter), rendered by `src/pages/about.astro` and `src/pages/fr/about.astro`. Title and description of the page (`<title>` and meta tags) in the i18n dictionary (see "Interface copy" in `technical-specifications.md`).
- Same typography as the long presentation of a visualization (see "Typography" and "Visualization page" in `style-guide.md`).

## States

Fully static page: no loading, no error, no empty state.

## Responsive

Single text column in the page container, with no specific behavior.
