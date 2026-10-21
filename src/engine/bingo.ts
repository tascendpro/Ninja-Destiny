// Le Bingo Book : les fiches visibles selon ce que l'histoire a révélé, et la tienne, quand ton nom est devenu assez connu.

import type { Condition, FicheBingo, GameState } from './types';
import { R } from './registre';
import { evaluer } from './conditions';
import { age } from './calendrier';
import { valeurJeton } from './texte';

export interface VueFiche extends Omit<FicheBingo, 'si' | 'notes'> {
  notes: string[];
}

export interface FicheJoueur {
  nom: string;
  surnom: string;
  village: string;
  rang: 'S' | 'A' | 'B' | 'C';
  /** Recherché·e (prime) ou inscrit·e parmi les grands ninjas. */
  liste: 'recherches' | 'legendes';
  prime: number;
  exploits: string[];
  /** Les crimes comptés, pour la fiche des hors-la-loi (« Convois pillés : 4 »). */
  crimes: string[];
  techniques: string[];
  consigne: string;
}

/** Ce qui fait entrer un nom dans le livre, et la ligne qu'on y lit. */
const EXPLOITS: { si: Condition; texte: string; poids: number }[] = [
  { si: { drapeau: 'akatsuki_membre' }, texte: 'Porte le manteau de l’Akatsuki.', poids: 40 },
  { si: { drapeau: 'akatsuki_traque_vaincue' }, texte: 'A vaincu deux membres de l’Akatsuki venus le traquer.', poids: 35 },
  { si: { drapeau: 'pain_defie' }, texte: 'A défié le chef de l’Akatsuki et survécu.', poids: 40 },
  { si: { drapeau: 'c3_as_vaincu' }, texte: 'A abattu le Faucheur en duel, sur un pont suspendu.', poids: 20 },
  { si: { drapeau: 'traitre_arrete' }, texte: 'A démasqué et arrêté un traître du Conseil.', poids: 15 },
  { si: { drapeau: 'quartier_sauve' }, texte: 'A repoussé seul·e un commando de l’Ancre noire, la nuit où il attaquait les familles.', poids: 20 },
  { si: { drapeau: 'marque_maudite' }, texte: 'Porte la marque maudite d’Orochimaru.', poids: 15 },
  { si: { drapeau: 'eleve_orochimaru' }, texte: 'Élève d’Orochimaru, réfugié·e dans son repaire.', poids: 20 },
  { si: { drapeau: 'maitre_jiraiya' }, texte: 'Formé·e par Jiraiya au mont Myōboku.', poids: 15 },
  { si: { drapeau: 'maitre_tsunade' }, texte: 'Formé·e par Tsunade.', poids: 15 },
  { si: { possedeArmeLegendaire: true }, texte: 'Porte une lame légendaire.', poids: 15 },
  { si: { drapeau: 'jinchuriki_livre' }, texte: 'A livré un jinchūriki à l’Akatsuki.', poids: 25 },
  { si: { drapeau: 'enfant_ennemi_sauve' }, texte: 'A sauvé un enfant ennemi dans un hôpital de campagne.', poids: 5 },
  { si: { drapeau: 'ennemis_acheves', min: 3 }, texte: 'A achevé de nombreux ennemis vaincus.', poids: 15 },
  { si: { drapeau: 'ennemis_epargnes', min: 3 }, texte: 'Épargne ses ennemis vaincus. Certains lui doivent la vie.', poids: 8 },
  { si: { drapeau: 'evade' }, texte: 'S’est évadé·e de captivité.', poids: 8 },
  { si: { drapeau: 'servante_tuee' }, texte: 'Soupçonné·e du meurtre d’une servante dans un village voisin.', poids: 8 },
  { si: { drapeau: 'ministre_tue_devant_enfant' }, texte: 'Soupçonné·e de l’assassinat d’un ministre du daimyō.', poids: 15 },
  { si: { rang: 'kage' }, texte: 'Porte le chapeau du Kage.', poids: 50 },
  { si: { rangMin: 'jonin' }, texte: 'Jōnin.', poids: 10 },
  { si: { statut: 'deserteur' }, texte: 'Déserteur·e : son village a rayé son nom.', poids: 15 },
  { si: { drapeau: 'rival_tue' }, texte: 'A tué un camarade de son propre village.', poids: 15 },
  { si: { drapeau: 'tournoi_sang' }, texte: 'A frappé à mort un adversaire à terre, pendant l’examen chūnin.', poids: 10 },
  { si: { drapeau: 'vendetta', egal: 'ouverte' }, texte: 'Une famille de son village a juré sa mort.', poids: 8 },
  { si: { drapeau: 'chef_bande' }, texte: 'Commande la bande de la Pie, sur la route du col.', poids: 15 },
  { si: { drapeau: 'seigneur_routes' }, texte: 'Tient les routes du sel : les caravanes paient tribut ou ne passent pas.', poids: 25 },
  { si: { drapeau: 'allegeance' }, texte: 'A vendu ses services à un village étranger.', poids: 15 },
];

