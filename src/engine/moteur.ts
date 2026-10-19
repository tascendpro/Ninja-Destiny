// API publique du moteur. Toute partie est entièrement déterminée par : création + graine + actions.
// Les fonctions publiques ne modifient jamais l'état reçu (elles travaillent sur une copie).

import type {
  Action,
  Changement,
  CheckDef,
  ElementId,
  Instantane,
  AttributId,
  ChoiceDef,
  Creation,
  EventDef,
  GameState,
  Issue,
  LieuDef,
  MasteryTier,
  NpcDef,
  NpcState,
  Tirages,
  VillageId,
} from './types';
import { ATTRIBUTS } from './types';
import { R } from './registre';
import { JOURS_AN, age, ageA, libelleDuree, libellePeriode } from './calendrier';
import { Ctx, ajouterJournal, clamp, cloner, defPnj, nomDeFamille, nouveauCtx, resoudrePnj } from './etat';
import { alea, aleaEntier } from './rng';
import { evaluer } from './conditions';
import { appliquerEffets } from './effets';
import { applyCombatExperience, exigence, eveilsAutomatiques, maxTierForAge, nouvelleMaitrise } from './maitrise';
import { obtenirArme } from './armes';
import { avancerTemps } from './temps';
import { choisirSuivant, entrerEvenement, resoudreLieu } from './selection';
import { repartirPoints } from './progression';
import { CONSOMMABLES, stock, utiliserConsommable } from './consommables';
import { attaqueDisponible, attaquesSpeciales, avantageTechnique, bonusTechnique, conclureCombat, evaluerEpreuve, nombreManches, resoudreEpreuve, resoudreManche } from './epreuves';
import type { IssueManche, NiveauRisque } from './epreuves';
import { interpoler, resoudreTexte } from './texte';
import { faireActivite } from './tempsLibre';
import { verifierFin, verifierSucces } from './fins';

export const VERSION_ETAT = 1;
export const JOUR_DEPART = R.contenu.monde.anDepart * JOURS_AN;
export const APTITUDES: AttributId[] = ['perception', 'discretion', 'controleChakra', 'force', 'agilite', 'intellect', 'charisme'];

/** Probabilités des dons que le joueur ne choisit pas (tirés à la naissance, avec la graine de la partie). */
export const CHANCE_PRODIGE = 0.07;
export const CHANCE_JINCHURIKI = 0.02;

/**
 * Un village scelle sa bête dans un enfant qu'on ne regrettera pas : rarement un enfant de clan,
 * plus souvent un enfant du commun, plus souvent encore un orphelin.
 */
export function chanceJinchuriki(c: Creation): number {
  if (c.clan !== 'sans_clan') return CHANCE_JINCHURIKI;
  return c.origine === 'orphelin' ? 0.14 : 0.08;
}

// ── Création ─────────────────────────────────────────────────

export function validerCreation(c: Creation): string[] {
  const err: string[] = [];
  if (!c.prenom?.trim()) err.push('Prénom manquant.');
  if ((c.prenom?.length ?? 0) > 24) err.push('Prénom trop long.');
  if (c.origine && c.clan !== 'sans_clan') err.push('Seul un personnage sans clan peut être orphelin ou enfant du commun.');
  if (c.origine && !['famille', 'orphelin'].includes(c.origine)) err.push('Origine inconnue.');
  if (c.heritage && !R.contenu.heritages.some((h) => h.id === c.heritage)) err.push('Héritage inconnu.');
  if (![6, 10].includes(c.ageDepart)) err.push('Âge de départ invalide.');
  const village = R.villages[c.village];
  const clan = R.clans[c.clan];
  if (!village) err.push('Village inconnu.');
  if (!clan) err.push('Clan inconnu.');
  if (village && clan && !clan.villages.includes(c.village)) err.push(`Le clan ${clan.nom} n’existe pas à ${village.nom}.`);
  if (!R.elements[c.element]) err.push('Affinité inconnue.');
  if (clan?.elementsRequis && !clan.elementsRequis.includes(c.element)) {
    err.push(`La lignée ${clan.nom} exige une affinité ${clan.elementsRequis.map((e) => R.elements[e]?.nom).join(' ou ')}.`);
  }
  const normaux = c.traits.filter((t) => !R.traits[t]?.special);
  if (c.traits.some((t) => !R.traits[t])) err.push('Trait inconnu.');
  if (c.traits.some((t) => R.traits[t]?.special)) err.push('Ce don ne se choisit pas : le destin en décide.');
  if (new Set(c.traits).size !== c.traits.length) err.push('Trait en double.');
  if (normaux.length !== 2) err.push('Choisis exactement deux traits de personnalité.');
  if (!APTITUDES.includes(c.aptitude)) err.push('Aptitude invalide.');
  if (!R.objectifs[c.objectif]) err.push('Objectif inconnu.');
  if (!['recit', 'shinobi', 'legende'].includes(c.difficulte)) err.push('Difficulté inconnue.');
  return err;
}

function etatVide(c: Creation, graine: number): GameState {
  const attributs = Object.fromEntries(ATTRIBUTS.map((a) => [a, 30])) as Record<AttributId, number>;
  return {
    version: VERSION_ETAT,
    contenuVersion: R.contenu.version,
    seed: graine,
    rngState: graine,
    creation: {
      ...c,
      prenom: c.prenom.trim(),
      nom: nomDeFamille(c.clan),
      origine: c.clan === 'sans_clan' ? (c.origine ?? 'famille') : undefined,
      traits: [...c.traits],
    },
    tirages: { prodige: false, lignees: [] },
    jour: JOUR_DEPART,
    jourDepart: JOUR_DEPART,
    naissance: JOUR_DEPART - c.ageDepart * JOURS_AN,
    attributs,
    jauges: { sante: 100, chakra: 30, chakraMax: 30, fatigue: 0, ryo: 30, experience: 0 },
    social: { loyaute: 50, reputation: 5, reputationOmbre: 0, influence: 0, confianceClan: 50, suspicion: 0 },
    ethique: { compassion: 0, honneur: 0, ambition: 0 },
    rang: 'eleve',
    rangDepuis: JOUR_DEPART,
    pointsStat: 0,
    merites: {},
    anniversaires: [],
    consommables: {},
    statut: 'actif',
    metier: { palier: 0, historique: [] },
    maitrises: {},
    arsenal: [],
    registre: {},
    blessures: [],
    relations: {},
    pnj: {},
    pnjGeneres: {},
    roles: {},
    drapeaux: {},
    secrets: [],
    indices: [],
    objets: [],
    promesses: [],
    missions: {},
    evenementsVus: {},
    planifies: [],
    decouvertes: [],
    succes: [],
    journal: [],
    historique: [],
    scene: { type: 'temps_libre' },
    chapitre: 1,
    actions: [],
    sequences: [],
  };
}

