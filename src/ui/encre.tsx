// Le peintre à l'encre : chaque lieu est un lavis en plans superposés. Les montagnes ont un bord de pinceau et se fondent
// dans la brume ; les plans lointains pâlissent ; les arbres, les toits à avant-toits courbes, les torii et les lanternes
// sont dessinés ; le papier a son grain. Tout est tiré d'une graine : un même lieu se peint toujours de la même façon.

import type { ReactNode } from 'react';

export const L = 1600;
export const H = 900;
type Alea = () => number;
const f = (v: number) => Math.round(v * 10) / 10;

export function rng(graine: string): Alea {
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619);
  let t = h >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Palette ─────────────────────────────────────────────────

const TEINTES: Record<string, number> = {
  village_feu: 158,
  village_vent: 30,
  village_brume: 200,
  village_foudre: 258,
  village_terre: 22,
  foret: 150,
  desert: 30,
  ruines: 205,
  cotes: 208,
  montagne: 225,
  carriere: 26,
  neige: 214,
  marche: 20,
  temple: 170,
  frontiere: 188,
  route: 205,
  forge: 20,
};
/** Les lieux secs se peignent au crépuscule : horizon cuivré, astre bas et chaud. */
const CREPUSCULE = ['village_vent', 'desert', 'carriere', 'marche'];

export interface Pal {
  nuit: boolean;
  cielHaut: string;
  cielMi: string;
  horizon: string;
  astre: string;
  halo: string;
  brume: string;
  chaud: string;
  fenetre: string;
  vermillon: string;
  fleur: [string, string];
  neige: string;
  eauHaut: string;
  eauBas: string;
  etoile: string;
  grain: [number, number, number, number];
  /** L'encre d'un plan : 0 le plus lointain (pâle, fondu dans le ciel), 1 le plus proche (noir). */
  encre: (t: number) => string;
}

export function palette(type: string, theme: 'nuit' | 'washi'): Pal {
  const h = TEINTES[type] ?? 210;
  const sec = CREPUSCULE.includes(type);
  if (theme === 'washi') {
    return {
      nuit: false,
      cielHaut: 'hsl(43 46% 94%)',
      cielMi: sec ? 'hsl(36 48% 89%)' : `hsl(${h} 14% 90%)`,
      horizon: sec ? 'hsl(28 52% 82%)' : `hsl(${h} 16% 85%)`,
      astre: '#c0392b',
      halo: '#d8604c',
      brume: '#f7f1e4',
      chaud: '#c98a2a',
      fenetre: '#f1e4c4',
      vermillon: '#b3392c',
      fleur: ['#eba9ba', '#d9839a'],
      neige: '#fbf8f1',
      eauHaut: `hsl(${h} 20% 82%)`,
      eauBas: `hsl(${h} 18% 72%)`,
      etoile: 'transparent',
      grain: [0.32, 0.25, 0.16, 0.16],
      encre: (t) => `hsl(${sec ? 28 : h} ${f(8 + 10 * t)}% ${f(74 - 60 * t)}%)`,
    };
  }
  const he = sec ? 24 : h;
  return {
    nuit: true,
    cielHaut: sec ? 'hsl(252 38% 6%)' : `hsl(${h} 42% 5%)`,
    cielMi: sec ? 'hsl(300 26% 13%)' : `hsl(${h} 32% 11%)`,
    horizon: sec ? 'hsl(20 52% 31%)' : `hsl(${h} 30% 23%)`,
    astre: sec ? '#f1c27c' : '#f2e8c8',
    halo: sec ? '#ea9a50' : '#e8dcb0',
    brume: sec ? 'hsl(25 40% 70%)' : `hsl(${h} 24% 74%)`,
    chaud: '#f3b45e',
    fenetre: '#f7c66f',
    vermillon: '#963226',
    fleur: ['#c07a93', '#94526b'],
    neige: 'hsl(214 26% 78%)',
    eauHaut: `hsl(${h} 30% 15%)`,
    eauBas: `hsl(${h} 38% 6%)`,
    etoile: '#ece6d3',
    grain: [0.92, 0.9, 0.84, 0.07],
    encre: (t) => `hsl(${he} ${f(26 - 12 * t)}% ${f(20 - 16.5 * t)}%)`,
  };
}

// ── Le contexte d'une peinture ──────────────────────────────

export interface Ctx {
  r: Alea;
  p: Pal;
  id: string;
  n: number;
  anime: boolean;
}

const k = (c: Ctx, p = 'e') => `${p}${++c.n}`;

/** Un bruit doux (valeurs interpolées en cosinus) pour que les crêtes respirent. */
function bruit(r: Alea, pas: number): (x: number) => number {
  const v = Array.from({ length: Math.ceil((L + 800) / pas) + 3 }, () => r() * 2 - 1);
  return (x) => {
    const t = (x + 400) / pas;
    const i = Math.max(0, Math.min(v.length - 2, Math.floor(t)));
    const s = (1 - Math.cos((t - i) * Math.PI)) / 2;
    return v[i] * (1 - s) + v[i + 1] * s;
  };
}

export interface Pic {
  c: number;
  h: number;
  w: number;
}

export function pics(r: Alea, n: number, hMin: number, hMax: number, wMin: number, wMax: number, x0 = -150, x1 = L + 150): Pic[] {
  const pas = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => ({ c: x0 + pas * (i + 0.5) + (r() - 0.5) * pas * 0.7, h: hMin + r() * (hMax - hMin), w: wMin + r() * (wMax - wMin) }));
}

function crete(r: Alea, base: number, ps: Pic[], pointu: number, rugo: number) {
  const n1 = bruit(r, 110);
  const n2 = bruit(r, 26);
  const hMax = Math.max(1, ...ps.map((p) => p.h));
  const y = (x: number) => {
    let m = 0;
    for (const p of ps) {
      const d = Math.abs(x - p.c) / p.w;
      if (d < 1) {
        const cloche = (Math.cos(d * Math.PI) + 1) / 2;
        const pointe = Math.pow(1 - d, 1.6);
        m = Math.max(m, p.h * (cloche * (1 - pointu) + pointe * pointu));
      }
    }
    return base - m - rugo * (n1(x) * 13 + n2(x) * 4) * (0.35 + m / hMax);
  };
  let d = `M-60 ${H} L-60 ${f(y(-60))}`;
  for (let x = -54; x <= L + 60; x += 6) d += ` L${x} ${f(y(x))}`;
  d += ` L${L + 60} ${H} Z`;
  return { d, y, hMax };
}

