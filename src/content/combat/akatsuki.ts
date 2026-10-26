import type { ElementId, TechniqueAdverse } from '../../engine/types';
import type { AdversaireDef, ConclusionDef, ContenuRacine, Replique } from '../../engine/combat/types';

/**
 * L'Akatsuki dans l'Affrontement : sept membres qu'on peut croiser, combattre et abattre pour leur prime.
 * Chacun a ses techniques signatures (jamais tirées par un adversaire ordinaire), sa grande technique annoncée,
 * ses habitudes qu'on apprend à lire, et sa voix. {il}, {Il}, {lui}, {e} s'accordent à l'adversaire.
 */
const T = (id: string, nom: string, puissance: number, element: ElementId | undefined, duel: string, escouade: string): TechniqueAdverse => ({
  id,
  nom,
  rang: 4,
  puissance,
  element,
  duel,
  escouade,
  signature: true,
});

export const TECHNIQUES_AKATSUKI: TechniqueAdverse[] = [
  // Itachi
  T('ak_itachi_corbeaux', 'Genjutsu des corbeaux', 24, undefined, 'Un vol de corbeaux traverse ton champ de vision. Quand le dernier passe, {il} n’est plus là où {il} était, et son kunai est déjà dans ton dos.', 'Les corbeaux se dispersent entre vous ; chacun de vous voit l’autre devenir un ennemi.'),
  T('ak_itachi_amaterasu', 'Amaterasu', 34, 'katon', 'Son œil saigne. Des flammes noires naissent sur ton épaule, et ne s’éteignent pas quand tu frappes dessus.', 'Les flammes noires prennent sur le premier rang, et ne s’éteignent plus.'),
  T('ak_itachi_katon', 'Katon : Grande boule de feu', 22, 'katon', 'Une sphère de feu, parfaite, sans un geste de trop. Même son feu a quelque chose de triste.', 'La boule de feu roule sur vous tous, et le clone qui l’a lancée éclate en corbeaux.'),
  // Kisame
  T('ak_kisame_requins', 'Suiton : Mille requins', 30, 'suiton', 'L’eau se lève et se découpe en requins, des dizaines, qui fondent sur toi de toutes les directions.', 'Une marée de requins traverse vos rangs ; ceux qui tombent à l’eau ne remontent pas.'),
  T('ak_kisame_prison', 'Suiton : Prison de la mer', 32, 'suiton', 'Une sphère d’eau immense se referme autour de toi. Dedans, {il} nage comme un requin, et ton chakra fuit par ta peau.', 'Il noie tout le terrain dans une prison d’eau ; il est le seul à y respirer.'),
  T('ak_kisame_samehada', 'Samehada', 28, undefined, 'Son épée bandée t’effleure à peine. Les écailles te râpent le bras, et ton chakra s’en va avec la peau.', 'Samehada passe d’un corps à l’autre, et chacun sent son chakra lui être arraché.'),
  // Sasori
  T('ak_sasori_kazekage', 'Le Troisième Kazekage', 32, undefined, 'La marionnette ouvre la bouche et le sable de fer en sort, comme une tempête noire qui prend la forme de mille aiguilles.', 'Le sable de fer s’abat sur vous tous, en pointes, en murs, en vagues.'),
  T('ak_sasori_poison', 'Lames empoisonnées', 26, undefined, 'Une queue de scorpion articulée fend l’air. Tu l’esquives presque : une seule égratignure. C’est assez. Ta main commence à trembler.', 'Des dizaines de lames empoisonnées jaillissent de la marionnette ; une égratignure suffit.'),
  T('ak_sasori_aiguilles', 'Pluie d’aiguilles', 22, undefined, 'Les bras de la marionnette s’ouvrent en cent orifices, et cent aiguilles en sortent en même temps.', 'Une pluie d’aiguilles empoisonnées tombe sur votre groupe.'),
  // Deidara
  T('ak_deidara_c1', 'C1 : Araignées d’argile', 22, undefined, 'De petites araignées d’argile courent dans l’herbe vers tes pieds. Il fait un signe de la main : « Katsu ! »', 'Des centaines d’araignées d’argile courent entre vos jambes, et explosent toutes à la fois.'),
  T('ak_deidara_c2', 'C2 : Dragon d’argile', 30, undefined, 'Un dragon d’argile s’envole, ouvre la gueule, et crache des bombes qui pleuvent autour de toi.', 'Le dragon d’argile bombarde votre formation depuis le ciel.'),
  T('ak_deidara_hiboux', 'Hiboux explosifs', 24, undefined, 'Des oiseaux d’argile planent en silence au-dessus de toi, et piquent quand tu lèves les yeux.', 'Les oiseaux d’argile piquent sur vous un par un, en cascade d’explosions.'),
  // Hidan
  T('ak_hidan_faux', 'La faux à trois lames', 26, undefined, 'La faux siffle au bout de sa corde. {Il} ne cherche pas à tuer : {il} cherche à goûter ton sang.', 'La faux tourne au bout de sa corde et fauche tout ce qui est à portée.'),
  T('ak_hidan_lance', 'La lance de Jashin', 24, undefined, 'Une lance noire, rétractable, jaillit de sa manche vers ta gorge.', 'La lance noire passe d’un corps à l’autre.'),
  // Kakuzu
  T('ak_kakuzu_fils', 'Fils noirs', 24, undefined, 'Des fils noirs sortent de ses bras et s’enroulent autour de tes jambes. {Il} tire, comme on remonte un filet.', 'Les fils noirs ligotent ceux qui sont trop près.'),
  T('ak_kakuzu_feu', 'Masque du feu : Brûlure de l’enfer', 32, 'katon', 'Un masque se détache de son dos et crache un torrent de flammes.', 'Le masque du feu inonde le terrain de flammes.'),
  T('ak_kakuzu_vent', 'Masque du vent : Pression de l’ouragan', 32, 'fuuton', 'Le deuxième masque souffle : une lame de vent qui fend la terre jusqu’à toi.', 'Le masque du vent fend vos rangs en deux.'),
  T('ak_kakuzu_foudre', 'Masque de la foudre : Faux du tonnerre', 34, 'raiton', 'Le troisième masque crache la foudre en arcs, qui cherchent ton corps comme des mains.', 'La foudre du masque saute d’un corps à l’autre.'),
  T('ak_kakuzu_peau', 'Peau d’acier', 20, 'doton', 'Sa peau noircit et durcit comme du fer ; ton coup rebondit, et le sien arrive.', 'Sa peau d’acier encaisse vos coups, et il frappe le plus proche.'),
  // Konan
  T('ak_konan_lames', 'Lames de papier', 24, undefined, 'Les feuilles se détachent de son corps et se plient en shuriken tranchants comme des rasoirs.', 'Une nuée de shuriken de papier fond sur votre groupe.'),
  T('ak_konan_ailes', 'Ailes de papier', 22, undefined, 'Deux ailes de papier se déploient dans son dos. {Il} prend de la hauteur, et les plumes tombent sur toi comme des lames.', 'Ses plumes de papier tombent en pluie de lames sur vous.'),
  T('ak_konan_cercueil', 'Cercueil de papier', 28, undefined, 'Le papier se colle à ta peau, couche après couche, et commence à t’envelopper comme un cocon.', 'Le papier enveloppe le plus lent d’entre vous, et ne le relâche plus.'),
];

