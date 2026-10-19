import { describe, expect, it } from 'vitest';
import { combinaisons, creation, simuler } from './aide';
import { R } from '../src/engine/registre';

/** Prodige, jinchūriki et lignée de fusion du village, quand il en existe. */
function destinImpose(village: string) {
  const biju = R.contenu.bijus.find((b) => b.village === village)?.id;
  const lignees = R.contenu.maitrises.filter((m) => m.composantes && m.lignee?.[village as 'konoha']).map((m) => m.id).slice(0, 1);
  return { prodige: true, biju, lignees };
}

describe('Simulation de parcours complets', () => {
  const combos = combinaisons();
  const rapports = combos.flatMap((c, i) =>
    [6, 10].flatMap((ageDepart) =>
      [1, 2, 3].map((k) =>
        simuler(
          creation({
            village: c.village,
            clan: c.clan,
            element: c.element,
            ageDepart: ageDepart as 6 | 10,
            origine: c.clan === 'sans_clan' && k === 2 ? 'orphelin' : undefined,
            traits: k === 3 ? ['impulsif', 'loyal'] : k === 2 ? ['calme', 'compatissant'] : ['determine', 'curieux'],
            difficulte: k === 1 ? 'shinobi' : k === 2 ? 'recit' : 'legende',
          }),
          1000 + i * 37 + ageDepart * 101 + k * 7,
          1500,
          // Les dons tirés au hasard sont rares : on les impose ici pour que chaque combinaison les rencontre.
          k === 3 ? destinImpose(c.village) : undefined,
        ),
      ),
    ),
  );

  it('aucune partie ne viole les invariants ni ne lève d’exception', () => {
    const erreurs = rapports.flatMap((r) => r.erreurs.map((e) => `${r.etat.creation.clan}/${r.etat.creation.village} : ${e}`));
    if (erreurs.length) console.log(erreurs.slice(0, 30).join('\n'));
    expect(erreurs).toEqual([]);
  });

  it('chaque partie atteint une fin (aucun blocage)', () => {
    const bloquees = rapports.filter((r) => !r.fin);
    if (bloquees.length) {
      for (const b of bloquees.slice(0, 5)) {
        console.log(`Bloquée : ${b.etat.creation.clan}/${b.etat.creation.village}, ${b.pas} pas, âge ${Math.floor((b.etat.jour - b.etat.naissance) / 360)}, rang ${b.etat.rang}, scène ${JSON.stringify(b.etat.scene).slice(0, 120)}`);
      }
    }
    expect(bloquees.length).toBe(0);
  });

  it('aucun événement ne se retrouve sans choix disponible', () => {
    const passer = rapports.flatMap((r) => r.passerUtilise);
    if (passer.length) console.log('Sans choix :', Array.from(new Set(passer)).join(', '));
    expect(passer).toEqual([]);
  });

  it('la distribution des fins et la couverture du contenu sont plausibles', () => {
    const fins: Record<string, number> = {};
    for (const r of rapports) fins[r.fin ?? 'aucune'] = (fins[r.fin ?? 'aucune'] ?? 0) + 1;
    const vus = new Set(rapports.flatMap((r) => r.evenements));
    const jamais = R.contenu.evenements.filter((e) => !vus.has(e.id)).map((e) => e.id);
    const pas = rapports.map((r) => r.pas).sort((a, b) => a - b);
    console.log(`Parties : ${rapports.length}. Fins :`, fins);
    console.log(`Pas par partie : min ${pas[0]}, médiane ${pas[Math.floor(pas.length / 2)]}, max ${pas[pas.length - 1]}.`);
    console.log(`Événements jamais rencontrés (${jamais.length}) : ${jamais.join(', ')}`);
    expect(fins['chapitre_1'] ?? 0).toBeGreaterThan(rapports.length * 0.5);
  });
});
