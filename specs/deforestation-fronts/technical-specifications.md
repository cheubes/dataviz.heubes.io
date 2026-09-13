# Spécifications techniques : Les fronts de la déforestation

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Global Forest Change (Hansen et al.), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Citation obligatoire ("Hansen/UMD/Google/USGS/NASA" + référence de la publication) dans le bloc de crédit des sources de la page.

## Rendu

**SVG**, même famille de choix que `biodiversity`/`light-pollution` : volume attendu modeste par région (grille agrégée, pas des pixels bruts, voir "Prétraitement" dans `data-model.md`), trois cartes plutôt qu'une seule mais chacune de taille comparable à la grille France de `biodiversity`.

- Trois projections indépendantes (`d3.geoMercator()` avec `fitExtent` propre à chaque région, voir "Bounding box par front" ci-dessous), pas une seule projection mondiale partagée : cohérent avec la décision de cadrage propre à chaque carte (voir "Composition" dans `functional-specifications.md`).
- Chaque cellule de grille est un chemin SVG dont le remplissage suit la palette séquentielle (voir "Palette" ci-dessous), recalculé à chaque frame selon l'année simulée courante.
- Fond de carte : silhouette de chaque région, à produire au prétraitement (pas de réutilisation possible des silhouettes existantes du site — `biodiversity`/`monument-layers`/`tgv-punctuality` couvrent la France, `bird-migrations`/`animal-migrations` couvrent le monde mais à une résolution et une projection pensées pour une vue globale, pas pour un zoom régional serré sur l'Amazonie ou Bornéo-Sumatra), même technique d'extraction que `bird-migrations` (`world-atlas`/Natural Earth, objet `land`, retopologisé sur la seule emprise régionale).

## Palette

**Palette personnalisée, à valider avec le script du skill dataviz avant implémentation** (voir "Palette dataviz" dans `style-guide.md` : une visualisation qui a besoin d'une palette différente du défaut séquentiel bleu la documente et la valide plutôt que d'improviser). Dégradé vert (forêt intacte) → teinte d'alerte plus sombre (perte cumulée élevée), pas le bleu séquentiel par défaut : la teinte verte porte un sens réaliste ici (forêt), comparable à la palette propre à `flower-phenology` plutôt qu'à l'usage sans exception de `bird-migrations`.

- Cellule à 0 % de perte cumulée : teinte verte pleine (forêt intacte).
- Cellule à 100 % de perte cumulée : teinte d'alerte la plus sombre de l'échelle retenue.
- Échelle continue entre les deux (`d3.scaleLinear<string>`), pas de paliers discrets.

## Animation

- Boucle `d3-timer`, échelle temporelle linéaire sur le domaine `[2000, dernière année disponible]`, même principe que `light-pollution`/`glacier-retreat` (ici : passage unique, pas de bouclage, comme ces deux précédents plutôt qu'une boucle continue comme `bird-migrations`).
- Contrairement à `glacier-retreat` (interpolation entre mesures espacées dans le temps), les données ici ont déjà un point par année pour chaque cellule (voir "Format de sortie" dans `data-model.md`) : pas d'interpolation nécessaire entre deux points, la couleur de chaque cellule prend directement la valeur `lossByYear` de l'année simulée courante (arrondie à l'année la plus proche).
- Les trois cartes partagent la même chronologie simulée, mises à jour ensemble à chaque frame.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Trois projections indépendantes, tracé des fonds de carte (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur séquentielle personnalisée (voir "Palette" ci-dessus) | Idem |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

Pas de `d3-zoom`/`d3-selection` (voir "Interactions" dans `functional-specifications.md` : pas de pan/zoom, chaque carte reste cadrée sur sa région entière).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Points à valider à l'implémentation

- Bounding box précise de chacun des trois fronts (voir "Sélection des fronts" dans `data-model.md`), une fois les tuiles Hansen réelles inspectées.
- Résolution de la grille par région (nombre de cellules), en tenant la balance entre finesse du détail et taille du fichier de sortie.
- Seuil de couvert forestier retenu pour `treecover2000` (30 % pressenti, voir "Bandes du dataset Hansen utilisées" dans `data-model.md`).
- Validation de la palette personnalisée verte → alerte via le script du skill dataviz (voir "Palette" ci-dessus), avant tout développement du rendu.
- Volume réel des tuiles Hansen à télécharger par région (plusieurs tuiles de 10° × 10° possibles selon l'étendue de chaque front).
