'use client';

import { useMemo } from 'react';
import { fondPour } from './medias';
import type { ImageResponsive } from './medias';
import type { ReactNode } from 'react';

// Illustrations générées : silhouettes à l'encre superposées, aucune ressource externe.

const L = 1600;
const H = 900;

function rng(graine: string) {
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

const TEINTES: Record<string, number> = {
  village_feu: 150,
  village_vent: 34,
  village_brume: 205,
  village_foudre: 262,
  village_terre: 24,
  foret: 140,
  desert: 32,
  ruines: 195,
  cotes: 210,
  montagne: 255,
  carriere: 22,
  neige: 214,
  marche: 16,
  temple: 165,
  frontiere: 78,
  route: 55,
};

interface Palette {
  cielHaut: string;
  cielBas: string;
  loin: string;
  mi: string;
  pres: string;
  brume: string;
  brumeOpacite: number;
  astre: string;
  lumiere: string;
}

function palette(type: string, theme: 'nuit' | 'washi'): Palette {
  const h = TEINTES[type] ?? 220;
  const chaud = ['village_vent', 'desert', 'carriere', 'marche'].includes(type);
  if (theme === 'washi') {
    return {
      cielHaut: `hsl(42 38% 91%)`,
      cielBas: `hsl(${h} 18% 82%)`,
      loin: `hsl(${h} 10% 70%)`,
      mi: `hsl(${h} 10% 47%)`,
      pres: `hsl(${h} 14% 17%)`,
      brume: '#f4eee0',
      brumeOpacite: 0.55,
      astre: '#b5372d',
      lumiere: '#d9a440',
    };
  }
  return {
    cielHaut: `hsl(${h} 38% 8%)`,
    cielBas: chaud ? `hsl(${h} 45% 24%)` : `hsl(${h} 30% 19%)`,
    loin: `hsl(${h} 22% 21%)`,
    mi: `hsl(${h} 24% 13%)`,
    pres: `hsl(${h} 30% 6%)`,
    brume: `hsl(${h} 25% 78%)`,
    brumeOpacite: 0.1,
    astre: chaud ? '#e9b765' : '#e8dcb2',
    lumiere: '#f0b45a',
  };
}

function crete(r: () => number, base: number, ampl: number, pas: number, rugosite = 0.5): string {
  let d = `M0 ${H} L0 ${base}`;
  let y = base;
  for (let x = 0; x <= L; x += pas) {
    y = base - ampl * (0.3 + 0.7 * r()) * (r() < rugosite ? 1 : 0.55);
    d += ` L${x} ${y.toFixed(0)}`;
  }
  return `${d} L${L} ${H} Z`;
}

function douce(r: () => number, base: number, ampl: number, vagues: number): string {
  let d = `M0 ${H} L0 ${base}`;
  const pas = L / vagues;
  for (let i = 0; i < vagues; i++) {
    const x1 = i * pas + pas / 2;
    const y1 = base - ampl * (0.4 + 0.6 * r());
    d += ` Q${x1.toFixed(0)} ${y1.toFixed(0)} ${((i + 1) * pas).toFixed(0)} ${(base - ampl * 0.2 * r()).toFixed(0)}`;
  }
  return `${d} L${L} ${H} Z`;
}

function toit(x: number, y: number, w: number, couleur: string, k: string): ReactNode {
  const h = w * 0.32;
  return (
    <g key={k} fill={couleur}>
      <rect x={x + w * 0.14} y={y} width={w * 0.72} height={w * 0.55} />
      <path d={`M${x - w * 0.08} ${y + 2} Q${x + w / 2} ${y - h * 0.4} ${x + w * 1.08} ${y + 2} L${x + w * 0.86} ${y - h} L${x + w * 0.14} ${y - h} Z`} />
    </g>
  );
}

function pagode(x: number, base: number, h: number, w: number, p: Palette, k: string, r: () => number): ReactNode {
  const etages = Math.max(2, Math.round(h / 90));
  const pas = h / etages;
  const parts: ReactNode[] = [<rect key="f" x={x + w * 0.3} y={base - h} width={w * 0.4} height={h} fill={p.pres} />];
  for (let i = 0; i < etages; i++) {
    const y = base - i * pas - pas * 0.15;
    const lg = w * (1.25 - i * 0.12);
    parts.push(<path key={`t${i}`} d={`M${x + w / 2 - lg / 2} ${y} Q${x + w / 2} ${y - pas * 0.32} ${x + w / 2 + lg / 2} ${y} L${x + w / 2 + lg * 0.32} ${y - pas * 0.18} L${x + w / 2 - lg * 0.32} ${y - pas * 0.18} Z`} fill={p.pres} />);
    if (r() < 0.55) parts.push(<rect key={`w${i}`} x={x + w / 2 - 3} y={y - pas * 0.62} width={6} height={9} fill={p.lumiere} opacity={0.75} />);
  }
  parts.push(<path key="flèche" d={`M${x + w / 2} ${base - h - 40} L${x + w / 2 + 4} ${base - h} L${x + w / 2 - 4} ${base - h} Z`} fill={p.pres} />);
  return <g key={k}>{parts}</g>;
}

function arbres(r: () => number, n: number, yBase: number, taille: number, couleur: string, prefixe: string): ReactNode[] {
  const res: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = r() * L;
    const t = taille * (0.6 + 0.6 * r());
    res.push(<ellipse key={`${prefixe}${i}`} cx={x} cy={yBase - t * 0.4} rx={t * 0.55} ry={t * 0.5} fill={couleur} />);
  }
  return res;
}

