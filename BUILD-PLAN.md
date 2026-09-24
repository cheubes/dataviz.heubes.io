# Plan de construction incrémental

Dix-neuf étapes, chacune démontrable dans un navigateur avant de passer à la suivante. Voir `CLAUDE.md` pour la structure de `specs/` et les règles d'usage des spécifications.

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

## ✅ 8. Première visualisation réelle

Choix d'un premier dataset open data et d'un premier angle de visualisation, documentation de `specs/<viz-slug>/` (voir "Structure de `specs/`" dans `CLAUDE.md`), puis implémentation : contenu réel dans la collection `visualizations`, rendu interactif dans la zone de montage du gabarit générique (étape 4).

**Critère :** la tuile de la vraie visualisation s'affiche à l'accueil dans les deux langues ; sa page affiche le rendu interactif réel, pas un espace réservé vide.

**Statut :** fait, quatorze visualisations réelles à ce stade :
- `bird-migrations` (Les routes de migration), données GPS/Argos réelles (quatre espèces, voir `specs/bird-migrations/data-model.md`), rendu D3 + Canvas, fond de carte enrichi de cours d'eau et d'un relief ombré (Natural Earth, couverture mondiale, premier asset raster du site, voir "Cours d'eau (fond de carte)"/"Relief (fond de carte)" dans `specs/bird-migrations/data-model.md`), couverture réelle (`public/covers/bird-migrations.jpg`).
- `flower-phenology` (Le calendrier des fleurs), données d'occurrence GBIF réelles (douze espèces sauvages, voir `specs/flower-phenology/data-model.md`), rendu D3 SVG (arcs), couverture réelle (`public/covers/flower-phenology.jpg`).
- `biodiversity` (La biodiversité française), grille hexagonale H3 (résolution 4, 395 cellules) sur silhouette de la France métropolitaine, données GBIF agrégées via l'API SQL Downloads (voir `specs/biodiversity/data-model.md`), rendu D3 SVG statique (pas de zoom/pan, retiré à la relecture), mode "données en direct" optionnel interrogeant l'API GBIF depuis le navigateur, couverture réelle (`public/covers/biodiversity.jpg`).
- `paris-trees` (Paris, arbre par arbre), 194 315 arbres réels de l'inventaire "Les arbres" de la Ville de Paris (voir `specs/paris-trees/data-model.md` pour le périmètre retenu, ajusté à l'implémentation), rendu Canvas 2D (`d3-geo` + `d3-zoom`, projection Mercator, index spatial en grille pour le survol et le culling au rendu) sur fond de carte avec trame de rues et Seine (ajoutées après relecture, cette dernière seule donnée du site hors Paris Data, source OpenStreetMap), filtre par genre dominant et recherche d'espèce, zoom au clic sur un arrondissement, couverture réelle (`public/covers/paris-trees.jpg`).
- `satellites-in-orbit` (La ruée vers l'orbite), 20 020 payloads réels toujours en orbite (actifs ou non) du catalogue SATCAT de CelesTrak (voir `specs/satellites-in-orbit/data-model.md` pour le périmètre et le regroupement géographique en cinq zones), animation Canvas 2D en boucle continue de 1958 à aujourd'hui (`d3-scale` + `d3-timer` + `d3-geo`/`topojson-client` pour le globe en rotation, positionnement en halo déterministe sans orbite réelle), trois vitesses de lecture, curseur d'année natif (`<input type="range">`, granularité annuelle, sans graduations, ajouté après la première implémentation sur le modèle de `monument-layers`) pilotable manuellement ou automatiquement, légende cliquable doublée d'un filtre par zone, couverture réelle (`public/covers/satellites-in-orbit.jpg`).
- `light-pollution` (Le ciel, d'année en année), radiance nocturne VIIRS VNL réelle (NOAA Earth Observation Group, composites annuels 2013-2025, versions v2.1 et v2.2, voir `specs/light-pollution/data-model.md`) agrégée sur la même grille hexagonale H3 que `biodiversity` (395 cellules réutilisées telles quelles) et traduite en échelle de visibilité du ciel à six paliers (palette séquentielle du site), rendu D3 SVG compact (même projection Mercator que `biodiversity`, carte volontairement plus basse), légende et contrôles au-dessus de la carte, lecture automatique en boucle (`d3-timer`, même convention que `satellites-in-orbit` : départ 2013, arrêt sur 2025, trois vitesses, bouton pause), curseur d'année natif (`<input type="range">`) pilotable manuellement ou automatiquement, angle éditorial délibérément neutre (les données montrent un recul de l'intensité lumineuse depuis 2013, surtout depuis 2022-2023, pas une hausse comme le brouillon de cadrage le supposait), couverture réelle (`public/covers/light-pollution.jpg`).
- `monument-layers` (Les strates du patrimoine), 37 661 monuments historiques réels de la base Mérimée (ministère de la Culture, voir `specs/monument-layers/data-model.md` pour le prétraitement et les statistiques d'exclusion mesurées), rendu Canvas 2D (`d3-geo` + `d3-zoom`, même fond de carte France que `biodiversity`) animé chronologiquement en boucle continue (`d3-timer`, échelle linéaire, même convention que `satellites-in-orbit` : trois vitesses, pause de 2,5 s sur la carte complète avant chaque nouveau passage) : les monuments antérieurs à l'an 0 (4,75 % du jeu de données, ère archéologique plutôt que siècle numérique) apparaissent comme un socle statique dès le début de chaque passage, décision prise avec l'utilisateur après mesure de la distribution réelle pour éviter que 90 % des monuments ne s'affichent en une fraction de seconde du balayage animé (voir "Points tranchés à l'implémentation" dans `specs/monument-layers/technical-specifications.md`), filtre par nature de protection (classé/inscrit), curseur d'année natif (`<input type="range">`, sans graduations, à la différence de `light-pollution`) pilotable manuellement ou automatiquement, zoom/pan à la souris et au tactile doublé de boutons zoomer/dézoomer/réinitialiser (mêmes contrôles que `paris-trees`, zoom maximal 1 000, relevé en deux fois sur retour utilisateur), fond de carte enrichi du réseau d'autoroutes et voies rapides sur toute la France (60 272 tronçons) et de quinze cours d'eau au tracé précis (3 124 tronçons), entièrement OpenStreetMap via l'API Overpass après deux passes de précision croissante sur retour utilisateur (Natural Earth puis dix-neuf grandes villes seulement, avant la couverture nationale complète) : requêtes par relation nommée ou par zone administrative plutôt que par rectangle englobant, seule façon d'obtenir une réponse sans dépassement du délai serveur sur une emprise aussi large que la France, fiche de détail complétée d'un lien vers la notice officielle de chaque monument sur la Plateforme Ouverte du Patrimoine (cliquable une fois la fiche épinglée, pas en simple survol), couverture réelle (`public/covers/monument-layers.jpg`).
- `grape-harvest-almanac` (L'almanach des vendanges), dates de vendanges réelles de sept régions viticoles françaises (Bourgogne, vallée du Rhône sud, Bordeaux, Languedoc, Alsace, basse vallée de la Loire, Champagne) sur 1354-2007, source Daux et al. 2012 (NOAA/WDS Paleoclimatology, voir `specs/grape-harvest-almanac/data-model.md` pour le piège de parsing à largeur fixe rencontré et corrigé, et pour le choix des régions : Jura et Ile-de-France, pourtant citées comme "parmi les plus complètes" par l'article source, écartées car leurs séries s'arrêtent avant 1980), rendu D3 SVG (ligne temporelle multi-séries, courbe brute fine et moyenne mobile vingt ans plus marquée par région), quatre repères historiques cliquables (méga-sécheresse de 1540, année sans été 1816, crise du phylloxéra 1863-1900, canicule 2003) avec panneau de détail, filtre par région doublant la légende, pas de zoom/pan ni de graduations sur l'axe des dates (retirés à la demande de l'utilisateur après une première version qui les incluait, voir "Axes" dans `specs/grape-harvest-almanac/technical-specifications.md`), couverture réelle (`public/covers/grape-harvest-almanac.jpg`).
- `endangered-species` (Ce qu'il en reste), trajectoires de population réelles de six espèces emblématiques (tigre, rhinocéros noir, panda géant, gorille des montagnes, vaquita, grand hamster d'Alsace), chacune sourcée séparément auprès de son organisme de suivi (Global Tiger Forum, Our World in Data/AfRSG, State Forestry Administration of China/WWF, IGCP, NOAA Fisheries/CIRVA, OFB/Préfecture Grand Est — voir `specs/endangered-species/data-model.md` : source IUCN Red List initialement retenue, abandonnée après blocage anti-bot constaté et incertitude sur l'approbation d'un token API pour un projet de visualisation), rendu D3 SVG en petits multiples (une carte par espèce, pas de carte géographique), une seule silhouette générique en icône (empreinte de patte, SVG inline minimal) dont le nombre par carte interpole (`d3-interpolate`) la population entre deux recensements connus, rendu basé uniquement sur les effectifs (pas de dimension catégorielle, décision explicite de l'utilisateur après abandon de la catégorie de menace IUCN), lecture automatique en boucle du recensement le plus ancien au plus récent (`d3-timer`, même convention que `satellites-in-orbit`/`light-pollution`/`monument-layers`, trois vitesses, pause de 2 s sur la dernière année avant de reboucler), curseur d'année natif pilotable manuellement ou automatiquement, tuiles d'espèce de taille fixe (grille d'icônes à 10 colonnes × 8 lignes, dimensionnée pour le maximum réel observé) sur fond illustré propre à chaque espèce (six illustrations originales de l'utilisateur, `public/data/endangered-species/<species-id>.jpg`, voile sombre pour la lisibilité du texte/des icônes en blanc), fiche de détail au survol/tap précisant l'estimation réelle et sa tendance, couverture réelle (`public/covers/endangered-species.jpg`, même style graphique que les fonds de tuiles).
- `earthquakes` (Les lignes de faille), catalogue sismique réel de l'USGS (`fdsnws/event`, 14 453 séismes de magnitude 6 et plus depuis 1900, voir `specs/earthquakes/data-model.md` pour le filtrage des essais nucléaires exclus du catalogue source brut), frontières de plaques tectoniques du modèle de Bird (2003, dépôt `fraxen/tectonicplates`, licence ODC-BY) tracées en superposition statique hors du clip terrestre (visibles aussi en mer), rendu Canvas 2D (`d3-geo` + `d3-zoom`, projection Natural Earth mondiale, fond de carte/cours d'eau/relief copiés depuis `bird-migrations` dans le dossier de données propre à cette visualisation), chaque séisme pulse à sa date réelle (rayon et opacité croissants avec la magnitude, `d3.scaleSqrt`, palette séquentielle bleue) en boucle continue sur cent vingt-sept ans (`d3-timer`, cycle de 90 secondes en vitesse normale, trois vitesses, sans point permanent à la différence d'un volcan), sept séismes historiques annotés au moment de leur pulse (San Francisco 1906, Chili 1960, Alaska 1964, Tangshan 1976, Sumatra-Andaman 2004, Haïti 2010, Tōhoku 2011), fiche de détail au survol/tap limitée à la fenêtre du pulse, curseur d'année natif pilotable manuellement ou automatiquement (ajouté après la première implémentation, même modèle que `monument-layers`/`satellites-in-orbit`), boutons zoomer/dézoomer/réinitialiser en haut à droite (ajoutés en même temps, même modèle que `monument-layers`/`paris-trees`) en complément du zoom/pan libre, couverture réelle (`public/covers/earthquakes.jpg`).
- `monarch-migration` (La migration des monarques), densité d'occurrences GBIF du papillon monarque (*Danaus plexippus*) agrégée sur une grille régulière de 1° en Amérique du Nord (2 280 cellules dont 1 270 actives, 395 170 observations retenues, voir `specs/monarch-migration/data-model.md`) ; méthode adaptée en cours d'implémentation : facettes mensuelles de l'API de recherche publique GBIF plutôt que l'API SQL Downloads, faute de compte GBIF disponible, avec des cellules semi-ouvertes pour ne pas compter deux fois les points situés exactement sur une frontière (grille affinée de 2° à 1° après une première version jugée trop grossière au cadrage régional). Rendu Canvas 2D (`d3-geo` + `d3-zoom`) sur le fond de carte mondial de `bird-migrations` (silhouette, relief et cours d'eau copiés tels quels, cadrage sur l'Amérique du Nord), animé en boucle continue sur une année simulée (`d3-timer`, trois vitesses, bouton pause, même convention que `satellites-in-orbit`) avec interpolation entre mois pour une vague progressive, tooltip exprimé en pourcentage du pic annuel de chaque case, zoom/pan à la souris et au tactile. Recentrée sur le monarque seul à la demande de l'utilisateur : la première implémentation, intitulée "Les grandes migrations", réunissait aussi des trajectoires de baleines et de gnous (Movebank), retirées du code et des données (voir "Périmètre recentré" dans `specs/monarch-migration/data-model.md`) ; couverture réelle (`public/covers/monarch-migration.jpg`).
- `forest-fires` (Où la France a brûlé), 50 946 incendies de forêt réels recensés par la BDIFF entre 2006 et 2025 sur la France métropolitaine (ministère de l'Agriculture/IGN, voir `specs/forest-fires/data-model.md` pour le prétraitement et les statistiques d'exclusion mesurées) : export CSV complet récupéré en deux requêtes chaînées (plafond de 30 000 résultats par export sur `bdiff.agriculture.gouv.fr/incendies/zip`), géocodé par commune (l'export BDIFF ne porte pas de coordonnées) via l'API Découpage administratif d'Etalab. Rendu Canvas 2D (`d3-geo` + `d3-zoom`, même fond de carte France que `biodiversity`, sans enrichissement hydrographie/routes), un incendie en point orange fixe dont le rayon suit la racine carrée de la surface parcourue (`d3.scaleSqrt`, calibré sur la distribution réelle des surfaces), curseur d'année remplaçant l'ensemble des points à chaque pas plutôt que de les accumuler (même convention discrète que `light-pollution`, pas de morphing continu comme `monument-layers`), lecture automatique en boucle continue (`d3-timer`, trois vitesses, pause de 2 s sur la dernière année avant de reboucler), curseur d'année natif pilotable manuellement ou automatiquement, zoom/pan à la souris et au tactile doublé de boutons zoomer/dézoomer/réinitialiser (zoom maximal 200, plus bas que `monument-layers` : au plus quelques milliers de points affichés simultanément par année plutôt que l'accumulation totale), fiche de détail au survol/tap (commune, département, date, surface en hectares, cause suspectée) avec lien vers la fiche officielle BDIFF (cliquable une fois la fiche épinglée), angle éditorial (glissement géographique du pourtour méditerranéen vers le reste du pays) confirmé empiriquement sur les données agrégées plutôt que présumé au cadrage, couverture réelle (`public/covers/forest-fires.jpg`).
- `volcanic-eruptions` (Le pouls du globe), 10 937 éruptions volcaniques holocènes réelles sur 1 214 volcans (Smithsonian Global Volcanism Program, catalogue Volcanoes of the World v. 5.4.0, récupéré via son web service WFS plutôt que par scraping du site principal qui bloque la récupération automatisée, voir `specs/volcanic-eruptions/data-model.md` pour la vérification de licence et les statistiques d'exclusion mesurées), rendu Canvas 2D (`d3-geo` + `d3-zoom`, projection Natural Earth mondiale, fond de carte/cours d'eau/relief copiés depuis `bird-migrations`) : chaque éruption pulse à sa date réelle (rayon et opacité croissants avec le VEI, `d3.scaleSqrt`, palette séquentielle orange propre à cette visualisation plutôt que le bleu par défaut réservé par `earthquakes`, voir "Palette" dans `specs/volcanic-eruptions/technical-specifications.md`) en boucle continue sur environ dix mille ans (`d3-timer`, cycle de 120 secondes en vitesse normale, trois vitesses), à la différence d'`earthquakes` chaque volcan garde un point de repère permanent hors pulse (333 volcans du catalogue sans éruption datée compris) et une fiche de détail accessible à tout moment (nom, pays, nombre d'éruptions recensées, éruption la plus récente, VEI maximal), 55 éruptions notables annotées au moment de leur pulse (VEI ≥ 6 plus le Vésuve de l'an 79), année simulée affichée avec suffixe av. J.-C./BC (mécanisme propre, hors de portée d'`Intl.DateTimeFormat`), curseur d'année natif et boutons zoomer/dézoomer/réinitialiser (mêmes modèles qu'`earthquakes`), couverture réelle (`public/covers/volcanic-eruptions.jpg`).
- `medical-deserts` (Le désert médical de demain), indicateur APL (accessibilité potentielle localisée) réel aux médecins généralistes de la DREES croisé aux contours communaux data.gouv.fr/IGN (34 728 communes de France métropolitaine après jointure, voir `specs/medical-deserts/data-model.md` pour les statistiques d'exclusion mesurées) : volume de polygones le plus important du site à ce jour, ce qui a fait diverger trois choix techniques du brouillon de cadrage (voir "Rendu" dans `specs/medical-deserts/technical-specifications.md`) — bascule aujourd'hui/demain par fondu CSS entre deux canvas pré-rendus plutôt qu'une interpolation de couleur par commune, survol par un canvas d'index invisible ("color picking", lecture d'un seul pixel) plutôt qu'un test point-dans-polygone, zoom/pan par transformation CSS du calque plutôt qu'un redessin à la projection. Piège de jointure rencontré et corrigé : Paris/Lyon/Marseille découpées par arrondissement dans la source APL mais en un seul polygone dans le fond de carte, ce qui les faisait disparaître silencieusement de la carte ; corrigé en ramenant les codes d'arrondissement au code commune parent et en agrégeant par moyenne pondérée par la population standardisée, méthodologie DREES (voir "Jointure" dans `specs/medical-deserts/data-model.md`). Fond de carte simplifié via `mapshaper` en CLI ponctuel (13,2 Mo → 9,0 Mo, 2,3 Mo compressé), chargement en flux avec indicateur de progression. Palette séquentielle bleue, domaine calé sur la distribution réelle plutôt que le maximum brut (quelques communes très peu peuplées à un seul praticien écrasant sinon le dégradé) ; échelle à trois paliers (déviation documentée par rapport au dégradé linéaire simple du style-guide) concentrant le contraste sous le seuil éditorial de 1,5, pour faire ressortir les communes les plus mal desservies (voir "Palette" dans `specs/medical-deserts/technical-specifications.md`). Couverture réelle (`public/covers/medical-deserts.jpg`).

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

## ✅ 9. Déploiement

`.github/workflows/deploy.yml`, `public/CNAME`, source GitHub Pages réglée sur "GitHub Actions". Voir "Hébergement et déploiement" dans `technical-specifications.md`.

**Critère :** le site est accessible sur `dataviz.heubes.io` après un push sur `main`.

**Statut :** fait (workflow et `CNAME` en place ; nécessite le réglage manuel de la source Pages sur "GitHub Actions" dans les paramètres du repository, non modifiable depuis le code).

**Prompt :**
```
Implémente l'étape 9 du plan de construction (BUILD-PLAN.md) : déploiement.

Crée .github/workflows/deploy.yml et public/CNAME, en suivant "Hébergement et déploiement"
dans technical-specifications.md. Indique-moi de régler manuellement la source GitHub Pages du
repository sur "GitHub Actions" (paramètre du repository, pas modifiable depuis le code).

Critère de fin : après un push sur main, le site est accessible sur https://dataviz.heubes.io
avec la première visualisation réelle de l'étape 8.
```

## ✅ 10. Visualisations liées

Section de tuiles en bas de chaque page de visualisation, proposant jusqu'à trois autres visualisations du même thème. Voir "Visualisations liées" dans `functional-specifications.md` et "Page de visualisation" dans `style-guide.md`.

**Critère :** chaque page de visualisation affiche, après le bloc de crédit, les visualisations partageant un thème avec elle, dans l'ordre spécifié ; la section est absente sur une visualisation seule de son thème.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 10 du plan de construction (BUILD-PLAN.md) : visualisations liées.

Crée src/components/RelatedVisualizations.astro (sélection au build, réutilise VizCard.astro)
et monte-le dans src/pages/[viz].astro et src/pages/fr/[viz].astro, en suivant "Visualisations
liées" dans functional-specifications.md et "Page de visualisation" dans style-guide.md.

Critère de fin : sur chaque page, les tuiles liées respectent la règle de sélection et d'ordre
dans les deux langues ; une visualisation seule de son thème n'affiche aucune section.
```

---

Les trois candidates spécifiées initialement (`specs/biodiversity/`, `specs/bird-migrations/`, `specs/flower-phenology/`) ont été les trois premières implémentées (étape 8, dans l'ordre `bird-migrations` → `flower-phenology` → `biodiversity`), suivies de dix autres (voir la liste ci-dessus).

Chaque étape est un point de commit naturel. Avant de committer, vérifier que l'ensemble de `specs/` reste cohérent avec ce qui vient d'être implémenté (voir "Avant chaque commit" dans `CLAUDE.md`) ; si l'implémentation révèle qu'une spec doit changer, le signaler avant d'appliquer la mise à jour.

## ✅ 11. Téléchargement des données préparées

Liens de téléchargement des fichiers de données principaux, en fin de bloc de crédit des sources, déclarés visualisation par visualisation (attribut `downloads`). Voir "Téléchargement des données préparées" dans `functional-specifications.md`, "Visualisation" dans `data-model.md` et "Page de visualisation" dans `style-guide.md`.

**Critère :** chaque visualisation qui déclare `downloads` affiche un lien par fichier avec sa taille, dans les deux langues ; une visualisation sans `downloads` n'affiche rien ; un fichier déclaré mais absent fait échouer le build.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 11 du plan de construction (BUILD-PLAN.md) : téléchargement des données
préparées.

Ajoute l'attribut optionnel downloads au schéma (src/content/config.ts), crée
src/components/DataDownloads.astro et monte-le en fin de bloc de crédit dans
src/pages/[viz].astro et src/pages/fr/[viz].astro, en suivant "Téléchargement des données
préparées" dans functional-specifications.md et "Page de visualisation" dans style-guide.md.
Déclare les fichiers principaux de chaque visualisation dont les licences le permettent.

Critère de fin : les liens et tailles s'affichent correctement dans les deux langues ; retirer
volontairement un fichier déclaré fait échouer le build.
```

## ✅ 12. État partageable dans l'URL

L'URL de chaque page de visualisation reflète en continu les filtres, la position temporelle (en pause) et le cadrage des cartes zoomables. Ouvrir le lien restaure cet état, y compris après un changement de langue. Voir "État partageable dans l'URL" dans `functional-specifications.md`, "État dans l'URL" dans `technical-specifications.md` et la section du même nom dans chaque `specs/<viz-slug>/technical-specifications.md`.

**Critère :** pour chaque visualisation, manipuler ses contrôles met à jour l'URL sans créer d'entrée d'historique. Rouvrir cette URL dans un nouvel onglet restaure le même état, et une valeur invalide est ignorée sans erreur.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 12 du plan de construction (BUILD-PLAN.md) : état partageable dans l'URL.

Crée src/scripts/url-state.ts (lecture/écriture des paramètres, format commun de cadrage),
reporte la query string dans LanguageSelector.astro et ajoute un <link rel="canonical"> dans
BaseLayout.astro, en suivant "État dans l'URL" dans technical-specifications.md. Branche ensuite
chaque visualisation (lecture au montage, écriture sur action du visiteur) et documente ses
paramètres dans son propre technical-specifications.md.

Critère de fin : pour chaque visualisation, l'URL suit les manipulations et sa réouverture
restaure l'état ; les paramètres invalides sont ignorés sans erreur.
```

## ✅ 13. Page "À propos"

Page `/about/` et `/fr/about/` (démarche, données, partage, fabrication, licence, auteur), accessible depuis un lien du pied de page. Voir `about-page.md` et "Pied de page" dans `style-guide.md`.

**Critère :** la page s'affiche dans les deux langues avec le même texte, le lien du pied de page y mène depuis toutes les pages, et le sélecteur de langue bascule d'une version à l'autre.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 13 du plan de construction (BUILD-PLAN.md) : page "À propos".

Rédige src/content/about/about.fr.md et about.en.md d'après les sections de about-page.md, en
ne décrivant que ce qui est vrai du site, puis crée src/pages/about.astro et
src/pages/fr/about.astro et ajoute le lien au pied de page (voir "Pied de page" dans
style-guide.md).

Critère de fin : la page s'affiche dans les deux langues, le lien du pied de page y mène
depuis toutes les pages, et le sélecteur de langue bascule d'une version à l'autre.
```

## ✅ 14. Validation du contenu entre fichiers

Les règles de `data-model.md` qui portent sur plusieurs fichiers (attributs non localisés identiques entre les deux langues, `lang` cohérent avec le nom de fichier, slug réservé, composant monté pour chaque visualisation) font échouer le build au lieu d'être vérifiées à la main. Voir "Validation des données" dans `technical-specifications.md`.

**Critère :** chacune de ces règles, volontairement enfreinte, fait échouer `npm run build` avec un message qui nomme la visualisation et le champ en cause ; le contenu réel passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 14 du plan de construction (BUILD-PLAN.md) : validation du contenu entre
fichiers.

Crée src/content/validation.ts (validateVisualizations) et appelle-la depuis src/pages/[viz].astro
et src/pages/fr/[viz].astro, en suivant "Validation des données" dans
technical-specifications.md et "Contraintes et règles de validation" dans data-model.md.

Critère de fin : enfreindre volontairement chaque règle fait échouer le build avec un message
précis ; le contenu réel passe.
```

## ✅ 15. Mouvement réduit

Avec la préférence système `prefers-reduced-motion`, les visualisations animées s'ouvrent en pause sur leur état final (ou sur un état documenté quand elles n'en ont pas) et les transitions qui déplacent des éléments deviennent immédiates. Voir "Mouvement réduit" dans `functional-specifications.md`, "Accessibilité" dans `technical-specifications.md` et la puce du même nom dans chaque `specs/<viz-slug>/functional-specifications.md` concerné.

**Critère :** préférence émulée, aucune visualisation ne se met en mouvement d'elle-même, chacune s'ouvre sur l'état documenté sans écrire l'URL, et Lecture relance l'animation ; sans la préférence, rien ne change.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 15 du plan de construction (BUILD-PLAN.md) : mouvement réduit.

Crée src/scripts/reduced-motion.ts (prefersReducedMotion) et branche chaque visualisation animée
sur le chemin déjà utilisé pour restaurer une position temporelle depuis l'URL, en suivant
"Mouvement réduit" dans functional-specifications.md. Rends immédiates les transitions d3 qui
déplacent des éléments. Documente l'état d'ouverture de chaque visualisation dans son
functional-specifications.md.

Critère de fin : préférence émulée, aucune visualisation ne bouge d'elle-même et chacune
s'ouvre sur l'état documenté ; sans la préférence, rien ne change.
```

## ✅ 16. Polices et icônes hébergées par le site

La police Ubuntu (woff2, sous-ensembles latin et latin-ext) est servie depuis `public/fonts/ubuntu/`, et les quatre icônes Creative Commons du pied de page sont des SVG inline : ni Google Fonts, ni Font Awesome sur CDN. Voir "Polices" et "Dépendances" dans `technical-specifications.md`, "Iconographie" dans `style-guide.md`.

**Critère :** afficher n'importe quelle page ne déclenche aucune requête vers un autre domaine, et le rendu (police, icônes du pied de page) reste identique.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 16 du plan de construction (BUILD-PLAN.md) : polices et icônes hébergées
par le site.

Télécharge une fois les woff2 d'Ubuntu (300/400/500/700, sous-ensembles latin et latin-ext) et
leur licence dans public/fonts/ubuntu/, déclare-les en @font-face dans global.css, remplace les
icônes Font Awesome du pied de page par leurs tracés SVG inline et retire les liens CDN de
BaseLayout.astro, en suivant "Polices" dans technical-specifications.md et "Iconographie" dans
style-guide.md.

Critère de fin : aucune requête vers un autre domaine à l'affichage d'une page, rendu inchangé.
```

## ✅ 17. Vérification des types au build

Le script `build` enchaîne `astro check && astro build` : une erreur de type dans un fichier `.ts` ou `.astro` fait échouer le build, donc le déploiement, avant toute publication. Le dictionnaire français est vérifié contre l'anglais (`satisfies typeof en`). Voir "Hébergement et déploiement", "Dépendances" et "Textes d'interface" dans `technical-specifications.md`.

**Critère :** une erreur de type volontaire dans un fichier `.astro`, ou une clé présente dans un seul des deux dictionnaires, fait échouer `npm run build` ; le code réel passe.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 17 du plan de construction (BUILD-PLAN.md) : vérification des types au build.

Ajoute @astrojs/check en dépendance de développement, fais précéder astro build de astro check
dans le script build du package.json, et déclare le dictionnaire français satisfies typeof en,
en suivant "Hébergement et déploiement" et "Textes d'interface" dans technical-specifications.md.

Critère de fin : une erreur de type volontaire (fichier .astro, clé i18n manquante) fait échouer
npm run build ; le code réel passe.
```

## ✅ 18. Surveillance des liens des sources

Chaque semaine, un workflow GitHub vérifie les URL des jeux de données et échoue si l'une est cassée (404, 410, 5xx persistant, domaine introuvable). Les réponses qui ne disent rien de l'existence de la source (anti-robots, limitation, certificat, délai) sont listées sans faire échouer le run. Voir "Surveillance des sources" dans `technical-specifications.md`.

**Critère :** `npm run check-links` classe correctement les URL réelles (aucune cassée, les indéterminées identifiées) ; une URL volontairement cassée fait sortir le script en erreur.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 18 du plan de construction (BUILD-PLAN.md) : surveillance des liens des
sources.

Crée scripts/check-source-links.mjs (Node, sans dépendance) et
.github/workflows/check-source-links.yml (hebdomadaire et à la demande), en suivant
"Surveillance des sources" dans technical-specifications.md.

Critère de fin : les URL réelles sont correctement classées, et une URL volontairement cassée
fait échouer le script.
```

## ✅ 19. Types des modules d3

Déclarations de types des modules `d3-*` et de `topojson-client` (`@types/*`, dépendances de développement), pour que `astro check` vérifie les appels d3 au lieu de les laisser en `any`, et retrait des 81 `as any` qui court-circuitaient cette vérification aux appels d3. Voir "Dépendances" dans `technical-specifications.md`.

**Critère :** `astro check` ne signale plus aucune déclaration de types manquante, le code de rendu ne contient plus de `as any`, et les interactions (zoom, molette, glisser, transitions) se comportent comme avant.

**Statut :** fait.

**Prompt :**
```
Implémente l'étape 19 du plan de construction (BUILD-PLAN.md) : types des modules d3.

Ajoute en dépendances de développement les paquets @types correspondant à chaque module d3
utilisé et à topojson-client, retire les `as any` des appels d3 en corrigeant les types au lieu
de les contourner, et retire les commentaires devenus faux sur l'absence de types, en suivant "Dépendances" dans
technical-specifications.md.

Critère de fin : astro check ne signale plus de déclaration manquante et passe sans erreur.
```
