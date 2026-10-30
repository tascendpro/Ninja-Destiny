import { describe, expect, it } from 'vitest';
import { agirLien, choisirCombat, choisirCommune, choisirMort, choisirPrivee, joueurActif, lireResultat, nouvelleCampagne, parametresLien, priveeDue, rafraichir, rejouerCampagne, vueCommune, vuePrivee } from '../src/engine/campagne/moteur';
import { ouvrirCombatDuo } from '../src/engine/campagne/combat';
import { planifierCommune } from '../src/engine/campagne/outils';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import type { GameState } from '../src/engine/types';
import { defPnj } from '../src/engine/etat';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';
import { TAIJUTSU } from '../src/engine/combat/resolution';
import { actionAuHasard, hasard, jouer } from './aideCampagne';

const duo = (type: Parameters<typeof nouvelleCampagne>[2]['type'] = 'freres', graine = 5, origine?: Parameters<typeof nouvelleCampagne>[2]['origine']) => {
  const memeVillage = origine !== 'parents_separes';
  let c = nouvelleCampagne(
    creation({ prenom: 'Aya', village: 'konoha', clan: 'uchiha', element: 'suiton' }),
    creation({ prenom: 'Ren', presentation: 'masculin', village: memeVillage ? 'konoha' : 'kumo', clan: memeVillage ? 'uchiha' : 'sans_clan', element: 'raiton' }),
    { type, passe: 'rencontre', origine },
    graine,
  );
  // On passe l'introduction.
  const v = vueCommune(c, 0)!;
  c = choisirCommune(choisirCommune(c, 0, v.choix[0].id), 1, v.choix[0].id);
  return lireResultat(lireResultat(c, 0), 1);
};

/** Fait vieillir les deux vies jusqu'à cet âge, au temps libre (sans jouer les années). */
function vieillir(c: Campagne, age: number): Campagne {
  const x = cloner(c);
  // Les deux au même jour du monde : celui où le plus jeune a cet âge.
  const jour = Math.max(...x.joueurs.map((s) => s.naissance)) + age * 360 + 10;
  for (const s of x.joueurs) {
    s.jour = jour;
    s.scene = { type: 'temps_libre' };
    s.rang = age >= 18 ? 'chunin' : age >= 12 ? 'genin' : 'eleve';
    s.chapitre = age >= 18 ? 3 : 2;
  }
  x.barrieres = [];
  return x;
}

/** Joue un combat à deux jusqu'au bout, chacun choisissant au hasard (ou selon la politique). */
function finirCombat(c: Campagne, graine: number, politique?: (c: Campagne, j: IdJoueur) => Parameters<typeof choisirCombat>[2] | undefined): Campagne {
  const pick = hasard(graine);
  for (let i = 0; i < 200 && c.combat; i++) {
    const j = joueurActif(c)!;
    c = choisirCombat(c, j, politique?.(c, j) ?? actionAuHasard(c.joueurs[j], pick));
  }
  return c;
}

describe('Frères et sœurs : une seule famille', () => {
  it('le même parent et le même aîné dans les deux vies', () => {
    const c = duo('freres');
    for (const id of ['famille_parent', 'famille_aine']) expect(defPnj(c.joueurs[1], id)?.nom).toBe(defPnj(c.joueurs[0], id)?.nom);
    expect(c.joueurs[0].creation.nom).toBe(c.joueurs[1].creation.nom);
  });

  it('des parents séparés : chacun a grandi avec l’un des deux, de genre opposé', () => {
    const c = nouvelleCampagne(creation({ prenom: 'Aya', village: 'kiri', clan: 'hozuki', element: 'suiton' }), creation({ prenom: 'Ren', village: 'konoha', clan: 'sans_clan' }), { type: 'freres', passe: 'perte', origine: 'demi_freres' }, 3);
    expect(defPnj(c.joueurs[0], 'famille_parent')?.genre).toBe('f');
    const s = nouvelleCampagne(creation({ prenom: 'Aya', village: 'konoha', clan: 'sans_clan' }), creation({ prenom: 'Ren', village: 'suna', clan: 'sans_clan' }), { type: 'freres', passe: 'perte' }, 3);
    expect(s.lien.type).toBe('freres');
  });

  it('un deuil dans une vie est un deuil dans l’autre, et ouvre une scène commune', () => {
    let c = vieillir(duo('freres'), 25);
    c.joueurs[0].pnj['famille_parent'].etat = 'mort';
    c = jouer(c, 2, () => !!c, 1);
    const x = cloner(c);
    x.joueurs[0].pnj['famille_parent'].etat = 'mort';
    const apres = jouer(x, 1, (y) => y.joueurs[1].pnj['famille_parent'].etat === 'mort', 50);
    expect(apres.joueurs[1].pnj['famille_parent'].etat).toBe('mort');
    expect(apres.barrieres.some((b) => b.id === 'mc_deuil_parent') || apres.vues.includes('mc_deuil_parent') || apres.commune?.id === 'mc_deuil_parent').toBe(true);
  });
});

