import type { EventDef } from '../../engine/types';

const base = { chapitre: 1, arc: 'formation' as const };

/** Événements rares ou secrets : accessibles seulement sous des conditions précises. */
export const SECRETS: EventDef[] = [
  {
    ...base,
    id: 's_temple_oublie',
    titre: 'Le temple oublié',
    categorie: 'organisation',
    lieu: 'temple_oublie',
    poids: 3,
    rare: true,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { age: { min: 9 } }, { stat: 'attributs.perception', min: 55 }] },
    texte: 'En poursuivant un oiseau messager égaré, tu tombes sur un escalier de pierre mangé par la mousse. Au sommet, un temple absent de toutes les cartes. Sur l’autel, un coffret scellé par des spirales que personne ne sait plus tracer.',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Essayer d’ouvrir le coffret',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { intellect: 2, controleChakra: 1 },
          maitrises: { fuinjutsu_uzumaki: 3 },
          succes: {
            texte: 'Le sceau cède. À l’intérieur, un rouleau : la liste des porteurs d’une lame « sans nom », tous morts jeunes, tous puissants. La dernière ligne est vierge. Elle attend un nom.',
            effets: [{ secret: 'sceau_ancien' }, { secret: 'lame_sans_nom_existe' }, { indice: 'lame_sans_nom' }, { decouvrir: ['lieu:temple_oublie', 'arme:lame_sans_nom'] }, { succes: 'temple' }],
          },
          echec: {
            texte: 'Le sceau te repousse d’une décharge sèche. Tu n’es pas prêt·e. Tu notes l’emplacement du temple.',
            effets: [{ secret: 'sceau_ancien' }, { stat: 'jauges.sante', delta: -8 }, { decouvrir: 'lieu:temple_oublie' }],
          },
        },
      },
      {
        id: 'laisser',
        texte: 'Ne rien toucher, et partir en mémorisant le chemin',
        effets: [{ secret: 'sceau_ancien' }, { decouvrir: 'lieu:temple_oublie' }, { stat: 'attributs.perception', delta: 2 }],
        resultat: 'Certaines portes restent fermées pour de bonnes raisons. Tu reviendras quand tu sauras lesquelles.',
      },
    ],
  },
  {
    ...base,
    id: 's_sanctuaire_bois',
    titre: 'La pousse',
    categorie: 'clan_rare',
    lieu: '$village',
    poids: 6,
    rare: true,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { clan: 'senju' }, { age: { min: 9 } }, { maitrise: 'mokuton', eveille: false }] },
    texte: 'Seul·e au sanctuaire des bois, tu poses ta main sur la terre, comme le faisait le fondateur dans les légendes. Tu as peur, et tu ne sais pas de quoi — d’échouer, ou de réussir.',
    choix: [
      {
        id: 'concentrer',
        texte: 'Te concentrer de toutes tes forces',
        effets: [{ drapeau: 'tentative_mokuton' }, { tenterEveil: 'mokuton', intensite: 50 }, { entrainer: 'vitalite_senju', jours: 15 }],
        resultat: [
          { si: { maitrise: 'mokuton', eveille: true }, texte: 'Sous ta paume, une pousse verte perce la terre, grandit, s’enroule autour de ton poignet. Le bois a répondu. Tu comprends aussitôt deux choses : que plus rien ne sera jamais ordinaire, et que personne ne doit le savoir trop tôt.' },
          { si: { maitrise: 'mokuton', eveille: false }, texte: 'Rien. La terre reste la terre. Tu restes un Senju ordinaire, avec une vitalité hors du commun et un nom trop grand. C’est déjà beaucoup. Ce n’est pas ce que tout le monde attendait.' },
        ],
      },
      {
        id: 'renoncer',
        texte: 'Retirer ta main : tu n’as pas besoin de ça pour exister',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { ethique: { honneur: 4 } }, { entrainer: 'vitalite_senju', jours: 15 }],
        resultat: 'Tu te relèves, et quelque chose se détend dans ta poitrine. Le poids du nom ne disparaît pas. Il devient le tien, et non celui qu’on t’impose.',
      },
    ],
  },
  {
    ...base,
    id: 's_sceau_uzushio',
    titre: 'Le message sous le sceau',
    categorie: 'secret_familial',
    lieu: '$maison',
    poids: 6,
    rare: true,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { clan: 'uzumaki' }, { age: { min: 10 } }, { maitrise: 'fuinjutsu_uzumaki', palierMin: 1 }] },
    texte: 'En étudiant le vieux parchemin familial, tu remarques une spirale qui ne sert à rien. Rien d’utile, en tout cas. À moins que ce ne soit une serrure.',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Déverrouiller la spirale',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { intellect: 2, controleChakra: 1 },
          maitrises: { fuinjutsu_uzumaki: 2 },
          succes: {
            texte: 'Le parchemin se déplie en un second parchemin, caché dans l’épaisseur du premier. Une carte de l’archipel d’Uzushio, et une phrase : « Le sceau du phare tient encore. Que nos enfants ne l’ouvrent jamais. »',
            effets: [{ secret: 'sceau_phare_uzushio' }, { entrainer: 'fuinjutsu_uzumaki', jours: 30 }, { decouvrir: 'histoire:uzushio' }],
          },
          echec: {
            texte: 'Tu n’y arrives pas, mais tu es certain·e, maintenant, qu’il y a quelque chose. Tu y reviendras.',
            effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 15 }],
          },
        },
      },
      {
        id: 'parent',
        texte: 'En parler à {parent}',
        effets: [{ relation: '@parent', delta: { confiance: 6 } }, { secret: 'sceau_phare_uzushio' }, { stat: 'social.confianceClan', delta: 4 }],
        resultat: '{Parent} pâlit, puis ouvre le sceau devant toi. « Je voulais attendre que tu sois plus grand·e. Mais les secrets d’Uzushio ont la mauvaise habitude de trouver ceux qui les cherchent. »',
      },
    ],
  },
  {
    ...base,
    id: 's_pont_kannabi',
    titre: 'Le pont de Kannabi',
    categorie: 'secret_familial',
    lieu: '$maison',
    priorite: 30,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { secret: 'passe_parent' }, { secret: 'pont_kannabi' }, { pnj: '@parent', etat: ['vivant', 'blesse'] }] },
    personnages: ['@parent'],
    texte: 'Les deux lettres se rejoignent dans ta tête, d’un coup. Celle du grenier : « Pardonne-moi pour le pont de Kannabi. Nous n’étions que deux à pouvoir rentrer. » Celle de la veuve Tomoe : un ordre d’abandonner une unité alliée pour couvrir la retraite d’un membre du Conseil.\n\nLe mari de la veuve était dans l’unité abandonnée. Et {parent} était l’un des deux qui sont rentrés.',
    choix: [
      {
        id: 'confronter',
        texte: 'Confronter {parent}',
        effets: [{ secret: 'verite_kannabi' }, { relation: '@parent', delta: { confiance: 6, respect: 4 } }, { indice: 'conseil_guerre' }, { succes: 'kannabi' }],
        resultat:
          '{Parent} ne nie pas. « L’ordre venait d’un conseiller qui siège encore aujourd’hui. On m’a dit que c’était pour le village. Je l’ai cru. Je ne le crois plus. » {Parent_il} te regarde. « Que comptes-tu faire de ça ? » Tu ne le sais pas encore.',
      },
      {
        id: 'veuve',
        texte: 'Aller dire la vérité à la veuve Tomoe',
        effets: [{ secret: 'verite_kannabi' }, { ethique: { compassion: 6, honneur: 6 } }, { relation: '@parent', delta: { confiance: -10 } }, { succes: 'kannabi' }],
        resultat: 'Elle t’écoute sans pleurer. « Merci. Je savais qu’on m’avait menti. Je ne savais pas qui. » Elle te serre la main. Le soir, {parent} sait déjà. {Parent_il} ne dit rien. Le silence, chez vous, a changé de nature.',
      },
      {
        id: 'garder',
        texte: 'Garder ce secret pour toi',
        effets: [{ secret: 'verite_kannabi' }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { drapeau: 'kannabi_garde' }],
        resultat: 'Tu ajoutes ce secret aux autres. La pile devient lourde. Un jour, tu sauras quoi en faire. Ou elle t’écrasera.',
      },
    ],
  },
  {
    ...base,
    id: 's_traitre',
    titre: 'Le visage du traître',
    categorie: 'trahison',
    lieu: '$porte',
    priorite: 30,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { secret: 'nom_traitre' }, { vu: 'mc_frontiere_rapport' }] },
    texte: 'Un soir, à la grande porte, tu le vois : le conseiller dont tu as entendu le nom à la frontière. Il parle à voix basse à un marchand étranger, puis lui glisse un pli scellé. Il ne t’a pas vu·e. Pas encore.',
    choix: [
      {
        id: 'suivre',
        texte: 'Suivre le marchand',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { discretion: 2, perception: 1 },
          succes: {
            texte: 'Le marchand prend la route de Kōsai. Tu as vu son visage, son chariot, l’emblème d’un navire noir sur sa bâche. Tu rentres sans être vu·e. Tu tiens quelque chose.',
            effets: [{ secret: 'traitre_navire_noir' }, { decouvrir: 'organisation:navire_noir' }, { indice: 'navire_noir' }, { succes: 'traitre' }],
          },
          echec: {
            texte: 'Le marchand se retourne une fois de trop. Le lendemain, le conseiller te salue dans la rue, par ton nom. Il sait.',
            effets: [{ secret: 'traitre_navire_noir' }, { stat: 'social.suspicion', delta: 8 }, { drapeau: 'traitre_te_connait' }],
          },
        },
      },
      {
        id: 'kage',
        texte: 'Aller tout raconter au {kage}, cette nuit',
        effets: [{ relation: '@kage', delta: { confiance: 10 } }, { stat: 'social.influence', delta: 6 }, { drapeau: 'traitre_signale' }, { stat: 'social.suspicion', delta: 4 }],
        resultat: 'On te fait attendre trois heures. Puis le {kage} te reçoit, seul. Il écoute et dit seulement : « Je sais. Il faut des preuves. Continue d’ouvrir les yeux. Et ferme ta bouche. »',
      },
    ],
  },
  {
    ...base,
    id: 's_enfant_brume',
    titre: 'L’enfant du porche',
    categorie: 'organisation',
    lieu: '$village',
    priorite: 30,
    secret: true,
    si: { tout: [{ statut: 'actif' }, { village: 'kiri' }, { secret: 'enfant_cache' }, { age: { min: 11 } }] },
    texte: 'Un garçon maigre, encapuchonné, te frôle dans la foule et glisse quelque chose dans ta poche. Un papier : « Le porche. Il y a cinq ans. Merci. Si un jour tu as besoin des marais, dis ce mot : brise-glace. »',
    choix: [
      {
        id: 'garder',
        texte: 'Garder le mot en mémoire et brûler le papier',
        effets: [{ secret: 'mot_brise_glace' }, { secret: 'dissidence_kiri' }, { decouvrir: 'organisation:dissidence_kiri' }],
        resultat: 'Tu brûles le papier dans une lanterne. Brise-glace. Un mot pour ouvrir une porte que tu n’as pas encore besoin de franchir.',
      },
      {
        id: 'suivre',
        texte: 'Le suivre pour lui parler',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { discretion: 2, agilite: 1 },
          succes: {
            texte: 'Tu le rattrapes près des quais. Il a ton âge, une cicatrice de brûlure sur la joue, et des yeux qui ne clignent pas. « Ma famille est morte. Toi, tu m’as caché. Je ne l’oublierai pas. » Il disparaît dans la brume.',
            effets: [{ secret: 'mot_brise_glace' }, { secret: 'dissidence_kiri' }, { decouvrir: 'organisation:dissidence_kiri' }, { stat: 'social.suspicion', delta: 4 }],
          },
          echec: {
            texte: 'Il disparaît dans la brume comme s’il en faisait partie.',
            effets: [{ secret: 'mot_brise_glace' }],
          },
        },
      },
    ],
  },
];
