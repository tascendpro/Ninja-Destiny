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
  FormeCombat,
  GameState,
  Issue,
  LieuDef,
  MasteryTier,
  NpcDef,
  NpcState,
  PorteeTechnique,
  Tirages,
  VillageId,
} from './types';
import { ATTRIBUTS } from './types';
import { R } from './registre';
import { JOURS_AN, age, ageA, libelleDuree, libellePeriode } from './calendrier';
import { Ctx, ajouterJournal, clamp, cloner, defPnj, nomDeFamille, nouveauCtx, resoudrePnj } from './etat';
import { alea, aleaEntier, tirerPondere } from './rng';
import { affrontementPour, jouerAffrontement, ouvrirAffrontement } from './combat/affrontement';
import { texteRepetition } from './combat/repetition';
import { techniqueAuContact, texteImpact, texteImpactJoueur, texteSombre, texteTechniqueTouche, tirageTexte } from './combat/impacts';
import { PORTEE_ESCOUADE, RATES_NOVICE } from '../content/combat/impacts';
import { accorderAdv } from './combat/affrontement';
import { CONTEXTES } from './combat/contextes';
import type { ActionCombat } from './combat/types';
import { reagirTransformation } from './reactions';
import { evaluer } from './conditions';
import { appliquerEffets } from './effets';
import { applyCombatExperience, exigence, eveilsAutomatiques, maxTierForAge, nouvelleMaitrise } from './maitrise';
import { obtenirArme } from './armes';
import { avancerTemps } from './temps';
import { choisirSuivant, entrerEvenement, resoudreLieu } from './selection';
import { repartirPoints } from './progression';
import { CONSOMMABLES, stock, utiliserConsommable } from './consommables';
import {
  MALUS_TIR_AMI,
  attaqueDisponible,
  attaquesSpeciales,
  avantageTechnique,
  avecAffrontement,
  bonusTechnique,
  bonusDojutsu,
  bonusPosture,
  chancePermutation,
  coutDojutsu,
  dojutsuDisponibles,
  texteDojutsu,
  chancePriorite,
  entreeTransformation,
  estTransformation,
  conclureCombat,
  evaluerEpreuve,
  natureQuiDomine,
  resoudreDefense,
  techniqueAdverse,
  CHAKRA_PERMUTATION,
  permutationPossible,
  testDefense,
  tirerTechniqueAdverse,
  usagesRestants,
  nombreManches,
  porteeTechnique,
  recitTechnique,
  resoudreEpreuve,
  resoudreManche,
  risqueAllie,
  texteTirAmi,
} from './epreuves';
import type { Defense, IssueManche, NiveauRisque } from './epreuves';
import { interpoler, resoudreTexte } from './texte';
import { faireActivite, naturesMaitrise } from './tempsLibre';
import { verifierFin, verifierSucces } from './fins';
import { partenaireDuo } from './duo';

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
    registresCombat: {},
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

/** Les rôles dont le visage change à chaque partie : même place dans l'histoire, autre nom, autre clan. */
const ROLES_TIRES = ['coequipierA', 'coequipierB', 'rival', 'sensei'] as const;
const POIDS_RARETE = { commun: 4, rare: 1, tres_rare: 0.3 } as const;
/** Les scènes d'origine de ces clans font d'un rôle ton cousin ou ta cousine : ce rôle est tiré dans ton clan. */
const COUSINS: Record<string, (typeof ROLES_TIRES)[number]> = { hyuga: 'coequipierB', hozuki: 'rival', kaguya: 'coequipierB', raiko: 'rival' };

/**
 * Camarades, rival et sensei sont tirés avec la graine de la partie : un prénom du village, un clan du village
 * (les clans rares plus rarement), et les pouvoirs de ce clan à la place de ceux du personnage d'origine.
 * Le genre et la personnalité du rôle restent : les textes qui en parlent restent justes.
 */
function genererVisages(s: GameState): void {
  const c = s.creation;
  const noms = R.contenu.noms[c.village];
  const pris = new Set([c.prenom, ...Object.values(s.pnjGeneres).map((p) => p.nom.split(' ')[0])]);
  const clans = R.contenu.clans.filter((k) => k.villages.includes(c.village));
  // Un clan déjà tiré devient moins probable : une équipe n'est pas une réunion de famille.
  const tires = new Map<string, number>();
  for (const role of ROLES_TIRES) {
    const base = R.pnj[R.contenu.roles[c.village][role]];
    if (!base) continue;
    const libres = noms[base.genre].filter((n) => !pris.has(n));
    const liste = libres.length ? libres : noms[base.genre];
    const prenom = liste[Math.floor(alea(s) * liste.length)];
    pris.add(prenom);
    const tire = tirerPondere(s, clans.map((k) => ({ item: k, poids: (k.id === 'sans_clan' ? 2 : POIDS_RARETE[k.rarete]) / (1 + 2 * (tires.get(k.id) ?? 0)) }))) ?? clans[0];
    const clan = COUSINS[c.clan] === role ? R.clans[c.clan] : tire;
    tires.set(clan.id, (tires.get(clan.id) ?? 0) + 1);
    // Les pouvoirs du clan d'origine cèdent la place à ceux du clan tiré, au même palier.
    const anciens = new Set(R.clans[base.clan ?? '']?.techniques ?? []);
    const paliers = base.maitrises.filter((m) => anciens.has(m.id)).map((m) => m.palier);
    const pouvoirs = clan.techniques
      .filter((t) => R.maitrises[t])
      .map((t, i) => ({ id: t, palier: paliers[i] ?? (role === 'sensei' ? 2 : 0), potentiel: aleaEntier(s, base.prodige ? 75 : 55, base.prodige ? 92 : 82) })) as NpcDef['maitrises'];
    const f = base.genre === 'f';
    const sansClan = clan.id === 'sans_clan';
    s.pnjGeneres[base.id] = {
      ...base,
      nom: sansClan ? prenom : `${prenom} ${clan.nom}`,
      clan: clan.id,
      // Ce que la fiche d'origine disait du clan d'origine ne vaut plus pour un autre clan.
      objectifs: clan.id === base.clan || !/branche|clan/.test(base.objectifs) ? base.objectifs : sansClan ? 'Se faire un nom que personne ne pourra lui retirer.' : `Être à la hauteur du clan ${clan.nom}, ou s’en libérer.`,
      limites: clan.id === base.clan || !/branche/.test(base.limites) ? base.limites : 'Ne s’humiliera jamais devant personne.',
      maitrises: [...base.maitrises.filter((m) => !anciens.has(m.id)), ...pouvoirs],
      histoire:
        role === 'sensei'
          ? base.histoire
          : sansClan
            ? `${f ? 'Née' : 'Né'} sans clan, dans une famille qui n’a que son nom. Tout ce qu’${f ? 'elle' : 'il'} obtiendra, il faudra le prendre.`
            : `${f ? 'Fille' : 'Fils'} d’une famille du clan ${clan.nom}. On attend beaucoup d’${f ? 'elle' : 'lui'}, et ${f ? 'elle' : 'il'} le sait.`,
    };
  }
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
  // Sang inconnu : un orphelin ou un enfant sans clan ne sait pas de qui il descend. Parfois, d'une lignée
  // perdue : n'importe quelle nature héréditaire, Mokuton et Hyōton compris, latente jusqu'à son éveil.
  const orphelin = c.origine === 'orphelin';
  const sansClan = c.clan === 'sans_clan';
  if (orphelin || sansClan) {
    const chance = orphelin && sansClan ? CHANCE_SANG_INCONNU.les_deux : orphelin ? CHANCE_SANG_INCONNU.orphelin : CHANCE_SANG_INCONNU.sans_clan;
    const tirage = alea(s);
    const choix = alea(s);
    const possibles = NATURES_HEREDITAIRES().filter((id) => !s.tirages.lignees.includes(id));
    if (tirage < chance && possibles.length) {
      const id = possibles[Math.floor(choix * possibles.length)];
      s.tirages.lignees.push(id);
      s.tirages.sangInconnu = id;
    }
  }
}

