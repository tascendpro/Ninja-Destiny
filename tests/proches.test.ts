// Les proches : ce qu'ils sont pour toi (posture), ce dont ils se souviennent (mémoire), et qui tu affrontes vraiment.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { resoudreTexte } from '../src/engine/texte';
import { appliquerEffet } from '../src/engine/effets';
import { defPnj, nouveauCtx } from '../src/engine/etat';
import { faireActivite, genererActivites } from '../src/engine/tempsLibre';
import { bilanRival, habitude, noterHabitude, posture, prochainConseil, revueMentor } from '../src/engine/proches';
import { jetonProche } from '../src/engine/proches';
import type { EtatAffrontement } from '../src/engine/combat/types';
import { creation } from './aide';

const partie = (village: GameState['creation']['village'] = 'konoha', clan = 'uchiha', element: GameState['creation']['element'] = 'katon') => nouvellePartie(creation({ village, clan, element }), 9);
const rel = (s: GameState, role: string) => s.relations[s.roles[role]];
const registre = (s: GameState, toi: number, lui: number, derniere: 'victoire' | 'defaite' = 'victoire') => {
  s.registresCombat[s.roles['rival']] = { id: s.roles['rival'], rencontres: toi + lui, victoires: lui, defaites: toi, nuls: 0, derniereIssue: derniere, techniquesVuesDuJoueur: {}, habitudesDuJoueur: {}, techniquesVuesParJoueur: [], contreMesures: [], vivant: true };
};

describe('Les postures : ce qu’un proche est pour toi', () => {
  it('le parent : distant, inquiet, fier ou protecteur, dans cet ordre de priorité', () => {
    const s = partie();
    expect(posture(s, 'parent')).toBe('protecteur');
    rel(s, 'parent').respect = 60;
    expect(posture(s, 'parent')).toBe('fier');
    s.blessures.push({ id: 'b', nom: 'Côtes fêlées', gravite: 2, guerison: s.jour + 20, invalidante: false });
    expect(posture(s, 'parent')).toBe('inquiet');
    rel(s, 'parent').confiance = 10;
    expect(posture(s, 'parent')).toBe('distant');
  });

  it('le rival devient un complice, ou un ennemi : jamais les deux', () => {
    const s = partie();
    s.relations[s.roles['rival']] ??= { confiance: 0, respect: 0, amitie: 0, rivalite: 10, hostilite: 0, attachement: 0, peur: 0, dette: 0, rompue: false, souvenirs: [] };
    expect(posture(s, 'rival')).toBe('rival');
    rel(s, 'rival').amitie = 45;
    expect(posture(s, 'rival')).toBe('complice');
    rel(s, 'rival').hostilite = 50;
    expect(posture(s, 'rival')).toBe('ennemi');
  });

  it('l’ami·e est déçu·e d’une promesse rompue, même si l’amitié reste haute', () => {
    const s = partie();
    s.relations[s.roles['coequipierA']] = { confiance: 60, respect: 30, amitie: 70, rivalite: 0, hostilite: 0, attachement: 40, peur: 0, dette: 0, rompue: false, souvenirs: [] };
    expect(posture(s, 'ami')).toBe('proche');
    s.promesses.push({ id: 'p', pnj: '@coequipierA', texte: 'Payer la dette', jour: s.jour, etat: 'rompue' });
    expect(posture(s, 'ami')).toBe('decu');
  });
});

