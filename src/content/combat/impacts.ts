/**
 * Ce que devient un corps qui encaisse : où il tombe, contre quoi il s'écrase, selon le lieu du combat.
 * Et ce que devient une technique selon la distance (de loin, au corps à corps), et quand on la ressert
 * une troisième fois à quelqu'un qu'on a le droit de tuer.
 * {il}, {Il}, {lui}, {e} s'accordent à l'adversaire. Les lignes « groupe » parlent d'une escouade.
 */

export type Terrain =
  | 'foret'
  | 'rue'
  | 'terrain'
  | 'cour'
  | 'interieur'
  | 'forge'
  | 'porte'
  | 'plaine'
  | 'desert'
  | 'ruines'
  | 'cotes'
  | 'montagne'
  | 'neige'
  | 'marche'
  | 'temple'
  | 'route'
  | 'quai'
  | 'roche';

/** La scène d'un lieu (sa première partie) donne son terrain ; un village donne le sien. */
export const TERRAIN_DE_SCENE: Record<string, Terrain> = {
  foret: 'foret',
  frontiere: 'plaine',
  desert: 'desert',
  ruines: 'ruines',
  cotes: 'cotes',
  montagne: 'montagne',
  carriere: 'roche',
  neige: 'neige',
  marche: 'marche',
  temple: 'temple',
  route: 'route',
  academie: 'cour',
  terrain: 'terrain',
  maison: 'interieur',
  forge: 'forge',
  porte: 'porte',
  village_feu: 'rue',
  village_vent: 'rue',
  village_brume: 'quai',
  village_foudre: 'montagne',
  village_terre: 'roche',
};

export interface Impacts {
  /** Un coup qui porte : on recule, on tombe, on se relève. */
  leger: string[];
  /** Un coup qui projette : contre un arbre, un mur, à travers quelque chose. */
  lourd: string[];
  /** Contre une escouade. */
  groupe: string[];
}

/** Les chutes valables partout : elles se mêlent à celles du lieu. */
export const CHUTES: Impacts = {
  leger: [
    '{Il} part en arrière et s’écrase sur le dos. L’air sort de ses poumons d’un coup.',
    '{Il} roule trois fois sur le sol avant de réussir à se rattraper d’une main.',
    'Ses pieds quittent le sol. {Il} retombe sur l’épaule, et quelque chose craque.',
    '{Il} glisse sur plusieurs mètres, les talons labourant la terre.',
    '{Il} tombe à plat ventre, se redresse sur les coudes, et crache de la poussière.',
    '{Il} pivote sous l’impact et s’effondre de côté, la joue contre le sol.',
    '{Il} recule en titubant, cherche un appui qui n’existe pas, et s’assied lourdement.',
    'Ses jambes se dérobent. {Il} tombe d’un bloc, comme un sac qu’on lâche.',
  ],
  lourd: [
    '{Il} décolle littéralement, fait un tour complet en l’air, et s’écrase face contre terre.',
    '{Il} rebondit une fois sur le sol, puis une deuxième, et ne bouge plus pendant une longue seconde.',
    'Le choc le cloue au sol. Un cratère peu profond se dessine autour de ses épaules.',
    '{Il} est projeté si loin que tu le perds de vue un instant dans la poussière.',
  ],
  groupe: [
    'Deux d’entre eux sont fauchés d’un coup et roulent l’un sur l’autre.',
    'Le premier rang s’effondre ; ceux de derrière trébuchent sur les corps.',
    'Leur formation éclate : chacun tombe de son côté.',
  ],
};

