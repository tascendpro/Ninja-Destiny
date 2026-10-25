import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { choisir, combattre, continuer, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { puissanceJoueur } from '../src/engine/combat/resolution';
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
    return choisir(s, 'frontal');
  };
  const actions = (t: GameState, famille: string) => vueAffrontement(t)!.familles.find((f) => f.id === famille)?.actions.map((a) => a.id) ?? [];

  it('se transformer prend une manche, renforce l’attaque et la défense, et se raconte autrement qu’une attaque', () => {
    let t = combat([['raiton_yoroi', 2]]);
    expect(actions(t, 'pouvoir')).toContain('raiton_yoroi');
    expect(actions(t, 'ninjutsu')).not.toContain('raiton_yoroi');
    const avant = puissanceJoueur(t, { famille: 'taijutsu', choix: 'frappe_rapide' });
    t = combattre(t, { famille: 'pouvoir', choix: 'raiton_yoroi' });
    if (t.scene.type !== 'affrontement') return;
    expect(t.scene.transformation).toBe('raiton_yoroi');
    expect(actions(t, 'pouvoir')).not.toContain('raiton_yoroi');
    expect(puissanceJoueur(t, { famille: 'taijutsu', choix: 'frappe_rapide' })).toBeGreaterThan(avant);
    expect(t.scene.journal.at(-1)!.impact).toMatch(/armure de Raiton|éclair|foudre/);
  });

  it('au palier 1 ou 2, lancer une autre technique éteint la transformation ; dès le palier 3, elle tient', () => {
    for (const [tier, tient] of [[2, false], [3, true]] as const) {
      let t = combat([['raiton_yoroi', tier], ['raiton_decharge', 2], ['nature_raiton', 3]]);
      if (t.scene.type !== 'affrontement') continue;
      t.scene.plafond = 10;
      t = combattre(t, { famille: 'pouvoir', choix: 'raiton_yoroi' });
      if (t.scene.type !== 'affrontement') continue;
      t = combattre(t, { famille: 'ninjutsu', choix: 'raiton_decharge' });
      if (t.scene.type !== 'affrontement') continue;
      expect(t.scene.transformation === 'raiton_yoroi').toBe(tient);
    }
  });

  it('certaines techniques n’existent que transformé', () => {
    let t = combat([['raiton_yoroi', 3], ['raiton_lariat', 1]]);
    expect(actions(t, 'taijutsu')).not.toContain('raiton_lariat');
    t = combattre(t, { famille: 'pouvoir', choix: 'raiton_yoroi' });
    if (t.scene.type === 'affrontement') expect(actions(t, 'taijutsu')).toContain('raiton_lariat');
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
  const garde = (t: GameState) => (t.scene.type === 'affrontement' ? combattre(t, { famille: 'defense', choix: 'garde' }) : t);

  it('une transformation limitée tient sa durée, puis retombe d’elle-même', () => {
    let t = choisir(preparer([['mode_ermite', 2]]), 'frontal');
    if (t.scene.type !== 'affrontement') return;
    t.scene.plafond = 20;
    t = combattre(t, { famille: 'pouvoir', choix: 'mode_ermite' });
    t = garde(t);
    if (t.scene.type === 'affrontement') expect(t.scene.transformation).toBe('mode_ermite');
    const duree = R.maitrises['mode_ermite'].technique!.posture!.duree!;
    for (let i = 0; i < duree + 1 && t.scene.type === 'affrontement'; i++) t = garde(t);
    if (t.scene.type === 'affrontement') expect(t.scene.transformation).toBeUndefined();
  });

  it('faute de chakra, la transformation ne tient plus', () => {
    let t = choisir(preparer([['raiton_yoroi', 2]]), 'frontal');
    t = combattre(t, { famille: 'pouvoir', choix: 'raiton_yoroi' });
    t.jauges.chakra = 0;
    t = garde(t);
    if (t.scene.type === 'affrontement') {
      expect(t.scene.transformation).toBeUndefined();
      expect(t.scene.journal.at(-1)!.impact.length).toBeGreaterThan(0);
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