describe('Le combat à deux', () => {
  it('côte à côte : chacun choisit en secret, la manche se résout pour les deux contre le même adversaire', () => {
    const c0 = vieillir(duo('amis'), 15);
    ouvrirCombatDuo(c0, 'premier_combat');
    expect(c0.joueurs[0].scene.type).toBe('affrontement');
    expect(joueurActif(c0)).toBe(0);
    const pick = hasard(4);
    let c = choisirCombat(c0, 0, actionAuHasard(c0.joueurs[0], pick));
    expect(joueurActif(c)).toBe(1);
    c = choisirCombat(c, 1, actionAuHasard(c.joueurs[1], pick));
    const [a, b] = c.joueurs.map((s) => s.scene) as [Extract<GameState['scene'], { type: 'affrontement' }>, Extract<GameState['scene'], { type: 'affrontement' }>];
    if (c.combat) {
      expect(a.adv.endurance).toBe(b.adv.endurance);
      expect(a.journal.at(-1)?.impact).toMatch(/Pendant ce temps|Ren|Aya/);
    }
    c = finirCombat(c, 9);
    expect(c.combat).toBeUndefined();
    expect(c.resultat?.titre).toMatch(/Victoire|Défaite/);
    expect(c.joueurs[0].scene.type).toBe('temps_libre');
  });

  it('l’eau de l’un sert la foudre de l’autre, dans la même manche, quand vous vous connaissez assez', () => {
    let vu = false;
    for (let g = 1; g < 60 && !vu; g++) {
      const c0 = vieillir(duo('amis', g), 17);
      c0.lien.accord = 100;
      for (const [j, t, n] of [[0, 'suiton_vague_rupture', 'suiton'], [1, 'raiton_reseau', 'raiton']] as const) {
        const s = c0.joueurs[j];
        s.maitrises[`nature_${n}`] = { ...s.maitrises['ninjutsu'], id: `nature_${n}`, kind: 'element', awakened: true, tier: 3 };
        s.maitrises[t] = { ...s.maitrises['ninjutsu'], id: t, kind: 'jutsu', awakened: true, tier: 4 };
        s.jauges.chakra = s.jauges.chakraMax = 300;
        s.attributs.agilite = j === 0 ? 90 : 20;
      }
      ouvrirCombatDuo(c0, 'premier_combat');
      let c = choisirCombat(c0, 0, { famille: 'ninjutsu', choix: 'suiton_vague_rupture' });
      c = choisirCombat(c, 1, { famille: 'ninjutsu', choix: 'raiton_reseau' });
      const journal = c.combat ? (c.joueurs[1].scene as Extract<GameState['scene'], { type: 'affrontement' }>).journal : c.dernierCombat![1];
      const e = journal.at(-1);
      if (e?.synergie?.nom === 'Propagation conductrice') vu = true;
    }
    expect(vu).toBe(true);
  });

  it('« Je couvre », puis rien : l’autre prend le coup, et le sait', () => {
    let vu = false;
    for (let g = 1; g < 80 && !vu; g++) {
      const c0 = vieillir(duo('amis', g), 15);
      ouvrirCombatDuo(c0, 'premier_combat');
      const confiance = c0.lien.axes[1].confiance;
      let c = choisirCombat(c0, 0, { famille: 'taijutsu', choix: Object.keys(TAIJUTSU)[0] }, 'couvre');
      c = choisirCombat(c, 1, { famille: 'defense', choix: 'garde' });
      if (c.combat && c.combat.mensonges[0] > 0) {
        vu = true;
        expect(c.lien.axes[1].confiance).toBeLessThan(confiance);
      }
    }
    expect(vu).toBe(true);
  });

  it('une technique de duo, créée ensemble, ne frappe que si les deux la lancent dans la même manche', () => {
    let c = vieillir(duo('amis'), 18);
    c.lien.accord = 60;
    c = agirLien(c, 0, { t: 'proposer', type: 'technique', nom: 'La marée jumelle' });
    c = agirLien(c, 1, { t: 'repondre', accepte: true });
    expect(c.lien.techniquesDuo[0]?.nom).toBe('La marée jumelle');
    ouvrirCombatDuo(c, 'premier_combat');
    const avant = (c.joueurs[0].scene as Extract<GameState['scene'], { type: 'affrontement' }>).adv.endurance;
    c = choisirCombat(c, 0, { famille: 'ninjutsu', choix: 'duo:t1' });
    c = choisirCombat(c, 1, { famille: 'ninjutsu', choix: 'duo:t1' });
    const apres = c.combat ? (c.joueurs[0].scene as Extract<GameState['scene'], { type: 'affrontement' }>).adv.endurance : 0;
    expect(apres).toBeLessThan(avant);
  });
});

