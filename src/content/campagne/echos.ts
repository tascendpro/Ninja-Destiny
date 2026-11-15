import type { AxeLien, Campagne, IdJoueur, PromesseCommune, SceneCommuneDef, SouvenirCommun } from '../../engine/campagne/types';
import { autre, bouger, jourMonde, souvenir } from '../../engine/campagne/outils';
import { appliquerEffets } from '../../engine/effets';
import { nouveauCtx } from '../../engine/etat';
import type { Effect } from '../../engine/types';

/**
 * Les échos : ce que vous avez vécu ensemble revient. Une promesse arrive à échéance, et il faut la tenir ou non ;
 * un souvenir remonte des années plus tard, et on en rit, on le tait, ou on dit enfin ce qu'on n'avait pas dit.
 * Une trace que rien ne relit n'a pas d'importance : ces deux scènes relisent toutes les autres, et ce qu'elles
 * décident (promesse tenue ou rompue, rancune soldée ou ravivée) compte pour l'accord en combat et pour la fin.
 */

export const ECHO_SOUVENIR = 'mc_echo_souvenir';
export const ECHO_PROMESSE = 'mc_echo_promesse';
const ANS = 360;

const age = (c: Campagne, j: IdJoueur) => Math.floor((c.joueurs[j].jour - c.joueurs[j].naissance) / ANS);
const vivant = (c: Campagne, j: IdJoueur) => c.joueurs[j].statut !== 'mort' && c.joueurs[j].scene.type !== 'fin';
const etat = (c: Campagne) => (c.echos ??= { rappels: [] });

export const souvenirEcho = (c: Campagne): SouvenirCommun | undefined => c.lien.souvenirs.find((s) => s.id === c.echos?.souvenir);
export const promesseEcho = (c: Campagne): PromesseCommune | undefined => c.lien.promesses.find((p) => p.id === c.echos?.promesse);

const ilYa = (c: Campagne, jour: number) => {
  const n = Math.max(1, Math.round((jourMonde(c) - jour) / ANS));
  return n === 1 ? 'il y a un an' : `il y a ${n} ans`;
};

/** Planifie le prochain écho, s'il en faut un : au plus un tous les deux ans, une promesse avant un souvenir. */
export function planifierEchos(c: Campagne): void {
  // Jamais pendant une trahison en cours : la révélation, les enquêtes et les dénonciations passent avant les souvenirs.
  if (c.commune || c.resultat || c.combat || c.fin || c.separation?.actif || !['aucune', 'redemption'].includes(c.fil.etape) || c.repercussions.length) return;
  if (!vivant(c, 0) || !vivant(c, 1) || age(c, 0) < 9 || age(c, 1) < 9) return;
  if (c.barrieres.some((b) => b.id === ECHO_SOUVENIR || b.id === ECHO_PROMESSE)) return;
  const e = etat(c);
  const maintenant = jourMonde(c);
  if (e.dernier !== undefined && maintenant - e.dernier < 2 * ANS) return;
  const promesse = c.lien.promesses.find((p) => p.etat === 'en_cours' && maintenant - p.jour >= 3 * ANS && !e.rappels.includes(`p:${p.id}`));
  const souvenirs = c.lien.souvenirs
    .filter((s) => s.poids >= 3 && s.connuDe.length === 2 && maintenant - s.jour >= 4 * ANS && !e.rappels.includes(`s:${s.id}`))
    .sort((a, b) => b.poids - a.poids || a.jour - b.jour);
  const id = promesse ? ECHO_PROMESSE : souvenirs.length ? ECHO_SOUVENIR : undefined;
  if (!id) return;
  e.promesse = promesse?.id;
  e.souvenir = promesse ? undefined : souvenirs[0].id;
  e.dernier = maintenant;
  // Ces deux scènes reviennent : elles ne restent pas dans la liste des scènes déjà vécues.
  c.vues = c.vues.filter((v) => v !== ECHO_SOUVENIR && v !== ECHO_PROMESSE);
  c.barrieres.push({ id, jour: maintenant + 30 });
  c.barrieres.sort((a, b) => (a.introduction ? -1 : b.introduction ? 1 : a.jour - b.jour));
}

