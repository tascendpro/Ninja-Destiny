// L'adversaire est un personnage (§8) : un gabarit de niveau, un tempérament, des habitudes, une mémoire.
// Son intention se choisit par pondération déterministe, jamais par script fixe.

import type { GameState, TechniqueAdverse } from '../types';
import { R } from '../registre';
import { age } from '../calendrier';
import { defPnj, resoudrePnj } from '../etat';
import type { AdversaireDef, EtatAffrontement, IntentionAdv, NiveauAdv, StatsAdv, Temperament } from './types';
import { INTENTIONS, NIVEAUX } from './types';
import { PREFIXE_GENERIQUE, adversaireGenerique, identiteGeneree } from './generique';
import { GABARITS, indexNiveau, niveauJoueur } from './contextes';
import { effetsMoral, moralDe } from './esprit';
import { aEtat, modificateurs } from './etats';
import { majeureDe, phaseCourante } from './boss';

export function adversaireDef(id: string): AdversaireDef {
  if (id.startsWith(PREFIXE_GENERIQUE)) return adversaireGenerique(id);
  const d = R.contenu.racine.adversaires.find((a) => a.id === id);
  if (!d) throw new Error(`Adversaire inconnu : ${id}`);
  return d;
}

/** Le niveau réel : fixe, ou celui du joueur pour un rival qui grandit avec lui. */
export function niveauAdversaire(s: GameState, d: AdversaireDef): NiveauAdv {
  if (d.niveau !== 'selon_age') return d.niveau;
  if (!d.ecartNiveau) return niveauJoueur(s);
  const i = indexNiveau(niveauJoueur(s)) + d.ecartNiveau;
  return NIVEAUX[Math.max(1, Math.min(NIVEAUX.indexOf('kage'), i))];
}

export function statsAdversaire(s: GameState, d: AdversaireDef): StatsAdv {
  const base = GABARITS[niveauAdversaire(s, d)];
  const st = { ...base, ...(d.stats ?? {}) };
  // Plusieurs ennemis tiennent plus longtemps qu'un seul ; chacun frappe comme un seul.
  if (d.escouade) st.endurance = Math.round(st.endurance * 1.3);
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
  if (d.nomGenere) return identiteGeneree(s, d).nom;
  return d.nom ?? 'L’adversaire';
}

/** Les techniques qu'il connaît : les siennes, ou celles de son niveau (et de sa nature). */
export function techniquesAdversaire(s: GameState, d: AdversaireDef): TechniqueAdverse[] {
  const toutes = R.contenu.techniquesAdverses;
  if (d.techniques) return d.techniques.map((id) => toutes.find((t) => t.id === id)!).filter(Boolean);
  const rangMax = Math.max(0, indexNiveau(niveauAdversaire(s, d)) - 1);
  return toutes
    .filter((t) => !t.signature && t.rang <= rangMax && (!t.element || !d.nature || t.element === d.nature))
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
  // Le sadique s'acharne sur ce qui saigne ; l'honorable attend son heure ; le fanatique ne recule jamais ;
  // le terrifié cherche la sortie ; le vétéran économise ses forces et parle avant de frapper.
  sadique: { attaque: 40, technique: 25, defense: 5, observer: 5, parler: 15, fuir: 0, preparer: 10, majeure: 0 },
  honorable: { attaque: 30, technique: 30, defense: 20, observer: 10, parler: 5, fuir: 0, preparer: 5, majeure: 0 },
  fanatique: { attaque: 40, technique: 35, defense: 5, observer: 0, parler: 0, fuir: 0, preparer: 20, majeure: 0 },
  terrifie: { attaque: 20, technique: 15, defense: 25, observer: 5, parler: 15, fuir: 20, preparer: 0, majeure: 0 },
  veteran: { attaque: 25, technique: 25, defense: 20, observer: 15, parler: 10, fuir: 0, preparer: 5, majeure: 0 },
};

/**
 * La finesse tactique d'un adversaire (règles 2) : combien il lit tes habitudes. Un enfant presque pas, un élève un peu,
 * un genin à moitié, un chūnin vraiment ; un vétéran ou un froid lisent mieux que leur rang, un féroce ou un terrifié moins.
 */
export function finesseTactique(n: NiveauAdv, t: Temperament): number {
  const base = ([0.3, 0.5, 0.7, 0.9, 1, 1.1, 1.2, 0.6] as const)[NIVEAUX.indexOf(n)] ?? 1;
  const mod = t === 'veteran' || t === 'froid' ? 0.15 : t === 'feroce' || t === 'terrifie' || t === 'desespere' ? -0.15 : 0;
  return Math.max(0.2, Math.min(1.3, base + mod));
}

