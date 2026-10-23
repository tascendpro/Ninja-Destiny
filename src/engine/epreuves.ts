// Combats et épreuves — section 11. Aucun combat n'est gagné d'avance ; tout se calcule côté moteur.

import type { AttributId, CheckDef, FormeCombat, GameState, Issue, MasteryDef, MasteryState, Outcome, PorteeTechnique, RangTechnique, TechniqueAdverse } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal, clamp } from './etat';
import { alea } from './rng';
import { applyCombatExperience, exigence, tierEffectif } from './maitrise';
import { getWeaponModifiers, idFamille, usureArme } from './armes';
import { noterMerite } from './progression';
import { duoUtilisable } from './duo';

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

const ORDRE_RANG: Record<RangTechnique, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6 };

/** Le rang de l'adversaire, lu dans la difficulté du combat : D (genin), C, B, A (jōnin d'élite). */
export function rangAdversaire(t: CheckDef): number {
  return t.difficulte <= 44 ? 1 : t.difficulte <= 52 ? 2 : t.difficulte <= 60 ? 3 : 4;
}

/** Degré de maîtrise d'une technique : son palier, plus l'avancée de l'entraînement vers le suivant (0 à 1). */
function degreTechnique(def: MasteryDef, ms: MasteryState): number {
  if (ms.tier >= 5) return 5;
  const requis = exigence(def, (ms.tier + 1) as 1 | 2 | 3 | 4 | 5).jours;
  return ms.tier + (requis > 0 ? Math.min(1, ms.trainingDays / requis) : 0);
}

/**
 * Attaque spéciale : bonus d'une technique connue sur un combat.
 * - La maîtrise compte fort : palier et entraînement en cours font passer une technique de 70 % à 170 % de sa puissance.
 * - Face à un adversaire de rang supérieur, une technique simple perd de son effet (un quart par rang d'écart) ;
 *   une technique d'un rang au-dessus de l'adversaire gagne un peu.
 * - Une nature forte contre celle de l'adversaire ajoute un avantage, une nature faible le retire,
 *   d'autant plus nettement que la nature est maîtrisée.
 */
export function bonusTechnique(s: GameState, techId: string, t: CheckDef): number {
  const def = R.maitrises[techId];
  const ms = s.maitrises[techId];
  if (!def?.technique || !ms || ms.tier < 1) return 0;
  let b = def.technique.puissance * (0.45 + 0.25 * degreTechnique(def, ms));
  const ecart = ORDRE_RANG[def.rang ?? 'C'] - rangAdversaire(t);
  b *= ecart < 0 ? Math.max(0.4, 1 + 0.25 * ecart) : 1 + 0.1 * ecart;
  const av = avantageTechnique(techId, t.elementAdverse);
  if (av) {
    const els = def.technique.elements ?? (def.element ? [def.element] : []);
    const nature = Math.max(0, ...els.map((e) => s.maitrises[`nature_${e}`]?.tier ?? 0));
    b += (av === 'fort' ? 1 : -1) * (8 + 1.5 * nature);
  }
  b += BONUS_PORTEE[t.forme ?? 'duel'][porteeTechnique(techId)];
  return Math.round(b);
}

/** Une technique de zone balaie un groupe mais se dilue en duel ; une technique ciblée fait l'inverse. */
const BONUS_PORTEE: Record<FormeCombat, Record<PorteeTechnique, number>> = {
  duel: { cible: 3, zone: 0, large: -3 },
  escouade: { cible: -5, zone: 5, large: 9 },
};

export function porteeTechnique(techId: string): PorteeTechnique {
  return R.contenu.recitsTechniques[techId]?.portee ?? 'cible';
}

/** L'arme que prend le Susanoo : elle naît de la nature de chakra choisie à la naissance. */
const ARME_SUSANOO: Record<string, string> = {
  katon: 'une épée de flammes noires, longue comme un pont',
  raiton: 'un arc tendu de foudre, dont chaque flèche est un éclair',
  fuuton: 'deux sabres de vent qui hurlent en tournant',
  suiton: 'un arc d’eau, dont les flèches sifflent comme des lances de pluie',
  doton: 'une hallebarde de roche et un bouclier large comme un rempart',
};

/**
 * Ce que devient la technique sur le terrain, selon la forme du combat et, pour les transformations,
 * selon le palier atteint (le Susanoo naît squelette avant d'avoir un corps, puis une arme).
 */
