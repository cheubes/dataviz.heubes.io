# Spécification fonctionnelle : Le pouls du réseau

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le pouls du réseau | Mois après mois, la ponctualité de chaque liaison TGV, sur une carte du réseau national qui respire au fil des années. |
| EN | The Network's Pulse | Month after month, the punctuality of every TGV route, on a map of the national network that breathes across the years. |

**Présentation longue FR (proposition) :**
> Chaque mois, la SNCF publie la régularité de ses liaisons TGV : combien de trains ont circulé, combien sont arrivés à l'heure, et pourquoi les autres ont pris du retard. Cette carte assemble ces relevés mensuels sur l'ensemble du réseau national.
>
> Déplacez le curseur pour voir un mois précis : l'épaisseur de chaque liaison indique le nombre de trains qui l'empruntent, sa couleur la part d'entre eux arrivés à l'heure. Certains mois se distinguent nettement des autres : grèves, intempéries, grands travaux laissent une trace visible sur le réseau entier plutôt que sur une seule ligne.

**Présentation longue EN (proposition) :**
> Every month, SNCF publishes the punctuality of its TGV routes : how many trains ran, how many arrived on time, and why the others were delayed. This map assembles these monthly records across the entire national network.
>
> Move the slider to see a specific month : the thickness of each route shows how many trains run on it, its color the share that arrived on time. Some months stand out clearly from the others : strikes, bad weather, major engineering works leave a visible mark across the whole network rather than on a single line.

## Objectif

Faire voir, sur une carte réelle du réseau TGV français, comment la ponctualité de chaque liaison évolue mois après mois, et donner à comparer les liaisons entre elles à un instant donné.

## Contenu (zone de montage)

- Carte géographique de la France (silhouette, pas de fond de tuiles, voir "Rendu" dans `technical-specifications.md`), avec chaque liaison TGV tracée entre ses deux gares.
- Épaisseur de chaque liaison proportionnelle au nombre de trains programmés ce mois-là ; couleur proportionnelle à son taux de ponctualité (voir "Taux de ponctualité" dans `data-model.md`).
- Curseur de mois (voir "Interactions" ci-dessous).
- Légende de la palette séquentielle de ponctualité.
- Fiche de détail au survol/tap d'une liaison.

## Interactions

- **Curseur de mois :** un pas par mois disponible dans le dataset, pas d'animation automatique (décision explicite, voir échanges de cadrage). Déplacer le curseur recolore et réépaissit immédiatement toutes les liaisons selon le mois choisi.
- **Survol/tap d'une liaison :** fiche de détail donnant les deux gares, le taux de ponctualité du mois sélectionné, le nombre de trains programmés/annulés, le retard moyen à l'arrivée, et la répartition des causes de retard (les six catégories du dataset source, voir `data-model.md`) — la seule vue de ces causes dans cette visualisation, la couleur de la liaison portant le taux de ponctualité plutôt que la cause dominante (décision explicite, voir échanges de cadrage).
- **Zoom/pan :** libre sur la carte (souris/molette, tactile), utile pour distinguer les liaisons qui convergent autour des grands nœuds (Paris notamment).
- **Vue initiale :** mois le plus récent disponible sélectionné par défaut, carte de France entière visible.

## États

- **Chargement :** le temps que `network.json` soit récupéré et que la carte s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet pour la carte elle-même (le réseau de liaisons reste affiché à chaque mois) ; une liaison sans donnée exploitable pour le mois sélectionné (voir "Format de sortie" dans `data-model.md`) s'affiche en gris neutre plutôt que dans la palette de ponctualité, avec une mention correspondante dans sa fiche de détail plutôt qu'une absence silencieuse.

## Responsive

- Curseur de mois et légende repositionnés sous la carte plutôt qu'en surimpression, avec une cible tactile suffisamment grande pour le curseur.
- Pan/zoom au geste tactile ; fiche de détail au tap sur une liaison plutôt qu'au survol.

## Accessibilité (limite connue)

L'interaction principale (carte du réseau, zoom/pan, survol des liaisons) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le curseur de mois reste accessible au clavier (élément `<input type="range">` standard) : changer de mois reste donc pilotable sans souris, seule la fiche de détail par liaison ne l'est pas.

## Contenu non traduit

Les noms de gares (`name` dans `data-model.md`) ne sont disponibles qu'en français dans la source ; affichés tels quels dans la version anglaise de la page, sans traduction (comparable aux noms de communes ou d'espèces des autres visualisations du site).
