import type { Condition, Effect, EventDef, MissionDef } from '../../engine/types';

// Les années d'adulte (chapitres 4 à 6) : une famille à protéger, des camarades qu'on ne peut pas tous sauver,
// et des missions périlleuses qui dépendent de la voie choisie (renseignement, assassinat, garde, chasse…).
// Chaque dilemme laisse des traces (drapeaux) que la suite de l'histoire relit.

const base = { chapitre: 4, chapitres: [4, 5, 6], arc: 'apres_guerre' as const };
const ACTIF: Condition = { statut: 'actif' };
const FAMILLE: Condition = { tout: [ACTIF, { drapeau: 'famille_fondee' }] };
const ENFANT_VIVANT: Condition = { drapeau: 'enfant_mort', absent: true };
const CONJOINT_VIVANT: Condition = { drapeau: 'conjoint_mort', absent: true };
const AMI_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const B_VIVANT: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };
const MISSION_ADULTE: Condition = { tout: [ACTIF, { rangMin: 'chunin' }, { blessureGrave: false }, { age: { min: 21 } }, { un: [{ chapitre: 4 }, { chapitre: 5 }, { chapitre: 6 }] }] };

/** Ce qu'il advient de ceux qu'on n'a pas pu défendre : blessés, ou perdus. */
const SORT_AMI: Effect = {
  si: AMI_VIVANT,
  alors: [
    {
      hasard: [
        { poids: 55, effets: [{ pnjEtat: '@coequipierA', etat: 'blesse' }, { drapeau: 'ami_blesse_quartier' }] },
        { poids: 45, effets: [{ pnjEtat: '@coequipierA', etat: 'mort', cause: 'tombé·e en défendant le quartier' }, { drapeau: 'ami_mort_quartier' }, { planifier: 'f_deuil', dansJours: 20 }] },
      ],
    },
  ],
};
const SORT_CONJOINT: Effect = {
  hasard: [
    { poids: 55, effets: [{ drapeau: 'conjoint_blesse' }] },
    { poids: 45, effets: [{ drapeau: 'conjoint_mort' }, { planifier: 'f_deuil', dansJours: 20 }] },
  ],
};
const SORT_ENFANT: Effect = {
  hasard: [
    { poids: 65, effets: [{ drapeau: 'enfant_blesse' }] },
    { poids: 35, effets: [{ drapeau: 'enfant_mort' }, { planifier: 'f_deuil', dansJours: 20 }] },
  ],
};

/** Le récit de ce qu'on n'a pas pu empêcher, lu après coup. */
const BILAN_QUARTIER = [
  { si: { drapeau: 'ami_mort_quartier' }, texte: 'Quand tu arrives enfin chez {@coequipierA}, il est trop tard. Il s’est battu jusqu’au bout, adossé à sa porte. Il a tenu assez longtemps pour que les voisins s’enfuient.' },
  { si: { drapeau: 'ami_blesse_quartier' }, texte: '{@coequipierA} a survécu, de justesse, une lame dans l’épaule. Il ne te reproche rien. Il n’a pas besoin de le dire.' },
  { si: { drapeau: 'conjoint_mort' }, texte: '{Conjoint} ne s’est pas relevé{conjoint_e}. {conjointNom} avait protégé la porte de la maison jusqu’au dernier souffle. Tu restes longtemps à genoux dans les décombres.' },
  { si: { tout: [{ drapeau: 'conjoint_blesse' }, CONJOINT_VIVANT] }, texte: '{Conjoint} s’en sortira : une longue cicatrice, des semaines au lit, et un regard qui a changé.' },
  { si: { drapeau: 'enfant_mort' }, texte: '{Enfant}, {enfantNom}, n’a pas survécu. Il n’y a pas de phrase pour la suite. Il n’y en aura jamais.' },
  { si: { tout: [{ drapeau: 'enfant_blesse' }, ENFANT_VIVANT] }, texte: '{Enfant} est vivant{enfant_e}, blessé{enfant_e}, et ne dort plus sans lumière.' },
];

const ATTAQUE_QUARTIER = (difficulte: number) => ({
  type: 'combat' as const,
  difficulte,
  attributs: { agilite: 1, force: 1, perception: 1 },
  maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
  arme: true,
  letal: true,
  manches: 3,
  causeMort: 'tombé·e en défendant les siens',
});

/** Deux camarades en danger, un seul bras : celui qu'on n'a pas choisi paie, et s'en souvient s'il survit. */
const SORT_DE = (ref: string, cause: string, drapeau: string): Effect => ({
  hasard: [
    { poids: 55, effets: [{ pnjEtat: ref, etat: 'blesse' }, { relation: ref, delta: { confiance: -12 } }, { drapeau: `${drapeau}_abandonne` }] },
    { poids: 45, effets: [{ pnjEtat: ref, etat: 'mort', cause }, { drapeau: `${drapeau}_sacrifie` }] },
  ],
});

export const MISSIONS_ADULTES: MissionDef[] = [
  { id: 'a4_espionnage', rang: 'A', titre: 'L’œil dans le village voisin', description: 'Infiltrer un village voisin sous une fausse identité et rapporter ses plans de guerre. Si tu es pris·e, le village niera te connaître.', lieu: 'carrieres_terre', duree: 30, si: MISSION_ADULTE, recompense: { ryo: 450, reputation: 10 }, risques: 'Capture, torture, exécution.', evenement: 'm4_espionnage' },
  { id: 's4_assassinat', rang: 'S', titre: 'Le ministre', description: 'Un ministre du daimyō vend les secrets du village. Le Conseil veut qu’il meure, sans témoin, sans trace.', lieu: 'marche_noir', duree: 14, si: { tout: [MISSION_ADULTE, { metier: ['assassin', 'renseignement'] }] }, recompense: { ryo: 700, reputation: 6 }, risques: 'Mortels.', evenement: 'm4_assassinat' },
  { id: 'a4_escorte', rang: 'A', titre: 'La litière du daimyō', description: 'Escorter le daimyō à travers un col où trois escortes ont déjà disparu.', lieu: 'montagnes_foudre', duree: 18, si: { tout: [MISSION_ADULTE, { metier: ['garde', 'terrain', 'stratege'] }] }, recompense: { ryo: 500, reputation: 10 }, risques: 'Embuscade certaine.', evenement: 'm4_escorte' },
  { id: 'a4_deserteur', rang: 'A', titre: 'Le nom sur la liste', description: 'Traquer un déserteur du village. Le dossier est scellé : tu n’apprendras son nom qu’en le trouvant.', lieu: 'route_commerce', duree: 20, si: { tout: [MISSION_ADULTE, { metier: ['chasseur', 'sensoriel', 'eclaireur'] }] }, recompense: { ryo: 480, reputation: 8 }, risques: 'Mortels.', evenement: 'm4_deserteur' },
  { id: 'a4_hopital', rang: 'A', titre: 'L’hôpital de campagne', description: 'Tenir un hôpital de campagne à la frontière pendant une épidémie… et une offensive.', lieu: 'frontiere_herbe', duree: 30, si: { tout: [MISSION_ADULTE, { metier: 'medical' }] }, recompense: { ryo: 400, reputation: 12 }, risques: 'Épidémie, attaque.', evenement: 'm4_hopital' },
  { id: 'a4_negociation', rang: 'A', titre: 'La table piégée', description: 'Accompagner une négociation secrète avec un village voisin. Quelqu’un, des deux côtés, veut qu’elle échoue.', lieu: 'pays_fer', duree: 15, si: { tout: [MISSION_ADULTE, { metier: ['diplomate', 'renseignement', 'garde'] }] }, recompense: { ryo: 420, reputation: 14 }, risques: 'Trahison.', evenement: 'm4_negociation' },
  { id: 's4_sceau', rang: 'S', titre: 'Ce qui dort sous les carrières', description: 'Un vieux sceau se fissure sous les carrières. Ce qu’il retient ne doit pas sortir.', lieu: 'carrieres_terre', duree: 12, si: { tout: [MISSION_ADULTE, { metier: ['scelleur', 'sensoriel'] }] }, recompense: { ryo: 650, reputation: 12 }, risques: 'Inconnus, et pires que la mort.', evenement: 'm4_sceau' },
  { id: 'a4_pont', rang: 'A', titre: 'Le pont des réfugiés', description: 'Tenir un pont pendant qu’une colonne de réfugiés passe. Une armée arrive dans deux jours.', lieu: 'frontiere_herbe', duree: 10, si: MISSION_ADULTE, recompense: { ryo: 380, reputation: 10 }, risques: 'Mortels.', evenement: 'm4_pont' },
  { id: 's4_forteresse', rang: 'S', titre: 'Les prisonniers du fort', description: 'Libérer des ninjas du village détenus dans une forteresse ennemie, avant leur exécution.', lieu: 'cotes_brume', duree: 16, si: { tout: [MISSION_ADULTE, { rangMin: 'jonin' }] }, recompense: { ryo: 650, reputation: 14 }, risques: 'Mortels.', evenement: 'm4_forteresse' },
  { id: 'a4_sabotage', rang: 'A', titre: 'Les greniers de l’ennemi', description: 'Saboter les réserves d’un village voisin qui prépare une guerre. Des civils travaillent dans les entrepôts.', lieu: 'desert_vent', duree: 14, si: MISSION_ADULTE, recompense: { ryo: 420, reputation: 8 }, risques: 'Élevés.', evenement: 'm4_sabotage' },
];

