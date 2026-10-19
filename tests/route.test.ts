import { describe, expect, it } from 'vitest';
import { creation, poursuivre, simuler } from './aide';
import { nouvellePartie, choisir, continuer, choixVisibles, chapitreSuivant, chapitreSuivantDisponible } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import type { GameState } from '../src/engine/types';

/** Un élève de 13 ans qui vient de rater son troisième examen. */
function refoule(graine = 5): GameState {
  const s = nouvellePartie(creation({ village: 'suna', clan: 'sans_clan', element: 'fuuton' }), graine);
  s.jour = s.naissance + 13 * 360 + 10;
  s.drapeaux['examen_rate'] = 3;
  s.drapeaux['refoule'] = true;
  // L'enfance et l'Académie ont déjà été vécues.
  for (const ev of R.contenu.evenements) if (/^(o_|a_|b_)/.test(ev.id)) s.evenementsVus[ev.id] = { n: 1, dernier: s.jour };
  s.sequences = [{ id: 'academie_fin', debut: s.sequences[0].debut }];
  s.scene = { type: 'evenement', id: 'r_refoule' };
  return s;
}

describe('Refoulé·e de l’Académie', () => {
  it('le troisième échec mène au refus, pas directement à la vie civile', () => {
    const ev = R.evenements['a_examen_rattrapage'];
    const echec = JSON.stringify(ev.choix.find((c) => c.id === 'tenter')!.test!.echec.effets);
    expect(echec).toContain('r_refoule');
    expect(echec).not.toContain('vie_civile');
  });
  it('le refus propose la vie civile, la route et la désertion', () => {
    const s = refoule();
    const ids = choixVisibles(s, R.evenements['r_refoule']).map((c) => c.id);
    expect(ids).toEqual(['civil', 'route', 'parchemin']);
  });
  it('partir sur la route ouvre la séquence « Sur les routes » après un bilan', () => {
    let s = choisir(refoule(), 'route');
    expect(s.statut).toBe('errant');
    s = continuer(s);
    expect(s.scene.type).toBe('bilan');
    s = continuer(s);
    expect(s.sequences.at(-1)?.id).toBe('route');
    expect(s.scene.type === 'evenement' && s.scene.id).toBe('e_route');
  });
  it('sur la route, la partie va toujours jusqu’à une fin (chapitre, retour au village ou mort)', () => {
    const fins: Record<string, number> = {};
    for (let g = 1; g <= 40; g++) {
      const r = poursuivre(choisir(refoule(g), 'route'), g);
      expect(r.erreurs).toEqual([]);
      expect(r.fin).toBeDefined();
      fins[r.fin!] = (fins[r.fin!] ?? 0) + 1;
    }
    expect(Object.keys(fins).length).toBeGreaterThan(1);
  });
});

describe('Mort possible à tout moment', () => {
  it('on peut mourir dans un combat mortel raté, en mission comme sur la route', () => {
    let morts = 0;
    for (let g = 1; g <= 60; g++) {
      const r = poursuivre(choisir(refoule(g), 'route'), g + 100);
      if (r.fin === 'mort') {
        morts++;
        expect(typeof r.etat.drapeaux['cause_mort']).toBe('string');
      }
    }
    expect(morts).toBeGreaterThan(0);
  });
  it('mourir ne dépend jamais du seul hasard : il faut avoir échoué un combat', () => {
    const r = simuler(creation({ difficulte: 'recit' }), 3);
    if (r.fin === 'mort') expect(r.etat.historique.some((h) => h.issue === 'echec')).toBe(true);
  });
  it('la fin de la route au chapitre 1 continue au chapitre 2 sur la route', () => {
    const fins: Record<string, number> = {};
    for (let g = 0; g < 25; g++) {
      const r = poursuivre(choisir(refoule(g), 'route'), g, 2000);
      if (!chapitreSuivantDisponible(r.etat)) continue;
      const r2 = poursuivre(chapitreSuivant(r.etat), g + 50, 2500);
      expect(r2.erreurs).toEqual([]);
      fins[r2.fin ?? '?'] = (fins[r2.fin ?? '?'] ?? 0) + 1;
    }
    expect((fins.chapitre_2_route ?? 0) + (fins.chapitre_2 ?? 0)).toBeGreaterThan(3);
  }, 120000);
});
