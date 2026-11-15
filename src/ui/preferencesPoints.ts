// Ce que le joueur prépare pour ses points, par personnage : le brouillon en cours, le plan de progression, et l'option
// « appliquer mon plan automatiquement ». Rien de tout cela n'est une décision de jeu : seule la validation crée une
// action « points ». Un seul magasin, partagé par toutes les vues (modale, récit, fiche) : un point placé n'est jamais
// perdu, qu'on ferme la modale, change d'onglet ou recharge la page.

import { useSyncExternalStore } from 'react';
import type { GameState } from '../engine/types';
import type { Plan, Repartition } from '../engine/plan';

export interface PreferencesPoints {
  brouillon: Repartition;
  plan?: Plan;
  /** Désactivé par défaut : à chaque anniversaire, le plan est validé tout seul (et peut être annulé). */
  auto: boolean;
}

const VIDE: PreferencesPoints = { brouillon: {}, auto: false };
const PREFIXE = 'ninja-destiny:points:';

/** Un personnage, identifié de façon stable dans sa partie (une vie solo, ou l'un des deux de la campagne). */
export function clePerso(s: Pick<GameState, 'seed' | 'naissance' | 'creation'>): string {
  return `${s.seed}:${s.naissance}:${s.creation.prenom}`;
}

const abonnes = new Set<() => void>();
const cache = new Map<string, PreferencesPoints>();

export function lirePreferences(cle: string): PreferencesPoints {
  let e = cache.get(cle);
  if (!e) {
    try {
      const brut = typeof localStorage !== 'undefined' ? localStorage.getItem(PREFIXE + cle) : null;
      e = brut ? { ...VIDE, ...(JSON.parse(brut) as Partial<PreferencesPoints>) } : VIDE;
    } catch {
      e = VIDE;
    }
    cache.set(cle, e);
  }
  return e;
}

export function ecrirePreferences(cle: string, p: Partial<PreferencesPoints>): void {
  const e = { ...lirePreferences(cle), ...p };
  cache.set(cle, e);
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify(e));
  } catch {
    /* stockage indisponible : le brouillon vit en mémoire jusqu'au rechargement */
  }
  abonnes.forEach((f) => f());
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};

export function usePreferencesPoints(cle: string) {
  const p = useSyncExternalStore(
    abonner,
    () => lirePreferences(cle),
    () => VIDE,
  );
  return {
    ...p,
    setBrouillon: (brouillon: Repartition) => ecrirePreferences(cle, { brouillon }),
    vider: () => ecrirePreferences(cle, { brouillon: {} }),
    setPlan: (plan: Plan | undefined) => ecrirePreferences(cle, { plan }),
    setAuto: (auto: boolean) => ecrirePreferences(cle, { auto }),
  };
}
