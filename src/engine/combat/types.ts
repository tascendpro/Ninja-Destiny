// L'Affrontement Racine : les types du nouveau combat.
// Un combat se joue manche par manche : l'adversaire annonce (plus ou moins lisiblement) ce qu'il prépare,
// le joueur choisit une famille et une action, la manche se résout en trois temps (exécution, réponse, impact),
// puis une phrase dit pourquoi. Tout est tiré avec le hasard de la partie, dans un ordre fixe (voir resolution.ts).

import type { Condition, Effect, ElementId, Texte } from '../types';

export type Famille = 'taijutsu' | 'ninjutsu' | 'arme' | 'pouvoir' | 'defense' | 'objet' | 'observation' | 'parole' | 'fuite';
/** Ordre d'affichage, et ordre de priorité quand l'âge limite le nombre de familles visibles. */
export const FAMILLES: Famille[] = ['taijutsu', 'ninjutsu', 'arme', 'pouvoir', 'defense', 'objet', 'observation', 'parole', 'fuite'];

export type Temperament = 'prudent' | 'feroce' | 'joueur' | 'froid' | 'desespere' | 'fier';
export type NiveauAdv = 'enfant' | 'eleve' | 'genin' | 'chunin' | 'jonin' | 'elite' | 'kage' | 'biju';
export const NIVEAUX: NiveauAdv[] = ['enfant', 'eleve', 'genin', 'chunin', 'jonin', 'elite', 'kage', 'biju'];

export type ContexteId = 'bagarre' | 'entrainement' | 'provocation' | 'duel' | 'examen' | 'mission' | 'embuscade' | 'combat_a_mort' | 'capture';

/** Ce que l'adversaire décide de faire à une manche. « preparer » annonce une technique majeure à la manche suivante. */
export type IntentionAdv = 'attaque' | 'technique' | 'defense' | 'observer' | 'parler' | 'fuir' | 'preparer' | 'majeure';
export const INTENTIONS: IntentionAdv[] = ['attaque', 'technique', 'defense', 'observer', 'parler', 'fuir', 'preparer', 'majeure'];

export type Vitesse = 'rapide' | 'normale' | 'lente';
export type Garde = 'ouverte' | 'garde' | 'desequilibre';
export type Fiabilite = 'fiable' | 'vague' | 'trompeur';

/** Les sept issues d'une technique offensive (§10), plus la touche ordinaire. */
export type IssueOffensive = 'ratee' | 'predite' | 'annulee' | 'dominee' | 'ecrasee' | 'touche' | 'surprise' | 'decisive';

/** Comment un affrontement se termine. */
export type FinCombat = 'victoire' | 'defaite' | 'paix' | 'fuite' | 'fuite_adverse' | 'reddition_adverse' | 'departage_gagne' | 'departage_perdu' | 'departage_nul';

export type DepenseElan = 'puissance' | 'decisif';

/** Codes de rejet d'une action invalide (§7.3) : l'état n'est pas modifié. */
export type CodeRejet = 'ACTION_INCONNUE' | 'FAMILLE_INTERDITE' | 'RESSOURCE_INSUFFISANTE' | 'HORS_PORTEE' | 'PREREQUIS_MANQUANT' | 'ETAT_BLOQUANT' | 'ELAN_INVALIDE';

export class ErreurCombat extends Error {
  constructor(
    public code: CodeRejet,
    message: string,
  ) {
    super(message);
  }
}

export interface StatsAdv {
  endurance: number;
  chakra: number;
  vitesse: number;
  perception: number;
  discretion: number;
  force: number;
  controle: number;
  volonte: number;
  substitutions: number;
  /** Défense (encaisser) et attaque de base (puissance d'un coup ordinaire). */
  defense: number;
  attaque: number;
}

export interface Habitude {
  id: string;
  /** Quand l'habitude s'applique. Toutes les clés présentes doivent être vraies. */
  quand: { manche?: number; joueurEnGarde?: boolean; joueurRepete?: boolean; sousPct?: number };
  intention: IntentionAdv;
  poids: number;
  /** Le joueur peut l'apprendre en l'observant deux fois. */
  lisible: boolean;
  /** Ce que la fiche de lecture en dit, une fois apprise. */
  texte: string;
}

export type CategorieReplique =
  | 'entree'
  | 'revanche'
  | 'debut'
  | 'reussite_joueur'
  | 'rate_joueur'
  | 'repetition'
  | 'reconnaissance'
  | 'decouverte'
  | 'parade'
  | 'blessure'
  | 'provoque'
  | 'negociation'
  | 'reddition'
  | 'preparation'
  | 'defaite_imminente'
  | 'victoire_adv'
  | 'defaite_adv'
  | 'paix'
  | 'fuite_joueur';

