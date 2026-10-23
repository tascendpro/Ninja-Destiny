'use client';

// Quand un enfant naît, c'est au joueur de lui donner son nom : le jeu en propose un, du village, qu'on peut changer.

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { valeurJeton } from '../engine/texte';
import { nomValide } from '../engine/moteur';

/** La carte s'affiche tant qu'un enfant n'a pas reçu de nom, hors combat. */
export function doitNommerEnfant(etat: GameState): boolean {
  return !!etat.drapeaux['famille_fondee'] && typeof etat.drapeaux['enfant_nom'] !== 'string' && !['combat', 'affrontement', 'fin'].includes(etat.scene.type);
}

export default function NommerEnfant({ etat, onNommer }: { etat: GameState; onNommer: (nom: string) => void }) {
  const [nom, setNom] = useState(() => valeurJeton(etat, 'enfantNom') ?? '');
  const fille = etat.drapeaux['enfant_genre'] === 'f';
  const valide = nomValide(nom);
  return (
    <form
      className="nommer-enfant"
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) onNommer(valide);
      }}
    >
      <span className="nommer-kanji" aria-hidden="true">
        名
      </span>
      <div className="nommer-corps">
        <label htmlFor="nom-enfant">
          {fille ? 'Ta fille est née.' : 'Ton fils est né.'} Comment {fille ? 's’appelle-t-elle' : 's’appelle-t-il'} ?
        </label>
        <div className="nommer-ligne">
          <input id="nom-enfant" value={nom} maxLength={24} autoComplete="off" onChange={(e) => setNom(e.target.value)} aria-invalid={!valide} />
          <button type="submit" className="btn-principal" disabled={!valide}>
            Nommer
          </button>
        </div>
        {!valide && nom.length > 0 && <small className="nommer-erreur">Des lettres seulement (espaces, tirets et apostrophes permis), 24 au plus.</small>}
      </div>
    </form>
  );
}
