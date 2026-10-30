// Le terrain du combat et les enchaînements de natures : ce qu'une technique laisse derrière elle, et ce que la suivante en fait.
// Aucun tirage : tout se déduit de l'état du combat (natures lancées, terrain, maîtrises, ce que l'adversaire a déjà lu).

import type { ElementId, GameState } from '../types';
import { R } from '../registre';
import type { EtatAffrontement } from './types';
import { ETATS_TERRAIN, RECITS_DE_LIEU, SYNERGIES, SYNERGIES_DE_LIEU, TERRAIN_INITIAL, TRACE_NATURE } from '../../content/combat/synergies';
import type { EffetSynergie, EtatTerrain, NiveauSynergie, SynergieDef } from '../../content/combat/synergies';
import { terrainCourant } from './impacts';

const NIVEAUX: NiveauSynergie[] = ['leger', 'fort', 'exceptionnel'];
export const LIBELLE_SYNERGIE: Record<NiveauSynergie, string> = { leger: 'légère', fort: 'forte', exceptionnel: 'exceptionnelle', compromis: 'compromis' };

/** Les états imposés par le lieu au premier échange (la côte est humide, la carrière hérissée de roches). */
export function terrainInitial(s: GameState): Partial<Record<EtatTerrain, number>> {
  const etat = TERRAIN_INITIAL[terrainCourant(s)];
  // Un état venu du lieu ne s'épuise pas : il est là tout le combat.
  return etat ? { [etat]: 99 } : {};
}

/** La nature d'une action : celle de sa technique (une combinaison n'en porte pas une seule). */
export function natureAction(id: string): ElementId | undefined {
  const def = R.maitrises[id];
  if (!def?.technique) return undefined;
  if (def.element && TRACE_NATURE[def.element]) return def.element;
  return undefined;
}

export interface Synergie {
  cle: string;
  def: SynergieDef;
  niveau: NiveauSynergie;
  puissance: number;
  precision: number;
  effet?: EffetSynergie;
  /** Préparée par le seul terrain (aucune technique d'avant). */
  parTerrain: boolean;
  /** L'adversaire a déjà vu cet enchaînement : il l'attend. */
  lue: boolean;
  /** Ce que le lieu y change, s'il y change quelque chose. */
  lieu?: string;
}

const present = (sc: EtatAffrontement, e: EtatTerrain) => (sc.terrain?.[e] ?? 0) > 0;

/**
 * L'enchaînement que ferait cette nature, maintenant : la nature d'avant (une action d'écart au plus) ou le terrain
 * la prépare. Ne modifie rien : sert à la résolution comme aux marques de l'interface.
 */
export function synergiePour(s: GameState, sc: EtatAffrontement, nature: ElementId | undefined): Synergie | undefined {
  if (!nature) return undefined;
  const sceaux = sc.sceaux ?? [];
  const derniers = sceaux.slice(-2).reverse();
  const idx = derniers.findIndex((x) => !!x);
  const avant = idx >= 0 ? derniers[idx]! : undefined;
  const retard = idx === 1;
  let cle = avant && avant !== nature ? `${avant}>${nature}` : undefined;
  let parTerrain = false;
  // Sans technique d'avant, le terrain lui-même peut préparer : l'eau de la côte sert la foudre.
  if (!cle || !SYNERGIES[cle]) {
    cle = Object.keys(SYNERGIES).find((k) => k.endsWith(`>${nature}`) && SYNERGIES[k].exige && SYNERGIES[k].niveau !== 'compromis' && present(sc, SYNERGIES[k].exige!));
    parTerrain = true;
  }
  if (!cle) return undefined;
  const def = SYNERGIES[cle];
  const terrain = terrainCourant(s);
  if (def.niveau === 'compromis') {
    if (def.exige && !present(sc, def.exige)) return undefined;
    return { cle, def, niveau: 'compromis', puissance: def.puissance, precision: def.precision, effet: def.effet, parTerrain: false, lue: false };
  }
  let n = NIVEAUX.indexOf(def.niveau);
  if (def.exige && !present(sc, def.exige)) n -= 1;
  if (parTerrain) n -= 1;
  const lieu = SYNERGIES_DE_LIEU[terrain]?.find((x) => x.cle === cle);
  if (lieu) n += lieu.delta;
  // Trois natures qui s'enchaînent sans rupture, par quelqu'un qui maîtrise les deux : l'enchaînement devient exceptionnel.
  const [a, b] = cle.split('>');
  const tierMin = Math.min(s.maitrises[`nature_${a}`]?.tier ?? 0, s.maitrises[`nature_${b}`]?.tier ?? 0);
  if (sc.derniereSynergie && !parTerrain && tierMin >= 3) n += 1;
  if (n < 0) return undefined;
  n = Math.min(2, n);
  const niveau = NIVEAUX[n];
  // Ce que l'adversaire a déjà vu de cette chaîne, dans ce combat ou lors d'un combat passé.
  const vues = (sc.chainesVues?.[cle] ?? 0) + (s.registresCombat[sc.registreId]?.contreMesures.includes(`chaine:${cle}`) ? 2 : 0);
  const lecture = vues >= 2 ? 0.5 : vues === 1 ? 0.75 : 1;
  const maitrise = Math.min(1.1, Math.max(0.6, 0.6 + 0.1 * tierMin));
  const echelle = [0.65, 1, 1.35][n] * (retard ? 0.7 : 1);
  return {
    cle,
    def,
    niveau,
    puissance: Math.min(24, Math.round(def.puissance * echelle * maitrise * lecture) + (n === 2 ? 4 : 0)),
    precision: vues >= 2 ? 0 : Math.min(0.3, def.precision * echelle),
    effet: def.effet,
    parTerrain,
    lue: vues >= 2,
    lieu: lieu?.delta === 1 ? RECITS_DE_LIEU[terrain] : lieu?.raison,
  };
}

