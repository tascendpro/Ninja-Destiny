import type { GameState } from './types';

/** Générateur déterministe (mulberry32). L'état est stocké dans la partie : une sauvegarde peut être rejouée à l'identique. */
export function suivant(etat: number): { valeur: number; etat: number } {
  const t = (etat + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return { valeur: ((r ^ (r >>> 14)) >>> 0) / 4294967296, etat: t };
}

export function alea(state: GameState): number {
  const { valeur, etat } = suivant(state.rngState);
  state.rngState = etat;
  return valeur;
}

export function aleaEntier(state: GameState, min: number, max: number): number {
  return min + Math.floor(alea(state) * (max - min + 1));
}

export function tirerPondere<T>(state: GameState, items: { item: T; poids: number }[]): T | undefined {
  const total = items.reduce((s, i) => s + Math.max(0, i.poids), 0);
  if (total <= 0) return undefined;
  let r = alea(state) * total;
  for (const i of items) {
    r -= Math.max(0, i.poids);
    if (r < 0) return i.item;
  }
  return items[items.length - 1]?.item;
}

export function graineDepuisTexte(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Hachage FNV-1a d'une chaîne, renvoyé en hexadécimal. */
export function hacher(texte: string): string {
  return graineDepuisTexte(texte).toString(16).padStart(8, '0');
}
