import { describe, expect, it } from 'vitest';
import { ECART_MAX, SCENES, choisirCombat, choisirCommune, lireResultat, nouvelleCampagne, priveeDue, soumettre, vueCommune } from '../src/engine/campagne/moteur';
import { ouvrirCombatDuo } from '../src/engine/campagne/combat';
import { projeter } from '../src/engine/campagne/projection';
import { verifierInvariants } from '../src/engine/invariants';
import { cloner } from '../src/engine/etat';
import type { Campagne, IdJoueur, TypeLien } from '../src/engine/campagne/types';
import { creation } from './aide';
import { genererActivites } from '../src/engine/tempsLibre';
import { IDS, actionAuHasard, campagneDe, hasard, jouer } from './aideCampagne';
import type { Profil } from './aideCampagne';

/** Ce qu'un joueur ne doit jamais voir de l'autre, cherché dans le texte même de sa projection. */
function secretsDe(c: Campagne, j: IdJoueur): string[] {
  const o = (1 - j) as IdJoueur;
  const s: string[] = [];
  for (const f of c.faits) if (!f.connus.includes(j)) s.push(`"${f.id}"`, f.texte);
  for (const id of c.vues) if (SCENES[id]?.privee && SCENES[id].privee!(c) !== j) s.push(`"${id}"`);
  const p = priveeDue(c, o);
  if (p) s.push(`"${p}"`);
  return s;
}

describe('Garanties de la campagne à deux', () => {
  it('sur des milliers d’états joués par des robots (traîtres compris), aucune projection ne contient un secret de l’autre', () => {
    let etats = 0;
    const profils: [Profil, Profil][] = [['traitre', 'loyal'], ['hasard', 'traitre'], ['agressif', 'prudent']];
    for (let g = 0; g < 9; g++) {
      jouer(campagneDe(g), g * 13 + 1, () => false, 500, profils[g % 3], (c) => {
        for (const j of IDS) {
          const p = projeter(c, j);
          // À la fin seulement, les épilogues disent ce que chacun a tu : c'est la révélation voulue, pas une fuite.
          expect(!!p.fin).toBe(!!c.fin);
          const texte = JSON.stringify({ ...p, fin: undefined });
          expect(texte).not.toMatch(/"axes"/);
          expect(p.journal.every((x) => x.vis !== ((1 - j) as IdJoueur))).toBe(true);
          expect(p.lien.ressenti).toBe(c.lien.axes[j]);
          if (c.fil.joueur !== j) expect(p.monFil).toBeUndefined();
          for (const secret of secretsDe(c, j)) expect(texte.includes(secret), `secret « ${secret.slice(0, 40)} » chez J${j + 1}`).toBe(false);
          // Le choix de combat de l'autre n'est jamais dans ma projection avant la résolution.
          if (c.combat?.choix[(1 - j) as IdJoueur]) expect(Object.keys(p.combat ?? {})).not.toContain('choix');
          etats++;
        }
      });
    }
    expect(etats).toBeGreaterThan(2000);
  }, 600000);

  it('un choix privé de J1 ne modifie aucun tirage de J2 : chaque vie a son propre flux de hasard', () => {
    let vu = false;
    for (let g = 0; g < 30 && !vu; g++) {
      const c = cloner(campagneDe(g));
      const jour = Math.max(...c.joueurs.map((s) => s.naissance)) + 20 * 360;
      for (const s of c.joueurs) {
        s.jour = jour;
        s.scene = { type: 'temps_libre' };
      }
      c.barrieres = [];
      c.commune = undefined;
      c.vues.push('mc_heron_ombre');
      const t = IDS.find((j) => priveeDue(c, j) === 'mc_heron_tentation');
      if (t === undefined) continue;
      const o = (1 - t) as IdJoueur;
      const pick = hasard(g);
      const id = genererActivites(c.joueurs[o]).find((x) => x.disponible && x.categorie === 'entrainement')?.id;
      if (!id) continue;
      const action = { j: o, a: { a: 'activite' as const, id } };
      let sans: Campagne;
      try {
        sans = soumettre(c, action);
      } catch {
        continue;
      }
      const avec = soumettre(soumettre(c, { j: t, privee: 'mc_heron_tentation', choix: 'accepter' }), action);
      expect(avec.joueurs[o].rngState).toBe(sans.joueurs[o].rngState);
      expect(JSON.stringify(avec.joueurs[o].attributs)).toBe(JSON.stringify(sans.joueurs[o].attributs));
      expect(pick(2)).toBeLessThan(2);
      vu = true;
    }
    expect(vu).toBe(true);
  });

  it('deux choix simultanés donnent le même résultat, quel que soit l’ordre d’arrivée', () => {
    for (let g = 0; g < 7; g++) {
      const c = campagneDe(g);
      const [a, b] = [vueCommune(c, 0)!.choix[0].id, vueCommune(c, 1)!.choix.at(-1)!.id];
      const x = choisirCommune(choisirCommune(c, 0, a), 1, b);
      const y = choisirCommune(choisirCommune(c, 1, b), 0, a);
      expect(JSON.stringify(y.lien)).toBe(JSON.stringify(x.lien));
      expect(JSON.stringify(y.joueurs)).toBe(JSON.stringify(x.joueurs));
      expect(y.resultat?.texte).toBe(x.resultat?.texte);
    }
    // Et dans un combat à deux : la manche ne dépend que des règles (initiative), pas de qui a choisi d'abord.
    const c = cloner(lireResultat(lireResultat(choisirCommune(choisirCommune(campagneDe(3), 0, vueCommune(campagneDe(3), 0)!.choix[0].id), 1, vueCommune(campagneDe(3), 1)!.choix[0].id), 0), 1));
    ouvrirCombatDuo(c, 'premier_combat');
    const pick = hasard(5);
    const a0 = actionAuHasard(c.joueurs[0], pick);
    const a1 = actionAuHasard(c.joueurs[1], pick);
    const x = choisirCombat(choisirCombat(c, 0, a0), 1, a1);
    const y = choisirCombat(choisirCombat(c, 1, a1), 0, a0);
    expect(JSON.stringify(y.joueurs)).toBe(JSON.stringify(x.joueurs));
  });

  it('une action envoyée deux fois avec le même identifiant ne compte qu’une fois', () => {
    const c = campagneDe(1);
    const x = { j: 0 as IdJoueur, commune: vueCommune(c, 0)!.choix[0].id, id: 'appareil-a:1' };
    const une = soumettre(c, x);
    const deux = soumettre(une, x);
    expect(deux).toBe(une);
    expect(deux.actions.filter((a) => a.id === 'appareil-a:1')).toHaveLength(1);
  });

  it('une action hors de son tour est refusée, sans rien changer', () => {
    const c = campagneDe(2);
    expect(() => soumettre(c, { j: 0, a: { a: 'continuer' } })).toThrow();
    expect(() => soumettre(c, { j: 1, lu: true })).toThrow();
    expect(() => soumettre(c, { j: 0, commune: 'inexistant' })).toThrow();
  });

  it('pendant des années de jeu, l’écart entre les deux vies reste borné, et chaque vie respecte ses invariants', () => {
    for (let g = 0; g < 6; g++) {
      jouer(campagneDe(g), g + 77, () => false, 900, ['hasard', 'agressif'], (c) => {
        const [a, b] = c.joueurs;
        if (!a.fin && !b.fin) expect(Math.abs(a.jour - b.jour)).toBeLessThanOrEqual(ECART_MAX + 400);
        for (const s of c.joueurs) expect(verifierInvariants(s)).toEqual([]);
      });
    }
  }, 600000);
});