// ── Les souvenirs qui reviennent ─────────────────────────────

/** Ce qu'un souvenir remué fait au lien, selon ce qu'il était : la tonalité décide du sens. */
function remuer(c: Campagne, un: IdJoueur, geste: 'sourire' | 'taire' | 'rouvrir' | 'les2_rouvrir'): void {
  const s = souvenirEcho(c);
  const ton = s?.tonalite ?? 'chaud';
  const deux = autre(un);
  const sombre = ton === 'amer' || ton === 'honteux';
  const d = (x: Partial<Record<AxeLien, number>>, qui: IdJoueur[] = [0, 1]) => qui.forEach((j) => bouger(c, j, x));
  if (geste === 'sourire') d(sombre ? { ressentiment: -5, confiance: 2 } : ton === 'tragique' ? { loyaute: 4, peur_de_perdre: 3 } : { confiance: 4, loyaute: 2 });
  if (geste === 'taire') d(sombre ? { mefiance: 2 } : { loyaute: 3, peur_de_perdre: 3 });
  if (geste === 'rouvrir') {
    d(sombre ? { ressentiment: -8, confiance: 3 } : { confiance: 3 }, [un]);
    d(sombre ? { dette: 4, respect: 4 } : { respect: 3 }, [deux]);
  }
  if (geste === 'les2_rouvrir') d(sombre ? { ressentiment: -12, mefiance: -6, confiance: 6 } : { confiance: 6, loyaute: 3 });
  if (s) etat(c).rappels.push(`s:${s.id}`);
  etat(c).souvenir = undefined;
}

export const SCENE_ECHO_SOUVENIR: SceneCommuneDef = {
  id: ECHO_SOUVENIR,
  titre: 'Tu te souviens ?',
  dynamique: true,
  texte: (c) => {
    const s = souvenirEcho(c);
    if (!s) return 'Rien ne l’annonçait. Une odeur, un bruit, un coin de rue, et l’un de vous deux s’arrête net. « Tu te souviens ? » Évidemment.';
    const ouverture: Record<string, string> = {
      chaud: 'Rien ne l’annonçait. Une odeur de friture, un rire d’enfant dans une ruelle, et l’un de vous deux s’arrête net.',
      fier: 'Un genin passe en courant, l’air de vouloir conquérir le monde. L’un de vous deux le suit des yeux, et sourit.',
      amer: 'Vous passez devant un endroit que vous évitez d’habitude. Cette fois, ni l’un ni l’autre ne change de trottoir.',
      honteux: 'Quelqu’un, au marché, raconte une histoire qui ressemble trop à la vôtre. Vous échangez un regard, très bref.',
      tragique: 'Il pleut comme ce jour-là. Pas une averse : cette pluie fine, obstinée, qui ne s’arrête jamais vraiment.',
    };
    return `${ouverture[s.tonalite] ?? ouverture.chaud}\n\n« Tu te souviens ? » ${s.texte} C’était ${ilYa(c, s.jour)}.`;
  },
  choix: [
    { id: 'sourire', texte: 'Sourire, malgré tout', famille: 'parler' },
    { id: 'taire', texte: 'Ne rien dire, et marcher un peu plus près', famille: 'proteger' },
    { id: 'rouvrir', texte: 'Dire enfin ce que tu n’avais jamais dit sur ce jour-là', famille: 'agir' },
  ],
  issues: [
    {
      cle: 'sourire+sourire',
      texte: 'Vous souriez en même temps, et c’est tout ce qu’il fallait. Ce jour-là vous appartient à tous les deux ; il n’a pas besoin d’être raconté.',
      accord: 3,
      apres: (c, un) => remuer(c, un, 'sourire'),
    },
    {
      cle: 'rouvrir+rouvrir',
      texte: 'Vous parlez tous les deux en même temps, puis l’un se tait pour laisser l’autre finir. Ce que chacun n’avait jamais dit tient en trois phrases. Vous restez là jusqu’à la nuit, à réécrire ce jour-là ensemble.',
      accord: 4,
      apres: (c, un) => remuer(c, un, 'les2_rouvrir'),
    },
    {
      cle: 'rouvrir+*',
      texte: '{un} dit enfin ce qu’{il:un} n’avait jamais dit sur ce jour-là. {deux} écoute sans interrompre. Ce n’est pas la réponse qu’on attendait, des deux côtés. Mais c’est une réponse, et elle était due.',
      accord: 2,
      apres: (c, un) => remuer(c, un, 'rouvrir'),
    },
    {
      cle: 'taire+taire',
      texte: 'Vous ne dites rien. Vous marchez un peu plus près l’un de l’autre, jusqu’au bout de la rue, et un peu après. Ça suffit. Ça a toujours suffi.',
      accord: 2,
      apres: (c, un) => remuer(c, un, 'taire'),
    },
    {
      cle: 'defaut',
      texte: 'L’un sourit, l’autre se tait, et le souvenir repart d’où il était venu. Il laisse derrière lui une certitude : ce jour-là, vous étiez deux.',
      accord: 1,
      apres: (c, un) => remuer(c, un, 'sourire'),
    },
  ],
};

