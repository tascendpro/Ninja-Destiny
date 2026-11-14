// Les enchaînements de gestes : ce que tu as fait aux manches précédentes prépare ce que tu fais maintenant.
// Ils s'ajoutent aux enchaînements de natures (synergies.ts), qui ne regardent que les éléments. Ici, c'est la tactique :
// observer avant de frapper, provoquer pour ouvrir une garde, balayer avant d'écraser, faire trois coups différents d'affilée.
// Jetons du récit : {nom}, {Il}/{il}, {lui}, {e} (l'adversaire).

import type { Famille } from '../../engine/combat/types';

export interface PasGeste {
  famille?: Famille | Famille[];
  /** L'action exacte (ou l'une d'elles). */
  choix?: string | string[];
  /** Un morceau de l'identifiant de l'action (« bunshin »). */
  contient?: string;
}

export interface GesteDef {
  id: string;
  nom: string;
  kanji: string;
  /** Les manches qui précèdent, dans l'ordre ; la dernière est celle d'avant. */
  avant: PasGeste[];
  /** L'action de cette manche. */
  maintenant: PasGeste;
  /** Les gestes d'avant doivent tous être différents (la rafale). */
  differents?: boolean;
  /** Il faut une ouverture gagnée (esquive, parade réussie). */
  ouverture?: boolean;
  /** Il faut que la provocation ait pris. */
  provoque?: boolean;
  puissance: number;
  /** Il lit moins bien le coup (soustrait à sa chance de prédire). */
  surprise: number;
  effet?: 'perce' | 'sonne' | 'desequilibre';
  /** Chakra repris (le souffle retenu). */
  chakra?: number;
  detail: string;
  recits: string[];
}

const OFFENSIF: PasGeste = { famille: ['taijutsu', 'arme', 'ninjutsu'] };
const CORPS: PasGeste = { famille: ['taijutsu', 'arme'] };

