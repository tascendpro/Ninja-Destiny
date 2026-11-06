import { describe, expect, it } from 'vitest';
import { exporter, importer } from '../src/engine/campagne/sauvegarde';
import { projeter } from '../src/engine/campagne/projection';
import { choisirCommune, joueurActif, nouvelleCampagne, rafraichir, vueCommune } from '../src/engine/campagne/moteur';
import { fait } from '../src/engine/campagne/outils';
import { creation } from './aide';
import { campagneDe, jouer } from './aideCampagne';

const partie = () => nouvelleCampagne(creation({ prenom: 'Aya', village: 'konoha', clan: 'uchiha' }), creation({ prenom: 'Ren', presentation: 'masculin', village: 'konoha', clan: 'uchiha' }), { type: 'amis', passe: 'promesse' }, 77);

describe('La sauvegarde d’une campagne à deux', () => {
  it('une sauvegarde exportée se rejoue à l’identique ; retouchée, elle échoue', () => {
    const c = jouer(campagneDe(3), 9, () => false, 400);
    const e = JSON.parse(JSON.stringify(exporter(c)));
    expect(JSON.stringify(importer(e).joueurs)).toBe(JSON.stringify(c.joueurs));
    // On fait jouer à J2 une action de J1 au milieu du journal.
    const i = e.actions.findIndex((x: { j: number; commune?: string }) => x.commune !== undefined);
    const triche = { ...e, actions: [...e.actions.slice(0, i), { ...e.actions[i], j: 1 - e.actions[i].j, commune: 'inexistant' }, ...e.actions.slice(i + 1)] };
    expect(() => importer(triche)).toThrow();
  });

  it('une sauvegarde prise au milieu d’une scène commune se recharge, et la partie continue', () => {
    let c = partie();
    c = choisirCommune(c, 0, vueCommune(c, 0)!.choix[0].id);
    expect(joueurActif(c)).toBe(1);
    // localStorage : JSON, où les « pas encore choisi » deviennent null.
    const relu = rafraichir(JSON.parse(JSON.stringify(c)));
    expect(joueurActif(relu)).toBe(1);
    expect(vueCommune(relu, 1)).toBeDefined();
  });

  it('l’Aube reste secrète : seule la recrue voit son anneau, sa renommée dans l’Akatsuki, sa couverture', () => {
    const c = campagneDe(5);
    c.akatsuki.recrues.push(0);
    fait(c, { id: 'recrue_akatsuki', texte: 'Tu portes en secret l’anneau de l’Akatsuki.', connus: [0, 'akatsuki'], preuves: 1 });
    const p1 = projeter(c, 1);
    expect(projeter(c, 0).monde.akatsuki.moi).toBe('recrue');
    expect(p1.monde.akatsuki.moi).toBeUndefined();
    expect('akatsuki' in p1.monde.renommee).toBe(false);
    expect(JSON.stringify(p1)).not.toContain('anneau de l’Akatsuki');
    c.akatsuki.infiltre = 1;
    c.akatsuki.couverture = 40;
    expect(projeter(c, 1).monde.akatsuki.couverture).toBe(40);
    expect(projeter(c, 0).monde.akatsuki.couverture).toBeUndefined();
  });
});
