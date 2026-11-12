// Les tableaux : un par type de lieu, composé avec les pinceaux d'encre.tsx. La fenêtre visible est la bande
// y 60–700 (cadrage panoramique) : le ciel en haut, l'horizon vers 470, les plans proches en bas, qui se fondent dans la page.

import type { ReactNode } from 'react';
import type { Ctx } from './encre';
import {
  H,
  L,
  arbreMort,
  astre,
  brume,
  cerisier,
  ciel,
  dome,
  eau,
  eclair,
  etoiles,
  feuillu,
  foretCrete,
  guirlande,
  hameau,
  herbes,
  maison,
  montagnes,
  nuages,
  oiseaux,
  pagode,
  pics,
  pilier,
  pin,
  pont,
  rayons,
  rochers,
  sol,
  sugi,
  toit,
  torii,
  toro,
  tour,
} from './encre';

const f = (v: number) => Math.round(v * 10) / 10;
const k = (c: Ctx) => `p${++c.n}`;

interface Cadre {
  ax: number;
  ay: number;
  sous?: string;
}

/** Les deux plans lointains, séparés par la brume. */
function lointain(c: Ctx, o: { base?: number; pointu?: number; hMax?: number; neige?: boolean } = {}): ReactNode[] {
  const base = o.base ?? 470;
  const hm = o.hMax ?? 220;
  const a = montagnes(c, { base, ps: pics(c.r, 6, hm * 0.4, hm, 170, 340), pointu: o.pointu ?? 0.35, t: 0.03, flou: true, neige: o.neige, rugo: 0.8 });
  const b = montagnes(c, { base: base + 50, ps: pics(c.r, 5, hm * 0.25, hm * 0.7, 160, 300), pointu: (o.pointu ?? 0.35) * 0.8, t: 0.17, neige: o.neige });
  return [a.el, brume(c, base - 70, 130, 0.8, 46), b.el];
}

/** Des dunes en vagues, la crête soulignée de lumière. */
function dunes(c: Ctx, base: number, t: number): ReactNode {
  const nb = 3 + Math.floor(c.r() * 2);
  const pas = (L + 400) / nb;
  let crete = `M-200 ${f(base - c.r() * 40)}`;
  for (let i = 0; i < nb; i++) {
    const x1 = -200 + pas * (i + 0.55) + (c.r() - 0.5) * pas * 0.3;
    const y1 = base - 50 - c.r() * 70;
    crete += ` Q${f(x1)} ${f(y1)} ${f(-200 + pas * (i + 1))} ${f(base - c.r() * 25)}`;
  }
  const gid = `${c.id}${k(c)}`;
  const col = c.p.encre(t);
  return (
    <g key={k(c)}>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={col} />
        <stop offset="1" stopColor={col} stopOpacity={t > 0.8 ? 1 : 0.55} />
      </linearGradient>
      <path d={`${crete} L${L + 200} ${H} L-200 ${H} Z`} fill={`url(#${gid})`} />
      <path d={crete} stroke={c.p.nuit ? c.p.halo : '#fff8ea'} strokeOpacity={c.p.nuit ? 0.22 : 0.7} strokeWidth={2.2} fill="none" />
    </g>
  );
}

/** Une paroi de canyon, à gauche ou à droite, avec ses strates. */
function falaise(c: Ctx, droite: boolean, t: number): ReactNode {
  const m = (x: number) => (droite ? L - x : x);
  const bord = 230 + c.r() * 80;
  const pts: string[] = [`${f(m(-40))} ${H}`, `${f(m(-40))} ${f(250 + c.r() * 40)}`];
  for (let x = 0; x < bord; x += 26) pts.push(`${f(m(x))} ${f(260 + (c.r() - 0.5) * 30)}`);
  for (let y = 270; y < H; y += 34) pts.push(`${f(m(bord + (y - 270) * 0.1 + (c.r() - 0.5) * 24))} ${f(y)}`);
  const strates = Array.from({ length: 7 }, (_, i) => {
    const y = 300 + i * 55 + c.r() * 20;
    return `M${f(m(-40))} ${f(y)} Q${f(m(bord * 0.5))} ${f(y + (c.r() - 0.5) * 18)} ${f(m(bord + (y - 270) * 0.1))} ${f(y + 4)}`;
  });
  return (
    <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
      <path d={`M${pts.join(' L')} Z`} fill={c.p.encre(t)} />
      <path d={strates.join(' ')} stroke={c.p.encre(Math.min(1, t + 0.25))} strokeOpacity={0.35} strokeWidth={2.4} fill="none" />
    </g>
  );
}

/** Un promontoire au bord de la mer ; renvoie son sommet pour y poser une tour ou un pin. */
function promontoire(c: Ctx, droite: boolean, t: number): { el: ReactNode; x: number; y: number } {
  const m = (x: number) => (droite ? L - x : x);
  const sommet = 330 + c.r() * 40;
  const bord = 420 + c.r() * 80;
  const pts: string[] = [`${f(m(-40))} ${H}`, `${f(m(-40))} ${f(sommet)}`];
  for (let x = 0; x < bord - 60; x += 24) pts.push(`${f(m(x))} ${f(sommet + x * 0.06 + (c.r() - 0.5) * 10)}`);
  for (let y = sommet + 30; y < 560; y += 26) pts.push(`${f(m(bord - 40 + (y - sommet) * 0.25 + (c.r() - 0.5) * 22))} ${f(y)}`);
  pts.push(`${f(m(bord + 120))} 560`, `${f(m(bord + 160))} ${H}`);
  return {
    el: (
      <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
        <path d={`M${pts.join(' L')} Z`} fill={c.p.encre(t)} />
      </g>
    ),
    x: m(bord * 0.45),
    y: sommet + bord * 0.45 * 0.06,
  };
}

