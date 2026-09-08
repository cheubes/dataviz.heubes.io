# Modèle de données : La biodiversité française

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | GBIF Occurrence Data (France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 / CC BY (variable par occurrence individuelle, voir "Attribution" ci-dessous) |
| `retrieved` | 2026-09-08 |

Deux exports SQL formels (avec DOI, voir "Prétraitement" ci-dessous) ont été utilisés à l'implémentation plutôt qu'un usage agrégé générique de l'API de recherche : `https://doi.org/10.15468/dl.h5srta` (agrégation groupe × saison) et `https://doi.org/10.15468/dl.mmqnrd` (dominance par espèce), cités individuellement dans `datasets` du frontmatter (`biodiversity.fr.md` / `.en.md`) plutôt que l'URL de recherche générique ci-dessus.

**Couverture géographique :** France métropolitaine uniquement (voir "Décisions" ci-dessous ; les DOM sont hors périmètre). En pratique, le code pays GBIF `FR` couvre déjà uniquement la métropole : les DOM (Guadeloupe, Martinique, Guyane, Réunion, Mayotte) portent chacun leur propre code ISO 3166-1 distinct côté occurrences GBIF, donc aucune exclusion supplémentaire n'est nécessaire au prétraitement des données elles-mêmes (voir "Prétraitement" ci-dessous pour la nuance équivalente sur le fond de carte, qui lui bundle les DOM sous la même géométrie).

**Couverture temporelle :** occurrences avec date complète (jour/mois/année), 2010 à l'année du prétraitement. La borne haute réelle est celle de `retrieved`, jamais "présent" au sens littéral puisque les données sont figées au moment du build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

**Attribution :** GBIF agrège des occurrences de licences variables par jeu de données contributeur (majoritairement CC0 et CC BY). La mention de crédit générique (voir "Crédit dataset" ci-dessous) suffit pour un usage agrégé de ce type ; elle ne remplace pas une citation DOI dédiée si un export GBIF formel (avec DOI) est utilisé au moment de l'implémentation.

## Deux modes de données

Cette visualisation a deux modes, l'un par défaut (données figées, conforme à la règle commune), l'autre une exception documentée à cette règle (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général, qui permet une exception "documentée et justifiée").

### Mode par défaut : instantané précalculé

Grille hexagonale H3, agrégée hors ligne, committée en JSON statique. Aucun appel réseau vers GBIF depuis le site publié dans ce mode.

### Mode "données en direct"

Bascule explicite (voir `functional-specifications.md`) qui interroge l'API de recherche GBIF en direct depuis le navigateur, pour la combinaison de filtres courante. Voir "Mode données en direct" ci-dessous pour le détail technique.

**Justification de l'exception :** ce mode est un choix éditorial assumé (montrer que le dataset vit, au-delà de l'instantané figé), pas une nécessité technique — le mode par défaut reste pleinement fonctionnel sans lui. Il est donc traité comme une fonctionnalité secondaire optionnelle plutôt que comme le mode de fonctionnement normal de la page.

## Schéma des données brutes (source GBIF)

Champs GBIF utilisés lors du prétraitement, via l'API SQL Downloads (voir "Prétraitement" ci-dessous, table `occurrence`) :

| Champ GBIF | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | Position, arrondie à 0,1° côté SQL puis affectée à une cellule H3 côté script local (voir "Prétraitement") |
| `kingdom`, `phylum`, `class` | Détermination du groupe taxonomique (voir mapping ci-dessous) |
| `month` | Détermination de la saison d'observation (échappé `"month"` en SQL, collision avec une fonction intégrée du moteur, voir "Prétraitement") |
| `scientificName` | Calcul de l'espèce dominante par cellule/groupe |
| `countryCode` | Filtre `FR` (suffit à exclure les DOM, voir ci-dessus) |
| `hasCoordinate`, `hasGeospatialIssues` | Filtre qualité : coordonnées présentes et valides. Nom de colonne au pluriel dans le schéma SQL Downloads, alors que le paramètre équivalent de l'API de recherche (voir "Mode données en direct" ci-dessous) est au singulier (`hasGeospatialIssue`) — une incohérence de nommage propre à GBIF, pas une erreur d'implémentation. |
| `year` | Filtre 2010 à l'année de récupération (échappé `"year"` en SQL, même collision que `month`) |

