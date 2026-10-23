# Modèle de données : Le cœur battant du Soleil

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | International Sunspot Number V2.0 (monthly mean, 13-month smoothed, cycle minima and maxima) |
| `publisher` | WDC-SILSO, Royal Observatory of Belgium, Brussels |
| `url` | https://doi.org/10.24414/qnza-ac80 |
| `license` | CC BY-NC 4.0 |
| `retrieved` | 2026-09-24 |

Un seul jeu de données, au sens de l'attribut `datasets` : les trois fichiers utilisés (voir "Fichiers sources" ci-dessous) sont des produits du même jeu, publiés par la même source sous la même licence et le même DOI.

**`url` : le DOI plutôt que la page de téléchargement.** Le DOI est l'identifiant que SILSO demande de citer (voir "Licence et citation" ci-dessous) : l'afficher dans le bloc de crédit des sources reproduit tel quel le crédit minimal demandé. Vérifié à la récupération : il redirige (302) vers la page d'atterrissage de l'Observatoire royal de Belgique (`astro.oma.be/doi/ROB-SIDC-SILSO_SunspotNumberV2.html`, 200), qui renvoie elle-même vers la page de téléchargement `https://www.sidc.be/SILSO/datafiles`. Le script de surveillance des sources suit les redirections (voir "Surveillance des sources" dans `technical-specifications.md` général).

**Couverture temporelle :** moyennes mensuelles de janvier 1749 à août 2026 (dernier mois écoulé à la récupération), soit 3 332 mois, sans aucune valeur manquante. Les moyennes mensuelles ne remontent pas plus loin : d'après la page de description du fichier, les observations compilées par Rudolf Wolf sont trop rares avant 1749 (seules des moyennes annuelles existent depuis 1700, non utilisées ici).

## Licence et citation

Vérifiées à la récupération, sur trois pages de la source :

- **Page de description du fichier mensuel** (`https://www.sidc.be/SILSO/infosnmtot`, section "LICENSE") : "SILSO data is under CC BY-NC4.0 license [...] which means you can: Share: copy and redistribute the material in any medium or format; Adapt: remix, transform, and build upon the material. As long as you follow the license terms: Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made. [...] NonCommercial: You may not use the material for commercial purposes. No additional restrictions [...]" (ponctuation adaptée : la source sépare chaque terme de sa définition par un tiret).
- **Page de téléchargement** (`https://www.sidc.be/SILSO/datafiles`, "Data policy: CC BY-NC") : "The World Data Center SILSO has adopted an open data policy [...] and our sunspot data can be freely downloaded (Licence: CC BY-NC : https://creativecommons.org/licenses/by-nc/4.0). However, we kindly request that proper credit to the WDC-SILSO is explicitely included in any publication using our data (paper article or book, on-line Web content, etc.)."
- **Page de citation** (`https://www.sidc.be/SILSO/citations`) : crédit minimal suggéré, **"Source: WDC-SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80"**, ou la variante longue "Sunspot data from the World Data Center SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80". Référence bibliographique : Clette, F. et Lefèvre, L., *SILSO Sunspot Number V2.0*, 2015, DOI 10.24414/qnza-ac80, publié par WDC-SILSO, Observatoire royal de Belgique.

La politique de données générale de l'Observatoire royal de Belgique (`https://www.astro.oma.be/en/information/data-policy/`) confirme la restriction : tout usage commercial exige l'accord écrit préalable du directeur général.

**Conséquence pour ce site :** usage compatible (site non commercial, sous CC BY-NC-SA 4.0, voir "Pied de page" dans `style-guide.md`), même situation que la bondrée de `bird-migrations` (CC BY-NC 4.0) et que `volcanic-eruptions` (usage non commercial avec citation). Les trois obligations de la licence sont tenues ainsi :

- **Crédit :** bloc de crédit des sources de la page (`name`, `publisher`, `license`, lien vers le DOI), qui reprend le crédit minimal demandé.
- **Lien vers la licence :** le libellé `license` affiché ("CC BY-NC 4.0").
- **Indication des modifications :** le fichier préparé restructure les données (voir "Prétraitement" ci-dessous) ; il porte lui-même une mention d'attribution qui le dit (champ `attribution`, voir "Format de sortie"), pour qu'elle le suive s'il est téléchargé et partagé hors de la page (voir "Téléchargement" dans `technical-specifications.md`).

## Version 2.0 (recalibration de 2015)

Depuis le 1er juillet 2015, la série historique (dite "nombre de Zurich", désormais version 1.0, archivée et plus mise à jour) est remplacée par la version 2.0 (page `https://www.sidc.be/SILSO/newdataset`). Deux changements comptent pour cette visualisation :

