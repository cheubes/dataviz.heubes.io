# Modèle de données : La migration des monarques

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

Un seul jeu de données, un jeu d'occurrences agrégées :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| GBIF Occurrence Data (*Danaus plexippus*, Amérique du Nord) | GBIF.org | https://www.gbif.org/species/5133088 | CC0 / CC BY (variable par occurrence, voir "Attribution" dans `biodiversity/data-model.md` pour la même nuance) | 2026-09-21 |

## Une seule mécanique de données : densité agrégée, pas de trajectoire individuelle

Aucun monarque ne parcourt le trajet complet (relais entre générations successives, voir "Angle éditorial" dans `functional-specifications.md`) : la donnée disponible est un nuage d'observations GBIF, pas des positions GPS individuelles. Même famille de source que `flower-phenology`, mais agrégée spatialement (une grille nord-américaine par mois) plutôt que dans un calendrier radial.

**Périmètre recentré :** la première implémentation de cette visualisation, sous le titre "Les grandes migrations", réunissait aussi des trajectoires GPS/Argos de baleines à bosse, de baleines bleues et de gnous (Movebank Data Repository). Recentrée sur le monarque seul à la demande de l'utilisateur ; ces trois jeux de données, leur prétraitement et leur rendu ont été retirés du code et des données, et restent consultables dans l'historique git de la branche.

## Prétraitement (réalisé à l'implémentation, hors build)

**Écart au principe initial (agrégation via l'API SQL Downloads de GBIF, comme `biodiversity`), imposé par une contrainte d'accès :** cette API nécessite un compte GBIF authentifié (`POST /v1/occurrence/download/request`), indisponible au moment de l'implémentation. Remplacée par une agrégation équivalente via l'API de recherche publique, sans authentification :

1. Grille régulière de 1° × 1° en latitude/longitude sur l'Amérique du Nord (14°N-52°N, 125°O-65°O, soit 2 280 cellules de 38 × 60), calée sur l'aire de répartition du monarque (zones de reproduction jusqu'au sud du Canada, corridor de migration, sites d'hivernage au Mexique) plutôt que sur une grille H3 comme `biodiversity`. Une première version à 2° (570 cellules) a été affinée à 1° : à ce cadrage régional, les cases de 2° étaient trop grossières à l'œil nu.
2. Pour chaque cellule : une requête `GET /v1/occurrence/search` avec `taxonKey=5133088` (*Danaus plexippus*), `hasCoordinate=true`, `hasGeospatialIssue=false`, `geometry` (polygone WKT de la cellule) et `facet=month&facetLimit=12&limit=0` : la facette mensuelle renvoie en une seule requête le nombre d'occurrences par mois pour cette cellule, sans jamais télécharger d'enregistrement individuel (774 264 occurrences géoréférencées sur le continent nord-américain avant filtre de qualité et découpage sur l'emprise de la grille, bien au-delà de ce qu'une pagination complète permettrait). Toutes les années sont agrégées, sans filtre sur l'année ni sur le type d'enregistrement.
   - **Cellules semi-ouvertes `[min, max[` :** les polygones de recherche GBIF incluent leur bord, donc un point situé exactement sur la frontière de deux cellules (coordonnées arrondies au degré, fréquentes) serait compté deux fois. Vérifié sur la latitude 40° : 14 points exactement dessus, comptés dans la cellule du dessous ; le passage à 1° multiplie ces frontières. Chaque polygone s'arrête donc `1e-7`° avant son bord nord et avant son bord est, de sorte qu'un point n'appartient qu'à une seule cellule (celle dont il touche le bord sud ou ouest). La première version à 2° comptait ces points en double.
   - **Limite de fréquence de l'API :** trois requêtes en parallèle, pause commune à tous les appels pendant la durée du `Retry-After` (3 secondes) à chaque erreur 429, progression sauvegardée cellule par cellule pour reprendre après un incident. 2 280 cellules récupérées sans échec en une vingtaine de minutes, dont 343 pauses de limitation absorbées.
3. Sortie : un enregistrement par combinaison (cellule, mois) avec au moins une occurrence : 7 290 combinaisons, 1 270 cellules distinctes actives sur les 2 280 (jusqu'à 960 actives le mois le plus chargé, août), 395 170 observations retenues au total. Centre de cellule en `lat`/`lng` (voir "Format de sortie" ci-dessous), `DENSITY_CELL_DEGREES = 1` répliqué comme constante dans `render.ts` pour le dessin (voir `technical-specifications.md`).

Vérification a posteriori sur la latitude moyenne pondérée par mois (29°N en janvier, 41°N en août, retour à 30°N en décembre) : cohérente avec la biologie du monarque (hivernage mexicain, expansion estivale vers le nord, migration automnale), aucun retraitement supplémentaire jugé nécessaire. Contrôle de cohérence avec la première version à 2° : agrégé à 2°, le jeu à 1° donne 395 170 observations contre 395 157, soit un écart de 13 (0,003 %), sans cause isolée (la base GBIF évolue en continu, et la première version comptait deux fois les points situés sur une frontière).

## Format de sortie

`public/data/monarch-migration/density.json`, un tableau plat :

```json
[
  { "month": 3, "lat": 19.5, "lng": -99.5, "count": 412 }
]
```

- `month` : 1 (janvier) à 12 (décembre).
- `lat`, `lng` : centre de la cellule de 1° × 1° (latitudes de 14,5 à 51,5, longitudes de -124,5 à -65,5, toujours un demi-degré).
- `count` : nombre d'observations de la cellule ce mois-là, toutes années confondues (entier strictement positif : les combinaisons vides sont absentes).

## Champs dérivés côté client (pas dans le JSON)

- **Valeur affichée par cellule, à chaque instant :** interpolation linéaire entre le `count` du mois courant et celui du mois suivant (un mois absent vaut zéro), voir "Animation" dans `technical-specifications.md`.
- **Maximum annuel par cellule :** plus grand `count` de la cellule sur les douze mois, dénominateur du pourcentage affiché dans le tooltip (voir "Interactions" dans `functional-specifications.md`).
- **Maximum global :** plus grand `count` toutes cellules et tous mois confondus (4 904), borne haute de l'échelle d'opacité.

## Contraintes de validation propres à cette visualisation

- `month` entre 1 et 12, `count` entier strictement positif.
- Le triplet (`lat`, `lng`, `month`) est unique.
- `lat`, `lng` tombent sur les centres de la grille de 1° (voir "Format de sortie").
