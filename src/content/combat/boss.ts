// Les phases des boss (§8) : l'Akatsuki, le Héron, la bête à queues, le binôme miroir. Chaque phase s'ouvre une
// fois, quand sa condition tient ; elle dit ce qui change, et sa grande technique s'annonce une manche avant, avec
// les gestes qui la déjouent (les parades). Un boss abattu vite ne montre pas tout ce qu'il cache.

import type { PhaseBoss } from '../../engine/combat/types';

export const PHASES_BOSS: Record<string, PhaseBoss[]> = {
  ak_itachi: [
    {
      id: 'corbeaux',
      quand: { mancheMin: 2 },
      texte: '{Il} se défait en une nuée de corbeaux qui se reforme derrière toi. {Il} ne combat plus : {il} t’évalue.',
      replique: 'Tu as les yeux de quelqu’un qui croit encore que la force suffit.',
      temperament: 'prudent',
    },
    {
      id: 'amaterasu',
      quand: { sousPct: 60 },
      texte: 'Du sang coule de son œil droit. Le Mangekyō s’ouvre, et l’air devant {lui} se met à brûler d’un feu noir.',
      replique: 'Tu m’as obligé à ouvrir ces yeux. C’est rare.',
      temperament: 'froid',
      bonus: { attaque: 6 },
      majeure: { nom: 'Amaterasu', puissance: 42, annonce: 'Son œil droit saigne. Il te fixe, et tu sens la chaleur avant de voir le feu : une flamme noire va naître là où il regarde.', parades: ['permutation', 'doton_rempart', 'doton_forteresse'] },
    },
    {
      id: 'susanoo',
      quand: { sousPct: 30 },
      texte: 'Un squelette de chakra rouge se dresse autour de {lui}, puis se couvre de chair et d’armure. Le Susanoo. Tes coups ne l’atteignent plus qu’à moitié.',
      replique: 'C’est la dernière chose que je te montrerai.',
      bonus: { defense: 18 },
      soin: 0.05,
      majeure: { nom: 'Tsukuyomi', puissance: 44, annonce: 'Ses tomoe se figent en kaléidoscope. Ne croise pas son regard : ferme les yeux, ou ne sois plus là.', parades: ['garde', 'permutation'] },
    },
  ],
  ak_kisame: [
    {
      id: 'faim',
      quand: { sousPct: 70 },
      texte: 'Samehada frémit sous ses bandages. Elle a goûté ton chakra, et elle en veut encore : chaque coup d’épée t’en arrache un peu plus.',
      replique: 'Ton chakra a bon goût. Encore.',
      temperament: 'sadique',
      bonus: { attaque: 6 },
      terrain: 'humide',
      majeure: { nom: 'Vague tranchante', puissance: 36, annonce: 'Il pose sa lame à plat sur l’eau. La surface se soulève en une lame liquide, large comme un mur : elle va balayer tout le terrain à hauteur de genoux.', parades: ['esquive', 'permutation', 'doton_rempart', 'doton_forteresse'] },
    },
    {
      id: 'fusion',
      quand: { sousPct: 40 },
      texte: 'Il plante Samehada dans son propre flanc. L’épée et l’homme se fondent : des branchies, des nageoires, et des blessures qui se referment à vue d’œil.',
      replique: 'Tu veux voir ma vraie forme ?',
      soin: 0.1,
      bonus: { attaque: 10, defense: 8 },
    },
  ],
  ak_sasori: [
    {
      id: 'kazekage',
      quand: { sousPct: 60 },
      texte: 'Il déroule un parchemin d’où sort une marionnette au regard vide : le Troisième Kazekage. Le sable de fer se lève autour d’elle.',
      replique: 'Tu as l’honneur de voir ma plus belle œuvre.',
      bonus: { attaque: 6 },
      majeure: { nom: 'La tempête de sable de fer', puissance: 38, annonce: 'Le sable de fer s’agglomère en mille pointes au-dessus de toi. Il va tomber partout, sauf derrière un mur.', parades: ['fuuton_mur_vents', 'doton_forteresse', 'doton_rempart', 'permutation'] },
    },
    {
      id: 'corps',
      quand: { sousPct: 30 },
      texte: 'Le Kazekage brisé, il ouvre son propre manteau : son corps est une marionnette, et son cœur est dans une boîte, sur sa poitrine.',
      replique: 'Le corps humain est si fragile. Le mien ne l’est plus.',
      temperament: 'froid',
      bonus: { defense: 15 },
      soin: 0.05,
    },
  ],
  ak_deidara: [
    {
      id: 'ciel',
      quand: { mancheMin: 2 },
      texte: 'Il saute sur un oiseau d’argile et monte dans le ciel. De là-haut, tes coups au corps ne l’atteignent plus.',
      replique: 'Regarde bien, c’est de l’art, hm !',
      bonus: { defense: 10 },
    },
    {
      id: 'c2',
      quand: { sousPct: 55 },
      texte: 'Il façonne un dragon d’argile qui plane au-dessus du terrain et crache des bombes comme un oiseau pond.',
      replique: 'Tu m’énerves. Le C2, alors !',
      majeure: { nom: 'Le dragon C2', puissance: 38, annonce: 'Le dragon d’argile ouvre la gueule au-dessus de toi. Une pluie de bombes va tomber sur tout le terrain.', parades: ['esquive', 'doton_forteresse', 'permutation'] },
    },
    {
      id: 'c0',
      quand: { sousPct: 25 },
      texte: 'Il arrache les coutures de sa poitrine : une bouche s’y ouvre et avale l’argile qui lui reste. Son corps enfle. Il rit.',
      replique: 'Mon dernier chef-d’œuvre, c’est moi !',
      temperament: 'desespere',
      majeure: { nom: 'C0', puissance: 50, annonce: 'Son corps se fissure de lumière. Il va exploser, et le cratère fera un kilomètre. Fuis, ou ne sois plus là.', parades: ['fuir', 'permutation'] },
    },
  ],
  ak_hidan: [
    {
      id: 'cercle',
      quand: { sousPct: 70 },
      texte: 'Il trace dans la poussière un cercle et un triangle, avec son propre sang, et se met au milieu. Il n’attend plus qu’une goutte du tien.',
      replique: 'Jashin-sama exige un sacrifice. Ce sera toi.',
      majeure: { nom: 'Le rituel de Jashin', puissance: 44, annonce: 'Sa faux cherche ta peau, rien que ta peau : une égratignure lui suffira. Ne le laisse pas te toucher.', parades: ['permutation', 'esquive'] },
    },
    {
      id: 'immortel',
      quand: { sousPct: 35 },
      texte: 'Ses blessures se referment en grésillant. Il rit, à genoux, tout en se relevant. Il ne peut pas mourir.',
      replique: 'Ça fait mal ! Encore !',
      temperament: 'fanatique',
      soin: 0.12,
      bonus: { attaque: 8 },
    },
  ],
  ak_kakuzu: [
    {
      id: 'coeurs',
      quand: { sousPct: 70 },
      texte: 'Le cœur que tu croyais avoir touché était l’un de cinq. Les fils noirs ressoudent sa chair.',
      replique: 'Il en faudra plus. Beaucoup plus.',
      soin: 0.1,
    },
    {
      id: 'masques',
      quand: { sousPct: 45 },
      texte: 'Ses coutures se défont. Cinq masques sortent de son dos, chacun sur un corps de fils noirs, chacun d’une nature.',
      bonus: { attaque: 8 },
      majeure: { nom: 'L’union des masques', puissance: 44, annonce: 'Le masque du feu et le masque du vent se tournent vers toi ensemble : une tempête de feu va balayer le terrain.', parades: ['doton_forteresse', 'fuuton_mur_vents', 'permutation'] },
    },
    {
      id: 'dernier_coeur',
      quand: { sousPct: 20 },
      texte: 'Il ne lui reste qu’un cœur. Pour la première fois, il recule.',
      replique: 'Ce cœur-là, tu ne l’auras pas.',
      temperament: 'prudent',
      soin: 0.05,
    },
  ],
  ak_konan: [
    {
      id: 'ailes',
      quand: { sousPct: 60 },
      texte: 'Des ailes de papier se déploient dans son dos. Elle s’élève, et des milliers de feuilles tourbillonnent autour d’elle.',
      replique: 'Le papier ne connaît pas la peur.',
      bonus: { defense: 10 },
      majeure: { nom: 'Les lances de papier', puissance: 36, annonce: 'Les feuilles se roulent en lances, des centaines, toutes pointées sur toi.', parades: ['esquive', 'permutation', 'fuuton_mur_vents'] },
    },
    {
      id: 'mer',
      quand: { sousPct: 30 },
      texte: 'Elle ferme les yeux. Autour de vous, à perte de vue, des milliers de feuilles explosives se détachent du ciel.',
      replique: 'Je l’ai préparé pour un dieu. Tu n’en es pas un.',
      majeure: { nom: 'La mer de papier explosif', puissance: 46, annonce: 'Six cents milliards de feuilles explosives vont s’enflammer en même temps. Il n’y a qu’une issue : ne plus être là.', parades: ['permutation', 'fuir'] },
    },
  ],
  mc_heron: [
    {
      id: 'heron_leve',
      quand: { sousPct: 60 },
      texte: 'Le Héron pose enfin son deuxième pied à terre. Pour la première fois, il se bat vraiment.',
      replique: 'Alors c’est vrai. Vous avez grandi.',
      temperament: 'fier',
      bonus: { attaque: 6 },
      majeure: { nom: 'La plume du héron', puissance: 38, annonce: 'Il replie un bras comme une aile, la lame en avant : un seul trait, droit sur le cœur. Il ne frappera qu’une fois.', parades: ['esquive', 'permutation'] },
    },
    {
      id: 'derniere_plume',
      quand: { sousPct: 25 },
      texte: 'Son masque se fend. Dessous, un visage ordinaire, fatigué, et des yeux qui sourient.',
      replique: 'Le héron attend toujours… que le poisson se trompe.',
      temperament: 'desespere',
    },
  ],
  mc_biju: [
    {
      id: 'dechainee',
      quand: { mancheMin: 3 },
      texte: 'La bête rugit. Ses queues fouettent le sol, et chaque coup creuse une tranchée.',
      bonus: { attaque: 8 },
      majeure: { nom: 'La sphère de la bête', puissance: 48, annonce: 'La gueule s’ouvre. Une sphère de chakra noir grossit entre ses dents : quand elle partira, elle rasera tout devant elle.', parades: ['permutation', 'doton_forteresse', 'fuir'] },
    },
    {
      id: 'sceau_faiblit',
      quand: { sousPct: 35 },
      texte: 'La bête chancelle. Le sceau, quelque part, la rappelle : elle hurle, et ses coups deviennent désordonnés.',
      temperament: 'desespere',
      bonus: { defense: -8 },
    },
  ],
  mc_ak_binome: [
    {
      id: 'separation',
      quand: { sousPct: 55 },
      texte: 'Les deux manteaux se séparent d’un bond, chacun d’un côté : ils vous prennent en tenaille, comme vous l’auriez fait.',
      replique: 'Vous voyez ? Vous êtes exactement nous.',
      bonus: { attaque: 6 },
      majeure: { nom: 'La technique du binôme', puissance: 42, annonce: 'Ils composent les mêmes signes au même instant, sans un regard. Leurs deux chakras vont se mêler en un seul coup.', parades: ['permutation', 'doton_forteresse', 'esquive'] },
    },
  ],
};
