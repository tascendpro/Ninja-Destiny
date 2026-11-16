// Les règles de combat 2 : feinte, concentration, souffle, adversaire qui lit selon son niveau, KO des duels d'enfants.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { finesseTactique, scoresIntentions, adversaireDef } from '../src/engine/combat/adversaire';
import { graviteCombat, seuilKO } from '../src/engine/combat/contextes';
import { REGLES_COMBAT } from '../src/engine/combat/types';
import type { ActionCombat, EtatAffrontement } from '../src/engine/combat/types';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { combinaisons, creation } from './aide';

const PILOTE = 'ap_rival_defi';

function duel(ageAns: number, graine: number): GameState {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.rang = ageAns >= 12 ? 'genin' : 'eleve';
  if (ageAns >= 9) appliquerEffet(s, { enseigner: 'katon_boule' }, nouveauCtx());
  s.scene = { type: 'evenement', id: PILOTE };
  return choisir(s, 'combattre');
}
const sc = (s: GameState) => s.scene as EtatAffrontement;
const actions = (s: GameState) => vueAffrontement(s)!.familles.flatMap((f) => f.actions.map((a) => a.id));

describe('Combat, règles 2', () => {
  it('un combat ouvert aujourd’hui porte les règles 2 ; la feinte, la concentration et le souffle y sont proposés', () => {
    const s = duel(14, 3);
    expect(sc(s).regles).toBe(REGLES_COMBAT);
    expect(actions(s)).toEqual(expect.arrayContaining(['feinte', 'concentration', 'souffle']));
  });

  it('un combat enregistré avant les règles 2 les ignore : ni nouvelles actions, ni seuil de KO', () => {
    const s = duel(9, 4);
    delete sc(s).regles;
    expect(actions(s)).not.toContain('feinte');
    expect(actions(s)).not.toContain('souffle');
    expect(seuilKO(s, sc(s))).toBe(0);
    expect(() => combattre(s, { famille: 'taijutsu', choix: 'feinte' })).toThrow();
  });

  it('la feinte ouvre la garde de qui attend, ne sert à rien contre qui attaque, et se lit quand on la répète', () => {
    let ouvre = 0, perdue = 0, lueApresDeux = 0, lueAuDebut = 0;
    for (let g = 1; g <= 160; g++) {
      const s = duel(14, g);
      const intention = sc(s).intention;
      const n = combattre(s, { famille: 'taijutsu', choix: 'feinte' });
      if (n.scene.type !== 'affrontement') continue;
      const e = sc(n).journal.at(-1)!;
      expect(e.inflige ?? 0).toBe(0);
      if (['attaque', 'technique', 'majeure'].includes(intention)) {
        expect(e.lecture).toMatch(/Feinte perdue/);
        perdue++;
      } else if (/Feinte :/.test(e.lecture)) {
        expect(sc(n).ouverture).toBeGreaterThanOrEqual(22);
        expect(sc(n).adv.garde).toBe('desequilibre');
        ouvre++;
      } else if (/Feinte lue/.test(e.lecture)) lueAuDebut++;
      // La même feinte, déjà montrée deux fois dans ce combat, contre quelqu'un qui attend : de plus en plus souvent éventée.
      if (!['attaque', 'technique', 'majeure'].includes(intention)) {
        const t = duel(14, g);
        sc(t).intention = intention;
        sc(t).vuesCeCombat['feinte'] = 2;
        const r = combattre(t, { famille: 'taijutsu', choix: 'feinte' });
        if (r.scene.type === 'affrontement' && /éventée/.test(sc(r).journal.at(-1)!.lecture)) lueApresDeux++;
      }
    }
    expect(ouvre).toBeGreaterThan(10);
    expect(perdue).toBeGreaterThan(10);
    expect(lueApresDeux).toBeGreaterThan(lueAuDebut);
  });

  it('la concentration rend la prochaine attaque plus juste ; elle ne dure qu’une manche', () => {
    const s = duel(14, 7);
    const avant = vueAffrontement(s)!.familles.find((f) => f.id === 'taijutsu')!.actions.find((a) => a.id === 'coup_puissant')!.chance!;
    const n = combattre(s, { famille: 'observation', choix: 'concentration' });
    if (n.scene.type !== 'affrontement') return;
    expect(vueAffrontement(n)!.concentre).toBe(true);
    const apres = vueAffrontement(n)!.familles.find((f) => f.id === 'taijutsu')!.actions.find((a) => a.id === 'coup_puissant')!.chance!;
    expect(apres).toBeGreaterThan(avant);
    expect(vueAffrontement(n)!.familles.find((f) => f.id === 'observation')!.actions.find((a) => a.id === 'concentration')!.disponible).toBe(false);
    const m = combattre(n, { famille: 'defense', choix: 'garde' });
    if (m.scene.type === 'affrontement') expect(vueAffrontement(m)!.concentre).toBe(false);
  });

  it('reprendre son souffle rend de moins en moins, et se bloque après trois fois', () => {
    let s = duel(14, 11);
    sc(s).joueur.endurance = Math.round(sc(s).joueur.enduranceMax * 0.5);
    const gains: number[] = [];
    for (let k = 0; k < 3 && s.scene.type === 'affrontement'; k++) {
      const avant = s.jauges.chakra;
      s.jauges.chakra = 0;
      s = combattre(s, { famille: 'defense', choix: 'souffle' });
      if (s.scene.type !== 'affrontement') return;
      gains.push(s.jauges.chakra);
      void avant;
    }
    expect(gains[0]).toBeGreaterThan(gains[1]);
    expect(gains[1]).toBeGreaterThan(gains[2]);
    const souffle = vueAffrontement(s)!.familles.find((f) => f.id === 'defense')!.actions.find((a) => a.id === 'souffle')!;
    expect(souffle.disponible).toBe(false);
  });

  it('un enfant lit à peine tes habitudes ; un jōnin lit toute une série', () => {
    expect(finesseTactique('enfant', 'feroce')).toBeLessThan(0.3);
    expect(finesseTactique('jonin', 'veteran')).toBeGreaterThan(1);
    const s = duel(14, 5);
    const x = sc(s);
    const d = adversaireDef(x.adversaireId);
    x.actionsJoueur = ['coup_puissant', 'coup_puissant'];
    x.niveauAdv = 'enfant';
    const enfant = scoresIntentions(s, x, d).defense;
    x.niveauAdv = 'jonin';
    const jonin = scoresIntentions(s, x, d).defense;
    expect(jonin).toBeGreaterThan(enfant);
    // Tu as passé ta manche à observer : il frappe.
    x.actionsJoueur = ['observer'];
    const apresObserver = scoresIntentions(s, x, d).attaque;
    x.actionsJoueur = ['coup_puissant'];
    expect(apresObserver).toBeGreaterThan(scoresIntentions(s, x, d).attaque);
  });

  it('entre 6 et 12 ans, un duel amical s’arrête sous 30 % des PV : hors de combat, jamais mort, blessures légères', () => {
    let ko = 0;
    for (let g = 1; g <= 60; g++) {
      let s = duel(9, g);
      expect(seuilKO(s, sc(s))).toBeCloseTo(0.3);
      // Un duel assez long pour que l'un des deux faiblisse vraiment.
      sc(s).plafond = 12;
      const v = vueAffrontement(s)!;
      expect(v.ko).toBeCloseTo(0.3);
      expect(v.gravite.id).toBe('amical');
      let dernier: EtatAffrontement | undefined;
      for (let k = 0; k < 30 && s.scene.type === 'affrontement'; k++) {
        dernier = sc(s);
        const a: ActionCombat = dernier.joueur.sonne > 0 ? { famille: 'defense', choix: 'garde' } : { famille: 'taijutsu', choix: 'coup_puissant' };
        s = combattre(s, a);
      }
      expect(s.statut).not.toBe('mort');
      expect(s.blessures.some((b) => b.nom === 'Blessures d’un combat perdu')).toBe(false);
      const fin = s.scene.type === 'resultat' ? s.scene : undefined;
      if (fin?.changements.some((c) => c.t === 'info' && /Hors de combat/.test(c.message))) {
        ko++;
        // Personne n'est allé à zéro : le seuil a arrêté le combat avant.
        expect(dernier!.joueur.endurance > 0 && dernier!.adv.endurance > 0).toBe(true);
      }
    }
    expect(ko).toBeGreaterThan(5);
  });

  it('au-delà de 12 ans, ou dans un combat qui peut tuer, pas de seuil de KO', () => {
    const s = duel(14, 2);
    expect(seuilKO(s, sc(s))).toBe(0);
    expect(seuilKO(duel(9, 2), { contexte: 'mission', regles: 2 })).toBe(0);
    expect(graviteCombat('embuscade')).toBe('mortel');
    expect(graviteCombat('entrainement')).toBe('entrainement');
    expect(graviteCombat('examen')).toBe('serieux');
  });

  it('aucune des nouvelles actions ne domine : spammer feinte, concentration ou souffle perd plus souvent que frapper', () => {
    const victoires = (pol: (s: GameState, k: number) => ActionCombat) => {
      let v = 0;
      for (let g = 1; g <= 80; g++) {
        let s = duel(14, g);
        let k = 0;
        while (s.scene.type === 'affrontement' && k < 30) s = combattre(s, sc(s).joueur.sonne > 0 ? { famille: 'defense', choix: 'garde' } : pol(s, k++));
        if (s.scene.type === 'resultat' && (s.scene.issue === 'succes' || s.scene.issue === 'critique')) v++;
      }
      return v;
    };
    const frapper = victoires(() => ({ famille: 'taijutsu', choix: 'coup_puissant' }));
    const feinter = victoires(() => ({ famille: 'taijutsu', choix: 'feinte' }));
    // Alterner feinte puis coup : une vraie stratégie, pas une victoire assurée.
    const alterner = victoires((_s, k) => (k % 2 === 0 ? { famille: 'taijutsu', choix: 'feinte' } : { famille: 'taijutsu', choix: 'coup_puissant' }));
    expect(feinter).toBeLessThan(frapper);
    expect(alterner).toBeLessThan(80);
    expect(alterner).toBeGreaterThan(5);
  });
});

