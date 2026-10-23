import type { Condition, EventDef } from '../../engine/types';

/**
 * Techniques à deux : quand l'amitié et la confiance avec un équipier sont assez fortes, vos deux natures se mêlent.
 * La technique créée ne se lance qu'avec cet équipier dans la scène. Le nom de la technique est donné par le moteur.
 */
const ACTIF: Condition = { statut: 'actif' };

function duo(ref: '@coequipierA' | '@coequipierB', id: string): EventDef {
  return {
    id,
    titre: `Deux natures, {@${ref.slice(1)}} et toi`,
    categorie: 'entrainement',
    lieu: '$terrain',
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    poids: 9,
    personnages: [ref],
    si: { tout: [ACTIF, { rangMin: 'genin' }, { age: { min: 13 } }, { duo: ref }] },
    texte: [
      {
        texte: `Le soir tombe sur le terrain. {${ref}} lance encore sa technique contre le même rocher, et la tienne part juste après, par réflexe. Les deux se touchent en l’air. Pendant une demi-seconde, ce n’est plus ni la sienne ni la tienne : c’est autre chose, plus gros, qui fend le rocher en deux. Vous vous regardez sans rien dire.`,
      },
      { si: { relation: ref, axe: 'amitie', min: 80 }, texte: `« Tu l’as senti aussi ? » {Il:${ref}} rit, nerveux. Tu sais déjà que vous allez y passer la nuit.` },
    ],
    choix: [
      {
        id: 'nuit',
        texte: 'Y passer la nuit, jusqu’à ce que ça sorte à chaque fois',
        duree: 20,
        effets: [{ duo: ref }, { relation: ref, delta: { amitie: 6, confiance: 6, attachement: 4 } }, { stat: 'attributs.controleChakra', delta: 2 }, { stat: 'jauges.fatigue', delta: 25 }],
        resultat: `Il faut quarante essais. Au quarante et unième, vos signes tombent ensemble, et la technique sort entière. Vous restez assis dans l’herbe brûlée jusqu’à l’aube. Elle n’est à aucun de vous deux : elle est à vous deux. Seul·e, tu n’en as que la moitié.`,
      },
      {
        id: 'secret',
        texte: 'La garder pour vous deux, sans rien dire à personne',
        duree: 20,
        effets: [{ duo: ref }, { relation: ref, delta: { confiance: 10, attachement: 6 } }, { drapeau: 'duo_secret' }],
        resultat: `Vous la travaillez la nuit, loin des terrains du village. Personne ne sait. Le jour où vous la lancerez devant quelqu’un, ce sera devant un ennemi.`,
      },
      {
        id: 'refuser',
        texte: '« Je préfère compter sur mes propres techniques. »',
        effets: [{ relation: ref, delta: { amitie: -4, confiance: -6 } }, { drapeau: `duo_refuse_${ref.slice(1)}` }],
        resultat: `{${ref}} hausse les épaules, mais tu vois bien que ça compte pour {lui:${ref}}. Vous rentrez sans parler. Le rocher fendu reste au bord du terrain longtemps après.`,
      },
    ],
  };
}

export const DUOS: EventDef[] = [duo('@coequipierA', 'eq_duo_a'), duo('@coequipierB', 'eq_duo_b')];
