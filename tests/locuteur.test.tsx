// Les dialogues : celui qui parle est nommé au-dessus de sa réplique, seulement quand l'incise le désigne sans doute.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NomsColores, ParagrapheRecit } from '../src/ui/paroles';

const rendre = (texte: string) =>
  renderToStaticMarkup(
    <NomsColores.Provider value={[{ nom: 'Minoru', teinte: 120 }, { nom: 'Aoi', teinte: 300 }, { nom: 'Sōma', couleur: 'red', joueur: 'solo' }]}>
      <ParagrapheRecit texte={texte} />
    </NomsColores.Provider>,
  );

describe('Qui parle', () => {
  it('une incise qui nomme un personnage connu affiche son nom au-dessus de la réplique', () => {
    const html = rendre('« Tu viens ? » demande Minoru. Il attend.');
    expect(html).toContain('class="locuteur"');
    expect(html).toMatch(/<i>M<\/i>Minoru/);
  });
  it('pas d’étiquette quand c’est toi qui parles, quand deux personnes sont nommées, ou sans incise', () => {
    expect(rendre('« Non », réponds-tu à Minoru.')).not.toContain('class="locuteur"');
    expect(rendre('« Ensemble », disent Minoru et Aoi.')).not.toContain('class="locuteur"');
    expect(rendre('« Personne ne viendra. »')).not.toContain('class="locuteur"');
  });
});