function etatPnj(s: GameState, def: NpcDef): NpcState {
  const naissance = s.naissance - def.ecart * JOURS_AN;
  const st: NpcState = { etat: 'vivant', naissance, maitrises: {}, rencontre: false };
  for (const m of def.maitrises) {
    const mdef = R.maitrises[m.id];
    if (!mdef) throw new Error(`[création] maîtrise inconnue pour ${def.id} : ${m.id}`);
    const ms = nouvelleMaitrise(mdef, m.potentiel ?? 60, 'heritage');
    if (m.palier >= 1) {
      ms.awakened = true;
      ms.tier = m.palier;
      ms.awakenedAtDay = s.jour - 720;
      ms.awakenedAtAge = Math.max(0, ageA(naissance, s.jour) - 2);
      ms.trainingDays = exigence(mdef, m.palier as 1 | 2 | 3 | 4 | 5).jours;
      ms.combatUses = exigence(mdef, m.palier as 1 | 2 | 3 | 4 | 5).combats;
    }
    st.maitrises[m.id] = ms;
  }
  return st;
}

function genererFamille(s: GameState): void {
  const c = s.creation;
  const clan = R.clans[c.clan];
  const noms = R.contenu.noms[c.village];
  const orphelin = c.origine === 'orphelin';
  // Seuls les clans portent un nom : la famille d'un sans-clan n'a que des prénoms.
  const pris = new Set(R.contenu.pnj.filter((p) => p.village === c.village).map((p) => p.nom.split(' ')[0]));
  const tirerNom = (g: 'm' | 'f') => {
    const liste = noms[g].filter((n) => !pris.has(n)).length ? noms[g].filter((n) => !pris.has(n)) : noms[g];
    return [liste[Math.floor(alea(s) * liste.length)], c.nom].filter(Boolean).join(' ');
  };
  const genreParent: 'm' | 'f' = alea(s) < 0.5 ? 'm' : 'f';
  const genreAine: 'm' | 'f' = alea(s) < 0.5 ? 'm' : 'f';
  const ecartParent = orphelin ? aleaEntier(s, 38, 52) : aleaEntier(s, 24, 32);
  const sansClan = c.clan === 'sans_clan';
  const techniques = (clan?.techniques ?? []).filter((t) => !R.maitrises[t]?.cachee);

  const maitrisesFamille = (agePnj: number, prodige: boolean, paliersVises: [number, number]) => {
    const cap = maxTierForAge(agePnj, prodige);
    const res: { id: string; palier: MasteryTier; potentiel: number }[] = [];
    for (const t of techniques) {
      const mdef = R.maitrises[t];
      const aEveil = !!mdef?.eveil;
      const eveille = !aEveil || (mdef.eveil!.automatique !== undefined ? agePnj >= mdef.eveil!.automatique! : alea(s) < 0.7);
      const visee = aleaEntier(s, paliersVises[0], paliersVises[1]);
      res.push({ id: t, palier: (eveille ? Math.max(1, Math.min(cap, visee)) : 0) as MasteryTier, potentiel: aleaEntier(s, 50, 95) });
    }
    res.push({ id: 'taijutsu', palier: Math.min(cap, paliersVises[1]) as MasteryTier, potentiel: 60 });
    res.push({ id: 'ninjutsu', palier: Math.min(cap, paliersVises[1]) as MasteryTier, potentiel: 60 });
    return res;
  };

  const ageParent = c.ageDepart + ecartParent;
  const parent: NpcDef = orphelin
    ? {
        id: 'famille_parent',
        nom: tirerNom(genreParent),
        genre: genreParent,
        village: c.village,
        clan: 'sans_clan',
        role: 'parent',
        ecart: ecartParent,
        rang: 'chunin',
        personnalite: 'Bourru·e, juste, épuisé·e par trente enfants qui ne sont pas les siens.',
        objectifs: 'Qu’aucun enfant de l’orphelinat ne finisse dans la rue ou sous une stèle.',
        histoire: 'Ancien·ne chūnin blessé·e pendant la Deuxième Grande Guerre, devenu·e directeur·rice de l’orphelinat du village.',
        valeurs: ['devoir', 'protection'],
        alliances: [],
        rivalites: [],
        limites: 'Ne mentira jamais à un enfant sur ses parents, mais ne dira pas tout.',
        aime: ['honnetete', 'travail', 'loyaute'],
        deteste: ['fierte'],
        maitrises: maitrisesFamille(ageParent, false, [2, 3]),
        rythme: 0.3,
        relationInitiale: { amitie: 35, confiance: 40, attachement: 40, respect: 45 },
      }
    : {
        id: 'famille_parent',
        nom: tirerNom(genreParent),
        genre: genreParent,
        village: c.village,
        clan: c.clan,
        role: 'parent',
        ecart: ecartParent,
        rang: sansClan ? (alea(s) < 0.5 ? 'civil' : 'chunin') : alea(s) < 0.5 ? 'jonin' : 'chunin',
        personnalite: 'Protecteur·rice, exigeant·e, marqué·e par la dernière guerre.',
        objectifs: 'Que son enfant survive au monde qu’il a connu.',
        histoire: sansClan
          ? 'Issu·e d’une famille sans lignée, a gagné chaque chose à la force du travail.'
          : `A grandi sous le poids des traditions du clan ${clan?.nom}. A combattu pendant la Deuxième Grande Guerre.`,
        valeurs: ['famille', 'devoir'],
        alliances: [],
        rivalites: [],
        limites: 'Ne trahira jamais le village, même pour son enfant.',
        aime: ['loyaute', 'travail', 'honnetete'],
        deteste: ['fierte'],
        maitrises: maitrisesFamille(ageParent, false, [3, 4]),
        rythme: 0.6,
        relationInitiale: { amitie: 50, confiance: 50, attachement: 60, respect: 40 },
      };
  const prodigeAine = alea(s) < 0.3;
  const ageAine = c.ageDepart + 4;
  const aine: NpcDef = {
    id: 'famille_aine',
    nom: tirerNom(genreAine),
    genre: genreAine,
    village: c.village,
    clan: c.clan,
    role: 'aine',
    ecart: 4,
    rang: ageAine >= 12 ? 'genin' : 'eleve',
    personnalite: prodigeAine ? 'Brillant·e, secret·e, porte des attentes trop lourdes.' : 'Chaleureux·se, têtu·e, protecteur·rice.',
    objectifs: 'Être à la hauteur de ce qu’on attend de lui ou d’elle.',
    histoire: orphelin
      ? 'Arrivé·e à l’orphelinat le même hiver que toi. Personne ne vous a demandé votre avis : vous êtes devenus frère et sœur de cœur.'
      : prodigeAine
        ? 'Considéré·e comme un prodige depuis l’Académie.'
        : 'Un élève ordinaire, devenu ninja à force d’obstination.',
    valeurs: ['protection', 'fierte'],
    alliances: [],
    rivalites: [],
    limites: 'Ne te mettra jamais en danger volontairement.',
    aime: ['audace', 'loyaute', 'humour'],
    deteste: ['prudence'],
    maitrises: maitrisesFamille(ageAine, prodigeAine, [1, 2]),
    rythme: prodigeAine ? 1.4 : 1,
    prodige: prodigeAine,
    relationInitiale: { amitie: 45, confiance: 40, attachement: 55, respect: 30 },
  };
  s.pnjGeneres[parent.id] = parent;
  s.pnjGeneres[aine.id] = aine;
  if (parent.rang === 'civil') s.drapeaux['parent_civil'] = true;
}

