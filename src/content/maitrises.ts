import type { ElementId, MasteryDef, PalierDef, RangTechnique, TechniqueDef, VillageId } from '../engine/types';
import { POSTURES } from './transformations';
import { TACTIQUES_EXISTANTES, TECHNIQUES_NATURES } from './techniquesNatures';

const P = (...noms: [string, string][]): PalierDef[] => noms.map(([nom, effet]) => ({ nom, effet }));

const PALIERS_BASE = P(
  ['Novice', 'Rien d’acquis encore.'],
  ['Notions', 'Les gestes de base, encore hésitants.'],
  ['Solide', 'Fiable à l’entraînement.'],
  ['Maîtrisé', 'Fiable sous la pression d’un vrai combat.'],
  ['Expert', 'Efficace, économe, inventif.'],
  ['Légendaire', 'Un style qui porte ton nom.'],
);

const PALIERS_TECHNIQUE = P(
  ['Inconnue', 'Pas encore apprise.'],
  ['Notions', 'Exécution lente et coûteuse.'],
  ['Contrôlée', 'Exécution fiable à l’entraînement.'],
  ['Maîtrisée', 'Fiable en combat, variantes possibles.'],
  ['Perfectionnée', 'Coût réduit, puissance accrue.'],
  ['Signature', 'Ta propre version de la technique.'],
);

const PALIERS_ARME = P(
  ['Novice', 'L’arme te dessert plus qu’elle ne te sert.'],
  ['Notions', 'Tu sais la tenir.'],
  ['Contrôlé', 'Tu la manies proprement à l’entraînement.'],
  ['Maîtrisé', 'Elle devient fiable en combat réel.'],
  ['Expert', 'Elle prolonge ton corps.'],
  ['Maître d’armes', 'Ton style est enseigné.'],
);

const PALIERS_NATURE = P(
  ['Latente', 'Ton affinité dort.'],
  ['Sensible', 'Tu sens la nature de ton chakra.'],
  ['Façonnée', 'Tu peux transformer ton chakra en élément.'],
  ['Maîtrisée', 'Tes techniques élémentaires sont fiables en combat.'],
  ['Fusion', 'Tu combines forme et nature avec aisance.'],
  ['Signature', 'Ta technique élémentaire unique.'],
);

const NOMS_ELEMENTS: Record<ElementId, string> = {
  katon: 'Katon (Feu)',
  suiton: 'Suiton (Eau)',
  fuuton: 'Fūton (Vent)',
  raiton: 'Raiton (Foudre)',
  doton: 'Doton (Terre)',
};

const natures: MasteryDef[] = (Object.keys(NOMS_ELEMENTS) as ElementId[]).map((el) => ({
  id: `nature_${el}`,
  nom: `Nature ${NOMS_ELEMENTS[el]}`,
  kind: 'element',
  element: el,
  description: `Transformation du chakra en ${NOMS_ELEMENTS[el].toLowerCase()}. Une seconde affinité ne s’acquiert qu’au prix d’un long entraînement.`,
  paliers: PALIERS_NATURE,
  exigences: { 1: { jours: 30 }, 2: { jours: 120 } },
  cout: 'Chakra, concentration.',
}));

// ── Natures avancées (kekkei genkai de fusion) ──
// On naît porteur d'une lignée ou non (tirage à la naissance, propre à chaque village).
// La lignée reste latente tant que les deux natures qui la composent ne sont pas éveillées (palier 1),
// puis elle s'éveille d'elle-même. Elle ne peut jamais dépasser d'un palier la plus faible de ses composantes.

const AVANCEES: {
  id: string;
  nom: string;
  composantes: [ElementId, ElementId];
  lignee: Partial<Record<VillageId, number>>;
  description: string;
  paliers: [string, string][];
  cout: string;
}[] = [
  {
    id: 'yoton',
    nom: 'Yōton (Lave)',
    composantes: ['katon', 'doton'],
    lignee: { iwa: 0.05, kiri: 0.03 },
    description: 'Fusion du feu et de la terre : roche en fusion, chaux vive. Une lignée d’Iwa, et de quelques familles de Kiri.',
    paliers: [
      ['Latente', 'Une chaleur étrange dort sous ta peau.'],
      ['Braises', 'La pierre rougit sous tes paumes.'],
      ['Coulée', 'Des projections de lave, encore lentes.'],
      ['Magma', 'Fiable en combat réel.'],
      ['Volcan', 'Le terrain fond sous tes pas.'],
      ['Cœur de la terre', 'Ta technique de lave unique.'],
    ],
    cout: 'Chakra élevé ; brûlures si le contrôle faiblit.',
  },
  {
    id: 'futton',
    nom: 'Futton (Ébullition)',
    composantes: ['katon', 'suiton'],
    lignee: { kiri: 0.04 },
    description: 'Fusion du feu et de l’eau : vapeur brûlante, brume acide. Rare, même à Kiri.',
    paliers: [
      ['Latente', 'Ta sueur fume quand tu te mets en colère.'],
      ['Buée', 'Une vapeur tiède naît de tes mains.'],
      ['Vapeur', 'Un nuage brûlant qui fait reculer.'],
      ['Brume acide', 'Fiable en combat réel.'],
      ['Geyser', 'Une explosion de vapeur.'],
      ['Chaudron', 'Ta brume unique.'],
    ],
    cout: 'Chakra ; la vapeur ne choisit pas ses victimes.',
  },
  {
    id: 'shakuton',
    nom: 'Shakuton (Incandescence)',
    composantes: ['katon', 'fuuton'],
    lignee: { suna: 0.04 },
    description: 'Fusion du feu et du vent : des sphères ardentes qui dessèchent tout ce qu’elles touchent. Une lignée de Suna.',
    paliers: [
      ['Latente', 'L’air ondule autour de toi par grande chaleur.'],
      ['Chaleur', 'Une sphère tiède, instable.'],
      ['Sphère', 'Une boule ardente qui assèche.'],
      ['Essaim', 'Fiable en combat réel.'],
      ['Fournaise', 'Plusieurs sphères à la fois.'],
      ['Soleil de Suna', 'Ta technique unique.'],
    ],
    cout: 'Chakra élevé ; épuisement rapide.',
  },
  {
    id: 'jiton',
    nom: 'Jiton (Magnétisme)',
    composantes: ['fuuton', 'doton'],
    lignee: { suna: 0.03 },
    description: 'Le chakra devient aimant : sable de fer, or, métal. Une lignée de Suna dont on dit qu’elle a donné deux Kazekage.',
    paliers: [
      ['Latente', 'Les aiguilles des boussoles s’affolent près de toi.'],
      ['Attraction', 'Les petits objets de métal glissent vers ta main.'],
      ['Sable de fer', 'Tu soulèves des grains de métal.'],
      ['Lances', 'Fiable en combat réel.'],
      ['Marée de fer', 'Un flot de métal obéit.'],
      ['Pôle', 'Ton style unique.'],
    ],
    cout: 'Chakra ; il faut transporter son métal.',
  },
  {
    id: 'ranton',
    nom: 'Ranton (Tempête)',
    composantes: ['raiton', 'suiton'],
    lignee: { kumo: 0.05 },
    description: 'Fusion de la foudre et de l’eau : des rayons de lumière qui se courbent. Une lignée de Kumo.',
    paliers: [
      ['Latente', 'L’orage te rend étrangement calme.'],
      ['Éclat', 'Une lueur liquide entre tes doigts.'],
      ['Rayon', 'Un faisceau qui se courbe.'],
      ['Faisceaux', 'Fiable en combat réel.'],
      ['Orage lumineux', 'Une pluie de rayons.'],
      ['Tempête signature', 'Ta technique unique.'],
    ],
    cout: 'Chakra élevé, concentration extrême.',
  },
  {
    id: 'bakuton',
    nom: 'Bakuton (Explosion)',
    composantes: ['doton', 'raiton'],
    lignee: { iwa: 0.04 },
    description: 'Le chakra de terre, déclenché par la foudre, explose. Iwa en a fait un corps d’armée.',
    paliers: [
      ['Latente', 'La terre crépite parfois sous tes paumes.'],
      ['Étincelle', 'De petites détonations incontrôlées.'],
      ['Détonation', 'Une charge que tu choisis de faire sauter.'],
      ['Charges', 'Fiable en combat réel.'],
      ['Déflagration', 'Des explosions de zone.'],
      ['Art explosif', 'Ton style unique.'],
    ],
    cout: 'Chakra ; une erreur, et c’est toi qui sautes.',
  },
];

const naturesAvancees: MasteryDef[] = AVANCEES.map((n) => ({
  id: n.id,
  nom: n.nom,
  kind: 'element',
  kekkeiGenkai: true,
  copiable: false,
  cachee: true,
  composantes: n.composantes,
  lignee: n.lignee,
  description: `${n.description} Exige l’éveil de ${n.composantes.map((e) => NOMS_ELEMENTS[e]).join(' et ')}.`,
  eveil: { ageMin: 10, ageMax: 60, potentielMin: 40, chanceBase: 0.3, automatique: 10, danger: true },
  prerequis: n.composantes.map((e) => ({ maitrise: `nature_${e}`, palierMin: 1 })),
  paliers: P(...n.paliers),
  exigences: { 2: { jours: 120, combats: 1 }, 3: { jours: 300, combats: 8, ageMin: 15 }, 4: { jours: 600, combats: 20, ageMin: 18 } },
  cout: n.cout,
}));

// ── Bijū : le chakra d'une bête à queues, scellé dans un enfant ──
const chakraBiju: MasteryDef = {
  id: 'chakra_biju',
  nom: 'Chakra du bijū',
  kind: 'biju',
  copiable: false,
  cachee: true,
  description:
    'Le chakra de la bête scellée en toi. Il fuit d’abord malgré toi, sous la peur ou la colère. Le maîtriser demande des années, et un accord avec la bête elle-même.',
  eveil: { ageMin: 6, ageMax: 60, potentielMin: 0, chanceBase: 0.3, danger: true },
  paliers: P(
    ['Scellé', 'Le sceau tient. Tu ne sens rien, ou presque.'],
    ['Fuite', 'Le chakra déborde sous l’émotion, sans contrôle.'],
    ['Manteau', 'Un voile de chakra que tu retiens quelques instants.'],
    ['Rencontre', 'Tu as vu la bête derrière le sceau. Elle t’a vu.'],
    ['Accord', 'Vous combattez ensemble, au moins un temps.'],
    ['Harmonie', 'Deux volontés, un seul corps.'],
  ),
  exigences: {
    2: { jours: 90, combats: 2, moisDepuisEveil: 6 },
    3: { jours: 240, combats: 8, moisDepuisEveil: 24, ageMin: 14, drapeau: 'rencontre_biju' },
    4: { jours: 600, combats: 20, moisDepuisEveil: 60, ageMin: 18, drapeau: 'accord_biju' },
    5: { jours: 1200, combats: 40, drapeau: 'transcendance' },
  },
  cout: 'Chaque fuite fait peur au village ; la bête, elle, attend.',
};

