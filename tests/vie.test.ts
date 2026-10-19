import { describe, expect, it } from 'vitest';
import { creation, poursuivre, simuler, combinaisons } from './aide';
import { chapitreSuivant, chapitreSuivantDisponible, rejouer } from '../src/engine/moteur';
import type { Creation } from '../src/engine/types';
import { R } from '../src/engine/registre';

/** Une vie entière : on continue à chaque fin de chapitre, jusqu'à une vraie fin. */
export function vieComplete(c: Creation, graine: number) {
  let r = simuler(c, graine, 2000);
  const erreurs = [...r.erreurs];
  let n = 0;
  while (chapitreSuivantDisponible(r.etat) && n++ < 7) {
    r = poursuivre(chapitreSuivant(r.etat), graine + n * 101, 3500);
    erreurs.push(...r.erreurs);
  }
  return { ...r, erreurs };
}

describe('Une vie entière, du premier au dernier chapitre', () => {
  it('chaque chapitre s’enchaîne jusqu’à une fin de vie, sans blocage', () => {
    const fins: Record<string, number> = {};
    const chapitres: Record<number, number> = {};
    const cs = combinaisons();
    for (let i = 0; i < 40; i++) {
      const v = vieComplete(creation(cs[i % cs.length]), 9000 + i);
      expect(v.erreurs).toEqual([]);
      expect(v.fin).toBeDefined();
      expect(chapitreSuivantDisponible(v.etat)).toBe(false);
      fins[v.fin!] = (fins[v.fin!] ?? 0) + 1;
      chapitres[v.etat.chapitre] = (chapitres[v.etat.chapitre] ?? 0) + 1;
      if (i % 13 === 0) expect(rejouer(v.etat.creation, v.etat.seed, v.etat.actions).jour).toBe(v.etat.jour);
    }
    const accomplies = Object.entries(fins).filter(([id]) => R.fins[id]?.type === 'accomplie').reduce((a, [, n]) => a + n, 0);
    expect(chapitres[6] ?? 0).toBeGreaterThan(5);
    expect(accomplies).toBeGreaterThan(5);
  }, 300000);
});
