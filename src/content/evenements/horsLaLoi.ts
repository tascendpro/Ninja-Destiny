import type { Condition, EventDef } from '../../engine/types';

/**
 * La voie du crime : refoulé·e de l'Académie ou déserteur·e, on peut vivre de la route autrement qu'en mercenaire.
 * Les crimes du temps libre (convois, rackets, rançons) alourdissent la prime ; la prime fait venir les chasseurs,
 * puis les traqueurs de ton ancien village ; et au bout, il y a ce village lui-même, et son Kage.
 */
const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'crise' as const };
const SUR_LA_ROUTE: Condition = { statut: ['errant', 'deserteur'] };
const HORS_LA_LOI: Condition = { tout: [SUR_LA_ROUTE, { drapeau: 'hors_la_loi' }] };
const AMI_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const ENTRER = [
  { statut: 'deserteur' as const },
  { drapeau: 'hors_la_loi' },
  { stat: 'social.loyaute' as const, delta: -30 },
  { journal: 'Tu rejoins la bande de la Pie. Ton village raye ton nom ; les routes apprennent à le craindre.', importance: 3 as const },
  { retour: 'hl_premier_sang', chance: 1, entre: [40, 120] as [number, number] },
  { retour: 'hl_partage', chance: 0.85, entre: [300, 700] as [number, number] },
];

