import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { nouvellePartie } from '../src/engine/moteur';
import { blocageApprentissage } from '../src/engine/maitrise';
import { avantageTechnique, bonusTechnique, risqueAllie } from '../src/engine/epreuves';
import { genererActivites, faireActivite } from '../src/engine/tempsLibre';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';
import type { CheckDef } from '../src/engine/types';

const base = () => {
  const s = nouvellePartie(creation({ village: 'kiri', clan: 'sans_clan', element: 'suiton' }), 3);
  s.jour = s.naissance + 14 * 360 + 5;
  s.jauges.chakraMax = 120;
  s.jauges.chakra = 120;
  s.tirages.prodige = false;
  s.creation.traits = s.creation.traits.filter((t) => t !== 'prodige');
  s.attributs.intellect = 40;
  s.attributs.controleChakra = 40;
  return s;
};
const nature = (s: ReturnType<typeof base>, e: string, tier: number) => {
  s.maitrises[`nature_${e}`] = { ...(s.maitrises[`nature_${e}`] ?? s.maitrises['ninjutsu']), id: `nature_${e}`, kind: 'element', awakened: true, tier: tier as 0 | 1 | 2 | 3 | 4 | 5 };
};

describe('Combinaisons de natures', () => {
  // Les techniques de base qu'exige la combinaison eau + foudre.
  const bases = (s: ReturnType<typeof base>) => {
    for (const id of ['suiton_projectile', 'raiton_decharge']) s.maitrises[id] = { ...s.maitrises['ninjutsu'], id, kind: 'jutsu', awakened: true, tier: 2 };
  };
  it('les dix paires de natures de base ont leur combinaison', () => {
    const combos = R.contenu.maitrises.filter((m) => m.technique?.categorie === 'combinaison' && m.technique.elements?.length === 2);
    expect(combos).toHaveLength(10);
    const paires = new Set(combos.map((m) => [...m.technique!.elements!].sort().join('+')));
    expect(paires.size).toBe(10);
  });
  it('exige les deux natures façonnées (palier 2)', () => {
    const s = base();
    nature(s, 'suiton', 2);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toMatch(/Raiton/);
    nature(s, 'raiton', 1);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toMatch(/palier 2/);
    nature(s, 'raiton', 2);
    // Les natures ne suffisent pas : il faut savoir lancer une technique de chacune.
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toMatch(/Projectile d’eau/);
    bases(s);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toBeUndefined();
  });
  it('les dix trinités de trois natures existent, rang A à SS, et se bâtissent sur deux combinaisons', () => {
    const trinites = R.contenu.maitrises.filter((m) => m.technique?.elements?.length === 3);
    expect(trinites).toHaveLength(10);
    expect(new Set(trinites.map((m) => [...m.technique!.elements!].sort().join('+'))).size).toBe(10);
    expect(trinites.every((m) => ['A', 'S', 'SS'].includes(m.rang!))).toBe(true);
    expect(trinites.every((m) => (m.technique!.requis ?? []).every((r) => R.maitrises[r.maitrise]?.technique?.categorie === 'combinaison'))).toBe(true);
    const s = base();
    for (const e of ['katon', 'fuuton', 'raiton'] as const) nature(s, e, 2);
    s.attributs.intellect = 40;
    s.attributs.controleChakra = 40;
    expect(blocageApprentissage(s, 'trinite_orage_solaire')).toMatch(/palier 3|Exige/);
  });
  it('un esprit vif mélange ses natures dès le palier 1', () => {
    const s = base();
    nature(s, 'suiton', 1);
    nature(s, 'raiton', 1);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toMatch(/palier 2/);
    s.attributs.intellect = 65;
    bases(s);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toBeUndefined();
  });
  it('n’encombre pas le temps libre avant l’éveil de la deuxième nature, puis s’apprend seul·e', () => {
    const s = base();
    nature(s, 'suiton', 2);
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.id === 'technique:combo_eau_foudre')).toBe(false);
    nature(s, 'raiton', 2);
    bases(s);
    const act = genererActivites(s).find((a) => a.id === 'technique:combo_eau_foudre');
    expect(act?.disponible).toBe(true);
    faireActivite(s, 'technique:combo_eau_foudre', nouveauCtx());
    expect(s.maitrises['combo_eau_foudre'].tier).toBeGreaterThanOrEqual(1);
    expect(s.drapeaux['combinaison_apprise']).toBe(true);
  });
  it('une seule nature dominante suffit pour l’avantage ; il faut les deux dominées pour le perdre', () => {
    // Eau + foudre contre le feu : l'eau domine → avantage. Contre la terre : la foudre domine → avantage.
    expect(avantageTechnique('combo_eau_foudre', 'katon')).toBe('fort');
    expect(avantageTechnique('combo_eau_foudre', 'doton')).toBe('fort');
    // Contre le vent : la foudre est dominée, l'eau est neutre → ni l'un ni l'autre.
    expect(avantageTechnique('combo_eau_foudre', 'fuuton')).toBeUndefined();
    const s = base();
    nature(s, 'suiton', 2);
    nature(s, 'raiton', 2);
    s.maitrises['combo_eau_foudre'] = { ...s.maitrises['ninjutsu'], id: 'combo_eau_foudre', kind: 'jutsu', awakened: true, tier: 1 };
    s.maitrises['suiton_bulles'] = { ...s.maitrises['ninjutsu'], id: 'suiton_bulles', kind: 'jutsu', awakened: true, tier: 1 };
    const t = { type: 'combat', difficulte: 50, elementAdverse: 'doton' } as unknown as CheckDef;
    expect(bonusTechnique(s, 'combo_eau_foudre', t)).toBeGreaterThan(bonusTechnique(s, 'suiton_bulles', t) + 15);
  });
});

