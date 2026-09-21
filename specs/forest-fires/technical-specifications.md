# Spécifications techniques : Où la France a brûlé

Complète `technical-specifications.md` général : règles techniques propres à cette visualisation, au-delà des règles communes à toutes les visualisations.

**Brouillon de cadrage.** Le choix de rendu ci-dessous (Canvas 2D) est une hypothèse de départ, cohérente avec les visualisations comparables du site ; à confirmer une fois le volume réel de points par année mesuré (voir "Rendu").

## Rendu

Canvas 2D (`d3-geo` pour la projection et le placement des points, `d3-zoom` pour le zoom/pan, `topojson-client` pour le fond de carte), même stack que `monument-layers` et `paris-trees`. Retenu par hypothèse plutôt que SVG (comme `biodiversity`/`light-pollution`) : le nombre d'incendies par année peut atteindre plusieurs milliers lors des années les plus actives, et le zoom/pan combiné à des points de taille variable favorise Canvas pour les mêmes raisons que sur ces deux visualisations. À confirmer une fois le volume réel mesuré à l'implémentation (voir "Statistiques mesurées" dans `data-model.md`) : si le nombre d'incendies par année s'avère nettement plus faible qu'anticipé, un rendu SVG resterait envisageable et plus simple.

## Fond de carte

Réutilisation du fond de carte silhouette de `biodiversity` (`public/data/biodiversity/basemap.json`, copié sous `public/data/forest-fires/basemap.json`), même projection Mercator, mêmes couleurs d'illustration (`--dv-surface` pour la silhouette, voir "Fond de carte (illustration)" dans `style-guide.md`). Pas d'hydrographie ni de réseau routier dans cette première version (voir "Prétraitement" dans `data-model.md`).

## Palette

Point d'incendie en teinte fixe, réutilisant le slot 2 de la palette catégorielle (orange, `#eb6834` clair / `#d95926` sombre, voir "Palette dataviz" dans `style-guide.md`) comme couleur d'illustration du sujet plutôt que comme encodage d'une catégorie de données (un seul type de marque affiché à la fois, pas de série à distinguer par couleur) : même logique que l'hydrographie bleue du fond de carte, une teinte fixe associée au sujet plutôt qu'une donnée encodée. Aucune nouvelle valeur de couleur introduite, conformément à la règle du projet (voir "Palette dataviz" dans `style-guide.md`).

## Taille des points

Rayon proportionnel à la racine carrée de `burntArea` (convention d'aire, pas de rayon), pour qu'un incendie dix fois plus grand qu'un autre n'occupe pas dix fois plus de surface visuelle. Domaine d'entrée (surface minimale/maximale observée) et rayon de sortie (minimum/maximum en pixels) à calibrer une fois la distribution réelle des surfaces connue (voir "Statistiques mesurées" dans `data-model.md`) : un radius minimum est nécessaire pour que les très nombreux petits incendies restent visibles et cliquables, un radius maximum pour qu'un incendie exceptionnel (ex. Gironde 2022) ne recouvre pas une portion disproportionnée de la carte.

## Animation

Curseur d'année piloté par `d3-timer`, même convention que `light-pollution` : chaque pas d'année remplace l'ensemble des points affichés par ceux de l'année correspondante (pas d'accumulation, voir "Interactions" dans `functional-specifications.md`), plutôt qu'une accumulation continue comme `monument-layers`. Lecture automatique en boucle continue dès le chargement (2006 → année la plus récente disponible → pause brève → retour à 2006), trois vitesses (Lent/Normal/Rapide, "Normal" par défaut), mêmes constantes de vitesse que les autres visualisations animées du site sauf besoin contraire mesuré à l'implémentation.

## Zoom/pan

`d3-zoom`, mêmes contrôles que `monument-layers`/`paris-trees` : zoom/pan libre à la souris (molette, glisser) et au tactile (pincer, glisser), doublé de boutons zoomer/dézoomer/réinitialiser en surimpression sur la carte, désactivés aux bornes de l'échelle de zoom. Bornes de zoom à calibrer à l'implémentation (voir "Zoom/pan" dans le `technical-specifications.md` de `monument-layers` pour la méthode de calibration déjà suivie sur le site).

## Fiche de détail

Au survol (ou tap) d'un point, fiche affichant commune, département, date, surface parcourue et cause suspectée (voir "Champs source utilisés" dans `data-model.md`), suivant le pointeur. Épinglée au clic/tap pour rendre cliquable le lien vers la fiche officielle BDIFF (voir "Lien vers la fiche officielle" dans `data-model.md`), même mécanisme que `monument-layers` (voir "Fiche de détail" dans son `technical-specifications.md`).

## Accessibilité (limite connue)

Carte animée, zoom/pan et survol des incendies non nativement accessibles au clavier ni au lecteur d'écran, limite documentée sans repli (voir "Accessibilité" dans `functional-specifications.md`). Play/Pause, sélecteur de vitesse, curseur d'année et boutons de zoom restent des éléments HTML standard, accessibles au clavier.

## Dépendances

`d3-geo`, `d3-zoom`, `d3-scale`, `d3-timer`, `topojson-client` : toutes déjà utilisées ailleurs sur le site (voir `monument-layers`, `paris-trees`, `satellites-in-orbit`, `light-pollution`), pas de nouvelle dépendance npm à discuter pour cette visualisation.

## Points ouverts

Voir "Points ouverts" dans `data-model.md` pour les inconnues côté données (mécanisme d'export, licence, noms de colonnes). Côté rendu, restent à trancher à l'implémentation une fois les vraies données mesurées : le choix Canvas vs SVG (voir "Rendu" ci-dessus), le domaine et l'échelle de taille des points, et les bornes de zoom.
