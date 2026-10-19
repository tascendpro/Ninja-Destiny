import type { Condition, Effect, ElementId, VillageId } from '../../engine/types';
import { ARMES_HERITAGE } from '../armes';

/** Arme d'héritage : celle du clan si elle existe, sinon celle du village. */
export function effetsHeritage(): Effect[] {
  const villages = Object.entries(ARMES_HERITAGE.village) as [VillageId, string][];
  let chaine: Effect[] = [];
  for (let i = villages.length - 1; i >= 0; i--) {
    const [v, arme] = villages[i];
    chaine = [{ si: { village: v }, alors: [{ obtenirArme: arme }], sinon: chaine }];
  }
  const clans = Object.entries(ARMES_HERITAGE.clan);
  for (let i = clans.length - 1; i >= 0; i--) {
    const [c, arme] = clans[i];
    chaine = [{ si: { clan: c }, alors: [{ obtenirArme: arme }], sinon: chaine }];
  }
  return chaine;
}

export const TECHNIQUE_ELEMENT: Record<ElementId, string> = {
  katon: 'katon_boule',
  suiton: 'suiton_projectile',
  fuuton: 'fuuton_lame',
  raiton: 'raiton_decharge',
  doton: 'doton_mur',
};

/** Apprendre la technique de rang C de son élément, avec le sensei comme mentor de la nature. */
export function effetsLeconElement(): Effect[] {
  return (Object.keys(TECHNIQUE_ELEMENT) as ElementId[]).map((el) => ({
    si: { element: el } as Condition,
    alors: [
      { apprendre: TECHNIQUE_ELEMENT[el], source: 'mentor' },
      { drapeau: `mentor:nature_${el}` },
      { entrainer: `nature_${el}`, jours: 30, mentor: true },
    ] as Effect[],
  }));
}

/** Entraîner la nature élémentaire du joueur, quelle qu'elle soit. */
export function entrainerNature(jours: number, mentor = false): Effect[] {
  return (Object.keys(TECHNIQUE_ELEMENT) as ElementId[]).map((el) => ({
    si: { element: el } as Condition,
    alors: [{ entrainer: `nature_${el}`, jours, mentor }] as Effect[],
  }));
}

/** Entraîner le pouvoir de clan principal, s'il est éveillé. */
export const POUVOIR_PRINCIPAL: Record<string, string> = {
  uchiha: 'sharingan',
  hyuga: 'byakugan',
  nara: 'kagemane',
  yamanaka: 'shintenshin',
  akimichi: 'baika',
  aburame: 'kikaichu',
  inuzuka: 'ninken_lien',
  senju: 'vitalite_senju',
  uzumaki: 'fuinjutsu_uzumaki',
  hozuki: 'hydrification',
  kaguya: 'shikotsumyaku',
  yuki: 'hyoton',
  shirakaze: 'souffle_dunes',
  raiko: 'armure_foudre',
  ishikawa: 'peau_roche',
};

export function entrainerPouvoir(jours: number, mentor = false): Effect[] {
  return Object.entries(POUVOIR_PRINCIPAL).map(([clan, p]) => ({
    si: { tout: [{ clan }, { maitrise: p, eveille: true }] } as Condition,
    alors: [{ entrainer: p, jours, mentor }] as Effect[],
  }));
}

/** Expérience de combat réel pour le pouvoir principal éveillé (palier ≥ 1). */
export function combatPouvoir(): Effect[] {
  return Object.entries(POUVOIR_PRINCIPAL).map(([clan, p]) => ({
    si: { tout: [{ clan }, { maitrise: p, palierMin: 1 }] } as Condition,
    alors: [{ combatSur: [p] }] as Effect[],
  }));
}

/** Condition : le pouvoir principal du joueur est éveillé. */
export const POUVOIR_EVEILLE: Condition = {
  un: Object.entries(POUVOIR_PRINCIPAL).map(([clan, p]) => ({ tout: [{ clan }, { maitrise: p, palierMin: 1 }] })),
};

/** Le village ennemi naturel du joueur, pour nommer les adversaires. */
export const ENNEMI_DE: Record<VillageId, string> = {
  konoha: 'Iwa',
  suna: 'Iwa',
  kiri: 'Kumo',
  kumo: 'Konoha',
  iwa: 'Konoha',
};

export function segmentsParVillage(textes: Record<VillageId, string>): { si: Condition; texte: string }[] {
  return (Object.keys(textes) as VillageId[]).map((v) => ({ si: { village: v }, texte: textes[v] }));
}
