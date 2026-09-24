# Spécifications techniques

## Stack technique

### Génération de site

- **Astro**, sortie statique (`output: 'static'`), pas de rendu serveur.
- `compressHTML: true` dans `astro.config.mjs` : Astro 7 est passé par défaut au mode `'jsx'`, qui supprime les blancs entre éléments en ligne ("À propos · Réalisée par…", liens de téléchargement séparés par des virgules). La valeur `true` garde le comportement d'Astro 5 : le texte rendu est resté identique mot pour mot lors de la montée de version.
- Les fichiers de `public/` lus au build (couvertures, données téléchargeables) sont localisés depuis la racine du projet (`process.cwd()`), pas depuis `import.meta.url` : ce dernier désigne l'emplacement du fichier compilé, qui change d'une version de Vite à l'autre (cassé lors du passage à Astro 7).
- **Content collections** (`src/content.config.ts`, schéma Zod) pour les visualisations (voir "Structure des fichiers" ci-dessous). Les thèmes (voir "Thème" dans `data-model.md`) sont un enum fermé porté par le schéma de cette collection, pas une collection à part : ils n'ont pas de contenu ni de page propres (voir "Filtre thématique" dans `home-page.md`).
- Composants `.astro` pour le chrome partagé (layout, en-tête, pied de page, sélecteur de langue, tuile de catalogue). Chaque visualisation ajoute ses propres composants (voir "Règles communes à toutes les visualisations").

### CSS / UI

- CSS natif avec variables custom, pas de framework CSS (pas de Bootstrap, pas de Tailwind), pas de SASS/LESS.
- Les valeurs de design (couleurs, typographie, espacements) sont définies dans `style-guide.md`, pas ici.

### Polices

- **Ubuntu**, graisses 300 / 400 / 500 / 700 (voir "Typographie" dans `style-guide.md`), hébergée par le site lui-même : fichiers woff2 dans `public/fonts/ubuntu/`, accompagnés de leur licence (`UFL.txt`, Ubuntu Font Licence 1.0), déclarés par des règles `@font-face` en tête de `src/styles/global.css` (`font-display: swap`).
- Seuls les sous-ensembles `latin` et `latin-ext` sont hébergés, avec les plages Unicode (`unicode-range`) de Google Fonts, d'où ils ont été téléchargés une fois : ils couvrent le français et les diacritiques des noms propres. Le navigateur ne télécharge que les graisses et sous-ensembles que la page utilise. Un caractère hors de ces plages retombe sur la police de repli (`sans-serif`).
- Raison : aucune requête vers un service tiers à l'affichage d'une page (ni Google Fonts, ni CDN), ce qui évite de transmettre l'adresse IP des visiteurs à un tiers et supprime deux connexions externes au premier affichage.

### JavaScript et visualisations

- Vanilla JS/TS pour le chrome partagé (sélecteur de langue, détection et mémorisation de la préférence, filtre thématique du catalogue).
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
- **Générateur :** Astro, sortie statique dans `dist/`. Le script `build` du `package.json` enchaîne `astro check && astro build` : la vérification de types (fichiers `.ts` et `.astro`) précède toujours la génération, en local comme au déploiement, et une erreur de type fait échouer le build avant toute publication. `withastro/action` lançant ce même script `build`, le workflow n'a pas d'étape de vérification propre.

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

- `astro` (7.x, qui demande Node.js 22.12 ou plus récent ; le workflow de déploiement tourne sous Node 24, valeur par défaut de `withastro/action@v6`)
- `@astrojs/sitemap` (voir "SEO")
- `typescript` et `@astrojs/check` (dépendances de développement : vérification de types par `astro check`, pas un framework UI, voir "Hébergement et déploiement")
  - Les modules `d3-*` et `topojson-client` n'embarquent pas leurs déclarations de types : elles viennent des paquets `@types/d3-*` (un par module d3 utilisé) et `@types/topojson-client`, en dépendances de développement. Toute nouvelle dépendance d3 ajoute son paquet `@types` correspondant.
  - Aucun `as any` aux appels d3 : les appels de zoom s'écrivent `zoomBehavior.scaleBy(select(...), k)` plutôt que `select(...).call(zoomBehavior.scaleBy, k)`, dont les surcharges ne se typent pas sans cast ; les géométries constantes passées à `fitExtent`/`path` sont typées `Polygon` (`geojson`) plutôt que déclarées `as const`, dont les tableaux en lecture seule sont refusés ; les générateurs d'arcs à accesseurs constants sont typés `d3Arc<null>()` et appelés avec `null`.
  - Limite connue : les fonds de carte TopoJSON chargés à l'exécution restent annotés `any` (`basemapTopology: any`, `fetchJson<any>`), si bien que les géométries qui en sont extraites échappent en partie à la vérification. Les typer (`Topology` de `topojson-specification`) se fera au fil des modifications de chaque visualisation.
