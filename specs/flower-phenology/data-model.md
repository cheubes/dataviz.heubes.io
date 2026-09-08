# Modèle de données : Le calendrier des fleurs

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | GBIF Occurrence Data (dates de première floraison, France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 1.0 / CC BY 4.0 (variable par occurrence, voir "Attribution" dans `data-model.md` de la biodiversité pour la même nuance) |
| `retrieved` | 2026-09-08 |

**Couverture temporelle :** occurrences avec date complète, 1970 à l'année de récupération (six décennies : 1970s à 2020s, voir "Comparaison de décennies" dans `functional-specifications.md`).

## Sélection des espèces (finalisée à l'implémentation)

**Principe :** espèces à floraison précoce et bien observées en France (nombreuses occurrences GBIF par décennie, pour une médiane fiable), couvrant une diversité de familles et de périodes de floraison sur l'année, avec une couleur de fleur suffisamment distincte des autres espèces retenues (voir "Palette" dans `technical-specifications.md`).

**Espèces retenues** (douze), vérifiées par un comptage GBIF réel par décennie avant retenue. Deux espèces du draft d'origine ont été écartées à cette vérification et remplacées : *Forsythia × intermedia*, hybride horticole quasi absent à l'état sauvage (62 occurrences GBIF en France sur toute la décennie 2020s), et *Helianthus annuus*, essentiellement cultivé en grande culture plutôt que sauvage : toutes deux en contradiction avec l'angle éditorial "plantes sauvages" et le principe de sélection ci-dessus. Remplacées par *Narcissus pseudonarcissus* et *Centaurea cyanus*, deux espèces réellement sauvages en France avec un volume GBIF solide sur les trois décennies.

| Nom scientifique | Nom commun FR | Nom commun EN | Famille | Couleur |
|---|---|---|---|---|
| *Prunus spinosa* | Prunellier | Blackthorn | Rosaceae | `#F4F1EA` |
| *Narcissus pseudonarcissus* | Jonquille sauvage | Wild Daffodil | Amaryllidaceae | `#C97A0A` |
| *Taraxacum officinale* | Pissenlit | Dandelion | Asteraceae | `#F0C040` |
| *Papaver rhoeas* | Coquelicot | Poppy | Papaveraceae | `#D94035` |
| *Digitalis purpurea* | Digitale | Foxglove | Plantaginaceae | `#C87BA0` |
| *Lavandula angustifolia* | Lavande | Lavender | Lamiaceae | `#9B72CF` |
| *Centaurea cyanus* | Bleuet | Cornflower | Asteraceae | `#3C5CC4` |
| *Calluna vulgaris* | Bruyère | Heather | Ericaceae | `#BE8CB4` |
| *Convallaria majalis* | Muguet | Lily of the Valley | Asparagaceae | `#EDEAE0` |
| *Rosa canina* | Églantier | Dog Rose | Rosaceae | `#F0A0A0` |
| *Crocus vernus* | Crocus | Crocus | Iridaceae | `#C9A8E8` |
| *Anemone nemorosa* | Anémone des bois | Wood Anemone | Ranunculaceae | `#E5E2D8` |

Les douze espèces sont cochées par défaut à l'ouverture (voir "Interactions" dans `functional-specifications.md`, décision explicite : calendrier complet visible d'emblée plutôt qu'une sélection partielle). Avec douze espèces au total, le plafond de quinze espèces simultanées de `functional-specifications.md` n'est jamais atteint : le comportement "au-delà de quinze" n'a pas été implémenté (voir "Sélecteur d'espèces" dans `technical-specifications.md`).

Couleurs validées avec le script de contraste du skill dataviz contre le fond retenu (`--dv-surface`, voir "Palette" dans `technical-specifications.md`) : le crocus (`#C9A8E8`, plus clair que le `#B89AE0` du draft d'origine) et la jonquille sauvage (`#C97A0A`, un ambre plus soutenu que le jaune du forsythia qu'elle remplace) ont été ajustés pour rester distinguables de la lavande et du pissenlit respectivement. Blanc pur (`#FFFFFF`) évité pour le prunellier, le muguet et l'anémone : nuances légèrement teintées, dont la proximité mutuelle reste une limite assumée (voir "Palette" dans `technical-specifications.md`).

## Schéma des données brutes (source GBIF)

| Champ GBIF | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | Filtre France (pas d'usage cartographique dans cette visualisation) |
| `scientificName` | Espèce |
| `eventDate` | Date d'observation, pour le jour de l'année (`doy`) |
| `year` | Regroupement par décennie |

## Prétraitement (script hors-build, exécuté à l'implémentation)

Script Node ponctuel (non commité, cohérent avec `bird-migrations`), interrogeant l'API GBIF (`api.gbif.org/v1/occurrence/search`, `country=FR`) par facettes plutôt que par téléchargement brut : la recherche GBIF ne trie pas ses résultats par date, et le volume par espèce (jusqu'à ~140 000 occurrences/décennie pour les plus communes) rend une pagination complète impraticable pour ce qui est finalement une statistique de quelques valeurs par décennie.

1. Pour chaque espèce retenue et chaque année (1970 à l'année de récupération) : facette `month` (une requête) pour obtenir le nombre d'occurrences France par mois, puis facette `day` (une requête par mois nécessaire) sur les mois requis pour localiser un jour précis. Un jour n'apparaît dans la facette `day` que si GBIF lui a effectivement associé une date complète, ce qui implémente nativement le filtre "dates complètes uniquement" sans avoir à inspecter les enregistrements un par un.
2. **Écart au principe initial ("première observation de l'année"), corrigé après vérification sur des enregistrements réels, en deux temps :**
   - La première occurrence brute de l'année s'est révélée dominée, pour la plupart des espèces et des années, par un pic en tout début janvier (jusqu'à ~10 % du volume annuel sur les dix premiers jours pour certaines décennies). Vérification faite sur les enregistrements bruts (pas seulement les facettes) : il ne s'agit pas de dates factices `01-01` de remplacement (les dates sont réellement `AAAA-01-0X`, réparties sur plusieurs jours), mais d'un biais d'effort d'observation correspondant au "New Year Plant Hunt", une campagne d'observation citoyenne récurrente (autour du 1ᵉʳ janvier) qui recense spécifiquement ce qui est en fleur en plein hiver, indépendamment de la saison de floraison réelle de l'espèce. Les occurrences des dix premiers jours de janvier sont donc exclues du calcul plutôt que gardées.
   - Le minimum brut restant (hors fenêtre exclue) n'est pas non plus un proxy fiable à lui seul : une partie des espèces retenues restent identifiables toute l'année sans être en fleur (écorce du prunellier, feuillage persistant de la bruyère, rosette du pissenlit...), ce qui continue de tirer une simple valeur minimale vers l'hiver. Corrigé en utilisant le jour de l'année correspondant au **5ᵉ percentile** de la distribution (hors fenêtre exclue) plutôt que son minimum (rang le plus proche), une méthode d'estimation robuste du début de saison standard en phénologie.
   - Le jour ainsi obtenu remplace "la première observation" comme valeur annuelle utilisée à l'étape suivante. Ce calcul reste entièrement dans le script de prétraitement hors-build : il ne change ni le format de sortie (toujours `medianDoy`/`p10`/`p90`/`observationCount` par décennie) ni les dépendances de la visualisation elle-même. **Limite résiduelle assumée :** pour les espèces les plus identifiables hors floraison (bruyère, églantier notamment), les dates obtenues restent probablement en avance sur la vraie saison de pleine floraison. Cette valeur annuelle reste un simple proxy de la floraison, pas une mesure phénologique vérifiée : cohérent avec un site de vulgarisation plutôt qu'un outil d'analyse scientifique (voir "Décennie 2020s incomplète" ci-dessous pour la même nuance).
3. Regrouper les valeurs annuelles (une par année, méthode ci-dessus) par décennie : 1970s (1970-1979), 1980s (1980-1989), 1990s (1990-1999), 2000s (2000-2009), 2010s (2010-2019), 2020s (2020 à la date de récupération, décennie incomplète, voir "Décennie 2020s incomplète" ci-dessous).
4. Calculer par espèce et par décennie : médiane, 10ᵉ et 90ᵉ percentile de ces valeurs annuelles. `observationCount` : nombre total d'occurrences brutes de l'espèce en France sur la décennie (indicateur de densité d'observation, voir "Sélection des espèces" ci-dessus), pas le nombre de valeurs annuelles utilisées pour la médiane.
5. Sortie : `public/data/flower-phenology/phenology.json`.

## Décennie 2020s incomplète

La décennie "2020s" ne couvre, au moment du build, qu'une partie de la décennie réelle (2020 à l'année de `retrieved`). La médiane de cette décennie partielle reste affichée comme telle (décennie par défaut de l'anneau extérieur, voir `functional-specifications.md`), sans pondération ni avertissement statistique particulier : cohérent avec le traitement d'un site de vulgarisation plutôt que d'un outil d'analyse scientifique, mais à garder en tête si une médiation plus rigoureuse est souhaitée à l'implémentation.

## Format de sortie

Extrait réel de `public/data/flower-phenology/phenology.json` :

```json
[
  {
    "species": "Papaver rhoeas",
    "nameFr": "Coquelicot",
    "nameEn": "Poppy",
    "family": "Papaveraceae",
    "flowerColor": "#D94035",
    "phenology": {
      "1970s": { "medianDoy": 98, "p10": 80, "p90": 126, "observationCount": 3445 },
      "1980s": { "medianDoy": 112, "p10": 98, "p90": 129, "observationCount": 5278 },
      "1990s": { "medianDoy": 96, "p10": 68, "p90": 115, "observationCount": 15459 },
      "2000s": { "medianDoy": 84, "p10": 66, "p90": 96, "observationCount": 87417 },
      "2010s": { "medianDoy": 101, "p10": 66, "p90": 119, "observationCount": 50379 },
      "2020s": { "medianDoy": 106, "p10": 84, "p90": 114, "observationCount": 12446 }
    }
  }
]
```

`medianDoy`, `p10`, `p90` : jour de l'année (1-365).

## Contraintes de validation propres à cette visualisation

- Chaque espèce du JSON porte les six décennies (`1970s`, `1980s`, `1990s`, `2000s`, `2010s`, `2020s`), même si `observationCount` est bas pour certaines (pas de décennie omise).
- `flowerColor` est unique parmi les espèces retenues (pas de collision, voir correction ci-dessus) et validé au contraste par le script du skill dataviz (voir `technical-specifications.md`).
