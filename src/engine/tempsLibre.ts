// Temps libre : entre deux événements de trame, le joueur choisit à quoi consacrer son temps.
// Chaque activité coûte du temps : s'entraîner, c'est manquer autre chose.

import { noterMerite } from './progression';
import { CONSOMMABLE, CONSOMMABLES, STOCK_MAX, acheterConsommable, stock } from './consommables';

const PRIX_CADEAU = 25;
const PRIX_RAMEN = 12;
const MISE_DES = 20;
import type { CheckDef, ElementId, GameState } from './types';
import { R } from './registre';
import { age, libelleDuree } from './calendrier';
import { Ctx, ajouterJournal, clamp, defPnj, decouvrir, drapeauVrai, estProdige, rangIndex, relationDe } from './etat';
import { evaluer } from './conditions';
import { alea, aleaEntier } from './rng';
import { apprendreTechnique, applyTraining, blocageApprentissage, blocagePalier, etatProgression, nouvelleMaitrise, porteurJoueur } from './maitrise';
import { equiper, estUtilisable, instanceArme, obtenirArme, reparerArme } from './armes';
import { appliquerEffet } from './effets';
import { avancerTemps } from './temps';
import { resoudreLieu, tirerAleatoire, trameDisponible } from './selection';
import { resoudreEpreuve } from './epreuves';
import { resoudreTexte } from './texte';

export type CategorieActivite =
  | 'entrainement'
  | 'repos'
  | 'famille'
  | 'social'
  | 'mission'
  | 'forge'
  | 'metier'
  | 'etude'
  | 'travail'
  | 'technique'
  | 'route'
  | 'equipement';

export interface Activite {
  id: string;
  libelle: string;
  description: string;
  duree: number;
  categorie: CategorieActivite;
  disponible: boolean;
  raison?: string;
  /** Entraînement : un sort (technique) ou une discipline ; on peut en combiner un de chaque. */
  groupe?: 'sort' | 'discipline';
  /** Barre vers le palier suivant. */
  progression?: { tier: number; prochain?: number; pct: number };
  /** Avertissement affiché en rouge (palier suivant bloqué par l'âge, l'expérience…). */
  alerte?: string;
}

const ROLES_NON_SOCIAUX = ['kage', 'recruteur', 'ennemi', 'deserteur', 'marchand'];

export function dureeBase(s: GameState): number {
  return age(s) < 12 ? 90 : 30;
}

function texteBlocage(s: GameState, id: string): string {
  switch (blocagePalier(porteurJoueur(s), id)) {
    case 'age':
      return 'Plafond de ton âge atteint : l’entraînement prépare la suite.';
    case 'combat':
      return 'Il te faut de l’expérience réelle pour franchir le palier suivant.';
    case 'temps':
      return 'Ton pouvoir doit encore se stabiliser avec le temps.';
    case 'prerequis':
      return 'Une autre maîtrise doit progresser d’abord.';
    case 'max':
      return 'Sommet atteint.';
    default:
      return 'Progression possible.';
  }
}

const ORDRE_KIND = { clan: 0, biju: 0, element: 1, jutsu: 2, base: 3, weapon_family: 4 } as const;

const ELEMENTS_BASE: ElementId[] = ['katon', 'suiton', 'fuuton', 'raiton', 'doton'];

/** Nombre de natures de base qu'un ninja peut porter selon son rang. */
export function naturesMax(s: GameState): number {
  const r = rangIndex(s.rang);
  if (r >= rangIndex('jonin')) return 5;
  if (r >= rangIndex('chunin')) return 3;
  if (r >= rangIndex('genin') && age(s) >= 12) return 2;
  return 1;
}

export function naturesPossedees(s: GameState): ElementId[] {
  return ELEMENTS_BASE.filter((e) => s.maitrises[`nature_${e}`]);
}

/** Pourquoi le joueur ne peut pas commencer une nouvelle nature ; undefined s'il le peut. */
export function blocageNouvelleNature(s: GameState): string | undefined {
  const possedees = naturesPossedees(s);
  const max = naturesMax(s);
  if (possedees.length >= max) {
    if (max === 1) return 'Une deuxième nature s’apprend après l’Académie, à partir de 12 ans.';
    if (max === 2) return 'Une troisième nature exige le rang de chūnin.';
    if (max === 3) return 'Au-delà de trois natures, il faut être jōnin.';
    return 'Tu portes déjà toutes les natures.';
  }
  const faibles = possedees.filter((e) => (s.maitrises[`nature_${e}`]?.tier ?? 0) < 2);
  if (faibles.length) return `Façonne d’abord ${R.elements[faibles[0]]?.nom} (palier 2).`;
  return undefined;
}

