import type { Condition, EventDef } from '../../engine/types';

/**
 * Ce qui reste après avoir tué au village : la famille du mort, les regards, les cauchemars,
 * l'ami·e qui prend ses distances, et ceux, dans l'ombre, qui trouvent ça utile.
 */
const ACTIF: Condition = { statut: 'actif' };
const TUEUR: Condition = { tout: [ACTIF, { drapeau: 'tueur_village' }] };
const RIVAL_TUE: Condition = { tout: [ACTIF, { drapeau: 'rival_tue' }] };
const AMI_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const base = { chapitre: 2, chapitres: [2, 3, 4, 5, 6], arc: 'crise' as const };

export const REMORDS: EventDef[] = [
  // ── La famille du rival ───────────────────────────────────────
  {
    ...base,
    id: 'vc_clan_rival',
    titre: 'Le prix du sang',
    categorie: 'conflit_clans',
    lieu: '$village',
    enchaine: true,
    si: RIVAL_TUE,
    texte: 'Un homme t’attend devant chez toi, à la tombée de la nuit. Le frère aîné de {@rival} : le même front, les mêmes mains, vingt ans de plus. Il ne porte pas d’arme. Il n’en a pas besoin pour que tu comprennes. « Ma famille a deux façons de régler ça. Tu choisis. »',
    choix: [
      {
        id: 'duel',
        texte: 'Le duel, à l’ancienne, devant témoins',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, controleEmotionnel: 2 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 2,
          causeMort: 'tué·e en duel par le frère de sa victime',
          succes: { texte: 'Tu le mets à terre, et cette fois tu recules. Il se relève lentement. « Le sang est payé. » Les témoins hochent la tête. Sa famille ne t’adressera plus jamais la parole, mais elle ne te cherchera plus.', effets: [{ drapeau: 'vendetta', valeur: 'close' }, { stat: 'social.reputation', delta: 3 }, { ethique: { honneur: 4 } }] },
          echec: { texte: 'Il t’arrête à un souffle de la mort, sa lame sur ta gorge. Il la retire. « Maintenant, tu sais ce qu’il a ressenti. Ça suffira. » Il ne t’a pas tué. Tu ne sais pas si c’est une grâce ou une condamnation.', effets: [{ drapeau: 'vendetta', valeur: 'close' }, { blessure: { id: 'prix_sang', nom: 'Blessures du duel de sang', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'payer',
        texte: 'Payer le prix du sang',
        si: { stat: 'jauges.ryo', min: 200 },
        verrou: 'Le prix du sang est de 200 ryō. Tu ne les as pas.',
        effets: [{ stat: 'jauges.ryo', delta: -200 }, { drapeau: 'vendetta', valeur: 'close' }, { ethique: { honneur: 2 } }],
        resultat: 'Il compte, sans un regard pour toi. « Ça ne le ramènera pas. Mais ma mère mangera cet hiver. » Il s’en va. L’affaire est close, aux yeux du clan. Pas aux tiens.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : le conseil a déjà jugé',
        effets: [{ drapeau: 'vendetta', valeur: 'ouverte' }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { retour: 'vc_embuscade', chance: 0.7, entre: [120, 400] }],
        resultat: '« Le conseil, dit-il. Le conseil n’a pas enterré mon frère. » Il te tourne le dos. Le lendemain, quelqu’un a tracé un signe à la craie sur ta porte, le signe des dettes qui ne se remboursent pas.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_embuscade',
    titre: 'Le signe à la craie',
    categorie: 'conflit_clans',
    lieu: '$terrain',
    enchaine: true,
    si: { tout: [ACTIF, { drapeau: 'vendetta', egal: 'ouverte' }] },
    texte: 'Ils sont trois, masqués de tissu, au détour du chemin qui mène au terrain d’entraînement. Ce ne sont pas des ennemis du village. Ce sont des cousins, des amis d’enfance de {@rival}. L’un d’eux tremble. Les deux autres, non.',
    choix: [
      {
        id: 'combattre',
        texte: 'Te défendre',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 1, perception: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tué·e dans une embuscade de vengeance, par des gens de son propre village',
          succes: { texte: 'Tu les désarmes un par un, sans tuer personne. Ça te coûte plus d’efforts que de les tuer. Le dernier, celui qui tremblait, s’enfuit en pleurant. Le conseil, prévenu, met fin à la vendetta par décret.', effets: [{ drapeau: 'vendetta', valeur: 'close' }, { stat: 'social.reputation', delta: 4 }, { ethique: { compassion: 4 } }] },
          echec: { texte: 'Ils te laissent pour mort dans le fossé. Une patrouille te trouve à l’aube. Le conseil ouvre une enquête qui n’aboutira jamais : personne n’a rien vu.', effets: [{ blessure: { id: 'vendetta', nom: 'Blessures de la vendetta', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'parler',
        texte: 'Parler à celui qui tremble',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { charisme: 2, perception: 1, controleEmotionnel: 1 },
          succes: { texte: 'Tu lui parles de {@rival} : des duels, des années d’école, de ce que tu regrettes. Il baisse sa lame. Les deux autres hésitent, puis le suivent. Personne ne te pardonne. Mais personne ne tue personne ce jour-là.', effets: [{ drapeau: 'vendetta', valeur: 'close' }, { stat: 'attributs.charisme', delta: 2 }] },
          echec: { texte: 'Le nom de {@rival} dans ta bouche, c’est ce qui les décide. Tu t’échappes de justesse, couvert·e de sang, le tien.', effets: [{ blessure: { id: 'vendetta', nom: 'Blessures de la vendetta', gravite: 2, jours: 40 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'vc_incident',
    titre: 'La lettre de l’autre village',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    personnages: ['@kage'],
    si: { tout: [ACTIF, { drapeau: 'incident_examen' }] },
    texte: 'Le {kage} te convoque. Sur son bureau, une lettre scellée du village du genin que tu as tué au tournoi. Il ne te la fait pas lire. « Ils demandent ta tête. Littéralement. Je peux refuser. Ça a un prix, et c’est le village qui le paiera. »',
    choix: [
      {
        id: 'frontiere',
        texte: 'Accepter une année aux postes les plus exposés',
        effets: [{ drapeau: 'incident_examen', retirer: true }, { stat: 'social.loyaute', delta: 6 }, { stat: 'jauges.fatigue', delta: 30 }, { blessure: { id: 'peine_frontiere', nom: 'Une année de frontière', gravite: 1, jours: 30 } }],
        resultat: 'Un an de neige, de gardes de nuit et d’escarmouches. Le {kage} écrit à l’autre village que tu as été « sévèrement puni·e ». C’est vrai. Ça ne suffit pas à eux. Ça suffit à la paix.',
      },
      {
        id: 'excuses',
        texte: 'Aller présenter tes excuses, en personne',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: 'Tu traverses la frontière avec une escorte et tu t’agenouilles devant le conseil de l’autre village. Le père du genin te regarde sans rien dire, très longtemps. Puis il tourne le dos. L’incident est clos. Il ne le sera jamais pour lui.', effets: [{ drapeau: 'incident_examen', retirer: true }, { stat: 'social.reputation', delta: 6 }, { ethique: { honneur: 6 } }] },
          echec: { texte: 'On t’écoute en silence. On te raccompagne à la frontière. Le lendemain, une patrouille de ton village tombe dans une embuscade. Personne ne dit que c’est à cause de toi. Tout le monde le pense.', effets: [{ stat: 'social.reputation', delta: -6 }, { stat: 'social.suspicion', delta: 6 }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Disparaître avant qu’on te livre',
        effets: [{ statut: 'deserteur' }, { drapeau: 'errance' }, { drapeau: 'hors_la_loi' }, { drapeau: 'lieu_errance', valeur: 'route_commerce' }, { stat: 'social.loyaute', delta: -50 }, { retour: 'hl_traqueurs', chance: 1, entre: [60, 200] }, { journal: 'Menacé·e d’être livré·e à un village étranger, tu t’enfuis.', importance: 3 }],
        resultat: 'Tu ne crois pas le {kage}. Ou tu le crois trop. La nuit même, tu passes le mur. Désormais, deux villages te cherchent.',
      },
    ],
  },

  // ── Les regards, et ceux qui restent ──────────────────────────
  {
    ...base,
    id: 'vc_mere',
    titre: 'Au marché',
    categorie: 'deuil',
    lieu: '$village',
    poids: 5,
    si: RIVAL_TUE,
    texte: 'Au marché, une femme lâche son panier en te voyant. Des navets roulent sur les pavés. La mère de {@rival}. Elle ne crie pas. Elle ne bouge pas. Tout le marché s’est tu pour voir ce qu’elle va faire.',
    choix: [
      {
        id: 'ramasser',
        texte: 'Ramasser les navets et les lui tendre',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { compassion: 3 } }],
        resultat: 'Elle les prend. Ses doigts touchent les tiens une fraction de seconde. « {Il:@rival} parlait de toi tout le temps, tu sais. Depuis ses six ans. » Elle s’en va. Tu restes à genoux au milieu du marché, et personne ne t’aide à te relever.',
      },
      {
        id: 'partir',
        texte: 'Faire demi-tour',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'social.reputation', delta: -2 }],
        resultat: 'Tu fais demi-tour. Derrière toi, le marché reprend son bruit, un peu trop fort, comme pour couvrir quelque chose. Tu ne retourneras plus jamais à ce marché le jeudi.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_regards',
    titre: 'Les regards',
    categorie: 'reputation',
    lieu: '$village',
    poids: 4,
    si: TUEUR,
    texte: 'Le marchand de brochettes ne te sert plus en premier. Une mère tire son fils par la manche quand tu passes. À l’Académie, des élèves se taisent sur ton passage, puis chuchotent ton nom avec un mot à côté. Un mot que tu n’aimes pas.',
    choix: [
      {
        id: 'assumer',
        texte: 'Marcher la tête haute',
        effets: [{ stat: 'social.reputationOmbre', delta: 4 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Si on te craint, autant qu’on te craigne bien. Tu ne baisses plus les yeux. On s’écarte plus vite. C’est une forme de respect. C’est surtout une forme de solitude.',
      },
      {
        id: 'reparer',
        texte: 'Aider sans qu’on te le demande',
        duree: 10,
        effets: [{ stat: 'social.reputation', delta: 5 }, { ethique: { compassion: 4 } }, { stat: 'jauges.fatigue', delta: 15 }],
        resultat: 'Tu répares le toit de la veuve d’en face, tu portes les sacs du vieux meunier, tu fais traverser les enfants de l’Académie. Personne ne te remercie. Au bout d’un mois, le marchand de brochettes te sert de nouveau en premier, sans un mot.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_ami',
    titre: '{@coequipierA} ne te regarde plus pareil',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    personnages: ['@coequipierA'],
    si: { tout: [TUEUR, AMI_VIVANT] },
    texte: 'Depuis des semaines, {@coequipierA} trouve toujours une raison de partir quand tu arrives. Ce soir, tu {le:@coequipierA} rattrapes sur le pont. « Je ne sais pas qui tu es, en ce moment. Je ne sais pas si je veux savoir. »',
    choix: [
      {
        id: 'expliquer',
        texte: 'Lui dire ce qui s’est passé dans ta tête, ce jour-là',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: 'Tu dis tout, sans chercher d’excuse. La rage, la seconde, le froid après. {@coequipierA} t’écoute jusqu’au bout. « Je ne te pardonne pas à sa place. Mais je reste. » C’est plus que tu n’espérais.', effets: [{ relation: '@coequipierA', delta: { confiance: 8, attachement: 6 } }] },
          echec: { texte: 'Tes mots sonnent faux, même à tes oreilles. {@coequipierA} secoue la tête et s’en va. Le lendemain, {il:@coequipierA} a demandé à changer d’équipe.', effets: [{ relation: '@coequipierA', delta: { confiance: -10, amitie: -8 } }] },
        },
      },
      {
        id: 'laisser',
        texte: 'Lui laisser le temps',
        effets: [{ relation: '@coequipierA', delta: { amitie: -3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { retour: 'vc_ami_retour', chance: 0.6, entre: [200, 500] }],
        resultat: 'Tu hoches la tête et tu {le:@coequipierA} laisses passer. Le pont est très long, ce soir-là.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_ami_retour',
    titre: 'Deux tasses',
    categorie: 'amitie',
    lieu: '$maison',
    enchaine: true,
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, AMI_VIVANT] },
    texte: 'Un soir, on frappe à ta porte. {@coequipierA}, deux tasses à la main et une théière sous le bras. « J’ai mis du temps. Je ne sais pas si j’ai fini. Mais j’avais soif. »',
    choix: [
      {
        id: 'entrer',
        texte: 'Faire entrer {@coequipierA}',
        effets: [{ relation: '@coequipierA', delta: { amitie: 10, attachement: 6, confiance: 4 } }, { stat: 'jauges.fatigue', delta: -15 }],
        resultat: 'Vous ne parlez pas de ce qui s’est passé. Vous parlez du reste, de tout le reste, jusqu’à ce que la théière soit froide. En partant, {@coequipierA} dit : « À la semaine prochaine. » Tu n’avais jamais entendu une phrase aussi simple sonner aussi fort.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_cauchemar',
    titre: 'Le même rêve',
    categorie: 'blessure',
    lieu: '$maison',
    poids: 4,
    repetable: { delaiJours: 400, max: 2 },
    si: TUEUR,
    texte: [
      { si: { drapeau: 'rival_tue' }, texte: 'Toujours le même rêve. L’arène, ou le terrain, et {@rival} qui se relève. {Il:@rival} te tend la main, comme pour t’aider à te relever toi. Tu te réveilles toujours avant de la prendre.' },
      { si: { drapeau: 'rival_tue', absent: true }, texte: 'Toujours le même rêve. La rue des lanternes, le mur de la taverne, et un homme qui glisse le long du mur, encore et encore, sans jamais toucher le sol.' },
    ],
    choix: [
      {
        id: 'medecin',
        texte: 'En parler au médecin du village',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'jauges.fatigue', delta: -15 }, { stat: 'jauges.ryo', delta: -15 }],
        resultat: 'Il ne te juge pas. Il a entendu ce rêve cent fois, avec cent visages différents. Il te donne des herbes pour dormir, et un conseil : « Ne cherche pas à oublier. Cherche à porter. »',
      },
      {
        id: 'entrainer',
        texte: 'Te lever et t’entraîner jusqu’à l’aube',
        effets: [{ entrainer: 'taijutsu', jours: 10 }, { stat: 'jauges.fatigue', delta: 15 }],
        resultat: 'Le poteau d’entraînement ne pose pas de questions. Tu frappes jusqu’à ce que tes mains saignent. Le rêve reviendra. Mais pas cette nuit.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_tombe',
    titre: 'Un an après',
    categorie: 'deuil',
    lieu: '$village',
    poids: 3,
    si: RIVAL_TUE,
    texte: 'Un an jour pour jour. Devant la tombe de {@rival}, il y a des fleurs fraîches, une coupelle de saké, et un bâton d’entraînement planté dans la terre. Il n’y a personne. Pas encore.',
    choix: [
      {
        id: 'rester',
        texte: 'Rester, et attendre que la famille arrive',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { ethique: { honneur: 4 } }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'Ils arrivent à midi. Ils te voient. Le frère aîné serre les poings, puis les desserre. Vous restez là, ensemble et séparés, jusqu’à ce que l’encens se consume. Personne ne dit rien. C’était la seule chose à dire.',
      },
      {
        id: 'fleur',
        texte: 'Déposer une fleur et partir avant eux',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { compassion: 2 } }],
        resultat: 'Une fleur blanche, à côté des leurs. Ils sauront qui l’a posée. Tu ne sais pas si ça les apaisera ou si ça les blessera. Tu la poses quand même.',
      },
    ],
  },
  {
    ...base,
    id: 'vc_ombre',
    titre: 'Ceux qui trouvent ça utile',
    categorie: 'organisation',
    lieu: '$village',
    poids: 3,
    si: { tout: [TUEUR, { rangMin: 'chunin' }, { drapeau: 'vc_ombre_vue', absent: true }] },
    texte: 'Un homme au masque blanc t’attend dans ta chambre, assis dans le noir. Il ne s’excuse pas d’être entré. « Le village a beaucoup parlé de toi. En mal, surtout. Nous, nous avons parlé de toi autrement. Nous avons besoin de gens qui ne tremblent pas. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter de travailler dans l’ombre',
        effets: [{ drapeau: 'vc_ombre_vue' }, { drapeau: 'unite_ombre' }, { stat: 'social.reputationOmbre', delta: 10 }, { stat: 'social.loyaute', delta: 6 }, { stat: 'jauges.ryo', delta: 150 }, { ethique: { compassion: -4 } }, { journal: 'Les unités de l’ombre te recrutent pour ce que tu sais faire.', importance: 3 }],
        resultat: 'Il pose un masque sur la table, blanc, sans visage. « Personne ne saura jamais ce que tu fais pour eux. C’est ça, le prix, et c’est ça, le pardon. » Il disparaît. Le masque, lui, reste. Il te va parfaitement.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : tu ne veux pas devenir ça',
        effets: [{ drapeau: 'vc_ombre_vue' }, { ethique: { honneur: 4, compassion: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: '« Comme tu voudras. Mais tu l’es déjà un peu, ça. » Il part. Tu restes longtemps dans le noir, à te demander s’il a raison.',
      },
    ],
  },
];
