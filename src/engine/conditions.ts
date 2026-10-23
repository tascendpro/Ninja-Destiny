import type { Condition, GameState, MissionStatut } from './types';
import { STATUTS_ARME_UTILISABLES } from './types';
import { age, saisonDe } from './calendrier';
import { defPnj, lireStat, rangIndex, resoudrePnj } from './etat';
import { R } from './registre';
import { checkCareerEligibility } from './metiers';
import { duoPossible } from './duo';

function inclut<T>(valeur: T, attendu: T | T[]): boolean {
  return Array.isArray(attendu) ? attendu.includes(valeur) : valeur === attendu;
}

function dansBornes(v: number, min?: number, max?: number): boolean {
  if (min !== undefined && v < min) return false;
  if (max !== undefined && v > max) return false;
  return true;
}

/** Évalue une condition structurée contre l'état de la partie. */
export function evaluer(c: Condition | undefined, s: GameState): boolean {
  if (!c) return true;

  if ('tout' in c) return c.tout.every((x) => evaluer(x, s));
  if ('un' in c) return c.un.some((x) => evaluer(x, s));
  if ('non' in c) return !evaluer(c.non, s);

  if ('mission' in c) {
    const st = s.missions[c.mission];
    if (c.statut === 'aucun') return st === undefined;
    return st !== undefined && inclut<MissionStatut>(st, c.statut);
  }
  if ('relation' in c) {
    const id = resoudrePnj(s, c.relation);
    if (!id) return false;
    const r = s.relations[id];
    const v = r ? r[c.axe] : 0;
    return dansBornes(v, c.min, c.max);
  }
  if ('relationRompue' in c) {
    const id = resoudrePnj(s, c.relationRompue);
    const rompue = id ? !!s.relations[id]?.rompue : false;
    return rompue === c.egal;
  }
  if ('pnj' in c) {
    const id = resoudrePnj(s, c.pnj);
    if (!id || !s.pnj[id]) return false;
    return inclut(s.pnj[id].etat, c.etat);
  }
  if ('maitrise' in c) {
    const m = s.maitrises[c.maitrise];
    if (c.possede === false) return !m;
    if (!m) return false;
    if (c.eveille !== undefined && m.awakened !== c.eveille) return false;
    if (c.palierMin !== undefined && (m.tier < c.palierMin || m.bloquee)) return false;
    if (c.palierMax !== undefined && m.tier > c.palierMax) return false;
    return true;
  }
  if ('armeEnMain' in c) {
    const inst = s.armeEquipee ? s.arsenal.find((a) => a.defId === s.armeEquipee) : undefined;
    return (!!inst && STATUTS_ARME_UTILISABLES.includes(inst.statut)) === c.armeEnMain;
  }
  if ('arme' in c) {
    const inst = s.arsenal.find((a) => a.defId === c.arme);
    if (!inst) return false;
    if (c.utilisable === undefined) return STATUTS_ARME_UTILISABLES.includes(inst.statut);
    return STATUTS_ARME_UTILISABLES.includes(inst.statut) === c.utilisable;
  }
  if ('registre' in c) {
    return s.registre[c.registre]?.detenteur === c.detenteur;
  }
  if ('drapeau' in c) {
    const v = s.drapeaux[c.drapeau];
    if (c.absent) return v === undefined || v === false;
    if (c.egal !== undefined) return v === c.egal;
    if (c.min !== undefined || c.max !== undefined) {
      const n = typeof v === 'number' ? v : v ? 1 : 0;
      return dansBornes(n, c.min, c.max);
    }
    return v !== undefined && v !== false && v !== 0 && v !== '';
  }
  if ('village' in c) return inclut(s.creation.village, c.village);
  if ('clanPnj' in c) {
    const d = defPnj(s, resoudrePnj(s, c.clanPnj));
    return !!d?.clan && inclut(d.clan, c.clan);
  }
  if ('clan' in c) return inclut(s.creation.clan, c.clan);
  if ('element' in c) return inclut(s.creation.element, c.element);
  if ('age' in c) return dansBornes(age(s), c.age.min, c.age.max);
  if ('rangMin' in c) return rangIndex(s.rang) >= rangIndex(c.rangMin);
  if ('rang' in c) return inclut(s.rang, c.rang);
  if ('statut' in c) return inclut(s.statut, c.statut);
  if ('stat' in c) return dansBornes(lireStat(s, c.stat), c.min, c.max);
  if ('vu' in c) return !!s.evenementsVus[c.vu];
  if ('nonVu' in c) return !s.evenementsVus[c.nonVu];
  if ('secret' in c) return s.secrets.includes(c.secret);
  if ('indice' in c) return s.indices.includes(c.indice);
  if ('objet' in c) return s.objets.includes(c.objet);
  if ('metier' in c) {
    const actuels = [s.metier.principal, s.metier.secondaire].filter(Boolean) as string[];
    const attendus = Array.isArray(c.metier) ? c.metier : [c.metier];
    return attendus.some((m) => actuels.includes(m));
  }
  if ('sansMetier' in c) return !s.metier.principal;
  if ('metierEligible' in c) return checkCareerEligibility(s, c.metierEligible).ok;
  if ('trait' in c) return s.creation.traits.includes(c.trait);
  if ('aptitude' in c) return s.creation.aptitude === c.aptitude;
  if ('objectif' in c) return s.creation.objectif === c.objectif;
  if ('presentation' in c) return s.creation.presentation === c.presentation;
  if ('blesse' in c) return (s.blessures.length > 0) === c.blesse;
  if ('blessureGrave' in c) return s.blessures.some((b) => b.gravite >= 3) === c.blessureGrave;
  if ('chapitre' in c) return s.chapitre === c.chapitre;
  if ('saison' in c) return inclut(saisonDe(s.jour), c.saison);
  if ('difficulte' in c) return inclut(s.creation.difficulte, c.difficulte);
  if ('possedeArmeLegendaire' in c) {
    const a = s.arsenal.some(
      (i) => STATUTS_ARME_UTILISABLES.includes(i.statut) && ['legendaire', 'maudite'].includes(R.armes[i.defId]?.rarete),
    );
    return a === c.possedeArmeLegendaire;
  }
  if ('duo' in c) return !!duoPossible(s, c.duo);
  if ('missionsReussies' in c) {
    return Object.values(s.missions).filter((m) => m === 'reussie').length >= c.missionsReussies;
  }
  if ('ageDepart' in c) return s.creation.ageDepart === c.ageDepart;

  throw new Error(`[conditions] condition inconnue : ${JSON.stringify(c)}`);
}