// ── Les promesses qui arrivent à échéance ─────────────────────

/** Ce que coûte ou rapporte une promesse tenue, quand elle avait un enjeu concret. */
const TENUE: Record<string, { texte: string; effets?: Effect[] }> = {
  caisse_commune: { texte: 'Vous soulevez la latte du plancher. La boîte en fer est lourde : des années de cinq ryō. Vous la partagez sans compter.', effets: [{ stat: 'jauges.ryo', delta: 40 }] },
  jeudis: { texte: 'Vous ne vous êtes pas parlé depuis des mois. Jeudi soir, la table est gardée, le plateau sorti. Vous vous asseyez tous les deux, sans un mot, et vous jouez.' },
  trois_genin: { texte: 'Trois chūnin, sur l’estrade. Ils cherchent vos visages dans la foule, et les trouvent du premier coup.', effets: [{ stat: 'social.reputation', delta: 5 }] },
  porte_lune: { texte: 'La pleine lune, enfin. Vous redescendez sous le temple. La porte est là. Les sceaux aussi. Vous restez assis devant, à écouter, comme à huit ans.' },
  porte_secret: { texte: 'Quelqu’un vous a demandé, aujourd’hui, s’il y avait quelque chose sous le vieux temple. Vous avez répondu tous les deux, sans vous concerter : « Rien. »' },
  lettres_saison: { texte: 'Le marchand de thé est mort cet hiver. Son fils a repris la route, et les boîtes. Vous lui avez confié la lettre de la saison, comme toujours.', effets: [{ stat: 'social.suspicion', delta: 3 }] },
  col_chaque_annee: { texte: 'Le col, au jour dit. Vous êtes venus tous les deux, malgré la neige, malgré vos villages. Une heure, une année de plus.' },
  parent_tour: { texte: 'Le moment est venu, comme vous saviez qu’il viendrait. Vous vous relayez au chevet, sans jamais vous plaindre, sans jamais compter les nuits.' },
};

function trancher(c: Campagne, un: IdJoueur, issue: 'tenue' | 'rompue', lien: Partial<Record<'un' | 'deux' | 'les2', Partial<Record<AxeLien, number>>>>): void {
  const p = promesseEcho(c);
  const deux = autre(un);
  if (lien.les2) [0, 1].forEach((j) => bouger(c, j as IdJoueur, lien.les2));
  if (lien.un) bouger(c, un, lien.un);
  if (lien.deux) bouger(c, deux, lien.deux);
  if (p) {
    p.etat = issue;
    etat(c).rappels.push(`p:${p.id}`);
    const t = TENUE[p.id];
    if (issue === 'tenue') {
      if (t?.effets) for (const j of [0, 1] as IdJoueur[]) if (vivant(c, j)) appliquerEffets(c.joueurs[j], t.effets, nouveauCtx());
      souvenir(c, `tenue_${p.id}`, `Promesse tenue : ${p.texte}`, 4, 'fier');
    } else souvenir(c, `rompue_${p.id}`, `Promesse rompue : ${p.texte}`, 3, 'amer');
  }
  etat(c).promesse = undefined;
}

