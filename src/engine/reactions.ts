// Ce que voient les autres quand tu te transformes ou que tes yeux s'éveillent en plein combat.
// Un allié dans la mêlée admire, s'inquiète ou prend peur selon votre lien et ce qu'il voit ;
// l'ennemi recule (sa garde s'ouvre) ou relève le défi. Tout se tire avec le hasard de la partie.

import type { CheckDef, GameState } from './types';
import { R } from './registre';
import { Ctx, defPnj } from './etat';
import { alea } from './rng';
import { tirageTexte } from './combat/impacts';
import { appliquerEffet } from './effets';

/** Les pouvoirs qui font peur à voir, même à ceux qui t'aiment. */
const MONSTRUEUX = new Set(['marque_maudite', 'biju_manteau', 'biju_mode', 'tai_portes', 'susanoo', 'mangekyo', 'rinnegan']);
/** Les pouvoirs qui écrasent : l'ennemi a plus de chances de reculer. */
const ECRASANTS = new Set(['susanoo', 'biju_mode', 'mode_ermite', 'byakugo', 'mangekyo', 'rinnegan', 'doton_titan', 'suiton_leviathan', 'katon_phenix_avatar', 'fuuton_ouragan_forme']);

/** Le nom à afficher et la phrase, selon le lien entre toi et l'allié qui regarde. */
function reactionAllie(s: GameState, pouvoir: string, ctx: Ctx): string | undefined {
  const id = s.roles['coequipierA'];
  const d = defPnj(s, id);
  const st = id ? s.pnj[id] : undefined;
  if (!id || !d || !st || st.etat === 'mort' || st.etat === 'disparu') return undefined;
  const rel = s.relations[id];
  const proche = !!rel && !rel.rompue && rel.amitie + rel.confiance >= 50;
  const peur = MONSTRUEUX.has(pouvoir);
  const sang = R.maitrises[pouvoir]?.clan;
  const memeClan = !!sang && sang === s.creation.clan && d.clan === sang;
  const f = d.genre === 'f';
  let ligne: string;
  if (peur && proche) {
    ligne = `${d.nom} crie ton prénom. Pas de peur dans sa voix : de l’inquiétude. « Ne te perds pas là-dedans ! »`;
    appliquerEffet(s, { relation: id, delta: { attachement: 2 } }, ctx);
  } else if (peur) {
    ligne = `${d.nom} recule d’un pas. Tu lis la peur sur son visage, et elle ne vient pas de l’ennemi.`;
    appliquerEffet(s, { relation: id, delta: { confiance: -2 } }, ctx);
  } else if (memeClan) {
    ligne = `${d.nom} reconnaît le pouvoir de votre clan. Dans ses yeux, une fierté qu’${f ? 'elle' : 'il'} ne cherche pas à cacher.`;
    appliquerEffet(s, { relation: id, delta: { respect: 2 } }, ctx);
  } else if (proche) {
    ligne = `${d.nom} lâche un cri de joie au milieu de la mêlée : « Vas-y ! »`;
    appliquerEffet(s, { relation: id, delta: { respect: 2 } }, ctx);
  } else {
    ligne = `${d.nom} te regarde comme on regarde quelqu’un qu’on croyait connaître.`;
    appliquerEffet(s, { relation: id, delta: { respect: 1 } }, ctx);
  }
  return ligne;
}

/**
 * Les réactions à une transformation ou à un dōjutsu, au moment où ils s'activent.
 * Renvoie le texte à ajouter au journal du combat ; ouvre la garde de l'ennemi s'il recule.
 */
export function reagirTransformation(s: GameState, base: CheckDef, pouvoir: string, ctx: Ctx): string {
  const sc = s.scene;
  if (sc.type !== 'combat' && sc.type !== 'affrontement') return '';
  const lignes: string[] = [];
  if (base.allies && s.statut === 'actif') {
    const a = reactionAllie(s, pouvoir, ctx);
    if (a) lignes.push(a);
  }
  const escouade = (base.forme ?? 'duel') === 'escouade';
  const chance = 0.2 + (MONSTRUEUX.has(pouvoir) ? 0.2 : 0) + (ECRASANTS.has(pouvoir) ? 0.25 : 0);
  // Dans l'Affrontement, le tirage vient de l'état : l'ordre des tirages de la manche reste celui du contrat.
  const tirage = sc.type === 'combat' ? alea(s) : tirageTexte(s, `reaction:${pouvoir}:${sc.manche}`);
  if (tirage < chance) {
    if (sc.type === 'combat') sc.ouverture = true;
    else sc.ouverture = Math.max(sc.ouverture, 15);
    lignes.push(escouade ? 'Deux d’entre eux échangent un regard et reculent. Leur ligne se défait : il y a une brèche.' : 'Ton adversaire recule d’un pas, la garde soudain hésitante. C’est une ouverture.');
  } else {
    lignes.push(escouade ? 'Leur chef aboie un ordre. Ils se resserrent : ils ont compris que le vrai combat commence.' : 'Ton adversaire serre les dents et relève sa garde : il a compris que le vrai combat commence.');
  }
  return lignes.join(' ');
}
