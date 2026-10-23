// La résolution d'une manche (§7), en trois temps : exécution, réponse adverse, impact.
//
// ORDRE DES TIRAGES (contractuel : le modifier change l'issue des parties enregistrées) :
//   À l'ouverture du combat : 1 tirage pour le plafond de manches.
//   À l'ouverture de chaque manche : intention adverse, technique adverse, fiabilité de l'annonce, texte de l'annonce.
//   À la résolution de chaque manche, toujours sept tirages, même s'ils ne servent pas :
//     1. exécution de l'action du joueur, 2. réponse adverse, 3. exécution adverse, 4. variation d'impact (±10 %),
//     5. coup décisif, 6. texte du récit, 7. réplique.
//   À la conclusion : 1 tirage pour la mort (contexte mortel seulement, mais toujours consommé), 1 pour le texte.

import type { ElementId, GameState } from '../types';
import { R } from '../registre';
import { age } from '../calendrier';
import { avantageTechnique, estTransformation } from '../epreuves';
import { clamp } from '../etat';
import type { ActionCombat, AdversaireDef, EtatAffrontement, Famille, IssueOffensive, Vitesse } from './types';
import { ErreurCombat, FAMILLES } from './types';
import { CONTEXTES, FAMILLES_ENFANT, GABARITS, bonusRang, indexNiveau, maxFamilles } from './contextes';
import { statsAdversaire, techniquesAdversaire } from './adversaire';

// ── Le catalogue des actions ─────────────────────────────────

interface ActionTai {
  nom: string;
  vitesse: Vitesse;
  base: number;
  attribut: 'force' | 'agilite';
  k: number;
  exec: number;
  effet?: 'desequilibre';
  detail: string;
}
export const TAIJUTSU: Record<string, ActionTai> = {
  frappe_rapide: { nom: 'Frappe rapide', vitesse: 'rapide', base: 8, attribut: 'agilite', k: 0.25, exec: 0.15, detail: 'Rapide, peu de dégâts. Touché : +1 élan.' },
  coup_puissant: { nom: 'Coup puissant', vitesse: 'lente', base: 14, attribut: 'force', k: 0.3, exec: -0.05, detail: 'Lent, gros dégâts. Facile à voir venir.' },
  balayage: { nom: 'Balayage', vitesse: 'normale', base: 6, attribut: 'agilite', k: 0.2, exec: 0.05, effet: 'desequilibre', detail: 'Peu de dégâts, mais {il} perd l’équilibre.' },
};

export const ACTIONS_FIXES: Record<Exclude<Famille, 'taijutsu' | 'ninjutsu'>, Record<string, { nom: string; detail: string }>> = {
  defense: {
    garde: { nom: 'Tenir la garde', detail: 'Encaisser moins (−30 %). Deux gardes de suite lui laissent le temps de préparer.' },
    esquive: { nom: 'Esquiver', detail: 'Réussie, sa garde s’ouvre. Ratée, le coup passe en entier.' },
    permutation: { nom: 'Permutation', detail: 'Une bûche prend le coup ; réussie, tu surgis dans son dos.' },
  },
  observation: {
    observer: { nom: 'Observer', detail: 'Remplir ta fiche de lecture. S’il attaque, tu prends le coup.' },
  },
  parole: {
    provoquer: { nom: 'Provoquer', detail: 'Un fier ou un féroce perd son calme ; un froid s’en moque.' },
    raisonner: { nom: 'Raisonner', detail: 'Tenter d’arrêter le combat sans vainqueur.' },
    reddition: { nom: 'Exiger sa reddition', detail: 'Seulement s’il est mal en point.' },
  },
  fuite: {
    fuir: { nom: 'Fuir', detail: 'Plus facile tôt que tard. Ratée, tu offres ton dos.' },
  },
};

export const NOM_FAMILLE: Record<Famille, { nom: string; kanji: string }> = {
  taijutsu: { nom: 'Taijutsu', kanji: '体' },
  ninjutsu: { nom: 'Ninjutsu', kanji: '忍' },
  defense: { nom: 'Défense', kanji: '守' },
  observation: { nom: 'Observation', kanji: '観' },
  parole: { nom: 'Parole', kanji: '話' },
  fuite: { nom: 'Fuite', kanji: '逃' },
};

const RANG_TECH: Record<string, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6 };
const VITESSE_NUM: Record<Vitesse, number> = { rapide: 70, normale: 50, lente: 30 };

/** Rang que le joueur sait exécuter sans malus : élève D, genin C, chūnin B, jōnin A, kage S. */
function rangJoueur(s: GameState): number {
  return { eleve: 1, genin: 2, chunin: 3, jonin: 4, kage: 5 }[s.rang] ?? 1;
}

