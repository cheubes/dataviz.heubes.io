# Modèle de données : Le recul des glaciers

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Fluctuations of Glaciers (FoG), variation frontale | World Glacier Monitoring Service (WGMS) | https://wgms.ch/data_databaseversions/ | Libre accès sous réserve de citation correcte (voir modèle de citation WGMS) | À renseigner à l'implémentation |

Base de données internationale de référence, mesures in situ et reconstructions historiques, période couverte remontant par endroits jusqu'au douzième siècle (pour les glaciers les mieux documentés au monde ; les séries françaises retenues ici seront nettement plus courtes, voir "Sélection des glaciers" ci-dessous). Export complet ≈ 868 Mo compressé (tous glaciers du monde) : seul le sous-ensemble des glaciers alpins français retenus est conservé après prétraitement.

## Indicateur retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **la variation frontale** (position du front du glacier dans le temps), pas le bilan de masse ni la surface — l'indicateur le plus anciennement mesuré et le plus intuitif ("le glacier a reculé de *X* mètres").

**Point d'attention sur le format WGMS :** le champ `FRONT_VARIATION` de la base FoG porte, selon les glaciers, soit une variation annuelle (delta d'une année sur l'autre), soit une variation cumulée depuis une année de référence. **À l'implémentation :** vérifier le format exact sur les glaciers retenus et, si nécessaire, cumuler soi-même les deltas annuels pour obtenir une série de variation cumulée par glacier, seule forme directement exploitable pour animer une longueur qui diminue dans le temps (voir "Prétraitement" ci-dessous).

## Longueur de référence absolue

Décision explicite de l'utilisateur (voir échanges de cadrage) : les glaciers sont représentés à l'échelle réelle les uns par rapport aux autres (voir "Échelle" dans `functional-specifications.md`), ce qui suppose de connaître la longueur absolue de chaque glacier à un instant donné, pas seulement sa variation relative. La base FoG du WGMS documente des *variations*, pas une longueur absolue à proprement parler.

**À l'implémentation :** établir une longueur de référence par glacier (`referenceLengthM`, à une `referenceYear` donnée) à partir d'une source complémentaire (ex. inventaire des glaciers français, publications Glacioclim/IGE, ou la position de référence documentée par le WGMS lui-même si elle est présente dans les métadonnées de la série). La longueur à chaque année de la série se calcule ensuite comme `referenceLengthM + variation cumulée depuis referenceYear` (voir "Format de sortie" ci-dessous, où ce calcul est fait une fois pour toutes au prétraitement, pas recalculé côté client).

## Sélection des glaciers (réalisée à l'implémentation)

Candidats pressentis, glaciers alpins français aux séries WGMS les plus longues et les mieux documentées (à confirmer/ajuster une fois les séries réelles inspectées, même démarche que la sélection des espèces de `bird-migrations`) : Mer de Glace et Argentière (massif du Mont-Blanc), Sarennes et Saint-Sorlin (Grandes Rousses), Gébroulaz (Vanoise). Nombre cible : quatre à six glaciers, pour garder la scène de montagne lisible (voir "Composition" dans `functional-specifications.md`) sans la surcharger.

## Champs source utilisés

| Champ WGMS (FoG) | Usage |
|---|---|
| `WGMS_ID`, nom du glacier | Identification, nom affiché |
| `YEAR` | Position sur la chronologie simulée |
| `FRONT_VARIATION` | Calcul de la longueur à chaque année (voir "Point d'attention sur le format WGMS" ci-dessus) |
| Coordonnées du glacier (si présentes dans les métadonnées) | Fiche de détail uniquement (pas de vraie carte géographique dans cette visualisation, voir "Rendu" dans `technical-specifications.md`) |

## Prétraitement (réalisé à l'implémentation, hors build)

1. Récupérer l'export FoG complet du WGMS et filtrer aux glaciers retenus (voir "Sélection des glaciers" ci-dessus).
2. Pour chaque glacier, vérifier et, si nécessaire, cumuler les variations frontales en une série de variation cumulée par année (voir "Point d'attention sur le format WGMS" ci-dessus).
3. Établir la longueur de référence absolue par glacier (voir "Longueur de référence absolue" ci-dessus) et calculer la longueur absolue à chaque année de la série.
4. Trier chaque série par année croissante et écrire `public/data/glacier-retreat/glaciers.json`.

## Format de sortie

```json
{
  "generatedAt": "2026-09-08",
  "glaciers": [
    {
      "id": "mer-de-glace",
      "nameFr": "Mer de Glace",
      "nameEn": "Mer de Glace",
      "massif": "Mont-Blanc",
      "series": [
        { "year": 1870, "lengthM": 7500 },
        { "year": 1990, "lengthM": 7100 },
        { "year": 2023, "lengthM": 6800 }
      ]
    }
  ]
}
```

`lengthM` est déjà une longueur absolue calculée au prétraitement (voir "Longueur de référence absolue" ci-dessus), pas une variation : le client interpole directement entre deux points de `series` sans recalcul (voir "Animation" dans `technical-specifications.md`). Les noms de glacier (`nameFr`/`nameEn`) sont identiques dans la plupart des cas (noms propres non traduits, voir "Contenu non traduit" dans `functional-specifications.md`), portés dans les deux langues par cohérence avec le reste du site plutôt que par nécessité de traduction réelle.

## Contraintes de validation propres à cette visualisation

- Chaque `series` est triée par `year` croissante.
- Chaque glacier a au moins deux points dans sa `series` (une variation sans au moins deux mesures ne permet pas d'animer un retrait).
- `lengthM` est strictement positif pour chaque point (une longueur de référence mal calibrée produisant une valeur négative ou nulle est une erreur de prétraitement à corriger, pas une valeur à publier telle quelle).
