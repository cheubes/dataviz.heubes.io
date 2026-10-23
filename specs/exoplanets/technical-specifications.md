# Spécifications techniques : Les mondes découverts

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : spécifié, non implémenté.** Les choix listés dans "Points à valider" ci-dessous attendent la confirmation de l'utilisateur.

## Source des données

NASA Exoplanet Archive, table `pscomppars`, interrogée une fois par le service TAP au moment du prétraitement, pas à chaque build (voir "Accès" et "Prétraitement" dans `data-model.md`). Repères du Système solaire relevés sur la fiche NSSDCA. Dans le bloc de crédit des sources, la ligne de l'archive est complétée par le texte de remerciement demandé par l'archive ("This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."), repris tel quel dans les deux langues (voir "Dataset source" dans `data-model.md`).

Les deux URL de source (`url` des datasets) répondent 200 à une requête GET simple au 2026-09-24. L'archive est derrière Cloudflare : un verdict "indéterminé" de la surveillance des sources (voir "Surveillance des sources" dans `technical-specifications.md` général) ne signalerait pas forcément une source disparue.

## Forme retenue

**Nuage masse × demi-grand axe, en deux axes logarithmiques, qui se remplit année après année**, plutôt que le nuage rayon × période orbitale envisagé au cadrage. Raison, mesurée sur les données (voir "Mesures" et "Nature des valeurs" dans `data-model.md`) :

- **Le rayon × période efface deux des quatre signatures.** La période manque pour 277 des 289 planètes par microlentille et 71 des 97 par imagerie directe ; le rayon de 1 130 planètes par vitesse radiale, de toutes celles par microlentille et de 52 par imagerie n'est pas mesuré mais calculé par l'archive à partir de la masse. Ce plan est celui des transits, et montrerait surtout Kepler et TESS.
- **Le masse × demi-grand axe les montre toutes.** 6 327 planètes sur 6 366 y ont une position, et les quatre grandes familles y occupent des régions nettement séparées (médianes : transit 0,076 ua / 7 masses terrestres, vitesse radiale 0,97 ua / 359, microlentille 2,35 ua / 190, imagerie 182 ua / 3 970). C'est ce qui porte l'angle "chaque méthode laisse sa signature".
- **Les repères du Système solaire y ont un sens direct** (distance au Soleil, masse), et la région de la Terre (1 ua, 1 masse terrestre) y est visiblement presque vide : deux planètes seulement entre 0,5 et 2 ua et entre 0,5 et 2 masses terrestres.

Contrepartie assumée : 2 974 masses de transits sont estimées d'après le rayon (relation de Chen et Kipping), et 892 sont des masses minimales. Elles restent représentées, signalées en fiche de détail (voir "Points à valider").

**Frise des découvertes** en complément du nuage : un nuage qui s'accumule montre mal le rythme (une année de 1 504 découvertes ne se distingue d'une année de 150 que par un éclat plus dense). L'histogramme annuel empilé donne ce rythme sans second graphique à part entière, et sert de repère visuel au curseur d'année.

## Rendu

**Canvas 2D pour les points, SVG pour le reste**, même partage que les visualisations cartographiques du site entre données denses et habillage :

