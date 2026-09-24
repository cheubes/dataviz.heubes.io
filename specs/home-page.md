# Page d'accueil

## Objectif

Donner au visiteur un aperçu du catalogue de visualisations disponibles et lui permettre d'accéder à celle qui l'intéresse.

## Contenu et structure

- En-tête du site (voir "En-tête" dans `style-guide.md`).
- Filtre thématique : une chip par thème (voir "Thème" dans `data-model.md` et "Chips de filtre (catalogue)" dans `style-guide.md`), au-dessus de la grille de tuiles, sélection unique.
- Une grille de tuiles de toutes les visualisations disponibles dans la langue courante (voir "Tuiles (catalogue)" dans `style-guide.md`).
- Tuile de visualisation (voir "Tuiles (catalogue)" dans `style-guide.md`) : couverture, titre, résumé.
- Pied de page (voir "Pied de page" dans `style-guide.md`).

## Interactions

- Clic sur une tuile : navigue vers la page de la visualisation (voir `<viz-slug>/functional-specifications.md` pour son contenu).
- Clic sur une chip de thème : sélectionne ce thème et désélectionne automatiquement le thème précédemment actif (un seul thème actif à la fois) ; cliquer sur le thème déjà actif le désélectionne. La grille affiche alors les visualisations associées au thème sélectionné ; aucun thème sélectionné affiche toutes les visualisations disponibles, l'état par défaut. La sélection est un état d'affichage propre à la visite en cours : elle n'est ni conservée dans l'URL ni mémorisée d'une visite à l'autre, à la différence de la préférence de langue (voir "Multilingue" dans `functional-specifications.md`).
- Changement de langue via le sélecteur : réaffiche l'accueil dans la langue choisie (voir "Multilingue" dans `functional-specifications.md`) ; la sélection de thèmes en cours n'est pas conservée au changement de langue.

## États (chargement, erreur, vide, indisponible)

- Vide : aucune visualisation publiée dans la langue courante (état actuel du site, avant toute première visualisation) → message l'indiquant plutôt qu'une page blanche ou une grille silencieusement vide.
- Aucun résultat : un thème sélectionné mais aucune visualisation ne lui correspond → message dédié invitant à choisir un autre thème, distinct du message de l'état vide ci-dessus.

## Responsive

La grille de tuiles passe d'une à plusieurs colonnes selon la largeur disponible (grille CSS fluide, voir "Espacements, grille et responsive" dans `style-guide.md`) ; l'en-tête et le pied de page restent accessibles sans recouvrir le contenu.
