import type { Condition, EventDef } from '../../engine/types';

/**
 * Les autres jinchūriki : un hôte ennemi qu'on peut affronter (ou fuir, ou reconnaître quand on en est un soi-même),
 * et un hôte allié avec qui l'on part en mission, dont la bête peut échapper au contrôle.
 * Ennemi ou allié : le hasard en décide (poids des deux rencontres, environ 3 contre 2), et la bête aussi (tirages dans les choix).
 */
const ADULTE: Condition = { tout: [{ statut: ['actif', 'errant'] }, { age: { min: 16, max: 55 } }, { rangMin: 'genin' }] };
const commun = { chapitre: 2, chapitres: [2, 3, 4, 5], arc: 'premieres_missions' as const };

const JINCHURIKI: Condition = { drapeau: 'jinchuriki' };

export const JINCHURIKI_EVENEMENTS: EventDef[] = [
  {
    id: 'jk_ennemi',
    ...commun,
    titre: 'L’hôte d’en face',
    categorie: 'mission',
    lieu: 'frontiere_herbe',
    poids: 3,
    si: ADULTE,
    texte: [
      { si: { village: ['konoha', 'kiri'] }, texte: 'Au col, la pluie s’arrête d’un coup : l’air sent l’orage. Une silhouette seule sur le chemin, bandeau de Kumo. Ses cheveux se dressent en crépitant. « Tu sais ce que je porte. Tu sais aussi que je n’ai pas le droit de te laisser passer. » Derrière ses yeux, quelque chose d’énorme ouvre les siens.' },
      { si: { village: 'suna' }, texte: 'Les rochers se mettent à fumer. Un homme d’Iwa, torse nu, les avant-bras couverts de cicatrices de brûlure, t’attend au milieu du gué. L’eau bout autour de ses chevilles. « Le Singe veut sortir. Je le retiens pour toi. Pas longtemps. »' },
      { si: { village: 'iwa' }, texte: 'Le sable se lève sans vent. Un garçon de Suna, les yeux cernés de noir, est assis sur un rocher, une jarre énorme dans le dos. Il ne dort pas : ça se voit. « Il me parle quand tu approches. Il dit qu’il aime ton odeur. »' },
      { si: { village: 'kumo' }, texte: 'Une femme de Konoha, seule, sur la route du col. Ses pupilles sont fendues comme celles d’un renard. Quand elle sourit, ses canines dépassent. « On m’a envoyée voir ce que valent les gens d’en face. Le Renard, lui, voulait juste sortir. »' },
      { si: JINCHURIKI, texte: 'En toi, ta propre bête se réveille d’un coup et gronde. Deux hôtes face à face : les deux bêtes se sont reconnues avant vous.' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Le combattre avant que la bête sorte',
        test: {
          type: 'combat',
          difficulte: 74,
          attributs: { force: 1, agilite: 2, controleChakra: 2, controleEmotionnel: 1 },
          maitrises: { ninjutsu: 2, taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tué·e par un jinchūriki ennemi, au col de la frontière',
          succes: {
            texte: 'Tu frappes vite, avant que le chakra de la bête ait fini de monter. L’hôte tombe, et le manteau rouge qui commençait à le couvrir retombe avec lui, comme une flamme qu’on souffle. Tu restes debout au milieu d’un terrain retourné, à te demander ce qui se serait passé si tu avais attendu une seconde de plus.',
            effets: [{ stat: 'social.reputation', delta: 8 }, { drapeau: 'jinchuriki_vaincu' }, { stat: 'attributs.controleChakra', delta: 2 }, { journal: 'Tu as vaincu un jinchūriki ennemi avant que sa bête ne sorte.', importance: 3 }],
          },
          partiel: {
            texte: 'La bête sort à moitié. Tu prends un coup de queue de chakra qui t’envoie à vingt mètres, contre la roche. Quand tu te relèves, l’hôte est à genoux, en train de se battre contre sa propre bête. Tu en profites pour partir. Personne ne gagne aujourd’hui.',
            effets: [{ blessure: { id: 'queue_biju', nom: 'Coup de queue d’un bijū', gravite: 2, jours: 45 } }, { stat: 'social.reputation', delta: 3 }],
          },
          echec: {
            texte: 'Tu arrives une seconde trop tard. La bête sort, et le monde devient rouge. Tu ne te souviens pas d’avoir fui. Tu te réveilles dans un fossé, deux côtes brisées, la peau brûlée par un chakra qui n’était pas humain.',
            effets: [{ blessure: { id: 'chakra_biju_brulure', nom: 'Brûlures de chakra de bijū', gravite: 3, jours: 90 } }],
          },
        },
      },
      {
        id: 'fuir',
        texte: 'Fuir avant que la bête se réveille tout à fait',
        effets: [
          {
            hasard: [
              { poids: 60, effets: [{ stat: 'jauges.fatigue', delta: 30 }, { journal: 'Tu as fui un jinchūriki ennemi. Tu as couru jusqu’à ne plus sentir tes jambes.' }] },
              { poids: 40, effets: [{ blessure: { id: 'fuite_biju', nom: 'Dos lacéré par un chakra de bijū', gravite: 2, jours: 40 } }, { stat: 'jauges.fatigue', delta: 40 }, { drapeau: 'fuite_biju_blesse' }] },
            ],
          },
        ],
        resultat: [
          { texte: 'Tu cours. Derrière toi, un rugissement fait trembler les arbres, et tu sens une chaleur énorme te frôler le dos.' },
          { si: { drapeau: 'fuite_biju_blesse' }, texte: 'Elle ne te frôle pas : elle t’ouvre le dos. Tu cours quand même, en saignant, jusqu’à ce que le rugissement se taise.' },
        ],
      },
      {
        id: 'reconnaitre',
        texte: 'Laisser ta propre bête lui parler',
        si: JINCHURIKI,
        verrou: 'Il faudrait porter une bête, toi aussi.',
        effets: [{ drapeau: 'jinchuriki_ami' }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { entrainer: 'chakra_biju', jours: 20 }],
        resultat: 'Tu fermes les yeux et tu laisses ta bête gronder. Celle d’en face répond. Ce n’est pas une menace : c’est une question, très ancienne. Quand tu rouvres les yeux, l’hôte a baissé les mains. « Ils nous envoient l’un contre l’autre comme des chiens. » Vous repartez chacun de votre côté. Tu sais qu’un jour, tu le reverras.',
      },
    ],
  },
  {
    id: 'jk_allie',
    ...commun,
    titre: 'L’hôte de ton village',
    categorie: 'mission',
    lieu: '$porte',
    poids: 2,
    si: {
      tout: [
        { statut: 'actif' },
        { age: { min: 15, max: 50 } },
        { rangMin: 'genin' },
        {
          un: [
            { tout: [{ village: 'konoha' }, { non: { drapeau: 'jinchuriki', egal: 'kyubi' } }] },
            { tout: [{ village: 'suna' }, { non: { drapeau: 'jinchuriki', egal: 'ichibi' } }] },
            { tout: [{ village: 'kiri' }, { non: { drapeau: 'jinchuriki', egal: 'rokubi' } }] },
            { tout: [{ village: 'kumo' }, { non: { drapeau: 'jinchuriki', egal: 'nibi' } }] },
            { tout: [{ village: 'iwa' }, { non: { drapeau: 'jinchuriki', egal: 'gobi' } }] },
          ],
        },
      ],
    },
    texte: [
      { texte: 'À la porte, ton équipe pour la mission t’attend : deux chūnin, et une troisième personne que tout le monde évite du regard.' },
      { si: { village: 'konoha' }, texte: 'Hinoe. Les marques sur ses joues ressemblent à des moustaches. On dit qu’elle porte le Renard. Elle te tend la main la première, comme si elle avait l’habitude qu’on ne la prenne pas.' },
      { si: { village: 'suna' }, texte: 'Kazuki. Il ne dort jamais, et ça se voit. Il porte le Tanuki de sable. Le sable bouge autour de ses pieds quand il est nerveux. Il est nerveux.' },
      { si: { village: 'kiri' }, texte: 'Mizore. Sa peau luit d’un léger reflet humide. Elle porte la Limace à six queues, et sourit trop poliment, comme quelqu’un qui s’excuse d’exister.' },
      { si: { village: 'kumo' }, texte: 'Raiha. Des flammes bleues dansent parfois au bout de ses doigts, sans qu’elle s’en aperçoive. Elle porte le Chat à deux queues, et elle a l’air de s’ennuyer.' },
      { si: { village: 'iwa' }, texte: 'Ganseki. Grand, lent, de la vapeur sort de sa bouche quand il parle. Il porte le Cheval-dauphin à cinq queues. Il te regarde comme on regarde un enfant qu’on ne veut pas effrayer.' },
      { si: JINCHURIKI, texte: 'Quand vos regards se croisent, vos deux bêtes se taisent en même temps. Personne d’autre ne le remarque.' },
    ],
    choix: [
      {
        id: 'confiance',
        texte: 'Lui faire confiance, et marcher à côté de l’hôte',
        effets: [
          {
            hasard: [
              {
                poids: 70,
                effets: [
                  { stat: 'social.reputation', delta: 5 },
                  { drapeau: 'allie_jinchuriki' },
                  { stat: 'jauges.ryo', delta: 120 },
                  { retour: 'jk_allie_renfort', chance: 0.6, entre: [200, 900] },
                ],
              },
              { poids: 30, effets: [{ drapeau: 'allie_jinchuriki_crise' }] },
            ],
          },
        ],
        resultat: [
          { si: { drapeau: 'allie_jinchuriki_crise', absent: true }, texte: 'La mission se passe sans un accroc. Le soir, autour du feu, l’hôte te parle de ce que c’est, de porter une bête : les voix la nuit, les regards le jour. Tu écoutes. Au retour, on te paie, et l’hôte te salue d’un signe de tête que personne d’autre ne reçoit.' },
          { si: { drapeau: 'allie_jinchuriki_crise' }, texte: 'Au troisième jour, une embuscade. L’hôte prend un kunai dans l’épaule, et quelque chose se déchire en lui. Le chakra rouge monte. Les chūnin reculent. Toi, tu es le plus près.' },
        ],
        suite: 'jk_allie_crise',
      },
      {
        id: 'mefiance',
        texte: 'Garder tes distances, comme les autres',
        effets: [{ stat: 'social.reputation', delta: 2 }, { ethique: { compassion: -3 } }],
        resultat: 'Tu marches derrière, avec les autres. La mission se passe bien. Au retour, l’hôte part seul, sans dire au revoir à personne. Il a l’habitude.',
      },
    ],
  },
  {
    id: 'jk_allie_crise',
    ...commun,
    titre: 'La bête se réveille',
    categorie: 'mission',
    lieu: 'route_commerce',
    enchaine: true,
    si: { drapeau: 'allie_jinchuriki_crise' },
    texte: 'Le manteau de chakra rouge recouvre l’hôte jusqu’aux épaules. Ses yeux ne sont plus les siens. Les chūnin crient de le laisser, de fuir, d’attendre les renforts. Il te regarde, et pendant une seconde, c’est encore lui qui te regarde. « Aide-moi. »',
    choix: [
      {
        id: 'retenir',
        texte: 'Le retenir, lui parler, ne pas le lâcher',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { controleEmotionnel: 3, charisme: 2, force: 1 },
          letal: false,
          succes: {
            texte: 'Tu l’attrapes par les épaules. Le chakra te brûle les mains jusqu’à l’os. Tu ne lâches pas. Tu parles, de n’importe quoi : du feu de la veille, de son village, de son nom. Lentement, le rouge redescend. Quand c’est fini, il pleure contre ton épaule, et tes mains sont couvertes de cloques. Tu as gagné quelqu’un pour la vie.',
            effets: [{ drapeau: 'allie_jinchuriki' }, { blessure: { id: 'mains_brulees', nom: 'Mains brûlées par un chakra de bijū', gravite: 1, jours: 20 } }, { stat: 'social.reputation', delta: 6 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { retour: 'jk_allie_renfort', chance: 0.8, entre: [200, 900] }],
          },
          echec: {
            texte: 'Le chakra te projette contre un arbre. Quand tu reprends connaissance, l’hôte est à genoux au milieu d’un cercle de terre brûlée, revenu à lui. Un des chūnin ne se relèvera pas. Il te regarde, et il sait que tu as essayé. Ça ne suffit pas à le consoler.',
            effets: [{ blessure: { id: 'crise_biju', nom: 'Projeté·e par un chakra de bijū', gravite: 2, jours: 40 } }, { drapeau: 'allie_jinchuriki' }],
          },
        },
      },
      {
        id: 'fuir',
        texte: 'Fuir avec les chūnin',
        effets: [{ ethique: { compassion: -5 } }, { drapeau: 'allie_jinchuriki_abandonne' }],
        resultat: 'Vous courez. Derrière vous, la forêt brûle pendant une heure. On retrouve l’hôte le lendemain, endormi, seul, au milieu des cendres. Il ne t’adressera plus jamais la parole.',
      },
    ],
  },
  {
    id: 'jk_allie_renfort',
    ...commun,
    titre: 'Un manteau rouge dans la mêlée',
    categorie: 'mission',
    lieu: 'foret_feu',
    enchaine: true,
    si: { tout: [{ drapeau: 'allie_jinchuriki' }, { statut: ['actif', 'errant'] }] },
    texte: 'Ils sont six, et tu es seul·e. Ton dos touche un arbre. Puis la forêt s’illumine de rouge, et une silhouette tombe du ciel entre toi et eux. L’hôte. Il ne dit rien. Il n’en a pas besoin.',
    choix: [
      {
        id: 'ensemble',
        texte: 'Te battre à ses côtés',
        effets: [{ stat: 'social.reputation', delta: 6 }, { stat: 'attributs.force', delta: 1 }, { stat: 'attributs.agilite', delta: 1 }, { entrainer: 'ninjutsu', jours: 15 }],
        resultat: 'Ce n’est pas un combat, c’est une tempête. Tu frappes ceux qui tentent de le contourner ; il balaie les autres d’un revers de queue de chakra. Deux s’écrasent contre les arbres, un troisième disparaît dans un trou de terre fumante. Les autres fuient. Quand le rouge retombe, il te tend la main pour te relever. « On est quittes. »',
      },
      {
        id: 'couvrir',
        texte: 'Couvrir ses arrières pendant qu’il retient la bête',
        effets: [{ stat: 'social.reputation', delta: 4 }, { stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Tu te places dos à son dos. Tu sens la chaleur de son chakra à travers ta veste, et sa respiration qui s’accélère : il se bat aussi contre ce qu’il porte. Tu arrêtes les deux kunai qui visaient sa nuque pendant qu’il avait les yeux fermés. Quand c’est fini, il te regarde longtemps. « Tu as surveillé mon dos pendant que je surveillais la bête. Personne ne fait ça. »',
      },
    ],
  },
];
