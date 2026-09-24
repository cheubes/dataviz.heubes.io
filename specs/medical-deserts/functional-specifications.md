# Spécification fonctionnelle : Le désert médical de demain

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : implémenté.**

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le désert médical de demain | Trente-quatre mille sept cent vingt-huit communes, deux cartes en une : l'accès aux médecins généralistes aujourd'hui, et ce qu'il devient sans ceux qui partent bientôt à la retraite. |
| EN | Tomorrow's Medical Desert | Thirty-four thousand seven hundred and twenty-eight communes, two maps in one: access to general practitioners today, and what it becomes without those about to retire. |

**Présentation longue FR (proposition) :**
> L'accessibilité potentielle localisée (APL) mesure, commune par commune, le nombre de consultations de médecine générale réellement accessibles par habitant et par an. Calculé chaque année par la DREES, cet indicateur existe aussi dans une version restreinte aux médecins de moins de soixante-cinq ans : une photographie de ce que deviendrait l'accès aux soins si les praticiens les plus proches de la retraite cessaient leur activité.
>
> Cette carte fait basculer la France entière d'un état à l'autre. Certaines communes ne bougent presque pas ; d'autres, dont l'accès aux soins ne tient aujourd'hui qu'à un seul médecin âgé, basculent d'un coup dans le désert médical.

**Présentation longue EN (proposition) :**
> The APL indicator (accessibilité potentielle localisée) measures, commune by commune, the number of general practitioner consultations actually accessible per resident per year. Calculated annually by DREES, this indicator also exists in a version restricted to doctors under sixty-five: a snapshot of what healthcare access would become if the practitioners closest to retirement stopped working.
>
> This map switches the whole of France from one state to the other. Some communes barely move; others, whose access to care today hinges on a single aging doctor, fall into medical desert territory overnight.

## Objectif

Faire voir, sur une carte réelle des communes de France métropolitaine, l'écart entre l'accès actuel aux médecins généralistes et l'accès une fois les praticiens proches de la retraite partis.

## Contenu (zone de montage)

- Carte choroplèthe de la France métropolitaine, une forme par commune (34 728, dont Paris, Lyon et Marseille agrégées depuis leurs arrondissements, voir "Jointure" dans `data-model.md`), colorée selon son niveau d'APL (voir "Palette" dans `technical-specifications.md`).
- Bascule "Aujourd'hui" / "Sans les médecins de 65 ans et plus", qui recolore l'ensemble de la carte.
- Légende de la palette séquentielle, avec l'intitulé de la mesure ("APL (consultations accessibles par habitant et par an)") pour que l'échelle reste compréhensible indépendamment du texte de présentation.
- Fiche de détail au survol/tap d'une commune (nom, département, APL actuel, APL sans les 65 ans et plus, population).

## Interactions

- **Bascule aujourd'hui/demain :** un contrôle (bouton à deux états) recolore l'ensemble de la carte entre les deux valeurs d'APL, avec une transition de couleur animée courte plutôt qu'un changement instantané (voir "Rendu" dans `technical-specifications.md`) — pour que le visiteur voie les communes concernées basculer, pas seulement constater un état différent.
- **Survol/tap d'une commune :** fiche de détail avec les deux valeurs d'APL, quel que soit l'état de la bascule (les deux chiffres restent visibles ensemble dans la fiche, pas seulement celui actuellement affiché sur la carte).
- **Zoom/pan :** libre sur la carte (souris/molette, tactile), nécessaire pour distinguer les communes dans les zones denses (agglomérations).
- **Pas de filtre par département/région :** l'ensemble du territoire reste visible en permanence, le zoom suffit à explorer une zone précise.
- **Vue initiale :** France métropolitaine entière visible, état "Aujourd'hui" de la bascule.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : l'état de la bascule et le cadrage sont restaurés. Un lien pris sur l'état "Sans les médecins de 65 ans et plus" ouvre directement la carte dans cet état, sans rejouer le fondu de la bascule.
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : les boutons de zoom recadrent la carte sans animation. Le fondu entre les cartes "aujourd'hui" et "demain" est conservé : il change l'opacité sans rien déplacer.

## États

- **Chargement :** le temps que `communes.json` soit récupéré et que la carte s'initialise ; zone de montage réservée sans saut de mise en page. Fichier volumineux (9,0 Mo, 2,3 Mo compressé, voir "Poids du fichier" dans `data-model.md`) : un indicateur de progression du chargement (pourcentage, lecture du flux réseau) est affiché pendant le téléchargement, dans l'esprit de `paris-trees`.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet ici (pas de filtre pouvant réduire l'affichage à rien).

## Responsive

- Pan/zoom au geste tactile, fiche de détail au tap sur une commune plutôt qu'au survol.
- Bascule et légende repositionnées sous la carte plutôt qu'en surimpression.

## Accessibilité (limite connue)

L'interaction principale (carte choroplèthe, zoom/pan, survol des communes) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, sans repli, conformément à la règle par défaut du projet. La bascule aujourd'hui/demain reste accessible au clavier (élément natif standard).

## Contenu non traduit

Les noms de communes et de départements restent identiques dans les deux langues (noms propres) ; pas de contenu non traduit à signaler au-delà des règles générales.
