# Spécification fonctionnelle : Les strates du patrimoine

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les strates du patrimoine | Quarante-cinq mille monuments historiques français, de leur plus ancienne pierre connue à aujourd'hui : une carte qui se construit sous vos yeux, siècle après siècle. |
| EN | Layers of Heritage | Forty-five thousand French historic monuments, from their oldest known stone to today : a map that builds itself before your eyes, century after century. |

**Présentation longue FR :**
> Depuis 1840, l'État protège des monuments jugés dignes de conservation : châteaux, églises, ponts, lavoirs, gares... La base Mérimée du ministère de la Culture recense aujourd'hui près de quarante-cinq mille édifices protégés en France métropolitaine, chacun daté de sa plus ancienne campagne de construction connue.
>
> Cette carte les fait apparaître dans l'ordre chronologique de leur construction plutôt que de leur protection : des vestiges antiques épars jusqu'à la densité du bâti du dix-neuvième siècle, en passant par les grandes vagues romane, gothique et classique. Une teinte de plus en plus sombre marque la profondeur du temps : chaque point ajouté est une strate de plus dans la construction du pays.

**Présentation longue EN :**
> Since 1840, the French state has protected buildings deemed worth preserving : castles, churches, bridges, wash houses, railway stations... The Ministry of Culture's Mérimée database now lists nearly forty-five thousand protected buildings in mainland France, each dated to its oldest known construction phase.
>
> This map reveals them in the chronological order of their construction rather than their protection : from scattered antique remains to the density of nineteenth-century building, passing through the great Romanesque, Gothic, and Classical waves. A progressively darker shade marks the depth of time : each point added is one more layer in the construction of the country.

## Objectif

Faire voir, par l'accumulation chronologique de points sur une carte réelle de la France métropolitaine, les grandes strates de construction du patrimoine protégé, du plus ancien au plus récent.

## Contenu (zone de montage)

