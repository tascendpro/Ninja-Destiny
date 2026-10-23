import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { evenementDisponible } from '../src/engine/selection';
import { appliquerEffet } from '../src/engine/effets';
import { attaqueDisponible } from '../src/engine/epreuves';
import { duoPossible, duoUtilisable, partenaireDuo } from '../src/engine/duo';
import { nouveauCtx, resoudrePnj } from '../src/engine/etat';
import { R } from '../src/engine/registre';
import type { VillageId } from '../src/engine/types';
import { creation } from './aide';

function genin(village: VillageId = 'konoha') {
  const s = nouvellePartie(creation({ village, clan: 'sans_clan' }), 9);
  s.jour = s.naissance + 17 * 360;
  s.rang = 'genin';
  s.chapitre = 2;
  const nat = Object.keys(s.maitrises).find((k) => k.startsWith('nature_'))!;
  s.maitrises[nat].tier = 2;
  return s;
}

describe('Techniques à deux', () => {
  it('il faut assez d’amitié et de confiance ; la technique ne se lance qu’avec l’équipier présent', () => {
    const s = genin();
    const id = resoudrePnj(s, '@coequipierA')!;
    s.relations[id].amitie = 30;
    expect(duoPossible(s, '@coequipierA')).toBeUndefined();
    expect(evenementDisponible(s, R.evenements['eq_duo_a'])).toBe(false);
    s.relations[id].amitie = 70;
    s.relations[id].confiance = 60;
    const d = duoPossible(s, '@coequipierA');
    expect(d).toBeDefined();
    expect(evenementDisponible(s, R.evenements['eq_duo_a'])).toBe(true);
    appliquerEffet(s, { duo: '@coequipierA' }, nouveauCtx());
    expect(s.maitrises[d!.tech].tier).toBe(1);
    expect(partenaireDuo(s, d!.tech)).toBe(id);
    expect(evenementDisponible(s, R.evenements['eq_duo_a'])).toBe(false);
    // Hors d'une scène où l'équipier est présent, la technique ne se lance pas.
    s.scene = { type: 'evenement', id: 'kv_deserteurs' };
    expect(duoUtilisable(s, d!.tech)).toBe(false);
    expect(attaqueDisponible(s, d!.tech)).toBe(false);
    s.scene = { type: 'evenement', id: 'eq_duo_a' };
    expect(duoUtilisable(s, d!.tech)).toBe(true);
  });
});

describe('Jinchūriki ennemis et alliés', () => {
  it('chaque grand village peut croiser un hôte ennemi et partir en mission avec un hôte allié', () => {
    for (const v of ['konoha', 'suna', 'kiri', 'kumo', 'iwa'] as VillageId[]) {
      const s = genin(v);
      expect(evenementDisponible(s, R.evenements['jk_ennemi']), v).toBe(true);
      expect(evenementDisponible(s, R.evenements['jk_allie']), v).toBe(true);
    }
  });

  it('on ne croise pas en allié la bête qu’on porte soi-même', () => {
    const s = genin('konoha');
    s.drapeaux['jinchuriki'] = 'kyubi';
    expect(evenementDisponible(s, R.evenements['jk_allie'])).toBe(false);
  });
});