const R = (id: string, categorie: Replique['categorie'], texte: string, quand?: Replique['quand']): Replique => ({ id, categorie, texte, ...(quand ? { quand } : {}) });

export const ADVERSAIRES_AKATSUKI: AdversaireDef[] = [
  {
    id: 'ak_itachi',
    nom: 'Itachi Uchiha',
    genre: 'm',
    niveau: 'kage',
    temperament: 'froid',
    nature: 'katon',
    techniques: ['ak_itachi_corbeaux', 'ak_itachi_amaterasu', 'ak_itachi_katon'],
    majeure: { nom: 'Tsukuyomi', puissance: 38, annonce: 'Les tomoe de ses yeux se figent, puis se changent en kaléidoscope. Il ne bouge plus du tout. Il attend seulement que tu croises son regard.' },
    habitudes: [
      { id: 'it_clone', quand: { manche: 1 }, intention: 'observer', poids: 40, lisible: true, texte: 'Il commence toujours par te regarder, sans bouger. Ce n’est presque jamais lui : c’est un clone de corbeaux.' },
      { id: 'it_garde', quand: { joueurEnGarde: true }, intention: 'majeure', poids: 25, lisible: true, texte: 'Quand tu te protèges, il ne frappe pas : il prépare ses yeux.' },
    ],
    seuils: { fuite: 20, reddition: 0 },
    feinte: true,
    resistances: { decisif: 0.5 },
    motivation: 'Une raison qu’il ne dira à personne.',
    voix: { registre: 'soutenu', tics: ['ne hausse jamais la voix'] },
    recurrent: true,
    repliques: [
      R('it_entree_1', 'entree', 'Tu n’as pas encore assez de haine pour me tuer. Reviens quand tu en auras.'),
      R('it_entree_2', 'entree', 'Ne me regarde pas dans les yeux. C’est le seul conseil que je te donnerai.'),
      R('it_rev', 'revanche', 'Tu es revenu·e. Tu as donc trouvé une raison.', { rencontresMin: 1 }),
      R('it_reussite', 'reussite_joueur', 'Bien. Il y a quelque chose, en toi.'),
      R('it_rate', 'rate_joueur', 'Tu vises ce que tu vois. C’est ton erreur.'),
      R('it_repet', 'repetition', 'Tu te répètes. Mes yeux, eux, n’oublient rien.'),
      R('it_decouverte', 'decouverte', '… Intéressant.'),
      R('it_parade', 'parade', 'Ce n’était qu’un corbeau.'),
      R('it_blessure', 'blessure', 'Tu m’as touché. Peu de gens peuvent en dire autant.'),
      R('it_prepa', 'preparation', 'Regarde-moi.'),
      R('it_imminente', 'defaite_imminente', 'Pardonne-moi… ce sera pour une autre fois.'),
      R('it_victoire', 'victoire_adv', 'Vis. Et deviens assez fort·e pour comprendre.'),
      R('it_defaite', 'defaite_adv', 'C’est… ce que je voulais, peut-être.'),
      R('it_nego', 'negociation', 'Les mots ne changeront rien à ce qui doit arriver.'),
    ],
  },
  {
    id: 'ak_kisame',
    nom: 'Kisame Hoshigaki',
    genre: 'm',
    niveau: 'kage',
    temperament: 'joueur',
    nature: 'suiton',
    stats: { endurance: 240, chakra: 260 },
    techniques: ['ak_kisame_requins', 'ak_kisame_prison', 'ak_kisame_samehada'],
    majeure: { nom: 'Fusion avec Samehada', puissance: 36, annonce: 'Il plante son épée dans le sol et s’y fond. Quand il se relève, il a des branchies, des nageoires, et un sourire qui va d’une oreille à l’autre.' },
    habitudes: [
      { id: 'ki_epee', quand: { manche: 1 }, intention: 'attaque', poids: 45, lisible: true, texte: 'Il ouvre toujours à l’épée, de face, pour te goûter.' },
      { id: 'ki_eau', quand: { sousPct: 60 }, intention: 'technique', poids: 35, lisible: true, texte: 'Dès qu’il saigne, il noie le terrain : l’eau est son domaine.' },
    ],
    seuils: { fuite: 15, reddition: 0 },
    resistances: { katon: 0.4 },
    motivation: 'Trouver un adversaire qui le fasse enfin saigner.',
    voix: { registre: 'familier', tics: ['rit en montrant les dents'] },
    recurrent: true,
    repliques: [
      R('ki_entree_1', 'entree', 'Samehada a faim. Tu as l’air d’avoir beaucoup de chakra.'),
      R('ki_entree_2', 'entree', 'Un poisson qui nage seul vers le requin. J’adore ça.'),
      R('ki_rev', 'revanche', 'Toi ! Samehada se souvient de ton goût.', { rencontresMin: 1 }),
      R('ki_reussite', 'reussite_joueur', 'Ha ! Ça pique ! Continue !'),
      R('ki_rate', 'rate_joueur', 'C’est tout ? Samehada en veut encore.'),
      R('ki_repet', 'repetition', 'Le même coup ? Même un requin apprend plus vite que ça.'),
      R('ki_blessure', 'blessure', 'Du sang ! Enfin un combat !'),
      R('ki_prepa', 'preparation', 'Assez joué. On passe aux choses sérieuses.'),
      R('ki_imminente', 'defaite_imminente', 'Tu… ne nages pas si mal, finalement.'),
      R('ki_victoire', 'victoire_adv', 'Dommage. Je commençais à m’amuser.'),
      R('ki_defaite', 'defaite_adv', 'Ha… battu par un poisson. Quelle fin minable…'),
      R('ki_nego', 'negociation', 'Parler ? Je suis un requin, pas un diplomate.'),
    ],
  },
  {
    id: 'ak_sasori',
    nom: 'Sasori',
    genre: 'm',
    niveau: 'elite',
    temperament: 'froid',
    techniques: ['ak_sasori_kazekage', 'ak_sasori_poison', 'ak_sasori_aiguilles'],
    majeure: { nom: 'Le rideau des cent marionnettes', puissance: 36, annonce: 'Il ouvre un parchemin. Cent marionnettes en sortent, une par une, et se mettent en cercle autour de toi. Il n’a même pas l’air pressé.' },
    habitudes: [
      { id: 'sa_distance', quand: { manche: 1 }, intention: 'technique', poids: 40, lisible: true, texte: 'Il ne s’approche jamais : ce sont ses marionnettes qui se battent.' },
      { id: 'sa_poison', quand: { joueurEnGarde: true }, intention: 'technique', poids: 30, lisible: true, texte: 'Quand tu te protèges, il vise les endroits que ta garde ne couvre pas, avec ses lames empoisonnées.' },
    ],
    seuils: { fuite: 0, reddition: 0 },
    motivation: 'Faire de toi une œuvre éternelle.',
    voix: { registre: 'soutenu', tics: ['déteste attendre'] },
    recurrent: true,
    repliques: [
      R('sas_entree_1', 'entree', 'Je déteste attendre. Finissons-en vite.'),
      R('sas_entree_2', 'entree', 'Tu ferais une belle marionnette. L’art véritable, c’est ce qui dure.'),
      R('sas_rev', 'revanche', 'Ton corps a changé. Il en sera d’autant plus intéressant.', { rencontresMin: 1 }),
      R('sas_reussite', 'reussite_joueur', 'Tu as cassé un bras. J’en ai d’autres.'),
      R('sas_rate', 'rate_joueur', 'Lent. Le poison, lui, ne l’est pas.'),
      R('sas_repet', 'repetition', 'La répétition est l’art des médiocres.'),
      R('sas_blessure', 'blessure', 'Tu as abîmé mon travail. Impardonnable.'),
      R('sas_prepa', 'preparation', 'Regarde bien. Peu de gens voient ça deux fois.'),
      R('sas_imminente', 'defaite_imminente', 'Mon cœur… il me reste mon cœur.'),
      R('sas_victoire', 'victoire_adv', 'Le poison fera le reste. Je n’aime pas attendre, mais pour toi, je ferai une exception.'),
      R('sas_defaite', 'defaite_adv', 'Une œuvre… éternelle… quelle plaisanterie.'),
    ],
  },
  {
    id: 'ak_deidara',
    nom: 'Deidara',
    genre: 'm',
    niveau: 'elite',
    temperament: 'feroce',
    techniques: ['ak_deidara_c1', 'ak_deidara_c2', 'ak_deidara_hiboux'],
    majeure: { nom: 'C3', puissance: 40, annonce: 'Il mâche longtemps, très longtemps, et façonne une statue d’argile grande comme un homme. Il sourit : « L’art, c’est une explosion. » Il va lâcher ça au-dessus de toi.' },
    habitudes: [
      { id: 'de_ciel', quand: { manche: 1 }, intention: 'technique', poids: 45, lisible: true, texte: 'Il monte toujours dans le ciel sur un oiseau d’argile avant de frapper.' },
      { id: 'de_rage', quand: { sousPct: 40 }, intention: 'preparer', poids: 40, lisible: true, texte: 'Blessé, il ne recule pas : il prépare quelque chose d’énorme.' },
    ],
    seuils: { fuite: 25, reddition: 0 },
    motivation: 'Prouver que l’art est éphémère.',
    voix: { registre: 'familier', tics: ['« Hm ! »', '« Katsu ! »'] },
    recurrent: true,
    repliques: [
      R('de_entree_1', 'entree', 'Hm ! Tu vas avoir l’honneur de voir mon art. De très près.'),
      R('de_entree_2', 'entree', 'L’art, c’est une explosion ! Et tu vas en faire partie, hm.'),
      R('de_rev', 'revanche', 'Toi ! Cette fois, mon art ne te ratera pas, hm !', { rencontresMin: 1 }),
      R('de_reussite', 'reussite_joueur', 'Tu as osé abîmer mon art ?!'),
      R('de_rate', 'rate_joueur', 'Ha ! Trop lent pour une œuvre d’art !'),
      R('de_repet', 'repetition', 'Toujours le même truc. Aucune créativité, hm.'),
      R('de_decouverte', 'decouverte', 'Hm ? Ça, c’est pas mal du tout…'),
      R('de_blessure', 'blessure', 'Tu vas le regretter ! Tu vas exploser !'),
      R('de_prepa', 'preparation', 'Regarde bien. C’est mon chef-d’œuvre.'),
      R('de_imminente', 'defaite_imminente', 'Non… mon art… ne peut pas finir comme ça !'),
      R('de_victoire', 'victoire_adv', 'Tu vois ? L’art, c’est une explosion. Hm.'),
      R('de_defaite', 'defaite_adv', 'Ha… même ma défaite… sera… une explosion…'),
    ],
  },
  {
    id: 'ak_hidan',
    nom: 'Hidan',
    genre: 'm',
    niveau: 'elite',
    temperament: 'feroce',
    stats: { endurance: 220 },
    techniques: ['ak_hidan_faux', 'ak_hidan_lance'],
    majeure: { nom: 'Le rituel de Jashin', puissance: 42, annonce: 'Il lèche ton sang sur sa faux, et sa peau devient noire, striée d’os blancs. Il trace un cercle sur le sol avec son pied. Tout ce qu’il se fera, désormais, c’est toi qui le sentiras.' },
    habitudes: [
      { id: 'hi_sang', quand: { manche: 1 }, intention: 'attaque', poids: 50, lisible: true, texte: 'Il cherche d’abord à te faire saigner : une égratignure lui suffit.' },
      { id: 'hi_rituel', quand: { sousPct: 70 }, intention: 'preparer', poids: 35, lisible: true, texte: 'Dès qu’il a goûté ton sang, il prépare son rituel. Ne le laisse jamais finir son cercle.' },
    ],
    seuils: { fuite: 0, reddition: 0 },
    // Immortel : un coup décisif ne l'achève pas ; il faut l'user jusqu'au bout.
    resistances: { decisif: 0.9 },
    motivation: 'Offrir ta mort à Jashin.',
    voix: { registre: 'familier', tics: ['jure à chaque phrase'] },
    recurrent: true,
    repliques: [
      R('hi_entree_1', 'entree', 'Jashin-sama veut ton sang. Et moi, je veux te l’entendre crier.'),
      R('hi_entree_2', 'entree', 'Tu vas mourir, et c’est la plus belle chose qui pouvait t’arriver aujourd’hui.'),
      R('hi_rev', 'revanche', 'T’es encore en vie, toi ? Jashin-sama n’aime pas qu’on le fasse attendre.', { rencontresMin: 1 }),
      R('hi_reussite', 'reussite_joueur', 'Ha ! Ça fait mal ! Encore ! ENCORE !'),
      R('hi_rate', 'rate_joueur', 'T’as même pas réussi à me faire saigner. Pathétique.'),
      R('hi_blessure', 'blessure', 'Tu m’as transpercé le cœur ? Et alors ? Je suis toujours là, abruti·e.'),
      R('hi_prepa', 'preparation', 'Prie, si tu sais comment on fait.'),
      R('hi_imminente', 'defaite_imminente', 'Ça ne me tuera pas ! Rien ne me tue !'),
      R('hi_victoire', 'victoire_adv', 'Jashin-sama sera content. Moi aussi.'),
      R('hi_defaite', 'defaite_adv', 'Tu peux me découper en morceaux… je vivrai… je vivrai quand même…'),
      R('hi_nego', 'negociation', 'Parler ? Prie plutôt.'),
    ],
  },
  {
    id: 'ak_kakuzu',
    nom: 'Kakuzu',
    genre: 'm',
    niveau: 'kage',
    temperament: 'froid',
    stats: { endurance: 260 },
    techniques: ['ak_kakuzu_fils', 'ak_kakuzu_feu', 'ak_kakuzu_vent', 'ak_kakuzu_foudre', 'ak_kakuzu_peau'],
    majeure: { nom: 'Les cinq masques', puissance: 40, annonce: 'Ses coutures se défont. Cinq masques sortent de son dos, chacun sur un corps de fils noirs : feu, vent, foudre, eau, terre. Ils te regardent tous en même temps.' },
    habitudes: [
      { id: 'ka_calcul', quand: { manche: 1 }, intention: 'observer', poids: 40, lisible: true, texte: 'Il t’évalue d’abord, comme on évalue une marchandise.' },
      { id: 'ka_coeur', quand: { sousPct: 50 }, intention: 'defense', poids: 35, lisible: true, texte: 'Quand un cœur lâche, il se durcit et attend que le suivant prenne le relais.' },
    ],
    seuils: { fuite: 18, reddition: 0 },
    resistances: { decisif: 0.6 },
    motivation: 'Ta tête vaut de l’argent. C’est tout.',
    voix: { registre: 'soutenu', tics: ['compte à voix basse'] },
    recurrent: true,
    repliques: [
      R('ka_entree_1', 'entree', 'Ta tête vaut quelque chose, maintenant. Ne m’oblige pas à abîmer la marchandise.'),
      R('ka_entree_2', 'entree', 'Le temps, c’est de l’argent. Tu m’en fais perdre.'),
      R('ka_rev', 'revanche', 'Ta prime a augmenté depuis la dernière fois. Merci.', { rencontresMin: 1 }),
      R('ka_reussite', 'reussite_joueur', 'Un cœur de moins. Il m’en reste.'),
      R('ka_rate', 'rate_joueur', 'Gaspillage de chakra. Gaspillage de temps.'),
      R('ka_repet', 'repetition', 'Je ne paie jamais deux fois pour la même chose.'),
      R('ka_blessure', 'blessure', 'Tu m’as coûté un cœur. Je te le ferai payer au prix fort.'),
      R('ka_prepa', 'preparation', 'Assez. Je vais te prendre le tien.'),
      R('ka_imminente', 'defaite_imminente', 'Mon dernier cœur… ce n’est pas rentable…'),
      R('ka_victoire', 'victoire_adv', 'Pas de prime sur toi. Je ne te tue pas : ce serait du travail gratuit.'),
      R('ka_defaite', 'defaite_adv', 'Cent ans… et je meurs pour rien… quel mauvais investissement.'),
      R('ka_nego', 'negociation', 'Combien ? Non. Pas assez.'),
    ],
  },
  {
    id: 'ak_konan',
    nom: 'Konan',
    genre: 'f',
    niveau: 'elite',
    temperament: 'prudent',
    techniques: ['ak_konan_lames', 'ak_konan_ailes', 'ak_konan_cercueil'],
    majeure: { nom: 'La mer de papier explosif', puissance: 40, annonce: 'Elle ouvre les bras. Autour de vous, à perte de vue, des milliers de feuilles explosives se détachent et flottent dans l’air, immobiles, comme une neige qui attend.' },
    habitudes: [
      { id: 'ko_ciel', quand: { manche: 1 }, intention: 'technique', poids: 45, lisible: true, texte: 'Elle prend de la hauteur dès le début, sur ses ailes de papier.' },
      { id: 'ko_patience', quand: { joueurEnGarde: true }, intention: 'preparer', poids: 30, lisible: true, texte: 'Quand tu restes en garde, elle sème ses feuilles autour de toi, sans hâte.' },
    ],
    seuils: { fuite: 25, reddition: 0 },
    motivation: 'Protéger ce qu’il reste du rêve de Yahiko.',
    voix: { registre: 'soutenu', tics: ['ne sourit jamais'] },
    recurrent: true,
    repliques: [
      R('ko_entree_1', 'entree', 'Tu n’as rien à faire à Amegakure. Repars, et je l’oublierai.'),
      R('ko_entree_2', 'entree', 'La pluie a vu mourir beaucoup de gens plus forts que toi.'),
      R('ko_rev', 'revanche', 'Tu es revenu·e. Je t’avais pourtant laissé partir.', { rencontresMin: 1 }),
      R('ko_reussite', 'reussite_joueur', 'Le papier se déchire. Il se replie aussi.'),
      R('ko_rate', 'rate_joueur', 'Tu frappes une feuille. J’en ai des milliers.'),
      R('ko_blessure', 'blessure', 'Tu es plus dangereux·se que je ne le pensais.'),
      R('ko_prepa', 'preparation', 'Pardonne-moi. Je ne te laisserai pas atteindre Pain.'),
      R('ko_imminente', 'defaite_imminente', 'Nagato… Yahiko… je vous ai…'),
      R('ko_victoire', 'victoire_adv', 'Repars. La pluie lavera le reste.'),
      R('ko_defaite', 'defaite_adv', 'Le papier… finit toujours par… se mouiller…'),
    ],
  },
];

