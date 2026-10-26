import type { CheckDef, ChoiceDef, Condition, Effect, EventDef } from '../../engine/types';
import { NOMS_AKATSUKI, PRIMES_AKATSUKI } from '../combat/akatsuki';

/**
 * La chasse à l'Akatsuki : on les croise par deux, comme ils voyagent. On choisit qui affronter, ou on fuit.
 * Les abattre rapporte leur prime (une part, selon qu'on sert un village ou qu'on vit sur la route).
 * Ces rencontres reviennent, rarement, tant qu'il en reste un en vie ; chaque retour se raconte autrement.
 */
const commun = { chapitre: 3, chapitres: [3, 4, 5, 6], arc: 'conflit' as const, repetable: { delaiJours: 700, max: 3 } };
const CHASSEUR: Condition = { tout: [{ statut: ['actif', 'errant', 'deserteur', 'exile'] }, { age: { min: 20 } }, { drapeau: 'akatsuki_connue' }, { drapeau: 'akatsuki_membre', absent: true }] };
const vivant = (id: string): Condition => ({ tout: [{ drapeau: `akatsuki_mort_${id}`, absent: true }, { drapeau: `akatsuki_capture_${id}`, absent: true }] });
const P1 = { drapeau: 'passage', max: 1 } as const;
const P2 = { drapeau: 'passage', min: 2 } as const;

function combat(id: string, nom: string, texte: string, difficulte: number, causeMort: string, echec: string, element?: CheckDef['elementAdverse']): ChoiceDef {
  return {
    id,
    texte,
    si: vivant(id),
    verrou: `${nom} n’est plus sur les routes.`,
    test: {
      type: 'combat',
      difficulte,
      attributs: { agilite: 2, force: 1, perception: 1, controleChakra: 1 },
      maitrises: { ninjutsu: 2, taijutsu: 1, arme: 1 },
      arme: true,
      letal: true,
      elementAdverse: element,
      causeMort,
      // La conclusion du combat raconte la mise à mort ; ce succès sert quand il se retire avant la fin.
      succes: { texte: `${nom} recule, puis disparaît. Tu l’as fait reculer : peu de gens peuvent en dire autant.`, effets: [{ drapeau: 'akatsuki_ennemie' }, { stat: 'social.reputation', delta: 6 }] },
      echec: { texte: echec, effets: [{ blessure: { id: `akatsuki_${id}`, nom: `Blessures laissées par ${nom}`, gravite: 3, jours: 90 } }, { drapeau: 'akatsuki_ennemie' }] },
    },
  };
}

const FUIR: ChoiceDef = {
  id: 'fuir',
  texte: 'Rebrousser chemin avant qu’ils te remarquent',
  effets: [{ hasard: [{ poids: 70, effets: [{ stat: 'attributs.discretion', delta: 1 }] }, { poids: 30, effets: [{ stat: 'jauges.fatigue', delta: 30 }, { drapeau: 'akatsuki_t_a_vu' }] }] }],
  resultat: [
    { si: { drapeau: 'akatsuki_t_a_vu', absent: true }, texte: 'Tu recules dans l’ombre, pas à pas, jusqu’à ce que les manteaux noirs ne soient plus que deux taches au loin. Tu respires enfin.' },
    { si: { drapeau: 'akatsuki_t_a_vu' }, texte: 'Au moment où tu te retournes, l’un d’eux lève les yeux vers toi. Il ne bouge pas. Il n’en a pas besoin : désormais, il sait à quoi tu ressembles.' },
  ],
};

/** Les sept membres qu'on peut avoir à sa merci. */
const MEMBRES = Object.keys(PRIMES_AKATSUKI);
const A_TERRE = (id: string): Condition => ({ drapeau: 'akatsuki_a_terre', egal: id });
const PRISE = (v: string): Condition => ({ drapeau: 'akatsuki_prise', egal: v });
/** Le village garde l'essentiel de la prime ; sur la route, le bureau des primes paie mieux, sans poser de questions. */
const prime = (montant: number): Effect => ({ si: { statut: 'actif' }, alors: [{ stat: 'jauges.ryo', delta: Math.round(montant / 10) }], sinon: [{ stat: 'jauges.ryo', delta: Math.round(montant / 5) }] });
const mort = (id: string, payee = true): Effect[] => [
  { drapeau: `akatsuki_mort_${id}` },
  { stat: 'social.reputation', delta: 20 },
  { stat: 'social.reputationOmbre', delta: 10 },
  ...(payee ? [prime(PRIMES_AKATSUKI[id])] : []),
];

