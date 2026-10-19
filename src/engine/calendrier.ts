import type { GameState, Saison } from './types';

export const JOURS_AN = 360;
export const JOURS_MOIS = 30;
export const SAISONS: Saison[] = ['printemps', 'ete', 'automne', 'hiver'];
export const NOMS_SAISON: Record<Saison, string> = {
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  hiver: 'Hiver',
};

export function ageA(naissance: number, jour: number): number {
  return Math.floor((jour - naissance) / JOURS_AN);
}

export function age(state: GameState): number {
  return ageA(state.naissance, state.jour);
}

export function anneeDe(jour: number): number {
  return Math.floor(jour / JOURS_AN);
}

export function moisDe(jour: number): number {
  return Math.floor((((jour % JOURS_AN) + JOURS_AN) % JOURS_AN) / JOURS_MOIS);
}

export function saisonDe(jour: number): Saison {
  return SAISONS[Math.floor(moisDe(jour) / 3)];
}

export function libellePeriode(state: GameState): string {
  return `${NOMS_SAISON[saisonDe(state.jour)]} de l’an ${anneeDe(state.jour)}, ${age(state)} ans`;
}

export function libelleSaison(state: GameState): string {
  return `${NOMS_SAISON[saisonDe(state.jour)]} de l’an ${anneeDe(state.jour)}`;
}

export function libelleDuree(jours: number): string {
  if (jours <= 0) return 'un instant';
  if (jours === 1) return 'une journée';
  if (jours < 7) return `${jours} jours`;
  if (jours < 21) return `${Math.round(jours / 7)} semaine${Math.round(jours / 7) > 1 ? 's' : ''}`;
  if (jours < 75) return `${Math.max(1, Math.round(jours / 30))} mois`;
  if (jours < JOURS_AN) return jours >= 85 && jours <= 95 ? 'une saison' : `${Math.round(jours / 30)} mois`;
  const ans = Math.round(jours / JOURS_AN);
  return ans === 1 ? 'un an' : `${ans} ans`;
}
