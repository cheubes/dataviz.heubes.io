# Spécifications techniques : Les grandes migrations

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Techno carte

D3 v7, même stack que `bird-migrations`, pas de Leaflet.

- **Fond de carte, cours d'eau, relief : réutilisation directe des assets de `bird-migrations`, copiés (pas référencés) dans `public/data/animal-migrations/`.** `basemap.json` (silhouette terrestre), `rivers.json` (cours d'eau) et `relief.webp` (relief ombré) couvrent déjà le monde entier, pas seulement le rectangle Europe/Afrique cadré par `bird-migrations` (voir "Couverture mondiale" dans son `data-model.md` et "Fond de carte"/"Cours d'eau"/"Relief" dans son `technical-specifications.md`) : les trois fichiers sont copiés tels quels, sans nouvelle extraction ni nouveau prétraitement, seul le `fitExtent` change (voir "Projection" ci-dessous). Copie plutôt que référence directe entre dossiers, cohérent avec "chaque visualisation a ses propres données" (voir `CLAUDE.md`) : chaque dossier `public/data/<viz-slug>/` reste autonome, au prix d'une duplication (basemap + relief + rivières, environ 1,2 Mo) jugée raisonnable au regard du reste du site.
- **Projection :** `d3.geoNaturalEarth1` (même choix que `bird-migrations`, adaptée à une vue mondiale complète, contrairement à une projection conforme qui déformerait excessivement les hautes latitudes), `fitExtent` directement sur la silhouette terrestre (`basemap.json`, pas un rectangle de cadrage régional comme `bird-migrations`) : le planisphère entier est visible par défaut (voir "Vue initiale" dans `functional-specifications.md`).
- **Zoom :** `d3-zoom`, `scaleExtent [1, 12]` — plafond plus élevé que `bird-migrations` (`[1, 6]`), conformément au besoin explicite de passer d'une vue mondiale à un phénomène régional (voir "Zoom/pan" dans `functional-specifications.md`).

## Relief : alignement au redimensionnement

Même mécanisme que `bird-migrations` (voir sa section du même nom dans son `technical-specifications.md`) : `relief.webp` est une image statique pré-rendue une seule fois, réalignée à chaque redimensionnement via une paire d'appels `fitExtent` (une fois sur un rectangle de référence fixe pour obtenir l'échelle/translation de calibration, une fois sur le cadrage réellement affiché pour en déduire l'échelle/décalage à appliquer à l'image).

**Résolu différemment de ce que ce document anticipait à l'origine** (voir ancien "Points à valider à l'implémentation" : une recalibration sur l'étendue mondiale était envisagée) : aucune recalibration n'est nécessaire. Le calcul de calibration (`RELIEF_REF_WIDTH`/`HEIGHT`/`ORIGIN_X`/`ORIGIN_Y`, et le rectangle Europe/Afrique `viewBounds` de `bird-migrations`) est réutilisé strictement à l'identique, y compris ce rectangle Europe/Afrique — jamais affiché ici, gardé uniquement comme ancre de calibration interne (`REFERENCE_VIEW_BOUNDS` dans `render.ts`). Justification géométrique : la projection (`geoNaturalEarth1`, rotation/centre par défaut, jamais modifiés) est la même dans les deux visualisations, et `fitExtent` recalcule entièrement échelle et translation à chaque appel à partir de la géométrie et du rectangle cible fournis — la relation affine entre le cadre de calibration et n'importe quel cadre affiché (ici, l'étendue mondiale de la silhouette plutôt que le rectangle Europe/Afrique) reste valable quel que soit ce second cadre, tant que la projection elle-même ne change pas. Régénérer `relief.webp` ou recalculer de nouvelles constantes de calibration aurait été inutile et risquait d'introduire l'exact désalignement que ce mécanisme cherche à éviter (voir "Piège potentiel à surveiller" dans le `technical-specifications.md` de `bird-migrations`).

## Rendu

**Canvas 2D**, même choix que `bird-migrations` : volume de trajectoires potentiellement significatif une fois les quatre études combinées (onze trajectoires individuelles au total, voir "Sélection des espèces/études" dans `data-model.md`), et cohérence avec la densité du monarque (voir ci-dessous) qui bénéficie aussi d'un rendu Canvas.

