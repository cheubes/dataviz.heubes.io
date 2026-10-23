# Spécification fonctionnelle : Les mondes découverts

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : spécifié, non implémenté.** Plusieurs choix restent à confirmer (voir "Points à valider" dans `technical-specifications.md`).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Les mondes découverts | Plus de six mille planètes confirmées autour d'autres étoiles, apparues année après année depuis 1992 : chaque méthode de détection laisse sa signature dans le nuage, et la place d'une jumelle de la Terre reste presque vide. |
| EN | The Discovered Worlds | More than six thousand confirmed planets around other stars, appearing year after year since 1992: each detection method leaves its own signature in the cloud, and the spot where an Earth twin would sit remains almost empty. |

Thème : `space` (voir "Thème" dans `data-model.md` général). Seule autre visualisation de ce thème à ce stade : `satellites-in-orbit`, qui devient sa visualisation liée.

**Présentation longue FR (proposition) :**
> En 1992, deux planètes sont découvertes autour d'un pulsar, le cadavre d'une étoile. En 1995, une troisième autour d'une étoile semblable au Soleil, 51 Pegasi. Trente ans plus tard, le NASA Exoplanet Archive en recense plus de six mille, toutes confirmées par des publications scientifiques. Ce graphique les fait apparaître année après année, chacune placée selon sa masse et sa distance à son étoile, les planètes du Système solaire servant de repères.
>
> Presque aucune de ces planètes n'a été vue directement, comme on voit Jupiter dans un télescope : chacune a été trahie par un effet indirect, et chaque méthode ne voit qu'une partie des mondes possibles. Le transit, une baisse de lumière quand la planète passe devant son étoile, repère surtout des planètes très proches de leur étoile, et le télescope Kepler en a validé des centaines d'un coup en 2014 et en 2016. La vitesse radiale, le léger balancement de l'étoile, trouve des planètes massives. La microlentille gravitationnelle voit plus loin, l'imagerie directe seulement des géantes très éloignées. Le nuage dessine donc autant les limites de nos instruments que la population réelle des planètes. Et la région où tomberait une jumelle de la Terre, à la bonne distance d'une étoile comme le Soleil, reste presque vide.

**Présentation longue EN (proposition) :**
> In 1992, two planets were found orbiting a pulsar, the remnant of a dead star. In 1995, a third one around a Sun-like star, 51 Pegasi. Thirty years later, the NASA Exoplanet Archive lists more than six thousand, all confirmed in the scientific literature. This chart makes them appear year after year, each placed by its mass and its distance to its star, with the planets of the Solar System as landmarks.
>
> Almost none of these planets has been seen the way we see Jupiter through a telescope: each one was betrayed by an indirect effect, and each method only sees part of the possible worlds. The transit, a dip in light as the planet crosses its star, mostly finds planets very close to their star, and the Kepler telescope validated hundreds of them at once in 2014 and 2016. Radial velocity, the slight wobble of the star, finds massive planets. Gravitational microlensing reaches further out, direct imaging only very distant giants. The cloud therefore draws the limits of our instruments as much as the real population of planets. And the region where an Earth twin would fall, at the right distance from a Sun-like star, remains almost empty.

Chiffres et formulations des deux présentations à relire une fois le fichier de données produit (voir "Mesures" dans `data-model.md`).

## Objectif

Faire voir, par l'accumulation année après année de points dans un plan masse × distance à l'étoile, que chaque méthode de détection occupe sa propre région de ce plan, que les découvertes arrivent par vagues liées aux instruments (Kepler en 2014 et 2016), et que les planètes comparables à celles du Système solaire, la Terre en tête, restent pour l'essentiel hors de portée.

## Contenu (zone de montage)

