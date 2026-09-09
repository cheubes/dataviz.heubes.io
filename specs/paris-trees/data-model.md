# Modèle de données : Paris, arbre par arbre

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : implémenté.**

## Dataset source

Cinq jeux de données. Les trois premiers, publiés par la Ville de Paris (Paris Data), et les deux derniers par OpenStreetMap : tous sous **Open Database License (ODbL)**, licence compatible (même famille copyleft) :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Les arbres | Ville de Paris (Direction des Espaces Verts et de l'Environnement) | https://opendata.paris.fr/explore/dataset/les-arbres/ | Open Database License (ODbL) | 2026-09-08 |
| Arrondissements | Ville de Paris (Apur) | https://opendata.paris.fr/explore/dataset/arrondissements/ | Open Database License (ODbL) | 2026-09-08 |
| Tronçons de voies | Ville de Paris (Direction de l'Urbanisme) | https://opendata.paris.fr/explore/dataset/troncon_voie/ | Open Database License (ODbL) | 2026-09-08 |
| La Seine (tracé) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-09 |
| Jardins nationaux (arbres) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-09 |

Le premier jeu recensait 219 360 arbres au moment de la récupération (mis à jour de façon hebdomadaire par la source). Avertissement du producteur, repris tel quel dans le texte éditorial de la visualisation (voir "Angle éditorial" dans `functional-specifications.md`) : la donnée n'est pas mise à jour en temps réel, peut présenter des décalages notables (notamment dans les espaces verts), et ne couvre pas les arbres du domaine privé ni la totalité du patrimoine arboré parisien. Le second jeu fournit les contours géographiques des vingt arrondissements, utilisés comme fond de carte stylisé (voir "Rendu" dans `technical-specifications.md`). Le troisième jeu (25 096 tronçons, représentation schématique de l'axe central des voies publiques et privées, 75056 uniquement, pas de tronçon hors Paris) fournit la trame de rues dessinée en surimpression discrète sur ce fond de carte (ajouté après la première implémentation, voir "Rendu" dans `technical-specifications.md` ; pas d'usage pour la position des arbres ou le filtrage, uniquement décoratif/contextuel).

**Le quatrième jeu sort du giron Paris Data**, seule exception de cette visualisation (et du site) à date : aucun jeu de données équivalent n'a été trouvé sur Paris Data pour le tracé du fleuve lui-même (le jeu le plus proche, "Plan de voirie - Voies d'eau", ne couvre que des emprises administratives fragmentaires autour d'écluses/bassins, y compris pour le canal Saint-Martin/de l'Ourcq, pas le tracé continu de la Seine). Récupéré via l'API Overpass (`overpass-api.de`), tous les tronçons `waterway=river` de l'emprise de Paris, recadrée à l'emprise de Paris. **Corrigé après une première extraction incomplète** : filtrer strictement sur `name=La Seine` écartait les bras secondaires qui portent leur propre nom (`La Seine - Bras Marie` autour de l'île Saint-Louis, `La Seine - Bras de la Monnaie` autour de l'île de la Cité, `Bras de Gravelle`, `Bras du Chapitre`...), les faisant disparaître de la carte alors qu'ils font bien partie du fleuve. Filtre corrigé : tous les tronçons `waterway=river` de l'emprise, à l'exception de ceux nommés "La Marne" (rivière distincte, brièvement présente dans la même emprise près de Charenton). 56 tronçons OSM retenus sur 69, rassemblés bout à bout en dix-sept chaînes par correspondance de coordonnées d'extrémité (voir "Prétraitement" ci-dessous) : les bras qui longent le tracé principal en parallèle (autour des îles) restent des chaînes distinctes plutôt que de fusionner avec la chaîne principale, ce qui est le comportement voulu pour qu'ils se dessinent comme des branches séparées. Purement décoratif, comme la trame de rues.

**Le cinquième jeu comble une lacune signalée par l'utilisateur** : le Jardin du Luxembourg, le Jardin des Plantes, le jardin des Tuileries et le jardin du Palais-Royal apparaissent comme des zones vides sur la carte, malgré leur notoriété. Vérifié avant d'implémenter quoi que ce soit (requêtes ciblées sur `les-arbres` avec un filtre de distance autour de chacun) : ce n'est pas un défaut du prétraitement, ces quatre jardins sont administrés par des établissements publics nationaux plutôt que par la Ville de Paris (respectivement le Sénat, le Muséum national d'Histoire naturelle, l'établissement public du musée du Louvre, le Centre des monuments nationaux), donc hors du périmètre du jeu "Les arbres" par nature — l'inventaire municipal ne couvre que le patrimoine dont la Ville a la charge. Aucun inventaire arbre-par-arbre ouvert n'a été trouvé publié par ces quatre établissements (recherche web, voir échanges de cadrage). OpenStreetMap recense en revanche des points `natural=tree` dans l'emprise de ces quatre jardins : 528 (Luxembourg), 833 (Jardin des Plantes), 1 458 (Tuileries), 170 (Palais-Royal), 2 989 au total. Traité comme un jeu à part, jamais fondu dans `trees.json` (voir "Périmètre retenu" et "Format de sortie" ci-dessous) : couverture communautaire partielle (environ 20 % des ~3 000 arbres réels du Luxembourg d'après le Sénat) et attributs très pauvres comparés à la source Ville de Paris (seuls 783 des 2 989 points, 26,2 %, portent un tag `genus` ; jamais de circonférence, hauteur, stade de développement ni domanialité) — mélanger silencieusement les deux ferait perdre cette différence de fiabilité, voir "Rendu" dans `technical-specifications.md` pour le traitement visuel distinct (case à cocher activée par défaut, voir "Interactions" dans `functional-specifications.md` pour ce choix et sa mise en garde).

**Absence notée :** le jeu "Les arbres" ne comporte pas de champ de date ou d'année de plantation (vérifié à la lecture du schéma). L'angle "âge du patrimoine" envisagé un temps pendant le cadrage n'est donc pas exploitable avec cette source ; sans conséquence sur l'angle finalement retenu ("exploration libre", voir `functional-specifications.md`), qui ne s'appuie pas sur cette donnée.

## Périmètre retenu

Décidé explicitement avec l'utilisateur au cadrage : l'intégralité du jeu "Les arbres", tous domaines confondus (alignement, jardins, bois, équipements municipaux...), sans filtrage ni agrégation par zoom.

**Ajustement découvert à l'implémentation, validé avec l'utilisateur :** le champ `arrondissement` du jeu source porte en réalité 25 valeurs distinctes, pas 20. Outre les vingt arrondissements et "BOIS DE BOULOGNE" / "BOIS DE VINCENNES" (rattachés sans ambiguïté aux arrondissements 16 et 12, où ils sont géographiquement inclus dans le périmètre administratif), 25 045 arbres (11,4 % du jeu) portent la valeur "HAUTS-DE-SEINE", "SEINE-SAINT-DENIS" ou "VAL-DE-MARNE" : des cimetières parisiens extraterritoriaux (ex. cimetière de Bagneux), géographiquement hors du périmètre des vingt arrondissements couvert par le fond de carte. Ces 25 045 arbres sont **exclus** du jeu de sortie (décision utilisateur, voir échanges de cadrage) : le périmètre retenu est donc "l'intégralité du jeu 'Les arbres' à l'intérieur des vingt arrondissements", pas l'intégralité stricte du jeu source. **194 315 arbres** sont conservés (219 360 moins 25 045 hors périmètre ; aucun arbre écarté pour coordonnées manquantes, voir "Prétraitement" ci-dessous).

## Champs source utilisés

| Champ `les-arbres` | Usage |
|---|---|
| `idbase` | Identifiant de l'arbre |
| `genre` | Regroupement par genre dominant (voir "Regroupement par genre" ci-dessous) et recherche |
| `espece`, `varieteoucultivar` | Recherche, fiche de détail au clic (voir "Interactions" dans `functional-specifications.md`) |
| `libellefrancais` | Nom commun affiché (recherche, fiche de détail) |
| `circonferenceencm` | Taille du point (voir "Rendu" dans `technical-specifications.md`), fiche de détail |
| `hauteurenm` | Fiche de détail |
| `stadedeveloppement` | Fiche de détail |
| `domanialite` | Fiche de détail |
| `arrondissement` | Zoom/filtrage géographique par clic sur la carte (voir "Interactions" dans `functional-specifications.md`), converti en numéro d'arrondissement (`district`, voir "Format de sortie" ci-dessous) |
| `remarquable` | Mise en avant visuelle des arbres remarquables (voir "Interactions" dans `functional-specifications.md`) |
| `geo_point_2d` | Position sur la carte |

`typeemplacement`, `complementadresse`, `adresse` et `idemplacement` ne sont pas repris dans le format de sortie : hors du périmètre des interactions retenues (voir "Interactions" dans `functional-specifications.md`).

| Champ `arrondissements` | Usage |
|---|---|
| `geom` (polygone) | Fond de carte stylisé (silhouette des vingt arrondissements) |
| `c_ar` (numéro d'arrondissement) | Correspondance avec le champ `arrondissement` du jeu "Les arbres" |

## Regroupement par genre

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **huit genres** prennent chacun un slot de la palette catégorielle (voir "Palette" dans `technical-specifications.md`), tous les autres genres sont regroupés dans une catégorie "Autres" en teinte neutre, hors palette.

**Résolu à l'implémentation**, par agrégation sur les données réelles (`group_by=genre`) : les huit genres les plus fréquents sont, dans l'ordre, *Platanus* (39 689 arbres après exclusion hors périmètre, voir "Périmètre retenu" ci-dessus), *Aesculus* (22 314), *Tilia* (20 386), *Acer* (16 534), *Styphnolobium* (10 562), *Prunus* (8 212), *Quercus* (6 048), *Fraxinus* (4 950).

**Ajusté après une deuxième relecture** (retour utilisateur : ajouter Bouleau et Cyprès comme genres distincts) : ni l'un ni l'autre ne fait partie des huit genres les plus fréquents (*Betula*, 1 982 arbres avant exclusion hors périmètre, 1 838 après ; *Cupressus* + *x Cupressocyparis*, 1 218 avant, 562 après — beaucoup de cyprès se trouvent apparemment dans les cimetières extraterritoriaux exclus du périmètre, une plantation traditionnelle en contexte funéraire). Le skill dataviz du projet est catégorique sur ce point : jamais de neuvième ou dixième teinte générée sur une disposition où tous les points peuvent se toucher (voir "Palette" dans `technical-specifications.md` pour le détail) — passer à dix genres distincts était donc écarté. Décision retenue avec l'utilisateur : *Quercus* et *Fraxinus*, les deux genres dominants les moins fréquents des huit initiaux, rejoignent "Autres" ; *Betula* et *Cupressus* prennent leurs slots. Le regroupement "Cyprès" réunit *Cupressus* et *x Cupressocyparis* (tous deux `libellefrancais` = "Cyprès" dans la source), mais exclut délibérément *Chamaecyparis* (`libellefrancais` = "Faux-cyprès", un genre et un nom distincts, resté dans "Autres" faute d'avoir été demandé explicitement).

Nom commun associé à chaque `genusId` (dérivé du `libellefrancais` le plus fréquent au sein du genre, confirmé par agrégation) :

| `genusId` | Genre | Nom commun (FR) | Nom commun (EN) |
|---|---|---|---|
| `platanus` | *Platanus* | Platane | Plane tree |
| `aesculus` | *Aesculus* | Marronnier | Horse chestnut |
| `tilia` | *Tilia* | Tilleul | Lime tree |
| `acer` | *Acer* | Érable | Maple |
| `styphnolobium` | *Styphnolobium* | Sophora | Japanese pagoda tree |
| `prunus` | *Prunus* | Cerisier à fleurs | Ornamental cherry |
| `betula` | *Betula* | Bouleau | Birch |
| `cupressus` | *Cupressus*, *x Cupressocyparis* | Cyprès | Cypress |
| `other` | — (dont *Quercus*, *Fraxinus*, *Chamaecyparis*) | Autres | Other |

74 218 arbres (38,2 %) tombent dans "Autres" (genres moins fréquents et les deux genres déplacés, ou `genre` vide — un seul arbre du jeu source).

## Prétraitement (réalisé à l'implémentation, hors build)

Script de prétraitement Node, dans l'esprit de ceux des autres visualisations, exécuté une fois et non committé (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) :

1. Récupérer l'export complet du jeu "Les arbres" (`GET /api/explore/v2.1/catalog/datasets/les-arbres/exports/json?limit=-1`, 219 360 arbres, 108 Mo) et celui du jeu "Arrondissements" (`GET .../datasets/arrondissements/exports/geojson`, 20 polygones).
2. Écarter les arbres dont `arrondissement` vaut "HAUTS-DE-SEINE", "SEINE-SAINT-DENIS" ou "VAL-DE-MARNE" (25 045 arbres, voir "Périmètre retenu" ci-dessus). Aucun arbre du jeu source n'a de `geo_point_2d` manquant (vérifié par agrégation avant le prétraitement, `where=geo_point_2d is null` → 0 résultat) : pas d'écart pour coordonnées invalides.
3. Convertir `arrondissement` en numéro d'arrondissement (`district`) : `"PARIS Ne ARRDT"` / `"PARIS 1ER ARRDT"` → *N* ; `"BOIS DE BOULOGNE"` → 16 ; `"BOIS DE VINCENNES"` → 12.
4. Déterminer les huit genres dominants (voir "Regroupement par genre" ci-dessus) et attribuer un `genusId` à chaque arbre retenu (index dans `genera`, un des huit ou `"other"`).
5. Dédupliquer les combinaisons (`libellefrancais`, `genre`, `espece`) : 1 093 combinaisons distinctes sur 194 315 arbres retenus (moins de 1 % de valeurs uniques). Chaque combinaison devient une entrée de la table `species` (voir "Format de sortie" ci-dessous), avec un champ de recherche précalculé (concaténation normalisée du nom commun, du genre et de l'espèce, minuscules et sans accents) ; chaque arbre référence son entrée par `speciesId` plutôt que de répéter les chaînes.
6. Réduire chaque arbre retenu aux champs nécessaires, arrondir `lat`/`lng` à six décimales, et écrire `public/data/paris-trees/trees.json`.
7. Simplifier les polygones du jeu "Arrondissements" (Douglas-Peucker, tolérance 0,0001° ≈ 10 m, implémenté directement dans le script sans dépendance ajoutée — même choix que la simplification des trajectoires de `bird-migrations`) et écrire `public/data/paris-trees/districts.json`.
8. **Ajouté après la première implémentation** (retour utilisateur : fond de carte jugé trop nu) : récupérer l'export complet du jeu "Tronçons de voies" (`GET .../datasets/troncon_voie/exports/json?limit=-1`, 25 096 tronçons, 16 Mo), écarter les 2 tronçons sans géométrie, simplifier chaque tronçon (Douglas-Peucker, tolérance 0,00003° ≈ 3 m, plus fine que celle des arrondissements pour garder le détail visuel des rues : 78 622 points réduits à 58 228), arrondir à six décimales, et écrire `public/data/paris-trees/streets.json`. Pas de champ conservé au-delà de la géométrie (ni le nom de voie, ni le domaine) : uniquement décoratif, voir "Rendu" dans `technical-specifications.md`.
9. **Ajouté juste après** (retour utilisateur : la Seine manquait toujours au fond de carte) : interroger l'API Overpass pour les tronçons `waterway=river` recadrés à l'emprise de Paris, à l'exception de ceux nommés "La Marne" (56 tronçons OSM retenus sur 69, voir "Dataset source" ci-dessus pour la correction de filtre — un premier filtre strict sur `name=La Seine` manquait les bras nommés séparément autour des îles Saint-Louis et de la Cité), les rassembler en chaînes par correspondance d'extrémités (deux extrémités identiques à sept décimales près considérées comme le même point ; dix-sept chaînes, les bras parallèles au tracé principal restant des chaînes distinctes plutôt que fusionnées), sans simplification supplémentaire (volume déjà minime), et écrire `public/data/paris-trees/seine.json`.
10. **Ajouté après une nouvelle relecture** (retour utilisateur : les jardins à statut national restent des zones vides, voir "Dataset source" ci-dessus) : pour chacun des quatre jardins (Luxembourg, Jardin des Plantes, Tuileries, Palais-Royal), interroger l'API Overpass pour les nœuds `natural=tree` dans son emprise géographique (une requête par jardin, chacune bornée à une petite boîte englobante propre à ce jardin, plutôt qu'une requête unique sur tout Paris qui aurait ramené des arbres municipaux déjà présents dans `trees.json`). Conserver uniquement la position et, quand renseignés, les tags `genus`/`species` (aucun autre attribut disponible dans la source). Étiqueter chaque arbre retenu du jardin d'origine (`gardenId`) et écrire `public/data/paris-trees/national-gardens.json`.

## Format de sortie

**`public/data/paris-trees/trees.json`** — encodé en tableaux parallèles (« structure of arrays ») plutôt qu'un tableau d'objets, pour limiter la taille du fichier étant donné le volume (voir "Format de données" dans `technical-specifications.md`). Le nom commun, le genre et l'espèce ne sont pas répétés par arbre : dédupliqués dans une table `species` référencée par index (voir "Prétraitement" ci-dessus), seule compaction retenue au-delà de l'arrondi des coordonnées (voir "Format de données" dans `technical-specifications.md` pour les autres pistes envisagées et pourquoi elles n'ont pas été retenues) :

```json
{
  "generatedAt": "2026-09-08",
  "genera": [
    { "id": "platanus", "nameFr": "Platane", "nameEn": "Plane tree" },
    { "id": "aesculus", "nameFr": "Marronnier", "nameEn": "Horse chestnut" },
    { "id": "other", "nameFr": "Autres", "nameEn": "Other" }
  ],
  "species": [
    { "commonName": "Platane", "genusLabel": "Platanus", "species": "x hispanica", "searchText": "platane platanus x hispanica" },
    { "commonName": "Marronnier", "genusLabel": "Aesculus", "species": "hippocastanum", "searchText": "marronnier aesculus hippocastanum" }
  ],
  "trees": {
    "lat": [48.8566, 48.857],
    "lng": [2.3522, 2.353],
    "genusId": [0, 1],
    "speciesId": [0, 1],
    "circumferenceCm": [180, 95],
    "heightM": [18, 9],
    "developmentStage": ["Adulte", "Jeune (arbre)"],
    "domain": ["Alignement", "Jardin"],
    "district": [4, 4],
    "remarkable": [false, true]
  }
}
```

Le tableau `genera` liste huit genres dominants plus l'entrée `"other"` (voir "Regroupement par genre" ci-dessus) ; la couleur de chaque genre n'est pas stockée dans les données, assignée côté client par ordre d'apparition dans `genera` (voir "Palette" dans `technical-specifications.md`). `trees.genusId` et `trees.speciesId` sont des index dans `genera` et `species` respectivement, pas des chaînes. `trees.developmentStage` et `trees.domain` conservent les valeurs brutes de la source (françaises, non traduites, voir "Contenu non traduit" dans `functional-specifications.md`), `null` quand la source ne renseigne pas le champ. Chaque tableau de `trees` a la même longueur, index par index (le premier arbre est `lat[0]`/`lng[0]`/`genusId[0]`/...).

**`public/data/paris-trees/districts.json`** — GeoJSON simplifié des vingt arrondissements (`FeatureCollection`, une géométrie `Polygon` par arrondissement), avec le numéro d'arrondissement (`properties.c_ar`) porté par chaque géométrie pour permettre le clic-zoom (voir "Interactions" dans `functional-specifications.md`).

**`public/data/paris-trees/streets.json`** — géométrie brute (pas de `Feature`, pas de propriétés, purement décorative) :

```json
{ "type": "MultiLineString", "coordinates": [[[2.3522, 48.8566], [2.3530, 48.8570]], ...] }
```

25 094 tronçons (2 écartés faute de géométrie, voir "Prétraitement" ci-dessus), 1,2 Mo non compressé (391 Ko gzippé).

**`public/data/paris-trees/seine.json`** — même forme (`MultiLineString`, aucune propriété), dix-sept chaînes (tracé principal, bras autour des îles Saint-Louis, de la Cité et aux Cygnes, voir "Dataset source" ci-dessus) totalisant 529 points, 10 Ko.

**`public/data/paris-trees/national-gardens.json`** — structure analogue à `trees.json` (tableaux parallèles), mais un schéma bien plus pauvre reflétant celui, minimal, de la source :

```json
{
  "generatedAt": "2026-09-09",
  "gardens": [
    { "id": "luxembourg", "nameFr": "Jardin du Luxembourg", "nameEn": "Luxembourg Gardens" },
    { "id": "jardin-des-plantes", "nameFr": "Jardin des Plantes", "nameEn": "Jardin des Plantes" },
    { "id": "tuileries", "nameFr": "Jardin des Tuileries", "nameEn": "Tuileries Garden" },
    { "id": "palais-royal", "nameFr": "Jardin du Palais-Royal", "nameEn": "Palais-Royal Garden" }
  ],
  "trees": {
    "lat": [48.8463],
    "lng": [2.3378],
    "gardenId": [0],
    "genusLabel": [null],
    "species": [null]
  }
}
```

`gardenId` est un index dans `gardens` (même mécanisme que `genusId`/`speciesId` dans `trees.json`). `genusLabel`/`species` sont les tags OSM bruts (`genus`/`species`), rarement renseignés (26,2 %, voir "Dataset source" ci-dessus), `null` sinon — pas de déduplication en table à part comme `species` dans `trees.json` : la variété des combinaisons observées (783 arbres avec un tag) ne justifie pas l'effort à ce volume. 2 989 arbres, 105 Ko non compressé.

## Champs dérivés côté client (pas dans le JSON)

- **Nombre d'arbres visibles :** recalculé à chaque changement de filtre genre ou de recherche (voir "Interactions" dans `functional-specifications.md`).
- **Rayon du point à l'écran :** dérivé de `circumferenceCm` via une échelle (voir "Rendu" dans `technical-specifications.md`), pas stocké.

## Contraintes de validation propres à cette visualisation

- Chaque `genusId` référencé dans `trees.genusId` est un index valide de `genera` (0 invalide sur 194 315 à la génération).
- Chaque `speciesId` référencé dans `trees.speciesId` est un index valide de `species` (0 invalide sur 194 315 à la génération).
- Tous les tableaux de `trees` ont la même longueur.
- Un arbre présent dans `trees` a toujours une position (`lat`/`lng`) valide.
- Chaque `district` référencé dans `trees` correspond à un `c_ar` présent dans `districts.json` (garanti par l'exclusion des arbres hors périmètre au prétraitement, voir "Périmètre retenu" ci-dessus ; 0 incohérence à la génération).
- Chaque `gardenId` référencé dans `national-gardens.json` est un index valide de `gardens`.
