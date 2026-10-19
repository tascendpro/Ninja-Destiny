import type { Condition, EventDef } from '../../engine/types';

const enfance = (clan: string): Condition => ({ tout: [{ clan }, { ageDepart: 6 }] });

const base = {
  chapitre: 1,
  arc: 'origines' as const,
  priorite: 95,
};

export const EVENEMENTS_CLANS: EventDef[] = [
  {
    ...base,
    id: 'o_clan_uchiha',
    titre: 'Le regard du clan',
    categorie: 'conflit_clans',
    lieu: '$maison',
    si: enfance('uchiha'),
    personnages: ['@aine', '@parent'],
    texte:
      'Le quartier Uchiha vit à l’écart, derrière des murs blancs frappés de l’éventail. Ce soir, l’ancien du clan rend visite à {parent}. Depuis l’escalier, tu entends : « Le village nous surveille. Les enfants doivent comprendre très tôt qui ils sont. »\n\n{AineNom} t’aperçoit dans l’ombre et pose un doigt sur ses lèvres.',
    choix: [
      {
        id: 'ecouter',
        texte: 'Écouter jusqu’au bout',
        effets: [{ secret: 'surveillance_uchiha' }, { stat: 'attributs.discretion', delta: 2 }, { decouvrir: 'organisation:police_uchiha' }],
        resultat:
          'Tu apprends des mots que tu ne comprends pas encore : « unités de l’ombre », « Conseil », « on nous a donné la police pour nous tenir en laisse ». {Aine} te ramène dans ta chambre. « Tu n’as rien entendu », dit-{aine_il}. Ce n’est pas une question.',
      },
      {
        id: 'descendre',
        texte: 'Descendre demander ce que tu es censé·e comprendre',
        effets: [{ ethique: { honneur: 6 } }, { relation: '@parent', delta: { respect: 6 } }, { stat: 'social.confianceClan', delta: 3 }, { decouvrir: 'pouvoir:sharingan' }],
        resultat:
          'L’ancien te détaille longtemps. « Tu comprendras le jour où tes yeux s’ouvriront. Certains ne les ouvrent jamais. Prie pour ne pas être de ceux-là — et prie aussi pour ce qu’il faudra perdre pour qu’ils s’ouvrent. »',
      },
      {
        id: 'lancer',
        texte: 'Remonter avec {aine} et lui demander de t’apprendre à lancer',
        effets: [{ relation: '@aine', delta: { amitie: 8 } }, { entrainer: 'famille_kunai', jours: 15, mentor: true }],
        resultat: 'Dans la cour, à la lumière de la lune, {aine} te montre comment tenir un kunai. Les voix des adultes continuent derrière les cloisons. Vous faites semblant de ne pas les entendre.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_hyuga',
    titre: 'Le sceau',
    categorie: 'conflit_clans',
    lieu: '$maison',
    si: enfance('hyuga'),
    personnages: ['@parent', '@coequipierB'],
    texte: [
      {
        texte:
          'Dans la demeure Hyūga, tout se mesure : les pas, les voix, les regards. À six ans, tu vois déjà les veines de chakra qui battent sous la peau des adultes — ton Byakugan s’est éveillé cet hiver, comme chez presque tous les enfants du clan.',
      },
      {
        si: { drapeau: 'hyuga_branche', egal: 'secondaire' },
        texte: 'Aujourd’hui, c’est ton tour. Les anciens de la branche principale t’attendent dans la salle des sceaux. {Parent} te tient la main un peu trop fort. Ta cousine {@coequipierB}, qui porte déjà la marque, détourne les yeux.',
      },
      {
        si: { drapeau: 'hyuga_branche', egal: 'principale' },
        texte: 'Aujourd’hui, ta cousine {@coequipierB}, de la branche secondaire, reçoit le sceau. Les anciens ont exigé ta présence : un jour, c’est toi qui tiendras ce pouvoir sur elle.',
      },
    ],
    choix: [
      {
        id: 'accepter',
        texte: 'Recevoir le sceau sans un mot',
        si: { drapeau: 'hyuga_branche', egal: 'secondaire' },
        effets: [
          { stat: 'social.confianceClan', delta: 8 },
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { secret: 'sceau_oiseau_cage' },
          { objet: 'sceau_branche' },
          { relation: '@coequipierB', delta: { respect: 10 } },
        ],
        resultat: 'La douleur est brève. La marque, elle, restera. Les anciens hochent la tête : tu as été digne. Le soir, {@coequipierB} t’apprend ce que le sceau peut faire. Tu ne dors pas.',
      },
      {
        id: 'pourquoi',
        texte: 'Demander pourquoi',
        si: { drapeau: 'hyuga_branche', egal: 'secondaire' },
        effets: [
          { ethique: { honneur: 6, ambition: 6 } },
          { stat: 'social.confianceClan', delta: -6 },
          { secret: 'sceau_oiseau_cage' },
          { objet: 'sceau_branche' },
          { relation: '@coequipierB', delta: { amitie: 10 } },
        ],
        resultat: '« Parce que tu es né·e du mauvais côté », répond l’ancien, simplement. Le sceau est posé quand même. Mais tu as posé la question à voix haute, et {@coequipierB} ne l’oubliera pas.',
      },
      {
        id: 'regarder',
        texte: 'Regarder la cérémonie jusqu’au bout',
        si: { drapeau: 'hyuga_branche', egal: 'principale' },
        effets: [{ stat: 'social.confianceClan', delta: 8 }, { ethique: { ambition: 4 } }, { secret: 'sceau_oiseau_cage' }],
        resultat: 'Tu ne baisses pas les yeux. L’ancien t’explique le geste qui active le sceau. « Un jour, tu en auras besoin. » Tu espères que non.',
      },
      {
        id: 'main',
        texte: 'Prendre la main de ta cousine après la cérémonie',
        si: { drapeau: 'hyuga_branche', egal: 'principale' },
        effets: [
          { relation: '@coequipierB', delta: { amitie: 15, confiance: 10 } },
          { ethique: { compassion: 8 } },
          { stat: 'social.confianceClan', delta: -4 },
          { secret: 'sceau_oiseau_cage' },
        ],
        resultat: 'Elle ne retire pas sa main. Un ancien vous voit et fronce les sourcils : les enfants de la branche principale ne consolent pas ceux de la branche secondaire. Tu viens d’enfreindre une règle que personne n’écrit.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_nara',
    titre: 'La forêt des cerfs',
    categorie: 'enfance',
    lieu: 'foret_feu',
    si: enfance('nara'),
    personnages: ['@parent'],
    texte:
      'La forêt des Nara est interdite au reste du village. Ici, les cerfs ne fuient pas, et {parent} marche sans bruit entre les troncs. « Regarde les ombres », dit-{parent_il}. « Pas les arbres. Les ombres. Elles disent tout. »',
    choix: [
      {
        id: 'cerfs',
        texte: 'Suivre un jeune cerf jusqu’à la clairière',
        effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.discretion', delta: 2 }],
        resultat: 'Le cerf te mène à une clairière où la mousse pousse en cercle. {Parent} sourit : « Il t’a choisi·e. » Tu ne sais pas si c’est une plaisanterie.',
      },
      {
        id: 'ombres',
        texte: 'Fixer ton ombre jusqu’à ce qu’elle bouge',
        effets: [{ drapeau: 'ombre_frisson' }, { stat: 'attributs.controleChakra', delta: 2 }, { decouvrir: 'pouvoir:kagemane' }],
        resultat: 'Une seconde — peut-être moins — ton ombre frémit sans toi. {Parent} s’accroupit. « Pas encore. Mais bientôt. Et ce jour-là, tu comprendras pourquoi on dit que les Nara pensent trop. »',
      },
      {
        id: 'dormir',
        texte: 'Te coucher sous un arbre et regarder les nuages',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'attributs.intellect', delta: 2 }],
        resultat: '{Parent} s’allonge à côté de toi sans rien dire. Tu comptes les nuages, puis les choses que tu voudrais comprendre. La deuxième liste est plus longue.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_yamanaka',
    titre: 'Le langage des fleurs',
    categorie: 'enfance',
    lieu: '$village',
    si: enfance('yamanaka'),
    personnages: ['@parent'],
    texte:
      'La boutique de fleurs des Yamanaka sent la terre mouillée. Une cliente entre, les yeux rouges, et demande des chrysanthèmes blancs — des fleurs de deuil. Pendant qu’elle hésite, {parent} pose une main sur ton épaule : « Elle ment sur quelque chose. Tu le sens, toi aussi ? »',
    choix: [
      {
        id: 'ecouter',
        texte: 'Lui demander pour qui sont les fleurs',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 6 } }],
        resultat: 'Elle éclate en sanglots. Son fils n’est pas mort : il a déserté. Elle achète des fleurs de deuil pour que les voisins ne posent pas de questions. Tu ne diras rien. {Parent} non plus.',
      },
      {
        id: 'bouquet',
        texte: 'Composer le bouquet avec soin, sans poser de question',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.ryo', delta: 5 }],
        resultat: 'Tu choisis chaque tige comme si elle comptait. La cliente laisse un pourboire. {Parent} dit que tu as « la main » — mais qu’un jour, il faudra aussi avoir le courage de regarder.',
      },
      {
        id: 'fixer',
        texte: 'La fixer comme le fait {parent}, pour entrer dans sa tête',
        effets: [{ drapeau: 'esprit_curieux' }, { stat: 'attributs.controleChakra', delta: 2 }, { decouvrir: 'pouvoir:shintenshin' }],
        resultat: 'Tu sens un vertige, comme une porte entrouverte. Puis {parent} te tire en arrière, sec. « Jamais sans permission. Jamais. Ce qu’on trouve dans la tête des autres ne se désapprend pas. »',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_akimichi',
    titre: 'Le banquet',
    categorie: 'enfance',
    lieu: '$village',
    si: enfance('akimichi'),
    personnages: ['@rival'],
    texte:
      'Le clan Akimichi fête la fin de l’hiver par un banquet qui dure tout l’après-midi. En chemin, des enfants t’ont suivi en gonflant les joues. Parmi eux, {@rival}, qui ne rit pas — il observe, et c’est pire.',
    choix: [
      {
        id: 'rire',
        texte: 'Rire avec eux et les inviter au banquet',
        effets: [{ stat: 'attributs.charisme', delta: 4 }, { stat: 'social.reputation', delta: 2 }, { relation: '@rival', delta: { respect: 4 } }],
        resultat: 'Ils ne s’attendaient pas à ça. La moitié vient, mange, et repart ton ami. {@rival} refuse l’invitation, mais il ne se moque plus jamais de toi.',
      },
      {
        id: 'frapper',
        texte: 'Foncer sur le plus bruyant',
        effets: [{ stat: 'attributs.force', delta: 2 }, { ethique: { honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: -2 }, { relation: '@rival', delta: { rivalite: 6 } }],
        resultat: 'Il tombe sur le derrière, et toute la rue éclate de rire — de lui, cette fois. {Parent} te gronde pour la forme, puis te sert double ration.',
      },
      {
        id: 'silence',
        texte: 'Les ignorer et continuer ta route',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }],
        resultat: 'Leurs voix finissent par se lasser. Au banquet, ton grand-oncle te dit que la patience est la plus lourde des forces du clan. Tu le crois.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_aburame',
    titre: 'La colonie',
    categorie: 'enfance',
    lieu: '$academie',
    si: enfance('aburame'),
    personnages: ['@coequipierA'],
    texte:
      'La colonie installée dans ton corps cet hiver s’est éveillée. Elle bourdonne sous ta peau quand tu as peur. Aujourd’hui, dans la cour, un insecte s’est échappé de ta manche, et les autres enfants ont reculé comme devant un chien enragé. Seul{e:@coequipierA} {@coequipierA} est resté{e:@coequipierA}.',
    choix: [
      {
        id: 'montrer',
        texte: 'Leur montrer fièrement ce que tes insectes savent faire',
        effets: [{ ethique: { honneur: 5 } }, { stat: 'social.reputation', delta: -2 }, { entrainer: 'kikaichu', jours: 15 }],
        resultat: 'Tu fais voler une petite nuée en cercle. Certains enfants admirent. La plupart ont encore plus peur. Mais ta colonie a obéi, et c’est la première fois.',
      },
      {
        id: 'cacher',
        texte: 'Rappeler l’insecte et cacher tes bras',
        effets: [{ stat: 'attributs.discretion', delta: 3 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu apprends ce jour-là à respirer lentement pour calmer la colonie. Ce sera utile toute ta vie.',
      },
      {
        id: 'expliquer',
        texte: 'Expliquer à {@coequipierA} comment vivent tes insectes',
        effets: [{ relation: '@coequipierA', delta: { amitie: 12, confiance: 8 } }, { stat: 'attributs.charisme', delta: 2 }],
        resultat: '{@coequipierA} écoute, pose mille questions, et finit par laisser un insecte marcher sur son doigt. « Il est mignon », dit-{il:@coequipierA}. Tu ne l’oublieras pas.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_inuzuka',
    titre: 'Le choix du chiot',
    categorie: 'clan_rare',
    lieu: '$maison',
    si: enfance('inuzuka'),
    personnages: ['@parent'],
    texte:
      'Au chenil des Inuzuka, la matriarche a posé trois chiots devant toi. Chez nous, dit-elle, ce n’est pas toi qui choisis — c’est le chien. Mais il faut bien que tu tendes la main vers l’un d’eux.\n\nKuro, massif et calme, qui ne recule devant rien. Hayate, nerveuse, déjà en train de courir. Tsumugi, rusée, qui a ouvert la cage toute seule.',
    choix: [
      {
        id: 'kuro',
        texte: 'Tendre la main vers Kuro',
        effets: [
          { role: 'ninken', pnj: 'ninken_kuro' },
          { tenterEveil: 'ninken_lien', intensite: 100 },
          { relation: 'ninken_kuro', delta: { amitie: 40, confiance: 40 } },
          { stat: 'attributs.force', delta: 3 },
        ],
        resultat: 'Kuro renifle ta main, puis s’assoit contre ta jambe et ne bouge plus. La matriarche hoche la tête. « Il ne te lâchera jamais. Fais en sorte de le mériter. »',
      },
      {
        id: 'hayate',
        texte: 'Tendre la main vers Hayate',
        effets: [
          { role: 'ninken', pnj: 'ninken_hayate' },
          { tenterEveil: 'ninken_lien', intensite: 100 },
          { relation: 'ninken_hayate', delta: { amitie: 40, confiance: 40 } },
          { stat: 'attributs.agilite', delta: 3 },
        ],
        resultat: 'Hayate te mordille les doigts, file à l’autre bout du chenil, revient. Encore. Encore. La matriarche rit. « Elle t’a choisi·e. Tu vas courir toute ta vie. »',
      },
      {
        id: 'tsumugi',
        texte: 'Tendre la main vers Tsumugi',
        effets: [
          { role: 'ninken', pnj: 'ninken_tsumugi' },
          { tenterEveil: 'ninken_lien', intensite: 100 },
          { relation: 'ninken_tsumugi', delta: { amitie: 40, confiance: 40 } },
          { stat: 'attributs.perception', delta: 3 },
        ],
        resultat: 'Tsumugi ignore ta main, grimpe dans ta poche et y vole la boulette de riz que tu y gardais. La matriarche soupire. « Celle-là n’obéira qu’à qui la mérite. Bon courage. »',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_senju',
    titre: 'L’héritage des bois',
    categorie: 'heritage',
    lieu: '$village',
    si: enfance('senju'),
    personnages: ['@parent'],
    texte:
      'Il ne reste qu’une poignée de familles Senju, et toutes vivent autour du sanctuaire des bois, là où le fondateur aurait fait pousser une forêt en une nuit. La gardienne y conserve une lame de bois vivant, Shinboku, que personne n’a le droit de toucher.\n\n« Tu portes le nom des fondateurs », dit {parent}. « On attendra de toi des choses impossibles. Ne les attends pas de toi-même. »',
    choix: [
      {
        id: 'prier',
        texte: 'Te recueillir devant le sanctuaire',
        effets: [{ ethique: { compassion: 4, honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { decouvrir: 'arme:shinboku' }],
        resultat: 'Le silence du sanctuaire te calme. Tu as l’impression, absurde, que les arbres te regardent avec bienveillance.',
      },
      {
        id: 'histoire',
        texte: 'Demander l’histoire du fondateur',
        effets: [{ decouvrir: ['histoire:fondation', 'arme:shinboku'] }, { stat: 'attributs.intellect', delta: 2 }],
        resultat: 'La gardienne raconte la guerre des clans, le pacte, la forêt. Puis elle ajoute, plus bas : « Le dernier porteur du bois est mort il y a trente ans. Officiellement. »',
      },
      {
        id: 'toucher',
        texte: 'Poser ta main sur l’arbre le plus ancien',
        effets: [{ drapeau: 'arbre_touche' }, { relation: '@parent', delta: { respect: 4 } }, { decouvrir: 'arme:shinboku' }],
        resultat: 'L’écorce est tiède, presque vivante. Rien ne se passe. {Parent} te regarde avec un mélange de soulagement et de déception que tu ne comprendras que bien plus tard.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_uzumaki',
    titre: 'Les spirales',
    categorie: 'heritage',
    lieu: '$maison',
    si: enfance('uzumaki'),
    personnages: ['@parent'],
    texte:
      'Les Uzumaki de Konoha vivent dans un quartier de réfugiés devenu permanent. Ta chevelure rouge te désigne à tous les regards. Ce soir, {parent} déroule un parchemin couvert de spirales : un sceau de stockage d’Uzushio, le village englouti. « On a tout perdu, sauf ça », dit-{parent_il}.',
    choix: [
      {
        id: 'copier',
        texte: 'Recopier le sceau toute la nuit',
        effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 25, mentor: true }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.fatigue', delta: 15 }],
        resultat: 'À l’aube, ta trentième copie fonctionne : une gomme disparaît dans le papier et réapparaît. {Parent} pleure, un peu. Tu ne sais pas si c’est de fierté ou de chagrin.',
      },
      {
        id: 'uzushio',
        texte: 'Demander comment Uzushio est tombé',
        effets: [{ secret: 'chute_uzushio' }, { decouvrir: 'histoire:uzushio' }, { ethique: { ambition: 4 } }],
        resultat: '« Une coalition de villages. Ils avaient peur de nos sceaux. » {Parent} hésite. « Certains d’entre eux sont nos alliés aujourd’hui. » Tu comprends que la paix est faite de choses qu’on choisit d’oublier.',
      },
      {
        id: 'capuche',
        texte: 'Cacher tes cheveux sous une capuche demain',
        effets: [{ stat: 'attributs.discretion', delta: 4 }, { drapeau: 'cache_cheveux' }, { stat: 'social.confianceClan', delta: -3 }],
        resultat: '{Parent} ne dit rien, mais sa mâchoire se serre. Le lendemain, personne ne te remarque. Tu ne sais pas si tu as gagné ou perdu quelque chose.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_hozuki',
    titre: 'L’eau dans les veines',
    categorie: 'enfance',
    lieu: 'cotes_brume',
    si: enfance('hozuki'),
    personnages: ['@rival'],
    texte:
      'Chez les Hōzuki, on apprend à fondre son corps avant d’apprendre à lire. Sur la grève, les enfants du clan jouent à se liquéfier sous les coups. Ton cousin {@rival} te provoque : « Montre que tu es un vrai Hōzuki. Laisse-moi te frapper. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Le laisser frapper et te liquéfier',
        test: {
          type: 'competence',
          difficulte: 35,
          attributs: { controleChakra: 2, controleEmotionnel: 1 },
          maitrises: { hydrification: 2 },
          succes: {
            texte: 'Son poing traverse ton ventre comme de l’eau. Les autres enfants sifflent. {@rival} te regarde pour la première fois comme un égal.',
            effets: [{ relation: '@rival', delta: { respect: 10 } }, { stat: 'social.confianceClan', delta: 5 }, { entrainer: 'hydrification', jours: 15 }],
          },
          echec: {
            texte: 'Tu te crispes au dernier moment. Le coup te plie en deux. {@rival} rit, puis te tend la main — avec un mépris très poli.',
            effets: [{ stat: 'jauges.sante', delta: -8 }, { relation: '@rival', delta: { rivalite: 8 } }, { entrainer: 'hydrification', jours: 15 }],
          },
        },
      },
      {
        id: 'retourner',
        texte: 'Le frapper d’abord',
        effets: [{ relation: '@rival', delta: { rivalite: 10, respect: 4 } }, { stat: 'attributs.force', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: -2 }],
        resultat: 'Ton poing traverse son épaule — il s’est liquéfié avant toi. Il éclate de rire. « T’es pas si mou, finalement. » C’est le début d’une rivalité.',
      },
      {
        id: 'boire',
        texte: 'Refuser et aller boire à la source',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.confianceClan', delta: -3 }, { drapeau: 'hydratation_attentive' }],
        resultat: 'Ton grand-père, assis près de la source, approuve en silence. « Un Hōzuki assoiffé est un Hōzuki mort. Les autres apprendront ça trop tard. »',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_kaguya',
    titre: 'Le chant des os',
    categorie: 'conflit_clans',
    lieu: '$village',
    si: enfance('kaguya'),
    personnages: ['@coequipierB'],
    texte:
      'Les anciens Kaguya organisent chaque printemps une « danse » entre enfants : un combat sans règles, sous les yeux du clan. Ce matin, on te place face à {@coequipierB}. Les adultes chantent. Ils attendent du sang.',
    choix: [
      {
        id: 'furie',
        texte: 'Te battre avec rage',
        test: {
          type: 'combat',
          difficulte: 40,
          attributs: { force: 2, agilite: 1 },
          maitrises: { taijutsu: 1 },
          succes: {
            texte: '{@coequipierB} tombe. Les anciens hurlent de joie. Quelque chose a craqué sous ta peau pendant le combat — une douleur sourde le long de ton bras.',
            effets: [{ stat: 'social.confianceClan', delta: 10 }, { relation: '@coequipierB', delta: { rivalite: 8, respect: 8 } }, { eveilDanger: 30 }, { ethique: { compassion: -4 } }],
          },
          echec: {
            texte: '{@coequipierB} te met à terre. Les anciens ne te regardent plus. Ton bras te brûle, comme si quelque chose voulait en sortir.',
            effets: [{ stat: 'jauges.sante', delta: -10 }, { relation: '@coequipierB', delta: { respect: 4 } }, { eveilDanger: 30 }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser de combattre',
        effets: [{ stat: 'social.confianceClan', delta: -12 }, { ethique: { compassion: 8, honneur: 4 } }, { relation: '@coequipierB', delta: { respect: 8 } }, { drapeau: 'refus_danse' }],
        resultat: 'Le chant s’arrête net. Un ancien te gifle. {@coequipierB}, en face, baisse ses poings lui aussi, très lentement. Vous serez punis tous les deux. Vous ne le regretterez ni l’un ni l’autre.',
      },
      {
        id: 'epargner',
        texte: 'Combattre, mais t’arrêter avant de le blesser',
        effets: [{ entrainer: 'taijutsu', jours: 15 }, { relation: '@coequipierB', delta: { amitie: 10, respect: 6 } }, { stat: 'social.confianceClan', delta: -4 }],
        resultat: 'Tu le tiens au sol, et tu le relâches. Les anciens grondent. {@coequipierB} te dit, en se relevant : « Tu aurais pu. » Tu réponds : « Je sais. »',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_yuki',
    titre: 'Le froid caché',
    categorie: 'secret_familial',
    lieu: '$maison',
    si: enfance('yuki'),
    personnages: ['@parent'],
    texte:
      'Ce matin, le thé a gelé dans ta tasse pendant que tu la tenais. {Parent} a brisé le givre d’un geste sec et regardé la fenêtre, puis la porte, puis toi.\n\n« Écoute-moi bien. À Kiri, notre sang est un crime. Les voisins croient que nous sommes une famille de pêcheurs. Il faut que ça reste vrai. Pour toujours. »',
    choix: [
      {
        id: 'promettre',
        texte: 'Promettre de ne jamais montrer la glace',
        effets: [
          { promesse: 'cacher_glace', pnj: '@parent', texte: 'Ne jamais montrer la glace à Kiri.' },
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { relation: '@parent', delta: { confiance: 8 } },
        ],
        resultat: '{Parent} te serre dans ses bras. Tu sens ses mains trembler. Une promesse d’enfant, pense-t-{parent_il}. Elle sera mise à l’épreuve.',
      },
      {
        id: 'pourquoi',
        texte: 'Demander pourquoi Kiri vous hait',
        effets: [{ secret: 'purges_kiri' }, { decouvrir: 'histoire:purges' }, { ethique: { honneur: 4 } }],
        resultat: '« Parce que le Mizukage a peur de ce qu’il ne contrôle pas. Et que la peur, chez un homme puissant, devient une loi. » Tu retiens chaque mot.',
      },
      {
        id: 'sortir',
        texte: 'Sortir jouer pour oublier',
        effets: [{ stat: 'social.suspicion', delta: 4 }, { drapeau: 'givre_vu_voisine' }],
        resultat: 'Dans la ruelle, tu tapes dans une flaque. Elle gèle sous ton pied. Une voisine, à sa fenêtre, a tout vu. Elle te sourit. Tu ne sais pas lire ce sourire.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_shirakaze',
    titre: 'Lire le vent',
    categorie: 'clan_rare',
    lieu: 'desert_vent',
    si: enfance('shirakaze'),
    personnages: ['@parent'],
    texte:
      'Au sommet d’une dune, {parent} lèche son doigt et le lève vers le ciel. « Une caravane part ce soir vers Kōsai. Le marchand veut savoir si la route sera sûre. Dis-moi ce que dit le vent. »',
    choix: [
      {
        id: 'predire',
        texte: 'Écouter le vent et donner ta réponse',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { perception: 2, intellect: 1 },
          succes: {
            texte: '« Tempête dans deux jours, par l’ouest. » {Parent} hoche lentement la tête. La caravane retarde son départ. Deux jours plus tard, la tempête arrive exactement par l’ouest.',
            effets: [{ stat: 'social.confianceClan', delta: 8 }, { stat: 'attributs.perception', delta: 3 }, { stat: 'jauges.ryo', delta: 10 }],
          },
          echec: {
            texte: '« Rien. Le ciel est calme. » {Parent} soupire et corrige : une tempête arrive. Le désert t’apprend l’humilité avant de t’apprendre ses secrets.',
            effets: [{ stat: 'attributs.perception', delta: 2 }, { relation: '@parent', delta: { respect: -2 } }],
          },
        },
      },
      {
        id: 'caravane',
        texte: 'Aider à charger les chameaux en écoutant les marchands',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { stat: 'jauges.ryo', delta: 8 }, { indice: 'cite_engloutie_rumeur' }],
        resultat: 'Les marchands parlent d’une « cité de verre » sous les dunes du sud-ouest, que les Shirakaze connaîtraient. {Parent} fait semblant de ne pas entendre.',
      },
      {
        id: 'dune',
        texte: 'Escalader seul·e la grande dune',
        effets: [{ stat: 'attributs.agilite', delta: 3 }, { stat: 'jauges.fatigue', delta: 15 }],
        resultat: 'Du sommet, tu vois Suna tout entière, minuscule dans son cratère. Tu comprends pourquoi on dit que le désert rend humble.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_raiko',
    titre: 'L’épreuve de l’orage',
    categorie: 'clan_rare',
    lieu: 'montagnes_foudre',
    si: enfance('raiko'),
    personnages: ['@parent', '@rival'],
    texte:
      'Une fois par an, les enfants Raikō montent au col sous l’orage et posent la main sur une tige de fer plantée dans la roche. La foudre ne frappe pas — pas vraiment — mais l’air crépite et les poils se dressent. Le plus endurant est honoré. Ta cousine {@rival} tient depuis une minute entière.',
    choix: [
      {
        id: 'tenir',
        texte: 'Tenir aussi longtemps que possible',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { controleEmotionnel: 2, force: 1 },
          succes: {
            texte: 'Tu tiens plus longtemps qu’elle. Les adultes se taisent. {@rival} te dévisage comme une ennemie — c’est-à-dire comme une égale.',
            effets: [{ stat: 'social.confianceClan', delta: 10 }, { relation: '@rival', delta: { rivalite: 10, respect: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
          },
          echec: {
            texte: 'Ta main lâche avant toi. Une brûlure fine dessine un éclair sur ta paume. Tu la garderas.',
            effets: [{ blessure: { id: 'brulure_foudre', nom: 'Brûlure de foudre', gravite: 1, jours: 30 } }, { relation: '@rival', delta: { rivalite: 4 } }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser l’épreuve',
        effets: [{ stat: 'social.confianceClan', delta: -8 }, { stat: 'attributs.intellect', delta: 2 }, { drapeau: 'refus_orage' }],
        resultat: '« La foudre n’a pas besoin qu’on lui prouve quoi que ce soit », dis-tu. Un capitaine éclate de rire ; les autres non.',
      },
      {
        id: 'cadet',
        texte: 'Aider un petit cousin qui pleure de peur',
        effets: [{ ethique: { compassion: 8 } }, { stat: 'attributs.charisme', delta: 2 }, { relation: '@parent', delta: { respect: 4 } }],
        resultat: 'Tu poses ta main à côté de la sienne sur la tige. Vous tenez ensemble. Ce n’est pas la règle. Personne n’ose le dire.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_ishikawa',
    titre: 'La peau de pierre',
    categorie: 'clan_rare',
    lieu: 'carrieres_terre',
    si: enfance('ishikawa'),
    personnages: ['@parent'],
    texte:
      'Chez les Ishikawa, les enfants portent des pierres dès qu’ils savent marcher. « La roche entre dans la peau par les mains », dit le dicton. Aujourd’hui, le maître carrier aligne des blocs de tailles différentes. Chacun choisit le sien.',
    choix: [
      {
        id: 'lourd',
        texte: 'Choisir le plus lourd',
        effets: [{ stat: 'attributs.force', delta: 4 }, { stat: 'jauges.fatigue', delta: 20 }, { stat: 'social.confianceClan', delta: 5 }],
        resultat: 'Tu le portes jusqu’au bout, en pleurant de rage. Le maître carrier ne dit rien. Le soir, il te donne une part de viande de plus.',
      },
      {
        id: 'compter',
        texte: 'Compter les blocs et organiser le transport',
        effets: [{ stat: 'attributs.intellect', delta: 4 }, { stat: 'attributs.charisme', delta: 2 }],
        resultat: 'Tu organises une chaîne d’enfants. Tout est transporté en deux fois moins de temps. Le maître carrier grogne que ce n’est pas l’exercice — et le note dans son carnet.',
      },
      {
        id: 'sculpter',
        texte: 'Tailler une petite figurine dans ta pierre',
        effets: [{ stat: 'attributs.agilite', delta: 2 }, { ethique: { compassion: 3 } }, { relation: '@parent', delta: { amitie: 6 } }],
        resultat: 'Tu offres la figurine à {parent}, qui la pose sur l’autel familial. Elle y est encore.',
      },
    ],
  },
  {
    ...base,
    id: 'o_clan_sans_clan',
    titre: 'Un nom à faire',
    categorie: 'enfance',
    lieu: '$maison',
    si: { tout: [enfance('sans_clan'), { drapeau: 'orphelin', absent: true }] },
    personnages: ['@parent'],
    texte:
      'Dans ta famille, personne n’a jamais été ninja. {Parent} travaille de l’aube à la nuit pour payer ta place à l’Académie. Dans la rue, les enfants des clans ont leurs emblèmes brodés sur le dos. Toi, tu n’as qu’un nom. Le tien.',
    choix: [
      {
        id: 'promesse',
        texte: 'Promettre à {parent} que ce nom sera connu',
        effets: [
          { promesse: 'nom_connu', pnj: '@parent', texte: 'Que ton nom soit un jour connu de tout le village.' },
          { ethique: { ambition: 8 } },
          { relation: '@parent', delta: { attachement: 8 } },
        ],
        resultat: '{Parent} rit, puis s’arrête de rire en voyant ton visage. « Alors fais-le pour toi. Pas pour moi. » Tu le feras pour les deux.',
      },
      {
        id: 'aider',
        texte: 'Aider {parent} au travail le matin, avant l’Académie',
        effets: [{ stat: 'jauges.ryo', delta: 15 }, { stat: 'attributs.charisme', delta: 3 }, { relation: '@parent', delta: { amitie: 10 } }],
        resultat: 'Tu apprends à compter, à négocier, à sourire aux clients difficiles. Des talents que l’Académie n’enseigne pas, et qui te serviront plus souvent qu’un kunai.',
      },
      {
        id: 'nuit',
        texte: 'T’entraîner seul·e la nuit',
        effets: [{ entrainer: 'taijutsu', jours: 20 }, { stat: 'jauges.fatigue', delta: 15 }, { ethique: { ambition: 4 } }],
        resultat: 'Dans la cour, sous la lune, tu frappes un poteau jusqu’à ce que tes poings saignent. Personne ne t’a appris. Personne ne t’arrêtera.',
      },
    ],
  },
  {
    ...base,
    id: 'o_orphelinat',
    titre: 'Sans nom',
    categorie: 'enfance',
    lieu: '$maison',
    si: { tout: [enfance('sans_clan'), { drapeau: 'orphelin' }] },
    personnages: ['@parent', '@aine'],
    texte:
      'À l’orphelinat, on dort à huit par chambre et on mange ce qu’il reste. Personne ici n’a de nom de famille : seulement un prénom, et parfois un surnom qui colle. {Parent} tient la maison d’une main de fer et d’un cœur qu’{parent_il} cache mal. {AineNom}, arrivé{aine_e} le même hiver que toi, a décidé un jour que vous étiez de la même famille. Personne n’a osé le contredire.\n\nCe matin, des enfants de clan passent devant la grille avec leurs emblèmes brodés dans le dos. L’un d’eux te demande, sans méchanceté : « Et toi, tu es de qui ? »',
    choix: [
      {
        id: 'personne',
        texte: '« De personne. Mon nom, je le ferai moi-même. »',
        effets: [
          { promesse: 'nom_connu', pnj: '@aine', texte: 'Que ton prénom seul suffise un jour à te faire reconnaître.' },
          { ethique: { ambition: 8 } },
          { stat: 'attributs.controleEmotionnel', delta: 3 },
        ],
        resultat: 'L’enfant hausse les épaules et repart. {AineNom} te donne un coup de coude. « Bien répondu. Maintenant il va falloir le faire. »',
      },
      {
        id: 'aine',
        texte: '« De {aineNom}. » Et tu montres {le:@aine} du doigt.',
        effets: [{ relation: '@aine', delta: { attachement: 12, amitie: 8 } }, { ethique: { compassion: 4 } }],
        resultat: '{AineNom} rougit jusqu’aux oreilles, puis prend un air très digne pour le reste de la journée. Le soir, {il:@aine} partage sa ration avec toi sans rien dire.',
      },
      {
        id: 'demander',
        texte: 'Le soir, demander à {parent} qui étaient tes parents',
        effets: [{ relation: '@parent', delta: { confiance: 8 } }, { indice: 'origines_orphelin' }, { stat: 'attributs.perception', delta: 2 }],
        resultat:
          '{Parent} te regarde longtemps. « Je ne sais pas tout. Tu es arrivé{e} une nuit de la dernière année de guerre, avec une couverture et rien d’autre. Celui qui t’a déposé{e} portait un bandeau du village. » {Parent_il} hésite. « Quand tu seras ninja, les archives te diront peut-être le reste. Peut-être pas. »',
      },
    ],
  },
];
