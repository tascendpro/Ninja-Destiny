import { describe, expect, it } from 'vitest';
import { decouper } from '../src/ui/repliques';
import { R } from '../src/engine/registre';

/** Tous les textes du jeu, tels qu'ils passent par la mise en page des dialogues. */
function textes(): string[] {
  const res: string[] = [];
  const ajouter = (t: unknown) => {
    if (typeof t === 'string') res.push(...t.split(/\n\n+/));
    else if (Array.isArray(t)) t.forEach((x) => ajouter((x as { texte?: unknown }).texte ?? x));
  };
  for (const ev of R.contenu.evenements) {
    ajouter(ev.texte);
    for (const ch of ev.choix) ajouter((ch as { resultat?: unknown }).resultat);
  }
  return res;
}

describe('Les dialogues de tout le jeu', () => {
  it('le découpage ne perd ni ne duplique aucun mot', () => {
    for (const p of textes()) {
      const lignes = decouper(p);
      const rendu = lignes.map((l) => l.morceaux.map((m) => m.texte).join('')).join(' ');
      const mots = (t: string) => t.replace(/[«»—]/g, ' ').replace(/\s+([,.;:!?…])/g, '$1').split(/\s+/).filter(Boolean).join(' ');
      expect(mots(rendu), p.slice(0, 80)).toBe(mots(p));
    }
  });

  it('aucune réplique ne garde de guillemet orphelin', () => {
    let repliques = 0;
    for (const p of textes()) {
      for (const l of decouper(p)) {
        if (!l.replique) continue;
        repliques++;
        for (const m of l.morceaux) if (m.parole) expect(m.texte, p.slice(0, 80)).not.toMatch(/[«»]/);
      }
    }
    expect(repliques).toBeGreaterThan(1000);
  });
});
