// ─────────────────────────────────────────────────────────────
// Ninja Destiny — modèle de données du moteur
// Le moteur ne contient aucun texte narratif : tout le contenu
// vit dans src/content et respecte ces types.
// ─────────────────────────────────────────────────────────────

export type VillageId = 'konoha' | 'suna' | 'kiri' | 'kumo' | 'iwa';
export type ElementId = 'katon' | 'suiton' | 'fuuton' | 'raiton' | 'doton';
export type Rang = 'eleve' | 'genin' | 'chunin' | 'jonin' | 'kage';
export const RANGS: Rang[] = ['eleve', 'genin', 'chunin', 'jonin', 'kage'];
/** « errant » : refoulé·e de l'Académie, parti·e s'endurcir sur les routes sans être déserteur. */
export type Statut = 'actif' | 'civil' | 'deserteur' | 'errant' | 'exile' | 'capture' | 'mort';

export type AttributId =
  | 'force'
  | 'agilite'
  | 'perception'
  | 'discretion'
  | 'intellect'
  | 'charisme'
  | 'controleChakra'
  | 'controleEmotionnel';
export const ATTRIBUTS: AttributId[] = [
  'force',
  'agilite',
  'perception',
  'discretion',
  'intellect',
  'charisme',
  'controleChakra',
  'controleEmotionnel',
];
export type JaugeId = 'sante' | 'chakra' | 'chakraMax' | 'fatigue' | 'ryo' | 'experience';
export type SocialId = 'loyaute' | 'reputation' | 'reputationOmbre' | 'influence' | 'confianceClan' | 'suspicion';
export type EthiqueId = 'compassion' | 'honneur' | 'ambition';
export type StatPath = `attributs.${AttributId}` | `jauges.${JaugeId}` | `social.${SocialId}` | `ethique.${EthiqueId}`;

export type RelationAxe = 'confiance' | 'respect' | 'amitie' | 'rivalite' | 'hostilite' | 'attachement' | 'peur' | 'dette';
export const AXES_RELATION: RelationAxe[] = ['confiance', 'respect', 'amitie', 'rivalite', 'hostilite', 'attachement', 'peur', 'dette'];

/** « confiee » : laissée trop longtemps au tableau, quelqu'un d'autre l'a faite. */
export type MissionStatut = 'en_cours' | 'reussie' | 'echouee' | 'abandonnee' | 'confiee';
export type Saison = 'printemps' | 'ete' | 'automne' | 'hiver';
export type Difficulte = 'recit' | 'shinobi' | 'legende';
export type Presentation = 'masculin' | 'feminin' | 'neutre';
export type MasteryTier = 0 | 1 | 2 | 3 | 4 | 5;
export type MasteryKind = 'clan' | 'jutsu' | 'element' | 'weapon_family' | 'base' | 'biju';
export type NpcEtat = 'vivant' | 'blesse' | 'disparu' | 'mort';
export type StatutArme = 'possedee' | 'pretee' | 'derobee' | 'confisquee' | 'perdue' | 'detruite' | 'vendue' | 'rendue';
export const STATUTS_ARME_UTILISABLES: StatutArme[] = ['possedee', 'pretee', 'derobee'];
export type RareteArme = 'commune' | 'qualite' | 'maitre' | 'legendaire' | 'maudite';
/** SS : rang propre au jeu, réservé aux pouvoirs mythiques au-delà du rang S. */
export type RangTechnique = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
export type RangMission = 'D' | 'C' | 'B' | 'A' | 'S';

export type ArcId =
  | 'origines'
  | 'formation'
  | 'premieres_missions'
  | 'examens'
  | 'crise'
  | 'conflit'
  | 'apres_guerre'
  | 'heritage';

export type CategorieId =
  | 'enfance'
  | 'quotidien'
  | 'academie'
  | 'examen'
  | 'entrainement'
  | 'mission'
  | 'amitie'
  | 'rivalite'
  | 'romance'
  | 'secret_familial'
  | 'politique'
  | 'conflit_clans'
  | 'trahison'
  | 'blessure'
  | 'capture'
  | 'desertion'
  | 'organisation'
  | 'guerre'
  | 'civils'
  | 'deuil'
  | 'promotion'
  | 'heritage'
  | 'reputation'
  | 'clan_rare'
  | 'epilogue'
  | 'eveil'
  | 'quete_legendaire'
  | 'arsenal'
  | 'metier';

// ── Conditions ───────────────────────────────────────────────
// Les références de PNJ acceptent un identifiant ou un rôle (« @sensei »).

