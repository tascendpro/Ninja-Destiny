import type { EventDef, TechniqueAdverse } from '../../engine/types';
import type { AdversaireDef, Replique } from '../../engine/combat/types';
import type { Campagne, CombatDuoDef } from '../../engine/campagne/types';
import { PROFIL } from './akatsuki';

/**
 * Les combats de la campagne à deux : côte à côte contre un adversaire ajusté au binôme, ou l'un contre l'autre.
 * Le fil rouge : le Héron, un homme masqué qui traverse vos deux vies depuis l'enfance, et ses « Plumes grises ».
 */

const T = (id: string, nom: string, puissance: number, element: TechniqueAdverse['element'], duel: string, escouade: string): TechniqueAdverse => ({ id, nom, rang: 4, puissance, element, duel, escouade, signature: true });

export const TECHNIQUES_CAMPAGNE: TechniqueAdverse[] = [
  T('heron_lame_vent', 'Fūton : L’aile qui tranche', 28, 'fuuton', 'Il ouvre le bras comme une aile. Le vent part de sa manche, si fin qu’on ne le voit qu’à la ligne rouge qu’il laisse.', 'Une aile de vent balaie vos deux silhouettes d’un même geste.'),
  T('heron_immobile', 'Genjutsu : Le héron immobile', 26, undefined, 'Il se fige sur une jambe, au milieu du terrain. Tu ne peux plus détacher les yeux de lui ; tes mains, elles, ont oublié ce qu’elles faisaient.', 'Il se fige, et vous vous figez avec lui, comme deux grenouilles devant un bec.'),
  T('heron_bec', 'Le bec', 30, undefined, 'Il traverse la distance en un seul pas et frappe d’une main tendue, doigts joints, comme un bec qui pique un poisson.', 'Il passe entre vous deux, et chacun sent le bec passer à un doigt de sa gorge.'),
  T('plumes_aiguilles', 'Pluie de plumes d’acier', 20, undefined, 'Des plumes d’acier gris sifflent de partout à la fois.', 'Les Plumes grises lancent leurs aiguilles en même temps, de quatre côtés.'),
  T('plumes_filet', 'Le filet gris', 18, undefined, 'Un filet de fils lestés tombe des arbres sur tes épaules.', 'Un filet tombe des arbres sur vous deux à la fois.'),
];

const R = (id: string, categorie: Replique['categorie'], texte: string): Replique => ({ id, categorie, texte });

