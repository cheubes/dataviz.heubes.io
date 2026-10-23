# Spécification fonctionnelle : Le cœur battant du Soleil

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Le cœur battant du Soleil | Depuis 1749, les taches solaires battent au rythme d'un cycle d'environ onze ans : vingt-cinq pulsations enroulées en spirale, du minimum de Dalton au cycle 25 en cours. |
| EN | The Sun's Heartbeat | Since 1749, sunspots have pulsed to a cycle of about eleven years: twenty-five beats wound into a spiral, from the Dalton Minimum to the ongoing cycle 25. |

**Présentation longue FR :**
> Depuis 1749, des astronomes comptent les taches qui constellent la surface du Soleil. Mis bout à bout, ces comptages dessinent un pouls : le nombre de taches monte, culmine puis retombe presque à zéro, environ tous les onze ans. Vingt-cinq cycles se sont succédé depuis que Rudolf Wolf a commencé à les numéroter, et aucun ne ressemble tout à fait à un autre : certains durent neuf ans, d'autres près de quatorze. Au début du dix-neuvième siècle, pendant le minimum de Dalton, le Soleil a presque cessé de battre ; un siècle et demi plus tard, le cycle 19 a été le plus intense jamais mesuré. Enroulée en spirale, un tour par cycle, la série révèle aussi une règle discrète : plus un cycle est intense, plus il monte vite. Les nombres affichés sont ceux de la version 2.0 de la série, recalibrée en 2015 : ils sont nettement plus élevés que ceux de nombreuses sources antérieures.

**Présentation longue EN :**
> Since 1749, astronomers have counted the spots scattered across the surface of the Sun. Strung together, these counts trace a pulse: the number of spots rises, peaks, then falls back almost to zero, roughly every eleven years. Twenty-five cycles have followed one another since Rudolf Wolf began numbering them, and no two are quite alike: some last nine years, others nearly fourteen. In the early nineteenth century, during the Dalton Minimum, the Sun's heart almost stopped; a century and a half later, cycle 19 was the strongest ever recorded. Wound into a spiral, one turn per cycle, the series also reveals a quiet rule: the stronger a cycle, the faster it rises. The figures shown come from version 2.0 of the series, recalibrated in 2015: they are markedly higher than those found in many older sources.

Thème : `space` (voir "Thème" dans `data-model.md` général). Visualisations liées attendues : `satellites-in-orbit` et, si elle est publiée, `exoplanets` (spécifiée en parallèle, même thème unique).

## Objectif

Montrer, sur une spirale dont chaque tour est un cycle solaire, l'activité du Soleil mois par mois depuis 1749, pour rendre lisibles d'un coup d'œil l'irrégularité des cycles, le minimum de Dalton, les cycles records et la position du cycle 25 en cours.

## Forme retenue

**Une spirale, un tour par cycle, au pas variable.** Chaque tour va d'un minimum officiel (voir "Définition des cycles" dans `data-model.md`) au suivant, dans le sens horaire à partir de midi : tous les minima tombent à midi, et l'angle auquel culmine un tour dit la part du cycle passée à monter. L'écart entre deux tours dépend de l'intensité des cycles qu'il sépare : un cycle faible est un tour serré, un cycle intense un tour large, sans qu'aucun tracé ne déborde jamais sur le tour suivant (règle géométrique : voir "Géométrie de la spirale" dans `technical-specifications.md`).

Ce que la forme rend visible, mesuré sur les données (voir "Statistiques mesurées" dans `data-model.md`) :

- **Le minimum de Dalton :** deux tours consécutifs presque plats et serrés (cycles 5 et 6, maxima lissés de 82,0 et 81,2), au tiers intérieur de la spirale.
- **Les cycles records :** le tour le plus large est celui du cycle 19 (285,0) ; le pic le plus haut du tracé mensuel, celui de mai 1778 (cycle 3, 398,2).
- **L'effet Waldmeier :** les tours intenses culminent tôt (cycle 3 au tiers du tour, 35 mois de montée sur 111), les tours faibles tard (cycle 5 au-delà de la moitié, 82 mois sur 147). Corrélation de −0,75 entre montée et intensité sur les cycles 1 à 24 : c'est la règle discrète qu'annonce la présentation.
- **Le cycle 25 en cours :** le tour extérieur, inachevé, qui s'arrête au dernier mois disponible.

