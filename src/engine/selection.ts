// Sélection des événements : planifiés → trame → aléatoire contrôlé. L'aléatoire ne remplace jamais la cohérence.

import type { EventDef, GameState } from './types';
import { R } from './registre';
import { evaluer } from './conditions';
import { decouvrir, resoudrePnj } from './etat';
import { tirerPondere } from './rng';

export function resoudreLieu(s: GameState, lieu: string): string {
  if (lieu.startsWith('$')) {
    const v = s.creation.village;
    const suffixe = lieu.slice(1);
    // Loin du village, « chez soi » c'est la route où l'on se trouve.
    if ((s.statut === 'errant' || s.statut === 'deserteur') && ['village', 'maison', 'terrain'].includes(suffixe)) {
      const ici = s.drapeaux['lieu_errance'];
      return typeof ici === 'string' ? ici : 'route_commerce';
    }
    return suffixe === 'village' ? v : `${v}_${suffixe}`;
  }
  return lieu;
}

export function evenementDisponible(s: GameState, ev: EventDef): boolean {
  if (s.fin) return false;
  // Un chapitre ne voit jamais les scènes des suivants. Les scènes des chapitres précédents restent possibles
  // quand elles ne sont pas de la trame (missions, rencontres du temps libre, suites planifiées).
  if (ev.chapitres) {
    if (!ev.chapitres.includes(s.chapitre)) return false;
  } else if (ev.chapitre > s.chapitre) return false;
  if (!ev.chapitres && ev.chapitre < s.chapitre && (ev.priorite ?? 0) > 0) return false;
  // Les rencontres du temps libre d'un chapitre ne survivent qu'au chapitre suivant (celles de l'enfance ne suivent pas l'adulte).
  if (!ev.chapitres && ev.chapitre < s.chapitre - 1 && (ev.poids ?? 0) > 0) return false;
  const vu = s.evenementsVus[ev.id];
  if (vu) {
    if (!ev.repetable) return false;
    if (s.jour - vu.dernier < ev.repetable.delaiJours) return false;
    if (ev.repetable.max !== undefined && vu.n >= ev.repetable.max) return false;
  }
  // Un personnage mort ou disparu ne peut pas être présent dans une scène.
  for (const ref of ev.personnages ?? []) {
    const id = resoudrePnj(s, ref);
    if (!id) return false;
    const st = s.pnj[id];
    if (st && (st.etat === 'mort' || st.etat === 'disparu')) return false;
  }
  return evaluer(ev.si, s);
}

export function evenementsDisponibles(s: GameState): EventDef[] {
  return R.contenu.evenements.filter((e) => evenementDisponible(s, e));
}

/** Prochain événement narratif, ou undefined si le personnage dispose de temps libre. */
export function choisirSuivant(s: GameState, suiteForcee?: string): string | undefined {
  if (suiteForcee) {
    const ev = R.evenements[suiteForcee];
    if (ev && evenementDisponible(s, ev)) return ev.id;
  }
  const echus = s.planifies.filter((p) => p.jour <= s.jour).sort((a, b) => a.jour - b.jour);
  for (const p of echus) {
    s.planifies = s.planifies.filter((x) => x !== p);
    const ev = R.evenements[p.evenementId];
    if (ev && evenementDisponible(s, ev)) return ev.id;
  }
  let meilleur: EventDef | undefined;
  for (const ev of R.contenu.evenements) {
    if ((ev.priorite ?? 0) <= 0) continue;
    if (!evenementDisponible(s, ev)) continue;
    if (!meilleur || (ev.priorite ?? 0) > (meilleur.priorite ?? 0)) meilleur = ev;
  }
  return meilleur?.id;
}

/** Un moment d'histoire attend-il (scène planifiée échue ou scène de trame disponible) ? Ne modifie rien. */
export function trameDisponible(s: GameState): boolean {
  for (const p of s.planifies) {
    if (p.jour > s.jour) continue;
    const ev = R.evenements[p.evenementId];
    if (ev && evenementDisponible(s, ev)) return true;
  }
  return R.contenu.evenements.some((ev) => (ev.priorite ?? 0) > 0 && evenementDisponible(s, ev));
}

export function tirerAleatoire(s: GameState): string | undefined {
  const candidats = R.contenu.evenements
    .filter((e) => (e.poids ?? 0) > 0 && !(e.priorite ?? 0) && evenementDisponible(s, e))
    .map((e) => ({ item: e.id, poids: (e.poids ?? 0) * (e.rare ? 0.35 : 1) }));
  return tirerPondere(s, candidats);
}

export function entrerEvenement(s: GameState, id: string): void {
  const ev = R.evenements[id];
  s.scene = { type: 'evenement', id };
  const vu = s.evenementsVus[id];
  s.evenementsVus[id] = { n: (vu?.n ?? 0) + 1, dernier: s.jour };
  decouvrir(s, `lieu:${resoudreLieu(s, ev.lieu)}`);
  for (const ref of ev.personnages ?? []) {
    const pid = resoudrePnj(s, ref);
    if (pid && s.pnj[pid]) {
      s.pnj[pid].rencontre = true;
      decouvrir(s, `pnj:${pid}`);
    }
  }
}
