# Spécification fonctionnelle : Ce qu'il en reste

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Ce qu'il en reste | Six espèces emblématiques, une foule d'icônes qui s'amenuise ou se reconstitue, recensement après recensement. |
| EN | What's Left | Six emblematic species, a crowd of icons that shrinks or rebuilds, census after census. |

**Présentation longue FR (proposition) :**
> Tigre, rhinocéros noir, panda géant, gorille des montagnes, vaquita, grand hamster d'Alsace : ces espèces emblématiques sont suivies depuis des décennies par des organismes de conservation qui en recensent régulièrement la population sauvage. Chaque nouveau recensement est une estimation, parfois précise à quelques individus près, du nombre réel qu'il en reste à l'état sauvage.
>
> Cette page suit ces espèces à travers leurs recensements successifs, chacune représentée par une foule d'icônes qui grandit ou rétrécit au fil du temps. Le récit n'est pas univoque : à côté du déclin de la vaquita ou du grand hamster d'Alsace, le panda géant et le gorille des montagnes montrent qu'un rétablissement reste possible.

**Présentation longue EN (proposition) :**
> Tiger, black rhinoceros, giant panda, mountain gorilla, vaquita, European hamster: these emblematic species have been tracked for decades by conservation bodies that regularly survey their wild population. Each new census is an estimate, sometimes accurate to within a handful of individuals, of how many actually remain in the wild.
>
> This page follows these species through their successive censuses, each one represented by a crowd of icons that grows or shrinks over time. The story isn't one-directional: alongside the decline of the vaquita or the European hamster, the giant panda and the mountain gorilla show that recovery remains possible.

## Objectif

Faire voir, à travers une sélection d'espèces emblématiques, comment leur population évolue réellement au fil des recensements successifs menés par les organismes qui les suivent, sans présumer d'un déclin systématique.

## Contenu (zone de montage)

- Contrôles de lecture, au-dessus des petits multiples (jamais en surimpression, revu après retour utilisateur, voir "Responsive" ci-dessous), partagés entre toutes les cartes : Play/Pause, sélecteur de vitesse, curseur d'année (l'année simulée courante s'y lit déjà, retirée des cartes elles-mêmes après retour utilisateur : voir échanges de cadrage).
- Petits multiples : une carte par espèce retenue (voir "Sélection des espèces" dans `data-model.md`), chacune affichant son nom et une foule d'icônes représentant sa population, de taille fixe (voir "Rendu" dans `technical-specifications.md`).

## Composition

Chaque espèce dans son propre cadre, à sa propre échelle d'icônes (une icône représentant un nombre d'individus propre à chaque espèce, voir "Rendu" dans `technical-specifications.md`), décision explicite de l'utilisateur (voir échanges de cadrage) : les populations varient de quelques dizaines à plusieurs milliers d'individus selon l'espèce, une échelle unique aurait rendu les espèces les plus rares invisibles à côté des plus nombreuses. Cartes de taille fixe (voir "Rendu" dans `technical-specifications.md`), pas de hauteur variable selon le nombre d'icônes affichées.

## Interactions

- **Lecture automatique en boucle :** démarre dès le chargement de la page et boucle en continu sur l'ensemble de la période couverte, comme `bird-migrations`/`satellites-in-orbit`/`light-pollution` — pas un passage unique avec état final figé (revu après retour utilisateur, voir échanges de cadrage : la version initiale s'arrêtait au point de mesure le plus récent).
- **Play/Pause :** interrompt ou reprend la lecture à l'instant simulé courant, partagé entre toutes les cartes (une seule chronologie commune, pas une par espèce).
- **Vitesse :** Lent/Normal/Rapide, même convention que `light-pollution`/`satellites-in-orbit`.
- **Curseur d'année :** `<input type="range">` natif, sur le domaine `[point de mesure le plus ancien toutes espèces confondues, point de mesure le plus récent]`, pilotable manuellement ou automatiquement ; le déplacer manuellement met la lecture automatique en pause, même convention que `light-pollution`.
- **Survol/tap d'une carte d'espèce :** fiche de détail (estimation de population de l'année simulée courante avec sa date réelle de mesure, tendance depuis le point de mesure précédent).
- **Pas de filtre, pas de zoom/pan :** contrairement aux visualisations à carte réelle du site, celle-ci n'est pas une carte géographique (voir "Rendu" dans `technical-specifications.md`) : un petit nombre d'espèces, toutes visibles en permanence.
- **Vue initiale :** toutes les cartes à leur point de mesure le plus ancien, lecture automatique déjà en cours.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : une année choisie (pause ou curseur) est restaurée, les cartes s'ouvrant alors en pause sur cette année.
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : les petits multiples s'ouvrent en pause sur la dernière année, celle des recensements les plus récents.

## États

- **Chargement :** le temps que le JSON des espèces soit récupéré et que les cartes s'initialisent ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de cartes vides silencieuses.
- **Vide :** sans objet ici (le nombre d'espèces est fixe et restreint, pas de filtre pouvant réduire l'affichage à rien).

## Responsive

- Contrôles de lecture toujours au-dessus des petits multiples, jamais en surimpression (décision explicite de l'utilisateur, voir échanges de cadrage, même parti pris que `light-pollution`) : aucun repositionnement nécessaire, ils s'enchaînent normalement dans le flux de la page à toutes les tailles d'écran, la ligne Play/Pause + vitesse passant simplement au-dessus du curseur d'année sur les écrans étroits.
- Petits multiples empilés verticalement plutôt qu'en grille sur petit écran, une carte par ligne.
- Fiche de détail au tap sur une carte plutôt qu'au survol.

## Accessibilité (limite connue)

La fiche de détail par carte (survol/tap) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le bouton Play/Pause et le curseur d'année restent accessibles au clavier (éléments `<button>`/`<input type="range">` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms scientifiques d'espèces ne sont pas affichés directement dans l'interface (seuls les noms communs localisés le sont, voir `data-model.md`) ; pas de contenu non traduit à signaler au-delà des règles générales.