- **Nuage de points :** un point par planète représentable (6 327, voir "Prétraitement" dans `data-model.md`), abscisse = demi-grand axe (distance moyenne à l'étoile, en unités astronomiques), ordonnée = masse (en masses terrestres), deux axes logarithmiques gradués (voir "Axes" dans `technical-specifications.md`). Couleur selon la famille de méthode de détection. Chaque point apparaît au moment simulé de sa découverte, avec un bref éclat, puis reste en place.
- **Repères du Système solaire :** huit marques fixes (Mercure à Neptune), présentes dès l'ouverture, avec leur nom en étiquette directe, localisé. Visuellement distinctes des exoplanètes (voir "Rendu" dans `technical-specifications.md`), jamais filtrées.
- **Frise des découvertes :** sous le nuage, un histogramme annuel empilé par famille (1992 à 2026), qui se remplit au fil de la lecture et porte un repère de l'année simulée. Il rend visibles les pics de 2014 et 2016 que le nuage seul ne montre que par la densité.
- **Légende des cinq familles** (couleur + nom localisé + nombre de planètes à l'année simulée), doublée d'un filtre interactif (voir "Filtre méthode" ci-dessous).
- **Compteur :** nombre total de planètes confirmées à l'année simulée, parmi les familles actives (voir "Champs dérivés côté client" dans `data-model.md`), avec une mention discrète du nombre de planètes non représentées faute de masse ou de distance connue.
- **Indicateur de l'année simulée**, avec la mention "année en cours" pour la dernière année quand elle est partielle.
- **Contrôles de lecture :** Play/Pause ; vitesse (Lent / Normal / Rapide, Normal par défaut) ; curseur d'année (`<input type="range">`), de 1992 à la dernière année du fichier.
- **Fiche de détail** au survol ou au tap d'un point (voir "Interactions").

## Interactions

- **Lecture automatique :** démarre dès le chargement, en boucle continue, même convention que `satellites-in-orbit` : chaque passage va de 1992 à la dernière année du fichier, marque un temps d'arrêt sur le nuage complet, puis reprend depuis 1992.
- **Play/Pause :** interrompt ou reprend la lecture à l'année simulée courante, temps d'arrêt de fin de passage compris.
- **Vitesse :** Lent / Normal / Rapide, modifie la durée d'un passage (voir "Animation" dans `technical-specifications.md`).
- **Curseur d'année :** un pas par année. Le déplacer (glisser ou clavier) met la lecture en pause et reconstruit immédiatement le nuage et la frise jusqu'à la fin de l'année choisie, y compris en arrière (même convention que `satellites-in-orbit` et `monument-layers`). L'amener à sa valeur maximale déclenche la même pause finale que l'arrivée naturelle de la lecture.
- **Filtre méthode :** légende cliquable, bascule multi-sélection, une entrée par famille, les cinq actives par défaut. Désactiver une famille retire ses points du nuage, sa part de la frise et ses planètes du compteur, sans interrompre la lecture. Isoler une seule famille est la façon la plus directe de voir sa "signature".
- **Survol/tap d'un point :** fiche de détail avec le nom de la planète, l'année de découverte, la méthode, l'instrument ou l'observatoire, la masse (en masses terrestres, et en masses de Jupiter au-delà de 100 masses terrestres) et le demi-grand axe. La nature des valeurs est toujours précisée quand elle n'est pas une mesure directe : "masse minimale", "masse estimée d'après le rayon", "distance calculée d'après la période" (voir "Nature des valeurs" dans `data-model.md`). Le point le plus proche du pointeur est retenu, dans un rayon de quelques pixels ; un point masqué par le filtre n'est jamais ciblé.
- **Survol d'un repère du Système solaire :** sans fiche, l'étiquette directe suffit.
- **Pas de zoom ni de déplacement :** les deux axes logarithmiques couvrent toute l'étendue des données dans une seule vue (voir "Points à valider" dans `technical-specifications.md`).
- **Vue initiale :** cinq familles actives, année simulée 1992, nuage vide à l'exception des repères du Système solaire, vitesse Normal, lecture déjà en cours.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : les familles actives et l'année choisie (pause ou curseur) sont restaurées ; la visualisation s'ouvre alors en pause sur cette année, nuage reconstruit jusqu'à sa fin.
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : la visualisation s'ouvre en pause sur la dernière année, nuage et frise complets, sans éclat d'apparition. Une année portée par l'URL prime et reste en pause. Si le visiteur lance la lecture, les éclats d'apparition restent supprimés : ce sont des variations de taille et d'opacité d'un instant, sans valeur informative, que la préférence invite à retirer.

## Vue tableau

Voir "Vue tableau des données" dans le `functional-specifications.md` général.

- **Légende :** "Exoplanètes confirmées, par année de découverte et méthode de détection" / "Confirmed exoplanets, by discovery year and detection method", complétée par la date de récupération des données, qui situe l'année en cours partielle.
- **Lignes :** une par année, de 1992 à la dernière année du fichier, y compris les années sans découverte (1993) pour que la chronologie reste continue (35 lignes au 2026-09-24).
- **Colonnes :** les cinq familles, dans l'ordre de la légende (Transit, Vitesse radiale, Microlentille, Imagerie directe, Autres méthodes), puis Total.
- **Agrégation :** toutes les planètes confirmées du fichier, y compris les 39 non représentées sur le graphique faute de masse ou de distance : le tableau décrit les découvertes, pas les points.
- **Ligne de total :** toutes années confondues (6 366 planètes au 2026-09-24).

## États

- **Chargement :** le temps que `exoplanets.json` soit récupéré et que les axes et les repères soient dessinés ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de graphique vide silencieux.
- **Vide :** toutes les familles désactivées via le filtre → axes et repères du Système solaire seuls, frise vide, compteur à zéro, avec un message neutre rappelant qu'aucune méthode n'est sélectionnée (état voulu par le visiteur, à distinguer de l'erreur).

## Responsive

- Légende/filtre, compteur et contrôles de lecture sous le graphique plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes (même disposition que `satellites-in-orbit`).
- Nuage et frise redimensionnés avec la largeur de la zone de montage ; graduations des axes allégées sur petit écran (une graduation par puissance de dix au lieu des repères intermédiaires, voir "Axes" dans `technical-specifications.md`).
- Étiquettes du Système solaire : les huit noms sur grand écran ; sur petit écran, seulement Terre, Jupiter et Neptune, les autres repères restant dessinés sans nom (voir "Points à valider" dans `technical-specifications.md`).
- Fiche de détail déclenchée au tap plutôt qu'au survol, fermée par un tap ailleurs ; le défilement de la page au doigt au-dessus du graphique reste possible (pas de zoom à capturer).

## Accessibilité (limite connue)

L'interaction principale (nuage animé dessiné sur Canvas, survol des points) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documentée comme limite connue, conformément à la règle par défaut du projet. Les boutons Play/Pause, les entrées de la légende/filtre, le sélecteur de vitesse et le curseur d'année restent accessibles au clavier (éléments `<button>`/`<input type="range">` standard), pour arrêter un contenu qui bouge sans intervention, filtrer et parcourir la chronologie. Le compteur et l'année simulée ne sont pas annoncés en continu pendant la lecture (une région `aria-live` bavarde à chaque image) ; ils le sont au relâchement du curseur.

Repli : la vue tableau (voir "Vue tableau" ci-dessus) donne accès aux mêmes données, sous forme de synthèse, au clavier et au lecteur d'écran.

## Contenu non traduit

Les noms des planètes (`name`) et des instruments ou observatoires (`facility`) sont des désignations officielles fournies en anglais par l'archive ("Haute-Provence Observatory", "Transiting Exoplanet Survey Satellite (TESS)") : affichés tels quels dans la version française, comme les noms de lieux USGS de `earthquakes`. Les noms des familles de méthodes et des planètes du Système solaire sont fournis dans les deux langues (voir `data-model.md`).
