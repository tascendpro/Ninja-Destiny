import type { ContenuRacine } from '../../engine/combat/types';

/**
 * Les récits de l'Affrontement Racine (§10, §16.1) : par famille et par issue, plusieurs variantes,
 * tirées sans répétition immédiate. {il}, {Il}, {lui}, {e} s'accordent à l'adversaire ; {tech} est la technique jouée ;
 * {nom} est le nom de l'adversaire. Les formes « ·e » s'accordent au joueur.
 */
export const RECITS: ContenuRacine['recits'] = {
  // ── L'exécution ──
  'exec:parfaite': ['Les gestes s’enchaînent sans un accroc, comme si ton corps les connaissait depuis toujours.', 'Tout est juste : le souffle, l’appui, le moment.', 'Pour une fois, rien ne tremble.'],
  'exec:reussie': ['', 'Le geste part comme tu l’as appris.', 'C’est propre.'],
  'exec:instable': ['Le chakra vacille au dernier signe : la technique sort, mais à moitié.', 'Ton appui glisse d’un pouce. Le coup part quand même, moins fort.', 'La fatigue disperse une partie de ce que tu voulais y mettre.'],
  'exec:ratee:ninjutsu': ['Tes doigts se bloquent au quatrième signe. Le chakra s’échappe entre tes mains comme de l’eau tiède.', 'Les signes se brouillent. Une étincelle, un peu de fumée, et rien d’autre.', 'Tu perds le fil au milieu de la séquence. La technique meurt avant de naître.'],
  'exec:ratee:taijutsu': ['Ton pied d’appui glisse. Le coup part dans le vide.', 'Tu frappes trop tôt, trop loin. Il n’y a que de l’air au bout de ton poing.', 'Ton corps hésite une fraction de seconde. C’est assez pour tout rater.'],

  // ── Les sept issues d'une attaque : taijutsu ──
  'taijutsu:touche': ['Ton coup trouve son flanc. {Il} recule d’un pas, le souffle coupé.', 'Tu passes sous sa garde et frappes au ventre. {Il} se plie.', 'Ton poing claque contre son épaule. {Il} grimace, et recule.'],
  'taijutsu:surprise': ['{Il} attendait un coup de poing. Tu frappes du talon, au ras du sol. {Il} ne l’a pas vu venir.', 'Le geste est nouveau pour {lui}. {Il} réagit une demi-seconde trop tard.'],
  'taijutsu:predite': ['{Il} pivote avant même que ton épaule ait fini de bouger. Ton coup ne rencontre que le vide.', '{Il} attendait exactement ce geste-là. Tu frappes l’endroit où {il} était.', 'Ton poing passe à un doigt de son visage. {Il} l’avait vu partir.'],
  'taijutsu:annulee': ['Vos poings se croisent. Le choc vous renvoie chacun d’un pas en arrière, sonnés.', 'Vos avant-bras se heurtent. Personne ne passe.', 'Vos coups se rencontrent à mi-chemin. Égalité.'],
  'taijutsu:dominee': ['Ton coup part juste, mais {il} frappe plus fort, et ton bras est repoussé.', 'Tu frappes bien. {Il} frappe mieux. Ta garde s’ouvre.'],
  'taijutsu:ecrasee': ['Son coup traverse le tien et te cueille au menton.', 'Tu frappes, mais sa force balaie ton bras et t’atteint en pleine poitrine.'],
  'taijutsu:decisive': ['Tu trouves l’ouverture qu’{il} t’avait laissée sans le savoir. Un seul coup, et {il} tombe à genoux.', 'Ton coup arrive exactement là où {il} ne se protégeait plus. {Il} s’effondre.'],

  // ── Les sept issues d'une attaque : ninjutsu (sans nature particulière) ──
  'ninjutsu:touche': ['{tech} le frappe de plein fouet. {Il} titube.', 'La technique part droit sur {lui}. {Il} encaisse, en serrant les dents.'],
  'ninjutsu:surprise': ['{Il} attendait un projectile. {tech} part autrement. {Il} réagit trop tard.', '{Il} n’avait jamais vu cette technique. Ça se voit sur son visage.'],
  'ninjutsu:predite': ['{Il} se déplace avant même que ta main termine le dernier signe. {tech} frappe l’endroit où {il} était.', '{Il} avait reconnu tes signes. {tech} passe à côté.'],
  'ninjutsu:annulee': ['Ta technique et la sienne se heurtent à mi-chemin et s’annulent dans un souffle.', 'Les deux techniques se rencontrent. Il ne reste qu’un nuage, et vous deux, de part et d’autre.'],
  'ninjutsu:dominee': ['{tech} jaillit exactement comme prévu. Puis sa technique l’engloutit, et {il} avance déjà.', 'Ta technique est bonne. La sienne est plus forte.'],
  'ninjutsu:ecrasee': ['Sa technique traverse la tienne sans ralentir et te frappe de plein fouet.', 'Tu vois ta technique se défaire contre la sienne, puis la sienne arrive sur toi.'],
  'ninjutsu:decisive': ['{tech} le recouvre entièrement. Quand tout se dissipe, {il} ne se relève pas.', 'La technique frappe son point faible. {Il} tombe.'],

  // ── Par nature : l'issue raconte la nature (§10.1, §10.2) ──
  'katon:touche': ['La boule de feu l’enveloppe une seconde. {Il} en sort en se tapant sur les épaules, la veste roussie.', 'Le feu lui lèche le bras. {Il} recule en sifflant de douleur.'],
  'katon:surprise': ['{Il} attendait un projectile. Le feu sort de ta bouche en éventail, au ras du sol. {Il} saute trop tard.'],
  'katon:predite': ['{Il} se déplace avant même que ta main ne termine le signe. Ta boule de feu dévore l’endroit où {il} était.'],
  'katon:annulee': ['Ton feu rencontre sa technique. Une colonne de flammes monte, puis retombe en pluie de cendres. Vous reculez tous les deux.'],
  'katon:dominee': ['Ton Katon jaillit exactement comme prévu. Puis sa technique se referme sur les flammes et les étouffe.'],
  'katon:ecrasee': ['Sa technique traverse ton feu sans ralentir. La vapeur te brûle les yeux une demi-seconde avant le choc.'],
  'katon:decisive': ['{Il} est encore à genoux quand la sphère de feu le recouvre. Quand la fumée se dissipe, {il} ne se relève pas.'],
  'suiton:touche': ['La balle d’eau le frappe à l’estomac avec la force d’un poing. {Il} recule, trempé{e} et le souffle coupé.'],
  'suiton:annulee': ['Ton eau rencontre sa technique et retombe en averse sur vous deux.'],
  'suiton:predite': ['{Il} s’écarte d’un pas. Ton eau éclate contre le sol derrière {lui}.'],
  'fuuton:touche': ['La lame de vent fend l’air et lui entaille l’épaule. {Il} recule d’un pas.'],
  'fuuton:annulee': ['Ton vent heurte sa technique. Une bourrasque soulève la poussière, et vous repousse chacun d’un pas.'],
  'fuuton:predite': ['{Il} se baisse au dernier moment. Ta lame de vent tranche une branche derrière {lui}.'],
  'raiton:touche': ['L’éclair frappe son épaule. Ses jambes tremblent, mais {il} reste debout.'],
  'raiton:annulee': ['Ton éclair heurte sa technique : un éclair blanc, une onde de choc, et vous reculez tous les deux.'],
  'raiton:predite': ['{Il} reconnaît la trajectoire et pivote. L’éclair effleure sa veste.'],
  'doton:touche': ['Le sol se soulève sous ses pieds et le projette en arrière.'],
  'doton:annulee': ['Ta roche rencontre sa technique et se fend. Le terrain se couvre d’éclats.'],
  'doton:predite': ['{Il} saute avant que la terre bouge. Ton mur de roche se dresse dans le vide.'],

  // ── Ce que l'adversaire inflige ──
  'adv:touche': ['Son coup t’atteint au flanc.', '{Il} te frappe en plein ventre.', 'Tu prends le coup sur l’épaule.', 'Son attaque te cueille au moment où tu baisses la garde.'],

  // ── Défense, observation, parole, fuite ──
  'defense:garde:ok': ['Tu tiens ta garde. Rien ne vient : {il} a fait autre chose de cette manche.', 'Les avant-bras levés, tu attends. {Il} n’attaque pas.'],
  'defense:garde:ko': ['Le coup s’écrase sur tes avant-bras. Ça fait mal, mais moins que prévu.', 'Tu encaisses derrière ta garde. Tes bras tremblent, mais tiennent.'],
  'defense:esquive:ok': ['Tu plonges hors de portée au dernier instant. Le coup passe, et sa garde reste ouverte.', 'Un pas de côté, juste assez. Son élan l’emporte trop loin.'],
  'defense:esquive:ko': ['Tu bondis, trop tard d’un souffle. Le coup te prend de plein fouet.', 'Tu esquives du mauvais côté.'],
  'defense:permutation:ok': ['Son attaque frappe une bûche. Toi, tu es déjà derrière {lui}.', 'Un nuage de fumée, une bûche fendue. Tu réapparais dans son dos.'],
  'defense:permutation:ko': ['Ta permutation arrive une fraction trop tard : la bûche et toi encaissez le coup ensemble.'],
  'observation:observer:ok': ['Tu ne bouges plus. Tu regardes ses pieds, ses épaules, sa respiration. Et tu vois ce qu’{il} protège mal.', 'Tu observes. Et cette fois, tu remarques le défaut dans sa garde.'],
  'observation:observer:ko': ['Tu observes. Tu apprends des choses, pas encore son point faible.', 'Tu le regardes faire, attentivement. Rien d’évident. Pas encore.'],
  'parole:provoquer:ok': ['Ta phrase touche juste. Son visage se ferme, ses poings se serrent : {il} ne réfléchit plus.', '{Il} rougit jusqu’aux oreilles. {Il} va charger, et mal.'],
  'parole:provoquer:ko': ['{Il} hausse les épaules. Tes mots glissent sur {lui}.', '{Il} sourit. « C’est tout ? »'],
  'parole:raisonner:ok': ['Tu baisses les poings le premier. Après un long silence, {il} fait pareil.', 'Tu parles. Lentement, {il} écoute.'],
  'parole:raisonner:ko': ['Tu ouvres la bouche. {Il} n’a pas l’intention de t’écouter.', 'Tes mots se perdent dans le vacarme.'],
  'parole:reddition:ok': ['{Il} lève les mains. C’est fini.', '{Il} recule, et pose un genou à terre.'],
  'parole:reddition:ko': ['{Il} secoue la tête, le souffle court, et se remet en garde.'],
  'fuite:fuir:ok': ['Tu tournes les talons et tu cours. Le temps qu’{il} réagisse, tu es déjà loin.', 'Un bond, un mur, un toit. Tu as disparu.'],
  'fuite:fuir:ko': ['Tu tournes les talons. {Il} est plus rapide : ton dos est grand ouvert.', 'Tu cherches une sortie. {Il} te coupe la route.'],

  // ── Les fins ──
  'fin:victoire': ['{nom} est à terre, et n’essaie plus de se relever.', 'C’est fini. {nom} reste au sol, le souffle court.', 'Le dernier coup porte. {nom} ne se relève pas tout de suite.'],
  'fin:defaite': ['Tu es à terre. Le ciel tourne au-dessus de toi.', 'Tes jambes ne te portent plus. Tu tombes à genoux.', 'Le dernier coup te met au sol. Tu n’arrives plus à te relever.'],
  'fin:paix': ['Vous restez face à face, essoufflés. Personne ne frappe plus.', 'Les poings retombent. Le combat est fini, sans vainqueur.'],
  'fin:fuite': ['Tu cours, sans te retourner, jusqu’à ce que le bruit du combat disparaisse.'],
  'fin:fuite_adverse': ['{nom} recule d’un bond, puis d’un autre, et disparaît.', '{nom} a choisi de partir. Tu n’essaies pas de suivre.'],
  'fin:reddition_adverse': ['{nom} se rend. Tout le monde l’a vu.'],
  'fin:departage_gagne': ['Personne n’est tombé. Mais tout le monde a vu qui reculait. Pas toi.', 'On vous sépare. Aucun de vous n’est à terre, mais tu as l’avantage, et tout le monde le sait.'],
  'fin:departage_nul': ['Personne n’a pris le dessus. Vous vous regardez, essoufflés, sans savoir qui a gagné.', 'On vous sépare. Aucun avantage, aucun vaincu.'],
  'fin:departage_perdu': ['Personne n’est tombé. Mais tout le monde a vu qui reculait. Toi.', 'On vous sépare. Aucun de vous n’est à terre, mais {nom} avait l’avantage, et tout le monde le sait.'],
};