export const ADVERSAIRES_CAMPAGNE: AdversaireDef[] = [
  // L'autre joueur, dans un duel : son nom, ses chiffres et ses techniques viennent de sa propre fiche.
  {
    id: 'pvp_autre',
    niveau: 'selon_age',
    temperament: 'fier',
    habitudes: [],
    seuils: { fuite: 0, reddition: 0 },
    motivation: '',
    voix: { registre: 'courant', tics: [] },
    repliques: [],
  },
  {
    id: 'mc_pillards',
    nom: 'Les pillards du col',
    genre: 'm',
    niveau: 'selon_age',
    // Note d'équilibrage : un cran au-dessus du binôme, sinon deux ninjas les balaient sans effort.
    ecartNiveau: 1,
    temperament: 'feroce',
    type: 'bandit',
    escouade: true,
    habitudes: [{ id: 'pil_nombre', quand: { manche: 1 }, intention: 'attaque', poids: 50, lisible: true, texte: 'Ils chargent tous ensemble dès le premier instant, en hurlant.' }],
    seuils: { fuite: 25, reddition: 10 },
    motivation: 'La caravane, et tout ce qu’elle porte.',
    voix: { registre: 'familier', tics: [] },
    repliques: [R('pil_entree', 'entree', 'Deux gamins ! Posez vos sacs, et rentrez chez vos mères.'), R('pil_defaite', 'defaite_adv', 'On se tire ! Ces deux-là, c’est pas des gamins !')],
  },
  {
    id: 'mc_plumes',
    nom: 'Les Plumes grises',
    genre: 'f',
    niveau: 'selon_age',
    ecartNiveau: 1,
    temperament: 'froid',
    escouade: true,
    techniques: ['plumes_aiguilles', 'plumes_filet'],
    habitudes: [{ id: 'pl_separer', quand: { manche: 1 }, intention: 'technique', poids: 40, lisible: true, texte: 'Elles cherchent d’abord à vous séparer : un filet entre vous deux, puis chacun pour soi.' }],
    seuils: { fuite: 30, reddition: 0 },
    motivation: 'Les ordres du Héron.',
    voix: { registre: 'militaire', tics: ['ne parlent jamais'] },
    repliques: [R('pl_entree', 'entree', '~Quatre silhouettes grises tombent des arbres sans un bruit. Aucune ne parle.')],
  },
  {
    id: 'mc_heron',
    nom: 'Le Héron',
    genre: 'm',
    niveau: 'kage',
    temperament: 'froid',
    nature: 'fuuton',
    techniques: ['heron_lame_vent', 'heron_immobile', 'heron_bec'],
    majeure: { nom: 'Le vol du héron', puissance: 40, annonce: 'Il s’élève sur une jambe, les bras ouverts, et tout le vent du terrain se met à tourner autour de lui. Quand il retombera, ce sera sur l’un de vous deux.' },
    habitudes: [
      { id: 'he_patient', quand: { manche: 1 }, intention: 'observer', poids: 45, lisible: true, texte: 'Il ne frappe jamais le premier. Il regarde lequel de vous deux protège l’autre.' },
      { id: 'he_blesse', quand: { sousPct: 40 }, intention: 'majeure', poids: 35, lisible: true, texte: 'Blessé, il ne recule pas : il prépare son vol.' },
    ],
    seuils: { fuite: 15, reddition: 0 },
    feinte: true,
    resistances: { decisif: 0.4 },
    motivation: 'Ce qu’il a perdu dans la dernière guerre, et qu’il veut reprendre au monde entier.',
    voix: { registre: 'soutenu', tics: ['parle toujours bas'] },
    recurrent: true,
    repliques: [
      R('he_entree', 'entree', 'Vous avez grandi. Je me souviens de vous, sous la pluie, il y a si longtemps.'),
      R('he_reussite', 'reussite_joueur', 'Bien. Vous ne vous battez plus comme deux enfants. Vous vous battez comme un seul.'),
      R('he_rate', 'rate_joueur', 'Tu regardes l’autre au lieu de me regarder moi. C’est touchant. C’est mortel.'),
      R('he_imminente', 'defaite_imminente', 'Alors c’était vous… depuis le début… c’était vous.'),
      R('he_victoire', 'victoire_adv', 'Rentrez chez vous. Et demandez-vous lequel de vous deux m’a laissé gagner.'),
      R('he_defaite', 'defaite_adv', 'Le héron… attend toujours… que le poisson se trompe…'),
    ],
  },
];

const ennemi = (o: Partial<AdversaireDef> & Pick<AdversaireDef, 'id' | 'nom'>): AdversaireDef => ({
  niveau: 'selon_age',
  temperament: 'froid',
  habitudes: [],
  seuils: { fuite: 20, reddition: 0 },
  motivation: '',
  voix: { registre: 'courant', tics: [] },
  repliques: [],
  ...o,
});

