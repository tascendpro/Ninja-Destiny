// Sauvegardes de session : la partie vit tant que l'onglet reste ouvert (sessionStorage).
// Elle survit à un rechargement de la page, pas à sa fermeture. Aucun serveur, aucune base de données.
// Une sauvegarde contient les décisions : la restauration rejoue la partie et vérifie l'empreinte.

import type { Creation, GameState } from './types';
import { R } from './registre';
import { hacher } from './rng';
import { rejouer } from './moteur';
import { libellePeriode } from './calendrier';
import { nomComplet } from './etat';

export interface Sauvegarde {
  format: 1;
  contenuVersion: string;
  date: string;
  libelle: string;
  resume: string;
  creation: Creation;
  seed: number;
  actions: GameState['actions'];
  etat: GameState;
  empreinte: string;
}

export interface Stockage {
  lire(cle: string): string | null;
  ecrire(cle: string, valeur: string): void;
  supprimer(cle: string): void;
}

export const PREFIXE = 'ninja-destiny:';
export const EMPLACEMENTS = ['auto', 'manuel1', 'manuel2', 'manuel3'] as const;
export type Emplacement = (typeof EMPLACEMENTS)[number];

/**
 * Stockage de l'onglet (sessionStorage) : effacé par le navigateur à la fermeture de la page.
 * Repli en mémoire si sessionStorage est indisponible (navigation privée stricte, iframe isolée).
 */
export function stockageSession(): Stockage {
  const memoire = new Map<string, string>();
  const ls = (() => {
    try {
      const x = typeof window !== 'undefined' ? window.sessionStorage : undefined;
      if (!x) return undefined;
      x.setItem(`${PREFIXE}test`, '1');
      x.removeItem(`${PREFIXE}test`);
      return x;
    } catch {
      return undefined;
    }
  })();
  return {
    lire(cle) {
      try {
        return ls ? ls.getItem(cle) : (memoire.get(cle) ?? null);
      } catch {
        return memoire.get(cle) ?? null;
      }
    },
    ecrire(cle, valeur) {
      try {
        if (ls) ls.setItem(cle, valeur);
        else memoire.set(cle, valeur);
      } catch {
        memoire.set(cle, valeur);
      }
    },
    supprimer(cle) {
      try {
        if (ls) ls.removeItem(cle);
      } catch {
        /* ignoré */
      }
      memoire.delete(cle);
    },
  };
}

export function stockageMemoire(): Stockage {
  const m = new Map<string, string>();
  return { lire: (k) => m.get(k) ?? null, ecrire: (k, v) => void m.set(k, v), supprimer: (k) => void m.delete(k) };
}

export function empreinte(s: GameState): string {
  return hacher(JSON.stringify(s));
}

export function creerSauvegarde(s: GameState, libelle: string): Sauvegarde {
  return {
    format: 1,
    contenuVersion: R.contenu.version,
    date: new Date().toISOString(),
    libelle,
    resume: `${nomComplet(s)}, ${libellePeriode(s)}`,
    creation: s.creation,
    seed: s.seed,
    actions: s.actions,
    etat: s,
    empreinte: empreinte(s),
  };
}

export interface Restauration {
  etat: GameState;
  verifiee: boolean;
  message?: string;
}

export function restaurer(sv: Sauvegarde): Restauration {
  if (sv.contenuVersion === R.contenu.version) {
    try {
      const rejoue = rejouer(sv.creation, sv.seed, sv.actions);
      if (empreinte(rejoue) === sv.empreinte) return { etat: rejoue, verifiee: true };
      return {
        etat: rejoue,
        verifiee: false,
        message: 'La sauvegarde ne correspondait pas aux décisions enregistrées : la partie a été reconstruite à partir de celles-ci.',
      };
    } catch {
      return { etat: sv.etat, verifiee: false, message: 'Reconstruction impossible : état enregistré chargé tel quel.' };
    }
  }
  return {
    etat: migrer(sv.etat),
    verifiee: false,
    message: `Sauvegarde créée avec le contenu ${sv.contenuVersion} : chargée sans rejouer les décisions.`,
  };
}

/** Point d'entrée des migrations futures du format d'état. */
export function migrer(s: GameState): GameState {
  return s;
}

export function enregistrer(st: Stockage, emplacement: Emplacement, s: GameState, libelle?: string): Sauvegarde {
  const sv = creerSauvegarde(s, libelle ?? (emplacement === 'auto' ? 'Sauvegarde automatique' : `Emplacement ${emplacement.slice(-1)}`));
  st.ecrire(PREFIXE + emplacement, JSON.stringify(sv));
  return sv;
}

