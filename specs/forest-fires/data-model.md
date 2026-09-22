# Modèle de données : Où la France a brûlé

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Base de Données sur les Incendies de Forêts en France (BDIFF) | Ministère de l'Agriculture et de la Souveraineté alimentaire / IGN | https://bdiff.agriculture.gouv.fr/ | Licence Ouverte v2.0 | 2026-09-22 |
| API Découpage administratif (communes) | Etalab | https://geo.api.gouv.fr/decoupage-administratif | Licence Ouverte v2.0 | 2026-09-22 |

La BDIFF centralise, depuis 2006, les données sur les incendies de forêt survenus sur l'ensemble du territoire français (métropole, Corse, départements et collectivités d'outre-mer), au niveau de l'incident individuel (commune d'origine, date, surface parcourue, cause suspectée — pas de coordonnées géographiques précises, voir "Champs source utilisés" ci-dessous). Elle a absorbé en janvier 2023 la base Prométhée, qui couvrait depuis 1973 les quinze départements du pourtour méditerranéen : la période antérieure à 2006 n'est donc disponible que pour cette zone, pas pour le territoire national (voir "Périmètre retenu" ci-dessous). Hébergée par l'IGN pour le compte du ministère de l'Agriculture, mise à jour annuellement (données disponibles jusqu'à l'année antérieure à l'année en cours).

La seconde source (API Découpage administratif d'Etalab) ne contribue aucun incendie : elle fournit uniquement le centre géographique de chaque commune française, utilisé pour géocoder les incidents BDIFF (voir "Champs source utilisés" et "Prétraitement" ci-dessous).

## Périmètre retenu

- **Géographique : France métropolitaine uniquement** (Corse incluse, départements et collectivités d'outre-mer exclus), même décision que `biodiversity`, `monument-layers` et `light-pollution` (voir "Couverture géographique" dans le `data-model.md` de `biodiversity`) : une carte à silhouette unique ne se prête pas à l'échelle très différente des DOM/COM sans maquette à encarts, non retenue pour cette première version.
- **Temporel : 2006 à 2025** (2025 étant l'année la plus récente disponible au moment du prétraitement, 2026 étant l'année en cours). Le choix de démarrer en 2006 plutôt qu'en 1973 (date de départ de l'ex-Prométhée) écarte délibérément un historique plus profond mais restreint aux seuls départements méditerranéens : la couverture nationale complète, cohérente avec l'angle éditorial (voir `functional-specifications.md`), prime sur la profondeur temporelle.
- **Aucun seuil de surface minimal** : la BDIFF enregistre des incendies dès quelques mètres carrés (le plus petit incident retenu fait 1 m², voir "Statistiques mesurées" ci-dessous) — aucun filtre supplémentaire appliqué au prétraitement.
- **Uniquement les feux de forêt** (paramètre `if[type]=F` de la recherche BDIFF, appliqué par défaut par le site lui-même sans action du script de prétraitement, voir "Prétraitement" ci-dessous) : la BDIFF couvre aussi d'autres types d'espaces (agricole, etc.) hors du périmètre de cette visualisation.

## Champs source utilisés

L'export BDIFF (voir "Prétraitement" ci-dessous) ne fournit ni latitude ni longitude, à la différence de l'hypothèse initiale de cadrage : seuls le code INSEE et le nom de la commune de départ situent géographiquement chaque incendie. La position de chaque point sur la carte est donc le centre de sa commune (API Découpage administratif), pas les coordonnées précises du sinistre lui-même.

| Champ source (BDIFF, export CSV) | Usage |
|---|---|
| Année, Numéro | Identifiant de l'incendie, construction du lien vers la fiche officielle (voir "Lien vers la fiche officielle" ci-dessous) |
| Département | Regroupement par département (voir "Format de sortie"), fiche de détail |
| Code INSEE | Géocodage par commune (voir "Prétraitement" ci-dessous) |
| Nom de la commune | Position administrative, fiche de détail |
| Date de première alerte | Année de rattachement sur la chronologie (voir "Interactions" dans `functional-specifications.md`), date affichée en fiche de détail |
| Surface parcourue (m2) | Taille du point sur la carte (voir "Taille des points" dans `technical-specifications.md`), fiche de détail |
| Nature | Cause suspectée, normalisée en fiche de détail uniquement, pas de filtre dédié (voir "Interactions" dans `functional-specifications.md`) ; rempli pour 52,8 % des incidents retenus (voir "Statistiques mesurées"), conforme à l'hypothèse de cadrage sur ce taux de remplissage |

Champ complémentaire, de l'API Découpage administratif :

| Champ source (Etalab) | Usage |
|---|---|
| `centre` (point) par commune (`code` INSEE) | Latitude/longitude de chaque incendie (centre de sa commune de départ, voir ci-dessus) |

## Lien vers la fiche officielle

Chaque incendie de la BDIFF dispose d'une fiche officielle consultable à une URL de la forme `https://bdiff.agriculture.gouv.fr/incendie/{année}/{numéro}` (vérifiée à l'implémentation sur plusieurs fiches, gabarit stable). Même pattern que le lien vers la Plateforme Ouverte du Patrimoine sur `monument-layers` (voir "Lien vers la notice de référence" dans son `data-model.md`) : un identifiant conservé par incendie, lien calculé côté client à partir d'un seul gabarit d'URL, pas d'URL complète stockée dans `fires.json`.

