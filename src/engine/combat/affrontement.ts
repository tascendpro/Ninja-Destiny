// L'Affrontement Racine : ouverture, boucle de manche, conclusion, vue pour l'interface.
// Un seul moteur : même état, même hasard, même rejeu que le reste du jeu (§0.3.3).

import type { Changement, ChoiceDef, EventDef, GameState, Issue, Outcome } from '../types';
import { R } from '../registre';
import { alea } from '../rng';
import { age } from '../calendrier';
import { Ctx, clamp, defPnj, resoudrePnj } from '../etat';
import { interpoler, resoudreTexte } from '../texte';
import { appliquerEffets } from '../effets';
import { applyCombatExperience } from '../maitrise';
import { noterMerite } from '../progression';
import { CHANCE_MORT } from '../epreuves';
import type { ActionCombat, AdversaireDef, AffrontementDef, EtatAffrontement, FinCombat, IntentionAdv, RegistreAdversaire } from './types';
import { CONTEXTES, LIBELLE_NIVEAU, bonusRang, fourchettePlafond, indexNiveau, niveauJoueur } from './contextes';
import { adversaireDef, niveauAdversaire, nomAdversaire, registreDe, statsAdversaire, techniquesAdversaire, temperamentCourant, tirerIntention } from './adversaire';
import { TAIJUTSU, ACTIONS_FIXES, ARME, armeEnMain, familles, resoudre, validerAction } from './resolution';
import { CONSOMMABLE } from '../consommables';
import { chancePermutation } from '../epreuves';
import { idFamille } from '../armes';
import type { ResultatManche, VueFamille } from './resolution';
import { choisirReplique, choisirVariante, noterReplique } from './selection';
import { texteRepetition } from './repetition';
import { terrainCourant, texteImpact, texteImpactJoueur, texteSombre, texteTechniqueTouche, tirageTexte } from './impacts';
import { APRES_COMBAT, PORTEE_ESCOUADE } from '../../content/combat/impacts';
import { porteeTechnique } from '../epreuves';
import type { FaitsManche } from './selection';
import { affrontementGenerique, identiteGeneree } from './generique';
import { ANNONCES_BETE, COUPS_BETE } from '../../content/combat/generiques';
import { MORTS_AU_COMBAT } from '../../content/combat/morts';
import { NIVEAUX } from './types';

/** Le combat d'un choix : sa fiche s'il en a une, sinon un combat tiré de son épreuve. Tous les combats passent par ici. */
export function affrontementPour(evenementId: string, choixId: string): AffrontementDef | undefined {
  return R.contenu.racine.affrontements[`${evenementId}/${choixId}`] ?? affrontementGenerique(evenementId, choixId);
}

/** Le genre de l'adversaire, pour accorder les textes ({il}, {Il}, {lui}, {e}). */
function genreAdv(s: GameState, d: AdversaireDef): 'm' | 'f' {
  if (d.pnj) return defPnj(s, resoudrePnj(s, d.pnj))?.genre ?? 'm';
  if (d.nomGenere) return identiteGeneree(s, d).genre;
  return d.genre ?? 'm';
}

export function accorderAdv(texte: string, genre: 'm' | 'f'): string {
  const f = genre === 'f';
  return texte
    .replace(/\{Il\}/g, f ? 'Elle' : 'Il')
    .replace(/\{il\}/g, f ? 'elle' : 'il')
    .replace(/\{Lui\}/g, f ? 'Elle' : 'Lui')
    .replace(/\{lui\}/g, f ? 'elle' : 'lui')
    .replace(/\{e\}/g, f ? 'e' : '');
}

function texteAdv(s: GameState, sc: EtatAffrontement, d: AdversaireDef, t: string): string {
  return accorderAdv(avecNom(t, sc.nomAdversaire), genreAdv(s, d));
}

/** Ce que l'adversaire lance cette manche, nommé et raconté : sa technique, ou sa grande technique annoncée. */
function techniqueAdverseRacontee(s: GameState, sc: EtatAffrontement, d: AdversaireDef): string {
  // Le lanceur est nommé : sans lui, on confondrait sa technique avec la tienne quand ce sont les mêmes.
  if (sc.intention === 'majeure' && d.majeure) return avecNom(`{nom} lance sa grande technique : ${d.majeure.nom} ! `, sc.nomAdversaire);
  if (sc.intention !== 'technique' || !sc.techniqueAdv) return '';
  const t = techniquesAdversaire(s, d).find((x) => x.id === sc.techniqueAdv);
  if (!t) return '';
  // Les textes anciens disaient « il » en dur : on les accorde à l'adversaire.
  const texte = (d.escouade ? t.escouade : t.duel).replace(/\bIl\b/g, '{Il}').replace(/\bil\b/g, '{il}').replace(/\blui\b/g, '{lui}');
  return `${avecNom('{nom} répond', sc.nomAdversaire)} : ${t.nom} ! ${texte} `;
}

/** Place le nom de l'adversaire : « Le chien enragé » en début de phrase, « le chien enragé » au milieu. */
export function avecNom(t: string, nom: string): string {
  return t.replace(/\{nom\}/g, (_m, i: number) => {
    const avant = t.slice(0, i).trimEnd();
    const debut = avant === '' || /[.!?…:«\n]$/.test(avant);
    return !debut && /^(Le|La|Les|L’)\s?/.test(nom) ? nom.charAt(0).toLowerCase() + nom.slice(1) : nom;
  });
}

