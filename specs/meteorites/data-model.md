# Modèle de données : Ce qui nous tombe du ciel

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : spécifié, non implémenté.** Plusieurs choix restent à confirmer (voir "Points à valider" dans `technical-specifications.md`).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Meteorite Landings | The Meteoritical Society, via le NASA Open Data Portal | https://data.nasa.gov/dataset/meteorite-landings | Non spécifiée par la source ("License not specified"), voir "Licence" ci-dessous | 2026-09-24 (repérage, à refaire à l'implémentation) |

Le jeu de données est une copie du Meteoritical Bulletin Database (base de référence des noms de météorites, tenue par le comité de nomenclature de la Meteoritical Society et hébergée par le Lunar and Planetary Institute), déposée sur le portail open data de la NASA. Description de la source, citée telle quelle : "This comprehensive data set from The Meteoritical Society contains information on all of the known meteorite landings." Une note de mise à jour datée du 14 mai 2013 précise : "Please find an updated data set from The Meteoritical Society that includes more recent meteorites. Under NameType, 'valid' is for most meteorites and 'relict' are for objects that were once meteorites but are now highly altered by weathering on Earth."

## Accès (vérifié le 2026-09-24, revérifié le 2026-10-23)

Le portail `data.nasa.gov` a quitté Socrata pour CKAN en 2025 : l'ancien point d'accès `https://data.nasa.gov/resource/gh4g-9sfh.json` et l'export `https://data.nasa.gov/api/views/gh4g-9sfh/rows.csv` répondent désormais 404. Le jeu est conservé comme "legacy", sous deux fiches CKAN :

