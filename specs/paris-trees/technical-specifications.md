# Spécifications techniques : Paris, arbre par arbre

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : implémenté.**

## Source des données

API Opendatasoft de Paris Data (`opendata.paris.fr`), jeux "Les arbres", "Arrondissements" et "Tronçons de voies", plus l'API Overpass (`overpass-api.de`) pour le tracé de la Seine et les arbres des jardins nationaux (les deux seules données du site qui ne viennent pas de Paris Data, voir "Dataset source" dans `data-model.md` pour pourquoi). Voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), malgré la mise à jour hebdomadaire de la source Paris Data : cohérent avec un site entièrement statique, la fraîcheur de la donnée n'est pas un objectif de cette visualisation.

## Rendu

**Canvas 2D, pas SVG**, même choix que `bird-migrations` et `satellites-in-orbit`, ici pour un volume nettement supérieur (194 315 arbres, contre dix à quinze mille pour les satellites).

- Fond de carte : silhouette des vingt arrondissements (`public/data/paris-trees/districts.json`, voir "Prétraitement" dans `data-model.md`), projection `d3.geoMercator` cadrée via `fitExtent`, dessiné sur un canvas de fond redessiné seulement au redimensionnement ou au zoom. **Tranché à l'implémentation :** `geoMercator` plutôt que `geoConicConformal` — sur l'emprise réduite de Paris (moins de 10 km d'un bord à l'autre), la différence de déformation entre les deux projections est visuellement imperceptible ; Mercator retenu par cohérence avec `biodiversity` (même mécanisme de `fitExtent`) et parce qu'il ne demande pas de calibrer de parallèles de référence.
- **Hauteur de la zone de carte :** `max(340px, largeur / 1,87 / 1,4)`, où 1,87 est le ratio largeur/hauteur géographique réel de Paris (dérivé de `geoBounds` sur `districts.json`, corrigé de la latitude) et 1,4 un diviseur supplémentaire **ajouté après une relecture** (retour utilisateur : hauteur jugée trop importante), réglage manuel plutôt que dérivé d'un calcul géométrique — même logique que le diviseur de `bird-migrations` (voir "Proportions de la zone de montage" dans son `technical-specifications.md`), à la différence que celui-ci part d'un ratio déjà proche du carré plutôt que d'un rectangle très allongé.
- **Trame de rues** (`public/data/paris-trees/streets.json`, ajoutée après une première relecture : le fond de carte initial — silhouette + contours d'arrondissement seuls — jugé trop nu) **et la Seine** (`public/data/paris-trees/seine.json`, ajoutée juste après le même retour). Les deux dessinées sur le même canvas de fond, dans le même repère que la silhouette, dans cet ordre : remplissage des arrondissements, Seine (`#a8c5da`, 3 px, `lineCap`/`lineJoin: round` pour un rendu propre aux extrémités et aux méandres), puis trame de rues (`#f4f2ec`, 0,6 px) par-dessus — les rues (et donc les ponts) restent visibles en traversant le fleuve. Le tout **clippé à l'union des polygones d'arrondissement** (`ctx.clip()`) pour qu'un éventuel débord de l'une ou l'autre géométrie ne dépasse jamais la silhouette ; les contours d'arrondissement sont ensuite retracés dans une passe séparée, non clippée (un clip aurait rogné la moitié extérieure du trait de contour). Purement décoratives : aucune interaction, aucune donnée dérivée de ces fichiers (voir "Contraintes de validation" dans `data-model.md`, inchangées). À l'échelle de Paris entier avec tous les genres actifs, ces deux couches restent en grande partie masquées par la densité des points (194 315 arbres) ; elles redeviennent nettement visibles dès qu'on zoome au niveau du quartier/de la rue, ou lorsque peu de genres sont actifs.
- Arbres : canvas de premier plan, un cercle plein par arbre. Points statiques (pas de mouvement, à la différence de `bird-migrations`) : pas d'effet de traînée, un redessin complet du canvas de premier plan suffit à chaque changement de filtre, de recherche ou de zoom/pan.
- Rayon du point : échelle racine carrée (`d3.scaleSqrt`) sur `circumferenceCm`, pour que l'aire du point (pas son rayon) soit proportionnelle à la circonférence — convention standard des cercles proportionnels en cartographie.
- Arbres remarquables : contour distinct (ex. léger halo ou anneau) en plus de la couleur de genre, visible en permanence plutôt que via un filtre séparé (voir "Interactions" dans `functional-specifications.md`).
- Recherche : les arbres hors correspondance passent à une opacité réduite plutôt que d'être retirés du rendu (voir "Interactions" dans `functional-specifications.md`) ; implique un second passage de dessin (arbres non correspondants d'abord, correspondants ensuite par-dessus) pour que les résultats de recherche restent visibles au-dessus du reste de la nuée.
- **Boutons de zoom** (`+`/`−`/réinitialiser, voir "Interactions" dans `functional-specifications.md`), ajoutés après une relecture, repositionnés en haut à droite (initialement en bas à droite) lors d'une relecture suivante : `<button>` standard en surimpression, pas de nouveau mécanisme de zoom — appellent `zoomBehavior.scaleBy` (facteur 1,5, pas de nouveau paramètre par rapport à `scaleExtent`) et `zoomBehavior.transform` (retour à `zoomIdentity` pour la réinitialisation), les deux méthodes déjà utilisées pour le zoom au clic sur un arrondissement. Changement de transform appliqué immédiatement, sans transition animée (cohérent avec le choix déjà fait pour le zoom au clic sur un arrondissement, voir "Nouvelles dépendances" ci-dessous : pas de `d3-transition` ajouté). Désactivés (`disabled`) aux bornes de `scaleExtent`.
- **Jardins nationaux** (`public/data/paris-trees/national-gardens.json`, voir "Interactions" dans `functional-specifications.md`), ajoutés après une nouvelle relecture. Rendus sur le même canvas de premier plan que les arbres municipaux, dans la même passe de dessin (`redraw()`), mais après eux : un anneau creux par arbre (`stroke` sans `fill`, 3 px de rayon fixe) plutôt qu'un disque plein coloré par genre. **Couleur `#a5a4a0`, ajustée sur retour utilisateur** : un gris léger, exactement à mi-chemin entre `BASEMAP_FILL` (`#e4e2da`, le fond de carte) et `OTHER_COLOR` (`#666666`, le gris de la catégorie "Autres") — remplace le choix initial (une teinte sienna hors palette), toujours hors des huit slots de la palette catégorielle. **Décision volontaire, cohérente avec le refus d'une neuvième/dixième teinte générée pour Bouleau et Cyprès** (voir "Palette" ci-dessus) : ces ~3 000 points n'ont, pour l'essentiel, ni genre ni aucun autre attribut fiable (voir "Dataset source" dans `data-model.md`), donc pas de sens à leur assigner une couleur de genre au même titre que les 194 315 arbres municipaux ; la forme du marqueur (anneau, pas disque) signale une nature de donnée différente, pas seulement une neuvième catégorie. Positions précalculées une fois par redimensionnement (`buildGardenPositions`, même mécanisme que `buildSpatialIndex` pour les arbres municipaux), mais sans grille d'index : volume (~3 000) trop faible pour la justifier, un simple tableau parcouru en entier suffit au tracé comme au survol. Case à cocher **activée par défaut, ajusté sur retour utilisateur** (initialement désactivée) ; n'entre dans aucun calcul du filtre genre, de la recherche ou du compteur d'arbres visibles (voir "Interactions" dans `functional-specifications.md`). Priorité de survol/clic sur les arbres municipaux quand la case est cochée, cohérent avec l'ordre d'empilement visuel (dessinés par-dessus).
- **Note de bas de page sur les jardins nationaux, déplacée après une relecture** : le texte de mise en garde (couverture partielle, positions approximatives) n'est plus un texte conditionnel affiché seulement case cochée, mais un `<p>` permanent après la carte, toujours visible que la case soit cochée ou non, avec un renvoi `*` sur le libellé de la case (élément `<sup>`) et en tête du texte.

