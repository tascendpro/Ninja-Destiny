import { describe, expect, it } from 'vitest';
import { creation, jouerCombat, simuler } from './aide';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { nouvellePartie, validerCreation, choixVisibles, choisir, combattre } from '../src/engine/moteur';
import { acheterHeritage, consommerHeritage, fusionnerMeta, lireMeta, stockageMemoire } from '../src/engine/sauvegarde';
import { ageMinTechnique, blocageApprentissage, tauxProgression } from '../src/engine/maitrise';
import { genererActivites, faireActivite } from '../src/engine/tempsLibre';
import { nouveauCtx } from '../src/engine/etat';
import { R } from '../src/engine/registre';

describe('Boutique et bourse de l’onglet', () => {
  it('les ryō d’une vie terminée rejoignent la bourse, une seule fois', () => {
    const st = stockageMemoire();
    const r = simuler(creation(), 4);
    expect(r.fin).toBeDefined();
    fusionnerMeta(st, r.etat);
    fusionnerMeta(st, r.etat);
    expect(lireMeta(st).ryo).toBe(Math.round(r.etat.jauges.ryo));
  });
  it('un héritage s’achète avec la bourse, se rembourse si on en change, et sert une seule vie', () => {
    const st = stockageMemoire();
    st.ecrire('ninja-destiny:meta', JSON.stringify({ ...lireMeta(st), ryo: 500 }));
    expect(() => acheterHeritage(st, 'mentor')).toThrow();
    expect(acheterHeritage(st, 'esprit').ryo).toBe(180);
    expect(acheterHeritage(st, 'reserve').ryo).toBe(50);
    expect(consommerHeritage(st)).toBe('reserve');
    expect(consommerHeritage(st)).toBeUndefined();
  });
  it('« Esprit vif » rend plus intelligent, accélère et avance l’apprentissage des techniques', () => {
    expect(validerCreation(creation({ heritage: 'inconnu' }))).not.toEqual([]);
    const normal = nouvellePartie(creation(), 8);
    const vif = nouvellePartie(creation({ heritage: 'esprit' }), 8);
    expect(vif.attributs.intellect).toBe(normal.attributs.intellect + 10);
    const def = R.maitrises['shunshin'];
    expect(ageMinTechnique(vif, def).age).toBeLessThan(ageMinTechnique(normal, def).age);
    vif.maitrises['bunshin'] = { ...normal.maitrises['ninjutsu'], id: 'bunshin', kind: 'jutsu', tier: 1 };
    normal.maitrises['bunshin'] = { ...normal.maitrises['ninjutsu'], id: 'bunshin', kind: 'jutsu', tier: 1 };
    expect(tauxProgression(vif, 'bunshin', false)).toBeGreaterThan(tauxProgression(normal, 'bunshin', false));
  });
});

describe('Techniques', () => {
  it('le catalogue compte au moins quarante techniques, dont des attaques de chaque famille', () => {
    const t = R.contenu.maitrises.filter((m) => m.technique);
    expect(t.length).toBeGreaterThanOrEqual(40);
    for (const cat of ['ninjutsu', 'taijutsu', 'genjutsu', 'armes', 'medical', 'fuinjutsu', 'fusion', 'biju'])
      expect(t.some((m) => m.technique!.categorie === cat && m.technique!.offensive)).toBe(true);
  });
  it('une technique de rang C s’apprend plus tôt avec une grande intelligence et un grand contrôle', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 2);
    s.jour = s.naissance + 9 * 360 + 5;
    s.maitrises['ninjutsu'].tier = 2;
    expect(blocageApprentissage(s, 'shunshin')).toMatch(/pas avant 12 ans/);
    s.attributs.intellect = 70;
    s.attributs.controleChakra = 70;
    s.jauges.chakraMax = 90;
    expect(blocageApprentissage(s, 'shunshin')).toBeUndefined();
  });
  it('apprendre une technique au temps libre la donne au palier 1, puis l’entraîne', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 2);
    s.maitrises['taijutsu'].tier = 1;
    s.scene = { type: 'temps_libre' };
    const act = genererActivites(s).find((a) => a.id === 'technique:tai_tourbillon');
    expect(act?.disponible).toBe(true);
    faireActivite(s, 'technique:tai_tourbillon', nouveauCtx());
    expect(s.maitrises['tai_tourbillon'].tier).toBeGreaterThanOrEqual(1);
  });
  it('en combat, une attaque spéciale coûte du chakra et améliore les chances', () => {
    // Combat de l'examen de Kumo : chercher une scène de combat et une attaque connue.
    const s = nouvellePartie(creation({ village: 'kumo', clan: 'raiko', element: 'raiton' }), 6);
    s.jour = s.naissance + 12 * 360 + 5;
    s.maitrises['taijutsu'].tier = 2;
    s.maitrises['tai_poing'] = { ...s.maitrises['taijutsu'], id: 'tai_poing', kind: 'jutsu', tier: 2 };
    s.scene = { type: 'evenement', id: 'a_examen_kumo' };
    const vue = choixVisibles(s, R.evenements['a_examen_kumo']);
    const combat = vue.find((c) => c.affrontement && c.disponible);
    expect(combat).toBeDefined();
    let t = choisir(s, combat!.id);
    expect(t.scene.type).toBe('affrontement');
    const tai = vueAffrontement(t)!.familles.find((f) => f.id === 'taijutsu')!;
    const poing = tai.actions.find((a) => a.id === 'tai_poing')!;
    expect(poing.chakra).toBeGreaterThan(0);
    const avant = t.jauges.chakra;
    t = combattre(t, { famille: 'taijutsu', choix: 'tai_poing' });
    expect(t.jauges.chakra).toBeLessThan(avant);
    t = jouerCombat(t);
    expect(t.historique.at(-1)!.choix).toContain('Poing ferré');
  });
});
