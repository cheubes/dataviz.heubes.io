# Spécification fonctionnelle : La migration des monarques

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | La migration des monarques | Un voyage qu'aucun papillon ne fait en entier : le relais des monarques entre le Mexique et le Canada, mois après mois, à partir de près de 400 000 observations. |
| EN | The Monarch Migration | A journey no single butterfly completes: the monarchs' relay between Mexico and Canada, month after month, drawn from nearly 400,000 observations. |

**Présentation longue FR :**
> Un papillon monarque ne fait jamais le trajet complet. La migration qui le porte du Mexique jusqu'au Canada et retour est un relais entre plusieurs générations successives, dont aucune ne connaît le point de départ ni le point d'arrivée du voyage entier.
>
> Cette carte anime, mois après mois, près de 400 000 observations de monarques répertoriées dans GBIF en Amérique du Nord, regroupées sur une grille d'un degré : plus une case est opaque, plus elle recense d'observations à cette période de l'année. La vague remonte du Mexique vers le nord au printemps, atteint le sud du Canada en été, puis reflue vers le sud à l'automne, sans qu'aucun individu ne l'ait vécue en entier. Attention : ce sont des observations, pas un recensement. La densité reflète aussi l'effort d'observation, pas seulement la présence des papillons.

La version EN (`src/content/visualizations/monarch-migration.en.md`) en est la traduction fidèle. Le chiffre "près de 400 000" est celui du jeu affiché (395 170 observations, voir "Prétraitement" dans `data-model.md`) : le brouillon initial parlait à tort de "millions d'observations".

## Objectif

Faire voir, sur une carte animée au long d'une année, la migration du monarque comme une vague collective : une densité d'observations qui remonte vers le nord puis reflue, sans qu'aucun individu ne parcoure le trajet complet.

## Contenu (zone de montage)

- Carte de l'Amérique du Nord (silhouette terrestre, cours d'eau et relief, voir "Techno carte" dans `technical-specifications.md`).
- Grille de cases de 1° × 1°, dont l'opacité varie avec le nombre d'observations du mois simulé courant.
- Indicateur du mois simulé en cours.
- Contrôles de lecture : Play/Pause, sélecteur de vitesse (Lent / Normal / Rapide).
- Tooltip contextuel au survol/tap d'une case.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page et boucle en continu sur une année simulée (un seul cycle calendaire, de janvier à décembre puis retour à janvier).
- **Vitesse :** Lent / Normal / Rapide, facteurs ×0,5 / ×1 / ×2 (36 secondes par année à vitesse normale).
- **Survol/tap d'une case :** tooltip indiquant, pour le mois simulé courant, le volume d'observations de cette case en pourcentage de son propre maximum annuel (par exemple "Observations en août : 32 % du pic annuel ici"). Volume relatif à la case elle-même, pas un comptage absolu ni un rang global : il dit si la période courante est haute ou basse pour cet endroit précis, pas s'il y a plus de papillons ici qu'ailleurs. Pas de fiche individuelle (aucun individu à identifier). Le pourcentage se met à jour en continu tant que la case est survolée ou épinglée, puisque le mois avance sous le pointeur.
- **Épinglage :** un clic (ou un tap) sur une case épingle le tooltip, un clic ailleurs le retire.
- **Zoom/pan :** libre (souris/molette, tactile), jusqu'à ×6.
- **Vue initiale :** Amérique du Nord entière visible, lecture automatique déjà en cours.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : le mois et le cadrage sont restaurés. Un mois partagé ouvre la carte en pause au début de ce mois (voir "État dans l'URL" dans `technical-specifications.md`).
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : la carte s'ouvre en pause au début du mois d'août. Le cycle n'a pas d'état final : août est le mois où la densité couvre le plus de cases et totalise le plus d'observations (960 cases, un peu plus de 100 000 observations), soit l'image la plus complète de la vague.

## États

- **Chargement :** le temps que le fichier de densité et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération d'un des fichiers (ou fichier de densité vide) : message d'erreur, pas de carte vide silencieuse.
- **Pas d'état vide :** aucun filtre, donc aucune combinaison qui ne montre rien.

## Responsive

Pan/zoom au geste tactile, tooltip et épinglage au tap, contrôles sur une ligne qui se replie sur petit écran.

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des cases) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet. Le bouton Play/Pause reste accessible au clavier (élément `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Limites connues

- **Pas de légende de l'échelle d'opacité :** l'explication tient dans le texte de présentation ("plus une case est opaque, plus elle recense d'observations"), pas dans un composant dédié sur la carte.
- **Cases visibles à l'œil nu :** environ 100 km de côté. Un pas plus fin multiplierait le nombre de requêtes GBIF du prétraitement, déjà contraintes par la limite de fréquence de l'API (voir "Prétraitement" dans `data-model.md`).
- **Pourcentage instable sur les cases à faible effectif :** une case qui ne compte qu'une observation dans l'année affiche 100 % du pic annuel le mois de cette observation. À 1°, une case active sur cinq (22 %) totalise moins de cinq observations sur l'année, et une sur trois (32 %) moins de dix ; le tooltip reste donc un ordre de grandeur, pas une mesure précise.

## Contenu non traduit

Aucun nom scientifique n'est affiché dans l'interface de la carte (seule la citation du jeu de données, dans le bloc de crédit, porte *Danaus plexippus*). Pas de contenu non traduit à signaler au-delà des règles générales.