/** Ce que le combat ne raconte pas : ce qu'on fait de lui, une fois à terre. */
const ACHEVER: Record<string, string> = {
  itachi: 'Il lève la main vers toi, deux doigts tendus, comme pour te toucher le front, et la laisse retomber. Il sourit. Tu ne comprendras ce sourire que bien plus tard.',
  kisame: '« Bonne réponse. » Il garde les yeux ouverts jusqu’au bout. Samehada pousse un long cri aigu, comme une bête qu’on égorge, puis se tait.',
  sasori: 'Tu enfonces la lame. Le cœur s’arrête. Le corps de bois ne saigne pas : il se contente de ne plus bouger, comme toutes les marionnettes quand on lâche les fils.',
  deidara: '« Pas… comme ça… » Il voulait finir dans une explosion, en pleine lumière. Tu lui refuses ça aussi.',
  hidan: 'Il ne peut pas mourir. Alors tu fais ce qu’il faut : tu creuses, et tu enterres sa tête sous des tonnes de roche, au fond de la carrière. Longtemps après, tu l’entends encore jurer sous la terre.',
  kakuzu: 'Tu trouves le dernier cœur et tu le transperces. Les fils noirs se détendent un à un, et ce qui reste de lui s’affaisse comme un sac vide. Dans sa sacoche, des liasses de primes, soigneusement classées par montant.',
  konan: '« Prends soin de la pluie. » Puis elle se défait, feuille après feuille, et le vent emporte tout.',
};
const CAPTURE: Record<string, string> = {
  itachi: 'Il te tend ses poignets avant que tu les lui prennes. Il ne résiste pas, pas une fois, sur tout le chemin. Ceux qui le reçoivent te félicitent ; toi, tu ne dors pas pendant trois nuits. Quelqu’un comme lui ne se laisse pas prendre. Il s’est rendu. Reste à savoir pourquoi.',
  sasori: 'Tu détaches son cœur de sa cage de bois, sans l’abîmer, et tu le scelles dans une boîte de cuivre. Il bat encore dans ta main. « L’attente ne me dérange pas, dit une voix qui ne sort de nulle part. J’ai l’éternité. » Les marionnettistes de Suna paieraient une fortune pour ce qu’il sait. Ils ne seront pas les seuls.',
  deidara: 'Sa mâchoire se met à mâcher : l’argile, il l’a avalée. Des lignes de lumière fendent sa peau… et ta main s’abat sur son plexus juste à temps, coupant le flux de chakra. Il te crache au visage. « Tu m’as volé… ma plus belle œuvre. » Tu lui scelles les deux paumes avant de le ligoter. Il ne te le pardonnera jamais.',
  hidan: 'Tu ne peux pas le tuer, alors tu l’emportes. Sa tête dans un sac de toile scellé trois fois, le reste dans une caisse. Pendant tout le voyage, le sac jure, prie, menace, et raconte en détail ce que Jashin te réserve. On n’a jamais payé une prime avec autant de soulagement.',
  kakuzu: 'Tu cloues ses fils au sol avec des sceaux, un par plaie, et tu poses la main sur son dernier cœur pour qu’il sache qui décide. Il ne se débat pas. « Combien vaut ma tête, vivante ? » demande-t-il, la voix sèche. Tu le lui dis. Il hoche la tête, presque satisfait. « C’est un prix juste. »',
  konan: 'Tu la gardes sous la pluie, là où son papier ne peut plus voler, et tu lui lies les mains d’une corde mouillée. Elle ne lutte pas. En chemin, elle plie d’une seule main un petit oiseau de papier détrempé et le pose sur ton épaule. « Pour quand il viendra me chercher. » Tu ne sais pas si c’est une menace, ou un adieu.',
};

