import type { Campagne, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import { ageA, autre, bouger, fait, jourMonde, noter, planifierCommune, planifierPrivee, rompre, souvenir, texteCommun } from '../../engine/campagne/outils';

/**
 * Deux vies, un fil rouge : le Héron. Un homme masqué que vous croisez enfants, qui connaît votre famille (ou ce que vous
 * avez de plus cher), et qui, des années plus tard, fait une offre à l'un de vous deux. Rien n'est forcé : l'offre peut
 * être refusée, acceptée, retournée contre lui. Le reste de la vie : l'Académie, l'examen, la guerre, le rang, les deuils.
 * Jetons : {j1} {j2} {un} {deux} {moi} {autre}, accords {il:x} {e:x} {le:x} {lui:x}, et {parent}, {parent2}, {aine}.
 */

const freres = (c: Campagne) => c.lien.type === 'freres';
const memeParent = (c: Campagne) => freres(c) && c.lien.origine !== 'parents_separes';
const fil = (c: Campagne) => c.fil;
/** Celui à qui le Héron fera son offre : celui qui tient le moins à l'autre (à égalité, le cadet du lien). */
const tente = (c: Campagne): IdJoueur => {
  const v = (j: IdJoueur) => c.lien.axes[j].loyaute + c.lien.axes[j].confiance - c.lien.axes[j].ressentiment - c.lien.axes[j].jalousie;
  return v(0) < v(1) ? 0 : v(1) < v(0) ? 1 : c.joueurs[0].naissance > c.joueurs[1].naissance ? 0 : 1;
};
const traitre = (c: Campagne) => (['engage', 'double', 'abandonne'].includes(c.fil.etape) ? c.fil.joueur : undefined);

export const SCENES_VIE: SceneCommuneDef[] = [
  // ── L'Académie ──
  {
    id: 'mc_academie',
    titre: 'L’épreuve du clone',
    age: { min: 9, max: 11 },
    texte: 'Examen de fin d’année. Trois clones, devant le jury, sans trembler. {j1} et {j2} sont assis côte à côte au fond de la salle. Le premier appelé, c’est {j2}. Ses mains tremblent déjà.',
    choix: [
      { id: 'souffler', texte: 'Lui souffler le bon enchaînement de signes', famille: 'proteger' },
      { id: 'soi', texte: 'Te concentrer sur ton propre passage', famille: 'agir' },
      { id: 'diversion', texte: 'Faire tomber ton encrier pour lui donner une minute de plus', famille: 'parler' },
      { id: 'regarder', texte: 'Regarder, et apprendre de ses erreurs', famille: 'observer' },
    ],
    issues: [
      { cle: 'souffler+souffler', texte: 'Vous vous soufflez mutuellement l’enchaînement… chacun le sien, et ils ne sont pas les mêmes. Le jury vous regarde, l’un puis l’autre, se mélanger les doigts. Vous passez tous les deux, de justesse, et vous ne vous en remettez jamais : vous en riez encore à trente ans.', lien: { les2: { confiance: 6 } }, accord: 4, souvenir: { id: 'clones', texte: 'L’examen des clones, et les deux enchaînements soufflés en même temps.', poids: 3, tonalite: 'chaud' } },
      { cle: 'diversion+soi', texte: 'L’encrier de {un} se renverse avec un fracas énorme. Le jury se retourne. {deux}, qui allait passer, en profite pour respirer. Son trois clones sont parfaits. {un}, lui, passe l’après-midi à nettoyer le parquet.', lien: { deux: { dette: 8, admiration: 6 } }, accord: 3, souvenir: { id: 'clones', texte: 'L’encrier renversé, le jour de l’examen.', poids: 4, tonalite: 'chaud' } },
      { cle: 'souffler+soi', texte: '{un} souffle l’enchaînement, très bas. {deux} l’entend, et ne s’en sert pas : {il:deux} veut réussir seul{e:deux}. Trois clones, nets. En sortant, {deux} dit seulement : « Je n’avais pas besoin de toi. » Puis, après un moment : « Merci quand même. »', lien: { un: { respect: 4 }, deux: { rivalite: 5, dette: 3 } }, accord: 2 },
      { cle: 'defaut', texte: 'Chacun passe son examen comme il peut. Le soir, vous comparez vos notes du bout des lèvres. L’un a eu mieux que l’autre ; vous savez tous les deux lequel, et vous n’en parlez pas.', lien: { les2: { rivalite: 5 } }, accord: 2 },
    ],
  },

  // ── Les lettres (une fratrie ou des amis séparés) ──
  {
    id: 'mc_lettre',
    titre: 'Une lettre de l’autre village',
    age: { min: 10, max: 13 },
    si: (c) => c.creations[0].village !== c.creations[1].village,
    texte: (c) =>
      freres(c)
        ? 'Une lettre arrive, pliée trop de fois, couverte de tampons de deux villages. L’écriture est maladroite, et tu la reconnais tout de suite. « On m’a dit que tu étais là-bas. Je ne sais même pas à quoi tu ressembles maintenant. Est-ce que tu te souviens de {parent} ? Moi, un peu. Son rire, surtout. »'
        : 'Une lettre arrive, couverte de tampons de deux villages. « Ici, c’est différent de chez toi. Les gens parlent moins. Je pense souvent à la tempête, à la couverture. Est-ce que tu penses à moi aussi, ou c’est bête ? »',
    choix: [
      { id: 'repondre', texte: 'Répondre tout de suite, trois pages', famille: 'proteger' },
      { id: 'garder', texte: 'La garder sous ton oreiller, sans répondre', famille: 'observer' },
      { id: 'dessin', texte: 'Répondre par un dessin', famille: 'parler' },
    ],
    issues: [
      { cle: 'repondre+repondre', texte: 'Vos lettres se croisent sur la route, chacune répondant à une question que l’autre n’avait pas encore posée. Pendant des années, ce sera ça : deux voix qui se parlent avec un mois de retard.', lien: { les2: { confiance: 8, peur_de_perdre: 6 } }, accord: 3, souvenir: { id: 'lettres', texte: 'Les lettres qui se croisaient sur la route.', poids: 4, tonalite: 'chaud' } },
      { cle: 'famille:observer+proteger', texte: '{deux} écrit, et réécrit, et n’a jamais de réponse. Ce n’est que des années plus tard que {un} avoue avoir gardé toutes les lettres, sous son oreiller, sans savoir quoi répondre.', lien: { deux: { ressentiment: 6 }, un: { dette: 6, peur_de_perdre: 6 } }, souvenir: { id: 'lettres', texte: 'Les lettres restées sans réponse, gardées sous un oreiller.', poids: 4, tonalite: 'amer' } },
      { cle: 'defaut', texte: 'Les lettres vont et viennent, irrégulièrement, avec des dessins et des fautes d’orthographe. C’est peu. C’est un fil. Il tient.', lien: { les2: { confiance: 4 } }, accord: 2 },
    ],
  },

  // ── Le Héron, la première fois ──
  {
    id: 'mc_heron_ombre',
    titre: 'L’homme au masque de héron',
    age: { min: 13, max: 16 },
    texte: (c) =>
      `${c.creations[0].village === c.creations[1].village ? 'Une mission de routine' : 'Une mission commune entre vos deux villages'}, à la frontière. Au crépuscule, au bord d’un étang, un homme pêche, immobile, debout sur une seule jambe. Il porte un masque de héron, blanc, au long bec. Il ne se retourne pas. « Vous avez grandi », dit-il. Vous ne l’avez jamais vu. ${
        memeParent(c) ? '« Dites à {parent} que le Héron se souvient de la nuit où {il:parent} n’est pas rentré{e:parent}. {Il:parent} comprendra. »' : '« Je vous ai vus, sous la pluie, dans une ruelle. Vous avez été prudents. C’est rare, à votre âge. »'
      } Il pose une longue plume grise sur l’eau, et disparaît sans faire de vagues.`,
    choix: [
      { id: 'suivre', texte: 'Le suivre dans les roseaux', famille: 'agir' },
      { id: 'plume', texte: 'Ramasser la plume', famille: 'observer' },
      { id: 'rapport', texte: 'Faire un rapport, tout de suite', famille: 'parler' },
      { id: 'proteger', texte: 'Rester près de l’autre, kunai en main', famille: 'proteger' },
    ],
    issues: [
      { cle: 'suivre+suivre', texte: 'Vous fouillez les roseaux jusqu’à la nuit noire. Rien. Pas une trace dans la boue, comme s’il n’avait jamais touché le sol. En rentrant, vous ne parlez pas. Vous savez tous les deux que vous le reverrez.', lien: { les2: { confiance: 4 } }, accord: 3, souvenir: { id: 'heron_1', texte: 'L’homme au masque de héron, au bord de l’étang.', poids: 5, tonalite: 'tragique' }, apres: (c) => fait(c, { id: 'heron_vu', texte: 'Un homme au masque de héron vous connaît. Il connaît votre passé.', connus: [0, 1], preuves: 0 }) },
      { cle: 'plume+rapport', texte: '{un} garde la plume, sans rien dire. {deux} fait son rapport ; le sensei écoute, devient très pâle, et vous ordonne de ne plus jamais en parler. Ce soir-là, {un} sort la plume de sa sacoche et la regarde longtemps. Elle est en acier.', lien: { un: { mefiance: 3 } }, accord: 2, souvenir: { id: 'heron_1', texte: 'La plume d’acier, et l’ordre de ne plus en parler.', poids: 5, tonalite: 'tragique' }, apres: (c, un) => fait(c, { id: 'heron_vu', texte: 'Un homme au masque de héron vous connaît. On vous a ordonné de vous taire.', connus: [0, 1, 'kage'], preuves: 0 }) },
      { cle: 'defaut', texte: 'Quand il a disparu, vous restez longtemps au bord de l’étang. La plume grise flotte encore. Personne, au village, ne veut vous dire qui il est. C’est la réponse la plus inquiétante.', lien: { les2: { confiance: 3, peur_de_perdre: 4 } }, accord: 3, souvenir: { id: 'heron_1', texte: 'L’homme au masque de héron, et le silence des adultes.', poids: 5, tonalite: 'tragique' }, apres: (c) => fait(c, { id: 'heron_vu', texte: 'Un homme au masque de héron vous connaît.', connus: [0, 1], preuves: 0 }) },
    ],
  },

  // ── Le premier combat côte à côte ──
  {
    id: 'mc_premier_combat',
    titre: 'Le col des pillards',
    age: { min: 13, max: 17 },
    texte: 'Une escorte de caravane, votre première vraie mission ensemble. Au col, des pierres roulent ; une dizaine d’hommes descendent la pente en hurlant. Le vieux marchand se cache sous sa charrette. Vous êtes seuls : le reste de l’équipe est parti en éclaireur.',
    choix: [
      { id: 'tenir', texte: 'Tenir le col', famille: 'agir' },
      { id: 'marchand', texte: 'Protéger le marchand', famille: 'proteger' },
      { id: 'payer', texte: 'Leur proposer une partie du chargement', famille: 'parler' },
      { id: 'fuir', texte: 'Fuir avec le marchand', famille: 'partir' },
    ],
    issues: [
      { cle: 'tenir+tenir', texte: '« À gauche. » « À droite. » Vous n’avez pas besoin d’en dire plus.', combat: 'premier_combat' },
      { cle: 'tenir+marchand', texte: '{un} se jette au-devant des pillards ; {deux} recule jusqu’à la charrette, kunai levé. Ils sont trop nombreux pour que l’un des deux s’en sorte seul.', combat: 'premier_combat' },
      { cle: 'marchand+marchand', texte: 'Vous formez un cercle autour du marchand, dos à dos. Les pillards vous encerclent.', combat: 'premier_combat' },
      { cle: 'payer+payer', texte: 'Vous leur laissez trois tonneaux de saké, et les pillards repartent en chantant. Le marchand vous en veut pour le saké, et vous remercie pour sa vie. Votre sensei, lui, ne sait pas s’il doit vous punir.', lien: { les2: { confiance: 4 } }, accord: 3 },
      { cle: 'famille:partir+agir', texte: '{un} tire le marchand vers les rochers ; {deux} reste, seul{e:deux}, au milieu du col. Quand l’équipe revient, {deux} tient encore debout, de justesse. {Il:deux} ne regarde pas {un} pendant tout le retour.', lien: { deux: { ressentiment: 10, confiance: -8 }, un: { dette: 4 } }, effets: { deux: [{ blessure: { id: 'col_seul', nom: 'Seul·e au col', gravite: 2, jours: 25 } }] }, souvenir: { id: 'col', texte: 'Le col, où l’un est resté seul.', poids: 4, tonalite: 'amer' } },
      { cle: 'defaut', texte: 'Vous hésitez, chacun à sa façon. Les pillards, eux, n’hésitent pas.', combat: 'premier_combat' },
    ],
  },

  // ── Le secret de famille ──
  {
    id: 'mc_famille_secret',
    titre: 'Ce qu’on ne vous avait jamais dit',
    age: { min: 15, max: 19 },
    si: (c) => c.vues.includes('mc_heron_ombre'),
    texte: (c) =>
      memeParent(c)
        ? '{parent} vous fait asseoir tous les deux à la table de la cuisine, ferme les volets, et sort une plume grise d’une boîte. La même. « Avant votre naissance, pendant la guerre, j’ai servi cet homme. Je portais un masque, moi aussi. J’ai fait des choses que je ne vous raconterai pas. La nuit où je ne suis pas rentré{e:parent}, c’est lui qui m’a laissé{e:parent} partir. Il dit que je lui dois une vie. Il viendra la réclamer. Peut-être à l’un de vous. »'
        : 'Un vieil archiviste vous fait entrer dans la réserve interdite, et sort d’un tiroir un dossier scellé. Un dessin : un masque de héron. « Pendant la guerre, il recrutait des enfants. Des enfants doués, et seuls. Il leur offrait ce qu’ils voulaient le plus. Il ne m’a jamais pris. Il en a pris d’autres. Et il vous a choisis, vous deux. Je ne sais pas encore pour quoi. »',
    choix: [
      { id: 'garder', texte: 'Garder le secret', famille: 'proteger' },
      { id: 'kage', texte: 'En parler au {kage}', famille: 'parler' },
      { id: 'tout', texte: 'Exiger toute la vérité, maintenant', famille: 'agir' },
      { id: 'partir', texte: 'Sortir sans un mot', famille: 'partir' },
    ],
    issues: [
      { cle: 'garder+garder', texte: 'Vous vous regardez, et vous hochez la tête en même temps. Personne ne saura. C’est votre premier vrai secret, et il pèse plus lourd que vous ne l’imaginiez.', lien: { les2: { confiance: 10, loyaute: 6 } }, accord: 3, souvenir: { id: 'secret_famille', texte: 'Le secret de la plume grise, gardé à deux.', poids: 5, tonalite: 'tragique' }, apres: (c) => fait(c, { id: 'secret_heron', texte: 'Vous savez ce que le Héron a été, et ce qu’il veut.', connus: [0, 1], preuves: 0 }) },
      { cle: 'kage+garder', texte: '« Il faut le dire au {kage}. » « Non. » Vous vous disputez à voix basse pendant une heure. {un} finit par promettre de se taire. {deux} n’est pas sûr{e:deux} de {le:un} croire. Et {un} ne sait pas encore s’il tiendra parole.', lien: { deux: { mefiance: 8 }, un: { ressentiment: 4 } }, souvenir: { id: 'secret_famille', texte: 'La dispute sur le secret de la plume.', poids: 4, tonalite: 'amer' }, apres: (c, un) => fait(c, { id: 'secret_heron', texte: 'Vous savez ce que le Héron a été. L’un de vous voulait le dire au Kage.', connus: [0, 1], preuves: 1 }) },
      { cle: 'tout+tout', texte: 'Vous posez les questions ensemble, l’une après l’autre, sans pitié. À la fin, il ne reste plus rien à dire, et vous connaissez le visage sous le masque : un homme ordinaire, que la guerre a vidé. Ça ne le rend pas moins dangereux.', lien: { les2: { respect: 6, confiance: 6 } }, accord: 4, souvenir: { id: 'secret_famille', texte: 'La nuit où vous avez tout su.', poids: 5, tonalite: 'tragique' }, apres: (c) => fait(c, { id: 'secret_heron', texte: 'Vous savez tout du Héron, ou presque.', connus: [0, 1], preuves: 0 }) },
      { cle: 'defaut', texte: 'Chacun réagit à sa façon, et vous repartez chacun avec sa propre idée de ce qu’il faut faire. C’est peut-être exactement ce que le Héron attendait.', lien: { les2: { mefiance: 4 } }, apres: (c) => fait(c, { id: 'secret_heron', texte: 'Vous savez ce que le Héron a été.', connus: [0, 1], preuves: 0 }) },
    ],
  },

  // ── L'examen ──
  {
    id: 'mc_examen',
    titre: 'La finale',
    age: { min: 15, max: 20 },
    texte: 'Examen de sélection. Le tableau des finales est affiché, et les deux derniers noms sont {j1} et {j2}. Dans les gradins, toute une génération attend de voir lequel des deux est le meilleur. L’examinateur lève la main.',
    choix: [
      { id: 'combattre', texte: 'Te battre, sérieusement', famille: 'agir' },
      { id: 'abandonner', texte: 'Abandonner pour {autre}', famille: 'proteger' },
      { id: 'tout', texte: '« Pas de retenue. Montre-moi tout. »', famille: 'parler' },
      { id: 'refuser', texte: 'Refuser de te battre contre {autre}', famille: 'partir' },
    ],
    issues: [
      { cle: 'combattre+combattre', texte: 'Vous vous saluez, comme on vous l’a appris. Puis vous vous mettez en garde.', combat: 'duel_examen' },
      { cle: 'tout+combattre', texte: '« Montre-moi tout. » {deux} sourit. « Toi d’abord. »', combat: 'duel_examen' },
      { cle: 'tout+tout', texte: 'Vous avez dit la même phrase. Les gradins se taisent d’un coup.', combat: 'duel_examen' },
      { cle: 'abandonner+combattre', texte: '{un} lève la main avant le premier coup : « J’abandonne. » Les gradins huent. {deux} gagne sans avoir combattu, et passe le reste de la journée à se demander si c’était un cadeau ou une insulte.', effets: { deux: [{ stat: 'social.reputation', delta: 3 }], un: [{ stat: 'social.reputation', delta: -2 }] }, lien: { deux: { dette: 8, ressentiment: 4 }, un: { loyaute: 4 } }, souvenir: { id: 'finale', texte: 'La finale abandonnée.', poids: 4, tonalite: 'amer' } },
      { cle: 'refuser+refuser', texte: 'Vous refusez tous les deux. L’examinateur hurle, les gradins sifflent, et vous êtes disqualifiés ensemble. Dehors, vous partagez un bol de nouilles en riant comme des idiots. Vous venez de rater une promotion. Ça vous est égal.', effets: { les2: [{ stat: 'social.reputation', delta: -3 }] }, lien: { les2: { loyaute: 10, confiance: 6 } }, accord: 4, souvenir: { id: 'finale', texte: 'La finale que vous avez refusée ensemble.', poids: 5, tonalite: 'chaud' } },
      { cle: 'defaut', texte: 'L’examinateur ne vous laisse pas le choix : « Combattez. »', combat: 'duel_examen' },
    ],
  },

  // ── La tentation (privée) ──
  {
    id: 'mc_heron_tentation',
    titre: 'Une offre au bord de l’eau',
    age: { min: 18, max: 24 },
    privee: (c) => (c.fil.etape === 'aucune' && c.vues.includes('mc_heron_ombre') ? tente(c) : undefined),
    texte: (c) =>
      `Il t’attend au bord de l’étang, debout sur une jambe, comme la première fois. Seul. « Je ne viens pas pour {autre}. Je viens pour toi. » Il parle bas. « Tu vaux plus que ce qu’on te laisse être. Je peux te donner ce qu’ils te refusent : ${
        memeParent(c) ? 'la vérité sur {parent}, toute la vérité, et la force de ne plus jamais avoir besoin de personne' : 'une technique qu’aucun maître de ton village ne t’enseignera, et une place où personne ne te mesurera à {autre}'
      }. En échange, de temps en temps, tu me diras où va {autre}. Rien de plus. » Il pose une plume grise à tes pieds.`,
    choix: [
      { id: 'refuser', texte: 'Refuser, et partir', famille: 'partir' },
      { id: 'accepter', texte: 'Ramasser la plume : accepter', famille: 'agir' },
      { id: 'feindre', texte: 'Accepter, pour le trahir de l’intérieur', famille: 'observer' },
      { id: 'prevenir', texte: 'Refuser, et tout raconter à {autre}', famille: 'proteger' },
    ],
    issues: [
      { cle: 'refuser', texte: 'Tu lui tournes le dos. Derrière toi, sa voix : « L’offre reste. Elle reste toujours. » Tu ne te retournes pas. Mais tu n’en parles à personne.', apres: (c, j) => fait(c, { id: 'offre_refusee', texte: 'Le Héron t’a fait une offre. Tu l’as refusée, et tu l’as gardée pour toi.', connus: [j, 'heron'], preuves: 0, cible: autre(j) }) },
      {
        cle: 'accepter',
        texte: 'Tu ramasses la plume. Elle est froide. Il incline la tête, comme un oiseau. « Bien. » Cette nuit-là, il t’apprend une seule chose : comment cesser d’entendre ta propre peur. Tu dors mieux que depuis des années. C’est ce qui t’effraie le plus.',
        effets: { un: [{ stat: 'attributs.controleEmotionnel', delta: 6 }, { stat: 'attributs.controleChakra', delta: 4 }, { stat: 'social.reputationOmbre', delta: 6 }] },
        apres: (c, j) => {
          c.fil = { etape: 'engage', joueur: j, preuves: 1 };
          fait(c, { id: 'pacte_heron', texte: 'Tu as accepté l’offre du Héron. Tu lui dois des nouvelles de {autre}.', connus: [j, 'heron'], preuves: 1, cible: autre(j) });
          planifierPrivee(c, j, 'mc_heron_mission', 200);
        },
      },
      {
        cle: 'feindre',
        texte: 'Tu ramasses la plume en le regardant droit dans les yeux. Il sait peut-être. Il ne dit rien. Tu as un pied dans son monde, maintenant, et l’autre dans le tien. Il faudra choisir lequel tu retires en premier.',
        apres: (c, j) => {
          c.fil = { etape: 'double', joueur: j, preuves: 1 };
          fait(c, { id: 'pacte_heron', texte: 'Tu fais semblant d’avoir accepté l’offre du Héron.', connus: [j, 'heron'], preuves: 1, cible: autre(j) });
          planifierPrivee(c, j, 'mc_heron_mission', 200);
        },
      },
      {
        cle: 'prevenir',
        texte: 'Tu repars en courant, et tu frappes à la porte de {autre} au milieu de la nuit. Tu racontes tout : l’étang, la plume, l’offre. {autre} t’écoute sans t’interrompre. Puis : « Merci de me l’avoir dit. » Ce sont des mots simples. Tu ne les oublieras pas.',
        apres: (c, j) => {
          fait(c, { id: 'offre_refusee', texte: 'Le Héron a fait une offre, refusée, et racontée à l’autre.', connus: [0, 1, 'heron'], preuves: 0 });
          bouger(c, autre(j), { confiance: 12, loyaute: 6 });
          bouger(c, j, { confiance: 6 });
          souvenir(c, 'offre_racontee', texteCommun(c, 'La nuit où {moi} t’a tout raconté de l’offre du Héron.', j, j), 5, 'chaud');
          planifierCommune(c, 'mc_heron_alerte', 30);
        },
      },
    ],
  },

  // ── La mission du traître (privée) ──
  {
    id: 'mc_heron_mission',
    titre: 'Où va {autre}',
    dynamique: true,
    privee: (c) => (['engage', 'double'].includes(c.fil.etape) ? c.fil.joueur : undefined),
    texte: 'Une plume grise sur ton oreiller, au matin. Un mot, d’une écriture fine : « Dans un mois, {autre} part en mission vers le nord. Je veux l’itinéraire. » Rien d’autre. Tu sais où trouver l’itinéraire ; {autre} l’a laissé sur la table, hier, en te parlant de tout et de rien.',
    choix: [
      { id: 'livrer', texte: 'Recopier l’itinéraire et le lui laisser', famille: 'agir' },
      { id: 'faux', texte: 'Lui laisser un faux itinéraire', famille: 'observer' },
      { id: 'refuser', texte: 'Brûler le mot, et ne plus jamais répondre', famille: 'partir' },
    ],
    issues: [
      {
        cle: 'livrer',
        texte: 'Ta main ne tremble pas en recopiant. C’est ça, le pire. Tu poses le papier sous une pierre, au bord de l’étang, et tu rentres. {autre} te sourit ce soir-là. Tu lui souris aussi.',
        apres: (c, j) => {
          c.fil.preuves += 2;
          fait(c, { id: 'itineraire', texte: 'Tu as livré l’itinéraire de {autre} au Héron.', connus: [j, 'heron'], preuves: 2, cible: autre(j) });
          planifierCommune(c, 'mc_embuscade', 40);
        },
      },
      {
        cle: 'faux',
        texte: 'Tu inventes un itinéraire entier, col par col, et tu le laisses sous la pierre. Si le Héron s’en rend compte, il viendra. S’il ne s’en rend pas compte, ses hommes iront se perdre au sud. Tu viens de choisir ton camp, sans le dire à personne.',
        apres: (c, j) => {
          c.fil.preuves += 1;
          if (c.fil.etape === 'engage') c.fil.etape = 'double';
          fait(c, { id: 'itineraire_faux', texte: 'Tu as donné au Héron un faux itinéraire de {autre}.', connus: [j], preuves: 1 });
        },
      },
      {
        cle: 'refuser',
        texte: 'Tu brûles le mot dans le poêle et tu regardes la plume se tordre dans les flammes. Le lendemain, il y en a une autre sur ton oreiller. Puis plus rien, pendant des mois. Tu sais qu’il n’a pas oublié.',
        apres: (c) => {
          c.fil.etape = 'abandonne';
        },
      },
    ],
  },

  // ── L'alerte (quand l'offre a été racontée) ──
  {
    id: 'mc_heron_alerte',
    titre: 'Un piège pour le Héron',
    dynamique: true,
    texte: 'Depuis la nuit de l’offre, vous ne parlez que de ça. Le Héron attend une réponse à l’étang. Vous pourriez y aller ensemble, et lui tendre un piège.',
    choix: [
      { id: 'piege', texte: 'Tendre le piège, ensemble', famille: 'agir' },
      { id: 'kage', texte: 'Tout dire au {kage}, et laisser l’ANBU faire', famille: 'parler' },
      { id: 'attendre', texte: 'Attendre qu’il fasse le premier pas', famille: 'observer' },
    ],
    issues: [
      { cle: 'piege+piege', texte: 'À l’étang, ce n’est pas le Héron qui vient, mais ses Plumes grises. Il avait compris.', combat: 'embuscade_plumes' },
      { cle: 'kage+kage', texte: 'Le {kage} vous écoute, puis vous fait jurer le silence. Trois semaines plus tard, l’ANBU revient de l’étang avec deux Plumes grises enchaînées. Pas le Héron. Jamais le Héron.', effets: { les2: [{ stat: 'social.reputation', delta: 5 }, { stat: 'social.loyaute', delta: 4 }] }, lien: { les2: { confiance: 4 } }, accord: 2 },
      { cle: 'defaut', texte: 'Vous ne tombez pas d’accord, et le temps passe. Un matin, il n’y a plus de plume à l’étang. Le Héron a changé de plan. Vous ne savez pas lequel.', lien: { les2: { mefiance: 2 } } },
    ],
  },

  // ── L'embuscade (après l'itinéraire livré) ──
  {
    id: 'mc_embuscade',
    titre: 'Ils savaient',
    dynamique: true,
    texte: 'La mission du nord. Au troisième jour, dans une gorge étroite, quatre silhouettes grises tombent des arbres sans un bruit. Elles vous attendaient. Elles savaient exactement par où vous passeriez.',
    textePour: (c, j) => (c.fil.joueur === j && ['engage', 'double'].includes(c.fil.etape) ? 'Tu reconnais la gorge : c’est le passage que tu as recopié, ligne après ligne. Tu as livré {autre} ici.' : ''),
    choix: [
      { id: 'battre', texte: 'Te battre', famille: 'agir' },
      { id: 'couvrir', texte: 'Couvrir {autre}', famille: 'proteger' },
    ],
    issues: [{ cle: 'defaut', texte: 'Pas le temps de réfléchir.', combat: 'embuscade_plumes', apres: (c) => fait(c, { id: 'embuscade', texte: 'Les Plumes grises connaissaient votre itinéraire.', connus: [0, 1], preuves: 0 }) }],
  },

  // ── Les indices ──
  {
    id: 'mc_indices',
    titre: 'Où étais-tu ?',
    age: { min: 20, max: 30 },
    si: (c) => traitre(c) !== undefined && c.fil.preuves > 0,
    texte: 'Une soirée ordinaire, autour d’un bol de thé. {j1} et {j2} parlent de tout et de rien, comme avant. Ou presque comme avant.',
    textePour: (c, j) => {
      const t = traitre(c);
      if (t === undefined) return '';
      if (t === j) return 'Tu sens la plume grise dans ta poche intérieure. Elle ne pèse rien. Tu ne penses qu’à elle.';
      const voit = c.joueurs[j].attributs.perception + c.fil.preuves * 10 >= 55;
      return voit ? 'Il y a de l’encre étrangère sur les doigts de {autre}, une encre grise qu’on ne vend pas au village. Et la semaine dernière, {il:autre} a disparu deux nuits sans rien dire.' : '{autre} a l’air fatigué{e:autre}, ces temps-ci. Tu mets ça sur le compte des missions.';
    },
    choix: [],
    choixPour: (c, j) =>
      traitre(c) === j
        ? [
            { id: 'mentir', texte: 'Mentir : tout va bien', famille: 'parler' },
            { id: 'avouer', texte: 'Tout avouer, maintenant', famille: 'proteger' },
            { id: 'esquiver', texte: 'Changer de sujet', famille: 'partir' },
          ]
        : [
            { id: 'demander', texte: '« Où étais-tu, la semaine dernière ? »', famille: 'agir' },
            { id: 'confiance', texte: 'Ne rien demander : tu lui fais confiance', famille: 'proteger' },
            { id: 'surveiller', texte: 'Ne rien demander, et le suivre la prochaine fois', famille: 'observer' },
          ],
    issues: [
      { cle: 'mentir+demander', texte: '« Où étais-tu ? » « En mission. » {deux} hoche la tête. Le thé refroidit. Ni l’un ni l’autre ne le boit.', lien: { deux: { mefiance: 12, confiance: -8 } }, apres: (c) => (c.fil.preuves += 1) },
      { cle: 'mentir+confiance', texte: 'Tu ne demandes rien. {un} non plus. La soirée est douce. Plus tard, beaucoup plus tard, {deux} se souviendra de cette soirée, et de tout ce qui n’a pas été dit.', lien: { un: { ressentiment: 2 } }, apres: (c, un) => souvenir(c, 'the_douce', 'La soirée du thé, si douce, juste avant.', 4, 'chaud', [autre(un)]) },
      { cle: 'mentir+surveiller', texte: 'Tu ne demandes rien. Trois nuits plus tard, tu suis {un} jusqu’à l’étang, à distance, et tu {le:un} vois poser un papier sous une pierre. Tu attends qu’{il:un} parte. Tu lis le papier.', apres: (c) => planifierCommune(c, 'mc_revelation', 1) },
      { cle: 'esquiver+surveiller', texte: '{un} change de sujet, trop vite. Trois nuits plus tard, tu {le:un} suis jusqu’à l’étang.', apres: (c) => planifierCommune(c, 'mc_revelation', 1) },
      { cle: 'avouer+*', texte: '« Il faut que je te dise quelque chose. » Et {un} dit tout : l’étang, la plume, l’offre, ce qui a été donné. {deux} écoute sans bouger, très pâle.', apres: (c) => planifierCommune(c, 'mc_revelation', 0) },
      { cle: 'defaut', texte: 'La soirée passe. Quelque chose s’est fêlé, très finement, comme une tasse qu’on n’a pas encore vu fuir.', lien: { les2: { mefiance: 4 } } },
    ],
  },

  // ── La révélation ──
  {
    id: 'mc_revelation',
    titre: 'Dis-moi que c’est faux',
    dynamique: true,
    si: (c) => traitre(c) !== undefined,
    texte: '« Dis-moi que c’est faux. » Le papier tremble dans la main de la victime ; l’autre ne tremble pas. « Tu n’aurais pas dû le trouver. » « C’est donc vrai ? » « Tu ne sais pas ce que j’ai dû faire pour arriver jusque-là. » « Et tu n’as même pas pensé à me le dire ? »',
    textePour: (c, j) => (traitre(c) === j ? 'C’est toi qui as trahi. {autre} le sait, maintenant.' : '{autre} t’a trahi{e:moi}. Tu tiens la preuve.'),
    choix: [],
    choixPour: (c, j) =>
      traitre(c) === j
        ? [
            { id: 'avouer', texte: '« C’est vrai. Tout. »', famille: 'parler' },
            { id: 'justifier', texte: '« Je l’ai fait pour nous. »', famille: 'observer' },
            { id: 'fuir', texte: 'Partir, maintenant, et ne plus revenir', famille: 'partir' },
            { id: 'attaquer', texte: 'Frapper le premier', famille: 'agir' },
          ]
        : [
            { id: 'ecouter', texte: 'Écouter jusqu’au bout', famille: 'observer' },
            { id: 'pardonner', texte: 'Pardonner', famille: 'proteger' },
            { id: 'denoncer', texte: 'Le livrer au {kage}', famille: 'parler' },
            { id: 'rompre', texte: 'Partir sans un mot', famille: 'partir' },
            { id: 'frapper', texte: 'Le frapper', famille: 'agir' },
          ],
    issues: [
      { cle: 'attaquer+*', texte: 'Il n’y a plus de mots. Seulement deux ninjas qui se connaissent par cœur, et qui savent tous les deux où frapper.', combat: 'duel_mort', apres: (c) => revele(c) },
      { cle: '*+frapper', texte: 'Ta main part avant ta pensée. Plus de mots : seulement deux ninjas qui se connaissent par cœur.', combat: 'duel_mort', apres: (c) => revele(c) },
      {
        cle: 'avouer+pardonner',
        texte: '{un} dit tout, sans rien arranger. {deux} écoute, puis, très longtemps après : « Je ne te pardonne pas parce que tu le mérites. Je te pardonne parce que je ne sais pas vivre en te haïssant. » Ce n’est pas une fin. C’est un début, plus fragile que tout ce que vous avez construit avant.',
        lien: { deux: { confiance: -10, ressentiment: 10, peur_de_perdre: 10 }, un: { dette: 25, loyaute: 15 } },
        apres: (c) => {
          revele(c);
          c.fil.etape = 'redemption';
          souvenir(c, 'pardon', 'Le pardon, après la trahison. Pas l’oubli.', 5, 'tragique');
        },
      },
      {
        cle: 'avouer+ecouter',
        texte: '{deux} écoute jusqu’au bout. Puis se lève, et dit seulement : « J’ai besoin de temps. » La porte se referme doucement. C’est presque pire qu’un cri.',
        lien: { deux: { confiance: -20, ressentiment: 15 }, un: { peur_de_perdre: 12 } },
        apres: (c) => revele(c),
      },
      {
        cle: '*+denoncer',
        texte: '{deux} ne crie pas. {deux} va au bureau du {kage}, et pose le papier sur le bureau. Le lendemain, l’ANBU vient chercher {un}. {deux} regarde depuis la fenêtre, sans bouger.',
        effets: { un: [{ stat: 'social.reputation', delta: -30 }, { stat: 'social.suspicion', delta: 50 }] },
        lien: { un: { ressentiment: 30, confiance: -30 }, deux: { confiance: -30 } },
        apres: (c, un) => {
          revele(c);
          souvenir(c, 'livre', texteCommun(c, 'Le jour où {deux} a livré {un}.', un), 5, 'tragique');
        },
      },
      {
        cle: 'fuir+*',
        texte: '{un} recule jusqu’à la porte, et s’en va dans la nuit. Au matin, son bandeau est posé sur la table, la plaque rayée d’un trait de kunai. {un} est devenu{e:un} déserteur.',
        effets: { un: [{ statut: 'deserteur' }, { stat: 'social.reputation', delta: -20 }] },
        lien: { deux: { confiance: -25, peur_de_perdre: 15 } },
        apres: (c, un) => {
          revele(c);
          c.fil.etape = 'rallie';
          souvenir(c, 'bandeau_raye', texteCommun(c, 'Le bandeau rayé de {un}, posé sur la table.', un), 5, 'tragique');
        },
      },
      {
        cle: 'defaut',
        texte: 'Les mots ne viennent pas, ou viennent trop mal. Vous vous séparez cette nuit-là sans rien avoir réglé, avec la certitude, de part et d’autre, que rien ne sera plus jamais comme avant.',
        lien: { les2: { confiance: -15, ressentiment: 10 } },
        apres: (c) => revele(c),
      },
    ],
  },

  // ── La passe du nord : un chef, et quelqu'un qui peut désobéir ──
  {
    id: 'mc_passe_nord',
    titre: 'La passe du nord',
    age: { min: 17, max: 26 },
    texte: (c) =>
      `Une mission d’escorte, la neige jusqu’aux genoux. Le chef désigné, c’est ${c.creations[chef(c)].prenom}. Au pied de la passe, des traces fraîches : une dizaine d’hommes, peut-être plus, qui attendent de l’autre côté. Il faut décider.`,
    choix: [],
    choixPour: (c, j) =>
      chef(c) === j
        ? [
            { id: 'forcer', texte: 'Ordonner de forcer la passe', famille: 'agir' },
            { id: 'contourner', texte: 'Ordonner de contourner par la montagne', famille: 'observer' },
          ]
        : [
            { id: 'obeir', texte: 'Obéir', famille: 'proteger' },
            { id: 'desobeir', texte: 'Désobéir et faire à ta façon', famille: 'partir' },
          ],
    issues: [
      { cle: 'forcer+obeir', texte: 'Vous forcez la passe. C’est sanglant, et ça marche. {deux} a suivi l’ordre sans discuter, et {un} ne l’oubliera pas.', effets: { les2: [{ stat: 'social.reputation', delta: 3 }, { blessure: { id: 'passe', nom: 'Entailles de la passe', gravite: 1, jours: 14 } }] }, lien: { un: { confiance: 6, respect: 4 } }, accord: 4 },
      { cle: 'contourner+obeir', texte: 'Deux jours de montagne, les doigts gelés. Mais personne ne meurt. {deux} a râlé toute la montée, et obéi quand même.', effets: { les2: [{ stat: 'social.reputation', delta: 2 }] }, lien: { un: { confiance: 4 } }, accord: 3 },
      {
        cle: 'forcer+desobeir',
        texte: 'Pendant que {un} force la passe, {deux} file seul{e:deux} par le flanc et prend les hommes à revers. Ça sauve la mission. Ça humilie aussi le chef. Au rapport, on demande : « C’est toi qui as ignoré l’ordre à la passe du nord ? »',
        effets: { deux: [{ stat: 'social.reputation', delta: 2 }, { stat: 'social.loyaute', delta: -4 }] },
        lien: { un: { respect: 6, ressentiment: 8 }, deux: { rivalite: 6 } },
        accord: 2,
        souvenir: { id: 'passe_nord', texte: 'La passe du nord, et l’ordre ignoré.', poids: 4, tonalite: 'amer' },
      },
      {
        cle: 'contourner+desobeir',
        texte: '{deux} refuse le détour et part seul{e:deux} vers la passe. {un} doit choisir entre sa mission et l’autre. {un} choisit l’autre, et la caravane attend une journée de trop. Vous rentrez vivants. Au village, on parle de vous à voix basse.',
        effets: { les2: [{ stat: 'social.reputation', delta: -3 }] },
        lien: { un: { peur_de_perdre: 8, ressentiment: 6 }, deux: { dette: 6 } },
        souvenir: { id: 'passe_nord', texte: 'La passe du nord, où l’un a désobéi et l’autre l’a suivi quand même.', poids: 4, tonalite: 'amer' },
      },
      { cle: 'defaut', texte: 'La mission se termine. Pas comme prévu, mais elle se termine.', accord: 2 },
    ],
  },

  // ── Le rang ──
  {
    id: 'mc_rang',
    titre: 'Sous tes ordres',
    age: { min: 19, max: 34 },
    si: (c) => rangIndex(c.joueurs[0].rang) !== rangIndex(c.joueurs[1].rang),
    texte: (c) => `Le {kage} constitue une nouvelle équipe. ${c.creations[superieur(c)].prenom} la dirigera. Sur la liste des membres, le premier nom est celui de ${c.creations[autre(superieur(c))].prenom}.`,
    choix: [],
    choixPour: (c, j) =>
      superieur(c) === j
        ? [
            { id: 'egal', texte: 'Le traiter en égal, devant l’équipe', famille: 'proteger' },
            { id: 'exiger', texte: 'Exiger qu’il obéisse comme les autres', famille: 'agir' },
          ]
        : [
            { id: 'servir', texte: 'Servir, sans rien dire', famille: 'proteger' },
            { id: 'refuser', texte: 'Demander une autre affectation', famille: 'partir' },
            { id: 'defier', texte: '« Prouve-moi que tu mérites ce rang. »', famille: 'agir' },
          ],
    issues: [
      { cle: 'egal+servir', texte: 'Devant l’équipe, {un} demande l’avis de {deux} à chaque décision. Les autres trouvent ça étrange, puis naturel. C’est une bonne équipe.', lien: { deux: { respect: 8, jalousie: -6 }, un: { confiance: 6 } }, accord: 4 },
      { cle: 'exiger+servir', texte: '{deux} obéit. Chaque ordre, sans un mot. C’est parfait, et c’est glacial. Un soir, {un} se rend compte qu’ils ne se sont pas parlé autrement qu’en ordres depuis trois mois.', lien: { deux: { jalousie: 8, ressentiment: 6 }, un: { respect: 3 } } },
      { cle: '*+refuser', texte: '{deux} demande une autre affectation, poliment. On la lui accorde. {un} apprend la nouvelle par un tiers.', lien: { un: { ressentiment: 6, peur_de_perdre: 6 }, deux: { jalousie: 6 } } },
      { cle: '*+defier', texte: '« Prouve-le. » Toute l’équipe se tourne. Il n’y a qu’une façon de répondre à ça.', combat: 'duel_honneur' },
      { cle: 'defaut', texte: 'Vous trouvez un équilibre, bancal, qui tient.', accord: 2 },
    ],
  },

  // ── La guerre : deux villages ──
  {
    id: 'mc_guerre',
    titre: 'Sur le même champ de bataille',
    age: { min: 18, max: 30 },
    si: (c) => c.creations[0].village !== c.creations[1].village,
    texte: 'La guerre entre vos deux villages a éclaté au printemps. Au troisième mois, sur un champ de boue, au milieu des fumées, {j1} et {j2} se retrouvent face à face, chacun avec le bandeau de son village. Autour, personne ne regarde. Personne ne saura.',
    choix: [
      { id: 'combattre', texte: 'Combattre : c’est la guerre', famille: 'agir' },
      { id: 'epargner', texte: 'Baisser ton arme', famille: 'proteger' },
      { id: 'deserter', texte: '« Partons. Tous les deux. Maintenant. »', famille: 'parler' },
      { id: 'livrer', texte: 'Appeler tes camarades, pour qu’ils {le:autre} prennent', famille: 'observer' },
    ],
    issues: [
      { cle: 'combattre+combattre', texte: 'Vous vous saluez d’un signe de tête, comme avant. Puis vous vous battez pour de vrai.', combat: 'duel_mort' },
      { cle: 'epargner+epargner', texte: 'Vos deux armes s’abaissent en même temps. Vous restez là une seconde, au milieu de la guerre, à vous regarder. Puis chacun repart vers les siens, sans se retourner. Personne n’a rien vu. Vous, si.', lien: { les2: { loyaute: 12, peur_de_perdre: 10 } }, accord: 3, souvenir: { id: 'guerre', texte: 'Le champ de boue, où vos armes se sont abaissées en même temps.', poids: 5, tonalite: 'chaud' } },
      { cle: 'deserter+deserter', texte: 'Vous partez sans un mot, chacun arrachant son bandeau, et vous disparaissez dans la fumée. Deux villages vous chercheront. Vous serez ensemble.', effets: { les2: [{ statut: 'deserteur' }, { stat: 'social.reputation', delta: -15 }] }, lien: { les2: { loyaute: 20, confiance: 15, dependance: 10 } }, accord: 8, souvenir: { id: 'guerre', texte: 'Le jour où vous avez déserté ensemble.', poids: 5, tonalite: 'fier' } },
      { cle: 'livrer+epargner', texte: '{deux} baisse son arme. {un} appelle ses camarades. {deux} est pris{e:deux}, et regarde {un} pendant qu’on l’emmène, sans colère, ce qui est le plus insupportable.', effets: { deux: [{ statut: 'capture' }], un: [{ stat: 'social.reputation', delta: 6 }] }, lien: { deux: { confiance: -40, ressentiment: 35 }, un: { dette: 10 } }, souvenir: { id: 'guerre', texte: 'Le champ de boue, où l’un a livré l’autre.', poids: 5, tonalite: 'tragique' }, apres: (c) => rompre(c) },
      { cle: 'conflit', texte: 'Vous hésitez, chacun d’un côté de la boue. Une explosion vous sépare. Quand la fumée retombe, l’autre a disparu.', lien: { les2: { peur_de_perdre: 8 } } },
      { cle: 'defaut', texte: 'La bataille vous emporte chacun de votre côté avant que vous ayez décidé. Vous ne savez pas si l’autre a survécu, et vous ne le saurez pas avant longtemps.', lien: { les2: { peur_de_perdre: 10 } } },
    ],
  },

  // ── Le Héron, la dernière fois ──
  {
    id: 'mc_heron_final',
    titre: 'Le vol du héron',
    age: { min: 26, max: 40 },
    si: (c) => c.vues.includes('mc_heron_ombre'),
    texte: 'Une nuit sans lune, le Héron entre dans le village. Il ne se cache plus. Il marche au milieu de la grand-rue, sur une jambe à chaque pas, et les lanternes s’éteignent une à une sur son passage. Il s’arrête devant vous deux. « J’ai attendu longtemps. »',
    textePour: (c, j) => (traitre(c) === j && c.fil.etape !== 'redemption' ? 'Il te regarde, toi, et il sourit sous le masque. « Tu sais ce que tu me dois. Choisis ton camp, maintenant. »' : ''),
    choix: [],
    choixPour: (c, j) =>
      traitre(c) === j && c.fil.etape !== 'redemption'
        ? [
            { id: 'rallier', texte: 'Te ranger à ses côtés', famille: 'agir' },
            { id: 'trahir', texte: 'Te retourner contre lui', famille: 'proteger' },
          ]
        : [
            { id: 'combattre', texte: 'Le combattre', famille: 'agir' },
            { id: 'couvrir', texte: 'Couvrir {autre}', famille: 'proteger' },
          ],
    issues: [
      { cle: 'rallier+*', texte: '{un} fait un pas, puis deux, et se place à côté du Héron. Le Héron pose une main sur son épaule. {deux} est seul{e:deux} dans la grand-rue, face à celui ou celle qu’il connaît depuis toujours.', combat: 'duel_mort', apres: (c) => ((c.fil.etape = 'rallie'), revele(c)) },
      {
        cle: 'trahir+*',
        texte: 'Le Héron tend la main vers {un}. {un} la repousse, et se met en garde à côté de {deux}. « Je ne te dois plus rien. » Sous le masque, quelque chose comme un rire. « Alors venez. Tous les deux. »',
        lien: { deux: { confiance: 10, respect: 10 }, un: { loyaute: 10 } },
        combat: 'heron_final',
        apres: (c) => {
          c.fil.etape = 'redemption';
          revele(c);
        },
      },
      { cle: 'defaut', texte: '« Ensemble », dit l’un. « Ensemble », répond l’autre.', combat: 'heron_final' },
    ],
  },

  // ── Le nom ──
  {
    id: 'mc_parrain',
    titre: 'Un nom à donner',
    age: { min: 28, max: 40 },
    texte: 'Un soir de printemps, l’un de vous deux arrive avec une nouvelle : un enfant va naître, dans sa famille. « Je voudrais que tu sois là. Que tu veilles sur lui, si un jour je ne peux plus. »',
    choix: [
      { id: 'jurer', texte: 'Jurer de veiller sur l’enfant', famille: 'proteger' },
      { id: 'nom', texte: 'Proposer de lui donner le nom de quelqu’un que vous avez perdu', famille: 'parler' },
      { id: 'refuser', texte: '« Je ne suis pas quelqu’un à qui on confie un enfant. »', famille: 'partir' },
    ],
    issues: [
      { cle: 'jurer+jurer', texte: 'Vous le jurez tous les deux, l’un à l’autre, comme deux enfants sur un toit. Vingt ans ont passé. Rien n’a changé. Tout a changé.', lien: { les2: { loyaute: 10, confiance: 6 } }, promesse: { id: 'enfant', texte: 'Veiller sur l’enfant de l’autre, si un jour il ne peut plus.' }, souvenir: { id: 'parrain', texte: 'Le serment pour l’enfant à naître.', poids: 4, tonalite: 'chaud' } },
      { cle: 'famille:partir+proteger', texte: '« Je ne suis pas quelqu’un à qui on confie un enfant. » « C’est justement pour ça que je te le demande. » Le silence dure longtemps. Puis : « D’accord. »', lien: { un: { dette: 6 }, deux: { confiance: 6 } }, promesse: { id: 'enfant', texte: 'Veiller sur l’enfant de l’autre, si un jour il ne peut plus.' } },
      { cle: 'defaut', texte: 'L’enfant naît en hiver. Il a, dit-on, quelque chose de vous deux dans le regard. C’est impossible, et tout le monde le dit quand même.', lien: { les2: { confiance: 4 } } },
    ],
  },

  // ── Ce qu'on laisse ──
  {
    id: 'mc_epilogue',
    titre: 'Ce qu’on laisse',
    age: { min: 45 },
    texte: (c) => {
      const plus = [...c.lien.souvenirs].sort((a, b) => b.poids - a.poids || b.jour - a.jour)[0];
      return `Les années ont passé. {j1} et {j2} sont assis sur le même toit qu’autrefois, plus lentement montés, les genoux moins sûrs. En bas, des enfants courent vers l’Académie. ${plus ? `L’un de vous dit : « Tu te souviens ? » Et il n’a pas besoin de dire de quoi. ${plus.texte}` : ''} ${c.lien.promesses.length ? `Vous parlez des promesses : ${c.lien.promesses.map((p) => `« ${p.texte} »${p.etat === 'rompue' ? ', rompue' : ''}`).join(' ; ')}.` : ''}`;
    },
    choix: [
      { id: 'merci', texte: 'Dire « merci », enfin', famille: 'proteger' },
      { id: 'pardon', texte: 'Demander pardon, pour une chose précise', famille: 'parler' },
      { id: 'silence', texte: 'Ne rien dire : l’autre sait', famille: 'observer' },
      { id: 'defi', texte: '« Un dernier duel ? »', famille: 'agir' },
    ],
    issues: [
      { cle: 'defi+defi', texte: 'Vous vous relevez, en grimaçant, et vous vous mettez en garde au milieu du toit. Les tuiles craquent. Vous riez avant le premier coup.', combat: 'duel_entrainement', apres: (c) => tenir(c) },
      { cle: 'silence+silence', texte: 'Vous ne dites rien. Le soleil descend. C’est la plus longue conversation de votre vie.', lien: { les2: { confiance: 5 } }, apres: (c) => tenir(c), souvenir: { id: 'toit_fin', texte: 'Le dernier soir sur le toit.', poids: 5, tonalite: 'chaud' } },
      { cle: 'merci+merci', texte: '« Merci. » « Merci. » Vous l’avez dit en même temps, et vous vous en moquez pendant une heure. Puis vous ne vous en moquez plus.', lien: { les2: { confiance: 6 } }, apres: (c) => tenir(c), souvenir: { id: 'toit_fin', texte: 'Les deux « merci », sur le toit.', poids: 5, tonalite: 'chaud' } },
      { cle: 'defaut', texte: 'Vous dites ce que vous avez à dire, chacun à sa façon. Il était temps. Il n’était pas trop tard.', lien: { les2: { ressentiment: -10 } }, apres: (c) => tenir(c), souvenir: { id: 'toit_fin', texte: 'Le dernier soir sur le toit, et ce qui a enfin été dit.', poids: 5, tonalite: 'chaud' } },
    ],
  },

  // ── Les seuils du lien (ouverts par le moteur, une seule fois) ──
  {
    id: 'mc_jalousie',
    titre: 'Tout ce que tu as',
    dynamique: true,
    texte: 'Ça arrive un soir, pour rien : un mot de trop, un compliment fait à l’un devant l’autre. « Tu as tout, toi. Le talent, les regards, la chance. Et moi je cours derrière depuis vingt ans. »',
    choix: [
      { id: 'ecouter', texte: 'Écouter, sans te défendre', famille: 'observer' },
      { id: 'repondre', texte: 'Lui dire ce que ça t’a coûté', famille: 'parler' },
      { id: 'duel', texte: '« Alors viens me le prendre. »', famille: 'agir' },
    ],
    issues: [
      { cle: 'duel+*', texte: 'Il n’y a qu’une façon de régler ça.', combat: 'duel_honneur', lien: { les2: { jalousie: -15 } } },
      { cle: 'ecouter+ecouter', texte: 'Vous vous écoutez, chacun à son tour. À la fin, la jalousie est toujours là. Mais elle a un nom, maintenant, et vous pouvez en rire.', lien: { les2: { jalousie: -25, confiance: 8 } } },
      { cle: 'defaut', texte: 'Les mots sortent, durs, et certains ne pourront pas être repris. Mais ils sont sortis.', lien: { les2: { jalousie: -15, ressentiment: 6 } } },
    ],
  },
  {
    id: 'mc_croire',
    titre: 'Je ne te crois plus',
    dynamique: true,
    texte: '« Je ne te crois plus. Plus un mot de ce que tu dis. » Un silence. « Mais je ne t’abandonnerai pas. Ne me demande pas pourquoi. Je ne sais pas. »',
    choix: [
      { id: 'prouver', texte: '« Laisse-moi te prouver que tu as tort. »', famille: 'agir' },
      { id: 'accepter', texte: '« Ça me suffit. »', famille: 'proteger' },
      { id: 'partir', texte: 'Partir, pour ne pas lui faire plus de mal', famille: 'partir' },
    ],
    issues: [
      { cle: 'accepter+accepter', texte: 'Ça vous suffit, à tous les deux. Ça ne devrait pas. Ça vous suffit quand même.', lien: { les2: { loyaute: 8, confiance: 6 } } },
      { cle: 'defaut', texte: 'Vous restez côte à côte, sans vous croire, sans vous quitter. C’est une façon de s’aimer, peut-être la plus têtue.', lien: { les2: { confiance: 5, loyaute: 4 } } },
    ],
  },
  {
    id: 'mc_honneur',
    titre: 'Un duel d’honneur',
    dynamique: true,
    texte: 'Vous êtes devenus les deux meilleurs de votre génération, et tout le monde le sait. Un jour, l’un de vous pose son gant sur la table de l’autre, comme dans les vieilles histoires. Pas de haine. Seulement la question qui attend depuis l’enfance.',
    choix: [
      { id: 'accepter', texte: 'Ramasser le gant', famille: 'agir' },
      { id: 'refuser', texte: '« Je n’ai pas besoin de savoir. »', famille: 'proteger' },
    ],
    issues: [
      { cle: 'accepter+accepter', texte: 'Au vieux terrain de l’Académie, à l’aube. Sans témoins.', combat: 'duel_honneur' },
      { cle: 'defaut', texte: 'Le gant reste sur la table. Peut-être que c’est une réponse, après tout.', lien: { les2: { rivalite: -8, respect: 4 } } },
    ],
  },

  // ── Les deuils de famille (frères et sœurs) ──
  {
    id: 'mc_deuil_parent',
    titre: 'La maison vide',
    dynamique: true,
    texte: 'La maison de {parent} est silencieuse. Vous êtes revenus tous les deux pour ranger ses affaires, et vous ne rangez rien. Sur la table, la boîte de la plume grise. Vide.',
    choix: [
      { id: 'pleurer', texte: 'Pleurer enfin, devant l’autre', famille: 'proteger' },
      { id: 'tenir', texte: 'Tenir bon, pour l’autre', famille: 'observer' },
      { id: 'venger', texte: '« Je trouverai qui a fait ça. »', famille: 'agir' },
    ],
    issues: [
      { cle: 'pleurer+pleurer', texte: 'Vous pleurez tous les deux, assis par terre, adossés au même mur. Comme la nuit où vous l’attendiez devant la porte, sauf que cette fois, personne ne rentrera.', lien: { les2: { peur_de_perdre: 12, confiance: 8, dependance: 8 } }, souvenir: { id: 'deuil', texte: 'La maison vide, et vos deux dos contre le même mur.', poids: 5, tonalite: 'tragique' } },
      { cle: 'venger+*', texte: '{un} se lève. « Je trouverai qui a fait ça. » {deux} ne {le:un} retient pas.', lien: { un: { peur_de_perdre: 8 } }, souvenir: { id: 'deuil', texte: 'Le serment de vengeance, dans la maison vide.', poids: 5, tonalite: 'tragique' } },
      { cle: 'defaut', texte: 'Chacun porte ça à sa façon. Vous fermez la maison ensemble, et vous gardez chacun une clé.', lien: { les2: { peur_de_perdre: 8 } }, souvenir: { id: 'deuil', texte: 'Les deux clés de la maison vide.', poids: 5, tonalite: 'tragique' } },
    ],
  },
  {
    id: 'mc_deuil_aine',
    titre: 'Ce qu’{aine} aurait voulu',
    dynamique: true,
    texte: 'On a ramené {aine} enveloppé{e:aine} dans un manteau. Vous étiez ses cadets ; {il:aine} vous a protégés toute sa vie. Maintenant, il n’y a plus personne devant vous. Seulement l’un à côté de l’autre.',
    choix: [
      { id: 'promettre', texte: 'Promettre de prendre sa place, l’un pour l’autre', famille: 'proteger' },
      { id: 'silence', texte: 'Ne rien dire', famille: 'observer' },
    ],
    issues: [
      { cle: 'promettre+promettre', texte: 'Vous le promettez sur sa tombe : désormais, chacun sera l’aîné de l’autre.', lien: { les2: { loyaute: 12 } }, promesse: { id: 'aine', texte: 'Être l’aîné de l’autre, désormais.' }, souvenir: { id: 'aine', texte: 'La promesse sur la tombe d’{aine}.', poids: 5, tonalite: 'tragique' } },
      { cle: 'defaut', texte: 'Le silence est assez grand pour vous deux.', lien: { les2: { peur_de_perdre: 10 } }, souvenir: { id: 'aine', texte: 'Le silence sur la tombe d’{aine}.', poids: 5, tonalite: 'tragique' } },
    ],
  },

  // ── Ce qui revient (le mort qui a choisi le retour) ──
  {
    id: 'mc_retour',
    titre: 'Un visage qu’on a enterré',
    dynamique: true,
    texte: 'Une technique interdite, un rouleau volé, un nécromancien qu’on n’attrapera jamais. Sur la place, sous la pluie, se tient quelqu’un que tout le monde a enterré. La peau craquelée comme une vieille poterie. Les yeux noirs. Et pourtant, c’est bien lui. C’est bien elle.',
    textePour: (c, j) => (c.joueurs[j].statut === 'mort' ? 'Tu es revenu·e. Pas par ta volonté. Ton corps marche vers {autre}, et ce n’est pas toi qui le fais marcher. Tu peux encore, peut-être, résister.' : 'C’est {autre}. Ce n’est plus {autre}. Son corps vient vers toi.'),
    choix: [],
    choixPour: (c, j) =>
      c.joueurs[j].statut === 'mort'
        ? [
            { id: 'resister', texte: 'Résister de toutes tes forces', famille: 'proteger' },
            { id: 'supplier', texte: '« Arrête-moi. Je t’en supplie. »', famille: 'parler' },
          ]
        : [
            { id: 'combattre', texte: 'Le combattre, pour le libérer', famille: 'agir' },
            { id: 'parler', texte: 'Lui parler, comme avant', famille: 'parler' },
          ],
    issues: [
      { cle: 'resister+parler', texte: 'Ta voix le trouve, quelque part au fond. Le corps s’arrête à un pas. « Je suis là », dit-il, avec sa vraie voix, une dernière fois. Puis il tombe en poussière, et la pluie l’emporte.', lien: { les2: { peur_de_perdre: -20 } }, souvenir: { id: 'retour', texte: 'La dernière phrase, revenue de l’autre côté.', poids: 5, tonalite: 'tragique' } },
      { cle: 'defaut', texte: 'Le corps attaque. Il n’y a qu’une façon de le libérer.', combat: 'combat_ombre' },
    ],
  },

  // ── L'héritier ──
  {
    id: 'mc_heritier',
    titre: 'Le même regard',
    dynamique: true,
    texte: 'Un enfant se présente à ta porte, un bandeau trop grand sur le front. « On m’a dit que vous l’aviez connu. Que vous étiez son… » Il cherche le mot. Il a le même regard. C’est insupportable, et c’est un cadeau.',
    choix: [
      { id: 'accueillir', texte: 'L’accueillir', famille: 'proteger' },
      { id: 'raconter', texte: 'Lui raconter qui c’était', famille: 'parler' },
      { id: 'distance', texte: 'Garder tes distances', famille: 'partir' },
    ],
    issues: [
      { cle: 'defaut', texte: 'Vous parlez longtemps, de celui ou celle qui n’est plus là. L’enfant écoute tout, les yeux grands ouverts. Une histoire recommence, autrement.', lien: { les2: { confiance: 10, loyaute: 6 } }, souvenir: { id: 'heritier', texte: 'Le jour où l’héritier a frappé à la porte.', poids: 5, tonalite: 'chaud' } },
    ],
  },
];

/** La trahison découverte : elle est connue des deux, les promesses de fidélité tombent, les souvenirs se recolorent. */
function revele(c: Campagne): void {
  if (c.fil.joueur === undefined) return;
  for (const f of c.faits) if (f.connus.includes(c.fil.joueur) && f.cible === autre(c.fil.joueur) && !f.connus.includes(autre(c.fil.joueur))) f.connus.push(autre(c.fil.joueur));
  if (['engage', 'double', 'abandonne'].includes(c.fil.etape)) c.fil.etape = 'revele';
  rompre(c);
}

/** À la fin, les promesses encore debout ont été tenues. */
function tenir(c: Campagne): void {
  for (const p of c.lien.promesses) if (p.etat === 'en_cours') p.etat = 'tenue';
  noter(c, 0, 'Les promesses que vous aviez faites, et qui ont tenu, sont tenues.');
  noter(c, 1, 'Les promesses que vous aviez faites, et qui ont tenu, sont tenues.');
}

const RANGS = ['eleve', 'genin', 'chunin', 'jonin', 'kage'];
const rangIndex = (r: string) => RANGS.indexOf(r);
/** Le chef d'une mission : le plus haut rang, sinon le plus âgé, sinon J1. */
function chef(c: Campagne): IdJoueur {
  const [a, b] = c.joueurs;
  if (rangIndex(a.rang) !== rangIndex(b.rang)) return rangIndex(a.rang) > rangIndex(b.rang) ? 0 : 1;
  return a.naissance <= b.naissance ? 0 : 1;
}
const superieur = (c: Campagne): IdJoueur => (rangIndex(c.joueurs[0].rang) >= rangIndex(c.joueurs[1].rang) ? 0 : 1);

export { ageA, jourMonde };