function eclair(r: () => number, x: number, couleur: string): ReactNode {
  let d = `M${x} 40`;
  let cx = x;
  for (let y = 40; y < 380; y += 45) {
    cx += (r() - 0.5) * 70;
    d += ` L${cx.toFixed(0)} ${y + 45}`;
  }
  return <path key="eclair" d={d} stroke={couleur} strokeWidth={4} fill="none" opacity={0.75} />;
}

function decor(type: string, r: () => number, p: Palette): ReactNode[] {
  const el: ReactNode[] = [];
  switch (type) {
    case 'village_feu': {
      el.push(<path key="falaise" d={`M0 ${H} L0 330 Q120 300 220 320 Q300 290 380 330 L430 ${H} Z`} fill={p.mi} />);
      el.push(...arbres(r, 18, 650, 120, p.mi, 'af'));
      for (let i = 0; i < 6; i++) el.push(toit(480 + i * 150 + r() * 40, 560 - r() * 60, 120 + r() * 40, p.pres, `t${i}`));
      for (let i = 0; i < 9; i++) el.push(<circle key={`l${i}`} cx={500 + r() * 900} cy={600 + r() * 60} r={5} fill={p.lumiere} opacity={0.85} />);
      break;
    }
    case 'village_vent': {
      el.push(<path key="crat1" d={`M0 ${H} L0 380 L260 420 L320 ${H} Z`} fill={p.mi} />);
      el.push(<path key="crat2" d={`M${L} ${H} L${L} 360 L1320 410 L1270 ${H} Z`} fill={p.mi} />);
      for (let i = 0; i < 9; i++) {
        const x = 380 + i * 105 + r() * 30;
        const w = 70 + r() * 70;
        el.push(<path key={`d${i}`} d={`M${x} 690 A${w / 2} ${w * 0.5} 0 0 1 ${x + w} 690 Z`} fill={p.pres} />);
      }
      break;
    }
    case 'village_brume': {
      el.push(<rect key="eau" x={0} y={660} width={L} height={240} fill={p.mi} />);
      for (let i = 0; i < 11; i++) {
        const x = 120 + i * 130 + r() * 50;
        const h = 160 + r() * 260;
        const w = 46 + r() * 30;
        el.push(pagode(x, 680, h, w, p, `tour${i}`, r));
      }
      el.push(<path key="quai" d={`M0 690 L${L} 690 L${L} 700 L0 700 Z`} fill={p.pres} />);
      break;
    }
    case 'village_foudre': {
      for (let i = 0; i < 7; i++) {
        const x = 120 + i * 220 + r() * 60;
        const h = 380 + r() * 260;
        el.push(<path key={`pic${i}`} d={`M${x - 70} ${H} L${x} ${H - h} L${x + 70} ${H} Z`} fill={i % 2 ? p.mi : p.pres} />);
      }
      el.push(<path key="pont" d="M250 470 Q560 520 880 430" stroke={p.pres} strokeWidth={6} fill="none" />);
      el.push(eclair(r, 1150 + r() * 200, p.astre));
      break;
    }
    case 'village_terre': {
      for (let i = 0; i < 7; i++) {
        const x = 150 + i * 200 + r() * 50;
        const w = 80 + r() * 60;
        const h = 280 + r() * 260;
        el.push(<rect key={`pil${i}`} x={x} y={H - h} width={w} height={h} rx={18} fill={i % 2 ? p.mi : p.pres} />);
      }
      el.push(<path key="arche" d="M330 520 Q520 440 720 520" stroke={p.pres} strokeWidth={14} fill="none" />);
      break;
    }
    case 'foret': {
      for (let i = 0; i < 16; i++) {
        const x = r() * L;
        const w = 20 + r() * 40;
        el.push(<rect key={`tr${i}`} x={x} y={0} width={w} height={H} fill={i % 3 ? p.pres : p.mi} />);
      }
      el.push(...arbres(r, 14, 230, 260, p.pres, 'fc'));
      break;
    }
    case 'desert':
    case 'ruines': {
      el.push(<path key="dune1" d={douce(r, 640, 140, 4)} fill={p.mi} />);
      if (type === 'ruines') {
        for (let i = 0; i < 6; i++) {
          const x = 380 + i * 160 + r() * 40;
          const h = 140 + r() * 240;
          el.push(
            <path
              key={`verre${i}`}
              d={`M${x} 700 L${x + 12} ${700 - h} L${x + 44} ${720 - h} L${x + 52} 700 Z`}
              fill="hsl(195 60% 70%)"
              opacity={0.28}
              stroke="hsl(195 60% 80%)"
              strokeOpacity={0.5}
            />,
          );
        }
      }
      el.push(<path key="dune2" d={douce(r, 780, 120, 3)} fill={p.pres} />);
      break;
    }
    case 'cotes': {
      el.push(<rect key="mer" x={0} y={620} width={L} height={280} fill={p.mi} />);
      el.push(<path key="rochers" d={crete(r, 820, 220, 90, 0.7)} fill={p.pres} />);
      el.push(<path key="mat" d="M1180 640 L1190 470 L1196 640 Z" fill={p.pres} />);
      break;
    }
    case 'montagne': {
      el.push(<path key="pics" d={crete(r, 900, 620, 140, 0.9)} fill={p.pres} />);
      el.push(eclair(r, 400 + r() * 700, p.astre));
      break;
    }
    case 'carriere': {
      for (let i = 0; i < 6; i++) el.push(<rect key={`ter${i}`} x={i * 90} y={420 + i * 80} width={L} height={90} fill={i % 2 ? p.mi : p.pres} />);
      break;
    }
    case 'neige': {
      el.push(<path key="pics" d={crete(r, 900, 520, 160, 0.8)} fill={p.pres} />);
      for (let i = 0; i < 60; i++) el.push(<circle key={`n${i}`} cx={r() * L} cy={r() * H} r={1.5 + r() * 2.5} fill="#f2f4f8" opacity={0.7} />);
      break;
    }
    case 'marche': {
      el.push(<path key="corde" d="M0 260 Q400 340 800 270 Q1200 200 1600 290" stroke={p.pres} strokeWidth={3} fill="none" />);
      for (let i = 0; i < 12; i++) el.push(<ellipse key={`lan${i}`} cx={70 + i * 130} cy={290 + Math.sin(i) * 30} rx={16} ry={22} fill={p.lumiere} opacity={0.8} />);
      for (let i = 0; i < 6; i++) el.push(toit(60 + i * 260 + r() * 40, 640, 200, p.pres, `st${i}`));
      break;
    }
    case 'temple': {
      el.push(...arbres(r, 10, 600, 200, p.mi, 'tp'));
      for (let i = 0; i < 8; i++) el.push(<rect key={`m${i}`} x={620 - i * 22} y={820 - i * 34} width={360 + i * 44} height={36} fill={p.pres} opacity={0.9} />);
      el.push(<rect key="p1" x={640} y={250} width={22} height={300} fill={p.pres} />);
      el.push(<rect key="p2" x={940} y={250} width={22} height={300} fill={p.pres} />);
      el.push(<path key="lin" d="M590 250 Q800 210 1010 250 L1000 280 L600 280 Z" fill={p.pres} />);
      break;
    }
    case 'frontiere': {
      el.push(<path key="plaine" d={douce(r, 720, 60, 5)} fill={p.mi} />);
      for (let i = 0; i < 14; i++) {
        const x = 80 + i * 110 + r() * 30;
        const h = 40 + r() * 70;
        el.push(<rect key={`pieu${i}`} x={x} y={760 - h} width={10} height={h} fill={p.pres} />);
      }
      break;
    }
    case 'route': {
      el.push(<path key="collines" d={douce(r, 640, 140, 4)} fill={p.mi} />);
      el.push(<path key="chemin" d="M720 900 Q760 760 900 700 Q1040 650 1100 600" stroke={p.loin} strokeWidth={30} fill="none" opacity={0.6} />);
      break;
    }
  }
  return el;
}

