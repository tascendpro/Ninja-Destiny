// Fins, trophées, bilan narratif — section 13.

import type { GameState } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal } from './etat';
import { evaluer } from './conditions';
import { age } from './calendrier';
import { estUtilisable } from './armes';
import { resoudreTexte } from './texte';

/** La mort dépend de l'état du personnage, jamais d'un tirage arbitraire. */
export function verifierFin(s: GameState): void {
  if (s.fin) return;
  if (s.jauges.sante <= 0) {
    s.fin = { id: 'mort', jour: s.jour, cause: typeof s.drapeaux['cause_mort'] === 'string' ? (s.drapeaux['cause_mort'] as string) : undefined };
  }
  if (s.fin?.id === 'mort' && s.statut !== 'mort') {
    s.drapeaux['statut_avant_mort'] = s.statut;
    s.statut = 'mort';
  }
}

export function verifierSucces(s: GameState, ctx: Ctx): void {
  for (const sd of R.contenu.succes) {
    if (!sd.si || s.succes.includes(sd.id)) continue;
    if (evaluer(sd.si, s)) {
      s.succes.push(sd.id);
      ctx.changements.push({ t: 'succes', id: sd.id });
      ajouterJournal(s, `Trophée : ${sd.nom}.`, 1);
    }
  }
}

export interface NoteFinale {
  note: 'S' | 'A' | 'B' | 'C' | 'D';
  points: number;
  detail: { libelle: string; points: number }[];
}

export function noteFinale(s: GameState): NoteFinale {
  const detail: { libelle: string; points: number }[] = [];
  const missions = Object.values(s.missions).filter((m) => m === 'reussie').length;
  detail.push({ libelle: `Missions réussies (${missions})`, points: missions * 6 });
  const paliers = Object.values(s.maitrises).reduce((a, m) => a + (m.awakened && !m.bloquee ? m.tier : 0), 0);
  detail.push({ libelle: `Maîtrise accumulée (${paliers} paliers)`, points: paliers * 2 });
  const eveils = Object.values(s.maitrises).filter((m) => m.awakenedAtAge !== undefined).length;
  if (eveils) detail.push({ libelle: `Éveils (${eveils})`, points: eveils * 8 });
  detail.push({ libelle: 'Réputation', points: Math.round((s.social.reputation + s.social.reputationOmbre) / 4) });
  const liens = Object.values(s.relations).filter((r) => !r.rompue && r.amitie + r.confiance >= 80).length;
  detail.push({ libelle: `Liens solides (${liens})`, points: liens * 5 });
  const tenues = s.promesses.filter((p) => p.etat === 'tenue').length;
  const rompues = s.promesses.filter((p) => p.etat === 'rompue').length;
  if (tenues || rompues) detail.push({ libelle: 'Promesses', points: tenues * 6 - rompues * 6 });
  detail.push({ libelle: `Secrets découverts (${s.secrets.length})`, points: s.secrets.length * 4 });
  const legendaires = s.arsenal.filter((a) => estUtilisable(a) && R.armes[a.defId]?.rarete === 'legendaire').length;
  if (legendaires) detail.push({ libelle: 'Arme légendaire', points: 15 * legendaires });
  if (s.fin?.id === 'mort') detail.push({ libelle: 'Mort prématurée', points: -15 });
  detail.push({ libelle: `Âge atteint (${age(s)} ans)`, points: Math.max(0, age(s) - 6) * 2 });
  const points = detail.reduce((a, d) => a + d.points, 0);
  const note = points >= 210 ? 'S' : points >= 160 ? 'A' : points >= 110 ? 'B' : points >= 65 ? 'C' : 'D';
  return { note, points, detail };
}

export function texteFin(s: GameState): { titre: string; texte: string } {
  const f = s.fin ? R.fins[s.fin.id] : undefined;
  if (!f) return { titre: 'Fin', texte: '' };
  const titre = f.titres?.find((t) => evaluer(t.si, s))?.titre ?? f.titre;
  return { titre, texte: resoudreTexte(f.texte, s) };
}
