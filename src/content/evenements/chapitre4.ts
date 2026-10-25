// Chapitre 4 : les années de jōnin (de 19-20 à 28-30 ans).
// Voie du village : une équipe de genin à former, l'arme légendaire de son village, une famille, le traître, la politique propre
// à chaque village, l'examen de ses élèves. Voie de la route : fonder quelque chose à soi.

import type { ChoiceDef, Condition, Effect, EventDef, MissionDef } from '../../engine/types';
import { combatPouvoir, entrainerPouvoir } from './outils';

const base = { chapitre: 4, arc: 'heritage' as const };
const ACTIF: Condition = { statut: 'actif' };
const ROUTE: Condition = { statut: ['errant', 'deserteur', 'exile'] };

/** Fonder un foyer : un enfant naît dans l'année ; les dangers de la vie de famille sont planifiés. */
const FONDER: Effect[] = [
  { drapeau: 'famille_fondee' },
  { hasard: [{ poids: 1, effets: [{ drapeau: 'enfant_genre', valeur: 'f' }] }, { poids: 1, effets: [{ drapeau: 'enfant_genre', valeur: 'm' }] }] },
  { ethique: { compassion: 6 } },
  { stat: 'attributs.controleEmotionnel', delta: 3 },
  { journal: 'Tu fondes une famille.', importance: 3 },
  { succes: 'foyer' },
  { planifier: 'f_premiers_pas', dansJours: 500 },
  { planifier: 'f_quartier', dansJours: 1100 },
  { planifier: 'f_enlevement', dansJours: 1900 },
];

const SUITE_JONIN: Effect[] = [
  { planifier: 'c4_eleves', dansJours: 300 },
  { planifier: 'c4_lame', dansJours: 800 },
  { planifier: 'c4_foyer', dansJours: 1300 },
  { planifier: 'c4_traitre', dansJours: 1900 },
  { planifier: 'c4_village_konoha', dansJours: 2500 },
  { planifier: 'c4_village_suna', dansJours: 2500 },
  { planifier: 'c4_village_kiri', dansJours: 2500 },
  { planifier: 'c4_village_kumo', dansJours: 2500 },
  { planifier: 'c4_village_iwa', dansJours: 2500 },
  { planifier: 'c4_examen_eleves', dansJours: 3000 },
  { planifier: 'cm_deux_camarades', dansJours: 1500 },
  { planifier: 'cm_eleves', dansJours: 2200 },
];

/** L'arme légendaire attachée à chaque village. */
const LAMES: { si: Condition; arme: string; nom: string; lieu: string; recit: string }[] = [
  { si: { village: 'konoha' }, arme: 'shinboku', nom: 'Shinboku', lieu: 'temple_oublie', recit: 'la lame de bois sacré des premiers Hokage, scellée dans un temple de la forêt depuis la fondation' },
  { si: { village: 'suna' }, arme: 'yunagi', nom: 'Yūnagi', lieu: 'cite_ensevelie', recit: 'la lame de verre, perdue sous les sables de la cité ensevelie' },
  { si: { village: 'kiri' }, arme: 'samehada', nom: 'Samehada', lieu: 'cotes_brume', recit: 'l’épée vivante des Sept Épéistes, qui dévore le chakra, échouée avec un navire sur les récifs' },
  { si: { village: 'kumo' }, arme: 'narukami', nom: 'Narukami', lieu: 'montagnes_foudre', recit: 'la lame qui attire la foudre, plantée au sommet du col depuis la mort de son dernier porteur' },
  { si: { village: 'iwa' }, arme: 'ganseki', nom: 'Ganseki', lieu: 'carrieres_terre', recit: 'la masse de pierre des premiers Tsuchikage, murée dans une galerie scellée' },
];

export const MISSIONS_C4: MissionDef[] = [
  {
    id: 's_otage',
    rang: 'S',
    titre: 'L’héritière du daimyō',
    description: 'Libérer la fille du daimyō, enlevée par une organisation de déserteurs. Aucun autre village ne doit savoir que la mission a existé.',
    lieu: 'cotes_brume',
    duree: 16,
    si: { tout: [{ chapitre: 4 }, ACTIF, { rangMin: 'jonin' }, { blessureGrave: false }] },
    recompense: { ryo: 600, reputation: 12 },
    risques: 'Mortels.',
    evenement: 'ms_otage',
  },
  {
    id: 'a_frontiere_nord',
    rang: 'A',
    titre: 'Les éclaireurs disparus',
    description: 'Une équipe d’éclaireurs a disparu au nord. Les derniers messages parlaient d’hommes masqués et d’un navire noir.',
    lieu: 'pays_fer',
    duree: 12,
    si: { tout: [{ chapitre: 4 }, ACTIF, { rangMin: 'chunin' }, { blessureGrave: false }] },
    recompense: { ryo: 320, reputation: 8 },
    risques: 'Inconnus.',
    evenement: 'ma_nord',
  },
];

