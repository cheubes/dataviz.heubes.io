# Spécifications techniques

## Stack technique

### Génération de site

- **Astro**, sortie statique (`output: 'static'`), pas de rendu serveur.
- **Content collections** (`src/content/config.ts`, schéma Zod) pour les visualisations et les catégories (voir "Structure des fichiers" ci-dessous).
- Composants `.astro` pour le chrome partagé (layout, en-tête, pied de page, sélecteur de langue, tuile de catalogue). Chaque visualisation ajoute ses propres composants (voir "Règles communes à toutes les visualisations").

### CSS / UI

- CSS natif avec variables custom, pas de framework CSS (pas de Bootstrap, pas de Tailwind), pas de SASS/LESS.
- Les valeurs de design (couleurs, typographie, espacements) sont définies dans `style-guide.md`, pas ici.

### Polices

- **Ubuntu** (Google Fonts, CDN), graisses 300 / 400 / 500 / 700 (voir "Typographie" dans `style-guide.md`). Chargée dans `BaseLayout.astro` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### JavaScript et visualisations

- Vanilla JS/TS pour le chrome partagé (sélecteur de langue, détection et mémorisation de la préférence).
- Pas de framework JS imposé pour le chrome (pas de React/Vue/Svelte par défaut).
- Chaque visualisation choisit librement sa technique de rendu et ses librairies (D3, Observable Plot, deck.gl, Three.js, Canvas 2D...), scopées à sa propre page via les îles Astro (voir "Règles communes à toutes les visualisations").

### Ce qu'on n'utilise pas

- Backend ou API propre.
- Base de données.
- Cookies ou tracking. La préférence de langue est mémorisée via `localStorage` (voir "Multilingue" dans `functional-specifications.md`), aucune donnée envoyée à un serveur.
- Comptes utilisateurs, authentification.
- Analytics pour l'instant (à réévaluer si un besoin de mesure d'audience apparaît, avec un outil respectueux de la vie privée plutôt que Google Analytics — à discuter avant ajout).

---

## Hébergement et déploiement

- **Hébergeur :** GitHub Pages
- **Repository :** `https://github.com/cheubes/dataviz.heubes.io`
- **Domaine :** `dataviz.heubes.io` (fichier `public/CNAME`)
- **Déploiement :** GitHub Actions (`.github/workflows/deploy.yml`), déclenché sur push sur `main` : build Astro puis publication via `actions/deploy-pages`. GitHub Pages ne construit pas Astro nativement : la source Pages du repository doit être réglée sur "GitHub Actions", pas sur une branche.
- **Générateur :** Astro (`astro build`), sortie statique dans `dist/`.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

`withastro/action@v6` installe les dépendances, build et publie déjà l'artefact Pages en interne (`actions/upload-pages-artifact`) : y ajouter cette étape en double provoque un conflit ("an artifact with this name already exists on the workflow run"). Les versions majeures ci-dessus sont celles qui tournent sur Node.js 24 (évite l'avertissement de dépréciation de Node.js 20 sur les runners GitHub Actions) ; à réajuster si de nouvelles versions majeures sortent entre-temps.

---

## Dépendances (versions figées)

Indicatif, à reconfirmer au moment de l'implémentation :

- `astro` (dernière version stable 5.x)
- `@astrojs/sitemap` (voir "SEO")
- `typescript` (vérification de types, pas un framework UI)
- Font Awesome Free 7.3.1 (CDN, `cdn.jsdelivr.net`, sous-ensemble brands) : seule exception à "pas de dépendance CSS", pour les icônes Creative Commons du pied de page (voir "Iconographie" dans `style-guide.md`). Pas de dépendance npm : chargée en `<link>` dans `BaseLayout.astro`, comme les polices Google Fonts.
- Pas d'autre dépendance CSS, pas de dépendance JS de chrome au-delà de vanilla.
- Dépendances propres à une visualisation : ajoutées et documentées au cas par cas, discutées avant ajout (voir "Règles communes à toutes les visualisations" et les règles globales de sécurité du projet).

---

## Structure des fichiers

