import type { ContenuRacine, Replique } from '../../engine/combat/types';

/**
 * Les adversaires sans fiche propre : une voix, des annonces et des fins selon ce qu'ils sont.
 * Une bête ne parle pas : ses « répliques » sont des gestes (préfixe « ~ », affichés sans guillemets).
 * Un groupe parle par la voix de son chef. {il}, {Il}, {lui}, {e} s'accordent à l'adversaire ; {nom} est son nom.
 */
export type TypeAdversaire = 'ninja' | 'bete' | 'bandit' | 'eleve' | 'samourai' | 'mercenaire' | 'arene';

const R = (id: string, categorie: Replique['categorie'], texte: string): Replique => ({ id, categorie, texte });

/** Les combats dont on sait contre quoi on se bat : nom, genre, nature de l'adversaire. */
export const ADVERSAIRES_SCENES: Record<string, { type: TypeAdversaire; nom: string; genre: 'm' | 'f' }> = {
  'cl_senju_ours/tenir': { type: 'bete', nom: 'L’ours', genre: 'm' },
  'mg_sanglier/combat': { type: 'bete', nom: 'Le sanglier', genre: 'm' },
  'mg_meute/combat': { type: 'bete', nom: 'La meute', genre: 'f' },
  'vf_chien/intercepter': { type: 'bete', nom: 'Le chien enragé', genre: 'm' },
  'cl_inuzuka_traque/frenesie': { type: 'bandit', nom: 'Le voleur', genre: 'm' },
  'a_intimidation/intervenir': { type: 'eleve', nom: 'La bande des grands', genre: 'f' },
  'vf_racket/foncer': { type: 'eleve', nom: 'La bande des grands', genre: 'f' },
  'e_arene/sang': { type: 'arene', nom: 'Le combattant de la fosse', genre: 'm' },
  'e_arene/mort': { type: 'arene', nom: 'Le combattant de la fosse', genre: 'm' },
  'c2_tournoi/frontal': { type: 'ninja', nom: 'Ton adversaire du tournoi', genre: 'm' },
  'c2_tournoi/pouvoir': { type: 'ninja', nom: 'Ton adversaire du tournoi', genre: 'm' },
  'sn_orochimaru/attaquer': { type: 'ninja', nom: 'Orochimaru', genre: 'm' },
  'mc_caravane/eau': { type: 'bandit', nom: 'La bande de pillards', genre: 'f' },
  'mg_bateau/combat': { type: 'bandit', nom: 'L’équipage', genre: 'm' },
  'md_marchand/combat': { type: 'bandit', nom: 'La bande de la route', genre: 'f' },
};

/** Les mots qui trahissent l'adversaire, lus dans le titre, le choix, la cause de mort et le début de la scène. */
export const INDICES_TYPE: [TypeAdversaire, RegExp][] = [
  ['bete', /\b(sanglier|ours|loups?|meute|chien enragé|fauve|bête sauvage)\b/i],
  ['samourai', /samoura/i],
  ['mercenaire', /\b(mercenaires?|assassins?|tueurs? à gages)\b/i],
  ['bandit', /\b(bandits?|brigands?|pillards?|voleurs?|truands?|malfrats?|contrebandiers?|pirates?)\b/i],
  ['eleve', /\b(élèves?|camarades?|Académie)\b/i],
];

/** Le nom d'un adversaire sans nom, selon ce qu'il est et s'il est seul ou en groupe. */
export const NOMS_TYPE: Record<TypeAdversaire, { seul: [string, 'm' | 'f']; groupe: [string, 'm' | 'f'] }> = {
  ninja: { seul: ['Le ninja ennemi', 'm'], groupe: ['L’escouade', 'f'] },
  bete: { seul: ['La bête', 'f'], groupe: ['La meute', 'f'] },
  bandit: { seul: ['Le bandit', 'm'], groupe: ['La bande', 'f'] },
  eleve: { seul: ['Ton adversaire', 'm'], groupe: ['La bande', 'f'] },
  samourai: { seul: ['Le samouraï', 'm'], groupe: ['La garde samouraï', 'f'] },
  mercenaire: { seul: ['Le mercenaire', 'm'], groupe: ['Les mercenaires', 'm'] },
  arene: { seul: ['Le combattant', 'm'], groupe: ['Les combattants', 'm'] },
};