/** Endurance de départ du joueur (§5.1). */
export function enduranceJoueur(s: GameState): number {
  const n = niveauJoueur(s);
  const malus = s.blessures.reduce((a, b) => a + (b.gravite >= 3 ? 0.3 : b.gravite === 2 ? 0.15 : 0.05), 0);
  return Math.max(10, Math.round((30 + 0.5 * s.jauges.sante + 0.2 * s.attributs.force + bonusRang(n)) * (1 - Math.min(0.5, malus))));
}

function nouveauRegistre(id: string): RegistreAdversaire {
  return { id, rencontres: 0, victoires: 0, defaites: 0, nuls: 0, techniquesVuesDuJoueur: {}, habitudesDuJoueur: {}, techniquesVuesParJoueur: [], contreMesures: [], vivant: true };
}

/** Ouvre un affrontement à partir d'un choix de scène. Tirages : plafond, réplique d'entrée, puis l'ouverture de la manche 1. */
export function ouvrirAffrontement(s: GameState, ev: EventDef, ch: ChoiceDef): void {
  const af = affrontementPour(ev.id, ch.id)!;
  const d = adversaireDef(af.adversaire);
  const nAdv = niveauAdversaire(s, d);
  const nJ = niveauJoueur(s);
  const st = statsAdversaire(s, d);
  const [min, max] = fourchettePlafond(nJ, nAdv);
  const plafond = min + Math.min(max - min, Math.floor(alea(s) * (max - min + 1)));
  const endJ = enduranceJoueur(s);
  const registreId = registreDe(s, d);
  const reg = s.registresCombat[registreId];
  const sc: EtatAffrontement = {
    type: 'affrontement',
    evenementId: ev.id,
    choixId: ch.id,
    contexte: af.contexte,
    interdit: af.interdit,
    adversaireId: d.id,
    registreId,
    nomAdversaire: nomAdversaire(s, d),
    niveauAdv: nAdv,
    niveauJoueur: nJ,
    temperament: d.temperament,
    manche: 1,
    plafond,
    plafondVisible: CONTEXTES[af.contexte].plafondAnnonce,
    joueur: { endurance: endJ, enduranceMax: endJ, garde: 'ouverte', sonne: 0, vide: 0 },
    adv: { endurance: st.endurance, enduranceMax: st.endurance, garde: 'ouverte', sonne: 0, vide: 0, chakra: st.chakra, substitutions: st.substitutions },
    elan: 0,
    intention: 'attaque',
    annonce: { texte: '', fiabilite: 'vague' },
    lecture: { niveau: false, nature: false, faiblesse: false, intentions: {}, techniquesVues: [...(reg?.techniquesVuesParJoueur ?? [])], habitudes: [] },
    vuesCeCombat: {},
    actionsJoueur: [],
    journal: [],
    repliquesUtilisees: {},
    gardesConsecutives: 0,
    ouverture: 0,
    touchesSubiesAdv: 0,
    techniquesUtilisees: [],
    bilan: { reussites: {}, echecs: {} },
  };
  s.scene = sc;
  // Une réplique d'entrée, ou de revanche si vous vous êtes déjà affrontés.
  const r = alea(s);
  const rep = choisirReplique(s, sc, d.repliques, reg && reg.rencontres > 0 ? 'revanche' : 'entree', {}, r) ?? choisirReplique(s, sc, d.repliques, 'entree', {}, r);
  if (rep) noterReplique(s, sc, rep);
  sc.journal.push({ manche: 0, annonce: '', action: '', execution: '', reponse: '', impact: '', lecture: '', repliques: rep ? [interpoler(texteAdv(s, sc, d, rep.texte), s)] : [], technique: `plafond=${plafond}` });
  ouvrirManche(s, sc, d);
}

