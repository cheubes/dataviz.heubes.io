# Spécifications techniques : La migration des monarques

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno carte

D3 v7, même stack que `bird-migrations`, pas de Leaflet.

- **Fond de carte, cours d'eau, relief : réutilisation directe des assets de `bird-migrations`, copiés (pas référencés) dans `public/data/monarch-migration/`.** `basemap.json` (silhouette terrestre), `rivers.json` (cours d'eau) et `relief.webp` (relief ombré) couvrent déjà le monde entier, pas seulement le rectangle Europe/Afrique cadré par `bird-migrations` (voir "Couverture mondiale" dans son `data-model.md` et "Fond de carte"/"Cours d'eau"/"Relief" dans son `technical-specifications.md`) : les trois fichiers sont copiés tels quels, sans nouvelle extraction ni nouveau prétraitement, seul le cadrage change. Copie plutôt que référence directe entre dossiers, cohérent avec "chaque visualisation a ses propres données" (voir `CLAUDE.md`) : chaque dossier `public/data/<viz-slug>/` reste autonome, au prix d'une duplication (basemap + relief + rivières, environ 1,2 Mo) jugée raisonnable au regard du reste du site.
- **Projection :** `d3.geoNaturalEarth1` (même choix que `bird-migrations`), `fitExtent` sur un rectangle Amérique du Nord (128°O-62°O, 12°N-54°N), soit l'emprise de la grille de densité (14°N-52°N, 125°O-65°O, voir "Prétraitement" dans `data-model.md`) avec une petite marge. Anneau de cadrage orienté dans le sens horaire (et non la convention RFC 7946), comme dans `bird-migrations` : la règle d'enroulement sphérique de `d3-geo` est inversée, et un anneau anti-horaire est lu comme "tout sauf ce rectangle", ce qui cadre le monde entier. Le planisphère n'est pas affiché en entier ici : seule l'Amérique du Nord l'est (voir "Vue initiale" dans `functional-specifications.md`).
- **Zoom :** `d3-zoom`, `scaleExtent [1, 6]`, identique à `bird-migrations`. Le cadrage régional par défaut rend inutile un plafond plus élevé, tel qu'envisagé quand la carte était un planisphère (voir "Périmètre recentré" dans `data-model.md`).

## Relief : alignement au redimensionnement

Même mécanisme que `bird-migrations` (voir sa section du même nom dans son `technical-specifications.md`) : `relief.webp` est une image statique pré-rendue une seule fois, réalignée à chaque redimensionnement via une paire d'appels `fitExtent` (une fois sur un rectangle de référence fixe pour obtenir l'échelle/translation de calibration, une fois sur le cadrage réellement affiché pour en déduire l'échelle/décalage à appliquer à l'image).

**Aucune recalibration n'est nécessaire, contrairement à ce qu'une première version de cette spec anticipait.** Le calcul de calibration (`RELIEF_REF_WIDTH`/`HEIGHT`/`ORIGIN_X`/`ORIGIN_Y`, et le rectangle Europe/Afrique de `bird-migrations`) est réutilisé strictement à l'identique dans `render.ts` (`REFERENCE_VIEW_BOUNDS`), sans jamais être affiché : il ne sert que d'ancre de calibration. Le cadrage réellement affiché (`VIEW_BOUNDS`, Amérique du Nord) est un second rectangle indépendant. Justification géométrique : la projection (`geoNaturalEarth1`, rotation/centre par défaut, jamais modifiés) est la même dans les deux visualisations, et `fitExtent` recalcule entièrement échelle et translation à chaque appel à partir de la géométrie et du rectangle cible fournis, donc la relation affine entre le cadre de calibration et n'importe quel cadre affiché reste valable tant que la projection elle-même ne change pas. Régénérer `relief.webp` ou recalculer de nouvelles constantes aurait été inutile et risquait d'introduire l'exact désalignement que ce mécanisme cherche à éviter (voir "Piège potentiel à surveiller" dans le `technical-specifications.md` de `bird-migrations`).

**Vérifié à l'écran, à ce cadrage régional où un décalage serait immédiatement visible :** relief, littoral et cours d'eau restent alignés (captures d'écran de l'implémentation, en janvier et en août).

## Rendu

**Canvas 2D**, deux calques superposés : fond (silhouette, relief, cours d'eau, redessiné au redimensionnement et au zoom) et densité (vidé et redessiné intégralement à chaque frame : il représente un état courant, pas une traînée qui s'accumule comme les trajectoires de `bird-migrations`).

