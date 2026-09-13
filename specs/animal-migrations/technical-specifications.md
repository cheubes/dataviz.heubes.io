# Spécifications techniques : Les grandes migrations

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Techno carte

D3 v7, même stack que `bird-migrations`, pas de Leaflet.

- **Fond de carte, cours d'eau, relief : réutilisation directe des assets de `bird-migrations`.** `public/data/bird-migrations/basemap.json` (silhouette terrestre), `rivers.json` (cours d'eau) et `relief.webp` (relief ombré) couvrent déjà le monde entier, pas seulement le rectangle Europe/Afrique cadré par cette visualisation (voir "Couverture mondiale" dans son `data-model.md` et "Fond de carte"/"Cours d'eau"/"Relief" dans son `technical-specifications.md`) : ces trois fichiers sont directement exploitables ici sans nouvelle extraction ni nouveau prétraitement, seul le `fitExtent` change (voir "Projection" ci-dessous). À confirmer à l'implémentation que copier ou référencer ces fichiers depuis `public/data/animal-migrations/` reste cohérent avec "Règles communes à toutes les visualisations" (données propres à chaque visualisation) plutôt qu'un partage direct entre dossiers.
- **Projection :** `d3.geoNaturalEarth1` (même choix que `bird-migrations`, adaptée à une vue mondiale complète, contrairement à une projection conforme qui déformerait excessivement les hautes latitudes), `fitExtent` sur l'étendue complète de la silhouette (pas un rectangle de cadrage régional comme `bird-migrations`) : le planisphère entier est visible par défaut (voir "Vue initiale" dans `functional-specifications.md`).
- **Relief : alignement au redimensionnement** — même mécanisme que `bird-migrations` (voir sa section du même nom dans son `technical-specifications.md`), avec une résolution de référence à recalibrer sur l'étendue mondiale plutôt que sur le rectangle Europe/Afrique (voir "Points à valider à l'implémentation" ci-dessous).

## Rendu

**Canvas 2D**, même choix que `bird-migrations` : volume de trajectoires potentiellement significatif une fois les quatre études combinées (baleine bleue seule : 92 trajectoires de plus de sept jours, voir "Dataset source" dans `data-model.md`), et cohérence avec la densité du monarque (voir ci-dessous) qui bénéficie aussi d'un rendu Canvas.

- **Trajectoires (baleines, gnous) :** même mécanique que `bird-migrations` — deux canvas superposés (fond redessiné au redimensionnement/zoom, premier plan pour les trajectoires), effet de traînée (`globalCompositeOperation = 'destination-out'`), interpolation le long du trajet via `d3.geoInterpolate`, tête mobile par individu.
- **Densité (monarque) :** mécanisme distinct, pas de tête mobile ni de trait — chaque cellule de la grille de densité (voir "Format de sortie" dans `data-model.md`) est peinte sur le même canvas de premier plan, son opacité pilotée par le volume d'observations du mois simulé courant (interpolation douce entre le mois précédent et le mois suivant plutôt qu'un changement abrupt à chaque bascule de mois, pour un rendu de "vague" progressive plutôt que par à-coups).
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

## Points à valider à l'implémentation

- Confirmation que les deux études de baleines restent exploitables ensemble (voir "Sélection des espèces/études" dans `data-model.md`).
- Résolution de référence du relief recalibrée sur l'étendue mondiale complète plutôt que sur le rectangle Europe/Afrique de `bird-migrations` (voir "Relief : alignement au redimensionnement" dans son `technical-specifications.md` pour la mécanique de calcul à reproduire avec un nouveau rectangle de référence).
- Grille de sortie retenue pour la densité du monarque (résolution, format), une fois le volume réel d'occurrences GBIF mesuré (voir "Prétraitement" dans `data-model.md`).
- Modalité exacte de réutilisation des fichiers `basemap.json`/`rivers.json`/`relief.webp` de `bird-migrations` (copie dans `public/data/animal-migrations/` vs référence directe), à trancher au regard des conventions de structure de fichiers du site.
- Volume réel de trajectoires une fois les études de baleines inspectées, pour confirmer que l'effet de traînée reste lisible avec un nombre d'individus potentiellement plus élevé que `bird-migrations`.