/** Chance de naître d'une lignée perdue, sans le savoir. */
export const CHANCE_SANG_INCONNU = { orphelin: 0.15, sans_clan: 0.12, les_deux: 0.25 };

/** Toutes les natures héréditaires : fusions de village et natures de clan (Mokuton, Hyōton). */
export const NATURES_HEREDITAIRES = (): string[] =>
  R.contenu.maitrises.filter((m) => m.composantes || ((m.id === 'mokuton' || m.id === 'hyoton') && m.kekkeiGenkai)).map((m) => m.id);

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
    // Une lignée perdue est toujours puissante : sans cela, le Mokuton ne s'éveillerait jamais.
    ajouter(id, id === s.tirages.sangInconnu ? Math.max(R.maitrises[id].eveil?.potentielMin ?? 0, aleaEntier(s, 75, 100)) : aleaEntier(s, 60, 95));
    s.maitrises[id].source = 'heritage';
  }
  if (s.tirages.sangInconnu) s.drapeaux['sang_inconnu'] = s.tirages.sangInconnu;
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

  // Monde : PNJ du contenu + famille générée + visages tirés (camarades, rival, sensei)
  genererFamille(s);
  genererVisages(s);
  for (const def of [...R.contenu.pnj, ...Object.values(s.pnjGeneres)]) s.pnj[def.id] = etatPnj(s, def);
  s.roles = { ...R.contenu.roles[c.village], parent: 'famille_parent', aine: 'famille_aine' };
  for (const def of [...R.contenu.pnj, ...Object.values(s.pnjGeneres)]) {
    if (def.relationInitiale) s.relations[def.id] = { confiance: 0, respect: 0, amitie: 0, rivalite: 0, hostilite: 0, attachement: 0, peur: 0, dette: 0, rompue: false, souvenirs: [], ...def.relationInitiale };
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
  attaques?: (VueAttaque & { technique: string })[];
  /** Duel ou escouade, et alliés dans la mêlée. */
  forme?: FormeCombat;
  allies?: boolean;
  /** Combat, épreuve (test de compétence) ou choix libre : l'interface en fait le kanji du talisman. */
  nature?: 'combat' | 'epreuve' | 'libre';
  /** On peut y mourir. */
  mortel?: boolean;
  /** Ce combat se joue en Affrontement Racine : son contexte (les issues ne sont jamais annoncées à l'avance). */
  affrontement?: { contexte: string; kanji: string };
}

/** Une attaque spéciale telle qu'on la propose : chances, récit selon la forme du combat, risque pour les alliés. */
export interface VueAttaque {
  id: string;
  nom: string;
  chakra: number;
  chance: number;
  risque: NiveauRisque;
  avantage?: 'fort' | 'faible';
  portee: PorteeTechnique;
  /** Ce que fait la technique sur ce terrain-là (duel ou escouade). */
  recit?: string;
  /** Chance de toucher un allié, en pourcentage (0 sans allié ou pour une technique ciblée). */
  risqueAllie: number;
  rang?: string;
  /** Technique interdite : la raison de l'interdiction. */
  kinjutsu?: string;
  /** Usages restants d'une technique comptée. */
  usages?: number;
  /** Le prix d'une technique ultime, lu avant de la lancer. */
  avertissement?: string;
  /** Natures de la technique (pour sa couleur). */
  natures: string[];
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
  transformation: 'Tu te transformes :',
};

/** Le combat tel qu'il se joue avec une attaque spéciale : bonus de la technique ajouté au modificateur. */
function testAvecTechnique(s: GameState, t: CheckDef, tech: string): CheckDef {
  return { ...t, modificateur: (t.modificateur ?? 0) + bonusTechnique(s, tech, t) };
}

function vueAttaque(s: GameState, tech: string, t: CheckDef, modificateur = 0): VueAttaque {
  const base = testAvecTechnique(s, t, tech);
  const e = evaluerEpreuve(s, { ...base, modificateur: (base.modificateur ?? 0) + modificateur });
  return {
    id: tech,
    nom: R.maitrises[tech].nom,
    chakra: R.maitrises[tech].technique!.chakra,
    chance: Math.round(e.proba * 100),
    risque: e.risque,
    avantage: avantageTechnique(tech, t.elementAdverse),
    portee: porteeTechnique(tech),
    recit: recitTechnique(s, tech, t),
    risqueAllie: Math.round(risqueAllie(s, tech, t) * 100),
    rang: R.maitrises[tech].rang,
    kinjutsu: R.maitrises[tech].kinjutsu?.raison,
    usages: usagesRestants(s, tech),
    avertissement: R.maitrises[tech].technique!.limite?.avertissement,
    natures: naturesMaitrise(tech),
  };
}