describe('Combat, règles 2 : lire l’adversaire paie', () => {
  it('feinter quand il attend : mieux que frapper sans réfléchir, sans être imbattable', () => {
    const offensive = (i: string) => i === 'attaque' || i === 'technique' || i === 'majeure';
    const bilan = (pol: (x: EtatAffrontement) => ActionCombat) => {
      let v = 0;
      for (let g = 1; g <= 300; g++) {
        let s = duel(14, g);
        let k = 0;
        while (s.scene.type === 'affrontement' && k++ < 30) s = combattre(s, sc(s).joueur.sonne > 0 ? { famille: 'defense', choix: 'garde' } : pol(sc(s)));
        const fin = s.registresCombat[s.roles['rival']]?.derniereIssue;
        if (fin === 'victoire' || fin === 'departage_gagne') v++;
      }
      return v / 300;
    };
    const rapide = bilan(() => ({ famille: 'taijutsu', choix: 'frappe_rapide' }));
    const puissant = bilan(() => ({ famille: 'taijutsu', choix: 'coup_puissant' }));
    // Une lecture parfaite de son intention (le test la lit dans l'état) : la feinte quand il attend, puis le gros coup.
    const lecteur = bilan((x) =>
      !offensive(x.intention) && x.ouverture <= 0 && (x.vuesCeCombat['feinte'] ?? 0) < 1
        ? { famille: 'taijutsu', choix: 'feinte' }
        : { famille: 'taijutsu', choix: x.ouverture > 0 ? 'coup_puissant' : 'frappe_rapide' },
    );
    expect(lecteur).toBeGreaterThan(Math.max(rapide, puissant));
    expect(lecteur).toBeLessThan(0.8);
  });
});

