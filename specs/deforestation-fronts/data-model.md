# Modèle de données : Les fronts de la déforestation

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Global Forest Change (Hansen et al.) | University of Maryland / Google / USGS / NASA | https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/download.html | Creative Commons Attribution 4.0 International | À renseigner à l'implémentation |

Données satellite (Landsat), résolution native 1 seconde d'arc (~30 m à l'équateur), couverture mondiale, mise à jour annuelle (dernière version vérifiée : GFC-2023-v1.11, période 2000-2023). Licence claire, citation requise ("Hansen/UMD/Google/USGS/NASA" + Hansen et al., *Science*, 2013) : pas de zone grise comparable à `satellites-in-orbit` ou `endangered-species`.

## Angle retenu : portraits croisés de grands fronts

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `light-pollution` (grille raster mondiale agrégée sur la France, curseur d'année) déjà présent sur le site : trois cartes régionales réelles, une par grand front de déforestation, plutôt qu'une seule grille mondiale.

## Sélection des fronts (réalisée à l'implémentation)

Trois candidats pressentis, les fronts de déforestation tropicale les plus documentés et les plus emblématiques : **Amazonie** (bassin amazonien, principalement Brésil), **Bassin du Congo** (Afrique centrale), **Bornéo-Sumatra** (Indonésie/Malaisie). À confirmer/ajuster une fois les tuiles Hansen réelles inspectées (voir "Prétraitement" ci-dessous) — même démarche que la sélection des espèces de `bird-migrations`/`endangered-species`.

## Bandes du dataset Hansen utilisées

| Bande | Usage |
|---|---|
| `treecover2000` | Couvert forestier de référence en 2000 (pourcentage de canopée par pixel) ; seuil retenu pour définir "forêt" à confirmer à l'implémentation (valeur usuelle dans la littérature : 30 %) |
| `lossyear` | Année de perte de couvert forestier par pixel (codée en un seul raster cumulatif, pas un raster par année, voir "Prétraitement" ci-dessous) |
| `loss` | Masque binaire de perte (redondant avec `lossyear` > 0, utile en vérification croisée au prétraitement) |

Contrairement à `light-pollution` (un composite VIIRS distinct par année), Hansen fournit une seule tuile `lossyear` par région, l'année de perte étant encodée pixel par pixel : le calcul du pourcentage cumulé de forêt perdue à une année donnée se fait par comparaison (`lossyear <= année`), pas par téléchargement d'un fichier par année.

## Prétraitement (réalisé à l'implémentation, hors build)

Même famille d'outillage que `light-pollution` (statistique zonale sur raster, voir sa section "Prétraitement raster" dans `technical-specifications.md`), Python (`rasterio`/`rasterstats`), pas une dépendance du projet.

1. Télécharger les tuiles Hansen (`treecover2000`, `lossyear`) couvrant chaque front retenu (tuiles de 10° × 10°, voir "Bandes du dataset Hansen utilisées" ci-dessus).
2. Découper une grille régulière par région (résolution à définir à l'implémentation, voir "Points à valider à l'implémentation" dans `technical-specifications.md`).
3. Pour chaque cellule de la grille, ne retenir que les pixels forestiers en 2000 (`treecover2000` au-dessus du seuil retenu) comme dénominateur.
4. Pour chaque cellule et chaque année de 2001 à la dernière année disponible, calculer le pourcentage cumulé de ces pixels avec `lossyear <= année` sur ce dénominateur.
5. Écrire un fichier par front dans `public/data/deforestation-fronts/`.

## Format de sortie

Un fichier par front (`amazon.json`, `congo-basin.json`, `borneo-sumatra.json`, noms indicatifs à confirmer) :

```json
{
  "id": "amazon",
  "nameFr": "Amazonie",
  "nameEn": "Amazon",
  "generatedAt": "2026-09-13",
  "cells": [
    {
      "lat": -3.1,
      "lng": -60.0,
      "forestedPct2000": 87,
      "lossByYear": { "2001": 0.2, "2010": 4.1, "2023": 14.8 }
    }
  ]
}
```

`lossByYear` porte un pourcentage **cumulé** (pas annuel) de perte depuis 2000, cohérent avec une lecture animée qui ne fait qu'augmenter (voir "Animation" dans `technical-specifications.md`). `forestedPct2000` reste disponible pour la fiche de détail (voir "Interactions" dans `functional-specifications.md`) même si non utilisé pour la couleur elle-même.

## Contraintes de validation propres à cette visualisation

- Chaque fichier front a un `id`, `nameFr`, `nameEn` cohérents avec sa carte.
- `lossByYear` est croissant (une perte cumulée ne diminue jamais d'une année sur l'autre).
- Chaque cellule a une entrée pour chaque année de la période couverte (voir "Contraintes de validation" équivalentes dans `light-pollution/data-model.md`, même principe : pas d'année manquante).