/** Les primes que verse le bureau. Un prisonnier vaut une fois et demie un corps : ce qu'il sait n'a pas de prix. */
export const PRIMES_AKATSUKI: Record<string, number> = { itachi: 45000, kisame: 32000, sasori: 28000, deidara: 22000, hidan: 30000, kakuzu: 35000, konan: 30000 };
export const NOMS_AKATSUKI: Record<string, string> = { itachi: 'Itachi Uchiha', kisame: 'Kisame Hoshigaki', sasori: 'Sasori', deidara: 'Deidara', hidan: 'Hidan', kakuzu: 'Kakuzu', konan: 'Konan' };

/** Vaincu, pas encore mort : le combat s'arrête là, et la scène akc_verdict décide de son sort. */
function aTerre(id: string, texte: string): ConclusionDef {
  return { texte, effets: [{ drapeau: 'akatsuki_a_terre', valeur: id }, { drapeau: 'akatsuki_ennemie' }], suite: 'akc_verdict' };
}

const FUITE_AKATSUKI: ConclusionDef = { texte: 'Tu cours sans te retourner jusqu’à ce que tes poumons brûlent. Personne ne te suit. Tu n’étais pas une proie assez intéressante. Pas encore.', effets: [{ stat: 'jauges.fatigue', delta: 35 }] };
const DEPARTAGE_AKATSUKI: ConclusionDef = {
  texte: 'Vous vous arrêtez tous les deux, à bout de souffle. Il te regarde longtemps, puis tourne les talons. Ce n’était pas une défaite. Ce n’était pas une victoire. C’était un avertissement.',
  effets: [{ stat: 'social.reputation', delta: 6 }],
};

