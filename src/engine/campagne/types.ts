// La campagne à deux : deux vies complètes (le format solo, inchangé), un lien entre elles, et ce qu'elles ont en commun.
// Le moteur ne sait pas s'il tourne sur un téléphone partagé ou en ligne : il reçoit des actions ordonnées et rend un état.

import type { Action, Creation, Effect, GameState } from '../types';
import type { ActionCombat, EtatAffrontement } from '../combat/types';

export type IdJoueur = 0 | 1;

export type TypeLien = 'freres' | 'clan' | 'amis' | 'rivaux' | 'inconnus' | 'clans_differents' | 'villages_differents' | 'improbable';

/** Ce qui rend possible une combinaison qui, sans elle, serait incohérente. */
export type OrigineLien = 'parents_separes' | 'demi_freres' | 'orphelinat' | 'demenagement' | 'refugies';

/** Ce qu'un personnage ressent pour l'autre. Chaque sens a ses propres valeurs : J1 peut admirer J2, qui le jalouse. */
export type AxeLien = 'confiance' | 'rivalite' | 'respect' | 'loyaute' | 'ressentiment' | 'jalousie' | 'dependance' | 'mefiance' | 'admiration' | 'dette' | 'peur_de_perdre';
export const AXES_LIEN: AxeLien[] = ['confiance', 'rivalite', 'respect', 'loyaute', 'ressentiment', 'jalousie', 'dependance', 'mefiance', 'admiration', 'dette', 'peur_de_perdre'];

export type PasseCommun = 'rencontre' | 'promesse' | 'dette' | 'competition' | 'secret' | 'perte' | 'mefiance';

export type Tonalite = 'chaud' | 'amer' | 'honteux' | 'fier' | 'tragique';

export interface SouvenirCommun {
  id: string;
  jour: number;
  texte: string;
  poids: 1 | 2 | 3 | 4 | 5;
  tonalite: Tonalite;
  /** Un souvenir peut n'appartenir qu'à l'un des deux. */
  connuDe: IdJoueur[];
}

export interface PromesseCommune {
  id: string;
  texte: string;
  jour: number;
  etat: 'tenue' | 'en_cours' | 'rompue';
}

export interface TechniqueDuo {
  id: string;
  nom: string;
  natures: string[];
  palier: number;
  usages: number;
}

export interface LienJoueurs {
  type: TypeLien;
  origine?: OrigineLien;
  passe: PasseCommun;
  /** Pour le passé « dette » : qui a sauvé l'autre. */
  sauveur?: IdJoueur;
  /** axes[0] : ce que J1 ressent pour J2 ; axes[1] : l'inverse. De 0 à 100. */
  axes: [Record<AxeLien, number>, Record<AxeLien, number>];
  /** La synchronisation de combat, partagée : elle monte avec ce qu'on vit ensemble. */
  accord: number;
  souvenirs: SouvenirCommun[];
  promesses: PromesseCommune[];
  /** Victoires de chacun dans les duels qui les ont opposés. */
  duels: [number, number];
  /** Les techniques de duo : il faut les lancer ensemble, dans la même manche. */
  techniquesDuo: TechniqueDuo[];
  /** Ce que chacun a vu l'autre utiliser (une technique jamais vue surprend vraiment). */
  vus: [string[], string[]];
}

/** Familles d'intentions : elles disent comment deux choix se combinent quand la scène ne prévoit pas le cas exact. */
export type FamilleIntention = 'agir' | 'observer' | 'parler' | 'partir' | 'proteger';

export interface ChoixCommun {
  id: string;
  texte: string;
  famille: FamilleIntention;
}

