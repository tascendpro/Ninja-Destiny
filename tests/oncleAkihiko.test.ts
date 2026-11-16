// L'intrigue de l'oncle Akihiko : des choix aux conséquences, du temps libre à la scène, et le savoir qui ne passe
// d'un personnage à l'autre que s'il a été dit.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { activite, choisir, choixVisibles, nouvellePartie } from '../src/engine/moteur';
import { genererActivites } from '../src/engine/tempsLibre';
import { evaluer } from '../src/engine/conditions';
import { R } from '../src/engine/registre';
import { resoudreTexte } from '../src/engine/texte';
import { SCENES, nouvelleCampagne } from '../src/engine/campagne/moteur';
import { combinaisons, creation } from './aide';

function enfant(ageAns: number, graine = 7, clan = 'uchiha'): GameState {
  const c = combinaisons().find((x) => x.clan === clan)!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  return s;
}
const devant = (s: GameState, id: string) => {
  s.scene = { type: 'evenement', id };
  return s;
};

describe('L’oncle Akihiko', () => {
  it('la lettre n’apparaît qu’à un enfant de 8 à 10 ans, avec un parent, et jamais en plus du coffre du grenier', () => {
    const ev = R.evenements['fam_lettre'];
    expect(evaluer(ev.si!, enfant(9))).toBe(true);
    expect(evaluer(ev.si!, enfant(12))).toBe(false);
    const avecCoffre = enfant(9);
    avecCoffre.evenementsVus['a_secret_familial'] = { n: 1, dernier: avecCoffre.jour };
    expect(evaluer(ev.si!, avecCoffre)).toBe(false);
    // Et l'inverse : le coffre ne vient plus après la lettre.
    const avecLettre = enfant(10);
    avecLettre.evenementsVus['fam_lettre'] = { n: 1, dernier: avecLettre.jour };
    expect(evaluer(R.evenements['a_secret_familial'].si!, avecLettre)).toBe(false);
  });

  it('chaque choix laisse sa trace : insister, se taire, relire en cachette n’ouvrent pas les mêmes portes', () => {
    const apres = (id: string) => choisir(devant(enfant(9), 'fam_lettre'), id);
    const insiste = apres('insister');
    expect(insiste.drapeaux['lettre']).toBe('insiste');
    expect(insiste.drapeaux['lettre_piste']).toBe(true);
    const rendue = apres('rendre');
    expect(rendue.drapeaux['lettre']).toBe('rendue');
    expect(rendue.drapeaux['lettre_piste']).toBeUndefined();
    const relue = apres('relire');
    expect(relue.drapeaux['lettre']).toBe('relue');
    expect(relue.attributs.discretion).toBeGreaterThan(enfant(9).attributs.discretion);
  });

  it('la piste se suit pendant le temps libre : deux mois d’enquête mènent au nom rayé', () => {
    let s = choisir(devant(enfant(9), 'fam_lettre'), 'relire');
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.id === 'enqueter' && a.disponible)).toBe(true);
    // Sans piste, l'activité n'existe pas.
    const sans = choisir(devant(enfant(9), 'fam_lettre'), 'rendre');
    sans.scene = { type: 'temps_libre' };
    expect(genererActivites(sans).some((a) => a.id === 'enqueter')).toBe(false);
    for (let k = 0; k < 4 && (Number(s.drapeaux['lettre_enquete']) || 0) < 2; k++) {
      if (s.scene.type !== 'temps_libre') s.scene = { type: 'temps_libre' };
      s = activite(s, 'enqueter');
    }
    expect(Number(s.drapeaux['lettre_enquete'])).toBe(2);
    expect(s.planifies.some((p) => p.evenementId === 'fam_nom_raye') || !!s.evenementsVus['fam_nom_raye'] || (s.scene.type === 'evenement' && s.scene.id === 'fam_nom_raye')).toBe(true);
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.id === 'enqueter')).toBe(false);
  });

  it('explorer aiguise la perception et finit par mener à la cabane, reconnue seulement si l’on sait', () => {
    let s = enfant(9);
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.id === 'explorer' && a.disponible)).toBe(true);
    for (let k = 0; k < 3 && (Number(s.drapeaux['explorations']) || 0) < 2; k++) {
      if (s.scene.type !== 'temps_libre') s.scene = { type: 'temps_libre' };
      s = activite(s, 'explorer');
    }
    expect(Number(s.drapeaux['explorations'])).toBeGreaterThanOrEqual(2);
    expect(s.planifies.some((p) => p.evenementId === 'tl_cabane_racines') || !!s.evenementsVus['tl_cabane_racines'] || (s.scene.type === 'evenement' && s.scene.id === 'tl_cabane_racines')).toBe(true);
    // Le texte de la cabane : on ne reconnaît le « A. » que si on connaît le nom.
    const ignorant = devant(enfant(9), 'tl_cabane_racines');
    const savant = devant(choisir(devant(enfant(9), 'fam_lettre'), 'relire'), 'tl_cabane_racines');
    expect(resoudreTexte(R.evenements['tl_cabane_racines'].texte, ignorant)).toMatch(/coïncidence/);
    expect(resoudreTexte(R.evenements['tl_cabane_racines'].texte, savant)).toMatch(/Le « A. » de la lettre/);
  });

  it('l’aîné ne sait que ce qu’on lui dit, et la scène ne revient pas', () => {
    const s = choisir(devant(enfant(11), 'fam_lettre'), 'relire');
    if (!s.roles['aine']) return;
    const ev = R.evenements['fam_rien_raconte'];
    expect(evaluer(ev.si!, s)).toBe(s.pnj[s.roles['aine']]?.etat === 'vivant' || s.pnj[s.roles['aine']]?.etat === 'blesse');
    const t = choisir(devant(s, 'fam_rien_raconte'), 'tout_dire');
    expect(t.drapeaux['rien_raconte']).toBe('partage');
    expect(evaluer(ev.si!, t)).toBe(false);
  });

  it('l’homme à la grue : chaque réponse a son prix, et aucune n’est gratuite', () => {
    const base = () => devant(choisir(devant(enfant(9), 'fam_lettre'), 'insister'), 'fam_akihiko_marche');
    const avant = base();
    avant.jour = avant.naissance + 360 * 14;
    const porter = choisir(base(), 'porter');
    expect(porter.drapeaux['akihiko']).toBe('messager');
    expect(porter.social.suspicion).toBeGreaterThan(avant.social.suspicion);
    const denoncer = choisir(base(), 'denoncer');
    expect(denoncer.drapeaux['akihiko']).toBe('denonce');
    expect(denoncer.relations[denoncer.roles['parent']].confiance).toBeLessThan(porter.relations[porter.roles['parent']].confiance);
    expect(choisir(base(), 'pourquoi').objets).toContain('kunai_grue');
    expect(choixVisibles(base(), R.evenements['fam_akihiko_marche']).every((c) => c.disponible)).toBe(true);
  });
});

