# Spécifications techniques : Les routes de migration

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno carte

D3 v7 seul, pas de Leaflet (voir échanges de cadrage : cohérence entre les trois visualisations, pas de dépendance à un serveur de tuiles tiers en runtime).

- **Fond de carte :** silhouette terrestre mondiale (`public/data/bird-migrations/basemap.json`, voir "Prétraitement" dans `data-model.md`), objet TopoJSON `land` (une seule géométrie fusionnée, sans frontières par pays) issu du paquet `world-atlas` (données Natural Earth, domaine public), converti en GeoJSON côté client via `topojson-client`. Pas de découpage aux seuls contours Europe/Afrique : la projection est cadrée sur cette zone (voir "Projection" ci-dessous), le reste du monde existe dans les données mais déborde hors du cadre visible sur les côtés.
- **Projection :** `d3.geoNaturalEarth1`, cadrée via `fitExtent` sur un rectangle géographique (lng -25 à 45, lat -36 à 68) couvrant l'Europe (jusqu'à la Scandinavie) et l'Afrique. Borne nord relevée de 55 à 68° pour inclure les aires de reproduction réelles des espèces ajoutées après la cigogne (voir "Historique" dans `data-model.md`).
- **Proportions de la zone de montage :** le rectangle géographique ci-dessus est nettement plus haut que large (ratio largeur/hauteur ≈ 0,59 sous cette projection), mais la hauteur de la zone de montage suit la hauteur par défaut du site (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), pas un ajustement pixel-perfect à ce ratio (qui demanderait une hauteur ≈ 1,7 fois la largeur, disproportionnée dans la mise en page du site) : compromis en faveur d'une carte courte plutôt que d'un cadrage large-écran ou de la fidélité totale au ratio géographique, au prix d'une bande de mer/désert supplémentaire visible de part et d'autre de l'Europe et l'Afrique.
- **Piège rencontré :** le rectangle de cadrage passé à `fitExtent` doit être un anneau **horaire** (Nord, Est, Sud, Ouest en partant du coin sud-ouest). Un anneau antihoraire (la convention GeoJSON RFC 7946 standard) est interprété par d3-geo comme "tout sauf ce rectangle" et cadre sur le monde entier au lieu de la zone voulue — silencieux, sans erreur, à surveiller si ce rectangle est modifié.

## Rendu des trajectoires

**Canvas 2D, pas SVG**, à la différence de la biodiversité et de la phénologie. Décision prise en anticipation d'un volume de trajectoires potentiellement important (voir échanges de cadrage) ; le jeu de données retenu (32 trajectoires, ≈ 1900 points au total toutes espèces confondues, voir `data-model.md`) reste léger, mais le choix Canvas est conservé pour la cohérence de l'implémentation et sa marge de croissance si d'autres espèces sont ajoutées.

