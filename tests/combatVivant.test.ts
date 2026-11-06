import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement, enduranceJoueur } from '../src/engine/combat/affrontement';
import { GABARITS, ecartDeRang } from '../src/engine/combat/contextes';
import { EFFETS_ETAT, ETATS, aEtat, etatDuCoup, modificateurs, poserEtat, vieillirEtats } from '../src/engine/combat/etats';
import { MORAL_INITIAL, bougerMoral, capaciteAnalyse, observerAction } from '../src/engine/combat/esprit';
import { declencherEvenement, EVENEMENT } from '../src/engine/combat/evenements';
import { adversaireDef, scoresIntentions } from '../src/engine/combat/adversaire';
import { REPLIQUES_PERSONNALITE } from '../src/content/combat/personnalites';
import { EVENEMENTS_COMBAT } from '../src/content/combat/evenementsCombat';
import { TEMPERAMENTS } from '../src/engine/combat/types';
import type { ActionCombat, EtatAffrontement } from '../src/engine/combat/types';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { combinaisons, creation } from './aide';

const PILOTE = 'ap_rival_defi';
type Sc = EtatAffrontement;

function duel(ageAns: number, graine: number, prep?: (s: GameState) => void): GameState {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.rang = ageAns >= 12 ? 'genin' : 'eleve';
  if (ageAns >= 9) appliquerEffet(s, { enseigner: 'katon_boule' }, nouveauCtx());
  prep?.(s);
  s.scene = { type: 'evenement', id: PILOTE };
  return choisir(s, 'combattre');
}
const sc = (s: GameState) => s.scene as Sc;

describe('Combat vivant : la puissance se ressent', () => {
  it('les PV suivent le rang (§2.1), et l’écart de rang creuse les dégâts dans les deux sens', () => {
    expect([GABARITS.genin.endurance, GABARITS.chunin.endurance, GABARITS.jonin.endurance, GABARITS.kage.endurance, GABARITS.biju.endurance]).toEqual([70, 100, 140, 240, 500]);
    expect(ecartDeRang('genin', 'genin')).toBe(1);
    expect(ecartDeRang('jonin', 'genin')).toBeCloseTo(1.36);
    expect(ecartDeRang('genin', 'jonin')).toBeCloseTo(0.56);
    expect(ecartDeRang('genin', 'kage')).toBe(0.35);
    // Un genin en pleine santé a les PV d'un genin, à quelques points près.
    const s = duel(14, 3);
    const pv = enduranceJoueur(s);
    expect(pv).toBeGreaterThanOrEqual(70);
    expect(pv).toBeLessThanOrEqual(95);
  });

  it('un jōnin frappe un genin bien plus fort qu’un genin ne le fait ; le genin l’égratigne à peine', () => {
    const mesure = (niveauAdv: 'genin' | 'jonin') => {
      let subi = 0;
      let inflige = 0;
      for (let g = 1; g <= 150; g++) {
        let s = duel(14, g);
        sc(s).niveauAdv = niveauAdv;
        s = combattre(s, { famille: 'taijutsu', choix: 'coup_puissant' });
        const e = s.scene.type === 'affrontement' ? sc(s).journal.at(-1) : undefined;
        subi += e?.subi ?? 0;
        inflige += e?.inflige ?? 0;
      }
      return { subi, inflige };
    };
    const egal = mesure('genin');
    const fort = mesure('jonin');
    expect(fort.subi).toBeGreaterThan(egal.subi * 1.25);
    expect(fort.inflige).toBeLessThan(egal.inflige * 0.7);
  });
});

