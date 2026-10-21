import type { ElementDef, MondeDef, ObjectifDef, TraitDef, VillageDef, VillageId } from '../engine/types';

// Chronologie alternative : villages, clans et pouvoirs inspirés de Naruto ; Kage, PNJ et événements originaux.
export const MONDE: MondeDef = {
  ere: 'l’ère des Villages',
  anDepart: 52,
  resume:
    'Cinquante-deux ans après la fondation des cinq grands villages cachés, le monde shinobi vit une paix armée. La Deuxième Grande Guerre s’est achevée il y a huit ans sur un traité que personne ne respecte vraiment. Aux frontières, les incidents se multiplient ; dans les villages, chacun prépare la suivante sans le dire.',
  chronologie: [
    { an: 0, texte: 'Fondation des villages cachés : les clans renoncent aux guerres privées et se rangent sous l’autorité de cinq Kage.' },
    { an: 9, texte: 'Konoha et Suna signent le premier pacte d’assistance mutuelle.' },
    { an: 17, texte: 'Première Grande Guerre shinobi, née d’un conflit de frontière au Pays de l’Herbe.' },
    { an: 21, texte: 'Chute du village d’Uzushio. Les Uzumaki survivants se dispersent ; beaucoup trouvent refuge à Konoha.' },
    { an: 29, texte: 'Kiri entre dans l’ère de la « Brume sanglante » : l’examen de fin d’Académie devient un combat à mort.' },
    { an: 36, texte: 'Début de la Deuxième Grande Guerre shinobi. Les Sept Épéistes de Kiri deviennent une légende.' },
    { an: 44, texte: 'Traité de la Vallée : fin de la Deuxième Guerre. Kumo obtient des concessions, Iwa garde ses frontières, Konoha paie le prix fort.' },
    { an: 47, texte: 'Tentative de coup d’État à Kiri. Les Sept Épéistes se dispersent et plusieurs lames disparaissent.' },
    { an: 50, texte: 'Purges de kekkei genkai à Kiri : les clans Yuki et Kaguya sont placés sous surveillance.' },
    { an: 52, texte: 'Début de ton histoire.' },
  ],
};

const D = (
  konoha: VillageDef['diplomatie'][VillageId],
  suna: VillageDef['diplomatie'][VillageId],
  kiri: VillageDef['diplomatie'][VillageId],
  kumo: VillageDef['diplomatie'][VillageId],
  iwa: VillageDef['diplomatie'][VillageId],
) => ({ konoha, suna, kiri, kumo, iwa });

