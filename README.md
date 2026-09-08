# dataviz.heubes.io

A catalogue of interactive, hand-built data visualizations. Each entry explores a single open data dataset with a presentation designed specifically for it, rather than a generic chart template reused across datasets. Bilingual (French / English), built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Visualizations

- **Bird migrations** ([`bird-migrations`](specs/bird-migrations/)) : GPS/Argos tracking data for four species, rendered with D3 and Canvas.
- **Flower phenology** ([`flower-phenology`](specs/flower-phenology/)) : GBIF occurrence data for twelve wild species, rendered as D3 SVG arcs.
- **Biodiversity in France** ([`biodiversity`](specs/biodiversity/)) : an H3 hexagonal grid over mainland France, from GBIF data aggregated via the SQL Downloads API, rendered as static D3 SVG.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # static build to dist/
npm run preview   # preview the production build
```

## Project structure

Implementation follows `BUILD-PLAN.md`, which lays out the build in incremental steps. `specs/` is the source of truth for every design decision: general specs (functional, data model, technical, style guide, home page) apply site-wide, and each `specs/<viz-slug>/` folder documents what's specific to that visualization (dataset schema, screen behavior, technical choices). See `CLAUDE.md` for the full breakdown.

## License

Code and content are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
