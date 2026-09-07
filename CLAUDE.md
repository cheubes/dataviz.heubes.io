# dataviz.heubes.io

Catalogue de visualisations de données interactives et originales, chacune explorant un dataset open data avec une mise en forme qui lui est propre. Site statique, multilingue (français / anglais), généré avec Astro et hébergé sur GitHub Pages.

## État du projet

L'implémentation suit `BUILD-PLAN.md`, qui définit l'ordre en étapes incrémentales. `specs/` reste la source de vérité pour toute décision de conception : avant d'écrire ou de modifier du code, lire les fichiers de specs concernés par la tâche.

## Structure de `specs/`

- **`functional-specifications.md`** : périmètre du projet, utilisateurs cibles, parcours utilisateurs, règles transverses (multilingue, navigation), hors périmètre.
- **`data-model.md`** : modèle de données général (entités Visualisation, Catégorie, Dataset source), organisation des fichiers de contenu (content collections Astro), conventions de nommage, contraintes de validation.
- **`technical-specifications.md`** : stack technique, hébergement/déploiement, architecture (routage, content collections), performance, accessibilité, SEO, et règles communes à toutes les visualisations (chargement des librairies, gestion des données, états communs).
- **`style-guide.md`** : charte graphique (couleurs, typographie, espacements), composants UI de base (en-tête, pied de page, tuiles), palette dataviz — valable pour l'ensemble du site, y compris les visualisations.
- **`home-page.md`** : spécification fonctionnelle de la page d'accueil (catalogue).
- **`<viz-slug>/`** : un dossier par visualisation publiée, avec :
  - `data-model.md` : schéma du dataset propre à cette visualisation (colonnes, format, source précise, transformations).
  - `functional-specifications.md` : spécification fonctionnelle de la visualisation, y compris son écran (objectif, contenu, interactions, états, responsive).
  - `technical-specifications.md` : règles techniques propres à cette visualisation (librairie de rendu, technique d'interaction, contraintes de performance ou d'accessibilité spécifiques) qui vont au-delà des règles communes du fichier général. Presque systématique plutôt qu'exceptionnel : chaque visualisation étant une pièce de code originale (pas un gabarit générique rejoué), elle a presque toujours un choix technique propre à documenter.

Aucun dossier `<viz-slug>/` n'existe encore : la première visualisation n'est pas encore choisie.

## Quand et comment utiliser ces specs

- **Avant toute implémentation**, lire le ou les fichiers concernés par la tâche. Les cinq specs générales (`functional-specifications.md`, `data-model.md`, `technical-specifications.md`, `style-guide.md`, `home-page.md`) s'appliquent à tout le site ; chaque dossier `<viz-slug>/` complète avec ce qui est propre à cette visualisation.
- **Les fichiers se référencent constamment entre eux** ("voir `X.md`") plutôt que de dupliquer l'information. Suivre ces renvois plutôt que de deviner : si une spec mentionne une règle définie ailleurs (le comportement multilingue, une couleur de la charte...), la source de vérité est le fichier référencé.
- **En cas de modification d'une spec**, chercher les autres fichiers qui la référencent (`grep` du nom de fichier dans `specs/`) et vérifier qu'ils restent cohérents avec le changement.
- **En cas de doute ou de silence des specs** sur un point nécessaire à l'implémentation, demander plutôt que de supposer : ce sont des choix de conception, pas des détails d'implémentation libres.
- **En cas de contradiction** entre le code et une spec, la spec fait foi ; si l'implémentation révèle qu'une spec doit changer, mettre à jour la spec et expliquer pourquoi, plutôt que de s'en écarter silencieusement dans le code.

## Avant chaque commit

- **Vérifier l'ensemble des fichiers de `specs/`** pour cohérence, pas seulement ceux directement modifiés par ce commit.
- **Si une ou plusieurs specs doivent être ajustées** (pour rester cohérentes entre elles, ou avec le changement en cours), bloquer le commit : proposer les mises à jour nécessaires et attendre validation avant de les appliquer, puis de committer.
- **Mettre à jour `BUILD-PLAN.md`** si nécessaire (état d'avancement).
- **Mettre à jour `README.md`** si nécessaire.

## Conventions établies

- Le contenu des specs (`specs/`, `BUILD-PLAN.md`, ce fichier) est en français : ce sont des documents de conception, pas de la documentation au sens des règles globales. `README.md` reste en anglais.
- Les noms de fichiers, dossiers, attributs de données et identifiants techniques sont en anglais, en kebab-case (slugs, données, classes CSS) ou en PascalCase pour les composants Astro (voir "Conventions de nommage" dans `technical-specifications.md`).
- Les couleurs et composants de la charte graphique sont définis une seule fois, dans `style-guide.md` : ne pas introduire de nouvelles valeurs de couleur ou de nouveaux styles de composants ailleurs sans les y ajouter d'abord.
- Toute nouvelle dépendance (librairie de visualisation, package npm) propre à une visualisation est documentée dans le `technical-specifications.md` de cette visualisation et discutée avant ajout (voir les règles globales de sécurité du projet).
