# dataviz.heubes.io

A catalog of original, interactive data visualizations, each exploring an open data dataset with its own visual treatment. Static, multilingual site (French / English), generated with Astro and hosted on GitHub Pages.

## Project status

Implementation follows `BUILD-PLAN.md`, which defines the order in incremental steps. `specs/` remains the source of truth for every design decision: before writing or modifying code, read the spec files relevant to the task.

## Structure of `specs/`

- **`functional-specifications.md`**: project scope, target users, user journeys, cross-cutting rules (multilingual, navigation), out of scope.
- **`data-model.md`**: general data model (Visualization and Source dataset entities), content file organization (Astro content collections), naming conventions, validation constraints.
- **`technical-specifications.md`**: tech stack, hosting/deployment, architecture (routing, content collections), performance, accessibility, SEO, and rules common to all visualizations (library loading, data handling, common states).
- **`style-guide.md`**: style guide (colors, typography, spacing), base UI components (header, footer, tiles), dataviz palette, applicable to the whole site, visualizations included.
- **`home-page.md`**: functional specification of the home page (catalog).
- **`about-page.md`**: specification of the "About" page (expected content, access, format).
- **`<viz-slug>/`**: one folder per published visualization, with:
  - `data-model.md`: schema of the dataset specific to this visualization (columns, format, exact source, transformations).
  - `functional-specifications.md`: functional specification of the visualization, including its screen (goal, content, interactions, states, responsive).
  - `technical-specifications.md`: technical rules specific to this visualization (rendering library, interaction technique, specific performance or accessibility constraints) that go beyond the common rules of the general file. Almost systematic rather than exceptional: since each visualization is an original piece of code (not a generic template replayed), it almost always has a technical choice of its own to document.

Nineteen `<viz-slug>/` folders exist at this stage: fourteen published visualizations (see the list in step 8 of `BUILD-PLAN.md`, done), and five specified but not yet implemented (`exoplanets`, `meteorites`, `sunspots`, `brest-sea-level`, `tropical-nights`, see step 24 of `BUILD-PLAN.md`).

## When and how to use these specs

- **Before any implementation**, read the file or files relevant to the task. The six general specs (`functional-specifications.md`, `data-model.md`, `technical-specifications.md`, `style-guide.md`, `home-page.md`, `about-page.md`) apply to the whole site; each `<viz-slug>/` folder adds what is specific to that visualization.
- **Files constantly reference each other** ("see `X.md`") rather than duplicating information. Follow these references rather than guessing: if a spec mentions a rule defined elsewhere (multilingual behavior, a style guide color...), the source of truth is the referenced file.
- **When modifying a spec**, look for the other files that reference it (`grep` the file name in `specs/`) and check that they stay consistent with the change.
- **When in doubt, or when the specs are silent** on a point needed for implementation, ask rather than assume: these are design choices, not free implementation details.
- **In case of contradiction** between the code and a spec, the spec prevails; if the implementation reveals that a spec must change, update the spec and explain why, rather than silently diverging from it in the code.

## Before each commit

- **Check all files in `specs/`** for consistency, not only those directly modified by this commit.
- **If one or more specs need to be adjusted** (to stay consistent with each other, or with the change in progress), block the commit: propose the necessary updates and wait for approval before applying them, then commit.
- **Update `BUILD-PLAN.md`** if needed (progress status).
- **Update `README.md`** if needed.

## Established conventions

- Everything in the repository is written in English: specs (`specs/`), `BUILD-PLAN.md`, this file, `README.md`, code and comments. The only French allowed is the French content of the bilingual site itself (French content files, French interface strings) and French proper nouns or source data values.
- File names, folders, data attributes and technical identifiers are in English, in kebab-case (slugs, data, CSS classes) or in PascalCase for Astro components (see "Naming conventions" in `technical-specifications.md`).
- Style guide colors and components are defined only once, in `style-guide.md`: do not introduce new color values or new component styles elsewhere without adding them there first.
- Any new dependency (visualization library, npm package) specific to a visualization is documented in that visualization's `technical-specifications.md` and discussed before being added (see the project's global security rules).