export type Condition =
  | { tout: Condition[] }
  | { un: Condition[] }
  | { non: Condition }
  | { mission: string; statut: MissionStatut | MissionStatut[] | 'aucun' }
  | { relation: string; axe: RelationAxe; min?: number; max?: number }
  | { relationRompue: string; egal: boolean }
  | { pnj: string; etat: NpcEtat | NpcEtat[] }
  | { maitrise: string; palierMin?: number; palierMax?: number; eveille?: boolean; possede?: boolean }
  | { arme: string; utilisable?: boolean }
  /** Une arme utilisable en main, quelle qu'elle soit. */
  | { armeEnMain: boolean }
  | { registre: string; detenteur: string }
  | { drapeau: string; egal?: string | number | boolean; min?: number; max?: number; absent?: boolean }
  | { village: VillageId | VillageId[] }
  /** Le clan d'un personnage (« @rival », « @coequipierA »…), tiré à chaque partie. Testé avant « clan », qui parle du joueur. */
  | { clanPnj: string; clan: string | string[] }
  | { clan: string | string[] }
  | { element: ElementId | ElementId[] }
  | { age: { min?: number; max?: number } }
  | { rangMin: Rang }
  | { rang: Rang | Rang[] }
  | { statut: Statut | Statut[] }
  | { stat: StatPath; min?: number; max?: number }
  | { vu: string }
  | { nonVu: string }
  | { secret: string }
  | { indice: string }
  | { objet: string }
  | { metier: string | string[] }
  | { sansMetier: true }
  | { metierEligible: string }
  | { trait: string }
  | { aptitude: AttributId }
  | { objectif: string }
  | { presentation: Presentation }
  | { blesse: boolean }
  | { blessureGrave: boolean }
  | { chapitre: number }
  | { saison: Saison | Saison[] }
  | { difficulte: Difficulte | Difficulte[] }
  | { possedeArmeLegendaire: boolean }
  | { missionsReussies: number }
  /** Assez proche de cet équipier pour mêler vos natures en une technique à deux. */
  | { duo: string }
  | { ageDepart: number };

// ── Effets ───────────────────────────────────────────────────

export interface BlessureDef {
  id: string;
  nom: string;
  gravite: 1 | 2 | 3;
  jours: number;
  invalidante?: boolean;
}

export type Effect =
  | { si: Condition; alors: Effect[]; sinon?: Effect[] }
  | { hasard: { poids: number; effets: Effect[] }[] }
  | { stat: StatPath; delta?: number; valeur?: number }
  | { reputationMetier: number }
  | { drapeau: string; valeur?: string | number | boolean; incr?: number; retirer?: boolean }
  | { secret: string }
  | { indice: string }
  | { objet: string; retirer?: boolean }
  | { relation: string; delta: Partial<Record<RelationAxe, number>> }
  | { rompre: string }
  | { reconcilier: string }
  | { souvenir: string; pnj: string }
  | { promesse: string; pnj: string; texte: string }
  | { promesseTenue: string }
  | { promesseRompue: string }
  | { entrainer: string; jours: number; mentor?: boolean }
  | { combatSur: string[] }
  | { tenterEveil: string; intensite: number }
  | { eveilDanger: number }
  /** Œil d'un autre clan, greffé (acheté, volé, offert). */
  | { greffer: string }
  /** Un sans-nom se choisit un nom de famille, pour lui et ses descendants. */
  | { nomDeFamille: string }
  | { apprendre: string; source?: string }
  /** Enseignement du clan ou d'un aîné : la technique s'apprend même sans l'affinité, et la nature qui va avec s'éveille. */
  | { enseigner: string }
  /** Créer avec cet équipier la technique combinée de vos deux natures (elle ne se lance qu'à deux). */
  | { duo: string }
  | { copier: string }
  | { obtenirArme: string; statut?: 'possedee' | 'pretee' | 'derobee' }
  | { perdreArme: string; statut: 'perdue' | 'confisquee' | 'detruite' | 'vendue' | 'rendue'; vers?: string }
  | { recupererArme: string }
  | { equiper: string }
  | { usureArme: number }
  | { lienArme: string; delta: number }
  | { transfererRegistre: string; vers: string }
  | { metier: string; secondaire?: boolean }
  | { quitterMetier: 'principal' | 'secondaire' }
  | { palierMetier: number }
  | { blessure: BlessureDef }
  | { soigner: string }
  | { rang: Rang }
  | { statut: Statut }
  | { mission: string; statut: MissionStatut }
  | { planifier: string; dansJours: number }
  /** Un fil laissé ouvert : avec cette chance (tirée par la partie), la scène reviendra entre ces deux délais, en jours. */
  | { retour: string; chance: number; entre: [number, number] }
  | { temps: number }
  | { journal: string; importance?: 1 | 2 | 3 }
  | { decouvrir: string | string[] }
  | { pnjEtat: string; etat: NpcEtat; cause?: string; explication?: boolean }
  | { ethique: Partial<Record<EthiqueId, number>> }
  | { fin: string; cause?: string }
  | { chapitre: number }
  | { succes: string }
  | { role: string; pnj: string }
  | { eveillerPnj: string; maitrise: string };

// ── Événements ───────────────────────────────────────────────

export type Texte = string | { si?: Condition; texte: string }[];

export interface Outcome {
  texte: Texte;
  effets: Effect[];
  suite?: string;
}

export interface CheckDef {
  type: 'combat' | 'competence';
  difficulte: number;
  attributs: Partial<Record<AttributId, number>>;
  /** Poids par maîtrise ; « arme » désigne la famille de l'arme équipée. */
  maitrises?: Record<string, number>;
  arme?: boolean;
  modificateur?: number;
  /** Un échec peut tuer (combat à mort, embuscade…). */
  letal?: boolean;
  /** Nature de l'adversaire, pour l'avantage élémentaire des attaques spéciales. */
  elementAdverse?: ElementId;
  /** Ce qu'on écrira de ta mort si ce combat te tue. */
  causeMort?: string;
  /** Combat en plusieurs manches (une technique par manche). Par défaut : 2 pour un combat mortel difficile. */
  manches?: number;
  /** Duel ou combat contre une escouade (renseigné par la table des affrontements). */
  forme?: FormeCombat;
  /** Des alliés ou des civils se trouvent dans la mêlée : les techniques de zone peuvent les toucher. */
  allies?: boolean;
  /** Un adversaire reste à ta merci après la victoire : l'achever, l'épargner ou le ramener. */
  verdict?: boolean;
  critique?: Outcome;
  succes: Outcome;
  partiel?: Outcome;
  echec: Outcome;
}

