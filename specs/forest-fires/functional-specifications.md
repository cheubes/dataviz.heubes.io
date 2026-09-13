# Spécification fonctionnelle : Où la France a brûlé

Complète `functional-specifications.md` général : écran de cette visualisation (objectif, contenu, interactions, états, responsive).

**Brouillon de cadrage.** Titre, résumé et présentation longue ci-dessous sont provisoires : l'angle retenu (voir "Angle éditorial") suppose un glissement géographique des incendies vers le Nord et l'Ouest au fil du temps, hypothèse à vérifier sur les données réelles une fois agrégées par année et par région avant de figer ce texte. Si les données ne confirment pas ce glissement (ou le contredisent), ajuster l'angle éditorial en conséquence plutôt que de forcer le récit — même précédent que `light-pollution` (voir "Angle éditorial" dans son `functional-specifications.md`).

## Angle éditorial

| Langue | Titre | Résumé |
|---|---|---|
| FR | Où la France a brûlé | Plus de cent quarante mille incendies de forêt recensés depuis 2006 : une carte qui les rejoue, année après année, à travers le pays. |
| EN | Where France Has Burned | Over a hundred and forty thousand forest fires recorded since 2006 : a map replaying them, year by year, across the country. |

**Présentation longue FR (provisoire) :**
> Depuis 2006, la Base de Données sur les Incendies de Forêts en France (BDIFF) recense chaque incendie de forêt survenu sur le territoire : sa commune, sa date, la surface qu'il a parcourue. Plus de cent quarante mille foyers y sont aujourd'hui répertoriés, très majoritairement concentrés sur le pourtour méditerranéen.
>
> Cette carte rejoue, année après année, où ces incendies se sont produits : chaque point apparaît à son emplacement réel, sa taille reflétant la surface brûlée. À regarder défiler les années, une question se pose : le feu reste-t-il cantonné à ses terres historiques, ou gagne-t-il du terrain ailleurs ?

**Présentation longue EN (provisoire) :**
> Since 2006, the French Forest Fire Database (BDIFF) has recorded every forest fire on French territory : its municipality, its date, the area it burned. More than a hundred and forty thousand fires are now listed, overwhelmingly concentrated around the Mediterranean rim.
>
> This map replays, year by year, where these fires occurred : each point appears at its real location, its size reflecting the area burned. Watching the years go by raises a question : does fire stay confined to its historical ground, or is it spreading elsewhere ?

## Objectif

Faire voir, par la reconstitution année par année sur une carte réelle de la France métropolitaine, où se produisent les incendies de forêt et si leur répartition géographique évolue dans le temps.

## Contenu (zone de montage)

- Carte illustrée de la France métropolitaine (silhouette, pas de fond de tuiles, voir "Fond de carte" dans `technical-specifications.md`).
- Points représentant chaque incendie de l'année simulée courante (uniquement cette année-là, pas d'accumulation des années précédentes, voir "Interactions" ci-dessous), à sa position réelle, taille proportionnelle à la surface parcourue (voir "Taille des points" dans `technical-specifications.md`).
- Indicateur de l'année simulée en cours.
- Compteur du nombre d'incendies et de la surface totale brûlée à l'année simulée courante.
- Contrôles de lecture : bouton Play/Pause ; sélecteur de vitesse (Lent / Normal / Rapide) ; curseur d'année natif (`<input type="range">`), de 2006 à l'année la plus récente disponible (voir "Périmètre retenu" dans `data-model.md`).
- Boutons zoomer/dézoomer/réinitialiser en surimpression sur la carte, doublant le zoom/pan à la souris et au tactile.
- Fiche de détail au survol/tap d'un incendie, avec lien vers sa fiche officielle sur le site de la BDIFF.

## Interactions

- **Lecture automatique :** démarre dès le chargement de la page sur la première année disponible (2006), en boucle continue jusqu'à l'année la plus récente, même convention que `satellites-in-orbit`, `light-pollution` et `monument-layers` (voir leurs `functional-specifications.md`) : pause brève sur la dernière année avant de reprendre au début.
- **Play/Pause :** interrompt ou reprend la lecture à l'année simulée courante.
- **Vitesse de lecture :** Lent / Normal / Rapide, "Normal" par défaut (mêmes trois vitesses que les autres visualisations animées du site).
- **Curseur d'année :** un pas par année. Le déplacer manuellement (glisser ou clavier) met la lecture automatique en pause et remplace immédiatement les points affichés par ceux de l'année choisie, y compris en arrière (même convention que le curseur de `light-pollution`, voir son `functional-specifications.md`).
- **Zoom/pan :** libre sur la carte (souris/molette, tactile), pour observer une concentration régionale (ex. le pourtour méditerranéen) une fois qu'elle est apparue. Doublé de boutons zoomer/dézoomer/réinitialiser (mêmes contrôles que `monument-layers`/`paris-trees`), désactivés aux bornes de l'échelle de zoom.
- **Survol/tap d'un incendie :** fiche de détail (commune, département, date, surface parcourue, cause suspectée si connue, lien vers la fiche officielle BDIFF). Le lien n'est cliquable qu'une fois la fiche épinglée (clic/tap sur le point), même raison que `monument-layers` : en simple survol, la fiche suit le pointeur et resterait impossible à atteindre sans se refermer avant de pouvoir cliquer le lien.
- **Vue initiale :** carte de France entière visible, année 2006 affichée, lecture automatique déjà en cours.

## États

- **Chargement :** le temps que `fires.json` et le fond de carte soient récupérés et que l'animation s'initialise ; zone de montage réservée sans saut de mise en page.
- **Erreur :** échec de récupération d'un des fichiers de données → message d'erreur, pas de carte vide silencieuse.
- **Vide :** une année sans aucun incendie recensé dans le jeu de données retenu (à confirmer si ce cas se produit réellement une fois les données récupérées, voir "Statistiques mesurées" dans `data-model.md`) → pas de message d'erreur, la carte reste simplement vide pour cette année.

## Responsive

- Contrôles de lecture et indicateur d'année repositionnés sous la carte plutôt qu'en surimpression, avec des cibles tactiles suffisamment grandes.
- Pan/zoom au geste tactile ; fiche de détail au tap sur un incendie plutôt qu'au survol.

## Accessibilité (limite connue)

L'interaction principale (carte animée, zoom/pan, survol des incendies) n'est pas nativement accessible au clavier ni au lecteur d'écran. Documenté comme limite connue, sans repli, conformément à la règle par défaut du projet (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général). Le bouton Play/Pause, le sélecteur de vitesse, le curseur d'année et les boutons de zoom restent accessibles au clavier (éléments `<button>`/`<select>`/`<input type="range">` standard), pour permettre d'arrêter un contenu qui bouge en continu sans intervention (la lecture boucle indéfiniment, même rationale que `satellites-in-orbit`) et de parcourir la chronologie sans dépendre de la carte animée elle-même.

## Contenu non traduit

Les noms de communes et de départements ne sont disponibles qu'en français dans la source ; affichés tels quels dans la version anglaise de la page, sans traduction (même convention que `paris-trees` et `monument-layers`, voir leurs `functional-specifications.md`).
