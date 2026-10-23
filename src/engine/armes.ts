// Armes, arsenal, registre mondial des armes uniques — section 8.

import type { CapaciteArme, ElementId, GameState, StatutArme, WeaponDef, WeaponInstance } from './types';
import { STATUTS_ARME_UTILISABLES } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal } from './etat';
import { evaluer } from './conditions';
import { nouvelleMaitrise } from './maitrise';

/** La valeur d'une arme pour la comparer aux autres : puissance d'abord, puis solidité, vitesse, conduction du chakra et capacités. */
export function scoreArme(def: WeaponDef): number {
  const st = def.stats;
  return st.puissance + st.robustesse * 0.15 + st.vitesse * 0.1 + st.conduction * 0.12 + def.capacites.length * 4;
}

const SEUILS_RANG_ARME: [number, string][] = [
  [72, 'SS'],
  [62, 'S'],
  [50, 'A'],
  [42, 'B'],
  [35, 'C'],
  [27, 'D'],
];

/** Le rang d'une arme, de E (l'équipement d'Académie) à SS (les lames dont on raconte l'histoire). */
export function rangArme(def: WeaponDef): string {
  const sc = scoreArme(def);
  return SEUILS_RANG_ARME.find(([min]) => sc >= min)?.[1] ?? 'E';
}

export function idFamille(famille: string): string {
  return `famille_${famille}`;
}

export function instanceArme(s: GameState, defId: string): WeaponInstance | undefined {
  return s.arsenal.find((a) => a.defId === defId);
}

export function estUtilisable(inst: WeaponInstance | undefined): boolean {
  return !!inst && STATUTS_ARME_UTILISABLES.includes(inst.statut);
}

export function possedeElement(s: GameState, el: ElementId): boolean {
  if (s.creation.element === el) return true;
  return (s.maitrises[`nature_${el}`]?.tier ?? 0) >= 2;
}

function assurerMaitriseFamille(s: GameState, famille: string): void {
  const id = idFamille(famille);
  const def = R.maitrises[id];
  if (!def || s.maitrises[id]) return;
  s.maitrises[id] = nouvelleMaitrise(def, 40 + s.attributs.agilite / 2, 'entrainement');
}

/** Change le détenteur d'une arme unique. Le registre est la seule source de vérité : une arme n'existe jamais à deux endroits. */
export function transferUniqueItem(s: GameState, defId: string, detenteur: string, ctx?: Ctx): void {
  const def = R.armes[defId];
  if (!def?.unique) return;
  const avant = s.registre[defId]?.detenteur;
  s.registre[defId] = { detenteur, depuis: s.jour };
  if (avant === 'joueur' && detenteur !== 'joueur') {
    const inst = instanceArme(s, defId);
    if (inst && estUtilisable(inst)) inst.statut = 'perdue';
    if (s.armeEquipee === defId) desequiper(s);
  }
  if (ctx && avant !== detenteur) {
    s.drapeaux[`registre:${defId}`] = detenteur;
  }
}

export function checkWeaponAcceptance(s: GameState, defId: string): boolean {
  const def = R.armes[defId];
  if (!def) return false;
  return !def.choisitPorteur || evaluer(def.choisitPorteur, s);
}

