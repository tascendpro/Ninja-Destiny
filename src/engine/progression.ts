// Points de stat : chaque anniversaire convertit les mérites de l'année en points, que le joueur répartit
// lui-même entre ses attributs. Monter un attribut coûte de plus en plus cher.

import type { AttributId, GameState, GainAnnuel } from './types';
import { ATTRIBUTS } from './types';
import { Ctx, ajouterJournal } from './etat';

export type Merite = 'combat' | 'epreuve' | 'entrainement' | 'etude';

export function noterMerite(s: GameState, m: Merite, n = 1): void {
  s.merites[m] = (s.merites[m] ?? 0) + n;
}

/** Coût d'un point d'attribut supplémentaire à partir de la valeur actuelle. */
export function coutPoint(valeur: number): number {
  return valeur < 60 ? 1 : valeur < 80 ? 2 : 3;
}

/** Coût total d'une répartition (+n sur chaque attribut), en tenant compte des paliers de coût. */
export function coutRepartition(s: GameState, rep: Partial<Record<AttributId, number>>): number {
  let total = 0;
  for (const [k, n] of Object.entries(rep)) {
    let v = s.attributs[k as AttributId];
    for (let i = 0; i < (n ?? 0); i++) total += coutPoint(v++);
  }
  return total;
}

function missionsReussies(s: GameState): number {
  return Object.values(s.missions).filter((m) => m === 'reussie').length;
}

const POINTS_RANG: Record<string, number> = { eleve: 1, genin: 2, chunin: 3, jonin: 4, kage: 4 };
const NOM_RANG: Record<string, string> = { eleve: 'Académie', genin: 'Rang de genin', chunin: 'Rang de chūnin', jonin: 'Rang de jōnin', kage: 'Kage' };

/** Ce que l'année écoulée rapporte, source par source. */
export function gainsAnnuels(s: GameState, nouvelAge: number): GainAnnuel[] {
  const g: GainAnnuel[] = [];
  const m = s.merites;
  const ajouter = (source: string, points: number) => points > 0 && g.push({ source, points });
  ajouter('Croissance', nouvelAge <= 20 ? 2 : nouvelAge <= 35 ? 1 : 0);
  if (s.statut === 'actif') ajouter(NOM_RANG[s.rang] ?? 'Rang', POINTS_RANG[s.rang] ?? 0);
  if (s.statut === 'errant' || s.statut === 'deserteur') ajouter('La route', 1);
  ajouter('Missions réussies', Math.min(3, missionsReussies(s) - (m.missionsBase ?? 0)));
  ajouter('Combats gagnés', Math.min(2, Math.floor(((m.combat ?? 0) + 1) / 2)));
  ajouter('Épreuves réussies', Math.min(2, Math.floor((m.epreuve ?? 0) / 2)));
  ajouter('Entraînement', Math.min(2, m.entrainement ?? 0));
  ajouter('Études', Math.min(1, m.etude ?? 0));
  if (s.tirages.prodige) ajouter('Talent de prodige', 1);
  return g;
}

/** Anniversaire : les mérites deviennent des points à répartir, puis le compteur repart à zéro. */
export function anniversaire(s: GameState, nouvelAge: number, ctx?: Ctx): void {
  if (nouvelAge < 7 || s.statut === 'mort') return;
  const gains = gainsAnnuels(s, nouvelAge);
  const total = gains.reduce((a, x) => a + x.points, 0);
  s.merites = { missionsBase: missionsReussies(s) };
  if (!total) return;
  s.pointsStat += total;
  s.anniversaires.push({ age: nouvelAge, gains });
  if (s.anniversaires.length > 30) s.anniversaires.shift();
  ctx?.changements.push({ t: 'points', age: nouvelAge, total, gains });
  ajouterJournal(s, `${nouvelAge} ans : ${total} points de stat gagnés (${gains.map((x) => `${x.source} ${x.points}`).join(', ')}).`, 1);
}

/** Répartit des points : +n sur chaque attribut demandé, si la bourse de points suffit. */
export function repartirPoints(s: GameState, rep: Partial<Record<AttributId, number>>): void {
  if (s.scene.type === 'fin') throw new Error('La partie est terminée.');
  for (const [k, n] of Object.entries(rep)) {
    if (!ATTRIBUTS.includes(k as AttributId) || !Number.isInteger(n) || (n ?? 0) < 0) throw new Error('Répartition invalide.');
    if (s.attributs[k as AttributId] + (n ?? 0) > 100) throw new Error('Un attribut ne dépasse jamais 100.');
  }
  const cout = coutRepartition(s, rep);
  if (cout === 0) throw new Error('Aucun point à répartir.');
  if (cout > s.pointsStat) throw new Error('Pas assez de points.');
  s.pointsStat -= cout;
  for (const [k, n] of Object.entries(rep)) s.attributs[k as AttributId] += n ?? 0;
}
