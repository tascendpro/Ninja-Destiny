import { describe, expect, it } from 'vitest';
import { decouper } from '../src/ui/repliques';

const rendu = (p: string) => decouper(p).map((l) => (l.replique ? '— ' : '') + l.morceaux.map((m) => m.texte).join(''));

describe('La mise en page des dialogues', () => {
  it('chaque réplique part à la ligne, le récit entre deux répliques reste à part', () => {
    expect(rendu('« Hé ! Attends-moi ! » Aya te rattrape en courant. « C’est toi qui traînes », tu réponds. « C’est faux. Regarde ! » Dans sa paume, une pierre.')).toEqual([
      '— Hé ! Attends-moi !',
      'Aya te rattrape en courant.',
      '— C’est toi qui traînes, tu réponds.',
      '— C’est faux. Regarde !',
      'Dans sa paume, une pierre.',
    ]);
  });

  it('après « dit-il », la parole qui suit est la même voix : elle reste sur la ligne', () => {
    expect(rendu('Il a changé. « Toi aussi, tu t’es fait une équipe », dit-il. « Voyons si ça t’a rendu plus fort. »')).toEqual([
      'Il a changé.',
      '— Toi aussi, tu t’es fait une équipe, dit-il. Voyons si ça t’a rendu plus fort.',
    ]);
  });

  it('après une incise nommée sans inversion, la même voix continue ; après « tu dis », l’autre reprend', () => {
    expect(rendu('« Toi, tu fais l’ennemi », décide le plus grand. « Avec le petit, là. » Le petit a peur.')).toEqual([
      '— Toi, tu fais l’ennemi, décide le plus grand. Avec le petit, là.',
      'Le petit a peur.',
    ]);
    expect(rendu('« Promis ? » « Promis », tu dis. « Alors viens. »')).toEqual(['— Promis ?', '— Promis, tu dis.', '— Alors viens.']);
  });

  it('deux répliques collées sont deux voix', () => {
    expect(rendu('« Promis ? » « Promis. »')).toEqual(['— Promis ?', '— Promis.']);
  });

  it('un nom ou un titre entre guillemets n’est pas une parole', () => {
    expect(rendu('On l’appelle « le Héron » dans tout le pays.')).toEqual(['On l’appelle «le Héron» dans tout le pays.'.replace('«le Héron»', '« le Héron »')]);
  });

  it('un paragraphe sans parole reste un seul bloc', () => {
    expect(decouper('Il pleut. Personne ne parle.')).toEqual([{ replique: false, morceaux: [{ texte: 'Il pleut. Personne ne parle.' }] }]);
  });

  it('les paroles sont marquées pour le style, l’incise ne l’est pas', () => {
    const [l] = decouper('« Viens », souffle-t-elle.');
    expect(l.morceaux).toEqual([{ texte: 'Viens', parole: true }, { texte: ', souffle-t-elle.' }]);
  });
});