```
/
├── astro.config.mjs
├── package.json
├── public/
│   ├── CNAME
│   ├── logo.png                       # favicon et logo de l'en-tête, voir style-guide.md
│   ├── cover-placeholder.svg          # couverture de repli, voir "Images" dans style-guide.md
│   ├── covers/
│   │   └── <viz-slug>.jpg            # ou .png, voir data-model.md
│   └── data/
│       └── <viz-slug>/
│           └── ...                    # données statifiées consommées par la visualisation,
│                                       # voir specs/<viz-slug>/data-model.md
├── src/
│   ├── content/
│   │   ├── config.ts                  # schémas des content collections
│   │   └── visualizations/
│   │       ├── <viz-slug>.fr.md
│   │       └── <viz-slug>.en.md
│   ├── i18n/
│   │   ├── fr.ts                      # textes d'interface (labels, message d'indisponibilité)
│   │   └── en.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LanguageSelector.astro
│   │   ├── VizCard.astro              # tuile de catalogue
│   │   └── visualizations/
│   │       └── <viz-slug>/
│   │           └── ...                # composants propres à cette visualisation
│   ├── pages/
│   │   ├── index.astro                # accueil EN
│   │   ├── 404.astro                  # message d'indisponibilité localisé
│   │   ├── [viz].astro                # page de visualisation EN
│   │   └── fr/
│   │       ├── index.astro            # accueil FR
│   │       └── [viz].astro            # page de visualisation FR
│   └── styles/
│       └── global.css                 # variables CSS (voir style-guide.md)
└── specs/
    ├── ...
    └── <viz-slug>/
        ├── data-model.md
        ├── functional-specifications.md
        └── technical-specifications.md
```

### Schéma des content collections (indicatif)

```ts
// src/content/config.ts — à ajuster à l'implémentation
import { defineCollection, z } from 'astro:content';

const visualizations = defineCollection({
  type: 'content',
  schema: z.object({
    lang: z.enum(['fr', 'en']),
    title: z.string(),
    summary: z.string(),
    datasets: z.array(z.object({
      name: z.string(),
      publisher: z.string(),
      url: z.string().url(),
      license: z.string().optional(),
      retrieved: z.string().optional(),
    })),
    'publication-date': z.string(),
  }),
});

export const collections = { visualizations };
```

La correspondance exacte entre le nom de fichier (`<viz-slug>.<lang>.md`) et le `slug`/`lang` exposés par la collection (extraction, `getStaticPaths`) est un détail d'implémentation confirmé à l'étape 3 du plan de construction (voir `BUILD-PLAN.md`) : le `generateId` par défaut du loader `glob` concatène le nom de base et le suffixe de langue sans séparateur (ex : `test-viz.fr.md` → `test-vizfr`), impropre à en extraire le `slug`. La collection `visualizations` déclare donc un `generateId` propre qui ne retire que l'extension `.md` (ex : `test-viz.fr.md` → id `test-viz.fr`), et une fonction `getVisualizationSlug` (exportée depuis `src/content/config.ts`) retire le suffixe `.<lang>` de cet id pour obtenir le `slug` utilisé dans les URLs.

---

## Architecture (rendu, routing)

### Rendu

Le site est entièrement statique, généré au build par Astro. Aucun rendu dynamique côté serveur, aucune API propre.

### Structure des URLs

- `/` : accueil du site (anglais, langue par défaut)
- `/fr/` : accueil du site (français)
- `/<viz-slug>/` : page d'une visualisation (EN)
- `/fr/<viz-slug>/` : page d'une visualisation (FR)

L'anglais, langue par défaut, n'a pas de préfixe ; le français est préfixé par `/fr/`.

### Content collections et génération des pages

- `[viz].astro` et `fr/[viz].astro` génèrent chacun leurs chemins via `getStaticPaths`, à partir des entrées de la collection `visualizations` filtrées par `lang`.
- Une visualisation non traduite dans une langue n'a tout simplement pas d'entrée de collection pour cette langue, donc pas de page générée à cette URL : la visite de cette URL tombe sur `404.astro`.

### Contenu non traduit ("message d'indisponibilité")

`src/pages/404.astro` détecte la langue depuis le préfixe de l'URL demandée (`/fr/...` ou non) pour afficher le message d'indisponibilité dans la bonne langue (voir "Multilingue" dans `functional-specifications.md`), plutôt que la page 404 générique de GitHub Pages.

### Textes d'interface