export function choixVisibles(s: GameState, ev: EventDef): VueChoix[] {
  const res: VueChoix[] = [];
  let attaquesPlacees = false;
  for (const c of ev.choix) {
    const ok = evaluer(c.si, s);
    if (!ok && !c.verrou) continue;
    const test = c.test ? avecAffrontement(ev.id, c.id, c.test) : undefined;
    const racine = test?.type === 'combat' ? affrontementPour(ev.id, c.id) : undefined;
    if (racine) {
      // L'Affrontement Racine : on choisit une intention ici ; les techniques se choisissent dans le combat, manche par manche.
      const regle = CONTEXTES[racine.contexte];
      res.push({ id: c.id, texte: interpoler(c.texte, s), disponible: ok, verrou: ok ? undefined : interpoler(c.verrou!, s), indice: c.indice ? interpoler(c.indice, s) : undefined, nature: 'combat', mortel: regle.letal, affrontement: { contexte: regle.libelle, kanji: regle.kanji } });
      continue;
    }
    // Les attaques spéciales se greffent sur le premier choix de combat de la scène (anciens combats, jusqu'à leur migration).
    const attaques =
      ok && test?.type === 'combat' && !attaquesPlacees
        ? attaquesSpeciales(s, test).map((tech) => ({ ...vueAttaque(s, tech, test), id: `${c.id}@${tech}`, technique: tech }))
        : undefined;
    if (attaques?.length) attaquesPlacees = true;
    const evalTest = ok && test ? evaluerEpreuve(s, test) : undefined;
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
      forme: attaques?.length ? test?.forme : undefined,
      allies: attaques?.length ? test?.allies : undefined,
      nature: test ? (test.type === 'combat' ? 'combat' : 'epreuve') : 'libre',
      mortel: !!test?.letal,
    });
  }
  if (!res.some((c) => c.disponible)) res.push({ id: CHOIX_PASSER.id, texte: CHOIX_PASSER.texte, disponible: true });
  return res;
}

/** Payer une attaque spéciale (chakra, santé), en tirer de l'expérience, et renforcer le test. */
function lancerTechnique(s: GameState, test: CheckDef, tech: string, ctx: Ctx, tour = 0, deja = 0): { test: CheckDef; prelude: string; repetition?: string } {
  const def = R.maitrises[tech];
  const t = def.technique!;
  s.jauges.chakra = clamp(s.jauges.chakra - t.chakra, 0, s.jauges.chakraMax);
  ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: -t.chakra });
  if (t.sante) {
    s.jauges.sante = clamp(s.jauges.sante - t.sante, 1, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -t.sante });
  }
  if (t.soin) {
    s.jauges.sante = clamp(s.jauges.sante + t.soin, 1, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: t.soin });
  }
  // Certains pouvoirs se souviennent de chaque usage (la marque maudite réclame son dû).
  s.drapeaux[`usages_${tech}`] = (Number(s.drapeaux[`usages_${tech}`]) || 0) + 1;
  const consequence = consequenceUltime(s, tech, ctx);
  // Le risque se calcule avant l'expérience gagnée par ce lancer : c'est le risque affiché au joueur.
  const risque = risqueAllie(s, tech, test);
  applyCombatExperience(s, [tech, ...(def.element ? [`nature_${def.element}`] : []), ...(t.requis ?? []).map((x) => x.maitrise)], ctx);
  const recit = recitTechnique(s, tech, test);
  // Une transformation se raconte comme une métamorphose, pas comme un coup.
  // Relancée dans le même combat, une technique ne se raconte plus de la même façon, et l'adversaire l'attend (§11.2).
  const rep = t.posture ? undefined : texteRepetition(tech, def.nom, deja, tour + deja);
  const masculin = (x: string) => x.replace(/\{Il\}/g, 'Il').replace(/\{il\}/g, 'il').replace(/\{lui\}/g, 'lui');
  // À deux : l'équipier compose ses signes en même temps que toi.
  const partenaire = partenaireDuo(s, tech);
  const appel = partenaire ? `Tu cries le nom de ${defPnj(s, partenaire)?.nom ?? 'ton équipier'} ; vos signes tombent ensemble. ` : '';
  let prelude = appel + (t.posture
    ? `${entreeTransformation(s, tech, tour + s.jour)} ${consequence}`
    : rep
      ? `${masculin(rep.recit)} « ${rep.reaction} » ${consequence}`
      : (recit ? `${def.nom}. ${recit} ` : `${VERBE_ATTAQUE[t.categorie]} ${def.nom}. `) + consequence);
  let renforce = testAvecTechnique(s, test, tech);
  if (rep) renforce = { ...renforce, modificateur: (renforce.modificateur ?? 0) - (deja >= 2 ? 10 : 5) };
  // Une technique apprise depuis peu lâche au mauvais moment : fatigue, blessure, combat à mort.
  const rate = t.posture ? 0 : chanceRateNovice(s, tech, test);
  if (rate > 0 && alea(s) < rate) {
    renforce = { ...renforce, modificateur: (renforce.modificateur ?? 0) - MALUS_RATE_NOVICE };
    prelude += `${RATES_NOVICE[Math.floor(tirageTexte(s, `rate:${tech}:${tour}`) * RATES_NOVICE.length)]} `;
  }
  // Dans la mêlée, une technique de zone peut toucher un des tiens : le coup y perd sa force.
  if (risque > 0 && alea(s) < risque) {
    renforce = { ...renforce, modificateur: (renforce.modificateur ?? 0) - MALUS_TIR_AMI };
    prelude += `${texteTirAmi(tech)} `;
    s.drapeaux['tirs_amis'] = (Number(s.drapeaux['tirs_amis']) || 0) + 1;
  }
  return { test: renforce, prelude, repetition: rep ? masculin(rep.recit) : undefined };
}

/** Malus d'une technique qui lâche au mauvais moment. */
const MALUS_RATE_NOVICE = 20;

/** Chance qu'une technique novice lâche : forte au palier 1, faible au 2, nulle ensuite ; le moment l'aggrave. */
export function chanceRateNovice(s: GameState, tech: string, t: CheckDef): number {
  const tier = s.maitrises[tech]?.tier ?? 1;
  let p = tier <= 1 ? 0.15 : tier === 2 ? 0.06 : 0;
  if (!p) return 0;
  if (s.jauges.fatigue >= 50) p *= 1.5;
  if (s.jauges.sante < 40) p *= 1.5;
  if (t.letal) p *= 1.3;
  return Math.min(0.45, p);
}

/** Une manche se raconte en une phrase ; l'ordre varie d'une manche à l'autre. */
const LIGNES_MANCHE: Record<IssueManche, string[]> = {
  touche: ['Le coup porte en plein corps.', 'Tu touches. Pour la première fois, tu vois de la peur dans ses yeux.', 'Ça passe sa garde.', 'Il ne l’a pas vu venir.', 'Ton coup lui arrache un cri.'],
  esquive: ['Il esquive d’un bond, comme s’il avait lu ton geste avant toi.', 'Une substitution : ton coup frappe une bûche. Il est déjà ailleurs.', 'Il pare, de justesse, et reprend ses distances.', 'Le coup fend l’air. Il te regarde, et sourit.'],
  riposte: ['Il esquive et riposte dans le même geste. Une douleur vive au flanc.', 'Il contre et te projette au sol. Tu te relèves avec du sang dans la bouche.', 'Tu frappes dans le vide ; sa lame, elle, trouve ton épaule.', 'Il attendait exactement ça. Le coup en retour te coupe le souffle.'],
};

/**
 * Le prix d'une technique ultime, payé au moment où on la lance : réserve perdue pour toujours, mort possible
 * (la huitième porte), ou sacrifice qui emportera l'utilisateur à la fin du combat (Shiki Fūjin, C0).
 */
