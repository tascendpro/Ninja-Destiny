import { describe, expect, it } from 'vitest';
import { choisir, continuer, nouvellePartie } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { adversaireDef, nomAdversaire, techniquesAdversaire } from '../src/engine/combat/adversaire';
import { evenementDisponible } from '../src/engine/selection';
import { vueBingo } from '../src/engine/bingo';
import { R } from '../src/engine/registre';
import { creation, jouerCombat } from './aide';

const chasseur = (graine = 5) => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), graine);
  s.jour = s.naissance + 24 * 360;
  s.rang = 'jonin';
  s.chapitre = 3;
  s.drapeaux['akatsuki_connue'] = true;
  return s;
};

describe('La chasse à l’Akatsuki', () => {
  it('chaque membre a sa fiche, ses techniques signatures, et une rencontre où on peut l’affronter', () => {
    for (const [ev, ch] of [['akc_paille', 'itachi'], ['akc_paille', 'kisame'], ['akc_desert', 'sasori'], ['akc_desert', 'deidara'], ['akc_bureau', 'hidan'], ['akc_bureau', 'kakuzu'], ['akc_pluie', 'konan']]) {
      const s = chasseur();
      expect(evenementDisponible(s, R.evenements[ev]), ev).toBe(true);
      s.scene = { type: 'evenement', id: ev };
      const t = choisir(s, ch);
      expect(t.scene.type, ch).toBe('affrontement');
      if (t.scene.type !== 'affrontement') continue;
      const d = adversaireDef(t.scene.adversaireId);
      expect(techniquesAdversaire(t, d).every((x) => x.signature)).toBe(true);
      expect(d.majeure).toBeDefined();
      expect(vueAffrontement(t)!.adversaire.nom).toBe(d.nom);
    }
  });

  it('les techniques signatures ne tombent jamais aux mains d’un ninja ordinaire', () => {
    const s = chasseur();
    const ordinaire = adversaireDef('gen:mc_frontiere_embuscade/front');
    expect(techniquesAdversaire(s, ordinaire).some((x) => x.signature)).toBe(false);
  });

  it('abattre un membre paie une part de sa prime, et le Bingo Book s’en souvient', () => {
    let vu = false;
    for (let g = 1; g < 120 && !vu; g++) {
      const s = chasseur(g);
      for (const a of ['force', 'agilite', 'perception', 'controleChakra'] as const) s.attributs[a] = 100;
      s.jauges.chakraMax = 400;
      s.jauges.chakra = 400;
      s.maitrises['taijutsu'].tier = 5;
      s.scene = { type: 'evenement', id: 'akc_desert' };
      const ryo = s.jauges.ryo;
      const apres = jouerCombat(choisir(s, 'deidara'));
      if (apres.drapeaux['akatsuki_a_terre'] !== 'deidara') continue;
      vu = true;
      // La victoire le laisse à terre : c'est la scène suivante qui décide.
      expect(apres.scene.type === 'resultat' && apres.scene.suite).toBe('akc_verdict');
      expect(apres.jauges.ryo).toBe(ryo);
      const verdict = continuer(apres);
      expect(verdict.scene.type === 'evenement' && verdict.scene.id).toBe('akc_verdict');
      const t = choisir(verdict, 'achever');
      expect(t.drapeaux['akatsuki_mort_deidara']).toBe(true);
      expect(t.jauges.ryo - ryo).toBe(2200);
      const fiche = vueBingo(t).recherches.find((f) => f.id === 'deidara');
      expect(fiche?.notes.join(' ')).toMatch(/Abattu par toi/);
      expect(evenementDisponible(t, R.evenements['akc_desert'])).toBe(true);
      t.scene = { type: 'evenement', id: 'akc_desert' };
    }
    expect(vu).toBe(true);
  });
});

