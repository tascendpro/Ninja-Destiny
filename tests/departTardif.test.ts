import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { genererActivites, lienUtile } from '../src/engine/tempsLibre';
import { R } from '../src/engine/registre';
import { creation } from './aide';

describe('Commencer à 10 ans', () => {
  it('donne les points des années sautées, expliqués, et un entraînement qui varie d’un enfant à l’autre', () => {
    const jours = new Set<number>();
    for (const g of [1, 2, 3, 4, 5]) {
      const s = nouvellePartie(creation({ ageDepart: 10 }), g);
      expect(s.pointsStat).toBeGreaterThanOrEqual(14);
      expect(s.anniversaires.find((a) => a.age === 10)?.gains.reduce((t, x) => t + x.points, 0)).toBe(s.pointsStat);
      expect(s.maitrises['taijutsu'].trainingDays).toBeGreaterThan(0);
      jours.add(s.maitrises['ninjutsu'].trainingDays);
    }
    expect(jours.size).toBeGreaterThan(1);
    // À 6 ans, rien de tout ça : l'enfance se joue.
    expect(nouvellePartie(creation({ ageDepart: 6 }), 1).pointsStat).toBe(0);
  });
});

describe('Le temps libre', () => {
  it('ne propose de passer du temps qu’avec ceux qu’une scène peut faire revenir', () => {
    const s = nouvellePartie(creation(), 3);
    for (const id of Object.keys(s.pnj)) s.pnj[id].rencontre = true;
    const liens = genererActivites(s).filter((a) => a.id.startsWith('social:'));
    expect(liens.length).toBeGreaterThan(0);
    for (const a of liens) expect(lienUtile(s, a.id.slice('social:'.length)), a.id).toBe(true);
    const texte = JSON.stringify(R.contenu.evenements);
    for (const a of liens) {
      const id = a.id.slice('social:'.length);
      const role = Object.entries(s.roles).find(([, v]) => v === id)?.[0];
      expect(texte.includes(id) || (role !== undefined && texte.includes(`@${role}`)), id).toBe(true);
    }
  });
});
