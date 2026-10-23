// L'adversaire est un personnage (§8) : un gabarit de niveau, un tempérament, des habitudes, une mémoire.
// Son intention se choisit par pondération déterministe, jamais par script fixe.

import type { GameState, TechniqueAdverse } from '../types';
import { R } from '../registre';
import { age } from '../calendrier';
import { defPnj, resoudrePnj } from '../etat';
import type { AdversaireDef, EtatAffrontement, IntentionAdv, NiveauAdv, StatsAdv, Temperament } from './types';
import { INTENTIONS } from './types';
import { GABARITS, indexNiveau, niveauJoueur } from './contextes';

export function adversaireDef(id: string): AdversaireDef {
  const d = R.contenu.racine.adversaires.find((a) => a.id === id);
  if (!d) throw new Error(`Adversaire inconnu : ${id}`);
  return d;
}

/** Le niveau réel : fixe, ou celui du joueur pour un rival qui grandit avec lui. */
export function niveauAdversaire(s: GameState, d: AdversaireDef): NiveauAdv {
  return d.niveau === 'selon_age' ? niveauJoueur(s) : d.niveau;
}

export function statsAdversaire(s: GameState, d: AdversaireDef): StatsAdv {
  const base = GABARITS[niveauAdversaire(s, d)];
  const st = { ...base, ...(d.stats ?? {}) };
  // Un récurrent qui a perdu contre toi revient mieux préparé : il a travaillé (§13.2).
  const reg = s.registresCombat[registreDe(s, d)];
  if (reg) st.perception += Math.min(10, reg.defaites * 3);
  return st;
}

export function registreDe(s: GameState, d: AdversaireDef): string {
  return (d.pnj && resoudrePnj(s, d.pnj)) || d.id;
}

export function nomAdversaire(s: GameState, d: AdversaireDef): string {
  if (d.pnj) {
    const p = defPnj(s, resoudrePnj(s, d.pnj));
    if (p) return p.nom;
  }
  return d.nom ?? 'L’adversaire';
}

/** Les techniques qu'il connaît : les siennes, ou celles de son niveau (et de sa nature). */
export function techniquesAdversaire(s: GameState, d: AdversaireDef): TechniqueAdverse[] {
  const toutes = R.contenu.techniquesAdverses;
  if (d.techniques) return d.techniques.map((id) => toutes.find((t) => t.id === id)!).filter(Boolean);
  const rangMax = Math.max(0, indexNiveau(niveauAdversaire(s, d)) - 1);
  return toutes
    .filter((t) => t.rang <= rangMax && (!t.element || !d.nature || t.element === d.nature))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Comportement de base par tempérament (§8.3). */
const BASE: Record<Temperament, Record<IntentionAdv, number>> = {
  prudent: { attaque: 20, technique: 15, defense: 30, observer: 25, parler: 5, fuir: 5, preparer: 5, majeure: 0 },
  feroce: { attaque: 45, technique: 30, defense: 8, observer: 2, parler: 0, fuir: 0, preparer: 15, majeure: 0 },
  joueur: { attaque: 25, technique: 25, defense: 10, observer: 15, parler: 20, fuir: 0, preparer: 5, majeure: 0 },
  froid: { attaque: 25, technique: 30, defense: 15, observer: 20, parler: 2, fuir: 3, preparer: 10, majeure: 0 },
  desespere: { attaque: 40, technique: 25, defense: 5, observer: 0, parler: 10, fuir: 10, preparer: 10, majeure: 0 },
  fier: { attaque: 35, technique: 30, defense: 15, observer: 5, parler: 5, fuir: 0, preparer: 15, majeure: 0 },
};

/** Le tempérament courant, après une éventuelle bascule. */
export function temperamentCourant(sc: EtatAffrontement, d: AdversaireDef): Temperament {
  if (!d.bascule) return d.temperament;
  const pct = sc.adv.endurance / sc.adv.enduranceMax;
  const q = d.bascule.quand;
  if ((q === 'touche_deux_fois' && sc.touchesSubiesAdv >= 2) || (q === 'sous_40' && pct < 0.4) || (q === 'sous_20' && pct < 0.2)) return d.bascule.vers;
  return d.temperament;
}

/** Les scores de chaque intention à cette manche (§8.4). Exposé pour les tests et le débogage. */
export function scoresIntentions(s: GameState, sc: EtatAffrontement, d: AdversaireDef): Record<IntentionAdv, number> {
  const t = temperamentCourant(sc, d);
  const sc0 = { ...BASE[t] };
  const pct = sc.adv.endurance / sc.adv.enduranceMax;
  const techs = techniquesAdversaire(s, d);
  // Situation : ce qu'il peut faire, et ce que sa santé lui dicte.
  if (!techs.length || sc.adv.chakra < 8) sc0.technique = 0;
  if (!d.majeure || sc.adv.chakra < 20) sc0.preparer = 0;
  if (pct < d.seuils.fuite / 100) sc0.fuir += 60;
  if (pct < d.seuils.reddition / 100) sc0.parler += 40;
  if (sc.contexte === 'entrainement' || sc.contexte === 'examen') sc0.fuir = 0;
  if (sc.contexte === 'embuscade') sc0.parler = 0;
  // Lecture : il voit que tu répètes, il attend ; il voit que tu te terres, il prépare.
  const [a1, a2] = sc.actionsJoueur.slice(-2);
  if (a1 && a1 === a2) sc0.defense += 30;
  if (sc.gardesConsecutives >= 2) {
    sc0.preparer += d.majeure ? 25 : 0;
    sc0.technique += 15;
  }
  // Mémoire : un récurrent qui connaît ton ouverture l'attend dès la première manche.
  const reg = s.registresCombat[sc.registreId];
  if (sc.manche === 1 && reg && Object.values(reg.habitudesDuJoueur).some((n) => n >= 2)) sc0.defense += 40;
  // Habitudes.
  for (const h of d.habitudes) {
    const q = h.quand;
    if (q.manche !== undefined && q.manche !== sc.manche) continue;
    if (q.joueurEnGarde !== undefined && (sc.joueur.garde === 'garde') !== q.joueurEnGarde) continue;
    if (q.joueurRepete !== undefined && !!(a1 && a1 === a2) !== q.joueurRepete) continue;
    if (q.sousPct !== undefined && pct >= q.sousPct / 100) continue;
    sc0[h.intention] += h.poids;
  }
  // Provoqué, un fier ou un féroce charge.
  if (sc.provoque) sc0.attaque += 50;
  // La technique majeure ne se lance qu'après avoir été préparée (et donc annoncée).
  sc0.majeure = 0;
  for (const k of INTENTIONS) sc0[k] = Math.max(0, sc0[k]);
  if (!Object.values(sc0).some((v) => v > 0)) sc0.attaque = 1;
  return sc0;
}

/** Tirage de l'intention (tirage 1 de la manche). */
export function tirerIntention(s: GameState, sc: EtatAffrontement, d: AdversaireDef, r: number): IntentionAdv {
  if (sc.intention === 'preparer') return 'majeure';
  const scores = scoresIntentions(s, sc, d);
  const total = INTENTIONS.reduce((a, k) => a + scores[k], 0);
  let x = r * total;
  for (const k of INTENTIONS) {
    x -= scores[k];
    if (x < 0) return k;
  }
  return 'attaque';
}

/** Âge affiché d'un rival qui grandit avec le joueur. */
export function ageAdversaire(s: GameState): number {
  return age(s);
}
