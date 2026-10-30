// La campagne à deux. Deux vies au format solo, inchangé : chacune avance avec les fonctions du moteur solo.
// Au-dessus : le lien entre les deux, les barrières (les moments où les deux doivent être là), les scènes communes et
// privées, les combats à deux, les secrets, et le journal ordonné des actions, qui suffit à tout rejouer.

import type { Creation, GameState } from '../types';
import { R } from '../registre';
import { JOUR_DEPART, appliquerActionMut, nouvellePartie } from '../moteur';
import { JOURS_AN } from '../calendrier';
import { appliquerEffets } from '../effets';
import { ajouterJournal, cloner, defPnj, nouveauCtx } from '../etat';
import { accorder } from '../texte';
import { SCENES_COMMUNES } from '../../content/campagne/scenes';
import { SCENES_VIE } from '../../content/campagne/scenesVie';
import { SCENES_ENFANCE } from '../../content/campagne/scenesEnfance';
import { SCENES_GENIN } from '../../content/campagne/scenesGenin';
import { SCENES_ADULTES } from '../../content/campagne/scenesAdultes';
import { SCENES_ARCS, SCENES_AKATSUKI } from '../../content/campagne/scenesArcs';
import { AXES_LIEN } from './types';
import type { ActionCampagne, ActionLien, AxeLien, Campagne, ChoixCommun, IdJoueur, IssueCommune, LienJoueurs, OrigineLien, PasseCommun, SceneCommuneDef, SigneCombat, SuiteMort, TypeLien } from './types';
import type { ActionCombat } from '../combat/types';
import { ageA, autre, borne, bouger, decaler, finie, hash01, jourMonde, noter, planifierCommune, texteCommun } from './outils';
import { aChoisirCombat, choisirCombatMut, ouvrirCombatDuo } from './combat';
import { agirLienMut, appliquerRepercussions } from './lien';
import { composerAkatsuki, conclureCampagne, suivreMonde } from './monde';

export { texteCommun } from './outils';
export { vueCombatDuo, SIGNES } from './combat';
export { actionsLien, ensemble } from './lien';

export const SCENES: Record<string, SceneCommuneDef> = Object.fromEntries([...SCENES_COMMUNES, ...SCENES_VIE, ...SCENES_ENFANCE, ...SCENES_GENIN, ...SCENES_ADULTES, ...SCENES_ARCS, ...SCENES_AKATSUKI].map((s) => [s.id, s]));

export const LIBELLES_LIEN: Record<TypeLien, string> = {
  freres: 'Frères et sœurs',
  clan: 'Membres du même clan',
  amis: 'Amis d’enfance',
  rivaux: 'Rivaux',
  inconnus: 'Inconnus',
  clans_differents: 'Clans différents',
  villages_differents: 'Villages différents',
  improbable: 'Rencontre improbable',
};
export const LIBELLES_ORIGINE: Record<OrigineLien, string> = {
  parents_separes: 'Parents séparés : l’un dans chaque village',
  demi_freres: 'Demi-frères ou demi-sœurs : même mère, pères différents',
  orphelinat: 'Séparés à l’orphelinat, confiés à deux villages',
  demenagement: 'Une enfance commune, puis un déménagement',
  refugies: 'Une enfance dans le même camp de réfugiés',
};
export const LIBELLES_PASSE: Record<PasseCommun, { nom: string; texte: string }> = {
  rencontre: { nom: 'Le jour où tout a commencé', texte: 'Vous vous êtes rencontrés enfants, et rien n’a plus été pareil.' },
  promesse: { nom: 'La promesse', texte: 'Vous vous êtes promis de devenir les meilleurs ninjas de votre génération.' },
  dette: { nom: 'La dette', texte: 'L’un a sauvé la vie de l’autre.' },
  competition: { nom: 'La compétition', texte: 'Vous vous êtes toujours disputé la première place.' },
  secret: { nom: 'Le secret', texte: 'Vous avez vu ensemble quelque chose que personne d’autre ne sait.' },
  perte: { nom: 'La perte', texte: 'Vous avez perdu un proche lors du même événement.' },
  mefiance: { nom: 'La méfiance', texte: 'Vos familles se sont toujours méfiées l’une de l’autre.' },
};

// ── Cohérence ────────────────────────────────────────────────

/** Le lien est-il possible entre ces deux personnages ? Sinon, une phrase qui dit pourquoi, et l'origine qui le rendrait possible. */
export function validerLien(c1: Creation, c2: Creation, type: TypeLien, origine?: OrigineLien): { erreur?: string; suggestion?: OrigineLien } {
  const memeVillage = c1.village === c2.village;
  const memeClan = c1.clan === c2.clan;
  const sansClan = (c: Creation) => c.clan === 'sans_clan';
  const ok = (cond: boolean, erreur: string, suggestion?: OrigineLien) => (cond ? {} : { erreur, suggestion });
  switch (type) {
    case 'freres':
      if (memeClan && memeVillage) return {};
      if (memeClan && !memeVillage) return sansClan(c1) ? {} : ok(origine === 'parents_separes', 'Même clan, villages différents : il faut une raison.', 'parents_separes');
      return ok(origine === 'demi_freres', 'Deux familles différentes pour des frères et sœurs : il faut une raison.', 'demi_freres');
    case 'clan':
      return ok(memeClan && !sansClan(c1), 'Membres du même clan : choisissez le même clan, et un vrai clan.');
    case 'amis':
      return ok(memeVillage || ['demenagement', 'refugies', 'orphelinat'].includes(origine ?? ''), 'Amis d’enfance dans deux villages : il faut un passé commun.', 'demenagement');
    case 'clans_differents':
      return ok(!memeClan, 'Clans différents : choisissez deux clans différents.');
    case 'villages_differents':
      return ok(!memeVillage, 'Villages différents : choisissez deux villages différents.');
    default:
      return {};
  }
}

