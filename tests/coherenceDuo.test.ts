import { describe, expect, it } from 'vitest';
import { nouvelleCampagne, vuePage } from '../src/engine/campagne/moteur';
import type { Campagne, PasseCommun, TypeLien } from '../src/engine/campagne/types';
import { creation } from './aide';
import { jouer } from './aideCampagne';

/**
 * Des campagnes jouées au hasard, de l'enfance à 40 ans, sur tous les liens : à chaque pas, ce qui ne doit jamais arriver.
 * (En test, un jeton non résolu dans un texte lève une erreur : jouer suffit à le vérifier pour tout ce qui s'affiche.)
 */
const LIENS: [TypeLien, string, string, string, string][] = [
  ['freres', 'konoha', 'uchiha', 'konoha', 'uchiha'],
  ['clan', 'konoha', 'hyuga', 'konoha', 'hyuga'],
  ['amis', 'konoha', 'sans_clan', 'konoha', 'nara'],
  ['rivaux', 'kiri', 'sans_clan', 'kiri', 'sans_clan'],
  ['inconnus', 'konoha', 'sans_clan', 'kumo', 'sans_clan'],
  ['clans_differents', 'konoha', 'uchiha', 'konoha', 'senju'],
  ['villages_differents', 'suna', 'sans_clan', 'iwa', 'sans_clan'],
];
const PASSES: PasseCommun[] = ['rencontre', 'promesse', 'dette', 'competition', 'secret', 'perte', 'mefiance'];
const REPETABLES = new Set(['mc_echo_souvenir', 'mc_echo_promesse']);

function verifier(c: Campagne, erreurs: string[], cle: string): void {
  const vues = c.vues.filter((v) => !REPETABLES.has(v));
  const doublons = vues.filter((v, i) => vues.indexOf(v) !== i);
  if (doublons.length) erreurs.push(`${cle} : scène commune vécue deux fois (${doublons[0]})`);
  if (c.creations[0].village !== c.creations[1].village && c.vues.some((v) => v.startsWith('mc_rg_'))) erreurs.push(`${cle} : scène de rang entre deux villages`);
  if (c.stats.tueParAutre !== undefined) {
    const j = c.stats.tueParAutre;
    if (c.morts[j] === 'retour' || c.vues.includes('mc_retour')) erreurs.push(`${cle} : un tué en duel est revenu`);
  }
  if (c.separation?.actif && c.commune && vuePage(c)?.joueurs[c.separation.absent].present && c.commune.id !== 'mc_ms_retour') erreurs.push(`${cle} : l'absent participe à ${c.commune.id}`);
  for (const s of c.joueurs) if (s.pointsStat < 0) erreurs.push(`${cle} : points négatifs`);
}

describe('La cohérence des campagnes à deux', () => {
  it('14 campagnes jouées jusqu’à 40 ans : aucune scène en double, aucun mort qui revient à tort, aucun texte cassé', () => {
    const erreurs: string[] = [];
    let n = 0;
    for (let k = 0; k < 14; k++) {
      const [type, v1, k1, v2, k2] = LIENS[k % LIENS.length];
      const c0 = nouvelleCampagne(
        creation({ prenom: 'Kaito', village: v1 as never, clan: k1, presentation: (['masculin', 'feminin', 'neutre'] as const)[k % 3] }),
        creation({ prenom: 'Ren', village: v2 as never, clan: k2, presentation: (['feminin', 'neutre', 'masculin'] as const)[k % 3], ageDepart: k % 4 === 0 ? 10 : 6 }),
        { type, passe: PASSES[k % PASSES.length], origine: type === 'inconnus' ? undefined : undefined },
        4000 + k,
      );
      const cle = `${type}#${k}`;
      const fin = jouer(c0, 50 + k, (c) => c.joueurs.every((s) => s.jour - s.naissance > 40 * 360 || s.statut === 'mort'), 3500, ['hasard', 'hasard'], (c) => verifier(c, erreurs, cle));
      verifier(fin, erreurs, cle);
      n += fin.vues.length;
    }
    expect(erreurs.slice(0, 10)).toEqual([]);
    expect(n).toBeGreaterThan(200);
  }, 600000);
});
