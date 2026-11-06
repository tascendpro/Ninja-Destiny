// Les événements qui surgissent pendant un combat (§5) : quelqu'un intervient, le décor cède, une arme casse, un
// message arrive. Chaque événement s'annonce au début d'une manche et ouvre la famille « Situation » : on peut y
// répondre, ou l'ignorer et en subir la suite. Certains arrêtent le combat net.

import type { AttributId } from '../../engine/types';
import type { EtatId } from '../../engine/combat/etats';
import type { Moral } from '../../engine/combat/esprit';
import type { ContexteId, NiveauAdv } from '../../engine/combat/types';
import type { EtatTerrain } from './synergies';
import type { Terrain } from './impacts';

export interface EffetSituation {
  texte: string;
  /** Part de tes PV max perdue ; part de ses PV max perdue. */
  subi?: number;
  inflige?: number;
  etatJoueur?: [EtatId, number];
  etatAdv?: [EtatId, number];
  /** Le combat s'arrête là. */
  fin?: 'interrompu' | 'fuite' | 'fuite_adverse' | 'paix';
  /** Bonus à ta prochaine attaque. */
  ouverture?: number;
  /** Il ne peut pas t'atteindre cette manche. */
  protege?: boolean;
  terrain?: EtatTerrain;
  /** Un allié rejoint le combat. */
  allie?: { nom: string; degats: number; manches: number };
  /** Des renforts adverses : part de ses PV max ajoutée (et rendue). */
  renfortAdv?: number;
  moral?: Partial<Moral>;
  reputation?: number;
}

export interface ChoixSituationDef {
  id: string;
  nom: string;
  detail: string;
  /** Un geste qui peut rater : la chance vient de l'attribut. */
  test?: { attribut: AttributId; base: number };
  succes: EffetSituation;
  echec?: EffetSituation;
}

export interface EvenementCombatDef {
  id: string;
  type: 'intervention' | 'environnement' | 'tactique' | 'scenario';
  poids: number;
  si: {
    contextes?: ContexteId[];
    terrains?: Terrain[];
    /** Un état du terrain doit être présent (le feu pour un incendie). */
    terrainEtat?: EtatTerrain[];
    /** Le plus haut niveau du joueur pour que l'événement ait un sens (un jōnin n'arrête pas deux jōnin). */
    niveauJoueurMax?: NiveauAdv;
    mancheMin?: number;
    joueurSousPct?: number;
    advSousPct?: number;
    pasBete?: boolean;
  };
  /** Ce qui arrive, ajouté à l'annonce de la manche. */
  texte: string;
  choix: ChoixSituationDef[];
  /** Si tu joues autre chose : ce que l'événement fait quand même. */
  ignore: EffetSituation;
}