function consequenceUltime(s: GameState, tech: string, ctx: Ctx): string {
  const l = R.maitrises[tech]?.technique?.limite;
  if (!l) return '';
  let texte = '';
  if (l.chakraMaxPerdu) {
    s.jauges.chakraMax = Math.max(10, s.jauges.chakraMax - l.chakraMaxPerdu);
    s.jauges.chakra = Math.min(s.jauges.chakra, s.jauges.chakraMax);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.chakraMax', delta: -l.chakraMaxPerdu });
    texte += 'Quelque chose en toi s’éteint pour toujours. ';
  }
  if (l.mort && (s.maitrises[tech]?.tier ?? 0) >= (l.mort.palierMin ?? 0) && alea(s) < l.mort.chance) {
    s.drapeaux['sacrifice'] = tech;
    texte += 'Tu sens ton corps se consumer de l’intérieur. Tu sais déjà que tu n’en reviendras pas. ';
  }
  if (l.controle) {
    const tier = s.maitrises['chakra_biju']?.tier ?? 1;
    const perte = clamp(0.5 - s.attributs.controleEmotionnel / 200 - (tier - 1) * 0.08, 0.03, 0.6);
    if (alea(s) < perte) {
      const d = 10;
      s.jauges.sante = clamp(s.jauges.sante - d, 1, 100);
      ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d });
      s.social.suspicion = clamp(s.social.suspicion + 4, 0, 100);
      s.drapeaux['pertes_controle'] = (Number(s.drapeaux['pertes_controle']) || 0) + 1;
      texte += 'La bête prend le dessus un instant : tu frappes plus fort que tu ne le voulais, et elle te mord de l’intérieur en retour. ';
    }
  }
  if (l.ethique) {
    for (const [k, v] of Object.entries(l.ethique)) s.ethique[k as keyof typeof s.ethique] += v ?? 0;
    texte += `${l.avertissement} `;
  }
  if (l.sacrifice) {
    s.drapeaux['sacrifice'] = tech;
    texte += 'Le prix est fixé. Tu le paieras quand tout sera fini. ';
  }
  return texte;
}

function finaliserChoix(s: GameState, ev: EventDef, choixId: string, libelle: string, texte: string, suite: string | undefined, issue: Issue | undefined, ctx: Ctx): void {
  // Un sacrifice consenti (Shiki Fūjin, huitième porte, C0) se paie une fois le combat terminé.
  const sacrifice = s.drapeaux['sacrifice'];
  if (typeof sacrifice === 'string' && !s.fin) {
    delete s.drapeaux['sacrifice'];
    s.drapeaux['cause_mort'] = `emporté·e par sa propre technique (${R.maitrises[sacrifice]?.nom ?? sacrifice})`;
    texte += `\n\n${R.maitrises[sacrifice]?.technique?.limite?.avertissement ?? ''} Le combat est fini. Toi aussi.`;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -s.jauges.sante });
    s.jauges.sante = 0;
    suite = undefined;
  }
  s.historique.push({ jour: s.jour, evenementId: ev.id, titre: interpoler(ev.titre, s), choixId, choix: libelle, issue });
  verifierFin(s);
  verifierSucces(s, ctx);
  s.scene = { type: 'resultat', evenementId: ev.id, titre: interpoler(ev.titre, s), choix: libelle, texte, changements: ctx.changements, suite, issue };
}

/** Scènes génériques qui suivent un combat mortel : la captivité, ou le sort de l'adversaire vaincu. */
export const SCENE_CAPTURE = 'x_capture';
export const SCENE_VERDICT = 'x_verdict';

/**
 * Après un combat mortel : capturé·e, on est emmené·e (le statut d'avant est gardé pour le retour) ;
 * vainqueur d'un combat où l'adversaire reste à ta merci, on décide de son sort.
 * Rien ne se passe si l'issue du combat mène déjà ailleurs (suite, fin de partie).
 */
