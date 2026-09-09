# Spécification fonctionnelle : Le recul des glaciers

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le recul des glaciers | Depuis leurs premières mesures, les glaciers alpins français reculent : une scène de montagne qui se transforme sous vos yeux, glacier après glacier. |
| EN | The Glaciers' Retreat | Since their first measurements, French Alpine glaciers have been retreating : a mountain scene that transforms before your eyes, glacier by glacier. |

**Présentation longue FR (proposition) :**
> Depuis le dix-neuvième siècle pour certains, les glaciologues mesurent chaque année la position du front des glaciers alpins : de combien il a avancé ou reculé depuis la mesure précédente. Ces relevés, compilés par le World Glacier Monitoring Service, forment aujourd'hui les séries les plus longues et les mieux documentées sur l'état des glaciers de montagne.
>
> Cette scène rassemble plusieurs glaciers français, représentés à leur échelle réelle les uns par rapport aux autres, et rejoue leur histoire depuis la première mesure connue jusqu'à aujourd'hui. Le recul n'est ni uniforme ni continu : certaines années voient un glacier regagner du terrain, avant qu'une tendance de fond, très nette sur le temps long, ne reprenne le dessus.

**Présentation longue EN (proposition) :**
> Since the nineteenth century for some, glaciologists have measured the position of Alpine glacier fronts every year : how far they've advanced or retreated since the previous measurement. These records, compiled by the World Glacier Monitoring Service, now form the longest and best-documented series on the state of mountain glaciers.
>
> This scene brings together several French glaciers, shown at their true scale relative to one another, and replays their history from the first known measurement to today. The retreat isn't uniform or continuous : some years see a glacier regain ground, before a clear long-term trend takes over again.

## Objectif

Faire voir, par une scène de montagne animée, le recul réel de plusieurs glaciers alpins français depuis leur première mesure connue jusqu'à aujourd'hui, à l'échelle relative réelle les uns par rapport aux autres.

## Contenu (zone de montage)

- Scène de montagne stylisée : une ligne de crête illustrée, plusieurs langues glaciaires en descendant, une par glacier retenu (voir "Composition" ci-dessous).
- Indicateur de l'année simulée en cours.
- Contrôles de lecture : bouton Play/Pause ; bouton Rejouer, visible une fois l'animation arrivée à aujourd'hui.
- Fiche de détail au survol/tap d'un glacier.

## Composition

Tous les glaciers retenus descendent d'une même ligne de crête stylisée, côte à côte, comme un panorama alpin illustré (décision explicite, voir échanges de cadrage). Chaque langue glaciaire est dessinée à l'échelle réelle de son glacier (voir "Échelle" ci-dessous) : les glaciers les plus longs (ex. la Mer de Glace) dominent visuellement la scène à côté de glaciers plus courts, plutôt que d'être ramenés à une taille comparable.

## Échelle

Échelle réelle proportionnelle, pas une échelle relative au recul de chacun (décision explicite, voir échanges de cadrage) : la longueur affichée de chaque glacier respecte sa vraie taille relative aux autres à tout instant de l'animation, calculée directement depuis `lengthM` (voir "Format de sortie" dans `data-model.md`).

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page, comme `satellites-in-orbit` et `monument-layers`. Passage unique de la première mesure connue (la plus ancienne parmi les glaciers retenus) à aujourd'hui, pas de bouclage automatique.
- **Play/Pause :** interrompt ou reprend l'animation à l'instant simulé courant.
- **Rejouer :** n'apparaît qu'une fois l'animation arrivée à son terme ; relance un passage complet.
- **Survol/tap d'un glacier :** fiche de détail (nom, massif, longueur à l'année simulée courante, recul cumulé depuis la première mesure connue).
- **Pas de filtre, pas de zoom/pan :** contrairement aux visualisations à carte réelle du site, celle-ci reste une scène fixe et unique (petit nombre de glaciers, tous visibles en permanence, voir "Sélection des glaciers" dans `data-model.md`).
- **Vue initiale :** ligne de crête entière visible, tous les glaciers à leur longueur de la première année simulée, lecture automatique déjà en cours.

## États

- **Chargement :** le temps que `glaciers.json` soit récupéré et que la scène s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de scène vide silencieuse.
- **Vide :** sans objet ici (le nombre de glaciers est fixe et restreint, pas de filtre pouvant réduire l'affichage à rien, voir "Interactions" ci-dessus).

## Responsive

- Contrôles de lecture repositionnés sous la scène plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.
- Fiche de détail au tap sur un glacier plutôt qu'au survol.
- Sur petit écran, les glaciers les plus courts peuvent devenir difficiles à distinguer à côté des plus longs (conséquence de l'échelle réelle proportionnelle, voir "Échelle" ci-dessus) : traitement visuel précis (espacement minimal, épaisseur de trait) à affiner à l'implémentation plutôt que spécifié ici a priori.

## Accessibilité (limite connue)

L'interaction principale (scène animée, survol des glaciers) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Les boutons Play/Pause et Rejouer restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms de glaciers (`nameFr`/`nameEn`, voir `data-model.md`) sont des noms propres, identiques ou quasi identiques dans les deux langues dans la plupart des cas ("Mer de Glace" ne se traduit pas en anglais courant) ; pas de contenu non traduit à signaler au-delà des règles générales.
