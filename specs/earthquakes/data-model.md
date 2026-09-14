# Modèle de données : Les lignes de faille

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

Deux jeux de données :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Earthquake Catalog (fdsnws/event) | United States Geological Survey (USGS) | https://earthquake.usgs.gov/fdsnws/event/1/ | Domaine public (données du gouvernement fédéral américain, non explicitement confirmé sur la page consultée, à revérifier — voir "Points à valider à l'implémentation" dans `technical-specifications.md`) | À renseigner à l'implémentation |
| Tectonic plate boundaries (modèle de Bird, 2003) | Peter Bird, redistribué par Hugo Ahlenius/Nordpil (dépôt `fraxen/tectonicplates`) | https://github.com/fraxen/tectonicplates | Open Data Commons Attribution License (ODC-BY), attribution à Hugo Ahlenius, Nordpil et Peter Bird requise | À renseigner à l'implémentation |

API USGS confirmée accessible sans blocage (voir échanges de cadrage), format GeoJSON natif, champs riches (magnitude, profondeur, date, localisation, intensité). Licence USGS non blindée par une vérification directe de la page de conditions d'utilisation (contrairement au reste des champs de l'API, bien documentés) : à confirmer, mais avec un niveau de confiance nettement supérieur à `volcanic-eruptions` — les données USGS sont conventionnellement domaine public, même famille que les données NOAA déjà utilisées pour `light-pollution`.

## Angle retenu : même mécanique que volcanic-eruptions, plaques révélées

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : reprise assumée du mécanisme de `volcanic-eruptions` (planisphère en boucle continue, chaque événement pulse à sa date réelle, intensité du pulse liée à la magnitude), plutôt qu'une différenciation forcée. Deux éléments distinguent malgré tout cette visualisation :

1. **Frontières de plaques tectoniques dessinées en superposition statique** (voir "Rendu" dans `technical-specifications.md`) : les pulses sismiques, calculés uniquement à partir des données USGS, viennent épouser ces lignes tracées indépendamment (modèle géophysique de Bird, 2003) — rend visible la structure géologique sans l'affirmer dans le texte.
2. **Fenêtre temporelle et volume radicalement différents** : depuis le début de l'ère instrumentale (~1900) plutôt que dix mille ans, séismes majeurs uniquement (voir "Périmètre retenu" ci-dessous) plutôt que l'intégralité d'un catalogue géologique — un ordre de grandeur de densité et de rythme très différent de `volcanic-eruptions`, même si le mécanisme visuel de base est le même.

## Périmètre retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **magnitude ≥ 6,0, depuis environ 1900** (année de départ exacte à confirmer sur la complétude réelle du catalogue USGS pour cette magnitude). Volume attendu du même ordre de grandeur que `volcanic-eruptions` (quelques milliers d'événements), compatible avec le mécanisme de pulse en boucle continue déjà conçu pour cette dernière.

## Champs USGS utilisés

| Champ (`properties`/`geometry` GeoJSON) | Usage |
|---|---|
| `mag` | Intensité/taille du pulse (voir "Rendu" dans `technical-specifications.md`) |
| `place` | Fiche de détail |
| `time` | Position sur la chronologie simulée |
| `coordinates` (longitude, latitude, profondeur) | Position sur le planisphère ; profondeur affichée en fiche de détail, pas encodée visuellement (voir échanges de cadrage : la magnitude reste la seule dimension visuelle principale, comme le VEI pour `volcanic-eruptions`) |

## Sélection des séismes à annoter (réalisée à l'implémentation)

Même principe que `volcanic-eruptions` (voir "Sélection des éruptions à annoter" dans son `data-model.md`) : candidats pressentis, à confirmer sur le catalogue réel — San Francisco (1906), Chili (1960, le plus puissant jamais enregistré, M9,5), Alaska (1964), Tangshan (1976), Sumatra-Andaman (2004), Haïti (2010), Tōhoku (2011).

## Format de sortie

```json
{
  "generatedAt": "2026-09-13",
  "plateBoundaries": { "type": "MultiLineString", "coordinates": [] },
  "earthquakes": [
    { "id": "usgs-1906sf", "lat": 37.75, "lng": -122.55, "year": 1906, "magnitude": 7.9, "depthKm": 8, "place": "San Francisco, Californie", "notable": true, "nameFr": "Le séisme de San Francisco", "nameEn": "The San Francisco earthquake" }
  ]
}
```

`plateBoundaries` porte directement la géométrie des frontières de plaques (voir "Dataset source" ci-dessus), pas de fichier séparé : un seul jeu de données statique, contrairement aux `earthquakes` qui portent la dimension temporelle. `notable`/`nameFr`/`nameEn` uniquement pour les séismes retenus (voir "Sélection des séismes à annoter" ci-dessus), même convention que `volcanic-eruptions`.

## Contraintes de validation propres à cette visualisation

- `earthquakes` est trié par `year` croissant.
- Un séisme marqué `notable: true` porte `nameFr` et `nameEn`.
- `plateBoundaries` est une géométrie valide (`MultiLineString`), pas un `FeatureCollection` complet : pas besoin des propriétés par plaque (nom, type de frontière) pour cette visualisation, une simplification volontaire par rapport au jeu de données source complet.
