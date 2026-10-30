// Le combat à deux. Chaque joueur a sa propre manche, au format solo (l'écran de combat l'affiche tel quel) ;
// l'adversaire, le terrain et la chaîne des natures sont partagés. Les deux choisissent en secret, puis tout se résout
// dans l'ordre d'initiative, avec la vraie résolution solo (exécution, lecture, terrain, enchaînements).
// Le duel oppose les deux joueurs : chacun voit l'autre comme son adversaire.

import type { GameState } from '../types';
import { R } from '../registre';
import { alea } from '../rng';
import { appliquerEffets } from '../effets';
import { nouveauCtx } from '../etat';
import { verifierFin } from '../fins';
import { applyCombatExperience } from '../maitrise';
import { porteeTechnique } from '../epreuves';
import type { ActionCombat, AdversaireDef, EtatAffrontement } from '../combat/types';
import { adversaireDef, statsAdversaire } from '../combat/adversaire';
import { accorderAdv, composerManche, creerAffrontement, enduranceJoueur, ouvrirManche } from '../combat/affrontement';
import { ARME, TAIJUTSU, chanceExecution, defenseJoueur, puissanceJoueur, resoudre, validerAction } from '../combat/resolution';
import { CONTEXTES, indexNiveau } from '../combat/contextes';
import { natureAction, vieillirTerrain } from '../combat/terrain';
import { texteTechniqueTouche } from '../combat/impacts';
import { COMBATS_DUO } from '../../content/campagne/combats';
import type { Campagne, CombatDuoDef, IdJoueur, IssueCombat, SigneCombat } from './types';
import { autre, bouger, borne, graineFlux, hash01, souvenir, texteCommun } from './outils';

export const COMBATS: Record<string, CombatDuoDef> = Object.fromEntries(COMBATS_DUO.map((d) => [d.id, d]));

export const SIGNES: Record<SigneCombat, string> = {
  couvre: 'Je couvre',
  eau: 'Prépare l’eau',
  recule: 'Recule',
  feinte: 'Je feinte',
  attends: 'Attends mon signal',
  gauche: 'Je m’occupe de celui de gauche',
};

const ISSUE_MOT: Record<string, string> = { touche: 'touché', surprise: 'surprise', decisive: 'coup décisif', predite: 'prédit', dominee: 'dominé', ecrasee: 'écrasé', ratee: 'raté', annulee: 'annulé' };

const sc = (c: Campagne, j: IdJoueur) => c.joueurs[j].scene as EtatAffrontement;
const ofensive = (a: ActionCombat) => a.famille === 'taijutsu' || a.famille === 'ninjutsu' || a.famille === 'arme';
const rang = (id: string) => ({ E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6 })[R.maitrises[id]?.rang ?? 'C'] ?? 2;

/** Les natures qu'une technique de duo demande : deux personnages qui, ensemble, les maîtrisent. */
export function naturesDuo(c: Campagne): string[] {
  return [...new Set([c.creations[0].element, c.creations[1].element])];
}

/**
 * Exécute une partie du combat sur le flux de hasard du combat : le temps de l'appel, la vie prête son générateur
 * au combat, puis le récupère intact. Un combat ne décale jamais les tirages de vie des joueurs.
 */
function surFlux<T>(c: Campagne, s: GameState, fn: () => T): T {
  const vie = s.rngState;
  s.rngState = c.combat!.rng;
  try {
    return fn();
  } finally {
    c.combat!.rng = s.rngState;
    s.rngState = vie;
  }
}

