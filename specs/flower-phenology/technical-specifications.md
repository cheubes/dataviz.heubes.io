# Spécifications techniques : Le calendrier des fleurs

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Rendu

D3 v7 seul (`d3-shape` pour les arcs, `d3-scale` pour l'échelle angulaire des jours de l'année, `d3-transition` pour l'animation de bascule entre paires de décennies). Rendu SVG : volume de données faible (au plus 15 espèces × 2 décennies visibles), pas d'enjeu de performance justifiant Canvas ici, à la différence des migrations.

Pas de carte, pas de TopoJSON, pas de `topojson-client` : seule visualisation des trois sans fond géographique.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3` (v7) ou modules `d3-*` ciblés (`d3-shape`, `d3-scale`, `d3-transition`) | Arcs, échelle angulaire, transitions | Scopée à cette visualisation (île Astro) |

## Palette (exception documentée)

Palette bespoke "couleur réelle de la fleur" plutôt que la palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`, qui permet une exception documentée et validée pour un besoin propre à une visualisation).

**Justification :** la palette officielle est plafonnée à huit teintes fixes ("jamais cyclée au-delà"), incompatible avec jusqu'à 15 espèces affichées simultanément ; et le concept éditorial de cette pièce repose sur la couleur comme évocation directe de la fleur elle-même (jaune du forsythia, rouge du coquelicot...), pas comme code catégoriel arbitraire.

**Validation requise avant implémentation :** chaque couleur de `flowerColor` (voir `data-model.md`) passée au script du skill dataviz (validateur de contraste), contre le fond retenu pour le calendrier (voir "Fond du calendrier" ci-dessous). Les trois teintes très claires du draft d'origine (prunellier, muguet, anémone, toutes proches du blanc pur) ont déjà été légèrement teintées dans `data-model.md` en anticipation de ce contrôle, à revalider malgré tout à l'implémentation.

## Fond du calendrier

Non tranché : le draft d'origine suggère un fond sombre pour la vignette d'accueil (`--dv-blue`, cohérent avec les couleurs vives des fleurs qui y ressortent), mais le reste du site est en thème clair fixe (voir "Couleurs" dans `style-guide.md` : "le site reste toujours en thème clair"). Deux options à trancher à l'implémentation :

- Fond clair standard (`--dv-surface`), cohérent avec le reste de la page, mais contraste plus faible pour les teintes claires de la palette bespoke.
- Fond sombre propre à la zone de montage de cette visualisation (autorisé : "traitement visuel propre à chaque visualisation", voir "Page de visualisation" dans `style-guide.md`), reprenant l'esthétique de la vignette, mais crée une rupture visuelle avec le reste de la page en thème clair.

Le choix retenu conditionne les couleurs finales validées par le script du skill dataviz (voir "Palette" ci-dessus).

## Hydratation

`client:visible`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.
