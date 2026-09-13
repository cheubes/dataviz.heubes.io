# Modèle de données : Où la France a brûlé

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Brouillon de cadrage.** Plusieurs points listés dans "Points ouverts" en fin de document restent à confirmer techniquement avant l'implémentation : le mécanisme exact de récupération de l'export complet, les noms de colonnes réels, la licence exacte.

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Base de Données sur les Incendies de Forêts en France (BDIFF) | Ministère de l'Agriculture et de la Souveraineté alimentaire / IGN | https://bdiff.agriculture.gouv.fr/ | Licence Ouverte v2.0 (à confirmer, voir "Points ouverts") | à renseigner à la récupération effective |

La BDIFF centralise, depuis 2006, les données sur les incendies de forêt survenus sur l'ensemble du territoire français (métropole, Corse, départements et collectivités d'outre-mer), au niveau de l'incident individuel (commune d'origine, date, coordonnées géographiques, surface parcourue, cause suspectée). Elle a absorbé en janvier 2023 la base Prométhée, qui couvrait depuis 1973 les quinze départements du pourtour méditerranéen : la période antérieure à 2006 n'est donc disponible que pour cette zone, pas pour le territoire national (voir "Périmètre retenu" ci-dessous). Hébergée par l'IGN pour le compte du ministère de l'Agriculture, mise à jour annuellement (données disponibles jusqu'à l'année antérieure à l'année en cours).

## Périmètre retenu