export interface ChoiceDef {
  id: string;
  texte: string;
  si?: Condition;
  /** Si présent et que la condition échoue, le choix reste visible mais verrouillé avec cette raison. */
  verrou?: string;
  /** Indication de conséquence, affichée seulement quand elle est pertinente. */
  indice?: string;
  duree?: number;
  test?: CheckDef;
  effets?: Effect[];
  resultat?: Texte;
  suite?: string;
}

export interface EventDef {
  id: string;
  titre: string;
  chapitre: number;
  arc: ArcId;
  categorie: CategorieId;
  lieu: string;
  texte: Texte;
  personnages?: string[];
  /** Décor précis de la scène (bibliothèque des lieux), quand le lieu seul ne suffit pas. */
  decor?: string;
  si: Condition;
  choix: ChoiceDef[];
  /** > 0 : événement de trame, prioritaire dès que ses conditions sont réunies. */
  priorite?: number;
  /** > 0 : événement aléatoire contrôlé, tiré pendant le temps libre. */
  poids?: number;
  repetable?: { delaiJours: number; max?: number };
  rare?: boolean;
  secret?: boolean;
  /** Événement atteint uniquement par une suite, une planification ou une mission. */
  enchaine?: boolean;
  /** Chapitres où l'événement peut survenir (remplace la règle par défaut fondée sur « chapitre »). */
  chapitres?: number[];
  /** Planifié par le moteur lui-même (ex. deuil au retour de mission) : aucune autre scène n'y mène. */
  planifieParMoteur?: boolean;
}

// ── Maîtrise ─────────────────────────────────────────────────

export interface PalierDef {
  nom: string;
  effet: string;
}

export interface ExigencePalier {
  jours: number;
  combats: number;
  moisDepuisEveil?: number;
  ageMin?: number;
  drapeau?: string;
}

export interface EveilDef {
  ageMin: number;
  ageMax: number;
  potentielMin: number;
  chanceBase: number;
  /** Âge auquel l'éducation du clan éveille le pouvoir sans événement dédié. */
  automatique?: number;
  /** Drapeau requis au moment de la tentative. */
  declencheur?: string;
  /** Une seule tentative par partie. */
  unique?: boolean;
  /** Le pouvoir peut s'éveiller sous la menace (eveilDanger). */
  danger?: boolean;
}

export interface MasteryDef {
  id: string;
  nom: string;
  kind: MasteryKind;
  description: string;
  clan?: string;
  element?: ElementId;
  famille?: string;
  rang?: RangTechnique;
  kekkeiGenkai?: boolean;
  copiable?: boolean;
  eveil?: EveilDef;
  paliers: PalierDef[];
  exigences?: Partial<Record<1 | 2 | 3 | 4 | 5, Partial<ExigencePalier>>>;
  cout: string;
  prerequis?: { maitrise: string; palierMin: number }[];
  cachee?: boolean;
  /** Nature avancée : fusion de deux natures de base (ex. Yōton = Katon + Doton). */
  composantes?: ElementId[];
  /** Nature avancée : probabilité de naître porteur de la lignée, par village. */
  lignee?: Partial<Record<VillageId, number>>;
  /** Disciplines physiques (armes, taijutsu) : aucun plafond d'âge, seule l'expérience compte. */
  sansPlafondAge?: boolean;
  /** Technique apprenable et utilisable comme attaque spéciale. */
  technique?: TechniqueDef;
  /** Pouvoir ne pouvant jamais être entraîné via le temps libre (ex. Mangekyō). */
  nonEntrainable?: boolean;
  /** Kinjutsu : technique interdite. Statut indépendant du rang (coût, danger, sacrifice, conséquences). */
  kinjutsu?: { raison: string };
}

export type CategorieTechnique = 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'armes' | 'medical' | 'fuinjutsu' | 'fusion' | 'biju' | 'combinaison' | 'dojutsu' | 'transformation';

export type FormeCombat = 'duel' | 'escouade';
/** Portée d'une technique : une cible, une zone, ou tout le champ de bataille. */
export type PorteeTechnique = 'cible' | 'zone' | 'large';

/** Ce que devient une technique sur le terrain, selon qu'on affronte un seul adversaire ou un groupe. */
export interface RecitTechnique {
  portee: PorteeTechnique;
  duel: string;
  escouade: string;
  /** Les transformations changent avec la maîtrise : le récit du plus haut palier atteint remplace celui de base. */
  paliers?: { min: number; duel: string; escouade: string }[];
}

/** Une technique d'adversaire, lancée quand il prend l'initiative d'une manche. */
export interface TechniqueAdverse {
  id: string;
  nom: string;
  /** Rang minimal de l'adversaire pour la connaître : 1 (genin) à 4 (jōnin d'élite). */
  rang: 1 | 2 | 3 | 4;
  puissance: number;
  element?: ElementId;
  duel: string;
  escouade: string;
  /** Technique signature d'un adversaire nommé : jamais tirée pour un adversaire ordinaire. */
  signature?: boolean;
}

// ── Bibliothèque des lieux (décors illustrés) ──

export type CategorieDecor = 'village' | 'entrainement' | 'nature' | 'legendaire' | 'base' | 'interieur' | 'combat' | 'surnaturel' | 'voyage' | 'ambiance';

