# Spécifications techniques : La ruée vers l'orbite

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : implémenté.**

## Source des données

CelesTrak SATCAT, catalogue complet au format CSV (`https://celestrak.org/pub/satcat.csv`, voir "Dataset source" et "Prétraitement" dans `data-model.md` pour le choix de ce format plutôt que `records.php`). Récupération ponctuelle au moment du prétraitement, pas à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) : conforme à la politique d'usage de CelesTrak, qui décourage les requêtes répétées et recommande de ne récupérer les données qu'au moment du besoin. Citation d'attribution (CelesTrak, USSPACECOM/Space-Track.org) dans le bloc de crédit des sources de la page (voir "Dataset source" dans `data-model.md` pour la décision de licence).

## Rendu

**Canvas 2D, pas SVG**, même choix que `bird-migrations` et pour la même raison : volume de points important (20 020, voir `data-model.md`), hors de portée d'un rendu SVG performant.

- Globe : silhouette terrestre réelle (continents/océans, sans frontières par pays), projection orthographique `d3-geo` (`geoOrthographic`, `clipAngle(90)` pour ne montrer que l'hémisphère visible), sur un canvas de fond dédié. À la différence du choix initial (cercle uni à dégradé radial, sans géographie), ce canvas est désormais redessiné à chaque frame plutôt qu'au seul redimensionnement, pour porter la rotation continue (voir "Animation" ci-dessous). Fond de carte `public/data/satellites-in-orbit/basemap.json`, objet TopoJSON `land` (une seule géométrie fusionnée) issu du paquet `world-atlas` (données Natural Earth, domaine public), converti en GeoJSON côté client via `topojson-client` : même source et même traitement (réduction au seul objet `land`) que le fond de carte de `bird-migrations`, récupéré indépendamment pour cette visualisation plutôt que partagé entre les deux (chaque visualisation a ses propres données sous `public/data/<viz-slug>/`, voir "Structure des fichiers" dans `technical-specifications.md` général). 92 Ko.
- Nuée de points : canvas de premier plan, superposé au canvas du globe. À la différence de `bird-migrations` (points mobiles avec effet de traînée), les points ici sont statiques une fois apparus : pas besoin d'effacer/redessiner l'ensemble de la nuée à chaque frame. Chaque nouveau point (satellite dont la date de lancement simulée vient d'être atteinte) est simplement peint par-dessus le canvas existant. Un changement de filtre zone, un déplacement manuel du curseur d'année (voir "Curseur d'année" ci-dessous) ou une reprise de passage (voir "Animation" ci-dessous) vide le canvas de premier plan et reconstruit la nuée déjà accumulée en une seule passe avant de reprendre l'accumulation frame par frame. Le halo de points ne suit pas la rotation du globe (voir "Positionnement des points" ci-dessous) : les deux canvas sont animés indépendamment, seul celui du globe tourne.
- D3 utilisé pour les calculs (échelle de couleur catégorielle par zone via `d3-scale`, échelle temporelle pour l'animation, projection géographique et tracé de chemin via `d3-geo`, boucle d'animation via `d3-timer`), pas pour le rendu DOM des points ni des continents.
- Couleurs du globe, décoratives, hors palette dataviz (voir "Palette" ci-dessous pour la distinction avec la palette catégorielle des zones) : océan `#b7c2ca`, continents `#c7c0a8`, contour `#8b959c` — tons neutres et désaturés, choisis pour que les points de couleur vive de la nuée restent le seul élément saturé de la composition.

## Positionnement des points

Pas d'orbite réelle représentée (décision explicite, voir échanges de cadrage) : chaque satellite occupe une position en halo autour du globe, pas sa position orbitale réelle.

- Angle : tiré uniformément entre 0 et 360°.
- Rayon : tiré dans une bande fixe au-delà du rayon du globe (ex. entre 1,15 et 1,6 fois le rayon du globe), pour donner un effet de profondeur à la nuée sans porter de signification orbitale (pas de correspondance avec l'altitude réelle).
- Tirage déterministe, dérivé de l'index du satellite dans `satellites.json` (ex. générateur pseudo-aléatoire à seed fixe) plutôt qu'un vrai `Math.random()` : la disposition reste identique entre un chargement de page et une reprise de passage (voir "Animation" ci-dessous), pas de re-tirage à chaque boucle.
- Position fixe dans le référentiel de l'écran, indépendante de la rotation du globe (voir "Rendu" ci-dessus) : un point ne suit pas la silhouette continentale sous-jacente au fil de sa rotation, cohérent avec l'absence de signification orbitale de sa position.

## Animation

- Boucle `d3-timer`, pilotée par une date simulée continue (pas un compteur de jours cyclique comme `bird-migrations` : ici l'échelle couvre l'intégralité de 1957 à la date de récupération du catalogue, voir `generatedAt` dans `data-model.md`).
- Mapping temps de lecture écoulé → temps simulé, linéaire sur l'échelle complète des années couvertes (`d3-scale`, `scaleLinear`, domaine en millisecondes de lecture écoulées, image en dates). Durée d'un passage complet à vitesse Normal : 25 secondes (vérifiée visuellement à l'implémentation, voir "Vitesse de lecture" ci-dessous pour les deux autres vitesses).
- **Bouclage continu :** contrairement au choix initial (passage unique, arrêt à la date la plus récente), l'animation boucle en continu comme `bird-migrations`, décision explicite de l'utilisateur. À la différence de `bird-migrations` (cycle saisonnier, boucle "naturellement" fluide), le passage 1957 → aujourd'hui n'a pas de raccord naturel avec son propre redémarrage : un temps d'arrêt de 2,5 secondes est marqué sur l'état final (nuée complète, compteur au total) avant de vider les canvas et de relancer un passage depuis 1957, pour laisser voir cet état comme un aboutissement plutôt que de couper brutalement de "aujourd'hui" à "1957".
- **Vitesse de lecture :** Lent (×0,5), Normal (×1, par défaut), Rapide (×2), même mécanisme que `bird-migrations` (`SPEED_FACTORS`, multiplie le temps de lecture accumulé par frame). Modifie uniquement la durée d'un passage (12,5 à 50 secondes) et du temps d'arrêt en fin de passage ; sans effet sur la rotation du globe (ci-dessous), cadencée indépendamment.
- **Rotation du globe :** ambiante et décorative, à vitesse fixe (~3°/seconde, un tour complet toutes les deux minutes environ), non cyclique au sens propre de "Bouclage continu" ci-dessus puisqu'elle ne repart jamais de zéro. Gelée par Play/Pause en même temps que le reste de l'animation (voir "Accessibilité" dans `functional-specifications.md`).
- À chaque frame, tous les satellites dont `launchDate` est désormais atteinte et qui n'ont pas encore été peints sont ajoutés au canvas de premier plan (voir "Rendu" ci-dessus) ; `satellites.json` étant trié par date croissante (voir "Contraintes de validation" dans `data-model.md`), un simple curseur d'index suffit, pas de parcours complet du tableau à chaque frame.
- Année simulée affichée via `Intl.DateTimeFormat(lang, { year: 'numeric' })`, comme le mois simulé de `bird-migrations`.

## Curseur d'année

Élément `<input type="range">` natif, même choix que `light-pollution` et `monument-layers` (voir "Curseur d'année" dans leurs `technical-specifications.md` respectifs) : pas d'interaction complexe à gérer, la sémantique et l'accessibilité clavier natives suffisent (voir "Accessibilité (limite connue)" dans `functional-specifications.md`). Bornes `[année du premier satellite retenu, année du dernier]`, calculées depuis `launchMs` plutôt que codées en dur. Pas de `<datalist>` de graduations, à la différence de `light-pollution` : comme `monument-layers`, la plage est continue (chaque année entre les deux bornes est une position valide sur une accumulation), sans petit ensemble d'années "de référence" à matérialiser en crans.

Granularité annuelle plutôt que la précision réelle (jour) de `launchDate`, cohérente avec l'indicateur d'année affiché par ailleurs (ci-dessus) : une recherche binaire (`cursorForYear`) retrouve l'index du dernier satellite dont `launchMs` tombe au plus tard le 31 décembre de l'année choisie, dans le tableau `satellites` trié par `launchMs` croissante (voir "Contraintes de validation" dans `data-model.md`).

Comme le curseur de `monument-layers`, et contrairement à celui de `light-pollution` (qui recolore un état figé, sans notion d'historique), celui-ci pilote une accumulation : le déplacer implique de pouvoir revenir en arrière, ce qu'une simple avancée de curseur d'index (la boucle d'animation par frame, monotone) ne permet pas. Une fonction dédiée (`seekToCursor`) recompte les satellites par zone depuis le début et reconstruit le canvas de premier plan en une passe, même mécanisme que `rebuildForeground` (voir "Rendu" ci-dessus) plutôt qu'un dessin incrémental.

- **Interruption par le curseur manuel :** l'évènement `input` du curseur met `playing` à `false` (même convention que `light-pollution` et `monument-layers`), pour éviter que la lecture automatique ne fasse repartir le curseur pendant que le visiteur le manipule. `playedMs` est recalculé par inversion de l'échelle temporelle (`simTimeScale.invert`), pour que la reprise de la lecture automatique continue depuis la position choisie plutôt que de sauter ailleurs.
- Déplacer le curseur jusqu'à sa valeur maximale déclenche le même état `holding` (pause avant bouclage, voir "Animation" ci-dessus) que l'arrivée naturelle de l'animation à son terme ; comme `playing` est mis à `false` par le scrub, la pause n'avance cependant pas tant que le visiteur n'a pas relancé la lecture (même comportement que `monument-layers`).

## Nouvelles dépendances

Aucune : `d3-scale`, `d3-timer`, `d3-geo` et `topojson-client` sont déjà des dépendances du projet (introduites par `bird-migrations`, voir son propre `technical-specifications.md`), réutilisées ici sans ajout au `package.json`.

| Dépendance | Usage dans cette visualisation | Portée |
|---|---|---|
| `d3-scale` | Échelle de couleur catégorielle par zone (`scaleOrdinal`), échelle temporelle (`scaleLinear`) | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |
| `d3-geo` | Projection orthographique du globe (`geoOrthographic`), tracé du globe et des continents sur canvas (`geoPath`) | Idem |
| `topojson-client` | Conversion du fond de carte TopoJSON → GeoJSON côté client | Idem |

À la différence de `bird-migrations`, pas de `d3-zoom` ni de `d3-selection` ici : pas de zoom/pan sur le globe (voir "Interactions" dans `functional-specifications.md`, aucune interaction de ce type prévue).

## Palette

**Exception documentée à la règle générale de la palette dataviz** (voir "Palette dataviz" dans `style-guide.md`) : la nuée est une disposition où tous les points peuvent se toucher (type "nuage de points"), qui ne garantit normalement que trois teintes distinguables en daltonisme. Cette visualisation utilise malgré tout les cinq premiers slots de la palette catégorielle, décision explicite de l'utilisateur (voir échanges de cadrage), compensée par :

- une légende toujours visible (couleur + nom de zone, pas la couleur seule) ;
- le filtre zone (voir "Interactions" dans `functional-specifications.md`), qui permet d'isoler une ou plusieurs zones à la fois pour lever toute ambiguïté de teinte.

| Slot | Teinte | Zone |
|---|---|---|
| 1 | Bleu | États-Unis |
| 2 | Orange | Russie / URSS |
| 3 | Aqua | Chine |
| 4 | Jaune | Europe |
| 5 | Magenta | Reste du monde |

Assignation par ordre d'apparition dans `regions` (voir "Format de sortie" dans `data-model.md`), même mécanisme que `bird-migrations`.

Cette palette catégorielle ne s'applique qu'aux points de la nuée : les couleurs du globe lui-même (océan, continents, voir "Rendu" ci-dessus) sont hors de son périmètre, au même titre que la teinte `#e4e2da` du fond de carte de `bird-migrations` n'est pas non plus un slot de la palette dataviz — ce sont des couleurs d'illustration, pas des couleurs encodant une donnée.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que `bird-migrations` et `flower-phenology` (voir "Hydratation" dans leurs `technical-specifications.md` respectifs) : le montage réel (fetch du JSON, initialisation Canvas) ne se déclenche qu'à l'approche du viewport.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Le canvas de fond (globe) et le canvas de premier plan (nuée) sont redimensionnés ensemble au redimensionnement de la zone de montage ; la nuée déjà accumulée est reconstruite en une seule passe après redimensionnement plutôt qu'étirée (mêmes positions relatives, recalculées au nouveau rayon).

## Décisions prises à l'implémentation

- Mapping exact des codes `OWNER` du SATCAT vers les cinq zones : établi sur les 106 codes distincts du catalogue réel, voir "Regroupement géographique" dans `data-model.md`.
- Volume et taille du fichier : 20 020 objets, 892 Ko, pas de compaction nécessaire (voir "Prétraitement" dans `data-model.md`).
- Durée totale de l'animation : 25 secondes conservées après vérification visuelle (voir "Animation" ci-dessus).
- Relecture du texte exact de l'accord utilisateur Space-Track.org : faite (`space-track.org/documentation#/agreement`), confirme la lecture retenue sur la licence (voir "Dataset source" dans `data-model.md`).
- Habillage du globe (continents/océans, rotation) et bouclage continu : ajoutés après la première implémentation (initialement un globe uni sans géographie et un passage unique sans bouclage, voir "Rendu" et "Animation" ci-dessus), à la demande explicite de l'utilisateur.
- Vitesse de rotation du globe (~3°/s) et durée du temps d'arrêt en fin de passage (2,5 secondes) : choisies par défaut et vérifiées visuellement, sans échange de cadrage préalable sur ces deux valeurs précises — à ajuster si besoin.
- Curseur d'année ajouté après la première implémentation (qui ne proposait que Play/Pause et le sélecteur de vitesse), à la demande explicite de l'utilisateur, sur le modèle déjà établi par `monument-layers` (curseur continu par année, avec reconstruction complète de la nuée lors d'un déplacement manuel) plutôt que celui de `light-pollution` (recoloration d'un état figé), ce dernier ne s'appliquant pas à une accumulation progressive comme celle-ci.