- Carte illustrée de la France métropolitaine (silhouette, pas de fond de tuiles, voir "Rendu" dans `technical-specifications.md`), enrichie des principaux cours d'eau et axes routiers pour donner des repères géographiques (ajouté après la première implémentation, retour utilisateur, voir "Prétraitement" dans `data-model.md` pour les critères de sélection).
- Points représentant chaque monument, apparaissant à sa position réelle au moment simulé correspondant à son siècle de construction, teinte de plus en plus sombre à mesure que le temps simulé avance (voir "Palette" dans `technical-specifications.md`).
- Indicateur de la période simulée en cours (siècle, ou ère archéologique pour le socle antique, voir "Champs dérivés côté client" dans `data-model.md`).
- Compteur du nombre de monuments visibles à l'instant simulé courant (voir "Champs dérivés côté client" dans `data-model.md`).
- Filtre simple par nature de protection (Classé / Inscrit / Les deux).
- Contrôles de lecture : bouton Play/Pause ; sélecteur de vitesse (Lent / Normal / Rapide) ; curseur d'année (`<input type="range">`), de l'an 0 à l'année de construction la plus récente retenue.
- Fiche de détail au survol/tap d'un monument, avec lien vers sa notice de référence.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page, en boucle continue (même convention que `satellites-in-orbit` et `light-pollution`, voir leurs `functional-specifications.md`). Les monuments antérieurs à l'an 0 (Préhistoire à fin de l'âge du fer, 4,75 % du jeu de données, voir "Interprétation du siècle de construction" dans `data-model.md`) apparaissent déjà présents sur la carte dès le premier instant de chaque passage, comme un socle immobile : avec une échelle temporelle strictement linéaire sur une plage aussi large (de -20 000 à aujourd'hui), leur très faible densité aurait autrement compressé les vagues romane, gothique et classique dans une fraction de seconde de l'animation (décision validée avec l'utilisateur, voir "Animation" dans `technical-specifications.md`). Le temps simulé animé parcourt ensuite la chronologie de l'an 0 à l'année de construction la plus récente retenue ; une fois la carte entièrement construite, une pause brève (même mécanisme que `satellites-in-orbit`) précède le retour au socle et un nouveau passage.
- **Play/Pause :** interrompt ou reprend l'accumulation à l'instant simulé courant (y compris pendant la pause finale d'un passage).
- **Vitesse de lecture :** Lent / Normal / Rapide, "Normal" par défaut (même trois vitesses que `satellites-in-orbit` et `light-pollution`). Change le rythme de l'accumulation, pas la durée de la pause finale.
- **Filtre protection :** Classé / Inscrit / Les deux, "Les deux" par défaut. Change les points affichés et le compteur, sans redémarrer l'animation en cours.
- **Curseur d'année :** un pas par année, sur la plage animée (an 0 à l'année de construction la plus récente retenue, voir "Lecture automatique" ci-dessus ; le socle antique n'en fait pas partie, toujours affiché quelle que soit sa position). Le déplacer manuellement (glisser ou clavier) met la lecture automatique en pause et reconstruit immédiatement la carte jusqu'à l'année choisie, y compris en arrière (même convention que le curseur de `light-pollution`, voir son `functional-specifications.md`, à ceci près qu'ici il rejoue une accumulation plutôt que de recolorer un état figé). Le déplacer jusqu'à sa valeur maximale déclenche la même pause finale que l'arrivée naturelle de l'animation à son terme.
- **Zoom/pan :** libre sur la carte (souris/molette, tactile), pour observer une concentration régionale (ex. les châteaux de la Loire, la densité parisienne) une fois qu'elle est apparue. Doublé de boutons zoomer/dézoomer/réinitialiser en surimpression sur la carte (même contrôles que `paris-trees`, voir son `functional-specifications.md`), désactivés aux bornes de l'échelle de zoom.
- **Survol/tap d'un monument :** fiche de détail (nom, commune/département, siècle de construction, nature de la protection, catégorie de l'édifice, lien vers la notice de référence sur la Plateforme Ouverte du Patrimoine du ministère de la Culture — ajouté après la première implémentation, retour utilisateur). Fonctionne à tout moment, y compris pendant la lecture, sur les monuments déjà apparus. Le lien n'est cliquable qu'une fois la fiche épinglée (clic/tap sur le monument) : en simple survol, la fiche suit le pointeur et resterait impossible à atteindre sans se refermer avant qu'on puisse cliquer le lien.
- **Vue initiale :** filtre "Les deux", carte de France entière visible avec le socle antique déjà affiché (voir "Lecture automatique" ci-dessus), lecture automatique déjà en cours, compteur reflétant ce socle plutôt que zéro (1 790 monuments au filtre "Les deux", moins avec un filtre de protection isolé).

## États

- **Chargement :** le temps que `monuments.json` et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération d'un des deux fichiers → message d'erreur, pas de carte vide silencieuse.
- **Vide :** filtre "Classé" ou "Inscrit" isolé qui ne laisse aucun monument à un instant donné (situation attendue seulement en tout début de lecture, avant l'apparition du premier monument du filtre actif) → pas de message d'erreur, la carte reste simplement vide jusqu'au premier point du filtre choisi.

## Responsive

- Contrôles de lecture, filtre protection et indicateur de siècle repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.
- Pan/zoom au geste tactile ; fiche de détail au tap sur un monument plutôt qu'au survol.

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des monuments) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le bouton Play/Pause, le sélecteur de vitesse, le filtre protection, le curseur d'année et les boutons de zoom restent accessibles au clavier (éléments `<button>`/`<select>`/`<input type="range">` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention (nécessaire dès lors que la lecture boucle indéfiniment, même rationale que `satellites-in-orbit`), de parcourir la chronologie et de zoomer sans dépendre de la carte animée elle-même.

## Contenu non traduit

Les noms de monuments (`name`), leurs communes (`commune`) et leurs catégories (`category`) ne sont disponibles qu'en français dans la source ; affichés tels quels dans la version anglaise de la page, sans traduction (comparable aux noms d'espèces de `paris-trees`, voir son `functional-specifications.md`).
