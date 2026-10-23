import { describe, expect, it } from 'vitest';
import { nommer, nomValide, nouvellePartie } from '../src/engine/moteur';
import { interpoler } from '../src/engine/texte';
import { creation } from './aide';

describe('Nommer son enfant', () => {
  it('le nom choisi remplace celui que le jeu proposait, partout dans le texte', () => {
    const s = nouvellePartie(creation({ village: 'konoha' }), 21);
    expect(() => nommer(s, 'enfant', 'Akira')).toThrow();
    s.drapeaux['famille_fondee'] = true;
    s.drapeaux['enfant_genre'] = 'f';
    const propose = interpoler('{enfantNom}', s);
    expect(propose.length).toBeGreaterThan(0);
    const t = nommer(s, 'enfant', '  Hana-Mei ');
    expect(t.drapeaux['enfant_nom']).toBe('Hana-Mei');
    expect(interpoler('{Enfant}, {enfantNom}, a cinq ans.', t)).toBe('Ta fille, Hana-Mei, a cinq ans.');
    expect(t.actions.at(-1)).toEqual({ a: 'nommer', cible: 'enfant', nom: 'Hana-Mei' });
  });

  it('refuse les noms vides, trop longs ou faits de chiffres', () => {
    expect(nomValide('')).toBeUndefined();
    expect(nomValide('123')).toBeUndefined();
    expect(nomValide('A'.repeat(30))).toBeUndefined();
    expect(nomValide('Kō’ji')).toBe('Kō’ji');
  });
});