/** Ouverture d'une manche : intention adverse, technique, fiabilité, texte de l'annonce (quatre tirages, toujours). */
function ouvrirManche(s: GameState, sc: EtatAffrontement, d: AdversaireDef): void {
  const [rInt, rTech, rFiab, rTexte] = [alea(s), alea(s), alea(s), alea(s)];
  sc.temperament = temperamentCourant(sc, d);
  sc.intention = tirerIntention(s, sc, d, rInt);
  const techs = techniquesAdversaire(s, d);
  sc.techniqueAdv = sc.intention === 'technique' && techs.length ? techs[Math.min(techs.length - 1, Math.floor(rTech * techs.length))].id : undefined;
  if (sc.intention === 'technique' || sc.intention === 'majeure') sc.adv.chakra = Math.max(0, sc.adv.chakra - (sc.intention === 'majeure' ? 30 : 10));
  sc.provoque = sc.intention === 'attaque' ? sc.provoque : false;
  const st = statsAdversaire(s, d);
  // Fiabilité (§7.2) : la perception du joueur contre la discrétion de l'adversaire ; les yeux du clan lisent tout.
  const yeux = !!(s.maitrises['sharingan']?.awakened || s.maitrises['byakugan']?.awakened);
  const habitudeConnue = d.habitudes.some((h) => sc.lecture.habitudes.includes(h.id) && h.intention === sc.intention);
  const p = yeux || habitudeConnue ? 1 : clamp(0.5 + (s.attributs.perception - st.discretion) / 100 + (sc.lecture.niveau ? 0.1 : 0), 0.2, 0.95);
  const letal = CONTEXTES[sc.contexte].letal;
  const pct = sc.joueur.endurance / sc.joueur.enduranceMax;
  // Il cherche à en finir : sa grande technique, une préparation, toi à bout, ou toi qui perds à l'avant-dernière manche.
  const perdAuxPoints = sc.manche >= sc.plafond - 1 && pct < sc.adv.endurance / sc.adv.enduranceMax;
  const mortelle = letal && (sc.intention === 'majeure' || sc.intention === 'preparer' || pct < 0.4 || perdAuxPoints);
  let fiab: EtatAffrontement['annonce']['fiabilite'] = rFiab < p ? 'fiable' : d.feinte && rFiab > 0.85 ? 'trompeur' : 'vague';
  if (mortelle && fiab === 'trompeur') fiab = 'vague';
  const montree: IntentionAdv = fiab === 'trompeur' ? (sc.intention === 'attaque' ? 'defense' : 'attaque') : sc.intention;
  // Une bête se lit à ses muscles et à sa gueule, pas à ses mains.
  const banque = (d.type === 'bete' ? ANNONCES_BETE : R.contenu.racine.annonces)[montree];
  let texte = choisirVariante(fiab === 'fiable' ? banque.fiable : banque.vague, rTexte);
  if (sc.intention === 'majeure' && d.majeure && fiab === 'fiable') texte = d.majeure.annonce;
  if (fiab === 'fiable' && sc.techniqueAdv && sc.lecture.techniquesVues.includes(sc.techniqueAdv)) {
    const t = techs.find((x) => x.id === sc.techniqueAdv);
    if (t) texte += ` Tu reconnais ce geste : ${t.nom}.`;
  }
  if (mortelle && sc.avertissementManche === undefined) {
    sc.avertissementManche = sc.manche;
    texte += ' Son regard change : {il} ne cherche plus à te blesser. {Il} cherche à en finir.';
  }
  sc.annonce = { texte: texteAdv(s, sc, d, texte), fiabilite: fiab, mortelle };
}

export interface ConclusionAffrontement {
  texte: string;
  libelle: string;
  suite?: string;
  issue: Issue;
  changements: Changement[];
  bilan?: BilanCombat;
}

export interface BilanCombat {
  marche?: string;
  echoue?: string;
  appris: string[];
  ilAppris: string[];
  progression: string[];
  travailler?: string;
}

/** Joue une manche : valide (sans rien modifier si l'action est refusée), tire, résout, puis conclut si c'est fini. */
export function jouerAffrontement(s: GameState, a: ActionCombat, ctx: Ctx): ConclusionAffrontement | undefined {
  if (s.scene.type !== 'affrontement') throw new Error('Aucun affrontement en cours.');
  const sc = s.scene;
  const d = adversaireDef(sc.adversaireId);
  validerAction(s, sc, a);
  const r = { exec: alea(s), reponse: alea(s), execAdv: alea(s), variation: alea(s), decisif: alea(s), texte: alea(s), replique: alea(s) };
  const annonce = sc.annonce.texte;
  const res = resoudre(s, sc, d, a, r);
  const entree = composerManche(s, sc, d, a, res, annonce, r.texte, r.replique);
  sc.journal.push(entree);
  sc.actionsJoueur.push(a.choix);
  // Une esquive ou une permutation réussie à la dernière manche ouvre sa garde : on ne finit pas sur une défense,
  // il reste une manche pour contre-attaquer (une seule fois par combat).
  const defenseReussie = a.famille === 'defense' && a.choix !== 'garde' && res.reussi;
  if (sc.manche >= sc.plafond && defenseReussie && !sc.prolonge && sc.joueur.endurance > 0 && sc.adv.endurance > 0 && !res.fin) {
    sc.prolonge = true;
    sc.plafond += 1;
  }
  const fin: FinCombat | undefined =
    sc.joueur.endurance <= 0 ? 'defaite' : sc.adv.endurance <= 0 ? 'victoire' : res.fin ? res.fin : sc.manche >= sc.plafond ? departage(sc) : undefined;
  if (fin) return conclure(s, sc, d, fin, ctx);
  sc.manche += 1;
  ouvrirManche(s, sc, d);
  return undefined;
}

/** Au plafond : le pourcentage d'endurance, puis l'élan, puis la dernière manche gagnée (§6.4). */
function departage(sc: EtatAffrontement): FinCombat {
  const pj = sc.joueur.endurance / sc.joueur.enduranceMax;
  const pa = sc.adv.endurance / sc.adv.enduranceMax;
  if (Math.abs(pj - pa) > 0.02) return pj > pa ? 'departage_gagne' : 'departage_perdu';
  if (sc.elan !== 0) return 'departage_gagne';
  // Personne n'a pris le dessus : c'est le contexte qui tranche, et ici il ne tranche pas.
  return 'departage_nul';
}

function nomAction(a: ActionCombat): string {
  if (TAIJUTSU[a.choix]) return TAIJUTSU[a.choix].nom;
  if (a.famille === 'arme' && ARME[a.choix]) return ARME[a.choix].nom;
  if (a.famille === 'objet' && CONSOMMABLE[a.choix]) return CONSOMMABLE[a.choix].nom;
  if (R.maitrises[a.choix]) return R.maitrises[a.choix].nom;
  for (const g of Object.values(ACTIONS_FIXES)) if (g[a.choix]) return g[a.choix].nom;
  return a.choix;
}