export function recitTechnique(s: GameState, techId: string, t: CheckDef): string | undefined {
  const rec = R.contenu.recitsTechniques[techId];
  if (!rec) return undefined;
  const forme = t.forme ?? 'duel';
  const tier = s.maitrises[techId]?.tier ?? 1;
  const palier = (rec.paliers ?? []).filter((p) => p.min <= tier).sort((a, b) => b.min - a.min)[0];
  const texte = palier ? palier[forme] : rec[forme];
  return texte.replace('{armeSusanoo}', ARME_SUSANOO[s.creation.element] ?? ARME_SUSANOO.katon);
}

/**
 * Risque de toucher un allié : seulement si des alliés sont dans la mêlée, et pour une technique de zone.
 * Une technique bien maîtrisée se contrôle : le risque fond avec le palier (jusqu'à 30 % du risque de départ).
 */
export function risqueAllie(s: GameState, techId: string, t: CheckDef): number {
  const portee = porteeTechnique(techId);
  const def = R.maitrises[techId];
  const ms = s.maitrises[techId];
  if (!t.allies || portee === 'cible' || !def || !ms) return 0;
  const base = portee === 'large' ? 0.22 : 0.12;
  return base * Math.max(0.3, 1 - 0.15 * (degreTechnique(def, ms) - 1));
}

/** Malus de la manche quand la technique a touché un des tiens. */
export const MALUS_TIR_AMI = 12;

/** La ligne du récit quand un allié est touché : par nature, sinon par famille de technique. */
export function texteTirAmi(techId: string): string {
  const def = R.maitrises[techId];
  const el = def?.technique?.elements?.[0] ?? def?.element;
  const tirs = R.contenu.tirsAmis;
  return (el && tirs[el]) || tirs[def?.technique?.categorie ?? ''] || tirs.defaut;
}

/** Le test d'un combat, complété par sa forme (duel ou escouade, alliés présents). */
export function avecAffrontement(evId: string, choixId: string, t: CheckDef): CheckDef {
  if (t.type !== 'combat' || t.forme) return t;
  const a = R.contenu.affrontements[`${evId}/${choixId}`];
  return { ...t, forme: a?.forme ?? 'duel', allies: t.allies ?? a?.allies, verdict: t.verdict ?? a?.verdict };
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
  if (!def?.technique?.offensive || !ms || ms.tier < 1 || ms.bloquee) return false;
  if (usagesRestants(s, techId) === 0) return false;
  // Une technique à deux ne se lance pas sans l'équipier à tes côtés.
  if (!duoUtilisable(s, techId)) return false;
  return s.jauges.chakra >= def.technique.chakra && s.jauges.sante > (def.technique.sante ?? 0);
}

/** Usages restants d'une technique comptée (undefined : sans limite). */
export function usagesRestants(s: GameState, techId: string): number | undefined {
  const max = R.maitrises[techId]?.technique?.limite?.usages;
  if (max === undefined) return undefined;
  return Math.max(0, max - (Number(s.drapeaux[`usages_${techId}`]) || 0));
}

/** Une transformation (un état), plutôt qu'une attaque ? */
export function estTransformation(techId: string): boolean {
  return !!R.maitrises[techId]?.technique?.posture;
}

/** Bonus d'une transformation, qui croît avec son palier. */
export function bonusPosture(s: GameState, techId: string): { attaque: number; defense: number } {
  const p = R.maitrises[techId]?.technique?.posture;
  if (!p) return { attaque: 0, defense: 0 };
  const f = 0.8 + 0.1 * (s.maitrises[techId]?.tier ?? 1);
  return { attaque: Math.round(p.attaque * f), defense: Math.round(p.defense * f) };
}

/** Le récit d'entrée en transformation : celui du plus haut palier atteint, une variante différente à chaque fois. */
export function entreeTransformation(s: GameState, techId: string, tour: number): string {
  const p = R.maitrises[techId]?.technique?.posture;
  if (!p) return '';
  const tier = s.maitrises[techId]?.tier ?? 1;
  const groupe = p.entree.filter((g) => g.min <= tier).sort((a, b) => b.min - a.min)[0] ?? p.entree[0];
  const texte = groupe.textes[Math.abs(tour) % groupe.textes.length];
  return texte.replace('{armeSusanoo}', ARME_SUSANOO[s.creation.element] ?? ARME_SUSANOO.katon);
}

