import type { PostureDef } from '../engine/types';

// Les transformations : on les active pendant un combat (sans perdre la manche), et elles renforcent l'attaque
// et la défense jusqu'à la fin. Leur récit d'entrée change avec le palier et varie d'une fois à l'autre.
// Les techniques réservées à une transformation sont déclarées dans maitrises.ts (champ exigeTransformation).

export const POSTURES: Record<string, PostureDef> = {
  // Katon
  katon_manteau: {
    attaque: 10,
    defense: 4,
    effet: 'Les flammes te couvrent : chaque coup brûle, et on hésite à te toucher.',
    entretien: { chakra: 5 },
    fin: 'Les braises qui te couvraient retombent en cendres.',
    entree: [{ min: 1, textes: ['Tu laisses ton chakra s’enflammer à fleur de peau : un manteau de braises danse sur tes épaules.', 'Le feu sort de tes pores comme une sueur brûlante. L’herbe noircit autour de tes pieds.'] }],
  },
  katon_phenix_avatar: {
    attaque: 16,
    defense: 8,
    effet: 'Un phénix de flammes t’enveloppe : force immense, mais il te consume vite.',
    entretien: { chakra: 10, fatigue: 10 },
    duree: 2,
    fin: 'Le phénix s’effondre en pluie de cendres. Tu respires de la fumée.',
    entree: [{ min: 1, textes: ['Le feu monte de toi jusqu’au ciel et prend la forme d’un oiseau immense, ailes ouvertes. Tu es au cœur du phénix.', 'Tes flammes deviennent blanches, puis prennent la forme d’ailes. L’air tremble de chaleur à dix pas.'] }],
  },
  // Suiton
  suiton_maree: {
    attaque: 4,
    defense: 12,
    effet: 'Ton corps s’enveloppe d’eau en mouvement : les coups glissent, les flammes s’éteignent.',
    entretien: { chakra: 5 },
    fin: 'L’eau qui t’enveloppait retombe en flaque à tes pieds.',
    entree: [{ min: 1, textes: ['L’eau de l’air se condense sur toi et se met à tourner, une marée à fleur de peau.', 'Une vague te monte jusqu’aux épaules et y reste, mouvante, comme une armure liquide.'] }],
  },
  suiton_leviathan: {
    attaque: 12,
    defense: 14,
    effet: 'Une armure d’eau aux crocs de requin : écrasante et presque impossible à percer.',
    entretien: { chakra: 9 },
    duree: 3,
    fin: 'Le léviathan se dissout en une pluie lourde.',
    entree: [{ min: 1, textes: ['Une masse d’eau t’engloutit et prend la forme d’un requin géant dont tu es le cœur.', 'L’eau se dresse autour de toi en écailles et en crocs. Tu nages dans l’air.'] }],
  },
  // Fūton
  fuuton_voile: {
    attaque: 8,
    defense: 10,
    effet: 'Un voile de lames de vent tourne autour de toi : il dévie les projectiles et coupe qui s’approche.',
    entretien: { chakra: 5 },
    fin: 'Le vent qui tournait autour de toi s’apaise.',
    entree: [{ min: 1, textes: ['L’air se met à tourner autour de toi, plein de lames fines. Les feuilles qui s’en approchent tombent en deux.', 'Un sifflement : une spirale de vent tranchant t’entoure, de la tête aux pieds.'] }],
  },
  fuuton_ouragan_forme: {
    attaque: 16,
    defense: 8,
    effet: 'Tu deviens un ouragan : vitesse et tranchant extrêmes, mais l’effort t’épuise.',
    entretien: { chakra: 8, fatigue: 12 },
    duree: 2,
    fin: 'Le vent te lâche d’un coup. Tu retombes au sol, le souffle court.',
    entree: [{ min: 1, textes: ['Tu laisses le vent te prendre : tes pieds quittent le sol, et tu deviens le cœur d’une tornade.', 'Une colonne d’air te soulève. Autour de toi, le terrain se couvre d’entailles.'] }],
  },
  // Doton
  doton_granit: {
    attaque: 2,
    defense: 16,
    effet: 'Ta peau devient roche : presque rien ne te blesse, mais tu es lent·e.',
    entretien: { chakra: 4 },
    fin: 'La roche se fendille sur ta peau et tombe en poussière.',
    entree: [{ min: 1, textes: ['Ta peau grisonne, se fige, devient granit. Son kunai rebondit sur ton bras.', 'La terre remonte le long de tes jambes et te recouvre d’une cuirasse de pierre.'] }],
  },
  doton_titan: {
    attaque: 14,
    defense: 16,
    effet: 'Une armure de roche haute comme deux hommes : chaque pas fait trembler le sol.',
    entretien: { chakra: 10, fatigue: 10 },
    duree: 3,
    fin: 'Le titan de pierre s’effondre en éboulis autour de toi.',
    entree: [{ min: 1, textes: ['La montagne vient à toi : des blocs de roche s’assemblent autour de ton corps en un colosse.', 'Le sol se soulève, s’ouvre, et t’enveloppe d’une armure de titan.'] }],
  },
  // Lignées
  hyoton_armure: {
    attaque: 6,
    defense: 14,
    effet: 'Une armure de givre qui gèle ce qui la touche.',
    entretien: { chakra: 6 },
    fin: 'Le givre fond sur toi en gouttes froides.',
    entree: [{ min: 1, textes: ['Le froid monte de tes pieds : une armure de glace bleue se referme sur toi, hérissée de cristaux.', 'Ton souffle gèle. Une carapace de givre se forme sur ta peau, couche après couche.'] }],
  },
  yoton_cuirasse: {
    attaque: 12,
    defense: 8,
    effet: 'Une cuirasse de lave : chaque contact brûle, chaque coup fond la défense adverse.',
    entretien: { chakra: 7, sante: 2 },
    fin: 'La lave refroidit sur toi et tombe en croûtes noires.',
    entree: [{ min: 1, textes: ['La roche de ta peau rougit, puis coule. Tu es vêtu·e de lave.', 'Une cuirasse de pierre fondue se forme sur toi ; le sol fume là où tu marches.'] }],
  },
  jiton_carapace: {
    attaque: 6,
    defense: 16,
    effet: 'Une carapace de sable de fer qui se déplace pour intercepter chaque coup.',
    entretien: { chakra: 6 },
    fin: 'Le sable de fer retombe au sol, inerte.',
    entree: [{ min: 1, textes: ['Le sable de fer se soulève et s’enroule autour de toi en écailles noires, qui bougent toutes seules.', 'Un bourdonnement magnétique : le sable de fer te couvre et attend le premier coup.'] }],
  },
  raiton_yoroi: {
    attaque: 8,
    defense: 12,
    effet: 'Réflexes accélérés : tu esquives et tu contres beaucoup mieux, tu frappes plus vite.',
    entretien: { chakra: 6 },
    fin: 'L’armure de foudre crépite une dernière fois et s’éteint.',
    entree: [
      {
        min: 1,
        textes: [
          'Tu te revêts d’une armure de Raiton : la foudre court sur ta peau, tes cheveux se dressent, et le monde ralentit autour de toi.',
          'Un grondement, un éclair qui ne retombe pas : il t’enveloppe. Tes nerfs vont désormais plus vite que ses yeux.',
          'L’air crépite. Une carapace de foudre blanche se referme sur toi comme une seconde peau.',
        ],
      },
      {
        min: 4,
        textes: [
          'L’armure de foudre devient noire, compacte, presque silencieuse. Ceux qui l’ont vue sur le Raikage savent ce qu’elle annonce.',
          'Ta foudre s’assombrit et se resserre. Tu ne cours plus : tu disparais d’un point pour reparaître à l’autre.',
        ],
      },
    ],
  },
  tai_portes: {
    attaque: 16,
    defense: 2,
    effet: 'Une puissance physique écrasante, au prix de ton corps ; presque aucune défense.',
    entretien: { sante: 6, fatigue: 15 },
    duree: 2,
    fin: 'Les portes se referment d’elles-mêmes. Chacun de tes muscles hurle.',
    entree: [
      { min: 1, textes: ['Tu ouvres la première porte. Tes muscles se libèrent de leurs verrous ; tu sens ton cœur battre jusque dans tes dents.', 'Première porte, celle de l’Ouverture. Le sol se fissure sous tes pieds quand tu prends appui.'] },
      { min: 2, textes: ['Troisième porte. Ta peau vire au rouge, une vapeur monte de ton corps. Il recule avant même que tu bouges.', 'Les portes s’ouvrent une à une, et ta peau rougit à chacune. L’air autour de toi se met à bouillir.'] },
      { min: 4, textes: ['Septième porte. Une aura bleue s’échappe de toi en larmes de chakra. Tu n’as jamais été aussi fort·e, ni aussi près de la mort.', 'La septième porte, celle de l’Émerveillement. Tes larmes s’évaporent avant de tomber.'] },
      { min: 5, textes: ['Tu ouvres la huitième porte, celle de la Mort. Ton sang s’évapore en ailes écarlates. Ton cœur bat comme un tambour de guerre. Tu sais que c’est la dernière fois.'] },
    ],
  },
  marque_maudite: {
    attaque: 12,
    defense: 4,
    effet: 'Force et chakra décuplés ; la marque ronge ton contrôle.',
    entretien: { sante: 3 },
    fin: 'Les flammes noires refluent vers ton cou. Tu tombes à genoux, vidé·e.',
    entree: [
      { min: 1, textes: ['Les virgules noires s’étendent sur ta peau comme de l’encre dans l’eau. Ton chakra devient lourd, violent, étranger.', 'La marque brûle dans ton cou, puis tout ton corps se couvre de flammes noires. Tu ris, sans savoir pourquoi.'] },
      { min: 3, textes: ['Niveau 2. Ta peau devient grise, tes cheveux s’allongent, deux ailes de chair en forme de mains jaillissent de ton dos.', 'Tu laisses la marque t’engloutir : peau grise, yeux d’ambre, ailes repliées. Tu n’es plus tout à fait de sa race.'] },
    ],
  },
  mode_ermite: {
    attaque: 10,
    defense: 10,
    effet: 'Tu sens chaque chakra et chaque intention : force de la montagne, esquives anticipées.',
    duree: 3,
    fin: 'L’orange quitte tes paupières : l’énergie naturelle est épuisée, et il faudrait rester immobile pour la rappeler.',
    entree: [
      { min: 1, textes: ['Tu t’immobilises, une seconde de trop pour lui, assez pour toi. L’énergie naturelle afflue ; tes paupières se cernent d’orange.', 'Tu fermes les yeux et tu laisses la montagne respirer en toi. Quand tu les rouvres, tes pupilles sont celles d’un crapaud.'] },
      { min: 5, textes: ['Deux vieux crapauds se posent sur tes épaules et se mettent à chanter. Le monde ralentit. Tu entends son chakra comme on entend un cœur.'] },
    ],
  },
  byakugo: {
    attaque: 8,
    defense: 12,
    effet: 'Tes blessures se referment pendant le combat ; ta force fend la roche.',
    entretien: { chakra: 6 },
    fin: 'Le losange se referme sur ton front : la réserve du sceau est vide.',
    entree: [
      { min: 1, textes: ['Le losange s’ouvre sur ton front. Des marques violettes descendent le long de ton visage, de tes bras. Tes plaies commencent à se refermer.', 'Tu libères des années de chakra accumulé : le sceau sur ton front s’embrase, et ton corps se répare plus vite qu’on ne le blesse.'] },
      { min: 4, textes: ['Création-Renaissance. Chaque cellule de ton corps se divise et se reforme. Tu peux encaisser n’importe quoi, au prix de ta propre vie.'] },
    ],
  },
  susanoo: {
    attaque: 12,
    defense: 16,
    effet: 'Une armure géante de chakra : presque rien ne passe, et ses coups sont ceux d’un géant.',
    entretien: { chakra: 10, fatigue: 8 },
    fin: 'Le géant de chakra se défait os par os. Tes yeux saignent.',
    entree: [
      { min: 1, textes: ['Des côtes de chakra pourpre jaillissent autour de toi, puis un bras de squelette. Il voit le géant sortir de toi os par os et tombe à genoux.', 'Une cage thoracique de chakra se referme autour de toi. Ses kunai rebondissent sur les côtes du squelette.'] },
      { min: 2, textes: ['Le squelette se couvre de muscles de chakra, puis d’un visage aux yeux vides. Un géant à mi-corps se dresse au-dessus de lui.'] },
      { min: 3, textes: ['Le Susanoo se dresse en entier, armuré, plus haut que les arbres, et dans sa main naît {armeSusanoo}. Il lève les yeux et tremble.'] },
      { min: 5, textes: ['Le Susanoo parfait déploie ses ailes au-dessus du champ de bataille, {armeSusanoo} à la main. Il ne se bat même pas : il s’agenouille.'] },
    ],
  },
  biju_manteau: {
    attaque: 8,
    defense: 6,
    effet: 'Le voile de la bête protège et frappe ; il peut t’échapper.',
    entree: [{ min: 1, textes: ['Un voile de chakra rouge t’enveloppe comme une seconde peau. Tes ongles s’allongent, tes yeux se fendent.', 'La bête souffle en toi, et son chakra déborde, bouillonnant, autour de ton corps.'] }],
  },
  biju_version2: {
    attaque: 12,
    defense: 8,
    effet: 'Les queues de la bête frappent et protègent ; la bête pèse lourd sur ton esprit.',
    entretien: { sante: 4 },
    fin: 'Le chakra de la bête se retire, en emportant un peu de ta peau.',
    entree: [{ min: 1, textes: ['Une queue, deux, quatre. Ta peau se craquelle, et le chakra prend la forme d’une bête miniature autour de toi.', 'Le chakra noircit autour de toi et dresse ses queues. Tu ne marches plus : tu rôdes.'] }],
  },
  biju_mode: {
    attaque: 16,
    defense: 12,
    effet: 'La bête entière, en accord avec toi : une puissance de montagne.',
    entretien: { chakra: 8 },
    fin: 'La bête se rendort derrière le sceau, repue.',
    entree: [{ min: 1, textes: ['Tu prends la forme entière de la bête, plus haute que les arbres. Ta voix et la sienne parlent ensemble.', 'Vous ne vous disputez plus le corps : la bête se lève autour de toi, d’accord pour une fois.'] }],
  },
  akimichi_papillon: {
    attaque: 18,
    defense: 4,
    effet: 'Des ailes de papillon, une force divine ; ton corps se consume.',
    entretien: { sante: 8 },
    duree: 2,
    fin: 'Les ailes de papillon se dissipent. Tu n’as plus que la peau sur les os.',
    entree: [{ min: 1, textes: ['La pilule rouge. Ton corps fond à vue d’œil, et deux ailes de papillon faites de chakra s’ouvrent dans ton dos.', 'Tu avales la dernière pilule. Tes joues se creusent, et des ailes dorées s’ouvrent derrière toi.'] }],
  },
};
