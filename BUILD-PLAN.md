# Plan de construction incrémental

Neuf étapes, chacune démontrable dans un navigateur avant de passer à la suivante. Voir `CLAUDE.md` pour la structure de `specs/` et les règles d'usage des spécifications.

Chaque étape a un prompt prêt à l'emploi pour la démarrer, à l'exception de l'étape 8 dont le prompt dépend d'un choix de dataset non encore fait. Les étapes 2 à 6 s'appuient sur une visualisation de test jetable (voir étape 2), en l'absence de première visualisation réelle choisie à ce stade : l'étape 7 retire ce contenu de test, remplacé par la vraie première visualisation à l'étape 8, avant le déploiement (étape 9).

## ✅ 1. Squelette Astro + chrome commun

`astro.config.mjs`, `package.json`, `BaseLayout.astro` avec en-tête collant et pied de page (couleurs, typographie, sélecteur de langue en emoji, pas encore fonctionnel) sur une page vide. Voir "Structure des fichiers" dans `technical-specifications.md` et `style-guide.md` ("En-tête", "Pied de page", "Couleurs", "Typographie").

**Critère :** `astro dev` tourne, l'en-tête et le pied de page respectent la charte graphique, sans rien de dynamique encore.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 1 du plan de construction (BUILD-PLAN.md) : squelette Astro et chrome commun.

Initialise le projet Astro (astro.config.mjs, package.json, voir "Dépendances" dans
technical-specifications.md), puis src/layouts/BaseLayout.astro, src/components/Header.astro
et src/components/Footer.astro, conformes à style-guide.md : variables CSS (src/styles/global.css,
voir "Couleurs" et "Espacements, grille et responsive"), police Ubuntu chargée via Google Fonts
(voir "Polices" dans technical-specifications.md), en-tête collant et pied de page (sélecteur de
langue en emoji drapeaux, pas encore fonctionnel, juste visuel, mention CC BY-NC-SA 4.0).

Crée une page de test minimale (src/pages/index.astro) pour vérifier l'affichage. Ne construis
aucune fonctionnalité au-delà de cette étape (pas de contenu de visualisation, pas de JS).

Critère de fin : astro dev tourne, l'en-tête et le pied de page s'affichent correctement aux
couleurs de la charte sur cette page de test.
```

## ✅ 2. Content collections + visualisation de test

`src/content/config.ts` (schéma de la collection `visualizations`, voir "Structure des fichiers" dans `technical-specifications.md`), une visualisation de test (contenu jetable, sans rapport avec une vraie visualisation à venir), pour valider le schéma dans les deux langues.

**Critère :** le build Astro passe avec ce contenu ; introduire un champ manquant ou mal typé dans le frontmatter le fait échouer.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 2 du plan de construction (BUILD-PLAN.md) : content collections et
visualisation de test.

Crée src/content/config.ts avec le schéma de la collection visualizations, en suivant
"Schéma des content collections" dans technical-specifications.md et les attributs de
data-model.md ("Visualisation", "Dataset source").

Ajoute une visualisation de test (src/content/visualizations/test-viz.fr.md et .en.md), avec
un frontmatter complet et un dataset factice, explicitement marquée comme contenu jetable à
retirer à l'étape 7.

Critère de fin : astro build passe avec ce contenu ; retire volontairement un champ requis du
frontmatter et vérifie que le build échoue, puis remets-le.
```

## ✅ 3. Page d'accueil (catalogue)

Grille de tuiles, lazy loading, état vide. Voir `home-page.md`.

**Critère :** la tuile de la visualisation de test s'affiche et mène à sa page.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 3 du plan de construction (BUILD-PLAN.md) : page d'accueil.

Construis src/pages/index.astro, src/pages/fr/index.astro et src/components/VizCard.astro, en
suivant home-page.md : grille de tuiles (couverture en lazy loading, titre, résumé), état vide
(aucune visualisation publiée).

Critère de fin : la tuile de la visualisation de test (étape 2) s'affiche à l'accueil, dans les
deux langues, et mène à sa page (même si cette page n'existe pas encore : le lien peut être
cassé à ce stade).
```

## ✅ 4. Page de visualisation (gabarit générique)

Couverture, titre, résumé, présentation longue, bloc de crédit des sources, zone de montage réservée (encore vide), lien retour. Voir "Page de visualisation" dans `style-guide.md`.

**Critère :** la page de la visualisation de test s'affiche avec tout son contenu de présentation ; la zone de montage réserve sa hauteur sans contenu.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 4 du plan de construction (BUILD-PLAN.md) : page de visualisation (gabarit
générique).

Construis src/pages/[viz].astro et src/pages/fr/[viz].astro (getStaticPaths à partir de la
collection visualizations, voir "Content collections et génération des pages" dans
technical-specifications.md), en suivant "Page de visualisation" dans style-guide.md :
couverture, title en h1, summary, présentation longue (corps du markdown), bloc de crédit des
datasets, zone de montage réservée (encore vide à ce stade, pas de visualisation réelle), lien
de retour au catalogue.

Critère de fin : cliquer sur la tuile de test depuis l'accueil (étape 3) ouvre sa page, avec
tout son contenu de présentation affiché correctement dans les deux langues.
```

## ✅ 5. Multilingue complet

Détection de langue au premier accès, mémorisation `localStorage`, préfixe `/fr/`, message d'indisponibilité (`404.astro`). Voir "Multilingue" dans `functional-specifications.md` et "Architecture" dans `technical-specifications.md`.

**Critère :** changer de langue conserve le contexte de navigation ; visiter une URL non traduite affiche le message d'indisponibilité dans la bonne langue.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 5 du plan de construction (BUILD-PLAN.md) : multilingue complet.

