import type { Condition, EventDef } from '../../engine/types';

const ACTIF: Condition = { statut: 'actif' };
const JEUNE: Condition = { tout: [ACTIF, { age: { min: 17, max: 22 } }] };
const base = { chapitre: 2, chapitres: [2, 3, 4, 5], arc: 'conflit' as const };

/**
 * La jeunesse (17 à 22 ans) : la veste, les premiers élèves, les amis qui se marient et ceux qui ne reviennent pas.
 * Les fils de l'adolescence (Kanon, Chihiro) y trouvent leur suite.
 */
export const JEUNESSE: EventDef[] = [
  // ── Fil : Akane, l'élève d'un jour ──────────────────────────────
  {
    ...base,
    id: 'j17_lecon',
    titre: 'Une leçon à l’Académie',
    categorie: 'academie',
    lieu: '$academie',
    poids: 5,
    si: { tout: [JEUNE, { rangMin: 'chunin' }] },
    texte: 'Le directeur de l’Académie te demande de remplacer un professeur malade, pour une journée. Trente enfants de huit ans te regardent comme si tu étais le Kage. Au premier rang, une fillette, Akane, lève la main avant même que tu aies parlé.',
    choix: [
      {
        id: 'vrai',
        texte: 'Leur parler de ce qu’est vraiment une mission',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'aoi', valeur: 'verite' }, { retour: 'j17_aoi', chance: 0.65, entre: [700, 1300] }],
        resultat: 'Tu ne mens pas. Tu ne dis pas tout non plus. À la fin, la classe est silencieuse. Akane reste après la cloche. « Est-ce que vous avez eu peur ? » « Toujours. » Elle hoche la tête, très sérieuse, comme si c’était la réponse qu’elle attendait.',
      },
      {
        id: 'jeu',
        texte: 'Transformer la leçon en grand jeu de piste',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'aoi', valeur: 'jeu' }, { retour: 'j17_aoi', chance: 0.65, entre: [700, 1300] }],
        resultat: 'Trente enfants qui hurlent dans les couloirs, un professeur outré, et Akane qui trouve toutes les balises en premier, avec une méthode que tu n’as jamais vue. Le directeur ne te redemandera jamais. Les enfants, si.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_aoi',
    titre: 'Akane',
    categorie: 'heritage',
    lieu: '$village',
    enchaine: true,
    chapitres: [2, 3, 4, 5, 6],
    si: ACTIF,
    texte: 'Une jeune genin te salue dans la rue, très droite, le bandeau parfaitement noué. Tu mets une seconde à la reconnaître. Akane. « Vous ne vous souvenez sûrement pas de moi. Vous avez fait la classe, une fois. J’ai gardé mes notes. »',
    choix: [
      {
        id: 'notes',
        texte: 'Lui demander ce qu’elle a noté',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: [
          { si: { drapeau: 'aoi', egal: 'verite' }, texte: 'Elle sort un carnet usé. Ta phrase est soulignée deux fois : « Toujours. » En dessous, d’une écriture d’enfant : « Alors moi aussi j’ai le droit. » Tu ne savais pas qu’une phrase pouvait voyager aussi loin.' },
          { si: { drapeau: 'aoi', egal: 'jeu' }, texte: 'Elle sort un carnet usé, couvert de cartes et de flèches : le jeu de piste, refait de mémoire, amélioré. « Mon sensei dit que je suis la meilleure pisteuse de ma promotion. C’est à cause de vous. » C’est surtout à cause d’elle.' },
        ],
      },
      {
        id: 'conseil',
        texte: 'Lui donner le conseil que tu aurais voulu recevoir',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { ethique: { compassion: 3 } }],
        resultat: '« Il y aura un jour où tu devras choisir entre la mission et quelqu’un. Décide maintenant de qui tu veux être ce jour-là. Après, il sera trop tard pour réfléchir. » Elle l’écrit dans son carnet. Tu espères qu’elle n’en aura jamais besoin.',
      },
    ],
  },

  // ── Fil : les affaires d'un camarade ──────────────────────────
  {
    ...base,
    id: 'j17_affaires',
    titre: 'Le sac d’un mort',
    categorie: 'deuil',
    lieu: '$village',
    poids: 4,
    si: { tout: [JEUNE, { rangMin: 'chunin' }] },
    texte: 'Un chūnin de ton unité n’est pas revenu de la frontière. On te confie son sac, pour sa femme. Dedans : une gourde, un kunai émoussé, et une petite toupie en bois peinte en rouge, pour un enfant qui a trois ans.',
    choix: [
      {
        id: 'porter',
        texte: 'Porter le sac toi-même',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.loyaute', delta: 3 }, { drapeau: 'toupie', valeur: 'donnee' }, { retour: 'j17_toupie', chance: 0.6, entre: [1200, 2200] }],
        resultat: 'La femme ouvre la porte, voit ton bandeau, voit le sac, et comprend avant que tu parles. L’enfant prend la toupie et la fait tourner sur le plancher. Il rit. Il ne sait pas encore.',
      },
      {
        id: 'confier',
        texte: 'Le confier au bureau des missions',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Un employé prend le sac et remplit un formulaire. C’est la procédure. Tu repars plus léger·ère et tu te sens lourd·e toute la journée.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_toupie',
    titre: 'La toupie rouge',
    categorie: 'heritage',
    lieu: '$academie',
    enchaine: true,
    chapitres: [2, 3, 4, 5, 6],
    si: ACTIF,
    texte: 'Un garçon de l’Académie te bloque le passage, une toupie rouge, toute écaillée, dans la main. « Maman dit que c’est vous qui l’avez apportée. Le jour où papa est mort. Vous le connaissiez ? Comment il était ? »',
    choix: [
      {
        id: 'raconter',
        texte: 'Lui raconter son père',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { compassion: 5 } }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'Tu racontes ce que tu sais, et un peu ce que tu ne sais pas. Qu’il riait fort, qu’il partageait son riz, qu’il parlait de son fils à chaque bivouac. Le garçon écoute sans bouger. À la fin, il fait tourner la toupie sur la pierre, très longtemps.',
      },
      {
        id: 'vrai',
        texte: 'Lui dire la vérité : tu le connaissais à peine',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { honneur: 3 } }],
        resultat: '« Je le connaissais à peine. Mais il est mort pour que d’autres rentrent. J’en fais partie. » Le garçon réfléchit. « Alors vous lui devez quelque chose. » Oui. Tu lui dois au moins de t’en souvenir.',
      },
    ],
  },

  // ── Les suites de l'adolescence ───────────────────────────────
  {
    ...base,
    id: 'j17_kaede',
    titre: 'Kanon, jōnin',
    categorie: 'amitie',
    lieu: '$village',
    poids: 5,
    si: { tout: [JEUNE, { drapeau: 'kaede' }] },
    texte: 'Kanon t’attend au pont, le gilet de jōnin sur les épaules. Elle a toujours ce sourire en coin. « J’ai une équipe à moi, maintenant. Trois gamins insupportables. Je comprends enfin notre sensei. » Elle hésite. « Et je pars pour une mission dont personne ne revient vraiment. »',
    choix: [
      {
        id: 'promesse',
        texte: 'Lui faire promettre de revenir',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 2 },
          { hasard: [{ poids: 70, effets: [{ drapeau: 'kaede', valeur: 'revenue' }] }, { poids: 30, effets: [{ drapeau: 'kaede', valeur: 'tombee' }] }] },
          { retour: 'j17_kaede_suite', chance: 1, entre: [60, 180] },
        ],
        resultat: '« Promis. » Elle te tend le petit doigt, comme les enfants. Vous avez vingt ans passés, et vous le faites quand même, au milieu du pont, devant tout le monde.',
      },
      {
        id: 'duel',
        texte: 'La défier une dernière fois, au terrain trois',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { taijutsu: 1, famille_kunai: 1 },
          succes: { texte: 'Comme autrefois, mais plus vite, plus dur. Tu gagnes d’un souffle. Elle rit. « Tu ne baisses plus l’épaule. » Elle part à l’aube. Elle revient trois mois plus tard, amaigrie, vivante.', effets: [{ entrainer: 'taijutsu', jours: 15 }, { drapeau: 'kaede', valeur: 'revenue' }] },
          echec: { texte: 'Elle est devenue terrible. Elle te relève, te tape sur l’épaule. « Garde ça pour quand je reviendrai. » Elle part à l’aube. Elle revient trois mois plus tard, amaigrie, vivante.', effets: [{ entrainer: 'taijutsu', jours: 12 }, { drapeau: 'kaede', valeur: 'revenue' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'j17_kaede_suite',
    titre: 'Le retour de l’équipe de Kanon',
    categorie: 'deuil',
    lieu: '$porte',
    enchaine: true,
    chapitres: [2, 3, 4, 5, 6],
    si: ACTIF,
    texte: [
      { si: { drapeau: 'kaede', egal: 'revenue' }, texte: 'Une équipe passe la porte au crépuscule : trois gamins couverts de poussière, et devant eux, boitant, Kanon. Elle te voit sur le mur. Elle lève le petit doigt.' },
      { si: { drapeau: 'kaede', egal: 'tombee' }, texte: 'Une équipe passe la porte au crépuscule : trois gamins couverts de poussière, qui portent un brancard. Sous le drap, une main dépasse. Elle a encore un kunai noué au poignet, comme elle le faisait toujours.' },
    ],
    choix: [
      {
        id: 'aller',
        texte: 'Descendre du mur',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 3 },
          { si: { drapeau: 'kaede', egal: 'tombee' }, alors: [{ ethique: { compassion: 3 } }, { stat: 'social.loyaute', delta: 3 }], sinon: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'jauges.fatigue', delta: -10 }] },
        ],
        resultat: [
          { si: { drapeau: 'kaede', egal: 'revenue' }, texte: '« Je t’avais dit que je tenais mes promesses. » Ses trois élèves te regardent comme une légende, parce qu’elle leur a parlé de toi. Vous fêtez ça aux brochettes. Elle s’endort sur la table avant le dessert.' },
          { si: { drapeau: 'kaede', egal: 'tombee' }, texte: 'Les trois gamins ne pleurent pas. Ils ont appris ça d’elle. Le plus jeune te tend son kunai : « Elle a dit de vous le donner. Que vous comprendriez. » Tu comprends. Ce soir-là, tu montes seul·e au terrain trois, et tu lances jusqu’à l’aube.' },
        ],
      },
    ],
  },
  {
    ...base,
    id: 'j17_ren',
    titre: 'Chihiro, au festival',
    categorie: 'romance',
    lieu: '$village',
    poids: 5,
    si: { tout: [JEUNE, { drapeau: 'ren' }] },
    texte: [
      { si: { drapeau: 'ren', egal: 'oui' }, texte: 'Le festival d’été. Chihiro t’attend sous la lanterne de l’échoppe, comme chaque année depuis la lettre. Cette année, les mains de Chihiro tremblent un peu, et l’une d’elles reste cachée dans la manche.' },
      { si: { drapeau: 'ren', egal: 'non' }, texte: 'Le festival d’été. Tu croises Chihiro au stand de poissons rouges, avec un enfant sur les épaules. Vos regards se croisent. Ça ne fait plus mal. Presque plus.' },
    ],
    choix: [
      {
        id: 'rejoindre',
        texte: 'Aller vers Chihiro',
        effets: [
          { si: { drapeau: 'ren', egal: 'oui' }, alors: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'jauges.fatigue', delta: -20 }, { drapeau: 'ren', valeur: 'promesse' }], sinon: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.charisme', delta: 1 }] },
        ],
        resultat: [
          { si: { drapeau: 'ren', egal: 'promesse' }, texte: 'Dans la manche, il y a un peigne en laque, et une demande que Chihiro n’arrive pas à formuler jusqu’au bout : « Reviens de chaque mission. Même si un jour ce n’est plus vers moi. » Tu promets. Les feux d’artifice éclatent juste à ce moment-là, ce qui est très injuste pour les feux d’artifice.' },
          { si: { drapeau: 'ren', egal: 'non' }, texte: 'Chihiro te présente l’enfant. Vous parlez de l’échoppe, de la grand-mère partie l’hiver dernier, de rien. Au moment de partir, Chihiro dit : « Ta lettre, je l’ai gardée. » Tu ne sais pas quoi en faire. Tu la gardes aussi, cette phrase.' },
        ],
      },
      {
        id: 'loin',
        texte: 'Regarder Chihiro de loin, sans t’approcher',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu restes de l’autre côté de la rue, derrière les lanternes. Chihiro ne te voit pas, ou fait semblant. Les feux d’artifice commencent. Tu les regardes seul·e, et c’est très bien comme ça, presque.',
      },
    ],
  },

  // ── Scènes de la jeunesse ─────────────────────────────────────
  {
    ...base,
    id: 'j17_appartement',
    titre: 'Une chambre à soi',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 4,
    si: { tout: [JEUNE, { stat: 'jauges.ryo', min: 60 }] },
    texte: 'Une chambre se libère au-dessus de la boutique du vieux tailleur : une fenêtre sur les toits, un plancher qui grince, un loyer à peine raisonnable. {Parent} dit que rien ne presse. Ça veut dire que tout presse.',
    choix: [
      {
        id: 'prendre',
        texte: 'La prendre',
        effets: [{ stat: 'jauges.ryo', delta: -50 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@parent', delta: { respect: 5 } }, { drapeau: 'chambre_a_soi' }],
        resultat: 'Le premier soir, le silence est assourdissant. Le deuxième, tu manges du riz froid debout près de la fenêtre et tu te sens libre. Le troisième, {parent} passe « par hasard » avec une marmite.',
      },
      {
        id: 'rester',
        texte: 'Rester encore un peu',
        effets: [{ relation: '@parent', delta: { attachement: 5 } }, { stat: 'jauges.fatigue', delta: -10 }],
        resultat: '{Parent} ne dit rien, mais le lendemain, il y a ton plat préféré au dîner. Le monde peut attendre une saison de plus.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_sake',
    titre: 'Le premier verre avec les jōnin',
    categorie: 'politique',
    lieu: '$village',
    poids: 4,
    si: { tout: [JEUNE, { rangMin: 'chunin' }] },
    texte: 'Pour la première fois, les jōnin de ton unité t’invitent à leur table, au fond de la taverne. Le saké coule. Les langues se délient. Quelqu’un te demande ce que tu penses vraiment du conseil.',
    choix: [
      {
        id: 'franc',
        texte: 'Dire ce que tu penses',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { charisme: 2, intellect: 1 },
          succes: { texte: 'Tu parles franchement, sans insulter personne. Un silence, puis le plus vieux lève son verre. « Enfin quelqu’un qui réfléchit. » Ton nom circule, le lendemain, dans les bons cercles.', effets: [{ stat: 'social.influence', delta: 5 }, { stat: 'attributs.charisme', delta: 1 }] },
          echec: { texte: 'Tu en dis trop. Beaucoup trop. Le lendemain, tu ne te souviens pas de tout. Eux, si. Ton chef d’unité te regarde bizarrement pendant une semaine.', effets: [{ stat: 'social.suspicion', delta: 4 }, { stat: 'jauges.fatigue', delta: 15 }] },
        },
      },
      {
        id: 'ecouter',
        texte: 'Boire peu, écouter beaucoup',
        effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.intellect', delta: 1 }, { indice: 'rumeur_conseil' }],
        resultat: 'Tu apprends qui déteste qui, qui doit quoi à qui, et pourquoi deux jōnin ne partent jamais en mission ensemble. Personne ne remarque que tu ne bois pas. C’est peut-être la leçon la plus utile de l’année.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_stele',
    titre: 'Devant la stèle',
    categorie: 'deuil',
    lieu: '$village',
    poids: 4,
    si: JEUNE,
    texte: 'Tu viens à la stèle des héros plus souvent qu’avant. Il y a des noms que tu connais, maintenant. À l’aube, une vieille femme y dépose du thé, chaque jour, devant le même nom.',
    choix: [
      {
        id: 'femme',
        texte: 'Lui demander qui c’était',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { compassion: 3 } }],
        resultat: '« Mon fils. Il aimait le thé trop fort. » Elle verse, elle s’incline, elle repart. Le lendemain, tu apportes une deuxième tasse. Vous ne parlez jamais beaucoup. Vous n’en avez pas besoin.',
      },
      {
        id: 'noms',
        texte: 'Relire les noms que tu connais',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Tu les touches un par un, du bout des doigts. Tu te demandes combien de place il reste sur la pierre. Puis tu arrêtes de te le demander, et tu vas t’entraîner.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_mendiant',
    titre: 'Le vétéran sans jambes',
    categorie: 'civils',
    lieu: '$village',
    poids: 3,
    si: JEUNE,
    texte: 'Près de la porte, un homme sans jambes mendie sur une planche à roulettes. Il porte un vieux bandeau rayé, celui des déserteurs graciés. Les passants détournent les yeux. Il ne demande rien aux ninjas : il les connaît trop.',
    choix: [
      {
        id: 'repas',
        texte: 'Lui offrir un repas et l’écouter',
        effets: [{ stat: 'jauges.ryo', delta: -8 }, { ethique: { compassion: 5 } }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: 'Il mange lentement. Il te raconte la nuit où il a fui, et pourquoi. Ce n’était pas de la lâcheté. C’était un ordre qu’il ne pouvait pas exécuter. Le village l’a gracié. Pas pardonné.',
      },
      {
        id: 'poste',
        texte: 'Lui trouver un travail au bureau des archives',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { charisme: 2, intellect: 1 },
          succes: { texte: 'Il t’a fallu trois visites et une petite dette d’honneur. Un mois plus tard, il classe des rouleaux de guerre, et il est le seul à savoir où tout se trouve. Il ne te remercie jamais. Il te garde toujours le meilleur rouleau.', effets: [{ stat: 'social.influence', delta: 3 }, { ethique: { compassion: 4 } }, { stat: 'attributs.intellect', delta: 1 }] },
          echec: { texte: '« Un déserteur aux archives ? » On te raccompagne poliment. Tu reviens lui dire. Il hausse les épaules. « Je savais. Merci d’avoir essayé, petit·e. »', effets: [{ ethique: { compassion: 2 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'j17_jury',
    titre: 'Surveillant d’examen',
    categorie: 'examen',
    lieu: '$academie',
    poids: 4,
    si: { tout: [JEUNE, { rangMin: 'chunin' }] },
    texte: 'On te nomme surveillant à l’examen de sortie de l’Académie. Au fond de la salle, un garçon triche. Mal. Il est blême, ses mains tremblent. Sur sa fiche : orphelin, troisième tentative.',
    choix: [
      {
        id: 'exclure',
        texte: 'L’exclure, comme le veut le règlement',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'social.reputation', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Il sort sans un mot. Tu remplis le formulaire. Le règlement existe pour que personne ne meure en mission à cause d’un diplôme volé. Tu le sais. Tu y penses quand même le soir.',
      },
      {
        id: 'tousser',
        texte: 'Tousser fort en passant près de lui',
        effets: [{ ethique: { compassion: 4, honneur: -2 } }, { stat: 'attributs.discretion', delta: 1 }],
        resultat: 'Il sursaute, range sa triche, et termine l’épreuve seul. Il échoue de peu. À la sortie, il te regarde : il a compris. L’année suivante, il réussit sans tricher.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_mariage',
    titre: 'Les noces de {@coequipierA}',
    categorie: 'amitie',
    lieu: '$village',
    poids: 3,
    personnages: ['@coequipierA'],
    si: { tout: [JEUNE, { age: { min: 19 } }, { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }, { relation: '@coequipierA', axe: 'amitie', min: 30 }] },
    texte: '{@coequipierA} se marie. Tu as reçu l’invitation, écrite à la main, avec un petit dessin de la boîte aux trésors dans le coin. On te demande de dire quelques mots au banquet.',
    choix: [
      {
        id: 'discours',
        texte: 'Raconter une histoire d’enfance',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { charisme: 2, controleEmotionnel: 1 },
          succes: { texte: 'Tu racontes la nuit dans la forêt, les plumes de hibou, les secrets échangés. Toute la salle rit, puis se tait, puis rit encore. {@coequipierA} pleure en riant. C’est le plus beau cadeau que tu pouvais faire.', effets: [{ relation: '@coequipierA', delta: { amitie: 10, attachement: 6 } }, { stat: 'attributs.charisme', delta: 2 }] },
          echec: { texte: 'Ta voix se brise à la deuxième phrase. Tu termines en trois mots et tu te rassois. Personne ne se moque. {@coequipierA} vient t’embrasser devant tout le monde. Les mots, finalement, n’étaient pas nécessaires.', effets: [{ relation: '@coequipierA', delta: { amitie: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
      {
        id: 'cadeau',
        texte: 'Offrir un cadeau qui a coûté cher',
        si: { stat: 'jauges.ryo', min: 50 },
        verrou: 'Il te faudrait 50 ryō.',
        effets: [{ stat: 'jauges.ryo', delta: -50 }, { relation: '@coequipierA', delta: { amitie: 6, attachement: 4 } }],
        resultat: 'Une théière en fonte, gravée de vos deux noms et de la date de votre premier jour à l’Académie. {@coequipierA} la tient longtemps sans rien dire. Elle trônera dans sa cuisine pendant trente ans.',
      },
    ],
  },
  {
    ...base,
    id: 'j17_marche_noir',
    titre: 'La lame sous le comptoir',
    categorie: 'arsenal',
    lieu: '$village',
    poids: 3,
    si: { tout: [JEUNE, { rangMin: 'chunin' }] },
    texte: 'Un armurier du quartier bas te fait signe d’entrer. Sous son comptoir, enveloppée dans un tissu huilé, une lame d’un village ennemi, prise sur un mort. « Elle est belle, non ? Pour toi, je fais un prix. Personne n’a besoin de savoir. »',
    choix: [
      {
        id: 'signaler',
        texte: 'Signaler le trafic',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'social.reputation', delta: 2 }, { ethique: { honneur: 3 } }],
        resultat: 'La garde fouille la boutique le soir même. On trouve vingt lames, et une liste de clients. Tu ne lis pas la liste. Tu préfères ne pas savoir quels noms y figurent.',
      },
      {
        id: 'examiner',
        texte: 'L’examiner, sans acheter',
        effets: [{ entrainer: 'famille_kenjutsu', jours: 8 }, { stat: 'attributs.perception', delta: 1 }],
        resultat: 'L’acier est différent, plus souple, forgé autrement. Tu passes une heure à la tourner dans la lumière. Tu repars sans elle, mais avec une idée précise de la manière dont on se bat, de l’autre côté de la frontière.',
      },
    ],
  },
];
