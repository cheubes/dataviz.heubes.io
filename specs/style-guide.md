# Charte graphique

Valable pour l'ensemble du site, y compris les visualisations : les couleurs, la typographie et les composants définis ici sont la base commune que chaque visualisation utilise par défaut (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` pour ce qu'une visualisation peut adapter, et comment).

## Couleurs

### Palette de l'interface (surfaces et texte)

En-tête et pied de page en couleurs de marque fixes (bleu marine, doré), reste de l'interface en gris neutre sur fond blanc.

```css
:root {
  /* Identité de marque (en-tête, pied de page) : fixes, pas de variante sombre
     (déjà des surfaces sombres par construction, voir note ci-dessous). */
  --dv-header-bg: #2c374c;
  --dv-footer-bg: #444444;
  --dv-gold: #c7b299;

  --dv-surface: #ffffff;
  --dv-page: #ffffff;
  --dv-ink-primary: #444444;
  --dv-ink-secondary: #666666;
  --dv-gridline: #acb2b8;
  --dv-accent: #2a78d6;
}

:root[data-theme="dark"] {
  --dv-surface: #1a1a19;
  --dv-page: #0d0d0d;
  --dv-ink-primary: #ffffff;
  --dv-ink-secondary: #c3c2b7;
  --dv-gridline: #2c2c2a;
  --dv-accent: #3987e5;
}
```

- `--dv-header-bg`, `--dv-footer-bg` et `--dv-gold` sont l'identité de marque de l'en-tête et du pied de page (voir "En-tête" et "Pied de page" ci-dessous) : des valeurs fixes, non redéfinies en mode sombre, car l'en-tête et le pied de page sont déjà des surfaces sombres par construction, quel que soit le thème du reste de la page. `--dv-gold` y sert d'état de survol/focus (texte, bordures), jamais comme couleur de catégorie de données. `--dv-header-bg` sert aussi de couleur de survol des tuiles du catalogue (voir "Tuiles (catalogue)" ci-dessous), pour rattacher cet état à l'identité de marque plutôt qu'à une couleur neutre.
- `--dv-accent` (bleu, identique au slot 1 de la palette catégorielle ci-dessous) porte les liens et les éléments interactifs sur fond clair (corps de page). Il n'est jamais réutilisé pour coder une catégorie de données dans une visualisation qui affiche plusieurs séries en même temps : l'identité d'une série vient toujours de la palette catégorielle ci-dessous, jamais du bleu d'accent seul. `--dv-gold`, plus clair, n'est pas utilisé comme couleur de survol sur fond clair : son contraste y est insuffisant (voir "Accessibilité" dans `technical-specifications.md`), il reste réservé aux surfaces sombres de l'en-tête et du pied de page.
- Le site reste toujours en thème clair, quel que soit le thème système du visiteur : pas de mode sombre pour l'instant. Les valeurs sombres restent définies (`:root[data-theme="dark"]`) mais ne s'activent plus automatiquement via `prefers-color-scheme` : elles ne sont atteignables que si une future bascule manuelle pose l'attribut `data-theme="dark"`, non implémentée à ce stade.

### Palette dataviz (pour les visualisations)

Palette catégorielle, dans cet ordre fixe (jamais cyclé au-delà de huit séries : au-delà, regrouper dans "Autre" ou passer en petits multiples) :

| Slot | Teinte | Light | Dark |
|---|---|---|---|
| 1 | Bleu | `#2a78d6` | `#3987e5` |
| 2 | Orange | `#eb6834` | `#d95926` |
| 3 | Aqua | `#1baf7a` | `#199e70` |
| 4 | Jaune | `#eda100` | `#c98500` |
| 5 | Magenta | `#e87ba4` | `#d55181` |
| 6 | Vert | `#008300` | `#008300` |
| 7 | Violet | `#4a3aa7` | `#9085e9` |
| 8 | Rouge | `#e34948` | `#e66767` |

Validée pour la lecture en daltonisme sur paires adjacentes (empilements, barres, lignes). Sur une disposition où toutes les paires peuvent se toucher (nuage de points, choroplèthe, petits multiples), seuls les trois premiers slots restent garantis distinguables deux à deux : au-delà de trois séries dans ce cas, regrouper ou passer en petits multiples plutôt que d'ajouter une quatrième teinte. Trois teintes (magenta, jaune, aqua) passent sous 3:1 de contraste sur `--dv-surface` claire en simple trait fin : une légende et des étiquettes directes visibles restent la garantie de lecture, pas seulement la couleur.

Séquentielle (magnitude, une seule teinte, clair → foncé), défaut bleu :

