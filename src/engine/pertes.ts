// Les pertes d'une vie de ninja : des proches meurent au fil des années, et chez un jinchūriki,
// la mort d'un proche peut briser le sceau. Personne n'est à l'abri, mais la mort ne frappe jamais deux fois de suite.

import type { GameState } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal, clamp, resoudrePnj } from './etat';
import { alea } from './rng';
import { age } from './calendrier';

/** Les proches dont la mort compte, et leur poids dans le tirage (les parents vieillissent avec les chapitres). */
const PROCHES: { role: string; poids: (s: GameState) => number }[] = [
  { role: '@parent', poids: (s) => (s.chapitre >= 4 ? 4 : 1) },
  { role: '@aine', poids: () => 2 },
  { role: '@sensei', poids: (s) => (s.chapitre >= 3 ? 3 : 1) },
  { role: '@coequipierB', poids: () => 2 },
  { role: '@coequipierA', poids: () => 1 },
];

/** Chance, chaque année, de perdre un proche : la guerre (chapitre 3) est la pire période. */
const CHANCE_ANNUELLE: Record<number, number> = { 1: 0, 2: 0.07, 3: 0.15, 4: 0.1, 5: 0.12, 6: 0.12 };
/** Délai minimal entre deux pertes, en jours. */
const DELAI_ENTRE_PERTES = 700;

const CAUSES = [
  'tombé·e en mission, loin de tout',
  'pris·e dans une embuscade à la frontière',
  'emporté·e par une fièvre que les médecins n’ont pas su arrêter',
  'tombé·e en couvrant la retraite de son équipe',
  'mort·e d’une vieille blessure qui ne s’était jamais refermée',
];

export function estProche(s: GameState, pnjId: string): boolean {
  return PROCHES.some((p) => resoudrePnj(s, p.role) === pnjId);
}

/**
 * Chance que la bête se libère sous le choc : forte chez qui contrôle mal ses émotions, faible chez qui a
 * appris à vivre avec la bête. Une mort vue de ses yeux pèse plus qu'une nouvelle apprise de loin.
 */
export function chanceRage(s: GameState, temoin = true): number {
  const bete = s.maitrises['chakra_biju'];
  if (!s.drapeaux['jinchuriki'] || !bete) return 0;
  const p = 0.85 - s.attributs.controleEmotionnel / 120 - bete.tier * 0.06;
  return clamp(temoin ? p : p / 2, 0.05, 0.85);
}

/** Après la mort d'un proche : la bête se libère-t-elle ? La scène de déchaînement s'ouvre aussitôt si oui. */
export function declencherRage(s: GameState, ctx: Ctx, temoin = true): void {
  const p = chanceRage(s, temoin);
  if (p <= 0 || s.planifies.some((x) => x.evenementId === 'b_dechainement')) return;
  if (alea(s) >= p) return;
  s.planifies.push({ evenementId: 'b_dechainement', jour: s.jour });
  ctx.changements.push({ t: 'info', message: 'Quelque chose se brise en toi. Derrière le sceau, la bête se lève.' });
}

/**
 * Les proches dont une scène de l'histoire encore à venir (ce chapitre ou le suivant) a besoin :
 * la mort hors-champ les épargne, pour que le récit puisse toujours avancer.
 */
function rolesAttendus(s: GameState): Set<string> {
  const res = new Set<string>();
  for (const ev of R.contenu.evenements) {
    if ((ev.priorite ?? 0) <= 0 || s.evenementsVus[ev.id] || !ev.personnages?.length) continue;
    const chapitres = ev.chapitres ?? [ev.chapitre];
    if (!chapitres.some((c) => c === s.chapitre || c === s.chapitre + 1)) continue;
    for (const p of ev.personnages) res.add(p);
  }
  return res;
}

/** Chaque année, la vie de ninja peut emporter un proche. La scène « x_mort_proche » raconte la nouvelle. */
export function perteAnnuelle(s: GameState, ctx: Ctx): void {
  // Pas de perte pendant l'enfance et l'Académie : l'histoire a encore besoin de chacun pour se nouer.
  if (s.fin || s.statut === 'mort' || s.chapitre < 2 || s.rang === 'eleve' || age(s) < 13) return;
  const derniere = Number(s.drapeaux['derniere_perte_jour']);
  if (Number.isFinite(derniere) && s.jour - derniere < DELAI_ENTRE_PERTES) return;
  if (alea(s) >= (CHANCE_ANNUELLE[s.chapitre] ?? 0.1)) return;
  const attendus = rolesAttendus(s);
  const candidats = PROCHES.filter((p) => !attendus.has(p.role))
    .map((p) => ({ id: resoudrePnj(s, p.role), poids: p.poids(s) }))
    .filter((c): c is { id: string; poids: number } => !!c.id && !!s.pnj[c.id] && (s.pnj[c.id].etat === 'vivant' || s.pnj[c.id].etat === 'blesse'));
  if (!candidats.length) return;
  let r = alea(s) * candidats.reduce((n, c) => n + c.poids, 0);
  const victime = candidats.find((c) => (r -= c.poids) < 0) ?? candidats[candidats.length - 1];
  const st = s.pnj[victime.id];
  st.etat = 'mort';
  st.cause = CAUSES[Math.floor(alea(s) * CAUSES.length)];
  st.gueriLe = undefined;
  ctx.changements.push({ t: 'pnj', pnj: victime.id, etat: 'mort' });
  const def = R.pnj[victime.id] ?? s.pnjGeneres[victime.id];
  ajouterJournal(s, `${def?.nom ?? 'Un proche'} est mort${def?.genre === 'f' ? 'e' : ''} : ${st.cause}.`, 3);
  s.drapeaux['mort_recente'] = victime.id;
  s.drapeaux['derniere_perte_jour'] = s.jour;
  s.planifies.push({ evenementId: 'x_mort_proche', jour: s.jour + 1 });
  declencherRage(s, ctx, false);
}
