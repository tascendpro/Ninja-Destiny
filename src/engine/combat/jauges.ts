// Le terrain qui se souvient (§5.1) : ce qui se passe pendant le combat s'accumule. Les explosions et les techniques
// de zone fragilisent le lieu, le feu sèche et allume les herbes, l'eau fait monter la rivière, et le vacarme attire
// du monde. Les événements lisent ces jauges : un plafond ne cède jamais sans raison.

import type { GameState } from '../types';
import type { ElementId } from '../types';
import type { Terrain } from '../../content/combat/impacts';
import type { EtatAffrontement } from './types';
import { terrainCourant } from './impacts';

export interface JaugesTerrain {
  /** 0–100 : monte avec les explosions, les zones et les impacts lourds ; ne redescend pas. */
  instabilite: number;
  /** 0–100 : monte avec le feu sur un terrain sec et boisé. */
  incendie: number;
  /** 0–100 : monte avec l'eau, près d'une rivière ou de la mer. */
  crue: number;
  /** 0–100 : le vacarme ; il attire les renforts et l'ANBU. */
  bruit: number;
}

/** Les lieux fermés s'effondrent vite ; les lieux boisés brûlent ; les bords de l'eau débordent ; les villages entendent. */
const FERME: Terrain[] = ['interieur', 'temple', 'ruines', 'forge'];
const FRAGILE: Terrain[] = ['montagne', 'roche'];
const BOISE: Partial<Record<Terrain, number>> = { foret: 1.5, plaine: 1.2, route: 1, cour: 0.6, rue: 0.6, marche: 0.8, porte: 0.5, temple: 0.6, interieur: 0.5, forge: 0.4 };
const EAU: Partial<Record<Terrain, number>> = { cotes: 1.2, quai: 1.2, foret: 0.5, plaine: 0.4 };
export const HABITE: Terrain[] = ['rue', 'marche', 'cour', 'porte', 'quai'];

export function jaugesInitiales(s: GameState): JaugesTerrain {
  const t = terrainCourant(s);
  return { instabilite: FERME.includes(t) ? 10 : FRAGILE.includes(t) ? 15 : 0, incendie: t === 'desert' ? 10 : 0, crue: EAU[t] ? 15 : 0, bruit: HABITE.includes(t) ? 15 : 0 };
}

const borne = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

/** Ce qu'une action laisse dans le lieu : sa nature, sa portée, son poids. */
export function nourrirJauges(s: GameState, sc: EtatAffrontement, o: { nature?: ElementId; portee?: 'cible' | 'zone' | 'large'; explosif?: boolean; lourd?: boolean; technique?: boolean }): void {
  const j = (sc.jauges ??= jaugesInitiales(s));
  const t = terrainCourant(s);
  const fragile = FERME.includes(t) ? 2 : FRAGILE.includes(t) ? 1.5 : 0.6;
  let inst = 0;
  if (o.portee === 'zone') inst += 8;
  if (o.portee === 'large') inst += 14;
  if (o.explosif) inst += 20;
  if (o.lourd) inst += 6;
  if (o.nature === 'doton') inst += 6;
  j.instabilite = borne(j.instabilite + inst * fragile);
  if (o.nature === 'katon') j.incendie = borne(j.incendie + 14 * (BOISE[t] ?? 0.3) * (o.portee && o.portee !== 'cible' ? 1.4 : 1));
  if (o.nature === 'suiton') j.crue = borne(j.crue + 14 * (EAU[t] ?? 0) * (o.portee && o.portee !== 'cible' ? 1.4 : 1));
  j.bruit = borne(j.bruit + 5 + (o.technique ? 4 : 0) + (o.portee === 'zone' ? 8 : o.portee === 'large' ? 14 : 0) + (o.explosif ? 25 : 0) + (o.nature === 'raiton' || o.nature === 'katon' ? 4 : 0));
}

/** Fin de manche : le bruit retombe un peu, le feu s'éteint s'il n'est plus nourri. */
export function apaiserJauges(sc: EtatAffrontement): void {
  const j = sc.jauges;
  if (!j) return;
  j.bruit = borne(j.bruit - 4);
  if ((sc.terrain?.brulant ?? 0) <= 0) j.incendie = borne(j.incendie - 3);
}

/** Ce que le joueur perçoit du lieu : un avertissement, et un choix tactique (le provoquer exprès). */
export function avertissements(s: GameState, sc: EtatAffrontement): string[] {
  const j = sc.jauges;
  if (!j) return [];
  const t = terrainCourant(s);
  const v: string[] = [];
  if (j.instabilite >= 45) v.push(FERME.includes(t) ? 'Le plafond gronde à chaque impact. Encore quelques coups, et il cédera.' : 'Le sol craque sous vos pas : le terrain ne tiendra plus longtemps.');
  if (j.incendie >= 40) v.push('Les herbes sèches fument : le feu cherche à prendre.');
  if (j.crue >= 40) v.push('L’eau gonfle et lèche la berge : elle va déborder.');
  if (j.bruit >= 55 && HABITE.includes(t)) v.push('Le vacarme résonne dans les rues : quelqu’un va finir par venir voir.');
  return v;
}
