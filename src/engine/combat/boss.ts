// Les boss (§8) : des phases qui s'ouvrent quand leur condition est réunie (ses PV, la durée du combat), chacune
// une seule fois et dans l'ordre. Une phase change sa personnalité, ses forces, le terrain, et sa grande technique :
// celle-ci est télégraphiée une manche avant, et certaines actions la déjouent (les parades).
// Rien n'est systématique : un boss abattu vite n'aura vu aucune de ses phases.

import type { AdversaireDef, EtatAffrontement, PhaseBoss } from './types';

/** La phase en cours : la dernière ouverte. */
export function phaseCourante(sc: EtatAffrontement, d: AdversaireDef): PhaseBoss | undefined {
  const id = sc.phases?.[sc.phases.length - 1];
  return id ? d.phases?.find((p) => p.id === id) : undefined;
}

/** Sa grande technique du moment : celle de la phase, sinon la sienne. */
export function majeureDe(sc: EtatAffrontement, d: AdversaireDef): (NonNullable<AdversaireDef['majeure']> & { parades?: string[] }) | undefined {
  return phaseCourante(sc, d)?.majeure ?? d.majeure;
}

/** À l'ouverture d'une manche : la phase suivante s'ouvre-t-elle ? Rend ce qu'il faut raconter. */
export function entrerPhase(sc: EtatAffrontement, d: AdversaireDef): string | undefined {
  if (!d.phases?.length) return undefined;
  const vues = sc.phases ?? [];
  const pct = sc.adv.endurance / sc.adv.enduranceMax;
  // La phase la plus avancée dont la condition tient : un boss tombé d'un coup sous son dernier seuil y entre directement.
  const p = [...d.phases].reverse().find((x) => !vues.includes(x.id) && (x.quand.sousPct === undefined || pct < x.quand.sousPct / 100) && (x.quand.mancheMin === undefined || sc.manche >= x.quand.mancheMin));
  if (!p || sc.adv.endurance <= 0) return undefined;
  // On ne saute pas une phase : celles d'avant sont considérées comme passées.
  sc.phases = [...d.phases.slice(0, d.phases.indexOf(p)).map((x) => x.id).filter((x) => !vues.includes(x)), ...vues, p.id].filter((x, i, l) => l.indexOf(x) === i);
  if (p.soin) sc.adv.endurance = Math.min(sc.adv.enduranceMax, sc.adv.endurance + Math.round(sc.adv.enduranceMax * p.soin));
  if (p.terrain) sc.terrain = { ...(sc.terrain ?? {}), [p.terrain]: 99 };
  if (p.temperament) sc.temperament = p.temperament;
  return [p.texte, p.replique ? `« ${p.replique} »` : ''].filter(Boolean).join(' ');
}

/** Ses forces dans la phase : ce qui s'ajoute à son attaque et à sa défense. */
export function bonusPhase(sc: EtatAffrontement, d: AdversaireDef): { attaque: number; defense: number } {
  const b = phaseCourante(sc, d)?.bonus;
  return { attaque: b?.attaque ?? 0, defense: b?.defense ?? 0 };
}

/** L'action jouée pare-t-elle sa grande technique (qu'il lance cette manche) ? */
export function pareLaMajeure(sc: EtatAffrontement, d: AdversaireDef, a: { famille: string; choix: string }): boolean {
  if (sc.intention !== 'majeure') return false;
  const m = majeureDe(sc, d);
  return !!m?.parades?.some((x) => x === a.choix || x === a.famille);
}
