import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { coutDojutsu } from '../src/engine/epreuves';
import { genererActivites, naturesActivite } from '../src/engine/tempsLibre';
import type { GameState } from '../src/engine/types';

const uchiha = (ageAns: number, tier: number, anneesAuPalier: number): GameState => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 3);
  s.jour = s.naissance + ageAns * 360;
  const sh = s.maitrises['sharingan'];
  sh.awakened = true;
  sh.tier = tier as 1;
  sh.palierDepuis = s.jour - anneesAuPalier * 360;
  return s;
};

describe('Dōjutsu : des yeux qui se paient en chakra', () => {
  it('un tomoe éveillé à 6 ans coûte cher, puis le corps s’y habitue à 8 ans', () => {
    const debut = coutDojutsu(uchiha(6, 1, 0), 'sharingan');
    const habitue = coutDojutsu(uchiha(8, 1, 2), 'sharingan');
    expect(habitue).toBeLessThan(debut);
  });
  it('passer à deux tomoe fait remonter le coût', () => {
    const un = coutDojutsu(uchiha(14, 1, 3), 'sharingan');
    const deux = coutDojutsu(uchiha(14, 2, 0), 'sharingan');
    expect(deux).toBeGreaterThan(un);
  });
  it('un corps d’enfant paie plus cher qu’un adulte au même palier', () => {
    expect(coutDojutsu(uchiha(9, 2, 0), 'sharingan')).toBeGreaterThan(coutDojutsu(uchiha(20, 2, 0), 'sharingan'));
  });
  it('ouvrir ses yeux prend la manche ; ils se paient ensuite, et s’éteignent faute de chakra', () => {
    const s = uchiha(16, 2, 0);
    s.rang = 'genin';
    s.jauges.chakraMax = 200;
    s.jauges.chakra = 200;
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    let t = choisir(s, 'frontal');
    if (t.scene.type !== 'affrontement') return;
    t.scene.plafond = 10;
    const pouvoir = vueAffrontement(t)!.familles.find((f) => f.id === 'pouvoir');
    expect(pouvoir?.actions.map((a) => a.id)).toContain('sharingan');
    t = combattre(t, { famille: 'pouvoir', choix: 'sharingan' });
    if (t.scene.type !== 'affrontement') return;
    expect(t.scene.dojutsu).toBe('sharingan');
    t.jauges.chakra = 0;
    t = combattre(t, { famille: 'defense', choix: 'garde' });
    if (t.scene.type === 'affrontement') {
      expect(t.scene.dojutsu).toBeUndefined();
      expect(t.scene.journal.at(-1)!.impact).toContain('Tes yeux s’éteignent');
    }
  });
});

describe('Temps libre', () => {
  it('on ne peut pas entraîner ce qui demande un niveau qu’on n’a pas', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), 3);
    s.jour = s.naissance + 9 * 360;
    s.maitrises['taijutsu'].tier = 2;
    s.maitrises['taijutsu'].trainingDays = 0;
    s.scene = { type: 'temps_libre' };
    const bloquees = genererActivites(s).filter((a) => a.id.startsWith('entrainer:') && !a.disponible);
    for (const a of bloquees) expect(a.raison).toBeTruthy();
    expect(genererActivites(s).filter((a) => a.id.startsWith('entrainer:') && a.disponible && a.alerte)).toEqual([]);
  });
});

describe('Couleurs des natures', () => {
  it('chaque amélioration liée à une nature la reconnaît : nature, lignée, technique, combinaison', () => {
    expect(naturesActivite({ id: 'nature:katon' })).toEqual(['katon']);
    expect(naturesActivite({ id: 'entrainer:nature_suiton' })).toEqual(['suiton']);
    expect(naturesActivite({ id: 'technique:katon_boule' })).toEqual(['katon']);
    expect(naturesActivite({ id: 'entrainer:yoton' })).toEqual(['yoton']);
    expect(naturesActivite({ id: 'technique:futton_gokamugen' })).toEqual(['futton']);
    expect(naturesActivite({ id: 'technique:combo_eau_foudre' })).toEqual(['suiton', 'raiton']);
    expect(naturesActivite({ id: 'entrainer:taijutsu' })).toEqual([]);
  });
});

describe('Quand l’ennemi frappe le premier', () => {
  const duel = (graine: number) => {
    const s = nouvellePartie(creation({ village: 'kiri', clan: 'sans_clan', element: 'suiton' }), graine);
    s.jour = s.naissance + 16 * 360;
    s.rang = 'genin';
    s.jauges.chakraMax = 200;
    s.jauges.chakra = 200;
    s.maitrises['kawarimi'] = { ...s.maitrises['taijutsu'], id: 'kawarimi', kind: 'jutsu', awakened: true, tier: 3, trainingDays: 0 };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    return choisir(s, 'frontal');
  };

  it('parfois, il attaque dès la première manche, et l’annonce le laisse deviner', () => {
    let attaques = 0;
    for (let g = 1; g <= 60; g++) {
      const t = duel(g);
      if (t.scene.type === 'affrontement' && t.scene.manche === 1 && ['attaque', 'technique', 'majeure'].includes(t.scene.intention)) attaques++;
    }
    expect(attaques).toBeGreaterThan(3);
    expect(attaques).toBeLessThan(60);
  });

  it('la permutation est une vraie défense : réussie, tu surgis dans son dos', () => {
    let dos = 0;
    for (let g = 1; g <= 40; g++) {
      const t = duel(g);
      if (t.scene.type !== 'affrontement') continue;
      t.scene.intention = 'attaque';
      t.scene.plafond = 10;
      const apres = combattre(t, { famille: 'defense', choix: 'permutation' });
      if (apres.scene.type === 'affrontement' && apres.scene.ouverture >= 20) dos++;
    }
    expect(dos).toBeGreaterThan(10);
  });

});
