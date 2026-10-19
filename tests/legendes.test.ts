import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { choisir, continuer, manche, nouvellePartie, vueCombat } from '../src/engine/moteur';
import { evenementDisponible } from '../src/engine/selection';
import { R } from '../src/engine/registre';
import { ATTRIBUTS } from '../src/engine/types';
import type { GameState } from '../src/engine/types';
import { vueBingo } from '../src/engine/bingo';
import { recitTechnique } from '../src/engine/epreuves';

const adulte = (graine = 5, force = 100): GameState => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), graine);
  s.jour = s.naissance + 22 * 360;
  s.chapitre = 3;
  s.rang = 'jonin';
  for (const a of ATTRIBUTS) s.attributs[a] = force;
  s.maitrises['taijutsu'].tier = force > 50 ? 5 : 0;
  return s;
};

/** Joue un combat (une ou plusieurs manches) jusqu'au résultat, en esquivant quand l'adversaire a l'initiative. */
const combattre = (s: GameState, choix: string): GameState => {
  let t = choisir(s, choix);
  while (t.scene.type === 'combat') t = manche(t, vueCombat(t)!.adversaire ? 'esquiver' : 'simple');
  return t;
};

describe('Après un combat à mort', () => {
  it('vaincre un adversaire en mission ouvre la scène de son sort, et l’épargner peut le faire revenir', () => {
    const s = adulte();
    s.scene = { type: 'evenement', id: 'mb_daimyo' };
    let t = combattre(s, 'intercepter');
    expect(t.scene.type === 'resultat' && t.scene.suite).toBe('x_verdict');
    t = continuer(t);
    expect(t.scene.type === 'evenement' && t.scene.id).toBe('x_verdict');
    t = choisir(t, 'epargner');
    expect(t.drapeaux['ennemis_epargnes']).toBe(1);
    expect(t.drapeaux['verdict_forme']).toBeUndefined();
  });

  it('vaincu·e par une escouade, on peut être capturé·e ; la rançon rend le statut d’avant', () => {
    let trouve: GameState | undefined;
    for (let g = 1; g < 400 && !trouve; g++) {
      const s = adulte(g, 5);
      s.scene = { type: 'evenement', id: 'ma_ravitaillement' };
      const t = combattre(s, 'forcer');
      if (t.scene.type === 'resultat' && t.scene.suite === 'x_capture') trouve = t;
    }
    expect(trouve).toBeDefined();
    let t = trouve!;
    expect(t.statut).toBe('capture');
    expect(t.drapeaux['statut_avant_capture']).toBe('actif');
    t = continuer(t);
    expect(t.scene.type === 'evenement' && t.scene.id).toBe('x_capture');
    t.jauges.ryo = 500;
    t = choisir(t, 'rancon');
    expect(t.statut).toBe('actif');
    expect(t.jauges.ryo).toBe(350);
  });

  it('un combat à mort perdu tue plus souvent qu’avant en difficulté intermédiaire', () => {
    let morts = 0;
    for (let g = 1; g <= 300; g++) {
      const s = adulte(g, 5);
      s.scene = { type: 'evenement', id: 'e_duel' };
      s.statut = 'errant';
      const t = combattre(s, 'accepter');
      if (t.fin?.id === 'mort') morts++;
    }
    // Avec 45 % des échecs profonds mortels (30 % avant), un personnage très faible meurt souvent.
    expect(morts).toBeGreaterThan(60);
  });
});

describe('Les Sannin et l’Akatsuki', () => {
  it('Jiraiya, une fois maître, enseigne le mode ermite', () => {
    const s = adulte();
    s.chapitre = 3;
    expect(evenementDisponible(s, R.evenements['sn_jiraiya'])).toBe(true);
    s.scene = { type: 'evenement', id: 'sn_jiraiya' };
    const t = choisir(s, 'demander');
    expect(t.drapeaux['maitre_jiraiya']).toBe(true);
    expect(t.maitrises['mode_ermite']?.tier).toBe(1);
  });

  it('la marque maudite s’utilise comme une transformation et compte ses usages', () => {
    const s = adulte();
    s.scene = { type: 'evenement', id: 'sn_orochimaru' };
    const t = choisir(s, 'accepter');
    expect(t.maitrises['marque_maudite']?.tier).toBe(1);
    expect(R.maitrises['marque_maudite'].technique?.categorie).toBe('transformation');
  });

  it('l’Akatsuki recrute qui la connaît, et la rejoindre fait de toi un déserteur', () => {
    const s = adulte();
    s.drapeaux['akatsuki_connue'] = true;
    expect(evenementDisponible(s, R.evenements['ak_recrutement'])).toBe(true);
    s.scene = { type: 'evenement', id: 'ak_recrutement' };
    const t = choisir(s, 'rejoindre');
    expect(t.statut).toBe('deserteur');
    expect(t.drapeaux['akatsuki_membre']).toBe(true);
    expect(t.planifies.some((p) => p.evenementId === 'ak_prime')).toBe(true);
  });
});

describe('Bingo Book, transformations et famille', () => {
  it('ton nom entre dans le Bingo Book après des exploits, et parmi les recherchés si tu rejoins l’Akatsuki', () => {
    const s = adulte();
    s.social.reputation = 10;
    s.social.reputationOmbre = 5;
    s.rang = 'genin';
    expect(vueBingo(s).toi).toBeUndefined();
    s.drapeaux['c3_as_vaincu'] = true;
    s.drapeaux['quartier_sauve'] = true;
    const legende = vueBingo(s).toi!;
    expect(legende.liste).toBe('legendes');
    expect(legende.exploits.join(' ')).toContain('Faucheur');
    s.drapeaux['akatsuki_membre'] = true;
    s.statut = 'deserteur';
    const recherche = vueBingo(s).toi!;
    expect(recherche.liste).toBe('recherches');
    expect(recherche.prime).toBeGreaterThan(0);
    expect(recherche.surnom).toContain('Nuage rouge');
    expect(vueBingo(s).recherches.some((f) => f.id === 'kakuzu')).toBe(false);
  });

  it('le Susanoo grandit avec le palier, et son arme dépend de la nature de naissance', () => {
    const s = adulte();
    s.maitrises['susanoo'] = { ...s.maitrises['taijutsu'], id: 'susanoo', kind: 'jutsu', tier: 1 };
    const t = { type: 'combat', difficulte: 50, forme: 'duel' } as never;
    expect(recitTechnique(s, 'susanoo', t)).toContain('squelette');
    s.maitrises['susanoo'].tier = 3;
    expect(recitTechnique(s, 'susanoo', t)).toContain('épée de flammes noires');
    s.creation.element = 'raiton';
    expect(recitTechnique(s, 'susanoo', t)).toContain('arc tendu de foudre');
  });

  it('quand le quartier est attaqué, on ne défend qu’un des siens et les autres en paient le prix', () => {
    const s = adulte();
    s.drapeaux['famille_fondee'] = true;
    s.drapeaux['conjoint_genre'] = 'm';
    s.scene = { type: 'evenement', id: 'f_quartier' };
    const t = combattre(s, 'enfant');
    expect(t.drapeaux['quartier_choix']).toBe('enfant');
    expect(!!t.drapeaux['conjoint_blesse'] || !!t.drapeaux['conjoint_mort']).toBe(true);
    expect(t.scene.type === 'resultat' && t.scene.texte).not.toContain('{');
  });
});
