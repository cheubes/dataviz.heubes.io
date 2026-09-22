# Spécifications techniques : Le désert médical de demain

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : implémenté.**

## Source des données

Fichiers DREES (XLSX) et data.gouv.fr (TopoJSON), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération et jointure ponctuelles au moment du prétraitement, pas à chaque build.

## Rendu

**Canvas 2D**, volume le plus important du site à ce jour (34 728 polygones communaux). Projection `d3.geoMercator()` avec `fitExtent` sur l'étendue complète de la collection de communes (`topojson-client`, `feature()`).

**Écart avec le brouillon de cadrage, sur trois points, tous des simplifications techniques adoptées après mesure des contraintes réelles :**

1. **Bascule aujourd'hui/demain : deux canvas pré-rendus avec fondu CSS, pas une interpolation de couleur par commune.** Le brouillon envisageait `d3-interpolate` pour animer chaque commune individuellement d'une teinte à l'autre, ce qui aurait demandé de redessiner les 34 728 polygones à chaque frame de la transition (potentiellement des dizaines de fois en quelques centaines de millisecondes). À la place : `canvasToday` et `canvasTomorrow` sont chacun dessinés une seule fois au chargement (et au redimensionnement), superposés, et la bascule anime uniquement l'opacité CSS (`transition: opacity`) du second par-dessus le premier. Le résultat visuel (un fondu progressif entre les deux états) est identique à ce que demandait la spec fonctionnelle, pour un coût de rendu bien moindre (aucun redessin de polygone pendant la transition elle-même).
2. **Survol/tap : canvas d'index par "color picking", pas de test point-dans-polygone.** Tester l'appartenance du curseur à l'un des 34 728 polygones à chaque déplacement de souris (même avec un index spatial en grille façon `paris-trees`) restait plus coûteux que nécessaire. À la place : un troisième canvas invisible (`indexCanvas`), jamais transformé par le zoom/pan, où chaque commune est remplie d'une couleur unique dérivée de son index dans le tableau (`(r<<16)|(g<<8)|b`). Le survol lit un seul pixel (`getImageData(x,y,1,1)`) pour retrouver instantanément la commune, quel que soit le nombre de polygones — complexité constante plutôt que linéaire.
3. **Zoom/pan par transformation CSS du calque, pas par redessin à la projection.** Les autres visualisations à carte du site (`bird-migrations`, `monument-layers`...) recalculent la projection et redessinent au zoom. Ici, le zoom `d3-zoom` pilote une transformation CSS (`translate`/`scale`) appliquée à un `<div>` englobant les trois canvas (aujourd'hui, demain, index visible mais pas le canvas d'index caché) : aucun redessin de polygone pendant le zoom/pan, seule une transformation du bitmap déjà rendu. Chaque canvas est rendu à une résolution supérieure à l'affichage (`RENDER_OVERSAMPLE = 2`, en plus du `devicePixelRatio`) pour rester net dans la plage de zoom retenue (`scaleExtent [1, 8]`, plus réduite que les 1 000 de `monument-layers` : un contenu bitmap zoomé se dégrade au-delà d'un certain facteur, contrairement à des points redessinés à chaque frame).

## Palette

Palette **séquentielle** (voir "Palette dataviz" dans `style-guide.md`) : l'APL est un ordre continu, pas des catégories. `d3.scaleLinear<string>().domain([0, 1.5, 6.5]).range(['#eef5fc', '#3987e5', '#0d366b']).clamp(true)` (`d3-scale` seul, pas `d3-scale-chromatic`, qui aurait été une dépendance nouvelle non discutée pour un résultat équivalent). Domaine calé sur la distribution réelle mesurée à l'implémentation (voir "Distribution réelle" dans `data-model.md`), pas sur le maximum brut. Même domaine et même échelle utilisés pour les deux états de la bascule.

**Échelle à trois paliers plutôt qu'un dégradé linéaire simple, déviation par visualisation par rapport au défaut du style-guide** (voir "Palette dataviz" dans `style-guide.md`, clause de déviation documentée) : un dégradé linéaire simple sur tout le domaine `[0, 6,5]` ne place le seuil éditorial de 1,5 (retenu pour mettre en évidence les communes dont l'accès aux soins est le plus dégradé) qu'à 23% du dégradé, insuffisant pour le faire ressortir. À la place, la teinte extrême claire `#eef5fc` (à peine plus claire que le palier 100, `#cde2fb`, du style-guide, pour rester visuellement distincte de `--dv-surface`, `#ffffff` — éviter toute confusion avec une commune manquante, voir "Piège rencontré et corrigé" dans `data-model.md`) est atteinte à 0, une teinte intermédiaire saturée (`#3987e5`, palier 400 du style-guide) au seuil de 1,5, et la teinte sombre `#0d366b` (palier 700, inchangée) au plafond du domaine (6,5). Le dégradé est ainsi concentré sous 1,5 et plus doux au-delà, tout en restant lisible sur le reste de la distribution (médiane à 2,84, voir "Distribution réelle" dans `data-model.md`).

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-geo` | Projection, tracé des polygones communaux (`geoPath`) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle de couleur séquentielle | Idem |
| `d3-zoom` | Pan/zoom (souris et tactile), piloté en CSS plutôt qu'en redessin (voir "Rendu" ci-dessus) | Idem |
| `d3-selection` | Requis par `d3-zoom` pour s'attacher au canvas | Idem |
| `topojson-client` | Conversion TopoJSON → `Feature[]` exploitables par `d3-geo` | Idem |

**`d3-interpolate` n'est finalement pas utilisée** (voir "Rendu" ci-dessus, point 1) malgré sa présence dans le brouillon de cadrage.

## Chargement progressif

`communes.json` (9,0 Mo, voir "Poids du fichier" dans `data-model.md`) est récupéré via `fetch` puis lu en flux (`response.body.getReader()`) plutôt qu'un simple `.json()` : la progression réelle (pourcentage d'octets reçus sur `content-length`) alimente l'indicateur de chargement (voir "États" dans `functional-specifications.md`), le corps complet n'étant parsé (`JSON.parse`) qu'une fois entièrement reçu.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Pan/zoom tactile via `d3-zoom` ; fiche de détail déclenchée par `pointerdown`/`click` plutôt que `pointermove` sur tactile.
