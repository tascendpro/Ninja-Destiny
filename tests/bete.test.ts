import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { choisir, continuer, manche, nouvellePartie, vueCombat } from '../src/engine/moteur';
import { entreeTransformation } from '../src/engine/epreuves';
import { blocageApprentissage } from '../src/engine/maitrise';
import { evenementDisponible } from '../src/engine/selection';
import { avancerTemps } from '../src/engine/temps';
import { nouveauCtx } from '../src/engine/etat';
import { appliquerEffets } from '../src/engine/effets';
import { chanceRage } from '../src/engine/pertes';
import { R } from '../src/engine/registre';
import type { GameState } from '../src/engine/types';

const jinchuriki = (controle: number, graine = 3): GameState => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), graine, { biju: 'kyubi' });
  s.jour = s.naissance + 16 * 360;
  s.chapitre = 2;
  s.rang = 'genin';
  s.attributs.controleEmotionnel = controle;
  s.maitrises['chakra_biju'].awakened = true;
  s.maitrises['chakra_biju'].tier = 2;
  return s;
};

describe('La bête du jinchūriki', () => {
  it('peu de contrôle émotionnel, beaucoup de rage ; une mort vue de ses yeux pèse plus qu’une nouvelle', () => {
    const colere = jinchuriki(15);
    const calme = jinchuriki(85);
    expect(chanceRage(colere)).toBeGreaterThan(chanceRage(calme) + 0.4);
    expect(chanceRage(colere, false)).toBeLessThan(chanceRage(colere));
    expect(chanceRage(nouvellePartie(creation(), 3))).toBe(0);
  });

  it('la mort d’un camarade sous ses yeux peut libérer la bête', () => {
    let liberes = 0;
    for (let g = 1; g <= 60; g++) {
      const s = jinchuriki(10, g);
      appliquerEffets(s, [{ pnjEtat: '@coequipierB', etat: 'mort', cause: 'test' }], nouveauCtx());
      if (s.planifies.some((p) => p.evenementId === 'b_dechainement')) liberes++;
    }
    expect(liberes).toBeGreaterThan(30);
  });

  it('reprendre le contrôle est un pari ; le réussir ouvre la rencontre avec la bête', () => {
    let reussites = 0;
    let echecs = 0;
    for (let g = 1; g <= 80; g++) {
      const s = jinchuriki(50, g);
      s.scene = { type: 'evenement', id: 'b_dechainement' };
      const t = choisir(s, 'reprendre');
      if (t.drapeaux['rencontre_biju']) reussites++;
      else echecs++;
    }
    expect(reussites).toBeGreaterThan(5);
    expect(echecs).toBeGreaterThan(5);
  });

  it('les paliers de la bête s’ouvrent par la descente, l’accord, l’harmonie, et débloquent les transformations', () => {
    const s = jinchuriki(60);
    s.jour = s.naissance + 23 * 360;
    expect(evenementDisponible(s, R.evenements['b_descente'])).toBe(true);
    s.drapeaux['rencontre_biju'] = true;
    s.maitrises['chakra_biju'].tier = 3;
    expect(evenementDisponible(s, R.evenements['b_accord'])).toBe(true);
    expect(R.maitrises['biju_version2'].technique?.requis?.[0]).toEqual({ maitrise: 'chakra_biju', palierMin: 3 });
    expect(R.maitrises['biju_mode'].technique?.limite?.controle).toBe(true);
  });
});

describe('Les pertes au fil de la vie', () => {
  it('des proches meurent au fil des années, jamais deux fois de suite, et la nouvelle a sa scène', () => {
    let pertes = 0;
    for (let g = 1; g <= 20; g++) {
      const s = nouvellePartie(creation(), g);
      s.jour = s.naissance + 18 * 360;
      s.chapitre = 3;
      s.rang = 'chunin';
      const ctx = nouveauCtx();
      avancerTemps(s, 360 * 10, ctx);
      const morts = Object.entries(s.pnj).filter(([, p]) => p.etat === 'mort').length;
      pertes += morts;
      if (s.drapeaux['mort_recente']) {
        expect(s.planifies.some((p) => p.evenementId === 'x_mort_proche')).toBe(true);
      }
      expect(morts).toBeLessThanOrEqual(6);
    }
    expect(pertes).toBeGreaterThan(10);
  });

  it('la scène de la nouvelle nomme le proche disparu', () => {
    const s = nouvellePartie(creation(), 4);
    s.jour = s.naissance + 20 * 360;
    const id = s.roles['coequipierB'];
    s.pnj[id].etat = 'mort';
    s.pnj[id].cause = 'tombé·e en mission, loin de tout';
    s.drapeaux['mort_recente'] = id;
    s.scene = { type: 'evenement', id: 'x_mort_proche' };
    const t = choisir(s, 'funerailles');
    expect(t.drapeaux['mort_recente']).toBeUndefined();
    expect(continuer(t)).toBeDefined();
  });
});

