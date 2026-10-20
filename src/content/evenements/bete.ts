import type { Condition, Effect, EventDef } from '../../engine/types';

// Vivre avec la bête : le jinchūriki apprend, palier après palier, à utiliser le chakra de son bijū.
// Chaque étape est un pari, d'autant plus risqué que le contrôle émotionnel est faible.
// Et la mort d'un proche, sous ses yeux, peut briser le sceau (voir engine/pertes.ts).

const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'conflit' as const };
const JINCHURIKI: Condition = { drapeau: 'jinchuriki' };
const LIBRE: Condition = { statut: ['actif', 'errant', 'deserteur', 'exile'] };
const SENSEI: Condition = { pnj: '@sensei', etat: ['vivant', 'blesse'] };

/** Chez un Uchiha, la mort d'un proche peut aussi éveiller l'œil. */
const CHOC_UCHIHA: Effect = { si: { clan: 'uchiha' }, alors: [{ tenterEveil: 'sharingan', intensite: 40 }, { tenterEveil: 'mangekyo', intensite: 30 }] };

export const BETE: EventDef[] = [
  // ── La bête se libère ──
  {
    ...base,
    id: 'b_dechainement',
    titre: 'Le sceau se brise',
    categorie: 'eveil',
    lieu: '$ici',
    enchaine: true,
    planifieParMoteur: true,
    repetable: { delaiJours: 0 },
    si: { tout: [JINCHURIKI, LIBRE] },
    texte: [
      { texte: 'Le corps tombe, et quelque chose tombe en toi avec lui. Le monde devient rouge. Ta peau brûle, tes ongles s’allongent, une voix grave rit dans ton ventre : « Enfin. Laisse-moi faire. »' },
      { si: { maitrise: 'chakra_biju', palierMax: 1 }, texte: 'Tu ne sais rien de cette chose. Tu sais seulement qu’elle a faim.' },
      { si: { maitrise: 'chakra_biju', palierMin: 2 }, texte: 'Tu connais cette voix. Tu sais ce qu’elle peut faire. C’est bien ce qui t’effraie.' },
    ],
    choix: [
      {
        id: 'reprendre',
        texte: 'Reprendre le contrôle, de toutes tes forces',
        indice: 'Tes chances dépendent de ton contrôle émotionnel et de ta maîtrise de la bête.',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { controleEmotionnel: 3, controleChakra: 1 },
          maitrises: { chakra_biju: 2 },
          succes: {
            texte: 'Tu plonges dans le rouge et tu tires, comme on tire une corde au-dessus d’un gouffre. Le chakra reflue. Au fond de toi, derrière une cage immense, deux yeux te regardent pour la première fois avec quelque chose comme du respect.',
            effets: [{ drapeau: 'rencontre_biju' }, { entrainer: 'chakra_biju', jours: 60 }, { stat: 'attributs.controleEmotionnel', delta: 4 }, { journal: 'La bête s’est libérée, et tu l’as reprise.', importance: 3 }],
          },
          echec: {
            texte: 'Tu tires, et la bête tire plus fort. Tu te réveilles au milieu d’un cratère, sans souvenir des minutes précédentes. Autour de toi, ennemis et alliés se tiennent à distance. Certains ne se relèvent pas.',
            effets: [
              { blessure: { id: 'dechainement', nom: 'Corps brûlé par le chakra de la bête', gravite: 3, jours: 60 } },
              { stat: 'social.suspicion', delta: 15 },
              { drapeau: 'bete_liberee', incr: 1 },
              { si: { pnj: '@coequipierB', etat: 'vivant' }, alors: [{ hasard: [{ poids: 1, effets: [{ pnjEtat: '@coequipierB', etat: 'blesse' }] }, { poids: 2, effets: [] }] }] },
              { journal: 'La bête a pris ta place, quelques minutes.', importance: 3 },
            ],
          },
        },
      },
      {
        id: 'laisser',
        texte: 'La laisser frapper ceux qui ont fait ça',
        indice: 'Elle ne fait pas la différence entre les uniformes.',
        test: {
          type: 'combat',
          difficulte: 50,
          modificateur: 25,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { chakra_biju: 2 },
          succes: {
            texte: 'Tu ne retiens rien. La bête non plus. Quand le rouge se retire, il ne reste rien de ceux qui ont fait ça. Il reste un cratère, et le regard de tes alliés, qui ne sera plus jamais tout à fait le même.',
            effets: [{ stat: 'social.reputationOmbre', delta: 10 }, { stat: 'social.suspicion', delta: 10 }, { ethique: { compassion: -6 } }, { drapeau: 'bete_liberee', incr: 1 }],
          },
          echec: {
            texte: 'La bête frappe tout ce qui bouge. Quand tu reprends conscience, un des tiens est à terre, et c’est ta main qui l’a frappé.',
            effets: [{ stat: 'social.suspicion', delta: 20 }, { drapeau: 'bete_liberee', incr: 1 }, { si: { pnj: '@coequipierB', etat: ['vivant', 'blesse'] }, alors: [{ pnjEtat: '@coequipierB', etat: 'blesse' }] }, { blessure: { id: 'dechainement_total', nom: 'Corps consumé par la bête', gravite: 3, jours: 90 } }],
          },
        },
      },
      {
        id: 'sensei',
        texte: 'Hurler le nom de {@sensei}',
        si: SENSEI,
        effets: [{ stat: 'jauges.chakraMax', delta: -5 }, { relation: '@sensei', delta: { confiance: 10, attachement: 8 } }, { stat: 'social.suspicion', delta: 5 }],
        resultat: '{@sensei} arrive en trois bonds et plaque sa paume sur ton ventre. Le sceau se referme, d’un coup, avec un bruit de verrou. Tu t’effondres. Quand tu rouvres les yeux, il est encore là. « Pas aujourd’hui », dit-il. À elle, ou à toi.',
      },
    ],
  },

  // ── Apprendre à vivre avec la bête ──
  {
    ...base,
    id: 'b_descente',
    titre: 'Derrière le sceau',
    categorie: 'eveil',
    lieu: 'temple_oublie',
    priorite: 60,
    repetable: { delaiJours: 360, max: 4 },
    si: { tout: [JINCHURIKI, LIBRE, { age: { min: 14 } }, { maitrise: 'chakra_biju', palierMin: 2 }, { drapeau: 'rencontre_biju', absent: true }] },
    texte: 'Assis·e en tailleur au bord d’une cascade, tu fermes les yeux et tu descends. Un couloir d’eau, des tuyaux, une odeur de rouille. Au bout, une cage haute comme une montagne. Derrière les barreaux, quelque chose respire.',
    choix: [
      {
        id: 'descendre',
        texte: 'Avancer jusqu’aux barreaux et la regarder en face',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { controleEmotionnel: 2, controleChakra: 1 },
          maitrises: { chakra_biju: 2 },
          succes: {
            texte: 'Elle sort la gueule de l’ombre, à un souffle de ton visage. Tu ne recules pas. Elle te dit son nom : {biju}. C’est un début.',
            effets: [{ drapeau: 'rencontre_biju' }, { entrainer: 'chakra_biju', jours: 60, mentor: true }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { journal: 'Tu as rencontré {biju} derrière le sceau.', importance: 3 }],
          },
          echec: {
            texte: 'Une griffe passe entre les barreaux. Tu te réveilles hurlant, la poitrine marquée de trois traces rouges. Au village, on a senti son chakra jusqu’à la porte.',
            effets: [{ blessure: { id: 'griffe', nom: 'Griffe de la bête', gravite: 2, jours: 30 } }, { stat: 'social.suspicion', delta: 5 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
          },
        },
      },
      {
        id: 'remonter',
        texte: 'Remonter avant qu’elle ne te voie',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { ambition: -2 } }],
        resultat: 'Tu rouvres les yeux, trempé·e de sueur. Elle t’a vu·e quand même. Elle attendra.',
      },
    ],
  },
  {
    ...base,
    id: 'b_accord',
    titre: 'Le pacte avec la bête',
    categorie: 'eveil',
    lieu: 'temple_oublie',
    priorite: 58,
    repetable: { delaiJours: 500, max: 3 },
    si: { tout: [JINCHURIKI, LIBRE, { age: { min: 18 } }, { drapeau: 'rencontre_biju' }, { maitrise: 'chakra_biju', palierMin: 3 }, { drapeau: 'accord_biju', absent: true }] },
    texte: '{biju} t’attend derrière les barreaux. « Tu prends mon chakra quand tu as peur, et tu me renfermes quand tu as fini. Pourquoi est-ce que je t’aiderais encore ? »',
    choix: [
      {
        id: 'amitie',
        texte: 'Lui parler comme à un égal',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          maitrises: { chakra_biju: 2 },
          succes: { texte: 'Tu ne promets rien. Tu lui demandes ce qu’elle veut, à elle. Elle se tait longtemps. Puis elle rit, d’un rire qui fait trembler la cage. « Bon. On essaie. »', effets: [{ drapeau: 'accord_biju' }, { entrainer: 'chakra_biju', jours: 90, mentor: true }, { ethique: { compassion: 4 } }, { journal: 'Tu as conclu un accord avec {biju}.', importance: 3 }] },
          echec: { texte: '« Tu parles comme ceux qui m’ont enfermée. » Elle se détourne. Tu reviendras.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }] },
        },
      },
      {
        id: 'force',
        texte: 'Lui arracher son chakra de force',
        test: {
          type: 'combat',
          difficulte: 66,
          attributs: { force: 1, controleEmotionnel: 2, controleChakra: 1 },
          maitrises: { chakra_biju: 2 },
          manches: 3,
          succes: { texte: 'Tu tiens tête à la bête dans ton propre esprit, jusqu’à ce qu’elle cède une part de son chakra. Elle t’obéira. Elle ne t’aimera pas.', effets: [{ drapeau: 'accord_biju' }, { ethique: { ambition: 6 } }, { entrainer: 'chakra_biju', jours: 60 }] },
          echec: { texte: 'Elle t’écrase dans ton propre esprit. Tu te réveilles des jours plus tard, et le sceau a pâli.', effets: [{ blessure: { id: 'esprit', nom: 'Esprit brisé par la bête', gravite: 3, jours: 60 } }, { stat: 'social.suspicion', delta: 8 }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'b_harmonie',
    titre: 'Deux volontés, un seul corps',
    categorie: 'eveil',
    lieu: 'temple_oublie',
    priorite: 55,
    repetable: { delaiJours: 720, max: 3 },
    si: { tout: [JINCHURIKI, LIBRE, { age: { min: 22 } }, { drapeau: 'accord_biju' }, { maitrise: 'chakra_biju', palierMin: 4 }, { drapeau: 'transcendance', absent: true }] },
    texte: 'Les barreaux de la cage sont toujours là. Ils ne servent plus à grand-chose. {biju} s’allonge en face de toi, la tête sur ses pattes. « Ouvre-la, si tu veux. Je ne partirai pas. »',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Ouvrir la cage',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { controleEmotionnel: 3, charisme: 1 },
          maitrises: { chakra_biju: 2 },
          succes: { texte: 'Tu ouvres la cage. Elle ne bouge pas. Puis elle pose sa patte contre ta main. Vous ne faites plus qu’un, sans que personne n’ait à disparaître.', effets: [{ drapeau: 'transcendance' }, { entrainer: 'chakra_biju', jours: 120, mentor: true }, { stat: 'jauges.chakraMax', delta: 30 }, { journal: 'Toi et {biju}, en harmonie.', importance: 3 }] },
          echec: { texte: 'Ta main tremble sur la serrure. Tu n’es pas prêt·e. Elle le sait, et ne t’en veut pas.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }] },
        },
      },
    ],
  },

  // ── La perte d'un proche ──
  {
    ...base,
    id: 'x_mort_proche',
    titre: 'La nouvelle',
    categorie: 'deuil',
    lieu: '$village',
    enchaine: true,
    planifieParMoteur: true,
    repetable: { delaiJours: 0 },
    si: { tout: [LIBRE, { drapeau: 'mort_recente' }] },
    texte: [
      { texte: 'On te l’annonce sans détour, comme on annonce ces choses entre ninjas : {mortRecente} est mort{mortRecente_e}. {mortRecenteCause}.' },
      { texte: 'Tu restes debout. Tu as appris à rester debout. C’est après que ça vient.' },
    ],
    choix: [
      {
        id: 'funerailles',
        texte: 'Être là aux funérailles, jusqu’au bout',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { compassion: 3 } }, CHOC_UCHIHA, { drapeau: 'mort_recente', retirer: true }],
        resultat: 'Tu poses l’encens. Tu restes quand tous les autres sont partis. Le ciel ne fait rien de particulier, et c’est presque une insulte.',
      },
      {
        id: 'entrainement',
        texte: 'Ne rien montrer, et t’entraîner jusqu’à tomber',
        effets: [{ entrainer: 'taijutsu', jours: 60 }, { stat: 'jauges.fatigue', delta: 30 }, { stat: 'attributs.controleEmotionnel', delta: -2 }, CHOC_UCHIHA, { drapeau: 'mort_recente', retirer: true }],
        resultat: 'Tu frappes le poteau jusqu’à ce que tes mains saignent. Puis le lendemain. Puis le surlendemain. Ça ne change rien. Ça occupe les mains.',
      },
      {
        id: 'promesse',
        texte: 'Lui faire une promesse sur sa tombe',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'promesse_mort', incr: 1 }, CHOC_UCHIHA, { drapeau: 'mort_recente', retirer: true }],
        resultat: 'Tu ne la dis pas à voix haute. Tu sais qu’elle compte. Tu sais aussi qu’un jour, elle te coûtera quelque chose.',
      },
    ],
  },
];
