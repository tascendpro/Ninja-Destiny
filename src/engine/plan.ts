// Le plan de progression : le joueur dit une fois ce qu'il veut faire de ses points, et chaque anniversaire
// propose une répartition qui le suit. Calcul pur, sans hasard : il ne touche jamais au rejeu.
// Le plan n'est pas une décision de jeu ; seule la validation (action « points ») en est une.

import type { AttributId, GameState } from './types';
import { ATTRIBUTS } from './types';
import { coutPoint, coutRepartition } from './progression';

export type Repartition = Partial<Record<AttributId, number>>;

export type Plan =
  /** Monter les aptitudes dans l'ordre, sans laisser la première distancer la suivante de plus de 10. */
  | { mode: 'priorites'; ordre: AttributId[] }
  /** Viser des valeurs : l'aptitude la plus loin de sa cible (en proportion) passe d'abord. */
  | { mode: 'cibles'; cibles: Partial<Record<AttributId, number>> }
  /** Garder les proportions d'une répartition (« comme l'an dernier »). */
  | { mode: 'proportions'; poids: Partial<Record<AttributId, number>> };

const ECART_MAX = 10;

/** Propose une répartition qui suit le plan, respecte le coût croissant (1, 2, 3) et ne dépasse jamais 100. */
export function proposer(s: Pick<GameState, 'attributs' | 'pointsStat'>, plan: Plan, budget = s.pointsStat): Repartition {
  const rep: Repartition = {};
  const val = (a: AttributId) => s.attributs[a] + (rep[a] ?? 0);
  const peut = (a: AttributId) => val(a) < 100 && coutPoint(val(a)) <= budget;
  // Garde-fou : chaque tour dépense au moins un point, ou s'arrête.
  for (let garde = 0; budget > 0 && garde < 1000; garde++) {
    const a = suivant(plan, val, peut, (x) => rep[x] ?? 0);
    if (!a) break;
    budget -= coutPoint(val(a));
    rep[a] = (rep[a] ?? 0) + 1;
  }
  return rep;
}

function suivant(plan: Plan, val: (a: AttributId) => number, peut: (a: AttributId) => boolean, ajoute: (a: AttributId) => number): AttributId | undefined {
  if (plan.mode === 'priorites') {
    const ordre = plan.ordre.filter((a) => ATTRIBUTS.includes(a));
    for (let i = 0; i < ordre.length; i++) {
      const a = ordre[i];
      if (!peut(a)) continue;
      // Le suivant encore possible : s'il est trop loin derrière, c'est lui qui passe.
      const b = ordre.slice(i + 1).find(peut);
      if (b && val(a) - val(b) >= ECART_MAX) continue;
      return a;
    }
    return ordre.find(peut);
  }
  if (plan.mode === 'cibles') {
    const cible = (a: AttributId) => Math.min(100, plan.cibles[a] ?? 0);
    return ATTRIBUTS.filter((a) => peut(a) && cible(a) > val(a)).sort((x, y) => val(x) / cible(x) - val(y) / cible(y) || ATTRIBUTS.indexOf(x) - ATTRIBUTS.indexOf(y))[0];
  }
  // Proportions : l'aptitude qui a reçu le moins de points par rapport à son poids.
  const poids = (a: AttributId) => Math.max(0, plan.poids[a] ?? 0);
  return ATTRIBUTS.filter((a) => peut(a) && poids(a) > 0).sort((x, y) => (ajoute(x) + 1) / poids(x) - (ajoute(y) + 1) / poids(y) || poids(y) - poids(x) || ATTRIBUTS.indexOf(x) - ATTRIBUTS.indexOf(y))[0];
}

/** La dernière répartition validée, lue dans l'historique des décisions. */
export function derniereRepartition(s: Pick<GameState, 'actions'>): Repartition | undefined {
  for (let i = s.actions.length - 1; i >= 0; i--) {
    const a = s.actions[i];
    if (a.a === 'points') return a.repartition;
  }
  return undefined;
}

/**
 * « Comme l'an dernier » : les mêmes proportions, rapportées au budget d'aujourd'hui.
 * Les poids sont les points ajoutés l'an dernier, pas les valeurs : on rejoue l'intention, pas le résultat.
 */
export function commeLaDerniereFois(s: Pick<GameState, 'attributs' | 'pointsStat' | 'actions'>): Repartition | undefined {
  const d = derniereRepartition(s);
  if (!d || !Object.values(d).some((n) => (n ?? 0) > 0)) return undefined;
  return proposer(s, { mode: 'proportions', poids: d });
}

/** Les attributs une fois la répartition appliquée (sans toucher à l'état). */
export function avec(attributs: Record<AttributId, number>, rep: Repartition): Record<AttributId, number> {
  const r = { ...attributs };
  for (const [a, n] of Object.entries(rep) as [AttributId, number][]) r[a] += n ?? 0;
  return r;
}

/**
 * Un brouillon gardé d'avant peut ne plus tenir (points dépensés ailleurs, aptitude montée entre-temps) :
 * on le réduit de la fin vers le début jusqu'à ce qu'il tienne. Rend le brouillon ajusté et s'il a fallu couper.
 */
export function ajusterBrouillon(s: Pick<GameState, 'attributs' | 'pointsStat'>, b: Repartition): { brouillon: Repartition; coupe: boolean } {
  const r: Repartition = {};
  for (const a of ATTRIBUTS) {
    const n = Math.max(0, Math.floor(b[a] ?? 0));
    if (n > 0) r[a] = Math.min(n, 100 - s.attributs[a]);
  }
  let coupe = ATTRIBUTS.some((a) => (r[a] ?? 0) !== Math.max(0, Math.floor(b[a] ?? 0)));
  const ordre = [...ATTRIBUTS].reverse();
  while (coutRepartition(s as GameState, r) > s.pointsStat) {
    const a = ordre.find((x) => (r[x] ?? 0) > 0);
    if (!a) break;
    r[a]! -= 1;
    if (r[a] === 0) delete r[a];
    coupe = true;
  }
  for (const a of ATTRIBUTS) if (r[a] === 0) delete r[a];
  return { brouillon: r, coupe };
}

/** Un plan qui ne demande rien. */
export function planVide(p: Plan | undefined): boolean {
  if (!p) return true;
  if (p.mode === 'priorites') return p.ordre.length === 0;
  if (p.mode === 'cibles') return !Object.values(p.cibles).some((v) => (v ?? 0) > 0);
  return !Object.values(p.poids).some((v) => (v ?? 0) > 0);
}
