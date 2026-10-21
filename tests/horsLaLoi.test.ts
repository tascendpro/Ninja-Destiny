import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/types';
import { activite, nouvellePartie } from '../src/engine/moteur';
import { genererActivites } from '../src/engine/tempsLibre';
import { ficheJoueur } from '../src/engine/bingo';
import { evenementDisponible } from '../src/engine/selection';
import { R } from '../src/engine/registre';
import { creation, poursuivre } from './aide';

/** Un·e hors-la-loi de dix-huit ans, en temps libre sur la route du col. */
function bandit(graine = 1): GameState {
  const s = nouvellePartie(creation(), graine);
  s.jour = s.naissance + 360 * 18;
  s.statut = 'deserteur';
  s.drapeaux['hors_la_loi'] = true;
  s.drapeaux['errance'] = true;
  s.drapeaux['errance_voie'] = 'bandit';
  s.scene = { type: 'temps_libre' };
  return s;
}

describe('La voie du crime', () => {
  it('la croisée des chemins propose une quatrième voie, qui mène à la bande de la Pie', () => {
    expect(R.evenements['e_route'].choix.some((c) => c.id === 'col')).toBe(true);
    const s = bandit();
    delete s.drapeaux['hors_la_loi'];
    expect(evenementDisponible(s, R.evenements['hl_col'])).toBe(true);
  });

  it('les crimes du temps libre ne s’offrent qu’aux hors-la-loi', () => {
    const s = bandit();
    const ids = genererActivites(s).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['route:convoi', 'route:racket', 'route:rancon']));
    const honnete = bandit();
    delete honnete.drapeaux['hors_la_loi'];
    expect(genererActivites(honnete).some((a) => a.id === 'route:convoi')).toBe(false);
  });

  it('un crime est rejoué à l’identique avec la même graine', () => {
    const a = activite(bandit(7), 'route:racket');
    const b = activite(bandit(7), 'route:racket');
    expect(a.drapeaux).toEqual(b.drapeaux);
    expect(a.jauges.ryo).toBe(b.jauges.ryo);
  });

  it('chaque crime réussi est compté, et la fiche du Bingo Book les énumère avec une prime qui monte', () => {
    const s = bandit();
    s.social.reputationOmbre = 30;
    const avant = ficheJoueur(s);
    s.drapeaux['crime_convois'] = 4;
    s.drapeaux['crime_meurtres'] = 2;
    const apres = ficheJoueur(s)!;
    expect(apres.liste).toBe('recherches');
    expect(apres.village).toContain('hors-la-loi');
    expect(apres.crimes).toEqual(expect.arrayContaining(['Convois pillés : 4', 'Meurtres : 2']));
    expect(apres.prime).toBeGreaterThan(avant?.prime ?? 0);
  });

  it('lever la main sur le Kage fait de toi un rang S', () => {
    const s = bandit();
    s.drapeaux['crime_raid'] = true;
    s.drapeaux['crime_kage'] = true;
    const f = ficheJoueur(s)!;
    expect(f.rang).toBe('S');
    expect(f.crimes).toContain('A levé la main sur le Kage');
  });

  it('la trame mène du chef de bande au raid, et le raid peut finir sur la mort du Kage', () => {
    const refuse = R.evenements['hl_seigneur'].choix.find((c) => c.id === 'refuser')!;
    expect(JSON.stringify(refuse.effets)).toContain('hl_raid_veille');
    for (const c of R.evenements['hl_raid_veille'].choix.filter((x) => x.id !== 'renoncer')) expect(c.suite).toBe('hl_raid_porte');
    const kage = R.evenements['hl_raid'].choix.find((c) => c.id === 'kage')!;
    expect(JSON.stringify(kage.test?.succes.effets)).toContain('regicide');
    expect(R.fins['regicide']?.type).toBe('desertion');
  });

  it('des vies entières de hors-la-loi se jouent sans casser une règle du jeu', () => {
    let crimes = 0;
    for (let g = 1; g <= 12; g++) {
      const r = poursuivre(bandit(g), g, 800);
      expect(r.erreurs, `graine ${g}`).toEqual([]);
      crimes += ['crime_convois', 'crime_rackets', 'crime_rancons'].reduce((n, d) => n + (Number(r.etat.drapeaux[d]) || 0), 0);
    }
    expect(crimes).toBeGreaterThan(0);
  });
});
