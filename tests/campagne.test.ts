import { describe, expect, it } from 'vitest';
import { activite, chapitreSuivant, chapitreSuivantDisponible, choisir, choixVisibles, combattre, continuer, manche, vueCombat } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { genererActivites } from '../src/engine/tempsLibre';
import { R } from '../src/engine/registre';
import { agir, choisirCommune, enAttente, joueurActif, lireResultat, motsDuLien, nouvelleCampagne, parametresLien, rejouerCampagne, validerLien, vueCommune } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import type { GameState } from '../src/engine/types';
import { suivant } from '../src/engine/rng';
import { creation } from './aide';

import { jouer } from './aideCampagne';

const deux = (graine = 7, type: Parameters<typeof nouvelleCampagne>[2]['type'] = 'amis') =>
  nouvelleCampagne(creation({ prenom: 'Aya', village: 'konoha', clan: 'uchiha' }), creation({ prenom: 'Ren', presentation: 'masculin', village: 'konoha', clan: 'uchiha' }), { type, passe: 'promesse' }, graine);

describe('La campagne à deux : cohérence du lien', () => {
  it('frères du même clan dans deux villages : refusé, sauf avec des parents séparés, que le jeu propose', () => {
    const a = creation({ village: 'kiri', clan: 'hozuki' });
    const b = creation({ village: 'kiri', clan: 'sans_clan' });
    expect(validerLien(a, b, 'freres').suggestion).toBe('demi_freres');
    expect(validerLien(a, b, 'freres', 'demi_freres').erreur).toBeUndefined();
    const sc1 = creation({ village: 'konoha', clan: 'sans_clan' });
    const sc2 = creation({ village: 'suna', clan: 'sans_clan' });
    expect(validerLien(sc1, sc2, 'freres').erreur).toBeUndefined();
    expect(validerLien(sc1, sc2, 'amis').suggestion).toBe('demenagement');
    expect(validerLien(sc1, sc2, 'clan').erreur).toBeDefined();
    expect(() => nouvelleCampagne(sc1, sc2, { type: 'amis', passe: 'rencontre' }, 1)).toThrow();
  });
});

describe('La campagne à deux : deux vies, une histoire', () => {
  it('l’introduction se joue d’abord : chacun choisit en secret, l’un après l’autre, puis les deux lisent le résultat', () => {
    let c = deux();
    expect(c.commune?.id).toBe('mc_intro_amis');
    expect(joueurActif(c)).toBe(0);
    expect(() => agir(c, 0, (s) => continuer(s))).toThrow();
    const avant = vueCommune(c, 1)!;
    c = choisirCommune(c, 0, 'jamais_seul');
    expect(joueurActif(c)).toBe(1);
    // Le second ne voit pas ce que le premier a choisi : seulement qu'il a choisi.
    const v = vueCommune(c, 1)!;
    expect(v.autreAChoisi).toBe(true);
    expect({ ...v, autreAChoisi: false }).toEqual(avant);
    c = choisirCommune(c, 1, 'jamais_seul');
    expect(c.resultat?.texte).toMatch(/NE JAMAIS LAISSER L’AUTRE SEUL/);
    expect(c.lien.promesses.some((p) => p.id === 'jamais_seul')).toBe(true);
    expect(c.lien.souvenirs.some((s) => s.id === 'ecorce')).toBe(true);
    c = lireResultat(lireResultat(c, 0), 1);
    expect(c.resultat).toBeUndefined();
    expect([0, 1]).toContain(joueurActif(c));
  });

  it('deux choix différents ne donnent pas la même histoire : la matrice combine, et le lien n’est pas symétrique', () => {
    let c = deux(3, 'freres');
    c = choisirCommune(choisirCommune(c, 0, 'chercher'), 1, 'rester');
    expect(c.resultat?.texte).toMatch(/Aya enfile ses sandales/);
    // Celle qui est restée a eu peur ; celle qui est partie, non.
    expect(c.lien.axes[1].peur_de_perdre).toBeGreaterThan(c.lien.axes[0].peur_de_perdre);
  });

  it('le plus en retard joue ; arrivé à une barrière, on attend l’autre ; la scène commune s’ouvre quand les deux y sont', () => {
    let c = deux(11);
    c = jouer(c, 5, (x) => !!x.commune && x.commune.id === 'mc_ruelle', 6000);
    expect(c.commune?.id).toBe('mc_ruelle');
    const ages = c.joueurs.map((s) => Math.floor((s.jour - s.naissance) / 360));
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(12);
    // Personne n'a pris dix ans d'avance sur l'autre.
    expect(Math.abs(c.joueurs[0].jour - c.joueurs[1].jour)).toBeLessThan(400);
  });

  it('pendant que l’un attend à la barrière, c’est l’autre qui joue, et l’écran dit pourquoi', () => {
    let c = deux(13);
    c = jouer(c, 9, (x) => x.barrieres[0]?.id === 'mc_ruelle' && !x.commune && x.joueurs.some((s) => s.jour >= x.barrieres[0].jour && s.scene.type === 'temps_libre'), 6000);
    const j = joueurActif(c);
    if (j !== null) {
      const autre = (1 - j) as IdJoueur;
      if (c.joueurs[autre].jour >= c.barrieres[0].jour && c.joueurs[autre].scene.type === 'temps_libre') expect(enAttente(c, autre)).toMatch(/En attente de/);
    }
  });

  it('toute la campagne se rejoue à l’identique depuis les fiches, le lien, la graine et le journal', () => {
    const c = jouer(deux(21), 3, () => false, 600);
    const r = rejouerCampagne(c.creations[0], c.creations[1], parametresLien(c), c.graine, c.actions);
    expect(JSON.stringify(r.joueurs)).toBe(JSON.stringify(c.joueurs));
    expect(JSON.stringify(r.lien)).toBe(JSON.stringify(c.lien));
  });

  it('chacun lit ce qu’il ressent pour l’autre en mots, avec le prénom de l’autre, sans chiffres', () => {
    const c = deux();
    const mots = motsDuLien(c, 0);
    expect(mots.length).toBeGreaterThan(0);
    expect(mots.join(' ')).toMatch(/Ren/);
    expect(mots.join(' ')).not.toMatch(/\d/);
  });

  it('aucune scène commune ne laisse de jeton à l’écran, quels que soient les genres', () => {
    for (const p of ['masculin', 'feminin', 'neutre'] as const) {
      for (const type of ['freres', 'clan', 'amis', 'rivaux', 'inconnus', 'improbable'] as const) {
        let c = nouvelleCampagne(creation({ prenom: 'Aya', presentation: p, village: 'konoha', clan: 'uchiha' }), creation({ prenom: 'Ren', presentation: p, village: 'konoha', clan: 'uchiha' }), { type, passe: 'rencontre' }, 2);
        const v = vueCommune(c, 0)!;
        for (const ch of v.choix) {
          for (const ch2 of v.choix) {
            const r = choisirCommune(choisirCommune(c, 0, ch.id), 1, ch2.id);
            expect(r.resultat!.texte, `${type} ${ch.id}+${ch2.id}`).not.toMatch(/\{|\}/);
          }
        }
        c = choisirCommune(choisirCommune(c, 0, v.choix[0].id), 1, v.choix[1].id);
      }
    }
  });
});
