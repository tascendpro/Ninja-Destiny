import type { ContenuRacine } from '../../engine/combat/types';
import { ADVERSAIRES } from './adversaires';
import { ANNONCES, RECITS } from './lignes';
import { REACTIONS_REPETITION, REPETITIONS } from './repetitions';

/**
 * Les combats branchés sur l'Affrontement Racine, par « scène/choix ».
 * Migration progressive (§4.1) : la scène pilote d'abord ; les autres combats gardent l'ancien système jusqu'à leur tour.
 */
const AFFRONTEMENTS_RACINE: ContenuRacine['affrontements'] = {
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
};

export const RACINE: ContenuRacine = {
  adversaires: ADVERSAIRES,
  affrontements: AFFRONTEMENTS_RACINE,
  recits: RECITS,
  annonces: ANNONCES,
  repetitions: REPETITIONS,
  reactionsRepetition: REACTIONS_REPETITION,
};
