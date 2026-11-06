// Les états de combat (§2.3) : ce qu'un coup laisse sur un corps, et ce que ça change à la manche suivante.
// Un état a une durée en manches ; il apparaît avec une phrase et s'efface avec une autre. La gravité vient du coup :
// une blessure n'est infligée que si le coup a fait vraiment mal, ou si la technique la prévoit.

import type { ElementId } from '../types';
import type { CombattantEtat } from './types';

export type EtatId =
  | 'desoriente'
  | 'immobilise'
  | 'empoisonne'
  | 'brule'
  | 'saignement'
  | 'mains_blessees'
  | 'jambe_touchee'
  | 'chakra_bloque'
  | 'terrifie'
  | 'enrage'
  | 'sous_genjutsu';

export interface EffetEtat {
  nom: string;
  /** Ajouts aux chances (en points de 0 à 1) : exécution, esquive, fuite, lecture adverse de tes gestes. */
  exec?: number;
  /** Malus supplémentaire sur les techniques à signes (ninjutsu, genjutsu). */
  signes?: number;
  esquive?: number;
  fuite?: number;
  /** Multiplicateur de puissance. */
  puissance?: number;
  /** Part des PV maximum perdue à chaque manche. */
  parManche?: number;
  /** Les techniques de chakra sont impossibles. */
  sansChakra?: boolean;
  /** Ni esquive ni fuite, ni coup au contact. */
  fige?: boolean;
  /** Ce que le récit dit quand l'état apparaît, et quand il passe ({cible} : toi ou lui). */
  apparait: { joueur: string; adv: string };
  passe: { joueur: string; adv: string };
}

export const EFFETS_ETAT: Record<EtatId, EffetEtat> = {
  desoriente: {
    nom: 'désorienté·e',
    exec: -0.2,
    esquive: -0.25,
    apparait: { joueur: 'Le monde tangue : tes yeux ne suivent plus tes mains.', adv: '{Il} secoue la tête : {il} ne sait plus très bien où tu es.' },
    passe: { joueur: 'Tu secoues la tête : le monde redevient net.', adv: '{Il} cligne des yeux : le monde redevient net pour {lui}.' },
  },
  immobilise: {
    nom: 'immobilisé·e',
    fige: true,
    esquive: -1,
    fuite: -1,
    apparait: { joueur: 'Tes jambes ne répondent plus : tu es pris·e.', adv: '{Il} tire sur ses jambes : elles ne bougent plus.' },
    passe: { joueur: 'Tu t’arraches à l’emprise.', adv: '{Il} s’arrache à l’emprise, en grimaçant.' },
  },
  empoisonne: {
    nom: 'empoisonné·e',
    parManche: 0.05,
    exec: -0.05,
    apparait: { joueur: 'Une chaleur sale monte dans ton bras : du poison.', adv: 'Sa peau pâlit autour de la plaie : le poison fait son chemin.' },
    passe: { joueur: 'La sueur froide s’arrête : ton corps a gagné contre le poison.', adv: 'Son souffle se calme : le poison a fini son œuvre.' },
  },
  brule: {
    nom: 'brûlé·e',
    parManche: 0.03,
    apparait: { joueur: 'Ta peau brûle encore, sous la manche roussie.', adv: 'Sa manche fume encore ; {il} serre les dents.' },
    passe: { joueur: 'La brûlure n’est plus qu’une douleur sourde.', adv: 'La fumée de sa manche s’est éteinte.' },
  },
  saignement: {
    nom: 'en sang',
    parManche: 0.03,
    exec: -0.03,
    apparait: { joueur: 'Le sang coule sur ta main : la coupure est profonde.', adv: 'Le sang coule le long de son bras, goutte après goutte.' },
    passe: { joueur: 'Le sang a fini par coaguler.', adv: 'Sa plaie ne saigne plus.' },
  },
  mains_blessees: {
    nom: 'mains blessées',
    signes: -0.2,
    apparait: { joueur: 'Tes doigts ne se plient plus bien : les signes vont te coûter.', adv: 'Ses doigts tremblent : composer des signes va lui coûter.' },
    passe: { joueur: 'Tes doigts retrouvent leur souplesse.', adv: 'Ses doigts ont cessé de trembler.' },
  },
  jambe_touchee: {
    nom: 'jambe touchée',
    esquive: -0.2,
    fuite: -0.3,
    apparait: { joueur: 'Ta jambe flanche à chaque appui.', adv: '{Il} boite : sa jambe ne le porte plus comme avant.' },
    passe: { joueur: 'Ta jambe tient de nouveau.', adv: '{Il} ne boite plus.' },
  },
  chakra_bloque: {
    nom: 'chakra bloqué',
    sansChakra: true,
    apparait: { joueur: 'Tes points de chakra sont fermés : plus rien ne passe.', adv: 'Ses points de chakra sont fermés : {il} compose des signes qui ne donnent rien.' },
    passe: { joueur: 'Le chakra recommence à couler.', adv: 'Son chakra recommence à couler.' },
  },
  terrifie: {
    nom: 'terrifié·e',
    puissance: 0.8,
    fuite: 0.25,
    apparait: { joueur: 'La peur te serre la gorge : tes coups partent sans conviction.', adv: 'Quelque chose s’est cassé dans son regard : {il} a peur de toi.' },
    passe: { joueur: 'Tu respires : la peur reflue.', adv: '{Il} se reprend : la peur reflue de son visage.' },
  },
  enrage: {
    nom: 'enragé·e',
    puissance: 1.15,
    exec: -0.1,
    esquive: -0.1,
    apparait: { joueur: 'La colère te monte aux yeux : tu frappes plus fort, et moins juste.', adv: 'La colère lui monte aux yeux : {il} frappe plus fort, et moins juste.' },
    passe: { joueur: 'Ta colère retombe.', adv: 'Sa colère retombe ; {il} reprend sa garde.' },
  },
  sous_genjutsu: {
    nom: 'sous illusion',
    exec: -0.3,
    esquive: -0.3,
    apparait: { joueur: 'Le décor se déforme : ce que tu vois n’est plus vrai.', adv: '{Il} frappe dans le vide : {il} voit quelque chose qui n’est pas là.' },
    passe: { joueur: 'Tu mords ta lèvre : la douleur brise l’illusion.', adv: '{Il} se mord la lèvre : l’illusion se brise.' },
  },
};

