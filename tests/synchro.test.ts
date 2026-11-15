import { describe, expect, it } from 'vitest';
import { Synchro, journalMemoire, nouvellesActions } from '../src/engine/multi/synchro';
import { SCENES, choisirCommune, joueurActif, nouvelleCampagne, rejouerCampagne } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur } from '../src/engine/campagne/types';
import { creation } from './aide';
import { jouer } from './aideCampagne';

const fiches = [creation({ prenom: 'Kaito', village: 'konoha', clan: 'uchiha' }), creation({ prenom: 'Ren', village: 'konoha', clan: 'hyuga' })] as const;
const lien = { type: 'amis' as const, passe: 'rencontre' as const };
const depart = () => nouvelleCampagne(fiches[0], fiches[1], lien, 99);

/** Deux téléphones sur le même journal. */
function deuxAppareils() {
  const j = journalMemoire();
  const etats: [Campagne | null, Campagne | null] = [null, null];
  const app = ([0, 1] as const).map((s) => new Synchro(j.transport(), depart(), (c) => (etats[s] = c)));
  app.forEach((a) => a.demarrer());
  return { j, app, etats };
}

describe('Deux téléphones, un seul journal', () => {
  it('deux choix envoyés au même instant : les deux passent, dans un ordre unique, sans doublon', async () => {
    const { j, app } = deuxAppareils();
    const c = app[0].confirme;
    const sc = SCENES[c.commune!.id];
    const choix = (x: IdJoueur) => (sc.choixPour?.(c, x) ?? sc.choix)[0].id;
    await Promise.all(([0, 1] as IdJoueur[]).map((x) => app[x].envoyer(nouvellesActions(c, choisirCommune(c, x, choix(x))), x)));
    await new Promise((r) => setTimeout(r, 0));
    expect(j.lignes.map((l) => l.seq).sort()).toEqual([1, 2]);
    expect(app[0].confirme.resultat?.id).toBe(sc.id);
    expect(JSON.stringify(app[0].confirme)).toBe(JSON.stringify(app[1].confirme));
  });

  it('une action devenue impossible pendant que l’autre jouait est refusée, et rien n’est écrit', async () => {
    const { j, app } = deuxAppareils();
    const c = app[0].confirme;
    const sc = SCENES[c.commune!.id];
    const id = (sc.choixPour?.(c, 0) ?? sc.choix)[0].id;
    await app[0].envoyer(nouvellesActions(c, choisirCommune(c, 0, id)), 0);
    // L'appareil 0 rejoue le même choix depuis un état périmé : le moteur le refuse.
    await expect(app[0].envoyer(nouvellesActions(c, choisirCommune(c, 0, id)), 0)).rejects.toThrow();
    expect(j.lignes).toHaveLength(1);
  });

  it('une longue partie jouée chacun sur son téléphone donne exactement le même monde des deux côtés, et le même que le rejeu', async () => {
    const { j, app } = deuxAppareils();
    for (let i = 0; i < 400; i++) {
      const c = app[0].confirme;
      const x = joueurActif(c);
      if (x === null) break;
      // Le téléphone du joueur qui a la main joue un pas, à partir de son propre état.
      const local = app[x].confirme;
      const apres = jouer(local, 500 + i, () => false, 1);
      const nouvelles = nouvellesActions(local, apres);
      if (!nouvelles.length) break;
      await app[x].envoyer(nouvelles, x);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(j.lignes.length).toBeGreaterThan(100);
    expect(JSON.stringify(app[0].confirme)).toBe(JSON.stringify(app[1].confirme));
    const rejoue = rejouerCampagne(fiches[0], fiches[1], lien, 99, j.lignes.sort((a, b) => a.seq - b.seq).map((l) => l.action));
    expect(rejoue.actions.length).toBe(app[0].confirme.actions.length);
    expect(JSON.stringify(rejoue.joueurs)).toBe(JSON.stringify(app[1].confirme.joueurs));
  });
});