/** Vaincu, à ta merci : l'achever pour la prime, le livrer vivant (s'il se laisse prendre), ou le laisser partir. */
export const AKATSUKI_VERDICT: EventDef = {
  id: 'akc_verdict',
  chapitre: 3,
  chapitres: [3, 4, 5, 6],
  arc: 'conflit',
  enchaine: true,
  repetable: { delaiJours: 0 },
  planifieParMoteur: true,
  titre: 'Un manteau à nuages rouges',
  categorie: 'organisation',
  lieu: '$ici',
  si: { drapeau: 'akatsuki_a_terre' },
  texte: [
    { si: A_TERRE('itachi'), texte: 'Itachi Uchiha est à genoux devant toi. Tu as vaincu l’homme qui a massacré son clan en une nuit. Une petite voix, au fond de toi, demande si c’est vraiment toi qui as gagné.' },
    { si: A_TERRE('kisame'), texte: 'Kisame Hoshigaki est à genoux dans l’eau rougie. Même vaincu, il sourit avec toutes ses dents.' },
    { si: A_TERRE('sasori'), texte: 'Il ne reste de Sasori qu’un cœur vivant dans un corps de bois, et des marionnettes brisées tout autour.' },
    { si: A_TERRE('deidara'), texte: 'Deidara est étendu dans le sable, les bras inertes. Les bouches de ses paumes remuent encore.' },
    { si: A_TERRE('hidan'), texte: 'Hidan est en morceaux, et il ne mourra pas. Sa tête t’insulte depuis le sol.' },
    { si: A_TERRE('kakuzu'), texte: 'Kakuzu n’a plus qu’un cœur. Il le sait, et il attend ta décision comme on attend un chiffre.' },
    { si: A_TERRE('konan'), texte: 'Konan est à genoux sous la pluie, son papier trempé collé à la boue.' },
    { texte: 'On dit dans toutes les auberges que les membres de l’Akatsuki ne se laissent jamais prendre vivants. Personne n’a jamais vérifié.' },
  ],
  choix: [
    {
      id: 'achever',
      texte: 'En finir, et toucher la prime',
      effets: [
        ...MEMBRES.map((id): Effect => ({ si: A_TERRE(id), alors: [...mort(id), { journal: `Tu as abattu ${NOMS_AKATSUKI[id]}, de l’Akatsuki.`, importance: 3 }] })),
        { ethique: { ambition: 2 } },
      ],
      resultat: MEMBRES.map((id) => ({ si: A_TERRE(id), texte: ACHEVER[id] })),
    },
    {
      id: 'capturer',
      texte: 'Faire un prisonnier plutôt qu’un cadavre',
      indice: 'Une fois et demie la prime, et tout ce qu’on saura de l’Akatsuki. Encore faut-il se laisser prendre.',
      effets: [
        { drapeau: 'akatsuki_prise', valeur: 'vivant' },
        // Itachi ne se laisse presque jamais prendre : celui qu'on a vaincu n'était peut-être pas lui.
        { si: A_TERRE('itachi'), alors: [{ hasard: [{ poids: 8, effets: [] }, { poids: 92, effets: [{ drapeau: 'akatsuki_prise', valeur: 'echappe' }] }] }] },
        // Kisame ne livrera jamais un secret : il préfère ses propres requins aux chaînes.
        { si: A_TERRE('kisame'), alors: [{ drapeau: 'akatsuki_prise', valeur: 'suicide' }] },
        // Deidara tente sa dernière œuvre ; on l'arrête une fois sur deux.
        { si: A_TERRE('deidara'), alors: [{ hasard: [{ poids: 50, effets: [] }, { poids: 50, effets: [{ drapeau: 'akatsuki_prise', valeur: 'explose' }] }] }] },
        ...MEMBRES.map((id): Effect => ({
          si: { tout: [A_TERRE(id), PRISE('vivant')] },
          alors: [
            { drapeau: `akatsuki_capture_${id}` },
            { stat: 'social.reputation', delta: 25 },
            { stat: 'social.reputationOmbre', delta: 5 },
            { si: { statut: 'actif' }, alors: [{ stat: 'social.loyaute', delta: 4 }] },
            prime(PRIMES_AKATSUKI[id] * 1.5),
            { journal: `Tu as livré ${NOMS_AKATSUKI[id]}, de l’Akatsuki, ${id === 'konan' ? 'vivante' : 'vivant'}.`, importance: 3 },
          ],
        })),
        { si: PRISE('echappe'), alors: [{ drapeau: 'akatsuki_itachi_echappe' }, { stat: 'social.reputation', delta: 4 }, { stat: 'attributs.controleEmotionnel', delta: -1 }, { journal: 'Itachi Uchiha était à ta merci. Du moins, tu l’as cru.', importance: 3 }] },
        { si: PRISE('suicide'), alors: [...mort('kisame'), { drapeau: 'akatsuki_kisame_suicide' }, { journal: 'Kisame Hoshigaki s’est livré à ses propres requins plutôt qu’à tes chaînes.', importance: 3 }] },
        {
          si: PRISE('explose'),
          alors: [
            ...mort('deidara', false),
            { drapeau: 'akatsuki_deidara_explose' },
            { blessure: { id: 'akatsuki_deidara_explosion', nom: 'Brûlures de la dernière œuvre de Deidara', gravite: 3, jours: 120 } },
            { journal: 'Deidara s’est fait exploser plutôt que d’être pris. Il n’est rien resté à livrer.', importance: 3 },
          ],
        },
      ],
      resultat: [
        ...MEMBRES.map((id) => ({ si: { tout: [A_TERRE(id), PRISE('vivant')] }, texte: CAPTURE[id] })).filter((r) => r.texte),
        {
          si: PRISE('echappe'),
          texte: 'Tu lui lies les poignets d’une corde scellée, tu poses la main sur son épaule… et ta main se couvre de plumes. Des corbeaux s’envolent de sous tes doigts, des dizaines, des centaines, et quand le dernier a disparu il n’y a plus personne devant toi. Pas de sang sur le sol. Pas d’empreintes. Depuis quand étais-tu dans son genjutsu ? Depuis la fin du combat ? Depuis le début ? Depuis que tu l’as vu sur la route ? Très loin, une voix calme : « Pas encore. »',
        },
        {
          si: PRISE('suicide'),
          texte: 'Tu sors les chaînes. Kisame les regarde, et son sourire s’élargit jusqu’à montrer toutes ses dents. « Me faire parler, moi ? » Il compose un signe, un seul. Trois requins d’eau jaillissent de la boue, pas vers toi : vers lui. « J’ai tué des camarades pour moins que ça. Je ne vais pas devenir celui qui parle. » Tu ne peux rien faire. Quand l’eau retombe, il ne reste que son manteau déchiré, et Samehada qui gémit dans la boue. Le manteau suffira, pour la prime.',
        },
        {
          si: PRISE('explose'),
          texte: 'Sa mâchoire se met à mâcher : l’argile, il l’a avalée. Des lignes de lumière fendent sa peau. « L’art… est une EXPLOSION ! » Tu te jettes en arrière. Le souffle te soulève et te projette dans une dune à vingt pas. Quand tu te relèves, le dos en feu, il y a un cratère de sable vitrifié à l’endroit où il était. Rien à livrer. Rien du tout.',
        },
        { si: { tout: [PRISE('vivant'), { statut: 'actif' }] }, texte: 'Au village, on descend ton prisonnier dans les cellules les plus profondes de la division des interrogatoires. Le conseil paie la prime d’un prisonnier, plus chère que celle d’un corps, et des inconnus te saluent dans la rue.' },
        { si: { tout: [PRISE('vivant'), { statut: ['errant', 'deserteur', 'exile'] }] }, texte: 'Le bureau des primes compte deux fois les pièces avant de te les remettre. Un membre de l’Akatsuki vivant : l’homme derrière le comptoir n’en avait jamais vu.' },
      ],
    },
    {
      id: 'epargner',
      texte: 'Ranger ton arme et tourner le dos',
      indice: 'L’Akatsuki n’oublie ni ses dettes, ni ses humiliations.',
      effets: [{ ethique: { compassion: 6, honneur: 2 } }, { stat: 'social.reputationOmbre', delta: 4 }, ...MEMBRES.map((id): Effect => ({ si: A_TERRE(id), alors: [{ drapeau: `akatsuki_epargne_${id}` }] }))],
      resultat: 'Tu ranges ton arme et tu tournes le dos. Derrière toi, personne ne frappe. Tu marches longtemps avant d’oser te retourner : il n’y a plus que la route, et le vent.',
    },
  ],
};