/** Ouvre un combat à deux : chaque joueur entre dans sa propre manche, l'adversaire est le même pour les deux. */
export function ouvrirCombatDuo(c: Campagne, defId: string): void {
  const def = COMBATS[defId];
  if (!def) return;
  const scenesAvant: [GameState['scene'], GameState['scene']] = [c.joueurs[0].scene, c.joueurs[1].scene];
  for (const j of [0, 1] as IdJoueur[]) {
    const s = c.joueurs[j];
    const o = c.joueurs[autre(j)];
    const d = adversaireDef(def.adversaire);
    // L'adversaire est ajusté au binôme : endurance du gabarit de J1, multipliée, la même pour les deux manches.
    const endAdv = def.mode === 'duel' ? enduranceJoueur(o) : Math.round(statsAdversaire(c.joueurs[0], d).endurance * (def.enduranceMult ?? 1.5));
    s.scene = creerAffrontement(s, { evenementId: def.evenementId, adversaireId: def.adversaire, contexte: def.contexte, plafond: def.plafond, nomAdversaire: def.mode === 'duel' ? c.creations[autre(j)].prenom : def.nomAdversaire?.(c), enduranceAdv: endAdv });
  }
  c.combat = { def: defId, mode: def.mode, letal: !!def.letal, choix: [undefined, undefined], signes: [undefined, undefined], scenesAvant, aTerre: [false, false], mensonges: [0, 0], rng: graineFlux(c, `combat:${defId}:${c.actions.length}`) };
  if (def.mode === 'equipe') {
    const d = adversaireDef(def.adversaire);
    surFlux(c, c.joueurs[0], () => ouvrirManche(c.joueurs[0], sc(c, 0), d));
    copierAnnonce(c, 0, 1);
  } else
    for (const j of [0, 1] as IdJoueur[]) {
      const x = sc(c, j);
      x.intention = 'attaque';
      x.annonce = { texte: texteCommun(c, def.contexte === 'combat_a_mort' ? '{autre} ne retient plus rien. Ses yeux ne cherchent pas à te vaincre.' : '{autre} se met en garde, à quelques pas, et attend ton premier geste.', 0, j), fiabilite: 'fiable' };
    }
}

function copierAnnonce(c: Campagne, de: IdJoueur, vers: IdJoueur): void {
  const a = sc(c, de);
  const b = sc(c, vers);
  b.intention = a.intention;
  b.techniqueAdv = a.techniqueAdv;
  b.temperament = a.temperament;
  b.annonce = { ...a.annonce };
  b.avertissementManche = a.avertissementManche;
  b.adv = { ...a.adv };
  b.terrain = { ...(a.terrain ?? {}) };
  b.sceaux = [...(a.sceaux ?? [])];
}

/** Qui doit choisir maintenant dans le combat : le premier des deux, debout, qui n'a pas encore choisi. */
export function aChoisirCombat(c: Campagne): IdJoueur | null {
  const cb = c.combat!;
  for (const j of [0, 1] as IdJoueur[]) if (!cb.aTerre[j] && !cb.choix[j]) return j;
  return null;
}

/** Ce que le combat à deux montre à un joueur, en plus de sa manche : le signe de l'autre, le risque, les techniques de duo. */
export function vueCombatDuo(c: Campagne, j: IdJoueur) {
  const cb = c.combat;
  if (!cb) return undefined;
  const o = autre(j);
  return {
    mode: cb.mode,
    signeAutre: cb.signes[o] ? SIGNES[cb.signes[o]!] : undefined,
    autreATerre: cb.aTerre[o],
    // Un accord bas : une technique de zone peut toucher l'autre (le jeu prévient avant de lancer).
    risqueTirAmi: cb.mode === 'equipe' && !cb.aTerre[o] && c.lien.accord < 35,
    duo: cb.mode === 'equipe' ? c.lien.techniquesDuo.filter(() => c.lien.accord >= 50) : [],
    signes: SIGNES,
  };
}

/** Un joueur choisit (en secret) son action de la manche, et peut envoyer un signe à l'autre. */
export function choisirCombatMut(c: Campagne, j: IdJoueur, a: ActionCombat, signe?: SigneCombat): void {
  const cb = c.combat;
  if (!cb || cb.choix[j] || cb.aTerre[j]) throw new Error('Pas d’action de combat attendue de toi.');
  if (a.choix.startsWith('duo:')) {
    if (!c.lien.techniquesDuo.some((t) => `duo:${t.id}` === a.choix) || c.lien.accord < 50) throw new Error('Technique de duo indisponible.');
  } else validerAction(c.joueurs[j], sc(c, j), a);
  cb.choix[j] = a;
  cb.signes[j] = signe;
  if (aChoisirCombat(c) === null) (cb.mode === 'equipe' ? resoudreEquipe : resoudreDuel)(c);
}

const tirages = (s: GameState) => ({ exec: alea(s), reponse: alea(s), execAdv: alea(s), variation: alea(s), decisif: alea(s), texte: alea(s), replique: alea(s) });

