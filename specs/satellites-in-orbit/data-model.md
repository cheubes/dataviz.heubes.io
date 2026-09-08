# Modèle de données : La ruée vers l'orbite

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : brouillon de cadrage, pas encore implémenté.** Plusieurs points restent à finaliser sur les données réelles (voir marqueurs « à l'implémentation » ci-dessous).

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Satellite Catalog (SATCAT) | CelesTrak | https://celestrak.org/satcat/ | Non formalisée par CelesTrak ; données d'origine USSPACECOM (Space-Track.org), redistribution de données dérivées admise sous réserve de citation appropriée (voir note ci-dessous) | À renseigner à l'implémentation |

**Note sur la licence :** CelesTrak ne publie pas de licence explicite (pas de CC, pas de mention domaine public) pour le catalogue SATCAT. Les données proviennent in fine de l'US Space Force via Space-Track.org, dont l'accord utilisateur admet la redistribution de données de base (dont le SATCAT) sous condition de citation appropriée à l'USSPACECOM, tout en réservant un régime d'approbation préalable pour d'autres formes de transfert. Décision prise avec l'utilisateur (voir échanges de cadrage) : poursuivre sur cette source, en citant explicitement CelesTrak et l'USSPACECOM/Space-Track.org dans le bloc de crédit des sources (voir "Page de visualisation" dans `style-guide.md`), le dataset publié ici étant une agrégation dérivée (comptes par zone et par date) plutôt qu'une republication brute du catalogue, sur un site non commercial (CC BY-NC-SA). Ce n'est pas une lecture juridique définitive : à revisiter si un usage plus étendu de la source est envisagé un jour.

## Périmètre retenu

Décidé explicitement avec l'utilisateur (voir échanges de cadrage) : **payloads en orbite, actifs et inactifs, hors débris et étages de fusée**. Traduit dans le filtre SATCAT par :

- `OBJECT_TYPE = PAY` (charge utile, exclut `R/B` étage de fusée, `DEB` débris, `UNK` inconnu) ;
- `DECAY_DATE` vide (objet toujours en orbite au moment de la récupération, qu'il soit encore actif ou non).

Le statut opérationnel (`OPS_STATUS_CODE`) n'entre pas dans le filtre : un satellite hors service mais toujours en orbite reste compté, conformément au périmètre retenu.

## Champs SATCAT utilisés

| Champ CelesTrak | Usage |
|---|---|
| `OBJECT_TYPE` | Filtrage du périmètre (garder seulement `PAY`) |
| `DECAY_DATE` | Filtrage du périmètre (garder seulement les objets sans date de désorbitation) |
| `OWNER` | Attribution à l'une des cinq zones de lancement (voir "Regroupement géographique" ci-dessous) |
| `LAUNCH_DATE` | Position de l'objet sur la chronologie simulée |

`OBJECT_NAME` et `NORAD_CAT_ID` ne sont pas repris dans le format de sortie : pas de fiche par satellite individuel dans cette visualisation (voir "Interactions" dans `functional-specifications.md`), donc pas de raison de les transporter jusqu'au client.

## Regroupement géographique

Cinq zones, décidées explicitement avec l'utilisateur (voir échanges de cadrage) : **États-Unis, Russie/URSS, Chine, Europe, reste du monde**.

**À l'implémentation :** établir la table de correspondance entre les codes `OWNER` réels du catalogue et ces cinq zones, à partir d'une inspection du jeu de données récupéré (au minimum : `US` → États-Unis ; `PRC` → Chine ; `CIS` et les codes historiques liés à l'URSS/la Russie → Russie/URSS ; codes nationaux européens et codes multinationaux type `ESA` → Europe ; tout le reste, y compris les organisations multinationales non européennes, → reste du monde). Un objet dont le code `OWNER` ne trouve pas de correspondance connue tombe dans "reste du monde" plutôt que de faire échouer le prétraitement.

## Prétraitement (réalisé à l'implémentation, hors build)

Un script de prétraitement, dans l'esprit de ceux des autres visualisations (voir `data-model.md` de `bird-migrations` ou `biodiversity`), rejoué manuellement plutôt qu'à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) :

1. Récupérer le catalogue SATCAT complet depuis CelesTrak (`records.php`, format JSON), en respectant la politique d'usage du site (une requête ponctuelle, pas de sondage répété — voir "Source des données" dans `technical-specifications.md` de cette visualisation).
2. Filtrer selon le périmètre retenu (`OBJECT_TYPE = PAY`, `DECAY_DATE` vide).
3. Attribuer une zone à chaque objet retenu à partir de `OWNER` (voir "Regroupement géographique" ci-dessus).
4. Réduire chaque objet retenu à `{ regionId, launchDate }` (voir "Format de sortie" ci-dessous) et écrire `public/data/satellites-in-orbit/satellites.json`.

Volume attendu de l'ordre de dix à quinze mille objets une fois le filtre appliqué (à confirmer avec le chiffre réel une fois le catalogue récupéré) ; taille du fichier de sortie à mesurer à l'implémentation, avec une piste de compaction (ex : identifiant de zone en index numérique plutôt qu'en chaîne, date en jours écoulés depuis une origine plutôt qu'en chaîne ISO) si elle s'avère nécessaire.

## Format de sortie

```json
{
  "generatedAt": "2026-09-08",
  "regions": [
    { "id": "us", "nameFr": "États-Unis", "nameEn": "United States" },
    { "id": "russia-ussr", "nameFr": "Russie / URSS", "nameEn": "Russia / USSR" },
    { "id": "china", "nameFr": "Chine", "nameEn": "China" },
    { "id": "europe", "nameFr": "Europe", "nameEn": "Europe" },
    { "id": "other", "nameFr": "Reste du monde", "nameEn": "Rest of the world" }
  ],
  "satellites": [
    { "regionId": "us", "launchDate": "1958-01-31" },
    { "regionId": "russia-ussr", "launchDate": "1957-10-04" }
  ]
}
```

`regionId` en kebab-case anglais (voir conventions générales de `data-model.md`) ; la couleur de chaque zone n'est pas stockée dans les données (voir palette dans `technical-specifications.md` de cette visualisation), assignée côté client par ordre d'apparition dans `regions`. `generatedAt` documente la date de récupération du catalogue source (les objets en orbite évoluent en continu), reprise comme `retrieved` du dataset une fois connue.

## Champs dérivés côté client (pas dans le JSON)

- **Compte total à l'instant simulé courant :** nombre de `satellites` dont `launchDate` est antérieure ou égale à la date simulée, parmi les zones actives (voir "Filtre zone" dans `functional-specifications.md`).
- **Compte par zone :** idem, décomposé par `regionId`, pour la légende (voir "Contenu" dans `functional-specifications.md`).

## Contraintes de validation propres à cette visualisation

- Chaque `regionId` référencé dans `satellites` existe dans `regions`.
- `satellites` est trié par `launchDate` croissante (simplifie l'accumulation progressive à la lecture, voir "Animation" dans `technical-specifications.md`).
- Un objet sans `OWNER` reconnu est présent avec `regionId: "other"`, jamais absent silencieusement du fichier de sortie.
