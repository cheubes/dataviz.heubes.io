# Spécification fonctionnelle : Ce qu'il en reste

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : brouillon de cadrage, pas encore implémenté.** Titre, résumé et présentation longue sont des propositions de travail, ouvertes à révision.

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Ce qu'il en reste | Une poignée d'espèces emblématiques, une foule d'individus qui s'amenuise ou se reconstitue, réévaluation après réévaluation de la Liste rouge de l'UICN. |
| EN | What's Left | A handful of emblematic species, a crowd of individuals that shrinks or rebuilds, reassessment after reassessment of the IUCN Red List. |

**Présentation longue FR (proposition) :**
> Depuis les années 1990, l'Union internationale pour la conservation de la nature réévalue régulièrement le statut de menace des espèces qu'elle suit : préoccupation mineure, vulnérable, en danger, en danger critique. Chaque réévaluation est aussi, souvent, une nouvelle estimation du nombre d'individus qu'il reste réellement à l'état sauvage.
>
> Cette page suit quelques espèces emblématiques à travers ces réévaluations successives, chacune représentée par une foule d'icônes qui grandit ou rétrécit au fil du temps. Le récit n'est pas univoque : à côté du déclin de la vaquita ou du grand hamster d'Alsace, le panda géant et le gorille des montagnes montrent qu'un rétablissement reste possible.

**Présentation longue EN (proposition) :**
> Since the 1990s, the International Union for Conservation of Nature has regularly reassessed the threat status of the species it monitors : least concern, vulnerable, endangered, critically endangered. Each reassessment is also, often, a new estimate of how many individuals actually remain in the wild.
>
> This page follows a handful of emblematic species through these successive reassessments, each one represented by a crowd of icons that grows or shrinks over time. The story isn't one-directional : alongside the decline of the vaquita or the European hamster, the giant panda and the mountain gorilla show that recovery remains possible.

## Objectif

Faire voir, à travers une sélection d'espèces emblématiques, comment leur population évolue réellement au fil des réévaluations de la Liste rouge de l'UICN, sans présumer d'un déclin systématique.

## Contenu (zone de montage)

- Petits multiples : une carte par espèce retenue (voir "Sélection des espèces" dans `data-model.md`), chacune affichant une foule d'icônes représentant sa population.
- Sur chaque carte : nom de l'espèce, année de réévaluation simulée en cours, catégorie de menace en toutes lettres.
- Contrôles de lecture partagés entre toutes les cartes : Play/Pause, Rejouer.

## Composition

Chaque espèce dans son propre cadre, à sa propre échelle d'icônes (une icône représentant un nombre d'individus propre à chaque espèce, voir "Rendu" dans `technical-specifications.md`), décision explicite de l'utilisateur (voir échanges de cadrage) : les populations varient de quelques dizaines à plusieurs milliers d'individus selon l'espèce, une échelle unique aurait rendu les espèces les plus rares invisibles à côté des plus nombreuses.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page, comme `glacier-retreat`. Passage unique de la réévaluation la plus ancienne (toutes espèces confondues) à la plus récente, pas de bouclage automatique.
- **Play/Pause :** interrompt ou reprend l'animation à l'instant simulé courant, partagé entre toutes les cartes (une seule chronologie commune, pas une par espèce).
- **Rejouer :** n'apparaît qu'une fois l'animation arrivée à son terme ; relance un passage complet.
- **Survol/tap d'une carte d'espèce :** fiche de détail (catégorie de menace exacte, estimation de population de l'année simulée courante avec sa date réelle de réévaluation, tendance depuis la réévaluation précédente).
- **Pas de filtre, pas de zoom/pan :** contrairement aux visualisations à carte réelle du site, celle-ci n'est pas une carte géographique (voir "Rendu" dans `technical-specifications.md`) : un petit nombre d'espèces, toutes visibles en permanence.
- **Vue initiale :** toutes les cartes à leur réévaluation la plus ancienne, lecture automatique déjà en cours.

## États

- **Chargement :** le temps que le JSON des espèces soit récupéré et que les cartes s'initialisent ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de cartes vides silencieuses.
- **Vide :** sans objet ici (le nombre d'espèces est fixe et restreint, pas de filtre pouvant réduire l'affichage à rien).

## Responsive

- Contrôles de lecture repositionnés sous les cartes plutôt qu'en surimpression.
- Petits multiples empilés verticalement plutôt qu'en grille sur petit écran, une carte par ligne.
- Fiche de détail au tap sur une carte plutôt qu'au survol.

## Accessibilité (limite connue)

La fiche de détail par carte (survol/tap) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Les boutons Play/Pause et Rejouer restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms scientifiques d'espèces ne sont pas affichés directement dans l'interface (seuls les noms communs localisés le sont, voir `data-model.md`) ; pas de contenu non traduit à signaler au-delà des règles générales.
