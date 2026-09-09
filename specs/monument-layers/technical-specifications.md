# Spécifications techniques : Les strates du patrimoine

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

Dataset "Immeubles protégés au titre des monuments historiques" (data.gouv.fr / ministère de la Culture), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), malgré la mise à jour hebdomadaire de la source.

## Rendu

**Canvas 2D, pas SVG**, même famille de choix que `bird-migrations`, `satellites-in-orbit` et `paris-trees` : volume de points important (de l'ordre de quarante-cinq mille, voir `data-model.md`).

- **Fond de carte :** silhouette de la France métropolitaine, réutilisation envisagée de `public/data/biodiversity/basemap.json` (TopoJSON, 18 Ko, voir "Fond de carte" dans son `technical-specifications.md`) plutôt qu'une nouvelle extraction depuis `world-atlas` — à confirmer à l'implémentation que ce fichier convient tel quel. Projection `d3.geoMercator()` avec `fitExtent` directement sur la géométrie France, même mécanisme que `biodiversity`. Dessiné sur un canvas de fond, redessiné seulement au redimensionnement ou au zoom.
- **Monuments :** canvas de premier plan. Points statiques une fois apparus (pas de mouvement, comme `paris-trees`) : chaque nouveau point (monument dont l'année de construction simulée vient d'être atteinte) est peint par-dessus le canvas existant, pas de redessin complet à chaque frame. Un changement de filtre protection ou un "Rejouer" vide le canvas de premier plan et reconstruit l'accumulation déjà atteinte en une seule passe avant de reprendre l'accumulation frame par frame (même mécanisme que `satellites-in-orbit`).
- D3 utilisé pour les calculs (projection géographique, échelle de couleur séquentielle via `d3-scale`, boucle d'animation via `d3-timer`), pas pour le rendu DOM des points.

## Animation

- Boucle `d3-timer`, pilotée par une année simulée continue, du `constructionYear` le plus ancien retenu à l'année de récupération du catalogue (voir `generatedAt` dans `data-model.md`). Même principe que `satellites-in-orbit` (échelle temporelle linéaire, passage unique sans bouclage), mais sur une plage bien plus large (potentiellement depuis l'Antiquité) : voir "Points à valider à l'implémentation" ci-dessous pour son effet sur le rythme perçu.
- `monuments.json` étant trié par `constructionYear` croissant (voir "Contraintes de validation" dans `data-model.md`), un simple curseur d'index suffit à déterminer les nouveaux points à peindre à chaque frame, pas de parcours complet du tableau.
- Siècle simulé affiché via `centuryLabel` du dernier monument peint, pas recalculé côté client (voir "Format de sortie" dans `data-model.md`).
- Durée totale indicative : à définir à l'implémentation une fois la répartition réelle des monuments par siècle connue (voir ci-dessous), plutôt qu'une valeur arbitraire fixée sans avoir vu la distribution réelle.

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`), pas la palette catégorielle : décision explicite de l'utilisateur (voir échanges de cadrage), qui évite le problème rencontré sur `satellites-in-orbit` et `paris-trees` (trop de catégories pour les huit teintes garanties, nécessitant une exception documentée) puisqu'aucune dimension catégorielle n'est encodée par couleur ici.

- Teinte de base bleue par défaut (voir palette séquentielle du style-guide), palier clair pour les monuments les plus anciens, palier foncé pour les plus récents : `d3.scaleSequential` (ou `d3.scaleLinear` sur les paliers documentés du style-guide) sur le domaine `[constructionYear le plus ancien, aujourd'hui]`.
- Contrairement à `satellites-in-orbit` (couleur catégorielle par zone) et `paris-trees` (couleur catégorielle par genre), la couleur ici ne sert pas de filtre : le filtre disponible (nature de la protection, voir "Interactions" dans `functional-specifications.md`) est indépendant de la couleur.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection, tracé du fond de carte (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur séquentielle (`scaleSequential` ou équivalent) | Idem |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile) | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au canvas | Idem |

Pas de `topojson-client` si le fond de carte de `biodiversity` est repris tel quel sous une forme déjà exploitable (à confirmer à l'implémentation selon le format exact conservé dans `basemap.json`).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom` (même mécanisme que `bird-migrations` et `paris-trees`) ; fiche de détail déclenchée par `pointerdown`/`click` plutôt que `pointermove` quand `event.pointerType === 'touch'`.

## Points à valider à l'implémentation

- Répartition réelle des monuments par siècle, pour calibrer la durée de l'animation et vérifier que les premières strates (Antiquité, haut Moyen Âge) restent visibles à l'écran plutôt que de s'écouler en une fraction de seconde face à la densité du dix-neuvième siècle.
- Proportion de notices écartées faute de siècle de construction exploitable ou de coordonnées valides (voir "Prétraitement" dans `data-model.md`).
- Compatibilité effective de `public/data/biodiversity/basemap.json` tel quel (même périmètre géographique, mais à vérifier que rien dans son contenu ou son format n'est spécifique à `biodiversity`).
- Taille exacte de `monuments.json` une fois généré ; passage éventuel à un encodage en tableaux parallèles (voir "Format de données" dans `technical-specifications.md` de `paris-trees`) si elle s'avère trop importante.
