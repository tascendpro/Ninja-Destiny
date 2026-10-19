// Diagnostic du contenu (section 17) : événements sans suite, choix impossibles, conditions contradictoires,
// branches inaccessibles, quêtes sans issue, armes absentes du registre, métiers sans contenu…

import type { Condition, Effect, EventDef, Outcome, Texte, VillageId } from './types';
import { R } from './registre';
import { JETONS_CONNUS, jetonsDe } from './texte';
import { maxTierForAge } from './maitrise';

export interface Probleme {
  niveau: 'erreur' | 'avertissement';
  code: string;
  message: string;
}

const VILLAGES: VillageId[] = ['konoha', 'suna', 'kiri', 'kumo', 'iwa'];
const ROLES_GENERES = ['parent', 'aine'];
const ROLES_REQUIS = ['sensei', 'coequipierA', 'coequipierB', 'rival', 'forgeron', 'kage', 'medecin', 'recruteur'];

function* conditionsDe(c: Condition | undefined): Generator<Condition> {
  if (!c) return;
  yield c;
  if ('tout' in c) for (const x of c.tout) yield* conditionsDe(x);
  if ('un' in c) for (const x of c.un) yield* conditionsDe(x);
  if ('non' in c) yield* conditionsDe(c.non);
}

function* effetsDe(liste: Effect[] | undefined): Generator<Effect> {
  for (const e of liste ?? []) {
    yield e;
    if ('si' in e) {
      yield* effetsDe(e.alors);
      yield* effetsDe(e.sinon);
    }
    if ('hasard' in e) for (const h of e.hasard) yield* effetsDe(h.effets);
  }
}

function issuesDe(ev: EventDef): { choix: string; o: Outcome | undefined; effets: Effect[]; suite?: string; texte?: Texte; cond?: Condition }[] {
  const res: { choix: string; o: Outcome | undefined; effets: Effect[]; suite?: string; texte?: Texte; cond?: Condition }[] = [];
  for (const c of ev.choix) {
    if (c.test) {
      for (const o of [c.test.critique, c.test.succes, c.test.partiel, c.test.echec]) {
        if (o) res.push({ choix: c.id, o, effets: o.effets, suite: o.suite ?? c.suite, texte: o.texte, cond: c.si });
      }
    } else {
      res.push({ choix: c.id, o: undefined, effets: c.effets ?? [], suite: c.suite, texte: c.resultat, cond: c.si });
    }
  }
  return res;
}

