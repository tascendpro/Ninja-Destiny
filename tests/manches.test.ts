import { describe, expect, it } from 'vitest';
import { creation, jouerCombat } from './aide';
import { nouvellePartie, choisir, combattre, choixVisibles } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { greffer, etatProgression } from '../src/engine/maitrise';
import { interpoler } from '../src/engine/texte';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';

describe('Tous les combats passent par l’Affrontement', () => {
  const genin = (graine = 4) => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), graine);
    s.jour = s.naissance + 14 * 360;
    s.rang = 'genin';
    s.maitrises['taijutsu'].tier = 2;
    s.maitrises['tai_poing'] = { ...s.maitrises['taijutsu'], id: 'tai_poing', kind: 'jutsu', tier: 2 };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    return s;
  };
  it('un duel sans fiche propre s’ouvre en affrontement, se joue manche par manche, puis se conclut sur le texte de la scène', () => {
    const s = genin();
    const ch = choixVisibles(s, R.evenements['c2_tournoi']).find((c) => c.id === 'frontal')!;
    expect(ch.affrontement).toBeDefined();
    let t = choisir(s, 'frontal');
    expect(t.scene.type).toBe('affrontement');
    const v = vueAffrontement(t)!;
    expect(v.familles.some((f) => f.actions.some((a) => a.id === 'tai_poing'))).toBe(true);
    t = jouerCombat(t, (vv) => (vv.familles.find((f) => f.id === 'taijutsu')?.actions.some((a) => a.id === 'tai_poing' && a.disponible) ? { famille: 'taijutsu', choix: 'tai_poing' } : undefined));
    expect(t.scene.type).toBe('resultat');
  });
  it('une esquive réussie à la dernière manche n’achève pas le combat : il reste une manche pour contre-attaquer', () => {
    let vu = false;
    for (let g = 1; g < 60 && !vu; g++) {
      const s = genin(g);
      let t = choisir(s, 'frontal');
      if (t.scene.type !== 'affrontement') continue;
      t.scene.plafond = t.scene.manche;
      t = combattre(t, { famille: 'defense', choix: 'esquive' });
      if (t.scene.type === 'affrontement' && t.scene.prolonge) {
        vu = true;
        expect(t.scene.plafond).toBe(t.scene.manche);
        t = combattre(t, { famille: 'taijutsu', choix: 'frappe_rapide' });
        expect(t.scene.type).not.toBe('affrontement');
      }
    }
    expect(vu).toBe(true);
  });
});

describe('Dōjutsu greffés et deuil', () => {
  it('un œil greffé arrive éveillé, coûte de la réserve et plafonne au palier 3', () => {
    const s = nouvellePartie(creation({ village: 'kumo', clan: 'sans_clan', element: 'raiton' }), 4);
    const avant = s.jauges.chakraMax;
    expect(greffer(s, 'sharingan', nouveauCtx())).toBe(true);
    expect(s.maitrises['sharingan'].awakened).toBe(true);
    expect(s.jauges.chakraMax).toBe(avant - 15);
    s.maitrises['sharingan'].tier = 3;
    expect(etatProgression(s, 'sharingan')?.inutile).toBe(true);
  });
  it('le deuil familial existe et peut éveiller le Sharingan', () => {
    const ev = R.evenements['x_deuil_famille'];
    expect(JSON.stringify(ev.choix)).toContain('sharingan');
  });
});

describe('Textes', () => {
  it('aucun jeton ne reste entre accolades, même sans aîné·e ni rival', () => {
    const s = nouvellePartie(creation({ village: 'suna', clan: 'sans_clan', element: 'fuuton' }), 4);
    delete s.roles['aine'];
    delete s.roles['rival'];
    const t = interpoler('{aineNom} et {@rival} et {AineNom}', s);
    expect(t).not.toMatch(/[{}]/);
  });
});

describe('Six chapitres', () => {
  it('le chapitre 5 (la voie) s’ouvre après le 4, et l’héritage devient le 6', () => {
    expect(R.fins['chapitre_4'].suite).toBe('c5v_ouverture');
    expect(R.fins['chapitre_5'].suite).toBe('c5_ouverture');
    expect(R.evenements['c5_ouverture'].chapitre).toBe(6);
  });
});
