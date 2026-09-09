# Spécifications techniques : Le pouls du réseau

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Datasets SNCF (`regularite-mensuelle-tgv-aqst`, `liste-des-gares`), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build, malgré la mise à jour semestrielle de la source de régularité.

## Rendu

**SVG** : le nombre de liaisons reste modeste (au plus quelques centaines, un ordre de grandeur bien inférieur au volume qui a justifié Canvas sur `bird-migrations`, `satellites-in-orbit`, `paris-trees` ou `monument-layers`), plus proche en volume de `biodiversity` ou `glacier-retreat`.

- **Fond de carte :** silhouette de la France métropolitaine, réutilisation envisagée de `public/data/biodiversity/basemap.json` (même approche que `monument-layers`, voir son `technical-specifications.md`), projection `d3.geoMercator()` avec `fitExtent`.
- **Liaisons :** un trait SVG par liaison entre les deux gares (ligne droite ou courbe légère, pas le tracé ferroviaire réel — hors périmètre, les coordonnées de gares suffisent à situer les extrémités, pas le tracé intermédiaire). Épaisseur (`stroke-width`) via une échelle racine carrée (`d3.scaleSqrt`) sur `trainsScheduled`, couleur (`stroke`) via une échelle séquentielle sur `punctualityPct` (voir "Palette" ci-dessous).
- Changement de mois (curseur) : met à jour `stroke-width` et `stroke` de chaque trait existant, pas de redessin des tracés eux-mêmes (les positions des gares ne changent jamais).

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`), même famille de choix que `monument-layers` et `light-pollution` : le taux de ponctualité est un ordre continu, pas des catégories à distinguer deux à deux. Pas d'exception à documenter ici.

- Palier le plus clair pour un faible taux de ponctualité, le plus foncé pour un taux élevé (ou l'inverse, à trancher visuellement à l'implémentation selon ce qui se lit le mieux : un réseau "en bonne santé" en teinte franche versus un réseau "en difficulté" qui s'assombrit).
- Une liaison sans donnée exploitable pour le mois sélectionné (voir "États" dans `functional-specifications.md`) reste en gris neutre (`--dv-gridline`), hors palette.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection, tracé du fond de carte (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur séquentielle, échelle d'épaisseur (`scaleSqrt`) | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile) | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au SVG | Idem |

## Curseur de mois

Élément `<input type="range">` natif, même approche que le curseur d'année de `light-pollution` (voir son `technical-specifications.md`), pas de composant sur mesure.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, même mécanisme que `bird-migrations`/`paris-trees`/`monument-layers` ; fiche de détail déclenchée par `pointerdown`/`click` plutôt que `pointermove` quand `event.pointerType === 'touch'`.

## Points à valider à l'implémentation

- Couverture temporelle réelle du dataset de régularité (mois de départ, éventuelles interruptions dans la série) — nécessaire pour calibrer les bornes du curseur de mois.
- Résolution effective de la jointure entre `gare_depart`/`gare_arrivee` et `libelle` du référentiel des gares (voir "Jointure gares" dans `data-model.md`), et taille de la table de correspondance manuelle nécessaire.
- Nombre réel de liaisons distinctes une fois le dataset inspecté, pour confirmer que SVG reste le bon choix de rendu (voir "Rendu" ci-dessus).
- Traitement visuel des liaisons superposées ou très proches autour des grands nœuds du réseau (Paris notamment), à ajuster une fois un premier rendu réel observable.
