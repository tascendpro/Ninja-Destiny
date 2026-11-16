// La mémoire des relations : les moments qui comptent, en faits structurés, jamais en phrases.
//
// Chaque relation (RelationState) garde déjà ses axes (confiance, respect…) et des souvenirs écrits (souvenirs: string[],
// des phrases à relire). La mémoire y ajoute des faits datés que le récit peut interroger :
//   « a-t-il déjà sauvé ma vie ? », « notre première dispute date de quand ? », « m'a-t-il vu perdre devant tout le monde ? »
//
// Ce qui s'enregistre tout seul : la première rencontre, les victoires et défaites en duel contre un personnage du jeu,
// les promesses faites, tenues ou rompues. Le reste (secret confié, sauvetage, trahison, sacrifice, entraînement…)
// est déclaré par les scènes qui le racontent (effet `memoire`, voir content/memoires.ts).
//
// Les étiquettes disent qui a fait quoi : « toi » (le joueur l'a fait), « lui » (le personnage l'a fait), et le détail
// (« kawarimi », « temoins »…). Rien ici ne tire au hasard.

import type { FaitRelation, GameState, TypeFait } from './types';
import { relationDe, resoudrePnj } from './etat';
import { age } from './calendrier';

/** Au-delà, les faits les moins importants et les plus anciens s'effacent : on ne retient pas tout. */
const MAX_FAITS = 40;

/** Note un fait dans la relation avec ce personnage (identifiant ou rôle). Le premier de son type est marqué comme tel. */
export function noterFait(s: GameState, ref: string, type: TypeFait, o: { importance?: 1 | 2 | 3; tags?: string[] } = {}): void {
  const id = resoudrePnj(s, ref);
  if (!id) return;
  const r = relationDe(s, id);
  const faits = (r.faits ??= []);
  const scene = s.scene.type === 'evenement' ? s.scene.id : s.scene.type === 'affrontement' ? s.scene.evenementId : undefined;
  // Un même moment ne s'inscrit qu'une fois (une scène peut porter l'effet et la conclusion de son combat).
  if (scene && faits.some((f) => f.type === type && f.jour === s.jour && f.scene === scene)) return;
  const fait: FaitRelation = { type, jour: s.jour, age: age(s), importance: o.importance ?? 2, ...(o.tags?.length ? { tags: o.tags } : {}), ...(scene ? { scene } : {}) };
  if (!faits.some((f) => f.type === type)) fait.premier = true;
  faits.push(fait);
  if (faits.length > MAX_FAITS) {
    // On oublie d'abord le moins important, et parmi eux le plus ancien ; jamais un « premier ».
    const i = faits.reduce((k, f, j) => (!f.premier && (k < 0 || f.importance < faits[k].importance || (f.importance === faits[k].importance && f.jour < faits[k].jour)) ? j : k), -1);
    if (i >= 0) faits.splice(i, 1);
  }
}

/** Un personnage croisé pour la première fois : on le note, et c'est le premier fait de votre histoire. */
export function rencontrer(s: GameState, id: string): void {
  const st = s.pnj[id];
  if (!st || st.rencontre) return;
  st.rencontre = true;
  noterFait(s, id, 'premiere_rencontre', { importance: 1 });
}

/** Les faits d'une relation qui répondent à la question (type, étiquette, premier du genre). Du plus récent au plus ancien. */
export function faits(s: GameState, ref: string, q: { type?: TypeFait | TypeFait[]; tag?: string; premier?: boolean } = {}): FaitRelation[] {
  const id = resoudrePnj(s, ref);
  const tous = (id && s.relations[id]?.faits) || [];
  const types = q.type === undefined ? undefined : Array.isArray(q.type) ? q.type : [q.type];
  return tous.filter((f) => (!types || types.includes(f.type)) && (!q.tag || f.tags?.includes(q.tag)) && (q.premier === undefined || !!f.premier === q.premier)).sort((a, b) => b.jour - a.jour);
}

const NOMBRES = ['zéro', 'un', 'deux', 'trois', 'quatre'];

/** Quand c'était, dit comme on le dirait : « l'an dernier », « il y a trois ans », « quand tu avais neuf ans ». */
export function quand(s: GameState, f: FaitRelation): string {
  const jours = s.jour - f.jour;
  const ans = Math.floor(jours / 360);
  if (ans <= 0) return jours < 90 ? 'il y a quelques semaines' : 'cette année';
  if (ans === 1) return 'l’an dernier';
  if (ans <= 4) return `il y a ${NOMBRES[ans]} ans`;
  return `quand tu avais ${f.age} ans`;
}

/** Le jeton {quand:@x:type} : quand a eu lieu le dernier fait de ce type avec ce personnage. */
export function jetonQuand(s: GameState, jeton: string): string | undefined {
  const m = /^quand:(@?[\w-]+):(\w+)$/.exec(jeton);
  if (!m) return undefined;
  const f = faits(s, m[1], { type: m[2] as TypeFait })[0];
  // Sans fait (une scène citée hors de son contexte), on reste vague plutôt que de mentir sur une date.
  return f ? quand(s, f) : 'un jour';
}

export const TYPES_FAITS: TypeFait[] = ['premiere_rencontre', 'entrainement', 'victoire', 'defaite', 'humiliation', 'dispute', 'secret', 'promesse', 'promesse_tenue', 'promesse_rompue', 'trahison', 'sauvetage', 'sacrifice', 'moment'];
