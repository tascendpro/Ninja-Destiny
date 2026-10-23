// Invariants de cohérence vérifiés après chaque action dans les tests et les simulations.

import type { GameState } from './types';
import { AXES_RELATION, STATUTS_ARME_UTILISABLES } from './types';
import { R } from './registre';
import { age, ageA } from './calendrier';
import { defPnj, estProdige, resoudrePnj } from './etat';
import { maxTierForAge } from './maitrise';

export function verifierInvariants(s: GameState): string[] {
  const err: string[] = [];
  const a = age(s);
  const cap = maxTierForAge(a, estProdige(s));

  if (s.pointsStat < 0 || !Number.isInteger(s.pointsStat)) err.push(`points de stat invalides : ${s.pointsStat}`);
  for (const [k, v] of Object.entries(s.attributs)) if (v > 100) err.push(`attribut ${k} au-delà de 100 (${v})`);

  for (const [id, ms] of Object.entries(s.maitrises)) {
    const def = R.maitrises[id];
    if (!def) err.push(`maîtrise inconnue ${id}`);
    if (!def?.sansPlafondAge && ms.tier > cap) err.push(`maîtrise ${id} au palier ${ms.tier} au-delà du plafond ${cap} (${a} ans)`);
    if (def?.composantes && ms.tier > Math.min(...def.composantes.map((e) => s.maitrises[`nature_${e}`]?.tier ?? 0)) + 1)
      err.push(`fusion ${id} au palier ${ms.tier}, au-delà de ses natures`);
    if (def?.eveil && !ms.awakened && ms.tier > 0) err.push(`pouvoir latent ${id} avec un palier ${ms.tier}`);
    if (ms.awakenedAtAge !== undefined && def?.eveil && ms.awakenedAtAge < def.eveil.ageMin && def.eveil.automatique === undefined)
      err.push(`éveil de ${id} à ${ms.awakenedAtAge} ans, avant l'âge minimal`);
  }

  for (const [id, st] of Object.entries(s.pnj)) {
    const d = defPnj(s, id);
    const ap = ageA(st.naissance, s.jour);
    const capP = maxTierForAge(ap, !!d?.prodige);
    for (const [mid, ms] of Object.entries(st.maitrises)) {
      if (!R.maitrises[mid]?.sansPlafondAge && ms.tier > capP) err.push(`PNJ ${id} : ${mid} au palier ${ms.tier} au-delà de son plafond ${capP} (${ap} ans)`);
    }
  }

  const utilisables = s.arsenal.filter((x) => STATUTS_ARME_UTILISABLES.includes(x.statut));
  const ids = utilisables.map((x) => x.defId);
  if (new Set(ids).size !== ids.length) err.push('arme utilisable en double dans l’arsenal');
  for (const [wid, entree] of Object.entries(s.registre)) {
    const tenue = utilisables.some((x) => x.defId === wid);
    if (tenue !== (entree.detenteur === 'joueur')) err.push(`registre incohérent pour ${wid} (${entree.detenteur}, tenue=${tenue})`);
  }
  for (const w of R.contenu.armes) if (w.unique && !s.registre[w.id]) err.push(`arme unique absente du registre : ${w.id}`);
  if (s.armeEquipee && !ids.includes(s.armeEquipee)) err.push(`arme équipée inutilisable : ${s.armeEquipee}`);

  for (const [eid, v] of Object.entries(s.evenementsVus)) {
    const ev = R.evenements[eid];
    if (ev && !ev.repetable && v.n > 1) err.push(`événement unique répété : ${eid}`);
  }

  for (const [mid, st] of Object.entries(s.missions)) {
    if (!['en_cours', 'reussie', 'echouee', 'abandonnee', 'confiee'].includes(st)) err.push(`statut de mission invalide ${mid}`);
  }

  for (const [pid, r] of Object.entries(s.relations)) {
    for (const ax of AXES_RELATION) if (r[ax] < 0 || r[ax] > 100) err.push(`relation hors bornes ${pid}.${ax}`);
  }

  for (const [k, v] of Object.entries(s.attributs)) if (v < 0 || v > 100) err.push(`attribut hors bornes ${k}=${v}`);
  for (const [k, v] of Object.entries(s.social)) if (v < 0 || v > 100) err.push(`social hors bornes ${k}=${v}`);
  if (s.jauges.sante < 0 || s.jauges.sante > 100) err.push('santé hors bornes');
  if (s.jauges.ryo < 0) err.push('ryō négatifs');
  if (s.statut === 'mort' && !s.fin) err.push('mort sans fin');

  if (s.scene.type === 'evenement') {
    const ev = R.evenements[s.scene.id];
    for (const ref of ev.personnages ?? []) {
      const id = resoudrePnj(s, ref);
      if (id && (s.pnj[id]?.etat === 'mort' || s.pnj[id]?.etat === 'disparu')) err.push(`${id} apparaît dans ${ev.id} alors qu’il est ${s.pnj[id].etat}`);
    }
  }

  if (s.metier.principal && s.metier.principal === s.metier.secondaire) err.push('métier principal et secondaire identiques');
  for (const m of [s.metier.principal, s.metier.secondaire]) {
    if (!m) continue;
    const def = R.metiers[m];
    for (const autre of [s.metier.principal, s.metier.secondaire]) {
      if (autre && autre !== m && def?.incompatibleAvec.includes(autre)) err.push(`métiers incompatibles : ${m} / ${autre}`);
    }
  }
  return err;
}
