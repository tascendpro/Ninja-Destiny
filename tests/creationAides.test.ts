import { describe, expect, it } from 'vitest';
import { VOIES, appliquerVoie, aptitudeDe, creationAuHasard, profilTraits } from '../src/ui/creationAides';
import { nouvellePartie, validerCreation } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { creation } from './aide';

/** Un tirage reproductible, pour que le test soit le même à chaque fois. */
function alea(graine: number) {
  // mulberry32 : chaque graine part d'un point vraiment différent.
  let x = graine >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Les raccourcis de la création', () => {
  const base = creation({ prenom: '', presentation: 'feminin' });

  it('chaque voie tracée donne un ninja valide, qui peut commencer sa vie', () => {
    expect(VOIES.length).toBeGreaterThanOrEqual(6);
    for (const v of VOIES) {
      const c = appliquerVoie(base, v, alea(3));
      expect(validerCreation(c), v.id).toEqual([]);
      expect(c.prenom.length, v.id).toBeGreaterThan(0);
      expect(R.contenu.noms[v.village].f, v.id).toContain(c.prenom);
      expect(() => nouvellePartie(c, 11)).not.toThrow();
    }
  });

  it('une voie garde le prénom, la présentation et l’âge déjà choisis', () => {
    const c = appliquerVoie({ ...base, prenom: 'Sayo', presentation: 'neutre', ageDepart: 10 }, VOIES[0]);
    expect([c.prenom, c.presentation, c.ageDepart]).toEqual(['Sayo', 'neutre', 10]);
  });

  it('le destin tire toujours un ninja valide, et explore tous les villages', () => {
    const villages = new Set<string>();
    for (let g = 1; g <= 400; g++) {
      const c = creationAuHasard(base, alea(g));
      expect(validerCreation(c), JSON.stringify(c)).toEqual([]);
      villages.add(c.village);
    }
    expect(villages.size).toBe(R.contenu.villages.length);
  });

  it('le point fort suit les traits, et l’aperçu additionne leurs bonus', () => {
    expect(aptitudeDe(['mefiant', 'curieux'], 'force')).toBe('perception');
    expect(profilTraits(['mefiant', 'curieux'])).toMatchObject({ perception: 15, intellect: 3, charisme: -2 });
    expect(aptitudeDe([], 'force')).toBe('force');
  });
});
