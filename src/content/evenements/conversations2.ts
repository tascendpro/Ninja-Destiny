import type { Condition, EventDef } from '../../engine/types';

/**
 * La suite des conversations qui se souviennent : sept fils, de l'enfance à la vieillesse. Chaque première
 * conversation pose un drapeau « dl_… » ; la seconde, des années plus tard, répond à ce qu'on a dit ce jour-là.
 * Mêmes personnages que le premier recueil : {@coequipierA}, {@coequipierB}, {@sensei}, {@rival}.
 */
const TOUS = [1, 2, 3, 4, 5, 6];
const ACTIF: Condition = { statut: 'actif' };
const VIVANT = (role: string): Condition => ({ pnj: role, etat: ['vivant', 'blesse'] });
const base = { chapitre: 1, chapitres: TOUS };

export const CONVERSATIONS_2: EventDef[] = [
  // ── 1. Le bol de ramen : l'enfant et le vieux cuisinier ──
  {
    ...base,
    id: 'dl_ramen',
    titre: 'Le bol que tu ne peux pas payer',
    arc: 'origines',
    categorie: 'enfance',
    lieu: '$village',
    poids: 12,
    si: { tout: [ACTIF, { age: { min: 7, max: 11 } }] },
    texte:
      'Il pleut, tu as faim, et tu comptes tes pièces devant l’échoppe pour la troisième fois. Il en manque deux. Le vieux cuisinier ne lève pas les yeux de son bouillon. « Tu vas rester dehors jusqu’à ce que la pluie te serve de soupe ? » « Je n’ai pas assez. » « Je sais. Tu comptes à voix haute. » Il pose un bol fumant sur le comptoir. « Assieds-toi. Tu paieras la différence un autre jour. »',
    choix: [
      {
        id: 'promesse',
        texte: '« Je reviendrai payer. C’est une promesse de ninja. »',
        effets: [{ drapeau: 'dl_ramen', valeur: 'promesse' }, { journal: 'Un vieux cuisinier t’a fait crédit de deux pièces, un jour de pluie. Tu as promis de revenir.', importance: 2 }],
        resultat:
          '« Une promesse de ninja. » Il essuie ses mains sur son tablier, très sérieux. « Ça vaut plus cher que deux pièces, ça. Fais attention à qui tu en donnes. » Le bouillon te brûle la langue. C’est le meilleur repas de ta vie, et tu ne le sais pas encore.',
      },
      {
        id: 'travail',
        texte: '« Je peux faire la vaisselle. Je ne veux rien devoir. »',
        effets: [{ drapeau: 'dl_ramen', valeur: 'vaisselle' }, { journal: 'Tu as lavé des bols jusqu’au soir pour deux pièces de dette. Le vieux cuisinier a ri tout du long.', importance: 2 }],
        resultat:
          'Il te regarde longtemps. « Rien devoir à personne. C’est une drôle d’idée, pour quelqu’un qui va passer sa vie dans une équipe. » Mais il te tend un torchon. Tu laves des bols jusqu’à la nuit, les manches trempées, et il te raconte le village d’avant ta naissance.',
      },
      {
        id: 'fuite',
        texte: 'Manger vite, et filer sans dire merci',
        effets: [{ drapeau: 'dl_ramen', valeur: 'fuite' }, { journal: 'Tu as filé sans dire merci, un jour de pluie. Tu t’en souviens plus souvent que tu ne voudrais.', importance: 2 }],
        resultat:
          'Tu avales le bol en trois minutes et tu cours sous la pluie, le ventre chaud et les oreilles plus chaudes encore. Derrière toi, il ne crie pas. C’est presque pire.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_ramen_retour',
    titre: 'Deux pièces, avec les intérêts',
    chapitre: 3,
    arc: 'heritage',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 11,
    si: { tout: [ACTIF, { vu: 'dl_ramen' }, { age: { min: 18, max: 40 } }] },
    texte: [
      { texte: 'L’échoppe n’a pas changé. Le cuisinier, si : il est plus petit que dans ton souvenir, et ses mains tremblent un peu quand il soulève la louche. Il plisse les yeux en te voyant entrer avec ton bandeau.' },
      { si: { drapeau: 'dl_ramen', egal: 'promesse' }, texte: '« Tiens. La promesse de ninja. » Il ne sourit pas tout à fait. « J’ai attendu. Dix ans et quelques. Je commençais à croire que ça ne valait pas deux pièces, finalement. »' },
      { si: { drapeau: 'dl_ramen', egal: 'vaisselle' }, texte: '« Tiens. Mon plongeur. » Il désigne la pile de bols sales d’un coup de menton. « Tu arrives bien, mon dos ne suit plus. Tu refuses toujours de devoir quelque chose à quelqu’un ? »' },
      { si: { drapeau: 'dl_ramen', egal: 'fuite' }, texte: '« Tiens. Le courant d’air. » Il pose la louche. « Tu courais vite, pour ton âge. J’ai pensé : celui-là fera un bon ninja, ou un bon voleur. Alors ? Lequel ? »' },
    ],
    choix: [
      {
        id: 'payer',
        texte: 'Poser sur le comptoir bien plus que deux pièces',
        effets: [{ stat: 'jauges.ryo', delta: -30 }, { stat: 'social.reputation', delta: 2 }, { journal: 'Tu as payé ta dette au vieux cuisinier. Il a gardé deux pièces et t’a rendu le reste.', importance: 2 }],
        resultat:
          'Il compte, lentement. Puis il prend deux pièces, exactement deux, et repousse le reste vers toi. « Les intérêts, tu les paieras à un autre gosse qui compte à voix haute sous la pluie. C’est comme ça que ça marche, ici. » Il te sert un bol. Il a le même goût.',
      },
      {
        id: 'aider',
        texte: 'Passer derrière le comptoir et laver les bols',
        effets: [{ stat: 'jauges.fatigue', delta: 4 }, { stat: 'social.reputation', delta: 3 }, { journal: 'Un soir, en uniforme, tu as fait la vaisselle du vieux cuisinier. Tout le quartier l’a su.', importance: 2 }],
        resultat:
          'Des clients te reconnaissent et n’osent rien dire. Le vieux, lui, ose : « Plus vite, shinobi, j’ai du monde. » À la fermeture, il s’assoit enfin, et il te dit, sans te regarder : « Les gens oublient qu’un village, c’est d’abord des bols propres. Pas toi. C’est bien. »',
      },
      {
        id: 'parler',
        texte: '« Racontez-moi encore le village d’avant. »',
        effets: [{ stat: 'attributs.intellect', delta: 1 }, { journal: 'Le vieux cuisinier t’a raconté le village d’avant, une dernière fois.', importance: 2 }],
        resultat:
          'Il parle une heure. Des noms que plus personne ne prononce, une rue qui n’existe plus, un Kage qui venait manger là en cachette. « Je suis le dernier à m’en souvenir, dit-il. Enfin. Maintenant, on est deux. » Tu comprends en sortant qu’il vient de te confier quelque chose à garder.',
      },
    ],
  },

  // ── 2. La question du sensei ──
  {
    ...base,
    id: 'dl_pourquoi',
    titre: 'Pourquoi tu te bats',
    chapitre: 2,
    arc: 'formation',
    categorie: 'entrainement',
    lieu: '$village',
    poids: 12,
    si: { tout: [ACTIF, VIVANT('@sensei'), { rang: ['genin', 'chunin'] }, { age: { min: 13, max: 17 } }] },
    texte:
      'L’entraînement est fini depuis une heure, et {@sensei} n’est toujours pas parti{e:@sensei}. {Il:@sensei} verse deux tasses de thé sur une souche, comme si c’était une table. « Assieds-toi. Une question, et tu peux rentrer. » Tu t’assieds. « Pourquoi tu te bats ? » Tu ouvres la bouche. « Non. Pas la réponse de l’Académie. La tienne. »',
    choix: [
      {
        id: 'proteger',
        texte: '« Pour que ceux que j’aime n’aient pas à le faire. »',
        effets: [{ drapeau: 'dl_pourquoi', valeur: 'proteger' }, { relation: '@sensei', delta: { respect: 5, attachement: 4 } }, { souvenir: 'Tu lui as dit que tu te battais pour que d’autres n’aient pas à le faire.', pnj: '@sensei' }],
        resultat:
          '{@sensei} hoche la tête, lentement. « C’est une bonne raison. C’est aussi celle qui fait le plus mal, tu verras. Parce qu’un jour, tu n’arriveras pas à temps. » {Il:@sensei} finit son thé. « Ce jour-là, souviens-toi que tu avais raison quand même. »',
      },
      {
        id: 'fort',
        texte: '« Pour devenir plus fort{e} que tout le monde. »',
        effets: [{ drapeau: 'dl_pourquoi', valeur: 'force' }, { relation: '@sensei', delta: { respect: 2 } }, { souvenir: 'Tu lui as dit que tu voulais être au-dessus de tout le monde.', pnj: '@sensei' }],
        resultat:
          '« Honnête. » {Il:@sensei} sourit dans sa tasse. « J’ai dit la même chose à ton âge. Tu sais ce qu’on trouve, tout en haut ? Personne. C’est très calme, et très froid. » {Il:@sensei} se lève. « Mais monte. On ne croit que ce qu’on a vu soi-même. »',
      },
      {
        id: 'sais_pas',
        texte: '« Je ne sais pas. On ne m’a jamais demandé si je voulais. »',
        effets: [{ drapeau: 'dl_pourquoi', valeur: 'doute' }, { relation: '@sensei', delta: { confiance: 6, attachement: 3 } }, { souvenir: 'Tu lui as avoué que tu ne savais pas pourquoi tu te battais.', pnj: '@sensei' }],
        resultat:
          'Le silence dure. Puis {@sensei} pose sa tasse. « C’est la première réponse vraie qu’un élève me donne en dix ans. » {Il:@sensei} regarde le terrain vide. « Moi non plus, on ne m’a pas demandé. Cherche ta raison. Si tu n’en trouves pas, viens me le dire : on cherchera autre chose à faire de toi. »',
      },
    ],
  },
  {
    ...base,
    id: 'dl_pourquoi_retour',
    titre: 'La même souche, vingt ans après',
    chapitre: 4,
    arc: 'heritage',
    categorie: 'heritage',
    lieu: '$village',
    poids: 11,
    si: { tout: [ACTIF, VIVANT('@sensei'), { vu: 'dl_pourquoi' }, { age: { min: 28, max: 55 } }] },
    texte: [
      { texte: 'La souche est toujours là, plus grise, plus basse. {@sensei} aussi. {Il:@sensei} verse deux tasses, et cette fois ses mains mettent du temps. « Assieds-toi. Une question, et tu peux rentrer. » Tu ris. « Pourquoi je me bats ? » « Non. Celle-là, tu y as déjà répondu. »' },
      { si: { drapeau: 'dl_pourquoi', egal: 'proteger' }, texte: '« Tu m’avais dit : pour que ceux que j’aime n’aient pas à le faire. Je t’avais prévenu{e} que ça ferait mal. Alors ? Ça a fait mal ? »' },
      { si: { drapeau: 'dl_pourquoi', egal: 'force' }, texte: '« Tu voulais être plus fort{e} que tout le monde. Tu es monté{e} haut. Alors ? Il y a quelqu’un, là-haut ? »' },
      { si: { drapeau: 'dl_pourquoi', egal: 'doute' }, texte: '« Tu m’avais dit que tu ne savais pas. Tu es resté{e} quand même, toutes ces années. Alors ? Tu as trouvé ? »' },
    ],
    choix: [
      {
        id: 'oui',
        texte: 'Répondre honnêtement, même si la réponse est dure',
        effets: [{ relation: '@sensei', delta: { attachement: 8, confiance: 6 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { souvenir: 'Vingt ans après, sur la même souche, tu lui as répondu sans mentir.', pnj: '@sensei' }],
        resultat:
          'Tu parles longtemps. Des noms, des missions, une ou deux nuits que tu n’avais racontées à personne. {@sensei} écoute sans t’interrompre. À la fin, {il:@sensei} dit seulement : « Bien. Alors je n’ai pas tout raté. » {Il:@sensei} te tend la théière. « C’est toi qui la gardes, maintenant. Il te faudra une souche. »',
      },
      {
        id: 'retourner',
        texte: '« Et vous ? Vous ne m’avez jamais dit votre raison. »',
        effets: [{ relation: '@sensei', delta: { confiance: 8, respect: 4 } }, { souvenir: 'Ton sensei t’a enfin dit pourquoi il se battait. C’était toi, et les autres élèves.', pnj: '@sensei' }],
        resultat:
          '{@sensei} reste longtemps sans répondre. « Au début, pour quelqu’un qui est mort. Ensuite, par habitude. » {Il:@sensei} te regarde. « Et puis un jour, on m’a confié trois gamins qui ne savaient pas lancer un shuriken droit. Depuis, je n’ai plus eu besoin de chercher. »',
      },
      {
        id: 'silence',
        texte: 'Boire le thé sans rien dire',
        effets: [{ relation: '@sensei', delta: { attachement: 4 } }],
        resultat:
          'Tu bois. {Il:@sensei} boit. Le soleil descend derrière les poteaux d’entraînement. « C’est une réponse aussi, dit-{il:@sensei} enfin. Les meilleures ne se disent pas. » Vous restez jusqu’à ce que le thé soit froid.',
      },
    ],
  },

  // ── 3. La veille du front ──
  {
    ...base,
    id: 'dl_veille',
    titre: 'La nuit d’avant',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'guerre',
    lieu: '$village',
    poids: 13,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { rang: ['chunin', 'jonin'] }, { age: { min: 16, max: 20 } }] },
    texte:
      'Les ordres sont tombés à midi : départ à l’aube. Tu trouves {@coequipierA} sur le toit, là où vous montiez enfants, en train d’aiguiser un kunai déjà tranchant. « Tu ne dors pas ? » « Toi non plus. » {Il:@coequipierA} pose la pierre à aiguiser. « Dis. Si demain ça tourne mal… » « Ça ne tournera pas mal. » « Laisse-moi finir. Si ça tourne mal, je veux que quelqu’un sache que j’avais peur. Pas ma famille. Toi. »',
    choix: [
      {
        id: 'peur',
        texte: '« Moi aussi, j’ai peur. Depuis midi. »',
        effets: [{ drapeau: 'dl_veille', valeur: 'peur' }, { relation: '@coequipierA', delta: { confiance: 10, attachement: 6 } }, { souvenir: 'La veille du front, vous vous êtes avoué que vous aviez peur.', pnj: '@coequipierA' }],
        resultat:
          '{@coequipierA} souffle, comme si tu venais de lui enlever un sac des épaules. « Alors on est deux. C’est déjà mieux. » Vous ne dormez pas. Vous regardez les lampes s’éteindre, quartier après quartier, et vous ne parlez plus de demain.',
      },
      {
        id: 'serment',
        texte: '« On rentre tous les deux. Je ne te le demande pas, je te l’ordonne. »',
        effets: [{ drapeau: 'dl_veille', valeur: 'serment' }, { relation: '@coequipierA', delta: { amitie: 8, respect: 4 } }, { souvenir: 'La veille du front, tu lui as ordonné de rentrer en vie.', pnj: '@coequipierA' }],
        resultat:
          '{Il:@coequipierA} rit, pour de vrai, pour la première fois de la journée. « Tu n’as aucune autorité sur moi. » « Demain, si. Je suis juste derrière toi dans la colonne. » {Il:@coequipierA} te tend son petit doigt, comme à sept ans. Tu le serres. C’est ridicule. Ça tient quand même.',
      },
      {
        id: 'dur',
        texte: '« Garde ça pour toi. La peur, ça se propage. »',
        effets: [{ drapeau: 'dl_veille', valeur: 'dur' }, { relation: '@coequipierA', delta: { attachement: -5, respect: 2 } }, { souvenir: 'La veille du front, tu n’as pas voulu entendre sa peur.', pnj: '@coequipierA' }],
        resultat:
          '{@coequipierA} reprend la pierre à aiguiser. « Compris. » Le crissement de l’acier reprend, régulier, un peu trop fort. Tu redescends. Tu as peut-être raison. Tu n’arrives pas à t’en convaincre avant l’aube.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_veille_retour',
    titre: 'Le même toit',
    chapitre: 4,
    arc: 'apres_guerre',
    categorie: 'amitie',
    lieu: '$village',
    poids: 12,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { vu: 'dl_veille' }, { age: { min: 21, max: 34 } }] },
    texte: [
      { texte: 'La guerre est finie depuis assez longtemps pour qu’on commence à en parler. {@coequipierA} t’attend sur le toit, deux bouteilles à la main.' },
      { si: { drapeau: 'dl_veille', egal: 'peur' }, texte: '« Tu sais ce qui m’a tenu debout, là-bas ? Pas le courage. Savoir que quelqu’un d’autre avait aussi peur que moi, et qu’il avançait quand même. Je te regardais, dans la colonne. »' },
      { si: { drapeau: 'dl_veille', egal: 'serment' }, texte: '« Tu m’avais ordonné de rentrer. J’y ai pensé une fois, dans la boue, quand j’ai cru que c’était fini. Je me suis dit : je vais me faire engueuler. Et je me suis relevé{e:@coequipierA}. »' },
      { si: { drapeau: 'dl_veille', egal: 'dur' }, texte: '« Tu m’as dit de garder ma peur pour moi, ce soir-là. Je l’ai fait. Toute la guerre. » {Il:@coequipierA} débouche une bouteille. « Je crois que je ne l’ai toujours pas ressortie. Je ne sais plus où je l’ai mise. »' },
    ],
    choix: [
      {
        id: 'trinquer',
        texte: 'Trinquer à ceux qui ne sont pas montés sur ce toit',
        effets: [{ relation: '@coequipierA', delta: { attachement: 8, amitie: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { souvenir: 'Vous avez bu aux absents, sur le toit de votre enfance.', pnj: '@coequipierA' }],
        resultat:
          'Vous dites les noms, un par un. Il y en a plus que de gorgées dans les bouteilles. À la fin, {@coequipierA} pose la sienne sur le rebord, pleine encore à moitié. « Pour eux. Ils avaient toujours soif. »',
      },
      {
        id: 'pardon',
        si: { drapeau: 'dl_veille', egal: 'dur' },
        texte: '« J’avais tort, ce soir-là. Dis-la-moi maintenant. »',
        effets: [{ relation: '@coequipierA', delta: { confiance: 12, attachement: 8, hostilite: -5 } }, { drapeau: 'dl_veille_pardon' }, { souvenir: 'Des années trop tard, tu as écouté sa peur. Ça a pris toute la nuit.', pnj: '@coequipierA' }],
        resultat:
          '{Il:@coequipierA} commence par rire. Puis {il:@coequipierA} ne rit plus. Ça sort d’un coup, des années de guerre rangées dans le mauvais tiroir. Tu ne dis rien. Tu restes. Au matin, {il:@coequipierA} a les yeux rouges et la voix claire. « Merci d’être revenu{e} la chercher. »',
      },
      {
        id: 'avenir',
        texte: '« Et maintenant ? Qu’est-ce qu’on fait d’une vie entière ? »',
        effets: [{ relation: '@coequipierA', delta: { amitie: 6, confiance: 4 } }],
        resultat:
          '« Aucune idée. » {@coequipierA} s’allonge sur les tuiles. « On nous a appris à survivre jusqu’à demain. Personne n’a prévu de cours pour après-demain. » Vous faites des projets idiots jusqu’à l’aube. Deux ou trois, tu le sais déjà, vous les tiendrez.',
      },
    ],
  },

  // ── 4. La lettre de {@coequipierB} ──
  {
    ...base,
    id: 'dl_lettre',
    titre: 'Une lettre qu’on te demande de porter',
    chapitre: 2,
    arc: 'premieres_missions',
    categorie: 'amitie',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@coequipierB'), { rang: ['genin', 'chunin'] }, { age: { min: 14, max: 18 } }] },
    texte:
      '{@coequipierB} te coince à la sortie du bureau des missions, une enveloppe froissée à la main. « J’ai besoin d’un service. Et tu ne poses pas de question. » « Ça commence mal. » « C’est une lettre. Pour mon père. On ne se parle plus depuis que j’ai choisi le bandeau au lieu de l’atelier. » {Il:@coequipierB} regarde ailleurs. « Je l’ai écrite six fois. Si c’est moi qui la porte, je vais la déchirer une septième. »',
    choix: [
      {
        id: 'porter',
        texte: 'Prendre la lettre et la porter toi-même',
        effets: [{ drapeau: 'dl_lettre', valeur: 'portee' }, { relation: '@coequipierB', delta: { confiance: 10, amitie: 5 } }, { souvenir: 'Tu as porté sa lettre à un père qui ne voulait pas ouvrir la porte.', pnj: '@coequipierB' }],
        resultat:
          'Le père ouvre à peine. Il regarde ton bandeau, puis l’enveloppe, et il la prend sans un mot. La porte se referme. Tu restes une minute dans la rue. De l’autre côté, tu entends le papier qu’on déplie. Tu n’en diras rien à {@coequipierB}, sauf : « Il l’a prise. »',
      },
      {
        id: 'accompagner',
        texte: '« Je viens avec toi. Tu la portes, je t’empêche de la déchirer. »',
        effets: [{ drapeau: 'dl_lettre', valeur: 'ensemble' }, { relation: '@coequipierB', delta: { attachement: 8, amitie: 6 } }, { souvenir: 'Vous êtes allés ensemble jusqu’à la porte de son père.', pnj: '@coequipierB' }],
        resultat:
          'Vous faites trois fois le tour du quartier avant qu’{il:@coequipierB} ose frapper. Quand la porte s’ouvre, tu recules d’un pas, puis de dix. Tu ne sais pas ce qu’ils se disent. Tu vois seulement un vieil homme poser sa main sur une épaule, maladroitement, comme on touche un outil qu’on n’a pas utilisé depuis longtemps.',
      },
      {
        id: 'refuser',
        texte: '« Ce n’est pas à moi de le faire. Et tu le sais. »',
        effets: [{ drapeau: 'dl_lettre', valeur: 'refus' }, { relation: '@coequipierB', delta: { respect: 3, amitie: -3 } }, { souvenir: 'Tu as refusé de porter sa lettre. Elle est restée longtemps dans sa poche.', pnj: '@coequipierB' }],
        resultat:
          '{@coequipierB} range l’enveloppe. « Tu as raison. C’est bien ça le problème. » {Il:@coequipierB} s’en va sans se retourner. La lettre restera dans sa veste des mois. Tu la verras dépasser, parfois, pendant les missions.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_lettre_retour',
    titre: 'L’atelier',
    chapitre: 4,
    arc: 'heritage',
    categorie: 'deuil',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@coequipierB'), { vu: 'dl_lettre' }, { age: { min: 22, max: 40 } }] },
    texte: [
      { texte: 'Le père de {@coequipierB} est mort au début de l’hiver. Tu trouves ton coéquipier dans l’atelier vide, assis{e:@coequipierB} sur l’établi, un rabot à la main.' },
      { si: { drapeau: 'dl_lettre', egal: 'refus' }, texte: '« Je l’ai portée trop tard, cette lettre. Il était déjà malade. Il l’a lue, il a hoché la tête, et on a parlé du temps. » {Il:@coequipierB} pose le rabot. « Tu avais raison de refuser. J’ai juste mis trois ans à avoir ton courage. »' },
      { si: { non: { drapeau: 'dl_lettre', egal: 'refus' } }, texte: '« J’ai retrouvé la lettre dans ses affaires. Il l’avait gardée dans sa boîte à outils, avec ses meilleurs ciseaux. » {Il:@coequipierB} sourit à moitié. « Grâce à toi, on a eu dix ans. Des dîners ratés, des disputes, des silences. Dix ans. Je ne t’ai jamais dit merci. »' },
    ],
    choix: [
      {
        id: 'rester',
        texte: 'T’asseoir à côté, et l’aider à ranger les outils',
        effets: [{ relation: '@coequipierB', delta: { attachement: 10, amitie: 5 } }, { souvenir: 'Vous avez rangé l’atelier de son père, outil par outil.', pnj: '@coequipierB' }],
        resultat:
          'Chaque outil a une histoire, et {@coequipierB} te les raconte toutes. À la fin, {il:@coequipierB} te met un petit ciseau à bois dans la main. « Prends-le. Il disait qu’un shinobi qui ne sait rien fabriquer ne sait que casser. »',
      },
      {
        id: 'garder',
        texte: '« Garde l’atelier. Tu as le droit d’être deux choses. »',
        effets: [{ relation: '@coequipierB', delta: { confiance: 8, respect: 5 } }, { souvenir: 'Tu lui as dit de garder l’atelier. On y entend encore le rabot, entre deux missions.', pnj: '@coequipierB' }],
        resultat:
          '{Il:@coequipierB} regarde les murs, les copeaux, le bandeau sur son bras. « Deux choses. » {Il:@coequipierB} reprend le rabot. Le premier copeau est raté. Le deuxième aussi. Au dixième, {il:@coequipierB} pleure et sourit en même temps, et tu fais semblant de regarder par la fenêtre.',
      },
      {
        id: 'mission',
        texte: '« Viens. Une mission te changera les idées. »',
        effets: [{ relation: '@coequipierB', delta: { amitie: 2, attachement: -3 } }],
        resultat:
          '{@coequipierB} te suit, parce que c’est plus simple. La mission se passe bien. Sur le chemin du retour, {il:@coequipierB} dit : « Ça ne m’a pas changé les idées. Mais merci d’avoir essayé. » L’atelier est vendu au printemps.',
      },
    ],
  },

  // ── 5. Le rival et la cicatrice ──
  {
    ...base,
    id: 'dl_cicatrice',
    titre: 'La cicatrice que tu lui as laissée',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'rivalite',
    lieu: '$village',
    poids: 11,
    si: { tout: [ACTIF, VIVANT('@rival'), { relation: '@rival', axe: 'rivalite', min: 20 }, { age: { min: 16, max: 24 } }] },
    texte:
      'Aux bains, {@rival} s’installe à trois pas de toi, exprès. Sur son épaule, une ligne blanche que tu reconnais : c’est toi qui l’as faite, à l’entraînement, il y a des années. {Il:@rival} suit ton regard. « Tu la regardes souvent. » « Je ne la regarde pas. » « Si. » {Il:@rival} s’enfonce dans l’eau jusqu’au menton. « Je ne t’en veux pas, tu sais. Je la garde. Chaque matin, elle me rappelle qu’il existe quelqu’un qui peut me toucher. »',
    choix: [
      {
        id: 'excuse',
        texte: '« Je n’ai jamais voulu frapper si fort. »',
        effets: [{ drapeau: 'dl_cicatrice', valeur: 'excuse' }, { relation: '@rival', delta: { hostilite: -6, respect: 4 } }, { souvenir: 'Aux bains, tu as demandé pardon pour sa cicatrice. Ton rival a refusé l’excuse et gardé le respect.', pnj: '@rival' }],
        resultat:
          '« Ne t’excuse pas. » {Il:@rival} ferme les yeux. « Si tu t’excuses, ça veut dire que c’était un accident. Je préfère croire que tu étais meilleur{e} que moi ce jour-là. C’est plus utile. » Un temps. « Mais c’est noté. »',
      },
      {
        id: 'defi',
        texte: '« Je peux t’en faire une deuxième, si tu veux la paire. »',
        effets: [{ drapeau: 'dl_cicatrice', valeur: 'defi' }, { relation: '@rival', delta: { rivalite: 8, respect: 5 } }, { souvenir: 'Aux bains, tu lui as promis une deuxième cicatrice. Ça l’a fait rire.', pnj: '@rival' }],
        resultat:
          '{@rival} éclate de rire, assez fort pour que les vieux du bassin d’à côté se retournent. « Voilà. Voilà pourquoi c’est toi et personne d’autre. » {Il:@rival} te tend le seau d’eau froide. « La prochaine, c’est moi qui la fais. Choisis ton épaule. »',
      },
      {
        id: 'montrer',
        texte: 'Lui montrer la tienne, celle qu’{il:@rival} ne connaît pas',
        effets: [{ drapeau: 'dl_cicatrice', valeur: 'montre' }, { relation: '@rival', delta: { confiance: 8, hostilite: -4, respect: 3 } }, { souvenir: 'Tu lui as montré une cicatrice que personne n’avait vue.', pnj: '@rival' }],
        resultat:
          '{Il:@rival} regarde longtemps. Ce n’est pas une marque d’entraînement, et {il:@rival} le voit tout de suite. « Qui ? » « Une mission. » « Tu ne me l’avais pas dit. » « On ne se dit rien, toi et moi. » {Il:@rival} hoche la tête. « C’est vrai. On devrait peut-être commencer. »',
      },
    ],
  },
  {
    ...base,
    id: 'dl_cicatrice_retour',
    titre: 'Deux verres, une seule table',
    chapitre: 5,
    arc: 'heritage',
    categorie: 'rivalite',
    lieu: '$village',
    poids: 11,
    si: { tout: [ACTIF, VIVANT('@rival'), { vu: 'dl_cicatrice' }, { age: { min: 33, max: 60 } }] },
    texte: [
      { texte: 'Il n’y a plus qu’une table libre dans la taverne, et {@rival} y est déjà. {Il:@rival} pousse la chaise d’en face du pied. « Assieds-toi. On est trop vieux pour faire semblant de ne pas se voir. »' },
      { si: { drapeau: 'dl_cicatrice', egal: 'defi' }, texte: '« Tu me dois toujours une épaule, dit-{il:@rival} en remplissant ton verre. J’ai fait le compte : trente et un duels, quinze pour toi, quinze pour moi, un que personne n’a vu finir. Je refuse de mourir à égalité. »' },
      { si: { drapeau: 'dl_cicatrice', egal: 'excuse' }, texte: '« Tu t’étais excusé{e}, un jour, aux bains. Je t’avais dit de ne pas le faire. » {Il:@rival} remplit ton verre. « J’ai menti. Ça m’a fait du bien. Je ne te l’aurais dit pour rien au monde à vingt ans. »' },
      { si: { drapeau: 'dl_cicatrice', egal: 'montre' }, texte: '« Tu m’avais montré ta cicatrice, aux bains. C’est ce jour-là que j’ai arrêté de vouloir te battre. » {Il:@rival} remplit ton verre. « J’ai commencé à vouloir que tu rentres. C’est beaucoup plus fatigant. »' },
    ],
    choix: [
      {
        id: 'ami',
        texte: '« On a perdu trente ans à ne pas s’appeler amis. »',
        effets: [{ relation: '@rival', delta: { amitie: 12, hostilite: -10, attachement: 6 } }, { souvenir: 'À la taverne, vous avez enfin prononcé le mot : amis.', pnj: '@rival' }],
        resultat:
          '{@rival} fait tourner son verre. « Perdu ? Non. Je n’aurais jamais couru aussi vite pour un ami. » {Il:@rival} lève le verre. « Mais d’accord. À partir de ce soir. Ça ne change rien : je compte toujours te battre. »',
      },
      {
        id: 'duel',
        texte: '« Demain, à l’aube, au vieux terrain. Le trente-deuxième. »',
        effets: [{ relation: '@rival', delta: { rivalite: 6, respect: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { souvenir: 'Vous avez pris rendez-vous pour un trente-deuxième duel, à votre âge.', pnj: '@rival' }],
        resultat:
          'Ses yeux s’allument comme à douze ans. « Tu vas te faire mal au dos. » « Toi au genou. » Vous videz la bouteille en établissant des règles : pas de technique interdite, pas de témoin, et le perdant paie le médecin des deux.',
      },
      {
        id: 'heritage',
        texte: '« Qui se souviendra de nous deux, quand on ne sera plus là ? »',
        effets: [{ relation: '@rival', delta: { confiance: 8, attachement: 5 } }],
        resultat:
          '« Personne, dit {@rival}. Les gens se souviennent des Kage et des traîtres. » {Il:@rival} hausse les épaules. « Mais quelque part, un gamin frappe plus fort parce qu’un autre gamin le regarde. C’est nous, ça. On est une méthode. » Tu trouves que c’est la plus belle chose qu’{il:@rival} ait jamais dite, et tu ne le lui diras pas.',
      },
    ],
  },

  // ── 6. L'enfant du terrain d'entraînement ──
  {
    ...base,
    id: 'dl_gamin',
    titre: 'L’enfant qui te regarde t’entraîner',
    chapitre: 4,
    arc: 'heritage',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 11,
    si: { tout: [ACTIF, { rang: ['chunin', 'jonin'] }, { age: { min: 20, max: 45 } }] },
    texte:
      'Depuis une semaine, un enfant s’assoit sur la barrière du terrain et te regarde t’entraîner. Sept ans, peut-être huit. Aujourd’hui, il ose : « C’est vrai que les ninjas n’ont jamais peur ? » Tu rattrapes ton shuriken. « Qui t’a dit ça ? » « Mon frère. Il est parti en mission il y a longtemps. Maman dit qu’il est très occupé. » Il balance ses jambes dans le vide. « Moi je crois qu’il a eu peur et qu’il n’ose pas rentrer. »',
    choix: [
      {
        id: 'verite',
        texte: 'Lui dire la vérité, avec des mots à sa taille',
        effets: [{ drapeau: 'dl_gamin', valeur: 'verite' }, { stat: 'social.reputation', delta: 2 }, { journal: 'Tu as dit à un enfant, sur une barrière, que les ninjas ont peur et qu’ils ne rentrent pas toujours.', importance: 2 }],
        resultat:
          '« Les ninjas ont peur tout le temps. Les bons avancent quand même. Et parfois, ils ne rentrent pas, et ce n’est pas parce qu’ils n’osent pas. » Il ne pleure pas. Il hoche la tête, très lentement, comme quelqu’un qui range une chose lourde à sa place. « Je m’en doutais, dit-il. Merci de ne pas m’avoir dit qu’il était occupé. »',
      },
      {
        id: 'apprendre',
        texte: 'Lui mettre un shuriken en bois dans la main',
        effets: [{ drapeau: 'dl_gamin', valeur: 'eleve' }, { stat: 'social.reputation', delta: 2 }, { journal: 'Tu as appris à un enfant à tenir un shuriken. Il venait pour parler de son frère.', importance: 2 }],
        resultat:
          'Tu ne réponds pas à la question. Tu lui montres comment tenir, comment viser, comment rater sans se vexer. Il rate quarante fois. À la quarante et unième, la cible tremble. Il te regarde comme si tu venais de lui rendre quelque chose. Il revient le lendemain, et les jours d’après.',
      },
      {
        id: 'mentir',
        texte: '« Ton frère est sûrement très occupé, oui. »',
        effets: [{ drapeau: 'dl_gamin', valeur: 'mensonge' }, { journal: 'Tu as menti à un enfant sur une barrière. Il a fait semblant de te croire.', importance: 2 }],
        resultat:
          'Il te regarde un long moment, avec cette patience terrible des enfants à qui tous les adultes disent la même phrase. « D’accord. » Il descend de la barrière. Il ne reviendra pas te regarder t’entraîner.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_gamin_retour',
    titre: 'Le genin de la barrière',
    chapitre: 5,
    arc: 'heritage',
    categorie: 'heritage',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, { vu: 'dl_gamin' }, { age: { min: 30, max: 65 } }] },
    texte: [
      { texte: 'Un jeune shinobi t’arrête dans la rue, bandeau neuf, salut un peu trop raide. Il te faut un instant. Puis tu revois une barrière, et deux jambes qui se balancent.' },
      { si: { drapeau: 'dl_gamin', egal: 'verite' }, texte: '« Vous m’avez dit la vérité sur mon frère, quand j’avais huit ans. Vous étiez la seule personne. » Il se redresse. « J’ai passé mon examen hier. J’ai eu peur tout le long. J’ai avancé quand même. Je voulais que vous le sachiez. »' },
      { si: { drapeau: 'dl_gamin', egal: 'eleve' }, texte: '« Quarante et une fois. Vous vous souvenez ? » Il sort de sa poche un shuriken en bois, usé, fendu. « Je l’ai encore. J’ai passé mon examen hier. Le tir sur cible, j’ai eu la meilleure note de la promotion. »' },
      { si: { drapeau: 'dl_gamin', egal: 'mensonge' }, texte: '« Vous m’avez dit que mon frère était occupé. » Sa voix est calme. « J’ai su la vérité à dix ans, par un voisin, dans la rue. Je ne vous en veux pas. Mais je me suis promis que, moi, je ne dirais jamais ça à un enfant. C’est pour ça que je porte ce bandeau. »' },
    ],
    choix: [
      {
        id: 'fier',
        texte: '« Ton frère serait fier. Et moi aussi. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'social.reputation', delta: 2 }, { journal: 'L’enfant de la barrière est devenu genin. Il est venu te le dire.', importance: 2 }],
        resultat:
          'Le salut trop raide se défait. Pendant une seconde, il a huit ans. Puis il se reprend, s’incline, et repart au pas de course vers sa première mission. Tu restes dans la rue plus longtemps que nécessaire.',
      },
      {
        id: 'conseil',
        texte: 'Lui donner le seul conseil qui t’ait vraiment servi',
        effets: [{ stat: 'social.reputation', delta: 3 }, { journal: 'Tu as donné au genin de la barrière le conseil que ton sensei t’avait donné.', importance: 2 }],
        resultat:
          '« Ne sois jamais le plus courageux de ton équipe. Sois celui qui compte les têtes au retour. » Il répète la phrase à voix basse, deux fois, pour ne pas la perdre. Dans vingt ans, tu le sais, il la dira à quelqu’un sur une barrière.',
      },
      {
        id: 'excuse',
        si: { drapeau: 'dl_gamin', egal: 'mensonge' },
        texte: '« J’ai eu tort. J’ai choisi ce qui était facile pour moi. »',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { stat: 'social.reputation', delta: 2 }, { journal: 'Tu as demandé pardon auprès d’un genin pour un mensonge vieux de quinze ans.', importance: 2 }],
        resultat:
          'Il ne s’y attendait pas. « Un jōnin ne s’excuse pas devant un genin. » « Celui-là, si. » Il te regarde, puis il sourit, pour la première fois. « Alors je retire ce que j’ai pensé de vous pendant quinze ans. Enfin. La moitié. »',
      },
    ],
  },

  // ── 7. La pluie avec {@coequipierB} ──
  {
    ...base,
    id: 'dl_pluie',
    titre: 'Sous l’auvent',
    chapitre: 2,
    arc: 'premieres_missions',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 9,
    si: { tout: [ACTIF, VIVANT('@coequipierB'), { rang: ['genin', 'chunin'] }, { age: { min: 12, max: 16 } }] },
    texte:
      'L’averse vous coince sous l’auvent d’une boutique fermée, {@coequipierB} et toi, avec un sac de mission trempé entre vous. « Tu veux savoir un secret ? » dit-{il:@coequipierB} sans te regarder. « Je déteste ça. Pas la pluie. Les missions. Je suis doué{e:@coequipierB}, tout le monde le dit, et chaque matin j’ai mal au ventre. » {Il:@coequipierB} essore sa manche. « Si tu le répètes, je nie. »',
    choix: [
      {
        id: 'ecouter',
        texte: '« Je ne répéterai rien. Raconte. »',
        effets: [{ drapeau: 'dl_pluie', valeur: 'ecoute' }, { relation: '@coequipierB', delta: { confiance: 10, attachement: 4 } }, { souvenir: 'Sous un auvent, tu as appris son secret : le mal au ventre avant chaque mission.', pnj: '@coequipierB' }],
        resultat:
          '{Il:@coequipierB} raconte. Le premier sang, le bruit que ça fait, les nuits. Tu ne proposes aucune solution, parce que tu n’en as pas. Quand la pluie s’arrête, {il:@coequipierB} ramasse le sac. « Ça ne va pas mieux. Mais c’est moins lourd à deux. »',
      },
      {
        id: 'pareil',
        texte: '« Moi, c’est les mains. Elles tremblent jusqu’au premier coup. »',
        effets: [{ drapeau: 'dl_pluie', valeur: 'pareil' }, { relation: '@coequipierB', delta: { amitie: 8, confiance: 6 } }, { souvenir: 'Sous un auvent, vous avez échangé vos peurs : son ventre, tes mains.', pnj: '@coequipierB' }],
        resultat:
          '{@coequipierB} te regarde enfin. « Toi ? Tes mains ? » « Regarde. » Elles tremblent un peu, là, maintenant, rien que d’en parler. {Il:@coequipierB} se met à rire, et toi aussi, deux genins trempés qui rient sous un auvent de leur propre trouille.',
      },
      {
        id: 'secouer',
        texte: '« Alors arrête. Personne ne t’oblige à porter ce bandeau. »',
        effets: [{ drapeau: 'dl_pluie', valeur: 'arrete' }, { relation: '@coequipierB', delta: { respect: 4, amitie: -2 } }, { souvenir: 'Sous un auvent, tu lui as dit d’arrêter. Le bandeau est resté sur son front.', pnj: '@coequipierB' }],
        resultat:
          '« Si. Moi. Je m’oblige. » {Il:@coequipierB} sort sous la pluie avant qu’elle ait fini. Tu le rattrapes au coin de la rue. {Il:@coequipierB} ne dit plus rien jusqu’à la porte du village, mais {il:@coequipierB} ne te demande pas non plus de partir.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_pluie_retour',
    titre: 'Le même auvent',
    chapitre: 4,
    arc: 'heritage',
    categorie: 'amitie',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@coequipierB'), { vu: 'dl_pluie' }, { age: { min: 22, max: 45 } }] },
    texte: [
      { texte: 'L’averse vous surprend au même endroit, vingt ans plus tard ou presque. La boutique a changé d’enseigne ; l’auvent, non. {@coequipierB} secoue sa cape et se met à rire tout{e:@coequipierB} seul{e:@coequipierB}.' },
      { si: { drapeau: 'dl_pluie', egal: 'ecoute' }, texte: '« Tu te souviens ? Je t’avais tout raconté, ici. Tu n’avais rien dit. Rien du tout. » {Il:@coequipierB} essore sa manche, du même geste. « C’est ce jour-là que j’ai compris qu’on pouvait dire les choses sans qu’elles vous tuent. J’ai encore mal au ventre, tu sais. Mais je le dis à mes genins, maintenant. »' },
      { si: { drapeau: 'dl_pluie', egal: 'pareil' }, texte: '« Montre tes mains. » Tu les montres. Elles ne tremblent presque plus. « Tricheur. » {Il:@coequipierB} sourit. « Moi, le ventre, c’est pareil qu’avant. Je me suis juste habitué{e:@coequipierB} à la compagnie. Et à savoir que les tiennes tremblaient à côté. »' },
      { si: { drapeau: 'dl_pluie', egal: 'arrete' }, texte: '« Tu m’avais dit d’arrêter, ici même. Je t’en ai voulu pendant des mois. » {Il:@coequipierB} regarde la pluie. « Tu étais la seule personne à m’avoir dit que j’avais le droit. Personne d’autre ne me l’a jamais dit. Je suis resté{e:@coequipierB} parce que j’avais le choix. Ça change tout. »' },
    ],
    choix: [
      {
        id: 'rire',
        texte: '« On était trempés, terrifiés, et on se croyait les seuls. »',
        effets: [{ relation: '@coequipierB', delta: { amitie: 8, attachement: 6 } }, { souvenir: 'Sous le même auvent, vingt ans après, vous avez ri de vos peurs de genins.', pnj: '@coequipierB' }],
        resultat:
          '« Tout le monde l’est. Personne ne le dit. » {@coequipierB} tend la main sous la gouttière, comme pour vérifier que la pluie est bien la même. « On devrait l’écrire quelque part. Au-dessus de la porte de l’Académie. »',
      },
      {
        id: 'demander',
        texte: '« Et aujourd’hui ? Tu détestes toujours ça ? »',
        effets: [{ relation: '@coequipierB', delta: { confiance: 8, attachement: 4 } }, { souvenir: 'Sous le même auvent, tu lui as redemandé si les missions lui pesaient toujours.', pnj: '@coequipierB' }],
        resultat:
          '{Il:@coequipierB} prend le temps de répondre honnêtement. « Les missions, oui. Rentrer, non. J’ai fini par comprendre que je ne faisais pas ce métier pour partir. » La pluie faiblit. Ni l’un ni l’autre ne bouge.',
      },
      {
        id: 'partir',
        texte: 'Attendre la fin de l’averse en silence',
        effets: [{ relation: '@coequipierB', delta: { attachement: 3 } }],
        resultat:
          'Vous regardez l’eau courir dans la rigole. Il y a des silences qu’on ne peut partager qu’avec quelqu’un qui vous a vu avoir peur à treize ans. Celui-là dure jusqu’à l’éclaircie.',
      },
    ],
  },
];