- Aucune dépendance CSS ni bibliothèque d'icônes : les quatre icônes Creative Commons du pied de page sont des SVG inline (voir "Iconographie" dans `style-guide.md`).
- Pas de dépendance JS de chrome au-delà de vanilla.
- Dépendances propres à une visualisation : ajoutées et documentées au cas par cas, discutées avant ajout (voir "Règles communes à toutes les visualisations" et les règles globales de sécurité du projet).

---

## Structure des fichiers

```
/
├── astro.config.mjs
├── package.json
├── scripts/
│   └── check-source-links.mjs         # vérification hebdomadaire des URL des sources, voir "Surveillance des sources"
├── public/
│   ├── CNAME
│   ├── logo.png                       # favicon et logo de l'en-tête, voir style-guide.md
│   ├── cover-placeholder.svg          # couverture de repli, voir "Images" dans style-guide.md
│   ├── fonts/
│   │   └── ubuntu/                    # woff2 auto-hébergés et licence UFL.txt, voir "Polices"
│   ├── covers/
│   │   └── <viz-slug>.jpg            # ou .png, voir data-model.md
│   └── data/
│       └── <viz-slug>/
│           └── ...                    # données statifiées consommées par la visualisation,
│                                       # voir specs/<viz-slug>/data-model.md
├── src/
│   ├── content.config.ts              # schémas des content collections
│   ├── content/
│   │   ├── validation.ts              # règles de validation entre fichiers, voir "Validation des données"
│   │   ├── about/
│   │   │   ├── about.fr.md            # texte de la page "À propos", hors collection, voir about-page.md
│   │   │   └── about.en.md
│   │   └── visualizations/
│   │       ├── <viz-slug>.fr.md
│   │       └── <viz-slug>.en.md
│   ├── i18n/
│   │   ├── fr.ts                      # textes d'interface (labels, message d'indisponibilité, libellés des thèmes)
│   │   └── en.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── scripts/
│   │   ├── language.ts                # détection/mémorisation de la langue (Header.astro, LanguageSelector.astro)
│   │   ├── theme-filter.ts            # filtre thématique du catalogue (ThemeFilter.astro, VizCard.astro)
│   │   ├── url-state.ts               # état partageable dans l'URL, voir "État dans l'URL"
│   │   ├── reduced-motion.ts          # préférence de mouvement réduit, voir "Accessibilité"
│   │   └── viz-stage-height.ts        # hauteur de la zone de montage, voir "Règles communes à toutes les visualisations"
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LanguageSelector.astro
│   │   ├── ThemeFilter.astro          # chips de filtre thématique, voir home-page.md
│   │   ├── VizCard.astro              # tuile de catalogue
│   │   ├── RelatedVisualizations.astro # visualisations liées (réutilise VizCard.astro), voir functional-specifications.md
│   │   ├── DataDownloads.astro        # téléchargement des données préparées, voir functional-specifications.md
│   │   └── visualizations/
│   │       └── <viz-slug>/
│   │           └── ...                # composants propres à cette visualisation
│   ├── pages/
│   │   ├── index.astro                # accueil EN
│   │   ├── 404.astro                  # message d'indisponibilité localisé
│   │   ├── about.astro                # page "À propos" EN, voir about-page.md
│   │   ├── [viz].astro                # page de visualisation EN
│   │   └── fr/
│   │       ├── index.astro            # accueil FR
│   │       ├── about.astro            # page "À propos" FR
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
// src/content.config.ts — à ajuster à l'implémentation
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const THEMES = ['living', 'climate', 'earth', 'territory', 'space'] as const; // voir "Thème" dans data-model.md

const visualizations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/visualizations' }), // generateId propre, voir ci-dessous
  schema: z.object({
    lang: z.enum(['fr', 'en']),
    title: z.string(),
    summary: z.string(),
    datasets: z.array(z.object({
      name: z.string(),
      publisher: z.string(),
      url: z.url(),
      license: z.string().optional(),
      retrieved: z.string().optional(),
    })),
    themes: z.array(z.enum(THEMES)).min(1),
    'publication-date': z.string(),
    downloads: z.array(z.string()).optional(), // noms de fichiers de public/data/<viz-slug>/
  }),
});

export const collections = { visualizations };
```

