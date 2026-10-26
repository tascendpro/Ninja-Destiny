// Tous les combats passent par l'Affrontement Racine. Ceux qui n'ont pas leur propre fiche reçoivent un adversaire
// tiré de leur épreuve : la difficulté donne son niveau, la nature son élément, la forme (duel ou escouade) sa voix.

import type { ChoiceDef, EventDef, GameState, VillageId } from '../types';
import { R } from '../registre';
import { avecAffrontement } from '../epreuves';
import type { AdversaireDef, AffrontementDef, ContexteId, NiveauAdv } from './types';
import { ADVERSAIRES_SCENES, INDICES_TYPE, NOMS_TYPE, REPLIQUES_TYPE } from '../../content/combat/generiques';
import type { TypeAdversaire } from '../../content/combat/generiques';

export const PREFIXE_GENERIQUE = 'gen:';

/** Le niveau d'un adversaire sans fiche, d'après la difficulté de l'épreuve. */
export function niveauDepuisDifficulte(d: number): NiveauAdv {
  // Note d'équilibrage : seuils mesurés par simulation de vies entières (une vie sur dix environ va jusqu'au bout).
  if (d < 38) return 'eleve';
  if (d < 50) return 'genin';
  if (d < 62) return 'chunin';
  if (d < 72) return 'jonin';
  if (d < 82) return 'elite';
  return 'kage';
}

function choixDe(evId: string, choixId: string): { ev: EventDef; ch: ChoiceDef } | undefined {
  const ev = R.evenements[evId];
  const ch = ev?.choix.find((c) => c.id === choixId);
  return ev && ch ? { ev, ch } : undefined;
}

/** Le contexte d'un combat sans fiche : mortel en mission, examen à l'Académie ou aux examens, duel sinon. */
function contexteDe(ev: EventDef, ch: ChoiceDef): ContexteId {
  const t = ch.test!;
  if (t.letal) return t.forme === 'escouade' ? 'embuscade' : 'mission';
  if (ev.categorie === 'examen') return 'examen';
  if (ev.categorie === 'academie' || ev.categorie === 'enfance') return 'bagarre';
  return 'duel';
}

/** Le combat d'un choix sans fiche : tout choix dont l'épreuve est un combat. */
export function affrontementGenerique(evId: string, choixId: string): AffrontementDef | undefined {
  const x = choixDe(evId, choixId);
  if (!x || x.ch.test?.type !== 'combat') return undefined;
  const t = avecAffrontement(evId, choixId, x.ch.test);
  return { adversaire: `${PREFIXE_GENERIQUE}${evId}/${choixId}`, contexte: contexteDe(x.ev, { ...x.ch, test: t }), raison: '' };
}

const CACHE = new Map<string, AdversaireDef>();

