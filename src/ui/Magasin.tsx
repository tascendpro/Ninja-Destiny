'use client';

// Le magasin du village : réparation de l'arme en main, sacoche (pilules, parchemins, fumigènes) et armes.
// Tout y est instantané et ne compte pas comme la décision de la période ; on n'y achète que pendant le temps libre.

import { useMemo } from 'react';
import type { GameState } from '../engine/types';
import type { Activite } from '../engine/tempsLibre';
import { genererActivites } from '../engine/tempsLibre';
import { accorder } from '../engine/texte';

const RAYONS: { titre: string; kanji: string; aide?: string; filtre: (a: Activite) => boolean }[] = [
  { titre: 'Forge', kanji: '鍛', aide: 'Une lame entretenue frappe plus juste et ne casse pas au mauvais moment.', filtre: (a) => a.id === 'forge:reparer' },
  { titre: 'Sacoche', kanji: '袋', aide: 'Pilules, parchemins et fumigènes s’utilisent pendant les combats en manches.', filtre: (a) => a.id.startsWith('achat:') },
  { titre: 'Armes', kanji: '刃', aide: 'Une arme achetée rejoint ton arsenal. Pour la prendre en main, va dans Ninja › Arsenal.', filtre: (a) => a.id.startsWith('forge:acheter:') },
];

export default function Magasin({ etat, onAcheter }: { etat: GameState; onAcheter: (id: string) => void }) {
  const p = etat.creation.presentation;
  const ouvert = etat.scene.type === 'temps_libre';
  const acts = useMemo(() => genererActivites(etat).filter((a) => a.categorie === 'forge'), [etat]);
  const rayons = RAYONS.map((r) => ({ ...r, liste: acts.filter(r.filtre) })).filter((r) => r.liste.length > 0);

  return (
    <div className="page magasin">
      <h1 className="titre-ecran">Magasin</h1>
      <p className="sous-titre">
        {Math.round(etat.jauges.ryo)} ryō en poche. Achats et réparations sont instantanés : ils ne comptent pas comme ta décision.
      </p>
      {!ouvert && <p className="mag-ferme">Le magasin t’attend pendant ton temps libre : termine d’abord la scène en cours.</p>}
      {ouvert && etat.annonce && (
        <p className="annonce" role="status">
          {accorder(etat.annonce, p)}
        </p>
      )}
      {rayons.length === 0 && <p className="vide">Rien à vendre pour toi ici pour l’instant.</p>}
      {rayons.map((r) => (
        <section key={r.titre} className="groupe">
          <h3>
            <span className="kanji" aria-hidden="true">
              {r.kanji}{' '}
            </span>
            {r.titre}
          </h3>
          {r.aide && <p>{r.aide}</p>}
          <ul className="mag-liste">
            {r.liste.map((a) => (
              <li key={a.id}>
                <button type="button" className="mag-article" disabled={!ouvert || !a.disponible} onClick={() => onAcheter(a.id)}>
                  <span className="mag-nom">{accorder(a.libelle, p)}</span>
                  <span className="mag-detail">{accorder(a.description, p)}</span>
                  {!a.disponible && a.raison && <span className="mag-raison">{accorder(a.raison, p)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
