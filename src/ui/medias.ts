// Images et sons du jeu. Pour ajouter un fond : déposer le fichier dans src/ui/images/,
// l'importer ici et l'associer à une clé de scène. Sans fichier, la scène reste dessinée à l'encre (SceneArt).
//
// Clés de scène acceptées (de la plus précise à la plus générale) :
//   - l'identifiant d'un lieu : 'konoha', 'konoha_academie', 'foret_feu', 'temple_oublie'…
//   - le type de scène : 'village_feu', 'village_vent', 'village_brume', 'village_foudre', 'village_terre',
//     'foret', 'frontiere', 'desert', 'ruines', 'cotes', 'montagne', 'carriere', 'neige', 'marche', 'temple', 'route'
//   - une variante de lieu de village : 'academie', 'terrain', 'maison', 'forge', 'porte', 'bureau'…

import accueilPc from './images/accueil-pc.jpg';
import accueilMobile from './images/accueil-mobile.jpg';

/** Un import d'image vaut une URL (Vite) ou un objet { src } (Next.js). */
type Importee = string | { src: string };
export const url = (x: Importee): string => (typeof x === 'string' ? x : x.src);

export interface ImageResponsive {
  /** Version paysage (PC, tablette). */
  pc: string;
  /** Version portrait (téléphone). Facultative : la version PC est recadrée sinon. */
  mobile?: string;
  /** Point focal pour le recadrage, ex. '56% 40%'. */
  focal?: string;
}

export const ACCUEIL: ImageResponsive = { pc: url(accueilPc as Importee), mobile: url(accueilMobile as Importee), focal: '62% 40%' };

/** Fonds de scène fournis : clé de scène → image. Vide pour l'instant. */
export const FONDS: Record<string, ImageResponsive> = {
  // village_feu: { pc: url(konohaPc as Importee), mobile: url(konohaMobile as Importee) },
};

/** Cherche un fond pour une scène : lieu exact, puis variante, puis type. */
export function fondPour(scene: string, lieuId?: string): ImageResponsive | undefined {
  const [a, b] = scene.split(':');
  return (lieuId && FONDS[lieuId]) || FONDS[scene] || (b ? FONDS[a] || FONDS[b] : FONDS[a]);
}

/** Sons fournis : clé → fichier. Sans fichier, l'ambiance reste générée et les effets sont muets. */
export type CleSon = 'ambiance' | 'combat' | 'choix' | 'eveil' | 'page';
export const SONS: Partial<Record<CleSon, string>> = {
  // choix: url(sceauMp3 as Importee),
};
