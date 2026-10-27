import { describe, expect, it } from 'vitest';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { raconterMort } from '../src/engine/combat/affrontement';
import { MORTS_AU_COMBAT } from '../src/content/combat/morts';
import { creation, jouerCombat } from './aide';

describe('Mourir au combat : chaque mort se raconte selon ce qui t’a tué', () => {
  it('chaque scène est accordée, sans jeton oublié ni article mal contracté', () => {
    const s = nouvellePartie(creation({ presentation: 'masculin' }), 1);
    for (const cle of Object.keys(MORTS_AU_COMBAT)) {
      for (const nom of ['Le chien enragé', 'Ryōga Hōzuki', 'L’escouade d’Iwa']) {
        for (const tirage of [0, 0.5, 0.99]) {
          const m = raconterMort(s, cle, 'Grande boule de feu', nom, 'f', tirage);
          for (const t of [m.texte, m.cause]) {
            expect(t, cle).not.toMatch(/\{|\}|·/);
            expect(t, cle).not.toMatch(/\bde le\b|\bà le\b/);
          }
        }
      }
    }
    expect(raconterMort(s, 'taijutsu', undefined, 'Le chien enragé', 'm', 0).cause).toBe('tombé sous les coups du chien enragé');
  });

  it('brûlé, noyé, foudroyé : l’élément de la technique adverse décide de la mort, et de l’épitaphe', () => {
    const s = nouvellePartie(creation(), 1);
    expect(raconterMort(s, 'katon', 'Grande boule de feu', 'Ryōga', 'm', 0).cause).toMatch(/consumée par le feu de Ryōga \(Grande boule de feu\)/);
    expect(raconterMort(s, 'suiton', 'Prison aqueuse', 'Ryōga', 'm', 0).cause).toMatch(/noyée/);
    expect(raconterMort(s, 'suiton', 'Prison aqueuse', 'Ryōga', 'm', 0).precise).toBe(true);
    expect(raconterMort(s, 'lame', undefined, 'Ryōga', 'm', 0).precise).toBe(false);
  });

  it('mourir contre un membre de l’Akatsuki se raconte à sa manière', () => {
    let vu = false;
    for (let g = 1; g < 60 && !vu; g++) {
      const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), g);
      s.jour = s.naissance + 24 * 360;
      s.rang = 'jonin';
      s.chapitre = 3;
      s.drapeaux['akatsuki_connue'] = true;
      s.scene = { type: 'evenement', id: 'akc_desert' };
      const t = jouerCombat(choisir(s, 'deidara'));
      if (t.statut !== 'mort' && t.jauges.sante > 0) continue;
      vu = true;
      const texte = t.scene.type === 'resultat' ? t.scene.texte : '';
      expect(MORTS_AU_COMBAT.ak_deidara.textes.some((x) => texte.includes(x.slice(0, 30)))).toBe(true);
      expect(String(t.drapeaux['cause_mort'])).toMatch(/Deidara/);
      expect(texte).not.toMatch(/Tout va très vite/);
    }
    expect(vu).toBe(true);
  });
});
