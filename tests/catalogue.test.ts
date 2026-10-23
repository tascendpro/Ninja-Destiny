import { describe, expect, it } from 'vitest';
import { creation, jouerCombat } from './aide';
import { choisir, choixVisibles, nouvellePartie } from '../src/engine/moteur';
import { attaqueDisponible } from '../src/engine/epreuves';
import { blocageApprentissage } from '../src/engine/maitrise';
import { decorScene } from '../src/engine/decors';
import { R } from '../src/engine/registre';
import { ATTRIBUTS } from '../src/engine/types';
import type { GameState } from '../src/engine/types';

const adulte = (clan = 'sans_clan', graine = 5): GameState => {
  const s = nouvellePartie(creation({ village: 'konoha', clan, element: 'katon' }), graine);
  s.jour = s.naissance + 26 * 360;
  s.chapitre = 4;
  s.rang = 'jonin';
  for (const a of ATTRIBUTS) s.attributs[a] = 100;
  s.jauges.chakraMax = 300;
  s.jauges.chakra = 300;
  return s;
};
/** Le défi du dojo, en ouvrant les portes dès la première manche. */
const huitiemePorte = (s: GameState): GameState =>
  jouerCombat(choisir(s, 'defier'), (v) => (v.familles.find((f) => f.id === 'pouvoir')?.actions.some((a) => a.id === 'tai_portes' && a.disponible) ? { famille: 'pouvoir', choix: 'tai_portes' } : undefined));

const donner = (s: GameState, id: string, tier = 1) => {
  s.maitrises[id] = { ...s.maitrises['taijutsu'], id, kind: 'jutsu', awakened: true, tier: tier as 1, trainingDays: 0, bloquee: false };
};

describe('Catalogue des techniques', () => {
  const cat = R.contenu.catalogue;
  it('chaque fiche est unique et chaque technique jouable citée existe dans le jeu', () => {
    const ids = cat.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cat.filter((f) => f.jouable && !R.maitrises[f.jouable]).map((f) => f.id)).toEqual([]);
    expect(cat.length).toBeGreaterThanOrEqual(150);
  });
  it('les techniques interdites et ultimes demandées sont toutes là, statut séparé du rang', () => {
    for (const nom of ['Edo Tensei', 'Shiki Fūjin', 'Izanagi', 'Izanami', 'Hachimon', 'Yagai', 'C0', 'Rinne Tensei', 'Chibaku Tensei', 'Mugen Tsukuyomi', 'Indora no Ya', 'Baryon', 'Chō Ōdama', 'Amenominaka']) {
      expect(cat.some((f) => f.japonais.includes(nom)), nom).toBe(true);
    }
    // Une technique interdite n'est pas forcément de rang S.
    expect(cat.some((f) => f.kinjutsu && f.rang !== 'S' && f.rang !== 'SS')).toBe(true);
    expect(cat.some((f) => f.rang === 'SS')).toBe(true);
  });
  it('les dix paires d’éléments ont chacune au moins une technique', () => {
    const bases = ['katon', 'suiton', 'fuuton', 'raiton', 'doton'];
    const fusion: Record<string, string> = { 'katon+suiton': 'futton', 'doton+katon': 'yoton', 'fuuton+suiton': 'hyoton', 'raiton+suiton': 'ranton', 'doton+suiton': 'mokuton', 'doton+fuuton': 'jiton', 'doton+raiton': 'bakuton' };
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) {
        const paire = [bases[i], bases[j]].sort();
        const kg = fusion[paire.join('+')];
        const trouve = cat.some((f) => (kg && f.elements?.includes(kg)) || (paire.every((e) => f.elements?.includes(e)) && f.elements!.length === 2));
        expect(trouve, paire.join('+')).toBe(true);
      }
  });
  it('les créations originales sont signalées comme telles', () => {
    for (const id of ['enputon_karyu', 'raikaton_gorai', 'shinku_raijin', 'futton_ennetsu']) expect(cat.find((f) => f.id === id)?.origine).toBe('original');
  });
});

describe('Techniques jouables : clans et kinjutsu', () => {
  it('une technique de clan reste fermée aux autres clans', () => {
    const s = adulte('nara');
    expect(blocageApprentissage(s, 'hyuga_kusho')).toMatch(/autre clan/);
  });
  it('Izanagi ne s’utilise que deux fois dans une vie', () => {
    const s = adulte('uchiha');
    donner(s, 'izanagi');
    expect(attaqueDisponible(s, 'izanagi')).toBe(true);
    s.drapeaux['usages_izanagi'] = 2;
    expect(attaqueDisponible(s, 'izanagi')).toBe(false);
  });
  it('le Shiki Fūjin gagne le combat et emporte son utilisateur', () => {
    const s = adulte('uzumaki');
    donner(s, 'shiki_fujin');
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    s.jauges.chakraMax = 400;
    s.jauges.chakra = 400;
    let t = choisir(s, 'frontal');
    t = jouerCombat(t, (v) => (v.familles.find((f) => f.id === 'ninjutsu')?.actions.some((a) => a.id === 'shiki_fujin' && a.disponible) ? { famille: 'ninjutsu', choix: 'shiki_fujin' } : undefined));
    expect(t.fin?.id).toBe('mort');
    expect(String(t.drapeaux['cause_mort'])).toContain('Shiki Fūjin');
  });
  it('la huitième porte peut tuer, mais seulement au palier 5', () => {
    let morts4 = 0;
    let morts5 = 0;
    for (let g = 1; g <= 60; g++) {
      for (const tier of [4, 5]) {
        const s = adulte('sans_clan', g);
        donner(s, 'tai_portes', tier);
        s.scene = { type: 'evenement', id: 'e_dojo' };
        s.statut = 'errant';
        s.drapeaux['errance_voie'] = 'dojo';
        const t = huitiemePorte(s);
        if (t.fin?.id === 'mort' || t.drapeaux['sacrifice']) tier === 4 ? morts4++ : morts5++;
      }
    }
    expect(morts4).toBe(0);
    expect(morts5).toBeGreaterThan(5);
  });
});

