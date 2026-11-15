import { describe, expect, it } from 'vitest';
import { LIBELLES_LIEN, agir, nouvelleCampagne, passesDuLien } from '../src/engine/campagne/moteur';
import type { TypeLien } from '../src/engine/campagne/types';
import { activite } from '../src/engine/moteur';
import { genererActivites } from '../src/engine/tempsLibre';
import { cloner } from '../src/engine/etat';
import { contraintesDuLien } from '../src/ui/creationAides';
import { creation } from './aide';

describe('Le passé commun dépend du lien', () => {
  it('chaque lien a ses passés, avec ses mots ; deux frères ne se « rencontrent » pas', () => {
    for (const t of Object.keys(LIBELLES_LIEN) as TypeLien[]) expect(passesDuLien(t).length, t).toBeGreaterThan(0);
    const freres = passesDuLien('freres');
    expect(freres.find((p) => p.id === 'rencontre')?.nom).toBe('Depuis toujours');
    expect(freres.some((p) => /rencontrés/.test(p.texte))).toBe(false);
    expect(passesDuLien('inconnus').some((p) => p.id === 'secret')).toBe(false);
    // Le souvenir fondateur reprend les mots du lien.
    const c = nouvelleCampagne(creation({ prenom: 'A', clan: 'uchiha' }), creation({ prenom: 'B', clan: 'uchiha' }), { type: 'freres', passe: 'rencontre' }, 3);
    expect(c.lien.souvenirs.find((s) => s.id === 'passe_rencontre')?.texte).toMatch(/même chambre/);
  });
});

describe('Frères et sœurs sur deux téléphones', () => {
  it('l’invité ne choisit ni village ni clan : il attend ceux de l’hôte, puis les reçoit', () => {
    const attente = contraintesDuLien('freres', 1, undefined, 'Kaito');
    expect(attente).toMatchObject({ famille: true, attente: true });
    const recu = contraintesDuLien('freres', 1, { village: 'kumo', clan: 'raiko' }, 'Kaito');
    expect(recu).toMatchObject({ famille: true, village: 'kumo', clan: 'raiko' });
    expect(contraintesDuLien('freres', 0, undefined).famille).toBeUndefined();
    expect(contraintesDuLien('clans_differents', 1, { clan: 'hyuga' }).clansInterdits).toEqual(['hyuga']);
  });
});

describe('Le lien pèse sur la progression', () => {
  it('à l’anniversaire, la rivalité et la confiance rapportent des points, avec leur source', () => {
    const c = cloner(nouvelleCampagne(creation({ prenom: 'Kaito', clan: 'uchiha' }), creation({ prenom: 'Ren', clan: 'hyuga' }), { type: 'rivaux', passe: 'competition' }, 5));
    c.commune = undefined;
    c.resultat = undefined;
    c.barrieres = [];
    const s = c.joueurs[0];
    s.jour = s.naissance + 360 * 9 - 1;
    s.scene = { type: 'temps_libre' };
    c.joueurs[1].jour = s.jour;
    c.joueurs[1].scene = { type: 'temps_libre' };
    c.lien.axes[0] = { ...c.lien.axes[0], rivalite: 60, confiance: 50, loyaute: 50 };
    const id = genererActivites(s).find((a) => a.disponible && a.duree > 0)!.id;
    const apres = agir(c, 0, (x) => activite(x, id));
    const anniv = apres.joueurs[0].anniversaires.at(-1)!;
    const sources = anniv.gains.map((g) => g.source).join(' | ');
    expect(sources).toMatch(/Ren/);
    expect(sources).toMatch(/Dépasser Ren|Rester devant Ren/);
    expect(sources).toMatch(/Ce que Ren t’a appris/);
    const duLien = anniv.gains.filter((g) => g.source.includes('Ren')).reduce((t, g) => t + g.points, 0);
    expect(duLien).toBeGreaterThan(0);
    expect(duLien).toBeLessThanOrEqual(3);
  });
});
