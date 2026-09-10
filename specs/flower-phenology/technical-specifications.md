# Spécifications techniques : Le calendrier des fleurs

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Rendu

D3 v7 seul (`d3-shape` pour les arcs, `d3-scale` pour l'échelle angulaire des jours de l'année, `d3-transition` pour l'animation d'un anneau quand sa décennie change). Rendu SVG : volume de données faible (au plus 15 espèces × 2 décennies visibles), pas d'enjeu de performance justifiant Canvas ici, à la différence des migrations.

Pas de carte, pas de TopoJSON, pas de `topojson-client` : seule visualisation des trois sans fond géographique.

## Zone de montage : ratio 1:1 (exception documentée)

**`aspect-ratio: 1 / 1` sur la zone de montage, pas le calcul `largeur × 0,6` de la hauteur par défaut du site** (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) : seule visualisation du site dont le rendu est un cadran radial, dont la géométrie exige une zone carrée (le `viewBox` SVG est dimensionné sur `size = largeur`, voir "Rendu" ci-dessus) ; y appliquer un rectangle non carré déformerait le cercle plutôt que de simplement recadrer une carte.

Reste toutefois soumise au même plafond que les autres visualisations (espace disponible entre header et footer, contrôles compris) : plutôt qu'une hauteur bridée (qui casserait le carré, largeur et hauteur restant liées par `aspect-ratio`), c'est la largeur du carré qui est bridée (`max-width` recalculé au redimensionnement, en plus du `max-width: 640px` fixe déjà en CSS) à la valeur qui, une fois la hauteur dérivée par `aspect-ratio`, respecte ce plafond.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-shape` | Générateur d'arcs (bande p10-p90, tick de médiane) | Scopée à cette visualisation (île Astro) |
| `d3-scale` | Échelle angulaire linéaire du jour de l'année (déjà une dépendance du site via `bird-migrations`) | Partagée par convention npm, usage scopé à cette visualisation |
| `d3-selection`, `d3-transition` | Sélections DOM et transition d'un anneau lors d'un changement de décennie (déjà `d3-selection` via `bird-migrations`) | Scopée à cette visualisation |

## Fond du calendrier (tranché à l'implémentation)

**Fond clair standard (`--dv-surface`)**, cohérent avec le reste du site en thème clair fixe (voir "Couleurs" dans `style-guide.md`) : pas de rupture visuelle avec le reste de la page. Contrepartie assumée : contraste plus faible pour les teintes claires de la palette bespoke (voir "Palette" ci-dessous), mitigée par un liseré neutre autour de chaque arc plutôt que par un changement de fond.

## Palette (exception documentée)

Palette bespoke "couleur réelle de la fleur" plutôt que la palette catégorielle officielle (voir "Palette dataviz" dans `style-guide.md`, qui permet une exception documentée et validée pour un besoin propre à une visualisation).

**Justification :** la palette officielle est plafonnée à huit teintes fixes ("jamais cyclée au-delà"), incompatible avec jusqu'à 15 espèces affichées simultanément ; et le concept éditorial de cette pièce repose sur la couleur comme évocation directe de la fleur elle-même (jaune du pissenlit, rouge du coquelicot...), pas comme code catégoriel arbitraire.

**Validation effectuée** (`scripts/validate_palette.js` du skill dataviz, `--mode light`, fond `--dv-surface`) sur les douze couleurs de `flowerColor` (voir "Sélection des espèces" dans `data-model.md`) :

- **Séparation CVD / vision normale :** un doublon quasi indissociable a été détecté et corrigé avant retenue définitive des couleurs : le crocus (`#B89AE0` dans le draft) et la lavande (`#9B72CF`) ne passaient pas le seuil de 15 ΔE même après la "correction" déjà notée dans le draft d'origine ; le crocus a été éclairci à `#C9A8E8` (ΔE 15.8, passe). La jonquille sauvage (nouvelle espèce, voir `data-model.md`) a été choisie en `#C97A0A`, un ambre nettement séparé du jaune du pissenlit (`#F0C040`, ΔE 18.7) après plusieurs essais trop proches.
- **Limite résiduelle assumée, non corrigible dans la contrainte éditoriale :** les trois teintes quasi blanches (prunellier `#F4F1EA`, muguet `#EDEAE0`, anémone `#E5E2D8`) restent en-dessous du seuil de séparation deux à deux (ΔE ~2-5), y compris après plusieurs tentatives de les distinguer par la teinte tout en restant crédibles comme "blanc de fleur" (voir "Blanc pur évité" dans `data-model.md`). Le validateur échoue aussi sur le plancher de chroma et la bande de luminosité pour ces mêmes teintes claires, et sur le contraste au fond (`--dv-surface`) pour la plupart des couleurs pâles de la palette (sous 3:1). Ces échecs sont **acceptés comme limite documentée** de l'exception "couleur réelle de la fleur" (même logique que les trois teintes sous 3:1 déjà acceptées dans la palette catégorielle officielle du site, voir `style-guide.md`) : la lecture ne repose jamais sur la teinte seule (voir mitigation ci-dessous).
- **Mitigation (contrepartie obligatoire d'un WARN de contraste non ignorable, voir le skill dataviz) :** chaque arc porte un liseré `1px` `var(--dv-gridline)` pour rester visible quel que soit son contraste de remplissage contre le fond ; le nom de l'espèce reste affiché en toutes lettres à côté de sa pastille dans le sélecteur (jamais la couleur seule) ; le tooltip nomme l'espèce au survol/tap de son arc.

## Sélecteur d'espèces : plafond de quinze non implémenté

Avec les douze espèces finalisées dans `data-model.md`, le plafond de quinze sélections simultanées documenté dans `functional-specifications.md` ("Interactions") ne peut pas être atteint : aucune logique de blocage ou d'éviction n'a été implémentée pour ce cas (voir "Minimalisme" dans `CLAUDE.md`). Si la liste d'espèces est étendue au-delà de quinze dans une future itération, cette logique reste à ajouter.

## Hydratation

`client:visible`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.
