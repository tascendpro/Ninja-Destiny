import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { creation } from './aide';

/** Un localStorage minimal, qui survit à un « rechargement » (réimport des modules). */
const disque = new Map<string, string>();
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => disque.get(k) ?? null,
    setItem: (k: string, v: string) => void disque.set(k, v),
    removeItem: (k: string) => void disque.delete(k),
  });
});

const charger = async () => {
  vi.resetModules();
  return import('../src/ui/preferencesPoints');
};

describe('Le brouillon de points', () => {
  const kaito = nouvellePartie(creation({ prenom: 'Kaito' }), 3);
  const ren = nouvellePartie(creation({ prenom: 'Ren' }), 4);

  it('un point placé survit à la fermeture de la modale et au rechargement de la page', async () => {
    const m = await charger();
    m.ecrirePreferences(m.clePerso(kaito), { brouillon: { agilite: 3 } });
    // Une autre vue (fiche, récit) lit le même brouillon.
    expect(m.lirePreferences(m.clePerso(kaito)).brouillon).toEqual({ agilite: 3 });
    // Rechargement : nouveau module, même disque.
    const apres = await charger();
    expect(apres.lirePreferences(apres.clePerso(kaito)).brouillon).toEqual({ agilite: 3 });
  });

  it('chaque personnage a son brouillon et son plan : celui de l’un n’apparaît jamais chez l’autre', async () => {
    const m = await charger();
    m.ecrirePreferences(m.clePerso(kaito), { brouillon: { force: 2 }, plan: { mode: 'priorites', ordre: ['force'] }, auto: true });
    m.ecrirePreferences(m.clePerso(ren), { brouillon: { intellect: 1 } });
    expect(m.clePerso(kaito)).not.toBe(m.clePerso(ren));
    expect(m.lirePreferences(m.clePerso(ren))).toEqual({ brouillon: { intellect: 1 }, auto: false });
  });

  it('« Annuler » vide le brouillon, et rien d’autre : le plan et l’option restent', async () => {
    const m = await charger();
    const k = m.clePerso(kaito);
    m.ecrirePreferences(k, { brouillon: { force: 2 }, plan: { mode: 'priorites', ordre: ['force'] }, auto: true });
    m.ecrirePreferences(k, { brouillon: {} });
    expect(m.lirePreferences(k)).toEqual({ brouillon: {}, plan: { mode: 'priorites', ordre: ['force'] }, auto: true });
  });

  it('un stockage illisible ne casse rien : le brouillon vit en mémoire', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqué');
      },
      setItem: () => {
        throw new Error('bloqué');
      },
    });
    const m = await charger();
    m.ecrirePreferences('x', { brouillon: { charisme: 1 } });
    expect(m.lirePreferences('x').brouillon).toEqual({ charisme: 1 });
  });
});
