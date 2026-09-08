# Spécification fonctionnelle : La biodiversité française

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | La biodiversité française | Des millions d'observations citoyennes dessinent la carte du vivant en France. |
| EN | French Biodiversity | Millions of citizen observations map the living world across France. |

**Présentation longue FR :**
> Chaque année, des millions d'observations d'espèces sont consignées en France par des naturalistes amateurs et professionnels, puis versées dans des bases de données mondiales. Visualisées ensemble, elles révèlent des concentrations, des absences, des corridors écologiques. Cette carte invite à filtrer par grand groupe taxonomique et par saison, pour voir comment le vivant occupe et traverse le territoire.

**Présentation longue EN :**
> Every year, millions of species observations are recorded across France by amateur and professional naturalists, then contributed to global databases. Visualised together, they reveal concentrations, absences, ecological corridors. This map invites you to filter by major taxonomic group and by season, to see how life occupies and crosses the territory.

## Objectif

Donner à voir la répartition géographique du vivant observé en France métropolitaine, et permettre d'en explorer les variations par grand groupe taxonomique et par saison.

## Contenu (zone de montage)

- Carte de la France métropolitaine (silhouette illustrée, pas de fond de tuiles, voir `technical-specifications.md`), avec une grille de cellules hexagonales colorées selon le groupe taxonomique actif.
- Légende des groupes taxonomiques (couleur + libellé), reprenant la palette catégorielle officielle (voir `technical-specifications.md`).
- Filtre par groupe taxonomique (six groupes + "Tous les groupes").
- Filtre par saison (quatre saisons + "Toutes saisons").
- Bascule "Données en direct" (voir "Mode données en direct" ci-dessous).
- Tooltip contextuel au survol/tap d'une cellule.

## Interactions

- **Filtre groupe taxonomique :** sélection unique (radio), "Tous les groupes" par défaut. Un groupe actif recolore la grille selon l'intensité du groupe sélectionné (au lieu d'un mélange de couleurs par cellule).
- **Filtre saison :** sélection unique, "Toutes saisons" par défaut. Se combine avec le filtre groupe (ex : "Oiseaux" + "Hiver").
- **Bascule "Données en direct" :** interroge l'API de recherche GBIF pour la combinaison de filtres courante (voir `data-model.md`) et affiche les occurrences individuelles en points bruts par-dessus (ou à la place de) la grille hexagonale. Un changement de filtre pendant que ce mode est actif relance automatiquement la requête. Revenir au mode par défaut réaffiche instantanément l'instantané précalculé (pas de rechargement de page).
- **Survol / tap d'une cellule :** tooltip avec le nombre d'observations (pour le filtre courant), le groupe dominant si "Tous les groupes" est actif, un exemple d'espèce.
- **Pas de zoom ni de panoramique** (écart à l'intention initiale, demande explicite à l'implémentation) : la carte reste fixe, toujours cadrée sur la totalité de la silhouette de la France (voir "Vue initiale" ci-dessous, qui décrit donc l'unique vue plutôt qu'un simple état de départ). Simplifie l'interaction au profit des seuls filtres et du tooltip ; voir "Accessibilité" ci-dessous pour l'effet sur la limite déjà documentée.
- **Vue initiale (et unique) :** France métropolitaine entière visible, aucun filtre actif au-delà des valeurs par défaut ("Tous les groupes", "Toutes saisons"), mode par défaut (pas "données en direct").

## États

- **Chargement :** le temps que le JSON précalculé (`public/data/biodiversity/hexbins.json`) et la silhouette de fond soient récupérés et que la grille s'initialise ; zone de montage réservée sans saut de mise en page (voir "Page de visualisation" dans `style-guide.md`).
- **Erreur :** échec de récupération du JSON précalculé → message d'erreur, pas de carte vide silencieuse.
- **Vide :** une combinaison groupe + saison sans aucune observation (cellules toutes à zéro) → message l'indiquant plutôt qu'une carte visuellement vide sans explication.
- **Chargement (mode données en direct) :** requête GBIF en cours → indicateur dédié à la bascule, distinct de l'état de chargement initial.
- **Erreur (mode données en direct) :** échec ou lenteur excessive de l'API GBIF → message explicite, proposition de revenir au mode par défaut plutôt que de bloquer sur un état d'échec.
- **Vide (mode données en direct) :** zéro résultat GBIF pour la combinaison de filtres → message dédié.

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- Tooltip au tap plutôt qu'au survol ; un second tap ailleurs sur la carte le referme.
- Filtres (groupe, saison) en boutons empilés/à la ligne selon la largeur disponible, plutôt qu'une rangée horizontale unique forcée.
- Légende repliable sous un certain seuil de largeur, pour ne pas rogner l'espace de la carte.

## Accessibilité (limite connue)

L'interaction principale (carte, survol des cellules) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

## Contenu non traduit

Les noms scientifiques d'espèces (`topSpecies`, ex : *Turdus merula*) restent en latin, non traduits, dans les deux langues : convention taxonomique standard, pas une donnée à localiser.