ADVERSAIRES_CAMPAGNE.push(
  ennemi({ id: 'mc_ombres', nom: 'Les ombres de la brume', genre: 'f', escouade: true, ecartNiveau: 1, techniques: ['plumes_aiguilles'], repliques: [R('om_entree', 'entree', '~La brume se referme. Tu n’entends plus l’autre. Tu entends seulement des pas, autour de toi.')] }),
  ennemi({ id: 'mc_iwa', nom: 'Une escouade d’Iwa', genre: 'f', escouade: true, temperament: 'feroce', nature: 'doton', repliques: [R('iw_entree', 'entree', 'Deux ninjas, seuls ? Le sol va vous avaler.')] }),
  ennemi({ id: 'mc_ak_binome', nom: 'Deux manteaux à nuages rouges', genre: 'm', niveau: 'jonin', ecartNiveau: 1, temperament: 'froid', feinte: true, recurrent: true, techniques: ['heron_lame_vent', 'plumes_filet'], majeure: { nom: 'Leur technique combinée', puissance: 38, annonce: 'Les deux manteaux composent les mêmes signes, au même instant. Comme vous.' }, repliques: [R('akb_entree', 'entree', 'Vous êtes exactement comme on nous l’avait dit. Comme nous, autrefois.'), R('akb_defaite', 'defaite_adv', 'Alors… c’est vous… qui deviendrez nous…')] }),
  ennemi({ id: 'mc_biju', nom: 'La bête à queues', genre: 'f', niveau: 'kage', type: 'bete', temperament: 'feroce', resistances: { decisif: 0.6 }, majeure: { nom: 'La sphère de la bête', puissance: 44, annonce: 'La gueule s’ouvre. Une sphère de chakra noir grossit entre ses dents. Il faut la retenir, ou la sceller, maintenant.' }, repliques: [R('bi_entree', 'entree', '~Le sol tremble. Quelque chose de la taille d’une colline se lève, et ouvre un œil.')] }),
  ennemi({ id: 'mc_vengeur', nom: 'Le vengeur', genre: 'm', ecartNiveau: 1, temperament: 'desespere', repliques: [R('ve_entree', 'entree', 'Vingt ans. J’ai attendu vingt ans. Tu ne te souviens même pas de son visage, hein ?'), R('ve_defaite', 'defaite_adv', 'Ce n’était… pas toi… ?')] }),
  ennemi({ id: 'mc_deserteur', nom: 'L’ancien camarade', genre: 'm', ecartNiveau: 1, temperament: 'fier', repliques: [R('de_entree', 'entree', 'Vous êtes toujours ensemble. Bien. Comme ça, je n’aurai pas à vous chercher séparément.')] }),
  ennemi({ id: 'mc_assassin', nom: 'L’assassin du traité', genre: 'f', ecartNiveau: 1, temperament: 'froid', feinte: true, repliques: [R('as_entree', 'entree', '~Une silhouette sans visage, sur les toits. Le traité n’a qu’une page. Elle est venue la déchirer.')] }),
  ennemi({ id: 'mc_bandits', nom: 'Les détrousseurs de la nuit', genre: 'm', escouade: true, type: 'bandit', temperament: 'feroce', repliques: [R('bd_entree', 'entree', 'Des gamins avec des bandeaux ! Ça vaut combien, des bandeaux, au marché ?')] }),
);

const nomAk = (c: Campagne) => {
  const natures = c.creations.map((x) => x.element);
  const b = [...c.akatsuki.binomes].sort((x, y) => y.filter((id) => natures.includes(PROFIL[id].nature)).length - x.filter((id) => natures.includes(PROFIL[id].nature)).length)[0];
  return b ? `${PROFIL[b[0]].nom} et ${PROFIL[b[1]].nom}` : 'Deux manteaux à nuages rouges';
};

