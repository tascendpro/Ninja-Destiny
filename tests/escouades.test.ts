import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { nouvellePartie } from '../src/engine/moteur';
import { creerAffrontement, ouvrirManche, vueAffrontement } from '../src/engine/combat/affrontement';
import { adversaireDef } from '../src/engine/combat/adversaire';
import { resoudre, validerAction } from '../src/engine/combat/resolution';
import { cibleEffective, composerEscouade, debout, finDeMancheEscouade, frapperEscouade } from '../src/engine/combat/escouade';
import { MORAL_INITIAL } from '../src/engine/combat/esprit';
import { aEtat } from '../src/engine/combat/etats';
import { R } from '../src/engine/registre';
import type { EtatAffrontement } from '../src/engine/combat/types';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { combinaisons, creation } from './aide';

/** Un genin face aux détrousseurs de la nuit (une escouade), au début de la première manche. */
function face(graine = 3): { s: GameState; sc: EtatAffrontement } {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * 15;
  s.rang = 'genin';
  s.jauges.chakra = s.jauges.chakraMax = 300;
  for (const t of ['katon_boule', 'katon_croissant', 'suiton_prison']) appliquerEffet(s, { enseigner: t }, nouveauCtx());
  const sc = creerAffrontement(s, { evenementId: 'mc_combat_nuit', adversaireId: 'mc_bandits', contexte: 'mission', plafond: 6 });
  s.scene = sc;
  ouvrirManche(s, sc, adversaireDef('mc_bandits'));
  sc.intention = 'observer';
  return { s, sc };
}
const tirages = (x = 0.01) => ({ exec: x, reponse: 0.99, execAdv: 0.99, variation: 0.5, decisif: 0.99, texte: 0.3, replique: 0.3, etat: 0.5, analyse: 0.99 });

