import type { ContenuRacine } from '../../engine/combat/types';

/**
 * Des récits de plus pour chaque issue : un combat ne doit jamais se raconter deux fois pareil.
 * Ils s'ajoutent à ceux de lignes.ts (même clés, mêmes jetons : {il}, {Il}, {lui}, {e}, {tech}, {nom}).
 */
export const RECITS_SUPP: ContenuRacine['recits'] = {
  'exec:parfaite': ['Tu ne penses plus : ton corps fait exactement ce qu’il faut, une fraction de seconde avant toi.', 'Chaque muscle à sa place. Tu sens la technique partir comme une flèche bien tendue.'],
  'exec:reussie': ['Ton souffle suit ton geste, sans un temps mort.', 'Tes appuis tiennent. Le reste suit.'],
  'exec:instable': ['Ta main gauche est en retard d’un battement : la moitié de ta force reste en route.', 'Tu sens le geste se tordre en chemin, et tu le finis quand même.'],

  'taijutsu:touche': ['Ton genou remonte dans ses côtes. {Il} perd son souffle d’un coup.', 'Ton talon trouve sa cuisse ; {il} plie la jambe et grimace.', 'Tu attrapes son poignet, tu tires, et ton coude lui rencontre la mâchoire.'],
  'taijutsu:surprise': ['Tu feins à gauche, tu frappes à droite. {Il} tourne la tête trop tard.', 'Tu tombes au sol exprès et tu le fauches d’un balayage. {Il} ne l’avait pas prévu.'],
  'taijutsu:predite': ['{Il} recule d’un demi-pas exactement. Ton pied passe sous son menton sans le toucher.', '{Il} attrape ton poing au vol, le tord, et te repousse.'],
  'taijutsu:annulee': ['Vos tibias se rencontrent avec un claquement sec. Vous reculez en même temps, en boitant.', 'Coude contre coude. Le choc vous remonte jusqu’aux épaules.'],
  'taijutsu:dominee': ['{Il} pare ton coup et pousse : tu recules de trois pas sans comprendre comment.', 'Ton coup arrive, mais {il} est plus lourd{e}. Tu rebondis sur sa garde.'],
  'taijutsu:ecrasee': ['{Il} prend ton coup sur l’épaule sans broncher, et te rend le sien en pleine figure.', 'Tu frappes, et c’est comme frapper un mur. Le mur, lui, frappe en retour.'],
  'taijutsu:decisive': ['Ton poing part de tes talons et finit dans son plexus. {Il} se plie, et ne se relève pas.', 'Une feinte, une deuxième, puis le vrai coup, à la tempe. {Il} tombe comme une marionnette dont on a coupé les fils.'],

  'ninjutsu:touche': ['{tech} l’atteint au moment où {il} pose le pied. {Il} vacille.', '{tech} lui arrache un cri qu’{il} ravale aussitôt.'],
  'ninjutsu:surprise': ['{tech} sort par un angle qu’{il} ne surveillait pas.', 'Tu composes les signes derrière ton dos ; {tech} part avant qu’{il} voie tes mains.'],
  'ninjutsu:predite': ['{Il} ferme les yeux et se déplace au son : {tech} passe là où {il} n’est plus.', '{Il} avait vu ton premier signe. Le reste ne servait à rien.'],
  'ninjutsu:annulee': ['Les deux techniques se rencontrent et se défont dans un nuage de chakra qui pique les yeux.'],
  'ninjutsu:dominee': ['{tech} part bien. Sa technique part mieux, et la tienne se brise contre.'],
  'ninjutsu:ecrasee': ['Sa technique avale la tienne et continue sa course vers toi.'],
  'ninjutsu:decisive': ['{tech} le prend de plein fouet, au seul endroit qu’{il} ne protégeait plus. {Il} ne se relève pas.'],

  'katon:touche': ['Les flammes lui lèchent les jambes ; {il} saute en arrière, son pantalon fumant.', 'Le feu prend dans ses cheveux. {Il} l’étouffe à pleines mains, en jurant.'],
  'katon:surprise': ['Le feu sort d’entre tes doigts au lieu de ta bouche. {Il} ne regardait pas tes mains.'],
  'katon:predite': ['{Il} plonge dans la poussière : ton feu roule au-dessus de son dos.', 'Une bûche roussie, à l’endroit où {il} était. {Il} est déjà ailleurs.'],
  'katon:dominee': ['Ton feu heurte sa technique et se recourbe vers le ciel, inutile.'],
  'katon:ecrasee': ['Sa technique traverse ton feu et le rabat sur toi : tu sens tes propres flammes te brûler les sourcils.'],
  'katon:decisive': ['Le feu le prend tout entier. Quand il retombe, {il} est à genoux, et ne bouge plus.'],
  'suiton:touche': ['L’eau le frappe au visage. {Il} recule, aveuglé{e}, en crachant.', 'Le jet lui emporte les jambes ; {il} s’étale dans la boue.'],
  'suiton:surprise': ['L’eau jaillit du sol sous ses pieds, au lieu de partir de ta bouche. {Il} est projeté{e} en l’air.'],
  'suiton:dominee': ['Ton eau s’écrase contre sa technique et retombe en pluie fine, inutile.'],
  'suiton:ecrasee': ['Sa technique fend ton eau en deux et passe au milieu, droit sur toi.'],
  'suiton:decisive': ['L’eau l’emporte, le roule, et le dépose contre un rocher. {Il} ne se relève pas.'],
  'fuuton:touche': ['Le vent lui ouvre les avant-bras en fines lignes rouges.', 'La rafale le soulève et le laisse retomber sur le dos.'],
  'fuuton:surprise': ['Le vent part de tes pieds, au ras du sol : {il} perd l’équilibre avant de comprendre.'],
  'fuuton:dominee': ['Ton vent se brise sur sa technique comme une vague sur une digue.'],
  'fuuton:ecrasee': ['Sa technique avale ton vent et le retourne contre toi.'],
  'fuuton:decisive': ['La lame de vent passe sous sa garde. {Il} regarde la ligne rouge sur son ventre, puis tombe.'],
  'raiton:touche': ['La foudre le traverse ; ses dents claquent, ses doigts s’ouvrent tout seuls.', 'L’éclair lui court sur le bras ; {il} lâche son arme en criant.'],
  'raiton:surprise': ['La foudre part du kunai que tu as planté dans le sol il y a deux manches. {Il} l’avait oublié.'],
  'raiton:dominee': ['Ta foudre heurte sa technique et se disperse en étincelles inutiles.'],
  'raiton:ecrasee': ['Sa technique absorbe ta foudre et te la renvoie dans les jambes.'],
  'raiton:decisive': ['La foudre lui traverse le cœur. {Il} tombe raide, comme une planche.'],
  'doton:touche': ['La terre lui avale une cheville ; {il} tire dessus en grimaçant.', 'Un pilier de roche le cueille sous le menton.'],
  'doton:surprise': ['Le sol se dérobe sous lui au moment même où {il} allait sauter.'],
  'doton:dominee': ['Ta roche se fend contre sa technique et s’effondre en gravier.'],
  'doton:ecrasee': ['Sa technique pulvérise ton mur et les éclats te criblent.'],
  'doton:decisive': ['La terre se referme sur lui jusqu’à la poitrine. {Il} ne peut plus bouger, et {il} le sait.'],

  'adv:touche': ['Un genou dans tes côtes ; l’air sort d’un coup.', 'Ses phalanges trouvent ta pommette. Le monde tangue.', 'Un coup de pied fauche ta jambe d’appui.', 'Son coude rencontre ta tempe ; un sifflement emplit tes oreilles.'],

  'defense:garde:ok': ['Tu restes en garde, ramassé·e. {Il} tourne autour de toi sans trouver d’ouverture.'],
  'defense:garde:ko': ['Ta garde tient, mais tes avant-bras deviennent violets.'],
  'defense:esquive:ok': ['Tu te jettes au sol et roules : son coup fend l’air au-dessus de toi.', 'Tu pivotes sur un talon : son attaque passe, et son flanc est à toi.'],
  'defense:esquive:ko': ['Ton pied glisse au moment de bondir. Tu prends le coup en pleine course.'],
  'defense:permutation:ok': ['Une bûche explose sous son coup. Toi, tu es déjà sur la branche au-dessus de {lui}.'],
  'observation:observer:ok': ['Tu le regardes respirer. Juste avant de frapper, {il} retient son souffle. Maintenant, tu le sais.'],
  'observation:observer:ko': ['Tu cherches la faille. {Il} n’en montre aucune. Pas encore.'],
  'parole:provoquer:ok': ['Tu lui dis ce que tout le monde pense tout bas. Ses jointures blanchissent sur son arme.'],
  'parole:provoquer:ko': ['Tes mots tombent à côté. {Il} sourit presque.'],
  'fuite:fuir:ok': ['Un fumigène, un saut, et tu n’es plus qu’un bruit de feuilles qui s’éloigne.'],
  'fuite:fuir:ko': ['Tu te retournes pour courir, et {il} est déjà devant toi.'],

  // Les fins d'un combat où l'on peut mourir : personne pour vous séparer.
  'fin:departage_gagne:letal': ['{nom} recule, une main sur sa blessure, et disparaît entre les arbres. {Il} n’a plus envie de mourir aujourd’hui.', 'Vous vous arrêtez tous les deux, haletants. C’est {nom} qui détourne les yeux le premier, puis qui s’en va.'],
  'fin:departage_perdu:letal': ['Tu n’as plus la force de lever les bras. {nom} te regarde longtemps, puis décide que tu ne vaux pas la peine d’être achevé·e.', 'Tu recules, encore et encore. {nom} te laisse partir, parce qu’{il} le peut.'],
  'fin:departage_nul:letal': ['Ni l’un ni l’autre ne peut continuer. Vous vous séparez sans un mot, chacun gardant un œil sur le dos de l’autre.'],
  'fin:victoire:letal': ['{nom} ne se relève pas. Tu restes debout au-dessus de {lui} longtemps, jusqu’à ce que tes mains arrêtent de trembler.'],
};
