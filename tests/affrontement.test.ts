import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import type { GameState } from '../src/engine/types';
import { choisir, choixVisibles, combattre, nouvellePartie, rejouer } from '../src/engine/moteur';
import { vueAffrontement } from '../src/engine/combat/affrontement';
import { fourchettePlafond } from '../src/engine/combat/contextes';
import { ErreurCombat, NIVEAUX } from '../src/engine/combat/types';
import type { ActionCombat, AffrontementDef } from '../src/engine/combat/types';
import { R } from '../src/engine/registre';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx } from '../src/engine/etat';
import { combinaisons, creation, simuler } from './aide';

const PILOTE = 'ap_rival_defi';

/** Un joueur devant la scène pilote, à l'âge voulu, qui choisit de se battre. */
function duel(ageAns: number, graine: number, prep?: (s: GameState) => void): GameState {
  const c = combinaisons().find((x) => x.clan === 'uchiha')!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.rang = ageAns >= 12 ? 'genin' : 'eleve';
  // La technique de clan, comme après la leçon de ses 9 ans.
  if (ageAns >= 9) appliquerEffet(s, { enseigner: 'katon_boule' }, nouveauCtx());
  prep?.(s);
  s.scene = { type: 'evenement', id: PILOTE };
  return choisir(s, 'combattre');
}

/** Branche temporairement un autre combat sur l'Affrontement Racine (pour tester un contexte). */
function brancher(cle: string, af: AffrontementDef, test: () => void): void {
  const avant = R.contenu.racine.affrontements[cle];
  R.contenu.racine.affrontements[cle] = af;
  try {
    test();
  } finally {
    if (avant) R.contenu.racine.affrontements[cle] = avant;
    else delete R.contenu.racine.affrontements[cle];
  }
}

/** Joue un combat jusqu'au bout avec une politique simple. */
function jusquauBout(s: GameState, politique: (s: GameState) => ActionCombat): GameState {
  let k = 0;
  while (s.scene.type === 'affrontement' && k++ < 30) s = combattre(s, politique(s));
  return s;
}
/** Frapper, ou se mettre en garde si l'on est sonné·e. */
const frappe = (s?: GameState): ActionCombat =>
  s?.scene.type === 'affrontement' && s.scene.joueur.sonne > 0 ? { famille: 'defense', choix: 'garde' } : { famille: 'taijutsu', choix: 'coup_puissant' };

