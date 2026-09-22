# Modèle de données : Le désert médical de demain

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : implémenté.**

## Dataset source

Deux jeux de données, tous deux vérifiés directement (fichiers téléchargés et inspectés) :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Accessibilité potentielle localisée (APL) aux médecins généralistes | Direction de la recherche, des études, de l'évaluation et des statistiques (DREES) | https://www.data.gouv.fr/datasets/accessibilite-potentielle-localisee-apl-aux-professionnels-de-sante/ | Licence Ouverte v2.0 | 2026-09-22 |
| Contours des communes de France simplifié | data.gouv.fr (dérivé d'IGN ADMIN EXPRESS COG) | https://www.data.gouv.fr/datasets/contours-des-communes-de-france-simplifie-avec-regions-et-departement-doutre-mer-rapproches/ | Licence Ouverte v2.0 | 2026-09-22 |

Le premier (`Indicateur d'APL aux médecins généralistes.xlsx`, millésime 2024, trois onglets 2022/2023/2024) couvre 34 900 communes (France hors Mayotte). Le second (`a-com2022-topo.json`, TopoJSON, coordonnées WGS84, 13,3 Mo brut, objet `a_com2022`, 34 955 géométries communales, millésime COG 2022) fournit les contours réels.

## Angle retenu : le désert médical de demain

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : plutôt qu'un simple instantané de densité actuelle, comparaison de l'APL 2024 tel quel à l'APL 2024 recalculé sans les médecins généralistes âgés de 65 ans ou plus — un indicateur prospectif que la DREES publie déjà dans le même fichier, pas un calcul propre à cette visualisation. Montre concrètement combien de communes basculeraient sous un accès dégradé si les médecins proches de la retraite cessaient leur activité.

## Périmètre retenu

**France métropolitaine uniquement**, même décision que `biodiversity`/`monument-layers`/`paris-trees` (voir "Couverture géographique" dans `biodiversity/data-model.md`) : les communes ultramarines sont exclues, une carte à silhouette unique ne se prêtant pas à leur échelle très différente sans maquette à encarts. Filtrage par code département (départements 971 à 976 exclus, Mayotte déjà absente de la source APL elle-même).

## Champs source utilisés

| Champ | Source | Usage |
|---|---|---|
| `Code commune INSEE` | APL | Jointure avec `codgeo` du fond de carte |
| `Commune` | APL | Fiche de détail (redondant avec `libgeo` du fond de carte, l'un des deux suffit) |
| `APL aux médecins généralistes` | APL, onglet "APL 2024" | Valeur "aujourd'hui" |
| `APL aux médecins généralistes de 65 ans ou moins` | APL, onglet "APL 2024" | Valeur "demain" (voir "Angle retenu" ci-dessus) |
| `Population totale 2022` | APL | Fiche de détail |
| `codgeo` | Contours | Jointure avec `Code commune INSEE` |
| Géométrie (polygone) | Contours | Silhouette de la commune sur la carte |

Les indicateurs "62 ans ou moins" et "60 ans ou moins" du fichier source ne sont pas retenus : le seuil de 65 ans (âge de départ à la retraite le plus directement pertinent) suffit à l'angle retenu, les deux autres n'auraient fait qu'ajouter des états supplémentaires à la bascule sans enrichir le récit.

## Jointure

**Résolue à l'implémentation :** sur 34 778 communes APL métropolitaines et 34 826 géométries de contours métropolitaines (34 955 moins 129 DOM/COM), la jointure par code commune INSEE aboutit à **34 728 communes dans le fichier final** — 53 communes APL sans géométrie correspondante, 101 géométries sans valeur APL correspondante, écart attendu entre les deux millésimes (APL 2024 vs COG 2022 : fusions/scissions de communes dans l'intervalle). Les non-appariées sont exclues plutôt que publiées avec une valeur manquante, conformément à la contrainte de validation ci-dessous.

**Piège rencontré et corrigé : Paris, Lyon et Marseille absentes de la carte.** Le fichier APL découpe ces trois villes par arrondissement (codes 75101-75120, 69381-69389, 13201-13216, soit 45 lignes au total), alors que le fond de carte ne porte qu'un seul polygone par ville (75056, 69123, 13055) : aucune ligne d'arrondissement ne joignait donc le polygone correspondant, et les trois plus grandes villes de France disparaissaient silencieusement de la carte. Corrigé au prétraitement : les codes d'arrondissement sont ramenés au code commune parent, puis agrégés par **moyenne pondérée par la population standardisée** (méthodologie documentée par la DREES elle-même pour l'agrégation de l'APL sur un territoire plus large que la commune) plutôt qu'une moyenne simple. La population affichée pour ces trois communes est la somme des populations totales des arrondissements. Sans ce correctif, la jointure aurait abouti à 34 725 communes (45 lignes d'arrondissement perdues, 3 communes gagnées après agrégation) ; avec, elle aboutit à 34 728.

## Prétraitement (script Node ponctuel, non committé)

1. Extraire l'onglet "APL 2024" du fichier XLSX (librairie `xlsx`/SheetJS, utilisée ponctuellement, pas une dépendance du projet).
2. Filtrer les deux jeux sur la France métropolitaine (voir "Périmètre retenu" ci-dessus, filtrage sur le préfixe `97`/`98` du code département/commune).
3. Ramener les codes d'arrondissement de Paris/Lyon/Marseille à leur code commune parent (75056/69123/13055) et agréger les lignes APL correspondantes par moyenne pondérée par la population standardisée (voir "Piège rencontré et corrigé" dans "Jointure" ci-dessus).
4. Joindre les deux jeux par code commune INSEE (voir "Jointure" ci-dessus).
5. Réduire chaque géométrie aux seules propriétés nécessaires (voir "Format de sortie" ci-dessous), en écartant les champs du fond de carte non utilisés ici (`xcl2154`/`ycl2154`, `reg`).
6. Simplifier la géométrie (`mapshaper -simplify 10%`, outil CLI utilisé ponctuellement au prétraitement, pas une dépendance du projet) : 13,2 Mo → 9,4 Mo, voir "Poids du fichier" ci-dessous pour la suite.
7. Écrire `public/data/medical-deserts/communes.json` (9,0 Mo avec les propriétés jointes, 2,3 Mo compressé gzip).

## Poids du fichier

**Point à l'origine réservé au cadrage, résolu à l'implémentation.** `communes.json` (9,0 Mo, 2,3 Mo gzip) reste le fichier de données le plus lourd du site à ce jour, de loin : un ordre de grandeur au-dessus de `paris-trees` (752 Ko) ou `monument-layers`. Une passe de simplification supplémentaire (`mapshaper -simplify 3%`, testée) n'a réduit le poids que marginalement (9,1 Mo) : l'essentiel du poids ne vient pas de la densité de points des contours (déjà assez simplifiés à la source) mais du nombre de communes lui-même (34 728) et des clés de propriété répétées dans le JSON. Accepté tel quel : la compression gzip (servie automatiquement par GitHub Pages) ramène le coût réseau réel à 2,3 Mo, chargé une fois avec un indicateur de progression (voir "États" dans `functional-specifications.md`).

## Format de sortie

```json
{
  "type": "Topology",
  "generatedAt": "2026-09-22",
  "objects": {
    "communes": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Polygon",
          "properties": {
            "codgeo": "01001",
            "name": "L'Abergement-Clémenciat",
            "dep": "01",
            "apl": 1.953,
            "apl65": 1.789,
            "population": 859
          },
          "arcs": []
        }
      ]
    }
  },
  "arcs": []
}
```

Reste au format TopoJSON (pas reconverti en GeoJSON au prétraitement) : les arcs partagés entre communes limitrophes restent mutualisés, cohérent avec la technique déjà utilisée pour les fonds de carte du site (voir "Fond de carte" dans `bird-migrations/technical-specifications.md`).

## Distribution réelle (mesurée à l'implémentation)

Sert de base au domaine de l'échelle de couleur (voir "Palette" dans `technical-specifications.md`) : médiane à 2,84 (APL aujourd'hui), 95ᵉ centile à 5,07, 99ᵉ centile à 6,56, maximum à 23,9 (une poignée de communes très peu peuplées avec un seul praticien, qui écraserait le dégradé sur le reste du territoire si le domaine allait jusqu'au maximum réel). 513 communes à 0 exactement (aucune consultation accessible). Domaine retenu : `[0, 6,5]`, avec écrêtage (`clamp`), commun aux deux états de la bascule (voir "Angle retenu" ci-dessus : un domaine partagé est ce qui rend la comparaison honnête).

## Contraintes de validation propres à cette visualisation

- Chaque géométrie porte `apl` et `apl65` numériques (pas de commune sans valeur exploitable : une commune non joignable aux deux sources est exclue plutôt que publiée avec une valeur manquante).
- `codgeo` unique par géométrie.
- Toutes les géométries appartiennent à un département métropolitain (voir "Périmètre retenu" ci-dessus).
