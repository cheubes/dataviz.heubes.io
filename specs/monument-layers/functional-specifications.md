# Spécification fonctionnelle : Les strates du patrimoine

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les strates du patrimoine | Quarante-cinq mille monuments historiques français, de leur plus ancienne pierre connue à aujourd'hui : une carte qui se construit sous vos yeux, siècle après siècle. |
| EN | Layers of Heritage | Forty-five thousand French historic monuments, from their oldest known stone to today : a map that builds itself before your eyes, century after century. |

**Présentation longue FR (proposition) :**
> Depuis 1840, l'État protège des monuments jugés dignes de conservation : châteaux, églises, ponts, lavoirs, gares... La base Mérimée du ministère de la Culture recense aujourd'hui près de quarante-cinq mille édifices protégés en France métropolitaine, chacun daté de sa plus ancienne campagne de construction connue.
>
> Cette carte les fait apparaître dans l'ordre chronologique de leur construction plutôt que de leur protection : des vestiges antiques épars jusqu'à la densité du bâti du dix-neuvième siècle, en passant par les grandes vagues romane, gothique et classique. Une teinte de plus en plus sombre marque la profondeur du temps : chaque point ajouté est une strate de plus dans la construction du pays.

**Présentation longue EN (proposition) :**
> Since 1840, the French state has protected buildings deemed worth preserving : castles, churches, bridges, wash houses, railway stations... The Ministry of Culture's Mérimée database now lists nearly forty-five thousand protected buildings in mainland France, each dated to its oldest known construction phase.
>
> This map reveals them in the chronological order of their construction rather than their protection : from scattered antique remains to the density of nineteenth-century building, passing through the great Romanesque, Gothic, and Classical waves. A progressively darker shade marks the depth of time : each point added is one more layer in the construction of the country.

## Objectif

Faire voir, par l'accumulation chronologique de points sur une carte réelle de la France métropolitaine, les grandes strates de construction du patrimoine protégé, du plus ancien au plus récent.

## Contenu (zone de montage)

- Carte illustrée de la France métropolitaine (silhouette, pas de fond de tuiles, voir "Rendu" dans `technical-specifications.md`).
- Points représentant chaque monument, apparaissant à sa position réelle au moment simulé correspondant à son siècle de construction, teinte de plus en plus sombre à mesure que le temps simulé avance (voir "Palette" dans `technical-specifications.md`).
- Indicateur du siècle simulé en cours.
- Compteur du nombre de monuments visibles à l'instant simulé courant (voir "Champs dérivés côté client" dans `data-model.md`).
- Filtre simple par nature de protection (Classé / Inscrit / Les deux).
- Contrôles de lecture : bouton Play/Pause ; bouton Rejouer, visible une fois l'animation arrivée à aujourd'hui.
- Fiche de détail au survol/tap d'un monument.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page. Passage unique, pas de bouclage automatique (même choix que `satellites-in-orbit`, voir son `functional-specifications.md`) : le temps simulé parcourt la chronologie de construction une seule fois, du plus ancien monument retenu à aujourd'hui, puis s'arrête sur l'état final.
- **Play/Pause :** interrompt ou reprend l'accumulation à l'instant simulé courant.
- **Rejouer :** n'apparaît qu'une fois l'animation arrivée à son terme ; relance un passage complet.
- **Filtre protection :** Classé / Inscrit / Les deux, "Les deux" par défaut. Change les points affichés et le compteur, sans redémarrer l'animation en cours.
- **Zoom/pan :** libre sur la carte (souris/molette, tactile), pour observer une concentration régionale (ex. les châteaux de la Loire, la densité parisienne) une fois qu'elle est apparue.
- **Survol/tap d'un monument :** fiche de détail (nom, commune/département, siècle de construction, nature de la protection, catégorie de l'édifice). Fonctionne à tout moment, y compris pendant la lecture, sur les monuments déjà apparus.
- **Vue initiale :** filtre "Les deux", carte de France entière visible, lecture automatique déjà en cours, compteur à zéro au départ.

## États

- **Chargement :** le temps que `monuments.json` et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération d'un des deux fichiers → message d'erreur, pas de carte vide silencieuse.
- **Vide :** filtre "Classé" ou "Inscrit" isolé qui ne laisse aucun monument à un instant donné (situation attendue seulement en tout début de lecture, avant l'apparition du premier monument du filtre actif) → pas de message d'erreur, la carte reste simplement vide jusqu'au premier point du filtre choisi.

## Responsive

- Contrôles de lecture, filtre protection et indicateur de siècle repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.
- Pan/zoom au geste tactile ; fiche de détail au tap sur un monument plutôt qu'au survol.

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des monuments) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Les boutons Play/Pause, Rejouer et le filtre protection restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention et de filtrer sans dépendre de la carte animée elle-même.

## Contenu non traduit

Les noms de monuments (`name`, dérivé de `TICO`) et leurs catégories (`category`, dérivé de `DENO`) ne sont disponibles qu'en français dans la source ; affichés tels quels dans la version anglaise de la page, sans traduction (comparable aux noms d'espèces de `paris-trees`, voir son `functional-specifications.md`).