/** Une technique est partie : elle laisse sa trace, et l'enchaînement change le terrain à sa façon. */
export function marquerTerrain(sc: EtatAffrontement, nature: ElementId | undefined, syn: Synergie | undefined, trace?: { etat: EtatTerrain; manches: number }): void {
  const t = (sc.terrain ??= {});
  for (const e of syn?.def.efface ?? []) if ((t[e] ?? 0) < 99) delete t[e];
  const poser = (x?: { etat: EtatTerrain; manches: number }) => {
    if (x) t[x.etat] = Math.max(t[x.etat] ?? 0, x.manches);
  };
  poser(trace ?? (nature ? TRACE_NATURE[nature] : undefined));
  poser(syn?.def.laisse);
  // Le feu sur l'eau, ou l'eau sur le feu : tout part en vapeur.
  if (nature === 'katon' && (t.humide ?? 0) > 0 && (t.humide ?? 0) < 99) {
    delete t.humide;
    t.vapeur = Math.max(t.vapeur ?? 0, 2);
  }
  // La terre retournée sous l'eau devient de la boue.
  if (nature === 'doton' && (t.humide ?? 0) > 0) t.boue = Math.max(t.boue ?? 0, 2);
}

/** À la fin de chaque manche, ce que les techniques ont laissé s'estompe. */
export function vieillirTerrain(sc: EtatAffrontement): void {
  const t = sc.terrain;
  if (!t) return;
  for (const k of Object.keys(t) as EtatTerrain[]) {
    if ((t[k] ?? 0) >= 99) continue;
    t[k] = (t[k] ?? 0) - 1;
    if ((t[k] ?? 0) <= 0) delete t[k];
  }
}

/** Le terrain lisible : ses états et ce qu'il en reste. */
export function vueTerrain(sc: EtatAffrontement): { id: EtatTerrain; nom: string; kanji: string; detail: string; manches?: number }[] {
  return (Object.entries(sc.terrain ?? {}) as [EtatTerrain, number][])
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, ...ETATS_TERRAIN[id], manches: n >= 99 ? undefined : n }));
}

/** Les enchaînements qui s'offrent maintenant, pour chaque nature que le joueur peut lancer. */
export function enchainementsPossibles(s: GameState, sc: EtatAffrontement, natures: ElementId[]): { de: string; vers: ElementId; nom: string; niveau: string; resume: string; lue: boolean; parTerrain: boolean }[] {
  const res = [];
  for (const n of [...new Set(natures)]) {
    const syn = synergiePour(s, sc, n);
    if (!syn) continue;
    const [de] = syn.cle.split('>');
    res.push({ de: syn.parTerrain ? 'terrain' : de, vers: n, nom: syn.def.nom, niveau: LIBELLE_SYNERGIE[syn.niveau], resume: syn.def.resume, lue: syn.lue, parTerrain: syn.parTerrain });
  }
  return res;
}
