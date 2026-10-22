import type { Condition, EventDef } from '../../engine/types';
import { academie, epreuve, suite } from './arcsClans1';

/** Les arcs de clan (2/3) : Akimichi, Aburame, Inuzuka, Senju, Uzumaki. */
const ACTIF: Condition = { statut: 'actif' };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const B: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };

export const ARCS_CLANS_2: EventDef[] = [
  // ═══ AKIMICHI ═════════════════════════════════════════════════
  academie('akimichi', {
    id: 'cl_akimichi_banquet',
    titre: 'Le rôti du chef de village',
    lieu: '$village',
    texte: [
      { texte: 'Le clan Akimichi donne un banquet en l’honneur des chefs de quartier. Pour impressionner les invités, tu fais grossir le rôti du plat d’honneur d’un simple geste de chakra. Le rôti double de taille. Puis triple. Toute la table se tait.' },
      { texte: 'Le chef du quartier marchand, un homme sec, repose ses baguettes. « Ah. Encore ces Akimichi, toujours affamés, toujours à tout faire grossir. Même la viande. »' },
    ],
    choix: [
      {
        id: 'rire',
        texte: 'En rire : « C’est un tour de famille. Le rôti, lui, est d’accord. »',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { stat: 'social.reputation', delta: 2 }, { stat: 'social.confianceClan', delta: -1 }],
        resultat: 'La table éclate de rire, le chef du quartier en dernier. Ta grand-mère te pince la joue sous la table, mi-fière mi-furieuse : on ne fait pas de tours au banquet des chefs. Mais le rôti est le meilleur qu’on ait servi depuis dix ans, et tout le monde en reprend.',
      },
      {
        id: 'maitrise',
        texte: 'Ramener le rôti à sa taille, lentement, sans rien renverser',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { controleChakra: 3 },
          maitrises: { baika: 2 },
          succes: { texte: 'Tu fermes les yeux, tu retrouves le fil de ton chakra dans la viande, et tu le rembobines. Le rôti rétrécit sous les yeux des invités, parfaitement doré, sans perdre une goutte de jus. Le chef du quartier hoche la tête, impressionné malgré lui. « Ça, c’est de la technique. »', effets: [{ entrainer: 'baika', jours: 25 }, { stat: 'attributs.controleChakra', delta: 2 }, { stat: 'social.confianceClan', delta: 3 }] },
          echec: { texte: 'Le rôti rétrécit trop. Puis regrossit. Puis éclate. Une pluie de jus de viande sur la table d’honneur. Silence. Puis le chef du clan Akimichi éclate d’un rire énorme, et tout le monde suit, sauf le chef du quartier, qui a de la sauce dans les cheveux.', effets: [{ stat: 'attributs.controleChakra', delta: 1 }, { stat: 'social.reputation', delta: -2 }] },
        },
      },
      {
        id: 'orgueil',
        texte: 'Le fixer, et faire grossir ta propre main sur la table',
        effets: [{ stat: 'social.confianceClan', delta: 3 }, { stat: 'social.reputation', delta: -4 }, { entrainer: 'baika', jours: 15 }],
        suite: 'cl_akimichi_ring',
        resultat: 'Ta main enfle jusqu’à couvrir la moitié de la table. Les plats glissent. Le chef du quartier recule sa chaise. Un jeune ninja de sa suite, un genin à l’œil moqueur, se lève : « Si tu veux te montrer, montre-toi sur le ring, pas sur la nappe. » La foule du festival l’a entendu.',
      },
    ],
  }),
  suite({
    id: 'cl_akimichi_ring',
    titre: 'Le ring du festival',
    categorie: 'rivalite',
    lieu: '$village',
    si: ACTIF,
    texte: 'Un cercle de cordes, une foule qui hurle, et le genin moqueur en face de toi, qui sautille d’un pied sur l’autre. Il est rapide. Toi, tu es lourd·e, et tu le sais.',
    choix: [
      {
        id: 'char',
        texte: 'Te rouler en boulet et charger',
        test: {
          type: 'combat',
          difficulte: 48,
          attributs: { force: 2, controleChakra: 1 },
          maitrises: { baika: 3, taijutsu: 1 },
          succes: {
            texte: 'Tu grossis, tu te replies, tu deviens une boule qui tourne sur elle-même et dévale le ring. Il esquive une fois, deux fois, puis tu rebondis sur les cordes et tu le prends de face. Il s’envole hors du cercle. La foule rugit. Ta grand-mère, au premier rang, s’est levée.',
            effets: [
              { si: { maitrise: 'baika', palierMin: 1 }, alors: [{ apprendre: 'akimichi_nikudan', source: 'clan' }], sinon: [{ entrainer: 'baika', jours: 30 }] },
              { stat: 'social.reputation', delta: 5 },
              { stat: 'social.confianceClan', delta: 3 },
            ],
          },
          echec: { texte: 'Il esquive chaque charge, comme un moustique autour d’un buffle. Au cinquième passage, tu sors du ring tout·e seul·e, emporté·e par ton élan. La foule rit. Ce n’est pas méchant. C’est pire.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'social.reputation', delta: -2 }] },
        },
      },
      {
        id: 'abandon',
        texte: 'Saluer et quitter le ring',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.confianceClan', delta: -2 }],
        resultat: 'Tu t’inclines devant lui et devant la foule, et tu descends. Les huées durent peu. Le genin, lui, ne sait plus quoi faire de sa victoire. Plus tard, ta grand-mère te dit : « Savoir quand ne pas grossir, c’est la moitié de notre art. »',
      },
    ],
  }),
  epreuve('akimichi', {
    id: 'cl_akimichi_convoi',
    titre: 'Le convoi de vivres',
    lieu: 'route_commerce',
    personnages: ['@coequipierA'],
    si: [AMI],
    texte: [
      { texte: 'Escorte d’un convoi de riz pour un village affamé. Au col, un éboulement bloque la route, et des bandits sortent des rochers des deux côtés. Ton chef d’équipe te crie d’ouvrir un passage pendant que les autres tiennent les flancs.' },
      { texte: 'Un bandit ricane en te voyant t’avancer vers le rocher : « Regardez-le, il pense soulever ça ! »' },
    ],
    choix: [
      {
        id: 'bombe',
        texte: 'Tout donner : la bombe du papillon',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 3, controleChakra: 1 },
          maitrises: { baika: 3, taijutsu: 1 },
          letal: true,
          manches: 2,
          allies: true,
          causeMort: 'épuisé·e jusqu’à la dernière calorie en défendant un convoi de riz',
          succes: {
            texte: 'Tu brûles tes réserves d’un coup. Des ailes de chakra jaillissent de ton dos, lumineuses, et ton poing devient une colline. Le rocher éclate. Les bandits les plus proches s’envolent avec. {@coequipierA} reste bouche bée au milieu de la mêlée, puis se met à hurler de joie. Le convoi passe. Le village mangera cet hiver. Toi, tu dors trois jours.',
            effets: [
              { si: { maitrise: 'baika', palierMin: 3 }, alors: [{ apprendre: 'akimichi_chodan', source: 'clan' }], sinon: [{ entrainer: 'baika', jours: 50 }] },
              { stat: 'attributs.force', delta: 5 },
              { stat: 'jauges.fatigue', delta: 40 },
              { stat: 'social.reputation', delta: 6 },
              { drapeau: 'heros_du_convoi' },
            ],
          },
          echec: { texte: 'Tu grossis trop vite. Tes muscles se déchirent avant que le rocher bouge. Le convoi doit faire demi-tour, et la moitié du riz reste aux bandits.', effets: [{ blessure: { id: 'muscles_dechires', nom: 'Muscles déchirés', gravite: 2, jours: 40 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }] },
        },
      },
      {
        id: 'grandir',
        texte: 'Grandir, juste assez pour qu’ils aient peur',
        effets: [{ entrainer: 'baika', jours: 25 }, { stat: 'social.reputationOmbre', delta: 2 }, { stat: 'attributs.agilite', delta: -1 }, { stat: 'attributs.force', delta: 2 }],
        resultat: 'Tu enfles jusqu’à dépasser le rocher d’une tête. Tu le pousses d’une main, lentement, en fixant le bandit qui riait. Il ne rit plus. La moitié des bandits fuient avant même le combat. Les autres ne tiennent pas longtemps.',
      },
      {
        id: 'humour',
        texte: '« Moi ? Non. Mais toi, tu vas m’aider. »',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { charisme: 3, intellect: 1 },
          succes: { texte: 'Tu proposes au chef des bandits un sac de riz pour ses hommes, plutôt qu’un combat qu’il perdra. Il te dévisage, puis éclate de rire. Ses hommes et les tiens dégagent le rocher ensemble. Il repart avec un sac. Le village avec le reste. « T’es un drôle de ninja », dit-il.', effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 4 } }, { stat: 'jauges.ryo', delta: -10 }] },
          echec: { texte: 'Le chef des bandits ne rit pas. Il attaque. Tu dois quand même grossir, en retard, et le combat est long et confus.', effets: [{ stat: 'jauges.sante', delta: -12 }, { entrainer: 'baika', jours: 15 }] },
        },
      },
    ],
  }),

  // ═══ ABURAME ══════════════════════════════════════════════════
  academie('aburame', {
    id: 'cl_aburame_academie',
    titre: 'L’objet dans le mur',
    lieu: '$academie',
    personnages: ['@rival'],
    si: [{ pnj: '@rival', etat: ['vivant', 'blesse'] }],
    texte: [
      { texte: 'Exercice de recherche : un sceau marqué a été caché quelque part dans l’Académie. Le premier qui le rapporte gagne. Tu n’as pas besoin de chercher : tu peux envoyer tes insectes dans les murs. Mais tout le monde te regarde, et certains ont déjà reculé leurs pupitres.' },
      { texte: '{@rival} parle assez fort pour que toute la classe entende : « Vas-y, lâche tes bestioles. Après, on désinfectera la salle. »' },
    ],
    choix: [
      {
        id: 'essaim',
        texte: 'Lâcher l’essaim, et laisser la classe regarder',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { controleChakra: 2, perception: 2 },
          maitrises: { kikaichu: 2 },
          succes: { texte: 'Un nuage noir quitte tes manches, se divise en cent filets et disparaît dans les fissures. Des élèves crient. Trente secondes plus tard, un insecte revient se poser sur ton doigt et bourdonne une direction. Le sceau était dans la cheminée. Premier·e. {@rival} ne dit plus rien. Personne ne te regarde plus de la même façon. Pas forcément en mieux.', effets: [{ entrainer: 'kikaichu', jours: 25 }, { stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputation', delta: -1 }, { stat: 'social.confianceClan', delta: 3 }, { relation: '@rival', delta: { respect: 4 } }] },
          echec: { texte: 'L’essaim s’égare, affolé par les cris, et la moitié de tes insectes se cognent aux vitres. Tu les rappelles un à un pendant que la classe se moque. {@rival} trouve le sceau avant toi.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@rival', delta: { rivalite: 4 } }] },
        },
      },
      {
        id: 'discret',
        texte: 'Un seul insecte, en silence, sous ta manche',
        effets: [{ entrainer: 'kikaichu', jours: 15 }, { stat: 'attributs.discretion', delta: 3 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Personne ne voit l’insecte qui quitte ton poignet. Tu fais semblant de chercher comme les autres, tu ouvres des placards au hasard, et tu « trouves » le sceau dans la cheminée au bout de vingt minutes. Personne ne saura. C’est ce que ton père appelle « la politesse du clan ».',
      },
      {
        id: 'repondre',
        texte: 'Répondre à {@rival} avant de commencer',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { relation: '@rival', delta: { hostilite: 4, respect: 2 } }],
        resultat: '« Ils ne mangent que le chakra, dis-tu calmement. Le tien suffirait à peine pour un. » La classe éclate de rire. {@rival} rougit jusqu’aux oreilles. Tu n’as pas trouvé le sceau. Mais tu as gagné quelque chose de plus rare : on rit avec toi, pour une fois.',
      },
    ],
  }),
  epreuve('aburame', {
    id: 'cl_aburame_infiltration',
    titre: 'Le rouleau dans le repaire',
    lieu: 'frontiere_herbe',
    texte: [
      { texte: 'Mission d’infiltration : un rouleau d’invocation volé à ton village est gardé dans un fortin de déserteurs, à la frontière. Les couloirs sont gardés, mais les conduits d’aération ne le sont pas. Tes insectes peuvent y passer. Toi aussi, presque.' },
      { texte: 'Ton chef d’unité, un Aburame âgé qui parle à peine, te souffle une seule phrase avant que tu partes : « Avance lentement. Sens leur chakra avant de les voir. »' },
    ],
    choix: [
      {
        id: 'vite',
        texte: 'Avancer vite, pour frapper avant la relève',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 2, discretion: 1 },
          maitrises: { kikaichu: 2, taijutsu: 1 },
          letal: true,
          causeMort: 'tué·e dans un conduit d’aération, en volant un rouleau d’invocation',
          succes: { texte: 'Tu files dans les conduits, tes insectes devant toi comme des éclaireurs. Une patrouille te barre la route : tu lâches un clone d’insectes dans le couloir de gauche, ils le suivent, toi tu passes à droite. Le rouleau est dans tes mains avant la relève.', effets: [{ entrainer: 'kikaichu', jours: 30 }, { stat: 'attributs.agilite', delta: 3 }, { stat: 'social.reputation', delta: 4 }, { drapeau: 'rouleau_aburame' }] },
          echec: { texte: 'Tu vas trop vite. Une grille grince. L’alarme sonne. Tu sors par le toit, sans le rouleau, sous une pluie de flèches.', effets: [{ blessure: { id: 'fleches_fortin', nom: 'Flèche dans l’épaule', gravite: 2, jours: 30 } }, { retour: 'cl_aburame_siege', chance: 0.6, entre: [200, 600] }] },
        },
      },
      {
        id: 'lent',
        texte: 'Avancer lentement, et laisser les insectes sentir chaque garde',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { discretion: 2, perception: 2 },
          maitrises: { kikaichu: 3 },
          succes: {
            texte: 'Une heure pour faire cent pas. Tes insectes sentent chaque chakra derrière chaque paroi, et tu attends qu’ils s’éloignent. Au dernier couloir, un garde ne bouge pas : tu tends un mur d’insectes devant lui, si dense qu’il croit à une ombre, et tu passes derrière. Le rouleau, et aussi un plan des déserteurs, que personne ne t’avait demandé.',
            effets: [
              { si: { maitrise: 'kikaichu', palierMin: 2 }, alors: [{ apprendre: 'aburame_kabe', source: 'clan' }], sinon: [{ entrainer: 'kikaichu', jours: 40 }] },
              { stat: 'attributs.discretion', delta: 3 },
              { stat: 'attributs.intellect', delta: 2 },
              { stat: 'social.confianceClan', delta: 5 },
              { drapeau: 'rouleau_aburame' },
              { indice: 'plan_deserteurs' },
            ],
          },
          echec: { texte: 'Trop lent : la relève arrive pendant que tu es dans le dernier conduit. Tu dois attendre dix heures, immobile, que les gardes changent encore. Tu repars avec le rouleau, et des crampes pour une semaine.', effets: [{ stat: 'jauges.fatigue', delta: 30 }, { drapeau: 'rouleau_aburame' }] },
        },
      },
      {
        id: 'observer',
        texte: 'Ne rien voler encore : observer, depuis la grille, toute une nuit',
        effets: [{ stat: 'attributs.intellect', delta: 3 }, { stat: 'attributs.perception', delta: 2 }, { indice: 'plan_deserteurs' }, { retour: 'cl_aburame_siege', chance: 1, entre: [60, 200] }],
        resultat: 'Tu ne voles rien. Tu écoutes. Et ce que tu entends est bien pire qu’un vol : les déserteurs préparent une attaque sur ton village, avec des alliés que personne n’attendait. Tu rentres avec un rapport au lieu d’un rouleau. Ton chef d’unité le lit deux fois, puis te regarde : « Bien. Très bien. Ce qui vient sera long. »',
      },
    ],
  }),
  suite({
    id: 'cl_aburame_siege',
    titre: 'La nuit de l’essaim',
    categorie: 'guerre',
    lieu: '$porte',
    si: { tout: [ACTIF, { clan: 'aburame' }] },
    texte: [
      { texte: 'Ils sont venus. Les déserteurs du fortin, et leurs alliés, à la porte est, en pleine nuit. Les civils du quartier est doivent être évacués par la seule rue encore libre. On te charge de faire diversion pendant ce temps. Seul·e, avec tes insectes.' },
      { texte: 'Un stratège ennemi, au premier rang, aperçoit le nuage qui se forme au-dessus de toi et hurle : « Quel monstre attaque ? Défendez-vous ! »' },
    ],
    choix: [
      {
        id: 'illusion',
        texte: 'Former une silhouette géante d’insectes, comme une bête à queues',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { controleChakra: 2, intellect: 1, controleEmotionnel: 1 },
          maitrises: { kikaichu: 3 },
          succes: { texte: 'Tes insectes montent en spirale, se densifient, prennent la forme d’une créature à trois queues, haute comme le mur. Elle n’a pas de chakra à elle. Mais de nuit, avec les torches, personne ne le sait. Les déserteurs reculent. Il leur faut une demi-heure pour comprendre. La demi-heure dont les civils avaient besoin.', effets: [{ entrainer: 'kikaichu', jours: 50 }, { stat: 'social.reputation', delta: 8 }, { stat: 'social.confianceClan', delta: 6 }, { drapeau: 'diversion_essaim' }] },
          echec: { texte: 'La silhouette tient une minute, puis se défait. Les déserteurs comprennent, et chargent. Tu tiens la rue avec ce qui te reste, jusqu’à ce que les renforts arrivent. Les civils sont passés. De justesse.', effets: [{ blessure: { id: 'siege_est', nom: 'Blessures du siège', gravite: 2, jours: 40 } }, { stat: 'social.reputation', delta: 3 }] },
        },
      },
      {
        id: 'essaim',
        texte: 'Lâcher l’essaim dévoreur sur leur premier rang',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { controleChakra: 2, perception: 1 },
          maitrises: { kikaichu: 3, ninjutsu: 1 },
          letal: true,
          manches: 2,
          causeMort: 'tombé·e à la porte est, au milieu de son propre essaim',
          succes: {
            texte: 'Le nuage s’abat sur eux. Les insectes se collent à leur peau et boivent leur chakra jusqu’à ce que leurs techniques s’éteignent dans leurs mains. Le premier rang tombe à genoux, vidé. Le second recule. Tu restes debout au milieu de la rue, entouré·e d’un bourdonnement qui ne s’arrête plus. Même tes alliés ont peur de t’approcher.',
            effets: [
              { si: { maitrise: 'kikaichu', palierMin: 1 }, alors: [{ apprendre: 'aburame_essaim', source: 'clan' }], sinon: [{ entrainer: 'kikaichu', jours: 40 }] },
              { stat: 'social.reputationOmbre', delta: 6 },
              { stat: 'social.reputation', delta: 5 },
            ],
          },
          echec: { texte: 'Tes insectes se dispersent dans le vent du soir. Tu te bats à mains nues, épuisé·e, jusqu’à l’arrivée des renforts.', effets: [{ blessure: { id: 'siege_est', nom: 'Blessures du siège', gravite: 2, jours: 45 } }, { stat: 'jauges.fatigue', delta: 30 }] },
        },
      },
    ],
  }),

  // ═══ INUZUKA ══════════════════════════════════════════════════
  academie('inuzuka', {
    id: 'cl_inuzuka_academie',
    titre: 'Le code du maître et du chien',
    lieu: '$terrain',
    personnages: ['@coequipierB'],
    si: [B],
    texte: [
      { texte: 'Concours de rapidité : trois binômes, un parcours, un mot de code à transmettre d’un bout à l’autre. Ton binôme humain est {@coequipierB}, qui ne parle pas le langage des chiens. Ton chien, lui, n’attend qu’un signe.' },
      { texte: 'L’instructeur Inuzuka passe derrière vous et murmure : « Le temps est compté. Votre lien doit être parfait. Tous les trois. »' },
    ],
    choix: [
      {
        id: 'silence',
        texte: 'Les gestes silencieux du clan, que seuls toi et ton chien comprenez',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { perception: 2, agilite: 2 },
          maitrises: { ninken_lien: 3 },
          succes: { texte: 'Deux doigts, un claquement de langue, un regard. Ton chien file comme une flèche vers {@coequipierB}, le mot de code noué à son collier. Premier binôme. L’instructeur hoche la tête. Mais {@coequipierB} a l’air vexé{e:@coequipierB} : « J’ai servi à quoi, moi ? »', effets: [{ entrainer: 'ninken_lien', jours: 25 }, { stat: 'attributs.agilite', delta: 2 }, { relation: '@coequipierB', delta: { amitie: -2 } }] },
          echec: { texte: 'Ton chien comprend un autre geste et rapporte la chaussure de l’instructeur. Toute la classe rit, l’instructeur le premier. Ce n’est pas une victoire. Mais ça restera la meilleure histoire de l’année.', effets: [{ entrainer: 'ninken_lien', jours: 15 }, { stat: 'social.reputation', delta: 1 }] },
        },
      },
      {
        id: 'ensemble',
        texte: 'Apprendre en vitesse trois signes à {@coequipierB}',
        effets: [{ entrainer: 'ninken_lien', jours: 20 }, { stat: 'attributs.charisme', delta: 2 }, { relation: '@coequipierB', delta: { amitie: 8, confiance: 5 } }],
        resultat: 'Tu passes les cinq premières minutes à apprendre à {@coequipierB} « viens », « cherche » et « garde ». Les autres binômes sont déjà partis. Vous finissez deuxièmes. Mais à la fin, ton chien va s’asseoir aux pieds de {@coequipierB}, et pas aux tiens. L’instructeur sourit : « Le lien ne s’arrête pas à vous deux. Bien vu. »',
      },
      {
        id: 'cri',
        texte: 'Hurler l’ordre à pleins poumons',
        effets: [{ stat: 'attributs.force', delta: 1 }, { stat: 'attributs.discretion', delta: -1 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Ton chien t’entend. Les deux autres chiens aussi. Ils partent tous les trois vers {@coequipierB}, en se mordillant. C’est le chaos. C’est aussi la première fois que l’instructeur rit aux larmes depuis des années.',
      },
    ],
  }),
  epreuve('inuzuka', {
    id: 'cl_inuzuka_traque',
    titre: 'La traque sous la lune',
    lieu: 'foret_feu',
    texte: [
      { texte: 'Un voleur a pillé l’entrepôt de pharmacie du village : des remèdes pour tout un hiver. Il a fui vers la forêt à la nuit tombée. Ton chien a sa piste. Il grogne, le nez au sol, tremblant d’impatience.' },
      { texte: 'Entre vous deux, pas besoin de mots. Mais tu sens ce qu’il pense comme si tu l’entendais : « Il s’est faufilé par là. En avant ! »' },
    ],
    choix: [
      {
        id: 'frenesie',
        texte: 'Courir à quatre pattes, comme lui, et rattraper le voleur',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 2, perception: 1, force: 1 },
          maitrises: { ninken_lien: 2, taijutsu: 2 },
          manches: 2,
          succes: {
            texte: 'Tu tombes à quatre pattes, ton chien à ta droite, et vous devenez deux tourbillons qui hurlent entre les arbres. Le voleur se retourne, voit deux vrilles de chakra foncer sur lui, et n’a pas le temps de crier. Croc sur croc. Il est au sol, ton chien sur sa poitrine, les crocs à un doigt de sa gorge. Les remèdes sont intacts.',
            effets: [
              { si: { maitrise: 'ninken_lien', palierMin: 1 }, alors: [{ apprendre: 'inuzuka_gatsuga', source: 'clan' }], sinon: [{ entrainer: 'ninken_lien', jours: 35 }] },
              { stat: 'attributs.agilite', delta: 3 },
              { stat: 'social.reputation', delta: 5 },
              { stat: 'attributs.discretion', delta: -1 },
            ],
          },
          echec: { texte: 'Trop de bruit : il vous entend venir de loin et vous sème dans un ruisseau, où vos nez ne servent plus à rien. Il emporte les remèdes.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { retour: 'cl_inuzuka_voleur', chance: 0.8, entre: [60, 200] }] },
        },
      },
      {
        id: 'nez',
        texte: 'Ralentir, et sentir mieux que lui',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { perception: 3, discretion: 1 },
          maitrises: { ninken_lien: 2 },
          succes: { texte: 'Vous marchez au lieu de courir. Ton nez et le sien trouvent ce que la course aurait manqué : le voleur a laissé une fausse piste, puis il est revenu sur ses pas. Il dort dans une grotte à cent pas du village, persuadé que vous êtes partis loin. Vous le cueillez dans son sommeil.', effets: [{ entrainer: 'ninken_lien', jours: 30 }, { stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.discretion', delta: 2 }, { stat: 'social.reputation', delta: 3 }] },
          echec: { texte: 'La fausse piste vous emmène jusqu’à la rivière. Quand vous comprenez, il est trop tard. Il est parti.', effets: [{ stat: 'attributs.perception', delta: 1 }, { retour: 'cl_inuzuka_voleur', chance: 0.8, entre: [60, 200] }] },
        },
      },
      {
        id: 'confiance',
        texte: 'Lâcher ton chien seul : il est plus rapide sans toi',
        effets: [{ entrainer: 'ninken_lien', jours: 25 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu dénoues son collier. Il part comme une flèche, et tu restes seul·e dans la forêt, à attendre, le cœur battant. Une heure plus tard, il revient, la sacoche de remèdes entre les dents, l’oreille déchirée, la queue haute. Le voleur, lui, ne s’arrêtera de courir qu’au pays voisin.',
      },
    ],
  }),
  suite({
    id: 'cl_inuzuka_voleur',
    titre: 'L’odeur qui revient',
    categorie: 'mission',
    lieu: '$village',
    si: { tout: [ACTIF, { clan: 'inuzuka' }] },
    texte: 'Au marché, ton chien se fige, poils hérissés. Cette odeur. Le voleur de la pharmacie, rasé de près, habillé en marchand, qui vend des remèdes à prix d’or. Les tiens. Ceux du village.',
    choix: [
      {
        id: 'arreter',
        texte: 'L’arrêter devant tout le marché',
        effets: [{ stat: 'social.reputation', delta: 6 }, { stat: 'social.loyaute', delta: 3 }, { entrainer: 'ninken_lien', jours: 15 }],
        resultat: 'Ton chien lui saute dessus avant que tu aies fini de parler. La foule s’écarte. Il essaie de nier, mais les flacons portent encore le sceau de la pharmacie du village. Les gardes l’emmènent sous les applaudissements. Ton chien, lui, réclame une récompense. Il l’a méritée.',
      },
      {
        id: 'suivre',
        texte: 'Le suivre discrètement jusqu’à ses complices',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { discretion: 2, perception: 2 },
          succes: { texte: 'Il ne va pas chez lui. Il va dans un entrepôt du port, où trois autres marchands revendent tout ce qui a disparu au village cette année. Tu ramènes la garde. Un réseau entier tombe en une nuit.', effets: [{ stat: 'social.reputation', delta: 8 }, { stat: 'attributs.discretion', delta: 2 }, { indice: 'reseau_receleurs' }] },
          echec: { texte: 'Il te sent, toi aussi. Il disparaît dans la foule du port. Mais ton chien garde son odeur. Il ne l’oubliera jamais.', effets: [{ stat: 'attributs.perception', delta: 1 }] },
        },
      },
    ],
  }),

  // ═══ SENJU ════════════════════════════════════════════════════
  academie('senju', {
    id: 'cl_senju_survie',
    titre: 'L’exercice de survie',
    lieu: 'foret_feu',
    texte: [
      { texte: 'Exercice de survie en forêt, par groupes de quatre. Le deuxième soir, un élève de ton groupe met le pied dans un piège à loup oublié là par un chasseur. Sa cheville saigne beaucoup, trop. Le chemin du retour fait une demi-journée.' },
      { texte: 'Un autre élève, un garçon sec et pressé, recule déjà : « Ne perdez pas votre temps, on ne peut rien pour lui ! Si on le porte, on sera derniers. »' },
    ],
    choix: [
      {
        id: 'soigner',
        texte: 'Poser tes mains sur sa jambe : le sang des Senju guérit',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { controleChakra: 2, controleEmotionnel: 1 },
          maitrises: { vitalite_senju: 2 },
          succes: { texte: 'Tu ne sais pas vraiment ce que tu fais. Tu sais seulement que ton chakra est chaud et qu’il veut aller là où ça saigne. Tu le laisses couler. La plaie se referme à moitié, assez pour que l’os tienne. Tu t’effondres d’épuisement. C’est lui qui te porte, à la fin, en boitant.', effets: [{ entrainer: 'vitalite_senju', jours: 30 }, { entrainer: 'shosen', jours: 15 }, { stat: 'jauges.fatigue', delta: 25 }, { stat: 'social.reputation', delta: 4 }, { drapeau: 'sauve_eleve_piege' }], suite: 'cl_senju_ours' },
          echec: { texte: 'Ton chakra tremble, refuse de sortir. Tu ne peux rien de plus qu’un bandage serré. Vous le portez à tour de rôle, toute la nuit. Derniers, mais tous les quatre.', effets: [{ stat: 'jauges.fatigue', delta: 20 }, { stat: 'attributs.force', delta: 2 }], suite: 'cl_senju_ours' },
        },
      },
      {
        id: 'porter',
        texte: 'Le porter, à tour de rôle, quoi que dise l’autre',
        effets: [{ stat: 'attributs.force', delta: 3 }, { stat: 'jauges.fatigue', delta: 20 }, { ethique: { compassion: 4 } }],
        suite: 'cl_senju_ours',
        resultat: 'Tu le hisses sur ton dos sans discuter. Le garçon pressé soupire, puis prend l’autre bras. Vous avancez dans la nuit, lentement, en sueur. Personne ne parle. Puis, entre les arbres, quelque chose grogne.',
      },
      {
        id: 'reprocher',
        texte: 'Dire au garçon pressé ce que tu penses de lui',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { ethique: { honneur: 3 } }, { stat: 'social.reputation', delta: -1 }],
        suite: 'cl_senju_ours',
        resultat: '« Mon arrière-grand-oncle a fondé ce village pour qu’on ne laisse personne derrière. » Le garçon rougit, puis se tait, et prend un bras. Tu as eu raison, et tu as été insupportable de l’avoir eue. Les deux sont vrais. Puis, dans le noir, un grognement.',
      },
    ],
  }),
  suite({
    id: 'cl_senju_ours',
    titre: 'L’ours attiré par le sang',
    categorie: 'entrainement',
    lieu: 'foret_feu',
    si: ACTIF,
    texte: 'Un ours. Énorme, maigre de fin d’hiver, attiré par l’odeur du sang de la cheville. Il se dresse entre vous et le chemin du village. Les deux autres élèves reculent derrière toi, le blessé sur le dos.',
    choix: [
      {
        id: 'tenir',
        texte: 'Te placer devant les autres, et tenir',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { force: 2, controleEmotionnel: 2 },
          maitrises: { vitalite_senju: 2, taijutsu: 1, mokuton: 2 },
          allies: true,
          succes: {
            texte: [
              { si: { maitrise: 'mokuton', eveille: true }, texte: 'Tu frappes le sol des deux paumes, sans savoir pourquoi. Des racines jaillissent de la terre, épaisses comme des bras, et s’enroulent autour des pattes de l’ours. Il rugit, se débat, puis s’immobilise, ligoté. Les trois autres te regardent, muets. Tu regardes tes mains. Elles sentent la sève.' },
              { si: { non: { maitrise: 'mokuton', eveille: true } }, texte: 'Il te frappe, tu tombes, tu te relèves. Il te frappe encore. Tu te relèves encore, plus vite que tu ne devrais. Au cinquième coup, l’ours hésite devant ce petit être qui refuse de rester par terre, et il s’en va dans les fourrés. Tes plaies se referment déjà.' },
            ],
            effets: [{ entrainer: 'vitalite_senju', jours: 40 }, { stat: 'attributs.force', delta: 2 }, { stat: 'social.reputation', delta: 5 }, { stat: 'social.confianceClan', delta: 4 }, { tenterEveil: 'mokuton', intensite: 30 }],
          },
          echec: { texte: 'L’ours te projette contre un arbre. Les autres crient, frappent des casseroles, allument une torche, et l’ours finit par fuir le feu. Toi, tu ne sens plus ton bras.', effets: [{ blessure: { id: 'ours', nom: 'Griffes d’ours', gravite: 2, jours: 35 } }, { tenterEveil: 'mokuton', intensite: 25 }] },
        },
      },
      {
        id: 'feu',
        texte: 'Organiser les autres : torches, cris, et un cercle autour du blessé',
        effets: [{ stat: 'attributs.intellect', delta: 3 }, { stat: 'attributs.charisme', delta: 2 }, { stat: 'social.reputation', delta: 3 }],
        resultat: 'Tu distribues les rôles en trois phrases. Une torche, deux branches qui claquent, un cercle autour du blessé. L’ours tourne autour de vous une minute, puis abandonne. Le garçon pressé te regarde différemment, à partir de ce jour. Il sera le premier à te suivre, plus tard, quand il faudra suivre quelqu’un.',
      },
    ],
  }),
  epreuve('senju', {
    id: 'cl_senju_foret',
    titre: 'La forêt qui parle',
    lieu: 'foret_feu',
    texte: [
      { texte: 'Le village t’envoie au cœur de la vieille forêt, là où le Premier Hokage s’entraînait, avec une consigne étrange : pratiquer la fusion de l’eau et de la terre, à l’endroit exact où il l’a pratiquée. Au pied d’un cèdre millénaire, un sceau oublié s’effrite sous tes doigts. L’air se met à vibrer.' },
      { texte: 'Une voix sort du tronc, lente comme la sève : « Ta lignée est née pour préserver l’équilibre. Le veux-tu, ou veux-tu seulement la force ? »' },
    ],
    choix: [
      {
        id: 'cooperer',
        texte: 'Accepter, et t’asseoir contre le tronc',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { controleChakra: 3, controleEmotionnel: 1 },
          maitrises: { vitalite_senju: 2, nature_doton: 1, nature_suiton: 1 },
          succes: {
            texte: [
              { texte: 'Tu restes assis·e trois jours. Tu ne manges pas. Tu laisses la forêt couler en toi, l’eau des racines, la terre des feuilles mortes. Le troisième soir, quelque chose cède en toi, doucement, comme une graine qui s’ouvre.' },
              { si: { maitrise: 'mokuton', eveille: true }, texte: 'Une pousse sort de ta paume. Puis une autre. Le cèdre, au-dessus de toi, se couvre de fleurs blanches hors saison. Le bois t’a répondu.' },
              { si: { non: { maitrise: 'mokuton', eveille: true } }, texte: 'Le bois ne naît pas dans ta main. Mais ton chakra a changé de couleur : plus lent, plus profond. La voix murmure : « Pas toi. Mais tes enfants, peut-être. » Tu repars plus fort·e que tu n’es venu·e, sans savoir dire en quoi.' },
            ],
            effets: [{ tenterEveil: 'mokuton', intensite: 40 }, { entrainer: 'vitalite_senju', jours: 50 }, { stat: 'attributs.controleChakra', delta: 4 }, { stat: 'jauges.chakraMax', delta: 8 }, { ethique: { compassion: 3 } }, { drapeau: 'foret_senju', valeur: 'acceptee' }],
          },
          echec: { texte: 'Tu ne tiens pas trois jours. La faim et le doute te relèvent au deuxième soir. La voix se tait. Mais le cèdre garde la trace de tes mains dans son écorce.', effets: [{ entrainer: 'vitalite_senju', jours: 25 }, { stat: 'attributs.controleChakra', delta: 2 }] },
        },
      },
      {
        id: 'attaquer',
        texte: 'Attaquer : une voix dans un arbre, c’est un genjutsu',
        effets: [{ entrainer: 'nature_doton', jours: 30 }, { stat: 'attributs.force', delta: 2 }, { ethique: { compassion: -3 } }, { drapeau: 'foret_senju', valeur: 'offensee' }],
        suite: 'cl_senju_golem',
        resultat: 'Tu frappes le tronc d’une technique de terre. L’écorce éclate. La voix ne crie pas. Elle soupire, comme une vieille femme déçue. Puis la terre, autour de toi, se soulève, et un homme fait de racines et de mousse se dresse entre les arbres.',
      },
      {
        id: 'observer',
        texte: 'Ne rien dire, et observer la forêt jusqu’à la comprendre',
        effets: [{ stat: 'attributs.perception', delta: 3 }, { stat: 'attributs.force', delta: 2 }, { entrainer: 'nature_doton', jours: 25 }, { tenterEveil: 'mokuton', intensite: 25 }, { drapeau: 'foret_senju', valeur: 'observee' }],
        suite: 'cl_senju_golem',
        resultat: 'Tu ne réponds pas. Tu regardes : où l’eau monte dans les racines, comment la terre retient les arbres morts pour en nourrir d’autres. Après des heures, la voix rit doucement. « Patient. Comme lui. » Puis le sol tremble. Quelque chose d’autre s’est réveillé avec le sceau, et cette chose-là ne parle pas.',
      },
    ],
  }),
  suite({
    id: 'cl_senju_golem',
    titre: 'L’homme de racines',
    categorie: 'clan_rare',
    lieu: 'foret_feu',
    si: ACTIF,
    texte: 'Une effigie de bois et de terre, deux fois ta taille, avec des yeux de champignons phosphorescents. Elle avance vers toi en arrachant les fougères. Le sceau la retenait. Tu l’as brisé.',
    choix: [
      {
        id: 'combattre',
        texte: 'L’affronter',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { force: 2, controleChakra: 2 },
          maitrises: { mokuton: 3, nature_doton: 2, nature_suiton: 1, vitalite_senju: 1 },
          manches: 3,
          succes: {
            texte: [
              { si: { maitrise: 'mokuton', eveille: true }, texte: 'Tu poses tes paumes au sol. Une forêt jaillit sous l’effigie : des troncs entiers qui poussent en une seconde, l’enserrent, la soulèvent, la broient. Quand le bois se tait, il ne reste qu’une souche couverte de mousse, et une clairière nouvelle là où il n’y avait rien.' },
              { si: { non: { maitrise: 'mokuton', eveille: true } }, texte: 'L’eau et la terre, ensemble, comme le voulait l’exercice. Tu noies ses pieds dans une boue que tu fais naître, et quand elle s’enfonce jusqu’aux genoux, tu durcis la terre autour d’elle. Elle reste là, prise, à se défaire lentement en mousse. La voix de la forêt, très loin, dit : « Presque. »' },
            ],
            effets: [
              { si: { maitrise: 'mokuton', palierMin: 2 }, alors: [{ apprendre: 'mokuton_jukai', source: 'clan' }], sinon: [{ entrainer: 'nature_doton', jours: 40 }] },
              { stat: 'social.confianceClan', delta: 6 },
              { stat: 'attributs.force', delta: 2 },
            ],
          },
          echec: { texte: 'L’effigie t’écrase contre un cèdre et s’éloigne entre les arbres. Elle erre encore dans la vieille forêt, paraît-il. Les chasseurs l’évitent.', effets: [{ blessure: { id: 'effigie', nom: 'Écrasé·e par l’effigie', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'resceller',
        texte: 'Retracer le sceau brisé, sous ses coups',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 2, controleChakra: 2 },
          succes: { texte: 'Tu esquives deux fois, trois fois, et trace le sceau à moitié de mémoire dans la terre, avec ton propre sang. Il s’allume. L’effigie s’immobilise au milieu d’un pas, et redevient un tas de racines. La voix de la forêt souffle : « Tu as réparé ce que tu as cassé. C’est rare. »', effets: [{ stat: 'attributs.intellect', delta: 3 }, { stat: 'social.confianceClan', delta: 4 }, { ethique: { honneur: 3 } }] },
          echec: { texte: 'Le sceau ne tient pas. Tu fuis, et l’effigie retourne dormir d’elle-même au pied du cèdre, comme si elle n’avait jamais vraiment voulu se battre.', effets: [{ stat: 'jauges.sante', delta: -12 }] },
        },
      },
    ],
  }),

  // ═══ UZUMAKI ══════════════════════════════════════════════════
  academie('uzumaki', {
    id: 'cl_uzumaki_sceaux',
    titre: 'L’encre qui brûle',
    lieu: '$academie',
    personnages: ['@rival'],
    si: [{ pnj: '@rival', etat: ['vivant', 'blesse'] }],
    texte: [
      { texte: 'Premier cours de scellement. L’instructeur trace au tableau un sceau de stockage simple et vous demande de le reproduire. Tu le reproduis en dix secondes. Puis, sans y penser, tu ajoutes trois traits qui ne sont dans aucun manuel. Le papier se met à briller.' },
      { texte: '{@rival} lève la main avant que l’instructeur ait pu parler : « {Il} triche. Personne ne fait ça sans avoir copié. » Toute la classe se retourne vers toi.' },
    ],
    choix: [
      {
        id: 'montrer',
        texte: 'Tracer un deuxième sceau, devant tout le monde, plus complexe',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { intellect: 2, controleChakra: 2 },
          maitrises: { fuinjutsu_uzumaki: 2 },
          succes: { texte: 'Tu prends une feuille vierge et tu traces, sans réfléchir, un sceau de barrière en spirale que l’instructeur reconnaît seulement après coup, dans un vieux livre sur Uzushio. Il devient très pâle. « Où as-tu appris ça ? » Nulle part. Ta main savait. C’est la première fois que tu comprends que ton sang se souvient de choses que toi tu ignores.', effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 30 }, { stat: 'attributs.intellect', delta: 2 }, { relation: '@rival', delta: { respect: 6, rivalite: 4 } }, { stat: 'social.suspicion', delta: 2 }] },
          echec: { texte: 'Le deuxième sceau te glisse entre les doigts, mal équilibré. Il prend feu au milieu du pupitre. On l’éteint à coups de chiffon. {@rival} sourit. Mais l’instructeur garde la première feuille, celle qui brillait, et la range dans son tiroir.', effets: [{ stat: 'attributs.controleChakra', delta: 1 }, { relation: '@rival', delta: { rivalite: 5 } }] },
        },
      },
      {
        id: 'humilite',
        texte: 'Dire la vérité : « Je ne sais pas d’où ça vient »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { ethique: { honneur: 3 } }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: 'L’instructeur te garde après la classe. Il ne te gronde pas. Il te montre une carte, une île en forme de spirale, et un mot : Uzushio. « Ton clan venait de là. Il ne reste presque personne. Ce que tu viens de faire, ta main l’a hérité. » Tu rentres chez toi en regardant tes doigts comme ceux d’un étranger.',
      },
      {
        id: 'rival',
        texte: 'Proposer à {@rival} de tracer le même, pour voir',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { relation: '@rival', delta: { hostilite: 3, rivalite: 6 } }, { entrainer: 'fuinjutsu_uzumaki', jours: 15 }],
        resultat: '{@rival} prend le pinceau, trace, se trompe, recommence, se trompe encore. La classe rit. Tu n’as pas dit un mot de plus. Tu n’en avais pas besoin. Tu viens de te faire un ennemi pour longtemps, et d’apprendre que gagner sans parler peut coûter plus cher que perdre.',
      },
    ],
  }),
  epreuve('uzumaki', {
    id: 'cl_uzumaki_ruines',
    titre: 'Les ruines d’Uzushio',
    lieu: 'cotes_brume',
    texte: [
      { texte: 'Une mission t’emmène, enfin, sur l’île en spirale. Uzushio. Des maisons rouges effondrées, des tourbillons qui grondent autour des falaises, et partout, sur chaque porte, des sceaux à moitié effacés. Ce sont tes ancêtres qui les ont tracés.' },
      { texte: 'Dans les ruines du temple, des pillards ont allumé un feu. Ils arrachent les tablettes des murs pour les vendre au marché noir. Leur chef te voit et éclate de rire : « Un·e Uzumaki ? Ici ? Il en reste encore ? Ça se vend aussi, ça. »' },
    ],
    choix: [
      {
        id: 'chaines',
        texte: 'Laisser les chaînes du clan sortir de toi',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { controleChakra: 2, force: 1, controleEmotionnel: 1 },
          maitrises: { chaines_chakra: 3, fuinjutsu_uzumaki: 1 },
          letal: true,
          manches: 3,
          causeMort: 'tué·e dans les ruines d’Uzushio, en défendant les tablettes de son clan',
          succes: {
            texte: 'Quelque chose s’ouvre au milieu de ta poitrine. Des chaînes d’or jaillissent de ton dos, longues, vivantes, et s’enroulent autour des pillards un par un. Leur chef essaie de trancher la sienne : sa lame se brise dessus. Tu les tiens tous, suspendus au-dessus des tourbillons, et tu sens chaque battement de leur cœur à travers le métal de chakra. Tu ne les lâches qu’au-dessus du sable.',
            effets: [
              { si: { maitrise: 'chaines_chakra', palierMin: 2 }, alors: [{ apprendre: 'uzumaki_kongo', source: 'clan' }], sinon: [{ entrainer: 'chaines_chakra', jours: 50 }] },
              { stat: 'social.confianceClan', delta: 8 },
              { stat: 'attributs.controleChakra', delta: 3 },
              { drapeau: 'tablettes_uzushio' },
            ],
          },
          partiel: { texte: 'Tes chaînes en attrapent deux. Les autres fuient avec trois tablettes. C’est trois de trop.', effets: [{ entrainer: 'chaines_chakra', jours: 30 }, { stat: 'jauges.sante', delta: -10 }] },
          echec: { texte: 'Ils sont trop nombreux, et tes chaînes ne viennent pas. Tu fuis le temple en flammes avec une seule tablette serrée contre toi.', effets: [{ blessure: { id: 'uzushio', nom: 'Brûlures d’Uzushio', gravite: 2, jours: 35 } }, { drapeau: 'tablette_sauvee' }] },
        },
      },
      {
        id: 'barriere',
        texte: 'Activer les vieux sceaux des murs, et les laisser faire',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { intellect: 2, controleChakra: 2 },
          maitrises: { fuinjutsu_uzumaki: 3 },
          succes: { texte: 'Tu poses la main sur le mur. Les sceaux à moitié effacés reconnaissent ton chakra et se rallument, un par un, sur tout le temple. Les portes se ferment d’elles-mêmes. Les pillards se retrouvent enfermés dans une prison que tes ancêtres ont tracée cent ans plus tôt, pour exactement ce genre de visiteurs. Uzushio s’est défendue, à travers toi.', effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 50 }, { stat: 'attributs.intellect', delta: 3 }, { stat: 'social.confianceClan', delta: 8 }, { drapeau: 'tablettes_uzushio' }, { indice: 'barriere_uzushio' }] },
          echec: { texte: 'Les sceaux grésillent, s’allument à moitié, s’éteignent. Les pillards fuient quand même, effrayés par les lueurs. Ils ont eu le temps de prendre beaucoup.', effets: [{ entrainer: 'fuinjutsu_uzumaki', jours: 20 }] },
        },
      },
      {
        id: 'parler',
        texte: 'Leur racheter les tablettes',
        si: { stat: 'jauges.ryo', min: 120 },
        verrou: 'Ils en demanderont au moins 120 ryō.',
        effets: [{ stat: 'jauges.ryo', delta: -120 }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { drapeau: 'tablettes_uzushio' }],
        resultat: 'Le chef te regarde payer pour ce qui t’appartient déjà, et ça le fait rire. Tu laisses rire. Tu repars avec les tablettes et une colère froide que tu ranges quelque part, pour plus tard. Sur le bateau du retour, tu lis la première. C’est une berceuse.',
      },
    ],
  }),
];
