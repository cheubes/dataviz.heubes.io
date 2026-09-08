# Modèle de données : Les routes de migration

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

Quatre jeux de données, un par espèce (voir "Sélection des études" ci-dessous) :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| LifeTrack White Stork Bavaria (2014-2023) | Movebank Data Repository | https://doi.org/10.5441/001/1.v1cs4nn0_2 | CC0 1.0 Universal | 2026-09-07 |
| Migratory connectivity and population specific migration routes in a long-distance migratory bird | Movebank Data Repository | https://doi.org/10.5441/001/1.tb272jc1 | CC0 1.0 Universal | 2026-09-08 |
| Flying on their own wings — young and adult cuckoos respond similarly to long-distance displacement during migration | Movebank Data Repository | https://doi.org/10.5441/001/1.vk36vq82 | CC0 1.0 Universal | 2026-09-08 |
| GPS tracking of honey buzzards in Finland | Movebank Data Repository | https://doi.org/10.5441/001/1.335 | Attribution-NonCommercial 4.0 International | 2026-09-08 |

Seul le jeu de la bondrée porte une restriction (usage non commercial) : exception validée explicitement par l'utilisateur (voir "Historique" ci-dessous), compatible avec la licence déjà non commerciale du site (CC BY-NC-SA, voir "Pied de page" dans `style-guide.md`) mais plus restrictive que les trois autres jeux (CC0). Affichée telle quelle dans le bloc de crédit des sources de la page (voir "Page de visualisation" dans `style-guide.md`), sans traitement particulier.

## Sélection des études (réalisée à l'implémentation)

