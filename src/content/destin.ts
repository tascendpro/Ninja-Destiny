import type { HeritageDef, SequenceDef } from '../engine/types';

// Héritages achetés à la boutique avec les ryō des vies précédentes (gardés le temps de l'onglet).
// Un seul par vie. Les prix suivent la valeur : plus l'avantage dure, plus il coûte.
export const HERITAGES: HeritageDef[] = [
  {
    id: 'bourse',
    nom: 'Bourse familiale',
    prix: 120,
    description: 'Tu commences avec 150 ryō de plus. De quoi t’offrir une vraie lame dès l’Académie.',
  },
  {
    id: 'corps',
    nom: 'Corps endurci',
    prix: 220,
    description: 'Force et agilité +6 dès la naissance. Ton corps encaisse mieux les premiers coups et le taijutsu vient plus vite.',
  },
  {
    id: 'esprit',
    nom: 'Esprit vif',
    prix: 320,
    description:
      'Intelligence +10. Si tu commences avec ça, tu apprendras les techniques 25 % plus vite, et un an plus tôt que les autres enfants.',
  },
  {
    id: 'reserve',
    nom: 'Réserve profonde',
    prix: 450,
    description: 'Chakra +25 et contrôle du chakra +6. Les techniques coûteuses deviennent accessibles plus jeune, et tu tiens plus longtemps en combat.',
  },
  {
    id: 'lame',
    nom: 'Lame de famille',
    prix: 600,
    description: 'Tu commences avec l’arme héritée de ton clan ou de ton village, déjà en main, et sa famille d’armes au palier 1.',
  },
  {
    id: 'mentor',
    nom: 'Mentor de l’ombre',
    prix: 900,
    description: 'Un ancien ninja veille sur toi de loin. Tout ton entraînement progresse 20 % plus vite, pendant toute ta vie.',
  },
];

// Séquences de vie : chacune se clôt par un bilan. L'ordre compte : on ouvre la première séquence
// non vécue dont la condition est remplie.
export const SEQUENCES: SequenceDef[] = [
  { id: 'enfance', titre: 'L’enfance', kanji: '幼', si: { tout: [{ ageDepart: 6 }, { nonVu: 'a_entree' }] }, fin: { un: [{ vu: 'a_entree' }, { age: { min: 7 } }] } },
  {
    id: 'academie',
    titre: 'Les premières années d’Académie',
    kanji: '学',
    si: { tout: [{ ageDepart: 6 }, { rang: 'eleve' }, { statut: 'actif' }, { age: { max: 8 } }] },
    fin: { un: [{ age: { min: 9 } }, { non: { statut: 'actif' } }] },
  },
  {
    id: 'academie_fin',
    titre: 'Les dernières années d’Académie',
    kanji: '試',
    si: { tout: [{ rang: 'eleve' }, { statut: 'actif' }] },
    fin: { un: [{ vu: 'a_bandeau' }, { non: { statut: 'actif' } }] },
  },
  {
    id: 'genin',
    titre: 'Genin',
    kanji: '忍',
    si: { tout: [{ rangMin: 'genin' }, { statut: 'actif' }] },
    fin: { un: [{ rangMin: 'chunin' }, { non: { statut: 'actif' } }] },
  },
  {
    id: 'chunin',
    titre: 'Chūnin',
    kanji: '中',
    si: { tout: [{ rangMin: 'chunin' }, { statut: 'actif' }] },
    fin: { un: [{ drapeau: 'chapitre2_fini' }, { rangMin: 'jonin' }, { non: { statut: 'actif' } }] },
  },
  {
    id: 'jonin',
    titre: 'Jōnin',
    kanji: '上',
    si: { tout: [{ rangMin: 'jonin' }, { statut: 'actif' }] },
    fin: { un: [{ drapeau: 'chapitre4_fini' }, { rangMin: 'kage' }, { non: { statut: 'actif' } }] },
  },
  {
    id: 'voie',
    titre: 'La voie',
    kanji: '道',
    si: { tout: [{ drapeau: 'chapitre4_fini' }, { drapeau: 'chapitre5_fini', absent: true }] },
    fin: { drapeau: 'chapitre5_fini' },
  },
  {
    id: 'heritage',
    titre: 'L’héritage',
    kanji: '継',
    si: { drapeau: 'chapitre5_fini' },
    fin: { vu: 'c5_crepuscule' },
  },
  {
    id: 'route',
    titre: 'Sur les routes',
    kanji: '道',
    si: { statut: ['errant', 'deserteur', 'exile'] },
    fin: { statut: 'actif' },
  },
];
