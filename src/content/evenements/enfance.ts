import type { Condition, EventDef } from '../../engine/types';

const base = { chapitre: 1, arc: 'formation' as const };
const ACTIF: Condition = { statut: 'actif' };
const ENFANT: Condition = { tout: [ACTIF, { age: { min: 6, max: 10 } }] };

/**
 * L'enfance entre six et dix ans : les petites scènes du temps libre, et les fils qu'elles laissent ouverts.
 * Un fil ne revient pas toujours : l'effet « retour » tire sa chance avec le hasard de la partie, et choisit quand.
 */
export const ENFANCE: EventDef[] = [
  // ── Fil : Gonta, le grand du quartier ─────────────────────────
  {
    ...base,
    id: 'e6_gonta',
    titre: 'Le grand du quartier',
    categorie: 'enfance',
    lieu: '$village',
    poids: 7,
    si: ENFANT,
    texte:
      'Gonta a douze ans, deux têtes de plus que toi et une cour de petits qui rient quand il rit. Aujourd’hui, il a décidé que le sac de riz que tu rapportes à la maison serait à lui.',
    choix: [
      {
        id: 'tenir',
        texte: 'Lui tenir tête',
        test: {
          type: 'combat',
          difficulte: 44,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 2 },
          succes: {
            texte:
              'Il ne s’attendait pas à ce que tu frappes en premier. Il se retrouve assis dans la poussière, devant sa cour qui ne rit plus. En se relevant, il crache : « Tu me le paieras. Pas aujourd’hui. Mais tu me le paieras. »',
            effets: [
              { stat: 'social.reputation', delta: 3 },
              { entrainer: 'taijutsu', jours: 10 },
              { drapeau: 'gonta', valeur: 'humilie' },
              { retour: 'e6_gonta_revanche', chance: 0.75, entre: [150, 420] },
            ],
          },
          echec: {
            texte: 'Il te soulève par le col et te laisse tomber sur le sac. Le riz est à lui. Ta lèvre saigne. Tu te jures que la prochaine fois sera différente.',
            effets: [
              { stat: 'jauges.sante', delta: -6 },
              { stat: 'attributs.controleEmotionnel', delta: 1 },
              { drapeau: 'gonta', valeur: 'vainqueur' },
              { retour: 'e6_gonta_revanche', chance: 0.6, entre: [200, 500] },
            ],
          },
        },
      },
      {
        id: 'ruse',
        texte: 'Lui dire que le riz est pour la veuve du bout de la rue',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { charisme: 2, intellect: 1 },
          succes: {
            texte: 'Il hésite. Même les brutes ont une mère. Il te laisse passer en grommelant, et tu sens son regard dans ton dos jusqu’au coin de la rue.',
            effets: [{ stat: 'attributs.charisme', delta: 1 }, { drapeau: 'gonta', valeur: 'dupe' }, { retour: 'e6_gonta_revanche', chance: 0.4, entre: [300, 600] }],
          },
          echec: { texte: '« Menteur·se. » Il prend le sac. Tu rentres les mains vides et une histoire à inventer.', effets: [{ stat: 'jauges.ryo', delta: -5 }, { drapeau: 'gonta', valeur: 'vainqueur' }] },
        },
      },
      {
        id: 'donner',
        texte: 'Lâcher le sac et partir',
        effets: [{ stat: 'jauges.ryo', delta: -5 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu poses le sac et tu t’en vas sans courir. C’est la seule chose qu’il ne peut pas te prendre. Ce soir-là, {parent} ne dit rien du riz manquant. Il y a des silences qui ressemblent à de la fierté.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_gonta_revanche',
    titre: 'Gonta revient',
    categorie: 'rivalite',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'gonta', egal: 'humilie' }, texte: 'Gonta n’a pas oublié la poussière. Il t’attend au bord du terrain, plus large qu’avant, avec deux garçons que tu ne connais pas. « Je t’avais dit que tu me le paierais. »' },
      { si: { drapeau: 'gonta', egal: 'vainqueur' }, texte: 'Gonta te retrouve au bord du terrain. Il a grandi, toi aussi. « Alors, le petit riz ? Tu viens encore te faire corriger ? » Ses amis rient. Toi, tu te souviens du goût du sang sur ta lèvre.' },
      { si: { drapeau: 'gonta', egal: 'dupe' }, texte: 'Gonta a fini par apprendre que la veuve du bout de la rue n’avait jamais vu ton riz. Il t’attend au bord du terrain, les bras croisés. « On m’a pris pour un idiot. Une seule fois. »' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Accepter le combat',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { force: 1, agilite: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 2 },
          succes: {
            texte: 'Cette fois, tu as appris. Tu esquives, tu attends, tu frappes une seule fois, au bon endroit. Gonta reste au sol un long moment. Puis il rit, un rire bizarre. « D’accord. D’accord. Tu as gagné le droit qu’on te laisse tranquille. »',
            effets: [{ stat: 'social.reputation', delta: 4 }, { entrainer: 'taijutsu', jours: 15 }, { drapeau: 'gonta', valeur: 'respect' }, { retour: 'e6_gonta_genin', chance: 0.45, entre: [500, 900] }],
          },
          partiel: {
            texte: 'Personne ne gagne vraiment. Vous vous séparez couverts de bleus, et ses amis ne rient plus. C’est déjà une victoire.',
            effets: [{ stat: 'jauges.sante', delta: -6 }, { entrainer: 'taijutsu', jours: 10 }, { drapeau: 'gonta', valeur: 'respect' }],
          },
          echec: {
            texte: 'Trois contre un. Tu finis contre le poteau d’entraînement, le souffle coupé. Gonta se penche : « Maintenant on est quittes. » Il le pense vraiment, et c’est presque pire.',
            effets: [{ stat: 'jauges.sante', delta: -12 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'gonta', valeur: 'quittes' }],
          },
        },
      },
      {
        id: 'parler',
        texte: 'Lui demander ce qu’il veut vraiment',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { charisme: 2, perception: 1 },
          succes: {
            texte: 'Il ouvre la bouche, la referme. Il a raté l’examen d’entrée deux fois. Il ne le sera jamais, ninja. Tu le comprends avant qu’il le dise. Il s’en va sans frapper personne.',
            effets: [{ ethique: { compassion: 5 } }, { stat: 'attributs.perception', delta: 1 }, { drapeau: 'gonta', valeur: 'compris' }],
          },
          echec: { texte: '« Ce que je veux ? Te voir par terre. » Il ne t’a pas écouté une seconde. Tu prends un coup avant d’avoir fini ta phrase.', effets: [{ stat: 'jauges.sante', delta: -8 }] },
        },
      },
      {
        id: 'fuir',
        texte: 'Partir en courant par les toits',
        effets: [{ entrainer: 'taijutsu', jours: 5 }, { stat: 'attributs.agilite', delta: 1 }, { stat: 'social.reputation', delta: -2 }],
        resultat: 'Ils ne savent pas monter sur les toits. Toi, si. Tu les entends crier en bas, puis plus rien. Tu as gagné la course. Pas la question.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_gonta_genin',
    titre: 'Le bandeau de Gonta',
    categorie: 'amitie',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: 'Au marché, quelqu’un t’appelle par ton nom. Gonta. Il porte un tablier de boucher, pas de bandeau. « Je travaille chez mon oncle, maintenant. » Il hésite. « Si un jour tu as besoin de viande pour pas cher… Tu m’as appris quelque chose, l’autre fois. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter, et lui serrer la main',
        effets: [{ stat: 'jauges.ryo', delta: 15 }, { stat: 'attributs.charisme', delta: 1 }, { drapeau: 'gonta', valeur: 'ami' }],
        resultat: 'Sa poigne écrase tes doigts. Il le fait exprès, un peu. Pendant des mois, il glisse un morceau de plus dans ton paquet sans rien dire.',
      },
      {
        id: 'froid',
        texte: 'Lui répondre que tu n’as besoin de rien',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Il hoche la tête. Il s’y attendait. Tu repars avec l’impression d’avoir laissé passer quelque chose de rare : un ennemi qui voulait cesser de l’être.',
      },
    ],
  },

  // ── Fil : Ryūji, le duel au bâton ────────────────────────────
  {
    ...base,
    id: 'e6_daichi',
    titre: 'Le duel au bâton',
    categorie: 'rivalite',
    lieu: '$terrain',
    poids: 6,
    si: { tout: [ENFANT, { age: { min: 7 } }] },
    texte: 'Ryūji, d’une autre classe, a planté deux bâtons dans la terre. « Le premier qui touche trois fois. » Une dizaine d’élèves font déjà cercle. Il te regarde toi, et personne d’autre.',
    choix: [
      {
        id: 'duel',
        texte: 'Ramasser le bâton',
        test: {
          type: 'combat',
          difficulte: 45,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { taijutsu: 1 },
          succes: {
            texte: 'Trois touches à deux. Ryūji jette son bâton dans la poussière et serre les poings. « Encore une fois. Pas aujourd’hui. Je m’entraînerai, et je reviendrai. » Il a les larmes aux yeux et il les déteste.',
            effets: [{ entrainer: 'taijutsu', jours: 12 }, { stat: 'social.reputation', delta: 2 }, { drapeau: 'daichi', valeur: 'battu' }, { retour: 'e6_daichi_revanche', chance: 0.8, entre: [120, 330] }],
          },
          echec: {
            texte: 'Il est plus rapide que toi, et il le sait. À la troisième touche, il lève son bâton vers le ciel. Tu rentres avec un bleu sur l’épaule et une idée fixe.',
            effets: [{ entrainer: 'taijutsu', jours: 8 }, { stat: 'jauges.sante', delta: -4 }, { drapeau: 'daichi', valeur: 'vainqueur' }, { retour: 'e6_daichi_revanche', chance: 0.6, entre: [150, 360] }],
          },
        },
      },
      {
        id: 'refuser',
        texte: 'Refuser devant tout le monde',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.reputation', delta: -2 }],
        resultat: '« Peureux·se. » Le mot court dans la cour jusqu’au soir. Tu le laisses courir. Tu sais pourquoi tu as dit non. Les autres, non, et c’est leur affaire.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_daichi_revanche',
    titre: 'Ryūji a tenu parole',
    categorie: 'rivalite',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'daichi', egal: 'battu' }, texte: 'Ryūji t’attend au même endroit, deux bâtons plantés dans la terre. Ses paumes sont couvertes de cals. « J’ai dit que je reviendrais. »' },
      { si: { drapeau: 'daichi', egal: 'vainqueur' }, texte: 'Ryūji t’attend au même endroit, deux bâtons plantés dans la terre. « On m’a dit que tu t’entraînais en cachette. Montre. »' },
      { si: { drapeau: 'daichi', egal: 'egalite' }, texte: 'Ryūji, encore. Les bâtons, encore. Le cercle d’élèves s’est agrandi : votre duel est devenu un spectacle. « La belle, cette fois. »' },
    ],
    choix: [
      {
        id: 'duel',
        texte: 'Ramasser le bâton',
        test: {
          type: 'combat',
          difficulte: 50,
          attributs: { agilite: 2, perception: 1 },
          maitrises: { taijutsu: 2 },
          succes: {
            texte: 'Il a progressé. Toi aussi, un peu plus. À la dernière touche, il ne jette pas son bâton : il te le tend, poignée en avant. « La prochaine fois, je te bats. Et la suivante, on s’entraîne ensemble. »',
            effets: [{ entrainer: 'taijutsu', jours: 15 }, { drapeau: 'daichi', valeur: 'egalite' }, { retour: 'e6_daichi_revanche', chance: 0.35, entre: [200, 400] }],
          },
          partiel: {
            texte: 'Deux touches partout, et le surveillant qui siffle la fin. Vous vous regardez, essoufflés, furieux d’être d’accord : ce n’est pas fini.',
            effets: [{ entrainer: 'taijutsu', jours: 12 }, { drapeau: 'daichi', valeur: 'egalite' }, { retour: 'e6_daichi_revanche', chance: 0.5, entre: [150, 300] }],
          },
          echec: {
            texte: 'Il a travaillé plus que toi. Ça se voit à chaque touche. Il ne triomphe pas, cette fois : il hoche la tête, comme un adulte. C’est ce qui te pique le plus.',
            effets: [{ entrainer: 'taijutsu', jours: 10 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'daichi', valeur: 'vainqueur' }],
          },
        },
      },
      {
        id: 'ensemble',
        texte: 'Lui proposer de s’entraîner plutôt ensemble',
        effets: [{ entrainer: 'taijutsu', jours: 20 }, { stat: 'jauges.fatigue', delta: 10 }, { drapeau: 'daichi', valeur: 'partenaire' }],
        resultat: 'Il te regarde comme si tu avais parlé une autre langue. Puis il arrache un bâton et te le lance. Tous les matins pendant un mois, vous vous battez sans compter les touches.',
      },
    ],
  },

  // ── Fil : Nanami, la fille de la caravane ────────────────────────
  {
    ...base,
    id: 'e6_mei',
    titre: 'La fille de la caravane',
    categorie: 'amitie',
    lieu: '$porte',
    poids: 5,
    si: ENFANT,
    texte: 'Une caravane de marchands campe deux jours devant la porte du village. Une fille de ton âge, Nanami, vend des noix grillées et des histoires de pays que tu ne connais que sur les cartes. Elle parle vite et rit fort.',
    choix: [
      {
        id: 'ecouter',
        texte: 'Passer les deux jours à l’écouter',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.charisme', delta: 1 }, { decouvrir: 'lieu:route_commerce' }, { drapeau: 'mei', valeur: 'amie' }, { retour: 'e6_mei_retour', chance: 0.65, entre: [300, 700] }],
        resultat: 'Elle te raconte le désert qui chante, les ponts de corde du pays de la Cascade, un marché où l’on vend des secrets au poids. Au départ, elle crie par-dessus les roues : « On repasse ! Garde-moi une histoire, toi aussi ! »',
      },
      {
        id: 'echanger',
        texte: 'Échanger ton plus beau kunai d’entraînement contre une carte',
        effets: [{ stat: 'attributs.perception', delta: 1 }, { objet: 'carte_mei' }, { drapeau: 'mei', valeur: 'echange' }, { retour: 'e6_mei_retour', chance: 0.65, entre: [300, 700] }],
        resultat: 'La carte est mal dessinée, tachée de thé, et tu la gardes sous ton oreiller. Nanami a ton kunai à la ceinture quand la caravane s’en va. « Je te le rapporterai affûté ! »',
      },
      {
        id: 'mefier',
        texte: 'T’en méfier : les marchands mentent',
        effets: [{ stat: 'attributs.perception', delta: 1 }],
        resultat: 'Tu l’observes de loin. Elle ne vole rien, ne ment pas plus que les autres. La caravane repart. Tu ne sauras jamais ce qu’elle avait à raconter.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_mei_retour',
    titre: 'La caravane repasse',
    categorie: 'amitie',
    lieu: '$porte',
    enchaine: true,
    si: ACTIF,
    texte: 'Des grelots devant la porte. La même caravane, les mêmes bâches rapiécées. Et Nanami, qui a grandi d’une main, saute du chariot avant qu’il s’arrête. « Je t’avais dit qu’on repasserait ! Alors, mon histoire ? »',
    choix: [
      {
        id: 'raconter',
        texte: 'Lui raconter ce que tu as vécu depuis',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: [
          { texte: 'Tu racontes l’Académie, les bleus, les nuits où tu as eu peur. Elle écoute comme personne ne t’écoute ici : sans rien attendre en retour.' },
          { si: { drapeau: 'mei', egal: 'echange' }, texte: 'Avant de partir, elle te rend ton kunai, affûté comme promis, et gravé d’un petit oiseau. « Pour que tu saches qu’il a voyagé. »' },
          { texte: '« La prochaine fois, on va loin, dit-elle. Plus loin que la Cascade. » Tu sais que ça n’arrivera peut-être jamais. Tu dis oui quand même.' },
        ],
      },
      {
        id: 'rumeur',
        texte: 'Lui demander ce qu’on raconte sur les routes',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { decouvrir: ['lieu:frontiere_herbe', 'lieu:marche_noir'] }, { indice: 'rumeur_routes' }],
        resultat: 'Elle baisse la voix. Des ninjas sans bandeau sur la route de l’Herbe. Un marché sous un pont où personne ne pose de questions. « Mon père dit qu’il faut se taire quand on voit des choses. Moi je te le dis à toi, c’est différent. »',
      },
    ],
  },

  // ── Fil : Shō, le voleur de dango ─────────────────────────────
  {
    ...base,
    id: 'e6_sho',
    titre: 'Le voleur de dango',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 5,
    si: ENFANT,
    texte: 'Un garçon maigre file entre les étals, trois brochettes de dango serrées contre lui. Le marchand hurle. Le garçon trébuche juste devant toi, et lève les yeux. Il s’appelle Shō, tu le sauras plus tard. Pour l’instant, il a peur.',
    choix: [
      {
        id: 'cacher',
        texte: 'Le cacher derrière toi et indiquer la mauvaise rue',
        effets: [{ ethique: { compassion: 5 } }, { stat: 'attributs.discretion', delta: 1 }, { drapeau: 'sho', valeur: 'sauve' }, { retour: 'e6_sho_retour', chance: 0.6, entre: [400, 900] }],
        resultat: 'Le marchand part en courant vers la mauvaise rue. Shō te fourre une brochette dans la main sans un mot, et disparaît. Elle est encore tiède.',
      },
      {
        id: 'payer',
        texte: 'Payer les dango au marchand',
        si: { stat: 'jauges.ryo', min: 6 },
        verrou: 'Tu n’as pas assez de ryō sur toi.',
        effets: [{ stat: 'jauges.ryo', delta: -6 }, { stat: 'social.reputation', delta: 2 }, { drapeau: 'sho', valeur: 'paye' }, { retour: 'e6_sho_retour', chance: 0.6, entre: [400, 900] }],
        resultat: 'Le marchand prend l’argent en grognant. Shō te regarde comme on regarde une énigme. Il ne te remercie pas. Il n’a jamais appris comment.',
      },
      {
        id: 'denoncer',
        texte: 'Le retenir pour le marchand',
        effets: [{ stat: 'social.reputation', delta: 3 }, { ethique: { honneur: 3, compassion: -4 } }, { drapeau: 'sho', valeur: 'denonce' }, { retour: 'e6_sho_retour', chance: 0.5, entre: [400, 900] }],
        resultat: 'Le marchand le secoue, le gifle, reprend ses dango à moitié écrasés. Shō ne pleure pas. Il te regarde, longtemps, pour retenir ton visage.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_sho_retour',
    titre: 'Shō',
    categorie: 'quotidien',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'sho', egal: 'denonce' }, texte: 'Une ruelle, le soir. Trois silhouettes te barrent le passage, et au milieu, un visage que tu n’as pas oublié non plus. Shō a grandi. Il a des amis, maintenant. « Tu te souviens de moi ? »' },
      { si: { un: [{ drapeau: 'sho', egal: 'sauve' }, { drapeau: 'sho', egal: 'paye' }] }, texte: 'Une ruelle, le soir. Trois garçons plus vieux te barrent le passage. Avant qu’ils ouvrent la bouche, une voix siffle derrière eux : « Pas celui-là. » Shō sort de l’ombre. Les trois s’écartent.' },
    ],
    choix: [
      {
        id: 'face',
        texte: 'Rester et le regarder en face',
        effets: [
          {
            si: { drapeau: 'sho', egal: 'denonce' },
            alors: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'sho', valeur: 'ennemi' }],
            sinon: [{ stat: 'attributs.perception', delta: 1 }, { indice: 'bande_sho' }, { drapeau: 'sho', valeur: 'allie' }],
          },
        ],
        resultat: [
          { si: { drapeau: 'sho', egal: 'ennemi' }, texte: 'Ils ne te frappent pas beaucoup. Juste assez. Shō se penche : « Maintenant tu sais ce que ça fait, d’être tenu par le col. » Tu rentres en boitant, avec la sensation d’avoir reçu une leçon que tu méritais à moitié.' },
          { si: { drapeau: 'sho', egal: 'allie' }, texte: '« La brochette, dit-il. On est quittes. » Il t’apprend en deux phrases quelles ruelles éviter après la nuit, et qui, au village, achète ce qui a été volé. Tu n’avais pas demandé à savoir.' },
        ],
      },
      {
        id: 'fuir',
        texte: 'Filer par les toits',
        effets: [{ stat: 'attributs.agilite', delta: 1 }],
        resultat: 'Tu es sur le toit avant qu’ils aient compris. En bas, Shō rit, pour la première fois depuis que tu le connais. « Pas mal ! » La ruelle se vide derrière toi.',
      },
    ],
  },

  // ── Fil : l'ermite à la feuille ───────────────────────────────
  {
    ...base,
    id: 'e6_ermite',
    titre: 'L’homme à la feuille',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 5,
    si: { tout: [ENFANT, { age: { min: 7 } }] },
    texte: 'Au bord de la rivière, un vieil homme est assis en tailleur, les yeux fermés. Une feuille d’érable tient sur son front sans tomber, alors que le vent souffle. Il ouvre un œil. « Tu regardes depuis un moment. Assieds-toi. »',
    choix: [
      {
        id: 'essayer',
        texte: 'T’asseoir et essayer',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { controleChakra: 2, controleEmotionnel: 1 },
          succes: {
            texte: 'La feuille tient trois respirations. Le vieil homme hoche la tête. « Reviens quand elle tiendra tout un après-midi. Je serai là. Ou pas. » Il se lève et s’en va, sans dire son nom.',
            effets: [{ stat: 'attributs.controleChakra', delta: 2 }, { drapeau: 'ermite', valeur: 'eleve' }, { retour: 'e6_ermite_retour', chance: 0.7, entre: [180, 420] }],
          },
          echec: {
            texte: 'La feuille tombe. Encore. Encore. Le vieil homme ne dit rien, ne rit pas. Quand tu relèves la tête, il est parti. La feuille, elle, est restée près de toi.',
            effets: [{ stat: 'attributs.controleChakra', delta: 1 }, { drapeau: 'ermite', valeur: 'essai' }, { retour: 'e6_ermite_retour', chance: 0.45, entre: [240, 480] }],
          },
        },
      },
      {
        id: 'partir',
        texte: 'Partir : on t’a appris à te méfier des inconnus',
        effets: [{ stat: 'attributs.perception', delta: 1 }],
        resultat: 'Tu t’éloignes. Quand tu te retournes, la rive est vide. Il n’y a même plus de traces dans la boue.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_ermite_retour',
    titre: 'La feuille d’érable',
    categorie: 'entrainement',
    lieu: '$terrain',
    enchaine: true,
    si: ACTIF,
    texte: 'Tu t’es entraîné·e. Une feuille sur le front, des après-midi entiers, sans savoir pourquoi. Et un jour, au bord de la rivière, il est là. Même posture. Même silence. « Alors ? »',
    choix: [
      {
        id: 'montrer',
        texte: 'Lui montrer',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          succes: {
            texte: 'La feuille tient. Le soleil passe d’un arbre à l’autre, et elle tient. Quand tu rouvres les yeux, il sourit. « Le chakra n’est pas une arme. C’est une attention. Tu viens de l’apprendre avant la moitié des jōnin. » Puis il part, pour de bon cette fois.',
            effets: [{ stat: 'attributs.controleChakra', delta: 3 }, { stat: 'jauges.chakraMax', delta: 5 }, { drapeau: 'ermite', valeur: 'reussi' }],
          },
          echec: {
            texte: 'Elle tombe au bout d’une heure. Il la ramasse, la pose dans ta main. « Une heure, c’est déjà une vie, pour une feuille. » Tu ne le reverras pas. Tu continueras quand même.',
            effets: [{ stat: 'attributs.controleChakra', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
          },
        },
      },
      {
        id: 'nom',
        texte: 'Lui demander enfin son nom',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.controleChakra', delta: 1 }],
        resultat: '« Je n’en ai plus besoin, dit-il. Je l’ai laissé dans une guerre. » Il t’apprend une respiration, une seule, et la répète jusqu’à ce que tu la saches. Puis il s’en va.',
      },
    ],
  },

  // ── Fil : la vieille Fumi et son chat ────────────────────────
  {
    ...base,
    id: 'e6_tomoe',
    titre: 'Le chat de la vieille Fumi',
    categorie: 'civils',
    lieu: '$village',
    poids: 5,
    si: ENFANT,
    texte: 'La vieille Fumi, qui vend des pickles au coin de ta rue, a perdu son chat. Elle ne pleure pas. Elle reste juste assise devant sa porte, à appeler un nom, doucement, comme si le chat pouvait avoir honte d’être parti.',
    choix: [
      {
        id: 'chercher',
        texte: 'Chercher le chat',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { perception: 2, discretion: 1 },
          succes: {
            texte: 'Tu le trouves coincé sous le plancher de l’entrepôt à riz, furieux et affamé. Fumi le serre contre elle et te fourre un pot de pickles dans les bras. « Reviens me voir, petit·e. Les vieux ont des choses à raconter. »',
            effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputation', delta: 2 }, { drapeau: 'tomoe', valeur: 'amie' }, { retour: 'e6_tomoe_retour', chance: 0.6, entre: [250, 600] }],
          },
          echec: { texte: 'Tu cherches jusqu’à la nuit, en vain. Le lendemain, le chat revient tout seul. Fumi te remercie quand même, et tu ne sais pas très bien de quoi.', effets: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'tomoe', valeur: 'connue' }] },
        },
      },
      {
        id: 'asseoir',
        texte: 'T’asseoir à côté d’elle',
        effets: [{ ethique: { compassion: 4 } }, { stat: 'attributs.charisme', delta: 1 }, { drapeau: 'tomoe', valeur: 'amie' }, { retour: 'e6_tomoe_retour', chance: 0.6, entre: [250, 600] }],
        resultat: 'Vous restez là, toi et elle, à appeler le chat. Elle te raconte comment elle l’a trouvé, l’hiver de la grande famine. Le chat finit par revenir, la queue haute, comme si rien n’était arrivé.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_tomoe_retour',
    titre: 'La porte de Fumi',
    categorie: 'deuil',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: 'Tu passes devant la boutique de pickles. Les volets sont fermés. Sur la marche, le chat est assis, seul. Une voisine t’explique, à voix basse : Fumi est partie dans son sommeil, il y a trois jours. « Elle parlait de toi, tu sais. »',
    choix: [
      {
        id: 'chat',
        texte: 'Prendre le chat avec toi',
        effets: [{ ethique: { compassion: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'chat_tomoe' }],
        resultat: 'Il te griffe, puis te suit. {Parent} soupire en le voyant, et lui pose une soucoupe de lait. C’est le premier mort que tu portes vraiment. Il pèse le poids d’un chat.',
      },
      {
        id: 'voisine',
        texte: 'Demander ce qu’elle disait de toi',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }],
        resultat: '« Qu’il y avait encore des enfants qui s’arrêtaient pour les vieux. Que ça la rassurait pour le village. » Tu rentres sans rien dire. Ce soir-là, tu restes longtemps éveillé·e.',
      },
    ],
  },

  // ── Fil : la boîte aux trésors ────────────────────────────────
  {
    ...base,
    id: 'e6_boite',
    titre: 'La boîte aux trésors',
    categorie: 'amitie',
    lieu: '$village',
    poids: 5,
    personnages: ['@coequipierA'],
    si: { tout: [ENFANT, { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }] },
    texte: '{@coequipierA} arrive avec une boîte en fer-blanc et une pelle trop grande. « On enterre nos trésors. On les déterre quand on sera ninjas. Juré. » Il faut y mettre quelque chose qui compte.',
    choix: [
      {
        id: 'enterrer',
        texte: 'Y mettre ton premier shuriken et une lettre à ton futur toi',
        effets: [{ relation: '@coequipierA', delta: { amitie: 8, attachement: 4 } }, { drapeau: 'boite_enterree' }, { retour: 'e6_boite_retour', chance: 0.75, entre: [900, 1500] }],
        resultat: 'Vous creusez sous le grand cèdre derrière l’Académie. {@coequipierA} écrit sa lettre en cachant la feuille avec son bras. Vous tassez la terre avec les pieds, solennellement, et vous jurez sur vos deux noms.',
      },
      {
        id: 'moquer',
        texte: 'Trouver ça puéril',
        effets: [{ relation: '@coequipierA', delta: { amitie: -4 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Tu ris. {@coequipierA} ne rit pas. La boîte est enterrée quand même, sans toi. Tu ne sauras jamais où.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_boite_retour',
    titre: 'Sous le grand cèdre',
    categorie: 'amitie',
    lieu: '$academie',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }, texte: '{@coequipierA} débarque un soir avec la même pelle, toujours trop grande. « Tu te souviens ? On est ninjas, maintenant. Plus ou moins. » Sous le cèdre, la boîte n’a pas bougé.' },
      { si: { non: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] } }, texte: 'Tu passes devant le grand cèdre et tu te souviens. Tu creuses seul·e, avec tes mains. La boîte est là. Il n’y a plus personne pour l’ouvrir avec toi.' },
    ],
    choix: [
      {
        id: 'ouvrir',
        texte: 'Ouvrir la boîte',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 2 },
          { si: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }, alors: [{ relation: '@coequipierA', delta: { amitie: 8, attachement: 6 } }] },
        ],
        resultat: [
          { texte: 'Ton shuriken a rouillé. Ta lettre dit, en grosses lettres tordues : « J’espère que tu n’as peur de rien. » Tu as peur de beaucoup de choses. Tu souris quand même.' },
          { si: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }, texte: 'La lettre de {@coequipierA} dit seulement : « J’espère qu’on est toujours ami·es. » Vous ne dites rien. Vous remettez les lettres dans la boîte, et vous l’enterrez de nouveau, pour dans dix ans.' },
          { si: { non: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] } }, texte: 'La lettre de {@coequipierA} est encore pliée. Tu ne l’ouvres pas. Tu la gardes sur toi.' },
        ],
      },
    ],
  },

  // ── Scènes d'enfance ──────────────────────────────────────────
  {
    ...base,
    id: 'e6_cerf_volant',
    titre: 'Le cerf-volant sur les toits',
    categorie: 'enfance',
    lieu: '$village',
    poids: 4,
    si: ENFANT,
    texte: 'Le cerf-volant d’une petite fille s’est pris dans la gouttière du toit le plus haut du quartier. Elle pleure. Les adultes disent qu’on ira chercher une échelle. Personne ne va chercher d’échelle.',
    choix: [
      {
        id: 'grimper',
        texte: 'Grimper par les murs',
        test: {
          type: 'competence',
          difficulte: 42,
          attributs: { agilite: 2, controleChakra: 1 },
          succes: { texte: 'Les prises sont minuscules, le vent aussi est contre toi. Tu décroches le cerf-volant et redescends avec. La petite fille te regarde comme on regarde un Kage.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: 'Tu glisses à mi-hauteur et retombes sur un tas de paille. Rien de cassé. Le cerf-volant reste là-haut, à te narguer, jusqu’à la saison des pluies.', effets: [{ stat: 'jauges.sante', delta: -5 }, { stat: 'attributs.agilite', delta: 1 }] },
        },
      },
      {
        id: 'nouveau',
        texte: 'Lui en fabriquer un nouveau',
        duree: 3,
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { ethique: { compassion: 3 } }],
        resultat: 'Du papier de riz, deux baguettes, de la colle de farine. Le tien vole de travers, mais il vole. Elle s’en fiche qu’il soit de travers.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_lucioles',
    titre: 'La nuit des lucioles',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    personnages: ['@coequipierB'],
    si: { tout: [ENFANT, { saison: 'ete' }, { pnj: '@coequipierB', etat: ['vivant', 'blesse'] }] },
    texte: '{@coequipierB} frappe à ta fenêtre en pleine nuit. « Viens. Les lucioles sont sorties, près de l’étang. Si on attend, il n’y en aura plus. » Tes parents dorment. La permission n’existe pas, à cette heure.',
    choix: [
      {
        id: 'sortir',
        texte: 'Sortir par la fenêtre',
        effets: [{ relation: '@coequipierB', delta: { amitie: 7, confiance: 4 } }, { stat: 'attributs.discretion', delta: 1 }, { stat: 'jauges.fatigue', delta: 8 }],
        resultat: 'Des centaines de lumières sur l’eau noire. Vous ne parlez pas. Vous rentrez à l’aube, les pieds trempés, et ce souvenir-là, personne ne pourra jamais te le prendre.',
      },
      {
        id: 'rester',
        texte: 'Refuser : demain, il y a l’Académie',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { relation: '@coequipierB', delta: { amitie: -2 } }],
        resultat: 'La fenêtre se referme. Le lendemain, {@coequipierB} a des yeux de quelqu’un qui a vu quelque chose de beau sans toi.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_bain_glace',
    titre: 'Le défi de la rivière',
    categorie: 'enfance',
    lieu: '$terrain',
    poids: 4,
    si: { tout: [ENFANT, { saison: 'hiver' }] },
    texte: 'Les grands ont décrété que les vrais ninjas se baignent dans la rivière en hiver. Une plaque de glace flotte près de la rive. Tout le monde te regarde : c’est ton tour.',
    choix: [
      {
        id: 'plonger',
        texte: 'Plonger',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { controleEmotionnel: 2, force: 1 },
          succes: { texte: 'Le froid te coupe le souffle, puis la pensée, puis tout. Tu ressors en riant comme un·e fou·folle. Les grands applaudissent. Tu ne sens plus tes pieds jusqu’au soir.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.reputation', delta: 2 }] },
          echec: { texte: 'Tu ressors bleu·e et tu passes trois jours au lit avec de la fièvre. {Parent} ne sait pas s’il faut te gronder ou te serrer dans ses bras. {Il:@parent} fait les deux.', effets: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'jauges.fatigue', delta: 10 }] },
        },
      },
      {
        id: 'non',
        texte: '« Les vrais ninjas ne meurent pas pour un pari »',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Un silence. Puis un des grands éclate de rire. « Bien répondu. » Personne ne plonge, finalement. Vous rentrez tous au sec, un peu soulagés.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_menuisier',
    titre: 'L’atelier du menuisier',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 4,
    si: ENFANT,
    texte: 'Le menuisier du quartier cherche des petites mains pour poncer des shuriken d’entraînement en bois. Il paie en ryō, et en copeaux qui sentent bon.',
    choix: [
      {
        id: 'travailler',
        texte: 'Travailler une semaine',
        duree: 7,
        effets: [{ stat: 'jauges.ryo', delta: 20 }, { stat: 'attributs.force', delta: 1 }, { stat: 'jauges.fatigue', delta: 10 }],
        resultat: 'Tes mains se couvrent d’échardes, puis de corne. Le menuisier ne parle presque pas, mais à la fin il te donne un shuriken en bois de cerisier, parfaitement équilibré. « Pour toi. »',
      },
      {
        id: 'apprendre',
        texte: 'Lui demander comment on équilibre un shuriken',
        effets: [{ entrainer: 'famille_kunai', jours: 10 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Il te montre en silence : le poids, le centre, le fil du bois. Tu comprends d’un coup pourquoi tes lancers partaient de travers. Ce n’était pas ta main. C’était l’arme.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_mensonge',
    titre: 'Le premier mensonge',
    categorie: 'enfance',
    lieu: '$maison',
    poids: 4,
    si: ENFANT,
    texte: 'Le vase de ta grand-mère est en morceaux. Tu jouais à l’intérieur, ce qui est interdit. {Parent} rentre dans une heure. Personne ne t’a vu·e.',
    choix: [
      {
        id: 'avouer',
        texte: 'Tout avouer dès son retour',
        effets: [{ ethique: { honneur: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: '{Parent} regarde les morceaux un long moment. Puis {il:@parent} te regarde, toi. « Le vase, on le recollera. Ce que tu viens de faire, ça ne se casse pas. » Tu es puni·e quand même. Ça ne te fait presque rien.',
      },
      {
        id: 'chat',
        texte: 'Accuser le chat des voisins',
        test: {
          type: 'competence',
          difficulte: 45,
          attributs: { charisme: 2, discretion: 1 },
          succes: { texte: '{Parent} te croit. C’est le pire : {il:@parent} te croit complètement. Le soir, le mensonge pèse plus lourd que le vase.', effets: [{ stat: 'attributs.charisme', delta: 1 }, { ethique: { honneur: -4 } }, { stat: 'attributs.discretion', delta: 1 }] },
          echec: { texte: '« Le chat des voisins est mort l’hiver dernier. » Ah. La punition dure un mois, et la honte un peu plus.', effets: [{ ethique: { honneur: -2 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'e6_fievre',
    titre: 'La fièvre',
    categorie: 'enfance',
    lieu: '$maison',
    poids: 3,
    si: ENFANT,
    texte: 'Une fièvre te cloue au lit. Les murs bougent, les sons arrivent de très loin. Dans le brouillard, tu sens une main fraîche sur ton front, toute la nuit.',
    choix: [
      {
        id: 'repos',
        texte: 'Te laisser soigner',
        duree: 7,
        effets: [{ stat: 'jauges.fatigue', delta: -20 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { relation: '@parent', delta: { attachement: 6 } }],
        resultat: 'Une semaine au lit. {Parent} dort assis à côté de toi, la tête contre le mur. Quand tu guéris, tu te souviens surtout de sa main.',
      },
      {
        id: 'reve',
        texte: 'Écouter les rêves de la fièvre',
        duree: 7,
        effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'jauges.fatigue', delta: -10 }],
        resultat: 'Tu rêves d’un grand feu, d’un renard, d’une porte qui s’ouvre sous l’eau. Au réveil, il t’en reste des images que tu dessines dans la marge de tes cahiers pendant des mois.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_masques',
    titre: 'Le marchand de masques',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 4,
    si: { tout: [ENFANT, { saison: ['ete', 'automne'] }] },
    texte: 'C’est le soir de la fête. Les lanternes rouges, les odeurs de calamar grillé, et un marchand qui vend des masques de renard, de chat, d’oni. Les enfants s’en servent pour jouer aux ninjas de l’ombre.',
    choix: [
      {
        id: 'renard',
        texte: 'Acheter un masque de renard et jouer avec les autres',
        si: { stat: 'jauges.ryo', min: 5 },
        verrou: 'Il te faudrait 5 ryō.',
        effets: [{ stat: 'jauges.ryo', delta: -5 }, { stat: 'attributs.discretion', delta: 2 }, { objet: 'masque_renard' }],
        resultat: 'Toute la nuit, vous vous traquez entre les stands. Tu restes introuvable pendant une heure entière, derrière un tonneau de saké. Personne n’a gagné. Tout le monde a gagné.',
      },
      {
        id: 'danser',
        texte: 'Aller danser avec les adultes',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.agilite', delta: 1 }],
        resultat: 'Tu ne connais pas les pas. À la troisième danse, si. Une vieille femme te félicite, un jōnin te fait tourner. Tu rentres les jambes en coton et le cœur léger.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_calligraphie',
    titre: 'L’épreuve de calligraphie',
    categorie: 'academie',
    lieu: '$academie',
    poids: 4,
    si: ENFANT,
    texte: 'Le professeur de calligraphie annonce une épreuve surprise : écrire le kanji de « patience » cent fois, sans une tache. « Un sceau mal tracé tue son lanceur. Commencez. »',
    choix: [
      {
        id: 'appliquer',
        texte: 'T’appliquer, trait après trait',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { intellect: 1, controleEmotionnel: 2 },
          succes: { texte: 'Cent fois. Pas une tache. Le professeur garde ta feuille et l’accroche au mur. Tu n’avais jamais compris pourquoi « patience » s’écrit avec un cœur sous une lame. Maintenant si.', effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
          echec: { texte: 'Une tache au soixante-douzième. Puis une autre. Le professeur ne dit rien, et te rend une feuille blanche. « Demain. » Tu recommences le lendemain, et le jour suivant.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }] },
        },
      },
      {
        id: 'sceau',
        texte: 'Demander à quoi ressemble un vrai sceau',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.controleChakra', delta: 1 }],
        resultat: 'Il hésite, puis trace devant toi un sceau d’alarme, d’un seul geste. L’encre frémit, une fraction de seconde. « Voilà pourquoi on apprend la patience d’abord. »',
      },
    ],
  },
  {
    ...base,
    id: 'e6_genin_regarder',
    titre: 'Ceux qui portent le bandeau',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 4,
    si: ENFANT,
    texte: 'Une équipe de genin s’entraîne sur le terrain d’à côté. Leurs kunai partent si vite que tu ne vois que les impacts. Leur jōnin les regarde sans rien dire, en lisant un livre.',
    choix: [
      {
        id: 'observer',
        texte: 'Observer en cachette tout l’après-midi',
        effets: [{ stat: 'attributs.perception', delta: 2 }, { entrainer: 'famille_kunai', jours: 8 }],
        resultat: 'Tu remarques que la plus petite de l’équipe lance mieux que les autres, en tournant le poignet au dernier moment. Le soir, tu essaies cent fois. À la cent unième, tu sens la différence.',
      },
      {
        id: 'demander',
        texte: 'Aller leur demander un conseil',
        test: {
          type: 'competence',
          difficulte: 40,
          attributs: { charisme: 2 },
          succes: { texte: 'Le jōnin lève les yeux de son livre. « Montre ton lancer. » Il corrige ta position de deux doigts, et repart dans sa lecture. Tes kunai ne partent plus jamais de la même façon.', effets: [{ entrainer: 'famille_kunai', jours: 15 }, { stat: 'attributs.charisme', delta: 1 }] },
          echec: { texte: '« Retourne à l’Académie, minus. » Les genin rient. Pas leur jōnin, qui t’a regardé·e partir avec un drôle d’air.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'e6_cache_cache',
    titre: 'Cache-cache ninja',
    categorie: 'enfance',
    lieu: '$village',
    poids: 4,
    si: ENFANT,
    texte: 'Toute la classe joue au cache-cache ninja dans le quartier des entrepôts : le chercheur a le droit d’utiliser tout ce qu’on a appris. Le dernier trouvé gagne le droit de ne pas balayer la salle pendant une semaine.',
    choix: [
      {
        id: 'cacher',
        texte: 'Trouver la meilleure cachette',
        test: {
          type: 'competence',
          difficulte: 45,
          attributs: { discretion: 2, perception: 1 },
          succes: { texte: 'Sous une barque retournée, enroulé·e dans un filet qui sent le poisson. Ils passent trois fois à côté de toi. À la nuit, on t’appelle pour rentrer : tu as gagné, et tu sens la marée.', effets: [{ stat: 'attributs.discretion', delta: 2 }, { stat: 'jauges.fatigue', delta: -5 }] },
          echec: { texte: 'Tu as éternué. Évidemment. Tu balaies la salle pendant une semaine, en préparant la revanche.', effets: [{ stat: 'attributs.discretion', delta: 1 }] },
        },
      },
      {
        id: 'chercher',
        texte: 'Te porter volontaire pour chercher',
        effets: [{ stat: 'attributs.perception', delta: 2 }],
        resultat: 'Une trace de pas dans la poussière, un chat qui fuit une cachette, un souffle trop régulier. Tu les trouves tous, un par un. Personne ne veut plus que tu cherches.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_lettre',
    titre: 'La lettre de mission',
    categorie: 'enfance',
    lieu: '$maison',
    poids: 3,
    si: { tout: [ENFANT, { non: { clan: 'sans_clan' } }] },
    texte: 'Un oiseau messager se pose sur le rebord de la fenêtre. Une lettre d’un membre de ta famille, parti en mission depuis trois mois. L’écriture est penchée, pressée. Il y a une tache brune dans le coin.',
    choix: [
      {
        id: 'lire',
        texte: 'La lire à voix haute pour toute la maison',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'social.confianceClan', delta: 3 }],
        resultat: '« Tout va bien. Il pleut. Mange tes légumes. » Personne ne parle de la tache. Tout le monde y pense. La lettre est rangée dans le tiroir à souvenirs, avec les autres.',
      },
      {
        id: 'repondre',
        texte: 'Écrire une réponse, même si elle n’arrivera pas',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Tu écris tout : l’Académie, ton rival, le chat du voisin. L’oiseau repart avec. Trois semaines plus tard, il revient avec un seul mot : « Continue. »',
      },
    ],
  },
  {
    ...base,
    id: 'e6_funerailles',
    titre: 'Les funérailles d’un inconnu',
    categorie: 'deuil',
    lieu: '$village',
    poids: 3,
    si: { tout: [ENFANT, { age: { min: 8 } }] },
    texte: 'Tout le village est en noir. Un chūnin que tu ne connaissais pas est tombé à la frontière. Sa photo est posée devant la stèle, entre deux bougies. Il avait l’air jeune. Plus jeune que tes parents.',
    choix: [
      {
        id: 'rester',
        texte: 'Rester jusqu’au bout de la cérémonie',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.loyaute', delta: 3 }],
        resultat: 'Le Kage parle de la Volonté du village. Une petite fille dépose une fleur et ne pleure pas. Tu comprends pour la première fois que ton bandeau, un jour, voudra dire ça aussi.',
      },
      {
        id: 'question',
        texte: 'Demander à {parent} pourquoi on devient ninja',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { relation: '@parent', delta: { confiance: 4 } }],
        resultat: '{Parent} réfléchit longtemps. « Pour que d’autres n’aient pas à le devenir. » Ce n’est pas une réponse. C’est la seule qu’{il:@parent} ait.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_bagarre_ami',
    titre: 'Pour {@coequipierB}',
    categorie: 'amitie',
    lieu: '$academie',
    poids: 4,
    personnages: ['@coequipierB'],
    si: { tout: [ENFANT, { pnj: '@coequipierB', etat: ['vivant', 'blesse'] }] },
    texte: 'Dans la cour, trois élèves ont encerclé {@coequipierB}. Ils se moquent de sa famille, de ses vêtements, de sa façon de parler. {@coequipierB} serre les poings et ne dit rien.',
    choix: [
      {
        id: 'intervenir',
        texte: 'T’interposer',
        test: {
          type: 'combat',
          difficulte: 46,
          attributs: { force: 1, agilite: 1, charisme: 1 },
          maitrises: { taijutsu: 1 },
          succes: { texte: 'Tu te plantes entre eux. Il y a une bousculade, un coup, puis le surveillant qui siffle. Ils partent. {@coequipierB} ne te remercie pas tout de suite. Le lendemain, il y a un onigiri en plus dans ton sac.', effets: [{ relation: '@coequipierB', delta: { amitie: 8, confiance: 6 } }, { entrainer: 'taijutsu', jours: 6 }] },
          echec: { texte: 'Vous finissez à deux par terre, couverts de poussière. Mais à deux. {@coequipierB} rit en crachant de la terre. C’est la première fois que tu l’entends rire.', effets: [{ relation: '@coequipierB', delta: { amitie: 10 } }, { stat: 'jauges.sante', delta: -6 }] },
        },
      },
      {
        id: 'maitre',
        texte: 'Aller chercher un professeur',
        effets: [{ relation: '@coequipierB', delta: { amitie: 3 } }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Les trois sont punis. {@coequipierB} t’en veut un peu d’avoir eu besoin d’aide. Puis moins. Puis plus du tout.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_pluie',
    titre: 'Jour de pluie',
    categorie: 'quotidien',
    lieu: '$maison',
    poids: 4,
    si: { tout: [ENFANT, { saison: ['printemps', 'automne'] }] },
    texte: 'Il pleut depuis trois jours. Le terrain est une mare, l’Académie a fermé ses portes. Sur l’étagère, il y a les vieux rouleaux de {clanOuFamille}, que personne ne lit jamais.',
    choix: [
      {
        id: 'rouleaux',
        texte: 'Lire les vieux rouleaux',
        duree: 3,
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { decouvrir: 'histoire:deuxieme_guerre' }],
        resultat: 'Des listes de noms, des recettes d’onguent, une carte du village quand il n’avait que trois rues. Et, dans la marge, une écriture d’enfant qui a fait les mêmes fautes que toi.',
      },
      {
        id: 'interieur',
        texte: 'T’entraîner à l’intérieur, en silence',
        duree: 3,
        effets: [{ stat: 'attributs.discretion', delta: 1 }, { stat: 'attributs.controleChakra', delta: 1 }],
        resultat: 'Des pompes sur les doigts, des pas sans bruit sur le plancher qui grince. Au bout de trois jours, il ne grince plus sous tes pieds. Ça te paraît être la plus grande victoire de l’année.',
      },
    ],
  },
  {
    ...base,
    id: 'e6_grand_cedre',
    titre: 'Le concours du grand cèdre',
    categorie: 'enfance',
    lieu: '$terrain',
    poids: 4,
    si: ENFANT,
    texte: 'Le grand cèdre derrière l’Académie a une branche marquée d’un ruban rouge, tout en haut. La légende dit que le Kage l’a touchée à sept ans. Chaque génération d’élèves essaie.',
    choix: [
      {
        id: 'grimper',
        texte: 'Tenter la branche au ruban',
        test: {
          type: 'competence',
          difficulte: 50,
          attributs: { agilite: 2, force: 1, controleEmotionnel: 1 },
          succes: { texte: 'Tes doigts touchent le ruban. Il est délavé, effiloché, et quelqu’un a gravé dans l’écorce des dizaines de petits noms. Tu ajoutes le tien. Personne ne te croira, et ça n’a aucune importance.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'ruban_cedre' }] },
          echec: { texte: 'Au deux tiers, la branche craque et tu redescends plus vite que prévu. Égratignures, orgueil froissé. Il reste des années pour réessayer.', effets: [{ stat: 'jauges.sante', delta: -5 }, { stat: 'attributs.agilite', delta: 1 }] },
        },
      },
      {
        id: 'regarder',
        texte: 'Regarder les autres essayer',
        effets: [{ stat: 'attributs.perception', delta: 2 }],
        resultat: 'Tu repères les branches qui cèdent, les prises qui tiennent, le moment où chacun a peur. Le jour où tu essaieras, tu sauras. Ce n’est pas encore aujourd’hui.',
      },
    ],
  },
];