export const VILLAGES: VillageDef[] = [
  {
    id: 'konoha',
    nom: 'Konoha',
    nomComplet: 'le Village caché de la Feuille',
    pays: 'Pays du Feu',
    kage: 'Hokage',
    kageNom: 'Tachibana Sōen',
    philosophie: 'La Volonté du Feu : le village est une famille, et chaque génération protège la suivante.',
    situation:
      'Le plus grand des villages, mais le plus éprouvé par la dernière guerre. Le Conseil des anciens et la police militaire Uchiha se méfient l’un de l’autre ; le Troisième Hokage tente de tenir l’équilibre.',
    diplomatie: D('soi', 'allie', 'tendu', 'hostile', 'hostile'),
    avantages: ['Clans nombreux et variés', 'Archives et enseignants réputés', 'Alliance avec Suna'],
    contraintes: ['Politique interne lourde', 'Ennemis sur deux frontières', 'Surveillance des clans puissants'],
    tensions: ['Méfiance entre le Conseil et les Uchiha', 'Les Senju déclinent', 'Les réfugiés Uzumaki restent des étrangers'],
    ennemis: ['Iwa', 'Kumo'],
    allies: ['Suna'],
    metiers: ['eclaireur', 'medical', 'assassin', 'artisan', 'sensoriel', 'renseignement'],
    armesTraditionnelles: ['Tantō', 'Kunai', 'Lames de chakra'],
    couleur: '#7a9a5a',
    bonus: { charisme: 3, controleChakra: 2 },
    naturesEnseignees: ['katon', 'fuuton', 'doton'],
    kanji: '木',
  },
  {
    id: 'suna',
    nom: 'Suna',
    nomComplet: 'le Village caché du Sable',
    pays: 'Pays du Vent',
    kage: 'Kazekage',
    kageNom: 'Kawara Jinsa',
    philosophie: 'Survivre d’abord. Au désert, l’orgueil tue plus vite que la soif.',
    situation:
      'Le daimyō du Vent réduit chaque année le budget du village et confie ses missions à d’autres. Suna compense par la stratégie, les poisons et l’art des marionnettes.',
    diplomatie: D('allie', 'soi', 'neutre', 'neutre', 'tendu'),
    avantages: ['Maîtres des poisons et des marionnettes', 'Endurance du désert', 'Alliance avec Konoha'],
    contraintes: ['Ressources rares, eau rationnée', 'Peu de clans', 'Dépendance politique envers le daimyō'],
    tensions: ['Le Kazekage prépare une succession contestée', 'Des familles pensent l’alliance avec Konoha humiliante'],
    ennemis: ['Iwa'],
    allies: ['Konoha'],
    metiers: ['marionnettiste', 'eclaireur', 'medical', 'artisan'],
    armesTraditionnelles: ['Kusarigama', 'Éventails de guerre', 'Marionnettes'],
    couleur: '#c9a15a',
    bonus: { intellect: 3, perception: 2 },
    naturesEnseignees: ['fuuton', 'doton'],
    kanji: '砂',
  },
  {
    id: 'kiri',
    nom: 'Kiri',
    nomComplet: 'le Village caché de la Brume',
    pays: 'Pays de l’Eau',
    kage: 'Mizukage',
    kageNom: 'Kirisame Rōshū',
    philosophie: 'La force sans pitié. La brume cache tout, sauf la faiblesse.',
    situation:
      'Sous le Mizukage Rōshū, Kiri vit l’ère de la Brume sanglante : examens mortels, purges des lignées, dissidence étouffée. Les Sept Épéistes se sont dispersés et leurs lames sont convoitées.',
    diplomatie: D('tendu', 'neutre', 'soi', 'tendu', 'neutre'),
    avantages: ['Maîtrise de l’eau et de la discrétion', 'Héritage des Sept Épées', 'Archipel difficile à envahir'],
    contraintes: ['Régime de terreur', 'Kekkei genkai persécutés', 'Examen de fin d’Académie mortel'],
    tensions: ['Une dissidence grandit dans l’ombre', 'Les lignées Yuki et Kaguya sont surveillées', 'Les chasseurs de déserteurs ont tous les droits'],
    ennemis: ['Kumo', 'les déserteurs'],
    allies: [],
    metiers: ['chasseur', 'assassin', 'eclaireur', 'medical', 'artisan'],
    armesTraditionnelles: ['Katana', 'Senbon', 'Les Sept Épées'],
    couleur: '#5a8fa8',
    bonus: { discretion: 3, force: 2 },
    naturesEnseignees: ['suiton', 'fuuton'],
    kanji: '霧',
  },
  {
    id: 'kumo',
    nom: 'Kumo',
    nomComplet: 'le Village caché des Nuages',
    pays: 'Pays de la Foudre',
    kage: 'Raikage',
    kageNom: 'Ikazuchi Tenma',
    philosophie: 'La puissance garantit la paix. Celui qui hésite a déjà perdu.',
    situation:
      'Sorti renforcé de la Deuxième Guerre, Kumo est la première puissance militaire. Le Raikage Tenma convoite les lignées héréditaires des autres villages pour renforcer les siennes.',
    diplomatie: D('hostile', 'neutre', 'tendu', 'soi', 'tendu'),
    avantages: ['Armée disciplinée', 'Maîtrise de la foudre et du taijutsu', 'Richesse minière'],
    contraintes: ['Discipline écrasante', 'Ambitions qui attirent l’hostilité', 'Peu de place pour la désobéissance'],
    tensions: ['Des enlèvements de porteurs de lignées sont murmurés', 'Les vétérans réclament une nouvelle guerre'],
    ennemis: ['Konoha', 'Kiri'],
    allies: [],
    metiers: ['assassin', 'eclaireur', 'medical', 'artisan'],
    armesTraditionnelles: ['Nodachi', 'Lames conductrices', 'Gantelets'],
    couleur: '#d8c25a',
    bonus: { force: 3, agilite: 2 },
    naturesEnseignees: ['raiton', 'suiton'],
    kanji: '雲',
  },
  {
    id: 'iwa',
    nom: 'Iwa',
    nomComplet: 'le Village caché des Roches',
    pays: 'Pays de la Terre',
    kage: 'Tsuchikage',
    kageNom: 'Iwagaki Dōjin',
    philosophie: 'Tenir. La roche ne gagne pas les batailles, elle survit à ceux qui les ont gagnées.',
    situation:
      'Pragmatique et méfiant, Iwa a gardé ses frontières au prix de lourdes pertes. Le vieux Tsuchikage Dōjin se méfie de tous, alliés compris, et refuse de désigner un successeur.',
    diplomatie: D('hostile', 'tendu', 'neutre', 'tendu', 'soi'),
    avantages: ['Endurance légendaire', 'Maîtrise de la terre', 'Positions défensives imprenables'],
    contraintes: ['Montagnes isolées', 'Méfiance politique généralisée', 'Rancune envers Konoha'],
    tensions: ['La succession du Tsuchikage', 'Les mineurs réclament une part des richesses du village'],
    ennemis: ['Konoha'],
    allies: [],
    metiers: ['eclaireur', 'medical', 'artisan', 'assassin'],
    armesTraditionnelles: ['Bō', 'Masses', 'Pièges'],
    couleur: '#a8805a',
    bonus: { force: 2, controleEmotionnel: 3 },
    naturesEnseignees: ['doton', 'katon'],
    kanji: '岩',
  },
];

