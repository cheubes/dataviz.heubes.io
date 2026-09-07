# Spécifications fonctionnelles générales

## Contexte et objectifs

Le site présente un catalogue de visualisations de données interactives et originales, chacune explorant un dataset open data avec une mise en forme qui lui est propre : il n'y a pas de gabarit générique rejoué dataset après dataset, chaque visualisation est une pièce à part entière.

L'objectif est de donner à un visiteur curieux un point d'entrée vers ce catalogue, puis de lui permettre d'explorer chaque visualisation de façon interactive : comprendre le dataset qui la nourrit et manipuler la représentation choisie pour lui.

## Périmètre du projet

Dans le périmètre :

- Consultation du catalogue de visualisations, depuis la page d'accueil.
- Consultation, pour chaque visualisation, de sa page dédiée : présentation du dataset source, du contexte de la mise en forme choisie, et interaction avec la visualisation elle-même.
- Site multilingue (français, anglais).

Voir aussi "Hors périmètre" ci-dessous.

## Utilisateurs cibles

Le site s'adresse à des visiteurs curieux de dataviz et d'open data. Il n'y a pas de distinction de rôle côté visiteur : pas de compte, pas d'espace personnel, pas de contenu personnalisé.

Le contenu (catalogue, visualisations) est produit par l'auteur du site directement dans le code et les données sources (voir `data-model.md`), pas via une interface d'administration.

## Parcours utilisateurs principaux

1. Un visiteur arrive sur la page d'accueil, parcourt le catalogue de visualisations (voir `home-page.md`).
2. Il choisit une visualisation qui l'intéresse et accède à sa page dédiée.
3. Il découvre le contexte du dataset (source, licence, angle choisi) puis interagit avec la visualisation.
4. Il revient au catalogue pour explorer une autre visualisation.
5. Un visiteur peut aussi arriver directement sur la page d'une visualisation via un lien partagé, sans passer par l'accueil.

## Règles transverses

### Multilingue

- Le site est disponible en français et en anglais.
- Au premier accès, la langue est déterminée par celle du navigateur ; si le navigateur indique une autre langue que le français ou l'anglais, le site démarre en anglais. Un changement manuel de langue via le sélecteur est mémorisé pour les visites suivantes (voir "Architecture" dans `technical-specifications.md` pour le mécanisme de stockage). Cette détection et cette mémorisation s'appliquent à toute page, y compris une page de visualisation ouverte directement via un lien partagé (voir parcours 5 ci-dessus) : si l'équivalent de cette page n'existe pas dans la langue détectée ou mémorisée, le visiteur atterrit sur le message d'indisponibilité plutôt que sur le contenu partagé.
- Un sélecteur de langue, accessible depuis toutes les pages, permet de basculer d'une langue à l'autre. Il conserve le contexte de navigation quand le contenu existe dans l'autre langue ; sinon, la page affiche un message indiquant que ce contenu n'est pas encore disponible dans cette langue (voir "Contenu non traduit" dans `technical-specifications.md`).
- Une visualisation non traduite dans la langue courante n'apparaît pas dans le catalogue de cette langue.
- Le texte de présentation d'une visualisation (titre, résumé, légendes, textes d'interaction) est disponible dans les deux langues. Les données elles-mêmes ne sont pas systématiquement traduites quand leur nature ne s'y prête pas (ex : noms de communes, catégories officielles d'un dataset) ; chaque `<viz-slug>/functional-specifications.md` précise, le cas échéant, ce qui reste non traduit et pourquoi.

### Navigation

- Chaque page permet de revenir à la page d'accueil du site.

## Hors périmètre

- Comptes utilisateurs, authentification.
- Édition de contenu via une interface web : le contenu est créé et modifié directement dans les fichiers sources (voir `data-model.md`).
- Contenu généré par les visiteurs (commentaires, contributions).
- Recherche et filtrage transverse du catalogue : à réévaluer quand le nombre de visualisations le justifiera, non nécessaire tant que le catalogue reste restreint.
