# Modèle de données : Les strates du patrimoine

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Immeubles protégés au titre des monuments historiques (base Mérimée) | Ministère de la Culture | https://www.data.gouv.fr/datasets/immeubles-proteges-au-titre-des-monuments-historiques-2/ | Licence Ouverte v2.0 | À renseigner à l'implémentation |

Dataset mis à jour chaque semaine (jeudi) par le ministère de la Culture ; couvre l'ensemble des édifices protégés depuis la première loi de 1840. Volume de l'ordre de quarante-cinq mille notices au moment de la vérification de cadrage (à confirmer précisément à l'implémentation), pour environ 100 Mo en CSV brut ou 223 Mo en GeoJSON brut (avant réduction aux seuls champs utiles, voir "Prétraitement" ci-dessous) : ces tailles brutes comptent de nombreux champs non repris ici (description architecturale, matériaux, état de conservation...).

## Périmètre retenu

- **Géographique : France métropolitaine uniquement**, même décision que `biodiversity` (voir "Couverture géographique" dans son `data-model.md`) : les monuments des départements et territoires d'outre-mer sont exclus, une carte à silhouette unique ne se prêtant pas à leur échelle très différente sans maquette à encarts. Décision prise par défaut par cohérence avec ce précédent, validée explicitement par l'utilisateur (voir échanges de cadrage).
- **Statut de protection : classé et inscrit confondus**, pas de sous-ensemble : l'angle retenu (strates de construction, voir `functional-specifications.md`) bénéficie de la densité complète plutôt que d'un sous-ensemble partiel.

## Champs source utilisés

| Champ base Mérimée | Usage |
|---|---|
| `TICO` (appellation courante) | Nom affiché dans la fiche de détail |
| `COM`, `DEPT`, `REG` (commune, département, région) | Localisation (département utilisé pour le regroupement, voir "Format de sortie" ci-dessous), fiche de détail |
| Coordonnées géographiques (WGS84) | Position sur la carte |
| `SCLE` (siècle de la campagne principale de construction) | Position sur la chronologie simulée (voir "Interprétation du siècle de construction" ci-dessous) |
| `DPRO` / `PPRO` (date et nature de la protection) | Nature de la protection (classé/inscrit), fiche de détail |
| `DENO` (dénomination de l'édifice) | Catégorie affichée dans la fiche de détail (château, église, pont...), pas de filtre ni de couleur dédiés (voir échanges de cadrage : risque de retomber sur le même problème de palette que `satellites-in-orbit` et `paris-trees` avec un nombre de catégories élevé, écarté ici en le laissant hors des dimensions filtrables/colorées) |

## Interprétation du siècle de construction

Le champ `SCLE` porte parfois plusieurs campagnes de construction (ex. « 1er quart 12e siècle, 2e quart 16e siècle, 19e siècle » pour un édifice remanié). **À l'implémentation :** retenir la **plus ancienne** campagne mentionnée comme `constructionYear` représentatif (voir "Format de sortie" ci-dessous), cohérent avec l'angle "strates" : cette date représente la strate fondatrice de l'édifice plutôt que ses remaniements ultérieurs. Un édifice sans siècle renseigné est écarté du jeu de données plutôt que placé arbitrairement sur la chronologie (voir "Contraintes de validation" ci-dessous) ; en documenter la proportion une fois connue.

Chaque siècle est converti en une année représentative (ex. milieu du siècle) pour permettre un positionnement continu sur l'échelle temporelle de l'animation (voir "Animation" dans `technical-specifications.md`), plutôt qu'un simple regroupement par bucket discret.

## Nature de la protection

Regroupée en deux valeurs (`classe` / `inscrit`) à partir de `DPRO`/`PPRO` : un édifice protégé à la fois par classement et par inscription (sur des parties différentes) est compté `classe`, le classement étant le niveau de protection le plus fort. Ce champ n'est pas encodé par couleur dans cette visualisation (voir "Palette" dans `technical-specifications.md`), seulement affiché dans la fiche de détail et disponible comme filtre simple (voir "Interactions" dans `functional-specifications.md`).

## Prétraitement (réalisé à l'implémentation, hors build)

Un script de prétraitement, dans l'esprit de ceux des autres visualisations du site :

1. Récupérer l'export complet (CSV ou GeoJSON) du dataset.
2. Restreindre à la France métropolitaine (filtrage par coordonnées ou par code département, voir "Périmètre retenu" ci-dessus).
3. Écarter les notices sans coordonnées valides ou sans siècle de construction exploitable (voir "Interprétation du siècle de construction" ci-dessus) ; documenter les proportions écartées une fois connues.
4. Convertir chaque siècle retenu en année représentative (`constructionYear`).
5. Regrouper la nature de la protection en deux valeurs (voir "Nature de la protection" ci-dessus).
6. Trier par `constructionYear` croissant et écrire `public/data/monument-layers/monuments.json`.

Fond de carte : réutilisation directe envisagée de la silhouette de la France métropolitaine déjà produite pour `biodiversity` (`public/data/biodiversity/basemap.json`, TopoJSON, 18 Ko, voir "Fond de carte" dans son `technical-specifications.md`) plutôt qu'une nouvelle extraction depuis `world-atlas` ; à vérifier à l'implémentation que ce fichier convient tel quel (même périmètre géographique retenu ici).

## Format de sortie

```json
{
  "generatedAt": "2026-09-08",
  "departments": [
    { "code": "75", "nameFr": "Paris", "nameEn": "Paris" }
  ],
  "monuments": [
    {
      "name": "Cathédrale Notre-Dame",
      "lat": 48.853,
      "lng": 2.349,
      "departmentCode": "75",
      "constructionYear": 1220,
      "centuryLabel": "XIIe siècle",
      "protection": "classe",
      "category": "Cathédrale"
    }
  ]
}
```

`departmentCode` référence `departments` (voir "Contraintes de validation" ci-dessous), pour éviter de répéter le nom du département sur chacune des quarante-cinq mille notices. `centuryLabel` reste une chaîne lisible (affichage direct dans la fiche de détail et dans l'indicateur de siècle simulé, voir `functional-specifications.md`), dérivée de `constructionYear` mais conservée à part pour ne pas la recalculer côté client.

## Champs dérivés côté client (pas dans le JSON)

- **Compte de monuments visibles à l'instant simulé courant :** nombre de `monuments` dont `constructionYear` est antérieure ou égale à l'année simulée, selon le filtre de protection actif (voir "Interactions" dans `functional-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Chaque `departmentCode` référencé dans `monuments` existe dans `departments`.
- `monuments` est trié par `constructionYear` croissante.
- Un monument présent dans `monuments` a toujours `lat`/`lng` et `constructionYear` renseignés (les notices sans l'un ou l'autre sont écartées au prétraitement, jamais présentes avec une valeur nulle).