export const GESTES: GesteDef[] = [
  {
    id: 'coup_lu',
    nom: 'Le coup lu',
    kanji: '観',
    avant: [{ famille: 'observation' }],
    maintenant: OFFENSIF,
    puissance: 10,
    surprise: 0.2,
    detail: 'Observer, puis frapper là où sa garde a bougé.',
    recits: [
      'Tu l’as regardé{e} assez longtemps : ton coup part exactement là où sa garde vient de glisser.',
      'Une manche à l’observer, et tu as vu le pli : ton geste entre dans l’espace qu’{il} laisse toujours ouvert.',
    ],
  },
  {
    id: 'contre',
    nom: 'Le contre',
    kanji: '返',
    avant: [{ famille: 'defense', choix: ['esquive', 'permutation'] }],
    maintenant: CORPS,
    ouverture: true,
    puissance: 14,
    surprise: 0.15,
    effet: 'perce',
    detail: 'Esquiver ou permuter, puis frapper dans l’ouverture.',
    recits: [
      'Son coup passe à côté, et son corps est encore lancé : tu frappes dans le vide qu’{il} laisse derrière {lui}.',
      'Tu reviens de ta permutation déjà en mouvement : {il} se retourne trop tard.',
    ],
  },
  {
    id: 'rafale',
    nom: 'La rafale',
    kanji: '連',
    avant: [{ famille: 'taijutsu' }, { famille: 'taijutsu' }],
    maintenant: { famille: 'taijutsu' },
    differents: true,
    puissance: 16,
    surprise: 0.1,
    effet: 'sonne',
    detail: 'Trois gestes de taijutsu différents, sans reprendre ton souffle.',
    recits: [
      'Le troisième coup arrive avant que le deuxième ait fini de résonner : {il} ne sait plus lequel parer.',
      'Tu enchaînes sans t’arrêter, un coup, un autre, un autre encore, et sa garde finit par se défaire.',
    ],
  },
  {
    id: 'sol_poing',
    nom: 'Le sol, puis le poing',
    kanji: '崩',
    avant: [{ choix: 'balayage' }],
    maintenant: { choix: ['coup_puissant', 'taille_lourde'] },
    puissance: 16,
    surprise: 0.1,
    effet: 'desequilibre',
    detail: 'Balayer ses appuis, puis frapper de tout ton poids pendant qu’{il} se rattrape.',
    recits: [
      '{Il} cherche encore ses appuis quand ton coup lourd arrive : {il} n’a rien pour l’encaisser.',
      'Tu l’as fait vaciller ; tu ne lui laisses pas le temps de se redresser.',
    ],
  },
  {
    id: 'feinte_lames',
    nom: 'La feinte des lames',
    kanji: '惑',
    avant: [{ choix: 'lancer' }],
    maintenant: { famille: ['taijutsu', 'arme'], choix: ['frappe_rapide', 'coup_puissant', 'balayage', 'coupe', 'estoc', 'taille_lourde', 'degaine'] },
    puissance: 8,
    surprise: 0.2,
    effet: 'perce',
    detail: 'Une volée de lames pour occuper ses mains, et tu es déjà au corps à corps.',
    recits: [
      'Ses mains sont encore occupées à dévier tes lames quand tu arrives au corps à corps.',
      'Les kunai n’étaient qu’un rideau : derrière, c’est toi qui arrives.',
    ],
  },
  {
    id: 'fil_lame',
    nom: 'Le fil de la lame',
    kanji: '刃',
    avant: [{ choix: 'estoc' }],
    maintenant: { choix: ['coupe', 'taille_lourde', 'degaine'] },
    puissance: 10,
    surprise: 0.1,
    detail: 'L’estoc pour l’écarter, la coupe dans le même mouvement.',
    recits: ['Ta pointe l’a fait reculer d’un pas ; le tranchant suit le même chemin, sans rupture.'],
  },
  {
    id: 'colere',
    nom: 'La colère payée',
    kanji: '怒',
    avant: [{ choix: 'provoquer' }],
    maintenant: OFFENSIF,
    provoque: true,
    puissance: 12,
    surprise: 0.2,
    effet: 'perce',
    detail: 'Le provoquer, et frapper pendant qu’{il} fonce sans réfléchir.',
    recits: [
      '{Il} fonce sur toi, rouge de colère, la garde oubliée : tu n’as qu’à frapper.',
      'Ta provocation a porté : {il} attaque trop large, et tu passes dessous.',
    ],
  },
  {
    id: 'doute',
    nom: 'Le doute',
    kanji: '疑',
    avant: [{ choix: ['mentir', 'destabiliser'] }],
    maintenant: OFFENSIF,
    puissance: 8,
    surprise: 0.25,
    detail: 'Semer un doute, et frapper pendant qu’{il} y pense.',
    recits: ['Ses yeux filent une demi-seconde vers les arbres, à la recherche de tes renforts : c’est la demi-seconde qu’il te fallait.'],
  },
  {
    id: 'ombre_corps',
    nom: 'L’ombre et le corps',
    kanji: '影',
    avant: [{ contient: 'bunshin' }],
    maintenant: CORPS,
    puissance: 10,
    surprise: 0.6,
    detail: 'Tes clones l’occupent ; le vrai frappe par le côté.',
    recits: ['{Il} frappe un clone, puis un autre ; le troisième était toi.', 'Tes clones se jettent sur {lui} de face. Toi, tu arrives de côté.'],
  },
  {
    id: 'souffle_retenu',
    nom: 'Le souffle retenu',
    kanji: '息',
    avant: [{ choix: 'garde' }, { choix: 'garde' }],
    maintenant: { famille: 'ninjutsu' },
    puissance: 18,
    surprise: 0.05,
    chakra: 12,
    detail: 'Deux manches à encaisser en rassemblant ton chakra, puis tout lâcher.',
    recits: ['Deux manches à encaisser sans rien rendre ; tout ce chakra rassemblé part d’un coup, bien plus fort que tes signes ne le promettaient.'],
  },
  {
    id: 'lecture_double',
    nom: 'La lecture profonde',
    kanji: '識',
    avant: [{ famille: 'observation' }, { famille: 'observation' }],
    maintenant: OFFENSIF,
    puissance: 18,
    surprise: 0.35,
    detail: 'Deux manches à l’étudier : tu connais son prochain geste avant {lui}.',
    recits: ['Tu l’as étudié{e} si longtemps que tu frappes avant même qu’{il} ait décidé de bouger.'],
  },
];
