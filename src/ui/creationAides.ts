// Les raccourcis de la création : des voies déjà tracées, un tirage au hasard, et le dernier ninja créé.
// Tout reste modifiable ensuite : ces aides remplissent la fiche, elles ne la valident pas à ta place.

import type { AttributId, Creation, ElementId, Presentation, VillageId } from '../engine/types';
import { R } from '../engine/registre';
import { APTITUDES, validerCreation } from '../engine/moteur';

export interface Voie {
  id: string;
  nom: string;
  kanji: string;
  accroche: string;
  village: VillageId;
  clan: string;
  origine?: 'famille' | 'orphelin';
  element: ElementId;
  traits: [string, string];
  objectif: string;
}

export const VOIES: Voie[] = [
  { id: 'feu', nom: 'L’héritier du feu', kanji: '炎', accroche: 'Un nom illustre, des yeux qui s’éveilleront peut-être, et tout un clan qui te regarde.', village: 'konoha', clan: 'uchiha', element: 'katon', traits: ['fier', 'determine'], objectif: 'honorer_nom' },
  { id: 'personne', nom: 'L’enfant de personne', kanji: '孤', accroche: 'Pas de nom, pas de parents, un orphelinat. Tout ce que tu auras, tu l’auras pris.', village: 'konoha', clan: 'sans_clan', origine: 'orphelin', element: 'fuuton', traits: ['joyeux', 'determine'], objectif: 'proteger' },
  { id: 'stratege', nom: 'Le stratège', kanji: '策', accroche: 'Une ombre qui pense dix coups d’avance, et la paresse comme couverture.', village: 'konoha', clan: 'nara', element: 'doton', traits: ['curieux', 'calme'], objectif: 'devenir_kage' },
  { id: 'brume', nom: 'L’ombre de la brume', kanji: '霧', accroche: 'Un sang que Kiri chasse, et la glace pour seule maison.', village: 'kiri', clan: 'yuki', element: 'suiton', traits: ['discret', 'calme'], objectif: 'liberte' },
  { id: 'desert', nom: 'La lame du désert', kanji: '砂', accroche: 'Le vent blanc de Suna, et une méfiance qui t’a déjà sauvé la vie.', village: 'suna', clan: 'shirakaze', element: 'fuuton', traits: ['mefiant', 'discret'], objectif: 'verite' },
  { id: 'tonnerre', nom: 'Le tonnerre de Kumo', kanji: '雷', accroche: 'Frapper d’abord, réfléchir ensuite. Kumo aime ça, jusqu’à un certain point.', village: 'kumo', clan: 'raiko', element: 'raiton', traits: ['impulsif', 'fier'], objectif: 'puissance' },
  { id: 'pierre', nom: 'La pierre qui ne plie pas', kanji: '岩', accroche: 'Iwa, la loyauté, et des épaules faites pour porter les autres.', village: 'iwa', clan: 'ishikawa', element: 'doton', traits: ['loyal', 'determine'], objectif: 'proteger' },
  { id: 'paix', nom: 'Le cœur des tourbillons', kanji: '渦', accroche: 'Une vitalité hors norme, une famille dispersée, et l’envie folle que la guerre s’arrête.', village: 'konoha', clan: 'uzumaki', element: 'suiton', traits: ['compatissant', 'joyeux'], objectif: 'paix' },
];

/** L'aptitude naturelle : l'attribut que les deux traits renforcent le plus. */
export function aptitudeDe(traits: string[], defaut: AttributId): AttributId {
  let meilleur: AttributId | undefined;
  let max = 0;
  for (const a of APTITUDES as AttributId[]) {
    const total = traits.reduce((n, t) => n + (R.traits[t]?.bonus[a] ?? 0), 0);
    if (total > max) {
      max = total;
      meilleur = a;
    }
  }
  return meilleur ?? defaut;
}

/** Ce que les deux traits ajoutent à chaque attribut (pour l'aperçu). */
export function profilTraits(traits: string[]): Partial<Record<AttributId, number>> {
  const res: Partial<Record<AttributId, number>> = {};
  for (const t of traits) for (const [a, v] of Object.entries(R.traits[t]?.bonus ?? {})) res[a as AttributId] = (res[a as AttributId] ?? 0) + (v ?? 0);
  return res;
}

export function prenomAuHasard(village: VillageId, p: Presentation, alea: () => number = Math.random): string {
  const pool = R.contenu.noms[village];
  const liste = p === 'masculin' ? pool.m : p === 'feminin' ? pool.f : [...pool.m, ...pool.f];
  return liste[Math.floor(alea() * liste.length)];
}

/** Applique une voie à la fiche en cours : garde le prénom, la présentation et l'âge déjà choisis. */
export function appliquerVoie(base: Creation, v: Voie, alea: () => number = Math.random): Creation {
  const traits = [...v.traits];
  return {
    ...base,
    prenom: base.prenom.trim() || prenomAuHasard(v.village, base.presentation, alea),
    village: v.village,
    clan: v.clan,
    origine: v.clan === 'sans_clan' ? (v.origine ?? 'famille') : undefined,
    element: v.element,
    traits,
    aptitude: aptitudeDe(traits, base.aptitude),
    objectif: v.objectif,
  };
}

/** Un ninja tiré au hasard, toujours valide : le destin choisit tout, sauf ce que tu as déjà écrit (prénom, présentation, âge). */
export function creationAuHasard(base: Creation, alea: () => number = Math.random): Creation {
  const pick = <T,>(l: readonly T[]): T => l[Math.floor(alea() * l.length)];
  const village = pick(R.contenu.villages).id as VillageId;
  const clan = pick(R.contenu.clans.filter((k) => k.villages.includes(village)));
  const elements = (clan.elementsRequis ?? R.contenu.elements.map((e) => e.id)) as ElementId[];
  const element = clan.elementsConseilles && alea() < 0.6 ? (pick(clan.elementsConseilles) as ElementId) : pick(elements);
  const pool = R.contenu.traits.filter((t) => !t.special).map((t) => t.id);
  const t1 = pick(pool);
  const t2 = pick(pool.filter((t) => t !== t1));
  const c: Creation = {
    ...base,
    village,
    clan: clan.id,
    origine: clan.id === 'sans_clan' ? (alea() < 0.5 ? 'orphelin' : 'famille') : undefined,
    element,
    traits: [t1, t2],
    aptitude: aptitudeDe([t1, t2], base.aptitude),
    objectif: pick(R.contenu.objectifs).id,
  };
  c.prenom = base.prenom.trim() || prenomAuHasard(village, base.presentation, alea);
  return c;
}

// ── Le dernier ninja créé (une commodité du navigateur : peut manquer, ne casse jamais rien) ──
const CLE = 'ninja-destiny:derniere-creation';

export function memoriserCreation(c: Creation): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(c));
  } catch {
    /* stockage indisponible : tant pis */
  }
}

export function derniereCreation(): Creation | undefined {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return undefined;
    const c = JSON.parse(brut) as Creation;
    // Le contenu a pu changer depuis : une fiche devenue invalide est oubliée.
    return validerCreation({ ...c, heritage: undefined }).length === 0 ? { ...c, heritage: undefined } : undefined;
  } catch {
    return undefined;
  }
}
