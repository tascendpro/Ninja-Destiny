import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { activite, choisir, nouvellePartie } from '../src/engine/moteur';
import { evenementDisponible } from '../src/engine/selection';
import { ageMinTechnique } from '../src/engine/maitrise';
import { R } from '../src/engine/registre';
import { combinaisons, creation } from './aide';

function enfant(clan: string, ageAns: number, graine = 1, element?: string): GameState {
  const c = combinaisons().find((x) => x.clan === clan)!;
  const s = nouvellePartie(creation({ ...c, ...(element ? { element: element as never } : {}) }), graine);
  s.jour = s.naissance + 360 * ageAns;
  return s;
}

describe('L’apprentissage de 6 à 12 ans', () => {
  it('chaque enfant, de chaque clan, reçoit la leçon de son clan vers 9 ans', () => {
    for (const clan of R.contenu.clans.map((c) => c.id)) {
      const s = enfant(clan, 9);
      expect(evenementDisponible(s, R.evenements['ap_lecon_clan']), clan).toBe(true);
    }
  });

  it('un Uchiha apprend la Grande boule de feu même sans affinité, et la nature du feu s’éveille avec', () => {
    const s = enfant('uchiha', 9, 3, 'suiton');
    expect(s.maitrises['nature_katon']).toBeUndefined();
    s.scene = { type: 'evenement', id: 'ap_lecon_clan' };
    const r = choisir(s, 'aine');
    expect(r.maitrises['katon_boule']?.tier).toBe(1);
    expect(r.maitrises['nature_katon']?.tier).toBe(1);
    // Enseignée par le clan, la technique de rang C se pratique dès 9 ans.
    expect(ageMinTechnique(r, R.maitrises['katon_boule']).age).toBe(9);
  });

  it('un sans-clan apprend la technique de sa propre nature, de la main de son aîné·e', () => {
    const s = enfant('sans_clan', 9, 5, 'raiton');
    s.scene = { type: 'evenement', id: 'ap_lecon_clan' };
    const r = choisir(s, 'aine');
    expect(r.maitrises['raiton_decharge']?.tier).toBe(1);
  });

  it('l’aîné·e entraîne l’enfant dès 6 ans, et l’arc se poursuit par des fils', () => {
    const s = enfant('nara', 6);
    expect(evenementDisponible(s, R.evenements['ap_aine_premier'])).toBe(true);
    s.scene = { type: 'evenement', id: 'ap_aine_premier' };
    const r = choisir(s, 'chakra');
    expect(r.planifies.some((p) => p.evenementId === 'ap_aine_deuxieme')).toBe(true);
  });

  it('s’entraîner rapporte des points dans ce qu’on travaille, et en coûte quand on force épuisé·e', () => {
    let gains = 0;
    let pertes = 0;
    for (let g = 1; g <= 60; g++) {
      const frais = enfant('nara', 12, g);
      frais.scene = { type: 'temps_libre' };
      const avant = frais.attributs.force + frais.attributs.agilite;
      const r = activite(frais, 'entrainer:taijutsu');
      if (r.attributs.force + r.attributs.agilite > avant) gains++;
      const epuise = enfant('nara', 12, g);
      epuise.scene = { type: 'temps_libre' };
      epuise.jauges.fatigue = 80;
      const avantE = epuise.attributs.force + epuise.attributs.agilite;
      const rE = activite(epuise, 'entrainer:taijutsu');
      if (rE.attributs.force + rE.attributs.agilite < avantE) pertes++;
    }
    expect(gains).toBeGreaterThan(10);
    expect(pertes).toBeGreaterThan(5);
  });

  it('un genin a de quoi faire : au moins 14 missions de rang D, dont plusieurs où l’on peut mourir', () => {
    const d = R.contenu.missions.filter((m) => m.rang === 'D');
    expect(d.length).toBeGreaterThanOrEqual(14);
    const mortelles = d.filter((m) => JSON.stringify(R.evenements[m.evenement]).includes('"letal":true'));
    expect(mortelles.length).toBeGreaterThanOrEqual(4);
    expect(R.contenu.missions.filter((m) => m.rang === 'C').length).toBeGreaterThanOrEqual(8);
  });
});
