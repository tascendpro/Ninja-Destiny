import { describe, expect, it } from 'vitest';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { avecNom, vueAffrontement } from '../src/engine/combat/affrontement';
import { adversaireDef } from '../src/engine/combat/adversaire';
import { creation, jouerCombat } from './aide';

const ouvrir = (ev: string, ch: string, presentation: 'masculin' | 'feminin' = 'feminin') => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon', presentation }), 21);
  s.jour = s.naissance + 13 * 360;
  s.rang = 'genin';
  s.scene = { type: 'evenement', id: ev };
  return choisir(s, ch);
};

describe('Chaque adversaire a sa nature', () => {
  it('un chien ne parle pas, ne compose pas de signes, et on ne le raisonne pas', () => {
    const t = ouvrir('vf_chien', 'intercepter');
    const v = vueAffrontement(t)!;
    expect(v.adversaire.nom).toBe('Le chien enragé');
    expect(v.familles.map((f) => f.id)).not.toContain('parole');
    if (t.scene.type !== 'affrontement') return;
    const d = adversaireDef(t.scene.adversaireId);
    expect(d.type).toBe('bete');
    expect(d.repliques.every((r) => r.texte.startsWith('~'))).toBe(true);
    // Le chien reste « il » même quand le personnage est une fille.
    expect(t.scene.journal[0].repliques[0] ?? '~Il').toMatch(/^~(Il|Ils)\b/);
  });

  it('une bande de la route n’a pas la voix d’une escouade ninja', () => {
    const a = ouvrir('md_marchand', 'combat');
    const b = ouvrir('mg_meute', 'combat');
    if (a.scene.type !== 'affrontement' || b.scene.type !== 'affrontement') return;
    expect(adversaireDef(a.scene.adversaireId).type).toBe('bandit');
    expect(adversaireDef(a.scene.adversaireId).repliques).not.toEqual(adversaireDef(b.scene.adversaireId).repliques);
  });

  it('après un combat sans fiche, c’est la scène qui raconte la fin, sans phrase générique répétée', () => {
    const t = jouerCombat(ouvrir('md_marchand', 'combat'));
    expect(t.scene.type).toBe('resultat');
    const texte = t.scene.type === 'resultat' ? t.scene.texte : '';
    expect(texte).not.toMatch(/On vous sépare|est à terre, et n’essaie plus|reste au sol, le souffle court/);
  });

  it('le nom garde sa majuscule en début de phrase, et la perd au milieu', () => {
    expect(avecNom('{nom} recule.', 'Le chien')).toBe('Le chien recule.');
    expect(avecNom('Toi et {nom}, à bout de souffle.', 'Le chien')).toBe('Toi et le chien, à bout de souffle.');
    expect(avecNom('Toi et {nom}.', 'Orochimaru')).toBe('Toi et Orochimaru.');
  });
});