export const ELEMENTS: ElementDef[] = [
  { id: 'katon', nom: 'Katon (Feu)', kanji: '火', description: 'Puissance offensive, destruction, intensité.', fortContre: 'fuuton', faibleContre: 'suiton' },
  { id: 'suiton', nom: 'Suiton (Eau)', kanji: '水', description: 'Adaptation, contrôle, persistance.', fortContre: 'katon', faibleContre: 'doton' },
  { id: 'fuuton', nom: 'Fūton (Vent)', kanji: '風', description: 'Tranchant, portée, vitesse.', fortContre: 'raiton', faibleContre: 'katon' },
  { id: 'raiton', nom: 'Raiton (Foudre)', kanji: '雷', description: 'Perforation, vitesse, paralysie.', fortContre: 'doton', faibleContre: 'fuuton' },
  { id: 'doton', nom: 'Doton (Terre)', kanji: '土', description: 'Défense, solidité, terrain.', fortContre: 'suiton', faibleContre: 'raiton' },
];

export const TRAITS: TraitDef[] = [
  { id: 'determine', nom: 'Déterminé·e', description: 'Tu ne lâches jamais. Entraînement légèrement plus efficace.', bonus: { controleEmotionnel: 5, force: 3 }, tag: 'travail' },
  { id: 'calme', nom: 'Calme', description: 'Rien ne te fait perdre pied facilement.', bonus: { controleEmotionnel: 8 }, tag: 'prudence' },
  { id: 'impulsif', nom: 'Impulsif·ve', description: 'Tu agis avant de réfléchir — parfois à raison.', bonus: { force: 6, agilite: 6, controleEmotionnel: -4 }, tag: 'audace' },
  { id: 'curieux', nom: 'Curieux·se', description: 'Tu veux comprendre, quitte à fouiller où il ne faut pas.', bonus: { perception: 5, intellect: 3 }, tag: 'curiosite' },
  { id: 'loyal', nom: 'Loyal·e', description: 'Ta parole et tes liens comptent plus que tout.', bonus: { charisme: 5, controleEmotionnel: 3 }, social: { loyaute: 10 }, tag: 'loyaute' },
  { id: 'mefiant', nom: 'Méfiant·e', description: 'Tu doutes de tout le monde, et tu vois venir les coups.', bonus: { perception: 10, charisme: -2 }, tag: 'prudence' },
  { id: 'compatissant', nom: 'Compatissant·e', description: 'La souffrance des autres te touche, ennemis compris.', bonus: { charisme: 5, perception: 3 }, ethique: { compassion: 20 }, tag: 'pitie' },
  { id: 'ambitieux', nom: 'Ambitieux·se', description: 'Tu vises haut, et tu le sais.', bonus: { intellect: 4, charisme: 4 }, ethique: { ambition: 20 }, tag: 'ambition' },
  { id: 'discret', nom: 'Discret·e', description: 'On t’oublie dans une pièce. C’est une arme.', bonus: { discretion: 8 }, tag: 'discretion' },
  { id: 'fier', nom: 'Fier·ère', description: 'Ton honneur ne se négocie pas.', bonus: { force: 5, controleEmotionnel: 3 }, ethique: { honneur: 15 }, tag: 'fierte' },
  { id: 'joyeux', nom: 'Rieur·se', description: 'Tu ris de tout, même quand tu as peur.', bonus: { charisme: 6, controleEmotionnel: 2 }, tag: 'humour' },
  {
    id: 'prodige',
    nom: 'Prodige',
    description:
      'Un talent qui ne se choisit pas : le destin en décide à la naissance. Progression plus rapide et plafond de maîtrise relevé d’un palier. En échange : pression, isolement, épuisement plus rapide, et des regards que tu n’auras pas choisis.',
    bonus: { intellect: 3 },
    social: { suspicion: 5 },
    tag: 'talent',
    special: true,
  },
];