/** L'initiative d'une action : le corps avant les signes, la défense avant tout, les grandes techniques en dernier. */
function initiative(c: Campagne, j: IdJoueur, a: ActionCombat): number {
  const s = c.joueurs[j];
  let v = s.attributs.agilite + sc(c, j).elan * 5;
  if (a.famille === 'defense') v += 30;
  else if (a.famille === 'taijutsu' && TAIJUTSU[a.choix]) v += TAIJUTSU[a.choix].vitesse === 'rapide' ? 20 : TAIJUTSU[a.choix].vitesse === 'lente' ? -10 : 5;
  else if (a.famille === 'arme' && ARME[a.choix]) v += 10;
  else if (R.maitrises[a.choix]) v -= 6 * rang(a.choix);
  return v;
}

function ordre(c: Campagne): IdJoueur[] {
  const cb = c.combat!;
  const vivants = ([0, 1] as IdJoueur[]).filter((j) => !cb.aTerre[j] && cb.choix[j]);
  return vivants.sort((x, y) => initiative(c, y, cb.choix[y]!) - initiative(c, x, cb.choix[x]!) || x - y);
}

// ── Côte à côte ──────────────────────────────────────────────

function resoudreEquipe(c: Campagne): void {
  const cb = c.combat!;
  const def = COMBATS[cb.def];
  const d = adversaireDef(def.adversaire);
  const lead = ([0, 1] as IdJoueur[]).find((j) => !cb.aTerre[j])!;
  const partage = sc(c, lead);
  const offensif = ['attaque', 'technique', 'majeure'].includes(partage.intention);
  // Qui l'adversaire vise : à partir de jōnin, les deux ; sinon celui qui prépare une grande technique, ou le plus faible.
  // Celui qui se met en défense devant l'autre prend le coup à sa place.
  const debout = ([0, 1] as IdJoueur[]).filter((j) => !cb.aTerre[j]);
  let cibles: IdJoueur[] = debout;
  if (!def.separes && indexNiveau(partage.niveauAdv) < 4 && debout.length === 2) {
    const prepare = debout.find((j) => R.maitrises[cb.choix[j]!.choix] && rang(cb.choix[j]!.choix) >= 3);
    const faible = debout.reduce((x, y) => (sc(c, x).joueur.endurance / sc(c, x).joueur.enduranceMax <= sc(c, y).joueur.endurance / sc(c, y).joueur.enduranceMax ? x : y));
    const cible = prepare ?? faible;
    const protecteur = autre(cible);
    cibles = [cb.choix[protecteur]?.famille === 'defense' ? protecteur : cible];
  }
  // Un joueur à terre, dans un combat mortel : averti à la manche d'avant, l'adversaire vient l'achever si personne ne le couvre.
  const achever = cb.letal ? ([0, 1] as IdJoueur[]).find((j) => cb.aTerre[j] && sc(c, j).avertissementManche !== undefined && cb.choix[autre(j)]?.famille !== 'defense') : undefined;

  const resume: [string, string] = ['', ''];
  const entrees: Partial<Record<IdJoueur, EtatAffrontement['journal'][number]>> = {};
  const duoChoisi = (j: IdJoueur) => cb.choix[j]?.choix.startsWith('duo:') ? cb.choix[j]!.choix : undefined;
  const ensemble = duoChoisi(0) && duoChoisi(0) === duoChoisi(1) ? duoChoisi(0) : undefined;
  let premiereNature: string | undefined;

  for (const j of ordre(c)) {
    const s = c.joueurs[j];
    const x = sc(c, j);
    const a = cb.choix[j]!;
    // L'état partagé : l'adversaire, le terrain, la chaîne des natures.
    x.adv = { ...partage.adv };
    x.terrain = { ...(partage.terrain ?? {}) };
    x.sceaux = [...(partage.sceaux ?? [])];
    x.advAveugle = partage.advAveugle;
    x.intention = offensif && cibles.includes(j) ? partage.intention : 'observer';
    x.techniqueAdv = x.intention === partage.intention ? partage.techniqueAdv : undefined;
    if (a.choix.startsWith('duo:')) {
      const t = c.lien.techniquesDuo.find((k) => `duo:${k.id}` === a.choix)!;
      s.jauges.chakra = Math.max(0, s.jauges.chakra - 20);
      if (ensemble) {
        // Les deux l'ont lancée ensemble : une seule fois, au nom des deux.
        if (j === ordre(c)[0]) {
          const degats = Math.round((34 + 10 * t.palier) * (0.85 + c.lien.accord / 300));
          partage.adv.endurance = Math.max(0, partage.adv.endurance - degats);
          t.usages += 1;
          if (t.usages % 3 === 0 && t.palier < 5) t.palier += 1;
          const texte = texteCommun(c, `{j1} et {j2} composent les mêmes signes au même instant, sans un regard. ${t.nom} ! Les deux chakras se mêlent en un seul, et l’adversaire le prend de plein fouet. (−${degats} endurance)`, j, j);
          for (const k of [0, 1] as IdJoueur[]) entrees[k] = { manche: x.manche, annonce: x.annonce.texte, action: t.nom, execution: texte, reponse: '', impact: '', lecture: 'Technique de duo : lancée ensemble, elle ne pouvait pas rater.', repliques: [], issue: 'touche', inflige: degats, subi: 0, technique: 'duo' };
        }
        continue;
      }
      entrees[j] = { manche: x.manche, annonce: x.annonce.texte, action: t.nom, execution: texteCommun(c, `Tu composes ta part de ${t.nom}, et tu attends que {autre} compose la sienne. Rien ne vient. Ton chakra se perd dans l’air.`, j, j), reponse: '', impact: '', lecture: 'Technique de duo lancée seul·e : elle exige que vous la lanciez tous les deux, dans la même manche.', repliques: [], issue: 'ratee', inflige: 0, subi: 0, technique: 'duo seul' };
      continue;
    }
    // La synergie entre vous deux dépend de votre accord : trop bas, vos techniques se gênent.
    const naturePartenaire = def.separes ? undefined : premiereNature;
    if (def.separes) x.sceaux = [...(x.sceaux ?? [])].filter((_, k, l) => k < l.length - (premiereNature ? 1 : 0));
    if (naturePartenaire && hash01(c, `sync:${x.manche}:${j}:${c.actions.length}`) > 0.35 + c.lien.accord / 100) x.sceaux = (x.sceaux ?? []).slice(0, -1);
    const { res, entree } = surFlux(c, s, () => {
      const r = tirages(s);
      const res = resoudre(s, x, d, a, r);
      return { res, entree: composerManche(s, x, d, a, res, x.annonce.texte, r.texte, r.replique) };
    });
    entrees[j] = entree;
    // Ce que l'action laisse : l'adversaire, le terrain et la chaîne, pour celui qui agit après.
    partage.adv = { ...x.adv };
    partage.terrain = { ...(x.terrain ?? {}) };
    const nature = res.execution !== 'ratee' ? natureAction(a.choix) : undefined;
    partage.sceaux = [...(partage.sceaux ?? []), nature ?? null].slice(-3);
    partage.advAveugle = x.advAveugle;
    if (nature) premiereNature = nature;
    // Le tir ami : une technique de zone, lancée par quelqu'un qui ne connaît pas encore assez l'autre.
    const o = autre(j);
    if (!cb.aTerre[o] && R.maitrises[a.choix] && porteeTechnique(a.choix) !== 'cible' && c.lien.accord < 35 && res.inflige > 0 && hash01(c, `ami:${x.manche}:${j}:${c.actions.length}`) < (35 - c.lien.accord) / 50) {
      const coup = Math.max(3, Math.round(res.inflige * 0.3));
      sc(c, o).joueur.endurance = Math.max(0, sc(c, o).joueur.endurance - coup);
      entree.impact += texteCommun(c, ` Ta technique déborde : {autre} en prend une partie de plein fouet. (−${coup} endurance pour {autre})`, j, j);
      resume[o] += texteCommun(c, ` La technique de {autre} t’a touché·e au passage. (−${coup})`, o, o);
    }
    resume[j] = `${c.creations[j].prenom} : ${entree.action}${res.issue ? ` — ${ISSUE_MOT[res.issue] ?? res.issue}` : ''}${res.inflige ? ` (−${res.inflige} pour l’adversaire)` : ''}${res.subi ? ` (−${res.subi} pour ${c.creations[j].prenom})` : ''}.`;
  }

  // Le coup de grâce sur un joueur à terre, que personne n'a couvert.
  if (achever !== undefined && offensif && partage.adv.endurance > 0) {
    const s = c.joueurs[achever];
    s.drapeaux['cause_mort'] = `tombé·e aux côtés de ${c.creations[autre(achever)].prenom}, face à ${sc(c, achever).nomAdversaire}`;
    s.jauges.sante = 0;
    verifierFin(s);
    resume[autre(achever)] += texteCommun(c, ` Personne ne couvrait {autre}. Le coup est tombé. {Il:autre} ne se relève pas.`, autre(achever), autre(achever));
  }

  // Les signes : « je couvre », puis rien, et l'autre a pris le coup.
  for (const j of [0, 1] as IdJoueur[]) {
    const o = autre(j);
    if (cb.signes[j] === 'couvre' && cb.choix[j] && cb.choix[j]!.famille !== 'defense' && (entrees[o]?.subi ?? 0) > 0) {
      cb.mensonges[j] += 1;
      bouger(c, o, { confiance: -6, mefiance: 6 });
      resume[o] += texteCommun(c, ` {autre} t’avait fait signe : « Je couvre ». {Il:autre} ne l’a pas fait.`, o, o);
    }
  }

  // Le journal de chacun : sa manche, puis ce qu'a fait l'autre.
  for (const j of [0, 1] as IdJoueur[]) {
    const x = sc(c, j);
    const e = entrees[j] ?? { manche: x.manche, annonce: x.annonce.texte, action: 'À terre', execution: 'Tu es à terre. Tu entends le combat continuer sans toi.', reponse: '', impact: '', lecture: '', repliques: [], technique: 'a_terre' };
    const o = autre(j);
    e.impact = [e.impact, resume[o] ? `Pendant ce temps — ${resume[o]}` : '', resume[j] && entrees[j] ? '' : resume[j]].filter(Boolean).join(' ');
    x.journal.push(e);
    x.adv = { ...partage.adv };
    if (x.joueur.endurance <= 0 && !cb.aTerre[j]) cb.aTerre[j] = true;
  }
  if (c.joueurs.some((s) => s.statut === 'mort')) cb.aTerre = [cb.aTerre[0] || c.joueurs[0].statut === 'mort', cb.aTerre[1] || c.joueurs[1].statut === 'mort'];

  const vivantsAdv = partage.adv.endurance > 0;
  const tousATerre = cb.aTerre[0] && cb.aTerre[1];
  const fin = !vivantsAdv ? 'victoire' : tousATerre ? 'defaite' : partage.manche >= partage.plafond ? departage(c) : undefined;
  cb.choix = [undefined, undefined];
  cb.signes = [undefined, undefined];
  if (fin) return conclureCombat(c, fin);
  // La manche suivante : l'adversaire annonce, la même chose pour les deux (lue par celui qui est debout).
  const nouveauLead = ([0, 1] as IdJoueur[]).find((j) => !cb.aTerre[j])!;
  for (const j of [0, 1] as IdJoueur[]) {
    sc(c, j).manche += 1;
    sc(c, j).adv = { ...partage.adv };
    sc(c, j).terrain = { ...(partage.terrain ?? {}) };
    sc(c, j).sceaux = [...(partage.sceaux ?? [])];
  }
  vieillirTerrain(sc(c, nouveauLead));
  surFlux(c, c.joueurs[nouveauLead], () => ouvrirManche(c.joueurs[nouveauLead], sc(c, nouveauLead), d));
  const tombe = ([0, 1] as IdJoueur[]).find((j) => cb.aTerre[j] && c.joueurs[j].statut !== 'mort');
  if (tombe !== undefined && cb.letal) {
    // L'avertissement, toujours une manche avant : celui qui est debout sait ce qui va arriver s'il ne couvre pas l'autre.
    sc(c, tombe).avertissementManche ??= sc(c, nouveauLead).manche;
    sc(c, nouveauLead).annonce.texte += texteCommun(c, ' {autre} est à terre, et l’adversaire le sait : couvre {le:autre} (défense), ou {il:autre} ne se relèvera pas.', nouveauLead, nouveauLead);
  }
  copierAnnonce(c, nouveauLead, autre(nouveauLead));
}

