# Charte graphique

Valable pour l'ensemble du site, y compris les visualisations : les couleurs, la typographie et les composants définis ici sont la base commune que chaque visualisation utilise par défaut (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` pour ce qu'une visualisation peut adapter, et comment).

## Couleurs

### Palette de l'interface (surfaces et texte)

```css
:root {
  --dv-surface: #fcfcfb;
  --dv-page: #f9f9f7;
  --dv-ink-primary: #0b0b0b;
  --dv-ink-secondary: #52514e;
  --dv-ink-muted: #898781;
  --dv-gridline: #e1e0d9;
  --dv-border: rgba(11, 11, 11, 0.10);
  --dv-accent: #2a78d6;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --dv-surface: #1a1a19;
    --dv-page: #0d0d0d;
    --dv-ink-primary: #ffffff;
    --dv-ink-secondary: #c3c2b7;
    --dv-ink-muted: #898781;
    --dv-gridline: #2c2c2a;
    --dv-border: rgba(255, 255, 255, 0.10);
    --dv-accent: #3987e5;
  }
}

:root[data-theme="dark"] {
  --dv-surface: #1a1a19;
  --dv-page: #0d0d0d;
  --dv-ink-primary: #ffffff;
  --dv-ink-secondary: #c3c2b7;
  --dv-ink-muted: #898781;
  --dv-gridline: #2c2c2a;
  --dv-border: rgba(255, 255, 255, 0.10);
  --dv-accent: #3987e5;
}
```

- `--dv-accent` (bleu, identique au slot 1 de la palette catégorielle ci-dessous) porte les liens, les états de survol/focus et les éléments interactifs du chrome d'interface. Il n'est jamais réutilisé pour coder une catégorie de données dans une visualisation qui affiche plusieurs séries en même temps : l'identité d'une série vient toujours de la palette catégorielle ci-dessous, jamais du bleu d'accent seul.
- Mode sombre sélectionné (pas un simple flip automatique) : mêmes rôles, valeurs propres validées pour la surface sombre (voir palette catégorielle).

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
| Corps de texte | 1rem | 400 | `--dv-ink-primary` |
| Texte secondaire, légendes, métadonnées | 0.875rem | 300 | `--dv-ink-secondary` |

`line-height` : 1.2 pour les titres, 1.5 pour le corps de texte.

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
}
```

- Conteneur de page : largeur maximale 1200px, centré, marge horizontale `--dv-space-3` sur petit écran.
- Grille du catalogue (voir "Tuiles (catalogue)" ci-dessous) : CSS Grid fluide (`repeat(auto-fill, minmax(260px, 1fr))`, `gap: var(--dv-space-4)`), pas de point de rupture fixe à maintenir.

## Composants UI de base

### En-tête

- **Gauche** : nom du site (`dataviz.heubes.io`), en lien vers l'accueil.
- **Droite** : sélecteur de langue, deux drapeaux 🇫🇷 / 🇬🇧 avec `aria-label` explicite ("Français" / "English").
- Fond `--dv-surface`, texte `--dv-ink-primary`, bordure basse `--dv-gridline`.
- En-tête collant (`position: sticky`) en haut de page.
- Pas de contenu propre à une visualisation dans l'en-tête (pas de sous-titre, pas de switcher) : pas de notion d'univers ni de vue alternative ici. Le titre de la page courante s'affiche dans le contenu principal, pas dans le chrome.

### Pied de page

- **Gauche** : mention de licence, "CC BY-NC-SA 4.0", lien vers `https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr` ou `.../deed.en` selon la langue courante, appliquée à la présentation et au code originaux du site ; la licence propre à chaque dataset source reste celle de sa source (voir "Dataset source" dans `data-model.md`), non affectée par celle-ci. Texte seul, sans icône : pas de bibliothèque d'icônes ici (voir "Iconographie").
- **Droite** : mention "Réalisée par Christophe Heubès" (FR) / "Created by Christophe Heubès" (EN), le nom en lien vers `https://christophe.heubes.org`.
- Fond `--dv-page`, texte `--dv-ink-secondary`, bordure haute `--dv-gridline`, liens en `--dv-accent` au survol.

### Titre de section (accueil)

- Un titre par section de l'accueil (une par catégorie, voir "Catégorie" dans `data-model.md` et `home-page.md`), au-dessus de la grille de tuiles de la catégorie correspondante.
- `h2`, style repris de l'échelle typographique standard, sans surcharge propre.

### Tuiles (catalogue)

- Couverture (ratio et dimensions : voir "Images" ci-dessous), en lazy loading, `title` en titre, `summary` en corps (tronqué à une limite de mot si nécessaire), badge de catégorie (texte `--dv-ink-secondary`, fond `--dv-page`, bordure `--dv-gridline`, pas de couleur propre à la catégorie).
- Fond `--dv-surface`, titre `--dv-ink-primary`, texte `--dv-ink-secondary`, bordure `--dv-border`.
- Survol : légère élévation (ombre) et bordure `--dv-accent`.
- Mention de crédit de la couverture (`cover-source`, si renseigné, voir `data-model.md`) : texte secondaire, taille `--dv-ink-muted`, en fin de tuile ; si c'est une URL, lien `--dv-accent` ; si `ai-generated`, texte simple sans lien.

### Page de visualisation

- Couverture en tête de page (même image que la tuile, affichée plus grande), `title` en `h1`, `summary` puis présentation longue (corps de texte de `<viz-slug>.<lang>.md`, voir `data-model.md`).
- Bloc de crédit des sources : un jeu de données par ligne (`name`, `publisher`, `license`, lien vers `url`, `retrieved`), texte secondaire.
- Zone de montage de la visualisation elle-même : conteneur pleine largeur, hauteur minimale réservée pour éviter un saut de mise en page pendant son initialisation (voir "États" attendus dans "Règles communes à toutes les visualisations" de `technical-specifications.md`). Traitement visuel propre à chaque visualisation, documenté dans son propre `functional-specifications.md`.
- Lien de retour au catalogue.

## Images

| Image | Ratio | Dimensions minimales |
|---|---|---|
| Couverture de visualisation | 16:9 | 1200 × 675 px |

Format `.jpg` (photo) ou `.png` (illustration, capture d'écran), selon la nature de la visualisation ; pas de contrainte de format imposée au-delà du ratio et des dimensions minimales. `object-fit: cover` en CSS pour absorber les écarts plutôt que d'imposer un recadrage strict.

## Iconographie

Pas de bibliothèque d'icônes par défaut (pas de nouvelle dépendance sans discussion, voir les règles globales de sécurité du projet). Les rares besoins d'icône (ex : lien externe) utilisent un caractère Unicode ou un SVG inline minimal.
