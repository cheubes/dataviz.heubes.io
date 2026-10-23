# Spécifications techniques : La mer monte à Brest

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Source des données

Fichier annuel RLR du PSMSL pour la station Brest (identifiant `1`), récupéré une fois au prétraitement puis figé dans `public/data/brest-sea-level/sea-level.json` (voir "Prétraitement" et "Format de sortie" dans `data-model.md`). Pas d'appel au PSMSL à l'exécution ni au build.

## Rendu

SVG, comme `grape-harvest-almanac` : une seule série de 187 points, quelques centaines de pierres pour le mur, aucun enjeu de volume qui justifierait Canvas. Un seul `<svg>` dessiné dans cet ordre (du fond vers l'avant) :

1. **Mur :** assises et pierres (voir "Mur procédural" ci-dessous).
2. **Eau :** une aire (`d3.area`) du pied du mur jusqu'au niveau annuel, puis la ligne de surface (`d3.line`) par-dessus.
3. **Mentions des lacunes** (texte).
4. **Tendances gravées :** trois segments droits et leurs étiquettes.
5. **Tête de lecture, trait vertical de survol, tooltip.**
6. **Échelle de marée**, dans sa propre colonne à droite du mur (voir "Échelle de marée" ci-dessous).

**Échelles :** `d3.scaleLinear` pour les années (abscisse, domaine `[1807, dernière année + 1]`) et pour l'écart au niveau de référence en cm (ordonnée, domaine arrondi aux assises de 5 cm qui encadrent l'étendue réelle des données, soit `[-10, +30]` cm aujourd'hui). Le mur et l'échelle de marée partagent exactement la même échelle verticale : une même hauteur d'eau est au même niveau sur les deux.

**Position des années :** la moyenne d'une année est placée au milieu de l'année (`year + 0,5`), comme le fait le PSMSL pour ses moyennes mensuelles. La surface est une ligne droite entre années consécutives (`curveLinear`) : pas de lissage, qui inventerait des valeurs entre les moyennes publiées, ni de marches (`curveStep`), qui donneraient une eau en escalier sans rapport avec l'image du quai.

**Lacunes :** `area.defined()` et `line.defined()` coupent l'eau et la surface sur toute année absente de `years` (voir "Format de sortie" dans `data-model.md`), même principe que les "Lignes discontinues" de `grape-harvest-almanac` : aucune eau n'est tracée entre deux années séparées par une lacune. Un segment réduit à une seule année (aucun aujourd'hui, possible après une mise à jour) est tracé comme un palier d'un an de large, pour rester visible. Mentions des lacunes : au-dessus du niveau d'eau le plus haut des années voisines, centrées sur la lacune, seulement pour les lacunes de plus de trois ans (1836-1845, 1857-1860, 1944-1952) ; la mention propre de 1944-1952 est un texte d'interface (voir "Contenu" dans `functional-specifications.md`), pas une donnée du JSON.

**Années de mi-marée corrigées (1807-1835) :** même aire d'eau, mais surface en pointillé (`stroke-dasharray`), dessinée comme un segment de ligne séparé des années suivantes (une lacune de dix ans les sépare de toute façon).

**Tendances gravées :** chaque période de `trends` est un segment de `(startYear + 0,5, startLevelMm)` à `(endYear + 0,5, endLevelMm)`, ramenés en écart au niveau de référence. Les trois segments ne se raccordent pas (régressions indépendantes, voir "Format de sortie" dans `data-model.md`) : laissés tels quels, sans raccord artificiel. Étiquette au-dessus de la fin de chaque segment ("1,3 mm/an"), formatée par `Intl.NumberFormat` selon la langue ; une pente qui s'arrondit à zéro s'affiche "≈ 0 mm/an". Un segment n'est dessiné que lorsque la tête de lecture a dépassé `endYear` (voir "Interactions" dans `functional-specifications.md`).

## Mur procédural

Pas d'image : le mur est généré en SVG à chaque mise en page, à partir de l'échelle verticale.

- **Assises :** une bande horizontale par tranche de 5 cm d'écart (huit assises pour `[-10, +30]` cm). Leur hauteur à l'écran découle donc directement de l'échelle : les joints horizontaux tombent exactement sur les graduations de 5 cm et servent de lignes de grille.
- **Pierres :** chaque assise est découpée en pierres de largeur variable (entre 1,2 et 2,2 fois la hauteur d'assise), joints verticaux décalés d'une assise à l'autre (appareil en quinconce). Les largeurs viennent d'un générateur pseudo-aléatoire à graine fixe : le mur est identique pour tous les visiteurs et à chaque redimensionnement de même taille, et ne "scintille" pas pendant la lecture.
- **Graduations :** textes gravés au bord gauche, sur la pierre, à chaque joint multiple de 10 cm ("0", "+10 cm", "+20 cm" ; "-10 cm" au pied si l'assise existe). Le "0" porte en plus la mention "niveau moyen du dix-neuvième siècle" / "19th-century mean" sur les écrans assez larges.
- **Axe des années :** sous le mur, hors de la pierre, graduations tous les 25 ans (tous les 50 ans sur écran étroit, voir "Responsive" ci-dessous).

**Asset à produire, optionnel :** des éléments de décor dessinés (bitte d'amarrage, échelle de quai scellée dans le mur, texture de granit), en SVG inline minimal ou fournis par l'auteur comme les illustrations d'`endangered-species`. Non requis par cette spec : le mur procédural suffit à porter la métaphore, et tout décor ajouté reste dans les couleurs d'illustration ci-dessous, sans encoder de donnée. Voir "Points à valider".

## Échelle de marée

Colonne de largeur fixe (environ 88 px) à droite du mur, dans le même `<svg>` :

- Règle verticale, graduée tous les centimètres (trait court), tous les 5 cm (trait moyen) et chiffrée tous les 10 cm, sur l'échelle verticale du mur.
- Eau montée jusqu'à l'écart de l'année de la tête de lecture, mêmes couleurs que l'eau du mur ; règle sèche sur une année sans mesure.
- Au-dessus de la règle, en texte HTML superposé (pas en texte SVG, pour la taille de police et l'accessibilité) : l'année en `h3` visuel et l'écart en grand ("+29,2 cm"), puis la légende "par rapport au niveau moyen du dix-neuvième siècle" en texte secondaire. Ce bloc est la région `aria-live` décrite dans "Accessibilité".

## Palette

Une seule série : pas de palette catégorielle. Deux familles de couleurs, déjà définies dans `style-guide.md` :

| Élément | Couleur | Source dans `style-guide.md` |
|---|---|---|
| Eau (aire, mur et échelle de marée) | `#86b6ef` | Séquentielle bleue, palier 250 |
| Surface de l'eau (trait 1,5 px) | `#1c5cab` | Séquentielle bleue, palier 550 |
| Pierres | `#e4e2da` | Fond de carte (illustration) : silhouette |
| Joints entre pierres (1 px) | `#b3a696` | Fond de carte (illustration) : frontières de plaques tectoniques |
| Tendances gravées (trait 2 px) et leurs étiquettes | `--dv-ink-primary` | Palette de l'interface |
| Graduations, mentions des lacunes, axe des années | `--dv-ink-secondary` | Palette de l'interface |
| Tête de lecture, trait vertical de survol (1 px) | `--dv-ink-secondary` | Palette de l'interface |
| Face de l'échelle de marée | `--dv-surface` | Palette de l'interface |
| Graduations de l'échelle de marée | `--dv-ink-primary` | Palette de l'interface |

**Justification et écarts :**
- **Eau en bleu séquentiel**, pas en `#a8c5da` (hydrographie) : ici l'eau est la donnée elle-même, et la charte réserve les couleurs d'illustration au décor ("jamais réutilisées pour encoder une donnée"). Le bleu séquentiel est la teinte de magnitude par défaut du site.
- **Pierres et joints en couleurs d'illustration :** le mur est un décor, au même titre qu'un fond de carte. C'est toutefois un usage nouveau de ces teintes, hors d'une carte : la liste des visualisations qui les utilisent, dans "Fond de carte (illustration)" de `style-guide.md`, devra mentionner `brest-sea-level` (voir "Points à valider").
- **Contrastes à vérifier** avec le script de validation du skill dataviz, à l'implémentation : ratios WCAG calculés lors de la rédaction de ces specs : surface `#1c5cab` sur pierre `#e4e2da` 5,1:1 ; aire `#86b6ef` sur pierre 1,6:1 seulement, d'où le trait de surface, qui porte seul la lecture du niveau ; étiquettes `--dv-ink-primary` (`#444444`) sur l'eau 4,6:1 et sur la pierre 7,5:1. Un halo `--dv-surface` de 3 px derrière les étiquettes reste prévu si la lecture sur l'eau s'avère difficile à l'usage.
- Pas de couleur pour distinguer les trois périodes de tendance : leurs étiquettes et leur pente suffisent, et une teinte par période suggérerait trois séries.

## Animation

- Boucle `d3-timer`, passage unique sur `[1807, dernière année]`, une année par pas de `STEP_MS` = 70 ms, soit environ quinze secondes pour 217 années (lacunes comprises : la tête de lecture traverse les lacunes au même rythme, pour que la durée à l'écran reste proportionnelle au temps). Pas de boucle, pas de pause de fin : en fin de passage, la boucle s'arrête sur la vue complète.
- Chaque pas redessine directement l'état de l'année courante (aire et surface coupées à la tête de lecture, échelle de marée, tendances terminées) : aucune transition `d3-transition` ni CSS sur des éléments qui se déplacent. La préférence de mouvement réduit (voir "Accessibilité" dans `technical-specifications.md` général) n'a donc rien à neutraliser ; elle est lue par `prefersReducedMotion()` pour la forme, sans effet, la vue d'ouverture étant déjà l'état final en pause (voir "Mouvement réduit" dans `functional-specifications.md`).
- Coupure de l'eau à la tête de lecture : un `clipPath` dont la largeur suit la tête de lecture, plutôt que de recalculer les chemins à chaque pas.
- Curseur d'année natif (`<input type="range">`, un cran par année), synchronisé avec la lecture ; le déplacer met en pause.

## Nouvelles dépendances

Aucune. `d3-scale`, `d3-shape` et `d3-timer` sont déjà des dépendances du site (avec leurs `@types`), réutilisées à l'identique et scopées à cette visualisation par l'île Astro. Pas de `d3-selection` ni `d3-transition` : interactions et mises à jour en JS natif, comme `grape-harvest-almanac`.

## Vue tableau (calcul au build)

`src/components/visualizations/brest-sea-level/table.ts` (voir "Vue tableau des données" dans `technical-specifications.md` général) lit `sea-level.json` via `readDataFile`, groupe les années par décennie (`Math.floor(year / 10) * 10`), et calcule pour chacune le nombre d'années renseignées, la moyenne des écarts, l'année la plus basse et la plus haute (voir "Vue tableau" dans `functional-specifications.md`). Écarts convertis en cm, formatés avec signe explicite (`Intl.NumberFormat`, `signDisplay: 'exceptZero'`, une décimale).

## Hydratation

`client:visible`.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. En complément :

- Le `<svg>` porte `role="img"` et un `aria-label` statique tiré du dictionnaire i18n, qui résume la visualisation ("Niveau moyen annuel de la mer à Brest de 1807 à 2023 : stable au dix-neuvième siècle, en hausse depuis 1900, plus rapide depuis 1993").
- Le bloc de lecture de l'échelle de marée (année et écart) est une région `aria-live="polite"`, mise à jour seulement sur action du visiteur (curseur, pause), jamais à chaque pas de la lecture, pour ne pas saturer le lecteur d'écran.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

- Hauteur de la zone de montage : calcul par défaut du site (`max(320px, min(largeur × 0,6, plafond))`, voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général), sans écart.
- Sous 640 px de largeur de zone de montage (seuil indicatif, à ajuster à l'implémentation) : la colonne de l'échelle de marée disparaît au profit de la lecture compacte au-dessus du mur, l'axe des années passe à une graduation tous les 50 ans, les étiquettes de tendance se réduisent à la vitesse.
- À 360 px de large, une année occupe environ 1,5 px : l'eau reste lisible comme une surface, le survol s'accroche à l'année la plus proche du doigt.
- Pas de zoom ni de pan : `touch-action` par défaut, le défilement de la page fonctionne au-dessus du quai, comme pour `grape-harvest-almanac`.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `year` | Année entière entre 1807 et la dernière année de `years`, y compris une année sans mesure | Vue complète (dernière année), en pause |

- `year` est écrit à la pause (bouton) et au relâchement du curseur d'année, et retiré au lancement de la lecture. Un lien porteur de `year` ouvre le quai en pause sur cette année.
- La vue complète est l'état par défaut : une pause ou un curseur posé sur la dernière année retire `year` de l'URL au lieu de l'écrire, et un lien `?year=<dernière année>` ouvre la vue complète. L'URL reste nue dans l'état initial.
- Une valeur hors bornes ou non entière est ignorée (vue complète). Après une mise à jour qui prolonge la série, un lien ancien reste valide et désigne la même année.
- Le tooltip et le trait vertical de survol ne sont pas capturés.

## Points à valider

Décisions de conception prises dans ces specs, à confirmer par l'auteur avant implémentation :

1. **Forme "quai déroulé"** (temps le long du quai, hauteur sur les assises, échelle de marée au bout) plutôt que l'idée initiale d'une ligne d'eau unique montant le long d'un mur, pour rendre l'accélération lisible (voir "Composition" dans `functional-specifications.md`).
2. **Pas de lecture automatique à l'ouverture :** la page s'ouvre sur la vue complète en pause, la lecture est un choix du visiteur. Écart assumé avec la plupart des visualisations animées du site, qui démarrent seules.
3. **Lecture en un passage d'environ quinze secondes, sans sélecteur de vitesse ni boucle.**
4. **Niveau de référence = moyenne 1807-1899** (affiché "niveau moyen du dix-neuvième siècle"), plutôt que le zéro RLR ou une période récente.
5. **Découpage des tendances en trois périodes** 1807-1899 / 1900-1992 / 1993-2023, 1993 étant retenu comme début conventionnel de l'altimétrie satellitaire et non ajusté sur la série. Alternative écartée : une courbe de vitesse glissante, trompeuse à une seule station (voir `data-model.md`).
6. **Source PSMSL (RLR annuel) plutôt que SONEL ou les mesures horaires du Shom** (voir "Licence et politique de données" dans `data-model.md`).
7. **Pas de téléchargement des données préparées** (pas d'attribut `downloads`), faute d'autorisation explicite de redistribution. Option : écrire au PSMSL (psmsl@noc.ac.uk) ou au Shom pour obtenir une confirmation écrite, puis rouvrir la question.
8. **Mise à jour de `style-guide.md`** nécessaire avant implémentation : ajouter `brest-sea-level` à la liste des visualisations qui utilisent les couleurs "Fond de carte (illustration)" (pierres `#e4e2da`, joints `#b3a696`), en précisant cet usage hors carte. Non appliquée ici (hors du dossier de cette visualisation).
9. **Eau en bleu séquentiel** (paliers 250 et 550) plutôt qu'en teinte d'hydrographie, et contrastes à valider par le script du skill dataviz (voir "Palette").
10. **Décor illustré optionnel** (bitte, échelle de quai, texture) : à produire ou non ; par défaut, mur procédural seul, sans asset.
11. **Surface de l'eau en ligne droite entre milieux d'années**, sans lissage ni marches ; années 1807-1835 en pointillé.
12. **Thème `climate` seul** (`earth` envisageable, le sujet touchant aussi au mouvement du sol).
13. **Titre et résumé** (FR/EN) et présentation longue, en particulier la formulation du mouvement vertical du sol (nul selon le nivellement, environ -1 mm/an selon la gravimétrie, non corrigé).
14. **Lieu exact du marégraphe** ("sur un quai du port militaire") à confirmer avant publication, non vérifié dans les sources consultées.
15. **Saut entre les décennies 1900 et 1910** (+7,6 cm d'une décennie à l'autre), sans explication dans la documentation PSMSL : ni commenté ni corrigé, à garder tel quel sauf source contraire.
16. **Image de couverture** à produire (`src/assets/covers/brest-sea-level.png`, capture du quai en vue complète), selon le workflow général.