export const IMPACTS: Record<Terrain, Impacts> = {
  foret: {
    leger: [
      '{Il} recule dans les fougères et se rattrape à une branche basse, qui casse.',
      '{Il} trébuche sur une racine et tombe dans l’humus, le visage plein de feuilles mortes.',
      'Son dos heurte un tronc. Une pluie d’aiguilles de pin lui tombe dessus.',
    ],
    lourd: [
      '{Il} est projeté contre un chêne. L’écorce éclate sous son dos, et {il} glisse le long du tronc jusqu’aux racines.',
      '{Il} traverse un buisson, puis un deuxième, et s’arrête contre un arbre dans un craquement de branches. Ou d’os.',
      'Le coup l’envoie dans les airs. {Il} percute une grosse branche, s’y plie en deux, et retombe trois mètres plus bas.',
      '{Il} s’écrase contre un cèdre si fort que tout l’arbre tremble. Des oiseaux s’envolent au-dessus de vous.',
      '{Il} heurte un tronc mort, qui se brise en deux et s’effondre sur {lui}.',
    ],
    groupe: ['Ils sont projetés entre les arbres, et tu entends les troncs les arrêter, un par un.', 'L’un d’eux finit plié autour d’une branche ; un autre disparaît dans les fougères.'],
  },
  rue: {
    leger: [
      '{Il} recule contre un étal, qui se renverse. Des pommes roulent sur les pavés.',
      '{Il} glisse sur les pavés et s’arrête contre une marche de pierre.',
      'Son épaule heurte une lanterne de papier, qui s’écrase avec {lui}.',
    ],
    lourd: [
      '{Il} est projeté contre un mur. Le crépi éclate en étoile autour de son corps, et {il} glisse jusqu’au sol en laissant une traînée rouge.',
      '{Il} traverse une cloison de papier, puis une deuxième. Quelque part dans la maison, quelqu’un hurle.',
      '{Il} percute un poteau de bois, qui se fend sur toute sa hauteur.',
      '{Il} défonce la devanture d’une échoppe. Des bols de céramique explosent tout autour de {lui}.',
      'Le coup l’envoie sur un toit. {Il} roule sur les tuiles, en arrache une dizaine, et retombe dans la ruelle de l’autre côté.',
    ],
    groupe: ['Ils sont projetés contre les façades ; des volets claquent, des gens crient derrière.', 'L’un d’eux traverse une vitrine ; les autres s’écrasent contre le mur d’en face.'],
  },
  terrain: {
    leger: [
      '{Il} recule jusqu’à un poteau d’entraînement et s’y cogne l’arrière du crâne.',
      '{Il} glisse dans l’herbe arrachée et laisse un sillon de terre derrière {lui}.',
      '{Il} tombe au pied d’une cible, au milieu des kunai plantés des autres.',
    ],
    lourd: [
      '{Il} est projeté contre un poteau, qui se brise net. {Il} reste couché au milieu des échardes.',
      '{Il} traverse la palissade du terrain. Une planche entière part avec {lui}.',
      '{Il} percute le grand arbre au bord du terrain. Le tronc garde la forme de son dos.',
      '{Il} s’écrase dans le petit étang derrière les cibles, et en ressort en crachant de l’eau et du sang.',
    ],
    groupe: ['Les poteaux d’entraînement tombent avec eux, un par un, comme des dominos.'],
  },
  cour: {
    leger: [
      '{Il} recule contre la balançoire de la cour, qui grince et repart toute seule.',
      '{Il} tombe sur le gravier de la cour ; ses paumes s’ouvrent sur les cailloux.',
      'Son dos heurte la rambarde du préau.',
    ],
    lourd: [
      '{Il} s’écrase contre le mur de l’Académie. Une fenêtre éclate au-dessus de {lui}, et les élèves derrière reculent en criant.',
      '{Il} percute le tronc du vieil arbre de la cour. Les feuilles tombent sur {lui} comme une neige verte.',
      '{Il} traverse la porte coulissante d’une salle de classe et finit au milieu des pupitres renversés.',
    ],
    groupe: ['Ils roulent sur le gravier de la cour, et les élèves aux fenêtres retiennent leur souffle.'],
  },
  interieur: {
    leger: [
      '{Il} recule et renverse la table basse. Le thé se répand sur le tatami.',
      '{Il} trébuche sur un coussin et tombe contre l’alcôve.',
      'Son épaule défonce la cloison de papier sans s’arrêter.',
    ],
    lourd: [
      '{Il} traverse le mur. Pas la cloison : le mur. Tu le vois rouler dans la pièce d’à côté, au milieu des débris.',
      '{Il} s’écrase contre une poutre maîtresse. Toute la maison gémit.',
      '{Il} est projeté par la fenêtre et retombe dans le jardin, au milieu des éclats de bois.',
    ],
    groupe: ['La pièce est trop petite pour eux tous : ils s’écrasent les uns contre les autres et contre les murs.'],
  },
  forge: {
    leger: [
      '{Il} recule contre l’enclume et se cogne la hanche contre le métal froid.',
      '{Il} renverse le râtelier. Une dizaine de lames tombent avec un bruit de cloches.',
      '{Il} glisse dans la poussière de charbon et se relève noir jusqu’aux yeux.',
    ],
    lourd: [
      '{Il} est projeté contre le foyer. Ses manches prennent feu, et {il} hurle en se roulant par terre.',
      '{Il} s’écrase sur l’enclume. Le bruit est celui d’un marteau qui tombe sur de la viande.',
      '{Il} percute le soufflet de forge, qui crache une gerbe d’étincelles sur {lui}.',
    ],
    groupe: ['Les outils pendus au mur tombent sur eux en pluie d’acier.'],
  },
  porte: {
    leger: [
      '{Il} recule contre un des battants de la grande porte, qui résonne comme un tambour.',
      '{Il} roule dans la poussière du chemin, sous le regard des gardes.',
    ],
    lourd: [
      '{Il} s’écrase contre la grande porte. Le bois massif tremble sur ses gonds.',
      '{Il} est projeté contre la palissade. Deux pieux cèdent sous son poids.',
      '{Il} percute la guérite des gardes, qui s’effondre à moitié sur {lui}.',
    ],
    groupe: ['Ils s’écrasent contre la porte, et les gardes au-dessus n’osent pas bouger.'],
  },
  plaine: {
    leger: [
      '{Il} tombe dans les hautes herbes, qui se referment au-dessus de {lui}.',
      '{Il} glisse dans la boue d’un vieux fossé.',
      '{Il} trébuche sur une lance rouillée, plantée là depuis une autre guerre.',
    ],
    lourd: [
      '{Il} est projeté contre un rocher isolé. La pierre ne bouge pas. {Lui} si.',
      '{Il} percute un vieux casque abandonné dans l’herbe et roule par-dessus, sur dix mètres.',
      '{Il} s’écrase dans un ancien cratère de bataille et disparaît un instant au fond.',
    ],
    groupe: ['Ils roulent dans l’herbe haute, et la plaine les avale.'],
  },
  desert: {
    leger: [
      '{Il} recule et le sable cède sous ses talons. {Il} glisse sur le flanc de la dune.',
      '{Il} tombe dans le sable brûlant et se relève en grimaçant, les paumes rouges.',
      'Une gerbe de sable lui gicle au visage quand {il} s’écrase au sol.',
    ],
    lourd: [
      '{Il} est projeté par-dessus la crête de la dune et dévale l’autre versant dans une avalanche de sable.',
      '{Il} s’écrase contre un rocher de grès, qui se fend en deux.',
      '{Il} s’enfonce dans le sable jusqu’à la taille sous l’impact, comme un piquet qu’on enfonce.',
    ],
    groupe: ['Ils sont projetés dans le sable, et la dune s’effondre sur eux.'],
  },
  ruines: {
    leger: [
      '{Il} recule contre une colonne brisée et s’y écorche le dos.',
      '{Il} trébuche sur des gravats et tombe dans une flaque d’eau de pluie.',
    ],
    lourd: [
      '{Il} est projeté contre un mur déjà fissuré, qui finit de s’effondrer sur {lui}.',
      '{Il} traverse ce qui restait d’une fenêtre, et retombe deux étages plus bas dans les décombres.',
      '{Il} percute une poutre de fer tordue. Le métal résonne longtemps après.',
    ],
    groupe: ['Les ruines s’écroulent sur eux un peu plus. Tu ne sais pas combien en sortiront.'],
  },
  cotes: {
    leger: [
      '{Il} recule sur les galets mouillés, glisse et tombe dans l’écume.',
      '{Il} roule sur le sable noir jusqu’à la ligne des vagues.',
    ],
    lourd: [
      '{Il} est projeté contre un récif. Les coquillages lui ouvrent le dos comme des lames.',
      '{Il} s’écrase contre la coque d’une épave, qui s’effondre en un nuage de bois pourri.',
      'Le coup l’envoie dans les vagues. {Il} disparaît sous l’eau noire, et refait surface beaucoup plus loin.',
    ],
    groupe: ['La mer reprend ceux qui tombent ; les autres s’écrasent contre les rochers.'],
  },
  montagne: {
    leger: [
      '{Il} recule sur la pente et des cailloux roulent sous ses pieds, jusqu’au vide.',
      '{Il} tombe contre la paroi et s’y rattrape des ongles.',
    ],
    lourd: [
      '{Il} s’écrase contre la paroi rocheuse. Une pluie de pierres tombe sur {lui}.',
      '{Il} est projeté au bord du précipice. Ses doigts accrochent la roche au dernier moment ; ses jambes pendent dans le vide.',
      '{Il} dévale la pente sur vingt mètres, rebondissant d’un rocher à l’autre.',
    ],
    groupe: ['Ils dévalent la pente dans un éboulement, et le bruit monte longtemps de la vallée.'],
  },
  neige: {
    leger: [
      '{Il} tombe dans la neige, qui s’ouvre sous {lui} jusqu’aux épaules.',
      '{Il} glisse sur une plaque de glace et se rattrape à genoux, les mains brûlées par le froid.',
    ],
    lourd: [
      '{Il} est projeté contre un pin chargé de neige. Tout le poids de l’arbre s’effondre sur {lui}.',
      '{Il} s’écrase sur la glace d’un lac gelé, qui craque en étoile sous son dos.',
      '{Il} roule dans la pente et devient une boule de neige qui s’arrête, très loin, contre un rocher.',
    ],
    groupe: ['Ils tombent dans la neige profonde ; le blanc se tache de rouge là où ils se débattent.'],
  },
  marche: {
    leger: [
      '{Il} recule contre un tonneau de sel, qui se renverse sur {lui}.',
      '{Il} tombe au milieu d’un étal de poissons. Le marchand l’insulte avant même de comprendre.',
    ],
    lourd: [
      '{Il} est projeté contre une charrette, qui se renverse dans un fracas de bois et de légumes.',
      '{Il} traverse la tente d’un marchand d’étoffes et finit emmêlé dans la soie.',
      '{Il} s’écrase contre le puits de la place. La margelle se fend.',
    ],
    groupe: ['Ils renversent trois étals en tombant ; la foule s’écarte en hurlant.'],
  },
  temple: {
    leger: [
      '{Il} recule et renverse un brûle-parfum. La fumée l’enveloppe.',
      '{Il} trébuche sur les marches moussues et tombe à genoux devant l’autel.',
    ],
    lourd: [
      '{Il} est projeté contre une statue de pierre. La tête de la statue roule à côté de la sienne.',
      '{Il} percute un pilier laqué, qui se fend dans un craquement de bois ancien.',
      '{Il} traverse le paravent sacré et s’écrase contre la cloche du temple, qui sonne une seule fois.',
    ],
    groupe: ['Ils tombent entre les statues ; certaines tombent avec eux.'],
  },
  route: {
    leger: [
      '{Il} recule dans le fossé et s’y étale dans l’eau boueuse.',
      '{Il} tombe sur les ornières de la route, là où passent les charrettes.',
    ],
    lourd: [
      '{Il} est projeté contre une borne de pierre, qui le plie en deux.',
      '{Il} s’écrase contre un arbre au bord de la route. Le panneau de bois cloué dessus tombe sur {lui}.',
      '{Il} percute la roue d’une charrette abandonnée, qui se brise sous son poids.',
    ],
    groupe: ['Ils tombent dans le fossé, les uns sur les autres.'],
  },
  quai: {
    leger: [
      '{Il} recule sur les planches mouillées du quai et glisse jusqu’au bord.',
      '{Il} tombe contre un tas de filets de pêche et s’y emmêle.',
    ],
    lourd: [
      '{Il} est projeté du quai et s’écrase dans l’eau glacée. La brume l’avale.',
      '{Il} percute un mât d’amarrage. Le bois résonne, {lui} non.',
      '{Il} traverse la cloison d’une remise à bateaux et finit au milieu des rames.',
    ],
    groupe: ['Deux tombent à l’eau ; les autres s’écrasent contre les pilotis.'],
  },
  roche: {
    leger: [
      '{Il} recule contre la roche et s’y écorche les bras.',
      '{Il} tombe sur les éclats de pierre ; sa peau s’ouvre à dix endroits.',
    ],
    lourd: [
      '{Il} s’écrase contre la paroi de la carrière. Une fissure part de son dos et monte jusqu’en haut.',
      '{Il} est projeté contre un pilier de pierre taillée, qui se brise net.',
      '{Il} percute un wagonnet de minerai, qui part tout seul sur ses rails avec {lui} dedans.',
    ],
    groupe: ['Ils s’écrasent contre la roche, et l’écho répète leurs chocs.'],
  },
};