/** Ce que le destin décide à la naissance : talent, bête scellée, lignée de fusion. Tiré avec la graine : rejouable. */
function tirerDestin(s: GameState): void {
  const c = s.creation;
  s.tirages.prodige = alea(s) < CHANCE_PRODIGE;
  const bijus = R.contenu.bijus.filter((b) => b.village === c.village);
  const jinchuriki = alea(s) < chanceJinchuriki(c);
  const choixBiju = alea(s);
  if (jinchuriki && bijus.length) s.tirages.biju = bijus[Math.floor(choixBiju * bijus.length)].id;
  for (const m of R.contenu.maitrises) {
    const p = m.composantes ? (m.lignee?.[c.village] ?? 0) : 0;
    if (p > 0 && alea(s) < p) s.tirages.lignees.push(m.id);
  }
}

/**
 * Démarre une partie. `imposes` force les tirages du destin : réservé aux tests et au débogage
 * (une partie créée ainsi ne se rejoue pas à l'identique depuis sa seule création).
 */
export function nouvellePartie(creation: Creation, graine?: number, imposes?: Partial<Tirages>): GameState {
  const erreurs = validerCreation(creation);
  if (erreurs.length) throw new Error(erreurs.join(' '));
  const seed = (graine ?? Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const s = etatVide(creation, seed);
  const c = s.creation;
  const village = R.villages[c.village];
  const clan = R.clans[c.clan];
  s.naissance = JOUR_DEPART - c.ageDepart * JOURS_AN - aleaEntier(s, 0, 300);
  tirerDestin(s);
  if (imposes) Object.assign(s.tirages, imposes);
  // Traits effectifs : ceux choisis, plus le don tiré à la naissance.
  const traitsEffectifs = [...c.traits, ...(s.tirages.prodige ? ['prodige'] : [])];

  // Attributs
  s.attributs[c.aptitude] += 20;
  for (const src of [village.bonus, clan.bonus, ...traitsEffectifs.map((t) => R.traits[t].bonus)]) {
    for (const [k, v] of Object.entries(src)) s.attributs[k as AttributId] += v ?? 0;
  }
  if (c.ageDepart === 10) {
    s.attributs.force += 8;
    s.attributs.agilite += 8;
    s.attributs.perception += 4;
    s.attributs.intellect += 4;
    s.attributs.controleEmotionnel += 4;
  }
  for (const a of ATTRIBUTS) s.attributs[a] = clamp(s.attributs[a], 5, 100);
  for (const t of traitsEffectifs) {
    for (const [k, v] of Object.entries(R.traits[t].ethique ?? {})) s.ethique[k as keyof typeof s.ethique] += v ?? 0;
    for (const [k, v] of Object.entries(R.traits[t].social ?? {})) s.social[k as keyof typeof s.social] += v ?? 0;
  }
  s.jauges.chakraMax = 30 + clan.chakraBonus + (c.ageDepart === 10 ? 24 : 0);
  s.jauges.chakra = s.jauges.chakraMax;
  if (c.clan === 'sans_clan') s.social.confianceClan = 0;

  // Maîtrises de départ
  const bonusDiff = c.difficulte === 'recit' ? 10 : c.difficulte === 'legende' ? -5 : 0;
  const ajouter = (id: string, potentiel: number) => {
    const def = R.maitrises[id];
    if (!def) throw new Error(`[création] maîtrise inconnue : ${id}`);
    s.maitrises[id] = nouvelleMaitrise(def, clamp(Math.round(potentiel), 0, 100), def.kind === 'clan' ? 'heritage' : 'creation');
  };
  ajouter('taijutsu', 40 + s.attributs.force / 4 + aleaEntier(s, -5, 10));
  ajouter('ninjutsu', 40 + s.attributs.controleChakra / 4 + aleaEntier(s, -5, 10));
  ajouter('genjutsu', 35 + s.attributs.intellect / 4 + aleaEntier(s, -5, 10));
  ajouter(`nature_${c.element}`, 45 + aleaEntier(s, 0, 25));
  for (const t of clan.techniques) ajouter(t, aleaEntier(s, 20, 100) + bonusDiff);
  // Lignées de fusion : latentes jusqu'à l'éveil de leurs deux natures.
  for (const id of s.tirages.lignees) {
    ajouter(id, aleaEntier(s, 60, 95));
    s.maitrises[id].source = 'heritage';
  }
  // Jinchūriki : la bête est scellée depuis la naissance ; son chakra dort derrière le sceau.
  if (s.tirages.biju) {
    ajouter('chakra_biju', 80);
    s.maitrises['chakra_biju'].source = 'heritage';
    s.drapeaux['jinchuriki'] = s.tirages.biju;
    s.jauges.chakraMax += 40;
    s.jauges.chakra = s.jauges.chakraMax;
  }
  if (s.tirages.prodige) s.drapeaux['prodige'] = true;
  appliquerHeritage(s);
  if (c.origine === 'orphelin') s.drapeaux['orphelin'] = true;
  if (c.ageDepart === 10) {
    for (const id of ['taijutsu', 'ninjutsu', 'genjutsu']) s.maitrises[id].trainingDays = 40;
    s.maitrises['taijutsu'].tier = 1;
    s.maitrises['ninjutsu'].tier = 1;
  }

  // Registre des armes uniques
  for (const w of R.contenu.armes) {
    if (w.unique) s.registre[w.id] = { detenteur: w.detenteurInitial ?? 'perdue', depuis: JOUR_DEPART - 10 * JOURS_AN };
  }

  // Monde : PNJ du contenu + famille générée
  genererFamille(s);
  for (const def of [...R.contenu.pnj, ...Object.values(s.pnjGeneres)]) s.pnj[def.id] = etatPnj(s, def);
  s.roles = { ...R.contenu.roles[c.village], parent: 'famille_parent', aine: 'famille_aine' };
  for (const def of [...R.contenu.pnj, ...Object.values(s.pnjGeneres)]) {
    if (def.relationInitiale) s.relations[def.id] = { confiance: 0, respect: 0, amitie: 0, rivalite: 0, hostilite: 0, attachement: 0, rompue: false, souvenirs: [], ...def.relationInitiale };
  }
  s.pnj['famille_parent'].rencontre = true;
  s.pnj['famille_aine'].rencontre = true;

  // Arme d'Académie
  const ctx = nouveauCtx();
  obtenirArme(s, 'kunai_academie', 'possedee', ctx);

  // Drapeaux d'origine
  if (c.clan === 'hyuga') s.drapeaux['hyuga_branche'] = alea(s) < 0.3 ? 'principale' : 'secondaire';
  if (c.clan === 'yuki') {
    s.secrets.push('lignee_yuki');
    s.social.suspicion = 10;
  }

  // Connaissances initiales
  s.decouvertes.push(
    `village:${c.village}`,
    `clan:${c.clan}`,
    `element:${c.element}`,
    `lieu:${c.village}`,
    'pnj:famille_parent',
    'pnj:famille_aine',
    'histoire:ere',
  );
  for (const t of clan.techniques) if (!R.maitrises[t]?.cachee) s.decouvertes.push(`pouvoir:${t}`);

  eveilsAutomatiques(s, ctx);
  s.journal.push({ jour: s.jour, texte: `Début de ton histoire, à ${c.ageDepart} ans, à ${village.nom}.`, importance: 3 });
  if (s.tirages.prodige)
    s.journal.push({ jour: s.jour, texte: 'Très tôt, les adultes remarquent que tu comprends tout plus vite que les autres. Certains s’en réjouissent ; d’autres t’observent.', importance: 3 });

  ouvrirSequence(s);
  const premier = choisirSuivant(s);
  if (premier) entrerEvenement(s, premier);
  else s.scene = { type: 'temps_libre' };
  return s;
}

/** Héritage acheté à la boutique : un avantage de départ, appliqué une seule fois à la création. */
function appliquerHeritage(s: GameState): void {
  const h = s.creation.heritage;
  if (!h) return;
  const ctx = nouveauCtx();
  s.drapeaux[`heritage_${h}`] = true;
  switch (h) {
    case 'bourse':
      s.jauges.ryo += 150;
      break;
    case 'corps':
      s.attributs.force = clamp(s.attributs.force + 6, 5, 100);
      s.attributs.agilite = clamp(s.attributs.agilite + 6, 5, 100);
      break;
    case 'esprit':
      s.attributs.intellect = clamp(s.attributs.intellect + 10, 5, 100);
      break;
    case 'reserve':
      s.jauges.chakraMax += 25;
      s.jauges.chakra = s.jauges.chakraMax;
      s.attributs.controleChakra = clamp(s.attributs.controleChakra + 6, 5, 100);
      break;
    case 'lame': {
      const arme = R.contenu.armesHeritage.clan[s.creation.clan] ?? R.contenu.armesHeritage.village[s.creation.village];
      if (arme && R.armes[arme] && !R.armes[arme].unique) {
        obtenirArme(s, arme, 'possedee', ctx);
        const fam = `famille_${R.armes[arme].famille}`;
        if (s.maitrises[fam]) s.maitrises[fam].tier = Math.max(1, s.maitrises[fam].tier) as MasteryTier;
        s.armeEquipee = arme;
      }
      break;
    }
    case 'mentor':
      break;
  }
  const def = R.contenu.heritages.find((x) => x.id === h);
  if (def) s.journal.push({ jour: s.jour, texte: `Héritage : ${def.nom}.`, importance: 2 });
}

// ── Séquences de vie ─────────────────────────────────────────

function instantane(s: GameState): Instantane {
  const paliers: Record<string, number> = {};
  for (const [id, m] of Object.entries(s.maitrises)) if (m.awakened && !m.bloquee) paliers[id] = m.tier;
  return {
    jour: s.jour,
    age: age(s),
    attributs: { ...s.attributs },
    social: { ...s.social },
    ryo: s.jauges.ryo,
    chakraMax: s.jauges.chakraMax,
    paliers,
    secrets: s.secrets.length,
    missionsReussies: Object.values(s.missions).filter((m) => m === 'reussie').length,
    decisions: s.historique.length,
    journal: s.journal.length,
  };
}

export function sequenceCourante(s: GameState) {
  const v = s.sequences[s.sequences.length - 1];
  return v && !v.fin ? v : undefined;
}

/** Ouvre la première séquence (après la dernière vécue) dont la condition est remplie. */
function ouvrirSequence(s: GameState): void {
  const deja = new Set(s.sequences.map((x) => x.id));
  const def = R.contenu.sequences.find((x) => !deja.has(x.id) && evaluer(x.si, s));
  if (def) s.sequences.push({ id: def.id, debut: instantane(s) });
}

/** Si la séquence courante vient de s'achever, la clôt et montre son bilan. */
function cloreSequenceSiFinie(s: GameState): boolean {
  const v = sequenceCourante(s);
  if (!v || s.fin) return false;
  const def = R.contenu.sequences.find((x) => x.id === v.id);
  if (!def || !evaluer(def.fin, s)) return false;
  v.fin = instantane(s);
  s.scene = { type: 'bilan', sequence: v.id };
  return true;
}

// ── Déroulement ──────────────────────────────────────────────

const CHOIX_PASSER: ChoiceDef = {
  id: '__passer',
  texte: 'Laisser les choses suivre leur cours',
  effets: [],
  resultat: 'Tu laisses passer le moment.',
};

export interface VueChoix {
  id: string;
  texte: string;
  disponible: boolean;
  verrou?: string;
  indice?: string;
  risque?: NiveauRisque;
  /** Chance de réussite, en pourcentage, et l'attribut qui la décide. */
  chance?: number;
  /** Combat en plusieurs manches. */
  manches?: number;
  principal?: AttributId;
  duree?: string;
  /** Attaques spéciales proposées sur ce combat (identifiant « choix@technique »). */
  attaques?: { id: string; technique: string; nom: string; chakra: number; risque: NiveauRisque; chance: number; avantage?: 'fort' | 'faible' }[];
}

/** Comment une attaque spéciale entre dans le récit, selon sa famille. */
const VERBE_ATTAQUE: Record<string, string> = {
  ninjutsu: 'Tu composes les signes et tu lances',
  taijutsu: 'Tu jettes tout ton corps dans',
  genjutsu: 'Tu tisses',
  armes: 'Tu déclenches',
  medical: 'Tu concentres ton chakra en',
  fuinjutsu: 'Tu actives',
  fusion: 'Tu libères',
  biju: 'Tu laisses monter',
  combinaison: 'Tu mêles tes deux natures et tu libères',
  dojutsu: 'Tes yeux s’embrasent :',
};

/** Le combat tel qu'il se joue avec une attaque spéciale : bonus de la technique ajouté au modificateur. */
function testAvecTechnique(s: GameState, t: CheckDef, tech: string): CheckDef {
  return { ...t, modificateur: (t.modificateur ?? 0) + bonusTechnique(s, tech, t) };
}

export function choixVisibles(s: GameState, ev: EventDef): VueChoix[] {
  const res: VueChoix[] = [];
  let attaquesPlacees = false;
  for (const c of ev.choix) {
    const ok = evaluer(c.si, s);
    if (!ok && !c.verrou) continue;
    // Les attaques spéciales se greffent sur le premier choix de combat de la scène.
    const attaques =
      ok && c.test?.type === 'combat' && !attaquesPlacees
        ? attaquesSpeciales(s, c.test).map((tech) => {
            const def = R.maitrises[tech];
            const ev2 = evaluerEpreuve(s, testAvecTechnique(s, c.test!, tech));
            return {
              id: `${c.id}@${tech}`,
              technique: tech,
              nom: def.nom,
              chakra: def.technique!.chakra,
              risque: ev2.risque,
              chance: Math.round(ev2.proba * 100),
              avantage: avantageTechnique(tech, c.test!.elementAdverse),
            };
          })
        : undefined;
    if (attaques?.length) attaquesPlacees = true;
    const evalTest = ok && c.test ? evaluerEpreuve(s, c.test) : undefined;
    res.push({
      id: c.id,
      texte: interpoler(c.texte, s),
      disponible: ok,
      verrou: ok ? undefined : interpoler(c.verrou!, s),
      indice: c.indice ? interpoler(c.indice, s) : undefined,
      risque: evalTest?.risque,
      chance: evalTest ? Math.round(evalTest.proba * 100) : undefined,
      manches: ok && c.test && nombreManches(c.test) > 1 ? nombreManches(c.test) : undefined,
      principal: evalTest?.principal,
      duree: c.duree ? libelleDuree(c.duree) : undefined,
      attaques: attaques?.length ? attaques : undefined,
    });
  }
  if (!res.some((c) => c.disponible)) res.push({ id: CHOIX_PASSER.id, texte: CHOIX_PASSER.texte, disponible: true });
  return res;
}

/** Payer une attaque spéciale (chakra, santé), en tirer de l'expérience, et renforcer le test. */
function lancerTechnique(s: GameState, test: CheckDef, tech: string, ctx: Ctx): { test: CheckDef; prelude: string } {
  const def = R.maitrises[tech];
  const t = def.technique!;
  s.jauges.chakra = clamp(s.jauges.chakra - t.chakra, 0, s.jauges.chakraMax);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: -t.chakra });
  if (t.sante) {
    s.jauges.sante = clamp(s.jauges.sante - t.sante, 1, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -t.sante });
  }
  applyCombatExperience(s, [tech, ...(def.element ? [`nature_${def.element}`] : []), ...(t.requis ?? []).map((x) => x.maitrise)], ctx);
  return { test: testAvecTechnique(s, test, tech), prelude: `${VERBE_ATTAQUE[t.categorie]} ${def.nom}. ` };
}

