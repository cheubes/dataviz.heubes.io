# Modèle de données : La biodiversité française

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | GBIF Occurrence Data (France) |
| `publisher` | GBIF.org (Global Biodiversity Information Facility) |
| `url` | https://www.gbif.org/occurrence/search?country=FR |
| `license` | CC0 / CC BY (variable par occurrence individuelle, voir "Attribution" ci-dessous) |
| `retrieved` | À renseigner à l'implémentation (étape 8+), date du prétraitement réel |

**Couverture géographique :** France métropolitaine uniquement (voir "Décisions" ci-dessous ; les DOM sont hors périmètre).

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

Champs GBIF utilisés lors du prétraitement (API de recherche `occurrence/search`, ou export `occurrence/download` selon le volume réellement nécessaire) :

| Champ GBIF | Usage |
|---|---|
| `decimalLatitude`, `decimalLongitude` | Position, pour l'agrégation en cellule H3 |
| `kingdom`, `phylum`, `class` | Détermination du groupe taxonomique (voir mapping ci-dessous) |
| `eventDate` (ou `month`) | Détermination de la saison d'observation |
| `scientificName` | Calcul de l'espèce dominante par cellule/groupe |
| `countryCode` | Filtre `FR`, puis exclusion des communes des DOM (voir "Décisions") |
| `hasCoordinate`, `hasGeospatialIssue` | Filtre qualité : coordonnées présentes et valides |

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

## Prétraitement (script hors-build, à réaliser à l'implémentation)

Non couvert par la tâche actuelle (specs uniquement, voir échanges de cadrage) ; principe documenté pour l'implémentation :

1. Récupérer les occurrences GBIF pour la France métropolitaine (`country = FR`, exclusion des codes communes des DOM), 2010 à la date de récupération, avec coordonnées valides.
2. Rattacher chaque occurrence à un groupe taxonomique (mapping ci-dessus) et à une saison (mapping ci-dessus).
3. Agréger en grille H3 **résolution 5** (~250 km²/cellule en moyenne ; à ajuster à l'implémentation si le rendu est trop grossier ou trop dense).
4. Pour chaque cellule : compter les occurrences par groupe **et** par saison (les deux filtres doivent pouvoir se combiner côté client sans recalcul serveur, voir "Format de sortie" ci-dessous), et déterminer l'espèce la plus fréquente par groupe (toutes saisons confondues, par simplicité).
5. Sortie : `public/data/biodiversity/hexbins.json` (voir "Structure des fichiers" dans `technical-specifications.md` général, mis à jour pour ce projet).

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
- **Paramètres type :** `country=FR`, `taxonKey=<id du groupe sélectionné>` (ou omis si "Tous les groupes"), `month=<mois de la saison sélectionnée>` (répété par mois, ou omis si "Toutes saisons"), `hasCoordinate=true`, `hasGeospatialIssue=false`, `limit=300`.
- **Rendu :** points bruts (pas d'agrégation H3 côté client, voir "Techno cartes" dans `technical-specifications.md`), plafonnés à une page de résultats (300, sans pagination automatique) pour rester réactif.
- **Limite connue à documenter dans l'interface :** un échantillon, pas une vue exhaustive ; dépend de la disponibilité de l'API GBIF au moment de la consultation (CORS à valider à l'implémentation).

## Contraintes de validation propres à cette visualisation

- Chaque cellule H3 du JSON de sortie porte les six groupes et les quatre saisons dans `counts`, même à zéro (pas de clé omise), pour simplifier la lecture côté client.
- La somme des `counts` par groupe sur les quatre saisons doit être cohérente avec un éventuel total par groupe si celui-ci est aussi exposé (non prévu dans le format ci-dessus, calculable côté client).