const FAMILLES: [string, string, string][] = [
  ['kunai', 'Kunai et shuriken', 'Lancer, parer, poignarder : l’outil de base de tout ninja.'],
  ['senbon', 'Senbon et aiguilles', 'Précision chirurgicale, points vitaux, poisons.'],
  ['kenjutsu', 'Kenjutsu', 'Tantō, katana, nodachi : l’art du sabre.'],
  ['baton', 'Bō et lances', 'Allonge, contrôle, défense.'],
  ['chaine', 'Kusarigama et fils', 'Chaînes, fils d’acier, pièges.'],
  ['eventail', 'Éventails de guerre', 'Parade, vent, technique.'],
  ['lourde', 'Armes lourdes', 'Épées massives, masses, haches : la force avant tout.'],
  ['chakra', 'Lames conductrices', 'Métal qui conduit le chakra élémentaire.'],
  ['outils', 'Outils ninja', 'Parchemins explosifs, fumigènes, sceaux de stockage.'],
];

const familles: MasteryDef[] = FAMILLES.map(([id, nom, description]) => ({
  id: `famille_${id}`,
  nom,
  kind: 'weapon_family',
  famille: id,
  description,
  paliers: PALIERS_ARME,
  cout: 'Temps, usure, fatigue.',
  sansPlafondAge: true,
}));

// ── Techniques (attaques spéciales et soutien) ──
// Chaque technique s'apprend pendant le temps libre si ses prérequis sont réunis. Le rang fixe l'âge normal
// d'apprentissage ; intelligence, contrôle, réserve de chakra et talent permettent de l'avancer (voir maitrise.ts).

const T = (
  id: string,
  nom: string,
  rang: RangTechnique,
  description: string,
  technique: TechniqueDef,
  extra: Partial<MasteryDef> = {},
): MasteryDef => ({
  id,
  nom,
  kind: 'jutsu',
  rang,
  description,
  paliers: PALIERS_TECHNIQUE,
  cout: technique.offensive ? `${technique.chakra} chakra par usage${technique.sante ? `, ${technique.sante} de santé` : ''}.` : 'Peu de chakra.',
  technique,
  ...extra,
});
const nat = (e: ElementId, palier: number) => [{ maitrise: `nature_${e}`, palierMin: palier }];
const off = (categorie: TechniqueDef['categorie'], puissance: number, chakra: number, requis: TechniqueDef['requis'], enseignee: TechniqueDef['enseignee'] = 'village', sante?: number): TechniqueDef => ({
  categorie,
  puissance,
  chakra,
  sante,
  offensive: true,
  requis,
  enseignee,
});
const sout = (categorie: TechniqueDef['categorie'], requis: TechniqueDef['requis'], enseignee: TechniqueDef['enseignee'] = 'village'): TechniqueDef => ({
  categorie,
  puissance: 0,
  chakra: 4,
  offensive: false,
  requis,
  enseignee,
});
const DOJO = { drapeau: 'maitre_dojo', maitre: 'Le maître du dojo de Tetsu' };
const ERMITE = { drapeau: 'maitre_ermite', maitre: 'L’ermite du temple oublié' };

const TECHNIQUES: MasteryDef[] = [
  // Natures : rang D (nature éveillée), B (palier 3), A (palier 4)
  T('katon_braises', 'Katon : Pluie de braises', 'D', 'Une volée de braises crachées en éventail.', off('ninjutsu', 7, 8, nat('katon', 1)), { element: 'katon' }),
  T('suiton_bulles', 'Suiton : Bulles d’eau', 'D', 'Des bulles qui aveuglent et déséquilibrent.', off('ninjutsu', 6, 8, nat('suiton', 1)), { element: 'suiton' }),
  T('fuuton_rafale', 'Fūton : Rafale', 'D', 'Un souffle qui renverse un adulte.', off('ninjutsu', 7, 8, nat('fuuton', 1)), { element: 'fuuton' }),
  T('raiton_etincelles', 'Raiton : Étincelles', 'D', 'Une décharge brève qui engourdit.', off('ninjutsu', 7, 8, nat('raiton', 1)), { element: 'raiton' }),
  T('doton_boue', 'Doton : Sol de boue', 'D', 'Le sol se change en boue sous les pieds adverses.', off('ninjutsu', 6, 8, nat('doton', 1)), { element: 'doton' }),
  T('katon_phenix', 'Katon : Fleurs de phénix', 'B', 'Une gerbe de flammes guidées, qui cachent des shuriken.', off('ninjutsu', 18, 28, nat('katon', 3)), { element: 'katon' }),
  T('suiton_prison', 'Suiton : Prison aqueuse', 'B', 'Une sphère d’eau qui retient l’adversaire.', off('ninjutsu', 16, 26, nat('suiton', 3)), { element: 'suiton' }),
  T('fuuton_vide', 'Fūton : Balle de vide', 'B', 'De l’air comprimé, tiré comme un projectile.', off('ninjutsu', 18, 28, nat('fuuton', 3)), { element: 'fuuton' }),
  T('doton_lances', 'Doton : Lances de pierre', 'B', 'Des pointes de roche jaillissent du sol.', off('ninjutsu', 18, 28, nat('doton', 3)), { element: 'doton' }),
  T('suiton_cataracte', 'Suiton : Grande cataracte', 'A', 'Une vague qui balaie tout un champ de bataille.', off('ninjutsu', 26, 46, nat('suiton', 4)), { element: 'suiton' }),
  T('fuuton_tranchant', 'Fūton : Grand tranchant du vent', 'A', 'Une lame d’air qui fend la pierre.', off('ninjutsu', 26, 44, nat('fuuton', 4)), { element: 'fuuton' }),
  T('raiton_tonnerre', 'Raiton : Lame du tonnerre', 'A', 'La foudre concentrée dans la main, qui perce tout.', off('ninjutsu', 28, 44, nat('raiton', 4)), { element: 'raiton' }),
  T('doton_geant', 'Doton : Géant de terre', 'A', 'Un colosse de roche qui combat à tes côtés.', off('ninjutsu', 26, 48, nat('doton', 4)), { element: 'doton' }),

  // Ninjutsu sans nature
  T('kinobori', 'Marche sur les arbres', 'D', 'Coller le chakra aux pieds pour courir sur l’écorce.', sout('ninjutsu', [{ maitrise: 'ninjutsu', palierMin: 1 }], 'partout')),
  T('suimen', 'Marche sur l’eau', 'C', 'Le même exercice, sur une surface qui bouge.', sout('ninjutsu', [{ maitrise: 'kinobori', palierMin: 1 }], 'partout')),
  T('shunshin', 'Shunshin (déplacement éclair)', 'C', 'Un déplacement si rapide qu’il ressemble à une disparition.', off('ninjutsu', 9, 12, [{ maitrise: 'ninjutsu', palierMin: 2 }])),
  T('kage_bunshin', 'Multiclonage', 'B', 'Des clones de chair, pas d’illusion. Coûteux, et réservé aux grandes réserves.', off('ninjutsu', 16, 40, [{ maitrise: 'ninjutsu', palierMin: 3 }, { maitrise: 'bunshin', palierMin: 1 }])),
  T('paume_vide', 'Paume du vide', 'C', 'Une poussée de chakra pur, sans nature, enseignée par un ermite.', off('ninjutsu', 11, 10, [{ maitrise: 'ninjutsu', palierMin: 1 }], ERMITE)),

  // Taijutsu : pas de chakra, seulement le corps
  T('tai_tourbillon', 'Tourbillon', 'D', 'Un coup de pied circulaire, simple et redoutable.', off('taijutsu', 7, 0, [{ maitrise: 'taijutsu', palierMin: 1 }], 'partout')),
  T('tai_poing', 'Poing ferré', 'C', 'Un enchaînement qui vise toujours le même point.', off('taijutsu', 11, 0, [{ maitrise: 'taijutsu', palierMin: 2 }], 'partout')),
  T('tai_danse', 'Danse de l’ombre', 'B', 'Se glisser dans l’angle mort de l’adversaire et frapper d’en dessous.', off('taijutsu', 16, 6, [{ maitrise: 'taijutsu', palierMin: 3 }], 'partout')),
  T(
    'tai_portes',
    'Hachimon Tonkō (Ouverture des huit portes)',
    'A',
    'Lever les verrous du corps, porte après porte. Une puissance terrible, qui détruit celui qui l’emploie. La huitième porte, celle de la Mort, ne laisse presque jamais de survivant.',
    { ...off('taijutsu', 30, 10, [{ maitrise: 'taijutsu', palierMin: 4 }], 'village', 18), limite: { mort: { chance: 0.85, palierMin: 5 }, avertissement: 'La huitième porte brûle toute la vie qui te restait.' } },
    { kinjutsu: { raison: 'Détruit le corps de l’utilisateur ; la huitième porte le tue presque toujours.' } },
  ),

  // Genjutsu
  T('gen_brume', 'Genjutsu : Brume de terreur', 'D', 'Une peur sans visage qui fait trembler les mains.', off('genjutsu', 7, 8, [{ maitrise: 'genjutsu', palierMin: 1 }])),
  T('gen_reflet', 'Genjutsu : Faux reflet', 'C', 'L’adversaire frappe ton reflet, jamais toi.', off('genjutsu', 11, 14, [{ maitrise: 'genjutsu', palierMin: 2 }])),
  T('gen_etreinte', 'Genjutsu : Étreinte de l’arbre', 'B', 'Des branches imaginaires qui immobilisent, le temps d’un coup.', off('genjutsu', 17, 24, [{ maitrise: 'genjutsu', palierMin: 3 }])),

  // Armes : aucune limite de chakra, seulement de maîtrise
  T('arme_pluie', 'Pluie de kunai', 'D', 'Lancer dix kunai comme on en lance un.', off('armes', 7, 0, [{ maitrise: 'famille_kunai', palierMin: 1 }], 'partout')),
  T('arme_senbon', 'Aiguilles vitales', 'C', 'Viser les points où le corps cède.', off('armes', 11, 0, [{ maitrise: 'famille_senbon', palierMin: 2 }], 'partout')),
  T('arme_fils', 'Fils d’acier', 'C', 'Un piège de fils tendus en un éclair.', off('armes', 10, 4, [{ maitrise: 'famille_chaine', palierMin: 1 }], 'partout')),
  T('arme_croissant', 'Lame en croissant', 'C', 'Une coupe qui revient sur elle-même.', off('armes', 11, 0, [{ maitrise: 'famille_kenjutsu', palierMin: 2 }], 'partout')),
  T('arme_tornade', 'Tornade du bō', 'C', 'Le bâton tourne si vite qu’il devient un mur.', off('armes', 10, 0, [{ maitrise: 'famille_baton', palierMin: 2 }], 'partout')),
  T('arme_pieges', 'Piège de parchemins', 'C', 'Un terrain semé de parchemins explosifs.', off('armes', 12, 6, [{ maitrise: 'famille_outils', palierMin: 2 }], 'partout')),
  T('arme_aube', 'Coup de l’aube', 'B', 'Un seul geste, du fourreau à la gorge. L’art du dégainé des samouraïs.', off('armes', 18, 0, [{ maitrise: 'famille_kenjutsu', palierMin: 3 }], DOJO)),

  // Médecine et sceaux
  T('med_scalpel', 'Scalpel de chakra', 'B', 'Une lame de chakra invisible qui tranche les muscles sous la peau.', off('medical', 15, 16, [{ maitrise: 'shosen', palierMin: 2 }])),
  T('fuin_stockage', 'Sceau de stockage', 'D', 'Ranger une arme dans un trait d’encre.', sout('fuinjutsu', [{ maitrise: 'ninjutsu', palierMin: 1 }])),
  T('fuin_explosif', 'Sceau explosif', 'C', 'Un sceau qui explose à ton signal.', off('fuinjutsu', 12, 10, [{ maitrise: 'fuin_stockage', palierMin: 1 }])),

  // Fusions : on les découvre seul·e, une fois la lignée éveillée
  T('yoton_riviere', 'Yōton : Rivière de lave', 'C', 'Un flot de roche en fusion.', off('fusion', 16, 22, [{ maitrise: 'yoton', palierMin: 1 }], 'partout')),
  T('futton_brume', 'Futton : Brume acide', 'C', 'Une vapeur qui ronge le métal et la peau.', off('fusion', 15, 22, [{ maitrise: 'futton', palierMin: 1 }], 'partout')),
  T('shakuton_sphere', 'Shakuton : Sphère ardente', 'C', 'Une sphère qui dessèche tout ce qu’elle touche.', off('fusion', 16, 22, [{ maitrise: 'shakuton', palierMin: 1 }], 'partout')),
  T('jiton_sable', 'Jiton : Sable de fer', 'C', 'Un nuage de sable de fer qui frappe et protège.', off('fusion', 15, 20, [{ maitrise: 'jiton', palierMin: 1 }], 'partout')),
  T('ranton_faisceau', 'Ranton : Faisceau', 'C', 'Un rayon de lumière qui se courbe.', off('fusion', 16, 22, [{ maitrise: 'ranton', palierMin: 1 }], 'partout')),
  T('bakuton_argile', 'Bakuton : Argile explosive', 'C', 'De l’argile chargée de foudre, qui explose au contact.', off('fusion', 16, 20, [{ maitrise: 'bakuton', palierMin: 1 }], 'partout')),

  // Bijū
  T('biju_manteau', 'Manteau du bijū', 'B', 'Le chakra de la bête t’enveloppe. Il protège, il frappe, et il réclame.', { ...off('biju', 24, 20, [{ maitrise: 'chakra_biju', palierMin: 2 }], 'partout', 6), limite: { avertissement: 'Moins tu contrôles tes émotions, plus la bête risque de prendre le dessus.', controle: true } }),
];