export function genererActivites(s: GameState): Activite[] {
  const res: Activite[] = [];
  const d = dureeBase(s);
  const grave = s.blessures.some((b) => b.gravite >= 3);
  const epuise = s.jauges.fatigue >= 85;
  const a = age(s);

  const maitrises = Object.values(s.maitrises).sort(
    (x, y) => ORDRE_KIND[x.kind] - ORDRE_KIND[y.kind] || x.id.localeCompare(y.id),
  );
  for (const ms of maitrises) {
    const def = R.maitrises[ms.id];
    if (!def || def.nonEntrainable) continue;
    if (def.eveil && !ms.awakened) continue;
    if (ms.tier >= 5) continue;
    const prog = etatProgression(s, ms.id);
    let raison: string | undefined;
    if (grave) raison = 'Ta blessure grave t’interdit tout entraînement.';
    else if (epuise) raison = 'Tu es épuisé·e : repose-toi d’abord.';
    else if (ms.bloquee) raison = 'Technique inexécutable pour l’instant.';
    // L'entraînement ne peut plus rien apporter : on ne le propose pas (affiché en rouge avec la raison).
    else if (prog?.inutile) raison = prog.murTexte;
    const sort = !!def.technique;
    res.push({
      id: `entrainer:${ms.id}`,
      libelle: def.nom,
      description: `Palier ${ms.tier} — ${def.paliers[ms.tier]?.nom ?? ''}.`,
      duree: d,
      categorie: sort ? 'technique' : 'entrainement',
      disponible: !raison,
      raison,
      groupe: sort ? 'sort' : 'discipline',
      progression: prog ? { tier: prog.tier, prochain: prog.prochain, pct: prog.pct } : undefined,
      alerte: !raison && prog?.mur ? prog.murTexte : undefined,
    });
  }

  if (rangIndex(s.rang) >= rangIndex('genin') && s.statut === 'actif') {
    const blocage = blocageNouvelleNature(s);
    const enseignees = R.villages[s.creation.village]?.naturesEnseignees ?? [];
    for (const e of ELEMENTS_BASE) {
      if (s.maitrises[`nature_${e}`]) continue;
      const raison = blocage ?? (grave ? 'Ta blessure grave t’interdit tout entraînement.' : epuise ? 'Tu es épuisé·e : repose-toi d’abord.' : undefined);
      res.push({
        id: `nature:${e}`,
        libelle: `Apprendre ${R.elements[e]?.nom}`,
        description: enseignees.includes(e)
          ? `Les instructeurs de ${R.villages[s.creation.village]?.nom} l’enseignent. Plus lent que ton affinité innée.`
          : `Personne ne l’enseigne à ${R.villages[s.creation.village]?.nom} : tu apprendras seul·e, très lentement.`,
        duree: d,
        categorie: 'entrainement',
        disponible: !raison,
        raison,
        groupe: 'discipline',
      });
    }
  }

  // Techniques : celles qu'on peut apprendre maintenant, et quelques-unes à portée (avec ce qui manque).
  if (s.statut === 'actif' || s.statut === 'errant' || s.statut === 'deserteur') {
    const aPortee: Activite[] = [];
    for (const def of R.contenu.maitrises) {
      if (!def.technique || (s.maitrises[def.id]?.tier ?? 0) >= 1) continue;
      const blocage = blocageApprentissage(s, def.id);
      const proche = blocage && /^(Rang|Exige|Réserve)/.test(blocage) && !blocage.includes('autre clan');
      if (blocage && !proche) continue;
      const t = def.technique;
      // Une combinaison n'apparaît « à portée » qu'une fois ses deux natures éveillées.
      if (blocage && t.elements?.some((e) => (s.maitrises[`nature_${e}`]?.tier ?? 0) < 1)) continue;
      const act: Activite = {
        id: `technique:${def.id}`,
        libelle: `Apprendre ${def.nom}`,
        description: `Rang ${def.rang}. ${def.description} ${t.offensive ? `Attaque spéciale${t.chakra > 0 ? ` : ${t.chakra} chakra` : ', sans chakra'}.` : 'Technique de soutien.'}`,
        duree: d,
        categorie: 'technique',
        groupe: 'sort',
        disponible: !blocage && !grave && !epuise,
        raison: blocage ?? (grave ? 'Ta blessure grave t’interdit tout entraînement.' : epuise ? 'Tu es épuisé·e : repose-toi d’abord.' : undefined),
      };
      (blocage ? aPortee : res).push(act);
    }
    res.push(...aPortee.slice(0, 4));
  }

  // Sur les routes : des combats pour progresser, des contrats pour vivre. On peut y mourir.
  if (s.statut === 'errant' || s.statut === 'deserteur') {
    res.push({
      id: 'route:duel',
      libelle: 'Chercher des adversaires',
      description: a >= 12 ? 'Des duels contre des inconnus : de l’expérience réelle, quelques ryō. Certains se battent à mort.' : 'Des bagarres contre des gamins des routes et des voleurs : de l’expérience réelle.',
      duree: d,
      categorie: 'route',
      disponible: !grave,
      raison: grave ? 'Dans ton état, le premier venu te tuerait.' : undefined,
    });
    if (a >= 11) {
      res.push({
        id: 'route:contrat',
        libelle: 'Accepter des contrats',
        description: 'Escortes, recouvrements, gardes de nuit : de quoi vivre, et parfois de quoi mourir.',
        duree: d,
        categorie: 'route',
        disponible: !grave,
        raison: grave ? 'Personne n’engage un blessé.' : undefined,
      });
    }
  }

  res.push({
    id: 'repos',
    libelle: 'Se reposer',
    description: 'Récupérer, dormir, laisser le corps guérir.',
    duree: 30,
    categorie: 'repos',
    disponible: true,
  });

  const parent = s.roles['parent'];
  if (parent && s.pnj[parent]?.etat !== 'mort' && s.statut === 'actif') {
    res.push({
      id: 'famille',
      libelle: 'Passer du temps en famille',
      description: 'Des jours ordinaires, qui comptent plus qu’on ne le croit.',
      duree: 30,
      categorie: 'famille',
      disponible: true,
    });
  }

  for (const [id, st] of Object.entries(s.pnj)) {
    if (!st.rencontre || st.etat === 'mort' || st.etat === 'disparu' || id === parent) continue;
    const def = defPnj(s, id);
    if (!def || ROLES_NON_SOCIAUX.includes(def.role)) continue;
    if (def.village && def.village !== s.creation.village && !s.relations[id]) continue;
    // Loin du village, on ne passe plus ses journées avec ceux qu'on y a laissés.
    if (s.statut !== 'actif' && def.village === s.creation.village) continue;
    const rel = s.relations[id];
    res.push({
      id: `social:${id}`,
      libelle: `Passer du temps avec ${def.nom}`,
      description: rel?.rompue ? 'Le lien est rompu.' : def.personnalite,
      duree: 30,
      categorie: 'social',
      disponible: !rel?.rompue,
      raison: rel?.rompue ? `${def.nom} refuse de te voir.` : undefined,
    });
    if (rel?.rompue || a < 8) continue;
    const dernier = Number(s.drapeaux[`cadeau:${id}`]) || -9999;
    const attente = 180 - (s.jour - dernier);
    res.push({
      id: `cadeau:${id}`,
      libelle: `Offrir un cadeau à ${def.nom}`,
      description: `${PRIX_CADEAU} ryō. Un petit rien qui dit beaucoup : l’amitié et la confiance montent un peu. Instantané.`,
      duree: 0,
      categorie: 'social',
      disponible: attente <= 0 && s.jauges.ryo >= PRIX_CADEAU,
      raison: attente > 0 ? `Tu lui as offert quelque chose il y a peu.` : `Il te faudrait ${PRIX_CADEAU} ryō.`,
    });
  }

  if (rangIndex(s.rang) >= rangIndex('genin') && s.statut === 'actif') {
    for (const m of R.contenu.missions) {
      if (s.missions[m.id] !== undefined || !evaluer(m.si, s)) continue;
      res.push({
        id: `mission:${m.id}`,
        libelle: `Mission ${m.rang} — ${m.titre}`,
        description: `${m.description} Risques : ${m.risques}`,
        duree: m.duree,
        categorie: 'mission',
        disponible: !grave,
        raison: grave ? 'Aucun chef d’équipe n’emmène un ninja dans ton état.' : undefined,
      });
    }
  }

  const equipee = s.armeEquipee ? instanceArme(s, s.armeEquipee) : undefined;
  if (equipee && estUtilisable(equipee) && equipee.etat < 80) {
    const cout = Math.round((100 - equipee.etat) * 0.5 + 5);
    res.push({
      id: 'forge:reparer',
      libelle: `Faire réparer ${R.armes[equipee.defId]?.nom}`,
      description: `État ${equipee.etat}/100. Coût : ${cout} ryō.`,
      duree: 0,
      categorie: 'forge',
      disponible: s.jauges.ryo >= cout,
      raison: s.jauges.ryo >= cout ? undefined : 'Pas assez de ryō.',
    });
  }
  // L'échoppe : pilules, parchemins, fumigènes (utilisables pendant les combats en manches).
  if (a >= 10) {
    for (const c of CONSOMMABLES) {
      const n = stock(s, c.id);
      res.push({
        id: `achat:${c.id}`,
        libelle: `${c.nom} — ${c.prix} ryō`,
        description: `${c.effet} En sacoche : ${n}/${STOCK_MAX}. Instantané.`,
        duree: 0,
        categorie: 'forge',
        disponible: s.jauges.ryo >= c.prix && n < STOCK_MAX,
        raison: n >= STOCK_MAX ? 'Ta sacoche est pleine.' : `Il te faudrait ${c.prix} ryō.`,
      });
    }
  }
  if (a >= 7) {
    const dejaMange = s.drapeaux['ramen_jour'] === s.jour;
    res.push({
      id: 'ramen',
      libelle: `Un bol de ramen — ${PRIX_RAMEN} ryō`,
      description: 'Bouillon brûlant, nouilles, un œuf. La fatigue recule et le moral remonte. Instantané.',
      duree: 0,
      categorie: 'repos',
      disponible: !dejaMange && s.jauges.ryo >= PRIX_RAMEN,
      raison: dejaMange ? 'Tu as déjà mangé. Même un ninja a des limites.' : `Il te faudrait ${PRIX_RAMEN} ryō.`,
    });
  }
  if (a >= 14) {
    const dejaJoue = s.drapeaux['des_jour'] === s.jour;
    res.push({
      id: 'des',
      libelle: `Jouer aux dés à la taverne — mise ${MISE_DES} ryō`,
      description: 'Pair ou impair, le gobelet claque sur la table. On gagne un peu plus souvent quand on sait lire les visages. Instantané.',
      duree: 0,
      categorie: 'repos',
      disponible: !dejaJoue && s.jauges.ryo >= MISE_DES,
      raison: dejaJoue ? 'Le patron t’a assez vu pour aujourd’hui.' : `Il te faudrait ${MISE_DES} ryō.`,
    });
  }
  if (a >= 8 && s.statut === 'actif') {
    for (const w of R.contenu.armes) {
      if (w.unique || !w.prix || !['commune', 'qualite'].includes(w.rarete)) continue;
      if (w.origine !== 'commun' && w.origine !== s.creation.village) continue;
      if (estUtilisable(instanceArme(s, w.id))) continue;
      res.push({
        id: `forge:acheter:${w.id}`,
        libelle: `Acheter : ${w.nom}`,
        description: `${w.description} Prix : ${w.prix} ryō.${w.exigences.force ? ` Force conseillée : ${w.exigences.force}.` : ''}`,
        duree: 0,
        categorie: 'forge',
        disponible: s.jauges.ryo >= w.prix,
        raison: s.jauges.ryo >= w.prix ? undefined : 'Pas assez de ryō.',
      });
    }
  }

  if ((a < 12 || s.rang === 'eleve') && (s.statut === 'actif' || s.statut === 'errant' || s.statut === 'deserteur')) {
    const route = s.statut !== 'actif';
    res.push({
      id: 'travail',
      libelle: route ? 'Petits travaux sur la route' : 'Aider au village',
      description: route ? 'Porter, réparer, garder des bêtes contre un repas et quelques ryō.' : 'Petits travaux contre quelques ryō : livrer, porter, réparer.',
      duree: 30,
      categorie: 'travail',
      disponible: true,
    });
  }

  if (s.statut === 'actif') {
    res.push({
      id: 'etudier',
      libelle: 'Étudier aux archives',
      description: 'Lire l’histoire du monde shinobi, les rapports anciens, les rumeurs consignées.',
      duree: 30,
      categorie: 'etude',
      disponible: !epuise,
      raison: epuise ? 'Tu es trop fatigué·e pour lire.' : undefined,
    });
  }

  if (s.metier.principal && s.statut === 'actif') {
    const m = R.metiers[s.metier.principal];
    res.push({
      id: 'metier:service',
      libelle: `Service : ${m?.nom}`,
      description: m?.description ?? '',
      duree: 30,
      categorie: 'metier',
      disponible: !grave,
      raison: grave ? 'Tu es en convalescence.' : undefined,
    });
  }

  for (const inst of s.arsenal) {
    if (!estUtilisable(inst) || inst.defId === s.armeEquipee) continue;
    res.push({
      id: `equiper:${inst.defId}`,
      libelle: `Prendre ${R.armes[inst.defId]?.nom}`,
      description: 'Changer d’arme principale.',
      duree: 0,
      categorie: 'equipement',
      disponible: true,
    });
  }

  return res;
}

