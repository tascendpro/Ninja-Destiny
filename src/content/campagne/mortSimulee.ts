import type { Campagne, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import { ageA, autre, bouger, fait, hash01, jourMonde, noter, planifierCommune, souvenir } from '../../engine/campagne/outils';
import { appliquerEffets } from '../../engine/effets';
import { ajouterJournal, nouveauCtx } from '../../engine/etat';
import type { Effect } from '../../engine/types';

/**
 * La mort simulée. Deux frères ou sœurs Uchiha sous le même toit. Un homme au masque de bois propose à l'un de le rendre
 * plus fort, à une condition : que personne ne le cherche. Il faudra que l'autre le voie mourir. Le choc peut éveiller
 * les yeux de celui qui reste ; celui qui part s'entraîne ailleurs, des années, puis revient, et décide pourquoi il revient :
 * retrouver l'autre, l'emmener, ou détruire le village. Celui qui reste ne sait rien, jusqu'au retour.
 * Pendant la séparation, ils ne partagent aucune scène (le moteur tient l'absent à l'écart), et aucun ne peut rien
 * faire envers l'autre. Jetons : {un} {deux} {autre} {moi}, accords {il:x} {Il:x} {le:x}.
 */

export const SCENE_RETOUR_SEPARATION = 'mc_ms_retour';
const ANS = 360;

const vivant = (c: Campagne, j: IdJoueur) => c.joueurs[j].statut !== 'mort' && c.joueurs[j].scene.type !== 'fin';
/** Celui à qui l'offre est faite : toujours le même pour une campagne donnée. */
export const tente = (c: Campagne): IdJoueur => (hash01(c, 'ms:qui') < 0.5 ? 0 : 1);
const absent = (c: Campagne): IdJoueur => c.separation?.absent ?? tente(c);
const nom = (c: Campagne, j: IdJoueur) => c.creations[j].prenom;

/** La trame n'existe que pour deux Uchiha élevés ensemble, dans une campagne sur deux, hors de toute autre trahison. */
export function trameMortSimuleePossible(c: Campagne): boolean {
  return (
    c.lien.type === 'freres' &&
    c.lien.origine !== 'parents_separes' &&
    c.creations.every((x) => x.clan === 'uchiha') &&
    !c.separation &&
    c.fil.etape === 'aucune' &&
    c.joueurs.every((s, j) => vivant(c, j as IdJoueur)) &&
    hash01(c, 'ms:tirage') < 0.5
  );
}

/** La chute : l'un disparaît, l'autre croit l'avoir vu mourir. La séparation commence quand les deux ont lu. */
function chute(c: Campagne, a: IdJoueur): void {
  const b = autre(a);
  c.separation = { absent: a, depuis: jourMonde(c), actif: false };
  const s = c.joueurs[a];
  appliquerEffets(
    s,
    [{ statut: 'deserteur' }, { stat: 'attributs.controleChakra', delta: 6 }, { stat: 'attributs.discretion', delta: 6 }, { stat: 'attributs.force', delta: 3 }, { drapeau: 'mort_simulee' }],
    nouveauCtx(),
  );
  ajouterJournal(s, `Tu as disparu dans le torrent, sous les yeux de ${nom(c, b)}. L’homme au masque attendait plus bas, au bord de l’eau.`, 3);
  ajouterJournal(c.joueurs[b], `${nom(c, a)} a disparu dans le torrent. On n’a jamais retrouvé le corps.`, 3);
  noter(c, b, `On a cherché ${nom(c, a)} pendant neuf jours. On n’a jamais retrouvé le corps. On a enterré un bandeau, sous une pierre trop neuve.`);
  noter(c, a, `L’homme au masque te soigne sans un mot. « Maintenant, tu n’existes plus. C’est le plus difficile. Le reste, je te l’apprendrai. »`);
  fait(c, {
    id: 'mort_simulee',
    texte: `Tu as fait croire à ta mort, sous les yeux de ${nom(c, b)}.`,
    connus: [a],
    preuves: 1,
    cible: b,
    texteCible: `${nom(c, a)} est vivant. La chute, sous tes yeux, n’était qu’une mise en scène.`,
  });
  souvenir(c, 'pont', `Le vieux pont, la nuit où ${nom(c, a)} est tombé.`, 5, 'tragique', [b]);
  souvenir(c, 'pont_chute', `La nuit du pont, et la main de ${nom(c, b)} tendue vers toi.`, 5, 'tragique', [a]);
  planifierCommune(c, SCENE_RETOUR_SEPARATION, (3 + Math.floor(hash01(c, 'ms:retour') * 3)) * ANS);
}

/** Le retour tranché : ils savent tous les deux, désormais. Ce qui suit dépend de ce que chacun a voulu. */
function retrouves(c: Campagne, intention: string): void {
  const a = absent(c);
  const b = autre(a);
  c.separation = { ...c.separation!, actif: false, fini: true, intention };
  const f = c.faits.find((x) => x.id === 'mort_simulee');
  if (f && !f.connus.includes(b)) f.connus.push(b);
  souvenir(c, 'retour_masque', `Le soir du retour de ${nom(c, a)}, assis dans le noir, à sa place à table.`, 5, intention === 'detruire' ? 'tragique' : 'amer');
}

/** Revenir au village : le mort qu'on a enterré redevient un ninja, sous haute surveillance. */
const reintegrer = (c: Campagne, suspicion: number, reputation = 0) => {
  const s = c.joueurs[absent(c)];
  const effets: Effect[] = [{ statut: 'actif' }, { stat: 'social.suspicion', delta: suspicion }];
  if (reputation) effets.push({ stat: 'social.reputation', delta: reputation });
  appliquerEffets(s, effets, nouveauCtx());
};

export const SCENES_MORT_SIMULEE: SceneCommuneDef[] = [
  {
    id: 'mc_ms_offre',
    titre: 'L’homme au masque de bois',
    age: { min: 13, max: 16 },
    privee: (c) => (c.vues.includes('mc_ms_offre') || trameMortSimuleePossible(c) ? tente(c) : undefined),
    texte:
      'Il t’attend au bord du terrain d’entraînement, la nuit, assis sur une borne comme s’il avait toujours été là. Un masque de bois clair, sans un seul trait gravé. Sa voix ne fait pas d’écho, même sous le pont.\n\n« Tu stagnes. Ton village te taille à sa mesure, et sa mesure est petite. Moi, je peux faire de toi ce que tu dois être. Il y a un prix : personne ne doit te chercher. Ni ton clan. Ni {autre}. Surtout pas {autre}. »',
    choix: [
      { id: 'accepter', texte: 'Accepter : disparaître, et revenir plus fort', famille: 'agir' },
      { id: 'refuser', texte: 'Refuser', famille: 'partir' },
      { id: 'raconter', texte: 'Tout raconter à {autre}, dès ce soir', famille: 'parler' },
    ],
    issues: [
      {
        cle: 'accepter',
        texte: '« Dans un mois. Le vieux pont, au-dessus du torrent. Il faudra qu’{il:deux} te voie tomber. Sinon, {il:deux} te cherchera toute sa vie. » Il se lève. Tu ne dors pas, cette nuit-là, ni les suivantes.',
        apres: (c, un) => {
          fait(c, { id: 'pacte_masque', texte: 'Tu as accepté l’offre de l’homme au masque de bois.', connus: [un], preuves: 0 });
          planifierCommune(c, 'mc_ms_pont', 30);
        },
      },
      {
        cle: 'refuser',
        texte: 'Il se lève sans insister. « Dommage. » Tu ne le reverras pas. Mais pendant des semaines, tu chercheras son masque dans chaque foule.',
        souvenir: { id: 'masque_refuse', texte: 'L’homme au masque de bois, et l’offre que tu as refusée.', poids: 3, tonalite: 'fier' },
      },
      {
        cle: 'raconter',
        texte: 'Tu racontes tout à {deux} le soir même. {Il:deux} ne dit rien pendant longtemps. Puis : « Et tu as dit non ? » Tu as dit non. Le lendemain, la borne est vide.',
        apres: (c, un) => {
          fait(c, { id: 'pacte_masque', texte: 'Un homme au masque de bois a proposé à l’un de vous de disparaître. Il a refusé.', connus: [0, 1], preuves: 0 });
          noter(c, autre(un), `${nom(c, un)} t’a tout raconté : un homme au masque de bois lui a proposé de disparaître. ${nom(c, un)} a refusé. Tu le crois. Presque.`);
          bouger(c, un, { confiance: 4 });
          bouger(c, autre(un), { confiance: 6, peur_de_perdre: 6 });
          souvenir(c, 'masque_raconte', 'Le soir où l’un de vous a raconté l’homme au masque de bois.', 4, 'chaud');
        },
      },
    ],
  },
  {
    id: 'mc_ms_pont',
    titre: 'Le vieux pont',
    dynamique: true,
    si: (c) => c.faits.some((f) => f.id === 'pacte_masque' && f.connus.length === 1) && c.joueurs.every((s, j) => vivant(c, j as IdJoueur)),
    texte: (c) =>
      `Le vieux pont au-dessus du torrent, à la nuit tombée. Le vent fait grincer les cordes. ${nom(c, absent(c))} est déjà là quand ${nom(c, autre(absent(c)))} arrive, appuyé à la rambarde, le visage tourné vers l’eau noire.`,
    textePour: (c, j) =>
      j === absent(c)
        ? 'Dans un instant, l’homme au masque fera ce qu’il a promis : une lame, un cri, ta chute dans le torrent. Il te repêchera plus bas. {autre} ne doit jamais savoir. C’est encore le moment de tout arrêter.'
        : '{autre} t’a donné rendez-vous ici, sans dire pourquoi. Depuis un mois, {il:autre} a une voix étrange, et des silences qui ne lui ressemblent pas.',
    choix: [],
    choixPour: (c, j) =>
      j === absent(c)
        ? [
            { id: 'tomber', texte: 'Laisser faire, et tomber', famille: 'agir' },
            { id: 'renoncer', texte: 'Tout arrêter, et tout lui dire', famille: 'parler' },
          ]
        : [
            { id: 'retenir', texte: 'Tendre la main vers {autre}', famille: 'proteger' },
            { id: 'observer', texte: 'Regarder autour de vous : quelque chose cloche', famille: 'observer' },
            { id: 'appeler', texte: 'Appeler {autre} par son nom', famille: 'parler' },
          ],
    issues: [
      {
        cle: 'tomber+retenir',
        texte: 'Une silhouette sort de l’ombre. Une lame, un éclat. {un} bascule par-dessus la rambarde, et la main de {deux} se referme sur le vide, à un doigt de sa manche. Le torrent l’avale. {deux} crie jusqu’à ne plus avoir de voix. Quand {il:deux} rouvre les yeux, ils brûlent, et le monde est devenu net, terriblement net.',
        effets: { deux: [{ eveilDanger: 70 }] },
        apres: (c, un) => chute(c, un),
      },
      {
        cle: 'tomber+observer',
        texte: 'Une silhouette sort de l’ombre. Une lame, un éclat. {un} tombe. {deux} a vu, une demi-seconde trop tard, que la lame n’a pas touché le cœur, que le corps est tombé trop droit. {Il:deux} n’ose pas y croire. {Il:deux} n’ose pas ne pas y croire. Ses yeux brûlent.',
        effets: { deux: [{ eveilDanger: 55 }] },
        apres: (c, un) => {
          chute(c, un);
          const f = c.faits.find((x) => x.id === 'mort_simulee');
          if (f) f.preuves += 2;
          noter(c, autre(un), 'La lame n’a pas touché le cœur. Tu en es presque sûr. Presque.');
        },
      },
      {
        cle: 'tomber+*',
        texte: '{deux} crie le nom de {un}. {un} se retourne, une demi-seconde, et la lame {le:un} cueille à ce moment-là. {Il:un} tombe. Le torrent l’avale. {deux} reste à genoux sur les planches jusqu’à l’aube, les yeux brûlants.',
        effets: { deux: [{ eveilDanger: 65 }] },
        apres: (c, un) => chute(c, un),
      },
      {
        cle: 'renoncer+*',
        texte: '{un} se retourne vers {deux} et dit tout, d’un trait : l’homme au masque, l’offre, le plan, ce soir. Dans l’ombre, quelque chose s’éloigne sans bruit. {deux} ne dit rien. Puis {il:deux} attrape {un} par le col, et le serre si fort qu’{il:un} n’arrive plus à respirer.',
        lien: { les2: { confiance: 8, loyaute: 6 } },
        souvenir: { id: 'pont_renonce', texte: 'Le vieux pont, la nuit où l’un de vous a choisi de rester.', poids: 5, tonalite: 'chaud' },
        apres: (c) => {
          const f = c.faits.find((x) => x.id === 'pacte_masque');
          if (f) f.connus = [0, 1];
        },
      },
    ],
  },
  {
    id: SCENE_RETOUR_SEPARATION,
    titre: 'Revenu d’entre les morts',
    dynamique: true,
    si: (c) => !!c.separation?.actif && c.joueurs.every((s, j) => vivant(c, j as IdJoueur)),
    texte: (c) => {
      const a = absent(c);
      const n = Math.max(1, Math.round((jourMonde(c) - (c.separation?.depuis ?? jourMonde(c))) / ANS));
      return `Un soir, ${nom(c, autre(a))} rentre et sait, avant même d’allumer la lampe, qu’il y a quelqu’un. Assis dans le noir, à la place qu’il occupait toujours à table : ${nom(c, a)}. Le même visage, plus dur. Des yeux qui ont vu ${n} ${n > 1 ? 'années' : 'année'} ailleurs.`;
    },
    textePour: (c, j) =>
      j === absent(c)
        ? `L’homme au masque t’a appris tout ce qu’il avait promis, et des choses qu’il n’avait pas promises. Tu as ${ageA(c.joueurs[j])} ans. Il te reste à décider pourquoi tu es revenu.`
        : 'C’est {autre}. Tu as enterré un bandeau à sa place. Tu as pleuré sur une tombe vide.',
    choix: [],
    choixPour: (c, j) =>
      j === absent(c)
        ? [
            { id: 'retrouver', texte: 'Lui dire la vérité, et rester', famille: 'parler' },
            { id: 'emmener', texte: 'Lui proposer de partir avec toi', famille: 'agir' },
            { id: 'detruire', texte: 'Lui dire de s’écarter : tu es venu pour le village', famille: 'agir' },
          ]
        : [
            { id: 'accueillir', texte: 'Le serrer contre toi, même si…', famille: 'proteger' },
            { id: 'frapper', texte: 'Frapper d’abord, parler ensuite', famille: 'agir' },
            { id: 'suivre', texte: '« Quoi que tu sois venu faire, je ne te perds pas une deuxième fois. »', famille: 'parler' },
          ],
    issues: [
      {
        cle: 'retrouver+accueillir',
        texte: '{un} raconte tout : le masque, le pont, les années. {deux} écoute en {le:un} tenant par la manche, comme si {il:un} pouvait disparaître encore. Le lendemain, {un} se présente au village. On l’interroge pendant des jours. On {le:un} surveillera des années. Mais {il:un} est vivant, et {il:un} est là.',
        lien: { deux: { ressentiment: 10, peur_de_perdre: 15, confiance: -5 }, un: { loyaute: 8, dette: 10 } },
        apres: (c) => {
          retrouves(c, 'retrouver');
          reintegrer(c, 25);
        },
      },
      {
        cle: 'retrouver+suivre',
        texte: '{deux} dit qu’{il:deux} {le:un} suivra n’importe où. {un} répond qu’il ne va nulle part, cette fois. Ils restent assis à la table jusqu’au matin, à se raconter des années perdues.',
        lien: { les2: { loyaute: 10 }, deux: { ressentiment: 5 } },
        apres: (c) => {
          retrouves(c, 'retrouver');
          reintegrer(c, 25);
        },
      },
      {
        cle: 'retrouver+frapper',
        texte: 'Le premier coup part avant le premier mot. {un} ne se défend pas, la première fois. La deuxième, si. Les explications attendront : il faut d’abord que l’un des deux tombe.',
        lien: { deux: { ressentiment: 20 }, un: { dette: 10 } },
        combat: 'duel_honneur',
        apres: (c) => {
          retrouves(c, 'retrouver');
          reintegrer(c, 30);
        },
      },
      {
        cle: 'emmener+suivre',
        texte: '« Viens avec moi. » « Je te l’ai dit : je ne te perds pas une deuxième fois. » Ils partent avant l’aube, sans bandeau. Au village, on trouvera deux lits vides, et on comprendra, trop tard, qu’une tombe était vide depuis le début.',
        lien: { les2: { loyaute: 12, dependance: 8 } },
        effets: { les2: [{ statut: 'deserteur' }, { stat: 'social.reputation', delta: -15 }] },
        apres: (c) => retrouves(c, 'emmener'),
      },
      {
        cle: 'emmener+accueillir',
        texte: '« Viens avec moi. » {deux} le serre contre {lui:deux}, et répond : « Reste. » Ils restent longtemps comme ça, chacun tirant l’autre vers sa vie. C’est {un} qui cède. {Il:un} se présentera au village demain. Pour {deux}.',
        lien: { un: { dette: 12, loyaute: 6 }, deux: { peur_de_perdre: 12 } },
        apres: (c) => {
          retrouves(c, 'emmener');
          reintegrer(c, 30);
        },
      },
      {
        cle: 'emmener+frapper',
        texte: '« Viens avec moi. » La réponse est un poing. {un} encaisse, essuie le sang, et se met en garde. S’il faut gagner {deux} à la loyale, {un} le fera.',
        lien: { deux: { ressentiment: 20 }, un: { rivalite: 10 } },
        combat: 'duel_honneur',
        apres: (c) => retrouves(c, 'emmener'),
      },
      {
        cle: 'detruire+suivre',
        texte: '« Écarte-toi. Je suis venu pour le village. » {deux} ne s’écarte pas. {Il:deux} avance. « Je t’ai dit que je te suivrais. » Cette nuit-là, l’aile est des archives brûle, et deux silhouettes quittent le village par les toits. On ne les reverra pas avant longtemps.',
        lien: { les2: { loyaute: 10, dependance: 10 } },
        effets: { les2: [{ statut: 'deserteur' }, { stat: 'social.reputation', delta: -30 }] },
        apres: (c) => retrouves(c, 'detruire'),
      },
      {
        cle: 'detruire+*',
        texte: '« Écarte-toi. Je suis venu pour le village. » {deux} ne s’écarte pas. Entre {un} et le village, il n’y a plus que {deux}. Ce soir, il n’y aura qu’un seul survivant.',
        lien: { deux: { ressentiment: 30, mefiance: 20 }, un: { rivalite: 15 } },
        combat: 'duel_mort',
        apres: (c) => retrouves(c, 'detruire'),
      },
      {
        cle: 'defaut',
        texte: 'Ils se regardent longtemps, sans un mot. Puis {un} se lève, pose sa main sur l’épaule de {deux}, et reste.',
        lien: { les2: { peur_de_perdre: 10 } },
        apres: (c) => {
          retrouves(c, 'retrouver');
          reintegrer(c, 25);
        },
      },
    ],
  },
];