describe('La mémoire des proches', () => {
  it('le rival tient le compte de vos vrais combats, accordé à son genre', () => {
    const s = partie('kumo', 'raiko', 'raiton');
    registre(s, 1, 3, 'defaite');
    expect(bilanRival(s)).toEqual({ toi: 1, lui: 3, nuls: 0, derniere: 'perdu' });
    expect(jetonProche(s, 'rival_bilan')).toBe('trois victoires à une, pour elle');
    registre(s, 2, 2);
    expect(jetonProche(s, 'rival_bilan')).toBe('deux partout');
  });

  it('l’aîné·e connaît ton habitude après trois périodes au même usage', () => {
    const s = partie();
    expect(habitude(s)).toBeUndefined();
    // Chaque période de temps libre est comptée par le moteur…
    const id = genererActivites(s).find((a) => a.id.startsWith('entrainer:') && a.disponible)!.id;
    faireActivite(s, id, nouveauCtx());
    expect(Object.keys(s.drapeaux).some((k) => k.startsWith('habitude:'))).toBe(true);
    // … et à la troisième au même usage, elle devient une habitude qu'on remarque.
    noterHabitude(s, 'entrainer:taijutsu');
    noterHabitude(s, 'entrainer:taijutsu');
    noterHabitude(s, 'entrainer:taijutsu');
    expect(habitude(s)).toBe('frapper le poteau du terrain jusqu’à la nuit');
  });

  it('le mentor ne répète jamais un conseil, et le dit quand il n’en a plus', () => {
    const s = partie();
    const vus: string[] = [];
    for (let i = 0; i < 30; i++) {
      // Chaque année, une autre faiblesse ressort : le mentor la voit.
      const a = (['force', 'agilite', 'perception', 'discretion', 'intellect', 'charisme', 'controleChakra', 'controleEmotionnel'] as const)[i % 8];
      for (const b of Object.keys(s.attributs) as (keyof GameState['attributs'])[]) s.attributs[b] = 50;
      s.attributs[a] = 10;
      revueMentor(s);
      const c = s.drapeaux['revue_conseil'];
      if (c) vus.push(String(c));
    }
    expect(new Set(vus).size).toBe(vus.length);
    expect(prochainConseil(s)).toBeUndefined();
    expect(jetonProche(s, 'revue_conseil')).toMatch(/plus de conseil/);
  });

  it('la revue nomme ce qui a progressé depuis la précédente', () => {
    const s = partie();
    revueMentor(s);
    s.attributs.perception += 8;
    revueMentor(s);
    expect(jetonProche(s, 'revue_progres')).toBe('ton regard');
  });
});

describe('Qui tu affrontes vraiment', () => {
  const ouvrir = (s: GameState, ev: string, choix: string) => {
    s.scene = { type: 'evenement', id: ev };
    return choisir(s, choix).scene as EtatAffrontement;
  };

  it('le défi du rival oppose au rival lui-même, avec sa mémoire, plus à un inconnu au nom tiré au hasard', () => {
    const s = partie();
    s.jour = s.naissance + 360 * 10;
    const sc = ouvrir(s, 'a_rival_defi', 'accepter');
    expect(sc.type).toBe('affrontement');
    expect(sc.nomAdversaire).toBe(defPnj(s, s.roles['rival'])!.nom);
    expect(sc.registreId).toBe(s.roles['rival']);
  });

  it('au tournoi, c’est le rival s’il est vivant, un inconnu sinon', () => {
    const vivant = partie();
    vivant.jour = vivant.naissance + 360 * 13;
    vivant.rang = 'genin';
    expect(ouvrir(vivant, 'c2_tournoi', 'frontal').nomAdversaire).toBe(defPnj(vivant, vivant.roles['rival'])!.nom);
    const mort = partie();
    mort.jour = mort.naissance + 360 * 13;
    mort.rang = 'genin';
    appliquerEffet(mort, { pnjEtat: '@rival', etat: 'mort' }, nouveauCtx());
    expect(ouvrir(mort, 'c2_tournoi', 'frontal').nomAdversaire).toBe('Ton adversaire du tournoi');
  });

  it('s’entraîner avec l’aîné·e, c’est affronter l’aîné·e, à l’entraînement : on n’y meurt pas', () => {
    const s = partie();
    s.jour = s.naissance + 360 * 8;
    const sc = ouvrir(s, 'ap_aine_premier', 'combat');
    expect(sc.nomAdversaire).toBe(s.pnjGeneres['famille_aine'].nom);
    expect(sc.contexte).toBe('entrainement');
  });
});

describe('Les scènes des proches', () => {
  it('le rival cite le compte exact, et ce qu’il n’a pas oublié', () => {
    const s = partie();
    registre(s, 3, 1);
    s.drapeaux['passage'] = 1;
    s.drapeaux['humilie_lancer'] = true;
    const t = resoudreTexte(R.evenements['pr_rival_compte'].texte, s);
    expect(t).toMatch(/trois victoires à une, pour toi/);
    expect(t).toMatch(/Le shuriken sur le poteau/);
  });

  it('le parent réagit à ce que tu es devenu·e : le gilet de chūnin, le bol de l’aîné·e disparu', () => {
    const s = partie();
    s.rang = 'chunin';
    s.drapeaux['passage'] = 2;
    appliquerEffet(s, { pnjEtat: '@aine', etat: 'mort' }, nouveauCtx());
    const t = resoudreTexte(R.evenements['pr_parent_table'].texte, s);
    expect(t).toMatch(/gilet/);
    expect(t).toMatch(/un bol de trop/);
  });

  it('l’aîné·e ne parle jamais comme un·e inconnu·e', () => {
    const tous = JSON.stringify(R.evenements['pr_aine_habitude']);
    expect(tous).not.toMatch(/je m’appelle|enchanté|se présente|vous ne vous connaissez/i);
  });
});
