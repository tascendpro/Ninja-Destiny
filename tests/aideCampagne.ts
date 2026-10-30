import { activite, chapitreSuivant, chapitreSuivantDisponible, choisir, choixVisibles, combattre, continuer, manche, vueCombat } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { genererActivites } from '../src/engine/tempsLibre';
import { R } from '../src/engine/registre';
import { actionsLien, agir, agirLien, choisirCombat, choisirCommune, choisirMort, choisirPrivee, joueurActif, lireNotes, lireResultat, vueCommune, vuePrivee } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur, TypeLien } from '../src/engine/campagne/types';
import { nouvelleCampagne } from '../src/engine/campagne/moteur';
import { creation } from './aide';
import type { ActionCombat } from '../src/engine/combat/types';
import type { GameState } from '../src/engine/types';
import { suivant } from '../src/engine/rng';

/** Un pas de jeu au hasard pour une vie solo : la même logique que le robot des tests solo, en plus court. */
export function pas(s: GameState, pick: (n: number) => number): GameState {
  if (s.scene.type === 'evenement') {
    const tous = choixVisibles(s, R.evenements[s.scene.id]).filter((x) => x.disponible);
    // Les robots ne renoncent pas à la voie ninja : les tests ont besoin de vies qui durent.
    const ev = R.evenements[s.scene.id];
    const civil = (id: string) => JSON.stringify(ev.choix.find((x) => x.id === id)?.effets ?? []).includes('"vie_civile"');
    // Seulement pendant l'enfance : un élève refoulé doit pouvoir finir par choisir une autre vie.
    const enfant = s.jour - s.naissance < 14 * 360;
    const restent = tous.filter((x) => !enfant || !civil(x.id));
    const dispo = restent.length ? restent : tous;
    return choisir(s, dispo[pick(dispo.length)].id);
  }
  if (s.scene.type === 'combat') {
    const v = vueCombat(s)!;
    const ids = v.adversaire ? ['esquiver', 'contrer'] : ['simple'];
    return manche(s, ids[pick(ids.length)]);
  }
  if (s.scene.type === 'affrontement') return combattre(s, actionAuHasard(s, pick));
  if (s.scene.type === 'resultat' || s.scene.type === 'bilan') return continuer(s);
  if (s.scene.type === 'fin') return chapitreSuivant(s);
  const acts = genererActivites(s).filter((a) => a.disponible && a.categorie !== 'equipement' && a.categorie !== 'forge' && !a.id.startsWith('duo:'));
  return activite(s, acts[pick(acts.length)].id);
}

/** Une action de combat possible, au hasard (rarement la fuite). */
export function actionAuHasard(s: GameState, pick: (n: number) => number): ActionCombat {
  const v = vueAffrontement(s)!;
  const possibles = v.familles.flatMap((f) => f.actions.filter((a) => a.disponible && f.id !== 'fuite').map((a) => ({ famille: f.id, choix: a.id })));
  return possibles[pick(possibles.length)];
}

export function hasard(graine: number) {
  let r = graine;
  return (n: number) => {
    const x = suivant(r);
    r = x.etat;
    return Math.floor(x.valeur * n);
  };
}

/** Les profils de robots : chacun tranche les choix à sa façon. */
export type Profil = 'hasard' | 'loyal' | 'traitre' | 'prudent' | 'agressif';

/** Le choix d'un robot dans une liste de choix (scènes communes et privées). */
function choisirSelon(profil: Profil, choix: { id: string; texte: string }[], pick: (n: number) => number): string {
  const cherche = (mots: RegExp) => choix.find((x) => mots.test(`${x.id} ${x.texte}`));
  const prefere =
    profil === 'traitre'
      ? cherche(/accepter|livrer|mentir|rallier|denoncer|attaquer|frapper|combattre|prendre/i)
      : profil === 'loyal'
        ? cherche(/prevenir|refuser|avouer|pardonner|proteger|couvrir|garder|jurer|epargner|main|trahir/i)
        : profil === 'prudent'
          ? cherche(/observer|attendre|garder|ecouter|regarder|silence|contourner|obeir/i)
          : profil === 'agressif'
            ? cherche(/combattre|attaquer|tenir|poursuivre|suivre|tout|defier|duel|frapper/i)
            : undefined;
  return (prefere ?? choix[pick(choix.length)]).id;
}

