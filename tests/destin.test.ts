import { describe, expect, it } from 'vitest';
import { creation, simuler } from './aide';
import { nouvellePartie, validerCreation, CHANCE_PRODIGE, chanceJinchuriki } from '../src/engine/moteur';
import { nouveauCtx, nomComplet } from '../src/engine/etat';
import { eveilsAutomatiques, applyTraining, blocagePalier, porteurJoueur, tauxProgression } from '../src/engine/maitrise';
import { genererActivites, faireActivite, naturesMax } from '../src/engine/tempsLibre';
import { valeurJeton } from '../src/engine/texte';
import { R } from '../src/engine/registre';
import type { GameState, Tirages, VillageId } from '../src/engine/types';

const partie = (p = {}, graine = 42, imposes?: Partial<Tirages>): GameState => nouvellePartie(creation(p), graine, imposes);
const VILLAGES: VillageId[] = ['konoha', 'suna', 'kiri', 'kumo', 'iwa'];

describe('Nom et origine', () => {
  it('le nom de famille vient du clan, sans saisie possible', () => {
    const s = partie({ clan: 'uchiha', nom: 'Inventé' } as never);
    expect(s.creation.nom).toBe('Uchiha');
    expect(nomComplet(s)).toBe('Aya Uchiha');
  });
  it('un personnage sans clan n’a que son prénom, et sa famille non plus', () => {
    const s = partie({ village: 'suna', clan: 'sans_clan', element: 'fuuton' });
    expect(s.creation.nom).toBe('');
    expect(nomComplet(s)).toBe('Aya');
    expect(s.pnjGeneres['famille_parent'].nom).not.toContain(' ');
    expect(s.pnjGeneres['famille_aine'].nom).not.toContain(' ');
  });
  it('un orphelin a un tuteur et un aîné de cœur, jamais une mère ou un père', () => {
    const s = partie({ village: 'kiri', clan: 'sans_clan', element: 'suiton', origine: 'orphelin' });
    expect(s.drapeaux['orphelin']).toBe(true);
    expect(valeurJeton(s, 'parent')).toMatch(/^(ta tutrice|ton tuteur)$/);
    expect(valeurJeton(s, 'aine')).toMatch(/de cœur$/);
    expect(valeurJeton(s, 'clanOuFamille')).toBe('l’orphelinat');
  });
  it('seul un sans-clan peut être orphelin, et aucun don spécial ne se choisit', () => {
    expect(validerCreation(creation({ clan: 'uchiha', origine: 'orphelin' }))).not.toEqual([]);
    expect(validerCreation(creation({ traits: ['determine', 'curieux', 'prodige'] }))).not.toEqual([]);
  });
});

describe('Tirages du destin', () => {
  const echantillon = (village: VillageId, n: number) =>
    Array.from({ length: n }, (_, i) => nouvellePartie(creation({ village, clan: 'sans_clan', element: R.villages[village].naturesEnseignees[0] }), 5000 + i).tirages);

  it('les tirages sont déterministes pour une même graine', () => {
    expect(partie({}, 777).tirages).toEqual(partie({}, 777).tirages);
  });
  it('Prodige et jinchūriki sortent avec la fréquence annoncée', () => {
    const t = echantillon('iwa', 3000);
    const prodiges = t.filter((x) => x.prodige).length / t.length;
    const jinchuriki = t.filter((x) => x.biju).length / t.length;
    expect(Math.abs(prodiges - CHANCE_PRODIGE)).toBeLessThan(0.02);
    // Échantillon : enfants sans clan, d'une famille du commun. Les orphelins le sont plus souvent, les enfants de clan rarement.
    expect(Math.abs(jinchuriki - chanceJinchuriki(creation({ clan: 'sans_clan' })))).toBeLessThan(0.02);
    expect(chanceJinchuriki(creation({ clan: 'sans_clan', origine: 'orphelin' }))).toBeGreaterThan(chanceJinchuriki(creation({ clan: 'sans_clan' })));
    expect(chanceJinchuriki(creation({ clan: 'uchiha' }))).toBeLessThan(chanceJinchuriki(creation({ clan: 'sans_clan' })));
  });
  it('un jinchūriki porte toujours une bête de son propre village', () => {
    for (const v of VILLAGES) {
      for (const t of echantillon(v, 600)) {
        if (t.biju) expect(R.contenu.bijus.find((b) => b.id === t.biju)?.village).toBe(v);
      }
    }
  });
  it('une lignée de fusion n’apparaît que dans les villages qui la portent, sauf un sang inconnu', () => {
    for (const v of VILLAGES) {
      for (const t of echantillon(v, 600)) {
        for (const l of t.lignees) if (l !== t.sangInconnu) expect(R.maitrises[l].lignee?.[v]).toBeGreaterThan(0);
      }
    }
    // À Konoha, aucune lignée de village : seul un enfant sans clan peut descendre d'une lignée perdue.
    expect(echantillon('konoha', 600).every((t) => t.lignees.every((l) => l === t.sangInconnu))).toBe(true);
  });
  it('le jinchūriki ignore tout au départ : chakra scellé, aucun secret connu', () => {
    const s = partie({ village: 'konoha', clan: 'sans_clan', element: 'katon' }, 1, { biju: 'kyubi' });
    expect(s.maitrises['chakra_biju']?.awakened).toBe(false);
    expect(s.drapeaux['jinchuriki']).toBe('kyubi');
    expect(s.secrets).not.toContain('jinchuriki');
    expect(valeurJeton(s, 'biju')).toContain('Kurama');
  });
  it('un prodige tiré gagne un palier de plafond, comme le trait', () => {
    const normal = partie({}, 3, { prodige: false });
    const prodige = partie({}, 3, { prodige: true });
    expect(porteurJoueur(prodige).prodige).toBe(true);
    expect(porteurJoueur(normal).prodige).toBe(false);
  });
});

