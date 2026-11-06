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
    // 160 vies : avec 40 puis 80, un tirage malchanceux pouvait faire échouer le test sans que l'équilibre ait changé
    // (mesuré : 3 à 11 vies au dernier chapitre selon les tirages, pour un même équilibre).
    for (let i = 0; i < 160; i++) {
      // On joue au réglage d'avant la Légende : ce test vérifie que chaque chapitre s'enchaîne, et le robot doit y arriver vivant.
      const v = vieComplete(creation({ ...cs[i % cs.length], difficulte: 'shinobi' }), 9000 + i);
      expect(v.erreurs).toEqual([]);
      expect(v.fin).toBeDefined();
      expect(chapitreSuivantDisponible(v.etat)).toBe(false);
      fins[v.fin!] = (fins[v.fin!] ?? 0) + 1;
      chapitres[v.etat.chapitre] = (chapitres[v.etat.chapitre] ?? 0) + 1;
      if (i % 26 === 0) expect(rejouer(v.etat.creation, v.etat.seed, v.etat.actions).jour).toBe(v.etat.jour);
    }
    const accomplies = Object.entries(fins).filter(([id]) => R.fins[id]?.type === 'accomplie').reduce((a, [, n]) => a + n, 0);
    // Au moins 5 % des vies vont jusqu'au dernier chapitre, et quelques-unes s'accomplissent.
    // Mesuré (version 2.26) : fins accomplies 6 sur ces graines, 20 sur 160 autres (22 pour la version d'avant) : du bruit.
    expect(chapitres[6] ?? 0).toBeGreaterThanOrEqual(8);
    expect(accomplies).toBeGreaterThanOrEqual(5);
  }, 600000);
});
