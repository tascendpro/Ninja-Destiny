import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { avancerTemps } from '../src/engine/temps';
import { genererActivites } from '../src/engine/tempsLibre';
import { DELAI_MISSION, missionsAuTableau } from '../src/engine/tableauMissions';
import { nouveauCtx, resoudrePnj } from '../src/engine/etat';
import { creation } from './aide';

function genin() {
  const s = nouvellePartie(creation({ village: 'konoha' }), 5);
  s.jour = s.naissance + 13 * 360;
  s.rang = 'genin';
  return s;
}

describe('Le tableau des missions n’attend pas', () => {
  it('une mission laissée trop longtemps est prise par un autre, qui en tire l’expérience', () => {
    const s = genin();
    const offertes = missionsAuTableau(s);
    expect(offertes.length).toBeGreaterThan(0);
    const m = offertes[0];
    avancerTemps(s, 1, nouveauCtx());
    expect(typeof s.drapeaux[`mission_offerte:${m.id}`]).toBe('number');
    expect(genererActivites(s).find((a) => a.id === `mission:${m.id}`)?.description).toMatch(/tableau|quelqu’un d’autre/);
    const avant = JSON.stringify(Object.fromEntries(['@rival', '@coequipierA', '@coequipierB'].map((r) => [r, s.pnj[resoudrePnj(s, r) ?? '']?.maitrises])));
    const ctx = nouveauCtx();
    avancerTemps(s, DELAI_MISSION[m.rang] + 1, ctx);
    expect(s.missions[m.id]).toBe('confiee');
    expect(genererActivites(s).some((a) => a.id === `mission:${m.id}`)).toBe(false);
    expect(ctx.changements.some((c) => c.t === 'info' && c.message.includes(m.titre))).toBe(true);
    const preneur = s.drapeaux[`mission_prise:${m.id}`];
    if (typeof preneur === 'string') {
      expect(Number(s.drapeaux[`missions_pnj:${preneur}`])).toBeGreaterThanOrEqual(1);
      const apres = JSON.stringify(Object.fromEntries(['@rival', '@coequipierA', '@coequipierB'].map((r) => [r, s.pnj[resoudrePnj(s, r) ?? '']?.maitrises])));
      expect(apres).not.toBe(avant);
    }
  });

  it('une mission prise à temps ne part pas', () => {
    const s = genin();
    const m = missionsAuTableau(s)[0];
    avancerTemps(s, 1, nouveauCtx());
    s.missions[m.id] = 'en_cours';
    avancerTemps(s, DELAI_MISSION[m.rang] + 30, nouveauCtx());
    expect(s.missions[m.id]).toBe('en_cours');
  });
});