function bateau(c: Ctx, x: number, y: number, s: number): ReactNode {
  const col = c.p.encre(0.75);
  return (
    <g key={k(c)}>
      <path d={`M${f(x - 50 * s)} ${f(y)} Q${f(x)} ${f(y + 16 * s)} ${f(x + 60 * s)} ${f(y - 6 * s)} L${f(x + 46 * s)} ${f(y + 6 * s)} Q${f(x)} ${f(y + 18 * s)} ${f(x - 42 * s)} ${f(y + 6 * s)} Z`} fill={col} />
      <line x1={f(x)} y1={f(y + 2 * s)} x2={f(x)} y2={f(y - 80 * s)} stroke={col} strokeWidth={2.2} />
      <path d={`M${f(x + 2 * s)} ${f(y - 76 * s)} L${f(x + 44 * s)} ${f(y - 70 * s)} L${f(x + 40 * s)} ${f(y - 10 * s)} L${f(x + 2 * s)} ${f(y - 8 * s)} Z`} fill={c.p.nuit ? c.p.encre(0.35) : '#efe6d2'} stroke={col} strokeWidth={1.4} />
      <path d={`M${f(x + 2 * s)} ${f(y - 56 * s)} H${f(x + 42 * s)} M${f(x + 2 * s)} ${f(y - 36 * s)} H${f(x + 41 * s)}`} stroke={col} strokeWidth={1} opacity={0.6} />
    </g>
  );
}