/** Faits réels de la partie qu'une réplique peut exiger : le moteur sélectionne, il n'invente pas (§9). */
export interface QuandReplique {
  rencontresMin?: number;
  rencontresMax?: number;
  derniereIssue?: FinCombat[];
  /** L'action jouée cette manche avait déjà été vue par l'adversaire (dans un combat passé). */
  dejaVue?: boolean;
  /** L'action jouée cette manche était une technique jamais vue. */
  inedite?: boolean;
  /** Le joueur vient de répéter la même action. */
  repetition?: boolean;
  /** L'adversaire connaît une habitude d'ouverture du joueur (vue deux fois au moins). */
  habitudeConnue?: boolean;
  /** Le joueur a changé d'ouverture alors que l'adversaire attendait l'ancienne. */
  ouvertureChangee?: boolean;
  issue?: IssueOffensive[];
  ageMin?: number;
  ageMax?: number;
}

export interface Replique {
  id: string;
  categorie: CategorieReplique;
  texte: string;
  quand?: QuandReplique;
  si?: Condition;
  poids?: number;
  /** Une seule fois par partie. */
  unique?: boolean;
}

export interface AdversaireDef {
  id: string;
  /** Nom fixe ; sinon, celui du personnage désigné par `pnj`. */
  nom?: string;
  /** Rôle ou identifiant de personnage (« @rival ») : nom, genre et relation viennent de lui. */
  pnj?: string;
  /** Niveau fixe, ou déduit de l'âge du joueur (un rival grandit avec lui). */
  niveau: NiveauAdv | 'selon_age';
  /** Avec « selon_age » : combien de crans au-dessus (ou en dessous) du niveau du joueur. */
  ecartNiveau?: number;
  temperament: Temperament;
  /** Bascule de tempérament : touché deux fois, ou sous un seuil d'endurance (en %). */
  bascule?: { vers: Temperament; quand: 'touche_deux_fois' | 'sous_40' | 'sous_20' };
  /** Ajustements par rapport au gabarit de son niveau (note d'équilibrage dans la donnée si l'écart dépasse 15 %). */
  stats?: Partial<StatsAdv>;
  nature?: ElementId;
  /** Techniques adverses existantes (TechniqueAdverse) ; sinon, tirées selon le niveau et la nature. */
  techniques?: string[];
  /** Technique majeure : préparée une manche à l'avance, toujours annoncée. */
  majeure?: { nom: string; puissance: number; annonce: string };
  habitudes: Habitude[];
  /** Seuils en pourcentage d'endurance. */
  seuils: { fuite: number; reddition: number };
  /** Peut-il annoncer une fausse intention ? */
  feinte?: boolean;
  motivation: string;
  voix: { registre: 'enfantin' | 'familier' | 'courant' | 'soutenu' | 'militaire' | 'archaique'; tics: string[] };
  repliques: Replique[];
  resistances?: Partial<Record<ElementId | 'decisif', number>>;
  /** Un adversaire récurrent garde un registre de ce qu'il a vu de toi. */
  recurrent?: boolean;
  /** Genre grammatical, quand il n'est pas un personnage du jeu (« L'escouade » : féminin). */
  genre?: 'm' | 'f';
  /** Plusieurs ennemis : une technique de zone les prend tous, une ciblée n'en touche qu'un. */
  escouade?: boolean;
}

/** Une issue de conclusion propre à un affrontement : son texte et ses effets (sinon, ceux du CheckDef d'origine). */
export interface ConclusionDef {
  texte?: Texte;
  effets?: Effect[];
}

/** Un combat branché sur l'Affrontement Racine : la scène et le choix qui l'ouvrent, l'adversaire, le contexte. */
export interface AffrontementDef {
  adversaire: string;
  contexte: ContexteId;
  /** Ce qui pousse les deux à se battre (E32). */
  raison: string;
  /** Témoins présents (répliques, réputation). */
  temoins?: string[];
  conclusions?: Partial<Record<FinCombat, ConclusionDef>>;
  /** Familles interdites par la règle du combat (l'épreuve des lames : ni ninjutsu, ni pouvoirs). */
  interdit?: Famille[];
}

/** La mémoire persistante d'un adversaire récurrent (§13). */
export interface RegistreAdversaire {
  id: string;
  rencontres: number;
  victoires: number;
  defaites: number;
  nuls: number;
  derniereIssue?: FinCombat;
  derniereRencontre?: { age: number; chapitre: number };
  /** Ce qu'il a vu de toi : action ou technique → nombre de fois. */
  techniquesVuesDuJoueur: Record<string, number>;
  /** Tes habitudes qu'il a relevées (« ouverture:taijutsu/coup_puissant » → nombre de fois). */
  habitudesDuJoueur: Record<string, number>;
  /** Ce que toi, tu as vu de lui. */
  techniquesVuesParJoueur: string[];
  /** Ce qu'il a appris pour te contrer (une nature, une habitude). */
  contreMesures: string[];
  vivant: boolean;
}

