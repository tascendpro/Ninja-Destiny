import { describe, expect, it } from 'vitest';
import { CONVERSATIONS_2 } from '../src/content/evenements/conversations2';
import { REPLIQUES_PERSONNALITE } from '../src/content/combat/personnalites';
import { TEMPERAMENTS } from '../src/engine/combat/types';
import { R } from '../src/engine/registre';

describe('Les conversations qui se souviennent, suite', () => {
  it('chaque conversation est enregistrée, avec au moins trois réponses et des paroles', () => {
    expect(CONVERSATIONS_2.length).toBeGreaterThanOrEqual(13);
    for (const ev of CONVERSATIONS_2) {
      expect(R.evenements[ev.id], ev.id).toBeDefined();
      expect(ev.choix.length, ev.id).toBeGreaterThanOrEqual(3);
      expect(JSON.stringify(ev.texte), ev.id).toMatch(/«/);
    }
  });

  it('chaque retour exige la première conversation, et répond à chacune des réponses données ce jour-là', () => {
    for (const ev of CONVERSATIONS_2.filter((e) => e.id.endsWith('_retour'))) {
      const origine = ev.id.replace(/_retour$/, '');
      const premiere = CONVERSATIONS_2.find((e) => e.id === origine);
      expect(premiere, origine).toBeDefined();
      expect(JSON.stringify(ev.si), ev.id).toContain(`"vu":"${origine}"`);
      // Chaque valeur du drapeau posée par la première conversation est reprise, ou couverte par un « sinon ».
      const texte = JSON.stringify(ev.texte);
      const valeurs = premiere!.choix.flatMap((c) => (c.effets ?? []).flatMap((e) => ('drapeau' in e && e.drapeau === origine && typeof e.valeur === 'string' ? [e.valeur] : [])));
      expect(valeurs.length, origine).toBeGreaterThanOrEqual(3);
      const sinon = texte.includes('"non":{"drapeau"');
      for (const v of valeurs) expect(sinon || texte.includes(`"egal":"${v}"`), `${ev.id} ignore la réponse « ${v} »`).toBe(true);
    }
  });

  it('aucun point médian : les accords passent par les jetons', () => {
    expect(JSON.stringify(CONVERSATIONS_2)).not.toContain('·');
  });
});

describe('Les voix de personnalité', () => {
  it('chaque tempérament a de quoi ne pas se répéter : au moins 18 répliques, et deux entrées', () => {
    for (const t of TEMPERAMENTS) {
      const banque = REPLIQUES_PERSONNALITE[t];
      const total = Object.values(banque).reduce((n, l) => n + (l?.length ?? 0), 0);
      expect(total, t).toBeGreaterThanOrEqual(18);
      expect(banque.entree?.length ?? 0, t).toBeGreaterThanOrEqual(2);
    }
  });

  it('une réplique ne tutoie jamais le joueur au masculin par défaut : seuls les jetons connus apparaissent', () => {
    const tout = JSON.stringify(REPLIQUES_PERSONNALITE);
    const jetons = new Set(tout.match(/\{[A-Za-z]+\}/g) ?? []);
    for (const j of jetons) expect(['{nom}', '{Il}', '{il}', '{lui}', '{e}', '{le}', '{Le}']).toContain(j);
  });
});
