import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';
import { TRAITS } from '../src/content/monde';
import { ENFANCE } from '../src/content/evenements/enfance';
import { ADOLESCENCE } from '../src/content/evenements/adolescence';
import { JEUNESSE } from '../src/content/evenements/jeunesse';
import { creation } from './aide';
import { evaluer as evaluerSi } from '../src/engine/conditions';

describe('Traits de personnalité', () => {
  it('chaque trait choisissable vaut le même total de points d’attributs (+8)', () => {
    for (const t of TRAITS.filter((x) => !x.special)) {
      const total = Object.values(t.bonus ?? {}).reduce((a, b) => a + (b ?? 0), 0);
      expect(total, t.id).toBe(8);
    }
  });
});

describe('Les fils qui reviennent', () => {
  const retour = { retour: 'e6_gonta_revanche', chance: 0.5, entre: [100, 300] as [number, number] };

  it('le retour est tiré par le hasard de la partie : même graine, même destin', () => {
    for (let g = 1; g <= 20; g++) {
      const a = nouvellePartie(creation(), g);
      const b = nouvellePartie(creation(), g);
      appliquerEffet(a, retour, nouveauCtx());
      appliquerEffet(b, retour, nouveauCtx());
      expect(a.planifies).toEqual(b.planifies);
    }
  });

  it('pas toujours : avec une chance de moitié, certains reviennent et d’autres non, dans la fenêtre prévue', () => {
    let revenus = 0;
    for (let g = 1; g <= 60; g++) {
      const s = nouvellePartie(creation(), g);
      const jour = s.jour;
      appliquerEffet(s, retour, nouveauCtx());
      const p = s.planifies.find((x) => x.evenementId === 'e6_gonta_revanche');
      if (!p) continue;
      revenus++;
      expect(p.jour - jour).toBeGreaterThanOrEqual(100);
      expect(p.jour - jour).toBeLessThanOrEqual(300);
    }
    expect(revenus).toBeGreaterThan(15);
    expect(revenus).toBeLessThan(45);
  });

  it('un même fil n’est jamais programmé deux fois', () => {
    const s = nouvellePartie(creation(), 3);
    for (let i = 0; i < 10; i++) appliquerEffet(s, { ...retour, chance: 1 }, nouveauCtx());
    expect(s.planifies.filter((x) => x.evenementId === 'e6_gonta_revanche')).toHaveLength(1);
  });

  it('chaque scène de retour (enfance, adolescence, jeunesse) est bien rappelée par un fil', () => {
    const rappels = new Set<string>();
    const fouiller = (x: unknown) => {
      if (!x || typeof x !== 'object') return;
      if ('retour' in x && typeof (x as { retour: unknown }).retour === 'string') rappels.add((x as { retour: string }).retour);
      for (const v of Object.values(x)) fouiller(v);
    };
    const tout = [...ENFANCE, ...ADOLESCENCE, ...JEUNESSE];
    fouiller(tout);
    for (const ev of tout.filter((e) => e.enchaine)) expect(rappels.has(ev.id), ev.id).toBe(true);
    expect(rappels.size).toBeGreaterThanOrEqual(15);
  });

  it('l’enfance a de quoi remplir quatre ans : au moins 25 scènes du temps libre entre 6 et 10 ans', () => {
    const enfance = R.contenu.evenements.filter((e) => (e.poids ?? 0) > 0 && e.chapitre === 1 && e.id.startsWith('e6_'));
    expect(enfance.length + R.contenu.evenements.filter((e) => e.id.startsWith('r_') && e.chapitre === 1).length).toBeGreaterThanOrEqual(25);
  });

  it('les visages de l’enfance reviennent plus tard, seulement si on les a croisés', () => {
    for (const id of ['x_daichi_examen', 'x_sho_route', 'x_mei_caravane', 'x_gonta_fils', 'x_ermite_nom', 'x_boite_dix_ans', 'x_chat_vieux', 'j17_kaede', 'j17_ren']) {
      const ev = R.evenements[id];
      expect(ev, id).toBeDefined();
      expect(JSON.stringify(ev.si), id).toMatch(/drapeau|"vu"/);
      const s = nouvellePartie(creation(), 1);
      expect(evaluerSi(ev.si, s), `${id} ne doit pas survenir sans le souvenir`).toBe(false);
    }
  });

  it('chaque âge a son réservoir : au moins 15 scènes du temps libre propres à 11-16 ans et 10 à 17-22 ans', () => {
    expect(ADOLESCENCE.filter((e) => (e.poids ?? 0) > 0).length).toBeGreaterThanOrEqual(15);
    expect(JEUNESSE.filter((e) => (e.poids ?? 0) > 0).length).toBeGreaterThanOrEqual(10);
  });
});