describe('L’oncle Akihiko, à deux', () => {
  const campagne = () => {
    const combos = combinaisons();
    const c = nouvelleCampagne(creation(combos.find((x) => x.clan === 'uchiha')!), creation(combos.find((x) => x.clan === 'uchiha')!), { type: 'amis', passe: 'rencontre' }, 42);
    c.joueurs[0].drapeaux['lettre'] = 'relue';
    return c;
  };
  const sc = SCENES['mc_rien_raconte'];
  const issue = (cle: string) => sc.issues.find((i) => i.cle === cle)!;

  it('chacun ne voit que son indice : le nom pour celui qui a trouvé la lettre, la grue pour l’autre', () => {
    const c = campagne();
    expect(sc.si!(c)).toBe(true);
    expect(sc.textePour!(c, 0)).toMatch(/tiroir/);
    expect(sc.textePour!(c, 0)).not.toMatch(/grue/);
    expect(sc.textePour!(c, 1)).toMatch(/grue/);
    expect(sc.textePour!(c, 1)).not.toMatch(/tiroir/);
  });

  it('ce qui n’est pas dit n’est pas su : se taire ne transmet rien, parler transmet ce qu’on sait', () => {
    const tus = campagne();
    issue('taire+taire').apres!(tus, 0);
    expect(tus.joueurs[1].drapeaux['lettre_su']).toBeUndefined();
    expect(tus.joueurs[0].drapeaux['grue']).toBeUndefined();

    // Celui qui sait parle, l'autre se tait : le nom passe, la grue reste cachée.
    const unSens = campagne();
    issue('dire+taire').apres!(unSens, 0);
    expect(unSens.joueurs[1].drapeaux['lettre_su']).toBe(true);
    expect(unSens.joueurs[1].drapeaux['lettre_piste']).toBe(true);
    expect(unSens.joueurs[0].drapeaux['grue']).toBeUndefined();

    // Celui qui a vu la grue parle, celui qui sait se tait : seule la grue passe.
    const autreSens = campagne();
    issue('dire+taire').apres!(autreSens, 1);
    expect(autreSens.joueurs[0].drapeaux['grue']).toBe(true);
    expect(autreSens.joueurs[1].drapeaux['lettre_su']).toBeUndefined();

    const ensemble = campagne();
    issue('chercher+chercher').apres!(ensemble, 0);
    expect(ensemble.joueurs[1].drapeaux['lettre_su']).toBe(true);
    expect(ensemble.joueurs[0].drapeaux['grue']).toBe(true);
    // La scène ne revient pas, et la version solo (avec l'aîné) non plus.
    expect(sc.si!(ensemble)).toBe(false);
    expect(ensemble.joueurs.every((s) => s.drapeaux['rien_raconte'] === 'a_deux')).toBe(true);
  });
});
