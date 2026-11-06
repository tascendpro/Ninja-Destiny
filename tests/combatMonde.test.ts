import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { creerAffrontement, ouvrirManche, vueAffrontement } from '../src/engine/combat/affrontement';
import { adversaireDef, temperamentCourant } from '../src/engine/combat/adversaire';
import { resoudre } from '../src/engine/combat/resolution';
import { declencherEvenement, EVENEMENT } from '../src/engine/combat/evenements';
import { jaugesInitiales, nourrirJauges, avertissements } from '../src/engine/combat/jauges';
import { entrerPhase, majeureDe } from '../src/engine/combat/boss';
import { EVENEMENTS_COMBAT } from '../src/content/combat/evenementsCombat';
import { PHASES_BOSS } from '../src/content/combat/boss';
import { R } from '../src/engine/registre';
import type { EtatAffrontement } from '../src/engine/combat/types';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { combinaisons, creation } from './aide';

const PILOTE = 'ap_rival_defi';
type Sc = EtatAffrontement;
const sc = (s: GameState) => s.scene as Sc;

function duel(graine: number, lieu?: string): GameState {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * 14;
  s.rang = 'genin';
  s.jauges.chakra = s.jauges.chakraMax = 400;
  for (const t of ['katon_boule', 'katon_croissant', 'doton_failles']) appliquerEffet(s, { enseigner: t }, nouveauCtx());
  if (lieu) s.drapeaux['lieu_scene'] = lieu;
  s.scene = { type: 'evenement', id: PILOTE };
  return choisir(s, 'combattre');
}

describe('Le terrain qui se souvient (§5.1)', () => {
  it('les zones et les explosions fragilisent un lieu fermé bien plus qu’une plaine ; le feu prend en forêt', () => {
    const interieur = duel(3, 'cite_ensevelie');
    const plaine = duel(3, 'frontiere_herbe');
    for (const s of [interieur, plaine]) for (let i = 0; i < 4; i++) nourrirJauges(s, sc(s), { portee: 'zone', nature: 'katon', technique: true });
    expect(sc(interieur).jauges!.instabilite).toBeGreaterThan(sc(plaine).jauges!.instabilite * 2);
    expect(sc(plaine).jauges!.incendie).toBeGreaterThan(sc(interieur).jauges!.incendie);
    // Le joueur est prévenu.
    sc(interieur).jauges!.instabilite = 50;
    expect(avertissements(interieur, sc(interieur)).join(' ')).toMatch(/plafond gronde/);
    expect(vueAffrontement(interieur)!.lecture.join(' ')).toMatch(/plafond gronde/);
  });

  it('un effondrement n’arrive jamais sans instabilité ; une crue jamais sans eau ; l’ANBU jamais sans bruit', () => {
    for (let g = 1; g <= 300; g++) {
      const s = duel(g, 'cite_ensevelie');
      const x = sc(s);
      x.manche = 3;
      x.jauges = { ...jaugesInitiales(s), instabilite: 40, crue: 0, bruit: 20 };
      declencherEvenement(s, x, adversaireDef(x.adversaireId), (g % 100) / 100 * 0.45);
      expect(['plafond_cede', 'galerie_mine', 'riviere_deborde', 'anbu_arrive', 'avalanche']).not.toContain(x.evenement?.id);
    }
    // Avec l'instabilité, il devient possible.
    let cede = 0;
    for (let g = 1; g <= 300; g++) {
      const s = duel(g, 'cite_ensevelie');
      const x = sc(s);
      x.manche = 3;
      x.jauges = { ...jaugesInitiales(s), instabilite: 90 };
      declencherEvenement(s, x, adversaireDef(x.adversaireId), (g % 50) / 500);
      if (x.evenement?.id === 'plafond_cede') cede++;
    }
    expect(cede).toBeGreaterThan(0);
  });

  it('deux manches au moins entre deux événements, et jamais à la première', () => {
    const s = duel(5);
    const x = sc(s);
    x.manche = 1;
    expect(declencherEvenement(s, x, adversaireDef(x.adversaireId), 0)).toBeUndefined();
    x.manche = 4;
    x.dernierEvenement = 3;
    expect(declencherEvenement(s, x, adversaireDef(x.adversaireId), 0)).toBeUndefined();
  });

  it('le catalogue : aucun événement « partout », chacun avec au moins deux réponses ; des quatre familles', () => {
    for (const e of EVENEMENTS_COMBAT) {
      const q = e.si;
      expect(!!(q.contextes || q.terrains || q.terrainEtat || q.jauges || q.habite || q.escouade || q.temperaments || q.joueurSousPct || q.advSousPct || q.clan), `${e.id} arrive partout`).toBe(true);
      expect(e.choix.length, e.id).toBeGreaterThanOrEqual(2);
    }
    const parType = (t: string) => EVENEMENTS_COMBAT.filter((e) => e.type === t).length;
    expect(parType('environnement')).toBeGreaterThanOrEqual(18);
    expect(parType('intervention')).toBeGreaterThanOrEqual(12);
    expect(parType('tactique')).toBeGreaterThanOrEqual(6);
    expect(parType('scenario')).toBeGreaterThanOrEqual(5);
    expect(Object.keys(EVENEMENT).length).toBe(EVENEMENTS_COMBAT.length);
  });
});