/** Les trois blocs du récit (exécution, réponse, impact), la phrase-cause et la réplique. */
function composerManche(s: GameState, sc: EtatAffrontement, d: AdversaireDef, a: ActionCombat, res: ResultatManche, annonce: string, rTexte: number, rRep: number): EntreeAffrontement {
  const recits = R.contenu.racine.recits;
  const tech = R.maitrises[a.choix];
  const genre = genreAdv(s, d);
  const vari = (cle: string) => accorderAdv(avecNom(choisirVariante(recits[cle] ?? recits[cle.split(':').slice(0, -1).join(':')] ?? [], rTexte).replace(/\{tech\}/g, tech?.nom ?? nomAction(a)), sc.nomAdversaire), genre);
  const nature = tech?.element;
  // Combien de fois cette action avait déjà servi dans ce combat (le compteur inclut déjà celle-ci).
  const offensive = a.famille === 'taijutsu' || a.famille === 'ninjutsu' || a.famille === 'arme';
  const deja = offensive ? Math.max(0, (sc.vuesCeCombat[a.choix] ?? 1) - 1) : 0;
  let execution = '';
  if (offensive) {
    const base = a.famille === 'ninjutsu' ? `Tu composes les signes : ${tech?.nom ?? nomAction(a)}.` : `${nomAction(a)}.`;
    execution = `${base} ${vari(`exec:${res.execution}${res.execution === 'ratee' ? `:${a.famille === 'arme' ? 'taijutsu' : a.famille}` : ''}`)}`.trim();
    // Relancée dans ce combat : le récit change (§11.3) ; seule une exécution ratée garde son propre récit.
    const rep = texteRepetition(a.choix, tech?.nom ?? nomAction(a), deja, sc.manche + deja);
    if (rep && res.execution !== 'ratee') execution = accorderAdv(rep.recit, genre);
  } else execution = `${nomAction(a)}.`;
  let impact = res.impact;
  // Taijutsu : on est au contact. Sinon, la distance de la manche d'avant.
  const distance = a.famille === 'taijutsu' || a.famille === 'arme' ? 'proche' : (sc.distance ?? 'loin');
  const porte = res.issue === 'touche' || res.issue === 'surprise' || res.issue === 'decisive';
  if (res.issue) {
    const cle = nature && recits[`${nature}:${res.issue}`] ? `${nature}:${res.issue}` : `${a.famille}:${res.issue}`;
    // Une technique qui touche se raconte d'abord par elle-même, de loin ou au contact ; le coup décisif garde son récit.
    const propre = tech && (res.issue === 'touche' || res.issue === 'surprise') ? texteTechniqueTouche(s, a.choix, distance, `${sc.manche}`) : '';
    impact += propre ? accorderAdv(propre, genre) : vari(recits[cle] ? cle : `offensive:${res.issue}`);
  } else impact += vari(`${a.famille}:${a.choix}:${res.reussi ? 'ok' : 'ko'}`);
  if (porte) {
    const lourd = res.issue === 'decisive' || res.issue === 'surprise' || deja >= 2 || res.inflige >= sc.adv.enduranceMax * 0.25;
    // Dans un combat où l'on peut tuer, la troisième fois, la technique finit ce qu'elle a commencé.
    if (tech && deja >= 2 && CONTEXTES[sc.contexte].letal) impact += ` ${accorderAdv(texteSombre(s, a.choix, `${sc.manche}`), genre)}`;
    impact += ` ${accorderAdv(texteImpact(s, d.escouade ? 'groupe' : lourd ? 'lourd' : 'leger', `${sc.manche}`), genre)}`;
    // Plusieurs ennemis : la zone les prend tous, le coup ciblé laisse les autres te contourner.
    if (d.escouade) {
      const zone = !!tech && porteeTechnique(a.choix) !== 'cible';
      const banque = zone ? PORTEE_ESCOUADE.zone : PORTEE_ESCOUADE.expose;
      impact += ` ${banque[Math.floor(tirageTexte(s, `escouade:${sc.manche}`) * banque.length)]}`;
    }
    sc.distance = lourd ? 'loin' : distance;
  } else if (a.famille === 'defense' || a.famille === 'fuite') sc.distance = 'loin';
  else if (sc.intention === 'attaque' || a.famille === 'taijutsu' || a.famille === 'arme') sc.distance = 'proche';
  if (res.inflige > 0) impact += avecNom(` (−${res.inflige} endurance pour {nom})`, sc.nomAdversaire);
  if (res.subi > 0) impact += ` ${d.type === 'bete' ? choisirVariante(COUPS_BETE, rTexte) : vari('adv:touche')} ${texteImpactJoueur(s, res.subi >= sc.joueur.enduranceMax * 0.2 ? 'lourd' : 'leger', `${sc.manche}`)} (−${res.subi} endurance)`;
  // Une réplique au plus par manche, selon ce qui vient de se passer.
  const faits: FaitsManche = { dejaVue: res.dejaVue, inedite: res.inedite, repetition: res.repetition, issue: res.issue };
  const pct = sc.adv.endurance / sc.adv.enduranceMax;
  const cats = [
    res.repliqueCategorie,
    res.issue === 'surprise' ? 'decouverte' : undefined,
    res.issue === 'predite' && (res.dejaVue || res.repetition) ? (res.dejaVue ? 'reconnaissance' : 'repetition') : undefined,
    res.issue === 'ratee' ? 'rate_joueur' : undefined,
    res.inflige >= sc.adv.enduranceMax * 0.25 ? 'blessure' : undefined,
    res.inflige > 0 && !sc.journal.some((j) => j.issue === 'touche' || j.issue === 'surprise') ? 'reussite_joueur' : undefined,
    pct < 0.25 && pct > 0 ? 'defaite_imminente' : undefined,
    sc.intention === 'preparer' ? 'preparation' : undefined,
  ].filter(Boolean) as string[];
  // Une technique relancée appelle d'abord une réaction de l'adversaire : la sienne s'il en a une, sinon une générique.
  if (deja >= 1) cats.splice(1, 0, 'repetition');
  const repliques: string[] = [];
  for (const c of cats) {
    const rep = choisirReplique(s, sc, d.repliques, c as never, { ...faits, repetition: faits.repetition || deja >= 1 }, rRep);
    if (rep) {
      noterReplique(s, sc, rep);
      repliques.push(interpoler(texteAdv(s, sc, d, rep.texte), s));
      break;
    }
    if (c === 'repetition') {
      const generique = texteRepetition(a.choix, tech?.nom ?? nomAction(a), deja, sc.manche + deja);
      if (generique) {
        repliques.push(generique.reaction);
        break;
      }
    }
  }
  return {
    manche: sc.manche,
    annonce,
    action: nomAction(a),
    execution,
    reponse: accorderAdv(`${techniqueAdverseRacontee(s, sc, d)}${res.reponse}`.trim(), genre),
    impact: impact.trim(),
    lecture: accorderAdv(res.cause, genre),
    repliques,
    issue: res.issue,
    inflige: res.inflige,
    subi: res.subi,
    technique: `intention=${sc.intention} exec=${res.execution} inflige=${res.inflige} subi=${res.subi} J=${sc.joueur.endurance}/${sc.joueur.enduranceMax} A=${sc.adv.endurance}/${sc.adv.enduranceMax} elan=${sc.elan}`,
  };
}
type EntreeAffrontement = EtatAffrontement['journal'][number];

