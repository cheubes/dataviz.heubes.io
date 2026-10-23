# Modèle de données : La mer monte à Brest

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | Tide Gauge Data, Brest (station 1) : moyennes annuelles du niveau de la mer, jeu RLR (Revised Local Reference) |
| `publisher` | Permanent Service for Mean Sea Level (PSMSL), National Oceanography Centre ; autorité de données : Shom |
| `url` | https://psmsl.org/data/obtaining/stations/1.php |
| `license` | Pas de licence formalisée : données librement accessibles, citation requise (Holgate et al. 2013 ; PSMSL, "Tide Gauge Data") |
| `retrieved` | 2026-09-24 (extraction PSMSL du 14 septembre 2026), à mettre à jour à l'implémentation |

**Station :** Brest, identifiant PSMSL `1`, GLOSS `242`, 48,38285° N, 4,494838° O, autorité de données Shom. Dernière mise à jour de la station côté PSMSL : 20 février 2026.

**Fichiers utilisés :**
- Annuel (fichier consommé) : https://psmsl.org/data/obtaining/rlr.annual.data/1.rlrdata
- Mensuel (consulté pour vérification, non consommé, voir "Données mensuelles" ci-dessous) : https://psmsl.org/data/obtaining/rlr.monthly.data/1.rlrdata

