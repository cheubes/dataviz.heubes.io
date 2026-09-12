# Spécifications techniques : L'almanach des vendanges

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Rendu

D3 v7 (`d3-shape` pour les lignes, `d3-scale` pour les échelles, `d3-selection`/`d3-transition` pour les interactions). Rendu SVG : volume de données faible (sept régions, au plus 654 points bruts chacune, environ 4 500 points au total en comptant les moyennes mobiles), pas d'enjeu de performance justifiant Canvas, même raisonnement que `flower-phenology`.

## Lignes discontinues (lacunes de données)

Chaque courbe (brute ou moyenne mobile) est découpée en autant de segments `<path>` que de plages continues de données : aucun trait n'est tracé entre deux années séparées par une lacune, pour ne pas laisser croire à une interpolation qui n'existe pas dans la donnée source. `d3.line().defined(...)` gère nativement cette coupure à partir de la présence ou non de `dayOffset`/`smoothedDayOffset` pour chaque année (voir "Format de sortie" dans `data-model.md`).

## Axes

Pas de zoom ni de pan (retirés à la demande de l'utilisateur, voir aussi "Interactions" dans `functional-specifications.md`) : l'échelle des années est fixe, calculée une fois à la mise en page (et recalculée au redimensionnement de la fenêtre) plutôt que recomposée dynamiquement à chaque geste.

- **Axe des années (abscisse) :** graduations et libellés affichés, pas de rétrécissement/agrandissement possible.
- **Axe du jour de vendange (ordonnée) :** ni graduation ni libellé affichés (retirés à la demande de l'utilisateur) ; des lignes de grille horizontales discrètes (`var(--dv-gridline)`) restent tracées comme repère visuel, la valeur exacte se lit via le survol/tap (voir "Interactions" dans `functional-specifications.md`).

Sans zoom/pan, la zone de montage n'a plus besoin de capturer les gestes tactiles pour elle-même (`touch-action: none` retiré) : le défilement normal de la page fonctionne au doigt au-dessus du graphique, comme sur le reste du site.

## Repères historiques

Trait vertical pointillé `1px` `var(--dv-gridline)` sur toute la hauteur de la zone de tracé, plus une petite icône cliquable ancrée sur l'axe des années. `phylloxera-crisis` (seul repère à couvrir une période plutôt qu'une année, voir `data-model.md`) se rend comme une bande verticale semi-transparente entre `year` et `yearEnd` plutôt qu'un simple trait, pour distinguer visuellement un intervalle d'un instant précis. Le panneau de détail ouvert au clic (voir "Interactions" dans `functional-specifications.md`) est positionné en superposition, ancré au repère, sans déplacer le tracé.

## Palette

Palette catégorielle officielle du site (voir "Palette dataviz" dans `style-guide.md`), pas d'exception : sept régions, dans l'ordre chronologique de leur date de départ dans le dataset (voir "Régions retenues" dans `data-model.md`), assignées aux sept premiers slots fixes (sur huit disponibles).

| Région | Slot | Teinte |
|---|---|---|
| Bourgogne | 1 | Bleu (`#2a78d6`) |
| Vallée du Rhône (sud) | 2 | Orange (`#eb6834`) |
| Bordeaux | 3 | Aqua (`#1baf7a`) |
| Languedoc | 4 | Jaune (`#eda100`) |
| Alsace | 5 | Magenta (`#e87ba4`) |
| Basse vallée de la Loire | 6 | Vert (`#008300`) |
| Champagne | 7 | Violet (`#4a3aa7`) |

Sept séries en lignes : à ce nombre, la palette catégorielle officielle passe du régime "adjacent" (gate-safe jusqu'à huit teintes pour des lignes qui peuvent se croiser sans se chevaucher en aplat) au palier suivant de l'échelle du skill dataviz ("5-6 : plafond souple, légende ou petits multiples" puis "7-8 : plafond du jeton de couleurs") : décision assumée avec l'utilisateur, qui a validé l'ajout malgré ce resserrement plutôt que de proposer des petits multiples. Pas d'étiquette directe en fin de courbe (retirée à la demande de l'utilisateur avec les graduations de l'ordonnée, voir "Axes" ci-dessus) : l'identification des régions reste portée par la légende/filtre à cases à cocher, toujours visible au-dessus du graphique (voir "Contenu" dans `functional-specifications.md`), et par le tooltip au survol, jamais par la couleur seule.

## Conversion des dates

Les données sources expriment une date de vendange en nombre de jours après le 31 août, y compris négatif (voir "Schéma des données brutes" dans `data-model.md`). Converties côté client en date calendaire lisible (ex. `31 août + 22 jours` → "22 septembre") pour l'axe, les tooltips et le panneau de détail des repères ; l'année de référence utilisée pour ce calcul (une année non bissextile arbitraire) n'a pas d'incidence, seul le décalage en jours depuis le 31 août est signifiant.

## Nouvelles dépendances

Aucune : `d3-shape`, `d3-scale`, `d3-selection`, `d3-transition` sont déjà des dépendances du site (via `bird-migrations`, `flower-phenology`), toutes réutilisées à l'identique, scopées à cette visualisation par convention npm.

## Hydratation

`client:visible`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.