Alternatives écartées (à confirmer, voir "Points à valider" dans `technical-specifications.md`) :

- **Spirale à période fixe (un tour = 11 ans, idée de départ) :** les cycles durent de 108 à 163 mois ; à période fixe, les minima dérivent jusqu'à 85° d'un tour à l'autre, les pics errent sur le cadran et l'œil ne peut plus comparer deux cycles. La dérive raconte l'irrégularité des durées, mais celle-ci se lit aussi dans la forme retenue (graduations annuelles, voir "Contenu" ci-dessous) sans sacrifier la comparaison.
- **Pas constant :** avec 26 tours sur le rayon disponible, il faut choisir entre une amplitude écrasée (une dizaine de pixels pour tous les cycles) et des tracés qui se chevauchent sur deux ou trois tours autour des cycles intenses. Le pas variable fait de l'espace lui-même un encodage de l'intensité, comme des cernes de croissance.
- **Cycles superposés alignés sur leur minimum** (le graphique de référence des héliophysiciens) : comparaison précise des formes, mais il perd la chronologie (la succession des deux cycles faibles de Dalton, le battement dans le temps) et n'a rien d'une pièce originale. La vue tableau (voir ci-dessous) couvre la comparaison chiffrée.

## Contenu (zone de montage)

- **Bandeau de contrôles**, au-dessus de la spirale, toujours visible :
  - légende : bande pleine ("Moyenne lissée sur 13 mois" / "13-month smoothed mean"), trait fin ("Moyenne mensuelle" / "Monthly mean"), rappel de lecture ("Un tour = un cycle, d'un minimum au suivant" / "One turn = one cycle, from one minimum to the next") ;
  - sélecteur de cycle (liste déroulante, voir "Interactions") ;
  - bouton "Passer" / "Skip" pendant l'animation d'ouverture, "Rejouer" / "Replay" ensuite (voir "Interactions") ;
  - ligne de synthèse du cycle sélectionné, ou une invite quand aucun ne l'est (voir "Interactions"), sur une hauteur réservée pour ne pas décaler la spirale.
- **Spirale (SVG)**, carrée :
  - 26 tours : le cycle 0 partiel au centre (1749-1755, voir "Définition des cycles" dans `data-model.md`), puis les cycles 1 à 25 vers l'extérieur ;
  - pour chaque tour, une ligne de base fine (le zéro du nombre de taches), une bande pleine qui s'en écarte vers l'extérieur selon la moyenne lissée sur 13 mois, et un trait fin pour la moyenne mensuelle, plus irrégulier ;
  - un rayon pointillé à midi, libellé "Minimum" / "Minimum" ;
  - de petites graduations sur la ligne de base de chaque tour, une par 1er janvier, quand l'écart entre tours le permet : un cycle de neuf ans en compte neuf, un cycle de quatorze ans quatorze ; la durée réelle se lit ainsi malgré des tours tous ramenés à 360° ;
  - l'année de début de quelques cycles sur le rayon de midi (au minimum 1749, 1755 et l'année de début du cycle 25), les autres seulement quand l'écart entre tours laisse la place à une étiquette ;
  - la fin du cycle 25 : un point sur le dernier mois disponible, libellé avec ce mois ("août 2026" / "August 2026"), et le reste du tour en pointillé jusqu'à midi, car la date du prochain minimum n'est pas connue ;
  - les repères annotés (voir ci-dessous).
- **Infobulle** au survol ou au tap (voir "Interactions").

## Repères annotés

Quatre repères, toujours affichés, en étiquettes courtes reliées à la spirale par un trait fin. Données et ancrages : voir "Format de sortie" dans `data-model.md` (champ `annotations`).

| `id` | Ancrage | Libellé FR | Libellé EN |
|---|---|---|---|
| `dalton-minimum` | Cycles 5 et 6 | Minimum de Dalton (cycles 5 et 6) | Dalton Minimum (cycles 5 and 6) |
| `record-month` | Mai 1778, cycle 3 | Mai 1778 : record mensuel, 398,2 | May 1778: monthly record, 398.2 |
| `strongest-cycle` | Mars 1958, cycle 19 | Cycle 19, le plus intense : 285,0 | Cycle 19, the strongest: 285.0 |
| `current-cycle` | Dernier mois disponible, cycle 25 | Cycle 25, en cours | Cycle 25, ongoing |