export const EVENEMENTS_COMBAT: EvenementCombatDef[] = [
  // ── Interventions ──
  {
    id: 'jonin_arrete',
    type: 'intervention',
    poids: 8,
    si: { contextes: ['bagarre', 'provocation', 'duel'], niveauJoueurMax: 'chunin', mancheMin: 2 },
    texte: 'Une main se pose sur ton épaule, une autre sur la sienne. Un jōnin est là, entre vous, sans que personne l’ait vu arriver. « Ça suffit. »',
    choix: [
      { id: 'obeir', nom: 'Baisser les poings', detail: 'On ne discute pas avec un jōnin.', succes: { texte: 'Tu recules d’un pas. {Il} aussi. Le jōnin vous regarde l’un après l’autre, longtemps, puis s’en va sans un mot de plus. C’est fini.', fin: 'interrompu' } },
      { id: 'protester', nom: 'Protester', detail: 'Ce n’est pas lui qui a commencé.', test: { attribut: 'charisme', base: 0.25 }, succes: { texte: 'Tu expliques, vite, les poings encore serrés. Le jōnin écoute, hausse un sourcil, et se tourne vers {lui}. « Toi, tu rentres. » Tu as gagné, d’une certaine façon.', fin: 'interrompu', reputation: 1 }, echec: { texte: 'Tu ouvres la bouche. Le jōnin te regarde. Tu la refermes. C’est fini, et on se souviendra que tu as discuté.', fin: 'interrompu', reputation: -1 } },
      { id: 'profiter', nom: 'Frapper pendant qu’il retient son bras', detail: 'Un coup bas. Il le verra.', succes: { texte: 'Ton poing part. Il n’arrive jamais : le jōnin l’attrape au vol, sans même te regarder, et le serre jusqu’à ce que tes genoux plient. « Je me souviendrai de toi. »', fin: 'interrompu', subi: 0.12, reputation: -3 } },
    ],
    ignore: { texte: 'Tu ne t’arrêtes pas. Le jōnin non plus : il te prend par le col et te pose à terre comme un sac de riz. C’est fini.', fin: 'interrompu', subi: 0.1, reputation: -2 },
  },
  {
    id: 'sensei_protege',
    type: 'intervention',
    poids: 6,
    si: { contextes: ['mission', 'embuscade'], niveauJoueurMax: 'genin', joueurSousPct: 40, mancheMin: 2 },
    texte: 'Un sifflement de kunai : ton sensei tombe du ciel et se plante devant toi, dos à toi, face à {nom}. « Recule. C’est mon combat, maintenant. »',
    choix: [
      { id: 'reculer', nom: 'Reculer derrière lui', detail: 'Tu as fait ta part.', succes: { texte: 'Tu recules. Ce qui suit dure trois secondes. Quand la poussière retombe, {nom} est à terre, et ton sensei rengaine sans même être essoufflé.', fin: 'interrompu' } },
      { id: 'epauler', nom: 'Te battre à ses côtés', detail: 'Tu n’es pas venu·e pour regarder.', succes: { texte: 'Tu restes. Ton sensei soupire, puis sourit à moitié. « Alors suis mon rythme. » Désormais, il frappe avec toi.', allie: { nom: 'ton sensei', degats: 0.22, manches: 3 } } },
    ],
    ignore: { texte: 'Ton sensei n’attend pas ta permission : il s’interpose, et prend le coup suivant à ta place.', protege: true, allie: { nom: 'ton sensei', degats: 0.22, manches: 2 } },
  },
  {
    id: 'renforts_ennemis',
    type: 'intervention',
    poids: 6,
    si: { contextes: ['mission', 'embuscade', 'combat_a_mort'], mancheMin: 2, pasBete: true },
    texte: 'Des silhouettes sur les branches : deux, puis trois. Les renforts de {nom} arrivent. {Il} sourit pour la première fois.',
    choix: [
      { id: 'decrocher', nom: 'Décrocher tant qu’il est temps', detail: 'Survivre d’abord.', test: { attribut: 'agilite', base: 0.45 }, succes: { texte: 'Tu jettes une bombe de fumée à tes pieds et tu files entre les troncs. Ils ne te rattrapent pas.', fin: 'fuite' }, echec: { texte: 'Tu cours. Un kunai te rattrape à la cuisse. Tu tombes, et tu te relèves face à eux.', subi: 0.1, etatJoueur: ['jambe_touchee', 3], renfortAdv: 0.3 } },
      { id: 'tete', nom: 'Frapper le chef avant qu’ils arrivent', detail: 'Il n’a qu’une manche d’avance.', succes: { texte: 'Tu ne regardes pas les renforts. Tu regardes {nom}. Tu as un instant, et tu le prends.', ouverture: 18, renfortAdv: 0.25, moral: { peur: 10 } } },
      { id: 'tenir', nom: 'Tenir le terrain', detail: 'Ils devront passer par toi.', succes: { texte: 'Tu prends position dos à un tronc. Qu’ils viennent.', renfortAdv: 0.3 } },
    ],
    ignore: { texte: 'Les renforts se mettent en place autour de {lui}. {Il} respire mieux, maintenant.', renfortAdv: 0.3, moral: { peur: -20, determination: 15 } },
  },
  {
    id: 'renfort_allie',
    type: 'intervention',
    poids: 5,
    si: { contextes: ['mission', 'embuscade', 'combat_a_mort'], joueurSousPct: 50, mancheMin: 2 },
    texte: 'Un cri derrière toi : un ninja de ton village dévale la pente, kunai en main. Il t’a entendu·e de loin.',
    choix: [
      { id: 'coordonner', nom: 'Lui crier un plan', detail: 'À deux, prenez-le en tenaille.', test: { attribut: 'charisme', base: 0.5 }, succes: { texte: '« Par la gauche ! » Il comprend tout de suite. Vous le prenez en tenaille.', allie: { nom: 'le renfort', degats: 0.15, manches: 3 }, ouverture: 12, moral: { peur: 15 } }, echec: { texte: 'Il ne t’entend pas dans le vacarme et charge droit devant. Il frappera, mais seul.', allie: { nom: 'le renfort', degats: 0.1, manches: 2 } } },
      { id: 'proteger_allie', nom: 'Couvrir son arrivée', detail: 'Qu’il arrive entier.', succes: { texte: 'Tu attires l’attention de {nom} le temps que ton allié arrive. Il prend position, et frappe dès la manche suivante.', allie: { nom: 'le renfort', degats: 0.15, manches: 3 }, subi: 0.05 } },
    ],
    ignore: { texte: 'Ton allié se jette dans la mêlée, comme il peut.', allie: { nom: 'le renfort', degats: 0.1, manches: 2 } },
  },
  {
    id: 'tiers_attaque',
    type: 'intervention',
    poids: 3,
    si: { contextes: ['mission', 'embuscade', 'combat_a_mort', 'duel'], mancheMin: 2 },
    texte: 'Une volée de shuriken s’abat entre vous deux : un troisième larron, caché sur un toit, vous vise tous les deux.',
    choix: [
      { id: 'abri', nom: 'Te mettre à couvert', detail: 'Laisser passer l’orage.', succes: { texte: 'Tu plonges derrière un mur. {nom} n’a pas ta chance : deux lames l’atteignent.', inflige: 0.12, protege: true } },
      { id: 'pousser', nom: 'Le pousser dans la volée', detail: 'Que les lames trouvent {lui}.', test: { attribut: 'agilite', base: 0.4 }, succes: { texte: 'Tu le bouscules au bon moment : la volée le cueille en plein.', inflige: 0.2 }, echec: { texte: 'Vous roulez tous les deux sous la volée. Personne n’y gagne.', inflige: 0.1, subi: 0.1 } },
      { id: 'treve', nom: 'Proposer une trêve pour s’en occuper', detail: 'L’ennemi de mon ennemi…', test: { attribut: 'charisme', base: 0.3 }, succes: { texte: '{Il} hésite, puis hoche la tête. Vous chassez le troisième ensemble, et vous vous regardez ensuite, sans plus savoir où vous en êtes.', fin: 'paix' }, echec: { texte: '{Il} ricane et profite de ton hésitation.', subi: 0.12 } },
    ],
    ignore: { texte: 'Les lames pleuvent sur vous deux.', subi: 0.1, inflige: 0.1 },
  },
  // ── Environnement ──
  {
    id: 'plafond_cede',
    type: 'environnement',
    poids: 6,
    si: { terrains: ['interieur', 'temple', 'ruines', 'forge'], mancheMin: 2 },
    texte: 'Un grondement au-dessus de vous. Le plafond fissuré par les coups commence à céder, et des blocs de pierre se détachent entre vous deux.',
    choix: [
      { id: 'esquiver_debris', nom: 'Esquiver les débris', detail: 'D’abord ne pas être écrasé·e.', test: { attribut: 'agilite', base: 0.55 }, succes: { texte: 'Tu roules sous une poutre au moment où le bloc s’écrase là où tu étais.', protege: true }, echec: { texte: 'Un bloc te frôle l’épaule et t’envoie au sol.', subi: 0.15, protege: true } },
      { id: 'profiter_debris', nom: 'Profiter de la confusion pour frapper', detail: 'Dans la poussière, il ne te voit pas.', test: { attribut: 'discretion', base: 0.45 }, succes: { texte: 'Tu passes entre les blocs qui tombent et tu le frappes là où il ne t’attendait pas.', inflige: 0.15, ouverture: 10 }, echec: { texte: 'Un bloc te barre le chemin ; il t’attend de l’autre côté.', subi: 0.1 } },
      { id: 'sortir', nom: 'Battre en retraite par la brèche', detail: 'Le combat attendra.', succes: { texte: 'Tu files par la brèche avant que tout s’effondre. Derrière toi, le passage se referme : vous êtes séparés.', fin: 'interrompu' } },
    ],
    ignore: { texte: 'Les blocs tombent sur vous deux, sans choisir.', subi: 0.12, inflige: 0.12 },
  },
  {
    id: 'arbre_tombe',
    type: 'environnement',
    poids: 6,
    si: { terrains: ['foret'], mancheMin: 2 },
    texte: 'Un craquement sec : un grand cèdre, entamé par vos coups, bascule lentement vers vous.',
    choix: [
      { id: 'sauter', nom: 'Sauter sur le tronc qui tombe', detail: 'Le prendre de haut.', test: { attribut: 'agilite', base: 0.5 }, succes: { texte: 'Tu cours sur le tronc pendant qu’il tombe et tu bondis sur {lui} depuis le ciel.', ouverture: 15 }, echec: { texte: 'L’écorce se dérobe sous tes pieds ; tu tombes avec l’arbre.', subi: 0.12 } },
      { id: 'pousser_arbre', nom: 'Le faire tomber sur lui', detail: 'Un coup de pied au bon endroit.', test: { attribut: 'force', base: 0.4 }, succes: { texte: 'Un dernier coup sur le tronc, et il bascule de son côté. {Il} plonge trop tard.', inflige: 0.18, etatAdv: ['immobilise', 1] }, echec: { texte: 'L’arbre tombe entre vous, et nulle part ailleurs.', protege: true } },
    ],
    ignore: { texte: 'L’arbre s’abat entre vous dans un fracas de branches. Il faut le contourner.', protege: true },
  },
  {
    id: 'pont_cede',
    type: 'environnement',
    poids: 5,
    si: { terrains: ['montagne', 'route', 'quai'], mancheMin: 2 },
    texte: 'Sous vos pieds, les planches gémissent. Le pont commence à céder, corde après corde.',
    choix: [
      { id: 'traverser', nom: 'Courir jusqu’à la rive', detail: 'Avant qu’il ne lâche.', test: { attribut: 'agilite', base: 0.55 }, succes: { texte: 'Tu atteins la rive au moment où le pont s’effondre. {Il} est de l’autre côté du vide. Le combat s’arrête là, pour aujourd’hui.', fin: 'interrompu' }, echec: { texte: 'Le pont lâche. Tu te rattrapes à une corde, au-dessus du vide, et tu remontes, à bout de souffle.', subi: 0.15 } },
      { id: 'couper', nom: 'Couper les cordes de son côté', detail: 'Qu’il tombe, lui.', test: { attribut: 'agilite', base: 0.35 }, succes: { texte: 'Un kunai, deux cordes : le pont bascule sous {lui}. {Il} se rattrape de justesse, mais ses mains saignent.', inflige: 0.15, etatAdv: ['mains_blessees', 2] }, echec: { texte: 'Le pont bascule du mauvais côté.', subi: 0.12 } },
    ],
    ignore: { texte: 'Le pont tangue ; vous perdez tous les deux l’équilibre.', subi: 0.06, inflige: 0.06 },
  },
  {
    id: 'incendie',
    type: 'environnement',
    poids: 6,
    si: { terrainEtat: ['brulant'], mancheMin: 2 },
    texte: 'Le feu de vos techniques a pris dans les herbes sèches. Il court maintenant tout autour de vous, et la fumée monte.',
    choix: [
      { id: 'barriere', nom: 'Te servir du feu comme d’un mur', detail: 'Qu’il soit entre vous.', succes: { texte: 'Tu te places pour que les flammes soient entre vous. {Il} doit les traverser pour t’atteindre.', protege: true } },
      { id: 'fuir_feu', nom: 'Fuir par la fumée', detail: 'Elle te cache.', test: { attribut: 'discretion', base: 0.5 }, succes: { texte: 'Tu disparais dans la fumée. Quand {il} la traverse, tu n’es plus là.', fin: 'fuite' }, echec: { texte: 'La fumée te prend à la gorge ; tu ressors en toussant, du mauvais côté.', subi: 0.08, etatJoueur: ['desoriente', 1] } },
    ],
    ignore: { texte: 'Le feu vous lèche tous les deux.', subi: 0.06, inflige: 0.06, etatJoueur: ['brule', 2], etatAdv: ['brule', 2] },
  },
  {
    id: 'riviere_deborde',
    type: 'environnement',
    poids: 4,
    si: { terrains: ['cotes', 'quai', 'foret', 'plaine'], mancheMin: 3 },
    texte: 'Un bruit d’eau qui enfle : la rivière, gonflée par l’orage, sort de son lit et envahit le terrain.',
    choix: [
      { id: 'hauteur', nom: 'Gagner un rocher', detail: 'Rester au sec, en hauteur.', succes: { texte: 'Tu bondis sur un rocher. En bas, {il} a de l’eau jusqu’aux genoux.', ouverture: 10, terrain: 'humide' } },
      { id: 'entrainer', nom: 'L’entraîner dans le courant', detail: 'Le courant ne choisit pas.', test: { attribut: 'force', base: 0.4 }, succes: { texte: 'Tu l’agrippes et tu bascules avec lui dans le courant. Il en ressort loin, et plus seul : il n’a plus envie de se battre.', fin: 'fuite_adverse' }, echec: { texte: 'Le courant vous emporte tous les deux, et te recrache contre une souche.', subi: 0.12, terrain: 'humide' } },
    ],
    ignore: { texte: 'L’eau monte, froide et boueuse.', terrain: 'humide', etatJoueur: ['jambe_touchee', 1] },
  },
  {
    id: 'sol_fissure',
    type: 'environnement',
    poids: 4,
    si: { terrainEtat: ['roches', 'boue'], mancheMin: 2 },
    texte: 'Le sol, labouré par vos techniques, se fend sous vos pieds. Une crevasse s’ouvre entre vous.',
    choix: [
      { id: 'enjamber', nom: 'Sauter par-dessus', detail: 'Reprendre le contact.', test: { attribut: 'agilite', base: 0.55 }, succes: { texte: 'Tu franchis la crevasse d’un bond et tu retombes sur {lui}.', ouverture: 12 }, echec: { texte: 'Le bord s’effrite sous ton pied.', subi: 0.1, etatJoueur: ['jambe_touchee', 2] } },
      { id: 'attendre', nom: 'Le laisser venir', detail: 'C’est lui qui devra sauter.', succes: { texte: 'Tu restes de ton côté. {Il} hésite au bord : la crevasse vous sépare, pour cette manche.', protege: true } },
    ],
    ignore: { texte: 'Le sol se dérobe à moitié ; vous vacillez tous les deux.', etatJoueur: ['desoriente', 1], etatAdv: ['desoriente', 1] },
  },
  {
    id: 'fumee_explosion',
    type: 'environnement',
    poids: 4,
    si: { contextes: ['mission', 'embuscade', 'combat_a_mort'], mancheMin: 2 },
    texte: 'Une explosion, quelque part derrière vous : un parchemin oublié a pris feu. Un nuage de fumée noire envahit tout.',
    choix: [
      { id: 'ecouter', nom: 'Fermer les yeux et écouter', detail: 'Le suivre au bruit.', test: { attribut: 'perception', base: 0.4 }, succes: { texte: 'Tu fermes les yeux. Ses pas, à gauche. Tu frappes au bruit, et tu touches.', inflige: 0.12, ouverture: 8 }, echec: { texte: 'Tu frappes au bruit… c’était une pierre qui roulait.', subi: 0.08 } },
      { id: 'se_cacher', nom: 'Te fondre dans la fumée', detail: 'Ne plus être une cible.', succes: { texte: 'Tu te fonds dans la fumée. Pour cette manche, il ne te trouve pas.', protege: true } },
    ],
    ignore: { texte: 'La fumée vous aveugle tous les deux.', etatJoueur: ['desoriente', 1], etatAdv: ['desoriente', 1] },
  },
  // ── Tactique ──
  {
    id: 'deuxieme_technique',
    type: 'tactique',
    poids: 5,
    si: { mancheMin: 3, advSousPct: 50, pasBete: true },
    texte: '{nom} recule d’un pas, essuie le sang de sa bouche, et compose des signes que tu n’avais jamais vus. « Je ne pensais pas devoir utiliser ça contre toi. »',
    choix: [
      { id: 'interrompre', nom: 'L’interrompre tout de suite', detail: 'Avant qu’il finisse ses signes.', test: { attribut: 'agilite', base: 0.45 }, succes: { texte: 'Tu bondis avant le dernier signe. Ton coup lui fait perdre le fil : sa technique meurt dans ses mains.', inflige: 0.08, etatAdv: ['desoriente', 1] }, echec: { texte: 'Trop tard : le dernier signe est posé. La technique part, et elle est pour toi.', subi: 0.2 } },
      { id: 'encaisser', nom: 'Te préparer à encaisser', detail: 'Garde haute, chakra au ventre.', succes: { texte: 'La technique t’atteint de plein fouet, mais tu l’attendais : tu tiens debout.', subi: 0.1, ouverture: 12 } },
    ],
    ignore: { texte: 'Sa technique cachée part, et tu ne l’avais pas vue venir.', subi: 0.18 },
  },
  {
    id: 'chakra_instable',
    type: 'tactique',
    poids: 3,
    si: { mancheMin: 3, joueurSousPct: 45 },
    texte: 'Ton chakra se met à vibrer de travers : trop de techniques, trop vite. Il menace de t’échapper.',
    choix: [
      { id: 'canaliser', nom: 'Le canaliser, calmement', detail: 'Une manche pour te reprendre.', test: { attribut: 'controleChakra', base: 0.5 }, succes: { texte: 'Tu fermes les yeux une seconde, et tu le remets dans son lit. Il t’obéit de nouveau, plus fort qu’avant.', ouverture: 10, protege: false }, echec: { texte: 'Il t’échappe une seconde : tes mains tremblent, tes signes vont souffrir.', etatJoueur: ['mains_blessees', 2] } },
      { id: 'liberer', nom: 'Le laisser exploser vers lui', detail: 'Ce trop-plein, autant le lui envoyer.', test: { attribut: 'controleChakra', base: 0.35 }, succes: { texte: 'Le chakra jaillit de toi en une onde brute qui le renverse.', inflige: 0.15 }, echec: { texte: 'L’onde part dans tous les sens, toi compris·e.', subi: 0.1, inflige: 0.05 } },
    ],
    ignore: { texte: 'Ton chakra déborde : tes signes tremblent.', etatJoueur: ['mains_blessees', 2] },
  },
  // ── Scénario ──
  {
    id: 'message_urgent',
    type: 'scenario',
    poids: 4,
    si: { contextes: ['mission'], mancheMin: 2 },
    texte: 'Un oiseau messager se pose sur une branche au-dessus de toi, un rouleau rouge à la patte : urgence. La mission a changé, et elle est ailleurs.',
    choix: [
      { id: 'partir_mission', nom: 'Rompre le combat et partir', detail: 'La mission avant tout.', succes: { texte: 'Tu lances une bombe de fumée et tu pars vers le nouvel objectif. {nom} reste là, interdit. Vous vous reverrez.', fin: 'interrompu', reputation: 1 } },
      { id: 'finir_vite', nom: 'En finir vite', detail: 'Une manche, pas plus.', succes: { texte: 'Tu n’as plus le temps de jouer. Tu frappes pour en finir.', ouverture: 15, etatJoueur: ['enrage', 1] } },
    ],
    ignore: { texte: 'L’oiseau attend. Chaque manche compte, maintenant.', reputation: -1 },
  },
  {
    id: 'reconnaissance',
    type: 'scenario',
    poids: 3,
    si: { mancheMin: 2, pasBete: true, contextes: ['mission', 'embuscade', 'combat_a_mort', 'duel'] },
    texte: '{nom} s’arrête net et te dévisage. « Attends… Je connais ce visage. Ton père se battait exactement comme toi. »',
    choix: [
      { id: 'demander', nom: 'Lui demander ce qu’il sait', detail: 'Le combat peut attendre une phrase.', succes: { texte: '{Il} parle, du bout des lèvres : une mission, il y a longtemps, et ton père qui l’avait épargné. Sa garde a baissé d’un cran.', moral: { determination: -20, peur: 5 }, ouverture: 8 } },
      { id: 'couper_court', nom: 'Couper court', detail: 'Il cherche à te déstabiliser.', succes: { texte: '« Tais-toi. » Tu frappes avant qu’il finisse sa phrase.', ouverture: 10 } },
    ],
    ignore: { texte: 'Ses mots restent en toi, et te troublent un instant.', etatJoueur: ['desoriente', 1] },
  },
];
