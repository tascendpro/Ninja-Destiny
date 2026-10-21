import type { Condition, EventDef } from '../../engine/types';

/**
 * Tuer, au village : le coup de grâce pendant un examen, le sang versé dans une rue, le rival qui vient la nuit.
 * Quelqu'un peut te retenir (l'arbitre, ton sensei, un·e ami·e), selon qui est là et avec quelle probabilité.
 * Et si personne ne t'arrête, le village juge : il peut pardonner, punir, ou bannir.
 */
const ACTIF: Condition = { statut: 'actif' };
const RIVAL_VIVANT: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };
const SENSEI_VIVANT: Condition = { pnj: '@sensei', etat: ['vivant', 'blesse'] };
const AMI_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const ISSUE = (v: string): Condition => ({ drapeau: 'coup_issue', egal: v });

export const VIOLENCE: EventDef[] = [
  // ── Le coup de grâce, au tournoi de l'examen chūnin ───────────
  {
    chapitre: 2,
    arc: 'examens',
    id: 'c2_coup_de_grace',
    titre: 'Le bras de l’arbitre',
    categorie: 'examen',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: RIVAL_VIVANT, texte: '{@rival} est à terre, au milieu de l’arène, une jambe pliée dans un angle qui n’est pas le bon. {Il:@rival} essaie de se relever, et n’y arrive pas. Au-dessus de vous, des milliers de visages retiennent leur souffle.' },
      { si: { non: RIVAL_VIVANT }, texte: 'Le genin étranger est à terre, au milieu de l’arène. Celui qui a tué deux candidats dans la forêt. Il crache du sang et te regarde avec un sourire tordu, comme s’il te mettait au défi.' },
      { texte: 'L’arbitre lève lentement le bras pour annoncer la fin du combat. Tu as une seconde avant que ce bras retombe. Une seule.' },
    ],
    choix: [
      {
        id: 'saluer',
        texte: 'Reculer et saluer',
        effets: [{ ethique: { honneur: 5 } }, { stat: 'social.reputation', delta: 4 }, { si: RIVAL_VIVANT, alors: [{ relation: '@rival', delta: { respect: 10, hostilite: -5 } }] }],
        suite: 'c2_verdict',
        resultat: [
          { si: RIVAL_VIVANT, texte: 'Tu recules d’un pas et tu t’inclines. {@rival} te regarde, longtemps. Pas de remerciement, jamais. Mais dans ses yeux, quelque chose vient de changer de place.' },
          { si: { non: RIVAL_VIVANT }, texte: 'Tu t’inclines devant un adversaire qui ne l’aurait jamais fait pour toi. Dans la tribune des examinateurs, quelqu’un écrit une ligne. Une bonne ligne.' },
        ],
      },
      {
        id: 'briser',
        texte: 'Lui briser le bras, pour qu’il se souvienne',
        effets: [{ stat: 'social.reputationOmbre', delta: 3 }, { ethique: { compassion: -4 } }, { si: RIVAL_VIVANT, alors: [{ relation: '@rival', delta: { hostilite: 15, rivalite: 8 } }, { pnjEtat: '@rival', etat: 'blesse' }] }],
        suite: 'c2_verdict',
        resultat: 'Le craquement s’entend jusqu’au dernier rang. L’arbitre baisse le bras une demi-seconde trop tard. Le public hésite entre l’ovation et le silence. Il choisit un peu des deux.',
      },
      {
        id: 'frapper',
        texte: 'Frapper à mort avant que le bras ne retombe',
        indice: 'Quelqu’un essaiera peut-être de t’arrêter. Peut-être pas.',
        effets: [
          { drapeau: 'coup_issue', valeur: 'tue' },
          { hasard: [{ poids: 60, effets: [{ drapeau: 'coup_issue', valeur: 'arbitre' }] }, { poids: 40, effets: [] }] },
          { si: { tout: [ISSUE('tue'), SENSEI_VIVANT] }, alors: [{ hasard: [{ poids: 45, effets: [{ drapeau: 'coup_issue', valeur: 'sensei' }] }, { poids: 55, effets: [] }] }] },
          {
            si: ISSUE('tue'),
            alors: [
              { drapeau: 'tournoi_sang' },
              { drapeau: 'ennemis_acheves', incr: 1 },
              { stat: 'social.reputationOmbre', delta: 12 },
              { stat: 'social.reputation', delta: -8 },
              { stat: 'social.suspicion', delta: 8 },
              { ethique: { compassion: -10 } },
              { si: SENSEI_VIVANT, alors: [{ relation: '@sensei', delta: { confiance: -15, respect: -5 } }] },
              {
                si: RIVAL_VIVANT,
                alors: [{ pnjEtat: '@rival', etat: 'mort', cause: 'un coup porté après la fin du combat, en finale de l’examen chūnin' }, { drapeau: 'rival_tue' }, { drapeau: 'tueur_village' }, { retour: 'vc_clan_rival', chance: 0.85, entre: [90, 300] }, { journal: 'Au tournoi de l’examen chūnin, tu as tué {@rival} après la fin du combat.', importance: 3 }],
                sinon: [{ drapeau: 'incident_examen' }, { retour: 'vc_incident', chance: 1, entre: [10, 40] }, { journal: 'Au tournoi de l’examen chūnin, tu as tué un genin étranger après la fin du combat.', importance: 3 }],
              },
            ],
            sinon: [
              { drapeau: 'tournoi_violence' },
              { stat: 'social.suspicion', delta: 4 },
              { stat: 'social.reputationOmbre', delta: 3 },
              { si: ISSUE('sensei'), alors: [{ relation: '@sensei', delta: { confiance: -6, attachement: 4 } }] },
            ],
          },
        ],
        suite: 'c2_verdict',
        resultat: [
          { si: ISSUE('arbitre'), texte: 'Ta main ne finit pas son geste. L’arbitre est entre vous, si vite que tu ne l’as pas vu bouger, et il te tient le poignet comme dans un étau. « Le combat est terminé. » Il le dit doucement. C’est ce qui fait le plus peur.' },
          { si: ISSUE('sensei'), texte: 'Une ombre tombe de la tribune. {@sensei}, entre toi et ton adversaire, ta lame bloquée entre deux doigts. Pas un cri. Un regard, comme sur quelqu’un d’inconnu. « Pas comme ça. Jamais comme ça. »' },
          { si: { tout: [ISSUE('tue'), { pnj: '@rival', etat: 'mort' }, { drapeau: 'incident_examen', absent: true }] }, texte: 'Personne n’arrive à temps. {@rival} ne se relève pas. Le bras de l’arbitre retombe sur un silence que tu entendras toute ta vie. Dans la tribune de son clan, une femme se met à hurler.' },
          { si: { tout: [ISSUE('tue'), { drapeau: 'incident_examen' }] }, texte: 'Personne n’arrive à temps. Le genin étranger ne se relève pas. Son village quitte la tribune d’un seul mouvement. Ce soir, des messagers partiront dans les deux sens, et ce ne sont pas des lettres de félicitations.' },
        ],
      },
    ],
  },

  // ── Le sang dans la rue ───────────────────────────────────────
  {
    chapitre: 2,
    chapitres: [2, 3, 4, 5, 6],
    arc: 'crise',
    id: 'v_provocation',
    titre: 'L’ivrogne de la rue des lanternes',
    categorie: 'reputation',
    lieu: '$village',
    poids: 3,
    si: { tout: [ACTIF, { age: { min: 15 } }, { rangMin: 'genin' }] },
    texte: 'Un chūnin ivre te barre la route devant la taverne. Il crache le nom de {clanOuFamille}, puis celui de {parent}, avec des mots que personne n’a jamais osé dire devant toi. Quand tu fais un pas pour passer, il sort un kunai. Ses amis rient, sans bouger.',
    choix: [
      {
        id: 'desarmer',
        texte: 'Le désarmer, sans plus',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { agilite: 2, controleEmotionnel: 2 },
          succes: { texte: 'Son kunai tinte sur les pavés. Il se retrouve assis dans le caniveau. Ses amis cessent de rire. Demain, il ne se souviendra de rien. Toi, si.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: 'Il est ivre, mais il est chūnin. Sa lame t’ouvre l’avant-bras avant que ses amis le ceinturent en s’excusant.', effets: [{ blessure: { id: 'ivrogne', nom: 'Entaille à l’avant-bras', gravite: 1, jours: 15 } }] },
        },
      },
      {
        id: 'tuer',
        texte: 'Le tuer : il a sorti une lame contre toi',
        effets: [
          { drapeau: 'coup_issue', valeur: 'tue' },
          { si: AMI_VIVANT, alors: [{ hasard: [{ poids: 40, effets: [{ drapeau: 'coup_issue', valeur: 'ami' }] }, { poids: 60, effets: [] }] }] },
          {
            si: ISSUE('tue'),
            alors: [{ drapeau: 'meurtre_village' }, { drapeau: 'tueur_village' }, { drapeau: 'crime_meurtres', incr: 1 }, { stat: 'social.reputationOmbre', delta: 8 }, { stat: 'social.suspicion', delta: 15 }, { ethique: { compassion: -8 } }, { journal: 'Tu as tué un chūnin ivre dans la rue des lanternes.', importance: 3 }, { retour: 'v_proces', chance: 1, entre: [3, 10] }],
            sinon: [{ relation: '@coequipierA', delta: { confiance: 6, attachement: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }],
          },
        ],
        resultat: [
          { si: ISSUE('ami'), texte: 'Deux bras t’enserrent par-derrière. {@coequipierA}, sorti{e:@coequipierA} de nulle part, de tout son poids contre toi. « Il ne vaut pas ta vie. Il ne vaut pas ce que tu deviendrais. » Tu respires. Le kunai de l’ivrogne tombe sur les pavés. Il ne saura jamais à quel point il est passé près.' },
          { si: ISSUE('tue'), texte: 'C’est plus facile que tu ne l’aurais cru, et c’est ça qui te glace. Il glisse contre le mur de la taverne. Ses amis ne rient plus. Quelqu’un court chercher la garde. Tu restes là, la lame à la main, à attendre. Il n’y a nulle part où aller.' },
        ],
      },
      {
        id: 'passer',
        texte: 'Passer ton chemin',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.reputation', delta: -1 }],
        resultat: 'Tu fais un détour par la ruelle. Ses insultes te poursuivent jusqu’au coin de la rue. Ça brûle toute la nuit. Le lendemain matin, ça brûle un peu moins.',
      },
    ],
  },
  {
    chapitre: 2,
    chapitres: [2, 3, 4, 5, 6],
    arc: 'crise',
    id: 'v_rival_nuit',
    titre: 'Celui qui t’attendait',
    categorie: 'rivalite',
    lieu: '$terrain',
    poids: 4,
    personnages: ['@rival'],
    si: { tout: [ACTIF, { age: { min: 15 } }, RIVAL_VIVANT, { un: [{ relation: '@rival', axe: 'hostilite', min: 20 }, { relation: '@rival', axe: 'rivalite', min: 45 }] }] },
    texte: 'La nuit, au terrain d’entraînement. {@rival} t’attend, seul{e:@rival}, une lame nue à la main, sans bandeau. Ce n’est plus de l’émulation. C’est des années de rancœur qui ont fini par trouver une forme. « Ce soir, il n’y a pas d’arbitre. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Accepter le combat',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 1, force: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 2,
          causeMort: 'tué·e de nuit par son rival, au terrain d’entraînement',
          succes: { texte: '{@rival} est à terre, désarmé{e:@rival}, ta lame sur sa gorge. Le terrain est désert. Personne ne saurait jamais.', effets: [], suite: 'v_rival_merci' },
          echec: { texte: '{@rival} te laisse en sang dans la poussière et s’en va sans un mot. {Il:@rival} aurait pu finir, et ne l’a pas fait. Tu ne sais pas si c’est pire.', effets: [{ blessure: { id: 'rival_nuit', nom: 'Blessures du terrain', gravite: 2, jours: 30 } }, { relation: '@rival', delta: { hostilite: 5 } }] },
        },
      },
      {
        id: 'parler',
        texte: 'Poser ton arme et lui demander pourquoi',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: '{@rival} parle. Un père qui ne {le:@rival} regarde qu’en te nommant. Les années à être second. Des larmes de rage, puis de fatigue. Vous restez assis sur le terrain jusqu’à l’aube, chacun d’un côté.', effets: [{ relation: '@rival', delta: { hostilite: -15, respect: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }] },
          echec: { texte: '« Ne fais pas semblant de comprendre. » {@rival} attaque. Tu pares au dernier moment, et tu t’enfuis par les toits. Le lendemain, {il:@rival} te salue à l’Académie comme si de rien n’était.', effets: [{ stat: 'jauges.sante', delta: -10 }, { relation: '@rival', delta: { hostilite: 5 } }] },
        },
      },
    ],
  },
  {
    chapitre: 2,
    chapitres: [2, 3, 4, 5, 6],
    arc: 'crise',
    id: 'v_rival_merci',
    titre: 'La gorge de {@rival}',
    categorie: 'rivalite',
    lieu: '$terrain',
    enchaine: true,
    personnages: ['@rival'],
    si: ACTIF,
    texte: 'Ta lame contre sa gorge. Son souffle court sur l’acier. {Il:@rival} ne supplie pas. {Il:@rival} a toujours su que ça finirait comme ça, entre vous deux, d’une façon ou d’une autre.',
    choix: [
      {
        id: 'tuer',
        texte: 'Finir',
        effets: [
          { drapeau: 'coup_issue', valeur: 'tue' },
          { si: SENSEI_VIVANT, alors: [{ hasard: [{ poids: 30, effets: [{ drapeau: 'coup_issue', valeur: 'sensei' }] }, { poids: 70, effets: [] }] }] },
          {
            si: ISSUE('tue'),
            alors: [{ pnjEtat: '@rival', etat: 'mort', cause: 'une lame, de nuit, au terrain d’entraînement' }, { drapeau: 'rival_tue' }, { drapeau: 'tueur_village' }, { retour: 'vc_clan_rival', chance: 0.85, entre: [120, 360] }, { drapeau: 'meurtre_village' }, { drapeau: 'crime_meurtres', incr: 1 }, { stat: 'social.suspicion', delta: 20 }, { ethique: { compassion: -10 } }, { journal: 'Tu as tué {@rival}, une nuit, au terrain d’entraînement.', importance: 3 }, { retour: 'v_proces', chance: 0.7, entre: [10, 40] }],
            sinon: [{ relation: '@sensei', delta: { confiance: -8, attachement: 6 } }, { relation: '@rival', delta: { hostilite: -10 } }],
          },
        ],
        resultat: [
          { si: ISSUE('sensei'), texte: 'Une main se referme sur ton poignet. {@sensei}. Personne ne sait depuis combien de temps {il:@sensei} regardait. « Rentrez chez vous. Tous les deux. Et demain, on n’en parle jamais. » Jamais {@sensei} ne t’avait parlé sur ce ton. Plus jamais ça ne se reproduira.' },
          { si: ISSUE('tue'), texte: 'Le terrain est silencieux. Tu restes à genoux à côté du corps jusqu’à ce que le ciel pâlisse. Puis tu rentres, tu laves ta lame, et tu vas à l’Académie comme tous les matins. On {le:@rival} trouvera à midi.' },
        ],
      },
      {
        id: 'epargner',
        texte: 'Retirer ta lame',
        effets: [{ ethique: { compassion: 6, honneur: 4 } }, { relation: '@rival', delta: { hostilite: -20, respect: 15 } }],
        resultat: 'Tu te relèves et tu lui tends la main. {@rival} la regarde longtemps, sans la prendre. Mais le lendemain, il n’y a plus de rancœur dans ses yeux. Il y a autre chose, que tu mettras des années à nommer.',
      },
    ],
  },
  {
    chapitre: 2,
    chapitres: [2, 3, 4, 5, 6],
    arc: 'crise',
    id: 'v_proces',
    titre: 'Devant le conseil',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    personnages: ['@kage'],
    si: { tout: [ACTIF, { drapeau: 'meurtre_village' }] },
    texte: 'La salle du conseil. Le {kage} au centre, les anciens de part et d’autre, et toi debout au milieu, les mains liées par un sceau. On a retrouvé le corps. On a retrouvé des témoins. On attend ta version.',
    choix: [
      {
        id: 'defense',
        texte: 'Plaider la légitime défense',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 2, intellect: 1, controleEmotionnel: 1 },
          succes: { texte: 'Tu racontes la lame sortie, les insultes, la seconde où tout a basculé. Les témoins confirment, à contrecœur. Le {kage} te regarde longtemps. « Acquitté·e. Mais ce village a de la mémoire. » Ta réputation ne s’en remettra pas tout à fait.', effets: [{ drapeau: 'meurtre_village', retirer: true }, { stat: 'social.reputation', delta: -6 }, { stat: 'social.loyaute', delta: 3 }] },
          echec: { texte: 'Les témoins ne disent pas la même chose que toi. Le conseil délibère moins d’une heure. Bannissement. On te donne jusqu’à l’aube.', effets: [{ drapeau: 'meurtre_village', retirer: true }, { statut: 'errant' }, { drapeau: 'banni' }, { drapeau: 'errance' }, { drapeau: 'lieu_errance', valeur: 'route_commerce' }, { stat: 'social.loyaute', delta: -40 }, { journal: 'Banni·e du village pour meurtre.', importance: 3 }] },
        },
      },
      {
        id: 'avouer',
        texte: 'Tout avouer, sans chercher d’excuse',
        effets: [
          { drapeau: 'meurtre_village', retirer: true },
          { ethique: { honneur: 6 } },
          { hasard: [{ poids: 55, effets: [{ drapeau: 'peine', valeur: 'mission' }] }, { poids: 45, effets: [{ drapeau: 'peine', valeur: 'bannissement' }] }] },
          { si: { drapeau: 'peine', egal: 'mission' }, alors: [{ stat: 'social.reputation', delta: -10 }, { stat: 'jauges.fatigue', delta: 30 }, { blessure: { id: 'peine', nom: 'Peine de frontière', gravite: 1, jours: 20 } }], sinon: [{ statut: 'errant' }, { drapeau: 'banni' }, { drapeau: 'errance' }, { drapeau: 'lieu_errance', valeur: 'route_commerce' }, { stat: 'social.loyaute', delta: -30 }, { journal: 'Banni·e du village pour meurtre.', importance: 3 }] },
        ],
        resultat: [
          { si: { drapeau: 'peine', egal: 'mission' }, texte: 'Le {kage} apprécie la franchise, ou fait semblant. Ta peine : un an aux postes de frontière les plus exposés, sans solde. « Le village a besoin de ceux qui savent tuer. Il te reste à apprendre quand. »' },
          { si: { drapeau: 'peine', egal: 'bannissement' }, texte: 'Le conseil ne t’en veut pas d’avoir avoué. Il te bannit quand même. « Un aveu ne ressuscite personne. » À l’aube, on te raccompagne à la porte. Ton bandeau reste sur la table du conseil.' },
        ],
      },
      {
        id: 'fuir',
        texte: 'Briser le sceau et fuir',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { controleChakra: 2, agilite: 2 },
          succes: { texte: 'Le sceau cède sous ton chakra. Tu passes par la fenêtre avant que les anciens se lèvent. À l’aube, tu es au-delà de la frontière, et ton nom est au registre des déserteurs.', effets: [{ drapeau: 'meurtre_village', retirer: true }, { statut: 'deserteur' }, { drapeau: 'errance' }, { drapeau: 'hors_la_loi' }, { drapeau: 'lieu_errance', valeur: 'route_commerce' }, { stat: 'social.loyaute', delta: -60 }, { retour: 'hl_traqueurs', chance: 1, entre: [60, 200] }, { journal: 'Tu t’enfuis du conseil qui te jugeait. Ton village te traque.', importance: 3 }] },
          echec: { texte: 'Le sceau tient. Les gardes aussi. On te ramène dans la salle, et la sentence tombe sans délibération.', effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'emprisonné·e par son propre village pour meurtre' }] },
        },
      },
    ],
  },
];
