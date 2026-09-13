# Spécification fonctionnelle : Les fronts de la déforestation

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les fronts de la déforestation | Trois portraits satellite, vingt-trois ans de recul : l'Amazonie, le bassin du Congo et Bornéo-Sumatra ne perdent pas leur forêt au même rythme. |
| EN | The Deforestation Fronts | Three satellite portraits, twenty-three years of hindsight : the Amazon, the Congo Basin, and Borneo-Sumatra aren't losing their forest at the same pace. |

**Présentation longue FR (proposition) :**
> Depuis 2000, des satellites Landsat photographient chaque parcelle de forêt tropicale chaque année. Ces images, compilées par l'université du Maryland et Google, permettent de repérer précisément où et quand le couvert forestier a disparu.
>
> Cette page suit trois grands fronts de déforestation côte à côte : le bassin amazonien, le bassin du Congo, et les forêts de Bornéo et Sumatra. Chacun a sa propre carte, à sa propre échelle, pour comparer le rythme et l'ampleur relative de la perte plutôt que sa surface absolue. Les trois trajectoires ne se ressemblent pas : le rythme s'accélère ou ralentit à des moments différents selon la région, reflet de politiques et de pressions économiques propres à chacune.

**Présentation longue EN (proposition) :**
> Since 2000, Landsat satellites have photographed every patch of tropical forest every year. These images, compiled by the University of Maryland and Google, make it possible to pinpoint exactly where and when forest cover has disappeared.
>
> This page follows three major deforestation fronts side by side : the Amazon basin, the Congo basin, and the forests of Borneo and Sumatra. Each has its own map, at its own scale, to compare the pace and relative extent of loss rather than absolute area. The three trajectories don't look alike : the pace speeds up or slows down at different moments in each region, reflecting policies and economic pressures specific to each.

## Objectif

Faire voir, sur trois cartes régionales réelles, comment le rythme et l'ampleur de la déforestation diffèrent entre trois grands fronts tropicaux depuis 2000.

## Contenu (zone de montage)

- Trois cartes régionales côte à côte (voir "Composition" ci-dessous), une par front retenu (voir "Sélection des fronts" dans `data-model.md`).
- Sur chaque carte : couvert forestier de référence (2000) en vert, cellules qui s'assombrissent progressivement à mesure que la perte cumulée augmente.
- Sur chaque carte : nom de la région, pourcentage cumulé de perte à l'année simulée courante.
- Indicateur de l'année simulée en cours, partagé entre les trois cartes.
- Contrôles de lecture : Play/Pause, Rejouer.

## Composition

Chaque front dans son propre cadre, à son propre cadrage cartographique (décision explicite, voir échanges de cadrage) : la comparaison porte sur le rythme et l'ampleur relative de la perte (pourcentage de couvert perdu), pas sur la taille absolue des trois territoires, très différente (l'Amazonie couvrant une surface nettement supérieure à Bornéo-Sumatra).

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page, comme `glacier-retreat` et `endangered-species`. Passage unique de 2000 à la dernière année disponible, pas de bouclage automatique.
- **Play/Pause :** interrompt ou reprend l'animation à l'instant simulé courant, partagé entre les trois cartes.
- **Rejouer :** n'apparaît qu'une fois l'animation arrivée à son terme ; relance un passage complet.
- **Survol/tap d'une cellule :** fiche de détail (pourcentage de couvert forestier initial, pourcentage cumulé perdu à l'année simulée courante).
- **Pas de filtre, pas de zoom/pan :** chaque carte reste cadrée sur sa région entière en permanence (même décision que `biodiversity`), pas d'exploration libre au-delà.
- **Vue initiale :** les trois cartes à leur état de l'an 2000 (aucune perte affichée), lecture automatique déjà en cours.

## États

- **Chargement :** le temps que les trois fichiers de fronts soient récupérés et que les cartes s'initialisent ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération d'un des fichiers → message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet ici (les trois fronts sont fixes, pas de filtre pouvant réduire l'affichage à rien).

## Responsive

- Les trois cartes empilées verticalement plutôt que côte à côte sur petit écran, une carte par ligne.
- Contrôles de lecture repositionnés sous les cartes plutôt qu'en surimpression.
- Fiche de détail au tap sur une cellule plutôt qu'au survol.

## Accessibilité (limite connue)

La fiche de détail par cellule (survol/tap) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Les boutons Play/Pause et Rejouer restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Aucun : les noms des trois fronts (`nameFr`/`nameEn`, voir `data-model.md`) sont fournis dans les deux langues.
