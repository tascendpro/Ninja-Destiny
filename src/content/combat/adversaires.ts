import type { AdversaireDef } from '../../engine/combat/types';

/**
 * Les adversaires de l'Affrontement Racine (§8, §18).
 * Le premier est le rival de l'Académie, branché sur la scène pilote : il grandit avec le joueur,
 * se souvient de chaque rencontre (registre) et travaille ce qui l'a battu.
 */
export const ADVERSAIRES: AdversaireDef[] = [
  {
    id: 'rival_academie',
    pnj: '@rival',
    niveau: 'selon_age',
    temperament: 'fier',
    bascule: { vers: 'feroce', quand: 'touche_deux_fois' },
    majeure: { nom: 'Sa botte secrète', puissance: 14, annonce: '{Il} recule de trois pas, serre les poings jusqu’à blanchir les jointures et fixe ton menton. {Il} prépare le coup qu’{il} travaille seul{e} depuis des semaines.' },
    habitudes: [
      { id: 'ouvre_attaque', quand: { manche: 1 }, intention: 'attaque', poids: 45, lisible: true, texte: '{Il} ouvre toujours par une attaque directe, dès la première seconde.' },
      { id: 'observe_garde', quand: { joueurEnGarde: true }, intention: 'observer', poids: 30, lisible: true, texte: 'Quand tu te mets en garde, {il} recule et t’observe au lieu de frapper.' },
      { id: 'charge_bas', quand: { sousPct: 40 }, intention: 'attaque', poids: 35, lisible: true, texte: 'Blessé{e}, {il} charge tête baissée : sa garde s’ouvre.' },
    ],
    seuils: { fuite: 0, reddition: 15 },
    motivation: 'Prouver devant tout le monde qu’{il} vaut mieux que toi.',
    voix: { registre: 'familier', tics: ['tapote son bandeau avant d’attaquer', '« Pas mal. Pas assez. »'] },
    recurrent: true,
    repliques: [
      // Entrée en scène, première rencontre
      { id: 'r_entree_1', categorie: 'entree', texte: 'C’est toi qu’on appelle le prodige de la classe ? Montre-moi.' },
      { id: 'r_entree_2', categorie: 'entree', texte: 'Tout le monde regarde. Parfait. Comme ça, ils verront.' },
      { id: 'r_entree_3', categorie: 'entree', texte: 'Je ne vais pas y aller doucement.' },
      { id: 'r_entree_enfant', categorie: 'entree', texte: 'T’es même pas capable ! Même pas !', quand: { ageMax: 9 } },
      // Revanche : il se souvient
      { id: 'r_rev_perdu', categorie: 'revanche', texte: 'Tu as changé. Ta vitesse, ta garde… même ta façon de respirer avant de frapper. J’ai passé tout ce temps à comprendre pourquoi j’avais perdu.', quand: { rencontresMin: 1, derniereIssue: ['victoire', 'departage_gagne', 'reddition_adverse', 'fuite_adverse'] } },
      { id: 'r_rev_gagne', categorie: 'revanche', texte: 'Je pensais que tu aurais abandonné. Alors montre-moi que tu avais une raison de revenir.', quand: { rencontresMin: 1, derniereIssue: ['defaite', 'departage_perdu', 'fuite'] } },
      { id: 'r_rev_paix', categorie: 'revanche', texte: 'La dernière fois, on s’est arrêtés. Pas aujourd’hui.', quand: { rencontresMin: 1, derniereIssue: ['paix'] } },
      { id: 'r_rev_habitude', categorie: 'revanche', texte: 'Tu ouvres toujours de la même façon. Je m’en souviens encore. Cette fois, je ne suis pas venu{e} pour te regarder progresser.', quand: { rencontresMin: 2, habitudeConnue: true } },
      { id: 'r_rev_generique', categorie: 'revanche', texte: 'Encore toi. Bien. Je n’avais pas fini.', quand: { rencontresMin: 1 } },
      // Réussite et échec du joueur
      { id: 'r_reussite_1', categorie: 'reussite_joueur', texte: 'Pas mal. Pas assez.' },
      { id: 'r_reussite_2', categorie: 'reussite_joueur', texte: 'Coup de chance. Ça n’arrivera pas deux fois.' },
      { id: 'r_reussite_3', categorie: 'reussite_joueur', texte: 'Ça, tu ne le faisais pas la dernière fois.', quand: { rencontresMin: 1 } },
      { id: 'r_rate_1', categorie: 'rate_joueur', texte: 'C’était censé me faire peur ?' },
      { id: 'r_rate_2', categorie: 'rate_joueur', texte: 'Tu as annoncé ton geste avec tes épaules. Tout le monde l’a vu.' },
      { id: 'r_rate_enfant', categorie: 'rate_joueur', texte: 'Ha ! T’as fumé comme une théière !', quand: { ageMax: 11 } },
      // Répétition, reconnaissance, découverte
      { id: 'r_repet_1', categorie: 'repetition', texte: 'Encore ? Tu crois que je n’ai pas compris ?' },
      { id: 'r_repet_2', categorie: 'repetition', texte: 'Deux fois le même geste. Tu me facilites la tâche.' },
      { id: 'r_repet_touche_1', categorie: 'repetition', texte: 'Encore celle-là… et ça passe quand même. Je déteste ça.', quand: { issue: ['touche'] } },
      { id: 'r_repet_touche_2', categorie: 'repetition', texte: 'D’accord, d’accord. Celle-là, je vais devoir l’apprendre.', quand: { issue: ['touche'] } },
      { id: 'r_repet_predite_1', categorie: 'repetition', texte: 'Tu crois que je n’ai pas compris ? Je t’attendais.', quand: { issue: ['predite'] } },
      { id: 'r_repet_predite_2', categorie: 'repetition', texte: 'Trop tard : je l’ai déjà vue. Change de disque.', quand: { issue: ['predite'] } },
      { id: 'r_repet_annulee', categorie: 'repetition', texte: 'La même chose, la même réponse. On peut continuer longtemps comme ça.', quand: { issue: ['annulee', 'dominee'] } },
      { id: 'r_reco_1', categorie: 'reconnaissance', texte: 'C’est exactement ce que j’attendais.', quand: { dejaVue: true } },
      { id: 'r_reco_2', categorie: 'reconnaissance', texte: 'Je l’ai déjà vue, celle-là. J’ai eu le temps d’y penser.', quand: { dejaVue: true } },
      { id: 'r_decouverte_1', categorie: 'decouverte', texte: 'Attends… Cette technique, tu ne l’avais jamais utilisée.', quand: { inedite: true } },
      { id: 'r_decouverte_2', categorie: 'decouverte', texte: 'Quoi ? Tu n’avais jamais montré ça…', quand: { inedite: true } },
      // Parade, blessure, provocation
      { id: 'r_parade_1', categorie: 'parade', texte: 'Tu recules. Tu crois que ça va durer longtemps ?' },
      { id: 'r_parade_2', categorie: 'parade', texte: 'Tu te caches derrière tes bras. Montre-moi plutôt ce que tu sais faire.' },
      { id: 'r_blessure_1', categorie: 'blessure', texte: '… Ça, je l’ai senti.' },
      { id: 'r_blessure_2', categorie: 'blessure', texte: 'Tu frappes plus fort qu’avant.', quand: { rencontresMin: 1 } },
      { id: 'r_provoque_1', categorie: 'provoque', texte: 'Répète ça !' },
      { id: 'r_provoque_2', categorie: 'provoque', texte: 'Tu vas regretter cette phrase.' },
      // Parole
      { id: 'r_nego_1', categorie: 'negociation', texte: 'Parler ? Maintenant ? Tu as peur, c’est ça ?' },
      { id: 'r_nego_2', categorie: 'negociation', texte: 'On parlera quand tu m’auras battu une deuxième fois.', quand: { rencontresMin: 1 } },
      { id: 'r_paix_1', categorie: 'paix', texte: '… D’accord. Pas aujourd’hui. Mais ce n’est pas fini.' },
      { id: 'r_paix_2', categorie: 'paix', texte: 'Tu as raison. Je ne sais même plus pourquoi on se bat.' },
      { id: 'r_reddition', categorie: 'reddition', texte: 'Ça va, ça va ! J’abandonne. Ne le dis à personne.' },
      { id: 'r_imminente_1', categorie: 'defaite_imminente', texte: 'Je ne… je ne suis pas encore à terre !' },
      { id: 'r_imminente_2', categorie: 'defaite_imminente', texte: 'Encore une. Rien qu’une.' },
      { id: 'r_prepa', categorie: 'preparation', texte: 'Tu vas voir ce que je travaille depuis des semaines.' },
      // Conclusions
      { id: 'r_victoire_lu', categorie: 'victoire_adv', texte: 'Tu avais une bonne idée. Tu as juste annoncé ton intention avec tes mains.', quand: { issue: ['predite'] } },
      { id: 'r_victoire_force', categorie: 'victoire_adv', texte: 'Ta technique était propre. La mienne était juste plus forte. Pour l’instant.' },
      { id: 'r_victoire_rev', categorie: 'victoire_adv', texte: 'Cette fois, c’est moi qui t’ai lu. Ne me fais pas attendre aussi longtemps pour la suite.', quand: { rencontresMin: 2 } },
      { id: 'r_defaite_1', categorie: 'defaite_adv', texte: 'Ne te raconte pas d’histoire. La prochaine fois, je ne te laisserai pas une seconde.' },
      { id: 'r_defaite_2', categorie: 'defaite_adv', texte: 'Je ne t’ai pas laissé gagner. Je veux que ce soit clair.' },
      { id: 'r_defaite_rev', categorie: 'defaite_adv', texte: 'J’ai passé tout ce temps à me préparer contre ton ancienne version.', quand: { rencontresMin: 2 } },
      { id: 'r_fuite', categorie: 'fuite_joueur', texte: 'C’est ça, cours ! Tout le monde t’a vu·e !' },
    ],
  },
  /**
   * L'aîné·e, à l'entraînement. Ni inconnu ni ennemi : quelqu'un qui te connaît depuis ta naissance, qui te corrige,
   * te taquine et retient ses coups (sans le dire). Sa fierté ne se dit pas : elle se lit dans ce qu'{il} ne dit pas.
   */
  {
    id: 'aine_entrainement',
    pnj: '@aine',
    niveau: 'selon_age',
    ecartNiveau: 1,
    temperament: 'joueur',
    habitudes: [
      { id: 'aine_teste', quand: { manche: 1 }, intention: 'observer', poids: 40, lisible: true, texte: '{Il} commence toujours par te regarder faire : {il} veut voir si tu as retenu la dernière leçon.' },
      { id: 'aine_puni', quand: { joueurEnGarde: true }, intention: 'attaque', poids: 30, lisible: true, texte: 'Quand tu te recroquevilles derrière ta garde, {il} frappe exprès dedans, pour t’apprendre.' },
    ],
    seuils: { fuite: 0, reddition: 0 },
    motivation: 'Que tu saches te défendre le jour où {il} ne sera pas là.',
    voix: { registre: 'familier', tics: ['te pince l’oreille quand tu baisses la garde', '« Encore. »'] },
    recurrent: true,
    repliques: [
      { id: 'a_entree_1', categorie: 'entree', texte: 'Garde haute. Non, plus haute. Voilà. Maintenant, essaie de me toucher.' },
      { id: 'a_entree_2', categorie: 'entree', texte: 'Je ne vais pas y aller doucement. Enfin… un peu. Ne le dis pas.' },
      { id: 'a_entree_enfant', categorie: 'entree', texte: 'Si tu pleures, on arrête. Si tu ne pleures pas, on arrête aussi, mais plus tard.', quand: { ageMax: 9 } },
      { id: 'a_revanche', categorie: 'revanche', texte: 'Tu as répété depuis la dernière fois. Je le vois à tes pieds. Montre.', quand: { rencontresMin: 1 } },
      { id: 'a_reussite_1', categorie: 'reussite_joueur', texte: 'Aïe ! D’accord. Celle-là, je ne l’ai pas vue venir.' },
      { id: 'a_reussite_2', categorie: 'reussite_joueur', texte: 'Pas mal. … Ne fais pas cette tête-là, j’ai dit « pas mal », pas « bien ».' },
      { id: 'a_rate_1', categorie: 'rate_joueur', texte: 'Tu fermes les yeux quand tu frappes. Tu le fais depuis que tu as six ans.' },
      { id: 'a_rate_2', categorie: 'rate_joueur', texte: 'Tes épaules. Elles annoncent tout. Je t’ai vu·e venir de la maison.' },
      { id: 'a_repet', categorie: 'repetition', texte: 'Encore la même ? Tu crois que j’ai oublié depuis tout à l’heure ?' },
      { id: 'a_parade', categorie: 'parade', texte: 'Bien. Tu te souviens de ce que je t’ai montré.' },
      { id: 'a_blessure', categorie: 'blessure', texte: '… D’accord. Ça, je ne le raconterai à personne.' },
      { id: 'a_difficulte', categorie: 'joueur_en_difficulte', texte: 'Respire. On n’est pas pressés. Personne ne nous regarde.' },
      { id: 'a_victoire', categorie: 'victoire_adv', texte: 'Relève-toi. Tu iras mieux demain. Et je ne dirai rien à {parent}.' },
      { id: 'a_victoire_rev', categorie: 'victoire_adv', texte: 'Moins vite que la dernière fois. Tu me fais travailler, maintenant. C’est bien.', quand: { rencontresMin: 1 } },
      { id: 'a_defaite', categorie: 'defaite_adv', texte: '… Ne t’habitue pas. Et ne le raconte pas à table.' },
      { id: 'a_defaite_rev', categorie: 'defaite_adv', texte: 'Bon. Il va falloir que je m’entraîne, moi aussi. Tu es content·e ?', quand: { rencontresMin: 1 } },
      { id: 'a_paix', categorie: 'paix', texte: 'Tu as raison. On rentre. {Parent} va encore dire qu’on se bat comme des chats.' },
    ],
  },
  /** Un·e coéquipier·ère sous genjutsu : il ou elle te voit comme une menace, et toi, tu ne veux pas lui faire mal. */
  {
    id: 'coequipier_sous_genjutsu',
    pnj: '@coequipierB',
    niveau: 'selon_age',
    temperament: 'terrifie',
    habitudes: [],
    seuils: { fuite: 0, reddition: 0 },
    motivation: 'Échapper à une illusion qui lui montre un monstre là où tu es.',
    voix: { registre: 'familier', tics: [] },
    repliques: [
      { id: 'g_entree', categorie: 'entree', texte: 'Ne m’approche pas ! Sa tête… tu ne vois pas sa tête ?' },
      { id: 'g_reussite', categorie: 'reussite_joueur', texte: '~{Il} chancelle, et pendant une seconde, ses yeux te reconnaissent.' },
      { id: 'g_rate', categorie: 'rate_joueur', texte: 'Tu es avec eux ! Tu es avec eux depuis le début !' },
      { id: 'g_difficulte', categorie: 'joueur_en_difficulte', texte: '~{Il} frappe sans viser, en pleurant. Ce n’est pas toi qu’{il} voit.' },
      { id: 'g_defaite', categorie: 'defaite_adv', texte: '… C’est toi ? C’était toi, depuis le début ?' },
    ],
  },
];