- **Message d'état "vide"** (voir "États" dans `functional-specifications.md`) : `position: absolute; inset: 0` sur le canvas de premier plan, comme sur les autres visualisations du site à ce genre de message. **Corrigé après un retour utilisateur** (bug repéré en testant l'ajout des jardins nationaux, confirmé ensuite par l'utilisateur en usage normal) : sans `pointer-events: none` sur ce message, il interceptait silencieusement tout événement pointeur sur le canvas en dessous tant qu'il restait affiché, y compris le geste de `d3-zoom` (zoom/pan à la molette, glisser tactile) — un filtre qui vide accidentellement la sélection de genres rendait la carte insensible à la souris/au tactile jusqu'à réactiver au moins un genre. Limite pré-existante, partagée avec `bird-migrations` (même construction), non corrigée là faute de demande sur cette visualisation.

## Format de données

**Encodage en tableaux parallèles** (« structure of arrays »), pas un tableau d'objets (voir "Format de sortie" dans `data-model.md`) : à ce volume (194 315 arbres), la répétition des noms de champs dans un tableau d'objets JSON classique gonflerait sensiblement la taille du fichier par rapport à des tableaux de valeurs homogènes, sans changer la complexité d'implémentation côté client (l'indexation par position reste directe).

**Taille mesurée à l'implémentation :** 11,7 Mo non compressés, 2,2 Mo compressés (gzip), ordre de grandeur nettement supérieur aux autres visualisations du site (`satellites-in-orbit` : quelques centaines de kilooctets ; `bird-migrations` : 200 Ko), attendu compte tenu du volume. Compaction appliquée, au-delà des coordonnées arrondies à six décimales : `genusId` encodé en index numérique dans `genera` plutôt qu'en chaîne, et surtout `commonName`/`genusLabel`/`species`/le texte de recherche dédupliqués dans une table `species` à part (1 093 combinaisons distinctes pour 194 315 arbres, moins de 1 % de valeurs uniques, voir "Prétraitement" dans `data-model.md`) — c'est cette déduplication qui a le plus réduit la taille du fichier (24,2 Mo avant, 11,7 Mo après), la répétition de ces chaînes à travers presque 200 000 arbres dominant largement le poids du fichier. `developmentStage` et `domain` restent des chaînes brutes répétées (pas indexées) : leur cardinalité est déjà faible (cinq et neuf valeurs distinctes), gzip les compresse efficacement, et les indexer aurait ajouté une table de correspondance supplémentaire pour un gain marginal. Pas de format binaire (typed arrays, protobuf...) retenu : la taille compressée obtenue reste cohérente avec le reste du site (fichiers de données statiques lisibles), sans le justifier.