/** Les techniques offensives utilisables dans une famille (les transformations et la bête restent hors de ce premier jeu de familles). */
export function techniquesFamille(s: GameState, famille: 'taijutsu' | 'ninjutsu'): string[] {
  return Object.keys(s.maitrises)
    .filter((id) => {
      const def = R.maitrises[id];
      const t = def?.technique;
      const ms = s.maitrises[id];
      if (!t?.offensive || !ms || ms.tier < 1 || ms.bloquee || estTransformation(id) || t.exigeTransformation) return false;
      if (t.categorie === 'biju' || t.categorie === 'armes' || t.categorie === 'transformation') return false;
      return famille === 'taijutsu' ? t.categorie === 'taijutsu' : t.categorie !== 'taijutsu';
    })
    .sort();
}

function malusBlessures(s: GameState): number {
  return Math.min(0.25, s.blessures.reduce((a, b) => a + (b.gravite >= 3 ? 0.15 : b.gravite === 2 ? 0.08 : 0.03), 0));
}

function malusChakra(s: GameState): number {
  const pct = s.jauges.chakra / Math.max(1, s.jauges.chakraMax);
  return pct < 0.25 ? 0.08 : pct < 0.5 ? 0.03 : 0;
}

/** Combien de fois l'adversaire a déjà vu cette action : dans ce combat, et dans les combats passés (registre). */
export function vuesAction(s: GameState, sc: EtatAffrontement, cle: string): { combat: number; passe: number } {
  return { combat: sc.vuesCeCombat[cle] ?? 0, passe: s.registresCombat[sc.registreId]?.techniquesVuesDuJoueur[cle] ?? 0 };
}

/** Coût en chakra réel : maîtrise (−5 % par palier au-delà de 3), répétition (+10 %/+20 %), fatigue (+10 % sous 25 %). */
export function coutChakra(s: GameState, sc: EtatAffrontement, techId: string): number {
  const t = R.maitrises[techId].technique!;
  const tier = s.maitrises[techId]?.tier ?? 1;
  const n = sc.vuesCeCombat[techId] ?? 0;
  let f = 1 - Math.max(0, tier - 3) * 0.05 + (n >= 2 ? 0.2 : n === 1 ? 0.1 : 0);
  if (s.jauges.chakra < s.jauges.chakraMax * 0.25) f += 0.1;
  return Math.max(1, Math.round(t.chakra * f));
}

/** Chance d'exécution (§7.4 A), bornée entre 10 % et 98 %. */
export function chanceExecution(s: GameState, a: ActionCombat): number {
  const fatigue = s.jauges.fatigue;
  if (a.famille === 'taijutsu' && TAIJUTSU[a.choix]) {
    const x = TAIJUTSU[a.choix];
    const tier = s.maitrises['taijutsu']?.tier ?? 0;
    // Un geste de base sort plus souvent qu'une technique (note d'équilibrage : 0,70, mesuré par simulation).
    return clamp(0.7 + 0.05 * tier + (s.attributs.agilite - 50) / 200 + x.exec - 0.002 * fatigue - malusBlessures(s), 0.1, 0.98);
  }
  if (a.famille === 'taijutsu' || a.famille === 'ninjutsu') {
    const def = R.maitrises[a.choix];
    const tier = s.maitrises[a.choix]?.tier ?? 1;
    const controle = a.famille === 'taijutsu' ? (s.attributs.agilite + s.attributs.controleChakra) / 2 : s.attributs.controleChakra;
    const ecart = (RANG_TECH[def.rang ?? 'C'] ?? 2) - rangJoueur(s);
    const malusRang = ecart <= 0 ? 0 : ecart === 1 ? 0.1 : ecart === 2 ? 0.25 : 0.45;
    return clamp(0.3 + 0.15 * tier + (controle - 50) / 200 - malusRang - 0.002 * fatigue - malusBlessures(s) - malusChakra(s), 0.1, 0.98);
  }
  return 1;
}

export interface VueAction {
  id: string;
  nom: string;
  detail: string;
  /** Chance d'exécution, arrondie à 5 % (techniques et taijutsu seulement ; jamais l'issue). */
  chance?: number;
  chakra?: number;
  nature?: ElementId;
  marques: string[];
  disponible: boolean;
  raison?: string;
}

export interface VueFamille {
  id: Famille;
  nom: string;
  kanji: string;
  actions: VueAction[];
}