/** Les crimes d'un hors-la-loi : chacun compte, et chacun alourdit la prime. */
const CRIMES: { drapeau: string; libelle: (n: number) => string; poids: number; prime: number }[] = [
  { drapeau: 'crime_convois', libelle: (n) => `Convois pillés : ${n}`, poids: 4, prime: 600 },
  { drapeau: 'crime_rackets', libelle: (n) => `Bourgs rançonnés : ${n}`, poids: 2, prime: 250 },
  { drapeau: 'crime_rancons', libelle: (n) => `Enlèvements contre rançon : ${n}`, poids: 5, prime: 900 },
  { drapeau: 'crime_meurtres', libelle: (n) => `Meurtres : ${n}`, poids: 6, prime: 1200 },
  { drapeau: 'crime_chasseurs', libelle: (n) => `Chasseurs de primes abattus : ${n}`, poids: 5, prime: 1000 },
  { drapeau: 'crime_raid', libelle: () => 'A attaqué son ancien village', poids: 40, prime: 15000 },
  { drapeau: 'crime_kage', libelle: () => 'A levé la main sur le Kage', poids: 50, prime: 30000 },
];

function nCrime(s: GameState, d: string): number {
  const v = s.drapeaux[d];
  return typeof v === 'number' ? v : v ? 1 : 0;
}

/** Ce que la fiche d'un hors-la-loi énumère, et ce que ça ajoute au livre et à la prime. */
export function crimes(s: GameState): { lignes: string[]; poids: number; prime: number } {
  let poids = 0;
  let prime = 0;
  const lignes: string[] = [];
  for (const c of CRIMES) {
    const n = nCrime(s, c.drapeau);
    if (!n) continue;
    lignes.push(c.libelle(n));
    poids += c.poids * n;
    prime += c.prime * n;
  }
  return { lignes, poids, prime };
}

/** Les natures et les grands pouvoirs donnent les surnoms ; le premier qui correspond l'emporte. */
const SURNOMS: { si: Condition; surnom: string }[] = [
  { si: { drapeau: 'akatsuki_membre' }, surnom: 'Nuage rouge' },
  { si: { drapeau: 'crime_kage' }, surnom: 'Celui qui a frappé le Kage' },
  { si: { drapeau: 'seigneur_routes' }, surnom: 'Le seigneur des routes' },
  { si: { drapeau: 'chef_bande' }, surnom: 'Le chef de la Pie' },
  { si: { drapeau: 'crime_meurtres', min: 5 }, surnom: 'Le boucher du col' },
  { si: { maitrise: 'susanoo', palierMin: 1 }, surnom: 'Le géant aux yeux rouges' },
  { si: { drapeau: 'marque_maudite' }, surnom: 'L’enfant du serpent' },
  { si: { maitrise: 'mode_ermite', palierMin: 1 }, surnom: 'L’ermite' },
  { si: { maitrise: 'byakugo', palierMin: 1 }, surnom: 'Celui qui ne tombe pas' },
  { si: { maitrise: 'biju_manteau', palierMin: 1 }, surnom: 'La bête' },
  { si: { drapeau: 'c3_as_vaincu' }, surnom: 'Le tueur du Faucheur' },
  { si: { element: 'katon' }, surnom: 'La flamme' },
  { si: { element: 'suiton' }, surnom: 'La marée' },
  { si: { element: 'fuuton' }, surnom: 'La lame du vent' },
  { si: { element: 'raiton' }, surnom: 'L’éclair' },
  { si: { element: 'doton' }, surnom: 'Le roc' },
];

