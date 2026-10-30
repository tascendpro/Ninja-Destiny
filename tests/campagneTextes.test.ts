import { describe, expect, it } from 'vitest';
import { SCENES, choisirCommune, issuePour, nouvelleCampagne, texteCommun, vueCommune } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur, TypeLien } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';

/** Une campagne mise en situation pour une scène : l'âge voulu, le Héron déjà croisé, un traître si la scène en demande un. */
function pour(id: string, type: TypeLien, p: 'masculin' | 'feminin' | 'neutre'): Campagne {
  const memeVillage = type !== 'villages_differents';
  const c0 = nouvelleCampagne(
    creation({ prenom: 'Aya', presentation: p, village: 'konoha', clan: type === 'clan' || type === 'freres' ? 'uchiha' : 'sans_clan' }),
    creation({ prenom: 'Ren', presentation: p, village: memeVillage ? 'konoha' : 'kumo', clan: type === 'clan' || type === 'freres' ? 'uchiha' : type === 'clans_differents' ? 'hyuga' : 'sans_clan' }),
    { type, passe: 'rencontre' },
    7,
  );
  const c = cloner(c0);
  const sc = SCENES[id];
  const age = sc.age?.min ?? 25;
  for (const s of c.joueurs) {
    s.jour = Math.max(...c.joueurs.map((x) => x.naissance)) + age * 360 + 5;
    s.scene = { type: 'temps_libre' };
  }
  c.joueurs[0].rang = 'jonin';
  c.joueurs[1].rang = 'genin';
  c.vues.push('mc_heron_ombre');
  c.fil = { etape: 'engage', joueur: 1, preuves: 3 };
  return c;
}

describe('Les textes de la campagne', () => {
  it('aucune scène, commune ou privée, ne laisse de jeton à l’écran, quels que soient le lien et les genres', () => {
    const types: TypeLien[] = ['freres', 'clan', 'amis', 'rivaux', 'inconnus', 'villages_differents', 'improbable'];
    for (const id of Object.keys(SCENES)) {
      const sc = SCENES[id];
      for (const type of types) {
        if (sc.types && !sc.types.includes(type)) continue;
        for (const p of ['masculin', 'feminin', 'neutre'] as const) {
          const c = pour(id, type, p);
          const texte = typeof sc.texte === 'function' ? sc.texte(c) : sc.texte;
          for (const j of [0, 1] as IdJoueur[]) {
            const lisible = texteCommun(c, `${sc.titre} ${texte} ${sc.textePour?.(c, j) ?? ''}`, j, j);
            expect(lisible, `${id} ${type} ${p}`).not.toMatch(/\{|\}/);
          }
          const l0 = sc.choixPour?.(c, 0) ?? sc.choix;
          const l1 = sc.choixPour?.(c, 1) ?? sc.choix;
          for (const a of l0)
            for (const b of l1) {
              const { issue, un } = issuePour(sc, a.id, b.id, [l0, l1]);
              expect(texteCommun(c, issue.texte, un), `${id} ${a.id}+${b.id} ${p}`).not.toMatch(/\{|\}/);
              expect(texteCommun(c, a.texte, 0, 0)).not.toMatch(/\{|\}/);
            }
          // Une scène privée : chaque issue, du point de vue de celui qui la vit.
          if (sc.privee)
            for (const i of sc.issues) expect(texteCommun(c, i.texte, 1, 1), `${id} ${i.cle} ${p}`).not.toMatch(/\{|\}/);
        }
      }
    }
  });

  it('une scène commune se résout pour chaque paire de choix, sans erreur', () => {
    for (const id of Object.keys(SCENES).filter((x) => !SCENES[x].privee)) {
      const c = pour(id, 'amis', 'feminin');
      c.commune = { id, choix: [undefined, undefined] };
      const v0 = vueCommune(c, 0)!;
      const v1 = vueCommune(c, 1)!;
      for (const a of v0.choix)
        for (const b of v1.choix) {
          const r = choisirCommune(choisirCommune(c, 0, a.id), 1, b.id);
          expect(r.resultat?.texte, `${id} ${a.id}+${b.id}`).toBeTruthy();
        }
    }
  });
});
