import type { Condition, EventDef } from '../../engine/types';

/**
 * Les clans ont une voix, pas seulement des bonus (prompt Racine, E11 à E20).
 * Pour chacun des seize clans : une scène d'enfance, où l'on apprend ce que le clan attend,
 * et une scène d'adulte, où deux membres du clan ne sont pas d'accord et où le joueur doit choisir.
 * Les arcs d'Académie et d'épreuve (arcsClans*) couvrent les âges entre les deux.
 */
const ACTIF: Condition = { statut: 'actif' };
const TOUS = [1, 2, 3, 4, 5, 6];

function enfance(clan: string, ev: Omit<EventDef, 'chapitre' | 'chapitres' | 'arc' | 'si' | 'categorie' | 'lieu'> & { lieu?: string; si?: Condition[] }): EventDef {
  const { si, ...reste } = ev;
  return { chapitre: 1, chapitres: TOUS, arc: 'origines', categorie: 'enfance', lieu: '$maison', priorite: 28, ...reste, si: { tout: [ACTIF, { clan }, { age: { min: 7, max: 9 } }, ...(si ?? [])] } };
}
function adulte(clan: string, ev: Omit<EventDef, 'chapitre' | 'chapitres' | 'arc' | 'si' | 'categorie' | 'lieu'> & { lieu?: string; si?: Condition[] }): EventDef {
  const { si, ...reste } = ev;
  return { chapitre: 3, chapitres: TOUS, arc: 'heritage', categorie: 'conflit_clans', lieu: '$village', poids: 14, ...reste, si: { tout: [ACTIF, { clan }, { age: { min: 20, max: 42 } }, ...(si ?? [])] } };
}

