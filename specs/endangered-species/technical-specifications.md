# Spécifications techniques : Ce qu'il en reste

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Une source officielle par espèce (voir "Dataset source" dans `data-model.md`), pas un historique IUCN Red List unique (source initialement retenue, abandonnée : voir "Historique : abandon de la source IUCN Red List" dans `data-model.md`). Récupération ponctuelle au moment du prétraitement, pas à chaque build.

## Rendu

**SVG, pas Canvas** : quatre à six petits multiples seulement (voir "Sélection des espèces" dans `data-model.md`), aucun rapport avec le volume qui a justifié Canvas sur les visualisations à carte du site. **Pas de carte géographique** ici, à la différence de `bird-migrations`, `animal-migrations`, `monument-layers` ou `tgv-punctuality` : l'angle retenu (voir "Angle retenu" dans `data-model.md`) est délibérément sans dimension spatiale, chaque espèce est une carte de petits multiples, pas un point sur un planisphère.

**Rendu basé uniquement sur les effectifs** (décision explicite de l'utilisateur, voir échanges de cadrage) : pas de dimension catégorielle affichée (l'ancienne catégorie de menace IUCN disparaît avec l'abandon de cette source, voir `data-model.md`), pas de mapping couleur ↔ donnée. Le nombre d'icônes affichées porte seule le message ; le fond de chaque carte reste une couleur neutre fixe de la charte graphique (voir "Couleurs" dans `style-guide.md`), identique pour toutes les cartes et à tout instant.

- Chaque carte d'espèce affiche une grille d'icônes SVG simples (silhouette animale générique, pas une icône par espèce — voir "Points à valider à l'implémentation" ci-dessous), une icône représentant un nombre fixe d'individus propre à cette espèce (ex. 1 icône = 10 individus pour le tigre, 1 icône = 1 individu pour la vaquita), ce ratio choisi pour que le nombre d'icônes affichées reste dans une fourchette lisible (grossièrement 10 à 100 icônes) quelle que soit l'espèce.
- Le nombre d'icônes affichées à un instant simulé donné est calculé par interpolation linéaire (`d3.interpolateNumber`) entre les deux points de mesure qui encadrent cet instant, puis divisé par le ratio icône/individus de l'espèce et arrondi.
- Les icônes restent dans une teinte neutre constante (`--dv-ink-primary` ou équivalent).

## Animation

- Boucle `d3-timer`, échelle temporelle linéaire (`d3-scale`) sur le domaine `[point de mesure le plus ancien toutes espèces confondues, point de mesure le plus récent]`, passage unique, pas de bouclage.
- Toutes les cartes partagent la même chronologie simulée : une espèce dont les mesures démarrent plus tard que les autres reste à son état initial (premier point connu) jusqu'à cette date.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-scale` | Échelle temporelle linéaire (progression de l'animation → année simulée) | Scopée à cette visualisation (île Astro) |
| `d3-interpolate` | Interpolation de la population entre deux points de mesure connus (`interpolateNumber`) | Idem |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

Pas de `d3-geo`, `d3-zoom` ni `d3-selection` ici (voir "Rendu" ci-dessus : pas de carte géographique, pas de pan/zoom).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Points à valider à l'implémentation

- URL, licence exacte et date de récupération de chaque source par espèce (voir "Dataset source" dans `data-model.md`).
- Liste définitive des espèces retenues, une fois les historiques réels inspectés (voir "Sélection des espèces" dans `data-model.md`).
- Traitement du grand hamster d'Alsace (terriers actifs, pas des individus) et des fourchettes de la vaquita (voir "Points d'attention à l'implémentation" dans `data-model.md`).
- Style graphique exact des icônes (silhouette générique unique vs silhouette propre à chaque espèce), à concevoir visuellement plutôt qu'à spécifier ici a priori.
- Ratio icône/individus par espèce, une fois les ordres de grandeur réels de population connus.
