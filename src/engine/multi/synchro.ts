// La synchronisation de la campagne à deux sur deux appareils. Pur, sans réseau : le transport est injecté.
// Le journal des actions est la seule vérité. Chaque appareil garde l'état confirmé (le journal rejoué) ; pour agir,
// il relit ce qui manque, revalide ses actions sur l'état à jour, puis les ajoute à la suite du journal. Si l'autre
// appareil est passé entre-temps (même numéro), l'ajout est refusé, et on recommence : jamais de doublon, jamais d'ordre
// différent d'un appareil à l'autre. Les hasards de chaque vie ont leur propre flux : l'ordre d'arrivée n'y change rien.

import type { ActionCampagne, Campagne } from '../campagne/types';
import { soumettre } from '../campagne/moteur';

export interface LigneJournal {
  seq: number;
  joueur: 0 | 1;
  action: ActionCampagne;
}

export interface TransportJournal {
  /** Les lignes du journal à partir du numéro donné (inclus), dans l'ordre. */
  lire(depuis: number): Promise<LigneJournal[]>;
  /** Ajoute des lignes consécutives. Rend false si l'un des numéros est déjà pris (l'autre est passé avant). */
  ajouter(lignes: LigneJournal[]): Promise<boolean>;
  /** Prévient quand le journal a bougé (temps réel). Rend la fonction qui arrête l'écoute. */
  ecouter(surChangement: () => void): () => void;
}

/** Une action telle qu'on la range dans le journal : sans les tampons que le moteur ajoute en l'appliquant. */
function brute(a: ActionCampagne): ActionCampagne {
  const { seq: _s, vis: _v, jour: _j, ...reste } = a as ActionCampagne & { seq?: number; vis?: unknown; jour?: number };
  return reste as ActionCampagne;
}

export class Synchro {
  private file: Promise<unknown> = Promise.resolve();
  private arret?: () => void;

  constructor(
    private transport: TransportJournal,
    /** L'état confirmé : la campagne de départ, puis le journal rejoué. */
    public confirme: Campagne,
    private surEtat: (c: Campagne) => void,
  ) {}

  /** Écoute le journal : chaque nouvelle ligne de l'autre est appliquée dès qu'elle arrive. */
  demarrer(): void {
    this.arret = this.transport.ecouter(() => void this.enFile(() => this.rattraper()));
    void this.enFile(() => this.rattraper());
  }

  arreter(): void {
    this.arret?.();
  }

  /** Les opérations passent l'une après l'autre : un rattrapage ne croise jamais un envoi. */
  private enFile<T>(f: () => Promise<T>): Promise<T> {
    const p = this.file.then(f, f);
    this.file = p.catch(() => undefined);
    return p;
  }

  private async rattraper(): Promise<void> {
    const lignes = await this.transport.lire(this.confirme.actions.length + 1);
    if (!lignes.length) return;
    let c = this.confirme;
    for (const l of lignes) {
      if (l.seq !== c.actions.length + 1) break;
      c = soumettre(c, brute(l.action));
    }
    this.confirme = c;
    this.surEtat(c);
  }

  /**
   * Envoie des actions jouées sur cet appareil. Elles sont revalidées sur l'état à jour (l'autre a pu jouer entre-temps) :
   * une action devenue impossible est refusée avec le message du moteur, et rien n'est écrit.
   */
  envoyer(actions: ActionCampagne[], joueur: 0 | 1): Promise<void> {
    return this.enFile(async () => {
      for (let essai = 0; essai < 6; essai++) {
        await this.rattraper();
        let c = this.confirme;
        const depart = c.actions.length;
        for (const a of actions) c = soumettre(c, brute(a));
        const lignes = actions.map((a, i) => ({ seq: depart + i + 1, joueur, action: brute(a) }));
        if (await this.transport.ajouter(lignes)) {
          this.confirme = c;
          this.surEtat(c);
          return;
        }
      }
      throw new Error('Le réseau est trop agité : réessaie dans un instant.');
    });
  }
}

/** Les actions qu'une modification locale a ajoutées au journal (l'interface calcule l'état, on n'envoie que la différence). */
export const nouvellesActions = (avant: Campagne, apres: Campagne): ActionCampagne[] => apres.actions.slice(avant.actions.length);

/** Un transport en mémoire, partagé par plusieurs appareils simulés (tests). */
export function journalMemoire(): { transport: () => TransportJournal; lignes: LigneJournal[] } {
  const lignes: LigneJournal[] = [];
  const ecouteurs = new Set<() => void>();
  return {
    lignes,
    transport: () => ({
      async lire(depuis) {
        return lignes.filter((l) => l.seq >= depuis).sort((a, b) => a.seq - b.seq);
      },
      async ajouter(nouvelles) {
        if (nouvelles.some((n) => lignes.some((l) => l.seq === n.seq))) return false;
        lignes.push(...structuredClone(nouvelles));
        queueMicrotask(() => ecouteurs.forEach((f) => f()));
        return true;
      },
      ecouter(f) {
        ecouteurs.add(f);
        return () => ecouteurs.delete(f);
      },
    }),
  };
}
