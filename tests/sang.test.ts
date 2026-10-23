import { describe, expect, it } from 'vitest';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { resoudrePnj } from '../src/engine/etat';
import { creation } from './aide';

const verdict = (village: 'konoha' | 'kiri', graine: number, deja = 0) => {
  const s = nouvellePartie(creation({ village, clan: 'sans_clan' }), graine);
  s.jour = s.naissance + 20 * 360;
  s.rang = 'chunin';
  s.drapeaux['verdict_forme'] = 'duel';
  s.drapeaux['verdict_allies'] = true;
  if (deja) s.drapeaux['ennemis_acheves'] = deja;
  s.scene = { type: 'evenement', id: 'x_verdict' };
  return s;
};

describe('Achever un vaincu', () => {
  it('l’équipier qui a vu ne te regarde plus pareil', () => {
    let vu = false;
    for (let g = 1; g < 40 && !vu; g++) {
      const s = verdict('konoha', g);
      const ami = resoudrePnj(s, '@coequipierA')!;
      const peur = s.relations[ami].peur;
      const t = choisir(s, 'achever');
      if (t.drapeaux['verdict_issue'] !== 'tue') continue;
      expect(t.relations[ami].peur).toBeGreaterThan(peur);
      expect(t.drapeaux['temoins_choques']).toBe(1);
      vu = true;
    }
    expect(vu).toBe(true);
  });

  it('trop de vaincus achevés à Konoha : le conseil convoque ; la Brume ferme les yeux', () => {
    let konoha = false;
    let kiri = false;
    for (let g = 1; g < 40; g++) {
      const k = choisir(verdict('konoha', g, 2), 'achever');
      if (k.drapeaux['verdict_issue'] === 'tue' && k.planifies.some((p) => p.evenementId === 'x_conseil_sang')) konoha = true;
      const b = choisir(verdict('kiri', g, 2), 'achever');
      if (b.planifies.some((p) => p.evenementId === 'x_conseil_sang')) kiri = true;
    }
    expect(konoha).toBe(true);
    expect(kiri).toBe(false);
  });
});