export const ADULTE: EventDef[] = [
  // ── Famille ──
  {
    ...base,
    id: 'f_premiers_pas',
    titre: 'Un kunai trop grand',
    categorie: 'quotidien',
    lieu: '$maison',
    enchaine: true,
    si: { tout: [FAMILLE, ENFANT_VIVANT] },
    texte: '{Enfant}, {enfantNom}, a cinq ans. Tu {enfant_le} trouves dans la cour avec un de tes kunai, beaucoup trop grand pour sa main, en train de viser le tronc du cerisier. Il le rate. Il recommence. {Conjoint} te regarde depuis la porte : à toi de décider.',
    choix: [
      {
        id: 'enseigner',
        texte: 'Lui montrer comment tenir le kunai',
        effets: [{ drapeau: 'enfant_voie', valeur: 'ninja' }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { ambition: 2 } }],
        resultat: 'Tu poses ta main sur la sienne et tu corriges l’angle. Au troisième essai, le kunai se plante dans l’écorce. Son cri de joie résonne dans toute la rue. Tu sais très exactement à quoi tu viens de l’ouvrir.',
      },
      {
        id: 'refuser',
        texte: 'Lui prendre le kunai : ce ne sera pas sa vie',
        effets: [{ drapeau: 'enfant_voie', valeur: 'civil' }, { ethique: { compassion: 3 } }],
        resultat: 'Tu ranges le kunai très haut. Il pleure, longtemps. Le soir, {conjoint} te dit que tu as bien fait. Tu n’en es pas sûr·e. Tu sais seulement que tu as vu trop d’enfants avec un bandeau.',
      },
    ],
  },
  {
    ...base,
    id: 'f_quartier',
    titre: 'La nuit des ancres noires',
    categorie: 'conflit_clans',
    lieu: '$village',
    enchaine: true,
    si: { tout: [FAMILLE, ENFANT_VIVANT, CONJOINT_VIVANT] },
    texte: [
      { texte: 'Les cloches sonnent au milieu de la nuit. Des ninjas sans bandeau, un tatouage d’ancre noire au poignet, sont entrés dans le quartier par les toits. Ils ne volent rien. Ils viennent tuer les familles des jōnin.' },
      { texte: 'Depuis ta fenêtre, tu vois tout à la fois : au fond de la rue, {@coequipierA} se bat seul contre trois ombres devant sa porte. Dans la cour, {conjoint} tente d’en retenir deux autres. Et dans la chambre, au-dessus, une silhouette se penche sur le lit de {enfantNom}.' },
      { texte: 'Tu as le temps d’en sauver un. Peut-être.' },
    ],
    choix: [
      {
        id: 'enfant',
        texte: 'Monter dans la chambre de {enfantNom}',
        test: {
          ...ATTAQUE_QUARTIER(58),
          succes: { texte: [{ texte: 'Tu traverses le mur plutôt que de prendre l’escalier. La silhouette n’a pas le temps de se retourner. {enfantNom} est dans tes bras, vivant{enfant_e}, et tu ne {enfant_le} lâches plus.' }, ...BILAN_QUARTIER], effets: [SORT_AMI, SORT_CONJOINT, { drapeau: 'quartier_choix', valeur: 'enfant' }] },
          echec: { texte: [{ texte: 'Tu arrives au moment où la lame s’abat. Tu prends le coup à sa place, en partie seulement.' }, ...BILAN_QUARTIER], effets: [SORT_AMI, SORT_CONJOINT, { drapeau: 'enfant_blesse' }, { drapeau: 'quartier_choix', valeur: 'enfant' }] },
        },
      },
      {
        id: 'conjoint',
        texte: 'Sauter dans la cour, aux côtés de {conjoint}',
        test: {
          ...ATTAQUE_QUARTIER(56),
          succes: { texte: [{ texte: 'Dos à dos avec {conjointNom}, comme si vous aviez toujours combattu ensemble. Les deux ombres tombent. Puis vous levez les yeux vers la fenêtre de la chambre, en même temps.' }, ...BILAN_QUARTIER], effets: [SORT_AMI, SORT_ENFANT, { drapeau: 'quartier_choix', valeur: 'conjoint' }] },
          echec: { texte: [{ texte: 'Vous tenez, de justesse, couverts de sang. Trop lentement.' }, ...BILAN_QUARTIER], effets: [SORT_AMI, SORT_ENFANT, { drapeau: 'conjoint_blesse' }, { drapeau: 'quartier_choix', valeur: 'conjoint' }] },
        },
      },
      {
        id: 'ami',
        texte: 'Courir au secours de {@coequipierA}',
        si: AMI_VIVANT,
        test: {
          ...ATTAQUE_QUARTIER(58),
          succes: { texte: [{ texte: 'Tu tombes du toit au milieu des trois ombres. {@coequipierA} rit, du sang plein les dents : « Toujours en retard. » Vous les finissez ensemble. Puis il voit ton visage, et il comprend ce que tu as laissé derrière toi pour venir.' }, ...BILAN_QUARTIER], effets: [SORT_CONJOINT, SORT_ENFANT, { relation: '@coequipierA', delta: { amitie: 20, confiance: 15 } }, { drapeau: 'quartier_choix', valeur: 'ami' }] },
          echec: { texte: [{ texte: 'Vous tenez à deux, à peine.' }, ...BILAN_QUARTIER], effets: [SORT_CONJOINT, SORT_ENFANT, { pnjEtat: '@coequipierA', etat: 'blesse' }, { drapeau: 'quartier_choix', valeur: 'ami' }] },
        },
      },
      {
        id: 'tous',
        texte: 'Tout tenter pour les sauver tous',
        indice: 'Presque impossible. Et si tu échoues, ils paieront tous.',
        test: {
          ...ATTAQUE_QUARTIER(72),
          manches: 4,
          succes: {
            texte: 'Tu ne sais pas comment tu as fait. Personne ne le sait. La chambre, la cour, la rue : tu es partout à la fois, et à l’aube, les ombres sont mortes et les tiens respirent. Le village parlera longtemps de cette nuit.',
            effets: [{ stat: 'social.reputation', delta: 15 }, { drapeau: 'quartier_choix', valeur: 'tous' }, { drapeau: 'quartier_sauve' }, { journal: 'La nuit des ancres noires : tu as sauvé tous les tiens.', importance: 3 }],
          },
          echec: { texte: [{ texte: 'Tu as voulu être partout. Tu n’as été nulle part assez tôt.' }, ...BILAN_QUARTIER], effets: [SORT_AMI, SORT_CONJOINT, SORT_ENFANT, { drapeau: 'quartier_choix', valeur: 'tous' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'f_deuil',
    titre: 'Ce qui reste',
    categorie: 'deuil',
    lieu: '$maison',
    enchaine: true,
    si: { tout: [ACTIF, { un: [{ drapeau: 'conjoint_mort' }, { drapeau: 'enfant_mort' }, { drapeau: 'ami_mort_quartier' }] }, { drapeau: 'deuil_vecu', absent: true }] },
    texte: [
      { si: { drapeau: 'enfant_mort' }, texte: 'La chambre de {enfantNom} est restée telle quelle. Personne n’ose y entrer. Toi, tu y passes des nuits entières, assis·e par terre.' },
      { si: { tout: [{ drapeau: 'conjoint_mort' }, { drapeau: 'enfant_mort', absent: true }] }, texte: 'Le bol de {conjointNom} est toujours sur l’étagère. {Enfant} demande chaque soir quand {conjoint_il} rentre.' },
      { si: { tout: [{ drapeau: 'ami_mort_quartier' }, { drapeau: 'conjoint_mort', absent: true }, { drapeau: 'enfant_mort', absent: true }] }, texte: 'Le nom de {@coequipierA} est gravé sur la stèle. Tu passes devant chaque matin. Il est mort pendant que tu sauvais les tiens. Tu le referais. C’est ça, le pire.' },
      { texte: 'Le rapport dit : commando de l’Ancre noire, douze hommes, un chef en fuite. Le rapport ne dit rien d’autre.' },
    ],
    choix: [
      {
        id: 'vengeance',
        texte: 'Traquer le chef en fuite',
        effets: [{ drapeau: 'deuil_vecu' }, { ethique: { compassion: -6, ambition: 4 } }, { planifier: 'f_vengeance', dansJours: 60 }],
        resultat: 'Tu rends ton gilet pour un mois. Le {kage} ne pose pas de questions. Tu pars avec un nom, un tatouage, et rien d’autre à perdre.',
      },
      {
        id: 'tenir',
        texte: 'Rester, pour ceux qui restent',
        effets: [{ drapeau: 'deuil_vecu' }, { stat: 'attributs.controleEmotionnel', delta: 6 }, { ethique: { compassion: 6 } }],
        resultat: 'Tu fais à manger. Tu fais le ménage. Tu fais semblant, jusqu’à ce qu’un jour, sans prévenir, ce ne soit plus tout à fait semblant.',
      },
      {
        id: 'partir',
        texte: 'Quitter le village : il n’a pas su les protéger',
        effets: [{ drapeau: 'deuil_vecu' }, { statut: 'errant' }, { stat: 'social.loyaute', delta: -25 }, { journal: 'Tu as quitté le village après la nuit des ancres noires.', importance: 3 }],
        resultat: 'Tu poses ton bandeau sur la stèle et tu pars par la grande porte, de jour. Personne n’ose t’arrêter.',
      },
    ],
  },
  {
    ...base,
    id: 'f_vengeance',
    titre: 'L’homme à l’ancre',
    categorie: 'conflit_clans',
    lieu: 'cotes_brume',
    enchaine: true,
    si: { statut: ['actif', 'errant'] },
    texte: 'Tu le retrouves sur un ponton des côtes de la Brume, en train de recoudre un filet comme n’importe quel pêcheur. Il te reconnaît tout de suite. Il pose le filet. « Je me demandais lequel d’entre vous viendrait. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Finir ce qu’il a commencé',
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'suiton',
          causeMort: 'tombé·e en vengeant les siens',
          succes: { texte: 'Il se bat bien. Tu te bats comme quelqu’un qui n’a plus rien à protéger. Il est à genoux sur le ponton, et la mer attend.', effets: [{ drapeau: 'vengeance_accomplie' }] },
          echec: { texte: 'Il te laisse sur le ponton, en sang. « Rentre chez toi. Il te reste peut-être quelqu’un. » Tu ne sais pas si c’est vrai.', effets: [{ blessure: { id: 'ponton', nom: 'Blessures du ponton', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'ecouter',
        texte: 'Lui demander pourquoi',
        effets: [{ indice: 'amiral_familles' }, { ethique: { compassion: 4 } }, { drapeau: 'vengeance_renoncee' }],
        resultat: '« L’Amiral paie pour les familles des jōnin. Il dit que les villages n’apprennent que par la douleur. » Il hausse les épaules. « J’avais faim. » Tu repars sans l’avoir touché. Le vrai nom, désormais, c’est celui de l’Amiral.',
      },
    ],
  },
  {
    ...base,
    id: 'f_enlevement',
    titre: 'Seul·e, au col',
    categorie: 'capture',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: { tout: [FAMILLE, ENFANT_VIVANT] },
    texte: '{enfantNom} n’est pas rentré{enfant_e} de l’Académie. Sur son pupitre, un mot épinglé avec un de tes propres kunai : « Viens seul·e au col de la Foudre. Si on voit un seul bandeau derrière toi, on rend l’enfant à la rivière. » Pas de signature. Juste une ancre noire, dessinée à l’encre.',
    choix: [
      {
        id: 'seul',
        texte: 'Y aller seul·e, comme ils le demandent',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { agilite: 1, force: 1, perception: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'raiton',
          causeMort: 'tombé·e au col de la Foudre en sauvant son enfant',
          succes: { texte: 'Ils étaient six. Ils ne s’attendaient pas à ce qu’on vienne vraiment seul·e, ni à ce que ce soit suffisant. {enfantNom} s’accroche à ton cou tout le long de la descente. Leur chef, lui, est encore en vie, à tes pieds.', effets: [{ drapeau: 'enfant_sauve' }, { stat: 'social.reputation', delta: 6 }] },
          echec: {
            texte: [{ texte: 'Tu n’es pas assez rapide.' }, { si: { drapeau: 'enfant_mort' }, texte: 'Ils tiennent parole : la rivière emporte {enfantNom} sous tes yeux. Tu sautes. Tu ne {enfant_le} retrouves pas.' }, { si: ENFANT_VIVANT, texte: 'Une patrouille de Kumo, alertée par le bruit, tombe sur le camp. Les ravisseurs fuient. {enfantNom} est vivant{enfant_e}, par miracle, pas grâce à toi.' }],
            effets: [{ hasard: [{ poids: 60, effets: [{ drapeau: 'enfant_blesse' }] }, { poids: 40, effets: [{ drapeau: 'enfant_mort' }, { planifier: 'f_deuil', dansJours: 20 }] }] }, { blessure: { id: 'col', nom: 'Blessures du col', gravite: 3, jours: 70 } }],
          },
        },
      },
      {
        id: 'village',
        texte: 'Prévenir le village et monter une opération',
        effets: [
          {
            hasard: [
              { poids: 65, effets: [{ drapeau: 'enfant_sauve' }, { drapeau: 'enlevement_village' }] },
              { poids: 35, effets: [{ drapeau: 'enfant_mort' }, { planifier: 'f_deuil', dansJours: 20 }] },
            ],
          },
          { stat: 'social.loyaute', delta: 4 },
        ],
        resultat: [
          { si: { drapeau: 'enlevement_village' }, texte: 'Les unités de l’ombre encerclent le col en une nuit. {enfantNom} revient sur le dos d’un masque blanc, endormi{enfant_e}, sans une égratignure. Tu as fait confiance au village. Cette fois, il a tenu.' },
          { si: { drapeau: 'enfant_mort' }, texte: 'Ils avaient dit seul·e. Ils ont vu les masques blancs. Ils ont tenu parole.' },
        ],
      },
      {
        id: 'echange',
        texte: 'Proposer de prendre sa place',
        indice: 'Ils te veulent toi, plus que l’enfant.',
        effets: [{ drapeau: 'enfant_sauve' }, { drapeau: 'statut_avant_capture', valeur: 'actif' }, { statut: 'capture' }, { ethique: { compassion: 10, honneur: 6 } }, { journal: 'Tu t’es livré·e pour sauver ton enfant.', importance: 3 }],
        resultat: 'Ils acceptent. Tu les regardes poser {enfantNom} sur le chemin du village, et tu tends les poignets. La corde trempée de chakra te brûle tout de suite. Ça n’a aucune importance.',
        suite: 'x_capture',
      },
    ],
  },

  // ── Camarades ──
  {
    ...base,
    chapitres: [3, 4, 5, 6],
    id: 'cm_deux_camarades',
    titre: 'Un seul bras',
    categorie: 'guerre',
    lieu: 'foret_feu',
    poids: 2,
    repetable: { delaiJours: 900, max: 2 },
    si: { tout: [ACTIF, { rangMin: 'chunin' }, AMI_VIVANT, B_VIVANT] },
    texte: 'La retraite tourne mal. À gauche, {@coequipierA} est cloué{e:@coequipierA} au sol par deux ennemis, un kunai dans la jambe. À droite, {@coequipierB} glisse vers le ravin, retenu par une main à une racine qui cède. Ils t’appellent tous les deux. Tu n’as qu’un seul bras, et une seconde.',
    choix: [
      {
        id: 'ami',
        texte: 'Sauver {@coequipierA}',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          letal: true,
          causeMort: 'tombé·e en couvrant la retraite',
          succes: { texte: 'Les deux ennemis tombent. {@coequipierA} se relève sur ton épaule. Puis vous regardez tous les deux vers le ravin.', effets: [SORT_DE('@coequipierB', 'tombé·e dans un ravin pendant une retraite', 'b'), { relation: '@coequipierA', delta: { amitie: 10, attachement: 10 } }, { drapeau: 'choix_camarade', valeur: 'ami' }] },
          echec: { texte: 'Tu dégages {@coequipierA}, mais tu y laisses du sang. Et le ravin, lui, n’a pas attendu.', effets: [SORT_DE('@coequipierB', 'tombé·e dans un ravin pendant une retraite', 'b'), { blessure: { id: 'retraite', nom: 'Blessures de la retraite', gravite: 2, jours: 30 } }, { drapeau: 'choix_camarade', valeur: 'ami' }] },
        },
      },
      {
        id: 'b',
        texte: 'Plonger vers {@coequipierB}',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { agilite: 2, force: 1 },
          succes: { texte: 'Tes doigts se referment sur son poignet au moment où la racine lâche. Tu le{e:@coequipierB} remontes. Derrière vous, les cris de {@coequipierA} se sont tus.', effets: [SORT_DE('@coequipierA', 'tué·e pendant une retraite, quand personne n’est venu', 'a'), { relation: '@coequipierB', delta: { amitie: 12, attachement: 10 } }, { drapeau: 'choix_camarade', valeur: 'b' }] },
          echec: { texte: 'La racine cède avant que tu arrives. Tu le{e:@coequipierB} rattrapes plus bas, sur une corniche, tous les deux en sang. Et là-haut, {@coequipierA} est seul.', effets: [SORT_DE('@coequipierA', 'tué·e pendant une retraite, quand personne n’est venu', 'a'), { pnjEtat: '@coequipierB', etat: 'blesse' }, { drapeau: 'choix_camarade', valeur: 'b' }] },
        },
      },
      {
        id: 'mission',
        texte: 'Laisser les deux et sauver le rouleau de la mission',
        indice: 'La mission avant les hommes : c’est ce qu’on t’a appris.',
        effets: [SORT_DE('@coequipierA', 'abandonné·e pendant une retraite', 'a'), SORT_DE('@coequipierB', 'abandonné·e pendant une retraite', 'b'), { stat: 'social.loyaute', delta: 8 }, { ethique: { compassion: -12, ambition: 6 } }, { drapeau: 'choix_camarade', valeur: 'mission' }],
        resultat: 'Tu ramènes le rouleau. Le {kage} te décore. Personne, à la cérémonie, n’ose te regarder dans les yeux. Tu ne leur en veux pas.',
      },
    ],
  },
  {
    ...base,
    id: 'cm_eleves',
    titre: 'Tes élèves',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: { tout: [ACTIF, { vu: 'c4_eleves' }] },
    texte: 'Une mission de routine avec tes élèves, à la frontière. Une embuscade. Daichi, le plus bruyant, s’est jeté en avant comme toujours et se retrouve encerclé dans la clairière. Mio, la plus silencieuse, a été emportée par un ninja ennemi vers la rivière. Ils sont tes élèves. Tu leur as promis de les ramener.',
    choix: [
      {
        id: 'daichi',
        texte: 'Foncer dans la clairière pour Daichi',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tombé·e en protégeant ses élèves',
          succes: { texte: 'Daichi est vivant, furieux contre lui-même. Vous courez vers la rivière ensemble.', effets: [{ hasard: [{ poids: 50, effets: [{ drapeau: 'mio_capturee' }] }, { poids: 50, effets: [{ drapeau: 'mio_morte' }] }] }, { drapeau: 'eleve_choisi', valeur: 'daichi' }] },
          echec: { texte: 'Tu ressors de la clairière avec Daichi sur le dos, inconscient. La rivière, elle, est vide.', effets: [{ hasard: [{ poids: 50, effets: [{ drapeau: 'mio_capturee' }] }, { poids: 50, effets: [{ drapeau: 'mio_morte' }] }] }, { blessure: { id: 'clairiere', nom: 'Blessures de la clairière', gravite: 2, jours: 40 } }, { drapeau: 'eleve_choisi', valeur: 'daichi' }] },
        },
      },
      {
        id: 'mio',
        texte: 'Poursuivre le ravisseur de Mio',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { taijutsu: 1 },
          letal: true,
          causeMort: 'tombé·e en protégeant ses élèves',
          succes: { texte: 'Tu le rattrapes au gué. Mio s’échappe pendant que tu le combats, et c’est elle qui l’achève, d’un pouvoir que personne ne lui connaissait. Puis vous revenez à la clairière.', effets: [{ hasard: [{ poids: 50, effets: [{ drapeau: 'daichi_blesse' }] }, { poids: 50, effets: [{ drapeau: 'daichi_mort' }] }] }, { drapeau: 'eleve_choisi', valeur: 'mio' }] },
          echec: { texte: 'Mio est sauvée, pas grâce à toi : elle a mordu son ravisseur et s’est jetée à l’eau. Dans la clairière, il est trop tard pour décider de quoi que ce soit.', effets: [{ hasard: [{ poids: 50, effets: [{ drapeau: 'daichi_blesse' }] }, { poids: 50, effets: [{ drapeau: 'daichi_mort' }] }] }, { drapeau: 'eleve_choisi', valeur: 'mio' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'cm_eleves_suite',
    titre: 'Ce qu’on dit aux parents',
    categorie: 'deuil',
    lieu: '$village',
    si: { tout: [ACTIF, { un: [{ drapeau: 'mio_morte' }, { drapeau: 'daichi_mort' }, { drapeau: 'mio_capturee' }] }, { drapeau: 'eleves_suite_vue', absent: true }] },
    poids: 40,
    texte: [
      { si: { drapeau: 'daichi_mort' }, texte: 'La mère de Daichi t’ouvre la porte. Elle sait avant que tu parles. Elle te demande seulement s’il a eu peur. Tu mens.' },
      { si: { drapeau: 'mio_morte' }, texte: 'On retrouve Mio trois jours plus tard, en aval. Son père, un artisan, ne dit rien. Il te tend le petit oiseau de bois qu’elle sculptait pour toi.' },
      { si: { drapeau: 'mio_capturee' }, texte: 'Mio n’est ni morte, ni rentrée. Un rapport d’éclaireur parle d’une fillette au pouvoir étrange, vue dans un camp de l’Ancre noire, de l’autre côté de la frontière.' },
    ],
    choix: [
      {
        id: 'chercher',
        texte: 'Aller chercher Mio, ordre ou pas',
        si: { drapeau: 'mio_capturee' },
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { agilite: 1, discretion: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e en allant chercher son élève',
          succes: { texte: 'Tu la ramènes. Elle ne parle pas pendant tout le voyage. Au village, devant la porte de son père, elle te prend la main. « Je savais que tu viendrais. »', effets: [{ drapeau: 'eleves_suite_vue' }, { drapeau: 'mio_capturee', retirer: true }, { drapeau: 'mio_sauvee' }, { stat: 'social.loyaute', delta: -4 }, { ethique: { compassion: 8, honneur: 6 } }] },
          echec: { texte: 'Le camp est vide quand tu arrives, ou presque. Une poupée de bois, et des traces vers la mer. Tu continueras à chercher. Longtemps.', effets: [{ drapeau: 'eleves_suite_vue' }, { blessure: { id: 'camp', nom: 'Blessures du camp', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'porter',
        texte: 'Porter ce poids, et continuer à enseigner',
        effets: [{ drapeau: 'eleves_suite_vue' }, { stat: 'attributs.controleEmotionnel', delta: 4 }, { ethique: { compassion: 3 } }],
        resultat: 'Tu prends une nouvelle équipe l’année suivante. Tu es plus dur·e avec eux qu’avec les précédents. Ils ne savent pas pourquoi. Toi, tu le sais à chaque exercice.',
      },
    ],
  },

  // ── Missions périlleuses ──
  {
    ...base,
    id: 'm4_espionnage',
    titre: 'L’œil dans le village voisin',
    categorie: 'mission',
    lieu: 'carrieres_terre',
    enchaine: true,
    si: ACTIF,
    texte: 'Trois semaines sous un faux nom, marchand de papier dans un village qui n’est pas le tien. Tu as trouvé où dorment les plans : dans le bureau d’un conseiller, au deuxième étage de la tour. Ce soir, la garde change à minuit. Ce soir ou jamais.',
    choix: [
      {
        id: 'infiltrer',
        texte: 'Entrer de nuit et copier les plans',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { discretion: 2, perception: 1, intellect: 1 },
          maitrises: { genjutsu: 1 },
          succes: {
            texte: 'Tu copies les plans à la lueur d’une luciole, page après page. Au matin, le marchand de papier a disparu. Trois semaines plus tard, le {kage} déplace deux armées grâce à toi.',
            effets: [{ mission: 'a4_espionnage', statut: 'reussie' }, { stat: 'attributs.discretion', delta: 3 }, { secret: 'plans_voisins' }],
          },
          echec: {
            texte: 'Une marche grince. Une lanterne s’allume. Tu sautes par la fenêtre, et un filet de chakra t’attend en bas.',
            effets: [{ mission: 'a4_espionnage', statut: 'echouee' }, { drapeau: 'statut_avant_capture', valeur: 'actif' }, { statut: 'capture' }],
            suite: 'x_capture',
          },
        },
      },
      {
        id: 'seduire',
        texte: 'Gagner la confiance du conseiller, lentement',
        duree: 60,
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: {
            texte: 'Des semaines de thé, de jeux de go, de confidences. Un soir, il te montre lui-même les plans, fier comme un enfant. Il te considère comme un ami. Il ne saura jamais.',
            effets: [{ mission: 'a4_espionnage', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 3 }, { ethique: { honneur: -4 } }, { secret: 'plans_voisins' }],
          },
          echec: {
            texte: 'Il est plus malin que tu ne le croyais. Un soir, il sert le thé et dit, sans te regarder : « Tu devrais partir avant demain. Je t’aimais bien. » Tu pars. Sans les plans.',
            effets: [{ mission: 'a4_espionnage', statut: 'echouee' }, { stat: 'social.reputation', delta: -3 }],
          },
        },
      },
      {
        id: 'temoin',
        texte: 'Une servante t’a vu fouiller. L’éliminer avant qu’elle parle',
        effets: [{ mission: 'a4_espionnage', statut: 'reussie' }, { ethique: { compassion: -14 } }, { stat: 'social.reputationOmbre', delta: 6 }, { drapeau: 'servante_tuee' }, { journal: 'Tu as tué une servante innocente pour protéger ta mission.', importance: 2 }],
        resultat: 'Ça ne fait presque pas de bruit. Les plans sont à toi. Tu les rapportes, on te félicite. Personne ne te demande comment. Toi, tu te souviendras toujours de son tablier, plié sur la chaise.',
      },
    ],
  },
  {
    ...base,
    id: 'm4_assassinat',
    titre: 'Le ministre',
    categorie: 'mission',
    lieu: 'marche_noir',
    enchaine: true,
    si: ACTIF,
    texte: 'Tu es sur le toit depuis deux heures. Le ministre est seul dans son bureau, comme prévu. Puis la porte s’ouvre : sa fille, sept ans, en chemise de nuit, qui ne trouve pas le sommeil. Il la prend sur ses genoux et lui raconte une histoire. Tu entends chaque mot.',
    choix: [
      {
        id: 'frapper',
        texte: 'Frapper maintenant : la mission ne connaît pas d’enfants',
        effets: [{ mission: 's4_assassinat', statut: 'reussie' }, { ethique: { compassion: -16, ambition: 4 } }, { stat: 'social.reputationOmbre', delta: 10 }, { drapeau: 'ministre_tue_devant_enfant' }, { planifier: 'x_fille_ministre', dansJours: 3600 }],
        resultat: 'Un senbon, une seule fois. Il s’endort au milieu d’une phrase, et sa fille croit qu’il dort. Tu es déjà loin quand elle commence à crier. Elle a vu une ombre sur le toit. Elle ne l’oubliera jamais.',
      },
      {
        id: 'attendre',
        texte: 'Attendre qu’elle reparte se coucher',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { discretion: 2, agilite: 1 },
          maitrises: { arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tué·e par les gardes d’un ministre',
          succes: { texte: 'Tu attends une heure de plus. Les gardes changent, l’un d’eux lève les yeux vers le toit. Tu frappes avant lui, puis le ministre, en silence. Sa fille dort dans la pièce d’à côté. Elle ne saura qu’au matin.', effets: [{ mission: 's4_assassinat', statut: 'reussie' }, { stat: 'social.reputationOmbre', delta: 6 }] },
          echec: { texte: 'L’heure de trop. Les gardes t’ont vu. Tu t’enfuis par les toits, blessé·e, mission manquée.', effets: [{ mission: 's4_assassinat', statut: 'echouee' }, { blessure: { id: 'toits', nom: 'Flèches des gardes', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'renoncer',
        texte: 'Renoncer, et dire au Conseil que la cible était trop gardée',
        effets: [{ mission: 's4_assassinat', statut: 'echouee' }, { ethique: { compassion: 8, honneur: 2 } }, { stat: 'social.suspicion', delta: 8 }],
        resultat: 'Tu redescends du toit. Le Conseil ne te croit pas tout à fait. Le ministre continuera à vendre des secrets. Sa fille continuera à avoir un père. Tu as choisi lequel de ces deux poids tu porterais.',
      },
    ],
  },
  {
    ...base,
    id: 'm4_escorte',
    titre: 'La litière du daimyō',
    categorie: 'mission',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: ACTIF,
    texte: 'Au milieu du col, des rochers roulent derrière et devant la colonne : l’embuscade. Des flèches de foudre pleuvent sur la litière. {@coequipierB}, à l’arrière, est pris sous un éboulis. Le daimyō hurle ton nom.',
    choix: [
      {
        id: 'daimyo',
        texte: 'Protéger le daimyō, coûte que coûte',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'raiton',
          causeMort: 'tombé·e en protégeant le daimyō',
          succes: { texte: 'Le daimyō arrive à la capitale sans une égratignure, et il le racontera à toute sa cour.', effets: [{ mission: 'a4_escorte', statut: 'reussie' }, { si: B_VIVANT, alors: [SORT_DE('@coequipierB', 'écrasé·e sous un éboulis au col de la Foudre', 'b')] }] },
          echec: { texte: 'Le daimyō survit, blessé. Il ne te le pardonnera pas.', effets: [{ mission: 'a4_escorte', statut: 'echouee' }, { si: B_VIVANT, alors: [SORT_DE('@coequipierB', 'écrasé·e sous un éboulis au col de la Foudre', 'b')] }] },
        },
      },
      {
        id: 'camarade',
        texte: 'Dégager {@coequipierB} de l’éboulis',
        si: B_VIVANT,
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { force: 3 },
          succes: { texte: 'Tu soulèves le rocher. {@coequipierB} respire. Derrière toi, la litière est vide : le daimyō a été enlevé.', effets: [{ mission: 'a4_escorte', statut: 'echouee' }, { relation: '@coequipierB', delta: { amitie: 15, attachement: 12 } }, { stat: 'social.reputation', delta: -6 }, { drapeau: 'daimyo_enleve' }] },
          echec: { texte: 'Le rocher ne bouge pas assez vite. Tu perds les deux.', effets: [{ mission: 'a4_escorte', statut: 'echouee' }, { pnjEtat: '@coequipierB', etat: 'mort', cause: 'écrasé·e sous un éboulis au col de la Foudre' }, { drapeau: 'daimyo_enleve' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm4_deserteur',
    titre: 'Le nom sur la liste',
    categorie: 'mission',
    lieu: 'route_commerce',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { pnj: '@rival', etat: ['vivant', 'blesse'] }, texte: 'Tu le trouves dans une auberge de la route du sel, et le dossier s’ouvre enfin : {@rival}. Ton rival d’enfance. Il a quitté le village il y a deux ans, avec un rouleau interdit. Il pose ses baguettes. « Je savais que ce serait toi. »' },
      { si: { non: { pnj: '@rival', etat: ['vivant', 'blesse'] } }, texte: 'Tu le trouves dans une auberge de la route du sel : un ancien camarade d’Académie, assis deux rangs derrière toi pendant six ans. Il a déserté avec un rouleau interdit. Il pose ses baguettes. « Je savais que ce serait toi. »' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Le ramener, mort ou vif',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e face à un ancien camarade devenu déserteur',
          succes: { texte: 'Vous vous connaissez trop bien : chaque coup est une vieille conversation. À la fin, il est à terre, et il sourit presque.', effets: [{ mission: 'a4_deserteur', statut: 'reussie' }] },
          echec: { texte: 'Il te laisse en vie. « On est quittes pour l’Académie. » Il emporte le rouleau.', effets: [{ mission: 'a4_deserteur', statut: 'echouee' }, { blessure: { id: 'deserteur', nom: 'Blessures d’un vieux camarade', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'ecouter',
        texte: 'Le laisser t’expliquer pourquoi',
        effets: [{ mission: 'a4_deserteur', statut: 'echouee' }, { indice: 'rouleau_conseil' }, { ethique: { compassion: 6 } }, { stat: 'social.suspicion', delta: 6 }],
        resultat: '« Le rouleau prouve ce que le Conseil a fait pendant la guerre. » Il le pose sur la table, entre vous. Tu le lis. Tu rentres au village les mains vides, et avec une question que tu ne pourras plus jamais oublier.',
      },
    ],
  },
  {
    ...base,
    id: 'm4_hopital',
    titre: 'L’hôpital de campagne',
    categorie: 'mission',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    texte: 'Trente lits, deux médecins, une fièvre qui tue en trois jours. Et ce matin, l’offensive : les brancardiers ramènent en même temps {@coequipierA}, une lance dans le ventre, et un enfant ennemi de dix ans, ramassé dans les décombres. Tu n’as assez de chakra que pour un des deux.',
    choix: [
      {
        id: 'ami',
        texte: 'Soigner {@coequipierA}',
        si: AMI_VIVANT,
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleChakra: 3, intellect: 1 },
          maitrises: { shosen: 2 },
          succes: { texte: '{@coequipierA} vivra. Quand tu te retournes vers l’autre lit, le drap est déjà remonté.', effets: [{ mission: 'a4_hopital', statut: 'reussie' }, { relation: '@coequipierA', delta: { amitie: 10 } }, { ethique: { compassion: -4 } }] },
          echec: { texte: 'Tu y mets tout ton chakra. Ce n’est pas assez. Tu restes assis·e entre les deux lits jusqu’au soir.', effets: [{ mission: 'a4_hopital', statut: 'echouee' }, { pnjEtat: '@coequipierA', etat: 'mort', cause: 'mort·e de ses blessures dans un hôpital de campagne' }] },
        },
      },
      {
        id: 'enfant',
        texte: 'Soigner l’enfant ennemi',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 3, intellect: 1 },
          maitrises: { shosen: 2 },
          succes: {
            texte: [{ texte: 'L’enfant ouvre les yeux. Il ne parle pas ta langue, mais il serre ton doigt.' }, { si: AMI_VIVANT, texte: 'Le médecin de garde a tenté ce qu’il pouvait pour {@coequipierA}.' }],
            effets: [{ mission: 'a4_hopital', statut: 'reussie' }, { ethique: { compassion: 12, honneur: 4 } }, { si: AMI_VIVANT, alors: [{ hasard: [{ poids: 1, effets: [{ pnjEtat: '@coequipierA', etat: 'blesse' }] }, { poids: 1, effets: [{ pnjEtat: '@coequipierA', etat: 'mort', cause: 'mort·e dans un hôpital de campagne, pendant qu’on soignait un enfant ennemi' }] }] }] }, { drapeau: 'enfant_ennemi_sauve' }],
          },
          echec: { texte: 'L’enfant meurt quand même. Et tu n’as plus de chakra pour personne.', effets: [{ mission: 'a4_hopital', statut: 'echouee' }, { si: AMI_VIVANT, alors: [{ pnjEtat: '@coequipierA', etat: 'blesse' }] }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm4_negociation',
    titre: 'La table piégée',
    categorie: 'mission',
    lieu: 'pays_fer',
    enchaine: true,
    si: ACTIF,
    texte: 'La négociation se tient sous la garde des samouraïs. Au deuxième jour, tu vois un garde de ton propre village glisser une fiole dans la théière de l’envoyé adverse. Si l’envoyé meurt ici, la guerre reprend. Si tu l’empêches, ton village saura que tu as trahi l’un des siens.',
    choix: [
      {
        id: 'renverser',
        texte: 'Renverser la théière, « par maladresse »',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { agilite: 2, charisme: 1 },
          succes: { texte: 'Le thé se répand sur la table, l’envoyé rit de ta maladresse. Le garde te fixe. La paix est signée trois jours plus tard. Le garde, lui, n’oubliera pas.', effets: [{ mission: 'a4_negociation', statut: 'reussie' }, { ethique: { honneur: 6, compassion: 4 } }, { drapeau: 'ennemi_au_conseil' }] },
          echec: { texte: 'Ton geste est trop visible. Le garde crie à la trahison, les samouraïs dégainent, la table se renverse pour de bon. La négociation échoue, et tout le monde t’accuse.', effets: [{ mission: 'a4_negociation', statut: 'echouee' }, { stat: 'social.suspicion', delta: 15 }] },
        },
      },
      {
        id: 'laisser',
        texte: 'Ne rien voir : ce n’est pas ta décision',
        effets: [{ mission: 'a4_negociation', statut: 'echouee' }, { ethique: { compassion: -8 } }, { stat: 'social.loyaute', delta: 6 }, { drapeau: 'guerre_relancee' }],
        resultat: 'L’envoyé s’effondre au milieu d’une phrase. Les samouraïs ferment les portes. La guerre reprend au printemps. Au village, quelqu’un te serre la main un peu trop longtemps.',
      },
      {
        id: 'denoncer',
        texte: 'Saisir le poignet du garde devant tout le monde',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 2, force: 1 },
          maitrises: { taijutsu: 1 },
          letal: true,
          causeMort: 'tué·e par un traître de son propre village, à la table de paix',
          succes: { texte: 'Le garde sort un kunai ; tu le désarmes devant les deux délégations. La fiole roule sur la table. La paix est signée, et ton nom avec, en bas, comme témoin.', effets: [{ mission: 'a4_negociation', statut: 'reussie' }, { stat: 'social.reputation', delta: 12 }, { stat: 'social.influence', delta: 8 }] },
          echec: { texte: 'Le garde est plus rapide. Sa lame te traverse l’épaule, et il s’enfuit avant que les samouraïs referment les portes.', effets: [{ mission: 'a4_negociation', statut: 'echouee' }, { blessure: { id: 'table', nom: 'Lame du traître', gravite: 2, jours: 40 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm4_sceau',
    titre: 'Ce qui dort sous les carrières',
    categorie: 'mission',
    lieu: 'carrieres_terre',
    enchaine: true,
    si: ACTIF,
    texte: 'Au fond de la galerie, le sceau se fissure comme une vitre. Derrière, quelque chose respire, et chaque respiration fait trembler la montagne. Pour le refermer, il faut nourrir le sceau d’un chakra vivant. Beaucoup de chakra.',
    choix: [
      {
        id: 'nourrir',
        texte: 'Y verser ton propre chakra, jusqu’au bout',
        effets: [{ mission: 's4_sceau', statut: 'reussie' }, { stat: 'jauges.chakraMax', delta: -15 }, { stat: 'attributs.controleChakra', delta: 4 }, { ethique: { honneur: 6 } }, { journal: 'Tu as refermé un sceau ancien avec ton propre chakra.', importance: 2 }],
        resultat: 'Tu poses les deux mains sur le sceau, et il boit. Quand il se referme, tu ne sens plus tes bras. Ta réserve ne reviendra jamais tout à fait. Ce qui dort dessous dort encore.',
      },
      {
        id: 'combattre',
        texte: 'Laisser la chose sortir, et la combattre',
        test: {
          type: 'combat',
          difficulte: 66,
          attributs: { force: 1, controleChakra: 1, perception: 1 },
          maitrises: { ninjutsu: 1 },
          letal: true,
          manches: 3,
          causeMort: 'dévoré·e par ce qui dormait sous les carrières',
          succes: { texte: 'Elle sort, aveugle, immense. Tu la combats dans le noir jusqu’à ce qu’elle retombe et que tu puisses la sceller de nouveau, affaiblie. Tu ressors à l’aube, couvert·e de poussière et de quelque chose qui n’est pas du sang.', effets: [{ mission: 's4_sceau', statut: 'reussie' }, { stat: 'social.reputation', delta: 10 }] },
          echec: { texte: 'Elle t’écrase contre la paroi, puis se rendort d’elle-même, repue. On te retrouve trois jours plus tard.', effets: [{ mission: 's4_sceau', statut: 'echouee' }, { blessure: { id: 'carrieres_bete', nom: 'Écrasé·e par la chose', gravite: 3, jours: 90 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm4_pont',
    titre: 'Le pont des réfugiés',
    categorie: 'mission',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    texte: 'Deux jours que la colonne passe : des vieux, des charrettes, des enfants qui portent des enfants. L’avant-garde ennemie arrive par la plaine. Il reste trois cents personnes de l’autre côté. Ton ordre : faire sauter le pont avant que l’ennemi ne l’atteigne.',
    choix: [
      {
        id: 'tenir',
        texte: 'Tenir le pont jusqu’au dernier réfugié',
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e en tenant un pont pour des réfugiés',
          succes: { texte: 'Le dernier réfugié passe, une vieille femme qui te bénit sans s’arrêter. Puis tu fais sauter le pont, avec l’avant-garde dessus.', effets: [{ mission: 'a4_pont', statut: 'reussie' }, { ethique: { compassion: 10, honneur: 6 } }, { stat: 'social.reputation', delta: 6 }] },
          echec: { texte: 'Tu tiens assez pour la moitié d’entre eux. Puis tu dois faire sauter le pont avec l’autre moitié de l’autre côté.', effets: [{ mission: 'a4_pont', statut: 'echouee' }, { blessure: { id: 'pont_refugies', nom: 'Blessures du pont', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'ordre',
        texte: 'Obéir : faire sauter le pont maintenant',
        effets: [{ mission: 'a4_pont', statut: 'reussie' }, { stat: 'social.loyaute', delta: 6 }, { ethique: { compassion: -12 } }, { drapeau: 'pont_saute' }],
        resultat: 'Le pont s’effondre dans la rivière. De l’autre côté, trois cents visages te regardent. Puis l’avant-garde arrive derrière eux.',
      },
    ],
  },
  {
    ...base,
    id: 'm4_forteresse',
    titre: 'Les prisonniers du fort',
    categorie: 'mission',
    lieu: 'cotes_brume',
    enchaine: true,
    si: ACTIF,
    texte: 'Huit ninjas de ton village attendent l’exécution dans les cellules d’un fort côtier. Tu as un plan, une nuit sans lune, et {@coequipierB} pour couvrir ta sortie. À mi-chemin des cellules, une alarme sonne. Tu as encore le temps d’ouvrir quatre cellules, ou de retourner chercher {@coequipierB}, encerclé à l’entrée.',
    choix: [
      {
        id: 'prisonniers',
        texte: 'Ouvrir les cellules',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { agilite: 1, discretion: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          elementAdverse: 'suiton',
          causeMort: 'tombé·e en libérant des prisonniers',
          succes: { texte: 'Quatre portes, puis huit : les prisonniers libérés se battent avec ce qu’ils trouvent. Vous sortez par la mer.', effets: [{ mission: 's4_forteresse', statut: 'reussie' }, { si: B_VIVANT, alors: [SORT_DE('@coequipierB', 'tombé·e en couvrant une évasion au fort côtier', 'b')] }] },
          echec: { texte: 'Tu en sors trois. Les autres hurlent derrière les portes quand vous plongez dans la mer.', effets: [{ mission: 's4_forteresse', statut: 'echouee' }, { si: B_VIVANT, alors: [SORT_DE('@coequipierB', 'tombé·e en couvrant une évasion au fort côtier', 'b')] }] },
        },
      },
      {
        id: 'camarade',
        texte: 'Retourner chercher {@coequipierB}',
        si: B_VIVANT,
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e en revenant chercher un camarade',
          succes: { texte: '{@coequipierB} est vivant{e:@coequipierB}. Les huit prisonniers seront exécutés à l’aube. Leurs familles sauront qui a choisi.', effets: [{ mission: 's4_forteresse', statut: 'echouee' }, { relation: '@coequipierB', delta: { amitie: 15, attachement: 15 } }, { stat: 'social.reputation', delta: -8 }, { drapeau: 'prisonniers_executes' }] },
          echec: { texte: 'Tu arrives trop tard pour {@coequipierB}, et trop tard pour les cellules.', effets: [{ mission: 's4_forteresse', statut: 'echouee' }, { pnjEtat: '@coequipierB', etat: 'mort', cause: 'tombé·e au fort côtier' }, { drapeau: 'prisonniers_executes' }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm4_sabotage',
    titre: 'Les greniers de l’ennemi',
    categorie: 'mission',
    lieu: 'desert_vent',
    enchaine: true,
    si: ACTIF,
    texte: 'Les entrepôts sont pleins de riz, d’armes et d’huile. Ils sont aussi pleins de dockers qui dorment sur les sacs, parce qu’ils n’ont nulle part ailleurs où dormir. Tes parchemins explosifs sont en place.',
    choix: [
      {
        id: 'tout',
        texte: 'Tout faire sauter maintenant',
        effets: [{ mission: 'a4_sabotage', statut: 'reussie' }, { ethique: { compassion: -12 } }, { stat: 'social.reputationOmbre', delta: 6 }, { drapeau: 'dockers_tues' }],
        resultat: 'Le ciel s’allume jusqu’à la mer. La guerre qu’ils préparaient n’aura pas lieu cette année. Le lendemain, dans le port, on compte les morts à voix haute.',
      },
      {
        id: 'reveiller',
        texte: 'Réveiller les dockers et les faire sortir d’abord',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { charisme: 1, agilite: 1, discretion: 1 },
          maitrises: { taijutsu: 1 },
          letal: true,
          causeMort: 'tué·e par les gardes des entrepôts',
          succes: { texte: 'Les dockers s’enfuient, les gardes accourent, et les entrepôts sautent pendant que tu les retiens. Pas un civil mort. Tu repars avec une brûlure dans le dos et la conscience presque tranquille.', effets: [{ mission: 'a4_sabotage', statut: 'reussie' }, { ethique: { compassion: 8, honneur: 4 } }] },
          echec: { texte: 'Un docker crie trop fort. Les gardes arrivent avant que la mèche soit allumée. Tu fuis, les entrepôts intacts.', effets: [{ mission: 'a4_sabotage', statut: 'echouee' }, { blessure: { id: 'entrepot', nom: 'Brûlures de l’entrepôt', gravite: 2, jours: 30 } }] },
        },
      },
    ],
  },
  {
    ...base,
    chapitres: [6],
    id: 'x_fille_ministre',
    titre: 'L’ombre sur le toit',
    categorie: 'trahison',
    lieu: '$village',
    enchaine: true,
    si: { statut: ['actif', 'errant', 'deserteur', 'exile'] },
    texte: 'Une jeune femme t’attend devant ta porte, un sabre à la ceinture. Dix ans ont passé. « Il me racontait une histoire. Je n’ai jamais su la fin. » Elle dégaine.',
    choix: [
      {
        id: 'combattre',
        texte: 'Te défendre',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tué·e par la fille d’un homme qu’on avait assassiné',
          succes: { texte: 'Elle s’est entraînée dix ans pour ce jour. Toi, toute ta vie. Elle est à terre, et elle attend.', effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }] },
          echec: { texte: 'Elle t’ouvre le bras, puis s’arrête, la pointe sur ta gorge. Elle tremble. Elle range son sabre et s’en va. Tu ne sais pas qui des deux a perdu.', effets: [{ blessure: { id: 'fille_ministre', nom: 'Le sabre de la fille du ministre', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'fin',
        texte: 'Lui raconter la fin de l’histoire',
        effets: [{ ethique: { compassion: 8, honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 4 }],
        resultat: 'Tu la connais : tu l’as entendue depuis le toit, ce soir-là, jusqu’à la dernière phrase. Tu la lui racontes. Elle pleure, le sabre à la main. Puis elle le laisse tomber.',
      },
    ],
  },
];
