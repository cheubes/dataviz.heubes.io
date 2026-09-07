# Page d'accueil

## Objectif

Donner au visiteur un aperçu du catalogue de visualisations disponibles et lui permettre d'accéder à celle qui l'intéresse.

## Contenu et structure

- En-tête du site (voir "En-tête" dans `style-guide.md`).
- Une section par catégorie (voir "Catégorie" dans `data-model.md`), dans l'ordre de déclaration de `src/content/categories/` (pas de tri alphabétique) : titre de section (voir "Titre de section" dans `style-guide.md`), suivi d'une grille de tuiles des visualisations de cette catégorie disponibles dans la langue courante.
- Tuile de visualisation (voir "Tuiles (catalogue)" dans `style-guide.md`) : couverture, titre, résumé, badge de catégorie, mention de crédit de la couverture si renseignée.
- Pied de page (voir "Pied de page" dans `style-guide.md`).

## Interactions

- Clic sur une tuile : navigue vers la page de la visualisation (voir `<viz-slug>/functional-specifications.md` pour son contenu).
- Changement de langue via le sélecteur : réaffiche l'accueil dans la langue choisie (voir "Multilingue" dans `functional-specifications.md`).

## États (chargement, erreur, vide, indisponible)

- Vide : aucune visualisation publiée dans la langue courante (état actuel du site, avant toute première visualisation) → message l'indiquant plutôt qu'une page blanche ou une grille silencieusement vide.
- Catégorie vide : une catégorie déclarée sans visualisation publiée dans la langue courante n'affiche pas sa section, plutôt qu'un titre suivi d'une grille vide.

## Responsive

La grille de tuiles passe d'une à plusieurs colonnes selon la largeur disponible (grille CSS fluide, voir "Espacements, grille et responsive" dans `style-guide.md`) ; l'en-tête et le pied de page restent accessibles sans recouvrir le contenu.