/** Ce qu'un décor peut accueillir, sans illustration différente à chaque fois. */
export type TypeScene = 'entrainement' | 'duel' | 'mission' | 'rencontre' | 'embuscade' | 'infiltration' | 'combat' | 'repos' | 'politique' | 'commerce' | 'soins' | 'rituel' | 'deuil' | 'decouverte';

export interface DecorDef {
  id: string;
  nom: string;
  region: string;
  categorie: CategorieDecor;
  description: string;
  /** Chemin public de l'image (/images/locations/…). Absente, la scène reste sans illustration. */
  image: string;
  tags: string[];
  /** Types de scènes compatibles. */
  scenes: TypeScene[];
  /** Variantes d'ambiance (autres décors du catalogue : nuit, pluie, neige…). */
  variantes?: string[];
  /** Accès restreint (lieu secret, révélé par l'histoire). */
  acces?: Condition;
  /** 1 : utilisé par le jeu aujourd'hui ; 2 : par les rencontres de lieu ; 3 : inventaire de production. */
  priorite: 1 | 2 | 3;
}

// ── Catalogue des techniques (référence encyclopédique, extensible sans code) ──

export type TypeTechnique =
  | 'ninjutsu'
  | 'taijutsu'
  | 'genjutsu'
  | 'fuinjutsu'
  | 'kuchiyose'
  | 'dojutsu'
  | 'iryo'
  | 'sensoriel'
  | 'marionnette'
  | 'armes'
  | 'clones'
  | 'deplacement'
  | 'transformation'
  | 'biju'
  | 'sceau_maudit'
  | 'dimensionnel'
  | 'six_chemins';

/** D'où vient une technique : manga, anime, Boruto, version du jeu, ou création originale. */
export type OrigineTechnique = 'manga' | 'anime' | 'boruto' | 'jeu' | 'original';

export interface FicheTechnique {
  id: string;
  japonais: string;
  francais: string;
  types: TypeTechnique[];
  /** Clan associé (identifiant du jeu quand le clan y existe). */
  clan?: string;
  utilisateurs?: string[];
  /** Natures et natures avancées (katon, mokuton, jinton…). */
  elements?: string[];
  rang: RangTechnique;
  /** Rang estimé pour le jeu, faute de référence officielle. */
  rangEstime?: boolean;
  chakra: 'faible' | 'modéré' | 'élevé' | 'très élevé' | 'colossal';
  portee: string;
  zone: string;
  effets: string;
  faiblesses: string;
  apprentissage: string;
  /** Niveau de maîtrise attendu (« chūnin confirmé », « Kage »…). */
  maitrise: string;
  origine: OrigineTechnique;
  /** Technique interdite : la raison, indépendante du rang. */
  kinjutsu?: string;
  consequences?: string;
  /** Identifiant de la technique jouable correspondante, quand elle existe dans le jeu. */
  jouable?: string;
}

/** Une fiche du Bingo Book : un ninja recherché, ou l'un des grands ninjas de l'époque. */
export interface FicheBingo {
  id: string;
  nom: string;
  surnom: string;
  village: string;
  rang: 'S' | 'A' | 'B';
  /** Prime en ryō (0 : aucun village n'en a fixé). */
  prime: number;
  liste: 'recherches' | 'legendes';
  affiliation?: string;
  description: string;
  techniques: string[];
  /** La consigne officielle des villages face à ce ninja. */
  consigne: string;
  /** Fiche scellée tant que la condition n'est pas remplie. */
  si?: Condition;
  /** Mentions ajoutées par ton histoire (rencontré, vaincu, maître…). */
  notes?: { si: Condition; texte: string }[];
}

/** La forme d'un combat (clé « événement/choix »). */
export interface Affrontement {
  forme: FormeCombat;
  allies?: boolean;
  /** Après une victoire, l'adversaire est à ta merci (missions, contrats, chasses). */
  verdict?: boolean;
}

export interface LimiteTechnique {
  /** Nombre d'usages possibles dans toute une vie (Izanagi : un par œil). */
  usages?: number;
  /** Réserve de chakra perdue pour toujours à chaque usage. */
  chakraMaxPerdu?: number;
  /** Risque de mort à chaque usage, à partir d'un palier donné (la huitième porte). */
  mort?: { chance: number; palierMin?: number };
  /** Sacrifice : la technique emporte toujours son utilisateur à la fin du combat. */
  sacrifice?: boolean;
  /** Ce que chaque usage coûte à la conscience (Edo Tensei). */
  ethique?: Partial<Record<EthiqueId, number>>;
  /** Pouvoir d'une bête : il peut échapper à qui contrôle mal ses émotions. */
  controle?: boolean;
  /** Ce qu'on lit avant de s'en servir. */
  avertissement: string;
}

/**
 * Une transformation n'est pas une attaque : on l'active (sans perdre de manche), et elle renforce
 * l'attaque et la défense jusqu'à la fin du combat. Certaines techniques n'existent que transformé.
 */
export interface PostureDef {
  /** Bonus d'attaque au palier 1 ; il croît avec la maîtrise. */
  attaque: number;
  /** Bonus d'esquive et de contre au palier 1. */
  defense: number;
  /** Récits d'entrée en transformation, par palier minimal (plusieurs variantes, tirées tour à tour). */
  entree: { min: number; textes: string[] }[];
  /** Ce que la transformation change, en une ligne. */
  effet: string;
  /** Ce qu'elle coûte à chaque manche pour être maintenue. */
  entretien?: { chakra?: number; sante?: number; fatigue?: number };
  /** Nombre maximal de manches avant qu'elle ne retombe d'elle-même. */
  duree?: number;
  /** Ce que raconte sa fin. */
  fin?: string;
}

