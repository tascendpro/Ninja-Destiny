import { describe, expect, it } from 'vitest';
import { engager, exporter, importer, joueurDuJeton, ouvrirSalon, recevoir, rejoindreSalon, verifierRevelation, vuePour } from '../src/engine/campagne/session';
import { projeter } from '../src/engine/campagne/projection';
import { joueurActif, rafraichir, vueCommune } from '../src/engine/campagne/moteur';
import { fait } from '../src/engine/campagne/outils';
import { creation } from './aide';
import { campagneDe, jouer } from './aideCampagne';

const J1 = 'jeton-du-premier-joueur-0001';
const J2 = 'jeton-du-second-joueur-00002';

function partie() {
  const salon = ouvrirSalon('ABCD23', creation({ prenom: 'Aya', village: 'konoha', clan: 'uchiha' }), { type: 'amis', passe: 'promesse' }, J1);
  return rejoindreSalon(salon, creation({ prenom: 'Ren', presentation: 'masculin', village: 'konoha', clan: 'uchiha' }), J2, 77);
}

describe('La partie en ligne', () => {
  it('un salon se rejoint ; chaque jeton désigne son joueur, et un jeton inconnu personne', () => {
    const s = partie();
    expect(joueurDuJeton(s, J1)).toBe(0);
    expect(joueurDuJeton(s, J2)).toBe(1);
    expect(() => joueurDuJeton(s, 'un-jeton-que-personne-n-a')).toThrow();
    // Le jeton n'est jamais stocké en clair.
    expect(JSON.stringify(s.jetons)).not.toContain(J1);
  });

  it('un lien impossible entre les deux fiches refuse la partie', () => {
    const salon = ouvrirSalon('WXYZ99', creation({ village: 'konoha', clan: 'uchiha' }), { type: 'clan', passe: 'rencontre' }, J1);
    expect(() => rejoindreSalon(salon, creation({ village: 'konoha', clan: 'hyuga' }), J2, 1)).toThrow();
  });

  it('l’appareil ne choisit pas qui il est : le jeton décide, et le tour est vérifié', () => {
    let s = partie();
    const choix = vueCommune(s.campagne, 0)!.choix[0].id;
    // J2 se déclare joueur 0 : c'est le jeton qui compte, le choix est enregistré pour J2, pas pour J1.
    s = recevoir(s, J2, { commune: choix, j: 0 } as never).session;
    expect(s.campagne.commune?.choix[1]).toBe(choix);
    expect(s.campagne.commune?.choix[0]).toBeUndefined();
    // Une action hors de propos (lire un résultat qui n'existe pas) est refusée, sans rien changer.
    expect(() => recevoir(s, J1, { lu: true })).toThrow();
    const r = recevoir(s, J1, { commune: choix, id: 'c1' });
    s = r.session;
    expect(s.version).toBe(2);
    // La même action renvoyée (réseau capricieux) ne compte qu'une fois.
    const bis = recevoir(s, J1, { commune: choix, id: 'c1' });
    expect(bis.session.version).toBe(2);
    expect(bis.session.campagne.actions.length).toBe(s.campagne.actions.length);
  });

  it('une sauvegarde exportée se rejoue à l’identique ; retouchée, elle échoue', () => {
    const c = jouer(campagneDe(3), 9, () => false, 400);
    const e = JSON.parse(JSON.stringify(exporter(c)));
    expect(JSON.stringify(importer(e).joueurs)).toBe(JSON.stringify(c.joueurs));
    // On fait jouer à J2 une action de J1 au milieu du journal.
    const i = e.actions.findIndex((x: { j: number; commune?: string }) => x.commune !== undefined);
    const triche = { ...e, actions: [...e.actions.slice(0, i), { ...e.actions[i], j: 1 - e.actions[i].j, commune: 'inexistant' }, ...e.actions.slice(i + 1)] };
    expect(() => importer(triche)).toThrow();
  });

  it('sans serveur, un choix scellé ne se révèle que tel qu’il a été engagé', () => {
    const e = engager('proteger', 'sel-9f2a');
    expect(verifierRevelation(e, 'proteger', 'sel-9f2a')).toBe(true);
    expect(verifierRevelation(e, 'agir', 'sel-9f2a')).toBe(false);
    expect(verifierRevelation(e, 'proteger', 'autre-sel')).toBe(false);
  });

  it('l’Aube reste secrète : seule la recrue voit son anneau, sa renommée dans l’Akatsuki, sa couverture', () => {
    const c = campagneDe(5);
    c.akatsuki.recrues.push(0);
    fait(c, { id: 'recrue_akatsuki', texte: 'Tu portes en secret l’anneau de l’Akatsuki.', connus: [0, 'akatsuki'], preuves: 1 });
    const p0 = projeter(c, 0);
    const p1 = projeter(c, 1);
    expect(p0.monde.akatsuki.moi).toBe('recrue');
    expect(p1.monde.akatsuki.moi).toBeUndefined();
    expect('akatsuki' in p1.monde.renommee).toBe(false);
    expect(JSON.stringify(p1)).not.toContain('anneau de l’Akatsuki');
    c.akatsuki.infiltre = 1;
    c.akatsuki.couverture = 40;
    expect(projeter(c, 1).monde.akatsuki.couverture).toBe(40);
    expect(projeter(c, 0).monde.akatsuki.couverture).toBeUndefined();
  });

  it('une sauvegarde prise au milieu d’une scène commune se recharge, et la partie continue', () => {
    let s = partie();
    const choix = vueCommune(s.campagne, 0)!.choix[0].id;
    s = recevoir(s, J1, { commune: choix }).session;
    expect(joueurActif(s.campagne)).toBe(1);
    // localStorage : JSON, où les « pas encore choisi » deviennent null.
    const relu = rafraichir(JSON.parse(JSON.stringify(s.campagne)));
    expect(joueurActif(relu)).toBe(1);
    expect(vueCommune(relu, 1)).toBeDefined();
  });
});
