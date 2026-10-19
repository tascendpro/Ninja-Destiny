// Combats et épreuves — section 11. Aucun combat n'est gagné d'avance ; tout se calcule côté moteur.

import type { AttributId, CheckDef, GameState, Issue, Outcome } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal, clamp } from './etat';
import { alea } from './rng';
import { applyCombatExperience, tierEffectif } from './maitrise';
import { getWeaponModifiers, idFamille, usureArme } from './armes';
import { noterMerite } from './progression';

export type NiveauRisque = 'faible' | 'modéré' | 'élevé' | 'extrême';

export interface EvaluationEpreuve {
  score: number;
  seuil: number;
  proba: number;
  risque: NiveauRisque;
  /** L'attribut qui pèse le plus dans cette épreuve. */
  principal?: AttributId;
}

function maitrisesDuTest(s: GameState, t: CheckDef): Record<string, number> {
  const res: Record<string, number> = {};
  for (const [id, w] of Object.entries(t.maitrises ?? {})) {
    if (id === 'arme') {
      const def = s.armeEquipee ? R.armes[s.armeEquipee] : undefined;
      if (def) res[idFamille(def.famille)] = (res[idFamille(def.famille)] ?? 0) + w;
    } else {
      res[id] = (res[id] ?? 0) + w;
    }
  }
  if (t.arme) {
    const def = s.armeEquipee ? R.armes[s.armeEquipee] : undefined;
    if (def && res[idFamille(def.famille)] === undefined) res[idFamille(def.famille)] = 1;
  }
  return res;
}

/**
 * Attaque spéciale : bonus d'une technique connue sur un combat. La puissance croît avec le palier ;
 * une nature forte contre celle de l'adversaire ajoute un avantage, une nature faible le retire.
 */
export function bonusTechnique(s: GameState, techId: string, t: CheckDef): number {
  const def = R.maitrises[techId];
  const ms = s.maitrises[techId];
  if (!def?.technique || !ms || ms.tier < 1) return 0;
  let b = def.technique.puissance * (0.7 + 0.15 * ms.tier);
  const av = avantageTechnique(techId, t.elementAdverse);
  if (av === 'fort') b += 8;
  if (av === 'faible') b -= 8;
  return Math.round(b);
}

/**
 * Avantage d'élément d'une technique face à l'adversaire. Une combinaison porte deux natures :
 * il suffit que l'une domine pour avoir l'avantage, et il faut que les deux soient dominées pour le perdre.
 */
export function avantageTechnique(techId: string, adverse?: string): 'fort' | 'faible' | undefined {
  const def = R.maitrises[techId];
  if (!def || !adverse) return undefined;
  const els = def.technique?.elements ?? (def.element ? [def.element] : []);
  if (!els.length) return undefined;
  if (els.some((e) => R.elements[e]?.fortContre === adverse)) return 'fort';
  if (els.every((e) => R.elements[e]?.faibleContre === adverse)) return 'faible';
  return undefined;
}

/** Une technique peut-elle servir d'attaque spéciale maintenant (connue, offensive, chakra suffisant) ? */
export function attaqueDisponible(s: GameState, techId: string): boolean {
  const def = R.maitrises[techId];
  const ms = s.maitrises[techId];
  return !!def?.technique?.offensive && !!ms && ms.tier >= 1 && !ms.bloquee && s.jauges.chakra >= def.technique.chakra && s.jauges.sante > (def.technique.sante ?? 0);
}

/** Les attaques spéciales proposées sur un combat : les plus fortes d'abord, trois au plus. */
export function attaquesSpeciales(s: GameState, t: CheckDef, max = 3): string[] {
  return Object.keys(s.maitrises)
    .filter((id) => attaqueDisponible(s, id))
    .map((id) => ({ id, b: bonusTechnique(s, id, t) }))
    .sort((a, b) => b.b - a.b || a.id.localeCompare(b.id))
    .slice(0, max)
    .map((x) => x.id);
}

export function evaluerEpreuve(s: GameState, t: CheckDef): EvaluationEpreuve {
  const poids = Object.entries(t.attributs);
  const total = poids.reduce((a, [, w]) => a + (w ?? 0), 0) || 1;
  let score = poids.reduce((a, [k, w]) => a + (s.attributs[k as keyof typeof s.attributs] ?? 0) * (w ?? 0), 0) / total;

  for (const [id, w] of Object.entries(maitrisesDuTest(s, t))) {
    score += tierEffectif(s.maitrises[id], s.jour) * 6 * w;
  }
  if (t.arme) {
    const m = getWeaponModifiers(s);
    score += m.bonus - m.malus;
  }
  score += t.modificateur ?? 0;
  score -= s.jauges.fatigue * 0.2;
  score -= (100 - s.jauges.sante) * 0.2;
  for (const b of s.blessures) score -= b.gravite >= 3 ? 8 : b.gravite === 2 ? 4 : 1;

  const seuil = t.difficulte + (s.creation.difficulte === 'recit' ? -8 : s.creation.difficulte === 'legende' ? 8 : 0);
  const brut = 1 / (1 + Math.exp(-(score - seuil) / 9));
  const proba = Math.max(0.04, Math.min(0.96, brut));
  const risque: NiveauRisque = proba >= 0.75 ? 'faible' : proba >= 0.5 ? 'modéré' : proba >= 0.25 ? 'élevé' : 'extrême';
  const principal = poids.reduce<[string, number] | undefined>((m, [k, w]) => ((w ?? 0) > (m?.[1] ?? 0) ? [k, w ?? 0] : m), undefined)?.[0] as AttributId | undefined;
  return { score: Math.round(score), seuil, proba, risque, principal };
}