La correspondance exacte entre le nom de fichier (`<viz-slug>.<lang>.md`) et le `slug`/`lang` exposés par la collection (extraction, `getStaticPaths`) est un détail d'implémentation confirmé à l'étape 3 du plan de construction (voir `BUILD-PLAN.md`) : le `generateId` par défaut du loader `glob` concatène le nom de base et le suffixe de langue sans séparateur (ex : `test-viz.fr.md` → `test-vizfr`), impropre à en extraire le `slug`. La collection `visualizations` déclare donc un `generateId` propre qui ne retire que l'extension `.md` (ex : `test-viz.fr.md` → id `test-viz.fr`), et une fonction `getVisualizationSlug` (exportée depuis `src/content.config.ts`) retire le suffixe `.<lang>` de cet id pour obtenir le `slug` utilisé dans les URLs.

---

## Architecture (rendu, routing)

### Rendu

Le site est entièrement statique, généré au build par Astro. Aucun rendu dynamique côté serveur, aucune API propre.

### Structure des URLs

- `/` : accueil du site (anglais, langue par défaut)
- `/fr/` : accueil du site (français)
- `/<viz-slug>/` : page d'une visualisation (EN)
- `/fr/<viz-slug>/` : page d'une visualisation (FR)
- `/about/`, `/fr/about/` : page "À propos" (voir `about-page.md`). Le slug `about` est donc réservé : aucune visualisation ne peut le prendre (voir "Contraintes et règles de validation" dans `data-model.md`).

L'anglais, langue par défaut, n'a pas de préfixe ; le français est préfixé par `/fr/`.

### Content collections et génération des pages

- `[viz].astro` et `fr/[viz].astro` génèrent chacun leurs chemins via `getStaticPaths`, à partir des entrées de la collection `visualizations` filtrées par `lang`.
- Une visualisation non traduite dans une langue n'a tout simplement pas d'entrée de collection pour cette langue, donc pas de page générée à cette URL : la visite de cette URL tombe sur `404.astro`.
- Les visualisations liées (voir "Visualisations liées" dans `functional-specifications.md`) sont sélectionnées au build par `src/components/RelatedVisualizations.astro`, à partir des entrées de la collection filtrées par la langue de la page : du HTML statique, sans JS client.
- Les liens de téléchargement des données préparées (voir "Téléchargement des données préparées" dans `functional-specifications.md`) sont générés au build par `src/components/DataDownloads.astro` à partir de l'attribut `downloads`. La taille de chaque fichier est lue sur le disque (`public/data/<viz-slug>/`) et formatée selon la langue de la page (`Intl.NumberFormat`, unités décimales ko/Mo). Un fichier déclaré mais absent fait échouer le build. Les liens portent l'attribut `download` pour forcer l'enregistrement plutôt que l'affichage du JSON dans l'onglet.

### Contenu non traduit ("message d'indisponibilité")

`src/pages/404.astro` détecte la langue depuis le préfixe de l'URL demandée (`/fr/...` ou non) pour afficher le message d'indisponibilité dans la bonne langue (voir "Multilingue" dans `functional-specifications.md`), plutôt que la page 404 générique de GitHub Pages.

### Textes d'interface

Les textes d'interface (labels, messages dont le message d'indisponibilité) sont centralisés dans `src/i18n/fr.ts` et `src/i18n/en.ts`. Ils sont distincts du contenu des visualisations, qui suit le format documenté dans `data-model.md`. Le dictionnaire français est déclaré `satisfies typeof en` : une clé présente d'un seul côté fait échouer la vérification de types, donc le build, au lieu d'afficher `undefined`.

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

