// Lecture des statistiques pour l'affichage : notes du « Databook » (0,5 à 5, total sur 40)
// et qualificatifs. Rien ici ne modifie l'état : ce sont des vues calculées.

import type { GameState } from '../engine/types';

const tier = (s: GameState, id: string) => s.maitrises[id]?.tier ?? 0;
const borne = (x: number) => Math.max(0, Math.min(100, x));
/** 0–100 → note de 0,5 à 5 par demi-points, comme dans les fiches officielles des ninjas. */
export const noteDatabook = (x: number) => Math.max(0.5, Math.min(5, Math.round((borne(x) / 20) * 2) / 2));

export interface LigneDatabook {
  id: string;
  nom: string;
  note: number;
  explication: string;
}

export function databook(s: GameState): { lignes: LigneDatabook[]; total: number } {
  const a = s.attributs;
  const lignes: LigneDatabook[] = [
    { id: 'nin', nom: 'Ninjutsu', note: noteDatabook(a.controleChakra * 0.5 + tier(s, 'ninjutsu') * 10), explication: 'Contrôle du chakra et palier de ninjutsu.' },
    { id: 'tai', nom: 'Taijutsu', note: noteDatabook(a.force * 0.25 + a.agilite * 0.25 + tier(s, 'taijutsu') * 10), explication: 'Force, agilité et palier de taijutsu.' },
    { id: 'gen', nom: 'Genjutsu', note: noteDatabook(a.intellect * 0.25 + a.controleChakra * 0.25 + tier(s, 'genjutsu') * 10), explication: 'Intelligence, contrôle du chakra et palier de genjutsu.' },
    { id: 'int', nom: 'Intelligence', note: noteDatabook(a.intellect), explication: 'Intelligence tactique.' },
    { id: 'for', nom: 'Force', note: noteDatabook(a.force), explication: 'Force physique.' },
    { id: 'vit', nom: 'Vitesse', note: noteDatabook(a.agilite), explication: 'Agilité et réflexes.' },
    { id: 'end', nom: 'Endurance', note: noteDatabook(s.jauges.chakraMax / 3), explication: 'Réserve de chakra.' },
    { id: 'mud', nom: 'Mudras', note: noteDatabook(a.controleChakra * 0.7 + a.agilite * 0.3), explication: 'Vitesse et précision des signes.' },
  ];
  return { lignes, total: lignes.reduce((t, l) => t + l.note, 0) };
}

/** Qualificatif d'une aptitude de 0 à 100. */
export function qualificatif(x: number): string {
  if (x < 20) return 'faible';
  if (x < 40) return 'ordinaire';
  if (x < 60) return 'solide';
  if (x < 80) return 'remarquable';
  return 'exceptionnel';
}

/** Niveau de gravité d'une jauge où « plus » est mauvais (fatigue, suspicion). */
export function gravite(x: number): 'ok' | 'alerte' | 'danger' {
  if (x >= 80) return 'danger';
  if (x >= 55) return 'alerte';
  return 'ok';
}

export const noteTexte = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 });
