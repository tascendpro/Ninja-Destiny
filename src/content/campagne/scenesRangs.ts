import type { Campagne, IdJoueur, SceneCommuneDef, TypeLien } from '../../engine/campagne/types';
import { rangIndex } from '../../engine/etat';
import { ageA, autre, hash01, planifierCommune } from '../../engine/campagne/outils';

/**
 * Les rangs, vécus à deux : la même classe à l'Académie, la répartition des équipes (on peut finir dans la même),
 * les missions de genin, le gilet de chūnin qui arrive pour l'un avant l'autre, puis le jour où l'un commande l'autre.
 * Pour tous les liens d'un même village ; chaque lien a ses mots (deux frères ne se regardent pas comme deux rivaux).
 */

const MEME_VILLAGE: TypeLien[] = ['freres', 'clan', 'amis', 'rivaux', 'inconnus', 'clans_differents', 'improbable'];
const rang = (c: Campagne, j: IdJoueur) => rangIndex(c.joueurs[j].rang);
const vivants = (c: Campagne) => c.joueurs.every((s) => s.statut !== 'mort' && s.scene.type !== 'fin') && !c.separation?.actif;

/** Une phrase par lien, et une par défaut. */
const selon = (c: Campagne, textes: Partial<Record<TypeLien, string>> & { defaut: string }) => textes[c.lien.type] ?? textes.defaut;

