// Le stockage du navigateur : la partie est gardée dans localStorage, y compris quand on ferme le navigateur,
// sur téléphone comme sur ordinateur. Aucun serveur, aucune base de données.

import { PREFIXE, stockageMemoire } from '../engine/sauvegarde';
import type { Stockage } from '../engine/sauvegarde';

/**
 * Stockage durable du navigateur (localStorage) : la partie survit à la fermeture du navigateur.
 * Au premier lancement, une partie encore rangée dans l'ancien stockage de session est récupérée.
 * Repli en mémoire si le stockage est indisponible (navigation privée stricte, iframe isolée).
 */
export function stockageDurable(): Stockage {
  const st = stockageNavigateur('localStorage');
  try {
    const ancien = typeof window !== 'undefined' ? window.sessionStorage : undefined;
    if (ancien) {
      for (let i = 0; i < ancien.length; i++) {
        const cle = ancien.key(i);
        if (cle?.startsWith(PREFIXE) && st.lire(cle) === null) {
          const v = ancien.getItem(cle);
          if (v !== null) st.ecrire(cle, v);
        }
      }
    }
  } catch {
    /* ancien stockage illisible : rien à récupérer */
  }
  return st;
}

/** Ancien stockage de l'onglet (sessionStorage), effacé à la fermeture. Gardé pour la compatibilité. */
export function stockageSession(): Stockage {
  return stockageNavigateur('sessionStorage');
}

function stockageNavigateur(type: 'localStorage' | 'sessionStorage'): Stockage {
  const memoire = new Map<string, string>();
  const ls = (() => {
    try {
      const x = typeof window !== 'undefined' ? window[type] : undefined;
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


/** Le stockage à utiliser : celui du navigateur, ou la mémoire pendant le rendu côté serveur. */
export function stockageParDefaut(): Stockage {
  return typeof window === 'undefined' ? stockageMemoire() : stockageDurable();
}