- **Changement d'échelle :** l'observateur de référence n'est plus Wolf mais A. Wolfer, ce qui supprime le facteur conventionnel de 0,6 de Zurich et multiplie toute la série par 1/0,6. Combiné aux corrections, le relèvement net est d'environ 45 % après 1947, selon la source.
- **Corrections d'inhomogénéités** passées (détaillées dans Clette et al. 2014, *Space Science Reviews* 186, et Clette et Lefèvre 2016, *Solar Physics* 291).

**Implication :** les chiffres de la visualisation ne sont pas comparables aux valeurs de la version 1.0, encore reprises par des publications antérieures à 2015. Vérifié sur le fichier archivé de la version 1.0 (`DATA/ARCHIVE/V1.0/monthssn.dat`) : le maximum lissé du cycle 19 (mars 1958) y valait 201,3, contre 285,0 en version 2.0 ; mai 1778 y valait 238,9 (398,2 en V2.0, soit exactement ×1/0,6) et octobre 1957 253,8 (359,4 en V2.0, soit seulement ×1,42 : correction propre à la période postérieure à 1947). **La recalibration a changé le détenteur du record mensuel :** octobre 1957 en version 1.0, mai 1778 en version 2.0. Cette mise en garde figure dans la présentation longue (voir `functional-specifications.md`).

## Fichiers sources

Trois fichiers CSV, séparateur point-virgule, valeurs complétées d'espaces à gauche (à retirer au parsing). Téléchargés depuis `https://www.sidc.be/SILSO/DATA/` : le chemin `INFO/` des pages de description ne sert pas les fichiers (404, vérifié).

### `SN_m_tot_V2.0.csv` : moyenne mensuelle du nombre total de taches

Moyenne arithmétique des nombres quotidiens de tous les jours du mois (nombre quotidien : R = Ns + 10 × Ng, Ns le nombre de taches et Ng le nombre de groupes sur tout le disque solaire, d'après la page d'atterrissage du DOI). Nombre sans unité.

| Colonne | Contenu | Usage |
|---|---|---|
| 1 | Année | Clé mensuelle (`month`) |
| 2 | Mois | Clé mensuelle (`month`) |
| 3 | Date décimale du milieu du mois | Non utilisée (recalculée depuis année et mois) |
| 4 | Moyenne mensuelle ; `-1` = valeur manquante | `value` |
| 5 | Écart type des valeurs des stations ; `-1` avant 1818 | Non utilisée |
| 6 | Nombre d'observations ; `-1` avant 1818 | Non utilisée |
| 7 | `1` définitif, `0` provisoire | `provisional` |

3 332 lignes, janvier 1749 à août 2026, aucune valeur `-1` en colonne 4. Cinq mois provisoires (avril à août 2026), "susceptibles d'être révisés" selon la source (habituellement les trois à six derniers mois). Février 1824 est le seul mois sans aucune observation quotidienne depuis 1749 : sa valeur (18,0) a été interpolée par Wolf entre les mois voisins (colonne 6 à `0`) ; conservée telle quelle.

### `SN_ms_tot_V2.0.csv` : moyenne mensuelle lissée sur 13 mois

Moyenne glissante "tapered boxcar" sur 13 mois centrée sur le mois considéré (poids 1, sauf 0,5 aux mois −6 et +6, normalisation par 1/12). Mêmes colonnes que le fichier mensuel, colonne 4 = valeur lissée. Pas de valeur pour les six premiers et les six derniers mois de la série (`-1`) : valeurs lissées de juillet 1749 à février 2026 (3 320 mois), dont les cinq dernières provisoires (octobre 2025 à février 2026).

La source précise que cette série n'est fournie que pour la compatibilité avec les publications passées, et recommande de partir des moyennes mensuelles pour tout autre lissage. Elle reste ici la référence parce que c'est elle qui définit conventionnellement les dates des minima et maxima des cycles (voir "Définition des cycles" ci-dessous) : tracer une autre moyenne mobile ferait tomber les pics à côté des dates officielles.

### `DATA/Cycles/TableCyclesMiMa.csv` : dates des minima et maxima des cycles

Deux lignes d'en-tête (`;Min;;;Max;;` puis `N°;Year;Month;SN;Year;Month;SN`), encodée en Latin-1 (le `°` de l'en-tête n'est pas de l'UTF-8 valide), puis une ligne par cycle : numéro, année et mois du minimum, valeur lissée au minimum, année et mois du maximum, valeur lissée au maximum. 25 lignes (cycles 1 à 25).

