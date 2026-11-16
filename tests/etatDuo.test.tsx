// Le bandeau « vous deux » : vos âges, qui est libre, le prochain moment ensemble ; rien de ce que l'autre vit en privé.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EtatDuo } from '../src/ui/campagne/Campagne';
import { campagneDe, jouer } from './aideCampagne';

describe('Le bandeau à deux', () => {
  it('montre les deux prénoms, les deux âges et ce qui vient, sans rien dévoiler de l’autre', () => {
    const c = jouer(campagneDe(1), 77, () => false, 60);
    const html = renderToStaticMarkup(<EtatDuo c={c} j={0} />);
    expect(html).toContain(c.creations[0].prenom);
    expect(html).toContain(c.creations[1].prenom);
    expect(html).toMatch(/\d+ ans · toi/);
    expect(html).toMatch(/libre|occupé·e|n’est plus/);
    // Jamais le titre d'une scène, ni le contenu de ce que l'autre est en train de vivre.
    const autre = c.joueurs[1].scene;
    if (autre.type === 'evenement') expect(html).not.toContain(autre.id);
    expect(html).not.toMatch(/drapeau|secret/i);
  });
});
