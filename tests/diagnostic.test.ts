import { describe, expect, it } from 'vitest';
import { diagnostiquer } from '../src/engine/diagnostic';
import { R } from '../src/engine/registre';

describe('Diagnostic du contenu', () => {
  const problemes = diagnostiquer();
  const erreurs = problemes.filter((p) => p.niveau === 'erreur');
  const avertissements = problemes.filter((p) => p.niveau === 'avertissement');

  it('ne détecte aucune erreur (suites, références, conditions, quêtes, registre)', () => {
    if (erreurs.length) console.log(erreurs.map((e) => `[${e.code}] ${e.message}`).join('\n'));
    expect(erreurs).toEqual([]);
  });

  it('liste les contenus prévus pour les chapitres suivants', () => {
    console.log(`Avertissements (${avertissements.length}) :\n` + avertissements.map((e) => `  [${e.code}] ${e.message}`).join('\n'));
    expect(avertissements.every((a) => a.niveau === 'avertissement')).toBe(true);
  });

  it('respecte les volumes minimaux du premier chapitre', () => {
    const c = R.contenu;
    console.log(
      `Volume : ${c.evenements.length} événements, ${c.clans.length} clans, ${c.villages.length} villages, ${c.pnj.length} PNJ, ` +
        `${c.missions.length} missions, ${c.armes.filter((a) => a.rarete === 'legendaire' || a.rarete === 'maudite').length} armes légendaires, ` +
        `${c.metiers.length} métiers, ${c.fins.length} fins, ${c.evenements.filter((e) => e.rare || e.secret).length} événements rares ou secrets.`,
    );
    expect(c.evenements.length).toBeGreaterThanOrEqual(100);
    expect(c.clans.length).toBeGreaterThanOrEqual(12);
    expect(c.villages.length).toBe(5);
    expect(c.pnj.length).toBeGreaterThanOrEqual(20);
    expect(c.metiers.length).toBeGreaterThanOrEqual(12);
    expect(c.armes.filter((a) => a.rarete === 'legendaire' || a.rarete === 'maudite').length).toBeGreaterThanOrEqual(12);
  });
});
