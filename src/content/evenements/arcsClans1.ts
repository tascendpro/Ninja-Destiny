import type { Condition, EventDef } from '../../engine/types';

/**
 * Les arcs de clan (1/3) : Uchiha, Hyūga, Nara, Yamanaka.
 * Chaque clan a une scène d'Académie et une épreuve décisive, parfois une suite : dialogue, choix, combat, conséquences.
 * Les techniques ne s'apprennent que si le pouvoir de base est assez avancé ; sinon, c'est lui qui progresse.
 */
const ACTIF: Condition = { statut: 'actif' };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

/** Une scène d'Académie de clan : une scène clé de la trame, entre 10 et 12 ans, une seule fois. */
export function academie(clan: string, ev: Omit<EventDef, 'chapitre' | 'arc' | 'si' | 'categorie'> & { si?: Condition[] }): EventDef {
  const { si, ...reste } = ev;
  return { chapitre: 1, chapitres: [1, 2], arc: 'formation', categorie: 'academie', priorite: 30, ...reste, si: { tout: [ACTIF, { clan }, { age: { min: 10, max: 12 } }, ...(si ?? [])] } };
}

/** Une épreuve décisive de clan : une scène clé de la trame, genin et plus, entre 15 et 22 ans, une seule fois. */
export function epreuve(clan: string, ev: Omit<EventDef, 'chapitre' | 'arc' | 'si' | 'categorie'> & { si?: Condition[]; categorie?: EventDef['categorie'] }): EventDef {
  const { si, ...reste } = ev;
  return {
    chapitre: 2,
    chapitres: [1, 2, 3, 4],
    arc: 'premieres_missions',
    categorie: 'mission',
    priorite: 25,
    ...reste,
    si: { tout: [ACTIF, { clan }, { rangMin: 'genin' }, { age: { min: 15, max: 22 } }, { blessureGrave: false }, ...(si ?? [])] },
  };
}

/** Une suite de clan, rappelée par un fil (effet « retour »). */
export function suite(ev: Omit<EventDef, 'chapitre' | 'arc' | 'enchaine'>): EventDef {
  return { chapitre: 2, chapitres: [1, 2, 3, 4, 5], arc: 'crise', enchaine: true, ...ev };
}

