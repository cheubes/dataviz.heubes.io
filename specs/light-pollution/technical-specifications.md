# Spécifications techniques : Le ciel, d'année en année

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Source des données

Composites annuels VIIRS VNL (NOAA Earth Observation Group), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Citation obligatoire (CC BY 4.0) dans le bloc de crédit des sources de la page.

## Rendu

**SVG, pas Canvas**, même choix que `biodiversity` : volume très réduit (395 cellules, voir "Réutilisation de la grille" dans `data-model.md`), loin du seuil qui justifie Canvas sur les autres visualisations du site.

- Grille hexagonale : `d3-geo` pour projeter les polygones (mêmes géométries que `biodiversity/hexbins.json`, voir "Réutilisation de la grille" dans `data-model.md`, donc même projection `d3.geoMercator()` avec `fitExtent`, voir "Rendu" dans son `technical-specifications.md`).
- Changement d'année (curseur, manuel ou automatique) : recolore les 395 chemins SVG existants (mise à jour de l'attribut `fill` selon la valeur `byYear[année].scale` de la cellule), pas de redessin des géométries elles-mêmes.
- **Zone de montage compacte** (revu à la relecture) : hauteur de la carte `max(320px, largeur × 0,6)`, sensiblement plus basse que `biodiversity` (`largeur × 0,95`) — légende et contrôles étant désormais au-dessus de la carte plutôt qu'en surimpression (voir "Contenu" dans `functional-specifications.md`), rien n'impose plus de réserver une hauteur de carte généreuse pour leur laisser de la place.

