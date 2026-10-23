// Tous les combats passent par l'Affrontement Racine. Ceux qui n'ont pas leur propre fiche reçoivent un adversaire
// tiré de leur épreuve : la difficulté donne son niveau, la nature son élément, la forme (duel ou escouade) sa voix.

import type { ChoiceDef, EventDef } from '../types';
import { R } from '../registre';
import { avecAffrontement } from '../epreuves';
import type { AdversaireDef, AffrontementDef, ContexteId, NiveauAdv } from './types';
import { REPLIQUES_DUEL, REPLIQUES_ESCOUADE } from '../../content/combat/generiques';

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
  const d: AdversaireDef = {
    id,
    nom: escouade ? 'L’escouade' : 'L’adversaire',
    genre: escouade ? 'f' : 'm',
    niveau: niveauDepuisDifficulte(t.difficulte),
    temperament: t.letal ? 'feroce' : escouade ? 'prudent' : 'fier',
    bascule: t.letal ? undefined : { vers: 'prudent', quand: 'sous_40' },
    nature: t.elementAdverse,
    habitudes: [],
    seuils: { fuite: t.letal ? 12 : 25, reddition: t.letal ? 8 : 20 },
    feinte: t.difficulte >= 54,
    motivation: '',
    voix: { registre: escouade ? 'militaire' : 'courant', tics: [] },
    repliques: escouade ? REPLIQUES_ESCOUADE : REPLIQUES_DUEL,
    escouade,
  };
  CACHE.set(id, d);
  return d;
}