describe('Natures de chakra', () => {
  const genin = (imposes?: Partial<Tirages>, p = {}) => {
    const s = partie({ village: 'iwa', clan: 'sans_clan', element: 'doton', ...p }, 9, imposes);
    s.jour += 7 * 360; // 13 ans
    s.rang = 'genin';
    s.maitrises['nature_doton'].tier = 2;
    s.maitrises['nature_doton'].trainingDays = 200;
    s.scene = { type: 'temps_libre' };
    return s;
  };

  it('un élève ne peut porter qu’une nature ; un genin de 12 ans, deux ; un chūnin, trois', () => {
    const s = partie();
    expect(naturesMax(s)).toBe(1);
    const g = genin();
    expect(naturesMax(g)).toBe(2);
    g.rang = 'chunin';
    expect(naturesMax(g)).toBe(3);
  });
  it('apprendre une deuxième nature exige d’avoir façonné la première', () => {
    const g = genin();
    g.maitrises['nature_doton'].tier = 1;
    const act = genererActivites(g).find((a) => a.id === 'nature:katon');
    expect(act?.disponible).toBe(false);
    g.maitrises['nature_doton'].tier = 2;
    expect(genererActivites(g).find((a) => a.id === 'nature:katon')?.disponible).toBe(true);
  });
  it('une nature apprise progresse plus lentement que l’affinité innée, moins lentement si le village l’enseigne', () => {
    const g = genin();
    faireActivite(g, 'nature:katon', nouveauCtx()); // enseignée à Iwa
    g.maitrises['nature_katon'].potential = g.maitrises['nature_doton'].potential;
    const inne = tauxProgression(g, 'nature_doton', false);
    const enseignee = tauxProgression(g, 'nature_katon', false);
    expect(enseignee).toBeLessThan(inne);
    expect(enseignee / inne).toBeCloseTo(0.75, 2);
    const h = genin();
    faireActivite(h, 'nature:suiton', nouveauCtx()); // pas enseignée à Iwa
    h.maitrises['nature_suiton'].potential = h.maitrises['nature_doton'].potential;
    expect(tauxProgression(h, 'nature_suiton', false) / tauxProgression(h, 'nature_doton', false)).toBeCloseTo(0.55, 2);
  });
  it('une lignée de fusion s’éveille seule dès que ses deux natures sont éveillées', () => {
    const g = genin({ lignees: ['yoton'] });
    const ctx = nouveauCtx();
    eveilsAutomatiques(g, ctx);
    expect(g.maitrises['yoton'].awakened).toBe(false);
    faireActivite(g, 'nature:katon', ctx);
    applyTraining(g, 'nature_katon', 200, true, ctx);
    expect(g.maitrises['nature_katon'].tier).toBeGreaterThanOrEqual(1);
    eveilsAutomatiques(g, ctx);
    expect(g.maitrises['yoton'].awakened).toBe(true);
    expect(g.maitrises['yoton'].tier).toBe(1);
    expect(g.drapeaux['fusion']).toBe('yoton');
  });
  it('une fusion ne dépasse jamais d’un palier la plus faible de ses natures', () => {
    const g = genin({ lignees: ['yoton'] });
    g.maitrises['nature_katon'] = { ...g.maitrises['nature_doton'], id: 'nature_katon', tier: 1, trainingDays: 0 };
    g.maitrises['yoton'].awakened = true;
    g.maitrises['yoton'].tier = 2;
    g.maitrises['yoton'].trainingDays = 1000;
    g.maitrises['yoton'].combatUses = 50;
    expect(blocagePalier(porteurJoueur(g), 'yoton')).toBe('prerequis');
  });
});

describe('Simulations avec dons tirés', () => {
  it('un jinchūriki orphelin et prodige traverse le chapitre sans blocage', () => {
    for (const v of VILLAGES) {
      const biju = R.contenu.bijus.find((b) => b.village === v)!.id;
      const r = simuler(
        creation({ village: v, clan: 'sans_clan', element: R.villages[v].naturesEnseignees[0], origine: 'orphelin' }),
        31,
        1500,
        { prodige: true, biju },
      );
      expect(r.erreurs).toEqual([]);
      expect(r.fin).toBeDefined();
    }
  });
});
