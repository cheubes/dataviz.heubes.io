# Spécifications techniques : La biodiversité française

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno cartes

D3 v7 seul, pas de Leaflet (voir échanges de cadrage : cohérence entre les trois visualisations, pas de dépendance à un serveur de tuiles tiers en runtime, esthétique illustrée plutôt que carte générique).

- **Fond de carte :** silhouette SVG de la France métropolitaine (`public/data/biodiversity/basemap.json`), dérivée du paquet `world-atlas` (`countries-50m.json`, données Natural Earth, domaine public), même famille de source que `bird-migrations` mais résolution 50m (pas 110m) puisqu'un seul pays isolé, plus détaillé, reste léger. Récupéré une fois via le CDN jsDelivr, la géométrie France (id `250`) en est extraite puis retopologisée en un fichier TopoJSON autonome (objet `france`, 3 arcs, ~18 Ko) via `topojson-server`/`topojson-simplify` (outils utilisés ponctuellement au prétraitement, pas des dépendances npm du projet, comme `h3-js` ci-dessous). **Piège rencontré :** `world-atlas` regroupe les départements et territoires d'outre-mer (Mayotte, Réunion, Guadeloupe, Guyane...) comme polygones supplémentaires de la même géométrie "France" (contrairement au code pays GBIF, qui les distingue nativement, voir `data-model.md`) ; filtrés par bounding box (lon -6 à 10, lat 41 à 52) avant retopologisation.
- **Grille hexagonale :** géométries H3 précalculées côté script de prétraitement (voir `data-model.md`), livrées comme polygones GeoJSON dans le JSON de sortie. Aucun calcul H3 côté client, donc pas de dépendance `h3-js` dans le navigateur (utilisée uniquement par le script de prétraitement local, non commité, comme `topojson-server` ci-dessus).
- **Rendu :** SVG (`d3-geo` pour la projection, `d3-scale` pour l'intensité de couleur par cellule). Projection `d3.geoMercator()` avec `fitExtent` directement sur la géométrie France (pas de rectangle de cadrage manuel comme `bird-migrations`, un seul pays plutôt qu'une zone multi-continents).
- **Pas de pan/zoom** (écart à l'intention initiale, demande explicite à l'implémentation, voir "Interactions" dans `functional-specifications.md`) : `d3-zoom` retiré, la carte reste fixe sur la vue `fitExtent` (silhouette entière de la France toujours visible). `d3-selection` n'est donc plus nécessaire non plus (elle ne servait qu'à attacher le comportement de zoom).
- **Résolution H3 :** 4 (~1770 km²/cellule, 395 cellules après filtrage côtier), pas 5 comme envisagé initialement — voir "Prétraitement" dans `data-model.md` pour la justification (volume de requêtes à la préparation, et concordance avec la granularité de la grille source).

## Périmètre carte

France métropolitaine uniquement, pas les DOM (voir échanges de cadrage : une carte illustrée à silhouette unique ne se prête pas à l'échelle très différente des DOM sans une maquette à encarts, hors périmètre de cette visualisation). Deux mécanismes distincts assurent cette exclusion en pratique (voir `data-model.md`, "Couverture géographique" et "Prétraitement") : le code pays GBIF `FR` exclut déjà nativement les DOM côté données (ils portent chacun leur propre code ISO), tandis que le fond de carte `world-atlas` les bundle dans la même géométrie "France" et nécessite un filtrage explicite par bounding box.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo`, `d3-scale` | Rendu de la carte et de la grille (projection, échelles de couleur) | Scopée à cette visualisation (île Astro), voir "Règles communes" dans `technical-specifications.md` général ; déjà présentes au `package.json` depuis `bird-migrations`, aucun ajout nécessaire |
| `topojson-client` | Conversion du fond de carte TopoJSON → GeoJSON côté client | Idem, déjà présente |

Pas de `d3-fetch` : `fetch` natif suffit (`fetch('/data/biodiversity/hexbins.json')`), cohérent avec `bird-migrations`/`flower-phenology` qui font de même. `h3-js`, `topojson-server` et `topojson-simplify` (prétraitement uniquement, voir `data-model.md`) ne sont pas des dépendances du projet : installées ponctuellement en local (`npm install --no-save`) pour le script hors-build, jamais ajoutées au `package.json`.

## Palette

Palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`), six groupes ≤ huit slots disponibles, assignés dans l'ordre :

| Slot | Teinte | Groupe |
|---|---|---|
| 1 | Bleu | Oiseaux |
| 2 | Orange | Mammifères |
| 3 | Aqua | Reptiles et amphibiens |
| 4 | Jaune | Insectes |
| 5 | Magenta | Plantes |
| 6 | Vert | Champignons |

**Écart assumé par rapport au draft d'origine :** l'ordre fixe de la palette officielle ne permet pas de reproduire l'association intuitive "vert = plantes, brun = champignons" du draft. Le vert échoit ici aux champignons. Signalé pour validation à la relecture ; à réordonner si une autre affectation est préférée, tant que l'ordre des slots reste respecté pour la cohérence inter-visualisations.

Intensité par cellule (nombre d'observations pour le filtre courant) : échelle séquentielle bleue par défaut (voir "Palette séquentielle" dans `style-guide.md`) quand "Tous les groupes" est actif ; teinte du groupe sélectionné sinon.

## Iconographie des filtres

Pas de Font Awesome pour les boutons de filtre par groupe (le draft proposait `fa-feather`, `fa-paw`, etc.) : `style-guide.md` réserve Font Awesome aux quatre icônes Creative Commons du pied de page. **Écart à l'intention initiale** ("icônes SVG inline minimalistes par groupe") : à l'implémentation, choix d'une simple pastille de couleur (cercle, `--dv-*-swatch`) par groupe plutôt que des pictogrammes dédiés, par cohérence avec le motif déjà établi par `bird-migrations` (espèces) et `flower-phenology` (espèces) — la légende y sert aussi de filtre, avec une pastille de couleur et un libellé, sans iconographie propre à chaque entrée.

## Mode "données en direct"

Voir `data-model.md` pour l'endpoint, les paramètres et le format de réponse.

- Requête déclenchée au clic sur la bascule et à chaque changement de filtre tant que le mode est actif (`fetch` natif, pas de librairie HTTP supplémentaire).
- CORS de l'API GBIF (`api.gbif.org`) validé à l'implémentation : `Access-Control-Allow-Origin: *`, sans restriction d'origine.
- Rendu des points bruts : cercles SVG simples (DOM natif, `document.createElementNS`), pas de nouvelle dépendance.
- Aucune donnée locale envoyée à GBIF : seuls les filtres choisis par le visiteur (groupe, saison) deviennent des paramètres de requête publique, pas de donnée personnelle.

## Hydratation

`client:visible` (la carte n'est pas critique au premier affichage de la page, voir "Performance" dans `technical-specifications.md` général).

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation pour le comportement attendu ; sans pan/zoom (voir "Techno cartes" ci-dessus), le seul geste tactile à gérer est le tap sur une cellule pour le tooltip, via l'API Pointer Events unifiée (déjà utilisée pour le survol souris).
