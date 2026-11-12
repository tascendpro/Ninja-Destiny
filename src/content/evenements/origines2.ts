import type { EventDef } from '../../engine/types';
import { segmentsParVillage } from './outils';

/**
 * D'autres premiers matins. Une vie commence par l'une de quatre ouvertures, tirée à la création (drapeau « ouverture ») :
 * 0, le matin propre à chaque village (origines.ts) ; 1, la nuit des cloches ; 2, le bandeau dans la poussière ; 3, le jeu
 * des ninjas. Chacune se décline dans les cinq villages.
 */
const DEPART6 = { ageDepart: 6 } as const;
const base = { chapitre: 1, arc: 'origines', lieu: '$village', priorite: 100 } as const;

export const ORIGINES_2: EventDef[] = [
  // ── 1. La nuit des cloches ──
  {
    ...base,
    id: 'o_nuit_cloches',
    titre: 'La nuit des cloches',
    categorie: 'enfance',
    si: { tout: [DEPART6, { drapeau: 'ouverture', egal: 1 }] },
    personnages: ['@parent'],
    texte: [
      ...segmentsParVillage({
        konoha: 'Les cloches du mur d’enceinte sonnent au milieu de la nuit, toutes ensemble, et les chiens du quartier se mettent à hurler.',
        suna: 'Les gongs de la muraille résonnent au milieu de la tempête de sable, trois coups longs, trois coups courts, encore et encore.',
        kiri: 'Les cornes de brume mugissent au milieu de la nuit, si graves qu’elles font trembler l’eau dans les jarres.',
        kumo: 'Les tambours des falaises roulent au milieu de la nuit, et l’écho les renvoie de pic en pic jusqu’à ce qu’on ne sache plus d’où ils viennent.',
        iwa: 'Les cloches de pierre sonnent au milieu de la nuit, un son sourd qui monte de la montagne elle-même.',
      }),
      {
        texte:
          '{Parent} te tire du lit sans allumer la lampe. « Dans le placard. Pas un bruit. » La porte se referme. Par la fente entre les planches, tu vois la ruelle, éclairée par la lune.\n\nUn shinobi du village s’y adosse au mur, une main pressée sur le ventre. Le bandeau de travers, le souffle court. Il lève la tête, et ses yeux trouvent la fente. Il t’a vu{e}. « Petit{e}… », souffle-t-il. « De l’eau. Juste un peu d’eau. »',
      },
    ],
    choix: [
      {
        id: 'eau',
        texte: 'Sortir en silence et lui apporter la cruche',
        effets: [{ ethique: { compassion: 7 } }, { drapeau: 'nuit_cloches', valeur: 'eau' }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat:
          'La cruche est lourde, tes mains tremblent. Il boit à longues gorgées, puis il pose deux doigts sur ton front. « Retourne te cacher. Tu n’as rien vu. » Au matin, la ruelle est vide, lavée à grande eau. Mais sur le seuil, quelqu’un a laissé un kunai d’entraînement, au manche entouré de tissu neuf.',
      },
      {
        id: 'parent',
        texte: 'Appeler {parent} à voix basse',
        effets: [{ relation: '@parent', delta: { confiance: 6 } }, { drapeau: 'nuit_cloches', valeur: 'parent' }],
        resultat:
          '{Parent} revient aussitôt, regarde par la fente, et sort sans un mot. Tu entends des voix basses dans la ruelle, des pas qui s’éloignent. Quand {il:@parent} revient, {il:@parent} a du sang sur les manches. « Tu as bien fait de m’appeler. Ce soir, tu as aidé à sauver quelqu’un. Ne le raconte à personne. »',
      },
      {
        id: 'retenir',
        texte: 'Ne pas bouger, et graver son visage dans ta mémoire',
        effets: [{ stat: 'attributs.perception', delta: 2 }, { drapeau: 'nuit_cloches', valeur: 'visage' }],
        resultat:
          'Tu ne bouges pas. Tu regardes : la cicatrice au menton, le motif sur la poignée de son sabre, la façon dont il compte ses respirations. Au bout d’un long moment, deux silhouettes l’emportent. Des années plus tard, tu reconnaîtras ce visage au premier coup d’œil, dans un endroit où tu ne l’attendais pas.',
      },
    ],
  },

  // ── 2. Le bandeau dans la poussière ──
  {
    ...base,
    id: 'o_bandeau_poussiere',
    titre: 'Le bandeau dans la poussière',
    categorie: 'enfance',
    si: { tout: [DEPART6, { drapeau: 'ouverture', egal: 2 }] },
    personnages: ['@parent'],
    texte: [
      ...segmentsParVillage({
        konoha: 'Le marché du matin sent le riz chaud et les feuilles de thé. {Parent} marchande des poireaux, et tu t’éloignes de trois pas, puis de dix.',
        suna: 'Le marché couvert sent les épices et le cuir chaud. {Parent} marchande des dattes à l’ombre d’une toile, et tu t’éloignes vers la lumière.',
        kiri: 'Le marché du port sent le sel et le poisson fumé. {Parent} marchande avec un pêcheur qui ne sourit jamais, et tu t’éloignes le long des quais.',
        kumo: 'Le marché des terrasses sent le gingembre et la pierre mouillée. {Parent} marchande en haut d’un escalier, et tu t’éloignes vers le bord.',
        iwa: 'Le marché des tailleurs de pierre sent la poussière et le métal. {Parent} marchande un panier de galets à feu, et tu t’éloignes entre les étals.',
      }),
      {
        texte:
          'Sous une charrette, à moitié enfoui dans la poussière, quelque chose brille. Un bandeau frontal, la plaque de métal rayée d’une longue entaille. Le tissu est raide, taché de brun.\n\nUne vieille femme passe et repasse dans l’allée, le dos voûté, les yeux sur le sol. Elle cherche quelque chose. Elle ne t’a pas encore vu.',
      },
    ],
    choix: [
      {
        id: 'rendre',
        texte: 'Le lui apporter',
        effets: [{ ethique: { compassion: 6 } }, { drapeau: 'bandeau_poussiere', valeur: 'rendu' }, { stat: 'social.reputation', delta: 2 }],
        resultat:
          'Elle le prend à deux mains. Elle ne pleure pas. « C’était celui de mon fils. Il est tombé de mon sac. » Elle le regarde longtemps. « Il avait ton âge quand il a voulu le porter. » Elle te caresse la joue avec un pouce rugueux, et s’en va sans rien ajouter. {Parent} te retrouve là, immobile, et ne te demande rien.',
      },
      {
        id: 'nouer',
        texte: 'Le nouer sur ton front, juste une minute',
        effets: [{ ethique: { ambition: 6 } }, { drapeau: 'bandeau_poussiere', valeur: 'noue' }],
        resultat:
          'Il est trop grand, il te tombe sur les yeux. Le métal est froid. Pendant une minute, tu es un vrai ninja, et le marché entier pourrait te regarder. Puis une main se pose sur ton épaule : la vieille femme. Elle ne te gronde pas. « Il te va mieux qu’à lui, à ton âge », dit-elle. Elle le reprend doucement. « Gagne le tien. »',
      },
      {
        id: 'demander',
        texte: 'Le montrer à {parent} et demander à qui il était',
        effets: [{ relation: '@parent', delta: { confiance: 4 } }, { stat: 'attributs.intellect', delta: 1 }, { drapeau: 'bandeau_poussiere', valeur: 'question' }],
        resultat:
          '{Parent} pâlit en voyant l’entaille. « Quelqu’un qui ne reviendra pas. » {Il:@parent} rend le bandeau à la vieille femme, s’incline profondément, et sur le chemin du retour, {il:@parent} te parle pour la première fois de la dernière guerre. Pas tout. Assez pour que tu comprennes que ce métal coûte cher.',
      },
    ],
  },

  // ── 3. Le jeu des ninjas ──
  {
    ...base,
    id: 'o_jeu_ninjas',
    titre: 'Le jeu des ninjas',
    categorie: 'enfance',
    si: { tout: [DEPART6, { drapeau: 'ouverture', egal: 3 }] },
    texte: [
      ...segmentsParVillage({
        konoha: 'Au bord de la rivière, sous les érables, les enfants du quartier jouent aux ninjas avec des bâtons.',
        suna: 'Dans la cour à l’abri du vent, les enfants du quartier jouent aux ninjas avec des bâtons et des cailloux.',
        kiri: 'Sur le ponton abandonné, dans la brume du matin, les enfants du quartier jouent aux ninjas avec des rames cassées.',
        kumo: 'Sur la terrasse au-dessus du vide, là où les adultes interdisent d’aller, les enfants jouent aux ninjas avec des bâtons.',
        iwa: 'Dans la carrière abandonnée, entre les blocs de pierre, les enfants du quartier jouent aux ninjas avec des bâtons.',
      }),
      {
        texte:
          'On te choisit en dernier. « Toi, tu fais l’ennemi », décide le plus grand, un garçon de neuf ans qui se prend déjà pour un jōnin. « Avec le petit, là. » Le petit a cinq ans, et il a déjà peur.\n\nLe jeu commence. Le grand ne fait pas semblant : son bâton frappe pour de vrai, et le petit tombe dans la poussière, la lèvre fendue. Les autres rient. Le grand se tourne vers toi.',
      },
    ],
    choix: [
      {
        id: 'proteger',
        texte: 'Te mettre devant le petit',
        effets: [{ ethique: { honneur: 7 } }, { drapeau: 'jeu_ninjas', valeur: 'protege' }, { stat: 'jauges.sante', delta: -4 }],
        resultat:
          'Le bâton te touche à l’épaule, fort. Tu ne bouges pas. Le grand hésite, parce qu’un ennemi n’est pas censé rester debout. « T’es pas drôle », finit-il par dire, et il jette son bâton. Le petit te tient la manche tout le chemin du retour. Il s’appelle Sōta. Il ne l’oubliera pas, et toi non plus.',
      },
      {
        id: 'regle',
        texte: 'Proposer une nouvelle règle : on ne touche qu’avec le bout du bâton',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { drapeau: 'jeu_ninjas', valeur: 'regle' }],
        resultat:
          '« Un vrai ninja, ça contrôle sa force », tu dis, très fort, pour que tout le monde entende. « Sinon c’est un bandit. » Les autres se regardent. Personne ne veut être un bandit. Le grand grogne, mais il accepte. Le jeu dure jusqu’au soir, et c’est toi qui en fixes les règles, sans que personne ne s’en rende compte.',
      },
      {
        id: 'seul',
        texte: 'Partir, et t’entraîner seul{e} derrière les maisons',
        effets: [{ ethique: { ambition: 7 } }, { stat: 'attributs.agilite', delta: 1 }, { drapeau: 'jeu_ninjas', valeur: 'seul' }],
        resultat:
          'Tu les laisses à leur jeu. Derrière les maisons, tu frappes un poteau avec ton bâton jusqu’à ce que tes mains brûlent. Un jour, tu seras plus fort{e} que le grand, que tous les grands. En rentrant, tu passes devant le petit, assis seul dans la poussière. Tu ne t’arrêtes pas. Tu y repenseras.',
      },
    ],
  },
];
