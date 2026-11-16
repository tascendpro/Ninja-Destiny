import type { Condition, EventDef } from '../../engine/types';

/**
 * Les proches, au fil des années : cinq rencontres qui reviennent, et qui ne se ressemblent jamais deux fois.
 *
 * Chacune lit ce que le proche est pour toi (sa posture, engine/proches.ts) et ce dont il se souvient : le compte des
 * duels pour le rival, ton habitude pour l'aîné·e, vos souvenirs pour l'ami·e, ta progression pour le mentor, ta
 * vie pour le parent. Les règles d'écriture :
 *   - l'aîné·e te connaît depuis ta naissance : jamais de formule de rencontre, une fierté qui ne se dit pas ;
 *   - le parent se souvient de ce qui compte et réagit à ce que tu deviens ;
 *   - le rival cite des faits (le compte, la fiole, le shuriken), jamais des généralités ;
 *   - l'ami·e parle de ce que vous avez vécu, et peut être déçu·e ;
 *   - le mentor ne répète jamais un conseil (revueMentor).
 */

const ACTIF: Condition = { statut: 'actif' };
const AINE: Condition = { pnj: '@aine', etat: ['vivant', 'blesse'] };
const PARENT: Condition = { pnj: '@parent', etat: ['vivant', 'blesse'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const SENSEI: Condition = { pnj: '@sensei', etat: ['vivant', 'blesse'] };
const P1: Condition = { drapeau: 'passage', max: 1 };
const P2: Condition = { drapeau: 'passage', min: 2, max: 2 };
const P3: Condition = { drapeau: 'passage', min: 3 };
const aine = (est: string | string[]): Condition => ({ posture: 'aine', est });
const parent = (est: string | string[]): Condition => ({ posture: 'parent', est });
const rival = (est: string | string[]): Condition => ({ posture: 'rival', est });
const ami = (est: string | string[]): Condition => ({ posture: 'ami', est });
const sensei = (est: string | string[]): Condition => ({ posture: 'sensei', est });

const vie = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6] };

