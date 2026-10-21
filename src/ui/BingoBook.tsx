'use client';

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { vueBingo } from '../engine/bingo';
import type { FicheJoueur, VueFiche } from '../engine/bingo';
import { accorder } from '../engine/texte';

type Liste = 'recherches' | 'legendes' | 'toi';

const LISTES: { id: Liste; nom: string }[] = [
  { id: 'recherches', nom: 'Recherchés' },
  { id: 'legendes', nom: 'Grands ninjas' },
  { id: 'toi', nom: 'Ta fiche' },
];

const prime = (n: number) => (n > 0 ? `${n.toLocaleString('fr-FR')} ryō` : 'Aucune prime');

function Fiche({ f }: { f: VueFiche }) {
  return (
    <article className={`fiche-bingo rang-${f.rang}`}>
      <header className="fb-tete">
        <span className="fb-rang" aria-label={`Rang ${f.rang}`}>
          {f.rang}
        </span>
        <div>
          <h2 className="fb-nom">{f.nom}</h2>
          <p className="fb-surnom">« {f.surnom} »</p>
        </div>
      </header>
      <p className="fb-meta">
        {f.village}
        {f.affiliation && ` · ${f.affiliation}`}
      </p>
      {f.liste === 'recherches' && <p className="fb-prime">{prime(f.prime)}</p>}
      <p>{f.description}</p>
      <p className="fb-techniques">
        <b>Techniques connues :</b> {f.techniques.join(', ')}
      </p>
      <p className="fb-consigne">{f.consigne}</p>
      {f.notes.map((n) => (
        <p key={n} className="fb-note">
          {n}
        </p>
      ))}
    </article>
  );
}

function TaFiche({ f, etat }: { f?: FicheJoueur; etat: GameState }) {
  const p = etat.creation.presentation;
  if (!f) {
    return (
      <p className="sous-titre">
        Ton nom n’est pas encore dans le livre. Les grands exploits l’y inscrivent parmi les grands ninjas ; les crimes, la désertion ou l’Akatsuki l’y inscrivent parmi
        les recherchés, avec une prime.
      </p>
    );
  }
  return (
    <article className={`fiche-bingo toi rang-${f.rang}`}>
      <header className="fb-tete">
        <span className="fb-rang" aria-label={`Rang ${f.rang}`}>
          {f.rang}
        </span>
        <div>
          <h2 className="fb-nom">{f.nom}</h2>
          <p className="fb-surnom">« {accorder(f.surnom, p)} »</p>
        </div>
      </header>
      <p className="fb-meta">
        {accorder(f.village, p)} · {f.liste === 'recherches' ? 'Recherché·e' : 'Inscrit·e parmi les grands ninjas'}
      </p>
      {f.liste === 'recherches' && <p className="fb-prime">{prime(f.prime)}</p>}
      <ul className="fb-exploits">
        {f.exploits.map((e) => (
          <li key={e}>{accorder(e, p)}</li>
        ))}
      </ul>
      {f.crimes.length > 0 && (
        <div className="fb-crimes">
          <b>Crimes</b>
          <ul>
            {f.crimes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {f.techniques.length > 0 && (
        <p className="fb-techniques">
          <b>Techniques connues :</b> {f.techniques.join(', ')}
        </p>
      )}
      <p className="fb-consigne">{f.consigne}</p>
    </article>
  );
}

export default function BingoBook({ etat }: { etat: GameState }) {
  const v = vueBingo(etat);
  const [liste, setListe] = useState<Liste>('recherches');
  const fiches = liste === 'recherches' ? v.recherches : liste === 'legendes' ? v.legendes : [];
  return (
    <div className="colonne">
      <h1 className="titre-ecran">Bingo Book</h1>
      <p className="sous-titre">Le carnet que chaque jōnin garde dans sa veste : les recherchés, leur prime, et les grands ninjas qu’il vaut mieux connaître avant de les croiser.</p>
      <div className="onglets" role="tablist">
        {LISTES.map((l) => (
          <button key={l.id} role="tab" aria-selected={liste === l.id} onClick={() => setListe(l.id)}>
            {l.nom}
            {l.id === 'toi' && v.toi && ' ●'}
          </button>
        ))}
      </div>
      {liste === 'toi' ? (
        <TaFiche f={v.toi} etat={etat} />
      ) : (
        <>
          {fiches.map((f) => (
            <Fiche key={f.id} f={f} />
          ))}
          {liste === 'recherches' && v.toi?.liste === 'recherches' && <TaFiche f={v.toi} etat={etat} />}
          {liste === 'legendes' && v.toi?.liste === 'legendes' && <TaFiche f={v.toi} etat={etat} />}
          {v.scellees > 0 && (
            <p className="sous-titre">
              {v.scellees} {v.scellees > 1 ? 'fiches restent scellées' : 'fiche reste scellée'} : l’histoire ne te les a pas encore révélées.
            </p>
          )}
        </>
      )}
    </div>
  );
}