/** Les familles visibles et leurs actions (§3.2). Une famille n'apparaît que si une action y est réellement possible. */
export function familles(s: GameState, sc: EtatAffrontement): VueFamille[] {
  const enfant = age(s) < 10;
  const regle = CONTEXTES[sc.contexte];
  const res: VueFamille[] = [];
  for (const f of FAMILLES) {
    if (enfant && !FAMILLES_ENFANT.includes(f)) continue;
    if (f === 'fuite' && !regle.fuite) continue;
    const actions: VueAction[] = [];
    const bloque = (raison: string) => ({ disponible: false, raison });
    if (f === 'taijutsu' || f === 'ninjutsu') {
      if (f === 'taijutsu')
        for (const [id, x] of Object.entries(TAIJUTSU)) {
          const v: VueAction = { id, nom: x.nom, detail: x.detail, chance: arrondi5(chanceExecution(s, { famille: f, choix: id })), marques: [], disponible: true };
          marquer(s, sc, id, v);
          if (sc.joueur.sonne > 0) Object.assign(v, bloque('Sonné·e : tu ne peux que te défendre ou parler.'));
          actions.push(v);
        }
      for (const id of techniquesFamille(s, f)) {
        const def = R.maitrises[id];
        const cout = coutChakra(s, sc, id);
        const v: VueAction = {
          id,
          nom: def.nom,
          detail: `Rang ${def.rang ?? '?'} · palier ${s.maitrises[id].tier}`,
          chance: arrondi5(chanceExecution(s, { famille: f, choix: id })),
          chakra: cout,
          nature: def.element,
          marques: [],
          disponible: true,
        };
        marquer(s, sc, id, v);
        if (sc.joueur.sonne > 0) Object.assign(v, bloque('Sonné·e : tu ne peux que te défendre ou parler.'));
        else if (sc.joueur.vide > 0) Object.assign(v, bloque('Vidé·e : plus une goutte de chakra à façonner cette manche.'));
        else if (s.jauges.chakra < cout) Object.assign(v, bloque(`Chakra insuffisant (${cout} requis).`));
        else if (s.jauges.chakra < s.jauges.chakraMax * 0.1 && (RANG_TECH[def.rang ?? 'C'] ?? 2) >= 2) Object.assign(v, bloque('Moins de 10 % de chakra : seulement le corps à corps et les techniques simples.'));
        actions.push(v);
      }
    } else {
      for (const [id, x] of Object.entries(ACTIONS_FIXES[f])) {
        const v: VueAction = { id, nom: x.nom, detail: x.detail, marques: [], disponible: true };
        if (id === 'permutation') {
          const tier = s.maitrises['kawarimi']?.tier ?? 0;
          if (tier < 1) continue;
          if (s.jauges.chakra < 4) Object.assign(v, bloque('Chakra insuffisant (4 requis).'));
        }
        if (id === 'raisonner' && !regle.paix) Object.assign(v, bloque('Personne ne t’écoutera ici.'));
        if (id === 'reddition' && sc.adv.endurance / sc.adv.enduranceMax > 0.5) continue;
        if (f === 'observation' && sc.joueur.sonne > 0) Object.assign(v, bloque('Sonné·e : tu ne vois plus clair.'));
        actions.push(v);
      }
    }
    if (actions.length) res.push({ id: f, ...NOM_FAMILLE[f], actions });
  }
  return res.slice(0, Math.max(maxFamilles(s), 4));
}

function arrondi5(p: number): number {
  return Math.round((p * 100) / 5) * 5;
}

/** Les marques utiles à la décision : inédite, éventée, peut tout finir (§22.2). */
function marquer(s: GameState, sc: EtatAffrontement, id: string, v: VueAction): void {
  const vu = vuesAction(s, sc, id);
  if (R.maitrises[id] && vu.combat === 0 && vu.passe === 0) v.marques.push('inédite');
  if (vu.passe > 0 || vu.combat >= 2) v.marques.push('éventée');
  if (sc.lecture.faiblesse && sc.elan >= 3) v.marques.push('peut tout finir');
}

/** Valide l'action avant tout tirage ; une action refusée ne modifie rien (§7.3). */
export function validerAction(s: GameState, sc: EtatAffrontement, a: ActionCombat): void {
  const fam = familles(s, sc);
  const f = fam.find((x) => x.id === a.famille);
  if (!FAMILLES.includes(a.famille)) throw new ErreurCombat('ACTION_INCONNUE', `Famille inconnue : ${a.famille}`);
  if (!f) throw new ErreurCombat('FAMILLE_INTERDITE', `La famille ${a.famille} n’est pas disponible ici.`);
  const act = f.actions.find((x) => x.id === a.choix);
  if (!act) {
    const connue = TAIJUTSU[a.choix] || R.maitrises[a.choix] || Object.values(ACTIONS_FIXES).some((g) => g[a.choix]);
    throw new ErreurCombat(connue ? 'PREREQUIS_MANQUANT' : 'ACTION_INCONNUE', `Action indisponible : ${a.choix}`);
  }
  if (!act.disponible) {
    const raison = act.raison ?? '';
    throw new ErreurCombat(/Sonné|Vidé/.test(raison) ? 'ETAT_BLOQUANT' : 'RESSOURCE_INSUFFISANTE', raison);
  }
  if (a.elan) {
    const cout = a.elan === 'decisif' ? 3 : 1;
    if (sc.elan < cout || (a.famille !== 'taijutsu' && a.famille !== 'ninjutsu')) throw new ErreurCombat('ELAN_INVALIDE', 'Élan insuffisant, ou action qui ne peut pas en profiter.');
  }
}

// ── La résolution ───────────────────────────────────────────

