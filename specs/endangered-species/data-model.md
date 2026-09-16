# Modèle de données : Ce qu'il en reste

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Historique : abandon de la source IUCN Red List

Angle initial : historique des réévaluations de la Liste rouge de l'UICN par espèce, via son API. Abandonné après vérification (voir échanges de cadrage) : le site de l'UICN bloque toute récupération automatisée y compris pour consulter ses propres conditions d'utilisation (403 constaté sur les pages d'espèces et sur les pages de conditions), et l'API nécessite un compte personnel (email, institution) créé par l'utilisateur lui-même, avec une approbation IUCN non garantie pour un projet de visualisation. Décision explicite de l'utilisateur : changer de source plutôt que de dépendre de ce blocage.

## Dataset source

Une source officielle distincte par espèce plutôt qu'une source unique, chacune publiant des effectifs réels et absolus (pas un indice relatif comme celui de la Living Planet Database de WWF/ZSL, écartée pour cette raison : incompatible avec la métaphore en icônes, voir "Rendu" dans `technical-specifications.md`). Chaque source a été consultée directement (pas de chiffre repris d'un extrait de recherche non vérifié) :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Estimations mondiales de population du tigre sauvage (2010-2023) | Global Tiger Forum (point 2010 : WWF-UK) | https://globaltigerforum.org/wp-content/uploads/2023/07/Press-release_Global-Tiger-Day2023_GTF.pdf | Copyright réservé, citation requise | 2026-09-14 |
| Population du rhinocéros noir (1980-2024) | Our World in Data, données African Rhino Specialist Group (AfRSG, IUCN SSC) ; point 2024 : IUCN | https://ourworldindata.org/grapher/black-rhinos | CC BY 4.0 (point 2024 IUCN : copyright réservé) | 2026-09-14 |
| Recensements nationaux du panda géant (1976-2014) | State Forestry Administration of China, relayés par WWF (point 2014 : Smithsonian National Zoo) | https://wwfeu.awsassets.panda.org/downloads/pandasurveyqa.doc | Copyright réservé (WWF), citation requise | 2026-09-14 |
| Recensements du gorille des montagnes, massif des Virunga et Bwindi-Sarambwe (2003-2019) | International Gorilla Conservation Programme (IGCP) | https://igcp.org/content/uploads/2020/09/Global-mountain-gorilla-population-Dec-2019-IGCP.pdf | Copyright réservé (IGCP), citation requise | 2026-09-14 |
| Estimations annuelles de population de la vaquita (1997-2024) | NOAA Fisheries, citant Jaramillo-Legoretta et al. / Gerrodette et al. / Taylor et al. / CIRVA ; points 2023-2024 : rapport hébergé par IUCN SSC Cetacean Specialist Group | https://www.fisheries.noaa.gov/west-coast/science-data/vaquita-conservation-and-abundance | Domaine public (site fédéral américain) | 2026-09-14 |
| Comptages annuels de terriers actifs du grand hamster d'Alsace (2012-2025) | Office français de la biodiversité (OFB), relayés par la Préfecture de la région Grand Est | https://www.prefectures-regions.gouv.fr/irecontenu/telechargement/131694/967059/file/CP-ComptageHamsters-091025.pdf | Licence ouverte (probable, non confirmée sur le document lui-même) | 2026-09-14 |

`worldwildlife.org`, `tigers.panda.org`/`wwf.panda.org` et `iucnredlist.org` bloquent systématiquement la récupération automatisée (403) : contournés via des documents WWF hébergés ailleurs, des relais officiels (Smithsonian, IGCP, Global Tiger Forum) ou des pages WWF régionales qui répondaient normalement.

## Angle retenu : trajectoires d'espèces emblématiques

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `biodiversity` (grille agrégée) et `light-pollution` (évolution agrégée dans une grille) déjà présents sur le site : une sélection restreinte d'espèces suivies individuellement à travers des recensements ou estimations successives, pas une agrégation géographique ou statistique.

## Sélection des espèces (confirmée)

Les six candidates pressenties au cadrage sont toutes retenues, chacune avec une trajectoire réelle exploitable (voir "Format de sortie" ci-dessous) :

