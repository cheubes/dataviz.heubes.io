# dataviz.heubes.io

A catalogue of interactive, hand-built data visualizations. Each entry explores a single open data dataset with a presentation designed specifically for it, rather than a generic chart template reused across datasets. Bilingual (French / English), built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Visualizations

- **Bird migrations** ([`bird-migrations`](specs/bird-migrations/)) : GPS/Argos tracking data for four species, rendered with D3 and Canvas.
- **Flower phenology** ([`flower-phenology`](specs/flower-phenology/)) : GBIF occurrence data for twelve wild species, rendered as D3 SVG arcs.
- **Biodiversity in France** ([`biodiversity`](specs/biodiversity/)) : an H3 hexagonal grid over mainland France, from GBIF data aggregated via the SQL Downloads API, rendered as static D3 SVG.
- **Paris, Tree by Tree** ([`paris-trees`](specs/paris-trees/)) : 194,315 trees from the City of Paris's tree inventory, rendered as a Canvas 2D point map with genus filtering and species search.
- **The Orbital Rush** ([`satellites-in-orbit`](specs/satellites-in-orbit/)) : 20,020 payloads still in orbit today, from CelesTrak's SATCAT, animated year by year in a continuous loop as a Canvas 2D point swarm around a slowly rotating globe.
- **The Sky, Year by Year** ([`light-pollution`](specs/light-pollution/)) : NOAA VIIRS nighttime radiance for mainland France, 2013-2025, aggregated on the same H3 hexagonal grid as Biodiversity in France and translated into a six-tier sky-visibility scale, with a year slider recoloring the map.
- **Layers of Heritage** ([`monument-layers`](specs/monument-layers/)) : 37,661 French historic monuments from the Ministry of Culture's Mérimée database, animated in chronological order of construction as a Canvas 2D point map, from a static prehistoric/antique backdrop through the medieval and modern waves.

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