- **Géographique : France métropolitaine uniquement** (Corse incluse, départements et collectivités d'outre-mer exclus), même décision que `biodiversity`, `monument-layers` et `light-pollution` (voir "Couverture géographique" dans le `data-model.md` de `biodiversity`) : une carte à silhouette unique ne se prête pas à l'échelle très différente des DOM/COM sans maquette à encarts, non retenue pour cette première version.
- **Temporel : 2006 à l'année la plus récente disponible** au moment du prétraitement. Le choix de démarrer en 2006 plutôt qu'en 1973 (date de départ de l'ex-Prométhée) écarte délibérément un historique plus profond mais restreint aux seuls départements méditerranéens : la couverture nationale complète, cohérente avec l'angle éditorial (voir `functional-specifications.md`), prime sur la profondeur temporelle.
- **Aucun seuil de surface minimal retenu a priori** : la BDIFF enregistre par construction des incendies de forêt (un seuil de recensement peut exister dans la source elle-même, ex. l'ex-Prométhée enregistrait les feux de plus d'un hectare ainsi que certains feux plus petits sur terrains agricoles ou décharges) ; à documenter précisément une fois l'export réellement récupéré.

## Champs source utilisés

Noms de colonnes indicatifs, à confirmer sur l'export réellement obtenu (voir "Points ouverts") :

| Champ source (indicatif) | Usage |
|---|---|
| Commune (code INSEE, nom) | Position administrative, fiche de détail |
| Département | Regroupement par département (voir "Format de sortie"), fiche de détail |
| Coordonnées géographiques (latitude/longitude) | Position sur la carte |
| Date de première alerte | Année de rattachement sur la chronologie (voir "Interactions" dans `functional-specifications.md`), date affichée en fiche de détail |
| Surface parcourue totale | Taille du point sur la carte (voir "Taille des points" dans `technical-specifications.md`), fiche de détail |
| Cause probable/suspectée | Fiche de détail uniquement, pas de filtre dédié (voir "Interactions" dans `functional-specifications.md` : le taux de remplissage de ce champ est suivi comme indicateur officiel par la BDIFF elle-même, signe qu'il reste significatif — décision à confirmer une fois ce taux mesuré sur l'export réel) |
| Identifiant de l'incendie (année + numéro) | Construction du lien vers la fiche officielle BDIFF (voir "Lien vers la fiche officielle" ci-dessous) |

## Lien vers la fiche officielle

Chaque incendie de la BDIFF dispose d'une fiche officielle consultable à une URL de la forme `https://bdiff.agriculture.gouv.fr/incendie/{année}/{numéro}` (constatée sur des fiches individuelles lors du cadrage, ex. `.../incendie/2022/2998`). Même pattern que le lien vers la Plateforme Ouverte du Patrimoine sur `monument-layers` (voir "Lien vers la notice de référence" dans son `data-model.md`) : un identifiant conservé par incendie, lien calculé côté client à partir d'un seul gabarit d'URL, pas d'URL complète stockée dans `fires.json`. Stabilité de ce gabarit à confirmer à l'implémentation (voir "Points ouverts").

## Prétraitement

Script ponctuel (Python, hors dépendance npm du projet, même logique que le prétraitement de `monument-layers`) :

1. Récupération de l'export complet des incendies (mécanisme exact à reconnaître à l'implémentation, voir "Points ouverts" : contrairement à la base Mérimée de `monument-layers`, aucun fichier statique téléchargeable en une requête n'a été identifié au cadrage sur data.gouv.fr — l'export semble passer par l'interface de recherche du site BDIFF, potentiellement paginé ou à interroger par année/département).
2. Restriction à la France métropolitaine (voir "Périmètre retenu" ci-dessus).
3. Rejet des incidents sans coordonnées valides ou sans date exploitable (statistiques d'exclusion à mesurer et documenter ici une fois le prétraitement réel effectué, même format que "Statistiques mesurées" dans `monument-layers`).
4. Extraction de l'année de première alerte comme année de rattachement.
5. Regroupement par département (voir "Format de sortie" ci-dessous).
6. Tri par année croissante puis écriture de `public/data/forest-fires/fires.json`.

**Fond de carte :** réutilisation telle quelle de `public/data/biodiversity/basemap.json` (copié sous `public/data/forest-fires/basemap.json`), même périmètre géographique (France métropolitaine, Corse incluse), même format TopoJSON (`objects.france`) consommé de la même façon (`topojson-client`) — même précédent que `monument-layers` (voir "Prétraitement" dans son `data-model.md`). Pas d'enrichissement (hydrographie, réseau routier) prévu dans cette première version : ajouté seulement si un besoin de repère géographique se fait sentir après une première implémentation, comme pour `monument-layers` et `paris-trees`.

## Format de sortie

```json
{
  "generatedAt": "2026-09-13",
  "departments": [
    { "code": "13", "nameFr": "Bouches-du-Rhône", "nameEn": "Bouches-du-Rhône" }
  ],
  "fires": [
    {
      "id": "2022-2998",
      "commune": "Landiras",
      "lat": 44.559,
      "lng": -0.409,
      "departmentCode": "33",
      "year": 2022,
      "date": "2022-07-09",
      "burntArea": 14300,
      "cause": "unknown"
    }
  ]
}
```

`departmentCode` référence `departments`, pour éviter de répéter le nom du département sur chacun des incidents (même convention que `monuments` dans `monument-layers`). `id` reprend l'année et le numéro d'incendie de la source, utilisé pour construire le lien vers la fiche officielle (voir "Lien vers la fiche officielle" ci-dessus). `cause` porte une valeur normalisée (ex. `natural` / `human` / `malicious` / `unknown`, valeurs exactes à ajuster une fois les libellés source connus) ; affichée uniquement en fiche de détail, jamais utilisée comme filtre ni comme couleur (voir "Interactions" dans `functional-specifications.md`). `burntArea` en mètres carrés ou en hectares (à trancher à l'implémentation, cohérent avec l'unité déjà utilisée par la source pour éviter une conversion superflue).

## Champs dérivés côté client (pas dans le JSON)

- **Compte d'incendies et surface totale brûlée à l'année simulée courante :** calculés à partir des `fires` dont `year` correspond à l'année affichée (voir "Contenu" dans `functional-specifications.md`).
- **Lien vers la fiche officielle** (fiche de détail) : `https://bdiff.agriculture.gouv.fr/incendie/{year}/{numéro}`, reconstruit à partir de `id` (voir "Lien vers la fiche officielle" ci-dessus).

## Statistiques mesurées

À renseigner une fois le prétraitement réel effectué (nombre d'incidents retenus/exclus et motifs, répartition géographique, taux de remplissage du champ cause), même format que la section homonyme de `monument-layers`.

## Points ouverts

À confirmer avant de figer cette spec et de démarrer l'implémentation :

- **Mécanisme d'export :** aucun fichier statique téléchargeable en une requête n'a été trouvé pour la BDIFF (contrairement à l'export CSV S3 fixe de Mérimée pour `monument-layers`) ; le téléchargement semble passer par l'interface de recherche du site (`bdiff.agriculture.gouv.fr/incendies`), à reconnaître techniquement avant de figer le script de prétraitement.
- **Licence exacte :** deux sources consultées au cadrage se contredisent (Licence Ouverte v2.0 selon une description du jeu de données, ODbL selon les métadonnées structurées de la même fiche data.gouv.fr) ; à trancher à la récupération effective des données.
- **Noms de colonnes réels** de l'export, une fois obtenu (voir "Champs source utilisés" ci-dessus, actuellement indicatifs).
- **Confirmation empirique de l'angle éditorial :** le titre et la présentation longue (voir `functional-specifications.md`) supposent un glissement géographique des incendies au fil du temps ; à vérifier sur les données réelles agrégées par année et par région avant de les figer, plutôt qu'à présumer.