/** L'issue du CheckDef d'origine qui correspond à une fin d'affrontement. */
function issuePour(fin: FinCombat, ch: ChoiceDef, rapide: boolean): Issue {
  const t = ch.test!;
  if (fin === 'victoire') return rapide && t.critique ? 'critique' : 'succes';
  if (fin === 'departage_gagne' || fin === 'reddition_adverse' || fin === 'fuite_adverse') return 'succes';
  if (fin === 'paix' || fin === 'departage_perdu' || fin === 'departage_nul') return t.partiel ? 'partiel' : fin === 'departage_perdu' ? 'echec' : 'succes';
  return 'echec';
}

function outcomePour(issue: Issue, ch: ChoiceDef): Outcome {
  const t = ch.test!;
  return issue === 'critique' ? t.critique! : issue === 'succes' ? t.succes : issue === 'partiel' ? t.partiel! : t.echec;
}

/** Les articles qui se contractent derrière une préposition : « les coups du chien », pas « de le chien ». */
function contracter(t: string): string {
  return t.replace(/(^|[\s’'(])de le /g, '$1du ').replace(/(^|[\s’'(])de les /g, '$1des ').replace(/(^|\s)à le /g, '$1au ').replace(/(^|\s)à les /g, '$1aux ');
}

/**
 * Comment l'adversaire t'a tué : l'Akatsuki à sa manière, une bête, le nombre ; sinon la technique qu'il lançait
 * (son élément décide : brûlé·e, noyé·e, foudroyé·e…), ou à défaut l'une des siennes, sa lame, ses poings.
 * Tirages de texte seulement : le RNG n'est pas consommé.
 */
function mortAuCombat(s: GameState, sc: EtatAffrontement, d: AdversaireDef): { texte: string; cause: string; precise: boolean } {
  const h = (cle: string) => tirageTexte(s, `mort:${sc.evenementId}:${cle}`);
  const techs = techniquesAdversaire(s, d);
  let cle: string;
  let tech: string | undefined;
  if (MORTS_AU_COMBAT[d.id]) cle = d.id;
  else if (d.type === 'bete') cle = 'bete';
  else if (d.escouade) cle = 'escouade';
  else if (sc.intention === 'majeure' && d.majeure) {
    cle = 'majeure';
    tech = d.majeure.nom;
  } else {
    const t =
      sc.intention === 'technique'
        ? techs.find((x) => x.id === sc.techniqueAdv)
        : techs.length && h('technique') < 0.5
          ? techs[Math.floor(h('laquelle') * techs.length)]
          : undefined;
    if (t) {
      cle = t.element && MORTS_AU_COMBAT[t.element] ? t.element : 'technique';
      tech = t.nom;
    } else cle = ['samourai', 'mercenaire', 'bandit'].includes(d.type ?? '') || h('arme') < 0.5 ? 'lame' : 'taijutsu';
  }
  return raconterMort(s, cle, tech, sc.nomAdversaire, genreAdv(s, d), h('texte'));
}

/** Une scène de mort de la banque, accordée à l'adversaire et à toi ; sa cause pour l'épitaphe. */
export function raconterMort(s: GameState, cle: string, tech: string | undefined, nom: string, genre: 'm' | 'f', tirage: number): { texte: string; cause: string; precise: boolean } {
  const banque = MORTS_AU_COMBAT[cle] ?? MORTS_AU_COMBAT.lame;
  const preparer = (x: string) => interpoler(contracter(accorderAdv(avecNom(x.replace(/\{tech\}/g, tech ?? ''), nom), genre)), s);
  return {
    texte: preparer(banque.textes[Math.floor(tirage * banque.textes.length)]),
    cause: preparer(banque.cause),
    // Une mort qui dit ce qui t'a tué (le feu, l'eau, l'Akatsuki) passe avant la cause générale de la scène.
    precise: cle !== 'lame' && cle !== 'taijutsu' && cle !== 'escouade',
  };
}

/** Conclusion : mort (contexte mortel, après avertissement), registre, relations, santé, expérience, bilan. */
function conclure(s: GameState, sc: EtatAffrontement, d: AdversaireDef, fin: FinCombat, ctx: Ctx): ConclusionAffrontement {
  const [rMort, rTexte, rRep] = [alea(s), alea(s), alea(s)];
  const ev = R.evenements[sc.evenementId];
  const ch = ev.choix.find((c) => c.id === sc.choixId)!;
  const af = affrontementPour(sc.evenementId, sc.choixId)!;
  const regle = CONTEXTES[sc.contexte];
  const genre = genreAdv(s, d);
  const rapide = fin === 'victoire' && sc.manche <= Math.ceil(sc.plafond / 2) && sc.joueur.endurance / sc.joueur.enduranceMax > 0.6;
  const issue = issuePour(fin, ch, rapide);
  const outcome = outcomePour(issue, ch);
  const conclusion = af.conclusions?.[fin];
  // La mort n'est jamais la conclusion par défaut : seulement en contexte mortel, après un avertissement donné plus tôt.
  // Perdre aux points contre quelqu'un qui veut ta mort peut tuer aussi, un peu moins souvent qu'une défaite à terre.
  const peutMourir = regle.letal && (fin === 'defaite' || fin === 'departage_perdu') && sc.avertissementManche !== undefined && sc.avertissementManche < sc.manche;
  let mort = peutMourir && rMort < (CHANCE_MORT[s.creation.difficulte] ?? 0.45) * (fin === 'defaite' ? 1 : 0.75);
  // Une permutation bien maîtrisée détourne parfois le coup mortel : une bûche le prend à ta place.
  if (mort && chancePermutation(s) > 0 && tirageTexte(s, `permutation:${sc.evenementId}`) < chancePermutation(s)) {
    mort = false;
    s.drapeaux['permutations_salvatrices'] = (Number(s.drapeaux['permutations_salvatrices']) || 0) + 1;
    ctx.changements.push({ t: 'info', message: 'Permutation ! Le coup qui devait te tuer frappe une bûche. Tu t’en sors, en sang.' });
  }

  // Registre de l'adversaire : ce qu'il a vu de toi, ce qui s'est passé.
  const reg = (s.registresCombat[sc.registreId] ??= nouveauRegistre(sc.registreId));
  reg.rencontres += 1;
  const gagneJoueur = ['victoire', 'departage_gagne', 'reddition_adverse', 'fuite_adverse'].includes(fin);
  const perdJoueur = ['defaite', 'departage_perdu', 'fuite'].includes(fin);
  // Paix et match nul : personne ne gagne (reg.nuls).
  if (gagneJoueur) reg.defaites += 1;
  else if (perdJoueur) reg.victoires += 1;
  else reg.nuls += 1;
  reg.derniereIssue = fin;
  reg.derniereRencontre = { age: age(s), chapitre: s.chapitre };
  for (const [k, n] of Object.entries(sc.vuesCeCombat)) reg.techniquesVuesDuJoueur[k] = (reg.techniquesVuesDuJoueur[k] ?? 0) + n;
  if (sc.actionsJoueur[0]) reg.habitudesDuJoueur[`ouverture:${sc.actionsJoueur[0]}`] = (reg.habitudesDuJoueur[`ouverture:${sc.actionsJoueur[0]}`] ?? 0) + 1;
  for (const t of sc.lecture.techniquesVues) if (!reg.techniquesVuesParJoueur.includes(t)) reg.techniquesVuesParJoueur.push(t);
  // Un récurrent battu travaille ce qui l'a battu (§13.2) : la nature de ta technique la plus efficace, ou ton geste favori.
  if (gagneJoueur && d.recurrent) {
    const meilleure = Object.entries(sc.bilan.reussites).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]?.[0];
    const el = meilleure ? R.maitrises[meilleure]?.element : undefined;
    const contre = el ? `nature:${el}` : meilleure ? `action:${meilleure}` : undefined;
    if (contre && !reg.contreMesures.includes(contre)) reg.contreMesures.push(contre);
  }

  // Relations, s'il est un personnage du jeu.
  const pnjId = d.pnj ? resoudrePnj(s, d.pnj) : undefined;
  const effetsRel = pnjId
    ? gagneJoueur
      ? { respect: 4, rivalite: 3, peur: fin === 'reddition_adverse' ? 4 : 0 }
      : fin === 'paix'
        ? { amitie: 4, hostilite: -2 }
        : fin === 'fuite'
          ? { respect: -2, rivalite: 1 }
          : { rivalite: 3 }
    : undefined;
  const effets = [...(conclusion?.effets ?? outcome.effets)];
  if (pnjId && effetsRel) effets.push({ relation: pnjId, delta: Object.fromEntries(Object.entries(effetsRel).filter(([, v]) => v)) });
  if (sc.provoque && pnjId) effets.push({ relation: pnjId, delta: { hostilite: 2 } });
  if (fin === 'fuite' && regle.coutFuite) effets.push({ stat: 'social.reputation', delta: -regle.coutFuite });
  if (!mort) appliquerEffets(s, effets, ctx);

  // Ce que le combat coûte à la santé : léger dans une bagarre, réel en mission.
  const perte = 1 - sc.joueur.endurance / sc.joueur.enduranceMax;
  const facteur = s.creation.difficulte === 'recit' ? 0.6 : s.creation.difficulte === 'legende' ? 1.3 : 1;
  const finale = mort ? mortAuCombat(s, sc, d) : undefined;
  if (mort && finale) {
    s.drapeaux['cause_mort'] = ch.test?.causeMort && !finale.precise ? interpoler(ch.test.causeMort, s) : finale.cause;
    s.drapeaux['mort_au_combat'] = true;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -s.jauges.sante });
    s.jauges.sante = 0;
  } else {
    const d0 = Math.round(perte * (regle.blessuresLegeres ? 10 : 28) * facteur);
    if (d0 > 0) {
      s.jauges.sante = clamp(s.jauges.sante - d0, regle.blessuresLegeres ? 1 : 0, 100);
      ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d0 });
    }
    if (!regle.blessuresLegeres && fin === 'defaite') appliquerEffets(s, [{ blessure: { id: `affrontement_${sc.evenementId}`, nom: 'Blessures d’un combat perdu', gravite: 2, jours: 25 } }], ctx);
  }
  const w = armeEnMain(s);
  const xp = [
    ...new Set([
      ...sc.techniquesUtilisees,
      ...(sc.actionsJoueur.some((x) => TAIJUTSU[x]) ? ['taijutsu'] : []),
      ...(sc.actionsJoueur.includes('permutation') ? ['kawarimi'] : []),
      ...(w && sc.actionsJoueur.some((x) => ARME[x]) ? [idFamille(w.famille)] : []),
    ]),
  ].filter((id) => s.maitrises[id]);
  applyCombatExperience(s, xp, ctx);
  if (gagneJoueur) noterMerite(s, 'combat');

  // Le récit de la fin, la dernière réplique.
  const recits = R.contenu.racine.recits;
  // Une scène qui a sa propre conclusion la raconte elle-même : le récit générique de la fin se tait.
  // La fin se raconte selon ce qu'il est : une bête qui s'enfuit n'est pas un ninja qui disparaît dans la fumée.
  // Un adversaire sans fiche : la scène raconte elle-même la fin ; une phrase générique la doublerait, et se répéterait de combat en combat.
  const generique = d.id.startsWith('gen:');
  // En combat mortel, une égalité ne se raconte pas comme dans une cour d'école ; et la mort se suffit à elle-même.
  const banqueFin = (regle.letal ? recits[`fin:${fin}:letal`] : undefined) ?? recits[`fin:${fin}`] ?? [];
  const texteFin = conclusion?.texte || generique || mort ? '' : accorderAdv(avecNom(choisirVariante(banqueFin, rTexte), sc.nomAdversaire), genre);
  const catFin = gagneJoueur ? 'defaite_adv' : perdJoueur ? 'victoire_adv' : 'paix';
  // Mort, on n'entend plus ses mots de vainqueur : la scène de mort parle pour {lui}.
  const rep = mort ? undefined : choisirReplique(s, sc, d.repliques, catFin, { issue: sc.journal[sc.journal.length - 1]?.issue }, rRep);
  if (rep) noterReplique(s, sc, rep);
  const replique = rep ? interpoler(texteAdv(s, sc, d, rep.texte), s) : '';
  // Ce qui reste quand le combat s'arrête : le lieu, et ce qu'on y laisse.
  const terrainFin = APRES_COMBAT[terrainCourant(s)];
  const bancAmbiance = gagneJoueur ? terrainFin.victoire : perdJoueur ? terrainFin.defaite : terrainFin.neutre;
  const ambiance = mort ? '' : bancAmbiance[Math.floor(tirageTexte(s, `apres:${sc.evenementId}`) * bancAmbiance.length)];
  const corps = finale
    ? finale.texte
    : resoudreTexte(conclusion?.texte ?? outcome.texte, s);
  // Un geste (une bête qui gronde) se raconte tel quel ; une parole se met entre guillemets.
  const repliqueTexte = !replique ? '' : replique.startsWith('~') ? replique.slice(1) : `« ${replique.replace(/^«\s*|\s*»$/g, '')} »`;
  const texte = [texteFin, repliqueTexte, ambiance, corps].filter(Boolean).join('\n\n');
  const noms = [...new Set(sc.techniquesUtilisees)].map((t) => R.maitrises[t].nom);
  const libelle = interpoler(ch.texte, s) + (noms.length ? ` — ${noms.join(', ')}` : '');
  return {
    texte,
    libelle,
    suite: mort ? undefined : (conclusion ? conclusion.suite : outcome.suite) ?? ch.suite,
    issue,
    changements: ctx.changements,
    bilan: sc.manche >= 2 ? bilanCombat(s, sc, d, xp) : undefined,
  };
}

