// Reconnaître un enchaînement de gestes (content/combat/gestes.ts) : les actions des manches d'avant, puis celle-ci.
// Aucun tirage : l'enchaînement se lit sur l'historique du combat.

import { GESTES } from '../../content/combat/gestes';
import type { GesteDef, PasGeste } from '../../content/combat/gestes';
import type { EtatAffrontement, Famille } from './types';

function correspond(p: PasGeste, famille: Famille | undefined, choix: string | undefined): boolean {
  if (choix === undefined) return false;
  if (p.famille) {
    const fs = Array.isArray(p.famille) ? p.famille : [p.famille];
    if (!famille || !fs.includes(famille)) return false;
  }
  if (p.choix) {
    const cs = Array.isArray(p.choix) ? p.choix : [p.choix];
    if (!cs.includes(choix)) return false;
  }
  if (p.contient && !choix.includes(p.contient)) return false;
  return true;
}

/** L'enchaînement que cette action terminerait (le plus fort, s'il y en a plusieurs). */
export function gesteEnchaine(sc: EtatAffrontement, famille: Famille, choix: string): GesteDef | undefined {
  const acts = sc.actionsJoueur;
  const fams = sc.famillesJoueur ?? [];
  let meilleur: GesteDef | undefined;
  for (const g of GESTES) {
    const n = g.avant.length;
    if (acts.length < n) continue;
    const ok = g.avant.every((p, i) => correspond(p, fams[fams.length - n + i], acts[acts.length - n + i]));
    if (!ok || !correspond(g.maintenant, famille, choix)) continue;
    if (g.differents && new Set([...acts.slice(-n), choix]).size !== n + 1) continue;
    if (g.ouverture && sc.ouverture <= 0) continue;
    if (g.provoque && !sc.provoque) continue;
    if (!meilleur || g.puissance > meilleur.puissance) meilleur = g;
  }
  return meilleur;
}
