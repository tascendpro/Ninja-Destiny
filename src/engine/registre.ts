import type {
  CareerDef,
  ClanDef,
  Contenu,
  ElementDef,
  EndingDef,
  EntreeEncyclopedie,
  EventDef,
  LieuDef,
  MasteryDef,
  MissionDef,
  NpcDef,
  ObjectifDef,
  SuccesDef,
  TraitDef,
  VillageDef,
  WeaponDef,
} from './types';
import { CONTENU } from '../content';

function indexer<T extends { id: string }>(liste: T[], nom: string): Record<string, T> {
  const m: Record<string, T> = {};
  for (const x of liste) {
    if (m[x.id]) throw new Error(`[registre] identifiant dupliqué dans ${nom} : ${x.id}`);
    m[x.id] = x;
  }
  return m;
}

export interface Registry {
  contenu: Contenu;
  villages: Record<string, VillageDef>;
  clans: Record<string, ClanDef>;
  elements: Record<string, ElementDef>;
  traits: Record<string, TraitDef>;
  objectifs: Record<string, ObjectifDef>;
  maitrises: Record<string, MasteryDef>;
  armes: Record<string, WeaponDef>;
  metiers: Record<string, CareerDef>;
  pnj: Record<string, NpcDef>;
  lieux: Record<string, LieuDef>;
  evenements: Record<string, EventDef>;
  ordreEvenements: Record<string, number>;
  missions: Record<string, MissionDef>;
  fins: Record<string, EndingDef>;
  succes: Record<string, SuccesDef>;
  encyclopedie: Record<string, EntreeEncyclopedie>;
}

export function construireRegistre(c: Contenu): Registry {
  const ordre: Record<string, number> = {};
  c.evenements.forEach((e, i) => (ordre[e.id] = i));
  return {
    contenu: c,
    villages: indexer(c.villages, 'villages'),
    clans: indexer(c.clans, 'clans'),
    elements: indexer(c.elements, 'elements'),
    traits: indexer(c.traits, 'traits'),
    objectifs: indexer(c.objectifs, 'objectifs'),
    maitrises: indexer(c.maitrises, 'maitrises'),
    armes: indexer(c.armes, 'armes'),
    metiers: indexer(c.metiers, 'metiers'),
    pnj: indexer(c.pnj, 'pnj'),
    lieux: indexer(c.lieux, 'lieux'),
    evenements: indexer(c.evenements, 'evenements'),
    ordreEvenements: ordre,
    missions: indexer(c.missions, 'missions'),
    fins: indexer(c.fins, 'fins'),
    succes: indexer(c.succes, 'succes'),
    encyclopedie: indexer(c.encyclopedie, 'encyclopedie'),
  };
}

/** Registre global construit à partir du contenu publié. */
export const R: Registry = construireRegistre(CONTENU);