describe('Chances des attaques spéciales', () => {
  const avec = (id: string, tier: number, trainingDays = 0) => {
    const s = base();
    s.maitrises[id] = { ...s.maitrises['ninjutsu'], id, kind: 'jutsu', awakened: true, tier: tier as 1, trainingDays };
    return s;
  };
  const combat = (difficulte: number, elementAdverse?: string) => ({ type: 'combat', difficulte, elementAdverse }) as unknown as CheckDef;

  it('une technique mieux maîtrisée frappe plus fort, et l’entraînement en cours compte déjà', () => {
    const t = combat(50);
    expect(bonusTechnique(avec('suiton_prison', 3), 'suiton_prison', t)).toBeGreaterThan(bonusTechnique(avec('suiton_prison', 1), 'suiton_prison', t) + 5);
    expect(bonusTechnique(avec('tai_poing', 2, 9999), 'tai_poing', t)).toBeGreaterThan(bonusTechnique(avec('tai_poing', 2), 'tai_poing', t));
  });
  it('une technique simple perd de son effet face à un adversaire de haut rang', () => {
    const s = avec('suiton_bulles', 2);
    expect(bonusTechnique(s, 'suiton_bulles', combat(64))).toBeLessThan(bonusTechnique(s, 'suiton_bulles', combat(40)));
  });
  it('l’avantage de nature pèse plus quand la nature est maîtrisée', () => {
    const s = avec('suiton_bulles', 1);
    nature(s, 'suiton', 1);
    const faible = bonusTechnique(s, 'suiton_bulles', combat(40, 'katon'));
    nature(s, 'suiton', 4);
    expect(bonusTechnique(s, 'suiton_bulles', combat(40, 'katon'))).toBeGreaterThan(faible);
    expect(bonusTechnique(s, 'suiton_bulles', combat(40, 'doton'))).toBeLessThan(bonusTechnique(s, 'suiton_bulles', combat(40)));
  });
});

describe('Récits de combat', () => {
  it('chaque attaque spéciale a son récit en duel et contre une escouade', () => {
    const sans = R.contenu.maitrises.filter((m) => m.technique?.offensive && !R.contenu.recitsTechniques[m.id]).map((m) => m.id);
    expect(sans).toEqual([]);
  });
  it('chaque combat du jeu est classé (duel ou escouade), et la table ne cite que des combats existants', () => {
    const combats = R.contenu.evenements.flatMap((ev) => ev.choix.filter((c) => c.test?.type === 'combat').map((c) => `${ev.id}/${c.id}`));
    expect(combats.filter((k) => !R.contenu.affrontements[k])).toEqual([]);
    expect(Object.keys(R.contenu.affrontements).filter((k) => !combats.includes(k))).toEqual([]);
  });
  it('une technique de zone frappe mieux une escouade, et ne menace les alliés que s’ils sont là', () => {
    const s = base();
    s.maitrises['katon_tempete'] = { ...s.maitrises['ninjutsu'], id: 'katon_tempete', kind: 'jutsu', awakened: true, tier: 1, trainingDays: 0 };
    const duel = { type: 'combat', difficulte: 50, forme: 'duel' } as unknown as CheckDef;
    const groupe = { ...duel, forme: 'escouade' } as CheckDef;
    expect(bonusTechnique(s, 'katon_tempete', groupe)).toBeGreaterThan(bonusTechnique(s, 'katon_tempete', duel));
    expect(risqueAllie(s, 'katon_tempete', groupe)).toBe(0);
    const avecAllies = { ...groupe, allies: true } as CheckDef;
    const debutant = risqueAllie(s, 'katon_tempete', avecAllies);
    expect(debutant).toBeGreaterThan(0);
    s.maitrises['katon_tempete'].tier = 4;
    expect(risqueAllie(s, 'katon_tempete', avecAllies)).toBeLessThan(debutant);
  });
});