describe('Bibliothèque des lieux', () => {
  const decors = R.contenu.decors;
  it('210 décors uniques, rangés sous public/images/locations', () => {
    expect(decors).toHaveLength(210);
    expect(new Set(decors.map((d) => d.id)).size).toBe(210);
    expect(decors.every((d) => d.image.startsWith('/images/locations/') && d.image.endsWith('.webp'))).toBe(true);
  });
  it('chaque lieu du jeu a son décor, et les décors cités existent', () => {
    const ids = new Set(decors.map((d) => d.id));
    expect(R.contenu.lieux.filter((l) => !R.contenu.decorsLieux[l.id]).map((l) => l.id)).toEqual([]);
    expect(Object.values(R.contenu.decorsLieux).filter((d) => !ids.has(d))).toEqual([]);
    expect(Object.entries(R.contenu.decorsEvenements).filter(([e, d]) => !ids.has(d) || !R.evenements[e])).toEqual([]);
    expect(R.contenu.evenements.filter((e) => e.decor && !ids.has(e.decor)).map((e) => e.id)).toEqual([]);
    expect(decors.filter((d) => d.priorite === 1).length).toBeGreaterThan(40);
  });
  it('une scène essaie le décor précis puis celui du lieu ; un décor secret retombe sur le lieu', () => {
    const s = adulte();
    const quartier = decorScene(s, 'f_quartier')!;
    expect(quartier.id).toBe('village_attaque');
    expect(quartier.images[1]).toContain('konoha-vue');
    const myoboku = decorScene(s, 'r_myoboku')!;
    expect(myoboku.id).toBe('sanctuaire_oublie');
    s.drapeaux['maitre_jiraiya'] = true;
    expect(decorScene(s, 'r_myoboku')!.id).toBe('myoboku_terrain');
  });
});

describe('Rencontres de lieu', () => {
  it('l’ancien du clan enseigne la technique propre au clan', () => {
    const s = adulte('hyuga');
    s.scene = { type: 'evenement', id: 'r_terrain_maitre' };
    const t = choisir(s, 'apprendre');
    expect(t.maitrises['hyuga_kusho']?.tier).toBe(1);
  });
});

describe('Utilité des techniques de soutien', () => {
  it('la huitième porte tue dans 85 % des cas', () => {
    let morts = 0;
    for (let g = 1; g <= 200; g++) {
      const s = adulte('sans_clan', g);
      donner(s, 'tai_portes', 5);
      s.scene = { type: 'evenement', id: 'e_dojo' };
      s.statut = 'errant';
      s.drapeaux['errance_voie'] = 'dojo';
      if (huitiemePorte(s).fin?.id === 'mort') morts++;
    }
    expect(morts).toBeGreaterThan(150);
    expect(morts).toBeLessThan(190);
  });
  it('marcher sur les murs et sur l’eau ouvre des voies d’infiltration, verrouillées sans la technique', () => {
    const s = adulte();
    const voie = (ev: string, choix: string) => choixVisibles(s, R.evenements[ev]).find((c) => c.id === choix)!;
    expect(voie('m4_espionnage', 'mur').disponible).toBe(false);
    expect(voie('m4_espionnage', 'mur').verrou).toMatch(/murs/);
    expect(voie('ms_otage', 'eau').disponible).toBe(false);
    donner(s, 'kinobori', 2);
    donner(s, 'suimen', 2);
    expect(voie('m4_espionnage', 'mur').disponible).toBe(true);
    expect(voie('ms_otage', 'eau').disponible).toBe(true);
    expect(voie('m4_sabotage', 'poutres').disponible).toBe(true);
    expect(voie('m4_forteresse', 'eau').disponible).toBe(true);
  });
  it('une permutation maîtrisée détourne parfois un coup mortel', () => {
    let morts = 0;
    let sauves = 0;
    for (let g = 1; g <= 300; g++) {
      const s = adulte('sans_clan', g);
      for (const a of ATTRIBUTS) s.attributs[a] = 5;
      donner(s, 'kawarimi', 5);
      s.scene = { type: 'evenement', id: 'e_duel' };
      s.statut = 'errant';
      const t = jouerCombat(choisir(s, 'accepter'), (v) => (v.familles.find((f) => f.id === 'taijutsu')?.actions[0].disponible ? { famille: 'taijutsu', choix: 'frappe_rapide' } : undefined));
      if (t.fin?.id === 'mort') morts++;
      if (t.drapeaux['permutations_salvatrices']) sauves++;
    }
    expect(sauves).toBeGreaterThan(10);
    expect(morts).toBeGreaterThan(0);
  });
});