/** Une manche se raconte en une phrase ; l'ordre varie d'une manche à l'autre. */
const LIGNES_MANCHE: Record<IssueManche, string[]> = {
  touche: ['Le coup porte : ton adversaire recule d’un pas, le souffle coupé.', 'Tu touches. Pour la première fois, tu vois de la peur dans ses yeux.', 'Ça passe sa garde. Il saigne.', 'Il ne l’a pas vu venir. Il pose un genou à terre, puis se relève.'],
  esquive: ['Il esquive d’un bond, comme s’il avait lu ton geste avant toi.', 'Une substitution : ton coup frappe une bûche. Il est déjà ailleurs.', 'Il pare, de justesse, et reprend ses distances.', 'Le coup fend l’air. Il te regarde, et sourit.'],
  riposte: ['Il esquive et riposte dans le même geste. Une douleur vive au flanc.', 'Il contre et te projette au sol. Tu te relèves avec du sang dans la bouche.', 'Tu frappes dans le vide ; sa lame, elle, trouve ton épaule.', 'Il attendait exactement ça. Le coup en retour te coupe le souffle.'],
};

function finaliserChoix(s: GameState, ev: EventDef, choixId: string, libelle: string, texte: string, suite: string | undefined, issue: Issue | undefined, ctx: Ctx): void {
  s.historique.push({ jour: s.jour, evenementId: ev.id, titre: interpoler(ev.titre, s), choixId, choix: libelle, issue });
  verifierFin(s);
  verifierSucces(s, ctx);
  s.scene = { type: 'resultat', evenementId: ev.id, titre: interpoler(ev.titre, s), choix: libelle, texte, changements: ctx.changements, suite, issue };
}

