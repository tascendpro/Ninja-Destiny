import { describe, expect, it } from 'vitest';
import { creation } from './aide';
import { nouvellePartie, choisir, manche, vueCombat, activite } from '../src/engine/moteur';
import { greffer, resolveAwakening, liaisonSenjuUchiha, blocageApprentissage } from '../src/engine/maitrise';
import { appliquerEffet } from '../src/engine/effets';
import { nouveauCtx, nomComplet } from '../src/engine/etat';
import type { GameState } from '../src/engine/types';

const uchiha = (): GameState => {
  const s = nouvellePartie(creation({ village: 'konoha', clan: 'uchiha', element: 'katon' }), 11);
  s.jour = s.naissance + 20 * 360;
  s.rang = 'jonin';
  return s;
};
const eveille = (s: GameState, id: string, tier: number) => {
  const ms = s.maitrises[id];
  ms.awakened = true;
  ms.tier = tier as 1;
  ms.awakenedAtDay = s.jour - 3000;
};

describe('Mangekyō et Rinnegan', () => {
  it('le Mangekyō tire deux pouvoirs propres à ce porteur, et Susanoo reste ouvert à tous', () => {
    const s = uchiha();
    eveille(s, 'sharingan', 3);
    s.drapeaux['perte_tragique'] = true;
    s.maitrises['mangekyo'].potential = 90;
    const r = resolveAwakening(s, 'mangekyo', 100, nouveauCtx());
    expect(r.reussi).toBe(true);
    const pouvoirs = ['tsukuyomi', 'amaterasu', 'kamui', 'kotoamatsukami', 'izanagi'].filter((p) => s.drapeaux[`mgk:${p}`]);
    expect(pouvoirs).toHaveLength(2);
    const absent = ['tsukuyomi', 'amaterasu', 'kamui'].find((p) => !s.drapeaux[`mgk:${p}`])!;
    expect(blocageApprentissage(s, absent)).toMatch(/n’appartient pas/);
    s.jauges.chakraMax = 200;
    expect(blocageApprentissage(s, 'susanoo')).toBeUndefined();
  });
  it('Sharingan + cellules Senju : la liaison se fait, puis le Rinnegan s’éveille une nuit de fièvre', () => {
    const s = uchiha();
    eveille(s, 'sharingan', 3);
    s.drapeaux['cellules_senju'] = true;
    liaisonSenjuUchiha(s, nouveauCtx());
    expect(s.maitrises['rinnegan']).toBeDefined();
    expect(s.planifies.some((p) => p.evenementId === 'x_rinnegan')).toBe(true);
    s.scene = { type: 'evenement', id: 'x_rinnegan' };
    const t = choisir(s, 'accepter');
    expect(t.maitrises['rinnegan'].awakened).toBe(true);
  });
  it('un Senju avec un Sharingan greffé suit le même chemin', () => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'senju', element: 'doton' }), 12);
    s.jour = s.naissance + 22 * 360;
    greffer(s, 'sharingan', nouveauCtx());
    s.maitrises['sharingan'].tier = 3;
    liaisonSenjuUchiha(s, nouveauCtx());
    expect(s.maitrises['rinnegan']).toBeDefined();
    expect(s.maitrises['mangekyo']).toBeDefined();
  });
});

describe('Combats : enchaînements et sacoche', () => {
  const combat = (graine = 13) => {
    const s = nouvellePartie(creation({ village: 'konoha', clan: 'sans_clan', element: 'katon' }), graine);
    s.jour = s.naissance + 15 * 360;
    s.rang = 'genin';
    s.jauges.chakraMax = 150;
    s.jauges.chakra = 150;
    for (const [id, base] of [['nature_katon', 'ninjutsu'], ['nature_fuuton', 'ninjutsu'], ['katon_braises', 'ninjutsu'], ['fuuton_rafale', 'ninjutsu']] as const)
      s.maitrises[id] = { ...s.maitrises[base], id, kind: id.startsWith('nature') ? 'element' : 'jutsu', awakened: true, tier: 2 };
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    return s;
  };
  it('le feu après le vent (ou l’inverse) est un enchaînement, avec un bonus annoncé', () => {
    // Une partie où le vent frappe et où c'est encore à toi de jouer à la manche suivante (l'initiative est tirée aux dés).
    let s = choisir(combat(), 'frontal@fuuton_rafale');
    for (let g = 14; g < 200 && (s.scene.type !== 'combat' || vueCombat(s)!.adversaire); g++) s = choisir(combat(g), 'frontal@fuuton_rafale');
    const v = vueCombat(s)!;
    const feu = v.attaques.find((a) => a.id === 'katon_braises')!;
    expect(feu.enchainement).toBeDefined();
    s = manche(s, 'katon_braises');
    expect(s.scene.type === 'combat' && s.scene.journal.at(-1)).toContain('Enchaînement');
  });
  it('un objet acheté à l’échoppe s’utilise pendant une manche', () => {
    let s = combat();
    s.jauges.ryo = 200;
    s.scene = { type: 'temps_libre' };
    s = activite(s, 'achat:parchemin_explosif');
    expect(s.consommables['parchemin_explosif']).toBe(1);
    expect(s.annonce).toMatch(/sacoche/);
    s.scene = { type: 'evenement', id: 'c2_tournoi' };
    s = choisir(s, 'frontal');
    // L'adversaire peut frapper le premier : on se défend d'abord.
    while (s.scene.type === 'combat' && vueCombat(s)!.adversaire) s = manche(s, 'esquiver');
    expect(vueCombat(s)!.objets.map((o) => o.id)).toContain('parchemin_explosif');
    s = manche(s, 'objet:parchemin_explosif');
    expect(s.consommables['parchemin_explosif']).toBe(0);
  });
});

describe('Sans-nom', () => {
  it('un sans-nom peut fonder son propre nom de famille', () => {
    const s = nouvellePartie(creation({ village: 'suna', clan: 'sans_clan', element: 'fuuton' }), 14);
    appliquerEffet(s, { nomDeFamille: 'Kurogane' }, nouveauCtx());
    expect(nomComplet(s)).toContain('Kurogane');
  });
});
