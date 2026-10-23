# Spécifications techniques : Ce qui nous tombe du ciel

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : spécifié, non implémenté.** Plusieurs choix restent à confirmer (voir "Points à valider" ci-dessous).

## Source des données

Copie du Meteoritical Bulletin Database publiée sur le NASA Open Data Portal, voir "Dataset source", "Accès" et "Licence" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement (fichier CSV "legacy" du portail), pas à chaque build. Script de prétraitement Node ponctuel, non committé (voir "Prétraitement" dans `data-model.md`).

Bloc de crédit des sources : "The Meteoritical Society, Meteoritical Bulletin Database, via le NASA Open Data Portal", licence affichée "Non spécifiée par la source" / "Not specified by the source". Pas de lien de téléchargement (voir "Licence" dans `data-model.md`).

## Forme retenue

Le cadrage proposait un planisphère de points dimensionnés par la masse, avec une bascule vues tomber / trouvées. Les mesures sur le fichier réel (voir "Mesures" dans `data-model.md`) conduisent à garder cette base et à lui ajouter deux pièces :

1. **Planisphère de points** avec bascule : conservé. Les 1 096 chutes observées positionnées, dessinées par-dessus, restent lisibles sur les 30 867 trouvailles ; la bascule permet de les isoler.
2. **Profil latitudinal** (ajout) : sur la carte, plus de 70 % des trouvailles positionnées se réduisent à quelques dizaines de points empilés en Antarctique (4 761 météorites sur un seul point), ce qui inverse visuellement le rapport de forces. Le profil rétablit les proportions, sans changer l'encodage de la carte.
3. **Encart antarctique** (ajout) : la projection `geoNaturalEarth1` aplatit les hautes latitudes, précisément là où se concentrent les trouvailles. Une vue polaire les rend lisibles sans forcer le zoom.

Alternatives écartées :

