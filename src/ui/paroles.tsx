import type { ReactNode } from 'react';

/** Les paroles entre guillemets ressortent du récit : on entend qui parle avant de lire ce qui se passe. */
export function avecParoles(p: string): ReactNode[] {
  return p.split(/(«[^»]*»)/g).map((morceau, i) =>
    morceau.startsWith('«') ? (
      <q className="parole" key={i}>
        {morceau}
      </q>
    ) : (
      morceau
    ),
  );
}
