# Spécifications fonctionnelles générales

## Contexte et objectifs

Le site présente un catalogue de visualisations de données interactives et originales, chacune explorant un dataset open data avec une mise en forme qui lui est propre : il n'y a pas de gabarit générique rejoué dataset après dataset, chaque visualisation est une pièce à part entière.

L'objectif est de donner à un visiteur curieux un point d'entrée vers ce catalogue, puis de lui permettre d'explorer chaque visualisation de façon interactive : comprendre le dataset qui la nourrit et manipuler la représentation choisie pour lui.

## Périmètre du projet

Dans le périmètre :

- Consultation du catalogue de visualisations, depuis la page d'accueil.
- Filtrage du catalogue par thème, depuis la page d'accueil (voir `home-page.md`).
- Consultation, pour chaque visualisation, de sa page dédiée : présentation du dataset source, du contexte de la mise en forme choisie, et interaction avec la visualisation elle-même.
- Accès, depuis la page d'une visualisation, aux autres visualisations qui partagent un thème avec elle (voir "Visualisations liées" ci-dessous).
- Téléchargement, depuis la page d'une visualisation, des données préparées qu'elle consomme, quand l'auteur les déclare téléchargeables (voir "Téléchargement des données préparées" ci-dessous).
- Page "À propos" : démarche, données, fabrication et licence du site (voir `about-page.md`).
- Site multilingue (français, anglais).

Voir aussi "Hors périmètre" ci-dessous.

## Utilisateurs cibles

Le site s'adresse à des visiteurs curieux de dataviz et d'open data. Il n'y a pas de distinction de rôle côté visiteur : pas de compte, pas d'espace personnel, pas de contenu personnalisé.

Le contenu (catalogue, visualisations) est produit par l'auteur du site directement dans le code et les données sources (voir `data-model.md`), pas via une interface d'administration.

## Parcours utilisateurs principaux

1. Un visiteur arrive sur la page d'accueil, parcourt le catalogue de visualisations (voir `home-page.md`).
2. Il choisit une visualisation qui l'intéresse et accède à sa page dédiée.
3. Il découvre le contexte du dataset (source, licence, angle choisi) puis interagit avec la visualisation.
4. Il revient au catalogue, ou poursuit directement vers l'une des visualisations liées proposées en bas de page (voir "Visualisations liées" ci-dessous), pour explorer une autre visualisation.
5. Un visiteur peut aussi arriver directement sur la page d'une visualisation via un lien partagé, sans passer par l'accueil.

## Règles transverses

### Multilingue

- Le site est disponible en français et en anglais.
- Au premier accès à une URL sans préfixe de langue (anglais par défaut), la langue affichée est déterminée par celle du navigateur ; si le navigateur indique une autre langue que le français ou l'anglais, le site reste en anglais. Une URL explicitement préfixée par `/fr/` affiche toujours le français dès ce premier accès : la détection du navigateur ne s'applique qu'à l'entrée par défaut (non préfixée), jamais pour écarter un choix de langue explicite dans l'URL, y compris une page de visualisation ouverte directement via un lien partagé (voir parcours 5 ci-dessus). Un changement manuel de langue via le sélecteur est mémorisé pour les visites suivantes et prime alors sur l'URL visitée (voir "Architecture" dans `technical-specifications.md` pour le mécanisme de stockage). Si l'équivalent de la page visitée n'existe pas dans la langue déterminée ou mémorisée, le visiteur atterrit sur le message d'indisponibilité plutôt que sur le contenu partagé.
- Un sélecteur de langue, accessible depuis toutes les pages, permet de basculer d'une langue à l'autre. Il conserve le contexte de navigation quand le contenu existe dans l'autre langue ; sinon, la page affiche un message indiquant que ce contenu n'est pas encore disponible dans cette langue (voir "Contenu non traduit" dans `technical-specifications.md`).
- Une visualisation non traduite dans la langue courante n'apparaît pas dans le catalogue de cette langue.
- Le texte de présentation d'une visualisation (titre, résumé, légendes, textes d'interaction) est disponible dans les deux langues. Les données elles-mêmes ne sont pas systématiquement traduites quand leur nature ne s'y prête pas (ex : noms de communes, catégories officielles d'un dataset) ; chaque `<viz-slug>/functional-specifications.md` précise, le cas échéant, ce qui reste non traduit et pourquoi.

### Navigation

- Chaque page permet de revenir à la page d'accueil du site.
- Chaque page donne accès à la page "À propos", depuis le pied de page (voir `about-page.md`).

### Visualisations liées

En bas de la page d'une visualisation, une section propose jusqu'à trois autres visualisations qui partagent au moins un thème avec elle (voir "Thème" dans `data-model.md`). Elle sert notamment le visiteur arrivé par un lien partagé (parcours 5), qui n'est pas passé par le catalogue.