export interface TechniqueDef {
  categorie: CategorieTechnique;
  /** Bonus de combat apporté au palier 1 ; il croît avec la maîtrise. */
  puissance: number;
  /** Chakra dépensé à chaque usage. */
  chakra: number;
  /** Santé perdue à chaque usage (techniques qui abîment le corps). */
  sante?: number;
  /** Santé rendue à chaque usage (sceau de régénération). */
  soin?: number;
  /** Ce que coûte vraiment une technique ultime : usages comptés, réserve perdue, mort possible, sacrifice. */
  limite?: LimiteTechnique;
  /** Transformation : un état qui dure tout le combat, pas une attaque. */
  posture?: PostureDef;
  /** Technique qui n'existe que sous l'une de ces transformations. */
  exigeTransformation?: string[];
  /** Utilisable comme attaque spéciale en combat. */
  offensive: boolean;
  /** Maîtrises requises pour l'apprendre (ex. nature_katon palier 1, famille_kenjutsu palier 2). */
  requis?: { maitrise: string; palierMin: number }[];
  /** Où l'apprendre : au village (instructeurs, archives), n'importe où (seul·e), ou auprès d'un maître rencontré (drapeau). */
  enseignee: 'village' | 'partout' | { drapeau: string; maitre: string };
  /** Combinaison : les deux natures lancées ensemble (pas une lignée, une technique que l'on invente). */
  elements?: ElementId[];
  /** Pouvoir propre à certains yeux seulement (ex. « mgk:amaterasu », tiré à l'éveil du Mangekyō). */
  drapeau?: string;
  /** Ce qui la distingue au combat : son rôle tactique, et la trace qu'elle laisse sur le terrain. */
  tactique?: TactiqueTechnique;
}

/**
 * Le rôle d'une technique dans l'Affrontement :
 * rapide (sort plus souvent, se lit moins), precis (se lit moins), perce (passe une garde), desequilibre (lui ôte ses appuis),
 * interrompt (brise une préparation), achevement (plus forte sur un adversaire sans appuis), ouverture (exige une ouverture,
 * sinon elle perd de sa force), defense (se lance pour encaisser : la part du coup qu'elle arrête).
 */
export interface TactiqueTechnique {
  effets?: ('rapide' | 'precis' | 'perce' | 'desequilibre' | 'interrompt' | 'achevement' | 'ouverture')[];
  defense?: number;
  terrain?: { etat: import('../content/combat/synergies').EtatTerrain; manches: number };
}

export interface MasteryState {
  id: string;
  kind: MasteryKind;
  potential: number;
  awakened: boolean;
  awakenedAtDay?: number;
  awakenedAtAge?: number;
  tier: MasteryTier;
  /** Jour où le palier actuel a été atteint (le corps s'y habitue avec les années). */
  palierDepuis?: number;
  trainingDays: number;
  combatUses: number;
  strain: number;
  lastUsedDay?: number;
  source?: 'heritage' | 'entrainement' | 'copie' | 'mentor' | 'parchemin' | 'academie' | 'creation' | 'greffe';
  bloquee?: boolean;
}

// ── Armes ────────────────────────────────────────────────────

export interface CapaciteArme {
  id: string;
  nom: string;
  description: string;
  palierMin: MasteryTier;
  lienMin: number;
  element?: ElementId;
}

export interface WeaponDef {
  id: string;
  nom: string;
  famille: string;
  rarete: RareteArme;
  unique: boolean;
  origine: string;
  description: string;
  histoire?: string;
  prix?: number;
  stats: { puissance: number; portee: number; poids: number; vitesse: number; robustesse: number; conduction: number };
  element?: ElementId;
  exigences: { force?: number; palierFamille?: number; element?: ElementId };
  capacites: CapaciteArme[];
  contreparties: string[];
  choisitPorteur?: Condition;
  quete?: string;
  detenteurInitial?: string;
  cachee?: boolean;
  licence?: 'naruto' | 'originale';
}

export interface WeaponInstance {
  defId: string;
  etat: number;
  lien: number;
  statut: StatutArme;
  lie: boolean;
  acquiseLe: number;
}

export type Registre = Record<string, { detenteur: string; depuis: number }>;

// ── Métiers ──────────────────────────────────────────────────

export interface CareerDef {
  id: string;
  nom: string;
  description: string;
  acces: Condition;
  ageMin: number;
  ageMinProdige?: number;
  rangMin?: Rang;
  evenementEntree?: string;
  paliers: string[];
  tagsExclusifs: string[];
  incompatibleAvec: string[];
  canal: 'public' | 'secret';
  salaireMensuel: number;
  avantages: string[];
  contraintes: string[];
  /** Le contenu de ce métier est jouable dans les chapitres publiés. */
  disponible: boolean;
  horsVillage?: boolean;
}

// ── Personnages ──────────────────────────────────────────────

export interface NpcDef {
  id: string;
  nom: string;
  genre: 'm' | 'f';
  village?: VillageId;
  clan?: string;
  role: string;
  /** Écart d'âge avec le joueur, en années. */
  ecart: number;
  rang: Rang | 'civil' | 'renegat';
  personnalite: string;
  objectifs: string;
  histoire: string;
  valeurs: string[];
  alliances: string[];
  rivalites: string[];
  limites: string;
  aime: string[];
  deteste: string[];
  maitrises: { id: string; palier: MasteryTier; potentiel?: number }[];
  rythme: number;
  prodige?: boolean;
  relationInitiale?: Partial<Record<RelationAxe, number>>;
  teinte?: number;
  /** PNJ visible dans l'encyclopédie dès la première rencontre seulement. */
  discret?: boolean;
}

