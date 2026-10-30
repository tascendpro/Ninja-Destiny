// Le monde reconnaît le binôme : les titres (attribués sur des faits vérifiables), la réputation commune par village,
// ce que les PNJ disent de vous, la chronique ; et à la fin, ce que les deux vies ont fait l'une de l'autre.

import { R } from '../registre';
import { noteFinale } from '../fins';
import { accorder } from '../texte';
import type { Campagne, FinCampagne, IdJoueur } from './types';
import { ageA, autre, finie, hash01, jourMonde, texteCommun } from './outils';
import { PROFIL, PROFILS_AKATSUKI } from '../../content/campagne/akatsuki';

// ── L'Akatsuki de cette campagne ─────────────────────────────

/** Six membres tirés pour cette chronologie, en trois binômes. */
export function composerAkatsuki(c: Campagne): void {
  const restants = PROFILS_AKATSUKI.map((p) => p.id);
  const tires: string[] = [];
  for (let i = 0; i < 6; i++) tires.push(restants.splice(Math.floor(hash01(c, `akatsuki:${i}`) * restants.length), 1)[0]);
  c.akatsuki.binomes = [
    [tires[0], tires[1]],
    [tires[2], tires[3]],
    [tires[4], tires[5]],
  ];
}

/** Le binôme miroir : celui de l'Akatsuki qui vous ressemble le plus (vos natures). */
export function binomeMiroir(c: Campagne): [string, string] {
  const natures = c.creations.map((x) => x.element);
  const score = (b: [string, string]) => b.filter((id) => natures.includes(PROFIL[id].nature)).length;
  return [...c.akatsuki.binomes].sort((a, b) => score(b) - score(a))[0];
}

export const nomsBinome = (b: [string, string]) => `${PROFIL[b[0]].nom} et ${PROFIL[b[1]].nom}`;

// ── Ce que le moteur suit ────────────────────────────────────

/** À chaque action : les désertions, les morts, et ce que la chronique en retient. */
export function suivreMonde(c: Campagne): void {
  for (const j of [0, 1] as IdJoueur[]) {
    const s = c.joueurs[j];
    if (s.statut === 'deserteur' && !c.stats.deserte[j]) {
      c.stats.deserte[j] = true;
      c.chronique.push({ jour: s.jour, texte: `On dit que ${c.creations[j].prenom} a rayé son bandeau et quitté son village.` });
    }
    if (s.statut === 'mort' && c.stats.mort[j] === undefined) {
      c.stats.mort[j] = s.jour;
      c.chronique.push({ jour: s.jour, texte: accorder(`${c.creations[j].prenom} est mort·e. ${s.fin?.cause ? `${s.fin.cause.charAt(0).toUpperCase()}${s.fin.cause.slice(1)}.` : ''}`.trim(), c.creations[j].presentation) });
    }
  }
}

// ── Les titres ───────────────────────────────────────────────

export interface Titre {
  id: string;
  nom: string;
  raison: string;
}

