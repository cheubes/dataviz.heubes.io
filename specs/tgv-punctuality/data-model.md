# Modèle de données : Le pouls du réseau

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

Deux jeux de données SNCF (data.sncf.com), tous deux sous licence **Open Database License (ODbL)** :

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Régularité mensuelle TGV par liaisons | SNCF Voyageurs | https://ressources.data.sncf.com/explore/dataset/regularite-mensuelle-tgv-aqst/ | Open Database License (ODbL) | À renseigner à l'implémentation |
| Liste des gares | SNCF Réseau | https://ressources.data.sncf.com/explore/dataset/liste-des-gares/ | Open Database License (ODbL) | À renseigner à l'implémentation |

Le premier jeu recense 12 544 enregistrements (une ligne par liaison et par mois) au moment de la vérification de cadrage, mis à jour semestriellement. Le second (6 469 gares du réseau ferré national, toutes fonctions confondues) sert uniquement à géolocaliser les gares référencées dans le premier (voir "Jointure gares" ci-dessous), pas comme source de contenu propre à cette visualisation.

## Périmètre retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **TGV uniquement**, ni TER ni Intercités — réseau national cohérent, nombre de liaisons maîtrisable, correspondant à l'angle "réseau ferroviaire stylisé" retenu (voir `functional-specifications.md`). Toutes les liaisons présentes dans le dataset de régularité sont retenues, sans sélection manuelle (à la différence de `bird-migrations` ou `glacier-retreat`) : le dataset lui-même délimite déjà l'ensemble pertinent.

## Champs source utilisés

| Champ `regularite-mensuelle-tgv-aqst` | Usage |
|---|---|
| `date` | Position sur la chronologie (curseur de mois, voir "Interactions" dans `functional-specifications.md`) |
| `gare_depart`, `gare_arrivee` | Identification de la liaison, jointure avec `liste-des-gares` (voir "Jointure gares" ci-dessous) |
| `nb_train_prevu` | Épaisseur du trait (volume de circulation, voir "Rendu" dans `technical-specifications.md`) |
| `nb_annulation` | Exclu du dénominateur du taux de ponctualité (voir "Taux de ponctualité" ci-dessous), affiché dans la fiche de détail |
| `nb_train_retard_sup_15` | Numérateur du taux de ponctualité |
| `retard_moyen_arrivee` | Fiche de détail |
| `prct_cause_externe`, `prct_cause_infra`, `prct_cause_gestion_trafic`, `prct_cause_materiel_roulant`, `prct_cause_gestion_gare`, `prct_cause_prise_en_charge_voyageurs` | Répartition des causes de retard, fiche de détail uniquement (voir "Interactions" dans `functional-specifications.md` : la couleur de la liaison encode le taux de ponctualité, pas la cause dominante, décision explicite de l'utilisateur) |

| Champ `liste-des-gares` | Usage |
|---|---|
| `libelle` | Jointure avec `gare_depart`/`gare_arrivee` |
| `geo_point_2d` | Position de la gare sur la carte |

## Taux de ponctualité

Calculé au prétraitement, pas fourni tel quel par la source : `1 - (nb_train_retard_sup_15 / (nb_train_prevu - nb_annulation))`, exprimé en pourcentage. Les trains annulés sont exclus du dénominateur (convention standard de régularité ferroviaire, un train annulé n'est ni à l'heure ni en retard). Une liaison dont tous les trains du mois ont été annulés (dénominateur nul) est exclue de ce mois plutôt que de produire une division par zéro (voir "Contraintes de validation" ci-dessous).

## Jointure gares

**À l'implémentation :** `gare_depart`/`gare_arrivee` (texte libre, ex. "PARIS LYON", "MARSEILLE ST CHARLES") et `libelle` du référentiel des gares ne sont pas garantis identiques caractère pour caractère (casse, accents, abréviations). Établir la correspondance par normalisation (majuscules, sans accents) en première passe, puis une table de correspondance manuelle pour les cas non résolus automatiquement — même logique que le regroupement des codes `OWNER` dans `satellites-in-orbit` ou des genres dans `paris-trees`. Documenter ici la liste des correspondances manuelles une fois établie.

## Prétraitement (réalisé à l'implémentation, hors build)

1. Récupérer l'export complet du dataset de régularité et celui du référentiel des gares.
2. Établir la jointure entre les noms de gares des deux jeux (voir "Jointure gares" ci-dessus).
3. Calculer le taux de ponctualité par liaison et par mois (voir "Taux de ponctualité" ci-dessus).
4. Regrouper les enregistrements par liaison (paire gare de départ/arrivée), chaque liaison portant sa série mensuelle.
5. Écrire `public/data/tgv-punctuality/network.json`.

## Format de sortie

```json
{
  "generatedAt": "2026-09-08",
  "stations": [
    { "id": "paris-lyon", "name": "Paris Lyon", "lat": 48.844, "lng": 2.374 },
    { "id": "marseille-st-charles", "name": "Marseille St Charles", "lat": 43.303, "lng": 5.381 }
  ],
  "links": [
    {
      "from": "paris-lyon",
      "to": "marseille-st-charles",
      "byMonth": {
        "2019-01": { "punctualityPct": 84.2, "trainsScheduled": 312, "trainsCancelled": 4, "avgDelayMin": 6.1, "causes": { "externe": 30, "infra": 15, "gestionTrafic": 10, "materielRoulant": 20, "gestionGare": 15, "priseEnChargeVoyageurs": 10 } }
      }
    }
  ]
}
```

`stations` référencées par `id` depuis `links` (évite de répéter nom et coordonnées sur chaque liaison et chaque mois). Un mois absent de `byMonth` pour une liaison donnée signifie qu'aucune circulation n'a eu lieu ce mois-là ou que le dénominateur du taux de ponctualité était nul (voir "Taux de ponctualité" ci-dessus), pas une valeur nulle à afficher comme telle.

## Contraintes de validation propres à cette visualisation

- Chaque `from`/`to` référencé dans `links` existe dans `stations`.
- Une liaison sans aucun mois exploitable dans `byMonth` (toutes annulées, ou jointure de gare non résolue) est exclue de `links` plutôt que présente avec un objet vide.
- Les clés de `byMonth` sont au format `AAAA-MM`, cohérentes avec la couverture temporelle réelle du dataset source (voir "Points à valider à l'implémentation" dans `technical-specifications.md`).
