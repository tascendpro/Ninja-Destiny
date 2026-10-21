import { describe, expect, it } from 'vitest';
import { nouvellePartie } from '../src/engine/moteur';
import { defPnj } from '../src/engine/etat';
import { R } from '../src/engine/registre';
import { combinaisons, creation } from './aide';
import { resoudreTexte } from '../src/engine/texte';

const ROLES = ['coequipierA', 'coequipierB', 'rival', 'sensei'];

describe('Des visages différents à chaque partie', () => {
  it('le rival, les camarades et le sensei changent de nom et de clan d’une partie à l’autre', () => {
    for (const role of ROLES) {
      const noms = new Set<string>();
      const clans = new Set<string>();
      for (let g = 1; g <= 30; g++) {
        const s = nouvellePartie(creation(), g);
        const d = defPnj(s, s.roles[role])!;
        noms.add(d.nom);
        clans.add(d.clan ?? '');
      }
      expect(noms.size, role).toBeGreaterThan(5);
      expect(clans.size, role).toBeGreaterThan(2);
    }
  });

  it('même graine, mêmes visages', () => {
    const a = nouvellePartie(creation(), 42);
    const b = nouvellePartie(creation(), 42);
    for (const role of ROLES) expect(defPnj(a, a.roles[role])).toEqual(defPnj(b, b.roles[role]));
  });

  it('chaque visage tiré reste cohérent : genre du rôle, clan du village, pouvoirs de ce clan, aucun doublon de prénom', () => {
    for (const c of combinaisons().slice(0, 12)) {
      for (let g = 1; g <= 5; g++) {
        const s = nouvellePartie(creation(c), g);
        const prenoms = new Set<string>();
        for (const role of ROLES) {
          const base = R.pnj[R.contenu.roles[c.village][role]];
          const d = defPnj(s, s.roles[role])!;
          expect(d.genre).toBe(base.genre);
          expect(R.clans[d.clan!].villages).toContain(c.village);
          for (const t of R.clans[d.clan!].techniques.filter((t) => R.maitrises[t])) expect(s.pnj[d.id].maitrises[t], `${d.nom} : ${t}`).toBeDefined();
          const prenom = d.nom.split(' ')[0];
          expect(prenoms.has(prenom)).toBe(false);
          prenoms.add(prenom);
        }
      }
    }
  });

  it('les scènes d’origine qui parlent d’un cousin ou d’une cousine le tirent dans ton clan', () => {
    for (const [clan, village, element, role] of [['hyuga', 'konoha', 'katon', 'coequipierB'], ['hozuki', 'kiri', 'suiton', 'rival'], ['kaguya', 'kiri', 'suiton', 'coequipierB'], ['raiko', 'kumo', 'raiton', 'rival']] as const)
      for (let g = 1; g <= 10; g++) {
        const s = nouvellePartie(creation({ village, clan, element }), g);
        expect(defPnj(s, s.roles[role])!.clan, `${clan} → ${role}`).toBe(clan);
      }
  });

  it('les brutes de l’Académie se moquent du clan tiré, jamais d’un sceau qu’il n’a pas', () => {
    const ev = R.evenements['a_intimidation'];
    for (let g = 1; g <= 40; g++) {
      const s = nouvellePartie(creation({ village: 'konoha', clan: 'nara', element: 'katon' }), g);
      const texte = resoudreTexte(ev.texte, s);
      const b = defPnj(s, s.roles['coequipierB'])!;
      expect(texte.includes('sceau'), `${b.nom} (${b.clan})`).toBe(b.clan === 'hyuga');
      // Une phrase d'accroche et une seule moquerie : jamais deux, jamais aucune.
      expect(texte.split(/\n\n+/).length).toBe(2);
    }
  });
});