describe('Escouades', () => {
  it('une escouade a un chef, un soigneur et des combattants ; ses PV sont la somme des leurs', () => {
    const { sc } = face();
    const m = sc.adv.membres!;
    expect(m.map((x) => x.role).sort()).toEqual(['chef', 'combattant', 'combattant', 'soigneur']);
    expect(sc.adv.endurance).toBe(m.reduce((a, x) => a + x.pv, 0));
    // Une meute n'a pas de soigneur.
    expect(composerEscouade({ ...adversaireDef('mc_bandits'), type: 'bete' }, 100).some((x) => x.role === 'soigneur')).toBe(false);
  });

  it('un coup ciblé touche un seul membre, en entier ; une zone les prend tous, un peu moins fort', () => {
    const { sc } = face();
    const avant = sc.adv.membres!.map((x) => x.pv);
    const chef = sc.adv.membres!.find((x) => x.role === 'chef')!;
    frapperEscouade(sc, 10, 'cible', chef.id);
    expect(sc.adv.membres!.map((x) => x.pv)).toEqual(avant.map((pv, i) => (sc.adv.membres![i].id === chef.id ? pv - 10 : pv)));
    const r = frapperEscouade(sc, 10, 'zone');
    expect(r.inflige).toBe(6 * 4);
  });

  it('abattre le chef leur fait peur ; sans chef, le plus faible déserte', () => {
    const { sc } = face();
    sc.adv.moral = { ...MORAL_INITIAL[sc.temperament] };
    const chef = sc.adv.membres!.find((x) => x.role === 'chef')!;
    const peurAvant = sc.adv.moral.peur;
    const r = frapperEscouade(sc, 999, 'cible', chef.id);
    expect(r.textes.join(' ')).toMatch(/chef est à terre/);
    expect(sc.adv.moral!.peur).toBeGreaterThan(peurAvant + 30);
    sc.adv.moral!.peur = 70;
    const t = finDeMancheEscouade(sc);
    expect(t.join(' ')).toMatch(/s’enfuit/);
    expect(sc.adv.membres!.some((x) => x.parti)).toBe(true);
    expect(sc.adv.endurance).toBe(debout(sc).reduce((a, x) => a + x.pv, 0));
  });

  it('tant que le soigneur tient debout, il referme les plaies ; abattu, plus personne ne soigne', () => {
    const { sc } = face();
    const c1 = sc.adv.membres!.find((x) => x.role === 'combattant')!;
    frapperEscouade(sc, 10, 'cible', c1.id);
    const pv = c1.pv;
    expect(finDeMancheEscouade(sc).join(' ')).toMatch(/plaies/);
    expect(c1.pv).toBeGreaterThan(pv);
    const soigneur = sc.adv.membres!.find((x) => x.role === 'soigneur')!;
    frapperEscouade(sc, 999, 'cible', soigneur.id);
    frapperEscouade(sc, 5, 'cible', c1.id);
    const pv2 = c1.pv;
    finDeMancheEscouade(sc);
    expect(c1.pv).toBe(pv2);
  });

  it('en combat : le coup va sur la cible choisie, la zone touche tout le monde, une cible à terre est refusée', () => {
    const { s, sc } = face();
    const soigneur = sc.adv.membres!.find((x) => x.role === 'soigneur')!;
    const autres = sc.adv.membres!.filter((x) => x.id !== soigneur.id).map((x) => x.pv);
    resoudre(s, sc, adversaireDef('mc_bandits'), { famille: 'taijutsu', choix: 'coup_puissant', cible: soigneur.id }, tirages());
    expect(soigneur.pv).toBeLessThan(soigneur.pvMax);
    expect(sc.adv.membres!.filter((x) => x.id !== soigneur.id).map((x) => x.pv)).toEqual(autres);

    const b = face(5);
    const pvAvant = b.sc.adv.membres!.map((x) => x.pv);
    resoudre(b.s, b.sc, adversaireDef('mc_bandits'), { famille: 'ninjutsu', choix: 'katon_croissant' }, tirages());
    const touches = b.sc.adv.membres!.filter((x, i) => x.pv < pvAvant[i]).length;
    expect(touches).toBeGreaterThanOrEqual(3);

    soigneur.pv = 0;
    expect(() => validerAction(s, sc, { famille: 'taijutsu', choix: 'frappe_rapide', cible: soigneur.id })).toThrow();
    expect(cibleEffective(sc, soigneur.id)?.id).not.toBe(soigneur.id);
    const v = vueAffrontement(s)!;
    expect(v.adversaire.membres!.find((x) => x.id === soigneur.id)!.horsCombat).toBe(true);
    expect(v.familles.find((f) => f.id === 'ninjutsu')!.actions.find((a) => a.id === 'katon_croissant')!.marques).toContain('tout le groupe');
  });
});

describe('Entraves', () => {
  it('la prison aqueuse, le marécage, l’ombre des Nara, la cage, l’étau : elles immobilisent ; le poing souple bloque le chakra', () => {
    for (const id of ['suiton_prison', 'doton_marecage', 'raiton_cage', 'fuuton_etau', 'nara_liaison', 'nara_nui']) expect(R.maitrises[id]?.technique?.tactique?.etat?.id, id).toBe('immobilise');
    expect(R.maitrises['hyuga_64'].technique!.tactique!.etat!.id).toBe('chakra_bloque');
    expect(R.contenu.techniquesAdverses.find((t) => t.id === 'adv_suiton_prison')!.etat!.id).toBe('immobilise');
    expect(R.contenu.techniquesAdverses.find((t) => t.id === 'ak_kisame_prison')!.etat!.id).toBe('immobilise');
  });

  it('une prison aqueuse qui porte immobilise : il ne peut plus fuir, ni lire tes gestes', () => {
    const { s, sc } = face(7);
    resoudre(s, sc, adversaireDef('mc_bandits'), { famille: 'ninjutsu', choix: 'suiton_prison' }, tirages());
    expect(aEtat(sc.adv, 'immobilise')).toBe(true);
    expect(vueAffrontement(s)!.adversaire.etats).toContain('immobilisé·e');
  });
});