function apresCombat(s: GameState, test: CheckDef, issue: Issue, capture: boolean, suite: string | undefined, ctx: Ctx): { suite?: string; texte: string } {
  if (suite || s.fin || s.statut === 'mort') return { suite, texte: '' };
  if (capture && s.statut !== 'capture') {
    s.drapeaux['statut_avant_capture'] = s.statut;
    s.statut = 'capture';
    ctx.changements.push({ t: 'info', message: 'Capturé·e.' });
    ajouterJournal(s, 'Vaincu·e et emmené·e par l’ennemi.', 3);
    return { suite: SCENE_CAPTURE, texte: '\n\nQuelque chose te frappe à la nuque. Quand tu rouvres les yeux, tes mains sont liées et le sol défile sous toi : on te porte comme un sac.' };
  }
  if (test.verdict && (issue === 'succes' || issue === 'critique')) {
    s.drapeaux['verdict_forme'] = test.forme ?? 'duel';
    if (test.allies) s.drapeaux['verdict_allies'] = true;
    else delete s.drapeaux['verdict_allies'];
    return { suite: SCENE_VERDICT, texte: '' };
  }
  return { suite, texte: '' };
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

  if (tech && affrontementPour(ev.id, baseId)) throw new Error('Attaque spéciale indisponible.');
  s.actions.push({ a: 'choix', id: choixId });
  s.annonce = undefined;
  const ctx: Ctx = nouveauCtx();
  if (ch.test && affrontementPour(ev.id, ch.id)) {
    ouvrirAffrontement(s, ev, ch);
    return;
  }
  // Combat en plusieurs manches : le choix ouvre l'affrontement, la première manche se joue tout de suite.
  if (ch.test && nombreManches(ch.test) > 1) {
    s.scene = { type: 'combat', evenementId: ev.id, choixId: baseId, manche: 0, total: nombreManches(ch.test), touches: 0, ripostes: 0, resultats: [], journal: [], techniques: [], chakra: 0, sante: 0 };
    // Engager sans technique, c'est lui laisser une chance de frapper le premier.
    const t = avecAffrontement(ev.id, ch.id, ch.test);
    if (!tech && alea(s) < chancePriorite(s, t) * 0.8) {
      s.scene.priorite = tirerTechniqueAdverse(s, t);
      s.scene.journal.push('Il attaque le premier, avant que tu aies bougé !');
      return;
    }
    jouerManche(s, tech);
    return;
  }
  let texte: string;
  let suite = ch.suite;
  let issue: Issue | undefined;
  if (ch.test) {
    let test = avecAffrontement(ev.id, ch.id, ch.test);
    let prelude = '';
    if (tech) ({ test, prelude } = lancerTechnique(s, test, tech, ctx));
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
      if (test.type === 'combat') {
        const apres = apresCombat(s, test, r.issue, r.capture, suite, ctx);
        texte += apres.texte;
        suite = apres.suite;
      }
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

export interface VueAttaqueCombat extends VueAttaque {
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
  forme: FormeCombat;
  allies: boolean;
  /** L'adversaire a l'initiative : sa technique, et tes chances d'esquiver ou de contrer. */
  adversaire?: VuePriorite;
  /** Ta dernière esquive a ouvert sa garde. */
  ouverture: boolean;
  /** Chance (en %) qu'une permutation transforme un coup mortel en coup sur une bûche. */
  permutation: number;
  /** Transformations qu'on peut activer (sans perdre la manche). */
  transformations: VueTransformation[];
  /** La transformation active et ce qu'elle apporte. */
  transformation?: VueTransformation;
  /** Yeux qu'on peut activer, ou yeux actifs, et ce qu'ils coûtent par manche. */
  dojutsu: { id: string; nom: string; palier: string; cout: number; attaque: number; defense: number; actif: boolean }[];
} | undefined {
  if (s.scene.type !== 'combat') return undefined;
  const sc = s.scene;
  const ev = R.evenements[sc.evenementId];
  const ch = ev.choix.find((c) => c.id === sc.choixId)!;
  const t = avecAffrontement(ev.id, ch.id, ch.test!);
  const precedente = sc.techniques.at(-1);
  // Transformé·e : les chances affichées tiennent compte de la transformation.
  const pt = sc.transformation ? bonusPosture(s, sc.transformation) : { attaque: 0, defense: 0 };
  const oeil = sc.dojutsu ? bonusDojutsu(s, sc.dojutsu) : { attaque: 0, defense: 0 };
  const posture = { attaque: pt.attaque + oeil.attaque, defense: pt.defense + oeil.defense };
  return {
    titre: interpoler(ev.titre, s),
    texte: interpoler(ch.texte, s),
    manche: sc.manche,
    total: sc.total,
    touches: sc.touches,
    ripostes: sc.ripostes,
    resultats: sc.resultats ?? [],
    journal: sc.journal,
    simple: Math.round(evaluerEpreuve(s, { ...t, modificateur: (t.modificateur ?? 0) + posture.attaque }).proba * 100),
    attaques: attaquesSpeciales(s, t, 6, sc.transformation, true).map((tech) => {
      const ench = enchainement(s, precedente, tech);
      return {
        ...vueAttaque(s, tech, t, (ench ? BONUS_ENCHAINEMENT : 0) + posture.attaque),
        enchainement: ench ? `${R.elements[ench[0]]?.nom} → ${R.elements[ench[1]]?.nom}` : undefined,
      };
    }),
    objets: CONSOMMABLES.filter((c) => stock(s, c.id) > 0).map((c) => ({
      id: c.id,
      nom: c.nom,
      effet: c.effet,
      stock: stock(s, c.id),
      chance: Math.round(evaluerEpreuve(s, { ...t, modificateur: (t.modificateur ?? 0) + c.bonus + posture.attaque }).proba * 100),
    })),
    forme: t.forme ?? 'duel',
    allies: !!t.allies,
    adversaire: sc.priorite ? vuePriorite(s, { ...t, modificateur: (t.modificateur ?? 0) + posture.defense }, sc.priorite) : undefined,
    transformations: sc.transformation
      ? []
      : Object.keys(s.maitrises)
          .filter((id) => estTransformation(id) && attaqueDisponible(s, id))
          .map((id) => vueTransformation(s, id)),
    transformation: sc.transformation ? vueTransformation(s, sc.transformation) : undefined,
    dojutsu: (sc.dojutsu ? [sc.dojutsu] : dojutsuDisponibles(s)).map((id) => ({
      id,
      nom: R.maitrises[id].nom,
      palier: R.maitrises[id].paliers[s.maitrises[id].tier]?.nom ?? '',
      cout: coutDojutsu(s, id),
      ...bonusDojutsu(s, id),
      actif: sc.dojutsu === id,
    })),
    ouverture: !!sc.ouverture,
    permutation: t.letal ? Math.round(chancePermutation(s) * 100) : 0,
  };
}

export interface VueTransformation {
  id: string;
  nom: string;
  chakra: number;
  sante: number;
  effet: string;
  attaque: number;
  defense: number;
  kinjutsu?: string;
  avertissement?: string;
  /** Techniques spéciales que la transformation ouvre. */
  speciales: string[];
  /** Ce qu'elle coûte par manche, en clair (vide si rien). */
  entretien: string;
  /** Manches restantes avant qu'elle retombe d'elle-même (si limitée). */
  restantes?: number;
}

function vueTransformation(s: GameState, id: string): VueTransformation {
  const def = R.maitrises[id];
  const t = def.technique!;
  const b = bonusPosture(s, id);
  return {
    id,
    nom: def.nom,
    chakra: t.chakra,
    sante: t.sante ?? 0,
    effet: t.posture!.effet,
    attaque: b.attaque,
    defense: b.defense,
    kinjutsu: def.kinjutsu?.raison,
    avertissement: t.limite?.avertissement,
    speciales: R.contenu.maitrises.filter((m) => m.technique?.exigeTransformation?.includes(id)).map((m) => m.nom),
    entretien: [
      t.posture!.entretien?.chakra && `${t.posture!.entretien.chakra} chakra`,
      t.posture!.entretien?.sante && `${t.posture!.entretien.sante} santé`,
      t.posture!.entretien?.fatigue && `${t.posture!.entretien.fatigue} fatigue`,
    ]
      .filter(Boolean)
      .join(', '),
    restantes:
      t.posture!.duree !== undefined
        ? Math.max(0, t.posture!.duree - (s.scene.type === 'combat' && s.scene.transformation === id ? (s.scene.transfoTours ?? 0) : 0))
        : undefined,
  };
}

export interface VuePriorite {
  nom: string;
  recit: string;
  element?: string;
  esquive: number;
  contre: number;
  /** Chance de permutation (absente si on ne la connaît pas ou faute de chakra). */
  permutationChance?: number;
  /** Contrer avec une technique : chance, et si sa nature domine la sienne. */
  contres: { id: string; nom: string; chakra: number; chance: number; avantage?: 'fort' | 'faible'; natures: string[] }[];
  /** La permutation (kawarimi) aide à esquiver. */
  permutation: boolean;
  /** Ta nature qui domine la sienne aide à contrer. */
  natureFavorable?: string;
}

function vuePriorite(s: GameState, t: CheckDef, advId: string): VuePriorite {
  const adv = techniqueAdverse(advId)!;
  const nat = natureQuiDomine(s, adv.element);
  return {
    nom: adv.nom,
    recit: adv[t.forme ?? 'duel'],
    element: adv.element ? R.elements[adv.element]?.nom : undefined,
    esquive: Math.round(evaluerEpreuve(s, testDefense(s, t, advId, 'esquiver')).proba * 100),
    contre: Math.round(evaluerEpreuve(s, testDefense(s, t, advId, 'contrer')).proba * 100),
    permutationChance: permutationPossible(s) ? Math.round(evaluerEpreuve(s, testDefense(s, t, advId, 'permutation')).proba * 100) : undefined,
    contres: attaquesSpeciales(s, t, 4, s.scene.type === 'combat' ? s.scene.transformation : undefined, true).map((tech) => {
      const av = avantageTechnique(tech, adv.element);
      const avecTech = { ...testAvecTechnique(s, t, tech), modificateur: (testAvecTechnique(s, t, tech).modificateur ?? 0) + (av === 'fort' ? 8 : av === 'faible' ? -8 : 0) };
      return {
        id: tech,
        nom: R.maitrises[tech].nom,
        chakra: R.maitrises[tech].technique!.chakra,
        chance: Math.round(evaluerEpreuve(s, testDefense(s, avecTech, advId, 'contrer')).proba * 100),
        avantage: av,
        natures: naturesMaitrise(tech),
      };
    }),
    permutation: (s.maitrises['kawarimi']?.tier ?? 0) >= 1,
    natureFavorable: nat ? R.elements[nat]?.nom : undefined,
  };
}

/** Joue une manche (attaque simple, technique ou objet), puis conclut le combat à la dernière. */
function jouerManche(s: GameState, action?: string): void {
  if (s.scene.type !== 'combat') throw new Error('Aucun combat en cours.');
  const sc = s.scene;
  sc.resultats ??= [];
  const ev = R.evenements[sc.evenementId];
  const ch = ev.choix.find((c) => c.id === sc.choixId)!;
  const base = avecAffrontement(ev.id, ch.id, ch.test!);
  const ctx = nouveauCtx();
  // L'adversaire a pris l'initiative : on ne peut qu'esquiver ou contrer sa technique.
  if (sc.priorite) {
    const contreTech = action?.startsWith('contrer:') ? action.slice(8) : undefined;
    const mode: Defense | undefined = contreTech ? 'contrer' : action === 'esquiver' || action === 'contrer' || action === 'permutation' ? action : undefined;
    if (!mode) throw new Error('L’adversaire attaque : esquive, permute ou contre.');
    if (mode === 'permutation' && !permutationPossible(s)) throw new Error('Permutation impossible.');
    const adv = techniqueAdverse(sc.priorite)!;
    const def = (sc.transformation ? bonusPosture(s, sc.transformation).defense : 0) + (sc.dojutsu ? bonusDojutsu(s, sc.dojutsu).defense : 0);
    let t = def ? { ...base, modificateur: (base.modificateur ?? 0) + def } : base;
    let prelude = '';
    if (mode === 'permutation') {
      s.jauges.chakra -= CHAKRA_PERMUTATION;
      ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: -CHAKRA_PERMUTATION });
    }
    // Contrer avec une technique : sa force s'ajoute au contre, et une nature qui domine la sienne aide encore.
    if (contreTech) {
      if (!attaqueDisponible(s, contreTech) || !attaquesSpeciales(s, base, 6, sc.transformation, true).includes(contreTech)) throw new Error('Technique indisponible pour contrer.');
      const lance = lancerTechnique(s, t, contreTech, ctx, sc.manche, sc.techniques.filter((x) => x === contreTech).length);
      const av = avantageTechnique(contreTech, adv.element);
      t = { ...lance.test, modificateur: (lance.test.modificateur ?? 0) + (av === 'fort' ? 8 : av === 'faible' ? -8 : 0) };
      prelude = `Tu contres avec ${R.maitrises[contreTech].nom}. `;
      sc.techniques.push(contreTech);
    }
    const r = resoudreDefense(s, t, sc.priorite, mode, ctx);
    let ligne = `${prelude}${LIGNES_DEFENSE[mode][r.issue]!}`;
    if (r.issue === 'riposte') ligne += ` ${texteImpactJoueur(s, tirageTexte(s, `force-j:${sc.manche}`) < 0.5 ? 'lourd' : 'leger', `def:${sc.manche}`)}`;
    if (r.issue === 'touche') sc.touches++;
    if (r.issue === 'riposte') sc.ripostes++;
    sc.resultats.push(r.issue);
    sc.manche++;
    sc.journal.push(`Manche ${sc.manche}. ${adv.nom} ! ${adv[base.forme ?? 'duel']} ${ligne}`);
    sc.priorite = undefined;
    sc.ouverture = r.issue === 'esquive';
    sc.dos = mode === 'permutation' && r.issue === 'esquive';
    entretenirTransformation(s, ctx);
    if (sc.manche < sc.total) {
      prendreInitiative(s, base);
      return;
    }
    conclureManches(s, ev, ch, base, ctx);
    return;
  }
  // Activer ses yeux non plus : le dōjutsu se paie ensuite à chaque manche.
  if (action?.startsWith('dojutsu:')) {
    const id = action.slice(8);
    if (sc.priorite) throw new Error('L’adversaire attaque : esquive ou contre d’abord.');
    if (sc.dojutsu || !dojutsuDisponibles(s).includes(id)) throw new Error('Dōjutsu indisponible.');
    sc.dojutsu = id;
    const ms = s.maitrises[id];
    sc.journal.push(`${texteDojutsu(id)} (${R.maitrises[id].nom}, ${R.maitrises[id].paliers[ms.tier]?.nom ?? `palier ${ms.tier}`} : ${coutDojutsu(s, id)} chakra par manche.)`);
    sc.journal.push(reagirTransformation(s, base, id, ctx));
    return;
  }
  // Se transformer n'est pas une attaque : la transformation s'active sans consommer la manche.
  if (action?.startsWith('transfo:')) {
    activerTransformation(s, base, action.slice(8), ctx);
    return;
  }
  // Depuis l'écran des choix, une transformation ouvre le combat : on se transforme, puis on frappe.
  let enEntree = '';
  if (action && estTransformation(action) && !sc.transformation) {
    enEntree = activerTransformation(s, base, action, ctx, false);
    action = undefined;
  }
  const objet = action?.startsWith('objet:') ? action.slice(6) : undefined;
  const tech = objet ? undefined : action;
  if (tech && (!attaqueDisponible(s, tech) || !attaquesSpeciales(s, base, 6, sc.transformation, true).includes(tech))) throw new Error('Attaque spéciale indisponible.');
  let test = base;
  let prelude = enEntree;
  let repetition: string | undefined;
  // Transformé·e : chaque attaque porte la force de la transformation ; les yeux activés aussi.
  if (sc.transformation) test = { ...test, modificateur: (test.modificateur ?? 0) + bonusPosture(s, sc.transformation).attaque };
  if (sc.dojutsu) test = { ...test, modificateur: (test.modificateur ?? 0) + bonusDojutsu(s, sc.dojutsu).attaque };
  let protege = false;
  // Une esquive réussie a ouvert sa garde : l'attaque qui suit en profite.
  if (sc.ouverture) {
    test = { ...test, modificateur: (test.modificateur ?? 0) + (sc.dos ? BONUS_DOS : BONUS_OUVERTURE) };
    prelude += sc.dos ? 'Tu surgis dans son dos. ' : 'Sa garde est ouverte. ';
    sc.ouverture = false;
    sc.dos = false;
  }
  if (tech) {
    const ench = enchainement(s, sc.techniques.at(-1), tech);
    const lance = lancerTechnique(s, test, tech, ctx, sc.manche, sc.techniques.filter((x) => x === tech).length);
    test = lance.test;
    prelude += lance.prelude;
    repetition = lance.repetition;
    if (ench) {
      test = { ...test, modificateur: (test.modificateur ?? 0) + BONUS_ENCHAINEMENT };
      prelude = `Enchaînement ! Ton ${R.elements[ench[0]]?.nom} nourrit ton ${R.elements[ench[1]]?.nom}. ${prelude}`;
      s.drapeaux['enchainements'] = (Number(s.drapeaux['enchainements']) || 0) + 1;
    }
    sc.techniques.push(tech);
  } else if (objet) {
    const c = utiliserConsommable(s, objet, ctx);
    test = { ...test, modificateur: (test.modificateur ?? 0) + c.bonus };
    prelude += `${c.recit} `;
    protege = !!c.protege;
  }
  const r = resoudreManche(s, test, ctx, protege);
  const lignes = LIGNES_MANCHE[r.issue];
  let ligne = lignes[(sc.manche + (tech?.length ?? 0) + sc.touches) % lignes.length];
  // Un coup qui porte se raconte par la technique (de loin ou au contact), puis par l'endroit où le corps s'écrase.
  const contact = !objet && techniqueAuContact(tech);
  const distance = contact ? 'proche' : (sc.distance ?? 'loin');
  if (r.issue === 'touche') {
    const cle = `${sc.manche}`;
    const deja = tech ? sc.techniques.filter((x) => x === tech).length - 1 : 0;
    const groupe = base.forme === 'escouade';
    const lourd = !groupe && (deja >= 2 || ['A', 'S', 'SS'].includes(R.maitrises[tech ?? '']?.rang ?? '') || tirageTexte(s, `force:${cle}`) < 0.35);
    const propre = tech && !groupe ? texteTechniqueTouche(s, tech, distance, cle) : '';
    // Le texte de distance remplace le récit générique de la technique : les deux se contrediraient (« au contact » / « par le sol »).
    const generique = tech ? recitTechnique(s, tech, base) : undefined;
    if (propre && generique) prelude = prelude.replace(`${generique} `, '');
    // Relancée, la technique était « attendue » ; si elle porte quand même, on ne raconte pas qu'il l'a parée.
    if (repetition && tech) prelude = prelude.replace(repetition, `${R.maitrises[tech].nom}, encore. Il croit l’avoir lue ; il se trompe.`);
    const parties = [propre || ligne];
    // Contre quelqu'un qu'on a le droit de tuer, la troisième fois, la technique finit ce qu'elle a commencé.
    if (tech && !groupe && base.letal && deja >= 2) parties.push(texteSombre(s, tech, cle));
    parties.push(texteImpact(s, groupe ? 'groupe' : lourd ? 'lourd' : 'leger', cle));
    if (groupe && tech && porteeTechnique(tech) !== 'cible') parties.push(PORTEE_ESCOUADE.zone[Math.floor(tirageTexte(s, `zone:${cle}`) * PORTEE_ESCOUADE.zone.length)]);
    ligne = accorderAdv(parties.filter(Boolean).join(' '), 'm');
    sc.distance = lourd ? 'loin' : distance;
  } else if (r.issue === 'riposte') {
    sc.distance = 'proche';
    ligne += ` ${texteImpactJoueur(s, tirageTexte(s, `force-j:${sc.manche}`) < 0.4 ? 'lourd' : 'leger', `rip:${sc.manche}`)}`;
  } else sc.distance = 'loin';
  // Contre une escouade, frapper un seul (coup simple ou technique ciblée) laisse les autres te tomber dessus.
  sc.expose = base.forme === 'escouade' && !objet && (!tech || porteeTechnique(tech) === 'cible');
  if (sc.expose) ligne += ` ${PORTEE_ESCOUADE.expose[Math.floor(tirageTexte(s, `expose:${sc.manche}`) * PORTEE_ESCOUADE.expose.length)]}`;
  if (r.issue === 'touche') sc.touches++;
  if (r.issue === 'riposte') sc.ripostes++;
  sc.resultats.push(r.issue);
  sc.manche++;
  sc.journal.push(`Manche ${sc.manche}. ${tech || objet ? prelude : `${prelude}Tu attaques sans technique, au plus simple. `}${ligne}`);
  entretenirTransformation(s, ctx);
  if (sc.manche < sc.total) {
    prendreInitiative(s, base);
    return;
  }
  // Encore debout après ta dernière attaque : il jette ce qui lui reste dans un dernier assaut, et c'est à toi de le recevoir.
  if (!sc.dernierAssaut && sc.touches < sc.total) {
    sc.dernierAssaut = true;
    sc.total += 1;
    sc.priorite = tirerTechniqueAdverse(s, base);
    sc.journal.push(LIGNES_DERNIER_ASSAUT[Math.floor(tirageTexte(s, `assaut:${sc.manche}`) * LIGNES_DERNIER_ASSAUT.length)]);
    return;
  }
  conclureManches(s, ev, ch, base, ctx);
}