export interface TexteTechnique {
  /** Lancée de loin. */
  loin?: string[];
  /** Au corps à corps : la technique change de nature quand on touche l'autre. */
  proche?: string[];
  /** Troisième usage, dans un combat où l'on peut tuer : ce qu'elle finit par faire à un corps. */
  sombre?: string[];
}

/** Par nature ou par famille : le repli de toutes les techniques qui n'ont pas leurs propres lignes. */
export const TEXTES_GROUPE: Record<string, TexteTechnique> = {
  katon: {
    loin: ['Le feu traverse le terrain et l’enveloppe. L’odeur de cheveux brûlés monte jusqu’à toi.', 'Les flammes le rattrapent alors qu’{il} saute. Ses vêtements fument.'],
    proche: ['À cette distance, le feu ne lui laisse rien : tu le craches droit dans son visage. {Il} hurle et recule, les mains sur les yeux.', 'Tu ouvres la bouche à un souffle de {lui}. Le feu lui mange la joue et l’oreille.'],
    sombre: [
      'Troisième fois. Le feu ne prend plus seulement ses vêtements : il prend sa peau, qui se boursoufle et noircit. {Il} se roule par terre, et l’odeur te restera longtemps.',
      'Le feu le recouvre une troisième fois. Quand il retombe, ses mains ne ressemblent plus à des mains. {Il} les regarde sans comprendre.',
    ],
  },
  suiton: {
    loin: ['L’eau le frappe comme un mur et le renverse.', 'Le jet d’eau l’atteint en pleine poitrine ; {il} recule, trempé{e}, sans souffle.'],
    proche: ['Tu lui plaques l’eau contre le visage, à pleines mains. {Il} se noie debout, une seconde, deux secondes.', 'Au contact, l’eau s’engouffre dans sa bouche et son nez. {Il} recule en toussant.'],
    sombre: [
      'Troisième fois. L’eau entre dans ses poumons et n’en ressort pas. {Il} se tord au sol, les doigts dans la gorge, et ce qui sort de sa bouche est rose.',
      'L’eau se referme sur sa tête une troisième fois. Quand elle retombe, {il} respire encore. Mal. Ses yeux ne voient plus vraiment.',
    ],
  },
  fuuton: {
    loin: ['Le vent l’atteint de loin et ouvre sa veste, puis sa peau, d’une seule ligne.', 'La lame d’air le fauche aux jambes.'],
    proche: ['À bout portant, le vent n’est plus une lame : c’est cent. Ses avant-bras s’ouvrent en lanières.', 'Tu relâches le vent contre son ventre. {Il} est soulevé et plié en deux.'],
    sombre: [
      'Troisième fois. Le vent passe à travers {lui} comme à travers un drap. Il emporte deux doigts, et une partie de son oreille.',
      'La troisième lame trouve le tendon derrière son genou. {Il} ne marchera plus jamais droit. {Il} le sait déjà.',
    ],
  },
  raiton: {
    loin: ['La foudre court dans le sol et remonte par ses pieds. Ses muscles se tétanisent.', 'L’éclair le touche de loin ; ses cheveux se dressent, ses dents claquent.'],
    proche: ['Au contact, tu décharges tout. La foudre entre par sa poitrine et sort par ses talons. {Il} tremble de la tête aux pieds, la bouche ouverte sur un cri qui ne sort pas.'],
    sombre: [
      'Troisième décharge. Ses yeux roulent en arrière. Quand {il} tombe, {il} respire encore, mais il n’y a plus personne derrière son regard. Le courant a grillé ce qu’il y avait dans sa tête.',
      'La foudre le traverse une troisième fois. Une odeur de viande cuite. {Il} est vivant{e}. {Il} ne parlera plus, ne marchera plus. Un légume qui respire.',
    ],
  },
  doton: {
    loin: ['La terre se soulève sous ses pieds et le jette en l’air.', 'Des pointes de roche jaillissent autour de {lui} ; l’une lui ouvre la cuisse.'],
    proche: ['Tu frappes le sol à ses pieds. La roche se referme sur ses chevilles comme deux mâchoires.', 'Au contact, ton poing durci de roche lui écrase les côtes.'],
    sombre: [
      'Troisième fois. La roche se referme sur sa jambe, et ne la lâche plus. Tu entends l’os céder dans la pierre.',
      'La terre l’enserre jusqu’à la poitrine une troisième fois, et serre. {Il} ne peut plus crier : il n’a plus de place pour respirer.',
    ],
  },
  taijutsu: {
    loin: ['Tu réduis la distance en un souffle et ton coup arrive avant ton ombre.'],
    proche: ['Ton coup le cueille en plein visage. Son nez s’écrase sous tes phalanges.', 'Ton genou monte dans son ventre. {Il} se plie en deux et vomit de la bile.', 'Ton coude trouve sa tempe. Ses yeux se vident une seconde.'],
    sombre: [
      'Le même coup, une troisième fois, au même endroit. Sa mâchoire se décroche avec un bruit mouillé. {Il} ne mangera plus jamais normalement.',
      'Troisième fois au même point. Sa côte cède et rentre. {Il} respire en sifflant, et chaque souffle fait des bulles roses.',
    ],
  },
  genjutsu: {
    loin: ['L’illusion le prend de loin. Ses yeux fixent quelque chose qui n’existe pas.'],
    proche: ['Tu attrapes son regard à un souffle de distance. Tu entres dans sa tête par la porte de devant.'],
    sombre: [
      'Troisième fois dans sa tête. Cette fois, tu n’en ressors pas proprement. Quand l’illusion se dissipe, {il} rit tout seul, doucement, et ne s’arrête plus.',
      'L’illusion revient une troisième fois, et elle reste. {Il} se griffe le visage pour en faire sortir quelque chose.',
    ],
  },
  armes: {
    loin: ['Tes lames partent de loin et trouvent leur place : une à l’épaule, une à la cuisse.'],
    proche: ['Au corps à corps, ta lame entre sous ses côtes et ressort rouge.', 'Tu lui ouvres l’avant-bras du coude au poignet.'],
    sombre: [
      'Troisième fois, la lame trouve le même chemin, plus profond. {Il} regarde ses mains, pleines de ce qui sort de {lui}.',
      'Ta lame entre une troisième fois, dans le genou cette fois. {Il} s’effondre, et ne se relève plus.',
    ],
  },
  medical: {
    proche: ['Ta main brillante l’effleure ; sous la peau, quelque chose se tranche net.'],
    sombre: ['Troisième fois, ta main trouve la colonne. Il n’y a pas de sang. Juste ses jambes qui cessent de lui obéir, pour toujours.'],
  },
  fuinjutsu: {
    loin: ['Le sceau s’embrase à distance, là où tu l’avais collé.'],
    proche: ['Tu plaques le sceau contre sa poitrine et tu claques des doigts.'],
    sombre: ['Le troisième sceau explose contre son flanc. Quand la fumée se lève, son bras n’est plus là.'],
  },
  dojutsu: {
    loin: ['Tes yeux le prennent de loin. {Il} se fige au milieu d’un geste, comme une marionnette dont on a coupé un fil.', 'Ton regard l’atteint avant tes mains. {Il} chancelle, le visage blanc.'],
    proche: ['À un souffle de son visage, tes yeux entrent dans les siens. {Il} hurle sans savoir pourquoi.'],
    sombre: ['Tes yeux le prennent une troisième fois. Ce qui reste derrière les siens n’est plus tout à fait {lui}.'],
  },
  biju: {
    loin: ['Le chakra de la bête part de toi comme une gueule ouverte et le happe de loin.'],
    proche: ['Le chakra de la bête sort par tes mains et le brûle à travers ses vêtements.'],
    sombre: ['La bête frappe une troisième fois à travers toi. Elle aime ça. Le corps devant toi ne ressemble plus à grand-chose.'],
  },
  fusion: {
    loin: ['Ta lignée frappe de loin : ce qui l’atteint n’est ni de l’eau, ni du feu, ni de la terre, et son corps ne sait pas comment s’en protéger.', 'La technique de ton sang l’enveloppe. Là où elle le touche, la peau change de couleur.'],
    proche: ['Au contact, ta lignée se déverse en {lui}. {Il} recule en regardant son bras comme s’il appartenait à quelqu’un d’autre.'],
    sombre: ['Ta lignée le frappe une troisième fois, et ce qu’elle laisse n’a pas de nom dans les manuels de l’Académie.'],
  },
  ninjutsu: {
    loin: ['La technique le frappe de plein fouet.'],
    proche: ['À bout portant, la technique éclate contre son corps.'],
    sombre: ['La technique le frappe une troisième fois, et cette fois quelque chose casse en {lui} qui ne se réparera pas.'],
  },
};

