import { describe, expect, it } from 'vitest';
import type { Effect, GameState } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { appliquerEffet } from '../src/engine/effets';
import { defPnj, nouveauCtx } from '../src/engine/etat';
import { evenementDisponible } from '../src/engine/selection';
import { R } from '../src/engine/registre';
import { ARCS_CLANS_1 } from '../src/content/evenements/arcsClans1';
import { ARCS_CLANS_2 } from '../src/content/evenements/arcsClans2';
import { ARCS_CLANS_3 } from '../src/content/evenements/arcsClans3';
import { combinaisons, creation } from './aide';

const ARCS = [...ARCS_CLANS_1, ...ARCS_CLANS_2, ...ARCS_CLANS_3];
const CLANS = R.contenu.clans.map((c) => c.id);

/** Le clan exigé par une scène, s'il y en a un. */
function clanDe(si: unknown): string | undefined {
  const m = JSON.stringify(si).match(/"clan":"([a-z_]+)"/);
  return m?.[1];
}

/** Un personnage du clan donné, à l'âge et au rang voulus, prêt à vivre une scène. */
function ninja(clan: string, ageAns: number, graine = 1): GameState {
  const c = combinaisons().find((x) => x.clan === clan)!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.rang = ageAns >= 13 ? 'genin' : 'eleve';
  s.chapitre = ageAns >= 13 ? 2 : 1;
  return s;
}

describe('Les arcs de clan', () => {
  it('chaque clan du jeu a sa scène d’Académie et son épreuve décisive, avec des choix et un vrai combat', () => {
    for (const clan of CLANS) {
      const scenes = ARCS.filter((e) => !e.enchaine && clanDe(e.si) === clan);
      expect(scenes.filter((e) => e.categorie === 'academie').length, `${clan} : Académie`).toBeGreaterThanOrEqual(1);
      expect(scenes.filter((e) => e.categorie !== 'academie').length, `${clan} : épreuve`).toBeGreaterThanOrEqual(1);
      for (const e of scenes) expect(e.choix.length, e.id).toBeGreaterThanOrEqual(2);
      const fil = ARCS.filter((e) => clanDe(e.si) === clan || scenes.some((sc) => JSON.stringify(sc).includes(`'${e.id}'`) || JSON.stringify(sc).includes(`"${e.id}"`)));
      expect(JSON.stringify(fil), `${clan} : au moins un combat`).toContain('"type":"combat"');
    }
  });

  it('une scène de clan ne s’ouvre qu’aux enfants de ce clan, à l’âge prévu', () => {
    for (const e of ARCS.filter((x) => !x.enchaine)) {
      const clan = clanDe(e.si)!;
      const age = e.categorie === 'academie' ? 10 : 18;
      const autre = CLANS.find((c) => c !== clan && combinaisons().some((x) => x.clan === c))!;
      expect(evenementDisponible(ninja(autre, age), e), `${e.id} chez un ${autre}`).toBe(false);
    }
    expect(evenementDisponible(ninja('hyuga', 10), R.evenements['cl_hyuga_academie'])).toBe(true);
    expect(evenementDisponible(ninja('hyuga', 6), R.evenements['cl_hyuga_academie'])).toBe(false);
    expect(evenementDisponible(ninja('nara', 18), R.evenements['cl_nara_embuscade'])).toBe(true);
  });

  it('une technique de clan ne s’apprend qu’au palier requis ; sinon, c’est le pouvoir de base qui progresse', () => {
    const effet = (R.evenements['cl_hyuga_evasion'].choix[0].test!.succes.effets as Effect[])[0];
    const fort = ninja('hyuga', 16);
    Object.assign(fort.maitrises['juken'], { awakened: true, tier: 3 });
    Object.assign(fort.maitrises['byakugan'], { awakened: true, tier: 2 });
    appliquerEffet(fort, effet, nouveauCtx());
    expect(fort.maitrises['hyuga_kaiten']?.tier).toBe(1);
    const faible = ninja('hyuga', 16);
    Object.assign(faible.maitrises['juken'], { awakened: true, tier: 1 });
    const avant = faible.maitrises['juken'].trainingDays;
    appliquerEffet(faible, effet, nouveauCtx());
    expect(faible.maitrises['hyuga_kaiten']?.tier ?? 0).toBe(0);
    expect(faible.maitrises['juken'].trainingDays).toBeGreaterThan(avant);
  });

  it('le sanctuaire Uchiha n’éveille jamais le Mangekyō sans une vraie perte ; avec elle, il le peut', () => {
    let eveils = 0;
    for (let g = 1; g <= 40; g++) {
      for (const perte of [false, true]) {
        const s = ninja('uchiha', 17, g);
        Object.assign(s.maitrises['sharingan'], { awakened: true, tier: 2 });
        s.maitrises['mangekyo'].potential = 90;
        if (perte) s.drapeaux['perte_tragique'] = true;
        s.scene = { type: 'evenement', id: 'cl_uchiha_temple' };
        const r = choisir(s, 'haine');
        if (!perte) expect(r.maitrises['mangekyo'].awakened, `graine ${g}`).toBe(false);
        else if (r.maitrises['mangekyo'].awakened) eveils++;
      }
    }
    expect(eveils).toBeGreaterThan(0);
  });

  it('en combat, ouvrir ses yeux fait réagir l’allié dans la mêlée et l’adversaire', () => {
    let vu = false;
    for (let g = 1; g <= 60 && !vu; g++) {
      let s = ninja('uchiha', 17, g);
      Object.assign(s.maitrises['sharingan'], { awakened: true, tier: 2 });
      s.jauges.chakra = s.jauges.chakraMax = 200;
      s.scene = { type: 'evenement', id: 'cl_uchiha_gardien' };
      s = choisir(s, 'combattre');
      if (s.scene.type !== 'affrontement') continue;
      s.scene.plafond = 10;
      s = combattre(s, { famille: 'pouvoir', choix: 'sharingan' });
      if (s.scene.type !== 'affrontement') continue;
      const journal = s.scene.journal.map((j) => j.impact).join(' ');
      const ami = defPnj(s, s.roles['coequipierA'])!.nom;
      expect(journal).toContain(ami);
      expect(journal).toMatch(/recule|relève sa garde|vrai combat/);
      vu = true;
    }
    expect(vu).toBe(true);
  });
});