export const REPLIQUES_TYPE: Record<TypeAdversaire, { seul: Replique[]; groupe: Replique[] }> = {
  ninja: {
    seul: [
      R('n_entree_1', 'entree', 'Je ne te connais pas. Ça ne change rien.'),
      R('n_entree_2', 'entree', 'Tu aurais dû faire demi-tour.'),
      R('n_entree_3', 'entree', 'Un de plus. Allons-y.'),
      R('n_reussite_1', 'reussite_joueur', 'Pas mal. Ça ne se reproduira pas.'),
      R('n_reussite_2', 'reussite_joueur', 'Tch. Tu es plus rapide que tu n’en as l’air.'),
      R('n_rate_1', 'rate_joueur', 'C’est tout ?'),
      R('n_rate_2', 'rate_joueur', 'Tes mains tremblent. Je le vois d’ici.'),
      R('n_blessure_1', 'blessure', 'Tu vas payer ça.'),
      R('n_blessure_2', 'blessure', 'Ça… ça fait mal. Bien. Maintenant je suis réveillé.'),
      R('n_imminente_1', 'defaite_imminente', 'Pas comme ça… pas contre toi.'),
      R('n_decouverte_1', 'decouverte', 'Qu’est-ce que c’était, ça ?'),
      R('n_parade_1', 'parade', 'Trop lent.'),
      R('n_repetition_1', 'repetition', 'Encore ? Tu n’as rien d’autre ?'),
      R('n_provoque_1', 'provoque', 'Parle encore, et je te coupe la langue.'),
      R('n_paix_1', 'paix', 'Assez. On a tous les deux mieux à faire que mourir ici.'),
      R('n_victoire_1', 'victoire_adv', 'Reste à terre. C’est un conseil.'),
      R('n_victoire_2', 'victoire_adv', 'Tu t’es bien battu·e. Ça ne suffit pas.'),
      R('n_defaite_1', 'defaite_adv', 'Fais… ce que tu as à faire.'),
      R('n_defaite_2', 'defaite_adv', 'On… se reverra.'),
    ],
    groupe: [
      R('ne_entree_1', 'entree', 'Encerclez la cible. Personne ne frappe seul.'),
      R('ne_entree_2', 'entree', 'Formation en croix. Maintenant.'),
      R('ne_reussite_1', 'reussite_joueur', 'Un des nôtres est tombé. Restez groupés !'),
      R('ne_rate_1', 'rate_joueur', 'La cible fatigue. Maintenant !'),
      R('ne_blessure_1', 'blessure', 'Couvrez-moi ! Couvrez-moi !'),
      R('ne_imminente_1', 'defaite_imminente', 'Repli… on se replie !'),
      R('ne_parade_1', 'parade', 'Prévisible. Gardez la formation.'),
      R('ne_repetition_1', 'repetition', 'Toujours la même technique. Écartez-vous dès qu’il y a des signes.'),
      R('ne_decouverte_1', 'decouverte', 'Attention, ça, on ne l’avait pas prévu !'),
      R('ne_paix_1', 'paix', 'Ça suffit. On rentre. Ce n’est pas notre guerre.'),
      R('ne_victoire_1', 'victoire_adv', 'Attachez la cible. Le chef voudra la voir.'),
      R('ne_defaite_1', 'defaite_adv', 'Partez… partez tous…'),
    ],
  },
  bete: {
    seul: [
      R('b_entree_1', 'entree', '~{Il} baisse la tête, babines retroussées. Un grondement sourd monte de sa poitrine.'),
      R('b_entree_2', 'entree', '~{Il} tourne autour de toi, lentement, sans jamais te quitter des yeux.'),
      R('b_reussite_1', 'reussite_joueur', '~{Il} pousse un cri aigu et recule, l’échine hérissée.'),
      R('b_reussite_2', 'reussite_joueur', '~{Il} secoue la tête, étourdi{e}, et gronde plus fort.'),
      R('b_rate_1', 'rate_joueur', '~{Il} ne recule pas d’un pouce. {Il} attend la prochaine ouverture.'),
      R('b_blessure_1', 'blessure', '~{Il} hurle, puis se jette sur toi avec une rage nouvelle.'),
      R('b_imminente_1', 'defaite_imminente', '~{Il} titube, la langue pendante, et cherche des yeux une issue.'),
      R('b_parade_1', 'parade', '~{Il} fait un bond de côté, plus vif que tu ne l’aurais cru.'),
      R('b_repetition_1', 'repetition', '~{Il} a appris : au même geste, {il} esquive avant même que tu bouges.'),
      R('b_victoire_1', 'victoire_adv', '~{Il} se tient au-dessus de toi, le souffle chaud contre ton visage, puis se détourne.'),
      R('b_defaite_1', 'defaite_adv', '~{Il} se couche dans la poussière et ne grogne plus.'),
    ],
    groupe: [
      R('bm_entree_1', 'entree', '~Ils se déploient en demi-cercle, en silence. Le plus grand reste en arrière : c’est lui qui décide.'),
      R('bm_entree_2', 'entree', '~Des yeux brillent dans le noir, un, deux, sept paires. Les grognements se répondent.'),
      R('bm_reussite_1', 'reussite_joueur', '~Un glapissement, et l’un d’eux s’enfuit en boitant. Les autres reculent d’un pas.'),
      R('bm_rate_1', 'rate_joueur', '~Ils sentent ta fatigue. Le cercle se resserre.'),
      R('bm_blessure_1', 'blessure', '~Le chef de meute hurle. Tous les autres répondent.'),
      R('bm_imminente_1', 'defaite_imminente', '~Ils hésitent. Le chef de meute regarde la forêt, puis toi.'),
      R('bm_parade_1', 'parade', '~Ils s’écartent tous ensemble, comme un seul animal.'),
      R('bm_victoire_1', 'victoire_adv', '~Ils te laissent à terre et repartent vers la forêt, la tête haute.'),
      R('bm_defaite_1', 'defaite_adv', '~Le chef de meute tourne les talons. Les autres le suivent sans un bruit.'),
    ],
  },
  bandit: {
    seul: [
      R('bd_entree_1', 'entree', 'Ta bourse, et tu repars avec tes deux jambes. C’est un bon prix.'),
      R('bd_entree_2', 'entree', 'Un ninja ? On m’avait dit que la route était tranquille.'),
      R('bd_reussite_1', 'reussite_joueur', 'Aïe ! T’as pas le droit de faire ça !'),
      R('bd_rate_1', 'rate_joueur', 'Ha ! Les ninjas, c’est surtout du bandeau.'),
      R('bd_blessure_1', 'blessure', 'Mon bras… tu m’as cassé le bras !'),
      R('bd_imminente_1', 'defaite_imminente', 'Attends, attends ! On peut s’arranger !'),
      R('bd_parade_1', 'parade', 'Je me bats sur les routes depuis que t’es né·e, gamin·e.'),
      R('bd_paix_1', 'paix', 'D’accord, d’accord. On va voir ailleurs.'),
      R('bd_victoire_1', 'victoire_adv', 'Fouillez ses poches. Lui, laissez-le.'),
      R('bd_defaite_1', 'defaite_adv', 'Pitié… j’ai des enfants. Enfin, j’en avais.'),
    ],
    groupe: [
      R('bb_entree_1', 'entree', 'Seul·e contre six. Faites le calcul, les gars.'),
      R('bb_entree_2', 'entree', 'Personne ne passe sans payer le péage. Pas même toi.'),
      R('bb_reussite_1', 'reussite_joueur', 'Tetsu est à terre ! Tetsu est à terre !'),
      R('bb_rate_1', 'rate_joueur', 'Ça faiblit ! Tous ensemble !'),
      R('bb_blessure_1', 'blessure', 'C’est pas un genin de rien du tout…'),
      R('bb_imminente_1', 'defaite_imminente', 'On se tire ! La paie vaut pas ça !'),
      R('bb_parade_1', 'parade', 'Trop lent, le ninja !'),
      R('bb_paix_1', 'paix', 'Ça va, ça va ! On s’en va, garde ta route.'),
      R('bb_victoire_1', 'victoire_adv', 'Prenez tout ce qui brille. Et ses sandales.'),
      R('bb_defaite_1', 'defaite_adv', 'Chacun pour soi !'),
    ],
  },
  eleve: {
    seul: [
      R('el_entree_1', 'entree', 'Tu vas voir ce que vaut vraiment le premier de la classe.'),
      R('el_entree_2', 'entree', 'Pas de techniques interdites. Le premier à terre a perdu.'),
      R('el_reussite_1', 'reussite_joueur', 'Hé ! C’était pas réglo, ça !'),
      R('el_rate_1', 'rate_joueur', 'C’est ça que t’as appris cette année ?'),
      R('el_blessure_1', 'blessure', 'Aïe… d’accord. D’accord. On arrête de rigoler.'),
      R('el_imminente_1', 'defaite_imminente', 'Je… je peux encore…'),
      R('el_parade_1', 'parade', 'Je l’avais vu venir, celle-là !'),
      R('el_paix_1', 'paix', 'Bon… match nul ? Personne ne le saura.'),
      R('el_victoire_1', 'victoire_adv', 'Tu veux que je t’aide à te relever ? Non ? Comme tu veux.'),
      R('el_defaite_1', 'defaite_adv', 'La prochaine fois, je gagne. Tu verras.'),
    ],
    groupe: [
      R('eg_entree_1', 'entree', 'Regardez qui vient jouer les héros.'),
      R('eg_entree_2', 'entree', 'On est trois. Tu sais compter, au moins ?'),
      R('eg_reussite_1', 'reussite_joueur', 'Daichi est à terre ! Daichi est à terre !'),
      R('eg_rate_1', 'rate_joueur', 'Ha ! Même pas mal !'),
      R('eg_blessure_1', 'blessure', 'Mon nez… il m’a cassé le nez !'),
      R('eg_imminente_1', 'defaite_imminente', 'On s’en va. On s’en va ! Ça vaut pas le coup.'),
      R('eg_paix_1', 'paix', 'C’est bon, c’est bon, on rigolait.'),
      R('eg_victoire_1', 'victoire_adv', 'Reste par terre. Et la prochaine fois, mêle-toi de tes affaires.'),
      R('eg_defaite_1', 'defaite_adv', 'Les instructeurs vont l’apprendre… et ce sera pour toi, pas pour nous.'),
    ],
  },
  samourai: {
    seul: [
      R('sa_entree_1', 'entree', 'Dégaine. Je n’attaque pas quelqu’un dont la lame dort.'),
      R('sa_entree_2', 'entree', 'Sur cette terre, ton chakra ne vaut rien. Seule la lame compte.'),
      R('sa_reussite_1', 'reussite_joueur', 'Une bonne coupe. Ton maître était honnête.'),
      R('sa_rate_1', 'rate_joueur', 'Tu frappes comme un ninja. Avec les mains, pas avec le cœur.'),
      R('sa_blessure_1', 'blessure', 'Le sang ne déshonore personne. Continuons.'),
      R('sa_imminente_1', 'defaite_imminente', 'Si je tombe, que ce soit par une coupe nette.'),
      R('sa_parade_1', 'parade', 'Ton épaule t’a trahi·e bien avant ta lame.'),
      R('sa_paix_1', 'paix', 'Il suffit. Nous avons tous deux été vus. Rengainons.'),
      R('sa_victoire_1', 'victoire_adv', 'Relève-toi quand tu seras digne de le faire.'),
      R('sa_defaite_1', 'defaite_adv', 'Tu m’as vaincu loyalement. Je n’ai rien à ajouter.'),
    ],
    groupe: [
      R('sg_entree_1', 'entree', 'Au nom du Mifune : déposez les armes.'),
      R('sg_reussite_1', 'reussite_joueur', 'Serrez les rangs. Lames hautes.'),
      R('sg_imminente_1', 'defaite_imminente', 'Repliez-vous en ordre. Pas de fuite.'),
      R('sg_victoire_1', 'victoire_adv', 'Qu’on lie ce ninja. Il y aura un jugement selon nos lois.'),
      R('sg_defaite_1', 'defaite_adv', 'Rengainez. Nous avons perdu.'),
    ],
  },
  mercenaire: {
    seul: [
      R('me_entree_1', 'entree', 'Rien de personnel. On m’a payé pour ta tête.'),
      R('me_entree_2', 'entree', 'Tu vaux plus mort que vivant. Désolé.'),
      R('me_reussite_1', 'reussite_joueur', 'Ils ne m’avaient pas dit que tu savais faire ça.'),
      R('me_rate_1', 'rate_joueur', 'Facile. Je vais demander un supplément.'),
      R('me_blessure_1', 'blessure', 'Ça, ce n’était pas dans le contrat.'),
      R('me_imminente_1', 'defaite_imminente', 'Je rends l’argent. Je te jure que je rends l’argent.'),
      R('me_paix_1', 'paix', 'On oublie le contrat. Personne ne paie assez pour ça.'),
      R('me_victoire_1', 'victoire_adv', 'Rien de personnel. Je te l’avais dit.'),
      R('me_defaite_1', 'defaite_adv', 'Celui qui m’a payé… il en enverra d’autres.'),
    ],
    groupe: [
      R('mg_entree_1', 'entree', 'Une tête, une prime. On se partage le reste.'),
      R('mg_imminente_1', 'defaite_imminente', 'Le contrat ne valait pas ça. On décroche !'),
      R('mg_victoire_1', 'victoire_adv', 'Ramassez la prime. On rentre.'),
      R('mg_defaite_1', 'defaite_adv', 'Chacun pour sa peau !'),
    ],
  },
  arene: {
    seul: [
      R('ar_entree_1', 'entree', 'La foule veut du sang. Je vais lui en donner, du tien.'),
      R('ar_entree_2', 'entree', 'Dix-sept combats. Dix-sept victoires. Tu seras le dix-huitième.'),
      R('ar_reussite_1', 'reussite_joueur', 'Ha ! Ils vont parier sur toi, maintenant !'),
      R('ar_rate_1', 'rate_joueur', 'Tu entends la foule ? Elle se moque de toi.'),
      R('ar_blessure_1', 'blessure', 'Enfin. Enfin quelqu’un qui frappe.'),
      R('ar_imminente_1', 'defaite_imminente', 'Pas… devant eux…'),
      R('ar_victoire_1', 'victoire_adv', 'Emportez-le. Au suivant !'),
      R('ar_defaite_1', 'defaite_adv', 'Ils ne crieront plus mon nom… plus jamais…'),
    ],
    groupe: [],
  },
};

