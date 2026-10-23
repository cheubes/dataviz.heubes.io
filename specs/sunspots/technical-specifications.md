# Spécifications techniques : Le cœur battant du Soleil

Complète `technical-specifications.md` général : choix techniques propres à cette visualisation, au-delà des règles communes.

## Rendu

D3 v7 : `d3-shape` (`lineRadial` pour les lignes de base et le trait mensuel, `areaRadial` pour la bande lissée), `d3-scale` (échelle linéaire du nombre de taches vers les pixels), `d3-timer` (animation d'ouverture). Interactions (liste déroulante, survol, tap, bouton) en JS natif (`addEventListener`), sans `d3-selection` ni `d3-transition`, comme `grape-harvest-almanac`. Rendu SVG : 3 332 mois, soit trois tracés de quelques milliers de points (ligne de base, bande, trait mensuel), sans enjeu de performance justifiant Canvas.

Pas de carte, pas de TopoJSON.

## Géométrie de la spirale

Notations : pour chaque cycle c (0 à 25), L_c son nombre de mois, P_c le maximum de sa série lissée (valeurs non nulles seulement), k l'échelle du nombre de taches en pixels, g un écart fixe entre tours (de l'ordre de 2px).

- **Angle :** le mois d'indice j dans son cycle (j = 0 au minimum) est placé à θ = 2π · j / L_c, dans le sens horaire depuis midi. Chaque tour fait exactement 360°, quelle que soit la durée du cycle (voir "Forme retenue" dans `functional-specifications.md`).
  - **Cycles incomplets :** le cycle 25 (en cours) et le cycle 0 (commencé avant la série) n'ont pas de durée connue. On leur applique la durée moyenne des cycles complets (132,4 mois à la récupération, calculée depuis les données, pas codée en dur). Le cycle 0 est calé pour finir à midi : ses 73 mois occupent la fin de son tour, à partir d'environ 160°. Le cycle 25 commence à midi ; ses 81 mois en couvrent environ 220°, le reste du tour est tracé en pointillé (voir "Contenu" dans `functional-specifications.md`).
