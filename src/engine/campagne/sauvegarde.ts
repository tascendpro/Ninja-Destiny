// La sauvegarde portable d'une campagne à deux (un seul téléphone, qu'on se passe) : les deux fiches, le lien, la
// graine et le journal des actions. Elle se rejoue entièrement, action par action, avec la même validation qu'en jeu.

import type { Creation } from '../types';
import type { ActionCampagne, Campagne } from './types';
import { nouvelleCampagne, parametresLien, soumettre } from './moteur';

export interface Export {
  format: 1;
  creations: [Creation, Creation];
  lien: Parameters<typeof nouvelleCampagne>[2];
  graine: number;
  actions: ActionCampagne[];
}

export function exporter(c: Campagne): Export {
  return { format: 1, creations: c.creations, lien: parametresLien(c), graine: c.graine, actions: c.actions };
}

/** Une sauvegarde retouchée échoue au lieu de produire un état impossible. */
export function importer(e: Export): Campagne {
  if (e.format !== 1) throw new Error('Format de sauvegarde inconnu.');
  let c = nouvelleCampagne(e.creations[0], e.creations[1], e.lien, e.graine);
  for (const x of e.actions) c = soumettre(c, x);
  return c;
}