**Écart relevé entre les produits SILSO :** la ligne du cycle 25 n'a pas de maximum dans ce CSV (ni dans le TXT `TableCyclesMiMa.txt`, ni dans la page "Cycles durations"), alors que la page HTML "Solar Cycles Min/Max" (`https://www.sidc.be/SILSO/cyclesminmax`) affiche octobre 2024, 160,9. Cette valeur est aussi le maximum de la série lissée sur le cycle 25, valeur définitive (non provisoire) à la récupération. Le prétraitement la reprend donc depuis la série lissée (voir ci-dessous).

## Définition des cycles

Un cycle court d'un minimum de la série lissée sur 13 mois au minimum suivant, dates publiées par SILSO (fichier `TableCyclesMiMa.csv`, voir ci-dessus). Son maximum est le mois où la série lissée culmine. La numérotation commence avec le cycle 1, ouvert par le minimum de février 1755 (convention de Wolf).

- **Cycles 1 à 24 :** complets, du mois du minimum au mois précédant le minimum suivant.
- **Cycle 25 :** ouvert par le minimum de décembre 2019, en cours ; couvert jusqu'au dernier mois disponible (août 2026). Maximum d'octobre 2024 (voir "Écart relevé" ci-dessus).
- **Cycle 0 (partiel) :** les 73 mois de janvier 1749 à janvier 1755, fin d'un cycle dont le minimum de départ précède la série. SILSO ne le numérote pas ; il est gardé pour ne perdre aucun mois de la série, marqué incomplet et sans minimum ni maximum officiels (voir "Points à valider" dans `technical-specifications.md`).

## Statistiques mesurées

Mesurées sur les fichiers récupérés le 2026-09-24. Montée : du minimum au maximum. Durée : du minimum au minimum suivant (identique à la colonne "Duration" publiée par SILSO sur la page "Cycles durations").

| Cycle | Minimum | Valeur lissée au minimum | Maximum | Valeur lissée au maximum | Montée (mois) | Durée (mois) | Moyenne mensuelle la plus haute du cycle |
|---|---|---|---|---|---|---|---|
| 1 | 1755-02 | 14,0 | 1761-06 | 144,1 | 76 | 136 | 178,7 (1761-05) |
| 2 | 1766-06 | 18,6 | 1769-09 | 193,0 | 39 | 108 | 263,7 (1769-10) |
| 3 | 1775-06 | 12,0 | 1778-05 | 264,2 | 35 | 111 | 398,2 (1778-05) |
| 4 | 1784-09 | 15,9 | 1788-02 | 235,3 | 41 | 163 | 290,0 (1787-12) |
| 5 | 1798-04 | 5,3 | 1805-02 | 82,0 | 82 | 147 | 103,8 (1804-10) |
| 6 | 1810-07 | 0,0 | 1816-05 | 81,2 | 70 | 154 | 160,3 (1817-03) |
| 7 | 1823-05 | 0,1 | 1829-11 | 119,2 | 78 | 126 | 177,3 (1830-04) |
| 8 | 1833-11 | 12,2 | 1837-03 | 244,9 | 40 | 116 | 343,8 (1836-12) |
| 9 | 1843-07 | 17,6 | 1848-02 | 219,9 | 55 | 149 | 300,6 (1847-10) |
| 10 | 1855-12 | 6,0 | 1860-02 | 186,2 | 50 | 135 | 221,9 (1860-07) |
| 11 | 1867-03 | 9,9 | 1870-08 | 234,0 | 41 | 141 | 293,6 (1870-05) |
| 12 | 1878-12 | 3,7 | 1883-12 | 124,4 | 60 | 135 | 159,6 (1882-04) |
| 13 | 1890-03 | 8,3 | 1894-01 | 146,5 | 46 | 142 | 215,4 (1893-08) |
| 14 | 1902-01 | 4,5 | 1906-02 | 107,1 | 49 | 138 | 180,3 (1907-02) |
| 15 | 1913-07 | 2,5 | 1917-08 | 175,7 | 49 | 121 | 257,7 (1917-08) |
| 16 | 1923-08 | 9,3 | 1928-04 | 130,2 | 56 | 121 | 179,9 (1929-12) |
| 17 | 1933-09 | 5,8 | 1937-04 | 198,6 | 43 | 125 | 275,6 (1938-07) |
| 18 | 1944-02 | 12,9 | 1947-05 | 218,7 | 39 | 122 | 285,0 (1947-05) |
| 19 | 1954-04 | 5,1 | 1958-03 | 285,0 | 47 | 126 | 359,4 (1957-10) |
| 20 | 1964-10 | 14,3 | 1968-11 | 156,6 | 49 | 137 | 192,3 (1969-03) |
| 21 | 1976-03 | 17,8 | 1979-12 | 232,9 | 45 | 126 | 266,9 (1979-09) |
| 22 | 1986-09 | 13,5 | 1989-11 | 212,5 | 38 | 119 | 284,5 (1989-06) |
| 23 | 1996-08 | 11,2 | 2001-11 | 180,3 | 63 | 148 | 244,3 (2000-07) |
| 24 | 2008-12 | 2,2 | 2014-04 | 116,4 | 64 | 132 | 146,1 (2014-02) |
| 25 | 2019-12 | 1,8 | 2024-10 | 160,9 | 58 | en cours (81 mois à août 2026) | 216,0 (2024-08) |