function texteMort(prelude: string): string {
  return `${prelude}Tout va très vite. Un coup que tu n’as pas vu venir, puis le froid qui monte. Les voix s’éloignent. Tu penses à quelqu’un, tu ne sais plus qui. Puis plus rien.`;
}

function choisirMut(s: GameState, choixId: string): void {
  if (s.scene.type !== 'evenement') throw new Error('Aucun événement en cours.');
  const ev = R.evenements[s.scene.id];
  const [baseId, tech] = choixId.split('@');
  let ch = ev.choix.find((c) => c.id === baseId);
  if (tech) {
    const vue = choixVisibles(s, ev).find((c) => c.id === baseId);
    if (!ch?.test || ch.test.type !== 'combat' || !vue?.attaques?.some((a) => a.technique === tech) || !attaqueDisponible(s, tech))
      throw new Error('Attaque spéciale indisponible.');
  }
  if (choixId === CHOIX_PASSER.id) {
    if (choixVisibles(s, ev).some((c) => c.id !== CHOIX_PASSER.id && c.disponible)) throw new Error('Choix indisponible.');
    ch = CHOIX_PASSER;
  }
  if (!ch) throw new Error(`Choix inconnu : ${choixId}`);
  if (ch !== CHOIX_PASSER && !evaluer(ch.si, s)) throw new Error('Choix indisponible : prérequis non remplis.');

  s.actions.push({ a: 'choix', id: choixId });
  s.annonce = undefined;
  const ctx: Ctx = nouveauCtx();
  // Combat en plusieurs manches : le choix ouvre l'affrontement, la première manche se joue tout de suite.
  if (ch.test && nombreManches(ch.test) > 1) {
    s.scene = { type: 'combat', evenementId: ev.id, choixId: baseId, manche: 0, total: nombreManches(ch.test), touches: 0, ripostes: 0, resultats: [], journal: [], techniques: [], chakra: 0, sante: 0 };
    jouerManche(s, tech);
    return;
  }
  let texte: string;
  let suite = ch.suite;
  let issue: Issue | undefined;
  if (ch.test) {
    let test = ch.test;
    let prelude = '';
    if (tech) ({ test, prelude } = lancerTechnique(s, ch.test, tech, ctx));
    const r = resoudreEpreuve(s, test, ctx);
    issue = r.issue;
    if (r.mort) {
      // Mort au combat : la scène s'arrête là, ses autres conséquences n'ont plus lieu.
      s.drapeaux['cause_mort'] = test.causeMort ? interpoler(test.causeMort, s) : `tombé·e au combat (${interpoler(ev.titre, s).toLowerCase()})`;
      texte = texteMort(prelude);
    } else {
      appliquerEffets(s, r.outcome.effets, ctx);
      texte = prelude + resoudreTexte(r.outcome.texte, s);
      suite = r.outcome.suite ?? suite;
    }
  } else {
    appliquerEffets(s, ch.effets, ctx);
    texte = resoudreTexte(ch.resultat, s);
  }
  if (ch.duree) avancerTemps(s, ch.duree, ctx);
  const libelle = interpoler(ch.texte, s) + (tech ? ` — ${R.maitrises[tech].nom}` : '');
  finaliserChoix(s, ev, choixId, libelle, texte, suite, issue, ctx);
}

