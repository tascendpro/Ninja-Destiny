// Le serveur de la campagne à deux : un Worker Cloudflare qui route, et un Durable Object par partie, qui garde la
// session et applique les actions une par une, dans l'ordre d'arrivée (un Durable Object traite ses requêtes en série :
// pas de course entre les deux joueurs). Toute la logique est dans src/engine/campagne/session.ts, partagée avec le jeu.
//
// Déploiement (non fait : il faut un compte Cloudflare) :
//   npx wrangler deploy --config serveur/wrangler.toml
//
// Routes :
//   POST /salon                          { creation, lien }            → { code, jeton }
//   POST /salon/:code/rejoindre          { creation }                  → { jeton, version, projection }
//   GET  /partie/:code      (Bearer)                                    → { version, projection }
//   POST /partie/:code/action (Bearer)   { action }                    → { version, projection }
//   GET  /partie/:code/export (Bearer)                                  → la sauvegarde rejouable

import { ouvrirSalon, rejoindreSalon, recevoir, vuePour, exporter, type Hacher, type Salon, type Session } from '../src/engine/campagne/session';

interface Env {
  PARTIES: DurableObjectNamespace;
}
// Les types de l'environnement Cloudflare, réduits à ce dont on se sert (pour ne pas dépendre de leur paquet).
interface DurableObjectNamespace {
  idFromName(nom: string): unknown;
  get(id: unknown): { fetch(r: Request): Promise<Response> };
}
interface DurableObjectState {
  storage: { get<T>(k: string): Promise<T | undefined>; put(k: string, v: unknown): Promise<void> };
}

const json = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type' } });

/** Un jeton : 32 octets aléatoires, en hexadécimal. Le serveur n'en garde que l'empreinte. */
const nouveauJeton = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
const nouveauCode = () => [...crypto.getRandomValues(new Uint8Array(6))].map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

/** SHA-256 n'est qu'asynchrone dans le Worker : on calcule l'empreinte avant d'appeler les fonctions pures. */
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** Les fonctions pures prennent un hacheur synchrone : on leur passe une table déjà calculée. */
const table = (paires: [string, string][]): Hacher => (s) => paires.find(([k]) => k === s)?.[1] ?? `inconnu:${s.length}`;
const bearer = (r: Request) => r.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

export default {
  async fetch(r: Request, env: Env): Promise<Response> {
    if (r.method === 'OPTIONS') return json({});
    const url = new URL(r.url);
    const morceaux = url.pathname.split('/').filter(Boolean);
    let code = morceaux[1];
    if (r.method === 'POST' && morceaux.length === 1 && morceaux[0] === 'salon') code = nouveauCode();
    if (!code) return json({ erreur: 'Route inconnue.' }, 404);
    const objet = env.PARTIES.get(env.PARTIES.idFromName(code));
    const transmise = new Request(`https://partie/${code}/${morceaux.slice(morceaux[0] === 'salon' && morceaux.length === 1 ? 1 : 2).join('/')}?type=${morceaux[0]}`, r);
    return objet.fetch(transmise);
  },
};

export class PartieDuo {
  constructor(private etat: DurableObjectState) {}

  async fetch(r: Request): Promise<Response> {
    const url = new URL(r.url);
    const [code, action] = url.pathname.split('/').filter(Boolean);
    const type = url.searchParams.get('type');
    try {
      if (type === 'salon' && !action && r.method === 'POST') {
        const { creation, lien } = (await r.json()) as { creation: Salon['creation']; lien: Salon['lien'] };
        const jeton = nouveauJeton();
        const salon = ouvrirSalon(code, creation, lien, jeton, table([[jeton, await sha256(jeton)]]));
        await this.etat.storage.put('salon', salon);
        return json({ code, jeton });
      }
      if (type === 'salon' && action === 'rejoindre' && r.method === 'POST') {
        const salon = await this.etat.storage.get<Salon>('salon');
        if (!salon) return json({ erreur: 'Salon introuvable.' }, 404);
        if (await this.etat.storage.get<Session>('session')) return json({ erreur: 'La partie est déjà complète.' }, 409);
        const { creation } = (await r.json()) as { creation: Salon['creation'] };
        const jeton = nouveauJeton();
        const h = table([[jeton, await sha256(jeton)]]);
        const graine = crypto.getRandomValues(new Uint32Array(1))[0];
        const session = rejoindreSalon(salon, creation, jeton, graine, h);
        await this.etat.storage.put('session', session);
        return json({ jeton, ...vuePour(session, jeton, h) });
      }
      const session = await this.etat.storage.get<Session>('session');
      if (!session) return json({ erreur: 'Partie introuvable.' }, 404);
      const jeton = bearer(r);
      const h = table([[jeton, await sha256(jeton)]]);
      if (r.method === 'GET' && !action) return json(vuePour(session, jeton, h));
      if (r.method === 'GET' && action === 'export') {
        vuePour(session, jeton, h);
        return json(exporter(session.campagne));
      }
      if (r.method === 'POST' && action === 'action') {
        const { action: x } = (await r.json()) as { action: Parameters<typeof recevoir>[2] };
        const res = recevoir(session, jeton, x, h);
        if (res.session !== session) await this.etat.storage.put('session', res.session);
        return json({ version: res.session.version, projection: res.projection });
      }
      return json({ erreur: 'Route inconnue.' }, 404);
    } catch (e) {
      // Une action refusée (pas ton tour, choix inconnu, jeton invalide) ne change rien : on dit pourquoi.
      return json({ erreur: (e as Error).message }, 400);
    }
  }
}
