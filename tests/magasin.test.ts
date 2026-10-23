import { describe, expect, it } from 'vitest';
import { magasin, magasinOuvert, nouvellePartie } from '../src/engine/moteur';
import { entrerEvenement } from '../src/engine/selection';
import { creation } from './aide';

function genin() {
  return { s: nouvellePartie(creation({ village: 'konoha' }), 12) };
}

describe('Le magasin est ouvert à tout moment, sauf en combat', () => {
  it('on achète en pleine scène, sans quitter la scène', () => {
    const { s } = genin();
    s.jour = s.naissance + 13 * 360;
    s.jauges.ryo = 500;
    entrerEvenement(s, 'kv_deserteurs');
    expect(s.scene.type).toBe('evenement');
    expect(magasinOuvert(s)).toBe(true);
    const t = magasin(s, 'achat:fumigene');
    expect(t.scene).toEqual(s.scene);
    expect(t.jauges.ryo).toBeLessThan(500);
    expect(t.annonce).toMatch(/sacoche/);
    expect(t.actions.at(-1)).toEqual({ a: 'magasin', id: 'achat:fumigene' });
  });

  it('fermé en plein combat, et refuse ce qui n’est pas un article', () => {
    const { s } = genin();
    s.scene = { type: 'fin', id: 'x' };
    expect(magasinOuvert(s)).toBe(false);
    expect(() => magasin(s, 'achat:fumigene')).toThrow();
    const { s: s2 } = genin();
    s2.jauges.ryo = 500;
    expect(() => magasin(s2, 'mission:d_jardin')).toThrow();
  });
});
