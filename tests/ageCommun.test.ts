// Une chronologie unique (règles 2) : celui qui a passé un anniversaire attend l'autre, tant que l'autre peut avancer.
import { describe, expect, it } from 'vitest';
import { joueurActif, nouvelleCampagne } from '../src/engine/campagne/moteur';
import { ageA, finie } from '../src/engine/campagne/outils';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { campagneDe, jouer } from './aideCampagne';
import { creation } from './aide';

/** Le joueur qui va jouer prend-il de l'avance en âge alors que l'autre pouvait encore rattraper ? */
function violation(c: Campagne): boolean {
  if (c.commune || c.resultat || c.combat || c.separation?.actif || c.morts.includes('a_choisir')) return false;
  const j = joueurActif(c);
  if (j === null) return false;
  const o = (1 - j) as IdJoueur;
  const s = c.joueurs[j];
  const t = c.joueurs[o];
  if (finie(t) || s.scene.type !== 'temps_libre' || t.scene.type !== 'temps_libre') return false;
  const barriere = c.barrieres[0]?.jour ?? Infinity;
  // Un anniversaire de s tombé entre le jour de t et le sien : s prendrait de l'avance sur la chronologie commune.
  return s.jour > t.jour && ageA(s) > ageA(s, t.jour) && t.jour < barriere && !c.resultatPrive[o];
}

describe('L’âge commun', () => {
  it('sur des campagnes entières, personne ne joue ses 10 ans pendant que l’autre, libre, en a encore 9', () => {
    let pas = 0;
    let fautes = 0;
    for (let g = 0; g < 8; g++) {
      jouer(campagneDe(g), 500 + g, () => false, 700, ['hasard', 'hasard'], (c) => {
        pas++;
        if (violation(c)) fautes++;
      });
    }
    expect(pas).toBeGreaterThan(1000);
    expect(fautes).toBe(0);
  });

  it('une campagne d’avant les règles 2 garde l’ancienne tolérance d’un an', () => {
    const c = nouvelleCampagne(creation({ prenom: 'Aya' }), creation({ prenom: 'Ren' }), { type: 'amis', passe: 'rencontre', regles: 1 }, 9);
    expect(c.regles).toBe(1);
    const n = nouvelleCampagne(creation({ prenom: 'Aya' }), creation({ prenom: 'Ren' }), { type: 'amis', passe: 'rencontre' }, 9);
    expect(n.regles).toBe(2);
  });
});
