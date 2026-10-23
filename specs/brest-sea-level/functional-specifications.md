# Spécification fonctionnelle : La mer monte à Brest

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | La mer monte à Brest | Depuis 1807, le marégraphe de Brest mesure le niveau de la mer. Stable tout au long du dix-neuvième siècle, il a monté d'environ 24 cm depuis 1900, et deux fois et demie plus vite depuis 1993 qu'au vingtième siècle. |
| EN | The Sea Is Rising in Brest | Since 1807, the Brest tide gauge has recorded the level of the sea. Flat throughout the nineteenth century, it has risen by about 24 cm since 1900, two and a half times faster since 1993 than during the twentieth century. |

Chiffres : voir "Statistiques mesurées" dans `data-model.md` (+23,6 cm pour la moyenne 2014-2023 par rapport au niveau moyen du dix-neuvième siècle ; 1,3 mm/an sur 1900-1992 contre 3,2 mm/an sur 1993-2023). Dans le frontmatter et le corps de `brest-sea-level.fr.md`, les espaces avant ":" et ";" sont insécables (U+00A0, voir "Typographie" dans `style-guide.md`).

**Présentation longue FR (proposition) :**
> Au fond de la rade, sur un quai du port militaire, un marégraphe mesure la hauteur de la mer depuis 1807. C'est l'une des plus longues séries de mesures du niveau marin au monde : plus de deux siècles de moyennes annuelles, complétées au fil des ans à partir des archives par le Shom et l'université de La Rochelle, et rassemblées par le Permanent Service for Mean Sea Level (PSMSL), qui les ramène toutes à un même repère fixe.
>
> Pendant tout le dix-neuvième siècle, la mer ne bouge pas : d'une année à l'autre, elle monte ou descend de quelques centimètres, sans tendance. À partir du début du vingtième siècle, elle se met à monter, d'un peu plus d'un millimètre par an, puis de plus en plus vite : depuis 1993, elle gagne plus de trois millimètres par an. En moyenne sur la dernière décennie, elle se tient environ 24 cm plus haut qu'au dix-neuvième siècle.
>
> Le marégraphe mesure la mer par rapport au quai : si le sol s'enfonce, la mer semble monter d'autant. À Brest, ce mouvement du sol est faible : nul selon le nivellement historique, un enfoncement d'environ un millimètre par an selon des mesures de gravimétrie récentes. Il n'est pas retiré des chiffres présentés ici. La série a aussi ses trous : quelques années manquent au dix-neuvième siècle, et le bombardement de Brest en 1944 interrompt les mesures jusqu'en 1953. Aucune de ces lacunes n'est comblée.

**Présentation longue EN (proposition) :**
> At the far end of the roadstead, on a quay of the naval harbour, a tide gauge has been measuring the height of the sea since 1807. It is one of the longest sea-level records in the world: more than two centuries of annual means, gradually completed from the archives by Shom, the French navy's hydrographic and oceanographic service, and the University of La Rochelle, and gathered by the Permanent Service for Mean Sea Level (PSMSL), which refers them all to the same fixed benchmark.
>
> Throughout the nineteenth century, the sea does not move: from one year to the next it rises or falls by a few centimetres, with no trend. From the early twentieth century it starts to rise, by just over a millimetre a year, then faster and faster: since 1993 it has been gaining more than three millimetres a year. Averaged over the last decade, it stands about 24 cm higher than in the nineteenth century.
>
> The tide gauge measures the sea relative to the quay: if the ground sinks, the sea appears to rise by as much. In Brest this ground motion is small: none according to historical levelling, a sinking of about a millimetre a year according to recent gravity measurements. It is not removed from the figures shown here. The record also has holes: a few years are missing in the nineteenth century, and the bombing of Brest in 1944 interrupts the measurements until 1953. None of these gaps is filled in.

Le lieu exact du marégraphe ("sur un quai du port militaire") est à confirmer avant publication (voir "Points à valider" dans `technical-specifications.md`).

## Objectif

Faire voir, sur un seul panorama, que le niveau moyen de la mer à Brest est resté stable pendant tout le dix-neuvième siècle, qu'il monte depuis le début du vingtième, et que cette montée s'accélère depuis les années 1990.

## Composition

**Forme retenue : le quai déroulé.** Un mur de quai en pierre vu de face, étiré sur toute la largeur de la zone de montage : le temps court le long du quai, de 1807 à gauche à 2023 à droite, et la hauteur se lit sur les assises de pierre. Chaque année, l'eau vient battre le mur à son niveau moyen : la ligne d'eau dessine la série, l'eau remplit tout ce qui est en dessous. Au bout du quai, à droite, une échelle de marée graduée affiche le niveau de l'année choisie en grand.