export function obtenirArme(s: GameState, defId: string, statut: 'possedee' | 'pretee' | 'derobee', ctx: Ctx): boolean {
  const def = R.armes[defId];
  if (!def) return false;
  if (def.unique) {
    if (s.registre[defId]?.detenteur === 'joueur' && estUtilisable(instanceArme(s, defId))) return false;
    if (s.registre[defId]?.detenteur === 'detruite') {
      ctx.changements.push({ t: 'info', message: `${def.nom} n'existe plus.` });
      return false;
    }
    if (!checkWeaponAcceptance(s, defId)) {
      ctx.changements.push({ t: 'arme', arme: defId, message: `${def.nom} te refuse.` });
      ajouterJournal(s, `${def.nom} a refusé de te reconnaître comme porteur.`, 2);
      return false;
    }
    transferUniqueItem(s, defId, 'joueur', ctx);
  }
  let inst = instanceArme(s, defId);
  if (inst && !def.unique && estUtilisable(inst)) {
    inst.etat = 100;
  } else if (inst) {
    inst.statut = statut;
    inst.etat = Math.max(inst.etat, 40);
  } else {
    inst = { defId, etat: 100, lien: 0, statut, lie: false, acquiseLe: s.jour };
    s.arsenal.push(inst);
  }
  assurerMaitriseFamille(s, def.famille);
  if (!s.armeEquipee || !estUtilisable(instanceArme(s, s.armeEquipee))) s.armeEquipee = defId;
  ctx.changements.push({ t: 'arme', arme: defId, message: `${def.nom} rejoint ton arsenal${statut === 'pretee' ? ' (prêt)' : ''}.` });
  if (def.rarete === 'legendaire' || def.rarete === 'maudite') ajouterJournal(s, `Tu portes désormais ${def.nom}.`, 3);
  if (!s.decouvertes.includes(`arme:${defId}`)) s.decouvertes.push(`arme:${defId}`);
  return true;
}

export function desequiper(s: GameState): void {
  s.armeEquipee = s.arsenal.find((a) => estUtilisable(a))?.defId;
}

export function perdreArme(
  s: GameState,
  defId: string,
  statut: 'perdue' | 'confisquee' | 'detruite' | 'vendue' | 'rendue',
  vers: string | undefined,
  ctx: Ctx,
): void {
  const def = R.armes[defId];
  const inst = instanceArme(s, defId);
  if (!def || !inst || !estUtilisable(inst)) return;
  inst.statut = statut as StatutArme;
  inst.lie = false;
  if (def.unique) {
    const dest =
      vers ??
      (statut === 'detruite'
        ? 'detruite'
        : statut === 'confisquee'
          ? `place:coffre_${s.creation.village}`
          : statut === 'perdue'
            ? 'perdue'
            : 'place:inconnu');
    transferUniqueItem(s, defId, dest, ctx);
  }
  if (s.armeEquipee === defId) desequiper(s);
  const verbes: Record<string, string> = {
    perdue: 'perdue',
    confisquee: 'confisquée',
    detruite: 'détruite',
    vendue: 'vendue',
    rendue: 'rendue',
  };
  ctx.changements.push({ t: 'arme', arme: defId, message: `${def.nom} : ${verbes[statut]}.` });
}

/** Récupérer une arme perdue ou confisquée : le registre doit l'autoriser. */
export function recupererArme(s: GameState, defId: string, ctx: Ctx): boolean {
  const def = R.armes[defId];
  const inst = instanceArme(s, defId);
  if (!def || !inst || estUtilisable(inst)) return false;
  if (inst.statut === 'detruite') return false;
  if (def.unique) {
    const det = s.registre[defId]?.detenteur;
    if (det === 'detruite') return false;
    transferUniqueItem(s, defId, 'joueur', ctx);
  }
  inst.statut = 'possedee';
  ctx.changements.push({ t: 'arme', arme: defId, message: `Tu récupères ${def.nom}.` });
  if (!s.armeEquipee) s.armeEquipee = defId;
  return true;
}

export function equiper(s: GameState, defId: string, ctx?: Ctx): boolean {
  if (!estUtilisable(instanceArme(s, defId))) return false;
  s.armeEquipee = defId;
  ctx?.changements.push({ t: 'arme', arme: defId, message: `Tu prends ${R.armes[defId]?.nom ?? defId} en main.` });
  return true;
}