- **Ligne de base :** son rayon croît linéairement le long de chaque tour, de R_c à midi au début du cycle jusqu'à R_c+1 à la fin : une vraie spirale, continue d'un tour au suivant. R_0 est un petit rayon intérieur (de l'ordre de 6 % du rayon disponible).
- **Pas variable :** R_c+1 − R_c = k · max(P_c−1, P_c) + g, avec P_−1 = 0. Le pas d'un tour couvre donc l'intensité du cycle qu'il porte et celle du précédent.
- **Tracé :** au mois de valeur v, le point est au rayon base(θ) + k · v, vers l'extérieur.
- **Garantie de non-chevauchement** de la bande lissée : à la fraction f du tour, l'écart entre la ligne de base du tour c+1 et celle du tour c vaut (1 − f) · (R_c+1 − R_c) + f · (R_c+2 − R_c+1), combinaison de deux pas tous deux supérieurs ou égaux à k · P_c. Il reste donc toujours au moins k · P_c entre les deux lignes de base, assez pour la bande du cycle c. C'est pour cela que chaque pas prend le maximum de deux cycles et non l'intensité d'un seul : un pas calé sur le seul cycle suivant laisserait un cycle intense déborder sur un cycle faible (cycle 4, 235,3, suivi du cycle 5, 82,0).
- **Le trait mensuel peut déborder :** les moyennes mensuelles dépassent la moyenne lissée (jusqu'à 134 de plus en mai 1778). Réserver leur pic élargirait tous les pas d'environ un tiers, au détriment de l'amplitude. Ce trait fin et translucide peut donc mordre de quelques pixels sur l'écart avec le tour suivant ; la bande, qui porte la lecture, ne déborde jamais.
- **Échelle k :** déduite du rayon disponible R_max (demi-côté de la zone de montage, moins une marge pour les étiquettes) : k = (R_max − R_0 − 26 · g) / (Σ max(P_c−1, P_c) + P_25). À la récupération, la somme du dénominateur vaut environ 5 460 (unités du nombre de taches). Avec un rayon disponible de 400px (zone de montage d'environ 900px de côté, possible sur un écran de bureau), k vaut environ 0,06 px par unité : bande du cycle 19 d'environ 17px, tours de Dalton d'environ 5px. Sur un téléphone (rayon disponible d'environ 160px), ces valeurs tombent à 5px et 1,5px : limite assumée, documentée dans "Responsive" de `functional-specifications.md`.
- **Survol et tap :** le mois retenu est celui dont le segment radial (de la ligne de base au tracé lissé) passe au plus près du pointeur, par une recherche exhaustive sur les 3 332 mois à chaque déplacement (coût négligeable ; pas de `d3-quadtree`). Au-delà d'une tolérance (de l'ordre de 12px à la souris, 20px au doigt), pas d'infobulle. Le clic ou le tap sélectionne le cycle de ce mois.

## Zone de montage : ratio 1:1 (exception documentée)

`aspect-ratio: 1 / 1`, pas le calcul `largeur × 0,6` de la hauteur par défaut (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) : une spirale exige un carré, même raisonnement que `flower-phenology`. Le plafond commun s'applique de la même façon : c'est la largeur du carré qui est bridée pour que le carré et le bandeau de contrôles tiennent entre l'en-tête et le pied de page.

À la différence de `flower-phenology`, pas de `max-width: 640px` fixe en plus de ce plafond : l'amplitude lisible dépend directement du rayon (voir "Échelle k" ci-dessus), et chaque pixel gagné sur un grand écran profite aux tours serrés.

## Animation d'ouverture

- Pilotée par `d3-timer` : à chaque image, l'indice du dernier mois affiché est proportionnel au temps écoulé (vitesse constante dans le temps, pas le long du tracé : les tours extérieurs, plus longs, ne ralentissent pas la lecture). La bande, le trait mensuel et les lignes de base sont tracés jusqu'à cet indice.
- Durée totale : environ douze secondes (voir "Points à valider").
- Les étiquettes des repères apparaissent en fondu d'opacité quand le tracé atteint leur mois (le dernier mois pour `current-cycle`, le premier mois du cycle 5 pour `dalton-minimum`).
- "Passer", la sélection d'un cycle ou la restauration d'un cycle depuis l'URL arrêtent le timer et dessinent l'état final directement.
- Mouvement réduit : `prefersReducedMotion()` (`src/scripts/reduced-motion.ts`) lu une fois au montage ; s'il est actif, l'état final est dessiné sans démarrer le timer, et "Rejouer" reste disponible (voir "Interactions" dans `functional-specifications.md`).

## Palette

Palette officielle du site (voir "Palette dataviz" dans `style-guide.md`), pas d'exception : une seule série, en **orange, slot 2 (`#eb6834`)**.

- **Pourquoi l'orange :** une seule série, aucune catégorie à distinguer ; l'orange évoque le Soleil sans couleur hors charte. Le bleu du slot 1 reste celui des liens et des éléments interactifs (`--dv-accent`), qu'il vaut mieux ne pas confondre avec la donnée sur une page où l'on clique sur la spirale. Le jaune du slot 4, plus solaire encore, n'atteint pas 3:1 sur fond blanc en trait fin (voir `style-guide.md`).
- **Contraste mesuré** (formule de luminance WCAG) : `#eb6834` sur `--dv-surface` (`#ffffff`) = 3,2:1, au-dessus du seuil de 3:1 des éléments graphiques.

| Élément | Couleur |
|---|---|
| Bande lissée | `#eb6834`, remplissage translucide, bord extérieur plein (porte le contraste de 3,2:1) |
| Trait mensuel | `#eb6834`, 1px, translucide (sous 3:1 : élément secondaire, la bande porte la lecture) |
| Lignes de base, graduations annuelles, rayon de midi, suite pointillée du cycle 25 | `var(--dv-gridline)` |
| Point du dernier mois | `#eb6834`, liseré `var(--dv-ink-primary)` |
| Étiquettes des repères et des années, traits de rappel | `var(--dv-ink-secondary)` (texte secondaire, voir "Typographie" dans `style-guide.md`) et `var(--dv-gridline)` |
| Tours non sélectionnés | Mêmes couleurs, opacité réduite (de l'ordre de 0,2) |

Fond : `--dv-surface`, comme le reste du site en thème clair fixe. Aucune nouvelle valeur de couleur n'est introduite, donc rien à ajouter à `style-guide.md` ni à valider avec le script du skill dataviz.

## Nouvelles dépendances

Aucune. `d3-shape`, `d3-scale` et `d3-timer` sont déjà des dépendances du site (`d3-timer` via `bird-migrations`, `earthquakes`, `satellites-in-orbit` notamment), avec leurs paquets `@types` (voir "Dépendances (versions figées)" dans `technical-specifications.md` général), réutilisés à l'identique et scopés à cette visualisation.

## Textes et formats

- Textes d'interface (légende, bandeau, infobulle, ligne de synthèse, tableau) dans le dictionnaire i18n, sous la clé `sunspots` (voir "Textes d'interface" dans `technical-specifications.md` général). Libellés des repères : dans le fichier de données (voir "Format de sortie" dans `data-model.md`).
- Mois et nombres formatés selon la langue (`Intl.DateTimeFormat`, `Intl.NumberFormat`, une décimale pour le nombre de taches), y compris dans la vue tableau (`table.ts`, voir "Vue tableau des données" dans `technical-specifications.md` général).

## Téléchargement

**Fichier proposé : `downloads: [sunspots.json]`** (environ 234 Ko, voir "Prétraitement" dans `data-model.md`).

Vérification des licences (voir "Téléchargement des données préparées" dans le `functional-specifications.md` général) : la source est sous CC BY-NC 4.0, qui autorise explicitement le partage et l'adaptation, sous condition de crédit, de lien vers la licence, d'indication des modifications et d'usage non commercial (termes cités dans "Licence et citation" de `data-model.md`). Le site étant lui-même non commercial (CC BY-NC-SA 4.0), la redistribution du fichier préparé est permise, comme pour `bird-migrations` (CC BY-NC 4.0) et `volcanic-eruptions` (usage non commercial avec citation). La licence s'affiche dans le bloc de crédit juste au-dessus du lien, et la mention commune rappelle que la réutilisation reste soumise à cette licence.

Particularité : le fichier porte lui-même un champ `attribution` (source, licence, date de récupération, modifications apportées), parce que la licence exige d'indiquer les modifications et que le fichier, une fois téléchargé, circule sans la page qui le crédite. Aucune autre visualisation ne le fait à ce stade (voir "Points à valider").

## Hydratation

`client:visible` : l'animation d'ouverture démarre quand la spirale entre à l'écran, pas pendant que le visiteur lit la présentation au-dessus.

## Accessibilité (limite connue)

Voir "Accessibilité (limite connue)" dans `functional-specifications.md` de cette visualisation. La ligne de synthèse du bandeau est une région `aria-live="polite"`, annoncée à chaque changement de sélection ; elle n'est pas mise à jour pendant l'animation d'ouverture, qui ne change pas la sélection.

## Responsive

Voir "Responsive" dans `functional-specifications.md` de cette visualisation.

## État dans l'URL

Voir "État dans l'URL" dans le `technical-specifications.md` général pour le mécanisme commun.

| Paramètre | Valeurs | Défaut (absent de l'URL) |
|---|---|---|
| `cycle` | Numéro d'un cycle présent dans les données (`number`, voir `data-model.md`), de `0` à `25` à la récupération | Aucun cycle sélectionné |

- Écrit à chaque sélection (clic, tap ou liste déroulante), retiré quand la sélection est levée.
- Un paramètre présent et valide fait ouvrir la visualisation sur la spirale complète, sans animation d'ouverture (voir "Interactions" dans `functional-specifications.md`). Un paramètre invalide (non entier, cycle inexistant) est ignoré : la visualisation s'ouvre comme sans paramètre, animation comprise sauf mouvement réduit.
- Non capturés : l'infobulle (consultation passagère) et l'avancement de l'animation d'ouverture (pas de position temporelle, voir l'écart documenté dans "Interactions" de `functional-specifications.md`).

## Points à valider

Décisions de conception prises dans ces specs, à confirmer avant implémentation. Pour chacune : l'option retenue, puis les alternatives.

1. **Forme :** spirale à un tour par cycle, minima alignés à midi (voir "Forme retenue" dans `functional-specifications.md`). Écartées : spirale à période fixe de 11 ans (l'idée de départ), cycles superposés alignés sur leur minimum.
2. **Pas variable selon l'intensité** (voir "Géométrie de la spirale"), qui garantit qu'aucune bande ne chevauche le tour suivant au prix d'une amplitude modeste (5 à 17px sur grand écran, 1,5 à 5px sur téléphone). Écarté : pas constant avec chevauchement des tracés autour des cycles intenses, plus spectaculaire mais moins lisible.
3. **Deux séries tracées :** bande lissée sur 13 mois (lecture principale, définit les minima et maxima officiels) et trait mensuel translucide (texture du pouls, seule trace des six derniers mois). Écartées : la seule série lissée (le cycle 25 s'arrêterait en février 2026), la seule série mensuelle (trop bruitée pour comparer les cycles).
4. **Cycle 0 partiel** (janvier 1749 à janvier 1755) affiché au centre, non numéroté par SILSO, exclu du tableau. Écarté : commencer la spirale au minimum de février 1755 et perdre six ans de données, dont le pic de 1750.
5. **Durée provisoire des cycles incomplets** égale à la durée moyenne des cycles complets (132,4 mois), avec le reste du tour du cycle 25 en pointillé. Écarté : tour du cycle 25 laissé ouvert sans durée de référence, ce qui empêche de placer ses mois en angle.
6. **Maximum du cycle 25** (octobre 2024, 160,9) repris de la série lissée, faute de figurer dans les fichiers TXT et CSV de la table des cycles, alors que la page HTML "Solar Cycles Min/Max" de SILSO l'affiche (voir "Écart relevé" dans `data-model.md`).
7. **Animation d'ouverture** d'environ douze secondes, avec "Passer" et "Rejouer", sans pause ni position dans l'URL. Écartées : visualisation statique (plus simple, mais perd le battement qui donne son titre à la pièce) ; lecteur complet avec pause et curseur (une image en pause n'apporte rien ici).
8. **Quatre repères annotés** (Dalton, mai 1778, cycle 19, cycle 25). Écarté pour l'instant : un cinquième repère sur le cycle 24, le plus faible depuis plus d'un siècle, au prix d'une étiquette de plus sur une spirale déjà dense.
9. **Graduations annuelles** sur chaque tour, pour lire la durée réelle d'un cycle ramené à 360°. Écarté : s'en passer et laisser la durée au tableau et à la ligne de synthèse.
10. **Liste déroulante de cycles** en plus du clic sur la spirale, pour le clavier, le lecteur d'écran et les tours serrés sur téléphone. Écarté : sélection au seul clic.
11. **Palette :** orange du slot 2, sans exception à la charte. Écartées : bleu du slot 1 (confondu avec les éléments interactifs), jaune du slot 4 (contraste insuffisant), palette séquentielle "solaire" propre à la visualisation (exception à valider, sans gain de lecture pour une seule série).
12. **Vue tableau :** une ligne par cycle numéroté, cinq colonnes (début, maximum, nombre au maximum, montée, durée) et une ligne de moyenne des cycles complets. Écartés : une ligne par décennie (coupe les cycles en deux), une colonne de mois à zéro (chiffre fragile avant 1818).
13. **Téléchargement** de `sunspots.json` avec un champ `attribution` dans le fichier. Écartés : pas de téléchargement (rien dans la licence ne l'impose), ou téléchargement sans champ `attribution` comme les autres visualisations (la mention d'indication des modifications ne suivrait alors pas le fichier).
14. **`url` du dataset :** le DOI (`https://doi.org/10.24414/qnza-ac80`), que SILSO demande de citer. Écartée : la page de téléchargement `https://www.sidc.be/SILSO/datafiles`, plus directe mais absente du crédit demandé.
15. **`name` et `publisher`** en anglais, tels que publiés par la source ("International Sunspot Number V2.0 (…)", "WDC-SILSO, Royal Observatory of Belgium, Brussels"), puisque ces attributs ne sont pas localisés.
16. **Thème unique `space`.** Écarté : ajouter `climate`, qui ferait remonter `grape-harvest-almanac` et `flower-phenology` dans les visualisations liées, mais suggérerait un lien Soleil-climat que la visualisation ne montre pas.
17. **Titre, résumé et présentations longues** (voir "Angle éditorial" dans `functional-specifications.md`), dont la mise en garde sur la version 2.0. Les espaces insécables avant les ponctuations doubles sont à saisir en U+00A0 dans les fichiers de contenu (voir "Typographie" dans `style-guide.md`).
