// Contextes et niveaux : les règles fixées avant la première manche (§6, §8.2, §14, §15).

import type { GameState } from '../types';
import { age } from '../calendrier';
import { rangIndex } from '../etat';
import type { ContexteId, Famille, NiveauAdv, StatsAdv } from './types';
import { NIVEAUX } from './types';

export interface RegleContexte {
  libelle: string;
  kanji: string;
  /** Un coup peut-il tuer le joueur (toujours après un avertissement) ? */
  letal: boolean;
  /** La fuite est-elle permise, et ce qu'elle coûte en réputation. */
  fuite: boolean;
  coutFuite: number;
  /** La Parole peut-elle mettre fin au combat ? */
  paix: boolean;
  /** Le nombre de manches est annoncé (un arbitre, un instructeur). */
  plafondAnnonce: boolean;
  /** Les blessures du joueur restent légères. */
  blessuresLegeres: boolean;
}

export const CONTEXTES: Record<ContexteId, RegleContexte> = {
  bagarre: { libelle: 'Bagarre', kanji: '喧', letal: false, fuite: true, coutFuite: 0, paix: true, plafondAnnonce: false, blessuresLegeres: true },
  entrainement: { libelle: 'Entraînement', kanji: '練', letal: false, fuite: false, coutFuite: 0, paix: true, plafondAnnonce: true, blessuresLegeres: true },
  provocation: { libelle: 'Provocation', kanji: '挑', letal: false, fuite: true, coutFuite: 2, paix: true, plafondAnnonce: false, blessuresLegeres: true },
  duel: { libelle: 'Duel', kanji: '決', letal: false, fuite: true, coutFuite: 4, paix: true, plafondAnnonce: false, blessuresLegeres: false },
  examen: { libelle: 'Examen', kanji: '試', letal: false, fuite: true, coutFuite: 3, paix: false, plafondAnnonce: true, blessuresLegeres: false },
  mission: { libelle: 'Mission', kanji: '任', letal: true, fuite: true, coutFuite: 1, paix: true, plafondAnnonce: false, blessuresLegeres: false },
  embuscade: { libelle: 'Embuscade', kanji: '伏', letal: true, fuite: true, coutFuite: 0, paix: false, plafondAnnonce: false, blessuresLegeres: false },
  combat_a_mort: { libelle: 'Combat à mort', kanji: '死', letal: true, fuite: true, coutFuite: 5, paix: true, plafondAnnonce: false, blessuresLegeres: false },
  capture: { libelle: 'Capture', kanji: '捕', letal: false, fuite: true, coutFuite: 1, paix: true, plafondAnnonce: false, blessuresLegeres: false },
};

/**
 * Gabarits par niveau. Note d'équilibrage : les valeurs d'endurance du §8.2 sont multipliées par environ 1,6,
 * parce que l'endurance du joueur (§5.1) part de la santé (0-100) et dépasse largement celle du tableau.
 * L'attaque de base se place entre la frappe rapide et le coup puissant d'un joueur du même niveau.
 * Mesuré par simulation (tests/affrontement.test.ts) : un combat à niveau égal se gagne environ une fois sur deux.
 */
export const GABARITS: Record<NiveauAdv, StatsAdv> = {
  enfant: { endurance: 40, chakra: 10, vitesse: 32, perception: 30, discretion: 25, force: 30, controle: 25, volonte: 25, substitutions: 0, defense: 12, attaque: 9 },
  eleve: { endurance: 52, chakra: 25, vitesse: 40, perception: 40, discretion: 35, force: 36, controle: 35, volonte: 35, substitutions: 1, defense: 15, attaque: 11 },
  genin: { endurance: 70, chakra: 40, vitesse: 50, perception: 50, discretion: 45, force: 42, controle: 45, volonte: 45, substitutions: 2, defense: 19, attaque: 14 },
  chunin: { endurance: 95, chakra: 60, vitesse: 60, perception: 60, discretion: 55, force: 50, controle: 55, volonte: 55, substitutions: 3, defense: 24, attaque: 18 },
  jonin: { endurance: 125, chakra: 85, vitesse: 70, perception: 70, discretion: 65, force: 60, controle: 65, volonte: 65, substitutions: 4, defense: 30, attaque: 23 },
  elite: { endurance: 155, chakra: 110, vitesse: 80, perception: 80, discretion: 75, force: 68, controle: 75, volonte: 75, substitutions: 4, defense: 36, attaque: 28 },
  kage: { endurance: 200, chakra: 160, vitesse: 88, perception: 88, discretion: 85, force: 78, controle: 85, volonte: 85, substitutions: 5, defense: 44, attaque: 34 },
  biju: { endurance: 280, chakra: 999, vitesse: 70, perception: 70, discretion: 40, force: 90, controle: 60, volonte: 90, substitutions: 0, defense: 50, attaque: 42 },
};

export const LIBELLE_NIVEAU: Record<NiveauAdv, string> = {
  enfant: 'enfant',
  eleve: 'élève',
  genin: 'genin',
  chunin: 'chūnin',
  jonin: 'jōnin',
  elite: 'élite',
  kage: 'kage',
  biju: 'bijū',
};

/** Plafond de manches selon le niveau du plus fort (§6.2). */
const PLAFONDS: Record<NiveauAdv, [number, number]> = {
  enfant: [1, 2],
  eleve: [2, 2],
  genin: [2, 3],
  chunin: [3, 4],
  jonin: [4, 5],
  elite: [5, 6],
  kage: [6, 8],
  biju: [6, 8],
};

export const indexNiveau = (n: NiveauAdv) => NIVEAUX.indexOf(n);

/** Le niveau du joueur, déduit de son âge et de son rang. */
export function niveauJoueur(s: GameState): NiveauAdv {
  const a = age(s);
  if (a < 10) return 'enfant';
  const r = rangIndex(s.rang);
  if (r >= rangIndex('kage')) return 'kage';
  if (r >= rangIndex('jonin')) return a >= 30 ? 'elite' : 'jonin';
  if (r >= rangIndex('chunin')) return 'chunin';
  if (r >= rangIndex('genin')) return 'genin';
  return 'eleve';
}

/** Fourchette de plafond, ajustée par l'écart de niveau (§6.3). Le tirage se fait à l'ouverture. */
export function fourchettePlafond(joueur: NiveauAdv, adv: NiveauAdv): [number, number] {
  const fort = indexNiveau(joueur) >= indexNiveau(adv) ? joueur : adv;
  const [min, max] = PLAFONDS[fort];
  if (indexNiveau(joueur) - indexNiveau(adv) >= 2) return [Math.max(1, min - 1), Math.max(1, max - 1)];
  return [min, max];
}

/** Bonus de rang de l'endurance (§5.1). */
export function bonusRang(niveau: NiveauAdv): number {
  return { enfant: 0, eleve: 5, genin: 10, chunin: 18, jonin: 28, elite: 38, kage: 50, biju: 50 }[niveau];
}

/** Familles visibles selon l'âge (§3.2, §15) : 4 pour un enfant, 6 pour un genin. */
export function maxFamilles(s: GameState): number {
  const a = age(s);
  if (a < 10) return 4;
  return 9;
}

/** Ce qu'un enfant de 6 à 9 ans peut faire : se battre, se protéger, parler, partir. */
export const FAMILLES_ENFANT: Famille[] = ['taijutsu', 'defense', 'parole', 'fuite'];
