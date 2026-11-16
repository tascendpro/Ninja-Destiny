import type { AdversaireDef, Replique } from '../../engine/combat/types';
import type { Campagne, CombatDuoDef, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import type { EventDef } from '../../engine/types';
import { autre, fait, hash01, noter, planifierCommune, souvenir } from '../../engine/campagne/outils';
import { obtenirArme } from '../../engine/armes';
import { appliquerEffets } from '../../engine/effets';
import { ajouterJournal, nouveauCtx } from '../../engine/etat';

/**
 * Les épées légendaires qu'un homme porte encore. On peut partir sur sa piste, à deux, ou laisser l'autre y aller seul.
 * Le porteur ne fuit pas et ne se rend pas : c'est un combat à mort, pour lui comme pour vous. Gagné à deux, il reste à
 * décider qui prend l'épée ; si chacun la veut pour soi, un duel tranche. Seul, on revient avec la lame, blessé, ou pas du tout.
 */

interface LameQuete {
  lame: string;
  nomLame: string;
  porteur: string;
  nomPorteur: string;
  age: { min: number; max: number };
  rumeur: string;
  entree: string;
  defaite: string;
  /** Où il vous attend, au bout de la piste. */
  attente: string;
  /** Ceux qu'on interroge sur sa façon de se battre. */
  temoins: string;
  /** Ce qui reste d'une légende qu'on laisse dormir. */
  laissee: string;
}

const LAMES: LameQuete[] = [
  {
    lame: 'kubikiribocho',
    nomLame: 'Kubikiribōchō',
    porteur: 'renegat_zanto',
    nomPorteur: 'Kurozawa Zantō',
    age: { min: 16, max: 32 },
    rumeur: 'Un marchand de la côte jure avoir vu Kurozawa Zantō, le déserteur de Kiri, dans un village de pêcheurs à trois jours d’ici. Sur son dos, une lame large comme une porte, avec un trou rond près de la garde. Kubikiribōchō.',
    entree: 'Deux enfants. On m’envoie des enfants, maintenant. Ma lame a faim de fer : elle va se régaler.',
    defaite: 'La lame… la lame se souviendra… de moi…',
    attente: 'sur la grève du village de pêcheurs, assis sur un rocher, la lame plantée dans le sable à côté de lui',
    temoins: 'les pêcheurs, les veuves du port, un vieux passeur qui a vu Zantō couper une barque en deux',
    laissee: 'Sur le chemin du retour, vous croisez une barque coupée en deux, échouée sur la plage. Vous ne vous arrêtez pas.',
  },
  {
    lame: 'samehada',
    nomLame: 'Samehada',
    porteur: 'fukaji',
    nomPorteur: 'Fukaji Mōryō',
    age: { min: 18, max: 36 },
    rumeur: 'On a vu Fukaji Mōryō sur les quais du Pays de l’Eau, au service de gens qu’on ne nomme pas. Une épée enveloppée de bandages, qui bouge toute seule quand on passe trop près. Samehada. Elle mange le chakra de ceux qu’elle touche.',
    entree: 'Votre chakra sent bon. Elle l’a senti avant moi. Approchez : elle n’aime pas attendre.',
    defaite: 'Elle… elle vous choisit… Elle m’a toujours dit… que je n’étais qu’un prêt…',
    attente: 'au bout du dernier quai, dans la brume, l’épée bandée posée en travers des genoux',
    temoins: 'les dockers, un marchand qui lui doit de l’argent, une guérisseuse qui a soigné ceux qu’elle a vidés de leur chakra',
    laissee: 'Ce soir-là, vous mangez du poisson grillé sur le port, et vous ne parlez ni de quais ni d’épées. C’est peut-être la décision la plus sage de votre vie.',
  },
  {
    lame: 'yunagi',
    nomLame: 'Yūnagi, la lame de verre',
    porteur: 'sabure',
    nomPorteur: 'Sabure',
    age: { min: 17, max: 34 },
    rumeur: 'Un caravanier rentré du désert parle d’un déserteur de Suna, Sabure, qui campe dans les ruines de Shōsa. La nuit, on entend une lame chanter dans le vent. Yūnagi, la lame de verre, qu’on croyait ensevelie depuis soixante ans.',
    entree: 'Le sable m’a rendu cette lame. Je ne la rendrai à personne d’autre.',
    defaite: 'Le vent… le vent tourne…',
    attente: 'dans les ruines de Shōsa, debout sur une tour de verre à moitié ensevelie, la lame qui chante au vent',
    temoins: 'les caravaniers, un guide qui refuse d’approcher des ruines, un vieux soldat de Suna qui a vu Yūnagi avant qu’on l’enterre',
    laissee: 'La nuit, quand le vent souffle du désert, vous croyez encore l’entendre chanter. Vous ne le dites ni l’un ni l’autre.',
  },
];

const ID_PISTE = (l: LameQuete) => `mc_lame_${l.lame}`;
const ID_COMBAT = (l: LameQuete) => `combat_lame_${l.lame}`;
const ID_EVT = (l: LameQuete) => `mc_combat_lame_${l.lame}`;
export const ID_PARTAGE = 'mc_lame_partage';
export const ID_DUEL_LAME = 'duel_lame';

const R = (id: string, categorie: Replique['categorie'], texte: string): Replique => ({ id, categorie, texte });
const vivant = (c: Campagne, j: IdJoueur) => c.joueurs[j].statut !== 'mort' && c.joueurs[j].scene.type !== 'fin';
const libre = (c: Campagne, l: LameQuete) => c.joueurs.every((s) => (s.registre[l.lame]?.detenteur ?? '') === `npc:${l.porteur}`);
const lameDe = (id: string) => LAMES.find((l) => l.lame === id);

/** L'épée change de mains : à celui qui la prend, dans les deux vies (le porteur est mort, l'autre sait qui l'a). */
export function donnerLame(c: Campagne, j: IdJoueur): void {
  const l = lameDe(c.quete?.lame ?? '');
  if (!l) return;
  const ctx = nouveauCtx();
  const ok = obtenirArme(c.joueurs[j], l.lame, 'possedee', ctx);
  const o = autre(j);
  c.joueurs[o].registre[l.lame] = { detenteur: ok ? `campagne:${c.creations[j].prenom}` : 'perdue', depuis: c.joueurs[o].jour };
  if (ok) {
    souvenir(c, `lame_${l.lame}`, `${l.nomLame}, qui est revenue à ${c.creations[j].prenom}.`, 4, 'fier');
    noter(c, o, `${l.nomLame} est désormais entre les mains de ${c.creations[j].prenom}.`);
  } else {
    // Certaines lames choisissent leur porteur : elle a refusé, et s'est perdue dans la bataille.
    noter(c, j, `${l.nomLame} n’a pas voulu de toi. Le temps de comprendre, elle avait disparu.`);
    noter(c, o, `${l.nomLame} a refusé ${c.creations[j].prenom}, et elle a disparu.`);
  }
  c.quete = undefined;
}

/** Le porteur est mort : dans les deux vies, il ne reviendra plus. */
function porteurMort(c: Campagne, l: LameQuete): void {
  for (const s of c.joueurs) if (s.pnj[l.porteur]) s.pnj[l.porteur].etat = 'mort';
  c.quete = { lame: l.lame };
  planifierCommune(c, ID_PARTAGE, 0);
}

/** Partir seul : le sort dépend de ce qu'on vaut, et du hasard. On peut ne pas revenir. */
function seul(c: Campagne, j: IdJoueur, l: LameQuete): void {
  const s = c.joueurs[j];
  const valeur = (s.attributs.force + s.attributs.agilite + s.attributs.controleChakra) / 3;
  const t = hash01(c, `lame_seul:${l.lame}:${c.actions.length}`);
  const reussite = t < Math.min(0.6, 0.15 + valeur / 200);
  const mort = !reussite && t > 0.85;
  if (reussite) {
    for (const x of c.joueurs) if (x.pnj[l.porteur]) x.pnj[l.porteur].etat = 'mort';
    c.quete = { lame: l.lame };
    donnerLame(c, j);
    ajouterJournal(s, `Sans personne, sur la piste de ${l.nomPorteur}. Tu rapportes ${l.nomLame}, et des cicatrices que personne n’a vues se faire.`, 3);
    appliquerEffets(s, [{ blessure: { id: `lame_${l.lame}`, nom: `La lame de ${l.nomPorteur}`, gravite: 2, jours: 40 } }], nouveauCtx());
  } else if (mort) {
    s.drapeaux['cause_mort'] = `en affrontant ${l.nomPorteur}, sans personne`;
    appliquerEffets(s, [{ stat: 'jauges.sante', delta: -1000 }], nouveauCtx());
    noter(c, autre(j), `${c.creations[j].prenom} a suivi la piste de ${l.nomPorteur}, sans personne. On a retrouvé son bandeau, trois semaines plus tard, sur une plage.`);
  } else {
    appliquerEffets(s, [{ blessure: { id: `lame_${l.lame}`, nom: `Vaincu par ${l.nomPorteur}`, gravite: 3, jours: 90 } }], nouveauCtx());
    ajouterJournal(s, `${l.nomPorteur} s’en va sans se retourner, et te laisse sur la grève. Tu rampes jusqu’au village le plus proche.`, 3);
    noter(c, autre(j), `On a ramené ${c.creations[j].prenom} de la piste de ${l.nomPorteur}, sur une civière. Sans l’épée.`);
  }
}

export const ADVERSAIRES_LAMES: AdversaireDef[] = LAMES.map((l) => ({
  id: `lame_${l.porteur}`,
  nom: l.nomPorteur,
  genre: 'm',
  niveau: 'selon_age',
  // Un épéiste légendaire : deux crans au-dessus du binôme. Il ne fuit pas, il ne se rend pas.
  ecartNiveau: 2,
  temperament: 'feroce',
  habitudes: [],
  seuils: { fuite: 0, reddition: 0 },
  motivation: `Garder ${l.nomLame}, à tout prix.`,
  voix: { registre: 'familier', tics: [] },
  repliques: [R(`${l.porteur}_entree`, 'entree', l.entree), R(`${l.porteur}_defaite`, 'defaite_adv', l.defaite)],
}));

const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'conflit' as const, categorie: 'mission' as const, lieu: '$ici', enchaine: true, planifieParMoteur: true, si: { drapeau: 'campagne_combat_jamais' } };
export const EVENEMENTS_LAMES: EventDef[] = [
  ...LAMES.map((l) => ({ ...base, id: ID_EVT(l), titre: l.nomPorteur, texte: `${l.nomLame}, et l’homme qui la porte.`, choix: [{ id: 'combattre', texte: 'Combattre', effets: [{ drapeau: 'campagne_combat_vu' }] }] }) as EventDef),
  { ...base, id: 'mc_combat_duel_lame', titre: 'Pour la lame', texte: 'Deux ninjas, une seule épée.', choix: [{ id: 'combattre', texte: 'Combattre', effets: [{ drapeau: 'campagne_combat_vu' }] }] } as EventDef,
];