// Combinaisons : deux natures lancées ensemble, rang C. Il faut les deux natures au palier 2, ou au palier 1 seulement
// pour un prodige ou un esprit vif (intelligence ou contrôle du chakra élevés). Ce n'est pas une lignée : n'importe qui
// peut les inventer seul·e. Les natures qui s'accordent (le vent attise le feu, l'eau conduit la foudre) frappent
// plus fort ; celles qui se contrarient coûtent plus de chakra, mais couvrent la faiblesse de l'une par l'autre.
const COMBINAISONS: [ElementId, ElementId, string, string, string, number, number][] = [
  ['katon', 'fuuton', 'combo_tempete_feu', 'Enpūton : Karyū Rasen (Tornade de feu)', 'Le vent tourne autour de tes flammes et les dresse en colonne hurlante.', 22, 26],
  ['suiton', 'raiton', 'combo_eau_foudre', 'Eau foudroyée', 'Tu noies le terrain, puis la foudre court dans chaque flaque.', 24, 30],
  ['katon', 'doton', 'combo_meteores', 'Pluie de météores', 'Des blocs de roche arrachés au sol, enflammés avant de retomber.', 21, 32],
  ['katon', 'raiton', 'combo_orage_ardent', 'Raikaton : Gōrai Ryū (Orage ardent)', 'Un éclair qui embrase tout ce qu’il touche.', 21, 32],
  ['suiton', 'fuuton', 'combo_typhon', 'Typhon', 'Une trombe d’eau que le vent fait tourner comme une vrille.', 21, 30],
  ['fuuton', 'doton', 'combo_tempete_sable', 'Tempête de poussière', 'Un mur de sable et de gravier, assez dense pour écorcher.', 20, 30],
  ['katon', 'suiton', 'combo_vapeur', 'Voile de vapeur brûlante', 'Le feu et l’eau se détruisent l’un l’autre en un brouillard qui cuit la peau.', 20, 38],
  ['suiton', 'doton', 'combo_coulee', 'Coulée de boue', 'Une coulée lourde qui ensevelit et retient.', 20, 36],
  ['fuuton', 'raiton', 'combo_ouragan', 'Raiton-Fūton : Shinkū Raijin (Ouragan électrique)', 'Une rafale chargée de foudre, que le vent rend presque impossible à guider.', 20, 38],
  ['raiton', 'doton', 'combo_pointes', 'Pointes foudroyantes', 'Des lances de pierre qui jaillissent chargées de foudre.', 20, 38],
];
const NOMS_NATURES: Record<string, string> = { katon: 'Katon', suiton: 'Suiton', fuuton: 'Fūton', raiton: 'Raiton', doton: 'Doton' };

/**
 * Les liaisons logiques : avant de mêler deux natures, il faut savoir lancer une technique de chacune (palier 2).
 * Le vent qui porte le feu exige une lame de vent et une boule de feu ; l'eau qui conduit la foudre, un jet d'eau et une décharge.
 */
const PREREQUIS_COMBO: Record<string, [string, string]> = {
  combo_tempete_feu: ['katon_boule', 'fuuton_rafale'],
  combo_eau_foudre: ['suiton_projectile', 'raiton_decharge'],
  combo_meteores: ['katon_braises', 'doton_lances'],
  combo_orage_ardent: ['katon_boule', 'raiton_lance'],
  combo_typhon: ['suiton_bulles', 'fuuton_rafale'],
  combo_tempete_sable: ['fuuton_rafale', 'doton_boue'],
  combo_vapeur: ['katon_braises', 'suiton_bulles'],
  combo_coulee: ['suiton_projectile', 'doton_boue'],
  combo_ouragan: ['fuuton_lame', 'raiton_etincelles'],
  combo_pointes: ['doton_lances', 'raiton_decharge'],
};

/** Une trinité se construit sur deux combinaisons qui la composent déjà (palier 2). */
const PREREQUIS_TRINITE: Record<string, [string, string]> = {
  trinite_orage_solaire: ['combo_tempete_feu', 'combo_orage_ardent'],
  trinite_coeur_volcan: ['combo_meteores', 'combo_pointes'],
  trinite_pluie_cendres: ['combo_tempete_feu', 'combo_meteores'],
  trinite_geyser_lave: ['combo_vapeur', 'combo_coulee'],
  trinite_mousson: ['combo_typhon', 'combo_eau_foudre'],
  trinite_sable_foudre: ['combo_tempete_sable', 'combo_ouragan'],
  trinite_ouragan_vapeur: ['combo_vapeur', 'combo_typhon'],
  trinite_tonnerre_bouillant: ['combo_vapeur', 'combo_eau_foudre'],
  trinite_glissement: ['combo_typhon', 'combo_coulee'],
  trinite_marais: ['combo_coulee', 'combo_eau_foudre'],
};

const requisDe = (table: Record<string, [string, string]>, id: string) => (table[id] ?? []).map((m) => ({ maitrise: m, palierMin: 2 }));

const TECHNIQUES_COMBINEES: MasteryDef[] = COMBINAISONS.map(([a, b, id, nom, description, puissance, chakra]) =>
  T(id, nom, 'C', `${NOMS_NATURES[a]} + ${NOMS_NATURES[b]}. ${description}`, {
    // Les natures exigées (palier 2, ou 1 pour un esprit vif ou un prodige) sont vérifiées dans blocageApprentissage ;
    // les deux techniques de base, ici.
    ...off('combinaison', puissance, chakra, requisDe(PREREQUIS_COMBO, id), 'partout'),
    elements: [a, b],
  }),
);

// Trinités : trois natures lancées ensemble, rang A, S ou SS. Il faut les trois natures un palier plus haut qu'une
// combinaison à deux, et l'âge du rang. Toutes les liaisons de trois natures parmi cinq existent : dix techniques.
const TRINITES: [ElementId, ElementId, ElementId, string, string, RangTechnique, string, number, number][] = [
  ['katon', 'fuuton', 'raiton', 'trinite_orage_solaire', 'Tenkūton : Orage solaire', 'SS', 'Le vent soulève le feu jusqu’au ciel, et la foudre y naît. Un second soleil, qui tombe.', 46, 72],
  ['katon', 'raiton', 'doton', 'trinite_coeur_volcan', 'Kazanton : Cœur du volcan foudroyé', 'SS', 'La terre s’ouvre, la lave monte, et la foudre la fait exploser de l’intérieur.', 48, 74],
  ['katon', 'fuuton', 'doton', 'trinite_pluie_cendres', 'Haiton : Pluie de cendres', 'S', 'Un nuage de cendres brûlantes et de pierres en fusion, porté par un vent qui ne retombe pas.', 38, 56],
  ['katon', 'suiton', 'doton', 'trinite_geyser_lave', 'Geyser de lave', 'S', 'L’eau prisonnière sous la roche bout, et la terre crache un geyser de pierre fondue.', 38, 58],
  ['suiton', 'fuuton', 'raiton', 'trinite_mousson', 'Raiuton : Mousson foudroyée', 'S', 'Un typhon chargé de pluie et de foudre, qui frappe partout où l’eau touche.', 37, 56],
  ['fuuton', 'raiton', 'doton', 'trinite_sable_foudre', 'Tempête de sable foudroyée', 'S', 'Un mur de sable que le vent fait tourner et que la foudre électrise grain par grain.', 36, 55],
  ['katon', 'fuuton', 'suiton', 'trinite_ouragan_vapeur', 'Ouragan de vapeur', 'A', 'Le feu et l’eau se détruisent en vapeur, et le vent la rabat sur l’ennemi.', 31, 46],
  ['katon', 'suiton', 'raiton', 'trinite_tonnerre_bouillant', 'Tonnerre bouillant', 'A', 'Une eau qui bout, et la foudre qui court dedans.', 31, 46],
  ['suiton', 'fuuton', 'doton', 'trinite_glissement', 'Glissement de montagne', 'A', 'La pluie détrempe la pente, le vent la pousse, et la montagne descend.', 30, 45],
  ['suiton', 'raiton', 'doton', 'trinite_marais', 'Marais foudroyé', 'A', 'Le sol devient marais, et la foudre court dans chaque flaque jusqu’aux genoux de l’ennemi.', 30, 44],
];

const TECHNIQUES_TRINITES: MasteryDef[] = TRINITES.map(([a, b, c, id, nom, rang, description, puissance, chakra]) =>
  T(id, nom, rang, `${NOMS_NATURES[a]} + ${NOMS_NATURES[b]} + ${NOMS_NATURES[c]}. ${description}`, {
    ...off('combinaison', puissance, chakra, requisDe(PREREQUIS_TRINITE, id), 'partout'),
    elements: [a, b, c],
  }),
);