export const AFFRONTEMENTS_AKATSUKI: ContenuRacine['affrontements'] = {
  'akc_paille/itachi': {
    adversaire: 'ak_itachi',
    contexte: 'combat_a_mort',
    raison: 'Itachi Uchiha, sur ta route.',
    conclusions: {
      victoire: aTerre('itachi', 'Il tombe à genoux, sans un cri. Le sang coule de ses yeux, pas de ses blessures. Il lève vers toi un regard fatigué, presque doux, et ne fait plus un geste pour se défendre.'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
      departage_nul: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_paille/kisame': {
    adversaire: 'ak_kisame',
    contexte: 'combat_a_mort',
    raison: 'Kisame Hoshigaki et sa faim.',
    conclusions: {
      victoire: aTerre('kisame', 'Samehada glisse de ses mains et rampe vers toi, comme un chien qui change de maître. Kisame est à genoux dans l’eau, la bouche pleine de sang, et il rit. « Pas mal… pour un poisson. Alors ? Qu’est-ce que tu attends ? »'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_desert/sasori': {
    adversaire: 'ak_sasori',
    contexte: 'combat_a_mort',
    raison: 'Sasori de la Sable rouge.',
    conclusions: {
      victoire: aTerre('sasori', 'Tu trouves enfin son cœur, la seule chose vivante dans ce corps de bois, et ta lame s’arrête contre. Les marionnettes s’effondrent toutes à la fois, comme des fils qu’on coupe. Celle qui ressemble à une mère et celle qui ressemble à un père tombent l’une contre l’autre. Le cœur bat encore, lentement, dans sa cage.'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_desert/deidara': {
    adversaire: 'ak_deidara',
    contexte: 'combat_a_mort',
    raison: 'Deidara et son art.',
    conclusions: {
      victoire: aTerre('deidara', 'Il tombe de son oiseau d’argile et s’écrase dans le sable. Ses bras ne lui obéissent plus. Il rit quand même, couvert de poussière. « Hm… même ça… c’était beau… »'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_bureau/hidan': {
    adversaire: 'ak_hidan',
    contexte: 'combat_a_mort',
    raison: 'Hidan et son dieu.',
    conclusions: {
      victoire: aTerre('hidan', 'Il est en morceaux, et il jure toujours. Il ne peut pas mourir : sa tête te fixe depuis le sol de la carrière et te promet tout ce que Jashin réserve aux incroyants.'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_bureau/kakuzu': {
    adversaire: 'ak_kakuzu',
    contexte: 'combat_a_mort',
    raison: 'Kakuzu et ses cinq cœurs.',
    conclusions: {
      victoire: aTerre('kakuzu', 'Quatre cœurs ont lâché. Les fils noirs pendent de ses plaies, mous, comme des racines arrachées. Le dernier bat encore, quelque part dans sa poitrine, et il te regarde en calculant ce que tu vaux.'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
  'akc_pluie/konan': {
    adversaire: 'ak_konan',
    contexte: 'combat_a_mort',
    raison: 'Konan, l’ange de papier.',
    conclusions: {
      victoire: aTerre('konan', 'Le papier tombe autour d’elle comme une neige mouillée : la pluie l’a alourdi, il ne vole plus. Elle est à genoux, trempée, et elle te regarde sans haine.'),
      fuite: FUITE_AKATSUKI,
      departage_gagne: DEPARTAGE_AKATSUKI,
    },
  },
};
