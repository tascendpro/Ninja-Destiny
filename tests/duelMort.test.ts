import { describe, expect, it } from 'vitest';
import { choisirCombat, choisirMort, lireResultat, nouvelleCampagne, suitesMort } from '../src/engine/campagne/moteur';
import { ouvrirCombatDuo } from '../src/engine/campagne/combat';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';
import { actionAuHasard, hasard, jouer } from './aideCampagne';

/** Deux adultes, face à face, dans un duel à mort mené jusqu'au bout. */
function duelAMort(graine: number): Campagne {
  let c = cloner(
    nouvelleCampagne(creation({ prenom: 'Kaito', village: 'konoha', clan: 'uchiha' }), creation({ prenom: 'Ren', village: 'konoha', clan: 'hyuga', element: 'raiton' }), { type: 'rivaux', passe: 'competition' }, graine),
  );
  for (const s of c.joueurs) {
    s.jour = Math.max(...c.joueurs.map((x) => x.naissance)) + 25 * 360;
    s.scene = { type: 'temps_libre' };
    s.rang = 'jonin';
  }
  c.barrieres = [];
  ouvrirCombatDuo(c, 'duel_mort');
  const pick = hasard(graine);
  for (let i = 0; i < 80 && c.combat; i++) {
    const j = ([0, 1] as IdJoueur[]).find((x) => !c.combat!.choix[x] && !c.combat!.aTerre[x]);
    if (j === undefined) break;
    c = choisirCombat(c, j, actionAuHasard(c.joueurs[j], pick));
  }
  return c;
}

describe('Le duel à mort', () => {
  for (const g of [3, 8, 21]) {
    it(`l’un meurt, pour de bon, et sa mort a des suites (graine ${g})`, () => {
      let c = duelAMort(g);
      expect(c.combat).toBeUndefined();
      const mort = c.stats.tueParAutre!;
      const vainqueur = (1 - mort) as IdJoueur;
      expect(c.joueurs[mort].statut).toBe('mort');
      expect(c.joueurs[vainqueur].statut).not.toBe('mort');
      // Aucun retour possible : ni dans les options, ni en forçant l'action.
      expect(suitesMort(c, mort)).toEqual(['heritier', 'spectateur']);
      if (c.morts[mort] === 'a_choisir') expect(() => choisirMort(c, mort, 'retour')).toThrow(/définitive/);
      // Le survivant sait ; le village enquêtera.
      expect(c.faits.find((f) => f.id === 'duel_mort')?.connus).toEqual([vainqueur]);
      expect(c.repercussions.some((r) => r.cible === vainqueur && r.faitId === 'duel_mort')).toBe(true);
      // Le mort reste mort, même des années plus tard.
      for (const j of [0, 1] as IdJoueur[]) if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
      if (c.morts[mort] === 'a_choisir') c = choisirMort(c, mort, 'spectateur');
      c = jouer(c, g, (x) => x.joueurs[vainqueur].jour - x.joueurs[vainqueur].naissance > 32 * 360, 1500);
      expect(c.joueurs[mort].statut).toBe('mort');
      expect(c.vues).not.toContain('mc_retour');
    });
  }

  it('l’héritier de celui qu’on a tué arrive méfiant, et la scène de son arrivée n’est pas celle d’une mort ordinaire', () => {
    let c = duelAMort(8);
    const mort = c.stats.tueParAutre!;
    for (const j of [0, 1] as IdJoueur[]) if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
    c = choisirMort(c, mort, 'heritier');
    expect(c.lien.axes[mort].mefiance).toBeGreaterThanOrEqual(30);
    expect(c.lien.axes[1 - mort].dette).toBeGreaterThanOrEqual(30);
    expect(c.barrieres.some((b) => b.id === 'mc_heritier_sang')).toBe(true);
    expect(c.barrieres.some((b) => b.id === 'mc_heritier')).toBe(false);
    expect(c.faits.find((f) => f.id === 'duel_mort')?.cible).toBe(mort);
  });
});
