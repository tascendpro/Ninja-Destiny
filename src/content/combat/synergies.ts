import type { ElementId } from '../../engine/types';
import type { Terrain } from './impacts';

/**
 * L'état du terrain pendant un combat : ce que les techniques laissent derrière elles, et que la suivante peut exploiter.
 * Chaque état dure quelques manches ; le lieu du combat peut en imposer un dès le départ (la côte est humide).
 */
export type EtatTerrain = 'humide' | 'brulant' | 'vapeur' | 'poussiere' | 'boue' | 'electrifie' | 'roches' | 'gele' | 'vents';

export const ETATS_TERRAIN: Record<EtatTerrain, { nom: string; kanji: string; detail: string }> = {
  humide: { nom: 'Terrain trempé', kanji: '濡', detail: 'L’eau conduit la foudre ; le feu y perd sa force.' },
  brulant: { nom: 'Zone en flammes', kanji: '焔', detail: 'Le vent l’attise ; l’eau la change en vapeur.' },
  vapeur: { nom: 'Vapeur', kanji: '霧', detail: 'On y voit mal : une attaque y est plus dure à lire.' },
  poussiere: { nom: 'Poussière', kanji: '塵', detail: 'Le vent la projette dans les yeux.' },
  boue: { nom: 'Boue', kanji: '泥', detail: 'Les appuis glissent : esquiver devient difficile.' },
  electrifie: { nom: 'Sol électrifié', kanji: '電', detail: 'L’eau garde encore la décharge.' },
  roches: { nom: 'Roches dressées', kanji: '岩', detail: 'Elles guident la foudre et cachent les mouvements.' },
  gele: { nom: 'Sol gelé', kanji: '氷', detail: 'Les pieds collent ou glissent.' },
  vents: { nom: 'Courants d’air', kanji: '颪', detail: 'Le vent tourne encore : il porte le feu et la poussière.' },
};

/** Ce qu'une nature laisse sur le terrain quand sa technique part (les techniques peuvent préciser). La manche en cours compte. */
export const TRACE_NATURE: Partial<Record<ElementId, { etat: EtatTerrain; manches: number }>> = {
  suiton: { etat: 'humide', manches: 3 },
  katon: { etat: 'brulant', manches: 3 },
  doton: { etat: 'roches', manches: 3 },
  fuuton: { etat: 'vents', manches: 2 },
  raiton: { etat: 'electrifie', manches: 2 },
};

/** Les lieux qui imposent un état dès le début du combat. */
export const TERRAIN_INITIAL: Partial<Record<Terrain, EtatTerrain>> = {
  cotes: 'humide',
  quai: 'humide',
  neige: 'gele',
  desert: 'poussiere',
  roche: 'roches',
};

export type NiveauSynergie = 'leger' | 'fort' | 'exceptionnel' | 'compromis';
export type EffetSynergie = 'sonne' | 'desequilibre' | 'perce' | 'aveugle' | 'zone';

export interface SynergieDef {
  nom: string;
  niveau: NiveauSynergie;
  /** Ajouté à la puissance (avant multiplicateurs). Négatif : la seconde nature y perd. */
  puissance: number;
  /** Retranché à sa chance de lire et d'éviter l'attaque. */
  precision: number;
  effet?: EffetSynergie;
  /** L'état que la synergie exige (sinon elle retombe d'un niveau), et celui qu'elle laisse. */
  exige?: EtatTerrain;
  laisse?: { etat: EtatTerrain; manches: number };
  /** Ce qu'elle retire du terrain (l'eau qui éteint les flammes). */
  efface?: EtatTerrain[];
  /** Ce qu'elle apporte, en une ligne (affiché dans la case des enchaînements). */
  resume: string;
  /** Ce qui se passe, raconté (jetons {il}, {Il}, {lui}, {nom}). */
  recits: string[];
}

