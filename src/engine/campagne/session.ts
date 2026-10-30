// La partie en ligne, sans réseau : ce que fait le serveur, en fonctions pures. Un salon s'ouvre avec la fiche du
// premier joueur et le lien proposé ; le second le rejoint avec sa fiche ; la campagne naît. Ensuite, chaque appareil
// envoie ses actions avec son jeton, et ne reçoit que sa projection. Le serveur (Worker + Durable Object) ne fait
// qu'appeler ces fonctions et stocker la session : le même réducteur qu'en local, donc la même partie.

import type { Creation } from '../types';
import type { ActionCampagne, Campagne, IdJoueur } from './types';
import { nouvelleCampagne, parametresLien, soumettre, validerLien } from './moteur';
import { projeter, type ProjectionCampagne } from './projection';

type ParametresLien = Parameters<typeof nouvelleCampagne>[2];

/** Une empreinte de jeton. Le serveur passe SHA-256 ; par défaut, FNV-1a 64 bits (suffisant hors ligne et en test). */
export type Hacher = (s: string) => string;
export const fnv: Hacher = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const ch of new TextEncoder().encode(s)) h = BigInt.asUintN(64, (h ^ BigInt(ch)) * 0x100000001b3n);
  return h.toString(16).padStart(16, '0');
};

export interface Salon {
  code: string;
  creation: Creation;
  lien: ParametresLien;
  /** L'empreinte du jeton du premier joueur : le jeton lui-même n'est jamais stocké. */
  jeton: string;
}

export interface Session {
  format: 1;
  code: string;
  /** Les empreintes des deux jetons. */
  jetons: [string, string];
  campagne: Campagne;
  /** Monte à chaque action acceptée : les clients s'en servent pour savoir s'ils sont à jour. */
  version: number;
}

/** Ce qu'une sauvegarde exportée contient : assez pour tout rejouer, rien de plus. */
export interface Export {
  format: 1;
  creations: [Creation, Creation];
  lien: ParametresLien;
  graine: number;
  actions: ActionCampagne[];
}

export function ouvrirSalon(code: string, creation: Creation, lien: ParametresLien, jeton: string, hacher: Hacher = fnv): Salon {
  if (!/^[A-Z0-9]{4,12}$/.test(code)) throw new Error('Code de salon invalide.');
  if (jeton.length < 16) throw new Error('Jeton trop court.');
  return { code, creation, lien, jeton: hacher(jeton) };
}

/** Le second joueur arrive avec sa fiche : si le lien tient entre les deux fiches, la campagne commence. */
export function rejoindreSalon(salon: Salon, creation: Creation, jeton: string, graine: number, hacher: Hacher = fnv): Session {
  const h = hacher(jeton);
  if (h === salon.jeton) throw new Error('Ce jeton est déjà celui du premier joueur.');
  const v = validerLien(salon.creation, creation, salon.lien.type, salon.lien.origine);
  if (v.erreur) throw new Error(v.erreur);
  return { format: 1, code: salon.code, jetons: [salon.jeton, h], campagne: nouvelleCampagne(salon.creation, creation, salon.lien, graine), version: 0 };
}

/** Qui parle : le jeton désigne le joueur. Un jeton inconnu ne désigne personne. */
export function joueurDuJeton(session: Session, jeton: string, hacher: Hacher = fnv): IdJoueur {
  const h = hacher(jeton);
  const j = session.jetons.indexOf(h);
  if (j < 0) throw new Error('Jeton inconnu.');
  return j as IdJoueur;
}

type SansJoueur<T> = T extends unknown ? Omit<T, 'j' | 'seq' | 'vis' | 'jour'> : never;
export type ActionEnvoyee = SansJoueur<ActionCampagne>;

/**
 * Une action arrive d'un appareil. Le joueur est celui du jeton, jamais celui que l'appareil prétend être ; l'action
 * passe par le même réducteur qu'en local (tour, validité, idempotence par identifiant). Retourne la session et la
 * projection de celui qui a joué.
 */
export function recevoir(session: Session, jeton: string, x: ActionEnvoyee, hacher: Hacher = fnv): { session: Session; projection: ProjectionCampagne } {
  const j = joueurDuJeton(session, jeton, hacher);
  const action = { ...(x as object), j } as ActionCampagne;
  const avant = session.campagne;
  const campagne = soumettre(avant, action);
  const s: Session = campagne === avant ? session : { ...session, campagne, version: session.version + 1 };
  return { session: s, projection: projeter(s.campagne, j) };
}

/** Ce qu'un appareil a le droit de voir, et rien d'autre. */
export const vuePour = (session: Session, jeton: string, hacher: Hacher = fnv) => {
  const j = joueurDuJeton(session, jeton, hacher);
  return { version: session.version, projection: projeter(session.campagne, j) };
};

/** La sauvegarde portable : les deux fiches, le lien, la graine et le journal. */
export function exporter(c: Campagne): Export {
  return { format: 1, creations: c.creations, lien: parametresLien(c), graine: c.graine, actions: c.actions };
}

/** Une sauvegarde exportée se rejoue entièrement : si elle a été retouchée, une action invalide la fait échouer. */
export function importer(e: Export): Campagne {
  if (e.format !== 1) throw new Error('Format de sauvegarde inconnu.');
  // Chaque action repasse par la validation : une sauvegarde retouchée échoue au lieu de produire un état impossible.
  let c = nouvelleCampagne(e.creations[0], e.creations[1], e.lien, e.graine);
  for (const x of e.actions) c = soumettre(c, x);
  return c;
}

// ── Engagement et révélation ─────────────────────────────────
// Hors serveur (deux appareils sans arbitre), un choix secret s'envoie d'abord scellé : l'empreinte du choix et d'un
// sel. Quand les deux empreintes sont là, chacun révèle son choix et son sel ; une révélation qui ne correspond pas à
// l'empreinte est refusée. Personne ne peut choisir en connaissant le choix de l'autre.

export const engager = (choix: string, sel: string, hacher: Hacher = fnv) => hacher(`${choix}\u0000${sel}`);
export function verifierRevelation(empreinte: string, choix: string, sel: string, hacher: Hacher = fnv): boolean {
  return engager(choix, sel, hacher) === empreinte;
}