Les textes d'interface (labels, messages dont le message d'indisponibilité) sont centralisés dans `src/i18n/fr.ts` et `src/i18n/en.ts`. Ils sont distincts du contenu des visualisations, qui suit le format documenté dans `data-model.md`.

### Détection et mémorisation de la langue

Au premier accès à une URL sans préfixe de langue (anglais par défaut), la langue est déterminée côté client par celle du navigateur (repli sur l'anglais si ni français ni anglais). Une URL déjà préfixée par `/fr/` n'est jamais réévaluée par cette détection : le préfixe explicite de l'URL est un signal plus fort que la langue du navigateur et prime tant qu'aucune préférence n'a été mémorisée. Une préférence mémorisée dans `localStorage` après un changement manuel via le sélecteur (voir "Multilingue" dans `functional-specifications.md`), elle, prime sur l'URL visitée, préfixée ou non. Cette logique s'exécute sur toute page (chrome partagé, `src/components/LanguageSelector.astro`) et redirige, si besoin, vers l'équivalent de la page courante dans la langue déterminée ou mémorisée ; si cet équivalent n'existe pas, la redirection tombe sur `404.astro` (voir "Contenu non traduit" ci-dessus).

---

## Règles communes à toutes les visualisations

- Chaque visualisation vit dans son propre composant Astro (et, si besoin, sous-composants) sous `src/components/visualizations/<viz-slug>/`, monté sur la page générique de visualisation (voir "Structure des URLs"). Rien de commun n'est imposé au-delà de ce montage : la technique de rendu (SVG, Canvas, WebGL, DOM), la ou les librairies utilisées, et l'organisation interne du composant sont propres à chaque visualisation et documentées dans son propre `technical-specifications.md`.
- Toute librairie JS spécifique à une visualisation est une dépendance npm scopée à cette visualisation : ajoutée à `package.json`, chargée uniquement sur la page de cette visualisation (île Astro, directive d'hydratation `client:load` / `client:visible` / `client:idle` selon le besoin, à documenter dans le `technical-specifications.md` de la visualisation), jamais globalement. Toute nouvelle dépendance reste soumise à discussion avant ajout.
- Les données consommées par une visualisation sont récupérées et figées au moment du build (fichier JSON/CSV committé sous `public/data/<viz-slug>/`, voir "Structure des fichiers" ci-dessus, généré par un script de prétraitement propre à la visualisation), sauf besoin explicite documenté et justifié dans le `technical-specifications.md` de la visualisation : cohérent avec un site entièrement statique, sans dépendance à la disponibilité d'une API tierce en production.
- La palette dataviz générale (voir `style-guide.md`) s'applique par défaut ; une visualisation qui a besoin d'une palette différente (ex : une teinte séquentielle propre à son sujet) la documente et la valide (script du skill dataviz) dans son propre `technical-specifications.md` plutôt que d'improviser des couleurs.
- États communs attendus sur la page de chaque visualisation, sauf raison contraire documentée : chargement (le temps que les données et la visualisation s'initialisent), erreur (échec de chargement des données), vide (dataset filtré ou vide selon le contexte). Le traitement visuel précis de chaque état est propre à la visualisation.
- Une visualisation dont le mode d'interaction principal n'est pas nativement accessible au clavier ou au lecteur d'écran (ex : un rendu Canvas ou WebGL) le documente comme limite connue dans son propre `technical-specifications.md`, plutôt que de le passer sous silence.
- Le comportement responsive d'une visualisation (adaptation ou message d'indisponibilité sur petit écran) est propre à chacune et documenté dans son `functional-specifications.md`.
- **Hauteur par défaut de la zone de montage :** `max(320px, min(largeur × 0,6, plafond))`, recalculée au redimensionnement de la fenêtre. Le plafond est l'espace disponible entre le header et le footer (`fenêtre.innerHeight − hauteur réelle du header − hauteur réelle du footer`, mesurée au runtime via `getBoundingClientRect()` plutôt que via les variables CSS `--dv-header-height`/`--dv-footer-height` de `style-guide.md`, indicatives et non garanties, voir "En-tête" et "Pied de page" dans `style-guide.md`), moins la hauteur déjà prise par les contrôles de la visualisation (légende, filtres, lecture) : la zone de montage entière (contrôles compris), pas seulement la carte ou le graphique, tient dans cet espace. **Le plancher de 320px reste prioritaire sur ce plafond** : sur un écran très bas (fenêtre courte, mobile en paysage), une visualisation aux contrôles nombreux peut donc dépasser légèrement l'espace disponible plutôt que de devenir illisible en dessous de 320px. Une visualisation dont la géométrie l'exige (ex : un rendu circulaire qui a besoin d'un ratio 1:1) documente et justifie son écart au calcul de hauteur (`largeur × 0,6`) dans son propre `technical-specifications.md`, mais reste soumise au même plafond.
- Les contrôles d'une visualisation (filtres, légende) restent toujours visibles à l'écran : pas de bascule d'affichage (ex : `<details>`/`<summary>` repliable) permettant d'en masquer une partie, y compris sur petit écran.

---

## Validation des données

- La validation de structure (présence et type des champs) est native aux content collections d'Astro via le schéma Zod (`src/content/config.ts`) : `astro build` échoue si un fichier de contenu ne respecte pas le schéma, sans script dédié.
- Les règles qui dépassent un schéma de champ (ex : les valeurs des attributs non localisés doivent être identiques entre `<viz-slug>.fr.md` et `<viz-slug>.en.md`, voir "Contraintes et règles de validation" dans `data-model.md`) sont vérifiées manuellement avant publication à ce stade, faute de validation croisée native entre fichiers d'une même collection. Si le nombre de visualisations le justifie plus tard, un script de validation dédié pourra être introduit, à discuter avant ajout.

---

## Performance

- Images de couverture en lazy loading via l'attribut natif `loading="lazy"`.
- Chaque île Astro (visualisation) hydrate son propre JS, sans charger le JS d'une autre visualisation ni du catalogue.
- Directives d'hydratation non bloquantes privilégiées (`client:idle` / `client:visible`) plutôt que `client:load` quand l'interaction n'est pas immédiatement nécessaire.
- Images optimisées à l'ajout de contenu (JPEG qualité ~82 progressif, ou PNG recompressé pour les captures/illustrations), dimensions au plus proche des minimums recommandés dans `style-guide.md`.

## Accessibilité

- **Navigateurs cibles :** dernières versions stables de Chrome, Firefox, Safari, Edge.
- Contraste WCAG AA pour le texte du chrome (4,5:1 corps, 3:1 grand texte/UI), sur les rôles ink/surface de `style-guide.md`.
- HTML sémantique pour la structure des pages et du catalogue.
- Texte alternatif sur les images de couverture.
- Limite connue par défaut : le mode d'interaction propre à chaque visualisation n'est pas garanti nativement accessible ; voir "Règles communes à toutes les visualisations" ci-dessus.

## SEO

- Rendu statique : chaque page existe indépendamment au moment du crawl, sans dépendre de JavaScript pour son contenu principal (à l'exception de la visualisation interactive elle-même).
- Chaque visualisation a sa propre URL indexable (voir "Structure des URLs").
- Liens `hreflang` / alternate entre les versions FR et EN d'une même page, dans `BaseLayout.astro`.
- Balises meta et Open Graph (titre, description = `summary`, image = couverture) générées directement dans `BaseLayout.astro`, pas de plugin dédié nécessaire (à la différence de `jekyll-seo-tag`).
- `@astrojs/sitemap` pour un `sitemap.xml` généré automatiquement.

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Slugs (visualisation, catégorie) | kebab-case anglais | `air-pollution`, `environment` |
| Composants Astro | PascalCase | `VizCard.astro`, `LanguageSelector.astro` |
| Fichiers de contenu / données | kebab-case | `air-pollution.fr.md` |
| Classes CSS custom | `.dv-` + kebab-case | `.dv-card`, `.dv-header` |
| Variables JS/TS | camelCase | `loadDataset()` |
| Constantes JS/TS | UPPER_SNAKE_CASE | `DEFAULT_LANG` |

## CSS : conventions

- Préfixe `.dv-` pour toutes les classes custom.
- Variables CSS custom pour les valeurs de design, définies dans `style-guide.md`.
- Pas de SASS, pas de LESS.

## JavaScript : conventions

- Vanilla JS/TS ES6+.
- Nommage : variables et fonctions en `camelCase`, constantes en `UPPER_SNAKE_CASE`, fichiers en kebab-case (sauf composants Astro, voir ci-dessus).
