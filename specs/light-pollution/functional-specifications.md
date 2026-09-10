# Spécification fonctionnelle : Le ciel, d'année en année

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

Angle neutre, délibérément non directionnel (voir échanges de cadrage) : les données réelles (voir "Couverture géographique et temporelle" dans `data-model.md`) montrent un recul de l'intensité lumineuse depuis 2013, particulièrement marqué depuis 2022-2023 (plausiblement lié aux mesures de sobriété énergétique), pas une hausse. Le titre et le résumé de travail initiaux ("La nuit qui recule" / "The Retreating Night", supposant une pollution lumineuse croissante) présupposaient l'inverse de ce que montre le dataset : révisés en conséquence, sans affirmer de direction, pour laisser le curseur d'année la révéler.

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le ciel, d'année en année | Depuis 2013, des satellites mesurent chaque année la lumière artificielle émise depuis le sol en France : ce qu'on peut encore espérer voir dans le ciel nocturne, région par région. |
| EN | The Sky, Year by Year | Since 2013, satellites have measured the artificial light emitted from the ground across France each year: what you can still hope to see in the night sky, region by region. |

**Présentation longue FR :**
> Chaque nuit, des satellites américains mesurent la lumière artificielle émise depuis le sol. Ces données, collectées par le programme VIIRS de la NOAA, permettent de suivre année après année l'intensité de l'éclairage nocturne partout sur Terre.
>
> Cette carte agrège ces mesures sur la France métropolitaine, année par année depuis 2013, et les traduit en une échelle de visibilité du ciel plutôt qu'en unités physiques : ce qu'on peut encore espérer y voir, d'un ciel de campagne où la Voie lactée reste visible à un ciel urbain où seules quelques dizaines d'étoiles percent encore le halo. Déplacez le curseur d'année pour voir comment cette intensité a varié, région par région, depuis 2013.

**Présentation longue EN :**
> Every night, American satellites measure the artificial light emitted from the ground. This data, collected by NOAA's VIIRS program, tracks the intensity of nighttime lighting everywhere on Earth, year after year.
>
> This map aggregates these measurements across mainland France, year by year since 2013, translating them into a sky-visibility scale rather than physical units: what you might still hope to see, from a countryside sky where the Milky Way remains visible to an urban sky where only a few dozen stars still pierce through the glow. Move the year slider to see how that intensity has varied, region by region, since 2013.

## Objectif

Faire voir, sur une grille de la France métropolitaine, l'évolution de l'intensité lumineuse depuis 2013, traduite en ce qu'elle signifie concrètement pour l'observation du ciel nocturne, sans présupposer le sens de cette évolution (voir "Angle éditorial" ci-dessus).

## Contenu (zone de montage)

- Légende de l'échelle de visibilité et contrôles (lecture/pause, vitesse, curseur d'année) **au-dessus de la carte**, jamais en surimpression : décision explicite (voir échanges de cadrage), revenant sur le choix initial d'une légende/curseur flottant en bas de carte (qui, entre autres, empiétait sur la Corse en petit écran).
- Grille hexagonale de la France métropolitaine (même silhouette et même grille que `biodiversity`), chaque cellule colorée selon son palier de l'échelle de visibilité à l'année sélectionnée (voir "Palette" dans `technical-specifications.md`), dans une carte volontairement plus compacte que les autres visualisations du site (voir "Rendu" dans `technical-specifications.md`).
- Fiche de détail au survol/tap d'une cellule.

## Interactions

- **Lecture automatique en boucle :** démarre dès le chargement de la page, sans action du visiteur (même convention que `satellites-in-orbit`, voir "Lecture automatique" ci-dessous) : revient sur le choix initial "pas d'animation automatique" retenu avant cette relecture.
- **Play/Pause :** interrompt ou reprend l'avancée automatique du curseur à l'année courante (voir "Accessibilité" ci-dessous : nécessaire pour un contenu qui bouge en continu sans intervention).
- **Vitesse de lecture :** Lent / Normal / Rapide, modifie la durée passée sur chaque année (voir "Lecture automatique" dans `technical-specifications.md`).
- **Curseur d'année :** un pas par année disponible (élément `<input type="range">` natif). Le déplacer manuellement recolore immédiatement la grille selon l'année choisie et met la lecture automatique en pause (évite que le curseur ne reparte tout seul sous le doigt/curseur du visiteur).
- **Survol/tap d'une cellule :** fiche de détail donnant le palier de visibilité en toutes lettres (ex. « Vous pourriez y voir la Voie lactée à l'œil nu »), l'année affichée, et la valeur de radiance mesurée pour les visiteurs qui veulent la donnée brute.
- **Pas de zoom ni de panoramique**, même décision que `biodiversity` (voir "Interactions" dans son `functional-specifications.md`) : la carte reste fixe, toujours cadrée sur la totalité de la silhouette de la France.
- **Pas de filtre supplémentaire :** contrairement aux autres visualisations du site, il n'y a ici qu'une seule dimension à explorer (le temps, via le curseur d'année), pas de catégorie à filtrer.

## Lecture automatique

Chaque passage part de 2013 (année la plus ancienne) et avance d'une année à la fois jusqu'à 2025 (aujourd'hui), marque un temps d'arrêt de quelques secondes sur cet état final (même logique que `satellites-in-orbit` : laisser voir l'année la plus récente comme un aboutissement plutôt que comme une frame parmi d'autres) puis reprend depuis 2013. Revient ainsi sur la précédente décision "vue initiale = année la plus récente" : avec une lecture automatique en boucle, il n'y a plus d'" état initial" figé à privilégier, la boucle montre systématiquement les deux bornes (départ et aboutissement).

## États

- **Chargement :** le temps que `skybins.json` soit récupéré et que la grille s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de grille vide silencieuse.
- **Vide :** sans objet ici (les 395 cellules de la grille portent toujours une valeur pour chaque année disponible, voir "Contraintes de validation" dans `data-model.md` ; pas de filtre pouvant réduire l'affichage à rien).

## Responsive

Légende et contrôles étant toujours au-dessus de la carte (jamais en surimpression, voir "Contenu" ci-dessus), leur repositionnement n'est plus une préoccupation propre au responsive : ils s'enchaînent normalement dans le flux de la page à toutes les tailles d'écran, la ligne de lecture (bouton, vitesse, curseur) passant simplement à la ligne sur les écrans étroits. Fiche de détail au tap sur une cellule plutôt qu'au survol.

## Accessibilité (limite connue)

La fiche de détail par cellule (survol/tap) n'est pas nativement accessible au clavier ni au lecteur d'écran, même limite que les grilles hexagonales de `biodiversity`. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le curseur d'année reste accessible au clavier (élément `<input type="range">` standard) : la recoloration de la grille selon l'année reste donc pilotable sans souris, seule la fiche de détail par cellule ne l'est pas. Le bouton Play/Pause est requis dès lors que le contenu s'anime en continu sans action du visiteur (même rationale que `satellites-in-orbit`).

## Contenu non traduit

Les libellés de l'échelle de visibilité (`scale` dans `data-model.md`) sont fournis dans les deux langues ; pas de contenu non traduit à signaler au-delà des règles générales.
