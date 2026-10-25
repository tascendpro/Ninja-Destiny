import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { appliquerEffets } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { partirEnExil } from '../src/content/evenements/exil';
import { evenementDisponible } from '../src/engine/selection';
import { genererActivites } from '../src/engine/tempsLibre';
import { R } from '../src/engine/registre';
import { creation, poursuivre } from './aide';

describe('L’exil n’est pas une fin', () => {
  it('aucune scène ne termine plus la partie sur un exil', () => {
    const fins = R.contenu.evenements.flatMap((e) => e.choix).map((c) => JSON.stringify(c));
    expect(fins.some((c) => c.includes('"fin":"exil"'))).toBe(false);
  });

  it('partir en exil ouvre la route, les chasseurs du village, puis l’attaque du village des années plus tard', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 4);
    s.jour = s.naissance + 19 * 360;
    s.chapitre = 3;
    s.rang = 'chunin';
    appliquerEffets(s, [{ statut: 'deserteur' }, ...partirEnExil('fuite après l’échec du coup d’État Uchiha')], nouveauCtx());
    expect(s.fin).toBeUndefined();
    expect(s.statut).toBe('deserteur');
    expect(s.planifies.some((p) => p.evenementId === 'ex_chasseurs_village')).toBe(true);
    expect(evenementDisponible(s, R.evenements['ex_chasseurs_village'])).toBe(true);
    expect(evenementDisponible(s, R.evenements['ex_village_attaque'])).toBe(true);
    s.scene = { type: 'temps_libre' };
    expect(genererActivites(s).some((a) => a.disponible)).toBe(true);
  });

  it('un exilé vit encore des années après', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), 6);
    s.jour = s.naissance + 20 * 360;
    s.chapitre = 3;
    s.rang = 'chunin';
    s.statut = 'exile';
    s.drapeaux['exil_cause'] = 'conseil';
    s.scene = { type: 'temps_libre' };
    const r = poursuivre(s, 77, 400);
    expect(r.erreurs).toEqual([]);
    // La vie continue sur la route : soit elle n'est pas finie, soit c'est une fin de chapitre qui ouvre le suivant.
    expect(!r.fin || !!R.fins[r.fin]?.suite).toBe(true);
    expect(r.etat.jour).toBeGreaterThan(s.jour);
  });
});
