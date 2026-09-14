# Modèle de données : Les grandes migrations

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

Quatre jeux de données, trois trajectoires individuelles et un jeu d'occurrences agrégées :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Australia's east coast humpback whales: satellite tag derived movements | Movebank Data Repository | https://doi.org/10.5441/001/1.294 | CC0 1.0 Universal | 2026-09-14 |
| Behavioural estimation of blue whale movements in the Northeast Pacific | Movebank Data Repository | https://doi.org/10.5441/001/1.5ph88fk2 | CC0 1.0 Universal | 2026-09-14 |
| Comparison of movement strategies of three populations of white-bearded wildebeest | Movebank Data Repository | https://doi.org/10.5441/001/1.h0t27719 | CC0 1.0 Universal | 2026-09-14 |
| GBIF Occurrence Data (*Danaus plexippus*, Amérique du Nord) | GBIF.org | https://www.gbif.org/species/5133088 | CC0 / CC BY (variable par occurrence, voir "Attribution" dans `biodiversity/data-model.md` pour la même nuance) | 2026-09-14 |

Toutes CC0 ou assimilé : pas de nuance de licence à documenter ici, à la différence de `bird-migrations` (une de ses quatre espèces sous licence NC).

**Accès :** les trois jeux Movebank sont récupérés depuis le Movebank *Data Repository* (`datarepository.movebank.org`, dépôt DSpace distinct de l'API de tracking principale `movebank.org`), qui expose les fichiers CSV directement en lecture anonyme via son API REST (`/server/api/discover/search/objects` pour retrouver l'item depuis le DOI, puis `/server/api/core/items/{id}/bundles` et `.../bitstreams` pour les liens de téléchargement) — à la différence de l'API de tracking principale, qui a renvoyé une erreur 401 sans compte Movebank lors des essais d'implémentation. Aucun compte ni authentification nécessaire pour ces trois études.

## Trois mécaniques de données distinctes

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : un seul planisphère mondial réunit trois types de migration aux mécaniques radicalement différentes, chacune avec son propre traitement de données et son propre rendu (voir `technical-specifications.md`) :

1. **Trajectoires individuelles point-à-point** (baleines) — même mécanique de données que `bird-migrations` (une trajectoire GPS/Argos réelle par individu, dépliée en jour de l'année).
2. **Trajectoire individuelle en boucle fermée** (gnous) — même mécanique de données que les baleines, mais le trajet ne va pas d'un point A vers un point B : il revient sensiblement à son point de départ, suivant les pluies au sein d'un même écosystème plutôt qu'une migration saisonnière classique.
3. **Densité d'occurrences agrégées, pas de trajectoire individuelle** (monarque) — aucun individu ne parcourt le trajet complet (relais entre générations successives, voir "Angle éditorial" dans `functional-specifications.md`) : la donnée disponible est un nuage d'observations GBIF, pas des positions GPS individuelles. Même famille de source que `flower-phenology`, mais agrégée spatialement (une grille nord-américaine par mois) plutôt que dans un calendrier radial.

## Pas de notion de direction (automne/printemps)

Divergence assumée par rapport à `bird-migrations` (voir échanges de cadrage) : la distinction "automne/printemps" de `bird-migrations` est propre à des oiseaux nichant dans l'hémisphère nord. Elle ne généralise pas à ce panorama mondial (baleines australes, gnous équatoriaux suivant les pluies plutôt que les saisons, monarques nord-américains à cycle multigénérationnel) : chaque espèce/étude porte seulement un jour de l'année (voir "Cycle calendaire unique" dans `functional-specifications.md`), sans étiquette de direction.

## Sélection des espèces/études

Quatre candidats identifiés par recherche dans l'index du Movebank Data Repository et sur GBIF (voir "Dataset source" ci-dessus), même démarche que `bird-migrations`. Les deux études de baleines se sont révélées exploitables ensemble une fois inspectées : couverture temporelle comparable (plusieurs mois par individu), qualité de trajectoire suffisante pour les deux, retenues toutes les deux pour enrichir le panorama (deux océans, deux stratégies).

Individus retenus par espèce (quatre par étude de baleine, trois pour les gnous, voir "Prétraitement" ci-dessous pour les critères de sélection) :

| Espèce | Individus (identifiant original Movebank) |
|---|---|
| Baleine à bosse | 88741, 88729, 96398, 98129 |
| Baleine bleue | 2007CA-Bmu-10836, 2002MX-Bmu-00840, 2008CR-Bmu-00846, 2006CA-Bmu-02083 |
| Gnou à barbe blanche | Naboisho, Ledama, Kayioni (population « Mara », voir ci-dessous) |

## Prétraitement (réalisé à l'implémentation, hors build)

### Baleines (trajectoires individuelles)

Même logique que le prétraitement de `bird-migrations` (voir "Prétraitement" dans son `data-model.md`) : téléchargement de l'export GPS/Argos complet par étude, filtre sur `visible=true` (élimine nativement les positions marquées comme aberrantes par Movebank, quel que soit l'algorithme utilisé en amont), un point conservé par jour calendaire (premier point valide du jour), simplification Douglas-Peucker (epsilon 0,05°), anonymisation de l'identifiant individu (`HW_001`-`HW_004`, `BW_001`-`BW_004`). Pas de découpage en legs autumn/spring (voir "Pas de notion de direction" ci-dessus) : une seule trajectoire continue par individu.

