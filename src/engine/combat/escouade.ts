// Les escouades (§2, « gestion des différentes cibles ») : plusieurs ennemis, chacun avec ses PV et son rôle.
// Une technique de zone les prend tous ; un coup ciblé n'en touche qu'un, mais en entier. Abattre le chef fait peur
// aux autres (ils peuvent déserter) ; tant que le soigneur tient debout, il referme les plaies des autres.
// Les PV du groupe (sc.adv.endurance) sont toujours la somme de ceux qui se battent encore.

import type { TypeAdversaire } from '../../content/combat/generiques';
import type { AdversaireDef, EtatAffrontement } from './types';
import { bougerMoral, moralDe } from './esprit';

export type RoleMembre = 'chef' | 'soigneur' | 'combattant';

export interface MembreEscouade {
  id: string;
  nom: string;
  role: RoleMembre;
  pv: number;
  pvMax: number;
  /** Il a jeté son arme et s'est enfui. */
  parti?: boolean;
}

export const KANJI_ROLE: Record<RoleMembre, string> = { chef: '長', soigneur: '医', combattant: '兵' };
export const LIBELLE_ROLE: Record<RoleMembre, string> = { chef: 'chef', soigneur: 'soigneur', combattant: 'combattant' };

type Noms = { chef: string; soigneur?: string; combattants: [string, string] };
const NOMS: Partial<Record<TypeAdversaire, Noms>> & { defaut: Noms } = {
  defaut: { chef: 'Le chef d’escouade', soigneur: 'Le ninja médecin', combattants: ['Le premier chūnin', 'Le second chūnin'] },
  bandit: { chef: 'Le chef de la bande', soigneur: 'La rebouteuse', combattants: ['Le coupe-jarret', 'Le grand balafré'] },
  mercenaire: { chef: 'Le capitaine', soigneur: 'Le chirurgien', combattants: ['Le mercenaire à la hache', 'Le mercenaire à l’arc'] },
  samourai: { chef: 'Le capitaine samouraï', soigneur: 'Le moine', combattants: ['Le premier samouraï', 'Le second samouraï'] },
  eleve: { chef: 'Le meneur', soigneur: 'La fille aux bandages', combattants: ['Le gros costaud', 'Le petit rapide'] },
  bete: { chef: 'Le chef de meute', combattants: ['Le loup gris', 'Le loup borgne'] },
};

/** Compose l'escouade : sa propre liste si elle en a une, sinon un chef, un soigneur et deux combattants. */
export function composerEscouade(d: AdversaireDef, total: number): MembreEscouade[] {
  const n = NOMS[d.type ?? 'ninja'] ?? NOMS.defaut;
  const liste = d.membres ?? [
    { nom: n.combattants[0], role: 'combattant' as const, part: n.soigneur ? 0.22 : 0.3 },
    { nom: n.combattants[1], role: 'combattant' as const, part: n.soigneur ? 0.22 : 0.3 },
    ...(n.soigneur ? [{ nom: n.soigneur, role: 'soigneur' as const, part: 0.2 }] : []),
    { nom: n.chef, role: 'chef' as const, part: n.soigneur ? 0.36 : 0.4 },
  ];
  const somme = liste.reduce((a, m) => a + m.part, 0);
  return liste.map((m, i) => {
    const pv = Math.max(1, Math.round((total * m.part) / somme));
    return { id: `m${i}`, nom: m.nom, role: m.role, pv, pvMax: pv };
  });
}

export const debout = (sc: EtatAffrontement): MembreEscouade[] => (sc.adv.membres ?? []).filter((m) => m.pv > 0 && !m.parti);

/** Les PV du groupe : la somme de ceux qui se battent encore. */
export function synchroniser(sc: EtatAffrontement): void {
  if (!sc.adv.membres) return;
  sc.adv.endurance = debout(sc).reduce((a, m) => a + m.pv, 0);
}

/** La cible : celle qu'on a choisie si elle tient encore debout, sinon le premier qui barre le chemin. */
export function cibleEffective(sc: EtatAffrontement, id?: string): MembreEscouade | undefined {
  const d = debout(sc);
  return d.find((m) => m.id === id) ?? d[0];
}