export interface ResultatActivite {
  libelle: string;
  texte: string;
  suite?: string;
  resteEnTempsLibre?: boolean;
}

function tagsJoueur(s: GameState): string[] {
  return s.creation.traits.map((t) => R.traits[t]?.tag).filter(Boolean) as string[];
}

/** Durée maximale d'une période libre : un an pour un enfant, six mois ensuite. */
export function periodeMax(s: GameState): number {
  // Enfant : un an au plus. Adolescent : six mois. Adulte (chapitre 4 et après) : les années passent plus vite.
  if (age(s) < 12 || s.chapitre >= 4) return 360;
  return 180;
}

/** Chance, après chaque bloc d'une période, qu'un imprévu vienne l'interrompre. */
const IMPREVU = { enfant: 0.2, adulte: 0.12 };

const BOUCLABLES = new Set(['duo', 'entrainer', 'nature', 'technique', 'repos', 'famille', 'social', 'travail', 'etudier', 'metier', 'route']);
const ENTRAINEMENT = new Set(['duo', 'entrainer', 'nature', 'technique', 'route']);

/**
 * Le joueur fait UN choix pour la période qui vient. Le moteur répète ce choix, bloc après bloc,
 * jusqu'au prochain moment d'histoire, jusqu'à la durée maximale, ou jusqu'à un imprévu.
 * Les achats et le changement d'arme sont instantanés et ne consomment pas la période.
 */
