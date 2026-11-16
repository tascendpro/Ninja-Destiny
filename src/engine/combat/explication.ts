// Ce qui s'est passé, en clair : après chaque manche, ce que tu as fait, ce qu'il faisait vraiment, ce que ça a donné,
// pourquoi, et ce que tu pourrais faire autrement. Avant chaque manche, ce que ta lecture permet d'en conclure.
//
// Rien ici ne tire au hasard ni ne modifie l'état : ce sont des lectures du journal et de l'annonce.
// Les textes gardent les jetons {il}, {Il}, {nom} : la vue les accorde à l'adversaire.
// Chaque chiffre cité est celui du moteur (resolution.ts) : garde −30 %, préparation +25 %, concentration +10 / +20 %.

import type { EntreeManche, Fiabilite, IntentionAdv } from './types';

const OFFENSIVES: IntentionAdv[] = ['attaque', 'technique', 'majeure'];
const estOffensive = (i?: IntentionAdv) => !!i && OFFENSIVES.includes(i);

export interface ExplicationManche {
  /** Ton action, et comment elle est partie. */
  toi: string;
  /** Ce qu'il faisait vraiment, et ce que ta lecture en disait. */
  lui?: string;
  /** Les PV perdus de part et d'autre. */
  bilan: string;
  /** La règle qui a décidé. */
  pourquoi: string;
  /** Ce qui aurait mieux marché, ou ce que ça prépare. */
  conseil?: string;
  ton: 'bon' | 'mauvais' | 'neutre';
}

const FAIT: Record<IntentionAdv, string> = {
  attaque: '{nom} attaquait',
  technique: '{nom} lançait une technique',
  majeure: '{nom} lançait sa grande technique',
  defense: '{nom} se mettait en garde',
  observer: '{nom} t’observait',
  parler: '{nom} voulait parler',
  fuir: '{nom} cherchait à fuir',
  preparer: '{nom} préparait un coup',
};

const LECTURE: Record<Fiabilite, string> = {
  fiable: 'ta lecture était juste',
  vague: 'ta lecture était vague',
  trompeur: '{il} t’a trompé·e sur ses intentions',
};

const TENUE: Record<string, string> = {
  parfaite: 'exécution parfaite (+20 %)',
  instable: 'exécution instable (−30 %)',
  ratee: 'geste raté',
};

/** Les gestes qui frappent (la feinte n'en fait pas partie : elle ne touche personne). */
function frappe(j: EntreeManche): boolean {
  return (j.famille === 'taijutsu' || j.famille === 'ninjutsu' || j.famille === 'arme') && j.choix !== 'feinte';
}

export function expliquerManche(j: EntreeManche): ExplicationManche | undefined {
  if (!j.famille || !j.choix || j.manche <= 0) return undefined;
  const inflige = j.inflige ?? 0;
  const subi = j.subi ?? 0;
  const tenue = j.tenue;
  const toi = frappe(j) && tenue && TENUE[tenue] ? `${j.action}, ${TENUE[tenue]}` : j.action;
  const lui = j.intention ? `${FAIT[j.intention]}${j.techniqueAdv ? ` : ${j.techniqueAdv}` : ''}${j.fiabilite ? ` (${LECTURE[j.fiabilite]})` : ''}.` : undefined;
  const bilan = [inflige > 0 ? `−${inflige} PV pour {nom}` : '', subi > 0 ? `−${subi} PV pour toi` : ''].filter(Boolean).join(' · ') || 'Aucun coup n’a porté.';
  const ton: ExplicationManche['ton'] = inflige > subi ? 'bon' : subi > inflige ? 'mauvais' : j.reussi === true ? 'bon' : j.reussi === false ? 'mauvais' : 'neutre';
  return { toi, lui, bilan, pourquoi: j.lecture, conseil: conseilApres(j, inflige, subi), ton };
}