/** La matrice : la nature d'avant, puis celle d'après. L'ordre compte : A puis B ne fait pas B puis A. */
export const SYNERGIES: Record<string, SynergieDef> = {
  'suiton>raiton': {
    nom: 'Propagation conductrice',
    niveau: 'fort',
    puissance: 14,
    precision: 0.15,
    effet: 'sonne',
    exige: 'humide',
    laisse: { etat: 'electrifie', manches: 2 },
    resume: 'La foudre court dans l’eau : plus forte, plus dure à éviter, et elle paralyse.',
    recits: [
      'Les arcs frappent d’abord l’eau répandue au sol, puis tout s’allume à la fois. {Il} essaie de bondir ; la décharge remonte le long de sa jambe avant que son pied quitte la flaque.',
      'L’eau était partout. La foudre aussi, maintenant. Chaque muscle de {nom} se tend à se rompre, les dents serrées sur un cri qui ne sort pas.',
      'Tu n’as pas besoin de viser : il suffit de toucher l’eau. La décharge s’étale en étoile et trouve {nom}, trempé{e} jusqu’aux os.',
    ],
  },
  'raiton>suiton': {
    nom: 'Courant porteur',
    niveau: 'leger',
    puissance: 6,
    precision: 0.1,
    effet: 'desequilibre',
    resume: 'La foudre engourdit, l’eau emporte : ses appuis cèdent.',
    recits: [
      'Ses jambes tremblent encore de la décharge. Quand l’eau arrive, {nom} n’a plus les appuis pour y résister : la vague soulève son corps et le jette au sol.',
      'La foudre a engourdi {nom} une seconde de trop. Ta vague frappe de côté, et son corps roule dans la boue.',
    ],
  },
  'fuuton>katon': {
    nom: 'Flammes attisées',
    niveau: 'fort',
    puissance: 14,
    precision: 0.05,
    effet: 'zone',
    exige: 'vents',
    laisse: { etat: 'brulant', manches: 4 },
    resume: 'Le vent nourrit le feu : la flamme va plus loin, plus large, plus vite.',
    recits: [
      'Le vent tourne encore quand ton feu part. Il l’avale, le gonfle, le pousse : la flamme fait trois fois sa taille et ne laisse plus de côté où se jeter.',
      'Ta rafale n’est pas retombée. Les flammes s’y accrochent et filent sur le courant d’air comme sur une route, droit sur {lui}.',
    ],
  },
  'katon>fuuton': {
    nom: 'Braises dispersées',
    niveau: 'leger',
    puissance: 8,
    precision: 0.05,
    effet: 'perce',
    exige: 'brulant',
    efface: ['brulant'],
    resume: 'Le vent arrache les braises et les projette autour de sa garde.',
    recits: [
      'Ta rafale arrache les braises au sol et les projette en nuée. Elles contournent sa garde par les côtés, par-dessus, partout où ses bras ne sont pas.',
      'Le vent soulève la cendre encore rouge et la jette au visage de {nom}. Sa garde tient devant ; tout le reste brûle.',
    ],
  },
  'doton>raiton': {
    nom: 'Paratonnerre de pierre',
    niveau: 'leger',
    puissance: 8,
    precision: 0.1,
    effet: 'zone',
    exige: 'roches',
    resume: 'Les roches dressées guident la foudre tout autour.',
    recits: [
      'La foudre saute de pointe en pointe, guidée par les roches que tu as levées. Elle l’atteint par trois côtés à la fois.',
      'Tes piliers de pierre servent de relais : l’éclair rebondit de l’un à l’autre et frappe derrière son abri.',
    ],
  },
  'raiton>doton': {
    nom: 'Roche fulgurante',
    niveau: 'leger',
    puissance: 6,
    precision: 0.05,
    effet: 'desequilibre',
    resume: 'La foudre engourdit, et le sol se dérobe au même instant.',
    recits: [
      'La décharge lui a pris les jambes une seconde. Le sol choisit ce moment pour s’ouvrir sous {lui}.',
      '{Il} secoue la tête pour chasser l’engourdissement ; quand {il} la relève, la roche est déjà là.',
    ],
  },
  'suiton>fuuton': {
    nom: 'Brouillard porté',
    niveau: 'leger',
    puissance: 4,
    precision: 0.2,
    effet: 'aveugle',
    exige: 'humide',
    laisse: { etat: 'vapeur', manches: 3 },
    resume: 'Le vent pulvérise l’eau en brouillard : ta prochaine attaque est cachée.',
    recits: [
      'Ta rafale pulvérise l’eau répandue en un brouillard fin. Tu disparais dedans, et ton attaque en sort par où {il} ne regardait pas.',
      'L’eau se change en embruns, puis en brume. {Il} plisse les yeux ; il est déjà trop tard.',
    ],
  },
  'fuuton>suiton': {
    nom: 'Vague portée',
    niveau: 'leger',
    puissance: 8,
    precision: 0.05,
    effet: 'desequilibre',
    resume: 'Le vent pousse l’eau : la vague arrive plus vite et plus haut.',
    recits: [
      'Le vent pousse ta vague dans le dos. Elle arrive deux fois plus haute que prévu et balaie {nom} comme une feuille.',
      'Portée par la rafale, l’eau frappe {nom} à hauteur de poitrine et l’arrache à ses appuis.',
    ],
  },
  'suiton>katon': {
    nom: 'Écran de vapeur',
    niveau: 'compromis',
    puissance: -6,
    precision: 0.2,
    effet: 'aveugle',
    exige: 'humide',
    efface: ['humide'],
    laisse: { etat: 'vapeur', manches: 3 },
    resume: 'L’eau étouffe ton feu, mais la vapeur brûlante te cache.',
    recits: [
      'Ton feu touche l’eau et meurt dans un sifflement. Un nuage de vapeur brûlante monte d’un coup : {il} recule, la peau rougie, et ne te voit plus.',
      'La flamme s’éteint dans les flaques, mais la vapeur qui jaillit est presque bouillante. {Il} se protège les yeux en jurant.',
    ],
  },
  'katon>suiton': {
    nom: 'Vapeur éteinte',
    niveau: 'compromis',
    puissance: -4,
    precision: 0.15,
    effet: 'aveugle',
    exige: 'brulant',
    efface: ['brulant'],
    laisse: { etat: 'vapeur', manches: 3 },
    resume: 'Ton eau éteint les flammes et lève un rideau de vapeur.',
    recits: [
      'Ton eau s’abat sur les flammes encore vives. Le terrain disparaît dans un grondement de vapeur ; {il} ne sait plus d’où viendra le coup suivant.',
      'La vague éteint le brasier d’un seul coup, et la vapeur monte si épaisse qu’on n’y voit plus sa main.',
    ],
  },
  'doton>fuuton': {
    nom: 'Tempête de poussière',
    niveau: 'leger',
    puissance: 6,
    precision: 0.15,
    effet: 'aveugle',
    exige: 'roches',
    laisse: { etat: 'poussiere', manches: 3 },
    resume: 'Le vent jette les débris et la poussière dans ses yeux.',
    recits: [
      'Ta rafale arrache la poussière et les éclats de roche que tu avais levés. {Il} se couvre le visage ; ses yeux pleurent, et ta suite arrive.',
      'Gravier, poussière, débris : le vent lui envoie tout le terrain au visage.',
    ],
  },
  'fuuton>doton': {
    nom: 'Éboulis porté',
    niveau: 'leger',
    puissance: 6,
    precision: 0.05,
    resume: 'Le vent l’a déplacé exactement là où la roche jaillit.',
    recits: [
      'La rafale l’a repoussé{e} de trois pas. Trois pas, c’est exactement là où la roche jaillit.',
      'Le vent pousse, la pierre attend. {nom} n’a pas le temps de comprendre l’ordre des choses.',
    ],
  },
  'doton>suiton': {
    nom: 'Enlisement',
    niveau: 'fort',
    puissance: 10,
    precision: 0.1,
    effet: 'desequilibre',
    exige: 'roches',
    laisse: { etat: 'boue', manches: 4 },
    resume: 'L’eau change la terre retournée en boue : chaque pas s’enlise.',
    recits: [
      'L’eau détrempe la terre que tu as retournée. En un instant, ses pieds s’enfoncent jusqu’aux chevilles ; chaque pas lui coûte deux fois plus.',
      'La boue l’avale jusqu’aux genoux. {Il} se débat, et plus {il} se débat, plus elle retient ses jambes.',
    ],
  },
  'suiton>doton': {
    nom: 'Boue lourde',
    niveau: 'leger',
    puissance: 6,
    precision: 0.1,
    effet: 'desequilibre',
    exige: 'humide',
    laisse: { etat: 'boue', manches: 4 },
    resume: 'La terre trempée devient une boue qui retient ses pieds.',
    recits: [
      'Le sol était trempé ; ta terre le change en boue épaisse. Ses pieds y restent collés au pire moment.',
      'La roche que tu soulèves est lourde d’eau. Elle retombe en boue et l’enserre jusqu’aux mollets.',
    ],
  },
  'katon>doton': {
    nom: 'Verrou de magma',
    niveau: 'fort',
    puissance: 10,
    precision: 0.05,
    effet: 'desequilibre',
    exige: 'brulant',
    laisse: { etat: 'brulant', manches: 4 },
    resume: 'La roche chauffée à blanc l’enferme dans un sol brûlant.',
    recits: [
      'La roche jaillit à travers les flammes et en sort rouge, presque liquide. Elle se referme autour de ses pieds ; l’odeur de cuir brûlé monte aussitôt.',
      'Tes pointes de pierre ont traversé le brasier. Elles sortent chauffées à blanc, et le sol où {il} se tient devient un piège qui fume.',
    ],
  },
  'doton>katon': {
    nom: 'Fournaise de pierre',
    niveau: 'leger',
    puissance: 8,
    precision: 0,
    exige: 'roches',
    resume: 'Les roches retiennent la chaleur et la renvoient de partout.',
    recits: [
      'Tes flammes s’engouffrent entre les roches dressées, qui les gardent comme un four. {Il} est pris{e} dedans.',
      'Les pierres chauffent et renvoient le feu de tous les côtés : il n’y a plus d’angle froid.',
    ],
  },
  'katon>raiton': {
    nom: 'Orage ardent',
    niveau: 'leger',
    puissance: 8,
    precision: 0.05,
    resume: 'L’air chauffé par les flammes porte la foudre plus loin.',
    recits: [
      'L’air brûlant tremble encore au-dessus des flammes. La foudre le traverse sans résistance et frappe avant que le tonnerre ne gronde.',
      'Le feu a rendu l’air léger ; ton éclair y file comme une aiguille.',
    ],
  },
  'raiton>katon': {
    nom: 'Étincelle et brasier',
    niveau: 'leger',
    puissance: 8,
    precision: 0,
    resume: 'Ta foudre a semé des étincelles ; le feu prend partout à la fois.',
    recits: [
      'Ta décharge a laissé des étincelles partout sur {lui}. Ton feu les rejoint, et {il} s’embrase par dix endroits à la fois.',
      'Ses vêtements fument encore de la foudre. La flamme n’a qu’à les toucher.',
    ],
  },
  'fuuton>raiton': {
    nom: 'Lame chargée',
    niveau: 'fort',
    puissance: 12,
    precision: 0.1,
    effet: 'perce',
    exige: 'vents',
    resume: 'La foudre s’accroche au vent qui tourne encore et passe sa garde.',
    recits: [
      'Le courant d’air que tu as levé tourne encore. La foudre s’y accroche comme à un fil et contourne sa garde.',
      'Les arcs électriques épousent la spirale de vent et lui arrivent de biais, là où ses bras ne couvrent rien.',
    ],
  },
  'raiton>fuuton': {
    nom: 'Vent ionisé',
    niveau: 'leger',
    puissance: 6,
    precision: 0.1,
    resume: 'La foudre fige ses réflexes : la lame d’air arrive avant qu’ils reviennent.',
    recits: [
      'Ses muscles tressautent encore de la foudre. Ta lame de vent trouve {nom} figé{e}, au milieu d’un geste qu’{il} n’arrive pas à finir.',
      'L’air sent l’orage. La rafale passe avant qu’{il} ait retrouvé ses réflexes.',
    ],
  },
};