function cascade(c: Ctx, x: number, y0: number, y1: number): ReactNode {
  return (
    <g key={k(c)} stroke={c.p.nuit ? c.p.brume : '#fffdf7'} fill="none" strokeLinecap="round">
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${f(x + i * 3 - 9)} ${f(y0 + c.r() * 10)} Q${f(x + i * 3 - 9 + (c.r() - 0.5) * 6)} ${f((y0 + y1) / 2)} ${f(x + i * 4 - 14)} ${f(y1)}`} strokeWidth={f(1.5 + c.r() * 2)} opacity={c.p.nuit ? f(0.25 + c.r() * 0.3) : f(0.7 + c.r() * 0.3)} />
      ))}
      <ellipse cx={f(x)} cy={f(y1)} rx={60} ry={14} fill={c.p.nuit ? c.p.brume : '#fffdf7'} stroke="none" opacity={c.p.nuit ? 0.15 : 0.8} />
    </g>
  );
}

function stele(c: Ctx, x: number, yb: number, h: number, t: number): ReactNode {
  const w = h * 0.3;
  return (
    <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
      <path d={`M${f(x)} ${f(yb)} L${f(x + w * 0.05)} ${f(yb - h * 0.9)} Q${f(x + w / 2)} ${f(yb - h * 1.05)} ${f(x + w * 0.95)} ${f(yb - h * 0.88)} L${f(x + w)} ${f(yb)} Z`} fill={c.p.encre(t)} />
      <path d={Array.from({ length: 5 }, (_, i) => `M${f(x + w * 0.5)} ${f(yb - h * 0.78 + i * h * 0.12)} v${f(h * 0.07)}`).join(' ')} stroke={c.p.nuit ? c.p.brume : c.p.encre(0.4)} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function tombe(c: Ctx, x: number, yb: number, h: number, t: number): ReactNode {
  const col = c.p.encre(t);
  const pen = (c.r() - 0.5) * 0.25;
  return (
    <g key={k(c)} transform={`rotate(${f(pen * 40)} ${f(x)} ${f(yb)})`}>
      <rect x={f(x - h * 0.05)} y={f(yb - h)} width={f(h * 0.1)} height={f(h)} fill={col} />
      {c.r() < 0.6 && <rect x={f(x - h * 0.22)} y={f(yb - h * 0.75)} width={f(h * 0.44)} height={f(h * 0.07)} fill={col} />}
    </g>
  );
}

/** Une échoppe : poteaux, comptoir, auvent rayé, rideau (noren). */
function etal(c: Ctx, x: number, yb: number, w: number, t: number): ReactNode {
  const col = c.p.encre(t);
  const h = w * 0.7;
  const rayures = Array.from({ length: 6 }, (_, i) => {
    const x0 = x - 8 + (i * (w + 16)) / 6;
    return <path key={i} d={`M${f(x0)} ${f(yb - h)} L${f(x0 + (w + 16) / 6)} ${f(yb - h)} L${f(x0 + (w + 16) / 6 + 4)} ${f(yb - h + 26)} L${f(x0 + 4)} ${f(yb - h + 26)} Z`} fill={i % 2 ? c.p.vermillon : c.p.nuit ? c.p.encre(0.35) : '#efe4cc'} />;
  });
  return (
    <g key={k(c)}>
      {c.p.nuit && <ellipse cx={f(x + w / 2)} cy={f(yb - h * 0.45)} rx={f(w * 0.7)} ry={f(h * 0.5)} fill={c.p.chaud} opacity={0.1} />}
      <path d={`M${f(x)} ${f(yb)} V${f(yb - h)} M${f(x + w)} ${f(yb)} V${f(yb - h)}`} stroke={col} strokeWidth={5} />
      <rect x={f(x - 4)} y={f(yb - h * 0.38)} width={f(w + 8)} height={f(h * 0.38)} fill={col} />
      <rect x={f(x + w * 0.08)} y={f(yb - h * 0.5)} width={f(w * 0.84)} height={f(h * 0.12)} fill={c.p.fenetre} opacity={c.p.nuit ? 0.55 : 0.5} />
      {rayures}
    </g>
  );
}

function grue(c: Ctx, x: number, yb: number, h: number, t: number): ReactNode {
  const col = c.p.encre(t);
  return (
    <g key={k(c)} stroke={col} fill="none" strokeLinecap="round">
      <path d={`M${f(x)} ${f(yb)} V${f(yb - h)} M${f(x - 30)} ${f(yb)} L${f(x)} ${f(yb - h * 0.4)} L${f(x + 30)} ${f(yb)}`} strokeWidth={6} />
      <path d={`M${f(x - 40)} ${f(yb - h * 0.8)} L${f(x + h * 0.9)} ${f(yb - h * 1.05)}`} strokeWidth={5} />
      <path d={`M${f(x)} ${f(yb - h)} L${f(x + h * 0.9)} ${f(yb - h * 1.05)} M${f(x + h * 0.85)} ${f(yb - h * 1.04)} V${f(yb - h * 0.45)}`} strokeWidth={1.6} />
      <rect x={f(x + h * 0.85 - 18)} y={f(yb - h * 0.45)} width={36} height={26} fill={col} stroke="none" />
    </g>
  );
}

/** Des gradins de carrière, chaque marche éclairée sur le dessus. */
function terrasses(c: Ctx, x0: number, x1: number, yb: number, marches: number, t: number): ReactNode {
  const els: ReactNode[] = [];
  const pas = (x1 - x0) / marches;
  for (let i = 0; i < marches; i++) {
    const x = x0 + i * pas;
    const y = yb - (i + 1) * 46 - c.r() * 10;
    els.push(<path key={i} d={`M${f(x)} ${H} V${f(y)} L${f(x + pas + 30)} ${f(y - 6)} V${H} Z`} fill={c.p.encre(t + i * 0.02)} />);
    els.push(<path key={`d${i}`} d={`M${f(x)} ${f(y)} L${f(x + pas + 30)} ${f(y - 6)}`} stroke={c.p.nuit ? c.p.halo : '#fbf3e2'} strokeOpacity={c.p.nuit ? 0.22 : 0.8} strokeWidth={3} />);
    els.push(<path key={`s${i}`} d={`M${f(x + 6)} ${f(y + 18)} h${f(pas * 0.6)} M${f(x + 12)} ${f(y + 32)} h${f(pas * 0.4)}`} stroke={c.p.encre(Math.min(1, t + 0.3))} strokeOpacity={0.3} strokeWidth={2} />);
  }
  return (
    <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
      {els}
    </g>
  );
}

function arche(c: Ctx, x: number, yb: number, w: number, h: number, t: number): ReactNode {
  return (
    <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
      <path
        d={`M${f(x)} ${f(yb)} L${f(x + w * 0.04)} ${f(yb - h * 0.75)} Q${f(x + w / 2)} ${f(yb - h * 1.3)} ${f(x + w * 0.96)} ${f(yb - h * 0.72)} L${f(x + w)} ${f(yb)} L${f(x + w * 0.76)} ${f(yb)} L${f(x + w * 0.74)} ${f(yb - h * 0.55)} Q${f(x + w / 2)} ${f(yb - h * 0.88)} ${f(x + w * 0.27)} ${f(yb - h * 0.55)} L${f(x + w * 0.25)} ${f(yb)} Z`}
        fill={c.p.encre(t)}
      />
    </g>
  );
}

// ── Les tableaux ─────────────────────────────────────────────

type Peintre = (c: Ctx, o: Cadre) => ReactNode[];

const PEINTRES: Record<string, Peintre> = {
  village_feu: (c, o) => {
    const els = lointain(c, { hMax: 180, pointu: 0.15 });
    els.push(brume(c, 430, 130, 0.8, 40));
    const coll = montagnes(c, { base: 600, ps: pics(c.r, 4, 50, 120, 220, 380), pointu: 0, t: 0.4, rugo: 0.6 });
    els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 24, 30, 58, c.p.encre(0.46), 'rond'));
    const px = 980 + (c.r() - 0.5) * 140;
    els.push(pagode(c, px, 615, 112, o.sous ? 230 : 290, 0.62));
    if (!o.sous) els.push(hameau(c, 260, 1380, 600, 0.68, 9, [px - 30, px + 140]));
    els.push(sol(c, 690, 0.9));
    els.push(cerisier(c, 140 + c.r() * 70, 770, 340, c.p.encre(0.95)));
    els.push(oiseaux(c, 3, o.ax + 170, o.ay + 50));
    return els;
  },
  village_vent: (c, o) => {
    const els: ReactNode[] = [montagnes(c, { base: 520, ps: pics(c.r, 7, 40, 90, 150, 260), pointu: 0, t: 0.06, flou: true, rugo: 0.5, cun: false }).el];
    els.push(brume(c, 470, 90, 0.6));
    els.push(dunes(c, 575, 0.24), dunes(c, 610, 0.4));
    if (!o.sous) {
      const domes = Array.from({ length: 8 }, (_, i) => ({ x: 360 + i * 115 + (c.r() - 0.5) * 50, y: 615 + c.r() * 35, w: 80 + c.r() * 60 }));
      domes.splice(4, 0, { x: 760, y: 610, w: 190 });
      domes.sort((a, b) => a.y - b.y);
      els.push(...domes.map((d) => dome(c, d.x, d.y, d.w, d.w * 0.45, 0.55 + (d.y - 600) / 300)));
    }
    els.push(falaise(c, false, 0.72), falaise(c, true, 0.72));
    els.push(dunes(c, 705, 0.9));
    return els;
  },
  village_brume: (c, o) => {
    const els = lointain(c, { hMax: 200, pointu: 0.25 });
    els.push(brume(c, 390, 170, 1, 38));
    const coll = montagnes(c, { base: 560, ps: pics(c.r, 3, 40, 110, 200, 340), pointu: 0.2, t: 0.36 });
    els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 30, 26, 52, c.p.encre(0.4), 'sugi'));
    els.push(eau(c, 585, o.ax));
    els.push(brume(c, 545, 80, 1, 30));
    if (!o.sous) {
      for (let i = 0; i < 5; i++) {
        const x = 520 + i * 150 + (c.r() - 0.5) * 40;
        const w = 90 + c.r() * 40;
        els.push(<path key={k(c)} d={`M${f(x + 8)} 600 V640 M${f(x + w - 8)} 600 V640 M${f(x + w / 2)} 600 V640`} stroke={c.p.encre(0.7)} strokeWidth={4} />);
        els.push(maison(c, x, 600, w, 36, 0.66));
      }
    }
    els.push(pont(c, 170 + c.r() * 120, 660, 330));
    els.push(herbes(c, -20, 260, 780, 120, c.p.encre(0.95), 40), herbes(c, 1360, 1620, 780, 120, c.p.encre(0.95), 40));
    return els;
  },
  village_foudre: (c, o) => {
    const els = lointain(c, { hMax: 260, pointu: 0.85 });
    els.push(eclair(c, o.ax + (o.ax < 800 ? 360 : -360), 70, 400));
    els.push(nuages(c, 4, 90, 260));
    els.push(brume(c, 420, 120, 0.8));
    const ps = [
      { c: 220 + c.r() * 60, h: 170, w: 210 },
      { c: 540 + c.r() * 60, h: 290, w: 170 },
      { c: 860 + c.r() * 60, h: 350, w: 190 },
      { c: 1180 + c.r() * 60, h: 270, w: 160 },
      { c: 1460, h: 190, w: 220 },
    ];
    const m = montagnes(c, { base: 650, ps, pointu: 0.5, t: 0.48 });
    els.push(m.el);
    if (!o.sous) for (const p of ps.slice(1, 4)) els.push(tour(c, p.c - 40, m.y(p.c) + 30, 80, 120 + c.r() * 50, 0.62));
    els.push(sol(c, 705, 0.92), rochers(c, 60, 740, 260, c.p.encre(0.95)));
    return els;
  },
  village_terre: (c, o) => {
    const els = lointain(c, { hMax: 160, pointu: 0.1 });
    els.push(brume(c, 430, 120, 0.8));
    const sommets: [number, number][] = [];
    const xs = [180, 470, 790, 1080, 1360].map((x) => x + (c.r() - 0.5) * 60);
    xs.forEach((x, i) => {
      const h = 210 + c.r() * 130 - (i === 2 ? 0 : 40);
      const w = 120 + c.r() * 70;
      const pl = pilier(c, x - w / 2, 690, w, h, 0.5 + c.r() * 0.08);
      els.push(pl.el);
      sommets.push([x, pl.haut]);
    });
    if (!o.sous) {
      for (let i = 0; i < sommets.length - 1; i++) {
        const [x1, y1] = sommets[i];
        const [x2, y2] = sommets[i + 1];
        els.push(<path key={k(c)} d={`M${f(x1 + 30)} ${f(y1 + 6)} Q${f((x1 + x2) / 2)} ${f(Math.max(y1, y2) + 50)} ${f(x2 - 30)} ${f(y2 + 6)}`} stroke={c.p.encre(0.75)} strokeWidth={2} fill="none" />);
      }
      for (const [x, y] of sommets.slice(1, 4)) els.push(tour(c, x - 34, y + 4, 68, 90 + c.r() * 40, 0.62));
    }
    els.push(sol(c, 720, 0.92));
    return els;
  },
  foret: (c, o) => {
    const els: ReactNode[] = [];
    [0.06, 0.2, 0.36, 0.52].forEach((t, i) => {
      const base = 455 + i * 60;
      const coll = montagnes(c, { base, ps: pics(c.r, 4, 20, 70, 200, 400), pointu: 0, t, rugo: 0.5, cun: false, flou: i === 0 });
      els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 16 + i * 7, 40 + i * 16, 80 + i * 26, c.p.encre(t), 'sugi'));
      els.push(brume(c, base - 50, 120, 0.85 - i * 0.12, 36 + i * 6));
    });
    els.push(rayons(c, o.ax));
    els.push(tronc_(c, 40 + c.r() * 60, 150), tronc_(c, L - 190 - c.r() * 80, 175));
    els.push(herbes(c, -20, L + 20, 900, 70, c.p.encre(0.92), 90));
    return els;
  },
  desert: (c, o) => {
    const els: ReactNode[] = [montagnes(c, { base: 500, ps: pics(c.r, 4, 30, 80, 200, 340), pointu: 0, t: 0.05, flou: true, rugo: 0.4, cun: false }).el];
    els.push(brume(c, 450, 90, 0.6));
    els.push(dunes(c, 560, 0.2), dunes(c, 600, 0.38));
    els.push(arche(c, 820 + (c.r() - 0.5) * 300, 650, 240, 200, 0.55));
    els.push(dunes(c, 650, 0.6));
    els.push(arbreMort(c, 260 + c.r() * 80, 700, 170, c.p.encre(0.85)));
    els.push(oiseaux(c, 2, o.ax, o.ay + 80));
    els.push(dunes(c, 730, 0.9));
    return els;
  },
  ruines: (c, o) => {
    const els = lointain(c, { hMax: 200 });
    els.push(brume(c, 430, 130, 0.9));
    const coll = montagnes(c, { base: 620, ps: pics(c.r, 4, 30, 90, 240, 400), pointu: 0, t: 0.4, rugo: 0.6 });
    els.push(coll.el);
    const px = 760 + (c.r() - 0.5) * 300;
    els.push(
      <g key={k(c)} transform={`rotate(${f(-3 - c.r() * 4)} ${f(px + 60)} 640)`}>
        {pagode(c, px, 640, 120, 200, 0.6)}
      </g>,
    );
    // Murs effondrés, colonnes tombées, lierre.
    for (let i = 0; i < 4; i++) {
      const x = 200 + i * 340 + (c.r() - 0.5) * 80;
      if (Math.abs(x - px) < 160) continue;
      const w = 120 + c.r() * 100;
      const h = 60 + c.r() * 70;
      let d = `M${f(x)} 660 V${f(660 - h)}`;
      for (let xx = x; xx < x + w; xx += 14) d += ` L${f(xx)} ${f(660 - h * (0.4 + c.r() * 0.6))}`;
      els.push(<path key={k(c)} d={`${d} L${f(x + w)} 660 Z`} fill={c.p.encre(0.62)} filter={`url(#${c.id}pinceau)`} />);
    }
    els.push(<rect key={k(c)} x={f(px + 160)} y={672} width={190} height={22} rx={10} fill={c.p.encre(0.8)} transform={`rotate(${f(8 + c.r() * 8)} ${f(px + 160)} 680)`} />);
    els.push(sol(c, 705, 0.92));
    els.push(herbes(c, -20, L + 20, 760, 70, c.p.encre(0.95), 70), rochers(c, 1150, 750, 260, c.p.encre(0.95)));
    els.push(oiseaux(c, 4, o.ax - 120, o.ay + 70));
    return els;
  },
  cotes: (c, o) => {
    const els: ReactNode[] = [montagnes(c, { base: 478, ps: pics(c.r, 3, 18, 60, 70, 150, 200, 1400), pointu: 0.3, t: 0.07, flou: true, cun: false }).el];
    els.push(eau(c, 478, o.ax));
    els.push(brume(c, 440, 80, 0.8));
    const droite = o.ax < 800;
    const pr = promontoire(c, droite, 0.82);
    els.push(pr.el);
    els.push(tour(c, pr.x - 30, pr.y + 6, 60, 130, 0.86));
    els.push(pin(c, pr.x + (droite ? -150 : 150), pr.y + 14, 190, c.p.encre(0.95), droite ? -1 : 1));
    els.push(bateau(c, droite ? 520 + c.r() * 200 : 900 + c.r() * 200, 560, 1));
    els.push(rochers(c, droite ? 60 : L - 330, 760, 280, c.p.encre(0.95)));
    return els;
  },
  montagne: (c, o) => {
    const els = lointain(c, { hMax: 300, pointu: 0.72, neige: true });
    els.push(nuages(c, 3, 220, 380));
    els.push(brume(c, 430, 130, 1, 40));
    const ps = pics(c.r, 3, 170, 310, 230, 380, 100, 1500);
    const m = montagnes(c, { base: 680, ps, pointu: 0.62, t: 0.5, neige: true });
    els.push(m.el);
    const p = ps[1];
    const cx = p.c + p.w * 0.22;
    els.push(cascade(c, cx, m.y(cx) + 30, 650));
    els.push(brume(c, 600, 90, 1, 30));
    els.push(rochers(c, 40, 760, 260, c.p.encre(0.96)));
    els.push(pin(c, 200, 740, 240, c.p.encre(0.96), 1));
    els.push(oiseaux(c, 2, o.ax + 200, o.ay + 120));
    return els;
  },
  carriere: (c) => {
    const els = lointain(c, { hMax: 160 });
    els.push(brume(c, 430, 120, 0.8));
    els.push(terrasses(c, 520, 1500, 700, 6, 0.42));
    els.push(grue(c, 400, 690, 170, 0.8));
    for (let i = 0; i < 5; i++) els.push(<rect key={k(c)} x={f(150 + i * 70 + c.r() * 30)} y={f(690 - 26 - c.r() * 10)} width={f(40 + c.r() * 30)} height={f(26 + c.r() * 12)} fill={c.p.encre(0.85)} />);
    els.push(sol(c, 712, 0.92));
    return els;
  },
  neige: (c, o) => {
    const els = lointain(c, { hMax: 250, pointu: 0.6, neige: true });
    els.push(brume(c, 430, 120, 0.9));
    const coll = montagnes(c, { base: 620, ps: pics(c.r, 4, 40, 110, 220, 380), pointu: 0.1, t: 0.3, couleur: c.p.neige, cun: false, rugo: 0.5, opaque: true });
    els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 30, 40, 80, c.p.encre(0.6), 'sugi', true, [620, 980]));
    if (!o.sous) {
      const x = 700 + c.r() * 120;
      els.push(maison(c, x, coll.y(x + 60) + 18, 120, 44, 0.7, 1));
    }
    els.push(<ellipse key={k(c)} cx={f(400 + c.r() * 800)} cy={690} rx={300} ry={18} fill={c.p.nuit ? c.p.encre(0.15) : '#e8eef2'} opacity={0.8} />);
    els.push(sol(c, 720, 0.4, c.p.neige));
    els.push(sugi(c, 70, 840, 320, c.p.encre(0.95), true), sugi(c, L - 90, 860, 360, c.p.encre(0.95), true));
    return els;
  },
  marche: (c) => {
    const els = lointain(c, { hMax: 140, pointu: 0.1 });
    els.push(brume(c, 430, 120, 0.8));
    els.push(hameau(c, -40, L + 40, 560, 0.45, 12, undefined, 0.9));
    for (let i = 0; i < 5; i++) els.push(etal(c, 120 + i * 300 + (c.r() - 0.5) * 50, 690, 170 + c.r() * 40, 0.85));
    els.push(guirlande(c, -20, 420, 820, 400, 9), guirlande(c, 780, 400, L + 20, 430, 9), guirlande(c, 300, 470, 1300, 480, 11));
    els.push(sol(c, 712, 0.93));
    return els;
  },
  temple: (c) => {
    const els = lointain(c, { hMax: 210 });
    els.push(brume(c, 420, 140, 0.9));
    const cx = 800 + (c.r() - 0.5) * 100;
    const coll = montagnes(c, { base: 660, ps: [{ c: cx, h: 220, w: 560 }, { c: cx - 620, h: 90, w: 360 }, { c: cx + 620, h: 110, w: 360 }], pointu: 0, t: 0.38, rugo: 0.5 });
    els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 26, 50, 90, c.p.encre(0.42), 'sugi', false, [cx - 200, cx + 200]));
    const ys = coll.y(cx);
    // L'escalier, de la porte au temple.
    const marches = Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      const y = 680 - t * (680 - ys - 6);
      const w = 70 - t * 40;
      return `M${f(cx - w)} ${f(y)} H${f(cx + w)}`;
    });
    els.push(<path key={k(c)} d={`M${f(cx - 70)} 680 L${f(cx - 30)} ${f(ys + 6)} L${f(cx + 30)} ${f(ys + 6)} L${f(cx + 70)} 680 Z`} fill={c.p.nuit ? c.p.encre(0.25) : c.p.encre(0.12)} />);
    els.push(<path key={k(c)} d={marches.join(' ')} stroke={c.p.encre(0.55)} strokeWidth={1.6} />);
    els.push(maison(c, cx - 115, ys + 10, 230, 52, 0.55, 0.8));
    els.push(toit(c, cx - 60, ys - 62, 120, c.p.encre(0.6), 0.3, 0.3));
    els.push(toro(c, cx - 140, 700, 70, 0.8), toro(c, cx + 140, 700, 70, 0.8));
    els.push(torii(c, cx - 105, 712, 210, 170));
    els.push(sugi(c, 80, 880, 460, c.p.encre(0.96)), sugi(c, L - 70, 900, 500, c.p.encre(0.96)));
    return els;
  },
  frontiere: (c, o) => {
    const els = lointain(c, { hMax: 120, pointu: 0.2, base: 500 });
    els.push(brume(c, 460, 110, 0.8));
    els.push(montagnes(c, { base: 610, ps: pics(c.r, 5, 8, 30, 260, 460), pointu: 0, t: 0.32, cun: false, rugo: 0.4 }).el);
    els.push(stele(c, 480 + c.r() * 100, 650, 140, 0.75));
    for (let i = 0; i < 7; i++) els.push(tombe(c, 720 + i * 90 + (c.r() - 0.5) * 50, 640 + c.r() * 25, 50 + c.r() * 30, 0.7));
    els.push(arbreMort(c, 1350 + c.r() * 80, 690, 220, c.p.encre(0.85)));
    els.push(oiseaux(c, 5, o.ax, o.ay + 100));
    els.push(sol(c, 712, 0.9));
    els.push(herbes(c, -20, L + 20, 790, 110, c.p.encre(0.96), 140));
    return els;
  },
  route: (c, o) => {
    const els = lointain(c);
    els.push(brume(c, 430, 130, 0.8));
    const coll = montagnes(c, { base: 600, ps: pics(c.r, 4, 30, 90, 240, 400), pointu: 0, t: 0.38, rugo: 0.5 });
    els.push(coll.el, foretCrete(c, coll.y, -40, L + 40, 38, 26, 50, c.p.encre(0.42), 'rond'));
    els.push(hameau(c, 960, 1180, 588, 0.42, 3, undefined, 0.45));
    els.push(sol(c, 640, 0.75));
    const vx = 1040 + (c.r() - 0.5) * 80;
    els.push(
      <path
        key={k(c)}
        d={`M470 ${H} C680 790, 1010 700, ${f(vx - 4)} 604 L${f(vx + 4)} 604 C1070 700, 840 790, 1180 ${H} Z`}
        fill={c.p.nuit ? c.p.encre(0.12) : '#f4ecdb'}
        opacity={c.p.nuit ? 0.75 : 0.95}
      />,
    );
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const s = 1 - t * 0.75;
      els.push(feuillu(c, 470 - i * 10 + t * 520, 760 - t * 140, 130 * s, c.p.encre(0.85 - t * 0.3)));
      els.push(feuillu(c, 1200 + i * 6 - t * 120, 770 - t * 150, 120 * s, c.p.encre(0.85 - t * 0.3)));
    }
    els.push(
      <g key={k(c)} stroke={c.p.encre(0.92)} strokeLinecap="round">
        <path d="M360 790 V650" strokeWidth={6} />
        <path d="M360 668 L430 660 L444 672 L430 684 L360 684 Z M360 700 L296 694 L284 706 L296 718 L360 716 Z" fill={c.p.encre(0.92)} strokeWidth={1} />
      </g>,
    );
    els.push(herbes(c, -20, L + 20, 830, 90, c.p.encre(0.96), 90));
    els.push(oiseaux(c, 3, o.ax - 200, o.ay + 60));
    return els;
  },
};