/** Les techniques qui ont leurs propres lignes. */
export const TEXTES_TECHNIQUES: Record<string, TexteTechnique> = {
  // ── Raiton ──
  raiton_etincelles: {
    loin: ['Les étincelles sautent d’arbre en arbre jusqu’à {lui}. Sa main s’engourdit.'],
    proche: ['Tu lui attrapes le poignet et tu lâches les étincelles. Ses doigts s’ouvrent tout seuls et son arme tombe.'],
    sombre: ['Troisième fois. Ses doigts se recroquevillent et ne se rouvrent plus. Sa main restera une griffe.'],
  },
  raiton_decharge: {
    loin: [
      'Tu frappes le sol. La décharge court sur la terre, cherche ses pieds, et remonte. {Il} se fige, chaque muscle tendu comme une corde.',
      'La foudre file au ras du sol, entre les pierres, et lui mord les chevilles. {Il} saute, trop tard.',
    ],
    proche: [
      'Tu poses les deux paumes sur son torse et tu décharges tout. Ses mâchoires se serrent si fort que tu entends ses dents craquer. Son corps entier se cambre.',
      'Au contact, la décharge ne se partage plus avec le sol : elle est toute pour {lui}. {Il} tremble, se mord la langue jusqu’au sang, et tombe raide.',
    ],
    sombre: [
      'Troisième décharge. Ses yeux roulent en arrière et ne redescendent pas. Quand {il} touche le sol, {il} respire encore, mais ses mains bougent toutes seules, et il n’y a plus personne derrière. La foudre a grillé ce qu’il y avait dans sa tête. Tu as fait de {lui} un légume.',
      'La foudre le traverse une troisième fois. De la fumée sort de ses oreilles. {Il} est vivant{e}. {Il} restera allongé{e} le reste de sa vie, à regarder le plafond sans le voir : la foudre a grillé ce qui pensait.',
    ],
  },
  raiton_lance: {
    loin: ['La lance de foudre traverse le terrain et lui perce l’épaule de part en part.'],
    proche: ['Tu enfonces la lance à bout portant. Elle sort dans son dos en crépitant.'],
    sombre: ['La troisième lance traverse sa cuisse et cautérise la plaie en passant. Ça sent la viande grillée. {Il} ne crie même plus.'],
  },
  raiton_tonnerre: {
    proche: ['Ta main chargée traverse sa garde et s’arrête contre son ventre. Le cri des oiseaux couvre le sien.'],
    sombre: ['Troisième fois. Ta main ne s’arrête plus contre son ventre : elle le traverse. Tu sens sa chaleur autour de ton poignet.'],
  },
  raiton_chidori: {
    loin: ['Tu traverses le terrain dans un hurlement d’oiseaux. Il n’y a pas de « loin » avec cette technique.'],
    proche: ['Le Chidori entre dans son épaule. Le bras pend, mort, quand tu retires ta main.'],
    sombre: ['Le troisième Chidori entre dans sa poitrine. Tu sens son cœur battre contre tes doigts. Une fois. Deux. Puis plus rien de régulier.'],
  },
  raiton_lariat: {
    proche: ['Ton bras chargé de foudre le cueille à la gorge. {Il} fait un tour complet en l’air.'],
    sombre: ['Troisième lariat. Sa nuque fait un bruit sec. {Il} tombe et ne bouge plus que les yeux.'],
  },
  // ── Katon ──
  katon_braises: {
    loin: ['Les braises pleuvent sur {lui} ; l’une se loge dans son col et {il} se tord pour la chasser.'],
    proche: ['Tu craches les braises à un souffle de son visage. {Il} recule, aveuglé{e} par les étincelles.'],
    sombre: ['Troisième volée, en plein visage. Une braise s’est logée dans son œil. {Il} ne la sort pas. {Il} ne peut pas.'],
  },
  katon_boule: {
    loin: ['La boule de feu le rattrape en plein saut et l’enveloppe. {Il} retombe en fumant.'],
    proche: ['À cette distance, la boule de feu n’a pas le temps de grossir : elle explose contre {lui}. Ses sourcils, ses cils, ses cheveux disparaissent d’un coup.'],
    sombre: ['La troisième boule de feu le recouvre entièrement. {Il} en sort en courant, en feu, et court encore longtemps après que tu as cessé de regarder.'],
  },
  katon_tempete: {
    loin: ['Le torrent de flammes ne lui laisse aucune issue. {Il} passe à travers en se protégeant le visage, la peau des bras cloquée.'],
    sombre: ['Troisième torrent. Il ne reste du terrain que de la cendre, et une forme noire qui bouge encore un peu.'],
  },
  katon_phenix: {
    loin: ['Il esquive les flammes ; deux shuriken cachés dedans se plantent dans son dos.'],
    proche: ['Tu lâches les fleurs de phénix à bout portant ; les lames chauffées au rouge entrent en grésillant.'],
    sombre: ['Troisième fois. Les lames brûlantes trouvent ses yeux. Il n’y a plus que du noir et de la douleur pour {lui}, et ça restera ainsi.'],
  },
  // ── Suiton ──
  suiton_projectile: {
    loin: ['Le jet d’eau comprimée le frappe au sternum comme un poing de pierre.'],
    proche: ['À bout portant, l’eau comprimée lui brise deux côtes. Tu les entends.'],
    sombre: ['Troisième jet, au même endroit. La cage thoracique cède. {Il} respire à petits coups, et chaque coup est un gémissement.'],
  },
  suiton_prison: {
    proche: ['La sphère d’eau se referme sur {lui}. Ses joues gonflent. Ses yeux te supplient.'],
    sombre: ['Tu le gardes dans la prison une troisième fois, plus longtemps. Quand tu le relâches, {il} ne se souvient plus de son nom.'],
  },
  suiton_dragon: {
    loin: ['Le dragon d’eau fond sur {lui} et l’emporte comme une crue emporte un chien.'],
    sombre: ['Le troisième dragon le plaque au sol et l’y maintient. Quand l’eau se retire, {il} est bleu{e}, et tu dois lui écraser la poitrine pour qu’{il} respire encore.'],
  },
  // ── Fūton ──
  fuuton_lame: {
    loin: ['La lame de vent part de ta main et lui ouvre la joue jusqu’à l’oreille.'],
    proche: ['À bout portant, la lame de vent lui tranche les deux avant-bras levés en garde.'],
    sombre: ['La troisième lame passe sous sa garde et lui ouvre le ventre en ligne droite. {Il} se tient les entrailles à deux mains, et te regarde.'],
  },
  fuuton_rafale: {
    loin: ['La rafale le soulève et le jette en arrière comme un sac de riz.'],
    proche: ['Tu relâches la rafale contre sa poitrine. {Il} part en arrière à l’horizontale.'],
    sombre: ['Troisième rafale. Il n’atterrit pas : {il} s’écrase, la tête la première, et son cou fait un angle qui n’existe pas.'],
  },
  fuuton_vide: {
    loin: ['La balle d’air le frappe à l’estomac. {Il} se plie, la bouche ouverte, sans air.'],
    proche: ['Le boulet d’air explose contre son ventre. {Il} crache tout ce qu’{il} a mangé de la journée.'],
    sombre: ['Troisième balle, en pleine tête. {Il} se relève, mais quelque chose dans ses yeux ne suit plus. {Il} ne sait plus où {il} est.'],
  },
  // ── Doton ──
  doton_boue: {
    loin: ['Le sol se liquéfie sous ses pieds. {Il} s’enfonce jusqu’aux genoux.'],
    proche: ['Tu lui fais avaler la boue : le sol remonte sur {lui} jusqu’au menton.'],
    sombre: ['Troisième fois, et tu laisses la boue monter au-dessus de sa bouche. Tu la laisses là. Longtemps.'],
  },
  doton_lances: {
    loin: ['Les lances de pierre jaillissent sous ses pas. L’une lui traverse le pied.'],
    sombre: ['La troisième forêt de lances le cueille en l’air. {Il} reste suspendu{e} dessus, empalé{e} par la cuisse et l’épaule.'],
  },
  doton_mur: {
    proche: ['Le mur jaillit sous son menton et le soulève du sol. Ses dents se referment sur sa langue.'],
  },
  doton_seisme: {
    proche: ['Ton pied frappe le sol, et le sol le frappe en retour. Ses genoux se plient à l’envers.'],
    sombre: ['Troisième séisme. Ses deux jambes cèdent dans le mauvais sens. {Il} rampera, désormais.'],
  },
  // ── Taijutsu ──
  tai_tourbillon: {
    proche: ['Ton talon trouve sa tempe en plein tour. {Il} s’effondre avant d’avoir compris.'],
    sombre: ['Le troisième coup de talon trouve la même tempe. {Il} tombe et ses jambes continuent de battre, toutes seules, longtemps.'],
  },
  tai_poing: {
    proche: ['Trois coups, toujours au même point. Au troisième, sa garde ne tient plus ; au quatrième, son plexus non plus.'],
    sombre: ['Toujours au même point, la troisième série. Sa poitrine s’enfonce sous ton poing. Il y a quelque chose de cassé dedans qui ne se ressoudera pas.'],
  },
  tai_danse: {
    proche: ['Tu frappes de bas en haut sous le menton. Sa tête part en arrière et {il} décolle du sol.'],
    sombre: ['Troisième fois sous le menton. Sa mâchoire se brise, ses dents se répandent sur le sol comme des graines.'],
  },
  paume_vide: {
    proche: ['La paume vide le frappe au sternum à bout portant ; {il} décolle comme une feuille.'],
    sombre: ['Troisième paume, au même endroit. Son cœur rate un battement. Puis un autre.'],
  },
  rasengan: {
    proche: ['La sphère tourne contre son ventre et le vrille sur lui-même avant de l’envoyer au loin.'],
    sombre: ['Le troisième Rasengan s’enfonce dans son dos. Ses vêtements, sa peau, et ce qu’il y a dessous tournent avec la sphère.'],
  },
  // ── Genjutsu ──
  gen_brume: {
    loin: ['La peur le prend de loin. Ses mains tremblent, son arme lui glisse des doigts.'],
    proche: ['Tu lui murmures sa propre peur à l’oreille. {Il} se met à pleurer sans le savoir.'],
    sombre: ['Troisième fois, la peur s’installe pour de bon. {Il} se recroqueville sur le sol, les mains sur la tête, et ne veut plus jamais se relever.'],
  },
  gen_reflet: {
    sombre: ['Troisième illusion. {Il} frappe ton reflet, puis le sien, puis {lui}-même, avec son propre kunai, encore et encore.'],
  },
  gen_etreinte: {
    sombre: ['Les branches imaginaires l’étreignent une troisième fois, et cette fois son corps y croit tout à fait. Ses côtes se brisent sous une écorce qui n’existe pas.'],
  },
  // ── Armes ──
  arme_senbon: {
    loin: ['Trois aiguilles, trois points. Son bras retombe, inerte.'],
    proche: ['Tu plantes l’aiguille dans son cou, à la main. {Il} se fige, une statue qui respire.'],
    sombre: ['La troisième aiguille entre dans la nuque, au point exact. {Il} vivra. {Il} ne sentira plus rien sous les épaules.'],
  },
  arme_pluie: {
    loin: ['La pluie de kunai s’abat sur {lui}. {Il} en pare neuf. Le dixième se plante dans sa cuisse.'],
    sombre: ['Troisième pluie. Il y a tant de kunai plantés en {lui} qu’{il} ressemble à un hérisson qui saigne.'],
  },
  arme_aube: {
    proche: ['Du fourreau à la gorge, un seul geste. Une ligne rouge se dessine sous son menton.'],
    sombre: ['Troisième dégainé. La ligne sous son menton s’ouvre, cette fois. {Il} porte les mains à sa gorge, et le rouge passe entre ses doigts.'],
  },
  // ── Médecine, sceaux ──
  med_scalpel: {
    proche: ['Ta main lumineuse effleure sa cuisse. Le muscle est tranché net sous la peau intacte. {Il} tombe.'],
    sombre: ['Troisième effleurement, sur la nuque cette fois. Pas une goutte de sang. {Il} s’effondre, et tu sais qu’{il} ne bougera plus rien sous le cou.'],
  },
  fuin_explosif: {
    proche: ['Le sceau collé à son épaule s’embrase. {Il} part en tournoyant, la manche en lambeaux.'],
    sombre: ['Troisième sceau, collé à son ventre. Quand la fumée se lève, tu détournes les yeux.'],
  },
  // ── Clans ──
  hyuga_64: {
    proche: ['Soixante-quatre coups, soixante-quatre points. Son chakra se tait, point par point, comme on souffle des bougies.'],
    sombre: ['Troisième série. Tu ne fermes plus ses points : tu les détruis. {Il} ne pourra plus jamais composer un seul signe.'],
  },
  inuzuka_gatsuga: {
    proche: ['Les deux tornades de crocs le traversent en même temps. Ses vêtements partent en lanières, sa peau aussi.'],
    sombre: ['Troisième passage. Ton chien revient la gueule pleine de quelque chose que tu ne veux pas regarder.'],
  },
  kaguya_tsubaki: {
    proche: ['L’os sort de ta paume et entre dans son épaule.'],
    sombre: ['La troisième lame d’os entre sous sa clavicule, et tu la casses à l’intérieur. Elle y restera.'],
  },
  aburame_essaim: {
    loin: ['L’essaim le recouvre de loin et boit son chakra à travers sa peau.'],
    sombre: ['Troisième fois. Les insectes ne repartent pas. Tu les entends grignoter sous sa peau.'],
  },
  akimichi_nikudan: {
    proche: ['Le char de chair lui passe dessus. Tu sens ses os rouler sous toi.'],
    sombre: ['Troisième passage. Tu ne le sens plus rouler. Il est à plat.'],
  },
};