Faits retenus pour la visualisation et ses textes :

- **Record mensuel :** mai 1778, 398,2 (cycle 3). Deuxième : octobre 1957, 359,4 (cycle 19). Huit mois seulement dépassent 300 sur toute la série.
- **Cycle le plus intense :** cycle 19, maximum lissé 285,0 en mars 1958. Suivi du cycle 3 (264,2).
- **Cycles les plus faibles :** cycles 6 (81,2) et 5 (82,0), consécutifs, qui forment le minimum de Dalton. Puis le cycle 14 (107,1) et le cycle 24 (116,4), le plus faible depuis le cycle 14, soit depuis plus d'un siècle.
- **Mois à zéro :** 67 moyennes mensuelles nulles, dont 21 mois d'affilée d'octobre 1809 à juin 1811, en plein minimum de Dalton. Dernier mois nul : août 2009. Toutes les valeurs antérieures à 1818 sont à lire avec prudence : SILSO ne publie pour elles ni écart type ni nombre d'observations, et la série mensuelle ne commence en 1749 que parce que les observations compilées par Wolf étaient trop rares avant.
- **Durée :** 9,0 ans (cycle 2) à 13,6 ans (cycle 4) ; moyenne des cycles 1 à 24 : 132,4 mois, soit 11,0 ans.
- **Montée :** 35 mois (cycle 3) à 82 mois (cycle 5) ; moyenne des cycles 1 à 24 : 52,3 mois (4,4 ans). Maximum lissé moyen des cycles 1 à 24 : 178,7.
- **Effet Waldmeier** (plus un cycle est intense, plus il monte vite) : corrélation de −0,75 entre montée et maximum lissé sur les cycles 1 à 24. C'est ce que la forme retenue rend visible (voir "Forme retenue" dans `functional-specifications.md`).
- **Cycle 25 :** maximum lissé de 160,9 en octobre 2024, 15e sur 25, nettement au-dessus du cycle 24. Dernière moyenne mensuelle : 76,0 en août 2026 (provisoire) ; dernière valeur lissée : 99,8 en février 2026 (provisoire).
- **Écart d'arrondi :** la série lissée donne 264,3 en mai 1778 là où la table des cycles publie 264,2. Les valeurs de la table font foi pour les maxima de cycle (voir "Prétraitement").

## Prétraitement (script hors-build, exécuté à l'implémentation)

Script Node ponctuel (non commité, cohérent avec `bird-migrations`, `flower-phenology` et `grape-harvest-almanac`), à partir des trois fichiers téléchargés une fois (voir "Fichiers sources").

1. Parser les trois CSV : séparateur `;`, espaces de complétion retirés, `TableCyclesMiMa.csv` lu en Latin-1 et ses deux lignes d'en-tête ignorées.
2. Joindre moyenne mensuelle et moyenne lissée par année et mois. Une valeur `-1` devient `null` (seulement pour la série lissée, aux six premiers et six derniers mois ; une valeur mensuelle à `-1` fait échouer le script, voir "Contraintes de validation").
3. Reprendre le marqueur provisoire (colonne 7 du fichier mensuel) : `provisional` vrai pour les mois marqués `0`. Le marqueur de la série lissée n'est pas repris : une valeur lissée provisoire l'est parce que des mois mensuels voisins le sont, ce que le visiteur lit déjà sur ces mois-là.
4. Construire les cycles à partir de `TableCyclesMiMa.csv` (bornes et maxima publiés), plus le cycle 0 partiel (voir "Définition des cycles"). Maximum du cycle 25 absent de la table : reprendre le mois et la valeur du maximum de la série lissée sur ce cycle (octobre 2024, 160,9), en vérifiant qu'ils correspondent à la page HTML "Solar Cycles Min/Max".
5. Aucune autre transformation des valeurs : pas de lissage propre, pas de recalcul des bornes de cycles, pas de conversion d'échelle.
6. Écrire la mention `attribution` (voir "Format de sortie").
7. Sortie : `public/data/sunspots/sunspots.json`, JSON minifié. Taille mesurée sur un prototype jetable du format ci-dessous : environ 234 Ko.