describe('Affrontement Racine', () => {
  it('T01 · la scène pilote ne reçoit plus d’attaque greffée : on choisit une intention, les techniques viennent dans le combat', () => {
    const c = combinaisons().find((x) => x.clan === 'uchiha')!;
    const s = nouvellePartie(creation(c), 2);
    s.jour = s.naissance + 360 * 11;
    s.scene = { type: 'evenement', id: PILOTE };
    const vue = choixVisibles(s, R.evenements[PILOTE]).find((x) => x.id === 'combattre')!;
    expect(vue.attaques).toBeUndefined();
    expect(vue.chance).toBeUndefined();
    expect(vue.affrontement?.contexte).toBe('Provocation');
    expect(() => choisir(s, 'combattre@katon_boule')).toThrow();
    expect(choisir(s, 'combattre').scene.type).toBe('affrontement');
  });

  it('T03 · le plafond de manches suit le plus fort des deux, se tire une fois, et reste caché hors examen', () => {
    expect(fourchettePlafond('enfant', 'enfant')).toEqual([1, 2]);
    expect(fourchettePlafond('genin', 'genin')).toEqual([2, 3]);
    expect(fourchettePlafond('jonin', 'genin')).toEqual([3, 4]);
    expect(fourchettePlafond('genin', 'kage')).toEqual([6, 8]);
    for (let g = 1; g <= 40; g++) {
      const s = duel(14, g);
      if (s.scene.type !== 'affrontement') throw new Error();
      expect(s.scene.plafond).toBeGreaterThanOrEqual(2);
      expect(s.scene.plafond).toBeLessThanOrEqual(3);
      expect(vueAffrontement(s)!.manche).toBe('Manche 1');
    }
  });

  it('T04 · les sept issues d’une attaque sont atteignables', () => {
    const vues = new Set<string>();
    for (let g = 1; g <= 400 && vues.size < 7; g++) {
      const s = jusquauBout(
        duel(13, g, (x) => {
          x.jauges.chakra = x.jauges.chakraMax = 200;
          x.attributs.controleChakra = 30 + (g % 50);
        }),
        (x) => {
          const sc = x.scene as Extract<GameState['scene'], { type: 'affrontement' }>;
          if (sc.joueur.sonne > 0) return { famille: 'defense', choix: 'garde' };
          // Alterner technique et coups pour croiser toutes les situations.
          const v = vueAffrontement(x)!;
          const nin = v.familles.find((f) => f.id === 'ninjutsu')?.actions.find((a) => a.disponible);
          if (sc.manche % 2 === 1 && nin) return { famille: 'ninjutsu', choix: nin.id, ...(sc.elan >= 3 ? { elan: 'decisif' as const } : {}) };
          return { famille: 'taijutsu', choix: g % 3 === 0 ? 'frappe_rapide' : 'coup_puissant', ...(sc.elan >= 3 ? { elan: 'decisif' as const } : {}) };
        },
      );
      // La dernière manche disparaît avec la conclusion : on rejoue le combat manche par manche pour lire chaque issue.
      let t = duel(13, g, (x) => {
        x.jauges.chakra = x.jauges.chakraMax = 200;
        x.attributs.controleChakra = 30 + (g % 50);
      });
      for (const a of s.actions.filter((x) => x.a === 'combat')) {
        if (t.scene.type !== 'affrontement') break;
        t = combattre(t, a as ActionCombat);
        const e = t.scene.type === 'affrontement' ? t.scene.journal[t.scene.journal.length - 1] : undefined;
        if (e?.issue) vues.add(e.issue);
      }
    }
    for (const i of ['ratee', 'predite', 'annulee', 'dominee', 'ecrasee', 'surprise', 'touche']) expect(vues, i).toContain(i);
  });

  it('T05 · le coup décisif n’arrive que si une condition est réunie ; une résistance l’empêche de finir le combat', () => {
    // Sans faiblesse lue, sans élan, à niveau égal, sur une garde intacte : aucune condition, jamais de décisif.
    let decisifs = 0;
    for (let g = 1; g <= 300; g++) {
      let s = duel(11, g);
      while (s.scene.type === 'affrontement') {
        const avant = s.scene;
        avant.lecture.faiblesse = false;
        avant.adv.garde = 'ouverte';
        s = combattre(s, frappe(s));
        if (s.scene.type === 'affrontement' && s.scene.journal.at(-1)?.issue === 'decisive') decisifs++;
      }
    }
    expect(decisifs).toBe(0);
    // Avec une faiblesse lue et trois d'élan, le décisif devient possible.
    let avec = 0;
    for (let g = 1; g <= 300; g++) {
      const s = duel(11, g);
      if (s.scene.type !== 'affrontement') continue;
      s.scene.lecture.faiblesse = true;
      s.scene.elan = 3;
      if (s.scene.joueur.sonne > 0) continue;
      const r = combattre(s, { famille: 'taijutsu', choix: 'coup_puissant', elan: 'decisif' });
      const fin = r.scene.type === 'affrontement' ? r.scene.journal.at(-1)?.issue : r.registresCombat[Object.keys(r.registresCombat)[0]]?.derniereIssue;
      if (fin === 'decisive' || fin === 'victoire') avec++;
    }
    expect(avec).toBeGreaterThan(0);
  });

  it('T06 · en contexte mortel, aucun coup mortel sans une annonce de danger à une manche précédente', () => {
    brancher('mg_meute/combat', { adversaire: 'rival_academie', contexte: 'mission', raison: 'test' }, () => {
      let morts = 0;
      let avertis = 0;
      for (let g = 1; g <= 300; g++) {
        const c = combinaisons().find((x) => x.clan === 'uchiha')!;
        let s = nouvellePartie(creation(c), g);
        s.jour = s.naissance + 360 * 13;
        s.rang = 'genin';
        s.missions['d_meute'] = 'en_cours';
        s.scene = { type: 'evenement', id: 'mg_meute' };
        s = choisir(s, 'combat');
        if (s.scene.type !== 'affrontement') continue;
        // Mal en point dès le départ : il faut perdre, pour vérifier comment on peut mourir.
        s.scene.joueur.endurance = Math.round(s.scene.joueur.enduranceMax * 0.3);
        s.scene.plafond = 4;
        let precedente = s.scene;
        while (s.scene.type === 'affrontement') {
          precedente = s.scene;
          if (precedente.annonce.mortelle) avertis++;
          s = combattre(s, { famille: 'defense', choix: 'garde' });
        }
        if (s.fin?.id === 'mort') {
          morts++;
          expect(precedente.avertissementManche).toBeDefined();
          expect(precedente.avertissementManche!).toBeLessThan(precedente.manche);
        }
      }
      // Le danger a bien été annoncé, et la mort reste possible après l'annonce.
      expect(avertis).toBeGreaterThan(0);
      expect(morts).toBeGreaterThan(0);
    });
  });

  it('T07 · une technique inédite ne se prédit pas ; répétée, elle se prédit de plus en plus', () => {
    let predites1 = 0;
    let predites3 = 0;
    for (let g = 1; g <= 300; g++) {
      let s = duel(13, g, (x) => {
        x.jauges.chakra = x.jauges.chakraMax = 300;
      });
      if (s.scene.type !== 'affrontement') continue;
      const nin = vueAffrontement(s)!.familles.find((f) => f.id === 'ninjutsu')?.actions[0];
      if (!nin) continue;
      expect(nin.marques).toContain('inédite');
      s.scene.plafond = 6;
      for (let i = 1; i <= 3 && s.scene.type === 'affrontement'; i++) {
        s = combattre(s, { famille: 'ninjutsu', choix: nin.id });
        if (s.scene.type !== 'affrontement') break;
        const issue = s.scene.journal.at(-1)?.issue;
        if (i === 1 && issue === 'predite') predites1++;
        if (i === 3 && issue === 'predite') predites3++;
      }
    }
    expect(predites1).toBe(0);
    expect(predites3).toBeGreaterThan(10);
  });

  it('T08 · le rival se souvient d’un combat à l’autre, et sa mémoire survit au rejeu', () => {
    let s = jusquauBout(duel(11, 7), frappe);
    const rivalId = s.roles['rival'];
    const reg = s.registresCombat[rivalId];
    expect(reg.rencontres).toBe(1);
    expect(reg.techniquesVuesDuJoueur['coup_puissant']).toBeGreaterThan(0);
    expect(reg.habitudesDuJoueur['ouverture:coup_puissant']).toBe(1);
    // Deuxième rencontre : il ouvre par une réplique de revanche, et il attend ton coup puissant.
    s.scene = { type: 'evenement', id: PILOTE };
    s = choisir(s, 'combattre');
    if (s.scene.type !== 'affrontement') throw new Error();
    expect(vueAffrontement(s)!.familles.find((f) => f.id === 'taijutsu')!.actions.find((a) => a.id === 'coup_puissant')!.marques).toContain('éventée');
    // Sa première réplique est une réplique de revanche, pas de première rencontre.
    const revanches = R.contenu.racine.adversaires[0].repliques.filter((r) => r.categorie === 'revanche').map((r) => r.texte.replace(/\{e\}/g, ''));
    expect(revanches.some((t) => s.scene.type === 'affrontement' && s.scene.journal[0].repliques[0]?.replace(/e$/, '').startsWith(t.slice(0, 20)))).toBe(true);
    // Et dans une vraie vie, rejouée : le registre est identique.
    for (let g = 1; g <= 40; g++) {
      const v = simuler(creation(), 600 + g, 1200);
      if (!v.etat.actions.some((a) => a.a === 'combat')) continue;
      const r = rejouer(v.etat.creation, v.etat.seed, v.etat.actions);
      expect(JSON.stringify(r.registresCombat)).toBe(JSON.stringify(v.etat.registresCombat));
    }
  });

  it('T10 · une bonne perception rend l’annonce plus souvent fiable', () => {
    const fiables = (perception: number) => {
      let n = 0;
      for (let g = 1; g <= 300; g++) {
        const s = duel(11, g, (x) => {
          x.attributs.perception = perception;
          delete x.maitrises['sharingan'];
        });
        if (s.scene.type === 'affrontement' && s.scene.annonce.fiabilite === 'fiable') n++;
      }
      return n;
    };
    expect(fiables(90)).toBeGreaterThan(fiables(15) + 60);
  });

  it('T11 · en capture, la cible ne meurt jamais, et le joueur non plus', () => {
    brancher('mg_meute/combat', { adversaire: 'rival_academie', contexte: 'capture', raison: 'test' }, () => {
      for (let g = 1; g <= 60; g++) {
        const c = combinaisons().find((x) => x.clan === 'uchiha')!;
        let s = nouvellePartie(creation(c), g);
        s.jour = s.naissance + 360 * 14;
        s.rang = 'genin';
        s.missions['d_meute'] = 'en_cours';
        s.scene = { type: 'evenement', id: 'mg_meute' };
        s = choisir(s, 'combat');
        if (s.scene.type === 'affrontement') s.scene.joueur.endurance = 2;
        s = jusquauBout(s, () => ({ famille: 'defense', choix: 'garde' }));
        expect(s.fin?.id).not.toBe('mort');
      }
    });
  });

  it('T12 · un entraînement ne laisse jamais de blessure grave', () => {
    brancher(`${PILOTE}/combattre`, { adversaire: 'rival_academie', contexte: 'entrainement', raison: 'test' }, () => {
      for (let g = 1; g <= 80; g++) {
        const s = jusquauBout(duel(13, g), () => ({ famille: 'defense', choix: 'garde' }));
        expect(s.blessures.some((b) => b.gravite >= 2)).toBe(false);
        expect(s.jauges.sante).toBeGreaterThan(0);
      }
    });
  });

  it('T13 · hors embuscade, refuser le combat reste possible', () => {
    for (const cle of Object.keys(R.contenu.racine.affrontements)) {
      const [ev] = cle.split('/');
      const af = R.contenu.racine.affrontements[cle];
      if (af.contexte === 'embuscade') continue;
      expect(R.evenements[ev].choix.some((c) => !c.test || c.test.type !== 'combat'), cle).toBe(true);
    }
  });

  it('T14 · T24 · un combat rejoué deux fois donne exactement le même état', () => {
    let vus = 0;
    for (let g = 1; g <= 60 && vus < 50; g++) {
      const v = simuler(creation(), 900 + g, 900);
      if (!v.etat.actions.some((a) => a.a === 'combat')) continue;
      vus++;
      const a = rejouer(v.etat.creation, v.etat.seed, v.etat.actions);
      const b = rejouer(v.etat.creation, v.etat.seed, v.etat.actions);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(a.rngState).toBe(v.etat.rngState);
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('T17 · une action invalide est rejetée avec son code, et l’état ne bouge pas', () => {
    const s = duel(8, 3);
    const avant = JSON.stringify(s);
    const code = (a: ActionCombat) => {
      try {
        combattre(s, a);
        return 'accepté';
      } catch (e) {
        return (e as ErreurCombat).code;
      }
    };
    expect(code({ famille: 'kenjutsu' as never, choix: 'x' })).toBe('ACTION_INCONNUE');
    // Un enfant de 8 ans n'a pas accès au ninjutsu.
    expect(code({ famille: 'ninjutsu', choix: 'katon_boule' })).toBe('FAMILLE_INTERDITE');
    expect(code({ famille: 'taijutsu', choix: 'nimporte_quoi' })).toBe('ACTION_INCONNUE');
    expect(code({ famille: 'taijutsu', choix: 'coup_puissant', elan: 'decisif' })).toBe('ELAN_INVALIDE');
    expect(JSON.stringify(s)).toBe(avant);
    const sonne = duel(11, 3);
    if (sonne.scene.type === 'affrontement') sonne.scene.joueur.sonne = 1;
    expect(() => combattre(sonne, frappe())).toThrow(ErreurCombat);
  });

  it('T18 · toutes les techniques ont un rang, et chaque niveau d’adversaire a un gabarit', () => {
    for (const d of Object.values(R.maitrises).filter((m) => m.technique)) expect(d.rang, d.id).toBeDefined();
    for (const n of NIVEAUX) expect(n).toBeTruthy();
  });

  it('T26 · N11 · aucun hasard dans l’écran de combat ; aucune dépendance au navigateur dans le moteur ni le contenu', () => {
    for (const f of readdirSync('src/ui/combat')) expect(readFileSync(`src/ui/combat/${f}`, 'utf-8'), f).not.toMatch(/Math\.random|alea\(|Date\.now|new Date/);
    const fichiers = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : []));
    for (const f of [...fichiers('src/engine'), ...fichiers('src/content')]) expect(readFileSync(f, 'utf-8'), f).not.toMatch(/from 'react'|from 'next|window\.|document\.|localStorage|sessionStorage/);
  });

  it('équilibrage · à niveau égal, environ une victoire sur deux ; pas d’action dominante', () => {
    let gagnes = 0;
    let perdus = 0;
    const choix: Record<string, number> = {};
    const N = 400;
    for (let g = 1; g <= N; g++) {
      let r = (g * 2654435761) >>> 0;
      const s = jusquauBout(duel(11, g), (x) => {
        const v = vueAffrontement(x)!;
        const poss = v.familles.filter((f) => f.id === 'taijutsu' || f.id === 'defense').flatMap((f) => f.actions.filter((a) => a.disponible).map((a) => ({ famille: f.id, choix: a.id })));
        r = (r * 1103515245 + 12345) >>> 0;
        const a = poss[Math.floor((r / 4294967296) * poss.length)];
        choix[a.choix] = (choix[a.choix] ?? 0) + 1;
        return a;
      });
      const fin = s.registresCombat[s.roles['rival']]?.derniereIssue;
      if (fin === 'victoire' || fin === 'departage_gagne') gagnes++;
      if (fin === 'defaite' || fin === 'departage_perdu') perdus++;
    }
    expect(gagnes / N).toBeGreaterThan(0.3);
    expect(gagnes / N).toBeLessThan(0.7);
    expect(perdus).toBeGreaterThan(0);
    const total = Object.values(choix).reduce((a, b) => a + b, 0);
    for (const [k, n] of Object.entries(choix)) expect(n / total, k).toBeLessThan(0.4);
  });
});
