// La couleur d'une technique suit ses natures, dans l'ordre : une combinaison eau + foudre est moitié Suiton, moitié Raiton ;
// une trinité se partage en trois tiers. --nat garde la première nature pour ce qui n'a qu'une couleur.

import type { CSSProperties } from 'react';

const couleur = (n: string) => `var(--n-${n}, var(--or))`;

/** Les variables de couleur d'une technique : --nat (première nature), et pour plusieurs natures une bande et un fond partagés. */
export function styleNatures(natures: string[], cle = '--nat'): CSSProperties | undefined {
  if (!natures.length) return undefined;
  const st: Record<string, string> = { [cle]: couleur(natures[0]) };
  if (natures.length > 1) {
    const pas = 100 / natures.length;
    const parts = (f: (n: string) => string) => natures.map((n, i) => `${f(n)} ${(i * pas).toFixed(1)}% ${((i + 1) * pas).toFixed(1)}%`).join(', ');
    st['--nat-bande'] = `linear-gradient(to bottom, ${parts(couleur)})`;
    st['--nat-fond'] = `linear-gradient(90deg, ${parts((n) => `color-mix(in srgb, ${couleur(n)} 13%, var(--ardoise))`)})`;
  }
  return st as CSSProperties;
}

/** Plusieurs natures : la classe qui active la bande et le fond partagés. */
export const classeMulti = (natures: string[]) => (natures.length > 1 ? ' multi' : '');
