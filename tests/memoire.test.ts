// La mémoire des relations : des faits structurés (pas des phrases), qui changent ce que les personnages disent ensuite.
import { describe, expect, it } from 'vitest';
import type { GameState, Outcome, Texte } from '../src/engine/types';
import { choisir, combattre, nouvellePartie } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { resoudreTexte } from '../src/engine/texte';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { faits, noterFait, quand } from '../src/engine/memoire';
import { affrontementPour, vueAffrontement } from '../src/engine/combat/affrontement';
import { creation } from './aide';

const partie = (village: GameState['creation']['village'] = 'konoha', clan = 'uchiha') => nouvellePartie(creation({ village, clan }), 21);

describe('Les faits', () => {
  it('le premier de son type est marqué ; un même moment ne s’inscrit pas deux fois', () => {
    const s = partie();
    s.scene = { type: 'evenement', id: 'dg_rival_aveu' };
    noterFait(s, '@rival', 'dispute');
    noterFait(s, '@rival', 'dispute');
    expect(faits(s, '@rival', { type: 'dispute' })).toHaveLength(1);
    s.jour += 30;
    noterFait(s, '@rival', 'dispute');
    const d = faits(s, '@rival', { type: 'dispute' });
    expect(d).toHaveLength(2);
    expect(d.filter((f) => f.premier)).toHaveLength(1);
  });

  it('on ne retient pas tout : au-delà de quarante, le moins important s’efface, jamais un « premier »', () => {
    const s = partie();
    for (let i = 0; i < 60; i++) {
      s.jour += 1;
      noterFait(s, '@coequipierA', i === 0 ? 'sauvetage' : 'moment', { importance: i === 0 ? 3 : 1 });
    }
    const tous = faits(s, '@coequipierA');
    expect(tous.length).toBe(40);
    expect(tous.some((f) => f.type === 'sauvetage')).toBe(true);
  });

  it('dire quand : « l’an dernier », « il y a trois ans », « quand tu avais neuf ans »', () => {
    const s = partie();
    const f = { type: 'moment' as const, jour: s.jour, age: 9, importance: 2 as const };
    s.jour += 400;
    expect(quand(s, f)).toBe('l’an dernier');
    s.jour += 720;
    expect(quand(s, f)).toBe('il y a trois ans');
    s.jour += 360 * 3;
    expect(quand(s, f)).toBe('quand tu avais 9 ans');
  });
});

describe('Ce qui s’enregistre tout seul', () => {
  it('une première rencontre, une seule fois', () => {
    const s = partie();
    const id = s.roles['rival'];
    s.pnj[id].rencontre = false;
    s.scene = { type: 'evenement', id: 'a_rival_defi' };
    appliquerEffet(s, { relation: '@rival', delta: { rivalite: 2 } }, nouveauCtx());
    appliquerEffet(s, { relation: '@rival', delta: { rivalite: 2 } }, nouveauCtx());
    expect(faits(s, '@rival', { type: 'premiere_rencontre' })).toHaveLength(1);
  });

  it('les promesses faites, puis rompues', () => {
    const s = partie();
    appliquerEffet(s, { promesse: 'payer', pnj: '@coequipierA', texte: 'Payer la dette.' }, nouveauCtx());
    appliquerEffet(s, { promesseRompue: 'payer' }, nouveauCtx());
    expect(faits(s, '@coequipierA', { type: 'promesse' })).toHaveLength(1);
    expect(faits(s, '@coequipierA', { type: 'promesse_rompue' })[0].importance).toBe(3);
  });

  it('un duel contre le rival : victoire ou défaite, dans sa mémoire à lui', () => {
    const s0 = partie();
    s0.jour = s0.naissance + 360 * 10;
    s0.scene = { type: 'evenement', id: 'a_rival_defi' };
    let s = choisir(s0, 'accepter');
    for (let i = 0; i < 12 && s.scene.type === 'affrontement'; i++) {
      const a = vueAffrontement(s)!.familles.flatMap((f) => f.actions.filter((x) => x.disponible).map((x) => ({ famille: f.id, choix: x.id })))[0];
      s = combattre(s, a);
    }
    const duels = faits(s, '@rival', { type: ['victoire', 'defaite'] });
    expect(duels).toHaveLength(1);
    expect(duels[0].premier).toBe(true);
  });
});