export interface ResultatManche {
  issue?: IssueOffensive;
  /** Ce que le joueur a infligé, ce qu'il a subi. */
  inflige: number;
  subi: number;
  /** Clés de récit et éléments de la phrase-cause. */
  execution: 'parfaite' | 'reussie' | 'instable' | 'ratee' | 'sans';
  cause: string;
  reponse: string;
  impact: string;
  repliqueCategorie?: string;
  /** Action non offensive : a-t-elle fait ce qu'on voulait (parer, esquiver, convaincre, fuir) ? */
  reussi?: boolean;
  fin?: 'paix' | 'fuite' | 'fuite_adverse' | 'reddition_adverse';
  /** L'adversaire a vu cette action pour la première fois (pour les répliques de découverte). */
  inedite: boolean;
  dejaVue: boolean;
  repetition: boolean;
  decisif: boolean;
}

export interface Tirages {
  exec: number;
  reponse: number;
  execAdv: number;
  variation: number;
  decisif: number;
  texte: number;
  replique: number;
}

/** Puissance d'une action offensive du joueur (§7.4 C), avant multiplicateurs. */
export function puissanceJoueur(s: GameState, a: ActionCombat): number {
  if (a.famille === 'taijutsu' && TAIJUTSU[a.choix]) {
    const x = TAIJUTSU[a.choix];
    return x.base + x.k * s.attributs[x.attribut] + 2 * (s.maitrises['taijutsu']?.tier ?? 0);
  }
  const def = R.maitrises[a.choix];
  const tier = s.maitrises[a.choix]?.tier ?? 1;
  const attr = a.famille === 'taijutsu' ? s.attributs.force : s.attributs.controleChakra;
  // Note d'équilibrage : le catalogue est sur une échelle 5-60 ; ×1,6 pour qu'une technique de rang C dépasse un coup de poing.
  return def.technique!.puissance * 1.6 * (0.7 + 0.15 * tier) + 0.3 * attr;
}

export function defenseJoueur(s: GameState, sc: EtatAffrontement): number {
  return 6 + 0.15 * (s.attributs.force + s.attributs.agilite) + bonusRang(sc.niveauJoueur) * 0.3;
}

/** Puissance de l'action adverse. */
function puissanceAdverse(s: GameState, sc: EtatAffrontement, d: AdversaireDef): number {
  const st = statsAdversaire(s, d);
  if (sc.intention === 'majeure' && d.majeure) return d.majeure.puissance * 1.6 + st.attaque * 0.5;
  if (sc.intention === 'technique' && sc.techniqueAdv) {
    const t = techniquesAdversaire(s, d).find((x) => x.id === sc.techniqueAdv);
    if (t) return st.attaque * 0.6 + t.puissance * 1.6;
  }
  return st.attaque + 0.2 * st.force;
}

function vitesseAction(a: ActionCombat): Vitesse {
  if (a.famille === 'taijutsu' && TAIJUTSU[a.choix]) return TAIJUTSU[a.choix].vitesse;
  return 'normale';
}

const OFFENSIVES = new Set(['attaque', 'technique', 'majeure']);
/** Note d'équilibrage : 1,5 au lieu de 0,4 (§7.4) pour qu'un combat à niveau égal se termine parfois avant le plafond. */
const K_DEGATS = 1.5;

/**
 * Résout une manche. Mute `sc` (endurances, gardes, élan, lecture) et le chakra du joueur.
 * Toutes les règles chiffrées du §7 sont ici ; les textes viennent du contenu (lignes de combat).
 */
