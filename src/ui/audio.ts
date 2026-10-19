// Ambiance sonore : les musiques de musiques.ts (une par moment du jeu, en fondu) si elles sont fournies,
// sinon une ambiance générée (vent, bourdon grave, carillon lointain). Les effets ne jouent que s'ils sont fournis.

import { SONS } from './medias';
import type { CleSon } from './medias';
import { EFFETS, idYoutube, urlPiste } from './musiques';
import type { Effet, Piste } from './musiques';

export class Ambiance {
  private ctx?: AudioContext;
  private maitre?: GainNode;
  private minuterie?: ReturnType<typeof setTimeout>;
  private volume = 0.5;
  private actif = false;
  private pisteCourante?: Piste;
  private lecteur?: HTMLAudioElement;

  demarrer(volume: number, piste: Piste = 'village'): void {
    this.volume = volume;
    this.actif = true;
    this.jouer(piste, true);
  }

  /** Change de musique selon le moment du jeu, en fondu ; sans URL, l'ambiance générée prend le relais. */
  jouer(piste: Piste, forcer = false): void {
    if (!this.actif) return;
    if (!forcer && piste === this.pisteCourante) return;
    this.pisteCourante = piste;
    const brute = urlPiste(piste) ?? SONS.ambiance;
    // Une vidéo YouTube ne passe que par son lecteur officiel (composant LecteurYoutube) : rien à jouer ici.
    if (idYoutube(brute)) {
      this.fondreSortie(this.lecteur);
      this.lecteur = undefined;
      this.genere(false);
      return;
    }
    const url = brute;
    if (!url) {
      this.fondreSortie(this.lecteur);
      this.lecteur = undefined;
      this.genere(true);
      return;
    }
    if (this.lecteur && this.lecteur.dataset.url === url) {
      // Lecture bloquée au chargement (autoplay refusé) : on la relance au premier geste.
      if (this.lecteur.paused) {
        void this.lecteur.play().catch(() => undefined);
        this.fondreEntree(this.lecteur);
      }
      return;
    }
    this.genere(false);
    try {
      const ancien = this.lecteur;
      const a = Object.assign(new Audio(url), { loop: true, volume: 0 });
      a.dataset.url = url;
      // Fichier absent ou illisible : on revient à l'ambiance générée plutôt qu'au silence.
      a.addEventListener('error', () => {
        if (this.lecteur !== a) return;
        this.lecteur = undefined;
        this.genere(true);
      });
      this.lecteur = a;
      void a.play().catch(() => undefined);
      this.fondreEntree(a);
      this.fondreSortie(ancien);
    } catch {
      /* audio indisponible */
    }
  }

  private fondreEntree(a: HTMLAudioElement): void {
    const cible = Math.min(1, this.volume * 0.6);
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      a.volume = Math.min(cible, (cible * t) / 15);
      if (t >= 15) clearInterval(id);
    }, 100);
  }

  private fondreSortie(a?: HTMLAudioElement): void {
    if (!a) return;
    const depart = a.volume;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      a.volume = Math.max(0, depart * (1 - t / 15));
      if (t >= 15) {
        clearInterval(id);
        a.pause();
      }
    }, 100);
  }

  /** L'ambiance générée : vent, bourdon grave, carillon lointain. */
  private genere(allumer: boolean): void {
    try {
      if (!allumer) {
        if (this.ctx && this.maitre) this.maitre.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
        if (this.minuterie) clearTimeout(this.minuterie);
        return;
      }
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.construire();
      }
      void this.ctx.resume();
      this.regler(this.volume);
      this.planifierCarillon();
    } catch {
      /* audio indisponible : le jeu continue sans son */
    }
  }

  /** Effet ponctuel (choix scellé, éveil, coup porté…) : joué seulement si un fichier est fourni. */
  effet(cle: Effet | CleSon): void {
    const src = EFFETS[cle as Effet] || SONS[cle as CleSon];
    if (!src || !this.actif) return;
    try {
      const a = new Audio(src);
      a.volume = Math.min(1, this.volume);
      void a.play().catch(() => undefined);
    } catch {
      /* ignoré */
    }
  }

  arreter(): void {
    this.actif = false;
    this.pisteCourante = undefined;
    this.lecteur?.pause();
    this.lecteur = undefined;
    if (this.minuterie) clearTimeout(this.minuterie);
    try {
      void this.ctx?.suspend();
    } catch {
      /* ignoré */
    }
  }

  regler(volume: number): void {
    this.volume = volume;
    if (this.lecteur) this.lecteur.volume = Math.min(1, volume * 0.6);
    if (this.ctx && this.maitre) this.maitre.gain.setTargetAtTime(volume * 0.35, this.ctx.currentTime, 0.4);
  }

  private construire(): void {
    const ctx = this.ctx!;
    this.maitre = ctx.createGain();
    this.maitre.gain.value = 0;
    this.maitre.connect(ctx.destination);

    // Vent : bruit brun filtré, modulé lentement.
    const duree = 4;
    const tampon = ctx.createBuffer(1, ctx.sampleRate * duree, ctx.sampleRate);
    const d = tampon.getChannelData(0);
    let dernier = 0;
    for (let i = 0; i < d.length; i++) {
      const blanc = Math.random() * 2 - 1;
      dernier = (dernier + 0.02 * blanc) / 1.02;
      d[i] = dernier * 3.5;
    }
    const vent = ctx.createBufferSource();
    vent.buffer = tampon;
    vent.loop = true;
    const filtre = ctx.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 500;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filtre.frequency);
    const gVent = ctx.createGain();
    gVent.gain.value = 0.6;
    vent.connect(filtre).connect(gVent).connect(this.maitre);
    vent.start();
    lfo.start();

    // Bourdon grave.
    for (const f of [55, 82.4]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.connect(g).connect(this.maitre);
      o.start();
    }
  }

  private planifierCarillon(): void {
    if (this.minuterie) clearTimeout(this.minuterie);
    this.minuterie = setTimeout(() => {
      this.carillon();
      this.planifierCarillon();
    }, 7000 + Math.random() * 9000);
  }

  private carillon(): void {
    const ctx = this.ctx;
    if (!ctx || !this.maitre || ctx.state !== 'running') return;
    const gamme = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const f = gamme[Math.floor(Math.random() * gamme.length)];
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    o.connect(g).connect(this.maitre);
    o.start(t);
    o.stop(t + 3.6);
  }
}
