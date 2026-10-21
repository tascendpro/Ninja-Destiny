import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { evaluer } from '../src/engine/conditions';
import { creation } from './aide';
import { evenementDisponible } from '../src/engine/selection';
import { ficheJoueur } from '../src/engine/bingo';

/** Une scène ouverte à un âge donné, au village. */
function devant(id: string, graine: number, ageAns: number, chapitre = 2): GameState {
  const s = nouvellePartie(creation(), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.chapitre = chapitre;
  s.rang = 'genin';
  s.statut = 'actif';
  s.scene = { type: 'evenement', id };
  return s;
}

describe('Tuer, au village', () => {
  it('une victoire au tournoi chūnin passe d’abord par le coup de grâce, puis par le verdict de l’examen', () => {
    const tournoi = R.evenements['c2_tournoi'];
    const suites = tournoi.choix.flatMap((c) => [c.test?.succes.suite, c.test?.critique?.suite]).filter(Boolean);
    expect(suites).toContain('c2_coup_de_grace');
    for (const c of R.evenements['c2_coup_de_grace'].choix) expect(c.suite).toBe('c2_verdict');
  });

  it('frapper à mort à l’examen : l’arbitre, parfois le sensei, et parfois personne n’arrive à temps', () => {
    const issues = new Map<string, number>();
    for (let g = 1; g <= 80; g++) {
      const s = choisir(devant('c2_coup_de_grace', g, 14), 'frapper');
      const i = String(s.drapeaux['coup_issue']);
      issues.set(i, (issues.get(i) ?? 0) + 1);
      if (i === 'tue') {
        expect(s.pnj[s.roles['rival']].etat).toBe('mort');
        // Celui qui a frappé après la fin du combat ne reçoit pas la veste.
        const promu = R.evenements['c2_verdict'].choix.find((c) => c.id === 'promu')!;
        s.drapeaux['c2_tournoi_gagne'] = true;
        expect(evaluer(promu.si, s)).toBe(false);
      } else expect(s.pnj[s.roles['rival']].etat).not.toBe('mort');
    }
    expect(issues.get('arbitre')).toBeGreaterThan(0);
    expect(issues.get('sensei')).toBeGreaterThan(0);
    expect(issues.get('tue')).toBeGreaterThan(0);
  });

  it('achever un ennemi en mission : le sensei retient parfois un jeune genin, jamais un adulte', () => {
    let retenus = 0;
    for (let g = 1; g <= 60; g++) {
      const s = devant('x_verdict', g, 13);
      s.drapeaux['verdict_forme'] = 'duel';
      if (choisir(s, 'achever').drapeaux['verdict_issue'] === 'sensei') retenus++;
      const adulte = devant('x_verdict', g, 26, 4);
      adulte.rang = 'jonin';
      adulte.drapeaux['verdict_forme'] = 'duel';
      expect(choisir(adulte, 'achever').drapeaux['verdict_issue']).toBe('tue');
    }
    expect(retenus).toBeGreaterThan(10);
    expect(retenus).toBeLessThan(50);
  });

  it('un meurtre dans la rue mène devant le conseil, qui peut bannir', () => {
    const s = devant('v_provocation', 4, 18);
    s.pnj[s.roles['coequipierA']].etat = 'mort';
    const apres = choisir(s, 'tuer');
    expect(apres.drapeaux['coup_issue']).toBe('tue');
    expect(apres.planifies.some((p) => p.evenementId === 'v_proces')).toBe(true);
    let bannis = 0;
    for (let g = 1; g <= 40; g++) {
      const p = devant('v_proces', g, 18);
      p.drapeaux['meurtre_village'] = true;
      const r = choisir(p, 'avouer');
      if (r.drapeaux['banni']) {
        bannis++;
        expect(r.statut).toBe('errant');
      }
    }
    expect(bannis).toBeGreaterThan(0);
    expect(bannis).toBeLessThan(40);
  });

  it('tuer son rival laisse une trace : la famille vient souvent réclamer le prix du sang, pas toujours', () => {
    let reclame = 0;
    let tues = 0;
    for (let g = 1; g <= 80; g++) {
      const s = choisir(devant('c2_coup_de_grace', g, 14), 'frapper');
      if (s.drapeaux['coup_issue'] !== 'tue') continue;
      tues++;
      expect(s.drapeaux['rival_tue']).toBe(true);
      if (s.planifies.some((p) => p.evenementId === 'vc_clan_rival')) reclame++;
    }
    expect(tues).toBeGreaterThan(3);
    expect(reclame).toBeGreaterThan(0);
    expect(reclame).toBeLessThanOrEqual(tues);
  });

  it('les conséquences n’arrivent qu’à ceux qui ont tué', () => {
    const innocent = devant('v_provocation', 1, 20, 3);
    for (const id of ['vc_mere', 'vc_regards', 'vc_ami', 'vc_cauchemar', 'vc_tombe', 'vc_ombre']) expect(evenementDisponible(innocent, R.evenements[id]), id).toBe(false);
    const tueur = devant('v_provocation', 1, 20, 3);
    tueur.drapeaux['tueur_village'] = true;
    tueur.drapeaux['rival_tue'] = true;
    for (const id of ['vc_mere', 'vc_regards', 'vc_cauchemar', 'vc_tombe']) expect(evenementDisponible(tueur, R.evenements[id]), id).toBe(true);
  });

  it('refuser le prix du sang ouvre une vendetta, inscrite au Bingo Book', () => {
    let embuscades = 0;
    for (let g = 1; g <= 40; g++) {
      const s = devant('vc_clan_rival', g, 18, 3);
      s.drapeaux['rival_tue'] = true;
      const r = choisir(s, 'refuser');
      expect(r.drapeaux['vendetta']).toBe('ouverte');
      if (r.planifies.some((p) => p.evenementId === 'vc_embuscade')) embuscades++;
    }
    expect(embuscades).toBeGreaterThan(15);
    expect(embuscades).toBeLessThan(40);
    const s = devant('vc_clan_rival', 1, 20, 3);
    Object.assign(s.drapeaux, { rival_tue: true, vendetta: 'ouverte', tournoi_sang: true });
    s.social.reputationOmbre = 30;
    expect(ficheJoueur(s)?.exploits).toEqual(expect.arrayContaining(['A tué un camarade de son propre village.', 'Une famille de son village a juré sa mort.']));
  });
});
