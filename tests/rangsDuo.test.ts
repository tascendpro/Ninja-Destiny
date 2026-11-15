import { describe, expect, it } from 'vitest';
import { choisirCommune, lireResultat, nouvelleCampagne, rafraichir } from '../src/engine/campagne/moteur';
import type { Campagne, IdJoueur, TypeLien } from '../src/engine/campagne/types';
import { cloner } from '../src/engine/etat';
import { creation } from './aide';

function duo(type: TypeLien, age: number): Campagne {
  const clan = type === 'freres' || type === 'clan' ? 'uchiha' : 'sans_clan';
  const c = cloner(nouvelleCampagne(creation({ prenom: 'Kaito', village: 'konoha', clan }), creation({ prenom: 'Ren', village: type === 'villages_differents' ? 'kumo' : 'konoha', clan }), { type, passe: 'rencontre' }, 5));
  const base = Math.max(...c.joueurs.map((s) => s.naissance));
  for (const s of c.joueurs) {
    s.jour = base + age * 360 + 10;
    s.scene = { type: 'temps_libre' };
  }
  c.barrieres = [];
  c.commune = undefined;
  c.resultat = undefined;
  return c;
}
const lire = (c: Campagne) => {
  for (const j of [0, 1] as IdJoueur[]) if (c.resultat && !c.resultat.lu[j]) c = lireResultat(c, j);
  return c;
};

describe('Les rangs, vécus à deux', () => {
  it('la même classe existe pour les rivaux comme pour les frères', () => {
    const c = nouvelleCampagne(creation({ prenom: 'A', village: 'konoha' }), creation({ prenom: 'B', village: 'konoha' }), { type: 'rivaux', passe: 'competition' }, 9);
    expect(c.barrieres.some((b) => b.id === 'mc_rg_classe')).toBe(true);
  });

  it('genin tous les deux : la répartition s’ouvre ; demander la même équipe y mène, puis à la mission d’équipe', () => {
    let c = duo('freres', 12);
    for (const s of c.joueurs) s.rang = 'genin';
    c = rafraichir(c);
    expect(c.commune?.id).toBe('mc_rg_equipes');
    c = lire(choisirCommune(choisirCommune(c, 0, 'ensemble'), 1, 'ensemble'));
    expect(c.memeEquipe).toBe(true);
    c = rafraichir(c);
    expect(c.commune?.id ?? c.barrieres[0]?.id).toBe('mc_rg_mission_equipe');
  });

  it('l’un chūnin, l’autre pas : la scène du gilet s’ouvre, avec des choix propres à chacun', () => {
    let c = duo('rivaux', 15);
    c.memeEquipe = false;
    c.vues.push('mc_rg_equipes_rivales');
    c.joueurs[0].rang = 'chunin';
    c.joueurs[1].rang = 'genin';
    c = rafraichir(c);
    expect(c.commune?.id).toBe('mc_rg_gilet');
    c = lire(choisirCommune(choisirCommune(c, 0, 'offrir'), 1, 'jurer'));
    expect(c.vues).toContain('mc_rg_gilet');
  });

  it('une scène commune a des suites : la dette du pupitre revient deux ans plus tard, et chaque vie s’en souvient', () => {
    let c = duo('amis', 8);
    c.commune = { id: 'mc_rg_classe', choix: [undefined, undefined] };
    c = choisirCommune(choisirCommune(c, 0, 'souffler'), 1, 'premier');
    // « souffler+premier » existe : on vérifie plutôt « souffler » contre « travailler ».
    c = duo('amis', 8);
    c.commune = { id: 'mc_rg_classe', choix: [undefined, undefined] };
    c = lire(choisirCommune(choisirCommune(c, 0, 'souffler'), 1, 'travailler'));
    const b = c.barrieres.find((x) => x.id === 'mc_suite_pupitre');
    expect(b).toBeDefined();
    expect(c.suites?.['mc_suite_pupitre']).toBe(0);
    for (const s of c.joueurs) expect(s.drapeaux['duo:mc_rg_classe']).toBe('souffler+*');
  });

  it('deux villages différents : pas de classe commune, pas d’équipe commune', () => {
    const c = duo('villages_differents', 12);
    for (const s of c.joueurs) s.rang = 'genin';
    expect(rafraichir(c).commune?.id).not.toBe('mc_rg_equipes');
  });
});