`streets.json` (trame de rues, voir "Rendu" ci-dessus) : 1,2 Mo non compressé, 391 Ko compressé (gzip) — un fichier annexe, pas soumis à la même contrainte de volume que `trees.json`. `seine.json` (tracé du fleuve, bras autour des îles compris) : 10 Ko, négligeable. `national-gardens.json` (arbres des jardins nationaux) : 105 Ko, également négligeable au regard de `trees.json`.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection, tracé du fond de carte (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur catégorielle par genre (`scaleOrdinal`), échelle de taille des points (`scaleSqrt`) | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile), zoom programmatique au clic sur un arrondissement et aux boutons de zoom (voir "Rendu" ci-dessus) | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au canvas | Idem |

Pas de `d3-timer` ici : contrairement aux deux autres visualisations à volume de points important du site, celle-ci n'anime rien (angle "exploration libre", pas de chronologie à rejouer, voir `functional-specifications.md`).

## Palette

**Exception documentée à la règle générale de la palette dataviz** (voir "Palette dataviz" dans `style-guide.md`), même décision que pour `satellites-in-orbit` (voir "Palette" dans son `technical-specifications.md`) : la carte est une disposition où les points peuvent se toucher, qui ne garantit normalement que trois teintes distinguables en daltonisme. Cette visualisation utilise malgré tout les huit slots de la palette catégorielle pour les genres dominants, décision explicite de l'utilisateur (voir échanges de cadrage), compensée par :

