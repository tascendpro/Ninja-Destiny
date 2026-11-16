import type { ContenuRacine, ContexteId } from '../../engine/combat/types';
import type { Condition } from '../../engine/types';
import { ADVERSAIRES } from './adversaires';
import { ADVERSAIRES_AKATSUKI, AFFRONTEMENTS_AKATSUKI } from './akatsuki';
import { ADVERSAIRES_CAMPAGNE } from '../campagne/combats';
import { ANNONCES, RECITS } from './lignes';
import { RECITS_SUPP } from './lignesSupp';
import { REACTIONS_REPETITION, REPETITIONS } from './repetitions';
import { PHASES_BOSS } from './boss';

/**
 * Les combats branchés sur l'Affrontement Racine, par « scène/choix ».
 * Migration progressive (§4.1) : la scène pilote d'abord ; les autres combats gardent l'ancien système jusqu'à leur tour.
 */
const RIVAL_LA: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };
/** Un combat de scène contre le rival lui-même : sa fiche, sa mémoire, ses répliques de revanche. */
const rival = (cle: string, contexte: ContexteId, raison: string): ContenuRacine['affrontements'] => ({ [cle]: { adversaire: 'rival_academie', contexte, raison } });

const AFFRONTEMENTS_RACINE: ContenuRacine['affrontements'] = {
  // L'épreuve des lames : ni ninjutsu, ni pouvoirs. L'arme, le corps, la tête. Ce qui reste quand le chakra est vide.
  'ex_lames_duel/combattre': {
    adversaire: 'gen:ex_lames_duel/combattre',
    contexte: 'examen',
    raison: 'L’épreuve des lames : prouver qu’on reste un ninja quand le chakra est vide.',
    temoins: ['examinateurs'],
    interdit: ['ninjutsu', 'pouvoir'],
  },
  // Des années après l'Académie : régler l'histoire, juste toi et lui.
  'dl_rival_duel/tout': {
    adversaire: 'rival_academie',
    contexte: 'duel',
    raison: 'Régler une histoire commencée à l’Académie, sans témoins.',
  },
  'ap_rival_defi/combattre': {
    adversaire: 'rival_academie',
    contexte: 'provocation',
    raison: '{@rival} veut prouver devant la classe qu’{il:@rival} vaut mieux que toi.',
    temoins: ['eleves'],
    conclusions: {
      paix: {
        texte: 'Autour de vous, les élèves, déçus, se dispersent. {@rival} ramasse son sac et te lance, sans méchanceté : « La prochaine fois, on ira jusqu’au bout. »',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
      },
      fuite: {
        texte: 'Les sifflets te suivent jusqu’au coin de la rue. Demain, toute la classe le saura. Mais tu n’as pas un bleu.',
        effets: [{ stat: 'attributs.agilite', delta: 1 }],
      },
      departage_gagne: {
        texte: 'Le surveillant de la cour arrive en criant et vous sépare. {@rival} essuie sa lèvre, te fixe longtemps, et s’en va sans un mot. Ce silence-là, c’est une victoire.',
        effets: [{ entrainer: 'taijutsu', jours: 10 }, { stat: 'social.reputation', delta: 1 }],
      },
      departage_perdu: {
        texte: 'Le surveillant de la cour vous sépare. {@rival} ne triomphe pas. {Il:@rival} se penche et te dit, juste pour toi : « Tu baisses la garde quand tu as peur. Corrige ça. »',
        effets: [{ stat: 'attributs.perception', delta: 1 }],
      },
      departage_nul: {
        texte: 'Le surveillant de la cour vous sépare. Personne n’a pris le dessus. {@rival} crache par terre : « Match nul. Ça ne compte pas. » Mais {il:@rival} a l’air soulagé{e:@rival}.',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
      },
      reddition_adverse: {
        texte: '{@rival} lève les mains devant toute la cour. Personne ne rit. Tout le monde sait ce que ça lui coûte.',
        effets: [{ stat: 'social.reputation', delta: 2 }],
      },
    },
  },
  // ── Les proches en face de toi : le vrai rival, l'aîné·e, un·e coéquipier·ère ─────────────────────────────
  // Sans ces fiches, ces combats tiraient un adversaire générique au nom inventé, qui ne se souvenait de rien.
  // Le contexte reste celui que la scène imposait déjà (bagarre d'Académie, examen, duel, combat mortel).
  ...rival('a_rival_defi/accepter', 'duel', '{@rival} t’a défié·e devant l’Académie : le premier à terre a perdu.'),
  ...rival('a_examen_kumo/frontal', 'examen', 'Le duel public de l’examen, devant le Raikage.'),
  ...rival('a_examen_kumo/strategie', 'examen', 'Le duel public de l’examen, devant le Raikage.'),
  ...rival('cl_uchiha_academie/defier', 'bagarre', 'Une phrase de trop sur ton clan, et rendez-vous sur le terrain.'),
  ...rival('cl_yuki_lac/epaissir', 'bagarre', 'Le tournoi d’hiver, sur la glace : sans trahir ton sang.'),
  ...rival('cl_yuki_lac/esquiver', 'bagarre', 'Le tournoi d’hiver, sur la glace : sans trahir ton sang.'),
  ...rival('cl_raiko_gantelets/retenir', 'bagarre', 'Le tournoi de taijutsu pur, la foudre au bout des poings.'),
  ...rival('g_rival_retour/combattre', 'duel', 'Voir qui de vous deux a le plus grandi.'),
  ...rival('r_terrain_rival/duel', 'duel', 'Un duel amical, pour voir sa nouvelle technique de plus près.'),
  ...rival('r_vallee_fin/duel', 'duel', 'Régler, ici, ce que l’Académie n’a jamais réglé.'),
  ...rival('pr_rival_compte/accepter', 'duel', 'Le compte, encore : une ligne de plus, d’un côté ou de l’autre.'),
  ...rival('v_rival_nuit/combattre', 'mission', 'Des années de rancœur, une lame nue, et personne pour arbitrer.'),
  // Le même combat, un autre adversaire si le rival n'est plus là.
  'c2_tournoi/frontal': { adversaire: 'gen:c2_tournoi/frontal', contexte: 'duel', raison: 'Le duel du tournoi des chūnin, devant le Kage.', selon: [{ si: RIVAL_LA, adversaire: 'rival_academie' }] },
  'c2_tournoi/pouvoir': { adversaire: 'gen:c2_tournoi/pouvoir', contexte: 'duel', raison: 'Le duel du tournoi des chūnin, devant le Kage.', selon: [{ si: RIVAL_LA, adversaire: 'rival_academie' }] },
  'c5_rival/combat': { adversaire: 'gen:c5_rival/combat', contexte: 'duel', raison: 'Un dernier combat, pour savoir.', selon: [{ si: RIVAL_LA, adversaire: 'rival_academie' }] },
  'm4_deserteur/combattre': { adversaire: 'gen:m4_deserteur/combattre', contexte: 'mission', raison: 'Le rouleau, et celui qui l’a volé, mort ou vif.', selon: [{ si: RIVAL_LA, adversaire: 'rival_academie' }] },
  // L'aîné·e, à l'entraînement : jamais un inconnu, jamais un combat où l'on meurt.
  'ap_aine_premier/combat': { adversaire: 'aine_entrainement', contexte: 'entrainement', raison: 'Tu as demandé à {aineNom} de t’apprendre à te battre.' },
  'ap_aine_deuxieme/tenir': { adversaire: 'aine_entrainement', contexte: 'entrainement', raison: 'Tenir trois minutes face à {aineNom}.' },
  // Sous genjutsu, ton coéquipier te prend pour un ennemi.
  'cl_yamanaka_academie/frapper': { adversaire: 'coequipier_sous_genjutsu', contexte: 'bagarre', raison: 'Le maîtriser sans lui faire de mal, avant que l’illusion ne le pousse à pire.' },
};

export const RACINE: ContenuRacine = {
  // Les boss reçoivent leurs phases (§8).
  adversaires: [...ADVERSAIRES, ...ADVERSAIRES_AKATSUKI, ...ADVERSAIRES_CAMPAGNE].map((d) => (PHASES_BOSS[d.id] && !d.phases ? { ...d, phases: PHASES_BOSS[d.id] } : d)),
  affrontements: { ...AFFRONTEMENTS_RACINE, ...AFFRONTEMENTS_AKATSUKI },
  // Les récits de base et leurs variantes supplémentaires, réunis clé par clé.
  recits: Object.fromEntries([...new Set([...Object.keys(RECITS), ...Object.keys(RECITS_SUPP)])].map((k) => [k, [...(RECITS[k] ?? []), ...(RECITS_SUPP[k] ?? [])]])),
  annonces: ANNONCES,
  repetitions: REPETITIONS,
  reactionsRepetition: REACTIONS_REPETITION,
};
