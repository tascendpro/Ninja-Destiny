import { describe, expect, it } from 'vitest';
import { choisirCombat, choisirCommune, lireResultat, nouvelleCampagne } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';
import { actionAuHasard, hasard } from './aideCampagne';

/** Deux jōnin solides, devant la scène voulue. */
function devant(id: string, graine = 6): Campagne {
  const c = cloner(nouvelleCampagne(creation({ prenom: 'Kaito', village: 'kiri', clan: 'sans_clan', element: 'suiton' }), creation({ prenom: 'Ren', village: 'kiri', clan: 'sans_clan', element: 'raiton' }), { type: 'amis', passe: 'rencontre' }, graine));
  for (const s of c.joueurs) {
    s.jour = Math.max(...c.joueurs.map((x) => x.naissance)) + 24 * 360;
    s.scene = { type: 'temps_libre' };
    s.rang = 'jonin';
    s.attributs.force = 80;
    s.jauges.chakraMax = 200;
  }
  c.barrieres = [];
  c.resultat = undefined;
  c.commune = { id, choix: [undefined, undefined] };
  return c;
}
const lire = (c: Campagne) => {
  for (const j of [0, 1] as IdJoueur[]) if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
  return c;
};
const combattre = (c: Campagne, g: number) => {
  const pick = hasard(g);
  for (let i = 0; i < 120 && c.combat; i++) {
    const j = ([0, 1] as IdJoueur[]).find((x) => !c.combat!.choix[x] && !c.combat!.aTerre[x]);
    if (j === undefined) break;
    c = choisirCombat(c, j, actionAuHasard(c.joueurs[j], pick));
  }
  return c;
};

describe('Les épées légendaires', () => {
  it('partir ensemble sur la piste mène au combat à mort contre le porteur', () => {
    let c = devant('mc_lame_kubikiribocho');
    expect(c.joueurs[0].registre['kubikiribocho']?.detenteur).toBe('npc:renegat_zanto');
    c = lire(choisirCommune(choisirCommune(c, 0, 'traquer'), 1, 'traquer'));
    expect(c.combat?.def).toBe('combat_lame_kubikiribocho');
    expect(c.combat?.letal).toBe(true);
  });

  it('si chacun la veut pour soi, un duel tranche, et le vainqueur repart avec l’épée', () => {
    let c = devant('mc_lame_partage');
    c.quete = { lame: 'kubikiribocho' };
    c = lire(choisirCommune(choisirCommune(c, 0, 'moi'), 1, 'moi'));
    expect(c.combat?.def).toBe('duel_lame');
    c = lire(combattre(c, 3));
    expect(c.combat).toBeUndefined();
    const porteurs = ([0, 1] as IdJoueur[]).filter((j) => c.joueurs[j].registre['kubikiribocho']?.detenteur === 'joueur');
    expect(porteurs).toHaveLength(1);
    const autre = (1 - porteurs[0]) as IdJoueur;
    expect(c.joueurs[autre].registre['kubikiribocho']?.detenteur).toMatch(/^campagne:/);
    expect(c.quete).toBeUndefined();
  });

  it('si l’un la laisse à l’autre, celui qui l’a réclamée la prend, sans combat', () => {
    let c = devant('mc_lame_partage');
    c.quete = { lame: 'kubikiribocho' };
    c = lire(choisirCommune(choisirCommune(c, 0, 'toi'), 1, 'moi'));
    expect(c.combat).toBeUndefined();
    expect(c.joueurs[1].registre['kubikiribocho']?.detenteur).toBe('joueur');
  });
});
