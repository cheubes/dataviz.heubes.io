# Spécifications techniques : Le pouls du globe

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Catalogue d'éruptions du Global Volcanism Program (Smithsonian), voir "Dataset source" et "Réserve sur la licence" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build.

## Techno carte

Même stack que `bird-migrations`/`animal-migrations`, D3 v7, pas de Leaflet.

- **Fond de carte, cours d'eau, relief : réutilisation directe des assets de `bird-migrations`** (`public/data/bird-migrations/basemap.json`, `rivers.json`, `relief.webp`), déjà à couverture mondiale (voir "Techno carte" dans `animal-migrations/technical-specifications.md` pour la même décision et la même réserve sur la modalité exacte de réutilisation entre dossiers de données).
- **Projection :** `d3.geoNaturalEarth1`, `fitExtent` sur l'étendue complète de la silhouette (planisphère entier visible par défaut, même choix que `animal-migrations`).

## Rendu

**Canvas 2D**, même choix que `bird-migrations`/`satellites-in-orbit`/`monument-layers` : volume d'éruptions potentiellement important une fois le catalogue GVP complet inspecté (plusieurs milliers attendues sur dix mille ans, voir "Points à valider à l'implémentation" ci-dessous).

- Deux canvas superposés : un canvas de fond (silhouette, cours d'eau, relief, redessiné seulement au redimensionnement/zoom) et un canvas de premier plan (pulses), même architecture que `bird-migrations`.
- **Pulse d'éruption :** à l'instant simulé où une éruption a lieu, un cercle est dessiné au point du volcan, rayon et opacité initiale croissants avec le VEI de l'éruption (`d3.scaleSqrt` du VEI vers un rayon maximal en pixels), puis s'étend et s'estompe sur une durée fixe courte (quelques centaines de millisecondes de temps réel, indépendante de la vitesse de lecture choisie — un pulse doit rester visible et lisible même en vitesse "Rapide").
- **Volcans au repos :** un point discret et permanent marque la position de chaque volcan même hors pulse (voir "Survol/tap d'un volcan" dans `functional-specifications.md`, qui doit fonctionner à tout moment) — un petit point fixe en teinte neutre, distinct du pulse temporaire.
- **Annotation textuelle** (éruptions notables, voir "Sélection des éruptions à annoter" dans `data-model.md`) : élément DOM superposé au Canvas (même approche que le tooltip de `bird-migrations`), positionné près du point du volcan concerné, apparition/disparition synchronisée avec son pulse.

## Palette

Palette **séquentielle** sur le VEI (voir "Palette dataviz" dans `style-guide.md`), pas la palette catégorielle : le VEI est un ordre continu (0 à 8), pas des catégories à distinguer deux à deux. Pas d'exception à documenter ici.

- VEI faible : pulse clair et discret. VEI élevé : pulse large et intense (couleur la plus saturée de l'échelle retenue).
- Point de volcan au repos (voir "Rendu" ci-dessus) : teinte neutre fixe, hors de cette échelle.

## Animation

- Boucle `d3-timer`, pilotée par une année simulée continue sur le domaine `[-8000 environ, aujourd'hui]` (dix mille ans, bornes exactes à confirmer sur le catalogue réel), **bouclée en continu** (voir "Lecture automatique en boucle" dans `functional-specifications.md`) plutôt qu'un passage unique.
- `eruptions` étant trié par `year` croissant (voir "Contraintes de validation" dans `data-model.md`), un curseur d'index parcourt la liste à chaque frame pour déclencher les pulses dont l'année simulée vient d'être atteinte.
- Sélecteur de vitesse : modifie la durée totale d'un cycle complet, pas la durée d'affichage d'un pulse individuel (voir "Rendu" ci-dessus, durée de pulse fixe en temps réel).
- Année simulée affichée avec son signe (av./apr. J.-C. selon la langue), pas seulement `Intl.DateTimeFormat` (qui ne couvre pas nativement des années avant l'an 1 ou très lointaines) — mécanisme d'affichage à concevoir à l'implémentation plutôt que réutiliser tel quel celui de `bird-migrations`/`animal-migrations` (mois de l'année, pas des années sur dix millénaires).

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent, seulement nouvelles pour cette visualisation.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` sur tactile — même mécanisme que `bird-migrations`/`animal-migrations`.

## Points à valider à l'implémentation

- Texte exact des conditions d'utilisation du GVP (voir "Réserve sur la licence" dans `data-model.md`), avant tout développement.
- Volume réel du catalogue d'éruptions une fois récupéré, pour confirmer que Canvas et la fréquence de pulses restent lisibles sans surcharge visuelle aux périodes les plus documentées (derniers siècles).
- Critère précis de sélection des éruptions "notables" à annoter (voir "Sélection des éruptions à annoter" dans `data-model.md`).
- Durée totale du cycle complet en vitesse "Normal", à caler une fois un premier rendu réel observable (dix mille ans compressés, contre trente-six secondes pour un cycle annuel sur `bird-migrations` : un ordre de grandeur de compression temporelle inédit sur le site).
- Modalité exacte de réutilisation des fichiers `basemap.json`/`rivers.json`/`relief.webp` de `bird-migrations` (même question ouverte que `animal-migrations`, voir son `technical-specifications.md`).
