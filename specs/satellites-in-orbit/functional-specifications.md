# Spécification fonctionnelle : La ruée vers l'orbite

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision (voir échanges de cadrage et précédent similaire dans `bird-migrations`, où le titre n'a pas été figé avant l'implémentation).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | La ruée vers l'orbite | Une nuée qui grandit depuis 1957 : l'accélération du nombre de satellites en orbite autour de la Terre, et qui les a lancés. |
| EN | The Orbital Rush | A swarm growing since 1957 : the accelerating number of satellites in orbit around Earth, and who launched them. |

**Présentation longue FR (proposition) :**
> Depuis Spoutnik en 1957, des milliers de satellites ont rejoint l'orbite terrestre : stations de navigation, satellites météo, télescopes, engins scientifiques, constellations de télécommunication. Cette visualisation anime, année par année, l'accumulation réelle des satellites toujours en orbite aujourd'hui (actifs ou non), à partir du catalogue tenu par le réseau de surveillance spatiale de l'US Space Force.
>
> Chaque point représente un satellite réel, positionné au moment de son lancement plutôt que sur sa véritable orbite (voir `technical-specifications.md`), coloré selon la zone qui l'a mis en orbite : États-Unis, Russie/URSS, Chine, Europe ou reste du monde. La nuée reste clairsemée pendant les premières décennies de l'ère spatiale, avant de s'épaissir nettement à partir des années deux mille.

**Présentation longue EN (proposition) :**
> Since Sputnik in 1957, thousands of satellites have reached Earth orbit : navigation systems, weather satellites, telescopes, scientific probes, telecommunication constellations. This visualization animates, year by year, the real accumulation of satellites still in orbit today (active or not), drawn from the catalog maintained by the US Space Force's space surveillance network.
>
> Each point represents a real satellite, positioned at the moment of its launch rather than on its actual orbit (see `technical-specifications.md`), colored by the launching region : United States, Russia/USSR, China, Europe, or the rest of the world. The swarm stays sparse through the early decades of the space age, then thickens sharply from the two-thousands onward.

## Objectif

Faire voir, par l'accumulation progressive de points autour d'un globe stylisé, l'accélération du nombre de satellites en orbite depuis 1957, et la part de chaque grande zone de lancement dans cette croissance.

## Contenu (zone de montage)

- Globe stylisé (cercle, sans géographie réelle, voir "Rendu" dans `technical-specifications.md`), centré dans la zone de montage.
- Nuée de points en halo autour du globe, chaque point apparaissant au moment du lancement du satellite qu'il représente.
- Légende des cinq zones (couleur + nom localisé), doublée d'un filtre interactif (voir "Filtre zone" ci-dessous).
- Compteur du nombre total de satellites en orbite à l'instant simulé courant (voir "Champs dérivés côté client" dans `data-model.md`), recalculé selon les zones actives.
- Indicateur de l'année simulée en cours.
- Contrôles de lecture : bouton Play/Pause ; bouton Rejouer, visible une fois l'animation arrivée à aujourd'hui.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page, sans action du visiteur. Contrairement à `bird-migrations` (cycle saisonnier, donc bouclé en continu), l'animation ici est un passage unique de 1957 à aujourd'hui : elle s'arrête à la date la plus récente du dataset plutôt que de reboucler, pour laisser voir l'état final ("aujourd'hui, X satellites en orbite") comme un aboutissement plutôt que comme une frame parmi d'autres.
- **Play/Pause :** interrompt ou reprend l'accumulation à l'instant simulé courant (voir "Accessibilité" ci-dessous : nécessaire pour un contenu qui bouge en continu sans intervention).
- **Rejouer :** n'apparaît qu'une fois l'animation arrivée à son terme ; relance un passage complet depuis 1957.
- **Filtre zone :** légende cliquable, toggle multi-sélection, une entrée par zone (couleur + nom localisé), les cinq actives par défaut. Désactiver une zone retire ses points de la nuée affichée et du compteur total, sans redémarrer l'animation en cours.
- **Pas de fiche par satellite individuel :** ni survol, ni tap sur un point isolé (décision explicite, voir échanges de cadrage) — l'angle de cette visualisation est la densité et l'accélération d'ensemble, pas l'exploration satellite par satellite ; une telle interaction resterait par ailleurs peu fiable sur une nuée aussi dense (points très proches les uns des autres vers la fin de l'animation).
- **Vue initiale :** les cinq zones actives, année simulée à 1957, compteur à zéro, lecture automatique déjà en cours.

## États

- **Chargement :** le temps que `satellites.json` soit récupéré et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de globe vide silencieux.
- **Vide :** toutes les zones désactivées via le filtre → globe sans nuée et compteur à zéro, avec un message neutre rappelant qu'aucune zone n'est sélectionnée (état voulu par l'interaction du visiteur, à distinguer de l'état d'erreur ci-dessus).

## Responsive

- Contrôles de lecture (Play/Pause, Rejouer) et légende/filtre repositionnés sous le globe plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.
- Le globe et son halo de points redimensionnent avec la largeur de la zone de montage, sans changement de comportement entre tactile et souris au-delà du ciblage des contrôles (pas d'interaction de survol à adapter, voir "Pas de fiche par satellite individuel" ci-dessus).

## Accessibilité (limite connue)

L'interaction principale (globe animé, accumulation de points) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Les boutons Play/Pause, Rejouer et les entrées de la légende/filtre restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention et de filtrer sans dépendre du globe animé lui-même.

## Contenu non traduit

Les noms de zone (`nameFr` / `nameEn`, voir `data-model.md`) sont fournis dans les deux langues ; pas de contenu non traduit à signaler au-delà des règles générales.