describe('À ta merci : achever, capturer, ou laisser partir', () => {
  const aTerre = (id: string, graine: number, statut: 'actif' | 'errant' = 'actif') => {
    const s = chasseur(graine);
    s.statut = statut;
    s.drapeaux['akatsuki_a_terre'] = id;
    s.scene = { type: 'evenement', id: 'akc_verdict' };
    return s;
  };

  it('Itachi ne se laisse presque jamais prendre : les corbeaux, et il reste en vie', () => {
    let pris = 0;
    for (let g = 1; g <= 200; g++) {
      const t = choisir(aTerre('itachi', g), 'capturer');
      if (t.drapeaux['akatsuki_capture_itachi']) pris++;
      else {
        expect(t.drapeaux['akatsuki_itachi_echappe']).toBe(true);
        expect(t.drapeaux['akatsuki_mort_itachi']).toBeUndefined();
        expect(t.scene.type === 'resultat' && t.scene.texte).toMatch(/corbeaux/);
      }
    }
    expect(pris).toBeGreaterThan(0);
    expect(pris).toBeLessThan(30);
  });

  it('Kisame se donne à ses requins plutôt qu’à tes chaînes, à chaque fois', () => {
    for (let g = 1; g <= 20; g++) {
      const s = aTerre('kisame', g);
      const ryo = s.jauges.ryo;
      const t = choisir(s, 'capturer');
      expect(t.drapeaux['akatsuki_capture_kisame']).toBeUndefined();
      expect(t.drapeaux['akatsuki_mort_kisame']).toBe(true);
      expect(t.drapeaux['akatsuki_kisame_suicide']).toBe(true);
      expect(t.jauges.ryo - ryo).toBe(3200);
      expect(t.scene.type === 'resultat' && t.scene.texte).toMatch(/Je ne vais pas devenir celui qui parle/);
    }
  });

  it('un prisonnier vaut une fois et demie un corps, et ne se croise plus sur les routes', () => {
    const s = aTerre('kakuzu', 3, 'errant');
    const ryo = s.jauges.ryo;
    const t = choisir(s, 'capturer');
    expect(t.drapeaux['akatsuki_capture_kakuzu']).toBe(true);
    expect(t.jauges.ryo - ryo).toBe(10500);
    expect(t.scene.type === 'resultat' && t.scene.texte).toMatch(/bureau des primes/);
    const fiche = vueBingo(t).recherches.find((f) => f.id === 'kakuzu');
    expect(fiche?.notes.join(' ')).toMatch(/Livré vivant/);
    t.drapeaux['akatsuki_mort_hidan'] = true;
    expect(evenementDisponible(t, R.evenements['akc_bureau'])).toBe(false);
  });

  it('Deidara tente sa dernière œuvre : arrêté une fois sur deux, sinon il ne reste rien', () => {
    const issues = new Set<string>();
    for (let g = 1; g <= 40; g++) {
      const s = aTerre('deidara', g);
      const ryo = s.jauges.ryo;
      const t = choisir(s, 'capturer');
      if (t.drapeaux['akatsuki_deidara_explose']) {
        issues.add('explose');
        expect(t.jauges.ryo).toBe(ryo);
        expect(t.drapeaux['akatsuki_mort_deidara']).toBe(true);
      } else {
        issues.add('pris');
        expect(t.drapeaux['akatsuki_capture_deidara']).toBe(true);
      }
    }
    expect(issues.size).toBe(2);
  });

  it('chaque membre a ses mots, qu’on l’achève ou qu’on le livre', () => {
    for (const id of ['itachi', 'kisame', 'sasori', 'deidara', 'hidan', 'kakuzu', 'konan']) {
      const t = choisir(aTerre(id, 1), 'achever');
      expect(t.scene.type === 'resultat' && t.scene.texte.length, id).toBeGreaterThan(40);
      expect(t.drapeaux[`akatsuki_mort_${id}`], id).toBe(true);
      const e = choisir(aTerre(id, 1), 'epargner');
      expect(e.drapeaux[`akatsuki_epargne_${id}`], id).toBe(true);
    }
  });
});

describe('Des ennemis qui ont un nom, et qui le changent d’une partie à l’autre', () => {
  it('un ninja sans fiche porte un nom tiré de la graine : stable dans la vie, différent d’une vie à l’autre', () => {
    const d = adversaireDef('gen:mc_frontiere_embuscade/front');
    const noms = new Set([1, 2, 3, 4, 5, 6].map((g) => nomAdversaire(nouvellePartie(creation({ village: 'konoha' }), g), d)));
    expect(noms.size).toBeGreaterThan(3);
    const s = nouvellePartie(creation({ village: 'konoha' }), 7);
    expect(nomAdversaire(s, d)).toBe(nomAdversaire(s, d));
    expect(nomAdversaire(s, d)).toMatch(/^L’escouade (de |d’)/);
  });
});
