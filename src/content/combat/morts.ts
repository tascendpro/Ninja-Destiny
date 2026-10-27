/**
 * Les morts au combat : ce qui t'a tué, raconté jusqu'au bout. Chaque banque correspond à une manière de mourir
 * (l'élément de la technique adverse, la lame, les poings, la bête, l'escouade, ou un membre de l'Akatsuki).
 * Jetons : {nom}, {Il}, {il}, {lui} (l'adversaire), {tech} (sa technique), et les formes « ·e » (toi).
 * La cause est celle que retient l'épitaphe.
 */
export interface MortAuCombat {
  textes: string[];
  cause: string;
}

export const MORTS_AU_COMBAT: Record<string, MortAuCombat> = {
  taijutsu: {
    cause: 'tombé·e sous les coups de {nom}',
    textes: [
      'Tu essaies de te relever. Ton bras ne répond plus. {nom} attend que tu sois presque debout, et c’est presque élégant, la façon dont {il} pivote sur un talon. Tu ne vois pas le coup. Tu entends seulement quelque chose craquer dans ta nuque, très près, comme une branche sèche sous la neige.',
      '{nom} s’agenouille à côté de toi, comme on s’agenouille près d’un ami blessé. {Il} pose deux doigts sur ta gorge, cherche quelque chose, le trouve. « Ici », dit-{il}, presque pour {lui}-même. Puis {il} appuie.',
      'Le premier coup te fait plier. Le deuxième t’allonge. Tu n’entends pas le troisième : tu regardes le ciel, et tu trouves étrange qu’il soit si calme, si bleu, alors que tout le reste s’éteint.',
    ],
  },
  lame: {
    cause: 'tombé·e sous la lame de {nom}',
    textes: [
      '{nom} ne se presse pas. {Il} marche vers toi à petits pas, essuie sa lame sur sa manche, et s’arrête à ta hauteur. Tu lèves les yeux. Tu voudrais dire quelque chose. {Il} attend poliment que tu trouves les mots ; tu ne les trouves pas. Le métal est froid, puis il ne l’est plus.',
      'Tu vois l’éclat avant la lame. Une ligne de lumière, très fine, qui passe d’un côté à l’autre. Tu baisses les yeux sur ta poitrine et tu ne comprends pas tout de suite pourquoi ton haut devient si sombre, si vite.',
      'Ton kunai t’échappe des doigts et tinte sur les pierres, loin, trop loin. {nom} pose le pied dessus. {Il} te regarde ramper vers lui un moment, sans méchanceté, puis {il} lève le bras. Tu fermes les yeux. C’est la dernière chose que tu décides.',
    ],
  },
  technique: {
    cause: 'emporté·e par la technique de {nom} ({tech})',
    textes: [
      '{tech}. Tu entends le nom avant de comprendre ce qu’il veut dire. Ensuite, tu ne comprends plus grand-chose. Le sol est contre ta joue. Il est tiède. Tu restes là à le trouver tiède, longtemps, puis plus du tout.',
      '{nom} compose les signes lentement, presque à regret, comme on récite une prière qu’on connaît trop bien. {tech}. Tu as le temps de penser que tu aurais dû apprendre celle-là. C’est ta dernière pensée de ninja.',
    ],
  },
  katon: {
    cause: 'consumé·e par le feu de {nom} ({tech})',
    textes: [
      '{tech}. La chaleur arrive avant la lumière. Tu lèves les bras devant ton visage, par réflexe, comme un enfant. Le feu passe à travers tes bras, à travers tout. Il n’y a pas de douleur, à la fin. Juste un grand blanc orange, et l’odeur des feux de camp de ton enfance.',
      'Tu roules au sol pour éteindre tes vêtements. Ça ne s’éteint pas. {nom} te regarde faire, sans bouger, jusqu’à ce que tu ne bouges plus non plus. Quand {il} s’en va, l’herbe fume encore tout autour de toi en dessinant ta forme.',
      'Le feu prend d’abord tes cheveux, puis l’air dans ta gorge. Tu cherches à respirer et tu avales des flammes. Au-dessus de toi, la fumée monte en colonne droite, très haut, et quelque part au village quelqu’un la voit et se demande ce qui brûle.',
    ],
  },
  suiton: {
    cause: 'noyé·e par {nom} ({tech})',
    textes: [
      '{tech}. L’eau te prend aux chevilles, puis à la taille, puis partout. Tu te débats ; elle a le poids d’une montagne. Une bulle d’air s’échappe de ta bouche et monte, lentement, vers une lumière qui s’éloigne. Tu la regardes partir. Elle emporte ton nom avec elle.',
      'Tu tiens longtemps. Plus longtemps que tu ne l’aurais cru. Puis ton corps décide sans toi, et ouvre la bouche pour respirer ce qui n’est pas de l’air. C’est étrangement calme, après. Le froid. Le silence. Les mains de l’eau qui te bercent.',
      '{nom} maintient la prison d’eau d’une main, sans effort, en regardant ailleurs. Tes poings frappent la paroi liquide sans bruit. Au bout d’un moment, ils frappent moins fort. Puis ils flottent.',
    ],
  },
  fuuton: {
    cause: 'taillé·e en pièces par le vent de {nom} ({tech})',
    textes: [
      '{tech}. Tu ne vois rien venir : le vent n’a pas de couleur. Tu sens seulement une fraîcheur étrange sur ta gorge, comme une caresse, et tu portes la main à ton cou. Elle revient rouge. Tu la regardes sans comprendre, et le vent continue de souffler.',
      'La rafale te soulève comme une feuille et te jette contre le tronc. Tu entends ton dos se briser avant de le sentir. Les feuilles retombent sur toi, une à une, et {nom} ne prend même pas la peine de venir voir.',
    ],
  },
  raiton: {
    cause: 'foudroyé·e par {nom} ({tech})',
    textes: [
      '{tech}. Un claquement sec, comme une branche qui casse dans tout ton corps à la fois. Ton cœur s’arrête net, puis repart, puis hésite. Tu es allongé·e, les doigts tordus, et tu sens l’odeur de l’orage sur ta propre peau. Ton cœur hésite encore. Puis il cesse d’hésiter.',
      'La foudre entre par ta main et ressort par tes pieds. Entre les deux, elle ne laisse rien. Tu restes debout une seconde de trop, figé·e, les yeux ouverts, et c’est ce que {nom} se rappellera de toi.',
    ],
  },
  doton: {
    cause: 'enseveli·e par {nom} ({tech})',
    textes: [
      '{tech}. Le sol s’ouvre et se referme sur toi comme une bouche. Il fait noir. La terre presse sur ta poitrine, et chaque souffle est plus court que le précédent. Tu griffes vers le haut. Tu ne sais plus où est le haut.',
      'La roche te prend les jambes, puis les hanches. {nom} s’accroupit à ta hauteur pendant que la terre monte. « Ne lutte pas, dit-{il}. Ça va plus vite. » Tu luttes quand même. Ça ne va pas plus vite.',
    ],
  },
  majeure: {
    cause: 'emporté·e par {tech}, la grande technique de {nom}',
    textes: [
      '{tech}. {nom} l’avait annoncée, et tu avais cru pouvoir l’arrêter. Le monde devient très lumineux, puis très silencieux. Quand la poussière retombe, il y a un cratère, et rien au milieu.',
      'Tu reconnais la technique au moment où elle te touche : {tech}. On en parlait à voix basse, à l’Académie, comme d’une légende. Elle est vraie. C’est la dernière chose que tu apprends.',
    ],
  },
  bete: {
    cause: 'tué·e par {nom}',
    textes: [
      '{nom} ne joue pas avec toi comme un ninja l’aurait fait. {Il} t’attrape par l’épaule et secoue la tête, une fois, deux fois. Après, il n’y a plus que le bruit de sa respiration contre ton oreille, et la chaleur de son souffle, et puis plus rien.',
      'Tu essaies de ramper vers les arbres. {nom} te laisse faire quelques pas, puis {il} pose une patte sur ton dos, sans se presser. Tu sens son poids, et ses griffes, et tu comprends que c’était décidé depuis longtemps.',
    ],
  },
  escouade: {
    cause: 'tombé·e sous le nombre ({nom})',
    textes: [
      'Ils arrivent de partout à la fois. Tu en arrêtes un, puis deux. Le troisième, tu ne le vois pas : un poids froid entre tes omoplates, très précis. Tu tombes à genoux au milieu d’eux. Personne ne dit rien. L’un d’eux referme simplement tes yeux, d’un geste de métier.',
      'Un fil tendu, un kunai, un autre kunai. Ils travaillent ensemble comme une seule main, et cette main se referme sur toi. Le dernier à approcher s’accroupit, prend ton bandeau frontal, et le glisse dans sa poche. Pour le rapport.',
    ],
  },

  // L'Akatsuki : chacun tue à sa manière.
  ak_itachi: {
    cause: 'tué·e par Itachi Uchiha',
    textes: [
      'Tu croises son regard. Le monde vire au rouge et au noir. Tu passes trois jours sur une croix, sous une lune rouge, et à chaque minute une lame te traverse. Quand tu reviens, une seconde seulement s’est écoulée. Ton corps est intact. Ton esprit, non. Tu tombes à genoux, et ton cœur s’arrête de fatigue.',
      '« Amaterasu. » Il le dit doucement. Les flammes noires ne font aucun bruit. Elles ne s’éteignent pas. Elles ne s’éteindront pas avant sept jours et sept nuits. Itachi détourne les yeux, une main sur son œil qui saigne, et il ne te regarde pas brûler. C’est la seule pitié qu’il ait à offrir.',
    ],
  },
  ak_kisame: {
    cause: 'dévoré·e par Samehada (Kisame Hoshigaki)',
    textes: [
      'Samehada te touche à peine. Elle n’a pas besoin de plus. Les écailles boivent ton chakra comme une éponge boit l’eau, et tu sens tes jambes devenir de la paille, puis ton cœur ralentir, ralentir. Kisame te regarde t’éteindre avec curiosité. « Hm. Elle t’aimait bien. »',
      'La prison d’eau se referme. De l’autre côté de la paroi, Kisame sourit avec toutes ses dents, puis il nage autour de toi, lentement, comme un requin autour d’un naufragé. Il attend. Il est très patient. Les requins le sont toujours.',
    ],
  },
  ak_sasori: {
    cause: 'empoisonné·e par Sasori de la Sable rouge',
    textes: [
      'L’éraflure est minuscule. Une ligne rouge sur ton avant-bras, rien du tout. Puis ta main droite s’engourdit, et ta main gauche. « Trois jours, dit Sasori sans lever les yeux de ses fils. Mais pour toi, ce sera plus court. » Il ne mentait pas. Il ne ment jamais sur les poisons.',
      'Tu te réveilles ou tu crois te réveiller : tu ne sens plus ton corps. Sasori est penché sur toi, avec des outils fins comme des aiguilles, et il mesure tes bras avec soin. « Tu feras une belle marionnette », dit-il. Tu voudrais crier. Tu n’as plus de bouche pour ça.',
    ],
  },
  ak_deidara: {
    cause: 'pulvérisé·e par l’art de Deidara',
    textes: [
      'Une petite araignée d’argile blanche, posée sur ton épaule. Tu ne l’as pas sentie arriver. Deidara joint deux doigts, très haut, sur son oiseau. « Katsu. » La lumière est magnifique. Il avait raison sur ce point : l’art est une explosion.',
      'Le C2 tombe du ciel comme une pluie de fleurs blanches. Tu cours, tu sautes, tu en évites trois. La quatrième fleurit à tes pieds. Depuis là-haut, Deidara regarde le cratère, satisfait. « Hm. Beau. »',
    ],
  },
  ak_hidan: {
    cause: 'sacrifié·e à Jashin par Hidan',
    textes: [
      'Une goutte de ton sang sur sa lame. Il la lèche. Sa peau devient noire, striée de blanc, et il trace un cercle dans la poussière avec son pied. Puis il plante la lance dans sa propre poitrine en riant. Tu sens la pointe entrer dans la tienne. Hidan, lui, continue de rire. Il ne peut pas mourir. Toi, si.',
      'Il prie longtemps au-dessus de toi, à genoux, pendant que tu te vides. Il prie pour ton âme, à sa manière, en jurant entre chaque phrase. « Jashin t’accueille, crétin. Estime-toi heureux·se. » Tu ne t’estimes pas heureux·se. Tu ne t’estimes plus rien du tout.',
    ],
  },
  ak_kakuzu: {
    cause: 'tué·e par Kakuzu, pour la valeur de son cœur',
    textes: [
      'Les fils noirs entrent dans ta poitrine sans douleur, comme des racines dans la terre. Tu sens qu’ils cherchent quelque chose. Ils le trouvent. Kakuzu tire, et ton cœur bat dans sa main pendant un moment, encore. « Il servira », dit-il. Puis il regarde ton visage, sort un carnet, et vérifie si tu valais une prime.',
      'Tu es à terre. Kakuzu s’accroupit, fouille tes poches, compte tes ryō deux fois. « Pas grand-chose. » Il te regarde enfin. « Dommage. Le cœur, lui, a de la valeur. »',
    ],
  },
  ak_konan: {
    cause: 'tué·e par Konan, l’ange de papier',
    textes: [
      'Le papier se colle à ta peau, feuille après feuille, sur ta bouche, sur ton nez, sur tes yeux. Il est doux. Il sent l’encre et la pluie. Tu essaies de l’arracher ; il y en a toujours une autre. Konan te regarde sans colère. « Dors. Il ne pleut plus, là où tu vas. »',
      'Des milliers de lames de papier tournent autour de toi, lentes, presque belles. Konan lève la main, et elles s’arrêtent. Un instant tu crois qu’elle t’épargne. Puis elle baisse la main.',
    ],
  },
};
