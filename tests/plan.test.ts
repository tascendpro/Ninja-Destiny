import { describe, expect, it } from 'vitest';
import { ajusterBrouillon, commeLaDerniereFois, proposer } from '../src/engine/plan';
import type { Plan } from '../src/engine/plan';
import { coutPoint, coutRepartition } from '../src/engine/progression';
import { ATTRIBUTS } from '../src/engine/types';
import type { AttributId, GameState } from '../src/engine/types';
import { nouvellePartie, repartir } from '../src/engine/moteur';
import { creation } from './aide';

const attributs = (v: Partial<Record<AttributId, number>> = {}) => Object.fromEntries(ATTRIBUTS.map((a) => [a, v[a] ?? 30])) as Record<AttributId, number>;
const etat = (pointsStat: number, v?: Partial<Record<AttributId, number>>) => ({ attributs: attributs(v), pointsStat, actions: [] }) as unknown as GameState;

const PLANS: Plan[] = [
  { mode: 'priorites', ordre: ['controleChakra', 'agilite', 'perception'] },
  { mode: 'priorites', ordre: ['force'] },
  { mode: 'cibles', cibles: { controleChakra: 90, agilite: 50 } },
  { mode: 'proportions', poids: { intellect: 3, charisme: 1 } },
];

describe('Le plan de progression', () => {
  it('ne dépasse jamais le budget ni 100, respecte le coût 1/2/3, et termine toujours', () => {
    for (const plan of PLANS)
      for (const budget of [0, 1, 3, 7, 20, 200])
        for (const base of [20, 58, 79, 99]) {
          const s = etat(budget, { controleChakra: base, agilite: base - 10, force: base, intellect: base, charisme: base });
          const r = proposer(s, plan);
          expect(coutRepartition(s, r)).toBeLessThanOrEqual(budget);
          for (const a of ATTRIBUTS) expect(s.attributs[a] + (r[a] ?? 0)).toBeLessThanOrEqual(100);
        }
  });

  it('dépense tout ce qu’il peut : il ne reste jamais assez pour un point utile', () => {
    const s = etat(7, { controleChakra: 59, agilite: 79 });
    const plan: Plan = { mode: 'priorites', ordre: ['controleChakra', 'agilite'] };
    const r = proposer(s, plan);
    const reste = 7 - coutRepartition(s, r);
    for (const a of plan.ordre) expect(coutPoint(s.attributs[a] + (r[a] ?? 0))).toBeGreaterThan(reste);
  });

  it('suit les priorités sans laisser la première distancer la suivante de plus de 10', () => {
    const r = proposer(etat(30), { mode: 'priorites', ordre: ['controleChakra', 'agilite'] });
    expect((r.controleChakra ?? 0) + (r.agilite ?? 0)).toBe(30);
    expect(Math.abs((r.controleChakra ?? 0) - (r.agilite ?? 0))).toBeLessThanOrEqual(10);
    expect(r.controleChakra! >= r.agilite!).toBe(true);
    expect(proposer(etat(6), { mode: 'priorites', ordre: ['force'] })).toEqual({ force: 6 });
  });

  it('vise les objectifs et s’arrête quand ils sont atteints', () => {
    expect(proposer(etat(50), { mode: 'cibles', cibles: { controleChakra: 40, agilite: 35 } })).toEqual({ controleChakra: 10, agilite: 5 });
  });

  it('« comme la dernière fois » reprend les proportions de la dernière validation', () => {
    const s = { ...etat(8), actions: [{ a: 'points', repartition: { intellect: 3, charisme: 1 } }] } as unknown as GameState;
    expect(commeLaDerniereFois(s)).toEqual({ intellect: 6, charisme: 2 });
    expect(commeLaDerniereFois(etat(8))).toBeUndefined();
  });

  it('un brouillon devenu trop cher est réduit de la fin vers le début, jamais au-delà du budget ni de 100', () => {
    const s = etat(5, { force: 99 });
    const { brouillon, coupe } = ajusterBrouillon(s, { force: 3, agilite: 2, controleEmotionnel: 4 });
    expect(coupe).toBe(true);
    expect(brouillon.force).toBe(1);
    expect(coutRepartition(s, brouillon)).toBeLessThanOrEqual(5);
    expect(ajusterBrouillon(etat(10), { agilite: 2 })).toEqual({ brouillon: { agilite: 2 }, coupe: false });
  });

  it('une répartition proposée par le plan est une action « points » ordinaire, que le moteur valide', () => {
    const s = { ...nouvellePartie(creation(), 5), pointsStat: 6 };
    const r = proposer(s, PLANS[0]);
    const apres = repartir(s, r);
    expect(apres.actions.at(-1)).toEqual({ a: 'points', repartition: r });
    expect(apres.pointsStat).toBe(0);
  });
});