describe('Transformations', () => {
  const combat = (techs: [string, number][]) => {
    const s = nouvellePartie(creation({ village: 'kumo', clan: 'sans_clan', element: 'raiton' }), 7);
    s.jour = s.naissance + 24 * 360;
    s.chapitre = 4;
    s.rang = 'jonin';
    s.jauges.chakraMax = 300;
    s.jauges.chakra = 300;
    for (const [id, tier] of techs) s.maitrises[id] = { ...s.maitrises['taijutsu'], id, kind: 'jutsu', awakened: true, tier: tier as 1, trainingDays: 0, bloquee: false };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    const t = choisir(s, 'frontal');
    if (t.scene.type === 'combat') t.scene.priorite = undefined;
    return t;
  };

  it('se transformer ne coûte pas la manche, renforce l’attaque et la défense, et se raconte autrement qu’une attaque', () => {
    let t = combat([['raiton_yoroi', 2]]);
    const avant = vueCombat(t)!;
    expect(avant.transformations.map((x) => x.id)).toContain('raiton_yoroi');
    expect(avant.attaques.some((a) => a.id === 'raiton_yoroi')).toBe(false);
    t = manche(t, 'transfo:raiton_yoroi');
    const apres = vueCombat(t)!;
    expect(apres.manche).toBe(avant.manche);
    expect(apres.transformation?.nom).toContain('Raiton no Yoroi');
    expect(apres.transformations).toEqual([]);
    expect(apres.simple).toBeGreaterThanOrEqual(avant.simple);
    expect(apres.journal.at(-1)).toMatch(/^Transformation\./);
    expect(apres.journal.at(-1)).toMatch(/armure de Raiton|éclair|foudre/);
  });

  it('certaines techniques n’existent que transformé', () => {
    let t = combat([['raiton_yoroi', 3], ['raiton_lariat', 1]]);
    expect(vueCombat(t)!.attaques.some((a) => a.id === 'raiton_lariat')).toBe(false);
    t = manche(t, 'transfo:raiton_yoroi');
    expect(vueCombat(t)!.attaques.some((a) => a.id === 'raiton_lariat')).toBe(true);
  });

  it('le récit d’entrée change avec le palier', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 7);
    s.maitrises['susanoo'] = { ...s.maitrises['taijutsu'], id: 'susanoo', kind: 'jutsu', awakened: true, tier: 1 };
    expect(entreeTransformation(s, 'susanoo', 0)).toMatch(/côtes|squelette/);
    s.maitrises['susanoo'].tier = 3;
    expect(entreeTransformation(s, 'susanoo', 0)).toContain('épée de flammes noires');
  });
});

describe('Transformations élémentaires, coût et durée', () => {
  const preparer = (techs: [string, number][], element: 'katon' | 'raiton' = 'raiton') => {
    const s = nouvellePartie(creation({ village: 'kumo', clan: 'sans_clan', element }), 7);
    s.jour = s.naissance + 26 * 360;
    s.chapitre = 4;
    s.rang = 'jonin';
    s.jauges.chakraMax = 300;
    s.jauges.chakra = 300;
    for (const [id, tier] of techs) s.maitrises[id] = { ...s.maitrises['taijutsu'], id, kind: id.startsWith('nature_') ? 'element' : 'jutsu', awakened: true, tier: tier as 1, trainingDays: 0, bloquee: false };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    return s;
  };
  const sansPriorite = (t: GameState) => {
    if (t.scene.type === 'combat') t.scene.priorite = undefined;
    return t;
  };
  const jouer = (t: GameState) => sansPriorite(manche(sansPriorite(t), vueCombat(t)!.adversaire ? 'esquiver' : 'simple'));

  it('une transformation limitée retombe d’elle-même au bout de sa durée', () => {
    let t = sansPriorite(choisir(preparer([['mode_ermite', 2]]), 'frontal'));
    t = manche(t, 'transfo:mode_ermite');
    expect(vueCombat(t)!.transformation?.restantes).toBe(3);
    t = jouer(t);
    expect(t.scene.type === 'combat' && t.scene.transformation).toBe('mode_ermite');
  });

  it('faute de chakra, la transformation ne tient plus', () => {
    let t = sansPriorite(choisir(preparer([['raiton_yoroi', 2]]), 'frontal'));
    t = manche(t, 'transfo:raiton_yoroi');
    t.jauges.chakra = 2;
    t = jouer(t);
    if (t.scene.type === 'combat') {
      expect(t.scene.transformation).toBeUndefined();
      expect(t.scene.journal.join(' ')).toContain('plus assez de chakra');
    }
  });

  it('les paliers de nature ouvrent leurs transformations', () => {
    const s = preparer([['nature_katon', 3]], 'katon');
    expect(blocageApprentissage(s, 'katon_manteau')).toBeUndefined();
    expect(blocageApprentissage(s, 'katon_phenix_avatar')).toMatch(/palier 5/);
    expect(R.maitrises['katon_phenix_avatar'].technique?.posture?.duree).toBe(2);
  });

  it('une technique de lignée sans clan s’apprend (Futton pour un sans-clan qui porte la lignée)', () => {
    const s = preparer([['nature_katon', 2], ['nature_suiton', 2], ['futton', 3]], 'katon');
    appliquerEffets(s, [{ apprendre: 'futton_gokamugen', source: 'mentor' }], nouveauCtx());
    expect(s.maitrises['futton_gokamugen']?.tier).toBe(1);
  });
});
