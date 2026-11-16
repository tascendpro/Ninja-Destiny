import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { decouper, type Ligne } from './repliques';

/**
 * Le code couleur des personnages : chacun a sa couleur, partout où son nom apparaît (récit, dialogues, scènes
 * communes). Les deux joueurs ont la leur (rouge, bleu) ; chaque personnage du monde a une teinte fixe, tirée de son nom.
 */
export interface NomColore {
  nom: string;
  /** Une couleur CSS (joueurs), ou une teinte 0-360 (personnages du monde, la clarté suit le thème). */
  couleur?: string;
  teinte?: number;
  joueur?: 0 | 1 | 'solo';
}
export const NomsColores = createContext<NomColore[]>([]);

/** Une teinte stable pour un nom. */
export function teinteDe(nom: string): number {
  let h = 0;
  for (const c of nom) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

const echapper = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Colore les noms connus d'un morceau de texte. */
function colorer(texte: string, noms: NomColore[], cle: string | number): ReactNode {
  if (!noms.length || !texte) return texte;
  const tries = [...noms].filter((n) => n.nom.length >= 3).sort((a, b) => b.nom.length - a.nom.length);
  if (!tries.length) return texte;
  const re = new RegExp(`(${tries.map((n) => echapper(n.nom)).join('|')})`, 'g');
  const parts = texte.split(re);
  if (parts.length === 1) return texte;
  return parts.map((p, i) => {
    const n = i % 2 === 1 ? tries.find((x) => x.nom === p) : undefined;
    if (!n) return p;
    const style = (n.couleur ? { '--np': n.couleur } : { '--np-h': n.teinte }) as unknown as CSSProperties;
    return (
      <b key={`${cle}-${i}`} className={`nom-perso${n.joueur !== undefined ? ` nom-joueur nom-j${n.joueur}` : ''}${n.teinte !== undefined ? ' nom-teinte' : ''}`} style={style}>
        {p}
      </b>
    );
  });
}

/** Les paroles entre guillemets ressortent du récit : on entend qui parle avant de lire ce qui se passe. */
export function avecParoles(p: string, noms: NomColore[] = []): ReactNode[] {
  return p.split(/(«[^»]*»)/g).map((morceau, i) =>
    morceau.startsWith('«') ? (
      <q className="parole" key={i}>
        {colorer(morceau, noms, i)}
      </q>
    ) : (
      <span key={i}>{colorer(morceau, noms, i)}</span>
    ),
  );
}

/**
 * Un paragraphe du récit. S'il contient des paroles, chaque réplique part à la ligne derrière un tiret
 * (repliques.ts) ; sinon il reste un seul bloc de texte. Les noms des personnages prennent leur couleur.
 */
/**
 * Qui parle : un personnage connu nommé dans l'incise de la réplique (« …, dit Minoru »). Seulement s'il n'y a pas de
 * doute : un seul nom dans l'incise, et pas une incise où c'est toi qui parles.
 */
function locuteur(l: Ligne, noms: NomColore[]): NomColore | undefined {
  if (!l.replique || !noms.length) return undefined;
  const incise = l.morceaux
    .filter((m) => !m.parole)
    .map((m) => m.texte)
    .join(' ');
  if (!incise.trim() || /(^|[\s,])(tu|toi|dis-tu|demandes-tu|réponds-tu)\b/i.test(incise)) return undefined;
  const trouves = [...noms].filter((n) => n.nom.length >= 3 && n.joueur === undefined).sort((a, b) => b.nom.length - a.nom.length).filter((n) => incise.includes(n.nom));
  // « Minoru Uchiha » et « Minoru » désignent la même personne : on garde le plus long, et on refuse deux personnes.
  const distincts = trouves.filter((n) => !trouves.some((m) => m !== n && m.nom.includes(n.nom)));
  return distincts.length === 1 ? distincts[0] : undefined;
}

export function ParagrapheRecit({ texte, classe }: { texte: string; classe?: string }) {
  const noms = useContext(NomsColores);
  const lignes = decouper(texte);
  if (!lignes.some((l) => l.replique)) return <p className={classe}>{avecParoles(texte, noms)}</p>;
  return (
    <div className="dialogue">
      {lignes.map((l, i) => {
        const qui = locuteur(l, noms);
        const style = qui ? ((qui.couleur ? { '--np': qui.couleur } : { '--np-h': qui.teinte }) as unknown as CSSProperties) : undefined;
        return (
        <p key={i} className={[classe, l.replique ? 'replique' : undefined, qui ? `a-locuteur${qui.teinte !== undefined ? ' nom-teinte' : ''}` : undefined].filter(Boolean).join(' ') || undefined} style={style}>
          {qui && (
            <span className="locuteur" aria-hidden="true">
              <i>{qui.nom.charAt(0)}</i>
              {qui.nom}
            </span>
          )}
          {l.replique && (
            <span className="tiret" aria-hidden="true">
              —{' '}
            </span>
          )}
          {l.morceaux.map((m, j) =>
            m.parole ? (
              <q className="parole" key={j}>
                {colorer(m.texte, noms, j)}
              </q>
            ) : (
              <span key={j}>{colorer(m.texte, noms, j)}</span>
            ),
          )}
        </p>
        );
      })}
    </div>
  );
}