/** Une seule leçon par manche : celle qui aurait changé l'issue, ou ce que la manche vient d'ouvrir. */
function conseilApres(j: EntreeManche, inflige: number, subi: number): string | undefined {
  const attaquait = estOffensive(j.intention);
  if (frappe(j)) {
    switch (j.issue) {
      case 'predite':
        return '{Il} a lu ton geste. Change d’approche : une technique qu’{il} n’a jamais vue, une feinte d’abord, ou te concentrer (un geste préparé se lit deux fois moins bien).';
      case 'ecrasee':
        return 'Son coup était bien plus fort que le tien. Quand {il} attaque fort, tiens la garde ou esquive : une esquive réussie ouvre sa garde pour ta riposte.';
      case 'dominee':
        return 'Ton coup était juste, mais plus faible que le sien. Esquive d’abord, puis frappe sa garde ouverte.';
      case 'ratee':
        return 'Le geste a lâché. Le pourcentage affiché sur chaque action est ta chance de bien l’exécuter : la fatigue, les blessures et les techniques au-dessus de ton rang la font baisser.';
      case 'annulee':
        return 'Vos coups se valaient. Pour faire pencher l’échange, crée d’abord une ouverture : feinte, esquive réussie, garde tenue.';
      case 'decisive':
        return undefined;
    }
    if (inflige > 0 && subi > 0) return 'Vous avez échangé vos coups : frapper dans son attaque coûte aussi. L’esquiver ou la parer d’abord te laisse frapper seul·e.';
    if (inflige > 0 && j.intention === 'defense') return '{Il} était en garde : ton coup a perdu 30 %. Contre une garde, une feinte ou une technique qui perce fait mieux.';
    if (inflige > 0 && j.intention === 'preparer') return 'Bien joué : frapper pendant qu’{il} prépare fait 25 % de dégâts en plus.';
    return undefined;
  }
  switch (j.choix) {
    case 'feinte':
      if (j.reussi) return 'Sa garde est ouverte : ta prochaine attaque gagne en puissance.';
      return attaquait ? 'Une feinte ne marche que s’{il} attend : contre une attaque, garde ou esquive.' : 'Une feinte se lit quand on la répète, ou face à un œil exercé (vétéran, froid, prudent).';
    case 'garde':
      if (!attaquait) return '{Il} n’attaquait pas : la garde n’a rien protégé. Quand {il} se défend ou observe, prends l’initiative.';
      return subi > 0 ? 'Ta garde a retenu 30 % du coup, et sa garde reste ouverte : ta prochaine attaque en profite.' : undefined;
    case 'esquive':
    case 'permutation':
      if (!attaquait) return 'Esquiver ne sert que s’{il} attaque.';
      return j.reussi ? 'Sa garde est ouverte : c’est le moment de frapper.' : '{Il} était plus rapide. Une lecture fiable de son attaque rend l’esquive plus sûre ; sinon, la garde limite la casse.';
    case 'souffle':
      return subi > 0 ? 'Reprends ton souffle quand {il} se défend, observe ou parle, pas quand {il} attaque.' : undefined;
    case 'concentration':
      return subi > 0 ? 'Te concentrer sous ses coups coûte cher. Fais-le quand {il} se met en garde ou observe.' : 'Ta prochaine attaque partira plus juste (+10 %), plus forte (+20 %), et se lira deux fois moins bien.';
    case 'observer':
      return subi > 0 ? 'Observer sous ses coups coûte : fais-le quand {il} se défend, observe ou prépare.' : undefined;
  }
  if (j.famille === 'defense' && !attaquait) return 'Un abri ne sert que contre une attaque.';
  return undefined;
}

export interface ConseilAnnonce {
  /** Ce que tu lis, en trois mots. */
  mot: string;
  /** Les réponses qui marchent contre ça. */
  conseil: string;
}

/**
 * Ce que ta lecture permet d'en conclure, avant de choisir. Une lecture vague ou trompeuse ne dit rien de sûr : on ne
 * révèle donc l'intention que si l'annonce est fiable (elle la dit déjà en toutes lettres).
 */
export function conseilAnnonce(intention: IntentionAdv, fiabilite: Fiabilite, regles: number): ConseilAnnonce {
  if (fiabilite !== 'fiable')
    return {
      mot: 'Intention incertaine',
      conseil: 'Tu ne sais pas vraiment ce qu’{il} va faire. La garde limite les dégâts quoi qu’il arrive ; observer rend tes prochaines lectures plus sûres.',
    };
  const v2 = regles >= 2;
  const c: Record<IntentionAdv, ConseilAnnonce> = {
    attaque: {
      mot: '{Il} va attaquer',
      conseil: `Garde : −30 % de dégâts. Esquive : réussie, sa garde s’ouvre. Frapper aussi : le plus fort l’emporte${v2 ? ', mais vous échangez des coups. Une feinte ne sert à rien' : ''}.`,
    },
    technique: { mot: '{Il} va lancer une technique', conseil: 'Esquive ou permutation l’évitent ; la garde ou un mur l’amortissent ; une attaque plus puissante la traverse.' },
    majeure: { mot: 'Sa grande technique arrive', conseil: 'Ne l’encaisse pas de face : esquive, permutation, ou la parade qui convient.' },
    defense: {
      mot: '{Il} va se mettre en garde',
      conseil: `Tes coups perdront 30 % (sauf ceux qui percent) et seront mieux lus.${v2 ? ' Bon moment pour feinter, te concentrer, reprendre ton souffle ou observer.' : ' Bon moment pour observer.'}`,
    },
    observer: { mot: '{Il} t’observe', conseil: `{Il} ne frappera pas : ${v2 ? 'te concentrer, feinter ou ' : ''}frapper sa garde ouverte. Ce que tu lui montres, {il} le retient.` },
    preparer: { mot: '{Il} prépare un coup', conseil: 'Frappe maintenant : +25 % de dégâts, {il} ne peut pas lire ton geste, et un coup assez fort brise sa préparation.' },
    parler: { mot: '{Il} veut parler', conseil: '{Il} ne frappera pas. Réponds-lui, ou profites-en.' },
    fuir: { mot: '{Il} cherche à fuir', conseil: 'Sans un coup sérieux (20 % de ses PV) ou un état qui l’immobilise, {il} s’échappe.' },
  };
  return c[intention];
}
