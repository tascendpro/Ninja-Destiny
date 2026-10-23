import type { Condition, EventDef, VillageId } from '../../engine/types';

/**
 * Des villages qui ont leur propre voix (prompt Racine, E4 à E10) : Konoha la chaleureuse, Suna l'économe,
 * Kiri la méfiante, Kumo la directe, Iwa la patiente. Chaque village parle à chaque âge, et certaines scènes
 * laissent un fil qui revient des années plus tard. Les villages secondaires (Ame, le Pays du Fer, les déserteurs)
 * s'ouvrent à l'âge adulte.
 */
const ACTIF: Condition = { statut: 'actif' };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const B: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };
const TOUS = [1, 2, 3, 4, 5, 6];

type Tranche = 'enfance' | 'academie' | 'genin' | 'adulte' | 'veteran';
const AGES: Record<Tranche, Condition> = {
  enfance: { age: { min: 6, max: 9 } },
  academie: { age: { min: 10, max: 12 } },
  genin: { tout: [{ rangMin: 'genin' }, { age: { min: 12, max: 16 } }] },
  adulte: { tout: [{ rangMin: 'genin' }, { age: { min: 17, max: 30 } }] },
  veteran: { age: { min: 31, max: 45 } },
};
const ARC: Record<Tranche, EventDef['arc']> = { enfance: 'formation', academie: 'formation', genin: 'premieres_missions', adulte: 'crise', veteran: 'heritage' };

/** Une scène propre à un village, à un âge donné, une seule fois. */
function scene(village: VillageId, tranche: Tranche, ev: Omit<EventDef, 'chapitre' | 'chapitres' | 'arc' | 'si'> & { si?: Condition[] }): EventDef {
  const { si, ...reste } = ev;
  return { chapitre: 1, chapitres: TOUS, arc: ARC[tranche], poids: 6, ...reste, si: { tout: [ACTIF, { village }, AGES[tranche], ...(si ?? [])] } };
}
/** Une suite rappelée par un fil (effet « retour »). */
function suite(ev: Omit<EventDef, 'chapitre' | 'chapitres' | 'arc' | 'enchaine'>): EventDef {
  return { chapitre: 2, chapitres: TOUS, arc: 'crise', enchaine: true, ...ev };
}