export const ETATS = Object.keys(EFFETS_ETAT) as EtatId[];

export const aEtat = (c: CombattantEtat, id: EtatId) => (c.etats?.[id] ?? 0) > 0;

/** Pose un état (la durée la plus longue l'emporte). Rend vrai s'il est nouveau. */
export function poserEtat(c: CombattantEtat, id: EtatId, tours: number): boolean {
  const avant = c.etats?.[id] ?? 0;
  c.etats = { ...(c.etats ?? {}), [id]: Math.max(avant, tours) };
  return avant <= 0;
}

/** Ce que les états d'un combattant changent, additionnés. */
export function modificateurs(c: CombattantEtat): { exec: number; signes: number; esquive: number; fuite: number; puissance: number; sansChakra: boolean; fige: boolean } {
  const m = { exec: 0, signes: 0, esquive: 0, fuite: 0, puissance: 1, sansChakra: false, fige: false };
  for (const id of ETATS) {
    if (!aEtat(c, id)) continue;
    const e = EFFETS_ETAT[id];
    m.exec += e.exec ?? 0;
    m.signes += e.signes ?? 0;
    m.esquive += e.esquive ?? 0;
    m.fuite += e.fuite ?? 0;
    m.puissance *= e.puissance ?? 1;
    m.sansChakra ||= !!e.sansChakra;
    m.fige ||= !!e.fige;
  }
  return m;
}

/**
 * Fin de manche : les états qui rongent font leurs dégâts, puis tous vieillissent d'une manche.
 * Rend les PV perdus et les phrases (apparitions déjà dites ailleurs ; ici, ce qui passe).
 */
export function vieillirEtats(c: CombattantEtat, qui: 'joueur' | 'adv'): { perte: number; textes: string[] } {
  let perte = 0;
  const textes: string[] = [];
  for (const id of ETATS) {
    const n = c.etats?.[id] ?? 0;
    if (n <= 0) continue;
    const e = EFFETS_ETAT[id];
    if (e.parManche) perte += Math.max(1, Math.round(c.enduranceMax * e.parManche));
    c.etats![id] = n - 1;
    if (n - 1 <= 0) textes.push(e.passe[qui]);
  }
  return { perte, textes };
}

/** Les états visibles, pour l'écran. */
export const etatsVisibles = (c: CombattantEtat) => ETATS.filter((id) => aEtat(c, id)).map((id) => EFFETS_ETAT[id].nom);

/**
 * Ce qu'un coup qui porte peut laisser, selon sa nature et sa force (part des PV max retirée).
 * Le tirage décide parmi ce qui est possible ; un petit coup ne laisse rien (sauf ce que la technique prévoit).
 */
export function etatDuCoup(o: { nature?: ElementId; categorie?: string; arme?: boolean; contact?: boolean; part: number; prevu?: { id: EtatId; tours: number } }, r: number): { id: EtatId; tours: number } | undefined {
  // Ce que la technique prévoit (une entrave, le poing souple) arrive toujours quand elle porte.
  if (o.prevu) return o.prevu;
  if (o.categorie === 'genjutsu') return r < 0.6 ? { id: r < 0.3 ? 'sous_genjutsu' : 'terrifie', tours: 2 } : undefined;
  if (o.nature === 'raiton' && r < 0.4) return { id: 'desoriente', tours: 1 };
  if (o.nature === 'katon' && o.part >= 0.12 && r < 0.5) return { id: 'brule', tours: 2 };
  if (o.nature === 'fuuton' && o.part >= 0.12 && r < 0.4) return { id: 'saignement', tours: 2 };
  if (o.nature === 'doton' && o.part >= 0.15 && r < 0.3) return { id: 'jambe_touchee', tours: 2 };
  if (o.arme && o.part >= 0.1 && r < 0.45) return { id: 'saignement', tours: 2 };
  // Un coup très lourd blesse : les mains ou les jambes.
  if (o.part >= 0.2 && r < 0.35) return { id: r < 0.17 ? 'mains_blessees' : 'jambe_touchee', tours: 3 };
  if (o.contact && o.part >= 0.15 && r < 0.2) return { id: 'desoriente', tours: 1 };
  return undefined;
}
