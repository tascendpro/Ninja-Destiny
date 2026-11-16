# Ninja Destiny

Jeu narratif de carrière shinobi. Le joueur naît dans un village caché, hérite d’un clan, éveille puis maîtrise ses pouvoirs avec le temps, choisit un métier, découvre des armes légendaires, noue des relations et subit les conséquences de ses choix.

Ce dépôt contient **le moteur complet** et **une vie entière en six chapitres** :

1. **L’enfance et l’Académie** (6–14 ans) : clan, éveil, bandeau, premières missions, ou la route pour les refoulé·es.
2. **L’examen de chūnin** (14–16 ans) : écrit, forêt, tournoi ; devoir de clan ; une crise propre à chaque village ; missions B ; la frontière.
3. **La Troisième Grande Guerre** (16–20 ans) : affectation (front, soins, renseignement), la perte, l’as ennemi, la guerre vue de chaque village (coup d’État Uchiha, Kazekage assassiné, rébellion de Kiri, offensive du Raikage, arme d’Iwa), la paix, l’examen de jōnin ; missions A.
4. **Les années de jōnin** (20–30 ans) : une équipe de genin, l’arme légendaire de son village, un foyer, le traître et le Navire noir, la politique de chaque village, l’examen de ses élèves ; mission S.
5. **La voie** (30–45 ans) : ce que le personnage devient — commandant, chef de l’ombre, médecin, diplomate — ou celui qui part, ou celle qui pose le bandeau ; à chaque étape, partir reste possible ; l’envoyé de l’Amiral.
6. **L’héritage** (45 ans et plus) : la succession du Kage, l’attaque du Navire noir, le vieux rival, la relève, la transmission, et une dernière décision qui ferme la vie (légende, retraite ou dernière mission).

La voie de la route traverse aussi les cinq chapitres (mercenaires, guerre sans drapeau, compagnie ou village à soi, maître errant).

## Version 2.53 : les proches ont une posture et une mémoire

- **Postures** (`src/engine/proches.ts`) : chaque proche est lu dans ses axes de relation. L'aîné·e est complice, protecteur·rice, sévère, jaloux·se ou distant·e ; le parent fier, inquiet, protecteur ou distant ; le rival rival, respectueux·se, complice ou ennemi·e ; l'ami·e proche, ami·e, déçu·e (promesse rompue) ou distant·e ; le mentor exigeant, confiant ou déçu. Condition `{ posture: 'rival', est: 'complice' }`.
- **Mémoire** : `{rival_bilan}` (le compte réel des duels, tiré du registre de combat), `{habitude}` (ce que tu fais de ton temps libre, compté par le moteur), `{souvenir:@x}` (le dernier souvenir partagé), `{revue_progres}` et `{revue_conseil}` (la revue du mentor : ce qui a progressé depuis la dernière, et un conseil **jamais donné**, tiré de tes habitudes de combat ou de ta plus grande faiblesse). Conditions `rivalBilan`, `habitudeConnue`, `souvenirAvec`, `connu`.
- **Cinq scènes récurrentes** (`src/content/evenements/proches.ts`) : l'aîné·e et ton habitude, le dîner avec le parent (qui réagit à ton rang, à l'aîné·e disparu·e, à l'examen raté, au secret d'Akihiko), le compte avec le rival (qui cite le shuriken, la fiole, le tournoi), le muret avec l'ami·e, la revue annuelle du mentor.
- **Le vrai adversaire** : une quinzaine de duels annoncés contre le rival tiraient un adversaire générique au nom inventé. Ils opposent maintenant le rival lui-même (`rival_academie`, sa mémoire, ses revanches). L'entraînement avec l'aîné·e oppose l'aîné·e (contexte entraînement), le coéquipier sous genjutsu est bien le coéquipier. Au tournoi, au dernier combat et pour le déserteur, c'est le rival s'il est vivant, quelqu'un d'autre sinon (`selon` dans les fiches de combat).
- Tests : `tests/proches.test.ts`. Le pilote des campagnes de test ne choisit plus une suite de mort que le jeu interdit. Contenu 2.53.0.

## Version 2.52 : audit narratif, une famille et des proches cohérents

