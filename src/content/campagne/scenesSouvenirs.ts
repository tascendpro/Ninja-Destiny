import type { Campagne, SceneCommuneDef } from '../../engine/campagne/types';

/**
 * Les souvenirs à deux : des moments ordinaires qui reviennent des années plus tard. Chaque première scène laisse un
 * souvenir commun ; la scène de retour n'existe que si ce souvenir est là, et son texte dépend de ce que vous aviez fait.
 * Jetons : {j1} {j2} {un} {deux}, accords {il:x} {e:x} {le:x} {lui:x}.
 */

const garde = (c: Campagne, id: string) => c.lien.souvenirs.find((s) => s.id === id);
const ton = (c: Campagne, id: string) => garde(c, id)?.tonalite;

export const SCENES_SOUVENIRS: SceneCommuneDef[] = [
  // ── 1. Le toit, la nuit des lanternes ──
  {
    id: 'mc_toit_lanternes',
    titre: 'La nuit des lanternes',
    age: { min: 8, max: 12 },
    tirage: 0.8,
    texte:
      'La fête des lanternes, et personne ne vous cherche. {j1} et {j2} grimpent sur le toit du grenier à riz, d’où l’on voit tout le village. En bas, des centaines de lanternes de papier montent vers le ciel, chacune avec un vœu écrit dessus. Il vous en reste une seule, froissée, et un pinceau sans beaucoup d’encre.',
    choix: [
      { id: 'voeu_commun', texte: 'Écrire un seul vœu, pour vous deux', famille: 'proteger' },
      { id: 'voeu_secret', texte: 'Écrire ton vœu en cachant le papier', famille: 'partir' },
      { id: 'lui_laisser', texte: 'Laisser l’autre écrire le sien', famille: 'parler' },
      { id: 'garder', texte: 'Garder la lanterne, ne pas la lâcher', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'voeu_commun+voeu_commun',
        texte: 'Vous tendez la main vers le pinceau en même temps, et vous écrivez à quatre mains, en vous disputant sur chaque trait. Le vœu ne veut plus rien dire à la fin : la moitié de l’un, la moitié de l’autre, et une tache. Vous la lâchez quand même. Elle monte tout droit, plus haut que les autres.',
        lien: { les2: { confiance: 6, loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'lanterne', texte: 'La lanterne écrite à quatre mains, qui montait plus haut que les autres.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'voeu_secret+voeu_secret',
        texte: 'Chacun tourne le dos à l’autre pour écrire, coude levé, comme à l’examen. Il n’y a qu’une lanterne : vous écrivez chacun sur une face, sans regarder l’autre. Elle s’envole avec deux vœux dos à dos. Aucun de vous ne demandera jamais ce que l’autre avait écrit.',
        lien: { les2: { confiance: 2, mefiance: 2 } },
        accord: 2,
        souvenir: { id: 'lanterne', texte: 'Une lanterne avec deux vœux dos à dos, que vous n’avez jamais lus.', poids: 3, tonalite: 'amer' },
      },
      {
        cle: 'lui_laisser+voeu_secret',
        texte: '{un} tend le pinceau sans un mot. {deux} écrit vite, en cachant le papier de sa main. La lanterne monte. {un} ne saura jamais ce qu’il y avait dessus, et c’est très bien comme ça : c’était un cadeau, pas un échange.',
        lien: { deux: { dette: 5, admiration: 3 }, un: { loyaute: 4 } },
        accord: 3,
        souvenir: { id: 'lanterne', texte: 'La lanterne que l’un a laissé l’autre écrire seul.', poids: 3, tonalite: 'chaud' },
      },
      {
        cle: 'garder+voeu_commun',
        texte: '{deux} veut écrire. {un} refuse de lâcher la lanterne. « Si on la lâche, on ne la reverra jamais. » Vous vous disputez jusqu’à ce que les autres lanternes aient disparu. Elle reste sur le toit, vide, et c’est {un} qui la ramène chez {lui:un}. Elle est peut-être encore quelque part.',
        lien: { un: { peur_de_perdre: 6 }, deux: { ressentiment: 2, confiance: 2 } },
        accord: 1,
        souvenir: { id: 'lanterne', texte: 'La lanterne qu’on n’a jamais lâchée.', poids: 3, tonalite: 'amer' },
      },
      {
        cle: 'defaut',
        texte: 'Le temps de vous décider, le vent emporte la lanterne de vos mains. Elle part sans vœu. Vous la regardez monter, un peu bêtement, et puis vous éclatez de rire : c’est sûrement la seule du village qui ne demande rien à personne.',
        lien: { les2: { confiance: 3 } },
        accord: 2,
        souvenir: { id: 'lanterne', texte: 'La lanterne partie sans vœu, la nuit de la fête.', poids: 2, tonalite: 'chaud' },
      },
    ],
  },
  {
    id: 'mc_toit_lanternes_retour',
    titre: 'Une lanterne, vingt ans après',
    age: { min: 24, max: 40 },
    si: (c) => !!garde(c, 'lanterne'),
    texte: (c) => {
      const t = ton(c, 'lanterne');
      const debut = 'La fête des lanternes, encore. Vous n’êtes plus montés sur le toit du grenier depuis l’enfance ; ce soir, sans vous concerter, vous vous y retrouvez tous les deux, un peu essoufflés, un peu ridicules.';
      if (t === 'amer')
        return `${debut}\n\n« Tu te souviens de cette nuit ? » La question flotte entre vous. Ce que vous aviez fait de cette lanterne-là n’a jamais été tout à fait réglé. En bas, les lanternes montent. Vous en avez chacun une, cette fois.`;
      return `${debut}\n\n« Tu te souviens de cette nuit ? » Évidemment. Vous en riez avant même d’en parler. En bas, les lanternes montent. Vous en avez chacun une, cette fois, et assez d’encre pour écrire un roman.`;
    },
    choix: [
      { id: 'dire', texte: 'Dire enfin ce que tu avais voulu écrire, ce soir-là', famille: 'parler' },
      { id: 'ensemble', texte: 'Attacher vos deux lanternes l’une à l’autre', famille: 'proteger' },
      { id: 'silence', texte: 'Lâcher la tienne sans rien dire, et regarder', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'dire+dire',
        texte: 'Vous parlez en même temps, vous vous arrêtez en même temps. Puis {un} commence, et {deux} écoute. Ce qu’on souhaitait à dix ans tient en une phrase. Ce qu’il en est resté prend toute la nuit. Les deux lanternes partent à l’aube, sans rien d’écrit dessus : tout a été dit.',
        lien: { les2: { confiance: 8, ressentiment: -5 } },
        accord: 5,
        souvenir: { id: 'lanterne_retour', texte: 'La nuit où vous vous êtes dit, enfin, ce que vous aviez voulu écrire à dix ans.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'ensemble+ensemble',
        texte: 'Vous avez la même idée, et le même bout de ficelle trop court. Il faut un nœud de shinobi, puis un deuxième, puis {deux} jure. Les deux lanternes attachées montent de travers, en tournant sur elles-mêmes, et tout le village lève la tête vers ce drôle d’oiseau à deux corps.',
        lien: { les2: { loyaute: 6, confiance: 4 } },
        accord: 5,
        souvenir: { id: 'lanterne_retour', texte: 'Deux lanternes attachées qui montaient en tournant, au-dessus du village.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'dire+silence',
        texte: '{un} parle. {deux} ne répond pas, regarde sa lanterne s’éloigner, et finit par poser la main sur l’épaule de {un}, sans rien dire. Ça suffit. Ça a toujours suffi, entre vous, c’est ce que {un} comprend ce soir-là.',
        lien: { un: { confiance: 5 }, deux: { loyaute: 4 } },
        accord: 3,
      },
      {
        cle: 'defaut',
        texte: 'Vous lâchez vos lanternes chacun de votre côté. Elles s’éloignent, se rapprochent, s’éloignent encore, et finissent par disparaître à peu près au même endroit du ciel. Ni l’un ni l’autre n’en fait la remarque. Vous l’avez vu tous les deux.',
        lien: { les2: { confiance: 3 } },
        accord: 2,
      },
    ],
  },

  // ── 2. La blessure qu'on cache ──
  {
    id: 'mc_blessure_cachee',
    titre: 'Ce que tu caches sous ta manche',
    age: { min: 13, max: 18 },
    tirage: 0.75,
    texte:
      'Au retour d’une mission, {j1} et {j2} partagent une chambre d’auberge trop petite. En retirant son gilet, {j2} grimace, et tente de le cacher. Sous la manche, une entaille mal recousue, qui a commencé à rougir. Personne d’autre ne l’a vue. Le rapport de mission dit : « aucun blessé ».',
    choix: [
      { id: 'soigner', texte: 'Sortir la trousse sans demander la permission', famille: 'proteger' },
      { id: 'demander', texte: 'Demander pourquoi ce n’est pas dans le rapport', famille: 'parler' },
      { id: 'taire', texte: 'Faire semblant de ne rien avoir vu', famille: 'observer' },
      { id: 'signaler', texte: 'Le signaler demain au médecin du village', famille: 'agir' },
    ],
    issues: [
      {
        cle: 'soigner+soigner',
        texte: 'Vous vous retrouvez à quatre mains sur la même trousse, l’un pour soigner, l’autre pour l’en empêcher et puis pour l’aider, parce qu’à deux c’est plus vite fait. {j2} serre les dents. À la fin, la couture est propre. « Personne ne le saura », dit {j1}. Et personne ne le saura.',
        lien: { les2: { confiance: 7, loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'manche', texte: 'La blessure cachée sous la manche, recousue à quatre mains dans une chambre d’auberge.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'famille:proteger+famille:observer',
        texte: '{deux} fait mine de dormir. {un} allume la lampe, sort la trousse, et recoud la plaie sans un mot. {deux} ne proteste pas. Le lendemain, {il:deux} marche devant, comme d’habitude. Mais à la pause, {il:deux} partage son eau, ce qu’{il:deux} ne fait jamais.',
        lien: { deux: { dette: 6, confiance: 5 }, un: { peur_de_perdre: 3 } },
        accord: 3,
        souvenir: { id: 'manche', texte: 'La nuit où l’un a recousu l’autre sans un mot.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'famille:agir+famille:parler',
        texte: '« Si tu le dis au médecin, ils me retirent de la prochaine mission. » « Et si je ne dis rien, tu perds le bras. » La dispute dure une heure, à voix basse pour ne pas réveiller l’aubergiste. Au matin, le médecin a vu la plaie. {deux} ne parle plus à {un} pendant une semaine, puis vient lui dire, un soir : « Tu avais raison. Ne recommence pas. »',
        lien: { un: { respect: 3 }, deux: { ressentiment: 4, dette: 4 } },
        accord: 1,
        souvenir: { id: 'manche', texte: 'La blessure signalée au médecin malgré tout, et la semaine de silence qui a suivi.', poids: 3, tonalite: 'amer' },
      },
      {
        cle: 'defaut',
        texte: 'Personne ne dit rien. La lampe s’éteint. Dans le noir, {j1} entend {j2} respirer mal pendant des heures. Au matin, la manche est redescendue, et vous faites comme si de rien n’était. Ce n’est pas rien. Vous le savez tous les deux.',
        lien: { les2: { mefiance: 3, peur_de_perdre: 2 } },
        accord: 1,
        souvenir: { id: 'manche', texte: 'La nuit où personne n’a rien dit sur la blessure.', poids: 3, tonalite: 'honteux' },
      },
    ],
  },
  {
    id: 'mc_blessure_cachee_retour',
    titre: 'La manche, encore',
    age: { min: 22, max: 45 },
    si: (c) => !!garde(c, 'manche'),
    texte: (c) => {
      const t = ton(c, 'manche');
      const base = 'Cette fois, c’est {j1} qui rentre avec une manche qui colle au bras. {j2} le voit tout de suite : on reconnaît toujours ce qu’on a soi-même caché.';
      if (t === 'honteux') return `${base}\n\nIl y a des années, dans une chambre d’auberge, personne n’avait rien dit. Le silence est revenu entre vous, exactement le même, avec la même odeur de lampe à huile.`;
      if (t === 'amer') return `${base}\n\nIl y a des années, l’un a signalé la blessure de l’autre au médecin. Ça avait coûté une semaine de silence. La question est la même. Les rôles ont changé.`;
      return `${base}\n\nIl y a des années, une trousse, une chambre trop petite, une couture faite en silence. La trousse est la même, d’ailleurs : {j2} l’a gardée.`;
    },
    choix: [
      { id: 'rendre', texte: 'Rendre la pareille, sans un mot', famille: 'proteger' },
      { id: 'parler', texte: 'Parler enfin de cette première nuit', famille: 'parler' },
      { id: 'laisser', texte: 'Laisser faire : c’est son choix', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'rendre+rendre',
        texte: 'La trousse sort. Les rôles s’inversent sans qu’on ait besoin de le dire. À la fin, {j2} coupe le fil avec les dents, exactement comme on le lui avait fait autrefois. « Quittes ? » « Jamais. Ça ne marche pas comme ça, entre nous. »',
        lien: { les2: { loyaute: 6, dette: -4, confiance: 5 } },
        accord: 5,
        souvenir: { id: 'manche_retour', texte: 'La couture rendue, des années après, avec la même trousse.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'famille:parler+famille:proteger',
        texte: '{un} commence à parler de l’auberge, de cette nuit, de ce qu’{il:un} avait pensé alors. {deux} recoud pendant ce temps, sans répondre, parce que ses mains sont occupées et que c’est plus facile comme ça. Quand le fil est coupé, tout a été dit.',
        lien: { les2: { confiance: 7 } },
        accord: 4,
      },
      {
        cle: 'defaut',
        texte: 'Ni l’un ni l’autre ne fait le premier geste. Mais le lendemain matin, une trousse est posée près du lit, ouverte, avec du fil neuf. Personne ne sait qui l’a mise là. Tout le monde le sait.',
        lien: { les2: { confiance: 3, loyaute: 2 } },
        accord: 2,
      },
    ],
  },

  // ── 3. L'élève commun ──
  {
    id: 'mc_eleve_commun',
    titre: 'L’élève qu’on se dispute',
    age: { min: 24, max: 40 },
    tirage: 0.7,
    texte:
      'Un enfant de huit ans vous suit tous les deux depuis une semaine. Il a vu {j1} lancer une technique et {j2} parer à mains nues, et il ne sait pas lequel des deux il veut devenir. Ce matin, il s’est planté devant vous avec un bâton à la main. « Je veux apprendre. Mais je ne sais pas avec qui. »',
    choix: [
      { id: 'partager', texte: 'Proposer de lui apprendre à deux', famille: 'proteger' },
      { id: 'prendre', texte: 'Le prendre comme élève, et que l’autre se débrouille', famille: 'agir' },
      { id: 'ceder', texte: 'Le laisser à l’autre : il a plus à lui apprendre', famille: 'partir' },
      { id: 'tester', texte: 'Lui faire passer une épreuve pour voir qui il est', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'partager+partager',
        texte: 'Vous parlez en même temps, et l’enfant éclate de rire. Les mois suivants sont un chaos : deux méthodes, deux humeurs, deux façons de dire « encore ». Il en ressort une troisième façon de se battre, qui n’appartient ni à l’un ni à l’autre. Il l’appelle « la vôtre », et ça vous fait plus d’effet que vous ne l’admettrez jamais.',
        lien: { les2: { respect: 5, confiance: 5 } },
        accord: 5,
        souvenir: { id: 'eleve', texte: 'L’enfant au bâton, que vous avez formé à deux, et qui se battait « à votre façon ».', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'prendre+prendre',
        texte: 'Vous tendez la main tous les deux. L’enfant regarde vos deux mains, l’une puis l’autre, et choisit {un}. {deux} hausse les épaules, fait comme si ça n’avait aucune importance, et vient regarder chaque entraînement depuis la barrière, sans rien dire, pendant deux ans.',
        lien: { deux: { jalousie: 6, rivalite: 4 }, un: { respect: 2 } },
        accord: 1,
        souvenir: { id: 'eleve', texte: 'L’enfant au bâton qui a choisi l’un et pas l’autre.', poids: 3, tonalite: 'amer' },
      },
      {
        cle: 'ceder+prendre',
        texte: '{un} pousse doucement l’enfant vers {deux}. « Va avec {lui:deux}. {Il:deux} sait des choses que je ne sais pas. » {deux} ne s’attendait pas à ça. Le soir, {il:deux} vient remercier {un}, maladroitement, et lui demande s’{il:un} veut bien regarder, de temps en temps. {un} vient. Tous les jours.',
        lien: { deux: { admiration: 6, dette: 5 }, un: { loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'eleve', texte: 'L’enfant au bâton, confié à l’autre par générosité.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'defaut',
        texte: 'L’enfant vous écoute discuter, longtemps, puis il s’en va trouver un troisième jōnin qui passait par là. Vous vous regardez. « C’est de ta faute. » « C’est de la tienne. » Vous rentrez en riant, un peu vexés, et vous ne l’oubliez jamais.',
        lien: { les2: { confiance: 3 } },
        accord: 2,
        souvenir: { id: 'eleve', texte: 'L’enfant au bâton, parti chez quelqu’un d’autre pendant que vous discutiez.', poids: 2, tonalite: 'chaud' },
      },
    ],
  },
  {
    id: 'mc_eleve_commun_retour',
    titre: 'Le bâton',
    age: { min: 42, max: 62 },
    si: (c) => !!garde(c, 'eleve'),
    texte: (c) => {
      const t = ton(c, 'eleve');
      const base = 'Un jeune chūnin vient vous trouver, tous les deux, un bâton à la main. Le même. Usé, fendu, rafistolé avec du fil de pêche.';
      if (t === 'amer') return `${base}\n\n« Vous vous êtes disputés pour moi, quand j’avais huit ans. Je l’ai vu. Je m’en suis voulu longtemps. » Il pose le bâton entre vous. « Je pars en mission demain. Je voulais que vous soyez là tous les deux, cette fois. »`;
      return `${base}\n\n« C’est grâce à vous deux que je suis encore en vie. » Il pose le bâton entre vous. « Je pars en mission demain, une vraie. Je voulais vous le dire en face. Aux deux. »`;
    },
    choix: [
      { id: 'benir', texte: 'Lui donner ta bénédiction, à ta façon', famille: 'parler' },
      { id: 'accompagner', texte: 'Proposer de l’accompagner jusqu’à la porte', famille: 'proteger' },
      { id: 'regarder', texte: 'Regarder l’autre, et le laisser parler en premier', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'famille:proteger+famille:proteger',
        texte: 'Vous l’accompagnez à la porte, un de chaque côté, comme une escorte ridicule. Il proteste, il rit, il marche plus droit qu’à l’arrivée. À la porte, il se retourne, et il fait un salut que vous reconnaissez : c’est un mélange des vôtres.',
        lien: { les2: { loyaute: 5, respect: 4 } },
        accord: 5,
      },
      {
        cle: 'famille:observer+famille:parler',
        texte: '{deux} parle, {un} se tait, et c’est parfait : l’enfant entend une voix et voit un visage, comme autrefois. Quand il est parti, {un} dit seulement : « On a fait ça, quand même. » « Oui. On a fait ça. »',
        lien: { les2: { confiance: 5 } },
        accord: 4,
      },
      {
        cle: 'defaut',
        texte: 'Vous lui dites chacun une chose différente, et il hoche la tête aux deux, très sérieux, comme on range deux outils dans une même trousse. Il part à l’aube. Le bâton, il l’a laissé à votre porte.',
        lien: { les2: { respect: 3 } },
        accord: 3,
      },
    ],
  },

  // ── 4. La dernière partie de go ──
  {
    id: 'mc_partie_go',
    titre: 'La partie qu’on ne finit pas',
    age: { min: 15, max: 22 },
    tirage: 0.7,
    texte:
      'Une nuit de garde, à la frontière. Rien ne bouge depuis des heures. {j1} a trouvé un vieux goban dans la cabane, et des pierres dépareillées. Vous commencez une partie à la lueur d’une lampe couverte. Au milieu de la partie, un signal : la relève arrive. Il reste un coup à jouer, et c’est à {j2}.',
    choix: [
      { id: 'jouer', texte: 'Jouer le coup quand même, vite', famille: 'agir' },
      { id: 'noter', texte: 'Noter la position sur un bout de papier', famille: 'observer' },
      { id: 'abandonner', texte: 'Abandonner la partie en riant', famille: 'partir' },
      { id: 'promettre', texte: 'Promettre de la finir un jour', famille: 'parler' },
    ],
    issues: [
      {
        cle: 'promettre+promettre',
        texte: '« On la finira. » « Promis. » Vous laissez les pierres sur le goban, exactement là où elles sont, et vous recouvrez le tout d’un tissu. Personne ne le touchera : c’est une cabane de garde, et les gardes sont superstitieux.',
        lien: { les2: { loyaute: 5, confiance: 4 } },
        accord: 4,
        souvenir: { id: 'go', texte: 'La partie de go laissée sous un tissu, dans une cabane de la frontière, avec une promesse.', poids: 4, tonalite: 'chaud' },
        promesse: { id: 'go', texte: 'Finir la partie de go de la frontière.' },
      },
      {
        cle: 'noter+noter',
        texte: 'Vous sortez chacun un papier, et vous notez la position, chacun de son côté, sans vous concerter. Plus tard, en comparant, vous découvrez que vos deux schémas ne sont pas les mêmes. Il y a une pierre de différence. Vous ne saurez jamais qui avait raison.',
        lien: { les2: { rivalite: 4, confiance: 2 } },
        accord: 2,
        souvenir: { id: 'go', texte: 'La partie de go notée deux fois, avec une pierre de différence.', poids: 3, tonalite: 'chaud' },
      },
      {
        cle: 'jouer+abandonner',
        texte: '{un} pose sa pierre au moment même où {deux} renverse le goban en riant. La pierre roule sous le plancher. « J’avais gagné. » « Prouve-le. » Personne ne le prouvera. Vous partirez de la frontière en vous disputant, ce qui est, vous le savez, une façon de rester proches.',
        lien: { les2: { rivalite: 5 } },
        accord: 2,
        souvenir: { id: 'go', texte: 'La pierre de go qui a roulé sous le plancher de la cabane.', poids: 2, tonalite: 'chaud' },
      },
      {
        cle: 'defaut',
        texte: 'La relève arrive, la partie reste en plan. Vous rangez les pierres à la hâte, sans regarder. Sur le chemin du retour, {j1} y pense encore. {j2} aussi. Ni l’un ni l’autre ne le dira.',
        lien: { les2: { confiance: 2 } },
        accord: 1,
        souvenir: { id: 'go', texte: 'Une partie de go rangée trop vite, à la frontière.', poids: 2, tonalite: 'amer' },
      },
    ],
  },
  {
    id: 'mc_partie_go_retour',
    titre: 'Le dernier coup',
    age: { min: 40, max: 70 },
    si: (c) => !!garde(c, 'go'),
    texte: (c) => {
      const promis = c.lien.promesses.some((p) => p.id === 'go' && p.etat === 'en_cours');
      const base = 'On vous envoie, tous les deux, inspecter les vieux postes de la frontière avant qu’on les démolisse. La cabane est toujours là, à moitié effondrée.';
      if (ton(c, 'go') === 'amer') return `${base}

Dans un coin, le vieux goban. Vous l’aviez rangé trop vite, cette nuit-là, sans vous regarder. Les pierres sont encore dans leur boîte, blanches et noires mélangées, comme vous les aviez jetées.`;
      if (promis) return `${base}\n\nSous les gravats, un tissu moisi. Dessous, le goban. Les pierres n’ont pas bougé, ou presque. Il reste un coup à jouer, et c’est toujours à {j2}.`;
      return `${base}\n\nDans un coin, sous les gravats, le vieux goban, vide. Les pierres ont disparu depuis longtemps. Vous vous arrêtez tous les deux devant, en même temps, sans un mot.`;
    },
    choix: [
      { id: 'finir', texte: 'Finir la partie, ici, maintenant', famille: 'agir' },
      { id: 'laisser', texte: 'Laisser les choses telles qu’elles sont', famille: 'observer' },
      { id: 'emporter', texte: 'Emporter le goban', famille: 'proteger' },
    ],
    issues: [
      {
        cle: 'finir+finir',
        texte: 'Vous vous asseyez dans la poussière, vieux, raides, et vous jouez. La partie dure jusqu’au soir. Au dernier coup, vous comptez les points deux fois. Égalité. Vous vous regardez, et vous riez si fort que l’escorte vient voir si quelqu’un est blessé.',
        lien: { les2: { confiance: 6, loyaute: 6, rivalite: -4 } },
        accord: 6,
        // La promesse de la frontière est tenue, quarante ans plus tard.
        apres: (c) => {
          const p = c.lien.promesses.find((x) => x.id === 'go' && x.etat === 'en_cours');
          if (p) p.etat = 'tenue';
        },
        souvenir: { id: 'go_fini', texte: 'La partie de go de la frontière, finie quarante ans plus tard. Égalité.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'famille:proteger+famille:observer',
        texte: '{un} soulève le goban avec précaution. {deux} regarde faire, puis aide à le porter. Le soir, il trône dans la maison de l’un ou de l’autre, vous ne savez plus très bien. Personne ne joue dessus. Ce n’est pas fait pour ça.',
        lien: { les2: { loyaute: 5 } },
        accord: 4,
      },
      {
        cle: 'defaut',
        texte: 'Vous laissez tout en l’état. Demain, la cabane sera démolie, et le goban avec. C’est peut-être mieux comme ça : certaines parties n’ont pas besoin de vainqueur. Sur le chemin du retour, vous marchez plus lentement que d’habitude.',
        lien: { les2: { confiance: 3 } },
        accord: 3,
      },
    ],
  },
];
