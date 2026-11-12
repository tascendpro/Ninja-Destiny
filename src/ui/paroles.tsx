import type { ReactNode } from 'react';
import { decouper } from './repliques';

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

/**
 * Un paragraphe du récit. S'il contient des paroles, chaque réplique part à la ligne derrière un tiret
 * (repliques.ts) ; sinon il reste un seul bloc de texte.
 */
export function ParagrapheRecit({ texte, classe }: { texte: string; classe?: string }) {
  const lignes = decouper(texte);
  if (!lignes.some((l) => l.replique)) return <p className={classe}>{avecParoles(texte)}</p>;
  return (
    <div className="dialogue">
      {lignes.map((l, i) => (
        <p key={i} className={[classe, l.replique ? 'replique' : undefined].filter(Boolean).join(' ') || undefined}>
          {l.replique && (
            <span className="tiret" aria-hidden="true">
              —{' '}
            </span>
          )}
          {l.morceaux.map((m, j) =>
            m.parole ? (
              <q className="parole" key={j}>
                {m.texte}
              </q>
            ) : (
              <span key={j}>{m.texte}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