/** Programme double : un sort et une discipline, chacun reçoit 60 % du temps d'un bloc. */
export const PART_DUO = 0.6;

/** Le programme double s'ouvre avec le bandeau : quand arrivent les missions et les vrais combats. */
export function duoPossible(s: GameState): boolean {
  return rangIndex(s.rang) >= rangIndex('genin') || s.statut === 'errant' || s.statut === 'deserteur';
}

function activiteDuo(s: GameState, id: string): Activite | undefined {
  if (!duoPossible(s)) return undefined;
  const parts = id.slice('duo:'.length).split('+');
  if (parts.length !== 2) return undefined;
  const acts = genererActivites(s);
  const [a, b] = parts.map((p) => acts.find((x) => x.id === p));
  if (!a?.disponible || !b?.disponible || !a.groupe || !b.groupe || a.groupe === b.groupe) return undefined;
  return { ...a, id, libelle: `${a.libelle} + ${b.libelle}`, description: `${a.description} ${b.description}`, categorie: 'entrainement', groupe: undefined };
}

function blocDuo(s: GameState, parts: string[], ctx: Ctx): string {
  const d = dureeBase(s);
  const textes = parts.map((p) => bloc(s, p, ctx, { sansTemps: true, jours: Math.round(d * PART_DUO) }));
  avancerTemps(s, d, ctx);
  s.jauges.fatigue = clamp(s.jauges.fatigue + Math.round(d * 0.42 * (estProdige(s) ? 1.2 : 1)), 0, 100);
  return textes.join(' ');
}

