import type { Replique } from '../../engine/combat/types';

/**
 * Les répliques des adversaires sans nom : ceux de tous les combats qui n'ont pas leur propre fiche.
 * Un duel parle à la première personne ; une escouade parle par la voix de son chef.
 * {il}, {Il}, {lui}, {e} s'accordent à l'adversaire ; {nom} est son nom.
 */
const R = (id: string, categorie: Replique['categorie'], texte: string, extra: Partial<Replique> = {}): Replique => ({ id, categorie, texte, ...extra });

export const REPLIQUES_DUEL: Replique[] = [
  R('g_entree_1', 'entree', 'Je ne te connais pas. Ça ne change rien.'),
  R('g_entree_2', 'entree', 'Tu aurais dû faire demi-tour.'),
  R('g_entree_3', 'entree', 'Un de plus. Allons-y.'),
  R('g_entree_4', 'entree', 'Pose ton arme et personne ne saigne. Non ? Comme tu veux.'),
  R('g_reussite_1', 'reussite_joueur', 'Pas mal. Ça ne se reproduira pas.'),
  R('g_reussite_2', 'reussite_joueur', 'Tch. Tu es plus rapide que tu n’en as l’air.'),
  R('g_rate_1', 'rate_joueur', 'C’est tout ?'),
  R('g_rate_2', 'rate_joueur', 'Tes mains tremblent. Je le vois d’ici.'),
  R('g_blessure_1', 'blessure', 'Tu vas payer ça.'),
  R('g_blessure_2', 'blessure', 'Ça… ça fait mal. Bien. Maintenant je suis réveillé.'),
  R('g_imminente_1', 'defaite_imminente', 'Pas comme ça… pas contre toi.'),
  R('g_imminente_2', 'defaite_imminente', 'Attends. Attends…'),
  R('g_decouverte_1', 'decouverte', 'Qu’est-ce que c’était, ça ?'),
  R('g_parade_1', 'parade', 'Trop lent.'),
  R('g_parade_2', 'parade', 'Je l’ai vu venir de loin.'),
  R('g_repetition_1', 'repetition', 'Encore ? Tu n’as rien d’autre ?'),
  R('g_reconnaissance_1', 'reconnaissance', 'Je connais ce geste. Quelqu’un me l’a déjà fait.'),
  R('g_provoque_1', 'provoque', 'Parle encore, et je te coupe la langue.'),
  R('g_paix_1', 'paix', 'Assez. On a tous les deux mieux à faire que mourir ici.'),
  R('g_victoire_1', 'victoire_adv', 'Reste à terre. C’est un conseil.'),
  R('g_victoire_2', 'victoire_adv', 'Tu t’es bien battu·e. Ça ne suffit pas.'),
  R('g_defaite_1', 'defaite_adv', 'Fais… ce que tu as à faire.'),
  R('g_defaite_2', 'defaite_adv', 'On… se reverra.'),
];

export const REPLIQUES_ESCOUADE: Replique[] = [
  R('e_entree_1', 'entree', 'Encerclez la cible. Personne ne frappe seul.'),
  R('e_entree_2', 'entree', 'Seul·e contre nous ? Finissons-en vite.'),
  R('e_entree_3', 'entree', 'Formation en croix. Maintenant.'),
  R('e_reussite_1', 'reussite_joueur', 'Resserrez ! Ne lui laissez pas le temps de respirer !'),
  R('e_reussite_2', 'reussite_joueur', 'Un des nôtres est tombé. Restez groupés, bon sang !'),
  R('e_rate_1', 'rate_joueur', 'La cible fatigue. Maintenant !'),
  R('e_blessure_1', 'blessure', 'Couvrez-moi ! Couvrez-moi !'),
  R('e_imminente_1', 'defaite_imminente', 'Repli… on se replie !'),
  R('e_imminente_2', 'defaite_imminente', 'Ce n’est pas un genin… qui est-ce qu’on nous a envoyé ?'),
  R('e_parade_1', 'parade', 'Prévisible. Gardez la formation.'),
  R('e_repetition_1', 'repetition', 'Toujours la même technique. Écartez-vous dès qu’il y a des signes.'),
  R('e_decouverte_1', 'decouverte', 'Attention, ça, on ne l’avait pas prévu !'),
  R('e_paix_1', 'paix', 'Ça suffit. On rentre. On n’est pas payés assez pour ça.'),
  R('e_victoire_1', 'victoire_adv', 'Attachez la cible. Le chef voudra la voir.'),
  R('e_defaite_1', 'defaite_adv', 'Partez… partez tous…'),
];
