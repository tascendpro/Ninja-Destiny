import type { Condition, EventDef } from '../../engine/types';

/**
 * Les conversations en plusieurs temps. Chaque réponse a un ton (affiché sur le choix) et mène à une suite différente :
 * la conversation se poursuit, change de direction, ou tourne court si l'on a mal parlé. Les ouvertures sont tirées
 * pendant le temps libre ; les suites (enchaine) ne s'atteignent que par la réponse donnée.
 * À la fin, trois scènes où l'on te renvoie ta façon de parler (drapeaux « ton_… », comptés par le moteur).
 */
const TOUS = [1, 2, 3, 4, 5, 6];
const ACTIF: Condition = { statut: 'actif' };
const VIVANT = (role: string): Condition => ({ pnj: role, etat: ['vivant', 'blesse'] });
const base = { chapitre: 1, chapitres: TOUS, lieu: '$village' };
const suiteDe = (pnj: string) => ({ ...base, enchaine: true, si: { tout: [ACTIF, VIVANT(pnj)] } as Condition, personnages: [pnj] });

export const DIALOGUES: EventDef[] = [
  // ══ 1. La veille de l'examen, avec {@coequipierA} ══
  {
    ...base,
    id: 'dg_veille_examen',
    titre: 'La nuit d’avant l’examen',
    arc: 'examens',
    categorie: 'amitie',
    poids: 12,
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { age: { min: 11, max: 13 } }, { rang: ['eleve', 'genin'] }] },
    texte:
      'Il est tard. Tu ne dors pas, alors tu montes sur le toit, et {@coequipierA} y est déjà, les genoux sous le menton. {Il:@coequipierA} ne se retourne pas. « Tu crois que je vais rater, demain ? »',
    choix: [
      { id: 'rassurer', ton: 'chaleureux', texte: '« Tu vas réussir. Je le sais. »', suite: 'dg_veille_confiance' },
      { id: 'franc', ton: 'franc', texte: '« Peut-être. Mais ça ne changera rien entre nous. »', suite: 'dg_veille_verite' },
      { id: 'pique', ton: 'moqueur', texte: '« Toi, rater ? Ça ne m’étonnerait pas. »', suite: 'dg_veille_blesse' },
      { id: 'asseoir', ton: 'silence', texte: 'T’asseoir à côté, sans rien dire', suite: 'dg_veille_verite' },
    ],
  },
  {
    ...suiteDe('@coequipierA'),
    id: 'dg_veille_confiance',
    titre: 'Ce qu’on ne dit qu’une fois',
    arc: 'examens',
    categorie: 'amitie',
    texte:
      '{@coequipierA} souffle, et ses épaules descendent d’un coup. « Tu dis ça pour me faire plaisir. » Un temps. « Mais merci. » {Il:@coequipierA} regarde les lumières du village. « Tu veux savoir pourquoi je veux tellement ce bandeau ? Ma famille doit de l’argent à des gens qui n’attendent pas. Un genin, ça touche une solde. Si je rate, c’est ma petite sœur qui ira travailler à leur place. »',
    choix: [
      {
        id: 'promettre',
        ton: 'chaleureux',
        texte: '« Alors on réussit tous les deux, et je t’aide à payer. »',
        effets: [{ relation: '@coequipierA', delta: { attachement: 10, confiance: 8 } }, { drapeau: 'dg_veille', valeur: 'promesse' }, { souvenir: 'La veille de l’examen, sur le toit, tu lui as promis de l’aider à payer la dette de sa famille.', pnj: '@coequipierA' }],
        resultat: '{@coequipierA} te regarde comme si tu venais de dire une énormité. Puis {il:@coequipierA} rit, la voix cassée. « Tu ne parles pas sérieusement. » « Si. » Vous restez là jusqu’à ce que le ciel pâlisse. Tu dors deux heures. C’est la meilleure nuit avant un examen que tu connaîtras.',
      },
      {
        id: 'rire',
        ton: 'humour',
        texte: '« Alors interdiction de rater. Ta sœur cuisine trop mal pour qu’on la laisse travailler. »',
        effets: [{ relation: '@coequipierA', delta: { amitie: 8 } }, { drapeau: 'dg_veille', valeur: 'rire' }],
        resultat: '« Elle cuisine très bien ! » « Elle a brûlé de l’eau, la dernière fois. » {@coequipierA} éclate de rire, si fort qu’une fenêtre s’ouvre en bas et qu’un voisin vous insulte. Vous redescendez en vous poussant. La peur est toujours là, mais elle a rétréci.',
      },
      {
        id: 'dur',
        ton: 'franc',
        texte: '« Et si tu n’étais pas fait{e:@coequipierA} pour être ninja ? Il y a d’autres façons de gagner de l’argent. »',
        effets: [{ relation: '@coequipierA', delta: { confiance: -4, respect: 4 } }, { drapeau: 'dg_veille', valeur: 'doute' }],
        resultat: 'Le silence dure longtemps. « Tu crois que je n’y ai pas pensé ? » {Il:@coequipierA} se lève. « Il n’y a pas d’autre façon assez rapide. » {Il:@coequipierA} redescend sans te dire bonne nuit. Le lendemain, à l’examen, {il:@coequipierA} ne te regarde pas une seule fois.',
      },
    ],
  },
  {
    ...suiteDe('@coequipierA'),
    id: 'dg_veille_verite',
    titre: 'Les deux qui ne dorment pas',
    arc: 'examens',
    categorie: 'amitie',
    texte:
      '{@coequipierA} hoche la tête, lentement. « C’est la seule réponse honnête qu’on m’ait faite aujourd’hui. » Un chat traverse le toit d’en face. « Et toi ? Tu as peur ? »',
    choix: [
      {
        id: 'avouer',
        ton: 'franc',
        texte: '« J’ai les mains qui tremblent depuis ce matin. »',
        effets: [{ relation: '@coequipierA', delta: { confiance: 10, amitie: 6 } }, { drapeau: 'dg_veille', valeur: 'aveu' }, { souvenir: 'La veille de l’examen, vous vous êtes avoué que vous aviez peur, tous les deux.', pnj: '@coequipierA' }],
        resultat: '{@coequipierA} prend ta main, la regarde trembler, et pose la sienne à côté. Elle tremble aussi. « Bon. Au moins on sera deux à rater nos signes. » Vous riez, et ça ne tremble plus tout à fait autant.',
      },
      {
        id: 'mentir',
        ton: 'mensonge',
        texte: '« Non. Pas du tout. »',
        effets: [{ relation: '@coequipierA', delta: { confiance: -3 } }, { drapeau: 'dg_veille', valeur: 'mur' }],
        resultat: '« Tu mens », dit {@coequipierA}, doucement, sans reproche. {Il:@coequipierA} n’insiste pas. Tu as dressé un mur ; {il:@coequipierA} le respecte. C’est peut-être pire.',
      },
      {
        id: 'plaisanter',
        ton: 'humour',
        texte: '« Moi ? Je n’ai peur que d’une chose : de ta tête si tu rates. »',
        effets: [{ relation: '@coequipierA', delta: { amitie: 7 } }, { drapeau: 'dg_veille', valeur: 'rire' }],
        resultat: '« Ma tête ? » {@coequipierA} fait une grimace abominable. Tu fais pire. Le concours de grimaces dure une demi-heure. Le lendemain, pendant l’épreuve des clones, tu repenses à sa grimace, et tes mains ne tremblent plus.',
      },
    ],
  },
  {
    ...suiteDe('@coequipierA'),
    id: 'dg_veille_blesse',
    titre: 'Le mot de trop',
    arc: 'examens',
    categorie: 'amitie',
    texte: '{@coequipierA} se tourne enfin. Ses yeux brillent, et ce n’est pas la lune. « Je savais que je n’aurais pas dû te demander. » {Il:@coequipierA} se lève pour partir.',
    choix: [
      {
        id: 'excuser',
        ton: 'chaleureux',
        texte: '« Attends. C’était idiot. J’ai peur moi aussi, alors je dis n’importe quoi. »',
        effets: [{ relation: '@coequipierA', delta: { confiance: 4, amitie: 3 } }, { drapeau: 'dg_veille', valeur: 'rattrape' }],
        resultat: '{@coequipierA} s’arrête au bord du toit. Un long moment. Puis {il:@coequipierA} revient s’asseoir, plus loin qu’avant, mais {il:@coequipierA} revient. « Tu dis toujours n’importe quoi quand tu as peur. » « Je sais. » « Il faudrait que tu arrêtes, un jour. »',
      },
      {
        id: 'insister',
        ton: 'moqueur',
        texte: '« Fuis, c’est ce que tu fais de mieux. »',
        effets: [{ relation: '@coequipierA', delta: { hostilite: 8, amitie: -8, confiance: -6 } }, { drapeau: 'dg_veille', valeur: 'rupture' }, { souvenir: 'La veille de l’examen, sur le toit, tu as eu le mot de trop, puis un autre.', pnj: '@coequipierA' }],
        resultat: '{@coequipierA} ne répond rien. {Il:@coequipierA} descend. Tu restes seul{e} sur le toit, avec ta phrase qui tourne dans le froid. Le lendemain, {il:@coequipierA} réussit l’examen sans toi à côté, et ne te le dit pas.',
      },
      {
        id: 'laisser',
        ton: 'silence',
        texte: 'Le laisser partir',
        effets: [{ relation: '@coequipierA', delta: { amitie: -4 } }, { drapeau: 'dg_veille', valeur: 'mur' }],
        resultat: 'Tu ne dis rien. {@coequipierA} disparaît par la trappe. Tu sais exactement ce qu’il aurait fallu dire. Tu le sais encore des années plus tard.',
      },
    ],
  },

  // ══ 2. Le sensei, après l'enterrement ══
  {
    ...base,
    id: 'dg_sensei_sake',
    titre: 'Le sensei, seul au comptoir',
    arc: 'formation',
    categorie: 'deuil',
    poids: 10,
    personnages: ['@sensei'],
    si: { tout: [ACTIF, VIVANT('@sensei'), { rang: ['genin', 'chunin'] }, { age: { min: 13, max: 20 } }] },
    texte:
      'On a enterré ce matin un jōnin que tu connaissais à peine. Ce soir, en passant devant la taverne, tu vois {@sensei} au comptoir, seul{e:@sensei}, trois bouteilles vides devant {lui:@sensei}. {Il:@sensei} ne t’a pas vu{e}.',
    choix: [
      { id: 'asseoir', ton: 'silence', texte: 'T’asseoir à côté, sans rien dire', suite: 'dg_sensei_histoire' },
      { id: 'demander', ton: 'franc', texte: '« Qui c’était, pour vous ? »', suite: 'dg_sensei_mur' },
      { id: 'ramener', ton: 'chaleureux', texte: '« Venez. Je vous raccompagne. »', suite: 'dg_sensei_chemin' },
      { id: 'bouteille', ton: 'froid', texte: 'Retirer la bouteille de sa main : « Vous avez assez bu. »', suite: 'dg_sensei_mur' },
    ],
  },
  {
    ...suiteDe('@sensei'),
    id: 'dg_sensei_histoire',
    titre: 'Ce qu’il raconte',
    arc: 'formation',
    categorie: 'deuil',
    texte:
      'Longtemps, rien. Puis {@sensei} parle, à son verre plus qu’à toi. « On était trois, comme vous. Une mission de rang C qui a mal tourné. Il s’est mis devant moi. Il avait quinze ans. » {Il:@sensei} tourne enfin la tête. « Tu ferais quoi, toi, avec une vie que quelqu’un t’a donnée ? »',
    choix: [
      {
        id: 'deux',
        ton: 'chaleureux',
        texte: '« Je la vivrais pour deux. »',
        effets: [{ relation: '@sensei', delta: { attachement: 8, respect: 6 } }, { drapeau: 'dg_sensei', valeur: 'pour_deux' }, { souvenir: 'Au comptoir, ton sensei t’a parlé de celui qui était mort pour lui. Tu lui as dit : vivre pour deux.', pnj: '@sensei' }],
        resultat: '{@sensei} te regarde longtemps. « Pour deux. » {Il:@sensei} repousse la bouteille. « C’est ce que je croyais faire. Je crois que j’ai surtout vécu à moitié. » {Il:@sensei} pose de l’argent sur le comptoir et se lève, plus droit qu’en arrivant. « Demain, entraînement à l’aube. Ne sois pas en retard. »',
      },
      {
        id: 'sais_pas',
        ton: 'franc',
        texte: '« Je ne sais pas. Je crois que je m’en voudrais tout le temps. »',
        effets: [{ relation: '@sensei', delta: { confiance: 8 } }, { drapeau: 'dg_sensei', valeur: 'honnete' }],
        resultat: '« Oui. » {@sensei} a un rire sans joie. « Tout le temps. C’est exactement ça. » {Il:@sensei} ne dit plus rien, mais {il:@sensei} ne boit plus non plus. Quand tu pars, {il:@sensei} pose une main sur ta tête, maladroitement, comme on le fait à un enfant. Tu ne protestes pas.',
      },
      {
        id: 'oublier',
        ton: 'froid',
        texte: '« J’essaierais d’oublier. Les morts ne demandent rien. »',
        effets: [{ relation: '@sensei', delta: { respect: -2, confiance: -4 } }, { drapeau: 'dg_sensei', valeur: 'oublier' }],
        resultat: '{@sensei} hoche la tête, lentement. « C’est ce qu’on nous apprend. » {Il:@sensei} se ressert. « J’espère que tu y arriveras mieux que moi. » Le ton est poli. La porte, entre vous, s’est refermée pour ce soir.',
      },
    ],
  },
  {
    ...suiteDe('@sensei'),
    id: 'dg_sensei_mur',
    titre: 'Pas tes affaires',
    arc: 'formation',
    categorie: 'deuil',
    texte: '« Ce ne sont pas tes affaires. » La voix de {@sensei} claque, assez fort pour que le patron lève les yeux. Puis {il:@sensei} se frotte le visage. « Pardon. Ce n’est pas contre toi. Rentre chez toi. »',
    choix: [
      {
        id: 'rester',
        ton: 'silence',
        texte: 'Rester quand même, et commander un thé',
        effets: [{ relation: '@sensei', delta: { attachement: 7, confiance: 5 } }, { drapeau: 'dg_sensei', valeur: 'reste' }],
        resultat: '{@sensei} soupire, mais ne te chasse pas. Ton thé arrive. Au bout d’un moment, {il:@sensei} commande un thé aussi, et pousse la bouteille vers le patron. Vous ne parlez pas. Quand tu rentres, il est minuit passé, et {@sensei} est rentré{e:@sensei} avant toi.',
      },
      {
        id: 'doucement',
        ton: 'franc',
        texte: '« Vous nous dites toujours de ne pas porter les choses seuls. »',
        effets: [{ relation: '@sensei', delta: { respect: 8, confiance: 4 } }, { drapeau: 'dg_sensei', valeur: 'retourne' }],
        resultat: '{@sensei} te fixe, puis éclate d’un vrai rire, le premier de la journée. « Tu retournes mes propres leçons contre moi. Insupportable. » {Il:@sensei} se lève. « Bon. Raccompagne ton vieux maître, alors. Et ne raconte ça à personne. »',
      },
      {
        id: 'partir',
        ton: 'froid',
        texte: 'Partir sans un mot',
        effets: [{ relation: '@sensei', delta: { attachement: -3 } }],
        resultat: 'Tu sors. Par la vitre, tu vois {@sensei} commander une quatrième bouteille. Le lendemain, à l’entraînement, ni l’un ni l’autre n’en parle.',
      },
    ],
  },
  {
    ...suiteDe('@sensei'),
    id: 'dg_sensei_chemin',
    titre: 'Le chemin du retour',
    arc: 'formation',
    categorie: 'deuil',
    texte:
      '{@sensei} s’appuie sur ton épaule plus qu’{il:@sensei} ne le voudrait. Les rues sont vides. À mi-chemin, {il:@sensei} s’arrête. « Promets-moi un truc. Le jour où ce sera ton tour d’enterrer quelqu’un… ne bois pas seul{e}. Va chercher quelqu’un. N’importe qui. »',
    choix: [
      {
        id: 'promettre',
        ton: 'chaleureux',
        texte: '« Promis. Et vous, ce soir, vous m’avez trouvé{e}. »',
        effets: [{ relation: '@sensei', delta: { attachement: 10 } }, { promesse: 'pas_seul', pnj: '@sensei', texte: 'Le soir d’un enterrement, aller chercher quelqu’un plutôt que boire en silence.' }],
        resultat: '{@sensei} rit, et le rire finit en quelque chose d’autre. {Il:@sensei} te tapote la tête deux fois. « Oui. Je t’ai trouvé{e}. » Devant sa porte, {il:@sensei} met trois essais à trouver la serrure. Tu ne dis rien. C’est ça, aussi, une promesse.',
      },
      {
        id: 'the',
        ton: 'humour',
        texte: '« Je boirai du thé. Beaucoup de thé. Avec vous, si vous êtes encore vivant{e:@sensei}. »',
        effets: [{ relation: '@sensei', delta: { amitie: 8, attachement: 4 } }],
        resultat: '« Si je suis encore vivant{e:@sensei}. » {@sensei} répète ta phrase, l’air de la trouver très drôle et très juste. « Marché conclu. Tu paieras le thé. » Vous arrivez devant sa porte en riant comme deux idiots, et ça vaut mieux que tout le reste de la journée.',
      },
      {
        id: 'personne',
        ton: 'franc',
        texte: '« Je n’enterrerai personne. Je les protégerai. »',
        effets: [{ relation: '@sensei', delta: { respect: 4 } }, { drapeau: 'dg_sensei', valeur: 'protegerai' }],
        resultat: '{@sensei} s’arrête. {Il:@sensei} te regarde avec une tendresse terrible. « C’est exactement ce que je me disais à ton âge. » {Il:@sensei} ne t’en dit pas plus. {Il:@sensei} n’en a pas besoin.',
      },
    ],
  },

  // ══ 3. Le rival, à l'infirmerie ══
  {
    ...base,
    id: 'dg_rival_infirmerie',
    titre: 'L’infirmerie',
    arc: 'conflit',
    categorie: 'rivalite',
    poids: 10,
    personnages: ['@rival'],
    si: { tout: [ACTIF, VIVANT('@rival'), { relation: '@rival', axe: 'rivalite', min: 15 }, { age: { min: 14, max: 24 } }] },
    texte:
      '{@rival} est rentré{e:@rival} de mission sur un brancard. Bras en écharpe, côtes bandées, et ce regard furieux qu’{il:@rival} réserve d’habitude à toi seul{e}. Quand tu entres dans l’infirmerie, {il:@rival} tourne la tête vers le mur. « Dégage. »',
    choix: [
      { id: 'pique', ton: 'moqueur', texte: '« Alors, c’est qui le meilleur, maintenant ? »', suite: 'dg_rival_joute' },
      { id: 'vivant', ton: 'chaleureux', texte: '« Je suis content{e} que tu sois en vie. »', suite: 'dg_rival_gene' },
      { id: 'quoi', ton: 'franc', texte: '« Qu’est-ce qui s’est passé ? »', suite: 'dg_rival_aveu' },
      { id: 'menace', ton: 'menacant', texte: '« La prochaine fois, je ne viendrai pas te chercher. »', suite: 'dg_rival_joute' },
    ],
  },
  {
    ...suiteDe('@rival'),
    id: 'dg_rival_joute',
    titre: 'Comme d’habitude',
    arc: 'conflit',
    categorie: 'rivalite',
    texte: '{@rival} se redresse d’un coup, grimace, et se redresse quand même. « Répète ça quand j’aurai mes deux bras. » La couleur lui revient aux joues. C’est fou ce qu’une insulte peut soigner, entre vous deux.',
    choix: [
      {
        id: 'duel',
        ton: 'humour',
        texte: '« Dans un mois, au vieux terrain. Je te laisse même ton bras gauche. »',
        effets: [{ relation: '@rival', delta: { rivalite: 6, respect: 6 } }, { drapeau: 'dg_rival', valeur: 'rendez_vous' }],
        resultat: '« Je n’ai besoin que du droit pour t’écraser. » « On verra. » Le médecin vous chasse tous les deux de la pièce, enfin toi. En sortant, tu entends {@rival} rire tout{e:@rival} seul{e:@rival}, puis gémir parce que ses côtes n’aiment pas ça.',
      },
      {
        id: 'fruit',
        ton: 'chaleureux',
        texte: 'Poser une mandarine sur sa table de chevet, sans commentaire',
        effets: [{ relation: '@rival', delta: { amitie: 8, hostilite: -4 } }],
        resultat: '{@rival} regarde la mandarine comme une arme inconnue. « C’est empoisonné ? » « Probablement. » Le lendemain, l’infirmière te dit qu’{il:@rival} l’a mangée en entier, avec la peau, en grognant ton nom.',
      },
      {
        id: 'pique2',
        ton: 'moqueur',
        texte: '« Repose-toi bien. Il te faudra des forces pour rester deuxième. »',
        effets: [{ relation: '@rival', delta: { rivalite: 8, hostilite: 3 } }],
        resultat: 'Un oreiller te frappe à l’arrière du crâne. Tu ne te retournes pas. Tu souris jusqu’au bout du couloir.',
      },
    ],
  },
  {
    ...suiteDe('@rival'),
    id: 'dg_rival_gene',
    titre: 'Quand tu es gentil',
    arc: 'conflit',
    categorie: 'rivalite',
    texte: '{@rival} te fixe, sincèrement inquiet{e:@rival}. « Arrête. Tu me fais peur quand tu es gentil{e}. Qu’est-ce que tu veux ? »',
    choix: [
      {
        id: 'insister',
        ton: 'chaleureux',
        texte: '« Rien. Je voulais juste te voir respirer. »',
        effets: [{ relation: '@rival', delta: { amitie: 10, hostilite: -6, attachement: 5 } }, { drapeau: 'dg_rival', valeur: 'tendre' }, { souvenir: 'À l’infirmerie, tu lui as dit que tu voulais juste le voir respirer.', pnj: '@rival' }],
        resultat: '{@rival} ouvre la bouche, la referme, et regarde le plafond très fixement. Ses oreilles sont rouges. « … D’accord. » Long silence. « Merci. Et sors, maintenant, avant que je dise quelque chose de stupide. »',
      },
      {
        id: 'revenir',
        ton: 'humour',
        texte: '« Te voir à l’horizontale. C’est rare, je voulais en profiter. »',
        effets: [{ relation: '@rival', delta: { amitie: 5, rivalite: 4 } }],
        resultat: '{@rival} soupire de soulagement, sincèrement. « Ah. Toi, je te reconnais. » La tension s’en va. Vous vous disputez dix minutes sur qui aurait fait mieux à sa place, et c’est la meilleure visite qu’{il:@rival} aura de la semaine.',
      },
      {
        id: 'taire',
        ton: 'silence',
        texte: 'Hausser les épaules et rester assis{e}',
        effets: [{ relation: '@rival', delta: { confiance: 4 } }],
        resultat: 'Tu restes. {@rival} finit par s’endormir, le visage tourné vers toi, ce qu’{il:@rival} niera toujours.',
      },
    ],
  },
  {
    ...suiteDe('@rival'),
    id: 'dg_rival_aveu',
    titre: 'Ce qui s’est passé',
    arc: 'conflit',
    categorie: 'rivalite',
    texte:
      '{@rival} met longtemps à répondre. « Je me suis figé{e:@rival}. » Sa voix est plate. « Il était là, devant moi, et je n’ai pas bougé. Une seconde. Mon équipier a pris le coup à ma place. » {Il:@rival} te regarde enfin. « Si tu le répètes à qui que ce soit… »',
    choix: [
      {
        id: 'moi_aussi',
        ton: 'franc',
        texte: '« Ça m’est arrivé aussi. Une fois. Je n’en ai parlé à personne. »',
        effets: [{ relation: '@rival', delta: { confiance: 12, hostilite: -6, respect: 4 } }, { drapeau: 'dg_rival', valeur: 'aveu_partage' }, { souvenir: 'À l’infirmerie, vous vous êtes avoué que vous vous étiez déjà figés au combat.', pnj: '@rival' }],
        resultat: '{@rival} te dévisage, cherchant le mensonge. Il n’y en a pas. « Toi ? » « Moi. » Quelque chose change dans la pièce. Vous ne serez jamais amis comme les autres sont amis. Mais à partir de ce jour, vous êtes les deux seules personnes du village à savoir ça l’un de l’autre.',
      },
      {
        id: 'promettre',
        ton: 'chaleureux',
        texte: '« Je ne dirai rien. Jamais. »',
        effets: [{ relation: '@rival', delta: { confiance: 8 } }, { promesse: 'secret_rival', pnj: '@rival', texte: 'Garder le secret de l’infirmerie.' }],
        resultat: '« Jamais, c’est long. » « Je sais. » {@rival} hoche la tête. Il n’y a rien d’autre à dire. Tu tiendras parole, ou pas ; le monde s’en souviendra.',
      },
      {
        id: 'dur',
        ton: 'froid',
        texte: '« Ça recommencera, si tu ne t’entraînes pas plus. »',
        effets: [{ relation: '@rival', delta: { hostilite: 6, respect: 2 } }, { drapeau: 'dg_rival', valeur: 'dur' }],
        resultat: '{@rival} serre les dents. « Je sais. » {Il:@rival} se tourne vers le mur. Tu as raison, et ça ne sert à rien. Trois semaines plus tard, {il:@rival} s’entraîne deux fois plus que toi, et ne te parle plus de cette mission.',
      },
    ],
  },

  // ══ 4. Ce qu'on dit de toi : ta façon de parler, renvoyée ══
  {
    ...base,
    id: 'dg_voix_chaleur',
    titre: 'Celle à qui l’on se confie',
    arc: 'heritage',
    categorie: 'quotidien',
    poids: 7,
    personnages: ['@coequipierB'],
    si: { tout: [ACTIF, VIVANT('@coequipierB'), { age: { min: 15 } }, { drapeau: 'ton_chaleureux', min: 3 }] },
    texte:
      '{@coequipierB} s’assoit à côté de toi, l’air de quelqu’un qui a préparé sa phrase. « Tu sais que les plus jeunes viennent te voir quand ça ne va pas ? Pas le médecin, pas le sensei. Toi. » {Il:@coequipierB} hausse les épaules. « Je voulais te dire que ça se voit. Et que ça doit être lourd, parfois. »',
    choix: [
      { id: 'lourd', ton: 'franc', texte: '« Ça l’est. Merci de l’avoir remarqué. »', effets: [{ relation: '@coequipierB', delta: { confiance: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: '« Alors la prochaine fois que c’est trop, c’est toi qui viens me voir. » {@coequipierB} se lève. « C’est un ordre. »' },
      { id: 'rien', ton: 'humour', texte: '« Lourd ? J’ai des épaules de ninja. »', effets: [{ relation: '@coequipierB', delta: { amitie: 6 } }], resultat: '« Des épaules de ninja, et des cernes de grand-mère. » Vous riez. Mais {@coequipierB} reste un peu plus longtemps que prévu, juste au cas où.' },
    ],
  },
  {
    ...base,
    id: 'dg_voix_pique',
    titre: 'La langue trop vive',
    arc: 'heritage',
    categorie: 'quotidien',
    poids: 7,
    personnages: ['@sensei'],
    si: { tout: [ACTIF, VIVANT('@sensei'), { age: { min: 14 } }, { drapeau: 'ton_moqueur', min: 3 }] },
    texte:
      '{@sensei} te garde après l’entraînement. « Une remarque, et après tu peux partir. Tu as la langue la plus rapide de l’équipe. Plus rapide que tes mains. » {Il:@sensei} croise les bras. « Les gens rient, et ils retiennent. Un jour, tu feras rire la mauvaise personne. »',
    choix: [
      { id: 'ecouter', ton: 'franc', texte: '« Vous avez raison. J’essaierai de compter jusqu’à trois. »', effets: [{ relation: '@sensei', delta: { respect: 6 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: '« Jusqu’à dix. Trois, tu arrives déjà à le dire en te moquant. » Mais {@sensei} sourit en le disant.' },
      { id: 'pique', ton: 'moqueur', texte: '« Vous dites ça parce que je vous ai fait rire la semaine dernière. »', effets: [{ relation: '@sensei', delta: { amitie: 3, respect: -3 } }], resultat: '{@sensei} ne rit pas cette fois. « Exactement. Et je ne suis pas la mauvaise personne. » {Il:@sensei} s’en va. La phrase te reste dans l’oreille toute la semaine.' },
    ],
  },
  {
    ...base,
    id: 'dg_voix_froid',
    titre: 'Le mur',
    arc: 'heritage',
    categorie: 'quotidien',
    poids: 7,
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { age: { min: 15 } }, { un: [{ drapeau: 'ton_froid', min: 3 }, { drapeau: 'ton_silence', min: 4 }] }] },
    texte:
      '{@coequipierA} te rattrape à la sortie du bureau des missions. « Je peux te dire un truc sans que tu me regardes comme ça ? » Tu ne sais pas comment tu le regardes. « On ne sait jamais ce que tu penses. Jamais. Même moi. Et ça fait des années. »',
    choix: [
      { id: 'ouvrir', ton: 'franc', texte: '« Je pense que j’ai peur de dire les choses, et qu’elles deviennent vraies. »', effets: [{ relation: '@coequipierA', delta: { confiance: 12, attachement: 6 } }], resultat: '{@coequipierA} s’arrête net. « Ça, c’est la phrase la plus longue que tu m’aies dite depuis l’Académie. » {Il:@coequipierA} sourit. « Continue. On a tout le chemin. »' },
      { id: 'fermer', ton: 'froid', texte: '« Il n’y a rien à savoir. »', effets: [{ relation: '@coequipierA', delta: { confiance: -6, attachement: -4 } }], resultat: '« D’accord. » {@coequipierA} n’insiste pas. {Il:@coequipierA} ne te le redemandera pas. Tu ne sais pas si c’est un soulagement.' },
    ],
  },
];
