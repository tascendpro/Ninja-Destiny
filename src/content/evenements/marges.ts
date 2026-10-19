// Ceux qu'on ne regarde pas : les sans-nom, les orphelins, les jinchūriki. Et ceux dont les yeux changent le monde :
// les cellules Senju, la liaison des deux sangs, l'éveil du Rinnegan.

import type { Condition, EventDef } from '../../engine/types';
import { combatPouvoir } from './outils';

const base = { chapitre: 1, arc: 'origines' as const };
const SANS_CLAN: Condition = { clan: 'sans_clan' };
const ORPHELIN: Condition = { drapeau: 'orphelin' };
const JINCHURIKI: Condition = { drapeau: 'jinchuriki' };
const ACTIF: Condition = { statut: 'actif' };
const TOUS = [1, 2, 3, 4, 5, 6];

export const MARGES: EventDef[] = [
  // ───────── Les sans-nom ─────────
  {
    ...base,
    id: 'm_sans_nom',
    titre: 'Sans-nom',
    categorie: 'academie',
    lieu: '$academie',
    poids: 4,
    chapitres: [1],
    si: { tout: [SANS_CLAN, ACTIF, { rang: 'eleve' }, { age: { min: 7, max: 11 } }] },
    personnages: ['@rival'],
    texte: [
      { texte: 'Pendant l’appel, l’instructeur dit chaque nom de famille. Arrivé à toi, il marque une pause, puis dit seulement ton prénom. {@rival} ricane : « Sans-nom. » Le mot fait le tour de la classe avant midi.' },
      { si: ORPHELIN, texte: 'À l’orphelinat, on t’a appris à ne pas répondre. Ce n’est pas la même chose que de ne pas avoir mal.' },
    ],
    choix: [
      { id: 'repondre', texte: '« Mon nom, je le gagnerai. Toi, on te l’a donné. »', effets: [{ stat: 'attributs.charisme', delta: 2 }, { relation: '@rival', delta: { rivalite: 8, respect: 4 } }, { drapeau: 'veut_un_nom' }], resultat: 'La classe se tait. {@rival} rougit. Ce soir-là, tu écris ta phrase sur le mur de ta chambre, pour ne pas l’oublier.' },
      { id: 'travailler', texte: 'Ne rien dire, et être meilleur·e que tous', effets: [{ entrainer: 'taijutsu', jours: 20 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'veut_un_nom' }], resultat: 'Tu t’entraînes jusqu’à la nuit, tous les soirs de la semaine. Le mot ne disparaît pas. Il te pousse.' },
    ],
  },
  {
    ...base,
    id: 'm_orphelinat',
    titre: 'Les petits',
    categorie: 'civils',
    lieu: '$village',
    poids: 4,
    repetable: { delaiJours: 720, max: 3 },
    chapitres: [1, 2, 3, 4],
    si: { tout: [ORPHELIN, ACTIF, { age: { min: 11 } }] },
    texte: 'Tu repasses devant l’orphelinat. La directrice a vieilli ; les petits, eux, sont toujours petits, et toujours trop nombreux. L’un d’eux porte un bandeau de papier qu’il a fabriqué lui-même.',
    choix: [
      { id: 'donner', texte: 'Leur laisser une partie de ta paie (40 ryō)', si: { stat: 'jauges.ryo', min: 40 }, verrou: 'Tu n’as pas 40 ryō à donner.', effets: [{ stat: 'jauges.ryo', delta: -40 }, { ethique: { compassion: 6 } }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'soutien_orphelinat', incr: 1 }], resultat: 'La directrice prend l’argent sans rien dire et te serre la main trop longtemps. Le soir, les petits mangent de la viande.' },
      { id: 'enseigner', texte: 'Passer l’après-midi à leur apprendre à lancer un kunai', effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { compassion: 4 } }, { drapeau: 'soutien_orphelinat', incr: 1 }], resultat: 'Ils ratent tout, puis presque tout. Le garçon au bandeau de papier touche la cible une fois. Il ne te lâche plus la main.' },
      { id: 'passer', texte: 'Passer ton chemin : tu n’y retourneras pas', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: 'Tu accélères le pas. Certaines portes, on les franchit une fois et plus jamais.' },
    ],
  },
  {
    ...base,
    arc: 'heritage',
    id: 'm_fonder_nom',
    titre: 'Un nom à fonder',
    categorie: 'heritage',
    lieu: '$maison',
    priorite: 31,
    chapitres: [4, 5],
    si: { tout: [SANS_CLAN, ACTIF, { drapeau: 'nom_fonde', absent: true }, { age: { min: 24 } }, { un: [{ drapeau: 'veut_un_nom' }, { drapeau: 'famille_fondee' }, { rangMin: 'jonin' }] }] },
    texte: [
      { texte: 'Au bureau de l’état civil du village, un vieux scribe te tend un registre. « Les jōnin sans nom peuvent en fonder un. Vos enfants le porteront, et les leurs. Choisissez bien : un nom, c’est une promesse qu’on fait à des gens qui ne sont pas encore nés. »' },
      { si: { drapeau: 'veut_un_nom' }, texte: 'Tu repenses à la classe, au mot qui faisait le tour des bancs. Sans-nom.' },
    ],
    choix: [
      { id: 'kurogane', texte: 'Kurogane, « l’acier noir » : ce que la vie a fait de toi', effets: [{ nomDeFamille: 'Kurogane' }, { stat: 'social.reputation', delta: 4 }, { succes: 'nom_fonde' }], resultat: 'Le scribe trace les caractères lentement. L’encre sèche. Tu as un nom.' },
      { id: 'tsukishiro', texte: 'Tsukishiro, « le château de lune » : un abri pour ceux qui viendront', effets: [{ nomDeFamille: 'Tsukishiro' }, { ethique: { compassion: 3 } }, { succes: 'nom_fonde' }], resultat: 'Un château pour personne, pour l’instant. Tu le rempliras.' },
      { id: 'kazehana', texte: 'Kazehana, « la fleur du vent » : léger, et qui va partout', effets: [{ nomDeFamille: 'Kazehana' }, { stat: 'attributs.charisme', delta: 1 }, { succes: 'nom_fonde' }], resultat: 'Le scribe sourit. « Joli. On s’en souviendra. »' },
      { id: 'refuser', texte: 'Garder ton seul prénom : il a suffi jusqu’ici', effets: [{ drapeau: 'nom_fonde', valeur: 'aucun' }, { stat: 'attributs.controleEmotionnel', delta: 2 }], resultat: 'Tu refermes le registre. Ton prénom a traversé une guerre. Il traversera le reste.' },
    ],
  },

  // ───────── Jinchūriki ─────────
  {
    ...base,
    id: 'm_jinchuriki_peur',
    titre: 'La boutique fermée',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 5,
    repetable: { delaiJours: 600, max: 3 },
    chapitres: [1, 2, 3],
    si: { tout: [JINCHURIKI, ACTIF, { vu: 'b_revelation' }] },
    texte: [
      { texte: 'Le marchand de légumes baisse son rideau en te voyant arriver. Une mère tire son enfant par le bras. Quelqu’un a écrit un mot sur ta porte pendant la nuit : « Monstre ».' },
      { si: SANS_CLAN, texte: 'Personne ne viendra le laver pour toi. Personne n’est jamais venu.' },
      { si: { non: SANS_CLAN }, texte: 'Ton clan fait laver la porte avant midi, sans un mot. Il ne fait rien d’autre.' },
    ],
    choix: [
      { id: 'effacer', texte: 'Effacer le mot toi-même, et sourire au marchand demain', effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.reputation', delta: 2 }, { ethique: { compassion: 3 } }], resultat: 'Le lendemain, le rideau reste baissé. Le surlendemain, il se lève à moitié. Il faudra des années. Tu en as.' },
      { id: 'colere', texte: 'Laisser la bête gronder, juste un peu', effets: [{ stat: 'social.suspicion', delta: 6 }, { entrainer: 'chakra_biju', jours: 20 }, { stat: 'attributs.controleEmotionnel', delta: -2 }], resultat: 'Tes yeux changent de couleur une seconde. La rue se vide. C’est exactement ce qu’ils attendaient de toi, et tu le sais.' },
      { id: 'refuge', texte: 'Aller voir la seule personne qui n’a jamais eu peur', effets: [{ relation: '@coequipierA', delta: { amitie: 8, confiance: 6 } }], resultat: '{@coequipierA} t’ouvre sans poser de question, te tend un bol de riz et s’assoit à côté de toi. Vous ne parlez pas de la porte.' },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'm_jinchuriki_arme',
    titre: 'L’arme du village',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    priorite: 34,
    chapitres: [3],
    si: { tout: [JINCHURIKI, ACTIF, { vu: 'c3_premier_front' }] },
    personnages: ['@kage'],
    texte: [
      { texte: 'Un ordre scellé du {kage} : tu partiras seul·e vers la vallée où l’ennemi masse ses troupes. Pas d’unité, pas de soutien. « Laisse sortir la bête. Le village assumera. »' },
      { si: SANS_CLAN, texte: 'Personne au conseil n’a protesté. Personne ne proteste jamais pour un sans-nom.' },
    ],
    choix: [
      {
        id: 'liberer',
        texte: 'Obéir, et libérer la bête',
        test: {
          type: 'combat',
          difficulte: 58,
          letal: true,
          manches: 3,
          causeMort: 'consumé·e par la bête, seul·e dans une vallée de la frontière',
          attributs: { controleEmotionnel: 3, controleChakra: 1 },
          maitrises: { chakra_biju: 3 },
          succes: { texte: 'Quand tu reprends conscience, la vallée n’a plus d’arbres, et l’armée ennemie n’existe plus. On te ramène sur une civière. Dans les couloirs de la tour, on t’appelle désormais « l’arme ». Pas par ton nom.', effets: [{ stat: 'social.reputation', delta: 10 }, { stat: 'social.suspicion', delta: 10 }, { entrainer: 'chakra_biju', jours: 60 }, ...combatPouvoir()] },
          echec: { texte: 'La bête prend tout. Tu te réveilles trois jours plus tard, enchaîné·e dans une salle de sceaux, avec le souvenir de cris qui n’étaient pas les tiens.', effets: [{ stat: 'jauges.sante', delta: -40 }, { stat: 'social.suspicion', delta: 15 }] },
        },
      },
      { id: 'refuser', texte: 'Refuser : tu n’es pas une arme', effets: [{ stat: 'social.loyaute', delta: -10 }, { ethique: { honneur: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }], resultat: 'On te met aux arrêts pour un mois. Puis on te renvoie au front, avec une unité, comme tout le monde. C’est une petite victoire. Tu la gardes.' },
      { id: 'negocier', texte: 'Accepter, contre une promesse : qu’on te traite enfin comme les autres', effets: [{ stat: 'social.influence', delta: 6 }, { promesse: 'respect_jinchuriki', pnj: '@kage', texte: 'Que le village cesse de te traiter comme une bête.' }, { entrainer: 'chakra_biju', jours: 40 }], resultat: 'Le {kage} accepte, du bout des lèvres. Tu pars vers la vallée. Ce que tu y fais, tu ne le racontes à personne.' },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'm_chasseurs_biju',
    titre: 'Les chasseurs de bêtes',
    categorie: 'guerre',
    lieu: 'route_commerce',
    poids: 3,
    repetable: { delaiJours: 1500, max: 2 },
    chapitres: [4, 5, 6],
    si: { tout: [JINCHURIKI, { maitrise: 'chakra_biju', eveille: true }] },
    texte: 'Deux silhouettes en manteau noir, une ancre de fer brodée au col. Ils ne te veulent pas, toi : ils veulent ce qui dort en toi. « L’Amiral collectionne les bêtes. Viens de toi-même, l’extraction sera moins douloureuse. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Les affronter, toi et la bête ensemble',
        test: {
          type: 'combat',
          difficulte: 64,
          letal: true,
          manches: 3,
          causeMort: 'tué·e par les chasseurs du Navire noir, qui ont emporté la bête',
          attributs: { controleEmotionnel: 2, agilite: 1, controleChakra: 1 },
          maitrises: { chakra_biju: 2, arme: 1, ninjutsu: 1 },
          succes: { texte: 'Pour la première fois, la bête et toi frappez ensemble, sans vous disputer le corps. Les chasseurs fuient. Au fond de toi, une voix grave rit, satisfaite.', effets: [{ drapeau: 'accord_biju' }, { entrainer: 'chakra_biju', jours: 60 }, { drapeau: 'connait_amiral' }, ...combatPouvoir()] },
          echec: { texte: 'Ils t’ont presque eu·e. Tu t’échappes dans une rivière glacée, le sceau fissuré, la bête furieuse.', effets: [{ stat: 'jauges.sante', delta: -35 }, { drapeau: 'sceau_fissure' }] },
        },
      },
      { id: 'fuir', texte: 'Fuir vers le village le plus proche', effets: [{ stat: 'jauges.fatigue', delta: 30 }, { drapeau: 'connait_amiral' }], resultat: 'Tu cours deux jours sans t’arrêter. Ils ne te suivent pas dans le village. Ils savent attendre.' },
    ],
  },

  // ───────── Cellules Senju et Rinnegan ─────────
  {
    ...base,
    arc: 'heritage',
    id: 'm_cellules_senju',
    titre: 'Les cellules du Premier',
    categorie: 'organisation',
    lieu: 'marche_noir',
    poids: 0.6,
    rare: true,
    chapitres: [3, 4, 5, 6],
    si: { tout: [{ age: { min: 16 } }, { drapeau: 'cellules_senju', absent: true }, { non: { clan: 'senju' } }] },
    texte: [
      { texte: 'Le médecin déchu qui exerce au fond d’une ruelle de Kōsai te montre une fiole au liquide verdâtre. « Des cellules régénératrices. On dit qu’elles viennent du corps du Premier Hokage lui-même. Elles referment les plaies, elles élargissent la réserve de chakra… et parfois, elles font pousser des choses étranges. »' },
      { si: { maitrise: 'sharingan', eveille: true }, texte: 'Quand il voit ton Sharingan, sa main tremble. « Ça, ça, je ne l’ai jamais essayé. »' },
    ],
    choix: [
      { id: 'acheter', texte: 'Payer l’injection (1 200 ryō)', si: { stat: 'jauges.ryo', min: 1200 }, verrou: 'Il te faudrait 1 200 ryō.', effets: [{ stat: 'jauges.ryo', delta: -1200 }, { drapeau: 'cellules_senju' }, { stat: 'jauges.chakraMax', delta: 25 }, { stat: 'jauges.sante', delta: 20 }, { stat: 'social.suspicion', delta: 6 }, { journal: 'Tu portes des cellules Senju greffées.', importance: 3 }], resultat: 'Une semaine de fièvre, puis une force que tu ne te connaissais pas. Tes plaies se referment en une nuit.' },
      {
        id: 'voler',
        texte: 'Voler la fiole',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { discretion: 2, agilite: 2 },
          succes: { texte: 'Tu ressors avec la fiole et sans payer. Tu te l’injectes seul·e, en serrant les dents. La fièvre dure deux semaines.', effets: [{ drapeau: 'cellules_senju' }, { stat: 'jauges.chakraMax', delta: 25 }, { stat: 'jauges.sante', delta: -15 }, { ethique: { honneur: -6 } }] },
          echec: { texte: 'Le médecin a des amis. Tu t’en sors avec des côtes fêlées et sans la fiole.', effets: [{ stat: 'jauges.sante', delta: -25 }] },
        },
      },
      { id: 'refuser', texte: 'Refuser : certaines choses ne devraient pas être en vente', effets: [{ ethique: { honneur: 4 } }], resultat: 'Tu ressors dans la rue. La fiole reste sur l’étagère, en attendant quelqu’un de moins prudent.' },
    ],
  },
  {
    ...base,
    arc: 'heritage',
    id: 'x_rinnegan',
    titre: 'Les cercles',
    categorie: 'eveil',
    lieu: '$maison',
    enchaine: true,
    planifieParMoteur: true,
    chapitres: TOUS,
    si: { maitrise: 'rinnegan', possede: true },
    texte: 'Une nuit, la fièvre te prend sans prévenir. Tes yeux brûlent comme jamais : le sang des Uchiha et la force des Senju se sont trouvés. Dans le miroir, entre deux vertiges, tu vois des cercles concentriques remplacer le rouge du Sharingan.',
    choix: [
      { id: 'accepter', texte: 'Laisser la transformation aller au bout', effets: [{ tenterEveil: 'rinnegan', intensite: 100 }, { stat: 'jauges.sante', delta: -20 }, { succes: 'rinnegan' }, { journal: 'Une nuit de fièvre, et le Rinnegan.', importance: 3 }], resultat: 'Au matin, le monde est différent. Tu vois le chakra de chaque être comme une rivière, et tu sens que tu pourrais en détourner le cours.' },
      { id: 'resister', texte: 'Lutter contre ce qui change en toi', effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { drapeau: 'rinnegan_refuse' }], resultat: 'Tu te bats toute la nuit contre tes propres yeux. Au matin, le Sharingan est revenu. Les cercles, eux, attendent. Tu le sens.' },
    ],
  },
];