Pour la baleine à bosse, les événements portent un champ `modelled` (positions state-space, voir Andrews-Goff et al. 2023) en plus des positions Argos brutes : quand un individu dispose de positions modélisées, celles-ci remplacent entièrement les positions brutes (plus régulières, pas de doublon de même horodatage) plutôt que de mélanger les deux. La baleine bleue ne fournit que des positions Argos brutes (pas de champ `modelled` dans cet export).

Quatre individus retenus par étude, choisis parmi ceux disposant d'une couverture temporelle la plus longue (plusieurs mois) et d'un volume de positions modélisées ou brutes suffisant, en couvrant des périodes de déploiement différentes (pour varier la portion du cycle migratoire visible une fois rejouée sur l'année simulée).

### Gnous (trajectoire individuelle en boucle)

Le jeu de données couvre trois populations distinctes (`study-site` dans les données de référence) : Mara, Amboseli Basin, Athi-Kaputiei Plains. Seule la population **Mara** est retenue, cohérente avec l'angle éditorial ("gnous suivis dans l'écosystème Serengeti-Mara", voir `functional-specifications.md`) : les deux autres populations sont écartées sans traitement.

Fixes GPS horaires (16 par jour) sur plusieurs années par individu : contrairement aux baleines, une fenêtre d'un an (365 jours depuis le premier fix valide de l'individu) est extraite par individu plutôt que la totalité du déploiement — l'objectif ici est un seul cycle annuel rejouable (voir "Pas de notion de direction" ci-dessus), pas un dépliement multi-année comme les baleines (dont chaque déploiement dure déjà moins d'un an). Même traitement ensuite : un point conservé par jour, simplification Douglas-Peucker (epsilon 0,01°, plus fin que les baleines pour préserver le contour du territoire malgré la densité de fixes bruts), anonymisation (`WB_001`-`WB_003`). Le point de départ et le point d'arrivée de la fenêtre d'un an ne coïncident pas exactement (écart constaté de l'ordre de 10 à 25 km selon l'individu) : cohérent avec "revient sensiblement à son point de départ" plutôt qu'une boucle géométriquement fermée, aucun ajustement artificiel appliqué pour forcer la coïncidence.

### Monarque (densité agrégée)

**Écart au principe initial (agrégation via l'API SQL Downloads de GBIF), imposé par une contrainte d'accès :** cette API nécessite un compte GBIF authentifié (`POST /v1/occurrence/download/request`), indisponible au moment de l'implémentation. Remplacée par une agrégation équivalente via l'API de recherche publique, sans authentification :

1. Grille régulière de 2° × 2° en latitude/longitude sur l'Amérique du Nord (14°N-52°N, 125°O-65°O, soit 570 cellules), calée sur l'aire de répartition du monarque (zones de reproduction jusqu'au sud du Canada, corridor de migration, sites d'hivernage au Mexique) plutôt que sur une grille H3 comme `biodiversity` (voir "Trois mécaniques de données distinctes" ci-dessus).
2. Pour chaque cellule : une requête `GET /v1/occurrence/search` avec `taxonKey=5133088` (*Danaus plexippus*), `hasCoordinate=true`, `hasGeospatialIssue=false`, `geometry` (polygone WKT de la cellule) et `facet=month&facetLimit=12&limit=0` — la facette mensuelle renvoie en une seule requête le nombre d'occurrences par mois pour cette cellule, sans jamais télécharger d'enregistrement individuel (774 264 occurrences au total pour l'emprise nord-américaine, bien au-delà de ce qu'une pagination complète permettrait). Limite de fréquence de l'API rencontrée en cours de récupération (~10 % des cellules en erreur 429) : cellules concernées ré-essayées séparément avec un espacement d'environ une seconde, sans perte de données au global.
3. Sortie : un enregistrement `density` par combinaison (cellule, mois) avec au moins une occurrence — 2 846 combinaisons au total. Centre de cellule en `lat`/`lng` (voir "Format de sortie" ci-dessous), `DENSITY_CELL_DEGREES = 2` répliqué comme constante dans `render.ts` pour le dessin (voir `technical-specifications.md`).

Vérification a posteriori sur la latitude moyenne pondérée par mois (29°N en janvier, 41°N en août, retour à 30°N en décembre) : cohérente avec la biologie du monarque (hivernage mexicain, expansion estivale vers le nord, migration automnale), aucun retraitement supplémentaire jugé nécessaire.

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
