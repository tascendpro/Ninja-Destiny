import type { Condition, Effect, EventDef } from '../../engine/types';

/**
 * L'exil n'est pas une fin : on part sur la route, et la vie continue. Le village, lui, ne t'oublie pas :
 * ses chasseurs te retrouvent un jour, et des années plus tard, c'est lui qui est attaqué.
 */
export function partirEnExil(cause: string): Effect[] {
  return [
    // Le statut (déserteur, exilé) est déjà posé par la scène ; sans lui, on part en exil.
    { si: { statut: 'actif' }, alors: [{ statut: 'exile' }] },
    { drapeau: 'exil_cause', valeur: cause },
    { drapeau: 'lieu_errance', valeur: 'route_commerce' },
    { journal: `Tu quittes ton village (${cause}). La route commence.`, importance: 3 },
    // Exilé·e encore enfant : la première année sur la route se clôt comme celle de ceux qu'on a refusés à l'Académie.
    { si: { chapitre: 1 }, alors: [{ planifier: 'e_quatorze', dansJours: 420 }] },
    { planifier: 'ex_chasseurs_village', dansJours: 380 },
    { retour: 'ex_village_attaque', chance: 1, entre: [1100, 2100] },
  ];
}

const SUR_LA_ROUTE: Condition = { tout: [{ statut: ['errant', 'deserteur', 'exile'] }, { drapeau: 'exil_cause' }] };
const commun = { chapitre: 2, chapitres: [2, 3, 4, 5, 6], arc: 'conflit' as const };

export const EXIL: EventDef[] = [
  {
    id: 'ex_chasseurs_village',
    ...commun,
    titre: 'Les masques de ton village',
    categorie: 'mission',
    lieu: 'route_commerce',
    enchaine: true,
    si: SUR_LA_ROUTE,
    texte: [
      { texte: 'Une auberge au bord de la route, la nuit. Trois silhouettes entrent sans bruit et s’assoient à la table voisine. Masques blancs, bandeaux rayés de ton propre village. L’un d’eux pose un rouleau devant toi : ton portrait, ton nom, et une prime.' },
      { si: { drapeau: 'temoins_choques' }, texte: 'Sous le masque du plus jeune, tu reconnais la voix de {@coequipierA}. {Il:@coequipierA} ne dit pas ton nom. {Il:@coequipierA} n’en a pas besoin.' },
    ],
    choix: [
      {
        id: 'combattre',
        texte: 'Te battre pour rester libre',
        test: {
          type: 'combat',
          difficulte: 58,
          attributs: { agilite: 2, force: 1, perception: 1 },
          maitrises: { ninjutsu: 2, taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tué·e par les chasseurs de son propre village',
          succes: {
            texte: 'Tu les laisses au sol, vivants. Le plus âgé te regarde partir en se tenant le bras. « Ils en enverront d’autres. » Tu le sais. Tu marches quand même.',
            effets: [{ stat: 'social.reputationOmbre', delta: 5 }, { drapeau: 'chasseurs_vaincus' }],
          },
          echec: {
            texte: 'Tu leur échappes par un toit, une côte cassée, en laissant ton sac derrière toi. Ton village sait maintenant sur quelle route te chercher.',
            effets: [{ blessure: { id: 'chasseurs', nom: 'Côte cassée par les chasseurs', gravite: 2, jours: 40 } }, { stat: 'jauges.ryo', delta: -40 }],
          },
        },
      },
      {
        id: 'parler',
        texte: 'Leur parler : tu n’es pas l’ennemi qu’on leur a décrit',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 3, controleEmotionnel: 2 },
          succes: {
            texte: 'Tu parles longtemps. Le plus âgé finit par ranger le rouleau. « On ne t’a pas trouvé·e. Pas cette fois. » Ils partent avant l’aube.',
            effets: [{ drapeau: 'chasseurs_epargnent' }, { stat: 'social.loyaute', delta: 4 }],
          },
          echec: {
            texte: 'Ils t’écoutent sans un geste, puis se lèvent ensemble. Tu sautes par la fenêtre avant qu’ils aient fini de dégainer.',
            effets: [{ stat: 'jauges.fatigue', delta: 30 }],
          },
        },
      },
      {
        id: 'fuir',
        texte: 'Disparaître avant qu’ils te reconnaissent',
        effets: [{ stat: 'jauges.fatigue', delta: 20 }, { stat: 'attributs.discretion', delta: 1 }],
        resultat: 'Tu laisses une pièce sur la table et tu sors par la cuisine. Trois routes plus loin, tu changes de nom.',
      },
    ],
  },
  {
    id: 'ex_village_attaque',
    ...commun,
    titre: 'Ton village brûle',
    categorie: 'guerre',
    lieu: 'route_commerce',
    enchaine: true,
    si: SUR_LA_ROUTE,
    texte: [
      { texte: 'Des années ont passé. Un marchand arrive en courant sur la route, couvert de cendres. « Ton village… » Il n’a pas besoin de finir. Au loin, une colonne de fumée monte au-dessus des arbres, là où tu as grandi. On dit qu’une armée entière l’attaque depuis l’aube.' },
      { si: { drapeau: 'exil_cause', egal: 'fuite après l’échec du coup d’État Uchiha' }, texte: 'Ceux qui t’ont chassé sont là-bas. Ceux que tu aimais aussi. Ce soir, tu ne sais plus très bien qui est qui.' },
    ],
    choix: [
      {
        id: 'defendre',
        texte: 'Y retourner, et te battre pour ceux qui t’ont chassé·e',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { force: 2, agilite: 2, controleEmotionnel: 1 },
          maitrises: { ninjutsu: 2, taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          causeMort: 'tombé·e en défendant le village qui l’avait chassé·e',
          succes: {
            texte: 'Tu arrives par la forêt, dans leur dos. Personne ne t’attendait, ni eux ni les tiens. Quand l’attaque se brise, le Kage te trouve au milieu des décombres, le bandeau d’un autre noué au bras. Il te regarde longtemps. « Rentre. » C’est tout. C’est assez.',
            effets: [{ statut: 'actif' }, { stat: 'social.reputation', delta: 15 }, { stat: 'social.loyaute', delta: 25 }, { drapeau: 'exil_pardonne' }, { journal: 'Tu as défendu ton village contre une armée. Il t’a repris·e.', importance: 3 }],
          },
          echec: {
            texte: 'Tu te bats jusqu’à ne plus sentir tes bras. Le village tient, de justesse, sans toi : on te retrouve inconscient·e dans une rue en ruine. Quand tu te réveilles, tu es déjà de l’autre côté de la frontière. Quelqu’un t’y a porté·e, sans laisser son nom.',
            effets: [{ blessure: { id: 'village_attaque', nom: 'Blessures de la défense du village', gravite: 2, jours: 60 } }, { stat: 'social.reputation', delta: 6 }],
          },
        },
      },
      {
        id: 'regarder',
        texte: 'Regarder la fumée de loin, et ne pas y aller',
        effets: [{ ethique: { compassion: -6 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }],
        resultat: 'Tu restes assis·e sur un rocher jusqu’à ce que la fumée retombe. Tu ne sauras jamais combien de visages connus sont restés là-bas. C’est peut-être mieux comme ça. Ou peut-être pas.',
      },
    ],
  },
];
