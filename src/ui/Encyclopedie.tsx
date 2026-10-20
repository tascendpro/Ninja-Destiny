'use client';

import { useState } from 'react';
import type { EntreeEncyclopedie, GameState } from '../engine/types';
import { R } from '../engine/registre';
import type { Meta } from '../engine/sauvegarde';
import { accorder } from '../engine/texte';
import Rouleaux from './Rouleaux';

const CATEGORIES: { id: EntreeEncyclopedie['categorie'] | 'secret' | 'rouleaux'; nom: string }[] = [
  { id: 'rouleaux', nom: 'Rouleaux des techniques' },
  { id: 'village', nom: 'Villages' },
  { id: 'clan', nom: 'Clans' },
  { id: 'pouvoir', nom: 'Pouvoirs' },
  { id: 'technique', nom: 'Techniques' },
  { id: 'arme', nom: 'Armes' },
  { id: 'metier', nom: 'Métiers' },
  { id: 'personnage', nom: 'Personnages' },
  { id: 'lieu', nom: 'Lieux' },
  { id: 'organisation', nom: 'Organisations' },
  { id: 'histoire', nom: 'Histoire' },
  { id: 'secret', nom: 'Secrets' },
];

export default function Encyclopedie({ etat, meta }: { etat: GameState | null; meta: Meta }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]['id']>('village');
  const connues = new Set<string>([...meta.decouvertes, ...(etat?.decouvertes ?? [])]);
  if (etat) {
    for (const m of Object.values(etat.maitrises)) {
      if (m.kind === 'jutsu' && m.tier >= 1) connues.add(`technique:${m.id}`);
      if ((m.kind === 'clan' || R.maitrises[m.id]?.composantes) && m.awakened) connues.add(`pouvoir:${m.id}`);
    }
    for (const s of etat.secrets) connues.add(`secret:${s}`);
  }

  const entrees = R.contenu.encyclopedie.filter((e) => {
    if (cat === 'rouleaux') return false;
    if (cat === 'secret') return e.id.startsWith('secret:');
    if (e.id.startsWith('secret:')) return false;
    return e.categorie === cat;
  });
  const visibles = entrees.filter((e) => e.publique || connues.has(e.id));
  const famille = cat === 'personnage' && etat ? Object.values(etat.pnjGeneres) : [];

  return (
    <div className="colonne">
      <h1 className="titre-ecran">Encyclopédie</h1>
      <p className="sous-titre">Ce que tu ignores reste caché jusqu’à ce que tu le découvres.</p>
      <div className="onglets" role="tablist">
        {CATEGORIES.map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}>
            {c.nom}
          </button>
        ))}
      </div>
      {cat === 'rouleaux' ? (
        <Rouleaux etat={etat} />
      ) : (
        <p className="sous-titre">
          {visibles.length} sur {entrees.length} entrées connues.
        </p>
      )}
      {cat === 'histoire' && (
        <details className="entree" open>
          <summary>
            <strong>Chronologie</strong>
          </summary>
          <div className="corps">
            {R.contenu.monde.chronologie.map((c) => (
              <p key={c.an}>
                An {c.an} : {c.texte}
              </p>
            ))}
          </div>
        </details>
      )}
      {famille.map((p) => (
        <details className="entree" key={p.id}>
          <summary>
            <strong>{p.nom}</strong>
            <span className="sous-titre">{etat?.creation.origine === 'orphelin' ? 'L’orphelinat' : p.role === 'parent' ? 'Ta famille' : 'Ta fratrie'}</span>
          </summary>
          <div className="corps">
            <p>{accorder(p.personnalite, p.genre === 'f' ? 'feminin' : 'masculin')}</p>
            <p>{accorder(p.histoire, p.genre === 'f' ? 'feminin' : 'masculin')}</p>
          </div>
        </details>
      ))}
      {entrees.map((e) =>
        e.publique || connues.has(e.id) ? (
          <details className="entree" key={e.id}>
            <summary>
              <strong>{e.titre}</strong>
            </summary>
            <div className="corps">
              <p>{e.resume}</p>
              {e.details.map((d, i) => (
                <p key={i}>{d}</p>
              ))}
            </div>
          </details>
        ) : (
          <p className="entree inconnue" key={e.id}>
            Entrée inconnue
          </p>
        ),
      )}
    </div>
  );
}
