# Modèle de données : L'almanach des vendanges

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

## Dataset source

| Champ | Valeur |
|---|---|
| `name` | Western Europe 650 Year Grape Harvest Date Database (Daux et al. 2012) |
| `publisher` | NOAA/NCEI (National Centers for Environmental Information), World Data Service for Paleoclimatology |
| `url` | https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=noaa-historical-13194 |
| `license` | Données publiques NOAA/NCEI (aucune restriction de réutilisation, garantie exclue), citation de l'article source requise : Daux, V., et al. 2012. *An open-access database of grape harvest dates for climate research: data description and quality assessment.* Climate of the Past, 8, 1403-1418. |
| `retrieved` | 2026-09-10 |

**Couverture temporelle du dataset complet :** 1354 à 2007 (654 ans), 27 séries régionales composites (22 en France, 5 hors de France : Allemagne, Luxembourg, Italie du Nord, Espagne, Suisse). Choix validé avec l'utilisateur : périmètre restreint à la France (voir "Régions retenues" ci-dessous), cohérent avec le titre de la visualisation.

## Régions retenues

Sept régions, choisies parmi les vingt-deux séries françaises pour leur ancienneté et leur continuité jusqu'à la fin du dataset (2007) : un repère historique récent (canicule de 2003, voir "Repères historiques" ci-dessous) doit pouvoir s'appuyer sur chaque courbe affichée, pas seulement certaines d'entre elles. Deux régions pourtant citées comme "parmi les plus complètes" par l'article source, Jura et Ile-de-France, ont été écartées à la vérification empirique du dataset réel : leurs séries s'arrêtent respectivement en 1977 et 1978, sans aucune donnée sur les trois dernières décennies. Bordeaux, Alsace et Champagne (série "Champagne 2" du dataset, la plus complète des deux séries Champagne) ont été ajoutées après coup, sur le même critère.

| Région | `id` | Début | Fin | Années renseignées | Complétude |
|---|---|---|---|---|---|
| Bourgogne | `burgundy` | 1354 | 2006 | 604 | 92 % |
| Vallée du Rhône (sud) | `southern-rhone-valley` | 1434 | 2007 | 451 | 79 % |
| Bordeaux | `bordeaux` | 1449 | 2006 | 327 | 59 % |
| Languedoc | `languedoc` | 1525 | 2007 | 288 | 60 % |
| Alsace | `alsace` | 1700 | 2005 | 262 | 86 % |
| Basse vallée de la Loire | `lower-loire-valley` | 1802 | 2007 | 203 | 99 % |
| Champagne | `champagne` | 1806 | 2006 | 183 | 91 % |

Complétude = nombre d'années avec une valeur / nombre d'années entre le premier et le dernier point de la série (ratio propre à chaque série, pas à la plage globale 1354-2007).

## Schéma des données brutes (source NOAA)

Fichier texte à largeur de colonnes fixe (`europe2012ghd.txt`), trois blocs de neuf régions ("part 1 of 3", "part 2 of 3", "part 3 of 3"), une ligne par année de 1354 à 2007, une colonne par région. Une valeur est le nombre de jours après le 31 août (peut être négatif, ex. `-10.0` = 21 août), une case vide signifie l'absence de donnée cette année-là pour cette région.

**Piège de parsing rencontré à la vérification (à éviter au prétraitement) :** les valeurs sont alignées à droite dans leur colonne, la largeur de chaque colonne se déduisant de la position de **fin** de l'abréviation de la région dans la ligne d'en-tête (ex. `Bur` à `...Bur|`), pas de sa position de **début**. Une extraction naïve basée sur la position de début de chaque libellé tronque les valeurs à deux chiffres (`51.5` devient `1.5`), avec un résultat qui reste un nombre valide et ne se détecte donc pas à une simple vérification de présence/absence : seule une vérification de valeurs connues (ex. 1816 en Bourgogne, un retard de vendanges documenté par ailleurs) révèle l'erreur. Par ailleurs, les blocs "part 2" et "part 3" portent une ligne parasite juste sous l'en-tête, à l'année 1354 : les abréviations de colonnes elles-mêmes (`Ger`, `HLV`, `IdF`...) plutôt qu'une valeur, à ignorer explicitement (seule la Bourgogne, dans "part 1", a une vraie donnée en 1354).

## Repères historiques

Quatre repères, choisis avec l'utilisateur pour couvrir un arc éditorial complet (extrême précoce ancien, extrême tardif, période où la donnée elle-même se dégrade, extrême précoce moderne) plutôt que la seule dérive climatique récente (déjà traitée par `flower-phenology` et `light-pollution`). Valeurs vérifiées contre les séries réellement retenues.

