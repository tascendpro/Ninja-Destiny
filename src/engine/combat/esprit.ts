// L'esprit de l'adversaire : son moral (§4.3) et ce qu'il comprend de toi (§3.1).
// Le moral bouge avec ce qui arrive (un coup lourd, une provocation, une menace) et règle son comportement.
// L'analyse dépend de son rang : un genin comprend une chose à la fois, et se trompe ; un Kage lit tout, vite.

import type { EtatAffrontement, NiveauAdv, Temperament } from './types';

export interface Moral {
  /** 0 à 100. */
  peur: number;
  colere: number;
  concentration: number;
  determination: number;
}

/** Le moral de départ, selon la personnalité. */
export const MORAL_INITIAL: Record<Temperament, Moral> = {
  prudent: { peur: 15, colere: 5, concentration: 70, determination: 50 },
  feroce: { peur: 5, colere: 45, concentration: 45, determination: 70 },
  joueur: { peur: 10, colere: 10, concentration: 55, determination: 45 },
  froid: { peur: 5, colere: 0, concentration: 85, determination: 65 },
  desespere: { peur: 45, colere: 30, concentration: 35, determination: 75 },
  fier: { peur: 5, colere: 20, concentration: 55, determination: 60 },
  sadique: { peur: 10, colere: 15, concentration: 60, determination: 55 },
  honorable: { peur: 5, colere: 5, concentration: 70, determination: 70 },
  fanatique: { peur: 0, colere: 35, concentration: 60, determination: 95 },
  terrifie: { peur: 70, colere: 5, concentration: 30, determination: 20 },
  veteran: { peur: 5, colere: 0, concentration: 80, determination: 45 },
};

const borne = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

/** Ce qui arrive bouge le moral ; le fanatique n'a pas peur, le froid ne se met pas en colère. */
export function bougerMoral(sc: EtatAffrontement, d: Partial<Moral>): void {
  const m = (sc.adv.moral ??= { ...MORAL_INITIAL[sc.temperament] });
  const t = sc.temperament;
  if (d.peur) m.peur = borne(m.peur + d.peur * (t === 'fanatique' ? 0 : t === 'froid' || t === 'veteran' ? 0.5 : t === 'terrifie' ? 1.5 : 1));
  if (d.colere) m.colere = borne(m.colere + d.colere * (t === 'froid' ? 0.2 : t === 'veteran' ? 0.4 : t === 'feroce' || t === 'fier' ? 1.3 : 1));
  if (d.concentration) m.concentration = borne(m.concentration + d.concentration * (t === 'froid' ? 0.5 : 1));
  if (d.determination) m.determination = borne(m.determination + d.determination * (t === 'fanatique' ? 0.3 : 1));
}

export const moralDe = (sc: EtatAffrontement): Moral => sc.adv.moral ?? MORAL_INITIAL[sc.temperament];

/** Ce que son moral change à son jeu : force, justesse, envie de partir. */
export function effetsMoral(sc: EtatAffrontement): { puissance: number; execAdv: number; lecture: number; fuite: number; reddition: number } {
  const m = moralDe(sc);
  return {
    puissance: 1 + (m.colere > 60 ? 0.15 : 0) - (m.peur > 60 ? 0.15 : 0),
    execAdv: (m.concentration - 50) / 500 - (m.colere > 70 ? 0.05 : 0),
    lecture: (m.concentration - 50) / 400 - (m.colere > 60 ? 0.1 : 0),
    fuite: m.peur > 60 ? (m.peur - 60) * 1.5 : 0,
    reddition: m.peur > 70 && m.determination < 60 ? (m.peur - 70) * 1.5 : 0,
  };
}

/** Un mot pour l'écran : ce qu'on lit sur son visage (jamais un chiffre). */
export function visageDe(sc: EtatAffrontement): string | undefined {
  const m = moralDe(sc);
  if (m.peur >= 70) return 'il a peur';
  if (m.colere >= 70) return 'furieux';
  if (m.concentration <= 25) return 'déconcentré';
  if (m.determination >= 90 && sc.adv.endurance / sc.adv.enduranceMax < 0.3) return 'ne lâchera pas';
  return undefined;
}

// ── L'analyse ────────────────────────────────────────────────

const BASE_ANALYSE: Record<NiveauAdv, number> = { enfant: 0.2, eleve: 0.3, genin: 0.4, chunin: 0.55, jonin: 0.7, elite: 0.8, kage: 0.9, biju: 0.3 };
const SIMULTANE: Record<NiveauAdv, number> = { enfant: 1, eleve: 1, genin: 1, chunin: 2, jonin: 3, elite: 3, kage: 4, biju: 1 };

/** Capacité d'analyse : vitesse de compréhension, combien de choses à la fois, chance de se tromper. */
export function capaciteAnalyse(niveau: NiveauAdv, perception: number): { vitesse: number; simultane: number; erreur: number } {
  const base = BASE_ANALYSE[niveau];
  return {
    vitesse: Math.min(0.95, base * 0.7 + (perception / 100) * 0.3),
    simultane: SIMULTANE[niveau],
    erreur: Math.max(0.03, 0.35 - base * 0.35),
  };
}

/**
 * Il vient de voir une de tes actions. Avec deux tirages (comprendre, se tromper), il peut la comprendre,
 * la mal interpréter, ou rien. Un esprit déjà saturé ne retient plus rien de neuf.
 */
export function observerAction(sc: EtatAffrontement, cle: string, vu: number, facilite: number, cap: ReturnType<typeof capaciteAnalyse>, r1: number, r2: number): 'comprise' | 'erronee' | undefined {
  const deja = sc.comprises ?? {};
  if (deja[cle]) return undefined;
  if (Object.keys(deja).length >= cap.simultane * 3) return undefined;
  const p = cap.vitesse * facilite * Math.min(1, vu / 2) * (1 + (moralDe(sc).concentration - 50) / 200);
  if (r1 >= p) return undefined;
  const v = r2 < cap.erreur ? 'erronee' : 'comprise';
  sc.comprises = { ...deja, [cle]: v };
  return v;
}