export function resoudreEpreuve(s: GameState, t: CheckDef, ctx: Ctx): { issue: Issue; outcome: Outcome; mort: boolean } {
  const { proba } = evaluerEpreuve(s, t);
  const r = alea(s);
  let issue: Issue;
  if (r < proba * 0.18) issue = 'critique';
  else if (r < proba) issue = 'succes';
  else if (r < proba + (1 - proba) * 0.4) issue = 'partiel';
  else issue = 'echec';

  let outcome: Outcome;
  if (issue === 'critique') outcome = t.critique ?? t.succes;
  else if (issue === 'succes') outcome = t.succes;
  else if (issue === 'partiel') outcome = t.partiel ?? t.echec;
  else outcome = t.echec;
  if (issue === 'critique' && !t.critique) issue = 'succes';
  if (issue === 'partiel' && !t.partiel) issue = 'echec';
  if (issue === 'succes' || issue === 'critique') noterMerite(s, t.type === 'combat' ? 'combat' : 'epreuve');

  if (t.type === 'combat') {
    applyCombatExperience(s, Object.keys(maitrisesDuTest(s, t)), ctx);
    if (t.arme || t.maitrises?.arme) usureArme(s, issue === 'echec' ? 8 : issue === 'critique' ? 2 : 4, ctx);
    if (issue === 'echec') return { issue, outcome, mort: blessureDeCombat(s, t, r, proba, ctx) };
  }
  return { issue, outcome, mort: false };
}

/** Nombre de manches d'un combat : explicite, sinon deux pour un combat mortel difficile. */
export function nombreManches(t: CheckDef): number {
  if (t.type !== 'combat') return 1;
  if (t.manches) return Math.max(1, Math.min(4, t.manches));
  return t.letal && t.difficulte >= 58 ? 2 : 1;
}

export type IssueManche = 'touche' | 'esquive' | 'riposte';

/** Une manche : tu touches, l'adversaire esquive, ou il riposte (blessure légère, jamais mortelle seule). */
export function resoudreManche(s: GameState, t: CheckDef, ctx: Ctx, protege = false): { issue: IssueManche; degats: number } {
  const { proba } = evaluerEpreuve(s, t);
  const r = alea(s);
  if (r < proba) return { issue: 'touche', degats: 0 };
  if (protege || r < proba + (1 - proba) * 0.5) return { issue: 'esquive', degats: 0 };
  const facteur = s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1;
  const degats = Math.round((t.letal ? 9 : 5) * facteur);
  s.jauges.sante = clamp(s.jauges.sante - degats, 1, 100);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -degats });
  return { issue: 'riposte', degats };
}

/** Fin d'un combat en manches : l'issue vient du nombre de coups portés ; l'échec garde son prix (blessure, mort possible). */
export function conclureCombat(s: GameState, t: CheckDef, touches: number, ripostes: number, total: number, ctx: Ctx): { issue: Issue; outcome: Outcome; mort: boolean } {
  // Chaque coup porté compte un point, chaque riposte encaissée en retire un demi.
  const score = touches - ripostes * 0.5;
  let issue: Issue;
  if (touches >= total) issue = t.critique ? 'critique' : 'succes';
  else if (score * 2 >= total) issue = 'succes';
  else if (touches >= 1 && t.partiel) issue = 'partiel';
  else issue = 'echec';
  const outcome = issue === 'critique' ? t.critique! : issue === 'succes' ? t.succes : issue === 'partiel' ? t.partiel! : t.echec;
  applyCombatExperience(s, Object.keys(maitrisesDuTest(s, t)), ctx);
  if (t.arme || t.maitrises?.arme) usureArme(s, issue === 'echec' ? 8 : issue === 'critique' ? 2 : 4, ctx);
  if (issue === 'succes' || issue === 'critique') noterMerite(s, 'combat');
  if (issue !== 'echec') return { issue, outcome, mort: false };
  // Un échec sans aucun coup porté est un échec profond.
  const { proba } = evaluerEpreuve(s, t);
  const r = touches === 0 ? 0.5 + alea(s) * 0.5 : alea(s);
  return { issue, outcome, mort: blessureDeCombat(s, t, Math.max(r, proba), proba, ctx) };
}

/** Probabilité qu'un échec dans un combat mortel tue, selon la difficulté choisie. */
export const CHANCE_MORT: Record<string, number> = { recit: 0.12, shinobi: 0.3, legende: 0.45 };

/**
 * Un combat raté laisse des traces. Un combat mortel raté peut tuer : la mort n'est jamais
 * décidée par le seul hasard (il faut avoir échoué), mais elle peut frapper à tout moment.
 */
function blessureDeCombat(s: GameState, t: CheckDef, r: number, proba: number, ctx: Ctx): boolean {
  // Profondeur de l'échec : 0 au seuil, 1 pour le pire tirage possible.
  const profondeur = clamp((r - proba) / Math.max(0.01, 1 - proba), 0, 1);
  if (t.letal) {
    const chance = CHANCE_MORT[s.creation.difficulte] ?? 0.3;
    if (profondeur > 1 - chance) {
      const avant = s.jauges.sante;
      s.jauges.sante = 0;
      ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -avant });
      s.drapeaux['mort_au_combat'] = true;
      ajouterJournal(s, 'Un coup de trop. Tu ne te relèves pas.', 3);
      return true;
    }
  }
  const degats = Math.round((t.letal ? 14 : 6) + profondeur * (t.letal ? 22 : 10));
  const facteur = s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1;
  const d = Math.round(degats * facteur);
  s.jauges.sante = clamp(s.jauges.sante - d, 0, 100);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d });
  return s.jauges.sante <= 0;
}
