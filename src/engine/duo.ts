// Techniques à deux : avec un équipier assez proche, ta nature et la sienne se mêlent en une technique combinée.
// Elle ne se lance qu'avec lui ou elle à tes côtés : seul·e, tu n'as que la moitié des signes.

import type { ElementId, GameState } from './types';
import { R } from './registre';
import { Ctx, ajouterJournal, defPnj, resoudrePnj } from './etat';
import { nouvelleMaitrise } from './maitrise';
import { tirageTexte } from './combat/impacts';

/** L'amitié et la confiance qu'il faut avant de mêler vos natures. */
export const SEUIL_DUO = { amitie: 60, confiance: 45 };

const NATURES: ElementId[] = ['katon', 'suiton', 'fuuton', 'raiton', 'doton'];

/** Ta meilleure nature éveillée. */
function natureJoueur(s: GameState): ElementId | undefined {
  return NATURES.filter((e) => (s.maitrises[`nature_${e}`]?.tier ?? 0) >= 1).sort(
    (a, b) => (s.maitrises[`nature_${b}`]?.tier ?? 0) - (s.maitrises[`nature_${a}`]?.tier ?? 0),
  )[0];
}

/** La nature que l'équipier apporte : sa meilleure qui n'est pas la tienne, sinon une qui lui est propre (stable d'une partie à l'autre). */
export function naturePartenaire(s: GameState, id: string, sauf?: ElementId): ElementId {
  const st = s.pnj[id];
  const connues = Object.entries(st?.maitrises ?? {})
    .filter(([k]) => k.startsWith('nature_') && NATURES.includes(k.slice(7) as ElementId) && k.slice(7) !== sauf)
    .sort((a, b) => b[1].tier - a[1].tier);
  if (connues.length) return connues[0][0].slice(7) as ElementId;
  const autres = NATURES.filter((e) => e !== sauf);
  return autres[Math.floor(tirageTexte({ ...s, actions: [] }, `nature:${id}`) * autres.length)];
}

function combinaison(a: ElementId, b: ElementId): string | undefined {
  return R.contenu.maitrises.find((m) => m.technique?.categorie === 'combinaison' && m.technique.elements?.includes(a) && m.technique.elements.includes(b))?.id;
}

/** La technique que tu pourrais créer avec cet équipier, s'il est assez proche ; undefined sinon. */
export function duoPossible(s: GameState, ref: string): { tech: string; partenaire: string } | undefined {
  const id = resoudrePnj(s, ref);
  const st = id ? s.pnj[id] : undefined;
  if (!id || !st || st.etat === 'mort' || st.etat === 'disparu') return undefined;
  const rel = s.relations[id];
  if (!rel || rel.rompue || rel.amitie < SEUIL_DUO.amitie || rel.confiance < SEUIL_DUO.confiance) return undefined;
  if (s.drapeaux[`duo_avec:${id}`]) return undefined;
  const nj = natureJoueur(s);
  const tech = nj ? combinaison(nj, naturePartenaire(s, id, nj)) : undefined;
  if (!tech || (s.maitrises[tech]?.tier ?? 0) >= 1) return undefined;
  return { tech, partenaire: id };
}

/** Vous mêlez vos natures : la technique combinée est à toi, mais elle reste liée à cet équipier. */
export function apprendreDuo(s: GameState, ref: string, ctx: Ctx): void {
  const d = duoPossible(s, ref);
  if (!d) return;
  const def = R.maitrises[d.tech];
  const ms = nouvelleMaitrise(def, 70, 'mentor');
  ms.awakened = true;
  ms.tier = 1;
  ms.palierDepuis = s.jour;
  s.maitrises[d.tech] = ms;
  s.drapeaux[`duo:${d.tech}`] = d.partenaire;
  s.drapeaux[`duo_avec:${d.partenaire}`] = d.tech;
  const nom = defPnj(s, d.partenaire)?.nom ?? 'ton équipier';
  const message = `Avec ${nom}, tu crées « ${def.nom} ». Elle ne se lance qu’à deux.`;
  ctx.changements.push({ t: 'technique', maitrise: d.tech, message });
  ajouterJournal(s, message, 2);
}

/** L'équipier avec qui cette technique se lance, si c'en est une à deux. */
export function partenaireDuo(s: GameState, tech: string): string | undefined {
  const v = s.drapeaux[`duo:${tech}`];
  return typeof v === 'string' ? v : undefined;
}

/** Une technique à deux ne se lance que si l'équipier est vivant, pas fâché, et présent dans la scène. */
export function duoUtilisable(s: GameState, tech: string): boolean {
  const id = partenaireDuo(s, tech);
  if (!id) return true;
  const st = s.pnj[id];
  if (!st || st.etat === 'mort' || st.etat === 'disparu' || s.relations[id]?.rompue) return false;
  const evId = s.scene.type === 'evenement' ? s.scene.id : 'evenementId' in s.scene ? s.scene.evenementId : undefined;
  const ev = evId ? R.evenements[evId] : undefined;
  return !!ev?.personnages?.some((ref) => resoudrePnj(s, ref) === id);
}
