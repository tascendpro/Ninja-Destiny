// Les proches : ce qu'ils sont pour toi (leur posture) et ce dont ils se souviennent (leur mémoire).
//
// Les relations (amitié, confiance, hostilité…) bougent à chaque scène, mais un texte n'a pas à manipuler huit axes :
// il demande une posture (« le rival est-il devenu un complice ? », « le parent est-il fier ou inquiet ? ») et cite une
// mémoire (le compte des duels, le dernier souvenir partagé, l'habitude que l'aîné·e te reproche, le conseil du mentor).
//
// Les règles d'écriture que ces postures servent :
//   Aîné·e    connaît tes habitudes, te taquine, te protège, peut être sévère ; sa fierté ne se dit pas en face.
//             Jamais de formule de rencontre : vous avez grandi sous le même toit.
//   Parent    a une histoire, se souvient de ce qui compte, réagit à ta progression : fier, inquiet, distant ou protecteur.
//   Rival     se souvient des victoires et des défaites, provoque sur des faits précis, change selon les résultats.
//   Ami·e     cite vos souvenirs, plaisante, soutient, peut être déçu·e.
//   Mentor    se souvient de l'entraînement, reconnaît les progrès, corrige les mauvaises habitudes, ne répète pas un conseil.
//
// Rien ici ne tire au hasard : postures et mémoires se lisent dans l'état.

import type { AttributId, GameState, RelationState } from './types';
import { ATTRIBUTS } from './types';
import { defPnj, resoudrePnj } from './etat';

export type Role = 'aine' | 'parent' | 'rival' | 'ami' | 'sensei';
const REF: Record<Role, string> = { aine: '@aine', parent: '@parent', rival: '@rival', ami: '@coequipierA', sensei: '@sensei' };

export const POSTURES: Record<Role, readonly string[]> = {
  aine: ['complice', 'protecteur', 'severe', 'jaloux', 'distant'],
  parent: ['fier', 'inquiet', 'protecteur', 'distant'],
  rival: ['rival', 'respect', 'complice', 'ennemi'],
  ami: ['ami', 'proche', 'decu', 'distant'],
  sensei: ['exigeant', 'confiance', 'decu'],
};

function relation(s: GameState, role: Role): RelationState | undefined {
  const id = resoudrePnj(s, REF[role]);
  return id ? s.relations[id] : undefined;
}

const promesseRompue = (s: GameState, role: Role) => {
  const id = resoudrePnj(s, REF[role]);
  return s.promesses.some((p) => p.etat === 'rompue' && (p.pnj === REF[role] || p.pnj === id));
};

/**
 * Ce que ce proche est pour toi, maintenant. L'ordre des tests compte : une relation rompue l'emporte sur tout,
 * l'inquiétude d'un parent sur sa fierté (on s'inquiète d'abord, on est fier ensuite).
 */
export function posture(s: GameState, role: Role): string {
  const r = relation(s, role);
  if (!r) return POSTURES[role][role === 'parent' || role === 'aine' ? 2 : 0];
  switch (role) {
    case 'aine':
      if (r.rompue || (r.amitie < 20 && r.attachement < 30)) return 'distant';
      if (r.rivalite >= 30) return 'jaloux';
      if (r.amitie >= 55 && r.confiance >= 50) return 'complice';
      if (r.attachement >= 50 && r.respect < 35) return 'severe';
      return 'protecteur';
    case 'parent':
      if (r.rompue || r.confiance < 30 || r.attachement < 30) return 'distant';
      if (s.blessures.some((b) => b.gravite >= 2) || s.jauges.sante < 50) return 'inquiet';
      if (r.respect >= 55 || (['chunin', 'jonin', 'kage'].includes(s.rang) && r.confiance >= 50)) return 'fier';
      return 'protecteur';
    case 'rival':
      if (r.rompue || r.hostilite >= 40) return 'ennemi';
      if (r.amitie >= 40 && r.hostilite < 20) return 'complice';
      if (r.respect >= 35) return 'respect';
      return 'rival';
    case 'ami':
      if (r.rompue || r.confiance < 25 || promesseRompue(s, role)) return 'decu';
      if (r.amitie >= 45 && r.confiance >= 40) return 'proche';
      if (r.amitie < 20) return 'distant';
      return 'ami';
    case 'sensei':
      if (r.rompue || (r.confiance < 15 && r.respect < 10 && r.hostilite > 10)) return 'decu';
      if (r.confiance >= 35 && r.respect >= 25) return 'confiance';
      return 'exigeant';
  }
}

