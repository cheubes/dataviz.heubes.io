# Spécifications techniques : Le pouls du globe

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : implémenté.**

## Source des données

Catalogue d'éruptions du Global Volcanism Program (Smithsonian), voir "Dataset source", "Licence" et "Récupération des données" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement (web service WFS du GVP, pas de scraping HTML), pas à chaque build. Script de prétraitement Node ponctuel, non committé (même convention que toutes les visualisations précédentes, voir par exemple "Prétraitement" dans `specs/bird-migrations/data-model.md`), à rejouer manuellement si le catalogue GVP est mis à jour.

## Techno carte

Même stack que `bird-migrations`/`monarch-migration`/`earthquakes`, D3 v7, pas de Leaflet.

- **Fond de carte, cours d'eau, relief : copiés (octets identiques) depuis `public/data/bird-migrations/`** (`basemap.json`, `rivers.json`, `relief.webp`) vers `public/data/volcanic-eruptions/`, plutôt que référencés directement — copie plutôt que référence entre dossiers, convention confirmée par `monarch-migration` et `earthquakes` (voir leurs `technical-specifications.md` respectifs). Pas de frontières de plaques tectoniques ici (propres à `earthquakes`, hors périmètre de cette visualisation).
- Les constantes d'alignement du relief (`RELIEF_REF_WIDTH/HEIGHT`, `RELIEF_ORIGIN_X/Y`) sont une propriété physique du fichier `relief.webp` lui-même : reprises identiques à `bird-migrations`/`earthquakes`, indépendamment du cadrage `fitExtent` propre à cette visualisation (planisphère entier, comme `earthquakes`).
- **Projection :** `d3.geoNaturalEarth1`, `fitExtent` sur l'étendue complète de la silhouette (planisphère entier visible par défaut).

## Rendu

**Canvas 2D**, même choix que `bird-migrations`/`earthquakes`/`satellites-in-orbit`/`monument-layers` : 10 937 éruptions (11 089 dans le catalogue Holocène brut, 111 antérieures à -8000 exclues, 41 hors catalogue de volcans holocènes exclues, voir "Éruptions hors catalogue de volcans holocènes" dans `data-model.md`) et 1 214 volcans (voir "Récupération des données" et "Champs source utilisés" dans `data-model.md`), du même ordre de grandeur que `earthquakes` (14 453 séismes).