/** Deux natures différentes enchaînées d'une manche à l'autre : si elles se combinent, la seconde frappe plus fort. */
function enchainement(s: GameState, precedente: string | undefined, tech: string): [ElementId, ElementId] | undefined {
  if (!precedente) return undefined;
  const els = (id: string) => R.maitrises[id]?.technique?.elements ?? (R.maitrises[id]?.element ? [R.maitrises[id].element!] : []);
  const a = els(precedente);
  const b = els(tech);
  for (const x of a)
    for (const y of b) {
      if (x === y) continue;
      const existe = R.contenu.maitrises.some((m) => m.technique?.categorie === 'combinaison' && m.technique.elements?.includes(x) && m.technique.elements.includes(y));
      if (existe) return [x, y];
    }
  return undefined;
}
const BONUS_ENCHAINEMENT = 12;

export interface VueAttaqueCombat {
  id: string;
  nom: string;
  chakra: number;
  chance: number;
  risque: NiveauRisque;
  avantage?: 'fort' | 'faible';
  enchainement?: string;
}

/** Les attaques possibles pour la manche en cours d'un combat. */
export function vueCombat(s: GameState): {
  titre: string;
  texte: string;
  manche: number;
  total: number;
  touches: number;
  ripostes: number;
  resultats: ('touche' | 'esquive' | 'riposte')[];
  journal: string[];
  simple: number;
  attaques: VueAttaqueCombat[];
  objets: { id: string; nom: string; effet: string; stock: number; chance: number }[];
} | undefined {
  if (s.scene.type !== 'combat') return undefined;
  const sc = s.scene;
  const ev = R.evenements[sc.evenementId];
  const ch = ev.choix.find((c) => c.id === sc.choixId)!;
  const t = ch.test!;
  const precedente = sc.techniques.at(-1);
  return {
    titre: interpoler(ev.titre, s),
    texte: interpoler(ch.texte, s),
    manche: sc.manche,
    total: sc.total,
    touches: sc.touches,
    ripostes: sc.ripostes,
    resultats: sc.resultats ?? [],
    journal: sc.journal,
    simple: Math.round(evaluerEpreuve(s, t).proba * 100),
    attaques: attaquesSpeciales(s, t, 6).map((tech) => {
      const ench = enchainement(s, precedente, tech);
      const base = testAvecTechnique(s, t, tech);
      const e = evaluerEpreuve(s, ench ? { ...base, modificateur: (base.modificateur ?? 0) + BONUS_ENCHAINEMENT } : base);
      return {
        id: tech,
        nom: R.maitrises[tech].nom,
        chakra: R.maitrises[tech].technique!.chakra,
        chance: Math.round(e.proba * 100),
        risque: e.risque,
        avantage: avantageTechnique(tech, t.elementAdverse),
        enchainement: ench ? `${R.elements[ench[0]]?.nom} → ${R.elements[ench[1]]?.nom}` : undefined,
      };
    }),
    objets: CONSOMMABLES.filter((c) => stock(s, c.id) > 0).map((c) => ({
      id: c.id,
      nom: c.nom,
      effet: c.effet,
      stock: stock(s, c.id),
      chance: Math.round(evaluerEpreuve(s, { ...t, modificateur: (t.modificateur ?? 0) + c.bonus }).proba * 100),
    })),
  };
}