function premierPlan(sous: string | undefined, r: () => number, p: Palette): ReactNode[] {
  const el: ReactNode[] = [];
  switch (sous) {
    case 'academie':
      el.push(toit(520, 520, 560, p.pres, 'acad'));
      el.push(<rect key="mat" x={790} y={260} width={8} height={130} fill={p.pres} />);
      el.push(<path key="flamme" d="M798 262 L880 280 L798 300 Z" fill={p.astre} opacity={0.8} />);
      break;
    case 'terrain':
      for (let i = 0; i < 3; i++) el.push(<rect key={`poteau${i}`} x={520 + i * 240} y={560} width={34} height={340} fill={p.pres} />);
      el.push(<circle key="cible" cx={1260} cy={620} r={70} fill="none" stroke={p.pres} strokeWidth={14} />);
      el.push(<circle key="cible2" cx={1260} cy={620} r={24} fill={p.pres} />);
      break;
    case 'maison':
      el.push(<rect key="mur" x={0} y={0} width={L} height={H} fill={p.pres} opacity={0.82} />);
      el.push(
        <g key="shoji" stroke={p.loin} strokeWidth={6} fill="none" opacity={0.8}>
          <rect x={480} y={140} width={640} height={520} />
          <line x1={800} y1={140} x2={800} y2={660} />
          <line x1={480} y1={313} x2={1120} y2={313} />
          <line x1={480} y1={486} x2={1120} y2={486} />
        </g>,
      );
      el.push(<circle key="lampe" cx={1300} cy={720} r={60} fill={p.lumiere} opacity={0.35} />);
      el.push(<circle key="lampe2" cx={1300} cy={720} r={18} fill={p.lumiere} opacity={0.9} />);
      break;
    case 'forge':
      el.push(<rect key="mur" x={0} y={0} width={L} height={H} fill={p.pres} opacity={0.8} />);
      el.push(<circle key="feu" cx={520} cy={640} r={200} fill={p.lumiere} opacity={0.25} />);
      el.push(<circle key="feu2" cx={520} cy={680} r={70} fill={p.lumiere} opacity={0.7} />);
      el.push(<path key="enclume" d="M900 720 L1260 720 L1220 760 L1130 770 L1150 860 L1010 860 L1030 770 L940 760 Z" fill={p.pres} />);
      break;
    case 'porte':
      el.push(<rect key="g1" x={420} y={260} width={90} height={640} fill={p.pres} />);
      el.push(<rect key="g2" x={1090} y={260} width={90} height={640} fill={p.pres} />);
      el.push(<path key="linteau" d="M360 260 Q800 190 1240 260 L1220 310 L380 310 Z" fill={p.pres} />);
      break;
  }
  return el;
}