export const AKATSUKI_CHASSE: EventDef[] = [
  {
    id: 'akc_paille',
    ...commun,
    titre: 'Deux chapeaux de paille',
    categorie: 'organisation',
    lieu: 'route_commerce',
    poids: 3,
    si: { tout: [CHASSEUR, { un: [vivant('itachi'), vivant('kisame')] }] },
    texte: [
      { si: P1, texte: 'Une maison de thé au bord de la route. Deux voyageurs en manteaux noirs à nuages rouges, chapeaux de paille baissés, boivent sans parler. Le plus grand porte dans le dos une épée enveloppée de bandages, et elle bouge toute seule. L’autre lève les yeux vers toi. Ils sont rouges, et trois virgules noires y tournent lentement.' },
      { si: P2, texte: 'La même route, la même pluie fine, et de nouveau les deux chapeaux de paille, assis comme s’ils t’attendaient. Le grand sourit en montrant ses dents de requin : « Encore toi. » L’autre ne dit rien. Il n’a jamais besoin de rien dire.' },
      { si: { clan: 'uchiha' }, texte: 'Il te regarde un peu plus longtemps que nécessaire. Tu as les mêmes yeux que lui. Il le sait.' },
    ],
    choix: [
      combat('itachi', 'Itachi Uchiha', 'Affronter Itachi, sans jamais croiser son regard', 94, 'tué·e par Itachi Uchiha, sans avoir compris comment', 'Tu te réveilles trois jours plus tard dans un fossé, sans une blessure visible. Mais dans ta tête, tu as été tué·e soixante-douze fois. Tu ne dors plus.', 'katon'),
      combat('kisame', 'Kisame Hoshigaki', 'Affronter Kisame et son épée vivante', 90, 'dévoré·e par Samehada, l’épée de Kisame Hoshigaki', 'Samehada t’a pris presque tout ton chakra. Kisame t’a laissé·e au bord de la route, « pour plus tard, quand tu auras repoussé ».', 'suiton'),
      {
        id: 'baisser_les_yeux',
        texte: 'Fixer ta tasse, et attendre qu’ils partent',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu fixes ton thé jusqu’à ce qu’il refroidisse. Quand tu relèves la tête, la table est vide, et quelqu’un a payé ta tasse. Sous la soucoupe, une plume de corbeau.',
      },
      FUIR,
    ],
  },
  {
    id: 'akc_desert',
    ...commun,
    titre: 'L’argile et le bois',
    categorie: 'organisation',
    lieu: 'desert_vent',
    poids: 3,
    si: { tout: [CHASSEUR, { un: [vivant('sasori'), vivant('deidara')] }] },
    texte: [
      { si: P1, texte: 'Le désert, à midi. Un oiseau blanc immense tourne au-dessus des dunes ; dessus, un garçon blond rit tout seul. En dessous, une silhouette bossue avance sans laisser de traces, et quelque chose se déplie sous son manteau, comme une queue de scorpion.' },
      { si: P2, texte: 'De nouveau l’oiseau d’argile, de nouveau la silhouette bossue. « Hm ! Le revoilà ! » crie le blond depuis le ciel. « Je déteste attendre », répond l’autre, sans lever la tête.' },
    ],
    choix: [
      combat('deidara', 'Deidara', 'Affronter Deidara avant qu’il prenne de la hauteur', 86, 'emporté·e par une explosion de Deidara, au milieu du désert', 'L’explosion t’a soufflé·e à cinquante pas. Quand tu rouvres les yeux, l’oiseau n’est plus qu’un point dans le ciel, et tes oreilles sifflent encore.'),
      combat('sasori', 'Sasori', 'Affronter Sasori, avec un antidote sous la langue', 88, 'empoisonné·e par les marionnettes de Sasori', 'Le poison a eu le temps d’agir. Tu survis par miracle, grâce à l’antidote, mais tes mains trembleront longtemps.'),
      FUIR,
    ],
  },
  {
    id: 'akc_bureau',
    ...commun,
    titre: 'Le bureau des primes',
    categorie: 'organisation',
    lieu: 'carrieres_terre',
    poids: 3,
    si: { tout: [CHASSEUR, { un: [vivant('hidan'), vivant('kakuzu')] }] },
    texte: [
      { si: P1, texte: 'Un bureau des primes, creusé dans la roche des carrières. Devant le guichet, un homme au masque cousu pose un cadavre sur la table et compte les pièces deux fois. Derrière lui, un autre, la faux sur l’épaule, prie à voix haute un dieu dont tu n’as jamais entendu le nom. Tu as vu leurs visages dans le Bingo Book.' },
      { si: P2, texte: 'Le guichetier blêmit en te voyant entrer : ils sont encore là, tous les deux. Le grand au masque relève la tête. « Ta prime a augmenté », dit-il. « Ça tombe bien. »' },
    ],
    choix: [
      combat('hidan', 'Hidan', 'Affronter Hidan, sans jamais le laisser goûter ton sang', 88, 'sacrifié·e à Jashin par Hidan', 'Il t’a entaillé·e une seule fois, et c’est ton propre cœur que tu as senti transpercé quand il s’est planté la lance dans la poitrine. Kakuzu l’a arrêté avant la fin. « Pas de prime sur celui-là. »'),
      combat('kakuzu', 'Kakuzu', 'Affronter Kakuzu, et ses cœurs volés', 92, 'tué·e par Kakuzu, qui t’a pris ton cœur', 'Les fils noirs t’ont serré jusqu’à ce que tu perdes connaissance. Kakuzu t’a jeté·e devant le bureau. « Revenir quand tu vaudras plus cher. »', 'raiton'),
      FUIR,
    ],
  },
  {
    id: 'akc_pluie',
    ...commun,
    titre: 'L’ange de papier',
    categorie: 'organisation',
    lieu: 'ame',
    poids: 2,
    si: { tout: [CHASSEUR, vivant('konan')] },
    texte: [
      { si: P1, texte: 'Amegakure, sous une pluie qui ne s’arrête jamais. Sur le toit de la tour la plus haute, une femme aux cheveux bleus, une fleur de papier dans les cheveux, te regarde monter l’escalier de fer. Autour d’elle, des feuilles de papier flottent, sèches, malgré la pluie.' },
      { si: P2, texte: 'La même tour, la même pluie. Elle t’attend, cette fois. « Je t’avais laissé partir. Tu aurais dû comprendre. »' },
    ],
    choix: [
      combat('konan', 'Konan', 'L’affronter sur le toit de la tour', 90, 'enseveli·e sous le papier de Konan, à Amegakure', 'Le papier t’a enveloppé·e jusqu’au cou. Elle t’a laissé·e là, sur le toit, sous la pluie. « Repars. » Tu as mis une nuit entière à te dégager.'),
      {
        id: 'ecouter',
        texte: 'Baisser les mains, et l’écouter',
        effets: [{ drapeau: 'konan_ecoutee' }, { secret: 'reve_yahiko' }, { ethique: { compassion: 3 } }],
        resultat: 'Elle parle longtemps, d’un garçon qui voulait arrêter la guerre, et d’un autre qui a voulu la gagner à sa place. Quand elle se tait, elle te tourne le dos. « Ne reviens pas. » Tu redescends l’escalier avec une histoire que personne d’autre ne connaît.',
      },
      FUIR,
    ],
  },
  AKATSUKI_VERDICT,
];