**Écart à l'idée initiale** (une ligne d'eau unique qui monte le long d'un mur, animée) : une seule ligne d'eau qui monte montre le niveau, pas la vitesse. Or l'objet de la visualisation est l'accélération, qui ne se voit qu'en comparant des périodes entre elles : il faut donc que le temps s'étale à l'écran. Le quai déroulé garde l'image du mur et de l'eau (assises de pierre comme graduation, échelle de marée comme lecture), en montrant d'un coup d'œil deux siècles et leurs trois régimes. La montée "le long du mur" reste présente : elle se joue sur l'échelle de marée pendant la lecture (voir "Interactions").

**Écartées aussi :**
- Une courbe de vitesse glissante (pente sur 30 ans, année par année) : à une seule station, elle atteint déjà 3 mm/an vers 1915-1920 et vers 1950, et laisserait croire à des accélérations passées aussi fortes que l'actuelle (voir "Ce que la série ne permet pas d'affirmer" dans `data-model.md`).
- Des laisses de mer gravées année par année sur un mur vertical (une marque par année) : 187 traits empilés sur 36 cm de hauteur se confondent, et l'ordre chronologique disparaît.

## Contenu (zone de montage)

- **Le mur :** assises de pierre horizontales, une assise pour 5 cm de hauteur d'eau. Les joints entre assises servent de lignes de grille. Graduations gravées sur la pierre au bord gauche : "0" pour le niveau moyen du dix-neuvième siècle (voir "Niveau de référence" dans `data-model.md`), puis "+10 cm", "+20 cm", etc. La hauteur du mur couvre l'étendue réelle des données (de -7,2 cm en 1808 à +29,2 cm en 2023), avec une marge.
- **L'eau :** surface formée par la moyenne annuelle de chaque année renseignée, eau remplie en dessous jusqu'au pied du mur.
- **Les lacunes :** aucune eau sur les années sans mesure (voir "Couverture réelle" dans `data-model.md`), la pierre y reste sèche et une mention discrète "pas de mesure" s'affiche au-dessus des lacunes de plus de trois ans. La lacune 1944-1952 porte une mention propre : "1944-1952 : bombardement de Brest, pas de mesure" / "1944-1952: bombing of Brest, no measurements".
- **Les années 1807-1835 :** surface de l'eau en trait pointillé, pour signaler des niveaux de mi-marée corrigés et non des moyennes vraies (détail dans le tooltip).
- **Trois tendances gravées :** un trait droit par période (1807-1899, 1900-1992, 1993-2023), la droite de régression de la période, tracée par-dessus l'eau et la pierre (elle passe au milieu des moyennes annuelles, donc tantôt sous la surface, tantôt au-dessus), étiqueté de sa vitesse ("≈ 0 mm/an", "1,3 mm/an", "3,2 mm/an" / "≈ 0 mm/yr", "1.3 mm/yr", "3.2 mm/yr"). C'est la lecture directe de l'accélération.
- **L'échelle de marée :** au bout du quai, règle verticale graduée tous les centimètres et chiffrée tous les 10 cm, sur la même échelle verticale que le mur. L'eau y monte au niveau de l'année choisie. Au-dessus, en grand : l'année et l'écart ("2023 : +29,2 cm"), et en dessous la légende "par rapport au niveau moyen du dix-neuvième siècle".
- **Contrôles**, au-dessus du quai, jamais en surimpression : bouton de lecture ("Voir la mer monter" / "Watch the sea rise", puis Pause), curseur d'année.
- Tooltip au survol/tap du mur.

## Interactions