Construis le sélecteur de langue fonctionnel (détection de la langue du navigateur au premier
accès, repli sur l'anglais, mémorisation via localStorage après changement manuel) et
src/pages/404.astro (message d'indisponibilité localisé selon le préfixe /fr/), en suivant
"Multilingue" dans functional-specifications.md et "Contenu non traduit" /
"Détection et mémorisation de la langue" dans technical-specifications.md.

Critère de fin : changer de langue via le sélecteur conserve le contexte de navigation ;
visiter une URL de visualisation qui n'existe pas dans une langue affiche le message
d'indisponibilité dans cette langue plutôt que la 404 générique.
```

## ✅ 6. SEO et accessibilité

`@astrojs/sitemap`, hreflang, meta/Open Graph dans `BaseLayout.astro`, puis vérification manuelle (clavier, contraste réel à l'écran). Voir "SEO" et "Accessibilité" dans `technical-specifications.md`.

**Critère :** `sitemap.xml` généré, balises meta présentes, navigation clavier fonctionnelle sur l'accueil et la page de visualisation.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 6 du plan de construction (BUILD-PLAN.md) : SEO et accessibilité.

Ajoute @astrojs/sitemap, les balises meta et Open Graph (titre, summary, couverture) et les
liens hreflang entre versions FR/EN d'une même page dans BaseLayout.astro, en suivant "SEO"
dans technical-specifications.md. Fais ensuite une vérification manuelle dans le navigateur :
navigation au clavier, contraste réel à l'écran (les valeurs de style-guide.md ont été
calculées par le validateur du skill dataviz, pas testées visuellement ici).

Critère de fin : sitemap.xml généré, balises meta et hreflang présentes, l'accueil et la page
de visualisation restent utilisables au clavier.
```

## ✅ 7. Retrait du contenu de test

Retire la catégorie et la visualisation de test de l'étape 2 : le site en squelette reste fonctionnel (accueil à l'état vide, voir `home-page.md`), prêt pour l'ajout d'une première vraie visualisation.

**Critère :** l'accueil affiche l'état vide documenté dans `home-page.md`, sans erreur ni référence au contenu de test.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 7 du plan de construction (BUILD-PLAN.md) : retrait du contenu de test.

Retire la catégorie et la visualisation de test créées à l'étape 2 (contenu, couverture),
sans modifier le code des étapes précédentes.

Critère de fin : l'accueil affiche l'état vide documenté dans home-page.md ("Vide : aucune
visualisation publiée dans la langue courante"), sans erreur de build ni référence au contenu
de test.
```

## 8. Première visualisation réelle

Choix d'un premier dataset open data et d'un premier angle de visualisation, documentation de `specs/<viz-slug>/` (voir "Structure de `specs/`" dans `CLAUDE.md`), puis implémentation : contenu réel dans la collection `visualizations`, rendu interactif dans la zone de montage du gabarit générique (étape 4).

**Critère :** la tuile de la vraie visualisation s'affiche à l'accueil dans les deux langues ; sa page affiche le rendu interactif réel, pas un espace réservé vide.

**Prompt :**
```
Implémente l'étape 8 du plan de construction (BUILD-PLAN.md) : première visualisation réelle.

Avant d'écrire du code, choisis (ou confirme avec moi si pas déjà fait) un dataset open data et
un angle de visualisation, puis documente specs/<viz-slug>/data-model.md,
specs/<viz-slug>/functional-specifications.md et specs/<viz-slug>/technical-specifications.md
(voir "Structure de specs/" dans CLAUDE.md) : schéma du dataset, écran de la visualisation
(objectif, contenu, interactions, états, responsive), choix techniques propres (librairie de
rendu, technique d'interaction) au-delà des règles communes de technical-specifications.md.

Ajoute la visualisation à la collection content (src/content/visualizations/<viz-slug>.fr.md et
.en.md, voir étape 2), avec son vrai frontmatter et sa vraie couverture, et implémente son rendu
dans la zone de montage du gabarit générique (étape 4), en suivant les specs propres à cette
visualisation.

Critère de fin : la tuile de la visualisation s'affiche à l'accueil dans les deux langues, et
sa page affiche le rendu interactif réel, pas un espace réservé vide.
```

## 9. Déploiement

`.github/workflows/deploy.yml`, `public/CNAME`, source GitHub Pages réglée sur "GitHub Actions". Voir "Hébergement et déploiement" dans `technical-specifications.md`.

**Critère :** le site est accessible sur `dataviz.heubes.io` après un push sur `main`.

**Prompt :**
```
Implémente l'étape 9 du plan de construction (BUILD-PLAN.md) : déploiement.

Crée .github/workflows/deploy.yml et public/CNAME, en suivant "Hébergement et déploiement"
dans technical-specifications.md. Indique-moi de régler manuellement la source GitHub Pages du
repository sur "GitHub Actions" (paramètre du repository, pas modifiable depuis le code).

Critère de fin : après un push sur main, le site est accessible sur https://dataviz.heubes.io
avec la première visualisation réelle de l'étape 8.
```

---

Trois candidates sont déjà spécifiées (`specs/biodiversity/`, `specs/bird-migrations/`, `specs/flower-phenology/`, voir `CLAUDE.md`) ; laquelle implémenter en premier à l'étape 8, et dans quel ordre suivre pour les deux autres ensuite, reste à choisir.

Chaque étape est un point de commit naturel. Avant de committer, vérifier que l'ensemble de `specs/` reste cohérent avec ce qui vient d'être implémenté (voir "Avant chaque commit" dans `CLAUDE.md`) ; si l'implémentation révèle qu'une spec doit changer, le signaler avant d'appliquer la mise à jour.
