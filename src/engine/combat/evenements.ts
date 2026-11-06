// Les événements de combat (§5) : à l'ouverture d'une manche, parfois, quelque chose arrive. Il s'annonce avec la
// manche et ouvre la famille « Situation ». Y répondre, c'est jouer sa manche ; l'ignorer, c'est en subir la suite.
// Deux événements au plus par combat, jamais deux fois le même, jamais à la première manche, jamais en combat à deux.

import type { GameState } from '../types';
import { R } from '../registre';
import { clamp } from '../etat';
import { EVENEMENTS_COMBAT } from '../../content/combat/evenementsCombat';
import type { EffetSituation, EvenementCombatDef } from '../../content/combat/evenementsCombat';
import type { AdversaireDef, EtatAffrontement } from './types';
import { CONTEXTES, indexNiveau } from './contextes';
import { terrainCourant } from './impacts';
import { EFFETS_ETAT, poserEtat } from './etats';
import { bougerMoral } from './esprit';
import { ajouterRenfort } from './escouade';
import { HABITE, jaugesInitiales } from './jauges';

export const EVENEMENT = Object.fromEntries(EVENEMENTS_COMBAT.map((e) => [e.id, e])) as Record<string, EvenementCombatDef>;

/** Au plus trois événements par combat, et deux manches au moins entre deux (§5.2 : la plupart des manches, rien). */
const MAX_PAR_COMBAT = 3;
const RESPIRATION = 2;

function possible(s: GameState, sc: EtatAffrontement, d: AdversaireDef, e: EvenementCombatDef): boolean {
  const q = e.si;
  if (sc.evenementsVus?.includes(e.id)) return false;
  if (q.contextes && !q.contextes.includes(sc.contexte)) return false;
  if (q.terrains && !q.terrains.includes(terrainCourant(s))) return false;
  if (q.terrainEtat && !q.terrainEtat.some((t) => (sc.terrain?.[t] ?? 0) > 0)) return false;
  if (q.niveauJoueurMax && indexNiveau(sc.niveauJoueur) > indexNiveau(q.niveauJoueurMax)) return false;
  if (q.mancheMin && sc.manche < q.mancheMin) return false;
  if (q.joueurSousPct !== undefined && sc.joueur.endurance / sc.joueur.enduranceMax >= q.joueurSousPct / 100) return false;
  if (q.advSousPct !== undefined && sc.adv.endurance / sc.adv.enduranceMax >= q.advSousPct / 100) return false;
  if (q.pasBete && d.type === 'bete') return false;
  const j = sc.jauges ?? jaugesInitiales(s);
  if (q.jauges && Object.entries(q.jauges).some(([k, v]) => j[k as keyof typeof j] < (v ?? 0))) return false;
  if (q.chapitreMin && s.chapitre < q.chapitreMin) return false;
  if (q.niveauAdvMin && indexNiveau(sc.niveauAdv) < indexNiveau(q.niveauAdvMin)) return false;
  if (q.clan && s.creation.clan === 'sans_clan') return false;
  if (q.escouade && !sc.adv.membres) return false;
  if (q.habite && !HABITE.includes(terrainCourant(s))) return false;
  if (q.temperaments && !q.temperaments.includes(sc.temperament)) return false;
  // Une fin d'événement doit être permise par le contexte : pas de fuite là où on ne fuit pas.
  if (e.choix.every((c) => c.succes.fin === 'fuite') && !CONTEXTES[sc.contexte].fuite) return false;
  return true;
}

/** À l'ouverture d'une manche (un tirage, toujours consommé) : un événement survient-il ? Rend son texte. */
export function declencherEvenement(s: GameState, sc: EtatAffrontement, d: AdversaireDef, r: number): string | undefined {
  sc.evenement = undefined;
  if (sc.choixId === 'campagne' || sc.manche < 2 || (sc.evenementsVus?.length ?? 0) >= MAX_PAR_COMBAT) return undefined;
  if (sc.dernierEvenement !== undefined && sc.manche - sc.dernierEvenement < RESPIRATION) return undefined;
  // La pertinence : plus l'événement est logique ici et maintenant, plus il est probable (§5.2).
  const j = sc.jauges ?? jaugesInitiales(s);
  const x0 = { j, pctJ: sc.joueur.endurance / sc.joueur.enduranceMax, pctA: sc.adv.endurance / sc.adv.enduranceMax, manche: sc.manche };
  const liste = EVENEMENTS_COMBAT.filter((e) => possible(s, sc, d, e))
    .map((e) => [e, Math.max(0, Math.min(1, e.pertinence ? e.pertinence(x0) : 0.5)) * e.poids / 5] as const)
    .filter(([, p]) => p > 0.15);
  if (!liste.length) return undefined;
  const total = liste.reduce((a, [, p]) => a + p, 0);
  const chance = Math.min(0.45, total * 0.25);
  if (r >= chance) return undefined;
  let x = (r / chance) * total;
  const e = (liste.find(([, p]) => (x -= p) < 0) ?? liste[liste.length - 1])[0];
  sc.evenement = { id: e.id, manche: sc.manche };
  sc.evenementsVus = [...(sc.evenementsVus ?? []), e.id];
  sc.dernierEvenement = sc.manche;
  return e.texte;
}

