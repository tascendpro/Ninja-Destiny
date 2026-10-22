import type { Condition, Effect, EventDef, Texte } from '../../engine/types';

/**
 * L'apprentissage de 6 à 12 ans : l'aîné·e qui t'entraîne, la leçon du clan (une vraie technique, même sans l'affinité),
 * et les gens autour de toi qui demandent, proposent, défient. Chaque séance donne des points dans ce qu'elle travaille,
 * et en reprend quand elle tourne mal.
 */
const ACTIF: Condition = { statut: 'actif' };
const AINE: Condition = { pnj: '@aine', etat: ['vivant', 'blesse'] };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const B: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };
const SENSEI: Condition = { pnj: '@sensei', etat: ['vivant', 'blesse'] };
const enfance = { chapitre: 1, chapitres: [1, 2], arc: 'formation' as const };

// ── La leçon du clan ─────────────────────────────────────────────

/** Une technique enseignée seulement si le pouvoir dont elle dépend est éveillé ; sinon, ce pouvoir s'entraîne sous un maître. */
const signature = (pouvoir: string, palier: number, technique: string): Effect => ({
  si: { maitrise: pouvoir, palierMin: palier },
  alors: [{ enseigner: technique }, { entrainer: pouvoir, jours: 30, mentor: true }],
  sinon: [{ tenterEveil: pouvoir, intensite: 20 }, { entrainer: pouvoir, jours: 60, mentor: true }],
});
/** Un pouvoir de clan qui s'entraîne d'abord, puis une technique de nature qui s'apprend avec lui. */
const pouvoirEtNature = (pouvoir: string, technique: string): Effect[] => [{ tenterEveil: pouvoir, intensite: 20 }, { entrainer: pouvoir, jours: 50, mentor: true }, { enseigner: technique }];