/** Joue une manche (attaque simple, technique ou objet), puis conclut le combat à la dernière. */
function jouerManche(s: GameState, action?: string): void {
  if (s.scene.type !== 'combat') throw new Error('Aucun combat en cours.');
  const sc = s.scene;
  sc.resultats ??= [];
  const ev = R.evenements[sc.evenementId];
  const ch = ev.choix.find((c) => c.id === sc.choixId)!;
  const base = ch.test!;
  const objet = action?.startsWith('objet:') ? action.slice(6) : undefined;
  const tech = objet ? undefined : action;
  if (tech && (!attaqueDisponible(s, tech) || !attaquesSpeciales(s, base, 6).includes(tech))) throw new Error('Attaque spéciale indisponible.');
  const ctx = nouveauCtx();
  let test = base;
  let prelude = '';
  let protege = false;
  if (tech) {
    const ench = enchainement(s, sc.techniques.at(-1), tech);
    ({ test, prelude } = lancerTechnique(s, base, tech, ctx));
    if (ench) {
      test = { ...test, modificateur: (test.modificateur ?? 0) + BONUS_ENCHAINEMENT };
      prelude = `Enchaînement ! Ton ${R.elements[ench[0]]?.nom} nourrit ton ${R.elements[ench[1]]?.nom}. ${prelude}`;
      s.drapeaux['enchainements'] = (Number(s.drapeaux['enchainements']) || 0) + 1;
    }
    sc.techniques.push(tech);
  } else if (objet) {
    const c = utiliserConsommable(s, objet, ctx);
    test = { ...base, modificateur: (base.modificateur ?? 0) + c.bonus };
    prelude = `${c.recit} `;
    protege = !!c.protege;
  }
  const r = resoudreManche(s, test, ctx, protege);
  const lignes = LIGNES_MANCHE[r.issue];
  const ligne = lignes[(sc.manche + (tech?.length ?? 0) + sc.touches) % lignes.length];
  if (r.issue === 'touche') sc.touches++;
  if (r.issue === 'riposte') sc.ripostes++;
  sc.resultats.push(r.issue);
  sc.manche++;
  sc.journal.push(`Manche ${sc.manche}. ${prelude || 'Tu attaques sans technique, au plus simple. '}${ligne}`);
  if (sc.manche < sc.total) return;

  // Dernière manche : l'issue du combat dépend de l'ensemble.
  const fin = nouveauCtx();
  fin.changements.push(...ctx.changements);
  const res = conclureCombat(s, base, sc.touches, sc.ripostes, sc.total, fin);
  const recit = sc.journal.join('\n\n');
  let texte: string;
  let suite = ch.suite;
  if (res.mort) {
    s.drapeaux['cause_mort'] = base.causeMort ? interpoler(base.causeMort, s) : `tombé·e au combat (${interpoler(ev.titre, s).toLowerCase()})`;
    texte = `${recit}\n\n${texteMort('')}`;
  } else {
    appliquerEffets(s, res.outcome.effets, fin);
    texte = `${recit}\n\n${resoudreTexte(res.outcome.texte, s)}`;
    suite = res.outcome.suite ?? suite;
  }
  if (ch.duree) avancerTemps(s, ch.duree, fin);
  const noms = Array.from(new Set(sc.techniques)).map((t) => R.maitrises[t].nom);
  const libelle = interpoler(ch.texte, s) + (noms.length ? ` — ${noms.join(', ')}` : '');
  finaliserChoix(s, ev, sc.choixId, libelle, texte, suite, res.issue, fin);
}

function mancheMut(s: GameState, id: string): void {
  if (s.scene.type !== 'combat') throw new Error('Aucun combat en cours.');
  s.actions.push({ a: 'manche', id });
  jouerManche(s, id === 'simple' ? undefined : id);
}

export function manche(s0: GameState, id: string): GameState {
  const s = cloner(s0);
  mancheMut(s, id);
  return s;
}

