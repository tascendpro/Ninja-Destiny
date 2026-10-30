// Les outils communs de la campagne : jetons des textes, mouvements du lien, souvenirs, faits, calendrier.
// Aucun hasard ici : quand la campagne doit trancher hors d'une vie (une fuite, une enquête), elle tire d'un hachage.

import type { GameState, Presentation } from '../types';
import { R } from '../registre';
import { JOURS_AN } from '../calendrier';
import { defPnj } from '../etat';
import type { AxeLien, Campagne, Fait, IdJoueur, SouvenirCommun, Tonalite } from './types';

export const autre = (j: IdJoueur): IdJoueur => (1 - j) as IdJoueur;
export const borne = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
export const ageA = (s: GameState, jour = s.jour) => Math.floor((jour - s.naissance) / JOURS_AN);
/** Le jour du monde : celui du plus avancé des deux (ce qui arrive maintenant arrive pour les deux). */
export const jourMonde = (c: Campagne) => Math.max(c.joueurs[0].jour, c.joueurs[1].jour);
/** Une vie terminée ne joue plus. La fin d'un chapitre qui a une suite n'est qu'une pause : la vie continue. */
export const finie = (s: GameState) => s.statut === 'mort' || (!!s.fin && !(R.fins[s.fin.id]?.suite && R.evenements[R.fins[s.fin.id].suite!]));