- **Cases de densité :** chaque cellule de la grille (voir "Format de sortie" dans `data-model.md`) est peinte comme un quadrilatère à quatre coins projetés, pas comme un rectangle défini par deux coins opposés : deux cellules voisines partagent alors exactement les mêmes points, et la courbure de la projection ne peut pas ouvrir de couture entre elles. Opacité pilotée par le volume d'observations du mois simulé courant (interpolation linéaire entre le mois courant et le suivant plutôt qu'un changement abrupt à chaque bascule de mois, pour une "vague" progressive plutôt que par à-coups), échelle `d3.scalePow` d'exposant 0,25, alpha de 0 à 0,95, calée sur le maximum global toutes cellules/mois confondus (4 904 observations). **Pourquoi un exposant aussi bas :** les effectifs sont très inégaux (case médiane : 28 observations sur l'année, maximum : 4 904), et une racine carrée (première version, alpha de 0,05 à 0,8) laissait la plupart des cases presque invisibles sur le fond beige, retour explicite de l'utilisateur. Avec l'exposant 0,25, une observation isolée donne un alpha d'environ 0,11 et 28 observations d'environ 0,26, tandis que la case la plus chargée reste à 0,95. L'échelle part de zéro (et non d'un plancher) pour qu'une case s'efface progressivement, sans à-coup, quand sa valeur interpolée tend vers zéro entre deux mois. `DENSITY_CELL_DEGREES = 1` répliqué comme constante dans `render.ts`, doit rester synchronisé avec la grille du prétraitement. **Coût de dessin :** jusqu'à 960 cases actives le mois le plus chargé, soit environ trois fois plus qu'à 2° (331 en août) ; mesuré en rendu logiciel dans Chromium headless, 60 images par seconde tenues (moyenne 16,7 ms, pire image 18,8 ms sur six secondes) : pas de mémoïsation des coins projetés, qui resterait à envisager si un appareil plus modeste peinait.
- **Tooltip :** élément DOM en HTML standard, superposé au Canvas, même approche que `bird-migrations`. Pourcentage relatif au maximum annuel *de la case* (pas un rang global), voir "Interactions" dans `functional-specifications.md`. Case retrouvée à partir de la position du pointeur par projection inverse (écran vers longitude/latitude) puis test d'appartenance à la case, pas par une géométrie de pixels mémorisée.

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent (même liste, voir "Nouvelles dépendances" dans son `technical-specifications.md`), seulement nouvelles pour cette visualisation.

## Palette

Une seule série : teinte Orange (`#eb6834`, slot 2 de la palette catégorielle officielle, voir "Palette dataviz" dans `style-guide.md`). Le slot 1 (Bleu) n'est pas retenu, contrairement à l'ordre par défaut d'une série unique : l'orange évoque les ailes du monarque, ressort sur la silhouette beige et son relief, et évite le bleu des cours d'eau (`#a8c5da`, voir "Fond de carte (illustration)" dans `style-guide.md`) qui se confondrait avec les cases.

**Jaune écarté après essai :** la teinte retenue à l'origine était le Jaune (`#eda100`, slot 4, la couleur du monarque quand il était la quatrième espèce d'un planisphère, voir "Périmètre recentré" dans `data-model.md`). Comparé à l'orange sur le rendu réel (janvier, avril, août, avec la même échelle d'opacité), le jaune restait trop doux sur le beige : les cases faibles s'y fondaient. Le jaune fait aussi partie des trois teintes sous 3:1 de contraste sur fond clair (voir "Palette dataviz" dans `style-guide.md`), ce qui n'est pas le cas de l'orange.

Ici la teinte n'encode aucune catégorie : c'est l'opacité qui encode le volume d'observations. La lecture repose sur le texte de présentation et le tooltip plutôt que sur la couleur seule (pas de légende, voir "Limites connues" dans `functional-specifications.md`).

## Animation

- Boucle `d3-timer`, pilotée par un temps simulé en jours (0-365, cyclique) : un seul cycle continu, 36 secondes par année à vitesse normale.
- Valeur affichée par case : interpolation linéaire entre le `count` du mois simulé courant et celui du mois suivant (janvier suit décembre), selon la fraction écoulée du mois courant. Le mois est celui de la date simulée (année de référence non bissextile), et sa fraction est calculée sur sa vraie durée en jours plutôt que sur un douzième d'année.
- Sélecteur de vitesse (×0,5 / ×1 / ×2) et nom du mois simulé (`Intl.DateTimeFormat(lang, { month: 'long' })`) : même mécanisme que `bird-migrations`.
- Tooltip rafraîchi à chaque frame tant qu'une case est survolée ou épinglée ; retiré si la case tombe à zéro au mois simulé courant.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `click` plutôt que `pointermove` sur tactile, même mécanisme que `bird-migrations`.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `month` | Mois entier, de 1 (janvier) à 12 (décembre) | Lecture en cours |
| `zoom` | `<k>,<lon>,<lat>` (format commun) | Amérique du Nord entière |

- **Position temporelle arrondie au mois :** le temps simulé est un jour fractionnaire, mais l'indicateur n'affiche que le nom du mois et les données sont mensuelles (voir "Animation" ci-dessus). `month` est le mois affiché au moment de la pause. Un lien porteur de `month` ouvre la carte en pause sur le premier jour de ce mois, où l'interpolation est nulle : l'image montre exactement les effectifs de ce mois. Elle peut donc différer légèrement de celle du visiteur qui a partagé, s'il a mis en pause en fin de mois (interpolation déjà avancée vers le mois suivant), mais le mois affiché est le même. Un jour de l'année aurait reproduit l'image au pixel près, pour un paramètre que l'interface n'expose nulle part.
- `month` est écrit à la pause et retiré à la reprise de la lecture. Pas de curseur temporel dans cette visualisation.
- Le tooltip épinglé n'est pas capturé (état transitoire).
