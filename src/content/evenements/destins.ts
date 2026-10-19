// Destins qui varient d'une vie à l'autre : le deuil qui éveille un œil, et les dōjutsu que l'on obtient
// par des voies peu glorieuses (marché noir, mourant, savant fou, cadavre sur un champ de bataille).
// Les rencontres sont tirées au hasard pendant le temps libre : chaque vie en croise une, plusieurs, ou aucune.

import type { Condition, EventDef } from '../../engine/types';

const base = { chapitre: 1, arc: 'heritage' as const };
const PARENT_VIVANT: Condition = { pnj: '@parent', etat: ['vivant', 'blesse'] };
const AINE_VIVANT: Condition = { pnj: '@aine', etat: ['vivant', 'blesse'] };
const SANS_OEIL: Condition = { tout: [{ drapeau: 'oeil_greffe', absent: true }, { nonVu: 'x_oeil_marche' }, { nonVu: 'x_oeil_mourant' }, { nonVu: 'x_oeil_savant' }, { nonVu: 'x_oeil_cadavre' }, { non: { maitrise: 'sharingan', eveille: true } }, { non: { maitrise: 'byakugan', eveille: true } }] };
const ADO_ADULTE = [2, 3, 4, 5, 6];

const SHARINGAN_OU_BYAKUGAN = (oeil: 'sharingan' | 'byakugan') => ({ greffer: oeil });

