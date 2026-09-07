# Spécifications techniques : La biodiversité française

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno cartes

D3 v7 seul, pas de Leaflet (voir échanges de cadrage : cohérence entre les trois visualisations, pas de dépendance à un serveur de tuiles tiers en runtime, esthétique illustrée plutôt que carte générique).

- **Fond de carte :** silhouette SVG de la France métropolitaine, dérivée d'un fichier TopoJSON simplifié committé dans le repo (source à choisir à l'implémentation : ex. IGN, Natural Earth, ou un contour communal simplifié déjà publié en open data ; fichier statique, pas une dépendance npm).
- **Grille hexagonale :** géométries H3 précalculées côté script de prétraitement (voir `data-model.md`), livrées comme polygones GeoJSON dans le JSON de sortie. Aucun calcul H3 côté client, donc pas de dépendance `h3-js` dans le navigateur.
- **Rendu :** SVG (`d3-selection`, `d3-geo` pour la projection, `d3-scale` pour l'intensité de couleur par cellule).
- **Pan/zoom :** `d3-zoom`, contraint à la silhouette de la France (pas de panoramique libre hors de cette zone).

## Périmètre carte

France métropolitaine uniquement, pas les DOM (voir échanges de cadrage : une carte illustrée à silhouette unique ne se prête pas à l'échelle très différente des DOM sans une maquette à encarts, hors périmètre de cette visualisation). Le filtre GBIF exclut donc les codes commune des DOM au prétraitement (voir `data-model.md`).

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3` (v7) ou modules `d3-*` ciblés (`d3-selection`, `d3-geo`, `d3-zoom`, `d3-scale`, `d3-fetch`) | Rendu de la carte et de la grille | Scopée à cette visualisation (île Astro), voir "Règles communes" dans `technical-specifications.md` général |
| `topojson-client` | Conversion du fond de carte TopoJSON → GeoJSON côté client | Idem |

Préférer l'import des modules `d3-*` ciblés plutôt que le paquet `d3` complet, pour limiter le poids du bundle de cette île.

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

Pas de Font Awesome pour les boutons de filtre par groupe (le draft proposait `fa-feather`, `fa-paw`, etc.) : `style-guide.md` réserve Font Awesome aux quatre icônes Creative Commons du pied de page. Icônes SVG inline minimalistes par groupe, à concevoir à l'implémentation (voir "Iconographie" dans `style-guide.md`).

## Mode "données en direct"

Voir `data-model.md` pour l'endpoint, les paramètres et le format de réponse.

- Requête déclenchée au clic sur la bascule et à chaque changement de filtre tant que le mode est actif (`fetch` natif, pas de librairie HTTP supplémentaire).
- CORS de l'API GBIF (`api.gbif.org`) à valider à l'implémentation ; si indisponible, ce mode devient irréalisable tel quel et devra être revu (voir limite déjà documentée dans `data-model.md`).
- Rendu des points bruts : cercles SVG simples (`d3-selection`), pas de nouvelle dépendance.
- Aucune donnée locale envoyée à GBIF : seuls les filtres choisis par le visiteur (groupe, saison) deviennent des paramètres de requête publique, pas de donnée personnelle.

## Hydratation

`client:visible` (la carte n'est pas critique au premier affichage de la page, voir "Performance" dans `technical-specifications.md` général).

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation pour le comportement attendu ; implémentation via écouteurs d'événements tactiles (`touchstart`/`touchmove`/`touchend` ou API Pointer Events unifiée) en plus des événements souris pour `d3-zoom` et le tooltip.
