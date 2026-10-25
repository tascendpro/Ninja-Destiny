import type { Condition, EventDef } from '../../engine/types';

// Refoulé·e de l'Académie après trois échecs : la vie civile, la route, ou la désertion.
// Sur la route, on progresse en se battant ailleurs ; on peut aussi y mourir, et parfois revenir.

const base = { chapitre: 1, arc: 'formation' as const };
const SUR_LA_ROUTE: Condition = { statut: ['errant', 'deserteur', 'exile'] };
const VOIE = (v: string): Condition => ({ drapeau: 'errance_voie', egal: v });

export const ERRANCE: EventDef[] = [
  {
    ...base,
    arc: 'examens',
    id: 'r_refoule',
    titre: 'Refoulé·e',
    categorie: 'examen',
    lieu: '$academie',
    enchaine: true,
    si: { tout: [{ drapeau: 'refoule' }, { statut: 'actif' }, { rang: 'eleve' }] },
    personnages: ['@parent'],
    texte: [
      {
        texte:
          'L’instructeur principal te rend ton dossier sans te regarder. Trois examens, trois échecs. Le règlement est clair : l’Académie ne te gardera pas une année de plus. Dans le couloir, des élèves plus jeunes font semblant de ne pas t’avoir vu{e}.',
      },
      { si: { pnj: '@parent', etat: ['vivant', 'blesse'] }, texte: 'Le soir, {parent} ne dit rien. C’est pire que des reproches.' },
      { texte: 'Le village n’a plus de place pour toi. Il reste le reste du monde.' },
    ],
    choix: [
      {
        id: 'civil',
        texte: 'Accepter : il y a d’autres vies que celle de ninja',
        effets: [{ statut: 'civil' }, { fin: 'vie_civile', cause: 'refoulé·e de l’Académie' }],
        resultat: 'Tu ranges ton kunai d’élève au fond d’un tiroir. Tu ne le ressortiras pas.',
      },
      {
        id: 'route',
        texte: 'Partir : si le village ne veut pas de toi, le monde t’apprendra',
        effets: [
          { statut: 'errant' },
          { drapeau: 'errance' },
          { relation: '@parent', delta: { attachement: -6, respect: 6 } },
          { journal: 'Refoulé·e de l’Académie, tu prends la route pour devenir fort·e ailleurs.', importance: 3 },
          { planifier: 'e_quatorze', dansJours: 420 },
          { succes: 'route' },
        ],
        resultat: 'Tu pars avant l’aube, un sac sur l’épaule et un kunai dans la ceinture. Personne ne t’arrête. C’est peut-être ça, le plus dur.',
      },
      {
        id: 'parchemin',
        texte: 'Voler un rouleau des archives interdites, et disparaître',
        indice: 'Un vol aux archives fait de toi un déserteur, traqué.',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { discretion: 2, agilite: 1 },
          succes: {
            texte: 'Les gardes changent de tour à minuit. À minuit et deux minutes, tu es sur les toits, un rouleau scellé contre la poitrine. À l’aube, tu as passé la frontière. Au village, ton nom rejoint le registre des déserteurs.',
            effets: [
              { statut: 'deserteur' },
              { drapeau: 'parchemin_vole' },
              { entrainer: 'ninjutsu', jours: 60 },
              { stat: 'social.loyaute', delta: -40 },
              { journal: 'Tu voles un rouleau interdit et tu fuis le village. Désormais, on te chasse.', importance: 3 },
              { planifier: 'e_quatorze', dansJours: 420 },
            ],
          },
          echec: {
            texte: 'Une clochette de sceau, tendue au ras du sol. Tu ne l’as pas vue. Les gardes sont sur toi avant que tu atteignes la fenêtre.',
            effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'pris·e en volant les archives interdites' }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'e_route',
    titre: 'La croisée des chemins',
    categorie: 'quotidien',
    lieu: 'route_commerce',
    priorite: 85,
    si: SUR_LA_ROUTE,
    texte:
      'Trois jours de marche plus tard, la route du sel se divise en quatre. À l’ouest, le col de la Pie, où une bande prélève sa part sur chaque convoi. Au nord, le Pays du Fer, où l’on dit que les samouraïs enseignent le sabre à qui balaie leurs dojos. À l’est, le bourg de Kōsai, où l’on se bat pour de l’argent dans des caves. Au sud, un sentier qui monte vers un temple que personne ne visite plus.',
    choix: [
      {
        id: 'fer',
        texte: 'Le nord : le dojo des samouraïs',
        effets: [{ drapeau: 'errance_voie', valeur: 'fer' }, { drapeau: 'lieu_errance', valeur: 'pays_fer' }, { decouvrir: 'lieu:pays_fer' }],
        resultat: 'La neige commence au troisième col. Tu n’as pas les bonnes chaussures. Tu continues quand même.',
      },
      {
        id: 'kosai',
        texte: 'L’est : les combats de Kōsai',
        effets: [{ drapeau: 'errance_voie', valeur: 'kosai' }, { drapeau: 'lieu_errance', valeur: 'marche_noir' }, { decouvrir: 'lieu:marche_noir' }],
        resultat: 'Kōsai sent la friture, l’alcool et le sang séché. On t’y regarde comme une bourse sur pattes. Tu apprendras à rendre ces regards.',
      },
      {
        id: 'temple',
        texte: 'Le sud : le temple oublié',
        effets: [{ drapeau: 'errance_voie', valeur: 'temple' }, { drapeau: 'lieu_errance', valeur: 'temple_oublie' }, { decouvrir: 'lieu:temple_oublie' }],
        resultat: 'Mille marches mangées par la mousse. En haut, de la fumée monte d’un toit à moitié effondré. Quelqu’un vit ici.',
      },
      {
        id: 'col',
        texte: 'L’ouest : le col de la Pie, où les convois paient pour passer',
        indice: 'La voie du crime : butin, prime sur ta tête, et ton village qui finit par envoyer ses traqueurs.',
        effets: [{ drapeau: 'errance_voie', valeur: 'bandit' }, { drapeau: 'lieu_errance', valeur: 'frontiere_herbe' }, { decouvrir: 'lieu:frontiere_herbe' }],
        resultat: 'La route de l’ouest monte entre des rochers où l’on voit des restes de charrettes brûlées. Personne n’y voyage seul. Toi, si.',
      },
    ],
  },
  {
    ...base,
    id: 'e_dojo',
    titre: 'Le dojo de Tetsu',
    categorie: 'entrainement',
    lieu: 'pays_fer',
    priorite: 70,
    si: { tout: [SUR_LA_ROUTE, VOIE('fer')] },
    texte:
      'Le dojo de maître Tetsu n’accepte pas les ninjas. « Vous trichez avec le chakra », dit-il. Puis il regarde tes mains, tes pieds nus abîmés par la neige, et il ajoute : « Mais tu n’es pas un ninja. Tu n’es rien du tout. Ça peut se travailler. »',
    choix: [
      {
        id: 'balayer',
        texte: 'Balayer le dojo pendant un an avant de toucher un sabre',
        duree: 90,
        effets: [
          { drapeau: 'maitre_dojo' },
          { drapeau: 'mentor:famille_kenjutsu' },
          { entrainer: 'famille_kenjutsu', jours: 90, mentor: true },
          { stat: 'attributs.controleEmotionnel', delta: 5 },
          { obtenirArme: 'katana_simple' },
        ],
        resultat:
          'Un an de balai, de bois sec et de silence. Un matin, Tetsu te lance un sabre sans prévenir. Tu l’attrapes par la poignée. Il hoche la tête, une seule fois. « Maintenant, on commence. »',
      },
      {
        id: 'defier',
        texte: 'Défier son meilleur élève pour prouver ta valeur',
        test: {
          type: 'combat',
          difficulte: 40,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          succes: {
            texte: 'Tu perds le duel, mais tu te relèves sept fois. À la huitième, Tetsu arrête le combat. « Celui-là reste. »',
            effets: [{ drapeau: 'maitre_dojo' }, { drapeau: 'mentor:famille_kenjutsu' }, { entrainer: 'famille_kenjutsu', jours: 45, mentor: true }, { obtenirArme: 'katana_simple' }],
          },
          echec: {
            texte: 'Trois coups, trois chutes. L’élève ne te regarde même plus. Tetsu te montre la porte : « Reviens quand tu sauras perdre. »',
            effets: [{ blessure: { id: 'bleus_dojo', nom: 'Bleus du dojo', gravite: 1, jours: 20 } }],
          },
        },
      },
      {
        id: 'partir',
        texte: 'Repartir : ici, on méprise ce que tu voulais devenir',
        effets: [{ ethique: { honneur: 2 } }, { drapeau: 'errance_voie', valeur: 'libre' }],
        resultat: 'Tu redescends le col. Le vent te pousse dans le dos. Le monde est grand, et tu n’as pas fini de le voir.',
      },
    ],
  },
  {
    ...base,
    id: 'e_arene',
    titre: 'Les caves de Kōsai',
    categorie: 'conflit_clans',
    lieu: 'marche_noir',
    priorite: 70,
    si: { tout: [SUR_LA_ROUTE, VOIE('kosai')] },
    texte:
      'Sous la taverne du Chien borgne, on se bat dans une fosse éclairée à la lanterne. L’organisateur, un homme aux dents en or, te jauge. « Au premier sang, cinquante ryō. À mort, deux cents. Les gamins, ça plaît au public. Surtout quand ils perdent. »',
    choix: [
      {
        id: 'sang',
        texte: 'Combattre au premier sang',
        test: {
          type: 'combat',
          difficulte: 36,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          elementAdverse: 'doton',
          succes: {
            texte: 'Une entaille sur la joue de l’adversaire, et l’arbitre lève ton bras. La foule siffle : elle voulait plus. L’organisateur te glisse cinquante ryō et un regard intéressé.',
            effets: [{ stat: 'jauges.ryo', delta: 50 }, { stat: 'social.reputationOmbre', delta: 3 }],
          },
          echec: {
            texte: 'Le premier sang, c’est le tien. Tu repars sans un ryō, une main sur l’arcade.',
            effets: [{ blessure: { id: 'arcade', nom: 'Arcade ouverte', gravite: 1, jours: 15 } }],
          },
        },
      },
      {
        id: 'mort',
        texte: 'Combattre à mort, pour la grosse bourse',
        si: { age: { min: 11 } },
        verrou: 'Même ici, on ne fait pas combattre à mort un enfant de ton âge.',
        indice: 'L’un de vous deux ne remontera pas l’escalier.',
        test: {
          type: 'combat',
          difficulte: 44,
          attributs: { agilite: 1, force: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          elementAdverse: 'raiton',
          causeMort: 'tombé·e dans la fosse de Kōsai, pour deux cents ryō',
          succes: {
            texte: 'Ça dure longtemps. Puis ça s’arrête. L’homme en face ne se relève pas, et la foule hurle ton nom qu’elle ne connaissait pas une minute avant. Tu remontes l’escalier avec deux cents ryō et quelque chose de cassé que tu ne sais pas nommer.',
            effets: [
              { stat: 'jauges.ryo', delta: 200 },
              { stat: 'social.reputationOmbre', delta: 8 },
              { ethique: { compassion: -8, ambition: 4 } },
              { drapeau: 'tue_arene' },
              { journal: 'Tu as tué pour la première fois, dans une fosse, pour de l’argent.', importance: 3 },
              { succes: 'arene' },
            ],
          },
          echec: {
            texte: 'Tu perds. On te traîne hors de la fosse avant le coup de grâce : le public a eu ce qu’il voulait. Tu te réveilles dans une ruelle, vivant{e}, plus pauvre et moins naïf·ve.',
            effets: [{ blessure: { id: 'fosse', nom: 'Blessures de la fosse', gravite: 2, jours: 45 } }],
          },
        },
      },
      {
        id: 'regarder',
        texte: 'Regarder et apprendre, d’abord',
        effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.intellect', delta: 2 }],
        resultat: 'Pendant des semaines, tu regardes. Qui gagne, comment, pourquoi. Tu remarques que les meilleurs ne frappent presque jamais en premier.',
      },
    ],
  },
  {
    ...base,
    id: 'e_ermite',
    titre: 'L’ermite du temple',
    categorie: 'entrainement',
    lieu: 'temple_oublie',
    priorite: 70,
    si: { tout: [SUR_LA_ROUTE, VOIE('temple')] },
    texte:
      'L’homme qui vit au temple a cent ans, ou cinquante, ou aucun âge. Il ne te demande pas ton nom. Il te tend un bol de riz et dit : « Le chakra ne se force pas. Il se laisse venir, comme l’eau dans un trou. Tu es un trou très agité. »',
    choix: [
      {
        id: 'mediter',
        texte: 'Méditer sous la cascade, chaque matin, une saison entière',
        duree: 90,
        effets: [
          { drapeau: 'maitre_ermite' },
          { stat: 'attributs.controleChakra', delta: 7 },
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { stat: 'jauges.chakraMax', delta: 10 },
          { entrainer: 'ninjutsu', jours: 60, mentor: true },
        ],
        resultat: 'L’eau glacée te coupe le souffle les premiers jours. Puis un matin, tu ne la sens plus. Tu sens autre chose : ton chakra, qui coule enfin dans le même sens que toi.',
      },
      {
        id: 'questionner',
        texte: 'Lui demander pourquoi il vit ici, seul',
        effets: [{ drapeau: 'maitre_ermite' }, { stat: 'attributs.intellect', delta: 3 }, { indice: 'ermite_guerre' }],
        resultat: '« J’ai été ninja. J’ai été bon. J’ai tué un village entier sur ordre, et le soir, j’ai bu du thé. » Il remplit ton bol. « Je suis ici pour me souvenir de ce que j’ai oublié ce soir-là. »',
      },
      {
        id: 'partir',
        texte: 'Repartir : tu n’as pas fait tout ce chemin pour méditer',
        effets: [{ drapeau: 'errance_voie', valeur: 'libre' }, { ethique: { ambition: 3 } }],
        resultat: 'Il hausse les épaules. « Tu reviendras. Ou pas. L’eau, elle, sera toujours froide. »',
      },
    ],
  },
  {
    ...base,
    id: 'e_duel',
    titre: 'Le rōnin du pont',
    categorie: 'conflit_clans',
    lieu: 'route_commerce',
    poids: 5,
    repetable: { delaiJours: 300, max: 2 },
    si: { tout: [SUR_LA_ROUTE, { age: { min: 11 } }] },
    texte:
      'Un homme en kimono délavé est assis au milieu du pont, un sabre en travers des genoux. « Personne ne passe sans se battre. Pas de premier sang, pas d’arbitre. Si tu gagnes, tu passes. Si tu perds, tu restes. » Il désigne la rivière en contrebas.',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter le duel à mort',
        test: {
          type: 'combat',
          difficulte: 42,
          attributs: { agilite: 1, perception: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tombé·e sur un pont, face à un rōnin dont tu ne connaissais pas le nom',
          succes: { texte: 'Il était plus fort que toi. Mais il était fatigué, et tu ne l’étais pas. Il glisse, son sabre tombe. Il est à terre, ta lame contre sa gorge.', effets: [], suite: 'e_duel_fin' },
          echec: {
            texte: 'Il te désarme au troisième échange et te frappe du plat de la lame. « Pas aujourd’hui », dit-il en te jetant dans la rivière. Tu t’en sors, trempé{e}, humilié{e}, vivant{e}.',
            effets: [{ blessure: { id: 'pont', nom: 'Coups de sabre', gravite: 2, jours: 30 } }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser et faire demi-tour',
        effets: [{ ethique: { honneur: -3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Il rit. « Sage. Ou lâche. Les deux ont des enfants. » Tu fais trois jours de détour.',
      },
      {
        id: 'ruse',
        texte: 'Tenter de passer par la ruse',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { discretion: 1, intellect: 1 },
          succes: { texte: 'Une diversion côté forêt, un passage sous le tablier du pont. Tu es de l’autre côté avant qu’il ne comprenne.', effets: [{ stat: 'attributs.discretion', delta: 2 }] },
          echec: {
            texte: 'Il t’attendait sous le pont. « Tout le monde essaie ça. » Le coup de poing te laisse étourdi{e} sur la berge.',
            effets: [{ stat: 'jauges.sante', delta: -15 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'e_duel_fin',
    titre: 'Le rōnin à terre',
    categorie: 'conflit_clans',
    lieu: 'route_commerce',
    enchaine: true,
    si: SUR_LA_ROUTE,
    texte: 'Il ne supplie pas. Il te regarde, calme. « Alors ? C’était un duel à mort. Je l’ai dit. »',
    choix: [
      {
        id: 'achever',
        texte: 'Tenir parole : l’achever',
        effets: [{ ethique: { compassion: -10, honneur: 3 } }, { stat: 'social.reputationOmbre', delta: 4 }, { stat: 'jauges.ryo', delta: 40 }, { journal: 'Tu as achevé un rōnin sur un pont, comme il l’avait demandé.', importance: 2 }],
        resultat: 'Ça ne prend qu’un instant. Ce qui suit dure beaucoup plus longtemps. Dans sa bourse, quarante ryō et le portrait d’une femme.',
      },
      {
        id: 'epargner',
        texte: 'L’épargner : tu ne tues pas un homme à terre',
        indice: 'Ta conviction peut te coûter cher.',
        test: {
          type: 'combat',
          difficulte: 36,
          attributs: { perception: 2, agilite: 1 },
          letal: true,
          causeMort: 'poignardé·e par l’homme que tu venais d’épargner',
          succes: {
            texte: 'Tu recules d’un pas. Sa main glisse vers un poignard caché, et tu l’avais vu venir. Il sourit, range le poignard. « Bien. Tu vivras peut-être assez longtemps pour être dangereux. »',
            effets: [{ ethique: { compassion: 8, honneur: 4 } }, { stat: 'attributs.perception', delta: 2 }],
          },
          echec: {
            texte: 'Tu tournes le dos un instant de trop. La lame entre sous les côtes. Tu tombes, il s’en va. Tu survis, cette fois, parce qu’un convoi passe le pont une heure plus tard.',
            effets: [{ blessure: { id: 'poignard_dos', nom: 'Coup de poignard', gravite: 3, jours: 60 } }, { ethique: { compassion: -4 } }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'e_chasseurs',
    titre: 'Les chasseurs',
    categorie: 'desertion',
    lieu: 'route_commerce',
    poids: 7,
    repetable: { delaiJours: 360, max: 2 },
    si: { tout: [{ statut: 'deserteur' }, { drapeau: 'parchemin_vole' }] },
    texte: 'Trois silhouettes masquées sur la route, de dos, qui ne bougent pas. Sur leurs masques, le symbole de ton village. Ils ne disent rien : les chasseurs de déserteurs ne parlent jamais à leurs proies.',
    choix: [
      {
        id: 'combattre',
        texte: 'Combattre',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { agilite: 1, perception: 1, controleChakra: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'abattu·e par les chasseurs de déserteurs de ton propre village',
          succes: { texte: 'Tu en blesses un, les deux autres hésitent une seconde. Une seconde suffit : tu es dans la forêt, puis dans la rivière, puis ailleurs.', effets: [{ stat: 'social.reputationOmbre', delta: 6 }] },
          echec: { texte: 'Ils sont trois, ils sont entraînés, et tu ne l’es pas assez. Tu t’échappes en laissant du sang derrière toi.', effets: [{ blessure: { id: 'chasseurs', nom: 'Blessures des chasseurs', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Fuir avant qu’ils se retournent',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { discretion: 2, agilite: 1 },
          succes: { texte: 'Tu recules sans un bruit. Quand ils se retournent, la route est vide.', effets: [{ stat: 'attributs.discretion', delta: 2 }] },
          echec: { texte: 'Une branche craque. Ils sont sur toi avant que tu atteignes les arbres.', effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'repris·e par les chasseurs de ton village' }] },
        },
      },
      {
        id: 'rendre',
        texte: 'Te rendre',
        effets: [{ statut: 'capture' }, { fin: 'capture', cause: 'reddition aux chasseurs de déserteurs' }],
        resultat: 'Tu poses ton kunai sur la route et tu tends les poignets. Ils ne disent toujours rien.',
      },
    ],
  },
  {
    ...base,
    id: 'e_reintegration',
    titre: 'La patrouille',
    categorie: 'promotion',
    lieu: 'route_commerce',
    priorite: 65,
    si: {
      tout: [
        { statut: 'errant' },
        { age: { min: 12 } },
        {
          un: [
            { maitrise: 'taijutsu', palierMin: 3 },
            { maitrise: 'famille_kenjutsu', palierMin: 2 },
            { maitrise: 'ninjutsu', palierMin: 3 },
            { drapeau: 'maitre_dojo' },
            { drapeau: 'maitre_ermite' },
            { drapeau: 'tue_arene' },
          ],
        },
      ],
    },
    texte:
      'Une patrouille de ton village croise ta route. Le jōnin qui la mène te reconnaît, et s’arrête. « Le gamin refoulé. » Il te détaille longtemps : les cicatrices, la façon dont tu te tiens. « Le Kage a une règle : un talent qui revient a droit à une épreuve. Une seule. Tu la veux ? »',
    choix: [
      {
        id: 'epreuve',
        texte: 'Accepter l’épreuve',
        test: {
          type: 'combat',
          difficulte: 40,
          attributs: { agilite: 1, force: 1, controleChakra: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          succes: {
            texte: 'Le combat dure moins d’une minute. Le jōnin se relève en frottant sa mâchoire, et sort un bandeau frontal de sa poche. « J’en garde toujours un. On ne sait jamais. »',
            effets: [
              { statut: 'actif' },
              { rang: 'genin' },
              { metier: 'terrain' },
              { drapeau: 'diplome' },
              { drapeau: 'reintegre' },
              { stat: 'social.reputation', delta: 6 },
              { journal: 'Réintégré·e au village après des années sur les routes. Tu deviens genin.', importance: 3 },
              { succes: 'reintegre' },
            ],
          },
          echec: {
            texte: 'Tu perds. Le jōnin hoche la tête, sans mépris. « Pas encore. La route t’attend. » La patrouille repart sans toi.',
            effets: [{ stat: 'jauges.sante', delta: -10 }],
          },
        },
      },
      {
        id: 'refuser',
        texte: '« La route est devenue ma maison. »',
        effets: [{ drapeau: 'route_choisie' }, { ethique: { ambition: -2, honneur: 3 } }],
        resultat: 'Il ne discute pas. « Si tu changes d’avis, tu sais où nous trouver. » Tu le sais. Tu ne changeras pas d’avis. Ou peut-être que si.',
      },
    ],
  },
  {
    ...base,
    arc: 'examens',
    id: 'e_quatorze',
    titre: 'Une année sur la route',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    enchaine: true,
    si: SUR_LA_ROUTE,
    texte: [
      { texte: 'Plus d’un an sur la route. Au village, ceux de ta promotion préparent l’examen de chūnin. Toi, tu passes une nuit de plus à la belle étoile, ton sac sous la tête.' },
      { si: { drapeau: 'maitre_dojo' }, texte: 'Tes mains ont la corne du sabre. Tetsu t’a appris à dégainer avant de penser.' },
      { si: { drapeau: 'tue_arene' }, texte: 'Dans les caves de Kōsai, on prononce ton prénom à voix basse.' },
      { si: { drapeau: 'maitre_ermite' }, texte: 'Le chakra coule en toi comme l’eau froide de la cascade.' },
      { si: { statut: 'deserteur' }, texte: 'Quelque part, un dossier porte ton nom et la mention « à abattre ».' },
    ],
    choix: [
      {
        id: 'continuer',
        texte: 'Reprendre la route au matin',
        effets: [{ drapeau: 'chapitre1_fini' }, { fin: 'chapitre_1_route' }],
        resultat: 'Le soleil se lève sur une route que tu ne connais pas encore. C’est la meilleure sorte de route.',
      },
    ],
  },
];
