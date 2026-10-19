// L'échoppe : quelques objets simples qui donnent un sens aux ryō et du relief aux combats.
// On les achète au temps libre (instantané), on les utilise pendant une manche de combat.

import type { GameState } from './types';
import { Ctx, clamp } from './etat';

export interface ConsommableDef {
  id: string;
  nom: string;
  prix: number;
  /** Ce que l'objet fait, en une ligne, pour l'échoppe et le bouton de combat. */
  effet: string;
  /** Bonus ajouté au test de la manche où on l'utilise. */
  bonus: number;
  /** Une riposte devient une esquive (fumigène). */
  protege?: boolean;
  chakra?: number;
  sante?: number;
  recit: string;
}

export const STOCK_MAX = 5;

export const CONSOMMABLES: ConsommableDef[] = [
  {
    id: 'pilule_soldat',
    nom: 'Pilule du soldat',
    prix: 45,
    effet: '+25 chakra, et ta manche frappe plus fort.',
    bonus: 10,
    chakra: 25,
    recit: 'Tu croques une pilule du soldat. Un goût de fer, puis une chaleur qui monte dans les bras.',
  },
  {
    id: 'pilule_sang',
    nom: 'Pilule de sang',
    prix: 50,
    effet: '+30 santé au milieu du combat.',
    bonus: 0,
    sante: 30,
    recit: 'Tu avales une pilule de sang. Le vertige recule, tes jambes te portent de nouveau.',
  },
  {
    id: 'parchemin_explosif',
    nom: 'Parchemin explosif',
    prix: 30,
    effet: 'Une explosion qui ouvre la garde : bonus important sur une manche.',
    bonus: 18,
    recit: 'Tu plantes un parchemin explosif à ses pieds. La déflagration lui arrache sa garde.',
  },
  {
    id: 'fumigene',
    nom: 'Bombe fumigène',
    prix: 20,
    effet: 'Si l’adversaire riposte cette manche, la fumée te sauve : il frappe dans le vide.',
    bonus: 4,
    protege: true,
    recit: 'Tu brises une bombe fumigène. Le monde devient gris.',
  },
];

export const CONSOMMABLE: Record<string, ConsommableDef> = Object.fromEntries(CONSOMMABLES.map((c) => [c.id, c]));

export function stock(s: GameState, id: string): number {
  return s.consommables?.[id] ?? 0;
}

export function acheterConsommable(s: GameState, id: string, ctx: Ctx): void {
  const c = CONSOMMABLE[id];
  if (!c) throw new Error('Objet inconnu.');
  if (s.jauges.ryo < c.prix) throw new Error('Pas assez de ryō.');
  if (stock(s, id) >= STOCK_MAX) throw new Error('Ta sacoche est pleine.');
  s.jauges.ryo -= c.prix;
  s.consommables[id] = stock(s, id) + 1;
  ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: -c.prix });
}

/** Utilise un objet pendant une manche : effets immédiats, et le bonus à ajouter au test. */
export function utiliserConsommable(s: GameState, id: string, ctx: Ctx): ConsommableDef {
  const c = CONSOMMABLE[id];
  if (!c || stock(s, id) < 1) throw new Error('Tu n’en as plus.');
  s.consommables[id] = stock(s, id) - 1;
  if (c.chakra) {
    s.jauges.chakra = clamp(s.jauges.chakra + c.chakra, 0, s.jauges.chakraMax);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: c.chakra });
  }
  if (c.sante) {
    s.jauges.sante = clamp(s.jauges.sante + c.sante, 0, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: c.sante });
  }
  return c;
}