export const SCENE_ECHO_PROMESSE: SceneCommuneDef = {
  id: ECHO_PROMESSE,
  titre: 'Ce que vous aviez promis',
  dynamique: true,
  texte: (c) => {
    const p = promesseEcho(c);
    if (!p) return 'Une vieille promesse revient, comme reviennent les dettes : sans prévenir, et au mauvais moment.';
    const t = TENUE[p.id];
    return `Une vieille promesse revient, comme reviennent les dettes : sans prévenir, et au mauvais moment. Vous l’aviez faite ${ilYa(c, p.jour)}.\n\n« ${p.texte} »${t ? `\n\n${t.texte.split('.')[0]}… si vous le voulez encore.` : '\n\nVous étiez plus jeunes. Vous y croyiez. Il est temps de savoir si vous y croyez encore.'}`;
  },
  choix: [
    { id: 'tenir', texte: 'La tenir, même si ça coûte', famille: 'proteger' },
    { id: 'renegocier', texte: 'Dire que tu ne peux plus, et pourquoi', famille: 'parler' },
    { id: 'oublier', texte: 'Laisser filer, sans un mot', famille: 'partir' },
  ],
  issues: [
    {
      cle: 'tenir+tenir',
      texte: 'Vous la tenez. Tous les deux. Ce n’était pas simple, ni pratique, ni raisonnable. C’est justement pour ça qu’on la tient : une promesse facile ne vaut rien.',
      accord: 5,
      apres: (c, un) => trancher(c, un, 'tenue', { les2: { confiance: 6, loyaute: 6 } }),
    },
    {
      cle: 'tenir+renegocier',
      texte: '{un} était prêt à la tenir. {deux} explique, longtemps, pourquoi {il:deux} ne peut plus. {un} écoute, et finit par délier {le:deux}. Ça fait mal. C’est honnête.',
      accord: 1,
      apres: (c, un) => trancher(c, un, 'rompue', { un: { confiance: -2, respect: 4 }, deux: { dette: 5 } }),
    },
    {
      cle: 'renegocier+renegocier',
      texte: 'Vous dites la même chose, presque avec les mêmes mots : vous n’êtes plus les mêmes qu’à l’époque. Vous vous déliez l’un l’autre, sans rancune, et c’est peut-être la promesse la plus adulte que vous ayez jamais tenue.',
      accord: 2,
      apres: (c, un) => trancher(c, un, 'rompue', { les2: { confiance: 3, respect: 3 } }),
    },
    {
      cle: 'tenir+oublier',
      texte: '{un} est venu. {deux} non. {un} attend longtemps, puis rentre seul. Ni l’un ni l’autre n’en reparle. Mais {un} s’en souviendra, chaque fois qu’il faudra compter sur {deux}.',
      accord: -3,
      apres: (c, un) => trancher(c, un, 'rompue', { un: { ressentiment: 10, confiance: -8 }, deux: { dette: 6 } }),
    },
    {
      cle: 'renegocier+oublier',
      texte: '{un} voulait en parler, au moins. {deux} a laissé filer. La promesse meurt sans qu’on l’enterre, et ça laisse un goût de terre dans la bouche.',
      accord: -1,
      apres: (c, un) => trancher(c, un, 'rompue', { un: { ressentiment: 5 }, deux: { mefiance: 2 } }),
    },
    {
      cle: 'oublier+oublier',
      texte: 'Le jour passe. Aucun de vous deux n’en parle. Le lendemain non plus. La promesse s’efface comme une inscription sur un mur qu’on ne repeint plus.',
      accord: -2,
      apres: (c, un) => trancher(c, un, 'rompue', { les2: { mefiance: 3, confiance: -3 } }),
    },
    {
      cle: 'defaut',
      texte: 'Vous n’arrivez pas à vous mettre d’accord sur ce que vous aviez promis exactement. Ça suffit à répondre : la promesse ne tient plus.',
      apres: (c, un) => trancher(c, un, 'rompue', { les2: { confiance: -2 } }),
    },
  ],
};
