import type { GameState } from '../engine/types';

/** Remonte en haut de l'écran : la zone de contenu du jeu défile seule, la page parfois aussi. */
export function remonter(): void {
  if (typeof document === 'undefined') return;
  document.querySelector('.coque.jeu > .contenu')?.scrollTo({ top: 0 });
  window.scrollTo({ top: 0 });
}

/**
 * Identité d'un écran : elle ne change qu'au changement de scène, jamais à une action qui laisse sur le même écran
 * (répartir des points, acheter, offrir, s'équiper, activer ses yeux). C'est elle qui décide de la remise en haut.
 */
export function cleScene(s: GameState): string {
  const sc = s.scene;
  switch (sc.type) {
    case 'evenement':
      return `evenement-${sc.id}-${s.historique.length}`;
    case 'resultat':
      return `resultat-${sc.evenementId}-${s.historique.length}-${s.jour}`;
    case 'combat':
      return `combat-${sc.evenementId}-${sc.manche}`;
    case 'affrontement':
      // Le même écran d'une manche à l'autre : on ne remonte pas, la nouvelle manche s'affiche sous la précédente.
      return `affrontement-${sc.evenementId}-${s.historique.length}`;
    case 'temps_libre':
      return `temps_libre-${s.jour}`;
    case 'bilan':
      return `bilan-${sc.sequence}`;
    case 'fin':
      return `fin-${sc.id}`;
  }
}