export const DESTINS: EventDef[] = [
  {
    ...base,
    id: 'x_deuil_famille',
    titre: 'La maison silencieuse',
    categorie: 'deuil',
    lieu: '$maison',
    enchaine: true,
    planifieParMoteur: true,
    chapitres: [1, 2, 3, 4, 5, 6],
    si: { tout: [{ statut: 'actif' }, { un: [PARENT_VIVANT, AINE_VIVANT] }] },
    texte: [
      { texte: 'Tu rentres de mission, fatigué·e, fier·e. La porte de la maison est ouverte. Des voisins attendent dans la cour, et personne n’ose te regarder.' },
      { si: AINE_VIVANT, texte: '{AineNom} est mort{aine_e} pendant que tu étais loin, dans une embuscade dont personne ne veut te dire le détail. On a déjà allumé l’encens.' },
      { si: { tout: [{ non: AINE_VIVANT }, PARENT_VIVANT] }, texte: '{Parent} est mort{parent_e} pendant que tu étais loin. Une mission de routine, disent-ils. Il n’y a pas de mission de routine.' },
      { si: { clan: 'uchiha' }, texte: 'Quelque chose brûle derrière tes yeux. Une douleur que tu ne connais pas, qui n’est pas tout à fait de la douleur.' },
    ],
    choix: [
      {
        id: 'hurler',
        texte: 'Laisser éclater ta douleur',
        effets: [
          { si: AINE_VIVANT, alors: [{ pnjEtat: '@aine', etat: 'mort', cause: 'mort·e pendant que tu étais en mission' }], sinon: [{ pnjEtat: '@parent', etat: 'mort', cause: 'mort·e pendant que tu étais en mission' }] },
          { drapeau: 'deuil_famille' },
          { drapeau: 'perte_tragique' },
          { tenterEveil: 'sharingan', intensite: 75 },
          { tenterEveil: 'mangekyo', intensite: 40 },
          { eveilDanger: 45 },
          { stat: 'attributs.controleEmotionnel', delta: -3 },
        ],
        resultat: 'Tu cries jusqu’à ne plus avoir de voix. Quand tu relèves la tête, le monde a changé de couleur, ou peut-être c’est toi.',
      },
      {
        id: 'tenir',
        texte: 'Tenir debout, pour les autres',
        effets: [
          { si: AINE_VIVANT, alors: [{ pnjEtat: '@aine', etat: 'mort', cause: 'mort·e pendant que tu étais en mission' }], sinon: [{ pnjEtat: '@parent', etat: 'mort', cause: 'mort·e pendant que tu étais en mission' }] },
          { drapeau: 'deuil_famille' },
          { drapeau: 'perte_tragique' },
          { tenterEveil: 'sharingan', intensite: 55 },
          { tenterEveil: 'mangekyo', intensite: 25 },
          { stat: 'attributs.controleEmotionnel', delta: 4 },
          { ethique: { compassion: 4 } },
        ],
        resultat: 'Tu organises les funérailles, tu reçois les condoléances, tu ne pleures pas. Le soir, seul·e devant l’autel, tes yeux te brûlent comme jamais.',
      },
    ],
  },

  // ───────── Les yeux des autres ─────────
  {
    ...base,
    id: 'x_oeil_marche',
    titre: 'Le marchand de bocaux',
    categorie: 'organisation',
    lieu: 'marche_noir',
    poids: 0.35,
    rare: true,
    chapitres: ADO_ADULTE,
    si: { tout: [{ age: { min: 15 } }, SANS_OEIL] },
    texte: 'Dans l’arrière-boutique d’un apothicaire de Kōsai, des bocaux alignés dans un liquide trouble. Le marchand soulève un drap : deux yeux, l’un rouge à trois virgules, l’autre blanc et sans pupille. « Volés sur des cadavres, ou sur des vivants, je ne pose pas de question. Un chirurgien attend à côté. »',
    choix: [
      {
        id: 'sharingan',
        texte: 'Acheter l’œil rouge (2 000 ryō)',
        si: { stat: 'jauges.ryo', min: 2000 },
        verrou: 'Il te faudrait 2 000 ryō.',
        test: {
          type: 'competence',
          difficulte: 48,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          succes: { texte: 'Trois jours de fièvre dans une chambre sans fenêtre. Au quatrième, tu ouvres les yeux, et l’un d’eux voit le chakra couler dans les murs.', effets: [{ stat: 'jauges.ryo', delta: -2000 }, SHARINGAN_OU_BYAKUGAN('sharingan'), { stat: 'social.suspicion', delta: 8 }, { stat: 'social.reputationOmbre', delta: 5 }] },
          echec: { texte: 'La greffe prend, mais mal. Tu gardes l’œil, une fièvre qui revient chaque hiver, et une dette envers le chirurgien.', effets: [{ stat: 'jauges.ryo', delta: -2000 }, SHARINGAN_OU_BYAKUGAN('sharingan'), { stat: 'jauges.sante', delta: -30 }, { stat: 'social.suspicion', delta: 12 }] },
        },
      },
      {
        id: 'byakugan',
        texte: 'Acheter l’œil blanc (1 500 ryō)',
        si: { stat: 'jauges.ryo', min: 1500 },
        verrou: 'Il te faudrait 1 500 ryō.',
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { controleChakra: 2, controleEmotionnel: 2 },
          succes: { texte: 'Quand on retire les bandages, tu vois à travers les murs, à travers les gens, jusqu’à leurs points de chakra. Le marchand sourit : « Ne dis jamais d’où il vient. Les Hyūga tuent pour moins que ça. »', effets: [{ stat: 'jauges.ryo', delta: -1500 }, SHARINGAN_OU_BYAKUGAN('byakugan'), { stat: 'social.suspicion', delta: 8 }] },
          echec: { texte: 'Tu vois, mais tout tremble, et tes migraines durent des semaines.', effets: [{ stat: 'jauges.ryo', delta: -1500 }, SHARINGAN_OU_BYAKUGAN('byakugan'), { stat: 'jauges.sante', delta: -25 }] },
        },
      },
      {
        id: 'denoncer',
        texte: 'Dénoncer ce trafic',
        effets: [{ ethique: { honneur: 6 } }, { stat: 'social.reputation', delta: 4 }, { stat: 'social.reputationOmbre', delta: -6 }],
        resultat: 'La boutique brûle la nuit suivante. Personne ne sait qui a mis le feu. Tu n’en es pas sûr·e non plus.',
      },
      { id: 'partir', texte: 'Partir sans rien dire', effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: 'Tu ressors dans la rue. Tu sens encore l’odeur du liquide sur tes vêtements.' },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'x_oeil_mourant',
    titre: 'Le dernier cadeau',
    categorie: 'deuil',
    lieu: 'frontiere_herbe',
    poids: 0.35,
    rare: true,
    chapitres: [3, 4, 5],
    si: { tout: [{ age: { min: 15 } }, SANS_OEIL] },
    texte: 'Dans les ruines d’un poste de frontière, un ninja d’un clan au dōjutsu agonise. Il ne survivra pas à la nuit. Il te reconnaît : vous vous êtes battus côte à côte, une fois. « Prends mes yeux. Je ne veux pas qu’ils finissent dans un bocal. Il y a un médecin à deux heures d’ici. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter son dernier cadeau',
        effets: [{ hasard: [{ poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('sharingan')] }, { poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('byakugan')] }] }, { ethique: { compassion: 4 } }, { journal: 'Tu portes les yeux d’un frère d’armes mort à la frontière.', importance: 3 }],
        resultat: 'Il meurt avant l’aube, ta main dans la sienne. Le médecin fait le reste. Quand tu ouvres les yeux, c’est un peu lui qui regarde.',
      },
      {
        id: 'refuser',
        texte: 'Refuser, et rester avec lui jusqu’au bout',
        effets: [{ ethique: { compassion: 8, honneur: 4 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu lui tiens compagnie jusqu’à la fin. Tu ramènes son corps à son clan, avec ses yeux. Ils ne l’oublieront pas.',
      },
    ],
  },
  {
    ...base,
    id: 'x_oeil_savant',
    titre: 'L’homme aux serpents',
    categorie: 'organisation',
    lieu: 'temple_oublie',
    poids: 0.35,
    rare: true,
    chapitres: ADO_ADULTE,
    si: { tout: [{ age: { min: 14 } }, SANS_OEIL] },
    texte: 'Un homme pâle à la voix douce t’aborde sur la route. Il connaît ton nom, ton clan, tes faiblesses. « Je collectionne les dons. J’ai un œil qui attend un porteur, et une curiosité : voir si ton corps l’acceptera. Je ne te demande rien d’autre. Pour l’instant. »',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter l’expérience',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { controleChakra: 2, controleEmotionnel: 1, force: 1 },
          succes: { texte: 'Tu te réveilles dans une grotte, seul·e. L’œil est là, il obéit. Sur ton bras, une marque en forme de serpent que tu n’avais pas avant.', effets: [{ hasard: [{ poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('sharingan')] }, { poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('byakugan')] }] }, { drapeau: 'marque_serpent' }, { stat: 'social.suspicion', delta: 10 }] },
          echec: { texte: 'Ton corps rejette la greffe. Tu te réveilles sur la route, l’œil bandé et vide, avec une marque en forme de serpent sur le bras et trois semaines de ta vie en moins.', effets: [{ stat: 'jauges.sante', delta: -40 }, { drapeau: 'marque_serpent' }, { temps: 21 }] },
        },
      },
      { id: 'fuir', texte: 'Refuser et t’éloigner, vite', effets: [{ stat: 'attributs.perception', delta: 1 }], resultat: 'Il ne te suit pas. Il n’en a pas besoin : il sait où te trouver.' },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'x_oeil_cadavre',
    titre: 'Ce que portent les morts',
    categorie: 'mission',
    lieu: 'frontiere_herbe',
    poids: 0.35,
    rare: true,
    chapitres: [2, 3, 4],
    si: { tout: [{ age: { min: 14 } }, SANS_OEIL] },
    texte: 'Au retour d’une mission, dans un ravin, le corps d’un ninja ennemi tué il y a peu. Son bandeau est celui d’un clan au dōjutsu. Personne ne te voit. Personne ne saura.',
    choix: [
      {
        id: 'prendre',
        texte: 'Prendre ses yeux et trouver un médecin qui ne pose pas de questions',
        test: {
          type: 'competence',
          difficulte: 55,
          attributs: { discretion: 2, controleChakra: 1, controleEmotionnel: 1 },
          succes: { texte: 'Un médecin déchu, une table de cuisine, une nuit. L’œil prend. Tu ne regarderas plus jamais un cadavre de la même façon.', effets: [{ hasard: [{ poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('sharingan')] }, { poids: 1, effets: [SHARINGAN_OU_BYAKUGAN('byakugan')] }] }, { ethique: { honneur: -8 } }, { stat: 'social.reputationOmbre', delta: 6 }] },
          echec: { texte: 'Les yeux s’abîment pendant le voyage. Il ne te reste qu’un souvenir que tu aimerais ne pas avoir.', effets: [{ ethique: { honneur: -6 } }, { stat: 'attributs.controleEmotionnel', delta: -2 }] },
        },
      },
      { id: 'enterrer', texte: 'L’enterrer, avec ses yeux', effets: [{ ethique: { honneur: 6, compassion: 4 } }], resultat: 'Tu creuses avec un kunai pendant une heure. Ennemi ou pas, il avait une mère.' },
    ],
  },
];
