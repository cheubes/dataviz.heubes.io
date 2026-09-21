# Modèle de données : Les lignes de faille

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : implémenté.**

## Dataset source

Deux jeux de données :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Earthquake Catalog (fdsnws/event) | United States Geological Survey (USGS) | https://earthquake.usgs.gov/fdsnws/event/1/ | Domaine public, confirmé à l'implémentation sur la page officielle des politiques USGS ("USGS-authored or produced data and information are considered to be in the U.S. Public Domain") | 2026-09-16 |
| Tectonic plate boundaries (modèle de Bird, 2003) | Peter Bird, redistribué par Hugo Ahlenius/Nordpil (dépôt `fraxen/tectonicplates`) | https://github.com/fraxen/tectonicplates | Open Data Commons Attribution License (ODC-BY), attribution à Hugo Ahlenius, Nordpil et Peter Bird requise | 2026-09-16 |

API USGS interrogée directement (`fdsnws/event/1/query?format=geojson&starttime=1900-01-01&minmagnitude=6&orderby=time-asc`), format GeoJSON natif, champs riches (magnitude, profondeur, date, localisation, intensité), aucun blocage rencontré. Frontières de plaques récupérées depuis `GeoJSON/PB2002_boundaries.json` du dépôt `fraxen/tectonicplates` (241 tronçons de frontière, `LineString` chacun).

## Angle retenu : même mécanique que volcanic-eruptions, plaques révélées

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : reprise assumée du mécanisme de `volcanic-eruptions` (planisphère en boucle continue, chaque événement pulse à sa date réelle, intensité du pulse liée à la magnitude), plutôt qu'une différenciation forcée. Deux éléments distinguent malgré tout cette visualisation :

1. **Frontières de plaques tectoniques dessinées en superposition statique** (voir "Rendu" dans `technical-specifications.md`) : les pulses sismiques, calculés uniquement à partir des données USGS, viennent épouser ces lignes tracées indépendamment (modèle géophysique de Bird, 2003) — rend visible la structure géologique sans l'affirmer dans le texte.
2. **Fenêtre temporelle et volume radicalement différents** : depuis le début de l'ère instrumentale (~1900) plutôt que dix mille ans, séismes majeurs uniquement (voir "Périmètre retenu" ci-dessous) plutôt que l'intégralité d'un catalogue géologique — un ordre de grandeur de densité et de rythme très différent de `volcanic-eruptions`, même si le mécanisme visuel de base est le même.

## Périmètre retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **magnitude ≥ 6,0, depuis 1900**. Volume réel mesuré à l'implémentation : **14 453 séismes** (1900 à 2026), nettement plus dense que les "quelques milliers" pressentis au cadrage (voir "Points tranchés à l'implémentation" dans `technical-specifications.md` pour l'effet sur le calibrage de l'animation). Répartition par décennie relativement stable (de 350 événements sur 1900-1909 à un pic de 1 585 sur 2000-2009), pas de biais de complétude marqué comparable à celui documenté pour `volcanic-eruptions` : le seuil de magnitude 6 semble suffisamment élevé pour rester correctement détecté dès le début de l'ère instrumentale.

Le catalogue USGS renvoyé pour cette requête inclut aussi des événements non sismiques enregistrés par les mêmes réseaux (`properties.type`) : 69 essais nucléaires et 1 explosion, exclus du fichier de sortie (voir "Contraintes de validation" ci-dessous) pour ne garder que `type: "earthquake"` (14 453 sur 14 523 événements bruts renvoyés par l'API).

## Champs USGS utilisés

| Champ (`properties`/`geometry` GeoJSON) | Usage |
|---|---|
| `mag` | Intensité/taille du pulse (voir "Rendu" dans `technical-specifications.md`) |
| `place` | Fiche de détail |
| `time` | Position sur la chronologie simulée |
| `coordinates` (longitude, latitude, profondeur) | Position sur le planisphère ; profondeur affichée en fiche de détail, pas encodée visuellement (voir échanges de cadrage : la magnitude reste la seule dimension visuelle principale, comme le VEI pour `volcanic-eruptions`) |

## Sélection des séismes à annoter

Les sept candidats pressentis au cadrage ont tous été retrouvés dans le catalogue réel, avec leur véritable identifiant USGS : San Francisco (`official19060418131226300_12`, M7,9, 1906), Chili (`official19600522191120_30`, M9,5, 1960, le plus puissant jamais enregistré), Alaska (`official19640328033616_30`, M9,2, 1964), Tangshan (`usp0000hjg`, M7,5, 1976, identifié par l'horodatage exact du séisme principal, 1976-07-27T19:42:54 UTC soit le 28 juillet à 3h42 heure de Pékin, une date historique bien documentée), Sumatra-Andaman (`official20041226005853450_30`, M9,1, 2004), Haïti (`usp000h60h`, M7,0, 2010), Tōhoku (`official20110311054624120_30`, M9,1, 2011). Ces sept entrées portent `notable: true`.

## Format de sortie

```json
{
  "generatedAt": "2026-09-16",
  "plateBoundaries": { "type": "MultiLineString", "coordinates": [] },
  "earthquakes": [
    { "id": "official19060418131226300_12", "lat": 37.75, "lng": -122.55, "year": 1906, "magnitude": 7.9, "depthKm": null, "place": "The 1906 San Francisco, California Earthquake", "notable": true, "nameFr": "Le séisme de San Francisco", "nameEn": "The San Francisco earthquake" }
  ]
}
```

`plateBoundaries` porte directement la géométrie des frontières de plaques (voir "Dataset source" ci-dessus), pas de fichier séparé : un seul jeu de données statique, contrairement aux `earthquakes` qui portent la dimension temporelle. `notable`/`nameFr`/`nameEn` uniquement pour les séismes retenus (voir "Sélection des séismes à annoter" ci-dessus), même convention que `volcanic-eruptions`. `depthKm` est `null` pour 103 séismes anciens sans profondeur renseignée dans le catalogue (principalement les événements historiques repris du catalogue centennial ISC-GEM, réseau `cent`) : affiché comme tel en fiche de détail plutôt que remplacé par une valeur inventée. `id` reprend directement l'identifiant natif de l'événement USGS (`properties.id` / `feature.id` du GeoJSON source), pas un identifiant reconstruit.

## Contraintes de validation propres à cette visualisation

- `earthquakes` est trié par `year` croissant (par horodatage exact avant simplification en année, pour un ordre stable entre séismes d'une même année).
- Un séisme marqué `notable: true` porte `nameFr` et `nameEn`.
- `plateBoundaries` est une géométrie valide (`MultiLineString`), pas un `FeatureCollection` complet : pas besoin des propriétés par plaque (nom, type de frontière) pour cette visualisation, une simplification volontaire par rapport au jeu de données source complet.
- `earthquakes` ne contient que les événements dont `properties.type` vaut `"earthquake"` dans la réponse USGS : exclut les essais nucléaires et explosions enregistrés par les mêmes réseaux sismiques (voir "Périmètre retenu" ci-dessus).
