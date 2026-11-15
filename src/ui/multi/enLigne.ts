// La campagne à deux sur deux téléphones : créer une partie, recevoir un code, le donner à l'autre, jouer chacun sur
// son appareil. Deux services, la même interface :
//  - Supabase, dès que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis (voir supabase/schema.sql) ;
//  - un service local entre deux onglets du même navigateur, pour essayer et tester sans serveur.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Creation } from '../../engine/types';
import type { nouvelleCampagne } from '../../engine/campagne/moteur';
import type { LigneJournal, TransportJournal } from '../../engine/multi/synchro';

export type LienPartie = Parameters<typeof nouvelleCampagne>[2];

export interface PartieDistante {
  id: string;
  code: string;
  graine: number;
  creationHote: Creation;
  creationInvite?: Creation;
  lien?: LienPartie;
  etat: 'attente' | 'lien' | 'en_cours';
  /** Le siège de cet appareil : 0 pour l'hôte, 1 pour l'invité. */
  siege: 0 | 1;
}

export interface ServiceEnLigne {
  nom: 'supabase' | 'local';
  creer(creation: Creation): Promise<PartieDistante>;
  rejoindre(code: string, creation: Creation): Promise<PartieDistante>;
  lire(id: string): Promise<PartieDistante>;
  lancer(id: string, lien: LienPartie): Promise<void>;
  ecouterPartie(id: string, cb: (p: PartieDistante) => void): () => void;
  journal(id: string): TransportJournal;
}

/** Six caractères sans ambiguïté (pas de 0/O, ni de 1/I/L). */
export function nouveauCode(alea: () => number = Math.random): string {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => A[Math.floor(alea() * A.length)]).join('');
}
export const formaterCode = (c: string) => `${c.slice(0, 3)}-${c.slice(3)}`;
export const nettoyerCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');

const MESSAGES: Record<string, string> = {
  code_inconnu: 'Ce code ne correspond à aucune partie.',
  partie_complete: 'Cette partie a déjà ses deux joueurs.',
  deja_hote: 'C’est ta propre partie : donne ce code à l’autre joueur.',
};
const erreur = (e: unknown) => new Error(Object.entries(MESSAGES).find(([k]) => String((e as { message?: string })?.message ?? e).includes(k))?.[1] ?? String((e as { message?: string })?.message ?? e));

// ── Supabase ─────────────────────────────────────────────────

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | undefined;
async function sb(): Promise<{ db: SupabaseClient; moi: string }> {
  client ??= createClient(URL_SB!, CLE_SB!, { auth: { persistSession: true, storageKey: 'ninja-destiny:auth' } });
  let { data } = await client.auth.getSession();
  if (!data.session) {
    const r = await client.auth.signInAnonymously();
    if (r.error) throw new Error('Connexion impossible : active les connexions anonymes dans Supabase.');
    data = { session: r.data.session! };
  }
  return { db: client, moi: data.session!.user.id };
}

type Ligne = { id: string; code: string; graine: number; hote: string; invite: string | null; creation_hote: Creation; creation_invite: Creation | null; lien: LienPartie | null; etat: PartieDistante['etat'] };
const versPartie = (l: Ligne, moi: string): PartieDistante => ({
  id: l.id,
  code: l.code,
  graine: Number(l.graine),
  creationHote: l.creation_hote,
  creationInvite: l.creation_invite ?? undefined,
  lien: l.lien ?? undefined,
  etat: l.etat,
  siege: l.hote === moi ? 0 : 1,
});