function departage(c: Campagne): 'victoire' | 'defaite' {
  const a = sc(c, 0).adv;
  const moyenne = ([0, 1] as IdJoueur[]).reduce<number>((m, j) => m + sc(c, j).joueur.endurance / sc(c, j).joueur.enduranceMax, 0) / 2;
  return a.endurance / a.enduranceMax < moyenne ? 'victoire' : 'defaite';
}

// ── Face à face ──────────────────────────────────────────────

function resoudreDuel(c: Campagne): void {
  const cb = c.combat!;
  const def = COMBATS[cb.def];
  const choix = cb.choix as [ActionCombat, ActionCombat];
  // L'abandon : fuir, c'est laisser la victoire à l'autre.
  const abandon = ([0, 1] as IdJoueur[]).find((j) => choix[j].famille === 'fuite');
  if (abandon !== undefined) return finirDuel(c, autre(abandon), true);
  const ordreDuel = ([0, 1] as IdJoueur[]).sort((x, y) => initiative(c, y, choix[y]) - initiative(c, x, choix[x]) || x - y);
  const reussit: [boolean, boolean] = [false, false];
  const puissance: [number, number] = [0, 0];
  for (const j of [0, 1] as IdJoueur[]) {
    const s = c.joueurs[j];
    const a = choix[j];
    const r = surFlux(c, s, () => alea(s));
    if (!ofensive(a)) continue;
    const tech = R.maitrises[a.choix];
    if (tech?.technique) s.jauges.chakra = Math.max(0, s.jauges.chakra - tech.technique.chakra);
    reussit[j] = r < chanceExecution(s, a);
    // Une technique que l'autre ne t'a jamais vu utiliser le surprend vraiment.
    const inedite = !!tech && !c.lien.vus[autre(j)].includes(a.choix);
    puissance[j] = puissanceJoueur(s, a) + (inedite ? 12 : 0) + sc(c, j).ouverture;
    sc(c, j).ouverture = 0;
    sc(c, j).techniquesUtilisees.push(a.choix);
    if (tech && !c.lien.vus[autre(j)].includes(a.choix)) c.lien.vus[autre(j)].push(a.choix);
  }
  const subi: [number, number] = [0, 0];
  const recit: [string[], string[]] = [[], []];
  const nom = (j: IdJoueur) => c.creations[j].prenom;
  const nomAction = (a: ActionCombat) => R.maitrises[a.choix]?.nom ?? TAIJUTSU[a.choix]?.nom ?? ARME[a.choix]?.nom ?? (a.famille === 'defense' ? 'Défense' : a.famille === 'observation' ? 'Observer' : a.choix);
  for (const j of ordreDuel) {
    const o = autre(j);
    const a = choix[j];
    if (!ofensive(a)) {
      if (a.famille === 'observation') sc(c, j).ouverture = 10;
      continue;
    }
    if (!reussit[j]) {
      recit[j].push('Ton geste part de travers : rien ne porte.');
      recit[o].push(`Le geste de ${nom(j)} part de travers.`);
      continue;
    }
    const defO = choix[o];
    let mult = 1;
    // Ce que l'autre a choisi : sa garde, son esquive, ou son propre coup (le premier à frapper prend l'avantage).
    if (defO.famille === 'defense') {
      if (defO.choix === 'garde') mult = 0.55;
      else {
        const p = Math.max(0.1, Math.min(0.85, 0.45 + (c.joueurs[o].attributs.agilite - c.joueurs[j].attributs.agilite) / 100));
        if (surFlux(c, c.joueurs[o], () => alea(c.joueurs[o])) < p) {
          mult = 0;
          sc(c, o).ouverture = 12;
        }
      }
    } else if (ofensive(defO) && reussit[o] && ordreDuel[0] === o) mult = 0.7;
    const degats = Math.round(Math.max(1, (puissance[j] - defenseJoueur(c.joueurs[o], sc(c, o)) * 0.5) * 1.3) * mult);
    subi[o] += degats;
    const tech = R.maitrises[a.choix];
    const ligne = tech && degats > 0 ? texteTechniqueTouche(c.joueurs[j], a.choix, 'loin', `${sc(c, j).manche}`) : '';
    const genreO = c.creations[o].presentation === 'feminin' ? 'f' : 'm';
    if (degats === 0) {
      recit[j].push(`${nom(o)} esquive : ton ${nomAction(a)} frappe le vide.`);
      recit[o].push(`Tu esquives le ${nomAction(a)} de ${nom(j)}, et sa garde s’ouvre.`);
    } else {
      recit[j].push(`${nomAction(a)}. ${ligne ? accorderAdv(ligne, genreO) : `Ton coup trouve ${nom(o)}.`} (−${degats} pour ${nom(o)})`);
      recit[o].push(`${nom(j)} : ${nomAction(a)}. Le coup te trouve${mult < 1 && mult > 0 ? ', amorti par ta garde' : ''}. (−${degats})`);
    }
  }
  for (const j of [0, 1] as IdJoueur[]) {
    const x = sc(c, j);
    const o = autre(j);
    x.joueur.endurance = Math.max(0, x.joueur.endurance - subi[j]);
    x.adv.endurance = Math.max(0, x.adv.endurance - subi[o]);
    x.journal.push({ manche: x.manche, annonce: x.annonce.texte, action: nomAction(choix[j]), execution: `${nomAction(choix[j])}.`, reponse: `${nom(o)} : ${nomAction(choix[o])}.`, impact: [...recit[j]].join(' '), lecture: '', repliques: [], inflige: subi[o], subi: subi[j], technique: 'duel' });
  }
  cb.choix = [undefined, undefined];
  cb.signes = [undefined, undefined];
  const tombes = ([0, 1] as IdJoueur[]).filter((j) => sc(c, j).joueur.endurance <= 0);
  if (tombes.length === 1) return finirDuel(c, autre(tombes[0]));
  if (tombes.length === 2) return finirDuel(c, sc(c, 0).joueur.endurance >= sc(c, 1).joueur.endurance ? 0 : 1);
  if (sc(c, 0).manche >= def.plafond) {
    const p = (j: IdJoueur) => sc(c, j).joueur.endurance / sc(c, j).joueur.enduranceMax;
    return finirDuel(c, p(0) >= p(1) ? 0 : 1);
  }
  for (const j of [0, 1] as IdJoueur[]) {
    sc(c, j).manche += 1;
    sc(c, j).annonce = { texte: texteCommun(c, sc(c, j).joueur.endurance < sc(c, j).joueur.enduranceMax * 0.35 ? '{autre} voit que tu faiblis. {Il:autre} ne te laissera pas reprendre ton souffle.' : '{autre} se replace, sans te quitter des yeux.', j, j), fiabilite: 'fiable' };
  }
}