## Prétraitement

Script ponctuel (Node.js plutôt que Python, hors dépendance npm du projet — l'interpréteur Python du poste d'implémentation nécessitait une acceptation de licence Xcode hors du périmètre de cette tâche ; même logique de prétraitement one-off que `monument-layers` par ailleurs) :

1. **Récupération de l'export.** Contrairement à la base Mérimée de `monument-layers`, la BDIFF n'expose aucun fichier statique téléchargeable en une requête sur data.gouv.fr (la ressource qui y est référencée pointe vers le portail lui-même, pas vers un fichier). Le site `bdiff.agriculture.gouv.fr` expose en revanche un export CSV complet (`GET /incendies/zip`, dans une session portant les critères de recherche posés via `GET /incendies?if[dateAlerteDeb][date]=JJ/MM/AAAA&if[dateAlerteFin][date]=JJ/MM/AAAA`) — mais plafonné à 30 000 résultats par export (message d'erreur explicite au-delà). Le prétraitement interroge donc deux plages consécutives (2006-2015 : 25 367 incidents, 2016-2025 : 27 444 incidents, chacune sous le plafond) et concatène les deux CSV obtenus.
2. Restriction aux seuls feux de forêt (`Type de feu : F`, filtre par défaut du site, confirmé dans l'en-tête de chaque export) et à la France métropolitaine (Corse incluse), par exclusion des départements d'outre-mer (971, 972, 973, 974, 975, 976, 977, 978) sur le champ `Département` (voir "Périmètre retenu" ci-dessus).
3. **Géocodage par commune :** l'export BDIFF ne portant pas de coordonnées, chaque incident est rapproché de sa commune (`Code INSEE`) via l'export complet de l'API Découpage administratif (`GET /communes?fields=centre,code,nom,departement`, ~35 000 communes), et prend le `centre` de cette commune comme position. Rejet des incidents dont le code INSEE ne correspond à aucune commune actuelle de ce référentiel (communes fusionnées/déléguées depuis, dont le code a changé — voir "Statistiques mesurées" ci-dessous pour le volume exact).
4. Extraction de l'année (champ `Année`, déjà distinct de la date complète dans l'export) comme année de rattachement.
5. Normalisation de la cause suspectée (`Nature`) en valeur fixe (voir "Format de sortie" ci-dessous).
6. Tri par année croissante puis écriture de `public/data/forest-fires/fires.json`.

**Fond de carte :** réutilisation telle quelle de `public/data/biodiversity/basemap.json` (copié sous `public/data/forest-fires/basemap.json`), même périmètre géographique (France métropolitaine, Corse incluse), même format TopoJSON (`objects.france`) consommé de la même façon (`topojson-client`) — même précédent que `monument-layers` (voir "Prétraitement" dans son `data-model.md`). Pas d'enrichissement (hydrographie, réseau routier) : aucun besoin de repère géographique supplémentaire constaté à l'implémentation, à la différence de `monument-layers`/`paris-trees`.

## Format de sortie

```json
{
  "generatedAt": "2026-09-22",
  "departments": [
    { "code": "33", "nameFr": "Gironde", "nameEn": "Gironde" }
  ],
  "fires": [
    {
      "id": "2022-11421",
      "commune": "Landiras",
      "lat": 44.5696,
      "lng": -0.4333,
      "departmentCode": "33",
      "year": 2022,
      "date": "2022-07-12",
      "burntArea": 125520000,
      "cause": "malicious"
    }
  ]
}
```

`departmentCode` référence `departments` (liste des 93 départements métropolitains effectivement représentés dans le jeu de données retenu, sur 96 au total — voir "Statistiques mesurées"), pour éviter de répéter le nom du département sur chacun des incidents ; mêmes `nameFr`/`nameEn` que `monument-layers` (voir son `data-model.md` pour la convention). `id` reprend l'année et le numéro d'incendie de la source (`{Année}-{Numéro}`), utilisé pour construire le lien vers la fiche officielle (voir "Lien vers la fiche officielle" ci-dessus). `lat`/`lng` sont le centre de la commune de départ (précision ~4 décimales, celle fournie par l'API Découpage administratif), pas les coordonnées précises du sinistre (voir "Champs source utilisés" ci-dessus). `cause` porte une valeur normalisée (`natural` / `human` / `malicious` / `unknown`, mappée depuis le champ source `Nature` : `Naturelle` → `natural` ; `Involontaire (particulier)`, `Involontaire (travaux)`, `Accidentelle` → `human` ; `Malveillance` → `malicious` ; vide → `unknown`) ; affichée uniquement en fiche de détail, jamais utilisée comme filtre ni comme couleur (voir "Interactions" dans `functional-specifications.md`). `burntArea` en mètres carrés, l'unité déjà utilisée par la source (aucune conversion au prétraitement) ; converti en hectares à l'affichage seulement (voir "Taille des points" dans `technical-specifications.md`), l'unité utilisée par le site BDIFF lui-même sur ses propres fiches.

## Champs dérivés côté client (pas dans le JSON)

- **Compte d'incendies et surface totale brûlée à l'année simulée courante :** calculés à partir des `fires` dont `year` correspond à l'année affichée (voir "Contenu" dans `functional-specifications.md`).
- **Lien vers la fiche officielle** (fiche de détail) : `https://bdiff.agriculture.gouv.fr/incendie/{year}/{numéro}`, reconstruit à partir de `id` (voir "Lien vers la fiche officielle" ci-dessus).

## Statistiques mesurées

Mesurées sur l'export réel du 22/09/2026 :

- **52 811** incidents "feu de forêt" retenus par la BDIFF entre 2006 et 2025 (France entière, avant filtrage géographique).
- **1 378** exclus car situés dans un département d'outre-mer (voir "Périmètre retenu").
- **487** exclus (0,9 % du reste) faute de correspondance dans le référentiel courant des communes (code INSEE d'une commune depuis fusionnée/déléguée) — répartis sur 197 codes INSEE distincts, aucun département ou année en particulier.
- **50 946** incidents retenus dans `fires.json`, répartis sur **93** départements métropolitains (sur 96 : absents Paris [75], les Hauts-de-Seine [92] et la Seine-Saint-Denis [93], forêt quasi inexistante sur ces trois départements).
- Cause suspectée renseignée pour **52,8 %** des incidents retenus (`natural` 2 916, `human` 15 231, `malicious` 8 732, `unknown` 24 067).
- Surface parcourue (`burntArea`, m²) : minimum 1, médiane 1 000 (0,1 ha), p90 30 924 (≈ 3 ha), p99 511 000 (≈ 51 ha), maximum 125 520 000 (1 255,2 ha) — l'incendie de Landiras (Gironde, juillet 2022), de loin le plus étendu de la période.
- Par année, de 1 347 incidents (2024) à 4 356 (2022, l'année la plus active de la période) ; surface totale brûlée par année de 2 663 ha (2024) à 58 914 ha (2022).
- Part du pourtour méditerranéen (quinze départements ex-Prométhée) dans le total annuel : 70,0 % en 2006-2010, 59,6 % en 2021-2025 — confirme empiriquement le glissement géographique évoqué par l'angle éditorial (voir `functional-specifications.md`), sans le contredire ni l'exagérer.