/** Moins ils sont, moins ils frappent fort. */
export function facteurNombre(sc: EtatAffrontement): number {
  const m = sc.adv.membres;
  if (!m?.length) return 1;
  return 0.4 + 0.6 * (debout(sc).length / m.length);
}

/**
 * Inflige des dégâts au groupe. « zone » et « large » touchent tout le monde (60 % et 75 % chacun) ;
 * « cible » touche un seul membre, en entier. Rend les PV réellement retirés et ce qu'il faut raconter.
 */
export function frapperEscouade(sc: EtatAffrontement, montant: number, portee: 'cible' | 'zone' | 'large', cibleId?: string): { inflige: number; textes: string[] } {
  const textes: string[] = [];
  if (montant <= 0) return { inflige: 0, textes };
  const touches = portee === 'cible' ? [cibleEffective(sc, cibleId)].filter(Boolean) as MembreEscouade[] : debout(sc);
  const part = portee === 'large' ? 0.75 : portee === 'zone' ? 0.6 : 1;
  let inflige = 0;
  for (const m of touches) {
    const dmg = Math.min(m.pv, Math.max(1, Math.round(montant * part)));
    m.pv -= dmg;
    inflige += dmg;
    if (m.pv <= 0) textes.push(...tomber(sc, m));
  }
  synchroniser(sc);
  return { inflige, textes };
}

function tomber(sc: EtatAffrontement, m: MembreEscouade): string[] {
  const t = [`${m.nom} s’effondre et ne se relève pas.`];
  if (m.role === 'chef') {
    // Le chef à terre : les autres perdent leur courage, et leur cohésion.
    bougerMoral(sc, { peur: 35, determination: -25, concentration: -15 });
    if (debout(sc).length) t.push('Les autres se regardent : leur chef est à terre. Plus personne ne donne d’ordre.');
  } else if (m.role === 'soigneur') {
    bougerMoral(sc, { peur: 10, concentration: -10 });
    if (debout(sc).length) t.push('Plus personne pour refermer leurs plaies.');
  } else bougerMoral(sc, { peur: 10 });
  return t;
}

/** Fin de manche : le soigneur soigne le plus blessé ; la peur fait déserter le plus faible. */
export function finDeMancheEscouade(sc: EtatAffrontement): string[] {
  if (!sc.adv.membres) return [];
  const textes: string[] = [];
  const d = debout(sc);
  const soigneur = d.find((m) => m.role === 'soigneur');
  if (soigneur) {
    const blesse = d.filter((m) => m.pv < m.pvMax).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax || a.id.localeCompare(b.id))[0];
    if (blesse) {
      const soin = Math.min(blesse.pvMax - blesse.pv, Math.max(1, Math.round(blesse.pvMax * 0.15)));
      blesse.pv += soin;
      textes.push(blesse === soigneur ? `${soigneur.nom} referme ses propres plaies (+${soin} PV).` : `${soigneur.nom} pose les mains sur ${minuscule(blesse.nom)} : ses plaies se referment (+${soin} PV).`);
    }
  }
  // La peur : sans chef, ou à bout de nerfs, le plus faible jette son arme et s'enfuit (un par manche).
  const m = moralDe(sc);
  const chefDebout = d.some((x) => x.role === 'chef');
  if (d.length > 1 && (m.peur >= 85 || (!chefDebout && m.peur >= 60))) {
    const fuyard = d.filter((x) => x.role !== 'chef').sort((a, b) => a.pv - b.pv || a.id.localeCompare(b.id))[0];
    if (fuyard) {
      fuyard.parti = true;
      textes.push(`${fuyard.nom} jette son arme et s’enfuit entre les arbres.`);
    }
  }
  synchroniser(sc);
  return textes;
}

/** Un renfort qui arrive rejoint le groupe. */
export function ajouterRenfort(sc: EtatAffrontement, pv: number): void {
  if (!sc.adv.membres) return;
  sc.adv.membres.push({ id: `m${sc.adv.membres.length}`, nom: 'Un renfort', role: 'combattant', pv, pvMax: pv });
  synchroniser(sc);
}

const minuscule = (s: string) => (/^(Le|La|Les|Un|Une)\s/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
