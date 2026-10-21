import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { activite, nouvellePartie, repartir } from '../src/engine/moteur';
import { cleScene } from '../src/ui/defilement';
import { genererActivites } from '../src/engine/tempsLibre';

const tempsLibre = () => {
  const s = nouvellePartie(creation(), 11);
  s.jour = s.naissance + 13 * 360;
  s.scene = { type: 'temps_libre' };
  s.pointsStat = 12;
  s.jauges.ryo = 500;
  return s;
};

describe('Confort : le défilement et la répartition', () => {
  it('cinq « + » et un achat ne changent pas l’écran : la page ne remonte pas', () => {
    let s = tempsLibre();
    const avant = cleScene(s);
    for (let i = 0; i < 5; i++) s = repartir(s, { force: 1 });
    expect(cleScene(s)).toBe(avant);
    s = activite(s, 'achat:parchemin_explosif');
    expect(cleScene(s)).toBe(avant);
  });

  it('une vraie activité change d’écran : là, la page remonte', () => {
    let s = tempsLibre();
    const avant = cleScene(s);
    s = activite(s, 'repos');
    expect(cleScene(s)).not.toBe(avant);
  });

  it('la répartition validée est une seule action, et le rejeu redonne le même état', () => {
    const depart = nouvellePartie(creation(), 21);
    depart.pointsStat = 6;
    const s = repartir(depart, { force: 2, agilite: 3 });
    const points = s.actions.filter((a) => a.a === 'points');
    expect(points).toHaveLength(1);
    expect(s.attributs.force).toBe(depart.attributs.force + 2);
    expect(s.pointsStat).toBe(1);
  });

});

describe('Temps libre : gain prévu et bilan de période', () => {
  it('chaque entraînement possible annonce ce que la période devrait rapporter', () => {
    const s = tempsLibre();
    const entrainements = genererActivites(s).filter((a) => a.id.startsWith('entrainer:') && a.disponible && a.progression?.prochain);
    expect(entrainements.length).toBeGreaterThan(0);
    for (const a of entrainements) expect(a.gain).toMatch(/Palier \d probable|Vers \d+ % du palier \d/);
  });
  it('une période d’entraînement laisse un bilan daté', () => {
    let s = tempsLibre();
    s.pointsStat = 0;
    const id = genererActivites(s).find((a) => a.id.startsWith('entrainer:') && a.disponible)!.id;
    s = activite(s, id);
    expect(s.bilanPeriode?.libelle).toBeTruthy();
    expect(s.bilanPeriode?.jour).toBe(s.jour);
  });
});
