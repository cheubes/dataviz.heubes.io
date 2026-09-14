# Modèle de données : Ce qu'il en reste

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Historique : abandon de la source IUCN Red List

Angle initial : historique des réévaluations de la Liste rouge de l'UICN par espèce, via son API. Abandonné après vérification (voir échanges de cadrage) : le site de l'UICN bloque toute récupération automatisée y compris pour consulter ses propres conditions d'utilisation (403 constaté sur les pages d'espèces et sur les pages de conditions), et l'API nécessite un compte personnel (email, institution) créé par l'utilisateur lui-même, avec une approbation IUCN non garantie pour un projet de visualisation. Décision explicite de l'utilisateur : changer de source plutôt que de dépendre de ce blocage.

## Dataset source

Une source officielle distincte par espèce plutôt qu'une source unique, chacune publiant des effectifs réels et absolus (pas un indice relatif comme celui de la Living Planet Database de WWF/ZSL, écartée pour cette raison : incompatible avec la métaphore en icônes, voir "Rendu" dans `technical-specifications.md`) :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Estimations de population du tigre sauvage (rapports Tx2, 2010/2016/2022) | WWF / Global Tiger Forum | À confirmer à l'implémentation | À confirmer à l'implémentation | À l'implémentation |
| Estimations de population du rhinocéros noir | African Rhino Specialist Group (AfRSG, IUCN SSC) | À confirmer à l'implémentation | À confirmer à l'implémentation | À l'implémentation |
| Recensements nationaux du panda géant | Administration nationale des forêts de Chine, relayés par WWF | À confirmer à l'implémentation | À confirmer à l'implémentation | À l'implémentation |
| Recensements du gorille des montagnes | IUCN SSC Primate Specialist Group / Institute of Tropical Forest Conservation, relayés par WWF | À confirmer à l'implémentation | À confirmer à l'implémentation | À l'implémentation |
| Rapports annuels d'estimation de population de la vaquita | CIRVA (Comité international pour le rétablissement de la vaquita) | https://iucn-csg.org/wp-content/uploads/2024/12/Reporte-Crucero-Vaquita-2024-Ingles-Final.pdf (rapport 2024, autres années à l'implémentation) | À confirmer à l'implémentation | À l'implémentation |
| Comptages annuels de terriers actifs du grand hamster d'Alsace | Office français de la biodiversité (OFB) / DREAL Grand Est, plan national d'actions 2019-2026 | https://www.hamster-alsace.fr/2025/11/01/comptage-2025/ (autres années à l'implémentation) | À confirmer à l'implémentation | À l'implémentation |

**À l'implémentation :** confirmer l'URL exacte, la licence et la date de récupération de chaque source (recherche menée au cadrage a identifié l'organisme publiant les chiffres, pas encore le document précis à citer pour chaque année retenue).

## Angle retenu : trajectoires d'espèces emblématiques

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `biodiversity` (grille agrégée) et `light-pollution` (évolution agrégée dans une grille) déjà présents sur le site : une sélection restreinte d'espèces suivies individuellement à travers des recensements ou estimations successives, pas une agrégation géographique ou statistique.

## Sélection des espèces (réalisée à l'implémentation)

Candidats pressentis, mêlant déclins marqués et histoires de rétablissement (voir "Angle éditorial" dans `functional-specifications.md` : le contraste fait partie du propos), à confirmer/ajuster une fois les historiques réels inspectés — même démarche que la sélection des espèces de `bird-migrations`/`animal-migrations` :

| Espèce | Intérêt narratif pressenti |
|---|---|
| Tigre (*Panthera tigris*) | Déclin dramatique historique, population aujourd'hui stabilisée voire en légère hausse dans les estimations récentes |
| Rhinocéros noir (*Diceros bicornis*) | Déclin sévère au vingtième siècle, reprise partielle plus récente |
| Panda géant (*Ailuropoda melanoleuca*) | Histoire de rétablissement, recensements nationaux successifs en hausse depuis les années 1980 |
| Gorille des montagnes (*Gorilla beringei beringei*) | Autre histoire de rétablissement, population en hausse continue malgré un statut qui reste critique |
| Vaquita (*Phocoena sinus*) | Déclin le plus extrême du lot, population résiduelle de l'ordre de quelques dizaines d'individus |
| Grand hamster d'Alsace (*Cricetus cricetus*) | Seule espèce européenne du lot, déclin sévère, résonance locale pour un site francophone |

Nombre cible : quatre à six espèces, pour garder l'ensemble des petits multiples lisible (voir "Composition" dans `functional-specifications.md`) sans le surcharger.

## Champs nécessaires par espèce et par point de mesure

Pour chaque point de mesure d'une espèce (année de recensement ou d'estimation, selon la source retenue pour cette espèce, voir "Dataset source" ci-dessus) :

| Champ | Usage |
|---|---|
| Année de la mesure | Position sur la chronologie |
| Estimation de population | Nombre d'icônes affichées (voir "Rendu" dans `technical-specifications.md`) |

Contrairement à l'ancienne approche IUCN, ces sources sont choisies spécifiquement parce qu'elles publient un effectif à chaque point retenu : pas de valeur `null` à gérer dans le modèle (voir "Contraintes de validation" ci-dessous).

**Points d'attention à l'implémentation :**
- **Grand hamster d'Alsace :** le suivi officiel compte des terriers actifs, pas directement des individus (ex. 557 terriers en 2025). Décider comment l'afficher honnêtement (libellé "terriers actifs" plutôt que sous-entendre un effectif d'individus), à moins qu'un rapport source ne fournisse explicitement une conversion en individus.
- **Vaquita :** les rapports CIRVA donnent parfois une fourchette plutôt qu'un nombre unique (ex. "6 à 8 individus"). Retenir l'estimation centrale explicitement donnée par le rapport source quand elle existe, jamais une moyenne arithmétique inventée si le rapport ne la fournit pas lui-même.

## Format de sortie

```json
{
  "species": [
    {
      "id": "tiger",
      "nameFr": "Tigre",
      "nameEn": "Tiger",
      "counts": [
        { "year": 2010, "population": 3200 },
        { "year": 2016, "population": 3890 },
        { "year": 2022, "population": 4485 }
      ]
    }
  ]
}
```

`counts` trié par `year` croissant, chaque entrée porte une `population` réelle (jamais une valeur devinée ou interpolée dans les données elles-mêmes : l'interpolation reste un calcul d'affichage, voir "Animation" dans `technical-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Chaque espèce a au moins deux points dans `counts` (une trajectoire suppose au moins deux points).
- Chaque point porte une `population` non nulle.
- `counts` est trié par `year` croissant.
