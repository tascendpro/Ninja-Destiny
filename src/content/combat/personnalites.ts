// Ce que dit un adversaire selon sa personnalité (§3.3, §4.2), quand il n'a pas de réplique à lui pour ce moment.
// Un arrogant ne parle pas comme un prudent ; un froid se tait (une ligne de récit, entre tirets cadratins, dit ce qu'il fait).
// Jetons : {nom}, {Il}/{il}, {lui}, {e} (accord de l'adversaire).

import type { CategorieReplique, Temperament } from '../../engine/combat/types';

type Banque = Partial<Record<CategorieReplique, string[]>>;

export const REPLIQUES_PERSONNALITE: Record<Temperament, Banque> = {
  fier: {
    entree: ['« Toi ? Le village m’insulte. »', '« Je te laisse le premier coup. Tu en auras besoin. »'],
    reussite_joueur: ['« Une égratignure. Tu vas le payer. »'],
    blessure: ['« Impossible… pas toi… »', '« Tu crois m’avoir fait mal ? »'],
    defaite_imminente: ['« Je ne pensais pas devoir utiliser ça contre toi… »'],
    joueur_en_difficulte: ['« C’est tout ce que ton village sait produire ? »', '« À genoux. C’est là qu’est ta place. »'],
    comprise: ['« Encore ça ? Tu n’as rien d’autre ? »'],
    erronee: ['« Je connais ce tour… » Il se trompe, et ça se voit à sa garde.'],
    menace: ['« Tu me menaces, moi ? »'],
    victoire_adv: ['« Rentre chez toi. Et raconte qui t’a battu. »'],
    defaite_adv: ['« Ce n’est… pas fini… »'],
  },
  prudent: {
    entree: ['« Qui t’envoie ? »', '— {nom} ne dit rien. {Il} t’observe, et recule d’un demi-pas.'],
    reussite_joueur: ['« Plus rapide que prévu. » — {Il} change de garde.'],
    blessure: ['— {Il} recule, met de la distance entre vous, et recompose sa garde.'],
    comprise: ['« Ces signes… je les ai déjà vus. »'],
    erronee: ['— {Il} se couvre contre la mauvaise chose. Tu l’as vu hésiter.'],
    defaite_imminente: ['« Ça ne vaut pas ma vie. »'],
    joueur_en_difficulte: ['« Arrête-toi là. Tu ne gagneras rien de plus. »'],
    question: ['« Ça ne te regarde pas. » Mais ses yeux ont filé vers le nord.'],
    supplique: ['« Laisse-moi partir. Personne n’a besoin de savoir. »'],
  },
  froid: {
    entree: ['— {nom} ne parle pas. {Il} se met en garde, et c’est tout.'],
    blessure: ['— {Il} ne cille pas. Le sang coule sur sa main ; {il} ne le regarde même pas.'],
    reussite_joueur: ['— Pas un mot. Juste un regard, plus attentif.'],
    comprise: ['— {Il} a déjà compris. Son pied se place exactement là où ta technique n’ira pas.'],
    erronee: ['— Pour la première fois, {il} hésite : {il} a mal lu.'],
    defaite_imminente: ['« … Bien joué. »'],
    joueur_en_difficulte: ['— {Il} s’approche sans hâte, comme on finit une corvée.'],
    victoire_adv: ['— {Il} essuie sa lame et tourne les talons.'],
    defaite_adv: ['« … Bien joué. »'],
  },
  joueur: {
    entree: ['« Enfin quelqu’un d’intéressant ! »', '« On danse ? »'],
    reussite_joueur: ['« Ha ! Celle-là, je ne l’avais pas vue venir. »'],
    blessure: ['« Aïe. Bon. On arrête de rire, alors. »'],
    comprise: ['« Je l’ai, ton tour. À mon tour d’en faire un. »'],
    erronee: ['« Raté ! Oh… non. C’est moi qui ai raté. »'],
    joueur_en_difficulte: ['« Déjà fatigué·e ? On commençait à peine. »'],
    menace: ['« Oh, j’ai peur ! » Il rit. Un peu moins fort.'],
  },
  feroce: {
    entree: ['« Je vais te briser. »', '— {nom} pousse un cri qui fait trembler les feuilles.'],
    blessure: ['« ENCORE ! »', '— {Il} crache du sang et rit, et charge de plus belle.'],
    reussite_joueur: ['« Tu vas le regretter ! »'],
    joueur_en_difficulte: ['« Lève-toi. Je n’ai pas fini. »'],
    defaite_imminente: ['« Même à genoux, je te mordrai ! »'],
    provoque: ['« Répète ça ! »'],
  },
  desespere: {
    entree: ['« Je n’ai plus rien à perdre. Toi, si. »'],
    blessure: ['« Ça ne m’arrêtera pas. Rien ne m’arrêtera. »'],
    defaite_imminente: ['« Si je tombe, je t’emmène. »'],
    supplique: ['« J’ai une fille. Elle a six ans. »'],
    question: ['« Ils ont brûlé ma maison. Tu veux savoir autre chose ? »'],
  },
  sadique: {
    entree: ['« Tu cours vite, pour quelqu’un qui va mourir lentement. »', '« J’aime quand ils se débattent. »'],
    reussite_joueur: ['« Oh. Tu mords. J’adore ça. »'],
    blessure: ['« Ça, tu vas me le payer en cris. »'],
    joueur_en_difficulte: ['« Tu trembles. Continue, c’est joli. »', '« Supplie. Peut-être que je t’écouterai. »'],
    defaite_imminente: ['« Approche, que je te dise un secret sur ta famille… »'],
    supplique: ['« Pitié… pitié ! » Sa main glisse vers sa manche.'],
    victoire_adv: ['« Ils te trouveront demain. Ou ce qu’il en reste. »'],
    menace: ['« Les menaces, c’est mon métier. Pas le tien. »'],
  },
  honorable: {
    entree: ['« Je suis {nom}. Dis-moi ton nom, que je sache qui j’affronte. »'],
    reussite_joueur: ['« Bien. Très bien. »'],
    blessure: ['« Ton maître t’a bien appris. »'],
    joueur_en_difficulte: ['« Rends-toi. Il n’y a pas de honte à ça. »', '« Je ne frapperai pas un adversaire à terre. Relève-toi. »'],
    defaite_imminente: ['« Tu as gagné. Je ne bougerai plus. »'],
    victoire_adv: ['« Tu t’es bien battu·e. Vis, et reviens plus fort·e. »'],
    defaite_adv: ['« C’était un honneur. »'],
    provoque: ['« Les insultes ne t’apporteront rien. Bats-toi. »'],
  },
  fanatique: {
    entree: ['« Ce que je sers est plus grand que ta vie, et que la mienne. »'],
    blessure: ['« La douleur n’est rien. La cause est tout. »'],
    defaite_imminente: ['« Même mort, je gagnerai. »'],
    joueur_en_difficulte: ['« Tu n’es qu’un obstacle. Les obstacles tombent. »'],
    question: ['« Tu ne comprendrais pas. Personne ne comprend, avant la fin. »'],
    menace: ['« Tu crois que j’ai peur de mourir ? »'],
  },
  terrifie: {
    entree: ['« Attends… attends ! On peut s’arranger ! »', '« Je ne voulais pas… on m’a obligé·e ! »'],
    blessure: ['« Arrête ! Arrête, je t’en prie ! »'],
    reussite_joueur: ['— Ses mains tremblent si fort qu’{il} rate ses signes.'],
    defaite_imminente: ['« J’ai de l’argent ! Prends tout ! »'],
    supplique: ['« Je ne dirai rien, à personne ! Laisse-moi juste partir ! »'],
    menace: ['— {Il} pâlit et recule jusqu’à heurter un arbre.'],
  },
  veteran: {
    entree: ['« Rentre chez toi, petit·e. Je suis fatigué de tuer des enfants. »'],
    reussite_joueur: ['« Bien. Ton maître t’a bien appris. »'],
    blessure: ['« Ça fait longtemps qu’on ne m’avait pas touché. »'],
    comprise: ['« J’ai vu cette technique à la dernière guerre. Elle n’a pas sauvé celui qui l’avait. »'],
    joueur_en_difficulte: ['« Abandonne. Il n’y a rien à gagner ici, pour toi. »'],
    defaite_imminente: ['« Alors c’est ta génération qui prend la relève… Bien. »'],
    victoire_adv: ['« Vis. Et oublie mon visage. »'],
    question: ['« Pourquoi je me bats ? Parce que c’est la seule chose que je sais faire. »'],
  },
};

/** Les réactions du joueur, selon ce qui arrive : on les entend dans sa tête (une seule à la fois). */
export const PENSEES_JOUEUR: Partial<Record<CategorieReplique, string[]>> = {
  joueur_en_difficulte: ['Pas encore… pas maintenant.', 'Si tu tombes ici, qui rentrera le dire ?', 'Respire. Une manche de plus. Juste une.'],
};
