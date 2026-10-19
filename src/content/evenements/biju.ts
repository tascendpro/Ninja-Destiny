import type { Condition, EventDef } from '../../engine/types';

// Jinchūriki (tirage à la naissance, propre au village) et natures de fusion.
// Le joueur ne sait rien au départ : les regards, puis le sceau, puis la vérité.

const base = { chapitre: 1, arc: 'origines' as const };
const JINCHURIKI: Condition = { drapeau: 'jinchuriki' };
const ACTIF: Condition = { statut: 'actif' };

export const EVENEMENTS_BIJU: EventDef[] = [
  {
    ...base,
    id: 'b_regards',
    titre: 'Les regards',
    categorie: 'enfance',
    lieu: '$village',
    priorite: 70,
    si: { tout: [JINCHURIKI, ACTIF, { age: { min: 7, max: 10 } }] },
    personnages: ['@parent'],
    texte:
      'Depuis aussi loin que tu te souviennes, certains adultes changent de trottoir quand tu passes. Aujourd’hui, la marchande de brochettes fait semblant de ne pas te voir, puis sert l’enfant derrière toi. Une vieille femme tire son petit-fils par le bras en murmurant quelque chose que tu n’entends pas.\n\nTu n’as rien fait. Tu en es presque sûr{e}.',
    choix: [
      {
        id: 'demander',
        texte: 'Le soir, demander à {parent} pourquoi les gens te regardent comme ça',
        effets: [{ relation: '@parent', delta: { confiance: -3, attachement: 4 } }, { indice: 'regards_village' }],
        resultat:
          '{Parent} pose son bol un peu trop vite. « Les gens ont peur de ce qu’ils ne comprennent pas. » {Parent_il} te caresse les cheveux et change de sujet. Ce n’est pas une réponse. Tu le sais. {Parent_il} sait que tu le sais.',
      },
      {
        id: 'ignorer',
        texte: 'Faire comme si de rien n’était, et payer à la marchande suivante',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 4 }, { stat: 'attributs.charisme', delta: -1 }],
        resultat: 'Tu apprends ce jour-là un talent que tu n’as pas demandé : sourire quand on te serre la gorge. Il te servira plus que tu ne le voudrais.',
      },
      {
        id: 'colere',
        texte: 'Renverser l’étal de la marchande',
        effets: [{ stat: 'social.reputation', delta: -4 }, { stat: 'social.suspicion', delta: 3 }, { ethique: { honneur: -2 } }, { indice: 'chaleur_ventre' }],
        resultat:
          'Les brochettes roulent dans la poussière. La marchande ne crie pas : elle recule, livide, comme devant un chien enragé. Sur le chemin du retour, quelque chose brûle au creux de ton ventre, longtemps après que ta colère est retombée.',
      },
    ],
  },
  {
    ...base,
    id: 'b_sceau',
    titre: 'La fièvre',
    categorie: 'secret_familial',
    lieu: '$maison',
    priorite: 68,
    si: { tout: [JINCHURIKI, ACTIF, { vu: 'b_regards' }, { age: { min: 9, max: 12 } }] },
    personnages: ['@medecin'],
    texte:
      'Une fièvre te cloue au lit trois jours. La nuit du deuxième, en soulevant ta chemise trempée, tu vois sur ton ventre une spirale d’encre que tu n’avais jamais remarquée. Elle luit faiblement, comme une braise.\n\nAu matin, {@medecin} vient t’examiner. Puis, la nuit suivante, quelqu’un d’autre : des pas lourds, une voix basse dans le couloir. Celle du {kage}.',
    choix: [
      {
        id: 'ecouter',
        texte: 'Faire semblant de dormir, et écouter',
        effets: [{ stat: 'attributs.discretion', delta: 3 }, { indice: 'sceau_ventre' }, { drapeau: 'entendu_kage' }],
        resultat:
          '« Le sceau tient », dit le {kage}. « Mais il se nourrit de ses émotions. Si l’enfant apprend trop tôt, il risque de céder. » Une autre voix : « Et s’il apprend trop tard ? » Un long silence. Tu ne te rendors pas avant l’aube.',
      },
      {
        id: 'demander',
        texte: 'Te redresser et demander ce qu’est la marque sur ton ventre',
        effets: [{ relation: '@medecin', delta: { confiance: 5 } }, { stat: 'social.loyaute', delta: 2 }, { indice: 'sceau_ventre' }],
        resultat:
          'Le {kage} entre dans la chambre et s’assoit au bord du lit. « Un sceau de protection. Il te protège, et il protège le village. Un jour, je te dirai de quoi. Pas ce soir. » Il le dit avec une douceur qui te fait plus peur que n’importe quel cri.',
      },
      {
        id: 'cacher',
        texte: 'Tirer la couverture sur ton ventre et ne rien dire à personne',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 2 }, { indice: 'sceau_ventre' }],
        resultat: 'Tu gardes la spirale pour toi. Le matin, elle a pâli. Mais tu sais maintenant que ton corps abrite quelque chose que les adultes surveillent.',
      },
    ],
  },
  {
    ...base,
    id: 'b_fuite',
    titre: 'Ce que tu n’as pas vu',
    categorie: 'eveil',
    lieu: '$village',
    priorite: 92,
    si: { tout: [JINCHURIKI, ACTIF, { drapeau: 'eveil:chakra_biju' }] },
    personnages: ['@coequipierA'],
    texte:
      'Tu ne te souviens que du début : la peur, puis une chaleur qui monte du ventre jusqu’aux yeux. Ensuite, plus rien.\n\nC’est {@coequipierA} qui te raconte, à voix basse, sans oser te regarder. Un voile rouge autour de toi. Des yeux qui n’étaient pas les tiens. Et l’ennemi qui a fui, pas devant ta force, mais devant ce qu’il a reconnu.',
    choix: [
      {
        id: 'demander',
        texte: 'Exiger qu’on te dise la vérité',
        effets: [{ drapeau: 'exige_verite' }, { stat: 'attributs.controleEmotionnel', delta: -2 }],
        resultat: 'Tu vas jusqu’au bureau du {kage}. On te fait attendre une heure. Puis la porte s’ouvre.',
      },
      {
        id: 'ami',
        texte: 'Demander à {@coequipierA} si {il:@coequipierA} a peur de toi',
        effets: [{ relation: '@coequipierA', delta: { confiance: 8, attachement: 6 } }],
        resultat: '{@coequipierA} réfléchit longtemps. « Un peu. Mais tu m’as protégé{e:@coequipierA}. Alors je reste. » C’est la première fois que quelqu’un choisit de rester en connaissance de cause.',
      },
      {
        id: 'cacher',
        texte: 'Lui faire promettre de n’en parler à personne',
        effets: [
          { promesse: 'silence_fuite', pnj: '@coequipierA', texte: 'Ne jamais parler du voile rouge.' },
          { stat: 'social.suspicion', delta: 4 },
        ],
        resultat: '{@coequipierA} promet. Mais l’ennemi en fuite, lui, n’a rien promis. Et dans un village caché, rien ne reste caché bien longtemps.',
      },
    ],
  },
  {
    ...base,
    id: 'b_revelation',
    titre: 'Ce qui dort en toi',
    categorie: 'secret_familial',
    lieu: '$village',
    priorite: 91,
    si: { tout: [JINCHURIKI, ACTIF, { un: [{ vu: 'b_fuite' }, { age: { min: 12 } }] }] },
    personnages: ['@kage'],
    texte: [
      { si: { vu: 'b_fuite' }, texte: 'Le bureau du {kage} sent l’encre et le tabac froid. {@kage} ne te fait pas asseoir. « Tu as vu ce qui est sorti de toi. Tu as le droit de savoir ce que c’est. »' },
      { si: { nonVu: 'b_fuite' }, texte: 'Le jour de tes douze ans, un ninja masqué vient te chercher. Le bureau du {kage} sent l’encre et le tabac froid. {@kage} te regarde longtemps avant de parler. « Tu es en âge de savoir. »' },
      {
        texte:
          '« Le soir de ta naissance, nous avons scellé en toi {biju}. Pas pour te punir : parce que le village ne pouvait pas la garder autrement, et que seul un nouveau-né peut la porter. Les adultes qui détournent les yeux le savent. Toi seul{e}, tu l’ignorais. »',
      },
      { si: { tout: [{ clan: 'sans_clan' }, { drapeau: 'orphelin' }] }, texte: 'Tu poses la question qui te brûle : pourquoi toi ? {@kage} détourne les yeux. « Il fallait un enfant que personne ne viendrait réclamer. Pas de clan pour protester, pas de parents pour pleurer. » Il ne s’excuse pas. Il n’a jamais su comment.' },
      { si: { tout: [{ clan: 'sans_clan' }, { drapeau: 'orphelin', absent: true }] }, texte: 'Tu poses la question qui te brûle : pourquoi toi ? {@kage} soupire. « Les clans auraient refusé. Une famille du commun, on la dédommage, et elle se tait. » Tu comprends que ta mère le sait depuis toujours.' },
      { si: { non: { clan: 'sans_clan' } }, texte: 'Tu demandes pourquoi toi, un enfant de clan. « Parce que ton clan l’a proposé. Pour gagner une place au conseil. » Tu ne regarderas plus jamais ton clan de la même façon.' },
      { si: { drapeau: 'entendu_kage' }, texte: 'Tu reconnais la voix du couloir, la nuit de la fièvre. Tu ne dis rien. {@kage} le remarque.' },
    ],
    choix: [
      {
        id: 'colere',
        texte: '« Vous avez décidé à ma place. Tous. »',
        effets: [
          { secret: 'jinchuriki' },
          { drapeau: 'revele_biju' },
          { stat: 'social.loyaute', delta: -8 },
          { relation: '@kage', delta: { confiance: -5, respect: 4 } },
          { tenterEveil: 'chakra_biju', intensite: 35 },
          { succes: 'jinchuriki' },
        ],
        resultat: [
          { texte: '« Oui », dit {@kage}. « Et je le referais. Tu as le droit de m’en vouloir toute ta vie. » Ta colère cherche un mur et n’en trouve pas.' },
          { si: { maitrise: 'chakra_biju', eveille: true }, texte: 'Au creux de ton ventre, quelque chose ronronne. La bête aime ta colère. Tu le sens, et cela te fait plus peur que tout le reste.' },
        ],
      },
      {
        id: 'accepter',
        texte: '« Alors je la porterai. Mais plus personne ne me ment. »',
        effets: [
          { secret: 'jinchuriki' },
          { drapeau: 'revele_biju' },
          { stat: 'attributs.controleEmotionnel', delta: 6 },
          { stat: 'social.loyaute', delta: 4 },
          { relation: '@kage', delta: { confiance: 8, respect: 8 } },
          { succes: 'jinchuriki' },
        ],
        resultat: '{@kage} hoche la tête lentement, comme on scelle un accord. « Plus de mensonges. Mais certaines vérités devront attendre que tu sois assez fort{e} pour les entendre. » C’est déjà plus que ce qu’on t’a jamais donné.',
      },
      {
        id: 'avant',
        texte: 'Demander qui la portait avant toi',
        effets: [{ secret: 'jinchuriki' }, { drapeau: 'revele_biju' }, { indice: 'ancien_jinchuriki' }, { stat: 'attributs.intellect', delta: 2 }, { succes: 'jinchuriki' }],
        resultat:
          '{@kage} se tait un instant. « Quelqu’un de très courageux, qui est mort la nuit où tu es né{e}. » Il n’en dira pas plus aujourd’hui. Tu comprends que ta vie a commencé le jour où une autre s’est arrêtée.',
      },
    ],
  },
  {
    ...base,
    id: 'b_voix',
    titre: 'La voix derrière le sceau',
    categorie: 'eveil',
    lieu: '$maison',
    priorite: 66,
    si: { tout: [JINCHURIKI, ACTIF, { vu: 'b_revelation' }, { maitrise: 'chakra_biju', eveille: true }, { age: { min: 12 } }] },
    personnages: ['@sensei'],
    texte:
      'Cette nuit-là, tu rêves d’un couloir inondé et d’une grille immense. Derrière, deux yeux s’ouvrent, plus grands que des portes. Une voix fait vibrer l’eau autour de tes chevilles : « Alors c’est toi, cette fois. Si petit{e}. Si fragile. »',
    choix: [
      {
        id: 'repondre',
        texte: '« Je ne suis pas ta prison. Je suis ton gardien. »',
        effets: [{ drapeau: 'dialogue_biju' }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { ethique: { honneur: 4 } }],
        resultat: 'Un rire, ou un grondement. « Les gardiens meurent. Moi, j’attends. » Puis plus rien. Au réveil, tu as l’impression d’avoir été jugé{e}, et de ne pas avoir tout à fait échoué.',
      },
      {
        id: 'refuser',
        texte: 'Tourner le dos à la grille et te forcer à te réveiller',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 5 }],
        resultat: 'Tu te réveilles en sueur, le cœur au galop. La bête n’a pas insisté. Tu ne sais pas si c’est une victoire ou une patience qui te dépasse.',
      },
      {
        id: 'sensei',
        texte: 'Tout raconter à {@sensei} dès le matin',
        effets: [{ relation: '@sensei', delta: { confiance: 8 } }, { drapeau: 'mentor:chakra_biju' }, { entrainer: 'chakra_biju', jours: 30, mentor: true }],
        resultat:
          '{@sensei} ne se moque pas et ne panique pas. « Alors on va t’apprendre à respirer quand elle pousse. Tous les matins, avant les autres. » C’est le premier entraînement de ta vie qui ne sert pas à frapper plus fort, mais à tenir.',
      },
    ],
  },
  {
    ...base,
    arc: 'formation',
    id: 'n_fusion',
    titre: 'Deux natures',
    categorie: 'eveil',
    lieu: '$terrain',
    priorite: 88,
    si: { tout: [ACTIF, { drapeau: 'fusion' }] },
    texte: [
      { texte: 'Tu t’entraînes comme chaque jour quand tes deux natures, au lieu de se gêner, se rencontrent.' },
      { si: { drapeau: 'fusion', egal: 'yoton' }, texte: 'La terre sous tes paumes rougit, fume, puis coule. De la lave. Un instructeur qui passait s’arrête net : à Iwa, on sait ce que cela veut dire.' },
      { si: { drapeau: 'fusion', egal: 'futton' }, texte: 'Une vapeur brûlante jaillit de tes mains et ronge l’écorce du poteau. Le bois fume, piqué comme par un acide.' },
      { si: { drapeau: 'fusion', egal: 'shakuton' }, texte: 'L’air se resserre en une petite sphère incandescente. Elle effleure une branche, qui se dessèche et tombe en poussière.' },
      { si: { drapeau: 'fusion', egal: 'jiton' }, texte: 'Les kunai de ta sacoche se soulèvent tout seuls et viennent se coller à ton bras, comme des aiguilles à un aimant.' },
      { si: { drapeau: 'fusion', egal: 'ranton' }, texte: 'Un rayon de lumière liquide jaillit de tes doigts et se courbe, contre toute logique, pour frapper la cible par derrière.' },
      { si: { drapeau: 'fusion', egal: 'bakuton' }, texte: 'Une poignée de terre, une étincelle de foudre : le sol explose à deux pas de toi. Tu as les oreilles qui sifflent et le sourire aux lèvres.' },
      { texte: 'C’est une lignée. Elle dormait dans ton sang, et personne ne le savait, toi le premier.' },
    ],
    choix: [
      {
        id: 'cacher',
        texte: 'Le garder pour toi le temps de le comprendre',
        effets: [{ drapeau: 'fusion_cachee' }, { stat: 'attributs.discretion', delta: 2 }, { secret: 'lignee_fusion' }],
        resultat: 'Tu effaces les traces et rentres comme si de rien n’était. Un secret de plus. Celui-là, au moins, il est à toi.',
      },
      {
        id: 'sensei',
        texte: 'Le montrer à {@sensei}',
        effets: [{ relation: '@sensei', delta: { respect: 8 } }, { stat: 'social.reputation', delta: 5 }, { stat: 'social.suspicion', delta: 3 }, { secret: 'lignee_fusion' }],
        resultat: '{@sensei} regarde longtemps le sol brûlé. « Le village va s’intéresser à toi. Certains pour te protéger, d’autres pour s’en servir. Apprends à faire la différence. »',
      },
    ],
  },
];