/** Une technique apprise depuis peu lâche au mauvais moment : fatigue, blessure, peur de mourir. */
export const RATES_NOVICE: string[] = [
  'Tes mains hésitent au quatrième signe. Tu la connais depuis trop peu de temps : la technique sort, mais à moitié.',
  'Le chakra se coince quelque part entre ton ventre et tes paumes. Ce que tu voulais lancer arrive tordu, sans force.',
  'Tu as répété ces signes cent fois au calme. Ici, avec la mort en face, tes doigts mélangent l’ordre.',
  'Ta respiration se bloque au mauvais moment. La technique part avant d’être prête, et se défait à mi-chemin.',
  'Tu sens qu’elle t’échappe dès le premier signe. Tu la lances quand même. Elle ne ressemble à rien.',
  'La douleur te traverse au moment de concentrer ton chakra. Tu perds le fil, et la technique avec.',
];

/** Contre une escouade : une technique de zone les prend tous ; frapper un seul laisse les autres te tomber dessus. */
export const PORTEE_ESCOUADE = {
  zone: [
    'Ta technique ne choisit pas : elle les prend tous à la fois.',
    'Personne dans leur groupe n’y échappe. Les rangs se défont.',
    'Elle balaie tout le groupe d’un seul geste ; ceux qui restent debout titubent.',
  ],
  expose: [
    'Pendant que tu t’acharnes sur un seul, les autres te contournent.',
    'Tu en tiens un. Les autres en profitent pour se placer dans ton dos.',
    'Un seul est touché. Tu entends les pas des autres se refermer autour de toi.',
  ],
};