function tronc_(c: Ctx, x: number, w: number): ReactNode {
  const pen = (c.r() - 0.5) * 50;
  const col = c.p.encre(0.97);
  const ecorce = Array.from({ length: 7 }, () => {
    const xx = x + w * (0.15 + c.r() * 0.7);
    const y0 = c.r() * 500;
    return `M${f(xx + pen * (1 - y0 / H))} ${f(y0)} Q${f(xx + 8)} ${f(y0 + 120)} ${f(xx + pen * 0.2)} ${f(y0 + 260 + c.r() * 200)}`;
  });
  return (
    <g key={k(c)}>
      <path d={`M${f(x - w * 0.45)} ${H} Q${f(x)} ${H - 40} ${f(x + w * 0.05)} ${H - 140} L${f(x + pen)} -20 L${f(x + w + pen)} -20 L${f(x + w * 0.95)} ${H - 140} Q${f(x + w)} ${H - 40} ${f(x + w * 1.45)} ${H} Z`} fill={col} />
      <path d={ecorce.join(' ')} stroke={c.p.encre(c.p.nuit ? 0.55 : 0.5)} strokeOpacity={0.45} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Ce qui se dresse devant le village pour les variantes de lieu : l'Académie, le terrain, la grande porte. */
function premierPlan(c: Ctx, sous: string): ReactNode[] {
  const els: ReactNode[] = [];
  if (sous === 'academie') {
    els.push(sol(c, 700, 0.88));
    els.push(maison(c, 560, 690, 480, 86, 0.8, 0.8));
    els.push(toit(c, 700, 690 - 86 - 120, 200, c.p.encre(0.88), 0.3, 0.3));
    els.push(<path key={k(c)} d="M1160 690 V430" stroke={c.p.encre(0.9)} strokeWidth={5} />);
    els.push(<path key={k(c)} d="M1163 436 Q1210 444 1250 434 Q1245 458 1250 480 Q1210 490 1163 482 Z" fill={c.p.vermillon} />);
    els.push(feuillu(c, 290, 700, 300, c.p.encre(0.93)));
    els.push(<path key={k(c)} d="M240 520 V640 M300 520 V640 M232 640 H308" stroke={c.p.encre(0.93)} strokeWidth={3} fill="none" />);
    els.push(<path key={k(c)} d="M0 720 H520 M1080 720 H1600 M0 700 H520 M1080 700 H1600" stroke={c.p.encre(0.9)} strokeWidth={3} />);
  } else if (sous === 'terrain') {
    els.push(sol(c, 690, 0.86));
    [520, 760, 1000].forEach((x, i) => {
      const h = 150 + i * 10;
      els.push(
        <g key={k(c)}>
          <rect x={x - 24} y={720 - h} width={48} height={h} fill={c.p.encre(0.9)} />
          <ellipse cx={x} cy={720 - h} rx={24} ry={8} fill={c.p.encre(0.7)} />
          <path d={`M${x - 24} ${720 - h * 0.62} H${x + 24} M${x - 24} ${720 - h * 0.55} H${x + 24}`} stroke={c.p.nuit ? c.p.brume : '#e9dcc0'} strokeOpacity={0.5} strokeWidth={3} />
          <path d={`M${x - 10} ${720 - h * 0.35} l14 -6 M${x + 2} ${720 - h * 0.28} l10 -8`} stroke={c.p.encre(0.4)} strokeWidth={2} />
        </g>,
      );
    });
    els.push(
      <g key={k(c)} fill="none" stroke={c.p.encre(0.9)}>
        <path d="M1240 720 L1270 560 M1340 720 L1310 560" strokeWidth={6} />
        <circle cx={1290} cy={540} r={62} fill={c.p.nuit ? c.p.encre(0.4) : '#efe4cc'} strokeWidth={5} />
        <circle cx={1290} cy={540} r={40} strokeWidth={4} stroke={c.p.vermillon} />
        <circle cx={1290} cy={540} r={14} fill={c.p.vermillon} stroke="none" />
      </g>,
    );
    els.push(feuillu(c, 200, 720, 300, c.p.encre(0.93)));
  } else if (sous === 'porte') {
    const col = c.p.encre(0.88);
    els.push(<rect key={k(c)} x={-20} y={560} width={L + 40} height={200} fill={col} />);
    els.push(<path key={k(c)} d={`M-20 560 H${L + 20}`} stroke={c.p.encre(1)} strokeWidth={10} />);
    els.push(<rect key={k(c)} x={640} y={470} width={320} height={300} fill={c.p.encre(0.15)} />);
    els.push(<path key={k(c)} d={`M640 770 L790 520 L810 520 L960 770 Z`} fill={c.p.nuit ? c.p.horizon : c.p.encre(0.06)} opacity={0.8} />);
    els.push(<rect key={k(c)} x={600} y={400} width={60} height={370} fill={col} />, <rect key={k(c)} x={940} y={400} width={60} height={370} fill={col} />);
    els.push(<rect key={k(c)} x={600} y={440} width={400} height={34} fill={col} />);
    els.push(toit(c, 620, 404, 360, c.p.encre(0.95), 0.22, 0.28));
    els.push(<rect key={k(c)} x={760} y={444} width={80} height={24} fill={c.p.vermillon} />);
    els.push(guirlande(c, 600, 480, 640, 480, 1), guirlande(c, 960, 480, 1000, 480, 1));
    els.push(toro(c, 520, 770, 90, 0.92), toro(c, 1080, 770, 90, 0.92));
  }
  return els;
}

function maisonInterieur(c: Ctx): ReactNode[] {
  const p = c.p;
  const mur = p.nuit ? p.encre(0.55) : '#e2d6bd';
  const bois = p.nuit ? p.encre(0.85) : p.encre(0.7);
  const papier = p.nuit ? '#e8c98d' : '#f7f0e1';
  const gid = `${c.id}shoji`;
  const els: ReactNode[] = [
    <rect key={k(c)} width={L} height={H} fill={mur} />,
    <radialGradient key={k(c)} id={gid} cx="0.5" cy="0.55" r="0.65">
      <stop offset="0" stopColor={papier} stopOpacity={p.nuit ? 0.95 : 1} />
      <stop offset="1" stopColor={papier} stopOpacity={p.nuit ? 0.55 : 0.9} />
    </radialGradient>,
    <rect key={k(c)} x={380} y={120} width={840} height={520} fill={`url(#${gid})`} />,
  ];
  // L'ombre d'un pin sur le papier.
  els.push(<g key={k(c)} opacity={p.nuit ? 0.28 : 0.18}>{pin(c, 1060, 700, 460, p.encre(0.9), -1)}</g>);
  const lattis: string[] = [];
  for (let x = 380; x <= 1220; x += 70) lattis.push(`M${x} 120 V640`);
  for (let y = 120; y <= 640; y += 65) lattis.push(`M380 ${y} H1220`);
  els.push(<path key={k(c)} d={lattis.join(' ')} stroke={bois} strokeWidth={3} />);
  els.push(<path key={k(c)} d="M380 120 V640 M800 120 V640 M1220 120 V640" stroke={bois} strokeWidth={10} />);
  els.push(<rect key={k(c)} x={-10} y={80} width={L + 20} height={40} fill={bois} />);
  // Le tokonoma, son rouleau et son ensō.
  els.push(<rect key={k(c)} x={90} y={150} width={240} height={490} fill={p.nuit ? p.encre(0.7) : '#d6c8aa'} />);
  els.push(<rect key={k(c)} x={160} y={180} width={100} height={330} fill={p.nuit ? '#d9cba8' : '#fbf6ea'} />);
  els.push(<path key={k(c)} d="M150 180 H270 M150 510 H270" stroke={bois} strokeWidth={6} />);
  els.push(<path key={k(c)} d="M210 262 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -60 -18" stroke={p.encre(1)} strokeWidth={7} fill="none" strokeLinecap="round" />);
  els.push(<path key={k(c)} d="M210 330 v26 M210 372 v18 M210 404 v30" stroke={p.encre(1)} strokeWidth={5} strokeLinecap="round" />);
  // L'andon.
  els.push(<circle key={k(c)} cx={1400} cy={520} r={140} fill={p.chaud} opacity={p.nuit ? 0.22 : 0.12} />);
  els.push(<rect key={k(c)} x={1365} y={430} width={70} height={140} fill={p.fenetre} stroke={bois} strokeWidth={4} />);
  els.push(<path key={k(c)} d="M1370 640 V570 M1430 640 V570 M1365 500 H1435" stroke={bois} strokeWidth={4} />);
  // Les tatamis, en perspective.
  els.push(<path key={k(c)} d={`M0 640 H${L} V${H} H0 Z`} fill={p.nuit ? p.encre(0.62) : '#d8c99a'} />);
  const lignes: string[] = [];
  for (let i = -6; i <= 6; i++) lignes.push(`M${800 + i * 120} 640 L${800 + i * 420} ${H}`);
  lignes.push(`M0 720 H${L}`, `M0 820 H${L}`);
  els.push(<path key={k(c)} d={lignes.join(' ')} stroke={p.encre(p.nuit ? 0.9 : 0.6)} strokeOpacity={0.5} strokeWidth={3} />);
  els.push(<path key={k(c)} d="M600 760 H1000 L1040 800 H560 Z M600 800 V850 M1000 800 V850" fill={bois} stroke={bois} strokeWidth={8} />);
  els.push(<path key={k(c)} d="M770 750 q8 -22 30 -22 q22 0 30 22 Z" fill={p.encre(0.4)} />);
  return els;
}

function forgeInterieur(c: Ctx): ReactNode[] {
  const p = c.p;
  const pierre = p.nuit ? p.encre(0.88) : p.encre(0.62);
  const gid = `${c.id}feu`;
  const els: ReactNode[] = [<rect key={k(c)} width={L} height={H} fill={pierre} />];
  const blocs: string[] = [];
  for (let y = 60; y < 700; y += 55) for (let x = (y / 55) % 2 ? 0 : -60; x < L; x += 120) blocs.push(`M${x} ${y} h112 v48 h-112 Z`);
  els.push(<path key={k(c)} d={blocs.join(' ')} fill="none" stroke={p.encre(p.nuit ? 1 : 0.8)} strokeOpacity={0.4} strokeWidth={2} />);
  els.push(
    <radialGradient key={k(c)} id={gid} cx="0.5" cy="0.8" r="0.7">
      <stop offset="0" stopColor="#ffe3a0" />
      <stop offset="0.35" stopColor="#f19a3e" />
      <stop offset="0.8" stopColor="#a8361f" />
      <stop offset="1" stopColor="#3a120c" />
    </radialGradient>,
  );
  els.push(
    <radialGradient key={k(c)} id={`${gid}h`}>
      <stop offset="0" stopColor="#f08a3c" stopOpacity={p.nuit ? 0.34 : 0.24} />
      <stop offset="1" stopColor="#f08a3c" stopOpacity={0} />
    </radialGradient>,
  );
  els.push(<circle key={k(c)} cx={500} cy={600} r={620} fill={`url(#${gid}h)`} />);
  els.push(<path key={k(c)} d="M300 720 V480 Q500 300 700 480 V720 Z" fill={p.encre(1)} />);
  els.push(<path key={k(c)} d="M340 720 V500 Q500 360 660 500 V720 Z" fill={`url(#${gid})`} />);
  const flammes = Array.from({ length: 7 }, (_, i) => {
    const x = 380 + i * 42 + (c.r() - 0.5) * 16;
    const h = 90 + c.r() * 110;
    return `M${f(x - 18)} 720 Q${f(x - 20)} ${f(720 - h * 0.5)} ${f(x + (c.r() - 0.5) * 20)} ${f(720 - h)} Q${f(x + 22)} ${f(720 - h * 0.45)} ${f(x + 18)} 720 Z`;
  });
  els.push(<path key={k(c)} d={flammes.join(' ')} fill="#ffd27a" opacity={0.75} />);
  els.push(<path key={k(c)} d={`M0 720 H${L} V${H} H0 Z`} fill={p.encre(1)} />);
  els.push(<path key={k(c)} d="M900 700 L1260 700 L1220 742 L1130 752 L1150 840 L1010 840 L1030 752 L940 742 Z" fill={p.encre(0.97)} />);
  els.push(<path key={k(c)} d="M1080 694 L1180 640 M1166 626 l30 -16 l14 26 l-30 16 Z" stroke={p.encre(0.97)} strokeWidth={9} fill={p.encre(0.97)} strokeLinecap="round" />);
  els.push(<path key={k(c)} d="M1320 140 H1560 M1360 140 V330 M1430 140 V300 M1500 140 V350 M1350 330 h20 M1420 300 h20 M1488 350 l12 -30 l12 30" stroke={p.encre(0.97)} strokeWidth={6} fill="none" strokeLinecap="round" />);
  els.push(
    <g key={k(c)} fill="#ffd27a">
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={f(500 + (c.r() - 0.3) * 700)} cy={f(260 + c.r() * 420)} r={f(1 + c.r() * 2.4)} opacity={f(0.3 + c.r() * 0.7)} />
      ))}
    </g>,
  );
  return els;
}

/** Le tableau complet d'une scène : ciel, astre, plans, premier plan, brume basse. */
export function peindre(c: Ctx, scene: string): ReactNode[] {
  const [a, b] = scene.split(':');
  const type = b ?? a;
  const sous = b ? a : undefined;
  if (sous === 'maison') return maisonInterieur(c);
  if (sous === 'forge') return forgeInterieur(c);
  const sec = ['village_vent', 'desert', 'carriere', 'marche'].includes(type);
  const ax = 260 + c.r() * 1080;
  const ay = sec ? 330 + c.r() * 40 : 248 + c.r() * 40;
  const els: ReactNode[] = [ciel(c), etoiles(c), astre(c, ax, ay, sec ? 74 : 50), nuages(c, 4, 110, 340)];
  const peintre = PEINTRES[type] ?? PEINTRES.montagne;
  els.push(...peintre(c, { ax, ay, sous }));
  if (sous) els.push(...premierPlan(c, sous));
  els.push(brume(c, 650, 120, 0.6, 56));
  return els;
}

export const TYPES_PEINTS = Object.keys(PEINTRES);
