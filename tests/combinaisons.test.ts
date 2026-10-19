import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { nouvellePartie } from '../src/engine/moteur';
import { blocageApprentissage } from '../src/engine/maitrise';
import { avantageTechnique, bonusTechnique } from '../src/engine/epreuves';
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
  it('les dix paires de natures de base ont leur combinaison', () => {
    const combos = R.contenu.maitrises.filter((m) => m.technique?.categorie === 'combinaison');
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
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toBeUndefined();
  });
  it('un esprit vif mélange ses natures dès le palier 1', () => {
    const s = base();
    nature(s, 'suiton', 1);
    nature(s, 'raiton', 1);
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toMatch(/palier 2/);
    s.attributs.intellect = 65;
    expect(blocageApprentissage(s, 'combo_eau_foudre')).toBeUndefined();
  });
  it('n’encombre pas le temps libre avant l’éveil de la deuxième nature, puis s’apprend seul·e', () => {
    const s = base();
    nature(s, 'suiton', 2);
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.id === 'technique:combo_eau_foudre')).toBe(false);
    nature(s, 'raiton', 2);
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
