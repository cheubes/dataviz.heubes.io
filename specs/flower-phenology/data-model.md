# Modèle de données : Le calendrier des fleurs

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | GBIF Occurrence Data (dates de première floraison, France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 / CC BY (variable par occurrence, voir "Attribution" dans `data-model.md` de la biodiversité pour la même nuance) |
| `retrieved` | À renseigner à l'implémentation (étape 8+) |

**Couverture temporelle :** occurrences avec date complète, 2000 à l'année de récupération.

## Sélection des espèces (à finaliser à l'implémentation)

Non couvert par la tâche actuelle (specs uniquement, voir échanges de cadrage) : la spec documente le principe de sélection, pas une liste figée.

**Principe :** espèces à floraison précoce et bien observées en France (nombreuses occurrences GBIF par décennie, pour une médiane fiable), couvrant une diversité de familles et de périodes de floraison sur l'année, avec une couleur de fleur suffisamment distincte des autres espèces retenues (voir "Palette" dans `technical-specifications.md`).

**Espèces candidates (indicatives, à revérifier et étendre)**, reprises et corrigées du draft d'origine (collision de couleur entre lavande et crocus corrigée) :

| Nom scientifique | Nom commun FR | Nom commun EN | Couleur indicative |
|---|---|---|---|
| *Forsythia × intermedia* | Forsythia | Forsythia | `#F5D020` |
| *Prunus spinosa* | Prunellier | Blackthorn | `#F4F1EA` |
| *Taraxacum officinale* | Pissenlit | Dandelion | `#F0C040` |
| *Papaver rhoeas* | Coquelicot | Poppy | `#D94035` |
| *Digitalis purpurea* | Digitale | Foxglove | `#C87BA0` |
| *Lavandula angustifolia* | Lavande | Lavender | `#9B72CF` |
| *Helianthus annuus* | Tournesol | Sunflower | `#F5C518` |
| *Calluna vulgaris* | Bruyère | Heather | `#BE8CB4` |
| *Crocus vernus* | Crocus | Crocus | `#B89AE0` |
| *Convallaria majalis* | Muguet | Lily of the Valley | `#EDEAE0` |
| *Rosa canina* | Églantier | Dog Rose | `#F0A0A0` |
| *Anemone nemorosa* | Anémone des bois | Wood Anemone | `#E5E2D8` |

Blanc pur (`#FFFFFF`) évité pour le prunellier, le muguet et l'anémone (contraste insuffisant sur fond clair) : nuances légèrement teintées, à valider avec le script du skill dataviz au moment de l'implémentation (voir "Palette" dans `technical-specifications.md`).

## Schéma des données brutes (source GBIF)

| Champ GBIF | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | Filtre France (pas d'usage cartographique dans cette visualisation) |
| `scientificName` | Espèce |
| `eventDate` | Date d'observation, pour le jour de l'année (`doy`) |
| `year` | Regroupement par décennie |

## Prétraitement (script hors-build, à réaliser à l'implémentation)

1. Récupérer les occurrences GBIF pour les espèces retenues, France, 2000 à la date de récupération, dates complètes uniquement.
2. Pour chaque espèce et chaque année : jour de l'année (1-365) de la première observation (proxy de la floraison).
3. Regrouper par décennie (2000s : 2000-2009, 2010s : 2010-2019, 2020s : 2020 à la date de récupération — décennie incomplète, voir "Décennie 2020s incomplète" ci-dessous).
4. Calculer par espèce et par décennie : médiane, 10ᵉ et 90ᵉ percentile du jour de l'année, nombre d'observations.
5. Sortie : `public/data/flower-phenology/phenology.json`.

## Décennie 2020s incomplète

La décennie "2020s" ne couvre, au moment du build, qu'une partie de la décennie réelle (2020 à l'année de `retrieved`). La médiane de cette décennie partielle reste affichée comme telle (comparaison par défaut 2010s/2020s, voir `functional-specifications.md`), sans pondération ni avertissement statistique particulier : cohérent avec le traitement d'un site de vulgarisation plutôt que d'un outil d'analyse scientifique, mais à garder en tête si une médiation plus rigoureuse est souhaitée à l'implémentation.

## Format de sortie

```json
[
  {
    "species": "Papaver rhoeas",
    "nameFr": "Coquelicot",
    "nameEn": "Poppy",
    "family": "Papaveraceae",
    "flowerColor": "#D94035",
    "phenology": {
      "2000s": { "medianDoy": 135, "p10": 120, "p90": 155, "observationCount": 342 },
      "2010s": { "medianDoy": 128, "p10": 112, "p90": 148, "observationCount": 891 },
      "2020s": { "medianDoy": 122, "p10": 108, "p90": 140, "observationCount": 456 }
    }
  }
]
```

`medianDoy`, `p10`, `p90` : jour de l'année (1-365).

## Contraintes de validation propres à cette visualisation

- Chaque espèce du JSON porte les trois décennies (`2000s`, `2010s`, `2020s`), même si `observationCount` est bas pour certaines (pas de décennie omise).
- `flowerColor` est unique parmi les espèces retenues (pas de collision, voir correction ci-dessus) et validé au contraste par le script du skill dataviz (voir `technical-specifications.md`).
