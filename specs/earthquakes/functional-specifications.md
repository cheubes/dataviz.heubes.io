# Spécification fonctionnelle : Les lignes de faille

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : implémenté.**

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les lignes de faille | Plus d'un siècle de séismes majeurs rejoués en boucle : leurs pulses dessinent, sans qu'on ait besoin de le dire, les frontières des plaques tectoniques. |
| EN | The Fault Lines | Over a century of major earthquakes replayed on a loop : their pulses trace, without needing to be told to, the boundaries of the tectonic plates. |

**Présentation longue FR (proposition) :**
> Depuis le début du vingtième siècle, les sismographes du monde entier enregistrent avec précision la magnitude et la position de chaque séisme majeur. Ce planisphère rejoue, en boucle continue, plus d'un siècle de ces séismes (magnitude 6 et plus), chacun pulsant au moment réel de sa survenue.
>
> En arrière-plan, une fine ligne trace les frontières connues des plaques tectoniques, établies indépendamment par la géophysique. Les deux ne se recoupent pas par hasard : la quasi-totalité des séismes majeurs se concentre le long de ces frontières, la preuve la plus visible et la plus continue du mouvement des plaques qui composent la croûte terrestre.

**Présentation longue EN (proposition) :**
> Since the early twentieth century, seismographs worldwide have precisely recorded the magnitude and location of every major earthquake. This world map replays, on a continuous loop, over a century of these earthquakes (magnitude 6 and above), each pulsing at the real moment it occurred.
>
> In the background, a thin line traces the known boundaries of the tectonic plates, established independently through geophysics. The two aren't a coincidence : nearly all major earthquakes cluster along these boundaries, the most visible and continuous evidence of the plates that make up the Earth's crust moving against one another.

## Objectif

Faire voir, sur un planisphère animé en boucle continue depuis 1900, comment les séismes majeurs se concentrent le long des frontières de plaques tectoniques, révélant cette structure géologique par la seule densité des événements réels.

## Contenu (zone de montage)

- Planisphère illustré (silhouette terrestre mondiale, cours d'eau et relief, voir "Rendu" dans `technical-specifications.md`), avec les frontières de plaques tectoniques tracées en superposition statique.
- Chaque séisme pulse (bref halo qui s'étend et s'estompe) au moment simulé de sa survenue réelle, taille et intensité du pulse liées à la magnitude.
- Annotation textuelle brève (nom et année) lors du pulse d'un séisme retenu comme notable (voir "Sélection des séismes à annoter" dans `data-model.md`).
- Indicateur de l'année simulée en cours, doublé d'un curseur d'année natif (`<input type="range">`, granularité annuelle, ajouté après la première implémentation sur le modèle de `monument-layers`/`satellites-in-orbit`).
- Contrôles de lecture : Play/Pause, sélecteur de vitesse (Lent / Normal / Rapide), curseur d'année.
- Boutons zoomer/dézoomer/réinitialiser le zoom, en haut à droite du planisphère (mêmes contrôles que `monument-layers`/`paris-trees`), en complément du zoom/pan à la souris et au tactile.
- Tooltip contextuel au survol/tap.

## Interactions

Mêmes interactions que `volcanic-eruptions` (voir son `functional-specifications.md`), appliquées aux séismes :

- **Lecture automatique en boucle**, dès le chargement, sur l'ensemble de la période couverte (depuis 1900 environ).
- **Play/Pause**, **vitesse** (Lent / Normal / Rapide).
- **Curseur d'année** : pilotable manuellement (interrompt la lecture automatique, comme un appui sur Pause) ou automatiquement (suit la lecture en cours). Un séisme n'étant pas un point permanent, sauter à une année donnée n'affiche rien de figé pour cette année : seuls les pulses déclenchés après ce saut, à la reprise de la lecture, apparaissent (voir "Rendu" dans `technical-specifications.md`).
- **Survol/tap d'un point** : fiche de détail (lieu, magnitude, profondeur, date) — les points sismiques n'étant pas des positions fixes répétées comme les volcans (chaque séisme est un événement unique, pas un lieu qui pulse plusieurs fois), la fiche de détail n'est disponible qu'au moment du pulse ou juste après (voir "Rendu" dans `technical-specifications.md` pour la durée de rémanence), pas en permanence comme les volcans de `volcanic-eruptions`.
- **Zoom/pan** libre sur l'ensemble du planisphère (souris/molette, tactile), doublé de boutons zoomer/dézoomer/réinitialiser pour les visiteurs sans molette ni geste tactile.
- **Vue initiale :** planisphère entier visible, frontières de plaques visibles, lecture automatique déjà en cours.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : l'année et le cadrage sont restaurés. Une année partagée relance la lecture à partir de cette année au lieu de figer la carte en pause, puisqu'une image en pause n'aurait aucun séisme à montrer (voir "État dans l'URL" dans `technical-specifications.md`).

## États

- **Chargement :** le temps que le JSON des séismes/frontières de plaques et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet ici (le catalogue reste fixe, pas de filtre pouvant réduire l'affichage à rien).

## Responsive

Même traitement que `volcanic-eruptions`/`bird-migrations` (voir "Responsive" dans leurs `functional-specifications.md` respectifs) : pan/zoom au geste tactile, tooltip et fiche de détail au tap, contrôles repositionnés pour rester utilisables sur petit écran.

## Accessibilité (limite connue)

L'interaction principale (planisphère animé, zoom/pan, survol des séismes) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le bouton Play/Pause reste accessible au clavier (élément `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Le lieu d'un séisme (`place`, voir `data-model.md`) n'est disponible qu'en anglais dans la source USGS ; affiché tel quel dans la version française de la page, sans traduction systématique (comparable aux noms de communes ou d'espèces des autres visualisations du site).