**Citation demandée par le PSMSL** (page "Referencing the Tide Gauge Data Set", https://psmsl.org/data/obtaining/reference.php), à reprendre dans la présentation longue ou le bloc de crédit :
- Permanent Service for Mean Sea Level (PSMSL), 2026, "Tide Gauge Data", Retrieved 14 Sep 2026 from http://www.psmsl.org/data/obtaining/.
- Simon J. Holgate, Andrew Matthews, Philip L. Woodworth, Lesley J. Rickards, Mark E. Tamisiea, Elizabeth Bradshaw, Peter R. Foden, Kathleen M. Gordon, Svetlana Jevrejeva, and Jeff Pugh (2013) New Data Systems and Products at the Permanent Service for Mean Sea Level. Journal of Coastal Research: Volume 29, Issue 3: pp. 493 – 504. doi:10.2112/JCOASTRES-D-12-00175.1.

Le PSMSL précise que la date "Retrieved" doit correspondre à la date "Extracted from Database" affichée sur ses pages de données (14 septembre 2026 à la vérification), pas à la date de téléchargement.

## Licence et politique de données (vérifiées)

Vérifiées le 2026-09-24 sur les pages publiques des trois organismes qui diffusent ces mesures :

- **PSMSL (source retenue) :** aucune licence formalisée publiée (ni sur la page d'accueil, ni sur "About us", ni sur les pages "Obtaining", "Complete dataset" ou "Notes"). Seule obligation écrite : "When using the tide gauge data set from the PSMSL, we ask that you reference the last paper describing the data set, as well as the data set itself." Le registre re3data classe le dépôt en accès "open", licence "other". La redistribution n'y est ni autorisée ni interdite explicitement.
- **SONEL** (Système d'Observation du Niveau des Eaux Littorales, qui distribue les mêmes moyennes, voir ci-dessous) : politique "Free publication policy for scientific applications", qui impose l'enregistrement de l'utilisateur, la communication des résultats, et "not to provide data to a third party", usage commercial exclu. Plus restrictive que le PSMSL : écartée comme source pour cette raison.
- **Shom / REFMAR :** les observations marégraphiques du réseau RONIM (dont Brest) sont diffusées sur data.shom.fr sous Licence Ouverte 2.0 (Etalab), mais sous forme de mesures à haute fréquence et horaires, pas de moyennes annuelles homogénéisées depuis 1807. Recalculer deux siècles de moyennes à partir des mesures horaires dépasserait le cadre d'une visualisation et redoublerait un travail de référence déjà fait par le PSMSL et le Shom.

Conséquence pour le téléchargement : voir "Téléchargement" ci-dessous.

## Station et série : faits vérifiés

- **Documentation de la station (PSMSL) :** les données anciennes proviennent des volumes originaux des "Publications Scientifiques" ; 1807-1835 sont des niveaux de mi-marée (Mean Tide Level, MTL, moyenne des pleines et basses mers), 1846 et après de vrais niveaux moyens (Mean Sea Level, MSL). Le PSMSL applique aux valeurs 1807-1835 du fichier RLR une correction MTL-MSL de -23 mm (Wöppelmann et al., Ocean Dynamics, 56, 487-497, 2006), les rendant comparables au reste de la série ; ces années portent le drapeau `010`. En juillet 2025, le PSMSL a mis à jour toute la série pour intégrer les données historiques récemment retrouvées par le Shom et aligner ses moyennes sur celles de SONEL.
- **Datum RLR :** chaque série RLR est ramenée à un zéro local unique, fixé par convention à environ 7 000 mm sous le niveau moyen (pour éviter les valeurs négatives), à partir de l'historique des repères de nivellement fourni par l'autorité. Seules les variations comptent, pas la valeur absolue. Le PSMSL recommande de n'utiliser que le jeu RLR pour l'analyse de séries temporelles (le jeu "Metric" n'a pas de continuité de datum).
- **Mesure relative :** un marégraphe mesure la mer par rapport au quai sur lequel il est posé. La série n'est corrigée ni du mouvement vertical du sol, ni de la pression atmosphérique (effet de baromètre inverse), ni de l'ajustement isostatique glaciaire. À Brest, le mouvement vertical du sol est faible mais pas démontré nul : le nivellement historique n'a pas montré plus d'un millimètre d'écart en 73 ans entre le repère du marégraphe et un repère voisin, tandis que la gravimétrie absolue 1998-2022 estime une légère subsidence de -1,10 ± 0,62 mm/an ("Absolute gravity measurements at Brest (France) between 1998 and 2022", Earth System Science Data, 17, 5859, 2025). Le site parle donc de montée "relative" de la mer à Brest, sans en déduire la part due à l'océan seul.
- **Enregistrements plus anciens hors périmètre :** des mesures remontent à 1711 (Wöppelmann et al., Geophysical Research Letters, 2008, "Tide gauge datum continuity at Brest since 1711: France's longest sea-level record"), mais elles ne sont pas intégrées au jeu RLR du PSMSL, qui commence en 1807. La visualisation commence en 1807.

## Format brut (PSMSL, vérifié)

Fichier annuel `1.rlrdata` : texte délimité par des points-virgules, une ligne par année, format Fortran `1x,i4,1x,i6,1x,a1,1x,i3` :

```
 1807;  6970;N;010
 1836;-99999;N;000
 2023;  7232;N;000
```

| Colonne | Contenu |
|---|---|
| 1 | Année |
| 2 | Niveau moyen annuel, en mm au-dessus du datum RLR ; `-99999` pour une année sans valeur (la série est complétée par ces valeurs de remplissage entre la première et la dernière année) |
| 3 | Jours manquants : `N`, ou `Y` si un mois manque dans la moyenne ou si au moins 30 jours manquent sur l'année |
| 4 | Drapeau d'attention (octal) : `000` aucun, `001` à traiter avec prudence, `010` valeur MTL dans une série MSL (corrigée en MSL dans le fichier RLR) |

Règles du PSMSL : une moyenne mensuelle n'est pas calculée au-delà de 15 jours manquants ; une moyenne annuelle n'est pas calculée s'il manque plus d'un mois.

## Couverture réelle (mesurée sur le fichier du 14 septembre 2026)

- **Étendue :** 1807 à 2023, soit 217 années, dont **187 renseignées** (86 %). Le PSMSL affiche 88 % de complétude sur sa page, calculée sur les mois.
- **Lacunes (30 années sans valeur) :**

| Lacune | Durée | Mois renseignés dans le fichier mensuel / remarque |
|---|---|---|
| 1836-1845 | 10 ans | Aucun. Entre la fin des mesures de mi-marée (1835) et le début des moyennes vraies (1846) |
| 1857-1860 | 4 ans | 5 mois en 1857, 7 en 1860, aucun en 1858-1859 |
| 1863-1864 | 2 ans | 8 et 10 mois |
| 1897 | 1 an | 10 mois |
| 1915 | 1 an | Aucun |
| 1937-1938 | 2 ans | 7 mois en 1937, aucun en 1938 |
| 1944-1952 | 9 ans | 4 mois en 1944, aucun ensuite. Bombardement de Brest en août 1944 ; la continuité du datum de part et d'autre de cette coupure a été établie par Wöppelmann et al. (2008) |
| 1980 | 1 an | 10 mois |

- **Années incomplètes (`Y`) :** 1847, 1862, 1867, 1868, 1877, 1878, 1891, 1907, 1917, 1922, 1982 (valeur publiée mais calculée avec un mois ou plus de 30 jours manquants).
- **Années de mi-marée corrigées (`010`) :** 1807 à 1835 (29 années).
- **Aucun drapeau `001`** sur la série annuelle.
- **Pourquoi la série s'arrête en 2023 :** le fichier mensuel va jusqu'à juin 2025, mais novembre et décembre 2024 manquent : le PSMSL ne calcule donc pas de moyenne 2024, et 2025 est incomplète. La dernière année de la visualisation est 2023 ; elle avancera avec les mises à jour du PSMSL (voir "Prétraitement").

## Données mensuelles

Le fichier mensuel (2 622 lignes, 1807.0417 à 2025.4583, 312 mois à `-99999`) n'est pas consommé : l'objet de la visualisation est la tendance sur deux siècles, et les moyennes mensuelles y ajouteraient surtout le cycle saisonnier et les tempêtes (écart de près de 40 cm entre février et octobre 2023), qui brouilleraient la lecture d'une hausse de 24 cm. Il sert seulement à vérifier les lacunes annuelles (voir "Couverture réelle").

## Niveau de référence

Les niveaux sont affichés en écart au **niveau moyen du dix-neuvième siècle** : moyenne des 76 années renseignées entre 1807 et 1899, soit **6 939,7 mm** RLR. Le zéro RLR n'a pas de sens physique pour le visiteur, alors qu'une référence historique donne directement la hausse. Choix robuste : prendre 1846-1899 (moyennes vraies seulement, sans les années de mi-marée corrigées) donne 6 942,0 mm, soit 2,3 mm d'écart, sans effet visible.

## Statistiques mesurées

Calculées sur les 187 années renseignées du fichier annuel, par l'auteur de ces specs, lors de la vérification du 2026-09-24 (script de vérification ponctuel, non commité). Pentes par régression linéaire ordinaire des moyennes annuelles sur les années ; l'incertitude donnée est l'erreur type de la pente, qui ignore l'autocorrélation de la série et sous-estime donc l'incertitude réelle : elle est indicative.

**Hausse totale :**
- Moyenne 2014-2023 : **+23,6 cm** au-dessus du niveau moyen du dix-neuvième siècle. Arrondi éditorial : "environ 24 cm".
- La décennie 1900-1909 est encore au niveau du dix-neuvième siècle (-0,3 cm) : pratiquement toute la hausse date d'après 1900.
- Record annuel : 2023, **+29,2 cm**. Les dix années les plus hautes de la série sont toutes postérieures à 2008 ; huit tombent entre 2014 et 2023.
- Année la plus basse : 1808, -7,2 cm.

**Vitesse de montée par période :**

| Période | Années renseignées | Pente (mm/an) |
|---|---|---|
| 1807-1899 | 76 | 0,0 ± 0,1 |
| 1900-1992 | 80 | 1,3 ± 0,1 |
| 1993-2023 | 31 | 3,2 ± 0,5 |
| Série entière 1807-2023 (repère) | 187 | 1,1 ± 0,05 |
| 1900-2023 (repère) | 111 | 1,6 ± 0,1 |

Découpage retenu pour la visualisation (voir "Tendances par période" dans `technical-specifications.md`) : les trois premières lignes. 1900 sépare un dix-neuvième siècle plat d'un vingtième siècle en hausse ; 1993 est le début de l'altimétrie satellitaire (TOPEX/Poseidon), coupure conventionnelle des bilans du niveau marin, choisie pour cette raison plutôt qu'ajustée sur la série de Brest. Depuis 1993, la mer monte à Brest environ deux fois et demie plus vite qu'au vingtième siècle.

**Ce que la série ne permet pas d'affirmer (à respecter dans les textes) :**
- Une seule station porte une forte variabilité d'une décennie à l'autre : des pentes calculées sur 30 ans glissants atteignent déjà environ 3 mm/an vers 1915-1920 et vers 1950, avant de redescendre. L'accélération se lit sur la comparaison de périodes longues, pas sur une vitesse "instantanée". Écarté pour cette raison : une courbe de vitesse glissante, qui laisserait croire à des accélérations passées aussi fortes que l'actuelle.
- Une pente sur 20 ans (2004-2023 : 5,7 ± 0,9 mm/an) est trop sensible à quelques années record (2023) pour être citée.
- Saut marqué entre les décennies 1900 (-0,3 cm) et 1910 (+7,3 cm), sans explication dans la documentation PSMSL de la station : ni commenté, ni corrigé (voir "Points à valider" dans `technical-specifications.md`).
- Aucune de ces valeurs ne distingue la part de l'océan de celle du sol (voir "Mesure relative" ci-dessus).

## Prétraitement (script hors-build, exécuté à l'implémentation)

Script Node ponctuel (non commité, même convention que `grape-harvest-almanac`), à partir du fichier annuel PSMSL téléchargé une fois (`1.rlrdata`).

1. Lire les lignes (séparateur `;`, espaces à retirer), écarter les années à `-99999`.
2. Conserver pour chaque année renseignée : l'année, la valeur RLR en mm (entier, telle que publiée), et deux booléens tirés des drapeaux : `meanTideLevel` (drapeau `010`) et `incomplete` (colonne 3 à `Y`). Arrêter le script avec une erreur si une année porte le drapeau `001` : la documentation de la station serait alors à relire avant publication.
3. Calculer le niveau de référence (moyenne des années renseignées 1807-1899, arrondie au dixième de mm) et, pour chacune des trois périodes (voir "Statistiques mesurées"), la droite de régression : pente arrondie au dixième de mm/an avec son erreur type, et niveaux ajustés aux deux bornes de la période (en mm RLR, au dixième), qui servent à tracer la tendance sans refaire la régression côté client.
4. Sortie : `public/data/brest-sea-level/sea-level.json`.

Mise à jour : relancer le script sur un nouveau fichier PSMSL suffit pour prolonger la série (2024 quand le PSMSL la publiera) ; les textes qui citent des chiffres (résumé, présentation longue, tableau des statistiques ci-dessus) sont alors à revérifier.

## Format de sortie

```json
{
  "station": { "psmslId": 1, "name": "Brest", "latitude": 48.38285, "longitude": -4.494838 },
  "extractedFromDatabase": "2026-09-14",
  "reference": { "startYear": 1807, "endYear": 1899, "levelMm": 6939.7 },
  "years": [
    { "year": 1807, "levelMm": 6970, "meanTideLevel": true, "incomplete": false },
    { "year": 1847, "levelMm": 6918, "meanTideLevel": false, "incomplete": true },
    { "year": 2023, "levelMm": 7232, "meanTideLevel": false, "incomplete": false }
  ],
  "trends": [
    { "id": "nineteenth-century", "startYear": 1807, "endYear": 1899, "rateMmPerYear": 0.0, "standardError": 0.1, "startLevelMm": 6939.4, "endLevelMm": 6940.1 },
    { "id": "twentieth-century", "startYear": 1900, "endYear": 1992, "rateMmPerYear": 1.3, "standardError": 0.1, "startLevelMm": 6964.1, "endLevelMm": 7079.6 },
    { "id": "satellite-era", "startYear": 1993, "endYear": 2023, "rateMmPerYear": 3.2, "standardError": 0.5, "startLevelMm": 7087.5, "endLevelMm": 7183.2 }
  ]
}
```

`levelMm` : valeur RLR brute, en mm. L'écart au niveau de référence (`levelMm - reference.levelMm`) est calculé à l'affichage et dans la vue tableau, pas stocké : le fichier reste traçable ligne à ligne jusqu'au fichier PSMSL. `startLevelMm`/`endLevelMm` : niveaux de la droite de régression de la période à `startYear` et `endYear`. Les trois droites sont ajustées séparément : elles ne se raccordent pas d'une période à l'autre (écart de 2,4 cm entre 1899 et 1900, de 0,8 cm entre 1992 et 1993), ce qui est attendu et reste visible. Une année sans valeur n'a pas d'entrée dans `years` (même convention que `grape-harvest-almanac`) : les lacunes se déduisent des années absentes. Taille attendue : une dizaine de ko.

## Téléchargement

Pas d'attribut `downloads` : la redistribution n'est explicitement autorisée par aucune des sources (voir "Licence et politique de données" ci-dessus). Le PSMSL ne publie pas de licence, et SONEL, qui diffuse exactement les mêmes moyennes depuis 2025, interdit leur transmission à des tiers. Au sens de la règle générale (voir "Téléchargement des données préparées" dans `functional-specifications.md` général), il manque donc l'autorisation de redistribution qui rendrait acceptable une source sans licence formalisée. Le manque est faible pour le visiteur : le lien de la source, dans le bloc de crédit, mène à la page de la station, d'où le fichier annuel se télécharge en un clic. À rouvrir si le PSMSL ou le Shom confirment par écrit que la redistribution avec citation est admise (voir "Points à valider" dans `technical-specifications.md`).

## Contraintes de validation propres à cette visualisation

- `years` est trié par `year` croissant, sans doublon, et chaque `levelMm` est un entier strictement positif (jamais `-99999`).
- `meanTideLevel` n'est vrai que pour des années entre 1807 et 1835.
- Chaque entrée de `trends` a un `id` unique ; les périodes se suivent sans se chevaucher et couvrent la plage de `years` (1807 à la dernière année).
- `reference.startYear` et `reference.endYear` bornent au moins une année présente dans `years`.
