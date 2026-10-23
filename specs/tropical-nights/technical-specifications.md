# Spécifications techniques : Les nuits tropicales

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : spécifié, non implémenté.**

## Source des données

Données climatologiques de base quotidiennes de Météo-France, préparées une fois hors build en `public/data/tropical-nights/nights.json` (voir "Prétraitement" et "Format de sortie" dans `data-model.md`). Aucun appel à un service tiers à l'exécution.

## Rendu

**Canvas 2D pour les cases, SVG pour le reste.** La vue d'ensemble dessine 8 × 77 × 184 = 113 344 cases (vue détaillée : 14 168) : un `<rect>` SVG par case pèserait sur le DOM et sur chaque survol, sans bénéfice puisque les cases ne sont pas accessibles individuellement de toute façon (voir "Accessibilité" ci-dessous). Même raisonnement que les visualisations du site à gros volume, à l'inverse de `flower-phenology` ou `light-pollution` (quelques centaines d'éléments, SVG).

- **Un canvas par grille** (huit en vue d'ensemble, un en vue détaillée), dimensionné en pixels physiques (`devicePixelRatio`) pour rester net sur écran haute densité. Les cases sont des rectangles pleins ; un espace de 1 px les sépare seulement quand la case fait au moins 4 px de côté, sinon elles sont jointives (une grille de filets blancs écraserait la couleur à petite taille).
- **Géométrie :** colonne `i` = nuit `i` de la fenêtre (indice 0 = 1er mai, voir "Format de sortie" dans `data-model.md`), ligne `j` = année `1950 + j`, de haut en bas. Largeur et hauteur de case calculées séparément (les cases ne sont pas forcément carrées) à partir de la place disponible.
- **Surcouche SVG** superposée à chaque canvas, pour ce qui est du texte ou doit rester net : repères de décennies, mois, titre et ligne de synthèse de chaque grille, filet de la ligne survolée, barres de total annuel de la vue détaillée.
- **Repérage au survol** par arithmétique sur les coordonnées du pointeur (`Math.floor((x - x0) / largeurCase)`), sans index spatial : la grille est régulière.
- **Changement de vue ou de ville :** redessin complet des canvas concernés, sans transition (voir "Mouvement réduit" dans `functional-specifications.md`). Le coût est négligeable (quelques millisecondes pour 113 000 rectangles).

## Palette

Pas d'exception à la charte : trois valeurs existantes de `style-guide.md`, une seule teinte porteuse de sens.

| État de la nuit | Couleur | Origine dans `style-guide.md` |
|---|---|---|
| Tropicale | `#e34948` | Slot 8 (rouge) de la palette catégorielle, valeur claire |
| Ordinaire | `#f0efec` | Point neutre clair de la palette divergente |
| Pas encore observée | Aucun remplissage (`--dv-surface`) | Surface de l'interface |
| Manquante | Hachures `--dv-gridline` sur `#f0efec` | Couleur de filet de l'interface |

- **Rouge plutôt qu'orange :** contraste mesuré du rouge `#e34948` contre la case ordinaire `#f0efec` : 3,44:1, contre la surface blanche : 3,95:1, au-dessus du seuil de 3:1 pour un élément graphique. L'orange (slot 2, `#eb6834`), plus évocateur d'une nuit chaude, n'atteint que 2,78:1 contre la case ordinaire : écarté. Le rouge reprend aussi le pôle chaud de la palette divergente bleu ↔ rouge.
- **Pas de codage par station :** les stations sont séparées par la disposition (une grille chacune, titrée), jamais par la couleur. Le rouge n'est donc pas utilisé comme "couleur de série" au sens de la palette catégorielle, et aucune autre teinte n'est nécessaire.
- **Binaire, pas de dégradé de TN :** la nuit est tropicale ou non, selon la définition de Météo-France. Graduer les cases selon la valeur de TN (20 °C, 22 °C, 24 °C…) ajouterait une deuxième lecture au détriment de la première ; la valeur reste dans l'infobulle. Alternative laissée aux "Points à valider".
- **Pas encore observée vs ordinaire :** la différence repose sur la présence ou l'absence de case (`#f0efec` contre blanc, 1,15:1), volontairement discrète pour ne pas attirer l'œil, et la légende la nomme. Elle ne concerne qu'une fin de ligne de la dernière année.
- **Barres de total annuel** (vue détaillée) : même rouge `#e34948`, puisqu'elles mesurent la même chose que les cases rouges ; hachurées pour une année incomplète (voir "Interactions" dans `functional-specifications.md`).
- **Fond clair**, cohérent avec le thème clair fixe du site (voir "Couleurs" dans `style-guide.md`). Un fond nuit (cases éteintes sombres, nuits tropicales "allumées") illustrerait mieux la métaphore, mais introduirait une surface sombre absente de la charte : alternative laissée aux "Points à valider".

## Hauteur de la zone de montage

- **Grand écran :** règle par défaut du site (voir "Règles communes à toutes les visualisations" dans le `technical-specifications.md` général), sans écart. Les huit grilles (deux rangées de quatre) ou la grille détaillée se partagent la hauteur obtenue ; la hauteur de case en découle (de l'ordre de 3 px en vue d'ensemble et de 7 px en vue détaillée pour une fenêtre de bureau courante, à mesurer).
- **Petit écran, vue d'ensemble (écart documenté) :** sous environ 640 px de large, quatre rangées de deux grilles ne tiennent pas dans `max(320px, largeur × 0,6)` sans tomber sous un pixel par année. La zone de montage y prend la hauteur de son contenu, chaque grille gardant une hauteur minimale de 2 px par année (154 px), et dépasse alors le plafond général : la page défile. Raison : une grille illisible n'aurait plus aucun intérêt, et la vue tableau reste le repli. À valider (voir "Points à valider" ci-dessous).
- **Petit écran, vue détaillée :** règle par défaut, sans écart (77 lignes tiennent dans 320 px).

## Nouvelles dépendances

Aucune nouvelle dépendance : `d3-scale` (`scaleLinear` des barres de total annuel) et `d3-selection` (surcouche SVG, sélecteur, infobulle) sont déjà des dépendances du site. Le Canvas 2D est natif. Pas d'axe `d3-axis` : les repères (décennies, mois) sont de simples textes positionnés.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site : la zone de montage est sous une présentation longue de trois paragraphes, rarement visible au premier affichage.

## Vue tableau

`src/components/visualizations/tropical-nights/table.ts` lit `nights.json` au build (`readDataFile`, voir "Vue tableau des données" dans le `technical-specifications.md` général) et calcule les moyennes par décennie sur les années `complete`, ainsi que le record (année en cours comprise), selon "Vue tableau" dans `functional-specifications.md`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. Chaque canvas porte `role="img"` et un `aria-label` généré à partir des données (station, moyenne de la première et de la dernière décennie complète, année record), pour qu'un lecteur d'écran sache au moins ce que la grille montre ; le détail passe par la vue tableau. Sélecteur de ville : `<button>` natifs avec `aria-pressed`.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation et "Hauteur de la zone de montage" ci-dessus. Les canvas sont redimensionnés et redessinés au redimensionnement de la fenêtre (même événement que le recalcul de hauteur commun).

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `city` | `id` d'une station de `nights.json` (`nice`, `perpignan`, `marseille`, `toulouse`, `lyon`, `bordeaux`, `paris`, `strasbourg`) | Vue d'ensemble |

- `city` est écrit au clic sur une puce de ville ou sur une grille de la vue d'ensemble, et retiré au retour sur "Toutes les villes".
- Un identifiant inconnu est ignoré : la visualisation s'ouvre sur la vue d'ensemble.
- Pas de position temporelle à capturer (pas de lecture), ni de cadrage (pas de zoom). L'infobulle et la ligne survolée ne sont pas capturées (états transitoires).

## Points à valider

Décisions de conception proposées dans ces trois fichiers, à confirmer avant l'implémentation :

1. **Forme** : petits multiples en vue d'ensemble par défaut, vue détaillée par ville en second temps (voir "Forme retenue" dans `functional-specifications.md`), plutôt qu'une seule ville à la fois.
2. **Sélection des huit stations**, dont Marignane à la place de Marseille-Observatoire (lacunaire de 2003 à 2018), et l'exclusion de Montpellier-Aéroport et Nantes-Bouguenais (voir "Stations retenues" dans `data-model.md`).
3. **Libellé "Marseille-Marignane"** pour une station située à une vingtaine de kilomètres de Marseille, plutôt que "Marignane" seul (moins parlant) ou "Marseille" (trompeur).
4. **Seuil TN ≥ 20 °C** (20,0 °C inclus), fondé sur deux articles d'actualité de Météo-France, faute de définition dans un glossaire officiel (voir "Définition retenue" dans `data-model.md`).
5. **Fenêtre de mesure de TN** (18 h UTC la veille - 18 h UTC le jour J), non confirmée par le descriptif de la source : elle conditionne le libellé "Nuit du 24 au 25 juillet" de l'infobulle ; à défaut, l'infobulle donne la date de la mesure.
6. **Données brutes plutôt qu'homogénéisées**, faute de série quotidienne homogénéisée de TN en open data, avec la mise en garde de la présentation longue (voir "Séries homogénéisées" dans `data-model.md`).
7. **Affichage des périodes SQR** dans la note sous la vue détaillée. Si elles sont affichées, le jeu de données "Données changement climatique - SQR (Séries Quotidiennes de Référence)" (Météo-France, https://www.data.gouv.fr/datasets/donnees-changement-climatique-sqr-series-quotidiennes-de-reference, Licence Ouverte v2.0) devient une deuxième source à créditer dans `datasets`. Sinon, retirer `referencePeriod` du fichier de sortie.
8. **Fenêtre affichée du 1er mai au 31 octobre**, la seule nuit tropicale mesurée hors fenêtre (Perpignan, 25 avril 2002) restant comptée dans le total et signalée dans l'infobulle.
9. **Ordre des années** : 1950 en haut, année en cours en bas (lecture chronologique de haut en bas, la tache "descend"), plutôt que l'année récente en haut.
10. **Seuil d'année incomplète** à plus de 9 nuits manquantes sur 184 (5 %), et exclusion des années incomplètes et de l'année en cours des moyennes par décennie (voir "Données manquantes et année en cours" dans `data-model.md`).
11. **Année en cours affichée** avec ses nuits pas encore observées, plutôt que de couper la série à la dernière année complète. Corollaire : les records 2026 (Perpignan, Toulouse, Bordeaux, Paris, Strasbourg) apparaissent avec la mention "en cours" tant que l'année n'est pas finie.
12. **Palette** : rouge du slot 8 pour les nuits tropicales sur fond clair, binaire (voir "Palette" ci-dessus). Alternatives écartées : orange du slot 2 (contraste insuffisant), dégradé selon la valeur de TN (deuxième lecture qui brouille la première), fond nuit sombre (surface hors charte, qui demanderait d'ajouter des couleurs à `style-guide.md`).
13. **Écart de hauteur sur petit écran** pour la vue d'ensemble (voir "Hauteur de la zone de montage" ci-dessus), plutôt que de basculer directement en vue détaillée sous 640 px.
14. **Thèmes** : `[climate]` seul, qui lie la visualisation à `flower-phenology` et `grape-harvest-almanac`. Ajouter `territory` (l'angle des villes et de l'îlot de chaleur urbain) la rapprocherait aussi de `paris-trees` ou `medical-deserts`, au prix d'un lien thématique plus lâche.
15. **Téléchargement** de `nights.json` (`downloads: [nights.json]`), permis par la Licence Ouverte v2.0 (voir "Téléchargement" dans `data-model.md`).
16. **Date de récupération** : les données ont été mesurées le 2026-09-24, en pleine saison. Une récupération après le 31 octobre 2026 rendrait l'année 2026 complète et ferait disparaître l'état "pas encore observée" jusqu'à la saison suivante, sans changer le reste de la spec.
