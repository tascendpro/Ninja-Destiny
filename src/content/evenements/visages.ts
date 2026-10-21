import type { ChoiceDef, Condition, EventDef, Texte } from '../../engine/types';

/**
 * Les visages tirés à chaque partie ont l'histoire de leur clan : le chien d'un Inuzuka, le sceau d'un Hyūga,
 * les insectes d'un Aburame. Ces scènes ne parlent que par jetons ({@coequipierA}, {il:@rival}…) :
 * elles restent justes quel que soit le prénom, le clan ou le genre tiré.
 */
const ACTIF: Condition = { statut: 'actif' };
const AMI: Condition = { pnj: '@coequipierA', etat: ['vivant', 'blesse'] };
const B: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };
const RIVAL: Condition = { pnj: '@rival', etat: ['vivant', 'blesse'] };

/** Une scène du clan de ton ami·e : elle ne vient que si le clan tiré correspond. */
function ami(clan: string, titre: string, lieu: string, texte: Texte, choix: ChoiceDef[], ages: [number, number] = [8, 14]): EventDef {
  return {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: `vis_ami_${clan}`,
    titre,
    categorie: 'amitie',
    lieu,
    poids: 8,
    personnages: ['@coequipierA'],
    si: { tout: [ACTIF, AMI, { age: { min: ages[0], max: ages[1] } }, { clanPnj: '@coequipierA', clan }] },
    texte,
    choix,
  };
}

