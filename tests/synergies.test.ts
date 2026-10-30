import { describe, expect, it } from 'vitest';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement, accorderAdv } from '../src/engine/combat/affrontement';
import { marquerTerrain, synergiePour, vieillirTerrain } from '../src/engine/combat/terrain';
import { SYNERGIES } from '../src/content/combat/synergies';
import { TEXTES_NATURES, TECHNIQUES_NATURES } from '../src/content/techniquesNatures';
import { R } from '../src/engine/registre';
import type { GameState } from '../src/engine/types';
import { creation } from './aide';

const NATURES = ['katon', 'suiton', 'raiton', 'fuuton', 'doton'] as const;

/** Un genin qui maîtrise les cinq natures au palier 3 et quelques techniques de chacune, prêt à entrer en combat. */
function combat(graine = 13, techniques: string[] = []): GameState {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'suiton' }), graine);
  s.jour = s.naissance + 17 * 360;
  s.rang = 'chunin';
  s.jauges.chakraMax = 300;
  s.jauges.chakra = 300;
  for (const n of NATURES) s.maitrises[`nature_${n}`] = { ...s.maitrises['ninjutsu'], id: `nature_${n}`, kind: 'element', awakened: true, tier: 3 };
  for (const id of techniques) s.maitrises[id] = { ...s.maitrises['ninjutsu'], id, kind: 'jutsu', awakened: true, tier: 3 };
  s.scene = { type: 'evenement', id: 'c2_tournoi' };
  const t = choisir(s, 'frontal');
  if (t.scene.type === 'affrontement') {
    t.scene.plafond = 12;
    t.scene.terrain = {};
  }
  return t;
}

describe('Le terrain et les enchaînements de natures', () => {
  it('l’ordre compte : l’eau puis la foudre n’est pas la foudre puis l’eau', () => {
    const s = combat();
    if (s.scene.type !== 'affrontement') throw new Error('pas de combat');
    const sc = s.scene;
    sc.sceaux = ['suiton'];
    marquerTerrain(sc, 'suiton', undefined);
    const eauFoudre = synergiePour(s, sc, 'raiton')!;
    expect(eauFoudre.def.nom).toBe('Propagation conductrice');
    expect(eauFoudre.effet).toBe('sonne');
    sc.sceaux = ['raiton'];
    const foudreEau = synergiePour(s, sc, 'suiton')!;
    expect(foudreEau.def.nom).toBe('Courant porteur');
    expect(foudreEau.puissance).toBeLessThan(eauFoudre.puissance);
  });

  it('chaque paire de natures différentes a son enchaînement, dans les deux sens, avec ses récits', () => {
    for (const a of NATURES)
      for (const b of NATURES) {
        if (a === b) continue;
        const def = SYNERGIES[`${a}>${b}`];
        expect(def, `${a}>${b}`).toBeDefined();
        expect(def.recits.length, `${a}>${b}`).toBeGreaterThanOrEqual(2);
      }
  });

  it('le terrain garde la trace de l’eau quelques manches, puis sèche ; sans eau, la foudre ne se propage qu’à moitié', () => {
    const s = combat();
    if (s.scene.type !== 'affrontement') throw new Error('pas de combat');
    const sc = s.scene;
    marquerTerrain(sc, 'suiton', undefined);
    expect(sc.terrain?.humide).toBe(3);
    sc.sceaux = ['suiton', null];
    // Une action sans nature entre les deux : l'eau est toujours là, l'enchaînement tient, un peu moins fort.
    const differee = synergiePour(s, sc, 'raiton')!;
    sc.sceaux = ['suiton'];
    const directe = synergiePour(s, sc, 'raiton')!;
    expect(differee.puissance).toBeLessThan(directe.puissance);
    vieillirTerrain(sc);
    vieillirTerrain(sc);
    vieillirTerrain(sc);
    expect(sc.terrain?.humide).toBeUndefined();
    const sec = synergiePour(s, sc, 'raiton')!;
    expect(sec.niveau).toBe('leger');
  });

  it('au bord de la mer, l’eau est déjà là : la foudre trouve un terrain favorable sans technique d’avant', () => {
    const s = combat();
    if (s.scene.type !== 'affrontement') throw new Error('pas de combat');
    s.scene.terrain = { humide: 99 };
    s.scene.sceaux = [];
    const syn = synergiePour(s, s.scene, 'raiton')!;
    expect(syn.parTerrain).toBe(true);
    vieillirTerrain(s.scene);
    expect(s.scene.terrain?.humide).toBe(99);
  });

  it('le même enchaînement, joué encore et encore, finit par se lire : il ne surprend plus', () => {
    const s = combat();
    if (s.scene.type !== 'affrontement') throw new Error('pas de combat');
    const sc = s.scene;
    sc.sceaux = ['fuuton'];
    marquerTerrain(sc, 'fuuton', undefined);
    const neuf = synergiePour(s, sc, 'katon')!;
    sc.chainesVues = { 'fuuton>katon': 2 };
    const lu = synergiePour(s, sc, 'katon')!;
    expect(lu.lue).toBe(true);
    expect(lu.precision).toBe(0);
    expect(lu.puissance).toBeLessThan(neuf.puissance);
  });

  it('l’eau sur le feu se change en vapeur : un compromis, pas un bonus', () => {
    const s = combat();
    if (s.scene.type !== 'affrontement') throw new Error('pas de combat');
    const sc = s.scene;
    marquerTerrain(sc, 'katon', undefined);
    sc.sceaux = ['katon'];
    const syn = synergiePour(s, sc, 'suiton')!;
    expect(syn.niveau).toBe('compromis');
    expect(syn.puissance).toBeLessThan(0);
    marquerTerrain(sc, 'suiton', syn);
    expect(sc.terrain?.brulant).toBeUndefined();
    expect(sc.terrain?.vapeur).toBeGreaterThan(0);
  });

  it('en vrai combat, l’eau puis la foudre se raconte et s’inscrit dans la manche, et le rejeu donne le même combat', () => {
    let vu = false;
    for (let g = 1; g < 80 && !vu; g++) {
      let s = combat(g, ['suiton_vague_rupture', 'raiton_reseau']);
      if (s.scene.type !== 'affrontement') continue;
      s = combattre(s, { famille: 'ninjutsu', choix: 'suiton_vague_rupture' });
      if (s.scene.type !== 'affrontement' || s.scene.journal.at(-1)?.issue === 'ratee') continue;
      expect(s.scene.terrain?.humide).toBeGreaterThan(0);
      const foudre = vueAffrontement(s)!.familles.find((f) => f.id === 'ninjutsu')?.actions.find((a) => a.id === 'raiton_reseau');
      if (!foudre?.disponible) continue;
      expect(foudre.marques).toContain('synergie possible');
      expect(vueAffrontement(s)!.enchainements.some((e) => e.nom === 'Propagation conductrice')).toBe(true);
      const avant = s;
      s = combattre(s, { famille: 'ninjutsu', choix: 'raiton_reseau' });
      const e = s.scene.type === 'affrontement' ? s.scene.journal.at(-1) : undefined;
      if (!e || e.issue === 'ratee' || e.issue === 'predite' || !e.synergie) continue;
      expect(e.synergie.nom).toBe('Propagation conductrice');
      expect(e.impact).not.toMatch(/\{|\}/);
      // Aucun tirage en plus : la même manche, rejouée depuis le même état, donne exactement le même récit.
      const bis = combattre(avant, { famille: 'ninjutsu', choix: 'raiton_reseau' });
      expect(JSON.stringify(bis.scene)).toBe(JSON.stringify(s.scene));
      vu = true;
    }
    expect(vu).toBe(true);
  });
});

