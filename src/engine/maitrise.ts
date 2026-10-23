// Éveil et maîtrise — section 7 de la spec.
// Potentiel (caché) → Éveil (événement, palier 1) → Maîtrise (paliers 2 à 5) → Coût.

import type { ExigencePalier, GameState, MasteryDef, MasteryState, MasteryTier, RangTechnique } from './types';
import { R } from './registre';
import { age, ageA, JOURS_MOIS } from './calendrier';
import { Ctx, ajouterJournal, defPnj, drapeauVrai, estProdige } from './etat';
import { alea } from './rng';

export const EXIGENCES_DEFAUT: Record<1 | 2 | 3 | 4 | 5, ExigencePalier> = {
  1: { jours: 15, combats: 0 },
  2: { jours: 60, combats: 0 },
  3: { jours: 180, combats: 3 },
  4: { jours: 420, combats: 10 },
  5: { jours: 900, combats: 25, drapeau: 'transcendance' },
};

export const NOMS_PALIERS = ['Latent', 'Éveillé', 'Contrôlé', 'Maîtrisé', 'Perfectionné', 'Transcendé'];

/** Plafond de palier selon l'âge (section 7). Le trait Prodige ajoute un palier, jamais plus. */
export function maxTierForAge(ageAns: number, prodige = false): MasteryTier {
  let base: number;
  if (ageAns < 10) base = 1;
  else if (ageAns < 14) base = 2;
  else if (ageAns < 18) base = 3;
  else if (ageAns < 25) base = 4;
  else base = 5;
  return Math.min(5, base + (prodige ? 1 : 0)) as MasteryTier;
}

export function exigence(def: MasteryDef, palier: 1 | 2 | 3 | 4 | 5): ExigencePalier {
  return { ...EXIGENCES_DEFAUT[palier], ...(def.exigences?.[palier] ?? {}) };
}

/** Âge minimum pour apprendre une technique d'un rang donné (section 6). */
export const AGE_RANG_TECHNIQUE: Record<RangTechnique, number> = { E: 0, D: 6, C: 12, B: 14, A: 18, S: 25, SS: 30 };

