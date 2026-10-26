import type { ContenuRacine } from '../../engine/combat/types';
import { ADVERSAIRES } from './adversaires';
import { ADVERSAIRES_AKATSUKI, AFFRONTEMENTS_AKATSUKI } from './akatsuki';
import { ANNONCES, RECITS } from './lignes';
import { RECITS_SUPP } from './lignesSupp';
import { REACTIONS_REPETITION, REPETITIONS } from './repetitions';

/**
 * Les combats branchés sur l'Affrontement Racine, par « scène/choix ».
 * Migration progressive (§4.1) : la scène pilote d'abord ; les autres combats gardent l'ancien système jusqu'à leur tour.
 */
const AFFRONTEMENTS_RACINE: ContenuRacine['affrontements'] = {
  // L'épreuve des lames : ni ninjutsu, ni pouvoirs. L'arme, le corps, la tête. Ce qui reste quand le chakra est vide.
  'ex_lames_duel/combattre': {
    adversaire: 'gen:ex_lames_duel/combattre',
    contexte: 'examen',
    raison: 'L’épreuve des lames : prouver qu’on reste un ninja quand le chakra est vide.',
    temoins: ['examinateurs'],
    interdit: ['ninjutsu', 'pouvoir'],
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
};

export const RACINE: ContenuRacine = {
  adversaires: [...ADVERSAIRES, ...ADVERSAIRES_AKATSUKI],
  affrontements: { ...AFFRONTEMENTS_RACINE, ...AFFRONTEMENTS_AKATSUKI },
  // Les récits de base et leurs variantes supplémentaires, réunis clé par clé.
  recits: Object.fromEntries([...new Set([...Object.keys(RECITS), ...Object.keys(RECITS_SUPP)])].map((k) => [k, [...(RECITS[k] ?? []), ...(RECITS_SUPP[k] ?? [])]])),
  annonces: ANNONCES,
  repetitions: REPETITIONS,
  reactionsRepetition: REACTIONS_REPETITION,
};