describe('Les techniques des cinq natures', () => {
  it('chaque nature a ses techniques de tous les rangs, du D au S', () => {
    for (const n of NATURES) {
      const rangs = new Set(TECHNIQUES_NATURES.filter((t) => t.element === n).map((t) => t.rang));
      for (const r of ['D', 'C', 'B', 'A', 'S']) expect(rangs.has(r as never), `${n} ${r}`).toBe(true);
    }
  });

  it('une technique de rang S exige d’abord une technique de rang A de sa nature', () => {
    for (const t of TECHNIQUES_NATURES.filter((x) => x.rang === 'S')) {
      const requis = t.technique!.requis!.map((x) => x.maitrise);
      expect(requis.some((id) => R.maitrises[id]?.rang === 'A'), t.id).toBe(true);
    }
  });

  it('chaque technique a ses récits, accordés à une adversaire sans jeton oublié', () => {
    for (const t of TECHNIQUES_NATURES) {
      const tx = TEXTES_NATURES[t.id];
      expect(tx.loin?.length, t.id).toBeGreaterThan(0);
      if (!t.technique!.tactique?.defense) expect(tx.sombre?.length, t.id).toBeGreaterThan(0);
      for (const l of [...(tx.loin ?? []), ...(tx.proche ?? []), ...(tx.sombre ?? [])]) expect(accorderAdv(l, 'f'), t.id).not.toMatch(/\{|\}/);
    }
  });

  it('un mur de terre se lance depuis la défense, pas depuis le ninjutsu, et arrête une part du coup', () => {
    const s = combat(3, ['doton_rempart', 'doton_pointe']);
    const v = vueAffrontement(s)!;
    expect(v.familles.find((f) => f.id === 'ninjutsu')?.actions.some((a) => a.id === 'doton_rempart')).toBe(false);
    expect(v.familles.find((f) => f.id === 'defense')?.actions.some((a) => a.id === 'doton_rempart')).toBe(true);
    const t = combattre(s, { famille: 'defense', choix: 'doton_rempart' });
    if (t.scene.type === 'affrontement') expect(t.scene.terrain?.roches).toBeGreaterThan(0);
  });
});