/** La fin d'un duel : le vainqueur, le vaincu, et ce que chacun en retire. */
function finirDuel(c: Campagne, vainqueur: IdJoueur, abandon = false): void {
  const cb = c.combat!;
  const def = COMBATS[cb.def];
  const vaincu = autre(vainqueur);
  const nom = (j: IdJoueur) => c.creations[j].prenom;
  c.lien.duels[vainqueur] += 1;
  let texte: string;
  if (def.letal) {
    c.stats.tueParAutre = vaincu;
    const s = c.joueurs[vaincu];
    s.drapeaux['cause_mort'] = `tué·e en duel par ${nom(vainqueur)}`;
    s.jauges.sante = 0;
    verifierFin(s);
    texte = texteCommun(c, '{un} reste debout. {deux} ne se relève pas. Il n’y a pas de témoin, pas de juge, pas de gloire : seulement {un}, seul{e:un}, et le silence d’après.', vainqueur);
    souvenir(c, 'duel_mort', texteCommun(c, 'Le duel à mort, où {un} est resté debout.', vainqueur), 5, 'tragique', [vainqueur]);
  } else {
    // Le vainqueur gagne trois points de stat, le vaincu un : on apprend aussi en perdant.
    c.joueurs[vainqueur].pointsStat += 3;
    c.joueurs[vaincu].pointsStat += 1;
    if (Math.min(...c.joueurs.map((s) => Math.floor((s.jour - s.naissance) / 360))) >= 45) c.stats.duelCrepuscule = true;
    texte = abandon
      ? texteCommun(c, '{deux} baisse les mains et recule : {il:deux} abandonne. {un} gagne, sans savoir s’il faut s’en réjouir.', vainqueur)
      : texteCommun(c, '{deux} pose un genou à terre. {un} lui tend la main ; {deux} la prend. Vous restez un moment assis dans la poussière, à reprendre votre souffle, à refaire le combat à voix haute.', vainqueur);
    texte += texteCommun(c, ` Duels : {j1} ${c.lien.duels[0]}, {j2} ${c.lien.duels[1]}. {un} gagne 3 points de stat, {deux} en gagne 1.`, vainqueur);
    if (!c.lien.souvenirs.some((s) => s.id === 'premier_duel')) souvenir(c, 'premier_duel', texteCommun(c, 'Votre premier duel : {un} l’a emporté.', vainqueur), 3, 'fier');
  }
  const issue: IssueCombat = { ...def.victoire, texte };
  terminer(c, issue, `${def.letal ? 'Duel à mort' : 'Duel'} : ${nom(vainqueur)} l’emporte`);
}