// ── Les plans ───────────────────────────────────────────────

export interface OptsMont {
  base: number;
  ps: Pic[];
  t: number;
  pointu?: number;
  rugo?: number;
  cun?: boolean;
  neige?: boolean;
  flou?: boolean;
  opaque?: boolean;
  couleur?: string;
}

/** Un plan de montagnes au lavis : l'encre est dense sur la crête et se dilue vers le bas. */
export function montagnes(c: Ctx, o: OptsMont): { el: ReactNode; y: (x: number) => number } {
  const cr = crete(c.r, o.base, o.ps, o.pointu ?? 0.3, o.rugo ?? 1);
  const col = o.couleur ?? c.p.encre(o.t);
  const gid = c.id + k(c, 'm');
  const fin = o.opaque ? 1 : 0.1 + o.t * 0.6;
  const el: ReactNode[] = [
    <linearGradient key={k(c)} id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={f(o.base - cr.hMax)} x2="0" y2={o.base + 70}>
      <stop offset="0" stopColor={col} />
      <stop offset="0.6" stopColor={col} stopOpacity={0.97} />
      <stop offset="1" stopColor={col} stopOpacity={fin} />
    </linearGradient>,
    <path key={k(c)} d={cr.d} fill={`url(#${gid})`} />,
  ];
  if (o.neige) {
    for (const p of o.ps) {
      if (p.h < cr.hMax * 0.5) continue;
      const xa = p.c - p.w * 0.34;
      const xb = p.c + p.w * 0.34;
      let d = `M${f(xa)} ${f(cr.y(xa))}`;
      for (let x = xa; x <= xb; x += 6) d += ` L${f(x)} ${f(cr.y(x) - 1)}`;
      for (let x = xb; x >= xa; x -= 9) {
        const prox = 1 - Math.abs(x - p.c) / (p.w * 0.34);
        d += ` L${f(x)} ${f(cr.y(x) + p.h * (0.05 + 0.24 * prox) * (0.5 + c.r()))}`;
      }
      el.push(<path key={k(c)} d={`${d} Z`} fill={c.p.neige} opacity={o.t < 0.1 ? 0.5 : o.t < 0.3 ? 0.72 : 0.9} />);
    }
  }
  if (o.cun !== false) {
    // Les rides du pinceau (cun) : quelques traits qui descendent des sommets.
    const traits: string[] = [];
    for (const p of o.ps) {
      if (p.h < 45) continue;
      const nb = 2 + Math.floor(c.r() * 3);
      for (let i = 0; i < nb; i++) {
        const x0 = p.c + (c.r() - 0.5) * p.w * 0.3;
        const y0 = cr.y(x0) + 5;
        const sens = c.r() < 0.5 ? -1 : 1;
        const x1 = x0 + sens * p.w * (0.2 + 0.4 * c.r());
        const y1 = Math.min(o.base, y0 + p.h * (0.4 + 0.45 * c.r()));
        traits.push(`M${f(x0)} ${f(y0)} Q${f(x0 + sens * p.w * 0.07)} ${f((y0 + y1) / 2)} ${f(x1)} ${f(y1)}`);
      }
    }
    if (traits.length)
      el.push(<path key={k(c)} d={traits.join(' ')} stroke={c.p.encre(Math.min(1, o.t + 0.32))} strokeWidth={f(1.3 + o.t * 2.2)} strokeOpacity={c.p.nuit ? 0.38 : 0.3} fill="none" strokeLinecap="round" />);
  }
  const g = (
    <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
      {el}
    </g>
  );
  return {
    el: o.flou ? (
      <g key={k(c)} filter={`url(#${c.id}flou)`}>
        {g}
      </g>
    ) : (
      g
    ),
    y: cr.y,
  };
}

/** Un sol bas et opaque, au premier plan. */
export function sol(c: Ctx, base: number, t: number, couleur?: string): ReactNode {
  return montagnes(c, { base, ps: pics(c.r, 5, 6, 30, 260, 460), pointu: 0, t, opaque: true, cun: false, rugo: 0.35, couleur }).el;
}

/** Une bande de brume, avec ses volutes ; elle dérive lentement si les animations sont permises. */
export function brume(c: Ctx, y: number, h: number, niveau: number, duree = 44): ReactNode {
  const gid = c.id + k(c, 'b');
  const a = c.p.nuit ? niveau * 0.2 : niveau * 0.8;
  return (
    <g key={k(c)}>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.p.brume} stopOpacity={0} />
        <stop offset="0.5" stopColor={c.p.brume} stopOpacity={a} />
        <stop offset="1" stopColor={c.p.brume} stopOpacity={0} />
      </linearGradient>
      <g className={c.anime ? 'brume-anim' : undefined} style={{ animationDuration: `${duree}s` }}>
        <rect x={-300} y={f(y)} width={L + 600} height={f(h)} fill={`url(#${gid})`} />
        {Array.from({ length: 4 }, (_, i) => (
          <ellipse key={i} cx={f(c.r() * L)} cy={f(y + h * (0.3 + 0.4 * c.r()))} rx={f(170 + c.r() * 260)} ry={f(4 + c.r() * 9)} fill={c.p.brume} opacity={f(a * 0.9)} />
        ))}
      </g>
    </g>
  );
}

export function ciel(c: Ctx): ReactNode {
  const gid = c.id + 'ciel';
  return (
    <g key={k(c)}>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.p.cielHaut} />
        <stop offset="0.3" stopColor={c.p.cielMi} />
        <stop offset="0.56" stopColor={c.p.horizon} />
        <stop offset="1" stopColor={c.p.horizon} />
      </linearGradient>
      <rect width={L} height={H} fill={`url(#${gid})`} />
    </g>
  );
}

