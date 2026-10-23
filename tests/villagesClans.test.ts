import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameState, VillageId } from '../src/engine/types';
import { choisir, nouvellePartie } from '../src/engine/moteur';
import { evenementDisponible } from '../src/engine/selection';
import { R } from '../src/engine/registre';
import { VILLAGES_VIVANTS } from '../src/content/evenements/villages';
import { VOIX_CLANS } from '../src/content/evenements/voixClans';
import { combinaisons, creation } from './aide';

const VILLAGES: VillageId[] = ['konoha', 'suna', 'kiri', 'kumo', 'iwa'];

function joueur(filtre: { village?: VillageId; clan?: string }, ageAns: number, graine = 1): GameState {
  const c = combinaisons().find((x) => (!filtre.village || x.village === filtre.village) && (!filtre.clan || x.clan === filtre.clan))!;
  const s = nouvellePartie(creation(c), graine);
  s.jour = s.naissance + 360 * ageAns;
  s.rang = ageAns >= 12 ? 'genin' : 'eleve';
  return s;
}

describe('Villages et clans vivants', () => {
  it('chaque grand village parle à chaque âge : enfance, Académie, genin et adulte', () => {
    for (const v of VILLAGES) {
      const propres = VILLAGES_VIVANTS.filter((e) => !e.enchaine && JSON.stringify(e.si).includes(`"village":"${v}"`));
      for (const [age, nom] of [[8, 'enfance'], [11, 'Académie'], [14, 'genin'], [24, 'adulte']] as const) {
        const s = joueur({ village: v }, age);
        expect(propres.some((e) => evenementDisponible(s, e)), `${v} : rien pour ${nom}`).toBe(true);
      }
    }
  });

  it('une scène de village ne s’ouvre jamais dans un autre village', () => {
    const s = joueur({ village: 'konoha' }, 11);
    expect(evenementDisponible(s, R.evenements['kv_konoha_tobio'])).toBe(true);
    const autre = joueur({ village: 'kiri' }, 11);
    expect(evenementDisponible(autre, R.evenements['kv_konoha_tobio'])).toBe(false);
    expect(evenementDisponible(autre, R.evenements['kv_kiri_secret'])).toBe(true);
  });

  it('chaque fil de village revient plus tard, et le retour se souvient du choix fait', () => {
    const rappels = new Set(VILLAGES_VIVANTS.flatMap((e) => JSON.stringify(e).match(/"retour":"([a-z_]+)"/g) ?? []).map((x) => x.split('"')[3]));
    for (const e of VILLAGES_VIVANTS.filter((x) => x.enchaine)) expect(rappels.has(e.id), e.id).toBe(true);
    // Tobio se souvient de ce que tu as fait : rire avec les autres ne donne pas la même retrouvaille que le défendre.
    const s = joueur({ village: 'konoha' }, 11, 3);
    s.scene = { type: 'evenement', id: 'kv_konoha_tobio' };
    const r = choisir(s, 'moquer');
    expect(r.drapeaux['tobio']).toBe('moque');
    const texte = JSON.stringify(R.evenements['kv_konoha_tobio_retour'].texte);
    expect(texte).toContain('"egal":"moque"');
    expect(texte).toContain('"egal":"defendu"');
  });

  it('chaque clan a sa voix d’enfance et une dispute d’adultes où le joueur tranche', () => {
    for (const clan of R.contenu.clans.map((c) => c.id)) {
      const enfant = VOIX_CLANS.find((e) => e.id === `vx_${clan}_enfant`);
      const adulte = VOIX_CLANS.find((e) => e.id === `vx_${clan}_adulte`);
      expect(enfant, clan).toBeDefined();
      expect(adulte, clan).toBeDefined();
      expect(evenementDisponible(joueur({ clan }, 8), enfant!), `${clan} enfant`).toBe(true);
      expect(evenementDisponible(joueur({ clan }, 25), adulte!), `${clan} adulte`).toBe(true);
      // Les deux choix d'une dispute ne mènent pas au même endroit.
      const [a, b] = adulte!.choix;
      expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
      const autre = R.contenu.clans.map((c) => c.id).find((c) => c !== clan)!;
      expect(evenementDisponible(joueur({ clan: autre }, 8), enfant!), `${clan} chez ${autre}`).toBe(false);
    }
  });

  it('la création propose « Masculin » en premier et par défaut, puis « Féminin » accordé au masculin', () => {
    const src = readFileSync('src/ui/Creation.tsx', 'utf-8');
    expect(src).toMatch(/\['masculin', 'Masculin', '男', 'Il'\],\s*\['feminin', 'Féminin', '女', 'Elle'\]/);
    expect(src).not.toMatch(/Masculine|Féminine/);
    expect(src).toContain("presentation: 'masculin',");
    expect(src).toContain("['neutre', 'Neutre', '人', 'Iel']");
  });
});
