import type { AffrontementDef, ConclusionDef, ContenuRacine, ContexteId } from '../../engine/combat/types';
import type { Condition, Effect } from '../../engine/types';
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

// ── Trois minutes face à l'aîné·e (apprentissage.ts, ap_aine_deuxieme) ─────────────────────────
// Tenir n'est pas gagner : arrivé·e au bout du temps, tu as réussi l'épreuve, même plus amoché·e qu'{il}. Le mettre à terre,
// c'est autre chose, et {il} ne te le présente pas comme une victoire. Tomber avant la fin, c'est l'échec d'aujourd'hui.
// La voix suit ce que l'aîné·e est pour toi (sa posture) : sa fierté ne se dit jamais en face.
const AINE_POSTURE = (est: string | string[]): Condition => ({ posture: 'aine', est });
const KAWARIMI: Effect[] = [
  { entrainer: 'taijutsu', jours: 30, mentor: true },
  { apprendre: 'kawarimi', source: 'mentor' },
  { entrainer: 'kawarimi', jours: 30, mentor: true },
  { stat: 'attributs.agilite', delta: 2 },
  { stat: 'attributs.controleEmotionnel', delta: 1 },
  { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] },
];
const TENU: ConclusionDef = {
  texte: [
    { texte: 'Trois minutes. Tu ne l’as pas battu{aine_e}. Mais tu as tenu.' },
    { texte: '{AineNom} baisse les bras. Son regard passe de ton visage à tes mains, qui tremblent encore. {Aine_il} souffle par le nez, ce qui, chez {lui:@aine}, tient lieu de rire.' },
    { texte: '« Tu as tenu. » Un temps. « L’an dernier, tu serais tombé·e à la première minute. Je commençais à me demander si tu finirais par comprendre qu’on ne gagne pas toujours en frappant. »' },
    { texte: '{Aine_il} s’approche et remonte ta garde de deux doigts, comme {aine_il} le fait depuis que tu as six ans. « Maintenant, regarde bien. » Un claquement de mains, un nuage de fumée : à sa place, une bûche roule dans l’herbe. {AineNom} est derrière toi. Tu ne l’as pas vu{aine_e} passer.' },
    { texte: '« Le kawarimi. Je te l’apprends. Mais si je te vois t’en servir pour sécher l’Académie, je te le désapprends. »' },
    { si: AINE_POSTURE('complice'), texte: 'Le soir, à table, {aine_il} raconte à qui veut l’entendre que tu lui as mis un coup au menton. C’est faux. Tu ne le corriges pas.' },
    { si: AINE_POSTURE('severe'), texte: '« Et essuie ce sourire. Tenir, ce n’est pas gagner. C’est ne pas perdre. Ce n’est pas pareil, et ça ne te suffira pas toujours. »' },
    { si: AINE_POSTURE('jaloux'), texte: 'Quand tu {le:@aine} remercies, {aine_il} hausse les épaules un peu trop vite. Tu progresses. {Aine_il} l’a vu avant toi, et ça ne {le:@aine} rend pas seulement fier{aine_e}.' },
    { si: AINE_POSTURE('distant'), texte: '{Aine_il} t’apprend le geste sans un mot de plus, et repart avant que tu aies fini de le répéter. Vous ne vous étiez pas parlé aussi longtemps depuis des mois.' },
  ],
  effets: [...KAWARIMI, { relation: '@aine', delta: { respect: 8, attachement: 5 } }, { memoire: '@aine', type: 'entrainement', importance: 3, tags: ['kawarimi', 'tenu'] }],
  // Arrivé·e au bout des trois minutes, même plus amoché·e : c'est l'épreuve réussie.
  issue: 'succes',
};
const CONCLUSIONS_TROIS_MINUTES: AffrontementDef['conclusions'] = {
  departage_gagne: TENU,
  departage_nul: TENU,
  departage_perdu: TENU,
  victoire: {
    texte: [
      { texte: 'Tu ne devais que tenir. À la deuxième minute, ton pied accroche sa cheville au moment où {aine_il} prend appui, et {AineNom} part en arrière dans l’herbe mouillée. Tu restes au-dessus, le poing levé, sans trop savoir quoi en faire.' },
      { texte: 'Le silence dure. Puis {aine_il} éclate de rire, sur le dos, les bras en croix. « D’accord. D’accord. Je retenais mes coups. Un peu. » Ce n’est pas tout à fait vrai, et vous le savez tous les deux.' },
      { texte: '{Aine_il} se relève et te remet en garde, plus sérieusement que d’habitude. « Ce que je voulais t’apprendre si tu tenais, je te l’apprends quand même. Mais tu viens de te mettre à découvert pour finir. Si j’avais été un ennemi, je t’aurais eu·e en me relevant. »' },
      { texte: 'Une bûche, un nuage de fumée : le kawarimi. « Une permutation, c’est pour survivre. Pas pour frimer. Retiens au moins ça. »' },
      { si: AINE_POSTURE(['complice', 'protecteur']), texte: 'Le soir, {aine_il} ne raconte rien à table. Mais {parent} sait. Tu ne sauras jamais qui le lui a dit.' },
      { si: AINE_POSTURE(['jaloux', 'distant', 'severe']), texte: 'Sur le chemin du retour, {aine_il} marche un pas devant toi, sans se retourner. Tu as gagné quelque chose ce matin, et tu en as peut-être perdu une autre.' },
    ],
    effets: [...KAWARIMI, { stat: 'attributs.agilite', delta: 1 }, { relation: '@aine', delta: { respect: 12, rivalite: 4 } }, { memoire: '@aine', type: 'entrainement', importance: 3, tags: ['kawarimi', 'victoire', 'toi'] }],
  },
  defaite: {
    texte: [
      { texte: 'Une minute, peut-être moins. Puis tu es au sol, le souffle coupé, le genou de {AineNom} sur la poitrine. Pas fort. Juste assez.' },
      { texte: '« Un ennemi ne s’arrêterait pas là. » {Aine_il} attend que tu cesses de lutter pour respirer, puis se relève et te tend la main, comme toujours.' },
      { texte: '« Je t’avais dit de tenir, pas de frapper. Tu as voulu me battre. » {Aine_il} te tapote le front du doigt. « Tenir, ça se passe là-dedans. Dans six mois, on recommence. Et cette fois, tu respires. »' },
      { si: AINE_POSTURE(['complice', 'protecteur']), texte: 'Le soir, il y a deux parts de dessert dans ton bol. Personne ne dit d’où vient la deuxième.' },
      { si: AINE_POSTURE('severe'), texte: '« Et ne fais pas cette tête. Je ne te ferai pas de cadeau parce qu’on dort sous le même toit. Le jour où ce sera un vrai ennemi, il n’en fera pas non plus. »' },
      { si: AINE_POSTURE(['jaloux', 'distant']), texte: '{Aine_il} ne t’attend pas pour rentrer. Tu restes un moment assis·e dans l’herbe, à te demander si c’était une leçon ou une revanche.' },
    ],
    effets: [{ entrainer: 'taijutsu', jours: 20, mentor: true }, { stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }, { memoire: '@aine', type: 'entrainement', importance: 2, tags: ['tombe'] }],
  },
  paix: {
    texte: '« On arrête ? » {AineNom} baisse sa garde, surpris{aine_e} que ce soit toi qui le proposes. « D’accord. Mais ce n’était pas trois minutes. » {Aine_il} ne t’apprend rien ce jour-là. Le lendemain, à l’aube, {aine_il} est quand même au terrain.',
    effets: [{ entrainer: 'taijutsu', jours: 15, mentor: true }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }, { memoire: '@aine', type: 'entrainement', importance: 1, tags: ['abandon'] }],
  },
  fuite: {
    texte: 'Tu recules, puis tu cours. {AineNom} ne te poursuit pas. Le soir, {aine_il} ne t’en parle pas, et c’est pire que tous les reproches. À l’aube suivante, {aine_il} t’attend quand même.',
    effets: [{ stat: 'attributs.controleEmotionnel', delta: -1 }, { retour: 'ap_aine_depart', chance: 1, entre: [200, 400] }, { memoire: '@aine', type: 'entrainement', importance: 2, tags: ['fuite', 'toi'] }],
  },
};
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
  'ap_aine_deuxieme/tenir': { adversaire: 'aine_entrainement', contexte: 'entrainement', raison: 'Tenir trois minutes face à {aineNom}.', conclusions: CONCLUSIONS_TROIS_MINUTES },
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