| Espèce | Trajectoire réelle |
|---|---|
| Tigre (*Panthera tigris*) | 3 200 (2010) → 3 890 (2016) → 5 574 (2023) : déclin historique puis rétablissement confirmé |
| Rhinocéros noir (*Diceros bicornis*) | 14 785 (1980) → 2 550 (1993, point bas) → 6 788 (2024) : effondrement au vingtième siècle, reprise partielle depuis |
| Panda géant (*Ailuropoda melanoleuca*) | ~1 000 (1976) → 1 100 (1988) → 1 590 (2003) → 1 864 (2014) : hausse continue sur quatre recensements |
| Gorille des montagnes (*Gorilla beringei beringei*) | 380 (2003) → 880 (2011) → 1 063 (2019) : hausse continue, statut passé de "en danger critique" à "en danger" en 2018 |
| Vaquita (*Phocoena sinus*) | 567 (1997) → 245 (2008) → 59 (2015) → 30 (2016) → 10 (2023) → 7 (2024) : déclin le plus extrême du lot |
| Grand hamster d'Alsace (*Cricetus cricetus*) | 242 (2012) → 216 (2015, point bas) → 1 155 (2024) → 557 (2025) : reprise en dents de scie, seule espèce européenne du lot |

Nombre cible de quatre à six espèces (voir "Composition" dans `functional-specifications.md`) : les six sont conservées, aucune écartée.

## Champs nécessaires par espèce et par point de mesure

Pour chaque point de mesure d'une espèce (année de recensement ou d'estimation, selon la source retenue pour cette espèce, voir "Dataset source" ci-dessus) :

| Champ | Usage |
|---|---|
| Année de la mesure | Position sur la chronologie |
| Estimation de population (ou de terriers actifs, voir ci-dessous) | Nombre d'icônes affichées (voir "Rendu" dans `technical-specifications.md`) |

Ces sources sont choisies spécifiquement parce qu'elles publient un effectif à chaque point retenu : pas de valeur `null` à gérer dans le modèle (voir "Contraintes de validation" ci-dessous).

**Points d'attention actés à l'implémentation :**
- **Grand hamster d'Alsace :** le suivi officiel compte des terriers actifs au printemps, pas des individus directement (les deux communiqués préfectoraux le précisent explicitement). Champ `unit: "burrows"` sur cette espèce (les cinq autres portent `unit: "individuals"`), la carte et la fiche de détail affichent "terriers actifs" plutôt que "individus" pour cette espèce.
- **Vaquita, points 2023 et 2024 :** les rapports sources donnent une fourchette plutôt qu'un nombre unique ("8 à 13" en 2023, "6 à 8" en 2024, cette dernière valeur explicitement qualifiée d'estimation minimale par le rapport). Le champ `population` porte le point médian arrondi (11 et 7 respectivement), utilisé uniquement pour le calcul du nombre d'icônes ; le champ `populationLabel` porte la fourchette telle que publiée, affichée dans la fiche de détail à la place du nombre médian.
- **Panda géant, point 1976 :** premier recensement mené sur la période 1974-1977, année représentative retenue (milieu de période). Valeur elle-même approximative dans la source (WWF, "around 1,000 pandas", document Q&A attribué à l'administration forestière chinoise) : le chiffre largement repris ailleurs (2 459 individus) n'a pas pu être confirmé par une source consultée directement, donc écarté.
- **Gorille des montagnes :** population suivie séparément dans deux massifs isolés (Virunga et Bwindi-Sarambwe), jamais recensés la même année. Point 2003 (380) : recensement du massif des Virunga seul, à une époque où ce chiffre était couramment assimilé au total mondial de l'espèce (le suivi rigoureux de Bwindi est plus récent). Point 2011 (880) : composite Virunga 2010 (480, avec facteurs de correction) + Bwindi 2011 (400), même méthode que le total mondial publié par l'IGCP. Point 2019 (1 063) : total mondial publié tel quel par l'IGCP (Virunga 2015-2016 : 604, + Bwindi-Sarambwe 2018 : 459).

## Format de sortie

```json
{
  "species": [
    {
      "id": "tiger",
      "nameFr": "Tigre",
      "nameEn": "Tiger",
      "unit": "individuals",
      "iconRatio": 100,
      "counts": [
        { "year": 2010, "population": 3200 },
        { "year": 2016, "population": 3890 },
        { "year": 2023, "population": 5574 }
      ]
    }
  ]
}
```

`counts` trié par `year` croissant, chaque entrée porte une `population` réelle (jamais une valeur devinée ou interpolée dans les données elles-mêmes : l'interpolation reste un calcul d'affichage, voir "Animation" dans `technical-specifications.md`), sauf les deux points vaquita ci-dessus où `population` est un point médian arrondi d'une fourchette source, doublé du `populationLabel` d'origine (voir "Points d'attention" ci-dessus). `unit` (`"individuals"` ou `"burrows"`) et `iconRatio` (nombre d'unités représentées par une icône, voir "Rendu" dans `technical-specifications.md`) sont fixes par espèce.

## Contraintes de validation propres à cette visualisation

- Chaque espèce a au moins deux points dans `counts` (une trajectoire suppose au moins deux points).
- Chaque point porte une `population` non nulle.
- `counts` est trié par `year` croissant.
