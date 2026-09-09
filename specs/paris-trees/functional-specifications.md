# Spécification fonctionnelle : Paris, arbre par arbre

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : implémenté.**

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Paris, arbre par arbre | 194 000 arbres de Paris, recensés un par un : explorez-les par quartier, par genre ou par nom d'espèce. |
| EN | Paris, Tree by Tree | 194,000 of Paris's trees, mapped one by one : explore them by district, genus, or species name. |

**Présentation longue FR :**
> La Ville de Paris tient un inventaire de son patrimoine arboré : arbres d'alignement le long des rues, arbres des jardins, des bois et des équipements municipaux. Cette carte affiche 194 000 arbres de cet inventaire, chacun positionné à son emplacement réel dans les vingt arrondissements de la ville (le jeu source recense aussi environ 25 000 arbres plantés dans des cimetières parisiens extraterritoriaux, en dehors de la ville elle-même ; ils ne sont pas repris ici, hors du périmètre géographique de cette carte).
>
> Aucune thèse à suivre ici : c'est une forêt à parcourir. Zoomez sur un quartier, filtrez par genre dominant (platanes, marronniers, tilleuls...), ou cherchez une espèce précise pour voir où elle pousse dans la ville. L'inventaire, mis à jour chaque semaine par la Ville de Paris, ne couvre pas les arbres du domaine privé ni la totalité du patrimoine municipal : une photographie partielle, mais la plus complète disponible en open data.