export interface SceneProps {
  scene: string;
  graine: string;
  theme: 'nuit' | 'washi';
  anime?: boolean;
  description?: string;
  /** Identifiant du lieu, pour chercher une image fournie avant le type de scène. */
  lieuId?: string;
}

/** Une image fournie (medias.ts) remplace le dessin ; sinon la scène est peinte à l'encre. */
export default function SceneArt(props: SceneProps) {
  const image = fondPour(props.scene, props.lieuId);
  if (image) return <ImageScene image={image} description={props.description} />;
  return <SceneEncre {...props} />;
}

export function ImageScene({ image, description, priorite = false }: { image: ImageResponsive; description?: string; priorite?: boolean }) {
  return (
    <picture className="scene-image">
      {image.mobile && <source media="(max-width: 700px)" srcSet={image.mobile} />}
      <img
        src={image.pc}
        alt={description ?? ''}
        style={image.focal ? { objectPosition: image.focal } : undefined}
        decoding="async"
        fetchPriority={priorite ? 'high' : 'auto'}
      />
    </picture>
  );
}

function SceneEncre({ scene, graine, theme, anime = true, description }: SceneProps) {
  const contenu = useMemo(() => {
    const [a, b] = scene.split(':');
    const type = b ?? a;
    const sous = b ? a : undefined;
    const r = rng(`${graine}:${scene}`);
    const p = palette(type, theme);
    const astreX = 200 + r() * 1200;
    const astreY = 110 + r() * 90;
    const id = `s${Math.floor(r() * 1e9)}`;
    return (
      <>
        <defs>
          <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.cielHaut} />
            <stop offset="1" stopColor={p.cielBas} />
          </linearGradient>
          <radialGradient id={`${id}h`}>
            <stop offset="0" stopColor={p.astre} stopOpacity="0.35" />
            <stop offset="1" stopColor={p.astre} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.brume} stopOpacity="0" />
            <stop offset="0.5" stopColor={p.brume} stopOpacity={p.brumeOpacite * 2} />
            <stop offset="1" stopColor={p.brume} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={L} height={H} fill={`url(#${id}c)`} />
        {sous !== 'maison' && sous !== 'forge' && (
          <>
            <circle cx={astreX} cy={astreY} r={190} fill={`url(#${id}h)`} />
            <circle cx={astreX} cy={astreY} r={46} fill={p.astre} opacity={theme === 'washi' ? 0.85 : 0.9} />
          </>
        )}
        <path d={crete(r, 470, 200, 120, 0.6)} fill={p.loin} />
        <g className={anime ? 'brume-anim' : undefined}>
          <rect x={-200} y={430} width={L + 400} height={160} fill={`url(#${id}b)`} />
        </g>
        {decor(type, r, p)}
        {premierPlan(sous, r, p)}
        <g className={anime ? 'brume-anim' : undefined} style={{ animationDuration: '52s' }}>
          <rect x={-200} y={700} width={L + 400} height={200} fill={`url(#${id}b)`} />
        </g>
      </>
    );
  }, [scene, graine, theme, anime]);

  return (
    <svg viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={description ?? 'Illustration de la scène'}>
      {contenu}
    </svg>
  );
}
