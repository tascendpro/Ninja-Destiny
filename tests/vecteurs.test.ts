import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { R } from '../src/engine/registre';
import { nouvellePartie, rejouer } from '../src/engine/moteur';
import { empreinte } from '../src/engine/sauvegarde';
import { parametresLien, rejouerCampagne } from '../src/engine/campagne/moteur';
import type { ActionCampagne, Campagne } from '../src/engine/campagne/types';
import type { Action, Creation } from '../src/engine/types';
import { creation, combinaisons, poursuivre } from './aide';
import { campagneDe, jouer } from './aideCampagne';

/**
 * Les vecteurs dorés : une graine, des actions, et l'empreinte de l'état qu'elles produisent.
 * Ils figent les règles : un portage du moteur (Luau pour Roblox) devra rejouer chacun et retrouver la même empreinte.
 * Ils dépendent du contenu : à chaque nouvelle version du contenu, on les régénère (VECTEURS=ecrire npx vitest run tests/vecteurs.test.ts).
 */
const DOSSIER = 'tests/vecteurs';
const FICHIER = `${DOSSIER}/vecteurs.json`;

interface Vecteurs {
  contenuVersion: string;
  solo: { creation: Creation; graine: number; actions: Action[]; empreinte: string }[];
  campagne: { index: number; actions: ActionCampagne[]; empreinte: string }[];
}

/** L'empreinte d'une campagne : celle des deux vies, et celle du lien (hachage FNV de sa forme JSON). */
function empreinteCampagne(c: Campagne): string {
  let h = 2166136261;
  for (const ch of JSON.stringify(c.lien) + JSON.stringify(c.faits) + c.vues.join(',')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `${empreinte(c.joueurs[0])}:${empreinte(c.joueurs[1])}:${(h >>> 0).toString(16)}`;
}

function generer(): Vecteurs {
  const combos = combinaisons();
  const solo = Array.from({ length: 150 }, (_, i) => {
    const cr = creation(combos[i % combos.length]);
    const r = poursuivre(nouvellePartie(cr, 5000 + i), 5000 + i, 60 + (i % 5) * 30);
    return { creation: r.etat.creation, graine: r.etat.seed, actions: r.etat.actions, empreinte: empreinte(r.etat) };
  });
  const campagne = Array.from({ length: 150 }, (_, i) => {
    const c = jouer(campagneDe(i), 9000 + i, () => false, 40 + (i % 6) * 25, i % 3 === 0 ? ['traitre', 'loyal'] : ['hasard', 'hasard']);
    return { index: i, actions: c.actions.map(({ seq: _s, vis: _v, jour: _j, ...a }) => a as ActionCampagne), empreinte: empreinteCampagne(c) };
  });
  return { contenuVersion: R.contenu.version, solo, campagne };
}

describe('Les vecteurs dorés', () => {
  if (process.env.VECTEURS === 'ecrire' || !existsSync(FICHIER)) {
    it('génère les vecteurs', () => {
      mkdirSync(DOSSIER, { recursive: true });
      writeFileSync(FICHIER, JSON.stringify(generer()));
      expect(existsSync(FICHIER)).toBe(true);
    }, 600000);
    return;
  }
  const v = JSON.parse(readFileSync(FICHIER, 'utf-8')) as Vecteurs;
  it.runIf(v.contenuVersion === R.contenu.version)('chaque partie solo se rejoue jusqu’à la même empreinte', () => {
    for (const x of v.solo) expect(empreinte(rejouer(x.creation, x.graine, x.actions))).toBe(x.empreinte);
  }, 600000);
  it.runIf(v.contenuVersion === R.contenu.version)('chaque campagne à deux se rejoue jusqu’à la même empreinte', () => {
    for (const x of v.campagne) {
      const base = campagneDe(x.index);
      expect(empreinteCampagne(rejouerCampagne(base.creations[0], base.creations[1], parametresLien(base), base.graine, x.actions)), `campagne ${x.index}`).toBe(x.empreinte);
    }
  }, 600000);
  it('les vecteurs correspondent à la version du contenu (sinon, les régénérer)', () => {
    expect(v.contenuVersion, 'VECTEURS=ecrire npx vitest run tests/vecteurs.test.ts').toBe(R.contenu.version);
  });
});
