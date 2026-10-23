// Où tombe le corps, ce que fait la technique selon la distance, et ce qu'elle finit par faire à la troisième fois.
// Le choix d'une ligne ne consomme aucun hasard du jeu : il vient d'un tirage dérivé de l'état (graine, actions, clé).

import type { GameState } from '../types';
import { R } from '../registre';
import { resoudreLieu } from '../selection';
import { CHUTES, CHUTES_JOUEUR, IMPACTS, IMPACTS_JOUEUR, TERRAIN_DE_SCENE, TEXTES_GROUPE, TEXTES_TECHNIQUES } from '../../content/combat/impacts';
import type { Terrain, TexteTechnique } from '../../content/combat/impacts';
import { TEXTES_TECHNIQUES_CLANS } from '../../content/combat/impactsClans';

export type Distance = 'loin' | 'proche';
export type Force = 'leger' | 'lourd';

/** Un tirage dans [0, 1) qui ne dépend que de l'état et de la clé : rejouer donne la même ligne. */
export function tirageTexte(s: GameState, cle: string): number {
  let h = 2166136261 ^ s.seed;
  for (const c of `${s.actions.length}:${cle}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

function piocher(l: string[], t: number): string {
  return l.length ? l[Math.min(l.length - 1, Math.floor(t * l.length))] : '';
}

/** Le terrain du combat, d'après le lieu de la scène en cours. */
export function terrainCourant(s: GameState): Terrain {
  const id = typeof s.drapeaux['lieu_scene'] === 'string' ? (s.drapeaux['lieu_scene'] as string) : resoudreLieu(s, '$village');
  const scene = (R.lieux[id] ?? R.lieux[s.creation.village])?.scene ?? 'terrain';
  const [premier, second] = scene.split(':');
  return TERRAIN_DE_SCENE[premier] ?? (second ? TERRAIN_DE_SCENE[second] : undefined) ?? 'terrain';
}

/** Ce que devient le corps touché, selon le lieu : les chutes du lieu se mêlent à celles de partout. */
export function texteImpact(s: GameState, force: Force | 'groupe', cle: string): string {
  const lieu = IMPACTS[terrainCourant(s)];
  const t = tirageTexte(s, `impact:${cle}`);
  if (force === 'groupe') return piocher([...lieu.groupe, ...CHUTES.groupe], t);
  // Un coup lourd se raconte surtout par le décor (l'arbre, le mur) ; un coup léger, surtout par la chute.
  const pool = force === 'lourd' ? [...lieu.lourd, ...lieu.lourd, ...CHUTES.lourd] : [...CHUTES.leger, ...lieu.leger];
  return piocher(pool, t);
}

/** Le groupe d'une technique pour ses textes : nature, sinon famille, sinon ninjutsu. */
function groupeTextes(techId: string): string {
  const def = R.maitrises[techId];
  const el = def?.element ?? def?.technique?.elements?.[0];
  if (el && TEXTES_GROUPE[el]) return el;
  const cat = def?.technique?.categorie;
  if (cat && TEXTES_GROUPE[cat]) return cat;
  return 'ninjutsu';
}

function lignes(techId: string, champ: keyof TexteTechnique): string[] {
  return TEXTES_TECHNIQUES[techId]?.[champ] ?? TEXTES_TECHNIQUES_CLANS[techId]?.[champ] ?? TEXTES_GROUPE[groupeTextes(techId)]?.[champ] ?? TEXTES_GROUPE.ninjutsu[champ] ?? [];
}

/** Ce que fait la technique quand elle touche, de loin ou au corps à corps. */
export function texteTechniqueTouche(s: GameState, techId: string, distance: Distance, cle: string): string {
  const propre = lignes(techId, distance);
  const repli = distance === 'proche' ? lignes(techId, 'loin') : lignes(techId, 'proche');
  return piocher(propre.length ? propre : repli, tirageTexte(s, `tech:${techId}:${cle}`));
}

/** La troisième fois, dans un combat où l'on peut tuer : ce que la technique finit par faire à un corps. */
export function texteSombre(s: GameState, techId: string, cle: string): string {
  return piocher(lignes(techId, 'sombre'), tirageTexte(s, `sombre:${techId}:${cle}`));
}

/** La distance après une action : le contact rapproche, l'esquive et la fuite éloignent. */
export function distanceApres(avant: Distance | undefined, action: 'contact' | 'eloigne' | 'neutre'): Distance {
  if (action === 'contact') return 'proche';
  if (action === 'eloigne') return 'loin';
  return avant ?? 'loin';
}

/** Une technique qui se joue au contact (taijutsu, poings chargés, lames d'os) rapproche toujours. */
export function techniqueAuContact(techId: string | undefined): boolean {
  if (!techId) return true;
  const cat = R.maitrises[techId]?.technique?.categorie;
  return cat === 'taijutsu' || cat === 'medical' || ['raiton_chidori', 'raiton_tonnerre', 'rasengan', 'sennin_rasengan', 'paume_vide'].includes(techId);
}

/** Quand c'est toi qui encaisses : un coup lourd te projette contre le décor du lieu. */
export function texteImpactJoueur(s: GameState, force: Force, cle: string): string {
  const t = tirageTexte(s, `joueur:${cle}`);
  const lieu = IMPACTS_JOUEUR[terrainCourant(s)] ?? [];
  return piocher(force === 'lourd' ? [...lieu, ...lieu, ...CHUTES_JOUEUR.lourd] : CHUTES_JOUEUR.leger, t);
}