/** Ce qu'un cas de la matrice produit. « un » est celui dont le choix est cité en premier dans la clé, « deux » l'autre. */
export interface IssueCommune {
  /** « a+b » (choix exacts), « famille:agir+observer », « accord », « complement », « conflit » ou « defaut ». */
  cle: string;
  texte: string;
  effets?: { un?: Effect[]; deux?: Effect[]; les2?: Effect[] };
  lien?: { un?: Partial<Record<AxeLien, number>>; deux?: Partial<Record<AxeLien, number>>; les2?: Partial<Record<AxeLien, number>> };
  accord?: number;
  souvenir?: { id: string; texte: string; poids: SouvenirCommun['poids']; tonalite: Tonalite };
  promesse?: { id: string; texte: string };
  /** Un combat à deux qui suit la scène (lu par les deux d'abord). */
  combat?: string;
  /** Ce que l'issue change dans la campagne (fil de trahison, faits, scènes à venir). */
  apres?: (c: Campagne, un: IdJoueur) => void;
}

export interface SceneCommuneDef {
  id: string;
  titre: string;
  /** Les deux doivent avoir au moins cet âge (et au plus, si précisé). */
  age?: { min: number; max?: number };
  /** Les liens pour lesquels la scène existe (toutes si absent). */
  types?: TypeLien[];
  /** La scène d'introduction : jouée tout de suite, avant toute autre. */
  introduction?: boolean;
  /** Scène privée : un seul joueur la vit (celui que la fonction désigne), l'autre n'en sait rien. */
  privee?: (c: Campagne) => IdJoueur | undefined;
  /** La scène n'existe que si la condition est vraie au moment de l'ouvrir. */
  si?: (c: Campagne) => boolean;
  /** La chance que la scène fasse partie d'une campagne donnée (1 si absent) : deux campagnes ne se ressemblent pas. */
  tirage?: number;
  /** Scène ouverte par le moteur seulement (seuils du lien, deuil, révélation) : pas de barrière prévue à l'avance. */
  dynamique?: boolean;
  /** Le récit, avec {j1}, {j2} (prénoms) et, selon le cas, des variantes. */
  texte: string | ((c: Campagne) => string);
  /** Ce que l'un voit en plus de l'autre (indices, souvenir que l'autre n'a pas). */
  textePour?: (c: Campagne, j: IdJoueur) => string;
  choix: ChoixCommun[];
  /** Choix propres à chacun (sinon, les mêmes pour les deux). */
  choixPour?: (c: Campagne, j: IdJoueur) => ChoixCommun[];
  issues: IssueCommune[];
}

/** Une scène commune ouverte : qui a choisi quoi, en secret. */
export interface SceneCommuneEtat {
  id: string;
  choix: [string | undefined, string | undefined];
}

/** Ce qui vient de se passer dans une scène commune, à lire par les deux. */
export interface ResultatCommun {
  id: string;
  titre: string;
  texte: string;
  libelles: [string, string];
  lu: [boolean, boolean];
}

export interface Barriere {
  id: string;
  jour: number;
  introduction?: boolean;
}

/** Un fait : ce qui s'est passé, et qui le sait. Un dialogue ne cite un fait que si son locuteur le connaît. */
export interface Fait {
  id: string;
  /** Ce que sait celui qui le sait. */
  texte: string;
  /** Les joueurs (0, 1) et les autres (« kage », « heron ») qui le savent. */
  connus: (IdJoueur | string)[];
  /** Ce qui peut le trahir : chaque preuve rend la fuite plus probable. */
  preuves: number;
  jour: number;
  /** Celui que ce fait concerne, s'il ne le sait pas encore. */
  cible?: IdJoueur;
  /** Le même fait, raconté à celui qu'il vise quand il le découvre (le texte principal est celui de l'auteur). */
  texteCible?: string;
}

/** Une conséquence qui tombera plus tard, dans la vie de l'un des deux, sans qu'il sache d'où elle vient. */
export interface Repercussion {
  jour: number;
  cible: IdJoueur;
  type: 'enquete' | 'rumeur' | 'embuscade';
  faitId?: string;
}

/** Le fil de la trahison : chaque étape est une décision, jamais un automatisme. */
export interface FilTrahison {
  etape: 'aucune' | 'engage' | 'double' | 'abandonne' | 'revele' | 'rallie' | 'redemption';
  joueur?: IdJoueur;
  preuves: number;
}