/** Les scènes dont les combats à deux portent le titre (l'écran de combat affiche le titre d'une scène). */
const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'conflit' as const, categorie: 'mission' as const, lieu: '$ici', enchaine: true, planifieParMoteur: true, si: { drapeau: 'campagne_combat_jamais' } };
const evenement = (id: string, titre: string, texte: string): EventDef => ({
  ...base,
  id,
  titre,
  texte,
  // Jamais tirée seule : elle ne sert qu'à nommer le combat à deux.
  choix: [{ id: 'combattre', texte: 'Combattre', effets: [{ drapeau: 'campagne_combat_vu' }] }],
});
export const EVENEMENTS_CAMPAGNE: EventDef[] = [
  evenement('mc_combat_col', 'Le col des pillards', 'Deux enfants, une caravane, une bande de pillards.'),
  evenement('mc_combat_duel', 'Face à face', 'Deux ninjas qui se connaissent par cœur.'),
  evenement('mc_combat_plumes', 'Les Plumes grises', 'Une embuscade tendue par les hommes du Héron.'),
  evenement('mc_combat_heron', 'Le Héron', 'L’homme masqué, enfin, face à vous deux.'),
  evenement('mc_combat_ombre', 'Ce qui est revenu', 'Un visage qu’on a enterré, et qui se relève.'),
  evenement('mc_combat_brume', 'Dans la brume', 'Séparés par la brume, chacun contre le sien.'),
  evenement('mc_combat_frontiere', 'La frontière', 'Une escouade ennemie, et vous deux.'),
  evenement('mc_combat_miroir', 'Le binôme miroir', 'Deux manteaux à nuages rouges qui vous ressemblent.'),
  evenement('mc_combat_biju', 'Deux contre une bête', 'L’un retient, l’autre scelle.'),
  evenement('mc_combat_vengeur', 'La dette de sang', 'Un enfant devenu ninja, venu se venger.'),
  evenement('mc_combat_deserteur', 'Le retour du déserteur', 'Un ancien camarade, qui a changé.'),
  evenement('mc_combat_traite', 'L’assassin du traité', 'Une paix d’une page, et quelqu’un qui veut la déchirer.'),
  evenement('mc_combat_nuit', 'Les détrousseurs', 'Une nuit sur la route, et des voleurs.'),
  evenement('mc_combat_aube', 'La chute de l’Aube', 'Le repaire de l’Akatsuki, et ceux qui le gardent.'),
];