/** Ce qu'il reste à entraîner : une partie qui ne peut plus progresser (mur d'âge, d'expérience…) est abandonnée. */
function partiesUtiles(s: GameState, parts: string[]): string[] {
  const acts = genererActivites(s);
  return parts.filter((p) => acts.find((x) => x.id === p)?.disponible);
}

export function faireActivite(s: GameState, id: string, ctx: Ctx): ResultatActivite {
  const act = id.startsWith('duo:') ? activiteDuo(s, id) : genererActivites(s).find((x) => x.id === id);
  if (!act || !act.disponible) throw new Error(`[temps libre] activité indisponible : ${id}`);
  const [type, cible] = id.split(':');

  if (type === 'equiper') {
    equiper(s, cible, ctx);
    return { libelle: act.libelle, texte: `Tu prends ${R.armes[cible]?.nom} comme arme principale.`, resteEnTempsLibre: true };
  }
  if (type === 'forge') return { libelle: act.libelle, texte: forge(s, id, ctx), resteEnTempsLibre: true };
  if (type === 'achat') {
    acheterConsommable(s, cible, ctx);
    return { libelle: act.libelle, texte: `${CONSOMMABLE[cible].nom} ajouté à ta sacoche (${stock(s, cible)}/${STOCK_MAX}).`, resteEnTempsLibre: true };
  }
  if (type === 'ramen') {
    s.jauges.ryo -= PRIX_RAMEN;
    s.drapeaux['ramen_jour'] = s.jour;
    s.jauges.fatigue = clamp(s.jauges.fatigue - 20, 0, 100);
    s.jauges.sante = clamp(s.jauges.sante + 5, 0, 100);
    return { libelle: act.libelle, texte: 'Le patron te ressert du bouillon sans que tu le demandes. Fatigue −20, santé +5.', resteEnTempsLibre: true };
  }
  if (type === 'des') {
    s.drapeaux['des_jour'] = s.jour;
    // Lire les visages aide un peu : la perception fait pencher la chance, jamais au-delà de 55 %.
    const chance = Math.min(0.55, 0.42 + s.attributs.perception / 1000);
    const gagne = alea(s) < chance;
    s.jauges.ryo += gagne ? MISE_DES : -MISE_DES;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: gagne ? MISE_DES : -MISE_DES });
    return { libelle: act.libelle, texte: gagne ? `Les dés roulent… gagné ! +${MISE_DES} ryō. Le marchand d’en face te regarde de travers.` : `Les dés roulent… perdu. −${MISE_DES} ryō. Le patron sourit, compatissant et ravi.`, resteEnTempsLibre: true };
  }
  if (type === 'cadeau') {
    const def = defPnj(s, cible);
    s.jauges.ryo -= PRIX_CADEAU;
    s.drapeaux[`cadeau:${cible}`] = s.jour;
    appliquerEffet(s, { relation: cible, delta: { amitie: 5, confiance: 3 } }, ctx);
    return { libelle: act.libelle, texte: `${def?.nom ?? 'On'} sourit en découvrant ton cadeau. Amitié +5, confiance +3.`, resteEnTempsLibre: true };
  }
  if (type === 'mission') {
    const m = R.missions[cible];
    appliquerEffet(s, { mission: cible, statut: 'en_cours' }, ctx);
    decouvrir(s, `lieu:${resoudreLieu(s, m.lieu)}`);
    return { libelle: act.libelle, texte: `Tu acceptes la mission « ${m.titre} ».`, suite: m.evenement };
  }
  if (!BOUCLABLES.has(type)) throw new Error(`[temps libre] activité inconnue : ${id}`);
  if (ENTRAINEMENT.has(type) && type !== 'route') noterMerite(s, 'entrainement');
  if (type === 'etudier') noterMerite(s, 'etude');

  const debut = s.jour;
  const max = periodeMax(s);
  let courant = id;
  let texte = '';
  let reposForces = 0;
  let suite: string | undefined;
  let interrompu = false;
  // Après le premier bloc, une technique ou une nature apprise s'entraîne.
  const suivante = (p: string) => {
    const [t, c] = p.split(':');
    return t === 'technique' ? `entrainer:${c}` : t === 'nature' ? `entrainer:nature_${c}` : p;
  };
  let parts = type === 'duo' ? id.slice(4).split('+') : [];
  const arrets: string[] = [];
  for (let garde = 0; garde < 40; garde++) {
    const [t] = courant.split(':');
    const avant = s.jour;
    // On s'entraîne dur, mais on ne s'entraîne pas épuisé : le corps impose ses pauses.
    if (garde > 0 && ENTRAINEMENT.has(t) && s.jauges.fatigue >= 70) {
      bloc(s, 'repos', ctx);
      reposForces++;
    } else if (t === 'duo') {
      if (garde > 0) {
        const restantes = partiesUtiles(s, parts);
        for (const p of parts) if (!restantes.includes(p)) arrets.push(p);
        parts = restantes;
        if (!parts.length) break;
      }
      texte = parts.length === 2 ? blocDuo(s, parts, ctx) : bloc(s, parts[0], ctx);
      parts = parts.map(suivante);
    } else {
      if (garde > 0) {
        const encore = genererActivites(s).find((x) => x.id === courant);
        if (!encore?.disponible) {
          arrets.push(courant);
          break;
        }
      }
      texte = bloc(s, courant, ctx);
      courant = suivante(courant);
    }
    if (s.fin || s.jauges.sante <= 0) break;
    if (trameDisponible(s)) break;
    if (s.jour - debut >= max) break;
    const chance = (age(s) < 12 ? IMPREVU.enfant : IMPREVU.adulte) * ((s.jour - avant) / dureeBase(s));
    if (alea(s) < chance) {
      suite = tirerAleatoire(s);
      if (suite) {
        interrompu = true;
        break;
      }
    }
  }
  const extras: string[] = [];
  // Une seule ligne par maîtrise arrivée au bout de ce que l'entraînement peut donner.
  for (const p of new Set(arrets)) {
    const m = p.split(':')[1];
    const prog = m && s.maitrises[m] ? etatProgression(s, m) : undefined;
    if (prog?.inutile && prog.murTexte) extras.push(`${R.maitrises[m]?.nom} : l’entraînement a donné tout ce qu’il pouvait. ${prog.murTexte}`);
  }
  if (reposForces) extras.push(reposForces > 1 ? `Ton corps t’a imposé ${reposForces} pauses pour récupérer.` : 'Ton corps t’a imposé une pause pour récupérer.');
  if (interrompu) extras.push('Mais la vie ne t’a pas laissé finir tranquillement.');
  return { libelle: act.libelle, texte: [texte, ...extras].filter(Boolean).join('\n\n'), suite };
}