Quatre espèces en v3 (une en v1, trois en v2, voir "Historique" ci-dessous) : cigogne blanche, busard cendré, coucou gris, bondrée apivore. Trouvées via la même méthode (recherche dans l'index du Movebank Data Repository, `datarepository.movebank.org/server/api/discover/search/objects`).

### Cigogne blanche (`white-stork`)

[LifeTrack White Stork Bavaria (2014-2023)](https://doi.org/10.5441/001/1.v1cs4nn0_2), Movebank Data Repository, licence CC0 1.0 Universal, menée par l'Institut Max Planck du comportement animal (Fiedler, Leppelsack, Leppelsack, Stahl, Wieding, Wikelski). Étude publique, accessible sans compte via l'API Movebank Data Repository (REST DSpace, `datarepository.movebank.org/server/api/...`), distincte de l'étude "vivante" homonyme sur movebank.org (celle-ci nécessite un compte). Balises GPS embarquées (eobs), fixes toutes les 5 minutes.

| `individualId` | Nom Movebank (anonymisé en sortie) | Portée sud atteinte |
|---|---|---|
| `CC_001` | Sophie + / DER AT898 (eobs 2664) | Afrique australe (-29,1°) |
| `CC_002` | Klippi / DER AU955 (e-obs 3018) | Sahel (10,7°N) |
| `CC_003` | Sepp + / DER AF369 (eobs 3949) | Sahel (11,5°N) |
| `CC_004` | Vitus + / DER AT886 (eobs2760) | Sahel (13,5°N) |

### Busard cendré (`montagus-harrier`)

[Trierweiler et al. (2014)](https://doi.org/10.5441/001/1.tb272jc1), *Migratory connectivity and population specific migration routes in a long-distance migratory bird*, Proc. R. Soc. B. Licence CC0. Étude riche (34 individus, plusieurs populations européennes, plusieurs années 2005-2011), balises **Argos Doppler à un seul satellite** (`sensor-type = argos-doppler-shift`), pas GPS comme les trois autres espèces.

**Anomalie découverte et corrigée après coup :** les premières trajectoires publiées pour cette espèce montraient des individus atteignant l'Afrique australe (jusqu'à -27,9°), rendant la carte spectaculaire mais fausse. Une positionnement Argos Doppler à un seul satellite est intrinsèquement ambigu : chaque mesure produit deux solutions possibles, symétriques de part et d'autre de la trace au sol du satellite (deux couples lat/lon distincts dans le fichier source, `location-lat/long` et `argos:lat2/lon2`). Le fichier source retient par défaut l'une des deux solutions, parfois la mauvaise : c'est ce qui plaçait certains points en plein océan Atlantique ou au Groenland, à des milliers de kilomètres d'un trajet plausible. Le filtrage par classe de qualité Argos (`argos:lc`, standard pour ce type de données) ne suffisait pas à lui seul : une mesure peut être d'excellente précision (classe 3, 2 ou 1) tout en ayant retenu la mauvaise des deux solutions. Corrigé en choisissant, pour chaque point, celle des deux solutions la plus proche du dernier point accepté (méthode standard de résolution de cette ambiguïté) ; voir "Prétraitement" ci-dessous.

**Conséquence :** la portée réelle de cette espèce dans ce jeu de données est bien plus modeste qu'annoncé au premier passage : aucun des individus retenus n'atteint le Sahara, la limite sud réelle se situe dans le Sahel/la savane soudanienne (10-16°N environ). Corrigé dans le texte éditorial et dans la table ci-dessous.

| `individualId` | Nom Movebank | Portée sud atteinte |
|---|---|---|
| `CP_001` | Klaus Dieter | Sahel (14,1°N) — printemps uniquement |
| `CP_002` | Jinthe | Sahel (15,7°N) — automne uniquement |
| `CP_003` | Mathilde | Sahel (10,9°N) |
| `CP_004` | Hanna Luise | Sahel (13,9°N) |
| `CP_006` | Iben | Sahel (14,6°N) — automne uniquement |
| `CP_008` | Tania | Sahel (11,5°N) — automne uniquement |
| `CP_009` | Jo | Golfe de Guinée (10,0°N) — printemps uniquement |
| `CP_010` | Michael | Sahel (13,6°N) — printemps uniquement |

(`CP_005` Dominik et `CP_007` Karen écartées : aucun de leurs legs ne passe le filtre de cohérence une fois l'ambiguïté Doppler résolue ; les identifiants ne sont pas réattribués, d'où le saut dans la numérotation.)

### Coucou gris (`common-cuckoo`)

[Thorup et al. (2020)](https://doi.org/10.5441/001/1.vk36vq82), *Flying on their own wings: young and adult cuckoos respond similarly to long-distance displacement during migration*, Scientific Reports. Licence CC0. Étude de déplacement expérimental (des coucous ont été capturés en migration et déplacés de 1 800 km avant relâcher) ; les deux individus retenus ici sont ceux dont les positions valides (`visible = true`) forment un trajet migratoire réel exploitable, pas les segments de déplacement expérimental eux-mêmes (non repris). Balises satellite Argos/GPS à très faible fréquence (quelques points par semaine, contre plusieurs par heure pour les deux autres espèces) : trajectoires nettement plus anguleuses une fois affichées, assumé comme tel plutôt que lissé artificiellement. Automne uniquement pour les deux individus : pas de retour printanier dans les données disponibles (tags qui cessent d'émettre, ou n'ont simplement pas été suivis assez longtemps).

| `individualId` | Nom Movebank | Portée sud/ouest atteinte |
|---|---|---|
| `CC2_001` | PB143376 | Afrique de l'Ouest (-9,7°), route en boucle vers l'ouest à travers le Sahel |
| `CC2_002` | PB143114 | Sahara/Sahel (18,0°N) |

### Bondrée apivore (`honey-buzzard`)

[Byholm, Mirski, Vansteelant (2025)](https://doi.org/10.5441/001/1.335), *GPS tracking of honey buzzards in Finland*, Movebank Data Repository, en lien avec une publication dans Animal Behaviour. **Licence Attribution-NonCommercial 4.0 International** (seule exception à CC0 parmi les jeux de cette visualisation, voir "Dataset source" et "Historique"). 28 individus, balises GPS (bonne fréquence, comparable à la cigogne).

Particularité biologique qui a demandé d'adapter le prétraitement : les bondrées de cette étude passent souvent 8 à 9 mois quasi immobiles sur leur site d'hivernage (parfois des positions quotidiennes identiques à la décimale près, un vrai site fidèle plutôt qu'une panne de balise, confirmé par la reprise de mouvement ensuite) et certaines ne repartent en migration de retour qu'au bout d'un an complet ("année sabbatique", comportement documenté chez cette espèce). La fenêtre fixe de 120 jours ne suffit pas à capturer ce retour ; voir "Prétraitement" ci-dessous pour l'adaptation apportée.

| `individualId` | Nom Movebank | Portée sud atteinte |
|---|---|---|
| `PA_001` | Jaana | Afrique australe (-17,8°) — automne et printemps |
| `PA_002` | Lars | Afrique de l'Ouest (-10,7°) — automne et printemps |
| `PA_003` | Senta | Afrique centrale (-5,6°) — automne uniquement |
| `PA_004` | Matti | Golfe de Guinée (4,4°N) — automne uniquement |
| `PA_005` | Venus | Golfe de Guinée (7,1°N) — automne uniquement |
| `PA_006` | Roosa | Golfe de Guinée (0,2°N) — automne uniquement |
| `PA_007` | Anni | Afrique de l'Ouest (-10,2°) — automne uniquement |
| `PA_008` | Mohammed | Afrique centrale (-6,9°) — automne uniquement |
| `PA_010` | Ulla | Golfe de Guinée (2,8°N) — automne uniquement |

(`PA_009` Edit écartée : ni son leg d'automne ni son leg de printemps ne passaient le filtre de cohérence.)

Préfixes d'anonymisation par espèce : `CC` (cigogne, *Ciconia Ciconia*), `CP` (busard, *Circus Pygargus*), `CC2` (coucou, distinct de `CC` malgré l'initiale identique), `PA` (bondrée, *Pernis Apivorus*).

## Historique

**v1 (une seule espèce) :** seule la cigogne blanche avait un jeu de données exploitable trouvé dans le temps disponible ; les autres candidates de l'époque (hirondelle, milan noir, balbuzard, pigeon ramier) n'en avaient pas (ex. le jeu "Black Kites at the Strait of Gibraltar", pourtant CC0, ne couvre que quelques jours autour du détroit, pas un trajet migratoire complet).

**v2 :** ajout du busard cendré et du coucou gris à la demande explicite de l'utilisateur, qui a listé cinq espèces candidates (balbuzard, tourterelle, busard, bondrée, coucou). Recherche refaite pour ces cinq :
- **Busard** → busard cendré (*Circus pygargus*), le plus documenté sur Movebank pour une migration Europe-Afrique complète : jeu trouvé, CC0, ajouté.
- **Coucou** → coucou gris (*Cuculus canorus*) : jeu trouvé, CC0, ajouté (voir limite de résolution ci-dessus).
- **Balbuzard** (*Pandion haliaetus*) : aucun jeu Europe-Afrique en accès libre trouvé dans le Movebank Data Repository ; les jeux CC0 disponibles pour cette espèce couvrent des populations nord-américaines (mauvaise géographie pour cette visualisation). Toujours absent.
- **Tourterelle** (*Streptopelia turtur*) : aucun résultat dans l'index du Movebank Data Repository ; les études de suivi existantes (ex. programme "TURTUR_VLAANDEREN") sont des études "vivantes" sur movebank.org nécessitant un compte, pas des jeux publiés en repository. Toujours absente.
- **Bondrée** (*Pernis apivorus*) : un jeu trouvé, mais sous licence Attribution-NonCommercial 4.0 ; laissée de côté à cette étape, en attente d'une décision explicite de l'utilisateur sur l'usage d'une licence NC.

**v3 :** l'utilisateur a validé l'usage de la licence CC BY-NC pour la bondrée (voir "Dataset source" ci-dessus) ; ajoutée.

**v4 (cette révision) :** en étendant le cadrage de la carte vers le nord (voir "Limite connue : cadrage nord" dans `technical-specifications.md`) pour de bon montrer les aires de reproduction des espèces ajoutées en v2, plusieurs trajectoires de busard cendré sont apparues comme des traits rectilignes aberrants traversant la carte de part en part. Diagnostic : des positions Argos Doppler mal résolues (voir "Busard cendré" ci-dessus), présentes dès la v2 mais peu visibles tant que le cadrage restreint les coupait hors champ. Corrigé à la source (voir "Prétraitement" ci-dessous) ; les portées sud du busard cendré documentées en v2 (jusqu'à -27,9°) étaient donc déjà fausses et sont corrigées ici.

Balbuzard et tourterelle restent absents de `tracks.json` faute de source adaptée ; les ajouter plus tard n'implique aucun changement de code (voir "Format de sortie").

## Schéma des données brutes (source Movebank)

Champs du fichier GPS de l'étude utilisés lors du prétraitement :

| Champ Movebank | Usage |
|---|---|
| `individual-local-identifier` | Identifiant individu (anonymisé en sortie, voir "Format de sortie") |
| `location-lat`, `location-long` | Position GPS |
| `timestamp` | Horodatage de la position |

## Prétraitement (réalisé à l'implémentation, hors build)

Un script ponctuel par espèce (non committé, à rejouer manuellement si les données ou la sélection d'individus changent), partageant la même logique de base :

1. Télécharger l'export GPS/Argos complet de l'étude (un seul fichier CSV pour tous les individus par étude ; ≈ 196 Mo pour la cigogne, ≈ 13 Mo pour le busard, ≈ 12 Mo pour la bondrée, ≈ 22 Ko pour le coucou).
2. Isoler les points des individus retenus, en ne gardant que les positions marquées valides (`visible = true` dans le CSV Movebank ; les jeux du busard, du coucou et de la bondrée en contiennent, contrairement à celui de la cigogne).
3. **Busard uniquement — résoudre l'ambiguïté Argos Doppler :** garder seulement les positions de classe de qualité 3, 2 ou 1 (`argos:lc`, les classes sans estimation d'erreur ou explicitement invalides sont écartées), puis, pour chaque position restante, choisir laquelle des deux solutions Doppler (`location-lat/long` ou `argos:lat2/lon2`) est la plus proche du dernier point accepté de l'individu (voir "Busard cendré" ci-dessus). Un filtre de vitesse implicite (rejeter un point si le déplacement impliqué dépasse 150 km/h *et* 1 500 km depuis le dernier point accepté) reste appliqué ensuite en filet de sécurité, mais ne déclenche plus sur ce jeu une fois l'ambiguïté résolue à la source.
4. Convertir chaque date en jour de l'année (1-365), en "dépliant" la séquence (+365 à chaque retour en arrière) pour obtenir un axe temporel continu par individu, indépendant de l'année calendaire réelle : nécessaire pour rejouer plusieurs oiseaux, suivis des années différentes, sur un même cycle simulé (voir "Cycle calendaire unique" dans `functional-specifications.md`).
5. Repérer le point de latitude minimale (le séjour hivernal) dans une fenêtre initiale (les ~250 à 430 premiers jours de l'individu selon l'espèce, pour ne pas confondre avec un hivernage d'une année suivante) ; découper en deux legs : `autumn` = 120 jours avant ce point, `spring` = à partir de ce point (voir étape suivante pour sa durée, variable selon l'espèce).
6. **Durée du leg de printemps, adaptée par espèce :** fenêtre fixe de 120 jours pour la cigogne et le busard (retour rapide, quelques semaines) ; pour la bondrée, fenêtre étendue de façon adaptative jusqu'à ce que l'individu revienne à moins de 15° de sa latitude de départ, plafonnée à 700 jours (retour parfois très tardif, voire différé d'une année complète, voir "Bondrée apivore" ci-dessus). Sans cette adaptation, aucun retour de bondrée n'était capturé par la fenêtre fixe de 120 jours utilisée pour les deux autres espèces.
7. **Filtre de cohérence** (ajouté pour le busard, étendu à la bondrée, dont plusieurs individus produisaient un découpage incohérent avec l'heuristique brute) : rejeter un leg `autumn` dont le mois d'arrivée n'est pas entre septembre et février ou dont la variation nette de latitude n'est pas d'au moins 15° vers le sud ; rejeter un leg `spring` qui n'atteint pas, dans sa fenêtre, une latitude à moins de 15° de la latitude de départ de l'individu. Un individu qui ne passe le filtre que sur une direction n'apparaît que pour celle-ci (voir tables par espèce ci-dessus).
8. Simplifier chaque leg (Douglas-Peucker, ligne brisée en lat/lng, sans dépendance ajoutée : implémenté directement dans le script de prétraitement) pour réduire le volume de points tout en conservant la forme générale du trajet. Non appliqué au coucou (déjà très peu de points par individu).
9. Anonymiser l'identifiant individu (`<préfixe-espèce>_<numéro séquentiel>`, voir préfixes ci-dessus), sans lien vers le nom Movebank d'origine dans les données publiées. Un individu dont aucun leg ne passe le filtre de cohérence (ex. `CP_005`, `CP_007`) n'apparaît pas dans la sortie, mais son numéro n'est pas réattribué à un autre individu.
10. Fusionner les quatre espèces dans un unique `public/data/bird-migrations/tracks.json` (200 Ko, 32 legs, 1935 points au total) et `public/data/bird-migrations/basemap.json` (silhouette terrestre mondiale, dérivée de Natural Earth via le paquet `world-atlas`, objet `land` uniquement, sans les frontières par pays : 90 Ko, inchangé).

**Limite connue du découpage automne/printemps :** l'heuristique (point de latitude minimale, filtre de cohérence à l'étape 6) suppose un trajet net dans une direction, dans un délai raisonnable même adapté par espèce. Des individus dont le comportement s'écarte de ça (hivernage long et stationnaire, mouvements erratiques en Afrique, retour au-delà de la fenêtre même étendue) sont rejetés par le filtre plutôt que mal étiquetés : plusieurs cigognes, busards et bondrées candidats ont été écartés pour cette raison (voir tables par espèce ci-dessus, individus non listés ou listés "automne uniquement"/"printemps uniquement").

## Format de sortie

```json
{
  "species": [
    { "id": "white-stork", "nameFr": "Cigogne blanche", "nameEn": "White Stork" },
    { "id": "montagus-harrier", "nameFr": "Busard cendré", "nameEn": "Montagu's Harrier" },
    { "id": "common-cuckoo", "nameFr": "Coucou gris", "nameEn": "Common Cuckoo" },
    { "id": "honey-buzzard", "nameFr": "Bondrée apivore", "nameEn": "European Honey Buzzard" }
  ],
  "tracks": [
    {
      "individualId": "CC_001",
      "speciesId": "white-stork",
      "direction": "autumn",
      "points": [
        { "lat": 48.5, "lng": 2.2, "date": "2015-10-11" },
        { "lat": 46.1, "lng": 1.8, "date": "2015-10-14" }
      ]
    }
  ]
}
```

`speciesId` en kebab-case anglais (voir conventions générales de `data-model.md`) ; la couleur de chaque espèce n'est pas stockée dans les données (voir palette dans `technical-specifications.md`), assignée côté client par ordre d'apparition dans `species`. Ajouter une espèce revient à ajouter une entrée dans `species` et ses `tracks` associés, sans changement de schéma.

## Champs dérivés côté client (pas dans le JSON)

- **Distance totale parcourue :** calculée à l'affichage à partir de la séquence de points (grand cercle entre points consécutifs), pas précalculée.
- **Durée de la migration :** différence entre la première et la dernière date de `points`.

## Contraintes de validation propres à cette visualisation

- Chaque `speciesId` référencé dans `tracks` existe dans `species`.
- Chaque trajectoire (`points`) est triée par `date` croissante.
- Un individu (`individualId`) n'apparaît qu'une fois par `direction` (une trajectoire d'automne et, si disponible, une de printemps, jamais deux trajectoires pour la même direction).