// ── Le lien ──────────────────────────────────────────────────

const zero = (): Record<AxeLien, number> => Object.fromEntries(AXES_LIEN.map((a) => [a, 0])) as Record<AxeLien, number>;
const BASE: Record<TypeLien, Partial<Record<AxeLien, number>>> = {
  freres: { confiance: 40, loyaute: 45, peur_de_perdre: 40, rivalite: 20, jalousie: 10 },
  clan: { respect: 25, rivalite: 25, loyaute: 30, confiance: 25 },
  amis: { confiance: 45, loyaute: 35, admiration: 15 },
  rivaux: { rivalite: 55, respect: 25, jalousie: 20 },
  inconnus: { mefiance: 25 },
  clans_differents: { mefiance: 30, respect: 10 },
  villages_differents: { mefiance: 35 },
  improbable: { confiance: 20, mefiance: 15 },
};
const ACCORD_BASE: Record<TypeLien, number> = { freres: 30, amis: 25, clan: 20, rivaux: 20, inconnus: 5, clans_differents: 5, villages_differents: 5, improbable: 10 };

function lienInitial(type: TypeLien, origine: OrigineLien | undefined, passe: PasseCommun, sauveur?: IdJoueur): LienJoueurs {
  const axes: [Record<AxeLien, number>, Record<AxeLien, number>] = [{ ...zero(), ...BASE[type] }, { ...zero(), ...BASE[type] }];
  const lien: LienJoueurs = { type, origine, passe, sauveur, axes, accord: ACCORD_BASE[type], souvenirs: [], promesses: [], duels: [0, 0], techniquesDuo: [], vus: [[], []] };
  const ajout = (i: IdJoueur | 'les2', d: Partial<Record<AxeLien, number>>) => {
    for (const j of i === 'les2' ? ([0, 1] as IdJoueur[]) : [i]) for (const [k, v] of Object.entries(d)) axes[j][k as AxeLien] = borne(axes[j][k as AxeLien] + (v ?? 0));
  };
  // Le passé commun n'est pas un décor : il pose des valeurs, et un premier souvenir.
  if (passe === 'promesse') {
    ajout('les2', { loyaute: 10 });
    lien.promesses.push({ id: 'meilleurs_generation', texte: 'Devenir les meilleurs ninjas de votre génération.', jour: JOUR_DEPART, etat: 'en_cours' });
  }
  if (passe === 'dette') {
    const sauve = autre(sauveur ?? 0);
    ajout(sauve, { dette: 30, admiration: 15 });
    ajout(autre(sauve), { peur_de_perdre: 10 });
  }
  if (passe === 'competition') ajout('les2', { rivalite: 15, respect: 8 });
  if (passe === 'secret') ajout('les2', { confiance: 15 });
  if (passe === 'perte') ajout('les2', { peur_de_perdre: 15, dependance: 10 });
  if (passe === 'mefiance') ajout('les2', { mefiance: 20 });
  if (passe === 'rencontre') ajout('les2', { confiance: 5 });
  lien.souvenirs.push({ id: `passe_${passe}`, jour: JOUR_DEPART, texte: LIBELLES_PASSE[passe].texte, poids: 4, tonalite: passe === 'perte' ? 'tragique' : passe === 'mefiance' ? 'amer' : 'chaud', connuDe: [0, 1] });
  return lien;
}

/** Ce que tu ressens pour l'autre, en mots : jamais les chiffres, jamais ce que l'autre ressent pour toi. */
export function motsDuLien(c: Campagne, j: IdJoueur): string[] {
  const a = c.lien.axes[j];
  const n = c.creations[autre(j)].prenom;
  const m: string[] = [];
  m.push(a.confiance >= 70 ? `Tu fais pleinement confiance à ${n}.` : a.confiance >= 40 ? `Tu fais confiance à ${n}.` : a.confiance <= 15 ? `Tu ne fais pas confiance à ${n}.` : `${n} doit encore mériter ta confiance.`);
  if (a.loyaute >= 60) m.push(`Tu suivrais ${n} n’importe où.`);
  if (a.rivalite >= 50) m.push(`Dépasser ${n} compte plus que tout.`);
  else if (a.rivalite >= 25) m.push(`${n} reste ton rival, ou ta rivale.`);
  if (a.respect >= 50) m.push(`Tu respectes ce que ${n} est en train de devenir.`);
  if (a.admiration >= 40) m.push(`Tu admires ${n}, même si tu ne le dis pas.`);
  if (a.jalousie >= 40) m.push(`Tu jalouses parfois ${n}.`);
  if (a.ressentiment >= 30) m.push(`Tu en veux encore à ${n}.`);
  if (a.mefiance >= 30) m.push(`Tu te méfies de ${n}.`);
  if (a.dette >= 25) m.push(`Tu dois à ${n} quelque chose que tu ne pourras pas rendre facilement.`);
  if (a.peur_de_perdre >= 40) m.push(`Tu as peur de perdre ${n}.`);
  if (a.dependance >= 40) m.push(`Tu ne sais pas très bien qui tu serais sans ${n}.`);
  return m;
}