export function etoiles(c: Ctx): ReactNode {
  if (!c.p.nuit) return null;
  return (
    <g key={k(c)} fill={c.p.etoile}>
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={f(c.r() * L)} cy={f(50 + Math.pow(c.r(), 1.5) * 330)} r={f(0.5 + c.r() * 1.3)} opacity={f(0.2 + c.r() * 0.6)} />
      ))}
    </g>
  );
}

/** La lune (ou le soleil rouge sur le papier), son halo, et les ombres de sa surface. */
export function astre(c: Ctx, x: number, y: number, rayon: number): ReactNode {
  const hid = c.id + k(c, 'h');
  const did = c.id + k(c, 'd');
  const p = c.p;
  return (
    <g key={k(c)}>
      <radialGradient id={hid}>
        <stop offset="0" stopColor={p.halo} stopOpacity={p.nuit ? 0.34 : 0.2} />
        <stop offset="0.3" stopColor={p.halo} stopOpacity={p.nuit ? 0.1 : 0.06} />
        <stop offset="1" stopColor={p.halo} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={did} cx="0.4" cy="0.38">
        <stop offset="0" stopColor={p.nuit ? '#fffbf0' : '#d4473a'} />
        <stop offset="1" stopColor={p.astre} />
      </radialGradient>
      <circle cx={f(x)} cy={f(y)} r={f(rayon * 6)} fill={`url(#${hid})`} />
      <circle cx={f(x)} cy={f(y)} r={f(rayon)} fill={`url(#${did})`} opacity={p.nuit ? 0.97 : 0.9} />
      {p.nuit &&
        [0, 1, 2, 3].map((i) => <circle key={i} cx={f(x + (c.r() - 0.5) * rayon * 1.1)} cy={f(y + (c.r() - 0.5) * rayon * 1.1)} r={f(rayon * (0.1 + c.r() * 0.2))} fill={p.encre(0.2)} opacity={0.07} />)}
    </g>
  );
}

/** Des nuages en longues traînées, comme des coups de pinceau secs. */
export function nuages(c: Ctx, n: number, yMin: number, yMax: number): ReactNode {
  return (
    <g key={k(c)} fill={c.p.nuit ? c.p.brume : '#fffcf4'}>
      {Array.from({ length: n }, (_, i) => {
        const x = c.r() * L;
        const y = yMin + c.r() * (yMax - yMin);
        const w = 160 + c.r() * 320;
        return (
          <g key={i} opacity={c.p.nuit ? f(0.05 + c.r() * 0.08) : f(0.45 + c.r() * 0.3)}>
            <ellipse cx={f(x)} cy={f(y)} rx={f(w)} ry={f(6 + c.r() * 8)} />
            <ellipse cx={f(x + w * 0.3)} cy={f(y - 7)} rx={f(w * 0.45)} ry={f(5 + c.r() * 5)} />
          </g>
        );
      })}
    </g>
  );
}

export function oiseaux(c: Ctx, n: number, x: number, y: number): ReactNode {
  return (
    <g key={k(c)} stroke={c.p.encre(0.8)} strokeWidth={1.8} fill="none" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const bx = x + (c.r() - 0.5) * 240;
        const by = y + (c.r() - 0.5) * 90;
        const s = 5 + c.r() * 6;
        return <path key={i} d={`M${f(bx - s)} ${f(by - s * 0.3)} Q${f(bx - s * 0.45)} ${f(by - s * 0.8)} ${f(bx)} ${f(by)} Q${f(bx + s * 0.45)} ${f(by - s * 0.8)} ${f(bx + s)} ${f(by - s * 0.3)}`} />;
      })}
    </g>
  );
}

export function herbes(c: Ctx, x0: number, x1: number, yb: number, h: number, col: string, n: number): ReactNode {
  const brins = Array.from({ length: n }, () => {
    const x = x0 + c.r() * (x1 - x0);
    const hh = h * (0.4 + c.r() * 0.8);
    const pen = (c.r() - 0.4) * hh * 0.55;
    return `M${f(x)} ${yb} Q${f(x + pen * 0.25)} ${f(yb - hh * 0.6)} ${f(x + pen)} ${f(yb - hh)}`;
  });
  return <path key={k(c)} d={brins.join(' ')} stroke={col} strokeWidth={2.2} fill="none" strokeLinecap="round" />;
}

/** L'eau : un dégradé, le reflet de l'astre en traits brisés, et des rides. */
export function eau(c: Ctx, y: number, ax: number): ReactNode {
  const gid = c.id + k(c, 'w');
  return (
    <g key={k(c)}>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.p.eauHaut} />
        <stop offset="1" stopColor={c.p.eauBas} />
      </linearGradient>
      <rect x={-10} y={f(y)} width={L + 20} height={f(H - y)} fill={`url(#${gid})`} />
      <g stroke={c.p.astre} strokeLinecap="round">
        {Array.from({ length: 16 }, (_, i) => {
          const w = (46 - i * 2.2) * (0.5 + c.r() * 0.9);
          const cx = ax + (c.r() - 0.5) * (8 + i * 3);
          return <line key={i} x1={f(cx - w)} x2={f(cx + w)} y1={f(y + 7 + i * 9)} y2={f(y + 7 + i * 9)} strokeWidth={2.2} opacity={f(Math.max(0.04, (c.p.nuit ? 0.6 : 0.45) - i * 0.035))} />;
        })}
      </g>
      <g stroke={c.p.nuit ? c.p.brume : c.p.encre(0.5)} strokeWidth={1.4} fill="none" opacity={c.p.nuit ? 0.16 : 0.3} strokeLinecap="round">
        {Array.from({ length: 46 }, (_, i) => {
          const x = c.r() * L;
          const yy = y + 12 + Math.pow(c.r(), 0.8) * (H - y - 40);
          const w = 14 + (yy - y) * 0.12 + c.r() * 20;
          return <path key={i} d={`M${f(x - w)} ${f(yy)} Q${f(x)} ${f(yy - 4)} ${f(x + w)} ${f(yy)}`} />;
        })}
      </g>
    </g>
  );
}

