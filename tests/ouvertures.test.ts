import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { combinaisons, creation } from './aide';

const OUVERTURES = ['o_village_', 'o_nuit_cloches', 'o_bandeau_poussiere', 'o_jeu_ninjas'];

describe('Le premier matin', () => {
  it('une vie commence par l’une de quatre ouvertures, et chacune arrive dans chaque village', () => {
    const villages = [...new Set(combinaisons().map((c) => c.village))];
    for (const v of villages) {
      const c = combinaisons().find((x) => x.village === v)!;
      const vues = new Map<string, number>();
      for (let g = 1; g <= 80; g++) {
        const s = nouvellePartie(creation({ village: c.village, clan: c.clan, element: c.element }), g);
        expect(s.scene.type, `${v} graine ${g}`).toBe('evenement');
        const id = (s.scene as { id: string }).id;
        const o = OUVERTURES.find((x) => id.startsWith(x));
        expect(o, `${v} graine ${g} : ${id}`).toBeDefined();
        vues.set(o!, (vues.get(o!) ?? 0) + 1);
      }
      for (const o of OUVERTURES) expect(vues.get(o) ?? 0, `${v} : ${o}`).toBeGreaterThan(8);
    }
  });

  it('la même graine donne toujours la même ouverture', () => {
    const a = nouvellePartie(creation(), 1234);
    const b = nouvellePartie(creation(), 1234);
    expect(a.scene).toEqual(b.scene);
  });
});