// ── Création ─────────────────────────────────────────────────

/** Deux graines distinctes tirées de celle de la campagne : chaque vie a son propre hasard. */
const graineDe = (g: number, j: IdJoueur, sel = 0) => (Math.imul((g + sel) ^ (j === 0 ? 0x9e3779b9 : 0x85ebca6b), 2654435761) >>> 0) || 1;

/** Le jour où les deux ont au moins cet âge. */
const jourDeLAge = (j: [GameState, GameState], age: number) => Math.max(...j.map((s) => s.naissance + age * JOURS_AN), JOUR_DEPART);

const FAMILLE = ['famille_parent', 'famille_aine'];
/** Frères et sœurs d'un même foyer (ou demi-frères : même mère) : le même parent, le même aîné, dans les deux vies. */
const memeFoyer = (c: Campagne) => c.lien.type === 'freres' && c.lien.origine !== 'parents_separes';

function partagerFamille(c: Campagne): void {
  if (c.lien.type !== 'freres') return;
  const [a, b] = c.joueurs;
  if (memeFoyer(c)) {
    for (const id of FAMILLE) {
      if (!a.pnjGeneres[id]) continue;
      b.pnjGeneres[id] = cloner(a.pnjGeneres[id]);
      b.pnj[id] = { ...cloner(a.pnj[id]), maitrises: cloner(a.pnj[id].maitrises) };
    }
    // Demi-frères : le parent commun est la mère.
    if (c.lien.origine === 'demi_freres') for (const s of [a, b]) s.pnjGeneres['famille_parent'].genre = 'f';
  } else {
    // Parents séparés : chacun a grandi avec l'un des deux. L'autre parent porte le genre opposé.
    const pa = a.pnjGeneres['famille_parent'];
    const pb = b.pnjGeneres['famille_parent'];
    if (pa && pb) {
      pb.genre = pa.genre === 'm' ? 'f' : 'm';
      const noms = R.contenu.noms[b.creation.village]?.[pb.genre];
      if (noms?.length) pb.nom = noms[Math.floor(hash01(c, 'parent2') * noms.length)];
      pb.clan = pa.clan;
    }
  }
}