- D3 reste utilisé pour les calculs (projection géographique, interpolation le long d'une trajectoire via `d3.geoInterpolate`, échelle de couleur par espèce via `d3-scale`), pas pour le rendu DOM des trajectoires elles-mêmes.
- Deux canvas superposés : un canvas de fond (silhouette terrestre, redessiné seulement au redimensionnement ou au zoom) et un canvas de premier plan (trajectoires), pour appliquer l'effet de traînée uniquement au second sans re-râper le fond à chaque frame.
- Effet de traînée : à chaque frame, un rectangle semi-transparent est appliqué sur le canvas de premier plan avec `globalCompositeOperation = 'destination-out'` (efface progressivement vers la transparence plutôt que de peindre une couleur opaque par-dessus), puis le nouveau segment est tracé par-dessus.
- Le tooltip (élément DOM, pas la carte elle-même) reste en HTML standard, superposé au Canvas.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection (`geoNaturalEarth1`), tracé du fond de carte (`geoPath`), interpolation le long d'un trajet (`geoInterpolate`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur catégorielle par espèce (`scaleOrdinal`) | Idem |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile) sur la carte | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au canvas (`select(canvas).call(zoom)`) | Idem |
| `topojson-client` | Conversion du fond de carte TopoJSON → GeoJSON côté client | Idem |

Le fond de carte lui-même (`basemap.json`) est un fichier statique committé (voir `data-model.md`), pas une dépendance npm : `world-atlas` n'est pas ajouté au `package.json`, son fichier `countries-110m.json` a été récupéré une fois via le CDN jsDelivr puis réduit à son seul objet `land`.

## Palette

Palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`). Quatre espèces (voir "Sélection des études" dans `data-model.md`), assignées dans l'ordre d'apparition dans `species` :

| Slot | Teinte | Espèce |
|---|---|---|
| 1 | Bleu | Cigogne blanche |
| 2 | Orange | Busard cendré |
| 3 | Aqua | Coucou gris |
| 4 | Jaune | Bondrée apivore |

Le slot suivant (magenta) s'appliquera dans cet ordre à la prochaine espèce ajoutée ; au-delà de huit espèces, revoir le regroupement plutôt que d'ajouter une neuvième teinte (voir "Palette dataviz" dans `style-guide.md`). Contrairement au calendrier des fleurs, la couleur d'une espèce d'oiseau ne porte pas de sens réaliste à préserver : la palette officielle s'applique sans exception ici.

## Historique du cadrage nord

Le cadrage (voir "Projection" ci-dessus) est initialement resté à lat -36/55, calibré sur la seule cigogne blanche (aires de reproduction jusqu'à ~52°N) : les espèces ajoutées ensuite se reproduisant plus au nord (Scandinavie/Finlande), la portion nord de leurs trajectoires projetait au-dessus du cadre visible. Élargi à 68° à la demande explicite de l'utilisateur plutôt que laissé comme limite assumée (voir "Projection" ci-dessus pour la borne retenue et son effet sur les proportions de la zone de montage).

En élargissant ce cadrage, plusieurs trajectoires de busard cendré sont apparues comme des segments rectilignes aberrants traversant la carte de part en part (auparavant coupés hors champ par l'ancien cadrage, donc invisibles). Ce n'était pas un artefact du cadrage lui-même mais un vrai problème de qualité de données pré-existant, révélé par le nouveau cadrage : voir "Busard cendré" et "Historique" (v4) dans `data-model.md` pour le diagnostic (ambiguïté de résolution Argos Doppler) et la correction.

## Animation

- Boucle `d3-timer`, pilotée par un temps simulé en jours (0-365, cyclique). Un cycle calendaire complet dure 36 secondes en vitesse "Normal" (voir "Interactions" dans `functional-specifications.md`), 72 s en "Lent" (×0,5), 18 s en "Rapide" (×2).
- Chaque trajectoire est découpée en jour de l'année (voir "Prétraitement" dans `data-model.md`, unwrap déjà fait côté données) ; à chaque frame, la position courante d'un individu est interpolée entre ses deux points encadrants via `d3.geoInterpolate` (interpolation le long du grand cercle, pas une simple moyenne linéaire lat/lng).
- Le sélecteur de vitesse modifie le facteur d'avancement du temps simulé, pas le taux de rafraîchissement de l'animation (toujours cadencée par `requestAnimationFrame` via `d3-timer`).
- Nom du mois simulé affiché via `Intl.DateTimeFormat(lang, { month: 'long' })` plutôt qu'un tableau de libellés maison : localisation FR/EN gratuite.

## Vue statique

Deuxième mode d'affichage (voir "Bascule de vue" dans `functional-specifications.md`), partageant le canvas de premier plan et la logique de filtrage espèce/direction avec la vue animée plutôt que de dupliquer le rendu.

- **Bascule vers "Statique" :** arrête la boucle `d3-timer` (`timer.stop()`) plutôt que de la laisser tourner à vide : pas de calcul ni de rendu inutile pendant que la vue statique est affichée. Le canvas de premier plan est vidé (`clearRect` complet, pas l'effacement progressif de l'effet de traînée) puis chaque trajectoire active est tracée en une seule passe, du premier au dernier point (`lineTo` successifs sur les points projetés), sans interpolation temporelle : la vue statique n'a pas de notion de temps simulé.
- **Distinction automne/printemps :** `context.setLineDash([6, 4])` pour les trajectoires de printemps, trait plein (`setLineDash([])`) pour l'automne. Pas de changement de teinte : la couleur reste le code espèce (voir "Palette" ci-dessus), le pointillé porte la distinction de direction.
- **Survol/tap en vue statique :** contrairement à la vue animée (une seule position "tête" par trajectoire, mise à jour chaque frame), la vue statique doit détecter la proximité du curseur avec n'importe quel segment du tracé complet. Chaque trajectoire garde en mémoire son chemin en pixels (recalculé à chaque tracé, y compris après un zoom/pan) ; la détection calcule la distance point-segment (projection orthogonale bornée au segment) pour chaque segment du tracé, et retient le plus proche sous le seuil de tolérance.
- **Bascule vers "Animée" :** vide le chemin en pixels mémorisé de chaque trajectoire, efface le canvas de premier plan, relance la boucle `d3-timer` (nouvelle instance plutôt que résumée, pour repartir d'un delta de temps propre et éviter un grand saut d'animation dû au temps passé en vue statique).
- **Redessin sur changement de filtre ou de zoom :** en vue animée, un changement de filtre est pris en compte à la frame suivante automatiquement ; en vue statique, sans boucle active, chaque changement (case espèce, radio direction, zoom/pan) déclenche un redessin explicite.
- **Note historique :** c'est en vue statique, où un trajet entier se trace d'un coup, que les positions Argos Doppler mal résolues du busard cendré sont devenues visibles pour la première fois sous forme de longs segments rectilignes aberrants (voir "Historique du cadrage nord" ci-dessus et "Busard cendré" dans `data-model.md`) : un vrai défaut de qualité de données, révélé par cette vue plutôt que causé par elle, et corrigé à la source depuis.

## Hydratation

`client:visible`, implémenté par un `IntersectionObserver` sur la zone de montage (pas de directive `client:*` disponible : le chrome du site n'utilise aucun framework UI, voir "JavaScript et visualisations" dans `technical-specifications.md` général) : le montage réel (fetch des données, initialisation Canvas) ne se déclenche qu'à l'approche du viewport.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom` (pincer pour zoomer, glisser pour déplacer, pris en charge nativement par ce module aussi bien à la souris qu'au doigt) ; tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` quand `event.pointerType === 'touch'`.