## État dans l'URL

Mécanisme commun de l'état partageable (voir "État partageable dans l'URL" dans `functional-specifications.md`).

- **Support :** query string (`?year=1964&zoom=3.2,142.3700,38.3200`). Noms de paramètres en anglais, courts, en kebab-case. Les listes sont des identifiants séparés par des virgules, identiques aux identifiants des données (ex : `regions=us,china`). Ces identifiants ne sont jamais des libellés traduits, pour que l'URL reste la même dans les deux langues.
- **Module commun :** `src/scripts/url-state.ts`.
  - `getUrlParam(name)` : lit un paramètre.
  - `setUrlParams({ name: value | null })` : met à jour l'URL via `history.replaceState`. Il fusionne avec les paramètres existants, retire ceux qui valent `null` et conserve le fragment.
  - `readZoomParam(projection, largeur, hauteur, scaleExtent)` / `writeZoomParam(transform, projection, largeur, hauteur)` : le format de cadrage ci-dessous, commun aux cartes zoomables.

  Chaque visualisation reste propriétaire de ses paramètres : leur lecture, leur validation et leur application sont dans son propre `render.ts`, conformément à "Règles communes à toutes les visualisations" ci-dessus.
- **Écriture :**
  - seulement en réponse à une action du visiteur, jamais depuis la boucle d'animation ;
  - pour les curseurs, sur `change` (relâchement) plutôt que sur `input` ;
  - pour le zoom, sur l'événement `end` de `d3-zoom`, en fin de geste ;
  - pour une recherche texte, après une temporisation.

  Raison : les navigateurs limitent la fréquence de `history.replaceState` (Safari : une centaine d'appels par tranche de 30 secondes au-delà de laquelle il lève une exception).
- **Lecture :** une fois, au montage, après le chargement des données et le premier dimensionnement, avant la première image. Chaque paramètre est validé séparément (identifiant connu, nombre fini, borne respectée) ; un paramètre invalide est ignoré. Appliquer l'état initial ne réécrit pas l'URL.
- **Cadrage des cartes zoomables :** `zoom=<k>,<lon>,<lat>`.
  - `k` : le facteur d'échelle `d3-zoom`, à deux décimales.
  - `lon`, `lat` : les coordonnées géographiques (quatre décimales) du centre de la zone visible, soit `projection.invert(transform.invert([largeur / 2, hauteur / 2]))`.

  Des coordonnées géographiques plutôt que des pixels, pour que le lien cadre la même zone quelle que soit la taille ou le ratio de l'écran du destinataire. À la lecture, `k` est borné au `scaleExtent` de la carte, le point est reprojeté, et la transformation `translate(largeur / 2 − k·x, hauteur / 2 − k·y).scale(k)` est appliquée via `zoomBehavior.transform`, qui borne aussi la translation au `translateExtent`. Paramètre absent quand `k = 1` (vue d'ensemble).