export function charger(st: Stockage, emplacement: Emplacement): Sauvegarde | undefined {
  const brut = st.lire(PREFIXE + emplacement);
  if (!brut) return undefined;
  try {
    const sv = JSON.parse(brut) as Sauvegarde;
    return sv.format === 1 ? sv : undefined;
  } catch {
    return undefined;
  }
}

export function supprimer(st: Stockage, emplacement: Emplacement): void {
  st.supprimer(PREFIXE + emplacement);
}

export function listerSauvegardes(st: Stockage): { emplacement: Emplacement; sauvegarde?: Sauvegarde }[] {
  return EMPLACEMENTS.map((e) => ({ emplacement: e, sauvegarde: charger(st, e) }));
}

// ── Méta-progression (entre les parties) ─────────────────────

export interface Meta {
  parties: number;
  finsObtenues: string[];
  evenementsVus: string[];
  decouvertes: string[];
  succes: string[];
  /** Bourse de l'onglet : les ryō de chaque vie terminée s'y ajoutent. */
  ryo: number;
  /** Vies déjà versées à la bourse (graine et jour de fin), pour ne jamais compter deux fois. */
  viesVersees: string[];
  /** Héritage acheté, réservé pour la prochaine vie. */
  heritage?: string;
  /** Ryō déjà versés par chaque vie (par graine) : une vie qui continue au chapitre suivant ne verse que la différence. */
  verses?: Record<string, number>;
}

const META_VIDE: Meta = { parties: 0, finsObtenues: [], evenementsVus: [], decouvertes: [], succes: [], ryo: 0, viesVersees: [] };

export function lireMeta(st: Stockage): Meta {
  try {
    const brut = st.lire(PREFIXE + 'meta');
    if (brut) return { ...META_VIDE, ...JSON.parse(brut) };
  } catch {
    /* ignoré */
  }
  return { ...META_VIDE };
}

export function fusionnerMeta(st: Stockage, s: GameState, nouvellePartie = false): Meta {
  const m = lireMeta(st);
  const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
  // À la fin d'une vie, ses ryō rejoignent la bourse de l'onglet, une seule fois.
  const vie = s.fin ? `${s.seed}:${s.fin.jour}` : undefined;
  const dejaVerse = m.verses?.[String(s.seed)] ?? 0;
  const montant = s.fin ? Math.max(0, Math.round(s.jauges.ryo) - dejaVerse) : 0;
  const verser = !!vie && !m.viesVersees.includes(vie) && montant > 0;
  const res: Meta = {
    ...m,
    parties: m.parties + (nouvellePartie ? 1 : 0),
    finsObtenues: s.fin ? union(m.finsObtenues, [s.fin.id]) : m.finsObtenues,
    evenementsVus: union(m.evenementsVus, Object.keys(s.evenementsVus)),
    decouvertes: union(m.decouvertes, s.decouvertes),
    succes: union(m.succes, s.succes),
    ryo: m.ryo + (verser ? montant : 0),
    viesVersees: vie && !m.viesVersees.includes(vie) ? [...m.viesVersees, vie] : m.viesVersees,
    verses: verser ? { ...(m.verses ?? {}), [String(s.seed)]: dejaVerse + montant } : m.verses,
  };
  st.ecrire(PREFIXE + 'meta', JSON.stringify(res));
  return res;
}

/** Achète un héritage pour la prochaine vie. Un seul à la fois : en changer rembourse le précédent. */
export function acheterHeritage(st: Stockage, id: string): Meta {
  const m = lireMeta(st);
  const h = R.contenu.heritages.find((x) => x.id === id);
  if (!h) throw new Error('Héritage inconnu.');
  const rembourse = m.heritage ? (R.contenu.heritages.find((x) => x.id === m.heritage)?.prix ?? 0) : 0;
  if (m.ryo + rembourse < h.prix) throw new Error('Pas assez de ryō dans la bourse.');
  const res: Meta = { ...m, ryo: m.ryo + rembourse - h.prix, heritage: id };
  st.ecrire(PREFIXE + 'meta', JSON.stringify(res));
  return res;
}

/** Annule l'héritage réservé et rembourse la bourse. */
export function annulerHeritage(st: Stockage): Meta {
  const m = lireMeta(st);
  const prix = m.heritage ? (R.contenu.heritages.find((x) => x.id === m.heritage)?.prix ?? 0) : 0;
  const res: Meta = { ...m, ryo: m.ryo + prix, heritage: undefined };
  st.ecrire(PREFIXE + 'meta', JSON.stringify(res));
  return res;
}

/** L'héritage réservé est consommé par la vie qui commence. */
export function consommerHeritage(st: Stockage): string | undefined {
  const m = lireMeta(st);
  if (!m.heritage) return undefined;
  st.ecrire(PREFIXE + 'meta', JSON.stringify({ ...m, heritage: undefined }));
  return m.heritage;
}