## Groupes taxonomiques

Filtre unique (radio, un groupe actif à la fois, "Tous les groupes" par défaut). Reptiles et amphibiens sont fusionnés en un seul groupe filtrable (comme dans la palette du draft d'origine), soit six groupes :

| Identifiant (données) | Libellé FR | Libellé EN | Filtre GBIF (`class`) |
|---|---|---|---|
| `birds` | Oiseaux | Birds | Aves |
| `mammals` | Mammifères | Mammals | Mammalia |
| `reptiles-amphibians` | Reptiles et amphibiens | Reptiles and amphibians | Reptilia, Amphibia |
| `insects` | Insectes | Insects | Insecta |
| `plants` | Plantes | Plants | Tracheophyta (`phylum`) |
| `fungi` | Champignons | Fungi | Fungi (`kingdom`) |

## Définition des saisons

Saisons météorologiques (pas calendaires), calculées à partir du mois d'observation :

| Identifiant | Libellé FR | Libellé EN | Mois |
|---|---|---|---|
| `winter` | Hiver | Winter | Décembre, janvier, février |
| `spring` | Printemps | Spring | Mars, avril, mai |
| `summer` | Été | Summer | Juin, juillet, août |
| `autumn` | Automne | Autumn | Septembre, octobre, novembre |

## Prétraitement (réalisé à l'implémentation)

Le principe documenté avant implémentation (interroger `occurrence/search` par facette, ou télécharger les occurrences brutes) s'est révélé impraticable une fois le volume réel mesuré : 123 millions d'occurrences France 2010-2026 à coordonnées valides. Un téléchargement brut aurait représenté plusieurs dizaines de Go à traiter localement ; une boucle de facettes par cellule H3 (résolution 5, ~15 000 requêtes) aurait pris plusieurs heures avec un risque de limitation par l'API. Méthode effectivement utilisée :

1. **Agrégation côté serveur via l'API SQL Downloads de GBIF** (`POST /v1/occurrence/download/request`, `format: SQL_TSV_ZIP`, authentification par compte GBIF), qui exécute un `GROUP BY` sur la table `occurrence` avant export : le fichier résultant ne contient que les combinaisons déjà comptées, pas les enregistrements individuels. Deux requêtes SQL soumises séparément (voir DOI dans "Dataset source" ci-dessus) :
   - **Requête A** (comptage) : `SELECT ROUND(decimalLatitude,1) AS glat, ROUND(decimalLongitude,1) AS glon, class, phylum, kingdom, "month", COUNT(*) FROM occurrence WHERE countryCode='FR' AND hasCoordinate=TRUE AND hasGeospatialIssues=FALSE AND "year">=2010 AND "year"<=2026 AND "month" IS NOT NULL AND (class IN (...) OR phylum='Tracheophyta' OR kingdom='Fungi') GROUP BY ...` — 665 964 lignes en sortie.
   - **Requête B** (dominance par espèce) : même filtre, groupé par `class, phylum, kingdom, scientificName` sans le mois — 9 181 740 lignes en sortie (une clause `HAVING COUNT(*) >= 5` prévue pour réduire le bruit des espèces rares a dû être retirée, `HAVING` n'étant pas supporté par ce moteur SQL ; le filtrage du bruit se fait donc côté script local, voir point 4).
   - **Pièges de dialecte SQL rencontrés** (documentés ici pour toute requête SQL Downloads future) : les identifiants ne s'échappent pas avec des accents graves façon Hive/MySQL (erreur lexicale), mais avec des guillemets doubles façon Trino/ANSI — nécessaire uniquement pour `month` et `year`, qui collisionnent avec des fonctions intégrées du moteur (`class` n'a pas ce problème) ; `HAVING` n'est pas supporté ; la colonne est `hasGeospatialIssues` (pluriel) alors que le paramètre équivalent de l'API de recherche est `hasGeospatialIssue` (singulier, voir tableau ci-dessus).
2. **Script Node local** (ponctuel, non commité, cohérent avec `bird-migrations`/`flower-phenology`) lisant les deux fichiers TSV en flux (`readline`, sans charger les 9,18 millions de lignes de la requête B en mémoire — une première version naïve saturait le tas Node) :
   - Rattache chaque ligne à un groupe taxonomique (mapping ci-dessus) et, pour la requête A, à une saison (mapping ci-dessus).
   - **Filtre de plausibilité géographique, grossier :** une poignée de lignes portent `countryCode=FR` mais des coordonnées manifestement fausses (au large du Costa Rica/Panama dans cet export — une erreur de saisie/interprétation en amont chez GBIF, `hasGeospatialIssues=FALSE` ne les détecte pas). Rejetées avant binning via une bbox généreuse (lon -12 à 12, lat 39 à 52).
   - Agrège en grille H3 **résolution 4** (~1770 km²/cellule), pas la résolution 5 prévue par la spec initiale : outre le gain de volume de requêtes évoqué au point 1, la grille source (arrondi 0,1°, ≈ 8 × 11 km) est presque aussi grande qu'une cellule de résolution 5 (≈ 17 km de diamètre), ce qui aurait introduit un biais de réaffectation aux bords ; à la résolution 4 (≈ 45 km de diamètre) ce biais devient négligeable.
   - Pour chaque cellule : somme les compteurs par groupe **et** par saison (requête A), et détermine l'espèce la plus fréquente par groupe en sommant les compteurs par espèce de la requête B (le maximum réel, sans seuil artificiel — le `HAVING >= 5` initialement prévu n'a plus d'utilité une fois les données rapatriées localement).
   - **Filtre de plausibilité géographique, précis (après binning) :** la bbox grossière ci-dessus ne suffit pas à distinguer une vraie observation marine/côtière d'un simple bruit de géolocalisation — 44 % des 603 cellules obtenues avant ce filtre avaient leur centre hors du polygone terrestre de la France (jusqu'à 579 km au large). Analyse de la densité par tranche de distance à la côte réelle (calculée sur le polygone de `basemap.json`) : la densité s'effondre nettement au-delà de 20-30 km (7,6 M des 8,6 M d'observations "hors polygone" tiennent dans les vingt premiers km ; au-delà de 50 km, 166 cellules ne totalisent que ~195 000 observations, du bruit dispersé plutôt qu'un signal réel). Les cellules dont le centre est à plus de **30 km** de la côte (test point-dans-polygone puis distance au segment le plus proche, calculs géométriques directs, sans dépendance) sont donc rejetées — 208 cellules, ~1 260 observations perdues en moyenne par cellule rejetée contre ~283 000 par cellule conservée. Repéré après un premier passage en production où la carte affichait de nombreuses tuiles en pleine mer, loin de toute côte plausible.
   - **Piège de winding rencontré** (à surveiller pour toute géométrie construite programmatiquement, déjà documenté pour `bird-migrations/render.ts` au sujet de son rectangle de cadrage) : `h3.cellToBoundary(cell, true)` renvoie l'anneau en sens anti-horaire (convention GeoJSON RFC 7946), mais la règle de winding sphérique de d3-geo est inverse pour un petit anneau local — laissé tel quel, chaque hexagone se rend comme "tout sauf cette cellule" (un immense polygone dégénéré recouvrant toute la page, repéré via un test navigateur réel : il bloquait toutes les interactions souris). L'anneau est donc inversé (`.reverse()`) avant écriture.