/**
 * Les attaques spéciales proposées sur un combat : les plus fortes d'abord. Une technique réservée à une
 * transformation n'apparaît que sous cette transformation ; les transformations, elles, se proposent à part en combat.
 */
export function attaquesSpeciales(s: GameState, t: CheckDef, max = 3, transformation?: string, sansPostures = false): string[] {
  return Object.keys(s.maitrises)
    .filter((id) => attaqueDisponible(s, id))
    .filter((id) => {
      const exige = R.maitrises[id].technique!.exigeTransformation;
      if (exige && !(transformation && exige.includes(transformation))) return false;
      if (estTransformation(id) && (sansPostures || id === transformation)) return false;
      return true;
    })
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

export function resoudreEpreuve(s: GameState, t: CheckDef, ctx: Ctx): { issue: Issue; outcome: Outcome; mort: boolean; capture: boolean } {
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
    if (issue === 'echec') {
      const sort = blessureDeCombat(s, t, r, proba, ctx);
      return { issue, outcome, mort: sort === 'mort', capture: sort === 'capture' };
    }
  }
  return { issue, outcome, mort: false, capture: false };
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

// ── Dōjutsu : des yeux qui se paient en chakra ──

/** Coût de base par manche, selon le palier (index = palier), et ce que l'œil apporte par palier. */
const DOJUTSU: Record<string, { cout: number[]; attaque: number; defense: number; verbe: string }> = {
  sharingan: { cout: [0, 3, 5, 7, 8, 9], attaque: 2, defense: 4, verbe: 'Tes yeux virent au rouge ; les tomoe tournent.' },
  byakugan: { cout: [0, 2, 3, 4, 5, 6], attaque: 2, defense: 3, verbe: 'Les veines se gonflent autour de tes yeux : tu vois à travers tout.' },
  mangekyo: { cout: [0, 10, 11, 12, 13, 14], attaque: 4, defense: 5, verbe: 'Le kaléidoscope s’ouvre dans tes yeux. Ils saignent un peu.' },
  rinnegan: { cout: [0, 12, 13, 14, 15, 16], attaque: 5, defense: 5, verbe: 'Les anneaux concentriques s’allument dans ton regard.' },
};

export function estDojutsu(id: string): boolean {
  return id in DOJUTSU;
}

/**
 * Ce qu'un dōjutsu coûte par manche : il grimpe à chaque nouveau palier, puis le corps s'y habitue avec les années
 * passées au même palier (jusqu'à 30 % du coût), et un corps d'enfant le paie plus cher.
 */
export function coutDojutsu(s: GameState, id: string): number {
  const d = DOJUTSU[id];
  const ms = s.maitrises[id];
  if (!d || !ms?.awakened || ms.tier < 1) return 0;
  const base = d.cout[ms.tier] ?? d.cout[d.cout.length - 1];
  const depuis = ms.palierDepuis ?? ms.awakenedAtDay ?? s.jour;
  const annees = Math.max(0, (s.jour - depuis) / 360);
  const habitude = Math.max(0.3, 1 - 0.25 * annees);
  const a = Math.floor((s.jour - s.naissance) / 360);
  const corps = a < 12 ? 1.3 : a < 16 ? 1.1 : 1;
  return Math.max(1, Math.round(base * habitude * corps));
}

export function bonusDojutsu(s: GameState, id: string): { attaque: number; defense: number } {
  const d = DOJUTSU[id];
  const tier = s.maitrises[id]?.tier ?? 0;
  if (!d || tier < 1) return { attaque: 0, defense: 0 };
  return { attaque: d.attaque * tier, defense: d.defense * tier };
}

export function texteDojutsu(id: string): string {
  return DOJUTSU[id]?.verbe ?? '';
}

/** Les yeux qu'on peut activer : éveillés, pas bloqués (un Mangekyō aveugle ne s'active plus). */
export function dojutsuDisponibles(s: GameState): string[] {
  return Object.keys(DOJUTSU).filter((id) => {
    const ms = s.maitrises[id];
    return !!ms?.awakened && ms.tier >= 1 && !ms.bloquee && s.jauges.chakra >= coutDojutsu(s, id);
  });
}

// ── Initiative de l'adversaire ──

/** Chance que l'adversaire prenne l'initiative d'une manche : plus il est fort et nombreux, plus souvent ; l'agilité la lui dispute. */
export function chancePriorite(s: GameState, t: CheckDef): number {
  const p = 0.22 + 0.07 * (rangAdversaire(t) - 1) + (t.forme === 'escouade' ? 0.08 : 0) - (s.attributs.agilite - 45) / 250;
  return clamp(p, 0.12, 0.6);
}

/** La technique qu'il lance : de sa nature si on la connaît, jamais au-dessus de son rang ; les plus fortes plus souvent. */
export function tirerTechniqueAdverse(s: GameState, t: CheckDef): string {
  const rang = rangAdversaire(t);
  const pool = R.contenu.techniquesAdverses.filter((a) => a.rang <= rang && (!a.element || a.element === t.elementAdverse));
  const total = pool.reduce((n, a) => n + a.rang, 0);
  let r = alea(s) * total;
  for (const a of pool) {
    r -= a.rang;
    if (r < 0) return a.id;
  }
  return pool[pool.length - 1].id;
}

export function techniqueAdverse(id: string): TechniqueAdverse | undefined {
  return R.contenu.techniquesAdverses.find((a) => a.id === id);
}

export type Defense = 'esquiver' | 'contrer' | 'permutation';

/** La permutation coûte un peu de chakra ; il faut la connaître. */
export const CHAKRA_PERMUTATION = 4;
export function permutationPossible(s: GameState): boolean {
  return (s.maitrises['kawarimi']?.tier ?? 0) >= 1 && s.jauges.chakra >= CHAKRA_PERMUTATION;
}

/** Une nature que tu maîtrises domine-t-elle celle de sa technique (ton eau contre son feu) ? */
export function natureQuiDomine(s: GameState, element?: string): string | undefined {
  if (!element) return undefined;
  return R.contenu.elements.find((e) => e.fortContre === element && (s.maitrises[`nature_${e.id}`]?.tier ?? 0) >= 1)?.id;
}

/**
 * La manche où il attaque le premier. Esquiver se joue sur l'agilité et l'œil (la permutation aide) : sûr, mais on ne touche pas.
 * Contrer, c'est frapper dans son attaque : plus dur, mais un contre réussi compte comme un coup porté, et raté, il coûte cher.
 */
export function testDefense(s: GameState, t: CheckDef, advId: string, mode: Defense): CheckDef {
  const adv = techniqueAdverse(advId);
  const puissance = adv?.puissance ?? 8;
  if (mode === 'esquiver') {
    const permutation = (s.maitrises['kawarimi']?.tier ?? 0) >= 1 ? 6 : 0;
    return { ...t, attributs: { agilite: 2, perception: 1 }, maitrises: { taijutsu: 0.5 }, arme: false, modificateur: (t.modificateur ?? 0) + permutation - puissance * 0.5 };
  }
  // La permutation : une bûche prend le coup à ta place. Plus sûre qu'une esquive, et chaque palier la rend plus nette.
  if (mode === 'permutation') {
    return { ...t, attributs: { agilite: 1, perception: 1, controleChakra: 1 }, maitrises: { kawarimi: 2 }, arme: false, modificateur: (t.modificateur ?? 0) + 10 - puissance * 0.4 };
  }
  const nature = natureQuiDomine(s, adv?.element) ? 6 : 0;
  return { ...t, modificateur: (t.modificateur ?? 0) - 6 - puissance * 0.6 + nature };
}

export function resoudreDefense(s: GameState, t: CheckDef, advId: string, mode: Defense, ctx: Ctx): { issue: IssueManche; degats: number } {
  const { proba } = evaluerEpreuve(s, testDefense(s, t, advId, mode));
  if (alea(s) < proba) return { issue: mode === 'contrer' ? 'touche' : 'esquive', degats: 0 };
  const adv = techniqueAdverse(advId);
  const facteur = s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1;
  const degats = Math.round(((t.letal ? 9 : 5) * (mode === 'contrer' ? 1.6 : mode === 'permutation' ? 1 : 1.2) + (adv?.puissance ?? 8) * 0.3) * facteur);
  s.jauges.sante = clamp(s.jauges.sante - degats, 1, 100);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -degats });
  return { issue: 'riposte', degats };
}