/** Réparer ou acheter : instantané, la période libre n'est pas consommée. */
function forge(s: GameState, id: string, ctx: Ctx): string {
  const [, cible, cible2] = id.split(':');
  if (cible === 'reparer' && s.armeEquipee) {
    const inst = instanceArme(s, s.armeEquipee);
    const cout = Math.round((100 - (inst?.etat ?? 100)) * 0.5 + 5);
    s.jauges.ryo -= cout;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: -cout });
    reparerArme(s, s.armeEquipee);
    ctx.changements.push({ t: 'arme', arme: s.armeEquipee, message: 'Arme remise à neuf.' });
    return 'Le forgeron examine la lame en silence, puis se met au travail. Quand il te la rend, elle chante de nouveau.';
  }
  const w = R.armes[cible2];
  s.jauges.ryo -= w.prix ?? 0;
  ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: -(w.prix ?? 0) });
  obtenirArme(s, w.id, 'possedee', ctx);
  return `Tu repars avec ${w.nom}. Elle te semble étrangère dans la main : il faudra l’apprivoiser.`;
}

/** Un bloc de temps (une saison pour un enfant, un mois ensuite) consacré à une activité. Renvoie son récit. */
function bloc(s: GameState, id: string, ctx: Ctx, opts: { sansTemps?: boolean; jours?: number } = {}): string {
  const [type, cible] = id.split(':');
  const dBloc = type === 'repos' || type === 'famille' || type === 'social' || type === 'travail' || type === 'etudier' || type === 'metier' ? 30 : dureeBase(s);
  // Programme double : chaque moitié reçoit une part du temps, et le temps ne passe qu'une fois (voir blocDuo).
  const d = opts.jours ?? dBloc;
  const duree = libelleDuree(dBloc);
  const temps = (j: number) => {
    if (!opts.sansTemps) avancerTemps(s, j, ctx);
  };
  const fatiguer = (f: number) => {
    if (!opts.sansTemps) s.jauges.fatigue = clamp(s.jauges.fatigue + f, 0, 100);
  };
  switch (type) {
    case 'entrainer': {
      const def = R.maitrises[cible];
      const mentor = drapeauVrai(s, `mentor:${cible}`) || (def.kind === 'clan' && age(s) < 14 && s.creation.clan !== 'sans_clan' && s.statut === 'actif');
      applyTraining(s, cible, d, mentor, ctx);
      const fatigue = Math.round(d * 0.35 * (estProdige(s) ? 1.4 : 1));
      temps(dBloc);
      fatiguer(fatigue);
      let texte = mentor
        ? `Tu consacres ${duree} à ${def.nom}, sous un regard exigeant qui corrige chaque geste.`
        : `Tu consacres ${duree} à ${def.nom}. Les mêmes gestes, encore et encore, jusqu’à ce que le corps s’en souvienne seul.`;
      if (s.jauges.fatigue >= 70) texte += ' La fatigue s’accumule : ton corps commence à protester.';
      return texte;
    }
    case 'nature': {
      const el = cible as ElementId;
      const mid = `nature_${el}`;
      const enseignee = (R.villages[s.creation.village]?.naturesEnseignees.includes(el) ?? false) && s.statut === 'actif';
      const potentiel = clamp(25 + s.attributs.controleChakra / 3 + aleaEntier(s, 0, 15), 0, 100);
      s.maitrises[mid] = nouvelleMaitrise(R.maitrises[mid], potentiel, enseignee ? 'mentor' : 'entrainement');
      if (enseignee) s.drapeaux[`mentor:${mid}`] = true;
      s.drapeaux['natures_apprises'] = (Number(s.drapeaux['natures_apprises']) || 0) + 1;
      ajouterJournal(s, `Tu commences l’étude d’une nouvelle nature : ${R.elements[el]?.nom}.`, 2);
      applyTraining(s, mid, d, enseignee, ctx);
      temps(dBloc);
      fatiguer(Math.round(d * 0.35));
      return enseignee
        ? `Un instructeur te fait poser une feuille de papier à chakra sur la paume, puis une autre, cent fois. Ton chakra résiste : il n’a pas été fait pour ${R.elements[el]?.nom}. Il apprendra.`
        : `Personne pour te guider : des rouleaux empruntés, des essais, des échecs. ${R.elements[el]?.nom} se refuse à toi longtemps avant de céder un peu.`;
    }
    case 'technique': {
      const def = R.maitrises[cible];
      const t = def.technique!;
      const maitre = typeof t.enseignee === 'object' ? t.enseignee.maitre : undefined;
      const source = maitre ? 'mentor' : t.enseignee === 'village' ? 'mentor' : 'entrainement';
      apprendreTechnique(s, cible, source, ctx);
      if (source === 'mentor') s.drapeaux[`mentor:${cible}`] = true;
      applyTraining(s, cible, Math.round(d / 2), source === 'mentor', ctx);
      temps(dBloc);
      fatiguer(Math.round(d * 0.3));
      return maitre
        ? `${maitre} te montre ${def.nom} une fois, lentement, puis te regarde échouer jusqu’au soir. Au bout de ${duree}, la technique t’obéit, maladroitement.`
        : t.enseignee === 'village'
          ? `Un instructeur décompose ${def.nom} geste par geste. Il te faut ${duree} pour l’exécuter sans t’effondrer.`
          : `Seul·e, tu reprends ${def.nom} encore et encore. Après ${duree}, elle te vient enfin, imparfaite.`;
    }
    case 'repos': {
      avancerTemps(s, d, ctx);
      s.jauges.fatigue = clamp(s.jauges.fatigue - 40, 0, 100);
      appliquerEffet(s, { stat: 'jauges.sante', delta: 15 }, ctx);
      return 'Tu dors, tu manges, tu laisses les jours passer. Le monde n’attend pas, mais ton corps, si.';
    }
    case 'famille': {
      const parent = s.roles['parent'];
      const r = aleaEntier(s, 0, 9);
      appliquerEffet(s, { relation: parent, delta: { amitie: r >= 2 ? 4 : 1, confiance: r >= 5 ? 3 : 0 } }, ctx);
      if (s.creation.clan !== 'sans_clan') appliquerEffet(s, { stat: 'social.confianceClan', delta: 2 }, ctx);
      avancerTemps(s, d, ctx);
      return r >= 2
        ? resoudreTexte('Des repas partagés, des silences qui ne pèsent pas. {Parent} te raconte un peu de sa jeunesse, pas tout.', s)
        : resoudreTexte('{Parent} est souvent absent{parent_e}, préoccupé{parent_e}. Tu comprends qu’il y a des choses dont on ne te parle pas encore.', s);
    }
    case 'social': {
      const def = defPnj(s, cible);
      avancerTemps(s, d, ctx);
      if (!def) return '';
      const tags = tagsJoueur(s);
      let score = aleaEntier(s, -2, 2);
      for (const t of tags) {
        if (def.aime.includes(t)) score += 2;
        if (def.deteste.includes(t)) score -= 3;
      }
      const rel = relationDe(s, cible);
      if (score >= 2) {
        appliquerEffet(s, { relation: cible, delta: { amitie: 5, confiance: 3 } }, ctx);
        if (!rel.souvenirs.includes('Un moment partagé où tout semblait simple.')) rel.souvenirs.push('Un moment partagé où tout semblait simple.');
        return `Avec ${def.nom}, le temps passe sans qu’on y pense. Quelque chose se construit, lentement.`;
      }
      if (score >= 0) {
        appliquerEffet(s, { relation: cible, delta: { amitie: 2 } }, ctx);
        return `Tu passes du temps avec ${def.nom}. Rien d’extraordinaire, mais c’est ainsi que naissent les liens.`;
      }
      appliquerEffet(s, { relation: cible, delta: { rivalite: 3, confiance: -2 } }, ctx);
      if (!rel.souvenirs.includes('Un malentendu, jamais vraiment dissipé.')) rel.souvenirs.push('Un malentendu, jamais vraiment dissipé.');
      return `Un mot de trop, une attitude mal comprise : ${def.nom} se ferme. Tous les liens ne se nouent pas en passant du temps ensemble.`;
    }
    case 'travail': {
      const gain = aleaEntier(s, 10, 25);
      s.jauges.ryo += gain;
      ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: gain });
      avancerTemps(s, d, ctx);
      return s.statut === 'actif'
        ? 'Des caisses à porter, des messages à livrer, des toits à réparer. Le village a besoin de bras, même petits.'
        : 'Un village, puis un autre : du bois à fendre, des bêtes à garder. On te paie mal, mais on te nourrit.';
    }
    case 'etudier': {
      const candidats = R.contenu.encyclopedie.filter(
        (e) => (e.categorie === 'histoire' || e.categorie === 'organisation' || e.categorie === 'lieu') && !e.publique && !s.decouvertes.includes(e.id),
      );
      appliquerEffet(s, { stat: 'attributs.intellect', delta: 1 }, ctx);
      avancerTemps(s, d, ctx);
      if (candidats.length) {
        const e = candidats[Math.floor(alea(s) * candidats.length)];
        decouvrir(s, e.id);
        ctx.changements.push({ t: 'info', message: `Encyclopédie : « ${e.titre} » découvert.` });
        return `Entre les rouleaux poussiéreux, tu trouves un récit sur « ${e.titre} ».`;
      }
      return 'Tu relis ce que tu sais déjà. Les archives ont livré ce qu’elles pouvaient à quelqu’un de ton rang.';
    }
    case 'metier': {
      const mid = s.metier.principal!;
      const n = (Number(s.drapeaux[`services:${mid}`]) || 0) + 1;
      s.drapeaux[`services:${mid}`] = n;
      appliquerEffet(s, { reputationMetier: 2 }, ctx);
      if (n >= 4 * (s.metier.palier + 1)) appliquerEffet(s, { palierMetier: s.metier.palier + 1 }, ctx);
      avancerTemps(s, d, ctx);
      return `Un mois au service de ton unité (${R.metiers[mid]?.nom}). Le travail est rarement glorieux, toujours formateur.`;
    }
    case 'route':
      return combatDeRoute(s, cible === 'contrat', d, ctx);
    default:
      throw new Error(`[temps libre] bloc inconnu : ${id}`);
  }
}

