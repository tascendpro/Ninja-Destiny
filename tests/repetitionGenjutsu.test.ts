import { describe, expect, it } from 'vitest';
import type { ElementId, GameState } from '../src/engine/types';
import { nouvellePartie, vueEvenement } from '../src/engine/moteur';
import { entrerEvenement, evenementDisponible } from '../src/engine/selection';
import { blocagePalier, etatProgression, porteurJoueur, progresser } from '../src/engine/maitrise';
import { R } from '../src/engine/registre';
import { creation } from './aide';

function adulte(clan: string, element: ElementId = 'katon'): GameState {
  const s = nouvellePartie(creation({ village: 'konoha', clan, element }), 7);
  s.jour = s.naissance + 30 * 360;
  s.rang = 'jonin';
  return s;
}

describe('Une scène ne se répète pas à l’identique', () => {
  it('le vieux aux brochettes ne revient pas', () => {
    expect(R.evenements['vf_racket'].repetable).toBeUndefined();
    expect(R.evenements['vf_demonstration'].repetable).toBeUndefined();
  });

  it('une rencontre répétable sans variante de passage ne se joue qu’une fois', () => {
    const s = adulte('sans_clan');
    const ev = R.evenements['r_surmenage'];
    s.evenementsVus[ev.id] = { n: 1, dernier: s.jour - 10_000 };
    expect(evenementDisponible(s, ev)).toBe(false);
  });

  it('une séance d’entraînement revient avec un autre texte', () => {
    const s = adulte('sans_clan');
    s.jour = s.naissance + 9 * 360;
    s.rang = 'eleve';
    const id = 'ap_aine_seance_course';
    entrerEvenement(s, id);
    const premier = vueEvenement(s)!.texte;
    s.jour += 400;
    entrerEvenement(s, id);
    const second = vueEvenement(s)!.texte;
    expect(s.drapeaux['passage']).toBe(2);
    expect(second).not.toBe(premier);
    expect(second).toContain('Revanche');
  });
});

describe('Le genjutsu plafonne sans dōjutsu', () => {
  const pousser = (s: GameState) => {
    const ms = s.maitrises['genjutsu'];
    ms.tier = 3;
    ms.trainingDays = 100_000;
    ms.combatUses = 1000;
    s.drapeaux['transcendance:genjutsu'] = true;
  };

  it('sans œil, le genjutsu s’arrête au palier 3', () => {
    const s = adulte('sans_clan');
    pousser(s);
    expect(blocagePalier(porteurJoueur(s), 'genjutsu')).toBe('oeil');
    expect(progresser(porteurJoueur(s), 'genjutsu')).toEqual([]);
    const e = etatProgression(s, 'genjutsu')!;
    expect(e.inutile).toBe(true);
    expect(e.murTexte).toMatch(/Sharingan/);
  });

  it('un Sharingan éveillé ouvre les paliers 4 et 5 ; un Byakugan non', () => {
    const u = adulte('uchiha');
    pousser(u);
    u.maitrises['sharingan'].awakened = true;
    u.maitrises['sharingan'].tier = 1;
    expect(progresser(porteurJoueur(u), 'genjutsu')).toEqual([4, 5]);

    const h = adulte('hyuga', 'fuuton');
    pousser(h);
    h.maitrises['byakugan'].awakened = true;
    h.maitrises['byakugan'].tier = 3;
    expect(blocagePalier(porteurJoueur(h), 'genjutsu')).toBe('oeil');
  });
});
