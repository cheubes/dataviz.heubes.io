# Modèle de données : Le pouls du globe

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Volcanoes of the World (VOTW), catalogue des éruptions holocènes | Smithsonian Institution, Global Volcanism Program | https://volcano.si.edu | Citation requise (référence standard du GVP), conditions exactes non vérifiées | À renseigner à l'implémentation |

## Réserve sur la licence

`volcano.si.edu` bloque la récupération automatisée (protection anti-bot), empêchant une vérification directe des conditions d'utilisation exactes au moment de la rédaction de ces specs — même situation que Glacioclim (abandonné pour `glacier-retreat`, remplacé par WGMS) et, initialement, l'UICN pour `endangered-species` (finalement abandonnée pour ce même blocage, remplacée par des sources officielles par espèce, voir "Historique : abandon de la source IUCN Red List" dans `specs/endangered-species/data-model.md`). Décision explicite de l'utilisateur (voir échanges de cadrage) : continuer avec le GVP malgré l'incertitude, base de référence la plus complète et la plus citée sur le sujet, plutôt qu'une source alternative plus restreinte (NOAA NCEI, éruptions "significatives" avec dommages, écartée à ce stade). **À vérifier formellement (texte exact des conditions d'utilisation) avant toute implémentation**, pas seulement avant publication — même traitement que `satellites-in-orbit`.

## Angle retenu : pouls du globe

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `monument-layers` (accumulation chronologique à sens unique, un point apparaît une fois pour de bon) déjà présent sur le site : chaque volcan pulse à chacune de ses éruptions réelles au fil d'une lecture continue **en boucle** sur dix mille ans, pas une accumulation qui ne fait que grandir. Une éruption n'est pas un événement permanent comme la construction d'un monument : elle correspond à un instant, potentiellement répété plusieurs fois par volcan sur la période couverte.

## Biais de complétude du catalogue (à documenter dans l'interface)

**Point d'attention majeur, à ne pas laisser induire en erreur :** le catalogue GVP est nettement plus complet pour les derniers siècles (sources écrites, observation directe) que pour les millénaires les plus anciens (identification par preuves géologiques uniquement, tephrochronologie). L'augmentation visible de la fréquence des pulsations au fil de la lecture reflète donc en bonne partie une amélioration de la complétude documentaire, pas uniquement une réelle intensification du volcanisme mondial. À expliciter dans la présentation longue (voir `functional-specifications.md`), pas seulement dans les specs.

## Champs source utilisés

| Champ GVP (pressenti, à confirmer à l'implémentation) | Usage |
|---|---|
| Nom du volcan, identifiant GVP | Identification, fiche de détail |
| Coordonnées géographiques | Position sur le planisphère |
| Date de l'éruption (ou fourchette d'incertitude pour les éruptions les plus anciennes) | Position sur la chronologie simulée |
| Indice d'explosivité volcanique (VEI, échelle 0-8) | Intensité/taille du pulse (voir "Rendu" dans `technical-specifications.md`) |

**Incertitude de datation :** de nombreuses éruptions anciennes n'ont qu'une fourchette de date (ex. "avant J.-C., ± quelques siècles"), pas une année précise. **À l'implémentation :** décider du traitement (date médiane de la fourchette pour le positionnement sur la chronologie, incertitude affichée dans la fiche de détail plutôt que dans le positionnement lui-même).

## Sélection des éruptions à annoter (réalisée à l'implémentation)

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : les éruptions d'ampleur exceptionnelle (VEI élevé et/ou notoriété historique) sont annotées textuellement à l'écran au moment de leur pulse (voir "Interactions" dans `functional-specifications.md`). Candidats pressentis, à confirmer sur le catalogue réel : Vésuve (79), Tambora (1815), Krakatoa (1883), Pinatubo (1991), Santorin (~1600 av. J.-C.), Thera... Critère de sélection à trancher à l'implémentation (seuil de VEI, ex. ≥ 6, complété par une liste de noms historiquement connus indépendamment de leur VEI exact).

## Format de sortie

```json
{
  "generatedAt": "2026-09-13",
  "volcanoes": [
    { "id": "vesuvius", "name": "Vésuve", "lat": 40.82, "lng": 14.43 }
  ],
  "eruptions": [
    { "volcanoId": "vesuvius", "year": 79, "vei": 5, "notable": true, "nameFr": "L'éruption du Vésuve", "nameEn": "The eruption of Vesuvius" }
  ]
}
```

`volcanoes` référencé par `volcanoId` depuis `eruptions` (position fixe, indépendante du temps, évite de répéter les coordonnées à chaque éruption d'un même volcan). `notable` (et les libellés `nameFr`/`nameEn` associés) ne concerne que les éruptions retenues pour l'annotation (voir "Sélection des éruptions à annoter" ci-dessus) ; absent ou `false` pour les autres.

## Contraintes de validation propres à cette visualisation

- Chaque `volcanoId` référencé dans `eruptions` existe dans `volcanoes`.
- `eruptions` est trié par `year` croissant.
- Une éruption marquée `notable: true` porte `nameFr` et `nameEn`.