export const ARCS_CLANS_1: EventDef[] = [
  // ═══ UCHIHA ═══════════════════════════════════════════════════
  academie('uchiha', {
    id: 'cl_uchiha_academie',
    titre: 'L’œil qu’on attend',
    lieu: '$academie',
    personnages: ['@rival'],
    si: [RIVAL],
    texte: [
      { texte: 'Exercice de partage de chakra : deux élèves, paume contre paume, doivent équilibrer leurs flux sans que l’un écrase l’autre. L’instructeur t’a placé·e face à {@rival}. Toute la classe sait pourquoi : on veut voir si l’enfant Uchiha va enfin ouvrir les yeux.' },
      { texte: '{@rival} ne pose pas sa paume tout de suite. « Tu te crois supérieur·e parce que tu es né·e dans ce quartier-là ? Ton éventail rouge, il ne fait pas de toi un·e ninja. »' },
      { si: { clanPnj: '@rival', clan: 'uchiha' }, texte: 'Venant d’un autre Uchiha, la phrase sonne pire : c’est une phrase de famille.' },
    ],
    choix: [
      {
        id: 'froid',
        texte: '« Non. Mais toi, rien ne fera de toi un Uchiha. »',
        effets: [{ relation: '@rival', delta: { hostilite: 10, rivalite: 8 } }, { entrainer: 'genjutsu', jours: 20 }, { stat: 'attributs.controleEmotionnel', delta: -2 }, { stat: 'social.confianceClan', delta: 2 }],
        resultat: 'La classe retient son souffle. {@rival} pâlit, puis pose sa paume contre la tienne si fort que tes doigts craquent. Le flux de chakra qui passe entre vous n’a rien d’un équilibre : c’est une guerre. L’instructeur vous sépare au bout d’une minute. Le soir, ton père apprend la phrase et sourit. C’est le sourire qui te gêne.',
      },
      {
        id: 'apaiser',
        texte: '« Je n’ai rien choisi. On essaie juste l’exercice ? »',
        effets: [{ relation: '@rival', delta: { respect: 8, hostilite: -4 } }, { stat: 'social.reputation', delta: 2 }, { stat: 'attributs.controleChakra', delta: 2 }],
        resultat: '{@rival} hésite, puis pose sa paume. Le flux passe, maladroit, puis de plus en plus régulier. Vous tenez trois minutes, le meilleur temps de la classe. L’instructeur note quelque chose. Dans la tribune des parents, une tante du clan fronce les sourcils : un Uchiha ne fait pas équipe, il domine.',
      },
      {
        id: 'defier',
        texte: '« Sur le terrain, après la classe. Toi et moi. »',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { agilite: 1, perception: 2, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, sharingan: 2, nature_katon: 1 },
          succes: {
            texte: 'Le combat est rapide, sale, sans arbitre. {@rival} frappe, tu esquives, et au milieu de l’esquive le monde ralentit : tu vois son poing partir avant qu’il parte. Tu le cueilles d’un crochet. Quand {il:@rival} se relève, {il:@rival} fixe tes yeux et recule d’un pas.',
            effets: [
              { tenterEveil: 'sharingan', intensite: 25 },
              { relation: '@rival', delta: { rivalite: 10, respect: 6 } },
              { entrainer: 'taijutsu', jours: 15 },
              { drapeau: 'cl_uchiha_duel', valeur: 'gagne' },
            ],
          },
          echec: {
            texte: '{@rival} est plus rapide. Tu finis dans la poussière, le souffle coupé, et pendant une seconde, en {le:@rival} voyant lever le poing, tu as vraiment peur. Quelque chose brûle derrière tes paupières. Puis plus rien. Juste la honte.',
            effets: [{ tenterEveil: 'sharingan', intensite: 20 }, { stat: 'jauges.sante', delta: -8 }, { relation: '@rival', delta: { rivalite: 8 } }, { drapeau: 'cl_uchiha_duel', valeur: 'perdu' }],
          },
        },
      },
    ],
  }),
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'cl_uchiha_eveil_vu',
    titre: 'Ce que le quartier a vu',
    categorie: 'clan_rare',
    lieu: '$village',
    poids: 7,
    si: { tout: [ACTIF, { clan: 'uchiha' }, { maitrise: 'sharingan', eveille: true }, { age: { max: 16 } }] },
    texte: 'La nouvelle de tes yeux a fait le tour du quartier avant le dîner. Ce soir, ton père t’emmène au temple Naka, sous la septième natte, là où les Uchiha gardent une tablette que personne d’autre ne lit. « Ce qui est écrit là n’est pas pour les enfants. Tu n’es plus un enfant. »',
    choix: [
      {
        id: 'lire',
        texte: 'Lire la tablette',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'social.confianceClan', delta: 5 }, { secret: 'clan_guerre' }, { drapeau: 'tablette_naka' }],
        resultat: 'Ton œil déchiffre des lignes que l’œil nu ne voit pas. Une histoire de deux frères, d’un pouvoir qu’on n’obtient qu’en perdant ce qu’on aime, et d’un œil qui voit au-delà. Tu relèves la tête. Ton père te regarde comme un homme regarde un héritier, pour la première fois. Ça ne ressemble pas à de la tendresse.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : tu ne veux pas de ce genre d’héritage',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.confianceClan', delta: -4 }, { ethique: { compassion: 3 } }],
        resultat: 'Ton père ne dit rien pendant tout le chemin du retour. À la porte, seulement : « Le sang finit toujours par lire ce qu’il doit lire. » Tu dors mal. Mais tu dors.',
      },
    ],
  },
  epreuve('uchiha', {
    id: 'cl_uchiha_temple',
    titre: 'Le sanctuaire sous la cascade',
    categorie: 'clan_rare',
    lieu: 'temple_oublie',
    personnages: ['@coequipierA'],
    texte: [
      { texte: 'Une mission de reconnaissance mène ton équipe à un sanctuaire Uchiha abandonné, derrière une cascade, que les registres du clan ne mentionnent plus. Sur l’autel, un sceau fendu. Quand tu le touches, il se brise.' },
      { texte: 'Le monde bascule. Tu es ailleurs : un quartier en flammes, des corps sur les pavés, et au milieu, les visages de ceux que tu aimes. Une silhouette en armure ancienne, l’éventail dans le dos, se tient au-dessus des cendres. « Il est temps de montrer la force de notre sang. »' },
      { si: { drapeau: 'perte_tragique' }, texte: 'Parmi les morts de l’illusion, il y a un visage qui n’est pas une illusion. Tu l’as vraiment perdu. L’ancêtre le sait. Il appuie exactement là.' },
    ],
    choix: [
      {
        id: 'haine',
        texte: 'Laisser la haine monter : c’est la clé du sang',
        effets: [
          // Un œil encore endormi : c'est le Sharingan que la haine réveille. Le Mangekyō, lui, exige une vraie perte.
          { si: { maitrise: 'sharingan', eveille: false }, alors: [{ drapeau: 'temple_premier_oeil' }, { tenterEveil: 'sharingan', intensite: 40 }] },
          { tenterEveil: 'mangekyo', intensite: 45 },
          { ethique: { compassion: -6, ambition: 4 } },
          { stat: 'attributs.controleEmotionnel', delta: -4 },
          { drapeau: 'cl_uchiha_voie', valeur: 'haine' },
        ],
        suite: 'cl_uchiha_gardien',
        resultat: [
          { si: { tout: [{ drapeau: 'temple_premier_oeil' }, { maitrise: 'sharingan', eveille: true }] }, texte: 'Quelque chose se déchire derrière tes paupières. Quand tu les rouvres, le monde a ralenti : chaque flamme de l’illusion, chaque goutte de la cascade. Un tomoe tourne dans ton œil. Le Sharingan, enfin, né de la haine que l’ancêtre t’a tendue. Il sourit. « Le premier pas. Les autres coûteront plus cher. »' },
          { si: { tout: [{ drapeau: 'temple_premier_oeil' }, { maitrise: 'sharingan', eveille: false }] }, texte: 'La haine monte et ne trouve rien à ouvrir. Tes yeux restent noirs. L’ancêtre te regarde avec un mépris tranquille. « Même pas l’œil. Tu n’es Uchiha que de nom. » Tu ne sais pas si tu es humilié·e ou soulagé·e.' },
          { si: { maitrise: 'mangekyo', eveille: true }, texte: 'La douleur explose derrière tes yeux. Le motif de ton Sharingan se tord, s’étire, devient une forme que tu n’as jamais vue. Tu sens tes larmes couler, chaudes, et ce ne sont pas des larmes. L’ancêtre sourit. « Voilà. Maintenant, tu vois. »' },
          { si: { tout: [{ drapeau: 'temple_premier_oeil', absent: true }, { non: { maitrise: 'mangekyo', eveille: true } }] }, texte: 'La haine monte, brûle, et ne trouve rien à quoi s’accrocher. Ton œil frémit, saigne un peu, mais ne change pas. L’ancêtre secoue la tête. « Tu n’as pas encore assez perdu. Tu reviendras. » Tu espères de toutes tes forces que non.' },
        ],
      },
      {
        id: 'controle',
        texte: 'Tenir. Garder le contrôle, coûte que coûte',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { controleEmotionnel: 3, controleChakra: 1 },
          maitrises: { sharingan: 2 },
          succes: {
            texte: 'Tu fixes les flammes jusqu’à voir les coutures de l’illusion, ces endroits où le chakra de l’ancêtre se replie sur lui-même. Ton Sharingan tourne, et l’illusion se déchire comme du papier. L’ancêtre te regarde, et pour la première fois il semble respecter quelque chose. « Le contrôle. Rare, chez nous. » Il se dissout.',
            effets: [{ entrainer: 'sharingan', jours: 60 }, { stat: 'attributs.controleEmotionnel', delta: 4 }, { stat: 'social.confianceClan', delta: 4 }, { drapeau: 'cl_uchiha_voie', valeur: 'controle' }],
            suite: 'cl_uchiha_gardien',
          },
          echec: {
            texte: 'Tu tiens, longtemps, puis l’illusion te rattrape. Tu revis chaque mort deux fois. Quand tu reviens à toi, tu es à genoux devant l’autel, et {@coequipierA} te secoue en criant ton prénom.',
            effets: [{ stat: 'jauges.fatigue', delta: 25 }, { entrainer: 'sharingan', jours: 25 }, { drapeau: 'cl_uchiha_voie', valeur: 'controle' }],
            suite: 'cl_uchiha_gardien',
          },
        },
      },
      {
        id: 'paix',
        texte: 'Fermer les yeux, et laisser la douleur passer à travers toi',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 5 }, { ethique: { compassion: 6 } }, { stat: 'social.confianceClan', delta: -3 }, { drapeau: 'cl_uchiha_voie', valeur: 'paix' }],
        suite: 'cl_uchiha_gardien',
        resultat: 'Tu fermes les yeux. Tu laisses les images te traverser sans les retenir, comme l’eau de la cascade. L’ancêtre attend une colère qui ne vient pas. « Alors tu ne seras jamais ce que nous avons été. » Peut-être. Tu rouvres les yeux sur un autel vide, l’esprit plus clair qu’il ne l’a jamais été.',
      },
    ],
  }),
  suite({
    id: 'cl_uchiha_gardien',
    titre: 'Le gardien du sanctuaire',
    categorie: 'clan_rare',
    lieu: 'temple_oublie',
    si: ACTIF,
    texte: [
      { texte: 'Le sol tremble. Derrière l’autel, une statue de pierre se détache du mur : un gardien d’argile et de sceaux, laissé là par les anciens pour qu’aucun intrus ne reparte. Il marche vers vous.' },
      { si: { maitrise: 'mangekyo', eveille: true }, texte: 'Ton œil nouveau te brûle. Tu sais, sans savoir comment, ce qu’il peut faire.' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'L’affronter',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { agilite: 1, perception: 1, controleChakra: 1 },
          maitrises: { sharingan: 2, nature_katon: 2, mangekyo: 2, ninjutsu: 1 },
          manches: 3,
          allies: true,
          succes: {
            texte: [
              { si: { drapeau: 'mgk:amaterasu' }, texte: 'Tu fixes le gardien et quelque chose se déchire derrière ton œil. Des flammes noires naissent sur sa poitrine, lentes, silencieuses, et ne s’éteignent pas. Il brûle jusqu’à n’être plus que de la cendre qui fume encore. {@coequipierA} recule, livide : « C’était quoi, ça ? » Tu ne réponds pas. Tu ne sais pas encore.' },
              { si: { drapeau: 'mgk:tsukuyomi' }, texte: 'Tu croises les orbites vides du gardien. Pendant une fraction de seconde, il vit trois jours dans ton monde. Quand tu le relâches, ses sceaux se sont effacés d’eux-mêmes. Il s’effondre en poussière. {@coequipierA} n’a rien vu, que ton œil qui saigne.' },
              { si: { non: { un: [{ drapeau: 'mgk:amaterasu' }, { drapeau: 'mgk:tsukuyomi' }] } }, texte: 'Ton Sharingan lit chacun de ses gestes une demi-seconde avant lui. Tu esquives, tu tisses les signes, et la grande boule de feu des Uchiha frappe le gardien de plein fouet, puis une deuxième. La pierre éclate. Les sceaux s’éteignent un par un. {@coequipierA} siffle entre ses dents : « Rappelle-moi de ne jamais t’énerver. »' },
            ],
            effets: [{ entrainer: 'nature_katon', jours: 30 }, { stat: 'attributs.force', delta: 2 }, { stat: 'social.confianceClan', delta: 4 }, { secret: 'clan_guerre' }],
          },
          partiel: {
            texte: 'Tu brises un de ses bras, il te brise deux côtes. Vous fuyez le sanctuaire en le laissant intact derrière vous, la cascade refermée sur ses pas lourds.',
            effets: [{ blessure: { id: 'gardien_naka', nom: 'Côtes brisées par le gardien', gravite: 2, jours: 35 } }, { entrainer: 'sharingan', jours: 20 }],
          },
          echec: {
            texte: 'Il est trop fort, trop lourd, trop ancien. {@coequipierA} te tire hors du sanctuaire au dernier moment, toi à moitié inconscient·e. La cascade se referme. Le sanctuaire garde ses secrets.',
            effets: [{ blessure: { id: 'gardien_naka', nom: 'Écrasé·e par le gardien', gravite: 3, jours: 60 } }, { relation: '@coequipierA', delta: { attachement: 6 } }],
          },
        },
      },
      {
        id: 'fuir',
        texte: 'Ordonner le repli et refermer la cascade',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { relation: '@coequipierA', delta: { confiance: 4 } }],
        resultat: 'Vous sortez avant qu’il atteigne l’autel. Il s’arrête au bord de l’eau, comme s’il ne pouvait pas la traverser. Tu notes l’emplacement dans ta mémoire. Un jour, tu reviendras, plus fort·e. Ou pas.',
      },
    ],
  }),

  // ═══ HYŪGA ════════════════════════════════════════════════════
  academie('hyuga', {
    id: 'cl_hyuga_academie',
    titre: 'L’examen de perception',
    lieu: '$academie',
    texte: [
      { texte: 'Examen de perception : dix objets cachés dans la salle, sous des planches, dans les murs, derrière un genjutsu léger. Il faut les trouver en une heure. Tout le monde se tourne vers toi avant même le début. Avec le Byakugan, ce serait l’affaire d’une minute.' },
      { texte: 'Juni, fils d’un archiviste sans clan, première place en théorie depuis trois ans, se plante devant ton pupitre. « Le Byakugan n’est pas une excuse pour tricher, Hyūga. Fais-le avec tes yeux, les vrais, ou ne le fais pas. »' },
    ],
    choix: [
      {
        id: 'tricher',
        texte: 'Ouvrir le Byakugan, juste un instant, quand personne ne regarde',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { discretion: 2, controleChakra: 1 },
          maitrises: { byakugan: 2 },
          succes: { texte: 'Les veines autour de tes yeux se gonflent une demi-seconde. Tu vois tout : les dix objets, et un onzième que l’instructeur ignorait. Tu les trouves un à un, sans hâte, pour ne pas éveiller les soupçons. Premier·e. Juni te fixe. Il ne peut rien prouver. Il sait.', effets: [{ entrainer: 'byakugan', jours: 20 }, { stat: 'attributs.perception', delta: 1 }, { ethique: { honneur: -4 } }, { drapeau: 'cl_hyuga_juni', valeur: 'ennemi' }, { stat: 'social.suspicion', delta: 2 }] },
          echec: { texte: 'L’instructeur te voit. Il ne dit rien devant la classe. Il note seulement, sur ta copie : « Zéro. Le clan sera informé. » Le soir, un ancien de la branche principale te convoque.', effets: [{ stat: 'social.confianceClan', delta: -6 }, { ethique: { honneur: -2 } }, { drapeau: 'cl_hyuga_juni', valeur: 'ennemi' }] },
        },
      },
      {
        id: 'honnete',
        texte: 'Garder les yeux fermés au Byakugan, et chercher comme les autres',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { perception: 3, intellect: 1 },
          succes: { texte: 'Tu cherches avec tes mains, ta logique, ton oreille. Huit objets sur dix. Juni en trouve neuf. Mais quand l’instructeur annonce les résultats, il ajoute : « Et un élève Hyūga qui n’a pas utilisé ses yeux. Ça vaut plus que la première place. » Juni te regarde, cette fois, sans mépris.', effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.controleChakra', delta: 2 }, { ethique: { honneur: 5 } }, { drapeau: 'cl_hyuga_juni', valeur: 'ami' }, { stat: 'social.reputation', delta: 3 }] },
          echec: { texte: 'Cinq objets sur dix. Ton pire résultat. Juni hausse les sourcils. « Je retire. Tu n’as pas triché. Tu es juste mauvais·e sans tes yeux. » C’est presque un compliment. Tu travailles toute la nuit.', effets: [{ stat: 'attributs.perception', delta: 2 }, { ethique: { honneur: 3 } }, { drapeau: 'cl_hyuga_juni', valeur: 'rival' }] },
        },
      },
      {
        id: 'demonstration',
        texte: '« Tu veux voir ce que ces yeux font ? Terrain. Maintenant. »',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { agilite: 2, perception: 1, controleChakra: 1 },
          maitrises: { juken: 2, byakugan: 2 },
          succes: {
            texte: 'Juni frappe en premier. Ton Byakugan s’ouvre et son corps devient un réseau de points lumineux, cent soixante-quatre portes de chakra. Tu esquives en pivotant, ta paume effleure son épaule, son bras retombe, inerte. Une deuxième paume sur sa hanche, et il est à genoux. Personne n’applaudit. Tout le monde a vu que ce n’était pas un jeu.',
            effets: [{ entrainer: 'juken', jours: 30 }, { stat: 'social.reputationOmbre', delta: 3 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'cl_hyuga_juni', valeur: 'rival' }, { relation: '@rival', delta: { rivalite: 4 } }],
          },
          echec: {
            texte: 'Juni ne te laisse pas le temps d’ouvrir tes yeux. Il connaît la théorie du Jūken mieux que toi, et ses angles morts aussi. Il frappe exactement derrière ta nuque, là où le Byakugan ne voit pas. Tu tombes. « Soixante-douze degrés, dit-il. Tout le monde le sait. Sauf vous. »',
            effets: [{ stat: 'jauges.sante', delta: -6 }, { stat: 'attributs.perception', delta: 2 }, { drapeau: 'cl_hyuga_juni', valeur: 'rival' }, { indice: 'angle_mort_byakugan' }],
          },
        },
      },
    ],
  }),
  epreuve('hyuga', {
    id: 'cl_hyuga_espion',
    titre: 'Le prisonnier des Hyūga',
    lieu: '$village',
    texte: [
      { texte: 'Un espion a été pris en train de cartographier le domaine Hyūga. Le conseil du clan te charge de l’interroger, sous Byakugan, dans la salle sans fenêtre. Un jeune homme maigre, attaché à une chaise. Il te sourit.' },
      { texte: '« Je connais un secret de ta famille bien plus grand que tes yeux. Qui a posé le premier sceau. Et pourquoi. »' },
    ],
    choix: [
      {
        id: 'douce',
        texte: 'Le laisser parler, longtemps, sans le brusquer',
        effets: [{ stat: 'attributs.intellect', delta: 3 }, { stat: 'attributs.perception', delta: 1 }, { drapeau: 'cl_hyuga_espion', valeur: 'parle' }, { retour: 'cl_hyuga_secret', chance: 1, entre: [30, 120] }],
        suite: 'cl_hyuga_evasion',
        resultat: 'Il parle pendant trois heures. Des noms, des dates, une archive qu’il dit cachée dans le temple du clan. Ton Byakugan surveille ses flux : il ne ment pas. Pas tout le temps. Puis, au milieu d’une phrase, il cesse de sourire. Ses mains se libèrent de la corde. Elles n’étaient pas vraiment liées.',
      },
      {
        id: 'force',
        texte: 'Le Jūken : quelques points fermés, et il parlera',
        effets: [{ entrainer: 'juken', jours: 20 }, { stat: 'attributs.force', delta: 1 }, { ethique: { compassion: -5 } }, { stat: 'social.reputation', delta: -2 }, { drapeau: 'cl_hyuga_espion', valeur: 'force' }],
        suite: 'cl_hyuga_evasion',
        resultat: 'Deux doigts sous la clavicule, deux sur le flanc. Il hurle. Il ne parle pas. Il te regarde avec une haine tranquille, puis il sourit encore : « Tu frappes exactement comme eux. » Derrière lui, quelque chose cliquette. Un sceau explosif, cousu dans la doublure de sa veste.',
      },
      {
        id: 'ignorer',
        texte: 'Ne pas mordre à l’hameçon : rendre le prisonnier au conseil',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.confianceClan', delta: 3 }, { drapeau: 'cl_hyuga_espion', valeur: 'rendu' }, { retour: 'cl_hyuga_secret', chance: 0.5, entre: [300, 700] }],
        resultat: 'Tu te lèves et tu sors. Derrière toi, il rit. Le conseil prend le prisonnier en charge. Le lendemain, on t’annonce qu’il est « mort de ses blessures ». Il n’avait aucune blessure. Tu ne poses pas de question. C’est peut-être la vraie leçon du jour.',
      },
    ],
  }),
  suite({
    id: 'cl_hyuga_evasion',
    titre: 'Le sceau dans la doublure',
    categorie: 'mission',
    lieu: '$village',
    si: ACTIF,
    texte: 'Le sceau explose. La salle s’emplit de fumée et de flammes. Quand elle se dissipe, la chaise est vide et la porte arrachée. Ton Byakugan le trouve déjà sur les toits, qui court vers le mur d’enceinte, dix pièges incendiaires semés derrière lui.',
    choix: [
      {
        id: 'poursuivre',
        texte: 'Le poursuivre sur les toits',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { byakugan: 2, juken: 2 },
          manches: 2,
          succes: {
            texte: 'Ton Byakugan voit les pièges à travers les tuiles, les fils tendus, les sceaux encore tièdes. Tu les franchis sans en toucher un. Sur le dernier toit, il se retourne pour lancer une dernière boule de feu. Tu pivotes, le chakra jaillit de chacun de tes points, et la flamme se brise sur une sphère tournoyante. Puis tes paumes : deux, quatre, huit, seize, trente-deux, soixante-quatre. Il tombe, chacun de ses points fermé.',
            effets: [
              { si: { tout: [{ maitrise: 'juken', palierMin: 3 }, { maitrise: 'byakugan', palierMin: 2 }] }, alors: [{ apprendre: 'hyuga_kaiten', source: 'clan' }], sinon: [{ entrainer: 'juken', jours: 40 }] },
              { stat: 'social.confianceClan', delta: 8 },
              { stat: 'social.reputation', delta: 5 },
              { drapeau: 'cl_hyuga_espion_pris' },
            ],
          },
          echec: {
            texte: 'Un piège te prend la cheville en plein saut. Tu tombes, les flammes lèchent ta jambe. Quand tu te relèves, il a passé le mur. Ton Byakugan le suit jusqu’à la limite de sa portée, puis plus rien.',
            effets: [{ blessure: { id: 'piege_katon', nom: 'Brûlure de piège', gravite: 2, jours: 25 } }, { stat: 'social.confianceClan', delta: -5 }, { retour: 'cl_hyuga_secret', chance: 0.6, entre: [400, 900] }],
          },
        },
      },
      {
        id: 'alerter',
        texte: 'Donner l’alerte et protéger le domaine',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Les cloches sonnent. Les gardes du clan bouclent le mur. On ne le retrouve pas, mais rien n’a été volé. Le chef du clan te félicite d’un mot sec. Tu penses à l’archive dont il parlait, et tu te demandes s’il est vraiment venu pour voler, ou pour qu’on l’entende.',
      },
    ],
  }),
  suite({
    id: 'cl_hyuga_secret',
    titre: 'L’archive du temple',
    categorie: 'secret_familial',
    lieu: '$village',
    si: { tout: [ACTIF, { clan: 'hyuga' }] },
    texte: 'Tu n’as jamais oublié ce que disait le prisonnier. Une nuit sans lune, tu descends dans les réserves du temple du clan. Derrière le troisième pilier, une niche scellée, exactement là où il l’avait dit. Dedans, un rouleau ancien, signé d’un nom effacé.',
    choix: [
      {
        id: 'lire',
        texte: 'Ouvrir le rouleau',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { indice: 'origine_sceau_hyuga' }, { stat: 'social.confianceClan', delta: -3 }, { ethique: { honneur: -2 } }],
        resultat: 'Le premier sceau de la branche secondaire n’a pas été posé pour protéger le Byakugan. Il a été posé après une guerre entre deux frères, par celui qui avait gagné, sur les enfants de celui qui avait perdu. Tout le reste est venu après, pour justifier. Tu remets le rouleau à sa place. Tu ne regarderas plus jamais un front scellé sans y penser.',
      },
      {
        id: 'bruler',
        texte: 'Le brûler sans le lire',
        effets: [{ stat: 'social.confianceClan', delta: 4 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Le rouleau flambe d’un coup, comme s’il n’attendait que ça. Tu ne sauras jamais. Le clan non plus. Tu te demandes si c’est de la loyauté ou de la lâcheté, et tu n’arrives pas à trancher.',
      },
    ],
  }),

  // ═══ NARA ═════════════════════════════════════════════════════
  academie('nara', {
    id: 'cl_nara_academie',
    titre: 'Le drapeau de la forêt',
    lieu: 'foret_feu',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: 'Exercice de capture du drapeau, en forêt : ton équipe contre celle d’une héritière Yamanaka, Ino-ka, qui a déjà promis à toute la classe qu’elle « lirait dans vos têtes comme dans un livre ». Tu es désigné·e chef d’équipe. Le soleil est haut. Les ombres sont courtes.' },
      { texte: '{@coequipierA} trépigne déjà : « On y va maintenant, sans réfléchir ! Le temps qu’on fasse un plan, elles auront fini ! »' },
    ],
    choix: [
      {
        id: 'plan',
        texte: 'Attendre que le soleil baisse : les ombres s’allongent, et toi avec',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { intellect: 2, perception: 1 },
          maitrises: { kagemane: 3 },
          allies: true,
          succes: {
            texte: 'Une heure d’attente, {@coequipierA} qui râle, puis le soleil passe sous la cime des cèdres. Ton ombre s’étire sur cinquante pas. Elle rampe sous les fougères, touche celle de la gardienne du drapeau, et la fige au milieu d’un bâillement. Ino-ka tente d’entrer dans ta tête. Elle trouve un plan à trois étages, et recule. Vous rentrez avec le drapeau sans avoir donné un seul coup.',
            effets: [{ entrainer: 'kagemane', jours: 30 }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'attributs.agilite', delta: -1 }, { relation: '@coequipierA', delta: { respect: 8 } }, { drapeau: 'cl_nara_yamanaka', valeur: 'alliee' }],
          },
          echec: {
            texte: 'Tu attends trop. Quand ton ombre est assez longue, l’équipe adverse a déjà pris votre drapeau, en passant par là où tu ne regardais pas. « Un bon plan, dit l’instructeur. Pour une autre bataille. »',
            effets: [{ stat: 'attributs.intellect', delta: 1 }, { relation: '@coequipierA', delta: { confiance: -4 } }, { drapeau: 'cl_nara_yamanaka', valeur: 'rivale' }],
          },
        },
      },
      {
        id: 'charge',
        texte: 'Suivre {@coequipierA}, et foncer',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { force: 2, agilite: 1 },
          maitrises: { taijutsu: 2 },
          allies: true,
          succes: { texte: 'Vous déboulez entre les arbres en hurlant. Personne ne s’y attendait, venant d’un Nara. La gardienne lâche le drapeau de surprise. {@coequipierA} le brandit en riant comme un fou. L’instructeur, lui, ne rit pas : « Ça a marché. Ça ne marchera qu’une fois. »', effets: [{ stat: 'attributs.force', delta: 2 }, { relation: '@coequipierA', delta: { amitie: 8 } }, { drapeau: 'cl_nara_yamanaka', valeur: 'rivale' }] },
          echec: { texte: 'Ino-ka vous voit arriver depuis l’esprit d’un écureuil. Vous tombez dans un piège à fosse, l’un après l’autre. {@coequipierA} rit quand même, de la terre plein la bouche.', effets: [{ stat: 'jauges.sante', delta: -5 }, { relation: '@coequipierA', delta: { amitie: 5 } }, { drapeau: 'cl_nara_yamanaka', valeur: 'rivale' }] },
        },
      },
      {
        id: 'ruse',
        texte: 'Leur faire croire que vous avez déjà abandonné',
        effets: [{ stat: 'attributs.discretion', delta: 3 }, { stat: 'attributs.intellect', delta: 1 }, { relation: '@coequipierA', delta: { amitie: 4, respect: 4 } }, { drapeau: 'cl_nara_yamanaka', valeur: 'alliee' }],
        resultat: 'Vous vous allongez dans la clairière, bien en vue, à regarder les nuages. L’équipe adverse, persuadée que les Nara font la sieste, laisse un seul garde au drapeau. {@coequipierA} le prend pendant que tu bâilles. Ino-ka vient te voir après, furieuse puis hilare. « Vous êtes impossibles, vous. Refaites équipe avec nous, la prochaine fois. »',
      },
    ],
  }),
  epreuve('nara', {
    id: 'cl_nara_embuscade',
    titre: 'Les ombres qui ne sont pas les tiennes',
    lieu: 'foret_feu',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: 'Mission d’escorte au crépuscule. Au milieu de la forêt, ton équipe s’arrête net : {@coequipierA} vient de lâcher son arme. {Il:@coequipierA} fixe un point dans le vide, les yeux révulsés. Un genjutsu. Autour de vous, des silhouettes se dessinent entre les troncs : des clones d’ombre, au moins une dizaine.' },
      { texte: '{@coequipierA} se retourne vers toi, kunai levé, la voix de quelqu’un d’autre dans la bouche : « Ferme les yeux… Laisse-toi aller dans les ténèbres… »' },
    ],
    choix: [
      {
        id: 'frontal',
        texte: 'Briser le cercle de clones à la force',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { force: 2, agilite: 1 },
          maitrises: { taijutsu: 2, kagemane: 1 },
          letal: true,
          causeMort: 'pris·e dans une embuscade d’ombres, en forêt',
          succes: { texte: 'Tu fonces dans le cercle et les clones éclatent en fumée un à un. Le dernier était le vrai. Il tombe, et le genjutsu sur {@coequipierA} se brise net. {Il:@coequipierA} cligne des yeux, regarde le kunai dans sa main, et le lâche en tremblant.', effets: [{ stat: 'attributs.force', delta: 3 }, { stat: 'attributs.discretion', delta: -1 }, { relation: '@coequipierA', delta: { attachement: 6 } }] },
          echec: { texte: 'Il y a trop de clones, et le vrai n’est jamais là où tu frappes. {@coequipierA} t’entaille l’épaule avant que le genjutsu ne se dissipe de lui-même, au lever de la lune.', effets: [{ blessure: { id: 'ombres_foret', nom: 'Entaille de l’embuscade', gravite: 2, jours: 25 } }, { relation: '@coequipierA', delta: { attachement: 3 } }] },
        },
      },
      {
        id: 'source',
        texte: 'Chercher la source : un genjutsu a toujours un lanceur caché',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { intellect: 2, perception: 2 },
          maitrises: { kagemane: 2, genjutsu: 1 },
          succes: {
            texte: 'Tu ignores les clones. Tu regardes les ombres, celles qui ne bougent pas comme elles devraient. L’une d’elles est trop dense : il y a quelqu’un dedans. Ton ombre file sur le sol, s’enroule autour de la sienne et la fige. Puis elle remonte le long de son corps, lentement, jusqu’à sa gorge. Les clones s’éteignent tous en même temps. {@coequipierA} s’effondre dans tes bras, {lui:@coequipierA} enfin.',
            effets: [
              { si: { maitrise: 'kagemane', palierMin: 2 }, alors: [{ apprendre: 'nara_kubi', source: 'clan' }], sinon: [{ entrainer: 'kagemane', jours: 45 }] },
              { stat: 'attributs.intellect', delta: 3 },
              { stat: 'social.confianceClan', delta: 5 },
              { relation: '@coequipierA', delta: { confiance: 8, attachement: 4 } },
              { drapeau: 'cl_nara_chef_pris' },
            ],
          },
          echec: { texte: 'Tu trouves la mauvaise ombre. Le vrai lanceur s’échappe en riant, et l’escorte perd une charrette. {@coequipierA} se réveille sans se souvenir de rien.', effets: [{ stat: 'attributs.intellect', delta: 1 }, { retour: 'cl_nara_revanche', chance: 0.7, entre: [200, 500] }] },
        },
      },
      {
        id: 'calmer',
        texte: 'Parler à {@coequipierA}, doucement, jusqu’à ce qu’{il:@coequipierA} t’entende',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: { texte: 'Tu ne lèves pas ton arme. Tu lui parles de la forêt des cerfs, de vos bêtises d’Académie, de ton prénom et du sien. Le kunai tremble, puis baisse. Les yeux de {@coequipierA} reviennent. Le lanceur, déstabilisé, se trahit en bougeant : vos coéquipiers le cueillent.', effets: [{ entrainer: 'genjutsu', jours: 15 }, { relation: '@coequipierA', delta: { attachement: 10, confiance: 6 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }] },
          echec: { texte: '{@coequipierA} ne t’entend pas. Tu dois l’assommer toi-même pour qu’{il:@coequipierA} cesse de te frapper. L’ennemi a filé avec une charrette.', effets: [{ stat: 'jauges.sante', delta: -10 }, { retour: 'cl_nara_revanche', chance: 0.7, entre: [200, 500] }] },
        },
      },
    ],
  }),
  suite({
    id: 'cl_nara_revanche',
    titre: 'Le maître des ombres revient',
    categorie: 'mission',
    lieu: 'foret_feu',
    si: { tout: [ACTIF, { clan: 'nara' }] },
    texte: 'Un message cloué à ta porte, à la pointe d’un kunai : « Ton ombre est plus courte que la mienne. Ce soir, clairière des cerfs. » Le lanceur de genjutsu de la forêt. Il t’a cherché·e. Il vient finir.',
    choix: [
      {
        id: 'nuit',
        texte: 'Y aller à la tombée de la nuit, quand toutes les ombres sont une seule',
        test: {
          type: 'combat',
          difficulte: 60,
          attributs: { intellect: 2, perception: 1, controleChakra: 1 },
          maitrises: { kagemane: 3 },
          letal: true,
          causeMort: 'tué·e par un maître du genjutsu, dans la clairière des cerfs',
          succes: { texte: 'La nuit tombe et la forêt entière devient ton ombre. Il comprend trop tard qu’il a choisi le pire moment pour affronter un Nara. Ton ombre le prend aux chevilles, aux poignets, à la gorge, et ne le lâche qu’au matin, quand la patrouille arrive.', effets: [{ entrainer: 'kagemane', jours: 50 }, { stat: 'social.confianceClan', delta: 6 }, { stat: 'social.reputation', delta: 4 }] },
          echec: { texte: 'Il connaissait ton plan. Il a placé des lanternes autour de la clairière. Ton ombre ne t’obéit plus, chassée par la lumière. Tu t’échappes, brûlé·e par sa dernière technique.', effets: [{ blessure: { id: 'clairiere_ombres', nom: 'Brûlures de la clairière', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'clan',
        texte: 'Prévenir le chef du clan : on ne règle pas ça seul·e',
        effets: [{ stat: 'social.confianceClan', delta: 4 }, { stat: 'attributs.intellect', delta: 2 }],
        resultat: 'Le chef du clan lit le message, bâille, et convoque quatre Nara. Ils se couchent dans l’herbe autour de la clairière, comme pour une sieste. L’homme ne repart pas. Personne n’a eu à transpirer. « La paresse, te dit le chef, c’est l’art de ne faire que ce qui sert. »',
      },
    ],
  }),

  // ═══ YAMANAKA ═════════════════════════════════════════════════
  academie('yamanaka', {
    id: 'cl_yamanaka_academie',
    titre: 'L’épreuve du binôme',
    lieu: '$academie',
    personnages: ['@coequipierB'],
    si: [{ pnj: '@coequipierB', etat: ['vivant', 'blesse'] }],
    texte: [
      { texte: 'Épreuve de coopération : les binômes doivent traverser un parcours en ne communiquant que par gestes. Ton binôme : {@coequipierB}. À mi-parcours, l’instructeur déclenche un genjutsu d’essai sur {@coequipierB}, pour voir comment tu réagis.' },
      { texte: 'Le genjutsu tourne mal. {@coequipierB} se met à hurler, se jette sur l’instructeur, kunai en main : « Sa tête va exploser ! Il faut l’arrêter ! »' },
    ],
    choix: [
      {
        id: 'esprit',
        texte: 'Entrer dans son esprit et l’arrêter de l’intérieur',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          maitrises: { shintenshin: 3 },
          succes: {
            texte: 'Tes mains forment le cadre, ton esprit quitte ton corps et plonge. Dans la tête de {@coequipierB}, tout est rouge, et l’instructeur y a la forme d’un démon. Tu attrapes la peur à pleines mains et tu la retournes. Quand tu reviens dans ton corps, {@coequipierB} est à genoux, le kunai par terre, et l’instructeur te regarde avec quelque chose qui ressemble à du respect, et à de l’inquiétude.',
            effets: [{ entrainer: 'shintenshin', jours: 35 }, { relation: '@coequipierB', delta: { confiance: 8, attachement: 4 } }, { stat: 'attributs.agilite', delta: -1 }, { stat: 'social.confianceClan', delta: 3 }],
          },
          echec: { texte: 'Ton esprit rate sa cible et entre dans un pigeon perché sur le toit. Le temps de revenir, deux instructeurs ont maîtrisé {@coequipierB}. On rira de toi pendant un mois. Pas méchamment. Presque.', effets: [{ stat: 'attributs.controleChakra', delta: 1 }, { stat: 'social.reputation', delta: -1 }] },
        },
      },
      {
        id: 'parler',
        texte: 'Lui parler, et lui faire voir l’instructeur tel qu’il est',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { stat: 'attributs.intellect', delta: 2 }, { relation: '@coequipierB', delta: { amitie: 6 } }],
        resultat: 'Tu te places entre eux, mains ouvertes. Tu décris le visage de l’instructeur, détail par détail, son nez cassé, sa cicatrice au menton, jusqu’à ce que {@coequipierB} cligne des yeux et le voie vraiment. Le kunai tombe. L’instructeur dissipe le genjutsu, livide : « Ce n’était pas censé aller aussi loin. Merci. »',
      },
      {
        id: 'frapper',
        texte: 'Plaquer {@coequipierB} au sol avant qu’il ne soit trop tard',
        test: {
          type: 'combat',
          difficulte: 44,
          attributs: { force: 2, agilite: 1 },
          maitrises: { taijutsu: 2 },
          succes: { texte: 'Tu {le:@coequipierB} ceintures et vous roulez dans la poussière. Le kunai vole. L’instructeur est sauf. {@coequipierB}, revenu{e:@coequipierB} à soi, te regarde avec un air trahi, comme si c’était toi qui avais frappé en premier.', effets: [{ stat: 'attributs.force', delta: 3 }, { relation: '@coequipierB', delta: { confiance: -6 } }] },
          echec: { texte: '{@coequipierB} t’esquive avec une agilité qu’{il:@coequipierB} n’a pas d’habitude. Ce sont deux instructeurs qui l’arrêtent. Toi, tu as une coupure au bras et beaucoup de questions.', effets: [{ stat: 'jauges.sante', delta: -6 }, { relation: '@coequipierB', delta: { confiance: -3 } }] },
        },
      },
    ],
  }),
  epreuve('yamanaka', {
    id: 'cl_yamanaka_interrogatoire',
    titre: 'Ce que le prisonnier tait',
    lieu: '$village',
    categorie: 'mission',
    texte: [
      { texte: 'Salle d’interrogatoire. Un ninja ennemi capturé sait où son maître a caché un rouleau de technique interdite. Le service de renseignement t’ordonne d’entrer dans sa tête. Il te voit arriver, voit les fleurs brodées sur ta veste, et comprend.' },
      { texte: '« Jamais je ne trahirai mon maître. Entre, si tu veux. Tu verras des choses que tu ne pourras plus jamais oublier. »' },
    ],
    choix: [
      {
        id: 'entrer',
        texte: 'Entrer dans son esprit, de force',
        effets: [{ entrainer: 'shintenshin', jours: 30 }, { stat: 'attributs.controleChakra', delta: 2 }, { ethique: { compassion: -5 } }, { stat: 'attributs.controleEmotionnel', delta: -2 }, { drapeau: 'cl_yamanaka_prisonnier', valeur: 'viole' }],
        suite: 'cl_yamanaka_assassin',
        resultat: 'Tu entres. Il avait raison. Une enfance dans un village brûlé, un maître qui l’a ramassé dans les cendres, des nuits de torture d’entraînement, et au fond, sous une pierre, l’emplacement du rouleau. Tu ressors avec l’information et avec ses souvenirs collés à tes propres pensées. Ils mettront des semaines à partir.',
      },
      {
        id: 'menacer',
        texte: 'Le menacer de ce que tu pourrais lui faire, sans le faire',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'social.reputationOmbre', delta: 3 }, { drapeau: 'cl_yamanaka_prisonnier', valeur: 'menace' }],
        suite: 'cl_yamanaka_assassin',
        resultat: 'Tu lui décris, calmement, ce qu’on peut faire d’un esprit quand on y entre sans précaution. Les souvenirs qu’on efface, ceux qu’on ajoute. Il blêmit, et lâche un demi-aveu : une vallée, un sanctuaire, sans plus. Juste assez. Juste pas tout.',
      },
      {
        id: 'confiance',
        texte: 'Lui parler. Simplement. Comme à quelqu’un',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { charisme: 3, perception: 1 },
          succes: { texte: 'Tu ne cherches pas l’information. Tu lui demandes son nom, son village, ce qu’il mangeait enfant. Au bout de deux heures, c’est lui qui parle du rouleau, sans que tu aies posé la question. « Ton maître t’a laissé·e ici, dis-tu doucement. Pas toi. » Il pleure. Tu ne sais pas si tu as gagné quelque chose ou volé quelque chose.', effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 5 } }, { drapeau: 'cl_yamanaka_prisonnier', valeur: 'confiance' }, { retour: 'cl_yamanaka_allie', chance: 0.7, entre: [300, 700] }], suite: 'cl_yamanaka_assassin' },
          echec: { texte: 'Il te regarde avec mépris. « Tu crois que c’est la première fois qu’on me fait le coup du gentil ? » Tu repars sans rien. On envoie quelqu’un d’autre.', effets: [{ stat: 'attributs.charisme', delta: 1 }, { drapeau: 'cl_yamanaka_prisonnier', valeur: 'echec' }] },
        },
      },
    ],
  }),
  suite({
    id: 'cl_yamanaka_assassin',
    titre: 'L’assassin dans le couloir',
    categorie: 'mission',
    lieu: '$village',
    si: ACTIF,
    texte: 'Le soir même, une ombre se glisse dans le couloir des cellules : un fidèle du même maître, venu faire taire le prisonnier pour toujours. Les gardes dorment, endormis par un poison. Tu es la seule personne réveillée à cet étage.',
    choix: [
      {
        id: 'esprit',
        texte: 'Laisser ton corps et prendre le sien',
        test: {
          type: 'combat',
          difficulte: 56,
          attributs: { controleChakra: 2, perception: 1, controleEmotionnel: 1 },
          maitrises: { shintenshin: 3, genjutsu: 1 },
          succes: {
            texte: 'Ton corps s’effondre contre le mur. Ton esprit file dans le couloir et frappe le sien de plein fouet. Pendant trois secondes, c’est toi qui tiens son couteau. Tu le retournes, tu lui fais lâcher l’arme, tu le fais s’agenouiller. Puis, pour la première fois, tu essaies quelque chose que tu as seulement lu : tu brouilles ses pensées en sortant. Il reste là, hagard, incapable de se souvenir de ce qu’il est venu faire.',
            effets: [
              { si: { maitrise: 'shintenshin', palierMin: 2 }, alors: [{ apprendre: 'yamanaka_shinranshin', source: 'clan' }], sinon: [{ entrainer: 'shintenshin', jours: 45 }] },
              { stat: 'social.confianceClan', delta: 6 },
              { stat: 'social.reputation', delta: 4 },
            ],
          },
          echec: { texte: 'Ton esprit rate de peu. Ton corps, laissé sans défense, prend un coup de couteau dans le flanc avant que tu réintègres. Le prisonnier survit. Toi aussi, de justesse.', effets: [{ blessure: { id: 'couteau_couloir', nom: 'Coup de couteau', gravite: 2, jours: 35 } }] },
        },
      },
      {
        id: 'cri',
        texte: 'Crier, et réveiller tout l’étage',
        effets: [{ stat: 'social.loyaute', delta: 2 }, { stat: 'attributs.perception', delta: 1 }],
        resultat: 'Ton cri déchire le silence. L’assassin hésite une seconde de trop : un garde à peine réveillé le plaque au sol. Le prisonnier, derrière ses barreaux, te regarde. Il a compris que tu viens de lui sauver la vie.',
      },
    ],
  }),
  suite({
    id: 'cl_yamanaka_allie',
    titre: 'Une lettre sans signature',
    categorie: 'organisation',
    lieu: '$maison',
    si: { tout: [ACTIF, { clan: 'yamanaka' }] },
    texte: 'Une lettre glissée sous ta porte, sans signature. Une écriture que tu reconnais : celle des aveux du prisonnier. Il a été échangé contre des otages la saison dernière. « Mon maître prépare quelque chose contre ton village. Tu m’as parlé comme à quelqu’un. Je te dois ça. » Suivent un lieu, une date, un nom.',
    choix: [
      {
        id: 'transmettre',
        texte: 'Transmettre au renseignement',
        effets: [{ stat: 'social.loyaute', delta: 5 }, { stat: 'social.reputation', delta: 5 }, { indice: 'complot_maitre' }],
        resultat: 'Le renseignement vérifie. Tout est vrai. Une attaque est déjouée avant même d’avoir commencé. Ton nom n’apparaît nulle part. Celui du prisonnier non plus. C’est mieux ainsi, pour vous deux.',
      },
      {
        id: 'repondre',
        texte: 'Lui répondre, pour garder le contact',
        effets: [{ stat: 'social.reputationOmbre', delta: 4 }, { stat: 'attributs.intellect', delta: 2 }, { indice: 'complot_maitre' }, { drapeau: 'informateur_yamanaka' }],
        resultat: 'Tu réponds par le même chemin, sans signer non plus. Pendant des années, des lettres arriveront, irrégulières, toujours exactes. Un ennemi qui ne l’est plus tout à fait. C’est ce que ton clan appelle « cultiver une fleur rare ».',
      },
    ],
  }),
];
