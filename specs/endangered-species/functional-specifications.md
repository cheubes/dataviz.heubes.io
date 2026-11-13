# Functional specification: What's Left

Complements the general `functional-specifications.md`: screen of this visualization (goal, content, interactions, states, responsive).

## Editorial angle

| Language | Title | Summary |
|---|---|---|
| FR | Ce qu'il en reste | Six espèces emblématiques, une foule d'icônes qui s'amenuise ou se reconstitue, recensement après recensement. |
| EN | What's Left | Six emblematic species, a crowd of icons that shrinks or rebuilds, census after census. |

**Long FR presentation (proposal):**
> Tigre, rhinocéros noir, panda géant, gorille des montagnes, vaquita, grand hamster d'Alsace : ces espèces emblématiques sont suivies depuis des décennies par des organismes de conservation qui en recensent régulièrement la population sauvage. Chaque nouveau recensement est une estimation, parfois précise à quelques individus près, du nombre réel qu'il en reste à l'état sauvage.
>
> Cette page suit ces espèces à travers leurs recensements successifs, chacune représentée par une foule d'icônes qui grandit ou rétrécit au fil du temps. Le récit n'est pas univoque : à côté du déclin de la vaquita ou du grand hamster d'Alsace, le panda géant et le gorille des montagnes montrent qu'un rétablissement reste possible.

**Long EN presentation (proposal):**
> Tiger, black rhinoceros, giant panda, mountain gorilla, vaquita, European hamster: these emblematic species have been tracked for decades by conservation bodies that regularly survey their wild population. Each new census is an estimate, sometimes accurate to within a handful of individuals, of how many actually remain in the wild.
>
> This page follows these species through their successive censuses, each one represented by a crowd of icons that grows or shrinks over time. The story isn't one-directional: alongside the decline of the vaquita or the European hamster, the giant panda and the mountain gorilla show that recovery remains possible.

## Goal

Show, through a selection of emblematic species, how their population actually changes over the successive censuses conducted by the bodies that monitor them, without presuming a systematic decline.

## Content (mount area)

- Playback controls, above the small multiples (never overlaid, revised after user feedback, see "Responsive" below), shared by all cards: Play/Pause, speed selector, year slider (the current simulated year can already be read there, removed from the cards themselves after user feedback: see scoping discussions).
- Small multiples: one card per chosen species (see "Species selection" in `data-model.md`), each displaying its name and a crowd of icons representing its population, of fixed size (see "Rendering" in `technical-specifications.md`).

## Composition

Each species in its own frame, at its own icon scale (one icon representing a number of individuals specific to each species, see "Rendering" in `technical-specifications.md`), an explicit decision of the user (see scoping discussions): populations range from a few dozen to several thousand individuals depending on the species, and a single scale would have made the rarest species invisible next to the most numerous ones. Fixed-size cards (see "Rendering" in `technical-specifications.md`), no variable height depending on the number of icons displayed.

## Interactions

- **Looping autoplay:** starts as soon as the page loads and loops continuously over the entire period covered, like `bird-migrations`/`satellites-in-orbit`/`light-pollution`, not a single pass with a frozen final state (revised after user feedback, see scoping discussions: the initial version stopped at the most recent measurement point).
- **Play/Pause:** stops or resumes playback at the current simulated instant, shared by all cards (a single common timeline, not one per species).
- **Speed:** Slow/Normal/Fast, same convention as `light-pollution`/`satellites-in-orbit`.
- **Year slider:** native `<input type="range">`, over the domain `[earliest measurement point across all species, most recent measurement point]`, controllable manually or automatically; moving it manually pauses autoplay, same convention as `light-pollution`.
- **Hover/tap of a species card:** detail card (population estimate for the current simulated year with its actual measurement date, trend since the previous measurement point).
- **No filter, no zoom/pan:** unlike the site's visualizations with a real map, this one is not a geographic map (see "Rendering" in `technical-specifications.md`): a small number of species, all permanently visible.
- **Initial view:** all cards at their earliest measurement point, autoplay already running.
- **Shared link** (see "Shareable state in the URL" in the general `functional-specifications.md`): a chosen year (pause or slider) is restored, the cards then opening paused on that year.
- **Reduced motion** (see "Reduced motion" in the general `functional-specifications.md`): the small multiples open paused on the last year, that of the most recent censuses.

## Table view

See "Data table view" in the general `functional-specifications.md`.

- **Caption:** "Effectifs recensés, par espèce et par recensement" / "Recorded population, by species and census".
- **Rows:** one census per row (28), grouped by species in the order of the small multiples, then by year. First cell: name of the species.
- **Columns:** Year; Count; Unit (individuals, or active burrows for the European hamster).
- **No total row:** units and census methods differ from one species to another.

## States

- **Loading:** the time it takes for the species JSON to be fetched and the cards to initialize; mount area reserved without layout shift.
- **Error:** failure to fetch the JSON → error message, no silent empty cards.
- **Empty:** not applicable here (the number of species is fixed and small, no filter that could reduce the display to nothing).

## Responsive

- Playback controls always above the small multiples, never overlaid (explicit decision of the user, see scoping discussions, same approach as `light-pollution`): no repositioning needed, they flow normally in the page at all screen sizes, the Play/Pause + speed row simply moving above the year slider on narrow screens.
- Small multiples stacked vertically rather than in a grid on small screens, one card per row.
- Detail card on tap of a card rather than on hover.

## Accessibility (known limitation)

The per-card detail card (hover/tap) is not natively accessible by keyboard or screen reader. Documented as a known limitation, without a fallback, in line with the project's default rule. The Play/Pause button and the year slider remain keyboard accessible (standard `<button>`/`<input type="range">` elements), to allow stopping content that moves continuously without intervention.

Fallback: the table view (see "Table view" above) gives access to the same data, in summary form, by keyboard and screen reader.

## Untranslated content

Scientific species names are not displayed directly in the interface (only localized common names are, see `data-model.md`); no untranslated content to report beyond the general rules.
