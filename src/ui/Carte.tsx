'use client';

import { useMemo, useState } from 'react';
import type { GameState, LieuDef } from '../engine/types';
import { R } from '../engine/registre';
import { evaluer } from '../engine/conditions';
import { resoudreLieu } from '../engine/selection';

const PAYS: { nom: string; x: number; y: number; rx: number; ry: number; teinte: number; ile?: boolean }[] = [
  { nom: 'Pays du Feu', x: 560, y: 420, rx: 190, ry: 150, teinte: 110 },
  { nom: 'Pays du Vent', x: 190, y: 480, rx: 165, ry: 150, teinte: 40 },
  { nom: 'Pays de l’Eau', x: 880, y: 470, rx: 90, ry: 120, teinte: 200, ile: true },
  { nom: 'Pays de la Foudre', x: 780, y: 160, rx: 150, ry: 100, teinte: 260 },
  { nom: 'Pays de la Terre', x: 260, y: 170, rx: 170, ry: 110, teinte: 25 },
  { nom: 'Pays du Fer', x: 535, y: 110, rx: 90, ry: 60, teinte: 210 },
  { nom: 'Pays de l’Herbe', x: 405, y: 280, rx: 70, ry: 50, teinte: 85 },
];

function blob(cx: number, cy: number, rx: number, ry: number, graine: number): string {
  let s = graine;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const n = 14;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + r() * 0.3;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  let d = `M${pts[0][0].toFixed(0)} ${pts[0][1].toFixed(0)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[(i + 1) % n];
    const p2 = pts[(i + 2) % n];
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    d += ` Q${p1[0].toFixed(0)} ${p1[1].toFixed(0)} ${mx.toFixed(0)} ${my.toFixed(0)}`;
  }
  return `${d} Z`;
}

export default function Carte({ etat }: { etat: GameState }) {
  const [choisi, setChoisi] = useState<LieuDef | null>(null);
  const lieux = useMemo(
    () => R.contenu.lieux.filter((l) => !l.id.includes('_') || !l.village).filter((l) => etat.decouvertes.includes(`lieu:${l.id}`) || l.village === etat.creation.village),
    [etat.decouvertes, etat.creation.village],
  );
  const missions = R.contenu.missions.filter((m) => etat.missions[m.id] === undefined && evaluer(m.si, etat) && etat.rang !== 'eleve');
  const lieuxMissions = new Set(missions.map((m) => resoudreLieu(etat, m.lieu)));
  const quetes = new Set<string>();
  if (etat.drapeaux['quete_yunagi']) quetes.add('cite_ensevelie');
  if (etat.secrets.includes('sceau_ancien')) quetes.add('temple_oublie');
  const lieuScene = etat.scene.type === 'evenement' ? resoudreLieu(etat, R.evenements[etat.scene.id].lieu) : etat.creation.village;
  const ici = R.lieux[lieuScene]?.village && lieuScene.includes('_') ? R.lieux[lieuScene].village! : lieuScene;

  return (
    <div className="colonne">
      <h1 className="titre-ecran">Carte du monde shinobi</h1>
      <p className="sous-titre">Seuls les lieux que tu connais apparaissent. Touche un point pour en savoir plus.</p>
      <div className="carte">
        <svg viewBox="0 0 1000 700" role="img" aria-label="Carte stylisée du monde shinobi">
          <rect width="1000" height="700" fill="var(--encre-2)" />
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M0 ${40 + i * 38} Q250 ${30 + i * 38} 500 ${44 + i * 38} T1000 ${40 + i * 38}`} stroke="var(--trait)" strokeOpacity="0.35" fill="none" />
          ))}
          {PAYS.map((p, i) =>
            p.ile ? (
              <g key={p.nom}>
                {[0, 1, 2].map((k) => (
                  <path key={k} d={blob(p.x + [-30, 40, 0][k], p.y + [-50, 10, 70][k], p.rx * 0.45, p.ry * 0.35, 17 + i * 7 + k)} fill={`hsl(${p.teinte} 18% 24%)`} stroke="var(--trait)" />
                ))}
                <text x={p.x} y={p.y + 140} textAnchor="middle" fill="var(--brume)" fontSize="16" fontFamily="var(--mincho)">
                  {p.nom}
                </text>
              </g>
            ) : (
              <g key={p.nom}>
                <path d={blob(p.x, p.y, p.rx, p.ry, 31 + i * 13)} fill={`hsl(${p.teinte} 16% 22%)`} stroke="var(--trait)" />
                <text x={p.x} y={p.y + p.ry * 0.75} textAnchor="middle" fill="var(--brume)" fontSize="16" fontFamily="var(--mincho)">
                  {p.nom}
                </text>
              </g>
            ),
          )}
          {lieux.map((l) => {
            const mission = lieuxMissions.has(l.id);
            const quete = quetes.has(l.id);
            const danger = l.danger >= 3;
            const village = !!l.village && !l.id.includes('_');
            return (
              <g key={l.id} className="point" onClick={() => setChoisi(l)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setChoisi(l)} aria-label={l.nom}>
                {danger && <circle cx={l.x} cy={l.y} r={22} fill="var(--vermillon)" opacity="0.18" />}
                {l.id === ici && <circle cx={l.x} cy={l.y} r={16} fill="none" stroke="var(--papier)" strokeWidth="2" />}
                <circle cx={l.x} cy={l.y} r={village ? 9 : 6} fill={quete ? 'var(--glycine)' : mission ? 'var(--or)' : village ? 'var(--papier)' : 'var(--papier-2)'} />
                <text x={l.x + 12} y={l.y - 10} fill="var(--papier)" fontSize={village ? 18 : 13} fontFamily="var(--mincho)">
                  {village ? l.nom : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="sous-titre" style={{ marginTop: 10 }}>
        Point doré : mission disponible. Point violet : quête en cours. Halo rouge : zone dangereuse. Cercle : ta position.
      </p>
      {choisi && (
        <div className="bloc" aria-live="polite">
          <h3>{choisi.nom}</h3>
          <p className="sous-titre">
            {choisi.pays}. {choisi.description}
          </p>
          {missions
            .filter((m) => resoudreLieu(etat, m.lieu) === choisi.id)
            .map((m) => (
              <span className="etiquette or" key={m.id}>
                Mission {m.rang} : {m.titre}
              </span>
            ))}
        </div>
      )}
      {missions.length > 0 && (
        <section className="groupe">
          <h3>Missions disponibles</h3>
          <ul className="liste-simple">
            {missions.map((m) => (
              <li key={m.id}>
                Rang {m.rang} : {m.titre} <span className="sous-titre">({R.lieux[resoudreLieu(etat, m.lieu)]?.nom})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
