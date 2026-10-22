// Application des conséquences. Chaque effet est validé par le moteur : rien n'est accepté tel quel.

import type { Effect, GameState, MissionStatut, RelationAxe, StatPath } from './types';
import { AXES_RELATION } from './types';
import { R } from './registre';
import { interpoler } from './texte';
import { Ctx, ajouterJournal, decouvrir, defPnj, ecrireStat, lireStat, relationDe, resoudrePnj } from './etat';
import { evaluer } from './conditions';
import { alea, tirerPondere } from './rng';
import {
  apprendreTechnique,
  enseignerTechnique,
  applyCombatExperience,
  applyTraining,
  copierTechnique,
  eveillerPnj,
  eveilSousDanger,
  resolveAwakening,
  greffer,
} from './maitrise';
import { equiper, lierArme, obtenirArme, perdreArme, recupererArme, transferUniqueItem, usureArme } from './armes';
import { canalReputation, changeCareer, quitterMetier } from './metiers';
import { avancerTemps } from './temps';
import { declencherRage, estProche } from './pertes';

/** Drapeaux qui disent qu'un être cher vient de mourir sous les yeux du personnage. */
const DEUILS_TEMOINS = new Set(['conjoint_mort', 'enfant_mort', 'ami_mort_quartier']);

const CHEMINS_VISIBLES = /^(social\.(loyaute|reputation|reputationOmbre|influence|confianceClan|suspicion)|jauges\.(sante|ryo|chakraMax)|attributs\.)/;

/** Transitions de mission autorisées : une mission échouée ou réussie est close pour toujours. */
const TRANSITIONS_MISSION: Record<string, MissionStatut[]> = {
  aucun: ['en_cours', 'reussie', 'echouee', 'abandonnee'],
  en_cours: ['reussie', 'echouee', 'abandonnee'],
  reussie: [],
  echouee: [],
  abandonnee: [],
};

function modifierStat(s: GameState, chemin: StatPath, delta: number | undefined, valeur: number | undefined, ctx: Ctx): void {
  let d = delta ?? 0;
  if (chemin === 'jauges.sante' && d < 0) {
    const f = s.creation.difficulte === 'recit' ? 0.7 : s.creation.difficulte === 'legende' ? 1.3 : 1;
    d = Math.round(d * f);
  }
  const avant = lireStat(s, chemin);
  const reel = ecrireStat(s, chemin, valeur !== undefined ? valeur : avant + d);
  if (reel !== 0 && CHEMINS_VISIBLES.test(chemin)) ctx.changements.push({ t: 'stat', chemin, delta: reel });
}

export function appliquerEffets(s: GameState, effets: Effect[] | undefined, ctx: Ctx): void {
  for (const e of effets ?? []) appliquerEffet(s, e, ctx);
}

