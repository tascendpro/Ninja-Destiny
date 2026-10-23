// Relancer la même technique dans un combat (§11.2, §11.3) : le récit change, l'adversaire le remarque.
// Partagé par l'Affrontement Racine et par l'ancien combat en manches (jusqu'à la migration de chaque scène).

import { R } from '../registre';

/** La clé de récit d'une technique : sa nature de chakra, sinon sa famille, sinon le ninjutsu. Une action sans technique est du taijutsu. */
export function cleRepetition(techId: string): string {
  const reps = R.contenu.racine.repetitions;
  const def = R.maitrises[techId];
  if (!def?.technique) return 'taijutsu';
  if (def.element && reps[def.element]) return def.element;
  const cat = def.technique.categorie;
  return reps[cat] ? cat : 'ninjutsu';
}

/**
 * Le récit et la réaction quand une technique a déjà servi `deja` fois dans ce combat (rien la première fois).
 * `index` choisit la variante sans consommer de hasard : il vient de l'état du combat (manche, compteurs).
 */
export function texteRepetition(techId: string, nomTech: string, deja: number, index: number): { recit: string; reaction: string } | undefined {
  if (deja < 1) return undefined;
  const palier = deja === 1 ? 'deux' : 'trois';
  const lignes = R.contenu.racine.repetitions[cleRepetition(techId)][palier];
  const reactions = R.contenu.racine.reactionsRepetition[palier];
  return {
    recit: lignes[index % lignes.length].replace(/\{tech\}/g, nomTech),
    reaction: reactions[(index + deja) % reactions.length],
  };
}
