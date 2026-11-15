import { describe, expect, it } from 'vitest';
import { SCENES, choisirCommune, decider, joueurActif, lireResultat, nouvelleCampagne, texteCommun } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur, TypeLien } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';

/** Une campagne arrêtée sur une scène commune, les deux joueurs à l'âge voulu. */
function sur(id: string, type: TypeLien = 'amis'): Campagne {
  const c = cloner(
    nouvelleCampagne(
      creation({ prenom: 'Kaito', village: 'konoha', clan: type === 'freres' || type === 'clan' ? 'uchiha' : 'sans_clan' }),
      creation({ prenom: 'Ren', village: type === 'villages_differents' ? 'kumo' : 'konoha', clan: type === 'freres' || type === 'clan' ? 'uchiha' : 'sans_clan', presentation: 'feminin' }),
      { type, passe: 'rencontre' },
      12,
    ),
  );
  const age = SCENES[id].age?.min ?? 20;
  for (const s of c.joueurs) {
    s.jour = Math.max(...c.joueurs.map((x) => x.naissance)) + age * 360 + 5;
    s.scene = { type: 'temps_libre' };
  }
  c.barrieres = [{ id, jour: 0 }];
  c.commune = { id, choix: [undefined, undefined] };
  return c;
}

const repondre = (c: Campagne) => {
  const sc = SCENES[c.commune!.id];
  return choisirCommune(choisirCommune(c, 0, sc.choix[0].id), 1, sc.choix[1].id);
};

describe('La décision commune : proposer, puis accepter', () => {
  it('après les réactions, la scène attend une décision ; personne ne reprend sa vie avant', () => {
    const c = repondre(sur('mc_cx_shogi'));
    expect(c.resultat?.decision).toEqual({ version: 0 });
    expect(() => lireResultat(c, 0)).toThrow(/Décidez/);
  });

  it('une proposition, une contre-proposition, puis l’accord : une seule issue, pour les deux', () => {
    let c = repondre(sur('mc_cx_shogi'));
    const accord0 = c.lien.accord;
    c = decider(c, 0, 'tradition');
    expect(c.resultat!.decision).toMatchObject({ version: 1, proposition: { par: 0, choix: 'tradition' } });
    expect(joueurActif(c)).toBe(1);
    c = decider(c, 1, 'quand');
    expect(c.resultat!.decision).toMatchObject({ version: 2, proposition: { par: 1, choix: 'quand' } });
    c = decider(c, 0, 'quand');
    expect(c.resultat!.decision!.prise?.choix).toBe('quand');
    expect(c.lien.accord).toBe(accord0 + 1);
    expect(c.lien.promesses.some((p) => p.id === 'jeudis')).toBe(false);
    // Ensuite seulement, chacun lit et reprend sa vie.
    c = lireResultat(lireResultat(c, 0), 1);
    expect(c.resultat).toBeUndefined();
  });

  it('accepter une proposition périmée est refusé proprement, sans rien appliquer', () => {
    let c = repondre(sur('mc_cx_shogi'));
    c = decider(c, 0, 'tradition'); // version 1
    const vue = c.resultat!.decision!.version;
    c = decider(c, 0, 'quand'); // Kaito change d'avis : version 2
    expect(() => decider(c, 1, 'tradition', vue)).toThrow('proposition_perimee');
    expect(c.resultat!.decision!.prise).toBeUndefined();
  });

  it('deux acceptations simultanées : la première passe, la seconde est refusée, aucun doublon', () => {
    let c = repondre(sur('mc_cx_shogi'));
    c = decider(c, 0, 'tradition');
    const v = c.resultat!.decision!.version;
    const apres = decider(c, 1, 'tradition', v);
    expect(apres.lien.promesses.filter((p) => p.id === 'jeudis')).toHaveLength(1);
    expect(() => decider(apres, 1, 'tradition', v)).toThrow();
    expect(() => decider(apres, 0, 'tradition', apres.resultat!.decision!.version)).toThrow(/Aucune décision/);
  });

  it('« ce qui a changé » ne montre à chacun que ses propres sentiments et ce qu’il sait', () => {
    let c = repondre(sur('mc_cx_shogi'));
    c = decider(decider(c, 0, 'tradition'), 1, 'tradition');
    const [k, r] = c.resultat!.changements!;
    expect(k.some((x) => x.t === 'promesse')).toBe(true);
    expect(r.some((x) => x.t === 'promesse')).toBe(true);
    // Les axes listés pour Kaito sont ceux de Kaito envers Ren.
    for (const x of k) if (x.t === 'axe') expect(Math.abs(x.delta)).toBeGreaterThanOrEqual(2);
  });
});

describe('Le contenu des décisions communes', () => {
  const avecDecision = Object.values(SCENES).filter((s) => s.decision);

  it('existe, et deux options d’une même décision n’ont jamais le même effet', () => {
    expect(avecDecision.length).toBeGreaterThanOrEqual(6);
    for (const sc of avecDecision) {
      const d = sc.decision!;
      expect(d.choix.length, sc.id).toBeGreaterThanOrEqual(2);
      const effets = d.choix.map((x) => JSON.stringify({ ...x.issue, texte: undefined }));
      expect(new Set(effets).size, sc.id).toBe(effets.length);
      // Chaque option laisse au moins une trace : lien, accord, promesse, souvenir ou effet.
      for (const x of d.choix) expect(!!(x.issue.lien || x.issue.accord || x.issue.promesse || x.issue.souvenir || x.issue.effets), `${sc.id} ${x.id}`).toBe(true);
    }
  });

  it('aucun jeton ne reste à l’écran, quel que soit le lien', () => {
    for (const sc of avecDecision)
      for (const type of sc.types ?? (['amis', 'freres', 'rivaux'] as TypeLien[])) {
        const c = sur(sc.id, type);
        for (const j of [0, 1] as IdJoueur[]) {
          expect(texteCommun(c, sc.decision!.question, j, j), sc.id).not.toMatch(/[{}]/);
          for (const x of sc.decision!.choix) {
            expect(texteCommun(c, x.texte, j, j)).not.toMatch(/[{}]/);
            expect(texteCommun(c, x.issue.texte, j, j)).not.toMatch(/[{}]/);
            if (x.issue.promesse) expect(x.issue.promesse.texte, `${sc.id} ${x.id}`).not.toMatch(/[{}]/);
          }
        }
      }
  });
});