// ── Les arbres ──────────────────────────────────────────────

/** Un cèdre (sugi) : des étages de branches qui s'élargissent vers le bas. */
export function sugi(c: Ctx, x: number, yb: number, h: number, col: string, neige = false): ReactNode {
  const w = h * (0.3 + c.r() * 0.12);
  const etages = 6 + Math.floor(c.r() * 3);
  const D: string[] = [];
  const G: string[] = [];
  const bouts: [number, number][] = [];
  for (let i = 1; i <= etages; i++) {
    const t = i / etages;
    const yi = yb - h + h * 0.88 * t;
    const lg = (w / 2) * Math.pow(t, 0.8) * (0.8 + c.r() * 0.4);
    const lg2 = (w / 2) * Math.pow(t, 0.8) * (0.8 + c.r() * 0.4);
    D.push(`L${f(x + lg)} ${f(yi + h * 0.035)} L${f(x + lg * 0.3)} ${f(yi)}`);
    G.unshift(`L${f(x - lg2 * 0.3)} ${f(yi)} L${f(x - lg2)} ${f(yi + h * 0.035)}`);
    bouts.push([x + lg * 0.75, yi + h * 0.015], [x - lg2 * 0.75, yi + h * 0.015]);
  }
  const tr = Math.max(1.5, h * 0.022);
  const d = `M${f(x)} ${f(yb - h)} ${D.join(' ')} L${f(x + tr)} ${f(yb - h * 0.1)} L${f(x + tr)} ${f(yb)} L${f(x - tr)} ${f(yb)} L${f(x - tr)} ${f(yb - h * 0.1)} ${G.join(' ')} Z`;
  return (
    <g key={k(c)}>
      <path d={d} fill={col} />
      {neige &&
        bouts.filter(() => c.r() < 0.7).map(([bx, by], i) => <ellipse key={i} cx={f(bx)} cy={f(by)} rx={f(h * 0.06)} ry={f(h * 0.016)} fill={c.p.neige} opacity={0.92} />)}
    </g>
  );
}

/** Un pin (matsu) : un tronc qui ploie, des branches horizontales, des coussins d'aiguilles. */
export function pin(c: Ctx, x: number, yb: number, h: number, col: string, sens: 1 | -1): ReactNode {
  const tx = x + sens * h * (0.25 + 0.2 * c.r());
  const ty = yb - h;
  const cx1 = x - sens * h * 0.18;
  const cy1 = yb - h * 0.5;
  const P = (t: number): [number, number] => [(1 - t) ** 2 * x + 2 * (1 - t) * t * cx1 + t * t * tx, (1 - t) ** 2 * yb + 2 * (1 - t) * t * cy1 + t * t * ty];
  const g: string[] = [];
  const d: string[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const [px, py] = P(t);
    const w = h * (0.045 * (1 - t) + 0.01);
    g.push(`${f(px - w)} ${f(py)}`);
    d.unshift(`${f(px + w)} ${f(py)}`);
  }
  const branches: string[] = [];
  const coussins: ReactNode[] = [];
  [0.4, 0.58, 0.76, 0.92, 1].forEach((t, i) => {
    const [px, py] = P(t);
    const cote = (i % 2 === 0 ? 1 : -1) * sens;
    const lg = i === 4 ? 0 : h * (0.16 + 0.16 * c.r());
    const bx = px + cote * lg;
    const by = py - h * 0.05;
    if (lg) branches.push(`M${f(px)} ${f(py)} Q${f(px + cote * lg * 0.5)} ${f(py + h * 0.02)} ${f(bx)} ${f(by)}`);
    const n = i === 4 ? 5 : 4;
    for (let j = 0; j < n; j++) {
      coussins.push(<ellipse key={coussins.length} cx={f(bx + (j - (n - 1) / 2) * h * 0.075 + (c.r() - 0.5) * h * 0.03)} cy={f(by - h * 0.015 + (c.r() - 0.5) * h * 0.03)} rx={f(h * (0.07 + 0.04 * c.r()))} ry={f(h * (0.028 + 0.016 * c.r()))} />);
    }
  });
  return (
    <g key={k(c)} fill={col}>
      <path d={`M${g.join(' L')} L${d.join(' L')} Z`} />
      <path d={branches.join(' ')} stroke={col} strokeWidth={f(h * 0.016)} fill="none" strokeLinecap="round" />
      {coussins}
    </g>
  );
}

/** Branches qui se divisent, au pinceau ; les bouts servent aux fleurs. */
function ramure(c: Ctx, x: number, yb: number, h: number, prof: number, ecart = 0.42): { d: { d: string; w: number }[]; bouts: [number, number][] } {
  const traits: { d: string; w: number }[] = [];
  const bouts: [number, number][] = [];
  const pousse = (x0: number, y0: number, ang: number, lg: number, ep: number, n: number) => {
    const x1 = x0 + Math.cos(ang) * lg;
    const y1 = y0 + Math.sin(ang) * lg;
    const cx = (x0 + x1) / 2 + (c.r() - 0.5) * lg * 0.3;
    const cy = (y0 + y1) / 2 + (c.r() - 0.5) * lg * 0.3;
    traits.push({ d: `M${f(x0)} ${f(y0)} Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`, w: ep });
    if (n <= 0) {
      bouts.push([x1, y1]);
      return;
    }
    pousse(x1, y1, ang - ecart - c.r() * 0.3, lg * (0.66 + c.r() * 0.12), ep * 0.62, n - 1);
    pousse(x1, y1, ang + ecart * 0.8 + c.r() * 0.3, lg * (0.66 + c.r() * 0.12), ep * 0.62, n - 1);
  };
  pousse(x, yb, -Math.PI / 2 + (c.r() - 0.5) * 0.35, h * 0.36, h * 0.06, prof);
  return { d: traits, bouts };
}

