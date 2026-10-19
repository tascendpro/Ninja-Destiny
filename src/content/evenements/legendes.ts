import type { Condition, EventDef } from '../../engine/types';

// Les légendes du monde ninja : les trois Sannin, qui enseignent chacun une seule chose à qui ils ont choisi,
// et l'Akatsuki, l'organisation des nuages rouges, qu'on peut combattre… ou rejoindre.

const SANNIN = { chapitre: 2, chapitres: [2, 3, 4], arc: 'conflit' as const, rare: true };
const AUBE = { chapitre: 3, chapitres: [3, 4, 5], arc: 'conflit' as const };
const LIBRE: Condition = { statut: ['actif', 'errant', 'deserteur', 'exile'] };
const MEMBRE: Condition = { drapeau: 'akatsuki_membre' };
const MORT_MARQUE = 'emporté·e par la fièvre de la marque maudite';

export const LEGENDES: EventDef[] = [
  // ── Orochimaru ──
  {
    ...SANNIN,
    id: 'sn_orochimaru',
    titre: 'Le serpent blanc',
    categorie: 'organisation',
    lieu: 'foret_feu',
    poids: 4,
    si: { tout: [LIBRE, { age: { min: 14 } }, { drapeau: 'marque_maudite', absent: true }] },
    texte:
      'Il fait nuit, et pourtant tu le vois très bien : un homme à la peau blanche comme un ventre de serpent, assis sur une branche au-dessus de toi. Ses pupilles sont fendues. « Orochimaru », dit-il, comme si ce nom devait te suffire. Il te suffit. « Je t’observe depuis un moment. Tu as un corps intéressant. Et une faim que ton village ne nourrira jamais. Laisse-moi te faire un cadeau. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Tendre le cou : tu veux ce pouvoir',
        indice: 'On dit que neuf sur dix n’y survivent pas.',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { force: 1, controleEmotionnel: 2 },
          succes: {
            texte: 'Ses crocs dans ton cou, puis trois jours de fièvre où tu brûles de l’intérieur. Le quatrième matin, trois virgules noires sont gravées sous ta peau, et quand tu fermes le poing, l’air se met à trembler. « Tu viendras me voir », a-t-il soufflé avant de disparaître. « Quand le cadeau te réclamera. »',
            effets: [
              { drapeau: 'marque_maudite' },
              { apprendre: 'marque_maudite', source: 'mentor' },
              { stat: 'jauges.chakraMax', delta: 10 },
              { ethique: { ambition: 8 } },
              { si: { statut: 'actif' }, alors: [{ stat: 'social.suspicion', delta: 12 }] },
              { journal: 'Orochimaru t’a marqué·e de son sceau maudit.', importance: 3 },
            ],
          },
          echec: {
            texte: 'La morsure, puis la fièvre. Elle ne s’arrête pas. Au troisième jour, tu entends ton cœur ralentir, et une voix lointaine dire : « Dommage. »',
            effets: [
              {
                hasard: [
                  { poids: 55, effets: [{ blessure: { id: 'fievre_marque', nom: 'Fièvre de la marque', gravite: 3, jours: 90 } }, { stat: 'attributs.force', delta: -2 }] },
                  { poids: 45, effets: [{ drapeau: 'cause_mort', valeur: MORT_MARQUE }, { stat: 'jauges.sante', valeur: 0 }] },
                ],
              },
            ],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser : ce qu’il offre, il le reprendra au centuple',
        effets: [{ drapeau: 'refus_orochimaru' }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { honneur: 3 } }],
        resultat: 'Il rit, d’un rire qui ne monte jamais jusqu’aux yeux. « Tu changeras d’avis. Ils changent toujours d’avis. » Quand tu relèves la tête, la branche est vide.',
      },
      {
        id: 'attaquer',
        texte: 'L’attaquer avant qu’il ne s’approche',
        test: {
          type: 'combat',
          difficulte: 68,
          attributs: { agilite: 1, perception: 1, controleChakra: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1 },
          letal: true,
          causeMort: 'avalé·e par les serpents d’Orochimaru',
          succes: {
            texte: 'Ton coup le traverse ; sa peau se détache comme une mue et il réapparaît plus loin, sans une égratignure, l’air ravi. « De mieux en mieux. » Il s’en va. Tu as tenu face à un Sannin : la nouvelle fera le tour des routes.',
            effets: [{ stat: 'social.reputation', delta: 8 }, { stat: 'social.reputationOmbre', delta: 6 }, { drapeau: 'refus_orochimaru' }],
          },
          echec: {
            texte: 'Des serpents jaillissent de ses manches et t’enserrent. Il s’approche sans se presser et plante ses crocs dans ton cou. « Je ne demandais pas vraiment. » La fièvre te prend avant même qu’il ait disparu.',
            effets: [{ drapeau: 'marque_maudite' }, { apprendre: 'marque_maudite', source: 'mentor' }, { blessure: { id: 'morsure', nom: 'Morsure du serpent', gravite: 2, jours: 40 } }, { journal: 'Orochimaru t’a marqué·e de force.', importance: 3 }],
          },
        },
      },
      {
        id: 'denoncer',
        texte: 'Fuir et donner l’alerte au village',
        si: { statut: 'actif' },
        effets: [{ stat: 'social.loyaute', delta: 6 }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'refus_orochimaru' }],
        resultat: 'Tu cours sans te retourner. Au village, ton rapport fait pâlir le conseil : on double les patrouilles pendant un mois. On ne trouve rien, sinon une mue de serpent, longue comme un homme.',
      },
    ],
  },
  {
    ...SANNIN,
    chapitres: [2, 3, 4, 5],
    id: 'sn_orochimaru_appel',
    titre: 'La marque réclame',
    categorie: 'organisation',
    lieu: '$village',
    poids: 30,
    rare: false,
    si: { tout: [LIBRE, { drapeau: 'marque_maudite' }, { drapeau: 'usages_marque_maudite', min: 4 }] },
    texte:
      'La marque te brûle depuis trois nuits. Au matin du quatrième jour, un serpent blanc t’attend sur le seuil, un rouleau dans la gueule. Une carte, et une seule phrase : « Tu as goûté au pouvoir. Viens en chercher davantage. » L’écriture est la sienne. Ton cou le sait.',
    choix: [
      {
        id: 'rejoindre',
        texte: 'Partir pour le repaire d’Orochimaru',
        indice: 'Ton village te comptera parmi les déserteurs.',
        effets: [
          { statut: 'deserteur' },
          { drapeau: 'eleve_orochimaru' },
          { entrainer: 'marque_maudite', jours: 120, mentor: true },
          { stat: 'jauges.chakraMax', delta: 15 },
          { stat: 'social.reputationOmbre', delta: 15 },
          { ethique: { ambition: 10, compassion: -5 } },
          { journal: 'Tu as rejoint Orochimaru dans son repaire.', importance: 3 },
        ],
        resultat: 'Un repaire creusé sous une montagne, des couloirs qui sentent le formol, des cellules où des gens que tu ne veux pas regarder attendent. Orochimaru t’entraîne lui-même, des mois durant. Tu deviens plus fort·e que tu ne l’as jamais été. Tu ne lui demandes jamais ce qu’il attend en échange.',
      },
      {
        id: 'resister',
        texte: 'Brûler la carte et tenir bon',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleEmotionnel: 3 },
          succes: {
            texte: 'La marque hurle sous ta peau pendant des jours, puis se tait. Elle reviendra. Mais c’est toi qui décides quand.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: 5 }, { drapeau: 'marque_resistee' }, { ethique: { honneur: 4 } }],
          },
          echec: {
            texte: 'Tu brûles la carte. La marque te le fait payer : une crise en pleine rue, des flammes noires sur ta peau, des gens qui crient. Tu reprends conscience entouré·e de regards terrifiés.',
            effets: [{ blessure: { id: 'crise_marque', nom: 'Crise de la marque', gravite: 2, jours: 30 } }, { si: { statut: 'actif' }, alors: [{ stat: 'social.suspicion', delta: 15 }] }],
          },
        },
      },
      {
        id: 'sceau',
        texte: 'Demander aux maîtres des sceaux du village de l’enfermer',
        si: { statut: 'actif' },
        effets: [{ stat: 'social.loyaute', delta: 8 }, { stat: 'social.suspicion', delta: 5 }, { stat: 'jauges.chakraMax', delta: -5 }, { drapeau: 'marque_scellee' }],
        resultat: 'Trois jours dans une salle couverte de sceaux. Le sceau d’enfermement tient : la marque se tait. Elle te reste, mais elle dort. Le village sait, désormais. Il te regardera toujours un peu de travers.',
      },
    ],
  },

  // ── Jiraiya ──
  {
    ...SANNIN,
    id: 'sn_jiraiya',
    titre: 'L’ermite des crapauds',
    categorie: 'entrainement',
    lieu: 'marche_noir',
    poids: 4,
    repetable: { delaiJours: 720, max: 2 },
    si: { tout: [LIBRE, { age: { min: 15 } }, { drapeau: 'maitre_jiraiya', absent: true }] },
    texte:
      'Derrière la palissade des bains publics, un grand homme aux cheveux blancs hérissés prend des notes, l’œil collé à une fente du bois. Il te voit, ne se démonte pas, et se redresse de toute sa hauteur sur un crapaud apparu de nulle part : « Je suis le grand Jiraiya, l’ermite du mont Myōboku, le Sannin que même les crapauds respectent ! » Puis, plus bas : « Et je fais des recherches. Pour un livre. Ne crie pas. »',
    choix: [
      {
        id: 'demander',
        texte: 'Lui demander de t’entraîner',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { charisme: 1, controleChakra: 2 },
          maitrises: { ninjutsu: 1 },
          succes: {
            texte: 'Il te jauge, longtemps, puis soupire. « Tu as ce regard. Le même que le gamin d’avant. » Des mois sur les routes avec lui, puis le mont Myōboku, où des crapauds hauts comme des maisons t’apprennent à rester immobile jusqu’à sentir la montagne respirer. « L’énergie naturelle », dit-il. « Trop peu, tu n’as rien. Trop, tu deviens une statue de crapaud. Ne te trompe pas. »',
            effets: [
              { drapeau: 'maitre_jiraiya' },
              { entrainer: 'ninjutsu', jours: 90, mentor: true },
              { stat: 'attributs.controleChakra', delta: 4 },
              { apprendre: 'mode_ermite', source: 'mentor' },
              { journal: 'Jiraiya t’a pris·e comme élève et t’a mené·e au mont Myōboku.', importance: 3 },
            ],
          },
          echec: {
            texte: '« Pas le temps, gamin. » Il te lance un livre à la couverture orange, « Le Paradis du batifolage », dédicacé. « Lis ça. Ça forme le caractère. » Il disparaît dans un nuage de fumée. Tu le recroiseras peut-être.',
            effets: [{ drapeau: 'jiraiya_croise' }, { stat: 'attributs.intellect', delta: 1 }],
          },
        },
      },
      {
        id: 'guet',
        texte: 'Faire le guet pour lui, en échange d’une leçon',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { discretion: 2, perception: 1 },
          succes: {
            texte: 'Tu détournes l’attention de trois baigneuses furieuses et d’un garde. Jiraiya, ému aux larmes, tient parole. « Un apprenti qui sait mentir à une femme en colère ira loin. » Il t’emmène au mont Myōboku.',
            effets: [{ drapeau: 'maitre_jiraiya' }, { entrainer: 'ninjutsu', jours: 60, mentor: true }, { apprendre: 'mode_ermite', source: 'mentor' }, { ethique: { honneur: -2 } }, { journal: 'Jiraiya t’a pris·e comme élève, pour de mauvaises raisons.', importance: 3 }],
          },
          echec: {
            texte: 'Les baigneuses vous repèrent tous les deux. Jiraiya s’échappe sur son crapaud. Toi, tu prends les seaux d’eau bouillante.',
            effets: [{ stat: 'jauges.sante', delta: -8 }, { stat: 'social.reputation', delta: -3 }, { drapeau: 'jiraiya_croise' }],
          },
        },
      },
      {
        id: 'partir',
        texte: 'Le laisser à ses « recherches »',
        effets: [{ drapeau: 'jiraiya_croise' }],
        resultat: 'Il te fait un clin d’œil complice que tu n’as rien fait pour mériter. Tu ne sauras jamais ce que tu as manqué.',
      },
    ],
  },

  // ── Tsunade ──
  {
    ...SANNIN,
    id: 'sn_tsunade',
    titre: 'La perdante légendaire',
    categorie: 'entrainement',
    lieu: 'marche_noir',
    poids: 4,
    repetable: { delaiJours: 720, max: 2 },
    si: { tout: [LIBRE, { age: { min: 15 } }, { drapeau: 'maitre_tsunade', absent: true }] },
    texte:
      'Dans une maison de jeu enfumée, une femme blonde aux couettes basses perd une fortune aux dés, avec l’entrain de quelqu’un qui a l’habitude. Un losange violet brille sur son front. Derrière elle, une jeune femme serre un petit cochon dans ses bras et soupire : « Maître Tsunade, on n’a plus de quoi payer l’auberge. » Tsunade. La Sannin. La plus grande médecin du monde.',
    choix: [
      {
        id: 'apprendre',
        texte: 'Lui demander de t’enseigner la médecine',
        si: { un: [{ maitrise: 'shosen', palierMin: 1 }, { stat: 'attributs.controleChakra', min: 55 }] },
        verrou: 'Il te faudrait la Paume mystique, ou un contrôle du chakra hors du commun, pour qu’elle t’écoute.',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleChakra: 2, intellect: 1 },
          maitrises: { shosen: 1 },
          succes: {
            texte: 'Elle te met un poisson mort dans les mains. « Ressuscite-le. » Tu échoues. Elle t’en donne un autre. Des mois plus tard, le poisson remue. Alors seulement elle te montre le losange : « Chaque jour, tu verses un peu de chakra dans ce sceau. Pendant des années. Et le jour où tout le monde te croit finie, tu l’ouvres. »',
            effets: [
              { drapeau: 'maitre_tsunade' },
              { entrainer: 'shosen', jours: 120, mentor: true },
              { stat: 'attributs.controleChakra', delta: 4 },
              { si: { maitrise: 'shosen', palierMin: 2 }, alors: [{ apprendre: 'byakugo', source: 'mentor' }] },
              { journal: 'Tsunade t’a enseigné la médecine et le secret du Byakugō.', importance: 3 },
            ],
          },
          echec: {
            texte: '« Reviens quand tu sauras refermer une égratignure sans la rendre pire. » Elle retourne à ses dés. Elle perd.',
            effets: [{ drapeau: 'tsunade_croisee' }],
          },
        },
      },
      {
        id: 'parier',
        texte: 'Parier contre elle',
        effets: [{ stat: 'jauges.ryo', delta: 150 }, { drapeau: 'tsunade_croisee' }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Tu mises contre elle à chaque lancer. Tu gagnes à chaque lancer. Elle finit par te fixer d’un œil noir et par écraser la table d’un seul doigt. Tu prends tes gains et tu pars, vite.',
      },
      {
        id: 'defier',
        texte: 'La défier : si tu tiens trois échanges, elle t’enseigne',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { force: 1, agilite: 2 },
          maitrises: { taijutsu: 1 },
          succes: {
            texte: 'Elle frappe d’un doigt et le plancher éclate. Tu esquives, une fois, deux fois, trois fois. Elle éclate de rire. « Bon. Tu as des jambes, à défaut d’une tête. » Elle te garde des mois, et ne t’épargne rien.',
            effets: [{ drapeau: 'maitre_tsunade' }, { entrainer: 'shosen', jours: 90, mentor: true }, { stat: 'attributs.force', delta: 3 }, { si: { maitrise: 'shosen', palierMin: 2 }, alors: [{ apprendre: 'byakugo', source: 'mentor' }] }, { journal: 'Tu as tenu trois échanges contre Tsunade.', importance: 3 }],
          },
          echec: {
            texte: 'Un seul doigt. Tu traverses le mur de la maison de jeu, puis celui d’en face. Elle soigne elle-même tes côtes, en grommelant. « Idiot·e. Mais courageux·se. »',
            effets: [{ blessure: { id: 'doigt_tsunade', nom: 'Côtes enfoncées', gravite: 2, jours: 30 } }, { drapeau: 'tsunade_croisee' }],
          },
        },
      },
    ],
  },

  // ── L'Akatsuki ──
  {
    ...AUBE,
    id: 'ak_rumeur',
    titre: 'Des nuages rouges',
    categorie: 'organisation',
    lieu: 'frontiere_herbe',
    poids: 5,
    si: { tout: [LIBRE, { age: { min: 18 } }, { drapeau: 'akatsuki_connue', absent: true }] },
    texte:
      'Dans une auberge de frontière, deux voyageurs en longs manteaux noirs brodés de nuages rouges dînent sans ôter leurs chapeaux de paille. Autour d’eux, personne ne parle. Quand ils partent, l’aubergiste murmure le mot qu’on n’ose pas dire trop fort : Akatsuki. Des déserteurs de rang S, de tous les villages. On dit qu’ils chassent les bêtes à queues. On dit qu’ils se vendent au plus offrant.',
    choix: [
      {
        id: 'suivre',
        texte: 'Les suivre pour en savoir plus',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { discretion: 2, perception: 1 },
          succes: {
            texte: 'Tu les suis jusqu’à un bureau de primes. Le plus grand, au masque cousu, échange un cadavre contre un sac d’or et compte chaque pièce deux fois. L’autre porte une faux à trois lames et prie un dieu dont tu n’as jamais entendu parler. Kakuzu et Hidan. Tu notes les noms. Eux, ils ont noté ton visage.',
            effets: [{ drapeau: 'akatsuki_connue' }, { indice: 'akatsuki_primes' }, { stat: 'attributs.discretion', delta: 2 }],
          },
          echec: {
            texte: 'Au premier virage, le plus grand t’attend, adossé à un arbre. « On ne paie pas pour ta tête. Pas encore. » Il te laisse partir. Ce n’est pas de la pitié : tu ne vaux rien, pour l’instant.',
            effets: [{ drapeau: 'akatsuki_connue' }, { stat: 'attributs.controleEmotionnel', delta: -1 }],
          },
        },
      },
      {
        id: 'ignorer',
        texte: 'Finir ton bol et regarder ailleurs',
        effets: [{ drapeau: 'akatsuki_connue' }],
        resultat: 'Tu finis ton bol sans lever les yeux. C’est probablement la décision la plus sage que tu prendras cette année.',
      },
      {
        id: 'rapport',
        texte: 'Prévenir ton village',
        si: { statut: 'actif' },
        effets: [{ drapeau: 'akatsuki_connue' }, { stat: 'social.loyaute', delta: 4 }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'Ton rapport remonte jusqu’au {kage}, qui le lit deux fois. Le soir même, les gardes de la porte reçoivent un nouveau signalement : des manteaux noirs à nuages rouges.',
      },
    ],
  },
  {
    ...AUBE,
    id: 'ak_recrutement',
    titre: 'L’invitation de l’Aube',
    categorie: 'organisation',
    lieu: 'route_commerce',
    poids: 6,
    si: {
      tout: [
        LIBRE,
        { age: { min: 19 } },
        { drapeau: 'akatsuki_membre', absent: true },
        { drapeau: 'akatsuki_ennemie', absent: true },
        { un: [{ drapeau: 'akatsuki_connue' }, { statut: 'deserteur' }, { stat: 'social.reputationOmbre', min: 25 }] },
      ],
    },
    texte:
      'Ils t’attendent au milieu de la route, comme s’ils avaient tout leur temps : Kakuzu, le masque cousu, et Hidan, la faux sur l’épaule. « Notre chef s’intéresse à toi », dit Kakuzu. « Il manque un membre. Le précédent a coûté trop cher. » Hidan ricane. « Dis oui, qu’on en finisse. Ou dis non. Je préférerais que tu dises non. »',
    choix: [
      {
        id: 'rejoindre',
        texte: 'Accepter l’anneau et le manteau',
        indice: 'Plus aucun village ne te reprendra.',
        effets: [
          { statut: 'deserteur' },
          { drapeau: 'akatsuki_membre' },
          { drapeau: 'akatsuki_connue' },
          { stat: 'social.reputationOmbre', delta: 20 },
          { stat: 'social.loyaute', delta: -30 },
          { stat: 'jauges.ryo', delta: 200 },
          { ethique: { ambition: 10, compassion: -4 } },
          { planifier: 'ak_prime', dansJours: 120 },
          { journal: 'Tu as rejoint l’Akatsuki.', importance: 3 },
        ],
        resultat: 'Un anneau à ton doigt, gravé d’un kanji qui est désormais le tien. Un manteau noir aux nuages rouges, trop grand d’abord, puis à ta taille. Ton nom rejoint, dans tous les villages, la liste des déserteurs de rang S. « Bienvenue », dit Kakuzu, sans chaleur. « Tu me dois déjà le prix du manteau. »',
      },
      {
        id: 'espion',
        texte: 'Feindre d’accepter, pour les espionner au profit de ton village',
        si: { statut: 'actif' },
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { charisme: 2, controleEmotionnel: 1, intellect: 1 },
          succes: {
            texte: 'Tu acceptes avec juste ce qu’il faut d’hésitation. Ils y croient. Officiellement, tu as déserté ; seuls le {kage} et deux anciens savent la vérité. Tu ne pourras plus jamais rentrer chez toi comme avant.',
            effets: [{ statut: 'deserteur' }, { drapeau: 'akatsuki_membre' }, { drapeau: 'akatsuki_espion' }, { stat: 'social.loyaute', delta: 15 }, { planifier: 'ak_prime', dansJours: 120 }, { journal: 'Tu as infiltré l’Akatsuki pour ton village.', importance: 3 }],
          },
          echec: {
            texte: 'Kakuzu te regarde longtemps. « Tu mens mal. » Hidan sourit enfin, et lève sa faux.',
            effets: [{ drapeau: 'akatsuki_ennemie' }, { blessure: { id: 'faux_hidan', nom: 'Entaille de la faux', gravite: 3, jours: 60 } }, { planifier: 'ak_traque', dansJours: 500 }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser, et te préparer à te battre',
        test: {
          type: 'combat',
          difficulte: 66,
          attributs: { agilite: 1, force: 1, perception: 1, controleChakra: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'raiton',
          causeMort: 'tué·e par Kakuzu et Hidan, de l’Akatsuki',
          succes: {
            texte: 'Le combat dure jusqu’au crépuscule. Kakuzu finit par lever la main. « Assez. Tu nous coûtes plus cher que tu ne rapporterais. » Hidan proteste, puis le suit en jurant. Tu restes debout. Personne n’a jamais fait ça.',
            effets: [{ drapeau: 'akatsuki_ennemie' }, { stat: 'social.reputation', delta: 12 }, { stat: 'social.reputationOmbre', delta: 8 }, { planifier: 'ak_traque', dansJours: 700 }, { journal: 'Tu as refusé l’Akatsuki, et tu as survécu.', importance: 3 }],
          },
          echec: {
            texte: 'Hidan t’entaille à peine, juste assez pour goûter ton sang, et commence son rituel. Kakuzu l’arrête d’un geste : « Pas de prime sur celui-là. On perd notre temps. » Ils te laissent à moitié mort·e.',
            effets: [{ drapeau: 'akatsuki_ennemie' }, { blessure: { id: 'rituel_hidan', nom: 'Rituel inachevé', gravite: 3, jours: 90 } }],
          },
        },
      },
    ],
  },
  {
    ...AUBE,
    id: 'ak_prime',
    titre: 'Le contrat de Kakuzu',
    categorie: 'mission',
    lieu: 'carrieres_terre',
    enchaine: true,
    si: { tout: [MEMBRE, { statut: 'deserteur' }] },
    texte:
      'Kakuzu te tend un avis de recherche : un ancien jōnin d’Iwa, cinq cents ryō, mort ou vif, mais « mort, c’est plus léger ». Il se cache dans les carrières de la Terre avec ce qui reste de son équipe. « Tu ramènes le corps. Je garde la moitié. C’est le prix de l’anneau. »',
    choix: [
      {
        id: 'chasser',
        texte: 'Chasser la cible',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, perception: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'doton',
          causeMort: 'tué·e en chassant une prime pour l’Akatsuki',
          succes: { texte: 'La cible se battait pour sa vie ; toi, pour un anneau. Il se bat mieux que prévu, mais pas assez. Il est à terre au fond d’une galerie, et il te regarde.', effets: [{ stat: 'jauges.ryo', delta: 250 }, { stat: 'social.reputationOmbre', delta: 8 }, { planifier: 'ak_jinchuriki', dansJours: 400 }] },
          echec: { texte: 'Son équipe t’attendait. Tu t’en sors par un boyau trop étroit pour eux, en sang. Kakuzu ne dit rien. Il note la dette.', effets: [{ blessure: { id: 'carrieres', nom: 'Éboulis et coups', gravite: 2, jours: 40 } }, { drapeau: 'dette_kakuzu' }, { planifier: 'ak_jinchuriki', dansJours: 400 }] },
        },
      },
      {
        id: 'prevenir',
        texte: 'Prévenir la cible et lui laisser une chance de fuir',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { discretion: 2, charisme: 1 },
          succes: {
            texte: 'Un mot glissé sous une pierre, et la cible disparaît dans la nuit. Tu rapportes à Kakuzu des traces de fuite et un air dépité très convaincant. Il ne te croit qu’à moitié.',
            effets: [{ ethique: { compassion: 8 } }, { drapeau: 'soupcon_akatsuki' }, { planifier: 'ak_jinchuriki', dansJours: 400 }],
          },
          echec: {
            texte: 'Kakuzu trouve ton mot avant la cible. Il ne dit rien. Il n’a pas besoin de parler : tu sais déjà ce que ça coûtera.',
            effets: [{ drapeau: 'akatsuki_traitre' }, { planifier: 'ak_traque', dansJours: 120 }],
          },
        },
      },
    ],
  },
  {
    ...AUBE,
    id: 'ak_jinchuriki',
    titre: 'La bête dans l’enfant',
    categorie: 'organisation',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: { tout: [MEMBRE, { statut: 'deserteur' }, { drapeau: 'akatsuki_traitre', absent: true }] },
    texte:
      'L’ordre vient du chef lui-même : un jinchūriki, une gamine de douze ans, voyage avec une escorte réduite vers le col de la Foudre. Tu dois la ramener vivante. On ne te dit pas ce qu’on fera d’elle. Tu n’as pas besoin qu’on te le dise : l’extraction d’une bête tue toujours son hôte.',
    choix: [
      {
        id: 'obeir',
        texte: 'Obéir : attaquer l’escorte et prendre l’enfant',
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1 },
          letal: true,
          manches: 3,
          elementAdverse: 'raiton',
          causeMort: 'tombé·e au col de la Foudre, au service de l’Akatsuki',
          succes: { texte: 'L’escorte tombe. L’enfant ne pleure pas ; elle te regarde, et c’est pire. Tu la livres. Le chef te fait savoir qu’il est satisfait. Tu ne dors plus très bien.', effets: [{ ethique: { compassion: -15, ambition: 6 } }, { drapeau: 'jinchuriki_livre' }, { stat: 'social.reputationOmbre', delta: 12 }, { planifier: 'ak_chef', dansJours: 300 }] },
          echec: { texte: 'La bête se réveille dans l’enfant. Tu n’as jamais rien vu de pareil, et tu n’en reviens qu’à moitié. Elle s’enfuit avec ce qui reste de l’escorte.', effets: [{ blessure: { id: 'bete', nom: 'Brûlures du chakra de la bête', gravite: 3, jours: 80 } }, { planifier: 'ak_chef', dansJours: 300 }] },
        },
      },
      {
        id: 'sauver',
        texte: 'Prévenir l’escorte et faire fuir l’enfant',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { discretion: 2, intellect: 1, charisme: 1 },
          succes: {
            texte: 'Tu envoies l’escorte sur un autre chemin et tu rapportes un échec crédible. L’enfant vivra. Toi, tu viens de mettre un pied hors de l’Akatsuki, et l’Akatsuki ne laisse pas partir les siens.',
            effets: [{ ethique: { compassion: 12, honneur: 6 } }, { drapeau: 'akatsuki_traitre' }, { planifier: 'ak_traque', dansJours: 200 }, { journal: 'Tu as sauvé un jinchūriki de l’Akatsuki.', importance: 3 }],
          },
          echec: {
            texte: 'L’escorte ne te croit pas : un manteau à nuages rouges qui prétend aider, qui le croirait ? Ils t’attaquent. Tu fuis, blessé·e par les deux camps.',
            effets: [{ blessure: { id: 'deux_camps', nom: 'Blessé·e par les deux camps', gravite: 2, jours: 40 } }, { drapeau: 'akatsuki_traitre' }, { planifier: 'ak_traque', dansJours: 200 }],
          },
        },
      },
      {
        id: 'alerter',
        texte: 'Prévenir ton village : c’est pour ça que tu es là',
        si: { drapeau: 'akatsuki_espion' },
        effets: [{ stat: 'social.loyaute', delta: 15 }, { stat: 'social.reputation', delta: 10 }, { drapeau: 'akatsuki_traitre' }, { planifier: 'ak_traque', dansJours: 150 }, { journal: 'Tu as livré à ton village les plans de l’Akatsuki.', importance: 3 }],
        resultat: 'Ton message part la nuit même. Trois jours plus tard, l’enfant est en sécurité, l’escorte a doublé, et l’Akatsuki sait qu’il y a un traître parmi eux. Il ne leur faudra pas longtemps pour savoir lequel.',
      },
    ],
  },
  {
    ...AUBE,
    id: 'ak_chef',
    titre: 'Dans la pluie',
    categorie: 'organisation',
    lieu: 'ame',
    enchaine: true,
    si: { tout: [MEMBRE, { statut: 'deserteur' }, { drapeau: 'akatsuki_traitre', absent: true }] },
    texte:
      'Amegakure, où il pleut toujours. Au sommet d’une tour, un homme aux cheveux roux, le visage percé de tiges noires, te regarde avec des yeux en anneaux concentriques. Une femme aux cheveux bleus se tient à ses côtés, et du papier vole autour d’elle. « Je suis Pain », dit-il. « Ce monde ne connaîtra la paix qu’en connaissant la douleur. Les bêtes sont la clé. Avec elles, une arme qui rendra la guerre impossible. Es-tu avec nous jusqu’au bout ? »',
    choix: [
      {
        id: 'allegeance',
        texte: 'Prêter allégeance : la paix par la terreur, c’est toujours la paix',
        effets: [{ ethique: { ambition: 12, compassion: -8 } }, { stat: 'social.reputationOmbre', delta: 20 }, { fin: 'aube', cause: 'au service de l’Akatsuki' }],
        resultat: 'Il hoche la tête, sans sourire. La pluie redouble. Tu as choisi ton camp pour de bon, et l’histoire, désormais, s’écrira sans toi ou contre toi.',
      },
      {
        id: 'quitter',
        texte: 'Rendre ton anneau',
        effets: [{ drapeau: 'akatsuki_traitre' }, { ethique: { honneur: 6 } }, { planifier: 'ak_traque', dansJours: 90 }],
        resultat: 'Tu poses l’anneau sur la balustrade. Pain ne bouge pas. « Personne ne quitte l’Aube. » Il te laisse partir quand même, sous la pluie. Tu comprends pourquoi en chemin : ce n’est pas lui qui viendra.',
      },
      {
        id: 'defier',
        texte: 'Le défier, ici et maintenant',
        test: {
          type: 'combat',
          difficulte: 74,
          attributs: { agilite: 1, force: 1, perception: 1, controleChakra: 2 },
          maitrises: { ninjutsu: 1, taijutsu: 1 },
          letal: true,
          manches: 4,
          causeMort: 'écrasé·e par Pain, sous la pluie d’Amegakure',
          succes: {
            texte: 'Une onde invisible te repousse, encore et encore, et tu reviens à chaque fois. À la quatrième, Pain baisse la main. « Tu connais la douleur, toi aussi. » Il te laisse partir. Konan te regarde descendre la tour, longtemps.',
            effets: [{ drapeau: 'akatsuki_traitre' }, { stat: 'social.reputation', delta: 20 }, { succes: 'defi_pain' }, { drapeau: 'pain_defie' }, { planifier: 'ak_traque', dansJours: 300 }],
          },
          echec: { texte: 'Il lève à peine la main. Le monde se renverse, et toi avec.', effets: [{ blessure: { id: 'shinra', nom: 'Os brisés par une onde invisible', gravite: 3, jours: 120 } }, { drapeau: 'akatsuki_traitre' }, { planifier: 'ak_traque', dansJours: 120 }] },
        },
      },
    ],
  },
  {
    ...AUBE,
    chapitres: [3, 4, 5, 6],
    id: 'ak_traque',
    titre: 'Les manteaux noirs',
    categorie: 'organisation',
    lieu: 'route_commerce',
    enchaine: true,
    si: { tout: [LIBRE, { un: [{ drapeau: 'akatsuki_traitre' }, { drapeau: 'akatsuki_ennemie' }] }] },
    texte: [
      { texte: 'Deux chapeaux de paille au bout de la route. Deux manteaux noirs aux nuages rouges.' },
      { si: { drapeau: 'akatsuki_traitre' }, texte: '« Personne ne quitte l’Aube », dit Kakuzu. Hidan a déjà commencé à prier.' },
      { si: { tout: [{ drapeau: 'akatsuki_ennemie' }, { drapeau: 'akatsuki_traitre', absent: true }] }, texte: '« Le chef a changé d’avis à ton sujet », dit Kakuzu. « Ta tête vaut quelque chose, maintenant. »' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre',
        test: {
          type: 'combat',
          difficulte: 68,
          attributs: { agilite: 1, force: 1, perception: 1, controleChakra: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 4,
          elementAdverse: 'raiton',
          causeMort: 'traqué·e et tué·e par l’Akatsuki',
          succes: {
            texte: 'Ils sont immortels, ou presque. Toi, tu es simplement plus têtu·e. À l’aube, Hidan est enterré sous un éboulis, toujours en train de jurer, et Kakuzu s’éloigne en tenant ce qui lui reste de cœurs. L’Akatsuki ne t’oubliera pas. Mais elle a appris ton prix.',
            effets: [{ drapeau: 'akatsuki_traque_vaincue' }, { drapeau: 'akatsuki_traitre', retirer: true }, { drapeau: 'akatsuki_ennemie', retirer: true }, { stat: 'social.reputation', delta: 15 }, { succes: 'aube_brisee' }, { journal: 'Tu as vaincu les chasseurs de l’Akatsuki.', importance: 3 }],
          },
          echec: { texte: 'Le combat te dépasse. Tu ne dois ta survie qu’à une rivière en crue où tu te jettes sans réfléchir. Ils reviendront.', effets: [{ blessure: { id: 'traque_aube', nom: 'Blessures de la traque', gravite: 3, jours: 90 } }, { planifier: 'ak_traque', dansJours: 400 }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Fuir, et disparaître pour de bon',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { agilite: 2, discretion: 2 },
          maitrises: { kawarimi: 1 },
          succes: {
            texte: 'Une permutation, un faux cadavre, un nom changé. Pendant des mois, tu n’es plus personne. Ils finiront par te retrouver, mais pas cette année.',
            effets: [{ stat: 'attributs.discretion', delta: 3 }, { planifier: 'ak_traque', dansJours: 900 }],
          },
          echec: {
            texte: 'Kakuzu connaît tous les trucs : il les a tous utilisés avant toi. Ses fils noirs te rattrapent.',
            effets: [{ blessure: { id: 'fils_kakuzu', nom: 'Fils noirs de Kakuzu', gravite: 3, jours: 70 } }, { planifier: 'ak_traque', dansJours: 300 }],
          },
        },
      },
    ],
  },
];
