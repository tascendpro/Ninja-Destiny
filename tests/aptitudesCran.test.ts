import { describe, expect, it } from 'vitest';
import { evaluerEpreuve } from '../src/engine/epreuves';
import { nouvellePartie } from '../src/engine/moteur';
import { scoresIntentions } from '../src/engine/combat/adversaire';
import { adversaireDef } from '../src/engine/combat/adversaire';
import type { CheckDef } from '../src/engine/types';
import type { EtatAffrontement } from '../src/engine/combat/types';
import { creation, combinaisons } from './aide';
import { choisir } from '../src/engine/moteur';
import { creerAffrontement } from '../src/engine/combat/affrontement';

describe('Les aptitudes comptent vraiment', () => {
  it('dix points de plus dans l’aptitude d’une épreuve se voient nettement dans le pourcentage', () => {
    const s = nouvellePartie(creation(), 2);
    const t = { type: 'competence', difficulte: 45, attributs: { force: 2, agilite: 1 }, succes: { texte: '' }, echec: { texte: '' } } as unknown as CheckDef;
    s.attributs.force = 40;
    const avant = evaluerEpreuve(s, t).proba;
    s.attributs.force = 50;
    const apres = evaluerEpreuve(s, t).proba;
    expect(apres - avant).toBeGreaterThanOrEqual(0.15);
  });
});

describe('Le cran de l’adversaire', () => {
  const combat = (graine: number) => {
    const c = combinaisons().find((x) => x.clan === 'uchiha')!;
    let s = nouvellePartie(creation(c), graine);
    s.jour = s.naissance + 360 * 14;
    s.rang = 'genin';
    s.scene = { type: 'evenement', id: 'ap_rival_defi' };
    s = choisir(s, 'combattre');
    return s;
  };

  it('chaque rencontre a son cran, et tous les crans existent', () => {
    const crans = new Set<string>();
    for (let g = 1; g <= 60; g++) {
      const s = nouvellePartie(creation(), g);
      s.jour = s.naissance + 360 * 15;
      crans.add(creerAffrontement(s, { evenementId: 'x', adversaireId: 'mc_bandits', contexte: 'embuscade', plafond: 6 }).cran ?? 'ordinaire');
    }
    expect(crans.size).toBeGreaterThanOrEqual(3);
  });

  it('personne ne fuit avant la troisième manche ; l’acharné ne fuit jamais', () => {
    const s = combat(3);
    if (s.scene.type !== 'affrontement') return;
    const sc = s.scene as EtatAffrontement;
    const d = { ...adversaireDef(sc.adversaireId), seuils: { fuite: 90, reddition: 0 } };
    sc.adv.endurance = Math.round(sc.adv.enduranceMax * 0.1);
    sc.manche = 1;
    sc.cran = 'lache';
    const tot = scoresIntentions(s, sc, d).fuir;
    sc.manche = 4;
    expect(scoresIntentions(s, sc, d).fuir).toBeGreaterThan(tot);
    sc.cran = 'acharne';
    expect(scoresIntentions(s, sc, d).fuir).toBe(0);
  });
});
