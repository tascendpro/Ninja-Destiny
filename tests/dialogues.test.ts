import { describe, expect, it } from 'vitest';
import { DIALOGUES } from '../src/content/evenements/dialogues';
import { R } from '../src/engine/registre';
import { choisir, continuer, nouvellePartie } from '../src/engine/moteur';
import { entrerEvenement } from '../src/engine/selection';
import { creation } from './aide';
import { GESTES } from '../src/content/combat/gestes';
import { gesteEnchaine } from '../src/engine/combat/gestes';
import type { EtatAffrontement } from '../src/engine/combat/types';

describe('Les conversations en plusieurs temps', () => {
  it('chaque réponse a un ton ; chaque suite existe et n’est atteinte que par une réponse', () => {
    const atteintes = new Set<string>();
    for (const ev of DIALOGUES) {
      expect(R.evenements[ev.id], ev.id).toBeDefined();
      for (const ch of ev.choix) {
        expect(ch.ton, `${ev.id}/${ch.id}`).toBeDefined();
        if (ch.suite) {
          expect(R.evenements[ch.suite]?.enchaine, `${ev.id} → ${ch.suite}`).toBe(true);
          atteintes.add(ch.suite);
        }
      }
    }
    for (const ev of DIALOGUES.filter((e) => e.enchaine)) expect(atteintes.has(ev.id), ev.id).toBe(true);
  });

  it('une conversation se joue jusqu’au bout : l’ouverture, la suite choisie, puis la fin ; le ton est retenu', () => {
    let s = nouvellePartie(creation(), 7);
    s.jour = s.naissance + 360 * 12;
    s.rang = 'eleve';
    entrerEvenement(s, 'dg_veille_examen');
    s = choisir(s, 'franc');
    s = continuer(s);
    expect(s.scene).toEqual({ type: 'evenement', id: 'dg_veille_verite' });
    s = choisir(s, 'avouer');
    expect(s.drapeaux['dg_veille']).toBe('aveu');
    expect(s.drapeaux['ton_franc']).toBe(2);
  });
});

describe('Les enchaînements de gestes', () => {
  const sc = (actions: string[], familles: EtatAffrontement['famillesJoueur'], extra: Partial<EtatAffrontement> = {}) =>
    ({ actionsJoueur: actions, famillesJoueur: familles, ouverture: 0, ...extra }) as EtatAffrontement;

  it('observer puis frapper, c’est le coup lu ; deux observations, la lecture profonde', () => {
    expect(gesteEnchaine(sc(['observer'], ['observation']), 'taijutsu', 'frappe_rapide')?.id).toBe('coup_lu');
    expect(gesteEnchaine(sc(['observer', 'observer'], ['observation', 'observation']), 'arme', 'coupe')?.id).toBe('lecture_double');
  });

  it('la rafale veut trois gestes différents', () => {
    expect(gesteEnchaine(sc(['frappe_rapide', 'balayage'], ['taijutsu', 'taijutsu']), 'taijutsu', 'coup_puissant')?.id).toBe('rafale');
    expect(gesteEnchaine(sc(['frappe_rapide', 'frappe_rapide'], ['taijutsu', 'taijutsu']), 'taijutsu', 'coup_puissant')?.id).not.toBe('rafale');
  });

  it('le contre exige une ouverture gagnée ; la colère, une provocation qui a pris', () => {
    expect(gesteEnchaine(sc(['esquive'], ['defense']), 'taijutsu', 'frappe_rapide')).toBeUndefined();
    expect(gesteEnchaine(sc(['esquive'], ['defense'], { ouverture: 10 }), 'taijutsu', 'frappe_rapide')?.id).toBe('contre');
    expect(gesteEnchaine(sc(['provoquer'], ['parole']), 'ninjutsu', 'katon_boule')).toBeUndefined();
    expect(gesteEnchaine(sc(['provoquer'], ['parole'], { provoque: true }), 'ninjutsu', 'katon_boule')?.id).toBe('colere');
  });

  it('chaque enchaînement a un récit et un nom', () => {
    for (const g of GESTES) {
      expect(g.recits.length, g.id).toBeGreaterThan(0);
      expect(g.nom.length, g.id).toBeGreaterThan(3);
    }
  });
});
