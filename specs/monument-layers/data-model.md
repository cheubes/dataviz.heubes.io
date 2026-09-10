# Modèle de données : Les strates du patrimoine

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Immeubles protégés au titre des monuments historiques (base Mérimée) | Ministère de la Culture | https://www.data.gouv.fr/datasets/immeubles-proteges-au-titre-des-monuments-historiques-2/ | Licence Ouverte v2.0 | 2026-09-10 |
| Cours d'eau (tracé) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-10 |
| Réseau routier (autoroutes et voies rapides) | OpenStreetMap contributors | https://www.openstreetmap.org/copyright | Open Database License (ODbL) | 2026-09-10 |

Dataset Mérimée mis à jour chaque semaine (jeudi) par le ministère de la Culture ; couvre l'ensemble des édifices protégés depuis la première loi de 1840. Export CSV utilisé (`https://ministere-culture.s3.sbg.io.cloud.ovh.net/POP/merimee.csv`, 46 760 notices, ~100 Mo), plutôt que l'export GeoJSON équivalent (~223 Mo) : mêmes données, format pipe-délimité (`|`) plus simple à traiter en flux, coordonnées déjà portées par un champ dédié (`coordonnees_au_format_WGS84`, voir "Champs source utilisés" ci-dessous) qui rend la géométrie GeoJSON redondante pour ce besoin. Le volume brut compte de nombreux champs non repris ici (description architecturale, matériaux, état de conservation, et surtout un champ `Copyright` de mention légale répété intégralement sur chacune des 46 760 lignes, qui domine largement le poids du fichier brut) : le fichier produit par cette visualisation (voir "Format de sortie" ci-dessous) ne conserve que les champs utiles.

Le fond de carte est enrichi de cours d'eau et d'un réseau routier via l'API Overpass (OpenStreetMap), même source que le tracé de la Seine et des rues de `paris-trees` mais à l'échelle du pays plutôt que d'une seule ville (voir "Prétraitement" ci-dessous). Retenue plutôt que Natural Earth (première version de ces deux couches, voir historique ci-dessous) pour une précision géographique nettement supérieure, demandée explicitement par l'utilisateur pour les deux couches à la suite : OpenStreetMap est cartographié à une résolution locale là où Natural Earth reste calibré pour des atlas mondiaux. **Historique :** les cours d'eau utilisaient d'abord Natural Earth (17 tronçons stylisés), puis OpenStreetMap ("sois plus précis sur les cours d'eau") ; les axes routiers utilisaient d'abord Natural Earth seul pour le réseau interurbain complété d'OpenStreetMap dans dix-neuf grandes villes seulement ("ajoute des axes routiers, notamment dans les grandes villes"), puis entièrement OpenStreetMap sur toute la France ("sois plus précis sur les axes routiers") — Natural Earth ne sert donc plus à cette visualisation.

## Périmètre retenu

- **Géographique : France métropolitaine uniquement**, même décision que `biodiversity` (voir "Couverture géographique" dans son `data-model.md`) : les monuments des départements et collectivités d'outre-mer sont exclus (codes départementaux 971 à 976 présents dans la source), une carte à silhouette unique ne se prêtant pas à leur échelle très différente sans maquette à encarts. La Corse (départements 2A/2B) reste en revanche incluse : elle fait partie de la France métropolitaine au sens de cette exclusion, comme pour `biodiversity` (même fond de carte, voir "Fond de carte" ci-dessous). Deux notices rattachées à deux départements à la fois (`Departement_format_numerique` du type `"01;71"`) sont rattachées au premier code du champ, cas négligeable (2 notices sur 46 760).
- **Statut de protection : classé et inscrit confondus**, pas de sous-ensemble : l'angle retenu (strates de construction, voir `functional-specifications.md`) bénéficie de la densité complète plutôt que d'un sous-ensemble partiel.

## Champs source utilisés