export function cerisier(c: Ctx, x: number, yb: number, h: number, col: string): ReactNode {
  const { d, bouts } = ramure(c, x, yb, h, 3);
  const fleurs: ReactNode[] = [];
  for (const [bx, by] of bouts) {
    for (let i = 0; i < 13; i++) {
      const a = c.r() * Math.PI * 2;
      const rr = Math.sqrt(c.r()) * h * 0.13;
      fleurs.push(<circle key={fleurs.length} cx={f(bx + Math.cos(a) * rr)} cy={f(by + Math.sin(a) * rr * 0.75)} r={f(h * (0.018 + c.r() * 0.028))} fill={c.p.fleur[c.r() < 0.6 ? 0 : 1]} opacity={f(0.55 + c.r() * 0.4)} />);
    }
  }
  return (
    <g key={k(c)}>
      {d.map((t, i) => (
        <path key={i} d={t.d} stroke={col} strokeWidth={f(t.w)} fill="none" strokeLinecap="round" />
      ))}
      {fleurs}
    </g>
  );
}

export function arbreMort(c: Ctx, x: number, yb: number, h: number, col: string): ReactNode {
  const { d } = ramure(c, x, yb, h, 4, 0.5);
  return (
    <g key={k(c)}>
      {d.map((t, i) => (
        <path key={i} d={t.d} stroke={col} strokeWidth={f(Math.max(1, t.w * 0.7))} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Un feuillu : un tronc court et une couronne en grappes. */
export function feuillu(c: Ctx, x: number, yb: number, h: number, col: string): ReactNode {
  return (
    <g key={k(c)} fill={col}>
      <path d={`M${f(x - h * 0.035)} ${f(yb)} L${f(x - h * 0.02)} ${f(yb - h * 0.5)} L${f(x + h * 0.02)} ${f(yb - h * 0.5)} L${f(x + h * 0.035)} ${f(yb)} Z`} />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={f(x + (c.r() - 0.5) * h * 0.5)} cy={f(yb - h * 0.62 + (c.r() - 0.5) * h * 0.3)} r={f(h * (0.13 + c.r() * 0.11))} />
      ))}
    </g>
  );
}

/** Une rangée d'arbres posée sur une crête, en évitant une zone. */
export function foretCrete(c: Ctx, y: (x: number) => number, x0: number, x1: number, pas: number, hMin: number, hMax: number, col: string, sorte: 'sugi' | 'rond', neige = false, evite?: [number, number]): ReactNode {
  const arbres: ReactNode[] = [];
  for (let x = x0; x < x1; x += pas * (0.5 + c.r())) {
    if (evite && x > evite[0] && x < evite[1]) continue;
    const h = hMin + c.r() * (hMax - hMin);
    const yb = y(x) + h * 0.14;
    arbres.push(sorte === 'sugi' ? sugi(c, x, yb, h, col, neige) : feuillu(c, x, yb, h * 0.8, col));
  }
  return <g key={k(c)}>{arbres}</g>;
}

/** Un tronc immense au premier plan, avec son écorce et ses racines. */
export function tronc(c: Ctx, x: number, w: number, col: string): ReactNode {
  const pen = (c.r() - 0.5) * 60;
  const d = `M${f(x - w * 0.5)} ${H} Q${f(x)} ${H - 40} ${f(x + w * 0.05)} ${H - 120} L${f(x + pen)} -20 L${f(x + w + pen)} -20 L${f(x + w * 0.95)} ${H - 120} Q${f(x + w)} ${H - 40} ${f(x + w * 1.5)} ${H} Z`;
  const ecorce = Array.from({ length: 7 }, () => {
    const xx = x + w * (0.15 + c.r() * 0.7);
    const y0 = c.r() * 500;
    return `M${f(xx + pen * (1 - y0 / H))} ${f(y0)} Q${f(xx + 8)} ${f(y0 + 120)} ${f(xx + pen * 0.2)} ${f(y0 + 260 + c.r() * 200)}`;
  });
  return (
    <g key={k(c)}>
      <path d={d} fill={col} />
      <path d={ecorce.join(' ')} stroke={c.p.nuit ? c.p.encre(0.6) : c.p.encre(0.55)} strokeOpacity={0.5} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>
  );
}

// ── L'architecture ──────────────────────────────────────────

/** Un toit à avant-toits relevés : la ligne d'égout se creuse, les rives montent en courbe vers le faîtage. */
export function toit(c: Ctx, x: number, ye: number, w: number, col: string, debord = 0.18, hr = 0.34): ReactNode {
  const cx = x + w / 2;
  const xl = x - w * debord;
  const xr = x + w + w * debord;
  const h = w * hr;
  const up = h * 0.2;
  const d = `M${f(xl)} ${f(ye - up)} Q${f(cx)} ${f(ye + h * 0.12)} ${f(xr)} ${f(ye - up)} Q${f(xr - w * 0.24)} ${f(ye - h * 0.2)} ${f(cx + w * 0.3)} ${f(ye - h)} L${f(cx - w * 0.3)} ${f(ye - h)} Q${f(xl + w * 0.24)} ${f(ye - h * 0.2)} ${f(xl)} ${f(ye - up)} Z`;
  const fai = `M${f(cx - w * 0.38)} ${f(ye - h - 5)} Q${f(cx - w * 0.33)} ${f(ye - h - 1)} ${f(cx - w * 0.28)} ${f(ye - h - 2)} L${f(cx + w * 0.28)} ${f(ye - h - 2)} Q${f(cx + w * 0.33)} ${f(ye - h - 1)} ${f(cx + w * 0.38)} ${f(ye - h - 5)}`;
  return (
    <g key={k(c)}>
      <path d={d} fill={col} />
      <path d={fai} stroke={col} strokeWidth={f(Math.max(2, w * 0.035))} fill="none" strokeLinecap="round" />
    </g>
  );
}

function fenetre(c: Ctx, x: number, y: number, w: number, h: number, t: number, allumee: boolean): ReactNode {
  const cadre = c.p.encre(Math.min(1, t + 0.1));
  return (
    <g key={k(c)}>
      {allumee && c.p.nuit && <ellipse cx={f(x + w / 2)} cy={f(y + h / 2)} rx={f(w * 1.8)} ry={f(h * 1.4)} fill={c.p.chaud} opacity={0.13} />}
      <rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} fill={allumee ? c.p.fenetre : cadre} opacity={allumee ? 0.95 : 0.9} />
      <path d={`M${f(x + w / 2)} ${f(y)} V${f(y + h)} M${f(x)} ${f(y + h / 2)} H${f(x + w)}`} stroke={cadre} strokeWidth={1.3} />
    </g>
  );
}

/** Une maison : murs, poteaux, fenêtres de papier (allumées la nuit), et son toit. */
export function maison(c: Ctx, x: number, yb: number, w: number, hm: number, t: number, allume = 0.65): ReactNode {
  const mur = c.p.encre(Math.max(0, t - 0.12));
  const sombre = c.p.encre(Math.min(1, t + 0.06));
  const nf = Math.max(1, Math.floor(w / 46));
  return (
    <g key={k(c)}>
      <rect x={f(x)} y={f(yb - hm)} width={f(w)} height={f(hm)} fill={mur} />
      <path d={Array.from({ length: nf + 1 }, (_, i) => `M${f(x + (i * w) / nf)} ${f(yb - hm)} V${f(yb)}`).join(' ')} stroke={sombre} strokeWidth={2.4} />
      {Array.from({ length: nf }, (_, i) => fenetre(c, x + ((i + 0.25) * w) / nf, yb - hm * 0.78, (w / nf) * 0.5, hm * 0.46, t, c.r() < allume))}
      <rect x={f(x - 2)} y={f(yb - 3)} width={f(w + 4)} height={5} fill={sombre} />
      {toit(c, x, yb - hm, w, sombre)}
    </g>
  );
}

/** Un groupe de maisons, des plus lointaines aux plus proches, en évitant une zone. */
export function hameau(c: Ctx, x0: number, x1: number, yb: number, t: number, n: number, evite?: [number, number], echelle = 1): ReactNode {
  const maisons: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < n * 3 && maisons.length < n; i++) {
    const w = (78 + c.r() * 70) * echelle;
    const x = x0 + c.r() * (x1 - x0 - w);
    if (evite && x + w > evite[0] && x < evite[1]) continue;
    maisons.push({ x, y: yb + c.r() * 30 * echelle, w, h: (32 + c.r() * 18) * echelle });
  }
  maisons.sort((a, b) => a.y - b.y);
  return <g key={k(c)}>{maisons.map((m) => maison(c, m.x, m.y, m.w, m.h, t + (m.y - yb) / 300))}</g>;
}

