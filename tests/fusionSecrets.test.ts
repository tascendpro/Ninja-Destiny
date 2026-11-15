import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { FUSION_PAR_MAITRISE, fusionsParMaitrise } from '../src/engine/progression';
import { choisirPrivee, lireResultat, nouvelleCampagne, priveeDue } from '../src/engine/campagne/moteur';
import type { IdJoueur } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';

describe('Une fusion née du travail', () => {
  const prepare = (graine: number, enchainements: number, palier = 4) => {
    const s = nouvellePartie(creation({ element: 'katon' }), graine);
    for (const e of ['katon', 'doton']) {
      s.maitrises[`nature_${e}`] ??= structuredClone(s.maitrises['nature_katon']);
      s.maitrises[`nature_${e}`].tier = palier as never;
    }
    s.drapeaux['mele:doton+katon'] = enchainements;
    return s;
  };

  it('deux natures maîtrisées et souvent mêlées finissent par éveiller la fusion (Yōton), sans lignée', () => {
    let eveils = 0;
    for (let g = 1; g <= 30; g++) {
      const s = prepare(g, FUSION_PAR_MAITRISE.enchainements);
      for (let age = 14; age < 20 && !s.maitrises['yoton']; age++) fusionsParMaitrise(s, age);
      if (s.maitrises['yoton']?.awakened) eveils++;
    }
    expect(eveils).toBeGreaterThan(20);
  });

  it('rien sans le travail : pas assez d’enchaînements, ou une nature pas assez maîtrisée', () => {
    for (let g = 1; g <= 20; g++) {
      const a = prepare(g, FUSION_PAR_MAITRISE.enchainements - 1);
      const b = prepare(g, 20, 3);
      for (let age = 14; age < 30; age++) {
        fusionsParMaitrise(a, age);
        fusionsParMaitrise(b, age);
      }
      expect(a.maitrises['yoton']).toBeUndefined();
      expect(b.maitrises['yoton']).toBeUndefined();
    }
  });
});

describe('Ce que l’un apprend sur l’autre', () => {
  it('celui qui découvre la bête de l’autre choisit seul ; se taire laisse un fait qu’il porte seul', () => {
    const c = cloner(nouvelleCampagne(creation({ prenom: 'Kaito' }), creation({ prenom: 'Ren' }), { type: 'amis', passe: 'rencontre' }, 4));
    c.commune = undefined;
    c.resultat = undefined;
    c.barrieres = [];
    c.joueurs[1].drapeaux['jinchuriki'] = 'shukaku';
    for (const s of c.joueurs) {
      s.jour = s.naissance + 12 * 360;
      s.scene = { type: 'temps_libre' };
    }
    expect(priveeDue(c, 0)).toBe('mc_sa_bete');
    expect(priveeDue(c, 1)).not.toBe('mc_sa_bete');
    const apres = lireResultat(choisirPrivee(c, 0, 'taire'), 0);
    const f = apres.faits.find((x) => x.id === 'secret_bete_1')!;
    expect(f.connus).toEqual([0]);
    expect(f.cible).toBe(1);
    expect(priveeDue(apres, 0)).not.toBe('mc_sa_bete');
  });

  it('le dénoncer déclenche une enquête sur l’autre, qui ne sait pas d’où elle vient', () => {
    const c = cloner(nouvelleCampagne(creation({ prenom: 'Kaito' }), creation({ prenom: 'Ren' }), { type: 'amis', passe: 'rencontre' }, 4));
    c.commune = undefined;
    c.resultat = undefined;
    c.barrieres = [];
    c.joueurs[1].drapeaux['jinchuriki'] = 'shukaku';
    for (const s of c.joueurs) {
      s.jour = s.naissance + 12 * 360;
      s.scene = { type: 'temps_libre' };
    }
    const suspicion = c.joueurs[1].social.suspicion;
    const apres = choisirPrivee(c, 0, 'denoncer');
    expect(apres.joueurs[1].social.suspicion).toBeGreaterThan(suspicion);
    expect(apres.repercussions.some((r) => r.cible === (1 as IdJoueur) && r.faitId === 'secret_bete_1')).toBe(true);
    expect(apres.faits.find((x) => x.id === 'secret_bete_1')!.connus).toEqual([0]);
  });
});