function serviceSupabase(): ServiceEnLigne {
  const lire = async (id: string) => {
    const { db, moi } = await sb();
    const { data, error } = await db.from('parties').select('*').eq('id', id).single();
    if (error) throw erreur(error);
    return versPartie(data as Ligne, moi);
  };
  return {
    nom: 'supabase',
    async creer(creation) {
      const { db, moi } = await sb();
      for (let i = 0; i < 5; i++) {
        const { data, error } = await db
          .from('parties')
          .insert({ code: nouveauCode(), graine: Math.floor(Math.random() * 0x7fffffff), creation_hote: creation })
          .select()
          .single();
        if (!error) return versPartie(data as Ligne, moi);
        if (error.code !== '23505') throw erreur(error);
      }
      throw new Error('Impossible de créer un code : réessaie.');
    },
    async rejoindre(code, creation) {
      const { db } = await sb();
      const { data, error } = await db.rpc('rejoindre', { p_code: nettoyerCode(code), p_creation: creation });
      if (error) throw erreur(error);
      return lire(data as string);
    },
    lire,
    async lancer(id, lien) {
      const { db } = await sb();
      const { error } = await db.from('parties').update({ lien, etat: 'en_cours' }).eq('id', id).eq('etat', 'lien');
      if (error) throw erreur(error);
    },
    ecouterPartie(id, cb) {
      let canal: ReturnType<SupabaseClient['channel']> | undefined;
      void sb().then(({ db, moi }) => {
        canal = db
          .channel(`partie:${id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${id}` }, (p) => cb(versPartie(p.new as Ligne, moi)))
          .subscribe();
      });
      return () => void canal?.unsubscribe();
    },
    journal(id) {
      return {
        async lire(depuis) {
          const { db } = await sb();
          const { data, error } = await db.from('actions_campagne').select('seq, joueur, action').eq('partie_id', id).gte('seq', depuis).order('seq');
          if (error) throw erreur(error);
          return (data ?? []) as LigneJournal[];
        },
        async ajouter(lignes) {
          const { db } = await sb();
          const { error } = await db.from('actions_campagne').insert(lignes.map((l) => ({ partie_id: id, ...l })));
          if (!error) return true;
          if (error.code === '23505') return false;
          throw erreur(error);
        },
        ecouter(f) {
          let canal: ReturnType<SupabaseClient['channel']> | undefined;
          // Le temps réel prévient ; un rattrapage régulier couvre les messages perdus (réseau mobile).
          const minuteur = setInterval(f, 15000);
          void sb().then(({ db }) => {
            canal = db.channel(`journal:${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actions_campagne', filter: `partie_id=eq.${id}` }, () => f()).subscribe();
          });
          return () => {
            clearInterval(minuteur);
            void canal?.unsubscribe();
          };
        },
      };
    },
  };
}

// ── Local : deux onglets du même navigateur ──────────────────

function serviceLocal(): ServiceEnLigne {
  const moi = (() => {
    let id = sessionStorage.getItem('nd-ligne:moi');
    if (!id) sessionStorage.setItem('nd-ligne:moi', (id = Math.random().toString(36).slice(2)));
    return id;
  })();
  const canal = new BroadcastChannel('nd-ligne');
  type Stockee = Omit<PartieDistante, 'siege'> & { hote: string; invite?: string };
  const cle = (id: string) => `nd-ligne:partie:${id}`;
  const lireBrut = (id: string): Stockee => {
    const v = localStorage.getItem(cle(id));
    if (!v) throw new Error(MESSAGES.code_inconnu);
    return JSON.parse(v);
  };
  const ecrire = (p: Stockee) => {
    localStorage.setItem(cle(p.id), JSON.stringify(p));
    canal.postMessage({ t: 'partie', id: p.id });
  };
  const vue = (p: Stockee): PartieDistante => ({ ...p, siege: p.hote === moi ? 0 : 1 });
  const journalDe = (id: string): LigneJournal[] => JSON.parse(localStorage.getItem(`nd-ligne:journal:${id}`) ?? '[]');
  const ecouter = (filtre: (m: { t: string; id: string }) => boolean, f: () => void) => {
    const h = (e: MessageEvent) => filtre(e.data) && f();
    canal.addEventListener('message', h);
    return () => canal.removeEventListener('message', h);
  };
  return {
    nom: 'local',
    async creer(creation) {
      const p: Stockee = { id: Math.random().toString(36).slice(2), code: nouveauCode(), graine: Math.floor(Math.random() * 0x7fffffff), creationHote: creation, etat: 'attente', hote: moi };
      localStorage.setItem(`nd-ligne:code:${p.code}`, p.id);
      ecrire(p);
      return vue(p);
    },
    async rejoindre(code, creation) {
      const id = localStorage.getItem(`nd-ligne:code:${nettoyerCode(code)}`);
      if (!id) throw new Error(MESSAGES.code_inconnu);
      const p = lireBrut(id);
      if (p.hote === moi) throw new Error(MESSAGES.deja_hote);
      if (p.invite && p.invite !== moi) throw new Error(MESSAGES.partie_complete);
      ecrire({ ...p, invite: moi, creationInvite: creation, etat: p.etat === 'attente' ? 'lien' : p.etat });
      return vue(lireBrut(id));
    },
    async lire(id) {
      return vue(lireBrut(id));
    },
    async lancer(id, lien) {
      const p = lireBrut(id);
      if (p.hote !== moi || p.etat !== 'lien') throw new Error('Seul l’hôte lance la partie, une fois l’invité arrivé.');
      ecrire({ ...p, lien, etat: 'en_cours' });
    },
    ecouterPartie(id, cb) {
      return ecouter((m) => m.t === 'partie' && m.id === id, () => cb(vue(lireBrut(id))));
    },
    journal(id) {
      return {
        async lire(depuis) {
          return journalDe(id).filter((l) => l.seq >= depuis);
        },
        async ajouter(lignes) {
          const j = journalDe(id);
          if (lignes.some((n) => j.some((l) => l.seq === n.seq))) return false;
          localStorage.setItem(`nd-ligne:journal:${id}`, JSON.stringify([...j, ...lignes]));
          canal.postMessage({ t: 'journal', id });
          return true;
        },
        ecouter(f) {
          return ecouter((m) => m.t === 'journal' && m.id === id, f);
        },
      };
    },
  };
}

let service: ServiceEnLigne | undefined;
/** Le service en ligne : Supabase s'il est configuré, sinon le service local (deux onglets). */
export function serviceEnLigne(): ServiceEnLigne {
  service ??= URL_SB && CLE_SB ? serviceSupabase() : serviceLocal();
  return service;
}

/** La partie en cours sur cet appareil, pour la reprendre après avoir fermé le navigateur. */
const CLE_REPRISE = 'ninja-destiny:en-ligne';
export function memoriserPartie(id: string | null): void {
  try {
    if (id) localStorage.setItem(CLE_REPRISE, id);
    else localStorage.removeItem(CLE_REPRISE);
  } catch {
    /* rien */
  }
}
export function partieMemorisee(): string | null {
  try {
    return localStorage.getItem(CLE_REPRISE);
  } catch {
    return null;
  }
}