| `id` | Année(s) | Événement | Bourgogne | Rhône (sud) | Bordeaux | Languedoc | Alsace | Basse Loire | Champagne |
|---|---|---|---|---|---|---|---|---|---|
| `drought-1540` | 1540 | Méga-sécheresse européenne de 1540, la plus sévère connue par sources documentaires sur cinq siècles | 3 septembre | — | — | — | — | — | — |
| `year-without-summer-1816` | 1816 | "Année sans été" : éruption du Tambora (1815), étés froids et pluvieux en Europe | 22 octobre | 27 septembre | 27 octobre | — | 24 octobre | 11 octobre | — |
| `phylloxera-crisis` | 1863-1900 | Crise du phylloxéra : le vignoble français est détruit puis reconstitué sur porte-greffes américains ; l'article source signale une dégradation de la fiabilité des séries GHD sur cette période | — (repère de contexte, pas un pic) | | | | | | |
| `heatwave-2003` | 2003 | Canicule d'août 2003 : vendanges parmi les plus précoces jamais enregistrées | 21 août | 11 septembre | 27 août | 21 septembre | 8 septembre | 4 octobre | 27 août |

`drought-1540` ne rattache que la Bourgogne, seule série ayant une donnée cette année-là (voir `regions` dans le format de sortie ci-dessous). `year-without-summer-1816` ne rattache pas le Languedoc ni la Champagne, sans donnée cette année-là (série Champagne commencée en 1806, avec une lacune dès 1816). `phylloxera-crisis` n'ancre aucun pic précis sur une courbe : il se lit comme une période (bande verticale plutôt qu'un marqueur ponctuel, voir "Repères historiques" dans `technical-specifications.md`).

## Prétraitement (script hors-build, exécuté à l'implémentation)

Script Node ponctuel (non commité, cohérent avec `bird-migrations` et `flower-phenology`), à partir du fichier texte NOAA téléchargé une fois (`europe2012ghd.txt`).

1. Parser les trois blocs à largeur fixe en respectant la règle d'alignement à droite décrite ci-dessus (fin de colonne = fin du libellé d'en-tête), en ignorant la ligne parasite d'abréviations à l'année 1354 des blocs 2 et 3.
2. Ne conserver que les sept régions retenues (voir "Régions retenues").
3. Pour chaque région, calculer une moyenne mobile centrée sur une fenêtre de vingt ans (dix ans avant, dix ans après l'année considérée) : fenêtre réduite en bord de série (première et dernière décennie), valeur calculée seulement si au moins la moitié des années couvertes par la fenêtre effective ont une donnée brute, sinon `null` (pas d'interpolation qui inventerait une tendance à partir de trop peu de points). Fenêtre choisie comme compromis entre lissage du bruit interannuel réel (écart type d'environ dix jours d'une année à l'autre sur la série Bourgogne) et réactivité conservée sur des séries qui comptent des lacunes, notamment le Languedoc (60 % de complétude).
4. Sortie : `public/data/grape-harvest-almanac/harvest-dates.json`.

## Format de sortie

```json
{
  "regions": [
    {
      "id": "burgundy",
      "nameFr": "Bourgogne",
      "nameEn": "Burgundy",
      "colorSlot": 1,
      "startYear": 1354,
      "endYear": 2006,
      "series": [
        { "year": 1354, "dayOffset": 15.3, "smoothedDayOffset": null },
        { "year": 1355, "dayOffset": 13.4, "smoothedDayOffset": null },
        { "year": 1816, "dayOffset": 51.5, "smoothedDayOffset": 34.8 }
      ]
    }
  ],
  "events": [
    {
      "id": "drought-1540",
      "year": 1540,
      "yearEnd": null,
      "titleFr": "La méga-sécheresse de 1540",
      "titleEn": "The 1540 megadrought",
      "descriptionFr": "La sécheresse la plus sévère connue en Europe par sources documentaires sur cinq siècles : rivières à sec, récoltes calcinées, vendanges parmi les plus précoces de toute la série.",
      "descriptionEn": "The most severe drought documented in Europe over five centuries: dry rivers, scorched harvests, one of the earliest grape harvests in the entire series.",
      "regions": ["burgundy"]
    }
  ]
}
```

`dayOffset`, `smoothedDayOffset` : jours après le 31 août (peut être négatif). `smoothedDayOffset` est `null` pour une année sans moyenne mobile calculable (voir "Prétraitement" ci-dessus), `dayOffset` est absent de `series` pour une année sans donnée brute (pas d'entrée plutôt qu'une valeur `null`, pour ne pas alourdir un fichier qui couvre potentiellement 654 ans par région).

## Contraintes de validation propres à cette visualisation

- Chaque région déclare `startYear`/`endYear` cohérents avec la première et la dernière année présentes dans `series`.
- `colorSlot` est unique parmi les sept régions (voir "Palette" dans `technical-specifications.md`).
- Chaque `id` d'`events` est unique ; `regions` ne référence que des `id` présents dans `regions` (tableau vide autorisé pour un repère de contexte comme `phylloxera-crisis`, voir "Repères historiques" ci-dessus).