/** Une pagode : des étages qui rétrécissent, chacun sous son toit, et la flèche à anneaux. */
export function pagode(c: Ctx, x: number, yb: number, w: number, h: number, t: number): ReactNode {
  const n = h > 250 ? 5 : 4;
  const e = (h * 0.8) / n;
  const col = c.p.encre(Math.min(1, t + 0.06));
  const mur = c.p.encre(Math.max(0, t - 0.1));
  const els: ReactNode[] = [];
  let haut = yb;
  for (let i = 0; i < n; i++) {
    const wi = w * (1 - i * 0.11);
    const xi = x + (w - wi) / 2;
    const bas = yb - e * i;
    const ye = bas - e * 0.62;
    els.push(<rect key={k(c)} x={f(xi + wi * 0.2)} y={f(ye)} width={f(wi * 0.6)} height={f(bas - ye)} fill={mur} />);
    els.push(fenetre(c, xi + wi * 0.43, ye + (bas - ye) * 0.2, wi * 0.14, (bas - ye) * 0.5, t, c.r() < 0.55));
    els.push(toit(c, xi + wi * 0.2, ye, wi * 0.6, col, 0.42, 0.3));
    haut = ye - wi * 0.6 * 0.3;
  }
  const fl = h * 0.2;
  els.push(<path key={k(c)} d={`M${f(x + w / 2)} ${f(haut)} V${f(haut - fl)} ${Array.from({ length: 6 }, (_, i) => `M${f(x + w / 2 - 6 + i * 0.6)} ${f(haut - 8 - i * fl * 0.12)} H${f(x + w / 2 + 6 - i * 0.6)}`).join(' ')}`} stroke={col} strokeWidth={3} />);
  return <g key={k(c)}>{els}</g>;
}

/** Un torii vermillon, à linteau noir relevé. */
export function torii(c: Ctx, x: number, yb: number, w: number, h: number): ReactNode {
  const rouge = c.p.vermillon;
  const noir = c.p.encre(1);
  const y0 = yb - h;
  const p = w * 0.07;
  return (
    <g key={k(c)}>
      <path d={`M${f(x + w * 0.16)} ${f(yb)} L${f(x + w * 0.19)} ${f(y0 + h * 0.06)} L${f(x + w * 0.19 + p)} ${f(y0 + h * 0.06)} L${f(x + w * 0.16 + p * 1.15)} ${f(yb)} Z M${f(x + w * 0.84)} ${f(yb)} L${f(x + w * 0.81)} ${f(y0 + h * 0.06)} L${f(x + w * 0.81 - p)} ${f(y0 + h * 0.06)} L${f(x + w * 0.84 - p * 1.15)} ${f(yb)} Z`} fill={rouge} />
      <rect x={f(x + w * 0.06)} y={f(y0 + h * 0.24)} width={f(w * 0.88)} height={f(h * 0.06)} fill={rouge} />
      <rect x={f(x + w * 0.47)} y={f(y0 + h * 0.08)} width={f(w * 0.06)} height={f(h * 0.16)} fill={rouge} />
      <path d={`M${f(x - w * 0.02)} ${f(y0 + h * 0.07)} Q${f(x + w / 2)} ${f(y0 + h * 0.12)} ${f(x + w * 1.02)} ${f(y0 + h * 0.07)} L${f(x + w)} ${f(y0 + h * 0.12)} Q${f(x + w / 2)} ${f(y0 + h * 0.17)} ${f(x)} ${f(y0 + h * 0.12)} Z`} fill={rouge} />
      <path d={`M${f(x - w * 0.1)} ${f(y0 - h * 0.03)} Q${f(x + w / 2)} ${f(y0 + h * 0.06)} ${f(x + w * 1.1)} ${f(y0 - h * 0.03)} L${f(x + w * 1.06)} ${f(y0 + h * 0.05)} Q${f(x + w / 2)} ${f(y0 + h * 0.11)} ${f(x - w * 0.06)} ${f(y0 + h * 0.05)} Z`} fill={noir} />
    </g>
  );
}