/** La carte de bilan (§16.2) : ce qui a marché, ce qui a échoué, ce que chacun a appris, ce qu'il faut travailler. */
function bilanCombat(s: GameState, sc: EtatAffrontement, d: AdversaireDef, xp: string[]): BilanCombat {
  const genre = genreAdv(s, d);
  const meilleure = Object.entries(sc.bilan.reussites).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0];
  const pire = Object.entries(sc.bilan.echecs).sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))[0];
  const nom = (id: string) => TAIJUTSU[id]?.nom ?? R.maitrises[id]?.nom ?? Object.values(ACTIONS_FIXES).find((g) => g[id])?.[id].nom ?? id;
  const appris: string[] = [];
  if (sc.lecture.niveau) appris.push(`Son niveau : ${LIBELLE_NIVEAU[sc.niveauAdv]}.`);
  if (sc.lecture.nature && d.nature) appris.push(`Sa nature : ${R.elements[d.nature]?.nom ?? d.nature}.`);
  for (const h of d.habitudes) if (sc.lecture.habitudes.includes(h.id)) appris.push(accorderAdv(h.texte, genre));
  for (const t of sc.lecture.techniquesVues) {
    const tt = R.contenu.techniquesAdverses.find((x) => x.id === t);
    if (tt) appris.push(`Sa technique : ${tt.nom}.`);
  }
  const ilAppris = Object.entries(sc.vuesCeCombat)
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .map(([id, n]) => `${nom(id)}${n > 1 ? ` (${n} fois)` : ''}`);
  const progression = xp.map((id) => {
    const ms = s.maitrises[id];
    return ms ? `${R.maitrises[id].nom} : palier ${ms.tier}, ${ms.combatUses} combat${ms.combatUses > 1 ? 's' : ''}.` : '';
  }).filter(Boolean);
  let travailler: string | undefined;
  if (pire && R.maitrises[pire[0]]) travailler = `Entraîner ${R.maitrises[pire[0]].nom} pendant le temps libre.`;
  else if (pire) travailler = 'Travailler le taijutsu pendant le temps libre.';
  else if (!sc.lecture.niveau) travailler = 'Observer avant de frapper : une manche de lecture peut changer tout le combat.';
  return {
    marche: meilleure ? `${nom(meilleure[0])} a porté ${meilleure[1]} fois.` : undefined,
    echoue: pire ? `${nom(pire[0])} : ${accorderAdv(pire[1][0], genre).replace(/^[^:]+ : /, '')}` : undefined,
    appris,
    ilAppris: ilAppris.length ? [accorderAdv(`{Il} a vu : ${ilAppris.join(', ')}.`, genre)] : [],
    progression,
    travailler,
  };
}

