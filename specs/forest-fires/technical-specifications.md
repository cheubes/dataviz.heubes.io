# Spécifications techniques : Où la France a brûlé

Complète `technical-specifications.md` général : règles techniques propres à cette visualisation, au-delà des règles communes à toutes les visualisations.

## Rendu

Canvas 2D (`d3-geo` pour la projection et le placement des points, `d3-zoom` pour le zoom/pan, `topojson-client` pour le fond de carte), même stack que `monument-layers` et `paris-trees`. Confirmé sur le volume réel mesuré à l'implémentation (voir "Statistiques mesurées" dans `data-model.md`) : jusqu'à 4 356 incendies affichés simultanément sur l'année la plus active (2022), le zoom/pan combiné à des points de taille variable favorise Canvas pour les mêmes raisons que sur `monument-layers`/`paris-trees`.

## Fond de carte

Réutilisation du fond de carte silhouette de `biodiversity` (`public/data/biodiversity/basemap.json`, copié sous `public/data/forest-fires/basemap.json`), même projection Mercator, mêmes couleurs d'illustration que les autres cartes Canvas du site (`#e4e2da` pour la silhouette, `#acb2b8` pour son contour, voir "Fond de carte (illustration)" dans `style-guide.md` — pas `--dv-surface`, correction apportée à cette spec après implémentation : cette variable vaut blanc, ce n'est pas la teinte d'illustration réutilisée par `biodiversity`/`monument-layers`/`paris-trees`). Pas d'hydrographie ni de réseau routier (voir "Prétraitement" dans `data-model.md`), à la différence de `monument-layers`.

## Palette

Point d'incendie en teinte fixe, réutilisant le slot 2 de la palette catégorielle (orange, `#eb6834`, voir "Palette dataviz" dans `style-guide.md`) comme couleur d'illustration du sujet plutôt que comme encodage d'une catégorie de données (un seul type de marque affiché à la fois, pas de série à distinguer par couleur) : même logique que l'hydrographie bleue du fond de carte, une teinte fixe associée au sujet plutôt qu'une donnée encodée. Valeur claire uniquement (le site n'a pas de thème sombre actif, voir "Couleurs" dans `style-guide.md`). Aucune nouvelle valeur de couleur introduite, conformément à la règle du projet (voir "Palette dataviz" dans `style-guide.md`).

## Taille des points

Rayon proportionnel à la racine carrée de `burntArea` (convention d'aire, pas de rayon) : `d3.scaleSqrt().domain([0, maxBurntArea]).range([1.5, 32])` (en pixels, taille fixe à l'écran indépendante du niveau de zoom, même convention que `monument-layers`), `maxBurntArea` le maximum réel du jeu de données (125 520 000 m², l'incendie de Landiras en 2022). Calibré sur la distribution réelle des surfaces (voir "Statistiques mesurées" dans `data-model.md`, médiane 0,1 ha) : le plancher de 1,5 px garde visibles et cliquables les très nombreux petits incendies, le plafond de 32 px empêche l'incendie de Landiras de recouvrir une portion disproportionnée de la carte. Affiché en hectares (`burntArea / 10 000`), l'unité utilisée par le site BDIFF lui-même sur ses fiches individuelles (pas celle de stockage dans `fires.json`, voir "Format de sortie" dans `data-model.md`) ; jusqu'à deux décimales sur la fiche de détail d'un incendie (une valeur en 0 décimale afficherait "0 ha" pour la moitié des incendies du jeu de données, médiane 1 000 m²), aucune décimale sur le total annuel affiché dans le bandeau de contrôle.

## Animation

Curseur d'année piloté par `d3-timer`, même convention discrète que `light-pollution` (pas de morphing continu) : chaque pas d'année remplace l'ensemble des points affichés par ceux de l'année correspondante (pas d'accumulation, voir "Interactions" dans `functional-specifications.md`), plutôt qu'une accumulation continue comme `monument-layers`. Mêmes constantes que `light-pollution` (`STEP_MS` 900, pause `HOLD_MS` 2 000 sur la dernière année avant de reboucler à 2006) : vingt années à parcourir (2006-2025) plutôt que treize sur `light-pollution` ne justifie pas un rythme différent. Trois vitesses (Lent/Normal/Rapide, "Normal" par défaut, mêmes facteurs `{ slow: 0.5, normal: 1, fast: 2 }` que le reste du site).

`fires.json` étant trié par `year` croissant (voir "Contraintes de validation" ci-dessous), la plage d'indices de chaque année est calculée une fois au montage (recherche dichotomique par année), pas reconstruite à chaque frame.

## Zoom/pan

`d3-zoom`, mêmes contrôles que `monument-layers`/`paris-trees` : zoom/pan libre à la souris (molette, glisser) et au tactile (pincer, glisser), doublé de boutons zoomer/dézoomer/réinitialiser (`ZOOM_BUTTON_STEP` 1,5, même valeur) en surimpression sur la carte, désactivés aux bornes `[1, 200]`. `MAX_ZOOM` 200, pas 1 000 comme `monument-layers` : ce dernier calibre son zoom maximal sur son affichage cumulatif (jusqu'à 37 661 monuments visibles simultanément en fin de balayage, y compris plusieurs dans une même commune) ; une année d'incendies plafonne à quelques milliers de points, la séparation d'incidents proches nécessite donc un facteur de zoom proportionnellement plus faible. Vérifié visuellement à l'implémentation (zoom à 200 sur une zone dense du pourtour méditerranéen) : les points superposés à l'échelle du pays se distinguent, aucun artefact de précision flottante à ce niveau de zoom.

## Fiche de détail

Au survol (ou tap) d'un point, fiche affichant commune (département entre parenthèses), date, surface parcourue et cause suspectée (voir "Champs source utilisés" dans `data-model.md`), suivant le pointeur. Épinglée au clic/tap pour rendre cliquable le lien vers la fiche officielle BDIFF (voir "Lien vers la fiche officielle" dans `data-model.md`), même mécanisme que `monument-layers` (voir "Fiche de détail" dans son `technical-specifications.md`) : `pointer-events: none` sur la fiche tant qu'elle n'est pas épinglée (sans quoi elle intercepterait les mouvements/clics destinés au canvas sous-jacent), basculé à `auto` une fois épinglée.

## Accessibilité (limite connue)

Carte animée, zoom/pan et survol des incendies non nativement accessibles au clavier ni au lecteur d'écran, limite documentée sans repli (voir "Accessibilité" dans `functional-specifications.md`). Play/Pause, sélecteur de vitesse, curseur d'année et boutons de zoom restent des éléments HTML standard, accessibles au clavier.

## Dépendances

`d3-geo`, `d3-zoom`, `d3-scale`, `d3-selection`, `d3-timer`, `topojson-client` : toutes déjà utilisées ailleurs sur le site (voir `monument-layers`, `paris-trees`, `satellites-in-orbit`, `light-pollution`), pas de nouvelle dépendance npm pour cette visualisation.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Contraintes de validation propres à cette visualisation

- `fires` trié par `year` croissant (voir "Animation" ci-dessus, et "Prétraitement" dans `data-model.md`).
- Chaque `departmentCode` référencé dans `fires` existe dans `departments`.