/** Ce que tu lis d'une bête : ses muscles, ses yeux, sa gueule. Elle ne compose jamais de signes. */
export const ANNONCES_BETE: ContenuRacine['annonces'] = {
  attaque: { fiable: ['{Il} se ramasse sur ses pattes arrière : {il} va bondir.', 'Sa gueule s’ouvre, les crocs en avant.'], vague: ['{Il} gronde.', 'Ses oreilles se couchent.'] },
  technique: { fiable: ['{Il} se ramasse sur ses pattes arrière : {il} va bondir.'], vague: ['{Il} gronde.'] },
  majeure: { fiable: ['{Il} recule de trois pas, la tête basse : la grande charge arrive.'], vague: ['L’air s’alourdit de son odeur.'] },
  defense: { fiable: ['{Il} recule, l’échine hérissée, et montre les dents.'], vague: ['{Il} recule un peu.'] },
  observer: { fiable: ['{Il} tourne autour de toi, sans quitter tes mains des yeux.'], vague: ['{Il} reste immobile.'] },
  parler: { fiable: ['{Il} gronde, bas, sans bouger.'], vague: ['{Il} gronde.'] },
  fuir: { fiable: ['{Il} jette un coup d’œil vers les arbres.'], vague: ['Sa queue se baisse.'] },
  preparer: { fiable: ['{Il} gratte le sol de ses griffes, tête baissée.'], vague: ['{Il} piétine.'] },
};