/** Quand c'est toi qui encaisses : où tu tombes, contre quoi tu t'écrases. */
export const CHUTES_JOUEUR: { leger: string[]; lourd: string[] } = {
  leger: [
    'Tu recules de trois pas et tu te rattrapes d’une main au sol.',
    'Tu roules sur l’épaule et tu te relèves, le goût du sang dans la bouche.',
    'Tes pieds quittent le sol une seconde. Tu retombes sur le dos, le souffle coupé.',
    'Tu glisses sur plusieurs mètres, les talons plantés dans la terre pour freiner.',
  ],
  lourd: [
    'Tu décolles. Le ciel et le sol échangent leur place deux fois avant que tu touches terre, face la première.',
    'Tu rebondis sur le sol comme une pierre sur l’eau, une fois, deux fois. Tout tourne.',
    'Le choc t’enfonce dans le sol. Pendant une seconde, tu ne sens plus tes jambes.',
  ],
};

export const IMPACTS_JOUEUR: Partial<Record<Terrain, string[]>> = {
  foret: ['Ton dos percute un tronc. L’écorce t’entre dans la peau et tu glisses jusqu’aux racines.', 'Tu traverses un buisson d’épines et tu t’arrêtes contre un chêne, la vue brouillée.'],
  rue: ['Tu t’écrases contre un mur. Le crépi éclate autour de tes épaules.', 'Tu traverses la devanture d’une échoppe dans une pluie de bois et de céramique.'],
  terrain: ['Tu percutes un poteau d’entraînement, qui se fend contre ta colonne.', 'Tu traverses la palissade du terrain et tu finis dans l’herbe, au milieu des planches.'],
  cour: ['Tu t’écrases contre le mur de l’Académie. Une fenêtre éclate au-dessus de toi.'],
  interieur: ['Tu traverses la cloison et tu roules dans la pièce d’à côté, au milieu du tatami arraché.'],
  forge: ['Tu tombes contre l’enclume. Le métal froid te mord la hanche jusqu’à l’os.'],
  porte: ['Tu t’écrases contre la grande porte. Le bois résonne, et toi aussi.'],
  plaine: ['Tu roules dans les hautes herbes et tu t’arrêtes contre un rocher qui ne bouge pas.'],
  desert: ['Tu dévales la dune dans une avalanche de sable brûlant.', 'Tu t’enfonces dans le sable jusqu’à la taille sous le choc.'],
  ruines: ['Tu t’écrases contre un pan de mur, qui s’effondre à moitié sur toi.'],
  cotes: ['Tu percutes un récif. Les coquillages t’ouvrent le dos.', 'Tu tombes dans les vagues ; l’eau froide te ramène à toi.'],
  montagne: ['Tu glisses jusqu’au bord du précipice. Tes doigts accrochent la roche au dernier moment.'],
  neige: ['Tu t’écrases sur un lac gelé. La glace craque en étoile sous ton dos.'],
  marche: ['Tu tombes à travers un étal de fruits ; le marchand hurle.'],
  temple: ['Tu percutes une statue de pierre. Sa main tombe à côté de ta tête.'],
  route: ['Tu tombes dans le fossé, dans l’eau boueuse.'],
  quai: ['Tu tombes du quai. L’eau glacée te coupe le souffle.'],
  roche: ['Tu t’écrases contre la paroi de la carrière. Des pierres tombent sur toi.'],
};

