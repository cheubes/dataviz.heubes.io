# Modèle de données : Les routes de migration

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | Movebank GPS Tracking Data |
| `publisher` | Movebank Data Repository (movebank.org) |
| `url` | https://www.movebank.org |
| `license` | Variable par étude (à vérifier avant intégration, voir "Sélection des études" ci-dessous) |
| `retrieved` | À renseigner à l'implémentation (étape 8+) |

## Sélection des études (à finaliser à l'implémentation)

Non couvert par la tâche actuelle (specs uniquement, voir échanges de cadrage) : la spec documente le principe de sélection, pas une liste figée d'études.

**Principe :** sélectionner, parmi les études Movebank publiques couvrant une migration Europe → Afrique subsaharienne, un petit nombre d'espèces (4 à 6, pour rester lisible avec la palette catégorielle à 8 slots maximum, voir `technical-specifications.md`), chacune avec au moins une étude dont la licence autorise la réutilisation sur un site public (CC0 ou CC BY sans restriction incompatible).

**Espèces candidates (indicatives, à revérifier)**, reprises du draft d'origine :

| Nom scientifique | Nom commun FR | Nom commun EN |
|---|---|---|
| *Ciconia ciconia* | Cigogne blanche | White Stork |
| *Hirundo rustica* | Hirondelle rustique | Barn Swallow |
| *Milvus migrans* | Milan noir | Black Kite |
| *Pandion haliaetus* | Balbuzard pêcheur | Osprey |
| *Columba palumbus* | Pigeon ramier | Wood Pigeon |

**Vérification requise avant intégration réelle, par étude retenue :**
1. Licence explicite de l'étude sur sa page Movebank.
2. Couverture temporelle : positions couvrant à la fois un trajet d'automne (départ) et, idéalement pour les mêmes individus, un trajet de printemps (retour).
3. Nombre d'individus suivis : voir "Volume de trajectoires" ci-dessous (aucun plafond appliqué, mais la disponibilité réelle par étude conditionne le rendu final).

## Volume de trajectoires

Aucun plafond : tous les individus disponibles dans les études retenues sont inclus (décision explicite, voir échanges de cadrage — écarte la recommandation initiale d'un échantillon plafonné par espèce). Conséquence assumée sur le rendu : voir "Rendu des trajectoires" dans `technical-specifications.md` (rendu Canvas plutôt que SVG, pour absorber un volume potentiellement important sans dégrader l'animation).

## Schéma des données brutes (source Movebank)

Champs Movebank utilisés lors du prétraitement :

| Champ Movebank | Usage |
|---|---|
| `individual-local-identifier` | Identifiant individu (anonymisé en sortie, voir "Format de sortie") |
| `location-lat`, `location-long` | Position GPS |
| `timestamp` | Horodatage de la position |
| `taxon-canonical-name` | Espèce |
| `study-name` | Traçabilité de la source, pas exposé côté client |

## Prétraitement (script hors-build, à réaliser à l'implémentation)

1. Télécharger les positions GPS des études retenues.
2. Filtrer les positions de septembre à avril (fenêtre couvrant départ d'automne et retour de printemps).
3. Déterminer la direction (`autumn` / `spring`) par individu à partir de la date et du sens général de déplacement (latitude décroissante = automne, croissante = printemps).
4. Simplifier chaque trajectoire (Douglas-Peucker) pour réduire le volume de points tout en conservant la forme générale du trajet.
5. Anonymiser l'identifiant individu (`<code-espèce>_<numéro séquentiel>`, ex. `CC_001`), sans lien vers l'étude source dans les données publiées.
6. Sortie : `public/data/bird-migrations/tracks.json`.

## Format de sortie

```json
{
  "species": [
    { "id": "white-stork", "nameFr": "Cigogne blanche", "nameEn": "White Stork" },
    { "id": "barn-swallow", "nameFr": "Hirondelle rustique", "nameEn": "Barn Swallow" }
  ],
  "tracks": [
    {
      "individualId": "CC_001",
      "speciesId": "white-stork",
      "direction": "autumn",
      "points": [
        { "lat": 48.5, "lng": 2.2, "date": "2019-08-25" },
        { "lat": 46.1, "lng": 1.8, "date": "2019-08-28" }
      ]
    }
  ]
}
```

`speciesId` en kebab-case anglais (voir conventions générales de `data-model.md`) ; la couleur de chaque espèce n'est pas stockée dans les données (voir palette dans `technical-specifications.md`), assignée côté client par ordre d'apparition dans `species`.

## Champs dérivés côté client (pas dans le JSON)

- **Distance totale parcourue :** calculée à l'affichage à partir de la séquence de points (grand cercle entre points consécutifs), pas précalculée.
- **Durée de la migration :** différence entre la première et la dernière date de `points`.

## Contraintes de validation propres à cette visualisation

- Chaque `speciesId` référencé dans `tracks` existe dans `species`.
- Chaque trajectoire (`points`) est triée par `date` croissante.
- Un individu (`individualId`) n'apparaît qu'une fois par `direction` (une trajectoire d'automne et, si disponible, une de printemps, jamais deux trajectoires pour la même direction).