export function appliquerEffet(s: GameState, e: Effect, ctx: Ctx): void {
  if ('si' in e) {
    appliquerEffets(s, evaluer(e.si, s) ? e.alors : e.sinon, ctx);
    return;
  }
  if ('hasard' in e) {
    const branche = tirerPondere(
      s,
      e.hasard.map((h) => ({ item: h.effets, poids: h.poids })),
    );
    appliquerEffets(s, branche, ctx);
    return;
  }
  if ('stat' in e) return modifierStat(s, e.stat, e.delta, e.valeur, ctx);
  if ('reputationMetier' in e) {
    const chemin: StatPath = canalReputation(s) === 'secret' ? 'social.reputationOmbre' : 'social.reputation';
    return modifierStat(s, chemin, e.reputationMetier, undefined, ctx);
  }
  if ('drapeau' in e) {
    if (e.retirer) delete s.drapeaux[e.drapeau];
    else if (e.incr !== undefined) s.drapeaux[e.drapeau] = (Number(s.drapeaux[e.drapeau]) || 0) + e.incr;
    else {
      // La mort d'un être cher sous ses yeux (conjoint, enfant, ami) peut libérer la bête d'un jinchūriki.
      if (DEUILS_TEMOINS.has(e.drapeau) && !s.drapeaux[e.drapeau]) {
        s.drapeaux['derniere_perte_jour'] = s.jour;
        declencherRage(s, ctx, true);
      }
      s.drapeaux[e.drapeau] = e.valeur ?? true;
    }
    return;
  }
  if ('secret' in e) {
    if (!s.secrets.includes(e.secret)) {
      s.secrets.push(e.secret);
      s.drapeaux['nb_secrets'] = (Number(s.drapeaux['nb_secrets']) || 0) + 1;
      ctx.changements.push({ t: 'secret', id: e.secret });
      decouvrir(s, `secret:${e.secret}`);
    }
    return;
  }
  if ('indice' in e) {
    if (!s.indices.includes(e.indice)) {
      s.indices.push(e.indice);
      ctx.changements.push({ t: 'indice', id: e.indice });
    }
    return;
  }
  if ('objet' in e) {
    if (e.retirer) s.objets = s.objets.filter((o) => o !== e.objet);
    else if (!s.objets.includes(e.objet)) s.objets.push(e.objet);
    return;
  }
  if ('relation' in e) {
    const id = resoudrePnj(s, e.relation);
    if (!id) return;
    if (s.pnj[id]?.etat === 'mort') return;
    const r = relationDe(s, id);
    for (const axe of AXES_RELATION) {
      const d = e.delta[axe as RelationAxe];
      if (!d) continue;
      // Une relation rompue reste rompue : rien ne la répare hors d'une véritable réconciliation.
      if (r.rompue && d > 0 && ['confiance', 'amitie', 'attachement', 'respect'].includes(axe)) continue;
      const avant = r[axe];
      r[axe] = Math.max(0, Math.min(100, avant + d));
      if (r[axe] !== avant) ctx.changements.push({ t: 'relation', pnj: id, axe, delta: r[axe] - avant });
    }
    if (s.pnj[id]) s.pnj[id].rencontre = true;
    decouvrir(s, `pnj:${id}`);
    return;
  }
  if ('rompre' in e) {
    const id = resoudrePnj(s, e.rompre);
    if (!id) return;
    const r = relationDe(s, id);
    if (!r.rompue) {
      r.rompue = true;
      r.confiance = Math.min(r.confiance, 10);
      r.amitie = Math.min(r.amitie, 10);
      r.attachement = Math.min(r.attachement, 5);
      ctx.changements.push({ t: 'rupture', pnj: id });
      ajouterJournal(s, `Rupture avec ${defPnj(s, id)?.nom ?? id}.`, 2);
    }
    return;
  }
  if ('reconcilier' in e) {
    const id = resoudrePnj(s, e.reconcilier);
    if (!id) return;
    const r = relationDe(s, id);
    if (r.rompue) {
      r.rompue = false;
      ctx.changements.push({ t: 'reconciliation', pnj: id });
      ajouterJournal(s, `Réconciliation avec ${defPnj(s, id)?.nom ?? id}.`, 2);
    }
    return;
  }
  if ('souvenir' in e) {
    const id = resoudrePnj(s, e.pnj);
    if (id) relationDe(s, id).souvenirs.push(e.souvenir);
    return;
  }
  if ('promesse' in e) {
    const id = resoudrePnj(s, e.pnj);
    if (!id || s.promesses.some((p) => p.id === e.promesse)) return;
    // Le texte de la promesse peut citer des personnages ({aineNom}…) : on le fige au moment où elle est faite.
    const texte = interpoler(e.texte, s);
    s.promesses.push({ id: e.promesse, pnj: id, texte, jour: s.jour, etat: 'en_cours' });
    ctx.changements.push({ t: 'promesse', message: `Promesse : ${texte}` });
    ajouterJournal(s, `Promesse faite : ${texte}`, 2);
    return;
  }
  if ('promesseTenue' in e || 'promesseRompue' in e) {
    const pid = 'promesseTenue' in e ? e.promesseTenue : e.promesseRompue;
    const p = s.promesses.find((x) => x.id === pid);
    if (!p || p.etat !== 'en_cours') return;
    p.etat = 'promesseTenue' in e ? 'tenue' : 'rompue';
    const r = relationDe(s, p.pnj);
    if (p.etat === 'tenue') {
      r.confiance = Math.min(100, r.confiance + 10);
      ctx.changements.push({ t: 'promesse', message: `Promesse tenue : ${p.texte}` });
    } else {
      r.confiance = Math.max(0, r.confiance - 20);
      ctx.changements.push({ t: 'promesse', message: `Promesse rompue : ${p.texte}` });
    }
    ajouterJournal(s, `Promesse ${p.etat === 'tenue' ? 'tenue' : 'rompue'} : ${p.texte}`, 2);
    return;
  }
  if ('entrainer' in e) return applyTraining(s, e.entrainer, e.jours, !!e.mentor, ctx);
  if ('combatSur' in e) return applyCombatExperience(s, e.combatSur, ctx);
  if ('nomDeFamille' in e) {
    s.creation.nom = e.nomDeFamille;
    s.drapeaux['nom_fonde'] = e.nomDeFamille;
    ctx.changements.push({ t: 'info', message: `Tu portes désormais un nom : ${e.nomDeFamille}.` });
    ajouterJournal(s, `Tu fondes ton propre nom : ${e.nomDeFamille}.`, 3);
    return;
  }
  if ('greffer' in e) {
    greffer(s, e.greffer, ctx);
    return;
  }
  if ('tenterEveil' in e) {
    resolveAwakening(s, e.tenterEveil, e.intensite, ctx);
    return;
  }
  if ('eveilDanger' in e) return eveilSousDanger(s, e.eveilDanger, ctx);
  if ('enseigner' in e) {
    enseignerTechnique(s, e.enseigner, ctx);
    return;
  }
  if ('apprendre' in e) {
    apprendreTechnique(s, e.apprendre, (e.source as never) ?? 'mentor', ctx);
    return;
  }
  if ('copier' in e) {
    copierTechnique(s, e.copier, ctx);
    return;
  }
  if ('obtenirArme' in e) {
    obtenirArme(s, e.obtenirArme, e.statut ?? 'possedee', ctx);
    return;
  }
  if ('perdreArme' in e) return perdreArme(s, e.perdreArme, e.statut, e.vers, ctx);
  if ('recupererArme' in e) {
    recupererArme(s, e.recupererArme, ctx);
    return;
  }
  if ('equiper' in e) {
    equiper(s, e.equiper, ctx);
    return;
  }
  if ('usureArme' in e) return usureArme(s, e.usureArme, ctx);
  if ('lienArme' in e) return lierArme(s, e.lienArme, e.delta, ctx);
  if ('transfererRegistre' in e) {
    if (e.vers === 'joueur') return; // passer par obtenirArme pour le joueur
    return transferUniqueItem(s, e.transfererRegistre, e.vers, ctx);
  }
  if ('metier' in e) {
    changeCareer(s, e.metier, !!e.secondaire, ctx);
    return;
  }
  if ('quitterMetier' in e) return quitterMetier(s, e.quitterMetier, ctx);
  if ('palierMetier' in e) {
    if (!s.metier.principal) return;
    const max = (R.metiers[s.metier.principal]?.paliers.length ?? 1) - 1;
    const n = Math.max(0, Math.min(max, e.palierMetier));
    if (n !== s.metier.palier) {
      s.metier.palier = n;
      ctx.changements.push({
        t: 'metier',
        metier: s.metier.principal,
        message: `Rang au sein du métier : ${R.metiers[s.metier.principal]?.paliers[n]}.`,
      });
    }
    return;
  }
  if ('blessure' in e) {
    const b = e.blessure;
    const facteur = s.creation.difficulte === 'recit' ? 0.7 : s.creation.difficulte === 'legende' ? 1.3 : 1;
    s.blessures = s.blessures.filter((x) => x.id !== b.id);
    s.blessures.push({
      id: b.id,
      nom: b.nom,
      gravite: b.gravite,
      guerison: s.jour + Math.round(b.jours * facteur),
      invalidante: !!b.invalidante,
    });
    ctx.changements.push({ t: 'blessure', nom: b.nom, gravite: b.gravite });
    ajouterJournal(s, `Blessure : ${b.nom}.`, b.gravite >= 3 ? 3 : 2);
    return;
  }
  if ('soigner' in e) {
    const avant = s.blessures.length;
    s.blessures = e.soigner === 'toutes' ? s.blessures.filter((b) => b.invalidante) : s.blessures.filter((b) => b.id !== e.soigner);
    if (s.blessures.length !== avant) ctx.changements.push({ t: 'soin', message: 'Blessure soignée.' });
    return;
  }
  if ('rang' in e) {
    if (s.rang !== e.rang) {
      s.rang = e.rang;
      s.rangDepuis = s.jour;
      ctx.changements.push({ t: 'rang', rang: e.rang });
    }
    return;
  }
  if ('statut' in e && !('mission' in e)) {
    s.statut = e.statut;
    return;
  }
  if ('mission' in e) {
    const actuel = s.missions[e.mission] ?? 'aucun';
    if (!TRANSITIONS_MISSION[actuel].includes(e.statut)) {
      ctx.changements.push({ t: 'info', message: `La mission est déjà close : son issue ne change plus.` });
      return;
    }
    s.missions[e.mission] = e.statut;
    ctx.changements.push({ t: 'mission', id: e.mission, statut: e.statut });
    const m = R.missions[e.mission];
    if (m && e.statut === 'reussie') {
      s.jauges.ryo += m.recompense.ryo;
      ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: m.recompense.ryo });
      appliquerEffet(s, { reputationMetier: m.recompense.reputation }, ctx);
      s.jauges.experience += 10;
      // Le retour de mission n'est pas toujours un retour heureux : un deuil peut attendre à la maison.
      // Chez les Uchiha dont l'œil dort encore, c'est souvent ce choc qui l'éveille.
      const uchihaEndormi = s.creation.clan === 'uchiha' && s.maitrises['sharingan'] && !s.maitrises['sharingan'].awakened;
      const chance = uchihaEndormi ? 0.28 : 0.05;
      if (!s.drapeaux['deuil_famille'] && !s.planifies.some((x) => x.evenementId === 'x_deuil_famille') && alea(s) < chance)
        s.planifies.push({ evenementId: 'x_deuil_famille', jour: s.jour + 5 });
    }
    if (m && e.statut !== 'en_cours') ajouterJournal(s, `Mission ${m.rang} « ${m.titre} » : ${e.statut === 'reussie' ? 'réussie' : e.statut === 'echouee' ? 'échouée' : 'abandonnée'}.`, 2);
    return;
  }
  if ('planifier' in e) {
    s.planifies.push({ evenementId: e.planifier, jour: s.jour + e.dansJours });
    return;
  }
  if ('retour' in e) {
    if (s.planifies.some((x) => x.evenementId === e.retour) || alea(s) >= e.chance) return;
    const [min, max] = e.entre;
    s.planifies.push({ evenementId: e.retour, jour: s.jour + min + Math.floor(alea(s) * (max - min + 1)) });
    return;
  }
  if ('temps' in e) return avancerTemps(s, e.temps, ctx);
  if ('journal' in e) return ajouterJournal(s, interpoler(e.journal, s), e.importance ?? 2);
  if ('decouvrir' in e) {
    for (const id of Array.isArray(e.decouvrir) ? e.decouvrir : [e.decouvrir]) decouvrir(s, id);
    return;
  }
  if ('pnjEtat' in e) {
    const id = resoudrePnj(s, e.pnjEtat);
    const st = id ? s.pnj[id] : undefined;
    if (!id || !st) return;
    // Un personnage mort ne revient pas sans explication narrative explicite.
    if (st.etat === 'mort' && e.etat !== 'mort' && !e.explication) return;
    if (st.etat === e.etat) return;
    st.etat = e.etat;
    if (e.cause) st.cause = e.cause;
    st.gueriLe = e.etat === 'blesse' ? s.jour + 60 : undefined;
    ctx.changements.push({ t: 'pnj', pnj: id, etat: e.etat });
    const nom = defPnj(s, id)?.nom ?? id;
    if (e.etat === 'mort') {
      ajouterJournal(s, `${nom} est mort${defPnj(s, id)?.genre === 'f' ? 'e' : ''}.`, 3);
      if (estProche(s, id)) {
        s.drapeaux['derniere_perte_jour'] = s.jour;
        declencherRage(s, ctx, true);
      }
    }
    if (e.etat === 'disparu') ajouterJournal(s, `${nom} a disparu.`, 3);
    return;
  }
  if ('ethique' in e) {
    for (const [k, v] of Object.entries(e.ethique)) {
      ecrireStat(s, `ethique.${k}` as StatPath, lireStat(s, `ethique.${k}` as StatPath) + (v ?? 0));
    }
    return;
  }
  if ('fin' in e) {
    if (!s.fin) s.fin = { id: e.fin, jour: s.jour, cause: e.cause };
    return;
  }
  if ('chapitre' in e) {
    s.chapitre = e.chapitre;
    return;
  }
  if ('succes' in e) {
    if (!s.succes.includes(e.succes) && R.succes[e.succes]) {
      s.succes.push(e.succes);
      ctx.changements.push({ t: 'succes', id: e.succes });
    }
    return;
  }
  if ('eveillerPnj' in e) {
    eveillerPnj(s, e.eveillerPnj, e.maitrise, ctx);
    return;
  }
  if ('role' in e) {
    if (R.pnj[e.pnj] || s.pnjGeneres[e.pnj]) {
      s.roles[e.role] = e.pnj;
      if (s.pnj[e.pnj]) s.pnj[e.pnj].rencontre = true;
      decouvrir(s, `pnj:${e.pnj}`);
    }
    return;
  }
  throw new Error(`[effets] effet inconnu : ${JSON.stringify(e)}`);
}
