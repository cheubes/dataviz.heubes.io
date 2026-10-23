# Modèle de données : Les mondes découverts

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : spécifié, non implémenté.** Les chiffres ci-dessous ont été mesurés sur la source réelle le 2026-09-24 (requêtes TAP publiques), pas estimés.

## Dataset source

Deux jeux de données :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Planetary Systems Composite Parameters (PSCompPars) | NASA Exoplanet Archive (Caltech/IPAC, pour la NASA) | https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=PSCompPars | Non formalisée ; libre réutilisation avec mention de l'archive (voir note ci-dessous) | 2026-09-24 |
| Planetary Fact Sheet (rapports à la Terre) | NASA Space Science Data Coordinated Archive (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/planet_table_ratio.html | Contenu NASA, non soumis au droit d'auteur aux États-Unis, mention de la NASA demandée | 2026-09-24 |

**Note sur la licence de l'archive :** le NASA Exoplanet Archive ne publie pas de licence explicite (ni CC, ni mention domaine public) pour ses tables. Deux textes publics encadrent la réutilisation :

- la FAQ (`docs/faq.html`, question 14) : "all data contained in the archive have been published and can be used for additional research with the appropriate acknowledgements" ;
- la page de remerciements (`docs/acknowledge.html`), qui demande d'inclure dans tout support publié le texte suivant : "This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."

Aucun de ces textes ne restreint la redistribution de données dérivées. Le cas relève donc de la catégorie "sans licence formalisée mais autorisant la réutilisation avec citation" de la règle générale (voir "Téléchargement des données préparées" dans `functional-specifications.md` général). Le texte de remerciement ci-dessus est repris dans le bloc de crédit des sources (voir "Source des données" dans `technical-specifications.md`). Ce n'est pas une lecture juridique définitive : à confirmer avec l'utilisateur (voir "Points à valider" dans `technical-specifications.md`).

**Note sur le second jeu de données :** huit valeurs de référence (masse et demi-grand axe des planètes du Système solaire, voir "Repères du Système solaire" ci-dessous), relevées une fois sur la fiche NSSDCA (mise à jour du 18 mars 2025). Page officielle des médias NASA : "NASA content [...] generally are not subject to copyright in the United States", la NASA devant être citée comme source.

## Choix de la table

La table `pscomppars` (une ligne par planète confirmée, paramètres complétés à partir de plusieurs publications) plutôt que `ps` (une ligne par planète et par publication, 40 155 lignes mesurées) : la visualisation montre une population, un point par planète, sans arbitrer entre publications concurrentes. L'archive décrit elle-même `pscomppars` comme destinée à "enable a more statistical view of the known exoplanet population" (`docs/pscp_about.html`), au prix d'une cohérence interne non garantie ligne par ligne (paramètres issus de références différentes), sans incidence sur un nuage de population.

Critère d'inclusion de l'archive (`docs/exoplanet_criteria.html`) : masse ou masse minimale inférieure ou égale à 30 masses de Jupiter, résultats publiés dans une revue à comité de lecture. Les candidats non confirmés (TESS, Kepler) n'y figurent pas et ne sont pas repris.

## Accès

Service TAP synchrone, sans clé ni authentification :

```
https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=
  select pl_name, disc_year, disc_pubdate, discoverymethod, disc_facility,
         pl_orbsmax, pl_orbper, pl_bmasse, pl_bmassprov, st_mass
  from pscomppars
```

Réponse JSON (tableau d'objets), 6 366 lignes, environ 2 Mo. Le service est derrière Cloudflare : une requête filtrant sur une colonne de référence (qui contient du HTML) a été bloquée pendant les mesures ; les requêtes ci-dessus, sans filtre de ce type, passent.

## Champs utilisés

| Champ `pscomppars` | Unité | Usage |
|---|---|---|
| `pl_name` | | Nom de la planète, fiche de détail |
| `disc_year` | année | Position sur la chronologie simulée, agrégation de la vue tableau |
| `disc_pubdate` | `AAAA-MM` | Ordre des planètes à l'intérieur d'une même année (voir "Prétraitement"), pas stocké. Renseigné pour les 6 366 planètes, mais son année diffère de `disc_year` pour 1 158 d'entre elles : ce n'est pas une date de découverte fiable, seulement un critère de tri secondaire |
| `discoverymethod` | | Méthode de détection, regroupée en cinq familles (voir "Regroupement des méthodes") |
| `disc_facility` | | Instrument ou observatoire de découverte, fiche de détail |
| `pl_orbsmax` | unité astronomique (ua) | Axe horizontal : demi-grand axe de l'orbite, distance moyenne à l'étoile |
| `pl_orbper` | jours | Calcul du demi-grand axe quand `pl_orbsmax` manque (voir "Prétraitement") |
| `st_mass` | masses solaires | Idem |
| `pl_bmasse` | masses terrestres | Axe vertical : masse de la planète |
| `pl_bmassprov` | | Nature de la masse : mesurée, minimale ou estimée (voir "Nature des valeurs") |

`pl_rade` (rayon) et `sy_dist` (distance au Système solaire) ne sont pas repris : le rayon n'entre pas dans la forme retenue (voir "Forme retenue" dans `technical-specifications.md`), la distance n'est pas encodée.

## Mesures (2026-09-24)

- **6 366 planètes confirmées**, autour de 4 775 étoiles, découvertes de **1992 à 2026** (année 2026 partielle, arrêtée au 24 septembre). Les deux premières (PSR B1257+12 c et d, 1992) orbitent autour d'un pulsar ; 51 Peg b (1995) est la première autour d'une étoile semblable au Soleil.
- Par méthode : transit 4 708, vitesse radiale 1 200, microlentille gravitationnelle 289, imagerie directe 97, sept autres méthodes 72 au total (variations du temps de transit 29, variations du temps d'éclipse 17, modulation de luminosité orbitale 9, chronométrage de pulsar 8, astrométrie 6, variations du temps de pulsation 2, cinématique de disque 1).
- Par année (toutes méthodes) : moins de 100 par an jusqu'en 2010, 872 en 2014 et 1 504 en 2016, puis entre 150 et 564 par an. Les pics de 2014 et 2016 sont des validations en série du télescope Kepler (784 planètes Kepler en 2014, 1 276 en 2016, dont 1 277 planètes publiées en mai 2016 toutes méthodes confondues).
- Instruments les plus productifs : Kepler 2 787, TESS 936, K2 549.
- Coordonnées des familles dans le plan masse × demi-grand axe (médianes, planètes représentées) : transit 0,076 ua / 7 masses terrestres ; vitesse radiale 0,97 ua / 359 ; microlentille 2,35 ua / 190 ; imagerie directe 182 ua / 3 970. Quatre régions nettement distinctes, ce qui fonde la forme retenue (voir `technical-specifications.md`).
- Étendue : demi-grand axe de 0,0044 à 19 000 ua (1er et 99e centiles : 0,013 et 56 ua), masse de 0,02 à 9 535 masses terrestres (1er et 99e centiles : 0,40 et 6 547).
- Région d'une "jumelle de la Terre" (0,5 à 2 ua, 0,5 à 2 masses terrestres) : **deux planètes seulement**, toutes deux par microlentille (OGLE-2016-BLG-1195L b, OGLE-2013-BLG-0341L B b). 75 planètes entre 0,5 et 2 ua ont une masse de 10 masses terrestres ou moins.

## Nature des valeurs

`pscomppars` complète les valeurs absentes par calcul (`docs/pscp_calc.html`), ce qui a une incidence directe sur l'axe vertical :

| Nature de la masse (`massKind`) | `pl_bmassprov` source | Planètes |
|---|---|---|
| `measured` : masse mesurée | `Mass`, `Msin(i)/sin(i)` | 2 469 |
| `minimum` : masse minimale (inclinaison de l'orbite inconnue, surtout vitesse radiale) | `Msini` | 892 |
| `estimated` : estimée à partir du rayon par la relation masse-rayon de Chen et Kipping (2017) | `M-R relationship` | 2 974 (uniquement des transits, soit 63 % d'entre eux) |
| absente | | 31 |

Le demi-grand axe et la période, eux, ne sont jamais calculés par l'archive (la documentation de `pscomppars` ne liste que rayon, masse, densité, luminosité, température d'équilibre, flux et métriques spectroscopiques). Exclure les masses estimées retirerait près des deux tiers des transits, dont les vagues Kepler de 2014 et 2016 : elles sont conservées et signalées en fiche de détail (voir "Points à valider" dans `technical-specifications.md`).

## Regroupement des méthodes

Cinq familles, dans l'ordre décroissant des effectifs, qui fixe aussi l'ordre de la légende et des slots de couleur :

| `id` | Français | English | `discoverymethod` source | Planètes |
|---|---|---|---|---|
| `transit` | Transit | Transit | `Transit` | 4 708 |
| `radial-velocity` | Vitesse radiale | Radial velocity | `Radial Velocity` | 1 200 |
| `microlensing` | Microlentille | Microlensing | `Microlensing` | 289 |
| `imaging` | Imagerie directe | Direct imaging | `Imaging` | 97 |
| `other` | Autres méthodes | Other methods | Les sept autres valeurs | 72 |

Au-delà de cinq familles, les effectifs deviennent invisibles (29 planètes au plus) et la palette sortirait du régime lisible en nuage de points (voir "Palette" dans `technical-specifications.md`). Une valeur de `discoverymethod` inconnue au prochain rafraîchissement tombe dans `other` plutôt que de faire échouer le prétraitement.

## Repères du Système solaire

Huit planètes, valeurs relevées sur la fiche NSSDCA (rapports à la Terre) :

| `id` | Français | English | Demi-grand axe (ua) | Masse (masses terrestres) |
|---|---|---|---|---|
| `mercury` | Mercure | Mercury | 0,387 | 0,0553 |
| `venus` | Vénus | Venus | 0,723 | 0,815 |
| `earth` | Terre | Earth | 1 | 1 |
| `mars` | Mars | Mars | 1,52 | 0,107 |
| `jupiter` | Jupiter | Jupiter | 5,20 | 317,8 |
| `saturn` | Saturne | Saturn | 9,57 | 95,2 |
| `uranus` | Uranus | Uranus | 19,17 | 14,5 |
| `neptune` | Neptune | Neptune | 30,18 | 17,1 |

Pluton, planète naine, n'est pas reprise. Toutes les huit tombent dans le domaine des axes (voir "Axes" dans `technical-specifications.md`).

## Prétraitement (à réaliser à l'implémentation, hors build)

Un script de prétraitement, dans l'esprit de ceux des autres visualisations, rejoué manuellement et non committé (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) :

1. Interroger le service TAP (voir "Accès" ci-dessus), une seule requête.
2. Regrouper `discoverymethod` en cinq familles (voir "Regroupement des méthodes").
3. Demi-grand axe : reprendre `pl_orbsmax` (`axisKind: "measured"`). S'il manque et que `pl_orbper` et `st_mass` sont renseignés, le calculer par la troisième loi de Kepler, `a = (M★ × P²)^(1/3)` avec `a` en ua, `M★` en masses solaires et `P` en années (`pl_orbper / 365,25`), masse de la planète négligée (`axisKind: "derived"`). Concerne 422 planètes, surtout des découvertes récentes de TESS (123 des 277 planètes de 2026 n'ont pas de `pl_orbsmax`). Vérifié sur les 5 593 planètes qui ont les trois valeurs : écart relatif médian de 0,6 % avec le demi-grand axe publié, 5,3 % au 90e centile.
4. Masse : reprendre `pl_bmasse` et traduire `pl_bmassprov` en `massKind` (voir "Nature des valeurs").
5. Arrondir demi-grand axe et masse à trois chiffres significatifs.
6. Trier par `disc_year`, puis `disc_pubdate`, puis `pl_name`, et écrire `public/data/exoplanets/exoplanets.json`.

Résultat mesuré en simulant ce traitement sur la réponse réelle : **6 327 planètes représentables** (demi-grand axe et masse connus), **39 non représentables** (8 sans demi-grand axe ni moyen de le calculer, 31 sans masse). Ces 39 restent dans le fichier et dans les comptes (compteur, vue tableau), mais n'ont pas de point. Taille estimée du fichier : environ 1,1 Mo, du même ordre que `satellites-in-orbit/satellites.json` (892 Ko) : pas de compaction nécessaire.

## Format de sortie

```json
{
  "generatedAt": "2026-09-24",
  "methods": [
    { "id": "transit", "nameFr": "Transit", "nameEn": "Transit" },
    { "id": "radial-velocity", "nameFr": "Vitesse radiale", "nameEn": "Radial velocity" },
    { "id": "microlensing", "nameFr": "Microlentille", "nameEn": "Microlensing" },
    { "id": "imaging", "nameFr": "Imagerie directe", "nameEn": "Direct imaging" },
    { "id": "other", "nameFr": "Autres méthodes", "nameEn": "Other methods" }
  ],
  "solarSystem": [
    { "id": "earth", "nameFr": "Terre", "nameEn": "Earth", "semiMajorAxisAu": 1, "massEarth": 1 }
  ],
  "planets": [
    { "name": "51 Peg b", "year": 1995, "methodId": "radial-velocity", "facility": "Haute-Provence Observatory", "semiMajorAxisAu": 0.052, "axisKind": "measured", "massEarth": 194, "massKind": "minimum" }
  ]
}
```

Noms d'attributs en camelCase, comme les fichiers de données des autres visualisations (`regionId`, `launchDate` dans `satellites-in-orbit`). `methodId` et les `id` en kebab-case anglais. La couleur d'une famille n'est pas stockée : elle est assignée côté client par ordre d'apparition dans `methods` (voir "Palette" dans `technical-specifications.md`). `semiMajorAxisAu`/`axisKind` et `massEarth`/`massKind` valent `null` ensemble quand la valeur manque. `generatedAt` documente la date de récupération, reprise comme `retrieved` du dataset.

## Champs dérivés côté client (pas dans le JSON)

- **Année simulée intra-annuelle (`simYear`) :** les planètes d'une même année sont réparties uniformément sur `[année, année + 1)`, dans l'ordre du fichier, même mécanisme que `earthquakes` (voir "Animation" dans son `technical-specifications.md`). Évite que les 1 504 planètes de 2016 n'apparaissent sur une seule image.
- **Compteur :** nombre de planètes (représentables ou non) dont `year` est antérieure ou égale à l'année simulée, parmi les familles actives.

## Contraintes de validation propres à cette visualisation

- Chaque `methodId` de `planets` existe dans `methods`.
- `planets` est trié par `year` croissante (simplifie l'accumulation par curseur d'index, voir "Animation" dans `technical-specifications.md`).
- `semiMajorAxisAu` et `massEarth` sont strictement positifs quand ils sont renseignés (axes logarithmiques).
- `axisKind` est `null` si et seulement si `semiMajorAxisAu` est `null` ; idem pour `massKind` et `massEarth`.
- `solarSystem` contient exactement les huit planètes listées ci-dessus.
- Aucune planète n'est retirée silencieusement : le nombre de lignes de `planets` égale le nombre de lignes renvoyées par la requête TAP.