/** Ce qui reste quand le combat s'arrête, selon le lieu : une phrase avant que la scène reprenne. */
export const APRES_COMBAT: Record<Terrain, { victoire: string[]; defaite: string[]; neutre: string[] }> = {
  foret: {
    victoire: ['Les oiseaux reviennent un à un dans les branches, comme si rien ne s’était passé.', 'Une feuille tombe lentement sur ta main encore tremblante. La forêt a déjà oublié.'],
    defaite: ['Tu restes allongé·e dans les fougères. Au-dessus de toi, les branches se balancent sans rien te dire.', 'L’humus est froid contre ta joue. Quelque part, un pic-vert reprend son travail.'],
    neutre: ['Le silence retombe entre les troncs, épais comme de la mousse.'],
  },
  rue: {
    victoire: ['Les volets s’entrouvrent un à un. Quelqu’un applaudit, puis s’arrête, gêné.', 'Un marchand redresse son étal renversé en te regardant de travers.'],
    defaite: ['Des pas s’éloignent sur les pavés. Derrière les volets, personne n’ose sortir.', 'Une lanterne se balance encore au-dessus de toi. Tu comptes ses oscillations pour ne pas penser.'],
    neutre: ['La rue reprend son bruit, lentement, comme une respiration après une apnée.'],
  },
  terrain: {
    victoire: ['Les poteaux d’entraînement penchent, criblés, témoins muets de ce qui vient d’arriver.', 'La poussière retombe sur le terrain. Tes mains, elles, mettent plus longtemps.'],
    defaite: ['Tu regardes le ciel depuis l’herbe arrachée du terrain. Il est trop bleu pour un jour pareil.', 'Le poteau contre lequel tu es tombé·e porte encore l’entaille de ta première année.'],
    neutre: ['Sur le terrain, il ne reste que vos traces de pas, emmêlées.'],
  },
  cour: {
    victoire: ['Aux fenêtres de l’Académie, des visages se retirent vite. Ce soir, on parlera de toi.', 'La cloche de la cour sonne, très loin, comme dans un autre monde.'],
    defaite: ['Le gravier de la cour t’écorche les paumes. Des rires étouffés derrière les vitres.', 'Tu te relèves seul·e. Personne dans la cour ne t’aide, et personne ne se moque. C’est pire.'],
    neutre: ['Le préau résonne encore, puis se tait.'],
  },
  interieur: {
    victoire: ['La pièce est dévastée. Le thé renversé fume encore sur le tatami.', 'Un rouleau suspendu se décroche lentement du mur et tombe à tes pieds.'],
    defaite: ['Le plafond tourne au-dessus de toi. Une poutre craque, puis plus rien.', 'Le tatami sent le thé et le sang. Tu restes là, à écouter la maison.'],
    neutre: ['La maison retient son souffle, cloison par cloison.'],
  },
  forge: {
    victoire: ['Le feu de la forge ronfle toujours, indifférent. L’enclume a pris un coup de plus.', 'Les braises renversées crépitent dans la poussière de charbon.'],
    defaite: ['La chaleur du foyer te brûle le visage. Tu n’as pas la force de t’en éloigner.', 'Au-dessus de toi, les lames pendues au mur tintent doucement.'],
    neutre: ['Le soufflet expire une dernière fois, seul.'],
  },
  porte: {
    victoire: ['Sur le chemin de ronde, les gardes échangent un regard. L’un d’eux hoche la tête.', 'La grande porte grince sur ses gonds, comme si elle approuvait.'],
    defaite: ['Les gardes regardent ailleurs. La grande porte, elle, ne regarde personne.', 'Tu restes au pied de la palissade, là où tous les voyageurs te verront en partant.'],
    neutre: ['Le vent passe sous la grande porte en sifflant.'],
  },
  plaine: {
    victoire: ['Le vent couche les hautes herbes vers toi, comme une révérence.', 'Un vieux casque rouillé, à tes pieds, a vu d’autres combats. Il n’en dit rien.'],
    defaite: ['Les herbes se referment au-dessus de toi. D’ici, on ne voit que le ciel et les corbeaux.', 'La terre de la plaine a bu le sang de tant de guerres. Le tien ne change rien pour elle.'],
    neutre: ['La plaine reprend sa respiration lente, d’un horizon à l’autre.'],
  },
  desert: {
    victoire: ['Le vent efface déjà vos traces dans le sable. Dans une heure, il n’y aura plus rien.', 'Le soleil tape sur ta nuque. Tu avais oublié la chaleur, pendant le combat.'],
    defaite: ['Le sable brûlant colle à tes lèvres. Les vautours tournent, patients.', 'Une dune glisse lentement sur ta jambe. Tu n’as pas la force de la repousser.'],
    neutre: ['Le désert ne garde rien. Le vent s’en charge.'],
  },
  ruines: {
    victoire: ['Un pan de mur finit de s’effondrer derrière toi. Les ruines ont l’habitude.', 'La pluie recommence à tomber entre les piliers brisés.'],
    defaite: ['Les ruines te regardent depuis leurs fenêtres vides.', 'De l’eau goutte d’une poutre tordue, juste à côté de ton oreille. Tu la comptes.'],
    neutre: ['Le silence des ruines est plus vieux que vous deux.'],
  },
  cotes: {
    victoire: ['La marée monte et efface le sang sur les galets.', 'Une mouette se pose sur un récif et te regarde, la tête penchée.'],
    defaite: ['L’écume te lèche les doigts. La mer attend son tour.', 'Le ressac couvre tout, même ta respiration.'],
    neutre: ['Les vagues continuent, comme elles l’ont toujours fait.'],
  },
  montagne: {
    victoire: ['Une pierre dévale la pente longtemps après le dernier coup.', 'Le vent du col te glace la sueur sur le dos. Tu es en vie.'],
    defaite: ['Au-dessus de toi, l’orage gronde comme s’il avait vu le combat.', 'Le vide est à un pas. Tu ne sais pas comment tu ne t’y es pas trouvé·e.'],
    neutre: ['L’écho de vos coups met longtemps à mourir entre les pics.'],
  },
  neige: {
    victoire: ['La neige recommence à tomber, et recouvre déjà les traces rouges.', 'Ton souffle fume dans l’air froid. C’est la seule chose qui bouge encore.'],
    defaite: ['La neige est douce contre ta joue. Trop douce. Il ne faut pas fermer les yeux.', 'Les flocons s’accumulent sur tes cils. Tu ne sens plus tes doigts.'],
    neutre: ['Le blanc reprend tout, sans bruit.'],
  },
  marche: {
    victoire: ['Les marchands ramassent leurs fruits éparpillés. Le plus vieux te fait un signe de tête.', 'Quelqu’un te tend un gobelet d’eau, sans un mot.'],
    defaite: ['Les clients enjambent tes jambes pour atteindre les étals. Personne ne s’arrête.', 'Un enfant te regarde depuis derrière les jupes de sa mère, et ne comprend pas.'],
    neutre: ['Le marché reprend son vacarme, comme si rien n’avait eu lieu.'],
  },
  temple: {
    victoire: ['L’encens brûle toujours devant l’autel. La statue n’a pas changé d’expression.', 'La cloche du temple vibre encore, longtemps, très bas.'],
    defaite: ['Allongé·e sur les dalles froides, tu entends les moines psalmodier, très loin.', 'La statue te regarde d’en haut avec une patience de mille ans.'],
    neutre: ['La fumée de l’encens monte droit, comme si rien n’avait bougé.'],
  },
  route: {
    victoire: ['Une charrette passe au loin. Le conducteur fouette ses bœufs pour ne pas s’arrêter.', 'La poussière de la route retombe sur toi. Tu reprends ta marche.'],
    defaite: ['Dans le fossé, l’eau boueuse te monte aux chevilles. La route continue sans toi.', 'Une borne de pierre marque la distance jusqu’au prochain village. Tu n’as pas la force de la lire.'],
    neutre: ['La route s’étire, indifférente, dans les deux sens.'],
  },
  quai: {
    victoire: ['Les pêcheurs reprennent leurs filets, sans te regarder.', 'Un bateau quitte le quai dans la brume. La mer avale le bruit.'],
    defaite: ['Les planches mouillées du quai craquent sous tes doigts. L’eau noire attend en dessous.', 'La brume te recouvre comme une couverture froide.'],
    neutre: ['Le clapotis contre les pilotis reprend son rythme.'],
  },
  roche: {
    victoire: ['Des cailloux roulent encore le long de la paroi, longtemps après.', 'La carrière te renvoie l’écho de ta propre respiration.'],
    defaite: ['La poussière de roche te remplit la bouche. Au-dessus, la paroi est immense.', 'Un wagonnet abandonné grince sur ses rails, poussé par le vent.'],
    neutre: ['La roche garde tout, même les bruits.'],
  },
};
