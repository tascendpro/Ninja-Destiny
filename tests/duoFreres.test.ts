import { describe, expect, it } from 'vitest';
import { SCENES, nouvelleCampagne } from '../src/engine/campagne/moteur';
import { creation } from './aide';

const freres = (sansClan = false, origine?: 'parents_separes') =>
  nouvelleCampagne(
    creation({ prenom: 'Kaito', village: 'konoha', clan: sansClan || origine ? 'sans_clan' : 'uchiha', element: 'katon' }),
    creation({ prenom: 'Ren', village: origine ? 'suna' : 'konoha', clan: sansClan || origine ? 'sans_clan' : 'uchiha', element: sansClan ? 'fuuton' : 'katon' }),
    { type: 'freres', origine, passe: 'rencontre' },
    77,
  );

describe('Deux frères et sœurs sous le même toit', () => {
  it('ils ont le même grand frère (ou la même grande sœur), et les mêmes parents', () => {
    const c = freres();
    const [a, b] = c.joueurs;
    for (const id of ['famille_parent', 'famille_aine']) {
      expect(a.pnjGeneres[id].nom, id).toBe(b.pnjGeneres[id].nom);
      expect(a.pnjGeneres[id].genre, id).toBe(b.pnjGeneres[id].genre);
    }
    expect(a.roles['aine']).toBe('famille_aine');
  });

  it('la mort du grand frère frappe les deux, et la scène du deuil peut éveiller les yeux des deux', () => {
    const deuil = SCENES['mc_deuil_aine'];
    for (const i of deuil.issues) expect(JSON.stringify(i.effets?.les2 ?? []), i.cle).toContain('eveilDanger');
  });

  it('deux frères élevés séparément gardent chacun leur aîné', () => {
    const c = freres(false, 'parents_separes');
    for (const s of c.joueurs) expect(s.roles['aine']).toBe('famille_aine');
  });
});