- Deux canvas superposés : un canvas de fond (silhouette, cours d'eau, relief, redessiné seulement au redimensionnement/zoom) et un canvas de premier plan (points de volcan au repos + pulses), même architecture que `bird-migrations`/`earthquakes`.
- **Volcans au repos :** un point discret et permanent (rayon fixe 2,5 px, teinte neutre `#6b6455`, voir "Palette" ci-dessous et son entrée dans `style-guide.md` "Fond de carte (illustration)") marque la position de chaque volcan en permanence, y compris les 299 volcans du catalogue sans éruption datée (voir "Champs source utilisés" dans `data-model.md`). Dessiné sur le canvas de fond (redessiné seulement au redimensionnement/zoom, pas à chaque frame d'animation) plutôt que sur le canvas de premier plan : à la différence des pulses, leur position ne change jamais entre deux frames, les y redessiner en continu serait un coût inutile (1 214 points à chaque frame, contre quelques dizaines de pulses actifs au plus). Non clippés à la silhouette terrestre (comme les frontières de plaques tectoniques d'`earthquakes`) : certains volcans se trouvent en zone côtière où le tracé de la silhouette peut légèrement diverger de la position exacte du point.
- **Pulse d'éruption :** à l'instant simulé où une éruption a lieu, un cercle est dessiné au point du volcan, rayon et opacité initiale croissants avec le VEI de l'éruption (`d3.scaleSqrt`, domaine `[0, 8]`, VEI non déterminé traité comme 0, voir "VEI non déterminé" dans `data-model.md`), puis s'étend et s'estompe sur une durée fixe courte (700 ms de temps réel, indépendante de la vitesse de lecture choisie — un pulse doit rester visible et lisible même en vitesse "Rapide").
- **Fiche de détail permanente :** contrairement à `earthquakes` (dont le hit-test ne porte que sur les pulses actifs), le survol/tap porte sur les 1 214 points permanents en tout temps (voir "Survol/tap d'un volcan" dans `functional-specifications.md`) : recherche du point permanent le plus proche du curseur/du tap, pas seulement des pulses en cours.
- **Annotation textuelle** (éruptions notables, voir "Sélection des éruptions à annoter" dans `data-model.md`) : élément DOM superposé au Canvas (même approche que `earthquakes`), positionné près du point du volcan concerné, apparition synchronisée avec le pulse, rémanence 2 200 ms (même durée que `earthquakes`) pour rester lisible après l'extinction du pulse.

## Palette

Palette **séquentielle sur le VEI**, teinte propre à cette visualisation (orange, `H≈41°` en OKLCH), pas la palette bleue par défaut de `style-guide.md` (réservée par `earthquakes` pour la magnitude) : distingue visuellement les deux visualisations les plus proches du site (même fond de carte, même mécanisme de pulse en boucle continue). Générée par la même méthode que la rampe bleue (mêmes paliers de luminosité OKLCH, teinte tournée vers l'orange catégoriel `#eb6834`), validée avec le validateur du skill dataviz (`validate_palette.js`, monotonie de luminosité et hue unique confirmées ; le plancher de contraste bout clair, propre au job "Ordinal", ne s'applique pas ici — job "Sequential", même statut que la rampe bleue déjà en production sur `earthquakes`, voir `references/color-formula.md` du skill).

- Domaine VEI `[0, 8]` (échelle GVP officielle ; VEI 7 le maximum réellement observé sur le catalogue Holocène, pas de VEI 8 documenté).
- `VOLCANIC_SEQUENTIAL_ORANGE: [string, string] = ['#ffd3c2', '#631b00']` (palier le plus clair → le plus foncé). VEI faible : pulse clair et discret. VEI élevé : pulse large et intense (`#631b00`, le plus saturé).
- Point de volcan au repos (voir "Rendu" ci-dessus) : `#6b6455`, teinte neutre fixe, hors de cette échelle, ajoutée à `style-guide.md` ("Fond de carte (illustration)").

## Animation

- Boucle `d3-timer`, pilotée par une année simulée continue sur le domaine `[-8000, 2026]` (bornes réelles du catalogue après exclusion des éruptions antérieures à l'Holocène, voir "Champs source utilisés" dans `data-model.md`), soit environ 10 026 ans, **bouclée en continu** (voir "Lecture automatique en boucle" dans `functional-specifications.md`) plutôt qu'un passage unique, sans pause finale (même convention que `bird-migrations`/`earthquakes`).
- `eruptions` étant trié par `year` croissant (voir "Contraintes de validation" dans `data-model.md`), un curseur d'index parcourt la liste à chaque frame pour déclencher les pulses dont l'année simulée vient d'être atteinte. Même répartition fine des éruptions d'une même année sur `[year, year+1)` que `earthquakes` (`assignSimYears`), pour lisser la cadence de déclenchement plutôt qu'un paquet simultané à chaque changement d'année entière.
- Sélecteur de vitesse : modifie la durée totale d'un cycle complet (facteurs ×0,5/×1/×2, identiques à `bird-migrations`/`earthquakes`), pas la durée d'affichage d'un pulse individuel (voir "Rendu" ci-dessus, durée de pulse fixe en temps réel).
- **Durée totale du cycle en vitesse "Normal" : 120 secondes**, calée par simulation sur le catalogue réel (pic réel de 54 éruptions sur une même année civile, 2004) puis confirmée par observation directe dans le navigateur (voir "Points tranchés à l'implémentation" ci-dessous) — plus long que les 90 secondes de `earthquakes`, cohérent avec un volume d'éruptions 23 % supérieur (11 089 contre 14 453, sur une période 80 fois plus longue) et l'ordre de grandeur de compression temporelle inédit du sujet (dix mille ans).
- **Affichage de l'année simulée :** signe explicite plutôt que `Intl.DateTimeFormat` (limité à l'an 1 et non conçu pour des dates très anciennes) — `Intl.NumberFormat(lang).format(Math.abs(Math.floor(simYear)))` suivi du suffixe `yearBcSuffix` (« av. J.-C. » / « BC ») si l'année est négative, sans suffixe sinon (même convention que `centuryBcSuffix` de `monument-layers`, pas de suffixe explicite « apr. J.-C. » pour les années positives, cohérent avec l'usage courant).

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations`/`earthquakes` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent (déjà présentes dans `package.json`).

## Hydratation

Zone de montage hydratée via un `<script>` classique posant un `IntersectionObserver` (`rootMargin: 200px`) qui ne monte le rendu qu'au premier passage en viewport — même mécanisme que `earthquakes`/`bird-migrations` (pas de directive Astro `client:visible` à proprement parler : ces composants n'utilisent aucun framework UI, voir "Hydratation" dans `technical-specifications.md` général).

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. Bouton Play/Pause en `<button>` standard avec `aria-pressed` synchronisé, curseur d'année en `<input type="range">` natif, sélecteur de vitesse en `<select>` natif avec `aria-label` : les trois accessibles au clavier par construction, même pattern que `earthquakes`.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` sur tactile, boutons zoomer/dézoomer/réinitialiser en complément (haut droit de la zone de carte) — même mécanisme que `bird-migrations`/`monarch-migration`/`earthquakes`.

## Points tranchés à l'implémentation

- **Licence GVP vérifiée** (voir "Licence" dans `data-model.md`) : usage non commercial avec citation, web service WFS accessible sans blocage anti-bot (contrairement au site HTML principal).
- **Volume réel confirmé** : 1 214 volcans, 11 089 éruptions holocènes (dont 915 volcans avec au moins une éruption datée), lisible en Canvas sans surcharge (même ordre de grandeur que `earthquakes`).
- **Critère de sélection des éruptions notables :** VEI ≥ 6 (54 éruptions dans le domaine `[-8000, 2026]`) + Vésuve 79 (seul candidat pressenti au cadrage sous ce seuil), soit 55 éruptions notables au total, voir "Sélection des éruptions à annoter" dans `data-model.md`.
- **Durée du cycle "Normal" :** 120 secondes (voir "Animation" ci-dessus).
- **Réutilisation des fichiers `basemap.json`/`rivers.json`/`relief.webp` :** copie octet pour octet depuis `bird-migrations`, comme `monarch-migration`/`earthquakes` (voir "Techno carte" ci-dessus).