describe('Les duels entre vous', () => {
  it('un duel d’entraînement : le vainqueur gagne trois points, le vaincu un, et le tableau des duels s’en souvient', () => {
    let c = vieillir(duo('rivaux'), 16);
    const points = c.joueurs.map((s) => s.pointsStat);
    c = agirLien(c, 0, { t: 'proposer', type: 'duel' });
    c = agirLien(c, 1, { t: 'repondre', accepte: true });
    expect(c.combat?.mode).toBe('duel');
    c = finirCombat(c, 3);
    const gagnant = c.lien.duels[0] === 1 ? 0 : 1;
    expect(c.lien.duels[0] + c.lien.duels[1]).toBe(1);
    expect(c.joueurs[gagnant].pointsStat - points[gagnant]).toBe(3);
    expect(c.joueurs[1 - gagnant].pointsStat - points[1 - gagnant]).toBe(1);
  });

  it('un duel à mort tue vraiment ; le joueur du mort choisit un héritier, qui entre en scène aujourd’hui', () => {
    let c = vieillir(duo('rivaux'), 22);
    ouvrirCombatDuo(c, 'duel_mort');
    c = finirCombat(c, 6);
    const mort = c.joueurs.findIndex((s) => s.statut === 'mort') as IdJoueur;
    expect(mort).toBeGreaterThanOrEqual(0);
    c = lireResultat(c, (1 - mort) as IdJoueur);
    expect(c.morts[mort]).toBe('a_choisir');
    expect(joueurActif(c)).toBe(mort);
    const survivant = c.joueurs[1 - mort];
    c = choisirMort(c, mort, 'heritier');
    expect(c.joueurs[mort].statut).not.toBe('mort');
    expect(Math.floor((c.joueurs[mort].jour - c.joueurs[mort].naissance) / 360)).toBe(6);
    expect(c.joueurs[mort].jour).toBe(survivant.jour);
    expect(c.barrieres.some((b) => b.id === 'mc_heritier') || c.commune?.id === 'mc_heritier').toBe(true);
  });
});

