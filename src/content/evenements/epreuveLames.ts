import type { Condition, EventDef } from '../../engine/types';

/**
 * L'épreuve des lames : un examen où le ninjutsu et les pouvoirs sont interdits. On s'y bat à l'arme et au corps,
 * comme dans les longues batailles où il ne reste plus une goutte de chakra.
 */
const ACTIF: Condition = { statut: 'actif' };
const commun = { chapitre: 1, chapitres: [1, 2, 3], arc: 'premieres_missions' as const };

export const EPREUVE_LAMES: EventDef[] = [
  {
    id: 'ex_lames',
    ...commun,
    titre: 'L’épreuve des lames',
    categorie: 'examen',
    lieu: '$terrain',
    poids: 7,
    si: { tout: [ACTIF, { rangMin: 'genin' }, { age: { min: 13, max: 30 } }] },
    texte: [
      { texte: 'Une convocation glissée sous ta porte : épreuve des lames, demain à l’aube, terrain trois. Sur place, l’examinateur a les bras croisés et une cicatrice qui lui ferme un œil. « Règle unique : pas un signe. Pas de ninjutsu, pas de pouvoir, pas d’yeux. L’arme, le corps, la tête. Dans une vraie guerre, le chakra s’épuise au troisième jour. Le reste du temps, on se bat comme ça. »' },
      { si: { armeEnMain: true }, texte: 'Tu sens le poids de ton arme à ta ceinture. Elle n’a jamais semblé aussi importante.' },
    ],
    choix: [
      {
        id: 'avec_mon_arme',
        texte: 'Te présenter avec ta propre arme',
        si: { armeEnMain: true },
        verrou: 'Il te faudrait une arme à toi.',
        resultat: 'L’examinateur jette un œil à ton arme, puis à tes mains. « On verra si elle te connaît. »',
        suite: 'ex_lames_duel',
      },
      {
        id: 'arme_pretee',
        texte: 'Prendre le sabre d’entraînement que l’examinateur te tend',
        effets: [{ obtenirArme: 'tanto_simple', statut: 'pretee' }, { equiper: 'tanto_simple' }],
        resultat: 'Un tantō émoussé, la poignée usée par cent mains avant la tienne. « Il est à rendre après. Même cassé. »',
        suite: 'ex_lames_duel',
      },
      {
        id: 'refuser',
        texte: '« Je suis un ninja, pas un samouraï. »',
        effets: [{ stat: 'social.reputation', delta: -2 }, { stat: 'attributs.controleEmotionnel', delta: -1 }],
        resultat: 'L’examinateur hausse les épaules. « Le jour où ton chakra te lâchera, tu repenseras à cette phrase. » Il passe au suivant.',
      },
    ],
  },
  {
    id: 'ex_lames_duel',
    ...commun,
    titre: 'L’épreuve des lames : le duel',
    categorie: 'examen',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: 'En face de toi, un chūnin désigné par l’examinateur, un bō de chêne dans les mains. Autour, une dizaine de genin regardent sans un bruit. « Commencez. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre sans un seul signe',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { force: 2, agilite: 2, perception: 1 },
          maitrises: { arme: 2, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Le bō vole hors de ses mains et roule dans la poussière. L’examinateur décroise les bras. « Bien. Tu sais te battre quand tout le reste t’a lâché. Peu de gens le savent. » Ton nom est noté en rouge, en haut de la liste.',
            effets: [{ stat: 'social.reputation', delta: 4 }, { entrainer: 'taijutsu', jours: 15 }, { drapeau: 'epreuve_lames', valeur: 'reussie' }, { stat: 'attributs.force', delta: 1 }],
          },
          echec: {
            texte: 'Le bō te cueille derrière le genou, puis à la nuque. Tu te réveilles sur le banc, une poche de glace sur la tête. « Ton chakra, c’est ta béquille, dit l’examinateur. Apprends à marcher sans. »',
            effets: [{ stat: 'jauges.sante', delta: -8 }, { drapeau: 'epreuve_lames', valeur: 'echouee' }, { stat: 'attributs.agilite', delta: 1 }],
          },
        },
      },
      {
        id: 'abandonner',
        texte: 'Poser ton arme et quitter le cercle',
        effets: [{ stat: 'social.reputation', delta: -3 }],
        resultat: 'Personne ne dit rien. C’est pire.',
      },
    ],
  },
];
