import type { Campagne, SceneCommuneDef } from '../../engine/campagne/types';

/**
 * Les scènes communes de la campagne à deux : chacun choisit en secret, puis la matrice de la scène combine les deux choix.
 * {j1}, {j2} : les prénoms ; {un}, {deux} : celui dont le choix est cité en premier dans la clé, et l'autre.
 * Clés : « a+b » (choix exacts, dans un sens ou dans l'autre), « famille:x+y », puis « accord », « complement », « conflit », « defaut ».
 */

/** Ce que J1 ressent pour J2, et l'inverse, est-il plutôt chaleureux ? */
const lienChaud = (c: Campagne) => {
  const v = (i: 0 | 1) => c.lien.axes[i].confiance + c.lien.axes[i].loyaute + c.lien.axes[i].respect - c.lien.axes[i].ressentiment - c.lien.axes[i].mefiance;
  return v(0) + v(1) > 60;
};
const memeVillage = (c: Campagne) => c.creations[0].village === c.creations[1].village;

export const SCENES_COMMUNES: SceneCommuneDef[] = [
  // ── Les introductions : une par lien ──
  {
    id: 'mc_intro_freres',
    titre: 'La nuit où personne n’est rentré',
    introduction: true,
    types: ['freres'],
    texte: 'Il est tard. La soupe a refroidi sur le feu. {parent} avait dit « avant la nuit », et la nuit est tombée depuis longtemps. {j1} et {j2} sont assis devant la porte, côte à côte, à regarder la rue vide. Un chien aboie au loin, puis plus rien.',
    choix: [
      { id: 'chercher', texte: 'Aller le chercher, maintenant', famille: 'agir' },
      { id: 'rester', texte: 'Rester : on a promis de garder la maison', famille: 'proteger' },
      { id: 'voisin', texte: 'Frapper chez la voisine', famille: 'parler' },
      { id: 'guetter', texte: 'Monter sur le toit pour guetter', famille: 'observer' },
    ],
    issues: [
      { cle: 'chercher+chercher', texte: '{j1} et {j2} partent ensemble dans la nuit, main dans la main, sans un mot. Ils {le:parent} trouvent au poste de garde, une jambe bandée, furieux{e:parent} de les voir dehors. {Il:parent} les gronde tout le chemin du retour. Puis, devant la porte, {il:parent} les serre contre {lui:parent} si fort qu’ils ne peuvent plus respirer.', lien: { les2: { loyaute: 10, confiance: 6 } }, accord: 6, souvenir: { id: 'nuit_porte', texte: 'La nuit où vous êtes partis le chercher ensemble.', poids: 4, tonalite: 'chaud' } },
      { cle: 'chercher+rester', texte: '{un} enfile ses sandales. {deux} l’attrape par la manche : « On a promis. » « Et s’il est blessé ? » Ils se disputent à voix basse, puis {un} part seul{e:un} dans la nuit. {deux} reste devant la porte jusqu’à l’aube, à compter les pas dans la rue. Quand ils rentrent tous les deux au matin, {deux} ne dit rien. {Il:deux} n’a pas dormi.', lien: { un: { respect: 3 }, deux: { peur_de_perdre: 12, ressentiment: 4 } }, souvenir: { id: 'nuit_porte', texte: 'La nuit où l’un est parti, et où l’autre a attendu.', poids: 4, tonalite: 'amer' } },
      { cle: 'chercher+voisin', texte: '{un} part en courant pendant que {deux} tambourine chez la voisine. C’est elle qui retrouve {parent}, au poste de garde, une jambe bandée ; c’est {un} qui arrive en premier, essoufflé{e:un}. Ce soir-là, vous dormez tous les trois dans la même pièce.', lien: { les2: { confiance: 5 } }, accord: 3, souvenir: { id: 'nuit_porte', texte: 'La nuit du poste de garde.', poids: 3, tonalite: 'chaud' } },
      { cle: 'guetter+guetter', texte: 'Sur le toit, serrés l’un contre l’autre sous la même couverture, vous voyez une lanterne remonter la rue, bien après minuit. Elle boite. C’est {parent}. Vous descendez si vite que {j2} se tord la cheville, et c’est finalement vous deux qu’{il:parent} doit soigner.', lien: { les2: { confiance: 6, loyaute: 4 } }, accord: 4, souvenir: { id: 'nuit_porte', texte: 'La lanterne qui boitait, vue du toit.', poids: 3, tonalite: 'chaud' } },
      { cle: 'accord', texte: '{j1} et {j2} font la même chose, au même moment, sans s’être consultés. {parent} rentre à l’aube, blessé{e:parent} mais vivant{e:parent}. {Il:parent} dit que vous êtes les mêmes. Vous protestez en même temps.', lien: { les2: { loyaute: 6, confiance: 4 } }, accord: 5, souvenir: { id: 'nuit_porte', texte: 'La nuit où vous avez fait la même chose sans vous parler.', poids: 3, tonalite: 'chaud' } },
      { cle: 'defaut', texte: '{un} et {deux} ne sont pas d’accord sur ce qu’il faut faire, et chacun le fait quand même. {parent} rentre à l’aube, blessé{e:parent}, et trouve ses deux enfants épuisés, chacun à un bout de la maison.', lien: { les2: { rivalite: 5, peur_de_perdre: 6 } }, souvenir: { id: 'nuit_porte', texte: 'La nuit de l’attente, chacun de son côté.', poids: 3, tonalite: 'amer' } },
    ],
  },
  {
    id: 'mc_intro_clan',
    titre: 'Un seul nom',
    introduction: true,
    types: ['clan'],
    texte: 'Le temple du clan sent l’encens et le bois ciré. Toute la génération est là, à genoux, en rang. L’ancien passe devant chaque enfant sans s’arrêter, puis revient au centre. « Cette année, je ne nommerai qu’un seul d’entre vous. » {j1} et {j2} sont côte à côte. Ils le savent tous les deux : ce sera l’un d’eux, ou aucun.',
    choix: [
      { id: 'avant', texte: 'Lever la tête et soutenir son regard', famille: 'agir' },
      { id: 'pousser', texte: 'Pousser discrètement l’autre en avant', famille: 'proteger' },
      { id: 'observer', texte: 'Garder les yeux baissés et écouter', famille: 'observer' },
      { id: 'retrait', texte: 'Se faire tout petit : tu n’en veux pas', famille: 'partir' },
    ],
    issues: [
      { cle: 'avant+avant', texte: 'Deux têtes se lèvent en même temps. L’ancien les regarde longtemps, l’un puis l’autre. « Deux qui veulent la même place. » Il se détourne sans nommer personne. « Revenez l’an prochain. Nous verrons lequel de vous deux l’aura gagnée. »', lien: { les2: { rivalite: 15, respect: 6 } }, souvenir: { id: 'un_seul_nom', texte: 'Le jour où l’ancien n’a nommé aucun de vous deux.', poids: 4, tonalite: 'amer' } },
      { cle: 'avant+pousser', texte: '{un} lève la tête, et sent une main dans son dos qui le pousse : celle de {deux}. L’ancien sourit. « {un}. » En sortant du temple, {un} cherche {deux} des yeux. {deux} est déjà parti{e:deux}. {Il:deux} ne dira jamais pourquoi.', lien: { un: { dette: 15, admiration: 8 }, deux: { loyaute: 8, jalousie: 4 } }, souvenir: { id: 'un_seul_nom', texte: 'La main dans le dos, au temple.', poids: 5, tonalite: 'fier' } },
      { cle: 'avant+observer', texte: '{un} soutient le regard de l’ancien. {deux} écoute, et entend ce que personne d’autre n’entend : la respiration de l’ancien s’arrête une seconde quand il passe devant {deux}. L’ancien nomme {un}. Mais {deux} sait désormais quelque chose que {un} ignore.', lien: { un: { respect: 4 }, deux: { jalousie: 8, rivalite: 6 } }, souvenir: { id: 'un_seul_nom', texte: 'Le jour où {un} a été nommé.', poids: 4, tonalite: 'fier' } },
      { cle: 'pousser+pousser', texte: 'Chacun pousse l’autre en avant, et ils trébuchent ensemble devant l’ancien, dans un éclat de rire étouffé. Le vieil homme les regarde, très sérieux. « Deux idiots qui pensent l’un à l’autre avant de penser à eux. » Il les nomme tous les deux. Ça ne s’était jamais vu.', lien: { les2: { loyaute: 12, confiance: 8 } }, accord: 8, souvenir: { id: 'un_seul_nom', texte: 'Le jour où l’ancien vous a nommés tous les deux.', poids: 5, tonalite: 'chaud' } },
      { cle: 'defaut', texte: 'L’ancien nomme un autre enfant. {j1} et {j2} sortent du temple sans se regarder, et passent l’après-midi à se battre au bâton derrière l’entrepôt, sans savoir très bien pourquoi.', lien: { les2: { rivalite: 8, respect: 4 } }, accord: 3, souvenir: { id: 'un_seul_nom', texte: 'Le jour où ce n’était ni l’un ni l’autre.', poids: 3, tonalite: 'amer' } },
    ],
  },
  {
    id: 'mc_intro_amis',
    titre: 'Ce qu’on grave dans l’écorce',
    introduction: true,
    types: ['amis'],
    texte: 'La cabane est à moitié construite et penche dangereusement. {j1} et {j2} sont assis dedans, les jambes dans le vide. {j2} a volé le couteau de cuisine. « Il faut graver quelque chose. Une promesse. Une vraie. » La lame tremble un peu au-dessus de l’écorce.',
    choix: [
      { id: 'meilleurs', texte: '« Devenir les meilleurs ninjas de notre génération. »', famille: 'agir' },
      { id: 'jamais_seul', texte: '« Ne jamais laisser l’autre seul. »', famille: 'proteger' },
      { id: 'kage', texte: '« L’un sera Kage, l’autre sera son bras droit. »', famille: 'parler' },
      { id: 'blague', texte: 'Graver une blague à la place', famille: 'partir' },
    ],
    issues: [
      { cle: 'jamais_seul+jamais_seul', texte: 'Les deux bouches disent la même phrase au même moment. Vous vous regardez, interdits, puis vous la gravez, chacun une moitié. « NE JAMAIS LAISSER L’AUTRE SEUL. » Les lettres sont tordues. Elles tiendront plus longtemps que la cabane.', lien: { les2: { loyaute: 15, confiance: 10 } }, accord: 8, souvenir: { id: 'ecorce', texte: '« Ne jamais laisser l’autre seul », gravé dans l’écorce.', poids: 5, tonalite: 'chaud' }, promesse: { id: 'jamais_seul', texte: 'Ne jamais laisser l’autre seul.' } },
      { cle: 'meilleurs+meilleurs', texte: '« Les meilleurs. » « Les meilleurs. » Vous gravez le mot si profond que la lame se casse. Il faudra expliquer le couteau. Ça en valait la peine.', lien: { les2: { rivalite: 8, loyaute: 8 } }, accord: 6, souvenir: { id: 'ecorce', texte: '« Les meilleurs », gravé dans l’écorce.', poids: 4, tonalite: 'fier' }, promesse: { id: 'meilleurs', texte: 'Devenir les meilleurs ninjas de votre génération.' } },
      { cle: 'kage+kage', texte: '« Lequel sera Kage ? » « Moi. » « Non, moi. » Vous gravez la promesse quand même, et laissez la question en blanc. Elle vous suivra longtemps.', lien: { les2: { rivalite: 10, loyaute: 6 } }, accord: 4, souvenir: { id: 'ecorce', texte: 'La promesse du Kage et de son bras droit, sans dire lequel.', poids: 4, tonalite: 'chaud' }, promesse: { id: 'kage', texte: 'L’un sera Kage, l’autre son bras droit.' } },
      { cle: 'blague+blague', texte: 'Vous gravez un dessin très grossier du professeur de l’Académie, et vous riez tellement que la cabane s’effondre pour de bon. Vous vous retrouvez dans les fougères, couverts de bleus, et vous riez encore.', lien: { les2: { confiance: 8 } }, accord: 5, souvenir: { id: 'ecorce', texte: 'Le dessin du professeur, et la cabane effondrée.', poids: 3, tonalite: 'chaud' } },
      { cle: 'famille:partir+proteger', texte: '{un} grave une blague. {deux}, en dessous, en petit, grave « Ne jamais laisser l’autre seul ». {un} ne la voit que des années plus tard.', lien: { deux: { loyaute: 10 }, un: { confiance: 4 } }, accord: 3, souvenir: { id: 'ecorce', texte: 'La petite phrase gravée sous la blague.', poids: 4, tonalite: 'chaud' } },
      { cle: 'defaut', texte: 'Vous ne gravez pas la même chose. Alors vous gravez les deux, côte à côte, et une fois rentrés vous ne parlez de rien d’autre pendant des jours : laquelle des deux promesses était la bonne.', lien: { les2: { confiance: 5, rivalite: 4 } }, accord: 3, souvenir: { id: 'ecorce', texte: 'Deux promesses côte à côte dans l’écorce.', poids: 3, tonalite: 'chaud' } },
    ],
  },
  {
    id: 'mc_intro_rivaux',
    titre: 'Une seule place au premier rang',
    introduction: true,
    types: ['rivaux'],
    texte: 'Premier jour à l’Académie. Il reste une place au premier rang, juste devant le tableau, et {j1} et {j2} l’ont vue en même temps, depuis les deux bouts de la salle.',
    choix: [
      { id: 'courir', texte: 'Courir pour l’avoir', famille: 'agir' },
      { id: 'defier', texte: '« On la joue. Au premier qui touche le mur du fond. »', famille: 'parler' },
      { id: 'ceder', texte: 'S’asseoir ailleurs, sans un regard', famille: 'partir' },
      { id: 'regarder', texte: 'Regarder ce que fait l’autre', famille: 'observer' },
    ],
    issues: [
      { cle: 'courir+courir', texte: 'Vous arrivez en même temps et vous asseyez à moitié chacun sur le même banc. Aucun ne cède. Vous passez la première journée d’Académie serrés comme des harengs, à vous donner des coups de coude. Le professeur vous surnomme « les deux sardines ». Le surnom restera.', lien: { les2: { rivalite: 15, respect: 4 } }, accord: 4, souvenir: { id: 'premier_rang', texte: 'Les deux sardines du premier rang.', poids: 4, tonalite: 'chaud' } },
      { cle: 'courir+ceder', texte: '{un} prend la place. {deux} s’assoit au fond sans un regard. Toute la journée, {un} sent ce regard dans sa nuque, qui n’est pas là. C’est pire.', lien: { un: { rivalite: 6 }, deux: { ressentiment: 6, rivalite: 10 } }, souvenir: { id: 'premier_rang', texte: 'La place du premier rang, cédée sans un mot.', poids: 3, tonalite: 'amer' } },
      { cle: 'defier+defier', texte: 'Vous dites la même phrase en même temps. Toute la classe se tourne. Vous courez jusqu’au mur du fond ; vous le touchez en même temps, et vous vous disputez jusqu’au soir pour savoir qui l’a touché d’abord.', lien: { les2: { rivalite: 12, respect: 8 } }, accord: 6, souvenir: { id: 'premier_rang', texte: 'La course jusqu’au mur du fond, le premier jour.', poids: 4, tonalite: 'fier' } },
      { cle: 'defaut', texte: '{j1} et {j2} se toisent d’un bout à l’autre de la salle. Le professeur entre, et met un troisième élève à la place. Vous venez de trouver votre premier ennemi commun.', lien: { les2: { rivalite: 8, confiance: 4 } }, accord: 3, souvenir: { id: 'premier_rang', texte: 'Le troisième élève à la place du premier rang.', poids: 3, tonalite: 'chaud' } },
    ],
  },
  {
    id: 'mc_intro_inconnus',
    titre: 'Une seule couverture',
    introduction: true,
    types: ['inconnus', 'clans_differents', 'villages_differents'],
    texte: (c) =>
      `${memeVillage(c) ? 'Une sortie scolaire en montagne' : 'Deux caravanes, venues de deux villages,'} bloquée${memeVillage(c) ? '' : 's'} par la tempête dans le même relais de montagne. Le feu a été mal fait. Il reste une seule couverture sèche, et deux enfants qui ne se connaissent pas : {j1} et {j2}. Ils la regardent tous les deux.`,
    choix: [
      { id: 'partager', texte: 'Proposer de la partager', famille: 'proteger' },
      { id: 'prendre', texte: 'La prendre en premier', famille: 'agir' },
      { id: 'donner', texte: 'La lui donner, et grelotter', famille: 'partir' },
      { id: 'parler', texte: 'Lui demander d’où vient sa caravane', famille: 'parler' },
    ],
    issues: [
      { cle: 'partager+partager', texte: 'Vous tendez la main en même temps vers la couverture, et vous vous arrêtez en même temps. Elle finit sur vos deux épaules. Au matin, la tempête est tombée ; vous avez parlé toute la nuit, et vous ne vous rappelez même plus de quoi.', lien: { les2: { confiance: 15, mefiance: -10 } }, accord: 6, souvenir: { id: 'couverture', texte: 'La nuit de la tempête, sous la même couverture.', poids: 4, tonalite: 'chaud' } },
      { cle: 'prendre+donner', texte: '{un} prend la couverture. {deux} la lui laisse sans protester, et passe la nuit à trembler près du feu. Au matin, {un} remarque ses lèvres bleues, et ne sait pas quoi dire.', lien: { un: { dette: 12 }, deux: { ressentiment: 4 } }, souvenir: { id: 'couverture', texte: 'La couverture prise, la nuit de la tempête.', poids: 3, tonalite: 'honteux' } },
      { cle: 'prendre+prendre', texte: 'Vous vous jetez dessus en même temps. Elle se déchire en deux. Vous passez la nuit chacun avec sa moitié, chacun dans un coin, à vous surveiller. Au matin, vous avez froid tous les deux, et un ennemi.', lien: { les2: { mefiance: 12, rivalite: 10 } }, souvenir: { id: 'couverture', texte: 'La couverture déchirée en deux.', poids: 3, tonalite: 'amer' } },
      { cle: 'famille:parler+proteger', texte: '{un} pose des questions, {deux} étend la couverture sur vous deux. Vous apprenez vos noms, vos villages, vos peurs. La tempête dure deux jours. Vous ne vous en plaignez pas.', lien: { les2: { confiance: 10, mefiance: -6 } }, accord: 4, souvenir: { id: 'couverture', texte: 'Deux jours de tempête à se raconter.', poids: 4, tonalite: 'chaud' } },
      { cle: 'defaut', texte: '{j1} et {j2} se regardent longtemps par-dessus la couverture. Finalement, aucun ne la prend. Elle reste par terre entre vous toute la nuit, comme une frontière, et vous mourez de froid tous les deux par fierté.', lien: { les2: { respect: 6, mefiance: 4 } }, accord: 2, souvenir: { id: 'couverture', texte: 'La couverture que personne n’a prise.', poids: 3, tonalite: 'amer' } },
    ],
  },
  {
    id: 'mc_intro_improbable',
    titre: 'Sous les décombres',
    introduction: true,
    types: ['improbable'],
    texte: 'Le quartier brûle encore. Une maison s’est effondrée sur elle-même, et sous les poutres, une voix d’enfant appelle, de plus en plus faiblement. {j1} et {j2} sont les seuls à l’entendre, chacun d’un côté des décombres. Ils ne se connaissent pas.',
    choix: [
      { id: 'degager', texte: 'Dégager les poutres à mains nues', famille: 'agir' },
      { id: 'appeler', texte: 'Courir chercher un adulte', famille: 'parler' },
      { id: 'rassurer', texte: 'Parler à l’enfant pour qu’il tienne', famille: 'proteger' },
      { id: 'fuir', texte: 'S’enfuir : tout va s’écrouler', famille: 'partir' },
    ],
    issues: [
      { cle: 'degager+degager', texte: 'Vous soulevez la même poutre, chacun d’un côté. Elle bouge. L’enfant sort en rampant, couvert de cendres, et s’accroche à vous deux à la fois. Vous ne vous lâcherez plus vraiment.', lien: { les2: { confiance: 15, loyaute: 10 } }, accord: 8, souvenir: { id: 'decombres', texte: 'La poutre soulevée à deux.', poids: 5, tonalite: 'fier' } },
      { cle: 'degager+rassurer', texte: '{un} tire sur les poutres en se brûlant les mains ; {deux} parle à l’enfant sans s’arrêter, de tout et de rien, pour qu’il ne s’endorme pas. Quand {un} le sort enfin, l’enfant ne lâche plus la main de {deux}.', lien: { les2: { respect: 10, confiance: 8 } }, accord: 6, souvenir: { id: 'decombres', texte: 'L’enfant des décombres.', poids: 5, tonalite: 'fier' } },
      { cle: 'degager+fuir', texte: '{deux} recule et s’enfuit. {un} reste, seul{e:un}, et tire jusqu’à ce que ses ongles cassent. L’enfant est sauvé. Le lendemain, {un} reconnaît {deux} dans la foule. {deux} détourne les yeux.', lien: { un: { mefiance: 12, ressentiment: 6 }, deux: { dette: 8, admiration: 10 } }, souvenir: { id: 'decombres', texte: 'Celui qui est resté, et celui qui a fui.', poids: 5, tonalite: 'honteux' } },
      { cle: 'defaut', texte: 'Chacun fait ce qu’il peut, de son côté des décombres. L’enfant est sauvé, à l’aube, par des ninjas adultes. Vous vous croisez au poste de secours, couverts de suie, et vous vous reconnaissez sans vous connaître.', lien: { les2: { confiance: 6 } }, accord: 3, souvenir: { id: 'decombres', texte: 'La nuit de l’incendie.', poids: 4, tonalite: 'tragique' } },
    ],
  },

  // ── La ruelle (12 ans) ──
  {
    id: 'mc_ruelle',
    titre: 'L’enfant de la ruelle',
    age: { min: 12, max: 15 },
    texte: 'La pluie tombe depuis plusieurs heures. En rentrant, {j1} et {j2} entendent un bruit derrière les caisses d’un marchand. Un enfant est assis contre le mur, une main serrée autour de son bras. « Ne vous approchez pas… Je n’ai besoin de personne. »',
    choix: [
      { id: 'approcher', texte: 'S’approcher', famille: 'agir' },
      { id: 'aider', texte: 'Lui proposer de l’aide, de loin', famille: 'parler' },
      { id: 'adulte', texte: 'Appeler un adulte', famille: 'proteger' },
      { id: 'observer', texte: 'Observer la ruelle', famille: 'observer' },
      { id: 'partir', texte: 'Continuer son chemin', famille: 'partir' },
    ],
    issues: [
      { cle: 'approcher+observer', texte: '{un} s’approche ; {deux} reste en arrière, les yeux sur les toits. C’est {deux} qui voit les deux silhouettes qui attendaient qu’on s’approche. Un cri, et {un} recule à temps. L’enfant était l’appât. Les silhouettes s’enfuient.', lien: { un: { confiance: 10, dette: 6 }, deux: { respect: 4 } }, accord: 8, effets: { les2: [{ stat: 'attributs.perception', delta: 1 }] }, souvenir: { id: 'ruelle', texte: 'La ruelle sous la pluie : l’appât, et les silhouettes sur les toits.', poids: 4, tonalite: 'fier' } },
      { cle: 'approcher+approcher', texte: 'Vous vous approchez ensemble. L’enfant tire un couteau, puis le lâche en voyant que vous êtes deux. Il a le bras cassé. Vous le portez à tour de rôle jusqu’à l’hôpital, sous la pluie.', lien: { les2: { confiance: 6, respect: 4 } }, accord: 5, effets: { les2: [{ ethique: { compassion: 3 } }] }, souvenir: { id: 'ruelle', texte: 'L’enfant au bras cassé, porté à tour de rôle sous la pluie.', poids: 3, tonalite: 'chaud' } },
      { cle: 'famille:agir+partir', texte: '{un} s’approche ; {deux} continue son chemin. Quand {un} se retourne pour l’appeler, la rue est vide. L’enfant laisse {un} le soigner, en silence. Le lendemain, {un} ne dit pas bonjour à {deux}.', lien: { un: { ressentiment: 8, confiance: -6 } }, effets: { un: [{ ethique: { compassion: 3 } }] }, souvenir: { id: 'ruelle', texte: 'La ruelle, où l’un est resté et l’autre est parti.', poids: 3, tonalite: 'amer' } },
      { cle: 'famille:parler+proteger', texte: '{un} parle doucement à l’enfant pendant que {deux} court chercher un garde. Quand le garde arrive, l’enfant a donné son nom à {un}. Il ne l’avait donné à personne depuis des mois.', lien: { les2: { confiance: 6 } }, accord: 5, souvenir: { id: 'ruelle', texte: 'Le nom que l’enfant de la ruelle n’avait donné à personne.', poids: 3, tonalite: 'chaud' } },
      { cle: 'accord', texte: '{j1} et {j2} font exactement la même chose, au même moment. L’enfant les regarde l’un puis l’autre, et éclate d’un rire nerveux. « Vous êtes bizarres, vous deux. » Il vous laisse l’aider.', lien: { les2: { confiance: 5 } }, accord: 6, souvenir: { id: 'ruelle', texte: 'L’enfant qui vous a trouvés bizarres.', poids: 2, tonalite: 'chaud' } },
      { cle: 'complement', texte: '{un} et {deux} ne font pas la même chose, mais leurs gestes s’emboîtent. L’enfant finit à l’abri, le bras bandé, et ne sait pas lequel des deux remercier.', lien: { les2: { respect: 4 } }, accord: 4 },
      { cle: 'conflit', texte: '« Viens ! » « Non, toi, viens ! » Vous vous disputez sous la pluie, et quand vous vous retournez, l’enfant a disparu. Il n’y a plus qu’une traînée de sang dans une flaque.', lien: { les2: { ressentiment: 5, rivalite: 4 } }, souvenir: { id: 'ruelle', texte: 'L’enfant qui a disparu pendant votre dispute.', poids: 3, tonalite: 'honteux' } },
    ],
  },

  // ── La promesse (avant le premier vrai départ) ──
  {
    id: 'mc_promesse',
    titre: 'Avant le premier vrai départ',
    age: { min: 13, max: 17 },
    texte: 'La veille de vos premières vraies missions, {j1} et {j2} se retrouvent sur le toit du dortoir, comme avant. La lune est énorme. Personne ne parle de demain. Puis l’un des deux dit : « Il faudrait se promettre quelque chose. »',
    choix: [
      { id: 'jonin', texte: '« Devenir jōnin ensemble. »', famille: 'agir' },
      { id: 'abandon', texte: '« Ne jamais s’abandonner. Quoi qu’il arrive. »', famille: 'proteger' },
      { id: 'retour', texte: '« Se retrouver ici après chaque mission. »', famille: 'parler' },
      { id: 'rien', texte: '« Les promesses, ça porte malheur. »', famille: 'partir' },
    ],
    issues: [
      { cle: 'abandon+abandon', texte: 'Vous le dites ensemble, et vous vous serrez la main comme des adultes, très sérieusement. Puis vous ne savez plus quoi faire de vos mains, et vous riez.', lien: { les2: { loyaute: 15, confiance: 6 } }, accord: 5, promesse: { id: 'ne_jamais_abandonner', texte: 'Ne jamais s’abandonner, quoi qu’il arrive.' }, souvenir: { id: 'toit_promesse', texte: 'La promesse du toit : ne jamais s’abandonner.', poids: 5, tonalite: 'chaud' } },
      { cle: 'jonin+jonin', texte: '« Jōnin. Ensemble. » « Le même jour. » « Le même jour. » Vous savez déjà tous les deux que c’est impossible. Vous le promettez quand même.', lien: { les2: { rivalite: 6, loyaute: 8 } }, accord: 4, promesse: { id: 'jonin_ensemble', texte: 'Devenir jōnin ensemble.' }, souvenir: { id: 'toit_promesse', texte: 'La promesse du toit : jōnin ensemble.', poids: 4, tonalite: 'fier' } },
      { cle: 'retour+retour', texte: 'Ici. Après chaque mission. Même si l’autre n’est pas là. Surtout si l’autre n’est pas là.', lien: { les2: { peur_de_perdre: 10, loyaute: 8 } }, accord: 4, promesse: { id: 'toit', texte: 'Se retrouver sur le toit après chaque mission.' }, souvenir: { id: 'toit_promesse', texte: 'La promesse du toit : se retrouver ici.', poids: 4, tonalite: 'chaud' } },
      { cle: 'famille:partir+proteger', texte: '« Les promesses, ça porte malheur », dit {un}. {deux} ne répond rien. Puis, très bas : « Alors je la fais seul{e:deux}. » {un} fait semblant de ne pas avoir entendu.', lien: { deux: { loyaute: 12, peur_de_perdre: 8 }, un: { dette: 6 } }, souvenir: { id: 'toit_promesse', texte: 'La promesse que {deux} a faite sans l’autre, sur le toit.', poids: 4, tonalite: 'amer' } },
      { cle: 'defaut', texte: 'Vous ne promettez pas la même chose. Vous vous en disputez un peu, puis vous décidez que les deux comptent. La lune descend. Demain, vous partez.', lien: { les2: { loyaute: 5, confiance: 3 } }, accord: 3, souvenir: { id: 'toit_promesse', texte: 'Les deux promesses du toit.', poids: 3, tonalite: 'chaud' } },
    ],
  },

  // ── Le désaccord (une poursuite) ──
  {
    id: 'mc_poursuite',
    titre: 'Il ne peut pas être loin',
    age: { min: 15, max: 22 },
    texte: 'Une mission de reconnaissance tourne mal. L’homme que vous deviez surveiller a vu {j1}, et s’est enfui vers les bois. « On doit poursuivre. Il ne peut pas être loin. » « On ne sait même pas combien ils sont. » « Si on attend, il va disparaître. » « Et si on fonce, on risque de ne jamais revenir. »',
    choix: [
      { id: 'poursuivre', texte: 'Poursuivre, maintenant', famille: 'agir' },
      { id: 'attendre', texte: 'Attendre les renforts', famille: 'observer' },
      { id: 'plan', texte: 'Proposer un autre plan : le contourner par la rivière', famille: 'parler' },
      { id: 'separer', texte: 'Se séparer : chacun son idée', famille: 'partir' },
    ],
    issues: [
      { cle: 'poursuivre+poursuivre', texte: 'Vous partez ensemble, et vous le rattrapez au gué. Il n’était pas seul : ils sont trois. Le combat est court et sale. Vous rentrez tous les deux, en sang, avec le prisonnier. Votre sensei ne sait pas s’il doit vous féliciter ou vous gifler. Il fait les deux.', lien: { les2: { respect: 8, confiance: 6 } }, accord: 8, effets: { les2: [{ stat: 'social.reputation', delta: 3 }, { blessure: { id: 'gue', nom: 'Entailles du gué', gravite: 1, jours: 14 } }] }, souvenir: { id: 'gue', texte: 'Le gué, et les trois hommes au lieu d’un.', poids: 4, tonalite: 'fier' } },
      { cle: 'poursuivre+attendre', texte: '{un} fonce ; {deux} reste, comme l’ordre le voulait. Les renforts arrivent une heure plus tard et retrouvent {un} au gué, seul{e:un} contre trois, à bout de forces. Ils arrivent à temps. De justesse.', lien: { un: { ressentiment: 6 }, deux: { peur_de_perdre: 10, mefiance: 4 } }, effets: { un: [{ blessure: { id: 'gue', nom: 'Entailles du gué', gravite: 2, jours: 30 } }] }, souvenir: { id: 'gue', texte: 'Le gué, où l’un a foncé sans l’autre.', poids: 4, tonalite: 'amer' } },
      { cle: 'plan+poursuivre', texte: '{un} propose la rivière ; {deux} hésite, puis le suit. Le plan marche : vous le cueillez à la sortie du bois, sans un coup. {deux} ne l’avouera jamais, mais c’était mieux que de foncer.', lien: { deux: { respect: 8 }, un: { confiance: 4 } }, accord: 6, effets: { les2: [{ stat: 'social.reputation', delta: 2 }] }, souvenir: { id: 'gue', texte: 'Le plan de la rivière.', poids: 3, tonalite: 'fier' } },
      { cle: 'plan+plan', texte: 'Vous avez eu la même idée. Vous ne dites rien : vous partez, chacun d’un côté de la rivière, comme si vous l’aviez répété. L’homme n’a aucune chance.', lien: { les2: { confiance: 8, respect: 6 } }, accord: 10, effets: { les2: [{ stat: 'social.reputation', delta: 3 }] }, souvenir: { id: 'gue', texte: 'La rivière, chacun d’un côté, sans un mot.', poids: 4, tonalite: 'fier' } },
      { cle: 'famille:partir+agir', texte: '« Fais comme tu veux. » {un} part de son côté ; {deux} poursuit seul{e:deux}. L’homme s’échappe entre vous deux. Au rapport, vous racontez deux histoires différentes. Votre sensei vous regarde longtemps.', lien: { les2: { ressentiment: 6, confiance: -6 } }, effets: { les2: [{ stat: 'social.reputation', delta: -2 }] }, souvenir: { id: 'gue', texte: 'La poursuite ratée, chacun de son côté.', poids: 3, tonalite: 'amer' } },
      { cle: 'accord', texte: 'Vous êtes d’accord, pour une fois, sans même en parler. La mission se termine comme prévu ; personne ne saura jamais à quel point ça a failli tourner autrement.', lien: { les2: { confiance: 4 } }, accord: 5 },
      { cle: 'conflit', texte: 'Vous vous disputez trop longtemps. Quand vous vous décidez, il n’y a plus de traces. Au rapport, aucun des deux ne charge l’autre. C’est déjà ça.', lien: { les2: { rivalite: 5, respect: 2 } }, effets: { les2: [{ stat: 'social.reputation', delta: -1 }] } },
      { cle: 'defaut', texte: 'Vous finissez par suivre un plan qui n’est celui d’aucun des deux. L’homme s’échappe. Vous rentrez sans rien, mais ensemble.', lien: { les2: { confiance: 2 } }, accord: 3 },
    ],
  },

  // ── Les retrouvailles ──
  {
    id: 'mc_retrouvailles',
    titre: 'Tu as mis du temps',
    age: { min: 19, max: 30 },
    texte: (c) =>
      lienChaud(c)
        ? 'Des mois sans se voir : des missions à l’autre bout du pays, des lettres qui arrivaient en retard ou pas du tout. Et puis, un soir, à la porte du village. « Tu as mis du temps. » « Tu m’attendais ? » « J’aurais pu partir. » « Mais tu es resté. »'
        : 'Des mois sans se voir, et pas une lettre. Un soir, à la porte du village, {j1} et {j2} se retrouvent face à face. « Tu n’aurais jamais dû revenir. » « Je savais que tu dirais ça. » « Alors pourquoi être revenu ? » « Parce que je n’ai pas encore terminé ce que j’ai commencé. »',
    choix: [
      { id: 'main', texte: 'Tendre la main', famille: 'proteger' },
      { id: 'reproche', texte: 'Dire ce qu’on a sur le cœur', famille: 'parler' },
      { id: 'sparring', texte: '« Montre-moi ce que tu as appris. » (un combat amical)', famille: 'agir' },
      { id: 'partir', texte: 'Passer son chemin', famille: 'partir' },
    ],
    issues: [
      { cle: 'main+main', texte: 'Vos mains se rencontrent à mi-chemin, et la poignée de main devient une accolade maladroite, puis une vraie. Les gardes de la porte détournent les yeux, gênés.', lien: { les2: { confiance: 8, peur_de_perdre: 6, ressentiment: -6 } }, accord: 4, souvenir: { id: 'porte_retour', texte: 'Les retrouvailles à la porte du village.', poids: 4, tonalite: 'chaud' } },
      { cle: 'main+reproche', texte: '{un} tend la main ; {deux} la regarde sans la prendre, et dit tout. Les lettres sans réponse, les nuits à attendre, la colère. {un} écoute jusqu’au bout, la main toujours tendue. À la fin, {deux} la prend.', lien: { un: { respect: 4 }, deux: { ressentiment: -10, confiance: 6 } }, accord: 3, souvenir: { id: 'porte_retour', texte: 'La main restée tendue pendant que l’autre disait tout.', poids: 5, tonalite: 'chaud' } },
      { cle: 'sparring+sparring', texte: 'Vous posez vos sacs et vous vous mettez en garde, là, devant la porte. Les gardes parient. Personne ne gagne : vous finissez assis dans la poussière, à rire en vous tenant les côtes.', lien: { les2: { respect: 8, rivalite: 6 } }, accord: 8, effets: { les2: [{ entrainer: 'taijutsu', jours: 10 }] }, souvenir: { id: 'porte_retour', texte: 'Le combat devant la porte, que personne n’a gagné.', poids: 4, tonalite: 'fier' } },
      { cle: 'famille:partir+proteger', texte: '{deux} tend la main. {un} passe à côté sans la voir, ou en faisant semblant. La main reste tendue un moment dans le vide, puis retombe.', lien: { deux: { ressentiment: 10, peur_de_perdre: 6 }, un: { mefiance: 4 } }, souvenir: { id: 'porte_retour', texte: 'La main tendue dans le vide, à la porte.', poids: 4, tonalite: 'amer' } },
      { cle: 'partir+partir', texte: 'Vous vous croisez sans vous arrêter, chacun regardant ailleurs. Le soir, chacun se demande si l’autre a regardé en arrière.', lien: { les2: { ressentiment: 6, peur_de_perdre: 4 } }, souvenir: { id: 'porte_retour', texte: 'Le soir où vous vous êtes croisés sans vous arrêter.', poids: 3, tonalite: 'amer' } },
      { cle: 'defaut', texte: '{j1} et {j2} restent face à face un moment, sans savoir par où commencer. Puis l’un des deux propose d’aller manger. C’est un début.', lien: { les2: { confiance: 3 } }, accord: 2 },
    ],
  },
];
