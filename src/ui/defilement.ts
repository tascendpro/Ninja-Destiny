/** Remonte en haut de l'écran : la zone de contenu du jeu défile seule, la page parfois aussi. */
export function remonter(): void {
  if (typeof document === 'undefined') return;
  document.querySelector('.coque.jeu > .contenu')?.scrollTo({ top: 0 });
  window.scrollTo({ top: 0 });
}