/** Une proposition faite à l'autre (duel, technique de duo) : il l'accepte ou la refuse à son tour. */
export interface Proposition {
  de: IdJoueur;
  type: 'duel' | 'technique';
  /** Pour une technique de duo : le nom choisi. */
  nom?: string;
}

export type SigneCombat = 'couvre' | 'eau' | 'recule' | 'feinte' | 'attends' | 'gauche';

/** Un combat à deux (côte à côte contre un adversaire, ou l'un contre l'autre). */
export interface CombatDuo {
  def: string;
  mode: 'equipe' | 'duel';
  letal: boolean;
  /** Ce que chacun a choisi pour la manche (secret jusqu'à la résolution), et le signe envoyé à l'autre. */
  choix: [ActionCombat | undefined, ActionCombat | undefined];
  signes: [SigneCombat | undefined, SigneCombat | undefined];
  /** Les scènes que chacun retrouvera à la fin du combat. */
  scenesAvant: [GameState['scene'], GameState['scene']];
  aTerre: [boolean, boolean];
  /** Les mensonges par signe (« je couvre », puis rien) : trahisons de combat. */
  mensonges: [number, number];
  /** Le flux de hasard propre à ce combat : ses tirages ne déplacent ni ceux de J1, ni ceux de J2. */
  rng: number;
}

/** Ce que devient le joueur dont le personnage est mort. */
export type SuiteMort = 'heritier' | 'spectateur' | 'retour';

/** Ce qu'un joueur peut faire envers l'autre, hors des scènes : donner, enseigner, proposer, dénoncer, nuire, enquêter. */
export type ActionLien =
  | { t: 'donner'; ryo: number; pret?: boolean }
  | { t: 'enseigner'; technique: string }
  | { t: 'proposer'; type: 'duel' | 'technique'; nom?: string }
  | { t: 'repondre'; accepte: boolean }
  | { t: 'denoncer'; motif: string; faux?: boolean }
  | { t: 'nuire'; cible: 'parent' | 'sensei' | 'ami' }
  | { t: 'rumeur' }
  | { t: 'enqueter' };

/**
 * Une action du journal. Le moteur ajoute à l'enregistrement : son rang (seq), qui peut la voir (vis), le jour du calendrier.
 * « id » est l'identifiant d'idempotence donné par l'appareil : une action envoyée deux fois ne compte qu'une fois.
 */
export interface MetaAction {
  seq?: number;
  vis?: 'publique' | IdJoueur;
  jour?: number;
  id?: string;
}

export type ActionCampagne = MetaAction &
  (
  | { j: IdJoueur; a: Action }
  | { j: IdJoueur; commune: string }
  | { j: IdJoueur; lu: true }
  | { j: IdJoueur; privee: string; choix: string }
  | { j: IdJoueur; combat: ActionCombat; signe?: SigneCombat }
  | { j: IdJoueur; lien: ActionLien }
  | { j: IdJoueur; notesLues: true }
  | { j: IdJoueur; mort: SuiteMort }
  );

/** Un combat à deux défini par le contenu : contre qui, dans quel contexte, et ce que donnent la victoire et la défaite. */
export interface CombatDuoDef {
  id: string;
  /** La scène (événement enregistré) dont le combat porte le titre. */
  evenementId: string;
  mode: 'equipe' | 'duel';
  adversaire: string;
  contexte: EtatAffrontement['contexte'];
  letal?: boolean;
  plafond: number;
  /** L'adversaire est ajusté au binôme : endurance multipliée. */
  enduranceMult?: number;
  victoire: IssueCombat;
  defaite: IssueCombat;
  /** Le nom de l'adversaire, propre à la campagne (le binôme miroir de l'Akatsuki). */
  nomAdversaire?: (c: Campagne) => string;
  /** Un adversaire de rang Kage : y survivre ensemble est un titre. */
  kage?: boolean;
  /** Séparés (la brume) : chacun contre le sien, sans couvrir l'autre ni profiter de ses techniques. */
  separes?: boolean;
}

