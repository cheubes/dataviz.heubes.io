# Spécifications techniques : Paris, arbre par arbre

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

API Opendatasoft de Paris Data (`opendata.paris.fr`), jeux "Les arbres" et "Arrondissements", voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), malgré la mise à jour hebdomadaire de la source : cohérent avec un site entièrement statique, la fraîcheur de la donnée n'est pas un objectif de cette visualisation.

## Rendu

**Canvas 2D, pas SVG**, même choix que `bird-migrations` et `satellites-in-orbit`, ici pour un volume nettement supérieur (219 000 arbres, contre dix à quinze mille pour les satellites).

- Fond de carte : silhouette des vingt arrondissements (`public/data/paris-trees/districts.json`, voir "Prétraitement" dans `data-model.md`), projection `d3.geoMercator` (ou `d3.geoConicConformal`, à confirmer à l'implémentation selon le rendu visuel obtenu sur l'emprise réduite de Paris) cadrée via `fitExtent`, dessiné sur un canvas de fond redessiné seulement au redimensionnement ou au zoom.
- Arbres : canvas de premier plan, un cercle plein par arbre. Points statiques (pas de mouvement, à la différence de `bird-migrations`) : pas d'effet de traînée, un redessin complet du canvas de premier plan suffit à chaque changement de filtre, de recherche ou de zoom/pan.
- Rayon du point : échelle racine carrée (`d3.scaleSqrt`) sur `circumferenceCm`, pour que l'aire du point (pas son rayon) soit proportionnelle à la circonférence — convention standard des cercles proportionnels en cartographie.
- Arbres remarquables : contour distinct (ex. léger halo ou anneau) en plus de la couleur de genre, visible en permanence plutôt que via un filtre séparé (voir "Interactions" dans `functional-specifications.md`).
- Recherche : les arbres hors correspondance passent à une opacité réduite plutôt que d'être retirés du rendu (voir "Interactions" dans `functional-specifications.md`) ; implique un second passage de dessin (arbres non correspondants d'abord, correspondants ensuite par-dessus) pour que les résultats de recherche restent visibles au-dessus du reste de la nuée.

## Format de données

**Encodage en tableaux parallèles** (« structure of arrays »), pas un tableau d'objets (voir "Format de sortie" dans `data-model.md`) : à ce volume (219 000 arbres), la répétition des noms de champs dans un tableau d'objets JSON classique gonflerait sensiblement la taille du fichier par rapport à des tableaux de valeurs homogènes, sans changer la complexité d'implémentation côté client (l'indexation par position reste directe).

Taille attendue : plusieurs mégaoctets non compressés, ordre de grandeur nettement supérieur aux autres visualisations du site (`satellites-in-orbit` : quelques centaines de kilooctets ; `bird-migrations` : 200 Ko). **À mesurer précisément à l'implémentation**, avec des pistes de compaction si nécessaire : arrondir les coordonnées à une précision suffisante (six décimales, déjà sous le mètre), encoder `genusId` en index numérique plutôt qu'en chaîne, ne garder `commonName`/`genusLabel`/`species` que pour les arbres où c'est nécessaire à la recherche plutôt que pour chacun des 219 000. Pas de format binaire (typed arrays, protobuf...) envisagé à ce stade : resterait cohérent avec le reste du site (fichiers de données statiques lisibles) tant que la taille mesurée ne l'impose pas ; à rediscuter si la mesure réelle s'avère problématique.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection, tracé du fond de carte (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur catégorielle par genre (`scaleOrdinal`), échelle de taille des points (`scaleSqrt`) | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile), zoom programmatique au clic sur un arrondissement | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au canvas | Idem |

Pas de `d3-timer` ici : contrairement aux deux autres visualisations à volume de points important du site, celle-ci n'anime rien (angle "exploration libre", pas de chronologie à rejouer, voir `functional-specifications.md`).

## Palette

**Exception documentée à la règle générale de la palette dataviz** (voir "Palette dataviz" dans `style-guide.md`), même décision que pour `satellites-in-orbit` (voir "Palette" dans son `technical-specifications.md`) : la carte est une disposition où les points peuvent se toucher, qui ne garantit normalement que trois teintes distinguables en daltonisme. Cette visualisation utilise malgré tout les huit slots de la palette catégorielle pour les genres dominants, décision explicite de l'utilisateur (voir échanges de cadrage), compensée par :

- une légende toujours visible (couleur + nom de genre, pas la couleur seule) ;
- le filtre genre (voir "Interactions" dans `functional-specifications.md`), qui permet d'isoler un ou plusieurs genres à la fois.

| Slot | Teinte | Genre |
|---|---|---|
| 1-8 | Bleu, orange, aqua, jaune, magenta, vert, violet, rouge | Les huit genres dominants, à déterminer à l'implémentation (voir "Regroupement par genre" dans `data-model.md`) |
| — | Gris neutre (`--dv-ink-secondary`), hors palette | "Autres" |

Assignation par ordre d'apparition dans `genera` (voir "Format de sortie" dans `data-model.md`), même mécanisme que les deux autres visualisations à palette catégorielle du site.

## Recherche

Correspondance simple par sous-chaîne, insensible à la casse et aux accents, sur le champ `searchText` précalculé au prétraitement (voir "Prétraitement" dans `data-model.md`) : pas de librairie de recherche floue ajoutée (`Fuse.js` ou équivalent), le besoin (retrouver une espèce par son nom approximatif) ne justifie pas cette dépendance supplémentaire à ce stade.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site (voir "Hydratation" dans leurs `technical-specifications.md` respectifs).

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom` (même mécanisme que `bird-migrations`) ; fiche de détail déclenchée par `pointerdown`/`click` plutôt que `pointermove` quand `event.pointerType === 'touch'`.

## Points à valider à l'implémentation

- Les huit genres dominants réels et leur nom commun associé (voir "Regroupement par genre" dans `data-model.md`).
- Taille exacte de `trees.json` une fois généré, et nécessité ou non des pistes de compaction listées dans "Format de données" ci-dessus.
- Proportion d'arbres sans coordonnées valides, écartés au prétraitement (voir "Prétraitement" dans `data-model.md`).
- Projection cartographique la mieux adaptée à l'emprise réduite de Paris (`geoMercator` vs `geoConicConformal`), à trancher visuellement plutôt qu'a priori.
- Temps de chargement et de premier rendu réels du volume complet sur un appareil mobile d'entrée de gamme, pour calibrer l'indicateur de progression (voir "États" dans `functional-specifications.md`).