describe('Les boss (§8)', () => {
  function boss(id: string): { s: GameState; x: Sc } {
    const c = combinaisons().find((y) => y.clan === 'uchiha')!;
    const s = nouvellePartie(creation(c), 9);
    s.jour = s.naissance + 360 * 25;
    s.rang = 'jonin';
    const x = creerAffrontement(s, { evenementId: 'mc_combat_nuit', adversaireId: id, contexte: 'combat_a_mort', plafond: 10 });
    s.scene = x;
    return { s, x };
  }

  it('dix boss ont des phases, chacune atteignable par une condition', () => {
    expect(Object.keys(PHASES_BOSS).length).toBeGreaterThanOrEqual(10);
    for (const [id, phases] of Object.entries(PHASES_BOSS)) {
      expect(adversaireDef(id).phases?.length, id).toBe(phases.length);
      for (const p of phases) expect(p.quand.sousPct !== undefined || p.quand.mancheMin !== undefined, `${id}/${p.id}`).toBe(true);
    }
  });

  it('une phase s’ouvre une seule fois, à son seuil : Kisame entre dans la faim sous 70 %, puis fusionne sous 40 %', () => {
    const { x } = boss('ak_kisame');
    const d = adversaireDef('ak_kisame');
    expect(entrerPhase(x, d)).toBeUndefined();
    x.adv.endurance = Math.round(x.adv.enduranceMax * 0.65);
    expect(entrerPhase(x, d)).toMatch(/Samehada/);
    expect(entrerPhase(x, d)).toBeUndefined();
    expect(majeureDe(x, d)!.nom).toBe('Vague tranchante');
    expect(temperamentCourant(x, d)).toBe('sadique');
    x.adv.endurance = Math.round(x.adv.enduranceMax * 0.3);
    const avant = x.adv.endurance;
    expect(entrerPhase(x, d)).toMatch(/fondent/);
    expect(x.adv.endurance).toBeGreaterThan(avant);
  });

  it('un boss abattu vite ne montre pas ses phases : sous le seuil le plus bas d’un coup, on ne joue pas toutes les phases', () => {
    const { x } = boss('ak_deidara');
    const d = adversaireDef('ak_deidara');
    x.adv.endurance = Math.round(x.adv.enduranceMax * 0.2);
    x.manche = 2;
    entrerPhase(x, d);
    // Il saute directement à sa dernière phase : celles d'avant sont passées.
    expect(x.phases).toEqual(['ciel', 'c2', 'c0']);
  });

  it('lire le télégraphe et parer : sa grande technique ne laisse presque rien', () => {
    let pare = 0;
    let encaisse = 0;
    for (let g = 1; g <= 40; g++) {
      for (const parade of [true, false]) {
        const { s, x } = boss('ak_kisame');
        const d = adversaireDef('ak_kisame');
        ouvrirManche(s, x, d);
        x.adv.endurance = Math.round(x.adv.enduranceMax * 0.65);
        entrerPhase(x, d);
        x.intention = 'majeure';
        const t = { exec: 0.5, reponse: 0.99, execAdv: 0.01, variation: (g % 10) / 10, decisif: 0.99, texte: 0.3, replique: 0.3, etat: 0.9, analyse: 0.99 };
        const r = resoudre(s, x, d, parade ? { famille: 'defense', choix: 'esquive' } : { famille: 'defense', choix: 'garde' }, t);
        if (parade) pare += r.subi;
        else encaisse += r.subi;
      }
    }
    expect(pare).toBeLessThan(encaisse * 0.4);
  });

  it('des combats joués jusqu’au bout contre Itachi et Deidara : les phases arrivent, aucun blocage', () => {
    let phases = 0;
    for (let g = 1; g <= 30; g++) {
      const c = combinaisons().find((y) => y.clan === 'uchiha')!;
      let s = nouvellePartie(creation(c), g);
      s.jour = s.naissance + 360 * 28;
      s.rang = 'jonin';
      s.attributs.force = s.attributs.agilite = 90;
      // Les boss dont une phase s'ouvre dès la deuxième manche : Itachi, Deidara.
      const cles = Object.entries(R.contenu.racine.affrontements).filter(([, af]) => ['ak_itachi', 'ak_deidara'].includes(af.adversaire)).map(([k]) => k);
      const cle = cles[g % cles.length];
      if (!cle) return;
      const [ev, ch] = cle.split('/');
      s.scene = { type: 'evenement', id: ev };
      s = choisir(s, ch);
      let k = 0;
      while (s.scene.type === 'affrontement' && k++ < 30) {
        const v = vueAffrontement(s)!;
        const dispo = v.familles.filter((f) => f.id !== 'fuite' && f.id !== 'parole').flatMap((f) => f.actions.filter((a) => a.disponible).map((a) => ({ famille: f.id, choix: a.id })));
        s = combattre(s, dispo[(g + k) % dispo.length]);
        if (s.scene.type === 'affrontement') phases = Math.max(phases, sc(s).phases?.length ?? 0);
      }
      expect(s.scene.type).not.toBe('affrontement');
    }
    expect(phases).toBeGreaterThan(0);
  });
});