export const SCENES_RANGS: SceneCommuneDef[] = [
  {
    id: 'mc_rg_classe',
    titre: 'La même classe',
    age: { min: 7, max: 10 },
    types: MEME_VILLAGE,
    si: vivants,
    texte: (c) =>
      selon(c, {
        freres: 'Le maître lit la liste, s’arrête sur votre nom de famille, et lève les yeux : « Deux ? » Toute la classe se retourne. On vous place côte à côte, au deuxième rang. Dès le premier exercice, il prend l’habitude de vous comparer, à voix haute.',
        rivaux: 'La même classe. Évidemment. Le maître vous assoit côte à côte « pour que vous appreniez à vous supporter ». Trois jours plus tard, la table entre vous a une ligne tracée au kunai, exactement au milieu.',
        clans_differents: 'Le maître vous place côte à côte sans savoir ce qu’il fait. Vos deux familles le savent, elles. Le soir même, deux parents viennent demander qu’on change l’un des deux de place. Le maître refuse.',
        inconnus: 'Un pupitre libre, à côté d’un enfant que tu ne connais pas encore. Le maître vous y assoit tous les deux, et commence la leçon.',
        defaut: 'La même classe, le même pupitre, le même maître qui confond vos devoirs une fois sur deux. Dès la première semaine, il prend l’habitude de vous interroger l’un après l’autre.',
      }),
    choix: [
      { id: 'souffler', texte: 'Souffler la réponse à l’autre quand le maître l’interroge', famille: 'proteger' },
      { id: 'premier', texte: 'Lever la main avant l’autre, à chaque question', famille: 'agir' },
      { id: 'travailler', texte: 'Proposer de réviser ensemble, le soir', famille: 'parler' },
    ],
    issues: [
      { cle: 'travailler+travailler', texte: 'Le soir, sur le même tapis, les mêmes rouleaux. Vous finissez premiers ex aequo à l’examen du trimestre, et le maître doit admettre qu’il ne sait plus lequel féliciter.', lien: { les2: { confiance: 5, respect: 4 } }, effets: { les2: [{ stat: 'attributs.intellect', delta: 2 }] }, accord: 4, souvenir: { id: 'meme_classe', texte: 'Le même pupitre à l’Académie, et les révisions du soir.', poids: 3, tonalite: 'chaud' } },
      { cle: 'premier+premier', texte: 'Deux mains levées en même temps, à chaque question, pendant toute une année. Le maître finit par interroger quelqu’un d’autre, par principe. Vous terminez premier et deuxième, et vous ne serez jamais d’accord sur l’ordre.', lien: { les2: { rivalite: 8, respect: 4 } }, effets: { les2: [{ stat: 'attributs.intellect', delta: 1 }] }, accord: 2, souvenir: { id: 'meme_classe', texte: 'Deux mains levées en même temps, toute une année.', poids: 3, tonalite: 'fier' } },
      { cle: 'souffler+premier', texte: '{un} souffle la réponse à {deux} ; {deux} lève la main avant {un} sur la question suivante. Le maître a tout vu. Il ne dit rien, mais il note quelque chose dans son carnet.', lien: { un: { ressentiment: 4 }, deux: { dette: 4 } }, accord: 1 },
      { cle: 'souffler+*', texte: '{un} souffle les réponses, discrètement, toute l’année. Un jour, le maître l’entend. Il punit {un}, pas {deux}. {deux} ne l’oubliera pas.', lien: { deux: { dette: 6, loyaute: 4 }, un: { loyaute: 3 } }, accord: 3, suite: { scene: 'mc_suite_pupitre', dans: 2 * 360 } },
      { cle: 'defaut', texte: 'Une année passe, au même pupitre. Vous connaissez par cœur l’écriture de l’autre, ses tics, la façon dont {il:un} mord son pinceau quand {il:un} réfléchit.', lien: { les2: { confiance: 3 } }, accord: 2 },
    ],
  },
  {
    id: 'mc_rg_equipes',
    dynamique: true,
    titre: 'La répartition des équipes',
    age: { min: 12, max: 14 },
    types: MEME_VILLAGE,
    si: (c) => vivants(c) && rang(c, 0) >= rangIndex('genin') && rang(c, 1) >= rangIndex('genin') && c.memeEquipe === undefined,
    texte: (c) =>
      selon(c, {
        freres: 'La salle de l’Académie, le jour des équipes. Le chūnin qui lit la liste hésite sur votre nom de famille. Le conseil n’aime pas mettre deux enfants d’une même maison dans la même équipe : si l’un tombe, la famille perd tout. Mais on peut demander.',
        rivaux: 'Le jour des équipes. Tout le monde sait qu’on ne met pas deux rivaux ensemble : ils se battent entre eux plus qu’avec l’ennemi. Tout le monde, sauf peut-être le sensei qui vient d’entrer, et qui vous regarde tous les deux un peu trop longtemps.',
        defaut: 'La salle de l’Académie, le jour des équipes. Trois noms par équipe, un sensei par équipe. On peut demander à être ensemble. On n’est pas sûr de l’obtenir.',
      }),
    choix: [
      { id: 'ensemble', texte: 'Demander à être dans la même équipe', famille: 'proteger' },
      { id: 'separes', texte: 'Demander à ne pas l’être', famille: 'partir' },
      { id: 'laisser', texte: 'Laisser le village décider', famille: 'observer' },
    ],
    issues: [
      { cle: 'ensemble+ensemble', texte: 'Vous le demandez tous les deux, le même matin, sans vous être concertés. Le chūnin soupire, barre deux noms, les réécrit sur la même ligne. Même équipe.', lien: { les2: { loyaute: 6, confiance: 3 } }, accord: 6, souvenir: { id: 'meme_equipe', texte: 'Le jour où vous avez demandé la même équipe, sans vous concerter.', poids: 4, tonalite: 'chaud' }, apres: (c) => (c.memeEquipe = true) },
      { cle: 'separes+separes', texte: 'Vous avez demandé la même chose : être séparés. Pour des raisons différentes, peut-être. Deux équipes, deux sensei, deux chemins qui ne se croiseront plus qu’en mission.', lien: { les2: { rivalite: 4, respect: 2 } }, accord: -2, apres: (c) => (c.memeEquipe = false) },
      { cle: 'ensemble+separes', texte: '{un} a demandé à être avec {deux}. {deux} a demandé le contraire. Le chūnin, pour une fois, écoute le second. Deux équipes. {un} l’apprend en lisant la liste, et ne dit rien.', lien: { un: { ressentiment: 8, peur_de_perdre: 4 }, deux: { dette: 4 } }, accord: -3, apres: (c) => (c.memeEquipe = false), suite: { scene: 'mc_suite_place', dans: 3 * 360 } },
      {
        cle: 'defaut',
        texte: 'Le village décide. Le chūnin lit la liste lentement, et vous retenez votre souffle tous les deux.',
        apres: (c) => {
          // Le hasard du village, pondéré : on sépare plus volontiers deux frères ou deux rivaux.
          const chance = c.lien.type === 'freres' || c.lien.type === 'rivaux' ? 0.35 : 0.5;
          c.memeEquipe = hash01(c, 'meme_equipe') < chance;
        },
      },
    ],
  },
  {
    id: 'mc_rg_mission_equipe',
    dynamique: true,
    titre: 'L’équipe en mission',
    age: { min: 12, max: 16 },
    types: MEME_VILLAGE,
    si: (c) => vivants(c) && c.memeEquipe === true,
    texte: (c) =>
      selon(c, {
        freres: 'Première vraie mission de votre équipe : escorter un convoi de sel jusqu’à la frontière. Le sensei vous a placés aux deux extrémités du convoi, exprès : « Pas d’histoires de famille en mission. » Au deuxième jour, une escouade ennemie sort des rochers, entre vous deux.',
        rivaux: 'Première vraie mission de l’équipe. Le sensei vous a mis en binôme, et vous a regardés droit dans les yeux : « Si l’un de vous laisse tomber l’autre pour briller, je vous renvoie tous les deux à l’Académie. » Au deuxième jour, l’ennemi sort des rochers.',
        defaut: 'Première vraie mission de votre équipe : un convoi à escorter jusqu’à la frontière. Au deuxième jour, une escouade ennemie sort des rochers.',
      }),
    choix: [
      { id: 'couvrir', texte: 'Couvrir l’autre, quoi qu’il arrive', famille: 'proteger' },
      { id: 'foncer', texte: 'Foncer sur leur chef', famille: 'agir' },
      { id: 'ordres', texte: 'Attendre les ordres du sensei', famille: 'observer' },
    ],
    issues: [
      { cle: 'couvrir+couvrir', texte: 'Dos à dos, sans un mot. Le sensei, de loin, sourit pour la première fois.', lien: { les2: { confiance: 6 } }, accord: 5, combat: 'combat_frontiere', suite: { scene: 'mc_suite_convoi', dans: 3 * 360 } },
      { cle: 'foncer+couvrir', texte: '{un} fonce ; {deux} le couvre, sans qu’on lui demande. C’est exactement ce que le sensei voulait voir.', lien: { un: { dette: 4 }, deux: { loyaute: 4 } }, accord: 4, combat: 'combat_frontiere', suite: { scene: 'mc_suite_convoi', dans: 3 * 360 } },
      { cle: 'foncer+foncer', texte: 'Vous foncez tous les deux sur le même homme. Le sensei jure. Il va falloir réparer ça au milieu du combat.', lien: { les2: { rivalite: 4 } }, accord: 1, combat: 'combat_frontiere', suite: { scene: 'mc_suite_convoi', dans: 3 * 360 } },
      { cle: 'defaut', texte: 'Le sensei donne ses ordres, sèchement. Vous obéissez, chacun à sa place.', accord: 3, combat: 'combat_frontiere' },
    ],
  },
  {
    id: 'mc_rg_equipes_rivales',
    dynamique: true,
    titre: 'Deux équipes, une mission',
    age: { min: 13, max: 17 },
    types: MEME_VILLAGE,
    si: (c) => vivants(c) && c.memeEquipe === false,
    texte: (c) =>
      selon(c, {
        freres: 'Le bureau des missions a fait une erreur : vos deux équipes ont reçu la même mission, le même rouleau à récupérer. Vous vous retrouvez nez à nez au pied de la même tour. Vos deux sensei se regardent, amusés. « Le premier qui le rapporte. »',
        rivaux: 'Vos deux équipes, la même mission, le même rouleau. Ce n’est pas une erreur : quelqu’un au bureau des missions trouve ça drôle. Vos sensei vous laissent régler ça entre vous.',
        defaut: 'Vos deux équipes ont reçu la même mission. Il n’y a qu’un rouleau à récupérer, et vos deux sensei vous laissent régler ça.',
      }),
    choix: [
      { id: 'duel', texte: 'Le régler entre vous deux, à l’ancienne', famille: 'agir' },
      { id: 'partager', texte: 'Proposer de faire la mission ensemble', famille: 'parler' },
      { id: 'devancer', texte: 'Partir devant sans prévenir', famille: 'partir' },
    ],
    issues: [
      { cle: 'duel+duel', texte: 'Vos coéquipiers reculent en cercle. Vos sensei croisent les bras. Le rouleau ira au vainqueur.', lien: { les2: { rivalite: 6, respect: 4 } }, combat: 'duel_examen' },
      { cle: 'partager+partager', texte: 'Deux équipes, une seule mission, faite à six. Vos sensei protestent pour la forme, puis s’assoient pour regarder. Le rouleau est rapporté en un temps record, et le bureau des missions ne sait pas à qui le compter.', lien: { les2: { confiance: 5, loyaute: 3 } }, accord: 5, effets: { les2: [{ stat: 'social.reputation', delta: 2 }] }, souvenir: { id: 'mission_a_six', texte: 'La mission faite à six, par deux équipes qui devaient se la disputer.', poids: 3, tonalite: 'chaud' } },
      { cle: 'devancer+*', texte: '{un} file pendant que {deux} parle encore. Le rouleau est à {un}. Le bureau des missions le félicite ; {deux}, beaucoup moins.', lien: { deux: { ressentiment: 8, rivalite: 6 }, un: { rivalite: 3 } }, effets: { un: [{ stat: 'social.reputation', delta: 3 }] } },
      { cle: 'defaut', texte: 'Vous ne vous mettez pas d’accord. Vos sensei finissent par tirer à la courte paille. Ça vous vexe tous les deux.', lien: { les2: { rivalite: 3 } } },
    ],
  },
  {
    id: 'mc_rg_gilet',
    dynamique: true,
    titre: 'Le gilet',
    age: { min: 14, max: 22 },
    types: MEME_VILLAGE,
    si: (c) => vivants(c) && rang(c, 0) !== rang(c, 1) && Math.max(rang(c, 0), rang(c, 1)) >= rangIndex('chunin'),
    texte: (c) => {
      const promu = (rang(c, 0) > rang(c, 1) ? 0 : 1) as IdJoueur;
      const n = c.creations[promu].prenom;
      return selon(c, {
        freres: `${n} rentre à la maison avec le gilet de chūnin sur le bras. Toute la famille est dans l’entrée. Il y a un dîner, des voisins, du saké pour les adultes. Et il y a l’autre, à table, qui n’a pas le gilet, et à qui tout le monde fait très attention de ne pas parler du gilet.`,
        rivaux: `${n} a le gilet. Pas l’autre. Le village entier le sait avant la fin de la journée, et tout le monde attend de voir comment ça va tourner entre vous.`,
        defaut: `${n} a été promu chūnin. Pas l’autre. Le gilet est encore plié sur la table, entre vous deux.`,
      });
    },
    choixPour: (c, j) =>
      (rang(c, j) > rang(c, autre(j))
        ? [
            { id: 'offrir', texte: 'Proposer à l’autre de s’entraîner avec toi pour le prochain examen', famille: 'proteger' },
            { id: 'savourer', texte: 'Savourer. Tu l’as mérité', famille: 'agir' },
          ]
        : [
            { id: 'feliciter', texte: 'Féliciter l’autre, sincèrement', famille: 'parler' },
            { id: 'jurer', texte: '« L’année prochaine, c’est moi. »', famille: 'agir' },
            { id: 'eviter', texte: 'Éviter l’autre pendant quelques semaines', famille: 'partir' },
          ]) as SceneCommuneDef['choix'],
    choix: [],
    issues: [
      { cle: 'offrir+feliciter', texte: 'Le soir, sur le terrain, l’un enseigne et l’autre apprend, et pour une fois aucun ne compte les points.', lien: { les2: { confiance: 6, loyaute: 4 } }, effets: { deux: [{ stat: 'attributs.controleChakra', delta: 2 }] }, accord: 4 },
      { cle: 'offrir+jurer', texte: '« Entraîne-moi, alors. Mais je te préviens : l’année prochaine, c’est moi. » {un} rit. C’est le meilleur cadeau qu’on pouvait lui faire.', lien: { les2: { rivalite: 4, respect: 6 } }, effets: { deux: [{ stat: 'attributs.force', delta: 2 }] }, accord: 3 },
      { cle: 'savourer+eviter', texte: '{un} savoure. {deux} disparaît. Ce ne sont que quelques semaines, mais elles laissent une trace : la première fois que l’un a eu quelque chose que l’autre n’avait pas.', lien: { deux: { jalousie: 10, ressentiment: 5 } }, accord: -3, souvenir: { id: 'gilet', texte: 'Le gilet de chūnin que l’un a reçu avant l’autre.', poids: 3, tonalite: 'amer' } },
      { cle: 'savourer+jurer', texte: '« Savoure, dit {deux}. L’année prochaine, c’est moi. » Une nouvelle course commence.', lien: { les2: { rivalite: 8 } }, accord: 1 },
      { cle: 'defaut', texte: 'Le gilet finit par rejoindre une armoire. Ce qu’il a remué entre vous, lui, reste un peu plus longtemps.', lien: { les2: { rivalite: 3 } }, souvenir: { id: 'gilet', texte: 'Le gilet de chūnin que l’un a reçu avant l’autre.', poids: 2, tonalite: 'amer' } },
    ],
  },
  {
    id: 'mc_rg_jonin',
    dynamique: true,
    titre: 'Sous tes ordres',
    age: { min: 18, max: 34 },
    types: MEME_VILLAGE,
    si: (c) => vivants(c) && Math.max(rang(c, 0), rang(c, 1)) >= rangIndex('jonin') && rang(c, 0) !== rang(c, 1),
    texte: (c) => {
      const chef = (rang(c, 0) > rang(c, 1) ? 0 : 1) as IdJoueur;
      return `Le rouleau de mission porte deux noms. Le premier, en haut, celui du chef : ${c.creations[chef].prenom}, jōnin. Le second, plus bas : ${c.creations[autre(chef)].prenom}. Pour la première fois, l’un commande l’autre.`;
    },
    choixPour: (c, j) =>
      (rang(c, j) > rang(c, autre(j))
        ? [
            { id: 'egal', texte: 'Lui parler comme à un égal, et décider ensemble', famille: 'parler' },
            { id: 'chef', texte: 'Donner tes ordres, comme à n’importe qui', famille: 'agir' },
          ]
        : [
            { id: 'obeir', texte: 'Obéir, sans discuter', famille: 'observer' },
            { id: 'discuter', texte: 'Discuter chaque ordre', famille: 'parler' },
          ]) as SceneCommuneDef['choix'],
    choix: [],
    issues: [
      { cle: 'egal+obeir', texte: '{un} demande son avis à {deux} avant chaque décision. {deux} obéit quand même, et c’est la meilleure mission que votre binôme ait jamais faite.', lien: { les2: { respect: 6, confiance: 4 } }, accord: 5, effets: { les2: [{ stat: 'social.reputation', delta: 3 }] } },
      { cle: 'chef+discuter', texte: 'Chaque ordre est contesté. La mission réussit malgré vous. Au rapport, {un} écrit une ligne sèche sur « l’indiscipline » de {deux}. {deux} le lit.', lien: { deux: { ressentiment: 10 }, un: { mefiance: 4 } }, accord: -4, effets: { deux: [{ stat: 'social.reputation', delta: -2 }] } },
      { cle: 'chef+obeir', texte: 'Des ordres, de l’obéissance. Une mission propre, sans un mot de trop. Sur le chemin du retour, vous vous rendez compte que vous ne vous êtes pas parlé une seule fois en ami.', lien: { les2: { respect: 4, confiance: -2 } }, accord: 2 },
      { cle: 'defaut', texte: 'Vous trouvez une façon de faire, entre deux rangs et un vieux lien. Ça marche, à peu près.', lien: { les2: { respect: 3 } }, accord: 2 },
    ],
  },
];