export const COMBATS_DUO: CombatDuoDef[] = [
  {
    id: 'premier_combat',
    evenementId: 'mc_combat_col',
    mode: 'equipe',
    adversaire: 'mc_pillards',
    contexte: 'mission',
    plafond: 7,
    enduranceMult: 1.8,
    victoire: { texte: 'Les pillards détalent dans la caillasse. La caravane repart, et le vieux marchand vous donne à chacun une pomme, très solennellement, comme une médaille.', effets: [{ stat: 'social.reputation', delta: 3 }], lien: { confiance: 6, respect: 5 }, accord: 6, souvenir: 'Votre premier combat côte à côte, au col des pillards.' },
    defaite: { texte: 'Les pillards emportent la moitié de la caravane. Vous rentrez couverts de bleus, en silence. Le soir, l’un de vous dit : « La prochaine fois. » L’autre répond : « La prochaine fois. »', effets: [{ blessure: { id: 'col', nom: 'Coups reçus au col', gravite: 1, jours: 15 } }], lien: { confiance: 3 }, accord: 3, souvenir: 'Le col des pillards, perdu ensemble.' },
  },
  {
    id: 'duel_entrainement',
    evenementId: 'mc_combat_duel',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'entrainement',
    plafond: 6,
    victoire: { texte: '', accord: 4 },
    defaite: { texte: '', accord: 4 },
  },
  {
    id: 'duel_examen',
    evenementId: 'mc_combat_duel',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'examen',
    plafond: 7,
    victoire: { texte: '', accord: 3, effets: [{ stat: 'social.reputation', delta: 4 }] },
    defaite: { texte: '', accord: 3 },
  },
  {
    id: 'duel_honneur',
    evenementId: 'mc_combat_duel',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'duel',
    plafond: 8,
    victoire: { texte: '', accord: 4, lien: { respect: 6 } },
    defaite: { texte: '', accord: 4, lien: { respect: 6 } },
  },
  {
    id: 'duel_mort',
    evenementId: 'mc_combat_duel',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'combat_a_mort',
    letal: true,
    plafond: 10,
    victoire: { texte: '' },
    defaite: { texte: '' },
  },
  {
    id: 'embuscade_plumes',
    evenementId: 'mc_combat_plumes',
    mode: 'equipe',
    adversaire: 'mc_plumes',
    contexte: 'embuscade',
    plafond: 8,
    enduranceMult: 2,
    victoire: { texte: 'La dernière Plume grise s’enfuit en boitant, et laisse derrière elle un ordre de mission plié en quatre. Ton nom est dessus. Et l’itinéraire exact que tu as suivi.', effets: [{ stat: 'social.reputation', delta: 4 }], lien: { confiance: 3 }, accord: 6, souvenir: 'L’embuscade des Plumes grises : quelqu’un connaissait votre route.' },
    defaite: { texte: 'Elles disparaissent aussi vite qu’elles sont venues, en vous laissant à terre. Elles n’ont rien pris. Elles voulaient seulement savoir ce que vous valiez.', effets: [{ blessure: { id: 'plumes', nom: 'Aiguilles des Plumes grises', gravite: 2, jours: 30 } }], accord: 3, souvenir: 'L’embuscade des Plumes grises, et la question : comment savaient-elles ?' },
  },
  {
    id: 'heron_final',
    evenementId: 'mc_combat_heron',
    mode: 'equipe',
    adversaire: 'mc_heron',
    contexte: 'combat_a_mort',
    letal: true,
    plafond: 10,
    enduranceMult: 1.6,
    victoire: { texte: 'Le masque de héron se fend en deux et tombe dans la boue. Dessous, un visage ordinaire, ridé, fatigué. Personne que vous connaissiez. C’est presque le plus terrible.', effets: [{ stat: 'social.reputation', delta: 15 }, { stat: 'social.reputationOmbre', delta: 6 }], lien: { confiance: 8, respect: 8, loyaute: 6 }, accord: 10, souvenir: 'Le Héron, tombé enfin, sous vos coups à tous les deux.' },
    defaite: { texte: 'Le Héron s’éloigne entre les arbres, sans se presser. Il vous a laissés vivre. Vous ne saurez jamais pourquoi, et c’est une blessure de plus.', effets: [{ blessure: { id: 'heron', nom: 'Le bec du Héron', gravite: 3, jours: 60 } }], accord: 4, souvenir: 'Le soir où le Héron vous a laissés vivre.' },
  },
  {
    id: 'combat_brume',
    evenementId: 'mc_combat_brume',
    mode: 'equipe',
    separes: true,
    adversaire: 'mc_ombres',
    contexte: 'embuscade',
    plafond: 6,
    enduranceMult: 1.9,
    victoire: { texte: 'La brume se lève d’un coup. Vous êtes à dix pas l’un de l’autre, chacun debout au milieu de ses adversaires tombés. Vous ne saviez pas que l’autre était si près.', lien: { peur_de_perdre: 6, confiance: 4 }, accord: 4, souvenir: 'La brume de Kiri : séparés, puis retrouvés.' },
    defaite: { texte: 'Quand la brume se lève, vous êtes tous les deux à terre, à dix pas l’un de l’autre. Les ombres sont parties. Vous rampez jusqu’à vous toucher la main.', effets: [{ blessure: { id: 'brume', nom: 'Coups reçus dans la brume', gravite: 2, jours: 25 } }], lien: { peur_de_perdre: 10 }, accord: 3, souvenir: 'La brume, et vos mains qui se cherchaient.' },
  },
  {
    id: 'combat_frontiere',
    evenementId: 'mc_combat_frontiere',
    mode: 'equipe',
    adversaire: 'mc_iwa',
    contexte: 'mission',
    plafond: 7,
    enduranceMult: 2,
    victoire: { texte: 'L’escouade se replie en laissant un blessé. Vous tenez le poste jusqu’à la relève. Le rapport de mission tient en une ligne ; au village, on en parle pendant un mois.', effets: [{ stat: 'social.reputation', delta: 5 }], accord: 5, souvenir: 'Le poste de la frontière, tenu à deux.' },
    defaite: { texte: 'Vous reculez jusqu’à la ligne de relève, en vous couvrant l’un l’autre. Vivants. C’est tout ce qu’on peut dire.', effets: [{ blessure: { id: 'frontiere', nom: 'Blessures de la frontière', gravite: 2, jours: 30 } }], accord: 3 },
  },
  {
    id: 'combat_miroir',
    evenementId: 'mc_combat_miroir',
    mode: 'equipe',
    adversaire: 'mc_ak_binome',
    nomAdversaire: nomAk,
    contexte: 'combat_a_mort',
    letal: true,
    kage: true,
    plafond: 9,
    enduranceMult: 1.7,
    victoire: { texte: 'Les deux manteaux tombent côte à côte, comme vous seriez tombés. L’un tend la main vers l’autre avant de mourir. Vous détournez les yeux en même temps.', effets: [{ stat: 'social.reputation', delta: 12 }], lien: { loyaute: 6, peur_de_perdre: 6 }, accord: 8, souvenir: 'Le binôme miroir : ce que vous auriez pu devenir.', apres: (c) => { c.akatsuki.vaincus = (c.akatsuki.vaincus ?? 0) + 1; } },
    defaite: { texte: 'Ils vous laissent vivre. « Revenez quand vous saurez ce que vous êtes l’un pour l’autre. » Et ils s’en vont, ensemble.', effets: [{ blessure: { id: 'miroir', nom: 'Le combat contre le binôme miroir', gravite: 3, jours: 60 } }], accord: 4, souvenir: 'Le binôme miroir qui vous a épargnés.' },
  },
  {
    id: 'combat_biju',
    evenementId: 'mc_combat_biju',
    mode: 'equipe',
    adversaire: 'mc_biju',
    contexte: 'combat_a_mort',
    letal: true,
    kage: true,
    plafond: 9,
    enduranceMult: 1.5,
    victoire: { texte: 'Le sceau se referme dans un bruit de porte qu’on claque au fond du monde. La bête dort. Vous êtes assis dans la boue, dos à dos, incapables de vous lever.', effets: [{ stat: 'social.reputation', delta: 15 }], lien: { confiance: 8, respect: 8 }, accord: 10, souvenir: 'Deux contre une bête : l’un a retenu, l’autre a scellé.' },
    defaite: { texte: 'La bête s’enfonce dans la forêt, laissant une tranchée derrière elle. Vous êtes vivants. Le village, lui, compte ses morts.', effets: [{ blessure: { id: 'biju', nom: 'Brûlures de chakra', gravite: 3, jours: 60 } }], accord: 4 },
  },
  {
    id: 'combat_vengeur',
    evenementId: 'mc_combat_vengeur',
    mode: 'equipe',
    adversaire: 'mc_vengeur',
    contexte: 'combat_a_mort',
    letal: true,
    plafond: 8,
    enduranceMult: 1.6,
    victoire: { texte: 'Le vengeur est à genoux. Il regarde celui qu’il a attaqué, puis l’autre. Il comprend, trop tard, qu’il s’est trompé de cible.', lien: { confiance: 4 }, accord: 4, souvenir: 'Le vengeur qui s’était trompé de cible.' },
    defaite: { texte: 'Le vengeur s’en va en boitant. « Je reviendrai. Et cette fois, je saurai lequel. »', effets: [{ blessure: { id: 'vengeur', nom: 'La lame du vengeur', gravite: 2, jours: 40 } }], accord: 2 },
  },
  {
    id: 'combat_deserteur',
    evenementId: 'mc_combat_deserteur',
    mode: 'equipe',
    adversaire: 'mc_deserteur',
    contexte: 'duel',
    plafond: 7,
    enduranceMult: 1.7,
    victoire: { texte: 'Votre ancien camarade pose un genou à terre et rit, essoufflé. « Vous n’avez pas changé. Vous vous battez toujours comme si l’autre allait tomber. »', accord: 5, souvenir: 'Le retour du déserteur, et son rire.' },
    defaite: { texte: 'Il s’en va comme il est venu, sans se retourner. Vous ne savez toujours pas pourquoi il était revenu.', accord: 2 },
  },
  {
    id: 'combat_traite',
    evenementId: 'mc_combat_traite',
    mode: 'equipe',
    adversaire: 'mc_assassin',
    contexte: 'combat_a_mort',
    letal: true,
    plafond: 8,
    enduranceMult: 1.7,
    victoire: { texte: 'L’assassin tombe du toit. Le traité est intact, taché d’un peu de sang. Personne ne saura jamais qui l’avait envoyée.', effets: [{ stat: 'social.reputation', delta: 10 }], accord: 6, souvenir: 'La nuit où vous avez sauvé le traité.' },
    defaite: { texte: 'L’assassin disparaît. Le traité est déchiré en deux sur la table. Demain, deux villages vont s’accuser.', accord: 2 },
  },
  {
    id: 'combat_nuit',
    evenementId: 'mc_combat_nuit',
    mode: 'equipe',
    adversaire: 'mc_bandits',
    contexte: 'bagarre',
    plafond: 6,
    enduranceMult: 1.6,
    victoire: { texte: 'Les détrousseurs détalent dans les fourrés, en abandonnant une marmite encore chaude. Vous mangez leur soupe en riant.', accord: 4, souvenir: 'La soupe des détrousseurs.' },
    defaite: { texte: 'Ils vous prennent vos sandales et vos ryō, et vous laissent pieds nus sur la route. Vous rentrez en vous disputant pour savoir à qui la faute.', effets: [{ stat: 'jauges.ryo', delta: -20 }], accord: 2 },
  },
  {
    id: 'combat_ombre',
    evenementId: 'mc_combat_ombre',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'duel',
    plafond: 6,
    victoire: { texte: '' },
    defaite: { texte: '' },
  },
  {
    id: 'combat_aube',
    evenementId: 'mc_combat_aube',
    mode: 'equipe',
    adversaire: 'mc_ak_binome',
    nomAdversaire: (c) => {
      const b = c.akatsuki.binomes[c.akatsuki.binomes.length - 1];
      return b ? `${PROFIL[b[0]].nom} et ${PROFIL[b[1]].nom}, les derniers gardiens` : 'Les derniers gardiens de l’Aube';
    },
    contexte: 'combat_a_mort',
    letal: true,
    kage: true,
    plafond: 10,
    enduranceMult: 1.9,
    victoire: { texte: 'Les derniers manteaux tombent. Le repaire est vide, plein d’échos, de rouleaux et d’anneaux qu’on ne portera plus. L’Aube de votre temps est finie. Vous sortez au soleil, l’un appuyé sur l’autre.', effets: [{ stat: 'social.reputation', delta: 20 }], lien: { loyaute: 8, confiance: 6 }, accord: 10, souvenir: 'La chute de l’Aube : le repaire vide, et le soleil en sortant.', apres: (c) => { c.akatsuki.detruite = true; c.akatsuki.vaincus = (c.akatsuki.vaincus ?? 0) + 1; } },
    defaite: { texte: 'Le repaire se referme sur vous comme un poing. Vous en sortez vivants, de justesse, par un conduit d’eau, sans rien avoir brisé. L’Aube se lèvera encore.', effets: [{ blessure: { id: 'aube', nom: 'Le repaire de l’Aube', gravite: 3, jours: 70 } }], accord: 5, souvenir: 'Le repaire de l’Aube, et le conduit d’eau qui vous a sauvés.' },
  },
];