function conclureCombat(c: Campagne, fin: 'victoire' | 'defaite'): void {
  const cb = c.combat!;
  const def = COMBATS[cb.def];
  const issue = def[fin];
  // Ce que le monde retiendra : la victoire, l'enchaînement de foudre, les lames, le Kage auquel on a survécu.
  const journaux = [sc(c, 0).journal ?? [], sc(c, 1).journal ?? []];
  if (fin === 'victoire') {
    c.stats.victoires += 1;
    if (journaux.some((jl) => jl.some((e) => e.synergie?.vers === 'raiton'))) c.stats.victoiresRaiton += 1;
    if (journaux.some((jl) => jl.some((e) => ARME[e.action] || /lame|kunai|sabre/i.test(e.action)))) c.stats.victoiresLames += 1;
  } else c.stats.defaites += 1;
  if (def.kage && c.joueurs.every((s) => s.statut !== 'mort')) c.stats.survivantsKage = true;
  c.chronique.push({ jour: Math.max(c.joueurs[0].jour, c.joueurs[1].jour), texte: texteCommun(c, fin === 'victoire' ? `On raconte que {j1} et {j2} ont vaincu ${sc(c, 0).nomAdversaire}, côte à côte.` : `On dit que ${sc(c, 0).nomAdversaire} a eu raison de {j1} et {j2}, cette fois.`) });
  // Celui qui est tombé (et qui vit encore) garde une blessure de plus.
  for (const j of [0, 1] as IdJoueur[]) {
    if (cb.aTerre[j] && c.joueurs[j].statut !== 'mort') appliquerEffets(c.joueurs[j], [{ blessure: { id: `duo_${cb.def}`, nom: 'Tombé·e au combat, aux côtés de l’autre', gravite: 2, jours: 30 } }], nouveauCtx());
  }
  terminer(c, issue, fin === 'victoire' ? 'Victoire' : 'Défaite');
}

