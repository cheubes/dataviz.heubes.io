# Spécifications techniques : Les lignes de faille

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : implémenté.**

## Source des données

Catalogue USGS (`fdsnws/event`) et frontières de plaques tectoniques (modèle de Bird), voir "Dataset source" et "Format de sortie" dans `data-model.md`. Citation requise pour les frontières de plaques (ODC-BY, attribution Hugo Ahlenius/Nordpil/Peter Bird) dans le bloc de crédit des sources de la page.

## Techno carte

Même stack que `bird-migrations`/`monarch-migration`/`volcanic-eruptions`, D3 v7.

- **Fond de carte, cours d'eau, relief : copiés depuis `bird-migrations`** vers `public/data/earthquakes/` (`basemap.json`, `rivers.json`, `relief.webp`, octets identiques) plutôt que référencés depuis le dossier de `bird-migrations` : tranche la "réserve sur la modalité de partage entre dossiers" laissée ouverte par `volcanic-eruptions` (déjà tranchée de la même façon par `monarch-migration`), cohérent avec "Règles communes à toutes les visualisations" (données propres à chaque visualisation dans son propre dossier `public/data/<viz-slug>/`), au prix de dupliquer ~1,2 Mo de données déjà présentes ailleurs sur le site.
- **Frontières de plaques tectoniques :** géométrie statique (`plateBoundaries`, voir "Format de sortie" dans `data-model.md`) tracée sur le canvas de fond, **hors du clip** de la silhouette terrestre (à la différence des cours d'eau) : de nombreux tronçons de frontière courent en pleine mer (dorsales médio-océaniques, fosses de subduction), un clip à la terre les aurait fait disparaître. Teinte `#b3a696` (voir "Fond de carte (illustration)" dans `style-guide.md`, ajoutée à cette table à l'implémentation), épaisseur `1px` divisée par `transform.k`.
- **Projection :** `d3.geoNaturalEarth1`, `fitExtent` sur l'étendue complète de la silhouette terrestre (`basemap.json`, couverture mondiale confirmée, `bbox` `[-180, -85.6, 180, 83.6]`), même choix que `volcanic-eruptions`. L'alignement de `relief.webp` réutilise néanmoins tel quel le rectangle de référence Europe/Afrique de `bird-migrations` (constantes `RELIEF_REF_WIDTH`/`HEIGHT`/`ORIGIN_X`/`ORIGIN_Y`) : ce rectangle ne décrit pas la vue affichée par cette visualisation mais une propriété physique fixe du fichier `relief.webp` lui-même (l'échelle/translation à laquelle il a été rasterisé une fois pour toutes), valide pour n'importe quel cadrage `fitExtent` en direct, y compris celui, mondial, retenu ici : pas de recalibrage nécessaire (voir "Points tranchés à l'implémentation" ci-dessous pour la vérification de résolution).
- **Zoom :** `d3-zoom` sur le canvas de premier plan, `scaleExtent [1, 8]`, doublé de boutons zoomer/dézoomer/réinitialiser en haut à droite du planisphère (mêmes composants et même pas de zoom, `× 1,5`, que `monument-layers`/`paris-trees`), désactivés aux bornes de l'échelle.

## Rendu

**Canvas 2D**, même mécanisme que `volcanic-eruptions` (voir "Rendu" dans son `technical-specifications.md`), repris presque à l'identique :

- Pulse d'un séisme au moment simulé de sa survenue : cercle plein dont le rayon croît de 35 % à 100 % du rayon maximal (`d3.scaleSqrt`, domaine `[6, 9,5]` sur la magnitude réelle du catalogue, plage `[3px, 30px]`) et dont l'opacité décroît de `0,85` à `0`, sur une durée fixe de **850 ms en temps réel**, indépendante de la vitesse de lecture sélectionnée.
- **Différence avec `volcanic-eruptions` :** pas de point permanent au repos. Un volcan est un lieu fixe qui pulse plusieurs fois (voir "Volcans au repos" dans son `technical-specifications.md`) ; un séisme est un événement unique sans lieu "propriétaire" à afficher en permanence (l'épicentre d'un séisme de 1906 n'a pas de raison de rester marqué en 2026) — aucun point discret hors pulse. **Durée de rémanence** (voir "Survol/tap d'un point" dans `functional-specifications.md`) : tranchée à l'implémentation comme strictement égale à la durée du pulse (850 ms) plutôt qu'une fenêtre distincte plus longue, un épicentre n'est survolable/tapable que tant qu'il est visuellement présent à l'écran, pas après sa disparition.
- **Annotation textuelle** (séismes notables) : élément DOM superposé au Canvas (même approche que le tooltip de `bird-migrations`), apparition synchronisée avec le pulse, disparition après **2 200 ms en temps réel** fixe (plus long que le pulse lui-même : le temps de lire un nom de lieu, indépendant de la vitesse de lecture).

## Palette

Palette **séquentielle** sur la magnitude, même principe que `volcanic-eruptions` sur le VEI. Pas d'exception à documenter.

## Animation

- Boucle `d3-timer`, année simulée continue sur le domaine `[1900, 2027]` (127 ans, la borne haute dépassant d'un an le dernier séisme du catalogue pour éviter qu'un rebouclage instantané ne coupe l'année la plus récente), bouclée en continu, sans pause de fin de passage : même convention que `bird-migrations`/`volcanic-eruptions` plutôt que le socle + balayage de `monument-layers`/`satellites-in-orbit`. **Durée totale de cycle : 90 000 ms** en vitesse "Normal" (voir "Points tranchés à l'implémentation" ci-dessous pour le calibrage).
- `earthquakes` trié par `year` croissant (voir "Contraintes de validation" dans `data-model.md`), curseur d'index avancé à chaque frame. Comme `data-model.md` ne porte que l'année entière (pas de date précise), une décennie dense peut regrouper plus d'un millier de séismes sur un seul palier annuel : un champ `simYear` dérivé côté client (jamais persisté dans le JSON) répartit uniformément les séismes d'une même année sur l'intervalle `[année, année+1)`, dans l'ordre chronologique déjà présent dans le fichier : évite qu'une année dense ne déclenche tous ses pulses sur la même frame plutôt qu'en un flux régulier.
- Année simulée affichée via `Intl.DateTimeFormat(lang, { year: 'numeric' })` (suffisant ici, contrairement à `volcanic-eruptions` qui doit gérer des années avant J.-C. hors de portée de cette API).
- **Curseur d'année** natif (`<input type="range">`, domaine `[1900, 2026]`, granularité annuelle, sans graduations, même composant que `monument-layers`/`satellites-in-orbit`), synchronisé avec l'année simulée pendant la lecture automatique. Un déplacement manuel (`input`) interrompt la lecture automatique (même convention que ces deux visualisations : un `scrub` équivaut à un appui sur Pause), recalcule `playedMs` par inversion directe de la formule `simYear`, et repositionne le curseur d'index (`cursorForSimYear`, recherche binaire sur `simYear`) sur la première entrée non encore atteinte. Contrairement à `monument-layers` (qui redessine l'état accumulé jusqu'à l'année cible), un saut ici vide simplement les pulses/l'annotation en cours : il n'existe pas d'état "carte telle qu'elle était en l'année X" à afficher pour un événement transitoire (voir "Différence avec `volcanic-eruptions`" ci-dessus), seule la suite de la lecture depuis ce point produit de nouveaux pulses.

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations`/`volcanic-eruptions` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` sur tactile — même mécanisme que `bird-migrations`/`volcanic-eruptions`.

## Points tranchés à l'implémentation

- **Domaine public des données USGS confirmé formellement** : page officielle des politiques USGS ("Copyrights and Credits"), citée textuellement dans `data-model.md`.
- **Année de départ :** 1900 conservée telle que décidée au cadrage. La répartition par décennie mesurée sur le catalogue réel (350 événements sur 1900-1909, montée progressive et stable ensuite, voir "Périmètre retenu" dans `data-model.md`) ne montre pas de rupture de complétude qui aurait justifié de reculer ou d'avancer cette borne.
- **Volume réel largement supérieur à l'estimation de cadrage :** 14 453 séismes (contre "quelques milliers" pressentis, comparable à `volcanic-eruptions`), un ordre de grandeur plus dense. Conservé tel quel plutôt que de relever le seuil de magnitude pour s'aligner sur l'estimation initiale : le seuil (magnitude ≥ 6) avait été décidé explicitement avec l'utilisateur pour sa signification sismologique, pas pour atteindre un volume cible, et la densité plus élevée que prévu sert directement l'angle éditorial ("révéler la structure géologique par la seule densité des événements réels").
- **Durée totale de cycle calibrée sur cette densité réelle plutôt que reprise d'une autre visualisation :** simulation du nombre maximal de pulses simultanément actifs (fenêtre glissante de 850 ms) sur le catalogue réel, à plusieurs durées de cycle candidates : 60 000 ms → jusqu'à ~350 pulses simultanés dans les décennies les plus denses (2000-2009), 90 000 ms → ~240, 120 000 ms → ~190. Retenu : **90 000 ms**, compromis entre lisibilité (moins de pulses simultanés qu'à 60 000 ms) et rythme de lecture (un cycle qui reste sensiblement plus court que les 120 000 ms+ qui commencent à distendre l'effet de boucle continue). Valeur de confort choisie à l'implémentation à partir de cette simulation, pas d'un rendu réel observé dans un navigateur (voir limite ci-dessous) : à confirmer visuellement, comme les autres visualisations animées du site l'ont été après un premier rendu observable.
- **Teinte des frontières de plaques tectoniques :** `#b3a696` (gris-brun discret), ajoutée à "Fond de carte (illustration)" dans `style-guide.md` aux côtés de la silhouette et de l'hydrographie déjà cataloguées ; à confirmer visuellement au même titre que la durée de cycle ci-dessus.
- **Sélection des séismes notables confirmée sur le catalogue réel :** les sept candidats pressentis au cadrage existent tous, avec leur véritable identifiant USGS (voir "Sélection des séismes à annoter" dans `data-model.md`), aucun n'a dû être écarté ou remplacé.
- **Réutilisation des assets de `bird-migrations` :** copiés dans `public/data/earthquakes/` plutôt que référencés depuis le dossier de `bird-migrations` (voir "Techno carte" ci-dessus), tranche la question restée ouverte dans `volcanic-eruptions`, au moins pour cette visualisation (`monarch-migration` l'a tranchée de la même façon).
- **Limite de vérification à l'implémentation :** aucun rendu dans un navigateur réel n'a pu être observé pendant le développement (environnement d'exécution sans navigateur graphique disponible). Build Astro et vérification de types passés, logique d'animation (déclenchement des pulses, rebouclage, absence de doublon ou d'omission) vérifiée par simulation Node directement sur le fichier `earthquakes.json` réel plutôt que visuellement. La densité de pulses, la teinte des frontières et la durée de cycle ci-dessus restent donc à confirmer par un premier rendu observé (`npm run dev`), comme documenté pour les autres visualisations animées du site.
