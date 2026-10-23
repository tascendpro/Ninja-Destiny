import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { nouvellePartie, choisir, manche, vueCombat, choixVisibles } from '../src/engine/moteur';
import { greffer, etatProgression } from '../src/engine/maitrise';
import { interpoler } from '../src/engine/texte';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';

describe('Combats en plusieurs manches', () => {
  it('un duel se joue en trois manches, une technique par manche, puis se conclut', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 4);
    s.jour = s.naissance + 14 * 360;
    s.rang = 'genin';
    s.maitrises['taijutsu'].tier = 2;
    s.maitrises['tai_poing'] = { ...s.maitrises['taijutsu'], id: 'tai_poing', kind: 'jutsu', tier: 2 };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    const ch = choixVisibles(s, R.evenements['c2_tournoi']).find((c) => c.id === 'frontal')!;
    expect(ch.manches).toBe(3);
    let t = choisir(s, 'frontal@tai_poing');
    expect(t.scene.type).toBe('combat');
    const v = vueCombat(t)!;
    expect(v.manche).toBe(1);
    expect(v.journal[0]).toContain('Poing ferré');
    // Quand l'adversaire prend l'initiative, on ne peut qu'esquiver ou contrer.
    const jouer = (x: typeof t, attaque: string) => manche(x, vueCombat(x)!.adversaire ? 'esquiver' : attaque);
    t = jouer(t, 'simple');
    t = jouer(t, vueCombat(t)!.attaques[0]?.id ?? 'simple');
    // Encore debout après ta dernière attaque, il lance un dernier assaut : le combat finit sur ta défense.
    if (t.scene.type === 'combat') {
      expect(t.scene.dernierAssaut).toBe(true);
      expect(vueCombat(t)!.adversaire).toBeTruthy();
      t = manche(t, 'esquiver');
    }
    expect(t.scene.type).toBe('resultat');
    expect(t.scene.type === 'resultat' && t.scene.texte).toContain('Manche 3');
  });
  it('quand l’adversaire prend l’initiative, sa technique s’esquive ou se contre, et rien d’autre', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 4);
    s.jour = s.naissance + 14 * 360;
    s.rang = 'genin';
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    let t = choisir(s, 'frontal');
    expect(t.scene.type).toBe('combat');
    if (t.scene.type !== 'combat') return;
    t.scene.priorite = 'adv_katon_boule';
    const v = vueCombat(t)!;
    expect(v.adversaire?.nom).toContain('Boule de feu');
    expect(v.adversaire!.esquive).toBeGreaterThan(0);
    expect(v.adversaire!.contre).toBeLessThan(v.adversaire!.esquive + 30);
    expect(() => manche(t, 'simple')).toThrow();
    const apres = manche(t, 'contrer');
    expect(apres.scene.type === 'combat' ? apres.scene.journal.at(-1) : '').toContain('Boule de feu');
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