export interface NpcState {
  etat: NpcEtat;
  naissance: number;
  maitrises: Record<string, MasteryState>;
  cause?: string;
  rencontre: boolean;
  /** Jour où un PNJ blessé redevient valide. */
  gueriLe?: number;
}

export interface RelationState {
  confiance: number;
  respect: number;
  amitie: number;
  rivalite: number;
  hostilite: number;
  attachement: number;
  /** Ce qu'il craint de toi (un combat perdu, une menace, une cruauté vue). */
  peur: number;
  /** Ce qu'il te doit (une vie épargnée, un sauvetage). */
  dette: number;
  rompue: boolean;
  souvenirs: string[];
}

// ── Missions et fins ─────────────────────────────────────────

export interface MissionDef {
  id: string;
  rang: RangMission;
  titre: string;
  description: string;
  lieu: string;
  duree: number;
  si: Condition;
  recompense: { ryo: number; reputation: number };
  risques: string;
  evenement: string;
  metiers?: string[];
}

export interface EndingDef {
  id: string;
  titre: string;
  /** Titres alternatifs selon la situation (le premier dont la condition est vraie l'emporte). */
  titres?: { si: Condition; titre: string }[];
  type: 'mort' | 'capture' | 'exil' | 'civile' | 'chapitre' | 'desertion' | 'secrete' | 'accomplie';
  texte: Texte;
  note?: string;
  /** Fin de chapitre : événement qui ouvre le chapitre suivant (bouton « Continuer »). */
  suite?: string;
}

export interface SuccesDef {
  id: string;
  nom: string;
  description: string;
  secret?: boolean;
  /** Débloqué automatiquement dès que la condition est vraie. */
  si?: Condition;
}

export interface ElementDef {
  id: ElementId;
  nom: string;
  kanji: string;
  description: string;
  fortContre: ElementId;
  faibleContre: ElementId;
}

export interface MondeDef {
  ere: string;
  anDepart: number;
  resume: string;
  chronologie: { an: number; texte: string }[];
}

export interface Contenu {
  version: string;
  /** Le contenu de l'Affrontement Racine : adversaires, combats branchés, récits, annonces. */
  racine: import('./combat/types').ContenuRacine;
  chapitresPublies: number[];
  monde: MondeDef;
  villages: VillageDef[];
  clans: ClanDef[];
  elements: ElementDef[];
  traits: TraitDef[];
  objectifs: ObjectifDef[];
  maitrises: MasteryDef[];
  armes: WeaponDef[];
  metiers: CareerDef[];
  pnj: NpcDef[];
  lieux: LieuDef[];
  evenements: EventDef[];
  missions: MissionDef[];
  fins: EndingDef[];
  succes: SuccesDef[];
  bijus: BijuDef[];
  heritages: HeritageDef[];
  sequences: SequenceDef[];
  encyclopedie: EntreeEncyclopedie[];
  /** rôle → identifiant de PNJ, pour chaque village. */
  roles: Record<VillageId, Record<string, string>>;
  noms: Record<VillageId, { m: string[]; f: string[] }>;
  /** Arme offerte à la remise du bandeau, par clan puis par village. */
  armesHeritage: { clan: Record<string, string>; village: Record<VillageId, string> };
  /** Récit de chaque attaque spéciale, en duel et contre une escouade. */
  recitsTechniques: Record<string, RecitTechnique>;
  /** Duel ou escouade, alliés présents ou non, pour chaque combat (clé « événement/choix »). */
  affrontements: Record<string, Affrontement>;
  /** Ce qui arrive quand une technique de zone touche un allié, par nature ou par famille (« defaut » sinon). */
  tirsAmis: Record<string, string>;
  /** Techniques lancées par les adversaires quand ils ont la priorité. */
  techniquesAdverses: TechniqueAdverse[];
  /** Le Bingo Book : ninjas recherchés et grands ninjas. */
  bingo: FicheBingo[];
  /** Catalogue encyclopédique des techniques. */
  catalogue: FicheTechnique[];
  /** Bibliothèque des décors illustrés. */
  decors: DecorDef[];
  /** Lieu du jeu → décor qui l'illustre par défaut. */
  decorsLieux: Record<string, string>;
  /** Événement → décor plus précis que son lieu. */
  decorsEvenements: Record<string, string>;
}

// ── Mondes ───────────────────────────────────────────────────

export interface VillageDef {
  id: VillageId;
  nom: string;
  nomComplet: string;
  pays: string;
  kage: string;
  kageNom: string;
  philosophie: string;
  situation: string;
  diplomatie: Record<VillageId, 'soi' | 'allie' | 'neutre' | 'tendu' | 'hostile'>;
  avantages: string[];
  contraintes: string[];
  tensions: string[];
  ennemis: string[];
  allies: string[];
  metiers: string[];
  armesTraditionnelles: string[];
  couleur: string;
  bonus: Partial<Record<AttributId, number>>;
  /** Natures que les instructeurs du village enseignent ; la première est sa nature emblématique. */
  naturesEnseignees: ElementId[];
  kanji: string;
}

export interface HeritageDef {
  id: string;
  nom: string;
  prix: number;
  description: string;
}

