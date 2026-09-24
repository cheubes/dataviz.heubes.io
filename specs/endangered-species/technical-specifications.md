# Spécifications techniques : Ce qu'il en reste

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Source des données

Une source officielle par espèce (voir "Dataset source" dans `data-model.md`), pas un historique IUCN Red List unique (source initialement retenue, abandonnée : voir "Historique : abandon de la source IUCN Red List" dans `data-model.md`). Récupération ponctuelle au moment du prétraitement, pas à chaque build.

## Rendu

**SVG, pas Canvas** : quatre à six petits multiples seulement (voir "Sélection des espèces" dans `data-model.md`), aucun rapport avec le volume qui a justifié Canvas sur les visualisations à carte du site. **Pas de carte géographique** ici, à la différence de `bird-migrations`, `monarch-migration`, `monument-layers` ou `light-pollution` : l'angle retenu (voir "Angle retenu" dans `data-model.md`) est délibérément sans dimension spatiale, chaque espèce est une carte de petits multiples, pas un point sur un planisphère.

**Rendu basé uniquement sur les effectifs** (décision explicite de l'utilisateur, voir échanges de cadrage) : pas de dimension catégorielle affichée (l'ancienne catégorie de menace IUCN disparaît avec l'abandon de cette source, voir `data-model.md`), pas de mapping couleur ↔ donnée. Le nombre d'icônes affichées porte seule le message pour les données ; la couleur, elle, vient d'une illustration par espèce plutôt que d'une teinte plate (voir "Fond de carte illustré par espèce" ci-dessous), décision revenue en cours d'implémentation après une première version à fond neutre.

- Chaque carte d'espèce affiche une grille d'icônes SVG simples, une seule silhouette générique (empreinte de patte, voir "Iconographie" dans `style-guide.md` : pas de bibliothèque d'icônes, SVG inline minimal) réutilisée pour les six espèces plutôt qu'une silhouette propre à chacune — cohérent avec le rendu volontairement dépouillé de cette visualisation (voir ci-dessus). Une icône représente un nombre fixe d'unités propre à chaque espèce (`iconRatio` dans le JSON, voir "Format de sortie" dans `data-model.md` ; ex. 1 icône = 100 individus pour le tigre, 1 icône = 10 individus pour la vaquita), ce ratio choisi pour que le nombre d'icônes affichées reste dans une fourchette lisible (grossièrement 10 à 80 icônes selon l'espèce) quel que soit le point de mesure.
- Le nombre d'icônes affichées à un instant simulé donné est calculé par interpolation linéaire (`d3.interpolateNumber`) entre les deux points de mesure qui encadrent cet instant, puis divisé par `iconRatio` et arrondi.
- Les icônes et le nom de l'espèce restent en blanc, constant (pas de teinte par espèce) : le fond illustré (voir ci-dessous) porte déjà une identité visuelle propre à chaque espèce, les éléments de texte/données au-dessus n'ont pas besoin d'en ajouter une deuxième.
- Le grand hamster d'Alsace affiche "terriers actifs" plutôt que "individus" dans son intitulé et sa fiche de détail (`unit` dans le JSON, voir "Points d'attention" dans `data-model.md`) ; les deux points vaquita construits à partir d'une fourchette source affichent cette fourchette (`populationLabel`) dans la fiche de détail plutôt que le point médian utilisé pour le calcul du nombre d'icônes.

## Fond de carte illustré par espèce

Chaque carte a pour fond une illustration propre à son espèce, fournie par l'utilisateur (`public/data/endangered-species/<species-id>.jpg`, un fichier par espèce, même nom que l'`id` du JSON — voir "Format de sortie" dans `data-model.md`), plutôt qu'une teinte plate ou la palette catégorielle du site : décision de l'utilisateur après discussion (l'alternative envisagée, une teinte par espèce puisée dans la palette catégorielle, écartée au profit d'une illustration). Les six illustrations partagent un même style graphique (aplat sombre bleu marine/doré), fournies déjà au bon ratio pour la taille fixe des cartes (1040 × 840 px, soit le même ratio que 260 × 210 px). Recompressées au moment de l'ajout (JPEG progressif qualité 82, voir "Performance" dans `technical-specifications.md` général), passées de 290-480 Ko à 93-211 Ko chacune sans perte visible.

Un voile sombre semi-transparent (`rgba(13, 13, 12, 0.45)`, superposé en `linear-gradient` au-dessus de l'image) garantit un contraste suffisant pour le nom de l'espèce et les icônes (passés en blanc, voir "Rendu" ci-dessus) quelle que soit la zone de l'illustration derrière eux, plutôt que de dépendre de la luminosité propre à chaque image à cet endroit précis.

**Provenance :** travail original de l'utilisateur (confirmé, voir échanges de cadrage), pas de mention de crédit/licence tierce nécessaire, à la différence des jeux de données de population (voir "Dataset source" dans `data-model.md`).
- **Cartes de taille fixe** (retour utilisateur explicite après une première version à hauteur variable) : la grille d'icônes est une grille CSS à colonnes et lignes fixes (10 colonnes × 8 lignes, 80 emplacements), dimensionnée pour le maximum réel observé (77 icônes, grand hamster d'Alsace en 2024), plutôt qu'une hauteur qui grandit avec le nombre d'icônes. Les emplacements non utilisés restent vides ; la carte entière (en-tête compris) a donc la même largeur et la même hauteur quelle que soit l'espèce ou l'instant simulé.

## Animation

- **Lecture automatique en boucle** (revu après retour utilisateur ; la première version faisait un passage unique sans boucler, voir échanges de cadrage) : boucle `d3-timer` avançant d'année en année sur le domaine `[point de mesure le plus ancien toutes espèces confondues, point de mesure le plus récent]`, une pause de 2 s sur la dernière année avant de reboucler au point de départ, même convention que `light-pollution` (`STEP_MS`/`HOLD_MS`).
- **Trois vitesses** (Lent ×0,5 / Normal ×1 / Rapide ×2, mêmes facteurs que `light-pollution`/`satellites-in-orbit`) appliquées à la durée par année (`STEP_MS`).
- **Curseur d'année natif** (`<input type="range">`, un cran par année, avec graduations, même convention que `light-pollution`) synchronisé avec la lecture automatique ; le déplacer manuellement met la lecture en pause (même comportement que `light-pollution`).
- Toutes les cartes partagent la même chronologie simulée : une espèce dont les mesures démarrent plus tard que les autres reste à son état initial (premier point connu) jusqu'à cette date.
- Le nombre d'icônes à l'année simulée courante reste calculé par interpolation (voir "Rendu" ci-dessus) même si l'avancée du curseur se fait année par année : une espèce sans mesure exactement sur l'année courante affiche un effectif interpolé entre ses deux mesures les plus proches, pas une valeur figée jusqu'à la prochaine mesure réelle.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-interpolate` | Interpolation de la population entre deux points de mesure connus (`interpolateNumber`) | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

Pas de `d3-scale` ici (déjà une dépendance du projet, mais pas utilisée par cette visualisation : l'avancée année par année ne nécessite pas d'échelle, voir "Animation" ci-dessus), ni `d3-geo`, `d3-zoom` ou `d3-selection` (voir "Rendu" ci-dessus : pas de carte géographique, pas de pan/zoom).

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que les autres visualisations du site.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `year` | Année entière entre les bornes du curseur d'année (point de mesure le plus ancien au plus récent, toutes espèces confondues) | Lecture en cours |

- `year` est écrit à la pause (bouton) et au relâchement du curseur d'année, et retiré à la reprise de la lecture. Un lien porteur de `year` ouvre les petits multiples en pause sur cette année.
- Un lien ou un curseur posé sur la dernière année reprend la lecture, une fois relancée, par la pause brève de fin de passage (`HOLD_MS`) avant de reboucler à la première année, plutôt que de rester bloqué sur cette année.
- Pas de filtre ni de cadrage à capturer (voir "Interactions" dans `functional-specifications.md`). La fiche de détail épinglée n'est pas capturée (état transitoire).

## Points tranchés à l'implémentation

Tous les points laissés ouverts au cadrage sont désormais résolus (voir "Dataset source", "Sélection des espèces" et "Points d'attention actés" dans `data-model.md`) : sources et chiffres réels vérifiés, six espèces conservées, silhouette générique unique (empreinte de patte) et `iconRatio` fixés par espèce dans le JSON.