describe('Secrets et trahison', () => {
  it('l’offre du Héron n’arrive qu’à l’un des deux, en privé ; l’autre n’en voit rien', () => {
    const c = vieillir(duo('amis'), 19);
    c.vues.push('mc_heron_ombre');
    const tente = ([0, 1] as IdJoueur[]).find((j) => priveeDue(c, j) === 'mc_heron_tentation')!;
    expect(tente).toBeDefined();
    expect(vuePrivee(c, (1 - tente) as IdJoueur)).toBeUndefined();
    const apres = choisirPrivee(c, tente, 'accepter');
    expect(apres.fil.etape).toBe('engage');
    expect(apres.faits.find((f) => f.id === 'pacte_heron')?.connus).not.toContain(1 - tente);
    expect(apres.resultatPrive[tente]).toBeDefined();
    expect(apres.resultatPrive[(1 - tente) as IdJoueur]).toBeUndefined();
  });

  it('la trahison va jusqu’au bout : l’itinéraire livré, l’embuscade, puis la révélation et ses choix propres à chacun', () => {
    let c = vieillir(duo('amis'), 21);
    c.vues.push('mc_heron_ombre');
    const t = ([0, 1] as IdJoueur[]).find((j) => priveeDue(c, j) === 'mc_heron_tentation')!;
    c = lireResultat(choisirPrivee(c, t, 'accepter'), t);
    for (const s of c.joueurs) s.jour += 250;
    expect(priveeDue(c, t)).toBe('mc_heron_mission');
    c = lireResultat(choisirPrivee(c, t, 'livrer'), t);
    expect(c.barrieres.some((b) => b.id === 'mc_embuscade')).toBe(true);
    planifierCommune(c, 'mc_revelation', 0);
    c.barrieres = c.barrieres.filter((b) => b.id === 'mc_revelation');
    c = jouer(rafraichir(c), 3, (x) => !!x.commune, 400);
    expect(c.commune?.id).toBe('mc_revelation');
    const victime = (1 - t) as IdJoueur;
    expect(vueCommune(c, victime)?.choix.map((x) => x.id)).toContain('pardonner');
    expect(vueCommune(c, t)?.choix.map((x) => x.id)).toContain('avouer');
  });

  it('dénoncer : l’autre subit l’enquête sans savoir d’où elle vient, et peut remonter à la source', () => {
    let c = vieillir(duo('rivaux'), 20);
    c = agirLien(c, 0, { t: 'denoncer', motif: 'une rencontre suspecte' });
    const susp = c.joueurs[1].social.suspicion;
    for (const s of c.joueurs) s.jour += 200;
    c = jouer(c, 4, (x) => x.notes[1].length > 0, 200);
    expect(c.joueurs[1].social.suspicion).toBeGreaterThan(susp);
    expect(c.notes[1].join(' ')).toMatch(/Quelqu’un a parlé/);
    expect(c.notes[1].join(' ')).not.toMatch(/Aya/);
    let trouve = false;
    for (let i = 0; i < 25 && !trouve; i++) {
      c = agirLien(c, 1, { t: 'enqueter' });
      trouve = c.faits.some((f) => f.id.startsWith('denonce') && f.connus.includes(1));
    }
    expect(trouve).toBe(true);
    expect(c.lien.axes[1].ressentiment).toBeGreaterThan(0);
  });

  it('s’en prendre à un proche de l’autre : la mort est réelle, l’autre l’apprend sans savoir qui', () => {
    let c = vieillir(duo('rivaux'), 20);
    const sensei = c.joueurs[1].roles['sensei'];
    c = agirLien(c, 0, { t: 'nuire', cible: 'sensei' });
    expect(c.joueurs[1].pnj[sensei].etat).toBe('mort');
    expect(c.notes[1].join(' ')).toMatch(/mort/);
    expect(c.faits.find((f) => f.id.startsWith('meurtre'))?.connus).toEqual([0]);
  });

  it('rien de tout cela n’est possible pendant l’enfance', () => {
    const c = vieillir(duo('rivaux'), 9);
    expect(() => agirLien(c, 0, { t: 'nuire', cible: 'sensei' })).toThrow();
    expect(() => agirLien(c, 0, { t: 'denoncer', motif: 'x' })).toThrow();
  });
});

describe('Le lien vit', () => {
  it('franchir un seuil ouvre une scène : la jalousie au-delà de 70', () => {
    let c = vieillir(duo('rivaux'), 20);
    c.lien.axes[0].jalousie = 75;
    c = agirLien(c, 0, { t: 'donner', ryo: 10 });
    expect(c.barrieres.some((b) => b.id === 'mc_jalousie')).toBe(true);
  });

  it('une vie à deux, jouée au hasard sur des années, sans blocage, et rejouée à l’identique', () => {
    const c0 = duo('amis', 31);
    const c = jouer(c0, 8, () => false, 2500);
    expect(c.vues.length).toBeGreaterThan(1);
    // Le journal commence à la création : l'introduction comprise.
    const r2 = rejouerCampagne(c0.creations[0], c0.creations[1], parametresLien(c0), c0.graine, c.actions);
    expect(JSON.stringify(r2.joueurs)).toBe(JSON.stringify(c.joueurs));
    expect(JSON.stringify(r2.lien)).toBe(JSON.stringify(c.lien));
  });
});