function continuerMut(s: GameState): void {
  if (s.scene.type !== 'resultat' && s.scene.type !== 'bilan') throw new Error('Rien à poursuivre.');
  s.actions.push({ a: 'continuer' });
  s.annonce = undefined;
  if (s.fin) {
    s.scene = { type: 'fin', id: s.fin.id };
    return;
  }
  let suite: string | undefined;
  if (s.scene.type === 'bilan') {
    // Après le bilan, une nouvelle séquence de vie commence.
    ouvrirSequence(s);
  } else {
    suite = s.scene.suite;
    // Une suite forcée (scène enchaînée) passe avant le bilan ; sinon, la séquence se clôt ici.
    if (!(suite && R.evenements[suite]) && cloreSequenceSiFinie(s)) return;
  }
  const id = choisirSuivant(s, suite);
  if (id) entrerEvenement(s, id);
  else s.scene = { type: 'temps_libre' };
}

function activiteMut(s: GameState, id: string): void {
  if (s.scene.type !== 'temps_libre') throw new Error('Pas de temps libre en ce moment.');
  s.actions.push({ a: 'activite', id });
  s.annonce = undefined;
  const ctx = nouveauCtx();
  const r = faireActivite(s, id, ctx);
  verifierFin(s);
  verifierSucces(s, ctx);
  if (r.resteEnTempsLibre && !s.fin) {
    s.annonce = r.texte;
    return;
  }
  s.scene = {
    type: 'resultat',
    evenementId: '__temps_libre',
    titre: 'Temps libre',
    choix: r.libelle,
    texte: r.texte,
    changements: sansDoublons(ctx.changements),
    suite: r.suite,
  };
}

/** Un même message répété par chaque bloc d'une longue période n'est affiché qu'une fois. */
function sansDoublons(ch: Changement[]): Changement[] {
  const vus = new Set<string>();
  return ch.filter((c) => {
    if (c.t !== 'info' && c.t !== 'soin') return true;
    if (vus.has(c.message)) return false;
    vus.add(c.message);
    return true;
  });
}

export function appliquerActionMut(s: GameState, a: Action): void {
  if (a.a === 'choix') choisirMut(s, a.id);
  else if (a.a === 'continuer') continuerMut(s);
  else if (a.a === 'points') pointsMut(s, a.repartition);
  else if (a.a === 'chapitre') chapitreMut(s);
  else if (a.a === 'manche') mancheMut(s, a.id);
  else activiteMut(s, a.id);
}

/** Répartir ses points de stat : possible à tout moment de la vie, sans consommer de temps. */
function pointsMut(s: GameState, rep: Partial<Record<AttributId, number>>): void {
  repartirPoints(s, rep);
  s.actions.push({ a: 'points', repartition: { ...rep } });
}

/** La fin de chapitre atteinte ouvre-t-elle un chapitre suivant ? */
export function chapitreSuivantDisponible(s: GameState): boolean {
  if (s.scene.type !== 'fin' || !s.fin) return false;
  const suite = R.fins[s.fin.id]?.suite;
  return !!suite && !!R.evenements[suite];
}

/** Continuer au chapitre suivant : la vie reprend là où le chapitre s'est arrêté. */
function chapitreMut(s: GameState): void {
  if (!chapitreSuivantDisponible(s)) throw new Error('Aucun chapitre suivant.');
  const fin = s.fin!;
  s.actions.push({ a: 'chapitre' });
  s.drapeaux[`fin_${fin.id}`] = true;
  s.fin = undefined;
  s.chapitre += 1;
  ajouterJournal(s, `Chapitre ${s.chapitre}.`, 3);
  entrerEvenement(s, R.fins[fin.id].suite!);
}

export function chapitreSuivant(s0: GameState): GameState {
  const s = cloner(s0);
  chapitreMut(s);
  return s;
}

export function repartir(s0: GameState, rep: Partial<Record<AttributId, number>>): GameState {
  const s = cloner(s0);
  pointsMut(s, rep);
  return s;
}

export function choisir(s0: GameState, choixId: string): GameState {
  const s = cloner(s0);
  choisirMut(s, choixId);
  return s;
}

export function continuer(s0: GameState): GameState {
  const s = cloner(s0);
  continuerMut(s);
  return s;
}

export function activite(s0: GameState, id: string): GameState {
  const s = cloner(s0);
  activiteMut(s, id);
  return s;
}

/** Reconstruit une partie à partir de ses décisions : c'est la seule source de vérité (validation serveur). */
export function rejouer(creation: Creation, graine: number, actions: Action[]): GameState {
  const s = nouvellePartie(creation, graine);
  for (const a of actions) appliquerActionMut(s, a);
  return s;
}

// ── Vues pour l'interface ────────────────────────────────────

export interface VuePersonnage {
  id: string;
  nom: string;
  role: string;
  genre: 'm' | 'f';
  village?: VillageId;
  clan?: string;
  teinte?: number;
  etat: string;
}

export interface VueEvenement {
  id: string;
  titre: string;
  texte: string;
  lieu: LieuDef;
  periode: string;
  personnages: VuePersonnage[];
  choix: VueChoix[];
  rare: boolean;
  categorie: string;
}

export function vuePersonnage(s: GameState, ref: string): VuePersonnage | undefined {
  const id = resoudrePnj(s, ref);
  const d = defPnj(s, id);
  if (!id || !d) return undefined;
  return { id, nom: d.nom, role: d.role, genre: d.genre, village: d.village, clan: d.clan, teinte: d.teinte, etat: s.pnj[id]?.etat ?? 'vivant' };
}

export function lieuCourant(s: GameState, lieu: string): LieuDef {
  return R.lieux[resoudreLieu(s, lieu)] ?? R.lieux[s.creation.village];
}

export function vueEvenement(s: GameState): VueEvenement | undefined {
  if (s.scene.type !== 'evenement') return undefined;
  const ev = R.evenements[s.scene.id];
  return {
    id: ev.id,
    titre: interpoler(ev.titre, s),
    texte: resoudreTexte(ev.texte, s),
    lieu: lieuCourant(s, ev.lieu),
    periode: libellePeriode(s),
    personnages: (ev.personnages ?? []).map((p) => vuePersonnage(s, p)).filter(Boolean) as VuePersonnage[],
    choix: choixVisibles(s, ev),
    rare: !!(ev.rare || ev.secret),
    categorie: ev.categorie,
  };
}

export { age, libellePeriode };