3. Sortie : `public/data/biodiversity/hexbins.json` (voir "Structure des fichiers" dans `technical-specifications.md` général, mis à jour pour ce projet) — 395 cellules.

## Format des données statifiées (mode par défaut)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "h3": "851f8ebfffffff",
        "counts": {
          "birds":                { "spring": 120, "summer": 200, "autumn": 150, "winter": 110 },
          "mammals":               { "spring": 30,  "summer": 40,  "autumn": 35,  "winter": 15 },
          "reptiles-amphibians":   { "spring": 20,  "summer": 45,  "autumn": 10,  "winter": 2 },
          "insects":               { "spring": 90,  "summer": 210, "autumn": 60,  "winter": 5 },
          "plants":                { "spring": 140, "summer": 90,  "autumn": 60,  "winter": 20 },
          "fungi":                 { "spring": 5,   "summer": 15,  "autumn": 80,  "winter": 10 }
        },
        "topSpecies": {
          "birds": "Turdus merula",
          "mammals": "Vulpes vulpes",
          "reptiles-amphibians": "Lacerta bilineata",
          "insects": "Pieris rapae",
          "plants": "Taraxacum officinale",
          "fungi": "Amanita muscaria"
        }
      },
      "geometry": { "type": "Polygon", "coordinates": [ ] }
    }
  ]
}
```

`counts` porte toutes les combinaisons groupe × saison précalculées : le total "tous groupes" ou "toutes saisons" affiché pour un filtre se somme côté client à partir de cette structure, sans nouvel appel réseau.

## Mode "données en direct"

- **Endpoint :** `https://api.gbif.org/v1/occurrence/search` (API de recherche, pas `occurrence/download` qui est un export en masse asynchrone impropre à une requête déclenchée par un changement de filtre).
- **Paramètres type :** `country=FR`, `taxonKey=<id du groupe sélectionné>` (répété si plusieurs clés, voir table ci-dessous ; omis si "Tous les groupes"), `month=<mois de la saison sélectionnée>` (répété par mois, ou omis si "Toutes saisons"), `hasCoordinate=true`, `hasGeospatialIssue=false` (singulier ici, voir note sur `hasGeospatialIssues` plus haut), `limit=300`.
- **`taxonKey` par groupe** (vérifiés via `GET /v1/species/match` sur le référentiel GBIF Backbone Taxonomy) :

  | Groupe | `taxonKey` |
  |---|---|
  | `birds` | 212 (classe Aves) |
  | `mammals` | 359 (classe Mammalia) |
  | `reptiles-amphibians` | 131 (classe Amphibia), 11418114 (Testudines), 11592253 (Squamata), 11493978 (Crocodylia) |
  | `insects` | 216 (classe Insecta) |
  | `plants` | 7707728 (phylum Tracheophyta) |
  | `fungi` | 5 (règne Fungi) |

  Le référentiel GBIF ne reconnaît plus "Reptilia" comme classe valide (synonyme pro parte sans occurrence rattachée) : les reptiles y sont répartis en plusieurs classes de rang équivalent (Testudines, Squamata, Crocodylia), d'où les clés multiples pour ce groupe.
- **Rendu :** points bruts (pas d'agrégation H3 côté client, voir "Techno cartes" dans `technical-specifications.md`), plafonnés à une page de résultats (300, sans pagination automatique) pour rester réactif.
- **Limite connue à documenter dans l'interface :** un échantillon, pas une vue exhaustive ; CORS validé à l'implémentation (`Access-Control-Allow-Origin: *` sur `api.gbif.org`, sans restriction).

## Contraintes de validation propres à cette visualisation

- Chaque cellule H3 du JSON de sortie porte les six groupes et les quatre saisons dans `counts`, même à zéro (pas de clé omise), pour simplifier la lecture côté client.
- La somme des `counts` par groupe sur les quatre saisons doit être cohérente avec un éventuel total par groupe si celui-ci est aussi exposé (non prévu dans le format ci-dessus, calculable côté client).
