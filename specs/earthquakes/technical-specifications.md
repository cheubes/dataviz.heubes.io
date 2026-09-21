# Spécifications techniques : Les lignes de faille

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Catalogue USGS (`fdsnws/event`) et frontières de plaques tectoniques (modèle de Bird), voir "Dataset source" et "Format de sortie" dans `data-model.md`. Citation requise pour les frontières de plaques (ODC-BY, attribution Hugo Ahlenius/Nordpil/Peter Bird) dans le bloc de crédit des sources de la page.

## Techno carte

Même stack que `bird-migrations`/`monarch-migration`/`volcanic-eruptions`, D3 v7.

- **Fond de carte, cours d'eau, relief : réutilisation directe des assets de `bird-migrations`** (même réserve sur la modalité de partage entre dossiers que `volcanic-eruptions`, voir son `technical-specifications.md` ; `monarch-migration` l'a tranchée par copie dans son propre dossier de données, voir "Techno carte" dans son `technical-specifications.md`).
- **Frontières de plaques tectoniques :** géométrie statique (`plateBoundaries`, voir "Format de sortie" dans `data-model.md`) tracée sur le canvas de fond, même clip que la silhouette terrestre, teinte discrète (à valider visuellement, dans l'esprit des cours d'eau de `bird-migrations` — fine, présente mais jamais dominante face aux pulses).
- **Projection :** `d3.geoNaturalEarth1`, `fitExtent` sur l'étendue complète de la silhouette, même choix que `volcanic-eruptions`.

## Rendu

**Canvas 2D**, même mécanisme que `volcanic-eruptions` (voir "Rendu" dans son `technical-specifications.md`), repris presque à l'identique :

- Pulse d'un séisme au moment simulé de sa survenue, rayon et opacité initiale croissants avec la magnitude (`d3.scaleSqrt`), s'étendant et s'estompant sur une durée fixe courte en temps réel.
- **Différence avec `volcanic-eruptions` :** pas de point permanent au repos. Un volcan est un lieu fixe qui pulse plusieurs fois (voir "Volcans au repos" dans son `technical-specifications.md`) ; un séisme est un événement unique sans lieu "propriétaire" à afficher en permanence (l'épicentre d'un séisme de 1906 n'a pas de raison de rester marqué en 2026) — aucun point discret hors pulse, seule la trace du pulse (et sa rémanence courte, voir "Survol/tap d'un point" dans `functional-specifications.md`) rend un séisme interactif, pendant une fenêtre de temps limitée après son occurrence plutôt qu'indéfiniment.
- **Annotation textuelle** (séismes notables) : même mécanisme que `volcanic-eruptions` (élément DOM superposé, synchronisé avec le pulse).

## Palette

Palette **séquentielle** sur la magnitude, même principe que `volcanic-eruptions` sur le VEI. Pas d'exception à documenter.

## Animation

- Boucle `d3-timer`, année simulée continue sur le domaine `[~1900, aujourd'hui]`, bouclée en continu — même mécanisme que `volcanic-eruptions`, sur une plage nettement plus courte (environ cent vingt-cinq ans contre dix mille) : durée de cycle à recalibrer en conséquence plutôt que reprise telle quelle (voir "Points à valider à l'implémentation" ci-dessous).
- `earthquakes` trié par `year` croissant (voir "Contraintes de validation" dans `data-model.md`), même mécanisme de curseur d'index que `volcanic-eruptions`.
- Année simulée affichée via `Intl.DateTimeFormat(lang, { year: 'numeric' })` (suffisant ici, contrairement à `volcanic-eruptions` qui doit gérer des années avant J.-C. hors de portée de cette API).

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations`/`volcanic-eruptions` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` sur tactile — même mécanisme que `bird-migrations`/`volcanic-eruptions`.

## Points à valider à l'implémentation

- Confirmation formelle du domaine public des données USGS (voir "Dataset source" dans `data-model.md`) : niveau de confiance élevé mais page de conditions d'utilisation non consultée directement.
- Année de départ exacte du périmètre (voir "Périmètre retenu" dans `data-model.md`), selon la complétude réelle du catalogue USGS pour la magnitude retenue.
- Volume réel de séismes ≥ magnitude 6 depuis 1900 une fois le catalogue récupéré, pour confirmer l'ordre de grandeur pressenti (comparable à `volcanic-eruptions`).
- Durée totale du cycle en vitesse "Normal", à recalibrer sur une plage d'environ cent vingt-cinq ans plutôt que dix mille.
- Teinte et opacité des frontières de plaques tectoniques, à caler visuellement pour rester discrètes sans devenir invisibles.
- Critère précis de sélection des séismes "notables" à annoter (voir "Sélection des séismes à annoter" dans `data-model.md`).