/**
 * Ces scènes dépendent des rangs et de la répartition, pas seulement de l'âge : le moteur les ouvre dès que leur
 * condition devient vraie, dans leur fenêtre d'âge (une barrière posée à un âge fixe tomberait trop tôt).
 */
const DYNAMIQUES = ['mc_rg_equipes', 'mc_rg_mission_equipe', 'mc_rg_equipes_rivales', 'mc_rg_gilet', 'mc_rg_jonin'];
export function planifierRangs(c: Campagne): void {
  if (!MEME_VILLAGE.includes(c.lien.type) || c.commune || c.resultat || c.combat) return;
  for (const id of DYNAMIQUES) {
    if (c.vues.includes(id) || c.barrieres.some((b) => b.id === id)) continue;
    const sc = SCENES_RANGS.find((x) => x.id === id)!;
    const ages = c.joueurs.map((s) => ageA(s));
    if (ages.some((a) => a < sc.age!.min || (sc.age!.max !== undefined && a > sc.age!.max))) continue;
    if (sc.si && !sc.si(c)) continue;
    planifierCommune(c, id, 0);
    return;
  }
}

/** Qui était « un » dans la scène d'origine (celui qui a soufflé, celui qu'on a refusé…). */
const origine = (c: Campagne, id: string): IdJoueur => c.suites?.[id] ?? 0;
const nomDe = (c: Campagne, j: IdJoueur) => c.creations[j].prenom;