Légende et contrôles (lecture/pause, vitesse, curseur d'année) : bloc unique placé avant la zone de carte dans le DOM, en flux normal (`display: flex; flex-direction: column`), jamais en position `absolute` par-dessus le SVG — plus simple que la première implémentation (légende/curseur en surimpression sur la carte, avec un traitement responsive séparé pour les repositionner sous la carte en petit écran, retiré à la relecture) et sans le bug de superposition qu'elle provoquait sur mobile (la légende recouvrait le haut de la carte).

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`), même famille de choix que `monument-layers` : l'échelle de visibilité du ciel est un ordre continu (du ciel le plus sombre au plus pollué), pas des catégories à distinguer deux à deux. Pas d'exception à documenter ici, contrairement à `satellites-in-orbit` et `paris-trees`.

- Palier le plus sombre (ciel préservé) en teinte la plus claire de l'échelle séquentielle, palier le plus lumineux (ciel très pollué) en teinte la plus foncée — choix inverse de `monument-layers` (où le foncé marquait l'ancienneté) : ici le foncé marque l'intensité de la pollution, pas une progression temporelle portée par la couleur (le temps est porté par le curseur d'année, pas par la couleur, voir "Interactions" dans `functional-specifications.md`).
- **Mêmes deux teintes extrêmes que `biodiversity`** (`#cde2fb` / `#0d366b`, paliers 100 et 700 de `style-guide.md`), interpolées de la même façon (`d3-scale`, interpolation RGB par défaut d'une échelle continue) plutôt que reprises comme six paliers nommés distincts du tableau. Revu à la relecture (voir échanges de cadrage) : une première version piochait quatre paliers nommés intermédiaires (200/300/400/550) directement dans le tableau du style-guide, plus saturés/distincts en légende, mais visuellement incohérents avec le dégradé continu de `biodiversity` — l'autre carte de France du site utilisant la même palette séquentielle. Compromis assumé : les teintes intermédiaires y perdent un peu en distinction dans la légende, au profit de la cohérence visuelle entre les deux cartes.
- `d3.scaleLinear<string>().domain([1, 6]).range(['#cde2fb', '#0d366b']).clamp(true)` : linéaire plutôt que `scaleSqrt` comme `biodiversity` (dont le `sqrt` compense un domaine de comptages bruts très asymétrique, sans équivalent ici — le domaine est déjà un rang ordinal 1-6 régulièrement espacé).

## Prétraitement raster

Voir "Prétraitement" dans `data-model.md` pour le détail des étapes. Point notable propre à cette visualisation : contrairement aux autres prétraitements du site (scripts Node ponctuels), celui-ci part d'un raster géospatial et nécessite un outil de statistique zonale (`rasterio`/`rasterstats` en Python), utilisé une seule fois hors build, pas une dépendance du projet (`package.json` inchangé par ce choix, même logique que `h3-js` pour `biodiversity`).

## Nouvelles dépendances

Aucune nouvelle dépendance pour le **projet** : `d3-geo` (projection), `d3-scale` (`scaleLinear`, dégradé continu entre les deux teintes extrêmes de la palette séquentielle, voir "Palette" ci-dessus) et `d3-timer` (lecture automatique, voir "Lecture automatique" ci-dessous) sont toutes trois déjà des dépendances existantes (`d3-timer` déjà utilisée par `satellites-in-orbit` et `bird-migrations`), seulement nouvelles pour cette visualisation.

## Curseur d'année

Élément `<input type="range">` natif plutôt qu'un composant sur mesure : pas d'interaction complexe à gérer (pas de glisser-relâcher personnalisé, pas de zoom), la sémantique et l'accessibilité clavier natives suffisent (voir "Accessibilité" dans `functional-specifications.md`). Un `<datalist>` associé marque chaque année disponible comme un cran plutôt qu'un curseur continu. Piloté à la fois manuellement (glisser/clavier) et automatiquement (voir "Lecture automatique" ci-dessous) : dans les deux cas, seule sa valeur (`yearSlider.value`) et l'attribut `aria-valuetext` sont mis à jour, jamais de re-création de l'élément.

## Lecture automatique

Même approche que `satellites-in-orbit` (`d3-timer`, delta de temps mesuré entre frames via `performance.now()` plutôt que l'argument `elapsed` du timer, pour pouvoir geler proprement l'avancée en pause) :

- **Paliers de temps :** 900 ms par année à vitesse Normal (`STEP_MS`), modulés par `SPEED_FACTORS` (`{ slow: 0.5, normal: 1, fast: 2 }`, mêmes valeurs que `satellites-in-orbit`) — un passage complet (12 transitions) dure donc environ 21,6 s en Lent, 10,8 s en Normal, 5,4 s en Rapide.
- **Temps d'arrêt en fin de passage :** 2 s fixes sur 2025 (`HOLD_MS`), indépendantes de la vitesse choisie (même rationale que `satellites-in-orbit` : laisser le temps de lire l'état final avant la reprise), avant de reprendre à 2013.
- **Pause :** un simple drapeau `playing` vérifié à chaque frame du timer ; passer en pause fige l'avancée (et le temps d'arrêt en cours, le cas échéant) sans arrêter ni recréer le timer lui-même.
- **Interruption par le curseur manuel :** l'évènement `input` du curseur d'année met `playing` à `false` (et réinitialise le temps d'arrêt en cours), pour éviter que la lecture automatique ne fasse repartir le curseur pendant que le visiteur le manipule.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Décisions prises à l'implémentation

Réponses aux points laissés ouverts par le brouillon de cadrage :

- **Continuité réelle des composites VIIRS VNL :** confirmée. v2.1 (2013-2021) et v2.2 (2022-2025) partagent la même méthodologie "Annual VNL V2" (EOG publie ce produit par incréments annuels versionnés, pas de changement d'algorithme entre les deux, contrairement à la rupture V1→V2) ; aucune discontinuité artificielle observée à la jonction 2021/2022 dans la série obtenue (voir "Dataset source" dans `data-model.md`). La rupture nette observée dans la série se situe entre 2022 et 2023, à l'intérieur de la même version — cohérente avec un phénomène réel plutôt qu'un artefact de traitement (voir "Angle éditorial" dans `functional-specifications.md`).
- **Méthode de conversion radiance → palier :** simplification assumée et documentée (pas une classification Bortle rigoureuse, qui demanderait une modélisation de la propagation atmosphérique hors de portée ici), six paliers calibrés sur la distribution réelle observée après agrégation zonale, voir "Échelle de visibilité du ciel" dans `data-model.md`.
- **Faisabilité du téléchargement/traitement :** confirmée, mais lourde : téléchargement manuel par l'utilisateur (~4 Go compressés au total, comptes EOG requis), traitement zonal en Python (`rasterio`/`rasterstats`) en quelques minutes une fois les fichiers disponibles localement. Voir "Prétraitement" dans `data-model.md`.
- **Géométries de `biodiversity/hexbins.json` :** confirmées exploitables telles quelles (mêmes 395 cellules, mêmes identifiants `h3`, mêmes polygones).