- **Vue initiale :** le quai entier, de 1807 à 2023, en pause. Toute l'eau est tracée, les trois tendances sont gravées, l'échelle de marée affiche 2023. Pas de lecture automatique au chargement : la vue complète est l'état le plus informatif, et une lecture automatique de quinze secondes cacherait l'accélération jusqu'à sa fin.
- **Lecture :** le bouton lance un passage unique de 1807 à 2023 (environ quinze secondes, pas de sélecteur de vitesse). L'eau se remplit de gauche à droite derrière une tête de lecture, l'échelle de marée monte et descend avec chaque année, et la tendance d'une période se grave quand la tête de lecture atteint la fin de cette période. En fin de passage, la visualisation reste sur la vue complète (pas de boucle). Lancée depuis la vue complète, la lecture repart de 1807 ; lancée après une pause en cours de route, elle reprend là où elle s'était arrêtée.
- **Pause :** fige la tête de lecture sur l'année courante.
- **Curseur d'année :** `<input type="range">` natif de 1807 à 2023, un cran par année. Le déplacer met la lecture en pause et place la tête de lecture sur l'année choisie : l'eau n'est tracée que jusqu'à cette année, l'échelle de marée affiche cette année, seules les tendances des périodes terminées sont gravées. Sur 2023, on retrouve la vue complète. Une année sans mesure reste sélectionnable : l'échelle de marée est alors sèche et affiche "1950 : pas de mesure".
- **Survol / tap du mur :** trait vertical accroché à l'année la plus proche, tooltip avec l'année, l'écart au niveau de référence en cm à une décimale, et la valeur en mm RLR entre parenthèses pour les curieux ; mentions supplémentaires quand elles s'appliquent : "niveau de mi-marée corrigé" (1807-1835), "année incomplète" (drapeau `Y`), "pas de mesure" (lacune). Le survol ne déplace pas la tête de lecture, et fonctionne aussi à droite de celle-ci, sur les années dont l'eau n'est pas encore tracée.
- **Pas de filtre, pas de zoom :** une seule série, entièrement visible.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : une année choisie (pause ou curseur) est restaurée, le quai s'ouvrant en pause sur cette année, eau tracée jusqu'à elle. Sans année dans le lien, la vue complète.
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : la vue d'ouverture est déjà l'état final, en pause ; rien ne change à l'ouverture. Le bouton de lecture reste disponible, et la lecture se déroule normalement une fois lancée. Rien d'autre à adapter : la tête de lecture avance par sauts d'une année et l'échelle de marée suit sans transition interpolée, avec ou sans la préférence (voir "Animation" dans `technical-specifications.md`).

## Vue tableau

Voir "Vue tableau des données" dans le `functional-specifications.md` général.

- **Légende :** "Niveau moyen de la mer à Brest par décennie, en cm par rapport au niveau moyen du dix-neuvième siècle (1807-1899)" / "Mean sea level in Brest by decade, in cm relative to the nineteenth-century mean (1807-1899)".
- **Lignes :** une décennie par ligne, de 1800 à 2020 (23 lignes), en ordre chronologique. Première cellule : la décennie ("1800-1809" ; "2020-2023" pour la dernière, incomplète).
- **Colonnes :** Années mesurées (nombre d'années renseignées dans la décennie, ex. "3" pour 1800-1809, qui commence en 1807) ; Niveau moyen (moyenne des écarts annuels, en cm à une décimale, signé : "-0,9", "+26,1") ; Année la plus basse (année et écart : "1808 (-7,2)") ; Année la plus haute (idem : "2023 (+29,2)").
- Les décennies à lacune gardent leur ligne, le nombre d'années mesurées disant la part manquante (ex. "4" pour 1940-1949). Aucune décennie n'est entièrement vide.
- **Pas de ligne de total :** une moyenne sur deux siècles effacerait la hausse, qui est l'objet de la visualisation. La hausse elle-même se lit en comparant la première et la dernière ligne.

## États

- **Chargement :** le temps que le JSON soit récupéré et que le quai s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON → message d'erreur, pas de mur vide silencieux.
- **Vide :** sans objet (une seule série, aucun filtre).

## Responsive

- Sur écran étroit, l'échelle de marée quitte le bout du quai : elle devient une lecture compacte au-dessus du mur (année et écart en grand, sans règle graduée), pour laisser toute la largeur aux deux siècles. Seuil à fixer à l'implémentation (voir "Responsive" dans `technical-specifications.md`).
- Graduations des années réduites aux siècles et demi-siècles (1850, 1900, 1950, 2000) sous un certain seuil de largeur.
- Étiquettes des tendances réduites à la vitesse seule, sans le libellé de période, si la place manque.
- Tap sur le mur pour le trait vertical et le tooltip plutôt que survol ; un second tap ailleurs les referme.
- Contrôles toujours au-dessus du quai, la ligne bouton + curseur passant sur deux lignes si besoin.

## Accessibilité (limite connue)

Le survol/tap du mur (tooltip par année) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le bouton de lecture et le curseur d'année restent accessibles au clavier (éléments `<button>`/`<input type="range">` standard), et le curseur, accompagné de la lecture de l'échelle de marée en texte, permet de parcourir les années au clavier.

Repli : la vue tableau (voir "Vue tableau" ci-dessus) donne accès aux mêmes données, sous forme de synthèse par décennie, au clavier et au lecteur d'écran.

## Contenu non traduit

Les noms des organismes et du jeu de données (Permanent Service for Mean Sea Level, "Tide Gauge Data", sigle RLR) et la citation demandée par le PSMSL restent tels que publiés par la source, en anglais dans les deux langues. Pas d'autre contenu non traduit : les mentions affichées dans le quai (lacunes, tendances, tooltip) sont des textes d'interface, dans le dictionnaire i18n.