export const OBJECTIFS: ObjectifDef[] = [
  { id: 'devenir_kage', nom: 'Diriger le village', description: 'Porter un jour le chapeau du Kage.' },
  { id: 'proteger', nom: 'Protéger les miens', description: 'Que personne de ceux que tu aimes ne tombe à cause de ta faiblesse.' },
  { id: 'puissance', nom: 'Devenir le plus fort', description: 'Repousser chaque limite, peu importe le prix.' },
  { id: 'verite', nom: 'Découvrir la vérité', description: 'Comprendre ce que les adultes cachent sur le passé.' },
  { id: 'paix', nom: 'Mettre fin aux guerres', description: 'Briser le cycle qui envoie des enfants mourir.' },
  { id: 'liberte', nom: 'Vivre libre', description: 'N’appartenir à personne, pas même à un village.' },
  { id: 'honorer_nom', nom: 'Faire honneur à ton nom', description: 'Que ton nom, ou celui de ton clan, soit prononcé avec respect.' },
];

export const NOMS: Record<VillageId, { m: string[]; f: string[] }> = {
  konoha: {
    m: ['Haruto', 'Ren', 'Sōma', 'Daisuke', 'Kōhei', 'Shinji', 'Takumi', 'Yūsei'],
    f: ['Aoi', 'Hinata', 'Yui', 'Sakiko', 'Mei', 'Natsuki', 'Emiko', 'Rin'],
  },
  suna: {
    m: ['Sabure', 'Hōji', 'Ishin', 'Rakushi', 'Tōru', 'Senji', 'Jinpa', 'Kazan'],
    f: ['Sara', 'Yukari', 'Kaede', 'Sayo', 'Arisu', 'Fuyu', 'Mitsu', 'Suzuha'],
  },
  kiri: {
    m: ['Kaizen', 'Mizuho', 'Shūsui', 'Ryōga', 'Kirio', 'Nagi', 'Seiji', 'Utsuro'],
    f: ['Kasumi', 'Shizuka', 'Mio', 'Ayame', 'Nagisa', 'Fubuki', 'Rui', 'Umiko'],
  },
  kumo: {
    m: ['Taiga', 'Ikki', 'Gōen', 'Kenta', 'Hayato', 'Raidō', 'Dan', 'Shōma'],
    f: ['Hikari', 'Inari', 'Tsubame', 'Mana', 'Kurumi', 'Asuka', 'Reika', 'Shiori'],
  },
  iwa: {
    m: ['Ganryū', 'Tetsuo', 'Kōseki', 'Iwao', 'Dōmon', 'Rokurō', 'Banji', 'Jūzō'],
    f: ['Ishiko', 'Sachi', 'Ryōko', 'Kōme', 'Chie', 'Hotaru', 'Kiyomi', 'Tamaki'],
  },
};