| Champ base Mérimée (nom de colonne CSV) | Usage |
|---|---|
| `Titre_editorial_de_la_notice` | Nom affiché (repli sur la commune si vide) |
| `Commune_forme_editoriale` (repli `Commune_forme_index`) | Commune, fiche de détail |
| `Departement_format_numerique`, `Departement_en_lettres` | Regroupement par département (voir "Format de sortie"), fiche de détail |
| `coordonnees_au_format_WGS84` | Position sur la carte (chaîne `"lat,lng"`, WGS84) |
| `Siecle_de_la_campagne_principale_de_construction` | Position sur la chronologie simulée (voir "Interprétation du siècle de construction" ci-dessous) |
| `Typologie_de_la_protection` | Nature de la protection (classé/inscrit), fiche de détail |
| `Denomination_de_l_edifice` | Catégorie affichée dans la fiche de détail (château, église, pont...), pas de filtre ni de couleur dédiés (voir échanges de cadrage : risque de retomber sur le même problème de palette que `satellites-in-orbit` et `paris-trees` avec un nombre de catégories élevé, écarté ici en le laissant hors des dimensions filtrables/colorées) |
| `Reference` | Identifiant de la notice (ex. `PA00081518`), sert à construire le lien vers la notice de référence (voir "Lien vers la notice de référence" ci-dessous) ; jamais affiché tel quel |

## Interprétation du siècle de construction

Le champ source porte parfois plusieurs campagnes de construction, séparées par `;` (ex. `"12e siècle;16e siècle"` pour un édifice remanié). La **plus ancienne** campagne mentionnée est retenue comme `constructionYear` représentatif, cohérent avec l'angle "strates" : cette date représente la strate fondatrice de l'édifice plutôt que ses remaniements ultérieurs.

Chaque siècle numérique (`"16e siècle"`, y compris ses variantes graphiques `"16è siècle"`, `"1er quart 16e siècle"`, `"2e moitié 16e siècle"`, qualificatif ignoré) est converti en année représentative : milieu du siècle, soit `(N-1) × 100 + 50` (ex. 16e siècle → 1550), négative pour les mentions "av. J.-C." (ex. `"1er siècle av. JC"` → -50). Un édifice sans ce champ renseigné du tout est écarté du jeu de données (13,25 % des notices, voir "Statistiques mesurées" ci-dessous), plutôt que placé arbitrairement sur la chronologie.