// Pouvoirs des yeux : le Mangekyō donne à chaque porteur deux pouvoirs tirés à l'éveil (plus Susanoo pour tous),
// le Rinnegan ouvre ses chemins, et l'union des deux (Rinne Sharingan) donne les techniques ultimes.
const MGK = (p: string) => `mgk:${p}`;
const TECHNIQUES_YEUX: MasteryDef[] = [
  T('tsukuyomi', 'Tsukuyomi', 'A', 'Une illusion où trois jours passent en un battement de cils. L’adversaire en sort brisé.', { ...off('dojutsu', 26, 30, [{ maitrise: 'mangekyo', palierMin: 1 }], 'partout', 6), drapeau: MGK('tsukuyomi') }),
  T('amaterasu', 'Amaterasu', 'A', 'Des flammes noires qui ne s’éteignent pas avant d’avoir tout consumé.', { ...off('dojutsu', 30, 34, [{ maitrise: 'mangekyo', palierMin: 1 }], 'partout', 8), drapeau: MGK('amaterasu') }),
  T('kamui', 'Kamui', 'A', 'L’espace se tord autour de ton œil : les coups traversent ton corps, ou l’adversaire disparaît.', { ...off('dojutsu', 28, 32, [{ maitrise: 'mangekyo', palierMin: 1 }], 'partout', 6), drapeau: MGK('kamui') }),
  T('kotoamatsukami', 'Kotoamatsukami', 'S', 'Le plus subtil des genjutsu : réécrire la volonté d’un autre sans qu’il le sache.', { ...off('dojutsu', 34, 40, [{ maitrise: 'mangekyo', palierMin: 2 }], 'partout', 10), drapeau: MGK('kotoamatsukami') }),
  T(
    'izanagi',
    'Izanagi',
    'S',
    'Réécrire la réalité un instant : une blessure mortelle devient un rêve. L’œil qui l’utilise se ferme pour toujours.',
    { ...off('dojutsu', 32, 30, [{ maitrise: 'mangekyo', palierMin: 2 }], 'partout', 14), drapeau: MGK('izanagi'), limite: { usages: 2, chakraMaxPerdu: 10, avertissement: 'Un œil se ferme, pour toujours.' } },
    { kinjutsu: { raison: 'Coûte un œil à chaque usage ; interdite par le clan Uchiha lui-même.' } },
  ),
  T('susanoo', 'Susanoo', 'A', 'Un géant de chakra qui te protège et frappe à ta place. Chaque usage te brûle de l’intérieur.', off('dojutsu', 32, 48, [{ maitrise: 'mangekyo', palierMin: 1 }, { maitrise: 'sharingan', palierMin: 3 }], 'partout', 12)),
  T('shinra_tensei', 'Shinra Tensei', 'A', 'Tout ce qui t’entoure est repoussé d’un seul coup, avec la force d’une montagne.', off('dojutsu', 30, 36, [{ maitrise: 'rinnegan', palierMin: 1 }], 'partout')),
  T('bansho_tenin', 'Banshō Ten’in', 'B', 'L’adversaire est arraché à sa garde et attiré vers toi.', off('dojutsu', 20, 22, [{ maitrise: 'rinnegan', palierMin: 1 }], 'partout')),
  T('chibaku_tensei', 'Chibaku Tensei', 'S', 'Une sphère noire qui arrache la terre et en fait une prison de pierre suspendue dans le ciel.', off('dojutsu', 42, 60, [{ maitrise: 'rinnegan', palierMin: 3 }], 'partout', 10)),
  T('rinne_amenotejikara', 'Rinne Sharingan : Amenotejikara', 'A', 'Échanger ta place avec n’importe quoi dans ton champ de vision, en un battement de cils.', off('dojutsu', 32, 34, [{ maitrise: 'rinnegan', palierMin: 1 }, { maitrise: 'mangekyo', palierMin: 1 }], 'partout', 6)),
  T('rinne_limbo', 'Rinne Sharingan : Limbo', 'S', 'Des ombres invisibles dans un monde que seul ton œil voit, et qui frappent dans celui-ci.', off('dojutsu', 40, 50, [{ maitrise: 'rinnegan', palierMin: 2 }, { maitrise: 'mangekyo', palierMin: 2 }], 'partout', 10)),
];

/** Les techniques déjà présentes deviennent aussi des attaques spéciales. */
const TECHNIQUES_EXISTANTES: Record<string, TechniqueDef> = {
  bunshin: off('ninjutsu', 4, 4, [], 'village'),
  kawarimi: off('ninjutsu', 5, 4, [], 'village'),
  henge: sout('ninjutsu', []),
  katon_boule: off('ninjutsu', 12, 18, nat('katon', 2)),
  suiton_projectile: off('ninjutsu', 12, 18, nat('suiton', 2)),
  fuuton_lame: off('ninjutsu', 12, 16, nat('fuuton', 2)),
  raiton_decharge: off('ninjutsu', 12, 18, nat('raiton', 2)),
  doton_mur: off('ninjutsu', 10, 16, nat('doton', 2)),
  raiton_lance: off('ninjutsu', 18, 30, nat('raiton', 3)),
  suiton_dragon: off('ninjutsu', 18, 32, nat('suiton', 3)),
  katon_tempete: off('ninjutsu', 26, 48, nat('katon', 4)),
  hyoton_miroirs: off('ninjutsu', 20, 30, [{ maitrise: 'hyoton', palierMin: 2 }], 'partout'),
  shosen: sout('medical', [{ maitrise: 'ninjutsu', palierMin: 1 }]),
};