export const HORS_LA_LOI_EVENEMENTS: EventDef[] = [
  // ── L'entrée dans la bande ────────────────────────────────────
  {
    ...base,
    id: 'hl_col',
    titre: 'La bande de la Pie',
    categorie: 'organisation',
    lieu: 'frontiere_herbe',
    priorite: 70,
    si: { tout: [SUR_LA_ROUTE, { drapeau: 'errance_voie', egal: 'bandit' }, { drapeau: 'hors_la_loi', absent: true }] },
    texte:
      'Au col de la Pie, un homme t’attend assis sur un rocher, comme s’il savait que tu viendrais. Gorō Dents-de-fer : une mâchoire cerclée d’acier, douze hommes derrière lui, et un convoi de sel qui monte la route en contrebas. « Tu veux manger ? Ici, on mange ce qu’on prend. Le convoi, c’est ton examen. Celui-là, tu ne le rateras pas trois fois. »',
    choix: [
      {
        id: 'attaquer',
        texte: 'Descendre sur le convoi avec eux',
        test: {
          type: 'combat',
          difficulte: 42,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          succes: {
            texte: 'Tu es le premier à toucher la charrette de tête. Les gardes fuient dans les rochers. Gorō te lance une bourse pleine. « Celui-là, il reste. » Les autres te regardent autrement, déjà.',
            effets: [...ENTRER, { drapeau: 'crime_convois', incr: 1 }, { stat: 'social.reputationOmbre', delta: 6 }, { stat: 'jauges.ryo', delta: 60 }],
          },
          echec: {
            texte: 'Un garde te jette au sol d’un coup de lance. Gorō le règle à ta place, et te relève par le col. « Lent. Mais tu n’as pas reculé. Ça s’apprend, le reste. »',
            effets: [...ENTRER, { stat: 'jauges.sante', delta: -12 }, { stat: 'social.reputationOmbre', delta: 3 }],
          },
        },
      },
      {
        id: 'guetter',
        texte: 'Faire le guet, sans frapper',
        effets: [...ENTRER, { stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputationOmbre', delta: 2 }, { stat: 'jauges.ryo', delta: 20 }],
        resultat: 'Tu siffles quand l’escorte se retourne, tu siffles quand elle fuit. Ta part est petite. Tes mains sont propres. Pour l’instant.',
      },
      {
        id: 'partir',
        texte: 'Refuser, et prendre la route de Kōsai',
        effets: [{ drapeau: 'errance_voie', valeur: 'kosai' }, { drapeau: 'lieu_errance', valeur: 'marche_noir' }, { decouvrir: 'lieu:marche_noir' }, { ethique: { honneur: 3 } }],
        resultat: 'Gorō hausse les épaules. « Tu reviendras. Ils reviennent tous, quand ils ont faim. » Tu descends vers l’est. Derrière toi, tu entends le convoi se faire attaquer sans toi.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_tentation',
    titre: 'Ceux qui ont faim',
    categorie: 'organisation',
    lieu: 'route_commerce',
    poids: 4,
    si: { tout: [SUR_LA_ROUTE, { age: { min: 14 } }, { drapeau: 'hors_la_loi', absent: true }, { drapeau: 'tentation_refusee', absent: true }] },
    texte: 'Ta bourse est vide depuis quatre jours. À l’auberge du gué, un homme à la mâchoire cerclée d’acier paie ta soupe sans te demander ton nom. « Gorō. On m’appelle Dents-de-fer. Il y a de la place dans la bande de la Pie, pour ceux qui savent se battre. Le travail est simple : on prend aux gros. »',
    choix: [
      {
        id: 'rejoindre',
        texte: 'Accepter',
        effets: [...ENTRER, { stat: 'jauges.ryo', delta: 30 }],
        resultat: 'Tu finis ta soupe. Le lendemain, tu as une plume de pie noire et blanche nouée au poignet, et un village qui, quelque part, raye ton nom de ses registres.',
      },
      {
        id: 'refuser',
        texte: 'Refuser',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'tentation_refusee' }],
        resultat: '« Comme tu veux. » Il ne reprend pas l’argent de la soupe. C’est sa façon de dire que la porte reste ouverte. Tu as encore faim, mais tu sais qui tu es.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_desertion',
    titre: 'L’homme qui parle avec l’accent d’ailleurs',
    categorie: 'trahison',
    lieu: '$village',
    poids: 3,
    si: { tout: [{ statut: 'actif' }, { rangMin: 'genin' }, { age: { min: 16 } }, { stat: 'social.loyaute', max: 35 }] },
    texte: 'Un marchand de passage s’assied à ta table et pose une bourse lourde entre vous. Son accent n’est pas d’ici. « Ton village ne te mérite pas. Le mien paierait trois fois ce qu’on te donne, pour ce que tu sais et pour tes bras. Une nuit, une porte, et tu n’as plus jamais à saluer ceux qui te méprisent. »',
    choix: [
      {
        id: 'partir',
        texte: 'Partir avec lui, et emporter ce que tu sais',
        effets: [
          { statut: 'deserteur' },
          { drapeau: 'hors_la_loi' },
          { drapeau: 'allegeance' },
          { drapeau: 'errance' },
          { stat: 'jauges.ryo', delta: 300 },
          { stat: 'social.loyaute', delta: -60 },
          { stat: 'social.reputationOmbre', delta: 15 },
          { journal: 'Tu passes à l’ennemi avec les secrets de ton village. Ton nom est inscrit au registre des traîtres.', importance: 3 },
          { retour: 'hl_traqueurs', chance: 1, entre: [90, 240] },
        ],
        resultat: 'Une nuit sans lune, un poste de garde que tu connais par cœur, une porte que personne ne surveille à cette heure. À l’aube, tu dictes à un scribe étranger les rotations des patrouilles de {village}. Ta main ne tremble pas. C’est ce qui te fait le plus peur.',
      },
      {
        id: 'denoncer',
        texte: 'Le livrer à la garde',
        effets: [{ stat: 'social.loyaute', delta: 15 }, { stat: 'social.reputation', delta: 5 }, { ethique: { honneur: 4 } }],
        resultat: 'La garde l’emmène. Le lendemain, un jōnin te remercie, puis te regarde un peu trop longtemps. Pourquoi est-ce toi qu’il est venu voir ? Tu te poses la même question.',
      },
      {
        id: 'ignorer',
        texte: 'Le laisser repartir, sans rien dire',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Il range sa bourse sans s’offusquer. « L’offre ne se répète pas souvent. » Il disparaît dans la foule. Tu restes avec ta solde et ta colère.',
      },
    ],
  },

  // ── Les premiers crimes ───────────────────────────────────────
  {
    ...base,
    id: 'hl_premier_sang',
    titre: 'Le garde à genoux',
    categorie: 'trahison',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: HORS_LA_LOI,
    texte: 'Le convoi est pris. Un garde est resté, à genoux dans la boue, les mains levées. Il a ton âge, à peu près, et un dessin d’enfant qui dépasse de sa veste. Gorō te tend un couteau. « Il a vu ton visage. Ici, on ne laisse pas de témoins. »',
    choix: [
      {
        id: 'tuer',
        texte: 'Faire ce qu’on attend de toi',
        effets: [{ drapeau: 'crime_meurtres', incr: 1 }, { ethique: { compassion: -10 } }, { stat: 'social.reputationOmbre', delta: 6 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'premier_sang' }],
        resultat: 'C’est rapide. C’est ce qu’on dit, et c’est faux : ça dure toute la nuit, dans ta tête. Gorō te tape sur l’épaule. Le dessin d’enfant reste dans la boue. Tu ne le ramasses pas.',
      },
      {
        id: 'epargner',
        texte: 'Lui dire de courir',
        effets: [{ ethique: { compassion: 6 } }, { stat: 'social.reputationOmbre', delta: -2 }, { stat: 'jauges.sante', delta: -8 }, { drapeau: 'garde_epargne' }],
        resultat: 'Il court. Gorō te frappe au visage, une fois, du revers de la main. « La prochaine fois, c’est toi qui cours. » Le garde, lui, racontera ton visage à tout le pays de l’Herbe.',
      },
      {
        id: 'ruse',
        texte: 'Feindre de le tuer et le laisser filer',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { discretion: 2, charisme: 1 },
          succes: { texte: 'Un coup de couteau dans la boue, un cri que tu lui souffles de pousser. Gorō ne regarde même pas. Le garde est déjà dans les fougères. Tu as menti à un homme qui tue les menteurs.', effets: [{ ethique: { compassion: 4 } }, { stat: 'attributs.discretion', delta: 2 }, { drapeau: 'garde_epargne' }] },
          echec: { texte: 'Gorō voit le garde se relever. Il le tue lui-même, puis te regarde longtemps. « Tu me dois un mort. » Tu ne sais pas encore ce que ça veut dire.', effets: [{ stat: 'social.reputationOmbre', delta: 2 }, { drapeau: 'dette_goro' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'hl_partage',
    titre: 'Le partage',
    categorie: 'trahison',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: { tout: [HORS_LA_LOI, { drapeau: 'chef_bande', absent: true }] },
    texte: 'Autour du feu, on compte le butin d’un mois. Gorō garde la moitié pour lui, comme toujours. Mais cette fois, tu as compté avant lui : il en a caché autant dans sa botte. Les autres ne savent pas. Toi, si.',
    choix: [
      {
        id: 'defier',
        texte: 'Le défier devant toute la bande',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tué·e par Gorō Dents-de-fer, au col de la Pie',
          succes: {
            texte: 'Il est plus fort, tu es plus rapide, et il a trop mangé. Quand il tombe, personne ne bouge. Puis le plus vieux de la bande pose sa plume de pie à tes pieds. Une à une, les autres suivent.',
            effets: [{ drapeau: 'chef_bande' }, { drapeau: 'crime_meurtres', incr: 1 }, { stat: 'social.reputationOmbre', delta: 12 }, { stat: 'jauges.ryo', delta: 150 }, { journal: 'Tu tues Gorō Dents-de-fer et prends la tête de la bande de la Pie.', importance: 3 }],
          },
          echec: {
            texte: 'Il te met à terre, le pied sur ta gorge. Puis il rit et te laisse respirer. « Pas encore, petit·e. Mais tu as du cran. » Il te garde. Il ne te tourne plus jamais le dos.',
            effets: [{ stat: 'jauges.sante', delta: -20 }, { stat: 'social.reputationOmbre', delta: 4 }],
          },
        },
      },
      {
        id: 'reveler',
        texte: 'Montrer la botte aux autres, et les laisser décider',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { charisme: 2, perception: 1 },
          succes: { texte: 'Tu retournes la botte devant le feu. L’or roule sur les pierres. La bande se lève d’un seul mouvement. Ce sont eux qui règlent le compte de Gorō. Toi, tu n’as eu qu’à parler. Au matin, c’est vers toi qu’ils se tournent.', effets: [{ drapeau: 'chef_bande' }, { stat: 'social.reputationOmbre', delta: 8 }, { stat: 'attributs.charisme', delta: 2 }, { journal: 'La bande de la Pie se débarrasse de Gorō et te choisit pour chef.', importance: 3 }] },
          echec: { texte: 'Gorō est plus rapide que ta langue. « Il ment. » Personne ne te croit. Tu dors une main sur ton couteau pendant un mois.', effets: [{ stat: 'social.reputationOmbre', delta: -2 }, { stat: 'jauges.fatigue', delta: 20 }] },
        },
      },
      {
        id: 'taire',
        texte: 'Te taire, et lui faire savoir que tu sais',
        effets: [{ stat: 'jauges.ryo', delta: 120 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Un regard, au-dessus du feu. Il comprend. Le lendemain, ta part a doublé. Le chantage aussi est un métier.',
      },
    ],
  },

  // ── Ce que la peur fait aux autres ────────────────────────────
  {
    ...base,
    id: 'hl_affiche',
    titre: 'Ton visage sur un mur',
    categorie: 'reputation',
    lieu: 'route_commerce',
    poids: 6,
    si: { tout: [HORS_LA_LOI, { stat: 'social.reputationOmbre', min: 20 }, { nonVu: 'hl_affiche' }] },
    texte: 'À la porte d’un relais de poste, une affiche placardée de frais : ton visage, mal dessiné, ton nom, et une somme en ryō qui te fait cligner des yeux. Deux voyageurs la lisent à voix haute. Ils ne te reconnaissent pas. Pas encore.',
    choix: [
      {
        id: 'arracher',
        texte: 'L’arracher devant eux',
        effets: [{ stat: 'social.reputationOmbre', delta: 4 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Ils comprennent en voyant ton sourire. Ils s’en vont très vite. Le soir même, toute la vallée sait que tu es passé·e par là. La peur voyage plus vite que les affiches.',
      },
      {
        id: 'garder',
        texte: 'La plier et la garder',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { objet: 'affiche_prime' }],
        resultat: 'Tu la ranges dans ta veste. Un jour, tu la compareras avec la suivante, pour voir combien tu vaux de plus.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_tribut',
    titre: 'Le bourg qui paie',
    categorie: 'civils',
    lieu: 'frontiere_herbe',
    poids: 5,
    si: { tout: [HORS_LA_LOI, { stat: 'social.reputationOmbre', min: 15 }] },
    texte: 'Quand tu entres dans le bourg de Kawabe, les volets se ferment un par un. Le chef du village t’attend sur la place, une bourse dans les mains et les genoux qui tremblent. « Pour la saison. Comme convenu. » Rien n’a été convenu. Ta réputation a négocié sans toi.',
    choix: [
      {
        id: 'prendre',
        texte: 'Prendre la bourse',
        effets: [{ stat: 'jauges.ryo', delta: 80 }, { drapeau: 'crime_rackets', incr: 1 }, { stat: 'social.reputationOmbre', delta: 3 }],
        resultat: 'Tu prends. Le chef s’incline jusqu’à terre. Une petite fille te regarde depuis une fenêtre, avec la même expression que toi devant l’Académie, autrefois. Sauf que c’est toi, maintenant, qu’on regarde comme ça.',
      },
      {
        id: 'proteger',
        texte: 'Refuser, et promettre que les autres bandes ne viendront plus',
        effets: [{ ethique: { compassion: 6, honneur: 4 } }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'protecteur_kawabe' }],
        resultat: 'Le chef ne comprend pas. Tu poses deux de tes hommes à l’entrée du bourg. Pendant des années, aucune bande n’y entrera. On t’y appellera « le loup qui garde ». Ce n’est pas tout à fait un compliment. C’est mieux qu’une malédiction.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_refugies',
    titre: 'Le convoi qui n’en est pas un',
    categorie: 'civils',
    lieu: 'route_commerce',
    poids: 4,
    si: HORS_LA_LOI,
    texte: 'Tes guetteurs signalent un convoi. Quand tu descends, ce ne sont pas des marchands : des familles, des charrettes à bras, des enfants pieds nus. Des réfugiés d’un village brûlé. Derrière toi, la bande attend tes ordres. Ils ont faim, eux aussi.',
    choix: [
      {
        id: 'escorter',
        texte: 'Les escorter jusqu’au prochain village',
        duree: 6,
        effets: [{ ethique: { compassion: 8 } }, { stat: 'social.reputationOmbre', delta: -3 }, { stat: 'social.reputation', delta: 4 }],
        resultat: 'Six jours de marche avec des bandits en guise d’escorte. Au dernier relais, une vieille femme t’embrasse les mains. Ta bande grogne. Tu leur paies ce qu’ils auraient pris, de ta poche.',
      },
      {
        id: 'prendre',
        texte: 'Prendre le peu qu’ils ont',
        effets: [{ ethique: { compassion: -8 } }, { stat: 'jauges.ryo', delta: 15 }, { drapeau: 'crime_convois', incr: 1 }, { stat: 'social.reputationOmbre', delta: 5 }],
        resultat: 'Quelques pièces, un sac de riz, une paire de bottes d’enfant. Quinze ryō. Personne ne se défend. C’est le butin le plus maigre de ta vie, et le seul dont tu rêveras.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_parent',
    titre: '{Parent}, sur la route',
    categorie: 'secret_familial',
    lieu: 'route_commerce',
    poids: 4,
    personnages: ['@parent'],
    si: { tout: [HORS_LA_LOI, { pnj: '@parent', etat: ['vivant', 'blesse'] }] },
    texte: 'À l’auberge du gué, quelqu’un s’assied en face de toi sans y être invité. {Parent}. Plus vieux que dans ton souvenir, les vêtements poussiéreux de semaines de marche. {Il:@parent} pose ton affiche sur la table, dépliée. « J’ai mis un an à te trouver. »',
    choix: [
      {
        id: 'ecouter',
        texte: 'Écouter ce qu’{il:@parent} a à dire',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@parent', delta: { attachement: 6 } }],
        resultat: '{Il:@parent} ne te demande pas de rentrer. {Il:@parent} sait que tu ne peux plus. {Il:@parent} te raconte le village, les voisins, ce qui a changé. Au matin, {il:@parent} repart. Sur la table, il y a une boîte de riz, comme quand tu partais pour l’Académie.',
      },
      {
        id: 'chasser',
        texte: 'Lui dire de repartir, pour sa sécurité',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { relation: '@parent', delta: { attachement: -4, respect: 2 } }],
        resultat: '« Si on te voit avec moi, ils te pendront à ma place. » {Il:@parent} hoche la tête. {Il:@parent} ne pleure pas. C’est de {parent} que tu tiens ça, pas l’inverse.',
      },
    ],
  },

  // ── Ceux qui viennent chercher la prime ───────────────────────
  {
    ...base,
    id: 'hl_chasseurs',
    titre: 'Les chasseurs de primes',
    categorie: 'organisation',
    lieu: 'route_commerce',
    enchaine: true,
    planifieParMoteur: true,
    si: HORS_LA_LOI,
    texte: 'Trois silhouettes sur la route, au crépuscule. Des ninjas sans bandeau, armés pour la chasse : filets de chakra, kunai empoisonnés, un rouleau de scellement pour transporter les têtes. L’un d’eux déplie ton affiche. « C’est bien toi. Tu vaux cher, tu sais. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Les affronter',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1, ninjutsu: 1 },
          arme: true,
          letal: true,
          manches: 2,
          causeMort: 'abattu·e par des chasseurs de primes, la tête scellée dans un rouleau',
          succes: { texte: 'Trois chasseurs, trois corps sur la route. Dans leurs poches : deux autres affiches, et la tienne, annotée : « dangereux·se, ne pas engager à moins de trois ». Tu étais prévu·e. Ça n’a pas suffi.', effets: [{ drapeau: 'crime_chasseurs', incr: 3 }, { stat: 'social.reputationOmbre', delta: 6 }, { stat: 'jauges.ryo', delta: 90 }] },
          partiel: { texte: 'Tu en abats un. Les deux autres se replient, en emportant leur blessé. Ils reviendront, ou d’autres.', effets: [{ drapeau: 'crime_chasseurs', incr: 1 }, { stat: 'social.reputationOmbre', delta: 3 }, { stat: 'jauges.sante', delta: -15 }] },
          echec: { texte: 'Le filet de chakra te cloue au sol. Tu ne dois ta vie qu’à ta bande, qui surgit des rochers. Tu as une cicatrice de plus, et une dette de plus.', effets: [{ blessure: { id: 'filet', nom: 'Brûlures du filet de chakra', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'payer',
        texte: 'Leur offrir plus que la prime pour qu’ils t’oublient',
        si: { stat: 'jauges.ryo', min: 150 },
        verrou: 'Il te faudrait au moins 150 ryō.',
        effets: [{ stat: 'jauges.ryo', delta: -150 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Ils comptent. Ils se regardent. « On ne t’a jamais vu·e. » Ils reviendront quand ta prime aura monté. Les chasseurs de primes ont une excellente mémoire des bons clients.',
      },
      {
        id: 'fuir',
        texte: 'Fuir par la forêt',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { agilite: 2, discretion: 2 },
          succes: { texte: 'Tu connais la forêt mieux qu’eux. Ils perdent ta trace au troisième ruisseau.', effets: [{ stat: 'attributs.agilite', delta: 1 }] },
          echec: { texte: 'Un kunai empoisonné dans l’épaule, au moment où tu passes le ruisseau. Tu t’en sors, fiévreux·se, pour un mois.', effets: [{ blessure: { id: 'poison_chasseur', nom: 'Poison de chasseur', gravite: 2, jours: 30 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'hl_traqueurs',
    titre: 'Les masques de {village}',
    categorie: 'trahison',
    lieu: 'route_commerce',
    enchaine: true,
    si: { statut: ['errant', 'deserteur'] },
    texte: [
      { texte: 'Ils ne se montrent pas. Tu les sens d’abord : quatre chakras qui se resserrent autour de ton camp, avec la discipline exacte qu’on t’enseignait autrefois. Puis les masques blancs apparaissent entre les arbres. Les traqueurs de ton ancien village.' },
      { si: AMI_VIVANT, texte: 'L’un d’eux retire son masque. {@coequipierA}. « On m’a demandé si je voulais cette mission. J’ai dit oui. Je préférais que ce soit moi. »' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { agilite: 1, perception: 1, controleChakra: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'exécuté·e par les traqueurs de son ancien village',
          succes: {
            texte: [
              { texte: 'Quand le dernier masque se brise, la forêt est silencieuse. Tu as battu les meilleurs de ton village. Ils en enverront d’autres, plus forts. Ou ils te laisseront, parce qu’ils n’en ont plus.' },
              { si: AMI_VIVANT, texte: '{@coequipierA} est à terre, vivant{e:@coequipierA}. Tu pourrais finir. Tu ne finis pas. Tu pars sans te retourner, et tu entends son souffle derrière toi pendant longtemps.' },
            ],
            effets: [{ drapeau: 'crime_chasseurs', incr: 2 }, { stat: 'social.reputationOmbre', delta: 12 }, { drapeau: 'traqueurs_vaincus' }],
          },
          echec: { texte: 'Le sceau de capture se referme sur ton chakra. On te ramène à {village} les mains liées dans le dos.', effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'ramené·e au village par ses traqueurs' }] },
        },
      },
      {
        id: 'parler',
        texte: 'Parler à {@coequipierA}',
        si: AMI_VIVANT,
        verrou: 'Il n’y a personne, derrière ces masques, à qui tu puisses parler.',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: '{@coequipierA} ferme les yeux, longtemps. Puis fait signe aux autres de se replier. « Je dirai que tu étais déjà parti·e. Une seule fois. La prochaine, je ne viendrai pas seul{e:@coequipierA}. »', effets: [{ relation: '@coequipierA', delta: { confiance: -5, attachement: 6 } }, { drapeau: 'epargne_par_ami' }] },
          echec: { texte: '« Ne me demande pas ça. » {@coequipierA} remet son masque. Le combat commence, et c’est le pire de ta vie : vous connaissez tous les deux les feintes de l’autre. Tu t’échappes de justesse, et vous saignez tous les deux.', effets: [{ blessure: { id: 'traqueurs', nom: 'Blessures des traqueurs', gravite: 3, jours: 60 } }, { relation: '@coequipierA', delta: { amitie: -10 } }] },
        },
      },
      {
        id: 'rendre',
        texte: 'Te rendre',
        effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'rendu·e aux traqueurs de son ancien village' }],
        resultat: 'Tu poses ton arme dans l’herbe. Personne ne parle pendant tout le voyage de retour.',
      },
    ],
  },

  // ── Le seigneur des routes ────────────────────────────────────
  {
    ...base,
    id: 'hl_seigneur',
    titre: 'L’envoyé du daimyō',
    categorie: 'politique',
    lieu: 'route_commerce',
    priorite: 60,
    si: { tout: [HORS_LA_LOI, { age: { min: 19 } }, { un: [{ tout: [{ drapeau: 'chef_bande' }, { stat: 'social.reputationOmbre', min: 30 }] }, { stat: 'social.reputationOmbre', min: 55 }] }] },
    texte: 'Un cavalier en livrée de soie entre dans ton camp, seul, sans arme. Un envoyé du daimyō. « Mon seigneur a compté ce que vous lui coûtez en convois. Il préfère vous payer. Un titre, des terres, la garde des routes du sel. Vous protégez ce que vous pillez, et votre prime disparaît. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter : de bandit, devenir seigneur',
        effets: [{ drapeau: 'seigneur_routes' }, { drapeau: 'pardon_daimyo' }, { stat: 'jauges.ryo', delta: 500 }, { fin: 'seigneur_routes', cause: 'pardonné·e par le daimyō' }],
        resultat: 'Tu poses ta plume de pie sur la table, à côté du sceau du daimyō. La bande gronde, puis se range. La semaine suivante, tes hommes portent une livrée. Les convois passent. Ils te saluent, maintenant.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : les routes sont déjà à toi',
        effets: [{ drapeau: 'seigneur_routes' }, { stat: 'social.reputationOmbre', delta: 10 }, { retour: 'hl_raid_veille', chance: 1, entre: [60, 200] }],
        resultat: '« Dites à votre seigneur que je n’ai pas besoin qu’il me donne ce que j’ai déjà. » L’envoyé repart. Ce soir-là, autour du feu, quelqu’un dit : « Et si on prenait plus gros qu’un convoi ? » Tout le monde se tourne vers toi. Tu sais à quoi ils pensent. Tu y penses depuis des années.',
      },
      {
        id: 'tuer',
        texte: 'Renvoyer sa tête au daimyō',
        effets: [{ drapeau: 'seigneur_routes' }, { drapeau: 'crime_meurtres', incr: 1 }, { stat: 'social.reputationOmbre', delta: 20 }, { ethique: { compassion: -8 } }, { retour: 'hl_raid_veille', chance: 1, entre: [60, 200] }],
        resultat: 'Le cheval rentre seul au château, avec un sac attaché à la selle. Plus personne ne te proposera de traité. Il ne reste qu’une cible à la hauteur de ce que tu es devenu·e.',
      },
    ],
  },

  // ── Le raid ───────────────────────────────────────────────────
  {
    ...base,
    id: 'hl_raid_veille',
    titre: 'La veille',
    categorie: 'trahison',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: HORS_LA_LOI,
    texte: [
      { texte: 'Quarante hommes autour du feu. Une carte de {village} étalée sur une selle, que tu as dessinée de mémoire, rue par rue. Tu connais les rotations des gardes, les points faibles du mur, l’heure où le Kage quitte son bureau. Tu as grandi là. C’est exactement pour ça que tu sais comment y entrer.' },
      { si: { un: [{ drapeau: 'hiro', egal: 'quittes' }, { drapeau: 'hiro', egal: 'client' }, { drapeau: 'hiro', egal: 'dette' }] }, texte: 'Un message est arrivé dans l’après-midi, sans signature, d’une écriture que tu reconnais : Hiro, le fils du tenancier. Les patrouilles ont changé ce mois-ci. Il a mis la nouvelle grille. « Pour les vieilles dettes. »' },
    ],
    choix: [
      {
        id: 'kage',
        texte: 'Viser le Kage',
        effets: [{ drapeau: 'raid_cible', valeur: 'kage' }],
        suite: 'hl_raid_porte',
        resultat: 'Tu poses le doigt sur la tour du Kage. Personne ne parle. Certains hommes ne dormiront pas cette nuit. Toi non plus.',
      },
      {
        id: 'tresor',
        texte: 'Viser le trésor du village',
        effets: [{ drapeau: 'raid_cible', valeur: 'tresor' }],
        suite: 'hl_raid_porte',
        resultat: 'Le trésor est sous le bureau des missions. Tu y as touché ta première paie, enfant. Tu y retournes chercher toutes les autres.',
      },
      {
        id: 'archives',
        texte: 'Viser les archives interdites',
        effets: [{ drapeau: 'raid_cible', valeur: 'archives' }],
        suite: 'hl_raid_porte',
        resultat: 'Les rouleaux interdits. Les techniques que le village garde pour lui. Ce n’est pas de l’or que tu veux. C’est ce qu’on t’a refusé.',
      },
      {
        id: 'renoncer',
        texte: 'Renoncer : ce village est encore le tien',
        effets: [{ stat: 'social.reputationOmbre', delta: -10 }, { ethique: { compassion: 5, honneur: 3 } }, { drapeau: 'raid_renonce' }],
        resultat: 'Tu replies la carte. La bande grogne. Trois hommes partent dans la nuit. Les autres restent, sans comprendre. Toi non plus, tout à fait. Tu sais seulement qu’il y a, quelque part derrière ce mur, une boîte en fer enterrée sous un cèdre.',
      },
    ],
  },
  {
    ...base,
    id: 'hl_raid_porte',
    titre: 'La porte',
    categorie: 'trahison',
    lieu: '$porte',
    enchaine: true,
    si: HORS_LA_LOI,
    texte: [
      { texte: 'Trois heures du matin. Le mur de {village}, la porte est, la lanterne du poste de garde.' },
      { si: AMI_VIVANT, texte: 'Sous la lanterne, le garde de nuit lève les yeux. {@coequipierA}. {Il:@coequipierA} te reconnaît dans la seconde. {Il:@coequipierA} ne crie pas. Pas encore.' },
      { si: { non: AMI_VIVANT }, texte: 'Sous la lanterne, un jeune chūnin que tu ne connais pas lutte contre le sommeil. Il a l’âge que tu avais quand tu as quitté ce village.' },
    ],
    choix: [
      {
        id: 'tuer',
        texte: 'Le faire taire pour toujours',
        effets: [
          { drapeau: 'crime_meurtres', incr: 1 },
          { ethique: { compassion: -10 } },
          { si: AMI_VIVANT, alors: [{ pnjEtat: '@coequipierA', etat: 'mort', cause: 'tué·e à son poste de garde, la nuit du raid' }, { drapeau: 'ami_tue_raid' }] },
        ],
        suite: 'hl_raid',
        resultat: [
          { si: { drapeau: 'ami_tue_raid' }, texte: '{@coequipierA} n’a pas levé son arme. Tu ne sauras jamais si c’était le temps qui manquait, ou l’envie. Tu enjambes son corps. Tu ne regardes pas son visage. Tu le verras quand même, toutes les nuits.' },
          { si: { drapeau: 'ami_tue_raid', absent: true }, texte: 'Le jeune chūnin s’effondre sans un bruit. La porte est ouverte.' },
        ],
      },
      {
        id: 'assommer',
        texte: 'L’assommer, et passer',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { agilite: 2, discretion: 2 },
          succes: { texte: 'Un coup précis à la nuque. Il s’affaisse contre la porte. Il vivra. Il ne te le pardonnera pas, mais il vivra.', effets: [{ ethique: { compassion: 2 } }] },
          echec: { texte: 'Il pare. Il a le temps de crier. Les cloches se mettent à sonner dans tout le village. Tu entres quand même, mais ils savent que tu es là.', effets: [{ drapeau: 'raid_alerte' }] },
        },
        suite: 'hl_raid',
      },
      {
        id: 'demi_tour',
        texte: 'Faire demi-tour',
        effets: [{ stat: 'social.reputationOmbre', delta: -15 }, { drapeau: 'raid_renonce' }, { ethique: { compassion: 5 } }],
        resultat: [
          { si: AMI_VIVANT, texte: 'Tu recules dans l’ombre. {@coequipierA} te regarde partir, sans donner l’alerte. À l’aube, {il:@coequipierA} dira n’avoir rien vu. C’est le dernier cadeau de votre amitié.' },
          { si: { non: AMI_VIVANT }, texte: 'Tu recules dans l’ombre. Le jeune chūnin ne saura jamais qu’il a vécu cette nuit-là parce que tu as reconnu ton propre visage dans le sien.' },
        ],
      },
    ],
  },
  {
    ...base,
    id: 'hl_raid',
    titre: 'La nuit du raid',
    categorie: 'guerre',
    lieu: '$village',
    enchaine: true,
    si: HORS_LA_LOI,
    texte: [
      { si: { drapeau: 'raid_alerte' }, texte: 'Les cloches sonnent. Des ninjas sautent de toit en toit. Ta bande se bat dans les rues que tu connais par cœur, et tu traverses le village au milieu des flammes.' },
      { si: { drapeau: 'raid_alerte', absent: true }, texte: 'Le village dort. Ta bande se déploie dans les rues silencieuses, et toi, tu marches vers ta cible par les toits que tu escaladais enfant.' },
    ],
    choix: [
      {
        id: 'kage',
        texte: 'Monter à la tour du {kage}',
        si: { drapeau: 'raid_cible', egal: 'kage' },
        verrou: 'Ce n’est pas ta cible cette nuit.',
        test: {
          type: 'combat',
          difficulte: 74,
          attributs: { agilite: 1, force: 1, controleChakra: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 2, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tué·e par le Kage, dans la tour, la nuit du raid',
          succes: {
            texte: 'Le {kage} se bat comme on ne t’a jamais appris à te battre. Mais il est vieux, et tu as trente ans de rage. Quand il tombe, il te regarde sans haine. « Tu étais à l’Académie. Je me souviens de toi. » Puis plus rien. Au-dessus du village, la lune se lève sur une tour silencieuse.',
            effets: [{ pnjEtat: '@kage', etat: 'mort', cause: 'tué dans sa tour, la nuit du raid' }, { drapeau: 'crime_kage' }, { drapeau: 'crime_raid' }, { fin: 'regicide', cause: 'a tué le Kage de son ancien village' }],
          },
          partiel: {
            texte: 'Ta lame l’atteint au flanc. Pas assez profond. Le {kage} recule, la main sur la blessure, et les gardes envahissent la salle. Tu sautes par la fenêtre. Tu as levé la main sur le Kage. Le monde entier le saura avant l’aube.',
            effets: [{ drapeau: 'crime_kage' }, { drapeau: 'crime_raid' }, { stat: 'social.reputationOmbre', delta: 30 }, { blessure: { id: 'tour_kage', nom: 'Blessures de la tour', gravite: 3, jours: 80 } }, { retour: 'hl_traqueurs', chance: 1, entre: [30, 90] }],
          },
          echec: {
            texte: 'Il n’a même pas besoin de se lever de son bureau. Quand tu reprends conscience, tu es dans une cellule sous la tour, et le sceau sur ta poitrine bride ton chakra.',
            effets: [{ drapeau: 'crime_raid' }, { statut: 'capture' }, { fin: 'capture', cause: 'pris·e dans la tour du Kage, la nuit du raid' }],
          },
        },
      },
      {
        id: 'tresor',
        texte: 'Descendre au trésor',
        si: { drapeau: 'raid_cible', egal: 'tresor' },
        verrou: 'Ce n’est pas ta cible cette nuit.',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { discretion: 2, controleChakra: 1, intellect: 1 },
          succes: { texte: 'Sept sceaux, sept serrures. Tu les connais tous : tu as appris à les tracer à l’Académie. À l’aube, ta bande est à dix lieues avec le trésor de guerre de {village}. Le village ne pourra pas payer ses ninjas pendant un an.', effets: [{ drapeau: 'crime_raid' }, { stat: 'jauges.ryo', delta: 3000 }, { stat: 'social.reputationOmbre', delta: 25 }, { retour: 'hl_traqueurs', chance: 1, entre: [30, 90] }] },
          partiel: { texte: 'Le cinquième sceau déclenche l’alarme. Tu repars avec ce que tu peux porter, sous une pluie de kunai.', effets: [{ drapeau: 'crime_raid' }, { stat: 'jauges.ryo', delta: 800 }, { stat: 'social.reputationOmbre', delta: 15 }, { stat: 'jauges.sante', delta: -20 }, { retour: 'hl_traqueurs', chance: 1, entre: [30, 90] }] },
          echec: { texte: 'Le premier sceau était un piège. Le sol s’ouvre sous tes pieds. Quand tu te réveilles, c’est dans une cellule.', effets: [{ drapeau: 'crime_raid' }, { statut: 'capture' }, { fin: 'capture', cause: 'pris·e dans le trésor de son ancien village' }] },
        },
      },
      {
        id: 'archives',
        texte: 'Entrer aux archives interdites',
        si: { drapeau: 'raid_cible', egal: 'archives' },
        verrou: 'Ce n’est pas ta cible cette nuit.',
        test: {
          type: 'competence',
          difficulte: 64,
          attributs: { discretion: 2, intellect: 2 },
          succes: { texte: 'Les rouleaux que le village gardait pour ses meilleurs. Tu en emportes trois, au hasard de ce que tes bras peuvent tenir. Tu passeras des années à les déchiffrer. Ils valent plus que tout le trésor.', effets: [{ drapeau: 'crime_raid' }, { entrainer: 'ninjutsu', jours: 120 }, { stat: 'attributs.controleChakra', delta: 5 }, { stat: 'social.reputationOmbre', delta: 20 }, { retour: 'hl_traqueurs', chance: 1, entre: [30, 90] }] },
          echec: { texte: 'Le gardien des archives t’attendait. Il est vieux, aveugle, et il te bat sans se lever. Tu te réveilles enchaîné·e.', effets: [{ drapeau: 'crime_raid' }, { statut: 'capture' }, { fin: 'capture', cause: 'pris·e dans les archives interdites' }] },
        },
      },
    ],
  },
];