export interface SequenceDef {
  id: string;
  titre: string;
  kanji: string;
  /** Condition pour ouvrir cette séquence (évaluée dans l'ordre de la liste). */
  si: Condition;
  /** Condition qui clôt la séquence et déclenche son bilan. */
  fin: Condition;
}

/** Photographie de l'état au début ou à la fin d'une séquence. */
export interface Instantane {
  jour: number;
  age: number;
  attributs: Record<AttributId, number>;
  social: Record<SocialId, number>;
  ryo: number;
  chakraMax: number;
  paliers: Record<string, number>;
  secrets: number;
  missionsReussies: number;
  decisions: number;
  journal: number;
}

export interface SequenceVecue {
  id: string;
  debut: Instantane;
  fin?: Instantane;
}

export interface BijuDef {
  id: string;
  nom: string;
  queues: number;
  village: VillageId;
  description: string;
}

export interface ClanDef {
  id: string;
  nom: string;
  villages: VillageId[];
  rarete: 'commun' | 'rare' | 'tres_rare';
  histoire: string;
  techniques: string[];
  avantages: string[];
  faiblesses: string[];
  relations: string;
  personnages: string;
  evenementsHistoriques: string;
  secrets: string;
  accesAvance: string;
  contreparties: string;
  bonus: Partial<Record<AttributId, number>>;
  chakraBonus: number;
  elementsRequis?: ElementId[];
  elementsConseilles?: ElementId[];
  armeTraditionnelle?: string;
  licence: 'naruto' | 'originale' | 'aucune';
}

export interface LieuDef {
  id: string;
  nom: string;
  pays: string;
  scene: string;
  x: number;
  y: number;
  danger: number;
  description: string;
  village?: VillageId;
}

export interface TraitDef {
  id: string;
  nom: string;
  description: string;
  bonus: Partial<Record<AttributId, number>>;
  ethique?: Partial<Record<EthiqueId, number>>;
  social?: Partial<Record<SocialId, number>>;
  tag: string;
  special?: boolean;
}

export interface ObjectifDef {
  id: string;
  nom: string;
  description: string;
}

export interface EntreeEncyclopedie {
  id: string;
  categorie: 'village' | 'clan' | 'pouvoir' | 'technique' | 'arme' | 'metier' | 'personnage' | 'lieu' | 'organisation' | 'histoire';
  titre: string;
  resume: string;
  details: string[];
  /** Connue dès le début de toute partie. */
  publique?: boolean;
}

// ── État de partie ───────────────────────────────────────────

export interface Creation {
  prenom: string;
  /** Nom de famille : toujours dérivé du clan par le moteur (vide pour les sans-clan). */
  nom?: string;
  /** Origine d'un personnage sans clan. */
  origine?: 'famille' | 'orphelin';
  /** Héritage acheté à la boutique avec les ryō des vies précédentes. */
  heritage?: string;
  presentation: Presentation;
  ageDepart: 6 | 10;
  village: VillageId;
  clan: string;
  element: ElementId;
  traits: string[];
  aptitude: AttributId;
  objectif: string;
  difficulte: Difficulte;
}

export interface Blessure {
  id: string;
  nom: string;
  gravite: 1 | 2 | 3;
  guerison: number;
  invalidante: boolean;
}

export interface Promesse {
  id: string;
  pnj: string;
  texte: string;
  jour: number;
  etat: 'en_cours' | 'tenue' | 'rompue';
}

export interface EntreeJournal {
  jour: number;
  texte: string;
  importance: 1 | 2 | 3;
}

export interface Decision {
  jour: number;
  evenementId: string;
  titre: string;
  choixId: string;
  choix: string;
  issue?: Issue;
}

export type Issue = 'critique' | 'succes' | 'partiel' | 'echec';

export type Changement =
  | { t: 'stat'; chemin: StatPath; delta: number }
  | { t: 'relation'; pnj: string; axe: RelationAxe; delta: number }
  | { t: 'rupture'; pnj: string }
  | { t: 'reconciliation'; pnj: string }
  | { t: 'palier'; maitrise: string; palier: number }
  | { t: 'eveil'; maitrise: string }
  | { t: 'technique'; maitrise: string; message: string }
  | { t: 'arme'; arme: string; message: string }
  | { t: 'blessure'; nom: string; gravite: number }
  | { t: 'soin'; message: string }
  | { t: 'metier'; metier: string; message: string }
  | { t: 'rang'; rang: Rang }
  | { t: 'secret'; id: string }
  | { t: 'indice'; id: string }
  | { t: 'mission'; id: string; statut: MissionStatut }
  | { t: 'pnj'; pnj: string; etat: NpcEtat }
  | { t: 'promesse'; message: string }
  | { t: 'temps'; jours: number }
  | { t: 'succes'; id: string }
  | { t: 'info'; message: string }
  | { t: 'points'; age: number; total: number; gains: GainAnnuel[] };

/** Une source de points de stat gagnés à un anniversaire. */
export interface GainAnnuel {
  source: string;
  points: number;
}

