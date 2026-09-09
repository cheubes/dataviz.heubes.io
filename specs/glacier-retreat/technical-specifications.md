# Spécifications techniques : Le recul des glaciers

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Base Fluctuations of Glaciers (FoG) du WGMS, voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build. Citation obligatoire (voir modèle de citation WGMS) dans le bloc de crédit des sources de la page.

## Rendu

**SVG, pas Canvas** : quatre à six formes seulement (voir "Sélection des glaciers" dans `data-model.md`), aucun rapport avec le volume de points qui a justifié Canvas sur `bird-migrations`, `satellites-in-orbit`, `paris-trees` ou `monument-layers`.

- Chaque glacier est une forme SVG stylisée (une "langue glaciaire" illustrée, path ou groupe de formes simples, pas une géométrie cartographique réelle — voir "Composition" et "Échelle" dans `functional-specifications.md`), positionnée sous un point fixe de départ sur une ligne de crête commune.
- La longueur visible de chaque forme est pilotée par une transformation (`scaleY` ou ajustement direct des points du path selon le cas) recalculée à chaque frame de l'animation à partir de `lengthM` (voir "Format de sortie" dans `data-model.md`) converti en pixels via une échelle linéaire (`d3.scaleLinear`) partagée entre tous les glaciers, garantissant l'échelle réelle proportionnelle entre eux (voir "Échelle" dans `functional-specifications.md`).
- Pas de fond de carte, pas de projection géographique (`d3-geo` non nécessaire) : la scène est une illustration stylisée, pas une carte des Alpes à l'échelle.

## Animation

- Boucle `d3-timer`, échelle temporelle linéaire sur le domaine `[année la plus ancienne parmi les glaciers retenus, aujourd'hui]`, même principe que `satellites-in-orbit` et `monument-layers` (passage unique, pas de bouclage).
- Pour chaque glacier à chaque frame : interpolation linéaire (`d3.interpolateNumber`) entre les deux points de `series` qui encadrent l'année simulée courante, pas un simple saut d'une mesure à l'autre — donne un mouvement de recul fluide malgré des mesures parfois espacées de plusieurs années (voir "Sélection des glaciers" dans `data-model.md`).
- Un glacier dont la série commence plus tard que l'année simulée de départ (premières mesures à des dates différentes selon les glaciers) reste à sa longueur de départ jusqu'à l'année de sa première mesure, puis commence à évoluer : comportement attendu, pas un cas d'erreur.

## Palette

Palette catégorielle standard (voir "Palette dataviz" dans `style-guide.md`), une teinte par glacier. Pas d'exception à documenter ici (à la différence de `satellites-in-orbit` et `paris-trees`) : les formes ne se touchent pas dans cette scène illustrée (chaque glacier occupe sa propre position sur la ligne de crête), et leur nombre restreint (quatre à six, voir "Sélection des glaciers" dans `data-model.md`) reste bien en dessous des huit slots disponibles.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-scale` | Échelle de couleur catégorielle par glacier, échelle linéaire longueur → pixels | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Points à valider à l'implémentation

- Liste définitive des glaciers retenus (voir "Sélection des glaciers" dans `data-model.md`), une fois les séries WGMS réelles inspectées.
- Format exact du champ `FRONT_VARIATION` sur les glaciers retenus (delta annuel ou variation cumulée, voir "Point d'attention sur le format WGMS" dans `data-model.md`).
- Source retenue pour la longueur de référence absolue de chaque glacier (voir "Longueur de référence absolue" dans `data-model.md`).
- Forme illustrative exacte de la "langue glaciaire" (niveau de détail, style graphique), à concevoir visuellement plutôt qu'à spécifier ici a priori.
