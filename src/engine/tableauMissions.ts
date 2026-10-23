// Le tableau des missions n'attend pas : une mission laissée trop longtemps est confiée à quelqu'un d'autre,
// qui en revient avec l'expérience que tu n'as pas prise. Le choix de qui la prend ne consomme aucun hasard du jeu.

import type { GameState, MissionDef, RangMission } from './types';
import { R } from './registre';
import { evaluer } from './conditions';
import { Ctx, ajouterJournal, defPnj, rangIndex, resoudrePnj } from './etat';
import { porteurPnj, progresser } from './maitrise';
import { tirageTexte } from './combat/impacts';

/** Combien de jours une mission reste au tableau, selon son rang. */
export const DELAI_MISSION: Record<RangMission, number> = { D: 90, C: 120, B: 150, A: 180, S: 240 };

const cleOfferte = (id: string) => `mission_offerte:${id}`;

/** Les missions que le tableau te propose en ce moment. */
export function missionsAuTableau(s: GameState): MissionDef[] {
  if (rangIndex(s.rang) < rangIndex('genin') || s.statut !== 'actif') return [];
  return R.contenu.missions.filter((m) => s.missions[m.id] === undefined && evaluer(m.si, s));
}

/** Jours avant que la mission parte à quelqu'un d'autre (undefined si elle n'est pas encore au tableau). */
export function joursRestants(s: GameState, m: MissionDef): number | undefined {
  const depuis = s.drapeaux[cleOfferte(m.id)];
  if (typeof depuis !== 'number') return undefined;
  return Math.max(0, DELAI_MISSION[m.rang] - (s.jour - depuis));
}

/** Qui prend une mission laissée : rival, équipiers, ou une autre équipe du village. */
function preneur(s: GameState, m: MissionDef): string | undefined {
  const candidats = ['@rival', '@coequipierA', '@coequipierB']
    .map((r) => resoudrePnj(s, r))
    .filter((id): id is string => !!id && !!s.pnj[id] && s.pnj[id].etat !== 'mort' && s.pnj[id].etat !== 'disparu' && s.pnj[id].etat !== 'blesse');
  if (!candidats.length) return undefined;
  const t = tirageTexte(s, `preneur:${m.id}`);
  // Une fois sur quatre, c'est une équipe que tu ne connais pas.
  if (t < 0.25) return undefined;
  return candidats[Math.floor(((t - 0.25) / 0.75) * candidats.length) % candidats.length];
}

/** Ce que la mission rapporte à celui qui l'a faite : du temps d'entraînement et, dès le rang C, de l'expérience réelle. */
function crediter(s: GameState, id: string, m: MissionDef): void {
  const st = s.pnj[id];
  const p = porteurPnj(s, id);
  if (!st || !p) return;
  const gain = 1 + ['D', 'C', 'B', 'A', 'S'].indexOf(m.rang);
  for (const [mid, ms] of Object.entries(st.maitrises)) {
    if (R.maitrises[mid]?.nonEntrainable) continue;
    ms.trainingDays += m.duree * gain;
    if (m.rang !== 'D') ms.combatUses += gain;
    progresser(p, mid);
  }
  s.drapeaux[`missions_pnj:${id}`] = (Number(s.drapeaux[`missions_pnj:${id}`]) || 0) + 1;
}

/** À chaque passage du temps : les missions apparues sont datées, celles laissées trop longtemps partent. */
export function actualiserTableau(s: GameState, ctx: Ctx): void {
  for (const m of missionsAuTableau(s)) {
    const cle = cleOfferte(m.id);
    if (typeof s.drapeaux[cle] !== 'number') {
      s.drapeaux[cle] = s.jour;
      continue;
    }
    if ((joursRestants(s, m) ?? 1) > 0) continue;
    const id = preneur(s, m);
    s.missions[m.id] = 'confiee';
    if (id) {
      crediter(s, id, m);
      s.drapeaux[`mission_prise:${m.id}`] = id;
      const nom = defPnj(s, id)?.nom ?? 'Quelqu’un';
      const texte = `Mission ${m.rang} « ${m.titre} » : tu ne l’as pas prise. ${nom} l’a faite à ta place, et en revient plus fort${defPnj(s, id)?.genre === 'f' ? 'e' : ''}.`;
      ajouterJournal(s, texte, 2);
      ctx.changements.push({ t: 'info', message: texte });
    } else {
      const texte = `Mission ${m.rang} « ${m.titre} » : une autre équipe l’a prise. Le tableau n’attend personne.`;
      ajouterJournal(s, texte, 1);
      ctx.changements.push({ t: 'info', message: texte });
    }
  }
}
