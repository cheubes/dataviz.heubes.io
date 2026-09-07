# Spécification fonctionnelle : Les routes de migration

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les routes de migration | Les trajectoires géolocalisées de milliers d'oiseaux entre l'Europe et l'Afrique. |
| EN | The Migration Routes | GPS-tracked trajectories of thousands of birds between Europe and Africa. |

**Présentation longue FR :**
> Chaque automne, des millions d'oiseaux quittent l'Europe pour rejoindre l'Afrique subsaharienne. Chaque printemps, ils reviennent. Grâce aux balises GPS embarquées, les chercheurs ont pu suivre individuellement des milliers d'individus et documenter leurs routes avec une précision inédite. Cette carte anime ces trajectoires réelles : chaque ligne est le voyage d'un oiseau. Elles révèlent des couloirs, des étapes, des détours, et parfois des voyages sans retour.

**Présentation longue EN :**
> Every autumn, millions of birds leave Europe for sub-Saharan Africa. Every spring, they return. Thanks to onboard GPS tags, researchers have individually tracked thousands of birds and documented their routes with unprecedented precision. This map animates these real trajectories: each line is the journey of a single bird. They reveal corridors, stopovers, detours, and sometimes journeys with no return.

## Objectif

Faire voir, par l'animation de trajectoires GPS réelles, les couloirs de migration entre l'Europe et l'Afrique, et la diversité des stratégies selon les espèces.

## Contenu (zone de montage)

- Carte illustrée Europe/Afrique (silhouette, pas de fond de tuiles, voir `technical-specifications.md`).
- Filtre par espèce (toggle multi-sélection).
- Filtre par direction (Automne / Printemps / Les deux).
- Contrôles de lecture : bouton Play/Pause, indicateur de la date simulée en cours, slider de vitesse (Lent / Normal / Rapide).
- Tooltip contextuel au survol/tap d'une trajectoire.

## Interactions

- **Filtre espèce :** toggle multi-sélection, un bouton par espèce (couleur + nom commun localisé), tous actifs par défaut ("Toutes les espèces"). Désactiver une espèce retire ses trajectoires de l'animation en cours, sans la redémarrer.
- **Filtre direction :** Automne / Printemps / Les deux, "Les deux" par défaut.
  - "Les deux" rejoue un cycle calendaire unique (janvier à décembre) où les trajectoires d'automne et de printemps apparaissent chacune à leur période réelle de l'année : la scène montre l'aller-retour complet dans un seul cycle, pas deux lectures séquentielles.
- **Lecture automatique :** l'animation démarre dès le chargement de la page et boucle en continu, sans action du visiteur (décision explicite, voir échanges de cadrage). Le bouton Play/Pause permet de l'interrompre à tout moment (voir "Accessibilité" ci-dessous : nécessaire pour un contenu qui bouge en continu sans intervention).
- **Vitesse :** slider Lent / Normal / Rapide, "Normal" par défaut (~3 secondes simulées par mois de migration, soit un cycle annuel complet en ~36 secondes ; Lent/Rapide multiplient ce rythme, valeurs exactes à ajuster à l'implémentation).
- **Survol / tap d'une trajectoire :** surlignage de la trajectoire de l'individu, tooltip avec l'espèce, l'identifiant anonymisé ("Individu CC_001"), la distance totale parcourue (km) et la durée de la migration (jours), voir "Champs dérivés côté client" dans `data-model.md`.
- **Zoom / pan :** sur la zone Europe/Afrique illustrée (pas de panoramique libre au-delà).
- **Vue initiale :** zone Europe/Afrique entière visible, toutes espèces actives, direction "Les deux", animation déjà en cours.

## États

- **Chargement :** le temps que le JSON des trajectoires et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** combinaison espèce(s) + direction sans aucune trajectoire disponible (ex. une espèce sans données de printemps dans l'étude retenue) → message l'indiquant plutôt qu'une carte sans trajectoires sans explication.

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- Pan/zoom de la carte au geste tactile.
- Tooltip et surlignage au tap sur une trajectoire plutôt qu'au survol.
- Contrôles (filtres, slider de vitesse) repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes (slider notamment).

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des trajectoires) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le bouton Play/Pause (voir "Interactions") reste néanmoins accessible au clavier (élément `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms scientifiques d'espèces ne sont pas affichés directement dans l'interface (seuls les noms communs localisés le sont, voir `data-model.md`) ; pas de contenu non traduit à signaler au-delà des règles générales.