/** Le dernier assaut de l'adversaire, après ta dernière attaque. */
const LIGNES_DERNIER_ASSAUT = [
  'Il n’est pas fini. Il crache du sang, se redresse, et rassemble ce qui lui reste pour un dernier assaut.',
  'Il recule d’un bond, compose ses signes plus vite que jamais. Un dernier coup, tout ce qu’il a.',
  'Ses yeux changent. Il n’essaie plus de gagner : il essaie de t’emporter avec lui.',
];

/**
 * Après chaque manche, une transformation se paie : chakra, santé ou fatigue. Faute de pouvoir payer,
 * ou une fois sa durée écoulée, elle retombe, et le journal le raconte.
 */
function entretenirTransformation(s: GameState, ctx: Ctx): void {
  if (s.scene.type !== 'combat') return;
  // Les yeux d'abord : un dōjutsu se paie à chaque manche, au tarif de son palier et de l'habitude.
  if (s.scene.dojutsu) {
    const id = s.scene.dojutsu;
    const cout = coutDojutsu(s, id);
    if (s.jauges.chakra < cout) {
      s.scene.dojutsu = undefined;
      s.scene.journal.push(`Tes yeux s’éteignent : ${R.maitrises[id].nom} réclame plus de chakra qu’il ne t’en reste.`);
    } else {
      s.jauges.chakra -= cout;
      ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: -cout });
    }
  }
  if (!s.scene.transformation) return;
  const sc = s.scene;
  const id = sc.transformation!;
  const p = R.maitrises[id]?.technique?.posture;
  if (!p) return;
  sc.transfoTours = (sc.transfoTours ?? 0) + 1;
  const e = p.entretien ?? {};
  const fin = (raison: string) => {
    sc.transformation = undefined;
    sc.transfoTours = undefined;
    sc.journal.push(`${p.fin ?? `${R.maitrises[id].nom} retombe.`} ${raison}`);
  };
  if (p.duree !== undefined && sc.transfoTours >= p.duree) return fin('Ton corps ne peut pas la tenir plus longtemps.');
  if (e.chakra && s.jauges.chakra < e.chakra) return fin('Tu n’as plus assez de chakra pour la maintenir.');
  if (e.sante && s.jauges.sante <= e.sante + 1) return fin('Ton corps cède avant elle.');
  if (e.chakra) {
    s.jauges.chakra -= e.chakra;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.chakra', delta: -e.chakra });
  }
  if (e.sante) {
    s.jauges.sante = clamp(s.jauges.sante - e.sante, 1, 100);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -e.sante });
  }
  if (e.fatigue) s.jauges.fatigue = clamp(s.jauges.fatigue + e.fatigue, 0, 100);
}