const MAITRISES_BASE: MasteryDef[] = [
  // ── Disciplines générales ──
  { id: 'taijutsu', nom: 'Taijutsu', kind: 'base', description: 'Le combat à mains nues et la condition physique. Aucun plafond d’âge : seule l’expérience compte.', paliers: PALIERS_BASE, cout: 'Fatigue, blessures d’entraînement.', sansPlafondAge: true },
  { id: 'ninjutsu', nom: 'Ninjutsu', kind: 'base', description: 'Le façonnage du chakra en techniques.', paliers: PALIERS_BASE, cout: 'Chakra.' },
  { id: 'genjutsu', nom: 'Genjutsu', kind: 'base', description: 'L’art d’illusionner les sens de l’adversaire.', paliers: PALIERS_BASE, cout: 'Chakra, concentration.' },
  ...natures,
  ...naturesAvancees,
  chakraBiju,
  ...familles,

  // ── Uchiha ──
  {
    id: 'sharingan',
    nom: 'Sharingan',
    kind: 'clan',
    clan: 'uchiha',
    kekkeiGenkai: true,
    description:
      'L’œil copieur des Uchiha. Tous ne l’éveillent pas : il naît d’un danger de mort, pour soi ou pour un proche, ou d’une émotion extrême. L’éveil n’est que le début : le maîtriser demande des années.',
    eveil: { ageMin: 8, ageMax: 25, potentielMin: 30, chanceBase: 0.15, danger: true },
    paliers: P(
      ['Latent', 'Le pouvoir dort dans ton sang.'],
      ['Un tomoe', 'Activation instable, fatigue oculaire. Lecture des mouvements lents seulement.'],
      ['Deux tomoe', 'Anticipation des mouvements. Copie de techniques de rang C au plus.'],
      ['Trois tomoe', 'Genjutsu oculaire de base. Copie de rang B au plus.'],
      ['Maîtrise complète', 'Activation sans coût notable, genjutsu avancé, lecture complète d’un combat.'],
      ['Regard signature', 'Une technique oculaire qui n’appartient qu’à toi.'],
    ),
    exigences: {
      2: { jours: 40, combats: 3, moisDepuisEveil: 6 },
      3: { jours: 150, combats: 6, moisDepuisEveil: 24, ageMin: 14 },
      4: { jours: 450, combats: 15, moisDepuisEveil: 60, ageMin: 18 },
      5: { jours: 1000, combats: 40, drapeau: 'transcendance' },
    },
    cout: 'Chakra, fatigue oculaire ; le clan et le village observent chaque éveil.',
  },
  {
    id: 'mangekyo',
    nom: 'Mangekyō Sharingan',
    kind: 'clan',
    clan: 'uchiha',
    kekkeiGenkai: true,
    cachee: true,
    nonEntrainable: true,
    description:
      'Hors de toute progression normale. Il ne s’éveille que par la perte traumatique d’un être très proche, et coûte la vue peu à peu. Chaque Mangekyō porte deux pouvoirs qui n’appartiennent qu’à lui.',
    eveil: { ageMin: 11, ageMax: 60, potentielMin: 30, chanceBase: 0.45, declencheur: 'perte_tragique' },
    prerequis: [{ maitrise: 'sharingan', palierMin: 2 }],
    paliers: P(
      ['Latent', 'Rien ne doit l’éveiller.'],
      ['Éveillé', 'Un motif nouveau dans l’œil. Chaque usage obscurcit ta vue.'],
      ['Stabilisé', 'Tu choisis quand l’ouvrir.'],
      ['Maîtrisé', 'Ses techniques te répondent.'],
      ['Perfectionné', 'Le coût s’alourdit avec la puissance.'],
      ['Au-delà', 'Réservé à une fin secrète.'],
    ),
    cout: 'Dégradation progressive et irréversible de la vue ; suspicion maximale s’il est révélé.',
  },

  // ── Rinnegan : l'œil né de la liaison du sang Uchiha et des cellules Senju ──
  {
    id: 'rinnegan',
    nom: 'Rinnegan',
    kind: 'clan',
    kekkeiGenkai: true,
    cachee: true,
    description:
      'L’œil des légendes. Il ne naît que lorsqu’un Sharingan mûr rencontre la force vitale des Senju — par le sang, ou par des cellules régénératrices greffées. La liaison prend des années ; l’éveil, une nuit.',
    eveil: { ageMin: 16, ageMax: 80, potentielMin: 0, chanceBase: 0.35, declencheur: 'liaison_senju_uchiha' },
    prerequis: [{ maitrise: 'sharingan', palierMin: 3 }],
    paliers: P(
      ['Latent', 'Deux sangs qui se cherchent.'],
      ['Éveillé', 'Des cercles concentriques dans l’œil. Tu vois les flux de chakra comme des rivières.'],
      ['Stabilisé', 'Attraction et répulsion t’obéissent.'],
      ['Maîtrisé', 'Les chemins du Rinnegan s’ouvrent.'],
      ['Souverain', 'On dit que les dieux avaient ces yeux.'],
      ['Au-delà', 'Réservé à une fin secrète.'],
    ),
    exigences: {
      2: { jours: 120, combats: 4 },
      3: { jours: 400, combats: 10, ageMin: 22 },
      4: { jours: 900, combats: 25, ageMin: 30 },
    },
    cout: 'Un chakra immense ; le monde entier voudra ces yeux.',
  },

  // ── Hyūga ──
  {
    id: 'byakugan',
    nom: 'Byakugan',
    kind: 'clan',
    clan: 'hyuga',
    kekkeiGenkai: true,
    description: 'L’œil blanc des Hyūga, éveillé dans l’enfance par l’éducation du clan. Sa portée et sa précision croissent avec la maîtrise.',
    eveil: { ageMin: 4, ageMax: 10, potentielMin: 0, chanceBase: 1, automatique: 6 },
    paliers: P(
      ['Latent', 'L’œil dort.'],
      ['Vision proche', 'Quelques dizaines de mètres, à travers les murs.'],
      ['Vision étendue', 'Une centaine de mètres. Tu remarques l’angle mort.'],
      ['Points de chakra', 'Tu vois les 361 points du réseau de chakra.'],
      ['Champ quasi complet', 'Plusieurs kilomètres ; l’angle mort se réduit.'],
      ['Regard absolu', 'Plus rien ne t’échappe.'],
    ),
    cout: 'Chakra ; une vie sous la hiérarchie des branches.',
  },
  {
    id: 'juken',
    nom: 'Poing souple (Jūken)',
    kind: 'clan',
    clan: 'hyuga',
    description: 'Le style de combat Hyūga, qui frappe le réseau de chakra. Il exige le Byakugan et un entraînement de taijutsu séparé.',
    prerequis: [{ maitrise: 'byakugan', palierMin: 1 }],
    paliers: PALIERS_TECHNIQUE,
    cout: 'Fatigue, précision absolue.',
  },

  // ── Nara / Yamanaka / Akimichi ──
  {
    id: 'kagemane',
    nom: 'Manipulation des ombres',
    kind: 'clan',
    clan: 'nara',
    description: 'Lier son ombre à celle de l’adversaire. Portée et durée dépendent du palier, du chakra et de la lumière disponible.',
    eveil: { ageMin: 6, ageMax: 14, potentielMin: 15, chanceBase: 0.6, automatique: 8 },
    paliers: P(
      ['Latent', 'Ton ombre est encore la tienne seule.'],
      ['Frémissement', 'Ton ombre bouge, quelques secondes, quelques pas.'],
      ['Capture', 'Immobiliser un adversaire proche.'],
      ['Contrôle', 'Imposer tes mouvements à ta cible.'],
      ['Étreinte', 'Les ombres étranglent, plusieurs cibles.'],
      ['Nuit totale', 'L’ombre devient un territoire.'],
    ),
    cout: 'Chakra ; dépend de la lumière : nuit sans lune et plein midi te trahissent.',
  },
  {
    id: 'shintenshin',
    nom: 'Transfert d’esprit',
    kind: 'clan',
    clan: 'yamanaka',
    description: 'Projeter son esprit dans le corps d’autrui. Le corps du lanceur reste vulnérable pendant l’usage.',
    eveil: { ageMin: 6, ageMax: 14, potentielMin: 15, chanceBase: 0.6, automatique: 8 },
    paliers: P(
      ['Latent', 'Tu sens les émotions sans pouvoir y entrer.'],
      ['Contact', 'Quelques secondes dans un esprit consentant.'],
      ['Possession', 'Contrôler un adversaire, brièvement.'],
      ['Infiltration', 'Fouiller une mémoire.'],
      ['Réseau', 'Relier plusieurs esprits.'],
      ['Psyché', 'Ta propre technique mentale.'],
    ),
    cout: 'Ton corps est sans défense pendant le transfert.',
  },
  {
    id: 'baika',
    nom: 'Expansion corporelle',
    kind: 'clan',
    clan: 'akimichi',
    description: 'Convertir les calories en chakra pour décupler sa taille et sa force.',
    eveil: { ageMin: 6, ageMax: 14, potentielMin: 15, chanceBase: 0.6, automatique: 8 },
    paliers: P(
      ['Latent', 'Tu as faim, c’est tout.'],
      ['Gonflement', 'Une partie du corps grossit.'],
      ['Boulet', 'Le corps entier, en roulant.'],
      ['Géant', 'Taille et force multipliées.'],
      ['Papillon', 'Puissance pure — avec les pilules, au risque d’en mourir.'],
      ['Légende', 'Ta propre forme.'],
    ),
    cout: 'Coût calorique énorme ; les pilules du clan peuvent tuer.',
  },

  // ── Aburame / Inuzuka ──
  {
    id: 'kikaichu',
    nom: 'Colonie d’insectes',
    kind: 'clan',
    clan: 'aburame',
    description: 'Une colonie vivant dans ton corps, qui grandit avec le temps et se nourrit de ton chakra.',
    eveil: { ageMin: 4, ageMax: 10, potentielMin: 0, chanceBase: 1, automatique: 6 },
    paliers: P(
      ['Latente', 'La colonie n’est pas encore installée.'],
      ['Jeune colonie', 'Quelques centaines d’insectes, peu obéissants.'],
      ['Essaim', 'Pistage, drain de chakra.'],
      ['Nuée', 'Des milliers d’insectes coordonnés.'],
      ['Ruche vivante', 'Plusieurs espèces spécialisées.'],
      ['Symbiose', 'La colonie et toi ne faites qu’un.'],
    ),
    cout: 'La colonie consomme ton chakra ; le feu et les poisons la déciment.',
  },
  {
    id: 'ninken_lien',
    nom: 'Lien avec le ninken',
    kind: 'clan',
    clan: 'inuzuka',
    description: 'Le lien de combat avec ton chien ninja. Ton chien a son propre âge, sa santé, sa progression.',
    eveil: { ageMin: 6, ageMax: 12, potentielMin: 0, chanceBase: 1, automatique: 8 },
    paliers: P(
      ['Aucun lien', 'Pas encore de compagnon.'],
      ['Complicité', 'Vous vous comprenez.'],
      ['Duo', 'Attaques combinées simples.'],
      ['Meute', 'Pistage et combat coordonnés en vrai combat.'],
      ['Fusion', 'Techniques de transformation partagée.'],
      ['Une seule âme', 'Votre style unique.'],
    ),
    cout: 'Ton ninken peut être blessé, tomber malade, mourir.',
  },

  // ── Senju / Uzumaki ──
  {
    id: 'vitalite_senju',
    nom: 'Vitalité Senju',
    kind: 'clan',
    clan: 'senju',
    description: 'Endurance et capacité de récupération héritées des fondateurs.',
    paliers: PALIERS_BASE,
    cout: 'Aucun, sinon les attentes.',
  },
  {
    id: 'mokuton',
    nom: 'Mokuton (Bois)',
    kind: 'clan',
    clan: 'senju',
    kekkeiGenkai: true,
    cachee: true,
    description: 'La nature du bois, fusion de la terre et de l’eau. Elle ne s’éveille presque jamais : il faut un potentiel exceptionnel et un moment de vie ou de mort.',
    eveil: { ageMin: 8, ageMax: 30, potentielMin: 97, chanceBase: 0.3, danger: true },
    paliers: P(
      ['Latent', 'Le bois ne répond pas.'],
      ['Pousse', 'Une branche naît de ta paume.'],
      ['Racines', 'Entraver, protéger.'],
      ['Forêt', 'Façonner le terrain.'],
      ['Bâtisseur', 'Des structures entières.'],
      ['Fondateur', 'Comme dans les légendes.'],
    ),
    cout: 'Chakra immense ; tous les villages voudront savoir.',
  },
  {
    id: 'fuinjutsu_uzumaki',
    nom: 'Sceaux d’Uzushio',
    kind: 'clan',
    clan: 'uzumaki',
    description: 'L’art des sceaux du clan Uzumaki, qui se développe par l’étude.',
    paliers: P(
      ['Ignorant·e', 'Les spirales ne te disent rien.'],
      ['Apprenti·e', 'Sceaux de stockage simples.'],
      ['Scelleur·se', 'Barrières, sceaux explosifs fiables.'],
      ['Maître des sceaux', 'Sceaux de combat.'],
      ['Gardien·ne', 'Sceaux de confinement.'],
      ['Héritier·ère d’Uzushio', 'Des sceaux que personne d’autre ne sait briser.'],
    ),
    cout: 'Temps d’étude ; une erreur peut être catastrophique.',
  },
  {
    id: 'chaines_chakra',
    nom: 'Chaînes de chakra',
    kind: 'clan',
    clan: 'uzumaki',
    kekkeiGenkai: true,
    cachee: true,
    description: 'Des chaînes de chakra pur, éveillées chez quelques rares Uzumaki sous une menace extrême.',
    eveil: { ageMin: 10, ageMax: 20, potentielMin: 70, chanceBase: 0.15, danger: true },
    paliers: P(
      ['Latent', 'Rien.'],
      ['Une chaîne', 'Instable, épuisante.'],
      ['Entraves', 'Immobiliser une cible.'],
      ['Cage', 'Plusieurs chaînes, une barrière.'],
      ['Sceau vivant', 'Les chaînes contiennent un chakra immense.'],
      ['Légende d’Uzushio', 'Ce qu’on raconte des anciens.'],
    ),
    cout: 'Épuisement total ; tous ceux qui le voient voudront te posséder.',
  },

  // ── Kiri ──
  {
    id: 'hydrification',
    nom: 'Hydrification',
    kind: 'clan',
    clan: 'hozuki',
    description: 'Liquéfier son corps pour esquiver. Dépend de l’hydratation ; vulnérable à la foudre et à la sécheresse.',
    eveil: { ageMin: 4, ageMax: 10, potentielMin: 0, chanceBase: 1, automatique: 6 },
    paliers: P(
      ['Latent', 'Ton corps est solide.'],
      ['Ruissellement', 'Un bras devient eau, par réflexe.'],
      ['Corps liquide', 'Esquiver les coups tranchants.'],
      ['Courant', 'Combattre sous forme liquide.'],
      ['Marée', 'Gonfler, frapper, disparaître.'],
      ['Océan', 'Ta forme unique.'],
    ),
    cout: 'Déshydratation ; la foudre te paralyse.',
  },
  {
    id: 'shikotsumyaku',
    nom: 'Shikotsumyaku (Os)',
    kind: 'clan',
    clan: 'kaguya',
    kekkeiGenkai: true,
    description: 'Façonner ses os en armes. S’éveille au combat ou au plus tard vers dix ans.',
    eveil: { ageMin: 6, ageMax: 12, potentielMin: 10, chanceBase: 0.25, danger: true, automatique: 10 },
    paliers: P(
      ['Latent', 'Tes os sont ordinaires.'],
      ['Éclat', 'Une pointe d’os perce la peau.'],
      ['Lame d’os', 'Une arme tirée de ton bras.'],
      ['Danse', 'Le corps entier devient arme.'],
      ['Forêt d’os', 'Des techniques de masse.'],
      ['Ossature signature', 'Ta propre danse.'],
    ),
    cout: 'Douleur, usure ; une maladie héréditaire peut se déclarer.',
  },
  {
    id: 'hyoton',
    nom: 'Hyōton (Glace)',
    kind: 'clan',
    clan: 'yuki',
    kekkeiGenkai: true,
    description: 'Fusion de l’eau et du vent. À Kiri, la montrer peut te coûter la vie.',
    eveil: { ageMin: 7, ageMax: 14, potentielMin: 30, chanceBase: 0.25, danger: true },
    paliers: P(
      ['Latent', 'Le froid dort.'],
      ['Givre', 'Le givre naît malgré toi.'],
      ['Aiguilles', 'Projectiles de glace.'],
      ['Miroirs', 'Les miroirs de glace, en combat réel.'],
      ['Tempête', 'Le terrain gèle.'],
      ['Hiver éternel', 'Ta glace unique.'],
    ),
    cout: 'Chaque usage visible te met en danger, toi et les tiens.',
  },

  // ── Suna / Kumo / Iwa (lignées propres à cette chronologie) ──
  {
    id: 'souffle_dunes',
    nom: 'Souffle des dunes',
    kind: 'clan',
    clan: 'shirakaze',
    description: 'Lire et plier le vent du désert. Renforce le Fūton et l’orientation.',
    eveil: { ageMin: 6, ageMax: 12, potentielMin: 10, chanceBase: 0.6, automatique: 8 },
    paliers: P(
      ['Latent', 'Le vent n’est que du vent.'],
      ['Écoute', 'Tu sens venir les tempêtes.'],
      ['Guide', 'Tu traverses une tempête sans te perdre.'],
      ['Courant', 'Tu plies le vent en combat.'],
      ['Tempête', 'Tu la déclenches.'],
      ['Voix du désert', 'Ta technique unique.'],
    ),
    cout: 'Loin du désert, tes repères s’effacent.',
  },
  {
    id: 'armure_foudre',
    nom: 'Armure de foudre',
    kind: 'clan',
    clan: 'raiko',
    description: 'Envelopper son corps de foudre pour accélérer ses réflexes. Héréditaire chez les Raikō.',
    eveil: { ageMin: 10, ageMax: 16, potentielMin: 20, chanceBase: 0.3, danger: true, automatique: 12 },
    paliers: P(
      ['Latent', 'Tes nerfs sont ordinaires.'],
      ['Étincelles', 'Quelques arcs sur la peau, incontrôlés.'],
      ['Gaine', 'Réflexes accélérés, brièvement.'],
      ['Armure', 'Fiable en vrai combat.'],
      ['Orage', 'Vitesse foudroyante.'],
      ['Éclair vivant', 'Ton style unique.'],
    ),
    cout: 'Usure nerveuse ; le vent la disperse.',
  },
  {
    id: 'peau_roche',
    nom: 'Peau de roche',
    kind: 'clan',
    clan: 'ishikawa',
    description: 'Durcir sa peau comme la pierre. Plus elle durcit, plus tu ralentis.',
    eveil: { ageMin: 6, ageMax: 12, potentielMin: 10, chanceBase: 0.6, automatique: 9 },
    paliers: P(
      ['Latent', 'Ta peau est ordinaire.'],
      ['Écorce', 'Les coups légers glissent.'],
      ['Granit', 'Les lames peinent à entailler.'],
      ['Rempart', 'Fiable en combat réel.'],
      ['Montagne', 'Presque invulnérable, presque immobile.'],
      ['Cœur de pierre', 'Ta forme unique.'],
    ),
    cout: 'Lenteur ; la foudre traverse la pierre.',
  },

  // ── Techniques ──
  { id: 'bunshin', nom: 'Clonage (Bunshin)', kind: 'jutsu', rang: 'E', description: 'Créer des illusions de soi.', paliers: PALIERS_TECHNIQUE, cout: 'Peu de chakra.' },
  { id: 'kawarimi', nom: 'Permutation (Kawarimi)', kind: 'jutsu', rang: 'E', description: 'Échanger sa place avec un objet.', paliers: PALIERS_TECHNIQUE, cout: 'Peu de chakra.' },
  { id: 'henge', nom: 'Métamorphose (Henge)', kind: 'jutsu', rang: 'E', description: 'Prendre une autre apparence.', paliers: PALIERS_TECHNIQUE, cout: 'Peu de chakra.' },
  { id: 'katon_boule', nom: 'Katon : Grande boule de feu', kind: 'jutsu', rang: 'C', element: 'katon', description: 'Une boule de feu soufflée.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra modéré.' },
  { id: 'suiton_projectile', nom: 'Suiton : Projectile d’eau', kind: 'jutsu', rang: 'C', element: 'suiton', description: 'Un jet d’eau sous pression.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra modéré, eau à proximité.' },
  { id: 'fuuton_lame', nom: 'Fūton : Lame de vent', kind: 'jutsu', rang: 'C', element: 'fuuton', description: 'Un souffle tranchant.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra modéré.' },
  { id: 'raiton_decharge', nom: 'Raiton : Décharge', kind: 'jutsu', rang: 'C', element: 'raiton', description: 'Une décharge qui paralyse.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra modéré.' },
  { id: 'doton_mur', nom: 'Doton : Mur de terre', kind: 'jutsu', rang: 'C', element: 'doton', description: 'Un rempart surgi du sol.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra modéré.' },
  { id: 'raiton_lance', nom: 'Raiton : Lance de foudre', kind: 'jutsu', rang: 'B', element: 'raiton', description: 'Une lance de foudre perforante.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra élevé.' },
  { id: 'suiton_dragon', nom: 'Suiton : Dragon aqueux', kind: 'jutsu', rang: 'B', element: 'suiton', description: 'Un dragon d’eau qui s’abat sur l’adversaire.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra élevé, eau abondante.' },
  { id: 'katon_tempete', nom: 'Katon : Tempête de flammes', kind: 'jutsu', rang: 'A', element: 'katon', description: 'Un mur de flammes dévastateur.', paliers: PALIERS_TECHNIQUE, cout: 'Chakra considérable.' },
  {
    id: 'hyoton_miroirs',
    nom: 'Hyōton : Makyō Hyōshō (Miroirs de glace)',
    kind: 'jutsu',
    rang: 'B',
    kekkeiGenkai: true,
    copiable: false,
    clan: 'yuki',
    description: 'Une prison de miroirs de glace. Technique héréditaire, impossible à copier.',
    paliers: PALIERS_TECHNIQUE,
    cout: 'Chakra élevé.',
  },
  { id: 'shosen', nom: 'Paume mystique', kind: 'jutsu', rang: 'C', description: 'Technique de soin de base des ninjas médicaux.', paliers: PALIERS_TECHNIQUE, cout: 'Contrôle du chakra extrême.' },
];