/** Les réponses possibles à l'événement en cours (famille « Situation »). */
export function actionsSituation(s: GameState, sc: EtatAffrontement): { id: string; nom: string; detail: string }[] {
  const e = sc.evenement && EVENEMENT[sc.evenement.id];
  if (!e) return [];
  return e.choix.filter((c) => c.succes.fin !== 'fuite' || CONTEXTES[sc.contexte].fuite).map((c) => ({ id: c.id, nom: c.nom, detail: c.detail }));
}

export interface ResultatSituation {
  texte: string;
  subi: number;
  inflige: number;
  protege: boolean;
  fin?: EffetSituation['fin'];
  reussi: boolean;
}

/** Applique un effet d'événement : PV, états, terrain, allié, renforts, moral, réputation. */
function appliquer(s: GameState, sc: EtatAffrontement, e: EffetSituation, reussi: boolean): ResultatSituation {
  const textes = [e.texte];
  const subi = e.subi ? Math.round(sc.joueur.enduranceMax * e.subi) : 0;
  const inflige = e.inflige ? Math.round(sc.adv.enduranceMax * e.inflige) : 0;
  if (e.etatJoueur && poserEtat(sc.joueur, e.etatJoueur[0], e.etatJoueur[1])) textes.push(EFFETS_ETAT[e.etatJoueur[0]].apparait.joueur);
  if (e.etatAdv && poserEtat(sc.adv, e.etatAdv[0], e.etatAdv[1])) textes.push(EFFETS_ETAT[e.etatAdv[0]].apparait.adv);
  if (e.ouverture) sc.ouverture += e.ouverture;
  if (e.terrain) sc.terrain = { ...(sc.terrain ?? {}), [e.terrain]: Math.max(sc.terrain?.[e.terrain] ?? 0, 3) };
  if (e.allie) sc.allie = { ...e.allie, degats: Math.max(1, Math.round(sc.adv.enduranceMax * e.allie.degats)) };
  if (e.renfortAdv) {
    const ajout = Math.round(sc.adv.enduranceMax * e.renfortAdv);
    sc.adv.enduranceMax += ajout;
    // Une escouade : le renfort la rejoint comme un membre de plus ; sinon, il rend des forces.
    if (sc.adv.membres) ajouterRenfort(sc, ajout);
    else sc.adv.endurance += ajout;
  }
  if (e.moral) bougerMoral(sc, e.moral);
  if (e.reputation) s.social.reputation = clamp(s.social.reputation + e.reputation, 0, 100);
  if (e.faiblesse) sc.lecture.faiblesse = true;
  if (e.jauges) {
    const j = (sc.jauges ??= jaugesInitiales(s));
    for (const [k, v] of Object.entries(e.jauges)) j[k as keyof typeof j] = clamp(j[k as keyof typeof j] + (v ?? 0), 0, 100);
  }
  return { texte: textes.join(' '), subi, inflige, protege: !!e.protege, fin: e.fin, reussi };
}

/** Le joueur répond à l'événement. Le tirage décide des gestes qui peuvent rater. */
export function resoudreSituation(s: GameState, sc: EtatAffrontement, choixId: string, r: number): ResultatSituation {
  const e = EVENEMENT[sc.evenement!.id];
  const c = e.choix.find((x) => x.id === choixId)!;
  const ok = !c.test || r < clamp(c.test.base + (s.attributs[c.test.attribut] - 50) / 150, 0.05, 0.95);
  return appliquer(s, sc, ok || !c.echec ? c.succes : c.echec, ok);
}

/** Le joueur a joué autre chose : l'événement suit son cours. */
export function ignorerSituation(s: GameState, sc: EtatAffrontement): ResultatSituation | undefined {
  const e = sc.evenement && EVENEMENT[sc.evenement.id];
  if (!e) return undefined;
  // Un événement qui arrête le combat ne l'arrête pas si le contexte l'interdit (une fuite en entraînement).
  const r = appliquer(s, sc, e.ignore, false);
  if (r.fin === 'fuite' && !CONTEXTES[sc.contexte].fuite) r.fin = undefined;
  return r;
}

export const nomEvenement = (id: string) => R.contenu && EVENEMENT[id]?.id;
