'use client';

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { ageA, anneeDe, NOMS_SAISON, saisonDe } from '../engine/calendrier';
import { accorder } from '../engine/texte';

export default function Journal({ etat }: { etat: GameState }) {
  const [tout, setTout] = useState(false);
  const entrees = [...etat.journal].reverse().filter((e) => tout || e.importance >= 2);
  return (
    <div className="colonne">
      <h1 className="titre-ecran">Journal</h1>
      <p className="sous-titre">Ce qui a compté, dans l’ordre où c’est arrivé.</p>
      <div className="segments" role="group" aria-label="Filtre" style={{ margin: '16px 0 8px' }}>
        <button aria-pressed={!tout} onClick={() => setTout(false)}>
          Moments importants
        </button>
        <button aria-pressed={tout} onClick={() => setTout(true)}>
          Tout
        </button>
      </div>
      {entrees.length === 0 && <p className="vide">Ton histoire ne fait que commencer.</p>}
      {entrees.map((e, i) => (
        <div key={i} className={`journal-entree imp${e.importance}`}>
          <time>
            {NOMS_SAISON[saisonDe(e.jour)]} {anneeDe(e.jour)}
            <br />
            {ageA(etat.naissance, e.jour)} ans
          </time>
          <span>{accorder(e.texte, etat.creation.presentation)}</span>
        </div>
      ))}
    </div>
  );
}