const BONUS_OUVERTURE = 8;
/** Après une permutation réussie : dans son dos, le coup est presque gratuit. */
const BONUS_DOS = 14;

/**
 * Activer une transformation : on en paie le prix (chakra, santé, conséquences), et elle dure jusqu'à la fin du combat.
 * Le journal la raconte ; la manche n'est pas consommée. Renvoie le récit d'entrée.
 */
function activerTransformation(s: GameState, base: CheckDef, id: string, ctx: Ctx, journal = true): string {
  if (s.scene.type !== 'combat') throw new Error('Aucun combat en cours.');
  const sc = s.scene;
  if (sc.priorite) throw new Error('L’adversaire attaque : esquive ou contre d’abord.');
  if (sc.transformation) throw new Error('Tu es déjà transformé·e.');
  if (!estTransformation(id) || !attaqueDisponible(s, id)) throw new Error('Transformation indisponible.');
  const lance = lancerTechnique(s, base, id, ctx, sc.manche + sc.journal.length);
  sc.transformation = id;
  sc.transfoTours = 0;
  sc.techniques.push(id);
  const b = bonusPosture(s, id);
  const texte = `${lance.prelude.trim()} (${R.maitrises[id].nom} : attaque +${b.attaque}, défense +${b.defense}.) ${reagirTransformation(s, base, id, ctx)} `;
  if (journal) sc.journal.push(`Transformation. ${texte}`);
  return texte;
}