// ── Vue pour l'interface ────────────────────────────────────

export interface VueAffrontement {
  titre: string;
  contexte: { libelle: string; kanji: string };
  /** « Manche 2 » ; le plafond n'est montré que si un arbitre l'annonce. */
  manche: string;
  adversaire: { nom: string; niveau: string; pct: number; garde: string; sonne: boolean };
  joueur: { endurance: number; enduranceMax: number; chakra: number; chakraMax: number; elan: number; garde: string; sonne: boolean };
  annonce: { texte: string; fiabilite: string; mortelle: boolean };
  familles: VueFamille[];
  journal: EntreeAffrontement[];
  lecture: string[];
}

export function vueAffrontement(s: GameState): VueAffrontement | undefined {
  if (s.scene.type !== 'affrontement') return undefined;
  const sc = s.scene;
  const d = adversaireDef(sc.adversaireId);
  const genre = genreAdv(s, d);
  const i = indexNiveau(sc.niveauAdv);
  const niveau = !sc.lecture.niveau ? '?' : s.attributs.perception >= 60 ? LIBELLE_NIVEAU[sc.niveauAdv] : `${LIBELLE_NIVEAU[NIVEAUX[Math.max(0, i - 1)]]} à ${LIBELLE_NIVEAU[sc.niveauAdv]}`;
  const lecture: string[] = [];
  if (sc.lecture.niveau) lecture.push(`Niveau estimé : ${niveau}.`);
  if (sc.lecture.nature && d.nature) lecture.push(`Nature : ${R.elements[d.nature]?.nom ?? d.nature}.`);
  if (sc.lecture.faiblesse) lecture.push(accorderAdv('Une faiblesse repérée : {il} protège mal son flanc gauche.', genre));
  for (const h of d.habitudes) if (sc.lecture.habitudes.includes(h.id)) lecture.push(accorderAdv(h.texte, genre));
  for (const t of sc.lecture.techniquesVues) {
    const tt = R.contenu.techniquesAdverses.find((x) => x.id === t);
    if (tt) lecture.push(`Technique vue : ${tt.nom}.`);
  }
  const fam = familles(s, sc).map((f) => ({ ...f, actions: f.actions.map((a) => ({ ...a, detail: accorderAdv(a.detail, genre) })) }));
  return {
    titre: interpoler(R.evenements[sc.evenementId].titre, s),
    contexte: { libelle: CONTEXTES[sc.contexte].libelle, kanji: CONTEXTES[sc.contexte].kanji },
    manche: sc.plafondVisible ? `Manche ${sc.manche} sur ${sc.plafond}` : `Manche ${sc.manche}`,
    adversaire: { nom: sc.nomAdversaire, niveau, pct: Math.round((sc.adv.endurance / sc.adv.enduranceMax) * 100), garde: sc.adv.garde, sonne: sc.adv.sonne > 0 },
    joueur: { endurance: sc.joueur.endurance, enduranceMax: sc.joueur.enduranceMax, chakra: s.jauges.chakra, chakraMax: s.jauges.chakraMax, elan: sc.elan, garde: sc.joueur.garde, sonne: sc.joueur.sonne > 0 },
    annonce: { texte: sc.annonce.texte, fiabilite: sc.annonce.fiabilite, mortelle: !!sc.annonce.mortelle },
    familles: fam,
    journal: sc.journal,
    lecture,
  };
}
