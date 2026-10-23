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
  ninjutsu: '忍',
  clan: '家',
  fusion: '融',
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
  ninjutsu: 'Ninjutsu',
  clan: 'Clan et pouvoirs',
  fusion: 'Lignées',
  trinite: 'Trinités',
  autres: 'Sans nature',
};

/** Le groupe d'une technique : sa nature de chakra, sinon sa famille. */
export function groupeTechnique(techId: string): string {
  const def = R.maitrises[techId];
  if (def?.element) return def.element;
  // Les pouvoirs de clan et les lignées de fusion ont leur propre groupe (le Sharingan n'est d'aucune nature).
  if (def?.composantes) return 'fusion';
  if (def?.kind === 'clan') return 'clan';
  if (def?.kind === 'biju') return 'biju';
  const cat = def?.technique?.categorie;
  if (cat === 'combinaison' && (def?.technique?.elements?.length ?? 0) >= 3) return 'trinite';
  return cat && LIBELLE_FAMILLE[cat] ? cat : 'autres';
}

export function libelleGroupe(g: string): string {
  return R.elements[g]?.nom ?? LIBELLE_FAMILLE[g] ?? g;
}

/** Le groupe ouvert en dernier, par usage (combat, temps libre…), gardé pour la session : le composant est recréé à chaque manche. */
const derniersOuverts = new Map<string, string>();

export default function GroupesNature<T>({
  items,
  techId,
  rendu,
  titre,
  groupe = (t) => groupeTechnique(techId(t)),
  liste = false,
}: {
  items: T[];
  techId: (t: T) => string;
  rendu: (t: T) => ReactNode;
  titre?: string;
  /** Le groupe d'un élément ; par défaut, la nature de sa technique. */
  groupe?: (t: T) => string;
  /** Les éléments rendus sont des <li> : le contenu d'un groupe devient une liste. */
  liste?: boolean;
}) {
  const base = useId();
  const memoire = titre ?? 'defaut';
  const groupes = new Map<string, T[]>();
  for (const it of items) {
    const g = groupe(it);
    groupes.set(g, [...(groupes.get(g) ?? []), it]);
  }
  const ids = [...groupes.keys()];
  const dernier = derniersOuverts.get(memoire);
  const [ouvert, setOuvert] = useState<string | undefined>(() => (dernier && ids.includes(dernier) ? dernier : ids.length === 1 ? ids[0] : undefined));
  if (!items.length) return null;
  return (
    <div className="groupes-nature" role="group" aria-label={titre ?? 'Techniques par nature'}>
      {ids.map((g) => {
        const elements = groupes.get(g)!;
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
                if (suivant) derniersOuverts.set(memoire, suivant);
              }}
            >
              <span className="groupe-kanji" aria-hidden="true">
                {KANJI_GROUPE[g] ?? '術'}
              </span>
              <span className="groupe-nom">
                {libelleGroupe(g)} · {elements.length}
              </span>
              <span className="groupe-chevron" aria-hidden="true">
                {est ? '−' : '+'}
              </span>
            </button>
            {est &&
              (liste ? (
                <ul id={panneau} className="groupe-contenu activites">
                  {elements.map((it) => rendu(it))}
                </ul>
              ) : (
                <div id={panneau} className="groupe-contenu">
                  {elements.map((it) => rendu(it))}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