export function usureArme(s: GameState, n: number, ctx: Ctx): void {
  const inst = s.armeEquipee ? instanceArme(s, s.armeEquipee) : undefined;
  const def = inst ? R.armes[inst.defId] : undefined;
  if (!inst || !def) return;
  const resistance = def.stats.robustesse / 100;
  inst.etat = Math.max(0, Math.round(inst.etat - n * (1.2 - resistance)));
  if (inst.etat === 0) {
    if (def.unique && def.rarete === 'legendaire') {
      inst.etat = 5;
      ctx.changements.push({ t: 'arme', arme: def.id, message: `${def.nom} est gravement abîmée : seul un maître forgeron pourra la restaurer.` });
    } else {
      perdreArme(s, def.id, 'detruite', undefined, ctx);
    }
  }
}

/** Une seule arme légendaire liée durablement à la fois (section 8.3). */
export function lierArme(s: GameState, defId: string, delta: number, ctx: Ctx): void {
  const inst = instanceArme(s, defId);
  const def = R.armes[defId];
  if (!inst || !def || !estUtilisable(inst)) return;
  const legendaire = def.rarete === 'legendaire' || def.rarete === 'maudite';
  const autreLiee = s.arsenal.find((a) => a.defId !== defId && a.lie);
  let nouveau = Math.max(0, Math.min(100, inst.lien + delta));
  if (legendaire && autreLiee && nouveau >= 50) {
    nouveau = 49;
    ctx.changements.push({
      t: 'info',
      message: `${def.nom} résiste : ton lien avec ${R.armes[autreLiee.defId]?.nom} occupe déjà cette place.`,
    });
  }
  inst.lien = nouveau;
  if (legendaire && nouveau >= 50 && !inst.lie) {
    inst.lie = true;
    ctx.changements.push({ t: 'arme', arme: defId, message: `Un lien durable se forme avec ${def.nom}.` });
    ajouterJournal(s, `Lien scellé avec ${def.nom}.`, 3);
  }
  if (nouveau < 50) inst.lie = false;
}

export interface ModificateursArme {
  defId?: string;
  famille?: string;
  bonus: number;
  malus: number;
  capacites: CapaciteArme[];
  notes: string[];
}

/** Calcule les bonus et malus d'une arme pour son porteur. Une arme mal maîtrisée handicape. */
export function getWeaponModifiers(s: GameState, defId = s.armeEquipee): ModificateursArme {
  const vide: ModificateursArme = { bonus: 0, malus: 0, capacites: [], notes: [] };
  if (!defId) return vide;
  const def: WeaponDef | undefined = R.armes[defId];
  const inst = instanceArme(s, defId);
  if (!def || !inst || !estUtilisable(inst)) return { ...vide, notes: ['Arme indisponible'] };
  const palier = s.maitrises[idFamille(def.famille)]?.tier ?? 0;
  let bonus = def.stats.puissance / 2 + palier * 4 + inst.lien / 20;
  let malus = 0;
  const notes: string[] = [];
  if (def.exigences.force && s.attributs.force < def.exigences.force) {
    malus += (def.exigences.force - s.attributs.force) * 0.8;
    notes.push('Trop lourde pour toi');
  }
  if (def.exigences.palierFamille && palier < def.exigences.palierFamille) {
    malus += (def.exigences.palierFamille - palier) * 10;
    notes.push('Tu ne la maîtrises pas encore');
  }
  if (inst.etat < 30) {
    malus += 10;
    notes.push('Lame abîmée');
  }
  const capacites = def.capacites.filter(
    (c) => c.palierMin <= palier && inst.lien >= c.lienMin && (!c.element || possedeElement(s, c.element)),
  );
  bonus += capacites.length * 4;
  return { defId, famille: def.famille, bonus: Math.round(bonus), malus: Math.round(malus), capacites, notes };
}

/** Réparer une arme chez un forgeron. */
export function reparerArme(s: GameState, defId: string): number {
  const inst = instanceArme(s, defId);
  if (!inst || !estUtilisable(inst)) return 0;
  const avant = inst.etat;
  inst.etat = 100;
  return 100 - avant;
}
