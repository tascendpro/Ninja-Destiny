// Sélection déterministe des textes et des répliques (§9.1) : le moteur choisit parmi des données, il n'invente rien.
// Le tirage est fourni par l'appelant (déjà tiré dans l'ordre fixe de la manche) : choisir ne consomme aucun hasard.

import type { GameState } from '../types';
import { evaluer } from '../conditions';
import { age } from '../calendrier';
import type { CategorieReplique, EtatAffrontement, QuandReplique, RegistreAdversaire, Replique } from './types';

/** Choisit une variante avec un tirage donné, en évitant la dernière utilisée quand c'est possible. */
export function choisirVariante(variantes: string[], tirage: number, derniere?: string): string {
  if (!variantes.length) return '';
  const pool = variantes.length > 1 && derniere ? variantes.filter((v) => v !== derniere) : variantes;
  return pool[Math.min(pool.length - 1, Math.floor(tirage * pool.length))];
}

/** Les faits de la manche qu'une réplique peut exiger. */
export interface FaitsManche {
  dejaVue?: boolean;
  inedite?: boolean;
  repetition?: boolean;
  habitudeConnue?: boolean;
  ouvertureChangee?: boolean;
  issue?: string;
}

function remplit(q: QuandReplique | undefined, s: GameState, reg: RegistreAdversaire | undefined, f: FaitsManche): boolean {
  if (!q) return true;
  const rencontres = reg?.rencontres ?? 0;
  if (q.rencontresMin !== undefined && rencontres < q.rencontresMin) return false;
  if (q.rencontresMax !== undefined && rencontres > q.rencontresMax) return false;
  if (q.derniereIssue && (!reg?.derniereIssue || !q.derniereIssue.includes(reg.derniereIssue))) return false;
  if (q.dejaVue !== undefined && !!f.dejaVue !== q.dejaVue) return false;
  if (q.inedite !== undefined && !!f.inedite !== q.inedite) return false;
  if (q.repetition !== undefined && !!f.repetition !== q.repetition) return false;
  if (q.habitudeConnue !== undefined && !!f.habitudeConnue !== q.habitudeConnue) return false;
  if (q.ouvertureChangee !== undefined && !!f.ouvertureChangee !== q.ouvertureChangee) return false;
  if (q.issue && (!f.issue || !q.issue.includes(f.issue as never))) return false;
  const a = age(s);
  if (q.ageMin !== undefined && a < q.ageMin) return false;
  if (q.ageMax !== undefined && a > q.ageMax) return false;
  return true;
}

/** Nombre de conditions d'une réplique : plus elle est précise, plus elle l'emporte sur le générique. */
function specificite(r: Replique): number {
  return Object.keys(r.quand ?? {}).length + (r.si ? 1 : 0);
}

const COOLDOWN = 3;

/**
 * Sélectionne une réplique d'une catégorie : conditions remplies, pas en attente (3 manches), pas déjà dite si unique.
 * Les répliques spécifiques pèsent trois fois plus (§9.1). Renvoie undefined si rien ne convient.
 */
export function choisirReplique(
  s: GameState,
  sc: EtatAffrontement,
  banque: Replique[],
  categorie: CategorieReplique,
  faits: FaitsManche,
  tirage: number,
): Replique | undefined {
  const reg = s.registresCombat[sc.registreId];
  const candidates = banque
    .filter((r) => r.categorie === categorie)
    .filter((r) => remplit(r.quand, s, reg, faits) && (!r.si || evaluer(r.si, s)))
    .filter((r) => {
      const derniere = sc.repliquesUtilisees[r.id];
      if (derniere === undefined) return !(r.unique && s.drapeaux[`replique:${r.id}`]);
      return !r.unique && sc.manche - derniere >= COOLDOWN;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!candidates.length) return undefined;
  const poids = candidates.map((r) => (r.poids ?? 1) * (specificite(r) > 0 ? 3 : 1));
  const total = poids.reduce((a, b) => a + b, 0);
  let x = tirage * total;
  for (let i = 0; i < candidates.length; i++) {
    x -= poids[i];
    if (x < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Marque une réplique comme dite (attente, unicité). */
export function noterReplique(s: GameState, sc: EtatAffrontement, r: Replique): void {
  sc.repliquesUtilisees[r.id] = sc.manche;
  if (r.unique) s.drapeaux[`replique:${r.id}`] = true;
}
