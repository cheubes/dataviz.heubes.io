# Spécification fonctionnelle : Ce qui nous tombe du ciel

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Statut : spécifié, non implémenté.** Plusieurs choix restent à confirmer (voir "Points à valider" dans `technical-specifications.md`).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Ce qui nous tombe du ciel | Plus de quarante-cinq mille météorites recensées : celles qu'on a vu tomber suivent les hommes, celles qu'on a trouvées au sol dessinent les glaces de l'Antarctique et les grands déserts. |
| EN | What Falls from the Sky | More than forty-five thousand recorded meteorites: those seen falling follow where people live, those found on the ground trace the Antarctic ice and the great deserts. |

Thèmes : `space` et `earth` (voir "Thème" dans `data-model.md` général). `space` pour l'objet lui-même, venu de l'espace ; `earth` parce que ce que la carte donne à lire est une géographie terrestre, celle des glaces, des déserts et du peuplement, plus proche de `earthquakes` ou `volcanic-eruptions` que de `satellites-in-orbit`. Effet sur les visualisations liées : voir "Points à valider" dans `technical-specifications.md`.

**Présentation longue FR (proposition) :**
> La Meteoritical Society recense chaque météorite reconnue par la communauté scientifique. Ce planisphère en montre plus de quarante-cinq mille, dans l'état du catalogue en 2013, chacune à l'endroit où elle a été ramassée, sa taille selon sa masse.
>
> Deux populations s'y opposent. Un peu plus d'un millier ont été vues tomber : un témoin a suivi leur chute, puis on les a récupérées. Elles se dispersent là où vivent les hommes, en Europe, en Inde, au Japon, dans l'est des États-Unis. Toutes les autres ont été trouvées au sol, parfois des milliers d'années après leur chute, et elles s'entassent ailleurs : sur les glaces de l'Antarctique, où l'écoulement du glacier les concentre au pied des montagnes et où une pierre sombre se repère de loin, et dans les déserts chauds, du Sahara à Oman, où l'air sec les conserve et où rien ne les cache. Depuis la découverte des premiers champs de glace à météorites, en 1969, ces campagnes de ramassage fournissent l'essentiel du catalogue.
>
> Les météorites tombent pourtant à peu près partout de la même façon. La carte ne montre donc pas où il en tombe, mais où l'on a pu les voir et les chercher. Et elle en oublie : près d'un tiers des météorites trouvées n'ont pas de position connue, dont des milliers de pierres sahariennes vendues sur les marchés sans lieu de découverte.

**Présentation longue EN (proposition) :**
> The Meteoritical Society records every meteorite recognized by the scientific community. This world map shows more than forty-five thousand of them, as the catalog stood in 2013, each one where it was picked up, sized by its mass.
>
> Two populations stand apart. Just over a thousand were seen falling: a witness followed their fall, and they were then recovered. They are scattered where people live, in Europe, India, Japan, the eastern United States. All the others were found on the ground, sometimes thousands of years after they fell, and they pile up elsewhere: on the Antarctic ice, where the flow of the glaciers gathers them at the foot of mountains and a dark stone stands out from afar, and in hot deserts, from the Sahara to Oman, where dry air preserves them and nothing hides them. Since the first meteorite-rich ice fields were discovered in 1969, these collecting campaigns have supplied most of the catalog.
>
> Yet meteorites fall more or less evenly everywhere. So the map does not show where they fall, but where people could see them and look for them. And it leaves some out: nearly a third of the meteorites found have no known location, among them thousands of Saharan stones sold at markets with no record of where they were found.

Chiffres et formulations des deux présentations à relire une fois le fichier de données produit (voir "Mesures" dans `data-model.md`).

## Objectif

Faire voir, sur un même planisphère, que la géographie des météorites connues est celle de leur découverte et non celle de leur chute : les chutes observées suivent la population humaine, les trouvailles suivent les terrains où une pierre se conserve et se repère (glaces antarctiques, déserts chauds). Le profil latitudinal rend ce contraste mesurable, malgré les empilements de points qui le cachent en partie sur la carte.

## Contenu (zone de montage)

