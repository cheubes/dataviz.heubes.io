# Modèle de données : Le pouls du globe

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : implémenté.**

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Volcanoes of the World (VOTW) v. 5.4.0, catalogue des éruptions holocènes | Smithsonian Institution, Global Volcanism Program (compilé par E. Venzke) | https://volcano.si.edu | Usage non commercial avec citation (voir "Licence" ci-dessous) | 2026-09-22 |

## Licence

`volcano.si.edu` (pages HTML) bloque la récupération automatisée (protection anti-bot, confirmé à l'implémentation : requêtes directes en 403), empêchant un scraping du site public. En revanche, le web service officiel du GVP (`webservices.volcano.si.edu`, GeoServer WFS, voir "Récupération des données" ci-dessous) reste accessible sans blocage : c'est la voie retenue pour cette visualisation, pas de contournement du blocage anti-bot nécessaire.

Conditions d'utilisation vérifiées à l'implémentation (page `volcano.si.edu/gvp_termsofuse.cfm`, régie par les conditions générales de la Smithsonian Institution) : usage personnel, éducatif et autre usage non commercial explicitement autorisé ; citation de l'auteur et de la source requise, au minimum « Global Volcanism Program, Smithsonian Institution » avec lien vers `https://volcano.si.edu/`. Citation propre à la base de données (page `gvp_votw.cfm`) : « Global Volcanism Program, 2026. [Database] Volcanoes of the World (v. 5.4.0; 7 Aug 2026). Distributed by Smithsonian Institution, compiled by Venzke, E. ». `dataviz.heubes.io` étant un site non commercial (CC BY-NC-SA 4.0), l'usage est couvert par cette autorisation. Même traitement que `satellites-in-orbit` : ce n'est pas une lecture juridique définitive, mais une vérification suffisante pour un usage non commercial avec citation appropriée dans le bloc de crédit des sources (voir "Page de visualisation" dans `style-guide.md`).

Décision explicite de l'utilisateur (voir échanges de cadrage) : continuer avec le GVP, base de référence la plus complète et la plus citée sur le sujet, plutôt qu'une source alternative plus restreinte (NOAA NCEI, éruptions "significatives" avec dommages, écartée à ce stade).

## Récupération des données

Pas de scraping HTML : le GVP publie un service WFS (GeoServer) à `https://webservices.volcano.si.edu/geoserver/GVP-VOTW/wfs`, accessible sans blocage anti-bot, avec sortie GeoJSON directe (`outputFormat=application/json`). Deux couches utilisées :

- `GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes` (1 214 volcans holocènes récupérés à l'implémentation).
- `GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions` (11 089 éruptions holocènes récupérées à l'implémentation).

Requête type : `GetFeature&typeName=<couche>&outputFormat=application/json` (pagination par `count`/`startIndex` si besoin, non nécessaire ici vu le volume). Récupération ponctuelle au moment du prétraitement (voir "Source des données" dans `technical-specifications.md`), pas à chaque build.

## Angle retenu : pouls du globe

Décidé explicitement avec l'utilisateur (voir échanges de cadrage), pour se distinguer de `monument-layers` (accumulation chronologique à sens unique, un point apparaît une fois pour de bon) déjà présent sur le site : chaque volcan pulse à chacune de ses éruptions réelles au fil d'une lecture continue **en boucle** sur dix mille ans, pas une accumulation qui ne fait que grandir. Une éruption n'est pas un événement permanent comme la construction d'un monument : elle correspond à un instant, potentiellement répété plusieurs fois par volcan sur la période couverte.

## Biais de complétude du catalogue (à documenter dans l'interface)

**Point d'attention majeur, à ne pas laisser induire en erreur :** le catalogue GVP est nettement plus complet pour les derniers siècles (sources écrites, observation directe) que pour les millénaires les plus anciens (identification par preuves géologiques uniquement, tephrochronologie). L'augmentation visible de la fréquence des pulsations au fil de la lecture reflète donc en bonne partie une amélioration de la complétude documentaire, pas uniquement une réelle intensification du volcanisme mondial. À expliciter dans la présentation longue (voir `functional-specifications.md`), pas seulement dans les specs.

## Champs source utilisés

Couche `Smithsonian_VOTW_Holocene_Volcanoes` :

| Champ GVP | Usage |
|---|---|
| `Volcano_Number` | Identifiant stable et unique (`Volcano_Name` ne l'est pas : quatre doublons constatés sur les 1 214 volcans, ex. deux volcans nommés « Flores ») |
| `Volcano_Name` | Nom affiché (identification, fiche de détail) |
| `Country` | Localisation dans la fiche de détail (voir "Survol/tap d'un volcan" dans `functional-specifications.md`) ; renseigné à 100 % sur les 1 214 volcans |
| `Latitude`, `Longitude` | Position sur le planisphère |

Couche `Smithsonian_VOTW_Holocene_Eruptions` :

| Champ GVP | Usage |
|---|---|
| `Volcano_Number` | Référence vers le volcan |
| `StartDateYear` | Année de l'éruption, position sur la chronologie simulée (déjà une estimation ponctuelle retenue par le GVP, pas une fourchette à réduire soi-même) |
| `StartDateYearUncertainty`, `StartDateYearModifier` (`?`/`<`/`>`) | Incertitude de datation, affichée dans la fiche de détail uniquement (voir "Incertitude de datation" ci-dessous) |
| `ExplosivityIndexMax` | VEI (échelle 0-8), intensité/taille du pulse (voir "Rendu" dans `technical-specifications.md`) ; `null` pour 2 671 éruptions sur 11 089 (24 %, VEI non déterminé) |

**Incertitude de datation :** `StartDateYear` est déjà l'année retenue par le GVP (pas de fourchette à calculer), avec le cas échéant une incertitude en ± années (`StartDateYearUncertainty`, présente sur 2 047 éruptions, 18 %) et un modificateur de précision (`StartDateYearModifier` : `?` incertain, `<`/`>` avant/après cette date, 1 496 éruptions concernées). Traitement retenu : `StartDateYear` seul pour le positionnement sur la chronologie simulée, incertitude et modificateur affichés uniquement dans la fiche de détail (ex. « vers -6050 (± 1600 ans) », « avant 1500 »).

**VEI non déterminé (24 % des éruptions) :** traité comme un pulse minimal (équivalent VEI 0 dans l'échelle de taille/intensité), plutôt qu'exclu du jeu de données — exclure ces éruptions fausserait le volume réel du catalogue et le message sur son biais de complétude (voir "Biais de complétude" ci-dessus), qui est justement plus marqué sur les périodes anciennes les moins documentées.

**Éruptions antérieures à l'Holocène (-8000) :** 111 éruptions sur 11 089 (1 %) portent une `StartDateYear` antérieure à -8000, hors du cadrage "dix mille ans" de l'angle éditorial malgré leur classement dans la couche "Holocene_Eruptions" du GVP. Exclues du jeu de données généré (`StartDateYear >= -8000`).

**Volcans sans éruption datée dans le catalogue (27 %) :** 333 volcans sur 1 214 n'ont aucune éruption valide dans `eruptions.json`, la plupart faute d'entrée dans la couche `Holocene_Eruptions` (identifiés par indice géologique sans éruption individuellement datable, voir `Evidence_Category` du GVP). Conservés dans `volcanoes` (point de repos permanent affiché, voir "Volcans au repos" dans `technical-specifications.md`) mais ne pulsent jamais sur le cycle.

**Anomalie constatée, non corrigée à ce stade :** 41 éruptions sur 10 978 (vingt `Volcano_Number` distincts) référencent un volcan absent de la couche `Holocene_Volcanoes` récupérée — incohérence entre les deux couches WFS du GVP au moment de la récupération, pas un filtrage volontaire du prétraitement. Ces éruptions ne pulsent sur aucun volcan affiché (leur `volcanoId` ne correspond à rien dans `volcanoes`), ce qui viole la contrainte de validation ci-dessous ; portée réelle non investiguée (bug de récupération, ou volcans retirés du service depuis).

## Sélection des éruptions à annoter

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : les éruptions d'ampleur exceptionnelle (VEI élevé et/ou notoriété historique) sont annotées textuellement à l'écran au moment de leur pulse (voir "Interactions" dans `functional-specifications.md`). Critère retenu à l'implémentation : `VEI >= 6` complété par une liste de noms historiquement connus sous ce seuil (Vésuve 79, VEI 5 au maximum dans le catalogue, seul candidat pressenti hors seuil). 59 éruptions atteignent VEI ≥ 6 sur l'ensemble du catalogue Holocène, dont 5 antérieures à -8000 (exclues, voir "Éruptions antérieures à l'Holocène" ci-dessus) : 54 restent dans le jeu de données généré, plus Vésuve 79, soit **55 éruptions notables** au total. Les autres candidats pressentis au cadrage (Tambora 1812/VEI 7, Krakatau 1883/VEI 6, Pinatubo 1991/VEI 6, Santorini -1610/VEI 7) sont tous couverts par le seuil VEI ≥ 6, vérifiés présents dans le catalogue réel.

Note sur Tambora : le GVP date le début de cette éruption à 1812, pas 1815 comme pressenti au cadrage (1815 correspond à la phase paroxysmale, plus connue historiquement) ; `StartDateYear` du GVP fait foi pour le positionnement sur la chronologie, la présentation longue ne cite pas d'année précise pour cet exemple afin d'éviter la confusion.

**Libellé de l'annotation :** contrairement à `earthquakes` (sept séismes choisis à la main, chacun avec une phrase descriptive `nameFr`/`nameEn` rédigée individuellement, ex. « Le séisme de San Francisco »), le volume ici (60 éruptions notables sur des volcans en grande partie peu connus du public, ex. « Moekeshiwan [Lvinaya Past] », « Tao-Rusyr Caldera ») rend une phrase descriptive par éruption disproportionnée par rapport à la sélection par seuil objectif retenue. Le nom du volcan (`volcanoes[].name`, déjà identique dans les deux langues, voir "Contenu non traduit" dans `functional-specifications.md`) suffit à l'annotation « nom et année » demandée par `functional-specifications.md` ("Contenu") ; pas de champ `nameFr`/`nameEn` dupliqué sur l'éruption, l'annotation compose `${name} (${year})` au rendu à partir du volcan référencé.

## Format de sortie

```json
{
  "generatedAt": "2026-09-22",
  "volcanoes": [
    { "id": "211020", "name": "Vesuvius", "country": "Italy", "lat": 40.821, "lng": 14.426 }
  ],
  "eruptions": [
    { "volcanoId": "211020", "year": 79, "vei": 5, "yearUncertainty": null, "yearModifier": null, "notable": true }
  ]
}
```

`id`/`volcanoId` : `Volcano_Number` du GVP (identifiant stable et unique, voir "Champs source utilisés"), pas un slug du nom. `volcanoes` référencé par `volcanoId` depuis `eruptions` (position fixe, indépendante du temps, évite de répéter les coordonnées à chaque éruption d'un même volcan). `vei` : `null` si non déterminé, traité comme VEI 0 au rendu (voir "VEI non déterminé" ci-dessus). `notable` ne concerne que les éruptions retenues pour l'annotation (voir "Sélection des éruptions à annoter" ci-dessus, libellé composé au rendu depuis le nom du volcan) ; absent ou `false` pour les autres.

## Contraintes de validation propres à cette visualisation

- Chaque `volcanoId` référencé dans `eruptions` existe dans `volcanoes`.
- `eruptions` est trié par `year` croissant.
- `year >= -8000` pour chaque éruption (voir "Éruptions antérieures à l'Holocène" ci-dessus).