/** Les titres du binôme : chacun repose sur ce qui a réellement été fait. */
export function titres(c: Campagne): Titre[] {
  const t: Titre[] = [];
  const s = c.stats;
  const [a, b] = c.joueurs;
  const memeVillage = c.creations[0].village === c.creations[1].village;
  const village = R.villages[c.creations[0].village]?.nom ?? '';
  if (s.victoiresRaiton >= 5) t.push({ id: 'tonnerre', nom: c.lien.type === 'freres' ? 'Les frères du tonnerre' : 'Le binôme du tonnerre', raison: 'Cinq victoires côte à côte, portées par la foudre.' });
  if (s.victoiresLames >= 3) t.push({ id: 'lames', nom: 'Les deux lames', raison: 'Trois victoires gagnées à l’arme, ensemble.' });
  if (s.victoires >= 3 && memeVillage && c.creations[0].village === 'kiri') t.push({ id: 'brume', nom: 'Le duo de la brume', raison: 'Trois victoires communes, au nom de Kiri.' });
  if (s.victoires >= 4) t.push({ id: 'frontiere', nom: 'Le binôme de la frontière', raison: `Quatre combats gagnés côte à côte${memeVillage ? `, au service de ${village}` : ''}.` });
  if (s.survivantsKage) t.push({ id: 'survivants', nom: 'Les survivants', raison: 'Vous avez survécu ensemble à un adversaire de rang Kage.' });
  if (a.creation.clan !== 'sans_clan' && b.creation.clan !== 'sans_clan' && ['jonin', 'kage'].includes(a.rang) && ['jonin', 'kage'].includes(b.rang)) t.push({ id: 'heritiers', nom: 'Les deux héritiers', raison: 'Deux enfants de clan, devenus jōnin tous les deux.' });
  if (s.deserte[0] && s.deserte[1]) t.push({ id: 'traitres', nom: 'Les deux traîtres', raison: 'Vous avez tous les deux déserté.' });
  if (a.social.reputationOmbre >= 40 && b.social.reputationOmbre >= 40) t.push({ id: 'ombres', nom: 'Les ombres jumelles', raison: 'Ce que vous avez fait dans l’ombre, tout le monde l’ignore, et tout le monde le sait.' });
  if (['revele', 'rallie'].includes(c.fil.etape) && c.vues.includes('mc_revelation')) t.push({ id: 'trahison', nom: 'Le traître et celui qui n’a rien vu', raison: 'Une trahison découverte au grand jour.' });
  if (c.lien.duels[0] + c.lien.duels[1] >= 5) t.push({ id: 'rivaux', nom: 'Les rivaux éternels', raison: `${c.lien.duels[0] + c.lien.duels[1]} duels, et toujours aucun vainqueur définitif.` });
  if (c.akatsuki.detruite) t.push({ id: 'aube', nom: 'Ceux qui ont brisé l’Aube', raison: 'L’Akatsuki de votre temps est tombée par vous.' });
  return t;
}

/** La réputation du binôme, par village et auprès de l'Akatsuki : séparée de celle de chacun. */
export function renommee(c: Campagne): Record<string, number> {
  const r: Record<string, number> = {};
  const ajout = (k: string, v: number) => (r[k] = Math.max(-100, Math.min(100, (r[k] ?? 0) + v)));
  for (const j of [0, 1] as IdJoueur[]) ajout(c.creations[j].village, 0);
  for (const k of Object.keys(r)) {
    ajout(k, c.stats.victoires * 6 - c.stats.defaites * 2);
    if (c.stats.survivantsKage) ajout(k, 15);
    // Une trahison au grand jour salit les deux : on ne fait plus confiance à celui qui ne l'a pas vue venir.
    if (titres(c).some((t) => t.id === 'trahison')) ajout(k, -15);
  }
  for (const j of [0, 1] as IdJoueur[]) if (c.stats.deserte[j]) ajout(c.creations[j].village, -40);
  if (c.akatsuki.recrues.length) ajout('akatsuki', 30 * c.akatsuki.recrues.length);
  if (c.akatsuki.detruite) ajout('akatsuki', -100);
  return r;
}

/** Ce que les PNJ disent de vous : selon votre lien, vos titres, vos rangs, et ce qui est public. */
export function voixDuMonde(c: Campagne, j: IdJoueur): string[] {
  const o = autre(j);
  const nom = c.creations[o].prenom;
  const [moi, lui] = [c.joueurs[j], c.joueurs[o]];
  const v: string[] = [];
  const a = c.lien.axes[j];
  if (a.ressentiment >= 40 && c.lien.axes[o].ressentiment >= 30) v.push(`« Vous êtes encore ensemble, ${nom} et toi ? Je croyais que vous ne vous supportiez plus. »`);
  if (c.stats.victoires >= 2) v.push('« On raconte que vous avez tenu une position à deux, là où il aurait fallu une équipe entière. »');
  const ordre = ['eleve', 'genin', 'chunin', 'jonin', 'kage'];
  if (ordre.indexOf(lui.rang) > ordre.indexOf(moi.rang)) v.push(c.lien.type === 'freres' ? `« Ton frère ou ta sœur est devenu·e ${lui.rang === 'jonin' ? 'jōnin' : lui.rang} avant toi, non ? »` : `« ${nom} est passé·e ${lui.rang === 'jonin' ? 'jōnin' : lui.rang} avant toi, à ce qu’on dit. »`);
  if (c.stats.deserte[o]) v.push(`« J’ai entendu dire que ${nom} avait rejoint les déserteurs. Tu le savais ? »`);
  if (c.lien.axes[j].confiance < 25 && c.vues.includes('mc_academie')) v.push('« Vous étiez inséparables, à l’Académie. Qu’est-ce qui s’est passé ? »');
  for (const t of titres(c)) v.push(`« ${t.nom}… c’est vous ? ${t.raison} »`);
  if (finie(lui)) v.push(`« Je suis désolé, pour ${nom}. On parle encore de vous deux, tu sais. »`);
  // Les formes « ·e » des rumeurs désignent l'autre : on les accorde à lui.
  return v.map((x) => accorder(x, c.creations[o].presentation));
}