/** Le tempérament courant, après une éventuelle bascule. */
export function temperamentCourant(sc: EtatAffrontement, d: AdversaireDef): Temperament {
  // Un boss change de personnalité avec ses phases (§8) : la phase l'emporte sur la bascule.
  const ph = phaseCourante(sc, d)?.temperament ?? [...(sc.phases ?? [])].reverse().map((id) => d.phases?.find((p) => p.id === id)?.temperament).find(Boolean);
  if (ph) return ph;
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
  if (!majeureDe(sc, d) || sc.adv.chakra < 20) sc0.preparer = 0;
  // Personne ne fuit avant la troisième manche ; ensuite, le cran de cette rencontre décide.
  const cran = sc.cran ?? 'ordinaire';
  const mult = { lache: 1.6, ordinaire: 1, tenace: 0.45, acharne: 0 }[cran];
  if (sc.manche >= 3 && pct < (d.seuils.fuite * mult) / 100) sc0.fuir += 60;
  if (sc.manche >= 3 && pct < (d.seuils.reddition * mult) / 100) sc0.parler += 40;
  // L'acharné qui tombe ne recule pas : il jette tout ce qui lui reste.
  if (cran === 'acharne' && pct < 0.3) {
    sc0.attaque += 25;
    sc0.preparer += 20;
    sc0.fuir = 0;
  }
  if (sc.contexte === 'entrainement' || sc.contexte === 'examen') sc0.fuir = 0;
  if (sc.contexte === 'embuscade') sc0.parler = 0;
  // Lecture : il voit que tu répètes, il attend ; il voit que tu te terres, il prépare.
  // Règles 2 : ce qu'il lit dépend de ce qu'il est. Un enfant voit à peine qu'on répète ; un jōnin lit toute une série.
  const v2 = (sc.regles ?? 1) >= 2;
  const lecteur = v2 ? finesseTactique(sc.niveauAdv, sc.temperament) : 1;
  const [a1, a2] = sc.actionsJoueur.slice(-2);
  if (a1 && a1 === a2) sc0.defense += Math.round(30 * lecteur);
  if (sc.gardesConsecutives >= 2) {
    sc0.preparer += majeureDe(sc, d) ? Math.round(25 * lecteur) : 0;
    sc0.technique += Math.round(15 * lecteur);
  }
  if (v2) {
    const familles = sc.famillesJoueur ?? [];
    const dernier = sc.actionsJoueur[sc.actionsJoueur.length - 1];
    // Tu as passé la manche à observer, à te concentrer ou à souffler : il a vu une ouverture, il la prend.
    if (dernier === 'observer' || dernier === 'concentration' || dernier === 'souffle') sc0.attaque += Math.round(22 * lecteur);
    // Trois manches de suite dans la même famille : il s'y prépare (garde contre l'offensive, technique contre la défense).
    const trois = familles.slice(-3);
    if (trois.length === 3 && trois.every((f) => f === trois[0]) && lecteur >= 0.7) {
      if (trois[0] === 'taijutsu' || trois[0] === 'ninjutsu' || trois[0] === 'arme') sc0.defense += Math.round(18 * lecteur);
      if (trois[0] === 'defense') {
        sc0.technique += Math.round(12 * lecteur);
        sc0.observer += 8;
      }
    }
    // Tu as feinté et ça a marché : il attaque au lieu d'attendre, pour ne plus se faire prendre.
    if ((sc.vuesCeCombat['feinte'] ?? 0) >= 1 && lecteur >= 0.7) {
      sc0.attaque += 10;
      sc0.observer = Math.max(0, sc0.observer - 5);
    }
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
  // Son moral : la peur pousse à fuir ou à se rendre, la colère à charger (§4.3).
  const m = moralDe(sc);
  const em = effetsMoral(sc);
  sc0.fuir += em.fuite;
  sc0.parler += em.reddition;
  if (m.colere > 60) {
    sc0.attaque += 20;
    sc0.observer = Math.max(0, sc0.observer - 10);
  }
  // Sa personnalité devant ce qui se passe (§3.3).
  const pctJ = sc.joueur.endurance / sc.joueur.enduranceMax;
  if (t === 'sadique' && pctJ < 0.4) sc0.attaque += 25;
  if (t === 'honorable' && pctJ < 0.2) sc0.parler += 40;
  if (t === 'veteran' && sc.manche <= 2) sc0.parler += 10;
  if (t === 'fanatique') sc0.fuir = sc0.parler = 0;
  // Ses états : chakra bloqué, plus de techniques ; immobilisé, il ne fuit pas.
  if (modificateurs(sc.adv).sansChakra) sc0.technique = sc0.preparer = 0;
  if (aEtat(sc.adv, 'immobilise')) sc0.fuir = 0;
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
  // Une bête ne parle pas : là où un homme parlerait, elle observe.
  const pour = (k: IntentionAdv): IntentionAdv => (d.type === 'bete' && k === 'parler' ? 'observer' : k);
  for (const k of INTENTIONS) {
    x -= scores[k];
    if (x < 0) return pour(k);
  }
  return 'attaque';
}

/** Âge affiché d'un rival qui grandit avec le joueur. */
export function ageAdversaire(s: GameState): number {
  return age(s);
}