- **Canvas des points installés :** chaque planète dont l'année simulée est atteinte y est peinte une fois, par-dessus l'existant (même mécanisme incrémental que la nuée de `satellites-in-orbit`). Un changement de filtre, un déplacement manuel du curseur, une reprise de passage ou un redimensionnement vide ce canvas et le reconstruit en une passe. Disque plein de rayon 2,5 px (2 px sous 480 px de large), opacité 0,75, sans contour : la superposition fait monter la densité là où les points s'accumulent.
- **Canvas des éclats :** au-dessus, effacé et redessiné à chaque image. L'apparition d'une planète y dessine un anneau de sa couleur, dont le rayon passe de trois fois à une fois celui du point et l'opacité de 1 à 0, en **700 ms en temps réel**, indépendamment de la vitesse de lecture. Jusqu'à environ un millier d'éclats simultanés pendant l'année 2016 à vitesse Normal : un millier d'arcs par image reste dans le budget d'un canvas 2D.
- **SVG d'habillage**, au-dessus des deux canvas, sans capture du pointeur : axes et grille (voir "Axes"), repères du Système solaire (cercle vide de 5 px de rayon, trait de 1,5 px en `--dv-ink-primary`, nom en `0.75rem` graisse 500, même couleur, avec un liseré `--dv-surface` derrière le texte, `paint-order: stroke`, pour rester lisible sur un nuage dense). Au-dessus des points, pour ne jamais être recouverts.
- **Frise :** SVG sous le nuage, hauteur fixe (64 px, 48 px sous 480 px de large), une colonne par année alignée sur une échelle de bande (`scaleBand`), segments empilés dans l'ordre de la légende. Échelle verticale linéaire commune à toutes les années (maximum : 1 504 en 2016), avec une hauteur minimale de 1 px pour toute année non nulle, pour qu'aucune découverte isolée des années 1990 ne disparaisse. Les segments d'une année ne sont dessinés que quand l'année simulée l'a atteinte ; repère vertical de l'année simulée en `--dv-ink-primary`.
- D3 pour les calculs uniquement (échelles, boucle d'animation), pas pour le DOM : SVG construit en JS natif (`document.createElementNS`), interactions par `addEventListener`, même approche que `grape-harvest-almanac`.

## Axes

- **Abscisse :** demi-grand axe, `scaleLog`, domaine fixe `[0,003 ; 30 000]` ua, qui contient toutes les planètes (0,0044 à 19 000 ua) et les huit repères. Graduations aux puissances de dix de 0,01 à 10 000, libellés formatés selon la langue (`Intl.NumberFormat` : "0,01", "10 000" / "0.01", "10,000"). Titre : "Distance moyenne à l'étoile (ua, 1 = Terre-Soleil)" / "Average distance to the star (AU, 1 = Earth-Sun)".
- **Ordonnée :** masse, `scaleLog`, domaine fixe `[0,01 ; 20 000]` masses terrestres (données : 0,02 à 9 535). Mêmes graduations aux puissances de dix. Titre : "Masse (1 = Terre)" / "Mass (1 = Earth)".
- Grille aux puissances de dix en `--dv-gridline`, libellés en texte secondaire (`--dv-ink-secondary`, `0.75rem`). Sur grand écran, graduations intermédiaires sans libellé (2 et 5 de chaque décade) ; sous 480 px de large, puissances de dix seulement, un libellé sur deux en abscisse.
- Domaines fixes plutôt que calculés sur les données : l'image d'une année donnée ne change pas d'échelle au fil de la lecture (le nuage se remplit dans un cadre stable), et un rafraîchissement des données qui reste dans ces bornes n'y touche pas. Une planète hors domaine au prochain rafraîchissement est dessinée au bord du cadre plutôt qu'omise, et signalée par le prétraitement.
- Pas de `d3-axis` (non installé) : graduations obtenues par `scale.ticks()` et tracées à la main, comme l'axe des années de `grape-harvest-almanac`.

## Palette

**Exception documentée à la règle générale de la palette dataviz** (voir "Palette dataviz" dans `style-guide.md`), la même que `satellites-in-orbit` : un nuage de points est une disposition où toutes les paires de couleurs peuvent se toucher, qui ne garantit que trois teintes distinguables en daltonisme. Cette visualisation en utilise cinq, compensées par :

- la position, qui porte déjà l'essentiel de l'information : les familles occupent des régions distinctes du plan (voir "Forme retenue"), la couleur confirme plus qu'elle ne distingue ;
- une légende toujours visible (couleur + nom + effectif, jamais la couleur seule) ;
- le filtre méthode, qui isole une famille pour lever toute ambiguïté ;
- la méthode affichée en toutes lettres dans la fiche de détail.

| Slot | Teinte | Famille |
|---|---|---|
| 1 | Bleu | Transit |
| 2 | Orange | Vitesse radiale |
| 3 | Aqua | Microlentille |
| 4 | Jaune | Imagerie directe |
| 5 | Magenta | Autres méthodes |

Assignation par ordre d'apparition dans `methods` (voir "Format de sortie" dans `data-model.md`), dans l'ordre fixe des slots. Les trois familles les plus proches dans le plan (transit, vitesse radiale, microlentille, qui se chevauchent entre 0,05 et 5 ua) reçoivent les trois slots garantis distinguables deux à deux. Le jaune et le magenta, sous 3:1 de contraste sur fond blanc en trait fin, sont portés par des disques pleins et non des traits ; l'imagerie directe (jaune) occupe une région presque exclusive (90 % de ses planètes au-delà de 10 ua). Les mêmes couleurs servent à la frise.

Les repères du Système solaire sont en `--dv-ink-primary`, hors palette catégorielle : ce ne sont pas une sixième série de données mais un habillage de référence, au même titre que la grille.

À valider au script du skill dataviz à l'implémentation, avec les valeurs d'opacité retenues (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

## Animation

- Boucle `d3-timer`, année simulée continue sur `[1992, dernière année + 1)`. Mapping linéaire temps de lecture → année simulée, une année par seconde à vitesse Normal : **35 s par passage** pour 1992-2026. Lent (×0,5, 70 s) et Rapide (×2, 17,5 s), même mécanisme `SPEED_FACTORS` que `satellites-in-orbit`.
- Temps linéaire plutôt que proportionnel au nombre de découvertes : les années creuses des débuts passent aussi vite que 2016, et c'est ce contraste (une poignée de points par an, puis un millier d'un coup) qui donne à voir les vagues Kepler.
- **Temps d'arrêt de fin de passage :** 2,5 s sur le nuage complet, puis les deux canvas et la frise sont vidés et le passage reprend en 1992 (même convention et même durée que `satellites-in-orbit`). Durée multipliée par le facteur de vitesse.
- `planets` étant trié par `year` (voir "Contraintes de validation" dans `data-model.md`), un curseur d'index avance à chaque image. `simYear` (voir "Champs dérivés côté client" dans `data-model.md`) étale l'apparition des planètes d'une année sur toute cette année. Les 39 planètes sans position font avancer le compteur et la frise, sans point ni éclat.
- Année simulée affichée via `Intl.DateTimeFormat(lang, { year: 'numeric' })`. Si la dernière année du fichier est aussi l'année de `generatedAt`, elle porte la mention "année en cours" / "current year" : sa colonne de la frise est incomplète, ce qu'on ne doit pas lire comme un effondrement des découvertes.

## Curseur d'année

`<input type="range">` natif, bornes `[1992, dernière année]` calculées depuis `planets`, granularité annuelle, sans graduations : même composant et même comportement que `satellites-in-orbit` (voir "Curseur d'année" dans son `technical-specifications.md`). L'évènement `input` met la lecture en pause ; une recherche binaire sur `year` retrouve le dernier index de l'année choisie ; le canvas des points et la frise sont reconstruits en une passe jusqu'à la fin de cette année, canvas des éclats vidé ; `playedMs` est recalculé par inversion du mapping, pour que la reprise continue depuis ce point.

## Survol

Recherche linéaire, à chaque `pointermove` (regroupée à une fois par image), du point visible le plus proche du pointeur dans un rayon de 6 px (12 px sur tactile), parmi les points installés et les familles actives, sur leurs coordonnées écran précalculées au dernier redimensionnement. Environ 6 300 distances par recherche : négligeable, sans index spatial. Tactile : fiche au `pointerdown`/`click`, comme `volcanic-eruptions`. La fiche est un élément DOM superposé au graphique, même approche que le tooltip de `bird-migrations`, avec le point ciblé cerclé en `--dv-ink-primary` sur le canvas des éclats.

## Nouvelles dépendances

Aucune : `d3-scale` (`scaleLog`, `scaleLinear`, `scaleBand`) et `d3-timer` sont déjà des dépendances du site, réutilisées sans ajout au `package.json`.

| Dépendance | Usage dans cette visualisation | Portée |
|---|---|---|
| `d3-scale` | Échelles logarithmiques des axes, échelle linéaire du temps et de la frise, échelle de bande des années | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation | Idem |

Écartés : `d3-axis` et `d3-quadtree`, qui seraient de nouvelles dépendances (à discuter avant ajout), sans nécessité ici (graduations tracées à la main, recherche linéaire suffisante au volume mesuré). Pas de `d3-zoom` ni de `d3-selection` : pas de zoom, DOM en JS natif.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. Mouvement réduit : `prefersReducedMotion()` (voir "Accessibilité" dans `technical-specifications.md` général) ouvre la visualisation en pause sur la dernière année par le même chemin qu'une année restaurée depuis l'URL, sans l'écrire ; le canvas des éclats n'est alors jamais dessiné, lecture lancée ou non.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Hauteur de la zone de montage selon la règle commune (`max(320px, min(largeur × 0,6, plafond))`, frise et contrôles compris). Au redimensionnement, canvas et SVG sont redimensionnés ensemble et le nuage installé est reconstruit en une passe (positions recalculées, pas d'étirement). Sous 480 px de large, seuls les repères Terre, Jupiter et Neptune gardent leur nom, pour éviter le chevauchement des étiquettes de Mercure, Vénus, Terre et Mars, serrées sur moins d'une demi-décade en abscisse.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `methods` | Identifiants des familles actives (`transit`, `radial-velocity`, `microlensing`, `imaging`, `other`), séparés par des virgules ; vide (`methods=`) pour aucune famille | Les cinq familles actives |
| `year` | Année entière entre les bornes du curseur d'année | Lecture en cours |

- `methods` : identifiants inconnus ignorés ; une liste non vide dont aucun identifiant n'est connu est invalide et laisse les cinq familles actives. `methods=` restaure l'état vide voulu (voir "États" dans `functional-specifications.md`). Écrit à chaque bascule de la légende.
- `year` est écrit à la pause (bouton) et au relâchement du curseur d'année, et retiré à la reprise de la lecture. Un lien porteur de `year` ouvre la visualisation en pause, nuage et frise reconstruits jusqu'à la fin de cette année, comme `satellites-in-orbit`. Pas d'écart à la règle générale : à la différence de `earthquakes`, l'image en pause a un sens (le nuage accumulé).
- La vitesse et la fiche de détail ne sont pas capturées.

## Points à valider

Décisions de conception à confirmer par l'utilisateur avant implémentation :

1. **Forme :** nuage masse × demi-grand axe plutôt que rayon × période du cadrage, pour les raisons mesurées dans "Forme retenue". Alternative écartée : rayon × période, qui ne montre que les transits.
2. **Masses estimées et minimales :** conservées (2 974 masses estimées d'après le rayon, toutes des transits, et 892 masses minimales), rendu identique aux masses mesurées, nature précisée en fiche de détail seulement. Alternative : les distinguer visuellement (disque vide pour une masse estimée), au prix d'un second codage dans un nuage déjà dense. Alternative écartée : les exclure, ce qui retirerait 63 % des transits et les vagues Kepler.
3. **Demi-grand axe calculé par la troisième loi de Kepler** pour 422 planètes sans `pl_orbsmax` (écart médian de 0,6 % avec les valeurs publiées quand les deux existent), signalé en fiche. Sans ce calcul, 430 planètes, surtout des découvertes TESS récentes, n'auraient pas de point.
4. **Regroupement en cinq familles** (quatre méthodes principales + "Autres méthodes" pour 72 planètes et sept méthodes).
5. **Palette :** cinq slots de la palette catégorielle dans un nuage de points, exception identique à `satellites-in-orbit`. Alternative : "Autres méthodes" en gris neutre pour rester à quatre teintes, ce qui demanderait d'ajouter une valeur à `style-guide.md`.
6. **Axes :** logarithmiques à domaines fixes (`[0,003 ; 30 000]` ua, `[0,01 ; 20 000]` masses terrestres) englobant toutes les planètes. Alternative : couper au 1er et au 99e centile pour élargir le cœur du nuage, au prix d'une cinquantaine de planètes par imagerie au bord du cadre.
7. **Point de départ en 1992** (planètes du pulsar PSR B1257+12) plutôt qu'en 1995 comme au cadrage : ce sont les premières planètes confirmées de l'archive, et 51 Peg b (1995) reste nommée dans la présentation.
8. **Frise annuelle empilée** sous le nuage : ajout par rapport au cadrage, à confirmer, ainsi que sa hauteur minimale de 1 px par année non nulle (légère exagération des années 1990).
9. **Pas de zoom ni de déplacement** dans le nuage : à confirmer, notamment pour le cœur dense des transits (0,01 à 0,3 ua).
10. **Rythme :** 35 s par passage à vitesse Normal (une année par seconde, temps linéaire), éclats de 700 ms, temps d'arrêt de 2,5 s. Valeurs de départ à confirmer sur un premier rendu observé.
11. **Mouvement réduit :** éclats d'apparition supprimés même quand le visiteur lance la lecture (les points apparaissent sans éclat). Le `functional-specifications.md` général ne tranche pas explicitement ce cas.
12. **Étiquettes du Système solaire sur petit écran :** Terre, Jupiter et Neptune seulement sous 480 px.
13. **Licence et téléchargement :** l'archive ne publie pas de licence formelle mais autorise la réutilisation "with the appropriate acknowledgements" (voir "Dataset source" dans `data-model.md`). Proposition : déclarer `exoplanets.json` dans `downloads`, au titre des sources "sans licence formalisée mais autorisant la redistribution avec citation" de la règle générale, avec le texte de remerciement de l'archive dans le bloc de crédit. Réserve : aucun texte de l'archive ne parle explicitement de redistribution ; si l'utilisateur juge ce silence insuffisant, pas de `downloads`.
14. **Second dataset crédité** pour les huit valeurs du Système solaire (fiche NSSDCA) plutôt que des constantes non sourcées.
15. **Présence de 2026, année partielle,** dans la lecture, la frise et le tableau, avec la mention "année en cours", plutôt que d'arrêter la visualisation à la dernière année complète (2025).
16. **Titre, résumé et présentations** (voir "Angle éditorial" dans `functional-specifications.md`), thème unique `space`.
