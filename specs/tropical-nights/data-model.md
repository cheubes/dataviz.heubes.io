# Modèle de données : Les nuits tropicales

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : spécifié, non implémenté.**

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Données climatologiques de base - quotidiennes | Météo-France | https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes | Licence Ouverte v2.0 | 2026-09-24 |

Données quotidiennes de toutes les stations de métropole et d'outre-mer depuis leur ouverture, publiées par Météo-France sur data.gouv.fr (même jeu de données, identifiant `6569b51ae64326786e4e8e1a`, sur le portail thématique https://meteo.data.gouv.fr/datasets/6569b51ae64326786e4e8e1a). Description de la source : "Données climatologiques de toutes les stations de métropole et d'outre-mer depuis leur ouverture, pour tous les paramètres disponibles. Ces données ont subi un contrôle climatologique."

**Licence** (vérifiée sur l'API data.gouv.fr, identifiant `lov2`, "Licence Ouverte / Open Licence version 2.0") : le réutilisateur est libre de la "communiquer, la reproduire, la copier", de l'"adapter, la modifier, l'extraire et la transformer", de la "diffuser, la redistribuer, la publier", y compris à titre commercial, sous une seule condition : "mentionner la paternité de l'« Information » : sa source (a minima le nom du « Concédant ») et la date de la dernière mise à jour de l'« Information » réutilisée". Le bloc de crédit des sources (nom de Météo-France, lien, date `retrieved`) y répond. Conséquence pour le téléchargement : voir "Téléchargement" ci-dessous.

**Organisation des fichiers** (vérifiée le 2026-09-24) : un fichier CSV compressé (`.csv.gz`) par département, par lot de période et par famille de paramètres, hébergé sur `https://meteofrance.s3.sbg.io.cloud.ovh.net/data/synchro_ftp/BASE/QUOT/`. Seule la famille "RR-T-Vent" (précipitations, températures, vent) est utile ici ; la famille "autres-parametres" (humidité, rayonnement, phénomènes) ne l'est pas.

| Lot | Nom de fichier (exemple, département 75) | Mise à jour |
|---|---|---|
| Avant 1950 | `Q_75_avant-1949_RR-T-Vent.csv.gz` | Annuelle |
| 1950 à l'année N-2 | `Q_75_previous-1950-2024_RR-T-Vent.csv.gz` | Mensuelle |
| Deux dernières années | `Q_75_latest-2025-2026_RR-T-Vent.csv.gz` | Quotidienne |

Les bornes des noms de fichiers glissent d'une année à l'autre (`previous-1950-2024` deviendra `previous-1950-2025`) : le script de prétraitement résout les URL par la liste des ressources de l'API data.gouv.fr (`/api/1/datasets/donnees-climatologiques-de-base-quotidiennes/`) plutôt que de les coder en dur. Le lot "avant 1950" n'est pas utilisé (voir "Couverture temporelle" ci-dessous).

Format : séparateur `;`, point décimal, une ligne par station et par jour, en-tête sur la première ligne. Descriptif officiel des champs : ressources `Q_descriptif_champs_RR-T-Vent.csv` et `CLIMATOLOGIE_Donnees_quotidiennes_descriptif.pdf` du même jeu de données.

## Définition retenue : nuit tropicale

**Température minimale quotidienne sous abri (TN) supérieure ou égale à 20 °C**, conformément à l'usage de Météo-France :

- "nuit tropicale (définie par une température ne descendant pas sous les 20 °C la nuit)" (Météo-France, "Une nuit tropicale au cœur de l'hiver !", 12 février 2020, https://meteofrance.com/actualites-et-dossiers/actualites/climat/une-nuit-tropicale-au-coeur-de-lhiver) ;
- "au moins une nuit tropicale (pas moins de 20 °C)" (Météo-France, "29 juillet - 2 août 2024 : première vague de chaleur de l'année", https://meteofrance.com/actualites-et-dossiers/actualites/premiere-vague-de-chaleur-de-lannee).

Une valeur de TN égale à 20,0 °C compte donc comme tropicale. L'écart avec une lecture stricte (TN > 20 °C) n'est pas négligeable : mesuré sur les huit stations retenues, entre 8 (Strasbourg-Entzheim) et 151 (Nice) nuits de 1950 à 2026 sont exactement à 20,0 °C.

Pas de définition formelle trouvée dans un glossaire Météo-France : les deux citations ci-dessus sont des articles d'actualité, cohérents entre eux (voir "Points à valider" dans `technical-specifications.md`).

**Fenêtre de mesure de TN :** la convention usuelle de Météo-France (minimale relevée entre 18 h UTC la veille et 18 h UTC le jour J) n'est pas écrite dans le descriptif du jeu de données, qui décrit TN comme "température minimale sous abri" sans préciser la période. Les heures de la minimale (champ `HTN`, Paris-Montsouris, 15 600 jours renseignés depuis 1984) se concentrent entre 3 h et 6 h UTC, avec une queue non nulle entre 18 h et 23 h UTC, compatible avec cette convention sans la prouver. À confirmer : elle détermine le libellé "nuit du J-1 au J" de l'infobulle (voir "Interactions" dans `functional-specifications.md`).

## Séries homogénéisées : pourquoi des données brutes

Météo-France publie deux produits de référence pour le changement climatique, vérifiés sur data.gouv.fr (Licence Ouverte v2.0 tous les deux) :

- **LSH (Longues Séries Homogénéisées)** : "Séries mensuelles corrigées par homogénéisation statistique pour les paramètres températures minimales (TN), maximales (TX), insolations (IN) ou précipitations (RR)". Mensuelles uniquement : une moyenne mensuelle de TN ne permet pas de compter des nuits, inutilisable ici.
- **SQR (Séries Quotidiennes de Référence)** : "une sélection de données climatologiques quotidiennes pour une période donnée d'une station météorologique", dont la période est choisie d'après les ruptures d'homogénéité, le taux de données manquantes et les déplacements du poste. Ce sont des **valeurs non corrigées** : vérifié sur Paris-Montsouris, les 24 107 valeurs quotidiennes de TN de la SQR (1959-2024) sont identiques, sans exception, à celles des données de base. Une SQR indique donc sur quelle période Météo-France juge la série brute fiable, sans rien corriger.

**Il n'existe pas de série quotidienne homogénéisée de TN en open data : la visualisation utilise les données brutes de base.** Conséquences, à dire dans la page (voir "Angle éditorial" dans `functional-specifications.md`) :

- un déplacement de station, un changement d'abri ou de capteur peut créer une marche artificielle dans la série. Le fichier de base ne porte qu'une seule position par station (les coordonnées et l'altitude actuelles), ces changements n'y sont pas visibles ;
- l'urbanisation autour d'une station (îlot de chaleur urbain) réchauffe surtout les minimales nocturnes, précisément la variable comptée ici. Paris-Montsouris est une station intra-muros ; les sept autres sont des stations d'aéroport, en périphérie, dont l'environnement s'est lui aussi urbanisé depuis 1950 ;
- la tendance montrée mêle donc réchauffement climatique et évolution locale de chaque station, sans que la visualisation puisse les séparer.

Périodes SQR de TN des stations retenues (fichier `Liste_SQR_TN_metro.csv`, produit le 13 mars 2025), conservées comme métadonnée dans le fichier de sortie (`referencePeriod`, voir "Format de sortie" ci-dessous) :

| Station | Période SQR de TN |
|---|---|
| Nice | Aucune SQR de TN (série mensuelle homogénéisée LSH disponible, 1959-2023) |
| Perpignan | 1957-2023 |
| Marseille-Marignane | 1983-2023 |
| Toulouse-Blagnac | novembre 1991-2022 |
| Lyon-Bron | 1982-2022 |
| Bordeaux-Mérignac | 1988-2022 |
| Paris-Montsouris | 1959-2022 |
| Strasbourg-Entzheim | 1951-2022 |

Une période SQR courte (Toulouse, Bordeaux, Lyon, Marignane) signale des ruptures d'homogénéité détectées dans la série mensuelle avant son début, sans en donner l'amplitude pour les données quotidiennes.

## Stations retenues

**Principe :** stations de métropole à relevé quotidien de TN continu depuis 1950, réparties du littoral méditerranéen au nord-est, couvrant toute la gamme observée (de moins d'une nuit tropicale par an à plus de quatre-vingts). Huit stations : le plafond de la palette catégorielle du site, sans que les stations y soient codées par couleur (voir "Palette" dans `technical-specifications.md`), et un nombre qui tient en petits multiples sur un écran de bureau (voir "Contenu" dans `functional-specifications.md`).

**Mesure de complétude** (fichiers "RR-T-Vent" des départements concernés, récupérés le 2026-09-24, données jusqu'au 22 septembre 2026) : pour chacune des huit stations, **aucune valeur de TN manquante du 1er mai au 31 octobre, de 1950 à 2026**, et toutes ces valeurs portent le code qualité `1` (donnée validée).

Ordre : nombre moyen de nuits tropicales par an sur la normale 1991-2020, décroissant (ce qui ordonne aussi, à peu près, du sud vers le nord).

| `id` | Libellé affiché | `NUM_POSTE` | Nom Météo-France (`NOM_USUEL`) | Département | Altitude | Relevé TN | 1961-1990 | 1991-2020 |
|---|---|---|---|---|---|---|---|---|
| `nice` | Nice | `06088001` | NICE | 06 | 2 m | 1950-2026 | 28,9 | 56,4 |
| `perpignan` | Perpignan | `66136001` | PERPIGNAN | 66 | 42 m | 1950-2026 | 20,7 | 37,8 |
| `marseille` | Marseille-Marignane | `13054001` | MARIGNANE | 13 | 6 m | 1950-2026 | 17,2 | 35,8 |
| `toulouse` | Toulouse-Blagnac | `31069001` | TOULOUSE-BLAGNAC | 31 | 151 m | 1950-2026 | 2,8 | 11,8 |
| `lyon` | Lyon-Bron | `69029001` | LYON-BRON | 69 | 202 m | 1950-2026 | 2,2 | 11,0 |
| `bordeaux` | Bordeaux-Mérignac | `33281001` | BORDEAUX-MERIGNAC | 33 | 47 m | 1950-2026 | 1,2 | 6,1 |
| `paris` | Paris-Montsouris | `75114001` | PARIS-MONTSOURIS | 75 | 75 m | 1950-2026 | 2,6 | 5,6 |
| `strasbourg` | Strasbourg-Entzheim | `67124001` | STRASBOURG-ENTZHEIM | 67 | 150 m | 1950-2026 | 0,3 | 1,8 |

Colonnes 1961-1990 et 1991-2020 : nombre moyen de nuits tropicales par an sur l'année civile entière, mesuré.

**Écartées à la vérification :**

- **Marseille-Observatoire** (`13055001`, station urbaine, la plus proche du centre) : TN absente ou lacunaire chaque été de 2003 à 2018. Remplacée par Marignane (aéroport Marseille-Provence, à une vingtaine de kilomètres au nord-ouest, au bord de l'étang de Berre), dont le libellé "Marseille-Marignane" rappelle qu'elle n'est pas en ville.
- **Montpellier-Aéroport** (`34154001`) et **Nantes-Bouguenais** (`44020001`) : séries aussi complètes, écartées pour tenir à huit. Montpellier doublerait le profil méditerranéen de Perpignan et Marignane (28,6 nuits par an sur 1991-2020) ; Nantes doublerait le profil de Strasbourg (1,5). Candidates de remplacement si la sélection change (voir "Points à valider" dans `technical-specifications.md`).

## Faits mesurés

Mesurés sur les fichiers récupérés le 2026-09-24 (TN ≥ 20 °C, année civile entière), à reprendre tels quels ou à remesurer si les données sont récupérées de nouveau à l'implémentation.

Nombre moyen de nuits tropicales par an, par décennie (années complètes uniquement : la colonne 2020 couvre 2020-2025, six années) :

| Station | 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020-2025 |
|---|---|---|---|---|---|---|---|---|
| Nice | 15,0 | 18,7 | 24,0 | 40,3 | 42,7 | 49,7 | 72,8 | 85,2 |
| Perpignan | 24,9 | 18,0 | 17,4 | 25,8 | 31,7 | 37,2 | 42,7 | 51,7 |
| Marseille-Marignane | 10,3 | 14,8 | 17,2 | 18,7 | 33,5 | 37,1 | 34,9 | 53,0 |
| Toulouse-Blagnac | 3,0 | 1,9 | 1,7 | 4,0 | 9,3 | 11,7 | 13,5 | 23,3 |
| Lyon-Bron | 2,1 | 1,4 | 0,9 | 4,1 | 5,2 | 13,3 | 12,8 | 15,2 |
| Bordeaux-Mérignac | 0,7 | 0,7 | 1,1 | 1,4 | 5,7 | 6,9 | 5,1 | 12,5 |
| Paris-Montsouris | 1,7 | 1,1 | 3,6 | 2,5 | 5,3 | 4,6 | 6,5 | 9,7 |
| Strasbourg-Entzheim | 0,9 | 0,4 | 0,1 | 0,3 | 0,6 | 1,8 | 2,8 | 2,7 |

Records et séquences :

| Station | Année record | Plus longue série de nuits tropicales consécutives | TN la plus haute |
|---|---|---|---|
| Nice | 2022 : 104 nuits (2026 : 101 au 22 septembre) | 66 nuits, du 30 juin au 3 septembre 2022 | 28,7 °C (12 août 2025) |
| Perpignan | 2026 : 80 nuits au 22 septembre (2003 : 65) | 44 nuits, du 8 juillet au 20 août 2026 | 30,3 °C (4 août 2018) |
| Marseille-Marignane | 2022 : 80 nuits | 28 nuits, du 2 au 29 août 2003 | 28,3 °C (27 juillet 1983) |
| Toulouse-Blagnac | 2026 : 47 nuits au 22 septembre (2022 : 34) | 14 nuits, du 8 au 21 juillet 2026 | 27,4 °C (24 août 2023) |
| Lyon-Bron | 2003 : 42 nuits | 14 nuits, du 3 au 16 août 2003 | 25,7 °C (5 août 2018) |
| Bordeaux-Mérignac | 2026 : 32 nuits au 22 septembre (2003 et 2022 : 20) | 13 nuits, du 4 au 16 août 2003 | 26,8 °C (25 juin 2026) |
| Paris-Montsouris | 2026 : 32 nuits au 22 septembre (1976 et 2003 : 16) | 14 nuits, du 24 juin au 7 juillet 1976 | 26,4 °C (25 juin 2026) |
| Strasbourg-Entzheim | 2026 : 13 nuits au 22 septembre (2015 : 8) | 7 nuits, du 23 au 29 juin 2026 | 23,8 °C (23 juin 2017) |

Les valeurs 2026 viennent du lot "deux dernières années", mis à jour quotidiennement : elles sont validées (code qualité `1`) mais restent les plus susceptibles d'être révisées. Un compte partiel ne peut qu'augmenter d'ici la fin de l'année : un record partiel reste un record.

Autres constats :

- Années sans aucune nuit tropicale, de 1950 à 2026 : 37 à Strasbourg-Entzheim, 18 à Bordeaux-Mérignac, 12 à Lyon-Bron et à Paris-Montsouris, 6 à Toulouse-Blagnac, aucune à Nice, Perpignan et Marignane.
- Saison : sur les huit stations, les nuits tropicales tombent du 12 mai (Marignane, 2009) au 24 octobre (Marignane, 2022), à une exception près (Perpignan, 25 avril 2002). Aucune de novembre à mars, alors que Météo-France en a signalé une ailleurs en plein hiver (février 2020, article cité dans "Définition retenue" ci-dessus).

## Prétraitement (script hors build, exécuté à l'implémentation)

Script Node ponctuel, non commité (même convention que les autres visualisations du site, voir par exemple "Prétraitement" dans `specs/flower-phenology/data-model.md`), sans dépendance : `node:zlib` pour la décompression, lecture ligne à ligne.

1. Résoudre, par l'API data.gouv.fr, les URL des fichiers "RR-T-Vent" des lots "1950 à N-2" et "deux dernières années" des huit départements (06, 13, 31, 33, 66, 67, 69, 75), et les télécharger (de 4 à 19,5 Mo compressés par fichier, environ 100 Mo au total, mesuré le 2026-09-24).
2. Ne garder que les lignes des huit `NUM_POSTE` retenus, et pour chacune `AAAAMMJJ`, `TN` et `QTN`. Un même jour présent dans deux lots fait échouer le script (chevauchement inattendu entre lots).
3. Qualifier chaque jour : **tropical** si `TN ≥ 20,0`, **ordinaire** si `TN < 20,0`, **manquant** si `TN` est vide, si la ligne est absente, ou si `QTN = 2` ("donnée douteuse en cours de vérification"). Les codes `0` (protégée), `1` (validée) et `9` (filtrée, premiers contrôles passés) sont acceptés.
4. Pour chaque station et chaque année de 1950 à l'année de la dernière donnée :
   - `count` : nombre de jours tropicaux sur l'**année civile entière**, pour rester comparable aux comptes annuels publiés par Météo-France ;
   - `outsideWindow` : part de `count` tombée hors de la fenêtre affichée (1er mai - 31 octobre, voir "Fenêtre affichée" ci-dessous) ;
   - `tn` : les 184 valeurs de TN de la fenêtre, en dixièmes de degré (entiers, pour éviter les flottants), `null` si manquante ou pas encore observée ;
   - `missing` : nombre de nuits manquantes dans la fenêtre, hors nuits pas encore observées ;
   - `complete` : `true` si la fenêtre est entièrement écoulée (voir `lastObserved` ci-dessous) et que `missing` vaut au plus 9 (5 % de la fenêtre).
5. `lastObserved` : date de la dernière valeur de TN présente, commune aux huit stations (la plus ancienne des huit dernières dates, pour qu'aucune station ne paraisse en avance sur les autres).
6. Écrire `public/data/tropical-nights/nights.json`.

### Fenêtre affichée

Du **1er mai au 31 octobre**, 184 nuits, identiques chaque année (la fenêtre ne contient pas le 29 février : une colonne correspond toujours à la même date). Elle couvre toutes les nuits tropicales mesurées sauf une (voir "Faits mesurés" ci-dessus), qui reste comptée dans `count` et signalée par `outsideWindow`.

### Données manquantes et année en cours

Une année dont des nuits manquent ne doit jamais ressembler à une année fraîche :

- **Nuit manquante** : état distinct, jamais confondu avec une nuit ordinaire (voir "Palette" dans `technical-specifications.md`). Elle n'est comptée ni comme tropicale ni comme ordinaire.
- **Année incomplète** (`complete: false` pour cause de `missing` > 9) : son compte est affiché comme un minimum ("au moins 12 nuits") et elle est exclue des moyennes par décennie de la vue tableau. Sans objet avec les données mesurées (aucune nuit manquante sur les huit stations), la règle reste en place pour une récupération ultérieure.
- **Année en cours** : les nuits postérieures à `lastObserved` sont "pas encore observées", un troisième état distinct des deux autres (au 2026-09-24 : 39 nuits, du 23 septembre au 31 octobre 2026). Le compte est affiché avec sa date ("32 nuits au 22 septembre"), et l'année est exclue des moyennes par décennie tant qu'elle n'est pas complète. Elle reste retenue pour les records : un compte partiel ne peut qu'augmenter.

## Format de sortie

`public/data/tropical-nights/nights.json` (taille mesurée sur un prototype jetable : environ 450 ko, 145 ko compressé en gzip) :

```json
{
  "threshold": 20,
  "windowStart": "05-01",
  "windowEnd": "10-31",
  "lastObserved": "2026-09-22",
  "stations": [
    {
      "id": "nice",
      "label": "Nice",
      "stationId": "06088001",
      "stationName": "NICE",
      "latitude": 43.648833,
      "longitude": 7.209,
      "altitude": 2,
      "referencePeriod": null,
      "years": [
        {
          "year": 2022,
          "count": 104,
          "outsideWindow": 0,
          "missing": 0,
          "complete": true,
          "tn": [148, 152, 161, 203, 211, "…"]
        }
      ]
    },
    {
      "id": "paris",
      "label": "Paris-Montsouris",
      "stationId": "75114001",
      "stationName": "PARIS-MONTSOURIS",
      "latitude": 48.821667,
      "longitude": 2.337833,
      "altitude": 75,
      "referencePeriod": { "start": "1959-01-01", "end": "2022-12-31" },
      "years": []
    }
  ]
}
```

- `id` : identifiant stable de la station, utilisé dans l'URL (voir "État dans l'URL" dans `technical-specifications.md`) ; nom de ville en kebab-case, pas le `NUM_POSTE`, plus lisible dans un lien.
- `label` : libellé affiché, identique dans les deux langues (voir "Contenu non traduit" dans `functional-specifications.md`) ; `stationName` : nom brut de la source, pour traçabilité.
- `tn[i]` : TN de la `i`-ème nuit de la fenêtre (indice 0 = 1er mai), en dixièmes de degré Celsius. Une nuit est tropicale si `tn[i] >= 200`.
- `referencePeriod` : période SQR de TN (voir "Séries homogénéisées" ci-dessus), `null` pour Nice.
- `latitude`, `longitude`, `altitude` : position actuelle de la station telle que publiée (pas d'historique des déplacements dans la source).

## Téléchargement

`nights.json` est déclaré téléchargeable (`downloads: [nights.json]`) : la Licence Ouverte v2.0 autorise la redistribution et la transformation, avec mention de la source et de la date de mise à jour, que le bloc de crédit porte déjà (voir "Téléchargement des données préparées" dans le `functional-specifications.md` général).

## Contraintes de validation propres à cette visualisation

Vérifiées par le script de prétraitement, qui échoue plutôt que d'écrire un fichier incohérent :

- Huit stations, `id` uniques.
- Chaque station porte une entrée `years` par année, de 1950 à l'année de `lastObserved`, dans l'ordre, sans trou.
- Chaque tableau `tn` compte exactement 184 valeurs.
- `count` est égal au nombre de valeurs `tn >= 200`, plus `outsideWindow`.
- Une valeur `null` dans `tn` est soit une nuit postérieure à `lastObserved` (dernière année seulement), soit comptée dans `missing`.
- `complete` est cohérent avec `missing` et `lastObserved` (voir "Prétraitement" ci-dessus).