export const VOIX_CLANS: EventDef[] = [
  // ── Uchiha : la colère et la volonté ──
  enfance('uchiha', {
    id: 'vx_uchiha_enfant',
    titre: 'Choisir sa réponse',
    texte: '{Parent} t’attend sur le seuil, les bras croisés. L’Académie a fait prévenir : tu as frappé un camarade. « Pourquoi as-tu frappé ton camarade ? » « Il a dit que je n’étais pas assez fort·e. » « Et maintenant ? » « Maintenant, il sait que je peux le frapper. » « Non. Maintenant, il sait que tu peux perdre le contrôle lorsqu’on te provoque. Ce n’est pas la même chose. »',
    choix: [
      {
        id: 'reconnaitre',
        texte: 'Baisser les yeux : « J’ai eu tort. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@parent', delta: { respect: 4 } }, { drapeau: 'voix_uchiha', valeur: 'maitrise' }],
        resultat: '{Parent} s’accroupit pour être à ta hauteur. « La prochaine fois, je veux que tu sois capable de choisir ta réponse avant que ta colère la choisisse pour toi. » Puis {il:@parent} te serre l’épaule, une seule seconde. Chez les Uchiha, c’est presque une étreinte.',
      },
      {
        id: 'fierte',
        texte: '« Un Uchiha ne se laisse pas insulter. »',
        effets: [{ stat: 'social.confianceClan', delta: 3 }, { stat: 'attributs.controleEmotionnel', delta: -2 }, { drapeau: 'voix_uchiha', valeur: 'fierte' }],
        resultat: 'Un silence. {Parent} te regarde comme on regarde un miroir qui montre ce qu’on n’a pas envie de voir. « Tu as appris cette phrase dans notre maison. C’est ma faute, pas la tienne. » {Il:@parent} rentre sans te punir. C’est pire qu’une punition.',
      },
    ],
  }),
  adulte('uchiha', {
    id: 'vx_uchiha_adulte',
    titre: 'Une histoire qui s’alourdit',
    texte: 'Au temple Naka, deux membres du clan se disputent à voix basse. Un ancien, la main sur la tablette : « Tu crois que l’héritage est une technique que l’on transmet ? Une technique peut se copier. Une histoire, non. Elle s’alourdit à chaque génération. Les enfants doivent lire la tablette. » Ta cousine, qui enseigne aux plus jeunes : « Ils ont huit ans. Tu veux leur apprendre que la haine ouvre les yeux, et t’étonner ensuite qu’ils la cherchent. » Tous deux se tournent vers toi.',
    choix: [
      {
        id: 'ancien',
        texte: 'Donner raison à l’ancien : l’héritage doit se transmettre',
        effets: [{ stat: 'social.confianceClan', delta: 5 }, { ethique: { compassion: -2 } }, { drapeau: 'voix_uchiha_adulte', valeur: 'tradition' }],
        resultat: 'L’ancien hoche la tête. Ta cousine sort sans un mot. Le mois suivant, deux enfants du clan lisent la tablette. L’un d’eux, des années plus tard, viendra te demander si c’est vrai, ce qu’elle dit. Tu ne sauras pas quoi lui répondre.',
      },
      {
        id: 'cousine',
        texte: 'Donner raison à ta cousine : ils liront plus tard, quand ils pourront comprendre',
        effets: [{ stat: 'social.confianceClan', delta: -4 }, { ethique: { compassion: 4 } }, { stat: 'social.influence', delta: 2 }, { drapeau: 'voix_uchiha_adulte', valeur: 'reforme' }],
        resultat: 'L’ancien te regarde longtemps. « Tu as le droit de refuser ce que nous avons fait avant toi. Mais ne prétends pas que tu n’en as rien reçu. Même ton refus vient de ce que tu as connu. » Il sort. Ta cousine te prend la main, une seconde. La tablette reste fermée aux enfants. Pour cette génération.',
      },
    ],
  }),

  // ── Hyūga : voir et comprendre ──
  enfance('hyuga', {
    id: 'vx_hyuga_enfant',
    titre: 'Ce que tes yeux montrent',
    lieu: '$terrain',
    texte: 'Entraînement au domaine. Ta cousine, un an de plus que toi, te tourne autour. « Tu regardes partout sauf là où je vais frapper. » « Tu regardes mes yeux. » « Oui. Et tu me montres chaque fois que tu as peur. » « Je n’ai pas peur. » « Alors pourquoi tu viens de reculer ? »',
    choix: [
      {
        id: 'admettre',
        texte: '« D’accord. J’ai peur. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { entrainer: 'juken', jours: 10 }, { drapeau: 'voix_hyuga', valeur: 'peur_admise' }],
        resultat: 'Elle s’arrête, surprise. Puis elle hoche la tête, sérieuse comme une adulte. « Bien. Maintenant, tu peux apprendre à ne pas lui obéir. » Elle te montre comment respirer avant un coup. Tu recules moins, après. Un peu moins.',
      },
      {
        id: 'nier',
        texte: 'Frapper le premier, pour lui prouver le contraire',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { agilite: 2, controleEmotionnel: 1 },
          succes: { texte: 'Ta paume effleure son épaule. Elle recule d’un pas, sourcils levés. « Tu avais peur quand même. Mais tu as frappé avec. C’est autre chose. »', effets: [{ stat: 'attributs.agilite', delta: 2 }, { drapeau: 'voix_hyuga', valeur: 'courage' }] },
          echec: { texte: 'Elle a vu ton épaule bouger avant ton bras. Elle pivote, et tu te retrouves assis·e dans le sable. « Tu vois ? Tes yeux, encore. »', effets: [{ stat: 'jauges.sante', delta: -3 }, { stat: 'attributs.perception', delta: 1 }] },
        },
      },
    ],
  }),
  adulte('hyuga', {
    id: 'vx_hyuga_adulte',
    titre: 'Le sceau du fils',
    texte: 'Dans la salle du conseil du clan, un homme de la branche secondaire se tient debout devant les anciens. Son fils de six ans doit recevoir le sceau demain. « Je ne demande pas de supprimer le sceau. Je demande d’attendre qu’il ait l’âge de comprendre ce qu’on lui fait. » Une ancienne de la branche principale : « La discipline m’a donné une direction. Elle m’a aussi appris à ne pas poser certaines questions. Je ne sais pas encore laquelle de ces deux choses m’a le plus aidé. Mais la règle est la règle. » On te demande ton avis.',
    choix: [
      {
        id: 'regle',
        texte: 'Défendre la règle : sans elle, le clan se déchire',
        effets: [{ stat: 'social.confianceClan', delta: 5 }, { ethique: { honneur: 1, compassion: -3 } }, { drapeau: 'voix_hyuga_adulte', valeur: 'regle' }],
        resultat: 'Le sceau est posé le lendemain. Le père ne te regarde plus dans les couloirs. Son fils, lui, te salue poliment, avec un front qu’il cache sous une mèche. Il ne sait pas encore ce qu’il porte.',
      },
      {
        id: 'attendre',
        texte: 'Soutenir le père : attendre ne coûte rien',
        effets: [{ stat: 'social.confianceClan', delta: -5 }, { ethique: { compassion: 5 } }, { stat: 'social.influence', delta: 2 }, { drapeau: 'voix_hyuga_adulte', valeur: 'attente' }],
        resultat: 'Il y a un long silence dans la salle. L’ancienne te regarde, et dans ses yeux blancs, tu crois voir quelque chose comme du soulagement. « Six ans de plus, dit-elle enfin. Une exception. » Le père s’incline jusqu’au sol. Dans le clan, on parlera de cette exception pendant des années, en bien et en mal.',
      },
    ],
  }),

  // ── Nara : regarder plus loin ──
  enfance('nara', {
    id: 'vx_nara_enfant',
    titre: 'Plus loin que la ligne d’arrivée',
    lieu: '$terrain',
    texte: 'Course entre enfants du clan, dans la forêt des cerfs. Ton cousin s’est assis dans l’herbe avant même le départ. « Je ne veux pas courir. » « Tu vas perdre la course. » « Si je ne cours pas, je ne serai pas fatigué. Si tu cours et que tu es fatigué·e, tu perdras peut-être la prochaine. Je regarde plus loin que la ligne d’arrivée. »',
    choix: [
      {
        id: 'courir',
        texte: 'Courir quand même, et gagner celle-ci',
        effets: [{ stat: 'attributs.agilite', delta: 2 }, { drapeau: 'voix_nara', valeur: 'course' }],
        resultat: 'Tu gagnes. Tu reviens essoufflé·e, triomphant·e. Ton cousin t’attend avec une pomme. Le lendemain, il propose une deuxième course, au moment où tu as encore les jambes lourdes. Il gagne. Il ne dit rien. Il n’a pas besoin.',
      },
      {
        id: 'asseoir',
        texte: 'T’asseoir à côté de lui et regarder les nuages',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { drapeau: 'voix_nara', valeur: 'nuages' }],
        resultat: 'Les autres courent, crient, reviennent. Vous restez là. Au bout d’une heure, il dit : « Celui-là, il ressemble à un cerf qui a perdu ses bois. » Tu ris. C’est le genre d’après-midi dont tu te souviendras à quarante ans, sans savoir pourquoi.',
      },
    ],
  }),
  adulte('nara', {
    id: 'vx_nara_adulte',
    titre: 'Le plan et la réalité',
    texte: 'Deux stratèges Nara se disputent au-dessus d’une carte de la frontière. Le plus âgé a prévu chaque mouvement de l’ennemi, trois coups à l’avance. La plus jeune a barré la moitié du plan à l’encre rouge : « Ton plan suppose qu’ils sont aussi intelligents que nous. Ils ne le sont pas. Ils vont faire n’importe quoi, et ton plan va s’effondrer. » Le vieux : « Le meilleur plan n’est pas celui qui prévoit tout. C’est celui qui sait quoi faire quand la réalité refuse de lui obéir. Le mien le sait. » Ils te tendent chacun un pinceau.',
    choix: [
      {
        id: 'vieux',
        texte: 'Suivre le plan du vieux stratège',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { intellect: 3 },
          succes: { texte: 'L’ennemi fait n’importe quoi, comme prévu par la jeune. Mais le plan du vieux avait une branche pour ça aussi. Il hoche la tête à peine quand la frontière tient. La jeune stratège ronchonne. Elle prend des notes.', effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'voix_nara_adulte', valeur: 'plan' }] },
          echec: { texte: 'L’ennemi fait quelque chose que personne n’avait prévu. Le plan s’effondre au deuxième coup. Vous tenez quand même, à l’improviste, au prix de deux blessés.', effets: [{ stat: 'social.reputation', delta: -2 }, { drapeau: 'voix_nara_adulte', valeur: 'plan_rate' }] },
        },
      },
      {
        id: 'jeune',
        texte: 'Suivre l’instinct de la jeune stratège',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { perception: 2, intellect: 1 },
          succes: { texte: 'Vous laissez l’ennemi avancer, n’importe comment, et vous frappez là où il se disperse. La frontière tient. Le vieux stratège regarde la carte longtemps. « Ton choix était mauvais sur le papier. Il a fonctionné parce que tu as remarqué une chose que mon plan n’avait pas prévue. Je vais devoir vivre avec cette information. »', effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'social.influence', delta: 2 }, { drapeau: 'voix_nara_adulte', valeur: 'instinct' }] },
          echec: { texte: 'L’instinct se trompe, cette fois. L’ennemi était plus discipliné qu’elle ne le croyait. Le vieux ne dit pas « je te l’avais dit ». Il redessine son plan, en silence, pendant que vous soignez les blessés.', effets: [{ stat: 'social.reputation', delta: -2 }, { drapeau: 'voix_nara_adulte', valeur: 'instinct_rate' }] },
        },
      },
    ],
  }),

  // ── Akimichi : la force qui protège ──
  enfance('akimichi', {
    id: 'vx_akimichi_enfant',
    titre: 'Le dernier morceau',
    texte: 'Repas de famille. Il reste un seul morceau de viande grillée dans le plat. Ton cousin, deux fois plus large que toi, pousse le plat vers toi. « Tu peux prendre le dernier morceau. » « Tu es sûr ? » « Oui. Mais si tu le prends juste pour me provoquer, je vais te courir après. Et je cours plus vite que tu ne le crois. »',
    choix: [
      {
        id: 'partager',
        texte: 'Le couper en deux',
        effets: [{ ethique: { compassion: 2 } }, { stat: 'social.confianceClan', delta: 2 }, { drapeau: 'voix_akimichi', valeur: 'partage' }],
        resultat: 'Il te regarde couper le morceau en deux, et éclate de rire. « Ma grand-mère fait exactement ça ! » À table, chez les Akimichi, on ne compte pas les morceaux. On compte qui pense aux autres.',
      },
      {
        id: 'provoquer',
        texte: 'Le prendre en le regardant droit dans les yeux',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { agilite: 3 },
          succes: { texte: 'Il te court après autour de la maison, trois fois. Tu ne te fais pas attraper. Vous vous effondrez dans le jardin, hors d’haleine, et il te pique la moitié du morceau quand même.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { drapeau: 'voix_akimichi', valeur: 'course' }] },
          echec: { texte: 'Il court vraiment plus vite que tu ne le crois. Il t’attrape au coin de la maison, te soulève comme un sac de riz et te ramène à table. Toute la famille rit. Tu rends le morceau.', effets: [{ stat: 'attributs.force', delta: 1 }, { drapeau: 'voix_akimichi', valeur: 'attrape' }] },
        },
      },
    ],
  }),
  adulte('akimichi', {
    id: 'vx_akimichi_adulte',
    titre: 'Grandir à la fête',
    texte: 'Avant le festival du village, deux Akimichi se disputent dans la cour du clan. Une tante : « Chaque année, on grossit sur la place pour amuser la foule. Chaque année, on rit de nous. Cette année, on ne grossit pas. » Un oncle, celui qui a porté trois blessés sur dix kilomètres pendant la dernière guerre : « La force n’est pas une permission de faire peur aux autres. C’est la possibilité de rester debout quand quelqu’un n’y arrive plus. Qu’ils rient. Nous savons ce que nous sommes. » On te demande de trancher : c’est toi qui dois ouvrir la fête.',
    choix: [
      {
        id: 'grandir',
        texte: 'Ouvrir la fête comme toujours, géant au milieu de la place',
        effets: [{ entrainer: 'baika', jours: 10 }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'voix_akimichi_adulte', valeur: 'fete' }],
        resultat: 'Tu grandis jusqu’à dépasser les lanternes. Les enfants hurlent de joie. Quelques adultes ricanent, comme chaque année. Ta tante les fixe un par un. Mais quand un gamin grimpe sur ta main pour voir le village d’en haut, elle sourit malgré elle.',
      },
      {
        id: 'refuser',
        texte: 'Ne pas grossir cette année, et dire pourquoi',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'social.influence', delta: 2 }, { stat: 'social.confianceClan', delta: -2 }, { drapeau: 'voix_akimichi_adulte', valeur: 'discours' }],
        resultat: 'Tu montes sur l’estrade à ta taille normale. Tu parles de la guerre, des blessés portés sur dix kilomètres, de ceux qui rient chaque année. La place se tait. Ton oncle secoue la tête, mécontent. L’année suivante, personne ne rit quand les Akimichi grandissent.',
      },
    ],
  }),

  // ── Yamanaka : comprendre sans fouiller ──
  enfance('yamanaka', {
    id: 'vx_yamanaka_enfant',
    titre: 'Tu es fâché·e',
    lieu: '$village',
    texte: 'Tu rentres de l’Académie en traînant les pieds. Ta petite cousine, qui arrose les fleurs de la boutique, lève la tête. « Tu es fâché·e. » « Tu n’en sais rien. » « Tu serres les dents, tu réponds trop vite et tu ne regardes plus personne. » « Ça ne veut pas dire que tu sais pourquoi. » « …C’est vrai. Alors tu veux me le dire ? »',
    choix: [
      {
        id: 'dire',
        texte: 'Lui raconter',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.charisme', delta: 1 }, { drapeau: 'voix_yamanaka', valeur: 'confie' }],
        resultat: 'Tu lui racontes l’humiliation du jour. Elle écoute sans interrompre, en arrosant toujours le même pot de fleurs, qui finit noyé. À la fin, elle dit seulement : « C’était injuste. » C’est tout ce que tu avais besoin d’entendre.',
      },
      {
        id: 'garder',
        texte: '« Non. C’est à moi. »',
        effets: [{ stat: 'attributs.discretion', delta: 1 }, { drapeau: 'voix_yamanaka', valeur: 'garde' }],
        resultat: 'Elle hoche la tête et retourne à ses fleurs. « D’accord. » Elle n’insiste pas. Le soir, tu trouves une fleur de camélia sur ton oreiller. Pas de mot. Elle a compris que tu n’en voulais pas.',
      },
    ],
  }),
  adulte('yamanaka', {
    id: 'vx_yamanaka_adulte',
    titre: 'La permission',
    texte: 'Un enfant de neuf ans a mis le feu à un grenier et refuse de dire pourquoi. Deux Yamanaka du service de renseignement se disputent devant la salle où il attend. Le premier : « Deux minutes dans sa tête et on saura tout. C’est pour l’aider. » La seconde, une spécialiste aux cheveux gris : « Lire les émotions d’une personne ne signifie pas qu’elle t’a donné la permission de fouiller dans sa vie. Surtout si c’est pour l’aider. Sinon, tu décides à sa place de ce dont elle a besoin. » C’est à toi d’entrer dans la salle.',
    choix: [
      {
        id: 'entrer',
        texte: 'Entrer dans son esprit, juste assez pour comprendre',
        effets: [{ entrainer: 'shintenshin', jours: 10 }, { ethique: { compassion: -2 } }, { drapeau: 'voix_yamanaka_adulte', valeur: 'fouille' }],
        resultat: 'Deux minutes. Tu vois le grenier, le père qui boit, la cachette sous le foin où l’enfant dormait les soirs de colère. Il a brûlé sa propre cachette pour ne plus jamais avoir à y retourner. Tu ressors. Tu sais tout. Et l’enfant te regarde comme s’il savait que tu sais. Il ne te le pardonnera pas.',
      },
      {
        id: 'parler',
        texte: 'T’asseoir face à lui, et lui parler comme à quelqu’un',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: 'Tu ne poses pas de question. Tu parles de ton propre père, de tes propres cachettes. Au bout d’une heure, il parle. Pas de tout. De ce qu’il veut. La spécialiste, derrière la vitre, hoche la tête. « Tu peux comprendre sa peur sans accepter sa décision. L’empathie n’est pas une capitulation. »', effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 4 } }, { drapeau: 'voix_yamanaka_adulte', valeur: 'parole' }] },
          echec: { texte: 'Il ne parle pas. Tu sors sans rien savoir. Ton collègue lève les yeux au ciel. La spécialiste, elle, te dit : « Tu as essayé la bonne porte. Elle était fermée aujourd’hui. »', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'voix_yamanaka_adulte', valeur: 'silence' }] },
        },
      },
    ],
  }),

  // ── Aburame : écouter ce qui ne parle pas ──
  enfance('aburame', {
    id: 'vx_aburame_enfant',
    titre: 'Tes épaules crient',
    texte: 'Tu racontes ta journée à ton grand-père, très fort, en agitant les bras. Il ne lève pas les yeux de la ruche qu’il répare. « Tu n’as pas besoin de crier. » « Je ne crie pas. » « Tes épaules le font à ta place. »',
    choix: [
      {
        id: 'baisser',
        texte: 'Baisser les épaules, et recommencer plus bas',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { entrainer: 'kikaichu', jours: 10 }, { drapeau: 'voix_aburame', valeur: 'calme' }],
        resultat: 'Tu recommences, plus bas. Les insectes de la ruche, qui bourdonnaient fort, se calment aussi. Ton grand-père lève enfin les yeux. « Tu vois ? Eux aussi t’écoutaient crier. »',
      },
      {
        id: 'bouder',
        texte: 'Partir bouder',
        effets: [{ stat: 'attributs.discretion', delta: 1 }, { drapeau: 'voix_aburame', valeur: 'boude' }],
        resultat: 'Tu pars bouder sous le cerisier. Un quart d’heure plus tard, un insecte vient se poser sur ton genou, puis un autre, puis dix. Ils ne font rien. Ils restent là. Ton grand-père les a envoyés. C’est sa façon de s’excuser.',
      },
    ],
  }),
  adulte('aburame', {
    id: 'vx_aburame_adulte',
    titre: 'La colonie qui a piqué',
    texte: 'Une colonie d’insectes du clan a attaqué un fermier, qui a failli mourir. Le chef du conseil veut la détruire, entièrement : « Un essaim dangereux reste dangereux. » Une Aburame plus jeune, qui s’en occupait : « Les gens remarquent les insectes parce qu’ils sont nombreux. Ils oublient que chacun réagit à son environnement. Une foule n’est pas une seule créature. Le fermier avait aspergé leur ruche de poison. Un clan non plus n’est pas une seule créature. »',
    choix: [
      {
        id: 'detruire',
        texte: 'Soutenir le conseil : détruire la colonie',
        effets: [{ stat: 'social.confianceClan', delta: 3 }, { stat: 'social.reputation', delta: 2 }, { ethique: { compassion: -3 } }, { drapeau: 'voix_aburame_adulte', valeur: 'detruite' }],
        resultat: 'La colonie brûle. Le fermier est satisfait. Le village aussi. La jeune Aburame regarde la fumée sans rien dire. Le lendemain, elle quitte le conseil. Tu croises son regard au marché, des mois plus tard. Elle ne détourne pas les yeux. Toi, si.',
      },
      {
        id: 'enquete',
        texte: 'Vérifier d’abord ce que le fermier avait fait',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { perception: 2, intellect: 1 },
          succes: { texte: 'Dans la grange du fermier, tu trouves les pots de poison, encore à moitié pleins. La colonie est déplacée en forêt, loin des champs. Le fermier paie une amende. La jeune Aburame te remercie d’un signe de tête. Le chef du conseil, lui, note ton nom. Pas en bien.', effets: [{ stat: 'attributs.perception', delta: 2 }, { ethique: { honneur: 3 } }, { stat: 'social.confianceClan', delta: -2 }, { drapeau: 'voix_aburame_adulte', valeur: 'sauvee' }] },
          echec: { texte: 'Le fermier a tout nettoyé. Pas de preuve. La colonie brûle quand même. La jeune Aburame te dit : « Merci d’avoir cherché. » C’est pire que si elle t’en voulait.', effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'voix_aburame_adulte', valeur: 'detruite' }] },
        },
      },
    ],
  }),

  // ── Inuzuka : la confiance par les actes ──
  enfance('inuzuka', {
    id: 'vx_inuzuka_enfant',
    titre: 'Demander avant de toucher',
    lieu: '$village',
    texte: 'Un enfant d’une autre famille du quartier tend la main vers les oreilles du chiot de ta cousine. Elle lui attrape le poignet. « Ne touche pas ses oreilles sans lui demander. » « C’est un chien. » « Et toi, tu aimerais que quelqu’un décide à ta place quand il peut te toucher ? » L’enfant rougit. Puis il se tourne vers toi : « Toi, tu es de leur famille. Comment on demande à un chien ? »',
    choix: [
      {
        id: 'montrer',
        texte: 'Lui montrer : s’accroupir, tendre la main, attendre',
        effets: [{ entrainer: 'ninken_lien', jours: 10 }, { stat: 'attributs.charisme', delta: 2 }, { drapeau: 'voix_inuzuka', valeur: 'enseigne' }],
        resultat: 'Tu t’accroupis, la main ouverte, paume vers le bas, et tu ne bouges plus. Le chiot hésite, renifle, puis vient poser son museau dans ta paume. L’enfant fait pareil. Le chiot vient aussi. Ta cousine te regarde, fière. Elle ne le dit pas. Elle n’a pas besoin.',
      },
      {
        id: 'rire',
        texte: '« On ne demande pas, on sait. Tu ne peux pas comprendre. »',
        effets: [{ stat: 'social.confianceClan', delta: 1 }, { stat: 'social.reputation', delta: -1 }, { drapeau: 'voix_inuzuka', valeur: 'ferme' }],
        resultat: 'L’enfant baisse la main et s’en va. Ta cousine te donne une tape derrière la tête. « Les chiens ne t’ont pas appris ça. C’est toi qui l’as inventé. »',
      },
    ],
  }),
  adulte('inuzuka', {
    id: 'vx_inuzuka_adulte',
    titre: 'Le vieux chien',
    texte: 'Le ninken de ton oncle a quatorze ans. Il boite, il entend mal. Le chef du clan veut le retirer des missions : « Un partenaire diminué met toute l’équipe en danger. » Ton oncle refuse, les poings serrés : « Mon partenaire n’est pas un équipement. Il n’est pas là pour compenser mes erreurs. Si je l’envoie au combat, c’est parce que nous avons appris à nous faire confiance. Il décidera, lui, quand il voudra s’arrêter. » Tous deux se tournent vers toi.',
    choix: [
      {
        id: 'chef',
        texte: 'Donner raison au chef : sa sécurité, et celle des autres',
        effets: [{ stat: 'social.confianceClan', delta: 3 }, { ethique: { compassion: -1 } }, { drapeau: 'voix_inuzuka_adulte', valeur: 'retraite' }],
        resultat: 'Le vieux chien reste au chenil. Il dort au soleil, toute la journée. Ton oncle part en mission avec un jeune chien qui ne le connaît pas. Il revient blessé. Il ne t’en veut pas. Il dit : « Le chef avait raison. C’est bien ça le pire. »',
      },
      {
        id: 'oncle',
        texte: 'Soutenir ton oncle : c’est au chien de décider',
        effets: [{ ethique: { compassion: 3 } }, { stat: 'social.confianceClan', delta: -2 }, { drapeau: 'voix_inuzuka_adulte', valeur: 'choix_du_chien' }],
        resultat: 'Le chef cède. Ton oncle ouvre la porte du chenil. Le vieux chien se lève, regarde la porte, regarde ton oncle… et se recouche. Ton oncle reste là longtemps. Puis il s’assoit à côté de lui. « D’accord, mon vieux. D’accord. » C’était sa décision. Personne ne l’a prise à sa place.',
      },
    ],
  }),

  // ── Uzumaki : une famille dispersée ──
  enfance('uzumaki', {
    id: 'vx_uzumaki_enfant',
    titre: 'Une famille ailleurs',
    texte: 'Ta cousine, venue d’un autre village pour la première fois, est assise avec toi sur le toit. Vous avez les mêmes cheveux. Vous ne vous étiez jamais vus. « Tu crois que les gens peuvent être une famille même s’ils ne vivent pas au même endroit ? » « Je ne sais pas. » « Moi non plus. Mais je veux essayer. »',
    choix: [
      {
        id: 'promesse',
        texte: 'Lui proposer de s’écrire, chaque saison',
        effets: [{ drapeau: 'lettres_uzumaki' }, { stat: 'attributs.charisme', delta: 1 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'voix_uzumaki', valeur: 'lettres' }],
        resultat: 'Elle sort un pinceau de sa poche et trace une petite spirale au dos de ta main. « Comme ça, tu reconnaîtras mes lettres. » Elle repart le lendemain. Trois mois plus tard, une lettre arrive. Il y a une spirale au dos.',
      },
      {
        id: 'sceau',
        texte: 'Tracer avec elle un sceau qui vous relie',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { intellect: 2, controleChakra: 1 },
          succes: { texte: 'Vous tracez le même sceau sur deux galets. Quand tu poses le doigt sur le tien, le sien devient tiède, au même moment. Vous vous regardez, ébahis. Elle repart avec son galet. Des années plus tard, le tien est encore tiède, parfois, sans raison. Tu sais qu’elle pense à toi.', effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 15 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'voix_uzumaki', valeur: 'galets' }] },
          echec: { texte: 'Les sceaux grésillent et s’éteignent. Elle rit. « On réessaiera quand on sera grands. » Vous gardez quand même les galets. Ils ne font rien. Ils sont à vous.', effets: [{ stat: 'attributs.intellect', delta: 1 }, { drapeau: 'voix_uzumaki', valeur: 'galets' }] },
        },
      },
    ],
  }),
  adulte('uzumaki', {
    id: 'vx_uzumaki_adulte',
    titre: 'Ce qu’on accepte d’enfermer',
    texte: 'Un rouleau d’Uzushio, retrouvé dans les ruines, porte un sceau intact. Deux Uzumaki se disputent dans l’atelier. Un jeune, les yeux brillants : « Il y a peut-être une technique perdue, là-dedans. Ou un nom, une liste des nôtres. On a le droit de savoir. » Un vieux maître des sceaux : « Un sceau n’est pas seulement une porte fermée. C’est une promesse sur ce qui restera de l’autre côté. Avant d’en ouvrir un, décide ce que tu cherches à protéger, et ce que tu acceptes de laisser sortir. » Le rouleau est posé devant toi.',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Ouvrir le sceau',
        effets: [
          { entrainer: 'fuinjutsu_uzumaki', jours: 20 },
          { hasard: [
            { poids: 60, effets: [{ drapeau: 'rouleau_uzushio', valeur: 'noms' }, { stat: 'social.confianceClan', delta: 5 }] },
            { poids: 40, effets: [{ drapeau: 'rouleau_uzushio', valeur: 'poison' }, { stat: 'jauges.sante', delta: -15 }] },
          ] },
        ],
        resultat: [
          { si: { drapeau: 'rouleau_uzushio', egal: 'noms' }, texte: 'Le sceau cède. Dedans : une liste. Les noms de tous les enfants d’Uzushio évacués la nuit de la chute, et les villages où on les a envoyés. Le jeune Uzumaki pleure. Le vieux maître lit la liste, et s’arrête sur un nom. Le sien.' },
          { si: { drapeau: 'rouleau_uzushio', egal: 'poison' }, texte: 'Le sceau cède, et une fumée verte jaillit du rouleau. Un piège laissé pour les pillards. Tu tousses pendant trois jours. Le vieux maître ne dit rien. Il n’a pas besoin.' },
        ],
      },
      {
        id: 'garder',
        texte: 'Le garder fermé : ceux qui l’ont scellé avaient leurs raisons',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { honneur: 2 } }, { drapeau: 'rouleau_uzushio', valeur: 'ferme' }],
        resultat: 'Le jeune Uzumaki claque la porte de l’atelier. Le vieux maître range le rouleau dans un coffre, et te tend la clé. « Le jour où tu sauras pourquoi tu veux l’ouvrir, tu l’ouvriras. Pas avant. »',
      },
    ],
  }),

  // ── Senju : la forêt et le village ──
  enfance('senju', {
    id: 'vx_senju_enfant',
    titre: 'L’arbre de ta naissance',
    lieu: 'foret_feu',
    texte: 'Chez les Senju, on plante un arbre à chaque naissance. Ta grand-tante t’emmène voir le tien. Il est plus petit que celui de ton cousin, né le même hiver. Ton cousin rit : « Mon arbre est plus grand. Je serai plus fort. » Ta grand-tante ne dit rien. Elle attend de voir ce que tu vas faire.',
    choix: [
      {
        id: 'soigner',
        texte: 'Arroser ton arbre, et revenir chaque semaine',
        effets: [{ entrainer: 'vitalite_senju', jours: 15 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'voix_senju', valeur: 'arbre' }],
        resultat: 'Tu reviens chaque semaine, tout l’hiver. Au printemps, ton arbre a rattrapé celui de ton cousin. Pas parce qu’il est plus fort. Parce que tu es revenu·e. Ta grand-tante te le dit, une seule fois, en passant : « C’est comme ça que le Premier a bâti un village. En revenant. »',
      },
      {
        id: 'repondre',
        texte: '« Les arbres ne se battent pas. »',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { drapeau: 'voix_senju', valeur: 'reponse' }],
        resultat: 'Ton cousin ouvre la bouche, la referme. Ta grand-tante éclate d’un rire très jeune pour son âge. « Non. Ils poussent les uns à côté des autres. C’est toute la leçon, et tu l’as trouvée toute seule. » Elle ne t’en dit pas plus.',
      },
    ],
  }),
  adulte('senju', {
    id: 'vx_senju_adulte',
    titre: 'Un clan ou un village',
    texte: 'Réunion de ce qui reste du clan Senju : une douzaine de personnes, dans une maison trop grande. Une cousine ambitieuse : « Nous avons fondé ce village. Nous n’avons plus un seul siège au conseil. Il est temps de rappeler qui nous sommes. » Un vieil homme, les mains tachées de terre : « Le Premier n’a pas fondé un clan. Il a fondé un village pour que les clans cessent de compter. Si nous réclamons, nous trahissons ce qu’il a fait. » Ils te regardent : tu portes le nom, et tu as une voix au village.',
    choix: [
      {
        id: 'reclamer',
        texte: 'Soutenir ta cousine : réclamer un siège au conseil',
        effets: [{ stat: 'social.influence', delta: 5 }, { stat: 'social.confianceClan', delta: 3 }, { ethique: { ambition: 4 } }, { drapeau: 'voix_senju_adulte', valeur: 'siege' }],
        resultat: 'Tu portes la demande au Hokage. Il l’accepte, après un long silence. Le clan a de nouveau un siège. Le vieil homme ne vient pas à la cérémonie. Ta cousine, elle, siège le soir même, et vote contre la première proposition des petits clans. Tu te demandes ce que tu viens de faire.',
      },
      {
        id: 'dissoudre',
        texte: 'Soutenir le vieil homme : le nom ne réclame rien',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'social.loyaute', delta: 3 }, { stat: 'social.confianceClan', delta: -3 }, { drapeau: 'voix_senju_adulte', valeur: 'village' }],
        resultat: 'Ta cousine quitte la maison en claquant la porte. Le vieil homme te serre la main avec ses doigts pleins de terre. « Tu as choisi la forêt plutôt que l’arbre. » Tu n’es pas sûr·e d’avoir compris. Mais tu sais que tu ne regretteras pas.',
      },
    ],
  }),

  // ── Hōzuki : l’eau et la peur ──
  enfance('hozuki', {
    id: 'vx_hozuki_enfant',
    titre: 'Avoir peur de l’eau',
    lieu: 'cotes_brume',
    texte: 'Ton cousin flotte sur le dos dans la baie, à moitié liquide, en riant. « Viens ! Un Hōzuki ne peut pas se noyer, il devient l’eau ! » Tu restes sur le rocher. L’eau est noire, et froide, et tu as peur. Tu as toujours eu peur. Tu n’as jamais osé le dire.',
    choix: [
      {
        id: 'avouer',
        texte: '« J’ai peur de l’eau. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { drapeau: 'voix_hozuki', valeur: 'aveu' }],
        resultat: 'Ton cousin cesse de rire. Il sort de l’eau, se reforme à côté de toi, et s’assoit. « Moi aussi, à ton âge. » Tu ne le crois pas. Il te montre une cicatrice sur son mollet, là où une murène l’avait mordu. « On a le droit d’avoir peur de ce qu’on est. On n’est pas obligé d’y rester. » Le lendemain, vous entrez dans l’eau ensemble, jusqu’aux genoux. C’est assez.',
      },
      {
        id: 'sauter',
        texte: 'Sauter quand même, sans rien dire',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { controleChakra: 2, controleEmotionnel: 1 },
          maitrises: { hydrification: 2 },
          succes: { texte: 'L’eau te prend, froide, noire. Et ton corps se souvient d’une chose que tu ignorais : tes mains fondent, tes jambes aussi. Tu flottes, à moitié eau. La peur est toujours là. Mais tu es là aussi. Ton cousin hurle de joie.', effets: [{ entrainer: 'hydrification', jours: 15 }, { stat: 'attributs.controleChakra', delta: 1 }, { drapeau: 'voix_hozuki', valeur: 'saut' }] },
          echec: { texte: 'Ton corps ne fond pas. Tu bois la tasse, tu te débats. Ton cousin te sort de là en une seconde, livide. « Pourquoi tu ne m’as pas dit ? » Tu ne réponds pas. Tu trembles.', effets: [{ stat: 'jauges.sante', delta: -6 }, { drapeau: 'voix_hozuki', valeur: 'peur' }] },
        },
      },
    ],
  }),
  adulte('hozuki', {
    id: 'vx_hozuki_adulte',
    titre: 'Les épées de la brume',
    texte: 'Un message arrive au clan : une des sept épées légendaires de Kiri a été vue, à vendre, au marché noir. Ta cousine, qui rêve de rejoindre les Sept Épéistes depuis l’enfance, veut la racheter, avec l’argent du clan. Son père : « Ces épées ont tué plus des nôtres que de nos ennemis. Chaque génération de Hōzuki qui les a portées est morte jeune. Je ne financerai pas ta tombe. » Ils te demandent de départager : c’est toi qui tiens les comptes du clan cette année.',
    choix: [
      {
        id: 'racheter',
        texte: 'Financer le rachat',
        effets: [{ stat: 'social.confianceClan', delta: 2 }, { stat: 'social.reputationOmbre', delta: 3 }, { ethique: { ambition: 3 } }, { drapeau: 'voix_hozuki_adulte', valeur: 'epee' }],
        resultat: 'Ta cousine revient avec l’épée, enveloppée de toile. Elle la pose sur la table du clan, et personne ne dit rien. Son père quitte la pièce. Elle te regarde, les yeux brillants. « Merci. » Tu espères de toutes tes forces que son père se trompe.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : l’argent du clan ne financera pas ça',
        effets: [{ ethique: { compassion: 2 } }, { stat: 'social.confianceClan', delta: 1 }, { drapeau: 'voix_hozuki_adulte', valeur: 'refus' }],
        resultat: 'Ta cousine ne te parle plus pendant un an. Puis, un soir, elle vient frapper à ta porte, trempée de pluie. « J’ai vu l’homme qui l’a achetée. Il est mort la semaine dernière. » Elle s’assoit. Elle ne dit pas merci. Elle reste dîner.',
      },
    ],
  }),

  // ── Kaguya : la lame qu’on choisit ──
  enfance('kaguya', {
    id: 'vx_kaguya_enfant',
    titre: 'L’os ne choisit pas',
    texte: 'Pendant une dispute avec un enfant du quartier, quelque chose a percé la peau de ton poignet : un éclat d’os blanc, pointu, qui est sorti tout seul. L’enfant s’est enfui en hurlant. {Parent} te soigne en silence. Puis : « L’os ne choisit pas. Il sort quand tu as peur, ou quand tu es en colère. Toi, tu choisis. Quoi, à ton avis ? »',
    choix: [
      {
        id: 'quand',
        texte: '« Quand il sort. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { entrainer: 'shikotsumyaku', jours: 10 }, { drapeau: 'voix_kaguya', valeur: 'maitrise' }],
        resultat: '{Parent_il} hoche la tête. « Bien. Alors on va apprendre à le rentrer avant de le sortir. » Toute la saison, {parent_il} te fait faire un exercice étrange : sentir l’os bouger sous la peau, et le retenir. Tu y arrives une fois sur dix. Puis une sur cinq.',
      },
      {
        id: 'contre',
        texte: '« Contre qui il sort. »',
        effets: [{ stat: 'social.confianceClan', delta: 2 }, { ethique: { compassion: -1 } }, { drapeau: 'voix_kaguya', valeur: 'cible' }],
        resultat: '{Parent_il} te regarde longtemps. « C’est la réponse de ton grand-père. Il est mort à vingt-six ans. » {Parent_il} range les bandages. « Ce n’est pas une mauvaise réponse. C’est une réponse courte. »',
      },
    ],
  }),
  adulte('kaguya', {
    id: 'vx_kaguya_adulte',
    titre: 'La danse d’avant',
    texte: 'Les anciens Kaguya veulent rétablir la danse des os, le rituel de guerre où les jeunes combattent jusqu’au premier sang devant tout le clan, pour mériter leur nom. Un ancien : « Sans la danse, nos enfants ne savent plus ce qu’ils sont. » Une mère, dont le fils doit danser cette année : « Ils savent ce qu’ils sont. C’est vous qui avez peur qu’ils deviennent autre chose. » On te demande de parler : tu as survécu à la danse, toi.',
    choix: [
      {
        id: 'retablir',
        texte: 'Défendre la danse : elle t’a appris qui tu es',
        effets: [{ stat: 'social.confianceClan', delta: 5 }, { ethique: { compassion: -2 } }, { drapeau: 'voix_kaguya_adulte', valeur: 'danse' }],
        resultat: 'La danse est rétablie. Le fils de la mère danse, et gagne, et revient avec une entaille au visage et une fierté immense. Sa mère ne te parle plus. L’année suivante, un autre enfant ne revient pas debout de la danse. Personne ne te le reproche. Tu te le reproches.',
      },
      {
        id: 'changer',
        texte: 'Proposer une danse sans sang',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: { texte: 'Tu proposes une danse où l’on combat avec des os émoussés, jusqu’au premier désarmement. Les anciens grognent. Puis l’un d’eux, le plus vieux, hoche la tête. « Le sang n’a jamais été le but. La maîtrise l’était. » La danse reprend, différente. La mère t’apporte un plat de riz le soir de la cérémonie.', effets: [{ stat: 'attributs.charisme', delta: 3 }, { stat: 'social.influence', delta: 3 }, { drapeau: 'voix_kaguya_adulte', valeur: 'reforme' }] },
          echec: { texte: 'Les anciens refusent. « Une danse sans sang, c’est une fête de village. » La mère te remercie d’avoir essayé. Son fils danse. Il revient. Cette fois.', effets: [{ stat: 'social.confianceClan', delta: -2 }, { drapeau: 'voix_kaguya_adulte', valeur: 'danse' }] },
        },
      },
    ],
  }),

  // ── Yuki : se cacher ou exister ──
  enfance('yuki', {
    id: 'vx_yuki_enfant',
    titre: 'La flaque gelée',
    lieu: '$village',
    texte: 'Tu joues avec ton meilleur ami près du lavoir. Il te pousse pour rire, tu tombes, et sous ta main, la flaque gèle d’un coup, en étoile. Il fixe la glace. Puis toi. {Parent} t’a répété cent fois : personne ne doit jamais voir ça. « C’était… c’était quoi, ça ? »',
    choix: [
      {
        id: 'mentir',
        texte: '« Il fait froid, c’est tout. »',
        effets: [{ stat: 'attributs.discretion', delta: 2 }, { stat: 'social.confianceClan', delta: 2 }, { drapeau: 'voix_yuki', valeur: 'secret' }],
        resultat: 'Il regarde le ciel, chaud et bleu. Puis il hausse les épaules. Il te croit, ou il fait semblant. Le soir, tu ne racontes rien à {parent}. Tu te demandes combien de fois, dans ta vie, tu devras mentir à quelqu’un que tu aimes.',
      },
      {
        id: 'verite',
        texte: 'Lui dire la vérité, et lui faire jurer de se taire',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { stat: 'social.suspicion', delta: 2 }, { ethique: { honneur: 2 } }, { drapeau: 'voix_yuki', valeur: 'confie' }],
        resultat: 'Tu lui dis tout, à voix basse, sous le lavoir. Il écoute, les yeux ronds, puis crache dans sa main et te la tend. Vous vous serrez la main. Il ne le dira jamais à personne. Tu ne le sais pas encore, mais c’est le premier secret que quelqu’un gardera pour toi toute sa vie.',
      },
    ],
  }),
  adulte('yuki', {
    id: 'vx_yuki_adulte',
    titre: 'Sortir de la neige',
    texte: 'Le Kage propose au clan Yuki, caché depuis trois générations, une reconnaissance officielle : un nom inscrit au registre, une protection, un quartier. {Parent} : « Une fois inscrits, ils sauront où nous trouver. Tous. Les chasseurs aussi. » Ton cousin, qui a vingt ans et n’a jamais pu dire son nom à voix haute : « Je préfère qu’on me trouve plutôt que de passer ma vie à ne pas exister. » On attend ta réponse.',
    choix: [
      {
        id: 'inscrire',
        texte: 'Accepter : il est temps d’exister',
        effets: [{ stat: 'social.suspicion', delta: -5 }, { stat: 'social.reputation', delta: 4 }, { stat: 'social.confianceClan', delta: 2 }, { drapeau: 'yuki_revele' }, { drapeau: 'voix_yuki_adulte', valeur: 'inscrits' }],
        resultat: 'Le nom Yuki est inscrit au registre. Ton cousin le lit à voix haute, devant le bâtiment administratif, trois fois. {Parent} ne dit rien. Le mois suivant, {parent_il} remarque un étranger qui pose des questions au marché. {Parent_il} double les serrures. Tu ne lui reproches rien.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : la neige les a protégés jusqu’ici',
        effets: [{ stat: 'attributs.discretion', delta: 2 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'voix_yuki_adulte', valeur: 'caches' }],
        resultat: 'Le clan reste caché. {Parent} te serre contre {lui:@parent}, longtemps. Ton cousin part la semaine suivante, pour un autre village, où il pourra dire son nom. Il t’écrit une fois par an. Il signe toujours « Yuki », en grand.',
      },
    ],
  }),

  // ── Shirakaze : lire le vent ──
  enfance('shirakaze', {
    id: 'vx_shirakaze_enfant',
    titre: 'Le vent qui tourne',
    lieu: 'desert_vent',
    texte: 'Ta grand-mère t’emmène sur la dune, à l’aube. « Ferme les yeux. Dis-moi d’où il vient. » Tu sens le vent sur ta joue gauche. Puis plus rien. Puis sur ta nuque. « Il tourne. » « Et qu’est-ce que ça veut dire, un vent qui tourne à l’aube ? »',
    choix: [
      {
        id: 'tempete',
        texte: '« Une tempête, ce soir. »',
        test: {
          type: 'competence',
          difficulte: 36,
          attributs: { perception: 3 },
          succes: { texte: 'Ta grand-mère ne dit rien. Le soir, la tempête frappe, exactement à l’heure du repas. Elle te sert la première, avant tout le monde. Chez les Shirakaze, c’est un titre.', effets: [{ entrainer: 'souffle_dunes', jours: 15 }, { stat: 'attributs.perception', delta: 2 }, { drapeau: 'voix_shirakaze', valeur: 'tempete' }] },
          echec: { texte: 'Il n’y a pas de tempête. Le ciel reste bleu toute la journée. Ta grand-mère rit : « Il tournait parce qu’un chameau est passé derrière toi. Regarde aussi avec tes oreilles. »', effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'voix_shirakaze', valeur: 'chameau' }] },
        },
      },
      {
        id: 'demander',
        texte: '« Je ne sais pas. Dis-moi. »',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { drapeau: 'voix_shirakaze', valeur: 'question' }],
        resultat: 'Elle sourit. « Bonne réponse. Ceux qui devinent se trompent une fois sur deux. Ceux qui demandent, une fois sur cent. » Puis elle t’explique : le sable qui chante, la chaleur qui monte, les oiseaux qui volent bas. Tu retiens tout. Tu oublieras la moitié. Mais tu sauras qu’il faut demander.',
      },
    ],
  }),
  adulte('shirakaze', {
    id: 'vx_shirakaze_adulte',
    titre: 'Vendre le vent',
    texte: 'Une guilde de marchands offre au clan une fortune pour ses lecteurs de vent : un Shirakaze à la tête de chaque caravane, pendant dix ans. Ton oncle : « Le village manque d’eau. Cet argent creuserait trois puits. » Ta tante : « Les marchands passeront par les routes que nous lirons pour eux. Les nôtres. Celles qui nous protègent des pillards. Dans dix ans, tout le désert les connaîtra. »',
    choix: [
      {
        id: 'vendre',
        texte: 'Accepter : trois puits valent bien des routes',
        effets: [{ stat: 'jauges.ryo', delta: 120 }, { stat: 'social.reputation', delta: 4 }, { stat: 'social.confianceClan', delta: -2 }, { drapeau: 'voix_shirakaze_adulte', valeur: 'vendu' }],
        resultat: 'Les puits sont creusés. Le quartier bas a de l’eau, pour la première fois depuis une génération. Trois ans plus tard, une caravane de pillards arrive par une des routes secrètes. Ta tante ne dit rien. Elle double les gardes.',
      },
      {
        id: 'garder',
        texte: 'Refuser : les routes appartiennent au désert',
        effets: [{ stat: 'social.confianceClan', delta: 4 }, { ethique: { honneur: 2 } }, { drapeau: 'voix_shirakaze_adulte', valeur: 'garde' }],
        resultat: 'Les marchands repartent. Ton oncle ne te parle plus pendant une saison. L’été suivant, il y a encore des files d’attente au puits. Tu y passes chaque matin, pour te rappeler ce que ta décision a coûté.',
      },
    ],
  }),

  // ── Raikō : l’orage et la peur ──
  enfance('raiko', {
    id: 'vx_raiko_enfant',
    titre: 'Avoir peur du tonnerre',
    texte: 'Un orage énorme sur Kumo. Tu es caché·e sous la table, les mains sur les oreilles. Chez les Raikō, le clan de la foudre, c’est une honte. {Parent} te trouve là. {Parent_il} ne te tire pas de dessous la table. {Parent_il} s’assoit par terre, à côté. « Tu sais pourquoi on a peur du tonnerre ? »',
    choix: [
      {
        id: 'pourquoi',
        texte: '« Parce qu’il est fort. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@parent', delta: { attachement: 4 } }, { drapeau: 'voix_raiko', valeur: 'ecoute' }],
        resultat: '« Non. Parce qu’il arrive après l’éclair. On a vu la lumière, et on attend. C’est l’attente qui fait peur. » {Parent_il} compte avec toi, entre l’éclair et le bruit : un, deux, trois. L’orage s’éloigne. À la fin, tu comptes seul·e, et tu n’as plus peur. Presque plus.',
      },
      {
        id: 'honte',
        texte: '« Laisse-moi. J’ai honte. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'voix_raiko', valeur: 'honte' }],
        resultat: '{Parent_il} ne s’en va pas. {Parent_il} reste assis{parent_e}, en silence, jusqu’à la fin de l’orage. Puis {parent_il} se lève. « Moi, j’en ai eu peur jusqu’à douze ans. » Ce n’est pas vrai. Tu le sauras plus tard. Mais ce soir-là, ça t’a sauvé·e.',
      },
    ],
  }),
  adulte('raiko', {
    id: 'vx_raiko_adulte',
    titre: 'La garde du Raikage',
    texte: 'On t’offre un poste dans la garde rapprochée du Raikage. C’est le plus grand honneur pour un Raikō. {Parent} en pleure presque. Ta cousine, elle, te prend à part : « Dans la garde, tu ne refuses plus jamais rien. Jamais. Tu te souviens de l’enfant qu’on a ramené de la frontière ? Les gardes du Raikage, c’étaient eux. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter : c’est l’honneur du clan',
        effets: [{ stat: 'social.loyaute', delta: 6 }, { stat: 'social.confianceClan', delta: 5 }, { stat: 'social.influence', delta: 3 }, { drapeau: 'voix_raiko_adulte', valeur: 'garde' }],
        resultat: '{Parent} t’enlace devant tout le clan. Ta cousine ne vient pas à la cérémonie. La première année, on ne te demande rien d’impossible. La deuxième non plus. Tu commences à penser que ta cousine avait tort. La troisième année, on te demande quelque chose.',
      },
      {
        id: 'refuser',
        texte: 'Refuser, et garder ta liberté de dire non',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'social.confianceClan', delta: -4 }, { relation: '@parent', delta: { amitie: -3 } }, { drapeau: 'voix_raiko_adulte', valeur: 'refus' }],
        resultat: '{Parent} ne comprend pas. {Parent_il} te regarde comme un étranger pendant des mois. Ta cousine t’attend devant chez toi, le soir du refus, avec deux bols de nouilles. Elle ne dit rien. Elle mange avec toi. Le Raikage, lui, se souviendra de ton nom.',
      },
    ],
  }),

  // ── Ishikawa : la pierre qui ne pleure pas ──
  enfance('ishikawa', {
    id: 'vx_ishikawa_enfant',
    titre: 'La pierre ne pleure pas',
    lieu: 'carrieres_terre',
    texte: 'Ton grand-père et toi portez des pierres jusqu’au muret qu’il reconstruit. Tu t’écrases le doigt entre deux blocs. Tu as mal, très mal. Tu sens les larmes monter. Ton grand-père pose sa pierre. « Chez nous, on dit que la pierre ne pleure pas. »',
    choix: [
      {
        id: 'retenir',
        texte: 'Ravaler tes larmes',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { entrainer: 'peau_roche', jours: 10 }, { drapeau: 'voix_ishikawa', valeur: 'retenu' }],
        resultat: 'Tu ravales tout. Tu reprends ta pierre, le doigt violet. Ton grand-père te regarde faire. Le soir, il te prend à part. « Je t’ai dit la phrase. Je ne t’ai pas dit la suite. La pierre ne pleure pas. Mais l’eau la creuse quand même. Personne ne gagne à ne jamais pleurer. »',
      },
      {
        id: 'pleurer',
        texte: 'Pleurer quand même',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { relation: '@parent', delta: { attachement: 2 } }, { drapeau: 'voix_ishikawa', valeur: 'pleure' }],
        resultat: 'Tu pleures, à gros sanglots. Ton grand-père s’assoit sur le muret, et attend. Quand tu as fini, il dit : « Bon. Maintenant, tu n’es plus une pierre. Tu es quelqu’un qui a eu mal. C’est mieux pour porter des pierres, en vérité. » Il te bande le doigt avec son mouchoir.',
      },
    ],
  }),
  adulte('ishikawa', {
    id: 'vx_ishikawa_adulte',
    titre: 'La carrière à vendre',
    texte: 'Un marchand étranger veut acheter la vieille carrière du clan, épuisée depuis des années. Une fortune. Ta tante : « La pierre est morte. L’argent est vivant. Nos enfants iront à l’Académie avec de vraies armes. » Un vieil oncle : « Nos morts sont enterrés dans cette carrière. Chaque génération y a laissé un nom gravé. Tu vends la pierre, tu vends les noms. »',
    choix: [
      {
        id: 'vendre',
        texte: 'Vendre, en déplaçant les pierres gravées',
        effets: [{ stat: 'jauges.ryo', delta: 150 }, { stat: 'social.confianceClan', delta: -2 }, { ethique: { ambition: 2 } }, { drapeau: 'voix_ishikawa_adulte', valeur: 'vendu' }],
        resultat: 'Il faut un mois pour déplacer les pierres gravées une à une jusqu’au nouveau cimetière du clan. Ton vieil oncle porte la dernière lui-même, à quatre-vingts ans, la peau grise de roche jusqu’aux coudes. Il ne te parle pas. Mais il ne te reproche rien. Il a choisi de porter.',
      },
      {
        id: 'garder',
        texte: 'Refuser : certaines pierres ne se vendent pas',
        effets: [{ stat: 'social.confianceClan', delta: 4 }, { ethique: { honneur: 2 } }, { drapeau: 'voix_ishikawa_adulte', valeur: 'garde' }],
        resultat: 'Le marchand repart. Ta tante soupire, et retourne à ses comptes. Le soir, ton vieil oncle t’emmène dans la carrière et te montre une pierre lisse, sans nom. « Celle-là est pour toi. Plus tard. Beaucoup plus tard. » Tu ne sais pas si c’est un honneur ou une menace. Les deux, chez les Ishikawa.',
      },
    ],
  }),

  // ── Sans clan : inventer ce qu’on n’a pas reçu ──
  enfance('sans_clan', {
    id: 'vx_sans_clan_enfant',
    titre: 'La fête qu’on n’a pas',
    texte: 'À l’Académie, tout le monde parle des fêtes de clan : la nuit des lanternes des uns, la course des chiens des autres. Toi, tu n’as rien à raconter. Le soir, tu demandes à {parent} pourquoi nous, on n’a pas de fête. {Il:@parent} réfléchit longtemps. Puis : « Parce que personne ne l’a encore inventée. »',
    choix: [
      {
        id: 'inventer',
        texte: '« Alors on l’invente. Maintenant. »',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { relation: '@parent', delta: { attachement: 6 } }, { drapeau: 'fete_famille' }, { drapeau: 'voix_sans_clan', valeur: 'fete' }],
        resultat: 'Vous inventez ensemble : la nuit du premier givre, on mange dehors, même s’il fait froid, et chacun raconte une chose qu’il a ratée dans l’année. {Parent} rate d’abord la soupe, exprès. Vous riez jusqu’à minuit. Des années plus tard, tu fêteras encore la nuit du premier givre. Avec tes propres enfants, peut-être.',
      },
      {
        id: 'triste',
        texte: '« On n’est personne, alors. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { ethique: { ambition: 3 } }, { drapeau: 'voix_sans_clan', valeur: 'ambition' }],
        resultat: '{Parent} te prend le menton. « Tu es la première personne de notre famille. C’est beaucoup. Il faut bien que quelqu’un commence. » Tu t’endors avec cette phrase dans la tête. Elle ne te quittera plus.',
      },
    ],
  }),
  adulte('sans_clan', {
    id: 'vx_sans_clan_adulte',
    titre: 'Entrer dans un clan',
    texte: 'Un chef de clan te propose une adoption officielle : entrer dans sa famille, prendre son nom, transmettre ses techniques. C’est un honneur rare, pour quelqu’un sans clan. Ton plus vieil ami, sans clan lui aussi, n’est pas d’accord : « Tu as passé ta vie à leur prouver qu’on pouvait exister sans eux. Si tu prends leur nom, tu leur donnes raison. » Le chef de clan, lui : « Les clans aussi ont commencé un jour. Avec quelqu’un qui a dit oui. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter le nom',
        effets: [{ stat: 'social.influence', delta: 5 }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'adopte_clan' }, { drapeau: 'voix_sans_clan_adulte', valeur: 'adopte' }],
        resultat: 'Tu prends le nom lors d’une cérémonie sobre, dans la maison du clan. Ton vieil ami n’y vient pas. Le soir, tu le trouves devant chez toi, une bouteille à la main. « Félicitations. » Il ne le pense pas tout à fait. Il le dit quand même. Vous buvez jusqu’à l’aube.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : ton nom, c’est toi qui l’as fait',
        effets: [{ ethique: { honneur: 2, ambition: 2 } }, { stat: 'attributs.charisme', delta: 2 }, { drapeau: 'voix_sans_clan_adulte', valeur: 'nom_propre' }],
        resultat: 'Le chef de clan s’incline, sans rancune. « Alors fonde le tien. » Tu ris. Lui ne rit pas. Ton vieil ami, en apprenant ta réponse, te serre si fort que tu en as mal aux côtes. « Le premier de notre clan, hein ? » Peut-être. Il faut bien que quelqu’un commence.',
      },
    ],
  }),
];