export interface CombattantEtat {
  endurance: number;
  enduranceMax: number;
  garde: Garde;
  /** États temporaires : manches restantes. */
  sonne: number;
  vide: number;
}

/** Ce qu'une manche a donné : affiché en trois blocs, puis la phrase-cause (§7.5). */
export interface EntreeManche {
  manche: number;
  annonce: string;
  action: string;
  execution: string;
  reponse: string;
  impact: string;
  lecture: string;
  repliques: string[];
  issue?: IssueOffensive;
  /** Endurance que tu lui as fait perdre, et celle que tu as perdue, cette manche. */
  inflige?: number;
  subi?: number;
  /** Journal technique interne, pour le débogage (§0.3.18). */
  technique: string;
}

export interface LectureEtat {
  niveau: boolean;
  nature: boolean;
  faiblesse: boolean;
  /** Ses intentions observées (intention → nombre de fois). */
  intentions: Record<string, number>;
  /** Ses techniques vues. */
  techniquesVues: string[];
  /** Ses habitudes apprises (ids). */
  habitudes: string[];
}

export interface AnnonceEtat {
  texte: string;
  fiabilite: Fiabilite;
  /** Avertissement de danger mortel, obligatoire avant tout coup mortel (§7.2). */
  mortelle?: boolean;
}

export interface EtatAffrontement {
  type: 'affrontement';
  evenementId: string;
  choixId: string;
  contexte: ContexteId;
  adversaireId: string;
  /** Clé du registre : le personnage s'il y en a un, sinon l'adversaire. */
  registreId: string;
  nomAdversaire: string;
  niveauAdv: NiveauAdv;
  niveauJoueur: NiveauAdv;
  temperament: Temperament;
  manche: number;
  plafond: number;
  plafondVisible: boolean;
  joueur: CombattantEtat;
  adv: CombattantEtat & { chakra: number; substitutions: number };
  elan: number;
  intention: IntentionAdv;
  techniqueAdv?: string;
  annonce: AnnonceEtat;
  lecture: LectureEtat;
  /** Ce que l'adversaire a vu de toi pendant ce combat. */
  vuesCeCombat: Record<string, number>;
  /** À quelle distance vous êtes l'un de l'autre (le récit d'une technique en dépend). */
  distance?: 'loin' | 'proche';
  /** Une défense réussie à la dernière manche a ouvert une manche de plus : la contre-attaque. */
  prolonge?: boolean;
  /** Transformation active, et depuis combien de manches. */
  transformation?: string;
  transfoTours?: number;
  /** Dōjutsu activé : il se paie en chakra à chaque manche. */
  dojutsu?: string;
  /** Familles interdites par la règle de ce combat. */
  interdit?: Famille[];
  actionsJoueur: string[];
  journal: EntreeManche[];
  repliquesUtilisees: Record<string, number>;
  gardesConsecutives: number;
  /** Ouverture gagnée par le joueur (esquive, parade, garde adverse brisée) : bonus à la prochaine attaque. */
  ouverture: number;
  /** Manche où un danger mortel a été annoncé (un coup mortel n'est possible qu'après). */
  avertissementManche?: number;
  touchesSubiesAdv: number;
  provoque?: boolean;
  techniquesUtilisees: string[];
  /** Pour le bilan : ce qui a marché, ce qui a raté, et pourquoi. */
  bilan: { reussites: Record<string, number>; echecs: Record<string, string[]> };
}

export interface ActionCombat {
  famille: Famille;
  choix: string;
  elan?: DepenseElan;
}

/** Le contenu du combat, enregistré dans le registre (R.contenu.racine). */
export interface ContenuRacine {
  adversaires: AdversaireDef[];
  /** Clé « evenementId/choixId ». */
  affrontements: Record<string, AffrontementDef>;
  /** Récits par famille et issue : plusieurs variantes, tirées sans répétition immédiate. */
  recits: Record<string, string[]>;
  /** Annonces par intention : précises et vagues. */
  annonces: Record<IntentionAdv, { fiable: string[]; vague: string[] }>;
  /** Récits quand on relance la même technique (par nature, puis par famille), et ce que l'adversaire en dit. */
  repetitions: Record<string, { deux: string[]; trois: string[] }>;
  reactionsRepetition: { deux: string[]; trois: string[] };
}
