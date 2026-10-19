import { describe, expect, it } from 'vitest';
import { creation, simuler } from './aide';
import { nouvellePartie, repartir, rejouer, choixVisibles } from '../src/engine/moteur';
import { anniversaire, coutRepartition, gainsAnnuels, noterMerite } from '../src/engine/progression';
import { evaluerEpreuve } from '../src/engine/epreuves';
import { avancerTemps } from '../src/engine/temps';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';
import type { CheckDef } from '../src/engine/types';

describe('Points de stat annuels', () => {
  it('chaque anniversaire rapporte des points selon l’année vécue', () => {
    const s = nouvellePartie(creation(), 5);
    const calme = gainsAnnuels(s, 8).reduce((a, g) => a + g.points, 0);
    noterMerite(s, 'combat', 3);
    noterMerite(s, 'epreuve', 4);
    noterMerite(s, 'entrainement', 2);
    noterMerite(s, 'etude');
    const intense = gainsAnnuels(s, 8).reduce((a, g) => a + g.points, 0);
    expect(intense).toBe(calme + 2 + 2 + 2 + 1);
    anniversaire(s, 8, nouveauCtx());
    expect(s.pointsStat).toBe(intense);
    expect(s.merites.combat).toBeUndefined();
  });
  it('le temps qui passe déclenche l’anniversaire et ses points', () => {
    const s = nouvellePartie(creation(), 5);
    const ctx = nouveauCtx();
    avancerTemps(s, 400, ctx);
    expect(s.pointsStat).toBeGreaterThanOrEqual(3);
    expect(ctx.changements.some((c) => c.t === 'points')).toBe(true);
  });
  it('répartir coûte plus cher au-delà de 60 et 80, et se rejoue à l’identique', () => {
    let s = nouvellePartie(creation(), 5);
    s.attributs.intellect = 59;
    expect(coutRepartition(s, { intellect: 3 })).toBe(1 + 2 + 2);
    s.pointsStat = 6;
    expect(() => repartir(s, { intellect: 5 })).toThrow();
    s = repartir(s, { intellect: 3, force: 1 });
    expect(s.attributs.intellect).toBe(62);
    expect(s.pointsStat).toBe(0);
    // Le rejeu reconstruit la même partie à partir des décisions, points compris.
    const r = simuler(creation(), 11, 600);
    expect(r.etat.actions.some((a) => a.a === 'points')).toBe(true);
    const re = rejouer(r.etat.creation, r.etat.seed, r.etat.actions);
    expect(re.attributs).toEqual(r.etat.attributs);
    expect(re.pointsStat).toBe(r.etat.pointsStat);
  });
  it('une épreuve de réflexion est facile pour un esprit vif, difficile sinon, en pourcentage', () => {
    const s = nouvellePartie(creation(), 5);
    const t = { type: 'competence', difficulte: 50, attributs: { intellect: 2, perception: 1 }, succes: {}, echec: {} } as unknown as CheckDef;
    s.attributs.intellect = 30;
    const faible = evaluerEpreuve(s, t);
    s.attributs.intellect = 75;
    const fort = evaluerEpreuve(s, t);
    expect(fort.principal).toBe('intellect');
    expect(fort.proba - faible.proba).toBeGreaterThan(0.5);
  });
  it('les choix avec épreuve affichent un pourcentage et l’aptitude décisive', () => {
    const s = nouvellePartie(creation(), 5);
    const ev = Object.values(R.evenements).find((e) => e.choix.some((c) => c.test && !c.si));
    const v = choixVisibles(s, ev!).find((c) => c.risque);
    expect(v?.chance).toBeGreaterThanOrEqual(4);
    expect(v?.chance).toBeLessThanOrEqual(96);
    expect(v?.principal).toBeDefined();
  });
});