export function diagnostiquer(): Probleme[] {
  const p: Probleme[] = [];
  const err = (code: string, message: string) => p.push({ niveau: 'erreur', code, message });
  const avert = (code: string, message: string) => p.push({ niveau: 'avertissement', code, message });

  const rolesConnus = new Set<string>(ROLES_GENERES);
  for (const v of VILLAGES) {
    const roles = R.contenu.roles[v] ?? {};
    for (const r of ROLES_REQUIS) if (!roles[r]) err('role_manquant', `Village ${v} : rôle « ${r} » non attribué.`);
    for (const [r, id] of Object.entries(roles)) {
      rolesConnus.add(r);
      if (!R.pnj[id]) err('role_pnj_inconnu', `Village ${v} : le rôle ${r} pointe vers un PNJ inconnu (${id}).`);
    }
  }
  // Rôles attribués par effet (ex. ninken).
  for (const ev of R.contenu.evenements) for (const i of issuesDe(ev)) for (const e of effetsDe(i.effets)) if ('role' in e) rolesConnus.add(e.role);

  const verifierPnj = (ref: string, ou: string) => {
    if (ref.startsWith('@')) {
      if (!rolesConnus.has(ref.slice(1))) err('role_inconnu', `${ou} : rôle inconnu ${ref}.`);
    } else if (!R.pnj[ref] && !ref.startsWith('famille_')) err('pnj_inconnu', `${ou} : PNJ inconnu ${ref}.`);
  };

  const verifierCondition = (c: Condition | undefined, ou: string) => {
    for (const x of conditionsDe(c)) {
      if ('maitrise' in x && !R.maitrises[x.maitrise]) err('maitrise_inconnue', `${ou} : maîtrise inconnue ${x.maitrise}.`);
      if ('arme' in x && !R.armes[x.arme]) err('arme_inconnue', `${ou} : arme inconnue ${x.arme}.`);
      if ('registre' in x && !R.armes[x.registre]) err('arme_inconnue', `${ou} : arme inconnue ${x.registre}.`);
      if ('mission' in x && !R.missions[x.mission]) err('mission_inconnue', `${ou} : mission inconnue ${x.mission}.`);
      if (('vu' in x && !R.evenements[x.vu]) || ('nonVu' in x && !R.evenements[x.nonVu]))
        err('evenement_inconnu', `${ou} : événement inconnu dans une condition.`);
      if ('metier' in x) for (const m of Array.isArray(x.metier) ? x.metier : [x.metier]) if (!R.metiers[m]) err('metier_inconnu', `${ou} : métier inconnu ${m}.`);
      if ('metierEligible' in x && !R.metiers[x.metierEligible]) err('metier_inconnu', `${ou} : métier inconnu ${x.metierEligible}.`);
      if ('clan' in x) for (const cl of Array.isArray(x.clan) ? x.clan : [x.clan]) if (!R.clans[cl]) err('clan_inconnu', `${ou} : clan inconnu ${cl}.`);
      if ('trait' in x && !R.traits[x.trait]) err('trait_inconnu', `${ou} : trait inconnu ${x.trait}.`);
      if ('objectif' in x && !R.objectifs[x.objectif]) err('objectif_inconnu', `${ou} : objectif inconnu ${x.objectif}.`);
      if ('relation' in x) verifierPnj(x.relation, ou);
      if ('relationRompue' in x) verifierPnj(x.relationRompue, ou);
      if ('pnj' in x) verifierPnj(x.pnj, ou);
      if ('age' in x && x.age.min !== undefined && x.age.max !== undefined && x.age.min > x.age.max)
        err('condition_contradictoire', `${ou} : âge minimum supérieur au maximum.`);
      if ('tout' in x) {
        const villages = x.tout.filter((y): y is { village: VillageId } => 'village' in y && !Array.isArray(y.village)).map((y) => y.village);
        if (new Set(villages).size > 1) err('condition_contradictoire', `${ou} : deux villages différents exigés simultanément.`);
        const ages = x.tout.filter((y): y is { age: { min?: number; max?: number } } => 'age' in y).map((y) => y.age);
        const min = Math.max(...ages.map((a) => a.min ?? -Infinity));
        const max = Math.min(...ages.map((a) => a.max ?? Infinity));
        if (ages.length > 1 && min > max) err('condition_contradictoire', `${ou} : fenêtres d’âge incompatibles.`);
      }
    }
  };

  const references = new Set<string>();
  const verifierEffets = (liste: Effect[] | undefined, ou: string) => {
    for (const e of effetsDe(liste)) {
      if ('si' in e) verifierCondition(e.si, ou);
      if ('entrainer' in e && !R.maitrises[e.entrainer]) err('maitrise_inconnue', `${ou} : maîtrise inconnue ${e.entrainer}.`);
      if ('tenterEveil' in e && !R.maitrises[e.tenterEveil]) err('maitrise_inconnue', `${ou} : maîtrise inconnue ${e.tenterEveil}.`);
      if ('apprendre' in e && !R.maitrises[e.apprendre]) err('maitrise_inconnue', `${ou} : technique inconnue ${e.apprendre}.`);
      if ('copier' in e && !R.maitrises[e.copier]) err('maitrise_inconnue', `${ou} : technique inconnue ${e.copier}.`);
      if ('combatSur' in e) for (const m of e.combatSur) if (!R.maitrises[m]) err('maitrise_inconnue', `${ou} : maîtrise inconnue ${m}.`);
      for (const k of ['obtenirArme', 'perdreArme', 'recupererArme', 'equiper', 'lienArme', 'transfererRegistre'] as const) {
        if (k in e) {
          const id = (e as Record<string, unknown>)[k] as string;
          if (!R.armes[id]) err('arme_inconnue', `${ou} : arme inconnue ${id}.`);
        }
      }
      if ('metier' in e && !R.metiers[e.metier]) err('metier_inconnu', `${ou} : métier inconnu ${e.metier}.`);
      if ('mission' in e && !R.missions[e.mission]) err('mission_inconnue', `${ou} : mission inconnue ${e.mission}.`);
      if ('planifier' in e) {
        references.add(e.planifier);
        if (!R.evenements[e.planifier]) err('evenement_inconnu', `${ou} : planification d’un événement inconnu ${e.planifier}.`);
      }
      if ('fin' in e) {
        references.add(`fin:${e.fin}`);
        if (!R.fins[e.fin]) err('fin_inconnue', `${ou} : fin inconnue ${e.fin}.`);
      }
      if ('succes' in e && !R.succes[e.succes]) err('succes_inconnu', `${ou} : trophée inconnu ${e.succes}.`);
      if ('relation' in e) verifierPnj(e.relation, ou);
      if ('rompre' in e) verifierPnj(e.rompre, ou);
      if ('reconcilier' in e) verifierPnj(e.reconcilier, ou);
      if ('pnjEtat' in e) verifierPnj(e.pnjEtat, ou);
      if ('promesse' in e) verifierPnj(e.pnj, ou);
      if ('role' in e && !R.pnj[e.pnj]) err('pnj_inconnu', `${ou} : rôle attribué à un PNJ inconnu ${e.pnj}.`);
      if ('eveillerPnj' in e) {
        verifierPnj(e.eveillerPnj, ou);
        if (!R.maitrises[e.maitrise]) err('maitrise_inconnue', `${ou} : maîtrise inconnue ${e.maitrise}.`);
      }
      if ('decouvrir' in e) {
        for (const d of Array.isArray(e.decouvrir) ? e.decouvrir : [e.decouvrir]) {
          if (!/^\w+:/.test(d)) err('decouverte_invalide', `${ou} : découverte invalide ${d}.`);
          else if (!R.encyclopedie[d]) err('decouverte_sans_entree', `${ou} : aucune entrée d’encyclopédie pour ${d}.`);
        }
      }
      if ('secret' in e && !R.encyclopedie[`secret:${e.secret}`]) err('secret_sans_entree', `${ou} : secret ${e.secret} sans entrée d’encyclopédie.`);
    }
  };

  const verifierTexte = (t: Texte | undefined, ou: string) => {
    for (const j of jetonsDe(t)) {
      if (JETONS_CONNUS.includes(j)) continue;
      const m = /^(?:(il|Il|e|le):)?(@?[\w-]+)$/.exec(j);
      if (m && m[2].startsWith('@')) {
        verifierPnj(m[2], ou);
        continue;
      }
      err('jeton_inconnu', `${ou} : jeton inconnu {${j}}.`);
    }
    if (typeof t !== 'string' && t) for (const seg of t) verifierCondition(seg.si, ou);
  };

  // Événements
  for (const ev of R.contenu.evenements) {
    const ou = `Événement ${ev.id}`;
    verifierCondition(ev.si, ou);
    verifierTexte(ev.texte, ou);
    verifierTexte(ev.titre, ou);
    for (const pr of ev.personnages ?? []) verifierPnj(pr, ou);
    const lieux = ev.lieu.startsWith('$') ? VILLAGES.map((v) => (ev.lieu === '$village' ? v : `${v}_${ev.lieu.slice(1)}`)) : [ev.lieu];
    for (const l of lieux) if (!R.lieux[l]) err('lieu_inconnu', `${ou} : lieu inconnu ${l}.`);
    if (!ev.choix.length) err('sans_choix', `${ou} : aucun choix.`);
    if (ev.choix.length && ev.choix.every((c) => c.si && !c.verrou)) avert('choix_tous_conditionnels', `${ou} : tous les choix sont conditionnels.`);
    const idsChoix = ev.choix.map((c) => c.id);
    if (new Set(idsChoix).size !== idsChoix.length) err('choix_duplique', `${ou} : identifiants de choix dupliqués.`);
    for (const c of ev.choix) {
      verifierCondition(c.si, `${ou}/${c.id}`);
      verifierTexte(c.texte, `${ou}/${c.id}`);
      if (c.verrou) verifierTexte(c.verrou, `${ou}/${c.id}`);
      if (c.suite) references.add(c.suite);
      if (c.test) for (const m of Object.keys(c.test.maitrises ?? {})) if (m !== 'arme' && !R.maitrises[m]) err('maitrise_inconnue', `${ou}/${c.id} : maîtrise inconnue ${m}.`);
    }
    for (const i of issuesDe(ev)) {
      const o = `${ou}/${i.choix}`;
      verifierEffets(i.effets, o);
      verifierTexte(i.texte, o);
      if (i.suite) {
        references.add(i.suite);
        if (!R.evenements[i.suite]) err('suite_inconnue', `${o} : suite inconnue ${i.suite}.`);
      }
      if (!i.effets.length && !i.suite && !ev.choix.find((c) => c.id === i.choix)?.duree) {
        err('choix_decoratif', `${o} : choix sans aucune conséquence.`);
      }
    }
    if (!ev.priorite && !ev.poids && !ev.enchaine) err('inaccessible', `${ou} : ni trame, ni aléatoire, ni enchaîné.`);
    if ((ev.priorite || ev.poids) && ev.enchaine) avert('double_acces', `${ou} : enchaîné mais aussi sélectionnable.`);
  }

  // Fins de chapitre : leur suite ouvre le chapitre suivant.
  for (const f of R.contenu.fins) {
    if (!f.suite) continue;
    references.add(f.suite);
    if (!R.evenements[f.suite]) err('suite_inconnue', `Fin ${f.id} : chapitre suivant inconnu ${f.suite}.`);
  }

  // Missions
  for (const m of R.contenu.missions) {
    references.add(m.evenement);
    verifierCondition(m.si, `Mission ${m.id}`);
    if (!R.evenements[m.evenement]) err('mission_sans_evenement', `Mission ${m.id} : événement inconnu ${m.evenement}.`);
    const lieuxMission = m.lieu.startsWith('$') ? VILLAGES.map((v) => (m.lieu === '$village' ? v : `${v}_${m.lieu.slice(1)}`)) : [m.lieu];
    for (const l of lieuxMission) if (!R.lieux[l]) err('lieu_inconnu', `Mission ${m.id} : lieu inconnu ${l}.`);
  }
  for (const ev of R.contenu.evenements) {
    if (ev.enchaine && !ev.planifieParMoteur && !references.has(ev.id)) err('inaccessible', `Événement ${ev.id} : enchaîné mais jamais référencé.`);
  }

  // Fins
  for (const f of R.contenu.fins) {
    verifierTexte(f.texte, `Fin ${f.id}`);
    if (f.id !== 'mort' && !references.has(`fin:${f.id}`)) avert('fin_jamais_atteinte', `Fin ${f.id} : aucun effet n’y conduit.`);
  }

  // Armes
  for (const w of R.contenu.armes) {
    if (w.unique && !w.detenteurInitial) err('registre', `Arme unique ${w.id} sans détenteur initial.`);
    if (w.famille && !R.maitrises[`famille_${w.famille}`]) err('famille_inconnue', `Arme ${w.id} : famille ${w.famille} sans maîtrise.`);
    if (w.quete) {
      if (!R.evenements[w.quete]) {
        err('quete_inconnue', `Arme ${w.id} : quête inconnue ${w.quete}.`);
        continue;
      }
      // Parcours de la chaîne de quête : il faut une résolution à trois issues au moins.
      const vus = new Set<string>();
      const pile = [w.quete];
      let resolution = false;
      let obtention = false;
      while (pile.length) {
        const id = pile.pop()!;
        if (vus.has(id)) continue;
        vus.add(id);
        const ev = R.evenements[id];
        if (!ev) continue;
        if (ev.choix.length >= 3) resolution = true;
        for (const i of issuesDe(ev)) {
          if (i.suite) pile.push(i.suite);
          for (const e of effetsDe(i.effets)) {
            if ('planifier' in e) pile.push(e.planifier);
            if ('obtenirArme' in e && e.obtenirArme === w.id) obtention = true;
          }
        }
      }
      if (!resolution) err('quete_sans_issues', `Quête de ${w.id} : aucune résolution à trois issues.`);
      if (!obtention) err('quete_sans_obtention', `Quête de ${w.id} : l’arme n’est jamais obtenue.`);
    } else if (w.rarete === 'legendaire') {
      avert('legendaire_sans_quete', `Arme légendaire ${w.id} : quête prévue dans un chapitre ultérieur.`);
    }
  }
  for (const [c, a] of Object.entries(R.contenu.armesHeritage.clan)) if (!R.armes[a]) err('arme_inconnue', `Héritage du clan ${c} : arme inconnue ${a}.`);
  for (const [v, a] of Object.entries(R.contenu.armesHeritage.village)) if (!R.armes[a]) err('arme_inconnue', `Héritage du village ${v} : arme inconnue ${a}.`);

  // Métiers
  for (const m of R.contenu.metiers) {
    verifierCondition(m.acces, `Métier ${m.id}`);
    if (m.evenementEntree && !R.evenements[m.evenementEntree]) err('metier_entree_inconnue', `Métier ${m.id} : événement d’entrée inconnu.`);
    if (!m.disponible || !m.evenementEntree) avert('metier_a_venir', `Métier ${m.id} : contenu prévu dans un chapitre ultérieur.`);
    for (const x of m.incompatibleAvec) if (!R.metiers[x]) err('metier_inconnu', `Métier ${m.id} : incompatibilité avec un métier inconnu ${x}.`);
  }

  // Clans et pouvoirs
  for (const c of R.contenu.clans) {
    if (!c.villages.length) err('clan_sans_village', `Clan ${c.id} sans village.`);
    for (const t of c.techniques) if (!R.maitrises[t]) err('maitrise_inconnue', `Clan ${c.id} : technique inconnue ${t}.`);
  }
  for (const m of R.contenu.maitrises) {
    if (m.paliers.length !== 6) err('paliers', `Maîtrise ${m.id} : il faut exactement 6 paliers (0 à 5).`);
    for (const [k, ex] of Object.entries(m.exigences ?? {})) if ((ex?.ageMin ?? 0) > 60) err('palier_inaccessible', `Maîtrise ${m.id} : palier ${k} inaccessible.`);
    if (m.eveil && m.eveil.ageMin > m.eveil.ageMax) err('condition_contradictoire', `Maîtrise ${m.id} : fenêtre d’éveil vide.`);
  }

  // PNJ : plafonds de départ
  for (const n of R.contenu.pnj) {
    for (const m of n.maitrises) {
      if (!R.maitrises[m.id]) {
        err('maitrise_inconnue', `PNJ ${n.id} : maîtrise inconnue ${m.id}.`);
        continue;
      }
      for (const depart of [6, 10]) {
        if (m.palier > maxTierForAge(depart + n.ecart, !!n.prodige)) {
          err('pnj_plafond', `PNJ ${n.id} : ${m.id} palier ${m.palier} impossible à ${depart + n.ecart} ans.`);
        }
      }
    }
  }

  // Trophées
  for (const sd of R.contenu.succes) verifierCondition(sd.si, `Trophée ${sd.id}`);

  return p;
}
