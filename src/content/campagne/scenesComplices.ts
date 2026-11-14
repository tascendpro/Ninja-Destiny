import type { Campagne, SceneCommuneDef } from '../../engine/campagne/types';

/**
 * Les scènes complices : jeux d'enfants, paris, corvées, traditions. Des moments où l'on choisit chacun en secret,
 * et où ce que l'un ne sait pas de l'autre change tout. Plusieurs scènes donnent à chacun un indice différent (textePour) :
 * mettez-vous d'accord à voix haute avant de choisir, ou ne vous dites rien.
 * Jetons : {j1} {j2} {un} {deux} {moi} {autre}, accords {il:x} {Il:x} {le:x} {lui:x}.
 */

const souvenu = (c: Campagne, id: string) => c.lien.souvenirs.some((s) => s.id === id);

export const SCENES_COMPLICES: SceneCommuneDef[] = [
  // ── Enfance ──
  {
    id: 'mc_cx_kunai_fete',
    titre: 'Le stand des kunai en bois',
    age: { min: 7, max: 10 },
    tirage: 0.8,
    texte:
      'À la fête du village, un vieux forain tient un stand de lancer : trois kunai en bois, des cibles en paille, et au sommet de l’étagère un seul lot qui vaille la peine, un masque de renard peint à la main. Vous n’avez de quoi payer qu’une partie, à deux. Le forain sourit. « Un lanceur, ou deux qui se partagent les trois ? »',
    choix: [
      { id: 'viser', texte: 'Lancer toi-même, et viser juste', famille: 'agir' },
      { id: 'laisser', texte: 'Laisser lancer l’autre, et l’encourager', famille: 'proteger' },
      { id: 'tricher', texte: 'Repérer la cible truquée, et le dire tout bas', famille: 'observer' },
      { id: 'marchander', texte: 'Marchander une deuxième partie', famille: 'parler' },
    ],
    issues: [
      {
        cle: 'viser+viser',
        texte: 'Vous vous disputez les kunai, et finissez par en lancer un et demi chacun, puisque le troisième vous échappe à tous les deux. Deux cibles tombent. Le masque reste sur l’étagère. Le forain, pris de pitié, vous donne deux sucres d’orge, que vous mangez en vous reprochant mutuellement le kunai perdu.',
        lien: { les2: { rivalite: 4, confiance: 2 } },
        accord: 2,
        souvenir: { id: 'masque_renard', texte: 'Le masque de renard resté sur l’étagère, et les sucres d’orge de consolation.', poids: 2, tonalite: 'chaud' },
      },
      {
        cle: 'laisser+viser',
        texte: '{un} recule d’un pas et met les trois kunai dans la main de {deux}. « Vas-y. Moi, je compte. » Un, deux, trois : les trois cibles tombent. {deux} décroche le masque, hésite, et le pose sur le visage de {un}. « C’est toi qui comptais. Sans toi, j’aurais raté. »',
        lien: { deux: { admiration: 4, dette: 3 }, un: { loyaute: 5, confiance: 3 } },
        accord: 4,
        souvenir: { id: 'masque_renard', texte: 'Le masque de renard, gagné par l’un, porté par l’autre.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'tricher+viser',
        texte: '{un} a remarqué que la cible du milieu est clouée par-derrière. « Pas celle-là. Celles des bords. » {deux} lance sur les bords, et tout tombe. Le forain plisse les yeux, regarde {un}, puis éclate de rire et donne le masque. « Toi, tu finiras chez les ninjas qui regardent avant de frapper. »',
        lien: { deux: { respect: 5 }, un: { confiance: 3 } },
        effets: { un: [{ stat: 'attributs.perception', delta: 2 }] },
        accord: 4,
        souvenir: { id: 'masque_renard', texte: 'Le masque de renard, gagné en repérant la cible truquée.', poids: 3, tonalite: 'fier' },
      },
      {
        cle: 'tricher+tricher',
        texte: 'Vous avez vu le clou tous les deux, et vous le dites en même temps, trop fort. Le forain devient rouge, puis rit. « Deux petits espions. » Il vous donne le masque à condition que vous ne disiez rien aux autres enfants. C’est votre premier secret commun, et il sent le sucre d’orge.',
        lien: { les2: { confiance: 5, loyaute: 3 } },
        accord: 4,
        souvenir: { id: 'masque_renard', texte: 'Le masque de renard, prix de votre premier secret.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'marchander+*',
        texte: '{un} se lance dans un discours d’une conviction désarmante : la fête, les ancêtres, le fait que {deux} a une très mauvaise vue. Le forain cède une partie gratuite par pure fatigue. Six kunai au lieu de trois : le masque tombe à la cinquième. Vous rentrez en vous le passant toutes les dix enjambées.',
        lien: { les2: { confiance: 4 } },
        effets: { un: [{ stat: 'attributs.charisme', delta: 2 }] },
        accord: 3,
        souvenir: { id: 'masque_renard', texte: 'Le masque de renard, arraché au forain à force de paroles.', poids: 3, tonalite: 'chaud' },
      },
      {
        cle: 'defaut',
        texte: 'Le temps de décider, un autre enfant prend votre tour et gagne le masque. Vous restez là à le regarder s’éloigner avec. Puis {un} hausse les épaules : « De toute façon, il était moche. » Il ne l’était pas. Vous en parlerez encore des années.',
        lien: { les2: { confiance: 2 } },
        accord: 1,
      },
    ],
  },
  {
    id: 'mc_cx_porte_scellee',
    titre: 'La porte sous le vieux temple',
    age: { min: 8, max: 12 },
    tirage: 0.7,
    texte:
      'Une partie de cache-cache qui tourne mal : en vous glissant sous le plancher du vieux temple, vous tombez tous les deux sur une petite porte de pierre, couverte de papiers de sceau jaunis. Le soleil se couche. Personne ne sait que vous êtes ici.',
    textePour: (_c, j) =>
      j === 0
        ? 'Au moment où tu passais la tête, tu as vu un des papiers de sceau frémir, comme si quelque chose respirait derrière. {autre} n’a rien remarqué.'
        : 'Toi, tu as entendu, très bas, quelqu’un dire ton prénom de l’autre côté de la pierre. {autre} n’a rien entendu, tu en mettrais ta main au feu.',
    choix: [
      { id: 'ouvrir', texte: 'Décoller un papier, juste un', famille: 'agir' },
      { id: 'filer', texte: 'Sortir d’ici, tout de suite', famille: 'partir' },
      { id: 'adulte', texte: 'Aller chercher un adulte', famille: 'parler' },
      { id: 'ecouter', texte: 'Coller l’oreille contre la pierre', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'ouvrir+ouvrir',
        texte: 'Vos deux mains tirent le même papier. Il se déchire avec un bruit de soie, et un souffle froid passe entre vous, si fort que vos cheveux se soulèvent. Puis plus rien. La porte ne s’ouvre pas. Vous sortez en courant, sans un mot, et pendant une semaine vous faites tous les deux le même rêve, que ni l’un ni l’autre n’avouera.',
        lien: { les2: { confiance: 3, dependance: 3 } },
        effets: { les2: [{ stat: 'attributs.controleChakra', delta: 2 }] },
        accord: 3,
        souvenir: { id: 'porte_temple', texte: 'Le papier de sceau déchiré à deux sous le vieux temple, et le même rêve pendant une semaine.', poids: 4, tonalite: 'tragique' },
      },
      {
        cle: 'ouvrir+filer',
        texte: '{deux} est déjà dehors quand {un} touche le papier. Le froid qui sort de la pierre fait claquer ses dents. Quand {un} ressort enfin, {deux} l’attend, livide, et serre ses mains glacées sans poser de question. Vous n’en parlez à personne. Pas même entre vous.',
        lien: { deux: { peur_de_perdre: 6 }, un: { dette: 3 } },
        accord: 2,
        souvenir: { id: 'porte_temple', texte: 'La porte sous le temple, et les mains glacées qu’on a réchauffées sans rien demander.', poids: 3, tonalite: 'tragique' },
      },
      {
        cle: 'adulte+*',
        texte: '{un} file chercher le vieux moine. Il descend sous le plancher avec une lanterne, regarde les papiers, puis vous regarde longtemps tous les deux. « Vous n’avez rien touché ? » Il repose chaque sceau, en ajoute trois, et vous fait jurer de ne jamais revenir. Le lendemain, une équipe de ninjas en gris murmure autour du temple.',
        lien: { les2: { confiance: 3 } },
        effets: { un: [{ stat: 'social.reputation', delta: 2 }] },
        accord: 2,
        souvenir: { id: 'porte_temple', texte: 'La porte sous le temple, refermée par le vieux moine avec trois sceaux de plus.', poids: 3, tonalite: 'fier' },
      },
      {
        cle: 'ecouter+ecouter',
        texte: 'Vous collez l’oreille contre la pierre, joue contre joue. Il y a une voix, très loin, qui compte. Un, deux, trois, sans jamais dépasser trois. Vous restez là jusqu’à ce que la nuit soit noire, à écouter quelqu’un compter dans le noir. Puis vous rentrez, en vous tenant la manche.',
        lien: { les2: { confiance: 5, dependance: 2 } },
        accord: 4,
        souvenir: { id: 'porte_temple', texte: 'La voix qui comptait jusqu’à trois derrière la porte du temple.', poids: 4, tonalite: 'tragique' },
      },
      {
        cle: 'defaut',
        texte: 'Vous hésitez trop longtemps. Le soleil disparaît, et sous le plancher il fait soudain noir comme dans un puits. Vous ressortez à tâtons, en vous cognant partout, et vous rentrez avec des bleus et l’impression d’avoir laissé quelque chose en bas.',
        lien: { les2: { confiance: 2 } },
        accord: 1,
      },
    ],
  },

  // ── Genin ──
  {
    id: 'mc_cx_premier_salaire',
    titre: 'Cinquante ryō à deux',
    age: { min: 12, max: 15 },
    tirage: 0.85,
    texte:
      'Une mission de rang D bouclée : trois jours à désherber les rizières d’une veuve qui vous a nourris comme des rois. Le bureau des missions vous remet votre paie, une enveloppe de cinquante ryō pour vous deux. C’est la première fois que vous gagnez de l’argent avec votre bandeau.',
    choix: [
      { id: 'partager', texte: 'Moitié-moitié, au ryō près', famille: 'agir' },
      { id: 'festin', texte: 'Tout dépenser ce soir, ensemble', famille: 'proteger' },
      { id: 'veuve', texte: 'Rendre une part à la veuve', famille: 'parler' },
      { id: 'garder', texte: 'Proposer de tout mettre de côté, « pour plus tard »', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'partager+partager',
        texte: 'Vous comptez les pièces sur le comptoir, deux fois, et vous repartez chacun avec vingt-cinq ryō et le sentiment étrange d’être devenus des adultes. Ça ne dure pas : au coin de la rue, vous vous achetez chacun le même gâteau de riz.',
        effets: { les2: [{ stat: 'jauges.ryo', delta: 25 }] },
        lien: { les2: { respect: 3 } },
        accord: 2,
      },
      {
        cle: 'festin+festin',
        texte: 'Brochettes, nouilles, beignets, un jus de prune qui pique : vous dépensez les cinquante ryō en une soirée et vous finissez allongés sur la digue, le ventre tendu, à regarder les étoiles. Le lendemain, vous n’avez plus rien. C’est la meilleure dépense de votre vie.',
        lien: { les2: { confiance: 5, loyaute: 4 } },
        accord: 5,
        souvenir: { id: 'premier_salaire', texte: 'Votre première paie, dépensée en une nuit sur la digue.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'veuve+*',
        texte: '{un} retourne aux rizières avec la moitié de l’enveloppe. La veuve refuse, insiste, refuse encore, puis finit par accepter en pleurant un peu, et vous envoie, pendant des années, un sac de riz à chaque nouvel an. {deux} râle sur tout le chemin du retour. {Il:deux} ne râle plus, l’année suivante, en ouvrant le premier sac.',
        effets: { les2: [{ stat: 'jauges.ryo', delta: 12 }, { stat: 'social.reputation', delta: 2 }] },
        lien: { deux: { respect: 4 }, un: { confiance: 2 } },
        accord: 3,
        souvenir: { id: 'premier_salaire', texte: 'La paie rendue à la veuve des rizières, et ses sacs de riz à chaque nouvel an.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'garder+partager',
        texte: '{un} propose de tout garder « pour plus tard ». {deux} prend sa moitié sans discuter. La moitié de {un} dort dans une boîte en fer, sous une latte du plancher. Elle y est encore quand, des années après, il faudra payer un médecin en urgence.',
        effets: { un: [{ stat: 'jauges.ryo', delta: 30 }], deux: [{ stat: 'jauges.ryo', delta: 25 }] },
        lien: { deux: { respect: 2 } },
        accord: 1,
      },
      {
        cle: 'defaut',
        texte: 'Vous n’arrivez pas à vous mettre d’accord, alors vous coupez la poire en deux : la moitié dépensée ce soir, la moitié pour chacun. Personne n’est satisfait. Tout le monde a mangé.',
        effets: { les2: [{ stat: 'jauges.ryo', delta: 12 }] },
        lien: { les2: { confiance: 2 } },
        accord: 2,
      },
    ],
  },
  {
    id: 'mc_cx_tours_de_garde',
    titre: 'Les tours de garde',
    age: { min: 13, max: 18 },
    tirage: 0.75,
    texte:
      'Une nuit de bivouac sur une route de marchands, loin de tout. Il faut dormir, et il faut veiller. Le feu craque. Au-delà du cercle de lumière, la forêt fait des bruits qui ne ressemblent à aucun animal que vous connaissez.',
    textePour: (_c, j) => (j === 0 ? 'Tout à l’heure, au relais, tu as vu trois hommes payer en monnaie de Kiri et vous regarder un peu trop longtemps.' : 'Tu tombes de fatigue : deux nuits sans dormir. Si tu prends le premier tour, tu t’endormiras, tu le sais.'),
    choix: [
      { id: 'premier', texte: 'Prendre le premier tour', famille: 'proteger' },
      { id: 'dormir', texte: 'Dormir tout de suite, l’autre veillera', famille: 'partir' },
      { id: 'piege', texte: 'Poser des fils et des grelots autour du camp', famille: 'observer' },
      { id: 'parler', texte: 'Veiller tous les deux, et parler à voix basse', famille: 'parler' },
    ],
    issues: [
      {
        cle: 'piege+*',
        texte: '{un} tend des fils à hauteur de cheville, avec des grelots volés à la charrette. À la troisième heure, ils tintent. Vous êtes debout avant que les détrousseurs aient compris que la fête est finie.',
        lien: { deux: { respect: 4 } },
        accord: 4,
        combat: 'combat_nuit',
      },
      {
        cle: 'dormir+dormir',
        texte: 'Vous vous endormez tous les deux, chacun persuadé que l’autre veille. Vous vous réveillez au milieu de la nuit, les mains liées, avec une marmite qui bout au-dessus de votre feu et trois hommes qui fouillent vos sacs.',
        lien: { les2: { mefiance: 3 } },
        accord: 1,
        combat: 'combat_nuit',
      },
      {
        cle: 'premier+dormir',
        texte: '{un} veille. {deux} dort comme une pierre, et quand les ombres sortent du bois, {un} a juste le temps de lui lancer une sandale au visage. « Debout. Ils sont là. »',
        lien: { deux: { dette: 4 }, un: { loyaute: 3 } },
        accord: 3,
        combat: 'combat_nuit',
      },
      {
        cle: 'parler+parler',
        texte: 'Vous veillez ensemble, à voix basse. Vous parlez de tout : de vos parents, de la peur, de ce que vous ferez si l’un des deux meurt avant l’autre. Les hommes du relais finissent par sortir du bois, entendent deux voix bien éveillées, et repartent comme ils sont venus. Vous ne le saurez jamais. Le matin, vous avez les yeux rouges et l’impression de vous connaître mieux.',
        lien: { les2: { confiance: 7, loyaute: 3 } },
        accord: 5,
        souvenir: { id: 'veille', texte: 'La nuit de veille où vous avez parlé de tout, à voix basse.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'defaut',
        texte: 'Vous vous partagez la nuit tant bien que mal, en vous réveillant l’un l’autre à des heures absurdes. Quand les ombres sortent du bois, vous êtes à moitié réveillés tous les deux.',
        accord: 2,
        combat: 'combat_nuit',
      },
    ],
  },
  {
    id: 'mc_cx_pari_rivaux',
    titre: 'Le pari de la cascade',
    age: { min: 13, max: 22 },
    types: ['rivaux', 'amis', 'clan', 'freres'],
    tirage: 0.8,
    texte:
      'La cascade de l’Est, celle qu’on remonte en marchant sur l’eau, avec le chakra dans les pieds. Des générations de genin s’y sont cassé les dents. Un attroupement se forme quand vous arrivez tous les deux : on sait que vous ne pouvez pas vous croiser sans vous défier.',
    choix: [
      { id: 'course', texte: 'Lancer le défi : le premier en haut', famille: 'agir' },
      { id: 'enjeu', texte: 'Fixer l’enjeu : le perdant paie un mois de repas', famille: 'parler' },
      { id: 'ensemble', texte: 'Proposer de monter ensemble, en se tenant la main', famille: 'proteger' },
      { id: 'etudier', texte: 'Regarder d’abord comment l’eau tombe', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'course+course',
        texte: 'Vous partez au même instant. À mi-hauteur, vous êtes au coude à coude, trempés, à bout de chakra. Au dernier mètre, vous glissez tous les deux et tombez dans le bassin, sous les cris de la foule. Il faudra régler ça autrement.',
        lien: { les2: { rivalite: 6, respect: 4 } },
        effets: { les2: [{ stat: 'attributs.controleChakra', delta: 2 }] },
        accord: 3,
        combat: 'duel_entrainement',
      },
      {
        cle: 'enjeu+course',
        texte: '« Un mois de repas », dit {un}. « Tenu », répond {deux}, les pieds déjà sur l’eau. La montée est une guerre, et le pari aussi : il ne se tranchera pas sur la cascade, mais sur la berge, poings levés.',
        lien: { les2: { rivalite: 5 } },
        accord: 2,
        combat: 'duel_entrainement',
      },
      {
        cle: 'etudier+course',
        texte: '{deux} fonce. {un} regarde l’eau : à droite, elle tombe moins fort. {un} part dix secondes plus tard, par la droite, et arrive en haut à côté de {deux}, sec ou presque. La foule hurle. {deux} grimace : « Tu as triché. » « J’ai regardé. »',
        lien: { deux: { respect: 5, jalousie: 3 }, un: { rivalite: 3 } },
        effets: { un: [{ stat: 'attributs.perception', delta: 2 }], deux: [{ stat: 'attributs.controleChakra', delta: 2 }] },
        accord: 3,
      },
      {
        cle: 'ensemble+ensemble',
        texte: 'La foule se tait, déçue. Vous montez ensemble, main dans la main, en vous rattrapant à chaque glissade. Ça prend deux fois plus de temps. Quand vous arrivez en haut, personne n’applaudit, à part un vieux pêcheur qui lève son chapeau. C’est le seul public qui comptait.',
        lien: { les2: { confiance: 6, loyaute: 4, rivalite: -3 } },
        accord: 5,
        souvenir: { id: 'cascade', texte: 'La cascade de l’Est, remontée main dans la main sous les yeux d’une foule déçue.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'ensemble+course',
        texte: '{un} tend la main. {deux} est déjà dans l’eau. La main reste tendue un moment, puis retombe. {deux} arrive en haut sous les vivats, et quand {il:deux} se retourne, la berge est vide : {un} a déjà tourné les talons.',
        lien: { un: { ressentiment: 5, confiance: -3 }, deux: { rivalite: 3 } },
        accord: 1,
      },
      {
        cle: 'defaut',
        texte: 'Vous tournez autour de la question si longtemps que la foule finit par se disperser. Vous montez quand même, chacun de votre côté, sans témoin. Personne ne saura qui est arrivé le premier. Vous, si, et vous ne serez jamais d’accord.',
        lien: { les2: { rivalite: 3 } },
        accord: 2,
      },
    ],
  },
  {
    id: 'mc_cx_lettres_frontiere',
    titre: 'Les lettres du marchand de thé',
    age: { min: 15, max: 26 },
    types: ['villages_differents'],
    tirage: 0.9,
    texte:
      'Vos deux villages ne se parlent plus. Le seul fil entre vous est un vieux marchand de thé qui passe la frontière deux fois par saison, et qui accepte de glisser une lettre sous ses boîtes. Ce matin, un poste-frontière a doublé ses fouilles. Une lettre trouvée, et vous serez tous les deux interrogés par vos propres camps.',
    choix: [
      { id: 'ecrire', texte: 'Écrire quand même, en clair', famille: 'parler' },
      { id: 'code', texte: 'Écrire en code, comme deux espions', famille: 'observer' },
      { id: 'cesser', texte: 'Ne plus écrire, pour protéger l’autre', famille: 'partir' },
      { id: 'rendezvous', texte: 'Fixer un rendez-vous au col', famille: 'agir' },
    ],
    issues: [
      {
        cle: 'code+code',
        texte: 'Vous avez inventé le même code sans vous concerter : les premières lettres des noms de thé. Vos lettres ont désormais l’air de bons de commande. Le poste-frontière en fouille trois, et laisse passer trois commandes de thé vert parfaitement ennuyeuses. Vous rirez longtemps de « l’oolong de minuit ».',
        lien: { les2: { confiance: 6, loyaute: 3 } },
        effets: { les2: [{ stat: 'attributs.intellect', delta: 2 }] },
        accord: 5,
        souvenir: { id: 'thes', texte: 'Le code des noms de thé, et l’oolong de minuit.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'ecrire+*',
        texte: 'La lettre de {un} est trouvée. Elle ne dit rien de secret, juste des nouvelles, et l’envie de se revoir. Ça suffit. {un} passe une nuit dans une salle sans fenêtre à expliquer qui est {deux}. Au matin, on ouvre la porte, mais le dossier de {un} porte désormais un mot de plus.',
        lien: { deux: { dette: 5, peur_de_perdre: 4 }, un: { loyaute: 4 } },
        effets: { un: [{ stat: 'social.suspicion', delta: 10 }] },
        accord: 3,
      },
      {
        cle: 'cesser+cesser',
        texte: 'Vous avez eu la même idée. Le marchand de thé passe la frontière deux fois, trois fois, sans rien sous ses boîtes. À la quatrième, il vous apporte, à chacun, une boîte de thé vide avec un seul mot dessus, de sa main à lui : « Idiots. »',
        lien: { les2: { peur_de_perdre: 5, confiance: 2 } },
        accord: 2,
      },
      {
        cle: 'rendezvous+rendezvous',
        texte: 'Vous fixez le même col, à deux jours d’écart, et chacun attend l’autre le mauvais jour. Le troisième jour, vous vous croisez enfin, à bout de vivres, chacun persuadé que l’autre ne viendrait pas. Une heure, au col. Puis chacun redescend vers son camp, et vous ne dites rien de cette heure-là.',
        lien: { les2: { confiance: 5, loyaute: 5 } },
        accord: 4,
        souvenir: { id: 'col_rendezvous', texte: 'L’heure volée au col, entre vos deux villages.', poids: 5, tonalite: 'chaud' },
        promesse: { id: 'col_chaque_annee', texte: 'Se retrouver au col, une fois par an, quoi que décident vos villages.' },
      },
      {
        cle: 'defaut',
        texte: 'Vos lettres se croisent, se contredisent, se perdent. L’une parle de rendez-vous, l’autre de prudence. Pendant toute une saison, vous ne savez plus vraiment ce que l’autre pense. Puis une boîte de thé arrive, avec trois mots : « Toujours là. »',
        lien: { les2: { confiance: 2, mefiance: 2 } },
        accord: 2,
      },
    ],
  },

  // ── Adultes ──
  {
    id: 'mc_cx_maison_fuit',
    titre: 'Le toit qui fuit',
    age: { min: 18, max: 30 },
    types: ['freres', 'clan'],
    tirage: 0.8,
    texte:
      'La saison des pluies, et le toit de la maison familiale fuit à trois endroits. {parent} tousse depuis une semaine et refuse de voir un médecin. Une mission longue vous attend tous les deux dans quatre jours. Quelqu’un devrait rester. Personne ne veut le dire en premier.',
    choix: [
      { id: 'rester', texte: 'Dire que tu restes', famille: 'proteger' },
      { id: 'partir', texte: 'Partir : la paie de la mission payera un médecin', famille: 'partir' },
      { id: 'toit', texte: 'Réparer le toit d’abord, ensemble, et voir après', famille: 'agir' },
      { id: 'forcer', texte: 'Traîner {parent} chez le médecin, de force', famille: 'parler' },
    ],
    issues: [
      {
        cle: 'rester+partir',
        texte: '{un} reste. {deux} part, et envoie toute sa paie. Le médecin vient, le toit est réparé, la toux passe. À son retour, {deux} trouve {un} sous la véranda, avec {parent}, comme s’ils l’attendaient depuis le début. Personne ne dit merci. Ce n’est pas le genre de la maison.',
        effets: { deux: [{ stat: 'jauges.ryo', delta: -30 }, { stat: 'social.reputation', delta: 2 }], un: [{ stat: 'social.loyaute', delta: 3 }] },
        lien: { les2: { loyaute: 5, confiance: 3 } },
        accord: 3,
      },
      {
        cle: 'rester+rester',
        texte: '« Je reste. » « Non, moi. » La dispute dure jusqu’à minuit, sous les gouttes qui tombent dans les bassines. C’est {parent} qui tranche, de son lit, d’une voix rauque : « Partez tous les deux, ou je me lève pour vous jeter dehors. » Vous partez. Vous écrivez tous les jours.',
        lien: { les2: { loyaute: 6, peur_de_perdre: 3 } },
        accord: 3,
      },
      {
        cle: 'toit+toit',
        texte: 'Deux jours sur le toit, sous la pluie, à vous passer les tuiles en vous insultant gentiment comme quand vous étiez petits. Le troisième jour, il ne fuit plus. {parent} vous regarde redescendre, trempés, et sourit pour la première fois de la semaine. « Maintenant, allez-y. »',
        lien: { les2: { confiance: 5, loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'toit_famille', texte: 'Le toit de la maison réparé à deux sous la pluie, comme quand vous étiez petits.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'forcer+*',
        texte: '{un} soulève {parent} comme un sac de riz, malgré ses protestations, et l’emmène chez le médecin. C’est une pneumonie, attrapée à temps. {parent} ne vous adresse plus la parole pendant trois jours, puis vous fait votre plat préféré la veille de votre départ.',
        effets: { un: [{ stat: 'attributs.charisme', delta: 1 }] },
        lien: { deux: { respect: 4 } },
        accord: 3,
      },
      {
        cle: 'defaut',
        texte: 'Personne ne tranche, et le jour du départ arrive. Vous partez tous les deux, avec une boule dans la gorge. À votre retour, la toux est passée toute seule. Le toit fuit toujours.',
        lien: { les2: { confiance: 1 } },
        accord: 1,
      },
    ],
  },
  {
    id: 'mc_cx_enfant_suit',
    titre: 'L’élève qui vous suit',
    age: { min: 22, max: 34 },
    tirage: 0.75,
    texte:
      'À deux heures du village, sur la route d’une mission de rang B, {un} s’arrête net. Derrière un tronc, une capuche trop grande et des sandales de l’Académie : un gamin de neuf ans vous suit depuis la porte. Il veut voir « des vrais ninjas ». La mission ne peut pas attendre.',
    choix: [
      { id: 'ramener', texte: 'Le ramener au village, quitte à rater la mission', famille: 'proteger' },
      { id: 'emmener', texte: 'L’emmener, et le garder à l’œil', famille: 'agir' },
      { id: 'faire_peur', texte: 'Lui faire tellement peur qu’il rentre en courant', famille: 'parler' },
      { id: 'clone', texte: 'Le confier à un clone qui le raccompagne', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'clone+*',
        texte: 'Un clone de {un} le prend par la main et repart vers le village, en lui racontant des histoires de missions inventées. Le vrai {un} sent, deux heures plus tard, le clone se dissiper à la porte, avec une dernière image : le gamin qui fait le salut des ninjas, très sérieux. La mission est un peu plus dure avec un peu moins de chakra. Ça valait le coup.',
        lien: { deux: { respect: 4 } },
        effets: { un: [{ stat: 'social.reputation', delta: 2 }] },
        accord: 3,
      },
      {
        cle: 'ramener+ramener',
        texte: 'Vous faites demi-tour tous les deux, sans même vous consulter. La mission est confiée à une autre équipe, et le commandant vous passe un savon mémorable. Le gamin, lui, vous attend à la sortie du bureau chaque matin pendant un mois, avec du thé.',
        effets: { les2: [{ stat: 'social.reputation', delta: -2 }] },
        lien: { les2: { confiance: 5, loyaute: 3 } },
        accord: 4,
        souvenir: { id: 'gamin_capuche', texte: 'Le gamin à la capuche trop grande, et son thé tous les matins.', poids: 3, tonalite: 'chaud' },
      },
      {
        cle: 'emmener+faire_peur',
        texte: '{deux} prend sa voix de tueur et raconte au gamin ce qui arrive aux enfants dans la forêt. {un} soupire, prend le gamin sur ses épaules et l’emmène quand même. Il voit des vrais ninjas, ce jour-là : deux adultes qui se disputent sur la pédagogie pendant six heures.',
        lien: { les2: { rivalite: 3, confiance: 2 } },
        accord: 2,
      },
      {
        cle: 'emmener+emmener',
        texte: 'Vous l’emmenez, et chacun de vous le surveille si fort que vous finissez par en oublier l’ennemi. C’est le gamin qui crie le premier : « Là, dans l’arbre ! » Vous avez failli ne pas le voir. Au retour, il est insupportable de fierté. Vous aussi, un peu.',
        lien: { les2: { confiance: 4 } },
        effets: { les2: [{ stat: 'social.reputation', delta: 1 }] },
        accord: 4,
        souvenir: { id: 'gamin_capuche', texte: 'Le gamin qui a repéré l’ennemi avant vous.', poids: 3, tonalite: 'fier' },
      },
      {
        cle: 'defaut',
        texte: 'Le temps de vous décider, le gamin décide pour vous : il trébuche, se tord la cheville, et pleure. Vous le ramenez à tour de rôle sur votre dos, et la mission part sans vous.',
        lien: { les2: { confiance: 2 } },
        accord: 2,
      },
    ],
  },
  {
    id: 'mc_cx_shogi',
    titre: 'La partie du jeudi',
    age: { min: 28, max: 46 },
    tirage: 0.8,
    texte: (c) =>
      souvenu(c, 'shogi')
        ? 'Jeudi soir, et le plateau de shōgi est déjà sorti. Ça fait des années maintenant : un thé, une partie, et tout ce qu’on ne se dit pas ailleurs. Ce soir, la partie est serrée, et vous sentez tous les deux que l’autre a une chose à dire.'
        : 'Un jeudi soir, dans une maison de thé presque vide, {un} sort un vieux plateau de shōgi d’un tiroir. « Une partie ? Juste une. » C’est comme ça que commencent les traditions : par une partie qui ne devait être que la seule.',
    choix: [
      { id: 'serieux', texte: 'Jouer pour gagner, sans pitié', famille: 'agir' },
      { id: 'perdre', texte: 'Laisser gagner l’autre, discrètement', famille: 'proteger' },
      { id: 'confier', texte: 'Poser une pièce, et dire enfin ce qui te pèse', famille: 'parler' },
      { id: 'lire', texte: 'Regarder ses mains plus que le plateau', famille: 'observer' },
    ],
    issues: [
      {
        cle: 'perdre+perdre',
        texte: 'Vous jouez tous les deux si mal, si visiblement exprès, que la partie dure trois heures et ne se termine jamais. À la fin, {un} éclate de rire, {deux} aussi, et la serveuse vous demande de partir. Vous revenez le jeudi suivant.',
        lien: { les2: { confiance: 5, loyaute: 3 } },
        accord: 4,
        souvenir: { id: 'shogi', texte: 'Les parties du jeudi, et celle que vous avez perdue exprès tous les deux.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'serieux+serieux',
        texte: 'Une vraie partie, la plus belle depuis des années. Deux heures de silence. {un} gagne d’un coup, à la toute fin, et {deux} reste longtemps à regarder le plateau. « Encore. » Vous jouez jusqu’à l’aube.',
        lien: { les2: { respect: 5, rivalite: 2 } },
        effets: { les2: [{ stat: 'attributs.intellect', delta: 2 }] },
        accord: 3,
        souvenir: { id: 'shogi', texte: 'Les parties du jeudi, et celle qui a duré jusqu’à l’aube.', poids: 3, tonalite: 'fier' },
      },
      {
        cle: 'confier+lire',
        texte: '{deux} a vu les mains de {un} trembler sur la pièce avant même que {un} ouvre la bouche. Alors quand {un} commence, {deux} ne dit rien, pose son propre roi sur le côté, et écoute. Ce soir-là, la partie n’a pas de gagnant.',
        lien: { un: { confiance: 6, dependance: 2 }, deux: { loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'shogi', texte: 'Le jeudi où le roi a été posé sur le côté, et où l’un a enfin parlé.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'confier+serieux',
        texte: '{un} parle. {deux} joue, écoute à moitié, et gagne. Ce n’est qu’en rentrant, dans la rue, que {deux} comprend ce qui a été dit, s’arrête net, et fait demi-tour. Mais {un} est déjà rentré.',
        lien: { un: { ressentiment: 3 }, deux: { peur_de_perdre: 4 } },
        accord: 1,
      },
      {
        cle: 'confier+confier',
        texte: 'Vous ouvrez la bouche en même temps, vous vous arrêtez en même temps. Puis vous riez. « Toi d’abord. » « Non, toi. » Le thé refroidit, le plateau reste figé au vingtième coup. Il l’est encore, dans un tiroir, pour le jour où vous voudrez finir.',
        lien: { les2: { confiance: 7 } },
        accord: 5,
        souvenir: { id: 'shogi', texte: 'La partie arrêtée au vingtième coup, le soir où vous avez parlé tous les deux.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'defaut',
        texte: 'Une partie ordinaire, gagnée par {un}, perdue par {deux} sans regret. Il y a des soirs où c’est exactement ce qu’il faut : rien de plus qu’un thé, un plateau, et quelqu’un en face.',
        lien: { les2: { confiance: 3 } },
        accord: 2,
        souvenir: { id: 'shogi', texte: 'Les parties du jeudi.', poids: 2, tonalite: 'chaud' },
      },
    ],
  },

  // ── Vétérans et anciens ──
  {
    id: 'mc_cx_equipe_commune',
    titre: 'Trois genin pour deux sensei',
    age: { min: 40, max: 58 },
    tirage: 0.8,
    texte:
      'Le {kage} vous a confié, à tous les deux, une équipe de trois genin que personne ne voulait : une tête brûlée, un garçon qui ne parle pas, et une fille qui triche à tout. Après une semaine, ils vous ont déjà ridiculisés deux fois. Ce soir, ils attendent, sur le terrain d’entraînement, de voir ce que vous allez faire.',
    choix: [
      { id: 'severe', texte: 'Les faire courir jusqu’à ce qu’ils tombent', famille: 'agir' },
      { id: 'clochettes', texte: 'Le vieux test des clochettes', famille: 'observer' },
      { id: 'histoires', texte: 'Leur raconter vos propres échecs, à deux', famille: 'parler' },
      { id: 'repas', texte: 'Les emmener manger, et ne rien exiger', famille: 'proteger' },
    ],
    issues: [
      {
        cle: 'histoires+histoires',
        texte: 'Vous leur racontez tout : le stand de kunai raté, les disputes, les nuits blanches, les fois où l’un a dû porter l’autre. Les trois genin vous écoutent bouche bée. La tricheuse finit par demander : « Et vous vous êtes jamais lâchés ? » Vous vous regardez. « Non. » Le lendemain, ils arrivent à l’heure. Tous les trois.',
        lien: { les2: { loyaute: 5, confiance: 4 } },
        effets: { les2: [{ stat: 'social.reputation', delta: 3 }] },
        accord: 5,
        souvenir: { id: 'trois_genin', texte: 'Les trois genin qui écoutaient votre histoire, bouche bée.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'clochettes+severe',
        texte: '{un} sort deux clochettes ; {deux} annonce que ceux qui n’en auront pas courront toute la nuit. Les trois genin se regardent, comprennent en une seconde, et vous attaquent ensemble. Vous perdez les clochettes. Vous ne leur dites pas que c’était le but. Vous ne vous le dites pas non plus.',
        lien: { les2: { respect: 4, confiance: 3 } },
        effets: { les2: [{ stat: 'social.reputation', delta: 2 }] },
        accord: 4,
      },
      {
        cle: 'repas+severe',
        texte: '{deux} les fait courir jusqu’à la nuit. {un} les attend à l’arrivée avec des brochettes. Les genin comprennent très vite qui est le gentil et qui est le méchant, et ils ont tort sur les deux, mais ça marche. Le soir, en rentrant, {deux} grogne : « Pourquoi c’est toujours moi le méchant ? »',
        lien: { les2: { confiance: 3, rivalite: 2 } },
        accord: 3,
      },
      {
        cle: 'repas+repas',
        texte: 'Vous les emmenez tous les trois manger, sans un mot sur l’entraînement. Le garçon qui ne parle pas ouvre la bouche pour la première fois au troisième bol, pour demander s’il peut en avoir un quatrième. C’est un début.',
        lien: { les2: { confiance: 4 } },
        accord: 3,
      },
      {
        cle: 'defaut',
        texte: 'Vous n’êtes pas d’accord sur la méthode, et les genin le voient tout de suite. Ils en profitent, pendant des mois. Puis un jour, en mission, ils vous obéissent à tous les deux en même temps, sans réfléchir, et vous comprenez qu’ils avaient compris avant vous.',
        lien: { les2: { respect: 3, rivalite: 2 } },
        accord: 2,
      },
    ],
  },
  {
    id: 'mc_cx_banc',
    titre: 'Le banc devant l’Académie',
    age: { min: 58, max: 90 },
    tirage: 0.85,
    texte: (c) =>
      `Le banc devant l’Académie, à l’heure où les enfants sortent. Vous vous y asseyez presque chaque jour, maintenant, avec vos genoux qui grincent et vos cannes appuyées l’une contre l’autre. Une petite fille passe en courant, un kunai en bois à la main.${souvenu(c, 'masque_renard') ? ' Elle porte un masque de renard sur le côté de la tête.' : ''}`,
    choix: [
      { id: 'raconter', texte: 'Lui raconter une histoire de votre jeunesse', famille: 'parler' },
      { id: 'compter', texte: 'Compter tous ceux qui ne sont plus là', famille: 'observer' },
      { id: 'main', texte: 'Poser ta main sur celle de l’autre', famille: 'proteger' },
      { id: 'defier', texte: 'Lancer un dernier défi : qui se lève le premier', famille: 'agir' },
    ],
    issues: [
      {
        cle: 'defier+defier',
        texte: '« Le premier debout. » « Tenu. » Vous vous agrippez à vos cannes, grimaçant, soufflant, sous les yeux d’une dizaine d’enfants qui vous encouragent en hurlant. Égalité. Vous retombez sur le banc en même temps, hilares, et un gamin conclut, très grave : « Vous êtes nuls. » Vous ne l’avez jamais été autant, ni aussi heureux.',
        lien: { les2: { confiance: 4, rivalite: 2 } },
        accord: 4,
        souvenir: { id: 'banc', texte: 'Le dernier défi sur le banc de l’Académie : égalité.', poids: 4, tonalite: 'chaud' },
      },
      {
        cle: 'raconter+*',
        texte: (
          'La petite fille s’arrête, méfiante, puis s’assoit par terre devant vous. {un} raconte. {deux} corrige tous les détails, et {un} corrige les corrections. Au bout d’une heure, il y a douze enfants assis par terre. Ils ne croient pas un mot de l’histoire. C’est pourtant la seule vraie que vous ayez jamais racontée.'
        ),
        lien: { les2: { loyaute: 3, confiance: 3 } },
        effets: { les2: [{ stat: 'social.reputation', delta: 2 }] },
        accord: 3,
        souvenir: { id: 'banc', texte: 'L’histoire racontée aux enfants sur le banc, et qu’ils n’ont pas crue.', poids: 4, tonalite: 'fier' },
      },
      {
        cle: 'main+main',
        texte: 'Vos mains se trouvent au milieu du banc, sans que vous ayez besoin de regarder. Vous restez comme ça jusqu’à ce que la cour soit vide, et que le gardien vienne fermer la grille. Il vous connaît. Il attend, sans rien dire, que vous ayez fini.',
        lien: { les2: { confiance: 6, peur_de_perdre: 3 } },
        accord: 5,
        souvenir: { id: 'banc', texte: 'Vos mains au milieu du banc, jusqu’à ce que la cour soit vide.', poids: 5, tonalite: 'chaud' },
      },
      {
        cle: 'compter+*',
        texte: '{un} compte à voix basse, sur ses doigts. Il en faut deux mains, puis trois. {deux} ne dit rien, puis ajoute un nom que {un} avait oublié, et encore un autre. Vous restez là, à vous les rendre tous un par un. Il vous en reste encore un : l’autre.',
        lien: { les2: { peur_de_perdre: 5, loyaute: 3 } },
        accord: 3,
        souvenir: { id: 'banc', texte: 'Le soir où vous avez compté ensemble ceux qui ne sont plus là.', poids: 4, tonalite: 'tragique' },
      },
      {
        cle: 'defaut',
        texte: 'Les enfants sortent, la petite fille passe, le soleil tourne. Vous ne dites rien, ni l’un ni l’autre. Vous n’en avez plus besoin depuis longtemps.',
        lien: { les2: { confiance: 3 } },
        accord: 2,
      },
    ],
  },
];