/** Une lanterne de pierre (tōrō), sa petite fenêtre allumée. */
export function toro(c: Ctx, x: number, yb: number, h: number, t: number): ReactNode {
  const col = c.p.encre(t);
  return (
    <g key={k(c)}>
      {c.p.nuit && <circle cx={f(x)} cy={f(yb - h * 0.62)} r={f(h * 0.5)} fill={c.p.chaud} opacity={0.12} />}
      <path
        d={`M${f(x - h * 0.2)} ${f(yb)} H${f(x + h * 0.2)} V${f(yb - h * 0.1)} H${f(x + h * 0.08)} V${f(yb - h * 0.45)} H${f(x + h * 0.18)} V${f(yb - h * 0.52)} H${f(x - h * 0.18)} V${f(yb - h * 0.45)} H${f(x - h * 0.08)} V${f(yb - h * 0.1)} H${f(x - h * 0.2)} Z M${f(x - h * 0.15)} ${f(yb - h * 0.52)} V${f(yb - h * 0.74)} H${f(x + h * 0.15)} V${f(yb - h * 0.52)} Z M${f(x - h * 0.3)} ${f(yb - h * 0.74)} Q${f(x)} ${f(yb - h * 0.98)} ${f(x + h * 0.3)} ${f(yb - h * 0.74)} Z M${f(x - h * 0.04)} ${f(yb - h * 0.9)} h${f(h * 0.08)} v${f(-h * 0.1)} h${f(-h * 0.08)} Z`}
        fill={col}
      />
      <rect x={f(x - h * 0.08)} y={f(yb - h * 0.69)} width={f(h * 0.16)} height={f(h * 0.12)} fill={c.p.fenetre} opacity={c.p.nuit ? 0.95 : 0.7} />
    </g>
  );
}

