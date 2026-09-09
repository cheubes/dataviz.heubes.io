# Spécifications techniques : La nuit qui recule

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Composites annuels VIIRS VNL (NOAA Earth Observation Group), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Citation obligatoire (CC BY 4.0) dans le bloc de crédit des sources de la page.

## Rendu

**SVG, pas Canvas**, même choix que `biodiversity` : volume très réduit (395 cellules, voir "Réutilisation de la grille" dans `data-model.md`), loin du seuil qui justifie Canvas sur les autres visualisations du site.

- Grille hexagonale : `d3-geo` pour projeter les polygones (mêmes géométries que `biodiversity/hexbins.json`, voir "Réutilisation de la grille" dans `data-model.md`, donc même projection `d3.geoMercator()` avec `fitExtent`, voir "Rendu" dans son `technical-specifications.md`).
- Changement d'année (curseur) : recolore les 395 chemins SVG existants (mise à jour de l'attribut `fill` selon la valeur `byYear[année].scale` de la cellule), pas de redessin des géométries elles-mêmes.

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`), même famille de choix que `monument-layers` : l'échelle de visibilité du ciel est un ordre continu (du ciel le plus sombre au plus pollué), pas des catégories à distinguer deux à deux. Pas d'exception à documenter ici, contrairement à `satellites-in-orbit` et `paris-trees`.

- Palier le plus sombre (ciel préservé) en teinte la plus claire de l'échelle séquentielle, palier le plus lumineux (ciel très pollué) en teinte la plus foncée — choix inverse de `monument-layers` (où le foncé marquait l'ancienneté) : ici le foncé marque l'intensité de la pollution, pas une progression temporelle portée par la couleur (le temps est porté par le curseur d'année, pas par la couleur, voir "Interactions" dans `functional-specifications.md`).

## Prétraitement raster

Voir "Prétraitement" dans `data-model.md` pour le détail des étapes. Point notable propre à cette visualisation : contrairement aux autres prétraitements du site (scripts Node ponctuels), celui-ci part d'un raster géospatial et nécessite un outil de statistique zonale (`rasterio`/`rasterstats` en Python, ou `gdal`), utilisé une seule fois hors build, pas une dépendance du projet (`package.json` inchangé par ce choix, même logique que `h3-js` pour `biodiversity`).

## Nouvelles dépendances

Aucune nouvelle dépendance runtime par rapport à `biodiversity` : `d3-geo` et `d3-scale` suffisent (projection déjà maîtrisée par ce précédent, échelle séquentielle déjà utilisée par `monument-layers`).

## Curseur d'année

Élément `<input type="range">` natif plutôt qu'un composant sur mesure : pas d'interaction complexe à gérer (pas de glisser-relâcher personnalisé, pas de zoom), la sémantique et l'accessibilité clavier natives suffisent (voir "Accessibilité" dans `functional-specifications.md`). Un `<datalist>` associé peut marquer chaque année disponible comme un cran plutôt qu'un curseur continu, à confirmer visuellement à l'implémentation.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## Points à valider à l'implémentation

- Continuité réelle des composites annuels VIIRS VNL sur la période retenue : certaines années ont pu faire l'objet de reprocessing ou de changements de méthodologie (versions V1/V2/V2.1 du produit, voir "Dataset source" dans `data-model.md`) qui pourraient introduire des discontinuités artificielles dans la série plutôt qu'une évolution réelle — à vérifier avant de présenter la série comme directement comparable d'une année à l'autre.
- Méthode précise de conversion radiance → palier de l'échelle de visibilité (voir "Échelle de visibilité du ciel" dans `data-model.md`), et nombre de paliers retenu.
- Faisabilité pratique du téléchargement et du traitement zonal des rasters mondiaux (même découpés à la bbox France, voir "Prétraitement" dans `data-model.md`) sur treize années de composites.
- Confirmation que les géométries de `biodiversity/hexbins.json` restent exploitables telles quelles (même fichier, même format) au moment de l'implémentation de cette visualisation.