export const PROCHES: EventDef[] = [
  // ── L'aîné·e : il, elle te connaît par cœur ──────────────────────────
  {
    ...vie,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'pr_aine_habitude',
    titre: 'Ce que tu fais de tes soirées',
    categorie: 'quotidien',
    lieu: '$maison',
    poids: 10,
    repetable: { delaiJours: 420, max: 3 },
    personnages: ['@aine'],
    si: { tout: [ACTIF, AINE, { age: { min: 8, max: 18 } }, { habitudeConnue: true }] },
    texte: [
      { si: P1, texte: '{AineNom} est adossé{aine_e} au chambranle de ta porte depuis un moment. Tu ne l’as pas entendu{aine_e} arriver, et ça l’amuse beaucoup.' },
      { si: P2, texte: 'Le même chambranle, la même façon de s’y adosser, bras croisés. Tu as arrêté de sursauter. {AineNom} a arrêté de le remarquer.' },
      { si: P3, texte: '{AineNom} ne frappe plus avant d’entrer. En fait, {aine_il} ne l’a jamais fait.' },
      { si: aine('complice'), texte: '« Tu sais à quoi tu passes ta vie, ces temps-ci ? À {habitude}. » {Aine_il} se laisse tomber sur ton lit, les bras derrière la tête. « Je dis ça, je dis rien. Moi, à ton âge, je faisais pareil. En moins bien. »' },
      { si: aine('protecteur'), texte: '« Tu passes ta vie à {habitude}. » Ce n’est pas un reproche, pas tout à fait. {Aine_il} regarde tes mains, les écorchures, le bandage que tu as refait toi-même, mal. « Montre. »' },
      { si: aine('severe'), texte: '« Tu passes ta vie à {habitude}. » {Aine_il} croise les bras. « Et le reste ? Tu crois qu’il va se faire tout seul ? Je t’ai vu·e hier. Tu bâcles tout ce qui ne t’amuse pas. »' },
      { si: aine('jaloux'), texte: '« Toujours à {habitude}, hein. » Le ton est léger. Les yeux, moins. Depuis quelque temps, on demande de tes nouvelles avant de demander des siennes, et {aine_il} ne sait pas encore quoi faire de ça.' },
      // Ce dont {il} se souvient : vos matins d'entraînement (memoire.ts).
      { si: { faitAvec: '@aine', type: 'entrainement', tag: 'kawarimi' }, texte: '« Et ta permutation ? Montre. » Depuis le matin des trois minutes, {aine_il} te le demande chaque fois, comme on vérifie qu’un cadeau sert encore. Votre dernier entraînement ensemble, c’était {quand:@aine:entrainement}.' },
      { si: { tout: [{ faitAvec: '@aine', type: 'entrainement', tag: 'tombe' }, { non: { faitAvec: '@aine', type: 'entrainement', tag: 'kawarimi' } }] }, texte: '{Aine_il} n’a jamais reparlé du matin où tu es tombé·e avant la fin des trois minutes. Toi non plus. Ça flotte quand même dans la pièce.' },
      { si: aine('distant'), texte: '{Aine_il} reste sur le seuil. « Tu passes ta vie à {habitude}. On me l’a dit. » On le lui a dit : vous ne vous parlez plus assez pour qu’{aine_il} le sache {lui:@aine}-même.' },
    ],
    choix: [
      {
        id: 'taquiner',
        texte: '« Et toi, tu passes la tienne à me surveiller. »',
        effets: [{ relation: '@aine', delta: { amitie: 4 } }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: [
          { si: aine(['complice', 'protecteur']), texte: '« Évidemment. C’est mon travail depuis que tu sais marcher. » {AineNom} te pince l’oreille en passant, comme quand tu avais six ans. Tu as passé l’âge. Tu ne dis rien.' },
          { si: aine('severe'), texte: '« Quelqu’un doit bien le faire. » Mais {aine_il} sourit en le disant, à peine, et c’est la première fois de la semaine.' },
          { si: aine(['jaloux', 'distant']), texte: '« Quelqu’un doit bien le faire. » {AineNom} s’en va avant que tu puisses répondre. Ce n’était pas une plaisanterie. Pas tout à fait.' },
        ],
      },
      {
        id: 'conseil',
        texte: 'Lui demander ce qu’{aine_il} ferait à ta place',
        effets: [{ relation: '@aine', delta: { respect: 4, confiance: 3 } }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: [
          { si: aine('severe'), texte: '« Ce que tu détestes. Une heure par jour. Le reste, tu le fais déjà trop. » C’est dur à entendre. C’est juste. {AineNom} reste jusqu’à ce que tu commences, sans rien dire, et s’en va quand tu as pris le rythme.' },
          { si: aine(['complice', 'protecteur']), texte: '{AineNom} réfléchit vraiment, ce qui est rare. « Change d’endroit. À force de t’entraîner au même, tu finis par t’entraîner pour cet endroit-là. » Le lendemain, il y a un poteau neuf planté au fond de la cour. Personne ne dit qui l’a planté.' },
          { si: aine(['jaloux', 'distant']), texte: '« Ce que je ferais ? » {Aine_il} hausse les épaules. « Je n’en sais rien. Tu te débrouilles très bien sans moi, apparemment. » Et {aine_il} s’en va, et tu restes avec la phrase.' },
        ],
      },
      {
        id: 'fermer',
        texte: 'Lui fermer la porte au nez',
        effets: [{ relation: '@aine', delta: { amitie: -3 } }, { stat: 'attributs.controleEmotionnel', delta: -1 }],
        resultat: [
          { si: aine(['complice', 'protecteur']), texte: 'Tu fermes la porte. Le soir, ton bol est quand même rempli à ras bord. {AineNom} ne dira jamais qui l’a rempli, et tu ne le demanderas pas.' },
          { si: aine('severe'), texte: 'Tu fermes la porte. Derrière, tu l’entends soupirer, exactement comme {parent}. Ça t’énerve plus que tout le reste.' },
          { si: aine(['jaloux', 'distant']), texte: 'Tu fermes la porte. Personne ne frappe. C’est presque pire.' },
        ],
      },
    ],
  },

  // ── Le parent : ce qu'il voit de ce que tu deviens ───────────────────
  {
    ...vie,
    arc: 'heritage',
    id: 'pr_parent_table',
    titre: 'À table',
    categorie: 'quotidien',
    lieu: '$maison',
    poids: 10,
    repetable: { delaiJours: 520, max: 4 },
    personnages: ['@parent'],
    si: { tout: [ACTIF, PARENT, { age: { min: 8 } }] },
    texte: [
      { si: P1, texte: 'Le dîner, comme tous les soirs. {Parent} sert le riz, s’assoit en face de toi, et attend ta première bouchée pour parler. C’est une règle de la maison depuis toujours.' },
      { si: { drapeau: 'passage', min: 2 }, texte: 'Le dîner. {Parent} a fait le plat que tu préfères, ce qui veut dire qu’{parent_il} a quelque chose à te dire, ou quelque chose à ne pas te dire.' },
      // Ce qu'un parent sait de ta vie, et qu'il n'oublie pas.
      { si: { rang: 'eleve' }, texte: '« Alors, l’Académie ? » La question de tous les soirs. Mais ce soir, {parent_il} attend vraiment la réponse.' },
      { si: { rang: 'genin' }, texte: '« Ton équipe. Raconte. » {Parent} veut les noms, les missions, qui mange quoi : tout ce qui ne s’écrit pas dans les rapports.' },
      { si: { rangMin: 'chunin' }, texte: 'Ton gilet est plié sur la chaise d’à côté. {Parent} le regarde plus souvent que toi.' },
      { si: { pnj: '@aine', etat: 'mort' }, texte: 'Il y a toujours un bol de trop sur cette table. Vous ne l’avez jamais retiré.' },
      { si: { drapeau: 'examen_rate', min: 1 }, texte: 'Personne ne parle de l’examen raté. Ça fait partie du repas, comme le sel.' },
      { si: { faitAvec: '@parent', type: 'dispute', tag: 'lettre' }, texte: 'Depuis la lettre du tiroir, {quand:@parent:dispute}, il y a des questions que tu ne poses plus à table. {Parent} non plus.' },
      { si: { drapeau: 'lettre_su' }, texte: 'Le nom d’Akihiko ne sera pas prononcé ce soir. Mais {parent} sait que tu sais, et ça s’entend dans les silences.' },
      // Ce qu'il est pour toi, maintenant.
      { si: parent('fier'), texte: '{Parent} ne dit pas qu’{parent_il} est fier{parent_e}. {Parent_il} te ressert sans que tu demandes, deux fois, et le lendemain, les voisins te félicitent pour des choses que tu ne lui as jamais racontées.' },
      { si: parent('inquiet'), texte: '{Parent} regarde tes bandages plus que ton visage. « Ça fait mal ? » « Non. » « Menteur·se. » {Parent_il} pose la main sur ton poignet, une seconde, et la retire avant que ça devienne gênant.' },
      { si: parent('protecteur'), texte: '« Tu manges assez, au moins ? » La même question depuis tes six ans. Elle n’a jamais vraiment parlé de nourriture.' },
      { si: parent('distant'), texte: 'Vous mangez en silence. {Parent} demande si la soupe est assez salée. Tu réponds que oui. C’est la plus longue conversation de la semaine.' },
    ],
    choix: [
      {
        id: 'raconter',
        texte: 'Tout raconter, même ce qui s’est mal passé',
        effets: [{ relation: '@parent', delta: { confiance: 5, attachement: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: [
          { si: parent('distant'), texte: 'Tu racontes. {Parent} écoute, la cuillère suspendue. À la fin, {parent_il} ne dit rien, mais {parent_il} ne se lève pas non plus. Vous restez à table bien après la fin du repas. C’est un début.' },
          { si: parent('inquiet'), texte: 'Tu racontes, en arrondissant les angles. {Parent} n’est pas dupe. « La prochaine fois, tu me dis tout. Je préfère avoir peur de la vérité que d’un mensonge. »' },
          { si: parent(['fier', 'protecteur']), texte: 'Tu racontes. {Parent} rit aux bons endroits, se tait aux mauvais, et ne pose qu’une question : la bonne. En débarrassant, tu comprends que tu n’as plus six ans, et qu’{parent_il} le sait depuis plus longtemps que toi.' },
        ],
      },
      {
        id: 'demander',
        texte: 'Lui demander comment c’était, à ton âge',
        effets: [{ relation: '@parent', delta: { respect: 3, amitie: 3 } }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: [
          { si: parent('distant'), texte: '{Parent} hausse les épaules. « Autre chose. La guerre. » Fin de la conversation. Mais le lendemain matin, il y a sur ta table un vieux bandeau rayé que tu n’avais jamais vu.' },
          { si: parent(['fier', 'protecteur', 'inquiet']), texte: '{Parent} pose ses baguettes et cherche longtemps. « À ton âge ? J’avais peur tout le temps. Je ne l’ai jamais dit à personne. » Un silence. « Toi, tu me le dirais ? »' },
        ],
      },
      {
        id: 'filer',
        texte: 'Finir vite et filer',
        effets: [{ relation: '@parent', delta: { attachement: -2 } }, { stat: 'jauges.fatigue', delta: -5 }],
        resultat: [
          { si: parent('distant'), texte: '« Va. » Tu y vas. Vous vous êtes dit trois mots. Vous en dites de moins en moins.' },
          { si: parent(['fier', 'protecteur', 'inquiet']), texte: '« Va. » {Parent} débarrasse seul{parent_e}. De ta chambre, tu l’entends laver ton bol avec plus de soin que le sien.' },
        ],
      },
    ],
  },

  // ── Le rival : il tient le compte ────────────────────────────────────
  {
    ...vie,
    arc: 'formation',
    id: 'pr_rival_compte',
    titre: 'Le compte',
    categorie: 'rivalite',
    lieu: '$terrain',
    poids: 10,
    repetable: { delaiJours: 400, max: 3 },
    personnages: ['@rival'],
    si: { tout: [ACTIF, RIVAL, { connu: '@rival' }, { age: { min: 9 } }] },
    texte: [
      { si: P1, texte: '{@rival} t’attend à la sortie du terrain, appuyé{e:@rival} contre le poteau que vous avez tous les deux frappé mille fois.' },
      { si: P2, texte: 'Le même poteau, plus abîmé. {@rival} y est encore, comme si {il:@rival} n’en était jamais parti{e:@rival}.' },
      { si: P3, texte: 'Le poteau a été remplacé. {@rival} y est quand même. Certaines choses ne se remplacent pas.' },
      // Le compte : ce que son registre a gardé de vos vrais combats.
      { si: { rivalBilan: 'derriere' }, texte: '« {rival_bilan}. » {Il:@rival} le dit à voix basse, sans te regarder, comme on récite une prière. Le compte, {il:@rival} le tient mieux que toi.' },
      { si: { rivalBilan: 'devant' }, texte: 'Le compte, vous le connaissez tous les deux : {rival_bilan}. {@rival} n’en parle jamais. C’est à ça qu’on voit qu’{il:@rival} y pense tout le temps.' },
      { si: { rivalBilan: 'egal' }, texte: 'Le compte est exact : {rival_bilan}. {@rival} te le rappelle comme on rappelle une dette.' },
      { si: { rivalBilan: 'aucun' }, texte: '« On ne s’est jamais vraiment battus, toi et moi. » {Il:@rival} dit ça en passant, l’air de rien. « Je commence à croire que tu fais exprès. »' },
      // Ce dont il, elle se souvient.
      { si: { drapeau: 'humilie_lancer' }, texte: '« Le shuriken sur le poteau, la première semaine. Tout le monde a ri. Pas moi. Tu t’en souviens ? » Tu t’en souviens.' },
      { si: { drapeau: 'c2_dette_rival' }, texte: '« Et la fiole, dans la forêt. Tu me la dois toujours. »' },
      { si: { drapeau: 'c2_tournoi_gagne' }, texte: '« Le tournoi, c’était de la chance. Je le dirai jusqu’à ma mort. »' },
      { si: { drapeau: 'dg_rival', egal: 'aveu_partage' }, texte: 'Depuis l’infirmerie, il y a dans sa voix quelque chose que personne d’autre n’entend.' },
      // Ce que vos combats ont laissé (memoire.ts) : une défaite devant tout le monde ne s'oublie pas.
      { si: { faitAvec: '@rival', type: 'defaite', tag: 'temoins' }, texte: '« Devant tout le monde, {quand:@rival:defaite}. Tu t’en souviens ? Moi, oui. Je m’en souviens pour nous deux. »' },
      { si: { faitAvec: '@rival', type: 'humiliation', tag: 'toi' }, texte: '« Les vrais ninjas ne pleurent pas. C’est toi qui m’as dit ça, derrière l’Académie. » Ce n’est pas une question. Ça ne l’a jamais été.' },
      // Ce qu'il, elle est pour toi.
      { si: rival('ennemi'), texte: 'Ce n’est plus un jeu, depuis longtemps. {@rival} ne cherche pas à te battre : {il:@rival} cherche à ce que tu perdes.' },
      { si: rival('rival'), texte: '« Demain. Le terrain du fond. » Ce n’est pas une question.' },
      { si: rival('respect'), texte: '« Demain, si tu veux. » Venant de {@rival}, c’est presque de la politesse.' },
      { si: rival('complice'), texte: '« Demain ? » {Il:@rival} sourit déjà. Vous savez tous les deux que vous n’irez pas pour gagner. Enfin, pas seulement.' },
    ],
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter, et venir pour gagner',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { force: 1, agilite: 1, perception: 1 },
          maitrises: { taijutsu: 2, ninjutsu: 1 },
          succes: { texte: 'Tu rentres avec un bleu de plus, et une ligne de plus au compte. {@rival} ne t’a pas salué·e en partant. Le lendemain, {il:@rival} est au terrain avant l’aube.', effets: [{ relation: '@rival', delta: { respect: 5, rivalite: 4 } }, { stat: 'attributs.force', delta: 1 }] },
          echec: { texte: '{@rival} te tend la main pour te relever, sans un mot. Le compte bouge. Ce soir, c’est toi qui seras au terrain avant l’aube.', effets: [{ relation: '@rival', delta: { rivalite: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }] },
        },
      },
      {
        id: 'retourner',
        texte: 'Lui rappeler, à ton tour, une chose qu’{il:@rival} préférerait oublier',
        effets: [{ relation: '@rival', delta: { rivalite: 6, hostilite: 2 } }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: [
          { si: rival('complice'), texte: '{@rival} éclate de rire. « Tu n’as aucune pitié. » « J’ai appris avec toi. » Vous restez là jusqu’à la nuit à vous rappeler vos pires moments, et c’est la meilleure soirée du mois.' },
          { si: rival(['rival', 'respect']), texte: 'Ça touche. Tu le vois à sa mâchoire. « Demain, alors. Et tu ne riras plus. » Tu as gagné la conversation. Le combat, c’est une autre histoire.' },
          { si: rival('ennemi'), texte: '{@rival} ne répond rien. Il y a des silences qui sont des promesses, et celui-là n’en est pas une bonne.' },
        ],
      },
      {
        id: 'tendre',
        texte: '« Et si, pour une fois, on s’entraînait ensemble ? »',
        effets: [{ relation: '@rival', delta: { amitie: 6, hostilite: -4, rivalite: -2 } }, { stat: 'attributs.perception', delta: 1 }],
        resultat: [
          { si: rival(['complice', 'respect']), texte: '{@rival} te dévisage, cherche le piège, ne le trouve pas. « Une fois. » Ce sera dix. Vous ne vous ménagez pas, mais vous ne cherchez plus à vous faire tomber. Vous cherchez à monter.' },
          { si: rival('rival'), texte: '« Pour que tu voies mes techniques ? Bien essayé. » Mais le lendemain, {@rival} s’entraîne à trois poteaux du tien, au lieu de l’autre bout du terrain.' },
          { si: rival('ennemi'), texte: '« Ensemble ? » {Il:@rival} rit, sans joie. « Il y a des choses que tu ne répares pas avec une phrase. » {Il:@rival} s’en va. Mais {il:@rival} s’est arrêté{e:@rival} pour te répondre, et ça, c’est nouveau.' },
        ],
      },
    ],
  },

  // ── L'ami·e : ce que vous avez vécu ───────────────────────────────────
  {
    ...vie,
    arc: 'formation',
    id: 'pr_ami_souvenir',
    titre: 'Tu te souviens ?',
    categorie: 'amitie',
    lieu: '$village',
    poids: 10,
    repetable: { delaiJours: 450, max: 3 },
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, AMI, { connu: '@coequipierA' }, { age: { min: 10 } }] },
    texte: [
      { si: P1, texte: 'Le muret derrière le marché, là où personne ne vient. {@coequipierA} s’y est assis{e:@coequipierA}, les jambes dans le vide, et te fait signe.' },
      { si: P2, texte: 'Le muret, encore. On y tenait à deux sans se toucher ; maintenant vos genoux se cognent. Vous avez grandi, pas le muret.' },
      { si: P3, texte: 'Le muret a perdu deux pierres. {@coequipierA} a gardé la place de gauche. Toi, celle de droite. Personne n’a jamais décidé ça.' },
      { si: { tout: [{ souvenirAvec: '@coequipierA' }, { non: ami('decu') }] }, texte: '« Tu te souviens ? » Tu te souviens. {souvenir:@coequipierA}' },
      { si: { tout: [{ souvenirAvec: '@coequipierA' }, ami('decu')] }, texte: '{@coequipierA} ne dit pas « tu te souviens ». Mais tu y penses quand même : {souvenir:@coequipierA} Ça paraît loin.' },
      // Ce que vous avez traversé (memoire.ts).
      { si: { faitAvec: '@coequipierA', type: 'sauvetage', tag: 'lui' }, texte: '« Tu me dois toujours une vie, tu sais. » {Il:@coequipierA} dit ça en riant. Ce n’est qu’à moitié une blague, et vous le savez tous les deux.' },
      { si: { tout: [{ faitAvec: '@coequipierA', type: 'sauvetage', tag: 'toi' }, { non: { faitAvec: '@coequipierA', type: 'sauvetage', tag: 'lui' } }] }, texte: '{Il:@coequipierA} ne parle jamais de ce jour-là, {quand:@coequipierA:sauvetage}, où tu ne l’as pas laissé{e:@coequipierA} derrière toi. Mais {il:@coequipierA} s’assoit toujours du côté où tu pourrais tomber.' },
      { si: { faitAvec: '@coequipierA', type: 'trahison', tag: 'toi' }, texte: 'Entre vous, il y a ce jour-là, {quand:@coequipierA:trahison}, où tu ne t’es pas retourné·e. Personne ne l’a oublié.' },
      { si: { tout: [{ faitAvec: '@coequipierA', type: 'dispute' }, { non: ami('decu') }] }, texte: 'Vous n’avez jamais reparlé de votre dispute. C’était {quand:@coequipierA:dispute}, et elle s’assoit encore entre vous, parfois.' },
      { si: ami('proche'), texte: '{@coequipierA} te tend la moitié d’un gâteau de riz sans te regarder, comme on passe le sel. Vous ne vous dites pas grand-chose. Vous n’en avez pas besoin.' },
      { si: ami('ami'), texte: '« Raconte. Et n’enjolive pas, je te connais. »' },
      { si: ami('decu'), texte: '{@coequipierA} ne te fait pas de place. Tu t’assois quand même. Le silence est de ceux qui ont une raison.' },
      { si: ami('distant'), texte: 'Vous vous êtes moins vus, ces derniers temps. Vous le savez tous les deux. Ni l’un ni l’autre ne le dit.' },
    ],
    choix: [
      {
        id: 'rire',
        texte: 'Raconter la pire chose qui te soit arrivée cette semaine, pour la faire rire',
        effets: [{ relation: '@coequipierA', delta: { amitie: 5 } }, { stat: 'attributs.charisme', delta: 1 }, { stat: 'jauges.fatigue', delta: -5 }],
        resultat: [
          { si: ami(['proche', 'ami']), texte: '{@coequipierA} rit si fort qu’un marchand vous lance une épluchure. « Tu as fait ça. Devant tout le monde. » « Devant tout le monde. » Vous n’arrivez plus à vous arrêter, et vous ne savez plus très bien pourquoi.' },
          { si: ami('distant'), texte: '{@coequipierA} sourit, puis rit vraiment, presque malgré {lui:@coequipierA}. « Tu n’as pas changé. » Ce n’est pas un reproche. Vous restez jusqu’à la nuit, comme avant.' },
          { si: ami('decu'), texte: '{@coequipierA} ne rit pas. « Tu fais toujours ça. Une blague, et on passe à autre chose. » Tu ne trouves rien à répondre, parce que c’est vrai.' },
        ],
      },
      {
        id: 'excuser',
        texte: 'Lui demander ce qui ne va pas entre vous',
        effets: [{ relation: '@coequipierA', delta: { confiance: 6, amitie: 2 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: [
          { si: ami('decu'), texte: 'Un long moment. Puis tout sort, d’un coup : ce que tu as promis, ce que tu n’as pas fait, les fois où tu n’étais pas là. Tu écoutes jusqu’au bout sans te défendre. À la fin, {@coequipierA} souffle. « Voilà. C’est dit. » Ce n’est pas réparé. Mais c’est dit.' },
          { si: ami('distant'), texte: '« Rien. On a grandi, c’est tout. » Puis, plus bas : « Tu m’as manqué, idiot·e. » Tu ne savais pas que tu avais besoin de l’entendre.' },
          { si: ami(['proche', 'ami']), texte: '{@coequipierA} te regarde comme si tu étais devenu·e fou·folle. « Rien du tout. Tu es bizarre, aujourd’hui. » Puis, après un temps : « Mais merci de demander. »' },
        ],
      },
      {
        id: 'soutenir',
        texte: 'Lui demander comment {il:@coequipierA} va, vraiment',
        effets: [{ relation: '@coequipierA', delta: { attachement: 5, confiance: 3 } }, { stat: 'attributs.perception', delta: 1 }],
        resultat: [
          { si: ami(['proche', 'ami', 'distant']), texte: '{@coequipierA} hésite. Puis {il:@coequipierA} parle : sa famille, la fatigue, une mission qui s’est mal terminée et dont {il:@coequipierA} n’a parlé à personne. Tu ne donnes pas de conseil. Tu restes. C’est ce qu’il fallait.' },
          { si: ami('decu'), texte: '« Maintenant, tu demandes ? » C’est dur. C’est mérité. Mais {@coequipierA} ne s’en va pas, et finit par répondre. Un peu.' },
        ],
      },
    ],
  },

  // ── Le mentor : la revue, sans jamais radoter ─────────────────────────
  {
    ...vie,
    arc: 'premieres_missions',
    id: 'pr_sensei_revue',
    titre: 'La revue',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 12,
    repetable: { delaiJours: 365, max: 5 },
    personnages: ['@sensei'],
    si: { tout: [ACTIF, SENSEI, { connu: '@sensei' }, { rangMin: 'genin' }] },
    texte: [
      { si: P1, texte: '{@sensei} te fait venir seul·e, après l’entraînement, sur la souche où {il:@sensei} s’assoit toujours. « Je fais ça avec chacun de vous, une fois par an. Assieds-toi. »' },
      { si: P2, texte: 'La souche, un an plus tard. {@sensei} a un carnet sur les genoux. Tu ne savais pas qu’{il:@sensei} prenait des notes.' },
      { si: P3, texte: 'La revue de l’année. Tu connais le rituel, maintenant : la souche, le silence, puis la vérité, dans cet ordre.' },
      { si: sensei('exigeant'), texte: '{@sensei} te regarde des pieds à la tête, longtemps, comme on vérifie une lame. « Tu sais pourquoi tu es là. »' },
      { si: sensei('confiance'), texte: '{@sensei} te tend une tasse de thé avant de commencer. Avec les autres, {il:@sensei} ne fait pas ça.' },
      { si: sensei('decu'), texte: '{@sensei} ne te regarde pas tout de suite. « Je vais te dire ce que j’ai vu. Tu ne vas pas aimer. »' },
    ],
    choix: [
      {
        id: 'ecouter',
        texte: 'Écouter jusqu’au bout, sans te défendre',
        effets: [{ revueMentor: true }, { relation: '@sensei', delta: { respect: 4, confiance: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: [
          // Ce qui a progressé depuis la dernière revue (rien à comparer la première fois).
          { si: { drapeau: 'revues', max: 1 }, texte: '« Je note où tu en es. L’an prochain, on comparera. »' },
          { si: { tout: [{ drapeau: 'revues', min: 2 }, { non: { drapeau: 'revue_progres', egal: '' } }] }, texte: '« Tu as progressé : {revue_progres}. » {@sensei} tapote son carnet. « L’an dernier, j’avais écrit : à travailler. Cette année, je raye. Ne prends pas la grosse tête : j’ai d’autres lignes. »' },
          { si: { tout: [{ drapeau: 'revues', min: 2 }, { drapeau: 'revue_progres', egal: '' }] }, texte: '« Rien n’a bougé depuis l’an dernier. Rien. » {Il:@sensei} referme son carnet. « Tu t’entraînes, je le sais. Tu t’entraînes à ce que tu sais déjà faire. »' },
          { texte: 'Puis le conseil de l’année, celui qu’{il:@sensei} n’a encore jamais donné : {revue_conseil}' },
        ],
      },
      {
        id: 'contester',
        texte: '« Je sais ce que je fais. »',
        effets: [{ revueMentor: true }, { relation: '@sensei', delta: { confiance: -3, respect: 1 } }, { stat: 'attributs.controleEmotionnel', delta: -1 }],
        resultat: [
          { si: sensei('confiance'), texte: '{@sensei} sourit. « Je sais que tu le sais. C’est pour ça que je te le dis quand même. » Et {il:@sensei} te le dit : {revue_conseil}' },
          { si: sensei(['exigeant', 'decu']), texte: '« Bien sûr. » {@sensei} ne hausse pas le ton. {Il:@sensei} n’en a jamais eu besoin. « Alors tu n’auras aucun mal à m’écouter. » {revue_conseil}' },
        ],
      },
      {
        id: 'retour',
        texte: 'Lui demander ce qu’{il:@sensei} faisait mal, à ton âge',
        effets: [{ revueMentor: true }, { relation: '@sensei', delta: { amitie: 5, confiance: 4 } }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: [
          { si: sensei(['confiance', 'exigeant']), texte: '{@sensei} rit, vraiment. « Tout. J’étais pire que toi. Mon maître me l’a dit sur cette même souche, et je ne l’ai pas écouté pendant trois ans. » Un temps. « Écoute-moi plus vite que ça. » {revue_conseil}' },
          { si: sensei('decu'), texte: '« Je répondais. Comme toi, en ce moment. » Ça pique. C’est fait pour. {revue_conseil}' },
        ],
      },
    ],
  },
];
