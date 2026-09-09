# Modèle de données : La ruée vers l'orbite

Complète `data-model.md` général : schéma du dataset propre à cette visualisation.

**Statut : implémenté.**

## Dataset source

| `name` | `publisher` | `url` | `license` | `retrieved` |
|---|---|---|---|---|
| Satellite Catalog (SATCAT) | CelesTrak | https://celestrak.org/satcat/ | Non formalisée par CelesTrak ; données d'origine USSPACECOM (Space-Track.org), redistribution de données dérivées admise sous réserve de citation appropriée (voir note ci-dessous) | 2026-09-09 |

**Note sur la licence :** CelesTrak ne publie pas de licence explicite (pas de CC, pas de mention domaine public) pour le catalogue SATCAT. Les données proviennent in fine de l'US Space Force via Space-Track.org, dont l'accord utilisateur admet la redistribution de données de base (dont le SATCAT) sous condition de citation appropriée à l'USSPACECOM, tout en réservant un régime d'approbation préalable pour d'autres formes de transfert. Décision prise avec l'utilisateur (voir échanges de cadrage) : poursuivre sur cette source, en citant explicitement CelesTrak et l'USSPACECOM/Space-Track.org dans le bloc de crédit des sources (voir "Page de visualisation" dans `style-guide.md`), le dataset publié ici étant une agrégation dérivée (comptes par zone et par date) plutôt qu'une republication brute du catalogue, sur un site non commercial (CC BY-NC-SA). Ce n'est pas une lecture juridique définitive : à revisiter si un usage plus étendu de la source est envisagé un jour.

Lecture confirmée à l'implémentation par la documentation publique de Space-Track (`space-track.org/documentation#/agreement`) : « USSPACECOM has provided express blanket approval for transfer/redistribution of basic SSA data and services accessed via www.Space-Track.org conditioned on appropriate citation », le SATCAT étant explicitement cité parmi les « basic SSA data » couvertes ; toute autre forme de transfert reste soumise à approbation préalable (« The User agrees not to transfer any data or technical information received from this website [...] to any other entity without prior express approval »).

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

Table de correspondance établie à partir du catalogue réel récupéré (106 codes `OWNER` distincts parmi les objets retenus) :