// ── Le rival : le compte ─────────────────────────────────────

/** Les duels contre le rival : ce que son registre de combat a gardé (ses victoires sont tes défaites). */
export function bilanRival(s: GameState): { toi: number; lui: number; nuls: number; derniere?: 'gagne' | 'perdu' | 'nul' } {
  const id = resoudrePnj(s, '@rival');
  const reg = id ? s.registresCombat[id] : undefined;
  if (!reg) return { toi: 0, lui: 0, nuls: 0 };
  const d = reg.derniereIssue;
  const derniere = !d ? undefined : ['victoire', 'departage_gagne', 'reddition_adverse', 'fuite_adverse'].includes(d) ? 'gagne' : ['defaite', 'departage_perdu', 'fuite'].includes(d) ? 'perdu' : 'nul';
  return { toi: reg.defaites, lui: reg.victoires, nuls: reg.nuls, derniere };
}

/** Qui mène : « devant », « derriere », « egal » ou « aucun » (jamais affrontés pour de vrai). */
export function positionRival(s: GameState): 'devant' | 'derriere' | 'egal' | 'aucun' {
  const b = bilanRival(s);
  if (b.toi + b.lui + b.nuls === 0) return 'aucun';
  return b.toi > b.lui ? 'devant' : b.toi < b.lui ? 'derriere' : 'egal';
}

const NOMBRES = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const nombre = (n: number) => NOMBRES[n] ?? String(n);

/** « trois victoires à deux, pour toi » : le compte, dit comme un rival le dirait. */
function texteBilan(s: GameState): string {
  const b = bilanRival(s);
  if (b.toi + b.lui === 0) return b.nuls ? `${nombre(b.nuls)} match${b.nuls > 1 ? 's' : ''} nul${b.nuls > 1 ? 's' : ''}, et rien d’autre` : 'aucun vrai combat';
  if (b.toi === b.lui) return `${nombre(b.toi)} partout`;
  const [h, l] = b.toi > b.lui ? [b.toi, b.lui] : [b.lui, b.toi];
  return `${nombre(h)} victoire${h > 1 ? 's' : ''} à ${nombre(l)}, pour ${b.toi > b.lui ? 'toi' : defPnj(s, resoudrePnj(s, '@rival'))?.genre === 'f' ? 'elle' : 'lui'}`;
}

// ── L'aîné·e : tes habitudes ─────────────────────────────────

/** Ce que tu fais de ton temps libre, compté par le moteur à chaque période choisie. */
export function noterHabitude(s: GameState, id: string): void {
  const [type, cible] = id.split(':');
  const cle = type === 'entrainer' && cible === 'taijutsu' ? 'taijutsu' : type === 'entrainer' && cible?.startsWith('famille_') ? 'armes' : type;
  s.drapeaux[`habitude:${cle}`] = (Number(s.drapeaux[`habitude:${cle}`]) || 0) + 1;
}

const HABITUDES: Record<string, string> = {
  taijutsu: 'frapper le poteau du terrain jusqu’à la nuit',
  armes: 'lancer des kunai sur la même souche, toujours la même',
  entrainer: 't’entraîner seul·e, au même endroit, à la même heure',
  nature: 'répéter les mêmes signes jusqu’à ne plus sentir tes doigts',
  technique: 'répéter les mêmes signes jusqu’à ne plus sentir tes doigts',
  duo: 't’entraîner à deux, jamais seul·e',
  repos: 'dormir plus longtemps que tout le monde',
  famille: 'traîner à la maison',
  social: 'passer tes journées avec les autres plutôt qu’au terrain',
  travail: 'courir après les petits boulots',
  etudier: 'avoir le nez dans les rouleaux de la bibliothèque',
  metier: 'travailler plus que tu ne t’entraînes',
  explorer: 'disparaître des journées entières sans dire où',
  enqueter: 'fouiller dans des histoires qui ne te regardent pas',
  route: 'marcher sur les routes',
};

/** L'habitude la plus ancrée (au moins trois périodes), ou rien si tu n'en as pas encore. */
export function habitude(s: GameState): string | undefined {
  let meilleur: [string, number] | undefined;
  for (const [k, v] of Object.entries(s.drapeaux)) {
    if (!k.startsWith('habitude:')) continue;
    const n = Number(v) || 0;
    if (n >= 3 && (!meilleur || n > meilleur[1] || (n === meilleur[1] && k < meilleur[0]))) meilleur = [k.slice(9), n];
  }
  return meilleur ? HABITUDES[meilleur[0]] : undefined;
}

// ── Le mentor : la revue, sans jamais répéter un conseil ─────