describe('Ce que déclarent les scènes', () => {
  it('l’aveu à l’infirmerie : un secret échangé, que le rival n’oublie pas', () => {
    const s0 = partie();
    s0.scene = { type: 'evenement', id: 'dg_rival_aveu' };
    const s = choisir(s0, 'moi_aussi');
    const [f] = faits(s, '@rival', { type: 'secret' });
    expect(f.tags).toEqual(expect.arrayContaining(['lui', 'toi']));
    expect(f.importance).toBe(3);
  });

  it('l’ami·e qui t’a sauvé·e s’en souvient, et le dit à sa façon', () => {
    const s = partie();
    noterFait(s, '@coequipierA', 'sauvetage', { tags: ['lui'] });
    s.drapeaux['passage'] = 1;
    expect(resoudreTexte(R.evenements['pr_ami_souvenir'].texte, s)).toMatch(/Tu me dois toujours une vie/);
  });

  it('l’aîné·e se souvient des trois minutes, et de quand vous vous êtes entraîné·es', () => {
    const s = partie();
    noterFait(s, '@aine', 'entrainement', { tags: ['kawarimi', 'tenu'] });
    s.jour += 400;
    s.drapeaux['passage'] = 1;
    s.drapeaux['habitude:taijutsu'] = 3;
    expect(resoudreTexte(R.evenements['pr_aine_habitude'].texte, s)).toMatch(/Et ta permutation \? Montre\. .*c’était l’an dernier/);
  });
});

describe('Trois minutes face à l’aîné·e', () => {
  const conclusions = () => affrontementPour('ap_aine_deuxieme', 'tenir')!.conclusions!;
  const rendu = (t: Texte | undefined, s: GameState) => resoudreTexte(t, s);

  it('tenir jusqu’au bout est une réussite, même plus amoché·e : le kawarimi s’apprend', () => {
    for (const fin of ['departage_gagne', 'departage_nul', 'departage_perdu'] as const) {
      const c = conclusions()[fin]!;
      expect(c.issue).toBe('succes');
      expect(c.effets).toEqual(expect.arrayContaining([{ apprendre: 'kawarimi', source: 'mentor' }]));
    }
  });

  it('gagner n’est pas tenir : le texte n’est pas le même, la leçon non plus', () => {
    const s = partie();
    const tenu = rendu(conclusions().departage_perdu!.texte, s);
    const gagne = rendu(conclusions().victoire!.texte, s);
    expect(tenu).toMatch(/Tu ne l’as pas battue?\. Mais tu as tenu\./);
    expect(gagne).toMatch(/Tu ne devais que tenir/);
    expect(gagne).toMatch(/pour survivre\. Pas pour frimer/);
  });

  it('tomber avant la fin : pas de kawarimi, et l’aîné·e reste ce qu’{il} est', () => {
    const s = partie();
    const c = conclusions().defaite!;
    expect(JSON.stringify(c.effets)).not.toMatch(/kawarimi/);
    expect(rendu(c.texte, s)).toMatch(/Je t’avais dit de tenir, pas de frapper/);
  });

  it('plus de révélation plaquée, et l’aîné·e porte son vrai nom et son vrai genre', () => {
    const s = partie();
    s.pnjGeneres['famille_aine'].genre = 'f';
    const t = rendu(conclusions().departage_gagne!.texte, s);
    expect(t).not.toMatch(/Personne ne sait que je sais faire ça/);
    expect(t).toContain(s.pnjGeneres['famille_aine'].nom);
    expect(t).toMatch(/Tu ne l’as pas battue\./);
    const succes = (R.evenements['ap_aine_deuxieme'].choix[0].test!.succes as Outcome).texte;
    expect(JSON.stringify(succes)).not.toMatch(/Personne ne sait que je sais faire ça/);
  });

  it('la voix suit la posture : sévère, l’aîné·e rappelle que tenir n’est pas gagner', () => {
    const s = partie();
    const r = s.relations['famille_aine'];
    Object.assign(r, { amitie: 40, confiance: 30, attachement: 70, respect: 10, rivalite: 0 });
    expect(rendu(conclusions().departage_gagne!.texte, s)).toMatch(/Tenir, ce n’est pas gagner/);
  });
});
