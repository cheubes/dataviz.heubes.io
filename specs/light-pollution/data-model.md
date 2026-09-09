# Modèle de données : La nuit qui recule

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| VIIRS Nighttime Lights (VNL), composites annuels | NOAA Earth Observation Group | https://eogdata.mines.edu/products/vnl/ | Creative Commons Attribution 4.0 International | À renseigner à l'implémentation |

Données satellite de radiance nocturne, résolution native 15 secondes d'arc (~500 m à l'équateur), couverture mondiale. Domaine public d'origine (National Oceanic and Atmospheric Administration, agence fédérale américaine), republié par l'Earth Observation Group sous CC BY 4.0 avec obligation de citation. Même source primaire que les cartes de pollution lumineuse existantes (ANPCEN, AVEX, lightpollutionmap.info), utilisée ici directement plutôt qu'une republication tierce (voir échanges de cadrage).

## Couverture géographique et temporelle

- **Géographique : France métropolitaine**, sur la même grille hexagonale H3 (résolution 4, 395 cellules) déjà produite pour `biodiversity` (voir "Réutilisation de la grille" ci-dessous) — pas les DOM, même périmètre que les autres visualisations du site utilisant cette grille.
- **Temporelle : composites annuels de 2013 (premier composite annuel stable, à confirmer à l'implémentation — le premier composite VIIRS de 2012 ne couvre qu'une partie de l'année) à l'année la plus récente disponible.** Décision explicite de l'utilisateur (voir échanges de cadrage) : montrer l'évolution plutôt qu'un instantané.

## Réutilisation de la grille

Décision technique prise à la lecture de `biodiversity/data-model.md` : les 395 cellules H3 (résolution 4) et leurs géométries sont reprises telles quelles depuis `public/data/biodiversity/hexbins.json` (mêmes identifiants `h3`, mêmes polygones), plutôt qu'une nouvelle sélection/génération de grille. Cela évite de refaire le travail déjà fait pour `biodiversity` (filtrage des cellules côtières aberrantes, correction du sens de l'anneau des polygones H3, voir "Prétraitement" dans son `data-model.md`) : seules de nouvelles propriétés (radiance et classe de visibilité par année) sont calculées pour ces mêmes cellules, pas une nouvelle géométrie.

## Échelle de visibilité du ciel

Décision explicite de l'utilisateur (voir échanges de cadrage) : la radiance mesurée est traduite en une échelle de visibilité inspirée de l'échelle de Bortle (référence standard en astronomie amateur, neuf paliers de « ciel de site d'observation exceptionnel » à « ciel de centre-ville »), plutôt qu'affichée en unités physiques brutes (nW/cm²/sr).

**À l'implémentation :** établir la table de correspondance radiance → palier, à partir d'une méthode publiée (ex. modèle de Falchi et al., *The New World Atlas of Artificial Night Sky Brightness*, 2016, qui documente une conversion radiance → luminance du ciel au zénith → classe de Bortle). Un nombre de paliers réduit par rapport aux neuf de l'échelle de Bortle complète est probable (ex. cinq à six paliers, plus lisibles dans une légende), à trancher une fois la distribution réelle des valeurs de radiance sur la France connue.

## Prétraitement (réalisé à l'implémentation, hors build)

Contrairement aux autres visualisations du site, le prétraitement part de données **raster** (grille de pixels), pas d'un export tabulaire : un traitement géospatial de type « statistique zonale » est nécessaire, hors de portée d'un script Node seul sans dépendance dédiée. Outil envisagé : Python (`rasterio` / `rasterstats`) ou `gdal`, utilisé ponctuellement au prétraitement, pas une dépendance du projet (même logique que `h3-js` ou `topojson-simplify` pour `biodiversity`/`bird-migrations`, voir leurs `technical-specifications.md`).

1. Télécharger le composite annuel VIIRS VNL pour chaque année de la période retenue (voir "Couverture géographique et temporelle" ci-dessus).
2. Découper chaque raster à l'emprise de la France métropolitaine (même bounding box que `biodiversity`, voir son `technical-specifications.md`).
3. Pour chaque cellule H3 reprise de `biodiversity/hexbins.json` et chaque année, calculer la radiance moyenne des pixels contenus dans le polygone de la cellule (statistique zonale).
4. Convertir chaque valeur moyenne en palier de l'échelle de visibilité (voir "Échelle de visibilité du ciel" ci-dessus).
5. Écrire `public/data/light-pollution/skybins.json`.

## Format des données statifiées

```json
{
  "type": "FeatureCollection",
  "scale": [
    { "id": 1, "nameFr": "Ciel noir, Voie lactée bien visible", "nameEn": "Dark sky, Milky Way clearly visible" },
    { "id": 5, "nameFr": "Ciel urbain, quelques dizaines d'étoiles visibles", "nameEn": "Urban sky, only a few dozen stars visible" }
  ],
  "years": [2013, 2014, 2024],
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3": "851f8ebfffffff",
        "byYear": {
          "2013": { "radiance": 0.4, "scale": 2 },
          "2024": { "radiance": 1.1, "scale": 3 }
        }
      },
      "geometry": { "type": "Polygon", "coordinates": [] }
    }
  ]
}
```

`geometry` identique à celle de la cellule correspondante dans `biodiversity/hexbins.json` (voir "Réutilisation de la grille" ci-dessus). `scale` liste les paliers de l'échelle de visibilité une fois établis à l'implémentation (voir ci-dessus) ; `years` liste les années effectivement disponibles (voir "Points à valider à l'implémentation" dans `technical-specifications.md` pour la continuité réelle des composites).

## Contraintes de validation propres à cette visualisation

- Chaque cellule porte une entrée `byYear` pour chaque année listée dans `years`, sans année manquante (une cellule sans donnée exploitable pour une année reste une exception à documenter, pas une absence silencieuse).
- Chaque `scale` référencé dans `byYear` existe dans la liste `scale` de premier niveau.
- Les 395 cellules de `biodiversity/hexbins.json` sont toutes présentes ici (même géométrie de grille, voir "Réutilisation de la grille" ci-dessus).
