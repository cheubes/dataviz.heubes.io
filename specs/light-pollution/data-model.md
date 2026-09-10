# Modèle de données : Le ciel, d'année en année

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| VIIRS Nighttime Lights (VNL), composites annuels | NOAA Earth Observation Group | https://eogdata.mines.edu/products/vnl/ | Creative Commons Attribution 4.0 International | 2026-09-09 |

Données satellite de radiance nocturne, résolution native 15 secondes d'arc (~500 m à l'équateur), couverture mondiale (65°S à 75°N). Domaine public d'origine (National Oceanic and Atmospheric Administration, agence fédérale américaine), republié par l'Earth Observation Group sous CC BY 4.0 avec obligation de citation. Même source primaire que les cartes de pollution lumineuse existantes (ANPCEN, AVEX, lightpollutionmap.info), utilisée ici directement plutôt qu'une republication tierce (voir échanges de cadrage).

Deux versions du produit "Annual VNL V2" ont été utilisées pour couvrir toute la période (voir "Prétraitement" ci-dessous) : **v2.1** pour 2013-2021 et **v2.2** pour 2022-2025, EOG publiant ce produit par incréments annuels versionnés plutôt qu'en une série unique continûment renumérotée. Les deux versions partagent la même méthodologie de traitement (mêmes seuils de filtrage, même chaîne "Annual VNL V2") : contrairement à la rupture V1→V2 (changement d'algorithme documenté dans la littérature), il n'y a pas de changement de méthode entre v2.1 et v2.2, seulement l'ajout d'années suivantes. Aucune discontinuité artificielle constatée à la jonction 2021/2022 dans la série obtenue (voir "Points à valider à l'implémentation" dans `technical-specifications.md`).

## Couverture géographique et temporelle

