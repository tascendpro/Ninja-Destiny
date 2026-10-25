// Chapitre 2 : l'examen de chūnin, puis les années où l'on cesse d'être un enfant soldat.
// Deux voies : celle du village (examen, devoir de clan, crise propre à chaque village, guerre à la frontière)
// et celle de la route (pour les refoulé·es et les déserteurs).

import type { ChoiceDef, Condition, Effect, EventDef, MissionDef } from '../../engine/types';
import { POUVOIR_EVEILLE, combatPouvoir, entrainerPouvoir, segmentsParVillage } from './outils';

const base = { chapitre: 2, arc: 'examens' as const };
const ACTIF: Condition = { statut: 'actif' };
const ROUTE: Condition = { statut: ['errant', 'deserteur', 'exile'] };
const A_VIVANT: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const RIVAL_VIVANT: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

/** L'ennemi naturel de chaque village, et sa nature dominante (avantage d'élément des attaques). */
const ADVERSAIRES = [
  { si: { village: ['konoha', 'suna'] } as Condition, nom: 'Iwa', element: 'doton' as const },
  { si: { village: 'kiri' } as Condition, nom: 'Kumo', element: 'raiton' as const },
  { si: { village: ['kumo', 'iwa'] } as Condition, nom: 'Konoha', element: 'katon' as const },
];

/** La suite du chapitre, planifiée après le verdict de l'examen. */
const SUITE_VILLAGE: Effect[] = [
  { planifier: 'c2_clan_devoir', dansJours: 150 },
  { planifier: 'c2_crise_konoha', dansJours: 420 },
  { planifier: 'c2_crise_suna', dansJours: 420 },
  { planifier: 'c2_crise_kiri', dansJours: 420 },
  { planifier: 'c2_crise_kumo', dansJours: 420 },
  { planifier: 'c2_crise_iwa', dansJours: 420 },
  { planifier: 'c2_frontiere', dansJours: 760 },
];

export const MISSIONS_C2: MissionDef[] = [
  {
    id: 'b_daimyo',
    rang: 'B',
    titre: 'Le fils du daimyō',
    description: 'Escorter l’héritier d’un seigneur jusqu’à la capitale, alors que des rumeurs parlent d’un contrat sur sa tête.',
    lieu: 'route_commerce',
    duree: 14,
    si: { tout: [{ chapitre: 2 }, ACTIF, { un: [{ rangMin: 'chunin' }, { age: { min: 15 } }] }, { blessureGrave: false }] },
    recompense: { ryo: 220, reputation: 8 },
    risques: 'Assassins professionnels.',
    evenement: 'mb_daimyo',
  },
  {
    id: 'b_mines',
    rang: 'B',
    titre: 'Les galeries scellées',
    description: 'Des mineurs ont disparu dans les carrières de la Terre. Le village veut savoir ce qu’ils ont ouvert.',
    lieu: 'carrieres_terre',
    duree: 10,
    si: { tout: [{ chapitre: 2 }, ACTIF, { un: [{ rangMin: 'chunin' }, { age: { min: 15 } }] }, { blessureGrave: false }] },
    recompense: { ryo: 180, reputation: 6 },
    risques: 'Effondrements, sceaux anciens.',
    evenement: 'mb_mines',
  },
];