**Étiquettes de période non numériques :** 6,3 % des notices non vides (2 925 sur 46 760) portent une étiquette de période archéologique plutôt qu'un siècle numérique (`"Néolithique"`, `"Gallo-romain"`, `"Moyen Age"`, `"Antiquité"`...) — une proportion trop importante, et représentant justement les vestiges les plus anciens ("des vestiges antiques épars", voir l'angle éditorial dans `functional-specifications.md`), pour être simplement écartée comme un siècle non renseigné (décision validée avec l'utilisateur). Chaque étiquette est convertie en année représentative approximative via une table de correspondance dédiée, et associée à un code d'ère (`era`, voir "Format de sortie" ci-dessous) plutôt qu'à un simple nombre, pour permettre un affichage localisé fidèle à l'étiquette d'origine (ex. "Néolithique" / "Neolithic") plutôt qu'un siècle fabriqué de toutes pièces :

| Étiquette(s) source | `era` | Année représentative |
|---|---|---|
| Paléolithique (ancien/moyen) | `paleolithic` | -20000 |
| Paléolithique supérieur | `paleolithic` | -15000 |
| Mésolithique | `mesolithic` | -8000 |
| Néolithique (ancien/moyen/récent), Préhistoire (générique) | `neolithic` | -4000 / -3500 |
| Chalcolithique | `chalcolithic` | -2700 |
| Âge du bronze (ancien/moyen/final) | `bronzeAge` | -1800 / -1500 / -1000 |
| Âge du fer (1/2), Protohistoire | `ironAge` | -700 / -500 |
| Gallo-romain, Haut-Empire, République romaine, Antiquité | `galloRoman` | -50 / 100 |
| Bas-Empire | `galloRoman` | 350 |
| Moyen Âge (générique), Haut/Milieu/Fin du Moyen Âge | `middleAges` | 700 / 1000 / 1100 / 1400 |
| Temps modernes | `earlyModern` | 1650 |

Ces années restent approximatives par nature (une étiquette comme "Moyen Âge" seule couvre potentiellement dix siècles) : leur seul rôle est de positionner le point sur la chronologie animée (voir "Animation" dans `technical-specifications.md`) et de trier le jeu de données, jamais affichées telles quelles (voir "Champs dérivés côté client" ci-dessous, le libellé affiché vient de `era` quand il est présent, pas de `constructionYear`).

## Nature de la protection

Dérivée de `Typologie_de_la_protection`, qui porte parfois plusieurs valeurs séparées par `;` (ex. un édifice classé sur une partie et inscrit sur une autre) : la valeur contient `"classé"` → `classe` (le classement étant le niveau de protection le plus fort, prioritaire en cas de mélange) ; sinon `"inscrit"` → `inscrit` ; sinon (champ vide, 0,96 % des notices) la notice est écartée. Ce champ n'est pas encodé par couleur dans cette visualisation (voir "Palette" dans `technical-specifications.md`), seulement affiché dans la fiche de détail et disponible comme filtre simple (voir "Interactions" dans `functional-specifications.md`).

## Lien vers la notice de référence

Ajouté après la première implémentation (retour utilisateur : "serait-il possible sur chaque monument d'avoir un lien vers une page web de référence ?"). Chaque monument garde son `Reference` d'origine (identifiant de la notice Mérimée, ex. `PA00081518`, toujours renseigné : aucune notice écartée pour absence de ce champ), utilisé pour construire un lien vers sa notice officielle sur la Plateforme Ouverte du Patrimoine (POP) du ministère de la Culture : `https://www.pop.culture.gouv.fr/notice/merimee/{reference}` — plateforme qui republie et fait vivre les données Mérimée, Palissy et Joconde, vérifiée à l'implémentation sur un échantillon de notices. Lien calculé côté client à partir de `reference` (voir "Champs dérivés côté client" ci-dessous), pas d'URL complète stockée dans `monuments.json` : un seul gabarit d'URL pour les 37 661 monuments, inutile de le répéter.

## Prétraitement

Script ponctuel (Python, hors dépendance npm du projet, même logique que le prétraitement raster de `light-pollution`) :

1. Récupération de l'export CSV complet (voir "Dataset source" ci-dessus).
2. Restriction à la France métropolitaine par code département (voir "Périmètre retenu" ci-dessus).
3. Rejet des notices sans coordonnées valides, sans siècle exploitable ou sans typologie de protection exploitable (voir "Statistiques mesurées" ci-dessous).
4. Conversion du siècle (ou de l'étiquette de période) retenu en année représentative et, le cas échéant, en code d'ère (voir "Interprétation du siècle de construction" ci-dessus).
5. Regroupement de la nature de la protection en deux valeurs (voir "Nature de la protection" ci-dessus).
6. Tri par `constructionYear` croissant et écriture de `public/data/monument-layers/monuments.json`.

**Fond de carte :** réutilisation telle quelle de `public/data/biodiversity/basemap.json` (copié sous `public/data/monument-layers/basemap.json`, voir "Fond de carte" dans son `technical-specifications.md`), confirmée à l'implémentation : même périmètre géographique (France métropolitaine, Corse incluse), même format TopoJSON (`objects.france`) consommé de la même façon (`topojson-client`). Copié plutôt que référencé directement dans l'autre dossier `public/data/` : chaque visualisation reste autonome vis-à-vis des fichiers de données d'une autre (voir "Structure des fichiers" dans `technical-specifications.md` général), une modification future du fond de `biodiversity` ne doit pas casser silencieusement celui-ci.

**Cours d'eau et réseau routier** (ajouté après la première implémentation, retour utilisateur : fond de carte enrichi, même demande que le fond de rues/Seine de `paris-trees` ; précision revue deux fois de suite ensuite, voir "Dataset source" ci-dessus pour l'historique complet) :

1. Convertir la géométrie France du TopoJSON (`objects.france`) en GeoJSON, pour servir de masque de découpe géographique plutôt qu'un simple rectangle englobant : un rectangle aurait gardé des fragments de fleuves ou de routes italiens, espagnols ou allemands dont seul un coin de leur tracé croise l'emprise rectangulaire de la France.
2. **Cours d'eau :** pour chaque cours d'eau d'une liste nommée reconnue comme "principaux" en France (La Seine, La Loire, Le Rhône, La Garonne, La Marne, La Saône, La Dordogne, La Moselle, La Meuse, L'Yonne, Le Doubs, La Vienne, La Durance, Le Tarn), interroger l'API Overpass pour la relation `waterway=river` portant ce nom puis ses tronçons membres (`relation["waterway"="river"]["name"="La Seine"];way(r);out geom;`, quatorze requêtes unies en une seule) : nettement plus rapide qu'une recherche de tronçons par zone géographique (`way["waterway"="river"](bbox France)`), qui échoue systématiquement par expiration du délai sur une emprise aussi large que la France entière. Tous les cours d'eau utilisent l'article défini français comme nom OpenStreetMap (convention constatée à l'implémentation, ex. "La Marne" plutôt que "Marne", déjà rencontrée dans `paris-trees`, voir son `data-model.md`), à l'exception du Rhin (cas particulier ci-dessous).
3. **Cas particulier du Rhin :** sans relation nommée en français dans OpenStreetMap (cartographié comme un unique tronçon international, de sa source suisse à son embouchure aux Pays-Bas, sous son nom allemand `"Rhein"`, note de la relation : "Don't map tributaries !") ; récupéré séparément par son identifiant de relation.
4. **Réseau routier :** interroger l'API Overpass pour les tronçons `highway` de type `motorway` ou `trunk` (autoroutes et voies rapides) sur l'ensemble du territoire, via l'emprise administrative de la France plutôt qu'une zone géographique rectangulaire (`area["ISO3166-1"="FR"][admin_level=2];way(area)["highway"="motorway"];`, une requête par type, l'index de zone administrative répondant en quelques minutes là où une recherche par rectangle englobant sur une emprise aussi large échoue par expiration du délai, comme pour les cours d'eau) : 30 958 tronçons `motorway` et 31 515 `trunk`. Restriction à ces deux seuls types (pas `primary`/`secondary`) : un premier essai limité à dix-neuf grandes villes avec les quatre types ramenait déjà 75 794 tronçons sur un périmètre bien plus restreint, pour un rendu jugé trop chargé face à la densité des points de monuments ; `motorway`/`trunk` sur toute la France restent plus légers (62 473 tronçons) tout en donnant une présence routière reconnaissable partout, pas seulement dans un échantillon de villes.
5. Découper les deux ensembles au polygone France (même mécanisme qu'à l'étape 1), simplifier (`mapshaper -simplify`, outil utilisé ponctuellement au prétraitement, pas une dépendance npm du projet, comme `topojson-server`/`topojson-simplify` pour `biodiversity` : 25 % pour les cours d'eau, 15 % pour le réseau routier, plus dense), arrondir à six décimales, aplatir chaque ensemble en une unique géométrie `MultiLineString` sans propriétés (voir "Format de sortie" ci-dessous) et écrire `public/data/monument-layers/rivers.json` et `public/data/monument-layers/roads.json`.

### Statistiques mesurées

Sur 46 760 notices sources :

| Exclusion | Notices | Proportion |
|---|---|---|
| Retenues | 37 661 | 80,54 % |
| Sans siècle ni étiquette de période renseigné | 6 198 | 13,25 % |
| Sans coordonnées valides | 2 268 | 4,85 % |
| Hors France métropolitaine (DOM/COM) | 573 | 1,23 % |
| Sans typologie de protection exploitable | 53 | 0,11 % |
| Siècle non interprétable (format inattendu) | 7 | 0,01 % |

Sur les 37 661 notices retenues, 1 790 (4,75 %) datent d'avant l'an 0 (voir "Interprétation du siècle de construction" ci-dessus) ; leur traitement à l'affichage (socle statique plutôt qu'animé) est documenté dans `functional-specifications.md` et `technical-specifications.md` (sections "Animation").

## Format de sortie

```json
{
  "generatedAt": "2026-09-10",
  "departments": [
    { "code": "75", "nameFr": "Paris", "nameEn": "Paris" }
  ],
  "monuments": [
    {
      "name": "Cathédrale Notre-Dame",
      "commune": "Paris",
      "lat": 48.853,
      "lng": 2.349,
      "departmentCode": "75",
      "constructionYear": 1220,
      "protection": "classe",
      "category": "Cathédrale",
      "reference": "PA00086250",
      "era": "middleAges"
    }
  ]
}
```

`departmentCode` référence `departments`, pour éviter de répéter le nom du département sur chacune des 37 661 notices. `nameFr`/`nameEn` d'un département sont identiques (noms propres de départements français, sans traduction anglaise conventionnelle établie, à la différence des noms de pays ou de régions) ; portés en deux champs malgré tout, par cohérence avec le format bilingue employé partout ailleurs sur le site pour un objet référencé par identifiant (ex. `regions` dans `satellites-in-orbit`, `genera` dans `paris-trees`).

`reference` s'ajoute au schéma après la première implémentation (voir "Lien vers la notice de référence" ci-dessus) : sert exclusivement à construire le lien vers la notice officielle, jamais affiché tel quel dans l'interface.

`era` n'est présent que pour les monuments dont l'année vient d'une étiquette de période plutôt que d'un siècle numérique (voir "Interprétation du siècle de construction" ci-dessus) ; absent sinon. Contrairement au brouillon de cadrage initial, le fichier ne porte **pas** de `centuryLabel` précalculé : ce libellé dépend de la langue (ex. "12e siècle" / "12th century"), il est donc calculé côté client à partir de `constructionYear` (et de `era` quand il est présent) plutôt que figé dans une seule langue au prétraitement, cohérent avec le traitement des libellés dérivés ailleurs sur le site (ex. l'indicateur d'année de `satellites-in-orbit`, calculé via `Intl.DateTimeFormat` plutôt que porté par `satellites.json`). Voir "Champs dérivés côté client" ci-dessous.

`commune` s'ajoute au schéma du brouillon de cadrage initial : nécessaire à la fiche de détail (voir "commune/département" dans `functional-specifications.md`), omis par oubli de la première version de cette spec.

**`public/data/monument-layers/rivers.json`** et **`public/data/monument-layers/roads.json`** — géométrie brute (pas de `Feature`, pas de propriétés, purement décoratives, voir "Prétraitement" ci-dessus), même forme que `streets.json`/`seine.json` de `paris-trees` :

```json
{ "type": "MultiLineString", "coordinates": [[[2.3522, 48.8566], [4.8, 47.3]], ...] }
```

`rivers.json` : 15 cours d'eau (les quatorze noms listés plus le Rhin, 3 124 tronçons, un cours d'eau étant représenté par de nombreux tronçons disjoints dans OpenStreetMap), 29 687 points, 624 Ko (220 Ko compressé). `roads.json` : autoroutes et voies rapides sur l'ensemble de la France (60 272 tronçons), 196 530 points, 4,25 Mo (1,45 Mo compressé). Tailles nettement supérieures à la première version de ces fichiers fondée sur Natural Earth seul pour les deux couches (9,5 Ko et 27 Ko), et `roads.json` a grossi une seconde fois en passant d'un réseau interurbain simplifié complété de dix-neuf grandes villes à la couverture OpenStreetMap complète du pays (retour utilisateur : "sois plus précis sur les axes routiers") : contrepartie assumée de la précision géographique demandée à deux reprises, qui reste du même ordre de grandeur que `monuments.json` (7,92 Mo, voir "Lien vers la notice de référence" ci-dessus) et raisonnable pour le site au regard du précédent de `paris-trees` (11,7 Mo/2,2 Mo pour un seul fichier, voir "Performance" dans `technical-specifications.md` général).