/** Fin d'un combat en manches : l'issue vient du nombre de coups portés ; l'échec garde son prix (blessure, mort possible). */
export function conclureCombat(s: GameState, t: CheckDef, touches: number, ripostes: number, total: number, ctx: Ctx): { issue: Issue; outcome: Outcome; mort: boolean; capture: boolean } {
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
  if (issue !== 'echec') return { issue, outcome, mort: false, capture: false };
  // Un échec sans aucun coup porté est un échec profond.
  const { proba } = evaluerEpreuve(s, t);
  const r = touches === 0 ? 0.5 + alea(s) * 0.5 : alea(s);
  const sort = blessureDeCombat(s, t, Math.max(r, proba), proba, ctx);
  return { issue, outcome, mort: sort === 'mort', capture: sort === 'capture' };
}

/** Chance qu'une permutation bien maîtrisée transforme un coup mortel en coup sur une bûche (palier 2 et plus). */
export function chancePermutation(s: GameState): number {
  const tier = s.maitrises['kawarimi']?.tier ?? 0;
  return tier >= 2 ? Math.min(0.5, 0.1 * tier) : 0;
}

function sauveParPermutation(s: GameState, ctx: Ctx): boolean {
  const chance = chancePermutation(s);
  if (chance <= 0 || alea(s) >= chance) return false;
  s.drapeaux['permutations_salvatrices'] = (Number(s.drapeaux['permutations_salvatrices']) || 0) + 1;
  ctx.changements.push({ t: 'info', message: 'Permutation ! Le coup qui devait te tuer frappe une bûche. Tu t’en sors, en sang.' });
  ajouterJournal(s, 'Une permutation au dernier instant t’a sauvé la vie.', 2);
  return true;
}

