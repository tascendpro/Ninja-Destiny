// Imports d'images : Next.js renvoie { src, width, height }, Vite renvoie une URL. medias.ts gère les deux.
declare module '*.jpg' {
  const image: { src: string; width: number; height: number };
  export default image;
}
declare module '*.webp' {
  const image: { src: string; width: number; height: number };
  export default image;
}
declare module '*.png' {
  const image: { src: string; width: number; height: number };
  export default image;
}
declare module '*.mp3' {
  const son: string;
  export default son;
}
