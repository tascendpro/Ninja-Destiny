import type { ElementId } from '../../engine/types';

/**
 * L'Akatsuki des campagnes à deux : des membres propres à chaque chronologie, tirés parmi ces profils, qui travaillent
 * par binômes. Ce ne sont pas les membres du jeu solo : chaque campagne a son Akatsuki.
 */
export interface ProfilAkatsuki {
  id: string;
  nom: string;
  village: string;
  style: string;
  nature: ElementId;
  signature: string;
  motivation: string;
}

export const PROFILS_AKATSUKI: ProfilAkatsuki[] = [
  { id: 'kurogane', nom: 'Kurogane', village: 'Iwa', style: 'un colosse qui se bat à mains nues', nature: 'doton', signature: 'il fait du sol une gueule de pierre', motivation: 'Il veut voir s’effondrer le village qui l’a exilé pour une faute qu’il n’a pas commise.' },
  { id: 'shizuku', nom: 'Shizuku', village: 'Kiri', style: 'une épéiste silencieuse', nature: 'suiton', signature: 'sa lame laisse une traînée de brume qui ne se dissipe pas', motivation: 'Elle cherche l’homme qui a noyé sa sœur. Elle a promis de le tuer de la même façon.' },
  { id: 'raijin_no_ko', nom: 'Hayate le Fils du tonnerre', village: 'Kumo', style: 'un jeune prodige trop rapide pour son propre corps', nature: 'raiton', signature: 'il frappe trois fois avant que le premier éclair ne retombe', motivation: 'Il veut prouver qu’il est plus fort que le Raikage qui l’a écarté.' },
  { id: 'enma', nom: 'Enma aux mains brûlées', village: 'Konoha', style: 'un vieil homme qui sourit en brûlant', nature: 'katon', signature: 'ses paumes laissent des empreintes de braise sur tout ce qu’il touche', motivation: 'Il croit qu’il faut brûler le monde pour qu’il repousse droit.' },
  { id: 'sunao', nom: 'Sunao', village: 'Suna', style: 'une marionnettiste qui ne parle qu’à ses marionnettes', nature: 'fuuton', signature: 'ses marionnettes respirent', motivation: 'Elle veut un corps qui ne vieillit pas, pour elle et pour sa fille morte.' },
  { id: 'ginji', nom: 'Ginji le Collectionneur', village: 'Taki', style: 'un chasseur de primes méthodique', nature: 'doton', signature: 'il a toujours sur lui le prix de ta tête, plié dans sa manche', motivation: 'L’argent. Seulement l’argent. C’est ce qu’il dit.' },
  { id: 'tsukiko', nom: 'Tsukiko', village: 'Konoha', style: 'une illusionniste au regard doux', nature: 'katon', signature: 'ses illusions ont l’odeur de ton enfance', motivation: 'Elle a vu ce que le village fait de ses enfants. Elle veut que ça cesse.' },
  { id: 'arashi', nom: 'Arashi', village: 'Ame', style: 'un orphelin de guerre qui ne se repose jamais', nature: 'fuuton', signature: 'il fait tomber la pluie à l’horizontale', motivation: 'La paix par la peur : qu’aucun village n’ose plus jamais en attaquer un autre.' },
  { id: 'hagane', nom: 'Hagane l’Inoxydable', village: 'Kumo', style: 'un homme dont la moitié du corps est de métal', nature: 'raiton', signature: 'la foudre court dans son bras de fer', motivation: 'Il a été une arme. Il veut savoir s’il peut être autre chose.' },
  { id: 'mizore', nom: 'Mizore', village: 'Kiri', style: 'une gamine qui gèle ce qu’elle touche', nature: 'suiton', signature: 'le givre monte le long de tes jambes quand elle te regarde', motivation: 'Elle suit Shizuku partout. Elle ne sait pas ce qu’elle veut d’autre.' },
  { id: 'jiro', nom: 'Jirō le Moine', village: 'Iwa', style: 'un moine qui prie entre chaque coup', nature: 'doton', signature: 'chaque prière fait trembler la terre un peu plus', motivation: 'Il expie quelque chose. Il ne dit pas quoi.' },
  { id: 'kaen', nom: 'Kaen', village: 'Suna', style: 'une danseuse au sourire figé', nature: 'katon', signature: 'elle danse dans ses propres flammes sans brûler', motivation: 'Elle a vendu tout ce qu’elle était à l’Akatsuki, et elle ne regrette rien.' },
  { id: 'oboro', nom: 'Oboro', village: 'Inconnu', style: 'un visage que personne ne voit deux fois pareil', nature: 'fuuton', signature: 'il prend le visage de quelqu’un que tu aimes', motivation: 'Personne ne sait. Peut-être même pas lui.' },
  { id: 'tetsuya', nom: 'Tetsuya', village: 'Konoha', style: 'un ancien ANBU aux deux sabres', nature: 'raiton', signature: 'ses deux lames ne font qu’un seul bruit', motivation: 'Il a exécuté des ordres qu’il ne pardonne pas à ceux qui les ont donnés.' },
];

export const PROFIL = Object.fromEntries(PROFILS_AKATSUKI.map((p) => [p.id, p]));