const LECON_PAR_CLAN: Record<string, { maitre: string; effets: Effect[]; reussite: string }> = {
  uchiha: {
    maitre: 'Ton père t’emmène sur le ponton du lac, derrière le quartier. « Tous les Uchiha apprennent ça avant leurs dix ans. Tous. » Il compose les signes, inspire, et une boule de feu large comme une maison roule sur l’eau.',
    effets: [{ enseigner: 'katon_boule' }, { entrainer: 'nature_katon', jours: 30, mentor: true }],
    reussite: 'Au quarantième essai, une boule de feu de la taille d’un melon sort de ta bouche et s’écrase sur l’eau en sifflant. Ta gorge brûle. Ton père ne sourit pas. Il hoche la tête une fois, et rentre. C’est plus qu’il n’a jamais donné.',
  },
  hyuga: {
    maitre: 'Un ancien de la branche principale t’attend dans la cour du domaine, les mains derrière le dos. « Le Jūken n’est pas un art de frapper. C’est un art de fermer. Montre-moi tes paumes. »',
    effets: [signature('juken', 2, 'hyuga_kusho')],
    reussite: 'Tu frappes le vide, et pour la première fois, l’air répond : une onde de chakra fait trembler la lanterne à trois pas. L’ancien plisse les yeux. « Encore. » Tu recommences jusqu’au soir, jusqu’à ce que la lanterne tombe.',
  },
  nara: {
    maitre: 'Ton père s’allonge dans l’herbe de la forêt des cerfs et te fait signe de faire pareil. « La technique des Nara, c’est d’abord savoir où est le soleil. Ensuite seulement, on fait bouger son ombre. »',
    effets: [{ tenterEveil: 'kagemane', intensite: 25 }, { entrainer: 'kagemane', jours: 60, mentor: true }, { stat: 'attributs.intellect', delta: 2 }],
    reussite: 'Ton ombre se détache de toi, rampe sur un pas, et touche celle d’un cerf qui broutait. Il se fige, la tête levée. Tu le tiens trois secondes. Ton père ouvre un œil. « Bien. Maintenant, apprends à le lâcher sans qu’il te charge. »',
  },
  yamanaka: {
    maitre: 'Ta mère ferme la boutique de fleurs pour l’après-midi. Elle pose un oiseau blessé sur la table. « Avant d’entrer dans un humain, on apprend à entrer dans quelque chose de petit, et à en ressortir intact. »',
    effets: [{ tenterEveil: 'shintenshin', intensite: 25 }, { entrainer: 'shintenshin', jours: 60, mentor: true }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
    reussite: 'Pendant une seconde, tu vois la pièce d’en haut, avec les yeux de l’oiseau, et ton propre corps affalé sur la chaise. Tu reviens d’un coup, nauséeux·se. Ta mère te tend un verre d’eau. « La première fois, tout le monde vomit. Toi non. C’est bon signe. »',
  },
  akimichi: {
    maitre: 'Ton oncle, deux fois plus large que la porte, te met une boulette de riz dans chaque main. « Mange. Puis gonfle. Puis roule. Dans cet ordre. Toujours. »',
    effets: [signature('baika', 1, 'akimichi_nikudan')],
    reussite: 'Tu gonfles, tu te roules en boule, et tu dévales la colline du clan en hurlant. Tu finis dans la haie d’un voisin. Ton oncle rit tellement qu’il doit s’asseoir. « Parfait ! La haie, c’est pour la prochaine leçon : freiner. »',
  },
  aburame: {
    maitre: 'Ton père te conduit dans la grange aux ruches, où les insectes du clan vivent l’hiver. « Ils ne t’obéissent pas. Ils te font confiance. Ce n’est pas la même chose, et c’est toute la leçon. »',
    effets: [signature('kikaichu', 1, 'aburame_essaim')],
    reussite: 'Tu ouvres la main et un essaim sort de ta paume, tourne une fois autour de la grange, et revient. Pas un insecte ne manque. Ton père remonte son col sur un sourire que tu devines.',
  },
  inuzuka: {
    maitre: 'Ta mère siffle, et ton chien arrive en courant. « Le Croc sur croc, ça se fait à deux. Si tu tournes et qu’il ne tourne pas, tu te prends un arbre. Si lui tourne et pas toi, il te prend, toi. »',
    effets: [signature('ninken_lien', 1, 'inuzuka_gatsuga')],
    reussite: 'Vous tournez ensemble, ton chien et toi, deux vrilles qui labourent la cour. Tu te prends quand même un arbre. Lui aussi. Vous vous relevez en même temps, couverts de boue. Ta mère applaudit en hurlant de rire.',
  },
  senju: {
    maitre: 'Une grand-tante du clan t’emmène au pied d’un vieux mur de pierre, celui que le Premier a dressé, dit-on, en une nuit. « Avant le bois, il y a la terre. Avant de faire pousser, on apprend à tenir. »',
    effets: pouvoirEtNature('vitalite_senju', 'doton_mur'),
    reussite: 'Tu frappes le sol. Un muret de terre se dresse devant toi, de la hauteur d’un enfant, puis s’effrite à moitié. La grand-tante pose la main dessus. « Il tient. Un mur qui tient, c’est le début de tout. »',
  },
  uzumaki: {
    maitre: 'Ta mère déroule un parchemin couvert de spirales. « Les Uzumaki ont toujours eu deux choses : des sceaux, et la mer. Aujourd’hui, l’eau. Les sceaux, ce sera toute ta vie. »',
    effets: pouvoirEtNature('fuinjutsu_uzumaki', 'suiton_projectile'),
    reussite: 'L’eau du seau se soulève, se roule en boule et file contre le mur avec un claquement sec. Ta mère te regarde comme si elle voyait quelqu’un d’autre derrière toi. « Ta grand-mère faisait exactement ce geste. »',
  },
  hozuki: {
    maitre: 'Ton grand frère te pousse dans la baie, tout habillé·e. « Un Hōzuki apprend à nager en devenant la mer. Le reste vient après. »',
    effets: [signature('hydrification', 1, 'hozuki_suika'), { enseigner: 'suiton_projectile' }],
    reussite: 'Ton bras devient de l’eau, s’allonge de deux pas et claque comme un fouet sur la surface. Ton frère, trempé, éclate de rire. « Ça, c’est de la famille. »',
  },
  kaguya: {
    maitre: 'L’ancien du clan pose sa main sur ton épaule, là où l’os affleure. « Ton corps est ton arsenal. La première lame que tu tireras de toi, tu la garderas toute ta vie. Choisis-la bien. »',
    effets: [signature('shikotsumyaku', 1, 'kaguya_tsubaki')],
    reussite: 'Ça fait mal, beaucoup. Puis un os sort de ton épaule, droit, blanc, pointu comme un poignard de camélia. Tu le tiens dans ta main sans trembler. L’ancien hoche la tête. « Elle est belle. Elle est à toi. »',
  },
  yuki: {
    maitre: 'Ta mère t’emmène dans la grotte où le clan se cache depuis trois générations. Il y fait froid même en été. « Ici, personne ne nous voit. Ici, tu peux laisser venir la neige. »',
    effets: [signature('hyoton', 1, 'yuki_sensatsu'), { enseigner: 'suiton_projectile' }],
    reussite: 'L’humidité de la grotte gèle autour de toi en aiguilles fines, des dizaines, suspendues dans l’air. Elles tombent toutes en même temps, en tintant comme du verre. Ta mère pleure. De joie, ou de peur. Les deux, sûrement.',
  },
  shirakaze: {
    maitre: 'Ta grand-mère t’attend au sommet de la dune, les cheveux fouettés par le vent. « Le vent, on ne le commande pas. On lui donne une forme. Une lame, par exemple. »',
    effets: pouvoirEtNature('souffle_dunes', 'fuuton_lame'),
    reussite: 'Tu lèves la main comme elle, et le vent se resserre en une lame invisible qui tranche net la crête de la dune. Le sable retombe en pluie. Ta grand-mère ne dit rien. Elle te tend sa propre gourde. Chez les Shirakaze, c’est le plus grand des honneurs.',
  },
  raiko: {
    maitre: 'Ton père t’emmène au col sous l’orage. Il plante une tige de fer dans la roche. « La foudre ne tombe pas sur les peureux. Elle tombe sur ceux qui l’appellent. Appelle-la. »',
    effets: pouvoirEtNature('armure_foudre', 'raiton_decharge'),
    reussite: 'Une décharge part de ta main vers la tige de fer, bleue, crépitante. Tes cheveux se dressent. Ton père éclate de rire sous la pluie, un rire énorme qui couvre le tonnerre. « Voilà ! Voilà un Raikō ! »',
  },
  ishikawa: {
    maitre: 'L’ancien de la carrière te fait poser les mains à plat sur la roche. « La pierre ne bouge pas parce qu’on la pousse. Elle bouge parce qu’on devient pierre. Deviens pierre. »',
    effets: pouvoirEtNature('peau_roche', 'doton_mur'),
    reussite: 'La roche se soulève sous tes paumes, lentement, en un mur bas et solide. Tes mains sont grises jusqu’aux poignets, et tu ne sens plus le froid. L’ancien frappe le mur du poing. Il tient. Lui aussi, il en a l’air surpris.',
  },
};

/** Les sans-clan : c'est l'aîné·e qui enseigne la technique de ta propre nature. */
const TECHNIQUE_PAR_NATURE: Record<string, string> = { katon: 'katon_boule', suiton: 'suiton_projectile', fuuton: 'fuuton_lame', raiton: 'raiton_decharge', doton: 'doton_mur' };

const effetsLecon: Effect[] = [
  ...Object.entries(LECON_PAR_CLAN).map(([clan, l]): Effect => ({ si: { clan }, alors: l.effets })),
  ...Object.entries(TECHNIQUE_PAR_NATURE).map(([el, tech]): Effect => ({ si: { tout: [{ clan: 'sans_clan' }, { element: el as never }] }, alors: [{ enseigner: tech }, { entrainer: `nature_${el}`, jours: 30, mentor: true }] })),
  { drapeau: 'lecon_clan' },
  { stat: 'social.confianceClan', delta: 4 },
];
const texteLecon: Texte = [
  ...Object.entries(LECON_PAR_CLAN).map(([clan, l]) => ({ si: { clan }, texte: l.maitre })),
  { si: { clan: 'sans_clan' }, texte: '{@aine} t’emmène au terrain vague derrière la maison, là où personne ne vient. « On n’a pas de clan pour nous apprendre. Alors c’est moi qui t’apprends. Ce que je sais, je l’ai volé en regardant les autres. Regarde bien, toi aussi. »' },
];
const reussiteLecon: Texte = [
  ...Object.entries(LECON_PAR_CLAN).map(([clan, l]) => ({ si: { clan }, texte: l.reussite })),
  { si: { clan: 'sans_clan' }, texte: 'Il te faut tout l’après-midi. Puis la technique sort, maladroite, imparfaite, mais à toi. {@aine} te frappe dans le dos si fort que tu tousses. « Personne ne nous l’a donnée. On l’a prise. Ça vaut deux fois plus. »' },
];

export const APPRENTISSAGE: EventDef[] = [
  {
    ...enfance,
    id: 'ap_lecon_clan',
    titre: 'La leçon du clan',
    categorie: 'clan_rare',
    lieu: '$village',
    priorite: 40,
    si: { tout: [ACTIF, { age: { min: 9, max: 11 } }, { un: [{ non: { clan: 'sans_clan' } }, AINE] }] },
    texte: texteLecon,
    choix: [
      {
        id: 'apprendre',
        texte: 'Écouter, imiter, recommencer jusqu’au soir',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { controleChakra: 2, controleEmotionnel: 1 },
          succes: { texte: reussiteLecon, effets: [...effetsLecon, { stat: 'attributs.controleChakra', delta: 2 }] },
          echec: {
            texte: 'Ça ne vient pas. Ni ce jour-là, ni le suivant. Tu rentres les mains brûlées, la gorge sèche, avec l’impression d’avoir déçu tout un clan. On te dit de revenir dans quelques mois. Tu reviendras.',
            effets: [{ stat: 'attributs.controleChakra', delta: -1 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { retour: 'ap_lecon_clan_reprise', chance: 1, entre: [90, 200] }],
          },
        },
      },
      {
        id: 'aine',
        texte: 'Demander à {@aine} de t’aider, en cachette, la nuit',
        si: AINE,
        verrou: 'Il n’y a personne pour t’aider en cachette.',
        effets: [...effetsLecon, { relation: '@aine', delta: { attachement: 6, confiance: 4 } }, { stat: 'jauges.fatigue', delta: 20 }],
        resultat: [
          { texte: 'Pendant une semaine, chaque nuit, {@aine} te réveille et vous filez sur le terrain. Ce que le maître t’a montré une fois, {@aine} te le décompose en cent gestes. Le septième jour, tu le refais devant tout le monde, du premier coup.' },
          ...reussiteLecon,
        ],
      },
      {
        id: 'impatient',
        texte: 'Sauter les étapes et tenter directement la technique entière',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 2, force: 1 },
          succes: { texte: reussiteLecon, effets: [...effetsLecon, { stat: 'attributs.force', delta: 1 }, { ethique: { ambition: 3 } }] },
          echec: {
            texte: 'Le chakra part dans tous les sens. Tu te brûles, tu te coupes, tu tombes. Ton maître te relève par le col. « Les étapes ne sont pas là pour faire joli. » Tu repars avec un bandage et une leçon que tu n’avais pas demandée.',
            effets: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.controleChakra', delta: -1 }, { retour: 'ap_lecon_clan_reprise', chance: 1, entre: [90, 200] }],
          },
        },
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_lecon_clan_reprise',
    titre: 'La deuxième fois',
    categorie: 'clan_rare',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: 'Quelques mois ont passé. Tu as répété les gestes seul·e, le soir, des centaines de fois. On te convoque de nouveau pour la même leçon. Cette fois, tes mains ne tremblent pas en formant les signes.',
    choix: [
      {
        id: 'reessayer',
        texte: 'Recommencer, calmement',
        effets: [...effetsLecon, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: [{ texte: 'Tu ne forces rien. Tu laisses le geste venir comme il est venu cent fois dans ta chambre.' }, ...reussiteLecon],
      },
    ],
  },

  // ── L'aîné·e qui t'entraîne ──────────────────────────────────────
  {
    ...enfance,
    id: 'ap_aine_premier',
    titre: 'Le terrain de {@aine}',
    categorie: 'entrainement',
    lieu: '$terrain',
    priorite: 35,
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE, { age: { min: 6, max: 10 } }] },
    texte: '{@aine} te réveille avant l’aube et te tend un bâton plus grand que toi. « Tu veux devenir ninja ? Alors on commence aujourd’hui. Pas à l’Académie : ici. L’Académie t’apprendra les règles. Moi, je vais t’apprendre à ne pas te faire tuer. »',
    choix: [
      {
        id: 'combat',
        texte: '« Apprends-moi à me battre. »',
        test: {
          type: 'combat',
          difficulte: 34,
          attributs: { agilite: 1, force: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1 },
          succes: { texte: '{@aine} te met à terre dix fois. La onzième, tu esquives. La douzième, ton bâton touche son genou. {Aine_il} s’arrête, surpris{aine_e}, et sourit. « Tu as compris le principe. Maintenant on recommence, plus vite. »', effets: [{ entrainer: 'taijutsu', jours: 25, mentor: true }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'attributs.force', delta: 1 }, { relation: '@aine', delta: { respect: 6, attachement: 4 } }, { retour: 'ap_aine_deuxieme', chance: 1, entre: [180, 360] }] },
          echec: { texte: 'Tu tombes. Encore. Encore. Au vingtième coup, tu pleures de rage. {@aine} s’assoit à côté de toi, sans te consoler. « Pleure si tu veux. Mais demain, on revient. » Tu reviens.', effets: [{ entrainer: 'taijutsu', jours: 15, mentor: true }, { stat: 'jauges.sante', delta: -5 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { retour: 'ap_aine_deuxieme', chance: 1, entre: [180, 360] }] },
        },
      },
      {
        id: 'lancer',
        texte: '« Apprends-moi à lancer, comme toi. »',
        test: {
          type: 'competence',
          difficulte: 34,
          attributs: { perception: 2, agilite: 1 },
          succes: { texte: '{@aine} plante une cible dans un tronc et te montre le geste du poignet, une fois. Ton troisième kunai se plante dans le bois. Pas au centre. Dans le bois. {Aine_il} siffle entre ses dents. « Pas mal pour un·e minus. »', effets: [{ entrainer: 'famille_kunai', jours: 25, mentor: true }, { stat: 'attributs.perception', delta: 2 }, { relation: '@aine', delta: { attachement: 5 } }, { retour: 'ap_aine_deuxieme', chance: 1, entre: [180, 360] }] },
          echec: { texte: 'Tes kunai rebondissent sur le tronc, partent dans les fourrés, et l’un d’eux frôle le pied de {@aine}. Silence. Puis {aine_il} éclate de rire. « Bon. On va commencer par ne tuer personne. »', effets: [{ entrainer: 'famille_kunai', jours: 15, mentor: true }, { stat: 'attributs.perception', delta: 1 }, { retour: 'ap_aine_deuxieme', chance: 1, entre: [180, 360] }] },
        },
      },
      {
        id: 'chakra',
        texte: '« Apprends-moi à sentir le chakra. »',
        effets: [{ entrainer: 'ninjutsu', jours: 25, mentor: true }, { stat: 'attributs.controleChakra', delta: 2 }, { relation: '@aine', delta: { confiance: 5 } }, { retour: 'ap_aine_deuxieme', chance: 1, entre: [180, 360] }],
        resultat: '{@aine} pose une feuille sur ton front et te demande de la faire tenir sans les mains. Elle tombe. Cent fois. La cent unième, elle tient une seconde. Tu sens quelque chose de chaud entre tes yeux, comme une main posée de l’intérieur. « C’est ça, ton chakra. Ne l’oublie plus jamais. »',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_aine_deuxieme',
    titre: '{@aine} ne retient plus ses coups',
    categorie: 'entrainement',
    lieu: '$terrain',
    enchaine: true,
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE] },
    texte: 'Un an d’entraînement à l’aube. Ce matin, {@aine} enlève sa veste et la jette dans l’herbe. « Jusqu’ici, je retenais mes coups. Aujourd’hui, je vais me battre comme si tu étais un ennemi. Si tu tiens trois minutes, je t’apprends quelque chose que l’Académie ne t’apprendra jamais. »',
    choix: [
      {
        id: 'tenir',
        texte: 'Tenir trois minutes',
        test: {
          type: 'combat',
          difficulte: 42,
          attributs: { agilite: 2, controleEmotionnel: 1, force: 1 },
          maitrises: { taijutsu: 2, famille_kunai: 1 },
          manches: 2,
          succes: { texte: 'Trois minutes. Tu ne gagnes pas. Tu tiens. Ton nez saigne, ta lèvre aussi, mais tu es debout quand {@aine} recule. {Aine_il} reprend son souffle, et te montre alors un geste : une permutation qui ne laisse pas une bûche, mais une ombre de toi qui reste une seconde de plus. « Personne ne sait que je sais faire ça. Maintenant, toi aussi. »', effets: [{ entrainer: 'taijutsu', jours: 30, mentor: true }, { apprendre: 'kawarimi', source: 'mentor' }, { entrainer: 'kawarimi', jours: 30, mentor: true }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { relation: '@aine', delta: { respect: 8, attachement: 5 } }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }] },
          echec: { texte: 'Une minute. Puis tu es au sol, le souffle coupé, avec le genou de {@aine} sur ta poitrine. « Un ennemi ne s’arrêterait pas là. » {Aine_il} se relève et te tend la main. « Dans six mois, on recommence. »', effets: [{ entrainer: 'taijutsu', jours: 20, mentor: true }, { stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.force', delta: -1 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }] },
        },
      },
      {
        id: 'ruse',
        texte: 'Ne pas tenir : gagner. Avec un piège préparé la veille',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { intellect: 2, discretion: 1 },
          succes: { texte: 'Tu recules, recules, et {@aine} te suit droit dans la fosse que tu as creusée la nuit dernière. {Aine_il} y tombe jusqu’à la taille. Long silence. Puis un fou rire. « D’accord. D’accord ! Ça compte. » Ce jour-là, {aine_il} t’apprend à piéger un terrain en dix minutes.', effets: [{ stat: 'attributs.intellect', delta: 3 }, { stat: 'attributs.discretion', delta: 1 }, { relation: '@aine', delta: { respect: 10 } }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }] },
          echec: { texte: '{@aine} voit la fosse. Évidemment. {Aine_il} l’enjambe sans même la regarder, et t’y pousse, toi. « La prochaine fois, couvre-la mieux. »', effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'jauges.sante', delta: -5 }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }] },
        },
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_aine_depart',
    titre: 'La mission de {@aine}',
    categorie: 'deuil',
    lieu: '$porte',
    enchaine: true,
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE] },
    texte: '{@aine} part pour sa première mission longue : trois mois à la frontière, une escorte que personne ne veut. À la porte du village, {aine_il} te donne son vieux kunai d’entraînement, celui avec l’encoche sur le manche. « Tu continues sans moi. Tous les matins. Quand je reviens, je veux voir la différence. »',
    choix: [
      {
        id: 'promettre',
        texte: 'Promettre, et tenir parole',
        effets: [
          { promesse: 'entrainement_aine', pnj: '@aine', texte: 'S’entraîner tous les matins pendant l’absence de {@aine}.' },
          { entrainer: 'taijutsu', jours: 40 },
          { stat: 'attributs.force', delta: 1 },
          { stat: 'attributs.controleEmotionnel', delta: 2 },
          { hasard: [{ poids: 70, effets: [{ drapeau: 'aine_retour', valeur: 'fier' }] }, { poids: 30, effets: [{ drapeau: 'aine_retour', valeur: 'blesse' }] }] },
          { retour: 'ap_aine_retour', chance: 1, entre: [80, 110] },
        ],
        resultat: 'Trois mois d’aube froide, seul·e sur le terrain, avec le kunai à l’encoche dans la ceinture. Certains matins tu as envie d’abandonner. Tu ne le fais pas. Tu as promis.',
      },
      {
        id: 'suivre',
        texte: 'Le suivre en cachette jusqu’au premier relais',
        effets: [{ stat: 'attributs.discretion', delta: 2 }, { relation: '@aine', delta: { attachement: 4, confiance: -3 } }, { hasard: [{ poids: 70, effets: [{ drapeau: 'aine_retour', valeur: 'fier' }] }, { poids: 30, effets: [{ drapeau: 'aine_retour', valeur: 'blesse' }] }] }, { retour: 'ap_aine_retour', chance: 1, entre: [80, 110] }],
        resultat: 'Tu tiens une demi-journée avant que {@aine} se retourne, l’air furieux, et te ramène au village par l’oreille. Mais en te lâchant devant la maison, {aine_il} te serre très fort, une seconde. Puis repart sans un mot.',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_aine_retour',
    titre: 'Le retour de {@aine}',
    categorie: 'amitie',
    lieu: '$porte',
    enchaine: true,
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE] },
    texte: [
      { si: { drapeau: 'aine_retour', egal: 'fier' }, texte: '{@aine} rentre au crépuscule, amaigri{aine_e}, bronzé{aine_e}, une cicatrice nouvelle au menton. {Aine_il} te voit à la porte et, sans même poser son sac, te lance : « Montre-moi. »' },
      { si: { drapeau: 'aine_retour', egal: 'blesse' }, texte: '{@aine} rentre sur un brancard. Une lance dans la cuisse, une fièvre qui ne tombe pas. Les médecins disent que ça ira. {Aine_il} te cherche des yeux dans la foule, et, la voix faible, te dit quand même : « Montre-moi. »' },
    ],
    choix: [
      {
        id: 'montrer',
        texte: 'Lui montrer ce que tu as appris seul·e',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { agilite: 2, controleChakra: 1, perception: 1 },
          succes: { texte: 'Tu enchaînes tout ce que {@aine} t’a appris, et ce que tu as ajouté seul·e. {@aine} ne dit rien pendant un long moment. Puis, très bas : « Tu vas me dépasser. » Ce n’est pas une plainte. C’est la plus belle chose qu’{aine_il} t’ait jamais dite.', effets: [{ promesseTenue: 'entrainement_aine' }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'attributs.perception', delta: 1 }, { relation: '@aine', delta: { respect: 10, attachement: 8 } }] },
          echec: { texte: 'Tu rates le dernier mouvement, devant tout le monde. {@aine} rit, puis te prend par l’épaule. « Tu as travaillé. Ça se voit. Le reste viendra. »', effets: [{ promesseTenue: 'entrainement_aine' }, { stat: 'attributs.agilite', delta: 1 }, { relation: '@aine', delta: { attachement: 6 } }] },
        },
      },
      {
        id: 'soigner',
        texte: 'Ne rien montrer : t’asseoir à son chevet',
        si: { drapeau: 'aine_retour', egal: 'blesse' },
        verrou: '{@aine} va bien : il n’y a pas de chevet où s’asseoir.',
        effets: [{ relation: '@aine', delta: { attachement: 12 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { compassion: 3 } }],
        resultat: 'Tu passes deux semaines à son chevet. Tu lui lis ses rouleaux préférés, tu changes ses bandages, tu racontes l’Académie. Le jour où {aine_il} se relève, la première chose qu’{aine_il} fait est de t’emmener au terrain, en boitant. « Bon. Montre-moi, maintenant. »',
      },
    ],
  },

  // ── Les séances qui reviennent (le hasard décide quand) ──────────
  {
    ...enfance,
    id: 'ap_aine_seance_course',
    titre: 'La course des toits',
    categorie: 'entrainement',
    lieu: '$village',
    poids: 6,
    repetable: { delaiJours: 200, max: 3 },
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE, { age: { min: 7, max: 12 } }] },
    texte: '« Jusqu’au château d’eau et retour, par les toits. Le dernier fait la vaisselle pendant un mois. » {@aine} est déjà sur le premier toit avant la fin de sa phrase.',
    choix: [
      {
        id: 'courir',
        texte: 'Courir',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { agilite: 3 },
          succes: { texte: 'Tu prends le raccourci par la cheminée de la boulangerie, et tu arrives au château d’eau une seconde avant {lui:@aine}. Une seconde. Ça suffit pour toute une vie de fierté.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { relation: '@aine', delta: { respect: 3 } }] },
          echec: { texte: 'Une tuile glisse sous ton pied. Tu atterris dans un tas de linge. {@aine} t’attend au château d’eau, assis{aine_e}, en mangeant une pomme. Un mois de vaisselle.', effets: [{ stat: 'attributs.agilite', delta: 1 }, { stat: 'jauges.sante', delta: -4 }, { stat: 'jauges.fatigue', delta: 10 }] },
        },
      },
      {
        id: 'tricher',
        texte: 'Passer par la rue, plus courte, pendant qu’il est sur les toits',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.discretion', delta: 1 }, { relation: '@aine', delta: { respect: 2 } }],
        resultat: 'Tu arrives premier·ère, essoufflé·e et fier·ère. {@aine} débarque, voit tes sandales poussiéreuses, comprend. « Tricheur·se. » Pause. « Bien joué. Mais un ennemi, lui, sera sur les toits. »',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_aine_seance_cascade',
    titre: 'Sous la cascade',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 6,
    repetable: { delaiJours: 220, max: 3 },
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE, { age: { min: 8, max: 12 } }] },
    texte: '{@aine} t’emmène à la cascade derrière le terrain d’entraînement. « Assis·e dessous. Les yeux fermés. Si tu te lèves avant que je le dise, on rentre et on ne revient plus. »',
    choix: [
      {
        id: 'tenir',
        texte: 'Tenir sous l’eau glacée',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { controleEmotionnel: 2, force: 1 },
          succes: { texte: 'L’eau te martèle les épaules. Le froid monte, puis disparaît. Il ne reste que ton souffle, et quelque chose qui circule dans ton corps comme un deuxième sang. Quand {@aine} te dit de sortir, le soleil a bougé. Tu ne t’en es pas aperçu·e.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.controleChakra', delta: 1 }, { stat: 'jauges.chakraMax', delta: 2 }] },
          echec: { texte: 'Tu tiens dix minutes, puis tu sors en claquant des dents. {@aine} ne dit rien, et vous rentrez. Le lendemain, {aine_il} te réveille quand même, et vous retournez à la cascade.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'jauges.sante', delta: -5 }, { stat: 'attributs.force', delta: -1 }] },
        },
      },
      {
        id: 'parler',
        texte: 'Lui demander pourquoi {aine_il} fait tout ça pour toi',
        effets: [{ relation: '@aine', delta: { attachement: 6, confiance: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: '{@aine} hésite longtemps, assis{aine_e} sur la pierre, les pieds dans l’eau. « Parce que personne ne l’a fait pour moi. Et que je ne veux pas que tu meures à ta première mission. » Puis {aine_il} te pousse sous la cascade, pour ne pas avoir à en dire plus.',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_aine_seance_nuit',
    titre: 'L’exercice de nuit',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 5,
    repetable: { delaiJours: 240, max: 2 },
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE, { age: { min: 9, max: 12 } }] },
    texte: 'Minuit. {@aine} t’attend au bord de la forêt, un bandeau dans la main. « Les yeux bandés. Je vais te lancer des pommes de pin. Tu les évites. Sans voir. Si tu en prends dix, on rentre. »',
    choix: [
      {
        id: 'esquiver',
        texte: 'Écouter, sentir, esquiver',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { perception: 2, agilite: 2 },
          succes: { texte: 'Les cinq premières te touchent. Puis tu commences à entendre le froissement de sa manche, le sifflement dans l’air. Tu en évites une, deux, dix. À la fin, {@aine} lance des pierres, et tu les évites aussi. Tu enlèves le bandeau : {@aine} te regarde comme on regarde quelqu’un qu’on ne connaissait pas encore, et qu’on est heureux de rencontrer.', effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.agilite', delta: 1 }, { entrainer: 'taijutsu', jours: 15, mentor: true }] },
          echec: { texte: 'Dix pommes de pin en deux minutes. Une sur le nez. Vous rentrez, toi le nez rouge, {@aine} qui rit tout le long du chemin.', effets: [{ stat: 'attributs.perception', delta: 1 }, { stat: 'jauges.sante', delta: -3 }] },
        },
      },
      {
        id: 'chakra',
        texte: 'Tenter de sentir son chakra plutôt que les pommes',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 2, perception: 2 },
          succes: { texte: 'Tu cherches la chaleur que tu connais si bien, celle de {@aine}. Tu la trouves, à dix pas, qui bouge. Tu sais où sa main va partir avant qu’elle parte. Aucune pomme ne te touche. {@aine} enlève ton bandeau, lentement. « Ça, on ne l’apprend qu’à vingt ans, normalement. »', effets: [{ stat: 'attributs.controleChakra', delta: 2 }, { stat: 'attributs.perception', delta: 2 }, { entrainer: 'ninjutsu', jours: 20, mentor: true }] },
          echec: { texte: 'Tu cherches le chakra et tu ne trouves rien, sauf des pommes de pin. Beaucoup. Mais tu as senti quelque chose, une fois, juste avant la quatrième. Tu n’en parles à personne. Tu recommenceras.', effets: [{ stat: 'attributs.controleChakra', delta: 1 }, { stat: 'jauges.sante', delta: -3 }] },
        },
      },
    ],
  },

  // ── Les autres : ceux qui demandent, proposent, défient ──────────
  {
    ...enfance,
    id: 'ap_ami_entrainement',
    titre: '{@coequipierA} a besoin de toi',
    categorie: 'amitie',
    lieu: '$terrain',
    poids: 6,
    repetable: { delaiJours: 250, max: 3 },
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, AMI, { age: { min: 7, max: 13 } }] },
    texte: '{@coequipierA} t’attend à la sortie de l’Académie, les yeux rouges. « Je rate tout au lancer. Tout. Demain, il y a l’évaluation, et si je rate encore, ma mère va me tuer. Tu veux bien m’aider ce soir ? »',
    choix: [
      {
        id: 'aider',
        texte: 'Passer la soirée à l’entraîner',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { charisme: 2, perception: 1 },
          succes: { texte: 'Tu remarques que {@coequipierA} ferme les yeux au moment de lancer. Tu le lui dis. {Il:@coequipierA} rouvre les yeux, lance, et touche. Le lendemain, à l’évaluation, {il:@coequipierA} te cherche du regard avant chaque kunai. Tous dans la cible.', effets: [{ relation: '@coequipierA', delta: { amitie: 8, confiance: 5 } }, { stat: 'attributs.charisme', delta: 2 }, { entrainer: 'famille_kunai', jours: 10 }] },
          echec: { texte: 'Vous lancez jusqu’à la nuit. Ça ne vient pas. {@coequipierA} rate son évaluation, de peu. Mais en rentrant, {il:@coequipierA} te dit : « Personne d’autre n’aurait passé sa soirée avec un nul comme moi. »', effets: [{ relation: '@coequipierA', delta: { amitie: 6 } }, { stat: 'attributs.perception', delta: 1 }] },
        },
      },
      {
        id: 'secret',
        texte: 'Lui apprendre le geste que {@aine} t’a montré',
        si: { tout: [AINE, { vu: 'ap_aine_premier' }] },
        verrou: 'Tu n’as pas encore de geste secret à transmettre.',
        effets: [{ relation: '@coequipierA', delta: { amitie: 10, attachement: 4 } }, { relation: '@aine', delta: { confiance: -2 } }, { stat: 'attributs.charisme', delta: 1 }, { entrainer: 'famille_kunai', jours: 10 }],
        resultat: 'Le petit coup de poignet de {@aine}, celui qui fait tourner le kunai juste avant l’impact. {@coequipierA} l’apprend en une heure. À l’évaluation, l’instructeur demande qui lui a appris ça. {@coequipierA} ment pour te protéger. Ce soir-là, tu comprends que vous êtes ami·es pour de bon.',
      },
      {
        id: 'refuser',
        texte: '« Désolé·e, j’ai mon propre entraînement. »',
        effets: [{ relation: '@coequipierA', delta: { amitie: -5, confiance: -3 } }, { entrainer: 'taijutsu', jours: 15 }, { stat: 'attributs.force', delta: 1 }],
        resultat: 'Tu t’entraînes seul·e toute la soirée, et tu progresses. Le lendemain, {@coequipierA} rate son évaluation et ne te regarde pas de la journée. Ça, ce n’était pas dans ton programme.',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_rival_defi',
    titre: '{@rival} te provoque',
    categorie: 'rivalite',
    lieu: '$terrain',
    poids: 6,
    repetable: { delaiJours: 220, max: 4 },
    personnages: ['@rival'],
    si: { tout: [ACTIF, RIVAL, { age: { min: 8, max: 15 } }] },
    texte: [
      { texte: '{@rival} t’attend sur le terrain, les bras croisés, avec une petite foule d’élèves autour. « Tout le monde dit que tu as progressé. Prouve-le. Un combat. Pas de techniques. Juste toi et moi. »' },
      { si: { relation: '@rival', axe: 'respect', min: 20 }, texte: 'Il y a dans sa voix moins de mépris qu’avant. Quelque chose comme de l’impatience.' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Accepter',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 2 },
          manches: 2,
          succes: { texte: 'Le combat est rapide et dur. {@rival} frappe fort, mais tu as appris à lire ses épaules. Quand {il:@rival} touche terre, la foule se tait. {Il:@rival} se relève, essuie sa lèvre, et dit seulement : « La prochaine fois. »', effets: [{ stat: 'attributs.force', delta: 1 }, { stat: 'attributs.agilite', delta: 1 }, { entrainer: 'taijutsu', jours: 15 }, { relation: '@rival', delta: { rivalite: 6, respect: 5 } }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: '{@rival} te met au sol devant tout le monde. {Il:@rival} ne triomphe pas. {Il:@rival} se penche et te dit, juste pour toi : « Tu baisses la garde quand tu as peur. Corrige ça, sinon ce n’est même pas drôle. »', effets: [{ stat: 'jauges.sante', delta: -8 }, { stat: 'attributs.controleEmotionnel', delta: -1 }, { stat: 'attributs.perception', delta: 1 }, { relation: '@rival', delta: { rivalite: 5 } }] },
        },
      },
      {
        id: 'refuser',
        texte: '« Je n’ai rien à te prouver. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.reputation', delta: -2 }, { relation: '@rival', delta: { rivalite: 3, hostilite: 2 } }],
        resultat: 'Tu tournes les talons. Derrière toi, des sifflets. {@rival} ne siffle pas. {Il:@rival} te regarde partir, et tu sens son regard dans ton dos jusqu’au coin de la rue. Ce n’est pas fini. Ce n’est jamais fini, avec {lui:@rival}.',
      },
      {
        id: 'proposer',
        texte: '« Pas un combat. Une course jusqu’à la tour du Kage. »',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { agilite: 3 },
          succes: { texte: 'Vous partez comme deux flèches à travers le village, renversant un étal de pommes au passage. Tu touches la porte de la tour une demi-seconde avant {lui:@rival}. Vous vous effondrez tous les deux sur les marches, hors d’haleine, et pour la première fois, vous riez ensemble.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { relation: '@rival', delta: { amitie: 5, rivalite: 3 } }] },
          echec: { texte: '{@rival} gagne de trois longueurs et t’attend sur les marches. « Une course, c’est encore un combat. Tu l’as perdu deux fois. »', effets: [{ stat: 'attributs.agilite', delta: 1 }, { relation: '@rival', delta: { rivalite: 4 } }] },
        },
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_b_diner',
    titre: 'Le dîner chez {@coequipierB}',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    personnages: ['@coequipierB'],
    si: { tout: [ACTIF, B, { age: { min: 8, max: 13 } }] },
    texte: [
      { texte: '{@coequipierB} t’invite à dîner chez {lui:@coequipierB}, pour la première fois. La maison est plus petite que tu ne l’imaginais, et plus bruyante : trois petits frères, une grand-mère sourde, un père qui rentre de mission avec une jambe raide.' },
      { si: { non: { clanPnj: '@coequipierB', clan: 'sans_clan' } }, texte: 'Au mur, l’emblème du clan {clan:@coequipierB}, un peu passé. Le père le regarde souvent, pendant le repas.' },
    ],
    choix: [
      {
        id: 'pere',
        texte: 'Demander au père de raconter sa mission',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { relation: '@coequipierB', delta: { amitie: 6 } }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: 'Il raconte. Pas les combats : les nuits froides, la soupe partagée, le camarade qui chantait faux. {@coequipierB} n’avait jamais entendu son père parler autant. En te raccompagnant, {il:@coequipierB} te dit : « Reviens quand tu veux. Vraiment. »',
      },
      {
        id: 'freres',
        texte: 'Jouer avec les petits frères',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { compassion: 3 } }, { relation: '@coequipierB', delta: { amitie: 8, attachement: 4 } }],
        resultat: 'Tu passes la soirée à faire le cheval, le ninja ennemi et le monstre des marais. Les trois petits s’endorment sur toi. {@coequipierB} te regarde depuis la cuisine avec une drôle d’expression. Le lendemain, à l’Académie, {il:@coequipierB} s’assoit à côté de toi sans rien demander.',
      },
    ],
  },
  {
    ...enfance,
    id: 'ap_sensei_lecon',
    titre: 'La leçon particulière de {@sensei}',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 5,
    repetable: { delaiJours: 300, max: 3 },
    personnages: ['@sensei'],
    si: { tout: [ACTIF, SENSEI, { rangMin: 'genin' }, { age: { min: 11, max: 16 } }] },
    texte: '{@sensei} te retient après l’entraînement d’équipe. « Tu as un défaut que les autres n’ont pas, et une qualité que les autres n’ont pas non plus. Ce soir, on travaille l’un des deux. Choisis. »',
    choix: [
      {
        id: 'defaut',
        texte: 'Le défaut',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { controleEmotionnel: 2, intellect: 1 },
          succes: { texte: '{@sensei} te montre ce que tu fais sans le savoir : un pas en arrière avant chaque attaque, un réflexe qui trahit tout. Trois heures à le corriger. Quand tu rentres, ton corps ne recule plus. C’est la leçon la plus utile de l’année.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.agilite', delta: 1 }, { entrainer: 'taijutsu', jours: 20, mentor: true }, { relation: '@sensei', delta: { confiance: 5 } }] },
          echec: { texte: 'Tu n’arrives pas à le voir, ce défaut. {@sensei} soupire. « On recommencera. Les défauts qu’on ne voit pas sont ceux qui tuent. » Tu rentres frustré·e.', effets: [{ stat: 'attributs.controleEmotionnel', delta: -1 }, { stat: 'attributs.intellect', delta: 1 }] },
        },
      },
      {
        id: 'qualite',
        texte: 'La qualité',
        effets: [{ entrainer: 'ninjutsu', jours: 25, mentor: true }, { stat: 'attributs.controleChakra', delta: 2 }, { relation: '@sensei', delta: { respect: 4 } }],
        resultat: '{@sensei} te pousse là où tu es déjà bon·ne, jusqu’à ce que ce soit trop facile, puis plus loin encore. « Une qualité qu’on n’entretient pas devient une habitude. Une habitude, l’ennemi la lit. » Tu repars épuisé·e, plus fort·e.',
      },
    ],
  },
];