/** Les suites : des scènes qui rappellent un moment commun et changent concrètement le cours des choses. */
export const SCENES_SUITES: SceneCommuneDef[] = [
  {
    id: 'mc_suite_pupitre',
    titre: 'La dette du pupitre',
    dynamique: true,
    si: vivants,
    texte: (c) => {
      const souffleur = origine(c, 'mc_suite_pupitre');
      return `L’examen écrit de fin d’Académie. Trois heures, un surveillant qui fait les cent pas. À la quatrième question, ${nomDe(c, souffleur)} pose son pinceau : la page est blanche. Deux pupitres plus loin, ${nomDe(c, autre(souffleur))} connaît la réponse. Il y a deux ans, c’était l’inverse, et c’est ${nomDe(c, souffleur)} qui avait pris la punition.`;
    },
    choixPour: (c, j) =>
      (j === autre(origine(c, 'mc_suite_pupitre'))
        ? [
            { id: 'rendre', texte: 'Rendre la pareille : souffler la réponse, quel qu’en soit le prix', famille: 'proteger' },
            { id: 'regle', texte: 'Ne rien faire : ce n’est plus un jeu, c’est l’examen', famille: 'observer' },
          ]
        : [
            { id: 'attendre', texte: 'Regarder vers l’autre', famille: 'parler' },
            { id: 'seul', texte: 'Fixer ta page, et chercher seul', famille: 'agir' },
          ]) as SceneCommuneDef['choix'],
    choix: [],
    issues: [
      {
        cle: 'rendre+attendre',
        texte: 'Un mot, articulé sans voix. {deux} écrit. Le surveillant se retourne une seconde trop tard. La dette est payée. Vous le savez tous les deux, et vous n’en parlerez jamais.',
        lien: { les2: { loyaute: 8, confiance: 5 }, un: { dette: -6 } },
        effets: { deux: [{ stat: 'social.reputation', delta: 2 }] },
        accord: 5,
        souvenir: { id: 'dette_pupitre', texte: 'L’examen où la dette du pupitre a été payée, sans un mot.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'rendre+seul',
        texte: '{un} souffle ; {deux} ne lève pas la tête, et trouve seul. Le surveillant, lui, a entendu le souffle. Il ne sait pas à qui il était destiné, et c’est {un} qui est noté pour tricherie.',
        lien: { deux: { respect: 6, dette: 4 }, un: { loyaute: 4 } },
        effets: { un: [{ stat: 'social.reputation', delta: -4 }], deux: [{ stat: 'attributs.intellect', delta: 2 }] },
        accord: 2,
      },
      {
        cle: 'regle+*',
        texte: '{un} ne bouge pas. {deux} rend une page à moitié vide. À la sortie, ni l’un ni l’autre ne parle de la punition d’il y a deux ans. Elle est là quand même, entre vous.',
        lien: { deux: { ressentiment: 8 }, un: { mefiance: 2 } },
        effets: { deux: [{ stat: 'social.reputation', delta: -2 }] },
        accord: -3,
      },
      { cle: 'defaut', texte: 'L’examen passe. Les comptes, eux, restent ouverts.', lien: { les2: { confiance: 1 } } },
    ],
  },
  {
    id: 'mc_suite_place',
    titre: 'La place que tu m’as refusée',
    dynamique: true,
    si: vivants,
    texte: (c) => {
      const refuse = origine(c, 'mc_suite_place');
      return `Trois ans ont passé depuis la répartition des équipes. Ce soir, après une mission ratée, ${nomDe(c, refuse)} a bu un peu trop, et pose enfin la question à ${nomDe(c, autre(refuse))} : « Pourquoi tu as demandé à ne pas être avec moi ? »`;
    },
    choixPour: (c, j) =>
      (j === origine(c, 'mc_suite_place')
        ? [
            { id: 'ecouter', texte: 'Écouter la réponse, quelle qu’elle soit', famille: 'observer' },
            { id: 'exiger', texte: 'Exiger la vérité, maintenant, dehors', famille: 'agir' },
          ]
        : [
            { id: 'verite', texte: 'Dire la vérité : tu avais peur de le perdre en mission', famille: 'parler' },
            { id: 'ambition', texte: 'Dire la vérité : tu voulais réussir sans lui', famille: 'agir' },
            { id: 'esquiver', texte: '« C’était il y a longtemps. »', famille: 'partir' },
          ]) as SceneCommuneDef['choix'],
    choix: [],
    issues: [
      {
        cle: 'ecouter+verite',
        texte: '« J’avais peur. Si on était ensemble, et que tu tombais… » {un} écoute jusqu’au bout. Trois ans de rancune s’en vont en une phrase. Il en reste une autre : on aurait pu se le dire avant.',
        lien: { un: { ressentiment: -12, confiance: 8 }, deux: { peur_de_perdre: 6 } },
        accord: 6,
        souvenir: { id: 'place_refusee', texte: 'Le soir où tu as enfin su pourquoi l’autre t’avait refusé dans son équipe.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'exiger+ambition',
        texte: '« Je voulais réussir sans toi. » Dehors, sous la lune, les mots deviennent des poings. Ce soir-là, ce n’est plus une question de rancune : il faut que l’un des deux tombe.',
        lien: { les2: { rivalite: 12, ressentiment: 6 } },
        combat: 'duel_honneur',
      },
      {
        cle: 'ecouter+ambition',
        texte: '« Je voulais réussir sans toi. » {un} hoche la tête, lentement. C’est dur à entendre. C’est honnête. Il y a une forme de respect, dans la douleur.',
        lien: { un: { respect: 6, ressentiment: -4 }, deux: { respect: 4 } },
        accord: 2,
      },
      {
        cle: 'defaut',
        texte: '« C’était il y a longtemps. » {un} n’insiste pas. Mais la question reste dans la pièce quand vous en sortez.',
        lien: { les2: { mefiance: 4 } },
        accord: -2,
      },
    ],
  },
  {
    id: 'mc_suite_convoi',
    titre: 'Le village du sel',
    dynamique: true,
    si: vivants,
    texte: 'Un gamin couvert de poussière vous attend devant la porte du village, un message serré dans le poing. Il vient du village du sel, celui dont vous aviez escorté le convoi, à vos débuts. « Les mêmes hommes reviennent. Ils parlent de vous. Ils savent où vous passerez demain. »',
    choix: [
      { id: 'prevenir', texte: 'Prévenir le village et changer de route', famille: 'observer' },
      { id: 'piege', texte: 'Leur tendre un piège à votre tour', famille: 'agir' },
      { id: 'ignorer', texte: 'Ignorer : un gamin, une rumeur', famille: 'partir' },
    ],
    issues: [
      {
        cle: 'piege+piege',
        texte: 'Ils attendaient deux genin. Ils trouvent deux ninjas qui les attendaient. Le village du sel, lui, n’oubliera pas que vous êtes revenus pour lui.',
        lien: { les2: { confiance: 4 } },
        accord: 4,
        effets: { les2: [{ stat: 'social.reputation', delta: 4 }] },
        combat: 'combat_frontiere',
        souvenir: { id: 'village_sel', texte: 'Le village du sel, qui vous a prévenus, et que vous avez défendu deux fois.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'prevenir+*',
        texte: 'Vous changez de route, et vous prévenez le village. L’embuscade attend dans le vide pendant deux jours. Au bureau des missions, on note que votre binôme a « le sens du terrain ».',
        lien: { les2: { respect: 3 } },
        accord: 3,
        effets: { les2: [{ stat: 'social.reputation', delta: 2 }, { stat: 'attributs.perception', delta: 1 }] },
      },
      {
        cle: 'ignorer+ignorer',
        texte: 'Une rumeur, un gamin. Vous passez par la route prévue. Ils sont là. Ils étaient prévenus de votre arrivée, eux.',
        lien: { les2: { mefiance: 2 } },
        combat: 'combat_frontiere',
      },
      { cle: 'defaut', texte: 'Vous ne vous mettez pas d’accord, et vous choisissez une route au milieu. Ils y sont aussi.', combat: 'combat_frontiere' },
    ],
  },
];