/** Un tirage dans [0, 1) qui ne dépend que de la campagne et d'une clé : rejouer donne le même résultat. */
export function hash01(c: Campagne, cle: string): number {
  let h = 2166136261 ^ c.graine;
  for (const ch of cle) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

/** La graine d'un flux de hasard (« campagne », « combat:… ») : la graine de campagne et le nom du flux, hachés ensemble. */
export function graineFlux(c: Campagne, nom: string): number {
  return (Math.floor(hash01(c, `flux:${nom}`) * 0x7fffffff) ^ c.graine) >>> 0 || 1;
}

/** Fait bouger ce qu'un joueur ressent pour l'autre. */
export function bouger(c: Campagne, j: IdJoueur, d?: Partial<Record<AxeLien, number>>): void {
  for (const [k, v] of Object.entries(d ?? {})) c.lien.axes[j][k as AxeLien] = borne(c.lien.axes[j][k as AxeLien] + (v ?? 0));
}

export function souvenir(c: Campagne, id: string, texte: string, poids: SouvenirCommun['poids'], tonalite: Tonalite, connuDe: IdJoueur[] = [0, 1]): void {
  c.lien.souvenirs.push({ id, jour: jourMonde(c), texte, poids, tonalite, connuDe });
}

export function fait(c: Campagne, f: Omit<Fait, 'jour'>): void {
  const existant = c.faits.find((x) => x.id === f.id);
  if (existant) Object.assign(existant, f, { preuves: Math.max(existant.preuves, f.preuves) });
  else c.faits.push({ ...f, jour: jourMonde(c) });
}

export const connait = (c: Campagne, id: string, qui: IdJoueur | string) => !!c.faits.find((f) => f.id === id)?.connus.includes(qui);

export function noter(c: Campagne, j: IdJoueur, texte: string): void {
  c.notes[j].push(texte);
}

/** Le nom d'un proche dans la vie d'un joueur (« parent », « aine », « sensei »…). */
export function proche(c: Campagne, j: IdJoueur, role: string): string {
  const s = c.joueurs[j];
  return defPnj(s, s.roles[role])?.nom ?? 'quelqu’un';
}

const pronoms: Record<Presentation, { il: string; e: string; le: string; lui: string }> = {
  masculin: { il: 'il', e: '', le: 'le', lui: 'lui' },
  feminin: { il: 'elle', e: 'e', le: 'la', lui: 'elle' },
  neutre: { il: 'iel', e: '·e', le: 'læ', lui: 'iel' },
};

/**
 * Les jetons des textes de campagne :
 * {j1} {j2} {un} {deux} {moi} {autre} (prénoms), {il:x} {Il:x} {e:x} {le:x} {lui:x} (accords de chacun),
 * {parent} {parent2} {aine} (la famille, celle de J1 et celle de J2), {kage}, {village}.
 */
export function texteCommun(c: Campagne, brut: string, un: IdJoueur = 0, moi: IdJoueur = un): string {
  return sansJeton(resoudreJetons(c, brut, un, moi));
}

/**
 * Le dernier rempart : un texte qui contient encore un jeton n'est jamais rendu tel quel.
 * En test, c'est une erreur (le contenu doit être corrigé) ; en jeu, le jeton disparaît plutôt que de s'afficher.
 */
export function sansJeton(t: string): string {
  if (!/\{[^{}\s]+\}/.test(t)) return t;
  if (typeof process !== 'undefined' && process.env?.VITEST) throw new Error(`Jeton non résolu : ${t.match(/\{[^{}\s]+\}/)![0]} dans « ${t.slice(0, 80)} »`);
  return t.replace(/\{[^{}\s]+\}/g, '');
}

function resoudreJetons(c: Campagne, brut: string, un: IdJoueur, moi: IdJoueur): string {
  const qui: Record<string, IdJoueur> = { j1: 0, j2: 1, un, deux: autre(un), moi, autre: autre(moi) };
  const village = R.villages[c.creations[moi].village];
  return brut.replace(/\{([^{}]+)\}/g, (m, jeton: string) => {
    if (qui[jeton] !== undefined) return c.creations[qui[jeton]].prenom;
    const g = /^(il|Il|e|le|lui):(j1|j2|un|deux|moi|autre)$/.exec(jeton);
    if (g) {
      const p = pronoms[c.creations[qui[g[2]]].presentation];
      if (g[1] === 'Il') return p.il.charAt(0).toUpperCase() + p.il.slice(1);
      return p[g[1] as 'il' | 'e' | 'le' | 'lui'];
    }
    const gp = /^(il|Il|e|le|lui):(parent|aine)$/.exec(jeton);
    if (gp) {
      const s0 = c.joueurs[0];
      const f = defPnj(s0, s0.roles[gp[2]])?.genre === 'f';
      const t = { il: f ? 'elle' : 'il', Il: f ? 'Elle' : 'Il', e: f ? 'e' : '', le: f ? 'la' : 'le', lui: f ? 'elle' : 'lui' };
      return t[gp[1] as keyof typeof t];
    }
    if (jeton === 'parent') return proche(c, 0, 'parent');
    if (jeton === 'parent2') return proche(c, 1, 'parent');
    if (jeton === 'aine') return proche(c, 0, 'aine');
    if (jeton === 'kage') return village?.kage ?? 'Kage';
    if (jeton === 'village') return village?.nom ?? '';
    return m;
  });
}

/**
 * Décale toute une vie dans le calendrier (un héritier qui entre en scène des années après le début) :
 * chaque date de la fiche avance d'autant, rien d'autre ne change.
 */
export function decaler(s: GameState, delta: number): void {
  if (!delta) return;
  s.jour += delta;
  s.naissance += delta;
  for (const p of Object.values(s.pnj)) {
    p.naissance += delta;
    if (p.gueriLe !== undefined) p.gueriLe += delta;
  }
  for (const p of s.planifies) p.jour += delta;
  for (const m of Object.values(s.maitrises)) {
    if (m.awakenedAtDay !== undefined) m.awakenedAtDay += delta;
    if (m.palierDepuis !== undefined) m.palierDepuis += delta;
    if (m.lastUsedDay !== undefined) m.lastUsedDay += delta;
  }
  for (const v of Object.values(s.evenementsVus)) v.dernier += delta;
  for (const e of s.journal) e.jour += delta;
  for (const h of s.historique) h.jour += delta;
  for (const b of s.blessures) b.guerison += delta;
}

/** Prévoit une scène commune (deuil, révélation, seuil du lien) : elle s'ouvrira quand les deux seront là. */
export function planifierCommune(c: Campagne, id: string, dans = 0): void {
  if (c.vues.includes(id) || c.barrieres.some((b) => b.id === id)) return;
  c.barrieres.push({ id, jour: jourMonde(c) + dans });
  c.barrieres.sort((a, b) => (a.introduction ? -1 : b.introduction ? 1 : a.jour - b.jour));
}

/** Prévoit une scène privée pour un seul joueur : l'autre n'en saura rien. */
export function planifierPrivee(c: Campagne, j: IdJoueur, id: string, dans = 0): void {
  if (c.vues.includes(id) || c.privees[j].some((b) => b.id === id)) return;
  c.privees[j].push({ id, jour: c.joueurs[j].jour + dans });
}

/** Une confiance trahie : les promesses de fidélité sont rompues, et les souvenirs chauds deviennent amers. */
export function rompre(c: Campagne): void {
  for (const p of c.lien.promesses) if (['jamais_seul', 'ne_jamais_abandonner', 'toit'].includes(p.id) && p.etat === 'en_cours') p.etat = 'rompue';
  for (const sv of c.lien.souvenirs) if (sv.tonalite === 'chaud' && sv.poids >= 4) sv.tonalite = 'amer';
}