- Candidates : les visualisations disponibles dans la langue courante, hors visualisation courante, partageant au moins un thème avec elle. Une visualisation non traduite dans la langue courante n'est jamais proposée : une tuile liée ne mène jamais au message d'indisponibilité.
- Ordre : nombre de thèmes partagés décroissant, puis date de publication (`publication-date`) décroissante, puis `slug` alphabétique pour départager de façon stable. Les trois premières sont retenues.
- Aucune candidate (ex : seule visualisation de son thème) : la section est entièrement absente, titre compris. On ne la complète pas avec des visualisations sans rapport thématique.
- La sélection est déterminée à la génération du site : identique pour tous les visiteurs, ni aléatoire ni personnalisée.

Affichage : voir "Page de visualisation" dans `style-guide.md`.

### Téléchargement des données préparées

La page d'une visualisation peut proposer au téléchargement les fichiers de données préparées qu'elle consomme (sous `public/data/<viz-slug>/`, voir `data-model.md`), pour prolonger l'exploration hors du site.

- Opt-in explicite : seuls les fichiers listés dans l'attribut `downloads` de la visualisation sont proposés (voir "Visualisation" dans `data-model.md`). Une visualisation sans `downloads` n'affiche aucun lien.
- Ce qui est proposé : les fichiers de données principaux, pas les couches de contexte (fond de carte, cours d'eau, routes, relief, illustrations), qui relèvent du décor et ne sont pas toujours créditées dans `datasets`.
- Licences : avant de déclarer un fichier, l'auteur vérifie que les licences des sources dont il dérive autorisent sa redistribution. Une source sous droits réservés exclut la visualisation (ex : `endangered-species`). Une source non commerciale ou sans licence formalisée mais autorisant la redistribution avec citation reste acceptable : le site est lui-même non commercial, et les licences sont affichées juste au-dessus, dans le bloc de crédit des sources. Une mention rappelle que la réutilisation reste soumise à ces licences.
- Format : les fichiers sont proposés tels que la visualisation les consomme, sans conversion (pas d'export CSV dédié) ni documentation de leur format côté site. Leur structure est pensée pour le rendu, pas pour la réutilisation.
- Chaque fichier est présenté avec son nom et sa taille, pour que le visiteur sache ce qu'il télécharge avant de cliquer (certains fichiers dépassent 10 Mo).

Affichage : voir "Page de visualisation" dans `style-guide.md`.

### État partageable dans l'URL

L'URL de la page d'une visualisation reflète en continu l'état choisi par le visiteur. Copier l'adresse du navigateur suffit pour partager exactement ce qu'il voit, et ouvrir ce lien restaure cet état (parcours 5). Il n'y a pas de bouton de partage dédié.

- État capturé :
  - les filtres et bascules (régions, espèces, groupes, saison, mode d'affichage, recherche…) ;
  - la position temporelle (année, mois) des visualisations animées ;
  - le cadrage (niveau de zoom et centre) des cartes zoomables.
- État non capturé :
  - la vitesse de lecture ;
  - les survols et infobulles ;
  - toute bascule qui déclenche des appels à un service tiers : un lien partagé ne doit pas provoquer de requête externe sans action du visiteur.
- URL minimale : seuls les éléments qui diffèrent de l'état par défaut apparaissent dans l'URL. Une visualisation dans son état initial garde une URL nue.
- Position temporelle : elle n'apparaît dans l'URL que quand la lecture est en pause, que ce soit par le bouton ou par une manipulation du curseur. La reprise de la lecture la retire. Un lien qui porte une position temporelle ouvre la visualisation en pause sur ce moment. Une visualisation dont l'image en pause n'a pas de sens peut s'en écarter (ex : des impulsions éphémères qui s'effacent aussitôt la lecture arrêtée) : elle documente et justifie alors son propre comportement.
- Valeurs invalides ou inconnues (lien tronqué, identifiant disparu, année hors bornes) : chaque paramètre invalide est ignoré silencieusement et remplacé par sa valeur par défaut, et les paramètres valides restent appliqués. Pas de message d'erreur.
- Historique : ces mises à jour ne créent pas d'entrée dans l'historique du navigateur. Le bouton "précédent" quitte la page au lieu de rejouer chaque clic sur un filtre.
- Changement de langue : l'état est conservé. Les paramètres sont les mêmes dans les deux langues (voir "Multilingue" ci-dessus).

Chaque visualisation liste ses propres paramètres dans son `technical-specifications.md` (section "État dans l'URL"). Mécanisme commun : voir "État dans l'URL" dans `technical-specifications.md`.

## Hors périmètre

- Comptes utilisateurs, authentification.
- Édition de contenu via une interface web : le contenu est créé et modifié directement dans les fichiers sources (voir `data-model.md`).
- Contenu généré par les visiteurs (commentaires, contributions).
- Recherche texte libre transverse du catalogue : à réévaluer quand le nombre de visualisations le justifiera davantage ; le filtrage par thème (voir `home-page.md`) couvre le besoin de navigation par sujet pour l'instant.
