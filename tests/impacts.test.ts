import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { terrainCourant, texteImpact, texteImpactJoueur, texteSombre, texteTechniqueTouche, tirageTexte } from '../src/engine/combat/impacts';
import { styleNatures } from '../src/ui/natures';
import { IMPACTS, CHUTES, TEXTES_GROUPE, TEXTES_TECHNIQUES } from '../src/content/combat/impacts';
import { R } from '../src/engine/registre';
import { creation } from './aide';

const partie = () => nouvellePartie(creation({ village: 'konoha' }), 3);

describe('Les coups se racontent selon le lieu et la distance', () => {
  it('le lieu donne le décor : forêt, rue, désert', () => {
    const s = partie();
    s.drapeaux['lieu_scene'] = 'foret_feu';
    expect(terrainCourant(s)).toBe('foret');
    s.drapeaux['lieu_scene'] = 'konoha';
    expect(terrainCourant(s)).toBe('rue');
    s.drapeaux['lieu_scene'] = 'konoha_terrain';
    expect(terrainCourant(s)).toBe('terrain');
    s.drapeaux['lieu_scene'] = 'desert_vent';
    expect(terrainCourant(s)).toBe('desert');
    const vus = new Set<string>();
    for (let i = 0; i < 40; i++) vus.add(texteImpact(s, 'lourd', `${i}`));
    expect([...vus].some((t) => IMPACTS.desert.lourd.includes(t))).toBe(true);
    expect([...vus].every((t) => IMPACTS.desert.lourd.includes(t) || CHUTES.lourd.includes(t))).toBe(true);
  });

  it('chaque lieu des données a son terrain, et chaque terrain assez de lignes', () => {
    const s = partie();
    for (const id of Object.keys(R.lieux)) {
      s.drapeaux['lieu_scene'] = id;
      expect(IMPACTS[terrainCourant(s)], id).toBeDefined();
    }
    for (const [t, i] of Object.entries(IMPACTS)) {
      expect(i.leger.length + CHUTES.leger.length, t).toBeGreaterThanOrEqual(8);
      expect(i.lourd.length, t).toBeGreaterThanOrEqual(3);
    }
  });

  it('la décharge raiton se lance par le sol de loin, et se vide dans le corps au contact', () => {
    const s = partie();
    const loin = texteTechniqueTouche(s, 'raiton_decharge', 'loin', '1');
    const proche = texteTechniqueTouche(s, 'raiton_decharge', 'proche', '1');
    expect(TEXTES_TECHNIQUES.raiton_decharge.loin).toContain(loin);
    expect(TEXTES_TECHNIQUES.raiton_decharge.proche).toContain(proche);
    expect(loin).toMatch(/sol/);
    expect(texteSombre(s, 'raiton_decharge', '1')).toMatch(/grillé|légume/);
  });

  it('toute technique offensive a un texte de loin ou au contact, et un texte sombre', () => {
    const s = partie();
    for (const m of R.contenu.maitrises.filter((x) => x.technique?.offensive)) {
      expect(texteTechniqueTouche(s, m.id, 'loin', 'x') || texteTechniqueTouche(s, m.id, 'proche', 'x'), m.id).not.toBe('');
      expect(texteSombre(s, m.id, 'x'), m.id).not.toBe('');
    }
    expect(Object.keys(TEXTES_GROUPE)).toContain('ninjutsu');
  });

  it('le texte choisi ne consomme pas le hasard du jeu et se rejoue à l’identique', () => {
    const s = partie();
    const avant = JSON.stringify(s.rngState);
    const a = texteImpact(s, 'leger', 'k');
    expect(texteImpact(s, 'leger', 'k')).toBe(a);
    expect(JSON.stringify(s.rngState)).toBe(avant);
    expect(tirageTexte(s, 'k')).toBeGreaterThanOrEqual(0);
    expect(tirageTexte(s, 'k')).toBeLessThan(1);
  });

  it('quand c’est toi qui encaisses, le lieu compte aussi', () => {
    const s = partie();
    for (const id of Object.keys(R.lieux)) {
      s.drapeaux['lieu_scene'] = id;
      expect(texteImpactJoueur(s, 'lourd', id), id).not.toBe('');
      expect(texteImpactJoueur(s, 'leger', id), id).not.toBe('');
    }
  });

  it('une technique à deux natures se colore moitié-moitié, à trois en tiers', () => {
    const deux = styleNatures(['raiton', 'suiton']) as Record<string, string>;
    expect(deux['--nat']).toContain('raiton');
    expect(deux['--nat-bande']).toMatch(/raiton.*0\.0% 50\.0%.*suiton.*50\.0% 100\.0%/);
    const trois = styleNatures(['katon', 'fuuton', 'raiton']) as Record<string, string>;
    expect(trois['--nat-bande']).toMatch(/33\.3%.*66\.7%/);
    expect((styleNatures(['katon']) as Record<string, string>)['--nat-bande']).toBeUndefined();
  });
});