/** Duel ou contrat sur les routes : expérience réelle, ryō, et un vrai risque de mourir. */
function combatDeRoute(s: GameState, contrat: boolean, d: number, ctx: Ctx): string {
  const a = age(s);
  const test: CheckDef = {
    type: 'combat',
    difficulte: (contrat ? 34 : 30) + Math.max(0, a - 10) * 2,
    attributs: contrat ? { perception: 1, force: 1, intellect: 1 } : { force: 1, agilite: 1, perception: 1 },
    maitrises: { taijutsu: 1, arme: 1 },
    arme: true,
    letal: a >= 12,
    succes: { texte: '', effets: [] },
    echec: { texte: '', effets: [] },
  };
  const { issue, mort } = resoudreEpreuve(s, test, ctx);
  avancerTemps(s, d, ctx);
  s.jauges.fatigue = clamp(s.jauges.fatigue + Math.round(d * 0.3), 0, 100);
  if (mort) {
    s.drapeaux['cause_mort'] = contrat ? 'tombé·e pendant un contrat, loin de chez toi' : 'tombé·e en duel sur une route sans nom';
    return contrat
      ? 'L’escorte tourne au massacre. Le marchand s’enfuit avec la caisse ; toi, tu restes dans le fossé.'
      : 'Ce jour-là, l’adversaire était meilleur. Il ne t’a pas laissé une deuxième chance.';
  }
  if (issue === 'succes' || issue === 'critique') {
    const gain = contrat ? aleaEntier(s, 30, 70) : aleaEntier(s, 10, 35);
    s.jauges.ryo += gain;
    ctx.changements.push({ t: 'stat', chemin: 'jauges.ryo', delta: gain });
    appliquerEffet(s, { stat: 'social.reputationOmbre', delta: 1 }, ctx);
    return contrat
      ? 'Une escorte, un recouvrement, une garde de nuit : tu fais le travail, on te paie. Sur les routes, ton nom commence à circuler.'
      : 'Des duels dans des cours de ferme, au bord des rivières. Tu gagnes plus que tu ne perds, et chaque victoire t’apprend quelque chose.';
  }
  return contrat
    ? 'Un contrat qui tourne mal : tu t’en sors, mais avec des marques. Personne ne te paiera pour celui-là.'
    : 'Tu perds plus souvent qu’à ton tour. Les cicatrices aussi sont des leçons, mais elles coûtent cher.';
}