- **`meteorite-landings`** (identifiant historique `https://data.nasa.gov/api/views/gh4g-9sfh`, éditeur "data.nasa.gov") : quatre fichiers sous `https://data.nasa.gov/docs/legacy/meteorite_landings/`, `Meteorite_Landings.csv` (3,95 Mo), `.json` (export Socrata complet avec métadonnées, 12,6 Mo), `.xml` et `.rdf`. Chaque URL redirige (302) vers une URL S3 signée, valable une heure : récupérer par `GET` en suivant les redirections, pas par `HEAD` (refusé en 403 par S3).
- **`meteorite-landings-api`** (identifiant "API-17", éditeur "National Aeronautics and Space Administration") : un seul fichier, `gh4g-9sfh.json`, qui ne contient que les 1 000 premières lignes (limite par défaut de l'ancienne API Socrata, figée telle quelle). **À ne pas utiliser.**

Fichier retenu : `Meteorite_Landings.csv`. Le `.json` sert seulement à lire les métadonnées Socrata d'origine (dernière mise à jour des lignes : 20 juillet 2015).

Le site du portail répond de façon irrégulière : plusieurs requêtes vers les pages et l'API CKAN de `data.nasa.gov` ont dépassé 60 à 100 secondes pendant le repérage, alors que les fichiers eux-mêmes se téléchargeaient normalement. La surveillance hebdomadaire des sources (voir "Surveillance des sources" dans `technical-specifications.md` général) pourra donc classer la page en "Indéterminé" de temps à autre.

### Source amont écartée : le Meteoritical Bulletin Database

La base amont (`https://www.lpi.usra.edu/meteor/`) est plus complète et à jour : 78 667 noms valides selon sa fiche re3data (date de ce comptage non précisée), contre 45 641 dans la copie NASA. Elle n'a pas été retenue :

- elle est protégée par une page de vérification Cloudflare ("Just a moment...", réponse 403) qui bloque toute récupération automatisée, comme `volcano.si.edu` pour `volcanic-eruptions`, et aucun web service ni export documenté n'a été trouvé pour contourner ce blocage de façon légitime (seul un flux RSS des nouvelles météorites est signalé) ;
- aucune licence n'y est publiée : re3data indique seulement "Copyrights", en renvoyant à une page de la Meteoritical Society qui n'en dit rien, et le pied de page porte "© 2005- The Meteoritical Society".

Une extraction manuelle depuis un navigateur reste possible mais n'est ni reproductible ni mieux licenciée (voir "Points à valider" dans `technical-specifications.md`).

## Licence

Les deux fiches CKAN portent `license_id: "notspecified"`, affiché "License not specified". Aucun texte de la fiche, de l'ancien export Socrata (pas de champ `license` ni `attribution`, seulement un `attributionLink` vers `visualizing.org`, site disparu) ni de la base amont n'autorise ou n'interdit explicitement la réutilisation ou la redistribution.

La politique "CC0 sauf mention contraire" de la NASA (page "Data Use Policy" d'Earthdata) ne couvre pas ce cas : elle vise les données "from a NASA-led mission", alors que ce catalogue est compilé par la Meteoritical Society. La fiche est publiée avec `accessLevel: "public"`, au titre de l'Open Government Data Act, ce qui autorise l'usage public sans pour autant constituer une licence.

Conséquences retenues :

- **Usage dans la visualisation :** acceptable, avec un crédit explicite de la Meteoritical Society et du portail NASA dans le bloc de crédit des sources. Ce n'est pas une lecture juridique définitive.
- **Téléchargement des données préparées :** non proposé (pas d'attribut `downloads`). La règle générale (voir "Téléchargement des données préparées" dans `functional-specifications.md` général) admet une source "sans licence formalisée mais autorisant la redistribution avec citation" ; ici, rien n'autorise la redistribution, et la source amont revendique un copyright. À confirmer (voir "Points à valider" dans `technical-specifications.md`).

## Champs source utilisés

| Colonne CSV | Usage |
|---|---|
| `id` | Identifiant stable et unique (45 716 valeurs distinctes), repris tel quel |
| `name` | Nom officiel affiché en fiche de détail (unique lui aussi, mais avec espaces et parenthèses : `id` reste l'identifiant) |
| `nametype` | Non exporté : 45 641 `Valid`, 75 `Relict` (toutes trouvées, objets très altérés par l'altération terrestre). Les reliques sont conservées et traitées comme les autres |
| `recclass` | Classe pétrologique (466 valeurs distinctes, ex. `L6`, `H5`, `Iron, IIIAB`, `Martian (shergottite)`), affichée en fiche de détail sans traduction |
| `mass (g)` | Masse en grammes, classe de taille du point (voir "Rendu" dans `technical-specifications.md`) |
| `fall` | `Fell` (vue tomber, puis ramassée) ou `Found` (trouvée au sol sans que sa chute ait été observée) : couleur du point et bascule d'affichage |
| `year` | Année de chute pour `Fell`, année de découverte pour `Found` : fiche de détail seulement |
| `reclat`, `reclong` | Position (degrés décimaux, WGS84) ; `GeoLocation` duplique ces deux colonnes et n'est pas lu |

## Mesures (2026-09-24, fichier `Meteorite_Landings.csv`)

- **45 716 météorites**, toutes de noms et d'identifiants distincts.
- **Vues tomber : 1 107 (2,4 %). Trouvées : 44 609 (97,6 %).**
- **Période :** de 861 (Nogata, Japon, la plus ancienne chute datée) à 2013. Seules 11 entrées datent de 2013 et 234 de 2012 : le catalogue est figé au printemps 2013 (note de mise à jour du 14 mai 2013) et n'a pas été actualisé depuis. 291 météorites trouvées n'ont pas d'année ; une porte l'année 2101 (Northwest Africa 7701), manifestement erronée.
- **Rupture de 1969-1970 :** 96 % des météorites trouvées l'ont été à partir de 1970 (4 909 sur la décennie 1970, 17 698 sur 2000-2009), après la découverte par une expédition japonaise, en 1969, de concentrations de météorites sur les glaces bleues des monts Yamato. Les chutes observées restent, elles, stables, entre 40 et 90 par décennie depuis 1860.
- **Masse :** 131 sans masse, 19 à 0 g. De 0,1 g à 60 t (Hoba, Namibie, trouvée en 1920). Médiane 32,6 g. Médiane des chutes observées 2,8 kg, des trouvailles 30,5 g : les campagnes systématiques en Antarctique ramassent surtout de petits fragments.
- **Plus grosses chutes observées :** Sikhote-Alin (1947, 23 t), Jilin (1976, 4 t), Allende (1969, 2 t), Kunya-Urgench (1998) et Norton County (1948), 1,1 t chacune.

### Positions

| Cas | Nombre | Traitement |
|---|---|---|
| Coordonnées absentes | 7 315 (dont 10 chutes) | Position inconnue |
| `0, 0` exact (valeur de remplissage) | 6 214 (dont 1 chute) | Position inconnue |
| Latitude 0 et longitude 35,66667, nom "Yamato" | 223 | Position inconnue (les monts Yamato sont en Antarctique, vers 71,5° S : latitude manquante remplacée par 0) |
| Latitude 0, nom "Meru" (Kenya) | 1 | Conservée : Meru est réellement sur l'équateur |
| Longitude 354,47333 (Meridiani Planum) | 1 | Exclue du fichier : météorite trouvée sur Mars par le rover Opportunity en 2005, sur un système de coordonnées martien |
| **Positions utilisables** | **31 963** (1 096 chutes, 30 867 trouvailles) | Points de la carte |
| **Position inconnue** | **13 752** (11 chutes, 13 741 trouvailles) | Comptées, pas dessinées |

Les positions inconnues ne sont pas réparties au hasard : 4 300 des 4 499 "Northwest Africa" (météorites sahariennes achetées sur les marchés marocains, dont le lieu de découverte n'est pas documenté) et plus de 8 000 météorites antarctiques (Yamato, Miller Range, LaPaz Icefield, Dominion Range…) en font partie. La carte sous-représente donc le Sahara, et le texte doit le dire (voir "Angle éditorial" dans `functional-specifications.md`).

### Concentration

- **Antarctique** (latitude inférieure à 60° S) : 22 099 météorites positionnées, **71,6 % des trouvailles positionnées**, et aucune chute observée.
- **Sahara et péninsule Arabique** (15° N à 35° N, 20° O à 60° E) : 5 579 trouvailles positionnées (Dar al Gani, Dhofar, Acfer, Hammadah al Hamra, Jiddat al Harasis, Sayh al Uhaymir…).
- **Empilements :** les 30 867 trouvailles positionnées n'occupent que 13 679 positions distinctes (au millième de degré), contre 1 095 positions pour 1 096 chutes. Les campagnes antarctiques attribuent souvent les coordonnées du champ de glace entier : 4 761 météorites Yamato partagent le même point (71,50° S, 35,67° E), 3 040 Queen Alexandra Range un autre (84° S, 168° E).

Répartition par bande de latitude de 10° (positions utilisables) :

| Bande | Vues tomber | Trouvées | | Bande | Vues tomber | Trouvées |
|---|---|---|---|---|---|---|
| 80° N à 90° N | 0 | 1 | | 0° à 10° S | 36 | 6 |
| 70° N à 80° N | 0 | 6 | | 10° S à 20° S | 23 | 38 |
| 60° N à 70° N | 14 | 36 | | 20° S à 30° S | 36 | 571 |
| 50° N à 60° N | 164 | 184 | | 30° S à 40° S | 36 | 547 |
| 40° N à 50° N | 271 | 333 | | 40° S à 50° S | 2 | 17 |
| 30° N à 40° N | 242 | 1 487 | | 50° S à 60° S | 0 | 1 |
| 20° N à 30° N | 155 | 3 193 | | 60° S à 70° S | 0 | 1 |
| 10° N à 20° N | 83 | 2 340 | | 70° S à 80° S | 0 | 14 920 |
| 0° à 10° N | 34 | 8 | | 80° S à 90° S | 0 | 7 178 |

Les chutes observées suivent les latitudes peuplées de l'hémisphère nord (61 % entre 20° N et 50° N) ; plus de 70 % des trouvailles positionnées sont au sud de 70° S.

### Masse des points positionnés

| Classe | Vues tomber | Trouvées |
|---|---|---|
| Moins de 100 g | 73 | 21 073 |
| 100 g à 10 kg | 709 | 8 733 |
| 10 kg à 1 t | 277 | 927 |
| 1 t et plus | 5 | 48 |
| Masse non renseignée ou nulle | 32 | 86 |

## Prétraitement (à réaliser à l'implémentation, hors build)

Script Node ponctuel, non committé (même convention que les autres visualisations, voir par exemple "Source des données" dans `specs/volcanic-eruptions/technical-specifications.md`), à rejouer manuellement si la source change :

1. Télécharger `Meteorite_Landings.csv` (voir "Accès" ci-dessus) et vérifier le nombre de lignes (45 716 au repérage).
2. Exclure Meridiani Planum (longitude hors de `[-180, 180]`).
3. Passer en position inconnue (`lat` et `lng` à `null`) les coordonnées absentes, les `0, 0` exacts et les latitudes à 0 des météorites "Yamato" (voir "Positions" ci-dessus). Toute autre latitude ou longitude nulle isolée est vérifiée à la main (seule Meru au repérage).
4. Arrondir les coordonnées à quatre décimales (environ 11 m, bien en deçà de la précision réelle des positions).
5. Mettre `mass` à `null` quand elle est absente ou nulle ; conserver les décimales de la source (ex. 0,1 g).
6. Mettre `year` à `null` quand elle est absente ou postérieure à l'année de récupération (Northwest Africa 7701).
7. Dédupliquer `recclass` dans une table `classes`, référencée par index (même principe que la table `species` de `paris-trees`).
8. Écrire `public/data/meteorites/meteorites.json` (voir ci-dessous), trié trouvailles d'abord, chutes observées ensuite, puis par masse décroissante dans chaque groupe, masses inconnues en dernier : c'est l'ordre de dessin (voir "Rendu" dans `technical-specifications.md`).
9. Copier sans modification `basemap.json`, `rivers.json` et `relief.webp` depuis `public/data/bird-migrations/` (voir "Techno carte" dans `technical-specifications.md`).

## Format de sortie

**`public/data/meteorites/meteorites.json`**, en tableaux parallèles plutôt qu'en tableau d'objets, vu le volume (même choix que `paris-trees/trees.json`) :

```json
{
  "generatedAt": "2026-09-24",
  "classes": ["Iron, IVB", "L6", "H5"],
  "meteorites": {
    "id":      [11890, 23593, 1],
    "name":    ["Hoba", "Sikhote-Alin", "Aachen"],
    "classId": [0, 7, 21],
    "mass":    [60000000, 23000000, 21],
    "fell":    [0, 1, 1],
    "year":    [1920, 1947, 1880],
    "lat":     [-19.5833, 46.16, 50.775],
    "lng":     [17.9167, 134.6533, 6.0833]
  }
}
```

- `id` : identifiant de la source, en nombre.
- `classId` : index dans `classes`.
- `mass` : grammes, `null` si inconnue ou nulle.
- `fell` : `1` pour une chute observée (`Fell`), `0` pour une trouvaille (`Found`).
- `year` : `null` si inconnue ou aberrante.
- `lat`, `lng` : `null` pour une position inconnue. Ces météorites restent dans le fichier : elles alimentent le compteur "position inconnue" et la vue tableau.

Taille estimée : 2,5 à 3 Mo non compressé pour 45 715 entrées, du même ordre que `earthquakes.json` (2 Mo). Les noms, très répétitifs ("Yamato 000593", "Northwest Africa 4502"), se compressent bien à la volée.

## Champs dérivés côté client (pas dans le JSON)

- **Classe de taille** du point, d'après `mass` (voir "Rendu" dans `technical-specifications.md`).
- **Bande de latitude** de 10° pour le profil latitudinal, et parts de chaque population par bande (voir "Profil latitudinal" dans `technical-specifications.md`).
- **Index spatial** pour le survol (voir "Survol" dans `technical-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Tous les tableaux de `meteorites` ont la même longueur.
- `id` est unique.
- `lat` et `lng` sont soit tous deux `null`, soit tous deux des nombres finis, dans `[-90, 90]` et `[-180, 180]`.
- Aucune position n'est `0, 0`.
- `fell` vaut `0` ou `1` ; `classId` est un index valide de `classes`.
- `mass` est `null` ou strictement positive.
