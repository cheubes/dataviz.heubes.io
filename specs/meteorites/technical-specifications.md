# Technical specifications: What Falls from the Sky

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

**Status: specified, not implemented.** Several choices remain to be confirmed (see "Points to validate" below).

## Data source

Copy of the Meteoritical Bulletin Database published on the NASA Open Data Portal, see "Source dataset", "Access" and "License" in `data-model.md`. One-off retrieval at preprocessing time (the portal's "legacy" CSV file), not at each build. One-off Node preprocessing script, not committed (see "Preprocessing" in `data-model.md`).

Source credit block: "The Meteoritical Society, Meteoritical Bulletin Database, via le NASA Open Data Portal", license displayed as "Non spécifiée par la source" / "Not specified by the source". No download link (see "License" in `data-model.md`).

## Chosen form

The initial framing proposed a world map of points sized by mass, with a seen falling / found toggle. Measurements on the actual file (see "Measurements" in `data-model.md`) lead to keeping this base and adding two pieces to it:

1. **World map of points** with toggle: kept. The 1,096 positioned observed falls, drawn on top, remain legible over the 30,867 finds; the toggle allows isolating them.
2. **Latitudinal profile** (addition): on the map, more than 70% of positioned finds shrink to a few dozen stacked points in Antarctica (4,761 meteorites on a single point), which visually reverses the balance of power. The profile restores the proportions, without changing the map's encoding.
3. **Antarctic inset** (addition): the `geoNaturalEarth1` projection flattens high latitudes, precisely where finds are concentrated. A polar view makes them legible without forcing the zoom.

Alternatives ruled out:

- **Two world maps side by side** (seen falling / found small multiples): each map loses half the width, and the 1,096 falls become one-pixel dots. The toggle and the mirrored profile make the same comparison without this cost.
- **Hexagonal density map**: hides falls, too rare for a grid, and repeats the form of `biodiversity` and `light-pollution`.
- **Chronological accumulation** (year slider): the 1969 break is real (see "Measurements" in `data-model.md`), but the bias to show is spatial, and accumulation is already the mechanic of `monument-layers` and `satellites-in-orbit`. The break is mentioned in the long presentation.
- **Proportional symbols per location** (one circle per position, area by number of meteorites): would make stacks visible, but at the cost of a second size encoding, competing with mass.

## Map technology

Same stack as `earthquakes` and `volcanic-eruptions`, D3 v7.

- **Basemap, rivers, relief: copied (identical bytes) from `public/data/bird-migrations/`** (`basemap.json`, `rivers.json`, `relief.webp`) to `public/data/meteorites/`, same convention as `monarch-migration`, `earthquakes` and `volcanic-eruptions`. Relief alignment constants (`RELIEF_REF_WIDTH/HEIGHT`, `RELIEF_ORIGIN_X/Y`) reused identically.
- **World map projection:** `geoNaturalEarth1`, `fitExtent` on the full extent of the silhouette, like `earthquakes`. The silhouette goes down to 85.6° S: the southernmost ice fields (LaPaz Icefield, Graves Nunataks, around 86° S) fall at the edge of the silhouette or just below it, with no clipping of points.
- **Zoom:** `d3-zoom` on the foreground canvas, `scaleExtent [1, 8]`, zoom in / zoom out / reset buttons (no `× 1,5`), disabled at the bounds, like `earthquakes`.

## Rendering

**Canvas 2D**, three stacked canvases:

1. **Background**: silhouette, relief, rivers, redrawn on resize and on zoom.
2. **Finds**: 30,867 points.
3. **Observed falls**: 1,096 points, on top.

One canvas per population allows the toggle through a simple CSS opacity fade (`transition: opacity`), without redrawing, which remains compatible with reduced motion (see "Reduced motion" in `functional-specifications.md`).

- **Drawing order:** within each population, from most massive to lightest (file order, see "Preprocessing" in `data-model.md`), unknown masses last: small points remain visible over large ones.
- **Size classes** (radius in screen pixels, constant whatever the zoom):

  | Mass | Radius |
  |---|---|
  | Unknown | 1.25 px |
  | Less than 100 g | 1.25 px |
  | 100 g to 10 kg | 2 px |
  | 10 kg to 1 t | 3.5 px |
  | 1 t and more | 6 px |

  Classes rather than a continuous scale: masses span nearly nine orders of magnitude (0.1 g to 60 t). A square-root scale would make Hoba a giant disc and the 21,000 fragments under 100 g invisible dots; a continuous logarithmic scale would be unreadable in a legend.
- **Finds:** filled discs, opacity 0.5, so that density reads through accumulation.
- **Observed falls:** opaque filled discs, 0.75 px `--dv-surface` (white) outline to set them apart from the finds they cover.
- **Redraw on zoom:** both point canvases are redrawn on each `zoom` event (32,000 discs at most), in a `requestAnimationFrame`. To be measured on mobile; if rendering stutters, switch to a CSS transform during the gesture and a redraw at the end of the gesture, like `medical-deserts` (see "Points to validate" below).

## Latitudinal profile

- **Bands:** 18 bands of 10°, from 90° N to 90° S.
- **Alignment:** `geoNaturalEarth1` is pseudo-cylindrical, a point's y-coordinate depends only on its latitude. The edges of each band are therefore placed at `projection([0, latitude])[1]`, then passed through the zoom transform (`transform.applyY`). The profile thus follows the map's vertical zoom and panning, clipped to the height of the map area.
- **Bars:** central vertical axis, observed falls to the left, finds to the right, length proportional to the share of the positioned population in the band (linear scale shared by both sides, domain `[0, 50 %]`, the highest measured share being 48%). A non-empty but tiny band keeps at least 1 px, to stay distinct from an empty band.
- **Toggle:** the series hidden on the map is dimmed (opacity 0.25), not removed.
- **Rendering:** SVG, about twenty elements, to the right of the canvas, 120 px wide (48 px below 640 px). Hover and tap per band.

## Antarctic inset

- **Projection:** `geoAzimuthalEqualArea().rotate([0, 90])`, `clipAngle` limited to latitudes below 60° S, `fitExtent` on this disc. Same silhouette (`basemap.json`), without relief or rivers: `relief.webp` is rasterized in the world map projection and cannot be reprojected.
- **Points:** same points, same colors, same size classes, same logical canvases (one more drawing per population on a canvas specific to the inset, subject to the same opacity fade).
- **Size and placement:** about 18% of the world map's width, placed in the South Pacific, between New Zealand and South America, above the Antarctic band: an area empty of land as well as of meteorites, whereas a bottom corner would cover the LaPaz and Graves Nunataks ice fields. Thin `--dv-gridline` frame, label "Antarctique" / "Antarctica". Below 640 px, below the world map, full width, 160 px high.
- No zoom or panning.

## Hover

- **Custom spatial index** on a uniform grid in screen pixels (16 px cells), rebuilt after each redraw of the points: screen positions are already computed for drawing. Search in the pointer's cell and its eight neighbors, nearest point within an 8 px radius (16 px tap radius on touch), in the displayed population.
- The point found groups all meteorites at the same position (positions rounded to four decimal places, see "Preprocessing" in `data-model.md`), for the "N météorites à cet emplacement" card (see "Interactions" in `functional-specifications.md`). Groupings are computed once at load time (position → indices table).
- Inset: same index, specific to the inset.
- Detail card as an overlaid DOM element, like `earthquakes`. Hidden during a zoom gesture.

## Palette

Categorical palette from `style-guide.md`, first two slots, with no exception to document: on a scatter of points, the first three slots are guaranteed to be pairwise distinguishable.

| Slot | Hue | Population |
|---|---|---|
| 1 | Blue `#2a78d6` | Found |
| 2 | Orange `#eb6834` | Seen falling |

Orange, warmer and more salient, goes to the rare population and to the subject of the title (the fall); blue, to the massive background of finds. The site's accent blue is the same as slot 1: here it is not the sole identity of a series, since the legend names each population next to its swatch. Background illustration colors (silhouette `#e4e2da`, hydrography `#a8c5da`) taken from "Basemap (illustration)" in `style-guide.md`, no new value. The same colors are used for the latitudinal profile and the inset.

## New dependencies

None. `d3-geo` (including `geoAzimuthalEqualArea`), `d3-zoom`, `d3-selection`, `d3-transition`, `d3-scale` and `topojson-client` are already in `package.json`. `d3-quadtree` could have served as the spatial index for hover: not chosen, the uniform grid above is enough. Adding it would need to be discussed (see "Points to validate" below).

## Hydration

Mount area hydrated via a classic `<script>` setting up an `IntersectionObserver` (`rootMargin: 200px`) that only mounts the rendering the first time it enters the viewport, same mechanism as `earthquakes` and `volcanic-eruptions`.

Mount area height: common calculation (see "Rules common to all visualizations" in the general `technical-specifications.md`), on the total width. The world map is framed in the remaining width once the profile is removed.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`. Display toggle as a `<fieldset>` of three native `<input type="radio">` with a `<legend>`, zoom buttons as `<button>` with `aria-label`: keyboard accessible by construction. The latitudinal profile carries `aria-hidden="true"`: its figures are repeated in the table view.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`. Touch pan / zoom via `d3-zoom`, card triggered by `pointerdown` / `click` rather than `pointermove` on touch, like `earthquakes`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `show` | `fell` (seen falling only), `found` (found only) | Both populations |
| `zoom` | `<k>,<lon>,<lat>` (common format) | Whole world map |

- `show` is written on each toggle change, removed on returning to "Toutes". Any other value is ignored.
- `show` is applied before the first draw, through the canvases' opacity without transition: the map opens directly on the requested population, without playing the fade on load (same precaution as `view` in `medical-deserts`).
- `zoom` is written on the `end` event of `d3-zoom`. The inset and the profile have no state of their own.
- No time position: the visualization is not animated.

## Points to validate

Design decisions to be confirmed by the user before implementation:

1. **Source:** NASA copy of the catalog, frozen in spring 2013 (45,716 meteorites), rather than the up-to-date Meteoritical Bulletin Database (78,667 valid names according to re3data), inaccessible to automated requests (Cloudflare) and without a published license. Alternative: manual extraction from a browser, not reproducible and no better licensed. The presentation says "dans l'état du catalogue en 2013".
2. **License and download:** "License not specified" on the NASA side, copyright claimed on the Meteoritical Society side, no text allowing redistribution. Proposal: no `downloads`. Alternative: declare `meteorites.json`, considering the "public" publication on a government portal as sufficient authorization, which the general rule does not currently provide for.
3. **Form:** world map of points + latitudinal profile + Antarctic inset (see "Chosen form"). The two additions to the initial framing are to be confirmed separately.
4. **Toggle defaulting to "Toutes"** (both populations overlaid) rather than "Vues tomber" then "Trouvées" in two steps.
5. **Mass in four size classes** rather than a continuous scale; thresholds (100 g, 10 kg, 1 t) and radii to be confirmed on a first rendering.
6. **Stacks left as is** (no scattering, no proportional symbol per location), compensated by the detail card and the profile.
7. **Profile in shares** of each population (not counts), in 10° bands, aligned with the map and following the vertical zoom.
8. **Unknown locations** (13,752, including 4,300 Northwest Africa): absent from the map, counted in the legend and the table. Specific rule for the 223 "Yamato" with zero latitude, set to unknown location.
9. **Meridiani Planum** (found on Mars) excluded from the file. It could be the subject of a sentence in the long presentation.
10. **Relicts** (75, `nametype` = `Relict`) kept and not distinguished.
11. **Themes `space` and `earth`.** Effect to be aware of: since all candidates share only one theme, related visualizations are tie-broken by publication date. With current publications, these would be `forest-fires`, `volcanic-eruptions` and `earthquakes`, and `satellites-in-orbit`, older, would not appear. In return, this visualization, the most recent, would enter the related visualizations of the four `earth` visualizations and of the `space` visualizations (including `exoplanets` if it is published). Alternative: `space` alone.
12. **Palette:** orange (slot 2) for observed falls, blue (slot 1) for finds.
13. **No time dimension** in the interface (neither slider nor period filter), despite the 1969 break: the year only appears in the detail card and in the presentation.
14. **Responsive:** 640 px threshold, inset below the map and profile reduced to 48 px below it.
15. **Redraw performance on zoom** (32,000 discs per frame): to be measured on mobile, fallback planned on the `medical-deserts` technique.
16. **Custom spatial index** rather than adding `d3-quadtree` (new dependency, to be discussed if the grid is not enough).
17. **Title, summary and presentations** (see "Editorial angle" in `functional-specifications.md`).