- `US` → États-Unis.
- `CIS` → Russie/URSS (seul code du catalogue couvrant aussi bien l'URSS que la Russie post-1991 ; pas de code `RUS` distinct dans les données récupérées).
- `PRC` → Chine.
- Codes nationaux européens (géoschéma UN M49, Russie exclue par construction puisqu'elle a sa propre zone ci-dessus) et les deux agences intergouvernementales paneuropéennes du secteur (`ESA`, `EUME` = EUMETSAT) → Europe : `UK`, `FR`, `GER`, `IT`, `SPN`, `FIN`, `NOR`, `GREC`, `POL`, `SWED`, `LUXE`, `NETH`, `POR`, `BEL`, `DEN`, `SWTZ`, `CZCH`, `UKR`, `BUL`, `HUN`, `SVK`, `SVN`, `ASRA`, `EST`, `HRV`, `ROM`, `MNE`, `BELA`, `LTU`, `ESA`, `EUME`.
- Tout le reste → reste du monde. Notamment tous les codes d'opérateurs commerciaux ou de consortiums multinationaux (`SES`, `EUTE`/Eutelsat, `ITSO`/Intelsat, `O3B`, `IM`/Inmarsat, `GLOB`/Globalstar, `ORB`/Orbcomm, `AB`/Arabsat, `AC`/AsiaSat, `ABS`, `NATO`...) : ce ne sont pas des nations qui lancent, et leur inclure une nationalité précise (ex : `GLOB` → États-Unis, siège de Globalstar) casserait la règle simple "code pays ou agence paneuropéenne officielle" ci-dessus au prix d'arbitrages peu défendables au cas par cas (`SES` est enregistrée au Luxembourg mais à capital international, `ITSO`/Intelsat a son siège au Luxembourg mais une gouvernance historiquement mondiale...). Également dans "reste du monde" : les codes de coentreprises bi/multinationales dont un partenaire au moins est hors Europe (`CHBZ` Chine-Brésil, `STCT` Singapour-Taïwan, `GRSA` Grèce-Arabie saoudite, `RASC` organisation africaine RASCOM), les pays hors géoschéma Europe de l'ONU (dont `TURK` Turquie et `KAZ` Kazakhstan, respectivement Asie occidentale et Asie centrale dans ce géoschéma), et `TBD` (code temporaire "à déterminer").
- Exception documentée : `FGER` (programme franco-allemand Symphonie) et `FRIT` (programme franco-italien Athena-Fidus/Sicral 2) sont des programmes bilatéraux intergouvernementaux entre deux États déjà classés Europe ci-dessus → Europe, malgré leur code à part.

Un objet dont le code `OWNER` ne trouve pas de correspondance dans cette liste tombe dans "reste du monde" plutôt que de faire échouer le prétraitement (règle de repli, aucun cas rencontré en pratique sur le catalogue récupéré : les 106 codes ont tous été classés explicitement).

## Prétraitement (réalisé à l'implémentation, hors build)

Un script de prétraitement, dans l'esprit de ceux des autres visualisations (voir `data-model.md` de `bird-migrations` ou `biodiversity`), rejoué manuellement plutôt qu'à chaque build (voir "Règles communes à toutes les visualisations" dans `technical-specifications.md` général) :

1. Récupérer le catalogue SATCAT complet depuis CelesTrak, au format CSV documenté (`https://celestrak.org/pub/satcat.csv`, voir "SATCAT Format Documentation" sur `celestrak.org/satcat/satcat-format.php`) plutôt que `records.php` : c'est le format que CelesTrak recommande explicitement pour ce type de téléchargement complet ("Raw SATCAT Data" sur `celestrak.org/satcat/`), et le format CSV est cité dans la politique d'usage du site comme la version à privilégier (les formats texte hérités seront limités par le dépassement des numéros de catalogue à 5 chiffres, en cours au moment de cette récupération). Requête ponctuelle, pas de sondage répété, conforme à la politique d'usage (voir "Source des données" dans `technical-specifications.md` de cette visualisation). 70 587 lignes récupérées le 2026-09-09.
2. Filtrer selon le périmètre retenu (`OBJECT_TYPE = PAY`, `DECAY_DATE` vide) → 20 020 objets retenus.
3. Attribuer une zone à chaque objet retenu à partir de `OWNER` (voir "Regroupement géographique" ci-dessus).
4. Réduire chaque objet retenu à `{ regionId, launchDate }` (voir "Format de sortie" ci-dessous), trier par `launchDate` croissante et écrire `public/data/satellites-in-orbit/satellites.json`.

Volume réel : 20 020 objets, plus élevé que l'estimation initiale (dix à quinze mille) — la fourchette basse ne tenait pas compte des satellites hors service mais toujours en orbite (`OPS_STATUS_CODE` hors filtre par choix de périmètre, voir "Périmètre retenu" ci-dessus), qui pèsent significativement dans le total. Répartition : États-Unis 13 723, Chine 1 577, Russie/URSS 1 713, Europe 1 434, reste du monde 1 573. Fichier de sortie : 892 Ko, en deçà des autres jeux de données du site (ex : `paris-trees/trees.json`, 12 Mo) — pas de compaction nécessaire.

Premier objet retenu chronologiquement : Vanguard 1 (`US`, lancé le 1958-03-17), plus ancien objet artificiel toujours en orbite ; Spoutnik 1, lancé le premier (1957-10-04), est retombé début 1958 et ne fait donc pas partie de ce jeu de données malgré sa mention dans la présentation éditoriale (voir "Angle éditorial" dans `functional-specifications.md`) comme repère narratif du début de l'ère spatiale plutôt que comme premier point du jeu de données lui-même.

## Format de sortie

```json
{
  "generatedAt": "2026-09-09",
  "regions": [
    { "id": "us", "nameFr": "États-Unis", "nameEn": "United States" },
    { "id": "russia-ussr", "nameFr": "Russie / URSS", "nameEn": "Russia / USSR" },
    { "id": "china", "nameFr": "Chine", "nameEn": "China" },
    { "id": "europe", "nameFr": "Europe", "nameEn": "Europe" },
    { "id": "other", "nameFr": "Reste du monde", "nameEn": "Rest of the world" }
  ],
  "satellites": [
    { "regionId": "us", "launchDate": "1958-03-17" },
    { "regionId": "us", "launchDate": "1958-12-18" }
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
