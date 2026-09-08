# Modèle de données : Paris, arbre par arbre

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

Deux jeux de données, tous deux publiés par la Ville de Paris (Paris Data) sous licence **Open Database License (ODbL)** :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Les arbres | Ville de Paris (Direction des Espaces Verts et de l'Environnement) | https://opendata.paris.fr/explore/dataset/les-arbres/ | Open Database License (ODbL) | À renseigner à l'implémentation |
| Arrondissements | Ville de Paris (Apur) | https://opendata.paris.fr/explore/dataset/arrondissements/ | Open Database License (ODbL) | À renseigner à l'implémentation |

Le premier jeu recense 219 360 arbres au moment de la vérification de cadrage (mis à jour de façon hebdomadaire ; voir "Prétraitement" ci-dessous pour la date de récupération réellement figée). Avertissement du producteur, repris tel quel dans le texte éditorial de la visualisation (voir "Angle éditorial" dans `functional-specifications.md`) : la donnée n'est pas mise à jour en temps réel, peut présenter des décalages notables (notamment dans les espaces verts), et ne couvre pas les arbres du domaine privé ni la totalité du patrimoine arboré parisien. Le second jeu fournit les contours géographiques des vingt arrondissements, utilisés comme fond de carte stylisé (voir "Rendu" dans `technical-specifications.md`).

**Absence notée :** le jeu "Les arbres" ne comporte pas de champ de date ou d'année de plantation (vérifié à la lecture du schéma). L'angle "âge du patrimoine" envisagé un temps pendant le cadrage n'est donc pas exploitable avec cette source ; sans conséquence sur l'angle finalement retenu ("exploration libre", voir `functional-specifications.md`), qui ne s'appuie pas sur cette donnée.

## Périmètre retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **l'intégralité du jeu "Les arbres"**, tous domaines confondus (alignement, jardins, bois, équipements municipaux...), sans filtrage ni agrégation par zoom.

## Champs source utilisés

| Champ `les-arbres` | Usage |
|---|---|
| `idbase` | Identifiant de l'arbre |
| `genre` | Regroupement par genre dominant (voir "Regroupement par genre" ci-dessous) et recherche |
| `espece`, `varieteoucultivar` | Recherche, fiche de détail au clic (voir "Interactions" dans `functional-specifications.md`) |
| `libellefrancais` | Nom commun affiché (recherche, fiche de détail) |
| `circonferenceencm` | Taille du point (voir "Rendu" dans `technical-specifications.md`), fiche de détail |
| `hauteurenm` | Fiche de détail |
| `stadedeveloppement` | Fiche de détail |
| `domanialite` | Fiche de détail |
| `arrondissement` | Zoom/filtrage géographique par clic sur la carte (voir "Interactions" dans `functional-specifications.md`) |
| `remarquable` | Mise en avant visuelle des arbres remarquables (voir "Interactions" dans `functional-specifications.md`) |
| `geo_point_2d` | Position sur la carte |

`typeemplacement`, `complementadresse`, `adresse` et `idemplacement` ne sont pas repris dans le format de sortie : hors du périmètre des interactions retenues (voir "Interactions" dans `functional-specifications.md`).

| Champ `arrondissements` | Usage |
|---|---|
| `geo_shape` (polygone) | Fond de carte stylisé (silhouette des vingt arrondissements) |
| `c_ar` (numéro d'arrondissement) | Correspondance avec le champ `arrondissement` du jeu "Les arbres" |

## Regroupement par genre

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : les **huit genres les plus fréquents** du jeu de données prennent chacun un slot de la palette catégorielle (voir "Palette" dans `technical-specifications.md`), tous les autres genres sont regroupés dans une catégorie "Autres" en teinte neutre, hors palette.

**À l'implémentation :** établir la liste réelle des huit genres les plus fréquents (attendus, à confirmer : platane, marronnier, tilleul, érable, chêne et quelques autres genres très plantés en ville) et leur nom commun français associé (dérivé du `libellefrancais` le plus fréquent au sein du genre, pas une traduction du nom scientifique latin). Un arbre dont le `genre` est vide ou non renseigné tombe dans "Autres" plutôt que de faire échouer le prétraitement.

## Prétraitement (réalisé à l'implémentation, hors build)

Un script de prétraitement, dans l'esprit de ceux des autres visualisations (voir `data-model.md` de `satellites-in-orbit` ou `bird-migrations`), rejoué manuellement plutôt qu'à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) :

1. Récupérer l'export complet du jeu "Les arbres" (API Opendatasoft, format JSON ou CSV) et celui du jeu "Arrondissements" (export GeoJSON).
2. Écarter les arbres sans coordonnées valides (`geo_point_2d` vide) ; les compter et documenter leur proportion dans ce fichier une fois connue.
3. Déterminer les huit genres dominants (voir "Regroupement par genre" ci-dessus) et attribuer un `genusId` à chaque arbre retenu (un des huit, ou `"other"`).
4. Construire un champ de recherche précalculé par arbre (concaténation normalisée du nom commun, du genre et de l'espèce, minuscules et sans accents) pour la recherche côté client (voir "Interactions" dans `functional-specifications.md`).
5. Réduire chaque arbre retenu aux champs nécessaires (voir "Format de sortie" ci-dessous) et écrire `public/data/paris-trees/trees.json`.
6. Simplifier les polygones du jeu "Arrondissements" (Douglas-Peucker, même technique que le fond de carte de `bird-migrations`) et écrire `public/data/paris-trees/districts.json`.

## Format de sortie

**`public/data/paris-trees/trees.json`** — encodé en tableaux parallèles (« structure of arrays ») plutôt qu'un tableau d'objets, pour limiter la taille du fichier étant donné le volume (voir "Format de données" dans `technical-specifications.md`) :

```json
{
  "generatedAt": "2026-09-08",
  "genera": [
    { "id": "platanus", "nameFr": "Platane", "nameEn": "Plane tree" },
    { "id": "aesculus", "nameFr": "Marronnier", "nameEn": "Horse chestnut" },
    { "id": "other", "nameFr": "Autres", "nameEn": "Other" }
  ],
  "trees": {
    "lat": [48.8566, 48.8570],
    "lng": [2.3522, 2.3530],
    "genusId": ["platanus", "aesculus"],
    "circumferenceCm": [180, 95],
    "heightM": [18, 9],
    "developmentStage": ["Adulte", "Jeune (arbre)"],
    "district": [4, 4],
    "remarkable": [false, true],
    "commonName": ["Platane commun", "Marronnier d'Inde"],
    "genusLabel": ["Platanus", "Aesculus"],
    "species": ["x hispanica", "hippocastanum"],
    "searchText": ["platane commun platanus x hispanica", "marronnier d inde aesculus hippocastanum"]
  }
}
```

Le tableau `genera` liste huit genres dominants plus l'entrée `"other"` (voir "Regroupement par genre" ci-dessus) ; la couleur de chaque genre n'est pas stockée dans les données, assignée côté client par ordre d'apparition dans `genera` (voir "Palette" dans `technical-specifications.md`). Chaque tableau de `trees` a la même longueur, index par index (le premier arbre est `lat[0]`/`lng[0]`/`genusId[0]`/...).

**`public/data/paris-trees/districts.json`** — GeoJSON simplifié des vingt arrondissements, avec le numéro d'arrondissement (`c_ar`) porté par chaque géométrie pour permettre le clic-zoom (voir "Interactions" dans `functional-specifications.md`).

## Champs dérivés côté client (pas dans le JSON)

- **Nombre d'arbres visibles :** recalculé à chaque changement de filtre genre ou de recherche (voir "Interactions" dans `functional-specifications.md`).
- **Rayon du point à l'écran :** dérivé de `circumferenceCm` via une échelle (voir "Rendu" dans `technical-specifications.md`), pas stocké.

## Contraintes de validation propres à cette visualisation

- Chaque `genusId` référencé dans `trees.genusId` existe dans `genera`.
- Tous les tableaux de `trees` ont la même longueur.
- Un arbre présent dans `trees` a toujours une position (`lat`/`lng`) valide (les arbres sans coordonnées sont écartés au prétraitement, voir étape 2 ci-dessus, jamais présents avec une position nulle).
- Chaque `district` référencé dans `trees` correspond à un `c_ar` présent dans `districts.json`.
