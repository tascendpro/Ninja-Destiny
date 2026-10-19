// Chapitre 3 : la Troisième Grande Guerre (de 15-16 à 19-20 ans).
// Voie du village : affectation, premier front, la perte, l'as ennemi, la guerre vue de chaque village, la paix, le rang de jōnin.
// Voie de la route : les mercenaires que les deux camps s'arrachent.

import type { ChoiceDef, Condition, Effect, EventDef, MissionDef } from '../../engine/types';
import { combatPouvoir, entrainerPouvoir, segmentsParVillage } from './outils';

const base = { chapitre: 3, arc: 'conflit' as const };
const ACTIF: Condition = { statut: 'actif' };
const ROUTE: Condition = { statut: ['errant', 'deserteur'] };
const A_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const SENSEI_VIVANT: Condition = { pnj: '@sensei', etat: ['vivant', 'blesse'] };

const ADVERSAIRES = [
  { si: { village: ['konoha', 'suna'] } as Condition, nom: 'Iwa', element: 'doton' as const },
  { si: { village: 'kiri' } as Condition, nom: 'Kumo', element: 'raiton' as const },
  { si: { village: ['kumo', 'iwa'] } as Condition, nom: 'Konoha', element: 'katon' as const },
];

const SUITE_GUERRE: Effect[] = [
  { planifier: 'c3_premier_front', dansJours: 150 },
  { planifier: 'c3_perte', dansJours: 380 },
  { planifier: 'c3_as', dansJours: 600 },
  { planifier: 'c3_guerre_konoha', dansJours: 800 },
  { planifier: 'c3_guerre_suna', dansJours: 800 },
  { planifier: 'c3_guerre_kiri', dansJours: 800 },
  { planifier: 'c3_guerre_kumo', dansJours: 800 },
  { planifier: 'c3_guerre_iwa', dansJours: 800 },
  { planifier: 'c3_paix', dansJours: 1050 },
];

export const MISSIONS_C3: MissionDef[] = [
  {
    id: 'a_ravitaillement',
    rang: 'A',
    titre: 'Le convoi de riz',
    description: 'Faire passer un convoi de vivres à travers les lignes jusqu’à une garnison assiégée.',
    lieu: 'frontiere_herbe',
    duree: 12,
    si: { tout: [{ chapitre: 3 }, ACTIF, { rangMin: 'genin' }, { blessureGrave: false }] },
    recompense: { ryo: 300, reputation: 8 },
    risques: 'Embuscades, unités d’élite ennemies.',
    evenement: 'ma_ravitaillement',
  },
  {
    id: 'a_espion',
    rang: 'A',
    titre: 'L’espion de la capitale',
    description: 'Démasquer un espion ennemi qui renseigne l’état-major depuis l’intérieur du village.',
    lieu: '$village',
    duree: 8,
    si: { tout: [{ chapitre: 3 }, ACTIF, { rangMin: 'chunin' }, { blessureGrave: false }] },
    recompense: { ryo: 260, reputation: 6 },
    risques: 'Faux coupables, représailles.',
    evenement: 'ma_espion',
  },
];

