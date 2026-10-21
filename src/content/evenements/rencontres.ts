import type { Condition, Effect, EventDef } from '../../engine/types';

// Rencontres de lieu : des scènes tirées pendant le temps libre, chacune attachée à un type de décor
// (terrain d'entraînement, forêt, village, base secrète, champ de bataille, lieux légendaires).
// Chaque choix laisse une trace : progression, relation, réputation, secret, ou suite planifiée.

const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'conflit' as const };
const ACTIF: Condition = { statut: 'actif' };
const LIBRE: Condition = { statut: ['actif', 'errant', 'deserteur', 'exile'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

/** La première technique offensive que chaque clan enseigne à ses membres. */
const TECHNIQUE_DE_CLAN: [string, string][] = [
  ['uchiha', 'katon_boule'],
  ['hyuga', 'hyuga_kusho'],
  ['nara', 'nara_kubi'],
  ['yamanaka', 'yamanaka_shinranshin'],
  ['akimichi', 'akimichi_nikudan'],
  ['inuzuka', 'inuzuka_gatsuga'],
  ['aburame', 'aburame_essaim'],
  ['kaguya', 'kaguya_tsubaki'],
  ['yuki', 'yuki_sensatsu'],
  ['uzumaki', 'uzumaki_kongo'],
  ['hozuki', 'hozuki_suika'],
  ['senju', 'mokuton_jukai'],
  ['shirakaze', 'shirakaze_rideau'],
  ['raiko', 'raiko_charge'],
  ['ishikawa', 'ishikawa_poing'],
];
const ENSEIGNER_CLAN: Effect[] = TECHNIQUE_DE_CLAN.map(([clan, tech]) => ({ si: { clan }, alors: [{ apprendre: tech, source: 'mentor' }] }));

export const RENCONTRES: EventDef[] = [
  // ── Terrain d'entraînement ──
  {
    ...base,
    id: 'r_terrain_rival',
    titre: 'Une démonstration',
    categorie: 'rivalite',
    lieu: '$terrain',
    decor: 'terrain_aube',
    poids: 4,
    repetable: { delaiJours: 500, max: 3 },
    si: { tout: [ACTIF, RIVAL, { rangMin: 'genin' }, { age: { min: 12 } }] },
    personnages: ['@rival'],
    texte: 'À l’aube, sur le terrain désert, {@rival} répète une technique nouvelle. Le poteau en face de lui explose en échardes. Il t’a vu. Il ne fait pas semblant du contraire. « Tu veux voir de plus près ? »',
    choix: [
      {
        id: 'duel',
        texte: 'Un duel amical, pour voir',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1 },
          manches: 2,
          succes: { texte: 'Tu le mets au sol deux fois. Il se relève en riant, pour une fois. « La prochaine fois, je ne retiens rien. »', effets: [{ relation: '@rival', delta: { respect: 10, rivalite: 5 } }, { stat: 'social.reputation', delta: 2 }, { entrainer: 'taijutsu', jours: 20 }] },
          echec: { texte: 'Sa technique te prend de plein fouet. Il te tend la main pour te relever. Ce geste-là fait plus mal que le coup.', effets: [{ relation: '@rival', delta: { rivalite: 8 } }, { stat: 'jauges.sante', delta: -10 }, { entrainer: 'taijutsu', jours: 15 }] },
        },
      },
      {
        id: 'observer',
        texte: 'Le regarder faire, en silence, et retenir',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { perception: 2, intellect: 1 },
          maitrises: { sharingan: 1 },
          succes: { texte: 'Tu comprends le mouvement avant qu’il ne le comprenne lui-même. Le soir, seul·e, tu le refais. Presque.', effets: [{ entrainer: 'ninjutsu', jours: 40 }, { stat: 'attributs.perception', delta: 1 }] },
          echec: { texte: 'Tu ne vois que le résultat, jamais le geste. Il le sait, et il recommence exprès.', effets: [{ relation: '@rival', delta: { rivalite: 4 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'r_terrain_maitre',
    titre: 'L’ancien du clan',
    categorie: 'entrainement',
    lieu: '$terrain',
    decor: 'zone_jonin',
    poids: 3,
    repetable: { delaiJours: 900, max: 2 },
    si: { tout: [ACTIF, { non: { clan: 'sans_clan' } }, { age: { min: 12 } }] },
    texte: 'Un vieil homme du clan, que tu as toujours vu somnoler à l’ombre du dojo, t’attend au bord du terrain. « On m’a dit que tu progressais. On m’a dit aussi que tu progressais mal. Viens. Je vais te montrer ce que les rouleaux ne disent pas. »',
    choix: [
      {
        id: 'apprendre',
        texte: 'Le suivre et apprendre la technique du clan',
        duree: 60,
        effets: [...ENSEIGNER_CLAN, { stat: 'social.confianceClan', delta: 6 }, { stat: 'jauges.fatigue', delta: 20 }],
        resultat: 'Deux mois d’un enseignement sans un mot de trop. Il corrige un angle, une respiration, un ordre de signes. Le dernier jour, il hoche la tête une seule fois, et repart dormir à l’ombre.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : tu veux trouver ta propre voie',
        effets: [{ stat: 'social.confianceClan', delta: -6 }, { ethique: { ambition: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Il hausse les épaules. « Les jeunes croient toujours inventer la roue. » Au clan, on parle de ton refus pendant des semaines.',
      },
    ],
  },

  // ── Forêt ──
  {
    ...base,
    id: 'r_foret_parchemin',
    titre: 'Un rouleau sous les racines',
    categorie: 'quotidien',
    lieu: 'foret_feu',
    decor: 'foret_arbres_geants',
    poids: 4,
    repetable: { delaiJours: 720, max: 2 },
    si: { tout: [LIBRE, { age: { min: 10 } }] },
    texte: 'Entre les racines d’un arbre fendu par la foudre, un étui de cuir noirci. Dedans, un rouleau scellé à la cire, l’emblème d’un clan effacé par le temps. Le sceau est intact. Quelqu’un a voulu qu’on ne l’ouvre jamais.',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Briser le sceau et le lire',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { intellect: 2, controleChakra: 1 },
          succes: { texte: 'Le sceau cède sans piège. Ce sont des notes de ninjutsu, d’une écriture serrée, plus fines que tout ce qu’on t’a appris. Tu les apprends par cœur avant de les brûler.', effets: [{ entrainer: 'ninjutsu', jours: 60 }, { stat: 'attributs.controleChakra', delta: 2 }, { indice: 'rouleau_clan_efface' }] },
          echec: { texte: 'Le sceau était piégé. L’explosion t’arrache des sourcils et un bout d’oreille. Il ne reste du rouleau que des cendres.', effets: [{ blessure: { id: 'sceau_piege', nom: 'Brûlures d’un sceau piégé', gravite: 2, jours: 30 } }] },
        },
      },
      {
        id: 'rapporter',
        texte: 'Le rapporter intact aux archives du village',
        si: ACTIF,
        effets: [{ stat: 'social.loyaute', delta: 5 }, { stat: 'jauges.ryo', delta: 60 }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'L’archiviste pâlit en voyant l’emblème. On te paie, on te remercie, et on te demande de ne parler à personne de cette forêt.',
      },
      {
        id: 'vendre',
        texte: 'Le vendre au marché noir de Kōsai',
        effets: [{ stat: 'jauges.ryo', delta: 220 }, { stat: 'social.reputationOmbre', delta: 4 }, { ethique: { honneur: -4 } }],
        resultat: 'Le receleur ne marchande même pas. C’est mauvais signe : tu as vendu quelque chose qui valait bien plus.',
      },
    ],
  },
  {
    ...base,
    id: 'r_foret_invocation',
    titre: 'Une bête qui parle',
    categorie: 'quotidien',
    lieu: 'foret_feu',
    decor: 'site_invocation',
    poids: 3,
    repetable: { delaiJours: 1500, max: 1 },
    si: { tout: [LIBRE, { age: { min: 11 } }, { drapeau: 'pacte_animal', absent: true }] },
    texte: 'Au fond d’un cratère cerclé de vieux sceaux, un crapaud grand comme un veau, une patte prise dans un piège à ours, te regarde sans peur. « Bon. Tu vas rester planté là, ou tu vas m’aider, gamin ? » Il parle.',
    choix: [
      {
        id: 'aider',
        texte: 'Ouvrir le piège et soigner sa patte',
        effets: [{ drapeau: 'pacte_animal', valeur: 'crapauds' }, { ethique: { compassion: 5 } }, { stat: 'attributs.controleChakra', delta: 2 }, { journal: 'Un crapaud du mont Myōboku te doit une faveur.', importance: 2 }],
        resultat: 'Il fléchit la patte, satisfait. « Je m’appelle Gamakichi. Le jour où tu signeras un vrai contrat, demande les crapauds. On se souviendra de toi. » Il disparaît dans un nuage de fumée.',
      },
      {
        id: 'contrat',
        texte: 'Lui demander un pacte en échange de ton aide',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { charisme: 2, controleChakra: 1 },
          succes: { texte: 'Il rit, d’un rire de crapaud. « Culotté. J’aime ça. » Il crache un rouleau grand comme toi. Tu signes de ton sang. Tu peux désormais appeler des crapauds… quand tu auras assez de chakra.', effets: [{ drapeau: 'pacte_animal', valeur: 'crapauds' }, { drapeau: 'contrat_invocation' }, { stat: 'jauges.chakraMax', delta: 5 }, { ethique: { ambition: 3 } }] },
          echec: { texte: '« On ne marchande pas avec un blessé, gamin. » Il libère sa patte tout seul, d’un coup sec, et disparaît en te traitant de tous les noms.', effets: [{ ethique: { compassion: -2 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'r_foret_poursuite',
    titre: 'L’ombre entre les arbres',
    categorie: 'mission',
    lieu: 'foret_feu',
    decor: 'foret_pleine_lune',
    poids: 4,
    repetable: { delaiJours: 400, max: 3 },
    si: { tout: [ACTIF, { rangMin: 'genin' }] },
    texte: 'En rentrant de nuit, tu croises une silhouette qui file entre les arbres, un sac de rouleaux sur l’épaule. Le sceau du sac est celui de ton village.',
    choix: [
      {
        id: 'poursuivre',
        texte: 'Le poursuivre',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { taijutsu: 1 },
          manches: 2,
          succes: { texte: 'Tu le rattrapes au bord du ravin. Un genin d’un village voisin, terrifié. Le sac est intact.', effets: [{ stat: 'social.reputation', delta: 5 }, { stat: 'social.loyaute', delta: 3 }, { secret: 'voleur_rouleaux' }] },
          echec: { texte: 'Il connaît la forêt mieux que toi. Tu ramènes au village une cheville foulée et une description vague.', effets: [{ blessure: { id: 'cheville', nom: 'Cheville foulée', gravite: 1, jours: 15 } }] },
        },
      },
      {
        id: 'arbres',
        texte: 'Le doubler par la cime des arbres',
        si: { maitrise: 'kinobori', palierMin: 1 },
        verrou: 'Il faudrait savoir courir sur les arbres.',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { agilite: 2 },
          maitrises: { kinobori: 2 },
          succes: { texte: 'Tu cours sur les troncs, de branche en branche, plus vite qu’il ne court sur la terre. Tu lui tombes dessus depuis les branches. Le sac est intact.', effets: [{ stat: 'social.reputation', delta: 5 }, { stat: 'attributs.agilite', delta: 1 }, { secret: 'voleur_rouleaux' }] },
          echec: { texte: 'Une branche morte cède sous tes pieds. Tu le vois disparaître en contrebas.', effets: [{ stat: 'jauges.sante', delta: -6 }] },
        },
      },
      {
        id: 'piege',
        texte: 'Le devancer et lui tendre un piège au gué',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { intellect: 2, discretion: 1 },
          succes: { texte: 'Il tombe droit dans ton filet de fils. Il n’a même pas le temps de comprendre.', effets: [{ stat: 'social.reputation', delta: 6 }, { stat: 'attributs.intellect', delta: 1 }, { secret: 'voleur_rouleaux' }] },
          echec: { texte: 'Il ne passe jamais par le gué. Tu attends jusqu’à l’aube, trempé·e, pour rien.', effets: [{ stat: 'jauges.fatigue', delta: 15 }] },
        },
      },
    ],
  },

  // ── Village ──
  {
    ...base,
    id: 'r_village_rumeur',
    titre: 'Ce qu’on murmure au marché',
    categorie: 'politique',
    lieu: '$village',
    decor: 'marche_village',
    poids: 4,
    repetable: { delaiJours: 600, max: 2 },
    si: { tout: [ACTIF, { age: { min: 13 } }] },
    texte: 'Au marché, deux familles de clans différents se disputent un étal. Les voix montent. On parle d’une vieille dette, d’une fille promise, d’un frère mort pendant la guerre par la faute de l’autre clan. Les mains glissent vers les kunai.',
    choix: [
      {
        id: 'calmer',
        texte: 'T’interposer et calmer tout le monde',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { charisme: 2, controleEmotionnel: 1 },
          succes: { texte: 'Tu trouves les mots, ou plutôt le ton. Les kunai restent dans leurs étuis. Le soir, un ancien de chaque clan vient te remercier, chacun de son côté.', effets: [{ stat: 'social.influence', delta: 6 }, { stat: 'social.reputation', delta: 3 }] },
          echec: { texte: 'Tu dis ce qu’il ne fallait pas. Les deux clans se retournent contre toi, unis pour une fois.', effets: [{ stat: 'social.influence', delta: -4 }, { stat: 'jauges.sante', delta: -6 }] },
        },
      },
      {
        id: 'enqueter',
        texte: 'Laisser faire, puis chercher l’origine de la rumeur',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { perception: 2, intellect: 1 },
          succes: { texte: 'La rumeur vient d’un seul homme, qui l’a répandue dans les deux clans à la fois. Il est payé par quelqu’un qui veut que le village se divise.', effets: [{ indice: 'diviser_les_clans' }, { stat: 'attributs.perception', delta: 2 }] },
          echec: { texte: 'Tout le monde a entendu quelque chose, personne ne sait d’où. Tu perds ta trace dans la foule.', effets: [{ stat: 'jauges.fatigue', delta: 8 }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'r_village_attaque',
    titre: 'Le marché en flammes',
    categorie: 'conflit_clans',
    lieu: '$village',
    decor: 'rue_explosion',
    poids: 2,
    repetable: { delaiJours: 1500, max: 1 },
    si: { tout: [ACTIF, { rangMin: 'chunin' }, { chapitre: 3 }] },
    texte: 'Une explosion souffle les étals du marché. Quatre ninjas ennemis sortent de la fumée, kunai au poing, au milieu des civils qui hurlent. Il n’y a que toi dans la rue.',
    choix: [
      {
        id: 'combattre',
        texte: 'Les affronter au milieu de la foule',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e en défendant le marché',
          succes: { texte: 'Les quatre tombent avant l’arrivée des renforts. Pas un civil mort. On parle de toi dans chaque maison, le soir.', effets: [{ stat: 'social.reputation', delta: 10 }, { stat: 'social.loyaute', delta: 4 }] },
          echec: { texte: 'Tu en retiens deux. Les autres s’enfuient, en laissant derrière eux trois corps de civils.', effets: [{ stat: 'social.reputation', delta: -2 }, { ethique: { compassion: 2 } }] },
        },
      },
      {
        id: 'evacuer',
        texte: 'Évacuer les civils d’abord',
        effets: [{ ethique: { compassion: 6 } }, { stat: 'social.reputation', delta: 4 }, { stat: 'social.loyaute', delta: -2 }],
        resultat: 'Tu sors les civils par les arrière-cours. Les ennemis s’enfuient avant l’arrivée des renforts. Personne n’est mort. Le conseil te reproche de les avoir laissés partir.',
      },
    ],
  },
  {
    ...base,
    id: 'r_village_conseil',
    titre: 'Une voix au conseil',
    categorie: 'politique',
    lieu: '$village',
    decor: 'salle_conseil',
    poids: 3,
    repetable: { delaiJours: 1000, max: 2 },
    si: { tout: [ACTIF, { rangMin: 'jonin' }] },
    texte: 'Le conseil veut faire voter une loi : les enfants des clans à kekkei genkai seront inscrits sur un registre, et surveillés. On te demande ton avis, en tant que jōnin. On attend surtout que tu approuves.',
    choix: [
      {
        id: 'approuver',
        texte: 'Approuver : la sécurité du village d’abord',
        effets: [{ stat: 'social.loyaute', delta: 6 }, { stat: 'social.influence', delta: 4 }, { ethique: { compassion: -5 } }, { drapeau: 'registre_lignees' }],
        resultat: 'La loi passe. Dans les clans, on t’en voudra longtemps. Au conseil, on t’écoutera désormais.',
      },
      {
        id: 'opposer',
        texte: 'T’y opposer publiquement',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 2, intellect: 1 },
          succes: { texte: 'Ton discours fait basculer trois voix. La loi tombe. Les clans t’en savent gré ; le conseil, beaucoup moins.', effets: [{ stat: 'social.influence', delta: 8 }, { stat: 'social.confianceClan', delta: 8 }, { stat: 'social.suspicion', delta: 6 }] },
          echec: { texte: 'La loi passe malgré toi. Tu as gagné des ennemis au conseil, et rien changé.', effets: [{ stat: 'social.suspicion', delta: 10 }, { drapeau: 'registre_lignees' }] },
        },
      },
    ],
  },

  // ── Base secrète ──
  {
    ...base,
    id: 'r_base_secrete',
    titre: 'La porte dans la roche',
    categorie: 'organisation',
    lieu: 'carrieres_terre',
    decor: 'base_montagne_ennemie',
    poids: 3,
    repetable: { delaiJours: 1200, max: 2 },
    si: { tout: [LIBRE, { rangMin: 'chunin' }, { age: { min: 16 } }] },
    texte: 'Une porte de fer dissimulée sous un éboulis. Derrière, des couloirs, des cellules, et au bout, deux choses : une salle d’archives pleine de rapports sur ton village, et une cellule où un prisonnier frappe faiblement contre les barreaux.',
    choix: [
      {
        id: 'prisonnier',
        texte: 'Libérer le prisonnier',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 1, discretion: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 2,
          causeMort: 'tombé·e dans une base ennemie',
          succes: { texte: 'Le gardien est à terre, le prisonnier sur ton dos : un éclaireur de ton village, porté disparu depuis un an.', effets: [{ stat: 'social.reputation', delta: 8 }, { ethique: { compassion: 6 } }] },
          echec: { texte: 'Le gardien donne l’alarme. Tu sors seul·e, par où tu es entré·e.', effets: [{ blessure: { id: 'base', nom: 'Blessures de la base', gravite: 2, jours: 30 } }] },
        },
      },
      {
        id: 'archives',
        texte: 'Voler les archives',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { discretion: 2, intellect: 1 },
          succes: { texte: 'Tu ressors avec trois rouleaux de rapports. L’un d’eux nomme un informateur au cœur de ton village. Derrière toi, le prisonnier n’a plus frappé.', effets: [{ secret: 'informateur_village' }, { stat: 'social.loyaute', delta: 5 }, { ethique: { compassion: -4 } }] },
          echec: { texte: 'Une alarme sonne au premier rouleau. Tu fuis les mains vides.', effets: [{ stat: 'jauges.sante', delta: -12 }] },
        },
      },
      {
        id: 'plafond',
        texte: 'Passer par les plafonds : les archives, puis la cellule',
        si: { maitrise: 'kinobori', palierMin: 2 },
        verrou: 'Il faudrait marcher sur les plafonds avec assurance (palier 2).',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { discretion: 2, agilite: 1 },
          maitrises: { kinobori: 2, kawarimi: 1 },
          succes: { texte: 'Tu traverses la base la tête en bas, au-dessus des gardes. Tu prends les rouleaux, puis tu ouvres la cellule par le haut. Tu ressors avec les deux, et personne n’a levé les yeux.', effets: [{ secret: 'informateur_village' }, { stat: 'social.reputation', delta: 8 }, { stat: 'social.loyaute', delta: 4 }, { ethique: { compassion: 4 } }] },
          echec: { texte: 'Un garde lève les yeux au mauvais moment. Tu lâches le plafond et tu fuis avec le prisonnier seulement.', effets: [{ stat: 'social.reputation', delta: 4 }, { stat: 'jauges.sante', delta: -15 }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Ressortir sans bruit et donner l’emplacement au village',
        si: ACTIF,
        effets: [{ stat: 'social.loyaute', delta: 3 }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'Une équipe part le lendemain. Quand elle arrive, la base est vide. Le prisonnier aussi.',
      },
    ],
  },

  // ── Champ de bataille ──
  {
    ...base,
    id: 'r_bataille_survivants',
    titre: 'Après la bataille',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    decor: 'champ_bataille_fumant',
    poids: 4,
    repetable: { delaiJours: 600, max: 2 },
    si: { tout: [ACTIF, { rangMin: 'chunin' }, { un: [{ chapitre: 3 }, { chapitre: 4 }] }] },
    texte: 'La plaine fume encore. Parmi les corps, deux qui respirent : un chūnin de ton village, la jambe broyée, et un ennemi de ton âge, une entaille au ventre. Tu as assez de bandages pour un.',
    choix: [
      {
        id: 'allie',
        texte: 'Soigner le chūnin de ton village',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { ethique: { compassion: -2 } }, { stat: 'social.reputation', delta: 2 }],
        resultat: 'Tu le portes jusqu’au camp. Derrière toi, l’ennemi te regarde partir. Il ne te demande rien.',
      },
      {
        id: 'ennemi',
        texte: 'Soigner l’ennemi : le tien, d’autres viendront le chercher',
        effets: [{ ethique: { compassion: 8, honneur: 3 } }, { stat: 'social.suspicion', delta: 5 }, { drapeau: 'ennemi_soigne' }, { planifier: 'x_epargne_dette', dansJours: 400 }],
        resultat: 'Il te regarde comme un fou pendant que tu bandes son ventre. Les secours de ton village arrivent pour le chūnin, de justesse. Un éclaireur t’a vu faire. Le rapport le mentionnera.',
      },
    ],
  },

  // ── Lieux légendaires ──
  {
    ...base,
    id: 'r_vallee_fin',
    titre: 'La Vallée de la Fin',
    categorie: 'rivalite',
    lieu: 'foret_feu',
    decor: 'vallee_fin_statues',
    poids: 3,
    repetable: { delaiJours: 3000, max: 1 },
    si: { tout: [LIBRE, { age: { min: 16 } }, { un: [{ chapitre: 3 }, { chapitre: 4 }, { chapitre: 5 }] }] },
    texte: [
      { texte: 'Les deux statues se font face au-dessus de la cascade, Hashirama et Madara, figées dans leur dernier combat. On dit que ceux qui viennent ici en ressortent changés.' },
      { si: RIVAL, texte: 'Sur la tête de Madara, quelqu’un t’attend : {@rival}. « Je savais que tu viendrais ici un jour. Moi aussi. »' },
    ],
    choix: [
      {
        id: 'duel',
        texte: 'Affronter {@rival}, ici, pour de bon',
        si: RIVAL,
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { agilite: 1, force: 1, perception: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1 },
          manches: 3,
          succes: { texte: 'Le combat creuse la falaise et fend une statue. À la fin, vous êtes allongés tous les deux dans la rivière, à bout de souffle. « Toi », dit-il simplement. Ça veut dire : tu as gagné.', effets: [{ relation: '@rival', delta: { respect: 20, rivalite: -10, amitie: 10 } }, { stat: 'social.reputation', delta: 8 }, { drapeau: 'vallee_fin_vaincue' }] },
          echec: { texte: 'Il te laisse sur la tête de Hashirama, inconscient·e. Quand tu te réveilles, il a gravé un seul mot dans la pierre : « Encore. »', effets: [{ relation: '@rival', delta: { rivalite: 12 } }, { blessure: { id: 'vallee', nom: 'Blessures de la Vallée de la Fin', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'mediter',
        texte: 'Méditer au pied de la cascade',
        duree: 30,
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 5 }, { stat: 'attributs.controleChakra', delta: 3 }, { ethique: { honneur: 3 } }],
        resultat: 'L’eau tombe entre les deux géants, comme elle tombe depuis cent ans. Tu repars en ayant compris quelque chose sur ce que coûte une victoire. Tu ne saurais pas le dire.',
      },
    ],
  },
  {
    ...base,
    id: 'r_myoboku',
    titre: 'L’huile du mont Myōboku',
    categorie: 'entrainement',
    lieu: 'temple_oublie',
    decor: 'myoboku_terrain',
    poids: 6,
    repetable: { delaiJours: 720, max: 3 },
    si: { tout: [LIBRE, { drapeau: 'maitre_jiraiya' }] },
    texte: 'Le vieux sage crapaud t’attend au bord des cascades d’huile. Autour du terrain, des statues de crapauds : ceux qui ont absorbé trop d’énergie naturelle. « Encore une fois. Immobile. Et si tu sens tes doigts devenir palmés, tu me le dis. »',
    choix: [
      {
        id: 'immobile',
        texte: 'Rester immobile jusqu’à sentir la montagne',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          maitrises: { mode_ermite: 1 },
          succes: { texte: 'Pendant une heure, tu ne bouges pas. Puis tu sens tout : chaque insecte, chaque goutte, le sage qui retient son souffle. Tes paupières se cernent d’orange, et ne se changent pas en crapaud.', effets: [{ entrainer: 'mode_ermite', jours: 90, mentor: true }, { stat: 'attributs.controleChakra', delta: 2 }] },
          echec: { texte: 'Tu en prends trop. Ta peau verdit, tes doigts se palment. Le sage te frappe d’un bâton sur le crâne juste à temps. « Presque une statue. Presque. »', effets: [{ entrainer: 'mode_ermite', jours: 30, mentor: true }, { blessure: { id: 'crapaud', nom: 'Peau de crapaud', gravite: 1, jours: 20 } }] },
        },
      },
      {
        id: 'statues',
        texte: 'Demander au sage qui étaient les crapauds de pierre',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { entrainer: 'mode_ermite', jours: 15, mentor: true }],
        resultat: 'Le sage pose la main sur la plus petite statue. « Celui-là voulait aller plus vite que la montagne. Celui-là aussi. Et celui-là. » Il les nomme tous, un par un. Tu comprends que la leçon du jour, c’était eux.',
      },
    ],
  },
];