describe('Combat vivant : les états', () => {
  it('chaque état a ses phrases ; le poison ronge, puis passe', () => {
    for (const id of ETATS) {
      expect(EFFETS_ETAT[id].apparait.joueur.length).toBeGreaterThan(10);
      expect(EFFETS_ETAT[id].passe.adv.length).toBeGreaterThan(10);
    }
    const c = { endurance: 100, enduranceMax: 100, garde: 'ouverte' as const, sonne: 0, vide: 0 };
    expect(poserEtat(c, 'empoisonne', 2)).toBe(true);
    expect(poserEtat(c, 'empoisonne', 1)).toBe(false);
    const t1 = vieillirEtats(c, 'joueur');
    expect(t1.perte).toBe(5);
    const t2 = vieillirEtats(c, 'joueur');
    expect(t2.textes.length).toBe(1);
    expect(aEtat(c, 'empoisonne')).toBe(false);
  });

  it('la gravité vient du coup : un petit coup ne blesse pas, un très lourd peut blesser mains ou jambes', () => {
    expect(etatDuCoup({ part: 0.05 }, 0.01)).toBeUndefined();
    expect(['mains_blessees', 'jambe_touchee']).toContain(etatDuCoup({ part: 0.3 }, 0.1)!.id);
    expect(etatDuCoup({ nature: 'raiton', part: 0.05 }, 0.1)!.id).toBe('desoriente');
  });

  it('chakra bloqué : plus de ninjutsu ; immobilisé : ni esquive ni fuite', () => {
    const s = duel(14, 5);
    poserEtat(sc(s).joueur, 'chakra_bloque', 2);
    poserEtat(sc(s).joueur, 'immobilise', 1);
    const v = vueAffrontement(s)!;
    const nin = v.familles.find((f) => f.id === 'ninjutsu')!.actions.filter((a) => a.id === 'katon_boule');
    expect(nin.every((a) => !a.disponible && /bloqué/.test(a.raison ?? ''))).toBe(true);
    expect(v.familles.find((f) => f.id === 'defense')!.actions.find((a) => a.id === 'esquive')!.disponible).toBe(false);
    expect(() => combattre(s, { famille: 'ninjutsu', choix: 'katon_boule' })).toThrow();
    expect(modificateurs(sc(s).joueur).fige).toBe(true);
    expect(v.joueur.etats).toContain('chakra bloqué');
  });
});

describe('Combat vivant : un adversaire qui apprend', () => {
  it('l’analyse dépend du rang : un Kage comprend vite et plusieurs choses, un genin une seule, et se trompe plus', () => {
    const g = capaciteAnalyse('genin', 50);
    const k = capaciteAnalyse('kage', 88);
    expect(k.vitesse).toBeGreaterThan(g.vitesse);
    expect(k.simultane).toBeGreaterThan(g.simultane);
    expect(k.erreur).toBeLessThan(g.erreur);
  });

  it('il peut comprendre, ou mal interpréter ; saturé, il ne retient plus rien', () => {
    const s = duel(14, 7);
    const x = sc(s);
    const cap = capaciteAnalyse('genin', 50);
    expect(observerAction(x, 'katon_boule', 2, 1, cap, 0, 0.99)).toBe('comprise');
    expect(observerAction(x, 'katon_boule', 3, 1, cap, 0, 0.99)).toBeUndefined();
    expect(observerAction(x, 'coup_puissant', 2, 1, cap, 0, 0)).toBe('erronee');
    // Un genin retient trois choses au plus.
    x.comprises = { a: 'comprise', b: 'comprise', c: 'comprise' };
    expect(observerAction(x, 'frappe_rapide', 2, 1, cap, 0, 0.99)).toBeUndefined();
  });

  it('une technique qu’il a mal lue ne se prédit plus', () => {
    let predites = 0;
    for (let g = 1; g <= 120; g++) {
      const s = duel(14, g, (y) => (y.jauges.chakra = y.jauges.chakraMax = 300));
      sc(s).comprises = { katon_boule: 'erronee' };
      sc(s).vuesCeCombat = { katon_boule: 3 };
      const t = combattre(s, { famille: 'ninjutsu', choix: 'katon_boule' });
      if (t.scene.type === 'affrontement' && sc(t).journal.at(-1)?.issue === 'predite') predites++;
    }
    expect(predites).toBe(0);
  });
});