- **Planisphère illustré** (silhouette terrestre mondiale, cours d'eau et relief, mêmes fichiers que `earthquakes` et `volcanic-eruptions`, voir "Techno carte" dans `technical-specifications.md`).
- **Un point par météorite positionnée** (31 963, voir "Positions" dans `data-model.md`) : couleur selon la population (vue tomber / trouvée), taille selon une classe de masse (moins de 100 g, 100 g à 10 kg, 10 kg à 1 t, 1 t et plus). Les chutes observées sont dessinées par-dessus les trouvailles. Aucune dispersion artificielle des points qui partagent une même position (voir "Empilements" ci-dessous).
- **Profil latitudinal**, à droite du planisphère : pour chaque bande de 10° de latitude, alignée sur la carte, deux barres en miroir, la part des chutes observées (vers la gauche) et la part des trouvailles (vers la droite) qui se trouvent dans cette bande. Des parts plutôt que des effectifs, pour comparer la forme des deux distributions malgré un rapport de 1 à 28 entre les deux populations.
- **Encart antarctique**, posé dans le Pacifique Sud, zone vide du planisphère : l'Antarctique vue du pôle Sud, avec les mêmes points. Le planisphère étire et écrase les hautes latitudes, là où se trouvent plus de 70 % des trouvailles positionnées.
- **Légende**, toujours visible : les deux populations (pastille de couleur, libellé, effectif total, ex. "Vues tomber : 1 107"), les quatre classes de taille.
- **Compteur des positions inconnues**, sous la légende : "13 752 météorites sans position connue, non représentées" / "13,752 meteorites with no known location, not shown", suivi de la part propre à la population affichée.
- **Bascule d'affichage** : Toutes / Vues tomber / Trouvées.
- **Boutons zoomer / dézoomer / réinitialiser**, en haut à droite du planisphère (mêmes contrôles que `earthquakes`).
- **Fiche de détail** au survol ou au tap.

### Empilements

Les campagnes antarctiques attribuent souvent une seule position à tout un champ de glace : jusqu'à 4 761 météorites sur le même point (voir "Concentration" dans `data-model.md`). Ces empilements ne sont ni dispersés ni agrégés en un symbole proportionnel : ce serait inventer des positions ou changer d'encodage d'une région à l'autre. Ils restent un point, et deux éléments rétablissent les effectifs : la fiche de détail, qui annonce le nombre de météorites au même endroit, et le profil latitudinal, qui compte tout.

## Interactions

- **Bascule d'affichage** (trois boutons radio) : "Toutes" (par défaut), "Vues tomber", "Trouvées". La population masquée s'efface en fondu d'opacité ; le profil latitudinal garde ses deux séries mais atténue celle qui est masquée sur la carte. Le compteur des positions inconnues suit la population affichée.
- **Survol / tap d'un point** : fiche de détail avec nom, classe (`recclass`), masse (formatée selon la langue, en g, kg ou t), et "Vue tomber en 1947" / "Trouvée en 1920" (ou "année inconnue"). Quand plusieurs météorites de la population affichée partagent la position survolée, la fiche annonce leur nombre ("4 761 météorites à cet emplacement"), leur répartition entre chutes et trouvailles s'il y a lieu, et détaille la plus massive.
- **Survol / tap d'une bande du profil** : effectifs et parts de chaque population dans la bande (ex. "70° S à 80° S : 0 vue tomber, 14 920 trouvées, 48 % des trouvailles positionnées").
- **Survol / tap de l'encart antarctique** : même fiche de détail que sur le planisphère. L'encart n'est ni zoomable ni déplaçable.
- **Zoom / pan** libre sur le planisphère (molette, geste tactile, boutons), utile pour séparer les points des déserts et des côtes. Les points gardent leur taille à l'écran quel que soit le niveau de zoom. Le profil latitudinal suit le zoom vertical, pour que ses bandes restent alignées sur les latitudes de la carte.
- **Vue initiale :** planisphère entier, les deux populations affichées, aucune lecture ni animation.
- **Lien partagé** (voir "État partageable dans l'URL" dans le `functional-specifications.md` général) : la bascule d'affichage et le cadrage sont restaurés (voir "État dans l'URL" dans `technical-specifications.md`).
- **Mouvement réduit** (voir "Mouvement réduit" dans le `functional-specifications.md` général) : la visualisation n'a pas de lecture automatique, elle s'ouvre donc dans son état normal. Le zoom par les boutons est immédiat au lieu d'être animé. Le fondu de la bascule d'affichage est conservé, puisqu'il ne déplace rien.

## Vue tableau

Voir "Vue tableau des données" dans le `functional-specifications.md` général.

- **Légende :** "Météorites vues tomber et trouvées, par bande de latitude" / "Meteorites seen falling and found, by latitude band".
- **Lignes :** une par bande de 10°, du nord au sud (de "80° N à 90° N" à "80° S à 90° S", 18 lignes), puis une ligne "Position inconnue" / "Unknown location".
- **Colonnes :** Vues tomber ; Trouvées ; Part des trouvailles positionnées (pourcentage de toutes les trouvailles positionnées que contient la bande, vide pour la ligne "Position inconnue") ; Plus massive (nom, masse, et "vue tomber" ou "trouvée").
- **Ligne de total :** toutes les météorites du fichier, positions inconnues comprises (1 107 vues tomber, 44 608 trouvées), avec la plus massive (Hoba, 60 t).
- Le tableau rend lisible ce que les empilements masquent sur la carte : les deux bandes antarctiques contiennent à elles seules 22 098 trouvailles, aucune chute observée.

## États

- **Chargement :** le temps que `meteorites.json` et le fond de carte soient récupérés et que la carte soit dessinée ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération du JSON ou du fond de carte, message d'erreur, pas de carte vide silencieuse.
- **Vide :** sans objet. Le catalogue est fixe et chaque état de la bascule affiche au moins une population.

## Responsive

- Pan / zoom au geste tactile, fiche de détail au tap, comme `earthquakes`.
- Sous 640 px de large : le profil latitudinal se réduit à ses barres, sans libellés de bande (effectifs et parts restent disponibles au tap) ; l'encart antarctique passe sous le planisphère au lieu de le recouvrir ; la légende et la bascule passent sur plusieurs lignes.
- Les contrôles (bascule, légende, compteur, boutons de zoom) restent toujours visibles, conformément à la règle générale.

## Accessibilité (limite connue)

L'interaction principale (survol des points sur un Canvas, zoom / pan, survol du profil) n'est pas nativement accessible au clavier ni au lecteur d'écran. La bascule d'affichage (boutons radio natifs) et les boutons de zoom restent accessibles au clavier.

Repli : la vue tableau (voir "Vue tableau" ci-dessus) donne accès aux mêmes données, sous forme de synthèse par bande de latitude, au clavier et au lecteur d'écran.

## Contenu non traduit

Les noms de météorites sont des noms officiels attribués par la Meteoritical Society, le plus souvent celui du lieu de découverte (ex. "Northwest Africa 7701", "Queen Alexandra Range 02100") : affichés tels quels dans les deux langues. La classe pétrologique (`recclass`, ex. `L6`, `Iron, IIIAB`, `Martian (shergottite)`) est une nomenclature scientifique de la source, elle aussi affichée sans traduction.