describe('Combat, règles 2 : la mort reste calibrée', () => {
  it('dans un combat mortel, perdre ne tue pas plus souvent qu’avec les règles 1', async () => {
    const { R } = await import('../src/engine/registre');
    const { actionAuHasard, hasard } = await import('./aideCampagne');
    const CLE = `${PILOTE}/combattre`;
    const avant = R.contenu.racine.affrontements[CLE];
    R.contenu.racine.affrontements[CLE] = { ...avant, contexte: 'mission' };
    try {
      const taux = (regles: number) => {
        let morts = 0;
        for (let g = 1; g <= 400; g++) {
          let s = duel(15, g);
          if (s.scene.type === 'affrontement') {
            s.scene.regles = regles;
            if (regles === 1) s.scene.plafond -= 1;
          }
          const pick = hasard(g);
          for (let k = 0; k < 40 && s.scene.type === 'affrontement'; k++) s = combattre(s, actionAuHasard(s, pick));
          if (s.drapeaux['mort_au_combat']) morts++;
        }
        return morts / 400;
      };
      const v1 = taux(1);
      const v2 = taux(2);
      expect(v1).toBeGreaterThan(0.05);
      expect(Math.abs(v2 - v1)).toBeLessThan(0.05);
    } finally {
      R.contenu.racine.affrontements[CLE] = avant;
    }
  });
});