**Trois canvas superposés, pas deux comme `bird-migrations`** — divergence imposée par la coexistence de deux mécaniques de rendu incompatibles sur un même calque : l'effet de traînée des trajectoires s'obtient en NE vidant PAS le canvas à chaque frame (un voile translucide `globalCompositeOperation = 'destination-out'` l'estompe progressivement), alors que la densité doit au contraire être entièrement redessinée à chaque frame (elle représente un état courant, pas une traînée qui s'accumule). Un calque supplémentaire sépare les deux : fond (silhouette, relief, cours d'eau) → densité (vidée et redessinée intégralement à chaque frame) → trajectoires (fondu par transparence, jamais vidée directement).

- **Trajectoires (baleines, gnous) :** même mécanique que `bird-migrations` sur le canvas du dessus — effet de traînée (`globalCompositeOperation = 'destination-out'`), interpolation le long du trajet via `d3.geoInterpolate`, tête mobile par individu.
- **Densité (monarque) :** mécanisme distinct, pas de tête mobile ni de trait — chaque cellule de la grille de densité (voir "Format de sortie" dans `data-model.md`) est peinte comme un rectangle sur le canvas de densité, son opacité pilotée par le volume d'observations du mois simulé courant (interpolation douce entre le mois précédent et le mois suivant plutôt qu'un changement abrupt à chaque bascule de mois, pour un rendu de "vague" progressive plutôt que par à-coups — échelle `d3.scaleSqrt`, alpha entre 0,05 et 0,8, calée sur le maximum global toutes cellules/mois confondus). `DENSITY_CELL_DEGREES = 2` répliqué comme constante dans `render.ts`, doit rester synchronisé avec la grille du prétraitement (voir "Prétraitement" dans `data-model.md`).
- **Tooltip densité :** le survol/tap indique un pourcentage relatif au maximum annuel *de cette cellule* (pas un rang global toutes cellules confondues) — cohérent avec "volume relatif" (voir "Interactions" dans `functional-specifications.md`) : une lecture en valeur absolue globale écraserait la variation temporelle propre à chaque lieu derrière l'écart brut entre le pic mexicain hivernal et le reste de l'aire de répartition.
- Le tooltip (élément DOM, pas la carte elle-même) reste en HTML standard, superposé au Canvas, même approche que `bird-migrations`.

## Nouvelles dépendances

Aucune nouvelle dépendance par rapport à `bird-migrations` : `d3-geo`, `d3-scale`, `d3-timer`, `d3-zoom`, `d3-selection`, `topojson-client` suffisent (même liste, voir "Nouvelles dépendances" dans son `technical-specifications.md`), seulement nouvelles pour cette visualisation.

## Palette

Palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`). Quatre espèces (voir "Sélection des espèces/études" dans `data-model.md`), assignées dans l'ordre d'apparition dans `species` :

| Slot | Teinte | Espèce |
|---|---|---|
| 1 | Bleu | Baleine à bosse |
| 2 | Orange | Baleine bleue |
| 3 | Aqua | Gnou à barbe blanche |
| 4 | Jaune | Papillon monarque |

Bien en dessous de la limite de huit slots, pas d'exception à documenter (à la différence de `satellites-in-orbit` et `paris-trees`).

## Animation

- Boucle `d3-timer`, pilotée par un temps simulé en jours (0-365, cyclique), même principe que `bird-migrations` mais sans split automne/printemps (voir "Pas de notion de direction" dans `data-model.md`) : un seul cycle continu, pas deux phases alternées.
- Pour les trajectoires (baleines, gnous) : interpolation `d3.geoInterpolate` entre les deux points encadrants, comme `bird-migrations`.
- Pour la densité (monarque) : la valeur affichée par cellule est celle du mois simulé courant (`Math.floor` du jour simulé converti en mois), pas une interpolation jour par jour comme les trajectoires — la donnée source elle-même n'a qu'une granularité mensuelle (voir "Format de sortie" dans `data-model.md`).
- Sélecteur de vitesse et nom du mois simulé : même mécanisme que `bird-migrations` (`Intl.DateTimeFormat(lang, { month: 'long' })`).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom`, tooltip déclenché par `pointerdown`/`click` plutôt que `pointermove` sur tactile — même mécanisme que `bird-migrations`.

## Pas de bascule vue animée/statique

Divergence par rapport à `bird-migrations` (qui propose une "vue statique" en plus de la vue animée, voir son `functional-specifications.md`) : `animal-migrations` n'a qu'une seule vue, animée en continu. Cohérent avec l'absence de cette bascule dans `functional-specifications.md` de cette visualisation (jamais spécifiée ici) et avec l'absence de notion de direction à comparer statiquement (voir "Pas de notion de direction" dans `data-model.md`) — une vue statique superposerait des trajectoires d'espèces aux échelles géographiques trop différentes (un océan entier contre un territoire d'Afrique de l'Est) pour rester lisible sans l'aide du filtre par espèce combiné à l'animation.

## Points tranchés à l'implémentation

Résolution des points laissés ouverts par la version précédente de ce document :

- **Les deux études de baleines sont exploitables ensemble** (voir "Sélection des espèces/études" dans `data-model.md`) : couverture temporelle et qualité de trajectoire comparables, les deux retenues.
- **Relief : aucune recalibration nécessaire**, voir "Relief : alignement au redimensionnement" ci-dessus — les constantes et le rectangle de calibration de `bird-migrations` sont réutilisés tels quels comme ancre interne, indépendamment du cadrage réellement affiché.
- **Grille de densité du monarque : régulière, 2° × 2°, 570 cellules sur l'Amérique du Nord**, voir "Prétraitement" dans `data-model.md` pour les bornes exactes et la méthode de récupération (adaptée en cours de route : API de recherche publique avec facette mensuelle plutôt que SQL Downloads, faute de compte GBIF disponible).
- **Fichiers de fond de carte copiés** dans `public/data/animal-migrations/`, pas référencés depuis `public/data/bird-migrations/` (voir "Techno carte" ci-dessus).
- **Onze trajectoires individuelles au total** (quatre baleines à bosse, quatre baleines bleues, trois gnous) : l'effet de traînée reste lisible à ce volume, aucun ajustement nécessaire par rapport aux paramètres de `bird-migrations` (opacité du voile, épaisseur de trait).