Choisis pour couvrir l'arc demandé par l'angle éditorial (le cœur qui ralentit, les pics records, le présent) et rien de plus : la spirale est dense, chaque étiquette supplémentaire en masque une partie. Le cycle 24, le plus faible depuis plus d'un siècle, reste lisible par la sélection de cycle et le tableau, sans repère propre (voir "Points à valider" dans `technical-specifications.md`). L'ancrage de `current-cycle` est écrit par le script de prétraitement (dernier mois de la série), pas figé dans la spec.

## Interactions

- **Vue initiale : animation d'ouverture.** Le tracé s'enroule depuis le centre, de janvier 1749 au dernier mois disponible, à vitesse constante dans le temps (environ douze secondes au total, soit un battement par demi-seconde ; durée à confirmer, voir "Points à valider" dans `technical-specifications.md`). Les repères apparaissent en fondu quand le tracé atteint leur mois. Pendant l'animation, le bouton du bandeau lit "Passer" et affiche aussitôt la spirale complète ; l'infobulle est inactive. Choisir un cycle (liste ou clic sur un tour) termine aussi l'animation. À la fin, la spirale est complète, aucun cycle n'est sélectionné et le bouton devient "Rejouer".
  - **Écart à la règle "Lecture automatique"** (voir "Mouvement réduit" et "État partageable dans l'URL" dans le `functional-specifications.md` général), documenté ici comme elle le permet : il n'y a ni pause ni curseur temporel, et donc pas de position temporelle dans l'URL. C'est une introduction, pas une navigation dans le temps : l'image finale contient toute l'information, une image en pause ne montrerait qu'une spirale tronquée.
