# Spécifications techniques : Les routes de migration

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno carte

D3 v7 seul, pas de Leaflet (voir échanges de cadrage : cohérence entre les trois visualisations, pas de dépendance à un serveur de tuiles tiers en runtime).

- **Fond de carte :** silhouette SVG Europe/Afrique, dérivée d'un fichier TopoJSON simplifié committé dans le repo (source à choisir à l'implémentation, fichier statique, pas une dépendance npm).
- **Projection :** à définir à l'implémentation (ex. Natural Earth ou équirectangulaire), couvrant l'Europe et l'Afrique subsaharienne.

## Rendu des trajectoires

**Canvas 2D, pas SVG**, à la différence de la biodiversité et de la phénologie. Conséquence directe de la décision de ne plafonner le nombre de trajectoires simultanées (voir "Volume de trajectoires" dans `data-model.md`) : animer un nombre potentiellement important de trajectoires en éléments DOM SVG dégraderait la fluidité de l'animation ; un rendu Canvas (`requestAnimationFrame`, tracé direct des segments) absorbe mieux ce volume.

- D3 reste utilisé pour les calculs (échelles, interpolation de position le long d'une trajectoire, projection géographique appliquée aux coordonnées avant tracé Canvas), pas pour le rendu DOM des trajectoires elles-mêmes.
- Effet de traînée (segments anciens qui s'estompent) : technique de fondu Canvas (dessiner un rectangle de fond semi-transparent à chaque frame plutôt qu'un `clearRect` complet), pas de dépendance supplémentaire.
- Le tooltip et le surlignage au survol/tap (éléments d'interface, pas la carte elle-même) restent en DOM/SVG standard, superposés au Canvas.

**Risque de performance assumé :** en l'absence de plafond sur le nombre d'individus (voir `data-model.md`), le volume réel dépend des études Movebank retenues à l'implémentation. Si le volume s'avère trop important pour une animation fluide même en Canvas, revoir un plafond par espèce sera à rediscuter à ce moment-là plutôt que d'anticiper une limite arbitraire maintenant.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3` (v7) ou modules `d3-*` ciblés (`d3-geo`, `d3-scale`, `d3-timer`) | Projection géographique, échelles, boucle d'animation | Scopée à cette visualisation (île Astro) |
| `topojson-client` | Conversion du fond de carte TopoJSON → GeoJSON côté client | Idem |

## Palette

Palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`), cinq espèces (voir "Sélection des études" dans `data-model.md`) assignées dans l'ordre de la liste `species` du JSON de sortie :

| Slot | Teinte | Espèce (ordre indicatif, à confirmer avec la sélection finale) |
|---|---|---|
| 1 | Bleu | Cigogne blanche |
| 2 | Orange | Hirondelle rustique |
| 3 | Aqua | Milan noir |
| 4 | Jaune | Balbuzard pêcheur |
| 5 | Magenta | Pigeon ramier |

Contrairement au calendrier des fleurs, la couleur d'une espèce d'oiseau ne porte pas de sens réaliste à préserver : la palette officielle s'applique sans exception ici.

## Animation

- Boucle `requestAnimationFrame`, pilotée par un temps simulé (un cycle calendaire complet ≈ 36 secondes en vitesse "Normal", voir "Interactions" dans `functional-specifications.md`).
- Interpolation de la position de chaque individu le long de ses points GPS en fonction du temps simulé courant (`d3.interpolate` ou équivalent maison).
- Le slider de vitesse modifie le facteur d'avancement du temps simulé, pas le taux de rafraîchissement de l'animation.

## Hydratation

`client:visible`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation ; implémentation via écouteurs tactiles en plus des événements souris, boutons et slider dimensionnés pour des cibles tactiles (44px minimum recommandé).
