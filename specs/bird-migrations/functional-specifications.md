# Spécification fonctionnelle : Les routes de migration

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

Révisé à l'implémentation pour rester honnête sur ce que montre réellement la visualisation, plutôt que la formulation d'origine du draft ("milliers d'oiseaux") qui décrivait le phénomène général plutôt que le contenu réel de la carte ; révisé encore à chaque ajout d'espèce (busard cendré, coucou gris, puis bondrée apivore, voir "Historique" dans `data-model.md`).

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les routes de migration | Les trajectoires GPS réelles de cigognes, busards et coucous suivis individuellement entre l'Europe et l'Afrique. |
| EN | The Migration Routes | The real GPS trajectories of individually-tracked storks, harriers and cuckoos between Europe and Africa. |

Le titre et le résumé n'ont pas été retouchés à l'ajout de la bondrée (quatrième espèce) : "cigognes, busards et coucous" reste une formule éditoriale ouverte plutôt qu'une liste exhaustive, et rester correct texte par texte à chaque ajout d'espèce n'apporte rien de plus qu'un examen ponctuel occasionnel.

**Présentation longue FR :**
> Chaque année, des rapaces, des cigognes et d'autres oiseaux équipés de balises GPS quittent l'Europe pour rejoindre l'Afrique, avant d'effectuer le trajet inverse au printemps. Cette carte anime les trajectoires réelles d'individus suivis dans le cadre de quatre études scientifiques : la cigogne blanche (*Ciconia ciconia*, étude « LifeTrack White Stork Bavaria », Institut Max Planck du comportement animal, 2014-2023), le busard cendré (*Circus pygargus*, Trierweiler et al. 2014), le coucou gris (*Cuculus canorus*, Thorup et al. 2020) et la bondrée apivore (*Pernis apivorus*, Byholm et al. 2025).
>
> Chaque ligne est le voyage réel d'un oiseau, reconstitué à partir de ses positions GPS ou satellite. Les trajectoires révèlent des stratégies et des couloirs très différents selon les espèces : certains oiseaux rejoignent l'Afrique australe en quelques mois, d'autres s'arrêtent bien plus au nord ; le coucou gris emprunte une route en boucle vers l'ouest à travers le Sahel, documentée ici avec un jeu de données plus clairsemé (balises satellite à faible fréquence) que celui des autres espèces ; la bondrée apivore, elle, passe parfois près d'une année entière quasi immobile sur son site d'hivernage avant de repartir.

**Présentation longue EN :**
> Every year, GPS-tagged raptors, storks and other birds leave Europe for Africa, before making the return trip in spring. This map animates the real trajectories of individuals tracked as part of four scientific studies: the white stork (*Ciconia ciconia*, "LifeTrack White Stork Bavaria" study, Max Planck Institute of Animal Behavior, 2014-2023), Montagu's harrier (*Circus pygargus*, Trierweiler et al. 2014), the common cuckoo (*Cuculus canorus*, Thorup et al. 2020) and the European honey buzzard (*Pernis apivorus*, Byholm et al. 2025).
>
> Each line is the real journey of a bird, reconstructed from its GPS or satellite positions. The trajectories reveal very different strategies and corridors depending on the species: some birds reach southern Africa within a few months, others stop much further north; the common cuckoo takes a looping route west across the Sahel, documented here with a sparser dataset (low-frequency satellite tags) than the other species; the honey buzzard sometimes stays nearly motionless at its wintering site for almost a full year before setting off again.

## Objectif

Faire voir, par l'animation de trajectoires GPS réelles, les couloirs de migration entre l'Europe et l'Afrique, et la diversité des stratégies selon les espèces.

## Contenu (zone de montage)

- Carte illustrée Europe/Afrique (silhouette, pas de fond de tuiles, voir `technical-specifications.md`).
- Contrôles sur deux lignes : le filtre espèce seul sur la première ; le filtre direction, puis un séparateur visuel (`|`), puis la bascule de vue et les contrôles de lecture (en vue animée) sur la seconde.
- Filtre par espèce (toggle multi-sélection).
- Filtre par direction (Automne / Printemps / Les deux).
- Bascule de vue (Animée / Statique).
- Contrôles de lecture, uniquement en vue animée : bouton Play/Pause, indicateur de la date simulée en cours, sélecteur de vitesse (Lent / Normal / Rapide).
- Tooltip contextuel au survol/tap d'une trajectoire.