- **Deux planisphères côte à côte** (petits multiples vues tomber / trouvées) : chaque carte perd la moitié de la largeur, et les 1 096 chutes deviennent des points d'un pixel. La bascule et le profil en miroir font la même comparaison sans ce coût.
- **Carte de densité en hexagones** : masque les chutes, trop rares pour une grille, et reprend la forme de `biodiversity` et `light-pollution`.
- **Accumulation chronologique** (curseur d'année) : la rupture de 1969 est réelle (voir "Mesures" dans `data-model.md`), mais le biais à montrer est spatial, et l'accumulation est déjà la mécanique de `monument-layers` et `satellites-in-orbit`. La rupture est dite dans la présentation longue.
- **Symboles proportionnels par emplacement** (un cercle par position, aire selon le nombre de météorites) : rendrait les empilements visibles, mais au prix d'un second encodage de taille, en concurrence avec la masse.

## Techno carte

Même stack que `earthquakes` et `volcanic-eruptions`, D3 v7.

- **Fond de carte, cours d'eau, relief : copiés (octets identiques) depuis `public/data/bird-migrations/`** (`basemap.json`, `rivers.json`, `relief.webp`) vers `public/data/meteorites/`, même convention que `monarch-migration`, `earthquakes` et `volcanic-eruptions`. Constantes d'alignement du relief (`RELIEF_REF_WIDTH/HEIGHT`, `RELIEF_ORIGIN_X/Y`) reprises à l'identique.
- **Projection du planisphère :** `geoNaturalEarth1`, `fitExtent` sur l'étendue complète de la silhouette, comme `earthquakes`. La silhouette descend à 85,6° S : les champs de glace les plus méridionaux (LaPaz Icefield, Graves Nunataks, vers 86° S) tombent au bord de la silhouette ou juste en dessous, sans clip des points.
- **Zoom :** `d3-zoom` sur le canvas de premier plan, `scaleExtent [1, 8]`, boutons zoomer / dézoomer / réinitialiser (pas de `× 1,5`), désactivés aux bornes, comme `earthquakes`.

## Rendu

**Canvas 2D**, trois canvas superposés :

1. **Fond** : silhouette, relief, cours d'eau, redessiné au redimensionnement et au zoom.
2. **Trouvailles** : 30 867 points.
3. **Chutes observées** : 1 096 points, au-dessus.

Un canvas par population permet la bascule par simple fondu d'opacité CSS (`transition: opacity`), sans redessin, ce qui reste compatible avec le mouvement réduit (voir "Mouvement réduit" dans `functional-specifications.md`).

- **Ordre de dessin :** dans chaque population, des plus massives aux plus légères (ordre du fichier, voir "Prétraitement" dans `data-model.md`), masses inconnues en dernier : les petits points restent visibles sur les gros.
- **Classes de taille** (rayon en pixels écran, constant quel que soit le zoom) :

  | Masse | Rayon |
  |---|---|
  | Inconnue | 1,25 px |
  | Moins de 100 g | 1,25 px |
  | 100 g à 10 kg | 2 px |
  | 10 kg à 1 t | 3,5 px |
  | 1 t et plus | 6 px |

  Des classes plutôt qu'une échelle continue : les masses s'étendent sur près de neuf ordres de grandeur (0,1 g à 60 t). Une échelle en racine carrée ferait de Hoba un disque géant et des 21 000 fragments de moins de 100 g des points invisibles ; une échelle logarithmique continue serait illisible en légende.
- **Trouvailles :** disques pleins, opacité 0,5, pour que la densité se lise par accumulation.
- **Chutes observées :** disques pleins opaques, liseré `--dv-surface` (blanc) de 0,75 px pour les détacher des trouvailles qu'ils recouvrent.
- **Redessin au zoom :** les deux canvas de points sont redessinés à chaque événement `zoom` (32 000 disques au plus), dans un `requestAnimationFrame`. À mesurer sur mobile ; si le rendu saccade, reprendre la transformation CSS pendant le geste et le redessin en fin de geste, comme `medical-deserts` (voir "Points à valider" ci-dessous).

## Profil latitudinal

- **Bandes :** 18 bandes de 10°, de 90° N à 90° S.
- **Alignement :** `geoNaturalEarth1` est pseudo-cylindrique, l'ordonnée d'un point ne dépend que de sa latitude. Les bords de chaque bande sont donc placés à `projection([0, latitude])[1]`, puis passés par la transformation de zoom (`transform.applyY`). Le profil suit ainsi le zoom et le déplacement verticaux de la carte, rogné à la hauteur de la zone de carte.
- **Barres :** axe vertical central, chutes observées vers la gauche, trouvailles vers la droite, longueur proportionnelle à la part de la population positionnée dans la bande (échelle linéaire commune aux deux côtés, domaine `[0, 50 %]`, la plus forte part mesurée étant 48 %). Une bande non vide mais minuscule garde au moins 1 px, pour rester distincte d'une bande vide.
- **Bascule :** la série masquée sur la carte est atténuée (opacité 0,25), pas retirée.
- **Rendu :** SVG, une vingtaine d'éléments, à droite du canvas, largeur 120 px (48 px sous 640 px). Survol et tap par bande.

## Encart antarctique

- **Projection :** `geoAzimuthalEqualArea().rotate([0, 90])`, `clipAngle` limité aux latitudes inférieures à 60° S, `fitExtent` sur ce disque. Même silhouette (`basemap.json`), sans relief ni cours d'eau : `relief.webp` est rasterisé dans la projection du planisphère et ne se reprojette pas.
- **Points :** mêmes points, mêmes couleurs, mêmes classes de taille, mêmes canvas logiques (un dessin de plus par population sur un canvas propre à l'encart, soumis au même fondu d'opacité).
- **Taille et place :** environ 18 % de la largeur du planisphère, posé dans le Pacifique Sud, entre la Nouvelle-Zélande et l'Amérique du Sud, au-dessus de la bande antarctique : une zone vide de terres comme de météorites, alors qu'un coin bas recouvrirait les champs de glace de LaPaz et de Graves Nunataks. Cadre fin `--dv-gridline`, libellé "Antarctique" / "Antarctica". Sous 640 px, sous le planisphère, pleine largeur, 160 px de haut.
- Ni zoom ni déplacement.

## Survol

- **Index spatial maison** sur une grille uniforme en pixels écran (cellules de 16 px), reconstruit après chaque redessin des points : les positions écran sont déjà calculées pour le dessin. Recherche dans la cellule du pointeur et ses huit voisines, point le plus proche dans un rayon de 8 px (rayon de tap de 16 px sur tactile), dans la population affichée.
- Le point trouvé regroupe toutes les météorites de même position (positions arrondies à quatre décimales, voir "Prétraitement" dans `data-model.md`), pour la fiche "N météorites à cet emplacement" (voir "Interactions" dans `functional-specifications.md`). Les regroupements sont calculés une fois au chargement (table position → indices).
- Encart : même index, propre à l'encart.
- Fiche de détail en élément DOM superposé, comme `earthquakes`. Masquée pendant un geste de zoom.

## Palette

Palette catégorielle du `style-guide.md`, deux premiers slots, sans exception à documenter : sur un nuage de points, les trois premiers slots sont garantis distinguables deux à deux.

| Slot | Teinte | Population |
|---|---|---|
| 1 | Bleu `#2a78d6` | Trouvées |
| 2 | Orange `#eb6834` | Vues tomber |

L'orange, plus chaud et plus saillant, va à la population rare et au sujet du titre (la chute) ; le bleu, au fond massif des trouvailles. Le bleu d'accent du site est le même que le slot 1 : il n'est pas ici l'identité seule d'une série, puisque la légende nomme chaque population à côté de sa pastille. Couleurs d'illustration du fond (silhouette `#e4e2da`, hydrographie `#a8c5da`) reprises de "Fond de carte (illustration)" dans `style-guide.md`, aucune nouvelle valeur. Les mêmes couleurs servent au profil latitudinal et à l'encart.

## Nouvelles dépendances

Aucune. `d3-geo` (y compris `geoAzimuthalEqualArea`), `d3-zoom`, `d3-selection`, `d3-transition`, `d3-scale` et `topojson-client` sont déjà dans `package.json`. `d3-quadtree` aurait pu servir d'index spatial pour le survol : non retenu, la grille uniforme ci-dessus suffit. Son ajout serait à discuter (voir "Points à valider" ci-dessous).

## Hydratation

Zone de montage hydratée via un `<script>` classique posant un `IntersectionObserver` (`rootMargin: 200px`) qui ne monte le rendu qu'au premier passage dans le viewport, même mécanisme que `earthquakes` et `volcanic-eruptions`.

Hauteur de la zone de montage : calcul commun (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), sur la largeur totale. Le planisphère est cadré dans la largeur restante une fois le profil retiré.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. Bascule d'affichage en `<fieldset>` de trois `<input type="radio">` natifs avec `<legend>`, boutons de zoom en `<button>` avec `aria-label` : accessibles au clavier par construction. Le profil latitudinal porte un `aria-hidden="true"` : ses chiffres sont repris dans la vue tableau.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan / zoom tactile via `d3-zoom`, fiche déclenchée par `pointerdown` / `click` plutôt que `pointermove` sur tactile, comme `earthquakes`.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `show` | `fell` (vues tomber seules), `found` (trouvées seules) | Les deux populations |
| `zoom` | `<k>,<lon>,<lat>` (format commun) | Planisphère entier |

- `show` est écrit à chaque changement de la bascule, retiré au retour sur "Toutes". Toute autre valeur est ignorée.
- `show` est appliqué avant le premier dessin, par l'opacité des canvas sans transition : la carte s'ouvre directement sur la population demandée, sans jouer le fondu au chargement (même précaution que `view` de `medical-deserts`).
- `zoom` est écrit à l'événement `end` de `d3-zoom`. L'encart et le profil n'ont pas d'état propre.
- Pas de position temporelle : la visualisation n'est pas animée.

## Points à valider

Décisions de conception à confirmer par l'utilisateur avant implémentation :

1. **Source :** copie NASA du catalogue, figée au printemps 2013 (45 716 météorites), plutôt que le Meteoritical Bulletin Database à jour (78 667 noms valides selon re3data), inaccessible aux requêtes automatisées (Cloudflare) et sans licence publiée. Alternative : extraction manuelle depuis un navigateur, non reproductible et pas mieux licenciée. La présentation dit "dans l'état du catalogue en 2013".
2. **Licence et téléchargement :** "License not specified" côté NASA, copyright revendiqué côté Meteoritical Society, aucun texte n'autorisant la redistribution. Proposition : pas de `downloads`. Alternative : déclarer `meteorites.json`, en considérant la publication "public" sur un portail gouvernemental comme une autorisation suffisante, ce que la règle générale ne prévoit pas en l'état.
3. **Forme :** planisphère de points + profil latitudinal + encart antarctique (voir "Forme retenue"). Les deux ajouts au cadrage sont à confirmer séparément.
4. **Bascule par défaut sur "Toutes"** (les deux populations superposées) plutôt que sur "Vues tomber" puis "Trouvées" en deux temps.
5. **Masse en quatre classes de taille** plutôt qu'en échelle continue ; seuils (100 g, 10 kg, 1 t) et rayons à confirmer sur un premier rendu.
6. **Empilements laissés tels quels** (pas de dispersion, pas de symbole proportionnel par emplacement), compensés par la fiche de détail et le profil.
7. **Profil en parts** de chaque population (et non en effectifs), par bandes de 10°, aligné sur la carte et suivant le zoom vertical.
8. **Positions inconnues** (13 752, dont 4 300 Northwest Africa) : absentes de la carte, comptées dans la légende et le tableau. Règle propre aux 223 "Yamato" à latitude nulle, passés en position inconnue.
9. **Meridiani Planum** (trouvée sur Mars) exclue du fichier. Elle pourrait faire l'objet d'une phrase dans la présentation longue.
10. **Reliques** (75, `nametype` = `Relict`) conservées et non distinguées.
11. **Thèmes `space` et `earth`.** Effet à connaître : toutes les candidates ne partageant qu'un thème, les visualisations liées sont départagées par date de publication. Avec les publications actuelles, ce seraient `forest-fires`, `volcanic-eruptions` et `earthquakes`, et `satellites-in-orbit`, plus ancienne, n'apparaîtrait pas. En retour, cette visualisation, la plus récente, entrerait dans les visualisations liées des quatre visualisations `earth` et des visualisations `space` (dont `exoplanets` si elle est publiée). Alternative : `space` seul.
12. **Palette :** orange (slot 2) pour les chutes observées, bleu (slot 1) pour les trouvailles.
13. **Pas de dimension temporelle** dans l'interface (ni curseur ni filtre de période), malgré la rupture de 1969 : l'année n'apparaît qu'en fiche de détail et dans la présentation.
14. **Responsive :** seuil de 640 px, encart sous la carte et profil réduit à 48 px en dessous.
15. **Performance du redessin au zoom** (32 000 disques par image) : à mesurer sur mobile, repli prévu sur la technique de `medical-deserts`.
16. **Index spatial maison** plutôt que l'ajout de `d3-quadtree` (nouvelle dépendance, à discuter si la grille ne suffit pas).
17. **Titre, résumé et présentations** (voir "Angle éditorial" dans `functional-specifications.md`).
