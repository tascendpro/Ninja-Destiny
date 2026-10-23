import { R } from './registre';
import { RANGS } from './types';
import type { Changement, GameState, NpcDef, Rang, RelationState, StatPath } from './types';
import { age } from './calendrier';

export interface Ctx {
  changements: Changement[];
}

export function nouveauCtx(): Ctx {
  return { changements: [] };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function cloner<T>(x: T): T {
  return structuredClone(x);
}

export function bornes(state: GameState, chemin: StatPath): [number, number] {
  const [groupe, cle] = chemin.split('.') as [string, string];
  if (groupe === 'ethique') return [-100, 100];
  if (groupe === 'jauges') {
    if (cle === 'ryo' || cle === 'experience') return [0, 10_000_000];
    if (cle === 'chakraMax') return [10, 400];
    if (cle === 'chakra') return [0, state.jauges.chakraMax];
    return [0, 100];
  }
  return [0, 100];
}

export function lireStat(state: GameState, chemin: StatPath): number {
  const [groupe, cle] = chemin.split('.') as [keyof GameState, string];
  const g = state[groupe] as unknown as Record<string, number>;
  return g[cle] ?? 0;
}

export function ecrireStat(state: GameState, chemin: StatPath, valeur: number): number {
  const [groupe, cle] = chemin.split('.') as [keyof GameState, string];
  const g = state[groupe] as unknown as Record<string, number>;
  const [min, max] = bornes(state, chemin);
  const avant = g[cle] ?? 0;
  g[cle] = Math.round(clamp(valeur, min, max) * 10) / 10;
  return g[cle] - avant;
}

/** Résout « @role » en identifiant de PNJ ; renvoie l'identifiant tel quel sinon. */
export function resoudrePnj(state: GameState, ref: string): string | undefined {
  if (ref.startsWith('@')) return state.roles[ref.slice(1)];
  return ref;
}

export function defPnj(state: GameState, id: string | undefined): NpcDef | undefined {
  if (!id) return undefined;
  return state.pnjGeneres[id] ?? R.pnj[id];
}

export function nomPnj(state: GameState, ref: string): string {
  const id = resoudrePnj(state, ref);
  return defPnj(state, id)?.nom ?? 'quelqu’un';
}

export function relationVide(): RelationState {
  return { confiance: 0, respect: 0, amitie: 0, rivalite: 0, hostilite: 0, attachement: 0, peur: 0, dette: 0, rompue: false, souvenirs: [] };
}

export function relationDe(state: GameState, id: string): RelationState {
  if (!state.relations[id]) state.relations[id] = relationVide();
  return state.relations[id];
}

export function ajouterJournal(state: GameState, texte: string, importance: 1 | 2 | 3 = 1): void {
  state.journal.push({ jour: state.jour, texte, importance });
}

export function lireDrapeau(state: GameState, cle: string): string | number | boolean | undefined {
  return state.drapeaux[cle];
}

export function drapeauVrai(state: GameState, cle: string): boolean {
  const v = state.drapeaux[cle];
  return v !== undefined && v !== false && v !== 0 && v !== '';
}

export function rangIndex(r: Rang | string): number {
  return RANGS.indexOf(r as Rang);
}

export function ageJoueur(state: GameState): number {
  return age(state);
}

export function decouvrir(state: GameState, id: string): void {
  if (!state.decouvertes.includes(id)) state.decouvertes.push(id);
}

/** Prodige : tiré à la naissance par le moteur, jamais choisi. */
export function estProdige(state: GameState): boolean {
  return state.tirages?.prodige === true;
}

export function estOrphelin(state: GameState): boolean {
  return state.creation.clan === 'sans_clan' && state.creation.origine === 'orphelin';
}

/** Seuls les clans portent un nom de famille ; un sans-clan n'a que son prénom. */
export function nomDeFamille(clan: string): string {
  return clan === 'sans_clan' ? '' : (R.clans[clan]?.nom ?? '');
}

export function nomComplet(state: GameState): string {
  return [state.creation.prenom, state.creation.nom].filter(Boolean).join(' ');
}
