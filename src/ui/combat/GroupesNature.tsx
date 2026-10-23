'use client';

// Les techniques regroupées par nature de chakra (§22.3) : un en-tête « Raiton · 2 » qui ouvre son panneau.
// Une seule nature ouverte à la fois ; la dernière ouverte le reste pour la session.

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { R } from '../../engine/registre';

export const KANJI_GROUPE: Record<string, string> = {
  katon: '火',
  suiton: '水',
  fuuton: '風',
  raiton: '雷',
  doton: '土',
  taijutsu: '体',
  genjutsu: '幻',
  armes: '刃',
  fuinjutsu: '封',
  medical: '医',
  dojutsu: '眼',
  biju: '獣',
  combinaison: '合',
  trinite: '三',
  autres: '術',
};
const LIBELLE_FAMILLE: Record<string, string> = {
  taijutsu: 'Taijutsu',
  genjutsu: 'Genjutsu',
  armes: 'Armes',
  fuinjutsu: 'Sceaux',
  medical: 'Médecine',
  dojutsu: 'Dōjutsu',
  biju: 'Bijū',
  combinaison: 'Combinaisons',
  trinite: 'Trinités',
  autres: 'Sans nature',
};

/** Le groupe d'une technique : sa nature de chakra, sinon sa famille. */
export function groupeTechnique(techId: string): string {
  const def = R.maitrises[techId];
  if (def?.element) return def.element;
  const cat = def?.technique?.categorie;
  if (cat === 'combinaison' && (def?.technique?.elements?.length ?? 0) >= 3) return 'trinite';
  return cat && LIBELLE_FAMILLE[cat] ? cat : 'autres';
}

export function libelleGroupe(g: string): string {
  return R.elements[g]?.nom ?? LIBELLE_FAMILLE[g] ?? g;
}

/** Le groupe ouvert en dernier, gardé pour la session (le composant est recréé à chaque manche). */
let dernierOuvert: string | undefined;

export default function GroupesNature<T>({ items, techId, rendu, titre }: { items: T[]; techId: (t: T) => string; rendu: (t: T) => ReactNode; titre?: string }) {
  const base = useId();
  const groupes = new Map<string, T[]>();
  for (const it of items) {
    const g = groupeTechnique(techId(it));
    groupes.set(g, [...(groupes.get(g) ?? []), it]);
  }
  const ids = [...groupes.keys()];
  const [ouvert, setOuvert] = useState<string | undefined>(() => (dernierOuvert && ids.includes(dernierOuvert) ? dernierOuvert : ids.length === 1 ? ids[0] : undefined));
  if (!items.length) return null;
  return (
    <div className="groupes-nature" role="group" aria-label={titre ?? 'Techniques par nature'}>
      {ids.map((g) => {
        const liste = groupes.get(g)!;
        const panneau = `${base}-${g}`;
        const est = ouvert === g;
        return (
          <div key={g} className={`groupe-nature${est ? ' ouvert' : ''}`} style={{ '--nat': `var(--n-${g}, var(--or))` } as React.CSSProperties}>
            <button
              type="button"
              className="groupe-entete"
              aria-expanded={est}
              aria-controls={panneau}
              onClick={() => {
                const suivant = est ? undefined : g;
                setOuvert(suivant);
                if (suivant) dernierOuvert = suivant;
              }}
            >
              <span className="groupe-kanji" aria-hidden="true">
                {KANJI_GROUPE[g] ?? '術'}
              </span>
              <span className="groupe-nom">
                {libelleGroupe(g)} · {liste.length}
              </span>
              <span className="groupe-chevron" aria-hidden="true">
                {est ? '−' : '+'}
              </span>
            </button>
            {est && (
              <div id={panneau} className="groupe-contenu">
                {liste.map((it) => rendu(it))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
