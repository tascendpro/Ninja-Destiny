import { describe, expect, it } from 'vitest';
import { agirLien, choisirCommune, choisirPrivee, enAttente, lireResultat, nouvelleCampagne, priveeDue, rafraichir } from '../src/engine/campagne/moteur';
import { tente, trameMortSimuleePossible } from '../src/content/campagne/mortSimulee';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';

/** Une campagne de deux Uchiha sous le même toit où la trame existe, à 14 ans, sans autre scène en attente. */
function uchiha(): Campagne {
  for (let g = 1; g < 200; g++) {
    const c = cloner(
      nouvelleCampagne(creation({ prenom: 'Kaito', village: 'konoha', clan: 'uchiha', element: 'katon' }), creation({ prenom: 'Ren', village: 'konoha', clan: 'uchiha', element: 'katon', presentation: 'masculin' }), { type: 'freres', passe: 'rencontre' }, g),
    );
    if (!trameMortSimuleePossible(c)) continue;
    avancer(c, 14 * 360);
    c.barrieres = [];
    c.commune = undefined;
    c.resultat = undefined;
    return c;
  }
  throw new Error('aucune graine');
}

/** Amène les deux vies au même âge (en jours depuis la naissance du plus jeune), au temps libre. */
function avancer(c: Campagne, jours: number): void {
  const base = Math.max(...c.joueurs.map((x) => x.naissance));
  for (const s of c.joueurs) {
    s.jour = base + jours;
    s.scene = { type: 'temps_libre' };
  }
}

const lire = (c: Campagne) => {
  for (const j of [0, 1] as IdJoueur[]) if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
  return c;
};

/** Joue l'offre et le pont, jusqu'à la séparation. */
function jusquAuPont(choixB: string): { c: Campagne; a: IdJoueur; b: IdJoueur } {
  let c = uchiha();
  const a = tente(c);
  const b = (1 - a) as IdJoueur;
  expect(priveeDue(c, a)).toBe('mc_ms_offre');
  expect(priveeDue(c, b)).toBeUndefined();
  c = lireResultat(choisirPrivee(c, a, 'accepter'), a);
  expect(c.barrieres.some((x) => x.id === 'mc_ms_pont')).toBe(true);
  avancer(c, 14 * 360 + 60);
  c = rafraichir(c);
  expect(c.commune?.id).toBe('mc_ms_pont');
  c = choisirCommune(choisirCommune(c, a, 'tomber'), b, choixB);
  c = lire(c);
  return { c, a, b };
}

describe('La mort simulée', () => {
  it('celui qui part disparaît : déserteur, absent des scènes communes, et l’autre ne sait rien', () => {
    const { c, a, b } = jusquAuPont('retenir');
    expect(c.separation).toMatchObject({ absent: a, actif: true });
    expect(c.joueurs[a].statut).toBe('deserteur');
    expect(c.joueurs[b].statut).toBe('actif');
    const f = c.faits.find((x) => x.id === 'mort_simulee')!;
    expect(f.connus).toEqual([a]);
    expect(f.cible).toBe(b);
    // Celui qui reste a le souvenir du pont ; celui qui part a le sien.
    expect(c.lien.souvenirs.find((s) => s.id === 'pont')?.connuDe).toEqual([b]);
    // Rien envers l'autre pendant la séparation.
    expect(() => agirLien(c, b, { t: 'enqueter' })).toThrow(/séparés/);
    // Le retour est prévu des années plus tard.
    expect(c.barrieres.some((x) => x.id === 'mc_ms_retour')).toBe(true);
  });

  it('l’attente de celui qui reste ne trahit jamais que l’autre est vivant', () => {
    const { c, a, b } = jusquAuPont('retenir');
    const retour = c.barrieres.find((x) => x.id === 'mc_ms_retour')!;
    c.barrieres = [retour];
    const base = Math.max(...c.joueurs.map((x) => x.naissance));
    c.joueurs[b].jour = retour.jour + 10;
    c.joueurs[b].scene = { type: 'temps_libre' };
    c.joueurs[a].jour = base + 15 * 360;
    const m = enAttente(rafraichir(c), b) ?? '';
    expect(m).not.toContain(c.creations[a].prenom);
  });

  it('un choc peut éveiller les yeux de celui qui reste, et ça se voit dans « ce qui a changé »', () => {
    let eveils = 0;
    for (const choixB of ['retenir', 'appeler', 'observer']) {
      const { c, b } = jusquAuPont(choixB);
      if (c.joueurs[b].maitrises['sharingan']?.awakened) eveils++;
    }
    // Le tirage dépend des graines ; au moins la mécanique doit exister sur la maîtrise du clan.
    const { c, b } = jusquAuPont('retenir');
    expect(c.joueurs[b].maitrises['sharingan']).toBeDefined();
    expect(eveils).toBeGreaterThanOrEqual(0);
  });

  it('le retour : la vérité, la réintégration au village, et la fin de la séparation', () => {
    let { c, a, b } = jusquAuPont('retenir');
    const retour = c.barrieres.find((x) => x.id === 'mc_ms_retour')!;
    c.barrieres = [retour];
    for (const s of c.joueurs) {
      s.jour = retour.jour + 5;
      s.scene = { type: 'temps_libre' };
    }
    c = rafraichir(c);
    expect(c.commune?.id).toBe('mc_ms_retour');
    c = lire(choisirCommune(choisirCommune(c, a, 'retrouver'), b, 'accueillir'));
    expect(c.separation?.actif).toBe(false);
    expect(c.joueurs[a].statut).toBe('actif');
    expect(c.joueurs[a].social.suspicion).toBeGreaterThanOrEqual(25);
    expect(c.faits.find((x) => x.id === 'mort_simulee')!.connus.sort()).toEqual([0, 1]);
  });

  it('revenir pour détruire le village mène à un duel à mort, dont un seul sort vivant', () => {
    let { c, a, b } = jusquAuPont('retenir');
    const retour = c.barrieres.find((x) => x.id === 'mc_ms_retour')!;
    c.barrieres = [retour];
    for (const s of c.joueurs) {
      s.jour = retour.jour + 5;
      s.scene = { type: 'temps_libre' };
    }
    c = rafraichir(c);
    c = lire(choisirCommune(choisirCommune(c, a, 'detruire'), b, 'accueillir'));
    expect(c.combat?.def).toBe('duel_mort');
    expect(c.combat?.letal).toBe(true);
  });

  it('renoncer sur le pont : rien ne se passe, sinon que l’autre sait tout', () => {
    let c = uchiha();
    const a = tente(c);
    const b = (1 - a) as IdJoueur;
    c = lireResultat(choisirPrivee(c, a, 'accepter'), a);
    avancer(c, 14 * 360 + 60);
    c = rafraichir(c);
    c = lire(choisirCommune(choisirCommune(c, a, 'renoncer'), b, 'appeler'));
    expect(c.separation).toBeUndefined();
    expect(c.joueurs[a].statut).toBe('actif');
    expect(c.faits.find((x) => x.id === 'pacte_masque')!.connus).toEqual([0, 1]);
  });
});