## Champs dérivés côté client (pas dans le JSON)

- **Compte de monuments visibles à l'instant simulé courant :** nombre de `monuments` dont `constructionYear` est antérieure ou égale à l'année simulée, selon le filtre de protection actif (voir "Interactions" dans `functional-specifications.md`).
- **Libellé de période affiché** (indicateur de période simulée, fiche de détail) : si `era` est présent, libellé localisé associé à ce code (table dans `src/i18n/fr.ts`/`en.ts`) ; sinon, siècle formaté à partir de `constructionYear` (ex. `1550` → "16e siècle" / "16th century", `-50` → "1er siècle av. J.-C." / "1st century BC").
- **Lien vers la notice de référence** (fiche de détail) : `https://www.pop.culture.gouv.fr/notice/merimee/{reference}`, un seul gabarit d'URL appliqué à `reference` (voir "Lien vers la notice de référence" ci-dessus).

## Contraintes de validation propres à cette visualisation

- Chaque `departmentCode` référencé dans `monuments` existe dans `departments`.
- `monuments` est trié par `constructionYear` croissante.
- Un monument présent dans `monuments` a toujours `lat`/`lng` et `constructionYear` renseignés (les notices sans l'un ou l'autre sont écartées au prétraitement, jamais présentes avec une valeur nulle).
- Un monument présent dans `monuments` a toujours `reference` renseigné (champ toujours présent dans la source, aucune notice écartée pour son absence, voir "Lien vers la notice de référence" ci-dessus).
