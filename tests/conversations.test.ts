import { describe, expect, it } from 'vitest';
import { choisir, nouvellePartie, vueEvenement } from '../src/engine/moteur';
import { evenementDisponible, entrerEvenement } from '../src/engine/selection';
import { CONVERSATIONS } from '../src/content/evenements/conversations';
import { R } from '../src/engine/registre';
import type { GameState } from '../src/engine/types';
import { creation } from './aide';

const aAge = (s: GameState, age: number) => {
  s.jour = s.naissance + age * 360;
  return s;
};
/** Ouvre une scène comme le moteur le fait : elle compte comme vue. */
const ouvrir = (s: GameState, id: string) => {
  entrerEvenement(s, id);
  return s;
};
const texte = (s: GameState) => vueEvenement(s)!.texte;
const resultat = (s: GameState) => (s.scene.type === 'resultat' ? s.scene.texte : '');

describe('Des conversations qui se souviennent', () => {
  it('la pierre de l’enfance : vingt ans plus tard, l’ami·e se rappelle exactement ce que tu as dit', () => {
    for (const [reponse, attendu] of [
      ['moquer', /oublié les tiens/],
      ['conseiller', /Premier conseiller/],
      ['chance', /porterait chance/],
    ] as const) {
      const s = aAge(nouvellePartie(creation({ village: 'konoha' }), 4), 8);
      expect(evenementDisponible(s, R.evenements['dl_pierre'])).toBe(true);
      expect(texte(ouvrir(s, 'dl_pierre'))).toMatch(/monument des Hokage/);
      const apres = choisir(s, reponse);
      const r = Object.values(apres.relations).find((x) => x.souvenirs.some((sv) => /pierre/.test(sv)));
      expect(r, reponse).toBeDefined();
      aAge(apres, 22);
      expect(evenementDisponible(apres, R.evenements['dl_pierre_souvenir'])).toBe(true);
      expect(texte(ouvrir(apres, 'dl_pierre_souvenir'))).toMatch(attendu);
    }
  });

  it('les excuses, vingt ans trop tard, ne sont proposées qu’à qui s’est moqué', () => {
    const s = aAge(nouvellePartie(creation({ village: 'suna', clan: 'sans_clan' }), 6), 8);
    const moque = aAge(choisir(ouvrir(s, 'dl_pierre'), 'moquer'), 22);
    expect(vueEvenement(ouvrir(moque, 'dl_pierre_souvenir'))!.choix.find((c) => c.id === 'excuse')?.disponible).toBe(true);
    const gentil = aAge(choisir(ouvrir(aAge(nouvellePartie(creation({ village: 'suna', clan: 'sans_clan' }), 6), 8), 'dl_pierre'), 'chance'), 22);
    expect(vueEvenement(ouvrir(gentil, 'dl_pierre_souvenir'))!.choix.find((c) => c.id === 'excuse')?.disponible ?? false).toBe(false);
  });

  it('le ravin : l’ami·e sauvé·e et l’ami·e abandonné·e ne parlent pas de la même façon, des années après', () => {
    const genin = () => {
      const s = aAge(nouvellePartie(creation({ village: 'kumo', clan: 'sans_clan' }), 9), 13);
      s.rang = 'genin';
      return s;
    };
    const sauve = aAge(choisir(ouvrir(genin(), 'dl_ravin'), 'demi_tour'), 21);
    expect(texte(ouvrir(sauve, 'dl_ravin_souvenir'))).toMatch(/rester à tes côtés/);
    const laisse = aAge(choisir(ouvrir(genin(), 'dl_ravin'), 'continuer'), 21);
    expect(texte(ouvrir(laisse, 'dl_ravin_souvenir'))).toMatch(/je n’ai jamais oublié/);
    expect(vueEvenement(laisse)!.choix.find((c) => c.id === 'regret')?.disponible).toBe(true);
  });

  it('le rival jōnin propose un duel : le soir même, c’est un vrai combat contre lui', () => {
    const s = aAge(nouvellePartie(creation({ village: 'konoha' }), 11), 23);
    s.rang = 'jonin';
    expect(evenementDisponible(s, R.evenements['dl_rival_rapport'])).toBe(true);
    const t = choisir(ouvrir(s, 'dl_rival_rapport'), 'duel');
    expect(t.drapeaux['dl_rival']).toBe('duel');
    const duel = choisir(ouvrir(t, 'dl_rival_duel'), 'tout');
    expect(duel.scene.type).toBe('affrontement');
    if (duel.scene.type === 'affrontement') expect(duel.scene.adversaireId).toBe('rival_academie');
  });

  it('chaque village a sa voix, et seulement le sien', () => {
    for (const [id, village, age] of [['dl_kiri_jinpachi', 'kiri', 18], ['dl_suna_sahira', 'suna', 25], ['dl_kumo_daichi', 'kumo', 30], ['dl_iwa_ancien', 'iwa', 30], ['dl_konoha_monument', 'konoha', 18]] as const) {
      const ici = aAge(nouvellePartie(creation({ village, clan: 'sans_clan' }), 3), age);
      ici.chapitre = 3;
      expect(evenementDisponible(ici, R.evenements[id]), id).toBe(true);
      const ailleurs = aAge(nouvellePartie(creation({ village: village === 'konoha' ? 'suna' : 'konoha', clan: 'sans_clan' }), 3), age);
      ailleurs.chapitre = 3;
      expect(evenementDisponible(ailleurs, R.evenements[id]), id).toBe(false);
    }
  });

  it('aucune conversation ne laisse de jeton à l’écran, quel que soit le genre du joueur', () => {
    for (const presentation of ['masculin', 'feminin', 'neutre'] as const) {
      for (const ev of CONVERSATIONS) {
        const s = aAge(nouvellePartie(creation({ presentation, village: 'konoha', clan: 'uchiha' }), 2), 20);
        ouvrir(s, ev.id);
        expect(texte(s), ev.id).not.toMatch(/\{|\}|·/);
        for (const c of vueEvenement(s)!.choix) expect(c.texte, `${ev.id}/${c.id}`).not.toMatch(/\{|\}/);
      }
    }
  });
});