## Interactions

- **Filtre espèce :** toggle multi-sélection, un bouton par espèce (couleur + nom commun localisé), tous actifs par défaut ("Toutes les espèces"). Désactiver une espèce retire ses trajectoires de la vue courante (animée ou statique), sans redémarrer l'animation. Quatre espèces (cigogne blanche, busard cendré, coucou gris, bondrée apivore, voir "Sélection des études" dans `data-model.md`) ; le filtre reste construit dynamiquement à partir des données pour accueillir d'autres espèces sans changement de code.
- **Filtre direction :** Automne / Printemps / Les deux, "Les deux" par défaut. Partagé entre les deux vues (voir "Bascule de vue" ci-dessous).
  - En vue animée, "Les deux" rejoue un cycle calendaire unique (janvier à décembre) où les trajectoires d'automne et de printemps apparaissent chacune à leur période réelle de l'année : la scène montre l'aller-retour complet dans un seul cycle, pas deux lectures séquentielles.
- **Bascule de vue (Animée / Statique) :** "Animée" par défaut (voir "Vue initiale" ci-dessous).
  - **Vue statique :** chaque trajectoire active (mêmes filtres espèce/direction que la vue animée) est dessinée en entier d'un coup, du premier au dernier point, plutôt que comme un point qui progresse dans le temps. Trait plein pour les trajectoires d'automne, pointillé pour celles de printemps (les deux directions d'un même individu se superposent souvent presque exactement une fois tracées en entier ; le pointillé les distingue sans casser le code couleur par espèce). Les contrôles de lecture (Play/Pause, vitesse, date simulée) disparaissent, sans objet dans cette vue ; l'animation est interrompue (pas de calcul ni de rendu en tâche de fond) tant que la vue statique est active.
  - Changer de vue conserve les filtres espèce/direction et le niveau de zoom/pan courants.
- **Lecture automatique (vue animée) :** l'animation démarre dès le chargement de la page et boucle en continu, sans action du visiteur (décision explicite, voir échanges de cadrage). Le bouton Play/Pause permet de l'interrompre à tout moment (voir "Accessibilité" ci-dessous : nécessaire pour un contenu qui bouge en continu sans intervention).
- **Vitesse (vue animée) :** sélecteur Lent / Normal / Rapide, "Normal" par défaut (cycle annuel complet en 36 secondes, soit ~3 secondes par mois de migration simulé). Lent = ×0,5 (72 secondes le cycle), Rapide = ×2 (18 secondes).
- **Survol / tap d'une trajectoire :** surlignage de la trajectoire de l'individu, tooltip avec l'espèce, l'identifiant anonymisé ("Individu CC_001"), la distance totale parcourue (km) et la durée de la migration (jours), voir "Champs dérivés côté client" dans `data-model.md`. Fonctionne dans les deux vues : en vue animée, seule la tête mobile de la trajectoire déclenche le tooltip ; en vue statique, n'importe quel point du tracé complet le déclenche (plus facile à cibler, puisque tout le trajet est visible en permanence).
- **Zoom / pan :** sur la zone Europe/Afrique illustrée (pas de panoramique libre au-delà). Partagé entre les deux vues.
- **Vue initiale :** zone Europe/Afrique entière visible, toutes espèces actives, direction "Les deux", vue "Animée" avec animation déjà en cours.

## États

- **Chargement :** le temps que le JSON des trajectoires et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** combinaison espèce(s) + direction sans aucune trajectoire disponible (ex. une espèce sans données de printemps dans l'étude retenue) → message l'indiquant plutôt qu'une carte sans trajectoires sans explication.

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- Pan/zoom de la carte au geste tactile.
- Tooltip et surlignage au tap sur une trajectoire plutôt qu'au survol.
- Contrôles (filtres, sélecteur de vitesse) repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des trajectoires) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le bouton Play/Pause (voir "Interactions") reste néanmoins accessible au clavier (élément `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms scientifiques d'espèces ne sont pas affichés directement dans l'interface (seuls les noms communs localisés le sont, voir `data-model.md`) ; pas de contenu non traduit à signaler au-delà des règles générales.
