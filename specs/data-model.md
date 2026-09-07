# Modèle de données

## Entités

### Visualisation

Une visualisation correspond à une pièce interactive dédiée à un dataset open data. Elle correspond à une URL propre du site (`/<viz-slug>/`).

| Attribut | Localisé | Description |
|---|---|---|
| `slug` | Non | Identifiant unique, construit à partir du titre anglais, utilisé dans l'URL et comme nom du dossier `specs/<viz-slug>/` (ex : `air-pollution`) |
| `lang` | Non | Langue de ce document (`fr` ou `en`) ; permet d'associer les deux documents d'une même visualisation |
| `title` | Oui | Titre affiché |
| `summary` | Oui | Texte court affiché sur la tuile du catalogue (voir "Tuiles (catalogue)" dans `style-guide.md`) et en tête de la page de la visualisation |
| `category` | Non | slug référençant une Catégorie (voir ci-dessous), utilisé pour regrouper les visualisations sur l'accueil (voir `home-page.md`) |
| `datasets` | — | Liste des jeux de données open data utilisés (voir "Dataset source" ci-dessous) |
| `cover-source` | Non | URL optionnelle vers la source de l'image de couverture, ou la valeur spéciale `ai-generated` quand elle est générée par IA faute de source réelle à créditer |
| `publication-date` | Non | Date de première publication de la visualisation |

L'image de couverture n'est pas un attribut : elle est associée à la visualisation par convention de nommage (voir "Images" ci-dessous).

### Catégorie

Thématique d'une visualisation (ex : environnement, démographie, transport, économie...), utilisée pour regrouper les visualisations sur l'accueil.

| Attribut | Localisé | Description |
|---|---|---|
| `slug` | Non | Identifiant stable, référencé depuis l'attribut `category` d'une visualisation |
| `label` | Oui | Libellé affiché, en titre de section sur l'accueil (voir `home-page.md`) |

Socle commun partagé par toutes les visualisations, pas d'extension locale. L'ordre de déclaration détermine l'ordre des sections sur l'accueil, pas un tri alphabétique (voir "Organisation des fichiers" ci-dessous).

Aucune catégorie n'est encore déclarée à ce stade : la liste se construit au fil de l'ajout des visualisations plutôt que d'être figée à l'avance.

### Dataset source

Un jeu de données open data utilisé par une visualisation. Une visualisation peut en croiser plusieurs.

| Attribut | Localisé | Description |
|---|---|---|
| `name` | Oui | Nom affiché du jeu de données |
| `publisher` | Non | Organisme producteur (ex : INSEE, data.gouv.fr, Eurostat) |
| `url` | Non | URL de la page source du jeu de données |
| `license` | Non | Licence du jeu de données telle que publiée par la source (ex : Licence Ouverte 2.0, ODbL) |
| `retrieved` | Non | Date à laquelle le jeu de données a été récupéré : les open data évoluent, cette date documente la version réellement utilisée |

Le schéma détaillé des données réellement consommées par une visualisation (colonnes, format, transformations appliquées) n'est pas porté ici : il est propre à chaque visualisation et documenté dans `specs/<viz-slug>/data-model.md`.

## Formats et conventions des fichiers de données

### Conventions générales

- Les noms d'attributs (clés de frontmatter et de fichiers de données) sont en anglais, en kebab-case.
- Les slugs (visualisation, catégorie) sont construits à partir du titre anglais de l'entité : minuscules ASCII, sans accents ni espaces, mots séparés par des tirets (ex : `air-pollution`, pas `Air_Pollution` ni `air pollution`).
- Le site est multilingue (français et anglais). Le `slug` d'une visualisation est partagé entre les langues : seule sa traduction varie, pas son URL.

### Images

- Image de couverture d'une visualisation : `public/covers/<viz-slug>.jpg` ou `.png` selon sa nature (photo ou illustration/capture, voir "Images" dans `style-guide.md`).
- Un seul fichier de couverture par visualisation, partagé par les deux langues (pas de déclinaison par locale).

Format, dimensions et ratio recommandés : voir "Images" dans `style-guide.md`.

### Organisation des fichiers

Le site est généré avec Astro, en content collections (voir "Structure des fichiers" dans `technical-specifications.md` pour la configuration et le schéma exact). Chaque visualisation a ses attributs de présentation (localisés et non localisés) portés par deux fichiers de contenu, un par langue ; les données qui alimentent la visualisation elle-même vivent à part, propres à chaque visualisation et documentées dans `specs/<viz-slug>/data-model.md`.

- `src/content/visualizations/<viz-slug>.fr.md`, `<viz-slug>.en.md` : présentation de la visualisation, un fichier par langue. Frontmatter : `lang`, `title`, `summary`, `category`, `datasets`, `cover-source`, `publication-date`. Corps de texte : présentation longue (contexte du dataset, angle choisi).
- `src/content/categories/<category-slug>.yml` : une entrée par catégorie, avec son `label` localisé (voir "Catégorie" ci-dessus).
- `public/covers/<viz-slug>.jpg` / `.png` : image de couverture (voir "Images" ci-dessus).

Les attributs non localisés (`category`, `datasets`, `cover-source`, `publication-date`) sont répétés à l'identique dans le frontmatter des deux fichiers de langue plutôt que centralisés à part : le nombre de champs concernés reste faible, la duplication reste donc limitée.

### Workflow d'ajout d'une visualisation

1. Choisir le `slug` de la visualisation (construit à partir de son titre anglais) et créer `specs/<viz-slug>/` avec ses trois fichiers (voir `CLAUDE.md` pour le contenu attendu de chacun).
2. Créer `src/content/visualizations/<viz-slug>.fr.md` et `<viz-slug>.en.md`, avec leur frontmatter complet.
3. Ajouter l'image de couverture (`public/covers/<viz-slug>.jpg` ou `.png`).
4. Déclarer, si besoin, une nouvelle catégorie dans `src/content/categories/`.
5. Implémenter la visualisation elle-même selon `specs/<viz-slug>/functional-specifications.md`, `data-model.md` et `technical-specifications.md`.
6. Valider (voir "Contraintes et règles de validation" ci-dessous et "Validation des données" dans `technical-specifications.md`).
7. Publier.

## Contraintes et règles de validation

- Le `slug` d'une visualisation est identique pour ses deux traductions.
- Un `slug` de visualisation est unique globalement.
- L'attribut `lang` d'un fichier de visualisation doit correspondre au suffixe de langue de son nom de fichier (`.fr.md` → `fr`, `.en.md` → `en`).
- Pour une langue donnée, `<viz-slug>.<lang>.md` n'existe que si la visualisation est disponible dans cette langue ; son absence retire la visualisation du catalogue de cette langue (voir "Multilingue" dans `functional-specifications.md`).
- La `category` d'une visualisation doit référencer un `slug` existant dans `src/content/categories/`.
- Le `cover-source` d'une visualisation, quand il est renseigné, vaut soit `ai-generated`, soit une URL.
- Un `slug` de catégorie est unique dans `src/content/categories/`.
- Le `label` d'une catégorie définit une valeur pour chaque langue déclarée par le site.
- Chaque entrée de `datasets` d'une visualisation déclare au minimum `name`, `publisher` et `url`.
- Les valeurs des attributs non localisés (`category`, `datasets`, `cover-source`, `publication-date`) sont identiques entre `<viz-slug>.fr.md` et `<viz-slug>.en.md` d'une même visualisation.