export const CHAPITRE2: EventDef[] = [
  // ───────── L'examen de chūnin ─────────
  {
    ...base,
    id: 'c2_examen_ecrit',
    titre: 'L’épreuve écrite',
    categorie: 'examen',
    lieu: '$academie',
    enchaine: true,
    si: ACTIF,
    personnages: ['@sensei'],
    texte: [
      { texte: 'Cent vingt genin dans une salle prévue pour quarante. Des bandeaux de cinq villages, des regards qui jaugent, des mains qui tremblent sous les tables.' },
      ...segmentsParVillage({
        konoha: 'À Konoha, l’examinateur est un homme au visage couturé qui ne cligne jamais des yeux. « Neuf questions. La dixième viendra à la fin. »',
        suna: 'À Suna, on a fermé les volets contre le sable. Il fait une chaleur de four. L’examinatrice sourit : « La soif fait partie de l’épreuve. »',
        kiri: 'À Kiri, on dit que l’épreuve écrite a remplacé les combats à mort entre élèves. On dit aussi que certains le regrettent.',
        kumo: 'À Kumo, les fenêtres donnent sur le vide. Un surveillant par rangée, bras croisés, foudre au bout des doigts.',
        iwa: 'À Iwa, la salle est taillée dans la roche. Pas un bruit ne sort, pas un message n’entre. « Ici, tricher, c’est trahir », prévient l’examinateur.',
      }),
      { texte: 'Les questions sont impossibles pour un genin : calculs de trajectoire, chiffres codés, analyse d’un rapport de bataille. Tout le monde comprend vite que l’épreuve n’est pas ce qu’elle prétend être.' },
    ],
    choix: [
      {
        id: 'reflechir',
        texte: 'Répondre par toi-même, à force de réflexion',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { intellect: 3, perception: 1 },
          succes: {
            texte: 'Tu remplis la feuille, ligne après ligne, en sachant que tu te trompes sur la moitié. Puis vient la dixième question : « Ceux qui doutent peuvent partir. Ceux qui restent et échouent ne repasseront jamais l’examen. » Tu restes. C’était ça, la réponse.',
            effets: [{ drapeau: 'c2_ecrit_ok' }, { stat: 'attributs.intellect', delta: 1 }],
            suite: 'c2_foret',
          },
          echec: {
            texte: 'Les chiffres se brouillent. À la dixième question, la peur te prend : tu poses ton crayon et tu sors. Dans le couloir, tu comprends trop tard que rester suffisait.',
            effets: [{ drapeau: 'c2_elimine_ecrit' }],
            suite: 'c2_elimine',
          },
        },
      },
      {
        id: 'tricher',
        texte: 'Tricher sans te faire prendre : c’est peut-être le vrai test',
        test: {
          type: 'competence',
          difficulte: 45,
          attributs: { discretion: 2, perception: 1, agilite: 1 },
          succes: {
            texte: 'Un reflet dans un kunai posé sur la table, le crayon d’un voisin qui écrit trop fort : tu recopies ce qu’il faut. L’examinateur te regarde une seconde de trop, puis note quelque chose. À la dixième question, tu restes. « Un ninja qui se fait prendre à collecter des informations est un ninja mort. Vous, vous ne vous êtes pas fait prendre. »',
            effets: [{ drapeau: 'c2_ecrit_ok' }, { drapeau: 'c2_triche' }, { stat: 'attributs.discretion', delta: 1 }],
            suite: 'c2_foret',
          },
          echec: {
            texte: 'Un kunai se plante dans ta feuille. « Cinq fois. Je t’ai vu cinq fois. Dehors. »',
            effets: [{ drapeau: 'c2_elimine_ecrit' }, { stat: 'social.reputation', delta: -3 }],
            suite: 'c2_elimine',
          },
        },
      },
      {
        id: 'yeux',
        texte: 'Activer tes yeux et lire les copies des autres',
        si: { tout: [{ clan: ['uchiha', 'hyuga'] }, POUVOIR_EVEILLE] },
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { perception: 2, controleChakra: 1 },
          maitrises: { sharingan: 2, byakugan: 2 },
          succes: {
            texte: 'Le monde se fige dans tes yeux. Trois copies, trois angles, une seule bonne réponse par question. L’examinateur ne voit rien. À la dixième question, tu souris.',
            effets: [{ drapeau: 'c2_ecrit_ok' }, ...combatPouvoir()],
            suite: 'c2_foret',
          },
          echec: {
            texte: 'Tes yeux te trahissent : les veines se gonflent, le rouge s’allume. « Les pouvoirs de clan sont interdits dans cette salle. » Tu sors sous les regards.',
            effets: [{ drapeau: 'c2_elimine_ecrit' }],
            suite: 'c2_elimine',
          },
        },
      },
      {
        id: 'esprit',
        texte: 'Glisser ton esprit dans celui d’un candidat qui sait',
        si: { tout: [{ clan: 'yamanaka' }, POUVOIR_EVEILLE] },
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { controleChakra: 2, intellect: 1 },
          maitrises: { shintenshin: 3 },
          succes: {
            texte: 'Quelques secondes dans la tête d’un chūnin infiltré parmi les candidats : il connaît toutes les réponses. Tu reviens dans ton corps avant qu’il ne remarque rien.',
            effets: [{ drapeau: 'c2_ecrit_ok' }, ...combatPouvoir()],
            suite: 'c2_foret',
          },
          echec: {
            texte: 'Ton corps s’affaisse sur la table au mauvais moment. Un surveillant te secoue. On t’escorte dehors.',
            effets: [{ drapeau: 'c2_elimine_ecrit' }],
            suite: 'c2_elimine',
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'c2_foret',
    titre: 'La forêt des Échos',
    categorie: 'examen',
    lieu: 'foret_feu',
    enchaine: true,
    si: ACTIF,
    personnages: ['@coequipierB'],
    texte: [
      { texte: 'Deuxième épreuve : cinq jours dans une forêt close, un rouleau par équipe, et il en faut deux pour sortir. Les examinateurs ne ramassent pas les corps avant la fin.' },
      { si: A_VIVANT, texte: '{@coequipierA} serre ta manche à l’entrée. {@coequipierB} vérifie ses kunai pour la troisième fois.' },
      { texte: 'Au deuxième jour, une équipe étrangère vous coupe la route. Leurs bandeaux portent le symbole d’un village ennemi du tien, et ils ne sont pas là pour échanger des rouleaux.' },
    ],
    choix: [
      ...ADVERSAIRES.map((adv): ChoiceDef => ({
        id: `affronter_${adv.element}`,
        texte: `Affronter l’équipe d’${adv.nom} de front`,
        si: adv.si,
        test: {
          type: 'combat',
          difficulte: 56,
          letal: true,
          elementAdverse: adv.element,
          causeMort: `tombé·e dans la forêt des Échos, face à une équipe d’${adv.nom}`,
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          critique: {
            texte: `Tu frappes avant qu’ils aient fini leur premier signe. Le combat dure moins d’une minute. Leur rouleau est à toi, et leur chef d’équipe te regarde partir sans oser te suivre.`,
            effets: [{ drapeau: 'c2_foret_ok' }, { drapeau: 'c2_foret_brillant' }, { stat: 'social.reputation', delta: 5 }, ...combatPouvoir()],
            suite: 'c2_foret_nuit',
          },
          succes: {
            texte: `Ils sont bons. Tu es meilleur·e, de justesse. Quand le dernier tombe, tu as du sang dans la bouche et leur rouleau dans la main.`,
            effets: [{ drapeau: 'c2_foret_ok' }, ...combatPouvoir()],
            suite: 'c2_foret_nuit',
          },
          echec: {
            texte: `Un coup que tu n’as pas vu venir. Quand tu te relèves, ils sont partis, avec votre rouleau.`,
            effets: [{ drapeau: 'c2_elimine_foret' }],
            suite: 'c2_elimine',
          },
        },
      })),
      {
        id: 'embuscade',
        texte: 'Les laisser passer, puis leur tendre un piège',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { intellect: 2, discretion: 2 },
          maitrises: { arme: 1 },
          succes: {
            texte: 'Un fil, trois parchemins explosifs, une fausse piste. Ils tombent dedans à la tombée de la nuit. Vous repartez avec leur rouleau sans avoir croisé leur regard.',
            effets: [{ drapeau: 'c2_foret_ok' }, { stat: 'attributs.intellect', delta: 1 }],
            suite: 'c2_foret_nuit',
          },
          echec: {
            texte: 'Ils voient le fil. Ils te voient, toi. Tu passes deux jours à fuir, et le troisième, il est trop tard pour trouver un autre rouleau.',
            effets: [{ drapeau: 'c2_elimine_foret' }, { stat: 'jauges.fatigue', delta: 20 }],
            suite: 'c2_elimine',
          },
        },
      },
      {
        id: 'attendre',
        texte: 'Éviter le combat et guetter une équipe plus faible',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { perception: 2, controleEmotionnel: 1 },
          succes: {
            texte: 'Trois jours accroupi·e dans les fougères. Une équipe épuisée finit par passer sous toi. Ce n’est pas glorieux. Ça suffit.',
            effets: [{ drapeau: 'c2_foret_ok' }, { ethique: { honneur: -2 } }],
            suite: 'c2_foret_nuit',
          },
          echec: {
            texte: 'La forêt n’a pas d’équipe faible. Au cinquième jour, vous sortez les mains vides.',
            effets: [{ drapeau: 'c2_elimine_foret' }],
            suite: 'c2_elimine',
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'c2_foret_nuit',
    titre: 'La quatrième nuit',
    categorie: 'amitie',
    lieu: 'foret_feu',
    enchaine: true,
    si: ACTIF,
    personnages: ['@coequipierB'],
    texte: [
      { si: A_VIVANT, texte: '{@coequipierA} a reçu une aiguille empoisonnée dans l’épaule. La fièvre monte. La tour d’arrivée est à une journée de marche.' },
      { si: { non: A_VIVANT }, texte: '{@coequipierB} a reçu une aiguille empoisonnée dans l’épaule. La fièvre monte. La tour d’arrivée est à une journée de marche.' },
      { si: RIVAL_VIVANT, texte: 'Et dans l’ombre des arbres, quelqu’un vous observe : {@rival}, seul·e, qui a déjà ses deux rouleaux.' },
    ],
    choix: [
      {
        id: 'porter',
        texte: 'Porter ton coéquipier jusqu’à la tour',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { force: 2, controleEmotionnel: 1 },
          succes: {
            texte: 'Toute la nuit, puis toute la matinée. Tes jambes ne te portent plus quand la tour apparaît. Vous y entrez à trois.',
            effets: [{ relation: '@coequipierA', delta: { amitie: 10, confiance: 10 } }, { relation: '@coequipierB', delta: { confiance: 8 } }, { stat: 'attributs.force', delta: 1 }, { stat: 'jauges.fatigue', delta: 25 }],
            suite: 'c2_tournoi',
          },
          echec: {
            texte: 'Tu tombes deux fois, trois fois. Vous arrivez à la tour au dernier coup de gong, presque trop tard, et dans un état que les médecins ne veulent pas voir.',
            effets: [{ relation: '@coequipierA', delta: { amitie: 8 } }, { stat: 'jauges.sante', delta: -15 }, { stat: 'jauges.fatigue', delta: 35 }],
            suite: 'c2_tournoi',
          },
        },
      },
      {
        id: 'soigner',
        texte: 'Extraire le poison toi-même',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { intellect: 2, controleChakra: 2 },
          maitrises: { shosen: 3 },
          succes: {
            texte: 'Une lame chauffée, une herbe que tu reconnais, un peu de chakra pour ralentir le cœur. À l’aube, la fièvre tombe. Vous repartez à trois, lentement.',
            effets: [{ relation: '@coequipierA', delta: { confiance: 12 } }, { relation: '@coequipierB', delta: { respect: 8 } }, { stat: 'attributs.intellect', delta: 1 }],
            suite: 'c2_tournoi',
          },
          echec: {
            texte: 'Tu en retires une partie. L’autre reste. Vous arrivez à la tour, mais ton coéquipier ne pourra pas combattre.',
            effets: [{ drapeau: 'c2_equipier_blesse' }, { relation: '@coequipierA', delta: { amitie: 4 } }],
            suite: 'c2_tournoi',
          },
        },
      },
      {
        id: 'rival',
        texte: 'Demander de l’aide à {@rival}',
        si: RIVAL_VIVANT,
        effets: [{ relation: '@rival', delta: { respect: 8, rivalite: -6 } }, { drapeau: 'c2_dette_rival' }],
        suite: 'c2_tournoi',
        resultat: '{@rival} te regarde longtemps, puis jette une fiole à tes pieds. « Je veux te battre en finale, pas ici. Tu me devras ça. » Le contrepoison agit avant l’aube.',
      },
      {
        id: 'abandonner',
        texte: 'Le laisser avec le rouleau et finir seul·e',
        effets: [{ relation: '@coequipierA', delta: { confiance: -25, amitie: -20 } }, { relation: '@coequipierB', delta: { confiance: -15 } }, { ethique: { compassion: -8, ambition: 6 } }, { drapeau: 'c2_abandon_equipier' }],
        suite: 'c2_tournoi',
        resultat: 'Une équipe de secours le ramasse le lendemain. Il survivra. Il ne te regardera plus jamais de la même façon, et l’examinateur non plus.',
      },
    ],
  },
  {
    ...base,
    id: 'c2_tournoi',
    titre: 'Le tournoi',
    categorie: 'rivalite',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { texte: 'Troisième épreuve : des duels, devant le {kage}, les daimyō et des milliers de spectateurs. On ne devient pas chūnin en gagnant, dit-on. On le devient en montrant ce qu’on vaut.' },
      { si: RIVAL_VIVANT, texte: 'Le tirage au sort te place face à {@rival}. Bien sûr.' },
      { si: { non: RIVAL_VIVANT }, texte: 'Le tirage au sort te place face à un genin étranger qui a tué deux candidats dans la forêt.' },
      { si: { clan: 'uchiha' }, texte: 'Dans la tribune du clan, la police militaire Uchiha au grand complet. On attend de toi que tu montres les yeux de ton sang.' },
      { si: { clan: 'hyuga' }, texte: 'La branche principale des Hyūga occupe le premier rang. La branche secondaire se tient debout derrière elle. Les deux te regardent pour des raisons différentes.' },
      { si: { clan: 'nara' }, texte: 'Ton père a parié contre toi par superstition. Les Nara font tout à l’envers, même espérer.' },
      { si: { clan: 'akimichi' }, texte: 'Les Akimichi ont apporté à manger pour toute la tribune. Ils crient ton nom la bouche pleine.' },
      { si: { clan: 'yamanaka' }, texte: 'Ta famille a fleuri la tribune. Ta mère dit que les fleurs portent chance. Ton père dit qu’elles cachent les sorties.' },
      { si: { clan: 'aburame' }, texte: 'Les Aburame ne crient pas. Ils sont là, alignés, et tes insectes savent qu’ils sont là.' },
      { si: { clan: 'inuzuka' }, texte: 'Ton chien tire sur sa laisse. Dans la tribune, ta mère hurle plus fort que tous les chiens du clan réunis.' },
      { si: { clan: 'senju' }, texte: 'On a peint l’emblème des Senju sur un drapeau que personne n’avait sorti depuis la guerre. Le poids d’un nom.' },
      { si: { clan: 'uzumaki' }, texte: 'Quelqu’un dans la foule murmure « Uzumaki » comme un mot ancien. Ton clan n’existe plus qu’en toi, ou presque.' },
      { si: { clan: 'hozuki' }, texte: 'Les Hōzuki ont parié de l’argent sur toi, beaucoup d’argent. Ils te le rappelleront si tu perds.' },
      { si: { clan: 'kaguya' }, texte: 'On a placé des gardes près de toi. À Kiri, on se souvient de ce que les Kaguya font quand ils perdent le contrôle.' },
      { si: { clan: 'yuki' }, texte: 'Personne ne sait ce que tu portes dans le sang. Tu aimerais que ça reste ainsi.' },
      { si: { clan: 'shirakaze' }, texte: 'Le vent tourne dans l’arène, et les Shirakaze sourient : le désert est de ton côté.' },
      { si: { clan: 'raiko' }, texte: 'Les Raikō frappent leurs gantelets les uns contre les autres. Le bruit roule comme un orage.' },
      { si: { clan: 'ishikawa' }, texte: 'Les Ishikawa sont venus des carrières, la poussière encore dans les cheveux. Ils ne disent rien. Ils attendent que tu tiennes.' },
      { si: { clan: 'sans_clan' }, texte: 'Personne n’a de banderole à ton nom. Tu cherches un visage dans la foule. Il y en a peut-être un.' },
    ],
    choix: [
      {
        id: 'frontal',
        texte: 'Un duel franc, sans rien cacher',
        test: {
          type: 'combat',
          manches: 3,
          difficulte: 58,
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { arme: 1, taijutsu: 1, ninjutsu: 1 },
          arme: true,
          critique: {
            texte: 'Tu gagnes, et la foule se lève. Même le {kage} applaudit, deux fois, ce qui pour lui est une ovation.',
            effets: [{ drapeau: 'c2_tournoi_gagne' }, { stat: 'social.reputation', delta: 10 }, { relation: '@rival', delta: { respect: 10, rivalite: 6 } }, ...combatPouvoir()],
            suite: 'c2_coup_de_grace',
          },
          succes: {
            texte: 'Le combat dure longtemps. Tu le gagnes à la fatigue, d’un dernier coup que tu n’aurais pas cru avoir en toi.',
            effets: [{ drapeau: 'c2_tournoi_gagne' }, { stat: 'social.reputation', delta: 6 }, { relation: '@rival', delta: { rivalite: 8 } }, ...combatPouvoir()],
            suite: 'c2_coup_de_grace',
          },
          partiel: {
            texte: 'Tu perds, mais tu as forcé ton adversaire à tout montrer. Dans la tribune des examinateurs, quelqu’un hoche la tête.',
            effets: [{ drapeau: 'c2_tournoi_impressionne' }, { stat: 'social.reputation', delta: 3 }],
            suite: 'c2_verdict',
          },
          echec: {
            texte: 'Tu perds vite, et mal. Les médecins t’emmènent avant la fin des applaudissements pour ton adversaire.',
            effets: [{ stat: 'jauges.sante', delta: -20 }],
            suite: 'c2_verdict',
          },
        },
      },
      {
        id: 'strategie',
        texte: 'Observer, reculer, et gagner par la tête',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 3, perception: 1 },
          succes: {
            texte: 'Tu passes dix minutes à perdre du terrain, et les gens sifflent. Puis ton adversaire marche exactement là où tu voulais. Fin du combat. Les examinateurs, eux, ne sifflent pas.',
            effets: [{ drapeau: 'c2_tournoi_gagne' }, { stat: 'attributs.intellect', delta: 1 }, { relation: '@rival', delta: { respect: 8 } }],
            suite: 'c2_verdict',
          },
          partiel: {
            texte: 'Ton plan était bon. Ton adversaire était plus rapide que ton plan. Tu abandonnes avant de te faire briser un bras ; un examinateur note : « Lucide. »',
            effets: [{ drapeau: 'c2_tournoi_impressionne' }],
            suite: 'c2_verdict',
          },
          echec: {
            texte: 'Tu réfléchis trop. Ton adversaire, pas du tout. Ça suffit à te mettre au sol.',
            effets: [{ stat: 'jauges.sante', delta: -12 }],
            suite: 'c2_verdict',
          },
        },
      },
      {
        id: 'pouvoir',
        texte: 'Libérer le pouvoir de ton sang devant tout le monde',
        si: POUVOIR_EVEILLE,
        indice: 'Tout le village saura ce dont tu es capable.',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { controleChakra: 2, agilite: 1 },
          maitrises: { sharingan: 2, byakugan: 2, kagemane: 2, shintenshin: 2, baika: 2, kikaichu: 2, ninken_lien: 2, vitalite_senju: 2, fuinjutsu_uzumaki: 2, hydrification: 2, shikotsumyaku: 2, hyoton: 2, souffle_dunes: 2, armure_foudre: 2, peau_roche: 2 },
          succes: {
            texte: 'Le silence d’abord, puis le bruit. Ce que ton clan sait faire, des milliers de gens viennent de le voir. Ton adversaire ne se relève pas tout de suite.',
            effets: [{ drapeau: 'c2_tournoi_gagne' }, { drapeau: 'pouvoir_revele' }, { stat: 'social.reputation', delta: 8 }, { stat: 'social.confianceClan', delta: 6 }, ...combatPouvoir()],
            suite: 'c2_coup_de_grace',
          },
          echec: {
            texte: 'Ton pouvoir te glisse entre les doigts au pire moment. Ton adversaire en profite. Dans la tribune de ton clan, plus personne ne parle.',
            effets: [{ stat: 'social.confianceClan', delta: -6 }, { stat: 'jauges.sante', delta: -15 }, ...entrainerPouvoir(20)],
            suite: 'c2_verdict',
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'c2_verdict',
    titre: 'Le verdict',
    categorie: 'promotion',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@sensei'],
    texte: [
      { texte: 'Trois jours après le tournoi, les noms sont affichés à la porte de la tour du {kage}. On se bouscule. Certains pleurent, d’autres font semblant de s’en moquer.' },
      { si: { drapeau: 'c2_abandon_equipier' }, texte: 'L’examinateur de la forêt a écrit une ligne sous ton nom. Une seule. Tout le monde l’a lue.' },
      { si: { drapeau: 'tournoi_sang' }, texte: 'Sous ton nom, une seule ligne, à l’encre rouge : « A frappé après la fin du combat. » Personne ne te regarde en face devant le tableau.' },
    ],
    choix: [
      {
        id: 'promu',
        texte: 'Chercher ton nom parmi les nouveaux chūnin',
        si: { tout: [{ un: [{ drapeau: 'c2_tournoi_gagne' }, { drapeau: 'c2_tournoi_impressionne' }] }, { drapeau: 'c2_abandon_equipier', absent: true }, { drapeau: 'tournoi_sang', absent: true }] },
        effets: [{ rang: 'chunin' }, { succes: 'chunin' }, { relation: '@sensei', delta: { respect: 10, attachement: 6 } }, { stat: 'social.reputation', delta: 6 }, { journal: 'Tu deviens chūnin.', importance: 3 }, ...SUITE_VILLAGE],
        resultat: 'Il est là. Tu le relis cinq fois. {@sensei} te pose une veste sur les épaules, la veste à poches des chūnin. « Désormais, ce sont d’autres qui mourront si tu te trompes. »',
      },
      {
        id: 'recale',
        texte: 'Lire la liste jusqu’au bout',
        si: { non: { tout: [{ un: [{ drapeau: 'c2_tournoi_gagne' }, { drapeau: 'c2_tournoi_impressionne' }] }, { drapeau: 'c2_abandon_equipier', absent: true }, { drapeau: 'tournoi_sang', absent: true }] } },
        effets: [{ planifier: 'c2_seconde_chance', dansJours: 180 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, ...SUITE_VILLAGE],
        resultat: 'Ton nom n’y est pas. {@sensei} ne dit rien pendant tout le chemin du retour, puis, devant chez toi : « Six mois. La prochaine session est dans six mois. Ce que tu feras de ces six mois, c’est ça, ton examen. »',
      },
    ],
  },
  {
    ...base,
    id: 'c2_elimine',
    titre: 'Éliminé·e',
    categorie: 'examen',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@sensei'],
    texte: [
      { texte: 'L’examen continue sans toi. Tu regardes la suite depuis les gradins, avec les autres éliminés, qui parlent fort pour ne pas penser.' },
      { si: A_VIVANT, texte: '{@coequipierA} vient s’asseoir à côté de toi. Il ne dit rien. C’est mieux comme ça.' },
    ],
    choix: [
      {
        id: 'travailler',
        texte: 'Te remettre au travail dès le lendemain',
        effets: [{ planifier: 'c2_seconde_chance', dansJours: 180 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@sensei', delta: { respect: 6 } }, ...SUITE_VILLAGE],
        resultat: '{@sensei} te trouve sur le terrain à l’aube. Il ne dit rien, enlève sa veste et se met en garde. Vous recommencez tout.',
      },
      {
        id: 'colere',
        texte: 'Laisser éclater ta colère',
        effets: [{ planifier: 'c2_seconde_chance', dansJours: 180 }, { stat: 'attributs.controleEmotionnel', delta: -2 }, { relation: '@rival', delta: { rivalite: 6 } }, { eveilDanger: 25 }, ...SUITE_VILLAGE],
        resultat: 'Un mur du terrain d’entraînement garde la marque de tes poings pendant des semaines. Ça ne change rien. Ça fait du bien quand même.',
      },
    ],
  },
  {
    ...base,
    id: 'c2_seconde_chance',
    titre: 'La session suivante',
    categorie: 'examen',
    lieu: '$village',
    priorite: 44,
    repetable: { delaiJours: 180, max: 2 },
    si: { tout: [ACTIF, { rang: 'genin' }, { un: [{ vu: 'c2_elimine' }, { vu: 'c2_verdict' }, { drapeau: 'reintegre' }] }] },
    personnages: ['@sensei'],
    texte: [
      { texte: 'Nouvelle session de l’examen de chūnin. Moins de spectateurs, plus de sérieux. Cette fois, tu connais le piège de l’écrit, et tu as vu ce que la forêt fait aux équipes.' },
      { texte: 'On te dispense de la forêt, au vu de tes missions. Il reste un duel et un entretien avec les examinateurs.' },
    ],
    choix: [
      {
        id: 'duel',
        texte: 'Tout jouer sur le duel',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, taijutsu: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Tu gagnes proprement, sans un geste de trop. L’entretien ne dure que deux minutes. Le soir même, tu portes la veste.',
            effets: [{ rang: 'chunin' }, { succes: 'chunin' }, { stat: 'social.reputation', delta: 5 }, { journal: 'Tu deviens chūnin, à la deuxième tentative.', importance: 3 }],
          },
          echec: {
            texte: 'Encore raté. Plus serré que la dernière fois, mais raté.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
          },
        },
      },
      {
        id: 'entretien',
        texte: 'Convaincre les examinateurs par ce que tu as appris',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { intellect: 2, charisme: 2 },
          succes: {
            texte: 'Tu parles de tes erreurs plus que de tes victoires. C’est ce qu’ils voulaient entendre. « Un chūnin sait pourquoi il se trompe. »',
            effets: [{ rang: 'chunin' }, { succes: 'chunin' }, { stat: 'attributs.charisme', delta: 1 }, { journal: 'Tu deviens chūnin, à la deuxième tentative.', importance: 3 }],
          },
          echec: {
            texte: 'Tu bafouilles. Ils te remercient poliment. La prochaine fois, peut-être.',
            effets: [{ stat: 'attributs.charisme', delta: 1 }],
          },
        },
      },
    ],
  },

  // ───────── Devoir de clan (une histoire différente selon le clan) ─────────
  {
    ...base,
    arc: 'heritage',
    id: 'c2_clan_devoir',
    titre: 'Ce que le sang demande',
    categorie: 'conflit_clans',
    lieu: '$maison',
    enchaine: true,
    si: ACTIF,
    personnages: ['@parent'],
    texte: [
      { si: { clan: 'uchiha' }, texte: 'Le chef du clan Uchiha te convoque. On parle à voix basse dans le quartier : le Conseil retire peu à peu la police militaire des rues. « Le clan a besoin de savoir de quel côté tu te tiens. Nous avons besoin d’yeux à la tour du Hokage. »' },
      { si: { clan: 'hyuga' }, texte: 'Les anciens Hyūga t’annoncent qu’on va apposer le sceau de l’oiseau en cage sur ton cousin de la branche secondaire. On te demande d’être présent·e, et de tenir le pinceau.' },
      { si: { clan: 'nara' }, texte: 'Une biche du troupeau sacré des Nara est retrouvée morte, une flèche de braconnier dans le flanc. Ton père te confie l’enquête : « C’est ennuyeux, je sais. C’est pour ça que c’est toi. »' },
      { si: { clan: 'yamanaka' }, texte: 'Le service d’interrogatoire veut t’emprunter : un prisonnier refuse de parler, et ta technique d’esprit est la seule assez fine pour entrer sans le briser. Ta famille n’aime pas ça.' },
      { si: { clan: 'akimichi' }, texte: 'Le clan Akimichi te propose les pilules des trois couleurs, la technique secrète qui décuple la force au prix de la vie. On veut savoir si tu es prêt·e à en porter une sur toi, toujours.' },
      { si: { clan: 'aburame' }, texte: 'Ta colonie d’insectes a commencé à mourir. Les anciens Aburame parlent d’un parasite venu de l’étranger, et d’une reine à capturer dans une forêt de la frontière.' },
      { si: { clan: 'inuzuka' }, texte: 'Ton chien s’est battu avec celui de l’héritière du clan. L’honneur des Inuzuka exige une réparation : un combat, ou des excuses publiques.' },
      { si: { clan: 'senju' }, texte: 'Un vieux Senju sur son lit de mort te remet un rouleau : la technique de guérison de ton arrière-grand-mère. Il te demande de ne jamais la donner au Conseil.' },
      { si: { clan: 'uzumaki' }, texte: 'Une lettre arrive d’Uzushio en ruines : quelqu’un a ouvert les caves scellées de ton clan. Les sceaux qui y dorment ne devraient jamais servir.' },
      { si: { clan: 'hozuki' }, texte: 'Les Hōzuki veulent récupérer une épée des Sept Épéistes, perdue depuis la dispersion. Ils pensent que tu es assez jeune pour qu’on ne te soupçonne pas.' },
      { si: { clan: 'kaguya' }, texte: 'Les Kaguya préparent une révolte contre le Mizukage. Ils te demandent de te tenir prêt·e. Tu sais comment finissent les révoltes à Kiri.' },
      { si: { clan: 'yuki' }, texte: 'Un autre porteur du sang Yuki se cache dans un village de pêcheurs. Les chasseurs de lignées sont sur sa piste. Il te reconnaît dans la rue et te supplie de l’aider.' },
      { si: { clan: 'shirakaze' }, texte: 'Les puits du quartier Shirakaze s’assèchent. Ton clan veut détourner l’eau d’un autre quartier, la nuit, par le vent et le sable.' },
      { si: { clan: 'raiko' }, texte: 'Le clan Raikō veut que tu épouses, à seize ans, l’héritier d’une famille alliée. L’armure de foudre se transmet mieux, disent-ils, quand le sang est bien choisi.' },
      { si: { clan: 'ishikawa' }, texte: 'Une galerie de carrière s’est effondrée sur douze ouvriers. Les Ishikawa peuvent durcir la roche pour soutenir le plafond, mais personne n’en est revenu en le faisant si longtemps.' },
      { si: { clan: 'sans_clan' }, texte: 'Sans clan, personne ne te demande rien au nom du sang. Mais un soir, {parent} te parle d’une dette ancienne envers une famille du village, et du jour où elle a sauvé votre maison. Cette famille a besoin d’aide.' },
    ],
    choix: [
      {
        id: 'clan',
        texte: 'Faire ce que les tiens attendent de toi',
        effets: [{ stat: 'social.confianceClan', delta: 12 }, { stat: 'social.loyaute', delta: -4 }, { ethique: { honneur: 4 } }, { relation: '@parent', delta: { respect: 8 } }, ...entrainerPouvoir(30, true)],
        resultat: 'Tu fais ce qu’on attend. On te remercie, gravement, comme on remercie un adulte. Tu n’es pas sûr·e de vouloir ce genre de remerciements.',
      },
      {
        id: 'village',
        texte: 'Faire passer le village avant le clan',
        effets: [{ stat: 'social.loyaute', delta: 10 }, { stat: 'social.confianceClan', delta: -12 }, { relation: '@parent', delta: { attachement: -6 } }, { stat: 'social.reputation', delta: 4 }],
        resultat: 'Tu refuses, ou tu en parles à qui de droit. Le village t’en sait gré, discrètement. Ton clan, lui, ne l’oubliera pas.',
      },
      {
        id: 'troisieme',
        texte: 'Chercher une troisième voie, plus difficile',
        test: {
          type: 'competence',
          difficulte: 55,
          attributs: { intellect: 2, charisme: 2 },
          succes: {
            texte: 'Il te faut des semaines de patience et deux nuits sans sommeil. Mais à la fin, personne n’a eu tout ce qu’il voulait, et personne ne te reproche rien. On commence à parler de toi comme de quelqu’un de sage.',
            effets: [{ stat: 'social.confianceClan', delta: 6 }, { stat: 'social.loyaute', delta: 5 }, { stat: 'social.influence', delta: 6 }, { ethique: { compassion: 4 } }],
          },
          echec: {
            texte: 'À vouloir contenter tout le monde, tu déçois les deux côtés. On te reproche d’avoir manqué de courage.',
            effets: [{ stat: 'social.confianceClan', delta: -5 }, { stat: 'social.loyaute', delta: -3 }],
          },
        },
      },
    ],
  },

  // ───────── Une crise propre à chaque village ─────────
  {
    ...base,
    arc: 'crise',
    id: 'c2_crise_konoha',
    titre: 'La nuit des lanternes éteintes',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, { village: 'konoha' }] },
    personnages: ['@kage'],
    texte: [
      { texte: 'Un membre du Conseil des anciens est retrouvé mort chez lui, la gorge tranchée. Sur le mur, un éventail dessiné au sang : l’emblème des Uchiha. Le quartier du clan est bouclé avant l’aube.' },
      { si: { clan: 'uchiha' }, texte: 'Tu es dans le quartier quand les barrages tombent. Des gens que tu connais depuis toujours sont plaqués contre les murs.' },
      { si: { non: { clan: 'uchiha' } }, texte: 'On t’affecte aux barrages. Des gens que tu croises à l’Académie depuis des années te regardent comme un ennemi.' },
    ],
    choix: [
      {
        id: 'enqueter',
        texte: 'Mener ta propre enquête sur le meurtre',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { perception: 2, intellect: 2 },
          succes: {
            texte: 'Le sang du dessin est trop frais pour la blessure. Quelqu’un est revenu tracer l’éventail après. Tu portes la preuve au {kage} en personne. Les barrages tombent le soir même. Quelqu’un, au Conseil, ne te le pardonnera pas.',
            effets: [{ stat: 'social.reputation', delta: 8 }, { stat: 'social.influence', delta: 6 }, { secret: 'eventail_sang' }, { stat: 'social.suspicion', delta: 4 }],
          },
          echec: {
            texte: 'Tu ne trouves rien, sinon des regards hostiles dans les deux camps. La tension retombe d’elle-même, sans coupable. Personne n’est dupe.',
            effets: [{ stat: 'social.suspicion', delta: 3 }],
          },
        },
      },
      {
        id: 'ordres',
        texte: 'Tenir ton barrage et obéir aux ordres',
        effets: [{ stat: 'social.loyaute', delta: 6 }, { ethique: { honneur: 3, compassion: -3 } }, { si: { clan: 'uchiha' }, alors: [{ stat: 'social.confianceClan', delta: -10 }] }],
        resultat: 'Trois jours de barrages. Personne ne passe. Le {kage} finit par lever le blocus, faute de preuves. Les rancunes, elles, restent.',
      },
      {
        id: 'apaiser',
        texte: 'Parler aux deux camps avant que le sang ne coule',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: {
            texte: 'Tu passes de barrage en barrage, du quartier aux gardes, des gardes au quartier. Personne ne tire. Ce soir-là, on ne parle pas de toi. C’est le signe que tu as réussi.',
            effets: [{ stat: 'social.reputation', delta: 5 }, { stat: 'social.confianceClan', delta: 4 }, { ethique: { compassion: 5 } }],
          },
          echec: {
            texte: 'Un jeune Uchiha te crache aux pieds, un garde te traite de sympathisant. La nuit finit par une rixe et trois blessés.',
            effets: [{ stat: 'social.reputation', delta: -3 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2_crise_suna',
    titre: 'L’année sans pluie',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, { village: 'suna' }] },
    personnages: ['@kage'],
    texte: 'Deuxième été sans une goutte. Les citernes de Suna sont à moitié vides, et le daimyō du Vent réduit encore le budget du village. Le Kazekage Jinsa prépare sa succession ; deux familles se disputent l’eau comme on se dispute un trône.',
    choix: [
      {
        id: 'source',
        texte: 'Partir dans le désert chercher la source dont parlent les vieux',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { perception: 2, force: 1, controleEmotionnel: 1 },
          succes: {
            texte: 'Six jours de dunes. Au septième, sous une falaise de grès, une eau noire et froide. Suna aura de quoi boire jusqu’à l’hiver, et ton nom circule dans les rues.',
            effets: [{ stat: 'social.reputation', delta: 10 }, { stat: 'attributs.perception', delta: 2 }, { decouvrir: 'lieu:cite_ensevelie' }],
          },
          echec: {
            texte: 'Le désert garde ses secrets. On te retrouve à moitié mort·e de soif à deux jours du village.',
            effets: [{ stat: 'jauges.sante', delta: -30 }, { stat: 'jauges.fatigue', delta: 40 }],
          },
        },
      },
      {
        id: 'succession',
        texte: 'Choisir un camp dans la succession',
        effets: [{ stat: 'social.influence', delta: 8 }, { stat: 'social.loyaute', delta: -3 }, { ethique: { ambition: 6 } }],
        resultat: 'Tu prêtes ton nom et ton bras à l’une des deux familles. Si elle l’emporte, tu monteras avec elle. Sinon, tu tomberas avec elle.',
      },
      {
        id: 'partager',
        texte: 'Organiser le partage de l’eau dans ton quartier',
        effets: [{ ethique: { compassion: 6 } }, { stat: 'social.reputation', delta: 4 }, { stat: 'attributs.charisme', delta: 2 }],
        resultat: 'Une louche par personne, matin et soir, et ceux qui trichent passent en dernier. Les gens grognent, puis obéissent, puis te remercient.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2_crise_kiri',
    titre: 'La purge',
    categorie: 'conflit_clans',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, { village: 'kiri' }] },
    personnages: ['@kage'],
    texte: [
      { texte: 'Le Mizukage Rōshū ordonne une nouvelle purge des lignées. Cette nuit, une famille de porteurs de kekkei genkai doit disparaître. On te donne une liste et une lame.' },
      { si: { clan: ['yuki', 'kaguya', 'hozuki'] }, texte: 'Tu reconnais le nom de la rue. Ce pourrait être la tienne, l’an prochain.' },
    ],
    choix: [
      {
        id: 'executer',
        texte: 'Exécuter l’ordre',
        effets: [{ stat: 'social.loyaute', delta: 10 }, { ethique: { compassion: -12, honneur: -4 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { journal: 'Tu as obéi, cette nuit-là.', importance: 3 }],
        resultat: 'Tu fais ce qu’on t’a demandé. Au matin, on te félicite. Tu ne dors pas pendant trois jours, puis tu dors trop.',
      },
      {
        id: 'prevenir',
        texte: 'Les prévenir avant l’arrivée des chasseurs',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { discretion: 3, agilite: 1 },
          succes: {
            texte: 'Une heure d’avance. Ça suffit à une famille entière pour atteindre une barque. Quand les chasseurs arrivent, la maison est vide, et personne ne sait qui a parlé.',
            effets: [{ ethique: { compassion: 10, honneur: 6 } }, { stat: 'social.suspicion', delta: 8 }, { secret: 'dissidence_kiri' }],
          },
          echec: {
            texte: 'On te voit sortir de la ruelle. On te pose des questions toute la nuit. On ne prouve rien, mais ton nom est désormais sur une autre liste.',
            effets: [{ stat: 'social.suspicion', delta: 20 }, { stat: 'social.loyaute', delta: -10 }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser ouvertement',
        effets: [{ stat: 'social.loyaute', delta: -15 }, { stat: 'social.suspicion', delta: 15 }, { ethique: { honneur: 10 } }, { stat: 'social.reputation', delta: 4 }],
        resultat: 'On ne te tue pas. Pas tout de suite. On te retire tes missions pendant deux mois, et un chasseur te suit partout. Mais des gens que tu ne connais pas te saluent dans la rue, tête baissée.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2_crise_kumo',
    titre: 'L’ordre du Raikage',
    categorie: 'politique',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: { tout: [ACTIF, { village: 'kumo' }] },
    personnages: ['@kage'],
    texte: 'Kumo veut des yeux. Le Raikage prépare l’enlèvement d’une enfant d’un clan au dōjutsu, pendant une ambassade de paix à Konoha. Ton équipe doit couvrir la retraite. Si ça tourne mal, Kumo niera tout, et toi avec.',
    choix: [
      {
        id: 'mission',
        texte: 'Couvrir la retraite comme prévu',
        test: {
          type: 'combat',
          difficulte: 60,
          letal: true,
          elementAdverse: 'katon',
          causeMort: 'tombé·e pendant une opération que Kumo n’a jamais reconnue',
          attributs: { agilite: 2, force: 1, discretion: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'Les poursuivants de Konoha ne passent pas le col. L’opération échoue quand même, ailleurs, sans toi. On te décore en secret pour une mission qui n’a pas existé.',
            effets: [{ stat: 'social.loyaute', delta: 8 }, { stat: 'social.reputationOmbre', delta: 8 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Le col tient, mais toi non. On te ramène sur un brancard, par des sentiers que personne ne connaît.',
            effets: [{ blessure: { id: 'cotes_brisees', nom: 'Côtes brisées', gravite: 2, jours: 60 } }],
          },
        },
      },
      {
        id: 'saboter',
        texte: 'Saboter l’opération discrètement',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { discretion: 2, intellect: 2 },
          succes: {
            texte: 'Un message mal transmis, un horaire décalé d’une heure. L’enfant n’est jamais enlevée, et personne ne sait pourquoi. Toi, si.',
            effets: [{ ethique: { compassion: 8, honneur: 4 } }, { stat: 'social.suspicion', delta: 6 }],
          },
          echec: {
            texte: 'On remonte la trace jusqu’à ton équipe. Un ancien t’interroge pendant une nuit entière. On te laisse partir, faute de preuves, mais pas faute de soupçons.',
            effets: [{ stat: 'social.suspicion', delta: 15 }, { stat: 'social.loyaute', delta: -6 }],
          },
        },
      },
      {
        id: 'protester',
        texte: 'Dire au Raikage ce que tu en penses',
        effets: [{ stat: 'social.reputation', delta: 3 }, { stat: 'social.loyaute', delta: -6 }, { ethique: { honneur: 8 } }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Le Raikage écoute en silence, puis fend son bureau d’un revers de main. « Kumo n’a pas besoin de ta morale. Kumo a besoin de ton bras. » On te retire de l’opération. On ne te retire pas ton bandeau. Pas cette fois.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2_crise_iwa',
    titre: 'Le pont de pierre',
    categorie: 'guerre',
    lieu: 'carrieres_terre',
    enchaine: true,
    si: { tout: [ACTIF, { village: 'iwa' }] },
    personnages: ['@kage'],
    texte: 'Le Tsuchikage veut faire sauter le grand pont de pierre de la frontière avant que Konoha ne s’en serve pour faire passer ses troupes. Mais sur le pont passent aussi chaque jour les caravanes de deux villages de mineurs, qui mourront de faim sans lui.',
    choix: [
      {
        id: 'detruire',
        texte: 'Placer les charges et faire sauter le pont',
        effets: [{ stat: 'social.loyaute', delta: 8 }, { ethique: { compassion: -6 } }, { stat: 'social.reputation', delta: 4 }],
        resultat: 'Le pont tombe dans un bruit que tu entendras longtemps. La frontière est sûre. Deux villages de mineurs apprennent la nouvelle le lendemain.',
      },
      {
        id: 'defendre',
        texte: 'Proposer de tenir le pont plutôt que de le détruire',
        test: {
          type: 'combat',
          difficulte: 58,
          letal: true,
          elementAdverse: 'katon',
          causeMort: 'tombé·e en défendant le grand pont de pierre',
          attributs: { force: 2, controleEmotionnel: 2 },
          maitrises: { arme: 1, ninjutsu: 1, peau_roche: 2 },
          succes: {
            texte: 'Une patrouille de Konoha tente le passage à l’aube. Elle n’ira pas plus loin que le milieu du pont. Le Tsuchikage garde son pont et ses mineurs, et retient ton nom.',
            effets: [{ stat: 'social.reputation', delta: 8 }, { stat: 'social.influence', delta: 4 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Le pont tient. Toi, à peine. On te ramène dans un brancard couvert de poussière de pierre.',
            effets: [{ blessure: { id: 'jambe_broyee', nom: 'Jambe broyée', gravite: 2, jours: 70 } }],
          },
        },
      },
      {
        id: 'negocier',
        texte: 'Aller parler aux mineurs et préparer une autre route',
        effets: [{ ethique: { compassion: 6 } }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'social.loyaute', delta: 2 }],
        resultat: 'Il faut trois semaines pour tracer un sentier par les carrières. Le pont saute quand même. Mais les caravanes passent par en dessous, et les mineurs ne t’oublieront pas.',
      },
    ],
  },

  // ───────── La frontière, puis la fin du chapitre ─────────
  {
    ...base,
    arc: 'conflit',
    id: 'c2_frontiere',
    titre: 'L’escarmouche',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ACTIF,
    personnages: ['@coequipierB'],
    texte: [
      { texte: 'Une patrouille de routine à la frontière. Au deuxième jour, le brouillard se lève sur une vingtaine de ninjas ennemis qui n’ont rien à faire là. Ce n’est pas une patrouille. C’est le début de quelque chose.' },
      { si: { rangMin: 'chunin' }, texte: 'Tu commandes l’escouade. Trois genin attendent tes ordres, et l’un d’eux a douze ans.' },
      { si: { rang: 'genin' }, texte: 'Le chūnin qui commande l’escouade est blessé dès la première volée. Les regards se tournent vers toi.' },
    ],
    choix: [
      ...ADVERSAIRES.map((adv): ChoiceDef => ({
        id: `tenir_${adv.element}`,
        texte: `Tenir la position face aux ninjas d’${adv.nom}`,
        si: adv.si,
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          elementAdverse: adv.element,
          causeMort: `tombé·e à la frontière, en retenant les ninjas d’${adv.nom}`,
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Vous tenez jusqu’à l’arrivée des renforts. Quand le soleil se couche, la plaine est silencieuse, et personne de ton escouade n’y est resté.',
            effets: [{ drapeau: 'c2_frontiere_tenue' }, { stat: 'social.reputation', delta: 10 }, { relation: '@coequipierB', delta: { respect: 10, confiance: 10 } }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Vous reculez, puis vous fuyez. Le plus jeune de l’escouade ne se relève pas. Tu portes son bandeau au village.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -2 }, { journal: 'Un genin de ton escouade est mort à la frontière.', importance: 3 }, { blessure: { id: 'plaie_au_flanc', nom: 'Plaie au flanc', gravite: 2, jours: 45 } }],
          },
        },
      })),
      {
        id: 'repli',
        texte: 'Ordonner le repli et prévenir le village',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { intellect: 2, charisme: 1, agilite: 1 },
          succes: {
            texte: 'Vous décrochez sans perte, et le message arrive à temps : le village envoie deux escouades de jōnin. Une guerre s’arrête peut-être là, avant d’avoir commencé.',
            effets: [{ drapeau: 'c2_frontiere_tenue' }, { stat: 'social.influence', delta: 6 }, { stat: 'attributs.intellect', delta: 1 }],
          },
          echec: {
            texte: 'Le repli se fait sous le feu. Vous rentrez tous, mais pas tous entiers.',
            effets: [{ stat: 'jauges.sante', delta: -20 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c2_fin',
    titre: 'Le toit',
    categorie: 'epilogue',
    lieu: '$village',
    priorite: 30,
    si: { tout: [ACTIF, { un: [{ vu: 'c2_frontiere' }, { age: { min: 18 } }] }] },
    personnages: ['@sensei'],
    texte: [
      { texte: 'Le soir, sur le toit d’où tu regardais le village enfant, tu fais les comptes. Les missions, les cicatrices, les noms gravés sur la pierre du souvenir.' },
      { si: { rangMin: 'chunin' }, texte: 'Une veste de chūnin pend sur une chaise de ta chambre. Elle te va mieux qu’au premier jour.' },
      { si: { rang: 'genin' }, texte: 'Tu portes toujours ton bandeau de genin. Tu as cessé d’en avoir honte. Tu n’as pas cessé d’en vouloir plus.' },
      { si: A_VIVANT, texte: '{@coequipierA} monte te rejoindre, comme toujours.' },
      { texte: '{@sensei} t’a dit hier qu’il y aurait bientôt une guerre. Il ne l’a pas dit comme une menace. Il l’a dit comme une météo.' },
    ],
    choix: [
      {
        id: 'servir',
        texte: 'Te jurer de protéger ce village, quoi qu’il en coûte',
        effets: [{ stat: 'social.loyaute', delta: 6 }, { drapeau: 'chapitre2_fini' }, { fin: 'chapitre_2' }],
        resultat: 'Tu le dis à voix haute, pour que le vent l’emporte. C’est une promesse d’enfant. Tu n’es plus un enfant. C’est pour ça qu’elle pèse.',
      },
      {
        id: 'puissance',
        texte: 'Te jurer de devenir assez fort·e pour ne plus jamais perdre personne',
        effets: [{ ethique: { ambition: 6 } }, { drapeau: 'chapitre2_fini' }, { fin: 'chapitre_2' }, ...entrainerPouvoir(20)],
        resultat: 'Tu serres les poings jusqu’à ce que tes ongles marquent tes paumes. Quelque part en toi, quelque chose a entendu.',
      },
      {
        id: 'vivre',
        texte: 'Ne rien te jurer, et regarder les lumières',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'chapitre2_fini' }, { fin: 'chapitre_2' }],
        resultat: 'Les lanternes s’éteignent une à une. Tu restes jusqu’à la dernière. Demain, il y aura des ordres. Ce soir, il n’y a que ça.',
      },
    ],
  },

  // ───────── Missions de rang B ─────────
  {
    ...base,
    arc: 'conflit',
    id: 'mb_daimyo',
    titre: 'Le fils du daimyō',
    categorie: 'mission',
    lieu: 'route_commerce',
    enchaine: true,
    si: { mission: 'b_daimyo', statut: 'en_cours' },
    texte: 'L’héritier a quatorze ans, des manières de prince et une peur qu’il cache mal. Au troisième soir, dans une auberge de la route du sel, la servante qui apporte le thé a des mains de ninja.',
    choix: [
      {
        id: 'intercepter',
        texte: 'L’intercepter avant qu’elle n’atteigne la chambre',
        test: {
          type: 'combat',
          difficulte: 58,
          letal: true,
          causeMort: 'tué·e par une assassin, sur la route du sel',
          attributs: { agilite: 2, perception: 2 },
          maitrises: { arme: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Le plateau tombe, le thé empoisonné avec. Elle est rapide. Tu l’es davantage. L’héritier arrive à la capitale sans une égratignure, et son père te fait porter une lettre de remerciements au {kage}.',
            effets: [{ mission: 'b_daimyo', statut: 'reussie' }, { stat: 'social.reputation', delta: 6 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Elle te laisse une entaille au bras et disparaît par la fenêtre. L’héritier vit, de justesse. La mission est notée « réussie, avec réserves ».',
            effets: [{ mission: 'b_daimyo', statut: 'reussie' }, { blessure: { id: 'entaille_empoisonnee', nom: 'Entaille empoisonnée', gravite: 1, jours: 20 } }],
          },
        },
      },
      {
        id: 'piege',
        texte: 'Échanger les chambres et la laisser tomber dans un piège',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 2, discretion: 2 },
          succes: {
            texte: 'Elle entre dans une chambre vide où l’attendent un fil et un sceau d’immobilisation. On la livre vivante au daimyō, qui apprend ainsi qui voulait la mort de son fils : son propre frère.',
            effets: [{ mission: 'b_daimyo', statut: 'reussie' }, { stat: 'social.influence', delta: 8 }, { indice: 'complot_daimyo' }],
          },
          echec: {
            texte: 'Elle flaire le piège et s’enfuit. L’héritier est sauf, l’assassin court toujours.',
            effets: [{ mission: 'b_daimyo', statut: 'reussie' }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'mb_mines',
    titre: 'Les galeries scellées',
    categorie: 'mission',
    lieu: 'carrieres_terre',
    enchaine: true,
    si: { mission: 'b_mines', statut: 'en_cours' },
    texte: 'Au fond de la galerie numéro sept, un mur de sceaux à moitié arraché. Derrière, une salle ronde, des ossements de mineurs, et quelque chose qui respire dans le noir.',
    choix: [
      {
        id: 'sceller',
        texte: 'Refermer le sceau avant que la chose ne sorte',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { controleChakra: 3, intellect: 1 },
          maitrises: { fuin_stockage: 2, fuinjutsu_uzumaki: 3 },
          succes: {
            texte: 'Tes mains tracent les signes sans trembler. Le mur se referme, la respiration s’éteint. Tu ne sauras jamais ce qu’il y avait derrière, et c’est très bien ainsi.',
            effets: [{ mission: 'b_mines', statut: 'reussie' }, { stat: 'attributs.controleChakra', delta: 2 }],
          },
          echec: {
            texte: 'Le sceau tient, mais il te prend une partie de ton chakra en échange. Tu ressors de la mine pâle comme un mort.',
            effets: [{ mission: 'b_mines', statut: 'reussie' }, { stat: 'jauges.sante', delta: -25 }],
          },
        },
      },
      {
        id: 'combattre',
        texte: 'Entrer et affronter ce qui s’y cache',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'disparu·e au fond des galeries scellées',
          attributs: { force: 2, controleEmotionnel: 2 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: {
            texte: 'C’est une invocation abandonnée, folle de faim et de solitude. Tu la renvoies d’où elle vient. Dans la salle, parmi les ossements, un vieux rouleau de jutsu que personne n’a jamais réclamé.',
            effets: [{ mission: 'b_mines', statut: 'reussie' }, { stat: 'jauges.ryo', delta: 60 }, { entrainer: 'ninjutsu', jours: 40 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu ressors en rampant. Les mineurs referment la galerie sur ce qui reste à l’intérieur.',
            effets: [{ mission: 'b_mines', statut: 'echouee' }, { blessure: { id: 'morsure_profonde', nom: 'Morsure profonde', gravite: 2, jours: 50 } }],
          },
        },
      },
    ],
  },

  // ───────── La route (refoulé·es, déserteurs) ─────────
  {
    ...base,
    arc: 'crise',
    id: 'c2r_ouverture',
    titre: 'La bande du Corbeau',
    categorie: 'organisation',
    lieu: 'marche_noir',
    enchaine: true,
    si: ROUTE,
    texte: [
      { texte: 'À Kōsai, une femme borgne t’attend à ta table habituelle. Elle commande la bande du Corbeau : trente mercenaires, des ninjas sans village pour la plupart. « On a entendu parler de toi. On paie bien, on meurt souvent. »' },
      { si: { statut: 'deserteur' }, texte: '« Et chez nous, personne ne vendra ta tête à ton ancien village. »' },
    ],
    choix: [
      {
        id: 'rejoindre',
        texte: 'Rejoindre la bande du Corbeau',
        effets: [{ drapeau: 'c2r_corbeau' }, { stat: 'social.reputationOmbre', delta: 8 }, { planifier: 'c2r_contrat', dansJours: 200 }, { planifier: 'c2r_kusa', dansJours: 600 }],
        resultat: 'Elle te tend une plume noire. « Porte-la quelque part où on la voit. Ici, c’est notre bandeau. »',
      },
      {
        id: 'seul',
        texte: 'Rester seul·e et chasser les primes',
        effets: [{ drapeau: 'c2r_solitaire' }, { planifier: 'c2r_contrat', dansJours: 200 }, { planifier: 'c2r_kusa', dansJours: 600 }],
        resultat: 'Elle hausse les épaules. « Les solitaires meurent seuls. Mais ils ne partagent pas. » Elle te laisse une liste de primes en partant.',
      },
      {
        id: 'retour',
        texte: 'Tenter de rentrer au village',
        si: { statut: 'errant' },
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 2, controleEmotionnel: 1, force: 1 },
          succes: {
            texte: 'On te fait passer une épreuve devant trois jōnin. Ce que la route t’a appris suffit. On te rend un bandeau, et un rang de genin.',
            effets: [{ statut: 'actif' }, { rang: 'genin' }, { drapeau: 'reintegre' }, { succes: 'reintegre' }, { planifier: 'c2_seconde_chance', dansJours: 120 }, ...SUITE_VILLAGE],
          },
          echec: {
            texte: 'On t’écoute poliment. On te raccompagne à la porte. Peut-être une autre année.',
            effets: [{ planifier: 'c2r_contrat', dansJours: 200 }, { planifier: 'c2r_kusa', dansJours: 600 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2r_contrat',
    titre: 'La tête de Gorō le Rouge',
    categorie: 'mission',
    lieu: 'route_commerce',
    enchaine: true,
    si: ROUTE,
    texte: 'Cinq cents ryō pour la tête de Gorō le Rouge, ancien jōnin devenu chef de pillards. On le dit lent et cruel. On dit aussi qu’il a tué les trois derniers chasseurs venus le chercher.',
    choix: [
      {
        id: 'duel',
        texte: 'Le provoquer en duel',
        test: {
          type: 'combat',
          manches: 3,
          difficulte: 60,
          letal: true,
          causeMort: 'tué·e par Gorō le Rouge',
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { arme: 2, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Il est lent, c’est vrai. Il est aussi très fort. Tu ne lui laisses jamais le temps de le montrer. Cinq cents ryō, et une réputation qui court plus vite que toi.',
            effets: [{ stat: 'jauges.ryo', delta: 500 }, { stat: 'social.reputationOmbre', delta: 10 }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Il te brise le bras, puis il rit, et il te laisse partir. « Reviens quand tu seras un adulte. »',
            effets: [{ blessure: { id: 'bras_brise', nom: 'Bras brisé', gravite: 2, jours: 60 } }],
          },
        },
      },
      {
        id: 'nuit',
        texte: 'L’atteindre de nuit, dans son camp',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { discretion: 3, agilite: 1 },
          succes: {
            texte: 'Personne ne te voit entrer. Personne ne te voit sortir. Le matin, le camp de Gorō n’a plus de chef.',
            effets: [{ stat: 'jauges.ryo', delta: 500 }, { ethique: { honneur: -4 } }, { stat: 'social.reputationOmbre', delta: 6 }],
          },
          echec: {
            texte: 'Un chien aboie. Tu fuis sous les flèches, sans la tête et sans tes affaires.',
            effets: [{ stat: 'jauges.sante', delta: -20 }, { stat: 'jauges.ryo', delta: -40 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2r_kusa',
    titre: 'Le village sans nom',
    categorie: 'civils',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: ROUTE,
    texte: 'Un village de paysans, à la frontière du Pays de l’Herbe. Une bande de déserteurs y prend chaque hiver la moitié des récoltes. Le doyen n’a que soixante ryō à t’offrir, et un toit pour l’hiver.',
    choix: [
      {
        id: 'defendre',
        texte: 'Défendre le village quand les déserteurs reviendront',
        test: {
          type: 'combat',
          difficulte: 60,
          letal: true,
          causeMort: 'tombé·e en défendant un village qui n’avait pas de nom',
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: {
            texte: 'Ils étaient sept. Ils repartent à trois, sans rien. Au printemps, les enfants du village te suivent partout en imitant tes gestes. On te propose de rester. Pour la première fois depuis longtemps, tu y penses vraiment.',
            effets: [{ stat: 'jauges.ryo', delta: 60 }, { ethique: { compassion: 8, honneur: 6 } }, { drapeau: 'c2r_kusa_sauve' }, ...combatPouvoir()],
          },
          echec: {
            texte: 'Tu en retiens assez pour que les villageois s’enfuient dans la forêt. Le village brûle. Ils sont vivants. Ce n’est pas rien.',
            effets: [{ blessure: { id: 'brulures', nom: 'Brûlures', gravite: 2, jours: 40 } }, { ethique: { compassion: 4 } }],
          },
        },
      },
      {
        id: 'former',
        texte: 'Apprendre aux villageois à se défendre eux-mêmes',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 2, intellect: 2 },
          succes: {
            texte: 'Un hiver à leur apprendre les pièges, les signaux, la retraite. Quand les déserteurs arrivent, ils trouvent un village qui sait se battre, et ils passent leur chemin.',
            effets: [{ ethique: { compassion: 6 } }, { stat: 'attributs.charisme', delta: 2 }, { drapeau: 'c2r_kusa_sauve' }],
          },
          echec: {
            texte: 'Les paysans ne sont pas des soldats. Au premier assaut, ils fuient, et toi avec eux.',
            effets: [{ stat: 'attributs.controleEmotionnel', delta: -1 }],
          },
        },
      },
      {
        id: 'passer',
        texte: 'Prendre les soixante ryō… et partir avant l’hiver',
        effets: [{ stat: 'jauges.ryo', delta: 60 }, { ethique: { compassion: -8, honneur: -6 } }],
        resultat: 'Tu pars un matin de brouillard. Tu ne te retournes pas. Au printemps, sur la route, quelqu’un te raconte ce qui est arrivé au village.',
      },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c2r_fin',
    titre: 'Ce que la route fait de toi',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    priorite: 30,
    si: { tout: [ROUTE, { un: [{ vu: 'c2r_kusa' }, { age: { min: 18 } }] }] },
    texte: [
      { texte: 'Un soir de pluie, sous un pont, tu fais les comptes. Les primes, les cicatrices, les visages de ceux que tu as laissés derrière toi.' },
      { si: { drapeau: 'c2r_corbeau' }, texte: 'La plume du Corbeau, à ta ceinture, est trempée. La bande t’attend à Kōsai.' },
      { si: { drapeau: 'c2r_kusa_sauve' }, texte: 'Un village sans nom garde une chambre pour toi. Tu n’y es jamais retourné·e. Tu sais qu’elle est là.' },
    ],
    choix: [
      {
        id: 'continuer',
        texte: 'Continuer la route, toujours plus loin',
        effets: [{ drapeau: 'chapitre2_fini' }, { fin: 'chapitre_2_route' }],
        resultat: 'Quand la pluie cesse, tu te remets en marche. La route n’a pas de fin. C’est peut-être pour ça que tu l’aimes.',
      },
      {
        id: 'racines',
        texte: 'Te promettre de bâtir quelque chose, un jour',
        effets: [{ ethique: { compassion: 4 } }, { drapeau: 'chapitre2_fini' }, { fin: 'chapitre_2_route' }],
        resultat: 'Un toit, des gens, un nom à toi. Pas encore. Mais tu sais maintenant que tu le veux.',
      },
    ],
  },
];