export interface IssueCombat {
  texte: string;
  effets?: Effect[];
  lien?: Partial<Record<AxeLien, number>>;
  accord?: number;
  souvenir?: string;
  apres?: (c: Campagne) => void;
}

/** Ce que le binôme a fait, aux yeux du monde : de quoi attribuer des titres vérifiables. */
export interface StatsBinome {
  victoires: number;
  defaites: number;
  /** Victoires où la foudre a porté un enchaînement. */
  victoiresRaiton: number;
  /** Victoires où l'un des deux s'est battu à l'arme. */
  victoiresLames: number;
  /** Vous avez survécu ensemble à un adversaire de rang Kage. */
  survivantsKage: boolean;
  /** Qui a déserté, un jour. */
  deserte: [boolean, boolean];
  /** Le jour où chacun est mort. */
  mort: [number | undefined, number | undefined];
  /** L'un a tué l'autre en duel. */
  tueParAutre?: IdJoueur;
  /** Un dernier duel, après 45 ans. */
  duelCrepuscule: boolean;
}

/** L'Akatsuki de cette campagne : des membres propres à cette chronologie, et ce que chacun des deux en est. */
export interface EtatAkatsuki {
  /** Les profils tirés pour cette campagne, par binômes. */
  binomes: [string, string][];
  recrues: IdJoueur[];
  infiltre?: IdJoueur;
  /** La couverture de l'infiltré : à zéro, il est démasqué. */
  couverture: number;
  chef?: IdJoueur;
  detruite: boolean;
  /** Les binômes de l'Akatsuki tombés sous vos coups. */
  vaincus?: number;
  /** Les ordres de l'Akatsuki exécutés par une recrue (ce qu'elle a fait pour eux, en secret). */
  ordres?: number;
}

/** La fin de la campagne : ce que les deux vies ont fait l'une de l'autre. */
export interface FinCampagne {
  id: string;
  titre: string;
  texte: string;
  /** Ce que chacun retient de l'autre ; lisible par l'autre seulement à la fin. */
  epilogues: [string, string];
  chronologie: string[];
  noteLien: number;
}

export interface Campagne {
  format: 1;
  graine: number;
  joueurs: [GameState, GameState];
  creations: [Creation, Creation];
  lien: LienJoueurs;
  /** Les moments où les deux doivent être présents, dans l'ordre du calendrier. */
  barrieres: Barriere[];
  commune?: SceneCommuneEtat;
  resultat?: ResultatCommun;
  /** Les scènes privées en attente, par joueur (un seul joueur les voit), avec le jour où elles s'ouvrent. */
  privees: [Barriere[], Barriere[]];
  /** Le résultat d'une scène privée, à lire par son seul joueur. */
  resultatPrive: [ResultatCommun | undefined, ResultatCommun | undefined];
  faits: Fait[];
  repercussions: Repercussion[];
  /** Ce qui est arrivé à chacun sans qu'il l'ait vu venir : lu à son prochain tour. */
  notes: [string[], string[]];
  fil: FilTrahison;
  combat?: CombatDuo;
  /** Le journal du dernier combat à deux, manche par manche, tel que chacun l'a vécu. */
  dernierCombat?: [EtatAffrontement['journal'], EtatAffrontement['journal']];
  /** Le combat qui suivra la lecture d'un résultat commun. */
  combatEnAttente?: string;
  proposition?: Proposition;
  /** Pour le joueur dont le personnage est mort : ce qu'il est devenu. */
  morts: [SuiteMort | 'a_choisir' | undefined, SuiteMort | 'a_choisir' | undefined];
  /** Les scènes déjà jouées (les scènes de seuil et dynamiques ne reviennent pas). */
  vues: string[];
  stats: StatsBinome;
  /** La chronique du monde : ce qu'on raconte de vous, saison après saison. */
  chronique: { jour: number; texte: string }[];
  akatsuki: EtatAkatsuki;
  fin?: FinCampagne;
  /** Qui jouait en dernier (pour départager quand les deux sont au même jour). */
  tour: IdJoueur;
  actions: ActionCampagne[];
}