export const CHAPITRE3: EventDef[] = [
  {
    ...base,
    id: 'c3_ouverture',
    titre: 'La déclaration',
    categorie: 'guerre',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { texte: 'Les cloches de la tour sonnent trois fois, puis trois fois encore. Le {kage} parle depuis le toit, devant le village entier : la guerre est déclarée. La Troisième Grande Guerre, dira-t-on plus tard. Pour l’instant, c’est seulement le jour où ta mère a pleuré en préparant ton sac.' },
      ...segmentsParVillage({
        konoha: 'Konoha fait face à Iwa au nord et à des escarmouches de Kumo à l’est. Le Conseil veut une guerre courte ; personne ne croit qu’elle le sera.',
        suna: 'Suna se bat aux côtés de Konoha, par alliance plus que par conviction. Le daimyō du Vent a coupé les vivres il y a deux ans ; il les rend aujourd’hui, contre du sang.',
        kiri: 'Kiri entre en guerre contre Kumo pour les îles du nord. On dit que le Mizukage a déclaré la guerre pour que le village oublie ses purges.',
        kumo: 'Le Raikage a déclaré la guerre à Konoha. Kumo veut des lignées, des terres, et la revanche d’une génération entière.',
        iwa: 'Iwa reprend la guerre que la paix n’avait fait que suspendre. Le Tsuchikage veut le Pays de l’Herbe, et il le veut avant l’hiver.',
      }),
      { texte: 'Chaque ninja doit choisir son affectation avant l’aube.' },
    ],
    choix: [
      {
        id: 'front',
        texte: 'Le front : une unité d’assaut',
        effets: [{ drapeau: 'c3_affectation', valeur: 'front' }, { stat: 'social.reputation', delta: 3 }, ...SUITE_GUERRE],
        resultat: 'On te donne un numéro d’unité et une date de départ. Le soir, tu aiguises tes armes jusqu’à ce que la pierre soit usée.',
      },
      {
        id: 'soins',
        texte: 'Le corps médical, à l’arrière du front',
        effets: [{ drapeau: 'c3_affectation', valeur: 'soins' }, { entrainer: 'shosen', jours: 40, mentor: true }, { ethique: { compassion: 4 } }, ...SUITE_GUERRE],
        resultat: 'On te fait passer trois semaines dans un hôpital de campagne avant même de partir. Tu apprends que le sang a une odeur, et qu’on finit par ne plus la sentir.',
      },
      {
        id: 'renseignement',
        texte: 'Le renseignement : derrière les lignes ennemies',
        effets: [{ drapeau: 'c3_affectation', valeur: 'renseignement' }, { stat: 'social.reputationOmbre', delta: 5 }, { stat: 'attributs.discretion', delta: 2 }, ...SUITE_GUERRE],
        resultat: 'Un homme sans visage te remet un code, un nom d’emprunt, et une capsule que tu ne dois avaler qu’en dernier recours.',
      },
    ],
  },
  {
    ...base,
    id: 'c3_premier_front',
    titre: 'Le premier front',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    personnages: ['@coequipierB'],
    texte: [
      { texte: 'La plaine de l’Herbe, au petit matin. Deux armées de ninjas se font face sur un kilomètre. Le silence avant le premier signe est le plus long de ta vie.' },
      { si: { drapeau: 'c3_affectation', egal: 'soins' }, texte: 'Tu es à l’arrière, sous une tente, avec des bandages, du fil et un chakra qui tremble. Les premiers blessés arrivent avant même que tu aies entendu le combat.' },
      { si: { drapeau: 'c3_affectation', egal: 'renseignement' }, texte: 'Tu es de l’autre côté de la plaine, dans un uniforme qui n’est pas le tien. Tu as trois heures pour voler les plans de bataille avant que l’assaut ne commence.' },
    ],
    choix: [
      ...ADVERSAIRES.map(
        (adv): ChoiceDef => ({
          id: `charger_${adv.element}`,
          texte: `Charger avec ton unité contre les lignes d’${adv.nom}`,
          si: { tout: [adv.si, { non: { drapeau: 'c3_affectation', egal: 'soins' } }, { non: { drapeau: 'c3_affectation', egal: 'renseignement' } }] },
          test: {
            type: 'combat',
            difficulte: 62,
            letal: true,
            elementAdverse: adv.element,
            causeMort: `tombé·e sur la plaine de l’Herbe, au premier jour de la guerre contre ${adv.nom}`,
            attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
            maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
            arme: true,
            succes: {
              texte: 'Tu ne te souviendras jamais de l’ordre des choses : des éclairs, des cris, un kunai dans ta main puis plus rien dans ta main. Le soir, votre ligne a avancé de trois cents mètres. On t’appelle par ton nom dans les rapports.',
              effets: [{ stat: 'social.reputation', delta: 8 }, ...combatPouvoir(), { entrainer: 'ninjutsu', jours: 30 }],
            },
            echec: {
              texte: 'La ligne recule, puis se brise. On te traîne à l’arrière, inconscient·e.',
              effets: [{ blessure: { id: 'eclat_front', nom: 'Éclats dans la jambe', gravite: 2, jours: 60 } }],
            },
          },
        }),
      ),
      {
        id: 'soigner',
        texte: 'Tenir l’hôpital de campagne jusqu’au soir',
        si: { drapeau: 'c3_affectation', egal: 'soins' },
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          maitrises: { shosen: 3 },
          succes: {
            texte: 'Quarante blessés. Trente-quatre vivants au soir. Un jōnin que tu as recousu revient te serrer la main avant de repartir au combat.',
            effets: [{ stat: 'social.reputation', delta: 6 }, { entrainer: 'shosen', jours: 40 }, { ethique: { compassion: 6 } }],
          },
          echec: {
            texte: 'Tu en perds trop. Tu en sauves aussi, mais tu ne comptes que ceux que tu as perdus.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }, { entrainer: 'shosen', jours: 20 }],
          },
        },
      },
      {
        id: 'infiltrer',
        texte: 'Voler les plans de bataille ennemis',
        si: { drapeau: 'c3_affectation', egal: 'renseignement' },
        test: {
          type: 'competence',
          difficulte: 60,
          letal: true,
          causeMort: 'démasqué·e derrière les lignes ennemies',
          attributs: { discretion: 3, intellect: 1 },
          succes: {
            texte: 'Les plans arrivent à ton état-major une heure avant l’assaut. L’assaut ennemi tombe dans le vide. Personne ne saura jamais ton nom ; c’est le prix et la récompense.',
            effets: [{ stat: 'social.reputationOmbre', delta: 10 }, { stat: 'social.influence', delta: 5 }],
          },
          echec: {
            texte: 'On te reconnaît au moment de sortir. Tu fuis à travers le champ de bataille, entre les deux armées.',
            effets: [{ blessure: { id: 'fuite_lignes', nom: 'Brûlures de fuite', gravite: 2, jours: 40 } }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c3_perte',
    titre: 'Ce que la guerre prend',
    categorie: 'deuil',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: A_VIVANT, texte: 'Une embuscade, un pont, une nuit sans lune. {@coequipierA} se jette devant toi quand le kunai explosif arrive. Il te reste dans les bras le temps de dire ton prénom, et rien d’autre.' },
      { si: { tout: [{ non: A_VIVANT }, SENSEI_VIVANT] }, texte: 'On te ramène le bandeau de {@sensei}, fendu en deux. Il a tenu un col seul pendant une nuit entière pour que son unité puisse se replier. On n’a pas retrouvé le corps.' },
      { si: { tout: [{ non: A_VIVANT }, { non: SENSEI_VIVANT }] }, texte: 'Une lettre arrive du village. {Parent} n’a pas survécu au bombardement du quartier est. Tu lis la lettre trois fois avant de comprendre qu’elle parle de toi.' },
    ],
    choix: [
      {
        id: 'vengeance',
        texte: 'Jurer de retrouver ceux qui ont fait ça',
        effets: [
          { si: A_VIVANT, alors: [{ pnjEtat: '@coequipierA', etat: 'mort', cause: 'mort·e à la guerre en te protégeant' }], sinon: [{ si: SENSEI_VIVANT, alors: [{ pnjEtat: '@sensei', etat: 'mort', cause: 'mort à la guerre en couvrant la retraite' }] }] },
          { drapeau: 'perte_tragique' },
          { tenterEveil: 'mangekyo', intensite: 70 },
          { eveilDanger: 60 },
          { ethique: { ambition: 6, compassion: -4 } },
          { drapeau: 'c3_vengeance' },
          ...entrainerPouvoir(30),
        ],
        resultat: 'Tu ne pleures pas. Quelque chose en toi se ferme, et quelque chose d’autre s’ouvre, qui n’a pas de fond.',
      },
      {
        id: 'porter',
        texte: 'Porter cette mort, et continuer pour les vivants',
        effets: [
          { si: A_VIVANT, alors: [{ pnjEtat: '@coequipierA', etat: 'mort', cause: 'mort·e à la guerre en te protégeant' }], sinon: [{ si: SENSEI_VIVANT, alors: [{ pnjEtat: '@sensei', etat: 'mort', cause: 'mort à la guerre en couvrant la retraite' }] }] },
          { drapeau: 'perte_tragique' },
          { tenterEveil: 'mangekyo', intensite: 40 },
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { ethique: { compassion: 6 } },
        ],
        resultat: 'Tu graves le nom sur la pierre du souvenir de tes propres mains. Puis tu retournes au front, parce que d’autres comptent sur toi. C’est la seule façon que tu trouves d’honorer ce qui a été perdu.',
      },
    ],
  },
  {
    ...base,
    id: 'c3_as',
    titre: 'L’as ennemi',
    categorie: 'guerre',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: ACTIF,
    texte: [
      { texte: 'On l’appelle « le Faucheur » dans les rapports. Un jōnin ennemi qui a déjà tué onze des vôtres. Ce matin, ton unité tombe sur lui, seul, au milieu d’un pont suspendu.' },
      { si: { drapeau: 'c3_vengeance' }, texte: 'Tu reconnais la marque sur son épaule. C’est son unité qui a tendu l’embuscade.' },
    ],
    choix: [
      ...ADVERSAIRES.map(
        (adv): ChoiceDef => ({
          id: `duel_${adv.element}`,
          texte: 'L’affronter en duel pour couvrir ton unité',
          si: adv.si,
          test: {
            type: 'combat',
            manches: 3,
            difficulte: 66,
            letal: true,
            elementAdverse: adv.element,
            causeMort: `tué·e en duel par le Faucheur d’${adv.nom}`,
            attributs: { agilite: 2, controleChakra: 1, controleEmotionnel: 1 },
            maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
            arme: true,
            critique: {
              texte: 'Le duel dure trois minutes et tout le monde le racontera. À la fin, le Faucheur tombe du pont, et ton nom traverse la frontière avant toi. On commence à t’appeler par un surnom.',
              effets: [{ drapeau: 'c3_as_vaincu' }, { stat: 'social.reputation', delta: 15 }, ...combatPouvoir(), ...combatPouvoir()],
            },
            succes: {
              texte: 'Il est plus fort que toi. Tu es plus désespéré·e que lui. Ça suffit, de justesse. Il tombe ; tu restes debout, sans savoir comment.',
              effets: [{ drapeau: 'c3_as_vaincu' }, { stat: 'social.reputation', delta: 10 }, ...combatPouvoir()],
            },
            echec: {
              texte: 'Il te brise, méthodiquement, puis il s’en va, comme si tu ne valais pas la peine d’être achevé·e.',
              effets: [{ blessure: { id: 'faucheur', nom: 'Côtes et bras brisés', gravite: 3, jours: 90 } }],
            },
          },
        }),
      ),
      {
        id: 'piege',
        texte: 'Couper les cordes du pont pendant qu’il traverse',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { intellect: 2, agilite: 2 },
          succes: {
            texte: 'Le pont s’effondre sous lui. Il rattrape une corde, puis la lâche. Ce n’est pas une victoire dont on fait des chansons. C’est une victoire quand même.',
            effets: [{ drapeau: 'c3_as_vaincu' }, { stat: 'social.reputation', delta: 6 }, { ethique: { honneur: -3 } }],
          },
          echec: {
            texte: 'Il te voit faire et bondit sur l’autre rive. Ton unité doit fuir sous ses coups.',
            effets: [{ stat: 'jauges.sante', delta: -25 }],
          },
        },
      },
    ],
  },
  ...guerreParVillage(),
  {
    ...base,
    arc: 'apres_guerre',
    id: 'c3_paix',
    titre: 'La table de négociation',
    categorie: 'politique',
    lieu: 'pays_fer',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: 'Trois ans de guerre, et enfin une table : au Pays du Fer, en terrain neutre, sous la garde des samouraïs. Tu fais partie de l’escorte du {kage}. La nuit avant la signature, un messager te glisse qu’un groupe de faucons, dans ton propre camp, veut faire échouer la paix.',
    choix: [
      {
        id: 'proteger',
        texte: 'Protéger la paix, contre ton propre camp',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'tombé·e au Pays du Fer, la nuit où la paix a failli mourir',
          attributs: { perception: 2, agilite: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Tu les arrêtes dans un couloir, sans bruit. Le lendemain, la paix est signée. Le {kage} te regarde longuement en sortant de la salle. Il sait.',
            effets: [{ drapeau: 'c3_paix_sauvee' }, { stat: 'social.influence', delta: 12 }, { stat: 'social.reputation', delta: 6 }, { relation: '@kage', delta: { confiance: 15, respect: 10 } }],
          },
          echec: {
            texte: 'Tu en arrêtes deux. Le troisième atteint la salle. La paix est signée quand même, mais un ambassadeur est mort, et la paix est déjà malade.',
            effets: [{ blessure: { id: 'paix_couloir', nom: 'Coup de lame au flanc', gravite: 2, jours: 50 } }, { stat: 'social.influence', delta: 4 }],
          },
        },
      },
      {
        id: 'laisser',
        texte: 'Laisser faire : cette paix trahit nos morts',
        effets: [{ drapeau: 'c3_faucon' }, { ethique: { honneur: -6, ambition: 6 } }, { stat: 'social.reputationOmbre', delta: 8 }],
        resultat: 'Tu regardes ailleurs au bon moment. La signature est retardée d’un an, et cent ninjas de plus meurent pour ce retard. Les faucons s’en souviendront. Toi aussi.',
      },
      {
        id: 'avertir',
        texte: 'Avertir le {kage} et laisser les samouraïs agir',
        effets: [{ drapeau: 'c3_paix_sauvee' }, { stat: 'social.loyaute', delta: 8 }, { relation: '@kage', delta: { confiance: 10 } }],
        resultat: 'Les samouraïs s’en chargent sans un mot. La paix est signée au matin. Quelqu’un dans ton camp ne te pardonnera jamais, sans savoir exactement quoi.',
      },
    ],
  },
  {
    ...base,
    arc: 'apres_guerre',
    id: 'c3_jonin',
    titre: 'L’examen de jōnin',
    categorie: 'promotion',
    lieu: '$village',
    priorite: 32,
    si: { tout: [ACTIF, { rang: 'chunin' }, { vu: 'c3_paix' }] },
    personnages: ['@kage'],
    texte: 'Après la guerre, le village compte ses jōnin et en trouve trop peu. On te convoque devant trois examinateurs qui ont tous survécu à deux guerres. Pas d’épreuve écrite, pas de tournoi : une mission simulée, de nuit, contre eux trois.',
    choix: [
      {
        id: 'mission',
        texte: 'Réussir la mission par la force',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { agilite: 2, force: 1, controleChakra: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'À l’aube, tu ramènes l’objectif. L’un des examinateurs boite. Ils te tendent le gilet des jōnin sans un mot de plus.',
            effets: [{ rang: 'jonin' }, { succes: 'jonin' }, { stat: 'social.reputation', delta: 8 }, { journal: 'Tu deviens jōnin.', importance: 3 }],
          },
          echec: {
            texte: 'Ils t’arrêtent à cent mètres de l’objectif. « Bien. Pas assez bien. Reviens dans un an. »',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
          },
        },
      },
      {
        id: 'commandement',
        texte: 'Réussir la mission en commandant une escouade de chūnin',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { intellect: 2, charisme: 2 },
          succes: {
            texte: 'Tu ne te bats presque pas. Ton escouade fait tout, exactement comme tu l’as prévu. « Un jōnin, c’est quelqu’un qui ramène tout le monde. » Tu portes le gilet le soir même.',
            effets: [{ rang: 'jonin' }, { succes: 'jonin' }, { stat: 'social.influence', delta: 6 }, { journal: 'Tu deviens jōnin.', importance: 3 }],
          },
          echec: {
            texte: 'Ton escouade se disperse au premier imprévu. Tu ramènes tout le monde, mais pas l’objectif.',
            effets: [{ stat: 'attributs.charisme', delta: 1 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'apres_guerre',
    id: 'c3_fin',
    titre: 'Après la guerre',
    categorie: 'epilogue',
    lieu: '$village',
    priorite: 30,
    si: { tout: [ACTIF, { un: [{ tout: [{ vu: 'c3_paix' }, { un: [{ rangMin: 'jonin' }, { vu: 'c3_jonin' }, { rang: 'genin' }] }] }, { age: { min: 21 } }] }] },
    texte: [
      { texte: 'La paix tient depuis six mois. Les marchés rouvrent, les enfants retournent à l’Académie. Sur la pierre du souvenir, on a gravé tant de noms qu’il a fallu une deuxième pierre.' },
      { si: { drapeau: 'c3_as_vaincu' }, texte: 'Dans les autres villages, on prononce ton nom avec prudence.' },
      { si: { drapeau: 'c3_faucon' }, texte: 'Les faucons de ton village te saluent d’un signe de tête dans la rue. Tu ne sais pas encore ce qu’ils te demanderont en échange.' },
      { si: { rangMin: 'jonin' }, texte: 'Tu portes le gilet des jōnin. Bientôt, on te confiera des enfants.' },
    ],
    choix: [
      {
        id: 'reconstruire',
        texte: 'Aider à reconstruire le village',
        effets: [{ ethique: { compassion: 4 } }, { stat: 'social.reputation', delta: 4 }, { drapeau: 'chapitre3_fini' }, { fin: 'chapitre_3' }],
        resultat: 'Tu portes des poutres avec des civils qui ne savent pas qui tu es. C’est le meilleur mois de ton année.',
      },
      {
        id: 'entrainer',
        texte: 'T’entraîner pour la prochaine guerre',
        effets: [{ ethique: { ambition: 4 } }, ...entrainerPouvoir(30), { drapeau: 'chapitre3_fini' }, { fin: 'chapitre_3' }],
        resultat: 'Il y aura une prochaine guerre. Il y en a toujours une. Tu seras prêt·e.',
      },
    ],
  },
  {
    ...base,
    id: 'ma_ravitaillement',
    titre: 'Le convoi de riz',
    categorie: 'mission',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: { mission: 'a_ravitaillement', statut: 'en_cours' },
    texte: 'Vingt charrettes, quarante porteurs civils, et une garnison qui mange ses chevaux. À mi-chemin, des traces de pas autour d’un gué : on vous attend.',
    choix: [
      {
        id: 'forcer',
        texte: 'Forcer le passage au gué',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'tombé·e au gué, en défendant un convoi de riz',
          attributs: { force: 2, agilite: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Le convoi passe. La garnison mange ce soir-là, et le commandant te serre si fort la main qu’il te fait mal.',
            effets: [{ mission: 'a_ravitaillement', statut: 'reussie' }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Vous perdez la moitié des charrettes. L’autre moitié suffit à tenir un mois.',
            effets: [{ mission: 'a_ravitaillement', statut: 'reussie' }, { stat: 'jauges.sante', delta: -25 }],
          },
        },
      },
      {
        id: 'detour',
        texte: 'Faire un détour de trois jours par les marais',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { perception: 2, intellect: 2 },
          succes: {
            texte: 'Trois jours de boue jusqu’à la taille. Pas un ennemi en vue. La garnison vous voit arriver comme un miracle.',
            effets: [{ mission: 'a_ravitaillement', statut: 'reussie' }, { stat: 'attributs.perception', delta: 1 }],
          },
          echec: {
            texte: 'Les marais prennent deux charrettes et un porteur. Vous arrivez trop tard pour une partie de la garnison.',
            effets: [{ mission: 'a_ravitaillement', statut: 'echouee' }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'ma_espion',
    titre: 'L’espion de la capitale',
    categorie: 'trahison',
    lieu: '$village',
    enchaine: true,
    si: { mission: 'a_espion', statut: 'en_cours' },
    texte: 'Trois suspects : une archiviste, un instructeur de l’Académie, un vieux marchand de thé qui sert les jōnin depuis vingt ans. L’un d’eux renseigne l’ennemi.',
    choix: [
      {
        id: 'enqueter',
        texte: 'Enquêter patiemment',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { intellect: 2, perception: 2 },
          succes: {
            texte: 'Le marchand de thé. Les feuilles qu’il vend ont un ordre de pliage qui forme un code. Tu l’arrêtes sans qu’il ait eu le temps de mordre sa capsule.',
            effets: [{ mission: 'a_espion', statut: 'reussie' }, { stat: 'social.influence', delta: 6 }],
          },
          echec: {
            texte: 'Tu accuses l’archiviste. Elle est innocente. Le vrai espion disparaît pendant qu’on l’interroge.',
            effets: [{ mission: 'a_espion', statut: 'echouee' }, { stat: 'social.reputation', delta: -6 }, { ethique: { compassion: -3 } }],
          },
        },
      },
      {
        id: 'appat',
        texte: 'Tendre un faux renseignement aux trois suspects',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 3, discretion: 1 },
          succes: {
            texte: 'Trois faux plans, trois versions différentes. Une semaine plus tard, l’ennemi bouge exactement comme le dit la version de l’instructeur. Il enseignait aux enfants depuis dix ans.',
            effets: [{ mission: 'a_espion', statut: 'reussie' }, { stat: 'attributs.intellect', delta: 2 }],
          },
          echec: {
            texte: 'L’espion flaire le piège et ne transmet rien. Tu n’as pas de coupable, seulement des soupçons.',
            effets: [{ mission: 'a_espion', statut: 'echouee' }],
          },
        },
      },
    ],
  },

  // ───────── La route en temps de guerre ─────────
  {
    ...base,
    arc: 'conflit',
    id: 'c3r_ouverture',
    titre: 'Les recruteurs',
    categorie: 'guerre',
    lieu: 'marche_noir',
    enchaine: true,
    si: ROUTE,
    texte: 'La guerre a éclaté entre les grands villages. À Kōsai, les recruteurs des deux camps se disputent les ninjas sans bandeau à prix d’or. Ils savent qui tu es, et ce que tu vaux.',
    choix: [
      {
        id: 'vendre',
        texte: 'Vendre ton épée au plus offrant',
        effets: [{ stat: 'jauges.ryo', delta: 300 }, { stat: 'social.reputationOmbre', delta: 10 }, { drapeau: 'c3r_mercenaire' }, { planifier: 'c3r_bataille', dansJours: 300 }],
        resultat: 'Une bourse pleine et un contrat d’un an. Tu ne demandes pas contre qui tu te battras. C’est plus simple ainsi.',
      },
      {
        id: 'refugies',
        texte: 'Protéger les réfugiés qui fuient la guerre',
        effets: [{ ethique: { compassion: 10 } }, { drapeau: 'c3r_refugies' }, { planifier: 'c3r_bataille', dansJours: 300 }],
        resultat: 'Une colonne de mille réfugiés, aucune armée pour les protéger. Ils te regardent comme si tu étais une armée.',
      },
      {
        id: 'servir',
        texte: 'Proposer tes services à ton ancien village',
        si: { statut: 'errant' },
        effets: [{ statut: 'actif' }, { rang: 'genin' }, { drapeau: 'reintegre' }, { succes: 'reintegre' }, ...SUITE_GUERRE],
        resultat: 'En temps de guerre, on ne refuse pas un bras. On te rend un bandeau, un rang de genin, et un départ pour le front dans trois jours.',
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c3r_bataille',
    titre: 'Entre deux armées',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ROUTE,
    texte: [
      { si: { drapeau: 'c3r_mercenaire' }, texte: 'Ton employeur t’envoie tenir un village frontalier contre une unité d’élite. Les villageois, eux, voudraient juste que tout le monde parte.' },
      { si: { drapeau: 'c3r_refugies' }, texte: 'La colonne de réfugiés arrive à un col tenu par une unité ennemie qui n’a pas reçu l’ordre de les laisser passer.' },
      { si: { tout: [{ drapeau: 'c3r_mercenaire', absent: true }, { drapeau: 'c3r_refugies', absent: true }] }, texte: 'La guerre te rattrape sur la route : une unité d’élite t’a pris pour un espion.' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre',
        test: {
          type: 'combat',
          difficulte: 64,
          letal: true,
          causeMort: 'tombé·e entre deux armées, sans bandeau',
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Tu tiens. Les soldats de l’unité d’élite racontent dans leur camp qu’un ninja sans village les a arrêtés. Personne ne les croit.',
            effets: [{ stat: 'social.reputationOmbre', delta: 10 }, { stat: 'jauges.ryo', delta: 200 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu survis parce qu’ils te croient mort·e. Tu restes trois jours dans un fossé avant de pouvoir marcher.',
            effets: [{ blessure: { id: 'fosse_guerre', nom: 'Blessures multiples', gravite: 3, jours: 90 } }],
          },
        },
      },
      {
        id: 'negocier',
        texte: 'Parlementer avec leur chef',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: {
            texte: 'Tu lui parles de ses propres enfants. Il te regarde longtemps, puis il ordonne à ses hommes de s’écarter.',
            effets: [{ ethique: { compassion: 6 } }, { stat: 'attributs.charisme', delta: 2 }],
          },
          echec: {
            texte: 'Il ne veut rien entendre. Tu dois fuir, et laisser derrière toi ce que tu voulais protéger.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'apres_guerre',
    id: 'c3r_fin',
    titre: 'La paix des autres',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    priorite: 30,
    si: { tout: [ROUTE, { un: [{ vu: 'c3r_bataille' }, { age: { min: 21 } }] }] },
    texte: 'La guerre s’arrête au Pays du Fer, autour d’une table où personne ne t’a invité·e. Sur la route du sel, les caravanes reprennent. On parle de toi dans les auberges : un ninja sans village que les deux camps ont voulu acheter.',
    choix: [
      {
        id: 'continuer',
        texte: 'Reprendre la route',
        effets: [{ drapeau: 'chapitre3_fini' }, { fin: 'chapitre_3_route' }],
        resultat: 'Les guerres passent. La route reste.',
      },
    ],
  },
];

/** La guerre vue de chaque village : un événement par village, chacun avec ses propres choix. */
function guerreParVillage(): EventDef[] {
  return [
    {
      ...base,
      arc: 'crise',
      id: 'c3_guerre_konoha',
      titre: 'Le coup d’État',
      categorie: 'conflit_clans',
      lieu: '$village',
      enchaine: true,
      si: { tout: [ACTIF, { village: 'konoha' }] },
      personnages: ['@kage'],
      texte: [
        { texte: 'En pleine guerre, le clan Uchiha prépare un coup d’État contre le Hokage. Les unités de l’ombre le savent ; le Conseil veut l’écraser avant qu’il ne commence, quel qu’en soit le prix.' },
        { si: { clan: 'uchiha' }, texte: 'Le chef du clan te demande de te tenir prêt·e. Un masque blanc te demande de le trahir. Ta famille dort dans la pièce d’à côté.' },
        { si: { secret: 'eventail_sang' }, texte: 'Tu sais que le meurtre du conseiller, il y a des années, avait été maquillé. Tu sais que certains ont voulu cette guerre-là depuis le début.' },
      ],
      choix: [
        {
          id: 'mediation',
          texte: 'Tenter une médiation entre le clan et le Hokage',
          test: {
            type: 'competence',
            difficulte: 62,
            attributs: { charisme: 2, intellect: 2 },
            succes: {
              texte: 'Une nuit de négociations dans une maison de thé. Le chef du clan et le Hokage se serrent la main à l’aube. Le Conseil enrage. Le clan Uchiha existe encore le lendemain, et le jour d’après.',
              effets: [{ drapeau: 'uchiha_sauves' }, { stat: 'social.influence', delta: 15 }, { stat: 'social.confianceClan', delta: 10 }, { succes: 'mediateur' }],
            },
            echec: {
              texte: 'Personne ne veut t’écouter. Les deux camps s’arment. Ce qui suit ne figure dans aucun livre d’histoire de Konoha.',
              effets: [{ drapeau: 'nuit_uchiha' }, { stat: 'attributs.controleEmotionnel', delta: -3 }, { si: { clan: 'uchiha' }, alors: [{ drapeau: 'perte_tragique' }, { tenterEveil: 'mangekyo', intensite: 80 }] }],
            },
          },
        },
        {
          id: 'conseil',
          texte: 'Obéir au Conseil',
          effets: [{ drapeau: 'nuit_uchiha' }, { stat: 'social.loyaute', delta: 12 }, { ethique: { compassion: -10 } }, { stat: 'social.reputationOmbre', delta: 10 }],
          resultat: 'Le village est sauvé, dit-on. Tu ne sauras jamais si c’est vrai. Tu sais seulement ce que tu as vu cette nuit-là.',
        },
        {
          id: 'clan',
          texte: 'Prendre le parti du clan',
          si: { clan: 'uchiha' },
          effets: [{ statut: 'deserteur' }, { stat: 'social.confianceClan', delta: 20 }, { journal: 'Tu as pris le parti du clan contre le village.', importance: 3 }, { fin: 'exil', cause: 'fuite après l’échec du coup d’État Uchiha' }],
          resultat: 'Le coup d’État échoue avant de commencer. Tu fuis avec les survivants. Konoha t’inscrit au registre des déserteurs.',
        },
      ],
    },
    {
      ...base,
      arc: 'crise',
      id: 'c3_guerre_suna',
      titre: 'Le Kazekage assassiné',
      categorie: 'politique',
      lieu: '$village',
      enchaine: true,
      si: { tout: [ACTIF, { village: 'suna' }] },
      texte: 'Le Kazekage Jinsa est retrouvé mort dans son bureau. Le village est sans chef en pleine guerre, et la famille rivale accuse Konoha, l’allié d’hier.',
      choix: [
        {
          id: 'verite',
          texte: 'Trouver le véritable assassin',
          test: {
            type: 'competence',
            difficulte: 62,
            attributs: { intellect: 2, perception: 2 },
            succes: {
              texte: 'Le poison venait des réserves de Suna elles-mêmes. La famille rivale voulait une rupture avec Konoha pour prendre le pouvoir. L’alliance tient ; le nouveau Kazekage te le doit.',
              effets: [{ stat: 'social.influence', delta: 12 }, { stat: 'social.reputation', delta: 8 }, { succes: 'mediateur' }],
            },
            echec: {
              texte: 'Tu ne trouves rien de sûr. L’alliance avec Konoha se fissure. Suna entre dans des années difficiles.',
              effets: [{ stat: 'social.loyaute', delta: -3 }],
            },
          },
        },
        {
          id: 'pouvoir',
          texte: 'Soutenir la famille qui prend le pouvoir',
          effets: [{ stat: 'social.influence', delta: 10 }, { ethique: { ambition: 8, honneur: -4 } }],
          resultat: 'Tu te tiens du côté des vainqueurs. Le nouveau Kazekage n’oublie pas ceux qui l’ont aidé, ni ce qu’ils savent.',
        },
      ],
    },
    {
      ...base,
      arc: 'crise',
      id: 'c3_guerre_kiri',
      titre: 'La rébellion',
      categorie: 'guerre',
      lieu: '$village',
      enchaine: true,
      si: { tout: [ACTIF, { village: 'kiri' }] },
      texte: 'La guerre extérieure a déclenché la guerre intérieure : une rébellion se lève contre le Mizukage Rōshū et ses purges. La moitié des jōnin la soutiennent en secret. Le village brûle par quartiers.',
      choix: [
        {
          id: 'rebelles',
          texte: 'Rejoindre la rébellion',
          test: {
            type: 'combat',
            difficulte: 64,
            letal: true,
            causeMort: 'tombé·e dans la rébellion contre le Mizukage',
            attributs: { agilite: 2, controleEmotionnel: 2 },
            maitrises: { arme: 1, ninjutsu: 1 },
            arme: true,
            succes: {
              texte: 'Trois jours de combats dans la brume. Au quatrième, le Mizukage Rōshū est vaincu. Le nouveau Mizukage promet la fin des purges. Tu es là quand elle le jure.',
              effets: [{ drapeau: 'kiri_liberee' }, { stat: 'social.reputation', delta: 12 }, { ethique: { honneur: 8 } }, { succes: 'mediateur' }, ...combatPouvoir()],
            },
            echec: {
              texte: 'La rébellion est écrasée. Tu survis en te cachant dans un égout pendant deux jours. Personne ne sait que tu en étais. Pour l’instant.',
              effets: [{ stat: 'social.suspicion', delta: 20 }, { blessure: { id: 'rebellion', nom: 'Plaies de la rébellion', gravite: 2, jours: 60 } }],
            },
          },
        },
        {
          id: 'loyal',
          texte: 'Rester loyal au Mizukage',
          effets: [{ stat: 'social.loyaute', delta: 12 }, { ethique: { compassion: -8 } }],
          resultat: 'Tu te bats contre des gens avec qui tu as grandi. Le Mizukage gagne cette fois. Tu reçois une décoration que tu ranges dans un tiroir sans la regarder.',
        },
      ],
    },
    {
      ...base,
      arc: 'crise',
      id: 'c3_guerre_kumo',
      titre: 'L’offensive du Raikage',
      categorie: 'guerre',
      lieu: 'montagnes_foudre',
      enchaine: true,
      si: { tout: [ACTIF, { village: 'kumo' }] },
      texte: 'Le Raikage mène lui-même l’offensive finale vers le Pays du Feu. Il veut des volontaires pour l’avant-garde : la moitié d’entre eux ne reviendront pas, et il le dit.',
      choix: [
        {
          id: 'avantgarde',
          texte: 'Te porter volontaire',
          test: {
            type: 'combat',
            difficulte: 64,
            letal: true,
            elementAdverse: 'katon',
            causeMort: 'tombé·e à l’avant-garde du Raikage',
            attributs: { force: 2, agilite: 1, controleEmotionnel: 1 },
            maitrises: { arme: 1, ninjutsu: 1, armure_foudre: 2 },
            arme: true,
            succes: {
              texte: 'Tu cours à côté du Raikage, dans la foudre, et vous percez les lignes. Il te regarde une seule fois, et hoche la tête. À Kumo, ce hochement vaut une médaille.',
              effets: [{ stat: 'social.reputation', delta: 12 }, { relation: '@kage', delta: { respect: 15 } }, ...combatPouvoir()],
            },
            echec: {
              texte: 'Tu tombes au premier assaut. On te ramène dans le dernier convoi.',
              effets: [{ blessure: { id: 'avantgarde', nom: 'Brûlures et fractures', gravite: 3, jours: 90 } }],
            },
          },
        },
        {
          id: 'refus',
          texte: 'Conseiller au Raikage de négocier',
          effets: [{ stat: 'social.loyaute', delta: -6 }, { stat: 'social.influence', delta: 6 }, { ethique: { honneur: 6 } }],
          resultat: 'Le Raikage ne te répond pas. Une semaine plus tard, l’offensive échoue, et il envoie un émissaire au Pays du Fer. Il ne dira jamais que tu avais raison.',
        },
      ],
    },
    {
      ...base,
      arc: 'crise',
      id: 'c3_guerre_iwa',
      titre: 'La poussière explosive',
      categorie: 'guerre',
      lieu: 'carrieres_terre',
      enchaine: true,
      si: { tout: [ACTIF, { village: 'iwa' }] },
      texte: 'Le Tsuchikage dispose d’une arme : une technique d’atomisation qui efface tout ce qu’elle touche. Il veut l’utiliser sur une ville ennemie pleine de civils, pour finir la guerre d’un coup.',
      choix: [
        {
          id: 'executer',
          texte: 'Escorter le Tsuchikage jusqu’à la ville',
          effets: [{ stat: 'social.loyaute', delta: 10 }, { ethique: { compassion: -12 } }, { journal: 'Tu as vu une ville disparaître.', importance: 3 }],
          resultat: 'La guerre se termine trois mois plus tôt. La ville n’existe plus. Tu as vu la lumière, et tu la vois encore les yeux fermés.',
        },
        {
          id: 'detourner',
          texte: 'Le convaincre de frapper une cible militaire',
          test: {
            type: 'competence',
            difficulte: 62,
            attributs: { charisme: 2, intellect: 2 },
            succes: {
              texte: 'Une forteresse vide de civils, à la place d’une ville. L’effet sur l’ennemi est le même. Le Tsuchikage te regarde comme on regarde un futur conseiller.',
              effets: [{ stat: 'social.influence', delta: 10 }, { ethique: { compassion: 8 } }, { succes: 'mediateur' }],
            },
            echec: {
              texte: 'Il ne t’écoute pas. Tu restes au camp pendant qu’il part. Ce soir-là, il n’y a plus de ville au bord du fleuve.',
              effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }],
            },
          },
        },
      ],
    },
  ];
}

