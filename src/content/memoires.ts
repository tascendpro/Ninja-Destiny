import type { Condition, Effect, EventDef, TypeFait } from '../engine/types';

/**
 * Les moments qui comptent, déclarés en un seul endroit : quelle scène inscrit quel fait dans quelle relation.
 *
 * On ne mémorise pas chaque phrase : seulement ce qu'un personnage pourra rappeler des années plus tard (un sauvetage,
 * une dispute, un secret confié, une trahison). Le reste s'enregistre tout seul (première rencontre, duels, promesses :
 * engine/memoire.ts). Les étiquettes disent qui a fait quoi : « toi » (le joueur), « lui » (le personnage).
 *
 * Une entrée vise un choix, et, s'il y a une épreuve, certaines issues seulement.
 */
interface Moment {
  /** « scène/choix » */
  cle: string;
  /** Les issues de l'épreuve concernées (toutes si absent). */
  issues?: ('critique' | 'succes' | 'partiel' | 'echec')[];
  pnj: string;
  type: TypeFait;
  importance?: 1 | 2 | 3;
  tags?: string[];
  /** Le fait ne s'inscrit que si cette condition tient (ex. : le blessé est A, pas B). */
  si?: Condition;
}

const A_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };

const MOMENTS: Moment[] = [
  // L'aîné·e : les entraînements de l'aube (le kawarimi s'inscrit dans les conclusions du combat, apprentissage.ts / combat/index.ts).
  { cle: 'ap_aine_premier/combat', pnj: '@aine', type: 'entrainement', importance: 2, tags: ['baton'] },
  { cle: 'ap_aine_premier/lancer', pnj: '@aine', type: 'entrainement', importance: 2, tags: ['kunai'] },
  { cle: 'ap_aine_premier/chakra', pnj: '@aine', type: 'entrainement', importance: 2, tags: ['chakra'] },
  { cle: 'ap_aine_deuxieme/ruse', issues: ['succes'], pnj: '@aine', type: 'entrainement', importance: 2, tags: ['piege', 'toi'] },

  // Le rival : ce qu'il, elle ne dira à personne d'autre.
  { cle: 'dg_rival_aveu/moi_aussi', pnj: '@rival', type: 'secret', importance: 3, tags: ['lui', 'toi', 'fige'] },
  { cle: 'dg_rival_aveu/promettre', pnj: '@rival', type: 'secret', importance: 3, tags: ['lui', 'fige'] },
  { cle: 'mo_nuit_lanternes/demander', pnj: '@rival', type: 'secret', importance: 2, tags: ['lui', 'pere'] },
  { cle: 'mo_nuit_lanternes/moquer', pnj: '@rival', type: 'dispute', importance: 2, tags: ['toi', 'larmes'] },
  { cle: 'vis_rival_heritage/moquer', pnj: '@rival', type: 'humiliation', importance: 3, tags: ['toi', 'larmes'] },
  { cle: 'vis_rival_heritage/rester', pnj: '@rival', type: 'moment', importance: 2, tags: ['toi', 'larmes'] },
  { cle: 'c2_foret_nuit/rival', pnj: '@rival', type: 'sauvetage', importance: 3, tags: ['lui', 'contrepoison'] },
  { cle: 'a_premier_lancer/lancer', issues: ['echec'], pnj: '@rival', type: 'humiliation', importance: 1, tags: ['lui', 'temoins'] },

  // L'ami·e : ce que vous avez traversé.
  { cle: 'c2_foret_nuit/porter', pnj: '@coequipierA', type: 'sauvetage', importance: 3, tags: ['toi', 'poison'], si: A_VIVANT },
  { cle: 'c2_foret_nuit/porter', pnj: '@coequipierB', type: 'sauvetage', importance: 3, tags: ['toi', 'poison'], si: { non: A_VIVANT } },
  { cle: 'c2_foret_nuit/soigner', issues: ['succes'], pnj: '@coequipierA', type: 'sauvetage', importance: 3, tags: ['toi', 'poison'], si: A_VIVANT },
  { cle: 'c2_foret_nuit/abandonner', pnj: '@coequipierA', type: 'trahison', importance: 3, tags: ['toi', 'abandon'], si: A_VIVANT },
  { cle: 'c2_foret_nuit/abandonner', pnj: '@coequipierB', type: 'trahison', importance: 3, tags: ['toi', 'abandon'], si: { non: A_VIVANT } },
  { cle: 'cl_yuki_montagne/aiguilles', issues: ['echec'], pnj: '@coequipierA', type: 'sauvetage', importance: 3, tags: ['lui', 'tempete'] },
  { cle: 'cl_yuki_montagne/refuge', pnj: '@coequipierA', type: 'sauvetage', importance: 3, tags: ['toi', 'crevasse'] },
  { cle: 'dl_ravin/demi_tour', pnj: '@coequipierA', type: 'sauvetage', importance: 3, tags: ['toi', 'ravin'] },
  { cle: 'dl_ravin/continuer', pnj: '@coequipierA', type: 'trahison', importance: 2, tags: ['toi', 'ravin', 'mission'] },
  { cle: 'dg_veille_confiance/dur', pnj: '@coequipierA', type: 'dispute', importance: 2, tags: ['toi', 'examen'] },
  { cle: 'ap_ami_entrainement/secret', pnj: '@coequipierA', type: 'secret', importance: 2, tags: ['toi', 'geste_aine'] },
  { cle: 'ap_ami_entrainement/refuser', pnj: '@coequipierA', type: 'dispute', importance: 1, tags: ['toi'] },

  // Le coéquipier, la coéquipière.
  { cle: 'dl_dispute/hesite', pnj: '@coequipierB', type: 'dispute', importance: 2, tags: ['toi', 'reproche'] },
  { cle: 'dl_hyuga_uchiha/avouer', pnj: '@coequipierB', type: 'secret', importance: 3, tags: ['lui', 'toi', 'sceau'] },
  { cle: 'dl_hyuga_uchiha/piquer', pnj: '@coequipierB', type: 'dispute', importance: 2, tags: ['toi', 'sceau'] },
  { cle: 'a11_dette_ami/preter', pnj: '@coequipierB', type: 'moment', importance: 2, tags: ['toi', 'dette'] },
  { cle: 'a11_dette_ami/pourquoi', pnj: '@coequipierB', type: 'dispute', importance: 2, tags: ['toi', 'dette'] },
  { cle: 'e6_bagarre_ami/intervenir', pnj: '@coequipierB', type: 'sauvetage', importance: 2, tags: ['toi', 'bagarre'] },

  // Le parent : la lettre du tiroir.
  { cle: 'fam_lettre/insister', pnj: '@parent', type: 'dispute', importance: 2, tags: ['toi', 'lettre'] },
  { cle: 'fam_lettre/famille', issues: ['succes'], pnj: '@parent', type: 'secret', importance: 3, tags: ['lui', 'lettre'] },
  { cle: 'fam_lettre/famille', issues: ['echec'], pnj: '@parent', type: 'dispute', importance: 2, tags: ['lettre'] },
];

/** L'effet d'un moment : conditionné s'il le faut. */
function effet(m: Moment): Effect {
  const e: Effect = { memoire: m.pnj, type: m.type, importance: m.importance, tags: m.tags };
  return m.si ? { si: m.si, alors: [e] } : e;
}

/**
 * Ajoute les moments aux scènes, au chargement du contenu. Une clé qui ne vise aucun choix est une erreur de contenu :
 * on la signale tout de suite plutôt que de laisser un souvenir se perdre en silence.
 */
export function avecMoments(evenements: EventDef[]): EventDef[] {
  const parId = new Map(evenements.map((e) => [e.id, e]));
  for (const m of MOMENTS) {
    const [evId, choixId] = m.cle.split('/');
    const c = parId.get(evId)?.choix.find((x) => x.id === choixId);
    if (!c) throw new Error(`[mémoire] moment sur un choix inconnu : ${m.cle}`);
    if (c.test) {
      for (const k of m.issues ?? (['critique', 'succes', 'partiel', 'echec'] as const)) {
        const o = c.test[k];
        if (o) o.effets = [...o.effets, effet(m)];
      }
    } else c.effets = [...(c.effets ?? []), effet(m)];
  }
  return evenements;
}
