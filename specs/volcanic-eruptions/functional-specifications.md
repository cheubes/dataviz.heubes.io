# Spécification fonctionnelle : Le pouls du globe

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : implémenté.**

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le pouls du globe | Dix mille ans d'éruptions volcaniques rejouées en boucle : la Terre n'a jamais cessé de trembler, la ceinture de feu à peine visible au repos. |
| EN | The Pulse of the Earth | Ten thousand years of volcanic eruptions replayed on a loop: the Earth has never stopped shaking, the ring of fire barely visible at rest. |

**Présentation longue FR :**
> Le Global Volcanism Program de la Smithsonian Institution recense chaque éruption volcanique connue depuis le début de l'Holocène, il y a environ dix mille ans : mille deux cent quatorze volcans, plus de onze mille éruptions documentées, de l'observation directe la plus récente à la trace géologique la plus ancienne.
>
> Ce planisphère fait pulser chaque volcan au moment réel de ses éruptions, rejouées en boucle continue sur l'ensemble de la période. Le rythme s'accélère nettement à mesure que la lecture approche du présent : en partie parce que le volcanisme s'est réellement concentré à certaines périodes, mais aussi, pour une large part, parce que les éruptions récentes sont bien mieux documentées que celles d'il y a plusieurs millénaires, un biais du catalogue à garder à l'esprit plutôt qu'une accélération univoque du phénomène lui-même.

**Présentation longue EN :**
> The Smithsonian Institution's Global Volcanism Program records every known volcanic eruption since the start of the Holocene, roughly ten thousand years ago: one thousand two hundred and fourteen volcanoes, over eleven thousand documented eruptions, from the most recent direct observation to the oldest geological trace.
>
> This world map makes every volcano pulse at the real moment of its eruptions, replayed on a continuous loop across the whole period. The pace clearly picks up as the playback nears the present: partly because volcanism has genuinely clustered in certain periods, but largely because recent eruptions are far better documented than those from several millennia ago, a bias in the catalog worth keeping in mind, not a one-directional acceleration of the phenomenon itself.

## Objectif

Faire voir, sur un planisphère animé en boucle continue sur dix mille ans, le rythme réel des éruptions volcaniques mondiales et leur concentration géographique, tout en donnant à comprendre le biais de complétude du catalogue sur lequel elle repose.

## Contenu (zone de montage)

- Planisphère illustré (silhouette terrestre mondiale, cours d'eau et relief, voir "Rendu" dans `technical-specifications.md`).
- Chaque volcan pulse (bref halo qui s'étend et s'estompe) au moment simulé de chacune de ses éruptions réelles, taille et intensité du pulse liées à l'indice d'explosivité volcanique (VEI).
- Annotation textuelle brève (nom et année) lors du pulse d'une éruption retenue comme notable (voir "Sélection des éruptions à annoter" dans `data-model.md`).
- Indicateur de l'année simulée en cours, doublé d'un curseur d'année natif (`<input type="range">`, granularité annuelle, même modèle que `earthquakes`).
- Contrôles de lecture : Play/Pause, sélecteur de vitesse (Lent / Normal / Rapide), curseur d'année.
- Boutons zoomer/dézoomer/réinitialiser le zoom, en haut à droite du planisphère (mêmes contrôles que `earthquakes`), en complément du zoom/pan à la souris et au tactile.
- Tooltip contextuel au survol/tap d'un volcan (position fixe, à tout moment de la lecture).

## Interactions

- **Lecture automatique en boucle :** démarre dès le chargement de la page et boucle en continu sur l'ensemble de la période couverte (dix mille ans), comme `bird-migrations` — pas un passage unique avec état final figé, à la différence de `monument-layers`/`glacier-retreat`/`endangered-species` (voir "Angle retenu" dans `data-model.md`).
- **Play/Pause :** interrompt ou reprend la lecture à l'instant simulé courant.
- **Vitesse :** Lent / Normal / Rapide, mêmes facteurs que `bird-migrations` (×0,5 / ×1 / ×2).
- **Curseur d'année :** pilotable manuellement (interrompt la lecture automatique, comme un appui sur Pause) ou automatiquement (suit la lecture en cours). Sauter à une année efface les pulses en cours sans en afficher de figés pour cette année : seuls ceux déclenchés à la reprise de la lecture apparaissent. Les volcans au repos et leur fiche de détail restent disponibles.
- **Survol/tap d'un volcan :** fiche de détail (nom, localisation, nombre total d'éruptions recensées sur la période, éruption la plus récente, VEI maximal atteint) — accessible à tout moment, indépendamment du fait que le volcan pulse ou non à l'instant simulé courant.
- **Zoom/pan :** libre sur l'ensemble du planisphère (souris/molette, tactile, boutons zoomer/dézoomer/réinitialiser), utile pour distinguer les volcans rapprochés le long d'une même ceinture (Indonésie, Japon, Amérique centrale notamment).
- **Vue initiale :** planisphère entier visible, lecture automatique déjà en cours, quelque part dans le cycle (pas nécessairement au tout début des dix mille ans).
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : l'année et le cadrage sont restaurés. Comme pour `earthquakes`, une année partagée relance la lecture à partir de cette année au lieu de figer la carte en pause, puisqu'une image en pause ne montrerait que les volcans au repos, identiques à toute année (voir "État dans l'URL" dans `technical-specifications.md`).

## États

- **Chargement :** le temps que le JSON des volcans/éruptions et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet ici (le catalogue reste fixe, pas de filtre pouvant réduire l'affichage à rien).

## Responsive

Même traitement que `bird-migrations`/`monarch-migration` (voir "Responsive" dans leurs `functional-specifications.md` respectifs) : pan/zoom au geste tactile, tooltip et fiche de détail au tap, contrôles repositionnés pour rester utilisables sur petit écran.

## Accessibilité (limite connue)

L'interaction principale (planisphère animé, zoom/pan, survol des volcans) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. Le bouton Play/Pause reste accessible au clavier (élément `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention.

## Contenu non traduit

Les noms de volcans restent identiques ou quasi identiques dans les deux langues dans la plupart des cas (noms propres). Le pays affiché dans la fiche de détail (`Country` du GVP, voir "Champs source utilisés" dans `data-model.md`) reste en anglais dans les deux langues, comme les noms de volcans : c'est une donnée source du catalogue, pas un texte éditorial du site, même traitement que les autres champs non traduits.