/** Ce que tout combat à deux laisse : les scènes reprennent, les effets tombent, le lien bouge, et les deux lisent la fin. */
function terminer(c: Campagne, issue: IssueCombat, titre: string): void {
  const cb = c.combat!;
  const def = COMBATS[cb.def];
  c.dernierCombat = [sc(c, 0).journal ?? [], sc(c, 1).journal ?? []];
  for (const j of [0, 1] as IdJoueur[]) {
    const s = c.joueurs[j];
    const x = s.scene as EtatAffrontement;
    if (x.type === 'affrontement') applyCombatExperience(s, x.techniquesUtilisees, nouveauCtx());
    if (s.statut !== 'mort') s.scene = cb.scenesAvant[j];
    if (issue.effets?.length && s.statut !== 'mort') appliquerEffets(s, issue.effets, nouveauCtx());
    bouger(c, j, issue.lien);
  }
  // Se battre ensemble rapproche les gestes, même quand on perd ; se battre l'un contre l'autre aussi.
  c.lien.accord = borne(c.lien.accord + 3 + (issue.accord ?? 0));
  if (issue.souvenir) souvenir(c, `combat_${cb.def}_${c.lien.souvenirs.length}`, issue.souvenir, 4, 'fier');
  issue.apres?.(c);
  const texteFin = issue.texte || CONTEXTES[def.contexte].libelle;
  c.resultat = { id: def.id, titre, texte: texteFin, libelles: ['', ''], lu: [c.joueurs[0].statut === 'mort', c.joueurs[1].statut === 'mort'] };
  c.combat = undefined;
}

export type { AdversaireDef };
