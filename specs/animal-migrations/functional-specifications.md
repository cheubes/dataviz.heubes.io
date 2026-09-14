# Spécification fonctionnelle : Les grandes migrations

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les grandes migrations | Un planisphère animé, trois stratégies radicalement différentes : la traversée solitaire d'un océan, la boucle sans fin d'un troupeau, le relais silencieux de plusieurs générations. |
| EN | The Great Migrations | An animated world map, three radically different strategies : the solitary crossing of an ocean, the endless loop of a herd, the silent relay across several generations. |

**Présentation longue FR (proposition) :**
> Migrer ne veut pas dire la même chose pour tout le monde. Une baleine traverse seule un océan entier, entre ses zones d'alimentation polaires et ses zones de reproduction tropicales. Un gnou du Mara ne va nulle part en particulier : il suit les pluies, dans une boucle continue au sein d'un même territoire, saison après saison. Un papillon monarque, lui, ne fait jamais le trajet complet : la migration qui le porte du Mexique jusqu'au Canada et retour est un relais entre plusieurs générations successives, dont aucune ne connaît le point de départ ni le point d'arrivée du voyage entier.
>
> Ce planisphère réunit ces trois stratégies, reconstituées à partir de vraies données : les trajectoires GPS/Argos individuelles de baleines à bosse et de baleines bleues, celles de gnous suivis dans l'écosystème Serengeti-Mara, et des millions d'observations citoyennes de monarques qui, mises bout à bout, dessinent la vague de la migration sans qu'aucun individu ne l'ait vécue en entier.

**Présentation longue EN (proposition) :**
> Migrating doesn't mean the same thing for every species. A whale crosses an entire ocean alone, between its polar feeding grounds and its tropical breeding grounds. A wildebeest in the Mara isn't heading anywhere in particular : it follows the rains, in a continuous loop within a single territory, season after season. A monarch butterfly never makes the full journey : the migration that carries it from Mexico to Canada and back is a relay across several successive generations, none of which knows the journey's starting point or its destination.
>
> This world map brings these three strategies together, reconstructed from real data : the individual GPS/Argos trajectories of humpback and blue whales, those of wildebeest tracked in the Serengeti-Mara ecosystem, and millions of citizen observations of monarchs that, put end to end, trace the wave of migration that no single individual ever lived through in full.

## Objectif

Faire voir, sur un seul planisphère animé au long d'un cycle calendaire, trois stratégies de migration animale radicalement différentes : la traversée océanique individuelle, la boucle continue au sein d'un écosystème, et le relais collectif multigénérationnel.

## Contenu (zone de montage)

- Planisphère illustré (silhouette terrestre mondiale, cours d'eau et relief, voir "Rendu" dans `technical-specifications.md`).
- Trajectoires animées des baleines et des gnous (un trait par individu, tête mobile).
- Densité d'observations du monarque, variant par mois (voir "Rendu" dans `technical-specifications.md`).
- Filtre par espèce (toggle multi-sélection, voir "Interactions" ci-dessous).
- Indicateur du mois simulé en cours.
- Contrôles de lecture : Play/Pause, sélecteur de vitesse (Lent / Normal / Rapide).
- Tooltip contextuel au survol/tap.

## Interactions

- **Filtre espèce :** toggle multi-sélection, une entrée par espèce (couleur + nom commun localisé), toutes actives par défaut. Désactiver une espèce retire ses trajectoires ou sa densité de la vue courante, sans redémarrer l'animation. Permet d'isoler un seul phénomène à la fois (voir échanges de cadrage : les trois types ont des échelles géographiques très différentes, un océan entier contre une région d'Afrique de l'Est contre un continent).
- **Lecture automatique :** démarre dès le chargement de la page et boucle en continu, comme `bird-migrations` (pas de notion de direction à alterner, voir "Pas de notion de direction" dans `data-model.md`, le cycle rejoue simplement l'année simulée en continu).
- **Vitesse :** Lent / Normal / Rapide, mêmes facteurs que `bird-migrations` (×0,5 / ×1 / ×2).
- **Survol/tap d'une trajectoire** (baleine, gnou) : surlignage, tooltip avec l'espèce, l'identifiant anonymisé, la distance totale parcourue et la durée couverte par les données.
- **Survol/tap d'une zone de densité** (monarque) : tooltip indiquant le volume relatif d'observations à cette période de l'année à cet endroit, pas de fiche individuelle (aucun individu à identifier, voir "Trois mécaniques de données distinctes" dans `data-model.md`).
- **Zoom/pan :** libre sur l'ensemble du planisphère (souris/molette, tactile) — nécessaire ici plus encore que sur `bird-migrations` pour passer d'une vue mondiale à un phénomène régional (Amérique du Nord pour le monarque, par exemple).
- **Vue initiale :** planisphère entier visible, toutes les espèces actives, lecture automatique déjà en cours.

## États

- **Chargement :** le temps que le JSON des trajectoires/densités et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de carte vide silencieuse.
- **Vide :** toutes les espèces désactivées via le filtre → planisphère sans phénomène affiché, message neutre le rappelant plutôt qu'une carte sans explication.

## Responsive

Même traitement que `bird-migrations` (voir "Responsive" dans son `functional-specifications.md`) : pan/zoom au geste tactile, tooltip et surlignage au tap, filtre/contrôles repositionnés pour rester utilisables sur petit écran.

## Accessibilité (limite connue)

L'interaction principale (planisphère animé, zoom/pan, survol des trajectoires et zones de densité) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet. Le bouton Play/Pause et le filtre par espèce restent accessibles au clavier (éléments `<button>` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention et de filtrer sans dépendre de la carte animée elle-même.

## Contenu non traduit

Les noms scientifiques d'espèces ne sont pas affichés directement dans l'interface (seuls les noms communs localisés le sont, voir `data-model.md`), même convention que `bird-migrations` : pas de contenu non traduit à signaler au-delà des règles générales.
