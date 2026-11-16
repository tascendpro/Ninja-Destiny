import type { Condition, EventDef } from '../../engine/types';

/**
 * L'oncle Akihiko : une intrigue qui court de 8 à 17 ans.
 *
 * Le frère cadet de ton parent a refusé un ordre à la frontière, pendant la Deuxième Grande Guerre. Le village a rayé son
 * nom de la stèle des morts ; ton parent a gardé une seule lettre, et s'est tu. Ce que tu en apprends dépend de ce que tu
 * fais : demander, te taire, relire en cachette, chercher pendant ton temps libre, explorer, en parler à ton aîné.
 *
 *   fam_lettre ──── drapeau « lettre » (insiste | rendue | famille | rendue_force | relue), « lettre_piste »
 *     ├─ temps libre « Chercher la trace » (deux mois) ─→ fam_nom_raye
 *     ├─ fam_rien_raconte (avec l'aîné, ou à deux dans la campagne : mc_rien_raconte)
 *     ├─ exploration ─→ tl_cabane_racines (la cabane des deux frères, reconnue si l'on sait)
 *     └─ des années plus tard ─→ fam_akihiko_marche (l'homme à la grue)
 *
 * Personne ne sait ce qu'il n'a pas vécu : l'aîné ne connaît la lettre que si tu la lui montres ; dans la campagne,
 * l'autre joueur ne l'apprend que par la scène commune.
 */

const base = { chapitre: 1, arc: 'formation' as const };
const ACTIF: Condition = { statut: 'actif' };
const PARENT_LA: Condition = { pnj: '@parent', etat: ['vivant', 'blesse'] };
const SAIT_LE_NOM: Condition = { un: [{ drapeau: 'lettre', egal: 'insiste' }, { drapeau: 'lettre', egal: 'famille' }, { drapeau: 'lettre', egal: 'relue' }, { drapeau: 'lettre_su' }] };