const NOM_ATTRIBUT: Record<AttributId, string> = {
  force: 'ta force',
  agilite: 'ta vitesse',
  controleChakra: 'ton contrôle du chakra',
  perception: 'ton regard',
  intellect: 'ta tête',
  controleEmotionnel: 'ton sang-froid',
  charisme: 'ta façon de parler aux gens',
  discretion: 'ta discrétion',
} as Record<AttributId, string>;

/** Ton geste d'ouverture le plus fréquent en combat, tous adversaires confondus (ce que les registres ont relevé). */
function ouvertureFavorite(s: GameState): { action: string; n: number } | undefined {
  const t: Record<string, number> = {};
  for (const reg of Object.values(s.registresCombat)) for (const [k, n] of Object.entries(reg.habitudesDuJoueur)) if (k.startsWith('ouverture:')) t[k.slice(10)] = (t[k.slice(10)] ?? 0) + n;
  const [action, n] = Object.entries(t).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
  return action ? { action, n: n! } : undefined;
}

interface Conseil {
  id: string;
  /** Le conseil ne vaut que si l'habitude ou la faiblesse est là. */
  si: (s: GameState) => boolean;
  texte: string;
}

const plusFaible = (s: GameState) => [...ATTRIBUTS].filter((a) => NOM_ATTRIBUT[a]).sort((a, b) => s.attributs[a] - s.attributs[b] || a.localeCompare(b))[0];
const ouvre = (action: string) => (s: GameState) => {
  const o = ouvertureFavorite(s);
  return !!o && o.n >= 3 && o.action === action;
};

/** Les conseils, du plus précis (une habitude relevée en combat) au plus général (ta plus grande faiblesse). */
const CONSEILS: Conseil[] = [
  { id: 'ouvre_lourd', si: ouvre('coup_puissant'), texte: '« Tu ouvres toujours par ton coup le plus lourd. Tout le monde le voit partir de tes épaules. Commence petit. Le gros coup, c’est pour quand l’autre a baissé la garde. »' },
  { id: 'ouvre_vite', si: ouvre('frappe_rapide'), texte: '« Toujours la même frappe rapide pour commencer. Un adversaire qui t’a vu deux fois l’attend déjà. Une fois sur trois, commence par ne rien faire. Regarde. »' },
  { id: 'ouvre_garde', si: ouvre('garde'), texte: '« Tu te mets en garde avant même de savoir s’il attaque. On ne gagne pas un combat en le subissant. Une fois sur deux, c’est toi qui dois poser la question. »' },
  { id: 'ouvre_observer', si: ouvre('observer'), texte: '« Tu observes, tu observes… Un jour, celui que tu observes ne te laissera pas finir. Une manche pour lire, pas trois. »' },
  {
    id: 'ouvre_technique',
    si: (s) => {
      const o = ouvertureFavorite(s);
      return !!o && o.n >= 3 && !['coup_puissant', 'frappe_rapide', 'garde', 'observer', 'balayage', 'feinte'].includes(o.action);
    },
    texte: '« Ta technique préférée, tu la sors en premier, à chaque fois. Ceux qui t’ont déjà affronté·e la connaissent par cœur. Garde-la pour la fin. Une technique qu’on n’a pas vue vaut deux fois plus. »',
  },
  { id: 'jamais_observer', si: (s) => Object.values(s.registresCombat).reduce((n, r) => n + r.rencontres, 0) >= 4 && !ouvertureFavorite(s)?.action.startsWith('observ'), texte: '« Tu frappes avant de regarder. Ça marche contre ceux qui sont plus faibles que toi. Le jour où ce ne sera pas le cas, une manche à observer te sauvera la vie. »' },
  { id: 'faible_controleEmotionnel', si: (s) => plusFaible(s) === 'controleEmotionnel', texte: '« Quand ça tourne mal, tu t’emballes. Je l’ai vu à l’entraînement, je l’ai vu en mission. Compte tes respirations. Quatre. Ça a l’air idiot. Fais-le quand même. »' },
  { id: 'faible_perception', si: (s) => plusFaible(s) === 'perception', texte: '« Tu regardes ce que l’autre fait. Regarde ce qu’il s’apprête à faire : les épaules, les pieds, le souffle. Tout le reste ment. »' },
  { id: 'faible_force', si: (s) => plusFaible(s) === 'force', texte: '« Tes coups ne pèsent rien. Pas besoin de muscles : mets-y le poids du corps, les hanches d’abord, le poing en dernier. »' },
  { id: 'faible_agilite', si: (s) => plusFaible(s) === 'agilite', texte: '« Tu es lent·e à te remettre en place après un coup. Ce n’est pas une question de jambes : tu regardes ta main au lieu de ton adversaire. »' },
  { id: 'faible_controleChakra', si: (s) => plusFaible(s) === 'controleChakra', texte: '« Tu gaspilles ton chakra comme on renverse un seau pour remplir une tasse. Une feuille sur le front, une heure par jour. Je sais. Fais-le. »' },
  { id: 'faible_intellect', si: (s) => plusFaible(s) === 'intellect', texte: '« Tu fonces, et tu réfléchis après. Avant chaque mission, dis-moi trois façons dont elle peut mal tourner. Trois. Pas deux. »' },
  { id: 'faible_discretion', si: (s) => plusFaible(s) === 'discretion', texte: '« On t’entend arriver de l’autre bout de la forêt. Marche sur le bord extérieur du pied. Et arrête de soupirer. »' },
  { id: 'faible_charisme', si: (s) => plusFaible(s) === 'charisme', texte: '« Tu parles aux gens comme à des cibles. Un jour, il faudra que quelqu’un ait envie de te suivre. Commence par écouter jusqu’au bout. »' },
  { id: 'repos', si: (s) => s.jauges.fatigue >= 50, texte: '« Tu t’entraînes épuisé·e. Ce que tu apprends fatigué·e, tu l’apprends de travers. Dors. C’est un ordre. »' },
];