/** Les annonces par intention (§7.2) : précises si tu sais lire, vagues sinon. Une annonce ne nomme jamais une technique inconnue. */
export const ANNONCES: ContenuRacine['annonces'] = {
  attaque: {
    fiable: ['Son poids passe sur la jambe avant : {il} va frapper.', '{Il} réduit la distance à petits pas, les poings serrés.', 'Son épaule droite recule. Le coup va partir.'],
    vague: ['{Il} bouge.', 'Quelque chose change dans sa posture.', '{Il} se rapproche, peut-être.'],
  },
  technique: {
    fiable: ['Ses doigts commencent à composer des signes.', '{Il} inspire profondément, la poitrine gonflée.', 'Une lueur court le long de son bras.'],
    vague: ['Ses mains bougent.', '{Il} murmure quelque chose.', 'L’air autour de {lui} change, un peu.'],
  },
  defense: {
    fiable: ['{Il} ramène les avant-bras devant son visage.', '{Il} recule d’un pas, attentif{e}.'],
    vague: ['{Il} se tasse un peu.', '{Il} recule, ou bien {il} se prépare.'],
  },
  observer: {
    fiable: ['{Il} ne bouge plus. {Il} te regarde, toi, pas tes mains.', '{Il} t’étudie, la tête légèrement penchée.'],
    vague: ['{Il} reste immobile.', '{Il} attend quelque chose.'],
  },
  parler: {
    fiable: ['{Il} baisse légèrement sa garde, comme pour parler.'],
    vague: ['{Il} ouvre la bouche, puis la referme.'],
  },
  fuir: {
    fiable: ['{Il} regarde brièvement la sortie, puis toi.'],
    vague: ['Ses yeux bougent beaucoup.'],
  },
  preparer: {
    fiable: ['{Il} recule et se met à rassembler son chakra. {Il} ne cherche plus à gagner du temps.', 'Le sol vibre sous ses pieds. Quelque chose se prépare.'],
    vague: ['{Il} recule. Il se passe quelque chose.', 'L’air devient lourd autour de {lui}.'],
  },
  majeure: {
    fiable: ['Son sourire disparaît. Ça arrive maintenant.'],
    vague: ['L’air devient lourd. Maintenant.'],
  },
};
