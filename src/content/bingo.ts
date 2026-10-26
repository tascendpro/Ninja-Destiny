import type { FicheBingo } from '../engine/types';

// Le Bingo Book : le carnet que chaque jōnin garde dans sa veste. Les ninjas recherchés (primes, consignes),
// et les grands ninjas de l'époque, ceux qu'il vaut mieux connaître avant de les croiser.
// Certaines fiches restent scellées tant que l'histoire ne les a pas révélées.

export const BINGO: FicheBingo[] = [
  // ── Recherchés : l'Akatsuki ──
  {
    id: 'pain', nom: 'Pain', surnom: 'Le dieu de la pluie', village: 'Amegakure', rang: 'S', prime: 0, liste: 'recherches', affiliation: 'Akatsuki (chef)',
    description: 'Le chef de l’Akatsuki. Visage percé de tiges noires, yeux en anneaux concentriques. À Amegakure, on prie son nom. Aucune prime : aucun village n’a jamais osé en fixer une.',
    techniques: ['Rinnegan', 'Shinra Tensei', 'Banshō Ten’in'], consigne: 'Ne pas engager. Ne pas approcher. Ne pas prononcer son nom.',
    si: { un: [{ vu: 'ak_chef' }, { drapeau: 'akatsuki_membre' }] },
    notes: [{ si: { drapeau: 'pain_defie' }, texte: 'Tu l’as défié et tu as survécu. Tu es peut-être le seul.' }],
  },
  {
    id: 'konan', nom: 'Konan', surnom: 'L’ange de papier', village: 'Amegakure', rang: 'S', prime: 30000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Seule femme de l’Akatsuki, toujours aux côtés de Pain. Son corps se défait en milliers de feuilles de papier, qui deviennent lames, ailes ou explosifs.',
    techniques: ['Danse du papier divin', 'Ailes de papier'], consigne: 'Ne pas engager seul.',
    si: { un: [{ drapeau: 'akatsuki_connue' }, { vu: 'ak_chef' }] },
    notes: [{ si: { drapeau: 'akatsuki_capture_konan' }, texte: 'Livrée vivante. Elle plie des oiseaux de papier dans sa cellule, et attend quelqu’un.' }, { si: { drapeau: 'akatsuki_mort_konan' }, texte: 'Abattue par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }]
  },
  {
    id: 'itachi', nom: 'Itachi Uchiha', surnom: 'Le massacreur du clan', village: 'Konoha (déserteur)', rang: 'S', prime: 45000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'A exterminé son propre clan en une nuit, à treize ans, puis a quitté Konoha. Ses yeux suffisent : un regard, et l’adversaire passe trois jours dans son esprit.',
    techniques: ['Mangekyō Sharingan', 'Tsukuyomi', 'Amaterasu', 'Susanoo'], consigne: 'Fuir à vue. Ne jamais croiser son regard.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_capture_itachi' }, texte: 'Livré vivant par toi. Il s’est laissé faire : personne ne sait pourquoi, et ça inquiète tout le monde.' }, { si: { drapeau: 'akatsuki_itachi_echappe' }, texte: 'Tu l’as eu à ta merci. C’est du moins ce qu’il t’a laissé croire.' }, { si: { drapeau: 'akatsuki_mort_itachi' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }]
  },
  {
    id: 'kisame', nom: 'Kisame Hoshigaki', surnom: 'Le monstre de la Brume', village: 'Kiri (déserteur)', rang: 'S', prime: 32000, liste: 'recherches', affiliation: 'Akatsuki, ancien des Sept Épéistes',
    description: 'Un homme à la peau bleue et aux dents de requin, l’un des Sept Épéistes de la Brume. Sa grande épée bandée dévore le chakra de ceux qu’elle touche. Il a tué ses propres camarades pour protéger les secrets de Kiri.',
    techniques: ['Requins d’eau', 'Prison de la mer', 'Fusion avec l’épée'], consigne: 'Ne pas engager près de l’eau.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_kisame_suicide' }, texte: 'Il s’est donné à ses propres requins plutôt qu’à tes chaînes. Il n’a rien dit.' }, { si: { drapeau: 'akatsuki_mort_kisame' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }]
  },
  {
    id: 'sasori', nom: 'Sasori', surnom: 'Sasori de la Sable rouge', village: 'Suna (déserteur)', rang: 'S', prime: 28000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Le plus grand marionnettiste de l’histoire de Suna. On dit qu’il a fait de son propre corps une marionnette, et qu’il collectionne celui de ses victimes. Chacune de ses lames est empoisonnée.',
    techniques: ['Marionnettes humaines', 'Le Troisième Kazekage', 'Poisons'], consigne: 'Antidote obligatoire avant tout contact.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_capture_sasori' }, texte: 'Son cœur bat dans une boîte de cuivre scellée, quelque part sous les archives.' }, { si: { drapeau: 'akatsuki_mort_sasori' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }]
  },
  {
    id: 'deidara', nom: 'Deidara', surnom: 'L’artiste explosif', village: 'Iwa (déserteur)', rang: 'S', prime: 22000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Ancien de la division des explosifs d’Iwa. Des bouches dans les paumes, qui mâchent une argile chargée de chakra qu’il modèle en oiseaux et en araignées. Pour lui, l’art est une explosion.',
    techniques: ['Argile explosive', 'Oiseaux d’argile', 'C4 Karura'], consigne: 'Ne pas engager à découvert.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_capture_deidara' }, texte: 'Livré vivant, les paumes scellées. Il réclame de l’argile à chaque repas.' }, { si: { drapeau: 'akatsuki_deidara_explose' }, texte: 'Il s’est fait exploser plutôt que d’être pris. Il n’est rien resté à livrer.' }, { si: { drapeau: 'akatsuki_mort_deidara' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }]
  },
  {
    id: 'kakuzu', nom: 'Kakuzu', surnom: 'Le trésorier', village: 'Taki (déserteur)', rang: 'S', prime: 35000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Le plus vieux membre de l’Akatsuki : il aurait combattu le Premier Hokage. Ses fils noirs recousent son corps, qui abrite cinq cœurs volés. Il chasse les primes et compte chaque pièce deux fois.',
    techniques: ['Fils noirs', 'Cinq cœurs', 'Toutes les natures'], consigne: 'Il faut le tuer cinq fois.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_capture_kakuzu' }, texte: 'Livré vivant. Il a demandé le montant de sa prime, et l’a trouvé juste.' }, { si: { drapeau: 'akatsuki_mort_kakuzu' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }, 
      { si: { vu: 'ak_recrutement' }, texte: 'Tu l’as rencontré. Il t’a proposé un anneau.' },
      { si: { drapeau: 'akatsuki_traque_vaincue' }, texte: 'Tu l’as fait fuir, ce qui restait de ses cœurs sous le bras.' },
    ],
  },
  {
    id: 'hidan', nom: 'Hidan', surnom: 'L’immortel', village: 'Yugakure (déserteur)', rang: 'S', prime: 30000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Prêtre du dieu Jashin, armé d’une faux à trois lames. Il ne peut pas mourir. Une goutte de ton sang, un cercle tracé au sol, et chaque blessure qu’il s’inflige devient la tienne.',
    techniques: ['Rituel de Jashin', 'Faux à trois lames'], consigne: 'Ne jamais le laisser goûter ton sang.',
    si: { drapeau: 'akatsuki_connue' },
    notes: [{ si: { drapeau: 'akatsuki_capture_hidan' }, texte: 'Sa tête jure toujours, dans un sac scellé trois fois. Les gardiens se relaient toutes les heures.' }, { si: { drapeau: 'akatsuki_mort_hidan' }, texte: 'Abattu par toi. Le bureau des primes a payé, et ton nom circule désormais dans les auberges.' }, { si: { drapeau: 'akatsuki_traque_vaincue' }, texte: 'Enterré vivant sous un éboulis, par tes soins. Il jure encore.' }],
  },
  {
    id: 'zetsu', nom: 'Zetsu', surnom: 'L’espion végétal', village: 'Inconnu', rang: 'S', prime: 12000, liste: 'recherches', affiliation: 'Akatsuki',
    description: 'Une moitié noire, une moitié blanche, et une dionée géante autour du visage. Il traverse la terre et les arbres, et il voit tout. On ne sait pas s’il est humain.',
    techniques: ['Fusion avec la terre', 'Espionnage'], consigne: 'Si tu lis ceci, il le sait déjà.',
    si: { drapeau: 'akatsuki_membre' },
  },

  // ── Recherchés : les autres ──
  {
    id: 'orochimaru', nom: 'Orochimaru', surnom: 'Le Sannin serpent', village: 'Konoha (déserteur)', rang: 'S', prime: 40000, liste: 'recherches', affiliation: 'Les trois Sannin, Oto',
    description: 'L’un des trois Sannin. A quitté Konoha après des expériences sur des enfants. Cherche l’immortalité et toutes les techniques du monde. Ses marques maudites ont tué neuf porteurs sur dix.',
    techniques: ['Invocation des serpents', 'Marque maudite', 'Mue', 'Épée de Kusanagi'], consigne: 'Ne pas accepter de cadeau.',
    notes: [
      { si: { drapeau: 'marque_maudite' }, texte: 'Sa marque est dans ton cou.' },
      { si: { drapeau: 'refus_orochimaru' }, texte: 'Il t’a fait une offre. Tu as dit non.' },
    ],
  },
  {
    id: 'zabuza', nom: 'Zabuza Momochi', surnom: 'Le démon du Brouillard', village: 'Kiri (déserteur)', rang: 'A', prime: 18000, liste: 'recherches', affiliation: 'Ancien des Sept Épéistes',
    description: 'Le diplômé de Kiri qui a tué cent élèves le jour de l’examen. Tueur silencieux, il frappe depuis le brouillard avec son épée-couperet, Kubikiribōchō. A tenté de tuer le Mizukage.',
    techniques: ['Technique du brouillard', 'Meurtre silencieux', 'Dragon aqueux'], consigne: 'Ne pas engager par temps de brouillard.',
  },
  {
    id: 'kushimaru', nom: 'Kushimaru Kuriarare', surnom: 'L’aiguille', village: 'Kiri (déserteur)', rang: 'A', prime: 14000, liste: 'recherches', affiliation: 'Sept Épéistes',
    description: 'Un épéiste masqué, armé de Nuibari, l’aiguille-épée qui coud ensemble ses ennemis par un fil d’acier. Ses victimes meurent alignées comme des perles.',
    techniques: ['Nuibari', 'Meurtre silencieux'], consigne: 'Ne jamais se tenir en ligne.',
  },
  {
    id: 'raiga', nom: 'Raiga Kurosuki', surnom: 'Le chanteur des enterrements', village: 'Kiri (déserteur)', rang: 'A', prime: 12000, liste: 'recherches', affiliation: 'Sept Épéistes',
    description: 'Il pleure à chaque enterrement, surtout ceux qu’il provoque. Ses deux épées, les Kiba, appellent la foudre.',
    techniques: ['Kiba, les crocs de foudre'], consigne: 'Ne pas l’affronter par orage.',
  },
  {
    id: 'amiral', nom: 'L’Amiral', surnom: 'Le maître du Navire noir', village: 'Tous les villages (déserteur)', rang: 'S', prime: 50000, liste: 'recherches', affiliation: 'Le Navire noir, l’Ancre noire',
    description: 'Le chef d’une flotte de déserteurs venus de tous les villages. Il paie pour les familles des jōnin et collectionne les bêtes à queues. Personne ne connaît son vrai nom.',
    techniques: ['Inconnues'], consigne: 'Toute information sur lui vaut une prime.',
    si: { un: [{ drapeau: 'connait_amiral' }, { indice: 'amiral_familles' }] },
  },
  {
    id: 'goro', nom: 'Gorō le Rouge', surnom: 'Le chef des pillards', village: 'Iwa (déserteur)', rang: 'B', prime: 500, liste: 'recherches', affiliation: 'Pillards',
    description: 'Ancien jōnin devenu chef de pillards. Lent, cruel, et il a tué les trois derniers chasseurs venus pour lui.',
    techniques: ['Doton', 'Massue'], consigne: 'Mort ou vif.',
    si: { vu: 'c2r_contrat' },
    notes: [{ si: { vu: 'c2r_contrat' }, texte: 'Sa fiche est barrée d’une croix rouge. Tu sais pourquoi.' }],
  },
  {
    id: 'faucheur', nom: 'Le Faucheur', surnom: 'Le jōnin du pont suspendu', village: 'Village ennemi', rang: 'A', prime: 15000, liste: 'recherches', affiliation: 'Armée ennemie',
    description: 'Un jōnin qui a tué onze des vôtres pendant la guerre, toujours seul, toujours au milieu d’un pont.',
    techniques: ['Inconnues'], consigne: 'Ne pas engager sur un pont.',
    si: { vu: 'c3_as' },
    notes: [{ si: { drapeau: 'c3_as_vaincu' }, texte: 'Vaincu. Par toi.' }],
  },

  // ── Les grands ninjas ──
  {
    id: 'minato', nom: 'Minato Namikaze', surnom: 'L’Éclair jaune de Konoha', village: 'Konoha', rang: 'S', prime: 0, liste: 'legendes',
    description: 'Le ninja le plus rapide de l’histoire. Ses kunai à trois lames portent un sceau : où qu’ils tombent, il y est déjà. Pendant la dernière guerre, il a anéanti une armée entière seul.',
    techniques: ['Dieu du tonnerre volant', 'Rasengan'], consigne: 'Ordre officiel de tous les villages ennemis : fuir à vue.',
  },
  {
    id: 'kakashi', nom: 'Kakashi Hatake', surnom: 'Le ninja copieur', village: 'Konoha', rang: 'S', prime: 0, liste: 'legendes',
    description: 'Fils du Croc blanc. Un Sharingan greffé dans l’œil gauche, qu’il cache sous son bandeau. On dit qu’il a copié plus de mille techniques.',
    techniques: ['Sharingan', 'Chidori', 'Plus de mille techniques copiées'], consigne: 'Ne jamais lui montrer une technique deux fois.',
  },
  {
    id: 'gai', nom: 'Might Guy', surnom: 'La Belle Bête verte de Konoha', village: 'Konoha', rang: 'S', prime: 0, liste: 'legendes',
    description: 'Un spécialiste du taijutsu, incapable d’utiliser le moindre ninjutsu. Il ouvre les huit portes. Il porte une combinaison verte et il en est fier.',
    techniques: ['Huit portes', 'Tigre du soir', 'Lotus'], consigne: 'Ne jamais accepter un défi de sa part. Il y en aura un autre demain.',
  },
  {
    id: 'jiraiya', nom: 'Jiraiya', surnom: 'L’ermite des crapauds', village: 'Konoha', rang: 'S', prime: 0, liste: 'legendes', affiliation: 'Les trois Sannin',
    description: 'L’un des trois Sannin, maître du mont Myōboku et du mode ermite. Écrivain de romans que tout le monde lit et que personne n’avoue lire. Son réseau d’espions couvre tout le continent.',
    techniques: ['Mode ermite', 'Invocation des crapauds', 'Rasengan'], consigne: 'Ne pas le laisser approcher des bains.',
    notes: [{ si: { drapeau: 'maitre_jiraiya' }, texte: 'Ton maître.' }],
  },
  {
    id: 'tsunade', nom: 'Tsunade', surnom: 'La perdante légendaire', village: 'Konoha', rang: 'S', prime: 0, liste: 'legendes', affiliation: 'Les trois Sannin',
    description: 'La plus grande médecin du monde, et la plus forte des Sannin d’un seul doigt. Elle a des dettes dans toutes les maisons de jeu du continent.',
    techniques: ['Byakugō', 'Force monstrueuse', 'Ninjutsu médical'], consigne: 'Ne jamais parier avec elle. Ne jamais parier contre elle non plus.',
    notes: [{ si: { drapeau: 'maitre_tsunade' }, texte: 'Ta maîtresse. Elle te doit encore de l’argent.' }],
  },
  {
    id: 'killer_bee', nom: 'Killer Bee', surnom: 'Le jinchūriki parfait', village: 'Kumo', rang: 'S', prime: 0, liste: 'legendes',
    description: 'Le jinchūriki de la bête à huit queues, qu’il appelle son ami. Il combat avec sept sabres à la fois et rappe pendant les combats. Il rime mal. Il frappe bien.',
    techniques: ['Huit queues', 'Style des sept sabres', 'Lariat'], consigne: 'Ne pas l’interrompre pendant qu’il rappe.',
  },
  {
    id: 'chiyo', nom: 'Chiyo', surnom: 'L’aïeule des marionnettes', village: 'Suna', rang: 'A', prime: 0, liste: 'legendes',
    description: 'La plus ancienne des marionnettistes de Suna, grand-mère de Sasori. Experte en poisons, et en antidotes. Elle a inventé une technique qui rend la vie, au prix de la sienne.',
    techniques: ['Dix marionnettes', 'Poisons', 'Transfert de vie'], consigne: 'Ne jamais sous-estimer une vieille femme.',
  },
  {
    id: 'hanzo', nom: 'Hanzō', surnom: 'Hanzō la Salamandre', village: 'Amegakure', rang: 'S', prime: 0, liste: 'legendes',
    description: 'Le maître d’Amegakure, qui a donné leur titre aux trois Sannin après les avoir vaincus tous les trois à la fois. Une glande à venin de salamandre est implantée dans son corps.',
    techniques: ['Venin de salamandre', 'Invocation d’Ibuse'], consigne: 'Ne jamais combattre sans masque.',
  },
];