/** Rang maximal copiable par le Sharingan selon son palier. */
export const RANG_COPIE_PAR_PALIER: Record<number, RangTechnique | undefined> = { 0: undefined, 1: undefined, 2: 'C', 3: 'B', 4: 'A', 5: 'S' };
const ORDRE_RANGS: RangTechnique[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'];

export function nouvelleMaitrise(def: MasteryDef, potential: number, source: MasteryState['source'] = 'creation'): MasteryState {
  const eveillable = !!def.eveil;
  return {
    id: def.id,
    kind: def.kind,
    potential: Math.round(potential),
    awakened: !eveillable,
    tier: 0,
    trainingDays: 0,
    combatUses: 0,
    strain: 0,
    source,
  };
}

// ── Porteur : joueur ou PNJ, même modèle (section 7, dernière règle) ──

export interface Porteur {
  maitrises: Record<string, MasteryState>;
  age: number;
  prodige: boolean;
  jour: number;
  drapeau: (cle: string) => boolean;
}

export function porteurJoueur(s: GameState): Porteur {
  return { maitrises: s.maitrises, age: age(s), prodige: estProdige(s), jour: s.jour, drapeau: (k) => drapeauVrai(s, k) };
}

export function porteurPnj(s: GameState, id: string): Porteur | undefined {
  const st = s.pnj[id];
  const def = defPnj(s, id);
  if (!st || !def) return undefined;
  return {
    maitrises: st.maitrises,
    age: ageA(st.naissance, s.jour),
    prodige: !!def.prodige,
    jour: s.jour,
    drapeau: (k) => drapeauVrai(s, `${id}:${k}`),
  };
}

export type RaisonBlocage = 'max' | 'eveil' | 'bloquee' | 'age' | 'entrainement' | 'combat' | 'temps' | 'drapeau' | 'prerequis' | 'oeil';

/** Le genjutsu plafonne à ce palier : au-delà, seul un œil qui voit à travers les illusions peut le porter. */
export const PALIER_MAX_GENJUTSU = 3;
/** Les dōjutsu qui comprennent le genjutsu (éveillés). Le Byakugan voit le chakra, pas l'illusion. */
export const DOJUTSU_GENJUTSU = ['sharingan', 'mangekyo', 'rinnegan'];

/** Le genjutsu pur (la discipline et ses techniques hors clan), soumis au plafond sans œil. */
export function estGenjutsu(id: string): boolean {
  const def = R.maitrises[id];
  return id === 'genjutsu' || (def?.technique?.categorie === 'genjutsu' && !def.clan);
}

export function oeilDuGenjutsu(maitrises: Record<string, MasteryState>): boolean {
  return DOJUTSU_GENJUTSU.some((d) => maitrises[d]?.awakened && (maitrises[d]?.tier ?? 0) >= 1);
}

/** Explique ce qui empêche le palier suivant ; undefined si rien ne l'empêche. */
export function blocagePalier(p: Porteur, id: string): RaisonBlocage | undefined {
  const ms = p.maitrises[id];
  const def = R.maitrises[id];
  if (!ms || !def) return 'max';
  const next = ms.tier + 1;
  if (next > 5) return 'max';
  if (def.eveil && !ms.awakened) return 'eveil';
  if (ms.bloquee) return 'bloquee';
  // Pour un pouvoir à éveil, le palier 1 ne vient que de l'éveil.
  if (def.eveil && next === 1) return 'eveil';
  if (p.drapeau(`greffe:${id}`) && next > PALIER_MAX_GREFFE) return 'max';
  if (next > PALIER_MAX_GENJUTSU && estGenjutsu(id) && !oeilDuGenjutsu(p.maitrises)) return 'oeil';
  const req = exigence(def, next as 1 | 2 | 3 | 4 | 5);
  if (ms.trainingDays < req.jours) return 'entrainement';
  // Règle : l'entraînement seul plafonne au palier 2.
  if (ms.combatUses < req.combats || (next >= 3 && ms.combatUses < Math.max(1, req.combats))) return 'combat';
  if (req.moisDepuisEveil && (ms.awakenedAtDay === undefined || p.jour - ms.awakenedAtDay < req.moisDepuisEveil * JOURS_MOIS))
    return 'temps';
  if (req.drapeau && !p.drapeau(`${req.drapeau}:${id}`)) return 'drapeau';
  for (const pr of def.prerequis ?? []) {
    if ((p.maitrises[pr.maitrise]?.tier ?? 0) < pr.palierMin) return 'prerequis';
  }
  // Une fusion ne dépasse jamais d'un palier la plus faible de ses deux natures.
  if (def.composantes) {
    const plusFaible = Math.min(...def.composantes.map((e) => p.maitrises[`nature_${e}`]?.tier ?? 0));
    if (next > plusFaible + 1) return 'prerequis';
  }
  if (req.ageMin !== undefined && p.age < req.ageMin) return 'age';
  // Armes et taijutsu : pas de plafond d'âge, seule l'expérience compte. Le chakra, lui, mûrit avec le corps.
  if (!def.sansPlafondAge && next > maxTierForAge(p.age, p.prodige)) return 'age';
  return undefined;
}

export interface EtatProgression {
  tier: number;
  prochain?: number;
  /** Jours d'entraînement accumulés et requis pour le palier suivant. */
  jours: number;
  requis: number;
  pct: number;
  /** Ce qui bloquera le palier suivant même avec assez d'entraînement. */
  mur?: RaisonBlocage;
  murTexte?: string;
  /** L'entraînement ne peut plus rien apporter tant que le mur tient. */
  inutile: boolean;
}

/** Où en est une maîtrise : barre vers le palier suivant, et le « mur » (âge, combat…) que l'entraînement ne franchit pas. */
export function etatProgression(s: GameState, id: string): EtatProgression | undefined {
  const p = porteurJoueur(s);
  const ms = s.maitrises[id];
  const def = R.maitrises[id];
  if (!ms || !def) return undefined;
  const next = ms.tier + 1;
  if (next > 5) return { tier: ms.tier, jours: 0, requis: 0, pct: 1, mur: 'max', murTexte: 'Sommet atteint.', inutile: true };
  if (drapeauVrai(s, `greffe:${id}`) && next > PALIER_MAX_GREFFE)
    return { tier: ms.tier, jours: 0, requis: 0, pct: 1, mur: 'max', murTexte: 'Œil greffé : il n’ira pas plus loin.', inutile: true };
  const req = exigence(def, next as 1 | 2 | 3 | 4 | 5);
  const fictif: Porteur = { ...p, maitrises: { ...p.maitrises, [id]: { ...ms, trainingDays: Number.MAX_SAFE_INTEGER } } };
  const mur = blocagePalier(fictif, id);
  let murTexte: string | undefined;
  if (mur === 'age') {
    let a = p.age;
    while (a < 60 && ((!def.sansPlafondAge && next > maxTierForAge(a, p.prodige)) || (req.ageMin !== undefined && a < req.ageMin))) a++;
    murTexte = `Palier ${next} pas avant ${a} ans.`;
  } else if (mur === 'combat') murTexte = `Palier ${next} : il faut de l’expérience réelle (combats ${ms.combatUses}/${Math.max(1, req.combats)}).`;
  else if (mur === 'temps') murTexte = `Palier ${next} : ton pouvoir doit d’abord se stabiliser avec le temps.`;
  else if (mur === 'prerequis') murTexte = `Palier ${next} : une autre maîtrise doit progresser d’abord.`;
  else if (mur === 'drapeau') murTexte = `Palier ${next} : il faut un maître ou un événement.`;
  else if (mur === 'oeil') murTexte = `Palier ${next} : l’illusion ne va pas plus loin sans un œil qui la comprend (Sharingan, Mangekyō, Rinnegan).`;
  else if (mur === 'eveil') murTexte = 'Pas encore éveillé.';
  else if (mur === 'bloquee') murTexte = 'Inexécutable pour l’instant.';
  const pct = req.jours > 0 ? Math.min(1, ms.trainingDays / req.jours) : 1;
  return { tier: ms.tier, prochain: next, jours: ms.trainingDays, requis: req.jours, pct, mur, murTexte, inutile: !!mur && (mur === 'oeil' || ms.trainingDays >= req.jours) };
}

export function canAdvanceTier(p: Porteur, id: string): boolean {
  return blocagePalier(p, id) === undefined;
}

/** Fait progresser une maîtrise tant que ses exigences sont remplies. Renvoie les paliers franchis. */
export function progresser(p: Porteur, id: string): number[] {
  const franchis: number[] = [];
  let garde = 0;
  while (canAdvanceTier(p, id) && garde++ < 6) {
    const ms = p.maitrises[id];
    ms.tier = (ms.tier + 1) as MasteryTier;
    ms.palierDepuis = p.jour;
    franchis.push(ms.tier);
  }
  return franchis;
}

export function tauxProgression(s: GameState, id: string, mentor: boolean): number {
  const ms = s.maitrises[id];
  const def = R.maitrises[id];
  if (!ms || !def) return 0;
  if (s.blessures.some((b) => b.gravite >= 3)) return 0;
  let t = 0.5 + ms.potential / 100;
  if (mentor) t *= 1.3;
  if (s.jauges.sante < 40) t *= 0.5;
  t *= Math.max(0.2, 1 - s.jauges.fatigue / 120);
  if (estProdige(s)) t *= 1.5;
  if (drapeauVrai(s, 'heritage_mentor')) t *= 1.2;
  if (def.kind === 'jutsu' && drapeauVrai(s, 'heritage_esprit')) t *= 1.25;
  // Une nature qui n'est pas ton affinité innée s'apprend lentement ; plus vite si ton village l'enseigne.
  if (def.kind === 'element' && def.element && def.element !== s.creation.element) {
    t *= R.villages[s.creation.village]?.naturesEnseignees.includes(def.element) ? 0.75 : 0.55;
  }
  if (s.creation.traits.includes('determine')) t *= 1.1;
  if (s.creation.clan === 'sans_clan' && def.kind !== 'clan') t *= 1.15;
  if (s.creation.difficulte === 'recit') t *= 1.2;
  if (s.creation.difficulte === 'legende') t *= 0.85;
  return t;
}

function annoncerPaliers(s: GameState, id: string, franchis: number[], ctx: Ctx): void {
  const def = R.maitrises[id];
  for (const n of franchis) {
    ctx.changements.push({ t: 'palier', maitrise: id, palier: n });
    s.drapeaux[`palier:${id}`] = n;
    s.drapeaux['max_palier'] = Math.max(Number(s.drapeaux['max_palier']) || 0, n);
    const nom = def?.paliers[n]?.nom ?? NOMS_PALIERS[n];
    ajouterJournal(s, `${def?.nom ?? id} : palier ${n} atteint (${nom}).`, n >= 3 ? 3 : 2);
  }
}

/** Entraînement : le temps passé n'est jamais gratuit et les paliers restent plafonnés par l'âge. */
export function applyTraining(s: GameState, id: string, jours: number, mentor: boolean, ctx: Ctx): void {
  const ms = s.maitrises[id];
  const def = R.maitrises[id];
  if (!ms || !def) return;
  if (def.eveil && !ms.awakened) {
    ctx.changements.push({ t: 'info', message: `${def.nom} sommeille encore : aucun entraînement ne peut le forcer à s'éveiller.` });
    return;
  }
  if (ms.bloquee) {
    ctx.changements.push({ t: 'info', message: `${def.nom} reste inexécutable pour l'instant.` });
    return;
  }
  const taux = tauxProgression(s, id, mentor);
  if (taux === 0) {
    ctx.changements.push({ t: 'info', message: `Ta blessure t'empêche de progresser en ${def.nom}.` });
    return;
  }
  ms.trainingDays = Math.round((ms.trainingDays + jours * taux) * 10) / 10;
  ms.lastUsedDay = s.jour;
  const franchis = progresser(porteurJoueur(s), id);
  annoncerPaliers(s, id, franchis, ctx);
  // Les murs (âge, expérience) ne sont plus répétés à chaque bloc : l'écran d'entraînement les affiche en rouge.
}

/** Usage réel (combat, mission) : compte pour les paliers 3 et plus. */
export function applyCombatExperience(s: GameState, ids: string[], ctx: Ctx): void {
  const vus = new Set<string>();
  for (const id of ids) {
    if (vus.has(id)) continue;
    vus.add(id);
    const ms = s.maitrises[id];
    if (!ms || !ms.awakened || ms.bloquee) continue;
    const def = R.maitrises[id];
    if (!def) continue;
    // Un pouvoir latent ne gagne pas d'expérience ; une compétence de base, si.
    if (def.eveil && ms.tier < 1) continue;
    ms.combatUses += 1;
    ms.lastUsedDay = s.jour;
    annoncerPaliers(s, id, progresser(porteurJoueur(s), id), ctx);
  }
}

function eveiller(ms: MasteryState, jour: number, ageAns: number): void {
  ms.awakened = true;
  ms.awakenedAtDay = jour;
  ms.awakenedAtAge = ageAns;
  // Un éveil donne toujours le palier 1, jamais davantage.
  ms.tier = 1;
  ms.palierDepuis = jour;
}

export interface ResultatEveil {
  tente: boolean;
  reussi: boolean;
}

/** Tentative d'éveil sous un déclencheur narratif. Probabilité fondée sur le potentiel caché. */
export function resolveAwakening(s: GameState, id: string, intensite: number, ctx: Ctx): ResultatEveil {
  const def = R.maitrises[id];
  const ms = s.maitrises[id];
  if (!def?.eveil || !ms || ms.awakened) return { tente: false, reussi: false };
  const ev = def.eveil;
  const a = age(s);
  if (ev.unique && s.drapeaux[`eveil_tente:${id}`]) return { tente: false, reussi: false };
  if (a < ev.ageMin || a > ev.ageMax) return { tente: false, reussi: false };
  if (ev.declencheur && !drapeauVrai(s, ev.declencheur)) return { tente: false, reussi: false };
  for (const pr of def.prerequis ?? []) {
    if ((s.maitrises[pr.maitrise]?.tier ?? 0) < pr.palierMin) return { tente: false, reussi: false };
  }
  if (ev.unique) s.drapeaux[`eveil_tente:${id}`] = true;
  if (ms.potential < ev.potentielMin) return { tente: true, reussi: false };
  let chance = ev.chanceBase + intensite / 100 + (ms.potential - 50) / 200;
  if (s.attributs.controleEmotionnel < 40) chance += 0.08;
  if (alea(s) >= chance) return { tente: true, reussi: false };
  eveiller(ms, s.jour, a);
  ctx.changements.push({ t: 'eveil', maitrise: id });
  s.drapeaux[`eveil:${id}`] = a;
  if (def.composantes) s.drapeaux['fusion'] = id;
  s.drapeaux['eveils_evenement'] = (Number(s.drapeaux['eveils_evenement']) || 0) + 1;
  if (id === 'mangekyo') tirerPouvoirsMangekyo(s, ctx);
  ajouterJournal(s, `Éveil : ${def.nom}, à ${a} ans.`, 3);
  return { tente: true, reussi: true };
}

/** Chaque Mangekyō est unique : deux pouvoirs tirés parmi cinq (Susanoo vient à tous ceux qui le maîtrisent). */
const POUVOIRS_MANGEKYO = ['tsukuyomi', 'amaterasu', 'kamui', 'kotoamatsukami', 'izanagi'];
export function tirerPouvoirsMangekyo(s: GameState, ctx: Ctx): string[] {
  const restants = [...POUVOIRS_MANGEKYO];
  const choisis: string[] = [];
  for (let i = 0; i < 2; i++) choisis.push(restants.splice(Math.floor(alea(s) * restants.length), 1)[0]);
  for (const p of choisis) s.drapeaux[`mgk:${p}`] = true;
  ctx.changements.push({ t: 'info', message: `Ton Mangekyō porte deux pouvoirs : ${choisis.map((p) => R.maitrises[p]?.nom ?? p).join(' et ')}.` });
  ajouterJournal(s, `Ton Mangekyō s’ouvre sur ${choisis.map((p) => R.maitrises[p]?.nom ?? p).join(' et ')}.`, 3);
  return choisis;
}

/**
 * Liaison Uchiha–Senju : un Sharingan éveillé dans un corps qui porte la force des Senju (par le sang ou par des
 * cellules greffées) prépare le Rinnegan. Il s'éveille plus tard, une nuit de fièvre (scène « x_rinnegan »).
 */
export function liaisonSenjuUchiha(s: GameState, ctx: Ctx): void {
  const sh = s.maitrises['sharingan'];
  if (!sh?.awakened) return;
  const senju = s.creation.clan === 'senju' || drapeauVrai(s, 'cellules_senju');
  if (!senju) return;
  if (!s.maitrises['rinnegan']) {
    s.maitrises['rinnegan'] = nouvelleMaitrise(R.maitrises['rinnegan'], 60, 'heritage');
    s.drapeaux['liaison_senju_uchiha'] = true;
    ctx.changements.push({ t: 'info', message: 'Deux sangs se cherchent en toi. Tes yeux brûlent parfois, la nuit.' });
    ajouterJournal(s, 'Le sang Uchiha et la force des Senju commencent à se lier en toi.', 3);
  }
  const rin = s.maitrises['rinnegan'];
  const prevu = s.planifies.some((p) => p.evenementId === 'x_rinnegan') || s.evenementsVus['x_rinnegan'];
  if (!rin.awakened && !prevu && sh.tier >= 3 && age(s) >= 16) s.planifies.push({ evenementId: 'x_rinnegan', jour: s.jour + 20 });
}

/** Palier maximal d'un œil greffé : il ne sera jamais tout à fait le tien. */
export const PALIER_MAX_GREFFE = 3;

/**
 * Greffe d'un dōjutsu venu d'un autre (acheté au marché noir, offert par un mourant, volé sur un cadavre…).
 * L'œil arrive éveillé au palier 1, mais il ronge la réserve de chakra et plafonne au palier 3.
 */
export function greffer(s: GameState, id: string, ctx: Ctx): boolean {
  const def = R.maitrises[id];
  if (!def) return false;
  const deja = s.maitrises[id];
  if (deja?.awakened) {
    ctx.changements.push({ t: 'info', message: `Tu possèdes déjà ${def.nom}.` });
    return false;
  }
  const ms = deja ?? nouvelleMaitrise(def, 40 + s.attributs.controleChakra / 3, 'greffe');
  eveiller(ms, s.jour, age(s));
  ms.source = 'greffe';
  s.maitrises[id] = ms;
  s.drapeaux[`greffe:${id}`] = true;
  s.drapeaux['oeil_greffe'] = id;
  // Un Sharingan greffé peut lui aussi, un jour, devenir Mangekyō.
  if (id === 'sharingan' && !s.maitrises['mangekyo']) s.maitrises['mangekyo'] = nouvelleMaitrise(R.maitrises['mangekyo'], 50, 'greffe');
  s.jauges.chakraMax = Math.max(10, s.jauges.chakraMax - 15);
  ctx.changements.push({ t: 'eveil', maitrise: id });
  ctx.changements.push({ t: 'stat', chemin: 'jauges.chakraMax', delta: -15 });
  ajouterJournal(s, `Un œil qui n’était pas le tien : ${def.nom}, greffé à ${age(s)} ans.`, 3);
  return true;
}

/** Éveil narratif d'un PNJ (ex. le rival qui éveille son pouvoir) : mêmes fenêtres d'âge que pour le joueur. */
export function eveillerPnj(s: GameState, ref: string, id: string, ctx: Ctx): boolean {
  const pid = ref.startsWith('@') ? s.roles[ref.slice(1)] : ref;
  const p = pid ? porteurPnj(s, pid) : undefined;
  const def = R.maitrises[id];
  const ms = p?.maitrises[id];
  if (!p || !def?.eveil || !ms || ms.awakened) return false;
  if (p.age < def.eveil.ageMin || p.age > def.eveil.ageMax || ms.potential < def.eveil.potentielMin) return false;
  eveiller(ms, s.jour, p.age);
  ctx.changements.push({ t: 'info', message: `${defPnj(s, pid)?.nom} a éveillé ${def.nom}.` });
  return true;
}

/** Tente l'éveil de tous les pouvoirs sensibles au danger que possède le joueur. */
export function eveilSousDanger(s: GameState, intensite: number, ctx: Ctx): void {
  for (const id of Object.keys(s.maitrises)) {
    const def = R.maitrises[id];
    if (def?.eveil?.danger) resolveAwakening(s, id, intensite, ctx);
  }
}

/** Éveils portés par l'éducation du clan (ex. Byakugan, colonie Aburame), vérifiés à chaque passage du temps. */
export function eveilsAutomatiques(s: GameState, ctx: Ctx): void {
  const a = age(s);
  for (const id of Object.keys(s.maitrises)) {
    const ms = s.maitrises[id];
    const def = R.maitrises[id];
    const auto = def?.eveil?.automatique;
    if (!def || auto === undefined || ms.awakened) continue;
    const prerequisOk = (def.prerequis ?? []).every((pr) => (s.maitrises[pr.maitrise]?.tier ?? 0) >= pr.palierMin);
    if (a >= auto && ms.potential >= (def.eveil?.potentielMin ?? 0) && prerequisOk) {
      eveiller(ms, s.jour, a);
      ctx.changements.push({ t: 'eveil', maitrise: id });
      s.drapeaux[`eveil:${id}`] = a;
      if (def.composantes) {
        s.drapeaux['fusion'] = id;
        ajouterJournal(s, `Tes deux natures se rencontrent : ${def.nom} s'éveille (${a} ans).`, 3);
      } else ajouterJournal(s, `Au fil de l'éducation du clan, ${def.nom} s'éveille (${a} ans).`, 3);
    }
  }
  liaisonSenjuUchiha(s, ctx);
}

/** Les PNJ suivent exactement le même modèle de progression que le joueur. */
export function progressionPnj(s: GameState, jours: number): void {
  for (const [id, st] of Object.entries(s.pnj)) {
    if (st.etat === 'mort' || st.etat === 'disparu') continue;
    const def = defPnj(s, id);
    const p = porteurPnj(s, id);
    if (!def || !p) continue;
    for (const [mid, ms] of Object.entries(st.maitrises)) {
      const mdef = R.maitrises[mid];
      if (!mdef) continue;
      if (mdef.eveil && !ms.awakened) {
        const auto = mdef.eveil.automatique;
        const prerequisOk = (mdef.prerequis ?? []).every((pr) => (st.maitrises[pr.maitrise]?.tier ?? 0) >= pr.palierMin);
        if (auto !== undefined && p.age >= auto && ms.potential >= mdef.eveil.potentielMin && prerequisOk) eveiller(ms, s.jour, p.age);
        continue;
      }
      if (mdef.nonEntrainable) continue;
      ms.trainingDays += jours * def.rythme * 0.5;
      if (p.age >= 12) ms.combatUses += (jours / 60) * def.rythme;
      progresser(p, mid);
    }
  }
}

function rangAutorise(rang: RangTechnique, max: RangTechnique): boolean {
  return ORDRE_RANGS.indexOf(rang) <= ORDRE_RANGS.indexOf(max);
}

/** Apprendre une technique exige une source, l'affinité, l'âge et du temps : elle commence au palier 1. */
export function apprendreTechnique(s: GameState, id: string, source: MasteryState['source'], ctx: Ctx): boolean {
  const def = R.maitrises[id];
  if (!def) return false;
  const existante = s.maitrises[id];
  if (existante && existante.tier >= 1 && !existante.bloquee) {
    ctx.changements.push({ t: 'info', message: `Tu connais déjà ${def.nom}.` });
    return false;
  }
  if (def.kekkeiGenkai && def.clan && def.clan !== s.creation.clan && !porteLignee(s, def.clan)) {
    ctx.changements.push({ t: 'info', message: `${def.nom} est une technique héréditaire : elle ne s'apprend pas hors de sa lignée.` });
    return false;
  }
  const a = age(s);
  if (def.rang && a < ageMinTechnique(s, def).age) {
    ctx.changements.push({ t: 'info', message: `${def.nom} (rang ${def.rang}) dépasse ce que ton corps peut supporter à ${a} ans.` });
    return false;
  }
  if (def.element && !possedeElementTech(s, def.element)) {
    ctx.changements.push({ t: 'info', message: `${def.nom} exige une affinité que tu ne possèdes pas.` });
    return false;
  }
  const ms = existante ?? nouvelleMaitrise(def, 40 + s.attributs.intellect / 2, source);
  ms.awakened = true;
  ms.bloquee = false;
  ms.tier = 1;
  ms.source = source;
  s.maitrises[id] = ms;
  ctx.changements.push({ t: 'technique', maitrise: id, message: `Nouvelle technique : ${def.nom}.` });
  ajouterJournal(s, `Technique apprise : ${def.nom}.`, 2);
  s.drapeaux['techniques_apprises'] = (Number(s.drapeaux['techniques_apprises']) || 0) + 1;
  if (def.technique?.categorie === 'combinaison') s.drapeaux['combinaison_apprise'] = true;
  if (def.rang && a < AGE_RANG_TECHNIQUE[def.rang]) s.drapeaux['technique_precoce'] = true;
  return true;
}

/** Seuil de réserve de chakra qui permet d'apprendre une technique avant l'âge. */
const RESERVE_PRECOCE: Record<RangTechnique, number> = { E: 0, D: 45, C: 75, B: 115, A: 170, S: 240, SS: 320 };

/** Un sang inconnu peut porter la lignée d'un clan (Mokuton des Senju, Hyōton des Yuki) : ses techniques lui sont ouvertes. */
export function porteLignee(s: GameState, clan?: string): boolean {
  if (!clan) return false;
  return s.tirages.lignees.some((id) => R.maitrises[id]?.clan === clan && s.maitrises[id]?.awakened);
}

/**
 * Âge minimal pour apprendre une technique. Le rang fixe l'âge normal ; une intelligence vive,
 * un contrôle fin, une grande réserve de chakra, le talent de prodige ou l'héritage « Esprit vif »
 * l'avancent chacun d'un an, jusqu'à trois ans d'avance, jamais avant 6 ans.
 */
export function ageMinTechnique(s: GameState, def: MasteryDef): { age: number; normal: number; raisons: string[] } {
  const normal = def.rang ? AGE_RANG_TECHNIQUE[def.rang] : 0;
  if (!def.rang || normal <= 6) return { age: normal, normal, raisons: [] };
  const raisons: string[] = [];
  const enseignee = drapeauVrai(s, `enseigne_clan:${def.id}`);
  if (enseignee) raisons.push('l’enseignement de ton clan');
  if (s.attributs.intellect >= 60) raisons.push('ton intelligence');
  if (s.attributs.controleChakra >= 60) raisons.push('ton contrôle du chakra');
  if (s.jauges.chakraMax >= RESERVE_PRECOCE[def.rang]) raisons.push('ta réserve de chakra');
  if (estProdige(s)) raisons.push('ton talent de prodige');
  if (drapeauVrai(s, 'heritage_esprit')) raisons.push('ton esprit vif');
  const avance = Math.min(3, enseignee ? 3 : raisons.length);
  return { age: Math.max(6, normal - avance), normal, raisons: raisons.slice(0, avance) };
}

/** Mélanger deux natures demande de les avoir façonnées (palier 2), sauf pour un esprit vif ou un prodige (palier 1). */
export function paliersCombinaison(s: GameState): number {
  return estProdige(s) || s.attributs.intellect >= 60 || s.attributs.controleChakra >= 65 ? 1 : 2;
}

/** Peut-on apprendre cette technique maintenant ? Renvoie la première raison qui l'empêche. */
export function blocageApprentissage(s: GameState, id: string): string | undefined {
  const def = R.maitrises[id];
  const t = def?.technique;
  if (!def || !t) return 'Technique inconnue.';
  if ((s.maitrises[id]?.tier ?? 0) >= 1) return 'Déjà apprise.';
  if (def.clan && def.clan !== s.creation.clan && !porteLignee(s, def.clan)) return 'Technique d’un autre clan.';
  if (t.drapeau && !drapeauVrai(s, t.drapeau)) return 'Ce pouvoir n’appartient pas à tes yeux.';
  if (t.categorie === 'combinaison' && t.elements) {
    // Trois natures : un palier de plus que pour une combinaison à deux.
    const palier = paliersCombinaison(s) + (t.elements.length >= 3 ? 1 : 0);
    for (const e of t.elements) {
      if ((s.maitrises[`nature_${e}`]?.tier ?? 0) < palier) {
        const nom = R.maitrises[`nature_${e}`]?.nom ?? e;
        return palier <= 1 ? `Exige ${nom}.` : `Exige ${nom} au palier ${palier} (un de moins pour un esprit vif ou un prodige).`;
      }
    }
  }
  for (const r of t.requis ?? []) {
    if ((s.maitrises[r.maitrise]?.tier ?? 0) < r.palierMin) {
      const nom = R.maitrises[r.maitrise]?.nom ?? r.maitrise;
      return r.palierMin <= 1 ? `Exige ${nom}.` : `Exige ${nom} au palier ${r.palierMin}.`;
    }
  }
  if (def.element && !possedeElementTech(s, def.element)) return `Exige la nature ${R.elements[def.element]?.nom}.`;
  if (t.enseignee === 'village' && s.statut !== 'actif') return 'Enseignée seulement au village.';
  if (typeof t.enseignee === 'object' && !drapeauVrai(s, t.enseignee.drapeau)) return `Seul ${t.enseignee.maitre} peut te l’enseigner.`;
  const a = age(s);
  const m = ageMinTechnique(s, def);
  if (a < m.age) return `Rang ${def.rang} : pas avant ${m.age} ans${m.age < m.normal ? ` (au lieu de ${m.normal}, grâce à ${m.raisons.join(' et ')})` : ''}.`;
  if (s.jauges.chakraMax < t.chakra * 2) return `Réserve de chakra insuffisante (${t.chakra * 2} requis).`;
  return undefined;
}

function possedeElementTech(s: GameState, el: string): boolean {
  if (s.creation.element === el) return true;
  return (s.maitrises[`nature_${el}`]?.tier ?? 0) >= 1;
}

/**
 * Ce que le clan (ou un aîné) enseigne à un enfant : la technique s'apprend même sans l'affinité,
 * et la nature qui va avec s'éveille au palier 1. Elle ouvre la porte à l'étude de cette nature.
 */
export function enseignerTechnique(s: GameState, id: string, ctx: Ctx): boolean {
  const def = R.maitrises[id];
  if (!def) return false;
  s.drapeaux[`enseigne_clan:${id}`] = true;
  if (def.element && !possedeElementTech(s, def.element)) {
    const nature = `nature_${def.element}`;
    const nms = nouvelleMaitrise(R.maitrises[nature], 45 + s.attributs.controleChakra / 2, 'mentor');
    nms.awakened = true;
    nms.tier = 1;
    s.maitrises[nature] = nms;
    s.drapeaux['natures_apprises'] = (Number(s.drapeaux['natures_apprises']) || 0) + 1;
    ctx.changements.push({ t: 'info', message: `Pour apprendre ${def.nom}, ton chakra a dû se plier à une nature nouvelle : ${R.elements[def.element]?.nom} s’éveille en toi.` });
    ajouterJournal(s, `Le clan t’ouvre une nature qui n’était pas la tienne : ${R.elements[def.element]?.nom}.`, 2);
  }
  return apprendreTechnique(s, id, 'mentor', ctx);
}

/** Copier n'est pas maîtriser : palier 1, affinité requise, kekkei genkai non copiables. */
export function copierTechnique(s: GameState, id: string, ctx: Ctx): boolean {
  const def = R.maitrises[id];
  const sharingan = s.maitrises['sharingan'];
  if (!def || !sharingan || !sharingan.awakened) return false;
  const max = RANG_COPIE_PAR_PALIER[sharingan.tier];
  if (!max || !def.rang) {
    ctx.changements.push({ t: 'info', message: `Ton Sharingan n'est pas assez stable pour copier quoi que ce soit.` });
    return false;
  }
  if (def.kekkeiGenkai || def.copiable === false || def.kind === 'clan') {
    ctx.changements.push({ t: 'info', message: `${def.nom} ne peut pas être copiée : elle appartient au sang de son porteur.` });
    return false;
  }
  if (!rangAutorise(def.rang, max)) {
    ctx.changements.push({ t: 'info', message: `${def.nom} est trop complexe pour ton Sharingan actuel.` });
    return false;
  }
  if (s.maitrises[id] && s.maitrises[id].tier >= 1) return false;
  const ms = nouvelleMaitrise(def, 40 + s.attributs.intellect / 2, 'copie');
  ms.awakened = true;
  ms.tier = 1;
  const a = age(s);
  const corpsPret = a >= AGE_RANG_TECHNIQUE[def.rang];
  // Le Sharingan d'un Uchiha copie jusqu'à la nature elle-même : c'est ainsi qu'il porte toutes les natures.
  if (def.element && corpsPret && !possedeElementTech(s, def.element) && s.creation.clan === 'uchiha') {
    const nature = `nature_${def.element}`;
    const nms = nouvelleMaitrise(R.maitrises[nature], 50 + s.attributs.controleChakra / 2, 'copie');
    nms.awakened = true;
    nms.tier = 1;
    s.maitrises[nature] = nms;
    s.drapeaux['natures_apprises'] = (Number(s.drapeaux['natures_apprises']) || 0) + 1;
    ctx.changements.push({ t: 'info', message: `Ton Sharingan a lu jusqu’à la nature de son chakra : ${R.elements[def.element]?.nom} s’éveille en toi.` });
  }
  const affinite = !def.element || possedeElementTech(s, def.element);
  ms.bloquee = !(corpsPret && affinite);
  s.maitrises[id] = ms;
  ctx.changements.push({
    t: 'technique',
    maitrise: id,
    message: ms.bloquee
      ? `${def.nom} est gravée dans ta mémoire, mais tu ne peux pas encore l'exécuter.`
      : `${def.nom} copiée : tu en as les notions, pas la maîtrise.`,
  });
  ajouterJournal(s, `Technique copiée par le Sharingan : ${def.nom}${ms.bloquee ? ' (inexécutable pour l’instant)' : ''}.`, 2);
  return true;
}

/** Palier effectif en situation réelle : un palier 1 est instable, la rouille pèse au-delà du palier 2. */
export function tierEffectif(ms: MasteryState | undefined, jour: number): number {
  if (!ms || !ms.awakened || ms.bloquee) return 0;
  if (ms.tier === 1) return 0.5;
  const rouille = ms.tier >= 3 && ms.lastUsedDay !== undefined && jour - ms.lastUsedDay > 720;
  return ms.tier - (rouille ? 0.5 : 0);
}
