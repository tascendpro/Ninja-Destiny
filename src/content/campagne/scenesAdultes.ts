import type { SceneCommuneDef } from '../../engine/campagne/types';
import { fait, souvenir } from '../../engine/campagne/outils';
import { arc, memeVillage, rangDe, scene, selon, tirees } from './fabrique';

/** Jōnin (20 à 30 ans), vétérans (30 à 45 ans), anciens (45 ans et plus) : commander, perdre, transmettre. */
export const SCENES_ADULTES: SceneCommuneDef[] = tirees(0.65, [
  // ── Jōnin ──
  scene('mc_eleves', 'Trois genin', [20, 28], 'L’un de vous reçoit sa première équipe de genin : trois enfants qui se détestent, qui ne savent rien, et qui le regardent comme un dieu. L’autre est venu voir, appuyé contre un arbre, et rit.', [
    ['aider', 'Aider à les former', 'proteger'],
    ['moquer', 'Se moquer gentiment', 'parler'],
    ['concourir', 'Former aussi une équipe, et les faire concourir', 'agir'],
  ], [
    ['concourir+concourir', 'Deux équipes, deux sensei, et une rivalité qui passe d’une génération à l’autre. Vos genin se détestent exactement comme vous vous détestiez. Vous les regardez, attendris.', { l: { rivalite: 6, respect: 4 }, a: 3, s: ['Vos deux équipes de genin, qui se détestaient comme vous.', 4, 'chaud'] }],
    ['aider+aider', 'Vous les formez à deux. Ils vous appellent « les deux sensei », puis simplement « les sensei », comme si vous étiez une seule personne.', { l: { confiance: 6 }, a: 4, s: ['« Les sensei ».', 4, 'chaud'] }],
    ['defaut', 'Les genin grandissent. Vous aussi, sans vous en apercevoir.', { l: { confiance: 2 } }],
  ]),
  scene('mc_anbu', 'Le masque', [20, 28], 'L’un de vous est approché par l’ANBU. Un masque blanc, posé sur la table : « Personne ne doit savoir. Pas même votre famille. » L’autre attend dehors, et voit le visiteur sortir.', [
    ['accepter', 'Accepter le masque', 'agir'],
    ['dire', 'Le dire quand même à l’autre', 'parler'],
    ['refuser', 'Refuser', 'partir'],
  ], [
    ['accepter+accepter', 'Il y aura désormais des nuits où l’un disparaît, et où l’autre ne pose pas de question. Vous ne savez même pas lequel des deux a accepté le premier.', { l: { mefiance: 4, peur_de_perdre: 6 }, a: 2, fx: [{ stat: 'social.loyaute', delta: 4 }] }],
    ['dire+*', '« Ils m’ont proposé le masque. » Une phrase, qui pourrait coûter très cher. L’autre la garde comme un trésor.', { l: { confiance: 8 }, apres: (c, un) => fait(c, { id: 'masque_anbu', texte: 'L’un de vous a reçu l’offre de l’ANBU, et l’a dit à l’autre.', connus: [0, 1], preuves: 1 }) }],
    ['refuser+refuser', 'Le masque retourne dans sa boîte. On ne vous le proposera plus. Vous ne le regrettez pas, ou presque.', { l: { confiance: 3 } }],
    ['defaut', 'Les nuits d’absence commencent. Celui qui reste ne pose pas de question. Il les compte.', { l: { mefiance: 3, peur_de_perdre: 4 } }],
  ]),
  scene('mc_mariage_autre', 'Le jour du mariage', [20, 30], 'L’un de vous se marie. L’autre est là, au premier rang, et ne sait pas très bien quoi faire de ses mains.', [
    ['discours', 'Faire un discours', 'parler'],
    ['cadeau', 'Offrir quelque chose qui vient de l’enfance', 'proteger'],
    ['partir', 'Partir avant la fin', 'partir'],
  ], [
    ['discours+cadeau', 'Le discours fait rire toute la salle, puis la fait pleurer. Le cadeau, c’est un vieux kunai rouillé, et vous seuls savez pourquoi.', { l: { confiance: 6, loyaute: 4 }, a: 3, s: ['Le kunai rouillé, offert au mariage.', 5, 'chaud'] }],
    ['partir+*', 'L’un part avant le premier toast. Personne ne le remarque, sauf la seule personne qui comptait.', { l: { ressentiment: 4, peur_de_perdre: 4 }, s: ['Le mariage, et la place vide au premier toast.', 3, 'amer'] }],
    ['defaut', 'C’est une belle journée. Il y en aura moins, désormais, rien que pour vous deux.', { l: { confiance: 3 } }],
  ]),
  scene('mc_promotion_jonin', 'Le grade', [20, 30], 'Le conseil ne promeut qu’un jōnin cette saison. Vous êtes tous les deux sur la liste. On vous demande, à chacun, ce que vous pensez de l’autre.', [
    ['eloge', 'Faire l’éloge de l’autre', 'proteger'],
    ['honnete', 'Dire la vérité, défauts compris', 'observer'],
    ['soi', 'Parler surtout de toi', 'agir'],
  ], [
    ['eloge+eloge', 'Le conseil s’étonne : deux candidats qui plaident chacun pour l’autre. On vous promeut tous les deux, la saison suivante. Ça n’arrive jamais.', { l: { loyaute: 8, confiance: 4 }, a: 3, fx: [{ stat: 'social.reputation', delta: 3 }] }],
    ['soi+eloge', '{un} parle de {lui:un}, {deux} parle de {un}. C’est {un} qui est promu. Des années plus tard, un membre du conseil racontera ce que {deux} avait dit. {un} ne saura plus quoi répondre.', { un: { dette: 8 }, deux: { jalousie: 4 }, apres: (c, un) => fait(c, { id: 'eloge_conseil', texte: 'Devant le conseil, l’autre a plaidé pour toi.', connus: [(1 - un) as 0 | 1, 'conseil'], preuves: 2, cible: un }) }],
    ['honnete+honnete', 'Vous dites chacun les défauts de l’autre, sans pitié et sans haine. Le conseil est impressionné. Vous, vous êtes un peu vexés.', { l: { respect: 6, rivalite: 3 }, a: 2 }],
    ['defaut', 'Le conseil délibère longtemps. La décision tombe. L’un des deux est content.', { l: { jalousie: 4 } }],
  ]),
  scene('mc_frontiere_hiver', 'L’hiver à la frontière', [20, 30], 'Six mois de garde à un poste frontière, dans la neige. Les ravitaillements n’arrivent plus. Il reste de quoi tenir deux semaines à un seul.', [
    ['partager', 'Partager tout, moitié-moitié', 'proteger'],
    ['chasser', 'Partir chasser, au risque de se perdre', 'agir'],
    ['descendre', 'Abandonner le poste', 'partir'],
  ], [
    ['partager+chasser', 'L’un rationne, l’autre chasse. Vous tenez trois mois. Quand la relève arrive, elle trouve deux squelettes qui rient.', { l: { confiance: 6, loyaute: 6 }, a: 5, s: ['L’hiver à la frontière, à deux squelettes qui riaient.', 5, 'fier'] }],
    ['partager+partager', 'Moitié-moitié, jusqu’au bout. Vous maigrissez ensemble. Quand la relève arrive, vous avez du mal à marcher, et vous refusez qu’on vous porte.', { l: { loyaute: 8 }, a: 4 }],
    ['descendre+*', 'L’un veut descendre. L’autre refuse. L’autre gagne, et vous restez. La relève vous trouve vivants. L’un n’oubliera pas avoir voulu fuir.', { l: { respect: 3 }, a: 2 }],
    ['defaut', 'Vous tenez. Comment, vous ne savez plus très bien.', { l: { confiance: 3 } }],
  ]),
  scene('mc_eleve_mort', 'L’élève', [21, 32], 'Un de vos élèves est mort en mission. Il avait treize ans. La mère attend devant la porte du bureau, et il faut que l’un de vous aille lui parler.', [
    ['aller', 'Y aller', 'proteger'],
    ['ensemble', 'Y aller ensemble', 'parler'],
    ['fuir', 'Ne pas pouvoir', 'partir'],
  ], [
    ['ensemble+ensemble', 'Vous y allez ensemble. Elle crie, puis elle s’effondre. L’un la tient, l’autre parle. En sortant, vous ne dites rien, et vous marchez jusqu’à l’aube.', { l: { loyaute: 6, peur_de_perdre: 6 }, a: 3, s: ['La mère de l’élève, et la marche jusqu’à l’aube.', 5, 'tragique'] }],
    ['aller+fuir', '{un} y va. {deux} ne peut pas. Le soir, {deux} trouve {un} assis sur le toit, sans larmes. Ils restent là jusqu’au matin.', { deux: { dette: 6 }, un: { confiance: 3 }, s: ['La nuit sur le toit, après la mère de l’élève.', 4, 'tragique'] }],
    ['defaut', 'La mère repart. Vous restez avec ce que vous n’avez pas su dire.', { l: { peur_de_perdre: 4 }, s: ['L’élève de treize ans.', 4, 'tragique'] }],
  ]),
  scene('mc_rumeur_amour', 'Ce qu’on dit de vous', [20, 30], (c) => `On murmure au village que vous êtes ${selon(c, { freres: 'trop proches pour des frères et sœurs, que l’un fera tomber l’autre', defaut: 'plus que des partenaires de mission' })}. Les rumeurs vont vite. Un chef de mission commence à vous séparer sur les assignations.`, [
    ['ignorer', 'Ignorer les rumeurs', 'partir'],
    ['dementir', 'Démentir, publiquement', 'parler'],
    ['assumer', 'Assumer : demander à rester ensemble', 'agir'],
  ], [
    ['assumer+assumer', 'Vous demandez à rester binôme, devant le chef, sans vous justifier. Il cède. Les rumeurs redoublent. Vous vous en moquez.', { l: { loyaute: 6, dependance: 4 }, a: 4 }],
    ['dementir+assumer', '{un} dément ; {deux} demande à rester ensemble. Le même jour. Le village ne sait plus quoi penser. Vous non plus.', { l: { mefiance: 3, peur_de_perdre: 3 } }],
    ['defaut', 'Les rumeurs passent. Les assignations, elles, restent séparées pendant un an.', { l: { peur_de_perdre: 4 }, a: -2 }],
  ]),
  scene('mc_mission_s', 'La mission de rang S', [22, 32], 'Une mission de rang S : assassiner un daimyō qui prépare une guerre. Il faut deux jōnin. On vous a choisis. Le daimyō a une fille de six ans, qui dort dans la chambre voisine.', [
    ['executer', 'Exécuter la mission, proprement', 'agir'],
    ['avorter', 'Avorter la mission', 'partir'],
    ['menacer', 'Le menacer plutôt que le tuer', 'parler'],
  ], [
    ['menacer+menacer', 'Un kunai sur la gorge, une phrase à l’oreille. Le daimyō renonce à la guerre. Le conseil est furieux de votre désobéissance, et ravi du résultat.', { l: { respect: 8, confiance: 4 }, a: 4, s: ['Le daimyō épargné, la fille endormie à côté.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 3 }] }],
    ['executer+executer', 'C’est fait, sans un bruit. La fille ne s’est pas réveillée. Vous ne dormez pas pendant une semaine.', { l: { dependance: 6 }, s: ['La mission de rang S, et la fille qui ne s’est pas réveillée.', 5, 'tragique'], fx: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'jauges.ryo', delta: 80 }] }],
    ['executer+avorter', '{un} lève sa lame ; {deux} lui attrape le poignet. Une seconde, vous vous battez en silence au-dessus du lit. Puis {un} lâche. La mission est un échec. Le daimyō est vivant. Vous ne vous parlez plus pendant un mois.', { un: { ressentiment: 8 }, deux: { mefiance: 6 }, s: ['Le poignet attrapé au-dessus du lit.', 5, 'amer'], fx: [{ stat: 'social.reputation', delta: -3 }] }],
    ['defaut', 'La mission dérape. Vous rentrez sans avoir rien fait, et sans pouvoir l’expliquer.', { l: { mefiance: 3 }, fx: [{ stat: 'social.reputation', delta: -2 }] }],
  ]),
  scene('mc_dette_vie', 'Le pont', [20, 32], 'Un pont qui s’effondre, une mission qui tourne mal. L’un de vous est suspendu au-dessus du vide, une main dans celle de l’autre. Les ennemis arrivent. Il n’y a pas le temps pour deux.', [
    ['tirer', 'Tirer, quoi qu’il arrive', 'proteger'],
    ['lacher', 'Lui dire de te lâcher', 'parler'],
    ['combattre', 'Le remonter et combattre', 'agir'],
  ], [
    ['tirer+lacher', '« Lâche-moi. » « Non. » Il remonte, et vous vous battez à deux sur ce qui reste du pont.', { l: { dette: 6, peur_de_perdre: 8 }, a: 4, s: ['« Lâche-moi. » « Non. »', 5, 'tragique'], combat: 'combat_frontiere' }],
    ['tirer+tirer', 'Vous remontez ensemble, à la seconde où les premiers kunai arrivent.', { l: { confiance: 6 }, a: 4, combat: 'combat_frontiere' }],
    ['defaut', 'Remonté de justesse, et déjà il faut se battre.', { l: { dette: 4 }, combat: 'combat_frontiere' }],
  ]),
  scene('mc_ancien_sensei', 'Le vieux sensei', [22, 32], 'Votre ancien sensei a perdu la raison. Il vous appelle par les prénoms de son équipe morte. Il ne vous reconnaît plus, sauf quand vous êtes ensemble.', [
    ['jouer', 'Jouer le rôle qu’il vous donne', 'proteger'],
    ['verite', 'Lui rappeler qui vous êtes', 'parler'],
    ['visiter', 'Venir chaque semaine, quoi qu’il dise', 'observer'],
  ], [
    ['jouer+jouer', 'Vous devenez, pour lui, les amis qu’il a perdus. Il rit, il les engueule, il leur pardonne. La dernière fois, il dit : « Vous avez bien grandi. » Il meurt la semaine suivante.', { l: { confiance: 6, peur_de_perdre: 6 }, a: 3, s: ['Le sensei qui vous prenait pour son équipe morte.', 5, 'tragique'] }],
    ['visiter+visiter', 'Chaque semaine, ensemble. Il ne vous reconnaît jamais. Mais il vous attend.', { l: { loyaute: 6 }, a: 3, s: ['Les visites au vieux sensei.', 4, 'tragique'] }],
    ['defaut', 'Il meurt sans vous avoir reconnus. Vous étiez là tous les deux.', { l: { peur_de_perdre: 4 } }],
  ]),
  scene('mc_trahison_tiers', 'Rin', [20, 30], 'Rin, la troisième de votre équipe de genin, est accusée de trahison. Les preuves sont minces. Le conseil veut un exemple. On vous demande de témoigner.', [
    ['defendre', 'La défendre', 'proteger'],
    ['verite', 'Dire seulement ce que tu sais', 'observer'],
    ['charger', 'Témoigner contre elle', 'agir'],
  ], [
    ['defendre+defendre', 'Deux jōnin qui défendent la même accusée : le conseil recule. Rin est libérée. Elle quitte le village le mois suivant, sans un mot. Elle vous laisse une lettre : « Merci. Ne me cherchez pas. »', { l: { loyaute: 6, respect: 4 }, a: 3, s: ['La lettre de Rin : « Ne me cherchez pas. »', 4, 'amer'], fx: [{ stat: 'social.loyaute', delta: -2 }] }],
    ['charger+defendre', '{un} charge Rin ; {deux} la défend. Le conseil tranche pour {un}. Rin est exilée. {deux} regarde {un} comme on regarde un inconnu.', { deux: { mefiance: 10, ressentiment: 6 }, s: ['Le témoignage contre Rin.', 5, 'amer'] }],
    ['defaut', 'Vos deux témoignages ne suffisent ni à la condamner ni à la sauver. Le dossier reste ouvert. Rin attend.', { l: { mefiance: 2 } }],
  ]),
  scene('mc_kage_vieux', 'Le Kage vieillit', [24, 34], 'Le {kage} vous convoque tous les deux, ensemble, sans témoin. Il tousse, longuement. « Je cherche un successeur. Je vous observe depuis longtemps. Tous les deux. »', [
    ['vouloir', 'Dire que tu le veux', 'agir'],
    ['proposer', 'Proposer l’autre', 'proteger'],
    ['refuser', 'Dire que ni l’un ni l’autre n’en veut', 'partir'],
  ], [
    ['vouloir+vouloir', 'Le {kage} sourit. « Bien. Alors il faudra que l’un de vous soit meilleur que l’autre. » Il vient de faire de vous des rivaux pour de bon.', { l: { rivalite: 10, mefiance: 4 }, a: 2, s: ['Le jour où le {kage} a fait de vous des rivaux.', 5, 'amer'], promesse: ['candidats_kage', 'Rester loyaux l’un envers l’autre, quel que soit celui que le {kage} choisira.'] }],
    ['proposer+proposer', 'Chacun propose l’autre. Le {kage} rit tellement qu’il manque s’étouffer. « Alors ce sera celui qui cédera le dernier. »', { l: { loyaute: 8, respect: 4 }, a: 3 }],
    ['vouloir+proposer', '{un} le veut. {deux} propose {un}. Le {kage} regarde longtemps {deux}, et note quelque chose. {un} n’a pas vu le regard.', { un: { dette: 4 }, deux: { respect: 2 }, apres: (c, un) => fait(c, { id: 'kage_regard', texte: 'Le Kage a remarqué que l’autre s’effaçait pour toi.', connus: ['kage'], preuves: 0, cible: un }) }],
    ['defaut', 'Le {kage} hoche la tête, et vous renvoie. La succession est ouverte.', { l: { rivalite: 4 } }],
  ], { si: (c) => memeVillage(c) && !arc('kage', 0.6)(c) }),
  scene('mc_nuit_alcool', 'La nuit du saké', [20, 32], 'Une taverne, trop de saké, une nuit de permission. L’un de vous, ivre, commence à dire une chose qu’il n’a jamais dite.', [
    ['ecouter', 'Écouter jusqu’au bout', 'observer'],
    ['arreter', 'L’arrêter avant qu’il ne regrette', 'proteger'],
    ['repondre', 'Dire ta propre vérité en retour', 'parler'],
  ], [
    ['repondre+repondre', 'Deux vérités, à la même table, dans la même nuit. Le lendemain, vous faites semblant de ne pas vous souvenir. Vous vous souvenez de chaque mot.', { l: { confiance: 10 }, a: 3, s: ['La nuit du saké, et les deux vérités.', 5, 'chaud'] }],
    ['arreter+*', '« Tu le regretteras demain. » La phrase reste en suspens, inachevée. Elle le restera des années.', { l: { peur_de_perdre: 4, confiance: 2 } }],
    ['defaut', 'La vérité sort, maladroite et entière. L’autre l’écoute, et ne la rendra jamais.', { l: { confiance: 6 } }],
  ]),
  scene('mc_examen_juges', 'Les juges', [24, 34], 'Vous êtes juges à l’examen chūnin. Deux candidats s’affrontent, et ils vous ressemblent terriblement : deux enfants, liés depuis toujours, qui se battent pour une seule place.', [
    ['arreter', 'Arrêter le combat : les deux passent', 'proteger'],
    ['laisser', 'Laisser le combat aller au bout', 'observer'],
    ['parler', 'Leur raconter votre histoire, après', 'parler'],
  ], [
    ['parler+parler', 'Vous leur racontez, le soir, ce que vous auriez voulu entendre. Ils écoutent, sans y croire. Dans vingt ans, ils comprendront.', { l: { confiance: 4, loyaute: 4 }, a: 3, s: ['Les deux candidats, à qui vous avez raconté votre histoire.', 4, 'chaud'] }],
    ['arreter+arreter', 'Vous arrêtez le combat, et vous passez les deux candidats. Le jury proteste. Vous êtes deux jōnin, et vous ne cédez pas.', { l: { respect: 4 }, a: 3, fx: [{ stat: 'social.reputation', delta: -1 }] }],
    ['defaut', 'Le combat va au bout. Un seul passe. L’autre pleure dans les coulisses. Vous vous regardez par-dessus la foule.', { l: { peur_de_perdre: 3 } }],
  ]),
  scene('mc_duel_public', 'Le duel devant le village', [20, 32], 'Une dispute sur une mission ratée a tourné au défi public. Le village attend. On ne recule pas devant tout le monde.', [
    ['honneur', 'Se battre, à la loyale', 'agir'],
    ['refuser', 'Refuser, et assumer la honte', 'partir'],
    ['parler', 'Transformer ça en entraînement', 'parler'],
  ], [
    ['honneur+honneur', 'Le village se tait quand vous vous mettez en garde.', { l: { rivalite: 6, respect: 4 }, combat: 'duel_honneur' }],
    ['parler+parler', 'Vous transformez le défi en démonstration, et le village applaudit sans savoir qu’il a failli voir un vrai combat.', { l: { confiance: 4 }, a: 3, combat: 'duel_entrainement' }],
    ['refuser+refuser', 'Vous refusez tous les deux, au même moment. Le village siffle. Ce soir-là, vous buvez ensemble, et vous riez de la honte.', { l: { confiance: 6 }, a: 2, fx: [{ stat: 'social.reputation', delta: -2 }] }],
    ['defaut', 'L’un refuse, l’autre insiste. Le combat a lieu quand même.', { l: { ressentiment: 3 }, combat: 'duel_honneur' }],
  ]),
  scene('mc_poison', 'Le poison', [20, 34], 'Une lame empoisonnée. L’un de vous a trois jours à vivre. Un antidote existe, dans le coffre d’un marchand de la frontière, qui ne le vend pas.', [
    ['voler', 'Voler l’antidote', 'agir'],
    ['payer', 'Tout vendre pour le payer', 'proteger'],
    ['rester', 'Rester à son chevet', 'observer'],
  ], [
    ['voler+*', 'L’un part dans la nuit. Il revient le troisième jour, l’antidote à la main, et une prime sur sa tête. Ça vaut le coup.', { l: { dette: 10, loyaute: 6 }, a: 4, s: ['L’antidote volé, le troisième jour.', 5, 'tragique'], apres: (c) => fait(c, { id: 'antidote_vole', texte: 'L’antidote du marchand de la frontière a été volé par un ninja.', connus: [0, 1], preuves: 2 }) }],
    ['payer+payer', 'Vous vendez tout ce que vous avez. Le marchand cède. Vous êtes pauvres, et vivants.', { l: { loyaute: 6 }, a: 3, fx: [{ stat: 'jauges.ryo', delta: -60 }] }],
    ['defaut', 'La fièvre monte, puis descend. Le corps résiste. Vous avez eu de la chance. Vous savez que ça ne durera pas.', { l: { peur_de_perdre: 8 }, fx: [{ blessure: { id: 'poison', nom: 'Séquelles du poison', gravite: 2, jours: 40 } }] }],
  ]),
  scene('mc_lettre_ennemi', 'La lettre de l’autre camp', [20, 32], 'Un messager de l’autre village vous apporte une lettre, adressée à vous deux. Elle est signée par le fils d’un homme que vous avez tué en mission, il y a longtemps. « Je sais qui vous êtes. »', [
    ['repondre', 'Lui répondre', 'parler'],
    ['bruler', 'Brûler la lettre', 'partir'],
    ['preparer', 'Se préparer à sa venue', 'observer'],
  ], [
    ['repondre+repondre', 'Vous lui écrivez la vérité : la mission, l’ordre, la nuit. Il ne répond pas. Un an plus tard, il est là. Il veut savoir lequel des deux.', { l: { confiance: 4 }, a: 3, combat: 'combat_vengeur' }],
    ['preparer+preparer', 'Vous l’attendez. Il vient, au jour dit, avec une lame et dix ans de haine.', { l: { confiance: 3 }, a: 5, combat: 'combat_vengeur' }],
    ['defaut', 'La lettre brûle. Il viendra quand même.', { combat: 'combat_vengeur' }],
  ], { si: (c) => !arc('dette', 0.5)(c) }),
  scene('mc_kage_choix', 'Le choix du Kage', [26, 36], 'Le {kage} a choisi. Il annoncera son successeur demain, devant le village. Ce soir, il vous fait venir, l’un après l’autre, et à chacun il dit la même chose : « Si l’autre l’emporte, le suivras-tu ? »', [
    ['oui', 'Oui', 'proteger'],
    ['non', 'Non', 'partir'],
    ['condition', 'Oui, s’il reste celui que je connais', 'parler'],
  ], [
    ['oui+oui', 'Deux « oui » sans hésitation. Le {kage} ferme les yeux. « Alors peu importe lequel. » Le lendemain, un nom est appelé, et l’autre est le premier à s’incliner.', { l: { loyaute: 10 }, a: 4, s: ['Les deux « oui » au {kage}.', 5, 'fier'], fxUn: [{ stat: 'social.reputation', delta: 6 }] }],
    ['non+oui', '{un} a dit non. {deux} a dit oui. Le {kage} choisit {deux}. {un} ne saura jamais si c’est à cause de sa réponse.', { un: { jalousie: 8, ressentiment: 6 }, deux: { peur_de_perdre: 4 }, fxDeux: [{ stat: 'social.reputation', delta: 6 }] }],
    ['defaut', 'Le {kage} vous congédie sans rien dire. Le lendemain, un nom est appelé. Il fallait bien que ce soit l’un des deux.', { l: { rivalite: 6 }, fxUn: [{ stat: 'social.reputation', delta: 5 }] }],
  ], { si: (c) => memeVillage(c) && rangDe(c, 0) >= 3 && rangDe(c, 1) >= 3 && !arc('kage', 0.6)(c) }),
  scene('mc_paix_villages', 'La conférence', [24, 36], 'Une conférence de paix entre les villages. Vous êtes là tous les deux, comme gardes du corps de deux délégués différents. Et quelqu’un, dans la salle, prépare un attentat.', [
    ['alerter', 'Alerter les deux délégations', 'parler'],
    ['traquer', 'Traquer l’assassin à deux, en secret', 'agir'],
    ['proteger', 'Protéger ton seul délégué', 'proteger'],
  ], [
    ['traquer+traquer', 'Vous le trouvez dans les cuisines, et il n’est pas seul.', { l: { confiance: 6, respect: 4 }, a: 5, combat: 'combat_traite' }],
    ['alerter+alerter', 'Les deux délégations sont alertées en même temps, par deux gardes qui ne se parlaient pas une seconde avant. L’attentat échoue. Le traité est signé. Vous n’êtes nommés nulle part.', { l: { confiance: 6 }, a: 3, s: ['La conférence de paix, sauvée sans que personne le sache.', 4, 'fier'] }],
    ['defaut', 'L’attentat échoue de peu. Les délégations s’accusent l’une l’autre. Le traité attendra.', { l: { mefiance: 3 } }],
  ], { si: (c) => !memeVillage(c) && !arc('traite', 0.7)(c) }),

  // ── Vétérans ──
  scene('mc_cicatrices', 'Les cicatrices', [30, 42], 'Un soir, aux sources chaudes, vous comptez vos cicatrices. Celle-ci, c’était l’un. Celle-là, c’était l’autre. Il y en a beaucoup que vous vous êtes faites ensemble.', [
    ['raconter', 'Raconter chacune', 'parler'],
    ['taire', 'Ne pas en parler', 'observer'],
    ['montrer', 'Montrer celle que l’autre ne connaît pas', 'proteger'],
  ], [
    ['montrer+montrer', 'Chacun a une cicatrice que l’autre n’avait jamais vue. Chacun raconte. Ce sont deux histoires où l’on s’est battu pour protéger l’autre, sans le lui dire.', { l: { confiance: 8, dette: 4 }, a: 3, s: ['Les deux cicatrices cachées, montrées aux sources chaudes.', 5, 'chaud'] }],
    ['raconter+raconter', 'Toute la nuit, les cicatrices une à une. Il y a de quoi faire un livre. Il y a de quoi pleurer, aussi, et vous ne le faites pas.', { l: { confiance: 6 }, a: 2 }],
    ['defaut', 'Vous les regardez sans rien dire. Elles parlent toutes seules.', { l: { confiance: 3 } }],
  ]),
  scene('mc_enfants', 'Vos enfants', [30, 42], 'Vos enfants, ou vos élèves, ceux qui vous ressemblent, se sont battus à l’Académie. Ils ne se parlent plus. Ils ont l’âge que vous aviez quand tout a commencé.', [
    ['separer', 'Les tenir à l’écart l’un de l’autre', 'partir'],
    ['raconter', 'Leur raconter votre histoire', 'parler'],
    ['laisser', 'Les laisser faire, comme on vous a laissés', 'observer'],
  ], [
    ['raconter+raconter', 'Vous leur racontez tout, à deux voix. Ils écoutent, sans comprendre. Mais le lendemain, ils se reparlent.', { l: { confiance: 4, loyaute: 4 }, a: 2, s: ['Votre histoire racontée aux enfants, à deux voix.', 4, 'chaud'] }],
    ['laisser+laisser', 'Vous les laissez. Ils se disputeront pendant vingt ans, comme vous. Vous en souriez en secret.', { l: { confiance: 4 }, a: 2 }],
    ['defaut', 'Vous n’êtes pas d’accord sur ce qu’il faut faire. Vos enfants vous regardent vous disputer, et comprennent mieux qu’avant.', { l: { rivalite: 3 } }],
  ]),
  scene('mc_vieux_rival', 'Kazuma', [30, 45], 'Kazuma, le prodige qui vous narguait à vingt ans, est revenu. Il a perdu un bras, et sa fierté. Il vous demande du travail.', [
    ['aider', 'L’aider', 'proteger'],
    ['refuser', 'Refuser : il ne l’a jamais mérité', 'partir'],
    ['defier', 'Lui proposer un dernier défi, pour l’honneur', 'agir'],
  ], [
    ['aider+aider', 'Vous lui trouvez une place d’instructeur. Il devient le meilleur que l’Académie ait eu. Il ne vous remercie jamais. Il vous salue, chaque matin.', { l: { respect: 6 }, a: 2, s: ['Kazuma, devenu instructeur, qui vous salue chaque matin.', 3, 'chaud'] }],
    ['defier+defier', 'Un combat à un bras contre deux binômes vieillissants. Personne ne gagne. Tout le monde rit, à la fin. C’est la première fois que vous voyez Kazuma rire.', { l: { confiance: 4 }, a: 3 }],
    ['defaut', 'Kazuma repart. Vous apprendrez plus tard qu’il est mort l’hiver suivant, seul. Vous ne saurez pas quoi en penser.', { l: { peur_de_perdre: 2 } }],
  ]),
  scene('mc_fatigue', 'La fatigue', [32, 45], 'Un soir, l’un de vous dit : « Je n’en peux plus. Je veux arrêter. Les missions, le sang, tout. » Il n’a jamais dit ça.', [
    ['soutenir', 'Lui dire d’arrêter', 'proteger'],
    ['retenir', 'Lui dire que tu as besoin de lui', 'parler'],
    ['partir', 'Proposer d’arrêter ensemble', 'partir'],
  ], [
    ['partir+partir', 'Vous rendez vos gilets le même jour. Le {kage} soupire. Le village s’en remettra. Vous, vous découvrez ce qu’est un matin sans mission.', { l: { loyaute: 6, confiance: 6 }, a: 2, s: ['Les deux gilets rendus le même jour.', 5, 'chaud'] }],
    ['retenir+*', '« J’ai besoin de toi. » Il reste. Il ne vous le reprochera pas. Il ne vous remerciera pas non plus.', { l: { dependance: 8, peur_de_perdre: 4 } }],
    ['defaut', 'Il arrête. Vous continuez seul. Les missions sont plus longues, désormais.', { l: { peur_de_perdre: 4 } }],
  ]),
  scene('mc_tombe_commune', 'La tombe de l’équipe', [32, 45], 'Il ne reste que vous deux de votre promotion. Les autres sont sous les pierres du cimetière. Un matin, vous vous y retrouvez par hasard, chacun avec des fleurs.', [
    ['partager', 'Partager les fleurs entre toutes les tombes', 'proteger'],
    ['parler', 'Parler aux morts, à voix haute', 'parler'],
    ['silence', 'Rester en silence', 'observer'],
  ], [
    ['parler+parler', 'Vous leur racontez les vingt dernières années. Vous riez de ce qu’ils auraient dit. Le gardien du cimetière vous regarde comme deux fous. Vous l’êtes un peu.', { l: { confiance: 6, peur_de_perdre: 6 }, a: 2, s: ['Le matin au cimetière, à parler aux morts.', 5, 'tragique'] }],
    ['silence+silence', 'Vous restez là jusqu’à midi, sans rien dire. En partant, l’un dit : « Le dernier des deux viendra seul. » L’autre ne répond pas.', { l: { peur_de_perdre: 8 }, s: ['« Le dernier des deux viendra seul. »', 5, 'tragique'] }],
    ['defaut', 'Les fleurs sont posées. Vous repartez ensemble. Vous êtes les derniers.', { l: { loyaute: 4 } }],
  ]),

  // ── Anciens ──
  scene('mc_partie_go', 'La partie de go', [45], 'Une partie de go, chaque soir, depuis des années, sous le même cerisier. Ce soir, l’un de vous est sur le point de gagner pour la première fois depuis très longtemps.', [
    ['gagner', 'Gagner', 'agir'],
    ['perdre', 'Faire exprès de perdre', 'proteger'],
    ['nulle', 'Proposer la nulle', 'parler'],
  ], [
    ['gagner+gagner', 'Une partie féroce, jusqu’à minuit. Vous avez soixante ans à vous deux de plus que lorsque vous avez commencé, et vous jouez comme des enfants.', { l: { rivalite: 4, confiance: 4 }, a: 2, s: ['La partie de go jusqu’à minuit.', 4, 'chaud'] }],
    ['perdre+perdre', 'Vous faites exprès de perdre tous les deux, et la partie n’en finit pas. Vous comprenez au même moment. Vous riez si fort que les voisins sortent.', { l: { confiance: 6 }, a: 2, s: ['La partie de go que personne ne voulait gagner.', 5, 'chaud'] }],
    ['defaut', 'Quelqu’un gagne. Demain, ce sera l’autre. Il y aura demain.', { l: { confiance: 3 } }],
  ]),
  scene('mc_memoires', 'Les mémoires', [45], 'Un jeune archiviste vient recueillir votre histoire pour les annales du village. Il vous interroge séparément. Vos deux versions ne concordent pas toujours.', [
    ['verite', 'Dire toute la vérité', 'parler'],
    ['embellir', 'Embellir le rôle de l’autre', 'proteger'],
    ['soi', 'Embellir le tien', 'agir'],
  ], [
    ['embellir+embellir', 'L’archiviste repart avec deux histoires où chacun est le héros de l’autre. Il n’arrive pas à les réconcilier. Il les publie toutes les deux.', { l: { confiance: 6, loyaute: 4 }, a: 2, s: ['Les deux versions, chacune à la gloire de l’autre.', 5, 'chaud'] }],
    ['verite+verite', 'Les deux versions concordent sur tout, même sur ce qu’on aurait préféré taire. L’archiviste est bouleversé.', { l: { respect: 6 }, a: 2 }],
    ['defaut', 'L’archiviste note tout, les contradictions comprises. Dans cent ans, quelqu’un s’amusera de vos mensonges.', { l: { rivalite: 2 } }],
  ]),
  scene('mc_dernier_entrainement', 'Le dernier entraînement', [45], 'Le terrain où vous vous êtes entraînés à dix ans est toujours là. Les entailles dans l’écorce aussi. Un matin, l’un de vous propose : « Une dernière fois ? »', [
    ['oui', 'Oui', 'agir'],
    ['regarder', 'Regarder les jeunes s’entraîner plutôt', 'observer'],
    ['marcher', 'Marcher jusqu’à l’arbre, et toucher les entailles', 'proteger'],
  ], [
    ['oui+oui', 'Une dernière fois.', { l: { respect: 4, confiance: 4 }, a: 2, combat: 'duel_entrainement' }],
    ['marcher+marcher', 'Vos mains sur les entailles, côte à côte. Il y a cinquante ans, vous montiez jusque là-haut. Vous ne pourriez plus. Ça vous est égal.', { l: { confiance: 6 }, a: 2, s: ['Les mains sur les entailles de l’enfance.', 5, 'chaud'] }],
    ['defaut', 'Vous regardez les jeunes. Ils sont maladroits, féroces, magnifiques. Vous vous reconnaissez dans deux d’entre eux.', { l: { confiance: 3 } }],
  ]),
  scene('mc_maladie_vieux', 'La toux', [45], 'L’un de vous tousse depuis l’hiver. Les médecins ne disent rien, ce qui veut tout dire.', [
    ['rester', 'Ne plus le quitter', 'proteger'],
    ['voyage', 'Proposer un dernier voyage', 'agir'],
    ['normal', 'Faire comme si de rien n’était', 'observer'],
  ], [
    ['voyage+voyage', 'Un dernier voyage, jusqu’à la mer que vous n’avez jamais vue en temps de paix. Vous la regardez longtemps, assis sur la plage. Elle est très bleue.', { l: { confiance: 6, peur_de_perdre: 6 }, a: 2, s: ['La mer, vue en temps de paix, à la fin.', 5, 'chaud'] }],
    ['normal+normal', 'Les parties de go continuent. Les disputes aussi. Vous refusez, tous les deux, que ça change. C’est la plus grande preuve d’amour que vous ayez trouvée.', { l: { confiance: 6 }, a: 2 }],
    ['defaut', 'L’hiver passe. La toux reste. Vous comptez les printemps, maintenant.', { l: { peur_de_perdre: 8 } }],
  ]),
  scene('mc_heritage', 'L’héritage', [45], 'Il faut décider à qui transmettre ce que vous avez : techniques, rouleaux, secrets. Vous avez chacun un successeur en tête. Ce n’est pas le même.', [
    ['mien', 'Défendre ton choix', 'agir'],
    ['sien', 'Te ranger à son choix', 'proteger'],
    ['deux', 'Transmettre à deux, comme vous', 'parler'],
  ], [
    ['deux+deux', 'Deux successeurs, qui se détestent un peu, et qui s’entraîneront ensemble. Vous savez exactement ce que vous faites.', { l: { confiance: 6, loyaute: 4 }, a: 2, s: ['L’héritage transmis à deux.', 5, 'chaud'] }],
    ['sien+sien', 'Chacun se range au choix de l’autre, et vous voilà avec le même problème qu’avant, inversé. Vous riez, et vous tirez au sort.', { l: { confiance: 4 }, a: 2 }],
    ['defaut', 'Vous vous disputez jusqu’au bout. C’est votre dernière vraie dispute. Elle est bonne.', { l: { rivalite: 3 } }],
  ]),
  scene('mc_aveu_tardif', 'L’aveu', [45], 'Un soir, très tard, l’un de vous dit : « Il y a une chose que je ne t’ai jamais dite. » L’autre pose sa tasse.', [
    ['ecouter', 'Écouter', 'observer'],
    ['avouer', 'En avouer une aussi', 'parler'],
    ['taire', 'Lui dire de garder son secret', 'proteger'],
  ], [
    ['avouer+avouer', 'Deux secrets, gardés quarante ans. Ils se ressemblent : chacun a, un jour, choisi l’autre plutôt que soi, sans le dire. Vous restez là jusqu’à l’aube.', { l: { confiance: 10, loyaute: 6 }, a: 3, s: ['Les deux secrets de quarante ans.', 5, 'chaud'], apres: (c) => { for (const f of c.faits) if (f.connus.includes(0) || f.connus.includes(1)) { if (!f.connus.includes(0)) f.connus.push(0); if (!f.connus.includes(1)) f.connus.push(1); } } }],
    ['taire+*', '« Garde-le. Il est à toi. » Le secret reste là, entre vous, comme un objet précieux qu’on ne touche pas.', { l: { confiance: 4, peur_de_perdre: 4 } }],
    ['defaut', 'Le secret est dit. Il n’est pas si terrible, après tant d’années. Mais il fallait qu’il sorte.', { l: { confiance: 6 }, apres: (c) => souvenir(c, 'aveu_tardif', 'L’aveu, très tard, autour d’une tasse.', 4, 'chaud') }],
  ]),
  scene('mc_dernier_conseil', 'Le conseil des anciens', [45], 'Le conseil du village vous convoque comme anciens : une guerre se prépare, et on veut votre avis. Vous n’êtes pas d’accord sur ce qu’il faut dire.', [
    ['paix', 'Plaider pour la paix, à tout prix', 'parler'],
    ['guerre', 'Plaider pour frapper le premier', 'agir'],
    ['silence', 'Dire que ce n’est plus votre guerre', 'partir'],
  ], [
    ['paix+paix', 'Deux anciens qui ont tout vu, et qui disent non. Le conseil hésite, puis renonce. Personne ne saura jamais combien de vies vous avez sauvées ce jour-là.', { l: { respect: 6 }, a: 2, s: ['Le conseil où vous avez dit non à la guerre.', 5, 'fier'], fx: [{ stat: 'social.reputation', delta: 4 }] }],
    ['guerre+paix', '{un} plaide pour la guerre, {deux} pour la paix. Le conseil vous regarde vous déchirer, vieux, devant tout le monde. Il ne retiendra que ça.', { l: { rivalite: 6, ressentiment: 4 } }],
    ['defaut', 'Le conseil écoute poliment, et décide sans vous. Vous êtes vieux. Vous êtes ensemble. Ça suffit.', { l: { confiance: 3 } }],
  ]),
  scene('mc_cerisier', 'Le cerisier', [50], 'Le cerisier de votre enfance va être abattu, pour construire un nouveau quartier. Vous êtes trop vieux pour l’empêcher. Ou peut-être pas.', [
    ['empecher', 'S’asseoir devant, et ne pas bouger', 'agir'],
    ['bouture', 'Prendre une bouture, et la replanter ailleurs', 'proteger'],
    ['adieu', 'Lui dire adieu', 'observer'],
  ], [
    ['empecher+empecher', 'Deux vieux ninjas assis devant un arbre. Personne n’ose les déloger. Le quartier est construit autour. Le cerisier est toujours là.', { l: { loyaute: 6, confiance: 4 }, a: 2, s: ['Le cerisier sauvé par deux vieux assis devant.', 5, 'fier'] }],
    ['bouture+bouture', 'Deux boutures, plantées devant vos deux maisons. Elles fleuriront après vous.', { l: { confiance: 6 }, a: 2, s: ['Les deux boutures du cerisier.', 5, 'chaud'] }],
    ['defaut', 'L’arbre tombe. Vous regardez. Vous avez vu tomber tant de choses.', { l: { peur_de_perdre: 4 } }],
  ]),
  scene('mc_lettre_fin', 'La lettre pour après', [50], 'Chacun écrit, sans le dire à l’autre, une lettre à ouvrir « après ». Les deux lettres sont cachées au même endroit, sans que vous le sachiez.', [
    ['ecrire', 'Écrire tout ce que tu n’as jamais dit', 'parler'],
    ['court', 'Écrire une seule phrase', 'observer'],
    ['rien', 'Ne rien écrire : l’autre sait', 'proteger'],
  ], [
    ['court+court', 'Les deux lettres ne contiennent qu’une phrase. C’est la même.', { l: { confiance: 8 }, a: 2, s: ['Les deux lettres d’une seule phrase, la même.', 5, 'chaud'] }],
    ['ecrire+ecrire', 'Deux lettres très longues, cachées sous la même latte. Celui qui restera les lira toutes les deux.', { l: { confiance: 6, peur_de_perdre: 4 }, a: 2 }],
    ['defaut', 'Une lettre, et un silence. Les deux disent la même chose.', { l: { confiance: 4 } }],
  ]),
]);