export const SECRETS_FAMILLE: EventDef[] = [
  {
    ...base,
    id: 'fam_lettre',
    titre: 'La lettre oubliée',
    categorie: 'secret_familial',
    lieu: '$maison',
    priorite: 62,
    // Une seule lettre cachée par enfance : celle du coffre du grenier raconte une autre histoire.
    si: { tout: [ACTIF, { age: { min: 8, max: 10 } }, PARENT_LA, { orphelin: false }, { nonVu: 'a_secret_familial' }] },
    personnages: ['@parent'],
    texte:
      'Tu cherchais une écharpe d’hiver dans le tiroir du bas. Sous les vêtements pliés, il y a une enveloppe jaunie, jamais cachetée. Le papier est doux d’avoir été trop lu. Une seule phrase, d’une écriture penchée : « Ne les laisse pas raconter que je suis parti par lâcheté. Un jour, je pourrai t’expliquer. A. »\n\nLe plancher craque derrière toi.\n\n« Tu cherches quelque chose ? » demande {parent}.\n\n« Non… enfin, si. C’est quoi, cette lettre ? »\n\n« Où as-tu trouvé ça ? »\n\n« Dans le tiroir. Elle était cachée sous les vêtements. »\n\n« Tu n’aurais pas dû fouiller là-dedans. »\n\n« Alors pourquoi tu la caches ? »\n\n{Parent} détourne le regard, vers la fenêtre, vers rien.\n\n« Parce que certaines histoires sont plus difficiles à raconter qu’à oublier. »',
    choix: [
      {
        id: 'insister',
        texte: 'Insister pour connaître la vérité',
        effets: [
          { drapeau: 'lettre', valeur: 'insiste' },
          { drapeau: 'lettre_piste' },
          { relation: '@parent', delta: { confiance: -2, respect: 2 } },
          { journal: 'Une lettre cachée dans le tiroir, signée « A. ». Un oncle dont on ne parle jamais.', importance: 2 },
          { retour: 'fam_akihiko_marche', chance: 0.85, entre: [1500, 2100] },
        ],
        resultat:
          '« Qui c’est, A. ? » Tu ne lâches pas. Tu tiens la lettre contre toi comme si on allait te l’arracher.\n\n{Parent} s’assoit au bord du lit. Longtemps. « Mon petit frère. Akihiko. » Un silence. « Il est mort pendant la guerre. »\n\nCe n’est pas tout à fait un mensonge, tu le sens. Ce n’est pas la vérité non plus. {Parent_il} te prend la lettre des mains, très doucement, et la range dans sa propre manche.\n\nCe soir-là, la lampe de la cuisine reste allumée très tard.',
      },
      {
        id: 'rendre',
        texte: 'Rendre la lettre sans poser de questions',
        effets: [
          { drapeau: 'lettre', valeur: 'rendue' },
          { relation: '@parent', delta: { confiance: 6, attachement: 4 } },
          { stat: 'attributs.controleEmotionnel', delta: 1 },
          { retour: 'fam_akihiko_marche', chance: 0.6, entre: [1700, 2200] },
        ],
        resultat:
          'Tu tends l’enveloppe. {Parent} la prend, et quelque chose se dénoue sur son visage.\n\n« Merci. »\n\nC’est tout. Mais le lendemain, il y a ton plat préféré au dîner, sans raison, et {parent} te regarde manger comme on regarde quelqu’un qu’on a peur de perdre. Tu ne sauras pas qui est A. Pas maintenant.',
      },
      {
        id: 'famille',
        texte: 'Demander si ça concerne quelqu’un de la famille',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { perception: 1, charisme: 2 },
          succes: {
            texte:
              '« C’est quelqu’un de chez nous, hein ? Quelqu’un qu’on n’a pas le droit de nommer. »\n\n{Parent} te regarde comme si tu venais de grandir d’un coup. « Ton oncle. Akihiko. Il avait ton âge quand il a appris à grimper aux toits, et il était aussi têtu que toi. » Un sourire, qui ne tient pas. « Le village a décidé qu’il n’existait plus. Moi, je n’ai jamais réussi. »\n\n{Parent_il} garde la lettre. Mais {parent_il} t’a donné un nom, et un nom, ça se cherche.',
            effets: [
              { drapeau: 'lettre', valeur: 'famille' },
              { drapeau: 'lettre_piste' },
              { relation: '@parent', delta: { confiance: 5, attachement: 3 } },
              { stat: 'attributs.perception', delta: 1 },
              { journal: 'Un oncle, Akihiko, que le village a décidé d’oublier. {Parent} ne l’a jamais oublié.', importance: 2 },
              { retour: 'fam_akihiko_marche', chance: 0.85, entre: [1500, 2100] },
            ],
          },
          echec: {
            texte: '« Ça ne te regarde pas. » La voix de {parent} claque, plus fort que {parent} ne l’aurait voulu, et tous les deux vous sursautez. {Parent_il} reprend la lettre. Pendant trois jours, on ne se parle presque plus à la maison.',
            effets: [{ drapeau: 'lettre', valeur: 'rendue_force' }, { relation: '@parent', delta: { confiance: -4 } }, { retour: 'fam_akihiko_marche', chance: 0.6, entre: [1700, 2200] }],
          },
        },
      },
      {
        id: 'relire',
        texte: 'La rendre, puis attendre d’être seul·e pour la relire',
        effets: [
          { drapeau: 'lettre', valeur: 'relue' },
          { drapeau: 'lettre_piste' },
          { stat: 'attributs.discretion', delta: 2 },
          { journal: 'La lettre relue en cachette : « passe des trois cèdres », une grue dessinée dans la marge.', importance: 2 },
          { retour: 'fam_akihiko_marche', chance: 0.9, entre: [1400, 2000] },
        ],
        resultat:
          'Tu rends la lettre, l’air de rien. Trois jours plus tard, {parent} part au marché, et tu sais exactement dans quel tiroir elle a migré.\n\nAu dos, il y a plus. « La passe des trois cèdres. Je n’ai pas pu. Il y avait des enfants dans ce village. » Et dans la marge, dessinée d’un seul trait, une grue aux ailes ouvertes.\n\nTu remets tout en place, au pli près. Tu ne sais pas encore ce que ça veut dire. Mais tu ne l’oublieras pas.',
      },
    ],
  },

  // Le frère ou la sœur aîné·e revient avec une question qu'on lui a posée : ce que tu sais change toute la scène.
  {
    ...base,
    id: 'fam_rien_raconte',
    titre: 'Tu ne m’as rien raconté',
    categorie: 'secret_familial',
    lieu: '$maison',
    priorite: 54,
    si: { tout: [ACTIF, { age: { min: 10, max: 13 } }, { drapeau: 'lettre' }, { pnj: '@aine', etat: ['vivant', 'blesse'] }, { drapeau: 'rien_raconte', absent: true }] },
    personnages: ['@aine'],
    texte: [
      {
        texte:
          '{AineNom} rentre tard, laisse tomber son sac dans l’entrée et s’assoit sur la marche, à côté de toi.\n\n« T’as une drôle de tête », dis-tu.\n\n« Et toi, tu parles trop. »\n\n« Ah. Donc ça s’est bien passé, ta journée ? »\n\n{AineNom} ne sourit pas. « J’ai croisé quelqu’un. Un type, devant l’Académie. Il connaissait mon nom. » Un temps. « Il m’a demandé si je savais ce qui était arrivé à l’oncle Akihiko. »',
      },
      { si: SAIT_LE_NOM, texte: 'Tu cesses de sourire. Ce nom, tu le portes depuis le tiroir.\n\n« Attends… Akihiko ? »\n\n« Oui. Pourquoi tu réagis comme ça ? »' },
      { si: { non: SAIT_LE_NOM }, texte: 'Un oncle ? Tu fouilles ta mémoire. Une enveloppe jaunie, une signature : « A. ». Tu n’avais jamais eu de nom à mettre dessus.\n\n« On a un oncle ? »\n\n« C’est ce que je me demande. Et toi, pourquoi tu fais cette tête ? »' },
    ],
    choix: [
      {
        id: 'tout_dire',
        texte: 'Tout lui raconter : la lettre, le tiroir, ce que tu sais',
        ton: 'franc',
        effets: [
          { drapeau: 'rien_raconte', valeur: 'partage' },
          { drapeau: 'lettre_piste' },
          { relation: '@aine', delta: { confiance: 8, attachement: 4 } },
          { journal: 'Tu as tout dit à {AineNom} : la lettre, le nom. Désormais, vous êtes deux à chercher.', importance: 2 },
        ],
        resultat:
          'Tu racontes. Le tiroir, l’enveloppe, la phrase sur la lâcheté. {AineNom} écoute sans t’interrompre, ce qui n’est pas du tout son genre.\n\n« Et tu as gardé ça pour toi pendant tout ce temps ? »\n\n« Tu m’aurais cru ? »\n\nUn long silence. Puis {aine_il} te donne un coup d’épaule. « La prochaine fois, tu me le dis. On cherche ensemble, ou on ne cherche pas. » Ce soir-là, vous parlez tout bas jusqu’à ce que {parent} frappe au mur.',
      },
      {
        id: 'mentir',
        texte: 'Hausser les épaules : ce nom ne te dit rien',
        ton: 'mensonge',
        effets: [{ drapeau: 'rien_raconte', valeur: 'menti' }, { stat: 'attributs.discretion', delta: 1 }, { relation: '@aine', delta: { confiance: -2 } }],
        resultat:
          '« Aucune idée. Sûrement un vieux fou. »\n\n{AineNom} te regarde un peu trop longtemps. {Aine_il} te connaît depuis que tu marches. « D’accord », dit {aine_il} enfin, et ce « d’accord » veut dire tout le contraire.\n\nTu gardes la lettre pour toi. Tu ne sais pas encore si c’est pour protéger {AineNom}, ou pour protéger {parent}.',
      },
      {
        id: 'homme',
        texte: 'Lui demander à quoi ressemblait cet homme',
        ton: 'franc',
        effets: [{ drapeau: 'rien_raconte', valeur: 'homme' }, { drapeau: 'grue' }, { stat: 'attributs.perception', delta: 1 }, { relation: '@aine', delta: { respect: 3 } }],
        resultat:
          '« Grand ? Vieux ? Du village ? »\n\n{AineNom} réfléchit. « Pas vieux. Fatigué. Une cicatrice qui lui tirait la bouche. Et à la ceinture, un kunai avec une grue gravée sur le manche. Je l’ai remarqué parce que c’était joli. » {Aine_il} fronce les sourcils. « Pourquoi ? »\n\nTu ne réponds pas tout de suite. Une grue. Tu retiens le détail comme on retient son souffle.',
      },
      {
        id: 'ensemble',
        texte: 'Proposer d’aller le retrouver, tous les deux',
        ton: 'chaleureux',
        effets: [{ drapeau: 'rien_raconte', valeur: 'ensemble' }, { drapeau: 'lettre_piste' }, { relation: '@aine', delta: { amitie: 6, confiance: 4 } }, { stat: 'social.suspicion', delta: 2 }],
        resultat:
          'Vous y retournez le lendemain, avant l’aube, cachés derrière la palissade de l’Académie. Personne. Juste, sur le poteau où l’homme s’était adossé, une encoche fraîche : trois traits, comme trois arbres.\n\nUn chūnin de garde vous surprend et vous ramène par l’oreille. « Qu’est-ce que vous faisiez là, tous les deux ? » Vous répondez exactement la même chose, au même moment. C’est la première fois que vous mentez ensemble.',
      },
    ],
  },

  // L'exploration du temps libre finit par mener quelque part.
  {
    ...base,
    id: 'tl_cabane_racines',
    // Planifié par le temps libre (exploration, enquête).
    planifieParMoteur: true,
    titre: 'La cabane sous les racines',
    categorie: 'enfance',
    lieu: 'foret_feu',
    enchaine: true,
    si: ACTIF,
    texte: [
      {
        texte:
          'À force de suivre le ruisseau plus loin que les autres enfants, tu trouves le cèdre couché. Ses racines forment une voûte, et sous la voûte, quelqu’un a construit une cabane : des planches noircies, une toile cirée en lambeaux, une étagère faite d’une caisse de munitions.\n\nPersonne n’est venu ici depuis des années. Sur l’étagère, une boîte en fer rouillée. Gravées dans la poutre, deux initiales, et à côté, au couteau, une grue aux ailes ouvertes.',
      },
      { si: SAIT_LE_NOM, texte: 'Le « A. » de la lettre. Ton cœur cogne. Tu sais à qui était cette cabane, ou plutôt à qui elle était aussi : l’autre initiale est celle de {parentNom}.' },
      { si: { non: SAIT_LE_NOM }, texte: 'Un « A. », et l’initiale de {parentNom}. Sûrement une coïncidence. Sûrement.' },
    ],
    choix: [
      {
        id: 'boite',
        texte: 'Ouvrir la boîte en fer',
        effets: [{ objet: 'boite_cabane' }, { stat: 'attributs.perception', delta: 1 }, { drapeau: 'cabane', valeur: 'boite' }],
        resultat:
          'Des billes de verre, un sifflet en os, et un dessin d’enfant plié en quatre : deux silhouettes sur un toit, l’une plus grande que l’autre, qui montrent du doigt la même étoile. Derrière, d’une main maladroite : « Quand on sera ninjas, on ne se quittera jamais. »\n\nTu emportes la boîte. Elle pèse plus lourd qu’elle ne devrait.',
      },
      {
        id: 'repaire',
        texte: 'En faire ton repaire secret',
        effets: [{ drapeau: 'cabane', valeur: 'repaire' }, { stat: 'attributs.discretion', delta: 2 }, { stat: 'jauges.fatigue', delta: -10 }],
        resultat:
          'Tu remplaces la toile, tu cales l’étagère, tu caches une couverture et une réserve de riz grillé. Désormais, quand le village devient trop bruyant, tu sais où aller. La grue dans la poutre te regarde dormir. Tu finis par la trouver rassurante.',
      },
      {
        id: 'montrer',
        texte: 'Ramener {parent} jusqu’ici',
        si: PARENT_LA,
        verrou: '{Parent} n’est plus là pour voir ça.',
        effets: [{ drapeau: 'cabane', valeur: 'montree' }, { relation: '@parent', delta: { attachement: 6, confiance: 4 } }, { drapeau: 'lettre_piste' }, { journal: 'La cabane sous les racines : celle de {parent} et de son frère.', importance: 2 }],
        resultat:
          '{Parent} s’arrête net devant la voûte de racines. {Parent_il} pose la main sur la poutre, sur la grue, et ne dit rien pendant si longtemps que tu as peur d’avoir fait une bêtise.\n\n« On l’a construite l’été de mes onze ans. Ton oncle avait neuf ans. Il a gravé la grue parce qu’il disait que les grues reviennent toujours à leur nid. »\n\nSur le chemin du retour, {parent_il} te tient la main. Tu as passé l’âge, mais tu ne la retires pas.',
      },
      {
        id: 'laisser',
        texte: 'Tout laisser comme tu l’as trouvé',
        effets: [{ drapeau: 'cabane', valeur: 'laissee' }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Certains endroits appartiennent à ceux qui les ont faits. Tu remets la toile en place et tu repars en marchant dans tes propres traces. Tu reviendras peut-être. Plus tard.',
      },
    ],
  },

  // Au bout de l'enquête du temps libre : la stèle des morts.
  {
    ...base,
    id: 'fam_nom_raye',
    // Planifié par le temps libre (exploration, enquête).
    planifieParMoteur: true,
    titre: 'Le nom rayé',
    categorie: 'secret_familial',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte:
      'La stèle des morts se dresse au bout de l’allée des pins, couverte de noms gravés serrés, ceux de la Première et de la Deuxième Grande Guerre. Tu la parcours du doigt, ligne par ligne, jusqu’à la colonne des disparus de l’an 43.\n\nIl y a un endroit où la pierre est plus claire. Quelqu’un a rayé un nom au burin, avec soin, jusqu’à le rendre illisible. Presque. À la lumière rasante du soir, on devine encore les traits : Akihiko.\n\nUne vieille femme balaie les aiguilles de pin au pied de la stèle. Elle ne te regarde pas. « On ne raye pas les morts, petit{e}. On raye ceux qui sont partis. »',
    personnages: ['@parent'],
    choix: [
      {
        id: 'gardienne',
        texte: 'Demander à la gardienne ce qu’il a fait',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { charisme: 2, controleEmotionnel: 1 },
          succes: {
            texte:
              'Elle s’appuie sur son balai. « Il a refusé un ordre, à la passe des trois cèdres. Un village à brûler, pour l’exemple. Il y avait des enfants. » Elle hausse les épaules. « Ceux qui ont donné l’ordre sont morts depuis, et décorés. Lui, on l’a rayé. » Elle reprend son balai. « Le village a la mémoire courte pour ses fautes, et longue pour celles des autres. »',
            effets: [{ drapeau: 'akihiko', valeur: 'ordre_refuse' }, { secret: 'oncle_akihiko' }, { ethique: { compassion: 3 } }, { retour: 'fam_akihiko_marche', chance: 1, entre: [700, 1300] }],
          },
          echec: {
            texte: '« Rentre chez toi. » Elle ne lève même pas les yeux. Quand tu insistes, elle appelle un genin qui passait et te fait raccompagner jusqu’à la grande rue. Le lendemain, {parent} sait que tu étais à la stèle. Personne ne t’en parle. C’est pire.',
            effets: [{ drapeau: 'akihiko', valeur: 'repere' }, { relation: '@parent', delta: { confiance: -3 } }, { retour: 'fam_akihiko_marche', chance: 1, entre: [700, 1300] }],
          },
        },
      },
      {
        id: 'parent',
        texte: 'Rentrer et le dire à {parent}, en face',
        si: PARENT_LA,
        verrou: '{Parent} n’est plus là pour répondre.',
        ton: 'franc',
        effets: [{ drapeau: 'akihiko', valeur: 'verite_parent' }, { secret: 'oncle_akihiko' }, { relation: '@parent', delta: { confiance: 8, attachement: 5 } }, { journal: '{Parent} t’a dit la vérité sur Akihiko : un ordre refusé, un nom rayé.', importance: 3 }, { retour: 'fam_akihiko_marche', chance: 1, entre: [700, 1300] }],
        resultat:
          '« J’ai vu la stèle. »\n\n{Parent} pose sa tasse. Il n’y a pas de colère sur son visage. Seulement de la fatigue, très ancienne.\n\n« On lui a ordonné de brûler un village à la frontière. Pour l’exemple. Il a refusé, il a fait sortir les gens par la passe, et il n’est jamais revenu. » {Parent_il} regarde ses mains. « Moi, j’ai témoigné devant le Conseil. J’ai dit que je ne savais rien. C’était vrai, et c’était lâche. »\n\nC’est la première fois qu’un adulte te demande pardon sans le dire.',
      },
      {
        id: 'empreinte',
        texte: 'Revenir la nuit, et relever le nom au fusain',
        effets: [{ drapeau: 'akihiko', valeur: 'silence' }, { objet: 'empreinte_stele' }, { stat: 'attributs.discretion', delta: 2 }, { retour: 'fam_akihiko_marche', chance: 1, entre: [700, 1300] }],
        resultat:
          'Une feuille de papier de riz, un bâton de fusain, et la lune pour seule complice. Sous ta main, le nom rayé revient lentement, plus net sur le papier que sur la pierre. Tu plies la feuille et tu la ranges avec tes affaires d’Académie, entre deux rouleaux de techniques que personne n’ouvre jamais.',
      },
    ],
  },

  // Des années plus tard : l'homme à la grue.
  {
    ...base,
    id: 'fam_akihiko_marche',
    titre: 'L’homme à la grue',
    chapitres: [1, 2, 3],
    categorie: 'secret_familial',
    lieu: 'route_commerce',
    enchaine: true,
    si: { tout: [ACTIF, { drapeau: 'lettre' }, { age: { min: 12, max: 18 } }] },
    texte: [
      {
        texte:
          'Un relais de marchands, à une demi-journée du village. Tu attends le reste de ton escorte quand un homme s’assoit en face de toi, sans demander. Une cicatrice lui tire le coin de la bouche. À sa ceinture, un kunai au manche gravé d’une grue.\n\nIl te regarde longtemps. « Tu as ses yeux. Ceux de {parentNom}. » Sa voix est plus douce que son visage.',
      },
      { si: { un: [{ drapeau: 'akihiko' }, SAIT_LE_NOM] }, texte: 'Tu n’as pas besoin qu’il se présente. La grue, la cicatrice, la façon dont il a dit le nom de {parent}.\n\n« Akihiko. »\n\nIl sourit, et pour la première fois, le sourire tient. « Alors on t’a parlé de moi. Ou tu as cherché. Ça, c’est de famille. »' },
      { si: { non: { un: [{ drapeau: 'akihiko' }, SAIT_LE_NOM] } }, texte: '« Je m’appelle Akihiko. Je suis le frère de {parentNom}. » Il laisse le silence faire son travail. « On t’a sûrement dit que j’étais mort. C’est plus simple, pour tout le monde. »' },
      {
        texte:
          '« Je fais passer des gens. Ceux que les guerres oublient de compter. » Il pose sur la table un papier plié, scellé à la cire, une grue imprimée dedans. « Si tu veux, tu le donnes à {parentNom}. Si tu ne veux pas, tu le brûles. Je ne t’en voudrai pas. »',
      },
    ],
    choix: [
      {
        id: 'porter',
        texte: 'Prendre le message, et le porter à {parent}',
        ton: 'chaleureux',
        effets: [
          { drapeau: 'akihiko', valeur: 'messager' },
          { secret: 'oncle_akihiko' },
          { objet: 'message_grue' },
          { ethique: { compassion: 4 } },
          { stat: 'social.suspicion', delta: 4 },
          { relation: '@parent', delta: { attachement: 6, confiance: 4 } },
          { journal: 'Tu as porté le message d’Akihiko à {parent}. Pour la première fois depuis la guerre, les deux frères se parlent.', importance: 3 },
        ],
        resultat:
          'Tu glisses le papier dans ta manche. Le soir, tu le poses sur la table de la cuisine, devant {parent}, et tu ne dis rien.\n\n{Parent} le reconnaît avant de le toucher. {Parent_il} le lit debout, puis assis, puis une troisième fois, la main sur la bouche.\n\nTu ne sauras jamais tout ce qu’il y avait dedans. Mais le lendemain, il y a deux tasses sur le rebord de la fenêtre, tournées vers la frontière. Et si quelqu’un, au village, apprenait d’où vient ce papier, ce serait un crime.',
      },
      {
        id: 'denoncer',
        texte: 'Le signaler à la garde : c’est un déserteur',
        ton: 'froid',
        effets: [
          { drapeau: 'akihiko', valeur: 'denonce' },
          { secret: 'oncle_akihiko' },
          { stat: 'social.reputation', delta: 4 },
          { stat: 'social.loyaute', delta: 6 },
          { ethique: { compassion: -4, honneur: 2 } },
          { relation: '@parent', delta: { confiance: -10 } },
          { journal: 'Tu as signalé Akihiko à la garde. Il était déjà parti ; {parent} l’a su.', importance: 3 },
        ],
        resultat:
          'Tu te lèves sans un mot et tu vas trouver le chef de l’escorte. Quand les gardes reviennent, la place est vide. Le papier scellé est resté sur la table ; quelqu’un l’emporte comme pièce à conviction.\n\nLe village te félicite. Un rapport mentionne ton nom, en bien.\n\nÀ la maison, {parent} ne te demande rien. {Parent_il} sait. Le soir, la lampe de la cuisine ne s’allume plus.',
      },
      {
        id: 'pourquoi',
        texte: 'Lui demander pourquoi il n’est jamais revenu',
        ton: 'franc',
        effets: [{ drapeau: 'akihiko', valeur: 'compris' }, { secret: 'oncle_akihiko' }, { objet: 'kunai_grue' }, { ethique: { compassion: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat:
          'Il tourne longtemps sa tasse entre ses mains.\n\n« Parce que revenir, c’était demander à {parentNom} de choisir entre le village et moi. Et que {parent_il} aurait choisi le village. Il le fallait : {parent_il} avait toi. »\n\nIl se lève, pose le kunai à la grue sur la table, devant toi. « Il revient toujours à son nid, celui-là. Moi, je n’ai plus de nid. Garde-le. »\n\nQuand tu relèves les yeux, il est déjà loin sur la route, une silhouette parmi les marchands.',
      },
      {
        id: 'ignorer',
        texte: 'Faire comme si tu ne l’avais pas reconnu',
        ton: 'silence',
        effets: [{ drapeau: 'akihiko', valeur: 'ignore' }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat:
          'Tu regardes ailleurs. Tu regardes la route, les mules, le ciel, n’importe quoi. Au bout d’un moment, il reprend son papier, se lève, et pose une main sur ton épaule en passant. Elle est légère, et elle ne reste pas.\n\n« Tu as raison. Ce n’est pas ton fardeau. »\n\nTu n’en parles jamais à {parent}. Certaines nuits, tu te demandes si c’était de la sagesse ou de la peur.',
      },
    ],
  },
];