/** Joue la campagne au hasard (ou selon un profil) : chacun son tour, scènes communes et privées, combats, morts comprises. */
export function jouer(c: Campagne, graine: number, jusqua: (c: Campagne) => boolean, max = 4000, profils: [Profil, Profil] = ['hasard', 'hasard'], apres?: (c: Campagne) => void): Campagne {
  const pick = hasard(graine);
  for (let i = 0; i < max && !jusqua(c); i++) {
    const j = joueurActif(c);
    if (j === null) break;
    const profil = profils[j];
    if (c.morts[j] === 'a_choisir') c = choisirMort(c, j, (['heritier', 'spectateur', 'retour'] as const)[pick(3)]);
    else if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
    else if (c.combat) {
      const s = c.joueurs[j];
      const v = vueAffrontement(s)!;
      const def = v.familles.find((f) => f.id === 'defense')?.actions.find((a) => a.disponible);
      c = choisirCombat(c, j, profil === 'prudent' && def && pick(2) === 0 ? { famille: 'defense', choix: def.id } : actionAuHasard(s, pick), pick(4) === 0 ? 'couvre' : undefined);
    } else if (c.commune) c = choisirCommune(c, j, choisirSelon(profil, vueCommune(c, j)!.choix, pick));
    else if (c.resultatPrive[j]) c = lireResultat(c, j);
    else if (vuePrivee(c, j)) c = choisirPrivee(c, j, choisirSelon(profil, vuePrivee(c, j)!.choix, pick));
    else if (c.notes[j].length && pick(3) === 0) c = lireNotes(c, j);
    else {
      const a = actionsLien(c, j);
      // Les robots agissent aussi envers l'autre : les traîtres dans l'ombre, les loyaux ensemble.
      if (a.proposition && pick(2) === 0) c = agirLien(c, j, { t: 'repondre', accepte: profil !== 'traitre' || pick(2) === 0 });
      else if (profil === 'traitre' && a.denoncer && pick(40) === 0) c = agirLien(c, j, { t: 'denoncer', motif: 'une rencontre suspecte', faux: pick(2) === 0 });
      else if (profil === 'traitre' && a.nuire && a.cibles.length && pick(120) === 0) c = agirLien(c, j, { t: 'nuire', cible: a.cibles[pick(a.cibles.length)] });
      else if (a.enqueter && pick(80) === 0) c = agirLien(c, j, { t: 'enqueter' });
      else if (a.duel && pick(60) === 0) c = agirLien(c, j, { t: 'proposer', type: 'duel' });
      else if (a.technique && pick(60) === 0) c = agirLien(c, j, { t: 'proposer', type: 'technique', nom: a.nomsDuo[0] });
      else {
        const s = c.joueurs[j];
        if (s.scene.type === 'fin' && s.fin && !chapitreSuivantDisponible(s)) break;
        c = agir(c, j, (x) => pas(x, pick));
      }
    }
    apres?.(c);
  }
  return c;
}

export const IDS: IdJoueur[] = [0, 1];

const LIENS: TypeLien[] = ['freres', 'amis', 'rivaux', 'inconnus', 'clan', 'villages_differents', 'improbable'];

export function campagneDe(g: number): Campagne {
  const type = LIENS[g % LIENS.length];
  const deuxVillages = type === 'villages_differents';
  const clan = type === 'freres' || type === 'clan' ? 'uchiha' : 'sans_clan';
  return nouvelleCampagne(
    creation({ prenom: 'Aya', presentation: (['feminin', 'masculin', 'neutre'] as const)[g % 3], village: 'konoha', clan, element: 'suiton' }),
    creation({ prenom: 'Ren', presentation: (['masculin', 'feminin', 'neutre'] as const)[g % 3], village: deuxVillages ? 'kumo' : 'konoha', clan, element: 'raiton', ageDepart: g % 4 === 0 ? 10 : 6 }),
    { type, passe: (['rencontre', 'promesse', 'dette', 'competition', 'secret', 'perte', 'mefiance'] as const)[g % 7], sauveur: (g % 2) as IdJoueur },
    1000 + g,
  );
}