// Les trois Sannin : chacun n'enseigne qu'une chose, et seulement à qui il a choisi.
// Elles se reçoivent lors d'une rencontre (événements « sannin »), puis se travaillent pendant le temps libre.
const TECHNIQUES_SANNIN: MasteryDef[] = [
  T(
    'marque_maudite',
    'Marque maudite du Ciel',
    'B',
    'Trois virgules noires dans le cou, mordues par Orochimaru. La marque te transforme : peau grise, chakra décuplé. Chaque usage la nourrit, et elle te réclame.',
    { ...off('transformation', 22, 10, [], { drapeau: 'marque_maudite', maitre: 'Orochimaru' }, 8) },
    {
      paliers: P(
        ['Endormie', 'La marque n’a pas encore pris.'],
        ['Niveau 1', 'Des flammes noires courent sur ta peau ; ta force double, ta raison vacille.'],
        ['Niveau 1 contrôlé', 'Tu appelles la marque et tu la renvoies, quand tu le décides.'],
        ['Niveau 2', 'Peau grise, ailes de chair : tu deviens autre chose, le temps d’un combat.'],
        ['Niveau 2 contrôlé', 'La transformation obéit. Le prix, lui, reste le même.'],
        ['Maîtrise du sceau', 'La marque est à toi. Ou toi à elle : tu ne sais plus.'],
      ),
      sansPlafondAge: true,
      kinjutsu: { raison: 'Un sceau maudit qui tue neuf porteurs sur dix et corrompt les survivants.' },
    },
  ),
  T(
    'mode_ermite',
    'Mode ermite',
    'A',
    'L’énergie naturelle, appelée par l’immobilité parfaite, enseignée par Jiraiya et les crapauds du mont Myōboku. Les yeux cernés d’orange, tu sens tout, et chacun de tes coups porte la force de la montagne.',
    { ...off('transformation', 28, 24, [{ maitrise: 'ninjutsu', palierMin: 3 }], { drapeau: 'maitre_jiraiya', maitre: 'Jiraiya' }) },
    {
      paliers: P(
        ['Inconnu', 'Pas encore appris.'],
        ['Immobilité', 'Tu rassembles l’énergie naturelle, mais il te faut de longues minutes immobile.'],
        ['Équilibre', 'Assez d’énergie naturelle pour combattre, sans te changer en crapaud.'],
        ['Ermite', 'Tu entres en mode ermite en quelques secondes, et tu sens chaque chakra autour de toi.'],
        ['Grand ermite', 'Tu combats en mode ermite aussi longtemps qu’il le faut.'],
        ['Sage', 'La nature combat avec toi. Les crapauds parlent de toi.'],
      ),
    },
  ),
  T(
    'byakugo',
    'Sceau de Byakugō',
    'A',
    'Le losange violet sur le front de Tsunade : des années de chakra accumulées goutte à goutte dans un sceau, libérées d’un coup. Tes blessures se referment pendant que tu frappes, et ta force fend la roche.',
    { ...off('medical', 24, 20, [{ maitrise: 'shosen', palierMin: 2 }], { drapeau: 'maitre_tsunade', maitre: 'Tsunade' }), soin: 18 },
    {
      paliers: P(
        ['Inconnu', 'Pas encore appris.'],
        ['Accumulation', 'Le losange apparaît à peine ; tu y verses ton chakra chaque jour.'],
        ['Réserve', 'Assez de chakra stocké pour un combat. Tes plaies se ferment pendant que tu frappes.'],
        ['Libération', 'Le losange s’ouvre et des marques violettes courent sur ton corps.'],
        ['Création-Renaissance', 'Tes cellules se régénèrent plus vite qu’on ne peut les détruire.'],
        ['Centenaire', 'Le sceau de toute une vie : tu ne tombes plus.'],
      ),
    },
  ),
];

// ── Techniques de clan, de lignée et techniques interdites (jouables) ──
// Une technique de clan exige le pouvoir du clan (ou une lignée perdue qui le porte). Les kinjutsu ont un statut
// indépendant de leur rang, et leur prix est réel : usages comptés, réserve perdue, mort possible, sacrifice.
const C = (clan: string, hereditaire = true): Partial<MasteryDef> => ({ clan, kekkeiGenkai: hereditaire, copiable: !hereditaire });
const req = (maitrise: string, palierMin: number) => ({ maitrise, palierMin });