export function nouvelleCampagne(c1: Creation, c2: Creation, lien: { type: TypeLien; origine?: OrigineLien; passe: PasseCommun; sauveur?: IdJoueur }, graine?: number): Campagne {
  const v = validerLien(c1, c2, lien.type, lien.origine);
  if (v.erreur) throw new Error(v.erreur);
  const g = (graine ?? Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const joueurs: [GameState, GameState] = [nouvellePartie(c1, graineDe(g, 0)), nouvellePartie(c2, graineDe(g, 1))];
  const c: Campagne = {
    format: 1,
    graine: g,
    joueurs,
    creations: [joueurs[0].creation, joueurs[1].creation],
    lien: lienInitial(lien.type, lien.origine, lien.passe, lien.sauveur),
    barrieres: [],
    privees: [[], []],
    resultatPrive: [undefined, undefined],
    faits: [],
    repercussions: [],
    notes: [[], []],
    fil: { etape: 'aucune', preuves: 0 },
    morts: [undefined, undefined],
    vues: [],
    stats: { victoires: 0, defaites: 0, victoiresRaiton: 0, victoiresLames: 0, survivantsKage: false, deserte: [false, false], mort: [undefined, undefined], duelCrepuscule: false },
    chronique: [],
    akatsuki: { binomes: [], recrues: [], couverture: 0, detruite: false },
    tour: 0,
    actions: [],
  };
  composerAkatsuki(c);
  partagerFamille(c);
  planifierAges(c);
  ouvrirBarriere(c);
  return c;
}

/** Les barrières de la trame : l'introduction tout de suite, puis chaque scène commune quand les deux ont l'âge. */
function planifierAges(c: Campagne): void {
  for (const sc of Object.values(SCENES)) {
    if (sc.dynamique || sc.privee || c.vues.includes(sc.id) || c.barrieres.some((b) => b.id === sc.id)) continue;
    if (sc.types && !sc.types.includes(c.lien.type)) continue;
    if (sc.introduction) {
      if (!c.actions.length) c.barrieres.push({ id: sc.id, jour: JOUR_DEPART, introduction: true });
    } else if (sc.age) {
      if (sc.tirage !== undefined && hash01(c, `tirage:${sc.id}`) >= sc.tirage) continue;
      // Une scène tirée tombe quelque part dans sa fenêtre d'âge, pas toujours au premier jour : elles s'étalent.
      // Les scènes de la trame (sans tirage) gardent leur ordre : elles tombent au premier jour.
      const fenetre = sc.tirage !== undefined && sc.tirage < 1 && sc.age.max !== undefined ? Math.max(0, sc.age.max - sc.age.min) : 0;
      const decalage = Math.floor(hash01(c, `quand:${sc.id}`) * Math.min(fenetre, 3) * JOURS_AN);
      c.barrieres.push({ id: sc.id, jour: jourDeLAge(c.joueurs, sc.age.min) + decalage });
    }
  }
  c.barrieres.sort((a, b) => (a.introduction ? -1 : b.introduction ? 1 : a.jour - b.jour));
}

// ── Le temps à deux ──────────────────────────────────────────

/** Le mort qui a choisi le retour participe à la scène où il revient. */
const present = (c: Campagne, j: IdJoueur, id?: string) => !finie(c.joueurs[j]) || (c.morts[j] === 'retour' && id === 'mc_retour');

/** Ce joueur est-il arrivé à la barrière (au jour dit, entre deux périodes) et doit-il attendre l'autre ? */
function arrive(c: Campagne, j: IdJoueur): boolean {
  const b = c.barrieres[0];
  if (!b) return false;
  const s = c.joueurs[j];
  if (b.introduction) return true;
  if (finie(s)) return present(c, j, b.id);
  return s.jour >= b.jour && s.scene.type === 'temps_libre';
}

/** Une barrière dont la scène n'a plus de sens (un absent, une fenêtre d'âge dépassée, une condition fausse) tombe. */
function nettoyerBarrieres(c: Campagne): void {
  while (c.barrieres.length) {
    const b = c.barrieres[0];
    const sc = SCENES[b.id];
    const absent = ([0, 1] as IdJoueur[]).some((j) => !present(c, j, b.id));
    const tropTard = !!sc?.age?.max && c.joueurs.some((s) => !finie(s) && s.scene.type === 'temps_libre' && ageA(s) > sc.age!.max!);
    if (!sc || absent || tropTard) c.barrieres.shift();
    else break;
  }
}

/** Les deux sont là : la scène commune s'ouvre (si sa condition tient toujours). */
function ouvrirBarriere(c: Campagne): void {
  for (;;) {
    nettoyerBarrieres(c);
    if (c.commune || c.resultat || c.combat || !c.barrieres.length) return;
    if (!(arrive(c, 0) && arrive(c, 1))) return;
    const sc = SCENES[c.barrieres[0].id];
    if (sc.si && !sc.si(c)) {
      c.barrieres.shift();
      continue;
    }
    c.commune = { id: sc.id, choix: [undefined, undefined] };
    return;
  }
}

/** La scène privée qui attend ce joueur, s'il y en a une. */
export function priveeDue(c: Campagne, j: IdJoueur): string | undefined {
  const s = c.joueurs[j];
  if (finie(s) || s.scene.type !== 'temps_libre' || c.commune || c.resultat || c.combat) return undefined;
  for (const p of c.privees[j]) {
    const sc = SCENES[p.id];
    if (p.jour <= s.jour && sc?.privee?.(c) === j && (!sc.si || sc.si(c))) return p.id;
  }
  for (const sc of Object.values(SCENES)) {
    if (!sc.privee || sc.dynamique || c.vues.includes(sc.id) || !sc.age) continue;
    const a = ageA(s);
    if (a < sc.age.min || (sc.age.max !== undefined && a > sc.age.max)) continue;
    if (sc.privee(c) === j && (!sc.si || sc.si(c))) return sc.id;
  }
  return undefined;
}

/**
 * À qui le tour. D'abord celui qui doit dire ce qu'il devient après sa mort ; puis la lecture d'un résultat commun ;
 * puis le combat à deux ; puis les choix d'une scène commune (J1 puis J2) ; puis le plus en retard dans le calendrier,
 * tant qu'il n'est pas arrivé à la barrière.
 */
export function joueurActif(c: Campagne): IdJoueur | null {
  const choixMort = ([0, 1] as IdJoueur[]).find((j) => c.morts[j] === 'a_choisir');
  if (choixMort !== undefined) return choixMort;
  if (c.resultat) {
    const j = ([0, 1] as IdJoueur[]).find((x) => !c.resultat!.lu[x]);
    if (j !== undefined) return j;
  }
  if (c.combat) return aChoisirCombat(c);
  if (c.commune) {
    const j = ([0, 1] as IdJoueur[]).find((x) => c.commune!.choix[x] === undefined && present(c, x, c.commune!.id));
    if (j !== undefined) return j;
  }
  const libres = ([0, 1] as IdJoueur[]).filter((j) => !finie(c.joueurs[j]) && !enAvance(c, j) && (!arrive(c, j) || !!c.resultatPrive[j] || !!priveeDue(c, j)));
  if (!libres.length) return null;
  if (libres.length === 1) return libres[0];
  const [a, b] = libres.map((j) => c.joueurs[j].jour);
  if (a !== b) return a < b ? 0 : 1;
  return c.tour;
}

/** Remet la campagne d'aplomb après un chargement : les scènes dues s'ouvrent. */
export function rafraichir(c0: Campagne): Campagne {
  const c = cloner(c0);
  // Une sauvegarde passée par JSON : les « pas encore » (undefined) des paires sont devenus null ; on les rend.
  const paire = <T>(x: [T | null | undefined, T | null | undefined] | undefined) => {
    if (x) for (const i of [0, 1]) if (x[i] === null) x[i] = undefined;
  };
  paire(c.commune?.choix);
  paire(c.morts);
  paire(c.resultatPrive);
  paire(c.stats?.mort);
  paire(c.combat?.choix);
  paire(c.combat?.signes);
  // Une sauvegarde d'une version antérieure : les champs du monde arrivent vides.
  c.stats ??= { victoires: 0, defaites: 0, victoiresRaiton: 0, victoiresLames: 0, survivantsKage: false, deserte: [false, false], mort: [undefined, undefined], duelCrepuscule: false };
  c.chronique ??= [];
  if (!c.akatsuki) {
    c.akatsuki = { binomes: [], recrues: [], couverture: 0, detruite: false };
    composerAkatsuki(c);
  }
  apresAction(c);
  return c;
}

/** Ce qui retient le joueur qui n'a pas la main (pour l'écran de passage). */
export function enAttente(c: Campagne, j: IdJoueur): string | undefined {
  if (finie(c.joueurs[j])) return c.morts[j] === 'spectateur' ? 'Tu suis désormais l’histoire de l’autre.' : undefined;
  if (arrive(c, j) && !c.commune) return `En attente de ${c.creations[autre(j)].prenom} : un moment que vous vivrez ensemble approche.`;
  if (enAvance(c, j)) return `En attente de ${c.creations[autre(j)].prenom}, qui a une année de retard sur toi.`;
  return undefined;
}

// ── Agir : un seul réducteur ─────────────────────────────────

/** Au-delà de cet écart (un an), le joueur en avance attend l'autre : une barrière douce. */
export const ECART_MAX = 360;
const enAvance = (c: Campagne, j: IdJoueur) => !finie(c.joueurs[autre(j)]) && c.joueurs[j].jour - c.joueurs[autre(j)].jour > ECART_MAX;

function apresAction(c: Campagne): void {
  suivreMonde(c);
  appliquerRepercussions(c);
  synchroniserFamille(c);
  verifierMorts(c);
  verifierFuite(c);
  verifierSeuils(c);
  ouvrirBarriere(c);
  // Les deux vies sont finies (et aucun mort n'attend de choisir) : la campagne se conclut.
  if (!c.fin && c.joueurs.every(finie) && !c.morts.includes('a_choisir') && !c.combat) c.fin = conclureCampagne(c);
}

/** Qui peut voir une action dans le journal : ce qui ne regarde qu'un joueur reste à lui. */
export function visibilite(x: ActionCampagne): 'publique' | IdJoueur {
  if ('mort' in x) return 'publique';
  if ('lien' in x) return ['donner', 'enseigner', 'proposer', 'repondre'].includes(x.lien.t) ? 'publique' : x.j;
  return x.j;
}

/** Vérifie qu'une action est permise maintenant, sans rien modifier. Le serveur fait exactement la même chose. */
export function valider(c: Campagne, x: ActionCampagne): void {
  const j = x.j;
  const s = c.joueurs[j];
  const non = (m: string): never => {
    throw new Error(m);
  };
  if (j !== 0 && j !== 1) non('Joueur inconnu.');
  if ('a' in x) {
    if (finie(s) || c.combat || c.commune || (c.resultat && !c.resultat.lu[j]) || c.resultatPrive[j] || priveeDue(c, j) || c.morts[j] === 'a_choisir' || arrive(c, j) || enAvance(c, j)) non('Ce n’est pas ton tour.');
  } else if ('commune' in x) {
    if (!c.commune || c.commune.choix[j] !== undefined || !present(c, j, c.commune.id)) non('Aucun choix commun en attente pour toi.');
    if (!choixDe(c, SCENES[c.commune!.id], j).some((y) => y.id === x.commune)) non(`Choix inconnu : ${x.commune}`);
  } else if ('lu' in x) {
    if (!(c.resultat && !c.resultat.lu[j]) && !c.resultatPrive[j]) non('Rien à lire.');
  } else if ('privee' in x) {
    if (priveeDue(c, j) !== x.privee) non('Aucune scène privée en attente.');
  } else if ('combat' in x) {
    if (!c.combat || c.combat.choix[j] || c.combat.aTerre[j]) non('Pas d’action de combat attendue de toi.');
  } else if ('lien' in x) {
    if (finie(s)) non('Ta vie est terminée.');
  } else if ('mort' in x) {
    if (c.morts[j] !== 'a_choisir') non('Rien à choisir.');
  }
}

/** Le réducteur : applique une action validée. Le direct, le rejeu et le serveur passent tous par ici, dans le même ordre. */
function appliquerMut(c: Campagne, x: ActionCampagne): void {
  const j = x.j;
  const { seq: _seq, vis: _vis, jour: _jour, ...brute } = x;
  c.actions.push({ ...brute, seq: c.actions.length + 1, vis: visibilite(x), jour: c.joueurs[j].jour } as ActionCampagne);
  if ('a' in x) {
    appliquerActionMut(c.joueurs[j], x.a);
    c.tour = j;
  } else if ('commune' in x) choisirCommuneMut(c, j, x.commune);
  else if ('lu' in x) lireMut(c, j);
  else if ('privee' in x) choisirPriveeMut(c, j, x.privee, x.choix);
  else if ('combat' in x) choisirCombatMut(c, j, x.combat, x.signe);
  else if ('lien' in x) {
    agirLienMut(c, j, x.lien);
    // Une trahison découverte par l'enquête ouvre la confrontation.
    if (x.lien.t === 'enqueter' && c.faits.some((f) => (f.id === 'pacte_heron' || f.id === 'itineraire') && f.connus.includes(j) && f.cible === j)) planifierCommune(c, 'mc_revelation', 0);
  } else if ('notesLues' in x) c.notes[j] = [];
  else if ('mort' in x) choisirMortMut(c, j, x.mort);
  apresAction(c);
}

/**
 * Soumettre une action : déjà vue (même identifiant d'idempotence), elle ne compte pas une deuxième fois ;
 * sinon elle est validée, puis appliquée. C'est l'unique porte d'entrée de la campagne.
 */
export function soumettre(c0: Campagne, x: ActionCampagne): Campagne {
  if (x.id && c0.actions.some((y) => y.id === x.id)) return c0;
  valider(c0, x);
  const c = cloner(c0);
  appliquerMut(c, x);
  return c;
}

/** Une action du moteur solo (l'interface passe une fonction) : on en déduit les actions, qu'on soumet une à une. */
export function agir(c0: Campagne, j: IdJoueur, fn: (s: GameState) => GameState): Campagne {
  valider(c0, { j, a: { a: 'continuer' } });
  const avant = c0.joueurs[j].actions.length;
  const s = fn(cloner(c0.joueurs[j]));
  let c = c0;
  for (const a of s.actions.slice(avant)) c = soumettre(c, { j, a });
  return c;
}

/** Choisir, en secret, dans une scène commune. Quand les deux ont choisi, la scène se résout. */
export const choisirCommune = (c: Campagne, j: IdJoueur, choixId: string) => soumettre(c, { j, commune: choixId });
/** Lire le résultat (commun ou privé) : quand les deux ont lu un résultat commun, chacun reprend sa vie. */
export const lireResultat = (c: Campagne, j: IdJoueur) => soumettre(c, { j, lu: true });
export const choisirPrivee = (c: Campagne, j: IdJoueur, choixId: string) => soumettre(c, { j, privee: priveeDue(c, j) ?? '', choix: choixId });
export const choisirCombat = (c: Campagne, j: IdJoueur, a: ActionCombat, signe?: SigneCombat) => soumettre(c, { j, combat: a, signe });
export const agirLien = (c: Campagne, j: IdJoueur, x: ActionLien) => soumettre(c, { j, lien: x });
export const lireNotes = (c: Campagne, j: IdJoueur) => soumettre(c, { j, notesLues: true });
export const choisirMort = (c: Campagne, j: IdJoueur, suite: SuiteMort) => soumettre(c, { j, mort: suite });

function choisirCommuneMut(c: Campagne, j: IdJoueur, choixId: string): void {
  if (!c.commune || c.commune.choix[j] !== undefined) throw new Error('Aucun choix commun en attente pour toi.');
  const sc = SCENES[c.commune.id];
  if (!choixDe(c, sc, j).some((x) => x.id === choixId)) throw new Error(`Choix inconnu : ${choixId}`);
  c.commune.choix[j] = choixId;
  const absent = ([0, 1] as IdJoueur[]).find((x) => !present(c, x, sc.id));
  if (absent !== undefined) c.commune.choix[absent] = choixDe(c, sc, absent)[0]?.id;
  if (c.commune.choix[0] !== undefined && c.commune.choix[1] !== undefined) resoudreCommune(c);
}

function lireMut(c: Campagne, j: IdJoueur): void {
  if (c.resultat && !c.resultat.lu[j]) {
    c.resultat.lu[j] = true;
    if (c.resultat.lu[0] && c.resultat.lu[1]) {
      c.resultat = undefined;
      if (c.combatEnAttente) {
        const id = c.combatEnAttente;
        c.combatEnAttente = undefined;
        ouvrirCombatDuo(c, id);
      }
      apresAction(c);
    }
    return;
  }
  if (c.resultatPrive[j]) c.resultatPrive[j] = undefined;
}

// ── La matrice ───────────────────────────────────────────────

const COMPATIBLES = new Set(['agir+observer', 'observer+agir', 'parler+proteger', 'proteger+parler', 'agir+proteger', 'proteger+agir', 'observer+parler', 'parler+observer']);

function choixDe(c: Campagne, sc: SceneCommuneDef, j: IdJoueur): ChoixCommun[] {
  return sc.choixPour?.(c, j) ?? sc.choix;
}

/**
 * Le cas de la matrice : exact (« a+b »), avec joker (« a+* »), par familles, puis accord / complément / conflit, puis défaut.
 * « un » est celui dont le choix est cité en premier dans la clé.
 */
export function issuePour(sc: SceneCommuneDef, c1: string, c2: string, choix?: [ChoixCommun[], ChoixCommun[]]): { issue: IssueCommune; un: IdJoueur } {
  const liste = choix ?? [sc.choix, sc.choix];
  const fam = (j: IdJoueur, id: string) => liste[j].find((x) => x.id === id)?.famille ?? 'agir';
  const trouver = (cle: string) => sc.issues.find((i) => i.cle === cle);
  const essais: [string, IdJoueur][] = [
    [`${c1}+${c2}`, 0],
    [`${c2}+${c1}`, 1],
    [`${c1}+*`, 0],
    [`${c2}+*`, 1],
    [`*+${c2}`, 0],
    [`*+${c1}`, 1],
    [`famille:${fam(0, c1)}+${fam(1, c2)}`, 0],
    [`famille:${fam(1, c2)}+${fam(0, c1)}`, 1],
  ];
  for (const [cle, un] of essais) {
    const i = trouver(cle);
    if (i) return { issue: i, un };
  }
  const generique = c1 === c2 ? 'accord' : COMPATIBLES.has(`${fam(0, c1)}+${fam(1, c2)}`) ? 'complement' : 'conflit';
  return { issue: trouver(generique) ?? trouver('defaut') ?? { cle: 'defaut', texte: '' }, un: 0 };
}

const texteDe = (c: Campagne, sc: SceneCommuneDef) => (typeof sc.texte === 'function' ? sc.texte(c) : sc.texte);

function resoudreCommune(c: Campagne): void {
  const etat = c.commune!;
  const sc = SCENES[etat.id];
  const [c1, c2] = etat.choix as [string, string];
  const listes: [ChoixCommun[], ChoixCommun[]] = [choixDe(c, sc, 0), choixDe(c, sc, 1)];
  const { issue, un } = issuePour(sc, c1, c2, listes);
  const deux = autre(un);
  appliquerIssue(c, issue, un, deux);
  const libelle = (j: IdJoueur, id: string) => texteCommun(c, listes[j].find((x) => x.id === id)?.texte ?? '', j, j);
  c.resultat = {
    id: sc.id,
    titre: texteCommun(c, sc.titre),
    texte: [texteCommun(c, texteDe(c, sc)), texteCommun(c, issue.texte, un)].map((t) => t.trim()).filter(Boolean).join('\n\n'),
    libelles: [libelle(0, c1), libelle(1, c2)],
    // Un mort (revenu ou non) ne lit pas : sa vie est finie.
    lu: [!present(c, 0) , !present(c, 1)],
  };
  if (issue.combat) c.combatEnAttente = issue.combat;
  c.commune = undefined;
  c.vues.push(sc.id);
  c.barrieres.shift();
}

/** Ce qu'une issue change : dans chaque vie (effets solo), dans le lien, les souvenirs, les promesses, la suite. */
function appliquerIssue(c: Campagne, issue: IssueCommune, un: IdJoueur, deux: IdJoueur, seul = false): void {
  for (const j of seul ? [un] : ([0, 1] as IdJoueur[])) {
    const e = [...(issue.effets?.les2 ?? []), ...((j === un ? issue.effets?.un : issue.effets?.deux) ?? [])];
    if (e.length && !finie(c.joueurs[j])) appliquerEffets(c.joueurs[j], e, nouveauCtx());
  }
  if (!seul) {
    bouger(c, 0, issue.lien?.les2);
    bouger(c, 1, issue.lien?.les2);
  }
  bouger(c, un, issue.lien?.un);
  if (!seul) bouger(c, deux, issue.lien?.deux);
  c.lien.accord = borne(c.lien.accord + (issue.accord ?? 0));
  const jour = jourMonde(c);
  if (issue.souvenir) c.lien.souvenirs.push({ ...issue.souvenir, texte: texteCommun(c, issue.souvenir.texte, un), jour, connuDe: seul ? [un] : [0, 1] });
  if (issue.promesse && !c.lien.promesses.some((p) => p.id === issue.promesse!.id)) c.lien.promesses.push({ ...issue.promesse, jour, etat: 'en_cours' });
  issue.apres?.(c, un);
}

/** La scène commune telle que la voit le joueur qui doit choisir : le récit, ce qu'il voit de plus, et ses choix. */
export function vueCommune(c: Campagne, j: IdJoueur): { titre: string; texte: string; choix: { id: string; texte: string }[]; autreAChoisi: boolean } | undefined {
  if (!c.commune || c.commune.choix[j] !== undefined) return undefined;
  const sc = SCENES[c.commune.id];
  const plus = sc.textePour?.(c, j);
  return {
    titre: texteCommun(c, sc.titre, j, j),
    texte: [texteCommun(c, texteDe(c, sc), j, j), plus ? texteCommun(c, plus, j, j) : ''].filter(Boolean).join('\n\n'),
    choix: choixDe(c, sc, j).map((x) => ({ id: x.id, texte: texteCommun(c, x.texte, j, j) })),
    autreAChoisi: c.commune.choix[autre(j)] !== undefined,
  };
}

// ── Les scènes privées ───────────────────────────────────────

export function vuePrivee(c: Campagne, j: IdJoueur): { titre: string; texte: string; choix: { id: string; texte: string }[] } | undefined {
  const id = priveeDue(c, j);
  if (!id) return undefined;
  const sc = SCENES[id];
  return { titre: texteCommun(c, sc.titre, j, j), texte: texteCommun(c, texteDe(c, sc), j, j), choix: choixDe(c, sc, j).map((x) => ({ id: x.id, texte: texteCommun(c, x.texte, j, j) })) };
}

function choisirPriveeMut(c: Campagne, j: IdJoueur, id: string, choixId: string): void {
  const sc = SCENES[id];
  if (!sc || !choixDe(c, sc, j).some((x) => x.id === choixId)) throw new Error('Choix inconnu.');
  const issue = sc.issues.find((i) => i.cle === choixId) ?? sc.issues.find((i) => i.cle === 'defaut') ?? { cle: 'defaut', texte: '' };
  appliquerIssue(c, issue, j, autre(j), true);
  c.resultatPrive[j] = { id, titre: texteCommun(c, sc.titre, j, j), texte: texteCommun(c, issue.texte, j, j), libelles: [texteCommun(c, choixDe(c, sc, j).find((x) => x.id === choixId)!.texte, j, j), ''], lu: [false, false] };
  c.vues.push(id);
  c.privees[j] = c.privees[j].filter((p) => p.id !== id);
}

// ── Ce que le moteur surveille ───────────────────────────────

/** Frères et sœurs : un deuil dans une vie est un deuil dans l'autre. */
function synchroniserFamille(c: Campagne): void {
  if (!memeFoyer(c)) return;
  for (const id of FAMILLE) {
    const [a, b] = c.joueurs.map((s) => s.pnj[id]);
    if (!a || !b) continue;
    for (const [mort, vivant, j] of [
      [a, b, 1],
      [b, a, 0],
    ] as const) {
      if ((mort.etat === 'mort' || mort.etat === 'disparu') && vivant.etat !== mort.etat) {
        vivant.etat = mort.etat;
        vivant.cause = mort.cause;
        const nom = defPnj(c.joueurs[j], id)?.nom ?? 'quelqu’un';
        ajouterJournal(c.joueurs[j], `${nom} est mort·e.`, 3);
        noter(c, j as IdJoueur, `${nom} est mort·e. La nouvelle t’arrive par une lettre, à l’écriture tremblée.`);
        planifierCommune(c, id === 'famille_parent' ? 'mc_deuil_parent' : 'mc_deuil_aine', 0);
      }
    }
  }
}

/** Une vie qui s'arrête : son joueur dira ce qu'il devient (héritier, spectateur, ou retour). */
function verifierMorts(c: Campagne): void {
  // Pas en plein combat : le combat se termine d'abord, le choix vient après.
  if (c.combat) return;
  for (const j of [0, 1] as IdJoueur[]) if (c.joueurs[j].statut === 'mort' && c.morts[j] === undefined && !finie(c.joueurs[autre(j)])) c.morts[j] = 'a_choisir';
}

/** Une trahison en cours peut fuiter : plus il y a de preuves, plus c'est probable (une chance par saison). */
function verifierFuite(c: Campagne): void {
  if (!['engage', 'double'].includes(c.fil.etape) || c.vues.includes('mc_revelation')) return;
  const saison = Math.floor(jourMonde(c) / 120);
  if (hash01(c, `fuite:${saison}`) < 0.05 * c.fil.preuves) planifierCommune(c, 'mc_revelation', 0);
}

/** Les seuils du lien : franchis, ils ouvrent une scène (une seule fois). */
function verifierSeuils(c: Campagne): void {
  if (c.joueurs.some((s) => ageA(s) < 12 || finie(s))) return;
  const [a, b] = c.lien.axes;
  if (a.jalousie >= 70 || b.jalousie >= 70) planifierCommune(c, 'mc_jalousie');
  if ((a.confiance < 20 && a.loyaute > 60) || (b.confiance < 20 && b.loyaute > 60)) planifierCommune(c, 'mc_croire');
  if ((a.rivalite >= 80 && a.respect >= 80) || (b.rivalite >= 80 && b.respect >= 80)) planifierCommune(c, 'mc_honneur');
}

// ── La mort d'un joueur ──────────────────────────────────────

function choisirMortMut(c: Campagne, j: IdJoueur, suite: SuiteMort): void {
  if (c.morts[j] !== 'a_choisir') throw new Error('Rien à choisir.');
  c.morts[j] = suite;
  const survivant = c.joueurs[autre(j)];
  if (suite === 'retour') planifierCommune(c, 'mc_retour', 4 * JOURS_AN);
  if (suite === 'spectateur') noter(c, autre(j), `${c.creations[j].prenom} n’est plus. Tu continues seul·e, et chaque scène porte son absence.`);
  if (suite !== 'heritier') return;
  // L'héritier : un enfant du même village et du même clan, qui entre en scène aujourd'hui, à six ans.
  const morte = c.creations[j];
  const genre = hash01(c, `heritier:g:${j}`) < 0.5 ? 'f' : 'm';
  const noms = R.contenu.noms[morte.village]?.[genre] ?? ['Kenji'];
  const creation: Creation = { ...morte, prenom: noms[Math.floor(hash01(c, `heritier:n:${j}`) * noms.length)], presentation: genre === 'f' ? 'feminin' : 'masculin', ageDepart: 6, heritage: undefined, nom: undefined };
  const heritier = nouvellePartie(creation, graineDe(c.graine, j, 7 + c.actions.length));
  decaler(heritier, survivant.jour - heritier.jour);
  c.joueurs[j] = heritier;
  c.creations[j] = heritier.creation;
  // Le lien recommence : l'héritier ne sait rien de ce que l'autre a vécu avec son prédécesseur.
  c.lien.axes[j] = { ...zero(), respect: 20, admiration: 15, mefiance: 10 };
  c.lien.axes[autre(j)] = { ...zero(), peur_de_perdre: 30, loyaute: 30, confiance: 15 };
  c.lien.accord = 10;
  c.lien.vus = [[], []];
  for (const sv of c.lien.souvenirs) sv.connuDe = sv.connuDe.filter((x) => x !== j);
  c.morts[j] = undefined;
  c.barrieres = c.barrieres.filter((b) => !SCENES[b.id]?.age);
  planifierAges(c);
  planifierCommune(c, 'mc_heritier', 0);
}

// ── Rejeu ────────────────────────────────────────────────────

/** Toute la campagne se rejoue depuis les deux fiches, le lien, la graine et le journal : même état, au jour près. */
export function rejouerCampagne(c1: Creation, c2: Creation, lien: Parameters<typeof nouvelleCampagne>[2], graine: number, actions: ActionCampagne[]): Campagne {
  const c = nouvelleCampagne(c1, c2, lien, graine);
  for (const x of actions) appliquerMut(c, x);
  return c;
}

/** Ce qui suffit à rejouer la campagne (pour une sauvegarde vérifiable). */
export function parametresLien(c: Campagne): Parameters<typeof nouvelleCampagne>[2] {
  return { type: c.lien.type, origine: c.lien.origine, passe: c.lien.passe, sauveur: c.lien.sauveur };
}

/** Les souvenirs que ce joueur connaît, du plus récent au plus ancien. */
export function souvenirsDe(c: Campagne, j: IdJoueur) {
  return c.lien.souvenirs.filter((s) => s.connuDe.includes(j)).slice().reverse();
}

/** Accorde un texte du point de vue d'un joueur (les formes « ·e » le désignent). */
export const accorderPour = (c: Campagne, j: IdJoueur, t: string) => accorder(t, c.creations[j].presentation);
