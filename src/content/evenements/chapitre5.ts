// Chapitre 6 : l'héritage (de 45 ans à la fin de la vie). Dernier chapitre.
// Voie du village : la succession du Kage, la menace du Navire noir, la transmission, et une dernière décision qui ferme la vie.
// Voie de la route : le maître errant, et ce qui restera de lui.

import type { Condition, EventDef } from '../../engine/types';
import { combatPouvoir, entrainerPouvoir, segmentsParVillage } from './outils';

const base = { chapitre: 6, arc: 'heritage' as const };
const ACTIF: Condition = { statut: 'actif' };
const ROUTE: Condition = { statut: ['errant', 'deserteur'] };
const KAGE_POSSIBLE: Condition = { tout: [{ rangMin: 'jonin' }, { un: [{ stat: 'social.reputation', min: 60 }, { stat: 'social.influence', min: 30 }] }] };

export const CHAPITRE5: EventDef[] = [
  {
    ...base,
    id: 'c5_ouverture',
    titre: 'Le Kage se meurt',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { si: { rang: 'kage' }, texte: 'Tu portes le chapeau depuis des années, mais le conseil réclame une vraie succession, choisie cette fois.' },
      { texte: 'Le {kage} {kageNom} ne quitte plus son lit. Les médecins parlent en semaines. Dans les couloirs de la tour, on prononce déjà des noms pour lui succéder.' },
      ...segmentsParVillage({
        konoha: 'À Konoha, le Conseil des anciens veut un Hokage docile. Les jōnin veulent quelqu’un qui se souvienne de la guerre.',
        suna: 'À Suna, les familles du conseil se disputent le titre de Kazekage depuis des mois, comme on se disputait l’eau.',
        kiri: 'À Kiri, on veut un Mizukage qui garantisse que la Brume sanglante ne reviendra jamais.',
        kumo: 'À Kumo, la force a toujours désigné le Raikage. Mais la force ne suffit plus à gouverner.',
        iwa: 'À Iwa, le Tsuchikage désigne son successeur, et le conseil le confirme. En théorie.',
      }),
      { si: KAGE_POSSIBLE, texte: 'Ton nom fait partie de ceux qu’on prononce.' },
      { si: { drapeau: 'vise_kage' }, texte: 'Tu y penses depuis des années. Le moment est venu.' },
    ],
    choix: [
      {
        id: 'candidat',
        texte: 'Te présenter à la succession',
        si: KAGE_POSSIBLE,
        effets: [{ drapeau: 'c5_candidat' }, { ethique: { ambition: 6 } }, { planifier: 'c5_menace', dansJours: 900 }, { planifier: 'c5_rival', dansJours: 1500 }, { planifier: 'c5_succession', dansJours: 2100 }, { planifier: 'c5_releve', dansJours: 3000 }],
        resultat: 'Tu poses ta candidature devant le conseil. Certains te regardent avec espoir, d’autres avec crainte. Les deux te conviennent.',
      },
      {
        id: 'soutenir',
        texte: 'Soutenir un autre candidat, plus jeune',
        effets: [{ drapeau: 'c5_faiseur' }, { stat: 'social.influence', delta: 8 }, { planifier: 'c5_menace', dansJours: 900 }, { planifier: 'c5_rival', dansJours: 1500 }, { planifier: 'c5_succession', dansJours: 2100 }, { planifier: 'c5_releve', dansJours: 3000 }],
        resultat: 'Tu choisis quelqu’un que tu as formé, ou qui te rappelle quelqu’un. Tu mets ta réputation derrière ce nom.',
      },
      {
        id: 'retrait',
        texte: 'Rester à l’écart de la politique',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { planifier: 'c5_menace', dansJours: 900 }, { planifier: 'c5_rival', dansJours: 1500 }, { planifier: 'c5_succession', dansJours: 2100 }, { planifier: 'c5_releve', dansJours: 3000 }],
        resultat: 'Tu as assez enterré d’amis pour savoir qu’un titre ne protège personne. Tu laisses les autres se battre pour le chapeau.',
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c5_menace',
    titre: 'Le Navire noir',
    categorie: 'guerre',
    lieu: 'cotes_brume',
    enchaine: true,
    si: ACTIF,
    texte: [
      { texte: 'Une nuit sans lune, une flotte de navires noirs mouille au large. L’Amiral et ses déserteurs de tous les villages attaquent les côtes, puis marchent vers l’intérieur. Pour la première fois depuis des siècles, les cinq villages font face au même ennemi.' },
      { si: { drapeau: 'connait_amiral' }, texte: 'Tu connais ce nom depuis des années. Tu as prévenu. On ne t’a pas assez écouté·e.' },
      { si: { secret: 'traitre_navire_noir' }, texte: 'Le traître du Conseil avait préparé ce jour-là. Il n’est plus là pour le voir.' },
    ],
    choix: [
      {
        id: 'amiral',
        texte: 'Affronter l’Amiral en personne',
        test: {
          type: 'combat',
          manches: 3,
          difficulte: 70,
          letal: true,
          causeMort: 'mort·e face à l’Amiral du Navire noir, en sauvant les cinq villages',
          attributs: { agilite: 2, controleChakra: 1, controleEmotionnel: 1 },
          maitrises: { arme: 2, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          critique: {
            texte: 'Le duel dure jusqu’à l’aube, sur le pont de son propre navire. Quand le soleil se lève, l’Amiral est à genoux, et sa flotte se rend. On chantera cette nuit-là dans les cinq villages.',
            effets: [{ drapeau: 'amiral_vaincu' }, { stat: 'social.reputation', delta: 25 }, { succes: 'amiral' }, ...combatPouvoir(), ...combatPouvoir()],
          },
          succes: {
            texte: 'Tu le blesses assez pour qu’il ordonne la retraite. Sa flotte repart vers le large. Il reviendra peut-être. Pas de ton vivant.',
            effets: [{ drapeau: 'amiral_vaincu' }, { stat: 'social.reputation', delta: 15 }, { succes: 'amiral' }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Il est trop fort. Tu survis parce que d’autres se jettent entre vous. La flotte est repoussée par d’autres que toi.',
            effets: [{ blessure: { id: 'amiral', nom: 'Blessure de l’Amiral', gravite: 3, jours: 120, invalidante: true } }],
          },
        },
      },
      {
        id: 'coalition',
        texte: 'Unir les cinq villages sous un même commandement',
        test: {
          type: 'competence',
          difficulte: 66,
          attributs: { charisme: 3, intellect: 1 },
          succes: {
            texte: 'Cinq Kage, une même tente, une même carte. C’est toi qui as obtenu ça. La flotte de l’Amiral est écrasée en trois semaines par une armée que le monde n’avait jamais vue.',
            effets: [{ drapeau: 'amiral_vaincu' }, { drapeau: 'coalition' }, { stat: 'social.influence', delta: 20 }, { succes: 'amiral' }],
          },
          echec: {
            texte: 'Les villages se méfient trop les uns des autres. Chacun défend ses côtes. La guerre dure un an et coûte des milliers de vies.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }, { journal: 'La guerre contre le Navire noir a duré un an.', importance: 3 }],
          },
        },
      },
      {
        id: 'proteger',
        texte: 'Évacuer et protéger les civils de la côte',
        effets: [{ ethique: { compassion: 12 } }, { stat: 'social.reputation', delta: 8 }, { succes: 'gardien' }],
        resultat: 'Pendant que d’autres se battent, tu fais sortir quatre mille civils des villages côtiers. Personne ne chantera ça. Quatre mille personnes s’en souviendront toute leur vie.',
      },
    ],
  },
  {
    ...base,
    id: 'c5_succession',
    titre: 'Le chapeau',
    categorie: 'promotion',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { texte: 'Le conseil se réunit pour désigner le nouveau {kage}. Les jōnin attendent dehors, sur la place. Le village entier retient son souffle.' },
      { si: { drapeau: 'amiral_vaincu' }, texte: 'On murmure ton nom depuis la nuit de l’Amiral.' },
    ],
    choix: [
      {
        id: 'convaincre',
        texte: 'Plaider ta candidature devant le conseil',
        si: { drapeau: 'c5_candidat' },
        test: {
          type: 'competence',
          difficulte: 64,
          modificateur: 0,
          attributs: { charisme: 3, intellect: 1 },
          succes: {
            texte: 'Le vote est serré. Puis il ne l’est plus. On te pose le chapeau sur la tête, et tu sens le poids de tous ceux qui l’ont porté avant toi.',
            effets: [{ rang: 'kage' }, { succes: 'kage' }, { stat: 'social.reputation', delta: 20 }, { journal: 'Tu deviens Kage.', importance: 3 }],
          },
          echec: {
            texte: 'Un autre est choisi. Il vient te voir le soir même pour te demander d’être son conseiller. Tu acceptes. Tu sais ce que vaut la fierté.',
            effets: [{ stat: 'social.influence', delta: 10 }, { drapeau: 'conseiller_kage' }],
          },
        },
      },
      {
        id: 'faiseur',
        texte: 'Porter ton candidat au pouvoir',
        si: { drapeau: 'c5_faiseur' },
        effets: [{ drapeau: 'conseiller_kage' }, { stat: 'social.influence', delta: 12 }],
        resultat: 'Ton candidat est choisi. Il te regarde dans la foule avant de prêter serment. Tu as fait un Kage. C’est presque mieux que de l’être.',
      },
      {
        id: 'observer',
        texte: 'Attendre le résultat avec les autres',
        si: { tout: [{ drapeau: 'c5_candidat', absent: true }, { drapeau: 'c5_faiseur', absent: true }] },
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Un nouveau {kage} est choisi. Tu applaudis avec les autres. Le village continue.',
      },
    ],
  },
  {
    ...base,
    id: 'c5_transmission',
    titre: 'Ce qu’on transmet',
    categorie: 'heritage',
    lieu: '$terrain',
    priorite: 34,
    si: { tout: [ACTIF, { vu: 'c5_succession' }, { un: [{ vu: 'c5_releve' }, { age: { min: 58 } }] }] },
    texte: [
      { texte: 'Tes cheveux grisonnent. Tes mains sont toujours rapides, mais elles te font mal le matin. Un jour, il faudra que quelqu’un continue ce que tu as commencé.' },
      { si: { drapeau: 'c4_eleve_formee' }, texte: 'Ton ancienne élève prodige est devenue jōnin. Elle vient te voir sur le terrain où tu l’as formée.' },
      { si: { drapeau: 'famille_fondee' }, texte: 'Ton enfant porte le bandeau depuis un an. Il te ressemble plus que tu ne voudrais.' },
      { si: { possedeArmeLegendaire: true }, texte: 'Ta lame légendaire attend, elle aussi, de savoir qui la portera après toi.' },
    ],
    choix: [
      {
        id: 'technique',
        texte: 'Transmettre ta technique la plus secrète',
        effets: [{ drapeau: 'heritage_transmis' }, { ethique: { compassion: 4 } }, { stat: 'attributs.charisme', delta: 2 }, ...entrainerPouvoir(30, true)],
        resultat: 'Tu leur montres ce que tu n’as jamais montré à personne. En la transmettant, tu la comprends enfin tout entière.',
      },
      {
        id: 'lame',
        texte: 'Confier ta lame à qui la mérite',
        si: { possedeArmeLegendaire: true },
        effets: [{ drapeau: 'heritage_transmis' }, { drapeau: 'lame_transmise' }, { ethique: { honneur: 6 } }],
        resultat: 'La lame accepte son nouveau porteur sans résister. Elle sait, mieux que toi, quand une histoire est finie.',
      },
      {
        id: 'garder',
        texte: 'Garder tout cela pour toi, encore un peu',
        effets: [{ ethique: { ambition: 4 } }],
        resultat: 'Pas encore. Tu n’es pas prêt·e à devenir un souvenir.',
      },
    ],
  },
  {
    ...base,
    id: 'c5_crepuscule',
    titre: 'Le crépuscule',
    categorie: 'epilogue',
    lieu: '$village',
    priorite: 30,
    si: { tout: [ACTIF, { un: [{ tout: [{ vu: 'c5_transmission' }, { age: { min: 55 } }] }, { age: { min: 68 } }] }] },
    texte: [
      { texte: 'Le soir tombe sur le village. Du toit où tu t’asseyais enfant, tu regardes les lanternes s’allumer une à une, et tu fais le compte d’une vie.' },
      { si: { rang: 'kage' }, texte: 'Le chapeau du {kage} est posé à côté de toi. Il est plus lourd que toutes les armes que tu as portées.' },
      { si: { drapeau: 'amiral_vaincu' }, texte: 'Les enfants jouent à « l’Amiral et toi » dans les rues. Tu fais toujours semblant de ne pas les entendre.' },
      { si: { drapeau: 'famille_fondee' }, texte: 'En bas, ta famille t’appelle pour le dîner.' },
    ],
    choix: [
      {
        id: 'servir',
        texte: 'Servir jusqu’au dernier jour',
        effets: [{ fin: 'legende' }],
        resultat: 'Tu redescends du toit. Demain, il y aura des rapports à lire, des enfants à former, un village à garder. Tant que tu respires, c’est ta place.',
      },
      {
        id: 'retraite',
        texte: 'Te retirer et vivre enfin',
        effets: [{ fin: 'retraite' }],
        resultat: 'Tu rends ton gilet le lendemain. Le soir même, pour la première fois depuis tes six ans, tu dors sans arme à portée de main.',
      },
      {
        id: 'derniere',
        texte: 'Partir pour une dernière mission, seul·e',
        indice: 'Une mission dont on ne revient pas.',
        effets: [{ drapeau: 'cause_mort', valeur: 'parti·e pour une dernière mission, dont personne ne connaît le détail' }, { fin: 'sacrifice' }],
        resultat: 'Il reste une menace que personne d’autre ne peut affronter. Tu ne le dis à personne. Tu laisses une lettre sur la table, et tu pars avant l’aube.',
      },
    ],
  },

  {
    ...base,
    arc: 'heritage',
    id: 'c5_rival',
    titre: 'Le vieux rival',
    categorie: 'rivalite',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { pnj: '@rival', etat: ['vivant', 'blesse'] }, texte: '{@rival} t’attend sur le terrain d’entraînement où vous vous battiez enfants. Des rides, une cicatrice que tu ne connaissais pas, et le même regard. « Un dernier combat. Pour savoir. »' },
      { si: { non: { pnj: '@rival', etat: ['vivant', 'blesse'] } }, texte: 'Sur la tombe de {@rival}, quelqu’un a laissé un kunai planté dans la terre, comme une invitation. Un jeune ninja de son clan t’attend à côté : « Il disait que vous n’aviez jamais fini votre combat. »' },
    ],
    choix: [
      {
        id: 'combat',
        texte: 'Accepter le combat',
        test: {
          type: 'combat',
          manches: 3,
          difficulte: 62,
          attributs: { agilite: 2, controleEmotionnel: 2 },
          maitrises: { arme: 1, taijutsu: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Le combat dure une heure. À la fin, vous êtes assis dos à dos dans la poussière, à bout de souffle, et vous riez comme des enfants. Tu as gagné. Ça n’a plus aucune importance.',
            effets: [{ relation: '@rival', delta: { respect: 15, rivalite: -20, amitie: 15 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu perds. Pour la première fois de ta vie, ça ne te fait rien. Vous allez boire un verre ensemble.',
            effets: [{ relation: '@rival', delta: { respect: 10, rivalite: -15, amitie: 10 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
          },
        },
      },
      {
        id: 'paix',
        texte: 'Refuser, et l’inviter à boire un thé',
        effets: [{ relation: '@rival', delta: { amitie: 12, rivalite: -25 } }, { ethique: { compassion: 4 } }],
        resultat: 'Vous parlez jusqu’à la nuit de tous ceux qui ne sont plus là. Vous auriez dû faire ça il y a trente ans.',
      },
    ],
  },
  {
    ...base,
    arc: 'heritage',
    id: 'c5_releve',
    titre: 'La relève',
    categorie: 'heritage',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'famille_fondee' }, texte: 'Ton enfant, jōnin depuis peu, n’est pas revenu de mission. Son équipe a été prise dans une embuscade à la frontière. On t’interdit d’y aller : tu es trop vieux, trop précieux, trop proche.' },
      { si: { drapeau: 'famille_fondee', absent: true }, texte: 'L’équipe de ton ancienne élève n’est pas revenue de mission. Une embuscade à la frontière. On t’interdit d’y aller : tu es trop précieux pour le village.' },
    ],
    choix: [
      {
        id: 'partir',
        texte: 'Y aller quand même',
        test: {
          type: 'combat',
          difficulte: 64,
          letal: true,
          causeMort: 'mort·e en allant chercher ceux qui comptaient le plus',
          attributs: { perception: 2, agilite: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Tu les trouves au deuxième jour, retranchés dans une grotte, à court de tout sauf de courage. Tu les ramènes tous. Personne au village n’ose te reprocher d’avoir désobéi.',
            effets: [{ drapeau: 'releve_sauvee' }, { stat: 'social.reputation', delta: 10 }, { ethique: { compassion: 6 } }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu en ramènes deux sur trois. Le troisième, tu le porteras toute ta vie.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -3 }, { blessure: { id: 'releve', nom: 'Vieille blessure rouverte', gravite: 2, jours: 80 } }],
          },
        },
      },
      {
        id: 'confiance',
        texte: 'Leur faire confiance, et attendre',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { hasard: [{ poids: 2, effets: [{ drapeau: 'releve_sauvee' }, { journal: 'Ils sont revenus seuls. Tu les as bien formés.', importance: 3 }] }, { poids: 1, effets: [{ journal: 'Ils ne sont pas tous revenus.', importance: 3 }] }] }],
        resultat: 'Quatre jours sans dormir. Le cinquième, des silhouettes à la porte du village. Tu comptes. Tu recomptes.',
      },
    ],
  },
  // ───────── La route : le maître errant ─────────
  {
    ...base,
    id: 'c5r_ouverture',
    titre: 'Le maître errant',
    categorie: 'heritage',
    lieu: 'route_commerce',
    enchaine: true,
    si: ROUTE,
    texte: 'Tu as passé quarante-cinq ans. Sur la route, on te demande des leçons plus souvent qu’on te provoque en duel. Un jour, un garçon de douze ans te suit pendant trois villages avant d’oser parler : il veut devenir ton élève.',
    choix: [
      {
        id: 'accepter',
        texte: 'Le prendre comme élève',
        effets: [{ drapeau: 'eleve_route' }, { ethique: { compassion: 6 } }, { planifier: 'c5r_navire', dansJours: 1800 }],
        resultat: 'Tu lui apprends tout ce que la route t’a appris, et quelques choses qu’elle ne t’a pas apprises, mais que tu aurais aimé savoir.',
      },
      {
        id: 'refuser',
        texte: 'Le renvoyer chez lui',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { planifier: 'c5r_navire', dansJours: 1800 }],
        resultat: 'Il pleure, puis s’en va. Des années plus tard, tu entends parler d’un jeune ninja qui raconte à tout le monde qu’il t’a rencontré une fois.',
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c5r_navire',
    titre: 'Les voiles noires',
    categorie: 'guerre',
    lieu: 'cotes_brume',
    enchaine: true,
    si: ROUTE,
    texte: 'La flotte du Navire noir attaque les côtes. L’Amiral te fait une offre : rejoins-nous, toi qui n’as jamais eu de village. Les cinq grands villages, eux, te demandent de les aider, toi qu’ils ont toujours rejeté·e.',
    choix: [
      {
        id: 'villages',
        texte: 'Te battre aux côtés des villages',
        test: {
          type: 'combat',
          difficulte: 68,
          letal: true,
          causeMort: 'mort·e en défendant les villages qui t’avaient rejeté·e',
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 2, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Les cinq Kage te voient combattre. Après la victoire, chacun d’eux t’offre un bandeau. Tu les refuses tous, poliment. Tu as déjà un nom.',
            effets: [{ drapeau: 'amiral_vaincu' }, { succes: 'amiral' }, { stat: 'social.reputation', delta: 20 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu tombes au premier assaut. On te soigne dans un hôpital de Kiri, entre deux ninjas qui ne savent pas qui tu es.',
            effets: [{ blessure: { id: 'voiles', nom: 'Blessures du Navire noir', gravite: 3, jours: 100 } }],
          },
        },
      },
      {
        id: 'amiral',
        texte: 'Rejoindre l’Amiral',
        effets: [{ statut: 'deserteur' }, { ethique: { honneur: -10, ambition: 10 } }, { fin: 'exil', cause: 'parti·e avec la flotte du Navire noir' }],
        resultat: 'Tu montes à bord. Derrière toi, la côte brûle. Tu te dis que tu ne leur dois rien. Tu te le diras longtemps.',
      },
    ],
  },
  {
    ...base,
    id: 'c5r_fin',
    titre: 'La dernière route',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    priorite: 30,
    si: { tout: [ROUTE, { un: [{ tout: [{ vu: 'c5r_navire' }, { age: { min: 52 } }] }, { age: { min: 65 } }] }] },
    texte: 'Tes jambes ne te portent plus aussi loin. Tu t’assieds au bord de la route du sel, là où, il y a des années, un enfant refoulé a choisi de partir plutôt que de renoncer.',
    choix: [
      {
        id: 'legende',
        texte: 'Repartir, encore une fois',
        effets: [{ fin: 'legende_route' }],
        resultat: 'Tu te relèves. La route n’a pas de fin. Toi non plus, peut-être, dans les histoires qu’on racontera.',
      },
      {
        id: 'poser',
        texte: 'Poser ton sac, enfin',
        effets: [{ fin: 'retraite' }],
        resultat: 'Une maison au bord d’un village sans nom. Des enfants qui viennent te demander des histoires. C’est assez. C’est même beaucoup.',
      },
    ],
  },
];