/** Une guirlande de lanternes de papier, tendue entre deux points. */
export function guirlande(c: Ctx, x1: number, y1: number, x2: number, y2: number, n: number): ReactNode {
  const cx = (x1 + x2) / 2;
  const cy = Math.max(y1, y2) + Math.abs(x2 - x1) * 0.1;
  const B = (t: number): [number, number] => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  return (
    <g key={k(c)}>
      <path d={`M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`} stroke={c.p.encre(0.9)} strokeWidth={1.6} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const [lx, ly] = B((i + 0.5) / n);
        const rouge = c.r() < 0.45;
        return (
          <g key={i}>
            {c.p.nuit && <circle cx={f(lx)} cy={f(ly + 12)} r={20} fill={rouge ? '#e0643f' : c.p.chaud} opacity={0.16} />}
            <line x1={f(lx)} y1={f(ly)} x2={f(lx)} y2={f(ly + 4)} stroke={c.p.encre(0.9)} strokeWidth={1.4} />
            <ellipse cx={f(lx)} cy={f(ly + 12)} rx={7} ry={9} fill={rouge ? (c.p.nuit ? '#e46a43' : c.p.vermillon) : c.p.fenetre} />
            <path d={`M${f(lx - 5)} ${f(ly + 4)} H${f(lx + 5)} M${f(lx - 5)} ${f(ly + 20)} H${f(lx + 5)}`} stroke={c.p.encre(0.9)} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
}

/** Un pont en arc (taikobashi), rouge sombre. */
export function pont(c: Ctx, x: number, y: number, w: number): ReactNode {
  const hg = w * 0.2;
  const B = (t: number, dy = 0): [number, number] => [x + w * t, (1 - t) ** 2 * y + 2 * (1 - t) * t * (y - hg * 2) + t * t * y - dy];
  const col = c.p.vermillon;
  return (
    <g key={k(c)} stroke={col} fill="none" strokeLinecap="round">
      <path d={`M${f(x)} ${f(y)} Q${f(x + w / 2)} ${f(y - hg * 2)} ${f(x + w)} ${f(y)}`} strokeWidth={10} />
      <path d={`M${f(x)} ${f(y - 24)} Q${f(x + w / 2)} ${f(y - hg * 2 - 24)} ${f(x + w)} ${f(y - 24)}`} strokeWidth={3.5} />
      {Array.from({ length: 9 }, (_, i) => {
        const [px, py] = B(i / 8);
        return <line key={i} x1={f(px)} y1={f(py)} x2={f(px)} y2={f(py - 24)} strokeWidth={3} />;
      })}
      <path d={`M${f(x + w * 0.22)} ${f(B(0.22)[1])} V${f(y + 50)} M${f(x + w * 0.78)} ${f(B(0.78)[1])} V${f(y + 50)}`} strokeWidth={7} stroke={c.p.encre(0.85)} />
    </g>
  );
}

/** Une maison à dôme, des pays secs. */
export function dome(c: Ctx, x: number, yb: number, w: number, hm: number, t: number): ReactNode {
  const col = c.p.encre(t);
  const sombre = c.p.encre(Math.min(1, t + 0.1));
  const nf = Math.max(1, Math.floor(w / 55));
  return (
    <g key={k(c)}>
      <path d={`M${f(x)} ${f(yb)} V${f(yb - hm)} A${f(w / 2)} ${f(w * 0.42)} 0 0 1 ${f(x + w)} ${f(yb - hm)} V${f(yb)} Z`} fill={col} />
      <path d={`M${f(x - 3)} ${f(yb - hm)} H${f(x + w + 3)}`} stroke={sombre} strokeWidth={3} />
      {Array.from({ length: nf }, (_, i) => {
        const fx = x + ((i + 0.5) * w) / nf - 6;
        const allumee = c.r() < 0.6;
        return (
          <g key={i}>
            {allumee && c.p.nuit && <circle cx={f(fx + 6)} cy={f(yb - hm * 0.5)} r={16} fill={c.p.chaud} opacity={0.14} />}
            <path d={`M${f(fx)} ${f(yb - hm * 0.3)} V${f(yb - hm * 0.6)} A6 6 0 0 1 ${f(fx + 12)} ${f(yb - hm * 0.6)} V${f(yb - hm * 0.3)} Z`} fill={allumee ? c.p.fenetre : sombre} />
          </g>
        );
      })}
    </g>
  );
}

/** Une tour de pierre, un peu évasée, sous un toit. */
export function tour(c: Ctx, x: number, yb: number, w: number, h: number, t: number): ReactNode {
  const col = c.p.encre(t);
  return (
    <g key={k(c)}>
      <path d={`M${f(x)} ${f(yb)} L${f(x + w * 0.12)} ${f(yb - h)} L${f(x + w * 0.88)} ${f(yb - h)} L${f(x + w)} ${f(yb)} Z`} fill={col} />
      {Array.from({ length: Math.max(1, Math.floor(h / 55)) }, (_, i) => fenetre(c, x + w * 0.4, yb - h + 18 + i * 52, w * 0.2, 22, t, c.r() < 0.6))}
      {toit(c, x + w * 0.1, yb - h, w * 0.8, c.p.encre(Math.min(1, t + 0.06)), 0.28, 0.42)}
    </g>
  );
}

/** Une aiguille de roche, aux flancs déchiquetés et aux strates. */
export function pilier(c: Ctx, x: number, yb: number, w: number, h: number, t: number): { el: ReactNode; haut: number } {
  const pts: string[] = [`${f(x)} ${f(yb)}`];
  for (let y = yb; y > yb - h; y -= 22) pts.push(`${f(x + w * 0.08 * (1 - (yb - y) / h) + (c.r() - 0.5) * 12 + w * 0.06)} ${f(y)}`);
  const haut = yb - h;
  for (let xx = x + w * 0.1; xx < x + w * 0.9; xx += 18) pts.push(`${f(xx)} ${f(haut + (c.r() - 0.5) * 8)}`);
  for (let y = yb - h; y < yb; y += 22) pts.push(`${f(x + w - w * 0.06 - w * 0.08 * (1 - (yb - y) / h) + (c.r() - 0.5) * 12)} ${f(y)}`);
  pts.push(`${f(x + w)} ${f(yb)}`);
  const strates = Array.from({ length: 5 }, (_, i) => {
    const yy = haut + ((i + 1) * h) / 6 + (c.r() - 0.5) * 14;
    return `M${f(x + w * 0.1)} ${f(yy)} Q${f(x + w / 2)} ${f(yy + (c.r() - 0.5) * 12)} ${f(x + w * 0.9)} ${f(yy)}`;
  });
  return {
    el: (
      <g key={k(c)} filter={`url(#${c.id}pinceau)`}>
        <path d={`M${pts.join(' L')} Z`} fill={c.p.encre(t)} />
        <path d={strates.join(' ')} stroke={c.p.encre(Math.min(1, t + 0.25))} strokeOpacity={0.4} strokeWidth={2} fill="none" />
      </g>
    ),
    haut,
  };
}

/** La flamme de la foudre, avec sa lueur. */
export function eclair(c: Ctx, x: number, y0: number, y1: number): ReactNode {
  let d = `M${f(x)} ${f(y0)}`;
  let cx = x;
  const branches: string[] = [];
  for (let y = y0; y < y1; y += 30) {
    cx += (c.r() - 0.5) * 60;
    d += ` L${f(cx)} ${f(y + 30)}`;
    if (c.r() < 0.25) branches.push(`M${f(cx)} ${f(y + 30)} l${f((c.r() - 0.5) * 120)} ${f(40 + c.r() * 40)}`);
  }
  const col = c.p.nuit ? '#e9e2ff' : c.p.encre(0.9);
  return (
    <g key={k(c)} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {c.p.nuit && <path d={d} stroke="#b9a8ff" strokeWidth={14} opacity={0.18} filter={`url(#${c.id}lueur)`} />}
      <path d={`${d} ${branches.join(' ')}`} stroke={col} strokeWidth={2.6} opacity={0.9} />
    </g>
  );
}

export function rochers(c: Ctx, x: number, yb: number, w: number, col: string): ReactNode {
  const n = 2 + Math.floor(c.r() * 3);
  return (
    <g key={k(c)} fill={col} filter={`url(#${c.id}pinceau)`}>
      {Array.from({ length: n }, (_, i) => {
        const rw = w * (0.3 + c.r() * 0.4);
        const rx = x + (i / n) * w;
        const rh = rw * (0.35 + c.r() * 0.35);
        return <path key={i} d={`M${f(rx)} ${f(yb)} Q${f(rx + rw * 0.05)} ${f(yb - rh)} ${f(rx + rw * 0.45)} ${f(yb - rh * 1.05)} Q${f(rx + rw * 0.95)} ${f(yb - rh * 0.8)} ${f(rx + rw)} ${f(yb)} Z`} />;
      })}
    </g>
  );
}

/** Des rayons de lumière obliques (lune ou soleil à travers les arbres). */
export function rayons(c: Ctx, ax: number): ReactNode {
  const gid = c.id + k(c, 'r');
  return (
    <g key={k(c)}>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.p.nuit ? c.p.halo : '#fffaf0'} stopOpacity={c.p.nuit ? 0.16 : 0.6} />
        <stop offset="1" stopColor={c.p.nuit ? c.p.halo : '#fffaf0'} stopOpacity={0} />
      </linearGradient>
      {Array.from({ length: 5 }, (_, i) => {
        const x0 = ax - 120 + i * 70 + c.r() * 40;
        const lg = 20 + c.r() * 50;
        const derive = 220 + c.r() * 160;
        return <path key={i} d={`M${f(x0)} 40 L${f(x0 + lg)} 40 L${f(x0 + lg + derive + 90)} 760 L${f(x0 + derive)} 760 Z`} fill={`url(#${gid})`} />;
      })}
    </g>
  );
}
