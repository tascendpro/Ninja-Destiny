import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { choisir, manche, nouvellePartie, vueCombat } from '../src/engine/moteur';
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
  it('activer ses yeux ne coûte pas la manche ; ils se paient ensuite, et s’éteignent faute de chakra', () => {
    const s = uchiha(16, 2, 0);
    s.rang = 'genin';
    s.jauges.chakraMax = 200;
    s.jauges.chakra = 200;
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    let t = choisir(s, 'frontal');
    if (t.scene.type === 'combat') t.scene.priorite = undefined;
    const avant = vueCombat(t)!;
    expect(avant.dojutsu.map((d) => d.id)).toContain('sharingan');
    t = manche(t, 'dojutsu:sharingan');
    const apres = vueCombat(t)!;
    expect(apres.manche).toBe(avant.manche);
    expect(apres.dojutsu.find((d) => d.actif)?.id).toBe('sharingan');
    t.jauges.chakra = 1;
    if (t.scene.type === 'combat') t.scene.priorite = undefined;
    t = manche(t, 'simple');
    if (t.scene.type === 'combat') {
      expect(t.scene.dojutsu).toBeUndefined();
      expect(t.scene.journal.join(' ')).toContain('Tes yeux s’éteignent');
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
    s.maitrises['suiton_projectile'] = { ...s.maitrises['taijutsu'], id: 'suiton_projectile', kind: 'jutsu', awakened: true, tier: 2, trainingDays: 0 };
    s.maitrises['nature_suiton'].tier = 3;
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    const t = choisir(s, 'frontal');
    if (t.scene.type === 'combat') {
      t.scene.priorite = 'adv_katon_boule';
      t.scene.ouverture = false;
    }
    return t;
  };

  it('parfois, il attaque avant même la première manche', () => {
    let embuscades = 0;
    for (let g = 1; g <= 60; g++) {
      const s = nouvellePartie(creation(), g);
      s.jour = s.naissance + 16 * 360;
      s.rang = 'genin';
      s.scene = { type: 'evenement', id: 'c2_tournoi' };
      const t = choisir(s, 'frontal');
      if (t.scene.type === 'combat' && t.scene.manche === 0 && t.scene.priorite) embuscades++;
    }
    expect(embuscades).toBeGreaterThan(3);
    expect(embuscades).toBeLessThan(50);
  });

  it('la permutation est une vraie défense : réussie, tu surgis dans son dos', () => {
    let dos = 0;
    for (let g = 1; g <= 40; g++) {
      const t = duel(g);
      const v = vueCombat(t)!;
      expect(v.adversaire?.permutationChance).toBeGreaterThan(v.adversaire!.esquive - 20);
      const apres = manche(t, 'permutation');
      if (apres.scene.type === 'combat' && apres.scene.dos) dos++;
    }
    expect(dos).toBeGreaterThan(10);
  });

  it('on peut contrer avec une technique, et ta nature qui domine la sienne aide', () => {
    const t = duel(5);
    const contre = vueCombat(t)!.adversaire!.contres.find((c) => c.id === 'suiton_projectile')!;
    expect(contre.avantage).toBe('fort');
    expect(contre.chance).toBeGreaterThan(vueCombat(t)!.adversaire!.contre);
    const apres = manche(t, 'contrer:suiton_projectile');
    expect(apres.scene.type === 'combat' ? apres.scene.journal.at(-1) : '').toContain('Tu contres avec');
  });
});