// ── La fin ───────────────────────────────────────────────────

const age = (c: Campagne, j: IdJoueur) => ageA(c.joueurs[j], c.stats.mort[j] ?? c.joueurs[j].jour);

/** Les fins possibles, de la plus singulière à la plus ordinaire : la première dont les conditions sont réunies. */
function choisirFin(c: Campagne): { id: string; titre: string; texte: string } {
  const [a, b] = c.lien.axes;
  const s = c.stats;
  const morts = s.mort;
  /** Celui qui est mort avant trente ans, si l'un l'est. */
  const jeuneMort = ([0, 1] as IdJoueur[]).find((j) => morts[j] !== undefined && age(c, j) < 30);
  const fins: [boolean, string, string, string][] = [
    [morts[0] !== undefined && morts[1] !== undefined && Math.abs(morts[0] - morts[1]) <= 2, 'meme_pierre', 'La même pierre', 'Vous êtes tombés le même jour, l’un pour l’autre. On a gravé vos deux noms sur la même pierre, si près qu’on ne sait plus où finit l’un.'],
    [s.tueParAutre !== undefined, 'dernier_duel', 'Le dernier duel', 'Votre histoire s’est terminée comme elle avait commencé : l’un face à l’autre. Cette fois, un seul est reparti.'],
    [c.akatsuki.detruite && c.akatsuki.infiltre !== undefined, 'aube_brisee', 'L’Aube brisée', 'L’Akatsuki de votre temps est tombée, de l’intérieur et de l’extérieur à la fois. Personne ne saura jamais tout ce que ça a coûté.'],
    [c.akatsuki.chef !== undefined, 'dernier_manteau', 'Le dernier manteau', 'L’un a pris la tête de l’Akatsuki. L’autre a dû décider ce qu’il en ferait. Le manteau à nuages rouges n’a été porté par personne d’autre après.'],
    [s.deserte[0] && s.deserte[1], 'deux_deserteurs', 'Les deux déserteurs', 'Vous avez quitté vos villages, et le monde a appris à vous craindre ensemble.'],
    [c.fil.etape === 'redemption', 'redemption', 'La rédemption', 'L’un a trahi l’autre. Plus tard, c’est lui qui l’a sauvé. Le pardon n’a rien effacé ; il a seulement rendu possible tout le reste.'],
    [['revele', 'rallie'].includes(c.fil.etape), 'traitre_survivant', 'Le traître et le survivant', 'L’un a trahi. L’autre a survécu, et a reconstruit sa vie autour du trou qu’on lui avait laissé.'],
    [c.joueurs.every((x) => x.rang === 'kage') && c.creations[0].village !== c.creations[1].village, 'deux_kage', 'Les deux Kage', 'Deux Kage de deux villages, qui se connaissaient depuis l’enfance. Pendant leur règne, leurs villages n’ont pas connu la guerre.'],
    [c.joueurs.some((x) => x.rang === 'kage') && Math.min(a.confiance, b.confiance) >= 60, 'kage_ombre', 'Le Kage et l’ombre', 'L’un a porté le chapeau. L’autre a fait, dans l’ombre, tout ce que le chapeau ne pouvait pas faire.'],
    [c.morts.includes('heritier'), 'heritier', 'L’héritier', 'L’un est tombé, et un enfant de son sang a repris sa place aux côtés de l’autre. Ce n’était pas la même personne. C’était la même histoire.'],
    [c.morts.includes('retour'), 'revenu', 'Celui qui est revenu', 'L’un est mort, et il est revenu, autrement. L’autre ne lui a jamais demandé ce qu’il avait vu de l’autre côté.'],
    [jeuneMort !== undefined && Math.max(a.ressentiment, b.ressentiment) >= 40, 'sans_adieu', 'Sans adieu', 'L’un est parti trop tôt, fâché, sans qu’on se soit réconciliés. L’autre a passé le reste de sa vie à finir la dispute tout seul.'],
    [jeuneMort !== undefined && c.lien.axes[autre(jeuneMort)].peur_de_perdre >= 60, 'ce_qui_manque', 'Ce qui manque', 'L’un est tombé jeune. L’autre a vécu avec la place vide à côté de lui, en mission, à table, partout.'],
    [jeuneMort !== undefined && c.lien.promesses.some((p) => p.etat !== 'rompue'), 'celui_qui_reste', 'Celui qui reste', 'L’un est parti trop tôt. L’autre a tenu la promesse, pour deux.'],
    [jeuneMort !== undefined && Math.min(a.rivalite, b.rivalite) >= 40, 'rival_perdu', 'Le rival perdu', 'L’un est tombé avant qu’on sache lequel des deux était le meilleur. L’autre ne l’a jamais su, et s’est battu toute sa vie contre un fantôme.'],
    [jeuneMort !== undefined, 'trop_tot', 'Trop tôt', 'Une histoire coupée au milieu. Ce qu’elle aurait pu devenir, personne ne le saura ; l’autre l’imagine encore.'],
    [c.morts.includes('spectateur') && ([0, 1] as IdJoueur[]).some((j) => morts[j] === undefined && age(c, j) >= 45), 'temoin', 'Le témoin', 'L’un est mort, et a regardé l’autre vivre jusqu’au bout. On dit que les morts ne voient rien. Celui-là a tout vu.'],
    [s.duelCrepuscule && Math.min(a.rivalite, b.rivalite) >= 60, 'duel_crepuscule', 'Le duel au crépuscule', 'Un dernier duel, à plus de quarante-cinq ans, sur un toit qui craquait. Personne n’a gagné. C’était exactement ce qu’il fallait.'],
    [Math.min(a.rivalite, b.rivalite) >= 60 && Math.max(a.ressentiment, b.ressentiment) < 50, 'rival_eternel', 'Le rival éternel', 'Toute une vie à vous dépasser, sans jamais devenir ennemis.'],
    [Math.max(a.ressentiment, b.ressentiment) >= 50 || c.lien.promesses.some((p) => p.etat === 'rompue'), 'chemins_separes', 'Les chemins séparés', 'Vous avez choisi des vies différentes, et vous ne vous êtes jamais vraiment réconciliés.'],
    [c.creations[0].village !== c.creations[1].village && c.lien.promesses.some((p) => p.etat === 'tenue'), 'deux_chemins', 'Deux chemins, une promesse', 'Deux villages, deux vies, et une promesse d’enfance que vous avez tenue tous les deux.'],
    [c.joueurs.every((x) => ageA(x) >= 45) && Math.min(a.confiance, b.confiance) >= 50, 'deux_maitres', 'Les deux maîtres', 'Vous êtes devenus des légendes, et vous avez transmis ce que vous saviez à ceux qui venaient après.'],
    [c.lien.type === 'freres', 'freres', `Les enfants de ${R.villages[c.creations[0].village]?.nom ?? 'leur village'}`, 'Deux enfants d’une même maison, qui ont protégé leur village et sont devenus des figures dont on parle encore.'],
  ];
  const f = fins.find((x) => x[0]);
  return f ? { id: f[1], titre: f[2], texte: f[3] } : { id: 'deux_vies', titre: 'Deux vies', texte: 'Deux vies qui se sont croisées, éloignées, retrouvées. Ni légende, ni tragédie : une histoire.' };
}