export function resoudre(s: GameState, sc: EtatAffrontement, d: AdversaireDef, a: ActionCombat, r: Tirages): ResultatManche {
  const st = statsAdversaire(s, d);
  const advOffensif = OFFENSIVES.has(sc.intention);
  const cle = a.choix;
  const vues = vuesAction(s, sc, cle);
  const repetition = sc.actionsJoueur[sc.actionsJoueur.length - 1] === cle;
  const res: ResultatManche = { inflige: 0, subi: 0, execution: 'sans', cause: '', reponse: '', impact: '', inedite: !!R.maitrises[cle] && vues.combat === 0 && vues.passe === 0, dejaVue: vues.passe > 0, repetition, decisif: false };
  const variation = 0.9 + r.variation * 0.2;
  const defJ = defenseJoueur(s, sc);
  // Le joueur a plus d'endurance que le gabarit de son niveau (§5.1) : ses coups reçus sont mis à l'échelle de sa réserve,
  // pour qu'un coup égal coûte la même part d'endurance des deux côtés.
  const echelleJ = sc.joueur.enduranceMax / GABARITS[sc.niveauJoueur].endurance;
  let gardeJoueur = sc.joueur.garde;
  // L'adversaire exécute-t-il ce qu'il a annoncé ? (tirage 3)
  const execAdvP = sc.intention === 'majeure' ? 0.8 : sc.intention === 'technique' ? 0.6 + 0.04 * indexNiveau(sc.niveauAdv) : 0.75 + 0.03 * indexNiveau(sc.niveauAdv);
  const advReussit = !advOffensif || r.execAdv < execAdvP;
  const pAdv = puissanceAdverse(s, sc, d);
  const coupAdverse = (mult: number) => {
    if (!advOffensif || !advReussit) return 0;
    const dmg = Math.max(1, (pAdv - defJ * 0.5) * K_DEGATS) * variation * mult * echelleJ;
    return Math.round(dmg);
  };
  const multGarde = () => (gardeJoueur === 'garde' ? 0.7 : gardeJoueur === 'desequilibre' ? 1.25 : 1);

  // ── Actions offensives ──
  if (a.famille === 'taijutsu' || a.famille === 'ninjutsu') {
    const estTech = !!R.maitrises[cle];
    if (estTech) {
      const cout = coutChakra(s, sc, cle);
      s.jauges.chakra = Math.max(0, s.jauges.chakra - cout);
    }
    let elanDepense = 0;
    if (a.elan) {
      elanDepense = a.elan === 'decisif' ? 3 : 1;
      sc.elan -= elanDepense;
    }
    // A. Exécution (tirage 1).
    const p = chanceExecution(s, a);
    res.execution = r.exec < p * 0.25 ? 'parfaite' : r.exec < p ? 'reussie' : r.exec < p + 0.1 ? 'instable' : 'ratee';
    sc.vuesCeCombat[cle] = (sc.vuesCeCombat[cle] ?? 0) + 1;
    if (estTech) sc.techniquesUtilisees.push(cle);
    if (res.execution === 'ratee') {
      if (estTech) s.jauges.chakra = Math.min(s.jauges.chakraMax, s.jauges.chakra + Math.floor(coutChakra(s, sc, cle) / 2));
      if (estTech && (RANG_TECH[R.maitrises[cle].rang ?? 'C'] ?? 2) >= 2) gardeJoueur = 'desequilibre';
      sc.elan = 0;
      res.issue = 'ratee';
      const def = R.maitrises[cle];
      res.cause = estTech
        ? `Raté : ${def.rang && (RANG_TECH[def.rang] ?? 2) > rangJoueur(s) ? `une technique de rang ${def.rang} dépasse encore ce que tes mains savent faire` : `tes signes ne suivent pas encore au palier ${s.maitrises[cle].tier}`}${s.jauges.fatigue > 40 ? ', et la fatigue n’aide pas' : ''}.`
        : `Raté : ${s.jauges.fatigue > 40 ? 'la fatigue a alourdi ton geste' : 'ton geste est parti trop tôt'}.`;
      res.subi = coupAdverse(multGarde());
      res.reponse = advOffensif ? (advReussit ? '{Il} ne laisse pas passer l’occasion.' : '{Lui} aussi rate son coup.') : '{Il} n’a même pas besoin de bouger.';
      sc.joueur.garde = gardeJoueur;
      bilanEchec(sc, cle, res.cause);
      return finir(s, sc, res);
    }
    // B. Réponse adverse : prédiction (tirage 2).
    const parfaite = res.execution === 'parfaite';
    const bonusVues = Math.min(0.45, 0.15 * vues.combat) + Math.min(0.3, 0.1 * vues.passe);
    let pPred = 0.05 + bonusVues + (st.perception - VITESSE_NUM[vitesseAction(a)]) / 150 + (repetition ? 0.15 : 0) + (sc.intention === 'defense' ? 0.15 : 0);
    if (s.registresCombat[sc.registreId]?.contreMesures.includes(`action:${cle}`)) pPred += 0.15;
    pPred = clamp(pPred, 0, 0.75);
    if (parfaite || res.inedite) pPred = 0;
    // Une technique répétée au-delà de la troisième fois appelle un contre préparé (§11.2).
    if (r.reponse < pPred && sc.intention !== 'preparer' && sc.adv.sonne <= 0) {
      res.issue = 'predite';
      gardeJoueur = 'desequilibre';
      sc.elan = Math.max(0, sc.elan - 1);
      res.cause = vues.passe > 0 ? 'Prédit : {il} avait déjà vu cette attaque, la dernière fois.' : repetition ? 'Prédit : tu viens de répéter exactement le même geste.' : vues.combat > 0 ? 'Prédit : {il} a reconnu ce que tu lui avais déjà montré.' : 'Prédit : {il} a lu ton intention avant que tu frappes.';
      // Le récit d'impact raconte déjà l'esquive : la réponse ne la répète pas.
      res.reponse = '';
      res.subi = coupAdverse(1.25);
      sc.joueur.garde = gardeJoueur;
      bilanEchec(sc, cle, res.cause);
      return finir(s, sc, res);
    }
    // C. Impact.
    let puissance = puissanceJoueur(s, a) + (elanDepense === 1 ? 10 : 0) + sc.ouverture + (res.inedite ? 12 : 0);
    sc.ouverture = 0;
    let mult = 1;
    const def = R.maitrises[cle];
    if (def?.element && d.nature) {
      const av = avantageTechnique(cle, d.nature);
      if (av === 'fort') mult *= 1.25;
      if (av === 'faible') mult *= 0.8;
    }
    if (def?.element && s.registresCombat[sc.registreId]?.contreMesures.includes(`nature:${def.element}`)) mult *= 0.8;
    if (parfaite) mult *= 1.2;
    if (res.execution === 'instable') mult *= 0.7;
    const gardeAdv = sc.intention === 'defense' ? 'garde' : sc.adv.garde;
    if (gardeAdv === 'garde') mult *= 0.7;
    if (gardeAdv === 'desequilibre') mult *= 1.25;
    mult = Math.min(1.8, mult);
    puissance *= mult;
    const degatsBruts = Math.max(1, (puissance - st.defense * 0.5) * K_DEGATS) * variation;
    // D. Coup décisif (tirage 5) : seulement si une condition au moins est réunie (§10.3).
    const rangTech = def ? (RANG_TECH[def.rang ?? 'C'] ?? 2) : 1;
    const conditions =
      (rangTech >= indexNiveau(sc.niveauAdv) + 2 ? 1 : 0) +
      (parfaite && gardeAdv === 'desequilibre' ? 1 : 0) +
      (sc.lecture.faiblesse ? 1 : 0) +
      (sc.adv.endurance / sc.adv.enduranceMax < 0.15 && sc.adv.sonne > 0 ? 1 : 0) +
      (elanDepense === 3 ? 1 : 0);
    const resistance = d.resistances?.decisif ?? 0;
    const pDecisif = conditions > 0 ? clamp(0.1 + 0.1 * conditions + 0.05 * elanDepense - resistance, 0, 0.6) : 0;

    if (advOffensif && advReussit) {
      // Les deux frappent : on compare les puissances (§7.4 C).
      const ratio = puissance / Math.max(1, pAdv);
      if (ratio >= 1.1) {
        res.issue = res.inedite ? 'surprise' : 'touche';
        res.inflige = Math.round(degatsBruts * (ratio >= 1.5 ? 1 : 0.6));
        res.cause = res.inedite ? 'Surprise : {il} ne connaissait pas cette technique et a réagi trop tard.' : ratio >= 1.5 ? 'Traverse : ta puissance a balayé la sienne.' : 'Domine : ton coup l’a emporté, de peu.';
        res.reponse = '{Il} frappe en même temps que toi.';
      } else if (ratio >= 0.9) {
        res.issue = 'annulee';
        res.cause = 'Égalité : vos deux coups se valaient ; aucun ne passe.';
        res.reponse = '{Il} frappe au même instant.';
        if (a.famille === 'taijutsu' && sc.intention === 'attaque') {
          sc.joueur.sonne = 1;
          sc.adv.sonne = 1;
        }
      } else if (ratio >= 0.6) {
        res.issue = 'dominee';
        gardeJoueur = 'desequilibre';
        res.cause = 'Dominé : ton exécution était bonne, mais sa technique était plus forte.';
        res.reponse = '{Il} répond avec plus de force.';
      } else {
        res.issue = 'ecrasee';
        res.subi = coupAdverse(1);
        res.cause = 'Écrasé : l’écart de puissance était trop grand ; son coup a traversé le tien.';
        res.reponse = '{Il} répond avec une force que tu n’avais pas mesurée.';
      }
    } else {
      res.issue = res.inedite ? 'surprise' : 'touche';
      res.inflige = Math.round(degatsBruts * (sc.intention === 'preparer' ? 1.25 : 1));
      res.reponse =
        sc.intention === 'defense' ? '{Il} ramène les avant-bras devant {lui} et encaisse.' : sc.intention === 'observer' ? '{Il} ne bougeait pas : {il} t’observait.' : sc.intention === 'preparer' ? '{Il} était occupé à rassembler son chakra.' : sc.intention === 'parler' ? '{Il} ouvrait la bouche pour parler.' : sc.intention === 'fuir' ? '{Il} cherchait déjà la sortie.' : advOffensif ? 'Ses mains se brouillent : {il} rate son propre coup.' : '';
      res.cause = res.inedite ? 'Surprise : {il} ne connaissait pas cette technique et a réagi trop tard.' : sc.intention === 'defense' ? 'Paré en partie : {il} t’attendait, garde haute.' : sc.intention === 'preparer' ? 'Touché : {il} préparait quelque chose et t’a laissé une ouverture.' : 'Touché : sa garde était ouverte.';
    }
    if (res.inflige > 0 && conditions > 0 && r.decisif < pDecisif) {
      res.decisif = true;
      res.issue = 'decisive';
      res.inflige = resistance > 0 ? res.inflige * 2 : sc.adv.endurance;
      res.cause = 'Décisif : son ouverture était totale, et tu l’as trouvée.';
    }
    if (res.inflige > 0) {
      sc.elan = Math.min(3, sc.elan + 1 + (sc.joueur.garde === 'ouverte' && gardeAdv === 'desequilibre' ? 1 : 0));
      sc.touchesSubiesAdv += 1;
      if (a.famille === 'taijutsu' && TAIJUTSU[cle]?.effet === 'desequilibre') sc.adv.garde = 'desequilibre';
      else sc.adv.garde = 'ouverte';
      sc.bilan.reussites[cle] = (sc.bilan.reussites[cle] ?? 0) + 1;
      if (sc.intention === 'preparer' && res.inflige >= sc.adv.enduranceMax * 0.2) {
        sc.intention = 'defense';
        res.impact += 'Sa préparation se brise sous le choc. ';
      }
    } else bilanEchec(sc, cle, res.cause);
    sc.joueur.garde = res.issue === 'dominee' ? 'desequilibre' : 'ouverte';
    return finir(s, sc, res);
  }

  // ── Défense ──
  if (a.famille === 'defense') {
    if (a.choix === 'garde') {
      sc.gardesConsecutives += 1;
      res.subi = coupAdverse(0.7);
      res.cause = advOffensif ? (advReussit ? 'Garde : tu as encaissé moins, et sa garde reste ouverte pour la suite.' : 'Garde : {il} a raté son coup ; tu n’as rien perdu.') : 'Garde : {il} n’a pas attaqué. {Il} a eu le temps de faire autre chose.';
      if (advOffensif && advReussit) sc.ouverture = 10;
      res.reussi = !(advOffensif && advReussit);
      sc.joueur.garde = 'garde';
      res.repliqueCategorie = 'parade';
      return finir(s, sc, res);
    }
    sc.gardesConsecutives = 0;
    if (a.choix === 'esquive' || a.choix === 'permutation') {
      const perm = a.choix === 'permutation';
      if (perm) s.jauges.chakra = Math.max(0, s.jauges.chakra - 4);
      const lu = sc.annonce.fiabilite === 'fiable' && advOffensif ? 0.15 : 0;
      const p = perm ? clamp(0.55 + 0.08 * (s.maitrises['kawarimi']?.tier ?? 0) + (s.attributs.controleChakra - 50) / 200, 0.1, 0.92) : clamp(0.45 + (s.attributs.agilite - st.vitesse) / 100 + lu, 0.1, 0.9);
      if (!advOffensif) {
        res.cause = 'Esquive dans le vide : {il} n’attaquait pas.';
        res.reussi = true;
        sc.joueur.garde = 'ouverte';
        return finir(s, sc, res);
      }
      if (r.reponse < p || !advReussit) {
        sc.ouverture = perm ? 20 : 10;
        res.reussi = true;
        res.cause = perm ? 'Permutation : une bûche a pris le coup ; tu es dans son dos.' : lu ? 'Esquive : tu avais lu son geste avant qu’{il} parte.' : 'Esquive : tu as été plus rapide que son coup.';
        res.repliqueCategorie = 'parade';
      } else {
        res.subi = coupAdverse(1);
        res.cause = perm ? 'Permutation trop lente : la bûche et toi encaissez le coup ensemble.' : 'Esquive ratée : {il} était plus rapide que toi.';
      }
      sc.joueur.garde = 'ouverte';
      return finir(s, sc, res);
    }
  }
  sc.gardesConsecutives = 0;

  // ── Observation ──
  if (a.famille === 'observation') {
    res.subi = coupAdverse(1);
    sc.lecture.niveau = true;
    if (d.nature) sc.lecture.nature = true;
    const pFaiblesse = clamp(0.35 + (s.attributs.perception - st.discretion) / 100, 0.05, 0.85);
    const appris: string[] = ['son niveau'];
    if (d.nature) appris.push('sa nature');
    if (r.exec < pFaiblesse) {
      sc.lecture.faiblesse = true;
      res.reussi = true;
      appris.push('une faiblesse');
    }
    for (const h of d.habitudes.filter((x) => x.lisible)) if (!sc.lecture.habitudes.includes(h.id) && (sc.lecture.intentions[h.intention] ?? 0) >= 1) {
      sc.lecture.habitudes.push(h.id);
      appris.push('une de ses habitudes');
      break;
    }
    res.cause = `Observé : tu as appris ${appris.join(', ')}${res.subi ? ', au prix d’un coup encaissé' : ''}.`;
    sc.joueur.garde = 'ouverte';
    return finir(s, sc, res);
  }

  // ── Parole ──
  if (a.famille === 'parole') {
    res.subi = coupAdverse(multGarde());
    const pct = sc.adv.endurance / sc.adv.enduranceMax;
    const temp = sc.temperament;
    if (a.choix === 'provoquer') {
      const p = { fier: 0.7, feroce: 0.8, joueur: 0.4, desespere: 0.5, prudent: 0.2, froid: 0.1 }[temp];
      if (r.reponse < p) {
        sc.provoque = true;
        res.reussi = true;
        sc.adv.garde = 'desequilibre';
        res.cause = 'Provoqué : {il} perd son calme, et sa garde avec.';
        res.repliqueCategorie = 'provoque';
      } else res.cause = temp === 'froid' || temp === 'prudent' ? 'Sans effet : {il} ne se laisse pas toucher par des mots.' : 'Sans effet : {il} a vu clair dans ton jeu.';
    } else if (a.choix === 'raisonner') {
      const pnj = d.pnj ? s.relations[s.roles[d.pnj.replace('@', '')] ?? d.pnj] : undefined;
      const lien = pnj ? (pnj.amitie + pnj.respect) / 400 : 0;
      const modT = { prudent: 0.25, joueur: 0.15, froid: 0.05, fier: -0.1, feroce: -0.2, desespere: 0.1 }[temp];
      const modC = sc.contexte === 'entrainement' || sc.contexte === 'provocation' || sc.contexte === 'bagarre' ? 0.1 : sc.contexte === 'combat_a_mort' ? -0.3 : sc.contexte === 'mission' ? -0.15 : 0;
      const p = clamp(0.15 + lien + modT + modC + (pct < 0.5 ? 0.15 : 0) - (sc.provoque ? 0.2 : 0), 0.02, 0.85);
      if (r.reponse < p) {
        res.fin = 'paix';
        res.reussi = true;
        res.cause = 'Accepté : {il} baisse les poings. Personne n’a gagné, personne n’a perdu.';
        res.repliqueCategorie = 'paix';
      } else {
        res.cause = 'Refusé : {il} n’est pas prêt{e} à t’écouter.';
        res.repliqueCategorie = 'negociation';
      }
    } else {
      const modT = { prudent: 0.2, desespere: 0.3, joueur: 0.1, froid: 0.1, fier: -0.3, feroce: -0.2 }[temp];
      const p = clamp((1 - pct) * 0.6 + modT - (sc.contexte === 'examen' ? 0.2 : 0), 0, 0.9);
      if (r.reponse < p) {
        res.fin = 'reddition_adverse';
        res.reussi = true;
        res.cause = 'Reddition : {il} sait qu’{il} a perdu, et {il} le dit.';
        res.repliqueCategorie = 'reddition';
      } else {
        res.cause = 'Refusé : {il} préfère tomber debout.';
        res.repliqueCategorie = 'negociation';
      }
    }
    sc.joueur.garde = 'ouverte';
    return finir(s, sc, res);
  }

  // ── Fuite ──
  const pFuite = clamp(0.35 + (s.attributs.agilite - st.vitesse) / 100 - 0.1 * (sc.manche - 1), 0.05, 0.95);
  sc.elan = Math.max(0, sc.elan - 1);
  if (r.reponse < pFuite) {
    res.fin = 'fuite';
    res.reussi = true;
    res.cause = sc.manche === 1 ? 'Fuite : tu es parti·e avant qu’{il} ait vraiment commencé.' : 'Fuite : tu as trouvé une ouverture pour décrocher.';
    res.repliqueCategorie = 'fuite_joueur';
  } else {
    res.subi = coupAdverse(1.25);
    res.cause = 'Fuite ratée : {il} était plus rapide, et tu lui as offert ton dos.';
    sc.joueur.garde = 'desequilibre';
  }
  return finir(s, sc, res);
}

