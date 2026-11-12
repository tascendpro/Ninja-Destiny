'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fondPour } from './medias';
import type { ImageResponsive } from './medias';
import { H, L, palette, rng } from './encre';
import type { Ctx } from './encre';
import { peindre } from './paysages';

// Les lieux sont peints à l'encre (encre.tsx, paysages.tsx), sauf si une image est fournie pour eux (medias.ts).

export interface SceneProps {
  scene: string;
  graine: string;
  theme: 'nuit' | 'washi';
  anime?: boolean;
  description?: string;
  /** Identifiant du lieu, pour chercher une image fournie avant le type de scène. */
  lieuId?: string;
  /** Cadrage panoramique : seule la bande du paysage où vit le décor est montrée. */
  panorama?: boolean;
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

export function SceneEncre({ scene, graine, theme, anime = true, description, panorama }: SceneProps) {
  const contenu = useMemo(() => {
    const r = rng(`${graine}:${scene}`);
    const id = `s${Math.floor(r() * 1e9).toString(36)}`;
    const type = scene.includes(':') ? (scene.startsWith('forge:') ? 'forge' : scene.split(':')[1]) : scene;
    const c: Ctx = { r, p: palette(type, theme), id, n: 0, anime };
    const graineFiltre = Math.floor(r() * 997);
    const [g0, g1, g2, ga] = c.p.grain;
    return (
      <>
        <defs>
          <filter id={`${id}pinceau`} x="-5%" y="-15%" width="110%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.007 0.032" numOctaves={3} seed={graineFiltre} result="b" />
            <feDisplacementMap in="SourceGraphic" in2="b" scale={14} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${id}flou`} x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation={1.8} />
          </filter>
          <filter id={`${id}lueur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6} />
          </filter>
          <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={graineFiltre + 7} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values={`0 0 0 0 ${g0} 0 0 0 0 ${g1} 0 0 0 0 ${g2} ${ga} 0 0 0 0`} />
          </filter>
        </defs>
        {peindre(c, scene)}
        <rect width={L} height={H} filter={`url(#${id}grain)`} />
      </>
    );
  }, [scene, graine, theme, anime]);

  return (
    <svg viewBox={panorama ? `0 120 ${L} 640` : `0 0 ${L} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={description ?? 'Illustration de la scène'}>
      {contenu}
    </svg>
  );
}

// ── Le paysage figé en image ─────────────────────────────────
// Le SVG peint (filtres de pinceau, grain) coûte cher à redessiner. On le peint une seule fois, hors écran, on le fige en
// image, et c'est l'image qu'on affiche : le défilement, les choix et les combats ne repeignent jamais les filtres.
// Les images déjà faites restent en mémoire : revenir dans un lieu est instantané.

const IMAGES = new Map<string, string>();
const MAX_IMAGES = 40;

function garder(cle: string, url: string): void {
  IMAGES.set(cle, url);
  while (IMAGES.size > MAX_IMAGES) {
    const [ancienne, u] = IMAGES.entries().next().value as [string, string];
    IMAGES.delete(ancienne);
    URL.revokeObjectURL(u);
  }
}

export function PaysageFige({ scene, graine, theme, lieuId }: { scene: string; graine: string; theme: 'nuit' | 'washi'; lieuId?: string }) {
  const image = fondPour(scene, lieuId);
  const cle = `${scene}|${graine}|${theme}`;
  const [url, setUrl] = useState<string | undefined>(() => IMAGES.get(cle));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const deja = IMAGES.get(cle);
    if (deja) {
      setUrl(deja);
      return;
    }
    setUrl(undefined);
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    try {
      const copie = svg.cloneNode(true) as SVGSVGElement;
      copie.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      copie.setAttribute('width', String(L));
      copie.setAttribute('height', '640');
      const u = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copie)], { type: 'image/svg+xml' }));
      garder(cle, u);
      setUrl(u);
    } catch {
      /* navigateur sans Blob : pas de paysage, le jeu continue */
    }
  }, [cle]);
  if (image) return <ImageScene image={image} />;
  return (
    <>
      {url ? (
        <img className="paysage-fige" src={url} alt="" decoding="async" draggable={false} />
      ) : (
        <div ref={ref} hidden>
          <SceneEncre scene={scene} graine={graine} theme={theme} anime={false} panorama />
        </div>
      )}
    </>
  );
}
