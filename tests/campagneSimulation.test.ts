import { describe, expect, it } from 'vitest';
import { joueurActif } from '../src/engine/campagne/moteur';
import { finie } from '../src/engine/campagne/outils';
import { AXES_LIEN } from '../src/engine/campagne/types';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { IDS, campagneDe, jouer, type Profil } from './aideCampagne';

// Des campagnes entières, jouées par des robots, de l'enfance à la fin. Dans la suite : quelques-unes.
// Pour la grande série : SIMULATIONS=500 npx vitest run tests/campagneSimulation.test.ts
const N = Number(process.env.SIMULATIONS ?? 6);
/** Pour découper la grande série en tranches parallèles : SIMULATIONS_DEBUT=125 SIMULATIONS=125… */
const DEBUT = Number(process.env.SIMULATIONS_DEBUT ?? 0);
const PROFILS: [Profil, Profil][] = [
  ['hasard', 'hasard'],
  ['traitre', 'loyal'],
  ['agressif', 'prudent'],
  ['loyal', 'loyal'],
];

function invariants(c: Campagne): void {
  for (const j of IDS) for (const a of AXES_LIEN) expect(c.lien.axes[j][a]).toBeGreaterThanOrEqual(0), expect(c.lien.axes[j][a]).toBeLessThanOrEqual(100);
  expect(c.lien.accord).toBeGreaterThanOrEqual(0);
  expect(c.lien.accord).toBeLessThanOrEqual(100);
  expect(c.akatsuki.recrues.length).toBeLessThanOrEqual(1);
  expect(c.akatsuki.couverture).toBeGreaterThanOrEqual(0);
  // Une seule chose ouverte à la fois : une scène, un résultat, ou un combat.
  expect([c.commune, c.combat].filter(Boolean).length).toBeLessThanOrEqual(1);
  if (c.fin) expect(c.joueurs.every((s) => finie(s))).toBe(true);
  // Aucune scène jouée deux fois.
  expect(new Set(c.vues).size).toBe(c.vues.length);
}

describe('Des campagnes entières', () => {
  it(`${N} campagnes jouées jusqu’au bout : ni blocage, ni état impossible, et chacune raconte quelque chose`, () => {
    const fins: Record<string, number> = {};
    const scenes: number[] = [];
    const vues: Record<string, number> = {};
    let akatsuki = 0;
    let inachevees = 0;
    for (let g = DEBUT; g < DEBUT + N; g++) {
      let c = campagneDe(g);
      let pas = 0;
      c = jouer(c, 31 + g, (x) => { pas++; if (pas % 500 === 0) invariants(x); return !!x.fin; }, 3000, PROFILS[g % PROFILS.length]);
      invariants(c);
      // Si la campagne n'est pas finie, c'est que quelqu'un peut encore jouer : jamais un blocage.
      if (!c.fin) {
        inachevees++;
        expect(joueurActif(c), `campagne ${g} bloquée`).not.toBeNull();
      }
      if (c.fin) fins[c.fin.id] = (fins[c.fin.id] ?? 0) + 1;
      scenes.push(c.vues.length);
      for (const v of c.vues) vues[v] = (vues[v] ?? 0) + 1;
      if (c.akatsuki.recrues.length || c.akatsuki.infiltre !== undefined) akatsuki++;
      // Une vie à deux, ce sont des scènes : quand les deux ont vécu au moins jusqu'à vingt ans ensemble, au moins une dizaine.
      const ensemble = Math.min(...c.joueurs.map((s) => Math.floor(((c.stats.mort[c.joueurs.indexOf(s) as IdJoueur] ?? s.jour) - s.naissance) / 360)));
      if (ensemble >= 20) expect(c.vues.length, `campagne ${g}`).toBeGreaterThanOrEqual(10);
      expect(c.vues.length).toBeGreaterThanOrEqual(1);
    }
    if (process.env.SIMULATIONS) {
      const ordre = Object.entries(vues).sort((a, b) => b[1] - a[1]);
      console.log(JSON.stringify({ inachevees, fins, scenesParCampagne: { min: Math.min(...scenes), moy: Math.round(scenes.reduce((a, b) => a + b, 0) / N), max: Math.max(...scenes) }, akatsuki, jamaisVues: ordre.length, plusRares: ordre.slice(-12).map((x) => x.join(":")).join(" ") }));
    }
  }, Math.max(600000, N * 30000));
});

export type { IdJoueur };
