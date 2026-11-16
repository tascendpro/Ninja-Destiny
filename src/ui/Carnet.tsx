'use client';

// Le carnet : tout ce que le personnage garde en mémoire, sous une seule entrée de navigation.
// Le journal de sa vie, le Bingo Book (en solo), et ce qu'il sait du monde.

import { useState } from 'react';
import type { GameState } from '../engine/types';
import type { Meta } from '../engine/sauvegarde';
import Journal from './Journal';
import BingoBook from './BingoBook';
import Encyclopedie from './Encyclopedie';

type Page = 'journal' | 'bingo' | 'savoir';

const PAGES: { id: Page; nom: string; kanji: string; aide: string }[] = [
  { id: 'journal', nom: 'Journal', kanji: '記', aide: 'Ce que tu as vécu' },
  { id: 'bingo', nom: 'Bingo Book', kanji: '賞', aide: 'Les têtes mises à prix' },
  { id: 'savoir', nom: 'Savoir', kanji: '書', aide: 'Ce que tu sais du monde' },
];

export default function Carnet({ etat, meta, sansBingo = false }: { etat: GameState; meta: Meta; sansBingo?: boolean }) {
  const [page, setPage] = useState<Page>('journal');
  const pages = PAGES.filter((x) => !(sansBingo && x.id === 'bingo'));
  return (
    <div className="carnet">
      <nav className="carnet-onglets" role="tablist" aria-label="Carnet">
        {pages.map((x) => (
          <button key={x.id} role="tab" aria-selected={page === x.id} onClick={() => setPage(x.id)}>
            <span className="carnet-kanji" aria-hidden="true">
              {x.kanji}
            </span>
            <span className="carnet-nom">{x.nom}</span>
            <small>{x.aide}</small>
          </button>
        ))}
      </nav>
      {page === 'journal' && <Journal etat={etat} />}
      {page === 'bingo' && !sansBingo && <BingoBook etat={etat} />}
      {page === 'savoir' && <Encyclopedie etat={etat} meta={meta} />}
    </div>
  );
}
