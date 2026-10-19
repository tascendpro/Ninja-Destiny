import { describe, expect, it } from 'vitest';
import { creation, poursuivre, simuler, combinaisons } from './aide';
import { chapitreSuivant, chapitreSuivantDisponible, nouvellePartie, rejouer, activite } from '../src/engine/moteur';
import { genererActivites, faireActivite } from '../src/engine/tempsLibre';
import { etatProgression } from '../src/engine/maitrise';
import { nouveauCtx } from '../src/engine/etat';
import { fusionnerMeta, lireMeta, stockageMemoire } from '../src/engine/sauvegarde';

describe('Chapitre 2', () => {
  it('la fin du chapitre 1 propose de continuer, et la vie va jusqu’au bout du chapitre 2', () => {
    const fins: Record<string, number> = {};
    let continues = 0;
    const cs = combinaisons();
    for (let i = 0; i < 60; i++) {
      const r = simuler(creation(cs[i % cs.length]), 700 + i);
      expect(r.erreurs).toEqual([]);
      if (!chapitreSuivantDisponible(r.etat)) continue;
      continues++;
      const s2 = chapitreSuivant(r.etat);
      expect(s2.chapitre).toBe(2);
      expect(s2.fin).toBeUndefined();
      const r2 = poursuivre(s2, 900 + i, 2500);
      expect(r2.erreurs).toEqual([]);
      expect(r2.fin).toBeDefined();
      fins[r2.fin!] = (fins[r2.fin!] ?? 0) + 1;
      // Le rejeu reconstruit la vie entière, chapitre 2 compris.
      if (i % 10 === 0) expect(rejouer(r2.etat.creation, r2.etat.seed, r2.etat.actions).jour).toBe(r2.etat.jour);
    }
    expect(continues).toBeGreaterThan(20);
    expect((fins.chapitre_2 ?? 0) + (fins.chapitre_2_route ?? 0)).toBeGreaterThan(continues / 2);
  }, 120000);

  it('une vie qui continue ne verse à la bourse que la différence de ryō', () => {
    const st = stockageMemoire();
    const cs = combinaisons();
    for (let i = 0; i < 30; i++) {
      const r = simuler(creation(cs[i % cs.length]), 1700 + i);
      if (!chapitreSuivantDisponible(r.etat)) continue;
      fusionnerMeta(st, r.etat);
      const apres1 = lireMeta(st).ryo;
      expect(apres1).toBe(Math.round(r.etat.jauges.ryo));
      const r2 = poursuivre(chapitreSuivant(r.etat), 5, 2500);
      fusionnerMeta(st, r2.etat);
      expect(lireMeta(st).ryo).toBe(Math.max(apres1, Math.round(r2.etat.jauges.ryo)));
      return;
    }
    throw new Error('aucune fin de chapitre 1 trouvée');
  }, 60000);
});

describe('Entraînement', () => {
  it('une maîtrise bloquée par l’âge n’est plus proposée, avec la raison', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 3);
    s.tirages.prodige = false;
    s.creation.traits = s.creation.traits.filter((t) => t !== 'prodige');
    s.maitrises['ninjutsu'].tier = 1;
    s.maitrises['ninjutsu'].trainingDays = 10000;
    s.scene = { type: 'temps_libre' };
    const p = etatProgression(s, 'ninjutsu')!;
    expect(p.mur).toBe('age');
    expect(p.inutile).toBe(true);
    const act = genererActivites(s).find((a) => a.id === 'entrainer:ninjutsu')!;
    expect(act.disponible).toBe(false);
    expect(act.raison).toMatch(/pas avant 10 ans/);
  });
  it('un programme double entraîne une technique et une discipline en même temps', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 3);
    s.jour = s.naissance + 11 * 360;
    s.rang = 'genin';
    s.maitrises['taijutsu'].tier = 1;
    s.scene = { type: 'temps_libre' };
    const avantNin = s.maitrises['ninjutsu'].trainingDays;
    const acts = genererActivites(s);
    expect(acts.find((a) => a.id === 'technique:tai_tourbillon')?.groupe).toBe('sort');
    expect(acts.find((a) => a.id === 'entrainer:ninjutsu')?.groupe).toBe('discipline');
    const s2 = activite(s, 'duo:technique:tai_tourbillon+entrainer:ninjutsu');
    expect(s2.maitrises['tai_tourbillon'].tier).toBeGreaterThanOrEqual(1);
    expect(s2.maitrises['ninjutsu'].trainingDays).toBeGreaterThan(avantNin);
    // Avant le bandeau, un seul entraînement à la fois.
    expect(() => activite({ ...s, rang: 'eleve' }, 'duo:technique:tai_tourbillon+entrainer:ninjutsu')).toThrow();
    // Deux choix du même onglet ne se combinent pas.
    expect(() => faireActivite(s, 'duo:entrainer:taijutsu+entrainer:ninjutsu', nouveauCtx())).toThrow();
  });
});
