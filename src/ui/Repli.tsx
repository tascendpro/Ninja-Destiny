'use client';

// Sur téléphone, chaque bloc se réduit à un résumé d'une ligne ; un bouton ouvre le détail.
// Sur grand écran, le détail reste affiché et le bouton disparaît (voir .repli dans styles.css).

import { useId, useState } from 'react';
import type { ReactNode } from 'react';

export default function Repli({ resume, children, libelle = 'Détails', className = '' }: { resume: ReactNode; children: ReactNode; libelle?: string; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <div className={`repli${ouvert ? ' ouvert' : ''} ${className}`.trim()}>
      <div className="repli-tete">
        <div className="repli-resume">{resume}</div>
        <button type="button" className="repli-bouton" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert(!ouvert)}>
          <span className="visuellement-cache">{ouvert ? 'Masquer le détail' : libelle}</span>
          <span aria-hidden="true">{ouvert ? '−' : '+'}</span>
        </button>
      </div>
      <div id={id} className={`repli-detail${ouvert ? '' : ' ferme'}`}>
        {children}
      </div>
    </div>
  );
}