- une légende toujours visible (couleur + nom de genre, pas la couleur seule) ;
- le filtre genre (voir "Interactions" dans `functional-specifications.md`), qui permet d'isoler un ou plusieurs genres à la fois.

| Slot | Teinte | Genre |
|---|---|---|
| 1-6 | Bleu, orange, aqua, jaune, magenta, vert | Platane, Marronnier, Tilleul, Érable, Sophora, Cerisier à fleurs (les six genres les plus fréquents, voir "Regroupement par genre" dans `data-model.md`) |
| 7-8 | Violet, rouge | Bouleau, Cyprès (pas parmi les huit genres les plus fréquents, mais ajoutés sur demande explicite de l'utilisateur — voir "Regroupement par genre" dans `data-model.md` pour la décision, prise après une deuxième relecture) |
| — | Gris neutre (`--dv-ink-secondary`), hors palette | "Autres" (dont Chêne et Frêne, déplacés pour faire place à Bouleau et Cyprès) |

Assignation par ordre d'apparition dans `genera` (voir "Format de sortie" dans `data-model.md`), même mécanisme que les deux autres visualisations à palette catégorielle du site.

**Neuvième et dixième teinte écartées, contrainte plus stricte que prévu au premier passage :** en discutant l'ajout de Bouleau et Cyprès, la première option envisagée était de les ajouter en plus des huit genres déjà en place (dix genres distincts au total). Le skill dataviz du projet est catégorique sur ce point, au-delà de la règle de `style-guide.md` : *"A 9th series is never a generated hue — it folds into 'Other,' small multiples, or composite encoding"* — sur une disposition où tous les points peuvent se toucher (nuage de points, cas déjà signalé ci-dessus), ce n'est pas qu'une question de convention graphique, la séparation en daltonisme n'est plus garantie quel que soit l'agencement des teintes. Utilisateur informé de cette contrainte plus stricte que celle initialement présentée, a tranché pour rester à huit slots (remplacement de deux genres existants) plutôt que de forcer une dixième teinte.

## Recherche

Correspondance simple par sous-chaîne, insensible à la casse et aux accents, sur le champ `searchText` précalculé au prétraitement (voir "Prétraitement" dans `data-model.md`) : pas de librairie de recherche floue ajoutée (`Fuse.js` ou équivalent), le besoin (retrouver une espèce par son nom approximatif) ne justifie pas cette dépendance supplémentaire à ce stade.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site (voir "Hydratation" dans leurs `technical-specifications.md` respectifs).

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom` (même mécanisme que `bird-migrations`) ; fiche de détail déclenchée par `pointerdown`/`click` plutôt que `pointermove` quand `event.pointerType === 'touch'`.

## Points résolus à l'implémentation

- Les huit genres dominants réels et leur nom commun associé : voir "Regroupement par genre" dans `data-model.md`.
- Taille de `trees.json` et compaction retenue : voir "Format de données" ci-dessus.
- Proportion d'arbres sans coordonnées valides : 0 (vérifié par agrégation, voir "Prétraitement" dans `data-model.md`) ; en revanche 11,4 % du jeu source s'est révélé hors du périmètre géographique des vingt arrondissements et a été écarté pour une autre raison (voir "Périmètre retenu" dans `data-model.md`).
- Projection cartographique : `geoMercator`, voir "Rendu" ci-dessus.

**Limite connue non validée :** le temps de chargement et de premier rendu réels sur un appareil mobile d'entrée de gamme n'ont pas pu être mesurés sur un appareil physique à l'implémentation ; l'indicateur de progression (voir "États" dans `functional-specifications.md`) est en place mais son calibrage reste indicatif, à ajuster si des retours d'usage réel le signalent nécessaire.