- **La famille qu'on a vraiment** : le jeu ne connaît qu'un parent et un·e aîné·e, tirés avec leur genre. Les leçons de clan, le tournoi chūnin, le devoir de clan, la tablette Uchiha et une dizaine d'autres scènes disaient « ton père », « ta mère » ou « ton frère » en dur : elles passent par {parent}, {Parent}, {Aine}. Si le parent n'est plus là, un ancien du clan enseigne à sa place, et sa place reste vide dans la tribune.
- **Le genre de ceux qui nous entourent** : à Kumo la rivale est une fille, à Konoha et à Iwa la sensei est une femme. Une soixantaine de phrases disaient « il » en dur (défis, retour du rival, déserteur, sensei, coéquipiers) : elles s'accordent maintenant au personnage réel.
- **Ce qui s'est déjà passé** : un premier fou rire, une réconciliation « trente ans trop tard » ou « la première fois qu'il te parle comme à une personne » ne se racontent plus quand l'histoire commune les dément (conditions sur la relation).
- **Sans copier-coller** : les rencontres de l'Akatsuki ont chacune leur retraite et leur sortie de combat (Konan, seule sur son toit, n'est plus « deux taches au loin ») ; les lames légendaires ont chacune leur lieu (Sabure ne vous attend plus « sur la grève » du désert).
- **Diagnostic** : deux nouvelles erreurs bloquantes, `famille_figee` (un parent ou un aîné écrit en dur hors d'une réplique) et `jeton_mal_forme` (`le{e:@x}` donnait « lee »). Tests : `tests/narration.test.ts`.
- Contenu 2.52.0 : les sauvegardes antérieures se chargent sans rejeu.

## Version 2.51 : combats expliqués, jutsu par nature

- **Chaque manche s'explique** (`src/engine/combat/explication.ts`) : ce que tu as fait, ce qu'il faisait vraiment (et si ta lecture était juste), les PV perdus de part et d'autre, la règle qui a décidé, et la leçon à en tirer.
- **Avant de choisir**, « Ce que tu lis » dit ce que ta lecture permet d'en conclure et les réponses qui marchent ; l'intention n'est nommée que si la lecture est fiable.
- **Jutsu : d'abord la nature** (Katon, Raiton, Suiton…), puis la technique ; chaque technique a sa fiche (description, effets tactiques, portée, avantage de nature si elle est connue).
- **Règles en sept lignes** dans l'écran de combat, ouvertes d'office au premier combat.
- **Plus de portraits** : les personnages sont désignés par leur nom.
- Contenu 2.51.0 : les sauvegardes 2.50 se chargent sans rejeu (le journal des manches gagne des champs).

## Version 2.50 : interface V2, combat tactique, chronologie commune

- **Interface V2.** Une palette où chaque couleur a une fonction : violet pour l’identité et les actions principales, or pour ce qui compte, rouge réservé au danger, vert pour les réussites, bleu pour le chakra. Les jetons `--nd-*` sont en tête de `src/ui/styles.css` ; les composants V2 sont dans `src/ui/interface.css`. Navigation resserrée (Récit, Ninja, Carnet, Magasin, Menu ; le son passe dans l’en-tête). La fiche Ninja s’ouvre sur une présentation du personnage (portrait, rang, jauges, aptitudes, techniques, ce qu’il vit, la prochaine étape, ceux qui comptent). Dans les dialogues, celui qui parle est nommé au-dessus de sa réplique quand l’incise le désigne sans doute.
- **Combat, règles 2.** Feinte (ouvre la garde de qui attend, inutile contre qui frappe, éventée si on la répète), concentration (la prochaine attaque part plus juste et plus fort, au prix d’une manche exposée), reprendre son souffle (de moins en moins efficace). Deux attaques qui se croisent font un échange ; une esquive réussie déséquilibre l’adversaire ; une manche de plus par combat. L’adversaire lit tes habitudes selon son niveau (`finesseTactique`) et punit la passivité. Chaque combat annonce sa gravité (entraînement, duel amical, combat sérieux, combat mortel). **Entre 6 et 12 ans, un duel amical s’arrête sous 30 % des PV** : hors de combat, jamais mort.
- **Versions de règles.** Un combat, et une campagne, gardent les règles de leur ouverture (`REGLES_COMBAT`, champ `regles`) : une partie en ligne lancée avant la 2.50 se rejoue avec les règles 1, et rien ne change d’issue.
- **Chronologie commune (campagne).** Celui qui a passé un anniversaire attend l’autre tant que l’autre peut avancer : on ne joue jamais ses 10 ans pendant que l’autre en a 9.
- **Création à deux.** Le lien se choisit d’abord ; chaque ninja est ensuite créé sous les contraintes du lien (frères : même famille ; villages différents : l’autre village est fermé…).
- **Temps libre.** Nouvelle case « Découvrir » : explorer les environs (perception, lieux, une cabane à trouver) et mener une enquête quand l’histoire a ouvert une piste. Le conseil ne lance jamais rien : il montre une activité, le joueur choisit.
- **L’oncle Akihiko.** Une intrigue de 8 à 17 ans (`evenements/secretsFamille.ts`) : la lettre oubliée, le nom rayé de la stèle, la cabane sous les racines, l’homme à la grue. À deux (`campagne/scenesFamille.ts`), chacun voit son propre indice ; rien n’est su qui n’ait été dit.

## Démarrer

```bash
npm install
npm run dev               # application Next.js sur http://localhost:3000
npm test                  # toute la suite : règles, combat, campagnes simulées, textes, diagnostic, vecteurs dorés
npm run diagnostic        # rapport détaillé du contenu (erreurs et contenus prévus)
npm run build             # site statique dans out/ (à déployer sur Vercel ou Netlify)
npm run build:standalone  # version jouable en un seul fichier HTML (dist-standalone/index.html)
```

## Architecture

```
src/
  engine/        Règles du moteur, sans aucun texte narratif
    types.ts         Modèle de données (conditions, effets, événements, maîtrise, armes, métiers…)
    conditions.ts    Évaluation des conditions structurées
    effets.ts        Application des conséquences (toujours validées)
    maitrise.ts      Potentiel → éveil → paliers 0 à 5, plafond par âge, copie, PNJ
    armes.ts         Arsenal, registre mondial des armes uniques, liens, malus
    metiers.ts       Éligibilité, reconversion, canal de réputation
    epreuves.ts      Combats et épreuves (probabilité calculée, issue tirée par le moteur)
    temps.ts         Chronologie : croissance, guérison, salaire, progression des PNJ
    selection.ts     Planifiés → trame → aléatoire contrôlé
    tempsLibre.ts    Activités entre deux événements (chacune coûte du temps)
    fins.ts          Fins, trophées, note finale
    moteur.ts        API publique : nouvellePartie, choisir, continuer, activite, rejouer
    sauvegarde.ts    Sauvegardes de session (onglet ouvert), rejouables et vérifiées par empreinte
    diagnostic.ts    Détection des événements sans suite, références cassées, quêtes sans issue…
    invariants.ts    Règles vérifiées après chaque action dans les tests
  content/       Contenu narratif sous forme de données
    monde.ts, clans.ts, maitrises.ts, armes.ts, metiers.ts, pnj.ts, lieux.ts, fins.ts, encyclopedie.ts
    evenements/  origines, clans, academie, genin, missions, yunagi, aleatoires, secrets
  ui/            Interface React (aucune règle de jeu)
app/             Entrée Next.js
standalone/      Entrée Vite pour la version en un seul fichier
tests/           Tests vitest
```

Le moteur ne dépend d’aucun framework : il tourne tel quel côté serveur.

## Règles clés

- **Éveil ≠ maîtrise.** Un éveil donne toujours le palier 1. L’entraînement seul plafonne au palier 2 ; les paliers 3 et plus exigent de l’expérience réelle (combats, missions).
- **Plafond par âge** (chakra, natures, pouvoirs) : moins de 10 ans → 1, 10–13 → 2, 14–17 → 3, 18–24 → 4, 25+ → 5 (avec condition narrative). Le Prodige ajoute un palier, jamais plus. **Armes et taijutsu n’ont pas de plafond d’âge** : seule l’expérience réelle compte. Les PNJ suivent exactement le même modèle.
- **Chapitres** : chaque fin de chapitre propose « Continuer » vers le suivant ; les fins de vie (mort, capture, exil, vie civile, légende, retraite, dernière mission) ferment l’histoire. La vie reprend là où elle s’était arrêtée ; la bourse ne reçoit que les ryō gagnés depuis le dernier versement.
- **Enchaînements** : en combat, une technique d’une nature puis une technique d’une autre nature qui se combine (vent puis feu, eau puis foudre…) donne un bonus et un récit propre. Les combinaisons (Tornade de feu…) sont de rang C : il faut les deux natures au palier 2, au palier 1 seulement pour un prodige ou un esprit vif.
- **Ryō** : l’échoppe vend pilules du soldat, pilules de sang, parchemins explosifs et fumigènes, utilisables pendant les manches de combat ; un bol de ramen, une partie de dés, un cadeau à un proche ; la forge ; et la bourse d’héritages entre les vies.
- **Combats en manches** : les grands duels (et tout combat mortel difficile) se jouent en deux ou trois manches. À chaque manche, on choisit une attaque (simple ou technique) ; on touche, l’adversaire esquive, ou il riposte. L’issue dépend de l’ensemble des manches.
- **Dōjutsu volés** : selon la vie, on peut croiser un marchand d’yeux au marché noir, un frère d’armes mourant, un savant inquiétant ou un cadavre sur le champ de bataille. L’œil greffé arrive éveillé, coûte de la réserve de chakra et plafonne au palier 3.
- **Deuil** : un retour de mission peut révéler la mort d’un proche ; chez les Uchiha dont l’œil dort encore, c’est fréquent, et c’est ce qui l’éveille.
- **Entraînement double** (dès genin) : au temps libre, on coche une technique (onglet Techniques) et une discipline (onglet Disciplines : clan, natures, ninjutsu, genjutsu, taijutsu, armes) ; les deux progressent ensemble, chacune à 60 % du rythme. Chaque ligne montre son palier et sa progression ; ce que l’entraînement ne peut plus faire avancer (âge, expérience réelle…) apparaît en rouge avec la raison, et la période s’arrête d’elle-même au lieu de répéter le même message.
- **Interface** : l’accueil garde son illustration (portrait sur téléphone, paysage sur PC) ; les scènes ont leur estampe de lieu, teintée par la saison. La barre du haut et la navigation restent fixes, le contenu défile entre les deux ; en combat sur téléphone, les quatre grands choix restent collés en bas, sous le pouce.
- **Temps libre** : une seule décision par période. Le moteur répète ce choix (entraînement, technique, liens, repos…) jusqu’au prochain moment d’histoire, un an au plus pour un enfant et six mois ensuite ; un imprévu peut couper la période. Achats, réparations et changement d’arme sont instantanés.
- **Techniques** : 65, de rang E à A (natures, ninjutsu, taijutsu, genjutsu, armes, médecine, sceaux, fusions, bijū). Le rang fixe l’âge normal d’apprentissage ; intelligence, contrôle du chakra, réserve de chakra, talent de prodige et héritage « Esprit vif » l’avancent chacun d’un an (trois ans au plus, jamais avant 6 ans). Certaines ne s’apprennent qu’au village, d’autres seul·e, d’autres auprès d’un maître rencontré sur la route.
- **Points de stat** : à chaque anniversaire (dès 7 ans), l’année vécue rapporte des points à répartir soi-même entre les huit aptitudes : croissance (2), rang (1 à 4, ou 1 sur la route), missions réussies (jusqu’à 3), combats gagnés (jusqu’à 2), épreuves réussies (jusqu’à 2), entraînement (jusqu’à 2), études (1), talent de prodige (1). Un niveau coûte 1 point jusqu’à 60, 2 jusqu’à 80, 3 au-delà. Le corps grandit seul (force et agilité +1 par an jusqu’à 20 ans) ; le reste se gagne.
- **Chances en pourcentage** : chaque choix avec une épreuve affiche sa chance de réussite et l’aptitude qui la décide (réfléchir → Intelligence, esquiver → Agilité…). Elle dépend des aptitudes pondérées de l’épreuve, des maîtrises, de l’arme, de la fatigue et des blessures. En Légende, seul le niveau de risque reste visible.
- **Combinaisons** : avec deux natures façonnées (palier 2), on invente seul·e une technique qui les lance ensemble (10 paires, rang B). Les natures qui s’accordent (vent + feu, eau + foudre) frappent plus fort ; celles qui se contrarient coûtent plus de chakra. Face à l’adversaire, une seule nature dominante suffit pour l’avantage ; il faut les deux dominées pour le perdre.
- **Attaques spéciales** : dans un combat, jusqu’à trois techniques connues apparaissent sous le choix d’affrontement, avec leur coût en chakra (ou en santé) et l’avantage ou le désavantage d’élément face à l’adversaire. Les utiliser les fait progresser.
- **Mort** : un combat raté laisse des blessures ; un combat mortel raté peut tuer (12 % des échecs en Récit, 30 % en Shinobi, 45 % en Légende, selon la profondeur de l’échec). On ne meurt jamais sans avoir échoué. En simulation, environ 4 % des vies se terminent par la mort en Shinobi.
- **Refoulé·e** : trois échecs à l’examen de fin d’Académie (tous les six mois) mènent à un refus, puis au choix : vie civile, partir sur les routes (dojo de samouraïs, fosse de Kōsai, ermite, duels, contrats, retour possible au village par une épreuve) ou voler un rouleau interdit et déserter (chasseurs aux trousses).
- **Séquences** : l’enfance, les premières années d’Académie, les dernières années, puis genin ou la route. Chacune se termine par un bilan : ce qui a compté, ce que tu es devenu·e, tes progrès, tes liens.
- **Boutique** : à la fin de chaque vie, ses ryō rejoignent la bourse de l’onglet. On y achète un héritage pour la vie suivante (six au choix, de 120 à 900 ryō) ; un seul par vie.
- **Sharingan** : éveil entre 8 et 16 ans sous un danger ou une émotion extrême, palier 3 pas avant 14 ans, palier 4 pas avant 18 ans. Copier une technique la place au palier 1 ; aucun kekkei genkai n’est copiable. Le Mangekyō s’éveille par une perte tragique (deuil, mort d’un proche à la guerre) et porte deux pouvoirs tirés pour ce porteur parmi Tsukuyomi, Amaterasu, Kamui, Kotoamatsukami et Izanagi ; Susanoo s’ouvre à tous ceux qui le maîtrisent.
- **Rinnegan** : un Sharingan au palier 3 dans un corps qui porte la force des Senju (clan Senju, ou cellules régénératrices greffées : marché noir, recherche interdite) lie les deux sangs ; le Rinnegan s’éveille ensuite une nuit de fièvre. Il ouvre Shinra Tensei, Banshō Ten’in, Chibaku Tensei ; uni au Mangekyō, le Rinne Sharingan ouvre Amenotejikara et Limbo.
- **Sans-nom, orphelins, jinchūriki** : un enfant sans clan a bien plus de chances d’être jinchūriki (8 %, 14 % pour un orphelin, 2 % pour un enfant de clan) — le village choisit ceux qu’il ne regrettera pas, et la révélation le dit. Scènes propres : « Sans-nom » à l’Académie, l’orphelinat, la boutique qui se ferme, l’arme du village pendant la guerre, les chasseurs de bêtes ; un sans-nom peut fonder son propre nom de famille.
- **Armes uniques** : un registre mondial garde le détenteur de chaque arme unique ; une arme n’existe jamais à deux endroits. Une arme vendue continue d’exister ailleurs. Une seule arme légendaire liée à la fois.
- **Métiers** : séparés du rang, avec âge minimal, incompatibilités et réputation clandestine pour les métiers de l’ombre.
- **Nom** : seuls les clans portent un nom de famille, et c’est le clan qui le donne (aucune saisie). Un personnage sans clan, enfant du commun ou orphelin, n’a que son prénom ; sa famille et les PNJ sans clan aussi.
- **Ce qui ne se choisit pas** : à la naissance, le moteur tire avec la graine de la partie le talent de prodige (7 %), une bête à queues scellée (3 %, toujours une bête de son propre village) et les lignées de fusion propres au village. Le joueur découvre ces dons en jouant.
- **Natures de chakra** : l’affinité innée progresse le plus vite. Une deuxième nature s’apprend genin à partir de 12 ans, une troisième chūnin, toutes jōnin ; la précédente doit être façonnée (palier 2). Une nature enseignée au village progresse à 75 % du rythme inné, une autre à 55 %.
- **Natures de fusion** : Yōton (Iwa, Kiri), Futton (Kiri), Shakuton et Jiton (Suna), Ranton (Kumo), Bakuton (Iwa), en plus du Hyōton (Yuki) et du Mokuton (Senju). Une lignée reste latente jusqu’à l’éveil de ses deux natures, puis s’éveille seule ; elle ne dépasse jamais d’un palier la plus faible des deux.
- **Jinchūriki** : le chakra de la bête fuit d’abord sous la peur ou la colère (éveil sous le danger), puis se maîtrise par paliers, avec des conditions d’âge et d’accord avec la bête.
- **Déterminisme** : une partie est entièrement définie par sa création, sa graine et la liste de ses décisions. `rejouer()` reconstruit l’état à l’identique.

## Persistance

En solo et à deux sur un téléphone, aucun serveur : la partie est gardée dans le `localStorage` du navigateur (`src/ui/stockage.ts`). Elle survit à la fermeture du navigateur ; seul l’effacement des données du site (ou la navigation privée) la fait disparaître. Si le stockage est indisponible, le jeu bascule en mémoire. La partie en ligne (deux téléphones) partage son journal d’actions par Supabase (`supabase/schema.sql`).

Une sauvegarde stocke la création, la graine, les décisions et l’état, plus une empreinte. Au chargement, la partie est **rejouée** et l’empreinte comparée : une sauvegarde modifiée à la main est reconstruite à partir des décisions.

## Déploiement

Le site est entièrement statique (`output: 'export'` dans `next.config.mjs`) : `npm run build` produit le dossier `out/`.

- **Vercel** : importer le dépôt, aucun réglage. Vercel détecte Next.js et sert `out/`.
- **Netlify** : importer le dépôt ; `netlify.toml` fixe la commande (`npm run build`), le dossier publié (`out`) et Node 22.
- **Sans build sur la plateforme** : `npm run build:standalone` produit le dossier `dist-standalone/` (un seul `index.html`), à glisser dans Netlify Drop.

## Images et sons

Tout passe par `src/ui/medias.ts` :

- **Accueil** : `src/ui/images/accueil-pc.jpg` (paysage) et `accueil-mobile.jpg` (cadrage vertical sur le personnage).
- **Fonds de scène** : déposer l’image dans `src/ui/images/`, l’importer dans `medias.ts` et l’ajouter à `FONDS` sous une clé de lieu (`konoha_academie`), de type de scène (`village_feu`, `foret`…) ou de variante (`terrain`). Sans image, la scène reste dessinée à l’encre. Format conseillé : paysage 16:9 ou 4:3, avec une version portrait facultative pour le téléphone.
- **Musiques et sons** : la musique principale se dépose dans `public/sons/theme.mp3` et joue en boucle par défaut (dès le premier toucher) ; le bouton ♪ de l’accueil et le bouton « Son » de la barre du bas la coupent. Tout se règle dans `src/ui/musiques.ts`. Une URL par moment du jeu (`accueil`, `enfance`, `village`, `temps_libre`, `combat`, `tension`, `deuil`, `bilan`, `fin`), en fondu de l’une à l’autre, et une URL par effet (`choix`, `eveil`, `touche`, `esquive`, `riposte`, `achat`, `page`). Une piste vide retombe sur `village`, puis sur l’ambiance générée. Fichiers locaux : les déposer dans `public/sons/` et écrire `'/sons/accueil.mp3'`. Les liens YouTube ne sont pas utilisables (YouTube interdit d’en extraire le son ou de cacher son lecteur) : il faut un fichier audio dont tu as les droits. Sur claude.ai, les fichiers venant d’autres sites sont bloqués : les URL marchent sur ta propre mise en ligne.

## Ajouter du contenu

Un événement est un objet `EventDef` : identifiant, conditions (`si`), texte (avec segments conditionnels et jetons comme `{prenom}`, `{@sensei}`, `{parent}`), choix avec prérequis, épreuves et effets. `npm run diagnostic` signale toute référence cassée, tout choix sans conséquence et toute branche inaccessible.

## Chronologie

Chronologie alternative : les villages, clans et pouvoirs s’inspirent de Naruto, mais les Kage, PNJ et événements sont originaux (an 52 de l’ère des Villages, huit ans après la Deuxième Grande Guerre). Plusieurs lignées et armes sont propres à cette chronologie, ce qui permet un contenu indépendant de la licence.

## État du contenu (Chapitre 1)

| Élément | Chapitre 1 | Objectif du jeu complet |
|---|---|---|
| Villages | 5 | 5 |
| Clans | 16 (dont « sans clan », avec origine famille ou orphelin) | 12+ |
| Natures de chakra | 5 de base + 8 de fusion | — |
| Bijū | 8, répartis entre les villages | — |
| Événements | 129 (dont 10 sur la route) | 100+ |
| Techniques | 65 (dont 10 combinaisons) | — |
| Événements rares ou secrets | 7 | 15 |
| PNJ structurés | 48 + famille ou orphelinat générés | 20+ |
| Missions | 6 (4 D, 2 C) | 30 |
| Armes légendaires | 13 définies, 1 quête jouable (Yūnagi) | 12 quêtes |
| Métiers | 15 définis, 6 jouables | 15 |
| Fins | 6 (dont « la route ») | 10+ |

Les contenus prévus pour les chapitres suivants apparaissent comme avertissements dans `npm run diagnostic`.
