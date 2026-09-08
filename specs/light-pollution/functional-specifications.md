# Spécification fonctionnelle : La nuit qui recule

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | La nuit qui recule | Depuis 2013, la France s'éclaire chaque année un peu plus fort : ce que révèlent les satellites sur ce qu'on ne voit plus dans le ciel. |
| EN | The Retreating Night | Since 2013, France has been lighting up a little more every year : what satellites reveal about what we can no longer see in the sky. |

**Présentation longue FR (proposition) :**
> Chaque nuit, des satellites américains mesurent la lumière artificielle émise depuis le sol. Ces données, collectées par le programme VIIRS de la NOAA, permettent de suivre année après année l'intensité de l'éclairage nocturne partout sur Terre.
>
> Cette carte agrège ces mesures sur la France métropolitaine, année par année depuis 2013, et les traduit en une échelle de visibilité du ciel plutôt qu'en unités physiques : ce qu'on peut encore espérer y voir, d'un ciel de campagne où la Voie lactée reste visible à un ciel urbain où seules quelques dizaines d'étoiles percent encore le halo. Déplacez le curseur d'année pour voir cette lueur progresser.

**Présentation longue EN (proposition) :**
> Every night, American satellites measure the artificial light emitted from the ground. This data, collected by NOAA's VIIRS program, tracks the intensity of nighttime lighting everywhere on Earth, year after year.
>
> This map aggregates these measurements across mainland France, year by year since 2013, translating them into a sky-visibility scale rather than physical units : what you might still hope to see, from a countryside sky where the Milky Way remains visible to an urban sky where only a few dozen stars still pierce through the glow. Move the year slider to watch that glow spread.

## Objectif

Faire voir, sur une grille de la France métropolitaine, la progression de la pollution lumineuse depuis 2013, traduite en ce qu'elle signifie concrètement pour l'observation du ciel nocturne.

## Contenu (zone de montage)

- Grille hexagonale de la France métropolitaine (même silhouette et même grille que `biodiversity`), chaque cellule colorée selon son palier de l'échelle de visibilité à l'année sélectionnée (voir "Palette" dans `technical-specifications.md`).
- Curseur d'année (2013 à l'année la plus récente disponible, voir "Couverture géographique et temporelle" dans `data-model.md`).
- Légende de l'échelle de visibilité (couleur + libellé de chaque palier).
- Fiche de détail au survol/tap d'une cellule.

## Interactions

- **Curseur d'année :** un pas par année disponible, pas d'animation automatique (décision explicite, voir échanges de cadrage : contrairement à `satellites-in-orbit` et `monument-layers`, le grain réel des données est annuel, treize valeurs discrètes par cellule plutôt qu'un flux continu d'événements). Déplacer le curseur recolore immédiatement la grille selon l'année choisie.
- **Survol/tap d'une cellule :** fiche de détail donnant le palier de visibilité en toutes lettres (ex. « Vous pourriez y voir la Voie lactée à l'œil nu »), l'année affichée, et la valeur de radiance mesurée pour les visiteurs qui veulent la donnée brute.
- **Pas de zoom ni de panoramique**, même décision que `biodiversity` (voir "Interactions" dans son `functional-specifications.md`) : la carte reste fixe, toujours cadrée sur la totalité de la silhouette de la France.
- **Pas de filtre supplémentaire :** contrairement aux autres visualisations du site, il n'y a ici qu'une seule dimension à explorer (le temps, via le curseur d'année), pas de catégorie à filtrer.
- **Vue initiale :** année la plus récente disponible sélectionnée par défaut (l'état actuel, pas 2013), pour que le premier regard porté sur la carte montre la situation présente plutôt qu'un point de départ historique ; le visiteur recule ensuite dans le temps via le curseur pour voir la progression.

## États

- **Chargement :** le temps que `skybins.json` soit récupéré et que la grille s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de grille vide silencieuse.
- **Vide :** sans objet ici (les 395 cellules de la grille portent toujours une valeur pour chaque année disponible, voir "Contraintes de validation" dans `data-model.md` ; pas de filtre pouvant réduire l'affichage à rien).

## Responsive

- Curseur d'année et légende repositionnés sous la carte plutôt qu'en surimpression, avec une cible tactile suffisamment grande pour le curseur.
- Fiche de détail au tap sur une cellule plutôt qu'au survol.

## Accessibilité (limite connue)

La fiche de détail par cellule (survol/tap) n'est pas nativement accessible au clavier ni au lecteur d'écran, même limite que les grilles hexagonales de `biodiversity`. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le curseur d'année reste accessible au clavier (élément `<input type="range">` standard) : la recoloration de la grille selon l'année reste donc pilotable sans souris, seule la fiche de détail par cellule ne l'est pas.

## Contenu non traduit

Les libellés de l'échelle de visibilité (`scale` dans `data-model.md`) sont fournis dans les deux langues ; pas de contenu non traduit à signaler au-delà des règles générales.