| Palier | Hex | Palier | Hex | Palier | Hex | Palier | Hex |
|---|---|---|---|---|---|---|---|
| 100 | `#cde2fb` | 250 | `#86b6ef` | 400 | `#3987e5` | 550 | `#1c5cab` |
| 150 | `#b7d3f6` | 300 | `#6da7ec` | 450 | `#2a78d6` | 600 | `#184f95` |
| 200 | `#9ec5f4` | 350 | `#5598e7` | 500 | `#256abf` | 650 | `#104281` |
| | | | | | | 700 | `#0d366b` |

Divergente (polarité) : bleu ↔ rouge, point neutre gris (`#f0efec` clair, `#383835` sombre).

Statuts (fixes, jamais réutilisés pour une série de données, toujours accompagnés d'une icône et d'un libellé, jamais de la couleur seule) :

| Rôle | Hex |
|---|---|
| Succès | `#0ca30c` |
| Avertissement | `#fab219` |
| Grave | `#ec835a` |
| Critique | `#d03b3b` |

Une visualisation qui a besoin d'une palette différente de ce défaut (ex : une teinte séquentielle propre à son sujet) la documente et la valide dans son propre `technical-specifications.md` plutôt que d'improviser des couleurs (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md`).

## Typographie

- **Police :** Ubuntu (Google Fonts), graisses 300 / 400 / 500 / 700 (voir "Polices" dans `technical-specifications.md` pour le chargement).
- `font-family: "Ubuntu", sans-serif;` sur `body`.

| Usage | Taille | Graisse | Couleur |
|---|---|---|---|
| `h1` | 2rem | 700 | `--dv-ink-primary` |
| `h2` | 1.5rem | 700 | `--dv-ink-primary` |
| `h3` | 1.125rem | 500 | `--dv-ink-primary` |
| Corps de texte | 1rem | 400 | `--dv-ink-secondary` |
| Texte secondaire, légendes, métadonnées | 0.875rem | 300 | `--dv-ink-secondary` |

`line-height` : 1.2 pour les titres, 1.5 pour le corps de texte.

Liens : jamais soulignés par défaut (`text-decoration: none`, sur l'ensemble du site) ; l'affordance vient de la couleur (`--dv-accent` ou `--dv-gold` selon la surface, voir "Couleurs") et de son changement au survol/focus, pas du soulignement.

## Espacements, grille et responsive

Échelle d'espacement, en variables CSS custom (pas de framework) :

```css
:root {
  --dv-space-1: 4px;
  --dv-space-2: 8px;
  --dv-space-3: 16px;
  --dv-space-4: 24px;
  --dv-space-5: 32px;
  --dv-space-6: 48px;

  --dv-header-height: 5.5rem;
  --dv-footer-height: 2.5rem;
  --dv-gutter: 12px;
}
```

- `--dv-gutter` : espacement horizontal minimal au bord de la fenêtre, partagé par le conteneur de page, l'en-tête et le pied de page (voir ci-dessous) ; hors échelle `--dv-space-*`.
- Conteneur de page (contenu principal) : largeur maximale 1320px, centré, marge horizontale `--dv-gutter`. Ne s'applique pas à l'en-tête ni au pied de page, en pleine largeur (voir "En-tête" et "Pied de page" ci-dessous).
- Grille du catalogue (voir "Tuiles (catalogue)" ci-dessous) : CSS Grid fluide (`repeat(auto-fill, minmax(340px, 1fr))`, `gap: var(--dv-space-4)`), pas de point de rupture fixe à maintenir ; ce minimum de tuile large plafonne naturellement à trois colonnes sur desktop (largeur du conteneur), deux puis une seule en dessous.
- `--dv-header-height` et `--dv-footer-height` dimensionnent l'en-tête collant et le pied de page fixe (voir "En-tête" et "Pied de page" ci-dessous) ; le contenu principal réserve un espacement bas égal à `--dv-footer-height` pour ne pas passer sous le pied de page fixe.

## Composants UI de base

### En-tête

- **Gauche** : logo (`public/logo.png`) suivi du nom du site (`dataviz.heubes.io`), l'ensemble en lien vers l'accueil.
- **Droite** : sélecteur de langue, deux drapeaux 🇫🇷 / 🇬🇧 empilés verticalement (l'un au-dessus de l'autre), avec `aria-label` explicite ("Français" / "English").
- Fond `--dv-header-bg` (bleu marine), texte blanc, bordure basse `--dv-gold`.
- Survol/focus des éléments interactifs (nom du site, drapeaux) : `--dv-gold`.
- En-tête collant (`position: sticky`) en haut de page, hauteur indicative `--dv-header-height` (voir "Espacements, grille et responsive").
- Largeur pleine, sans le conteneur de page (pas de largeur maximale ni de centrage) : ses éléments (logo/nom du site, sélecteur de langue) sont au plus près du bord de la fenêtre, avec seulement `--dv-gutter` d'espacement horizontal.
- Pas de contenu propre à une visualisation dans l'en-tête (pas de sous-titre, pas de switcher) : pas de notion d'univers ni de vue alternative ici. Le titre de la page courante s'affiche dans le contenu principal, pas dans le chrome.

### Pied de page

- **Gauche** : mention de licence, quatre icônes Creative Commons (voir "Iconographie") suivies du texte "CC BY-NC-SA 4.0", lien vers `https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr` ou `.../deed.en` selon la langue courante, appliquée à la présentation et au code originaux du site ; la licence propre à chaque dataset source reste celle de sa source (voir "Dataset source" dans `data-model.md`), non affectée par celle-ci.
- **Droite** : mention "Réalisée par Christophe Heubès" (FR) / "Created by Christophe Heubès" (EN), le nom en lien vers `https://christophe.heubes.org`.
- Fond `--dv-footer-bg` (gris foncé), texte blanc, bordure haute `--dv-gridline`, liens en `--dv-gold` au survol.
- Pied de page fixe (`position: fixed`, ancré en bas de viewport) sur toute la largeur, hauteur indicative `--dv-footer-height` ; le contenu principal réserve cet espace en bas de page pour ne jamais passer dessous. Padding vertical `--dv-space-2` et espacement `--dv-space-2` entre les icônes et le texte de la mention de licence.
- Comme l'en-tête, largeur pleine sans le conteneur de page : ses éléments sont au plus près du bord de la fenêtre, avec seulement `--dv-gutter` d'espacement horizontal.

### Tuiles (catalogue)

- Couverture (ratio et dimensions : voir "Images" ci-dessous), en lazy loading, `title` en titre, `summary` en corps, aligné en justifié. Zone de texte (titre + résumé) à hauteur fixe, résumé défilant verticalement au-delà de cette hauteur plutôt que tronqué : chaque tuile garde la même hauteur quelle que soit la longueur du résumé.
- Fond `--dv-surface`, titre `--dv-ink-primary`, texte `--dv-ink-secondary`, bordure `--dv-gridline`.
- Survol : légère élévation (ombre) et bordure `--dv-header-bg` (identité de marque).

### Page de visualisation

- `title` en `h1`, `summary` puis présentation longue (corps de texte de `<viz-slug>.<lang>.md`, voir `data-model.md`). Pas de couverture affichée en tête de page (à la différence de la tuile) : elle reste utilisée comme image de partage (meta Open Graph, voir "SEO" dans `technical-specifications.md`), pas comme élément visuel de la page elle-même.
- Zone de montage de la visualisation elle-même, après la présentation : conteneur pleine largeur, hauteur minimale réservée pour éviter un saut de mise en page pendant son initialisation (voir "États" attendus dans "Règles communes à toutes les visualisations" de `technical-specifications.md`). Traitement visuel propre à chaque visualisation, documenté dans son propre `functional-specifications.md`.
- Bloc de crédit des sources, après la zone de montage : un jeu de données par ligne (`name`, `publisher`, `license`, lien vers `url`, `retrieved`), texte secondaire.
- Pas de lien de retour au catalogue propre à la page : le retour à l'accueil se fait via l'en-tête (voir "En-tête" ci-dessus), commun à toutes les pages.

## Images

| Image | Ratio | Dimensions minimales |
|---|---|---|
| Couverture de visualisation | 16:9 | 1200 × 675 px |

Format `.jpg` (photo) ou `.png` (illustration, capture d'écran), selon la nature de la visualisation ; pas de contrainte de format imposée au-delà du ratio et des dimensions minimales. `object-fit: cover` en CSS pour absorber les écarts plutôt que d'imposer un recadrage strict.

Tant que la couverture propre d'une visualisation (`public/covers/<viz-slug>.jpg`/`.png`, voir `data-model.md`) n'existe pas, un placeholder partagé (`public/cover-placeholder.svg`) s'affiche à sa place sur sa tuile (et sert de repli pour l'image de partage de sa page, voir "Page de visualisation" ci-dessus).

## Iconographie

Pas de bibliothèque d'icônes par défaut (pas de nouvelle dépendance sans discussion, voir les règles globales de sécurité du projet). Les rares besoins d'icône (ex : lien externe) utilisent un caractère Unicode ou un SVG inline minimal.

Exception : les quatre icônes de la mention de licence en pied de page (voir "Pied de page" ci-dessus) utilisent Font Awesome Free (sous-ensemble `brands`, voir "Dépendances" dans `technical-specifications.md`) — `fa-creative-commons`, `fa-creative-commons-by`, `fa-creative-commons-nc-eu`, `fa-creative-commons-sa`, dans cet ordre, taille `1rem`, couleur héritée du pied de page (blanc, doré au survol).