/** Le conseil suivant : le premier qui s'applique et que tu n'as jamais reçu. */
export function prochainConseil(s: GameState): Conseil | undefined {
  return CONSEILS.find((c) => !s.drapeaux[`conseil:${c.id}`] && c.si(s));
}

/**
 * La revue du mentor : ce qui a le plus progressé depuis la dernière fois, et un conseil neuf.
 * Effet `{ revueMentor: true }` : il note la revue (drapeaux), le texte la lit ensuite avec {revue_progres} et {revue_conseil}.
 */
export function revueMentor(s: GameState): void {
  let meilleur: AttributId | undefined;
  let gain = 0;
  for (const a of ATTRIBUTS) {
    if (!NOM_ATTRIBUT[a]) continue;
    const ref = s.drapeaux[`revue:${a}`];
    const d = typeof ref === 'number' ? s.attributs[a] - ref : 0;
    if (d > gain) [meilleur, gain] = [a, d];
  }
  s.drapeaux['revue_progres'] = meilleur && gain >= 3 ? meilleur : '';
  for (const a of ATTRIBUTS) s.drapeaux[`revue:${a}`] = Math.round(s.attributs[a]);
  const c = prochainConseil(s);
  s.drapeaux['revue_conseil'] = c?.id ?? '';
  if (c) s.drapeaux[`conseil:${c.id}`] = true;
  s.drapeaux['revues'] = (Number(s.drapeaux['revues']) || 0) + 1;
}

// ── Les jetons ───────────────────────────────────────────────

/** {rival_bilan}, {habitude}, {revue_progres}, {revue_conseil}, {souvenir:@x}. */
export function jetonProche(s: GameState, jeton: string): string | undefined {
  if (jeton === 'rival_bilan') return texteBilan(s);
  if (jeton === 'habitude') return habitude(s) ?? 'faire toujours la même chose';
  if (jeton === 'revue_progres') {
    const a = s.drapeaux['revue_progres'];
    return typeof a === 'string' && a ? NOM_ATTRIBUT[a as AttributId] : 'ce que tu as travaillé';
  }
  if (jeton === 'revue_conseil') {
    const id = s.drapeaux['revue_conseil'];
    return CONSEILS.find((c) => c.id === id)?.texte ?? '« Je n’ai plus de conseil que tu n’aies déjà entendu. Le reste, c’est à toi de le trouver. Ça aussi, c’est une leçon. »';
  }
  const m = /^souvenir:(@?[\w-]+)$/.exec(jeton);
  if (m) {
    const id = resoudrePnj(s, m[1]);
    const r = id ? s.relations[id] : undefined;
    // Sans souvenir noté, celui que partagent tous ceux qui ont grandi ensemble (les scènes ne citent le jeton que s'il y en a un).
    return r?.souvenirs.length ? r.souvenirs[r.souvenirs.length - 1] : 'Les après-midi au terrain, quand vous étiez trop petits pour qu’on vous prenne au sérieux.';
  }
  return undefined;
}

export const JETONS_PROCHES = ['rival_bilan', 'habitude', 'revue_progres', 'revue_conseil'];
