'use client';

import { R } from '../engine/registre';

const MOTIFS: Record<string, string> = {
  uchiha: 'M0 -9 A9 9 0 0 1 0 9 Z',
  hyuga: 'M-9 0 Q0 -9 9 0 Q0 9 -9 0 Z',
  nara: 'M-8 6 L0 -8 L8 6 Z',
  yamanaka: 'M0 -9 L3 -3 L9 -3 L4 1 L6 8 L0 4 L-6 8 L-4 1 L-9 -3 L-3 -3 Z',
  akimichi: 'M-8 -8 H8 V8 H-8 Z',
  aburame: 'M-9 0 H9 M0 -9 V9',
  inuzuka: 'M-7 7 L-7 -3 L0 -9 L7 -3 L7 7',
  senju: 'M0 -9 V9 M-7 -3 L0 3 L7 -3',
  uzumaki: 'M0 0 m-6 0 a6 6 0 1 0 12 0 a4 4 0 1 0 -8 0 a2 2 0 1 0 4 0',
  hozuki: 'M-9 3 Q-4 -6 0 3 Q4 -6 9 3',
  kaguya: 'M-6 -9 L6 9 M6 -9 L-6 9',
  yuki: 'M0 -9 V9 M-8 -4 L8 4 M-8 4 L8 -4',
  shirakaze: 'M-9 -2 Q0 -9 9 -2 M-9 4 Q0 -3 9 4',
  raiko: 'M-3 -9 L4 -2 L-2 1 L4 9',
  ishikawa: 'M-9 6 L-3 -6 L3 2 L9 -8',
};

export default function Portrait({
  nom,
  genre,
  village,
  clan,
  taille = 40,
  mort = false,
}: {
  nom: string;
  genre?: 'm' | 'f';
  village?: string;
  clan?: string;
  taille?: number;
  mort?: boolean;
}) {
  const couleur = village ? R.villages[village]?.couleur ?? '#8e98ad' : '#8e98ad';
  const motif = clan ? MOTIFS[clan] : undefined;
  const initiale = nom.trim().charAt(0).toUpperCase();
  return (
    <svg width={taille} height={taille} viewBox="-50 -50 100 100" aria-hidden="true" style={{ filter: mort ? 'grayscale(1) opacity(0.55)' : undefined }}>
      <circle r="47" fill="var(--ardoise-2)" stroke={couleur} strokeWidth="4" />
      <text y="15" textAnchor="middle" fontFamily="var(--mincho)" fontSize="44" fill="var(--papier)">
        {initiale}
      </text>
      {motif && (
        <g transform="translate(28 -28) scale(0.9)">
          <circle r="13" fill="var(--encre)" stroke={couleur} strokeWidth="2" />
          <path d={motif} fill="none" stroke={couleur} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      )}
      {genre === undefined ? null : <title>{nom}</title>}
      {mort && <line x1="-34" y1="34" x2="34" y2="-34" stroke="var(--vermillon)" strokeWidth="4" />}
    </svg>
  );
}
