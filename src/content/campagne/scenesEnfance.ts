import type { SceneCommuneDef } from '../../engine/campagne/types';
import { memeVillage, scene, selon, tirees } from './fabrique';

/** L'enfance (6 à 9 ans) et l'Académie (9 à 12 ans). Rien d'irréversible ici : des disputes, des secrets d'enfants, des promesses. */
export const SCENES_ENFANCE: SceneCommuneDef[] = tirees(0.7, [
  scene('mc_vitre', 'La vitre cassée', [6, 9], (c) => `Une pierre, une vitre, un fracas. C’est ${c.creations[0].prenom} qui l’a lancée, ou peut-être ${c.creations[1].prenom} : vous ne le direz jamais pareil. Le marchand vous attrape tous les deux par le col. « Qui a fait ça ? »`, [
    ['avouer', 'Avouer, même si ce n’est pas toi', 'proteger'],
    ['accuser', 'Montrer l’autre du doigt', 'parler'],
    ['silence', 'Ne rien dire', 'observer'],
  ], [
    ['avouer+avouer', '« C’est moi ! » « Non, c’est moi ! » Le marchand vous regarde, puis éclate de rire, et vous fait balayer sa boutique tous les deux pendant une semaine.', { l: { confiance: 6, loyaute: 4 }, a: 3, s: ['La vitre, et les deux « c’est moi » en même temps.', 3, 'chaud'] }],
    ['accuser+accuser', 'Vous vous accusez en même temps, en hurlant. Le marchand vous punit tous les deux, et vous ne vous parlez plus pendant trois jours.', { l: { rivalite: 6, ressentiment: 3 }, s: ['La vitre, et les deux doigts pointés.', 2, 'amer'] }],
    ['avouer+accuser', '{un} avoue. {deux} pointe {un} du doigt. {un} balaie seul{e:un} la boutique pendant une semaine, sans un mot. {deux} passe devant chaque jour, sans entrer.', { un: { ressentiment: 6 }, deux: { dette: 6 }, s: ['La vitre, et celui qui a balayé seul.', 3, 'honteux'] }],
    ['defaut', 'Personne ne dit rien. Le marchand vous laisse partir en grommelant. Vous partagez désormais un secret, et ça vous rend très importants.', { l: { confiance: 4 }, a: 2 }],
  ]),
  scene('mc_chien', 'Le chien des docks', [6, 9], 'Derrière les entrepôts, un chien maigre, une patte de travers. Il ne laisse approcher personne. Vous avez chacun la moitié d’une boulette de riz dans la poche.', [
    ['nourrir', 'Lui donner ta moitié', 'proteger'],
    ['apprivoiser', 'Revenir chaque jour, jusqu’à ce qu’il vienne', 'observer'],
    ['montrer', 'Le montrer aux adultes', 'parler'],
  ], [
    ['apprivoiser+apprivoiser', 'Pendant tout un hiver, vous revenez chaque jour. Au printemps, le chien vous suit jusqu’à l’Académie et attend devant la porte. Il est à vous deux. Personne ne vous le prendra.', { l: { confiance: 8, loyaute: 4 }, a: 4, s: ['Le chien des docks, apprivoisé à deux.', 4, 'chaud'] }],
    ['nourrir+nourrir', 'Deux moitiés de boulette, ça fait une boulette. Le chien mange, et vous regarde manger, et vous ne mangez pas ce soir-là. Ça vous est égal.', { l: { confiance: 5 }, a: 3, s: ['Les deux moitiés de boulette.', 3, 'chaud'] }],
    ['montrer+apprivoiser', '{un} parle du chien aux adultes. Le lendemain, il n’est plus là. {deux} le cherche pendant des jours. {un} n’avoue jamais.', { deux: { ressentiment: 6, confiance: -4 }, s: ['Le chien disparu.', 3, 'amer'] }],
    ['defaut', 'Le chien prend vos boulettes et disparaît dans la nuit. Vous restez assis dans le froid, à attendre qu’il revienne. Il ne revient pas. Vous rentrez ensemble.', { l: { confiance: 2 } }],
  ]),
  scene('mc_lire', 'Les signes sur le papier', [6, 9], (c) => `Un rouleau tombé d’une charrette. L’un de vous sait déjà lire ; l’autre fait semblant. ${selon(c, { freres: 'À la maison, personne n’a eu le temps d’apprendre à {j2}.', defaut: 'Ça se voit, quand on regarde bien.' })}`, [
    ['apprendre', 'Proposer d’apprendre à l’autre', 'proteger'],
    ['moquer', 'Le lire à voix haute, en se moquant', 'agir'],
    ['deviner', 'Inventer ce que dit le rouleau, ensemble', 'parler'],
  ], [
    ['apprendre+apprendre', 'Chaque soir, sous la lampe, une lettre de plus. Le jour où {j2} lit sa première phrase entière, vous la répétez en criant dans la rue. C’est une phrase sans intérêt sur le prix du riz. C’est la plus belle phrase du monde.', { l: { confiance: 8, dette: 4 }, a: 4, s: ['Les lettres apprises sous la lampe.', 4, 'chaud'] }],
    ['deviner+deviner', 'Le rouleau parle d’un trésor, d’un dragon, et d’un roi qui pleure. En vrai, c’est une facture. Vous ne le saurez que des années plus tard.', { l: { confiance: 4 }, a: 3, s: ['Le rouleau qui parlait d’un dragon.', 3, 'chaud'] }],
    ['famille:agir+proteger', '{un} lit le rouleau à voix haute, en riant de celui qui ne sait pas. {deux} rougit jusqu’aux oreilles. Ce soir-là, {deux} apprend seul{e:deux}, à la bougie, et ne le dit à personne.', { un: { respect: -2 }, deux: { ressentiment: 6, rivalite: 6 }, s: ['Le rouleau lu à voix haute, pour se moquer.', 3, 'honteux'] }],
    ['defaut', 'Vous rendez le rouleau au charretier, qui vous donne une pièce. Vous l’achetez en bonbons. Vous ne savez toujours pas ce qu’il y avait dessus.', { l: { confiance: 2 } }],
  ]),
  scene('mc_festival', 'Un seul ticket', [7, 10], 'Le festival d’été. Les lampions, l’odeur du sucre. Vous n’avez de quoi acheter qu’un seul ticket de loterie, et le gros lot est un vrai kunai d’apprenti, dans une boîte en bois.', [
    ['donner', 'Laisser l’autre tirer', 'proteger'],
    ['tirer', 'Tirer toi-même', 'agir'],
    ['partager', 'Tirer à deux mains, ensemble', 'parler'],
  ], [
    ['partager+partager', 'Deux mains sur le même ticket. Vous gagnez une boule de sucre. Vous la cassez en deux parts exactement égales, en vérifiant trois fois.', { l: { confiance: 5 }, a: 4, s: ['Le ticket tiré à deux mains.', 3, 'chaud'] }],
    ['donner+tirer', '{deux} tire, et gagne le kunai. {un} sourit, très fort, pour ne pas pleurer. Le lendemain, {deux} pose le kunai sur l’oreiller de {un}, sans rien dire.', { un: { admiration: 6 }, deux: { dette: 8 }, s: ['Le kunai du festival, posé sur un oreiller.', 4, 'chaud'] }],
    ['tirer+tirer', 'Vous vous disputez le ticket jusqu’à le déchirer. Le marchand ne veut pas d’un demi-ticket. Vous rentrez sans rien, chacun avec sa moitié.', { l: { rivalite: 6 }, s: ['Le ticket déchiré en deux.', 2, 'amer'] }],
    ['defaut', 'Vous gagnez un petit poisson rouge dans un sac d’eau. Il meurt trois jours plus tard. Vous l’enterrez sous le cerisier, avec une vraie cérémonie.', { l: { confiance: 3 }, a: 2 }],
  ]),
  scene('mc_fievre', 'La fièvre', [6, 10], (c) => `L’un de vous a la fièvre depuis deux jours. Il délire un peu, parle de choses qui n’existent pas. ${selon(c, { freres: 'Votre parent est en mission jusqu’à la fin de la semaine.', defaut: 'Les adultes disent que ça passera. Ils disent ça à chaque fois.' })}`, [
    ['veiller', 'Veiller toute la nuit', 'proteger'],
    ['medecin', 'Courir chercher le médecin, malgré la nuit', 'agir'],
    ['histoire', 'Lui raconter des histoires jusqu’à ce qu’il dorme', 'parler'],
  ], [
    ['veiller+histoire', 'Toute la nuit, une main sur le front brûlant, une voix qui raconte. Au matin, la fièvre tombe. Vous ne saurez jamais si c’était l’histoire, ou la main.', { l: { confiance: 8, peur_de_perdre: 8 }, a: 3, s: ['La nuit de la fièvre, la main et l’histoire.', 5, 'chaud'] }],
    ['medecin+medecin', 'Vous courez tous les deux, et vous vous perdez tous les deux dans le noir. C’est le médecin qui vous trouve, au matin, endormis contre sa porte.', { l: { confiance: 4 }, a: 2, s: ['La course chez le médecin, dans la nuit.', 3, 'chaud'] }],
    ['defaut', 'La fièvre passe en trois jours. Quand elle est passée, aucun de vous deux n’en parle. Mais chacun sait que l’autre est resté.', { l: { confiance: 5, peur_de_perdre: 4 }, s: ['Les trois jours de fièvre.', 4, 'chaud'] }],
  ]),
  scene('mc_grand_cour', 'Le grand de la cour', [7, 11], 'Un garçon de douze ans, deux têtes de plus que vous, a coincé l’un de vous contre le mur de la cour. Il veut son goûter. Et sa dignité, tant qu’à faire.', [
    ['frapper', 'Lui sauter dessus', 'agir'],
    ['adulte', 'Courir chercher un adulte', 'parler'],
    ['donner', 'Donner ton goûter pour qu’il le lâche', 'proteger'],
  ], [
    ['frapper+frapper', 'Deux petits contre un grand : il gagne, évidemment. Mais il a un œil au beurre noir, et il ne vous approchera plus jamais. Vous comparez vos bleus toute la semaine.', { l: { loyaute: 8, respect: 4 }, a: 5, s: ['Le grand de la cour, et vos deux paires de bleus.', 4, 'fier'], fx: [{ stat: 'attributs.force', delta: 1 }] }],
    ['donner+frapper', '{un} donne son goûter ; {deux} saute sur le grand quand même. Ça finit mal pour tout le monde, sauf pour le goûter, que le grand mange en riant.', { l: { confiance: 4 }, a: 3 }],
    ['adulte+frapper', 'Le temps que {un} revienne avec un professeur, {deux} est déjà par terre, la lèvre fendue, et le grand s’enfuit. {deux} ne dit pas merci. {un} ne sait pas si {il:un} est arrivé trop tard ou juste à temps.', { deux: { ressentiment: 3 }, un: { peur_de_perdre: 6 } }],
    ['defaut', 'Le grand repart avec un goûter, et vous laisse avec une humiliation. Vous la partagez. Ça la rend plus légère.', { l: { confiance: 3 } }],
  ]),
  scene('mc_lucioles', 'Les lucioles', [6, 10], 'Une nuit d’été, au bord de la rivière. Des milliers de lucioles. L’un de vous a apporté un bocal.', [
    ['attraper', 'En attraper plein le bocal', 'agir'],
    ['regarder', 'Juste regarder', 'observer'],
    ['liberer', 'Les attraper, puis les libérer toutes en même temps', 'parler'],
  ], [
    ['liberer+liberer', 'Vous ouvrez le bocal ensemble, et les lucioles s’envolent toutes à la fois, une colonne de lumière qui monte vers les étoiles. Vous n’avez jamais rien vu d’aussi beau. Vous ne verrez jamais rien d’aussi beau.', { l: { confiance: 6 }, a: 4, s: ['La colonne de lucioles libérée au-dessus de la rivière.', 5, 'chaud'] }],
    ['regarder+regarder', 'Vous restez allongés dans l’herbe jusqu’à minuit, sans rien dire, à regarder. Personne ne vous cherche. C’est la nuit la plus calme de votre enfance.', { l: { confiance: 5 }, a: 3, s: ['La nuit des lucioles, allongés dans l’herbe.', 4, 'chaud'] }],
    ['defaut', 'Le bocal se remplit, puis s’éteint lentement. Le matin, les lucioles sont mortes. Vous ne les attraperez plus jamais.', { l: { confiance: 2 }, s: ['Le bocal de lucioles éteintes.', 3, 'amer'] }],
  ]),
  scene('mc_premier_kunai', 'Le premier kunai', [7, 10], 'Un vrai kunai, trouvé dans l’herbe du terrain d’entraînement. Lourd, froid, coupant. Vous n’avez pas le droit d’y toucher.', [
    ['garder', 'Le garder, en secret', 'observer'],
    ['rendre', 'Le rapporter à l’Académie', 'parler'],
    ['lancer', 'Essayer de le lancer, une fois', 'agir'],
  ], [
    ['lancer+lancer', 'Le premier lancer rate l’arbre. Le deuxième se plante dans le tronc, en vibrant. Vous criez si fort qu’un adulte arrive en courant. Punition. Ça valait le coup.', { l: { respect: 4 }, a: 4, s: ['Le kunai planté dans l’arbre, le deuxième essai.', 3, 'fier'] }],
    ['garder+garder', 'Il dort sous une planche du dortoir, enveloppé dans un chiffon. Votre premier secret dangereux. Vous le vérifiez chaque soir.', { l: { confiance: 6, loyaute: 4 }, a: 2, s: ['Le kunai sous la planche du dortoir.', 4, 'chaud'] }],
    ['garder+rendre', '{deux} veut le rendre. {un} veut le garder. {deux} le rend, sans prévenir. {un} ne le pardonne pas pendant un mois entier.', { un: { ressentiment: 5 }, deux: { respect: 2 } }],
    ['defaut', 'Vous le rendez finalement, un peu à regret. Le professeur vous regarde longtemps, et vous dit : « Bien. » C’est tout. C’est beaucoup.', { l: { confiance: 2 }, fx: [{ stat: 'social.reputation', delta: 1 }] }],
  ]),
  scene('mc_orage', 'L’orage', [6, 9], 'Un orage comme on n’en a jamais vu. La foudre tombe sur la colline, le vent arrache les tuiles. Vous êtes cachés tous les deux sous la même table, et l’un de vous a très peur.', [
    ['rassurer', 'Rassurer l’autre, même si tu as peur aussi', 'proteger'],
    ['compter', 'Compter les secondes entre l’éclair et le tonnerre, ensemble', 'observer'],
    ['dehors', 'Sortir regarder la foudre', 'agir'],
  ], [
    ['compter+compter', 'Un, deux, trois… Vous comptez à voix basse, éclair après éclair. Les chiffres grandissent : l’orage s’éloigne. Vous comptez encore longtemps après, juste pour le plaisir.', { l: { confiance: 6 }, a: 3, s: ['L’orage compté sous la table.', 4, 'chaud'] }],
    ['dehors+dehors', 'Sous la pluie battante, vous regardez la foudre frapper la colline, encore et encore. Vous rentrez trempés, grelottants, et absolument fascinés.', { l: { respect: 4 }, a: 3, s: ['La foudre sur la colline, vue sous la pluie.', 3, 'fier'] }],
    ['defaut', 'L’orage passe. Au matin, l’un de vous dit que l’autre a eu peur. L’autre dit que ce n’est pas vrai. Vous vous disputez toute la journée. C’est mieux que d’avoir peur.', { l: { rivalite: 3, confiance: 2 } }],
  ]),
  scene('mc_vieux_soldat', 'Le vieux du marché', [7, 11], 'Un vieillard sans jambes, assis devant le marché, raconte la guerre à qui veut l’entendre. Personne ne veut. Vous vous êtes arrêtés.', [
    ['ecouter', 'L’écouter jusqu’au bout', 'observer'],
    ['questionner', 'Lui demander s’il a tué quelqu’un', 'parler'],
    ['partir', 'Partir : il fait peur', 'partir'],
  ], [
    ['ecouter+ecouter', 'Il parle de ses amis, un par un, par leur prénom. Tous morts. À la fin, il vous regarde tous les deux : « Restez ensemble. C’est le seul conseil que j’ai. » Vous ne comprenez pas encore.', { l: { loyaute: 6 }, a: 2, s: ['Le vieux du marché : « Restez ensemble. »', 4, 'tragique'] }],
    ['questionner+ecouter', '« Vous avez tué des gens ? » Le vieux se tait longtemps. « Oui. Et ils avaient votre âge, certains. » {deux} prend la main de {un} sans y penser.', { l: { peur_de_perdre: 4 }, s: ['La question au vieux soldat.', 3, 'tragique'] }],
    ['defaut', 'Vous passez votre chemin. Le lendemain, la place du vieux est vide. On ne le revoit pas. Vous vous demandez longtemps ce qu’il voulait dire.', { l: { confiance: 1 } }],
  ]),
  scene('mc_oeuf', 'L’œuf tombé du nid', [6, 9], 'Un œuf bleu, intact, au pied du grand chêne. Le nid est là-haut, très haut.', [
    ['grimper', 'Grimper le remettre', 'agir'],
    ['couver', 'Le garder au chaud et le faire éclore', 'proteger'],
    ['laisser', 'Le laisser : c’est la nature', 'observer'],
  ], [
    ['grimper+grimper', 'Vous grimpez l’un sur les épaules de l’autre, puis l’un tire l’autre. L’œuf retourne dans le nid. Vous redescendez avec des écorchures partout et le sentiment d’avoir sauvé le monde.', { l: { confiance: 6 }, a: 5, s: ['L’œuf remis dans le nid, l’un sur les épaules de l’autre.', 4, 'fier'] }],
    ['couver+couver', 'Il éclôt dix jours plus tard, dans un bonnet, sous une lampe. Un petit oiseau furieux. Vous l’appelez par vos deux noms collés ensemble.', { l: { confiance: 6, loyaute: 3 }, a: 3, s: ['L’oiseau éclos dans un bonnet, qui porte vos deux noms.', 4, 'chaud'] }],
    ['defaut', 'Vous vous disputez sur ce qu’il faut faire, et pendant ce temps un chat passe. Vous ne vous adressez plus la parole jusqu’au soir.', { l: { rivalite: 4 } }],
  ]),
  scene('mc_course_monument', 'La course', [7, 10], (c) => `« Le premier en haut de ${memeVillage(c) ? 'la colline' : 'la tour de guet'} a gagné ! » Personne ne sait qui l’a crié. Vous partez en même temps.`, [
    ['sprinter', 'Courir de toutes tes forces', 'agir'],
    ['tricher', 'Couper par les jardins', 'observer'],
    ['attendre', 'Ralentir, pour arriver ensemble', 'proteger'],
  ], [
    ['sprinter+sprinter', 'Vous arrivez en haut ensemble, à bout de souffle, et vous vous disputez pendant une heure pour savoir qui a touché la pierre en premier. Personne ne gagne. Vous recommencerez demain.', { l: { rivalite: 6, respect: 4 }, a: 3, s: ['La course jusqu’en haut, sans vainqueur.', 3, 'fier'] }],
    ['attendre+attendre', 'Vous ralentissez tous les deux, sans le dire, et vous finissez la course en marchant, côte à côte, en vous moquant de vous-mêmes.', { l: { confiance: 6 }, a: 3, s: ['La course finie en marchant.', 3, 'chaud'] }],
    ['tricher+sprinter', '{un} coupe par les jardins et arrive premier. {deux} le sait. {deux} ne dit rien. Mais à partir de ce jour, {deux} vérifie toujours le chemin.', { deux: { mefiance: 5, rivalite: 5 } }],
    ['defaut', 'L’un arrive avant l’autre, de peu. Le vaincu jure une revanche. Elle durera des années.', { l: { rivalite: 5 } }],
  ]),
  scene('mc_recette', 'La recette', [7, 11], (c) => `${selon(c, { freres: '{parent} vous a laissé la cuisine pour la soirée.', defaut: 'Chez l’un de vous, la cuisine est vide pour la soirée.' })} Vous avez décidé de faire des boulettes de riz comme les adultes. Il y a déjà du riz au plafond.`, [
    ['continuer', 'Continuer, coûte que coûte', 'agir'],
    ['ranger', 'Tout ranger avant que quelqu’un rentre', 'proteger'],
    ['inventer', 'Inventer une recette à vous', 'parler'],
  ], [
    ['inventer+inventer', 'Des boulettes au miel, aux prunes salées et au poisson séché. C’est immangeable. Vous en mangez quand même chacune, en vous regardant dans les yeux, pour voir qui craquera le premier.', { l: { confiance: 5 }, a: 4, s: ['Les boulettes au miel et au poisson.', 3, 'chaud'] }],
    ['ranger+continuer', '{un} range pendant que {deux} cuisine. Quand l’adulte rentre, la cuisine est propre et il y a trois boulettes parfaites sur la table. Personne ne sait qui a fait quoi. Vous, si.', { l: { confiance: 4 }, a: 4 }],
    ['defaut', 'Vous êtes surpris la main dans le riz. Punition. Mais la boulette était bonne, et ça, personne ne peut vous l’enlever.', { l: { confiance: 2 } }],
  ]),
  scene('mc_plancher', 'Sous le plancher', [8, 11], (c) => `Une latte qui bouge, ${selon(c, { freres: 'dans la chambre que vous partagez', defaut: 'dans la vieille réserve où vous jouez' })}. Dessous, une boîte en fer, et dans la boîte, une lettre jaunie, signée d’un nom que vous ne connaissez pas.`, [
    ['lire', 'La lire en entier', 'agir'],
    ['remettre', 'La remettre en place', 'proteger'],
    ['demander', 'Demander à un adulte qui c’était', 'parler'],
  ], [
    ['lire+lire', 'C’est une lettre d’amour, écrite pendant la guerre, à quelqu’un qui n’est jamais revenu. Vous la remettez sous la latte, sans un mot, et vous jurez de ne jamais en parler.', { l: { confiance: 6, loyaute: 4 }, a: 2, s: ['La lettre sous le plancher, remise à sa place.', 4, 'tragique'] }],
    ['demander+lire', '{un} pose la question à table. Le silence qui suit est si long que vous comprenez que vous n’auriez pas dû. Le soir, la latte est clouée.', { l: { peur_de_perdre: 3 }, s: ['La latte clouée, après la question.', 3, 'amer'] }],
    ['defaut', 'Vous remettez la boîte en place. Parfois, la nuit, vous y pensez. Vous ne la rouvrirez jamais.', { l: { confiance: 3 } }],
  ]),
  scene('mc_neige', 'La première neige', [6, 9], 'La première neige de l’hiver tombe sur le village. L’Académie est fermée pour la journée.', [
    ['bataille', 'Bataille de boules de neige', 'agir'],
    ['bonhomme', 'Construire quelque chose de très grand', 'proteger'],
    ['empreintes', 'Marcher dans la neige vierge, sans parler', 'observer'],
  ], [
    ['bataille+bataille', 'Une guerre totale, de l’aube au crépuscule. À la fin, vous êtes alliés contre toute la rue. Vous gagnez. Évidemment.', { l: { respect: 4, confiance: 4 }, a: 5, s: ['La grande bataille de neige.', 3, 'fier'] }],
    ['bonhomme+bonhomme', 'Un ninja de neige, plus grand que les adultes, avec deux bâtons pour kunai. Il tient jusqu’au printemps. Le dernier jour, vous le regardez fondre, très solennellement.', { l: { confiance: 5 }, a: 4, s: ['Le ninja de neige qui a tenu jusqu’au printemps.', 4, 'chaud'] }],
    ['defaut', 'Vous passez la journée dehors, chacun à sa façon, et le soir vous avez les doigts gelés et les joues rouges. C’est une bonne journée.', { l: { confiance: 2 }, a: 1 }],
  ]),

  // ── L'Académie ──
  scene('mc_premier_clone', 'Le premier clone', [9, 12], 'Exercice de clonage. L’un de vous y arrive du premier coup, devant toute la classe. L’autre essaie encore, et encore, et rien ne vient.', [
    ['aider', 'Montrer à l’autre comment tu fais', 'proteger'],
    ['fier', 'Profiter de ta réussite', 'agir'],
    ['seul', 'Continuer seul, sans demander d’aide', 'partir'],
  ], [
    ['aider+seul', '{un} s’approche pour aider. {deux} se détourne. Le soir, sur le terrain désert, {deux} réussit enfin son clone. Seul. Ça compte plus que tout.', { deux: { rivalite: 6, respect: 3 }, un: { respect: 4 } }],
    ['aider+aider', 'Vous passez la soirée sur le terrain, l’un corrigeant les mains de l’autre. Au coucher du soleil, il y a quatre silhouettes sur le terrain au lieu de deux.', { l: { confiance: 6, dette: 3 }, a: 5, s: ['Les quatre silhouettes au coucher du soleil.', 4, 'chaud'] }],
    ['fier+seul', '{un} parade devant la classe. {deux} serre les dents. Ce jour-là naît quelque chose qui ressemble à une rivalité, et qui ne mourra pas.', { deux: { jalousie: 8, rivalite: 8 }, s: ['Le jour du premier clone.', 3, 'amer'] }],
    ['defaut', 'Le professeur passe et dit : « Demain. » Demain, ça marche.', { l: { rivalite: 3 }, a: 2 }],
  ]),
  scene('mc_antiseche', 'L’antisèche', [9, 12], 'Examen d’histoire des villages. L’un de vous a une antisèche dans la manche. Le surveillant se rapproche.', [
    ['jeter', 'Faire disparaître l’antisèche', 'proteger'],
    ['couvrir', 'Faire diversion pour couvrir l’autre', 'parler'],
    ['denoncer', 'Rester droit : tricher, c’est tricher', 'observer'],
  ], [
    ['couvrir+jeter', '{un} fait tomber sa trousse avec fracas ; {deux} avale littéralement l’antisèche. Vous avez tous les deux zéro. Vous en riez pendant des années.', { l: { loyaute: 6, confiance: 4 }, a: 4, s: ['L’antisèche avalée.', 4, 'chaud'] }],
    ['denoncer+*', '{un} ne couvre pas. Le surveillant trouve l’antisèche. {un} ne dit rien, mais ne fait rien non plus, et c’est ce que {deux} retiendra.', { deux: { ressentiment: 6, confiance: -5 }, s: ['L’antisèche, et celui qui n’a rien fait.', 3, 'amer'] }],
    ['defaut', 'Le surveillant passe sans rien voir. Vous ne saurez jamais s’il a fait exprès.', { l: { confiance: 2 } }],
  ]),
  scene('mc_baton', 'Le duel au bâton', [9, 12], 'Cours de combat : les élèves s’affrontent deux par deux, au bâton. Le professeur tire les paires au sort, et c’est vous deux, devant tout le monde.', [
    ['gagner', 'Gagner, quoi qu’il en coûte', 'agir'],
    ['retenu', 'Te battre en retenant tes coups', 'proteger'],
    ['spectacle', 'Faire rire la classe', 'parler'],
  ], [
    ['gagner+gagner', 'Le bâton de l’un casse sur l’épaule de l’autre. Le professeur arrête tout. Match nul. Vous vous serrez la main, et vous pensez tous les deux : la prochaine fois.', { l: { rivalite: 8, respect: 6 }, a: 4, s: ['Le duel au bâton, le bâton cassé.', 3, 'fier'] }],
    ['retenu+retenu', 'Vous vous battez si mollement que le professeur vous renvoie à vos places. Toute la classe se moque. Vous vous regardez, complices.', { l: { confiance: 5 }, a: 2 }],
    ['gagner+retenu', '{un} frappe pour de vrai ; {deux} retient ses coups, et perd. « Pourquoi tu n’as pas frappé ? » {deux} hausse les épaules. {un} ne sait plus s’il a vraiment gagné.', { un: { respect: 3, dette: 3 }, deux: { rivalite: 4 } }],
    ['defaut', 'Le combat est court et brouillon. Le professeur soupire. Vous aussi.', { l: { rivalite: 3 } }],
  ]),
  scene('mc_professeur', 'Le professeur injuste', [9, 12], 'Le professeur de taijutsu punit l’un de vous pour une faute commise par un fils de clan important. Toute la classe le sait. Personne ne dit rien.', [
    ['protester', 'Protester, devant tout le monde', 'agir'],
    ['subir', 'Accepter, pour ne pas aggraver', 'observer'],
    ['plus_tard', 'Aller voir le directeur après la classe', 'parler'],
  ], [
    ['protester+protester', 'Vous vous levez tous les deux. Silence de mort. Vous êtes punis tous les deux. Le fils de clan, lui, baisse les yeux. C’est une victoire.', { l: { loyaute: 8, respect: 6 }, a: 4, s: ['Le jour où vous vous êtes levés ensemble.', 5, 'fier'] }],
    ['plus_tard+subir', '{un} va voir le directeur, seul. La punition est levée le lendemain. {deux} ne sait pas comment. {un} ne le dit pas.', { deux: { dette: 6 }, un: { loyaute: 4 } }],
    ['defaut', 'La punition tombe. Le soir, vous inventez cent façons de vous venger du professeur. Vous n’en appliquez aucune. Ça fait du bien quand même.', { l: { confiance: 3 } }],
  ]),
  scene('mc_perdus_foret', 'Perdus dans la forêt', [9, 12], 'Sortie d’orientation. Vous avez perdu le reste de la classe. Le soleil se couche. La forêt ne ressemble plus du tout à la carte.', [
    ['etoiles', 'Attendre les étoiles pour s’orienter', 'observer'],
    ['marcher', 'Marcher droit devant', 'agir'],
    ['feu', 'Faire un feu, et attendre qu’on vous trouve', 'proteger'],
  ], [
    ['etoiles+feu', 'Un feu, et au-dessus, les étoiles. L’un les nomme, l’autre entretient les flammes. On vous retrouve à l’aube, endormis dos à dos, et vous aviez trouvé le bon chemin.', { l: { confiance: 8 }, a: 5, s: ['La nuit perdus dans la forêt, le feu et les étoiles.', 4, 'chaud'], fx: [{ stat: 'attributs.perception', delta: 1 }] }],
    ['marcher+marcher', 'Vous marchez toute la nuit, et vous ressortez à l’opposé du village. Les adultes sont furieux. Vous êtes ravis : vous avez vu une biche.', { l: { respect: 4 }, a: 3 }],
    ['defaut', 'Vous vous disputez sur le chemin à suivre, vous vous séparez, et vous vous retrouvez au même endroit une heure plus tard, en tournant en rond. Vous rentrez ensemble, sans vous parler.', { l: { rivalite: 4, confiance: -2 } }],
  ]),
  scene('mc_shuriken', 'Le centre de la cible', [9, 12], 'Entraînement aux shuriken. Il reste un seul lancer avant la fin du cours. Celui qui touche le centre a le droit de partir en premier.', [
    ['viser', 'Prendre tout ton temps pour viser', 'observer'],
    ['vite', 'Lancer vite, avant l’autre', 'agir'],
    ['ceder', 'Laisser l’autre lancer', 'proteger'],
  ], [
    ['viser+viser', 'Deux shuriken, au centre, l’un dans l’autre. Le professeur ne dit rien pendant un long moment. Puis il vous laisse partir tous les deux.', { l: { respect: 8 }, a: 5, s: ['Les deux shuriken au centre, l’un dans l’autre.', 4, 'fier'] }],
    ['vite+viser', '{un} lance trop vite et rate. {deux} prend son temps et touche. {un} applaudit, sincèrement. C’est nouveau, ça.', { un: { admiration: 5 }, deux: { respect: 3 } }],
    ['defaut', 'Personne ne touche le centre. Vous partez en dernier, ensemble, en vous accusant mutuellement d’avoir porté la poisse.', { l: { rivalite: 2, confiance: 2 } }],
  ]),
  scene('mc_kinobori', 'La marche sur l’arbre', [9, 12], 'Exercice de contrôle du chakra : monter au sommet d’un arbre sans les mains. Il est tard. Vous êtes les deux derniers à ne pas y arriver.', [
    ['continuer', 'Continuer jusqu’à la nuit', 'agir'],
    ['marque', 'Marquer chaque essai d’un kunai, pour voir le progrès', 'observer'],
    ['abandonner', 'Rentrer : demain est un autre jour', 'partir'],
  ], [
    ['marque+continuer', 'Des entailles dans l’écorce, de plus en plus haut, l’une à côté de l’autre. À minuit, vous touchez le sommet à quelques secondes d’intervalle. Les entailles sont toujours là, des années après.', { l: { rivalite: 4, respect: 6 }, a: 5, s: ['Les entailles dans l’écorce, jusqu’au sommet.', 4, 'fier'], fx: [{ entrainer: 'ninjutsu', jours: 10 }] }],
    ['continuer+continuer', 'Vous montez, tombez, remontez, tombez, jusqu’à ce que l’un de vous rie si fort qu’il tombe de très haut, sur l’autre. Vous rentrez en boitant, sans avoir touché le sommet. Demain.', { l: { confiance: 4 }, a: 3 }],
    ['defaut', 'Vous rentrez. Le lendemain matin, l’un de vous est déjà au sommet quand l’autre arrive. Il a passé la nuit dessus. Il ne le dira jamais.', { l: { rivalite: 5 } }],
  ]),
  scene('mc_nouveau', 'L’élève nouveau', [9, 12], 'Un élève nouveau est arrivé d’un autre village. Il ne parle à personne, mange seul, et une bande a décidé de lui mener la vie dure.', [
    ['defendre', 'Le défendre contre la bande', 'agir'],
    ['inviter', 'L’inviter à manger avec vous', 'proteger'],
    ['regarder', 'Ne pas s’en mêler', 'observer'],
  ], [
    ['inviter+inviter', 'Il s’assoit avec vous, et ne dit rien pendant une semaine. Puis, un jour, il raconte une blague, très mauvaise. Vous riez trop fort. Il restera votre ami longtemps.', { l: { confiance: 4, respect: 4 }, a: 3, s: ['Le nouveau, et sa très mauvaise blague.', 3, 'chaud'] }],
    ['defendre+defendre', 'Trois contre deux, mais vous avez le nouveau avec vous. La bande ne recommence plus. Le nouveau vous regarde comme deux héros. Vous faites semblant de ne pas aimer ça.', { l: { loyaute: 6 }, a: 4 }],
    ['defaut', 'La bande finit par se lasser. Le nouveau finit l’année seul. Vous y repensez parfois, beaucoup plus tard.', { l: { confiance: 1 }, s: ['Le nouveau, resté seul.', 2, 'honteux'] }],
  ]),
  scene('mc_retenue', 'La retenue', [9, 12], 'Retenue après les cours, tous les deux, dans une salle vide. Une heure à copier cent fois « Je ne courrai plus dans les couloirs ». Le surveillant s’est endormi.', [
    ['copier', 'Copier sagement', 'observer'],
    ['filer', 'Filer par la fenêtre', 'agir'],
    ['parler', 'En profiter pour parler de tout', 'parler'],
  ], [
    ['parler+parler', 'Une heure à parler à voix basse, de vos parents, de vos peurs, de ce que vous ferez quand vous serez grands. Les lignes ne sont pas copiées. Ça valait cent retenues.', { l: { confiance: 8 }, a: 3, s: ['La retenue où vous avez parlé de tout.', 4, 'chaud'] }],
    ['filer+filer', 'Vous passez par la fenêtre et tombez dans un buisson épineux, juste sous le bureau du directeur. Deux heures de retenue de plus. Ensemble.', { l: { confiance: 4 }, a: 3 }],
    ['filer+copier', '{un} file par la fenêtre. {deux} reste et copie les cent lignes, puis encore cent autres, celles de {un}, avec une écriture imitée. {un} ne l’apprend que des années plus tard.', { deux: { loyaute: 6 }, un: { dette: 6 }, apres: (c, un) => c.lien.souvenirs.push({ id: 'retenue_lignes', jour: Math.max(c.joueurs[0].jour, c.joueurs[1].jour), texte: 'Les cent lignes copiées à ta place, d’une écriture imitée.', poids: 3, tonalite: 'chaud', connuDe: [((1 - un) as 0 | 1)] }) }],
    ['defaut', 'Une heure, c’est long. Mais c’est moins long à deux.', { l: { confiance: 2 } }],
  ]),
  scene('mc_larmes', 'Le jour où l’un pleure', [9, 12], 'Derrière l’Académie, assis contre le mur, l’un de vous pleure. Il ne veut pas dire pourquoi.', [
    ['asseoir', 'T’asseoir à côté, sans rien dire', 'observer'],
    ['demander', 'Demander ce qui ne va pas', 'parler'],
    ['distraire', 'Faire n’importe quoi pour le faire rire', 'agir'],
  ], [
    ['asseoir+asseoir', 'Vous restez assis là, côte à côte, jusqu’à ce que la cloche sonne. Personne ne dit rien. Le lendemain, celui qui pleurait vous donne la moitié de son goûter. Vous comprenez.', { l: { confiance: 8, loyaute: 4 }, a: 3, s: ['Le jour où vous êtes restés assis contre le mur.', 5, 'chaud'] }],
    ['distraire+*', 'Une grimace, puis deux, puis une imitation du directeur. Ça ne marche pas. Puis ça marche. Un rire mouillé, puis un vrai.', { l: { confiance: 5 }, a: 2, s: ['Le rire mouillé, derrière l’Académie.', 4, 'chaud'] }],
    ['defaut', 'Vous ne saurez jamais pourquoi. Mais vous étiez là.', { l: { confiance: 4 } }],
  ]),
  scene('mc_expose', 'L’exposé sur les Kage', [10, 12], 'Exposé à deux sur l’histoire des Kage. Il faut le présenter demain devant la classe, et vous n’êtes d’accord sur rien.', [
    ['heros', 'Raconter les Kage comme des héros', 'parler'],
    ['verite', 'Raconter aussi ce qu’ils ont fait de mal', 'agir'],
    ['partager', 'Chacun présente sa version', 'proteger'],
  ], [
    ['verite+verite', 'Vous racontez les guerres, les ordres terribles, les enfants envoyés au front. La classe se tait. Le professeur aussi. Puis il dit : « Bien. C’est la première fois que quelqu’un ose. »', { l: { respect: 8 }, a: 3, s: ['L’exposé où vous avez dit la vérité sur les Kage.', 4, 'fier'], fx: [{ stat: 'attributs.intellect', delta: 1 }] }],
    ['partager+partager', 'Deux exposés en un : l’un raconte la légende, l’autre ce qu’elle cache. Le professeur vous donne la même note, pour des raisons différentes.', { l: { respect: 4, rivalite: 3 }, a: 3 }],
    ['defaut', 'Vous présentez un exposé bancal, décousu, où vous vous coupez la parole. La classe rit. Vous aussi, à la fin.', { l: { rivalite: 3 } }],
  ]),
  scene('mc_bandeau', 'Les bandeaux', [11, 13], (c) => `La remise des bandeaux. Toute l’Académie est réunie dans la cour. On appelle les noms un par un. ${c.creations[0].prenom} est appelé${c.creations[0].presentation === 'feminin' ? 'e' : ''} en premier. Le nom de ${c.creations[1].prenom} se fait attendre.`, [
    ['attendre', 'Attendre l’autre avant de nouer ton bandeau', 'proteger'],
    ['nouer', 'Nouer ton bandeau tout de suite, fier·e', 'agir'],
    ['echanger', 'Proposer d’échanger vos bandeaux', 'parler'],
  ], [
    ['echanger+echanger', 'Vous échangez vos bandeaux, comme un serment. Personne ne remarque la différence. Vous, si, chaque matin, pendant toute votre vie de genin.', { l: { loyaute: 10, confiance: 6 }, a: 5, s: ['Les bandeaux échangés, le jour de la remise.', 5, 'chaud'], promesse: ['bandeaux', 'Porter le bandeau de l’autre tant que vous serez genin.'] }],
    ['attendre+attendre', 'Vous gardez vos bandeaux à la main jusqu’à ce que le dernier nom soit appelé, puis vous les nouez au même moment. Le professeur l’a vu. Il sourit.', { l: { loyaute: 6 }, a: 4, s: ['Les bandeaux noués au même moment.', 4, 'chaud'] }],
    ['defaut', 'Chacun noue son bandeau, à sa façon. Vous êtes genin. Le monde vient de changer, et vous ne le savez pas encore.', { l: { confiance: 2 }, a: 2 }],
  ]),
  scene('mc_classement', 'Le classement', [10, 12], 'Le classement de fin d’année est affiché dans le couloir. Vos deux noms se suivent. L’un juste au-dessus de l’autre.', [
    ['feliciter', 'Féliciter l’autre', 'proteger'],
    ['revanche', 'Promettre de passer devant l’an prochain', 'agir'],
    ['ignorer', 'Faire semblant de ne pas avoir regardé', 'partir'],
  ], [
    ['revanche+revanche', '« L’an prochain. » « L’an prochain. » Vous vous serrez la main, très sérieusement, devant le tableau. L’an prochain, ce sera pareil, dans l’autre sens.', { l: { rivalite: 8, respect: 4 }, a: 3, s: ['Le classement, et la main serrée devant le tableau.', 3, 'fier'] }],
    ['feliciter+ignorer', '{un} félicite. {deux} fait semblant de ne rien voir, puis rentre en courant, et pleure de rage dans son oreiller. Personne ne le saura.', { deux: { jalousie: 8 }, un: { confiance: 2 } }],
    ['defaut', 'Vous regardez le tableau ensemble, puis vous partez manger. Le classement est vite oublié. Pas tout à fait.', { l: { rivalite: 3 } }],
  ]),
]);