**Présentation longue EN :**
> The City of Paris maintains an inventory of its tree stock : street trees, park trees, woodland trees, and trees on municipal grounds. This map displays 194,000 trees from that inventory, each placed at its real location within the city's twenty districts (the source dataset also lists about 25,000 trees planted in extraterritorial Paris-owned cemeteries, outside the city itself ; they aren't included here, outside this map's geographic scope).
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
- **Ajouté après une nouvelle relecture** (retour utilisateur : les jardins à statut national — Luxembourg, Jardin des Plantes, Tuileries, Palais-Royal — restent des zones vides sur la carte, absents de l'inventaire municipal, voir "Absence notée" dans `data-model.md`) : case à cocher "Jardins nationaux (OpenStreetMap)", **activée par défaut** (ajusté sur un retour utilisateur suivant ; initialement désactivée). Affiche ces quatre jardins en anneaux creux d'un gris léger hors palette catégorielle (pas des points pleins colorés par genre : ces arbres n'ont, pour la quasi-totalité, ni genre ni aucun autre attribut connu, voir "Dataset source" dans `data-model.md`). Ne participent ni au filtre genre, ni à la recherche, ni au compteur d'arbres visibles : jeu de données trop différent en fiabilité pour être mélangé silencieusement au reste (voir "Dataset source" dans `data-model.md`). Un renvoi `*` sur le libellé de la case pointe vers une note de bas de page sous la carte, qui porte la mise en garde (couverture communautaire partielle, positions approximatives) : **déplacée là et rendue permanente sur un retour utilisateur** (visible que la case soit cochée ou non, plutôt qu'un texte affiché seulement case cochée).

## Interactions

- **Filtre genre :** légende cliquable, toggle multi-sélection, une entrée par genre dominant plus "Autres", toutes actives par défaut. Désactiver un genre retire ses points de la carte et du compteur visible.
- **Recherche d'espèce :** champ texte, correspondance sur le nom commun ou le nom scientifique (voir `searchText` dans `data-model.md`). Les arbres correspondants restent à pleine opacité, les autres s'estompent sans disparaître (garde le contexte géographique de l'ensemble de la carte plutôt que de filtrer strictement) ; champ vide → tous les arbres à pleine opacité.
- **Zoom/pan :** libre sur l'ensemble de la carte de Paris (souris/molette, tactile). **Ajouté après une relecture** (retour utilisateur : boutons de contrôle du zoom, repositionnés en haut à droite lors d'une relecture suivante — initialement en bas à droite) : trois boutons en surimpression en haut à droite de la carte (zoom avant, zoom arrière, réinitialiser à la vue initiale), pour un accès explicite au zoom sans dépendre du geste souris/tactile — voir "Rendu" dans `technical-specifications.md`. Bouton zoom arrière désactivé au niveau de zoom minimal, zoom avant désactivé au maximum.
- **Clic sur un arrondissement :** zoome sur cet arrondissement (voir "Rendu" dans `technical-specifications.md` pour le mécanisme de zoom programmatique) ; sert de raccourci au zoom manuel plutôt que de filtre séparé, cohérent avec le choix d'une vraie carte géographique (voir échanges de cadrage).
- **Survol/tap d'un arbre :** fiche de détail (nom commun, genre et espèce, circonférence, hauteur, stade de développement, domanialité, arrondissement, mention "arbre remarquable" le cas échéant).
- **Survol/tap d'un arbre de jardin national** (case "Jardins nationaux" activée) : fiche de détail minimale (genre et espèce si connus, sinon mention générique ; nom du jardin), cohérente avec la pauvreté des attributs disponibles pour ces points (voir "Contenu" ci-dessus). Prioritaire sur un arbre municipal proche en cas de superposition, cohérent avec son affichage par-dessus le reste de la nuée.
- **Taille des points :** proportionnelle à la circonférence du tronc (voir "Rendu" dans `technical-specifications.md`), lisible sans interaction, en complément de la fiche de détail.
- **Vue initiale :** tous les genres actifs, jardins nationaux affichés, recherche vide, carte centrée sur Paris entier, zoom initial cadrant les vingt arrondissements.

## États

- **Chargement :** le temps que les cinq fichiers de données (`trees.json`, `districts.json`, `streets.json`, `seine.json`, `national-gardens.json`) soient récupérés et que la carte s'initialise. `trees.json` nettement plus volumineux que sur les autres visualisations du site (voir "Format de données" dans `technical-specifications.md`) : un indicateur de progression du chargement est prévu plutôt qu'un simple état binaire chargé/non chargé, pour ne pas laisser un visiteur avec une carte vide sans retour pendant plusieurs secondes ; les quatre autres fichiers, nettement plus légers, n'ont pas cet indicateur.
- **Erreur :** échec de récupération d'un des cinq fichiers → message d'erreur, pas de carte vide silencieuse.
- **Vide :** recherche sans aucune correspondance, ou tous les genres désactivés via le filtre → message neutre l'indiquant, plutôt qu'une carte sans arbres sans explication. **Corrigé après un retour utilisateur :** ce message ne bloque plus le zoom/pan de la carte en dessous (`pointer-events: none` sur le message, voir "Rendu" dans `technical-specifications.md`) — un visiteur qui vide involontairement le filtre garde la main sur la carte plutôt que de la voir devenir insensible à la souris/au tactile tant que le message reste affiché.

## Responsive

- Pan/zoom de la carte au geste tactile.
- Fiche de détail au tap sur un arbre plutôt qu'au survol.
- Légende, filtre et champ de recherche : pas de superposition à la carte à corriger sur petit écran, ces éléments sont déjà positionnés dans le flux normal de la page, au-dessus de la zone de carte, à toutes les tailles d'écran (même parti que les autres visualisations du site) ; ils se réorganisent en colonne sur petit écran (voir "Responsive" dans `technical-specifications.md`), avec des cibles tactiles suffisamment grandes (la zone cliquable de chaque case à cocher s'étend à tout le libellé, pas seulement à la case).

## Accessibilité (limite connue)

L'interaction principale (carte de points, pan tactile/souris, survol des arbres) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le champ de recherche, les entrées de la légende/filtre, la case "Jardins nationaux" et les boutons de zoom restent accessibles au clavier (éléments `<input>` et `<button>` standard, `aria-label` sur les boutons de zoom qui n'ont qu'un symbole), pour permettre de filtrer et de zoomer sans dépendre du geste souris/tactile sur la carte elle-même ; le pan reste hors clavier (aucun bouton de déplacement ajouté).

## Contenu non traduit

Les noms communs d'espèces (`libellefrancais` dans le jeu source) ne sont disponibles qu'en français ; affichés tels quels dans la version anglaise de la page, sans traduction (comparable aux noms de communes ou catégories officielles d'un dataset, voir "Multilingue" dans `functional-specifications.md` général). Les noms scientifiques (genre, espèce) ne sont pas non plus traduits, par nature communs aux deux langues.
