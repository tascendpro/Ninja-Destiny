import { describe, expect, it } from 'vitest';
import { SCENES, issuePour } from '../src/engine/campagne/moteur';
import { SCENES_COMPLICES } from '../src/content/campagne/scenesComplices';
import { COMBATS_DUO } from '../src/content/campagne/combats';

describe('Les scènes complices de la campagne à deux', () => {
  it('sont toutes enregistrées, avec un cas par défaut', () => {
    expect(SCENES_COMPLICES.length).toBeGreaterThanOrEqual(10);
    for (const sc of SCENES_COMPLICES) {
      expect(SCENES[sc.id], sc.id).toBe(sc);
      expect(sc.issues.some((i) => i.cle === 'defaut'), sc.id).toBe(true);
    }
  });

  it('couvrent toute la vie, de l’enfance à la vieillesse', () => {
    const ages = SCENES_COMPLICES.map((s) => s.age!.min);
    expect(Math.min(...ages)).toBeLessThanOrEqual(8);
    expect(Math.max(...ages)).toBeGreaterThanOrEqual(55);
  });

  it('chaque clé d’issue désigne des choix qui existent, et chaque combat existe', () => {
    const combats = new Set(COMBATS_DUO.map((x) => x.id));
    for (const sc of SCENES_COMPLICES) {
      const ids = new Set(sc.choix.map((c) => c.id));
      for (const i of sc.issues) {
        if (i.combat) expect(combats.has(i.combat), `${sc.id} ${i.combat}`).toBe(true);
        if (['defaut', 'accord', 'complement', 'conflit'].includes(i.cle) || i.cle.startsWith('famille:')) continue;
        for (const part of i.cle.split('+')) if (part !== '*') expect(ids.has(part), `${sc.id} ${i.cle}`).toBe(true);
      }
    }
  });

  it('chaque paire de choix trouve une issue écrite (jamais un texte vide)', () => {
    for (const sc of SCENES_COMPLICES)
      for (const a of sc.choix)
        for (const b of sc.choix) expect(issuePour(sc, a.id, b.id).issue.texte, `${sc.id} ${a.id}+${b.id}`).toBeTruthy();
  });
});