export const COMBATS_LAMES: CombatDuoDef[] = [
  ...LAMES.map(
    (l): CombatDuoDef => ({
      id: ID_COMBAT(l),
      evenementId: ID_EVT(l),
      mode: 'equipe',
      adversaire: `lame_${l.porteur}`,
      contexte: 'combat_a_mort',
      letal: true,
      plafond: 10,
      enduranceMult: 2,
      victoire: { texte: `${l.nomPorteur} tombe à genoux, puis en avant. ${l.nomLame} glisse de ses doigts et se plante dans le sol, entre vous deux.`, accord: 6, apres: (c) => porteurMort(c, l) },
      defaite: { texte: `${l.nomPorteur} essuie sa lame et s’en va, sans se presser, en vous laissant à terre. Il n’a même pas pris la peine de vous achever.`, accord: 3, souvenir: `${l.nomPorteur}, et la défaite sur la grève.` },
    }),
  ),
  {
    id: ID_DUEL_LAME,
    evenementId: 'mc_combat_duel_lame',
    mode: 'duel',
    adversaire: 'pvp_autre',
    contexte: 'duel',
    plafond: 8,
    victoire: { texte: '', accord: 2 },
    defaite: { texte: '', accord: 2 },
  },
];

function scenePiste(l: LameQuete): SceneCommuneDef {
  return {
    id: ID_PISTE(l),
    titre: `La piste de ${l.nomLame}`,
    age: l.age,
    tirage: 0.55,
    si: (c) => libre(c, l) && !c.quete && !c.separation?.actif && c.joueurs.every((s) => s.rang !== 'eleve'),
    texte: l.rumeur,
    choix: [
      { id: 'traquer', texte: 'Partir sur sa piste, ensemble', famille: 'agir' },
      { id: 'renseigner', texte: 'Se renseigner d’abord sur sa façon de se battre', famille: 'observer' },
      { id: 'laisser', texte: 'Laisser cette lame à sa légende', famille: 'partir' },
    ],
    issues: [
      { cle: 'traquer+traquer', texte: `Trois jours de marche, deux nuits sans feu. Le quatrième matin, ${l.nomPorteur} vous attend ${l.attente}, comme s’il savait.`, lien: { les2: { loyaute: 3 } }, combat: ID_COMBAT(l) },
      { cle: 'renseigner+renseigner', texte: `Une semaine à interroger ${l.temoins}. Vous savez où ${l.nomPorteur} frappe, et quand. Puis vous partez.`, lien: { les2: { respect: 3 } }, accord: 6, combat: ID_COMBAT(l) },
      { cle: 'traquer+renseigner', texte: `{un} veut partir tout de suite ; {deux} insiste pour savoir d’abord. Vous partez avec la moitié des réponses. C’est mieux que rien.`, accord: 3, combat: ID_COMBAT(l) },
      { cle: 'laisser+laisser', texte: `Vous vous regardez, et vous haussez les épaules en même temps. ${l.nomLame} restera loin de vous, et vous resterez vivants. ${l.laissee}`, lien: { les2: { confiance: 2 } }, souvenir: { id: `lame_laissee_${l.lame}`, texte: `${l.nomLame}, que vous avez laissée à sa légende.`, poids: 2, tonalite: 'chaud' } },
      {
        cle: 'laisser+*',
        texte: `{un} ne viendra pas. {deux} part quand même, seul{e:deux}, avant l’aube, sans dire au revoir.`,
        lien: { un: { peur_de_perdre: 8 }, deux: { ressentiment: 5 } },
        apres: (c, un) => seul(c, autre(un), l),
      },
      { cle: 'defaut', texte: `Vous partez, sans plan, sans accord. ${l.nomPorteur} vous attend.`, combat: ID_COMBAT(l) },
    ],
  };
}