/**
 * Un fait que je connais seul, écrit pour moi (« Tu as tué… »), devient un aveu à l'autre (« j'ai tué… »).
 * « L'autre », c'est désormais celui à qui je parle.
 */
const MOTS_AVEU: [string, string][] = [
  ['Tu as été', 'j’ai été'],
  ['Tu es', 'j’étais'],
  ['Tu portes', 'je portais'],
  ['Tu sais', 'je savais'],
  ['Tu aurais', 'j’aurais'],
  ['Tu as', 'j’ai'],
  ['Tu l’as', 'je l’ai'],
  ['tu l’as', 'je l’ai'],
  ['toi', 'moi'],
  ['te', 'me'],
  ['tu as', 'j’ai'],
  ['t’a', 'm’a'],
  ['Ton', 'mon'],
  ['ton', 'mon'],
  ['ta', 'ma'],
  ['tes', 'mes'],
  ['l’autre', 'toi'],
  ['Tu', 'je'],
  ['tu', 'je'],
];

export function aveu(texte: string): string {
  let t = texte.replace(/\.$/, '');
  // Des mots entiers seulement (les lettres accentuées comptent comme des lettres).
  for (const [de, vers] of MOTS_AVEU) t = t.replace(new RegExp(`(?<![\\p{L}’])${de}(?![\\p{L}])`, 'gu'), vers);
  // Une majuscule après chaque point, sauf au tout début (l'aveu suit les deux-points).
  t = t.replace(/([.!?] )(\p{Ll})/gu, (_, a: string, b: string) => a + b.toUpperCase());
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/** Ce que l'un retient de l'autre : son souvenir le plus lourd, et ce qu'il a su sans jamais le dire. */
function epilogue(c: Campagne, j: IdJoueur): string {
  const o = autre(j);
  const nom = c.creations[o].prenom;
  const souvenir = c.lien.souvenirs.filter((s) => s.connuDe.includes(j)).sort((x, y) => y.poids - x.poids || y.jour - x.jour)[0];
  const secrets = c.faits.filter((f) => f.connus.includes(j) && !f.connus.includes(o));
  const a = c.lien.axes[j];
  const ton = a.confiance >= 60 ? `J’ai fait confiance à ${nom} depuis que nous étions enfants.` : a.ressentiment >= 40 ? `Je n’ai jamais pardonné tout à fait à ${nom}.` : `${nom} a été là, presque toujours. C’est plus que la plupart des gens ne peuvent dire.`;
  const morceaux = [ton];
  if (souvenir) morceaux.push(`Ce que je garde : ${souvenir.texte.replace(/\.$/, '').charAt(0).toLowerCase()}${souvenir.texte.replace(/\.$/, '').slice(1)}.`);
  if (secrets.length) morceaux.push(`Ce que je ne t’ai jamais dit : ${secrets.map((f) => aveu(f.texte)).join(' ; ')}.`);
  return texteCommun(c, morceaux.join(' '), j, j);
}

/** La fin de la campagne, quand les deux vies sont finies : le titre, les deux voix, la chronologie, la note du lien. */
export function conclureCampagne(c: Campagne): FinCampagne {
  const f = choisirFin(c);
  const chronologie = [
    ...[...new Set([...c.lien.souvenirs].sort((x, y) => y.poids - x.poids).map((s) => s.texte))].slice(0, 6),
    ...[...new Map(c.lien.promesses.map((p) => [p.texte, p])).values()].map((p) => `Promesse ${p.etat === 'tenue' ? 'tenue' : p.etat === 'rompue' ? 'rompue' : 'restée en suspens'} : ${p.texte}`),
    `Duels : ${c.creations[0].prenom} ${c.lien.duels[0]}, ${c.creations[1].prenom} ${c.lien.duels[1]}.`,
    ...titres(c).map((t) => `Titre : ${t.nom}.`),
  ];
  const [a, b] = c.lien.axes;
  const lien = Math.round((c.lien.accord + (a.confiance + b.confiance) / 2 + (a.loyaute + b.loyaute) / 2 - (a.ressentiment + b.ressentiment) / 2) / 2);
  const notes = c.joueurs.map((s) => noteFinale(s).points);
  return {
    ...f,
    epilogues: [epilogue(c, 0), epilogue(c, 1)],
    chronologie,
    noteLien: Math.max(0, Math.min(100, lien)) + Math.round((notes[0] + notes[1]) / 10),
  };
}

export { jourMonde };
