// Ce qu'un joueur a le droit de voir de la campagne : sa propre vie, la carte publique de l'autre, ce qu'il sait,
// ce qu'il ressent, et le journal public plus ses propres actions. Le serveur n'envoie que ceci à chaque appareil.
// Jamais : ce que l'autre ressent, ses scènes privées, les faits qu'il est seul à connaître, son choix de combat
// avant la résolution, l'état du fil de trahison (sauf pour le traître lui-même).

import type { GameState } from '../types';
import { R } from '../registre';
import type { ActionCampagne, Campagne, IdJoueur } from './types';
import { ageA, autre } from './outils';
import { SCENES, enAttente, priveeDue, vueCommune, vuePrivee } from './moteur';
import { vueCombatDuo } from './combat';
import { renommee, titres, voixDuMonde, type Titre } from './monde';
import { PROFIL } from '../../content/campagne/akatsuki';

export interface CartePublique {
  prenom: string;
  presentation: GameState['creation']['presentation'];
  village: string;
  clan: string;
  age: number;
  rang: GameState['rang'];
  statut: GameState['statut'];
  chapitre: number;
  /** Ce qui se voit : en forme, blessé, gravement blessé. */
  etat: 'en_forme' | 'blesse' | 'grave';
}

export interface ProjectionCampagne {
  moi: IdJoueur;
  /** Ma vie, entière. */
  vie: GameState;
  /** L'autre, tel que tout le monde peut le voir. */
  autre: CartePublique;
  lien: {
    type: Campagne['lien']['type'];
    /** Ce que je ressens, moi. */
    ressenti: Campagne['lien']['axes'][0];
    accord: number;
    souvenirs: Campagne['lien']['souvenirs'];
    promesses: Campagne['lien']['promesses'];
    duels: Campagne['lien']['duels'];
    techniquesDuo: Campagne['lien']['techniquesDuo'];
  };
  /** Ce que je sais (les faits dont je suis un connaisseur). */
  faits: { id: string; texte: string }[];
  commune?: ReturnType<typeof vueCommune> & { id: string };
  /** L'autre a choisi, sans dire quoi. */
  autreAChoisi: boolean;
  resultat?: Campagne['resultat'];
  privee?: ReturnType<typeof vuePrivee>;
  resultatPrive?: Campagne['resultatPrive'][0];
  notes: string[];
  proposition?: Campagne['proposition'];
  combat?: { mode: 'equipe' | 'duel'; autreAChoisi: boolean; autreATerre: boolean; signeRecu?: string };
  morts: Campagne['morts'];
  /** Les scènes communes déjà jouées (jamais les scènes privées). */
  scenesPassees: string[];
  attente?: string;
  /** Mon fil, si c'est moi qui trahis. */
  monFil?: Campagne['fil'];
  /** Le journal : les actions publiques, et les miennes. */
  journal: ActionCampagne[];
  /** Ce que le monde dit du binôme : titres, renommée, rumeurs, chronique ; et ce que je sais de l'Akatsuki. */
  monde: {
    titres: Titre[];
    renommee: Record<string, number>;
    voix: string[];
    chronique: Campagne['chronique'];
    akatsuki: {
      /** Les binômes, si je les connais. */
      binomes?: string[];
      detruite: boolean;
      /** Ma place dans l'Aube, si j'en ai une (personne d'autre ne la voit). */
      moi?: 'recrue' | 'infiltre' | 'chef';
      couverture?: number;
    };
  };
  fin?: Campagne['fin'];
}

function carte(s: GameState): CartePublique {
  return {
    prenom: s.creation.prenom,
    presentation: s.creation.presentation,
    village: R.villages[s.creation.village]?.nom ?? s.creation.village,
    clan: R.clans[s.creation.clan]?.nom ?? s.creation.clan,
    age: ageA(s),
    rang: s.rang,
    statut: s.statut,
    chapitre: s.chapitre,
    etat: s.blessures.some((b) => b.gravite >= 3) ? 'grave' : s.blessures.length ? 'blesse' : 'en_forme',
  };
}

export function projeter(c: Campagne, j: IdJoueur): ProjectionCampagne {
  const o = autre(j);
  const v = c.commune ? vueCommune(c, j) : undefined;
  const cb = c.combat ? vueCombatDuo(c, j) : undefined;
  return {
    moi: j,
    vie: c.joueurs[j],
    autre: carte(c.joueurs[o]),
    lien: {
      type: c.lien.type,
      ressenti: c.lien.axes[j],
      accord: c.lien.accord,
      souvenirs: c.lien.souvenirs.filter((s) => s.connuDe.includes(j)),
      promesses: c.lien.promesses,
      duels: c.lien.duels,
      techniquesDuo: c.lien.techniquesDuo,
    },
    faits: c.faits.filter((f) => f.connus.includes(j)).map((f) => ({ id: f.id, texte: f.cible === j && f.texteCible ? f.texteCible : f.texte })),
    commune: v && c.commune ? { ...v, id: c.commune.id } : undefined,
    autreAChoisi: !!c.commune && c.commune.choix[o] !== undefined,
    resultat: c.resultat,
    privee: priveeDue(c, j) ? vuePrivee(c, j) : undefined,
    resultatPrive: c.resultatPrive[j],
    notes: c.notes[j],
    proposition: c.proposition,
    combat: c.combat && cb ? { mode: c.combat.mode, autreAChoisi: !!c.combat.choix[o], autreATerre: c.combat.aTerre[o], signeRecu: cb.signeAutre } : undefined,
    morts: c.morts,
    scenesPassees: c.vues.filter((id) => !SCENES[id]?.privee),
    attente: enAttente(c, j),
    monFil: c.fil.joueur === j ? c.fil : undefined,
    journal: c.actions.filter((x) => x.vis === 'publique' || x.vis === j),
    monde: {
      titres: titres(c),
      // La renommée auprès de l'Akatsuki trahirait une recrue : seule la recrue la voit.
      renommee: Object.fromEntries(Object.entries(renommee(c)).filter(([k]) => k !== 'akatsuki' || c.akatsuki.recrues.includes(j))),
      voix: voixDuMonde(c, j),
      chronique: c.chronique,
      akatsuki: {
        binomes: c.faits.some((f) => f.id === 'akatsuki_connue' && f.connus.includes(j)) ? c.akatsuki.binomes.map((b) => `${PROFIL[b[0]].nom} et ${PROFIL[b[1]].nom}`) : undefined,
        detruite: c.akatsuki.detruite,
        moi: c.akatsuki.chef === j ? 'chef' : c.akatsuki.infiltre === j ? 'infiltre' : c.akatsuki.recrues.includes(j) ? 'recrue' : undefined,
        couverture: c.akatsuki.infiltre === j ? c.akatsuki.couverture : undefined,
      },
    },
    fin: c.fin,
  };
}