/** Les fins selon l'adversaire : une bête qui fuit n'est pas un ninja qui disparaît dans la fumée. */
export const FINS_TYPE: Partial<Record<TypeAdversaire, Partial<Record<string, string[]>>>> = {
  bete: {
    victoire: ['{nom} s’effondre sur le flanc. Son souffle ralentit, puis s’arrête de gronder.', '{nom} recule en boitant jusqu’aux arbres et disparaît sous les branches.'],
    defaite: ['Tu tombes. {nom} se tient au-dessus de toi un long moment, puis se détourne, comme si tu ne valais plus la peine.', 'Des crocs se referment sur ton bras, et le monde devient rouge.'],
    fuite_adverse: ['{nom} fait volte-face et file vers la forêt, la queue basse.'],
    departage_gagne: ['{nom} recule, la tête basse. {Il} ne veut plus de ce combat.'],
    departage_perdu: ['Tu recules jusqu’à la clôture, à bout de souffle. {nom} garde le terrain.'],
    departage_nul: ['Vous vous regardez, toi et {nom}, à bout de souffle tous les deux. Personne ne bouge plus.'],
  },
  bandit: {
    victoire: ['{nom} lâche ses armes et lève les mains. La route est à toi.', '{nom} détale dans les fourrés en abandonnant tout ce qu’il avait volé.'],
    fuite_adverse: ['{nom} disparaît dans les fourrés en jurant. Tu entends encore les insultes longtemps après.'],
  },
  eleve: {
    victoire: ['{nom} reste par terre, vexé·e, pendant que les autres élèves murmurent ton nom.', '{nom} se relève en se frottant l’épaule et ne dit plus rien.'],
    defaite: ['Tu te retrouves le nez dans la poussière de la cour. Quelqu’un rit. Tu ne lèves pas les yeux pour savoir qui.'],
  },
  samourai: {
    victoire: ['{nom} pose un genou à terre et rengaine lentement. C’est sa manière de s’incliner.'],
    defaite: ['La lame de {nom} s’arrête à un doigt de ta gorge. « C’est fini. »'],
  },
  arene: {
    victoire: ['La foule hurle. {nom} reste dans la poussière de la fosse, et quelqu’un jette des pièces sur toi.'],
    defaite: ['Le sol de la fosse te monte au visage. Au-dessus, la foule compte jusqu’à dix en riant.'],
  },
};

/** Ce qu'une bête t'inflige : des crocs, des griffes, une charge. */
export const COUPS_BETE: string[] = [
  'Ses crocs se referment sur ton avant-bras.',
  'Sa charge te prend en pleine poitrine.',
  'Ses griffes t’ouvrent l’épaule.',
  'Une mâchoire claque à un doigt de ta gorge, puis trouve ta cuisse.',
];