/** Le lieu change les choses : il renforce, affaiblit ou crée certaines synergies. */
export const SYNERGIES_DE_LIEU: Partial<Record<Terrain, { cle: string; delta: 1 | -1; raison: string }[]>> = {
  desert: [
    { cle: 'suiton>raiton', delta: -1, raison: 'Le sable boit l’eau presque aussitôt.' },
    { cle: 'suiton>doton', delta: -1, raison: 'Le sable sec ne fait pas de boue.' },
    { cle: 'doton>fuuton', delta: 1, raison: 'Le désert fournit tout le sable du monde.' },
  ],
  foret: [{ cle: 'fuuton>katon', delta: 1, raison: 'La forêt prend feu : l’incendie te menace aussi.' }],
  cotes: [{ cle: 'suiton>raiton', delta: 1, raison: 'La mer est à deux pas : l’eau ne manque jamais.' }],
  quai: [{ cle: 'suiton>raiton', delta: 1, raison: 'Les planches ruissellent d’eau de mer.' }],
  neige: [{ cle: 'suiton>fuuton', delta: 1, raison: 'Dans ce froid, le brouillard gèle sur ses vêtements.' }],
  montagne: [{ cle: 'doton>fuuton', delta: 1, raison: 'Les éboulis ne manquent pas, en montagne.' }],
  roche: [{ cle: 'katon>doton', delta: 1, raison: 'La roche de la carrière garde la chaleur.' }],
};

/** Ce qu'un lieu fait de plus à une synergie renforcée (raconté une fois, au moment où ça arrive). */
export const RECITS_DE_LIEU: Partial<Record<Terrain, string>> = {
  foret: 'Les arbres prennent feu à leur tour. La chaleur te mord aussi le visage.',
  neige: 'Le brouillard se change en givre sur ses cils et ses doigts.',
  desert: 'Le sable s’élève en un mur roux.',
  cotes: 'Les embruns portent la décharge jusqu’aux rochers.',
  quai: 'Les planches mouillées crépitent sous ses pieds.',
  montagne: 'Des pierres roulent de la pente, prises dans la rafale.',
  roche: 'La paroi de la carrière renvoie la chaleur comme un four.',
};