/** L'adversaire d'un combat sans fiche. Toujours le même pour un même choix : il peut se souvenir de toi. */
export function adversaireGenerique(id: string): AdversaireDef {
  const deja = CACHE.get(id);
  if (deja) return deja;
  const [evId, choixId] = id.slice(PREFIXE_GENERIQUE.length).split('/');
  const x = choixDe(evId, choixId);
  if (!x?.ch.test) throw new Error(`Adversaire inconnu : ${id}`);
  const t = avecAffrontement(evId, choixId, x.ch.test);
  const escouade = t.forme === 'escouade';
  // Ce qu'il est : d'abord la table des scènes connues, sinon les mots de la scène elle-même.
  const connu = ADVERSAIRES_SCENES[`${evId}/${choixId}`];
  const t0 = Array.isArray(x.ev.texte) ? (x.ev.texte[0] as { texte: string }).texte : x.ev.texte;
  const indices = [x.ev.titre, x.ch.texte, x.ch.test.causeMort ?? '', String(t0).slice(0, 220)].join(' ');
  const type: TypeAdversaire = connu?.type ?? INDICES_TYPE.find(([, r]) => r.test(indices))?.[0] ?? 'ninja';
  const [nomDefaut, genreDefaut] = NOMS_TYPE[type][escouade ? 'groupe' : 'seul'];
  const voix = REPLIQUES_TYPE[type];
  const bete = type === 'bete';
  const d: AdversaireDef = {
    id,
    nom: connu?.nom ?? nomDefaut,
    genre: connu?.genre ?? genreDefaut,
    type,
    niveau: niveauDepuisDifficulte(t.difficulte),
    temperament: bete ? 'feroce' : t.letal ? 'feroce' : escouade ? 'prudent' : 'fier',
    bascule: t.letal || bete ? undefined : { vers: 'prudent', quand: 'sous_40' },
    nature: bete ? undefined : t.elementAdverse,
    habitudes: [],
    // Une bête blessée fuit plus tôt, et ne se rend jamais.
    seuils: bete ? { fuite: 30, reddition: 0 } : { fuite: t.letal ? 12 : 25, reddition: t.letal ? 8 : 20 },
    feinte: !bete && t.difficulte >= 54,
    motivation: '',
    voix: { registre: escouade ? 'militaire' : 'courant', tics: [] },
    repliques: (escouade && voix.groupe.length ? voix.groupe : voix.seul).length ? (escouade && voix.groupe.length ? voix.groupe : voix.seul) : REPLIQUES_TYPE.ninja.seul,
    techniques: bete ? [] : undefined,
    escouade,
    // Un ninja que la scène ne nomme pas reçoit une identité propre à cette partie (voir identiteGeneree).
    nomGenere: type === 'ninja' && !connu,
  };
  CACHE.set(id, d);
  return d;
}

const VILLAGE_DE_NATURE: Partial<Record<string, VillageId>> = { katon: 'konoha', suiton: 'kiri', fuuton: 'suna', raiton: 'kumo', doton: 'iwa' };

/** Un tirage dans [0, 1) qui ne dépend que de la graine de la partie et d'une clé : stable pendant la vie, différent d'une partie à l'autre. */
function hash01(graine: number, cle: string): number {
  let h = 2166136261 ^ graine;
  for (const c of cle) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

/** Le nom, le genre et le village d'un ninja sans nom, pour cette partie : « Ryōga Hōzuki », ou « L'escouade d'Iwa ». */
export function identiteGeneree(s: GameState, d: AdversaireDef): { nom: string; genre: 'm' | 'f'; village: VillageId } {
  // Sa nature trahit son village quand elle en est la signature (la foudre de Kumo, la terre d'Iwa…), sinon un village au hasard.
  const parNature = d.nature ? VILLAGE_DE_NATURE[d.nature] : undefined;
  const villages = (Object.keys(R.villages) as VillageId[]).filter((v) => v !== s.creation.village && R.contenu.noms[v]);
  const village = parNature && parNature !== s.creation.village ? parNature : (villages[Math.floor(hash01(s.seed, `village:${d.id}`) * villages.length)] ?? 'iwa');
  const genre: 'm' | 'f' = hash01(s.seed, `genre:${d.id}`) < 0.3 ? 'f' : 'm';
  const prenoms = R.contenu.noms[village][genre];
  const prenom = prenoms[Math.floor(hash01(s.seed, `prenom:${d.id}`) * prenoms.length)];
  // Un sur deux porte le nom d'un clan de son village.
  const clans = R.contenu.clans.filter((c) => c.id !== 'sans_clan' && c.villages.includes(village));
  const clan = hash01(s.seed, `clan:${d.id}`) < 0.5 && clans.length ? clans[Math.floor(hash01(s.seed, `nomclan:${d.id}`) * clans.length)] : undefined;
  const chef = clan ? `${prenom} ${clan.nom}` : prenom;
  // Un groupe porte le nom de son chef.
  if (d.escouade) return { nom: `L’escouade ${/^[AEIOUYÉÈÂÎÔŌŪ]/i.test(chef) ? 'd’' : 'de '}${chef}`, genre: 'f', village };
  return { nom: chef, genre, village };
}