describe('Combat vivant : personnalités et paroles', () => {
  it('les onze personnalités ont un moral, une voix, et un comportement', () => {
    const s = duel(14, 9);
    const d = adversaireDef(sc(s).adversaireId);
    const [avant, bascule] = [d.temperament, d.bascule];
    try {
      for (const t of TEMPERAMENTS) {
        expect(MORAL_INITIAL[t]).toBeDefined();
        expect(Object.keys(REPLIQUES_PERSONNALITE[t]).length).toBeGreaterThanOrEqual(4);
        // La personnalité vient de la fiche de l'adversaire.
        d.temperament = t;
        d.bascule = undefined;
        sc(s).temperament = t;
        sc(s).adv.moral = { ...MORAL_INITIAL[t] };
        const scores = scoresIntentions(s, sc(s), d);
        if (t === 'fanatique') expect(scores.fuir + scores.parler).toBe(0);
        expect(Object.values(scores).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
      }
    } finally {
      d.temperament = avant;
      d.bascule = bascule;
    }
  });

  it('le moral bouge selon qui l’on est : le fanatique n’a pas peur, le froid ne s’emporte pas', () => {
    const s = duel(14, 10);
    sc(s).temperament = 'fanatique';
    sc(s).adv.moral = { ...MORAL_INITIAL.fanatique };
    bougerMoral(sc(s), { peur: 40 });
    expect(sc(s).adv.moral!.peur).toBe(0);
    sc(s).temperament = 'froid';
    sc(s).adv.moral = { ...MORAL_INITIAL.froid };
    bougerMoral(sc(s), { colere: 50 });
    expect(sc(s).adv.moral!.colere).toBe(10);
  });

  it('questionner peut faire parler ; menacer peut faire peur ; une parole ne se répète pas une fois réussie', () => {
    let parle = 0;
    let peur = 0;
    for (let g = 1; g <= 80; g++) {
      const s = duel(14, g, (y) => (y.attributs.charisme = 90));
      const t = combattre(s, { famille: 'parole', choix: 'questionner' });
      if (t.scene.type === 'affrontement' && sc(t).questionne) {
        parle++;
        expect(vueAffrontement(t)!.familles.find((f) => f.id === 'parole')!.actions.some((a) => a.id === 'questionner')).toBe(false);
      }
      const u = duel(14, g, (y) => (y.social.reputation = 80));
      const avant = MORAL_INITIAL[sc(u).temperament].peur;
      const w = combattre(u, { famille: 'parole', choix: 'menacer' });
      if (w.scene.type === 'affrontement' && (sc(w).adv.moral?.peur ?? 0) > avant) peur++;
    }
    expect(parle).toBeGreaterThan(5);
    expect(peur).toBeGreaterThan(5);
  });
});

describe('Combat vivant : les événements', () => {
  it('chaque événement a des choix et une suite si on l’ignore ; aucun jeton inconnu', () => {
    for (const e of EVENEMENTS_COMBAT) {
      expect(e.choix.length, e.id).toBeGreaterThanOrEqual(2);
      const textes = [e.texte, e.ignore.texte, ...e.choix.flatMap((c) => [c.nom, c.detail, c.succes.texte, c.echec?.texte ?? ''])].join(' ');
      for (const j of textes.match(/\{[^}]*\}/g) ?? []) expect(['{nom}', '{Il}', '{il}', '{lui}', '{Lui}', '{le}', '{e}'], `${e.id} : ${j}`).toContain(j);
    }
  });

  it('un jōnin qui s’interpose arrête une bagarre de genin, qu’on lui obéisse ou non', () => {
    for (const choix of ['obeir', 'ignorer']) {
      const s = duel(14, 21);
      const x = sc(s);
      x.manche = 2;
      const t = declencherEvenement(s, x, adversaireDef(x.adversaireId), 0);
      if (!t || x.evenement?.id !== 'jonin_arrete') {
        // Le tirage à 0 prend le premier événement possible : on le force pour ce test.
        x.evenement = { id: 'jonin_arrete', manche: 2 };
        x.evenementsVus = ['jonin_arrete'];
      }
      expect(vueAffrontement(s)!.familles[0].id).toBe('situation');
      const a: ActionCombat = choix === 'obeir' ? { famille: 'situation', choix: 'obeir' } : { famille: 'taijutsu', choix: 'frappe_rapide' };
      const fin = combattre(s, a);
      expect(fin.scene.type).not.toBe('affrontement');
      expect(Object.values(fin.registresCombat)[0].derniereIssue).toBe('interrompu');
    }
  });

  it('des combats joués au hasard, avec événements et états : jamais de blocage, jamais de jeton à l’écran', () => {
    let evenements = 0;
    let etats = 0;
    for (let g = 1; g <= 120; g++) {
      let s = duel(14, g);
      let k = 0;
      while (s.scene.type === 'affrontement' && k++ < 25) {
        const v = vueAffrontement(s)!;
        if (sc(s).evenement) evenements++;
        if (v.joueur.etats.length || v.adversaire.etats.length) etats++;
        const dispo = v.familles.flatMap((f) => f.actions.filter((a) => a.disponible).map((a) => ({ famille: f.id, choix: a.id })));
        const a = dispo[(g * 7 + k * 13) % dispo.length];
        s = combattre(s, a);
        if (s.scene.type === 'affrontement') {
          const e = sc(s).journal.at(-1)!;
          for (const t of [e.annonce, e.execution, e.reponse, e.impact, e.lecture, ...e.repliques]) expect(t, t).not.toMatch(/\{[A-Za-z]+\}/);
        }
      }
      expect(s.scene.type).not.toBe('affrontement');
    }
    expect(evenements).toBeGreaterThan(0);
    expect(etats).toBeGreaterThan(0);
    expect(Object.keys(EVENEMENT).length).toBeGreaterThanOrEqual(14);
  });
});
