# Technical specifications: The Flower Calendar

Complements the general `technical-specifications.md`: technical choices specific to this visualization, beyond the common rules.

## Rendering

D3 v7 only (`d3-shape` for the arcs, `d3-scale` for the angular scale of the days of the year, `d3-transition` for animating a ring when its decade changes). SVG rendering: low data volume (at most 15 species × 2 visible decades), no performance concern justifying Canvas here, unlike the migrations.

No map, no TopoJSON, no `topojson-client`: the only one of the three visualizations without a geographic background.

## Mount area: 1:1 ratio (documented exception)

**`aspect-ratio: 1 / 1` on the mount area, not the `width × 0.6` calculation of the site's default height** (see "Rules common to all visualizations" in the general `technical-specifications.md`): the only visualization on the site whose rendering is a radial dial, whose geometry requires a square area (the SVG `viewBox` is sized on `size = width`, see "Rendering" above); applying a non-square rectangle to it would distort the circle rather than simply reframe a map.

It nevertheless remains subject to the same cap as the other visualizations (space available between header and footer, controls included): rather than a capped height (which would break the square, since width and height remain linked by `aspect-ratio`), it is the width of the square that is capped (`max-width` recomputed on resize, in addition to the fixed `max-width: 640px` already in CSS) at the value which, once the height is derived through `aspect-ratio`, respects this cap.

## New dependencies

| Dependency | Usage | Scope |
|---|---|---|
| `d3-shape` | Arc generator (p10-p90 band, median tick) | Scoped to this visualization (Astro island) |
| `d3-scale` | Linear angular scale of the day of the year (already a site dependency via `bird-migrations`) | Shared by npm convention, usage scoped to this visualization |
| `d3-selection`, `d3-transition` | DOM selections and transition of a ring on a decade change (`d3-selection` already present via `bird-migrations`) | Scoped to this visualization |

## Calendar background (decided during implementation)

**Standard light background (`--dv-surface`)**, consistent with the rest of the site in its fixed light theme (see "Colors" in `style-guide.md`): no visual break with the rest of the page. Accepted trade-off: lower contrast for the light hues of the bespoke palette (see "Palette" below), mitigated by a neutral outline around each arc rather than by a background change.

## Palette (documented exception)

Bespoke "real flower color" palette rather than the official categorical palette (see "Dataviz palette" in `style-guide.md`, which allows a documented and validated exception for a need specific to a visualization).

**Rationale:** the official palette is capped at eight fixed hues ("never cycled beyond"), incompatible with up to 15 species displayed simultaneously; and the editorial concept of this piece relies on color as a direct evocation of the flower itself (dandelion yellow, poppy red...), not as an arbitrary categorical code.

**Validation performed** (the dataviz skill's `scripts/validate_palette.js`, `--mode light`, `--dv-surface` background) on the twelve `flowerColor` colors (see "Species selection" in `data-model.md`):

- **CVD / normal vision separation:** a near-indistinguishable duplicate was detected and corrected before the colors were finalized: the crocus (`#B89AE0` in the draft) and the lavender (`#9B72CF`) did not pass the 15 ΔE threshold even after the "correction" already noted in the original draft; the crocus was lightened to `#C9A8E8` (ΔE 15.8, passes). The wild daffodil (new species, see `data-model.md`) was chosen as `#C97A0A`, an amber clearly separated from the dandelion yellow (`#F0C040`, ΔE 18.7) after several attempts that were too close.
- **Accepted residual limitation, not correctable within the editorial constraint:** the three near-white hues (blackthorn `#F4F1EA`, lily of the valley `#EDEAE0`, anemone `#E5E2D8`) remain below the pairwise separation threshold (ΔE ~2-5), even after several attempts to distinguish them by hue while remaining credible as "flower white" (see "Pure white avoided" in `data-model.md`). The validator also fails on the chroma floor and the lightness band for these same light hues, and on contrast against the background (`--dv-surface`) for most of the palette's pale colors (below 3:1). These failures are **accepted as a documented limitation** of the "real flower color" exception (same logic as the three hues below 3:1 already accepted in the site's official categorical palette, see `style-guide.md`): reading never relies on hue alone (see mitigation below).
- **Mitigation (mandatory counterpart of a non-ignorable contrast WARN, see the dataviz skill):** each arc carries a `1px` `var(--dv-gridline)` outline to remain visible regardless of its fill contrast against the background; the species name remains spelled out next to its swatch in the selector (never color alone); the tooltip names the species on hover/tap of its arc.

## Species selector: fifteen-species cap not implemented

With the twelve species finalized in `data-model.md`, the cap of fifteen simultaneous selections documented in `functional-specifications.md` ("Interactions") cannot be reached: no blocking or eviction logic was implemented for this case (see "Minimalisme" in the global `CLAUDE.md`). If the species list is extended beyond fifteen in a future iteration, this logic remains to be added.

## Hydration

`client:visible`.

## Accessibility (known limitation)

See "Accessibility (known limitation)" in this visualization's `functional-specifications.md`.

## Responsive

See "Responsive" in this visualization's `functional-specifications.md`.

## State in the URL

See "State in the URL" in the general `technical-specifications.md` for the common mechanism.

| Parameter | Values | Default (absent from the URL) |
|---|---|---|
| `species` | Scientific names (`species`, see `data-model.md`) of the displayed species, separated by commas, in selector order; empty (`species=`) if no species is checked | All species |
| `inner` | Decade of the inner ring (`1970s` to `2020s`) | `1970s` |
| `outer` | Decade of the outer ring (`1970s` to `2020s`) | `2020s` |

- Scientific names contain a space, encoded as `+` in the URL (`species=Papaver+rhoeas,Centaurea+cyanus`): this is the data identifier as is, not a derived slug.
- An unknown name in `species` is ignored; a list in which no name is recognized is treated as invalid (falls back to all species), so that a broken link does not land on the empty state.
- On reading, the restored decades are drawn directly, without the decade-change transition (see "Rendering" above), which only makes sense in response to a visitor's choice.
