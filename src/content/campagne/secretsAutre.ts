import type { Campagne, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import type { GameState } from '../../engine/types';
import { ageA, autre, bouger, fait, hash01, jourMonde, noter, planifierCommune, souvenir } from '../../engine/campagne/outils';
import { appliquerEffets } from '../../engine/effets';
import { nouveauCtx } from '../../engine/etat';

/**
 * Ce que l'un apprend sur l'autre. Les secrets viennent de la vraie vie de l'autre (une bête scellée, une lignée qu'on
 * traque, des yeux éveillés en cachette) ; celui qui le découvre choisit seul : en parler à l'autre, se taire, ou le
 * dénoncer. Se taire laisse un fait qu'on porte seul ; dénoncer déclenche une enquête sur l'autre, qui ne saura pas d'où
 * elle vient ; en parler ouvre une scène à deux, où l'autre décide comment recevoir ce qu'on sait de lui.
 */

interface SecretDef {
  id: string;
  /** Le secret existe-t-il dans cette vie ? */
  porte: (s: GameState) => boolean;
  titre: string;
  decouverte: string;
  /** Ce qu'il en coûte, si on le dénonce. */
  enquete: { suspicion: number; reputation: number; note: string };
  aveu: string;
}

const SECRETS: SecretDef[] = [
  {
    id: 'bete',
    porte: (s) => !!s.drapeaux['jinchuriki'],
    titre: 'Ce qui dort sous la peau de {autre}',
    decouverte:
      'Une nuit de mission, {autre} dort mal. Tu te lèves pour {le:autre} réveiller, et tu t’arrêtes net : sous sa tunique, un sceau noir tourne lentement sur son ventre, comme une chose vivante. L’air autour de {lui:autre} est brûlant. Le lendemain matin, {il:autre} a l’air de ne se souvenir de rien.',
    enquete: { suspicion: 25, reputation: -10, note: 'Des ninjas du conseil t’ont convoqué pour vérifier ton sceau, longuement, sans un mot d’explication. Quelqu’un a parlé de la bête.' },
    aveu: '« J’ai vu le sceau. Cette nuit-là, en mission. » {autre} ne bouge plus.',
  },
  {
    id: 'lignee',
    // La glace : seulement la lignée Yuki (un autre sang caché ne gèle pas l'eau).
    porte: (s) => s.secrets.includes('lignee_yuki'),
    titre: 'Le sang de {autre}',
    decouverte:
      'À l’entraînement, une goutte d’eau gèle en l’air entre les doigts de {autre}, une fraction de seconde. {Il:autre} referme la main aussitôt, et regarde autour de {lui:autre}. Il n’y a que toi. Tu sais ce que ça veut dire : une lignée que certains villages traquent encore.',
    enquete: { suspicion: 35, reputation: -8, note: 'On t’a suivi pendant des semaines. On a fouillé ta chambre. On cherchait quelque chose dans ton sang, et quelqu’un savait quoi chercher.' },
    aveu: '« Je t’ai vu geler l’eau. À l’entraînement. » {autre} pâlit d’un coup.',
  },
  {
    id: 'yeux',
    porte: (s) => Object.keys(s.drapeaux).some((k) => /^eveil:(sharingan|mangekyo)/.test(k)),
    titre: 'Les yeux de {autre}',
    decouverte:
      'Dans le reflet d’une flaque, juste avant qu’{il:autre} cligne des yeux, tu as vu leur couleur changer. Rouge, avec des virgules noires qui tournaient. Puis plus rien. {autre} n’en a jamais parlé à personne. Pas même à toi.',
    enquete: { suspicion: 15, reputation: 3, note: 'Les anciens de ton clan t’ont fait venir. Ils savaient pour tes yeux. Quelqu’un le leur a dit avant que tu ne le fasses.' },
    aveu: '« Tes yeux. Je les ai vus changer. » {autre} détourne le regard, par réflexe.',
  },
];

const PRIVEE = (id: string) => `mc_sa_${id}`;
const AVEU = (id: string) => `mc_sa_${id}_aveu`;

/** Qui peut découvrir le secret de l'autre : les deux vivants, assez grands, et le secret pas déjà su. */
function decouvreur(c: Campagne, d: SecretDef): IdJoueur | undefined {
  if (c.separation?.actif) return undefined;
  const candidats = ([0, 1] as IdJoueur[]).filter((j) => {
    const o = autre(j);
    return c.joueurs.every((s) => s.statut !== 'mort') && ageA(c.joueurs[j]) >= 11 && d.porte(c.joueurs[o]) && !c.faits.some((f) => f.id === `secret_${d.id}_${o}`);
  });
  if (!candidats.length) return undefined;
  // Si les deux portent un secret de ce genre, un seul découvre celui de l'autre (toujours le même pour une campagne).
  return candidats.length === 1 ? candidats[0] : hash01(c, `sa:${d.id}`) < 0.5 ? 0 : 1;
}

function scenesDe(d: SecretDef): SceneCommuneDef[] {
  const cle = (o: IdJoueur) => `secret_${d.id}_${o}`;
  return [
    {
      id: PRIVEE(d.id),
      titre: d.titre,
      age: { min: 11 },
      // Une fois vécue, la scène reste privée à celui qui a découvert (le fait garde la trace : secret_<id>_<porteur>).
      privee: (c) => {
        const f = c.faits.find((x) => x.id.startsWith(`secret_${d.id}_`));
        return f ? autre(Number(f.id.split('_').at(-1)) as IdJoueur) : decouvreur(c, d);
      },
      texte: d.decouverte,
      choix: [
        { id: 'parler', texte: 'Lui en parler, en face', famille: 'parler' },
        { id: 'taire', texte: 'Garder ça pour toi', famille: 'observer' },
        { id: 'denoncer', texte: 'Le signaler à un supérieur', famille: 'agir' },
      ],
      issues: [
        {
          cle: 'parler',
          texte: 'Tu ne dis rien sur le moment. Tu attendras un moment à l’écart, avec {autre}. Ce genre de chose ne se dit pas devant les autres.',
          apres: (c, j) => {
            fait(c, { id: cle(autre(j)), texte: `Tu sais le secret de ${c.creations[autre(j)].prenom}.`, connus: [j], preuves: 0, cible: autre(j) });
            planifierCommune(c, AVEU(d.id), 20);
          },
        },
        {
          cle: 'taire',
          texte: 'Tu n’en parles à personne. Ni à {autre}, ni à qui que ce soit. Mais chaque fois que {il:autre} te regarde, tu te demandes s’{il:autre} sait que tu sais.',
          apres: (c, j) => {
            fait(c, { id: cle(autre(j)), texte: `Tu portes seul le secret de ${c.creations[autre(j)].prenom}.`, connus: [j], preuves: 1, cible: autre(j) });
            souvenir(c, `tu_${d.id}`, `Le secret de ${c.creations[autre(j)].prenom}, que tu as gardé pour toi.`, 4, 'amer', [j]);
            bouger(c, j, { loyaute: 5 });
          },
        },
        {
          cle: 'denoncer',
          texte: 'Tu demandes à voir un supérieur. Tu racontes ce que tu as vu, en choisissant tes mots. On te remercie, on te dit de n’en parler à personne. Surtout pas à {autre}.',
          apres: (c, j) => {
            const o = autre(j);
            fait(c, { id: cle(o), texte: `Tu as dénoncé le secret de ${c.creations[o].prenom}.`, connus: [j], preuves: 2, cible: o, texteCible: `${c.creations[j].prenom} a révélé ton secret à tes supérieurs.` });
            c.repercussions.push({ jour: c.joueurs[o].jour + 60 + Math.floor(hash01(c, `sa:enq:${d.id}`) * 120), cible: o, type: 'enquete', faitId: cle(o) });
            appliquerEffets(c.joueurs[o], [{ stat: 'social.suspicion', delta: d.enquete.suspicion }, { stat: 'social.reputation', delta: d.enquete.reputation }], nouveauCtx());
            noter(c, o, d.enquete.note);
            bouger(c, j, { dette: 6, mefiance: 4 });
          },
        },
      ],
    },
    {
      id: AVEU(d.id),
      titre: 'Ce que tu sais',
      dynamique: true,
      si: (c) => c.faits.some((f) => f.id.startsWith(`secret_${d.id}_`) && f.connus.length === 1),
      texte: (c) => {
        const f = c.faits.find((x) => x.id.startsWith(`secret_${d.id}_`));
        const o = Number(f?.id.split('_').at(-1) ?? 1) as IdJoueur;
        return `Le soir, loin des autres. ${c.creations[autre(o)].prenom} a quelque chose à dire, et ${c.creations[o].prenom} le sent avant le premier mot.`;
      },
      textePour: (c, j) => {
        const f = c.faits.find((x) => x.id.startsWith(`secret_${d.id}_`));
        const o = Number(f?.id.split('_').at(-1) ?? 1) as IdJoueur;
        return j === o ? 'Tu sais très bien de quoi il va être question. Tu l’as toujours su, que ce jour viendrait.' : d.aveu;
      },
      choix: [],
      choixPour: (c, j) => {
        const f = c.faits.find((x) => x.id.startsWith(`secret_${d.id}_`));
        const o = Number(f?.id.split('_').at(-1) ?? 1) as IdJoueur;
        return j === o
          ? [
              { id: 'tout_dire', texte: 'Tout lui raconter, enfin', famille: 'parler' },
              { id: 'nier', texte: 'Nier, en le regardant dans les yeux', famille: 'partir' },
              { id: 'menacer', texte: '« Si tu en parles à qui que ce soit… »', famille: 'agir' },
            ]
          : [
              { id: 'proteger', texte: '« Personne ne le saura. Jamais. »', famille: 'proteger' },
              { id: 'comprendre', texte: 'Lui demander depuis quand il le porte seul', famille: 'observer' },
            ];
      },
      issues: [
        {
          cle: 'tout_dire+proteger',
          texte: '{un} raconte tout, et c’est plus long que prévu : les années, la peur, les nuits. {deux} écoute jusqu’au bout, puis répète, très simplement : « Personne ne le saura. » Un secret porté à deux pèse moitié moins.',
          lien: { un: { confiance: 12, dette: 6 }, deux: { loyaute: 10 } },
          accord: 5,
          souvenir: { id: `aveu_${d.id}`, texte: 'Le soir où un secret s’est mis à se porter à deux.', poids: 5, tonalite: 'chaud' },
          apres: (c) => c.faits.filter((f) => f.id.startsWith(`secret_${d.id}_`)).forEach((f) => (f.connus = [0, 1])),
        },
        {
          cle: 'tout_dire+comprendre',
          texte: '« Depuis quand ? » La question fait plus de bien que n’importe quelle promesse. {un} répond. Ça remonte à loin. Ça remonte à avant vous.',
          lien: { un: { confiance: 10 }, deux: { respect: 8, peur_de_perdre: 5 } },
          accord: 4,
          souvenir: { id: `aveu_${d.id}`, texte: 'La question « depuis quand ? », et la réponse qui remontait à loin.', poids: 4, tonalite: 'chaud' },
          apres: (c) => c.faits.filter((f) => f.id.startsWith(`secret_${d.id}_`)).forEach((f) => (f.connus = [0, 1])),
        },
        {
          cle: 'nier+*',
          texte: '« Tu as mal vu. » {un} le dit calmement, sans ciller. {deux} hoche la tête. Ni l’un ni l’autre n’y croit. Quelque chose vient de se fermer entre vous, doucement, comme une porte qu’on pousse du pied.',
          lien: { un: { mefiance: 8 }, deux: { confiance: -8, mefiance: 6 } },
          accord: -2,
        },
        {
          cle: 'menacer+*',
          texte: '« Si tu en parles à qui que ce soit… » {un} ne finit pas sa phrase. Ce n’est pas nécessaire. {deux} n’a jamais eu peur de {lui:un} avant ce soir.',
          lien: { un: { mefiance: 10 }, deux: { ressentiment: 12, confiance: -10 } },
          accord: -4,
          souvenir: { id: `aveu_${d.id}`, texte: 'La menace, le soir où tu as voulu l’aider.', poids: 4, tonalite: 'amer' },
        },
        {
          cle: 'defaut',
          texte: 'Les mots ne viennent pas. Vous restez assis côte à côte jusqu’à ce que la lampe s’éteigne. Le secret est toujours là, entre vous ; mais il n’est plus seul.',
          lien: { les2: { confiance: 3 } },
          apres: (c) => c.faits.filter((f) => f.id.startsWith(`secret_${d.id}_`)).forEach((f) => (f.connus = [0, 1])),
        },
      ],
    },
  ];
}

export const SCENES_SECRETS_AUTRE: SceneCommuneDef[] = SECRETS.flatMap(scenesDe);
export const _pourTests = { SECRETS, decouvreur, jourMonde };
