import { describe, expect, it } from 'vitest';
import type { GameState, Presentation, VillageId } from '../src/engine/types';
import { nouvellePartie } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { interpoler } from '../src/engine/texte';
import { combinaisons, creation } from './aide';

/** Toutes les chaînes affichées d'un objet de contenu : titres, textes, choix, résultats. */
function chaines(x: unknown, out: string[] = [], cle = ''): string[] {
  if (typeof x === 'string') {
    if (['texte', 'resultat', 'titre', 'verrou', 'indice'].includes(cle)) out.push(x);
  } else if (Array.isArray(x)) for (const v of x) chaines(v, out, cle);
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) chaines(v, out, ['si', 'effets', 'alors', 'sinon'].includes(k) ? '' : k === 'texte' || k === 'resultat' || k === 'titre' || k === 'verrou' || k === 'indice' ? k : cle === 'texte' || cle === 'resultat' ? cle : k);
  return out;
}

/** Ce qu'un texte rendu ne doit jamais contenir. */
const DEFAUTS: [RegExp, string][] = [
  [/[{}]/, 'jeton non résolu'],
  [/undefined|null|NaN/, 'valeur manquante'],
  [/·/, 'accord non résolu'],
  [/\b(avec|sur|pour|sans|chez|contre|vers|derrière|devant|entre|par) (le|la)\s*([.,;:!?»)]|$)/, 'article qui pend après une préposition'],
  [/ {2,}/, 'double espace'],
  [/ [,.]/, 'espace avant une virgule ou un point'],
];

/** Un état de départ par village et par présentation, avec une famille fondée pour les jetons de l'âge adulte. */
function etats(): GameState[] {
  const res: GameState[] = [];
  const villages = new Set<VillageId>();
  for (const c of combinaisons()) {
    if (villages.has(c.village)) continue;
    villages.add(c.village);
    for (const presentation of ['feminin', 'masculin', 'neutre'] as Presentation[]) {
      const s = nouvellePartie(creation({ ...c, presentation }), 3);
      s.drapeaux['famille_fondee'] = true;
      s.drapeaux['conjoint_genre'] = presentation === 'feminin' ? 'm' : 'f';
      s.drapeaux['enfant_genre'] = presentation === 'masculin' ? 'f' : 'm';
      res.push(s);
    }
  }
  return res;
}

describe('Les textes du jeu sont complets', () => {
  it('aucun texte rendu n’est cassé, quels que soient le village et le genre du personnage', () => {
    const defauts = new Map<string, string>();
    const sources: [string, unknown][] = [...R.contenu.evenements.map((e) => [e.id, e] as [string, unknown]), ...R.contenu.fins.map((f) => [`fin:${f.id}`, f] as [string, unknown])];
    for (const s of etats()) {
      for (const [id, obj] of sources) {
        for (const brut of chaines(obj)) {
          const rendu = interpoler(brut, s);
          for (const [re, nom] of DEFAUTS) {
            // La présentation neutre garde volontairement l'écriture inclusive (« seul·e »).
            if (nom === 'accord non résolu' && s.creation.presentation === 'neutre') continue;
            const m = re.exec(rendu);
            if (m && !defauts.has(`${id}|${nom}|${brut.slice(0, 40)}`)) defauts.set(`${id}|${nom}|${brut.slice(0, 40)}`, `${id} — ${nom} : « …${rendu.slice(Math.max(0, m.index - 40), m.index + 30)}… »`);
          }
        }
      }
    }
    expect([...defauts.values()]).toEqual([]);
  });

  it('chaque scène offre au moins deux choix, sauf les scènes de transition', () => {
    const pauvres = R.contenu.evenements.filter((e) => e.choix.length < 2 && !e.enchaine && !(e.priorite ?? 0)).map((e) => e.id);
    expect(pauvres).toEqual([]);
  });
});
