# Page "À propos"

## Objectif

Expliquer au visiteur ce qu'est le site et comment il est fait : la démarche du catalogue, l'origine et le traitement des données, la licence et la fabrication. C'est une page secondaire, accessible depuis toutes les pages, sans rôle dans la découverte des visualisations elles-mêmes.

## Accès

- URL `/about/` (EN) et `/fr/about/` (FR) : même convention que les visualisations, un slug anglais partagé entre les langues (voir "Structure des URLs" dans `technical-specifications.md`).
- Lien "À propos" / "About" dans le pied de page, sur toutes les pages (voir "Pied de page" dans `style-guide.md`).
- Le sélecteur de langue bascule entre les deux versions (voir "Multilingue" dans `functional-specifications.md`). La page existe toujours dans les deux langues.

## Contenu et structure

- En-tête et pied de page du site.
- Titre `h1` "À propos" / "About", puis un texte en sections `h2` :
  - **La démarche** : un catalogue de visualisations originales, chacune avec une mise en forme propre à son dataset, sans gabarit rejoué.
  - **Les données** : des sources publiques, citées sur chaque page avec leur producteur, leur licence et leur date de récupération ; des données figées au moment de leur préparation ; des limites (biais, couverture partielle) signalées sur la page concernée ; le téléchargement des données préparées quand les licences le permettent (voir "Téléchargement des données préparées" dans `functional-specifications.md`).
  - **Partager une vue** : l'adresse d'une visualisation garde les filtres, l'année en pause et le cadrage (voir "État partageable dans l'URL" dans `functional-specifications.md`).
  - **Fabrication** : site statique, visualisations codées une par une, hébergement, code source public ; pas de mesure d'audience ni de cookie, seule la préférence de langue est mémorisée dans le navigateur (voir "Détection et mémorisation de la langue" dans `technical-specifications.md`) ; polices et icônes servies par le site, sans requête vers un service tiers à l'affichage d'une page (voir "Polices" dans `technical-specifications.md`).
  - **Licence** : présentation et code du site sous CC BY-NC-SA 4.0 ; chaque jeu de données reste sous la licence de sa source (voir "Pied de page" dans `style-guide.md`).
  - **Auteur** : nom de l'auteur, en lien vers son site. Aucune autre information personnelle.
- Le texte ne décrit que ce qui est vrai du site : toute évolution des specs citées ci-dessus (nouvelle fonctionnalité, mesure d'audience ajoutée, changement de licence) impose de relire cette page.

## Format

- Texte rédigé dans `src/content/about/about.fr.md` et `about.en.md` (Markdown, sans frontmatter), rendu par `src/pages/about.astro` et `src/pages/fr/about.astro`. Titre et description de la page (balises `<title>` et meta) dans le dictionnaire i18n (voir "Textes d'interface" dans `technical-specifications.md`).
- Même typographie que la présentation longue d'une visualisation (voir "Typographie" et "Page de visualisation" dans `style-guide.md`).

## États

Page entièrement statique : ni chargement, ni erreur, ni état vide.

## Responsive

Colonne de texte unique dans le conteneur de page, sans comportement propre.