- **Géographique : France métropolitaine**, sur la même grille hexagonale H3 (résolution 4, 395 cellules) déjà produite pour `biodiversity` (voir "Réutilisation de la grille" ci-dessous) — pas les DOM, même périmètre que les autres visualisations du site utilisant cette grille.
- **Temporelle : composites annuels de 2013 à 2025** (treize années). Le composite 2012 a été écarté (premier composite VIIRS, couverture partielle de l'année, non comparable aux suivants). Décision explicite de l'utilisateur (voir échanges de cadrage) : montrer l'évolution plutôt qu'un instantané — voir "Angle éditorial" dans `functional-specifications.md` pour ce que cette évolution montre réellement (un recul de l'intensité lumineuse, pas une hausse).

## Réutilisation de la grille

Décision technique prise à la lecture de `biodiversity/data-model.md` : les 395 cellules H3 (résolution 4) et leurs géométries sont reprises telles quelles depuis `public/data/biodiversity/hexbins.json` (mêmes identifiants `h3`, mêmes polygones), plutôt qu'une nouvelle sélection/génération de grille. Cela évite de refaire le travail déjà fait pour `biodiversity` (filtrage des cellules côtières aberrantes, correction du sens de l'anneau des polygones H3, voir "Prétraitement" dans son `data-model.md`) : seules de nouvelles propriétés (radiance et classe de visibilité par année) sont calculées pour ces mêmes cellules, pas une nouvelle géométrie.

## Échelle de visibilité du ciel

Décision explicite de l'utilisateur (voir échanges de cadrage) : la radiance mesurée est traduite en une échelle de visibilité inspirée de l'échelle de Bortle (référence standard en astronomie amateur, neuf paliers de « ciel de site d'observation exceptionnel » à « ciel de centre-ville »), plutôt qu'affichée en unités physiques brutes (nW/cm²/sr).

La conversion rigoureuse radiance satellite → luminance du ciel au zénith (modèle de Falchi et al., *The New World Atlas of Artificial Night Sky Brightness*, 2016) nécessite une modélisation de la propagation atmosphérique de la lumière (voir par ex. Bühler, Deverchère, Plotard & Vauclair (DarkSkyLab), *Multi-faceted light pollution modelling and its application to the decline of artificial illuminance in France*, arXiv:2510.02977, 2026, qui applique cette approche à la France) : hors de portée pour ce site, ce n'est pas un simple calcul par pixel. La table ci-dessous est donc une simplification assumée, documentée comme telle plutôt que présentée comme une classification Bortle rigoureuse :Six paliers construits sur la radiance brute VIIRS, calibrés sur la distribution réelle des 395 cellules × 13 années (répartition visée, pas des quantiles stricts), ancrés qualitativement sur la littérature disponible (seuil de détection VIIRS usuel ≈ 0,5 nW/cm²/sr pour « pas de lumière artificielle significative » ; radiances de terrain publiées, ex. Nurbandi et al. 2016, ≈ 0,2-0,7 nW/cm²/sr pour un ciel rural/transition, ≈ 24-44 nW/cm²/sr pour un ciel de ville).

| Palier | Radiance (nW/cm²/sr) | FR | EN | Part des cellules (13 ans cumulées) |
|---|---|---|---|---|
| 1 | < 0,3 | Ciel remarquable, Voie lactée bien visible | Pristine sky, Milky Way clearly visible | 30 % |
| 2 | 0,3 – 0,6 | Ciel de campagne, halo lumineux distant | Rural sky, faint distant glow | 23 % |
| 3 | 0,6 – 1,2 | Ciel périurbain, Voie lactée affaiblie | Suburban sky, Milky Way washed out | 21 % |
| 4 | 1,2 – 2,5 | Ciel urbain, halo dominant | Urban sky, glow dominates | 15 % |
| 5 | 2,5 – 6 | Ciel de grande ville, quelques dizaines d'étoiles visibles | City sky, only a few dozen stars visible | 8 % |
| 6 | > 6 | Ciel de centre-ville, halo omniprésent | Inner-city sky, pervasive glow | 2 % |

Bornes resserrées vers le bas par rapport à une première proposition calibrée sur des mesures ponctuelles (pixel unique, ~500 m) : la moyenne sur une cellule de 1770 km² (résolution H3 4) écrase fortement les pics urbains (max mesuré sur la France : 30,7 nW/cm²/sr, cellule parisienne, largement sous les dizaines de milliers de nW/cm²/sr d'un pixel de cœur de ville), d'où des seuils environ dix fois plus bas que les repères "pixel unique" de la littérature.

## Prétraitement (réalisé à l'implémentation, hors build)

Contrairement aux autres visualisations du site, le prétraitement part de données **raster** (grille de pixels), pas d'un export tabulaire : un traitement géospatial de type « statistique zonale » est nécessaire, hors de portée d'un script Node seul sans dépendance dédiée. Outil utilisé : Python (`rasterio` 1.4.3 / `rasterstats` 0.21.0, `h3` 4.4.2), dans un environnement virtuel local ponctuel (pas une dépendance du projet, même logique que `h3-js` ou `topojson-simplify` pour `biodiversity`/`bird-migrations`, voir leurs `technical-specifications.md`).

1. Téléchargement manuel par l'utilisateur des 13 composites annuels VIIRS VNL "average_masked" (2013-2025, voir "Dataset source" ci-dessus pour les versions), depuis `eogdata.mines.edu` (compte requis, authentification OpenID Connect). ~300 Mo compressés par année, ~11,6 Go décompressés chacun (rasters mondiaux 86401×33601 pixels, WGS84, aucun découpage régional disponible depuis la V2).
2. Décompression à la volée (un fichier à la fois, supprimé après traitement pour limiter l'usage disque) plutôt qu'un découpage préalable à la bbox France : `rasterstats.zonal_stats` ne lit que la fenêtre nécessaire autour de chaque polygone, un découpage explicite n'apportait rien.
3. Pour chaque cellule H3 reprise de `biodiversity/hexbins.json` et chaque année, calcul de la radiance moyenne des pixels contenus dans le polygone de la cellule (statistique zonale, `rasterstats.zonal_stats`, moyenne uniquement).
4. Conversion de chaque valeur moyenne en palier de l'échelle de visibilité (voir "Échelle de visibilité du ciel" ci-dessus).
5. Écriture de `public/data/light-pollution/skybins.json`.

**Piège rencontré :** un bug de variable (année utilisée comme clé sous forme de chaîne à l'écriture, recherchée comme entier à la lecture) faisait silencieusement produire un `byYear` vide pour les 395 cellules, sans erreur ni avertissement — repéré uniquement en inspectant le JSON produit, pas au moment de l'exécution du script.

## Format des données statifiées

```json
{
  "type": "FeatureCollection",
  "scale": [
    { "id": 1, "nameFr": "Ciel remarquable, Voie lactée bien visible", "nameEn": "Pristine sky, Milky Way clearly visible" },
    { "id": 5, "nameFr": "Ciel de grande ville, quelques dizaines d'étoiles visibles", "nameEn": "City sky, only a few dozen stars visible" }
  ],
  "years": [2013, 2014, "…", 2024, 2025],
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3": "851f8ebfffffff",
        "byYear": {
          "2013": { "radiance": 0.4, "scale": 2 },
          "2024": { "radiance": 0.2, "scale": 1 }
        }
      },
      "geometry": { "type": "Polygon", "coordinates": [] }
    }
  ]
}
```

`geometry` identique à celle de la cellule correspondante dans `biodiversity/hexbins.json` (voir "Réutilisation de la grille" ci-dessus). `scale` référence les paliers de la table ci-dessus ; `years` liste les treize années 2013-2025 (continuité confirmée, voir "Dataset source" ci-dessus et "Points à valider à l'implémentation" dans `technical-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Chaque cellule porte une entrée `byYear` pour chaque année listée dans `years`, sans année manquante (une cellule sans donnée exploitable pour une année reste une exception à documenter, pas une absence silencieuse).
- Chaque `scale` référencé dans `byYear` existe dans la liste `scale` de premier niveau.
- Les 395 cellules de `biodiversity/hexbins.json` sont toutes présentes ici (même géométrie de grille, voir "Réutilisation de la grille" ci-dessus).
