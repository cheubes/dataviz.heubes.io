# Spécification fonctionnelle : Les nuits tropicales

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : spécifié, non implémenté.**

## Angle éditorial

Montrer la nuit tropicale comme une expérience vécue (une nuit où l'on dort mal parce que la ville ne se rafraîchit plus) plutôt que comme une moyenne de température : chaque nuit est une case, et le visiteur voit les cases s'allumer, été après été, de plus en plus tôt et de plus en plus au nord. Les chiffres sont des relevés bruts de stations, pas des séries homogénéisées (voir "Séries homogénéisées" dans `data-model.md`) : la page le dit, sans en faire le sujet.

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les nuits tropicales | Nuit après nuit depuis 1950, les nuits où le thermomètre ne descend pas sous 20 °C dans huit villes françaises : une rareté devenue une saison. |
| EN | Tropical Nights | Night after night since 1950, the nights when the thermometer never drops below 20 °C in eight French cities: once a rarity, now a season. |

**Présentation longue FR :**
> Météo-France parle de nuit tropicale quand la température ne descend pas sous 20 °C. C'est une nuit où la ville ne se rafraîchit plus, où le corps récupère mal de la chaleur du jour. Longtemps réservées au littoral méditerranéen, ces nuits gagnent du terrain.
>
> Chaque bloc de cette page est une ville, chaque ligne un été depuis 1950, chaque case une nuit de mai à octobre, allumée quand le thermomètre est resté au-dessus de 20 °C. À Nice, on en comptait une quinzaine par an dans les années 1950, plus de quatre-vingts depuis 2020. À Toulouse, Lyon ou Bordeaux, il y en avait moins de cinq par an jusqu'aux années 1980, plus de dix depuis 2020.
>
> Ces chiffres sont les relevés des stations elles-mêmes, sans correction. Une station déplacée, un aéroport rattrapé par la ville, un parc au cœur de Paris : chaque thermomètre raconte aussi l'histoire de son voisinage, et pas seulement celle du climat.

**Présentation longue EN :**
> Météo-France calls a night tropical when the temperature does not drop below 20 °C. It is a night when the city no longer cools down, when the body struggles to recover from the heat of the day. Long confined to the Mediterranean coast, these nights are spreading.
>
> Each block on this page is a city, each row a summer since 1950, each cell a night from May to October, lit when the thermometer stayed above 20 °C. In Nice, there were about fifteen a year in the 1950s, more than eighty a year since 2020. In Toulouse, Lyon or Bordeaux, there were fewer than five a year until the 1980s, more than ten a year since 2020.
>
> These figures are the stations' own readings, uncorrected. A station that moved, an airport swallowed by the city, a park in the heart of Paris: each thermometer also tells the story of its surroundings, not only that of the climate.

Les chiffres cités viennent de "Faits mesurés" dans `data-model.md` (moyennes par décennie). Ils sont à revérifier si les données sont récupérées de nouveau à l'implémentation ; aucun record de l'année en cours n'est cité dans ce texte statique, puisqu'il dépend de la date de récupération.

## Objectif

Faire voir, nuit par nuit et ville par ville, comment les nuits tropicales sont passées d'événements rares à une saison à part entière, et comment cette saison s'étend dans le calendrier (plus tôt en juin, plus tard en septembre) et sur la carte (du littoral méditerranéen vers Lyon, Bordeaux, Paris).

## Forme retenue

**Calendriers empilés en petits multiples, avec une vue détaillée par ville.** Pour chaque station, une grille : une ligne par année (1950 en haut, l'année en cours en bas), une colonne par nuit du 1er mai au 31 octobre (184 colonnes), une case allumée quand la nuit est tropicale. Lues ensemble, les huit grilles montrent deux mouvements à la fois : la tache allumée s'élargit vers le bas de chaque grille (le temps), et d'une grille à l'autre (le sud vers le nord).

Raffinements par rapport à l'idée de départ (un calendrier par ville, à parcourir une à une) :

- **Vue d'ensemble par défaut** plutôt qu'une ville choisie : le contraste entre Nice, 85 nuits tropicales par an en moyenne depuis 2020 (plus que les 62 nuits de juillet et août), et Strasbourg, presque vide, est le premier message, et il exige de voir les huit en même temps, à la même échelle.
- **Total annuel en marge** de chaque ligne (barre horizontale), dans la vue détaillée : compter des cases à l'œil n'est pas possible, et la barre rend lisible l'accélération des années 1990 et 2020.
- **Fenêtre de mai à octobre**, pas l'été météorologique (juin-août) : les données mesurées montrent des nuits tropicales du 12 mai au 24 octobre (voir "Faits mesurés" dans `data-model.md`), et leur débordement sur mai et septembre fait partie du propos.

Alternatives écartées :

- **Courbe du nombre annuel par ville** : lisible mais banale, et elle perd ce que la grille montre en plus du total (la date, la durée des séries consécutives, comme les 66 nuits d'affilée de Nice en 2022).
- **Bandes de réchauffement ("warming stripes") par ville** : une couleur par année, efficace mais très reprise ailleurs, et, comme la courbe, elle écrase le calendrier dans une seule valeur.
- **Une seule grille, ville choisie au sélecteur** : oblige à comparer de mémoire ; la vue détaillée reste disponible pour une ville, mais en second temps.

## Contenu (zone de montage)

- **Sélecteur de ville** au-dessus des grilles : une puce "Toutes les villes" / "All cities" puis une puce par station, dans l'ordre de "Stations retenues" de `data-model.md` (Nice en premier, Strasbourg-Entzheim en dernier). Une seule puce active à la fois.
- **Légende** sur la même ligne que le sélecteur ou juste en dessous, toujours visible : "Nuit tropicale (minimale ≥ 20 °C)" / "Tropical night (minimum ≥ 20 °C)", "Nuit ordinaire" / "Ordinary night", "Pas encore observée" / "Not yet observed". Une quatrième entrée "Donnée manquante" / "Missing data" n'apparaît que si le fichier contient au moins une nuit manquante (aucune avec les données mesurées, voir "Stations retenues" dans `data-model.md`).
- **Vue d'ensemble** (puce "Toutes les villes") : les huit grilles en petits multiples, chacune titrée du libellé de la station et d'une ligne de synthèse qui oppose la première et la dernière décennie complète de la vue tableau ("15 par an dans les années 1950, 85 depuis 2020" / "15 a year in the 1950s, 85 since 2020"). Années repérées par décennie sur le bord gauche de chaque grille (1950, 1960…), mois en tête de grille (initiale du mois, une seule fois par rangée de grilles).
- **Vue détaillée** (puce d'une ville) : la grille de cette seule station, en grand. Années repérées par décennie à gauche, mois abrégés en tête ("mai", "juin"… / "May", "Jun"…), barre du total annuel à droite de chaque ligne, avec la valeur affichée pour la ligne survolée et pour l'année record. Sous la grille, une note d'une ligne : période de la série de référence Météo-France (SQR) de la station, ou son absence pour Nice (voir "Séries homogénéisées" dans `data-model.md` et "Points à valider" dans `technical-specifications.md`), et position de la station (altitude, "station d'aéroport" ou "station urbaine").
- **Infobulle** au survol / tap (voir "Interactions" ci-dessous).

## Interactions

- **Sélecteur de ville :** passer de "Toutes les villes" à une ville ouvre sa vue détaillée ; cliquer sur une grille de la vue d'ensemble (n'importe où dans la grille ou sur son titre) fait de même à la souris ; au doigt, seul le titre de la grille ouvre la vue détaillée (voir "Responsive" ci-dessous). Revenir à "Toutes les villes" rétablit la vue d'ensemble. Changer de ville dans la vue détaillée remplace la grille sans repasser par la vue d'ensemble.
- **Survol / tap d'une case, vue détaillée :** infobulle donnant la nuit ("Nuit du 24 au 25 juillet 2003" / "Night of 24 to 25 July 2003"), la température minimale ("Minimale : 22,4 °C" / "Minimum: 22.4 °C") et le statut de la nuit (tropicale, ordinaire, manquante, pas encore observée), puis le total de l'année ("2003 : 16 nuits tropicales"). La ligne survolée est soulignée d'un filet sur toute sa largeur. Le libellé "nuit du J-1 au J" dépend de la fenêtre de mesure de TN, à confirmer (voir "Définition retenue" dans `data-model.md`) ; à défaut, l'infobulle donne la date de la mesure ("24 juillet 2003").
- **Survol / tap d'une ligne, vue d'ensemble :** les cases y sont trop petites pour viser une nuit ; l'infobulle donne seulement la station, l'année et son total ("Nice, 2022 : 104 nuits tropicales"). La ligne survolée est soulignée de la même façon.
- **Totaux particuliers dans l'infobulle et la barre de total :**
  - année en cours : total suivi de sa date ("32 nuits au 22 septembre" / "32 nights as of 22 September") ;
  - année incomplète (voir "Données manquantes et année en cours" dans `data-model.md`) : total affiché comme un minimum ("au moins 12 nuits" / "at least 12 nights"), barre de total hachurée ;
  - nuit tropicale hors fenêtre (Perpignan, 25 avril 2002, seule occurrence mesurée) : comptée dans le total, signalée dans l'infobulle de l'année ("dont 1 hors de la période affichée" / "including 1 outside the period shown").
- **Pas d'animation ni de lecture :** les grilles sont statiques, toutes les années visibles d'emblée. Pas de zoom.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : la ville de la vue détaillée est restaurée ; un lien sans ville ouvre la vue d'ensemble. L'infobulle et la ligne survolée ne sont pas capturées (voir "État dans l'URL" dans `technical-specifications.md`).
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : sans effet propre, la visualisation n'ayant ni lecture automatique ni transition qui déplace des éléments ; le passage d'une vue à l'autre est immédiat dans tous les cas.

## Vue tableau

Voir "Vue tableau des données" dans le `functional-specifications.md` général.

- **Légende :** "Nombre moyen de nuits tropicales par an (minimale ≥ 20 °C), par station et par décennie" / "Average number of tropical nights per year (minimum ≥ 20 °C), by station and decade".
- **Lignes :** les huit stations, dans l'ordre du sélecteur. Première cellule : libellé de la station.
- **Colonnes :** une par décennie, "1950-1959" à "2010-2019", puis la décennie en cours bornée à la dernière année complète ("2020-2025"). Cellule : moyenne sur les années complètes de la décennie (voir "Données manquantes et année en cours" dans `data-model.md`), à une décimale ("15,0" / "15.0"), "n.d." / "n/a" si la décennie n'a aucune année complète. Dernière colonne : **Record**, nombre de nuits et année ("104 (2022)"), suivi de "(en cours)" / "(ongoing)" quand le record est l'année en cours, qui compte dès maintenant puisqu'un total partiel ne peut qu'augmenter.
- **Pas de ligne de total :** une moyenne entre des stations aussi différentes que Nice et Strasbourg n'aurait pas de sens.
- **Non repris :** le détail nuit par nuit et les valeurs de TN, qui restent dans le fichier téléchargeable (voir "Téléchargement" dans `data-model.md`).

## États

- **Chargement :** le temps que `nights.json` soit récupéré et que les grilles s'initialisent ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de grilles vides silencieuses.
- **Vide :** sans objet. Pas de filtre qui puisse réduire l'affichage à rien (une ville est toujours affichée, ou les huit), et chaque station porte toutes ses années (voir "Contraintes de validation" dans `data-model.md`).

## Responsive

- **Vue d'ensemble :** quatre grilles par rangée sur grand écran (deux rangées), deux par rangée en dessous d'environ 640 px de large (quatre rangées), où les cases deviennent une texture de moins d'un pixel par nuit : la grille reste lisible comme une tache qui s'étend, pas nuit par nuit. Sur petit écran, la vue d'ensemble dépasse la hauteur par défaut de la zone de montage (voir "Hauteur de la zone de montage" dans `technical-specifications.md`).
- **Vue détaillée :** la grille occupe toute la largeur ; sous une largeur de case de 3 px, l'infobulle ne donne plus que l'année et son total, comme dans la vue d'ensemble, une nuit précise n'étant plus visable au doigt.
- **Tactile :** tap sur une case ou une ligne pour l'infobulle plutôt que survol ; un second tap ailleurs la referme. Dans la vue d'ensemble, le premier tap sur une grille affiche l'infobulle de la ligne ; l'ouverture de la vue détaillée passe par le titre de la grille ou le sélecteur, pour que le tap d'exploration n'ouvre pas une autre vue.
- **Sélecteur de ville :** puces avec retour à la ligne, jamais repliées (règle "contrôles toujours visibles", voir "Règles communes à toutes les visualisations" dans le `technical-specifications.md` général).

## Accessibilité (limite connue)

Les grilles sont dessinées en Canvas (voir "Rendu" dans `technical-specifications.md`) : les cases et leurs infobulles ne sont accessibles ni au clavier ni au lecteur d'écran. Documenté comme limite connue, conformément à la règle par défaut du projet. Le sélecteur de ville reste accessible au clavier (boutons natifs), et chaque grille porte une description textuelle (station, moyennes de la première et de la dernière décennie, année record).

Repli : la vue tableau (voir "Vue tableau" ci-dessus) donne accès aux mêmes données, sous forme de synthèse, au clavier et au lecteur d'écran.

## Contenu non traduit

Les libellés des stations (Paris-Montsouris, Marseille-Marignane…) restent identiques dans les deux langues : ce sont des noms propres de lieux et de stations Météo-France. Les mois, les formats de date et de nombre, les libellés de légende et d'infobulle sont localisés.