/** Ce qui arrive quand on esquive ou qu'on contre sa technique. */
const LIGNES_DEFENSE: Record<Defense, Partial<Record<IssueManche, string>>> = {
  permutation: {
    esquive: 'Son attaque frappe une bûche. Toi, tu es déjà derrière lui.',
    riposte: 'Ta permutation arrive une fraction trop tard : la bûche et toi encaissez le coup ensemble.',
  },
  esquiver: {
    esquive: 'Tu plonges hors de portée au dernier instant. Le coup passe, et sa garde reste ouverte.',
    riposte: 'Tu bondis, trop tard d’un souffle. Le coup te prend de plein fouet.',
  },
  contrer: {
    touche: 'Tu ne recules pas : tu passes à travers son attaque et frappes au cœur de sa technique. Il ne l’avait pas prévu.',
    riposte: 'Tu tentes de frapper dans son attaque. Elle est plus forte que toi, et tu l’encaisses en entier.',
  },
};

/** Avant chaque nouvelle manche : l'adversaire prend-il l'initiative ? Jamais juste après une esquive réussie. */
function prendreInitiative(s: GameState, t: CheckDef): void {
  if (s.scene.type !== 'combat') return;
  const sc = s.scene;
  if (sc.ouverture) return;
  // Exposé·e après avoir frappé un seul d'entre eux : les autres prennent plus souvent l'initiative.
  if (alea(s) < Math.min(0.8, chancePriorite(s, t) + (sc.expose ? 0.25 : 0))) sc.priorite = tirerTechniqueAdverse(s, t);
}

/** Dernière manche : l'issue du combat dépend de l'ensemble. */
function conclureManches(s: GameState, ev: EventDef, ch: ChoiceDef, base: CheckDef, ctx: Ctx): void {
  if (s.scene.type !== 'combat') return;
  const sc = s.scene;
  const fin = nouveauCtx();
  fin.changements.push(...ctx.changements);
  // Le dernier assaut ne compte pas comme une manche à gagner : il ajoute un coup porté (contre) ou une riposte encaissée.
  const res = conclureCombat(s, base, sc.touches, sc.ripostes, sc.dernierAssaut ? sc.total - 1 : sc.total, fin);
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
    const apres = apresCombat(s, base, res.issue, res.capture, suite, fin);
    texte += apres.texte;
    suite = apres.suite;
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
  // Le mini-bilan de la période : paliers franchis et aptitudes gagnées, pour sentir la progression.
  s.bilanPeriode = {
    jour: s.jour,
    libelle: r.libelle,
    paliers: ctx.changements.filter((c): c is Extract<Changement, { t: 'palier' }> => c.t === 'palier').map((c) => ({ maitrise: c.maitrise, palier: c.palier })),
    stats: ctx.changements
      .filter((c): c is Extract<Changement, { t: 'stat' }> => c.t === 'stat' && c.chemin.startsWith('attributs.') && c.delta > 0)
      .map((c) => ({ chemin: c.chemin, delta: c.delta })),
  };
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

/** Une manche d'Affrontement Racine. L'action n'est enregistrée qu'une fois validée : une action refusée ne change rien. */
function combatMut(s: GameState, a: ActionCombat): void {
  if (s.scene.type !== 'affrontement') throw new Error('Aucun affrontement en cours.');
  const ctx = nouveauCtx();
  const evId = s.scene.evenementId;
  const choixId = s.scene.choixId;
  const fin = jouerAffrontement(s, a, ctx);
  s.actions.push({ a: 'combat', famille: a.famille, choix: a.choix, ...(a.elan ? { elan: a.elan } : {}) });
  if (!fin) return;
  finaliserChoix(s, R.evenements[evId], choixId, fin.libelle, fin.texte, fin.suite, fin.issue, ctx);
  const apres = s.scene as GameState['scene'];
  if (apres.type === 'resultat' && fin.bilan) apres.bilanCombat = fin.bilan;
}

export function combattre(s0: GameState, a: ActionCombat): GameState {
  const s = cloner(s0);
  combatMut(s, a);
  return s;
}

export function appliquerActionMut(s: GameState, a: Action): void {
  if (a.a === 'choix') choisirMut(s, a.id);
  else if (a.a === 'combat') combatMut(s, a);
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