export type Scene =
  | { type: 'evenement'; id: string }
  | {
      type: 'resultat';
      evenementId: string;
      titre: string;
      choix: string;
      texte: string;
      changements: Changement[];
      suite?: string;
      issue?: Issue;
      /** Carte de bilan d'un affrontement d'au moins deux manches (§16.2). */
      bilanCombat?: import('./combat/affrontement').BilanCombat;
    }
  | { type: 'temps_libre' }
  | import('./combat/types').EtatAffrontement
  | { type: 'bilan'; sequence: string }
  | { type: 'fin'; id: string }
  | {
      /** Combat en plusieurs manches : une technique par manche, l'adversaire esquive ou riposte. */
      type: 'combat';
      evenementId: string;
      choixId: string;
      manche: number;
      total: number;
      touches: number;
      ripostes: number;
      /** Ce qu'a donné chaque manche, dans l'ordre. */
      resultats: ('touche' | 'esquive' | 'riposte')[];
      journal: string[];
      techniques: string[];
      chakra: number;
      sante: number;
      /** L'adversaire a pris l'initiative : la technique qu'il lance, à esquiver ou contrer. */
      priorite?: string;
      /** Une esquive réussie ouvre sa garde : la manche suivante est à toi, avec un avantage. */
      ouverture?: boolean;
      /** Une permutation réussie : tu surgis dans son dos, l'avantage est plus grand. */
      dos?: boolean;
      /** La transformation active (jusqu'à la fin du combat, ou jusqu'à ce qu'elle retombe). */
      transformation?: string;
      /** Manches jouées depuis l'activation. */
      transfoTours?: number;
      /** Dōjutsu activé (Sharingan, Byakugan…) : il se paie en chakra à chaque manche. */
      dojutsu?: string;
      /** À quelle distance vous êtes l'un de l'autre : une technique ne se raconte pas pareil de loin et au contact. */
      distance?: 'loin' | 'proche';
      /** Contre une escouade, frapper un seul laisse les autres prendre l'initiative à la manche suivante. */
      expose?: boolean;
      /** Après ta dernière attaque, il a lancé un dernier assaut : le combat finit sur ta défense. */
      dernierAssaut?: boolean;
    };

/** Ce que la dernière période de temps libre a rapporté (pour le mini-bilan). */
export interface BilanPeriode {
  jour: number;
  libelle: string;
  paliers: { maitrise: string; palier: number }[];
  stats: { chemin: StatPath; delta: number }[];
}

export type Action =
  | { a: 'choix'; id: string }
  | ({ a: 'combat' } & import('./combat/types').ActionCombat)
  | { a: 'continuer' }
  | { a: 'activite'; id: string }
  /** Magasin et arsenal : acheter, réparer, changer d'arme, à tout moment hors combat. */
  | { a: 'magasin'; id: string }
  /** Donner un nom à son enfant ou à son conjoint (à tout moment, sans consommer de temps). */
  | { a: 'nommer'; cible: 'enfant' | 'conjoint'; nom: string }
  | { a: 'points'; repartition: Partial<Record<AttributId, number>> }
  | { a: 'chapitre' }
  | { a: 'manche'; id: string };

/** Ce que le destin a tiré à la naissance, sans que le joueur le choisisse. */
export interface Tirages {
  prodige: boolean;
  /** Bijū scellé dans le personnage, s'il est jinchūriki. */
  biju?: string;
  /** Natures avancées héritées (lignées), encore latentes. */
  lignees: string[];
  /** Orphelin ou sans clan : la lignée perdue dont on descend sans le savoir. */
  sangInconnu?: string;
}

export interface GameState {
  version: number;
  contenuVersion: string;
  seed: number;
  rngState: number;
  creation: Creation;
  tirages: Tirages;
  jour: number;
  jourDepart: number;
  naissance: number;
  attributs: Record<AttributId, number>;
  jauges: Record<JaugeId, number>;
  social: Record<SocialId, number>;
  ethique: Record<EthiqueId, number>;
  rang: Rang;
  rangDepuis: number;
  statut: Statut;
  metier: { principal?: string; secondaire?: string; palier: number; historique: { id: string; debut: number; fin?: number }[] };
  maitrises: Record<string, MasteryState>;
  arsenal: WeaponInstance[];
  armeEquipee?: string;
  registre: Registre;
  blessures: Blessure[];
  relations: Record<string, RelationState>;
  pnj: Record<string, NpcState>;
  pnjGeneres: Record<string, NpcDef>;
  roles: Record<string, string>;
  drapeaux: Record<string, string | number | boolean>;
  secrets: string[];
  indices: string[];
  objets: string[];
  promesses: Promesse[];
  missions: Record<string, MissionStatut>;
  evenementsVus: Record<string, { n: number; dernier: number }>;
  planifies: { evenementId: string; jour: number }[];
  decouvertes: string[];
  succes: string[];
  journal: EntreeJournal[];
  historique: Decision[];
  scene: Scene;
  fin?: { id: string; jour: number; cause?: string };
  chapitre: number;
  actions: Action[];
  /** Séquences de vie : la courante est la dernière sans fin. */
  sequences: SequenceVecue[];
  /** Points de stat gagnés aux anniversaires, pas encore répartis. */
  pointsStat: number;
  /** Mérites de l'année en cours (combats gagnés, épreuves, entraînement…), convertis à l'anniversaire. */
  merites: Record<string, number>;
  /** Ce que chaque anniversaire a rapporté. */
  anniversaires: { age: number; gains: GainAnnuel[] }[];
  /** Objets consommables achetés à l'échoppe (pilules, parchemins…), utilisables en combat. */
  consommables: Record<string, number>;
  /** Retour d'une action instantanée du temps libre (achat, dés…), affiché une fois. */
  annonce?: string;
  /** Ce que la dernière période de temps libre a rapporté. */
  bilanPeriode?: BilanPeriode;
  /** Mémoire des adversaires récurrents (Affrontement Racine) : ce qu'ils ont vu de toi, ce qui s'est passé. */
  registresCombat: Record<string, import('./combat/types').RegistreAdversaire>;
}
