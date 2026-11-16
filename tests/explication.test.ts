// Les explications de combat : ce que tu as fait, ce qu'il faisait vraiment, le résultat, pourquoi, et la leçon.
// Elles lisent le journal et l'annonce, sans rien tirer ni modifier.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { conseilAnnonce, expliquerManche } from '../src/engine/combat/explication';
import type { EntreeManche, EtatAffrontement, IntentionAdv } from '../src/engine/combat/types';
import { INTENTIONS } from '../src/engine/combat/types';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx, cloner } from '../src/engine/etat';
import { empreinte } from '../src/engine/sauvegarde';
import { combinaisons, creation } from './aide';

function duel(graine: number): GameState {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * 14;
  s.rang = 'genin';
  appliquerEffet(s, { enseigner: 'katon_boule' }, nouveauCtx());
  s.scene = { type: 'evenement', id: 'ap_rival_defi' };
  return choisir(s, 'combattre');
}
const sc = (s: GameState) => s.scene as EtatAffrontement;

const entree = (x: Partial<EntreeManche>): EntreeManche => ({ manche: 1, annonce: '', action: 'Coup puissant', execution: '', reponse: '', impact: '', lecture: 'Cause.', repliques: [], technique: '', ...x });

describe('Explication des manches', () => {
  it('chaque manche jouée garde ce que tu as fait et ce qu’il faisait vraiment, et la vue l’explique', () => {
    for (let g = 1; g <= 30; g++) {
      const s = duel(g);
      const avant = sc(s).intention;
      const fiab = sc(s).annonce.fiabilite;
      const n = combattre(s, { famille: 'taijutsu', choix: 'coup_puissant' });
      if (n.scene.type !== 'affrontement') continue;
      const j = sc(n).journal.at(-1)!;
      expect(j.famille).toBe('taijutsu');
      expect(j.choix).toBe('coup_puissant');
      expect(j.intention).toBe(avant);
      expect(j.fiabilite).toBe(fiab);
      expect(['parfaite', 'reussie', 'instable', 'ratee']).toContain(j.tenue);
      const e = vueAffrontement(n)!.journal.at(-1)!.explication!;
      expect(e.toi).toMatch(/^Coup puissant/);
      expect(e.lui).toMatch(/\(ta lecture était juste\)|\(ta lecture était vague\)|trompé/);
      // Les jetons sont résolus : ni {il}, ni {nom}.
      expect(JSON.stringify(e)).not.toMatch(/\{(il|Il|nom|lui)\}/);
      expect(e.bilan).toMatch(/PV|Aucun coup/);
    }
  });

  it('les chiffres du résultat sont ceux de la manche', () => {
    const e = expliquerManche(entree({ famille: 'taijutsu', choix: 'coup_puissant', intention: 'attaque', inflige: 12, subi: 5, issue: 'touche', tenue: 'reussie' }))!;
    expect(e.bilan).toBe('−12 PV pour {nom} · −5 PV pour toi');
    expect(e.ton).toBe('bon');
    // Un échange de coups appelle sa leçon.
    expect(e.conseil).toMatch(/échangé/);
  });

  it('chaque issue ratée a sa leçon, et une leçon juste', () => {
    const c = (x: Partial<EntreeManche>) => expliquerManche(entree({ famille: 'taijutsu', choix: 'coup_puissant', intention: 'attaque', ...x }))!.conseil;
    expect(c({ issue: 'predite' })).toMatch(/lu ton geste/);
    expect(c({ issue: 'ecrasee', subi: 9 })).toMatch(/garde ou esquive/);
    expect(c({ issue: 'dominee' })).toMatch(/Esquive d’abord/);
    expect(c({ issue: 'ratee' })).toMatch(/chance de bien l’exécuter/);
    expect(c({ issue: 'annulee' })).toMatch(/ouverture/);
    expect(c({ issue: 'decisive', inflige: 40 })).toBeUndefined();
    expect(c({ issue: 'touche', inflige: 8, intention: 'defense' })).toMatch(/30 %/);
    expect(c({ issue: 'touche', inflige: 8, intention: 'preparer' })).toMatch(/25 %/);
  });

  it('les actions sans coup expliquent quand elles servent', () => {
    const c = (choix: string, famille: EntreeManche['famille'], x: Partial<EntreeManche> = {}) => expliquerManche(entree({ famille, choix, action: choix, ...x }))!.conseil;
    expect(c('garde', 'defense', { intention: 'observer' })).toMatch(/n’attaquait pas/);
    expect(c('esquive', 'defense', { intention: 'defense' })).toMatch(/que s’\{il\} attaque/);
    expect(c('esquive', 'defense', { intention: 'attaque', reussi: true })).toMatch(/moment de frapper/);
    expect(c('feinte', 'taijutsu', { intention: 'attaque', reussi: false })).toMatch(/que s’\{il\} attend/);
    expect(c('feinte', 'taijutsu', { intention: 'defense', reussi: true })).toMatch(/garde est ouverte/);
    expect(c('souffle', 'defense', { intention: 'attaque', subi: 6 })).toMatch(/pas quand/);
    expect(c('concentration', 'observation', { intention: 'defense' })).toMatch(/\+10 %/);
  });

  it('une manche d’avant la 2.51 (sans ces champs) n’a pas d’explication : l’écran garde sa phrase-cause', () => {
    expect(expliquerManche(entree({}))).toBeUndefined();
  });

  it('avant de choisir : l’intention n’est nommée que si la lecture est fiable', () => {
    for (const i of INTENTIONS) {
      expect(conseilAnnonce(i as IntentionAdv, 'vague', 2).mot).toBe('Intention incertaine');
      expect(conseilAnnonce(i as IntentionAdv, 'trompeur', 2).mot).toBe('Intention incertaine');
      expect(conseilAnnonce(i as IntentionAdv, 'fiable', 2).mot).not.toBe('Intention incertaine');
    }
    // Règles 1 : on ne conseille pas d'actions qui n'existent pas encore.
    expect(conseilAnnonce('defense', 'fiable', 1).conseil).not.toMatch(/feinter/);
    expect(conseilAnnonce('defense', 'fiable', 2).conseil).toMatch(/feinter/);
  });

  it('la vue ne change rien à l’état ni au hasard', () => {
    const s = duel(7);
    const avant = empreinte(s);
    const copie = cloner(s);
    vueAffrontement(s);
    expect(empreinte(s)).toBe(avant);
    expect(empreinte(combattre(s, { famille: 'defense', choix: 'garde' }))).toBe(empreinte(combattre(copie, { famille: 'defense', choix: 'garde' })));
  });
});
