import type { Effect } from '../../engine/types';
import { hash01 } from '../../engine/campagne/outils';
import type { AxeLien, Campagne, ChoixCommun, FamilleIntention, IdJoueur, SceneCommuneDef, Tonalite, TypeLien } from '../../engine/campagne/types';

/**
 * Une fabrique de scènes communes, pour écrire beaucoup de contenu lisible :
 *   scene(id, titre, [âge min, âge max], texte, choix, issues, options)
 * Une issue : [clé de la matrice, texte, { l: lien des deux, un/deux: lien de chacun, a: accord, s: souvenir, fx: effets… }].
 */
type Axes = Partial<Record<AxeLien, number>>;
export interface Suite {
  l?: Axes;
  un?: Axes;
  deux?: Axes;
  a?: number;
  /** Un souvenir : [texte, poids, ton]. */
  s?: [string, 1 | 2 | 3 | 4 | 5, Tonalite];
  fx?: Effect[];
  fxUn?: Effect[];
  fxDeux?: Effect[];
  combat?: string;
  promesse?: [string, string];
  apres?: (c: Campagne, un: IdJoueur) => void;
}
export type Choix = [string, string, FamilleIntention];
export type Issue = [string, string, Suite?];

export function scene(
  id: string,
  titre: string,
  age: [number, number?],
  texte: SceneCommuneDef['texte'],
  choix: Choix[],
  issues: Issue[],
  o: Partial<Pick<SceneCommuneDef, 'types' | 'si' | 'textePour' | 'choixPour' | 'privee' | 'dynamique' | 'tirage'>> = {},
): SceneCommuneDef {
  return {
    id,
    titre,
    age: o.dynamique ? undefined : { min: age[0], max: age[1] },
    texte,
    choix: choix.map(([cid, t, famille]): ChoixCommun => ({ id: cid, texte: t, famille })),
    issues: issues.map(([cle, t, x = {}]) => ({
      cle,
      texte: t,
      lien: x.l || x.un || x.deux ? { les2: x.l, un: x.un, deux: x.deux } : undefined,
      accord: x.a,
      souvenir: x.s ? { id, texte: x.s[0], poids: x.s[1], tonalite: x.s[2] } : undefined,
      effets: x.fx || x.fxUn || x.fxDeux ? { les2: x.fx, un: x.fxUn, deux: x.fxDeux } : undefined,
      combat: x.combat,
      promesse: x.promesse ? { id: x.promesse[0], texte: x.promesse[1] } : undefined,
      apres: x.apres,
    })),
    ...o,
  };
}

/** Une scène privée : un seul joueur la vit ; ses issues sont indexées par le choix. */
export function privee(id: string, titre: string, age: [number, number?], qui: (c: Campagne) => IdJoueur | undefined, texte: SceneCommuneDef['texte'], choix: Choix[], issues: Issue[], o: Partial<Pick<SceneCommuneDef, 'si' | 'dynamique'>> = {}): SceneCommuneDef {
  return scene(id, titre, age, texte, choix, issues, { ...o, privee: qui });
}

/** Un lot de scènes tirées au hasard pour chaque campagne : chacune a cette chance d'en faire partie. */
export const tirees = (p: number, l: SceneCommuneDef[]): SceneCommuneDef[] => l.map((s) => ({ tirage: p, ...s }));

/** Le texte selon le lien : une variante par type, sinon la variante par défaut. */
export function selon(c: Campagne, v: Partial<Record<TypeLien | 'defaut', string>>): string {
  return v[c.lien.type] ?? v.defaut ?? '';
}

export const memeVillage = (c: Campagne) => c.creations[0].village === c.creations[1].village;
export const vu = (id: string) => (c: Campagne) => c.vues.includes(id);
export const age = (c: Campagne, j: IdJoueur) => Math.floor((c.joueurs[j].jour - c.joueurs[j].naissance) / 360);
export const RANGS = ['eleve', 'genin', 'chunin', 'jonin', 'kage'];
export const rangDe = (c: Campagne, j: IdJoueur) => RANGS.indexOf(c.joueurs[j].rang);
export const jinchuriki = (c: Campagne): IdJoueur | undefined => ([0, 1] as IdJoueur[]).find((j) => !!c.joueurs[j].tirages.biju);

/** Un arc long ne se joue que dans certaines campagnes : cette chance-là. */
export const arc = (id: string, p: number) => (c: Campagne) => hash01(c, `arc:${id}`) < p;