export const CHAPITRE4: EventDef[] = [
  {
    ...base,
    id: 'c4_ouverture',
    titre: 'Trois enfants',
    categorie: 'promotion',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { rangMin: 'jonin' }, texte: 'On te confie une équipe : trois genin de douze ans qui te regardent comme tu regardais ton propre sensei. L’un est trop sûr de lui, l’autre a peur de tout, la troisième ne dit rien et voit tout.' },
      { si: { rang: ['genin', 'chunin'] }, texte: 'Le village manque de jōnin depuis la guerre. On te confie quand même une équipe : trois genin de douze ans. « Tu n’as pas le gilet, mais tu as survécu. C’est ce qu’on enseigne ici. »' },
      { texte: 'Sur le terrain d’entraînement, il y a un poteau où tu t’es assis·e, enfant. Quelqu’un y a gravé un nom depuis. Peut-être le tien.' },
    ],
    choix: [
      {
        id: 'exigeant',
        texte: 'Être un sensei exigeant, comme on l’a été avec toi',
        effets: [{ drapeau: 'c4_sensei', valeur: 'exigeant' }, { stat: 'attributs.controleEmotionnel', delta: 2 }, ...SUITE_JONIN],
        resultat: 'Premier test au coucher du soleil, comme autrefois. Ils échouent. Ils recommencent. Tu te surprends à sourire.',
      },
      {
        id: 'protecteur',
        texte: 'Les protéger avant tout : tu en as trop enterré',
        effets: [{ drapeau: 'c4_sensei', valeur: 'protecteur' }, { ethique: { compassion: 6 } }, ...SUITE_JONIN],
        resultat: 'Tu leur apprends d’abord à fuir, à se cacher, à revenir. Les autres jōnin se moquent. Tes élèves, eux, seront vivants dans dix ans.',
      },
      {
        id: 'metier',
        texte: 'Refuser l’équipe et te consacrer à ton métier',
        effets: [{ drapeau: 'c4_sensei', valeur: 'aucun' }, { stat: 'social.influence', delta: 4 }, ...SUITE_JONIN],
        resultat: 'On confie les enfants à quelqu’un d’autre. Tu les croises parfois au marché. Ils ne savent pas qu’ils auraient pu être les tiens.',
      },
    ],
  },
  {
    ...base,
    id: 'c4_eleves',
    titre: 'L’élève prodige',
    categorie: 'amitie',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'c4_sensei', egal: 'aucun' }, texte: 'Une gamine de l’équipe que tu as refusée vient frapper à ta porte. Son sensei est mort en mission. Elle te demande de l’entraîner, seulement elle.' },
      { si: { non: { drapeau: 'c4_sensei', egal: 'aucun' } }, texte: 'La plus silencieuse de tes élèves éveille un pouvoir que personne n’attendait, en plein exercice. Elle est plus douée que tu ne l’as jamais été. Elle le sait, et ça lui fait peur.' },
    ],
    choix: [
      {
        id: 'former',
        texte: 'Lui apprendre tout ce que tu sais',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 2, charisme: 1, controleChakra: 1 },
          succes: {
            texte: 'Des mois de travail. Elle apprend vite, tu apprends autant qu’elle : on ne comprend vraiment une technique qu’en l’enseignant.',
            effets: [{ drapeau: 'c4_eleve_formee' }, { entrainer: 'ninjutsu', jours: 60 }, ...entrainerPouvoir(40), { stat: 'attributs.charisme', delta: 2 }],
          },
          echec: {
            texte: 'Tu vas trop vite, elle se brûle les mains sur une technique trop forte pour elle. Elle s’en remet. Toi, plus lentement.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -1 }, { entrainer: 'ninjutsu', jours: 20 }],
          },
        },
      },
      {
        id: 'cadrer',
        texte: 'Lui apprendre d’abord à se contrôler',
        effets: [{ drapeau: 'c4_eleve_formee' }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { compassion: 4 } }],
        resultat: 'Méditation, respiration, patience. Elle déteste ça. Un an plus tard, elle te remercie, sans dire de quoi.',
      },
    ],
  },
  {
    ...base,
    arc: 'heritage',
    id: 'c4_lame',
    titre: 'La lame du village',
    categorie: 'quete_legendaire',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { texte: 'Le {kage} te convoque seul·e, de nuit. « Il existe une arme que ce village a perdue. Les anciens disent qu’elle choisit son porteur. Il est temps que quelqu’un aille lui demander. »' },
      ...LAMES.map((l) => ({ si: l.si, texte: `Il parle de ${l.nom} : ${l.recit}.` })),
    ],
    choix: [
      ...LAMES.map((l): ChoiceDef => ({
        id: `chercher_${l.arme}`,
        texte: `Partir chercher ${l.nom}`,
        si: { tout: [l.si, { non: { arme: l.arme, utilisable: true } }] },
        test: {
          type: 'combat',
          difficulte: 64,
          letal: true,
          causeMort: `mort·e en cherchant ${l.nom}`,
          attributs: { controleEmotionnel: 2, force: 1, perception: 1 },
          maitrises: { arme: 2, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: `Des jours de route, une épreuve que tu ne raconteras jamais tout à fait. À la fin, ${l.nom} est dans ta main, et elle ne te rejette pas. Elle pèse ce que pèse une histoire.`,
            effets: [{ obtenirArme: l.arme }, { decouvrir: `lieu:${l.lieu}` }, { stat: 'social.reputation', delta: 10 }, { succes: 'lame_village' }, ...combatPouvoir()],
          },
          echec: {
            texte: `${l.nom} ne veut pas de toi, pas encore. Tu reviens les mains vides, et blessé·e dans ton orgueil plus que dans ta chair.`,
            effets: [{ stat: 'jauges.sante', delta: -30 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
          },
        },
      })),
      {
        id: 'deja',
        texte: 'Montrer au {kage} la lame que tu portes déjà',
        si: { possedeArmeLegendaire: true },
        effets: [{ stat: 'social.reputation', delta: 6 }, { relation: '@kage', delta: { respect: 10 } }],
        resultat: 'Le {kage} regarde longtemps ta lame. « Alors elle t’a déjà choisi·e. » Il range la carte qu’il voulait te donner.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : certaines armes devraient rester perdues',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Le {kage} hoche la tête, déçu, ou soulagé. Tu ne sais pas lequel.',
      },
    ],
  },
  {
    ...base,
    arc: 'heritage',
    id: 'c4_foyer',
    titre: 'Un foyer',
    categorie: 'romance',
    lieu: '$maison',
    enchaine: true,
    si: ACTIF,
    texte: 'Tu as vingt-quatre ou vingt-cinq ans, et tu te rends compte que tu n’as jamais vécu ailleurs que dans une mission, entre deux missions. Quelqu’un, depuis des mois, t’attend après chacune d’elles avec un bol de soupe et des questions qu’il ne pose pas.',
    choix: [
      {
        id: 'fonder',
        texte: 'Fonder une famille avec elle',
        effets: [{ drapeau: 'conjoint_genre', valeur: 'f' }, ...FONDER],
        resultat: 'Une petite maison au bord du village, et {conjointNom} qui rit de ta façon de plier le linge comme un parchemin de mission. Un an plus tard, des pleurs la nuit : {enfantNom}. Tu découvres une peur que la guerre ne t’avait jamais donnée : celle de ne pas revenir.',
      },
      {
        id: 'fonder_lui',
        texte: 'Fonder une famille avec lui',
        effets: [{ drapeau: 'conjoint_genre', valeur: 'm' }, ...FONDER],
        resultat: 'Une petite maison au bord du village, et {conjointNom} qui rit de ta façon de plier le linge comme un parchemin de mission. Un an plus tard, des pleurs la nuit : {enfantNom}. Tu découvres une peur que la guerre ne t’avait jamais donnée : celle de ne pas revenir.',
      },
      {
        id: 'mission',
        texte: 'Choisir le service, encore',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { ethique: { ambition: 4 } }],
        resultat: 'Tu repars en mission le lendemain. Quand tu reviens, la porte est fermée. Tu comprends. Tu repars.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c4_traitre',
    titre: 'Le traître',
    categorie: 'trahison',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { secret: 'nom_traitre' }, texte: 'Le membre du Conseil dont tu connais le nom depuis l’enfance commet enfin une erreur : un rendez-vous de nuit, aux docks, avec des hommes masqués d’un navire noir.' },
      { si: { non: { secret: 'nom_traitre' } }, texte: 'Une série de missions qui échouent toutes de la même façon. Quelqu’un, très haut dans le village, vend les itinéraires. Tu le suis une nuit jusqu’aux docks, où l’attendent des hommes masqués venus d’un navire noir.' },
    ],
    choix: [
      {
        id: 'affronter',
        texte: 'L’affronter sur place',
        test: {
          type: 'combat',
          manches: 3,
          difficulte: 66,
          letal: true,
          causeMort: 'tué·e aux docks par le traître et ses alliés du Navire noir',
          attributs: { agilite: 2, controleEmotionnel: 1, perception: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Les hommes masqués fuient vers le large. Le traître, lui, ne fuira plus. Tu le ramènes vivant au {kage}, avec les preuves. Le Conseil ne sera plus jamais le même.',
            effets: [{ secret: 'traitre_navire_noir' }, { succes: 'traitre' }, { stat: 'social.reputation', delta: 12 }, { stat: 'social.influence', delta: 10 }, { drapeau: 'traitre_arrete' }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Ils sont trop nombreux. Tu t’en sors de justesse, jeté·e dans l’eau glacée du port. Le traître sait maintenant que tu sais.',
            effets: [{ blessure: { id: 'docks', nom: 'Plaies et hypothermie', gravite: 2, jours: 60 } }, { stat: 'social.suspicion', delta: 10 }],
          },
        },
      },
      {
        id: 'suivre',
        texte: 'Le laisser partir pour remonter jusqu’au Navire noir',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { discretion: 3, perception: 1 },
          succes: {
            texte: 'Trois nuits à le suivre. Tu découvres une organisation entière : des déserteurs de tous les villages, une flotte, un chef qu’on appelle l’Amiral. Ce que tu sais vaut plus qu’un traître arrêté.',
            effets: [{ secret: 'traitre_navire_noir' }, { drapeau: 'connait_amiral' }, { stat: 'social.reputationOmbre', delta: 12 }],
          },
          echec: {
            texte: 'Tu perds sa trace en mer. Quand tu reviens, il siège toujours au Conseil, et il te sourit.',
            effets: [{ stat: 'social.suspicion', delta: 8 }],
          },
        },
      },
    ],
  },
  ...politiqueParVillage(),
  {
    ...base,
    id: 'c4_examen_eleves',
    titre: 'Leur examen',
    categorie: 'examen',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: [
      { texte: 'Tes élèves passent l’examen de chūnin. Tu es dans la tribune des sensei, à l’endroit exact où se tenait le tien. Tu comprends enfin pourquoi il ne disait rien : on ne peut rien dire.' },
      { si: { drapeau: 'c4_eleve_formee' }, texte: 'Ta prodige affronte au tournoi un genin d’un autre village. Elle te cherche des yeux avant le premier coup.' },
    ],
    choix: [
      {
        id: 'regarder',
        texte: 'Les regarder, sans intervenir',
        effets: [
          { hasard: [
            { poids: 2, effets: [{ drapeau: 'eleves_chunin' }, { stat: 'social.reputation', delta: 8 }, { journal: 'Tes élèves deviennent chūnin.', importance: 3 }] },
            { poids: 1, effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { journal: 'Tes élèves échouent à l’examen. Ils réessaieront.', importance: 2 }] },
          ] },
          { drapeau: 'chapitre4_pret' },
        ],
        resultat: 'Quand c’est fini, l’un d’eux vient s’asseoir à côté de toi, sans rien dire, et pose la tête sur ton épaule. Tu as compris ce qu’est un sensei.',
      },
    ],
  },
  {
    ...base,
    id: 'c4_fin',
    titre: 'Le gilet usé',
    categorie: 'epilogue',
    lieu: '$village',
    priorite: 30,
    si: { tout: [ACTIF, { un: [{ tout: [{ vu: 'c4_examen_eleves' }, { age: { min: 30 } }] }, { age: { min: 33 } }] }] },
    texte: [
      { texte: 'Tes élèves ont des élèves. Tes cicatrices ont des cicatrices. Le village a changé autour de toi sans te demander ton avis, comme le font les villages.' },
      { si: { drapeau: 'famille_fondee' }, texte: 'Le soir, un enfant te demande de raconter la guerre. Tu racontes autre chose.' },
      { si: { possedeArmeLegendaire: true }, texte: 'Ta lame légendaire repose à côté de la porte, comme un vieux chien qui attend.' },
      { si: { drapeau: 'traitre_arrete' }, texte: 'Depuis l’arrestation du traître, le Conseil te consulte avant chaque décision importante. Tu ne l’as pas demandé.' },
    ],
    choix: [
      {
        id: 'servir',
        texte: 'Continuer à servir, aussi longtemps qu’il le faudra',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { drapeau: 'chapitre4_fini' }, { fin: 'chapitre_4' }],
        resultat: 'On t’appelle « l’ancien » dans les couloirs de la tour. Tu as trente ans. Les ninjas vieillissent vite.',
      },
      {
        id: 'ambition',
        texte: 'Viser plus haut : le siège du {kage}',
        effets: [{ ethique: { ambition: 8 } }, { stat: 'social.influence', delta: 6 }, { drapeau: 'vise_kage' }, { drapeau: 'chapitre4_fini' }, { fin: 'chapitre_4' }],
        resultat: 'Tu ne le dis à personne. Mais tu commences à regarder la tour autrement.',
      },
    ],
  },
  {
    ...base,
    id: 'ms_otage',
    titre: 'L’héritière du daimyō',
    categorie: 'mission',
    lieu: 'cotes_brume',
    enchaine: true,
    si: { mission: 's_otage', statut: 'en_cours' },
    texte: 'Un fort sur un îlot des côtes de la Brume. Trente déserteurs, et une jeune fille de quinze ans enfermée dans une tour. Tu as une nuit, une barque, et aucun renfort.',
    choix: [
      {
        id: 'assaut',
        texte: 'Un assaut éclair',
        test: {
          type: 'combat',
          difficulte: 68,
          letal: true,
          causeMort: 'tombé·e sur un îlot des côtes de la Brume, dans une mission qui n’a jamais existé',
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 2, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'À l’aube, la barque repart avec deux passagers. Le fort brûle derrière vous. Le daimyō ne saura jamais ton nom, mais ton village recevra une fortune.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { stat: 'social.reputationOmbre', delta: 10 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu la sauves, mais ils te reconnaissent. Il te faudra des mois pour guérir, et le monde sait désormais qui a fait ça.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { blessure: { id: 'ilot', nom: 'Blessures graves', gravite: 3, jours: 100 } }],
          },
        },
      },
      {
        id: 'infiltration',
        texte: 'Entrer sans être vu·e, sortir sans être vu·e',
        test: {
          type: 'competence',
          difficulte: 66,
          letal: true,
          causeMort: 'démasqué·e dans le fort de l’îlot',
          attributs: { discretion: 3, perception: 1 },
          succes: {
            texte: 'Les déserteurs découvrent la tour vide au matin. Ils ne sauront jamais comment. Toi non plus, à vrai dire : tu as eu de la chance, et du talent.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { stat: 'attributs.discretion', delta: 2 }],
          },
          echec: {
            texte: 'Une marche qui grince. Tu dois te battre pour sortir, et la jeune fille est blessée dans la fuite.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { stat: 'jauges.sante', delta: -35 }],
          },
        },
      },
      {
        id: 'eau',
        texte: 'Laisser la barque et traverser jusqu’à la tour en marchant sur l’eau',
        si: { maitrise: 'suimen', palierMin: 1 },
        verrou: 'Il faudrait savoir marcher sur l’eau.',
        indice: 'Les sentinelles surveillent les barques, pas la mer.',
        test: {
          type: 'competence',
          difficulte: 54,
          letal: true,
          causeMort: 'noyé·e en traversant vers le fort de l’îlot',
          attributs: { controleChakra: 2, discretion: 2 },
          maitrises: { suimen: 2, kinobori: 1 },
          succes: {
            texte: 'Tu cours sur la mer noire, entre les rochers, là où aucune barque ne passe. Tu remontes la tour par l’extérieur, les pieds collés à la pierre. La jeune fille s’accroche à ton dos, et vous redescendez tous les deux sur l’eau.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { stat: 'attributs.controleChakra', delta: 2 }, { stat: 'social.reputation', delta: 4 }],
          },
          echec: {
            texte: 'La houle te fait perdre l’équilibre à mi-chemin. Tu nages jusqu’au fort, gelé·e, et c’est à mains nues que tu ouvres la porte de la tour.',
            effets: [{ mission: 's_otage', statut: 'reussie' }, { stat: 'jauges.sante', delta: -25 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'ma_nord',
    titre: 'Les éclaireurs disparus',
    categorie: 'mission',
    lieu: 'pays_fer',
    enchaine: true,
    si: { mission: 'a_frontiere_nord', statut: 'en_cours' },
    texte: 'Tu retrouves les éclaireurs dans une grotte, vivants mais enchaînés. Leurs geôliers portent un tatouage d’ancre noire. Leur chef parle d’un « Amiral » et d’une flotte qui attend le bon moment.',
    choix: [
      {
        id: 'liberer',
        texte: 'Libérer les éclaireurs',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'tombé·e dans une grotte du Pays du Fer',
          attributs: { agilite: 2, force: 1, perception: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Tu ramènes les cinq éclaireurs et un prisonnier qui parle. Le mot « Navire noir » remonte jusqu’au {kage}.',
            effets: [{ mission: 'a_frontiere_nord', statut: 'reussie' }, { drapeau: 'connait_amiral' }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu ramènes trois éclaireurs sur cinq. Les geôliers ont disparu.',
            effets: [{ mission: 'a_frontiere_nord', statut: 'reussie' }, { stat: 'jauges.sante', delta: -25 }],
          },
        },
      },
    ],
  },

  // ───────── La route : bâtir quelque chose ─────────
  {
    ...base,
    id: 'c4r_ouverture',
    titre: 'Ce qu’on bâtit',
    categorie: 'organisation',
    lieu: 'marche_noir',
    enchaine: true,
    si: ROUTE,
    texte: 'Tu as vingt ans passés, une réputation, et des gens qui te suivent sans que tu le leur aies demandé : des orphelins de guerre, des déserteurs fatigués, des ninjas sans village. Il est temps de décider ce que tu fais d’eux.',
    choix: [
      {
        id: 'compagnie',
        texte: 'Fonder une compagnie de mercenaires',
        effets: [{ drapeau: 'c4r_compagnie' }, { stat: 'jauges.ryo', delta: 200 }, { stat: 'social.reputationOmbre', delta: 10 }, { planifier: 'c4r_epreuve', dansJours: 900 }],
        resultat: 'Une bannière, un nom, des contrats. En un an, ta compagnie devient la plus redoutée des routes.',
      },
      {
        id: 'village',
        texte: 'Fonder un petit village caché',
        effets: [{ drapeau: 'c4r_village' }, { ethique: { compassion: 8 } }, { stat: 'attributs.charisme', delta: 3 }, { planifier: 'c4r_epreuve', dansJours: 900 }],
        resultat: 'Une vallée cachée, quelques maisons, une école en plein air où tu apprends aux enfants ce qu’aucune Académie ne t’a appris.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c4r_epreuve',
    titre: 'Ceux qui viennent',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ROUTE,
    texte: 'Un grand village envoie une escouade de jōnin pour en finir avec ce que tu as bâti. Ils ne viennent pas négocier.',
    choix: [
      {
        id: 'defendre',
        texte: 'Défendre ce qui est à toi',
        test: {
          type: 'combat',
          difficulte: 66,
          letal: true,
          causeMort: 'tombé·e en défendant ce que tu avais bâti',
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'L’escouade repart. Ce que tu as bâti tient. Les grands villages commencent à te traiter non plus comme un hors-la-loi, mais comme un voisin.',
            effets: [{ drapeau: 'c4r_reconnu' }, { stat: 'social.reputation', delta: 12 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu sauves les tiens, mais pas les murs. Tout est à refaire, ailleurs.',
            effets: [{ blessure: { id: 'epreuve_route', nom: 'Blessures de la défense', gravite: 2, jours: 70 } }],
          },
        },
      },
      {
        id: 'traiter',
        texte: 'Négocier un traité',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { charisme: 3, intellect: 1 },
          succes: {
            texte: 'Une nuit de pourparlers. À l’aube, un traité : tu restes libre, en échange de quelques services. C’est plus que ce qu’aucun déserteur a jamais obtenu.',
            effets: [{ drapeau: 'c4r_reconnu' }, { stat: 'social.influence', delta: 10 }],
          },
          echec: {
            texte: 'Ils ne t’écoutent pas. Tu fuis avec les tiens avant l’assaut.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'c4r_fin',
    titre: 'Un nom à toi',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    priorite: 30,
    si: { tout: [ROUTE, { un: [{ tout: [{ vu: 'c4r_epreuve' }, { age: { min: 30 } }] }, { age: { min: 33 } }] }] },
    texte: 'On ne t’appelle plus « le ninja sans village ». On t’appelle par ton nom, et on sait ce qu’il veut dire.',
    choix: [
      {
        id: 'continuer',
        texte: 'Regarder ce que tu as construit',
        effets: [{ drapeau: 'chapitre4_fini' }, { fin: 'chapitre_4_route' }],
        resultat: 'Ce n’est pas un village caché. Ce n’est pas rien non plus.',
      },
    ],
  },
];

/** La politique de chaque village, dix ans après la guerre. */
function politiqueParVillage(): EventDef[] {
  const ev = (id: string, village: string, titre: string, texte: string, choix: EventDef['choix']): EventDef => ({
    ...base,
    arc: 'crise',
    id,
    titre,
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, { village: village as 'konoha' }] },
    personnages: ['@kage'],
    texte,
    choix,
  });
  const appui = (succes: string, echec: string): EventDef['choix'][number]['test'] => ({
    type: 'competence',
    difficulte: 62,
    attributs: { charisme: 2, intellect: 2 },
    succes: { texte: succes, effets: [{ stat: 'social.influence', delta: 12 }, { stat: 'social.reputation', delta: 6 }] },
    echec: { texte: echec, effets: [{ stat: 'social.influence', delta: -4 }] },
  });
  return [
    ev('c4_village_konoha', 'konoha', 'Le Conseil des anciens', 'Le Hokage vieillit, et le Conseil des anciens gouverne de plus en plus à sa place. Un de ses membres propose de créer une unité de l’ombre qui n’obéirait qu’au Conseil, pas au Hokage.', [
      { id: 'contre', texte: 'T’opposer publiquement au projet', test: appui('Ton discours devant les jōnin fait basculer le vote. L’unité ne verra jamais le jour. Le Conseil perd son principal levier.', 'Le projet passe. On te retire de deux missions sans explication.') },
      { id: 'pour', texte: 'Soutenir le Conseil', effets: [{ stat: 'social.reputationOmbre', delta: 10 }, { ethique: { ambition: 6 } }], resultat: 'On te propose de diriger l’unité. Tu as désormais des hommes qui n’existent pas.' },
    ]),
    ev('c4_village_suna', 'suna', 'La route de l’eau', 'Suna veut construire un aqueduc depuis la source du désert. Il faudrait traverser un territoire que réclame le Pays de la Rivière, et le daimyō du Vent refuse de payer.', [
      { id: 'negocier', texte: 'Négocier avec le Pays de la Rivière', test: appui('Six mois de pourparlers, un accord : de l’eau contre la protection de Suna. Les enfants du village ne connaîtront pas la soif.', 'La négociation échoue. L’aqueduc attendra une autre génération.') },
      { id: 'force', texte: 'Construire de force, et défendre le chantier', effets: [{ stat: 'social.loyaute', delta: 6 }, { stat: 'social.reputation', delta: 4 }, { ethique: { honneur: -3 } }], resultat: 'L’aqueduc est construit sous la garde de tes hommes. La Rivière ne l’oubliera pas.' },
    ]),
    ev('c4_village_kiri', 'kiri', 'L’après-Brume', 'La Brume sanglante est finie, mais les familles des victimes des purges réclament justice contre ceux qui ont exécuté les ordres. Certains d’entre eux sont tes amis. Peut-être toi.', [
      { id: 'verite', texte: 'Soutenir une commission de vérité', test: appui('La commission entend tout le monde, bourreaux compris. Kiri apprend à se regarder en face. On dit que c’est le début d’un autre village.', 'La commission tourne à la chasse aux sorcières. Tu dois protéger des innocents des deux côtés.') },
      { id: 'oubli', texte: 'Défendre l’amnistie pour tous', effets: [{ stat: 'social.loyaute', delta: 6 }, { ethique: { compassion: -3 } }], resultat: 'L’amnistie passe. Les familles se taisent. Les rancunes, non.' },
    ]),
    ev('c4_village_kumo', 'kumo', 'Le Raikage vieillissant', 'Le Raikage ne lâche rien, même malade. Il veut une nouvelle guerre pour mourir en guerrier. Ses conseillers ont peur de le contredire.', [
      { id: 'dissuader', texte: 'Le dissuader, en face', test: appui('Tu lui parles comme personne n’ose lui parler. Il te jette par la fenêtre de son bureau, puis te fait appeler le lendemain. Il n’y aura pas de guerre.', 'Il ne veut rien entendre. Tu passes un mois aux arrêts.') },
      { id: 'preparer', texte: 'Préparer le village à la guerre qu’il veut', effets: [{ stat: 'social.loyaute', delta: 8 }, { ethique: { ambition: 4 } }], resultat: 'Kumo se prépare. Le Raikage meurt avant d’avoir pu la déclarer, et son successeur te garde à ses côtés.' },
    ]),
    ev('c4_village_iwa', 'iwa', 'La succession de pierre', 'Le Tsuchikage veut abdiquer et désigner son successeur. Deux candidats : sa petite-fille, brillante et impulsive, et un vieux jōnin prudent jusqu’à la lâcheté.', [
      { id: 'jeune', texte: 'Soutenir la petite-fille', test: appui('Elle devient Tsuchikage à vingt-six ans. Elle n’oublie pas ceux qui ont cru en elle.', 'Le vieux jōnin l’emporte. Tu as choisi le mauvais camp.') },
      { id: 'vieux', texte: 'Soutenir le vieux jōnin', effets: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'social.influence', delta: 4 }], resultat: 'Le vieux jōnin gouverne sans éclat et sans guerre. C’est peut-être ce qu’il fallait.' },
    ]),
  ];
}


/** Rencontres du temps libre pour les adultes (chapitres 4 et 5). */
const ADULTE = { chapitre: 4, arc: 'apres_guerre' as const, chapitres: [4, 5, 6] };
export const ALEATOIRES_ADULTES: EventDef[] = [
  {
    ...ADULTE,
    id: 'x_vieux_camarade',
    titre: 'Un vieux camarade',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    repetable: { delaiJours: 900, max: 3 },
    si: { age: { min: 20 } },
    texte: 'Dans une gargote près des portes, un homme te fait signe. Vous avez tenu une tranchée ensemble pendant la guerre. Il a perdu un bras, pas son rire.',
    choix: [
      { id: 'boire', texte: 'Boire avec lui jusqu’à la fermeture', effets: [{ stat: 'jauges.fatigue', delta: 10 }, { stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: 'Vous racontez les mêmes histoires que la dernière fois, en changeant les fins. C’est la meilleure soirée du mois.' },
      { id: 'aider', texte: 'Lui trouver un travail au village', effets: [{ ethique: { compassion: 4 } }, { stat: 'social.influence', delta: 2 }], resultat: 'Il devient instructeur de lancer à l’Académie. Les enfants l’adorent. Il ne rate jamais une cible de la main gauche.' },
    ],
  },
  {
    ...ADULTE,
    id: 'x_jeune_insolent',
    titre: 'Le jeune insolent',
    categorie: 'rivalite',
    lieu: '$terrain',
    poids: 4,
    repetable: { delaiJours: 700, max: 3 },
    si: { age: { min: 22 } },
    texte: 'Un genin de quinze ans te défie devant tout le terrain d’entraînement. Il a entendu parler de toi et il veut prouver que les légendes vieillissent.',
    choix: [
      {
        id: 'lecon',
        texte: 'Lui donner une leçon',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { agilite: 2, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          succes: { texte: 'Trois secondes. Il se relève, rouge, puis te demande de lui apprendre comment tu as fait.', effets: [{ stat: 'social.reputation', delta: 2 }, { combatSur: ['taijutsu'] }] },
          echec: { texte: 'Il te touche une fois. Tout le terrain l’a vu. Tu ris, et tu le prends au sérieux.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
      { id: 'refuser', texte: 'Refuser avec un sourire', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }], resultat: '« Reviens dans dix ans. » Il reviendra. Ils reviennent toujours.' },
    ],
  },
  {
    ...ADULTE,
    id: 'x_ancienne_blessure',
    titre: 'L’ancienne blessure',
    categorie: 'blessure',
    lieu: '$maison',
    poids: 3,
    repetable: { delaiJours: 1000, max: 2 },
    si: { age: { min: 26 } },
    texte: 'Un matin d’hiver, une vieille blessure se réveille. Ta jambe refuse de te porter jusqu’à la porte.',
    choix: [
      { id: 'repos', texte: 'Te reposer, enfin', effets: [{ stat: 'jauges.fatigue', delta: -40 }, { temps: 30 }], resultat: 'Un mois de repos forcé. Tu lis les rapports de mission des autres, et tu découvres que le village tourne sans toi. Ça te vexe un peu.' },
      { id: 'ignorer', texte: 'Serrer les dents et continuer', effets: [{ stat: 'jauges.sante', delta: -15 }, { stat: 'attributs.force', delta: 1 }], resultat: 'Tu boites pendant une semaine, puis plus. Le corps oublie. Il n’oublie jamais tout à fait.' },
    ],
  },
  {
    ...ADULTE,
    id: 'x_rouleau_interdit',
    titre: 'Le rouleau du colporteur',
    categorie: 'arsenal',
    lieu: 'marche_noir',
    poids: 3,
    repetable: { delaiJours: 1200, max: 2 },
    si: { tout: [{ age: { min: 20 } }, { stat: 'jauges.ryo', min: 150 }] },
    texte: 'Un colporteur te propose, à voix basse, un rouleau de technique volé dans les archives d’un autre village. Cent cinquante ryō. Il jure qu’il est authentique.',
    choix: [
      { id: 'acheter', texte: 'L’acheter', effets: [{ stat: 'jauges.ryo', delta: -150 }, { entrainer: 'ninjutsu', jours: 60 }, { stat: 'social.suspicion', delta: 3 }], resultat: 'Il est authentique. Tu passes des nuits à le déchiffrer. Ton ninjutsu y gagne quelque chose que tu ne sais pas nommer.' },
      { id: 'denoncer', texte: 'Le dénoncer aux gardes', effets: [{ stat: 'social.loyaute', delta: 3 }, { ethique: { honneur: 3 } }], resultat: 'Les gardes l’emmènent. Le rouleau retourne à son village, avec une lettre de remerciements à ton nom.' },
    ],
  },
];