export const VILLAGES_VIVANTS: EventDef[] = [
  // ═══ KONOHA ═══════════════════════════════════════════════════
  scene('konoha', 'enfance', {
    id: 'kv_konoha_jouet',
    titre: 'La toupie cassée',
    categorie: 'enfance',
    lieu: '$village',
    texte: [
      { texte: 'Sous le grand arbre de la place, la toupie peinte d’un garçon du quartier gît en deux morceaux. Tu courais près de la table, tout à l’heure. Tu ne sais même pas si ton coude l’a touchée.' },
      { texte: 'Le garçon pointe le doigt sur toi : « C’est toi ! Je t’ai vu courir près de la table ! » Une fille, assise sur la margelle du puits, hausse les épaules : « Tu accuses toujours quelqu’un avant de chercher ce qui s’est passé. »' },
    ],
    choix: [
      {
        id: 'avouer',
        texte: '« Je crois que c’est mon coude. Je ne l’ai pas fait exprès. »',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'attributs.charisme', delta: 1 }, { stat: 'jauges.ryo', delta: -3 }, { drapeau: 'konoha_toupie', valeur: 'avoue' }],
        resultat: 'Il te regarde longtemps, la lèvre qui tremble. « Tu aurais pu me le dire tout de suite… Je suis encore fâché. Mais au moins, tu n’as pas menti. » Tu lui donnes tes trois pièces pour une nouvelle ficelle. Le lendemain, il te laisse lancer sa toupie réparée. Une seule fois.',
      },
      {
        id: 'nier',
        texte: '« Je ne l’ai même pas touchée ! »',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 1 },
          { drapeau: 'konoha_toupie', valeur: 'nie' },
          { hasard: [{ poids: 55, effets: [{ retour: 'kv_konoha_jouet_verite', chance: 1, entre: [20, 90] }] }, { poids: 45, effets: [] }] },
        ],
        resultat: 'Il te dévisage, puis ramasse les morceaux sans rien dire. La fille du puits, elle, te regarde un peu trop longtemps. Elle était là. Elle a peut-être vu.',
      },
      {
        id: 'chercher',
        texte: 'Regarder la table, le sol, la toupie, avant de répondre',
        test: {
          type: 'competence',
          difficulte: 34,
          attributs: { perception: 2, intellect: 1 },
          succes: { texte: 'Il y a de la boue fraîche sur le bord de la table, et des traces de pattes. Le chat du boulanger. Tu montres les traces au garçon, qui rougit jusqu’aux oreilles. « …Pardon. » La fille du puits sourit : « Tu vois ? »', effets: [{ stat: 'attributs.perception', delta: 2 }, { drapeau: 'konoha_toupie', valeur: 'innocente' }, { stat: 'social.reputation', delta: 1 }] },
          echec: { texte: 'Tu cherches, tu ne trouves rien. Le garçon s’impatiente et s’en va en criant que tu es un·e menteur·se. Tu ne sauras jamais.', effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'konoha_toupie', valeur: 'doute' }] },
        },
      },
    ],
  }),
  suite({
    id: 'kv_konoha_jouet_verite',
    titre: 'Ce que la fille du puits a vu',
    categorie: 'enfance',
    lieu: '$village',
    si: ACTIF,
    texte: 'Le garçon à la toupie t’attend à la sortie du marché. La fille du puits est derrière lui, les bras croisés. Elle l’a vu : ton coude, la table, la toupie qui tombe. « Tu aurais pu casser dix toupies, dit-il. Ça m’aurait moins énervé que ton mensonge. »',
    choix: [
      {
        id: 'excuses',
        texte: 'T’excuser, vraiment, sans chercher d’excuse',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'konoha_toupie', valeur: 'pardonne' }],
        resultat: '« J’ai eu peur. C’était moi. Pardon. » Il ne te pardonne pas tout de suite. Mais la semaine suivante, il te garde une place dans la file de la fontaine. Chez les enfants, c’est un traité de paix.',
      },
      {
        id: 'justifier',
        texte: '« J’avais peur qu’on me punisse ! »',
        effets: [{ stat: 'social.reputation', delta: -2 }, { drapeau: 'konoha_toupie', valeur: 'rancune' }],
        resultat: '« Moi aussi, j’ai été puni. Pour avoir accusé tout le monde. » Il s’en va. La fille du puits secoue la tête. Pendant des mois, dans la cour, on te surnommera « la toupie ». Pas méchamment. Presque.',
      },
    ],
  }),
  scene('konoha', 'academie', {
    id: 'kv_konoha_tobio',
    titre: 'Celui qui s’entraîne après les cours',
    categorie: 'academie',
    lieu: '$academie',
    texte: [
      { texte: 'Fin de journée à l’Académie. Un garçon range ses affaires en ricanant : « Tu as entendu ? Tobio a encore raté le test de transformation. » Près de la fenêtre, Koharu lève les yeux de son livre : « Ce n’est pas drôle. »' },
      { texte: '« Pourquoi tu le défends ? Il passe son temps à dire qu’il sera meilleur que nous. » Koharu : « Parce que je l’ai vu s’entraîner après les cours. Il recommence même quand tout le monde est parti. » La porte s’ouvre. Tobio a tout entendu. Il serre les poings : « Je n’ai pas besoin de votre pitié. » Le professeur ne lève même pas les yeux de son registre : « Alors cesse de demander à être reconnu avant d’avoir accepté d’apprendre. »' },
    ],
    choix: [
      {
        id: 'defendre',
        texte: 'Prendre la défense de Tobio devant tout le monde',
        effets: [{ ethique: { compassion: 3 } }, { stat: 'attributs.charisme', delta: 1 }, { drapeau: 'tobio', valeur: 'defendu' }, { retour: 'kv_konoha_tobio_retour', chance: 0.85, entre: [1500, 2600] }],
        resultat: '« Rater le test, ce n’est pas pareil que ne pas travailler. » Tobio rougit, gêné, presque vexé que tu l’aies défendu. Le garçon qui riait te lance un regard noir : tu viens de choisir ton camp. Koharu, elle, te sourit à peine. Mais elle t’a vu.',
      },
      {
        id: 'moquer',
        texte: 'Rire avec les autres',
        effets: [{ ethique: { compassion: -3 } }, { stat: 'social.reputation', delta: 1 }, { drapeau: 'tobio', valeur: 'moque' }, { retour: 'kv_konoha_tobio_retour', chance: 0.85, entre: [1500, 2600] }],
        resultat: 'Tu ris. Tobio te regarde droit dans les yeux, et tu comprends qu’il vient d’ajouter ton nom à la liste de ceux qu’il veut surpasser. Koharu referme son livre et sort sans un mot.',
      },
      {
        id: 'entrainer',
        texte: 'Proposer à Tobio de s’entraîner ensemble après les cours',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { charisme: 2, controleEmotionnel: 1 },
          succes: { texte: 'Il refuse, par fierté. Puis le lendemain soir, tu le trouves sur le terrain, et il ne te chasse pas. Vous ratez la transformation chacun vingt fois, côte à côte. À la vingt et unième, il réussit. Il ne te remercie pas. Il dit seulement : « Demain, même heure. »', effets: [{ entrainer: 'ninjutsu', jours: 20 }, { stat: 'attributs.controleChakra', delta: 2 }, { drapeau: 'tobio', valeur: 'ami' }, { retour: 'kv_konoha_tobio_retour', chance: 0.9, entre: [1500, 2600] }] },
          echec: { texte: '« Je n’ai pas besoin de ton aide. » Il part. Mais tu vois qu’il s’arrête une seconde à la porte, comme s’il hésitait. Il s’en souviendra.', effets: [{ drapeau: 'tobio', valeur: 'refuse' }, { retour: 'kv_konoha_tobio_retour', chance: 0.85, entre: [1500, 2600] }] },
        },
      },
      {
        id: 'pourquoi',
        texte: 'Lui demander pourquoi il veut tant surpasser les autres',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { drapeau: 'tobio', valeur: 'frere' }, { retour: 'kv_konoha_tobio_retour', chance: 0.85, entre: [1500, 2600] }],
        resultat: 'Il te fixe, méfiant. Puis, très bas : « Mon grand frère est sorti premier de sa promotion. Chez moi, on ne parle que de lui. » Il s’en va avant que tu puisses répondre. C’est la première fois qu’il dit quelque chose de vrai à quelqu’un de la classe.',
      },
      {
        id: 'silence',
        texte: 'Ne rien dire',
        effets: [{ drapeau: 'tobio', valeur: 'silence' }],
        resultat: 'Personne ne remarque ton silence. Sauf Koharu, qui te regarde un instant, puis retourne à son livre. Ça ne change rien. Pas aujourd’hui.',
      },
    ],
  }),
  suite({
    id: 'kv_konoha_tobio_retour',
    titre: 'Tobio, des années plus tard',
    categorie: 'amitie',
    lieu: '$village',
    si: { tout: [ACTIF, { village: 'konoha' }] },
    texte: [
      { texte: 'Au comptoir d’une échoppe de ramen, un jeune chūnin pose sa tasse à côté de la tienne. Il a pris dix centimètres et une cicatrice au sourcil. Tobio.' },
      { si: { drapeau: 'tobio', egal: 'ami' }, texte: '« Tu as toujours cette façon de regarder la sortie avant de t’asseoir. Tu crois que je ne l’ai jamais remarquée ? » Il rit. « Demain, même heure ? Pour le bon vieux temps. »' },
      { si: { drapeau: 'tobio', egal: 'moque' }, texte: '« Tu veux faire comme si nous étions de vieux amis ? Moi, je me souviens très bien de la salle de classe. » Il ne s’en va pas pour autant. Il attend de voir ce que tu vas dire.' },
      { si: { drapeau: 'tobio', egal: 'defendu' }, texte: '« Tu m’avais défendu, ce jour-là. J’étais furieux contre toi. Il m’a fallu deux ans pour comprendre pourquoi. » Il fait tourner sa tasse. « Je ne t’ai jamais remercié. »' },
      { si: { drapeau: 'tobio', egal: 'frere' }, texte: '« Tu es le seul à qui j’avais parlé de mon frère. Il est mort l’hiver dernier, en mission. » Un silence. « Je suis meilleur que lui, maintenant. Ça ne sert plus à rien. »' },
      { si: { un: [{ drapeau: 'tobio', egal: 'refuse' }, { drapeau: 'tobio', egal: 'silence' }] }, texte: '« On était dans la même classe, non ? » Il fouille sa mémoire. « Celui ou celle qui ne disait jamais rien. » Ce n’est pas une insulte. C’est pire : c’est vrai.' },
    ],
    choix: [
      {
        id: 'sincere',
        texte: 'Lui dire franchement ce que tu as pensé de lui, à l’époque',
        effets: [{ ethique: { honneur: 2 } }, { stat: 'attributs.charisme', delta: 1 }, { drapeau: 'tobio_adulte', valeur: 'franc' }],
        resultat: [
          { si: { drapeau: 'tobio', egal: 'moque' }, texte: 'Tu lui dis que tu as ri parce que tout le monde riait, et que tu le regrettes. Il hoche la tête lentement. « Je ne te pardonne pas. Mais je te crois. » Il paie ton bol. C’est un début.' },
          { si: { non: { drapeau: 'tobio', egal: 'moque' } }, texte: 'Tu lui dis ce que tu voyais : un garçon trop fier pour accepter de l’aide, qui revenait quand même tous les soirs. Il éclate de rire. « J’étais insupportable. » Vous parlez jusqu’à la fermeture. Il te raconte ses missions. Tu lui racontes les tiennes.' },
        ],
      },
      {
        id: 'mission',
        texte: 'Lui proposer de rejoindre ta prochaine mission',
        effets: [{ stat: 'social.reputation', delta: 2 }, { drapeau: 'tobio_adulte', valeur: 'allie' }],
        resultat: [
          { si: { un: [{ drapeau: 'tobio', egal: 'ami' }, { drapeau: 'tobio', egal: 'defendu' }] }, texte: 'Il accepte avant que tu aies fini ta phrase. Sur la route, il te couvre comme quelqu’un qui a passé des années à apprendre exactement ça.' },
          { si: { non: { un: [{ drapeau: 'tobio', egal: 'ami' }, { drapeau: 'tobio', egal: 'defendu' }] } }, texte: 'Il réfléchit longtemps. « Pas cette fois. » Puis, en se levant : « Demande-moi encore dans un an. Je verrai qui tu es devenu·e. »' },
        ],
      },
    ],
  }),
  scene('konoha', 'academie', {
    id: 'kv_konoha_clone',
    titre: 'Les signes au tableau',
    categorie: 'academie',
    lieu: '$academie',
    personnages: ['@rival'],
    si: [RIVAL],
    texte: 'Troisième essai de clonage. Troisième échec. Le professeur : « Recommence. » Toi : « Je viens de le faire trois fois. » Lui : « Et tu as fait trois fois la même erreur. » {@rival}, au premier rang : « Peut-être qu’il faut lui dessiner les signes. » Le professeur sourit : « Très bonne idée. Viens donc lui montrer. » {@rival} s’avance, compose les signes… et rate à son tour. Toute la classe retient son souffle.',
    choix: [
      {
        id: 'moquer',
        texte: '« Tu veux que je te dessine les signes ? »',
        effets: [{ relation: '@rival', delta: { rivalite: 6, hostilite: 3 } }, { stat: 'social.reputation', delta: 2 }, { drapeau: 'konoha_signes', valeur: 'moque' }],
        resultat: 'La classe explose de rire. Le professeur détourne la tête pour cacher un sourire. « Dix minutes d’entraînement supplémentaire, tous les deux. Profitez-en pour apprendre quelque chose. » Pendant ces dix minutes, {@rival} ne t’adresse pas un mot. Mais {il:@rival} s’entraîne à côté de toi, et plus fort que toi.',
      },
      {
        id: 'ensemble',
        texte: 'Lui montrer l’erreur que vous faites tous les deux',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { intellect: 2, controleChakra: 1 },
          succes: { texte: '« Tu passes du Bélier au Sanglier trop vite. Moi aussi. » Vous recommencez, lentement. Deux clones apparaissent en même temps, un peu flous, mais debout. {@rival} te regarde, partagé{e:@rival} entre la gratitude et l’agacement. « Je ne t’aime toujours pas. Mais si tu arrives à suivre mon rythme, je reconnaîtrai que tu n’es pas inutile. »', effets: [{ entrainer: 'ninjutsu', jours: 15 }, { relation: '@rival', delta: { respect: 8, rivalite: 3 } }, { drapeau: 'konoha_signes', valeur: 'ensemble' }] },
          echec: { texte: 'Tu crois avoir trouvé. Tu te trompes. Deux échecs de plus, côte à côte. Au moins, cette fois, personne ne rit : vous êtes deux.', effets: [{ relation: '@rival', delta: { amitie: 3 } }, { stat: 'attributs.controleChakra', delta: 1 }] },
        },
      },
      {
        id: 'rire',
        texte: 'Rire de vous deux, franchement',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { relation: '@rival', delta: { hostilite: -3, amitie: 2 } }],
        resultat: 'Tu ris, de toi d’abord. {@rival} hésite, puis rit aussi, malgré {lui:@rival}. Le professeur lève les yeux au ciel : « Formidable. Deux clowns. Dix minutes de plus. » C’est la meilleure punition de ta vie d’élève.',
      },
    ],
  }),
  scene('konoha', 'genin', {
    id: 'kv_konoha_pont',
    titre: 'Le pont à découvert',
    categorie: 'mission',
    lieu: 'foret_feu',
    personnages: ['@coequipierB'],
    si: [B],
    texte: 'Mission d’escorte. Devant vous, un pont de cordes au-dessus d’un ravin. {@coequipierB} s’arrête : « Tu as vu l’état du pont ? Si on suit le plan, on sera à découvert presque une minute. » Toi : « Tu proposes quoi ? » « Une autre route. Plus longue, plus risquée pour le matériel. Mais on aura des arbres pour nous couvrir. »',
    choix: [
      {
        id: 'plan',
        texte: 'Suivre le plan du sensei : le pont',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { agilite: 2, perception: 1 },
          succes: { texte: 'Vous traversez un par un, vite. Rien ne bouge dans les arbres. Sur l’autre rive, {@coequipierB} souffle : « On a eu de la chance. » Le rapport sera parfait. Tu sais que la chance y est pour beaucoup.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'social.loyaute', delta: 2 }] },
          echec: { texte: 'À mi-pont, une flèche se plante dans une corde. Un guetteur, seul, qui s’enfuit aussitôt. Personne n’est blessé, mais la caisse de médicaments est tombée dans le ravin. {@coequipierB} ne dit rien. {Il:@coequipierB} n’a pas besoin.', effets: [{ stat: 'social.reputation', delta: -2 }, { relation: '@coequipierB', delta: { confiance: -3 } }] },
        },
      },
      {
        id: 'route',
        texte: 'Prendre la route des arbres, comme {@coequipierB} le propose',
        effets: [{ relation: '@coequipierB', delta: { confiance: 8, respect: 4 } }, { stat: 'attributs.intellect', delta: 1 }, { stat: 'social.loyaute', delta: -1 }],
        resultat: 'Deux jours de plus, une charrette embourbée, un sensei agacé. Mais pas une seule flèche. Le soir, au bivouac, {@coequipierB} s’assoit à côté de toi : « On a perdu du temps. Le rapport ne sera pas beau. Mais tu as écouté. Je n’oublierai pas ça. »',
      },
      {
        id: 'sensei',
        texte: 'Exposer les deux options au sensei, et le laisser trancher',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { relation: '@coequipierB', delta: { confiance: 3 } }, { relation: '@sensei', delta: { respect: 3 } }],
        resultat: 'Le sensei écoute, regarde le pont, puis {@coequipierB}, puis toi. « La route des arbres. Et la prochaine fois, c’est vous qui déciderez. » Ce n’est pas une récompense. C’est un poids. Tu le sens tout le reste du voyage.',
      },
    ],
  }),
  scene('konoha', 'adulte', {
    id: 'kv_konoha_chefs',
    titre: 'Avoir raison, être responsable',
    categorie: 'mission',
    lieu: '$village',
    si: [{ age: { min: 19 } }],
    texte: 'Retour de mission. Tu as désobéi à un ordre en plein combat, et deux de tes équipiers sont vivants grâce à ça. Le chef de l’autre équipe, celle des renforts, t’attend devant la tour du Hokage. « Tu as désobéi à mon ordre. » « Ton ordre exposait l’équipe. » « Et ton initiative a exposé les renforts. » « Si j’avais attendu, nous aurions perdu deux personnes. » « Peut-être. Mais tu as pris une décision pour tout le monde sans donner aux autres la possibilité de comprendre ce que tu faisais. »',
    choix: [
      {
        id: 'excuser',
        texte: '« Tu veux que je m’excuse ? »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'konoha_chefs', valeur: 'defi' }],
        resultat: '« Je veux que tu comprennes la différence entre avoir raison et être responsable. Ce n’est pas toujours la même chose. » Il entre dans la tour sans attendre ta réponse. Le rapport qu’il remet est juste : il dit que tu as sauvé deux personnes, et qu’un renfort a pris une flèche à cause de toi. Les deux phrases sont vraies.',
      },
      {
        id: 'assumer',
        texte: 'Reconnaître le prix payé par les renforts',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'social.reputation', delta: 2 }, { stat: 'social.loyaute', delta: 2 }, { drapeau: 'konoha_chefs', valeur: 'assume' }],
        resultat: 'Tu vas voir le renfort blessé, à l’hôpital, avant même de rendre ton rapport. Le chef de l’autre équipe l’apprend. Le mois suivant, quand il faut un second pour une mission difficile, c’est ton nom qu’il propose. Il ne t’aime pas davantage. Il te fait confiance. Ce n’est pas la même chose non plus.',
      },
      {
        id: 'refaire',
        texte: '« Je le referais. Et je te le dirais avant, la prochaine fois. »',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { ambition: 2 } }, { drapeau: 'konoha_chefs', valeur: 'refaire' }],
        resultat: 'Il te regarde longtemps. « Alors la prochaine fois, je t’écouterai avant de donner l’ordre. » Ce n’est pas une capitulation. C’est un accord entre deux personnes qui ont toutes les deux eu raison, chacune de son côté.',
      },
    ],
  }),
  scene('konoha', 'veteran', {
    id: 'kv_konoha_compagnon',
    titre: 'Prouver qu’on peut tout faire seul',
    categorie: 'heritage',
    lieu: '$village',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: '{@coequipierA} vient s’asseoir à côté de toi sur le banc du terrain d’entraînement, celui où vous attendiez votre sensei il y a vingt ans. « Je me souviens du jour où tu voulais prouver que tu pouvais tout faire seul·e. » Toi : « J’étais plus jeune. » {Il:@coequipierA} : « Tu étais surtout terrifié·e à l’idée d’avoir besoin de quelqu’un. Ce n’est pas exactement la même chose. »' },
      { si: { un: [{ drapeau: 'tueur_village' }, { relation: '@coequipierA', axe: 'confiance', max: 20 }] }, texte: '{Il:@coequipierA} regarde les jeunes genin qui s’entraînent plus bas. « Tu as gagné beaucoup de combats. Je ne conteste pas ça. Mais quand je regarde ton équipe, je vois des gens qui attendent encore de savoir si tu vas les abandonner. »' },
    ],
    choix: [
      {
        id: 'reconnaitre',
        texte: 'Reconnaître qu’{il:@coequipierA} a raison',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { relation: '@coequipierA', delta: { attachement: 6, confiance: 4 } }],
        resultat: 'Tu ne dis rien pendant longtemps. Puis : « Tu as toujours su avant moi. » {@coequipierA} sourit, et te donne un coup d’épaule, exactement comme à douze ans. Vous restez là jusqu’à ce que les genin rentrent chez eux.',
      },
      {
        id: 'defendre',
        texte: 'Défendre tes choix, et en assumer le prix',
        effets: [{ ethique: { ambition: 2 } }, { relation: '@coequipierA', delta: { respect: 3, amitie: -2 } }],
        resultat: '« J’ai fait ce qu’il fallait pour que nous soyons encore vivants. » {@coequipierA} hoche la tête. « Peut-être. Je n’ai jamais dit que tu avais tort. J’ai dit que ça avait un prix. » {Il:@coequipierA} se lève. Le banc te paraît soudain plus froid.',
      },
    ],
  }),

  // ═══ SUNA ═════════════════════════════════════════════════════
  scene('suna', 'enfance', {
    id: 'kv_suna_sable',
    titre: 'Les trois sables',
    categorie: 'enfance',
    lieu: 'desert_vent',
    texte: 'Une fille de ton âge, accroupie au bord de la dune, laisse couler du sable entre ses doigts. « Tu crois que le sable est toujours pareil ? » Toi : « C’est du sable. » Elle : « Celui-là s’effondre sous ton pied. Celui-là garde la chaleur. Celui-là te cache jusqu’aux genoux. Si tu ne vois aucune différence, tu ne vois pas grand-chose. »',
    choix: [
      {
        id: 'apprendre',
        texte: 'T’accroupir à côté d’elle et apprendre',
        effets: [{ stat: 'attributs.perception', delta: 3 }, { drapeau: 'suna_sables', valeur: 'appris' }],
        resultat: 'Elle te montre jusqu’au coucher du soleil : le sable rouge qui brûle, le sable gris qui avale, le sable blanc qui tient. Le soir, ton père s’étonne que tu marches autrement dans la cour. Tu marches où le sable tient.',
      },
      {
        id: 'moquer',
        texte: 'Te moquer de ses leçons de sable',
        effets: [{ stat: 'attributs.perception', delta: -1 }, { drapeau: 'suna_sables', valeur: 'moque' }, { retour: 'kv_suna_dune', chance: 0.8, entre: [30, 200] }],
        resultat: '« Très bien. Tu apprendras quand tu tomberas dans une dune. Je serai peut-être là pour rire. » Elle s’éloigne sans se retourner. Tu hausses les épaules. C’est du sable.',
      },
    ],
  }),
  suite({
    id: 'kv_suna_dune',
    titre: 'Le sable qui avale',
    categorie: 'enfance',
    lieu: 'desert_vent',
    si: { tout: [ACTIF, { village: 'suna' }] },
    texte: 'Un pas de trop au bord d’une dune grise, et tu t’enfonces jusqu’aux genoux, puis jusqu’à la taille. Plus tu bouges, plus le sable te tire. Une voix, au-dessus de toi : « Tiens. Je t’avais dit que je serais peut-être là pour rire. » La fille aux trois sables. Elle ne rit pas. Elle te tend une corde.',
    choix: [
      {
        id: 'merci',
        texte: 'Prendre la corde, et lui dire merci',
        effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'suna_sables', valeur: 'appris' }],
        resultat: 'Elle te sort de là en râlant. « Gris. Le gris avale. Répète. » « Le gris avale. » Elle hoche la tête, satisfaite. À partir de ce jour, elle te garde une place à l’ombre du mur de l’Académie.',
      },
      {
        id: 'seul',
        texte: '« Je n’ai pas besoin de ta corde ! »',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { force: 2, controleEmotionnel: 1 },
          succes: { texte: 'Tu cesses de te débattre, tu t’allonges sur le sable, et tu rampes lentement jusqu’au bord. Elle te regarde faire, sourcils levés. « Pas mal. Mais tu aurais pu prendre la corde. »', effets: [{ stat: 'attributs.force', delta: 2 }] },
          echec: { texte: 'Le sable t’avale jusqu’aux épaules. Elle te sort de là quand même, sans un mot, et repart. Tu ne la remercies pas. Tu le regretteras.', effets: [{ stat: 'jauges.sante', delta: -6 }, { stat: 'jauges.fatigue', delta: 15 }] },
        },
      },
    ],
  }),
  scene('suna', 'academie', {
    id: 'kv_suna_mitsuki',
    titre: 'Ne regarde pas mes mains',
    categorie: 'academie',
    lieu: '$academie',
    texte: 'Mitsuki, l’apprentie marionnettiste de la classe, s’entraîne seule derrière l’Académie. Sa marionnette de bois, une sorte de chat à quatre bras, danse au bout de fils que tu ne vois presque pas. Elle te remarque : « Tu regardes mes mains. Mauvaise idée. » « Pourquoi ? » « Parce que pendant que tu regardes mes mains, tu oublies la marionnette. Et pendant que tu regardes la marionnette, tu oublies mon ombre. »',
    choix: [
      {
        id: 'fil',
        texte: 'Chercher le fil, plutôt que la marionnette',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { perception: 3 },
          succes: { texte: 'Tu ne regardes plus le chat de bois. Tu regardes l’air, entre ses doigts et lui, et tu finis par voir les fils, fins comme des cheveux, qui brillent quand ils se tendent. Tu sais où la marionnette va frapper une demi-seconde avant elle. Mitsuki s’arrête. « …Tu apprends vite. Je vais devoir arrêter de te montrer mes exercices. »', effets: [{ stat: 'attributs.perception', delta: 3 }, { drapeau: 'mitsuki', valeur: 'respect' }, { retour: 'kv_suna_mitsuki_retour', chance: 0.8, entre: [900, 1800] }] },
          echec: { texte: 'La marionnette te tape sur le front avec un de ses quatre bras. Tu n’as rien vu venir. Mitsuki sourit. « L’ombre. Je t’avais prévenu·e. »', effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'mitsuki', valeur: 'amusee' }, { retour: 'kv_suna_mitsuki_retour', chance: 0.6, entre: [900, 1800] }] },
        },
      },
      {
        id: 'apprendre',
        texte: 'Lui demander de t’apprendre',
        effets: [{ stat: 'attributs.controleChakra', delta: 2 }, { drapeau: 'mitsuki', valeur: 'eleve' }, { retour: 'kv_suna_mitsuki_retour', chance: 0.8, entre: [900, 1800] }],
        resultat: 'Elle te regarde longtemps, comme si elle pesait le prix d’un secret. Puis elle te tend un fil de chakra au bout d’un seul doigt. « Fais bouger la feuille. Juste la feuille. » Il te faut tout l’après-midi. La feuille bouge. Une fois. Elle a l’air presque contente.',
      },
      {
        id: 'distance',
        texte: '« Les marionnettes, c’est pour ceux qui ont peur de se battre. »',
        effets: [{ stat: 'social.reputation', delta: -1 }, { drapeau: 'mitsuki', valeur: 'vexee' }, { retour: 'kv_suna_mitsuki_retour', chance: 0.6, entre: [900, 1800] }],
        resultat: 'Mitsuki ne répond pas. La marionnette, si : elle te fauche les jambes d’un seul bras, et tu atterris dans le sable. « Le combat à distance n’est pas une faiblesse, dit-elle sans se retourner. C’est une distance. »',
      },
    ],
  }),
  suite({
    id: 'kv_suna_mitsuki_retour',
    titre: 'La rumeur des marionnettistes',
    categorie: 'amitie',
    lieu: '$village',
    si: { tout: [ACTIF, { village: 'suna' }] },
    texte: [
      { texte: 'Au marché de l’eau, deux vieilles femmes parlent à voix basse : « On dit que la petite Mitsuki a trouvé un maître. Le vieux de la tour sud, celui qui ne prenait plus d’élèves. » Le lendemain, tu la croises à la porte du village. Elle porte trois marionnettes dans le dos, au lieu d’une.' },
      { si: { un: [{ drapeau: 'mitsuki', egal: 'respect' }, { drapeau: 'mitsuki', egal: 'eleve' }] }, texte: '« C’est toi. Tu cherchais encore le fil, la dernière fois que je t’ai vu·e. » Elle sourit, pour de vrai.' },
      { si: { drapeau: 'mitsuki', egal: 'vexee' }, texte: '« Les marionnettes, c’est pour ceux qui ont peur de se battre, c’est ça ? » Elle n’a rien oublié. Ses trois marionnettes non plus, on dirait.' },
    ],
    choix: [
      {
        id: 'feliciter',
        texte: 'La féliciter',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { drapeau: 'mitsuki_adulte', valeur: 'amie' }],
        resultat: [
          { si: { drapeau: 'mitsuki', egal: 'vexee' }, texte: '« Merci. » Elle hésite. « Tu avais tort, à l’époque. Mais tu as le droit de changer d’avis. Pas tout le monde le fait. »' },
          { si: { non: { drapeau: 'mitsuki', egal: 'vexee' } }, texte: 'Elle hausse les épaules, faussement modeste, et fait faire une révérence à sa plus petite marionnette. « Quand tu auras une mission où il faut quelqu’un qui frappe de loin, demande-moi. »' },
        ],
      },
      {
        id: 'defi',
        texte: 'La défier, pour voir ce que vaut son nouveau maître',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { perception: 2, agilite: 2 },
          maitrises: { taijutsu: 1, arme: 1 },
          succes: { texte: 'Trois marionnettes, douze bras. Tu cherches les fils comme elle te l’avait appris, et tu en coupes un, puis deux. La troisième marionnette s’arrête à un doigt de ta gorge. « Égalité, dit Mitsuki. Disons égalité. » Vous savez, elle comme toi, que ce n’est pas tout à fait vrai.', effets: [{ stat: 'attributs.perception', delta: 2 }, { drapeau: 'mitsuki_adulte', valeur: 'rivale' }] },
          echec: { texte: 'Tu ne vois que deux marionnettes. La troisième était dans ton dos depuis le début. Mitsuki te tend la main pour te relever. « Mon ombre. Toujours mon ombre. »', effets: [{ stat: 'jauges.sante', delta: -6 }, { drapeau: 'mitsuki_adulte', valeur: 'rivale' }] },
        },
      },
    ],
  }),
  scene('suna', 'genin', {
    id: 'kv_suna_gourdes',
    titre: 'L’eau de la route',
    categorie: 'mission',
    lieu: 'desert_vent',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: 'Troisième jour de traversée. {@coequipierA} pèse les gourdes une par une, sans un mot, puis te regarde : « Nous avons assez d’eau pour la route. Pas pour tes erreurs. » Toi : « Tu pourrais dire ça plus gentiment. » « Je pourrais. Mais la gentillesse ne remplit pas une gourde. Vérifie les réserves, puis nous parlerons de politesse. »',
    choix: [
      {
        id: 'verifier',
        texte: 'Vérifier les réserves, sans discuter',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { perception: 2, intellect: 1 },
          succes: { texte: 'Une gourde fuit. Une seule, par la couture. Tu la trouves, tu la répares avec de la résine. Ce soir-là, {@coequipierA} te tend la première gorgée, ce qui, à Suna, vaut un discours.', effets: [{ stat: 'attributs.perception', delta: 2 }, { relation: '@coequipierA', delta: { respect: 5 } }] },
          echec: { texte: 'Tu vérifies tout, et tu ne trouves rien. Le lendemain, une gourde est vide : la couture avait lâché. Vous rationnez. Personne ne te le reproche à voix haute.', effets: [{ stat: 'jauges.fatigue', delta: 20 }, { relation: '@coequipierA', delta: { confiance: -2 } }] },
        },
      },
      {
        id: 'partager',
        texte: 'Lui donner ta propre gourde, pour couper court',
        effets: [{ stat: 'jauges.fatigue', delta: 15 }, { relation: '@coequipierA', delta: { attachement: 4, respect: 2 } }, { ethique: { compassion: 2 } }],
        resultat: '{@coequipierA} regarde la gourde, puis toi. « Ce n’était pas ce que je demandais. » Mais {il:@coequipierA} la prend. Le dernier jour, quand tu titubes de soif, c’est {lui:@coequipierA} qui te rend la moitié de la sienne.',
      },
      {
        id: 'repondre',
        texte: '« Et toi, tu as vérifié les tiennes ? »',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { relation: '@coequipierA', delta: { rivalite: 4, amitie: -1 } }],
        resultat: 'Un silence sec. Puis {@coequipierA} vérifie ses propres gourdes, une par une, devant toi. Toutes pleines. « Oui. Deux fois. » {Il:@coequipierA} te tend la tienne. Elle fuit.',
      },
    ],
  }),
  scene('suna', 'adulte', {
    id: 'kv_suna_responsabilite',
    titre: 'Ce qu’il y avait derrière la cible',
    categorie: 'civils',
    lieu: '$terrain',
    texte: 'Démonstration devant de jeunes genin. Ta technique part, puissante, précise, et la cible de bois éclate. Derrière la cible, à vingt pas, un marchand d’eau qui traversait le terrain se relève, couvert d’éclats, une entaille au front. Un vieux marionnettiste, assis à l’ombre, n’a pas bougé : « Une arme n’est pas une arme parce qu’elle est faite de bois. C’est une arme parce que quelqu’un accepte d’en porter la responsabilité. Tu as regardé la cible. Tu n’as pas regardé ce qu’il y avait derrière. Ce n’est pas une erreur de visée. C’est une erreur de jugement. »',
    choix: [
      {
        id: 'assumer',
        texte: 'Aller soigner le marchand, et le dire aux genin',
        effets: [{ ethique: { honneur: 4, compassion: 3 } }, { stat: 'social.reputation', delta: 2 }, { entrainer: 'shosen', jours: 10 }],
        resultat: 'Tu panses le marchand toi-même, devant les genin, et tu leur expliques ton erreur. Pas la technique : l’erreur. Le vieux marionnettiste se lève et s’en va sans un mot. Le lendemain, il te fait porter une de ses vieilles marionnettes, sans mot d’accompagnement. Tu ne sais pas si c’est un cadeau ou un avertissement.',
      },
      {
        id: 'minimiser',
        texte: '« Il n’avait rien à faire sur le terrain. »',
        effets: [{ ethique: { compassion: -4 } }, { stat: 'social.reputation', delta: -3 }, { stat: 'attributs.controleEmotionnel', delta: -1 }],
        resultat: 'C’est vrai. Le vieux marionnettiste te regarde comme on regarde un enfant qui vient de dire une chose vraie et inutile. Les genin, eux, ont tout entendu. L’un d’eux répétera ta phrase, des années plus tard, pour justifier pire.',
      },
    ],
  }),

  // ═══ KIRI ═════════════════════════════════════════════════════
  scene('kiri', 'enfance', {
    id: 'kv_kiri_brume',
    titre: 'Marche devant',
    categorie: 'enfance',
    lieu: '$village',
    texte: 'Dans la brume du port, un garçon maigre se retourne brusquement : « Pourquoi tu marches derrière moi ? » « Je vais dans la même direction. » « Alors marche devant. Comme ça, je saurai si tu veux me tendre un piège. »',
    choix: [
      {
        id: 'devant',
        texte: 'Passer devant lui, sans discuter',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'kiri_brume', valeur: 'confiance' }, { retour: 'kv_kiri_brume_endroit', chance: 1, entre: [1, 3] }],
        resultat: 'Tu passes devant. Tu sens son regard dans ton dos jusqu’au bout du quai. Arrivé au carrefour, il te rattrape. « …Tu n’es pas obligé·e de me suivre. Mais si tu reviens demain, je te montrerai un endroit où la brume est moins épaisse. »',
      },
      {
        id: 'mefiant',
        texte: '« C’est toi qui as l’air de préparer un piège. »',
        effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'kiri_brume', valeur: 'mefiance' }],
        resultat: 'Il te dévisage, presque satisfait. « Bien. Tu es d’ici, alors. » Il disparaît dans la brume. Tu ne sais pas si tu as gagné ou perdu quelque chose.',
      },
    ],
  }),
  suite({
    id: 'kv_kiri_brume_endroit',
    titre: 'L’endroit où la brume est moins épaisse',
    categorie: 'amitie',
    lieu: 'cotes_brume',
    si: ACTIF,
    texte: 'Tu reviens le lendemain. Il t’attend au même carrefour, les mains dans les poches, et t’emmène sans un mot jusqu’à un rocher, au bout de la jetée, où la brume se déchire comme un rideau. De là, on voit tout le village, et la mer, et les îles au loin. « Mon père venait ici. Avant. » Il ne dit pas avant quoi.',
    choix: [
      {
        id: 'silence',
        texte: 'Ne poser aucune question, et regarder',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.perception', delta: 1 }, { drapeau: 'kiri_brume', valeur: 'ami' }],
        resultat: 'Vous restez là une heure, sans parler. En partant, il dit seulement : « Tu peux revenir. Tout·e seul·e, même. » À Kiri, c’est beaucoup.',
      },
      {
        id: 'avant',
        texte: '« Avant quoi ? »',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: 'Il te regarde longtemps. « Avant qu’on tue les enfants qui avaient raté leur examen. » Puis il rit, un rire sans joie. « Ça n’existe plus. On dit. » Il ne te ramène jamais à ce rocher.',
      },
    ],
  }),
  scene('kiri', 'academie', {
    id: 'kv_kiri_secret',
    titre: 'Garder un secret',
    categorie: 'academie',
    lieu: '$academie',
    texte: 'Une élève de ta classe, assise sur le muret, balance ses jambes au-dessus de l’eau grise. « Le professeur dit qu’un bon ninja sait garder un secret. » Toi : « Et toi, tu sais le faire ? » « Oui. » « Alors pourquoi tu me le dis ? » Elle te fixe une seconde, puis : « …Je te déteste déjà. »',
    choix: [
      {
        id: 'rire',
        texte: 'Éclater de rire',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { drapeau: 'kiri_secret', valeur: 'complice' }],
        resultat: 'Elle essaie de rester sérieuse. Elle n’y arrive pas. Pendant tout le reste de l’Académie, chaque fois que quelqu’un dira « un bon ninja sait garder un secret », vous échangerez un regard, et elle murmurera : « Je te déteste. »',
      },
      {
        id: 'secret',
        texte: '« Alors raconte-moi un vrai secret. Je verrai si je sais le garder. »',
        effets: [{ stat: 'attributs.discretion', delta: 2 }, { drapeau: 'kiri_secret', valeur: 'confidence' }],
        resultat: 'Elle hésite. Puis elle te dit que sa mère n’est pas morte en mission, comme tout le monde le croit : elle est partie, et elle écrit encore, une fois par an. Tu ne le répètes à personne. Des années plus tard, elle s’en souviendra.',
      },
    ],
  }),
  scene('kiri', 'genin', {
    id: 'kv_kiri_kunoichi',
    titre: 'Le silence n’est pas la confiance',
    categorie: 'mission',
    lieu: 'cotes_brume',
    texte: [
      { texte: 'Nuit de guet sur un îlot, avec une kunoichi de ton équipe qui n’a pas dit dix mots depuis le départ. « Ne confonds pas le silence avec la confiance. Je ne parle pas parce que je n’ai rien à dire. Je parle peu parce que je choisis ce que je laisse sortir. » Toi : « Tu pourrais au moins me dire si tu penses que je vais survivre à cette mission. » Elle : « Si je pensais que tu n’avais aucune chance, je serais déjà en train de chercher un autre partenaire. »' },
      { si: { drapeau: 'kiri_secret', egal: 'complice' }, texte: 'C’est elle. L’élève du muret. Elle te regarde du coin de l’œil et, très bas : « Je te déteste toujours. » Tu souris dans le noir.' },
    ],
    choix: [
      {
        id: 'veiller',
        texte: 'Prendre le premier tour de garde, et la laisser dormir',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { perception: 2, controleEmotionnel: 1 },
          succes: { texte: 'Vers trois heures, une barque sans lanterne glisse vers l’îlot. Tu la vois avant qu’elle ne te voie. Tu réveilles ta partenaire d’un geste, sans un bruit. La barque repart. Au matin, elle te dit : « Tu as bien fait de ne pas crier. » Elle prend le tour suivant sans que tu demandes.', effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: 'Tu t’endors une seconde. Elle aussi était réveillée : elle a vu la barque, et elle t’a laissé·e dormir pour voir. « Tu dors comme une pierre. Ça ne te tuera pas ce soir. Peut-être un autre soir. »', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'jauges.fatigue', delta: 10 }] },
        },
      },
      {
        id: 'parler',
        texte: 'Lui demander ce qu’elle choisit de garder pour elle',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { drapeau: 'kiri_kunoichi', valeur: 'question' }],
        resultat: 'Elle ne répond pas. Une heure plus tard, au milieu du silence : « Le nom de mon frère. Personne ne l’a prononcé depuis quatre ans. » Elle ne te le dit pas. Mais tu comprends que c’est déjà un aveu.',
      },
    ],
  }),
  scene('kiri', 'adulte', {
    id: 'kv_kiri_ancien',
    titre: 'Ce que personne ne m’a appris',
    categorie: 'politique',
    lieu: '$village',
    si: [{ age: { min: 20 } }],
    texte: 'Un vieux ninja, assis au bout du quai, répare un filet de pêche. Il a servi sous l’ancien Mizukage, celui des années sanglantes. Tout le monde le sait. Personne n’en parle. « On m’a appris à ne pas hésiter. Personne ne m’a appris quoi faire après. »',
    choix: [
      {
        id: 'passe',
        texte: 'L’interroger sur son passé',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: '« Tu veux une histoire qui te donne raison de me juger ? Tu n’auras pas ça. J’ai fait des choses dont je suis responsable. Certaines étaient ordonnées. Ça ne les rend pas moins miennes. » Il recommence à nouer son filet. La conversation est finie.',
      },
      {
        id: 'temoigner',
        texte: 'Lui proposer de témoigner contre son ancien supérieur, qui siège encore au conseil',
        effets: [{ stat: 'social.influence', delta: 2 }, { drapeau: 'kiri_temoin', valeur: 'propose' }, { retour: 'kv_kiri_temoignage', chance: 1, entre: [120, 400] }],
        resultat: 'Il pose son filet. « Si je parle, certains diront que je trahis le village. Si je me tais, d’autres devront vivre avec ce que nous avons fait. Tu comprends maintenant pourquoi je n’ai pas répondu tout de suite ? » Il ne dit ni oui ni non. Il dit : « Reviens à la prochaine lune. »',
      },
      {
        id: 'paix',
        texte: 'L’aider à réparer le filet, sans rien demander',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { compassion: 2 } }],
        resultat: 'Vous nouez des mailles jusqu’au soir. Il ne parle pas de la guerre. Il parle de poissons, de marées, de sa femme morte. En partant, il te dit : « Tu es le premier depuis longtemps à ne rien me demander. »',
      },
    ],
  }),
  suite({
    id: 'kv_kiri_temoignage',
    titre: 'La prochaine lune',
    categorie: 'politique',
    lieu: '$village',
    si: ACTIF,
    texte: 'Tu reviens au quai. Le vieil homme t’attend, en tenue de cérémonie, pour la première fois depuis vingt ans. « Je vais parler au conseil. Mais je veux que tu sois là. Pas pour me protéger. Pour que quelqu’un sache ce que j’ai dit, si ça tourne mal. »',
    choix: [
      {
        id: 'accompagner',
        texte: 'L’accompagner au conseil',
        effets: [
          { stat: 'social.influence', delta: 4 },
          { hasard: [
            { poids: 55, effets: [{ drapeau: 'kiri_temoin', valeur: 'ecoute' }, { stat: 'social.reputation', delta: 4 }] },
            { poids: 45, effets: [{ drapeau: 'kiri_temoin', valeur: 'etouffe' }, { stat: 'social.suspicion', delta: 6 }] },
          ] },
        ],
        resultat: [
          { si: { drapeau: 'kiri_temoin', egal: 'ecoute' }, texte: 'Il parle une heure. Personne ne l’interrompt. À la fin, l’ancien supérieur se lève, et quitte la salle sans un mot. Le lendemain, son siège est vide. Le vieil homme retourne à ses filets, plus léger d’un poids que tu ne lui connaissais pas.' },
          { si: { drapeau: 'kiri_temoin', egal: 'etouffe' }, texte: 'On ne le laisse pas finir. On le remercie, on le raccompagne, on ferme la porte. Le soir, deux ninjas que tu ne connais pas t’attendent devant chez toi. Ils ne disent rien. Ils te regardent, c’est tout. À Kiri, c’est un message.' },
        ],
      },
      {
        id: 'renoncer',
        texte: 'Lui dire que le village n’est pas prêt',
        effets: [{ stat: 'social.loyaute', delta: 2 }, { ethique: { honneur: -3 } }, { drapeau: 'kiri_temoin', valeur: 'renonce' }],
        resultat: 'Il te regarde, et quelque chose s’éteint dans ses yeux. « Personne ne l’est jamais. C’est pour ça qu’on le fait quand même. » Il rentre chez lui, enlève sa tenue de cérémonie. Il ne t’en reparlera jamais.',
      },
    ],
  }),

  // ═══ KUMO ═════════════════════════════════════════════════════
  scene('kumo', 'enfance', {
    id: 'kv_kumo_course',
    titre: 'Jusqu’au rocher',
    categorie: 'enfance',
    lieu: 'montagnes_foudre',
    texte: 'Une fille de Kumo, les genoux couronnés de croûtes, te tape sur l’épaule : « On fait une course jusqu’au rocher ! » « Et si je gagne ? » « Je te laisse choisir le prochain défi. » « Et si tu gagnes ? » « Je choisis deux défis. » « Ce n’est pas juste. » « La vie non plus. Dépêche-toi ! » Elle est déjà partie.',
    choix: [
      {
        id: 'courir',
        texte: 'Courir',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { agilite: 3 },
          succes: { texte: 'Tu la rattrapes au dernier virage et touches le rocher une main avant elle. Elle s’effondre dans l’herbe en riant. « D’accord ! Choisis ! » Tu choisis : demain, même course, à l’envers. Elle accepte avec un enthousiasme effrayant.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { drapeau: 'kumo_course', valeur: 'gagne' }] },
          echec: { texte: 'Elle t’attend sur le rocher. « Deux défis ! Un : grimper l’arbre foudroyé. Deux : manger un piment entier. » Tu fais les deux. Tu pleures pendant le deuxième. Elle aussi, de rire.', effets: [{ stat: 'attributs.force', delta: 1 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'kumo_course', valeur: 'perdu' }] },
        },
      },
      {
        id: 'raccourci',
        texte: 'Prendre le raccourci par le ravin',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'jauges.sante', delta: -4 }, { drapeau: 'kumo_course', valeur: 'raccourci' }],
        resultat: 'Tu arrives premier·ère, couvert·e d’égratignures. Elle te regarde, les poings sur les hanches. « Tricheur·se. » Puis, admirative : « Je ne savais pas qu’on pouvait passer par là. Demain, tu me montres. »',
      },
    ],
  }),
  scene('kumo', 'academie', {
    id: 'kv_kumo_reflechir',
    titre: 'Tu réfléchis trop',
    categorie: 'academie',
    lieu: '$terrain',
    texte: 'Combat d’entraînement. Ton adversaire, un garçon trapu de Kumo, n’a pas cessé d’avancer depuis le début. « Tu réfléchis trop avant de frapper. » « Et toi, tu frappes avant de réfléchir. » « Oui. C’est pour ça que j’ai déjà appris à encaisser. »',
    choix: [
      {
        id: 'feinte',
        texte: 'Lui faire croire que tu recules, et frapper',
        test: {
          type: 'combat',
          difficulte: 42,
          attributs: { agilite: 2, intellect: 1 },
          maitrises: { taijutsu: 2 },
          succes: { texte: 'Tu recules d’un pas. Il avance, comme toujours. Tu pivotes, et ton talon trouve son genou. Il tombe assis, surpris. « Bien joué. Je pensais que tu reculerais. La prochaine fois, je ne te laisserai pas choisir le rythme. »', effets: [{ entrainer: 'taijutsu', jours: 15 }, { stat: 'attributs.intellect', delta: 1 }, { drapeau: 'kumo_frappe', valeur: 'gagne' }] },
          echec: { texte: 'Il ne croit pas à ton recul. Il avance quand même, plus vite, et te plaque au sol. « Tu vois ? J’encaisse, et j’avance. » Il te tend la main pour te relever.', effets: [{ entrainer: 'taijutsu', jours: 10 }, { stat: 'jauges.sante', delta: -5 }] },
        },
      },
      {
        id: 'encaisser',
        texte: 'Faire comme lui : encaisser et avancer',
        effets: [{ stat: 'attributs.force', delta: 2 }, { stat: 'jauges.sante', delta: -8 }, { drapeau: 'kumo_frappe', valeur: 'encaisse' }],
        resultat: 'Vous échangez des coups comme deux béliers, jusqu’à ce que l’instructeur vous sépare. Tu as un œil gonflé. Lui aussi. Il te regarde avec un respect nouveau. « Tu réfléchis moins. C’est un progrès. » Tu n’es pas sûr·e que ce soit un compliment.',
      },
    ],
  }),
  scene('kumo', 'genin', {
    id: 'kv_kumo_equipe',
    titre: 'La cible ou le coéquipier',
    categorie: 'mission',
    lieu: 'montagnes_foudre',
    personnages: ['@coequipierB'],
    si: [B],
    texte: 'Poursuite dans les gorges. Le voleur de rouleaux est à cinquante pas devant toi, blessé, ralenti. Derrière, un cri : {@coequipierB} a glissé sur la paroi et pend au-dessus du vide, accroché{e:@coequipierB} d’une main. Ton chef d’équipe l’a dit au briefing : « On ne gagne pas parce qu’on est le plus fort. On gagne parce qu’au moment où l’un tombe, les deux autres savent quoi faire. »',
    choix: [
      {
        id: 'revenir',
        texte: 'Revenir chercher {@coequipierB}',
        effets: [{ relation: '@coequipierB', delta: { attachement: 8, confiance: 8 } }, { stat: 'social.loyaute', delta: -1 }, { drapeau: 'kumo_cible', valeur: 'equipe' }],
        resultat: 'Tu fais demi-tour et tu tires {@coequipierB} hors du vide. Le voleur disparaît dans les gorges. Le chef d’équipe arrive, regarde les deux, puis toi. « Tu as laissé ta cible s’échapper. » « J’ai ramené mon coéquipier. » « Je sais. Le rapport parlera de la cible. Moi, je parlerai de toi. »',
      },
      {
        id: 'cible',
        texte: 'Poursuivre : le chef est derrière, il s’en occupera',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { agilite: 2, force: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          succes: { texte: 'Tu rattrapes le voleur au fond de la gorge. Il se bat mal, blessé. Tu rapportes les rouleaux. {@coequipierB} est hors de danger : le chef l’a hissé{e:@coequipierB} hors du vide. Mais {il:@coequipierB} ne te regarde pas pendant tout le retour.', effets: [{ stat: 'social.reputation', delta: 3 }, { relation: '@coequipierB', delta: { confiance: -6 } }, { drapeau: 'kumo_cible', valeur: 'cible' }] },
          echec: { texte: 'Le voleur t’attendait derrière un rocher. Tu prends un coup de couteau dans le bras, il s’enfuit. Tu reviens bredouille, et {@coequipierB} a été hissé{e:@coequipierB} hors du vide sans toi.', effets: [{ blessure: { id: 'gorges_kumo', nom: 'Couteau au bras', gravite: 1, jours: 15 } }, { relation: '@coequipierB', delta: { confiance: -4 } }] },
        },
      },
    ],
  }),
  scene('kumo', 'adulte', {
    id: 'kv_kumo_critique',
    titre: 'Le prix de leurs choix',
    categorie: 'politique',
    lieu: '$village',
    si: [{ age: { min: 20 } }],
    texte: 'Dans une taverne de Kumo, tu critiques à voix haute une décision du Raikage : l’enlèvement d’enfants à lignée rare dans les villages voisins. Un jōnin, à la table d’à côté, pose son verre. « Tu peux critiquer mon village. Mais si tu veux comprendre pourquoi nous prenons ces décisions, cesse de parler comme si les autres n’avaient jamais payé le prix de leurs choix. »',
    choix: [
      {
        id: 'erreurs',
        texte: 'Reconnaître que ton propre camp a fait pire',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.influence', delta: 2 }],
        resultat: 'Tu cites une décision de ton propre camp, une de celles dont on ne parle pas. Le jōnin te regarde autrement. « Voilà une réponse que je peux respecter. Tu n’as pas besoin d’être d’accord avec moi. Tu dois seulement avoir le courage d’examiner ce que tu défends. » Il te paie un verre. Vous parlez jusqu’à l’aube, sans vous mettre d’accord sur rien.',
      },
      {
        id: 'persister',
        texte: '« Enlever des enfants reste enlever des enfants. »',
        effets: [{ ethique: { honneur: 2, compassion: 2 } }, { stat: 'social.suspicion', delta: 3 }],
        resultat: 'Il ne se fâche pas. Il hoche la tête. « Oui. Et laisser d’autres villages les enlever avant nous reste laisser faire. » Il se lève. « Tu as raison sur le fait. Tu as tort de croire que c’est simple. » La taverne s’est tue. Demain, on saura que tu as parlé.',
      },
    ],
  }),

  // ═══ IWA ══════════════════════════════════════════════════════
  scene('iwa', 'enfance', {
    id: 'kv_iwa_rocher',
    titre: 'Où la montagne est déjà fissurée',
    categorie: 'enfance',
    lieu: 'carrieres_terre',
    texte: 'Tu frappes un rocher à poings nus depuis dix minutes. Un garçon d’Iwa, assis sur une pierre, mange une pomme en te regardant. « Pourquoi tu frappes toujours le rocher ? » « Pour le casser. » « Tu vas te faire mal avant lui. » « Alors comment je fais ? » « Tu regardes où il est déjà fissuré. Même une montagne a des faiblesses. »',
    choix: [
      {
        id: 'fissure',
        texte: 'Chercher la fissure',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { perception: 2, force: 1 },
          succes: { texte: 'Tu tournes autour du rocher. Une ligne fine, presque invisible, court sous la mousse. Un seul coup, au bon endroit, et le rocher s’ouvre en deux. Le garçon arrête de mâcher. « Bon. Tu écoutes, au moins. »', effets: [{ stat: 'attributs.perception', delta: 2 }, { drapeau: 'iwa_fissure' }] },
          echec: { texte: 'Tu frappes là où tu crois voir une fissure. C’était de la mousse. Tu secoues ta main en grimaçant. Il te tend sa pomme. « Ça aide. Pas pour la main. Pour le moral. »', effets: [{ stat: 'jauges.sante', delta: -3 }, { stat: 'attributs.perception', delta: 1 }] },
        },
      },
      {
        id: 'frapper',
        texte: 'Continuer à frapper, plus fort',
        effets: [{ stat: 'attributs.force', delta: 2 }, { stat: 'jauges.sante', delta: -8 }],
        resultat: 'Tu frappes jusqu’au sang. Le rocher ne bouge pas. Le garçon soupire, finit sa pomme, et s’en va. « Il sera encore là demain. Toi, je ne sais pas. »',
      },
    ],
  }),
  scene('iwa', 'academie', {
    id: 'kv_iwa_endurance',
    titre: 'Te laisser croire que tu as le temps',
    categorie: 'academie',
    lieu: '$terrain',
    texte: 'Course d’endurance autour des pitons. Tu prends la tête dès le départ. Une élève d’Iwa te suit à dix pas, sans jamais accélérer. « Tu peux courir plus vite que moi. Mais tu ne peux pas courir indéfiniment. » « Tu comptes me battre en attendant que je sois fatigué·e ? » « Je compte te battre en te laissant croire que tu as le temps. »',
    choix: [
      {
        id: 'rythme',
        texte: 'Ralentir et prendre son rythme',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { controleEmotionnel: 2, force: 1 },
          succes: { texte: 'Tu ralentis. Elle aussi. Vous courez côte à côte pendant une heure. Au dernier piton, tu as encore des jambes. Elle aussi. Vous franchissez la ligne ensemble. Elle hoche la tête. « Tu as compris plus vite que la plupart. »', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'jauges.chakraMax', delta: 2 }] },
          echec: { texte: 'Tu ralentis trop tard. Tes jambes sont déjà lourdes. Elle te dépasse au dernier piton, sans même accélérer.', effets: [{ stat: 'jauges.fatigue', delta: 20 }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
      {
        id: 'sprint',
        texte: 'Accélérer encore, pour la semer',
        effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'jauges.fatigue', delta: 25 }],
        resultat: 'Tu la sèmes de cent pas. Puis de cinquante. Puis de dix. Au dernier piton, elle passe à côté de toi, au même rythme qu’au départ, et te salue de la main. Tu finis à genoux. Elle t’apporte de l’eau sans un mot.',
      },
    ],
  }),
  scene('iwa', 'genin', {
    id: 'kv_iwa_terrain',
    titre: 'Le sol qui choisit',
    categorie: 'mission',
    lieu: 'carrieres_terre',
    texte: 'Escorte d’un convoi de minerai dans un défilé. Ton chef d’unité d’Iwa s’arrête et pose la main à plat sur la roche : « Le terrain fait partie du combat. Si tu ignores le sol, tu laisses ton adversaire choisir où tu vas tomber. » Trois hommes surgissent des rochers, épées courtes à la main.',
    choix: [
      {
        id: 'sol',
        texte: 'Regarder tes pieds avant de regarder l’ennemi',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { perception: 2, agilite: 1, force: 1 },
          maitrises: { taijutsu: 1, arme: 1, nature_doton: 1 },
          arme: true,
          letal: true,
          manches: 2,
          causeMort: 'tombé·e dans un défilé d’Iwa, en escortant un convoi de minerai',
          succes: { texte: 'Le sol devant toi sonne creux. Une fosse couverte de planches et de gravier. Tu recules d’un pas, et le premier assaillant, qui comptait t’y voir tomber, y tombe lui-même. Les deux autres hésitent assez longtemps pour que vous les mettiez à terre. Le chef d’unité hoche la tête : « Tu as regardé tes pieds avant de regarder ton ennemi. C’est une habitude que beaucoup apprennent trop tard. »', effets: [{ stat: 'attributs.perception', delta: 3 }, { combatSur: ['taijutsu'] }, { stat: 'social.reputation', delta: 3 }] },
          echec: { texte: 'Tu charges. Le sol cède sous toi. Tu tombes dans la fosse, la cheville tordue, et c’est ton chef d’unité qui règle le combat pendant que tu remontes.', effets: [{ blessure: { id: 'fosse_iwa', nom: 'Cheville tordue', gravite: 1, jours: 15 } }, { stat: 'attributs.perception', delta: 1 }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Faire reculer le convoi vers le terrain dégagé',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.ryo', delta: -10 }],
        resultat: 'Tu fais reculer les mules vers l’entrée du défilé, là où le sol est nu et sûr. Les assaillants, privés de leur piège, n’osent pas vous suivre en terrain découvert. Vous perdez un chariot. Personne ne meurt. Le chef d’unité ne dit rien. Il note quelque chose dans son carnet.',
      },
    ],
  }),
  scene('iwa', 'adulte', {
    id: 'kv_iwa_ordre',
    titre: 'Empêcher quelqu’un de franchir une ligne',
    categorie: 'politique',
    lieu: '$village',
    si: [{ age: { min: 19 } }],
    texte: 'On t’ordonne de brûler les réserves de grain d’un hameau frontalier soupçonné de nourrir des espions. Il y a des enfants dans ce hameau. Un vétéran d’Iwa, qui a reçu le même ordre, s’assoit à côté de toi au poste de garde : « Les jeunes pensent que la force consiste à faire bouger les autres. Avec le temps, on comprend que la vraie force consiste parfois à empêcher quelqu’un de franchir une ligne. »',
    choix: [
      {
        id: 'refuser',
        texte: 'Refuser l’ordre',
        effets: [{ ethique: { honneur: 4, compassion: 4 } }, { stat: 'social.loyaute', delta: -6 }, { drapeau: 'iwa_ordre', valeur: 'refuse' }, { retour: 'kv_iwa_ordre_suite', chance: 1, entre: [1000, 2000] }],
        resultat: 'Tu poses ton bandeau sur la table du capitaine. Le vétéran te regarde. « Je ne vais pas te féliciter simplement parce que tu as désobéi. Mais je veux savoir si tu as compris le prix que les autres risquent de payer à cause de ta décision. » On te retire ton commandement. Le hameau garde son grain. Un autre ninja, peut-être, ira à ta place.',
      },
      {
        id: 'obeir',
        texte: 'Obéir',
        effets: [{ stat: 'social.loyaute', delta: 5 }, { ethique: { compassion: -6 } }, { drapeau: 'iwa_ordre', valeur: 'obei' }, { retour: 'kv_iwa_ordre_suite', chance: 1, entre: [1000, 2000] }],
        resultat: 'Le grain brûle. Les villageois regardent sans rien dire. Une petite fille te fixe jusqu’à ce que tu partes. Au retour, le capitaine te félicite. Le vétéran ne te parle plus.',
      },
      {
        id: 'troisieme',
        texte: 'Prévenir le hameau la veille, pour qu’ils cachent la moitié du grain',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { discretion: 2, charisme: 1, intellect: 1 },
          succes: { texte: 'Tu passes la nuit au hameau, à parler au chef du village à voix basse. Le lendemain, tu brûles la moitié des réserves, devant ton capitaine. L’autre moitié dort dans une grotte. Le vétéran comprend, à ton regard. Il ne dit rien. Il te tape sur l’épaule.', effets: [{ stat: 'attributs.discretion', delta: 2 }, { ethique: { compassion: 3 } }, { drapeau: 'iwa_ordre', valeur: 'ruse' }, { retour: 'kv_iwa_ordre_suite', chance: 1, entre: [1000, 2000] }] },
          echec: { texte: 'Un guetteur t’a vu entrer au hameau. Ton capitaine le sait le lendemain. Tu n’es pas puni·e. Pas encore. Mais ton nom est maintenant dans un rapport.', effets: [{ stat: 'social.suspicion', delta: 8 }, { drapeau: 'iwa_ordre', valeur: 'decouvert' }, { retour: 'kv_iwa_ordre_suite', chance: 1, entre: [1000, 2000] }] },
        },
      },
    ],
  }),
  suite({
    id: 'kv_iwa_ordre_suite',
    titre: 'Une conviction, ou une raison',
    categorie: 'politique',
    lieu: '$village',
    si: ACTIF,
    texte: [
      { texte: 'Des années ont passé. Un ordre du même genre tombe sur une jeune équipe, et c’est toi qu’on charge de le transmettre. La cheffe de l’équipe, une jōnin de vingt ans, vient te voir avant le départ.' },
      { si: { drapeau: 'iwa_ordre', egal: 'refuse' }, texte: '« La dernière fois, tu as refusé d’obéir. Tout le monde le sait. Cette fois, c’est moi qui te demande ce que tu comptes faire. Je veux savoir si tu avais une conviction… ou simplement une raison de désobéir ce jour-là. »' },
      { si: { drapeau: 'iwa_ordre', egal: 'obei' }, texte: '« On dit que toi, tu as brûlé le grain du hameau, il y a des années. Sans discuter. » Elle attend. « Je voudrais savoir si tu le referais. »' },
      { si: { un: [{ drapeau: 'iwa_ordre', egal: 'ruse' }, { drapeau: 'iwa_ordre', egal: 'decouvert' }] }, texte: '« Il paraît que tu as trouvé une troisième voie, une fois. Le vétéran me l’a raconté avant de mourir. » Elle baisse la voix. « Comment on fait ? »' },
    ],
    choix: [
      {
        id: 'conviction',
        texte: 'Lui dire ce que tu crois, vraiment',
        effets: [{ ethique: { honneur: 3 } }, { stat: 'social.influence', delta: 3 }],
        resultat: [
          { si: { drapeau: 'iwa_ordre', egal: 'obei' }, texte: '« Non. Je ne le referais pas. Et je ne te l’ordonnerai pas. » Elle reste muette un long moment. Puis elle part, et l’ordre n’est jamais exécuté. Personne ne te demande pourquoi. Le vétéran, s’il vivait encore, aurait souri.' },
          { si: { non: { drapeau: 'iwa_ordre', egal: 'obei' } }, texte: 'Tu lui dis ce que tu as compris : qu’une ligne ne se défend pas une fois, mais chaque fois qu’on te demande de la franchir. Elle t’écoute sans t’interrompre. En partant, elle dit : « Alors je saurai quoi faire. » Tu ne sais pas ce qu’elle fera. C’est à elle, maintenant.' },
        ],
      },
      {
        id: 'ordre',
        texte: 'Transmettre l’ordre, simplement',
        effets: [{ stat: 'social.loyaute', delta: 3 }, { ethique: { compassion: -2 } }],
        resultat: 'Tu lui tends le rouleau. Elle le prend, le lit, et te regarde une dernière fois. « D’accord. » Tu ne sauras jamais si elle a obéi. Tu ne demandes pas.',
      },
    ],
  }),

  // ═══ VILLAGES SECONDAIRES ET ORGANISATIONS ════════════════════
  {
    chapitre: 3,
    chapitres: TOUS,
    arc: 'crise',
    id: 'kv_ame_informateur',
    titre: 'Les dettes que la pluie n’efface pas',
    categorie: 'organisation',
    lieu: 'ame',
    poids: 4,
    si: { tout: [{ statut: ['actif', 'errant', 'deserteur'] }, { age: { min: 18 } }] },
    texte: 'Amegakure, sous une pluie qui ne cesse jamais. L’informateur qu’on t’a indiqué est un homme maigre, assis dans l’embrasure d’une tour d’acier. « Ici, la pluie efface les traces. Pas les dettes. » « Tu veux de l’argent ? » « Si je voulais ton argent, je t’aurais donné un prix. Je veux savoir qui t’a envoyé. »',
    choix: [
      {
        id: 'verite',
        texte: 'Lui dire la vérité',
        effets: [{ ethique: { honneur: 2 } }, { indice: 'reseau_ame' }, { stat: 'social.reputationOmbre', delta: 2 }],
        resultat: 'Tu donnes le nom. Il hoche la tête, comme s’il le savait déjà. « Bien. Tu ne m’as pas menti. Ça vaut une information. » Il te dit où trouver ce que tu cherches. En partant, tu sens qu’il vient d’ajouter ton nom à quelque chose. Un registre, une liste. Une dette.',
      },
      {
        id: 'mentir',
        texte: 'Inventer un commanditaire',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: 'Il t’écoute, la tête penchée, et ne relève pas. Il te vend l’information pour un prix que tu trouves trop bas. Tu comprends plus tard qu’il savait que tu mentais, et qu’il a préféré te laisser lui devoir quelque chose.', effets: [{ indice: 'reseau_ame' }, { stat: 'social.reputationOmbre', delta: 3 }, { drapeau: 'dette_ame' }] },
          echec: { texte: '« Celui que tu cites est mort il y a trois mois. » Il se lève et disparaît dans la pluie. Tu repars sans rien.', effets: [{ stat: 'social.suspicion', delta: 3 }] },
        },
      },
      {
        id: 'partir',
        texte: 'Partir : tu ne paies pas ce prix-là',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu repars sous la pluie. Il ne te retient pas. Trois rues plus loin, tu remarques que quelqu’un te suit. Puis plus personne. Ame ne t’oubliera pas.',
      },
    ],
  },
  {
    chapitre: 3,
    chapitres: TOUS,
    arc: 'crise',
    id: 'kv_fer_samourai',
    titre: 'Être prêt n’est pas choisir',
    categorie: 'rivalite',
    lieu: 'pays_fer',
    poids: 4,
    si: { tout: [{ statut: ['actif', 'errant', 'deserteur'] }, { age: { min: 17 } }] },
    texte: 'Pays du Fer, sur un pont couvert de neige. Un samouraï te barre le passage, la main sur la garde de son sabre. Tu dégaines ton kunai par réflexe. Il ne bouge pas. « Tu as dégainé avant que j’aie terminé de parler. » « Tu avais la main sur ton arme. » « Être prêt à combattre n’est pas la même chose que choisir le combat. »',
    choix: [
      {
        id: 'rengainer',
        texte: 'Rengainer, et le laisser finir',
        effets: [{ ethique: { honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'samourai_fer', valeur: 'respect' }],
        resultat: 'Tu rengaines. Il termine : « Le pont est fermé jusqu’à midi. Une avalanche. » C’est tout. Il voulait te prévenir. Il s’incline à peine, et te laisse attendre avec lui, dans la neige, sans un mot de plus. À midi, il te salue. « Apprends cette différence avant de me demander un duel. »',
      },
      {
        id: 'duel',
        texte: '« Alors choisissons-le. »',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { agilite: 2, perception: 1, controleEmotionnel: 1 },
          maitrises: { famille_kenjutsu: 2, arme: 1, taijutsu: 1 },
          arme: true,
          manches: 3,
          succes: { texte: 'Il dégaine une seule fois. Tu pares, de justesse, et ton kunai touche sa manche. Il s’arrête, regarde la déchirure, rengaine. « Tu as gagné. Je ne vais pas transformer ma défaite en accusation. Passe. » Puis, alors que tu passes : « Le pont est fermé. Une avalanche. Je voulais te le dire. »', effets: [{ entrainer: 'famille_kenjutsu', jours: 20 }, { stat: 'social.reputation', delta: 3 }, { drapeau: 'samourai_fer', valeur: 'vaincu' }] },
          echec: { texte: 'Tu n’as pas vu sa lame sortir. Tu vois seulement ton kunai, tranché en deux dans ta main. Il rengaine. « La prochaine fois, laisse-moi finir ma phrase. » Il s’en va. Le pont, tu l’apprendras plus tard, était fermé.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'samourai_fer', valeur: 'defaite' }] },
        },
      },
    ],
  },
  {
    chapitre: 3,
    chapitres: TOUS,
    arc: 'crise',
    id: 'kv_deserteurs',
    titre: 'Ce que coûte l’obéissance',
    categorie: 'desertion',
    lieu: 'frontiere_herbe',
    poids: 4,
    si: { tout: [{ statut: ['actif', 'errant'] }, { age: { min: 18 } }, { rangMin: 'genin' }] },
    texte: 'Un camp de fortune dans les hautes herbes. Huit déserteurs de villages différents, dont deux enfants. Leur chef, un homme au bandeau rayé, ne se lève pas quand tu entres dans la lumière du feu. « Le village m’a appris à obéir. La guerre m’a appris ce que coûte l’obéissance. » « Alors pourquoi continuer à te battre ? » « Parce que ceux qui m’ont suivi ne peuvent pas rentrer chez eux. Et parce que je ne sais pas encore qui je serais si je posais cette arme. »',
    choix: [
      {
        id: 'laisser',
        texte: 'Les laisser passer la frontière',
        effets: [{ ethique: { compassion: 5 } }, { stat: 'social.suspicion', delta: 4 }, { drapeau: 'deserteurs_herbe', valeur: 'laisses' }],
        resultat: 'Tu éteins ta lanterne et tu regardes ailleurs. À l’aube, ils sont partis. Il n’a pas dit merci. Mais sur ta route, le lendemain, tu trouves un kunai planté dans un arbre, avec un ruban noué : le signe des déserteurs pour « une dette ».',
      },
      {
        id: 'denoncer',
        texte: 'Les signaler à la patrouille',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { ethique: { compassion: -3 } }, { drapeau: 'deserteurs_herbe', valeur: 'denonces' }],
        resultat: 'La patrouille arrive à minuit. Le camp est vide : ils t’ont vu·e partir, ils ont compris. Seul le feu brûle encore. Dans les cendres, quelqu’un a écrit un mot avec un bâton. Tu ne le lis pas. Tu le piétines avant que la patrouille le voie.',
      },
      {
        id: 'combattre',
        texte: 'Exiger leur reddition, l’arme à la main',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 1, agilite: 2, controleEmotionnel: 1 },
          maitrises: { taijutsu: 2, arme: 1, ninjutsu: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tué·e dans un camp de déserteurs, à la frontière du Pays de l’Herbe',
          succes: { texte: 'Le chef se bat pour que les autres fuient. Il est bon. Tu es meilleur·e. Quand il tombe à genoux, les autres sont loin. Il lève les yeux : « Tu as gagné. Eux aussi. » Tu le ramènes vivant. Le reste du camp a disparu.', effets: [{ combatSur: ['taijutsu'] }, { stat: 'social.loyaute', delta: 3 }, { drapeau: 'deserteurs_herbe', valeur: 'chef_pris' }] },
          echec: { texte: 'Ils sont huit, et ils n’ont plus rien à perdre. Tu fuis dans les herbes, blessé·e. Ils ne te poursuivent pas.', effets: [{ blessure: { id: 'camp_herbe', nom: 'Blessures du camp', gravite: 2, jours: 30 } }] },
        },
      },
    ],
  },
];
