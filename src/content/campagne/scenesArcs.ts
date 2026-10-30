import type { Campagne, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import { autre, connait, fait, hash01, noter, souvenir } from '../../engine/campagne/outils';
import { arc, jinchuriki, memeVillage, privee, rangDe, scene, vu } from './fabrique';
import { PROFIL } from './akatsuki';

/**
 * Les arcs longs : des histoires en plusieurs actes, qui traversent les âges. Chaque acte n'existe que si le précédent
 * a eu lieu ; le premier ne se joue que dans certaines campagnes (tirage, lien, villages, bête scellée).
 */
const et = (...f: ((c: Campagne) => boolean)[]) => (c: Campagne) => f.every((x) => x(c));
const chroniquer = (c: Campagne, texte: string) => c.chronique.push({ jour: Math.max(c.joueurs[0].jour, c.joueurs[1].jour), texte });

export const SCENES_ARCS: SceneCommuneDef[] = [
  // ── 1. Le rapport caché ──
  scene('mc_rc_1', 'Le rapport caché', [13, 15], 'Une mission d’équipe. Un genin d’une autre équipe, Sōta, meurt au fond d’un ravin. Vous avez vu le chef de mission, le jōnin Takeda, le pousser. Le soir, Takeda dicte le rapport : « Une chute. » Il vous regarde. Il attend.', [
    ['signer', 'Signer le rapport', 'observer'],
    ['refuser', 'Refuser de signer', 'agir'],
    ['garder', 'Signer, et garder une copie de ce que tu as vu', 'proteger'],
  ], [
    ['refuser+refuser', 'Vous refusez tous les deux. Takeda sourit. Le rapport part sans vos signatures, et personne ne vous demande pourquoi. Le lendemain, vos missions sont changées. Vous êtes surveillés.', { l: { loyaute: 6, peur_de_perdre: 4 }, s: ['Le ravin de Sōta, et le rapport que vous n’avez pas signé.', 5, 'tragique'], apres: (c) => fait(c, { id: 'rapport_cache', texte: 'Vous avez vu Takeda pousser Sōta dans le ravin, et refusé de signer.', connus: [0, 1, 'takeda'], preuves: 0 }) }],
    ['garder+garder', 'Vous signez. Et la nuit même, chacun de son côté, vous écrivez ce que vous avez vu, et vous le cachez. Vous ne savez pas que l’autre a fait pareil.', { l: { confiance: 3 }, s: ['Le ravin de Sōta, et la vérité cachée sous une latte.', 5, 'tragique'], apres: (c) => fait(c, { id: 'rapport_cache', texte: 'Tu as caché le témoignage de la mort de Sōta.', connus: [0, 1], preuves: 2 }) }],
    ['defaut', 'Les signatures sont posées, ou pas. Takeda range le rapport. Sōta est enterré, « mort d’une chute ». Vous savez.', { l: { mefiance: 2 }, s: ['Le ravin de Sōta.', 4, 'tragique'], apres: (c) => fait(c, { id: 'rapport_cache', texte: 'Takeda a tué Sōta, et le rapport ment.', connus: [0, 1], preuves: 1 }) }],
  ], { si: et(memeVillage, arc('rapport', 0.55)) }),
  scene('mc_rc_2', 'La sœur de Sōta', [17, 19], 'Une jeune chūnin vous attend devant l’Académie. Elle s’appelle Aoi. C’est la sœur de Sōta. « Vous étiez là. On m’a dit que c’était une chute. Regardez-moi dans les yeux, et dites-le. »', [
    ['dire', 'Lui dire la vérité', 'parler'],
    ['mentir', 'Répéter la version officielle', 'observer'],
    ['proteger', 'Lui dire de ne plus chercher : c’est dangereux', 'proteger'],
  ], [
    ['dire+dire', 'Aoi écoute sans pleurer. Puis elle dit : « Merci. Maintenant, je ne suis plus seule à savoir. » Vous non plus.', { l: { confiance: 6, respect: 4 }, apres: (c) => { const f = c.faits.find((x) => x.id === 'rapport_cache'); if (f) { f.connus.push('aoi'); f.preuves += 1; } } }],
    ['dire+mentir', '{un} dit la vérité ; {deux} répète « une chute ». Aoi regarde {deux} longuement, et s’en va. {un} ne sait plus de quel côté est {deux}.', { un: { mefiance: 8 }, deux: { ressentiment: 4 }, apres: (c) => { const f = c.faits.find((x) => x.id === 'rapport_cache'); if (f) f.connus.push('aoi'); } }],
    ['defaut', 'Aoi n’obtient rien. Elle part en disant : « Je trouverai sans vous. » Elle trouvera.', { l: { peur_de_perdre: 3 } }],
  ], { si: vu('mc_rc_1') }),
  scene('mc_rc_3', 'Takeda monte', [21, 24], 'Takeda est nommé au conseil. Le soir de sa nomination, il vous croise dans la rue et vous salue, très poliment, en appelant chacun par son prénom. Le lendemain, Aoi est envoyée en mission à la frontière nord, d’où l’on revient rarement.', [
    ['denoncer', 'Porter l’affaire devant le {kage}', 'parler'],
    ['aoi', 'Partir protéger Aoi, en secret', 'proteger'],
    ['chantage', 'Faire savoir à Takeda que vous avez une preuve', 'agir'],
  ], [
    ['denoncer+denoncer', 'Le {kage} écoute vos deux voix, puis la preuve. Il se tait longtemps. « Takeda a des amis. Il me faudra du temps. Ne faites rien. » Vous avez allumé une mèche.', { l: { loyaute: 6 }, apres: (c) => { const f = c.faits.find((x) => x.id === 'rapport_cache'); if (f) f.connus.push('kage'); } }],
    ['aoi+aoi', 'Vous partez au nord sans ordre de mission. Vous trouvez Aoi au moment où les tueurs de Takeda la trouvent.', { l: { confiance: 6 }, a: 4, combat: 'combat_traite' }],
    ['chantage+chantage', 'Un mot glissé sous la porte de Takeda. Aoi est rappelée du nord le lendemain. Takeda vous salue toujours poliment. Vous êtes désormais ses ennemis, et ses complices.', { l: { dependance: 6, mefiance: 2 }, apres: (c) => fait(c, { id: 'chantage_takeda', texte: 'Vous faites chanter Takeda avec le témoignage de la mort de Sōta.', connus: [0, 1, 'takeda'], preuves: 1 }) }],
    ['defaut', 'Vous ne vous mettez pas d’accord. Chacun fait ce qu’il peut. Aoi revient du nord, blessée, vivante. Takeda sait que l’un de vous l’a aidée. Il ne sait pas lequel.', { l: { mefiance: 3 } }],
  ], { si: vu('mc_rc_2') }),
  scene('mc_rc_4', 'Le procès de Takeda', [25, 30], 'Takeda est enfin jugé. Il faut deux témoins. Il vous fait porter, à chacun, une lettre : s’il tombe, il dira ce que vous avez fait, vous aussi, en mission, pour le village. Et il a la liste.', [
    ['temoigner', 'Témoigner quand même', 'agir'],
    ['retirer', 'Retirer ton témoignage', 'partir'],
    ['avouer', 'Avouer d’abord tes propres fautes, puis témoigner', 'parler'],
  ], [
    ['temoigner+temoigner', 'Deux témoins. Takeda tombe. Il dit tout ce qu’il sait de vous, et une partie est vraie. Le village vous regarde autrement. Sōta a enfin une tombe qui ne ment pas.', { l: { loyaute: 8, respect: 6 }, s: ['Le procès de Takeda : Sōta a enfin une tombe qui ne ment pas.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 4 }], apres: (c) => chroniquer(c, 'On raconte que deux ninjas ont fait tomber un conseiller, pour un genin mort quinze ans plus tôt.') }],
    ['avouer+avouer', 'Vous avouez vos propres fautes avant lui, devant le tribunal. Takeda n’a plus rien à dire. Il tombe. Vous perdez vos grades pour un an, et gagnez quelque chose qui n’a pas de nom.', { l: { confiance: 8, respect: 8 }, fx: [{ stat: 'social.reputation', delta: 2 }], s: ['Le jour où vous avez avoué avant lui.', 5, 'fier'] }],
    ['temoigner+retirer', '{un} témoigne. {deux} se retire. Un seul témoin ne suffit pas. Takeda est libéré, et le soir même, {un} trouve une lettre sous sa porte : « Ton ami t’a lâché. »', { un: { ressentiment: 10, confiance: -8 }, deux: { dette: 4 }, s: ['Le témoin qui s’est retiré.', 5, 'amer'] }],
    ['defaut', 'Le procès s’enlise. Takeda meurt avant le verdict, de maladie, dit-on. On ne saura jamais. Vous, si.', { l: { peur_de_perdre: 3 } }],
  ], { si: vu('mc_rc_3') }),

  // ── 2. Les deux candidats Kage ──
  scene('mc_kc_1', 'Le regard du Kage', [18, 22], 'Une cérémonie au village. Le {kage}, passant devant les rangs, s’arrête devant vous deux. Il ne dit rien. Il vous regarde, longtemps, l’un puis l’autre, comme on compare deux lames. Tout le monde l’a vu.', [
    ['soutenir', 'Soutenir son regard', 'agir'],
    ['baisser', 'Baisser les yeux', 'observer'],
    ['autre', 'Regarder l’autre plutôt que le {kage}', 'proteger'],
  ], [
    ['autre+autre', 'Vous vous regardez l’un l’autre, pas le {kage}. Il sourit. « Bien. » Et il passe. Les anciens en parlent toute la soirée.', { l: { loyaute: 6 }, a: 3, s: ['Le regard du {kage}, et le vôtre l’un vers l’autre.', 4, 'fier'] }],
    ['soutenir+soutenir', 'Deux regards droits, deux défis. Le {kage} hoche la tête. Désormais, au village, on vous appelle « les deux héritiers », à mi-voix.', { l: { rivalite: 8 }, a: 2 }],
    ['defaut', 'Le {kage} passe. Les murmures restent : l’un des deux, un jour. Mais lequel ?', { l: { rivalite: 4 } }],
  ], { si: et(memeVillage, arc('kage', 0.6)) }),
  scene('mc_kc_2', 'Les factions', [27, 31], 'Le conseil se divise. Une moitié soutient l’un de vous ; l’autre moitié, l’autre. Personne ne vous a demandé votre avis. Un conseiller vient voir chacun de vous, en secret, avec un dossier sur l’autre.', [
    ['bruler', 'Brûler le dossier sans le lire', 'proteger'],
    ['lire', 'Le lire', 'observer'],
    ['montrer', 'Le montrer à l’autre', 'parler'],
  ], [
    ['montrer+montrer', 'Vous échangez vos dossiers, au bord de la rivière, et vous lisez ce qu’on voulait utiliser contre vous. Il y a des choses vraies. Vous les jetez à l’eau ensemble.', { l: { confiance: 10, loyaute: 4 }, s: ['Les deux dossiers jetés à la rivière.', 5, 'chaud'] }],
    ['lire+lire', 'Chacun lit. Chacun apprend quelque chose de l’autre qu’il ignorait. Chacun se tait. La campagne pour la succession vient de commencer.', { l: { mefiance: 8, rivalite: 6 }, apres: (c) => { fait(c, { id: 'dossier_0', texte: 'Tu as lu le dossier du conseil sur l’autre.', connus: [0], preuves: 1, cible: 1 }); fait(c, { id: 'dossier_1', texte: 'Tu as lu le dossier du conseil sur l’autre.', connus: [1], preuves: 1, cible: 0 }); } }],
    ['bruler+lire', '{un} brûle le sien. {deux} lit le sien. Le lendemain, {deux} regarde {un} autrement. {un} ne saura jamais ce qu’il y avait dedans.', { deux: { mefiance: 6 }, apres: (c, un) => fait(c, { id: 'dossier_lu', texte: 'Tu as lu le dossier du conseil sur l’autre, et tu sais ce qu’il cache.', connus: [autre(un)], preuves: 1, cible: un }) }],
    ['defaut', 'Les dossiers circulent. Les factions grandissent. Vous vous voyez moins.', { l: { mefiance: 4 }, a: -2 }],
  ], { si: vu('mc_kc_1') }),
  scene('mc_kc_3', 'Celui qui n’a pas été choisi', [32, 40], 'Le chapeau a été donné. Le jour même, l’autre reçoit deux lettres. L’une vient du nouveau {kage} : il lui propose d’être son conseiller de l’ombre. L’autre n’a pas de signature : un autre village lui offre un poste, et une revanche.', [
    ['ombre', 'Accepter l’ombre', 'proteger'],
    ['partir', 'Partir', 'partir'],
    ['rester', 'Rester, sans rien accepter', 'observer'],
  ], [
    ['ombre+ombre', 'Le chapeau et l’ombre. Pendant des années, le village croira que son {kage} décide seul. Il ne décidera jamais rien sans l’autre.', { l: { loyaute: 10, confiance: 6 }, s: ['Le chapeau et l’ombre.', 5, 'fier'], apres: (c) => chroniquer(c, 'On dit que le nouveau Kage ne prend aucune décision sans consulter un vieil ami, qui ne porte aucun titre.') }],
    ['partir+*', 'Une valise, un matin. L’autre village a un nouveau jōnin. Le {kage} apprend la nouvelle en lisant un rapport. Il le relit trois fois.', { l: { ressentiment: 6, peur_de_perdre: 8 }, s: ['Le matin du départ, après le chapeau.', 5, 'amer'] }],
    ['defaut', 'Rien n’est accepté, rien n’est refusé. Vous restez dans le même village, à des places différentes. C’est plus difficile que tout le reste.', { l: { jalousie: 4 } }],
  ], { si: (c) => vu('mc_kc_2')(c) && c.joueurs.some((s) => s.rang === 'kage') }),

  // ── 3. Le jinchūriki et le gardien ──
  scene('mc_jg_1', 'Le sceau', [10, 14], (c) => `Une nuit, ${c.creations[jinchuriki(c) ?? 0].prenom} se réveille en hurlant. Le sceau sur son ventre brûle, rouge comme une braise. L’autre est là, et voit tout. Les adultes ont toujours dit qu’il ne fallait pas en parler.`, [
    ['tenir', 'Le tenir jusqu’à ce que ça passe', 'proteger'],
    ['adultes', 'Courir chercher les adultes', 'parler'],
    ['regarder', 'Regarder le sceau, comprendre', 'observer'],
  ], [
    ['tenir+tenir', 'Jusqu’à l’aube, une main sur la braise. Elle brûle aussi la main de celui qui tient. Au matin, le sceau est éteint, et la main garde une marque. La même forme.', { l: { confiance: 10, peur_de_perdre: 8 }, a: 6, s: ['La nuit du sceau, et la main brûlée de la même marque.', 5, 'tragique'], apres: (c) => fait(c, { id: 'gardien', texte: 'Tu sais ce que cache le sceau, et tu as juré de le garder.', connus: [0, 1], preuves: 0 }) }],
    ['adultes+*', 'Les adultes arrivent, et emmènent le jinchūriki. Il revient trois jours plus tard, sans rien dire. On vous a ordonné d’oublier. Vous n’oubliez pas.', { l: { peur_de_perdre: 6 }, s: ['La nuit du sceau, et l’ordre d’oublier.', 4, 'tragique'] }],
    ['defaut', 'Ça passe. Vous n’en parlez pas. Mais l’un sait, désormais, ce que porte l’autre.', { l: { confiance: 4, peur_de_perdre: 4 } }],
  ], { si: (c) => jinchuriki(c) !== undefined }),
  privee('mc_jg_2', 'La voix', [16, 22], jinchuriki, 'La nuit, la bête te parle. Elle parle de {autre}. « Celui-là te regarde comme on regarde une cage. Il a peur de moi. Il a peur de toi. Laisse-moi lui montrer. »', [
    ['taire', 'La faire taire', 'agir'],
    ['ecouter', 'L’écouter', 'observer'],
    ['dire', 'Le dire à {autre}, demain', 'parler'],
  ], [
    ['taire', 'Tu serres les dents jusqu’à l’aube. La bête rit, et se tait. Elle reviendra. Tu ne diras rien à {autre}.', { apres: (c) => fait(c, { id: 'voix_bete', texte: 'La bête te parle la nuit, et tu ne l’as dit à personne.', connus: [jinchuriki(c)!], preuves: 0 }) }],
    ['ecouter', 'Tu l’écoutes. Elle sait des choses. Des choses vraies, sur {autre}, que tu ne savais pas. Le matin, tu regardes {autre} autrement.', { apres: (c) => { const j = jinchuriki(c)!; c.lien.axes[j].mefiance = Math.min(100, c.lien.axes[j].mefiance + 10); fait(c, { id: 'voix_bete', texte: 'La bête te parle de l’autre, et tu l’écoutes.', connus: [j], preuves: 1 }); } }],
    ['dire', 'Le lendemain, tu le dis à {autre}. {Il:autre} ne dit rien. Puis : « Alors je resterai, la nuit. Pour qu’elle ait quelqu’un à qui parler, à part toi. »', { apres: (c) => { const j = jinchuriki(c)!; fait(c, { id: 'voix_bete', texte: 'La bête parle la nuit. Vous le savez tous les deux.', connus: [0, 1], preuves: 0 }); souvenir(c, 'voix_bete', 'La voix de la bête, et la promesse de rester la nuit.', 5, 'chaud'); noter(c, autre(j), `${c.creations[j].prenom} t’a dit que la bête lui parlait la nuit, et parlait de toi.`); } }],
  ], { si: vu('mc_jg_1') }),
  scene('mc_jg_3', 'Les chasseurs', [20, 30], (c) => `Deux manteaux à nuages rouges ont été vus près du village. Ils posent des questions sur ${c.creations[jinchuriki(c) ?? 0].prenom}. Le {kage} propose de cacher le jinchūriki dans un temple de montagne, seul, le temps qu’il faudra.`, [
    ['cacher', 'Accepter la cachette', 'partir'],
    ['affronter', 'Les attendre, ensemble', 'agir'],
    ['accompagner', 'Partir au temple, à deux', 'proteger'],
  ], [
    ['affronter+affronter', 'Vous refusez la cachette. Ils viennent, comme prévu. Vous êtes prêts, ou presque.', { l: { loyaute: 6 }, a: 5, combat: 'combat_miroir' }],
    ['accompagner+accompagner', 'Un an au temple, à deux. Les chasseurs ne trouvent rien. Quand vous redescendez, vous vous connaissez comme personne, et le gardien a appris des sceaux que personne d’autre ne connaît.', { l: { confiance: 8, dependance: 6 }, a: 6, s: ['L’année au temple, cachés à deux.', 5, 'chaud'] }],
    ['cacher+affronter', '{un} part se cacher ; {deux} reste attendre les chasseurs, seul{e:deux}. Ils viennent. Ils repartent. {deux} ne raconte pas ce qui s’est passé, et porte désormais une cicatrice au cou.', { un: { dette: 10 }, deux: { peur_de_perdre: 6 }, fxDeux: [{ blessure: { id: 'chasseurs', nom: 'Les chasseurs de l’Aube', gravite: 2, jours: 40 } }] }],
    ['defaut', 'Ils viennent, et il faut se battre.', { combat: 'combat_miroir' }],
  ], { si: (c) => vu('mc_jg_1')(c) && !c.akatsuki.detruite }),
  scene('mc_jg_4', 'Le sceau cède', [26, 40], 'Un combat de trop. Le sceau cède. La bête sort, à moitié, et le jinchūriki hurle à l’intérieur d’elle. Il n’y a qu’une personne qui sache refaire ce sceau, et elle est là, à dix pas.', [
    ['sceller', 'Refaire le sceau, à mains nues', 'proteger'],
    ['retenir', 'Retenir la bête de l’intérieur', 'agir'],
    ['appeler', 'Appeler l’autre par son prénom', 'parler'],
  ], [
    ['appeler+sceller', 'Une voix qui appelle de l’intérieur, des mains qui scellent de l’extérieur. Il faudra tout ce que vous êtes.', { l: { confiance: 6 }, a: 8, combat: 'combat_biju' }],
    ['defaut', 'L’un retient, l’autre scelle.', { a: 5, combat: 'combat_biju' }],
  ], { si: vu('mc_jg_1') }),

  // ── 4. L'élève commun ──
  scene('mc_ec_1', 'Kaito', [22, 28], 'Dans les ruines d’un village détruit, un enfant de quatre ans, seul, qui ne pleure plus. Il tient votre manche, à tous les deux, une main chacun. Il dit qu’il s’appelle Kaito.', [
    ['garder', 'L’élever, à deux', 'proteger'],
    ['orphelinat', 'Le confier à l’orphelinat', 'parler'],
    ['moi', 'L’élever seul : l’autre n’a pas le temps', 'agir'],
  ], [
    ['garder+garder', 'Deux maisons, deux sensei, deux façons de se faire gronder. Kaito vous appelle par vos deux prénoms collés ensemble.', { l: { loyaute: 8, confiance: 6 }, a: 4, s: ['Kaito, trouvé dans les ruines, une main dans chacune des vôtres.', 5, 'chaud'], promesse: ['kaito', 'Élever Kaito ensemble, jusqu’à ce qu’il soit ninja.'] }],
    ['moi+garder', '{un} veut l’élever seul{e:un}. {deux} insiste. Kaito vit chez {un}, et passe ses dimanches chez {deux}. Il les aime tous les deux, différemment.', { l: { confiance: 3, rivalite: 4 }, s: ['Kaito, et ses dimanches.', 4, 'chaud'] }],
    ['defaut', 'Kaito part à l’orphelinat. Vous allez le voir, chacun de votre côté. Un jour, il demande à vivre avec vous. Vous ne savez pas dire non.', { l: { confiance: 4 }, s: ['Kaito, venu vous chercher à l’orphelinat.', 4, 'chaud'] }],
  ], { si: arc('eleve', 0.5) }),
  scene('mc_ec_2', 'Le choix de Kaito', [27, 33], 'Kaito a dix ans. Il doit choisir sa voie à l’Académie, et il veut que l’un de vous soit son maître. Un seul. Il le demande devant vous deux, très sérieusement.', [
    ['toi', 'Lui dire de choisir l’autre', 'proteger'],
    ['moi', 'Lui dire de te choisir', 'agir'],
    ['deux', 'Refuser : ce sera les deux', 'parler'],
  ], [
    ['deux+deux', 'Kaito soupire, comme un vieux. « Je savais que vous diriez ça. » Il s’entraîne le matin avec l’un, le soir avec l’autre. Il est épuisé. Il est heureux.', { l: { confiance: 6 }, a: 3 }],
    ['toi+toi', 'Chacun pousse Kaito vers l’autre. Kaito vous regarde, et choisit le troisième nom : un vieux sensei de l’Académie. Vous l’avez bien mérité.', { l: { confiance: 4 }, s: ['Kaito, qui a choisi un troisième maître.', 4, 'chaud'] }],
    ['moi+toi', 'Kaito choisit {un}. {deux} sourit, et rentre seul{e:deux}. Plus tard, Kaito viendra voir {deux} en secret, pour apprendre ce que {un} ne sait pas.', { deux: { jalousie: 4, peur_de_perdre: 4 }, un: { respect: 2 } }],
    ['moi+moi', 'Kaito vous regarde vous disputer pour lui, et s’en va. Il ne revient que le soir. « Je choisirai quand vous aurez fini. »', { l: { rivalite: 6 } }],
    ['defaut', 'Kaito choisit. Ce n’est pas une catastrophe. C’est presque.', { l: { jalousie: 3 } }],
  ], { si: vu('mc_ec_1') }),
  scene('mc_ec_3', 'Le premier ordre de Kaito', [33, 40], 'Kaito est genin. Sa première vraie mission tourne mal, et c’est vous deux qu’on envoie le chercher. Il est retranché dans une grange avec son équipe, et les détrousseurs encerclent la grange.', [
    ['foncer', 'Foncer', 'agir'],
    ['plan', 'Faire un plan, même si ça prend du temps', 'observer'],
    ['lui', 'Lui laisser l’initiative : c’est sa mission', 'proteger'],
  ], [
    ['lui+lui', 'Vous lui faites signe : à toi. Kaito sort de la grange, et donne ses ordres. Ils sont bons. Vous vous battez sous ses ordres.', { l: { confiance: 6, respect: 4 }, a: 4, combat: 'combat_nuit' }],
    ['defaut', 'Il faut le sortir de là.', { l: { peur_de_perdre: 4 }, combat: 'combat_nuit' }],
  ], { si: vu('mc_ec_2') }),
  scene('mc_ec_4', 'Kaito vous dépasse', [40, 55], 'Kaito est jōnin. Lors d’un entraînement, pour la première fois, il vous bat tous les deux, ensemble, en trois mouvements. Il s’arrête, effrayé de ce qu’il vient de faire.', [
    ['rire', 'Éclater de rire', 'parler'],
    ['fier', 'Lui dire que tu es fier', 'proteger'],
    ['revanche', 'Exiger une revanche', 'agir'],
  ], [
    ['rire+fier', 'L’un rit, l’autre dit qu’il est fier, et Kaito, trente ans, pleure comme un enfant. La promesse est tenue.', { l: { confiance: 8 }, a: 3, s: ['Le jour où Kaito vous a battus tous les deux.', 5, 'chaud'], apres: (c) => { const p = c.lien.promesses.find((x) => x.id === 'kaito'); if (p) p.etat = 'tenue'; chroniquer(c, 'On dit qu’un jeune jōnin a été élevé par deux ninjas qui n’étaient pas ses parents, et qu’il les a dépassés tous les deux.'); } }],
    ['revanche+revanche', 'Deux vieux qui exigent une revanche, et un jeune qui ne sait plus où se mettre. Vous perdez encore. Vous êtes ravis.', { l: { rivalite: 3, confiance: 6 }, a: 2, apres: (c) => { const p = c.lien.promesses.find((x) => x.id === 'kaito'); if (p) p.etat = 'tenue'; } }],
    ['defaut', 'Kaito vous aide à vous relever, l’un après l’autre. Vous ne dites rien. Il n’y a rien à dire.', { l: { confiance: 4 }, apres: (c) => { const p = c.lien.promesses.find((x) => x.id === 'kaito'); if (p) p.etat = 'tenue'; } }],
  ], { si: vu('mc_ec_3') }),

  // ── 5. La dette de sang ──
  scene('mc_ds_1', 'L’homme du gué', [16, 20], 'Une mission d’interception, de nuit, au gué. Un homme tombe. Il avait un fils, dit-on plus tard. Un seul kunai l’a tué. Vous en avez lancé un chacun.', [
    ['taire', 'Ne jamais chercher à savoir', 'observer'],
    ['savoir', 'Retrouver le kunai, pour savoir', 'agir'],
    ['prendre', 'Dire que c’était le tien, quoi qu’il en soit', 'proteger'],
  ], [
    ['prendre+prendre', 'Chacun dit que c’était le sien. Vous le direz jusqu’au bout.', { l: { loyaute: 8 }, s: ['L’homme du gué, que chacun a pris sur lui.', 5, 'tragique'], apres: (c) => fait(c, { id: 'homme_gue', texte: 'L’homme du gué avait un fils. Vous avez tous les deux dit que c’était votre kunai.', connus: [0, 1], preuves: 0 }) }],
    ['savoir+*', 'L’un retrouve le kunai, dans la boue, à l’aube. Il le regarde, et le jette dans la rivière. Il ne dira jamais à qui il appartenait.', { l: { dette: 4 }, apres: (c, un) => fait(c, { id: 'homme_gue', texte: 'Tu sais quel kunai a tué l’homme du gué. Tu l’as jeté à la rivière.', connus: [un], preuves: 1 }) }],
    ['defaut', 'Vous rentrez. Le rapport dit « un ennemi neutralisé ». Il avait un fils.', { l: { peur_de_perdre: 2 }, apres: (c) => fait(c, { id: 'homme_gue', texte: 'L’homme du gué avait un fils.', connus: [0, 1], preuves: 0 }) }],
  ], { si: arc('dette', 0.5) }),
  scene('mc_ds_2', 'Le fils', [26, 32], 'Une lettre, apportée par un enfant des rues : « Je suis le fils de l’homme du gué. Je sais que c’était l’un de vous deux. Je viendrai, et je saurai lequel. »', [
    ['attendre', 'L’attendre ensemble', 'proteger'],
    ['aller', 'Aller à sa rencontre', 'agir'],
    ['ecrire', 'Lui écrire la vérité', 'parler'],
  ], [
    ['ecrire+ecrire', 'Vous écrivez ensemble : l’ordre, la nuit, les deux kunai. Il ne répond pas. Il vient.', { l: { confiance: 4 }, combat: 'combat_vengeur' }],
    ['defaut', 'Il vient, au jour dit.', { combat: 'combat_vengeur' }],
  ], { si: vu('mc_ds_1') }),
  scene('mc_ds_3', 'La grâce', [27, 34], 'Le fils de l’homme du gué est à genoux, désarmé, et il attend le coup. « Finissez-en. Lequel de vous deux, au moins ? Dites-moi lequel. »', [
    ['epargner', 'L’épargner', 'proteger'],
    ['dire', 'Lui dire : c’était moi', 'parler'],
    ['finir', 'En finir', 'agir'],
  ], [
    ['dire+dire', '« C’était moi. » « C’était moi. » Il vous regarde tous les deux, et il rit, un rire terrible, puis il pleure. Il s’en va sans arme. Vous ne le reverrez pas, ou peut-être une fois.', { l: { loyaute: 8 }, s: ['« C’était moi. » « C’était moi. »', 5, 'tragique'] }],
    ['epargner+epargner', 'Vous le laissez partir. Il ne comprend pas. Vous non plus, tout à fait.', { l: { confiance: 4 } }],
    ['finir+epargner', '{un} lève la lame. {deux} se met devant. Le fils s’enfuit. {un} ne pardonnera pas d’avoir été arrêté{e:un}, ni {deux} d’avoir dû le faire.', { un: { ressentiment: 6 }, deux: { mefiance: 6 } }],
    ['finir+finir', 'C’est fini. La dette de sang aussi. Le gué est calme.', { l: { dependance: 6 }, s: ['Le fils du gué, et la fin de la dette.', 5, 'tragique'] }],
    ['defaut', 'Il part. Il reviendra peut-être. Les dettes de sang ne meurent pas vite.', { l: { peur_de_perdre: 2 } }],
  ], { si: vu('mc_ds_2') }),
  scene('mc_ds_4', 'Le genin du gué', [38, 50], 'Un nouveau genin arrive dans votre village, d’un autre pays, avec une lettre de recommandation. Il a les yeux de l’homme du gué. Il ne sait rien. Son père, lui, est resté chez lui.', [
    ['former', 'Le former', 'proteger'],
    ['dire', 'Lui dire qui vous êtes', 'parler'],
    ['eviter', 'L’éviter', 'partir'],
  ], [
    ['former+former', 'Vous formez le petit-fils de l’homme que l’un de vous a tué. Il devient bon. Un jour, son père vient le voir, et vous croise. Il incline la tête. C’est tout. C’est assez.', { l: { confiance: 6 }, s: ['Le petit-fils de l’homme du gué, formé par vous.', 5, 'chaud'], apres: (c) => chroniquer(c, 'On raconte qu’un genin étranger a été formé par les deux ninjas qui avaient tué son grand-père.') }],
    ['defaut', 'Le petit grandit loin de vous. Vous le regardez de loin. Le gué ne vous quittera jamais.', { l: { peur_de_perdre: 3 } }],
  ], { si: vu('mc_ds_3') }),

  // ── 6. Le traité ──
  scene('mc_tr_1', 'Les lettres à travers la frontière', [16, 22], 'Depuis l’enfance, vous vous écrivez par-dessus la frontière, par des marchands, des oiseaux, des enfants. Un jour, un ANBU de chacun de vos villages vous convoque. Ils ont lu vos lettres. Toutes.', [
    ['continuer', 'Promettre d’arrêter, et continuer en secret', 'observer'],
    ['arreter', 'Arrêter d’écrire', 'partir'],
    ['proposer', 'Proposer de servir de canal entre vos villages', 'parler'],
  ], [
    ['proposer+proposer', 'Les deux ANBU se regardent, de loin, par lettres interposées. Six mois plus tard, vos lettres portent des messages officiels. Vous êtes devenus, sans le vouloir, un pont entre deux pays.', { l: { confiance: 6, respect: 4 }, a: 3, s: ['Les lettres devenues un pont entre deux pays.', 5, 'fier'] }],
    ['continuer+continuer', 'Un code, une nouvelle route, un nouvel oiseau. Vos lettres repartent. Si on les trouve, c’est la trahison.', { l: { confiance: 8, dependance: 4 }, apres: (c) => fait(c, { id: 'lettres_frontiere', texte: 'Vous vous écrivez en secret par-dessus la frontière, malgré l’interdiction.', connus: [0, 1], preuves: 2 }) }],
    ['defaut', 'Les lettres s’arrêtent. Pendant deux ans, vous ne savez plus rien l’un de l’autre.', { l: { peur_de_perdre: 6 }, a: -3 }],
  ], { si: (c) => !memeVillage(c) && arc('traite', 0.7)(c) }),
  scene('mc_tr_2', 'Le traité', [24, 32], 'Vos deux villages négocient une paix. On vous a choisis comme témoins, l’un pour chaque village : parce que vous vous connaissez, dit-on. Un assassin a été envoyé pour que la paix ne soit jamais signée.', [
    ['traquer', 'Traquer l’assassin à deux', 'agir'],
    ['alerter', 'Alerter les deux délégations', 'parler'],
    ['garder', 'Garder chacun son délégué', 'proteger'],
  ], [
    ['traquer+traquer', 'Vous le trouvez dans les cuisines.', { l: { confiance: 6 }, a: 5, combat: 'combat_traite' }],
    ['alerter+alerter', 'Deux témoins de deux villages qui donnent l’alerte ensemble : l’assassin s’enfuit, sans rien avoir fait. La paix est signée. Votre nom est dans un coin du traité.', { l: { respect: 6 }, s: ['Votre nom dans un coin du traité.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 5 }], apres: (c) => chroniquer(c, 'Une paix a été signée entre deux villages. Deux témoins, un de chaque côté, l’ont sauvée.') }],
    ['defaut', 'L’assassin frappe. Il manque sa cible. Le traité est signé, mais dans la peur.', { l: { mefiance: 2 } }],
  ], { si: vu('mc_tr_1') }),
  scene('mc_tr_3', 'La paix rompue', [32, 45], 'La paix tient depuis dix ans. Un incident à la frontière, un mort, et vos deux villages préparent à nouveau la guerre. Vous êtes, chacun, au conseil de votre village. Il ne faudrait qu’un mot de chacun.', [
    ['paix', 'Plaider pour la paix, quoi qu’il en coûte', 'parler'],
    ['village', 'Défendre ton village', 'agir'],
    ['rencontre', 'Rencontrer l’autre en secret, à la frontière', 'proteger'],
  ], [
    ['rencontre+rencontre', 'Une nuit à la frontière, à l’endroit où passaient vos lettres. Vous trouvez ensemble qui a tué : ni l’un ni l’autre village. Une troisième main. La guerre n’aura pas lieu.', { l: { confiance: 8, loyaute: 6 }, s: ['La nuit à la frontière, où passaient vos lettres.', 5, 'fier'], apres: (c) => chroniquer(c, 'On dit que deux anciens amis ont empêché une guerre en une seule nuit.') }],
    ['paix+paix', 'Deux voix, dans deux conseils, qui disent la même chose au même moment. Les conseils hésitent. La paix tient, encore un peu.', { l: { respect: 6 } }],
    ['village+village', 'Chacun défend son village. La guerre éclate au printemps. Quelque part, sur un champ de boue, vous vous retrouverez peut-être.', { l: { ressentiment: 6, peur_de_perdre: 6 }, s: ['La paix rompue, chacun de son côté.', 5, 'amer'] }],
    ['defaut', 'Vos voix ne s’accordent pas. La paix vacille, puis tient, par chance.', { l: { mefiance: 3 } }],
  ], { si: vu('mc_tr_2') }),

  // ── 7. La promesse de la cabane ──
  scene('mc_pc_1', 'La cabane', [7, 10], 'Dans la forêt, au bord du ruisseau, vous avez construit une cabane. Elle est de travers. Elle fuit. Elle est à vous. Le dernier jour de l’été, vous gravez quelque chose sur la poutre.', [
    ['promesse', '« Chaque année, ce jour-là, ici. »', 'proteger'],
    ['noms', 'Vos deux noms, et rien d’autre', 'observer'],
    ['secret', 'Un mot secret, que personne ne comprendra', 'parler'],
  ], [
    ['promesse+promesse', 'Chaque année, le dernier jour de l’été, à la cabane. Vous le gravez. Vous le jurez sur vos sangs, avec une épine.', { l: { loyaute: 8, confiance: 6 }, a: 4, s: ['La cabane, et la promesse gravée sur la poutre.', 5, 'chaud'], promesse: ['cabane', 'Se retrouver à la cabane, chaque année, le dernier jour de l’été.'] }],
    ['secret+secret', 'Un mot inventé, qui ne veut rien dire. Il voudra tout dire, plus tard.', { l: { confiance: 6 }, a: 3, s: ['Le mot secret de la cabane.', 5, 'chaud'], promesse: ['cabane', 'Se retrouver à la cabane, chaque année, le dernier jour de l’été.'] }],
    ['defaut', 'Vos deux noms, de travers, sur la poutre. Vous revenez souvent. Puis moins.', { l: { confiance: 4 }, a: 2, promesse: ['cabane', 'Se retrouver à la cabane, chaque année, le dernier jour de l’été.'] }],
  ], { si: arc('cabane', 0.6) }),
  scene('mc_pc_2', 'Le jour où l’un n’est pas venu', [14, 18], 'Le dernier jour de l’été. L’un de vous est à la cabane depuis l’aube. Le soleil se couche. L’autre n’est pas venu.', [
    ['attendre', 'Attendre toute la nuit', 'proteger'],
    ['chercher', 'Aller le chercher', 'agir'],
    ['partir', 'Partir, et ne plus jamais revenir', 'partir'],
  ], [
    ['attendre+*', 'Celui qui attend reste jusqu’à l’aube. Celui qui n’est pas venu arrive au matin, en courant, blessé d’une mission qui a duré trop longtemps. « J’ai couru toute la nuit. » Il n’y a rien à pardonner.', { l: { loyaute: 6, peur_de_perdre: 6 }, s: ['Le matin où l’autre est arrivé en courant, à la cabane.', 5, 'chaud'] }],
    ['partir+*', 'Celui qui attendait part, au coucher du soleil. Celui qui n’est pas venu arrive à minuit. La cabane est vide. Aucun des deux ne saura que l’autre est venu.', { l: { ressentiment: 6, peur_de_perdre: 4 }, s: ['La cabane vide, à minuit.', 4, 'amer'] }],
    ['defaut', 'L’un vient tard, l’autre attend tard. Vous vous croisez à minuit. Ça compte.', { l: { confiance: 4 } }],
  ], { si: vu('mc_pc_1') }),
  scene('mc_pc_3', 'La cabane brûlée', [24, 30], 'La cabane a brûlé. Un incendie de forêt, ou quelqu’un. Il ne reste que la poutre, noire, et l’inscription se lit encore.', [
    ['reconstruire', 'La reconstruire', 'proteger'],
    ['garder', 'Emporter la poutre', 'observer'],
    ['laisser', 'Laisser la forêt la reprendre', 'partir'],
  ], [
    ['reconstruire+reconstruire', 'Vous la reconstruisez, droite cette fois. Elle ne fuit plus. Elle est moins belle. Vous gardez la vieille poutre au milieu.', { l: { loyaute: 6, confiance: 4 }, s: ['La cabane reconstruite autour de la vieille poutre.', 5, 'chaud'] }],
    ['garder+*', 'La poutre est sciée en deux, une moitié chacun. Chacune porte la moitié de l’inscription.', { l: { confiance: 6 }, s: ['La poutre sciée en deux, une moitié chacun.', 5, 'chaud'] }],
    ['defaut', 'La forêt reprendra la cabane. La promesse, elle, est toujours là. Quelque part.', { l: { peur_de_perdre: 3 } }],
  ], { si: vu('mc_pc_2') }),
  scene('mc_pc_4', 'Le dernier été', [50], 'Le dernier jour de l’été. Vous êtes vieux. Le chemin jusqu’à la cabane est long, et l’un de vous marche avec une canne. Vous y êtes arrivés tous les deux.', [
    ['asseoir', 'S’asseoir, et regarder le ruisseau', 'observer'],
    ['graver', 'Graver une dernière ligne', 'parler'],
    ['rire', 'Rire de la cabane de travers', 'proteger'],
  ], [
    ['graver+graver', 'Une dernière ligne, sous l’ancienne. Vous la gravez chacun une moitié, sans vous concerter. Les deux moitiés vont ensemble.', { l: { confiance: 8 }, s: ['La dernière ligne gravée sur la poutre.', 5, 'chaud'], apres: (c) => { const p = c.lien.promesses.find((x) => x.id === 'cabane'); if (p) p.etat = 'tenue'; chroniquer(c, 'Il y a, au bord d’un ruisseau, une cabane de travers où deux vieux ninjas se retrouvent chaque été depuis cinquante ans.'); } }],
    ['defaut', 'Le ruisseau, la cabane, et vous. Cinquante étés. La promesse est tenue.', { l: { confiance: 6 }, s: ['Le cinquantième été à la cabane.', 5, 'chaud'], apres: (c) => { const p = c.lien.promesses.find((x) => x.id === 'cabane'); if (p) p.etat = 'tenue'; } }],
  ], { si: vu('mc_pc_3') }),

  // ── 8. L'ombre et la lumière ──
  scene('mc_ol_1', 'Le héros et l’ombre', [18, 24], 'Le {kage} a besoin d’un héros : un visage pour les affiches, pour les enfants, pour la guerre qui vient. Et il a besoin de quelqu’un pour faire, dans l’ombre, ce qu’un héros ne peut pas faire. Il vous a choisis tous les deux. Il ne dit pas encore qui sera quoi.', [
    ['lumiere', 'Demander la lumière', 'agir'],
    ['ombre', 'Demander l’ombre', 'proteger'],
    ['refuser', 'Refuser les deux', 'partir'],
  ], [
    ['ombre+lumiere', '{un} prend l’ombre, {deux} la lumière. Sur les affiches, il y aura le visage de {deux}. Sous les affiches, il y aura {un}.', { l: { dependance: 6, loyaute: 4 }, s: ['Le héros et l’ombre.', 5, 'tragique'], apres: (c, un) => fait(c, { id: 'ombre_lumiere', texte: `${c.creations[un].prenom} est l’ombre, ${c.creations[autre(un)].prenom} est la lumière.`, connus: [0, 1, 'kage'], preuves: 0 }) }],
    ['ombre+ombre', 'Vous demandez tous les deux l’ombre. Le {kage} sourit, et choisit à votre place.', { l: { loyaute: 6 }, apres: (c) => fait(c, { id: 'ombre_lumiere', texte: `${c.creations[0].prenom} est l’ombre, ${c.creations[1].prenom} est la lumière.`, connus: [0, 1, 'kage'], preuves: 0 }) }],
    ['lumiere+lumiere', 'Vous voulez tous les deux la lumière. Le {kage} choisit. Celui qui reste dans l’ombre ne l’a pas voulu.', { l: { jalousie: 8, rivalite: 6 }, apres: (c) => fait(c, { id: 'ombre_lumiere', texte: `${c.creations[1].prenom} est l’ombre, ${c.creations[0].prenom} est la lumière.`, connus: [0, 1, 'kage'], preuves: 0 }) }],
    ['defaut', 'Le {kage} vous laisse partir. Il trouvera quelqu’un d’autre. Mais il se souviendra de vous.', { l: { confiance: 2 } }],
  ], { si: et(memeVillage, arc('ombre', 0.5)) }),
  privee('mc_ol_2', 'Ce que fait l’ombre', [22, 30], (c) => {
    const f = c.faits.find((x) => x.id === 'ombre_lumiere');
    return f ? (f.texte.startsWith(c.creations[0].prenom) ? 0 : 1) : undefined;
  }, 'Un journaliste de la capitale a découvert quelque chose sur {autre} : une mission ancienne, un village brûlé. S’il publie, le héros tombe. Tu as son adresse. Tu as la nuit.', [
    ['tuer', 'Le faire taire, pour de bon', 'agir'],
    ['acheter', 'L’acheter', 'parler'],
    ['laisser', 'Le laisser publier : {autre} doit répondre de ses actes', 'partir'],
  ], [
    ['tuer', 'Le journaliste ne publiera pas. Personne ne saura pourquoi. Le visage de {autre} reste sur les affiches. Le tien n’y sera jamais.', { apres: (c) => { const j = c.faits.find((x) => x.id === 'ombre_lumiere')!.texte.startsWith(c.creations[0].prenom) ? 0 : 1; fait(c, { id: 'ombre_sang', texte: 'Tu as tué un journaliste pour protéger la réputation de l’autre.', connus: [j as IdJoueur], preuves: 2, cible: autre(j as IdJoueur) }); c.joueurs[j].social.reputationOmbre = Math.min(100, c.joueurs[j].social.reputationOmbre + 15); } }],
    ['acheter', 'Il prend l’argent, beaucoup d’argent. Il pourra revenir. Ils reviennent toujours.', { apres: (c) => { const j = c.faits.find((x) => x.id === 'ombre_lumiere')!.texte.startsWith(c.creations[0].prenom) ? 0 : 1; fait(c, { id: 'ombre_sang', texte: 'Tu as acheté le silence d’un journaliste pour protéger l’autre.', connus: [j as IdJoueur], preuves: 1, cible: autre(j as IdJoueur) }); } }],
    ['laisser', 'L’article paraît. Le héros tombe des affiches. On ne saura jamais que tu aurais pu l’empêcher.', { apres: (c) => { const j = c.faits.find((x) => x.id === 'ombre_lumiere')!.texte.startsWith(c.creations[0].prenom) ? 0 : 1; fait(c, { id: 'ombre_laisse', texte: 'Tu aurais pu empêcher l’article qui a fait tomber l’autre.', connus: [j as IdJoueur], preuves: 0, cible: autre(j as IdJoueur) }); noter(c, autre(j as IdJoueur), 'Un article de la capitale raconte une mission ancienne. Ton visage disparaît des affiches.'); } }],
  ], { si: vu('mc_ol_1') }),
  scene('mc_ol_3', 'Le héros apprend', [28, 36], (c) => (connait(c, 'ombre_sang', 0) || connait(c, 'ombre_sang', 1) ? 'Une lettre anonyme arrive chez le héros : le nom d’un journaliste, une date, et une phrase. « Demande à ton ombre ce qu’elle a fait cette nuit-là. »' : 'Le héros et l’ombre se retrouvent, des années après, sur un toit. « Est-ce que ça valait le coup ? » demande l’un.'), [
    ['demander', 'Demander la vérité', 'parler'],
    ['savoir', 'Ne pas vouloir savoir', 'observer'],
    ['avouer', 'Tout avouer avant qu’on demande', 'proteger'],
  ], [
    ['avouer+demander', 'La vérité tombe, entière. Le héros écoute jusqu’au bout. Puis il dit : « Tu aurais dû me laisser tomber. » Et, plus bas : « Merci. » Les deux sont vrais.', { l: { confiance: 6, dette: 8 }, s: ['« Tu aurais dû me laisser tomber. » « Merci. »', 5, 'tragique'], apres: (c) => { for (const id of ['ombre_sang', 'ombre_laisse']) { const f = c.faits.find((x) => x.id === id); if (f) { for (const j of [0, 1] as IdJoueur[]) if (!f.connus.includes(j)) f.connus.push(j); } } } }],
    ['savoir+savoir', 'Personne ne demande, personne ne dit. Vous restez sur le toit jusqu’à l’aube. Le silence est un choix, lui aussi.', { l: { dependance: 6, peur_de_perdre: 4 } }],
    ['defaut', 'La vérité sort à moitié. L’autre moitié restera là, entre vous, pour toujours.', { l: { mefiance: 6 } }],
  ], { si: vu('mc_ol_1') }),
];

// ── L'Akatsuki de votre temps ────────────────────────────────

/** Celui que l'Akatsuki approche : celui qui en veut le plus à son village, ou à l'autre. */
const cibleRecrutement = (c: Campagne): IdJoueur | undefined => {
  if (c.akatsuki.recrues.length || c.akatsuki.detruite) return undefined;
  const score = (j: IdJoueur) => c.lien.axes[j].ressentiment + c.lien.axes[j].jalousie - c.joueurs[j].social.loyaute / 2 + hash01(c, `recrue:${j}`) * 20;
  return score(0) >= score(1) ? 0 : 1;
};
const recrue = (c: Campagne): IdJoueur | undefined => c.akatsuki.recrues[0];
const infiltre = (c: Campagne): IdJoueur | undefined => c.akatsuki.infiltre;
const dedans = (c: Campagne): IdJoueur | undefined => recrue(c) ?? infiltre(c);
const binome = (c: Campagne, i = 0) => c.akatsuki.binomes[i] ?? ['oboro', 'tetsuya'];

/** La couverture de l'infiltré bouge ; à zéro, il est démasqué, et l'Aube vient pour vous deux. */
function couverture(c: Campagne, d: number): void {
  if (c.akatsuki.infiltre === undefined) return;
  c.akatsuki.couverture = Math.max(0, Math.min(100, c.akatsuki.couverture + d));
  if (c.akatsuki.couverture === 0 && !c.faits.some((f) => f.id === 'infiltre_demasque')) {
    const j = c.akatsuki.infiltre;
    fait(c, { id: 'infiltre_demasque', texte: 'L’Akatsuki sait que tu es un espion de ton village.', connus: [j, 'akatsuki'], preuves: 3 });
    noter(c, j, 'Ta couverture est tombée. L’Akatsuki sait. Ils viendront pour toi, et pour celui qui compte le plus pour toi.');
  }
}

export const SCENES_AKATSUKI: SceneCommuneDef[] = [
  scene('mc_ak_rumeur', 'Les nuages rouges', [19, 24], (c) => {
    const b = binome(c);
    return `On parle, dans les tavernes, de manteaux noirs à nuages rouges. Une organisation de déserteurs de rang S. Un nom revient : ${PROFIL_NOM(b[0])}, et un autre, toujours avec le premier : ${PROFIL_NOM(b[1])}. Ils travaillent à deux, comme vous.`;
  }, [
    ['enqueter', 'Enquêter', 'observer'],
    ['rapport', 'Faire un rapport au {kage}', 'parler'],
    ['ignorer', 'Ce ne sont que des histoires', 'partir'],
  ], [
    ['enqueter+enqueter', 'Trois semaines à écouter les tavernes. Vous apprenez les noms des six, leurs binômes, et une chose qui vous glace : ils recrutent parmi les ninjas qui en veulent à leur village. Ou à leur partenaire.', { l: { confiance: 4 }, a: 3, apres: (c) => fait(c, { id: 'akatsuki_connue', texte: 'Vous connaissez les six membres de l’Akatsuki de votre temps.', connus: [0, 1], preuves: 0 }) }],
    ['rapport+rapport', 'Le {kage} vous écoute, et vous remercie. Il savait déjà. Il ne vous dit pas comment.', { l: { confiance: 2 }, apres: (c) => fait(c, { id: 'akatsuki_connue', texte: 'L’Akatsuki existe, et le Kage la surveille.', connus: [0, 1, 'kage'], preuves: 0 }) }],
    ['defaut', 'Les histoires continuent. Un jour, elles frapperont à votre porte.', { apres: (c) => fait(c, { id: 'akatsuki_connue', texte: 'On parle de manteaux à nuages rouges.', connus: [0, 1], preuves: 0 }) }],
  ]),
  privee('mc_ak_recrutement', 'L’homme au parapluie', [22, 40], cibleRecrutement, (c) => {
    const b = binome(c, 1);
    return `Un soir de pluie, quelqu’un s’assoit en face de toi à la taverne. Un manteau noir, des nuages rouges. ${PROFIL_NOM(b[0])}. « On t’observe depuis longtemps. Ton village ne te voit pas. Et {autre}… {autre} ne te verra jamais comme tu le mérites. Viens. Personne ne le saura. Pas même {lui:autre}. »`;
  }, [
    ['accepter', 'Accepter l’anneau', 'agir'],
    ['refuser', 'Refuser', 'partir'],
    ['signaler', 'Faire semblant d’hésiter, et tout rapporter au {kage}', 'parler'],
  ], [
    ['accepter', 'L’anneau est froid. Il te va. Tu restes au village, avec ton bandeau. Désormais, tu as deux maîtres, et l’un d’eux ne pardonne pas.', { apres: (c) => { const j = cibleRecrutement(c) ?? 0; if (!c.akatsuki.recrues.includes(j)) c.akatsuki.recrues.push(j); fait(c, { id: 'recrue_akatsuki', texte: 'Tu portes en secret l’anneau de l’Akatsuki.', connus: [j, 'akatsuki'], preuves: 1, cible: autre(j) }); } }],
    ['refuser', 'Il sourit, et s’en va sous la pluie. « La porte reste ouverte. » Tu ne dors pas cette nuit-là.', { apres: (c) => { const j = cibleRecrutement(c) ?? 0; fait(c, { id: 'approche_akatsuki', texte: 'L’Akatsuki t’a approché, et tu as refusé. Tu ne l’as dit à personne.', connus: [j], preuves: 0 }); } }],
    ['signaler', 'Le {kage} t’écoute, très calme. Puis il dit : « Retourne le voir. Accepte. Et rapporte-moi tout. » Tu vas devenir un espion, et tu n’as pas le droit de le dire à {autre}.', { apres: (c) => { const j = cibleRecrutement(c) ?? 0; c.akatsuki.infiltre = j; c.akatsuki.couverture = 60; fait(c, { id: 'infiltration', texte: 'Tu es infiltré dans l’Akatsuki, sur ordre du Kage.', connus: [j, 'kage'], preuves: 0, cible: autre(j) }); } }],
  ], { si: (c) => vu('mc_ak_rumeur')(c) && c.akatsuki.infiltre === undefined }),
  privee('mc_ak_ordre', 'L’ordre de l’Aube', [24, 44], dedans, (c) => `Un message, caché dans un nid d’oiseau : l’Akatsuki veut les itinéraires des prochaines missions de ton village. Et une chose de plus : les habitudes de {autre}, ses techniques, ses faiblesses. ${infiltre(c) !== undefined ? 'Ta couverture en dépend.' : 'Ils ne demandent pas deux fois.'}`, [
    ['livrer', 'Tout livrer', 'agir'],
    ['mentir', 'Livrer des informations fausses', 'observer'],
    ['proteger', 'Livrer les itinéraires, mais rien sur {autre}', 'proteger'],
  ], [
    ['livrer', 'Tout part, dans le nid. Les habitudes de {autre} aussi. Quelque part, quelqu’un apprend à {le:autre} tuer.', { apres: (c) => { const j = dedans(c)!; c.akatsuki.ordres = (c.akatsuki.ordres ?? 0) + 1; couverture(c, 15); fait(c, { id: 'livre_autre', texte: 'Tu as livré à l’Akatsuki les techniques et les faiblesses de l’autre.', connus: [j, 'akatsuki'], preuves: 2, cible: autre(j) }); c.joueurs[j].social.reputationOmbre = Math.min(100, c.joueurs[j].social.reputationOmbre + 10); } }],
    ['mentir', 'Des itinéraires faux, des faiblesses inventées. C’est risqué. Ils vérifient toujours.', { apres: (c) => { couverture(c, -25); if (infiltre(c) === undefined) { const f = c.faits.find((x) => x.id === 'recrue_akatsuki'); if (f) f.preuves += 1; } } }],
    ['proteger', 'Les itinéraires partent. Pas un mot sur {autre}. Ils le remarqueront.', { apres: (c) => { c.akatsuki.ordres = (c.akatsuki.ordres ?? 0) + 1; couverture(c, -10); } }],
  ], { si: (c) => dedans(c) !== undefined && !c.akatsuki.detruite }),
  scene('mc_ak_soupcon', 'Le fil rouge', [25, 46], 'Une mission ordinaire. Au retour, l’un de vous remarque quelque chose dans la manche de l’autre : un fil de tissu noir, avec une trace rouge. Ça pourrait être n’importe quoi.', [
    ['demander', 'Demander, simplement', 'parler'],
    ['suivre', 'Le suivre, la nuit', 'observer'],
    ['confiance', 'Ne rien dire : c’est {autre}', 'proteger'],
  ], [
    ['suivre+*', 'La nuit, celui qui a vu le fil suit l’autre jusqu’à la forêt, jusqu’à un nid d’oiseau, jusqu’à un message. Il ne dit rien. Il sait.', { apres: (c, un) => { const j = dedans(c); if (j === undefined || j === un) return; const f = c.faits.find((x) => x.id === (infiltre(c) !== undefined ? 'infiltration' : 'recrue_akatsuki')); if (f && !f.connus.includes(un)) f.connus.push(un); noter(c, un, `Tu as vu ${c.creations[j].prenom} déposer un message dans un nid, en pleine forêt. Pour qui ?`); couverture(c, -15); } }],
    ['demander+confiance', '« C’est quoi, ce fil ? » « Rien. » Celui qui a demandé hoche la tête. Il fait confiance. C’est peut-être une erreur.', { l: { confiance: 2 } }],
    ['demander+demander', 'Deux questions en même temps, sur deux choses différentes. Vous vous regardez. Il y a donc des secrets des deux côtés.', { l: { mefiance: 6 } }],
    ['defaut', 'Le fil tombe dans la poussière. Ça pourrait être n’importe quoi.', { l: { mefiance: 2 } }],
  ], {
    si: (c) => dedans(c) !== undefined && !c.akatsuki.detruite,
    textePour: (c, j) => (dedans(c) === j ? 'Tu vois le regard de {autre} sur ta manche. Le fil. Tu as oublié le fil.' : ''),
  }),
  scene('mc_ak_miroir', 'Le binôme miroir', [26, 46], (c) => `Ils vous attendaient sur la route. Deux manteaux à nuages rouges, côte à côte, exactement comme vous. ${dedans(c) !== undefined ? 'L’un d’eux regarde l’un de vous avec un sourire de connivence. L’autre l’a vu.' : '« Vous êtes ceux dont on nous a parlé. Voyons ce que vaut un binôme qui n’a jamais trahi. »'}`, [
    ['combattre', 'Combattre, ensemble', 'agir'],
    ['parler', 'Parler d’abord', 'parler'],
    ['proteger', 'Couvrir l’autre, quoi qu’il arrive', 'proteger'],
  ], [
    ['defaut', 'Ils se mettent en garde au même instant que vous.', { a: 4, combat: 'combat_miroir' }],
  ], {
    si: (c) => vu('mc_ak_rumeur')(c) && !c.akatsuki.detruite,
    textePour: (c, j) => (dedans(c) === j ? 'Le sourire du manteau t’est destiné. Il attend un signe. Si tu te bats mal, il comprendra. {autre} aussi.' : ''),
  }),
  privee('mc_ak_chef', 'Le manteau du chef', [30, 50], (c) => (rangDe(c, recrue(c) ?? 0) >= 2 ? recrue(c) : undefined), 'Le chef de l’Akatsuki est mort, d’une maladie qu’il cachait. Les quatre qui restent te regardent. « Tu es le plus jeune. Tu es le seul qui a encore un village, et un partenaire. Prends le manteau. »', [
    ['prendre', 'Prendre le manteau', 'agir'],
    ['dissoudre', 'Prendre le manteau, pour dissoudre l’organisation', 'proteger'],
    ['fuir', 'Refuser, et tout quitter', 'partir'],
  ], [
    ['prendre', 'Le manteau te va. L’Aube a un nouveau chef. Ton village ne le sait pas. {autre} non plus. Pas encore.', { apres: (c) => { const j = recrue(c)!; c.akatsuki.chef = j; fait(c, { id: 'chef_akatsuki', texte: 'Tu es le chef de l’Akatsuki.', connus: [j, 'akatsuki'], preuves: 2, cible: autre(j) }); } }],
    ['dissoudre', 'Tu prends le manteau. Le soir même, tu fais venir les quatre, un par un, dans un endroit où {autre} attend. Il faudra se battre.', { apres: (c) => { const j = recrue(c)!; c.akatsuki.chef = j; fait(c, { id: 'chef_akatsuki', texte: 'Tu as pris la tête de l’Akatsuki pour la détruire.', connus: [0, 1], preuves: 0 }); noter(c, autre(j), `${c.creations[j].prenom} t’a tout avoué : l’anneau, les années, le manteau. « Aide-moi à en finir. » Tu as dit oui.`); } }],
    ['fuir', 'Tu jettes l’anneau dans la rivière. L’Aube ne pardonne pas. Mais tu es libre, pour l’instant.', { apres: (c) => { const j = recrue(c)!; c.akatsuki.recrues = []; fait(c, { id: 'anneau_jete', texte: 'Tu as été de l’Akatsuki, et tu l’as quittée.', connus: [j, 'akatsuki'], preuves: 1 }); } }],
  ], { si: (c) => recrue(c) !== undefined && !c.akatsuki.detruite }),
  scene('mc_ak_aube', 'La chute de l’Aube', [32, 55], (c) => `Vous avez trouvé le repaire de l’Akatsuki, au fond d’une montagne creuse. ${c.akatsuki.chef !== undefined ? 'L’un de vous en connaît chaque couloir.' : 'Personne ne sait ce qu’il y a dedans.'} Si vous entrez, vous ne ressortirez qu’avec l’Aube brisée, ou pas du tout.`, [
    ['entrer', 'Entrer', 'agir'],
    ['preparer', 'Préparer l’assaut, encore un mois', 'observer'],
    ['renoncer', 'Renoncer : ce n’est pas votre guerre', 'partir'],
  ], [
    ['renoncer+renoncer', 'Vous redescendez de la montagne sans un mot. L’Aube continuera sans vous. Vous serez vivants pour la voir se lever.', { l: { confiance: 2 } }],
    ['defaut', 'Vous entrez.', { a: 6, combat: 'combat_aube' }],
  ], {
    si: (c) => !c.akatsuki.detruite && ((c.akatsuki.vaincus ?? 0) >= 1 || c.akatsuki.infiltre !== undefined || c.faits.some((f) => f.id === 'chef_akatsuki' && f.connus.includes(0) && f.connus.includes(1))),
    textePour: (c, j) => (c.akatsuki.chef === j && !connait(c, 'chef_akatsuki', autre(j)) ? 'Tu portes encore le manteau de chef, plié dans ton sac. Ceux qui t’attendent dedans te connaissent. Tu peux encore choisir ton camp.' : ''),
  }),
];

function PROFIL_NOM(id: string): string {
  return PROFIL[id]?.nom ?? 'un inconnu';
}
