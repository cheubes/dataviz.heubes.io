# Modèle de données : Les grandes migrations

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

Quatre jeux de données, trois trajectoires individuelles et un jeu d'occurrences agrégées :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Australia's east coast humpback whales: satellite tag derived movements | Movebank Data Repository | https://doi.org/10.5441/001/1.294 | CC0 1.0 Universal | À renseigner à l'implémentation |
| Behavioural estimation of blue whale movements in the Northeast Pacific | Movebank Data Repository | https://doi.org/10.5441/001/1.5ph88fk2 | CC0 1.0 Universal | À renseigner à l'implémentation |
| Comparison of movement strategies of three populations of white-bearded wildebeest | Movebank Data Repository | https://doi.org/10.5441/001/1.h0t27719 | CC0 1.0 Universal | À renseigner à l'implémentation |
| GBIF Occurrence Data (*Danaus plexippus*, Amérique du Nord) | GBIF.org | https://www.gbif.org/species/search?q=Danaus%20plexippus | CC0 / CC BY (variable par occurrence, voir "Attribution" dans `biodiversity/data-model.md` pour la même nuance) | À renseigner à l'implémentation |

Toutes CC0 ou assimilé : pas de nuance de licence à documenter ici, à la différence de `bird-migrations` (une de ses quatre espèces sous licence NC).

## Trois mécaniques de données distinctes

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : un seul planisphère mondial réunit trois types de migration aux mécaniques radicalement différentes, chacune avec son propre traitement de données et son propre rendu (voir `technical-specifications.md`) :

1. **Trajectoires individuelles point-à-point** (baleines) — même mécanique de données que `bird-migrations` (une trajectoire GPS/Argos réelle par individu, dépliée en jour de l'année).
2. **Trajectoire individuelle en boucle fermée** (gnous) — même mécanique de données que les baleines, mais le trajet ne va pas d'un point A vers un point B : il revient sensiblement à son point de départ, suivant les pluies au sein d'un même écosystème plutôt qu'une migration saisonnière classique.
3. **Densité d'occurrences agrégées, pas de trajectoire individuelle** (monarque) — aucun individu ne parcourt le trajet complet (relais entre générations successives, voir "Angle éditorial" dans `functional-specifications.md`) : la donnée disponible est un nuage d'observations GBIF, pas des positions GPS individuelles. Même famille de source que `flower-phenology`, mais agrégée spatialement (une grille nord-américaine par mois) plutôt que dans un calendrier radial.

## Pas de notion de direction (automne/printemps)

Divergence assumée par rapport à `bird-migrations` (voir échanges de cadrage) : la distinction "automne/printemps" de `bird-migrations` est propre à des oiseaux nichant dans l'hémisphère nord. Elle ne généralise pas à ce panorama mondial (baleines australes, gnous équatoriaux suivant les pluies plutôt que les saisons, monarques nord-américains à cycle multigénérationnel) : chaque espèce/étude porte seulement un jour de l'année (voir "Cycle calendaire unique" dans `functional-specifications.md`), sans étiquette de direction.

## Sélection des espèces/études (réalisée à l'implémentation)

Quatre candidats identifiés par recherche dans l'index du Movebank Data Repository et sur GBIF (voir "Dataset source" ci-dessus), même démarche que `bird-migrations`. **À l'implémentation :** confirmer que les deux études de baleines (à bosse et bleue) sont bien exploitables ensemble une fois inspectées en détail (couverture temporelle, qualité des trajectoires individuelles) — les inclure toutes les deux enrichit le panorama (deux océans, deux stratégies), mais si l'une s'avère peu exploitable, le retrait de l'autre ne remet pas en cause la structure de cette visualisation.

## Prétraitement (réalisé à l'implémentation, hors build)

### Baleines et gnous (trajectoires individuelles)

Même logique que le prétraitement de `bird-migrations` (voir "Prétraitement" dans son `data-model.md`) : téléchargement de l'export GPS/Argos complet par étude, isolement des positions valides, dépliement en jour de l'année continu (pour rejouer des individus suivis des années différentes sur un même cycle simulé), simplification Douglas-Peucker, anonymisation de l'identifiant individu. Pas de découpage en legs autumn/spring (voir "Pas de notion de direction" ci-dessus) : une seule trajectoire continue par individu, potentiellement bouclée pour les gnous.

### Monarque (densité agrégée)

Même approche que `biodiversity` (voir "Prétraitement" dans son `data-model.md`) plutôt qu'un téléchargement brut, le volume d'occurrences GBIF pour cette espèce très recensée le justifiant probablement (à confirmer une fois le volume réel mesuré) : agrégation côté serveur via l'API SQL Downloads de GBIF (`GROUP BY` sur position arrondie et mois d'observation), pas une boucle de facettes ni un export d'occurrences individuelles. Grille de sortie à définir à l'implémentation (grille régulière simple en degrés, plus légère qu'une grille H3 complète pour la seule Amérique du Nord plutôt que la France entière de `biodiversity`, à confirmer).

## Format de sortie

```json
{
  "species": [
    { "id": "humpback-whale", "nameFr": "Baleine à bosse", "nameEn": "Humpback Whale", "type": "track" },
    { "id": "blue-whale", "nameFr": "Baleine bleue", "nameEn": "Blue Whale", "type": "track" },
    { "id": "wildebeest", "nameFr": "Gnou à barbe blanche", "nameEn": "White-bearded Wildebeest", "type": "track" },
    { "id": "monarch", "nameFr": "Papillon monarque", "nameEn": "Monarch Butterfly", "type": "density" }
  ],
  "tracks": [
    {
      "individualId": "HW_001",
      "speciesId": "humpback-whale",
      "points": [
        { "lat": -18.1, "lng": 147.7, "date": "2008-07-03" }
      ]
    }
  ],
  "density": [
    { "speciesId": "monarch", "month": 3, "lat": 19.5, "lng": -100.2, "count": 812 }
  ]
}
```

`species[].type` (`"track"` ou `"density"`) indique au client quel mécanisme de rendu appliquer (voir "Rendu" dans `technical-specifications.md`), plutôt qu'une détection implicite depuis la présence de l'espèce dans `tracks` ou `density`. Pas de champ `direction` sur `tracks` (voir "Pas de notion de direction" ci-dessus), à la différence de `bird-migrations`.

## Champs dérivés côté client (pas dans le JSON)

- **Distance totale parcourue** (trajectoires individuelles uniquement) : calculée à l'affichage à partir de la séquence de points, comme `bird-migrations`.

## Contraintes de validation propres à cette visualisation

- Chaque `speciesId` référencé dans `tracks` ou `density` existe dans `species`, avec un `type` cohérent (`track` pour les entrées de `tracks`, `density` pour celles de `density`).
- Chaque trajectoire (`points`) est triée par `date` croissante.
- Un individu (`individualId`) n'apparaît qu'une fois dans `tracks` (pas de split par direction, voir "Pas de notion de direction" ci-dessus).
