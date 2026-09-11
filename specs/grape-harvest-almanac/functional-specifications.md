# Spécification fonctionnelle : L'almanach des vendanges

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | L'almanach des vendanges | Depuis 1354, la date des vendanges raconte l'histoire du climat en France : sécheresses extrêmes, étés sans fin, crises viticoles et records de précocité. |
| EN | The Grape Harvest Almanac | Since 1354, French grape harvest dates have traced the history of climate in France: extreme droughts, summers that never came, vineyard crises, and record-breaking early harvests. |

**Présentation longue FR :**
> Chaque année depuis le quatorzième siècle, des viticulteurs ont noté la date à laquelle ils vendangeaient. Mises bout à bout, ces dates composent l'une des plus longues séries climatiques directement observées au monde : six cent cinquante ans d'étés plus ou moins chauds, racontés depuis sept régions viticoles françaises. On y lit des sécheresses qui ont vidé les rivières, un été qui n'a jamais eu lieu, une crise qui a failli faire disparaître le vignoble, et des records de précocité tout récents.

**Présentation longue EN :**
> Every year since the fourteenth century, winegrowers have recorded the date they started picking grapes. Strung together, these dates form one of the longest directly observed climate series in the world: six hundred and fifty years of warmer or cooler summers, told through four French winegrowing regions. They record droughts that emptied rivers, a summer that never came, a crisis that nearly wiped out French vineyards, and very recent records for early harvests.

## Objectif

Montrer, sur une ligne temporelle continue, l'évolution des dates de vendanges dans sept régions viticoles françaises depuis 1354, et donner à lire quatre épisodes historiques qui l'expliquent.

## Contenu (zone de montage)

- Ligne temporelle horizontale (SVG), axe des années gradué (1354-2007) en abscisse ; jour de vendange en ordonnée, sans graduation affichée (valeur exacte lue via le survol/tap, voir "Interactions" ci-dessous).
- Une courbe fine par région (valeurs brutes annuelles) et une courbe plus marquée superposée (moyenne mobile sur vingt ans), sept régions au total.
- Quatre repères historiques sur l'axe des années (voir "Repères historiques" dans `data-model.md`) : trait vertical, cliquable/tap.
- Légende doublée d'un filtre par région (voir "Sélection des régions" ci-dessous).
- Tooltip contextuel au survol/tap d'une courbe.

## Interactions

- **Vue :** plage complète 1354-2007 toujours visible (pas de zoom ni de défilement), sept régions actives, courbes brutes et moyennes mobiles toutes affichées.
- **Survol / tap d'une courbe :** curseur vertical (crosshair) accroché à l'année la plus proche, tooltip listant, pour chaque région active ayant une donnée cette année-là, sa date de vendange exacte (ex. "Bourgogne : 22 octobre").
- **Sélection des régions :** sept cases à cocher (une par région), doublant la légende. Décocher une région masque ses deux courbes (brute et moyenne mobile). Les sept régions sont cochées par défaut.
- **Clic/tap sur un repère historique :** ouvre un panneau de détail (titre, description, voir "Repères historiques" dans `data-model.md`) ; un second tap ailleurs (mobile) ou un nouveau clic sur le repère (desktop, pour le refermer) le referme, même comportement que le tooltip de `flower-phenology`.

## États

- **Chargement :** le temps que le JSON de vendanges soit récupéré et que la ligne temporelle s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de ligne temporelle vide silencieuse.
- **Vide :** aucune région cochée (si le visiteur décoche tout) → message invitant à en cocher au moins une, plutôt qu'une ligne temporelle sans courbe sans explication.

## Responsive

Version tactile adaptée (voir "Responsive" dans `technical-specifications.md` général, appliquée ici) :

- Tap sur une courbe pour le curseur/tooltip plutôt que survol ; un second tap ailleurs le referme.
- Sélecteur de régions en puces défilantes horizontalement sous un certain seuil de largeur, plutôt qu'une rangée de cases à cocher qui prendrait trop de place à côté de la légende.

## Accessibilité (limite connue)

L'interaction principale (ligne temporelle SVG, survol/tap des courbes et des repères) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général).