const TECHNIQUES_CLANS: MasteryDef[] = [
  // Hyūga
  T('hyuga_kusho', 'Hakke Kūshō (Paume du vide)', 'C', 'Une paume lancée dans le vide : l’onde de chakra frappe à plusieurs mètres.', off('taijutsu', 11, 6, [req('juken', 2)], 'partout'), C('hyuga')),
  T('hyuga_kaiten', 'Hakkeshō Kaiten (Tourbillon divin)', 'B', 'Expulser du chakra par tous les points du corps en tournant sur soi : une sphère qui repousse tout.', off('taijutsu', 16, 14, [req('juken', 3), req('byakugan', 2)], 'partout'), C('hyuga')),
  T('hyuga_64', 'Hakke Rokujūyon Shō (Soixante-quatre coups)', 'B', 'Soixante-quatre frappes qui ferment, une à une, les points de chakra de l’adversaire.', off('taijutsu', 18, 16, [req('juken', 3), req('byakugan', 2)], 'partout'), C('hyuga')),
  T('hyuga_128', 'Hakke Hyaku Nijūhachi Shō (Cent vingt-huit coups)', 'A', 'La version que seuls les maîtres du Jūken atteignent : cent vingt-huit points fermés.', off('taijutsu', 24, 22, [req('juken', 4), req('byakugan', 3)], 'partout'), C('hyuga')),
  // Nara
  T('nara_kubi', 'Kage Kubi Shibari (Étranglement de l’ombre)', 'B', 'L’ombre liée remonte le long du corps adverse et se referme sur sa gorge.', off('ninjutsu', 15, 16, [req('kagemane', 2)], 'partout'), C('nara')),
  T('nara_nui', 'Kage Nui (Couture de l’ombre)', 'A', 'Des aiguilles d’ombre solidifiée qui transpercent et cousent l’ennemi sur place.', off('ninjutsu', 21, 22, [req('kagemane', 3)], 'partout'), C('nara')),
  // Yamanaka
  T('yamanaka_shinranshin', 'Shinranshin (Confusion de l’esprit)', 'B', 'Prendre le contrôle du corps adverse sans quitter le sien : il frappe ses alliés.', off('genjutsu', 15, 14, [req('shintenshin', 2)], 'partout'), C('yamanaka')),
  // Akimichi
  T('akimichi_nikudan', 'Nikudan Sensha (Char de chair)', 'C', 'Le corps gonflé en boule, rentré sur lui-même, lancé en rouleau compresseur.', off('taijutsu', 12, 8, [req('baika', 1)], 'partout'), C('akimichi')),
  T('akimichi_hari', 'Nikudan Hari Sensha (Char hérissé)', 'B', 'Le même char, hérissé de kunai pris dans les cheveux.', off('taijutsu', 16, 12, [req('baika', 2)], 'partout'), C('akimichi')),
  T('akimichi_chodan', 'Chōdan Bakugeki (Bombe du papillon géant)', 'A', 'Le chakra converti en masse et concentré dans un seul poing, d’une taille de montagne.', off('taijutsu', 24, 22, [req('baika', 3)], 'partout'), C('akimichi')),
  T(
    'akimichi_papillon',
    'Mode papillon (Pilule rouge)',
    'S',
    'Les trois pilules du clan, jusqu’à la dernière : toute la graisse du corps convertie en chakra, des ailes de papillon dans le dos. Le corps n’y survit presque jamais.',
    { ...off('transformation', 32, 20, [req('baika', 4)], 'partout', 16), limite: { mort: { chance: 0.3 }, avertissement: 'La pilule rouge consume ce qu’il te restait de corps.' } },
    { ...C('akimichi'), kinjutsu: { raison: 'Consomme les réserves du corps jusqu’à la mort.' } },
  ),
  // Inuzuka
  T('inuzuka_gatsuga', 'Gatsūga (Croc sur croc)', 'C', 'Le maître et son chien tournoient comme deux vrilles et percent tout ce qu’ils touchent.', off('taijutsu', 12, 6, [req('ninken_lien', 1)], 'partout'), C('inuzuka')),
  T('inuzuka_garoga', 'Garōga (Double croc du loup)', 'B', 'Fusionnés en un loup bicéphale géant, ils fondent en une seule vrille.', off('taijutsu', 18, 12, [req('ninken_lien', 3)], 'partout'), C('inuzuka')),
  // Aburame
  T('aburame_essaim', 'Kikaichū : Essaim dévoreur', 'C', 'Des milliers d’insectes qui dévorent le chakra de ce qu’ils recouvrent.', off('ninjutsu', 12, 8, [req('kikaichu', 1)], 'partout'), C('aburame')),
  T('aburame_kabe', 'Mushi Kabe (Mur d’insectes)', 'B', 'Un mur vivant qui encaisse les coups, puis se referme sur l’attaquant.', off('ninjutsu', 15, 12, [req('kikaichu', 2)], 'partout'), C('aburame')),
  // Kaguya
  T('kaguya_tsubaki', 'Tsubaki no Mai (Danse du camélia)', 'C', 'Un os tiré de l’épaule, plus dur que l’acier, en guise de lame.', off('taijutsu', 12, 4, [req('shikotsumyaku', 1)], 'partout'), C('kaguya')),
  T('kaguya_karamatsu', 'Karamatsu no Mai (Danse du mélèze)', 'B', 'Des os jaillissent de tout le corps : impossible de le toucher sans s’empaler.', off('taijutsu', 16, 8, [req('shikotsumyaku', 2)], 'partout'), C('kaguya')),
  T('kaguya_tessenka', 'Tessenka no Mai (Danse de la clématite)', 'A', 'La colonne vertébrale arrachée comme un fouet, puis un bras changé en foret d’os.', off('taijutsu', 22, 14, [req('shikotsumyaku', 3)], 'partout', 4), C('kaguya')),
  T('kaguya_sawarabi', 'Sawarabi no Mai (Danse des fougères)', 'A', 'Une forêt d’os géants jaillit du sol sur tout le terrain.', off('taijutsu', 26, 24, [req('shikotsumyaku', 4)], 'partout', 8), C('kaguya')),
  // Yuki
  T('yuki_sensatsu', 'Sensatsu Suishō (Mille aiguilles de glace)', 'C', 'L’humidité de l’air gèle en mille aiguilles qui se referment sur la cible.', off('ninjutsu', 14, 14, [req('hyoton', 1)], 'partout'), C('yuki')),
  T('yuki_haryu', 'Haryū Mōko (Tigre de glace)', 'A', 'Un tigre de glace géant qui dévore tout sur son passage.', off('ninjutsu', 24, 28, [req('hyoton', 3)], 'partout'), C('yuki')),
  // Uzumaki
  T('uzumaki_kongo', 'Kongō Fūsa (Chaînes adamantines)', 'A', 'Des chaînes de chakra qui sortent du dos et immobilisent même une bête à queues.', off('fuinjutsu', 22, 20, [req('chaines_chakra', 2)], 'partout'), C('uzumaki')),
  T(
    'shiki_fujin',
    'Shiki Fūjin (Sceau du dieu de la mort)',
    'S',
    'Invoquer le dieu de la mort, qui arrache l’âme de l’adversaire et la scelle dans son propre ventre. Le prix : l’âme de celui qui l’invoque.',
    { ...off('fuinjutsu', 60, 20, [req('fuinjutsu_uzumaki', 3)], 'partout'), limite: { sacrifice: true, usages: 1, avertissement: 'Le dieu de la mort prend toujours deux âmes.' } },
    { ...C('uzumaki', false), kinjutsu: { raison: 'Sacrifice : l’âme de l’utilisateur est dévorée avec celle de la cible.' } },
  ),
  // Hōzuki
  T('hozuki_suika', 'Suika no Jutsu : Bras d’eau', 'C', 'Le bras liquéfié s’étire et frappe comme un fouet, avant de reprendre forme.', off('ninjutsu', 11, 8, [req('hydrification', 1)], 'partout'), C('hozuki')),
  T('hozuki_teppodama', 'Suiton : Teppōdama (Balle d’eau)', 'B', 'De l’eau comprimée dans la bouche, tirée comme une balle capable de percer la pierre.', off('ninjutsu', 15, 12, [req('hydrification', 2)], 'partout'), C('hozuki')),
  // Senju : Mokuton
  T('mokuton_jukai', 'Mokuton : Jukai Kōtan (Naissance d’une forêt)', 'A', 'Une forêt entière jaillit du sol et étouffe le champ de bataille.', off('ninjutsu', 26, 30, [req('mokuton', 2)], 'partout'), C('senju')),
  T('mokuton_mokuryu', 'Mokuton : Mokuryū (Dragon de bois)', 'S', 'Un dragon de bois qui enserre sa proie et boit son chakra.', off('ninjutsu', 30, 36, [req('mokuton', 3)], 'partout'), C('senju')),
  T('mokuton_kajukai', 'Mokuton : Kajukai Kōrin (Avènement d’un monde d’arbres en fleurs)', 'S', 'Des arbres en fleurs dont le pollen plonge les armées dans le sommeil.', off('ninjutsu', 32, 44, [req('mokuton', 4)], 'partout'), C('senju')),
  // Clans du jeu
  T('shirakaze_rideau', 'Fūton : Rideau des dunes', 'B', 'Un mur de sable soulevé par le souffle du clan Shirakaze, qui aveugle et écorche.', off('ninjutsu', 15, 14, [req('souffle_dunes', 2)], 'partout'), C('shirakaze')),
  T('raiko_charge', 'Raiton : Charge de l’armure', 'B', 'L’armure de foudre du clan Raikō lancée en une seule charge.', off('taijutsu', 16, 12, [req('armure_foudre', 2)], 'partout'), C('raiko')),
  T('ishikawa_poing', 'Doton : Poing de roche', 'B', 'La peau de roche du clan Ishikawa concentrée dans un seul poing.', off('taijutsu', 15, 8, [req('peau_roche', 2)], 'partout'), C('ishikawa')),

  // Techniques célèbres, transmises hors des clans
  T('raiton_chidori', 'Chidori (Mille oiseaux)', 'A', 'La foudre concentrée dans la main, au bruit de mille oiseaux. Inventée par Kakashi Hatake ; trop rapide pour qui n’a pas un œil capable de la suivre.', off('ninjutsu', 25, 26, nat('raiton', 3)), { element: 'raiton' }),
  T('rasengan', 'Rasengan (Orbe tourbillonnant)', 'A', 'Une sphère de chakra pur en rotation, sans signe ni nature. Créée par Minato, transmise par Jiraiya.', off('ninjutsu', 25, 24, [req('ninjutsu', 4)], { drapeau: 'maitre_jiraiya', maitre: 'Jiraiya' })),

  // Lignées de fusion : techniques supplémentaires
  T('futton_gokamugen', 'Futton : Gōka Mugen (Vapeur infinie)', 'B', 'Création du jeu. Une vapeur bouillante qui avance comme un mur et cuit tout ce qu’elle enveloppe.', off('fusion', 20, 26, [req('futton', 2)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('ranton_reiza', 'Ranton : Reizā Sākasu (Cirque de lasers)', 'B', 'Des dizaines de rayons d’orage qui se courbent et poursuivent leurs cibles.', off('fusion', 20, 26, [req('ranton', 2)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('yoton_yokai', 'Yōton : Yōkai no Jutsu (Lave dissolvante)', 'B', 'Une boue de lave acide crachée qui dissout la roche et la chair.', off('fusion', 20, 26, [req('yoton', 2)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('jiton_kinsa', 'Jiton : Kinsa (Poussière d’or)', 'B', 'Le magnétisme appliqué à la poussière d’or : plus lourde que le sable de fer, elle écrase et emprisonne.', off('fusion', 20, 24, [req('jiton', 2)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('shakuton_kajosatsu', 'Shakuton : Kajōsatsu (Dessèchement)', 'A', 'Des sphères de chaleur qui assèchent un corps en quelques secondes.', off('fusion', 24, 30, [req('shakuton', 3)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T(
    'bakuton_c0',
    'C0 (Autodestruction)',
    'S',
    'Avaler l’argile explosive et devenir soi-même la bombe : un cratère de dix kilomètres. Rien ne survit au centre, ni la cible ni l’artiste.',
    { ...off('fusion', 60, 30, [req('bakuton', 4)], 'partout'), limite: { sacrifice: true, usages: 1, avertissement: 'L’art est une explosion, et l’artiste en fait partie.' } },
    { kekkeiGenkai: true, copiable: false, kinjutsu: { raison: 'Sacrifice : l’utilisateur devient la bombe.' } },
  ),

  // Techniques interdites transmises par Orochimaru
  T(
    'edo_tensei',
    'Edo Tensei (Réincarnation des morts)',
    'S',
    'Rappeler l’âme d’un mort dans un corps vivant sacrifié, et le faire combattre pour soi. Inventée par Tobirama Senju, perfectionnée par Orochimaru.',
    { ...off('fuinjutsu', 30, 30, [], { drapeau: 'eleve_orochimaru', maitre: 'Orochimaru' }), limite: { ethique: { compassion: -10, honneur: -6 }, avertissement: 'Chaque mort rappelé exige un vivant sacrifié.' } },
    { kinjutsu: { raison: 'Exige un sacrifice humain pour chaque mort rappelé et profane les défunts.' }, copiable: false },
  ),

  // Izanami : le jumeau d'Izanagi
  T(
    'izanami',
    'Izanami',
    'S',
    'Enfermer l’adversaire dans une boucle de destin dont il ne sort qu’en acceptant ce qu’il est. L’œil qui l’utilise se ferme pour toujours.',
    { ...off('dojutsu', 34, 30, [req('mangekyo', 2)], 'partout', 10), drapeau: MGK('izanagi'), limite: { usages: 1, chakraMaxPerdu: 10, avertissement: 'Ton œil se ferme, et ne se rouvrira pas.' } },
    { kinjutsu: { raison: 'Coûte un œil, pour toujours.' }, copiable: false, kekkeiGenkai: true },
  ),
];

// Les pouvoirs de la bête scellée, débloqués palier après palier en apprenant à vivre avec elle.
const BETE = { avertissement: 'Moins tu contrôles tes émotions, plus la bête risque de prendre le dessus.', controle: true };
const TECHNIQUES_BIJU: MasteryDef[] = [
  T('biju_version2', 'Transformation partielle (plusieurs queues)', 'A', 'Le chakra de la bête prend forme autour de toi, avec ses queues, sa peau, sa gueule. Tu n’es plus tout à fait toi.', { ...off('biju', 28, 20, [req('chakra_biju', 3)], 'partout', 8), limite: BETE }, { copiable: false }),
  T('biju_mode', 'Mode bijū (transformation complète)', 'S', 'La bête et toi, d’accord pour une fois : tu prends sa forme entière, haute comme une montagne.', { ...off('biju', 34, 30, [req('chakra_biju', 4)], 'partout', 6), limite: BETE }, { copiable: false }),
  T('biju_dama', 'Bijūdama (sphère de la bête)', 'S', 'Chakra noir et blanc condensé dans la gueule de la bête, puis avalé et recraché : une sphère qui rase une montagne.', { ...off('biju', 40, 40, [req('chakra_biju', 5)], 'partout', 10), limite: BETE }, { copiable: false }),
];

// Techniques qui n'existent que sous une transformation (le Rasengan ermite n'a de sens qu'en mode ermite).
const SOUS = (ids: string[]): Partial<TechniqueDef> => ({ exigeTransformation: ids });
const TECHNIQUES_TRANSFORMATIONS: MasteryDef[] = [
  T('raiton_yoroi', 'Raiton no Yoroi (Armure de foudre)', 'A', 'Une armure de foudre qui accélère les nerfs : on esquive avant de voir le coup, on frappe avant qu’il ait fini de bouger.', off('transformation', 20, 24, nat('raiton', 4)), { element: 'raiton' }),
  T('raiton_lariat', 'Raiton : Lariat', 'A', 'Sous l’armure de foudre, une charge bras tendu qui fauche tout sur son passage.', { ...off('taijutsu', 26, 10, [req('raiton_yoroi', 1)]), ...SOUS(['raiton_yoroi']) }, { element: 'raiton' }),
  T('raiton_guillotine', 'Raiton : Guillotine Drop', 'S', 'Sous l’armure de foudre, un saut, puis un talon qui tombe comme un couperet.', { ...off('taijutsu', 32, 14, [req('raiton_yoroi', 3)]), ...SOUS(['raiton_yoroi']) }, { element: 'raiton' }),
  T('sennin_rasengan', 'Senpō : Rasengan ermite', 'A', 'Un Rasengan nourri d’énergie naturelle, grand comme un homme.', { ...off('ninjutsu', 30, 20, [req('mode_ermite', 2)], { drapeau: 'maitre_jiraiya', maitre: 'Jiraiya' }), ...SOUS(['mode_ermite']) }),
  T('kawazu_kumite', 'Senpō : Kawazu Kumite (taijutsu des crapauds)', 'B', 'En mode ermite, l’énergie naturelle prolonge chaque coup : il frappe même ce qu’il ne touche pas.', { ...off('taijutsu', 24, 6, [req('mode_ermite', 1)], { drapeau: 'maitre_jiraiya', maitre: 'Jiraiya' }), ...SOUS(['mode_ermite']) }),
  T('tai_ura_renge', 'Ura Renge (Lotus caché)', 'A', 'Les portes ouvertes, une série de coups qui projette l’adversaire en l’air, puis le ramène au sol en vrille.', { ...off('taijutsu', 26, 0, [req('tai_portes', 2)], 'village', 6), ...SOUS(['tai_portes']) }, { kinjutsu: { raison: 'Exige d’ouvrir les portes ; déchire le corps de l’utilisateur.' } }),
  T('tai_sekizo', 'Sekizō (Éléphant du soir)', 'S', 'Cinq coups de poing qui frappent l’air comme les pattes d’un éléphant. Seule la huitième porte le permet.', { ...off('taijutsu', 36, 0, [req('tai_portes', 4)], 'village', 10), ...SOUS(['tai_portes']) }, { kinjutsu: { raison: 'Exige la huitième porte.' } }),
  T('byakugo_okasho', 'Ōkashō (Poing de la fleur de cerisier)', 'A', 'Sous le sceau libéré, un poing chargé de chakra qui fend la terre en étoile.', { ...off('taijutsu', 26, 8, [req('byakugo', 1)], { drapeau: 'maitre_tsunade', maitre: 'Tsunade' }), ...SOUS(['byakugo']) }),
  T('marque_ailes', 'Vol de la marque (niveau 2)', 'A', 'Sous la marque de niveau 2, les ailes de chair te portent au-dessus de lui avant de plonger.', { ...off('taijutsu', 26, 8, [req('marque_maudite', 3)], { drapeau: 'marque_maudite', maitre: 'Orochimaru' }, 4), ...SOUS(['marque_maudite']) }),
  // Transformations élémentaires, ouvertes par le palier de la nature
  T('katon_manteau', 'Katon : Manteau de braises', 'B', 'Le chakra enflammé à fleur de peau : chaque coup brûle.', off('transformation', 14, 14, nat('katon', 3), 'partout'), { element: 'katon' }),
  T('katon_phenix_avatar', 'Katon : Avatar du phénix', 'S', 'Un phénix de flammes dont tu es le cœur. Il te consume aussi vite qu’il consume l’ennemi.', off('transformation', 24, 26, nat('katon', 5), 'partout'), { element: 'katon' }),
  T('katon_plongeon', 'Katon : Plongeon du phénix', 'S', 'Sous l’avatar du phénix, tu plonges du ciel comme une comète.', { ...off('ninjutsu', 32, 16, nat('katon', 5), 'partout'), ...SOUS(['katon_phenix_avatar']) }, { element: 'katon' }),
  T('suiton_maree', 'Suiton : Corps de marée', 'B', 'Une armure d’eau mouvante où les coups glissent.', off('transformation', 12, 12, nat('suiton', 3), 'partout'), { element: 'suiton' }),
  T('suiton_leviathan', 'Suiton : Armure du léviathan', 'S', 'Une masse d’eau en forme de requin géant, dont tu es le cœur.', off('transformation', 22, 26, nat('suiton', 5), 'partout'), { element: 'suiton' }),
  T('suiton_maelstrom', 'Suiton : Maelström', 'A', 'Sous l’armure du léviathan, un tourbillon qui aspire et broie.', { ...off('ninjutsu', 28, 14, nat('suiton', 5), 'partout'), ...SOUS(['suiton_leviathan']) }, { element: 'suiton' }),
  T('fuuton_voile', 'Fūton : Voile des lames', 'B', 'Une spirale de vent tranchant qui t’enveloppe.', off('transformation', 13, 12, nat('fuuton', 3), 'partout'), { element: 'fuuton' }),
  T('fuuton_ouragan_forme', 'Fūton : Forme de l’ouragan', 'S', 'Tu deviens le cœur d’une tornade : vitesse et tranchant extrêmes.', off('transformation', 24, 24, nat('fuuton', 5), 'partout'), { element: 'fuuton' }),
  T('fuuton_mille_lames', 'Fūton : Mille lames', 'A', 'Sous la forme de l’ouragan, mille lames de vent lâchées d’un coup.', { ...off('ninjutsu', 28, 14, nat('fuuton', 5), 'partout'), ...SOUS(['fuuton_ouragan_forme']) }, { element: 'fuuton' }),
  T('doton_granit', 'Doton : Peau de granit', 'B', 'Ta peau devient roche : presque rien ne passe.', off('transformation', 10, 10, nat('doton', 3), 'partout'), { element: 'doton' }),
  T('doton_titan', 'Doton : Armure du titan', 'S', 'Un colosse de roche autour de ton corps.', off('transformation', 22, 26, nat('doton', 5), 'partout'), { element: 'doton' }),
  T('doton_seisme', 'Doton : Pas du titan', 'A', 'Sous l’armure du titan, un seul pas qui fend la terre jusqu’à l’ennemi.', { ...off('taijutsu', 28, 12, nat('doton', 5), 'partout'), ...SOUS(['doton_titan']) }, { element: 'doton' }),
  T('raiton_kirin_eclair', 'Raiton : Éclair noir', 'S', 'Sous l’armure de foudre noire, tu deviens l’éclair lui-même.', { ...off('ninjutsu', 32, 16, nat('raiton', 5), 'partout'), ...SOUS(['raiton_yoroi']) }, { element: 'raiton' }),
  T('hyoton_armure', 'Hyōton : Armure de givre', 'B', 'Une armure de glace qui gèle ce qui la touche.', off('transformation', 14, 14, [req('hyoton', 3)], 'partout'), C('yuki')),
  T('yoton_cuirasse', 'Yōton : Cuirasse de lave', 'B', 'Une cuirasse de lave qui brûle tout contact.', off('transformation', 16, 16, [req('yoton', 3)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('jiton_carapace', 'Jiton : Carapace de sable de fer', 'B', 'Une carapace de sable de fer qui intercepte chaque coup.', off('transformation', 12, 14, [req('jiton', 3)], 'partout'), { kekkeiGenkai: true, copiable: false }),
  T('susanoo_yasaka', 'Susanoo : Yasaka no Magatama', 'A', 'Le Susanoo lance une volée de magatama de chakra, chacune grosse comme un rocher.', { ...off('dojutsu', 28, 14, [req('susanoo', 2)], 'partout'), ...SOUS(['susanoo']) }, { kekkeiGenkai: true, copiable: false }),
];

export const MAITRISES: MasteryDef[] = [
  ...MAITRISES_BASE.map((m) => (TECHNIQUES_EXISTANTES[m.id] ? { ...m, technique: TECHNIQUES_EXISTANTES[m.id] } : m)),
  ...TECHNIQUES,
  ...TECHNIQUES_COMBINEES,
  ...TECHNIQUES_TRINITES,
  ...TECHNIQUES_YEUX,
  ...TECHNIQUES_SANNIN,
  ...TECHNIQUES_CLANS,
  ...TECHNIQUES_BIJU,
  ...TECHNIQUES_TRANSFORMATIONS,
  ...TECHNIQUES_NATURES.map((m) => ({ ...m, paliers: PALIERS_TECHNIQUE })),
].map((m) => {
  // Les techniques d'avant reçoivent leur rôle tactique (interrompre, déséquilibrer, percer…).
  if (TACTIQUES_EXISTANTES[m.id] && m.technique) m = { ...m, technique: { ...m.technique, tactique: TACTIQUES_EXISTANTES[m.id] } };
  // Les transformations reçoivent leur posture ; la Bijūdama n'existe que sous une forme de la bête.
  const posture = POSTURES[m.id];
  if (posture && m.technique) return { ...m, technique: { ...m.technique, posture } };
  if (m.id === 'biju_dama' && m.technique) return { ...m, technique: { ...m.technique, exigeTransformation: ['biju_version2', 'biju_mode'] } };
  return m;
});
