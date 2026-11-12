import { describe, expect, it } from 'vitest';
import { SCENES_SOUVENIRS } from '../src/content/campagne/scenesSouvenirs';
import { SCENES } from '../src/engine/campagne/moteur';
import { souvenir, texteCommun, sansJeton } from '../src/engine/campagne/outils';
import { campagneDe } from './aideCampagne';

const retours = SCENES_SOUVENIRS.filter((s) => s.id.endsWith('_retour'));

describe('Les souvenirs à deux', () => {
  it('chaque scène est enregistrée, et chaque première scène a son retour, plus tard dans la vie', () => {
    for (const sc of SCENES_SOUVENIRS) expect(SCENES[sc.id], sc.id).toBeDefined();
    expect(retours.length).toBe(SCENES_SOUVENIRS.length / 2);
    for (const r of retours) {
      const premiere = SCENES_SOUVENIRS.find((s) => s.id === r.id.replace(/_retour$/, ''))!;
      expect(premiere, r.id).toBeDefined();
      expect(r.age!.min, r.id).toBeGreaterThan(premiere.age!.max!);
    }
  });

  it('un retour n’existe pas sans le souvenir, et son texte change avec la tonalité de ce souvenir', () => {
    for (const r of retours) {
      const premiere = SCENES_SOUVENIRS.find((s) => s.id === r.id.replace(/_retour$/, ''))!;
      const id = premiere.issues.find((i) => i.souvenir)!.souvenir!.id;
      const c = campagneDe(3);
      expect(r.si!(c), r.id).toBe(false);
      souvenir(c, id, 'test', 3, 'chaud');
      expect(r.si!(c), r.id).toBe(true);
      const chaud = typeof r.texte === 'function' ? r.texte(c) : r.texte;
      c.lien.souvenirs[c.lien.souvenirs.length - 1].tonalite = 'amer';
      const amer = typeof r.texte === 'function' ? r.texte(c) : r.texte;
      if (premiere.issues.some((i) => i.souvenir?.tonalite === 'amer')) expect(amer, r.id).not.toBe(chaud);
    }
  });

  it('aucun jeton ne reste dans les textes une fois résolus', () => {
    const c = campagneDe(5);
    for (const sc of SCENES_SOUVENIRS) {
      souvenir(c, 'lanterne', 'x', 3, 'chaud');
      souvenir(c, 'manche', 'x', 3, 'chaud');
      souvenir(c, 'eleve', 'x', 3, 'chaud');
      souvenir(c, 'go', 'x', 3, 'chaud');
      const brut = [typeof sc.texte === 'function' ? sc.texte(c) : sc.texte, ...sc.issues.map((i) => i.texte), ...sc.choix.map((x) => x.texte)];
      for (const t of brut) expect(sansJeton(texteCommun(c, t, 0, 0)), sc.id).not.toMatch(/[{}]/);
    }
  });
});