/** Probabilité qu'un échec dans un combat mortel tue, selon la difficulté choisie. */
export const CHANCE_MORT: Record<string, number> = { recit: 0.18, shinobi: 0.45, legende: 0.6 };
/** Contre une escouade, un échec qui ne tue pas peut finir en captivité. */
export const CHANCE_CAPTURE: Record<string, number> = { recit: 0.15, shinobi: 0.22, legende: 0.25 };

/** Ce qu'un combat mortel raté laisse : rien de plus que des blessures, la captivité, ou la mort. */
export type SortDuVaincu = 'mort' | 'capture' | undefined;

/**
 * Un combat raté laisse des traces. Un combat mortel raté peut tuer : la mort n'est jamais
 * décidée par le seul hasard (il faut avoir échoué), mais elle peut frapper à tout moment.
 * Face à un groupe, celui qui tombe sans mourir peut être emmené.
 */
function blessureDeCombat(s: GameState, t: CheckDef, r: number, proba: number, ctx: Ctx): SortDuVaincu {
  // Profondeur de l'échec : 0 au seuil, 1 pour le pire tirage possible.
  const profondeur = clamp((r - proba) / Math.max(0.01, 1 - proba), 0, 1);
  const mort = CHANCE_MORT[s.creation.difficulte] ?? 0.45;
  // La permutation, réflexe de survie : au dernier instant, le coup mortel frappe une bûche.
  if (t.letal && profondeur > 1 - mort && sauveParPermutation(s, ctx)) {
    const d = Math.round(18 * (s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1));
    s.jauges.sante = clamp(s.jauges.sante - d, 1, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d });
    return undefined;
  }
  if (t.letal && profondeur > 1 - mort) {
    const avant = s.jauges.sante;
    s.jauges.sante = 0;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -avant });
    s.drapeaux['mort_au_combat'] = true;
    ajouterJournal(s, 'Un coup de trop. Tu ne te relèves pas.', 3);
    return 'mort';
  }
  const degats = Math.round((t.letal ? 14 : 6) + profondeur * (t.letal ? 22 : 10));
  const facteur = s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1;
  const d = Math.round(degats * facteur);
  s.jauges.sante = clamp(s.jauges.sante - d, 0, 100);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d });
  if (s.jauges.sante <= 0) return 'mort';
  const capture = CHANCE_CAPTURE[s.creation.difficulte] ?? 0.22;
  if (t.letal && t.forme === 'escouade' && profondeur > 1 - mort - capture) return 'capture';
  return undefined;
}
