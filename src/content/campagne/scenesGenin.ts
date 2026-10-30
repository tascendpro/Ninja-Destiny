import type { SceneCommuneDef } from '../../engine/campagne/types';
import { fait, souvenir } from '../../engine/campagne/outils';
import { memeVillage, scene, selon, tirees } from './fabrique';

/** Genin (12 à 15 ans) et chūnin (15 à 20 ans) : les premières missions, les premières vraies fautes, les premiers morts. */
export const SCENES_GENIN: SceneCommuneDef[] = tirees(0.7, [
  scene('mc_chat_daimyo', 'Le chat de la femme du daimyō', [12, 15], 'Mission de rang D : retrouver le chat de la femme du daimyō. Troisième fois ce mois-ci. Le chat vous regarde du haut d’un toit, et il a l’air de rire.', [
    ['piege', 'Lui tendre un piège patient', 'observer'],
    ['foncer', 'Sauter sur le toit', 'agir'],
    ['laisser', 'Proposer de le laisser libre : il est plus heureux là', 'parler'],
  ], [
    ['piege+foncer', 'Pendant que {un} prépare le piège, {deux} saute. Le chat s’enfuit droit dans le piège. Vous prétendez tous les deux que c’était prévu.', { l: { confiance: 4 }, a: 4, fx: [{ stat: 'jauges.ryo', delta: 5 }] }],
    ['laisser+laisser', 'Vous rapportez au client un collier vide et une histoire très triste. La femme du daimyō pleure. Le chat, lui, vit heureux sur les toits. Vous n’avez pas été payés. Vous ne regrettez rien.', { l: { confiance: 5 }, a: 3, s: ['Le chat du daimyō, laissé libre sur les toits.', 3, 'chaud'] }],
    ['foncer+foncer', 'Vous tombez tous les deux du toit, dans un étal de poisson. Le chat redescend tout seul, s’assoit à côté de vous, et attend qu’on le ramène.', { l: { rivalite: 2, confiance: 3 }, a: 3, fx: [{ stat: 'jauges.ryo', delta: 5 }] }],
    ['defaut', 'Le chat est rendu, griffé, et vous aussi. Mission accomplie. Héroïque, presque.', { a: 2, fx: [{ stat: 'jauges.ryo', delta: 5 }] }],
  ]),
  scene('mc_escorte_vieux', 'L’escorte du vieux constructeur', [12, 15], 'Une escorte de rang C : un vieux constructeur de ponts, qui boit, qui ment, et qui a peur de quelque chose qu’il ne dit pas. Le troisième soir, il avoue : des hommes le suivent, et la mission est de rang B.', [
    ['continuer', 'Continuer quand même', 'agir'],
    ['rentrer', 'Rentrer : ce n’est pas votre mission', 'partir'],
    ['interroger', 'Savoir d’abord qui le suit', 'observer'],
  ], [
    ['continuer+continuer', 'Vous continuez. Les hommes attaquent au gué. Vous ne savez pas encore si vous êtes prêts.', { l: { loyaute: 4 }, a: 3, combat: 'combat_nuit' }],
    ['interroger+continuer', 'Le vieux parle : des usuriers, pas des ninjas. Vous continuez en connaissant l’ennemi. Au gué, vous les attendez.', { l: { respect: 4 }, a: 4, combat: 'combat_nuit' }],
    ['rentrer+rentrer', 'Vous ramenez le vieux au village. Le sensei fronce les sourcils, puis approuve. Le pont ne sera pas construit cette année. Vous y repenserez.', { l: { confiance: 2 } }],
    ['defaut', 'Vous vous disputez au bord de la route pendant que le vieux boit. Finalement, vous continuez, de mauvaise humeur. Au gué, les hommes attendent.', { l: { rivalite: 3 }, combat: 'combat_nuit' }],
  ]),
  scene('mc_sensei_blesse', 'Le sensei à terre', [12, 15], 'Une mission tourne mal. Votre sensei est à terre, une jambe brisée, et il vous ordonne de partir sans lui. Vous êtes deux genin, au milieu de nulle part.', [
    ['porter', 'Le porter, à deux, quoi qu’il dise', 'proteger'],
    ['obeir', 'Obéir : courir chercher de l’aide', 'partir'],
    ['garder', 'L’un reste avec lui, l’autre court', 'parler'],
  ], [
    ['porter+porter', 'Trois jours à le porter sur une civière de branches, en vous relayant. Il vous insulte tout le long. À l’entrée du village, il pleure. Il ne vous en parlera jamais.', { l: { loyaute: 8, confiance: 6 }, a: 6, s: ['Les trois jours à porter le sensei.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 3 }] }],
    ['garder+garder', 'L’un reste, l’autre court. Celui qui court revient avec les secours au bout de deux jours, à moitié mort de fatigue. Celui qui est resté n’a pas dormi. Le sensei est vivant.', { l: { confiance: 6, peur_de_perdre: 4 }, a: 4, s: ['Les deux jours où l’un a couru et l’autre est resté.', 4, 'fier'] }],
    ['obeir+porter', '{un} veut obéir ; {deux} refuse et soulève le sensei seul{e:deux}. {un} revient sur ses pas. Vous le portez à deux. Le sensei, plus tard, ne félicitera que {deux}.', { un: { jalousie: 4, respect: 4 }, deux: { respect: 2 }, a: 3 }],
    ['defaut', 'Vous courez tous les deux chercher de l’aide. Quand vous revenez, le sensei a rampé jusqu’à un abri. Il est vivant. Il ne vous fera plus jamais tout à fait confiance.', { l: { dette: 2 }, fx: [{ stat: 'social.reputation', delta: -1 }] }],
  ]),
  scene('mc_premier_mort', 'Le premier mort', [12, 16], 'Un bandit, sur la route. Il est tombé. Il ne se relève pas. C’est le premier homme que vous voyez mourir de vos mains, et vous ne savez pas lequel de vous deux a porté le coup.', [
    ['enterrer', 'L’enterrer', 'proteger'],
    ['partir', 'Partir sans regarder', 'partir'],
    ['endosser', 'Dire à l’autre que c’était toi', 'parler'],
  ], [
    ['endosser+endosser', '« C’est moi. » « Non, c’est moi. » Vous vous regardez, et vous comprenez que ni l’un ni l’autre ne le sait. Vous porterez ce mort à deux, toute votre vie.', { l: { loyaute: 8, dependance: 6 }, a: 4, s: ['Le premier mort, que vous portez à deux.', 5, 'tragique'] }],
    ['enterrer+enterrer', 'Vous creusez avec vos kunai, jusqu’à la nuit. Personne ne vous l’a demandé. Le sensei vous regarde faire, et ne dit rien. Le lendemain, il vous parle comme à des adultes.', { l: { confiance: 5, respect: 5 }, a: 3, s: ['Le bandit enterré au bord de la route.', 4, 'tragique'] }],
    ['endosser+partir', '{un} dit que c’était {lui:un}. {deux} ne dit rien. Des années plus tard, {deux} saura que c’était faux, et que c’était {lui:deux}.', { deux: { dette: 8 }, un: { peur_de_perdre: 4 }, s: ['Le premier mort, et celui qui l’a pris sur lui.', 4, 'tragique'] }],
    ['defaut', 'Vous partez. Cette nuit-là, aucun de vous deux ne dort. Vous n’en parlez pas. Vous n’en parlerez jamais.', { l: { peur_de_perdre: 3 }, s: ['Le premier mort, et le silence d’après.', 3, 'tragique'] }],
  ]),
  scene('mc_pluie_mission', 'Trois jours de pluie', [12, 16], 'Une planque, sous la pluie, pendant trois jours. Rien ne se passe. Il n’y a qu’un seul abri, et il est tout petit.', [
    ['parler', 'Parler, pour passer le temps', 'parler'],
    ['surveiller', 'Surveiller en silence', 'observer'],
    ['dormir', 'Dormir à tour de rôle', 'proteger'],
  ], [
    ['parler+parler', 'Trois jours à parler de tout : vos peurs, vos parents, ce que vous ferez si vous survivez à tout ça. À la fin, la cible n’est jamais venue, et vous vous connaissez mieux que personne.', { l: { confiance: 8 }, a: 4, s: ['Les trois jours de pluie à tout se dire.', 4, 'chaud'] }],
    ['dormir+dormir', 'L’un dort, l’autre veille, et inversement. Une fois, au réveil, vous trouvez une couverture sur vous que vous n’aviez pas en vous endormant.', { l: { confiance: 5, peur_de_perdre: 3 }, a: 4 }],
    ['defaut', 'Trois jours de pluie et d’ennui. Vous êtes trempés, affamés, et un peu plus proches. La cible ne vient pas.', { l: { confiance: 2 }, a: 2 }],
  ]),
  scene('mc_nouvelle_equipe', 'La troisième', [12, 15], (c) => `${memeVillage(c) ? 'Votre équipe' : 'L’équipe mixte de vos deux villages'} reçoit un troisième membre : une genin brillante, froide, qui ne vous regarde ni l’un ni l’autre. Elle s’appelle Rin. Elle sera là longtemps, ou pas.`, [
    ['accueillir', 'L’accueillir', 'proteger'],
    ['tester', 'La défier pour voir ce qu’elle vaut', 'agir'],
    ['ignorer', 'Rester entre vous deux', 'partir'],
  ], [
    ['accueillir+accueillir', 'Rin résiste deux semaines, puis vient manger avec vous. Elle ne rit pas beaucoup. Mais elle rit à vos disputes. Vous êtes trois, désormais.', { l: { confiance: 3 }, a: 3, s: ['Rin, qui riait à vos disputes.', 3, 'chaud'] }],
    ['ignorer+ignorer', 'Rin reste seule. Elle demande à changer d’équipe au bout d’un mois. Vous êtes contents. Un peu honteux aussi, plus tard.', { l: { dependance: 6, loyaute: 4 } }],
    ['tester+accueillir', '{un} défie Rin et perd, devant {deux}. Rin tend la main pour l’aider à se relever. {deux} a tout vu, et sourit.', { un: { respect: 4 }, deux: { rivalite: 2 }, a: 2 }],
    ['defaut', 'Rin fait son travail, vous faites le vôtre. Il y a un troisième prénom dans vos rapports de mission. C’est tout, pour l’instant.', { a: 1 }],
  ]),
  scene('mc_mensonge_rapport', 'Le rapport', [13, 16], 'L’un de vous a commis une faute pendant la mission : un sceau mal posé, une cible qui a fui. Personne ne l’a vu, sauf l’autre. Il faut écrire le rapport ce soir.', [
    ['couvrir', 'Écrire que tout s’est bien passé', 'proteger'],
    ['verite', 'Écrire la vérité', 'parler'],
    ['partager', 'Écrire que c’est une faute commune', 'agir'],
  ], [
    ['partager+partager', 'Une faute commune, une sanction commune. Le sensei lit le rapport, vous regarde, et sait. Il ne dit rien. Il note quelque chose dans son carnet.', { l: { loyaute: 6, confiance: 4 }, a: 3 }],
    ['couvrir+couvrir', 'Le rapport est parfait. Le mensonge aussi. C’est votre premier vrai secret de ninja. Il pèse plus lourd que ceux de l’enfance.', { l: { confiance: 4, dependance: 4 }, apres: (c) => fait(c, { id: 'rapport_faux', texte: 'Le rapport d’une mission de genin a été falsifié, par vous deux.', connus: [0, 1], preuves: 1 }) }],
    ['verite+couvrir', '{un} écrit la vérité. {deux} voulait couvrir. La sanction tombe. {deux} ne sait pas s’il est en colère ou s’il admire {un}.', { deux: { respect: 4, ressentiment: 4 }, un: { confiance: -2 } }],
    ['defaut', 'Deux rapports différents arrivent sur le bureau du sensei. Il les lit, les deux, très lentement. Puis il vous convoque.', { l: { mefiance: 4 }, fx: [{ stat: 'social.reputation', delta: -1 }] }],
  ]),
  scene('mc_lac_gele', 'Le lac gelé', [12, 16], 'En traversant un lac gelé, la glace craque. L’un de vous passe au travers. L’eau noire, le froid, la main qui glisse sur le bord.', [
    ['plonger', 'Plonger le chercher', 'proteger'],
    ['corde', 'Lui lancer une corde, sans s’approcher', 'observer'],
    ['crier', 'Crier pour qu’il nage vers toi', 'parler'],
  ], [
    ['plonger+*', '{un} plonge sans réfléchir. Sous la glace, deux mains se trouvent. Vous ressortez ensemble, bleus de froid, et vous faites un feu énorme. {un} ne s’en souvient presque pas. {deux}, si, chaque hiver.', { deux: { dette: 10, peur_de_perdre: 6 }, un: { peur_de_perdre: 6 }, a: 5, s: ['Le lac gelé, et les deux mains sous la glace.', 5, 'tragique'] }],
    ['corde+corde', 'La corde, la traction lente, le corps qui ressort. Vous faites exactement ce que l’Académie vous a appris. Ça marche. Vous tremblez pendant une heure, pas seulement de froid.', { l: { respect: 4, peur_de_perdre: 4 }, a: 3 }],
    ['defaut', 'Celui qui est tombé se hisse seul sur la glace, avec une force qu’il ne se connaissait pas. Celui qui est resté sur le bord ne s’est pas approché. Ça restera entre vous.', { l: { mefiance: 3 } }],
  ]),
  scene('mc_tournoi_genin', 'Le tournoi des genin', [12, 15], 'Un tournoi amical entre équipes de genin. Le tirage au sort vous met face à face en demi-finale. Tout le village regarde.', [
    ['gagner', 'Te battre pour gagner', 'agir'],
    ['spectacle', 'Faire un beau combat', 'parler'],
    ['abandonner', 'Abandonner pour laisser passer l’autre', 'proteger'],
  ], [
    ['gagner+gagner', 'Le combat est rude, et beau, et on en parlera longtemps.', { l: { rivalite: 6, respect: 6 }, a: 3, combat: 'duel_entrainement' }],
    ['spectacle+spectacle', 'Vous donnez au public un combat qu’il n’oubliera pas, et vous l’avez à moitié répété la veille.', { l: { confiance: 4 }, a: 4, combat: 'duel_entrainement' }],
    ['abandonner+gagner', '{un} lève la main avant le premier coup. Le village siffle. {deux} gagne la finale, et ne sait pas quoi faire de cette victoire qu’on lui a donnée.', { deux: { ressentiment: 4, dette: 4 }, un: { peur_de_perdre: 2 } }],
    ['defaut', 'Vous vous battez.', { l: { rivalite: 4 }, combat: 'duel_entrainement' }],
  ]),
  scene('mc_lettre_parent', 'La lettre du parent', [12, 16], (c) => selon(c, {
    freres: '{parent} part en mission longue, et vous laisse une lettre à ouvrir « seulement si je ne reviens pas ». Elle est posée sur la table, au milieu.',
    defaut: 'Le parent de {j1} part en mission longue, et laisse une lettre à ouvrir « seulement s’il ne revient pas ». {j1} l’a confiée à {j2}, pour ne pas être tenté{e:j1}.',
  }), [
    ['ouvrir', 'L’ouvrir maintenant', 'agir'],
    ['attendre', 'Attendre, comme demandé', 'proteger'],
    ['bruler', 'La brûler : il reviendra', 'partir'],
  ], [
    ['attendre+attendre', 'La lettre reste fermée. Les semaines passent. Un soir, la porte s’ouvre, et le parent est là, maigre et vivant. Il reprend la lettre sans un mot, et la brûle devant vous.', { l: { confiance: 5, loyaute: 4 }, a: 2, s: ['La lettre jamais ouverte.', 4, 'chaud'] }],
    ['ouvrir+ouvrir', 'Il n’y a qu’une phrase : « Prenez soin l’un de l’autre. » Vous refermez la lettre très vite, comme si vous aviez lu quelque chose d’interdit. Le parent revient. Vous ne lui direz jamais.', { l: { loyaute: 6, peur_de_perdre: 6 }, a: 3, s: ['« Prenez soin l’un de l’autre. »', 5, 'chaud'] }],
    ['bruler+attendre', '{un} veut la brûler. {deux} la cache. La lettre existe toujours, quelque part. {un} ne sait pas où.', { l: { confiance: 2 }, apres: (c, un) => fait(c, { id: 'lettre_parent', texte: 'La lettre du parent existe encore : tu l’as cachée.', connus: [(1 - un) as 0 | 1], preuves: 0 }) }],
    ['defaut', 'Vous vous disputez sur la lettre jusqu’au retour du parent, qui revient indemne, et vous trouve en train de vous disputer. Il rit. Vous, non.', { l: { rivalite: 3 } }],
  ]),
  scene('mc_promotion_seul', 'Un seul nom', [13, 16], 'La liste des candidats à l’examen chūnin est affichée. Votre sensei n’a proposé qu’un seul nom. Et ce n’est pas le même que vous attendiez.', [
    ['feliciter', 'Féliciter l’autre', 'proteger'],
    ['contester', 'Aller contester auprès du sensei', 'agir'],
    ['refuser', 'Refuser d’y aller sans l’autre', 'parler'],
  ], [
    ['refuser+feliciter', '{un} refuse de se présenter sans {deux}. Le sensei lève un sourcil, puis ajoute le deuxième nom. {deux} ne sait pas s’il doit remercier ou se sentir humilié{e:deux}.', { deux: { dette: 6, jalousie: 4 }, un: { loyaute: 4 } }],
    ['contester+contester', 'Vous entrez ensemble dans le bureau du sensei, et vous ressortez avec deux noms sur la liste et une corvée d’un mois chacun. Ça valait le coup.', { l: { loyaute: 6, respect: 4 }, a: 3 }],
    ['feliciter+contester', '{un} félicite ; {deux} va contester, seul{e:deux}, et revient sans rien. {deux} n’a jamais été aussi en colère contre {un}, et {un} n’a rien fait.', { deux: { jalousie: 8, ressentiment: 4 } }],
    ['defaut', 'Le nom reste seul sur la liste. Ce soir-là, vous ne mangez pas ensemble. Le lendemain, si.', { l: { jalousie: 4 } }],
  ]),
  scene('mc_feu_village', 'Le feu dans le quartier bas', [12, 16], 'Le quartier bas brûle. Les adultes sont occupés plus loin. Dans une maison en flammes, quelqu’un crie. Et la maison voisine va prendre aussi.', [
    ['entrer', 'Entrer dans la maison', 'agir'],
    ['coupe_feu', 'Abattre la maison voisine pour faire un coupe-feu', 'observer'],
    ['eau', 'Organiser la chaîne d’eau', 'parler'],
  ], [
    ['entrer+coupe_feu', 'L’un entre et ressort avec une vieille femme dans les bras. L’autre fait tomber la maison voisine. Le feu s’arrête. Le village vous regarde autrement.', { l: { respect: 6, confiance: 4 }, a: 5, s: ['Le feu du quartier bas.', 4, 'fier'], fx: [{ stat: 'social.reputation', delta: 4 }] }],
    ['entrer+entrer', 'Vous entrez tous les deux. Vous ressortez tous les deux, avec deux enfants et des brûlures aux bras. Les cicatrices seront presque les mêmes.', { l: { loyaute: 6, peur_de_perdre: 6 }, a: 5, s: ['Les brûlures presque identiques, du feu du quartier bas.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 5 }, { blessure: { id: 'brulure_quartier', nom: 'Brûlures aux bras', gravite: 1, jours: 20 } }] }],
    ['defaut', 'Vous faites ce que vous pouvez. La maison brûle quand même. Mais personne n’est mort, et c’est grâce à vous.', { l: { confiance: 3 }, fx: [{ stat: 'social.reputation', delta: 2 }] }],
  ]),
  scene('mc_secret_sensei', 'Ce que cache le sensei', [13, 16], 'Vous surprenez votre sensei, la nuit, au cimetière, devant une tombe sans nom. Il parle à quelqu’un. Il pleure. Il ne vous a pas vus.', [
    ['partir', 'Partir sans bruit', 'partir'],
    ['approcher', 'Aller le voir', 'proteger'],
    ['chercher', 'Revenir le lendemain pour lire la tombe', 'observer'],
  ], [
    ['partir+partir', 'Vous partez. Le lendemain, il est le même, sévère et distant. Mais vous lui obéissez un peu mieux, sans savoir pourquoi.', { l: { confiance: 3 }, s: ['Le sensei au cimetière.', 3, 'tragique'] }],
    ['approcher+approcher', 'Il sursaute, se raidit, puis se tait. Puis il parle : son équipe, il y a vingt ans. Deux garçons, une fille. Lui seul est revenu. « Ne devenez pas comme moi », dit-il.', { l: { peur_de_perdre: 8, loyaute: 4 }, a: 3, s: ['« Ne devenez pas comme moi. »', 5, 'tragique'] }],
    ['chercher+*', 'La tombe ne porte pas de nom, mais un symbole : un héron, gravé à la main, à moitié effacé. Vous ne savez pas encore ce que ça veut dire.', { l: { mefiance: 2 }, apres: (c) => fait(c, { id: 'tombe_heron', texte: 'Le sensei pleure sur une tombe marquée d’un héron.', connus: [0, 1], preuves: 0 }) }],
    ['defaut', 'Vous restez cachés jusqu’à ce qu’il parte. Vous ne regarderez plus jamais votre sensei tout à fait de la même façon.', { l: { confiance: 2 } }],
  ]),
  scene('mc_village_voisin', 'Le village pillé', [13, 16], 'Un village de paysans, pillé la veille. Les survivants vous regardent arriver, deux enfants avec un bandeau, et ils ont l’air déçus.', [
    ['traquer', 'Traquer les pillards', 'agir'],
    ['aider', 'Rester aider les survivants', 'proteger'],
    ['rapport', 'Faire un rapport, et laisser les adultes s’en charger', 'parler'],
  ], [
    ['traquer+traquer', 'Les traces sont fraîches. Vous les suivez jusqu’au col.', { l: { respect: 4 }, a: 3, combat: 'premier_combat' }],
    ['aider+aider', 'Trois jours à reconstruire des murs, à soigner, à enterrer. Le dernier soir, un vieux vous donne un panier de prunes. « Pour les deux ninjas. » Vous avez envie de pleurer, sans savoir pourquoi.', { l: { confiance: 5 }, a: 3, s: ['Le panier de prunes du village pillé.', 4, 'chaud'], fx: [{ stat: 'social.reputation', delta: 2 }] }],
    ['traquer+aider', '{un} part seul{e:un} sur les traces. {deux} reste. Quand {un} revient, blessé{e:un}, avec les objets volés, {deux} est le premier à {le:un} soigner.', { l: { respect: 4, peur_de_perdre: 4 }, fxUn: [{ blessure: { id: 'pillards_seul', nom: 'Coups des pillards', gravite: 1, jours: 12 } }] }],
    ['defaut', 'Le rapport part. Les adultes viendront. Les survivants vous regardent repartir. Vous n’aimez pas ce regard.', { l: { confiance: 1 } }],
  ]),
  scene('mc_technique_commune', 'La première technique ensemble', [13, 17], 'Sur le terrain d’entraînement, par hasard, vos deux techniques se rencontrent : l’une nourrit l’autre, et l’arbre en face éclate. Vous vous regardez, ébahis.', [
    ['recommencer', 'Recommencer, jusqu’à la maîtriser', 'agir'],
    ['etudier', 'Comprendre pourquoi ça a marché', 'observer'],
    ['secret', 'Garder ça secret, pour vous deux', 'proteger'],
  ], [
    ['recommencer+etudier', 'L’un recommence, l’autre note. Au bout d’un mois, ce n’est plus un hasard : c’est une technique, et elle n’est qu’à vous.', { l: { confiance: 5, respect: 5 }, a: 8, s: ['L’arbre qui a éclaté, le jour où vos techniques se sont rencontrées.', 4, 'fier'] }],
    ['secret+secret', 'Une technique que personne ne connaît. Une arme cachée. Vous vous entraînez de nuit, loin de tout le monde. Ça vous lie plus qu’un serment.', { l: { confiance: 6, dependance: 4 }, a: 8, s: ['La technique secrète, travaillée la nuit.', 4, 'chaud'] }],
    ['defaut', 'Vous essayez, et ça rate, encore et encore. Puis, un soir, une fois, ça marche. Vous ne savez pas pourquoi. Vous savez que c’est possible.', { l: { respect: 3 }, a: 5 }],
  ]),

  // ── Chūnin ──
  scene('mc_examen_foret', 'La forêt de l’examen', [14, 17], 'Deuxième épreuve de l’examen chūnin : cinq jours dans une forêt où tout le monde est votre ennemi. Une autre équipe vous propose une alliance. Ils ont l’air sincères. Ils ont l’air.', [
    ['accepter', 'Accepter l’alliance', 'parler'],
    ['refuser', 'Refuser : vous deux, c’est assez', 'partir'],
    ['trahir', 'Accepter, et les trahir au bon moment', 'agir'],
  ], [
    ['accepter+accepter', 'L’alliance tient quatre jours. Le cinquième, ils vous trahissent. Vous vous en doutiez. Vous aviez préparé une sortie. Vous ressortez de la forêt à deux, avec leurs rouleaux.', { l: { confiance: 6, respect: 4 }, a: 5, s: ['La forêt de l’examen : la sortie préparée en secret.', 4, 'fier'] }],
    ['trahir+trahir', 'Vous les trahissez le troisième jour, sans un mot à échanger : il vous a suffi d’un regard. Ça a marché. Vous n’en êtes pas fiers. Pas tout à fait.', { l: { dependance: 6 }, a: 6, s: ['Le regard, dans la forêt, avant la trahison.', 3, 'honteux'] }],
    ['refuser+accepter', '{un} refuse, {deux} accepte. Vous vous disputez devant l’autre équipe, qui finit par partir en riant. Il vous faut deux jours pour vous reparler.', { l: { rivalite: 4, mefiance: 3 } }],
    ['defaut', 'Cinq jours de faim, de peur et de pluie. Vous ressortez de la forêt, vivants. C’est déjà beaucoup.', { l: { confiance: 3 }, a: 3 }],
  ]),
  scene('mc_chunin_seul', 'Le gilet', [15, 19], 'Les résultats de l’examen. L’un de vous est promu chūnin. L’autre, non. Le gilet est posé sur la table, entre vous deux.', [
    ['feliciter', 'Féliciter, sincèrement', 'proteger'],
    ['partir', 'Partir avant de dire quelque chose de mal', 'partir'],
    ['defi', 'Promettre de le rattraper', 'agir'],
  ], [
    ['defi+defi', '« Dans un an. » « Je t’attendrai. » Vous savez tous les deux que ce n’est pas vrai : celui qui a le gilet n’attendra pas. Et c’est très bien comme ça.', { l: { rivalite: 6, respect: 6 }, a: 3, s: ['Le gilet sur la table, et « dans un an ».', 4, 'fier'] }],
    ['feliciter+feliciter', 'Vous vous félicitez l’un l’autre, celui qui l’a et celui qui ne l’a pas. Ça semble absurde. Ça ne l’est pas.', { l: { confiance: 6 }, a: 3 }],
    ['partir+*', 'L’un part sans un mot. Le gilet reste sur la table. Celui qui l’a gagné le regarde longtemps, et le trouve soudain moins beau.', { l: { jalousie: 6, peur_de_perdre: 4 } }],
    ['defaut', 'Le gilet est porté. La distance entre vous vient de grandir d’un rang. Vous ferez semblant de ne pas la voir.', { l: { jalousie: 4 } }],
  ], { si: (c) => c.joueurs[0].rang !== c.joueurs[1].rang }),
  scene('mc_premiere_equipe', 'Commander l’autre', [15, 20], 'Pour la première fois, l’un de vous commande une mission. L’autre en fait partie. Au moment de répartir les rôles, il faut choisir qui prend le poste le plus dangereux.', [
    ['soi', 'Le chef prend le danger pour lui', 'proteger'],
    ['meilleur', 'Le plus apte prend le poste, quel qu’il soit', 'observer'],
    ['volontaire', 'Se porter volontaire', 'agir'],
  ], [
    ['volontaire+volontaire', 'Vous vous portez volontaires en même temps. Le chef dit non, l’autre insiste, et c’est finalement le chef qui y va. La mission réussit. La dispute dure encore.', { l: { loyaute: 4, rivalite: 4 }, a: 3 }],
    ['meilleur+meilleur', 'Vous tombez d’accord sans discuter. La mission est une mécanique parfaite. Le sensei, en lisant le rapport, dit simplement : « Enfin. »', { l: { respect: 6 }, a: 6, s: ['La première mission commandée, et le mot du sensei : « Enfin. »', 3, 'fier'] }],
    ['defaut', 'Les rôles sont donnés, pas tout à fait comme chacun le voulait. La mission réussit. Chacun pense que ça aurait pu être mieux.', { l: { rivalite: 2 }, a: 2 }],
  ]),
  scene('mc_infirmerie', 'L’infirmerie', [14, 20], 'L’un de vous est à l’infirmerie, après une mission ratée. Rien de grave, disent les médecins. L’autre est assis à côté du lit depuis six heures.', [
    ['rester', 'Rester toute la nuit', 'proteger'],
    ['engueuler', 'Lui reprocher son imprudence', 'parler'],
    ['venger', 'Partir retrouver celui qui a fait ça', 'agir'],
  ], [
    ['rester+engueuler', 'Toute la nuit, des reproches, à voix basse, entrecoupés de silences. À l’aube, celui qui était au lit dit : « Tu as fini ? » « Non. » Et ça continue, jusqu’au matin.', { l: { peur_de_perdre: 8, confiance: 4 }, a: 3, s: ['La nuit de reproches à l’infirmerie.', 4, 'chaud'] }],
    ['venger+*', 'L’un part, en pleine nuit, sans prévenir. Il revient trois jours plus tard, couvert de bleus, avec un sourire satisfait. Celui qui était au lit est furieux. Et touché.', { l: { loyaute: 6, peur_de_perdre: 4 }, a: 2 }],
    ['defaut', 'Les heures passent. Vous ne dites presque rien. Vous n’en avez pas besoin.', { l: { confiance: 4 } }],
  ]),
  scene('mc_rumeur_clan', 'Ce qu’on dit de ta famille', [15, 20], (c) => `Au marché, un chūnin de ${selon(c, { clans_differents: 'votre clan rival', defaut: 'l’autre quartier' })} parle fort : la famille de l’un de vous aurait vendu des secrets pendant la dernière guerre. Il ne vous a pas vus.`, [
    ['frapper', 'Lui faire ravaler ses mots', 'agir'],
    ['ignorer', 'Passer : ce ne sont que des mots', 'partir'],
    ['enqueter', 'Vérifier si c’est vrai', 'observer'],
  ], [
    ['frapper+frapper', 'Il ravale ses mots. Et deux dents. Vous êtes punis tous les deux. Le soir, en vous partageant la glace pour vos mains, vous riez.', { l: { loyaute: 8 }, a: 3, fx: [{ stat: 'social.reputation', delta: -2 }] }],
    ['enqueter+enqueter', 'Les archives sont fermées. Mais un vieil archiviste vous ouvre, un soir. C’est faux. Ou presque : quelqu’un a vendu des secrets, et il portait le même nom que vous. Un cousin éloigné. Vous gardez ça pour vous.', { l: { confiance: 6 }, a: 2, apres: (c) => fait(c, { id: 'cousin_traitre', texte: 'Un cousin de la famille a vendu des secrets pendant la guerre.', connus: [0, 1], preuves: 1 }) }],
    ['ignorer+frapper', '{un} passe son chemin. {deux} frappe. {un} doit retenir {deux}, devant tout le marché. {deux} ne pardonne pas d’avoir été retenu{e:deux}.', { deux: { ressentiment: 6 }, un: { peur_de_perdre: 2 } }],
    ['defaut', 'Les mots restent. Ils reviennent parfois, la nuit.', { l: { mefiance: 2 } }],
  ]),
  scene('mc_fete_lanternes', 'La fête des lanternes', [15, 20], 'La fête des lanternes. On écrit un vœu sur une lanterne de papier, et on la laisse partir sur la rivière. Personne ne doit lire le vœu de l’autre.', [
    ['vrai', 'Écrire un vrai vœu', 'proteger'],
    ['lire', 'Lire celui de l’autre en cachette', 'observer'],
    ['commun', 'Écrire un vœu à deux', 'parler'],
  ], [
    ['commun+commun', 'Une seule lanterne, deux écritures. Elle s’en va sur la rivière, parmi les autres. Vous ne direz jamais ce qu’il y avait dessus. Même pas l’un à l’autre : vous avez écrit chacun une moitié, sans regarder.', { l: { confiance: 6, loyaute: 4 }, a: 4, s: ['La lanterne à deux écritures.', 4, 'chaud'] }],
    ['lire+vrai', '{un} lit le vœu de {deux}, en cachette, avant que la lanterne ne parte. Il n’y a qu’un prénom dessus : celui de {un}. {un} ne dira jamais qu’il l’a lu.', { un: { peur_de_perdre: 6, dette: 4 }, apres: (c, un) => souvenir(c, 'lanterne_lue', 'Le vœu de l’autre, lu en cachette : il n’y avait que ton prénom.', 5, 'chaud', [un]) }],
    ['lire+lire', 'Vous vous surprenez à lire le vœu de l’autre en même temps. Vous lâchez les lanternes, honteux. Elles partent. Vous n’avez rien lu. Vous ferez semblant de ne pas avoir essayé.', { l: { confiance: 2 }, a: 2 }],
    ['defaut', 'Deux lanternes partent sur la rivière, côte à côte, puis se séparent au premier courant.', { l: { confiance: 2 }, s: ['Les deux lanternes séparées par le courant.', 3, 'amer'] }],
  ]),
  scene('mc_choix_tuer', 'L’ordre', [15, 20], 'L’ordre est simple : un témoin a vu ce qu’il ne devait pas voir. C’est un paysan, avec une femme et un enfant. Le chef d’équipe vous regarde tous les deux.', [
    ['executer', 'Exécuter l’ordre', 'agir'],
    ['refuser', 'Refuser', 'parler'],
    ['epargner', 'Le laisser fuir en secret', 'proteger'],
  ], [
    ['refuser+refuser', 'Vous refusez ensemble. Le chef ne dit rien, puis fait signe de partir. Personne n’en parlera dans le rapport. Mais on vous regardera différemment, désormais. Vous aussi, vous vous regardez différemment.', { l: { respect: 8, loyaute: 6 }, a: 3, s: ['L’ordre refusé ensemble.', 5, 'fier'], fx: [{ stat: 'social.loyaute', delta: -3 }] }],
    ['epargner+epargner', 'Vous le laissez fuir la nuit même, sans vous concerter. Le lendemain, vous découvrez que l’autre a eu la même idée. Le paysan est loin. Le chef ne sait rien.', { l: { confiance: 8 }, a: 3, s: ['Le paysan laissé libre la même nuit, chacun de son côté.', 4, 'chaud'], apres: (c) => fait(c, { id: 'paysan_fui', texte: 'Le témoin que vous deviez tuer a fui, et vous l’avez laissé faire.', connus: [0, 1], preuves: 1 }) }],
    ['executer+refuser', '{un} exécute. {deux} détourne les yeux. Ce soir-là, {deux} ne mange pas, et regarde les mains de {un} comme on regarde celles d’un étranger.', { deux: { mefiance: 8, respect: -4 }, un: { peur_de_perdre: 4 }, s: ['Le paysan, et les mains de celui qui a obéi.', 4, 'tragique'] }],
    ['executer+executer', 'C’est fait. Vous ne parlez pas sur le chemin du retour. Vous êtes devenus ce que vous deviez devenir.', { l: { dependance: 6 }, s: ['Le témoin, et le silence du retour.', 4, 'tragique'], fx: [{ stat: 'social.loyaute', delta: 2 }] }],
    ['defaut', 'Le chef d’équipe prend la décision à votre place, devant vous. Vous ne savez pas si c’est mieux.', { l: { confiance: 1 } }],
  ]),
  scene('mc_rival_tiers', 'Le rival', [15, 20], 'Un jeune prodige de votre génération, Kazuma, vous a battus l’un après l’autre, en entraînement. Il ne rate pas une occasion de le rappeler. Il propose un défi : vous deux contre lui seul.', [
    ['accepter', 'Accepter', 'agir'],
    ['refuser', 'Refuser : c’est indigne', 'partir'],
    ['preparer', 'Accepter dans un mois, et préparer une stratégie', 'observer'],
  ], [
    ['preparer+preparer', 'Un mois à décortiquer ses combats. Le jour venu, vous le battez en trois mouvements, sans un mot. Il se relève, vous regarde, et pour la première fois, il s’incline.', { l: { respect: 6, confiance: 4 }, a: 8, s: ['Kazuma battu en trois mouvements.', 4, 'fier'] }],
    ['accepter+accepter', 'Vous perdez. Mais de peu, et il le sait. « Dans un an, je ne gagnerai plus », dit-il, en partant. Il a raison.', { l: { rivalite: 3, respect: 4 }, a: 5 }],
    ['defaut', 'Le défi ne se fait pas. Kazuma continue de vous narguer. Ça vous rapproche, au moins : vous avez un ennemi commun.', { l: { confiance: 3 } }],
  ]),
  scene('mc_dette_argent', 'La dette', [15, 20], 'L’un de vous doit de l’argent à un usurier du quartier bas. Beaucoup. L’autre l’apprend par hasard, en voyant les hommes de l’usurier attendre devant sa porte.', [
    ['payer', 'Payer sa dette à sa place', 'proteger'],
    ['affronter', 'Aller voir l’usurier', 'agir'],
    ['laisser', 'Faire semblant de ne rien savoir', 'partir'],
  ], [
    ['payer+*', 'L’un vide ses économies sans rien dire. L’autre l’apprend un mois plus tard. Il n’y a rien à dire. Il y a une dette, désormais, plus lourde que l’autre.', { l: { dette: 8 }, a: 2, fx: [{ stat: 'jauges.ryo', delta: -30 }] }],
    ['affronter+affronter', 'Vous allez voir l’usurier à deux. Il regarde vos bandeaux, réfléchit, et divise la dette par deux. Puis par quatre. Vous n’avez même pas eu à lever la main.', { l: { loyaute: 6 }, a: 3 }],
    ['defaut', 'La dette reste. Les hommes de l’usurier aussi. Ça finira par se régler, d’une façon ou d’une autre.', { l: { mefiance: 2 } }],
  ]),
  scene('mc_brume_chunin', 'La brume', [16, 22], (c) => `Mission ${memeVillage(c) ? 'conjointe' : 'conjointe de vos deux villages'} près des côtes. Une brume se lève, si épaisse que vous ne voyez plus vos propres mains. Puis les ombres attaquent, et vous êtes séparés.`, [
    ['appeler', 'Appeler l’autre à voix haute', 'parler'],
    ['silence', 'Rester silencieux, et se battre', 'agir'],
    ['signal', 'Utiliser le signal convenu', 'observer'],
  ], [
    ['signal+signal', 'Trois coups sur le métal : le signal de l’enfance. L’autre répond. Vous savez où vous êtes. Vous vous battez quand même seuls.', { l: { confiance: 4 }, a: 6, combat: 'combat_brume' }],
    ['defaut', 'La brume avale les voix.', { l: { peur_de_perdre: 3 }, combat: 'combat_brume' }],
  ]),
  scene('mc_mentor_cache', 'Un maître pour deux', [15, 20], 'Un vieil ermite, dans les montagnes, accepte d’enseigner une technique ancienne. Mais il n’en prendra qu’un seul. « Décidez entre vous. »', [
    ['ceder', 'Laisser la place à l’autre', 'proteger'],
    ['vouloir', 'Vouloir la place', 'agir'],
    ['refuser', 'Refuser : ce sera les deux ou personne', 'parler'],
  ], [
    ['refuser+refuser', 'L’ermite vous regarde longtemps. Puis il rit. « Les deux, alors. Mais vous dormirez dehors. » Six mois dans le froid. Vous n’avez jamais autant appris.', { l: { loyaute: 6, respect: 6 }, a: 6, s: ['Les six mois chez l’ermite, dehors.', 5, 'fier'], fx: [{ entrainer: 'ninjutsu', jours: 30, mentor: true }] }],
    ['ceder+vouloir', '{deux} part chez l’ermite. {un} reste au village. Quand {deux} revient, six mois plus tard, {il:deux} a changé. Et {un} aussi.', { deux: { dette: 8 }, un: { jalousie: 4, rivalite: 4 }, fxDeux: [{ entrainer: 'ninjutsu', jours: 30, mentor: true }] }],
    ['vouloir+vouloir', 'L’ermite vous fait combattre pour la place.', { l: { rivalite: 8 }, combat: 'duel_honneur' }],
    ['ceder+ceder', 'Chacun laisse la place à l’autre, et l’ermite vous renvoie tous les deux. « Revenez quand l’un de vous saura ce qu’il veut. » Vous ne reviendrez pas.', { l: { confiance: 4 } }],
    ['defaut', 'L’ermite s’impatiente et ferme sa porte. L’occasion est passée.', { l: { rivalite: 2 } }],
  ]),
  scene('mc_noces', 'Le mariage', [17, 22], 'Le mariage d’une amie de l’Académie. Le saké coule. À la fin de la nuit, assis sur les marches, l’un de vous demande à l’autre : « Et toi, tu crois que tu vivras assez vieux pour te marier ? »', [
    ['oui', 'Répondre : oui', 'parler'],
    ['non', 'Répondre : non', 'observer'],
    ['promesse', 'Répondre : seulement si tu es là', 'proteger'],
  ], [
    ['promesse+promesse', '« Seulement si tu es là. » Vous l’avez dit en même temps. Vous riez, puis vous ne riez plus. C’est devenu une promesse.', { l: { loyaute: 8, peur_de_perdre: 6 }, a: 4, s: ['Les marches, après le mariage : « Seulement si tu es là. »', 5, 'chaud'], promesse: ['temoin', 'Être là, le jour où l’autre se mariera.'] }],
    ['non+non', '« Non. » « Non plus. » Vous trinquez à ça, très sérieusement. C’est la conversation la plus triste et la plus drôle de votre vie.', { l: { confiance: 5 }, a: 2, s: ['Le toast à « non », sur les marches.', 4, 'amer'] }],
    ['defaut', 'Les réponses ne sont pas les mêmes. Vous n’en parlez plus. Mais chacun se souvient de celle de l’autre.', { l: { confiance: 2 } }],
  ]),
  scene('mc_traque_deserteur', 'Le déserteur', [16, 22], 'Mission : ramener un chūnin déserteur, vivant si possible. Vous le connaissez. Il était deux classes au-dessus de vous à l’Académie. Il vous attend au pont suspendu, et il a l’air fatigué.', [
    ['parler', 'Lui parler d’abord', 'parler'],
    ['attaquer', 'Attaquer avant qu’il ne se prépare', 'agir'],
    ['laisser', 'Le laisser passer', 'partir'],
  ], [
    ['parler+parler', 'Il parle. De ce qu’on lui a ordonné de faire. De la nuit où il a décidé de partir. Puis il se lève : « Je ne reviendrai pas. » Il faudra se battre.', { l: { confiance: 3 }, a: 3, combat: 'combat_deserteur' }],
    ['laisser+laisser', 'Vous le laissez partir. Il vous regarde, incrédule, puis disparaît dans la forêt. Le rapport dira qu’il s’est jeté du pont. Votre deuxième mensonge commun.', { l: { confiance: 6, dependance: 4 }, s: ['Le déserteur laissé libre au pont suspendu.', 4, 'chaud'], apres: (c) => fait(c, { id: 'deserteur_libre', texte: 'Le déserteur du pont suspendu est vivant : vous l’avez laissé partir.', connus: [0, 1], preuves: 2 }) }],
    ['laisser+attaquer', '{un} veut le laisser partir ; {deux} attaque. Vous voilà dans un combat que l’un de vous ne voulait pas.', { un: { ressentiment: 4 }, deux: { mefiance: 3 }, combat: 'combat_deserteur' }],
    ['defaut', 'Il n’y a pas le choix.', { combat: 'combat_deserteur' }],
  ]),
]);
