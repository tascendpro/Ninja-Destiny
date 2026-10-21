import type { Condition, EventDef } from '../../engine/types';

const ACTIF: Condition = { statut: 'actif' };
const MUR: Condition = { tout: [ACTIF, { age: { min: 31 } }] };
const FAMILLE: Condition = { tout: [ACTIF, { drapeau: 'famille_fondee' }] };
const ENFANT_VIVANT: Condition = { drapeau: 'enfant_mort', absent: true };
const CONJOINT_VIVANT: Condition = { drapeau: 'conjoint_mort', absent: true };
const PARENT_VIVANT: Condition = { pnj: '@parent', etat: ['vivant', 'blesse'] };
const base = { chapitre: 4, chapitres: [4, 5, 6], arc: 'heritage' as const };

/**
 * La maturité (31 ans et plus) : un enfant qui grandit trop vite, des parents qui vieillissent,
 * un genou qui prévient avant la pluie. Et ceux qu'on a croisés enfants, devenus adultes à leur tour.
 */
export const MATURITE: EventDef[] = [
  // ── L'enfant qui grandit ──────────────────────────────────────
  {
    ...base,
    id: 'm31_rentree',
    titre: 'Le premier jour de {enfantNom}',
    categorie: 'heritage',
    lieu: '$academie',
    poids: 6,
    si: { tout: [FAMILLE, ENFANT_VIVANT, { age: { min: 28, max: 36 } }] },
    texte: 'Devant l’Académie, {enfantNom} serre ta main si fort que tes doigts blanchissent. Les mêmes portes, la même cour, le même arbre. Tu as l’impression de te voir, il y a vingt-cinq ans, avec quelqu’un d’autre qui tenait ta main.',
    choix: [
      {
        id: 'lacher',
        texte: 'Lâcher sa main la première',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }],
        resultat: '{Enfant_il} fait trois pas, se retourne, hésite. Tu hoches la tête. {Enfant_il} court rejoindre les autres et ne se retourne plus. Tu restes devant la porte bien après que la cloche a sonné.',
      },
      {
        id: 'kunai',
        texte: 'Lui donner ton premier kunai d’entraînement',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { drapeau: 'kunai_transmis' }],
        resultat: '{Enfant_il} le prend comme un trésor. Il est émoussé, rayé, trop grand pour sa main. Ce soir, {enfant_il} dormira avec. Tu le sais parce que tu faisais pareil.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_bagarre',
    titre: '{Enfant} s’est battu{enfant_e}',
    categorie: 'heritage',
    lieu: '$maison',
    poids: 5,
    si: { tout: [FAMILLE, ENFANT_VIVANT, { age: { min: 30, max: 40 } }] },
    texte: [
      { texte: '{enfantNom} rentre avec la lèvre fendue et les poings écorchés. Un plus grand voulait son goûter. {Enfant_il} ne l’a pas donné.' },
      { si: { un: [{ drapeau: 'gonta', egal: 'ami' }, { drapeau: 'gonta', egal: 'respect' }, { drapeau: 'gonta', egal: 'compris' }] }, texte: 'Le plus grand, c’est le fils de Gonta. Évidemment. Le monde a un drôle de sens de l’humour.' },
    ],
    choix: [
      {
        id: 'fier',
        texte: 'Lui dire que tu es fier·ère',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: '{Enfant_il} redresse la tête. Tu soignes sa lèvre en lui racontant l’histoire d’un sac de riz et d’un grand du quartier. {Enfant_il} ne te croit qu’à moitié. C’est bien assez.',
      },
      {
        id: 'apprendre',
        texte: 'Lui apprendre à éviter les coups plutôt qu’à les rendre',
        duree: 7,
        effets: [{ entrainer: 'taijutsu', jours: 8 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Une semaine dans la cour, tous les soirs. Esquiver, reculer, laisser l’autre se fatiguer. « C’est nul, dit {enfant_il}. C’est pas comme ça qu’on gagne. » « Non. C’est comme ça qu’on rentre à la maison. »',
      },
    ],
  },
  {
    ...base,
    id: 'm31_eveil_enfant',
    titre: 'Ce qui se réveille chez {enfantNom}',
    categorie: 'eveil',
    lieu: '$maison',
    poids: 4,
    si: { tout: [FAMILLE, ENFANT_VIVANT, { age: { min: 32, max: 42 } }, { non: { clan: 'sans_clan' } }] },
    texte: 'Au dîner, {enfantNom} renverse son bol. Pas par maladresse : le bol a bougé tout seul, comme repoussé par quelque chose. {Enfant_il} te regarde, terrifié{enfant_e}. Le sang de {clanOuFamille} ne dort jamais longtemps.',
    choix: [
      {
        id: 'rassurer',
        texte: 'Lui dire que ça t’est arrivé aussi',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.confianceClan', delta: 3 }],
        resultat: 'Tu racontes ta propre première fois, la peur, la honte. {Enfant_il} écoute en serrant ta manche. Cette nuit-là, tu montes la garde devant sa porte, sans savoir contre quoi.',
      },
      {
        id: 'clan',
        texte: 'L’emmener voir l’ancien du clan dès demain',
        effets: [{ stat: 'social.confianceClan', delta: 5 }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'L’ancien examine {enfantNom} longtemps, puis te regarde. « Plus fort que toi à son âge. » Tu ne sais pas si c’est une bonne nouvelle. L’ancien non plus.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_jamais_la',
    titre: '« Tu n’es jamais là »',
    categorie: 'heritage',
    lieu: '$maison',
    poids: 5,
    si: { tout: [FAMILLE, ENFANT_VIVANT, { age: { min: 36, max: 48 } }] },
    texte: 'Tu rentres d’une mission de trois semaines. {enfantNom} ne lève pas les yeux de son rouleau. « Tu as raté mon examen. Et la fête. Et l’autre fête. Tu n’es jamais là. » La porte de sa chambre claque. La phrase reste dans la pièce.',
    choix: [
      {
        id: 'frapper',
        texte: 'Frapper à sa porte et attendre',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'jauges.fatigue', delta: 10 }],
        resultat: 'Une heure assis·e dans le couloir. Puis la porte s’entrouvre. Vous ne parlez pas de la mission. Vous parlez de l’examen, de la fête, de tout ce que tu as raté. Tu écoutes tout. C’est la seule chose qui ne se rate pas deux fois.',
      },
      {
        id: 'demander',
        texte: 'Demander moins de missions longues',
        effets: [{ stat: 'social.reputation', delta: -3 }, { stat: 'social.influence', delta: -2 }, { stat: 'attributs.charisme', delta: 2 }, { drapeau: 'missions_reduites' }],
        resultat: 'Ton chef d’unité soupire, puis signe. « Les meilleurs finissent toujours par demander ça. » La semaine suivante, tu es là pour le dîner. Et celle d’après. {enfantNom} fait semblant de ne pas le remarquer.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_premiere_mission_enfant',
    titre: 'La première mission de {enfantNom}',
    categorie: 'heritage',
    lieu: '$porte',
    poids: 5,
    si: { tout: [FAMILLE, ENFANT_VIVANT, { age: { min: 40, max: 50 } }] },
    texte: '{enfantNom} est genin. Ce matin, son équipe part pour une mission de rang C, escorter un marchand jusqu’au pays des Vagues. Rang C. C’est ce qu’on disait aussi, à l’époque, pour certaines missions qui ne l’étaient pas.',
    choix: [
      {
        id: 'confiance',
        texte: 'Lui faire confiance et rester au village',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 3 },
          { hasard: [{ poids: 80, effets: [{ drapeau: 'mission_enfant', valeur: 'bien' }] }, { poids: 20, effets: [{ drapeau: 'mission_enfant', valeur: 'blesse' }] }] },
          { retour: 'm31_retour_enfant', chance: 1, entre: [15, 30] },
        ],
        resultat: 'Tu regardes l’équipe partir depuis le mur. {enfantNom} ne se retourne pas. Tu ne dors presque pas pendant deux semaines, et tu fais très bien semblant devant tout le monde.',
      },
      {
        id: 'suivre',
        texte: 'Le suivre en secret',
        test: {
          type: 'competence',
          difficulte: 55,
          attributs: { discretion: 3, perception: 1 },
          succes: { texte: 'Deux semaines à trois arbres de distance. Tu n’interviens pas une seule fois. Au retour, son sensei te croise à la porte et te glisse : « Bonne filature. Ne recommencez pas. »', effets: [{ stat: 'attributs.discretion', delta: 2 }, { drapeau: 'mission_enfant', valeur: 'bien' }, { retour: 'm31_retour_enfant', chance: 1, entre: [15, 30] }] },
          echec: { texte: '{enfantNom} te repère au deuxième jour. Devant toute son équipe. {Enfant_il} ne t’adresse plus la parole jusqu’à la fin de la mission, et un peu après.', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'mission_enfant', valeur: 'vexe' }, { retour: 'm31_retour_enfant', chance: 1, entre: [15, 30] }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm31_retour_enfant',
    titre: 'Le retour de {enfantNom}',
    categorie: 'heritage',
    lieu: '$porte',
    enchaine: true,
    si: ACTIF,
    texte: [
      { si: { drapeau: 'mission_enfant', egal: 'bien' }, texte: 'L’équipe passe la porte au crépuscule, couverte de boue. {enfantNom} te voit, hésite une seconde entre la dignité de genin et l’envie de courir, et court.' },
      { si: { drapeau: 'mission_enfant', egal: 'blesse' }, texte: 'L’équipe passe la porte au crépuscule. {enfantNom} a le bras en écharpe et un bandage autour de la tête. « Ce n’était pas un rang C », dit-{enfant_il} simplement. Tu le savais. Tu l’avais toujours su.' },
      { si: { drapeau: 'mission_enfant', egal: 'vexe' }, texte: 'L’équipe passe la porte. {enfantNom} passe devant toi sans s’arrêter. Puis revient sur ses pas, et te tend un coquillage du pays des Vagues, sans un mot.' },
    ],
    choix: [
      {
        id: 'ecouter',
        texte: 'Écouter le récit de la mission',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Le récit dure toute la soirée. Il y a des exagérations, des héros, un pont, un vieux charpentier. Tu reconnais dans chaque phrase la façon dont tu racontais tes propres missions, à son âge. Le monde tourne en rond, mais il tourne.',
      },
    ],
  },

  // ── Le conjoint ───────────────────────────────────────────────
  {
    ...base,
    id: 'm31_soir',
    titre: 'Un soir ordinaire',
    categorie: 'romance',
    lieu: '$maison',
    poids: 4,
    si: { tout: [FAMILLE, CONJOINT_VIVANT, { age: { min: 30 } }] },
    texte: 'Un soir sans mission, sans alerte, sans rien. {conjointNom} pose deux tasses sur la table de la véranda. Les grillons. Le village qui s’éteint fenêtre après fenêtre. « Tu sais combien de soirs comme celui-là on a eus, cette année ? » Tu ne sais pas. Pas beaucoup.',
    choix: [
      {
        id: 'rester',
        texte: 'Ne rien dire, et rester',
        effets: [{ stat: 'jauges.fatigue', delta: -30 }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Vous restez jusqu’à ce que le thé soit froid et les grillons silencieux. Personne ne parle de missions. C’est la nuit de l’année dont tu te souviendras le mieux, et il ne s’y est rien passé.',
      },
      {
        id: 'promettre',
        texte: 'Promettre qu’il y en aura plus',
        effets: [{ stat: 'attributs.charisme', delta: 1 }, { stat: 'jauges.fatigue', delta: -20 }],
        resultat: '{conjointNom} sourit, de ce sourire qui veut dire « je sais que tu ne pourras pas tenir ». {conjointNom} prend ta main quand même. Une promesse impossible, c’est encore une promesse.',
      },
    ],
  },

  // ── Les parents qui vieillissent ──────────────────────────────
  {
    ...base,
    id: 'm31_parent_oubli',
    titre: '{Parent} oublie',
    categorie: 'deuil',
    lieu: '$maison',
    poids: 5,
    personnages: ['@parent'],
    si: { tout: [MUR, PARENT_VIVANT] },
    texte: '{Parent} t’appelle par le prénom d’un de ses camarades morts à la guerre. Puis se reprend, en riant. Puis, une heure plus tard, te demande si tu as bien révisé pour l’examen de l’Académie.',
    choix: [
      {
        id: 'jouer',
        texte: 'Répondre que oui, tu as bien révisé',
        effets: [{ ethique: { compassion: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@parent', delta: { attachement: 6 } }, { retour: 'm31_parent_adieu', chance: 0.7, entre: [300, 1100] }],
        resultat: '« Bien. Ne lance pas trop fort au début. Ils regardent surtout la posture. » {Il:@parent} a raison. {Il:@parent} avait déjà raison il y a trente ans. Tu hoches la tête, et tu gardes ce conseil comme si c’était le premier.',
      },
      {
        id: 'medecin',
        texte: 'Faire venir un médecin ninja',
        effets: [{ stat: 'jauges.ryo', delta: -40 }, { stat: 'attributs.intellect', delta: 1 }, { relation: '@parent', delta: { confiance: 4 } }, { retour: 'm31_parent_adieu', chance: 0.55, entre: [600, 1500] }],
        resultat: 'Le médecin pose les mains sur sa tempe, longtemps. « On peut ralentir. Pas arrêter. » {Parent} écoute le diagnostic avec un calme de jōnin. Puis te demande ce qu’il y a à dîner.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_parent_adieu',
    titre: 'Le dernier hiver de {parent}',
    categorie: 'deuil',
    lieu: '$maison',
    enchaine: true,
    personnages: ['@parent'],
    si: { tout: [ACTIF, PARENT_VIVANT] },
    texte: '{Parent} ne se lève plus. {Il:@parent} le sait, et toi aussi. Ce matin, {il:@parent} te fait signe d’approcher, avec un regard parfaitement clair, comme si le brouillard s’était levé pour une heure.',
    choix: [
      {
        id: 'ecouter',
        texte: 'T’asseoir et écouter',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { relation: '@parent', delta: { attachement: 10 } },
          { pnjEtat: '@parent', etat: 'mort', cause: 'dans son sommeil, au bout d’une longue vie' },
        ],
        resultat: '« Tu as été un·e bon·ne ninja. Ce n’est pas le plus important. Tu as été quelqu’un de bien. Ça, je n’en étais pas sûr{e:@parent}, quand tu avais six ans. » {Il:@parent} rit, tousse, ferme les yeux. {Il:@parent} part dans la nuit, pendant que tu dors à côté.',
      },
      {
        id: 'raconter',
        texte: 'Lui raconter une dernière fois ton premier jour à l’Académie',
        effets: [
          { stat: 'attributs.controleEmotionnel', delta: 3 },
          { stat: 'attributs.charisme', delta: 1 },
          { pnjEtat: '@parent', etat: 'mort', cause: 'dans son sommeil, au bout d’une longue vie' },
        ],
        resultat: 'Tu racontes la main serrée trop fort, les portes immenses, la cour. {Parent} complète les détails que tu avais oubliés, en souriant. Au milieu d’une phrase, {il:@parent} s’endort. {Il:@parent} ne se réveille pas.',
      },
    ],
  },

  // ── Le corps qui compte les années ────────────────────────────
  {
    ...base,
    id: 'm31_genou',
    titre: 'Le genou',
    categorie: 'blessure',
    lieu: '$terrain',
    poids: 4,
    si: { tout: [MUR, { age: { min: 34 } }] },
    texte: 'À l’entraînement du matin, un chūnin de vingt ans te bat au sprint. Pas de beaucoup. Ton genou gauche, celui de la vieille blessure, a prévenu avant la pluie, comme toujours maintenant.',
    choix: [
      {
        id: 'adapter',
        texte: 'Changer ta façon de te battre',
        effets: [{ stat: 'attributs.intellect', delta: 2 }, { stat: 'attributs.perception', delta: 1 }, { stat: 'attributs.agilite', delta: -1 }],
        resultat: 'Tu ne cours plus après l’adversaire. Tu le fais venir. Le chūnin de vingt ans perd les trois combats suivants sans comprendre comment. L’expérience, c’est la vitesse qui a changé d’endroit.',
      },
      {
        id: 'forcer',
        texte: 'Le battre au sprint, coûte que coûte',
        test: {
          type: 'competence',
          difficulte: 55,
          attributs: { agilite: 2, controleEmotionnel: 1 },
          succes: { texte: 'Tu gagnes d’un souffle. Le chūnin te félicite. Ton genou te le fait payer pendant trois jours. Ça valait le coup. Probablement.', effets: [{ stat: 'jauges.fatigue', delta: 15 }, { stat: 'social.reputation', delta: 1 }] },
          echec: { texte: 'Quelque chose craque dans ton genou. Le médecin est catégorique : six semaines. Et « à votre âge, il faudrait peut-être… » Tu ne le laisses pas finir.', effets: [{ blessure: { id: 'genou_vieux', nom: 'Genou abîmé', gravite: 2, jours: 40 } }] },
        },
      },
    ],
  },
  {
    ...base,
    id: 'm31_cheveux',
    titre: 'Le premier cheveu blanc',
    categorie: 'quotidien',
    lieu: '$maison',
    poids: 3,
    si: { tout: [MUR, { age: { min: 38 } }] },
    texte: 'Dans le miroir de la salle d’eau, au-dessus de la tempe : un cheveu blanc. Puis deux. Tu as passé l’âge auquel ton premier sensei a pris sa retraite.',
    choix: [
      {
        id: 'arracher',
        texte: 'L’arracher',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Tu l’arraches. Le lendemain, il y en a trois. Tu ris tout·e seul·e devant le miroir. La guerre contre le temps est la seule qu’aucun ninja n’a jamais gagnée.',
      },
      {
        id: 'garder',
        texte: 'Le garder : tu les as mérités',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: 'Chacun correspond à quelque chose. Celui-ci à la guerre. Celui-là, sûrement, à tes élèves. Tu les laisses. Les jeunes chūnin, désormais, baissent un peu la voix quand tu entres.',
      },
    ],
  },

  // ── Ce qu'on laisse derrière soi ──────────────────────────────
  {
    ...base,
    id: 'm31_legende',
    titre: 'Les enfants qui jouent à être toi',
    categorie: 'reputation',
    lieu: '$village',
    poids: 4,
    si: { tout: [MUR, { stat: 'social.reputation', min: 40 }] },
    texte: 'Dans une ruelle, une bande d’enfants joue aux ninjas. L’un d’eux crie : « Moi je suis {prenom} ! » et fait une pose ridicule, le poing levé. Les autres protestent : c’est toujours lui qui fait {prenom}.',
    choix: [
      {
        id: 'montrer',
        texte: 'Leur montrer la vraie pose',
        effets: [{ stat: 'social.reputation', delta: 3 }, { stat: 'attributs.charisme', delta: 2 }],
        resultat: 'Ils te reconnaissent au troisième mot. Silence total. Puis vingt questions en même temps. Tu leur montres la vraie pose, qui est beaucoup moins impressionnante. Ils préfèrent la fausse. Ils ont raison.',
      },
      {
        id: 'passer',
        texte: 'Passer sans te faire reconnaître',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu passes ton chemin en souriant sous ton col. Ton nom vit déjà sans toi, dans une ruelle, sous la forme d’une pose ridicule. C’est une drôle d’immortalité. Ça te va.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_promo',
    titre: 'La réunion de la promotion',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    si: { tout: [MUR, { age: { min: 33 } }] },
    texte: 'Quelqu’un a eu l’idée de réunir votre promotion de l’Académie. Une grande table à la taverne, trente places préparées. Il en manque beaucoup. Sur les chaises vides, on a posé une coupelle de saké.',
    choix: [
      {
        id: 'toast',
        texte: 'Lever ton verre pour les chaises vides',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.loyaute', delta: 3 }, { si: { pnj: '@rival', etat: ['vivant', 'blesse'] }, alors: [{ relation: '@rival', delta: { respect: 6 } }] }],
        resultat: [
          { texte: 'Tu dis leurs noms, un par un. Tu n’oublies personne. La table se tait, puis quelqu’un raconte une bêtise d’enfance sur l’un d’eux, et tout le monde rit en pleurant.' },
          { si: { pnj: '@rival', etat: ['vivant', 'blesse'] }, texte: '{@rival} est là, au bout de la table. Vos regards se croisent. {Il:@rival} lève son verre vers toi, une fraction de seconde. Trente ans de rivalité dans un geste. Ça suffit.' },
        ],
      },
      {
        id: 'souvenirs',
        texte: 'Raconter les meilleures bêtises de la promotion',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'jauges.fatigue', delta: -15 }],
        resultat: 'La fois où quelqu’un a teint le chien du directeur en bleu. La nuit dans la forêt interdite. Le concours du grand cèdre. Vous fermez la taverne. Vous avez trente-cinq ans et douze ans en même temps.',
      },
    ],
  },
  {
    ...base,
    id: 'm31_bureau',
    titre: 'Le bureau qu’on te propose',
    categorie: 'politique',
    lieu: '$village',
    poids: 4,
    si: { tout: [MUR, { age: { min: 40 } }, { rangMin: 'jonin' }] },
    texte: 'Le conseil te propose un bureau : chef de la formation des chūnin. Plus de missions longues, plus de frontière. Un vrai lit tous les soirs. « Vous avez assez donné », dit le conseiller. Tu entends aussi : « Vous êtes trop lent·e, maintenant. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter',
        effets: [{ stat: 'social.influence', delta: 6 }, { stat: 'jauges.fatigue', delta: -20 }, { stat: 'attributs.charisme', delta: 2 }, { drapeau: 'bureau_formation' }],
        resultat: 'Tu formes trois promotions de chūnin. Certains te détestent, la plupart te respectent, quelques-uns reviennent te voir des années après. Tu découvres qu’on peut protéger le village autrement qu’avec un kunai.',
      },
      {
        id: 'refuser',
        texte: 'Refuser : tant que tes jambes te portent',
        effets: [{ stat: 'social.reputation', delta: 3 }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Le conseiller hausse les épaules. « La proposition reste ouverte. » Elle reste ouverte. Tu le sais, et ça t’aide à repartir, chaque fois, vers la frontière.',
      },
    ],
  },

  // ── Ceux qu'on a croisés enfants, devenus adultes ─────────────
  {
    ...base,
    id: 'x_ryuji_vieux',
    titre: 'Ryūji, et deux bâtons',
    categorie: 'amitie',
    lieu: '$terrain',
    poids: 5,
    si: { tout: [MUR, { drapeau: 'daichi' }] },
    texte: 'Ryūji t’attend au terrain d’entraînement, deux vieux bâtons plantés dans la terre. Il a les tempes grises et une jambe raide. « Je prends ma retraite demain. Je voulais finir comme on a commencé. Trois touches. »',
    choix: [
      {
        id: 'duel',
        texte: 'Ramasser le bâton',
        effets: [{ entrainer: 'taijutsu', jours: 5 }, { stat: 'attributs.controleEmotionnel', delta: 3 }],
        resultat: 'Vous êtes lents, tous les deux, et vous trichez avec une expérience de trente ans. Deux touches partout. Vous vous arrêtez sans vous concerter. « Égalité, dit Ryūji. Comme ça, personne n’a perdu. » Des jeunes chūnin regardent, sans comprendre pourquoi deux vieux rient autant.',
      },
      {
        id: 'boire',
        texte: 'Lui proposer plutôt un verre',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'jauges.fatigue', delta: -15 }],
        resultat: 'Il hésite, puis arrache les bâtons du sol. « Un verre. Mais je garde les bâtons. » Vous parlez jusqu’à la nuit de tous les duels, ceux que tu as gagnés et ceux qu’il prétend avoir gagnés.',
      },
    ],
  },
  {
    ...base,
    id: 'x_akane_jonin',
    titre: 'Akane commande',
    categorie: 'heritage',
    lieu: '$porte',
    poids: 5,
    si: { tout: [MUR, { drapeau: 'aoi' }] },
    texte: 'Pour la mission de la semaine, on t’assigne à une unité dont tu n’es pas le chef. La jōnin qui commande se présente, le carnet usé à la ceinture. Akane. La petite du premier rang. « Je ne vous demanderai pas de m’appeler capitaine. Mais j’apprécierais. »',
    choix: [
      {
        id: 'capitaine',
        texte: '« À vos ordres, capitaine. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'social.reputation', delta: 2 }, { ethique: { honneur: 2 } }],
        resultat: 'Elle commande bien. Mieux que toi au même âge. Au retour, devant la porte, elle sort son carnet et coche une ligne. Tu ne demandes pas laquelle. Tu le sais.',
      },
      {
        id: 'conseil',
        texte: 'Lui glisser un conseil avant le départ',
        effets: [{ stat: 'attributs.charisme', delta: 2 }],
        resultat: '« Vous me l’avez déjà donné, celui-là, dit-elle. Il y a vingt ans. Je l’ai écrit. » Elle tapote le carnet. Tu ris. Tu n’as plus rien à lui apprendre, et c’est exactement ce que tu voulais.',
      },
    ],
  },
  {
    ...base,
    id: 'x_yuta_maitre',
    titre: 'Le professeur Yuta',
    categorie: 'heritage',
    lieu: '$academie',
    poids: 4,
    si: { tout: [MUR, { drapeau: 'yuta' }] },
    texte: 'Une lettre de l’Académie, signée « Professeur Yuta ». Il enseigne le lancer aux enfants de huit ans. Il voudrait que tu viennes leur parler. « Ils ne me croient pas quand je leur dis qu’on m’a appris à tomber avant de m’apprendre à frapper. »',
    choix: [
      {
        id: 'aller',
        texte: 'Y aller',
        effets: [{ stat: 'attributs.charisme', delta: 2 }, { stat: 'social.reputation', delta: 2 }, { ethique: { compassion: 2 } }],
        resultat: 'Trente enfants assis en tailleur. Yuta au fond, les bras croisés, exactement comme tu te tenais au bord du terrain. Tu leur apprends à tomber. Ils trouvent ça nul. Puis ils trouvent ça génial. Yuta ne dit rien. Il a les yeux brillants.',
      },
    ],
  },
  {
    ...base,
    id: 'x_kanon_dango',
    titre: 'La boutique de Kanon',
    categorie: 'amitie',
    lieu: '$village',
    poids: 4,
    si: { tout: [MUR, { drapeau: 'kaede', egal: 'revenue' }] },
    texte: 'Kanon a ouvert une échoppe de dango près du terrain trois. Sur le comptoir, un kunai planté dans une planche, à un doigt d’une cible peinte. « Oups », dit l’écriteau en dessous.',
    choix: [
      {
        id: 'manger',
        texte: 'Commander, et rester',
        effets: [{ stat: 'jauges.fatigue', delta: -20 }, { stat: 'attributs.charisme', delta: 1 }, { stat: 'jauges.ryo', delta: -5 }],
        resultat: 'Elle te sert sans demander ce que tu veux. Elle sait. Vous parlez de ses trois élèves, devenus jōnin tous les trois. « Insupportables jusqu’au bout. » Elle a l’air plus heureuse que tu ne l’as jamais vue au combat.',
      },
      {
        id: 'defi',
        texte: 'Viser la cible peinte',
        effets: [{ entrainer: 'famille_kunai', jours: 5 }, { stat: 'attributs.perception', delta: 1 }],
        resultat: 'Ton kunai se plante pile au centre. Kanon applaudit lentement. « Tu ne baisses toujours plus l’épaule. » Elle accroche ton kunai à côté du sien. Ils y sont encore, paraît-il.',
      },
    ],
  },
];
