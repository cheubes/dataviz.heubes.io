# Spécification fonctionnelle : Paris, arbre par arbre

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Paris, arbre par arbre | Deux cent mille arbres de Paris, recensés un par un : explorez-les par quartier, par genre ou par nom d'espèce. |
| EN | Paris, Tree by Tree | Two hundred thousand of Paris's trees, mapped one by one : explore them by district, genus, or species name. |

**Présentation longue FR (proposition) :**
> La Ville de Paris tient un inventaire de son patrimoine arboré : arbres d'alignement le long des rues, arbres des jardins, des bois et des équipements municipaux. Cette carte affiche l'intégralité des 219 000 arbres de cet inventaire, chacun positionné à son emplacement réel.
>
> Aucune thèse à suivre ici : c'est une forêt à parcourir. Zoomez sur un quartier, filtrez par genre dominant (platanes, marronniers, tilleuls...), ou cherchez une espèce précise pour voir où elle pousse dans la ville. L'inventaire, mis à jour chaque semaine par la Ville de Paris, ne couvre pas les arbres du domaine privé ni la totalité du patrimoine municipal : une photographie partielle, mais la plus complète disponible en open data.

**Présentation longue EN (proposition) :**
> The City of Paris maintains an inventory of its tree stock : street trees, park trees, woodland trees, and trees on municipal grounds. This map displays the entire inventory, all 219,000 trees, each placed at its real location.
>
> There's no argument to follow here : it's a forest to wander through. Zoom into a district, filter by dominant genus (plane trees, horse chestnuts, lime trees...), or search for a specific species to see where it grows across the city. The inventory, updated weekly by the City of Paris, doesn't cover privately-owned trees or the full extent of the municipal tree stock : a partial picture, but the most complete one available as open data.

## Objectif

Donner à explorer librement, sans thèse imposée, la totalité du patrimoine arboré recensé par la Ville de Paris : où poussent les arbres, quels genres dominent, où trouver une espèce précise.

## Contenu (zone de montage)

- Carte stylisée des vingt arrondissements de Paris (silhouette, pas de fond de tuiles, voir "Rendu" dans `technical-specifications.md`), avec un point par arbre à sa position réelle.
- Légende des huit genres dominants + "Autres" (couleur + nom commun localisé), doublée d'un filtre interactif (voir "Filtre genre" ci-dessous).
- Champ de recherche (nom commun ou scientifique d'une espèce).
- Mise en avant visuelle des arbres marqués "remarquables" par la Ville de Paris.
- Compteur du nombre d'arbres actuellement visibles (voir "Champs dérivés côté client" dans `data-model.md`).
- Fiche de détail au survol/tap d'un arbre.

## Interactions

- **Filtre genre :** légende cliquable, toggle multi-sélection, une entrée par genre dominant plus "Autres", toutes actives par défaut. Désactiver un genre retire ses points de la carte et du compteur visible.
- **Recherche d'espèce :** champ texte, correspondance sur le nom commun ou le nom scientifique (voir `searchText` dans `data-model.md`). Les arbres correspondants restent à pleine opacité, les autres s'estompent sans disparaître (garde le contexte géographique de l'ensemble de la carte plutôt que de filtrer strictement) ; champ vide → tous les arbres à pleine opacité.
- **Zoom/pan :** libre sur l'ensemble de la carte de Paris (souris/molette, tactile).
- **Clic sur un arrondissement :** zoome sur cet arrondissement (voir "Rendu" dans `technical-specifications.md` pour le mécanisme de zoom programmatique) ; sert de raccourci au zoom manuel plutôt que de filtre séparé, cohérent avec le choix d'une vraie carte géographique (voir échanges de cadrage).
- **Survol/tap d'un arbre :** fiche de détail (nom commun, genre et espèce, circonférence, hauteur, stade de développement, domanialité, arrondissement, mention "arbre remarquable" le cas échéant).
- **Taille des points :** proportionnelle à la circonférence du tronc (voir "Rendu" dans `technical-specifications.md`), lisible sans interaction, en complément de la fiche de détail.
- **Vue initiale :** tous les genres actifs, recherche vide, carte centrée sur Paris entier, zoom initial cadrant les vingt arrondissements.

## États

- **Chargement :** le temps que `trees.json` et `districts.json` soient récupérés et que la carte s'initialise. Fichier de données nettement plus volumineux que sur les autres visualisations du site (voir "Format de données" dans `technical-specifications.md`) : un indicateur de progression du chargement est prévu plutôt qu'un simple état binaire chargé/non chargé, pour ne pas laisser un visiteur avec une carte vide sans retour pendant plusieurs secondes.
- **Erreur :** échec de récupération d'un des deux fichiers → message d'erreur, pas de carte vide silencieuse.
- **Vide :** recherche sans aucune correspondance, ou tous les genres désactivés via le filtre → message neutre l'indiquant, plutôt qu'une carte sans arbres sans explication.

## Responsive

- Pan/zoom de la carte au geste tactile.
- Fiche de détail au tap sur un arbre plutôt qu'au survol.
- Légende, filtre et champ de recherche repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.

## Accessibilité (limite connue)

L'interaction principale (carte de points, zoom/pan, survol des arbres) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le champ de recherche et les entrées de la légende/filtre restent accessibles au clavier (éléments `<input>` et `<button>` standard), pour permettre de filtrer sans dépendre de la carte animée elle-même.

## Contenu non traduit

Les noms communs d'espèces (`libellefrancais` dans le jeu source) ne sont disponibles qu'en français ; affichés tels quels dans la version anglaise de la page, sans traduction (comparable aux noms de communes ou catégories officielles d'un dataset, voir "Multilingue" dans `functional-specifications.md` général). Les noms scientifiques (genre, espèce) ne sont pas non plus traduits, par nature communs aux deux langues.
