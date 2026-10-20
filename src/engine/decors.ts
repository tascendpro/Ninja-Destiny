// Le décor d'une scène : celui de l'événement s'il en précise un, sinon celui de son lieu.
// L'interface essaie les images dans l'ordre et n'affiche rien si aucune n'existe encore.

import type { GameState } from './types';
import { R } from './registre';
import { evaluer } from './conditions';
import { resoudreLieu } from './selection';

export interface VueDecor {
  id: string;
  nom: string;
  /** Images candidates, de la plus précise à la plus générale. */
  images: string[];
}

export function decorScene(s: GameState, evenementId?: string, lieu?: string): VueDecor | undefined {
  const ev = evenementId ? R.evenements[evenementId] : undefined;
  const lieuId = resoudreLieu(s, lieu ?? ev?.lieu ?? '$village');
  const ids = [ev?.decor ?? (ev ? R.contenu.decorsEvenements[ev.id] : undefined), R.contenu.decorsLieux[lieuId]].filter((x): x is string => !!x);
  const decors = ids
    .map((id) => R.contenu.decors.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => !!d && (!d.acces || evaluer(d.acces, s)));
  if (!decors.length) return undefined;
  return { id: decors[0].id, nom: decors[0].nom, images: Array.from(new Set(decors.map((d) => d.image))) };
}
