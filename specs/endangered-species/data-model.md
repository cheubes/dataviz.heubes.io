# Modèle de données : Ce qu'il en reste

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| IUCN Red List of Threatened Species, historique des évaluations par espèce | International Union for Conservation of Nature (IUCN) | https://www.iucnredlist.org | Accès gratuit sur inscription, conditions plus restrictives qu'une licence ouverte classique (voir "Réserve sur la licence" ci-dessous) | À renseigner à l'implémentation |

## Réserve sur la licence

Le site de l'UICN bloque la récupération automatisée (protection anti-bot), empêchant une vérification directe des conditions d'utilisation exactes au moment de la rédaction de ces specs. D'après la connaissance générale du sujet : l'accès à l'API et au téléchargement en masse nécessite une inscription gratuite, avec des conditions plus restrictives qu'une licence ouverte classique (citation obligatoire, usage commercial généralement soumis à permission séparée, exigences d'intégrité des données). Décision explicite de l'utilisateur (voir échanges de cadrage) : continuer avec cette source malgré l'incertitude, même traitement que la zone grise CelesTrak/Space-Track de `satellites-in-orbit` — **à vérifier formellement (texte exact des conditions d'utilisation) avant toute implémentation**, pas seulement avant publication.

## Angle retenu : trajectoires d'espèces emblématiques

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `biodiversity` (grille agrégée) et `light-pollution` (évolution agrégée dans une grille) déjà présents sur le site : une sélection restreinte d'espèces suivies individuellement à travers les réévaluations successives de la Liste rouge, pas une agrégation géographique ou statistique.

## Sélection des espèces (réalisée à l'implémentation)

Candidats pressentis, mêlant déclins marqués et histoires de rétablissement (voir "Angle éditorial" dans `functional-specifications.md` : le contraste fait partie du propos), à confirmer/ajuster une fois les historiques réels inspectés — même démarche que la sélection des espèces de `bird-migrations`/`animal-migrations` :

| Espèce | Intérêt narratif pressenti |
|---|---|
| Tigre (*Panthera tigris*) | Déclin dramatique historique, population aujourd'hui stabilisée voire en légère hausse dans certaines évaluations récentes |
| Rhinocéros noir (*Diceros bicornis*) | Déclin sévère au vingtième siècle, reprise partielle plus récente |
| Panda géant (*Ailuropoda melanoleuca*) | Histoire de rétablissement : reclassé d'"en danger" à "vulnérable" en 2016 |
| Gorille des montagnes (*Gorilla beringei beringei*) | Autre histoire de rétablissement, population en hausse continue malgré un statut qui reste critique |
| Vaquita (*Phocoena sinus*) | Déclin le plus extrême du lot, population résiduelle de l'ordre de quelques dizaines d'individus |
| Grand hamster d'Alsace (*Cricetus cricetus*) | Seule espèce européenne du lot, déclin sévère, résonance locale pour un site francophone |

Nombre cible : quatre à six espèces, pour garder l'ensemble des petits multiples lisible (voir "Composition" dans `functional-specifications.md`) sans le surcharger.

## Champs nécessaires par espèce et par réévaluation

**À l'implémentation :** structure exacte de l'historique d'évaluations exposée par l'API IUCN à vérifier (probable point d'accès `species/history` ou équivalent, voir "Réserve sur la licence" ci-dessus). Pour chaque réévaluation d'une espèce :

| Champ | Usage |
|---|---|
| Année de l'évaluation | Position sur la chronologie |
| Catégorie de menace (LC/NT/VU/EN/CR/EW/EX) | Teinte de fond de la carte de l'espèce (voir "Palette" dans `technical-specifications.md`), affichage en toutes lettres |
| Estimation de population (quand disponible) | Nombre d'icônes affichées (voir "Rendu" dans `technical-specifications.md`) |

**Estimation de population, point d'attention :** ce champ est un texte libre dans les évaluations IUCN (ex. "fewer than 250 mature individuals", "3,900 individuals"), pas un nombre structuré — extraction à faire au prétraitement, avec une valeur `null` explicite plutôt qu'une estimation inventée pour les réévaluations qui n'en fournissent pas (voir "Réévaluations sans estimation de population" ci-dessous).

## Réévaluations sans estimation de population

Une réévaluation peut porter une catégorie de menace sans estimation chiffrée de population (plus fréquent que l'inverse pour les réévaluations anciennes). **À l'implémentation :** décider du traitement visuel de ces réévaluations (voir "Rendu" dans `technical-specifications.md`) — pressenti : la teinte de fond continue de refléter la catégorie de menace de cette année-là, mais le nombre d'icônes reste celui de la dernière estimation chiffrée connue (interpolée, voir "Animation" dans `technical-specifications.md`) plutôt que de disparaître.

## Format de sortie

```json
{
  "species": [
    {
      "id": "tiger",
      "nameFr": "Tigre",
      "nameEn": "Tiger",
      "assessments": [
        { "year": 1996, "category": "EN", "population": null },
        { "year": 2008, "category": "EN", "population": 3200 },
        { "year": 2022, "category": "EN", "population": 4485 }
      ]
    }
  ]
}
```

`assessments` trié par `year` croissant. `population` à `null` quand l'évaluation ne fournit pas d'estimation chiffrée (voir "Réévaluations sans estimation de population" ci-dessus), jamais une valeur devinée ou interpolée dans les données elles-mêmes (l'interpolation reste un calcul d'affichage, voir "Animation" dans `technical-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Chaque espèce a au moins deux réévaluations dans `assessments` (une trajectoire suppose au moins deux points).
- Chaque espèce a au moins une réévaluation avec une `population` non nulle (sans quoi la métaphore visuelle retenue, voir "Rendu" dans `technical-specifications.md`, n'a rien à afficher).
- `assessments` est trié par `year` croissant.
