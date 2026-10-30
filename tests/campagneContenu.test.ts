import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/engine/campagne/moteur';
import { COMBATS_DUO } from '../src/content/campagne/combats';
import { campagneDe } from './aideCampagne';

const toutes = Object.values(SCENES);
const communes = toutes.filter((s) => !s.privee && !s.introduction && !s.dynamique && s.age);
/** Le texte brut d'une scène, toutes variantes confondues, sur quelques campagnes. */
const brut = (id: string) => {
  const sc = SCENES[id];
  const textes = [0, 1, 2, 5].map((g) => {
    const c = campagneDe(g);
    try {
      return typeof sc.texte === 'string' ? sc.texte : sc.texte(c);
    } catch {
      return '';
    }
  });
  return [...textes, ...sc.choix.map((x) => x.texte), ...sc.issues.map((x) => x.texte)].join(' ');
};

describe('Le contenu de la campagne', () => {
  it('assez de scènes à chaque âge de la vie (enfance, Académie, genin, chūnin, jōnin, vétérans, anciens)', () => {
    const dans = (min: number, max: number) => communes.filter((s) => s.age!.min >= min && s.age!.min < max).length;
    expect(dans(6, 9)).toBeGreaterThanOrEqual(15);
    expect(dans(9, 12)).toBeGreaterThanOrEqual(15);
    expect(dans(12, 15)).toBeGreaterThanOrEqual(15);
    expect(dans(15, 20)).toBeGreaterThanOrEqual(15);
    expect(dans(20, 30)).toBeGreaterThanOrEqual(20);
    expect(dans(30, 45)).toBeGreaterThanOrEqual(10);
    expect(dans(45, 99)).toBeGreaterThanOrEqual(10);
  });

  it('assez de combats à deux, et chaque combat cité par une scène existe', () => {
    const cites = toutes.flatMap((s) => s.issues.map((i) => i.combat).filter(Boolean)) as string[];
    const ids = new Set(COMBATS_DUO.map((x) => x.id));
    for (const x of cites) expect(ids.has(x), x).toBe(true);
    expect(new Set(cites).size).toBeGreaterThanOrEqual(10);
  });

  it('chaque scène a 2 à 4 choix (5 pour la ruelle, la toute première scène écrite)', () => {
    for (const s of toutes) {
      if (s.privee || s.choixPour) continue;
      expect(s.choix.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.choix.length, s.id).toBeLessThanOrEqual(s.id === 'mc_ruelle' ? 5 : 4);
    }
  });

  it('les mots d’un âge restent à leur âge : pas de gilet ni de mission de rang S chez les enfants, pas d’élève de l’Académie chez les jōnin', () => {
    for (const s of communes) {
      const t = brut(s.id);
      if (s.age!.max !== undefined && s.age!.max <= 12) expect(t, s.id).not.toMatch(/gilet|rang S|jōnin promu|ANBU|ton équipe de genin/i);
      if (s.age!.min >= 20) expect(t, s.id).not.toMatch(/en classe|ton premier clone|ta remise de bandeau/i);
    }
  });

  it('les arcs longs s’enchaînent : chaque acte vient après le précédent dans la vie', () => {
    const arcs = ['mc_rc_', 'mc_kc_', 'mc_jg_', 'mc_ec_', 'mc_ds_', 'mc_tr_', 'mc_pc_', 'mc_ol_'];
    for (const a of arcs) {
      const actes = toutes.filter((s) => s.id.startsWith(a)).sort((x, y) => x.id.localeCompare(y.id));
      expect(actes.length, a).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < actes.length; i++) expect(actes[i].age!.min, actes[i].id).toBeGreaterThan(actes[i - 1].age!.min);
    }
  });
});

describe('Les aveux de l’épilogue', () => {
  it('un secret écrit pour soi devient un aveu à l’autre, à la première personne', async () => {
    const { aveu } = await import('../src/engine/campagne/monde');
    expect(aveu('Le Héron t’a fait une offre. Tu l’as refusée, et tu l’as gardée pour toi.')).toBe('le Héron m’a fait une offre. Je l’ai refusée, et je l’ai gardée pour moi');
    expect(aveu('Tu as tué un journaliste pour protéger la réputation de l’autre.')).toBe('j’ai tué un journaliste pour protéger la réputation de toi');
    expect(aveu('Tu portes en secret l’anneau de l’Akatsuki.')).toBe('je portais en secret l’anneau de l’Akatsuki');
    // Pas de remplacement au milieu d'un mot.
    expect(aveu('Tu as tâté le terrain, tes tentes au vent.')).toBe('j’ai tâté le terrain, mes tentes au vent');
  });
});
