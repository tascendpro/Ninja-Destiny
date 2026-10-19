// ─────────────────────────────────────────────────────────────────────────────
//  MUSIQUES ET SONS : c'est ici qu'on colle les URL.
// ─────────────────────────────────────────────────────────────────────────────
//
// Chaque piste est une URL vers un fichier audio (mp3, ogg, m4a). Laisser une ligne vide ('') ou la
// commenter : le jeu passe à la piste de repli (« village »), puis à l'ambiance générée (vent, carillon).
//
// Le jeu choisit la piste selon le moment et fond l'une dans l'autre (fondu de 1,5 s) :
//   accueil      écran titre
//   enfance      chapitre 1 avant 12 ans
//   village      récit ordinaire (piste de repli pour tout le reste)
//   temps_libre  écran de temps libre
//   combat       combat en manches, et toute scène avec un combat
//   tension      scènes de guerre, de trahison, de capture
//   deuil        scènes de deuil
//   eveil        quand un pouvoir s'éveille (joué une fois, par-dessus)
//   bilan        bilans de séquence
//   fin          écran de fin (de chapitre ou de vie)
//
// Exemple :
//   accueil: 'https://mon-site.fr/sons/accueil.mp3',
//
// Liens YouTube : ignorés. YouTube ne permet ni d'en extraire le son, ni de faire jouer une vidéo dans un
// lecteur caché ; une musique de fond doit donc être un fichier audio (mp3, ogg) dont tu as les droits.
// La musique joue par défaut (dès le premier toucher, règle des navigateurs) ; le bouton ♪ de l'accueil
// et le bouton « Son » de la barre du bas la coupent ou la remettent.
//
// À savoir : dans la version publiée sur claude.ai, les fichiers venant d'autres sites sont bloqués.
// Les URL fonctionnent sur ta propre mise en ligne (Vercel, Netlify) ou avec des fichiers déposés
// dans public/sons/ (URL relative : '/sons/accueil.mp3').

export type Piste = 'accueil' | 'enfance' | 'village' | 'temps_libre' | 'combat' | 'tension' | 'deuil' | 'bilan' | 'fin';

export const MUSIQUES: Partial<Record<Piste, string>> = {
  accueil: '',
  enfance: '',
  // Musique principale, jouée en boucle partout où aucune autre piste n'est donnée.
  // Le fichier se dépose dans public/sons/theme.mp3 ; absent, le jeu revient à l'ambiance générée.
  village: '/sons/theme.mp3',
  temps_libre: '',
  combat: '',
  tension: '',
  deuil: '',
  bilan: '',
  fin: '',
};

/** Effets courts, joués une fois. Même principe : une URL par effet. */
export type Effet = 'choix' | 'eveil' | 'touche' | 'esquive' | 'riposte' | 'achat' | 'page';

export const EFFETS: Partial<Record<Effet, string>> = {
  choix: '',
  eveil: '',
  touche: '',
  esquive: '',
  riposte: '',
  achat: '',
  page: '',
};

/** La piste à jouer, avec repli sur « village » si l'URL est vide. */
export function urlPiste(p: Piste): string | undefined {
  return MUSIQUES[p] || MUSIQUES.village || undefined;
}

/** Identifiant d'une vidéo YouTube, si l'URL en est une. */
export function idYoutube(url?: string): string | undefined {
  if (!url) return undefined;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1];
}
