# Spécifications techniques : La ruée vers l'orbite

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

**Statut : brouillon de cadrage, pas encore implémenté.**

## Source des données

CelesTrak SATCAT (`records.php`, format JSON), voir "Dataset source" et "Prétraitement" dans `data-model.md`. Récupération ponctuelle au moment du prétraitement, pas à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) : conforme à la politique d'usage de CelesTrak, qui décourage les requêtes répétées et recommande de ne récupérer les données qu'au moment du besoin. Citation d'attribution (CelesTrak, USSPACECOM/Space-Track.org) dans le bloc de crédit des sources de la page (voir "Dataset source" dans `data-model.md` pour la décision de licence).

## Rendu

**Canvas 2D, pas SVG**, même choix que `bird-migrations` et pour la même raison : volume de points important (dix à quinze mille attendus, voir `data-model.md`), hors de portée d'un rendu SVG performant.

- Globe stylisé : un cercle simple avec un dégradé radial (pas de silhouette continentale, pas de géographie réelle), dessiné une fois sur un canvas de fond, redessiné seulement au redimensionnement.
- Nuée de points : canvas de premier plan. À la différence de `bird-migrations` (points mobiles avec effet de traînée), les points ici sont statiques une fois apparus : pas besoin d'effacer/redessiner l'ensemble de la nuée à chaque frame. Chaque nouveau point (satellite dont la date de lancement simulée vient d'être atteinte) est simplement peint par-dessus le canvas existant. Un changement de filtre zone ou un "Rejouer" vide le canvas de premier plan et reconstruit la nuée déjà accumulée en une seule passe avant de reprendre l'accumulation frame par frame.
- D3 utilisé pour les calculs (échelle de couleur catégorielle par zone via `d3-scale`, boucle d'animation via `d3-timer`), pas pour le rendu DOM des points.

## Positionnement des points

Pas d'orbite réelle représentée (décision explicite, voir échanges de cadrage) : chaque satellite occupe une position en halo autour du globe, pas sa position orbitale réelle.

- Angle : tiré uniformément entre 0 et 360°.
- Rayon : tiré dans une bande fixe au-delà du rayon du globe (ex. entre 1,15 et 1,6 fois le rayon du globe), pour donner un effet de profondeur à la nuée sans porter de signification orbitale (pas de correspondance avec l'altitude réelle).
- Tirage déterministe, dérivé de l'index du satellite dans `satellites.json` (ex. générateur pseudo-aléatoire à seed fixe) plutôt qu'un vrai `Math.random()` : la disposition reste identique entre un chargement de page et un "Rejouer", pas de re-tirage à chaque relecture.

## Animation

- Boucle `d3-timer`, pilotée par une date simulée continue (pas un compteur de jours cyclique comme `bird-migrations` : ici l'échelle couvre l'intégralité de 1957 à la date de récupération du catalogue, voir `generatedAt` dans `data-model.md`).
- Mapping temps réel → temps simulé linéaire sur l'échelle complète des années couvertes (`d3.scaleLinear` ou équivalent, domaine en dates, image en secondes de lecture). Durée totale indicative : environ 25 secondes pour l'ensemble de la période (à ajuster à l'implémentation selon le rendu réel — une accumulation trop lente en début de période, quand les lancements sont rares, resterait visuellement peu engageante).
- Passage unique, pas de bouclage automatique (voir "Lecture automatique" dans `functional-specifications.md`) : le timer s'arrête à la date la plus récente du dataset plutôt que de revenir à 1957.
- À chaque frame, tous les satellites dont `launchDate` est désormais atteinte et qui n'ont pas encore été peints sont ajoutés au canvas de premier plan (voir "Rendu" ci-dessus) ; `satellites.json` étant trié par date croissante (voir "Contraintes de validation" dans `data-model.md`), un simple curseur d'index suffit, pas de parcours complet du tableau à chaque frame.
- Année simulée affichée via `Intl.DateTimeFormat(lang, { year: 'numeric' })`, comme le mois simulé de `bird-migrations`.

## Nouvelles dépendances

| Dépendance | Usage | Portée |
|---|---|---|
| `d3-scale` | Échelle de couleur catégorielle par zone (`scaleOrdinal`), échelle temporelle (`scaleLinear` ou `scaleTime`) | Scopée à cette visualisation (île Astro) |
| `d3-timer` | Boucle d'animation (`timer`, wrapper de `requestAnimationFrame`) | Idem |

Pas de `d3-geo` ni de fond de carte ici (globe stylisé sans géographie réelle, voir "Rendu" ci-dessus), à la différence de `bird-migrations`.

## Palette

**Exception documentée à la règle générale de la palette dataviz** (voir "Palette dataviz" dans `style-guide.md`) : la nuée est une disposition où tous les points peuvent se toucher (type "nuage de points"), qui ne garantit normalement que trois teintes distinguables en daltonisme. Cette visualisation utilise malgré tout les cinq premiers slots de la palette catégorielle, décision explicite de l'utilisateur (voir échanges de cadrage), compensée par :

- une légende toujours visible (couleur + nom de zone, pas la couleur seule) ;
- le filtre zone (voir "Interactions" dans `functional-specifications.md`), qui permet d'isoler une ou plusieurs zones à la fois pour lever toute ambiguïté de teinte.

| Slot | Teinte | Zone |
|---|---|---|
| 1 | Bleu | États-Unis |
| 2 | Orange | Russie / URSS |
| 3 | Aqua | Chine |
| 4 | Jaune | Europe |
| 5 | Magenta | Reste du monde |

Assignation par ordre d'apparition dans `regions` (voir "Format de sortie" dans `data-model.md`), même mécanisme que `bird-migrations`.

## Hydratation

`client:visible`, via un `IntersectionObserver` sur la zone de montage, même mécanisme que `bird-migrations` et `flower-phenology` (voir "Hydratation" dans leurs `technical-specifications.md` respectifs) : le montage réel (fetch du JSON, initialisation Canvas) ne se déclenche qu'à l'approche du viewport.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation. Le canvas de fond (globe) et le canvas de premier plan (nuée) sont redimensionnés ensemble au redimensionnement de la zone de montage ; la nuée déjà accumulée est reconstruite en une seule passe après redimensionnement plutôt qu'étirée (mêmes positions relatives, recalculées au nouveau rayon).

## Points à valider à l'implémentation

- Mapping exact des codes `OWNER` du SATCAT vers les cinq zones (voir "Regroupement géographique" dans `data-model.md`), à établir sur les données réelles récupérées.
- Volume exact d'objets après filtrage et taille du fichier `satellites.json` généré (voir "Prétraitement" dans `data-model.md`), avec une piste de compaction du format si nécessaire.
- Durée totale de l'animation (25 secondes indicatives ci-dessus), à ajuster une fois le rendu réel observable.
- Relecture, si possible, du texte exact (pas un résumé) de l'accord utilisateur Space-Track.org avant publication, pour confirmer la lecture retenue sur la licence (voir "Dataset source" dans `data-model.md`).