function score(s: GameState): number {
  const soc = s.social;
  return EXPLOITS.filter((e) => evaluer(e.si, s)).reduce((n, e) => n + e.poids, 0) + crimes(s).poids + Math.max(soc.reputation, soc.reputationOmbre) / 2;
}

/** Ton nom entre dans le livre quand ce que tu as fait, ou ce qu'on dit de toi, a assez de poids. */
export function ficheJoueur(s: GameState): FicheJoueur | undefined {
  const horsLaLoi = !!s.drapeaux['hors_la_loi'];
  if (age(s) < (horsLaLoi ? 14 : 16)) return undefined;
  const sc = score(s);
  if (sc < 30) return undefined;
  const village = R.villages[s.creation.village];
  const recherche = horsLaLoi || s.statut === 'deserteur' || s.statut === 'exile' || !!s.drapeaux['akatsuki_membre'] || s.social.reputationOmbre > s.social.reputation + 10;
  const cr = crimes(s);
  const rang = sc >= 90 ? 'S' : sc >= 60 ? 'A' : sc >= 40 ? 'B' : 'C';
  const surnom = SURNOMS.find((x) => evaluer(x.si, s))?.surnom ?? 'L’inconnu·e';
  const techniques = Object.values(s.maitrises)
    .filter((m) => R.maitrises[m.id]?.technique?.offensive && m.tier >= 1)
    .sort((a, b) => b.tier - a.tier || (R.maitrises[b.id].technique!.puissance - R.maitrises[a.id].technique!.puissance))
    .slice(0, 4)
    .map((m) => R.maitrises[m.id].nom);
  return {
    nom: [s.creation.prenom, valeurJeton(s, 'nom')].filter(Boolean).join(' '),
    surnom: `${surnom} de ${village?.nom ?? 'nulle part'}`,
    village: `${village?.nom ?? '?'}${horsLaLoi ? ' (hors-la-loi)' : recherche ? ' (déserteur·e)' : ''}`,
    rang,
    liste: recherche ? 'recherches' : 'legendes',
    prime: recherche ? Math.round((sc * 250 + s.social.reputationOmbre * 100 + cr.prime) / 500) * 500 : 0,
    exploits: EXPLOITS.filter((e) => evaluer(e.si, s)).map((e) => e.texte),
    crimes: cr.lignes,
    techniques,
    consigne: rang === 'S' ? (recherche ? 'Fuir à vue.' : 'Ne pas engager sans ordre du Kage.') : rang === 'A' ? 'Ne pas engager seul.' : 'Prudence.',
  };
}

/** Les fiches du livre : celles que l'histoire a révélées, et le nombre de celles qui restent scellées. */
export function vueBingo(s: GameState): { recherches: VueFiche[]; legendes: VueFiche[]; scellees: number; toi?: FicheJoueur } {
  const visibles = R.contenu.bingo.filter((f) => !f.si || evaluer(f.si, s));
  const vue = (f: FicheBingo): VueFiche => {
    const { si: _si, notes, ...reste } = f;
    return { ...reste, notes: (notes ?? []).filter((n) => evaluer(n.si, s)).map((n) => n.texte) };
  };
  return {
    recherches: visibles.filter((f) => f.liste === 'recherches').map(vue),
    legendes: visibles.filter((f) => f.liste === 'legendes').map(vue),
    scellees: R.contenu.bingo.length - visibles.length,
    toi: ficheJoueur(s),
  };
}