function bilanEchec(sc: EtatAffrontement, cle: string, cause: string): void {
  (sc.bilan.echecs[cle] ??= []).push(cause);
}

/** Applique les dégâts et la fuite adverse éventuelle ; décrémente les états temporaires. */
function finir(s: GameState, sc: EtatAffrontement, res: ResultatManche): ResultatManche {
  sc.adv.endurance = Math.max(0, sc.adv.endurance - res.inflige);
  sc.joueur.endurance = Math.max(0, sc.joueur.endurance - res.subi);
  if (res.subi > 0 && sc.joueur.garde === 'ouverte') sc.elan = Math.max(0, sc.elan - 1);
  if (sc.adv.sonne > 0 && res.inflige === 0) sc.adv.sonne -= 1;
  if (sc.joueur.sonne > 0 && res.issue !== 'annulee') sc.joueur.sonne -= 1;
  if (sc.joueur.vide > 0) sc.joueur.vide -= 1;
  // Il voulait fuir, et ton coup ne l'a pas arrêté.
  if (sc.intention === 'fuir' && sc.adv.endurance > 0 && !res.fin && res.inflige < sc.adv.enduranceMax * 0.2) res.fin = 'fuite_adverse';
  if (sc.intention !== 'preparer' && sc.adv.garde === 'garde') sc.adv.garde = 'ouverte';
  sc.lecture.intentions[sc.intention] = (sc.lecture.intentions[sc.intention] ?? 0) + 1;
  if (sc.intention === 'technique' && sc.techniqueAdv && !sc.lecture.techniquesVues.includes(sc.techniqueAdv)) sc.lecture.techniquesVues.push(sc.techniqueAdv);
  if (sc.intention === 'technique' && sc.techniqueAdv) sc.lecture.nature = true;
  return res;
}
