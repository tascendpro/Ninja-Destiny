import type { Condition, EventDef } from '../../engine/types';
import { academie, epreuve, suite } from './arcsClans1';

/** Les arcs de clan (3/3) : Hōzuki, Kaguya, Yuki, Shirakaze, Raikō, Ishikawa, et ceux qui n'ont pas de clan. */
const ACTIF: Condition = { statut: 'actif' };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

export const ARCS_CLANS_3: EventDef[] = [
  // ═══ HŌZUKI ═══════════════════════════════════════════════════
  academie('hozuki', {
    id: 'cl_hozuki_bassine',
    titre: 'La bassine des aînés',
    lieu: '$academie',
    texte: [
      { texte: 'À l’Académie de Kiri, les aînés ont une coutume pour les cadets Hōzuki : la bassine. On te plonge la tête dans l’eau froide, et on compte. Un vrai Hōzuki, disent-ils, devient l’eau et ne se noie pas. Trois grands t’attendent derrière le dortoir.' },
      { texte: 'Le plus grand fait craquer ses doigts : « Allez, l’enfant-flaque. Montre-nous si tu es de la famille ou si tu es juste mouillé. »' },
    ],
    choix: [
      {
        id: 'subir',
        texte: 'Plonger, et devenir l’eau',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          maitrises: { hydrification: 3 },
          succes: { texte: 'Ils te plongent, ils comptent. À trente, ta tête n’est plus une tête : c’est de l’eau dans l’eau. À soixante, ils paniquent et te sortent, et tu te reformes devant eux, sec, en souriant. Le plus grand recule. « Bon. Bon. C’est un vrai. » Le lendemain, ils te gardent une place à leur table.', effets: [{ entrainer: 'hydrification', jours: 30 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.confianceClan', delta: 3 }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: 'Ton corps refuse de fondre. Tu avales de l’eau, tu suffoques. Ils te sortent à temps, déçus, et te laissent tousser sur le carrelage. « Juste mouillé, alors. » Tu passes la nuit dans la baie, à essayer, jusqu’à ce que ta main fonde enfin dans les vagues.', effets: [{ stat: 'jauges.sante', delta: -6 }, { entrainer: 'hydrification', jours: 20 }] },
        },
      },
      {
        id: 'retourner',
        texte: 'Retourner la bassine sur le plus grand',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { agilite: 2, force: 1 },
          maitrises: { hydrification: 2, taijutsu: 1 },
          succes: { texte: 'Il t’attrape par le col, tu fonds entre ses doigts, tu te reformes derrière lui, et c’est sa tête à lui qui finit dans la bassine. Les deux autres hésitent. Tu leur souris avec de l’eau qui coule encore de ta bouche. Ils partent. Ce soir-là, dans le dortoir, on t’appelle « le courant ».', effets: [{ entrainer: 'hydrification', jours: 20 }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'social.reputationOmbre', delta: 2 }] },
          echec: { texte: 'Ils sont trois. Tu fonds à moitié, ce qui ne sert qu’à rendre la chose plus humide. Tu finis dans la bassine quand même, deux fois plus longtemps.', effets: [{ stat: 'jauges.sante', delta: -8 }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
      {
        id: 'maitre',
        texte: 'Aller voir le maître d’armes : à Kiri, les coutumes se dénoncent',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'social.reputation', delta: -2 }, { stat: 'social.loyaute', delta: 2 }],
        resultat: 'Le maître d’armes t’écoute, puis te regarde longtemps. « À Kiri, l’enfant qui se plaint apprend une chose : le village ne le protégera pas. Mais je vais te dire un secret. Moi aussi, j’ai dénoncé, à ton âge. » Les trois aînés passent une semaine à récurer les quais. Personne ne te reparle de la bassine.',
      },
    ],
  }),
  epreuve('hozuki', {
    id: 'cl_hozuki_port',
    titre: 'L’infiltration du port',
    lieu: 'cotes_brume',
    texte: [
      { texte: 'Un armateur du port vend des armes aux rebelles de Kiri. Ta mission : entrer dans son entrepôt, une forteresse de pierre et de verrous, et rapporter son registre. Les portes sont gardées. Les gouttières, non. L’eau passe partout.' },
      { texte: 'Ton chef d’unité te tend une gourde et ricane : « Bois bien. Tu vas en avoir besoin pour te faufiler sous les portes. »' },
    ],
    choix: [
      {
        id: 'gouttieres',
        texte: 'Fondre dans les gouttières et te reformer dans le bureau',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleChakra: 2, discretion: 2 },
          maitrises: { hydrification: 3 },
          succes: {
            texte: 'Tu deviens l’eau de pluie qui coule le long du toit, tu passes sous la porte, sous les pieds des gardes, et tu te reformes dans le bureau, nu·e, ruisselant·e, le registre à portée de main. Un garde entre au mauvais moment. Ton bras s’allonge en un jet d’eau et le cueille au menton avant qu’il ait crié.',
            effets: [
              { si: { maitrise: 'hydrification', palierMin: 1 }, alors: [{ apprendre: 'hozuki_suika', source: 'clan' }], sinon: [{ entrainer: 'hydrification', jours: 40 }] },
              { stat: 'attributs.discretion', delta: 3 },
              { stat: 'social.confianceClan', delta: 5 },
              { drapeau: 'registre_armateur' },
            ],
          },
          echec: { texte: 'Il fait trop chaud dans les gouttières : tu t’évapores à moitié avant d’arriver. Tu dois te reformer dans un tonneau de saumure, où un garde te trouve en tirant de l’eau. Fuite, cris, et pas de registre.', effets: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'jauges.fatigue', delta: 20 }] },
        },
      },
      {
        id: 'frontal',
        texte: 'Passer par la porte : tu es ninja, eux non',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { force: 1, agilite: 2 },
          maitrises: { hydrification: 2, taijutsu: 1, nature_suiton: 1 },
          letal: true,
          manches: 2,
          causeMort: 'tué·e dans l’entrepôt d’un armateur, au port de Kiri',
          succes: {
            texte: 'Les gardes te frappent : leurs lames traversent de l’eau. Tu leur réponds avec des balles d’eau crachées à bout portant, dures comme des pierres. Le dernier tombe devant la porte du bureau. L’armateur, lui, est déjà parti. Mais pas son registre.',
            effets: [
              { si: { maitrise: 'hydrification', palierMin: 2 }, alors: [{ apprendre: 'hozuki_teppodama', source: 'clan' }], sinon: [{ entrainer: 'hydrification', jours: 35 }] },
              { stat: 'attributs.force', delta: 2 },
              { stat: 'social.reputationOmbre', delta: 3 },
              { drapeau: 'registre_armateur' },
            ],
          },
          echec: { texte: 'Un garde a une lame imprégnée de foudre. L’eau conduit. Tu fuis dans la baie, le corps engourdi, sans le registre.', effets: [{ blessure: { id: 'lame_foudre', nom: 'Choc électrique', gravite: 2, jours: 30 } }] },
        },
      },
      {
        id: 'boire',
        texte: 'Te faire embaucher comme porteur d’eau, et attendre',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.perception', delta: 2 }, { indice: 'rebelles_kiri' }, { drapeau: 'registre_armateur' }],
        resultat: 'Une semaine à porter des seaux, à sourire aux gardes, à écouter. Le septième jour, l’armateur te confie son registre à porter jusqu’au bateau, parce qu’il a confiance dans le porteur d’eau qui ne parle jamais. Tu l’apportes à ton unité. Et dans le registre, il y a des noms qui ne sont pas ceux des rebelles. Ce sont ceux de ministres de Kiri.',
      },
    ],
  }),

  // ═══ KAGUYA ═══════════════════════════════════════════════════
  academie('kaguya', {
    id: 'cl_kaguya_funerailles',
    titre: 'Les funérailles de l’ancien',
    lieu: '$village',
    texte: [
      { texte: 'L’ancien du clan est mort. Chez les Kaguya, on l’enterre dans un autel d’os : les siens, que les jeunes doivent faire pousser et tresser autour du cercueil, comme des roseaux blancs. On t’a choisi·e pour ouvrir le chant. Au crépuscule, au milieu de la cérémonie, une silhouette surgit des toits : un homme masqué, qui crache un brouillard empoisonné et saisit le cercueil.' },
      { texte: 'La veuve de l’ancien t’attrape le bras, les yeux brûlants : « Protège son repos… »' },
    ],
    choix: [
      {
        id: 'defendre',
        texte: 'Te jeter entre le voleur et le cercueil',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 2 },
          maitrises: { shikotsumyaku: 3, taijutsu: 1 },
          allies: true,
          succes: {
            texte: 'Le poison te brûle les poumons, mais tu ne recules pas. Un os jaillit de ta paume, court et pointu comme un poignard de camélia, et tu frappes au masque. Il se fend. L’homme lâche le cercueil et s’enfuit sur les toits, une main sur le visage. La cérémonie reprend. Ta voix tremble pendant tout le chant. Personne ne s’en moque.',
            effets: [
              { si: { maitrise: 'shikotsumyaku', palierMin: 1 }, alors: [{ apprendre: 'kaguya_tsubaki', source: 'clan' }], sinon: [{ entrainer: 'shikotsumyaku', jours: 30 }] },
              { stat: 'jauges.sante', delta: -10 },
              { stat: 'social.confianceClan', delta: 8 },
              { ethique: { honneur: 4 } },
              { drapeau: 'cercueil_sauve' },
            ],
          },
          echec: { texte: 'Le poison te met à genoux avant que tu l’atteignes. Le voleur disparaît avec le cercueil. La veuve ne pleure pas. Elle te regarde, et elle dit : « Tu le retrouveras. » Ce n’est pas une question.', effets: [{ stat: 'jauges.sante', delta: -15 }, { drapeau: 'cercueil_vole' }, { retour: 'cl_kaguya_cercueil', chance: 1, entre: [400, 900] }] },
        },
      },
      {
        id: 'piege',
        texte: 'Faire pousser les os en lianes autour du cercueil',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 2, intellect: 1 },
          maitrises: { shikotsumyaku: 3 },
          succes: { texte: 'Tes os sortent de tes poignets, longs, souples, et s’enroulent autour du cercueil et des chevilles du voleur en même temps. Il tombe. Les adultes du clan s’abattent sur lui. Sous le masque, un visage que personne ne connaît, et un tatouage de marchand d’os, de ceux qui revendent les kekkei genkai au marché noir.', effets: [{ entrainer: 'shikotsumyaku', jours: 30 }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'social.confianceClan', delta: 6 }, { drapeau: 'cercueil_sauve' }, { indice: 'marchands_os' }] },
          echec: { texte: 'Les os poussent trop lentement. Le cercueil est déjà sur les toits. Quand tes lianes arrivent, elles n’enlacent que du vide.', effets: [{ entrainer: 'shikotsumyaku', jours: 15 }, { drapeau: 'cercueil_vole' }, { retour: 'cl_kaguya_cercueil', chance: 1, entre: [400, 900] }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Mettre les enfants à l’abri, loin du brouillard',
        effets: [{ ethique: { compassion: 5 } }, { stat: 'social.confianceClan', delta: -6 }, { stat: 'attributs.agilite', delta: 2 }, { drapeau: 'cercueil_vole' }, { retour: 'cl_kaguya_cercueil', chance: 1, entre: [400, 900] }],
        resultat: 'Tu prends les deux plus petits sous tes bras et tu cours. Ils survivent au poison. Le cercueil, lui, disparaît. Le clan ne te pardonnera pas d’avoir choisi les vivants plutôt que l’ancien. Les mères des deux petits, elles, ne l’oublieront jamais.',
      },
    ],
  }),
  suite({
    id: 'cl_kaguya_cercueil',
    titre: 'Le marché des os',
    categorie: 'quete_legendaire',
    lieu: 'marche_noir',
    si: { tout: [{ statut: ['actif', 'errant', 'deserteur'] }, { clan: 'kaguya' }] },
    texte: 'Des années ont passé, mais la veuve ne t’a jamais laissé·e oublier. Au marché noir de Kōsai, dans l’arrière-boutique d’un marchand d’os, tu reconnais l’autel tressé de ton ancien, posé sur une étagère, entre une main momifiée et un œil dans un bocal. Le marchand te voit le regarder. Il comprend.',
    choix: [
      {
        id: 'reprendre',
        texte: 'Le reprendre, de force',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { shikotsumyaku: 3, taijutsu: 1 },
          letal: true,
          manches: 2,
          causeMort: 'tué·e dans l’arrière-boutique d’un marchand d’os, à Kōsai',
          succes: { texte: 'Ses gardes viennent à trois. Tes os aussi : une forêt de lames blanches qui sortent de ton dos, de tes bras, du sol où ton sang a coulé. Quand c’est fini, l’arrière-boutique ressemble à un ossuaire. Tu ramènes l’autel au village, et la veuve, très vieille maintenant, pose sa main sur le bois sans un mot.', effets: [{ entrainer: 'shikotsumyaku', jours: 50 }, { stat: 'social.confianceClan', delta: 10 }, { stat: 'social.reputationOmbre', delta: 5 }, { drapeau: 'cercueil_sauve' }] },
          echec: { texte: 'Trop de gardes, trop de poison. Tu fuis Kōsai en laissant l’autel sur son étagère. La veuve mourra sans l’avoir revu.', effets: [{ blessure: { id: 'marchand_os', nom: 'Blessures de Kōsai', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'racheter',
        texte: 'Le racheter, et noter le nom de chaque client',
        si: { stat: 'jauges.ryo', min: 200 },
        verrou: 'Il en veut 200 ryō.',
        effets: [{ stat: 'jauges.ryo', delta: -200 }, { stat: 'attributs.intellect', delta: 2 }, { indice: 'marchands_os' }, { drapeau: 'cercueil_sauve' }, { stat: 'social.confianceClan', delta: 6 }],
        resultat: 'Tu paies. Pendant qu’il compte, tes yeux parcourent son registre ouvert : des noms, des villages, des lignées. Tu repars avec l’autel, et une liste que ton village paiera très cher.',
      },
    ],
  }),
  epreuve('kaguya', {
    id: 'cl_kaguya_arene',
    titre: 'L’arène d’ossements',
    lieu: 'cotes_brume',
    texte: [
      { texte: 'Le maître d’armes de Kiri doute de la loyauté du clan Kaguya. Pour la prouver, il t’enferme dans l’ancienne arène du clan, un cirque de côtes géantes plantées dans le sable, avec un déserteur condamné à mort. S’il te tue, il est libre. Il le sait.' },
      { texte: 'Il crache sur le sable : « Les Kaguya. Des bêtes qui dansent dans le sang. Montre-moi la bête, qu’on rigole. »' },
    ],
    choix: [
      {
        id: 'concentre',
        texte: 'Ignorer l’insulte, et lire l’arène',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { intellect: 2, perception: 1, controleEmotionnel: 1 },
          maitrises: { shikotsumyaku: 3 },
          letal: true,
          manches: 3,
          causeMort: 'tué·e dans l’arène d’ossements du clan Kaguya',
          succes: {
            texte: 'Tu ne réponds pas. Tu regardes les côtes géantes : elles sont creuses, et le vent y siffle. Tu l’attires entre deux d’entre elles et tu fais jaillir tes propres os du sol, en une danse de mélèze, une haie de lames qui se referme sur lui. Il lâche son arme. Tu ne finis pas. Le maître d’armes, sur les gradins, se lève lentement : « Une bête qui choisit de ne pas mordre. Ça, je ne l’avais jamais vu. »',
            effets: [
              { si: { maitrise: 'shikotsumyaku', palierMin: 2 }, alors: [{ apprendre: 'kaguya_karamatsu', source: 'clan' }], sinon: [{ entrainer: 'shikotsumyaku', jours: 45 }] },
              { stat: 'attributs.intellect', delta: 2 },
              { stat: 'social.loyaute', delta: 6 },
              { stat: 'social.confianceClan', delta: 6 },
              { ethique: { compassion: 3 } },
            ],
          },
          echec: { texte: 'Il connaît l’arène mieux que toi : il y attend son exécution depuis un mois. Il te blesse gravement avant que les gardes interviennent. Le maître d’armes note : « Insuffisant. »', effets: [{ blessure: { id: 'arene_os', nom: 'Blessures de l’arène', gravite: 3, jours: 60 } }, { stat: 'social.confianceClan', delta: -4 }] },
        },
      },
      {
        id: 'furie',
        texte: 'Lui montrer la bête, puisqu’il la demande',
        test: {
          type: 'combat',
          difficulte: 52,
          attributs: { force: 2, agilite: 2 },
          maitrises: { shikotsumyaku: 3, taijutsu: 1 },
          letal: true,
          manches: 2,
          causeMort: 'tué·e dans l’arène d’ossements du clan Kaguya',
          succes: { texte: 'Ta colonne s’arrache de ton dos comme un fouet blanc. Il n’a pas le temps de comprendre. Le sable boit. Sur les gradins, le maître d’armes ne se lève pas. Il note quelque chose, et ce n’est pas un compliment. Tu as prouvé ce qu’il voulait prouver.', effets: [{ entrainer: 'shikotsumyaku', jours: 40 }, { stat: 'attributs.force', delta: 3 }, { drapeau: 'ennemis_acheves', incr: 1 }, { stat: 'social.reputationOmbre', delta: 6 }, { stat: 'social.suspicion', delta: 5 }, { ethique: { compassion: -6 } }] },
          echec: { texte: 'La rage te rend aveugle. Il esquive, frappe, esquive. Les gardes doivent te sortir de l’arène, à moitié mort·e.', effets: [{ blessure: { id: 'arene_os', nom: 'Blessures de l’arène', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'refuser',
        texte: 'Planter tes os dans le sable et refuser de te battre',
        effets: [{ ethique: { honneur: 6, compassion: 4 } }, { stat: 'social.loyaute', delta: -6 }, { stat: 'attributs.controleEmotionnel', delta: 4 }, { stat: 'social.suspicion', delta: 6 }],
        resultat: 'Tu te plantes au milieu de l’arène, bras croisés. Le déserteur hésite, puis jette son arme et s’assoit en face de toi. Vous restez là jusqu’au coucher du soleil. Le maître d’armes fait rouvrir la grille, furieux. « Tu viens de prouver que ton clan n’obéit pas. » Tu viens surtout de prouver que tu ne tues pas sur commande. Kiri retiendra les deux.',
      },
    ],
  }),

  // ═══ YUKI ═════════════════════════════════════════════════════
  academie('yuki', {
    id: 'cl_yuki_lac',
    titre: 'Le duel sur le lac gelé',
    lieu: '$village',
    personnages: ['@rival'],
    si: [RIVAL],
    texte: [
      { texte: 'Tournoi d’hiver de l’Académie, sur le lac gelé derrière le village. Ton adversaire : {@rival}. Tu as passé ta vie à cacher ton sang. Sur la glace, il te suffirait d’un geste pour qu’elle t’obéisse. Et tout le monde le verrait.' },
      { texte: '{@rival} frappe la glace du talon, et elle craque autour de toi : « Ta glace ne te sauvera pas longtemps ! »' },
    ],
    choix: [
      {
        id: 'epaissir',
        texte: 'Durcir la glace sous tes pieds, discrètement',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { controleChakra: 2, discretion: 1, agilite: 1 },
          maitrises: { hyoton: 2, taijutsu: 1 },
          succes: { texte: 'Personne ne voit ton chakra descendre dans la glace. Elle tient sous toi, craque sous {lui:@rival}. {@rival} glisse, tu frappes. Victoire. Seul l’instructeur, un vieux ninja de Kiri, fronce les sourcils en regardant la glace sous tes pieds, intacte au milieu des fissures.', effets: [{ entrainer: 'hyoton', jours: 25 }, { stat: 'attributs.discretion', delta: 2 }, { relation: '@rival', delta: { rivalite: 6 } }, { drapeau: 'yuki_soupcon' }] },
          echec: { texte: 'La glace se fend sous vous deux. Vous tombez dans l’eau noire, ensemble. C’est {@rival} qui te tire dehors. Vous rentrez tremblants, sans vainqueur, et un peu moins ennemis.', effets: [{ stat: 'jauges.sante', delta: -10 }, { relation: '@rival', delta: { amitie: 6, hostilite: -4 } }] },
        },
      },
      {
        id: 'esquiver',
        texte: 'Ne rien montrer : danser sur la glace et gagner à la force des jambes',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { agilite: 3 },
          maitrises: { taijutsu: 2 },
          succes: { texte: 'Tu glisses, tu tournes, tu laisses {@rival} s’épuiser à briser la glace autour de toi. Au dernier moment, tu lui fais un croc-en-jambe. Victoire sans un gramme de chakra. Ton secret est sauf. Tu en éprouves un soulagement si fort que tu en as honte.', effets: [{ stat: 'attributs.agilite', delta: 3 }, { relation: '@rival', delta: { respect: 6 } }] },
          echec: { texte: 'Tu perds. Tu aurais pu gagner d’un geste. Tu ne l’as pas fait. Sur le chemin du retour, {parent} te serre l’épaule : « Bien. Très bien. » {Parent_il} ne parle pas du combat.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.confianceClan', delta: 3 }] },
        },
      },
      {
        id: 'reveler',
        texte: 'Laisser la neige venir, devant tout le monde',
        effets: [{ entrainer: 'hyoton', jours: 35 }, { stat: 'social.suspicion', delta: 10 }, { stat: 'social.reputation', delta: 4 }, { drapeau: 'yuki_revele' }, { retour: 'cl_yuki_chasseur', chance: 1, entre: [200, 500] }],
        resultat: 'Tu lèves la main. La neige tombe d’un ciel bleu, seulement sur le lac. Des miroirs de glace se dressent autour de {@rival}, qui s’arrête, bouche bée. Les spectateurs se taisent. Puis quelqu’un, au fond, murmure le mot interdit : « Kekkei genkai. » Le soir même, ta famille fait ses valises, puis les défait. Fuir serait avouer.',
      },
    ],
  }),
  epreuve('yuki', {
    id: 'cl_yuki_montagne',
    titre: 'La tempête du col blanc',
    lieu: '$village',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: 'Expédition en haute montagne, à la poursuite d’un déserteur. La tempête tombe d’un coup. Devant toi, {@coequipierA} glisse sur une plaque de verglas qui n’était pas là une seconde avant. La glace a bougé toute seule. Quelqu’un d’autre, ici, la commande.' },
      { texte: '{@coequipierA}, accroché{e:@coequipierA} au bord d’une crevasse, crie : « Attention, c’est piégé ! Il y a quelqu’un dans la tempête ! »' },
    ],
    choix: [
      {
        id: 'aiguilles',
        texte: 'Mille aiguilles de glace, vers l’ombre dans la tempête',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { controleChakra: 2, perception: 2 },
          maitrises: { hyoton: 3, nature_suiton: 1 },
          letal: true,
          manches: 3,
          allies: true,
          causeMort: 'tué·e dans une tempête de neige, par un autre héritier de la glace',
          succes: {
            texte: 'L’humidité de la tempête devient mille aiguilles qui partent toutes vers la même ombre. Elle se brise en miroirs. Un homme en sort : un Yuki, comme toi, un chasseur de sa propre lignée, payé pour ramener la tienne. Il fait naître une baleine de glace de la neige. Tu lui opposes un tigre. Les deux bêtes se brisent l’une contre l’autre, et c’est lui qui tombe. {@coequipierA}, hissé{e:@coequipierA} hors de la crevasse, regarde la neige retomber autour de toi comme si tu en étais la source. Ce qui est vrai.',
            effets: [
              { si: { maitrise: 'hyoton', palierMin: 1 }, alors: [{ apprendre: 'yuki_sensatsu', source: 'clan' }], sinon: [{ entrainer: 'hyoton', jours: 45 }] },
              { relation: '@coequipierA', delta: { attachement: 8, confiance: 6 } },
              { stat: 'social.confianceClan', delta: 6 },
              { indice: 'chasseurs_yuki' },
            ],
          },
          echec: { texte: 'Tes aiguilles se perdent dans le vent. L’ombre te frappe dans le dos, et tu tombes dans la neige. C’est {@coequipierA}, remonté{e:@coequipierA} seul{e:@coequipierA}, qui te traîne jusqu’à l’abri.', effets: [{ blessure: { id: 'gelures', nom: 'Gelures profondes', gravite: 2, jours: 40 } }, { relation: '@coequipierA', delta: { attachement: 6 } }, { retour: 'cl_yuki_chasseur', chance: 0.8, entre: [200, 500] }] },
        },
      },
      {
        id: 'refuge',
        texte: 'D’abord sauver {@coequipierA} : un dôme de glace sur vous deux',
        effets: [{ entrainer: 'hyoton', jours: 30 }, { relation: '@coequipierA', delta: { attachement: 10, confiance: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { retour: 'cl_yuki_chasseur', chance: 0.8, entre: [200, 500] }],
        resultat: 'Tu tires {@coequipierA} hors de la crevasse et la glace se referme sur vous en un dôme de miroirs. Les projectiles de l’ennemi s’y brisent toute la nuit. Au matin, il est parti. Mais sur la paroi du dôme, quelqu’un a gravé de l’extérieur, avec de la glace, le blason des Yuki. Il sait qui tu es.',
      },
      {
        id: 'retraite',
        texte: 'Ordonner la retraite : on ne se bat pas dans sa tempête',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'social.confianceClan', delta: -3 }, { relation: '@coequipierA', delta: { confiance: 3 } }],
        resultat: 'Vous redescendez à tâtons, encordés, sans vous retourner. Le déserteur s’échappe. Ta mission est un échec. Mais vous êtes tous vivants, et tu sais maintenant qu’un autre que toi, dans ces montagnes, commande la neige.',
      },
    ],
  }),
  suite({
    id: 'cl_yuki_chasseur',
    titre: 'Le chasseur de ta lignée',
    categorie: 'clan_rare',
    lieu: '$village',
    si: { tout: [ACTIF, { clan: 'yuki' }] },
    texte: 'Une nuit, il neige dans ta chambre. Quelques flocons, qui tombent du plafond. Tu n’as rien fait. Dans l’embrasure de la fenêtre, un homme au masque de glace te regarde. « Ta lignée vaut cher au marché. Elle vaudrait plus si elle venait de son plein gré. Viens avec moi, et ta famille vivra. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre, ici, chez toi',
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { controleChakra: 2, agilite: 1, controleEmotionnel: 1 },
          maitrises: { hyoton: 3 },
          letal: true,
          manches: 3,
          causeMort: 'tué·e dans sa chambre par un chasseur de lignées',
          succes: { texte: 'La neige de ta chambre devient la tienne. Vos deux glaces s’affrontent entre les murs, et c’est la tienne qui tient : tu te bats pour ta famille, lui pour de l’argent. Un tigre de glace jaillit de ta paume et l’emporte par la fenêtre. Au matin, il ne reste de lui qu’un masque fendu sur la neige du jardin.', effets: [{ si: { maitrise: 'hyoton', palierMin: 3 }, alors: [{ apprendre: 'yuki_haryu', source: 'clan' }], sinon: [{ entrainer: 'hyoton', jours: 50 }] }, { stat: 'social.confianceClan', delta: 8 }] },
          echec: { texte: 'Il est plus fort, et il le savait. Ce sont tes parents, réveillés par le froid, qui le chassent à deux. Ta mère en garde une cicatrice. Tu en gardes une autre, plus profonde.', effets: [{ blessure: { id: 'chasseur_yuki', nom: 'Blessures du chasseur', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'village',
        texte: 'Appeler la garde du village, même si ça révèle ton sang',
        effets: [{ stat: 'social.suspicion', delta: 8 }, { stat: 'social.loyaute', delta: 5 }, { drapeau: 'yuki_revele' }],
        resultat: 'Tu cries. La garde arrive en moins d’une minute. Le chasseur fuit. Le lendemain, tout le quartier sait ce que ta famille cachait depuis trois générations. Le Mizukage te convoque. Il ne te menace pas. Il te propose un poste. C’est peut-être pire.',
      },
    ],
  }),

  // ═══ SHIRAKAZE ════════════════════════════════════════════════
  academie('shirakaze', {
    id: 'cl_shirakaze_tempete',
    titre: 'L’examen de la tempête',
    lieu: 'desert_vent',
    texte: [
      { texte: 'Examen de survie à Suna : chaque élève doit traverser seul une portion de désert et revenir avant la nuit. Au milieu de l’après-midi, tu sens le vent changer. Personne d’autre ne le sent. Une tempête de sable arrive dans une heure, et la moitié de la classe est encore en plein désert.' },
      { texte: 'L’instructeur, quand tu le rejoins en courant, hausse les épaules : « Le ciel est bleu. Les Shirakaze voient des tempêtes partout. Retourne à ton parcours. »' },
    ],
    choix: [
      {
        id: 'alerter',
        texte: 'Partir seul·e rabattre les autres élèves',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { perception: 2, agilite: 2 },
          maitrises: { souffle_dunes: 2 },
          succes: { texte: 'Tu cours de dune en dune en criant, et le vent t’aide : il porte ta voix plus loin qu’elle ne devrait aller. Les élèves reviennent un par un. La tempête frappe vingt minutes après le dernier. L’instructeur ne dit rien. Le lendemain, il demande à ton père de venir enseigner la lecture du vent à toute la classe.', effets: [{ entrainer: 'souffle_dunes', jours: 25 }, { stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputation', delta: 5 }, { stat: 'social.confianceClan', delta: 4 }] },
          echec: { texte: 'Tu en retrouves trois, pas le quatrième. La tempête le surprend dans un creux. On le retrouve au matin, vivant, à moitié enseveli. Tu ne te pardonnes pas, même si tout le monde te dit que sans toi, ils seraient quatre dans ce creux.', effets: [{ stat: 'attributs.perception', delta: 1 }, { stat: 'attributs.controleEmotionnel', delta: 2 }] },
        },
      },
      {
        id: 'rideau',
        texte: 'Tenter de dévier la tempête toi-même',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { controleChakra: 3, controleEmotionnel: 1 },
          maitrises: { souffle_dunes: 3 },
          succes: { texte: 'Tu te plantes face au mur de sable et tu lèves les bras comme ta grand-mère. Ça ne la dévie pas. Mais ça la fend en deux, une seconde, juste assez pour que le couloir où marchent les élèves reste dégagé. Tu tombes à genoux, vidé·e. Au loin, sur une dune, l’instructeur a tout vu.', effets: [{ entrainer: 'souffle_dunes', jours: 40 }, { stat: 'jauges.fatigue', delta: 30 }, { stat: 'social.reputation', delta: 6 }] },
          echec: { texte: 'La tempête ne te remarque même pas. Tu finis abrité·e derrière un rocher, à écouter le sable siffler pendant des heures, en te demandant combien d’élèves sont encore dehors.', effets: [{ stat: 'jauges.sante', delta: -8 }, { entrainer: 'souffle_dunes', jours: 15 }] },
        },
      },
      {
        id: 'obeir',
        texte: 'Obéir, et finir ton parcours',
        effets: [{ stat: 'social.loyaute', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { ethique: { honneur: -3 } }],
        resultat: 'Tu finis ton parcours. La tempête frappe une heure plus tard, exactement comme tu l’avais senti. Deux élèves passent la nuit dehors. Ils survivent. L’instructeur vient te voir le lendemain, le visage gris. « Tu avais raison. » Tu n’en tires aucune fierté.',
      },
    ],
  }),
  epreuve('shirakaze', {
    id: 'cl_shirakaze_caravane',
    titre: 'La caravane dans la tempête',
    lieu: 'desert_vent',
    texte: [
      { texte: 'Escorte d’une caravane de sel à travers le désert. Au troisième jour, des pillards attaquent au cœur d’une tempête de sable, là où les escortes ne voient plus rien. Eux portent des lunettes de verre. Toi, tu n’en as pas besoin : tu lis le vent, et le vent te dit où ils sont.' },
      { texte: 'Le marchand en chef s’accroche à ton bras : « Je ne vois plus mes chameaux ! Je ne vois plus rien ! Fais quelque chose ! »' },
    ],
    choix: [
      {
        id: 'rideau',
        texte: 'Dresser un rideau de dunes autour de la caravane',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { controleChakra: 2, perception: 2 },
          maitrises: { souffle_dunes: 3, nature_fuuton: 1 },
          letal: true,
          manches: 3,
          allies: true,
          causeMort: 'tombé·e dans une tempête de sable, en défendant une caravane de sel',
          succes: {
            texte: 'Tu ouvres les bras et le désert se lève avec toi : un mur de sable tournoyant enveloppe la caravane, et les pillards qui chargent dedans en ressortent aveuglés, désarmés, emportés. Le vent te parle, tu lui réponds. Quand la tempête retombe, la caravane est intacte au centre d’un cercle parfait de dunes nouvelles.',
            effets: [
              { si: { maitrise: 'souffle_dunes', palierMin: 2 }, alors: [{ apprendre: 'shirakaze_rideau', source: 'clan' }], sinon: [{ entrainer: 'souffle_dunes', jours: 45 }] },
              { stat: 'social.reputation', delta: 6 },
              { stat: 'jauges.ryo', delta: 80 },
              { stat: 'social.confianceClan', delta: 5 },
            ],
          },
          echec: { texte: 'Le rideau tient à moitié. Les pillards emportent deux chameaux et leur charge de sel. Le marchand te paie quand même. Moins.', effets: [{ entrainer: 'souffle_dunes', jours: 25 }, { stat: 'jauges.ryo', delta: 20 }, { stat: 'jauges.sante', delta: -10 }] },
        },
      },
      {
        id: 'chasser',
        texte: 'Partir seul·e dans la tempête, les chercher un par un',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { perception: 2, agilite: 1, discretion: 1 },
          maitrises: { souffle_dunes: 2, taijutsu: 1 },
          letal: true,
          manches: 2,
          causeMort: 'perdu·e dans une tempête de sable, en chassant des pillards',
          succes: { texte: 'Tu marches dans la tempête comme dans une pièce que tu connais. Le vent te souffle leurs positions. Tu en désarmes un, puis deux, puis trois, sans qu’aucun ne t’ait vu·e venir. Le dernier se rend en pleurant : il croit avoir affaire à un esprit du désert.', effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'social.reputationOmbre', delta: 3 }, { stat: 'jauges.ryo', delta: 60 }] },
          echec: { texte: 'Le vent tourne, et tu te perds. Quand la tempête retombe, tu es seul·e, à une demi-journée de la caravane, qui a été pillée.', effets: [{ stat: 'jauges.fatigue', delta: 30 }, { stat: 'jauges.sante', delta: -10 }] },
        },
      },
      {
        id: 'guider',
        texte: 'Guider la caravane hors de la tempête, sans combattre',
        effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.ryo', delta: 50 }, { ethique: { compassion: 2 } }],
        resultat: 'Tu prends la tête de la colonne, une main sur la corde du premier chameau, et tu marches là où le vent est le plus faible. La tempête se referme derrière vous sur les pillards, qui s’y perdent à leur tour. Tu ne frappes personne. Le marchand dira partout qu’un Shirakaze vaut dix escortes.',
      },
    ],
  }),

  // ═══ RAIKŌ ════════════════════════════════════════════════════
  academie('raiko', {
    id: 'cl_raiko_gantelets',
    titre: 'Les premiers gantelets',
    lieu: '$terrain',
    personnages: ['@rival'],
    si: [RIVAL],
    texte: [
      { texte: 'À Kumo, l’Académie organise chaque printemps un tournoi de taijutsu pur, sans technique. Les Raikō y sont interdits de gantelets : leur armure de foudre serait un avantage déloyal. Ton premier adversaire est {@rival}. Au premier échange, tu sens l’électricité monter dans tes bras malgré toi.' },
      { texte: '{@rival} recule d’un pas en sentant l’air crépiter : « Tricheur·se ! Arbitre ! Il y a de la foudre ! »' },
    ],
    choix: [
      {
        id: 'retenir',
        texte: 'Retenir la foudre et te battre à mains nues',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { force: 2, controleEmotionnel: 2 },
          maitrises: { taijutsu: 2, armure_foudre: 1 },
          succes: { texte: 'Tu ravales l’électricité comme on ravale une colère. Elle te brûle de l’intérieur, mais tes poings restent froids. Tu gagnes au taijutsu, proprement, sous les yeux de l’arbitre qui a vérifié chacun de tes coups. Le soir, ton père te serre l’épaule : « Celui qui retient sa foudre peut la lâcher quand il veut. »', effets: [{ entrainer: 'armure_foudre', jours: 25 }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@rival', delta: { respect: 6 } }, { stat: 'social.confianceClan', delta: 3 }] },
          echec: { texte: 'La foudre t’échappe au troisième coup. Une étincelle claque sur l’épaule de {@rival}. L’arbitre te disqualifie. Tu sors du terrain sous les sifflets, les poings fumants.', effets: [{ entrainer: 'armure_foudre', jours: 15 }, { stat: 'social.reputation', delta: -3 }, { relation: '@rival', delta: { hostilite: 4 } }] },
        },
      },
      {
        id: 'lacher',
        texte: 'Lâcher l’armure, et tant pis pour le règlement',
        effets: [{ entrainer: 'armure_foudre', jours: 30 }, { stat: 'social.reputation', delta: -4 }, { stat: 'social.reputationOmbre', delta: 3 }, { relation: '@rival', delta: { hostilite: 8 } }],
        resultat: 'La foudre t’enveloppe entièrement, ta peau devient blanche de lumière, et {@rival} vole hors du cercle avant que l’arbitre ait levé le bras. Disqualifié·e. Mais dans la tribune des jōnin, un homme à la cape blanche s’est penché en avant, et il a noté ton nom.',
      },
      {
        id: 'expliquer',
        texte: 'Demander à l’arbitre une pause, et expliquer',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { honneur: 4 } }, { stat: 'attributs.controleChakra', delta: 2 }],
        resultat: 'Tu lèves la main et tu expliques : ça monte tout seul, quand tu as peur. L’arbitre te regarde longtemps, puis appelle un instructeur Raikō, qui te fait respirer cinq minutes, une main sur ta nuque. L’électricité redescend. Le combat reprend. Tu le perds. Mais tu as appris à faire redescendre la foudre, et ça, ça vaut dix tournois.',
      },
    ],
  }),
  epreuve('raiko', {
    id: 'cl_raiko_recrue',
    titre: 'L’enfant des nuages',
    lieu: 'montagnes_foudre',
    texte: [
      { texte: 'Ta mission vient d’en haut, scellée du sceau du Raikage. Un enfant de six ans, dans un hameau de la frontière, porte une lignée rare. Kumo « l’invite » à rejoindre le village. Ses parents ne sont pas d’accord. Deux ninjas d’un autre village montent la garde devant leur maison.' },
      { texte: 'La mère de l’enfant te voit approcher depuis la fenêtre, et crie à travers la vitre : « Il n’est pas à vendre ! Il n’est pas à vous ! »' },
    ],
    choix: [
      {
        id: 'mission',
        texte: 'Exécuter l’ordre : passer les gardes, ramener l’enfant',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 1, agilite: 2, controleChakra: 1 },
          maitrises: { armure_foudre: 3, taijutsu: 1 },
          letal: true,
          manches: 3,
          causeMort: 'tué·e devant une maison de frontière, en exécutant un ordre du Raikage',
          succes: {
            texte: 'L’armure de foudre t’enveloppe et tu deviens un éclair qui traverse la cour. Le premier garde n’a pas le temps de lever son arme. Le second tient deux échanges, puis tombe. L’enfant, dans tes bras, ne pleure pas. Il te regarde avec des yeux immenses. Sa mère hurle derrière vous. Tu ne te retournes pas. Tu entendras ce cri longtemps.',
            effets: [
              { si: { maitrise: 'armure_foudre', palierMin: 2 }, alors: [{ apprendre: 'raiko_charge', source: 'clan' }], sinon: [{ entrainer: 'armure_foudre', jours: 45 }] },
              { stat: 'social.loyaute', delta: 8 },
              { stat: 'social.reputation', delta: 4 },
              { ethique: { compassion: -8 } },
              { drapeau: 'enfant_kumo', valeur: 'enleve' },
              { retour: 'cl_raiko_enfant', chance: 0.8, entre: [1800, 3000] },
            ],
          },
          echec: { texte: 'Les deux gardes sont meilleurs que prévu. Tu repars blessé·e, sans l’enfant. Le Raikage n’aime pas les échecs. Tu le sauras à ton retour.', effets: [{ blessure: { id: 'hameau', nom: 'Blessures du hameau', gravite: 2, jours: 40 } }, { stat: 'social.loyaute', delta: -4 }] },
        },
      },
      {
        id: 'convaincre',
        texte: 'Parler aux parents : proposer qu’ils viennent tous à Kumo',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: { texte: 'Tu poses tes armes devant la porte et tu parles. Des écoles, de la protection, de ce qui arrivera de toute façon si ce n’est pas toi qui viens. Au matin, la famille entière monte dans ta charrette, les gardes étrangers repartent sans combattre. Le Raikage grogne que ce n’était pas l’ordre. Il garde quand même l’enfant, et la famille avec.', effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 6 } }, { stat: 'social.reputation', delta: 5 }, { drapeau: 'enfant_kumo', valeur: 'famille' }, { retour: 'cl_raiko_enfant', chance: 0.8, entre: [1800, 3000] }] },
          echec: { texte: 'La mère crache par la fenêtre. Les gardes dégainent. Tu dois te replier sans l’enfant, sans combat, et sans honneur aux yeux de Kumo.', effets: [{ stat: 'social.loyaute', delta: -3 }, { stat: 'attributs.controleEmotionnel', delta: 2 }] },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser l’ordre, et rentrer les mains vides',
        effets: [{ ethique: { honneur: 6, compassion: 6 } }, { stat: 'social.loyaute', delta: -10 }, { stat: 'social.suspicion', delta: 6 }, { drapeau: 'enfant_kumo', valeur: 'laisse' }],
        resultat: 'Tu regardes l’enfant à la fenêtre, sa mère derrière lui, les deux gardes prêts à mourir pour lui. Tu fais demi-tour. À Kumo, on te convoque. Tu dis la vérité. Le Raikage te regarde longtemps, puis te renvoie sans sanction. « Un jour, tu comprendras pourquoi on fait ça. » Peut-être. Pas aujourd’hui.',
      },
    ],
  }),
  suite({
    id: 'cl_raiko_enfant',
    titre: 'Celui que tu as ramené',
    categorie: 'heritage',
    lieu: '$village',
    si: { tout: [ACTIF, { clan: 'raiko' }] },
    texte: [
      { texte: 'Des années ont passé. Un jeune genin de Kumo t’attend à la sortie du bureau des missions, bandeau neuf sur le front, et des yeux immenses que tu reconnais.' },
      { si: { drapeau: 'enfant_kumo', egal: 'enleve' }, texte: '« Je me souviens de toi. Tu sentais l’orage. Ma mère est morte l’hiver d’après. Elle n’a jamais cessé de m’écrire. Ses lettres ne m’arrivaient pas. Je les ai trouvées la semaine dernière. »' },
      { si: { drapeau: 'enfant_kumo', egal: 'famille' }, texte: '« Je me souviens de toi. Tu avais posé tes armes devant la porte. Ma mère tient une boutique de thé, en bas du troisième pont. Elle voudrait te remercier. »' },
    ],
    choix: [
      {
        id: 'assumer',
        texte: 'Lui dire la vérité, toute la vérité',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { ethique: { honneur: 4 } }],
        resultat: [
          { si: { drapeau: 'enfant_kumo', egal: 'enleve' }, texte: 'Tu lui racontes la cour, les gardes, sa mère à la fenêtre. Il écoute sans bouger. À la fin, il dit seulement : « Merci de ne pas avoir menti. » Puis il s’en va. Tu ne sauras jamais s’il te hait. Lui non plus, peut-être.' },
          { si: { drapeau: 'enfant_kumo', egal: 'famille' }, texte: 'Tu vas boire le thé de sa mère. Elle pleure en te servant, puis rit d’avoir pleuré. Il y a, sur le mur de la boutique, un dessin d’enfant : une silhouette qui pose ses armes devant une porte. Toi.' },
        ],
      },
      {
        id: 'former',
        texte: 'Lui proposer de l’entraîner',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { entrainer: 'armure_foudre', jours: 20 }, { drapeau: 'eleve_kumo' }],
        resultat: 'Il hésite longtemps. Puis il accepte. Pendant un an, tous les matins, sur le terrain d’entraînement du clan, tu lui apprends ce que tu sais de la foudre. Il apprend vite. Trop vite. Un jour, il te dépassera. Tu crois que c’est ça, le pardon, chez les ninjas.',
      },
    ],
  }),

  // ═══ ISHIKAWA ═════════════════════════════════════════════════
  academie('ishikawa', {
    id: 'cl_ishikawa_carriere',
    titre: 'Le poids de la carrière',
    lieu: 'carrieres_terre',
    texte: [
      { texte: 'Épreuve des cadets Ishikawa : porter une pierre du fond de la carrière jusqu’au sommet, sans s’arrêter, sans poser les mains au sol. La pierre pèse ton propre poids. Les anciens comptent les pas. Au milieu de la montée, un cadet plus jeune que toi s’effondre, sa pierre sur la jambe.' },
      { texte: 'L’ancien qui surveille l’épreuve ne bouge pas : « Celui qui s’arrête pour un autre échoue avec lui. C’est la règle de la carrière. »' },
    ],
    choix: [
      {
        id: 'monter',
        texte: 'Continuer à monter : la règle est la règle',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { force: 3, controleEmotionnel: 1 },
          maitrises: { peau_roche: 2 },
          succes: { texte: 'Tu montes. Ta peau durcit sous la pierre, grise, rugueuse, et la douleur devient lointaine. Tu arrives au sommet et tu poses la pierre. L’ancien hoche la tête. En bas, le cadet est toujours coincé. Personne ne lui a porté secours avant la fin de l’épreuve. C’est la carrière.', effets: [{ entrainer: 'peau_roche', jours: 30 }, { stat: 'attributs.force', delta: 3 }, { stat: 'social.confianceClan', delta: 4 }, { ethique: { compassion: -3 } }] },
          echec: { texte: 'Tes jambes lâchent à vingt pas du sommet. Tu poses les mains au sol. Échec. En redescendant, tu passes à côté du cadet coincé, et cette fois, tu l’aides, puisque tu n’as plus rien à perdre.', effets: [{ stat: 'attributs.force', delta: 2 }, { ethique: { compassion: 2 } }] },
        },
      },
      {
        id: 'aider',
        texte: 'Poser ta pierre et soulever la sienne',
        effets: [{ ethique: { compassion: 6, honneur: 3 } }, { stat: 'attributs.force', delta: 2 }, { stat: 'social.confianceClan', delta: -3 }, { stat: 'social.reputation', delta: 3 }],
        resultat: 'Tu poses ta pierre. Tu soulèves celle du cadet. Il te regarde avec des yeux mouillés. Échec, pour vous deux. L’ancien ne dit rien pendant toute la descente. En bas, il te tend un morceau de pierre noire, polie : « Moi aussi, à ton âge. La carrière a ses règles. Le clan a les siennes. »',
      },
      {
        id: 'deux',
        texte: 'Porter les deux pierres',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { force: 3, controleChakra: 1 },
          maitrises: { peau_roche: 3 },
          succes: { texte: 'Tu cales sa pierre sur la tienne. Ta peau devient roche jusqu’aux épaules. Tu montes. Chaque pas fait trembler la carrière. Le cadet marche derrière toi en pleurant. Au sommet, tu poses les deux pierres, et l’ancien, pour la première fois de sa vie, applaudit.', effets: [{ entrainer: 'peau_roche', jours: 40 }, { stat: 'attributs.force', delta: 4 }, { stat: 'social.confianceClan', delta: 6 }, { stat: 'social.reputation', delta: 4 }] },
          echec: { texte: 'C’est trop lourd. Les deux pierres roulent jusqu’en bas. Tu as essayé. C’est tout ce que tu as fait.', effets: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.force', delta: 2 }] },
        },
      },
    ],
  }),
  epreuve('ishikawa', {
    id: 'cl_ishikawa_eboulement',
    titre: 'La mine effondrée',
    lieu: 'carrieres_terre',
    texte: [
      { texte: 'Une mine de fer s’est effondrée à la frontière, avec trente mineurs dedans. Ton unité est la plus proche. Mais à l’entrée, une patrouille d’un village voisin attend déjà : la mine est sur une frontière disputée, et ils ne laisseront personne d’Iwa y entrer.' },
      { texte: 'Leur chef lève la main : « Un pas de plus, et c’est un acte de guerre. Laissez-les. Ce ne sont que des mineurs. »' },
    ],
    choix: [
      {
        id: 'forcer',
        texte: 'Forcer le passage',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 2, controleChakra: 1, controleEmotionnel: 1 },
          maitrises: { peau_roche: 3, nature_doton: 1 },
          letal: true,
          manches: 2,
          causeMort: 'tué·e à l’entrée d’une mine effondrée, sur une frontière disputée',
          succes: {
            texte: 'Leurs lames glissent sur ta peau devenue granit. Tu avances sans t’arrêter, un pas, deux pas. Ton poing gainé de roche fend le sol devant leur chef et la terre se soulève en une vague qui les renverse tous. Tu entres. Les mineurs sont vivants. Tous. Mais à la frontière, ce soir-là, quelqu’un rédige une lettre de protestation.',
            effets: [
              { si: { maitrise: 'peau_roche', palierMin: 2 }, alors: [{ apprendre: 'ishikawa_poing', source: 'clan' }], sinon: [{ entrainer: 'peau_roche', jours: 45 }] },
              { stat: 'social.reputation', delta: 6 },
              { stat: 'social.confianceClan', delta: 5 },
              { drapeau: 'incident_frontiere' },
            ],
          },
          echec: { texte: 'Ils sont plus nombreux que prévu. Tu reçois un coup qui fend ta peau de pierre, puis la vraie. Ton unité doit te ramener. Les mineurs, eux, restent dans la mine.', effets: [{ blessure: { id: 'mine', nom: 'Peau de pierre fendue', gravite: 3, jours: 60 } }] },
        },
      },
      {
        id: 'ensemble',
        texte: 'Proposer de creuser ensemble, les deux villages',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 3, intellect: 1 },
          succes: { texte: 'Tu poses ton bandeau sur une pierre, à la vue de tous. « Il y a trente hommes en dessous. Les vôtres et les nôtres. Creusons, et on se battra après, si vous voulez encore. » Leur chef hésite. Puis il enlève son bandeau, et le pose à côté du tien. Ils creusent avec vous toute la nuit. Personne ne se bat après.', effets: [{ stat: 'attributs.charisme', delta: 4 }, { stat: 'social.reputation', delta: 8 }, { ethique: { compassion: 5, honneur: 4 } }, { entrainer: 'nature_doton', jours: 20 }] },
          echec: { texte: 'Il refuse. Tu attends à la frontière, impuissant·e, pendant que les deux villages négocient trois jours. Quand on te laisse enfin entrer, il est trop tard pour la moitié des mineurs.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { compassion: 2 } }] },
        },
      },
      {
        id: 'tunnel',
        texte: 'Creuser ton propre tunnel, sous leur frontière',
        effets: [{ entrainer: 'nature_doton', jours: 35 }, { entrainer: 'peau_roche', jours: 20 }, { stat: 'jauges.fatigue', delta: 35 }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'social.reputation', delta: 5 }],
        resultat: 'Tu ne discutes pas. Tu descends à cent pas de la frontière et tu creuses, ta peau de pierre contre la roche, toute la nuit. À l’aube, tu débouches dans la galerie effondrée, couvert·e de poussière. Les mineurs pleurent en te voyant. Ils ressortent par ton tunnel, en territoire d’Iwa, pendant que l’autre patrouille monte toujours la garde devant une entrée vide.',
      },
    ],
  }),

  // ═══ SANS CLAN ════════════════════════════════════════════════
  academie('sans_clan', {
    id: 'cl_sans_clan_arbre',
    titre: 'L’arbre généalogique',
    lieu: '$academie',
    texte: [
      { texte: 'Devoir d’histoire : chaque élève doit présenter l’arbre de sa famille, avec ses ninjas célèbres. Les héritiers de clan arrivent avec des rouleaux de trois mètres. Toi, tu as une feuille, et deux noms dessus.' },
      { texte: 'Quand vient ton tour, un élève au fond lance, assez fort : « Il est court, ton arbre. C’est un buisson. » La classe rit. L’instructeur attend que tu parles.' },
    ],
    choix: [
      {
        id: 'commencer',
        texte: '« Il est court parce qu’il commence. Le premier nom célèbre, ce sera le mien. »',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { ambition: 5 } }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'arbre_promesse' }],
        resultat: 'Silence. Puis l’instructeur, un homme sans clan lui aussi, sourit franchement pour la première fois de l’année. « Bonne réponse. La meilleure de la journée. » Il te met la meilleure note. Pas pour l’arbre. Pour la phrase. Tu la garderas en tête chaque fois qu’on te regardera de haut.',
      },
      {
        id: 'histoire',
        texte: 'Raconter qui étaient ces deux noms, sans honte',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@parent', delta: { attachement: 6 } }],
        resultat: 'Tu racontes. Un grand-père qui portait des pierres pour la muraille du village. Une grand-mère qui soignait les blessés de la guerre sans être médecin. Personne ne rit. À la fin, l’élève du fond baisse les yeux. Le soir, tu racontes à {parent} ce que tu as dit. {Il:@parent} se détourne pour que tu ne voies pas ses yeux.',
      },
      {
        id: 'bagarre',
        texte: 'Aller régler ça avec l’élève du fond',
        test: {
          type: 'combat',
          difficulte: 44,
          attributs: { force: 1, agilite: 2 },
          maitrises: { taijutsu: 2 },
          succes: { texte: 'Il a un clan, un père jōnin et trois ans d’entraînement privé. Tu as la rage. La rage gagne, cette fois. Il se relève avec le nez en sang. L’instructeur vous punit tous les deux, et en te punissant, il te glisse : « La prochaine fois, choisis un terrain où tu ne seras pas puni·e. »', effets: [{ entrainer: 'taijutsu', jours: 20 }, { stat: 'attributs.force', delta: 2 }, { stat: 'social.reputation', delta: -1 }, { stat: 'social.reputationOmbre', delta: 2 }] },
          echec: { texte: 'Trois ans d’entraînement privé. Ça se voit. Tu finis au sol, et la classe rit encore plus fort. Mais ce soir-là, tu t’entraînes jusqu’à minuit, et le lendemain aussi.', effets: [{ stat: 'jauges.sante', delta: -6 }, { entrainer: 'taijutsu', jours: 20 }] },
        },
      },
    ],
  }),
  epreuve('sans_clan', {
    id: 'cl_sans_clan_arriere',
    titre: 'L’arrière-garde',
    lieu: 'frontiere_herbe',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: 'Retraite de frontière. L’unité doit se replier avant qu’une colonne ennemie arrive. Il faut quelqu’un pour tenir le gué une heure. Le capitaine regarde ses ninjas : des héritiers de clan, précieux, et toi. Il ne dit rien. Il n’a pas besoin. Tout le monde a compris qui on laisse derrière quand on n’a pas de clan pour réclamer le corps.' },
      { texte: '{@coequipierA} fait un pas en avant, sans un mot, et vient se placer à côté de toi. Ça te fait plus d’effet que tout le reste.' },
    ],
    choix: [
      {
        id: 'tenir',
        texte: 'Tenir le gué, avec {@coequipierA}',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 1, agilite: 1, perception: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 2, famille_kunai: 1, ninjutsu: 1 },
          letal: true,
          manches: 3,
          allies: true,
          causeMort: 'tombé·e en tenant un gué, à l’arrière-garde d’une retraite',
          succes: {
            texte: 'Une heure. Puis deux. Vous tenez le gué à deux, avec des pièges, des kunai, de l’eau jusqu’aux genoux et des cris pour faire croire à une unité entière. La colonne ennemie finit par chercher un autre passage. Quand vous rejoignez l’unité, le capitaine se lève, et devant tout le monde, il s’incline. Devant toi. Pas devant un nom. Devant toi.',
            effets: [{ stat: 'social.reputation', delta: 8 }, { stat: 'attributs.force', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@coequipierA', delta: { attachement: 10, confiance: 8 } }, { drapeau: 'gue_tenu' }],
          },
          echec: { texte: 'Le gué tombe après quarante minutes. Vous fuyez par la rivière, {@coequipierA} blessé{e:@coequipierA} sur ton dos. L’unité est passée. Vous aussi, de justesse.', effets: [{ blessure: { id: 'gue', nom: 'Blessures du gué', gravite: 2, jours: 40 } }, { relation: '@coequipierA', delta: { attachement: 8 } }] },
        },
      },
      {
        id: 'seul',
        texte: 'Renvoyer {@coequipierA} avec les autres, et tenir seul·e',
        test: {
          type: 'combat',
          difficulte: 62,
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { taijutsu: 2, famille_kunai: 2 },
          letal: true,
          manches: 3,
          causeMort: 'tombé·e seul·e en tenant un gué, pour que les autres rentrent',
          succes: { texte: 'Tu tiens. Seul·e. Personne ne saura jamais exactement comment. Tu rejoins l’unité à l’aube, couvert·e de boue et de sang qui n’est pas tout à toi. {@coequipierA} te frappe à l’épaule, fort, et ne te lâche plus de la journée.', effets: [{ stat: 'social.reputation', delta: 10 }, { stat: 'attributs.force', delta: 3 }, { relation: '@coequipierA', delta: { attachement: 8, respect: 8 } }, { drapeau: 'gue_tenu' }] },
          echec: { texte: 'Tu tiens assez longtemps. Puis tu ne tiens plus. On te retrouve dans les roseaux deux jours plus tard, vivant·e, par miracle.', effets: [{ blessure: { id: 'gue', nom: 'Blessures du gué', gravite: 3, jours: 70 } }] },
        },
      },
      {
        id: 'contester',
        texte: '« On tire au sort. Clan ou pas. »',
        effets: [{ ethique: { honneur: 5 } }, { stat: 'attributs.charisme', delta: 2 }, { stat: 'social.loyaute', delta: -2 }, { stat: 'social.reputation', delta: 3 }],
        resultat: 'Le silence qui suit est très long. Puis un héritier Hyūga, que tu n’aimais pas beaucoup, ramasse des cailloux. « Il a raison. » On tire au sort. Le sort tombe sur deux autres. Ils tiennent le gué, et ils rentrent. Personne n’oubliera ce jour-là, et le capitaine encore moins.',
      },
    ],
  }),
];
