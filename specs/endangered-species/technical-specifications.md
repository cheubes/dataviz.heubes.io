# Spécifications techniques : Ce qu'il en reste

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Historique des évaluations IUCN Red List par espèce, voir "Dataset source" et "Réserve sur la licence" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build.

## Rendu

**SVG, pas Canvas** : quatre à six petits multiples seulement (voir "Sélection des espèces" dans `data-model.md`), aucun rapport avec le volume qui a justifié Canvas sur les visualisations à carte du site. **Pas de carte géographique** ici, à la différence de `bird-migrations`, `animal-migrations`, `monument-layers` ou `tgv-punctuality` : l'angle retenu (voir "Angle retenu" dans `data-model.md`) est délibérément sans dimension spatiale, chaque espèce est une carte de petits multiples, pas un point sur un planisphère.

- Chaque carte d'espèce affiche une grille d'icônes SVG simples (silhouette animale générique, pas une icône par espèce — voir "Points à valider à l'implémentation" ci-dessous), une icône représentant un nombre fixe d'individus propre à cette espèce (ex. 1 icône = 10 individus pour le tigre, 1 icône = 1 individu pour la vaquita), ce ratio choisi pour que le nombre d'icônes affichées reste dans une fourchette lisible (grossièrement 10 à 100 icônes) quelle que soit l'espèce.
- Le nombre d'icônes affichées à un instant simulé donné est calculé par interpolation linéaire (`d3.interpolateNumber`, même principe que `glacier-retreat`) entre les deux réévaluations avec population connue qui encadrent cet instant, puis divisé par le ratio icône/individus de l'espèce et arrondi.
- La teinte de fond de la carte suit la catégorie de menace de la réévaluation la plus proche de l'instant simulé courant (voir "Palette" ci-dessous), indépendamment de la disponibilité d'une estimation de population pour cette réévaluation (voir "Réévaluations sans estimation de population" dans `data-model.md`).

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`), même famille de choix que `monument-layers`/`light-pollution`/`tgv-punctuality` : la catégorie de menace est un ordre continu (préoccupation mineure → en danger critique), pas des catégories à distinguer deux à deux dans une même disposition. Pas d'exception à documenter ici.

- Palier le plus clair pour "préoccupation mineure", le plus foncé pour "en danger critique"/"éteint à l'état sauvage", appliqué au fond de chaque carte d'espèce.
- Les icônes elles-mêmes restent dans une teinte neutre constante (`--dv-ink-primary` ou équivalent), pas recolorées selon la catégorie : seul le fond de la carte porte cette information, pour ne pas surcharger visuellement une grille déjà dense d'icônes.

## Animation

- Boucle `d3-timer`, échelle temporelle linéaire sur le domaine `[réévaluation la plus ancienne toutes espèces confondues, réévaluation la plus récente]`, même principe que `glacier-retreat` (passage unique, pas de bouclage).
- Toutes les cartes partagent la même chronologie simulée : une espèce dont les réévaluations démarrent plus tard que les autres reste à son état initial (première réévaluation connue) jusqu'à cette date, comme les glaciers de `glacier-retreat` dont la série commence plus tard.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-scale` | Échelle de couleur séquentielle (catégorie de menace → teinte de fond) | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

Pas de `d3-geo`, `d3-zoom` ni `d3-selection` ici (voir "Rendu" ci-dessus : pas de carte géographique, pas de pan/zoom).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Points à valider à l'implémentation

- Texte exact des conditions d'utilisation IUCN (voir "Réserve sur la licence" dans `data-model.md`), avant tout développement.
- Structure exacte de l'historique d'évaluations exposé par l'API IUCN (voir "Champs nécessaires par espèce et par réévaluation" dans `data-model.md`).
- Liste définitive des espèces retenues, une fois les historiques réels inspectés (voir "Sélection des espèces" dans `data-model.md`).
- Style graphique exact des icônes (silhouette générique unique vs silhouette propre à chaque espèce), à concevoir visuellement plutôt qu'à spécifier ici a priori.
- Ratio icône/individus par espèce, une fois les ordres de grandeur réels de population connus.