export const VISAGES: EventDef[] = [
  ami('inuzuka', 'Le chiot de {@coequipierA}', '$village', '{@coequipierA} débarque chez toi à l’aube, un chiot gris dans les bras, les yeux brillants. « Le clan me l’a donné hier. Il ne m’obéit pas. Il ne fait que me mordre les doigts. Tu m’aides à lui trouver un nom ? »', [
    { id: 'nom', texte: 'Lui trouver un nom ensemble', effets: [{ relation: '@coequipierA', delta: { amitie: 7, attachement: 4 } }, { eveillerPnj: '@coequipierA', maitrise: 'ninken_lien' }], resultat: 'Vous passez la matinée à essayer des noms. Le chiot ne réagit à aucun, puis éternue quand tu prononces le dernier. C’est décidé. Dix ans plus tard, il te reconnaîtra encore à l’odeur, à cent pas.' },
    { id: 'dresser', texte: 'Lui montrer comment se faire obéir sans crier', effets: [{ relation: '@coequipierA', delta: { respect: 6 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { eveillerPnj: '@coequipierA', maitrise: 'ninken_lien' }], resultat: 'Tu t’assieds par terre et tu attends. Le chiot finit par venir te renifler. {@coequipierA} t’imite. Au soir, le chiot dort sur ses genoux. « Comment tu savais ? » Tu ne savais pas. Tu as juste été patient·e.' },
  ]),
  ami('hyuga', 'Le front de {@coequipierA}', '$terrain', '{@coequipierA} porte toujours un bandeau serré très bas sur le front, même pour dormir. Aujourd’hui, à l’entraînement, il a glissé. Dessous, un sceau vert, tracé sur la peau. {@coequipierA} le recouvre aussitôt, les mains tremblantes.', [
    { id: 'taire', texte: 'Faire comme si tu n’avais rien vu', effets: [{ relation: '@coequipierA', delta: { confiance: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: 'Tu ramasses ton kunai et tu reprends l’exercice. Plus tard, en rentrant, {@coequipierA} dit très bas : « La branche secondaire. On le porte tous. » Puis plus rien. C’est la première fois qu’{il:@coequipierA} en parle à quelqu’un.' },
    { id: 'demander', texte: 'Lui demander ce que c’est', effets: [{ relation: '@coequipierA', delta: { amitie: 4, confiance: -2 } }, { decouvrir: 'clan:hyuga' }], resultat: '« Un cadeau de famille. Il protège les yeux du clan. Et il protège la branche principale de nous. » {@coequipierA} rit, mais pas avec les yeux. Tu ne regarderas plus jamais un bandeau Hyūga de la même façon.' },
  ]),
  ami('nara', 'Les cerfs de la forêt', 'foret_feu', '{@coequipierA} t’emmène dans la forêt du clan, là où les étrangers n’entrent pas. Des cerfs sortent d’entre les arbres et viennent manger dans sa main. « Je viens ici pour penser. Ici, personne ne me demande de me dépêcher. »', [
    { id: 'shogi', texte: 'Jouer au shōgi sur une souche', effets: [{ stat: 'attributs.intellect', delta: 2 }, { relation: '@coequipierA', delta: { amitie: 5, respect: 4 } }], resultat: '{@coequipierA} te bat en dix coups, en bâillant. Puis en vingt. Puis tu tiens quarante coups, et {il:@coequipierA} se redresse pour la première fois. « Tiens. Tu réfléchis, toi. »' },
    { id: 'ombres', texte: 'Lui demander de te montrer les ombres', effets: [{ relation: '@coequipierA', delta: { confiance: 5 } }, { eveillerPnj: '@coequipierA', maitrise: 'kagemane' }, { stat: 'attributs.perception', delta: 1 }], resultat: 'Son ombre s’étire sur la mousse, lentement, et vient toucher la tienne. Tu ne peux plus bouger un doigt. Puis elle se retire. « C’est fatigant », dit {@coequipierA}, ravi{e:@coequipierA}.' },
  ]),
  ami('yamanaka', 'La boutique de fleurs', '$village', 'La famille de {@coequipierA} tient la boutique de fleurs du village. {@coequipierA} t’explique le sens de chacune : les chrysanthèmes pour les morts, les iris pour le courage, les camélias pour ce qu’on ne dit pas. « On vend surtout des chrysanthèmes, en ce moment. »', [
    { id: 'composer', texte: 'Composer un bouquet pour {parent}', effets: [{ relation: '@coequipierA', delta: { amitie: 6 } }, { relation: '@parent', delta: { attachement: 4 } }, { stat: 'jauges.ryo', delta: -4 }], resultat: '{@coequipierA} t’aide à choisir. Le soir, {parent} regarde le bouquet longtemps, sans savoir quoi dire. Sur la table, il y a un camélia au milieu des iris.' },
    { id: 'esprit', texte: 'Lui demander si c’est vrai qu’on peut entrer dans la tête des gens', effets: [{ relation: '@coequipierA', delta: { confiance: 5 } }, { eveillerPnj: '@coequipierA', maitrise: 'shintenshin' }], resultat: '« Pas encore. Mon père oui. » Un silence. « Il dit que le plus dur, ce n’est pas d’entrer. C’est d’oublier ce qu’on y a vu en sortant. » {@coequipierA} remet une fleur droite dans son vase, très doucement.' },
  ]),
  ami('akimichi', 'Le banquet', '$maison', 'Chez {@coequipierA}, le dîner dure trois heures et nourrirait une escouade. Sa grand-mère remplit ton bol avant même qu’il soit vide. À l’Académie, des élèves se moquent de sa carrure. Ici, personne ne compte les bols.', [
    { id: 'manger', texte: 'Faire honneur au repas', effets: [{ relation: '@coequipierA', delta: { amitie: 7 } }, { stat: 'jauges.fatigue', delta: -15 }, { stat: 'jauges.sante', delta: 5 }], resultat: 'Au cinquième bol, la grand-mère t’adopte officiellement. Au sixième, tu ne peux plus bouger. {@coequipierA} rit si fort que la table tremble. « Maintenant, tu sais pourquoi on est forts. »' },
    { id: 'moqueries', texte: 'Lui parler des moqueries de l’Académie', effets: [{ relation: '@coequipierA', delta: { confiance: 6 } }, { eveillerPnj: '@coequipierA', maitrise: 'baika' }], resultat: '{@coequipierA} pose ses baguettes. « Notre corps est notre technique. Plus on mange, plus on devient grand, au sens propre. Un jour, je serai plus grand qu’eux. » Et pendant une seconde, sa main grossit sous tes yeux.' },
  ]),
  ami('aburame', 'Ce qui vit sous la peau', '$terrain', '{@coequipierA} ne parle presque jamais et porte un col remonté jusqu’aux yeux, même en été. Ce matin, pendant la pause, un insecte noir sort de sa manche, fait le tour de son poignet, et y rentre. Personne d’autre ne l’a vu. {@coequipierA} sait que toi, si.', [
    { id: 'curiosite', texte: 'Lui demander de te les montrer', effets: [{ relation: '@coequipierA', delta: { amitie: 8, confiance: 6 } }, { eveillerPnj: '@coequipierA', maitrise: 'kikaichu' }], resultat: '{@coequipierA} hésite, puis tend la main paume en l’air. Une centaine d’insectes en sortent, dessinent un cercle parfait, et rentrent. « Personne ne demande jamais. Tout le monde recule. » C’est la plus longue phrase qu’{il:@coequipierA} t’ait dite.' },
    { id: 'reculer', texte: 'Reculer d’un pas, malgré toi', effets: [{ relation: '@coequipierA', delta: { confiance: -4 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }], resultat: 'Tu recules. {@coequipierA} remonte son col et s’éloigne. Le lendemain, tu t’assois à côté de {lui:@coequipierA} quand même. Ça ne répare pas tout. Ça répare un peu.' },
  ]),
  ami('uchiha', 'Le quartier des Uchiha', '$village', '{@coequipierA} t’invite chez {lui:@coequipierA}, dans le quartier des Uchiha. Partout, l’éventail rouge et blanc. Des policiers en uniforme te suivent du regard jusqu’à la porte. « Ils regardent tout le monde comme ça. Même nous. »', [
    { id: 'pere', texte: 'Saluer son père, capitaine de la police', effets: [{ relation: '@coequipierA', delta: { respect: 5 } }, { stat: 'attributs.charisme', delta: 1 }, { eveillerPnj: '@coequipierA', maitrise: 'sharingan' }], resultat: 'Il te jauge sans un mot, puis se tourne vers {@coequipierA} : « Ton ami·e a l’air plus éveillé·e que toi. » {@coequipierA} serre les poings. Ce soir-là, tu remarques une lueur rouge dans ses yeux, une seconde, avant qu’{il:@coequipierA} détourne le regard.' },
    { id: 'toits', texte: 'Lui proposer de filer par les toits', effets: [{ relation: '@coequipierA', delta: { amitie: 8 } }, { stat: 'attributs.agilite', delta: 1 }], resultat: 'Vous passez la soirée sur le toit du temple Naka, à regarder le village d’en haut. « Ici, dit {@coequipierA}, personne n’attend rien de moi. » Tu ne sais pas encore à quel point ce toit comptera, un jour.' },
  ]),
  ami('senju', 'Le nom trop lourd', '$village', 'Devant la stèle des fondateurs, {@coequipierA} fixe le nom de son arrière-grand-oncle, le Premier Hokage. « Tout le monde attend que je fasse pousser des arbres. Je n’arrive même pas à faire pousser un radis dans le jardin de ma mère. »', [
    { id: 'rire', texte: 'Lui proposer de commencer par le radis', effets: [{ relation: '@coequipierA', delta: { amitie: 7 } }, { stat: 'attributs.charisme', delta: 1 }], resultat: '{@coequipierA} éclate de rire, pour la première fois depuis des semaines. Vous passez l’après-midi dans le jardin. Le radis pousse. Il est minuscule. Vous le mangez en le partageant en deux, comme un trésor.' },
    { id: 'serieux', texte: 'Lui dire que le nom ne fait pas la personne', effets: [{ relation: '@coequipierA', delta: { confiance: 6 } }, { eveillerPnj: '@coequipierA', maitrise: 'vitalite_senju' }], resultat: '« Facile à dire, pour quelqu’un qui n’a pas de stèle sur le dos. » Mais {@coequipierA} se redresse un peu. Le lendemain, à l’entraînement, {il:@coequipierA} se relève de chaque chute comme si rien ne pouvait {le:@coequipierA} blesser.' },
  ]),
  ami('uzumaki', 'Les derniers tourbillons', '$maison', '{@coequipierA} te montre un vieux coffret laqué, orné d’un tourbillon rouge. Dedans, des parchemins couverts de sceaux que personne au village ne sait plus lire. « C’est tout ce qui reste d’Uzushio. Ma mère dit qu’on était des milliers. Maintenant on est quatre. »', [
    { id: 'dechiffrer', texte: 'Essayer de déchiffrer un sceau ensemble', test: { type: 'competence', difficulte: 46, attributs: { intellect: 2, controleChakra: 1 }, succes: { texte: 'Après des heures, vous comprenez un trait, puis un deuxième. Le sceau s’illumine faiblement sous vos doigts. {@coequipierA} pleure de joie, sans s’en cacher.', effets: [{ relation: '@coequipierA', delta: { amitie: 8, attachement: 5 } }, { stat: 'attributs.intellect', delta: 2 }, { eveillerPnj: '@coequipierA', maitrise: 'fuinjutsu_uzumaki' }] }, echec: { texte: 'Les sceaux restent muets. Mais {@coequipierA} referme le coffret en souriant. « Personne n’avait jamais essayé avec moi. »', effets: [{ relation: '@coequipierA', delta: { amitie: 6 } }] } } },
    { id: 'ecouter', texte: 'Lui demander de raconter Uzushio', effets: [{ relation: '@coequipierA', delta: { confiance: 6 } }, { decouvrir: 'histoire:deuxieme_guerre' }], resultat: 'Une île de tourbillons, des maisons rouges, des sceaux sur chaque porte. Et une nuit où trois villages ont décidé que c’était trop de pouvoir pour un si petit pays. {@coequipierA} raconte comme on récite une prière.' },
  ]),
  ami('hozuki', 'L’eau qui s’échappe', 'cotes_brume', 'Au bord de la mer, {@coequipierA} trempe la main dans l’eau, et sa main devient de l’eau. Elle se reforme une seconde plus tard. « Ça m’arrive quand j’ai peur, ou quand je suis en colère. Mon frère dit qu’un jour je deviendrai une flaque et que personne ne me retrouvera. »', [
    { id: 'jeu', texte: 'En faire un jeu de cache-cache dans les vagues', effets: [{ relation: '@coequipierA', delta: { amitie: 8 } }, { eveillerPnj: '@coequipierA', maitrise: 'hydrification' }, { stat: 'attributs.perception', delta: 1 }], resultat: 'Pendant tout l’après-midi, {@coequipierA} disparaît dans les vagues et réapparaît derrière toi en riant. Tu ne {le:@coequipierA} trouves jamais. Au coucher du soleil, {il:@coequipierA} ne parle plus de flaque.' },
    { id: 'rassurer', texte: 'Lui promettre de toujours {le:@coequipierA} retrouver', effets: [{ relation: '@coequipierA', delta: { attachement: 8 } }, { promesse: 'retrouver_ami', pnj: '@coequipierA', texte: 'Toujours retrouver {@coequipierA}.' }], resultat: '{@coequipierA} te regarde comme si tu venais de dire la chose la plus étrange du monde. Puis {il:@coequipierA} hoche la tête, très sérieusement, et garde ta promesse quelque part, au fond.' },
  ]),
  ami('kaguya', 'Les os', '$terrain', 'Pendant un exercice, {@coequipierA} se blesse au bras. Au lieu de saigner, la peau s’ouvre sur un éclat d’os blanc qui sort, pointu comme une lame. {@coequipierA} le regarde avec horreur. Les autres élèves reculent. Quelqu’un murmure « Kaguya » comme une insulte.', [
    { id: 'rester', texte: 'Rester à ses côtés devant tout le monde', effets: [{ relation: '@coequipierA', delta: { amitie: 10, confiance: 8 } }, { stat: 'social.reputation', delta: -2 }, { eveillerPnj: '@coequipierA', maitrise: 'shikotsumyaku' }], resultat: 'Tu poses ta main sur son épaule et tu fixes les autres jusqu’à ce qu’ils baissent les yeux. L’os rentre lentement sous la peau. {@coequipierA} ne dit rien. Mais à partir de ce jour, {il:@coequipierA} se battrait contre tout Kiri pour toi.' },
    { id: 'medecin', texte: 'Courir chercher le médecin', effets: [{ relation: '@coequipierA', delta: { amitie: 3 } }, { stat: 'attributs.agilite', delta: 1 }], resultat: 'Le médecin arrive, regarde, et soupire : « Rien de cassé. C’est le sang de son clan. » {@coequipierA} rentre seul{e:@coequipierA} ce soir-là. Tu n’as pas fait de mal. Tu n’as pas fait assez de bien.' },
  ]),
  ami('yuki', 'La neige en été', '$village', 'En plein été, il neige au-dessus de {@coequipierA}. Quelques flocons, juste au-dessus de sa tête, qui fondent avant de toucher le sol. {@coequipierA} les regarde avec terreur. Dans le clan Yuki, à Kiri, on a appris à cacher ce genre de choses.', [
    { id: 'cacher', texte: 'L’aider à les cacher avant que quelqu’un voie', effets: [{ relation: '@coequipierA', delta: { confiance: 10 } }, { stat: 'attributs.discretion', delta: 1 }], resultat: 'Vous filez dans une ruelle jusqu’à ce que la neige s’arrête. {@coequipierA} tremble. « Si on savait, on me ferait des choses. » Tu jures de ne rien dire. Tu tiendras parole, longtemps.' },
    { id: 'beau', texte: 'Lui dire que c’est beau', effets: [{ relation: '@coequipierA', delta: { amitie: 8, attachement: 6 } }, { eveillerPnj: '@coequipierA', maitrise: 'hyoton' }], resultat: 'Personne ne lui avait jamais dit ça. {@coequipierA} lève les yeux vers les flocons, et pour la première fois, les laisse tomber jusqu’à vous. Ils ne fondent pas. Ils sont froids et parfaits.' },
  ]),
  ami('shirakaze', 'Le vent de la dune', 'desert_vent', '{@coequipierA} t’emmène au pied de la grande dune, là où les Shirakaze apprennent à lire le vent. « Ferme les yeux. Écoute. Le vent te dit où il va avant d’y aller. » Tu n’entends que du vent.', [
    { id: 'ecouter', texte: 'Écouter jusqu’à entendre', test: { type: 'competence', difficulte: 44, attributs: { perception: 2, controleEmotionnel: 1 }, succes: { texte: 'Au bout d’une heure, tu l’entends : un changement de souffle, une hésitation. Le sable se soulève exactement là où tu l’attendais. {@coequipierA} hurle de joie.', effets: [{ stat: 'attributs.perception', delta: 2 }, { relation: '@coequipierA', delta: { amitie: 7 } }] }, echec: { texte: 'Tu n’entends rien, et tu manges du sable. {@coequipierA} rit, et te promet qu’un jour tu entendras.', effets: [{ relation: '@coequipierA', delta: { amitie: 4 } }] } } },
    { id: 'montrer', texte: 'Lui demander de faire danser le sable', effets: [{ relation: '@coequipierA', delta: { confiance: 5 } }, { eveillerPnj: '@coequipierA', maitrise: 'souffle_dunes' }], resultat: '{@coequipierA} lève les bras. Le sable monte en spirale, haut, plus haut que la dune, puis retombe en pluie dorée sur vous. « Ma grand-mère fait ça avec une seule main. » Il y a de la fierté et de la peur dans sa voix.' },
  ]),
  ami('raiko', 'Les gantelets', '$terrain', '{@coequipierA} a reçu ses premiers gantelets de cuir du clan Raikō. Ils sont trop grands, et l’électricité qui crépite dessus lui brûle les doigts. « Mon père dit qu’on doit avoir mal pour apprendre. Je commence à le croire un peu trop. »', [
    { id: 'parer', texte: 'Lui servir de partenaire d’entraînement', effets: [{ entrainer: 'taijutsu', jours: 10 }, { stat: 'jauges.sante', delta: -5 }, { relation: '@coequipierA', delta: { amitie: 6, respect: 6 } }, { eveillerPnj: '@coequipierA', maitrise: 'armure_foudre' }], resultat: 'Chaque coup qui te touche te fait sursauter. Au dixième, l’électricité tient sur tout son bras sans lui brûler la peau. {@coequipierA} te regarde, puis regarde son bras. « C’est toi qui as eu mal, cette fois. Merci. »' },
    { id: 'tissu', texte: 'Coudre une doublure de tissu dans les gantelets', effets: [{ stat: 'attributs.intellect', delta: 1 }, { relation: '@coequipierA', delta: { confiance: 6, attachement: 4 } }], resultat: 'Tu passes la nuit à coudre. Le lendemain, {@coequipierA} enfile les gantelets, et ne grimace plus. {Il:@coequipierA} ne dira jamais à son père d’où vient la doublure.' },
  ]),
  ami('ishikawa', 'La carrière', 'carrieres_terre', '{@coequipierA} t’emmène à la carrière du clan Ishikawa, où les enfants apprennent à rendre leur peau dure comme la roche. Un ancien frappe les mains de {@coequipierA} avec un marteau de bois, encore et encore. {@coequipierA} ne crie pas. Ses jointures saignent.', [
    { id: 'essayer', texte: 'Demander à essayer aussi', effets: [{ stat: 'attributs.force', delta: 2 }, { stat: 'jauges.sante', delta: -6 }, { relation: '@coequipierA', delta: { respect: 8 } }], resultat: 'L’ancien te frappe une seule fois. Tu ne cries pas non plus. Il hoche la tête et s’en va. {@coequipierA} te regarde avec un respect nouveau. « Personne d’autre n’a jamais demandé. »' },
    { id: 'apres', texte: 'Lui bander les mains après', effets: [{ relation: '@coequipierA', delta: { attachement: 8 } }, { eveillerPnj: '@coequipierA', maitrise: 'peau_roche' }], resultat: 'Tu bandes ses mains en silence, sur une pierre au bord de la carrière. « Dans dix ans, dit {@coequipierA}, aucune lame ne pourra me couper. » Tu ne sais pas si c’est une promesse ou une menace. Peut-être les deux.' },
  ]),
  ami('sans_clan', 'Le nom de personne', '$village', 'Pendant l’appel, l’instructeur prononce les noms de clan avec respect. Quand vient celui de {@coequipierA}, il n’y a qu’un prénom, et des rires au fond de la classe. {@coequipierA} fixe son pupitre jusqu’à la fin de l’heure.', [
    { id: 'rires', texte: 'Te retourner vers ceux qui ont ri', effets: [{ relation: '@coequipierA', delta: { amitie: 7, confiance: 5 } }, { stat: 'social.reputation', delta: 1 }], resultat: 'Tu les fixes sans rien dire, jusqu’à ce que les rires meurent. À la pause, {@coequipierA} vient s’asseoir à côté de toi sans un mot. C’est le début de quelque chose.' },
    { id: 'nom', texte: 'Lui dire qu’un nom, ça se gagne', effets: [{ relation: '@coequipierA', delta: { respect: 6 } }, { ethique: { ambition: 2 } }], resultat: '« Facile à dire. » Mais le soir même, {@coequipierA} s’entraîne seul{e:@coequipierA} jusqu’à la nuit. Le lendemain, et tous les jours suivants. Dans dix ans, des gens prononceront ce prénom avec respect.' },
  ]),

  // ── Le rival et son héritage ──────────────────────────────────
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'vis_rival_heritage',
    titre: 'Ce que porte {@rival}',
    categorie: 'rivalite',
    lieu: '$village',
    poids: 5,
    personnages: ['@rival'],
    si: { tout: [ACTIF, RIVAL, { age: { min: 10, max: 15 } }] },
    texte: [
      { texte: 'Tu surprends {@rival} seul{e:@rival}, derrière l’Académie, en train de pleurer de rage contre un arbre.' },
      { si: { clanPnj: '@rival', clan: 'uchiha' }, texte: 'Son père l’a encore comparé{e:@rival} à un cousin dont les yeux se sont déjà éveillés. Chez les Uchiha, on ne pardonne pas d’avoir les yeux noirs trop longtemps.' },
      { si: { clanPnj: '@rival', clan: 'hyuga' }, texte: 'La branche principale l’a humilié{e:@rival} pendant l’entraînement du clan, devant tout le monde. Le sceau sur son front a brûlé quand {il:@rival} a voulu répondre.' },
      { si: { clanPnj: '@rival', clan: ['nara', 'yamanaka', 'akimichi'] }, texte: 'Son clan attend qu’{il:@rival} reprenne le flambeau d’un trio vieux de trois générations. {Il:@rival} n’a pas choisi ses partenaires, ni son avenir.' },
      { si: { clanPnj: '@rival', clan: ['aburame', 'inuzuka'] }, texte: 'Son clan l’a jugé{e:@rival} trop faible pour recevoir son compagnon cette année. L’année prochaine, peut-être. Peut-être jamais.' },
      { si: { clanPnj: '@rival', clan: ['senju', 'uzumaki'] }, texte: 'On lui a encore rappelé qui étaient ses ancêtres. On lui rappelle tous les jours. Ce matin, quelqu’un a dit qu’{il:@rival} déshonorait leur mémoire.' },
      { si: { clanPnj: '@rival', clan: ['hozuki', 'kaguya', 'yuki'] }, texte: 'À Kiri, son clan est surveillé, compté, craint. {Il:@rival} doit être meilleur que tout le monde, juste pour qu’on lui laisse le droit d’exister.' },
      { si: { clanPnj: '@rival', clan: ['shirakaze', 'raiko', 'ishikawa'] }, texte: 'Le chef de son clan l’a désigné{e:@rival}, devant tous les autres enfants, pour prendre un jour la tête du clan. Depuis, plus personne ne lui parle comme à un enfant.' },
      { si: { clanPnj: '@rival', clan: 'sans_clan' }, texte: 'Sans clan, sans nom, sans personne pour {le:@rival} pousser. Chaque victoire, {il:@rival} l’a arrachée seul{e:@rival}. Aujourd’hui, {il:@rival} a perdu, et personne ne viendra {le:@rival} consoler.' },
      { texte: '{Il:@rival} te voit. Son visage se ferme instantanément.' },
    ],
    choix: [
      {
        id: 'partir',
        texte: 'Partir sans rien dire, pour lui laisser sa dignité',
        effets: [{ relation: '@rival', delta: { respect: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat: 'Tu tournes les talons. Le lendemain, {@rival} ne dit rien, mais quand vous vous affrontez à l’entraînement, {il:@rival} ne cherche plus à t’humilier. Juste à te battre.',
      },
      {
        id: 'rester',
        texte: 'T’asseoir à côté, sans parler',
        effets: [{ relation: '@rival', delta: { amitie: 8, hostilite: -6, rivalite: 4 } }],
        resultat: '« Va-t’en. » Tu restes. Au bout d’un long moment, {@rival} s’assoit aussi. Vous ne parlez pas. Quand vous repartez, vous êtes toujours rivaux. Mais plus tout à fait ennemis.',
      },
      {
        id: 'moquer',
        texte: 'Lui rappeler que les vrais ninjas ne pleurent pas',
        effets: [{ relation: '@rival', delta: { hostilite: 12, rivalite: 8 } }, { stat: 'social.reputationOmbre', delta: 1 }],
        resultat: '{@rival} se relève d’un bond. Pendant une seconde, tu crois qu’{il:@rival} va frapper. Puis {il:@rival} s’en va. Tu as gagné cette fois. Tu ne sais pas encore ce que ça va te coûter.',
      },
    ],
  },

  // ── Le second coéquipier et son clan ─────────────────────────
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'premieres_missions',
    id: 'vis_b_clan',
    titre: 'Le secret de {@coequipierB}',
    categorie: 'amitie',
    lieu: '$terrain',
    poids: 4,
    personnages: ['@coequipierB'],
    si: { tout: [ACTIF, B, { age: { min: 11, max: 16 } }, { rangMin: 'genin' }, { non: { clanPnj: '@coequipierB', clan: 'sans_clan' } }] },
    texte: [
      { texte: 'Pendant une pause en mission, {@coequipierB} te prend à part. « J’ai besoin que tu gardes un secret. Mon clan m’a interdit de le montrer hors de la famille. Mais si on se fait attaquer, il faut que tu saches ce que je peux faire. »' },
      { si: { clanPnj: '@coequipierB', clan: ['uchiha', 'hyuga'] }, texte: 'Ses yeux changent. Ce que tu vois dedans te glace : {il:@coequipierB} voit à travers toi, à travers les arbres, à travers tout.' },
      { si: { clanPnj: '@coequipierB', clan: ['nara', 'yamanaka', 'aburame', 'inuzuka', 'akimichi'] }, texte: 'La technique de son clan, en vrai, de près. Ce n’est pas comme dans les livres. C’est plus lent, plus étrange, et beaucoup plus inquiétant.' },
      { si: { clanPnj: '@coequipierB', clan: ['senju', 'uzumaki', 'kaguya', 'yuki', 'hozuki'] }, texte: 'Ce que {@coequipierB} te montre, peu de gens dans le village l’ont vu. Encore moins s’en souviennent sans avoir peur.' },
      { si: { clanPnj: '@coequipierB', clan: ['shirakaze', 'raiko', 'ishikawa'] }, texte: 'La force de son clan, concentrée dans un seul geste. Le sol tremble, l’air crépite. Puis plus rien, comme si rien ne s’était passé.' },
    ],
    choix: [
      {
        id: 'jurer',
        texte: 'Jurer de garder le secret',
        effets: [{ relation: '@coequipierB', delta: { confiance: 10, attachement: 4 } }, { promesse: 'secret_b', pnj: '@coequipierB', texte: 'Garder le secret du clan de {@coequipierB}.' }],
        resultat: '{@coequipierB} hoche la tête, soulagé{e:@coequipierB}. « Si un jour tu dois choisir entre ce secret et ta vie, choisis ta vie. Mais seulement là. » Vous rejoignez les autres comme si de rien n’était.',
      },
      {
        id: 'plan',
        texte: 'Construire un plan de combat autour de son pouvoir',
        effets: [{ relation: '@coequipierB', delta: { respect: 8 } }, { stat: 'attributs.intellect', delta: 2 }],
        resultat: 'Vous passez la pause à griffonner des schémas dans la poussière. Qui couvre qui, qui frappe quand. Quand vient l’attaque, deux semaines plus tard, vous n’avez même pas besoin de vous parler.',
      },
    ],
  },
];