export const SCENES_LAMES: SceneCommuneDef[] = [
  ...LAMES.map(scenePiste),
  {
    id: ID_PARTAGE,
    titre: 'Une seule lame',
    dynamique: true,
    si: (c) => !!c.quete && c.joueurs.every((s, j) => vivant(c, j as IdJoueur)),
    texte: (c) => {
      const l = lameDe(c.quete?.lame ?? '');
      return `${l?.nomLame ?? 'L’épée'} est plantée dans le sable, entre vous deux. Ni l’un ni l’autre ne l’a encore touchée. Elle n’ira qu’à un seul.`;
    },
    choix: [
      { id: 'moi', texte: '« Elle me revient. »', famille: 'agir' },
      { id: 'toi', texte: '« Prends-la. Elle est à toi. »', famille: 'proteger' },
    ],
    issues: [
      {
        cle: 'moi+moi',
        texte: 'Vous tendez la main en même temps, et vous vous arrêtez en même temps. Aucun ne cédera. Il n’y a qu’une façon de le savoir.',
        lien: { les2: { rivalite: 10 } },
        combat: ID_DUEL_LAME,
      },
      {
        cle: 'moi+toi',
        texte: '{un} la réclame ; {deux} la laisse à {un}. {un} arrache la lame du sable. Elle est plus lourde qu’on ne croit, et plus légère qu’on ne le craignait.',
        lien: { deux: { respect: 4 }, un: { dette: 8 } },
        apres: (c, un) => donnerLame(c, un),
      },
      {
        cle: 'toi+toi',
        texte: 'Chacun veut que l’autre la prenne. Vous vous la renvoyez trois fois, comme deux idiots, et c’est finalement la lame qui tranche : elle vibre vers l’un des deux, et pas vers l’autre.',
        lien: { les2: { confiance: 5, loyaute: 4 } },
        apres: (c) => {
          const [a, b] = c.joueurs;
          const choisi = (a.jauges.chakraMax + a.attributs.force >= b.jauges.chakraMax + b.attributs.force ? 0 : 1) as IdJoueur;
          donnerLame(c, choisi);
        },
      },
      {
        cle: 'defaut',
        texte: 'Vous ne vous mettez pas d’accord. La lame reste plantée entre vous, jusqu’à ce que l’un se décide à la prendre.',
        apres: (c, un) => donnerLame(c, un),
      },
    ],
  },
];

export const _lames = LAMES;
export const faitLame = fait;