- **Changement de langue :** `src/components/LanguageSelector.astro` reporte la query string et le fragment courants, à la fois dans la redirection automatique et dans les liens du sélecteur (lus au moment du clic, puisque l'URL change pendant la visite).
- **SEO :** un `<link rel="canonical">` sans query string, dans `BaseLayout.astro`, ramène toutes les variantes partagées à l'URL de la page (voir "SEO" ci-dessous).

---

## Validation des données

- La validation de structure (présence et type des champs) est native aux content collections d'Astro via le schéma Zod (`src/content.config.ts`) : `astro build` échoue si un fichier de contenu ne respecte pas le schéma, sans script dédié.
- Les règles qui portent sur plusieurs fichiers, hors de portée d'un schéma par fichier (voir "Contraintes et règles de validation" dans `data-model.md`), sont vérifiées au build par `validateVisualizations` (`src/content/validation.ts`) :
  - égalité des attributs non localisés entre `<viz-slug>.fr.md` et `<viz-slug>.en.md`, sans tenir compte de l'ordre des clés ;
  - correspondance entre `lang` et le suffixe du nom de fichier ;
  - slug réservé `about` ;
  - présence d'un composant de visualisation monté pour chaque visualisation de la langue de la page.

  Elle est appelée par `[viz].astro` et `fr/[viz].astro`, dans le corps de la page plutôt que dans `getStaticPaths`, qui s'exécute dans une portée isolée et ne voit pas la table des composants. Elle rassemble toutes les erreurs dans un seul message et fait échouer `astro build`, donc aussi le déploiement : pas de script séparé à penser à lancer, ni de dépendance ajoutée.
- La présence de l'image de couverture n'est pas vérifiée : le repli sur le placeholder est voulu tant que la couverture n'existe pas (voir "Images" dans `style-guide.md`).

---

## Surveillance des sources

Les URL des jeux de données (attribut `url` de chaque entrée de `datasets`, voir "Dataset source" dans `data-model.md`) pointent vers des sites tiers qui évoluent sans prévenir. Elles sont vérifiées chaque semaine, hors du build : une vérification réseau dans le build le rendrait dépendant de la disponibilité de sites tiers.

- **Script :** `scripts/check-source-links.mjs` (Node, sans dépendance), lancé en local par `npm run check-links`. Il lit les URL dans le frontmatter des fichiers de contenu, les dédoublonne et les interroge en GET, en suivant les redirections, avec un délai de 60 s et un nouvel essai après une réponse 5xx, un délai dépassé ou une connexion interrompue.
- **Trois verdicts :**
  - **OK** : réponse inférieure à 400.
  - **Cassé** : 404, 410, erreur 5xx persistante, domaine introuvable ou connexion refusée.
  - **Indéterminé** : toute autre réponse (401, 403, 429…), erreur de certificat, délai dépassé. Ces réponses ne disent rien de l'existence de la source. Mesuré à la mise en place : GBIF et la Smithsonian bloquent les robots derrière Cloudflare (403), la BDIFF sert une chaîne de certificats incomplète que Node rejette et que les navigateurs complètent, la NOAA dépasse régulièrement le délai. Toutes répondent normalement dans un navigateur.
- **Workflow :** `.github/workflows/check-source-links.yml`, chaque lundi à 6 h UTC et à la demande (`workflow_dispatch`), sans autre permission que la lecture du dépôt. Il échoue uniquement s'il trouve un lien cassé : GitHub envoie alors son e-mail d'échec habituel. Le détail des liens cassés et indéterminés, par visualisation, figure dans le résumé du run. Un lien indéterminé qui le reste plusieurs semaines est à vérifier à la main.
- **Limite connue :** GitHub désactive les workflows planifiés d'un dépôt resté sans activité pendant 60 jours. Il faut alors les réactiver dans l'onglet Actions.

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
- **Mouvement réduit** (voir "Mouvement réduit" dans `functional-specifications.md`) : `prefersReducedMotion()` (`src/scripts/reduced-motion.ts`) lit `matchMedia('(prefers-reduced-motion: reduce)')` une fois, au montage de chaque visualisation. Une visualisation animée qui la voit active s'ouvre en pause sur son état final par le même chemin qu'une position temporelle restaurée depuis l'URL (voir "État dans l'URL" ci-dessus), sans écrire l'URL ; les transitions d3 qui déplacent des éléments prennent une durée nulle. Les transitions CSS du site ne portent que sur la couleur ou l'opacité : aucune règle `@media (prefers-reduced-motion)` globale n'est nécessaire.

## SEO

- Rendu statique : chaque page existe indépendamment au moment du crawl, sans dépendre de JavaScript pour son contenu principal (à l'exception de la visualisation interactive elle-même).
- Chaque visualisation a sa propre URL indexable (voir "Structure des URLs").
- Liens `hreflang` / alternate entre les versions FR et EN d'une même page, dans `BaseLayout.astro`.
- `<link rel="canonical">` vers l'URL de la page sans query string, dans `BaseLayout.astro` : les liens partagés porteurs d'état (voir "État dans l'URL" ci-dessus) restent des variantes d'une seule page indexée.
- Balises meta et Open Graph (titre, description = `summary`, image = couverture) générées directement dans `BaseLayout.astro`, pas de plugin dédié nécessaire (à la différence de `jekyll-seo-tag`).
- `@astrojs/sitemap` pour un `sitemap.xml` généré automatiquement.

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Slugs (visualisation, thème) | kebab-case anglais | `air-pollution`, `living` |
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
