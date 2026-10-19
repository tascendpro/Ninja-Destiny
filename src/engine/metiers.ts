// Métiers et spécialisations — section 9.

import type { GameState } from './types';
import { R } from './registre';
import { age } from './calendrier';
import { Ctx, ajouterJournal, estProdige, rangIndex } from './etat';
import { evaluer } from './conditions';

export function checkCareerEligibility(s: GameState, id: string): { ok: boolean; raisons: string[] } {
  const def = R.metiers[id];
  const raisons: string[] = [];
  if (!def) return { ok: false, raisons: ['Métier inconnu'] };
  const ageMin = estProdige(s) && def.ageMinProdige !== undefined ? def.ageMinProdige : def.ageMin;
  if (age(s) < ageMin) raisons.push(`Âge minimum : ${ageMin} ans`);
  if (def.rangMin && rangIndex(s.rang) < rangIndex(def.rangMin)) raisons.push(`Rang minimum : ${def.rangMin}`);
  if (def.horsVillage) {
    if (!['deserteur', 'exile'].includes(s.statut)) raisons.push('Réservé aux ninjas sans village');
  } else if (s.statut !== 'actif') {
    raisons.push('Exige d’appartenir à un village');
  }
  const actuels = [s.metier.principal, s.metier.secondaire].filter(Boolean) as string[];
  if (actuels.includes(id)) raisons.push('Déjà exercé');
  for (const a of actuels) {
    if (def.incompatibleAvec.includes(a) || R.metiers[a]?.incompatibleAvec.includes(id)) {
      raisons.push(`Incompatible avec ${R.metiers[a]?.nom ?? a}`);
    }
  }
  if (!evaluer(def.acces, s)) raisons.push('Conditions d’accès non remplies');
  return { ok: raisons.length === 0, raisons };
}

export function changeCareer(s: GameState, id: string, secondaire: boolean, ctx: Ctx): boolean {
  const def = R.metiers[id];
  const elig = checkCareerEligibility(s, id);
  if (!def || !elig.ok) {
    ctx.changements.push({ t: 'info', message: `Impossible de rejoindre ce métier : ${elig.raisons.join(', ')}.` });
    return false;
  }
  if (secondaire) {
    if (!s.metier.principal) {
      ctx.changements.push({ t: 'info', message: 'Un métier secondaire exige d’abord un métier principal.' });
      return false;
    }
    s.metier.secondaire = id;
  } else {
    if (s.metier.principal) {
      const h = s.metier.historique.find((x) => x.id === s.metier.principal && x.fin === undefined);
      if (h) h.fin = s.jour;
      ajouterJournal(s, `Reconversion : tu quittes ${R.metiers[s.metier.principal]?.nom}.`, 2);
    }
    s.metier.principal = id;
    s.metier.palier = 0;
  }
  s.metier.historique.push({ id, debut: s.jour });
  ctx.changements.push({ t: 'metier', metier: id, message: `Métier : ${def.nom}${secondaire ? ' (secondaire)' : ''}.` });
  ajouterJournal(s, `Tu deviens ${def.nom.toLowerCase()}.`, 3);
  if (!s.decouvertes.includes(`metier:${id}`)) s.decouvertes.push(`metier:${id}`);
  return true;
}

export function quitterMetier(s: GameState, lequel: 'principal' | 'secondaire', ctx: Ctx): void {
  const id = s.metier[lequel];
  if (!id) return;
  const h = s.metier.historique.find((x) => x.id === id && x.fin === undefined);
  if (h) h.fin = s.jour;
  s.metier[lequel] = undefined;
  if (lequel === 'principal') {
    s.metier.palier = 0;
    if (s.metier.secondaire) {
      s.metier.principal = s.metier.secondaire;
      s.metier.secondaire = undefined;
    }
  }
  ctx.changements.push({ t: 'metier', metier: id, message: `Tu quittes ${R.metiers[id]?.nom ?? id}.` });
}

/** Canal de réputation du métier principal : les métiers de l'ombre n'alimentent pas la réputation publique. */
export function canalReputation(s: GameState): 'public' | 'secret' {
  return s.metier.principal ? (R.metiers[s.metier.principal]?.canal ?? 'public') : 'public';
}

export function nomPalierMetier(s: GameState): string | undefined {
  const def = s.metier.principal ? R.metiers[s.metier.principal] : undefined;
  return def?.paliers[Math.min(s.metier.palier, def.paliers.length - 1)];
}
