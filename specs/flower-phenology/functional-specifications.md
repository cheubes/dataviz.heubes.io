# Spécification fonctionnelle : Le calendrier des fleurs

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le calendrier des fleurs | Quand fleurissent les plantes sauvages en France, et comment ce calendrier se déplace avec le réchauffement. |
| EN | The Flower Calendar | When wild plants flower in France, and how that calendar shifts with warming temperatures. |

**Présentation longue FR :**
> La phénologie, l'étude des cycles saisonniers du vivant, est l'un des indices les plus sensibles du changement climatique. En France, des milliers d'observations citoyennes enregistrent chaque année les premières floraisons des plantes sauvages. Visualisées sur un calendrier circulaire, ces données révèlent la beauté des rythmes naturels et, dans leur dérive progressive, l'empreinte discrète du réchauffement.

**Présentation longue EN :**
> Phenology, the study of seasonal cycles in nature, is one of the most sensitive indicators of climate change. Across France, thousands of citizen observations record each year the first flowering dates of wild plants. Visualised on a circular calendar, these data reveal the beauty of natural rhythms and, in their slow drift, the quiet imprint of warming temperatures.

## Objectif

Montrer, sur un calendrier circulaire, le moment de première floraison de plantes sauvages en France, et comment ce moment s'est déplacé entre deux décennies.

## Contenu (zone de montage)

- Calendrier circulaire (deux anneaux, chacun affichant une décennie choisie indépendamment), labels des mois sur le pourtour.
- Sélecteur d'espèces (checkboxes ou liste, jusqu'à 15 espèces affichées simultanément).
- Deux sélecteurs de décennie, un par anneau (voir "Comparaison de décennies" ci-dessous).
- Titre central ("Premières floraisons en France" / "First Flowerings in France").
- Tooltip contextuel au survol/tap d'un arc.

## Interactions

- **Sélecteur d'espèces :** multi-sélection, jusqu'à 15 espèces simultanées (au-delà, désactiver la sélection la plus ancienne ou bloquer une sélection supplémentaire avec un message, à trancher à l'implémentation). Sélection par défaut : toutes les espèces de la liste (voir "Sélection des espèces" dans `data-model.md`), pour un premier affichage montrant d'emblée l'ensemble du calendrier.
- **Comparaison de décennies :** deux sélecteurs indépendants, un pour l'anneau intérieur et un pour l'anneau extérieur, chacun proposant les six décennies couvertes par les données (1970s à 2020s, voir "Dataset source" dans `data-model.md`). Sélection libre : aucune contrainte d'ordre entre les deux anneaux (l'anneau intérieur peut porter une décennie plus récente que l'extérieur si le visiteur le choisit ainsi). **Par défaut : 1970s à l'intérieur, 2020s (2020 à aujourd'hui) à l'extérieur** (décision explicite : l'écart maximal disponible, pour rendre la dérive du calendrier la plus visible possible dès l'ouverture).
- **Survol / tap d'un arc :** tooltip avec le nom de l'espèce, le jour médian de floraison en toutes lettres (ex. "15 avril"), la variation par rapport à l'autre décennie affichée (ex. "-8 jours").
- **Vue initiale :** calendrier complet visible, toutes les espèces sélectionnées, décennies par défaut (1970s intérieur / 2020s extérieur).

## États

- **Chargement :** le temps que le JSON de phénologie soit récupéré et que le calendrier s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de calendrier vide silencieux.
- **Vide :** aucune espèce sélectionnée (si le visiteur désélectionne tout) → message invitant à en choisir au moins une, plutôt qu'un calendrier sans arcs sans explication.

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- Tap sur un arc pour le tooltip plutôt que survol ; un second tap ailleurs le referme.
- Sélecteur d'espèces en liste déroulante ou puces défilantes horizontalement sous un certain seuil de largeur, plutôt qu'une grille de checkboxes qui prendrait toute la hauteur.
- Le calendrier circulaire se redimensionne en conservant ses proportions ; sous un diamètre minimal (à définir à l'implémentation), les labels des mois se réduisent aux initiales (J, F, M...) plutôt que de se chevaucher.

## Accessibilité (limite connue)

L'interaction principale (calendrier SVG, survol/tap des arcs) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

## Contenu non traduit

Les noms scientifiques d'espèces (ex. *Papaver rhoeas*) et les noms de famille botanique (ex. Papaveraceae) restent en latin, non traduits, dans les deux langues : convention taxonomique standard, pas une donnée à localiser. Seuls les noms communs (`nameFr` / `nameEn`) sont localisés.
