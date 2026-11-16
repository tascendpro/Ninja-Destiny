import type { Condition, EventDef } from '../../engine/types';

/**
 * Des moments qui ne rapportent rien, ou presque : ils construisent les personnages et les liens.
 * Une nuit sur un toit avec le rival, une course-poursuite ridicule derrière un chat voleur.
 */

const base = { chapitre: 1, arc: 'formation' as const };
const ACTIF: Condition = { statut: 'actif' };
const RIVAL_LA: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

export const MOMENTS: EventDef[] = [
  {
    ...base,
    id: 'mo_nuit_lanternes',
    titre: 'La nuit des lanternes',
    categorie: 'rivalite',
    lieu: '$village',
    poids: 5,
    si: { tout: [ACTIF, { age: { min: 11, max: 13 } }, RIVAL_LA, { nonVu: 'mo_nuit_lanternes' }] },
    personnages: ['@rival'],
    texte: [
      {
        texte:
          'Le soir de la fête des lanternes, tout le village est dans la grande rue. Toi, tu as grimpé sur le toit de l’entrepôt à riz, parce que c’est d’ici qu’on les voit le mieux monter.\n\nQuelqu’un y est déjà. {@rival}, assis{e:@rival} au bord, les genoux sous le menton. Quand tu poses le pied sur les tuiles, {@rival} s’essuie le visage avec sa manche, très vite.\n\n« Qu’est-ce que tu fais là ? »',
      },
      { si: { relation: '@rival', axe: 'rivalite', min: 30 }, texte: '« C’est mon toit aussi », réponds-tu. D’habitude, ça suffirait pour que vous vous battiez. Ce soir, {@rival} se contente de regarder les lanternes.' },
      { si: { relation: '@rival', axe: 'rivalite', max: 29 }, texte: 'Tu ne réponds rien. Une lanterne passe juste au-dessus de vous, si près qu’on sent la chaleur de la bougie.' },
    ],
    choix: [
      {
        id: 'silence',
        texte: 'T’asseoir à côté, sans rien dire',
        ton: 'silence',
        effets: [{ relation: '@rival', delta: { respect: 4, amitie: 3 } }, { souvenir: 'La nuit des lanternes, sur le toit, sans un mot.', pnj: '@rival' }, { drapeau: 'nuit_lanternes', valeur: 'silence' }],
        resultat:
          'Tu t’assois. Pas trop près. Vous regardez les lanternes monter, une par une, jusqu’à ce qu’elles deviennent des étoiles un peu trop orange.\n\nAu bout d’un long moment, {@rival} dit, sans te regarder : « Si tu racontes ça à quelqu’un, je te tue. »\n\n« Raconter quoi ? »\n\nUn bruit qui ressemble presque à un rire. Le lendemain, à l’Académie, {@rival} te bouscule dans le couloir comme d’habitude. Mais moins fort.',
      },
      {
        id: 'demander',
        texte: 'Lui demander ce qui ne va pas',
        ton: 'franc',
        effets: [{ relation: '@rival', delta: { confiance: 4, amitie: 2 } }, { drapeau: 'rival_confidence' }, { drapeau: 'nuit_lanternes', valeur: 'confidence' }],
        resultat:
          '« Rien. »\n\nTu attends. Les lanternes attendent avec toi.\n\n« Mon père était dans la grande rue. Il a dit à tout le monde que je finirais en tête de ma promotion. Devant tout le monde. » {@rival} serre les poings. « Et si je n’y arrive pas ? »\n\nTu n’as pas de réponse. Tu dis seulement : « Alors tu finiras juste derrière moi. » C’est idiot. Ça marche quand même : {@rival} te pousse si fort que tu manques de tomber du toit.',
      },
      {
        id: 'moquer',
        texte: '« Tu pleures ? »',
        ton: 'moqueur',
        effets: [{ relation: '@rival', delta: { rivalite: 6, hostilite: 3 } }, { drapeau: 'nuit_lanternes', valeur: 'moquerie' }],
        resultat:
          'Les mots sont sortis avant que tu réfléchisses. {@rival} se lève, le visage fermé comme une porte.\n\n« Je m’en souviendrai. »\n\n{Il:@rival} descend par la gouttière sans un regard. Tu restes seul{e} avec les lanternes, et elles sont beaucoup moins belles que tout à l’heure.',
      },
      {
        id: 'partir',
        texte: 'Redescendre : ce n’est pas ta place',
        ton: 'froid',
        effets: [{ drapeau: 'nuit_lanternes', valeur: 'parti' }, { relation: '@rival', delta: { amitie: -1 } }],
        resultat: 'Tu fais demi-tour sur les tuiles. Dans ton dos, tu n’entends rien, et c’est peut-être ce qui te poursuit le plus longtemps, cette nuit-là.',
      },
    ],
  },
  {
    ...base,
    id: 'mo_chat_voleur',
    titre: 'Seigneur Moustache',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 5,
    si: { tout: [ACTIF, { age: { min: 7, max: 9 } }, { nonVu: 'mo_chat_voleur' }] },
    texte:
      'Le vieux Gorō, le poissonnier, court dans la rue en agitant un torchon. « Il a pris le maquereau ! Le plus gros ! Dix ryō à celui qui me ramène ce démon ! »\n\nLe démon en question est un chat roux, borgne, énorme, que tout le quartier appelle Seigneur Moustache. Il est assis sur le toit de la tour de guet, un maquereau entier dans la gueule, et il te regarde avec un mépris très calme.',
    choix: [
      {
        id: 'toits',
        texte: 'Le poursuivre par les toits',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { agilite: 2, perception: 1 },
          succes: {
            texte:
              'Trois toits, une corde à linge, un saut que tu ne referas jamais devant un adulte. Seigneur Moustache s’arrête enfin, acculé contre une cheminée. Il lâche le maquereau, te crache dessus, et s’en va avec la dignité d’un daimyō.\n\nGorō te donne tes dix ryō, plus une tape sur la tête qui sent le poisson pendant trois jours.',
            effets: [{ stat: 'jauges.ryo', delta: 10 }, { stat: 'attributs.agilite', delta: 1 }, { drapeau: 'moustache', valeur: 'vaincu' }],
          },
          echec: {
            texte:
              'Le chat saute. Tu sautes. Le chat atterrit sur la tuile d’après. Toi, tu atterris dans la cuve à eau de pluie du voisin.\n\nTout le quartier rit pendant une semaine. Seigneur Moustache, lui, mange son maquereau sur le rebord de la cuve, en te regardant.',
            effets: [{ stat: 'social.reputation', delta: -1 }, { drapeau: 'moustache', valeur: 'cuve' }],
          },
        },
      },
      {
        id: 'ruse',
        texte: 'Lui proposer un meilleur poisson en échange',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { intellect: 2, charisme: 1 },
          succes: {
            texte:
              'Tu poses une sardine au pied de la tour, puis une autre un peu plus loin, puis une troisième. Seigneur Moustache descend, renifle, considère l’offre, et accepte l’échange en connaisseur. Tu ramènes le maquereau à Gorō, à peine mordu.\n\n« Tu as négocié avec ce démon ? » Il te regarde comme on regarde un futur chef de clan.',
            effets: [{ stat: 'jauges.ryo', delta: 10 }, { stat: 'attributs.intellect', delta: 1 }, { drapeau: 'moustache', valeur: 'negocie' }],
          },
          echec: {
            texte: 'Seigneur Moustache descend, mange les trois sardines, remonte, et reprend son maquereau. Tu viens de payer le dessert d’un voleur.',
            effets: [{ stat: 'jauges.ryo', delta: -3 }, { drapeau: 'moustache', valeur: 'dupe' }],
          },
        },
      },
      {
        id: 'complice',
        texte: 'Regarder le chat dans les yeux, et le laisser finir',
        ton: 'humour',
        effets: [{ drapeau: 'moustache', valeur: 'complice' }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat:
          'Tu t’assois en bas de la tour. Le chat et toi, vous vous comprenez : certaines batailles ne valent pas dix ryō.\n\nDepuis ce jour, Seigneur Moustache vient dormir sur le rebord de ta fenêtre quand il pleut. Gorō ne te le pardonne pas tout à fait.',
      },
    ],
  },
];
