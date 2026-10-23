import { describe, expect, it } from 'vitest';
import { choisir, continuer, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { R } from '../src/engine/registre';
import { rangArme } from '../src/engine/armes';
import { creation, jouerCombat } from './aide';

describe('L’arme : un combat sans chakra', () => {
  const genin = () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), 8);
    s.jour = s.naissance + 15 * 360;
    s.rang = 'genin';
    s.maitrises['katon_boule'] = { ...s.maitrises['ninjutsu'], id: 'katon_boule', kind: 'jutsu', awakened: true, tier: 2 };
    s.scene = { type: 'evenement', id: 'ex_lames' };
    return s;
  };

  it('l’épreuve des lames prête un sabre, interdit le ninjutsu et les pouvoirs, et se joue à l’arme', () => {
    let t = choisir(genin(), 'arme_pretee');
    expect(t.armeEquipee).toBe('tanto_simple');
    t = continuer(t);
    expect(t.scene.type === 'evenement' && t.scene.id).toBe('ex_lames_duel');
    t = choisir(t, 'combattre');
    expect(t.scene.type).toBe('affrontement');
    const familles = vueAffrontement(t)!.familles.map((f) => f.id);
    expect(familles).not.toContain('ninjutsu');
    expect(familles).not.toContain('pouvoir');
    const arme = vueAffrontement(t)!.familles.find((f) => f.id === 'arme')!;
    expect(arme.actions.map((a) => a.id)).toEqual(expect.arrayContaining(['coupe', 'estoc', 'taille_lourde', 'degaine']));
    expect(arme.actions.every((a) => a.chakra === undefined)).toBe(true);
    const chakra = t.jauges.chakra;
    t = jouerCombat(t, () => ({ famille: 'arme', choix: 'coupe' }));
    expect(t.scene.type).toBe('resultat');
    expect(t.jauges.chakra).toBe(chakra);
    expect(['reussie', 'echouee']).toContain(t.drapeaux['epreuve_lames']);
  });

  it('les armes ont un rang qui permet de les comparer', () => {
    expect(rangArme(R.armes['kunai_academie'])).toBe('E');
    expect(['C', 'B']).toContain(rangArme(R.armes['katana_simple']));
    expect(['S', 'SS']).toContain(rangArme(R.armes['narukami']));
    expect(rangArme(R.armes['lame_sans_nom'])).toBe('SS');
  });
});