- **Survol / tap :** infobulle du mois le plus proche du pointeur. Contenu : mois et année, numéro du cycle ("Octobre 1957 · cycle 19" / "October 1957 · cycle 19"), moyenne mensuelle ("Moyenne mensuelle : 359,4" / "Monthly mean: 359.4"), moyenne lissée ("Lissée sur 13 mois : 282,5" / "13-month smoothed: 282.5", ligne absente pour les six premiers et six derniers mois de la série, qui n'en ont pas). Mention "provisoire" / "provisional" pour un mois provisoire (voir `data-model.md`). Pour un mois antérieur à 1818, une ligne de prudence : "Avant 1818 : observations éparses, reconstituées par Wolf" / "Before 1818: sparse observations, reconstructed by Wolf".
- **Sélection d'un cycle :** par clic ou tap sur un tour, ou par la liste déroulante "Cycle" ("Tous les cycles" par défaut, puis "Cycle 0 (1749-1755, partiel)", "Cycle 1 (1755-1766)" … "Cycle 25 (depuis 2019)"). Le tour sélectionné reste pleinement visible, les autres s'estompent en fondu d'opacité. La ligne de synthèse du bandeau donne :
  - cycles 1 à 24 : "Cycle 19 : avril 1954 → septembre 1964, 10,5 ans. Maximum en mars 1958 (285,0), atteint en 3,9 ans. 1er plus intense sur 25." ;
  - cycle 25 : "Cycle 25 : depuis décembre 2019, en cours. Maximum en octobre 2024 (160,9), atteint en 4,8 ans. 15e plus intense sur 25." ;
  - cycle 0 : "Cycle 0 (partiel) : janvier 1749 → janvier 1755, fin d'un cycle commencé avant la série, non numéroté par SILSO." ;
  - sans sélection, une invite : "Choisissez un cycle dans la liste, ou touchez un tour de la spirale." / "Pick a cycle from the list, or tap a turn of the spiral."

  Le rang compare les maxima lissés des cycles 1 à 25. Un nouveau clic sur le tour sélectionné, ou "Tous les cycles", retire la sélection.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : le cycle sélectionné est restauré. La visualisation s'ouvre alors directement sur la spirale complète, sans animation d'ouverture : le destinataire vient voir un cycle précis, l'animation le lui cacherait une douzaine de secondes. L'infobulle n'est pas capturée (voir "État dans l'URL" dans `technical-specifications.md`).
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : la visualisation s'ouvre sur son état final, la spirale complète, sans animation ; le bouton lit directement "Rejouer" et lance l'animation à la demande, qui se déroule alors normalement. Les fondus d'opacité de la sélection sont conservés : ils ne déplacent rien.

## Vue tableau

Voir "Vue tableau des données" dans le `functional-specifications.md` général.

- **Légende :** "Les 25 cycles solaires numérotés : dates et intensité (nombre de taches lissé sur 13 mois)" / "The 25 numbered solar cycles: dates and strength (13-month smoothed sunspot number)".
- **Lignes :** un cycle par ligne, du cycle 1 au cycle 25, dans l'ordre chronologique. Première cellule : "Cycle 1" … "Cycle 25". Le cycle 0 partiel n'y figure pas : il n'est pas numéroté par SILSO et n'a ni minimum ni maximum officiels.
- **Colonnes :**
  - **Début** : mois du minimum qui ouvre le cycle ("février 1755" / "February 1755") ;
  - **Maximum** : mois du maximum ("juin 1761") ;
  - **Nombre au maximum** : valeur lissée au maximum, une décimale ("144,1" / "144.1") ;
  - **Montée** : durée du minimum au maximum, en années à une décimale ("6,3 ans" / "6.3 yr") ;
  - **Durée** : durée du minimum au minimum suivant ("11,3 ans" / "11.3 yr"), "en cours" / "ongoing" pour le cycle 25.
- **Ligne de total :** "Moyenne des cycles complets" / "Average of complete cycles" (cycles 1 à 24 à la récupération) : nombre au maximum 178,7, montée 4,4 ans, durée 11,0 ans ; "n.d." / "n/a" pour les colonnes de dates. Elle donne le "cycle d'environ onze ans" du résumé en chiffres. Calculée sur les cycles marqués complets plutôt que sur une liste figée, pour rester juste quand un cycle 26 apparaîtra (voir "Prétraitement" dans `data-model.md`).
- **Non repris :** les 3 332 moyennes mensuelles et lissées, que le tableau ne peut pas résumer en une centaine de lignes ; elles restent dans le fichier téléchargeable (voir "Téléchargement" dans `technical-specifications.md`).

## États

- **Chargement :** le temps que le JSON soit récupéré et que la spirale soit calculée ; zone de montage carrée réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de spirale vide silencieuse.
- **Vide :** sans objet. Aucun filtre ne peut retirer de données : la sélection d'un cycle estompe les autres sans les masquer. Écart documenté à la règle des "États communs attendus" (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- La spirale se redimensionne en gardant son carré. Sous une largeur seuil (à définir à l'implémentation, de l'ordre de 480px), les repères passent à des libellés courts ("Dalton", "1778", "Cycle 19", "Cycle 25") et seules les années 1749 et de début du cycle 25 restent sur le rayon de midi.
- Tap sur la spirale pour l'infobulle plutôt que survol ; un second tap ailleurs la referme. Un tap sélectionne aussi le cycle touché, comme le clic sur desktop.
- Sur un écran de téléphone, les tours intérieurs ne sont espacés que de quelques pixels (les deux tours de Dalton surtout) : viser un tour précis au doigt y est difficile. La liste déroulante "Cycle" est le moyen fiable d'en choisir un ; c'est pour cela qu'elle double le clic sur tous les écrans.
- La ligne de synthèse passe sur plusieurs lignes ; sa hauteur réservée suit, pour que la spirale ne saute pas d'un cycle à l'autre.

## Accessibilité (limite connue)

L'interaction principale (spirale SVG, survol et tap des tours) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).

La sélection de cycle, elle, l'est : la liste déroulante est un `<select>` natif, et la ligne de synthèse est annoncée au lecteur d'écran à chaque changement. Les chiffres clés de chaque cycle sont donc accessibles sans passer par la spirale.

Repli : la vue tableau (voir "Vue tableau" ci-dessus) donne accès aux mêmes données, sous forme de synthèse, au clavier et au lecteur d'écran.

## Contenu non traduit

Les données sont numériques et n'ont rien à traduire ; les numéros de cycles suivent la numérotation internationale de Wolf, identique dans les deux langues. Seule la mention `attribution` du fichier de données (voir "Format de sortie" dans `data-model.md`) reste en anglais, langue de la source et de sa licence : elle n'est pas affichée sur la page (le bloc de crédit des sources s'en charge) et n'accompagne que le fichier téléchargé.