Mise à jour : le fichier est figé à la date de `retrieved`, comme toutes les visualisations du site. Relancer le script plus tard ajoute les nouveaux mois et fait passer des mois provisoires à définitifs ; le jour où SILSO publiera la fin du cycle 25 (minimum suivant), la table des cycles gagnera une ligne 26, que le script prend sans modification.

## Format de sortie

```json
{
  "attribution": "Source: WDC-SILSO, Royal Observatory of Belgium, Brussels, https://doi.org/10.24414/qnza-ac80. Licence: CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/). Retrieved 2026-09-24. Changes: monthly mean and 13-month smoothed series joined by month and converted to JSON, cycle table attached; cycle 25 maximum taken from the smoothed series; values unchanged.",
  "cycles": [
    {
      "number": 19,
      "firstMonth": "1954-04",
      "lastMonth": "1964-09",
      "complete": true,
      "minimumSmoothed": 5.1,
      "maximum": "1958-03",
      "maximumSmoothed": 285.0
    },
    {
      "number": 25,
      "firstMonth": "2019-12",
      "lastMonth": "2026-08",
      "complete": false,
      "minimumSmoothed": 1.8,
      "maximum": "2024-10",
      "maximumSmoothed": 160.9
    }
  ],
  "months": [
    { "month": "1749-01", "value": 96.7, "smoothed": null, "provisional": false },
    { "month": "1778-05", "value": 398.2, "smoothed": 264.3, "provisional": false },
    { "month": "1957-10", "value": 359.4, "smoothed": 282.5, "provisional": false },
    { "month": "2026-08", "value": 76.0, "smoothed": null, "provisional": true }
  ],
  "annotations": [
    {
      "id": "dalton-minimum",
      "cycles": [5, 6],
      "month": null,
      "labelFr": "Minimum de Dalton (cycles 5 et 6)",
      "labelEn": "Dalton Minimum (cycles 5 and 6)"
    },
    {
      "id": "record-month",
      "cycles": [3],
      "month": "1778-05",
      "labelFr": "Mai 1778 : record mensuel, 398,2",
      "labelEn": "May 1778: monthly record, 398.2"
    }
  ]
}
```

- `cycles` : de 0 à 25, dans l'ordre. `firstMonth`/`lastMonth` : mois couverts par le cycle dans `months` ; pour les cycles 1 à 25, `firstMonth` est le mois du minimum publié par SILSO. Cycle 0 : `firstMonth` = `1749-01`, `complete` faux, `minimumSmoothed`, `maximum` et `maximumSmoothed` à `null`.
- `months` : un objet par mois, dans l'ordre, sans trou. `value` : moyenne mensuelle ; `smoothed` : moyenne lissée sur 13 mois, `null` aux six premiers et six derniers mois ; `provisional` : valeur susceptible d'être révisée par SILSO.
- `annotations` : les repères éditoriaux de la visualisation (liste complète et libellés : voir "Repères annotés" dans `functional-specifications.md`). `cycles` : cycles concernés ; `month` : mois d'ancrage, `null` pour un repère qui désigne des cycles entiers. Portés par le fichier plutôt que par le dictionnaire i18n, comme les repères historiques de `grape-harvest-almanac` : ce sont des faits sur les données, ancrés à des mois précis, pas des textes d'interface.
- `attribution` : en anglais, langue de la source et de sa licence ; non traduite (voir "Contenu non traduit" dans `functional-specifications.md`).

## Contraintes de validation propres à cette visualisation

Vérifiées par le script de prétraitement, qui échoue plutôt que d'écrire un fichier incohérent :

- `months` est continu de `1749-01` au dernier mois disponible, sans doublon ni trou (3 332 mois à la récupération) ; aucune `value` n'est `null` ni négative.
- `smoothed` est `null` exactement aux six premiers et aux six derniers mois, et seulement là.
- Les mois `provisional` forment une suite finale continue (jamais un mois provisoire suivi d'un mois définitif).
- `cycles` est numéroté de 0 au dernier cycle sans trou ; leurs plages `firstMonth`-`lastMonth` se suivent sans chevauchement et couvrent exactement `months`.
- Chaque `maximum` tombe dans la plage de son cycle ; seul le dernier cycle et le cycle 0 ont `complete` faux.
- Chaque `annotations[].cycles` ne référence que des cycles existants ; chaque `month` non nul existe dans `months` et appartient à l'un des cycles référencés ; chaque `id` est unique.
