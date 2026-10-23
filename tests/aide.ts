import type { Creation, GameState, Tirages } from '../src/engine/types';
import { ATTRIBUTS } from '../src/engine/types';
import { coutRepartition } from '../src/engine/progression';
import { activite, choisir, choixVisibles, combattre, continuer, manche, nouvellePartie, repartir, vueCombat } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { duoPossible, genererActivites } from '../src/engine/tempsLibre';
import { R } from '../src/engine/registre';
import { suivant } from '../src/engine/rng';
import { verifierInvariants } from '../src/engine/invariants';

export const CREATION_BASE: Creation = {
  prenom: 'Aya',
  presentation: 'feminin',
  ageDepart: 6,
  village: 'konoha',
  clan: 'uchiha',
  element: 'katon',
  traits: ['determine', 'curieux'],
  aptitude: 'perception',
  objectif: 'verite',
  difficulte: 'shinobi',
};

export function creation(partiel: Partial<Creation> = {}): Creation {
  return { ...CREATION_BASE, ...partiel };
}

/** Toutes les combinaisons village/clan valides. */
export function combinaisons(): { village: Creation['village']; clan: string; element: Creation['element'] }[] {
  const res: { village: Creation['village']; clan: string; element: Creation['element'] }[] = [];
  for (const c of R.contenu.clans) {
    for (const v of c.villages) {
      const element = (c.elementsRequis?.[0] ?? c.elementsConseilles?.[0] ?? 'katon') as Creation['element'];
      res.push({ village: v, clan: c.id, element });
    }
  }
  return res;
}

export interface RapportSimulation {
  etat: GameState;
  pas: number;
  fin?: string;
  erreurs: string[];
  passerUtilise: string[];
  evenements: string[];
}

/** Joue une partie complète avec des décisions pseudo-aléatoires, en vérifiant les invariants à chaque pas. */
export function simuler(c: Creation, graine: number, maxPas = 1500, imposes?: Partial<Tirages>): RapportSimulation {
  return poursuivre(nouvellePartie(c, graine, imposes), graine, maxPas);
}

/** Poursuit une partie déjà commencée avec des décisions pseudo-aléatoires. */
export function poursuivre(depart: GameState, graine: number, maxPas = 1500): RapportSimulation {
  let s = depart;
  let r = graine ^ 0x9e3779b9;
  const pick = (n: number) => {
    const x = suivant(r);
    r = x.etat;
    return Math.floor(x.valeur * n);
  };
  const erreurs: string[] = [];
  const passerUtilise: string[] = [];
  const evenements: string[] = [];
  let pas = 0;
  for (; pas < maxPas; pas++) {
    const inv = verifierInvariants(s);
    if (inv.length) {
      erreurs.push(...inv.map((e) => `pas ${pas} (${s.scene.type === 'evenement' ? s.scene.id : s.scene.type}) : ${e}`));
      break;
    }
    if (s.scene.type === 'fin') break;
    try {
      // Un joueur répartit ses points de temps en temps, plutôt dans ses points forts.
      if (s.pointsStat > 0 && pick(3) === 0) {
        const a = ATTRIBUTS[pick(ATTRIBUTS.length)];
        if (coutRepartition(s, { [a]: 1 }) <= s.pointsStat && s.attributs[a] < 100) s = repartir(s, { [a]: 1 });
      }
      if (s.scene.type === 'evenement') {
        evenements.push(s.scene.id);
        const ev = R.evenements[s.scene.id];
        const vues = choixVisibles(s, ev);
        const dispo = vues.filter((x) => x.disponible);
        let ch = dispo[pick(dispo.length)];
        // Un joueur engagé utilise ses attaques spéciales quand il en a.
        if (ch.attaques?.length && pick(2) === 0) ch = { ...ch, id: ch.attaques[pick(ch.attaques.length)].id };
        if (ch.id === '__passer') passerUtilise.push(ev.id);
        s = choisir(s, ch.id);
      } else if (s.scene.type === 'combat') {
        const v = vueCombat(s)!;
        const ids = v.adversaire ? ['esquiver', 'contrer'] : ['simple', ...v.attaques.map((a) => a.id)];
        s = manche(s, ids[pick(ids.length)]);
      } else if (s.scene.type === 'affrontement') {
        // Un joueur ordinaire : souvent l'attaque, parfois la défense ou la parole, rarement la fuite.
        const v = vueAffrontement(s)!;
        const possibles = v.familles.flatMap((f) => f.actions.filter((a) => a.disponible).map((a) => ({ famille: f.id, choix: a.id })));
        const offensives = possibles.filter((p) => p.famille === 'taijutsu' || p.famille === 'ninjutsu');
        const pool = offensives.length && pick(3) > 0 ? offensives : possibles.filter((p) => p.famille !== 'fuite' || pick(4) === 0);
        s = combattre(s, (pool.length ? pool : possibles)[pick((pool.length ? pool : possibles).length)]);
      } else if (s.scene.type === 'resultat' || s.scene.type === 'bilan') {
        s = continuer(s);
      } else {
        const acts = genererActivites(s).filter((a) => a.disponible && a.categorie !== 'equipement' && a.categorie !== 'forge');
        // Préférer les missions et l'entraînement, comme un joueur engagé.
        const missions = acts.filter((a) => a.categorie === 'mission');
        const sorts = acts.filter((a) => a.groupe === 'sort');
        const disciplines = acts.filter((a) => a.groupe === 'discipline');
        // Parfois, un programme double : une technique et une discipline.
        if (duoPossible(s) && sorts.length && disciplines.length && pick(4) === 0) {
          s = activite(s, `duo:${sorts[pick(sorts.length)].id}+${disciplines[pick(disciplines.length)].id}`);
          continue;
        }
        const choix = missions.length && pick(3) > 0 ? missions : acts;
        s = activite(s, choix[pick(choix.length)].id);
      }
    } catch (e) {
      erreurs.push(`pas ${pas} : exception ${(e as Error).message}`);
      break;
    }
  }
  return { etat: s, pas, fin: s.fin?.id, erreurs, passerUtilise, evenements };
}
