import type { Campagne, IdJoueur, SceneCommuneDef } from '../../engine/campagne/types';
import type { GameState } from '../../engine/types';

/**
 * L'oncle Akihiko, vécu à deux (voir evenements/secretsFamille.ts pour la version individuelle).
 *
 * L'un des deux a trouvé la lettre, chez lui, pendant sa propre journée : il connaît peut-être le nom. L'autre a croisé
 * un homme qui lui a posé une question, et a vu un détail (la grue sur le kunai). Chacun ne voit que son indice ; ce qui
 * passe de l'un à l'autre dépend de ce que chacun choisit, en secret, d'en dire. Rien n'est su sans avoir été dit.
 */

const lettre = (s: GameState) => s.drapeaux['lettre'] !== undefined;
const saitLeNom = (s: GameState) => ['insiste', 'famille', 'relue'].includes(String(s.drapeaux['lettre'])) || !!s.drapeaux['lettre_su'];

/** Celui qui a trouvé la lettre (celui qui sait le nom, d'abord). L'autre est celui à qui l'homme a parlé. */
function roles(c: Campagne): { k: IdJoueur; m: IdJoueur } {
  const k = ([0, 1] as IdJoueur[]).find((j) => saitLeNom(c.joueurs[j])) ?? ([0, 1] as IdJoueur[]).find((j) => lettre(c.joueurs[j])) ?? 0;
  return { k, m: (1 - k) as IdJoueur };
}

/** Ce que « de » sait passe à « vers » : le nom (et la piste), ou le détail de la grue. */
function transmettre(c: Campagne, de: IdJoueur, vers: IdJoueur): void {
  const { k } = roles(c);
  const a = c.joueurs[de];
  const b = c.joueurs[vers];
  if (de === k && lettre(a)) {
    b.drapeaux['lettre_su'] = true;
    b.drapeaux['lettre_piste'] = true;
    // L'autre n'a jamais vu le tiroir : il apprend le nom, pas la lettre elle-même.
    b.drapeaux['lettre'] ??= 'entendue';
  } else b.drapeaux['grue'] = true;
}

function clore(c: Campagne): void {
  for (const s of c.joueurs) s.drapeaux['rien_raconte'] = 'a_deux';
}

const memeFamille = (c: Campagne) => c.lien.type === 'freres';

export const SCENES_FAMILLE: SceneCommuneDef[] = [
  {
    id: 'mc_rien_raconte',
    titre: 'Tu ne m’as rien raconté',
    age: { min: 10, max: 14 },
    si: (c) => c.joueurs.some(lettre) && !c.joueurs.some((s) => s.drapeaux['rien_raconte']) && c.joueurs.every((s) => s.statut === 'actif'),
    texte: (c) => {
      const { k, m } = roles(c);
      const K = c.creations[k].prenom;
      const M = c.creations[m].prenom;
      const qui = memeFamille(c) ? 'l’oncle Akihiko' : `l’oncle de ${K}, un certain Akihiko`;
      return `${M} retrouve ${K} au bord du terrain, après la journée, et se laisse tomber dans l’herbe à côté.\n\n« T’as une drôle de tête », dit ${K}.\n\n« Et toi, tu parles trop. »\n\n« Ah. Donc ça s’est bien passé, ta journée ? »\n\n« J’ai croisé quelqu’un. Un type, devant l’Académie. Il connaissait mon nom. » ${M} arrache un brin d’herbe, le tord. « Il m’a demandé si je savais ce qui était arrivé à ${qui}. »\n\n${K} cesse de sourire.\n\n« Attends… Akihiko ? »\n\n« Oui. Pourquoi tu réagis comme ça ? »`;
    },
    textePour: (c, j) => {
      const { k } = roles(c);
      if (j === k)
        return saitLeNom(c.joueurs[j])
          ? 'Ce nom, tu le portes depuis le tiroir : la lettre jaunie, la signature « A. », le visage de ton parent quand il a fallu en parler. Tu sais qu’il n’est pas mort à la guerre. Pas comme on le raconte.'
          : 'Tu penses à l’enveloppe du tiroir, signée d’une seule lettre : « A. ». Tu n’avais jamais eu de nom à mettre dessus. Maintenant, si.';
      return 'Tu n’as pas tout dit. À la ceinture de l’homme, il y avait un kunai avec une grue gravée sur le manche, et en partant, il a murmuré : « Dis-lui que les grues reviennent toujours. » Tu ne sais pas pourquoi, mais ce détail ne te lâche pas.';
    },
    choix: [
      { id: 'dire', texte: 'Dire tout ce que tu sais, sans rien garder', famille: 'parler' },
      { id: 'taire', texte: 'Garder pour toi ce que tu sais', famille: 'partir' },
      { id: 'questionner', texte: 'Poser des questions avant de répondre', famille: 'observer' },
      { id: 'chercher', texte: 'Proposer de retrouver cet homme, ensemble', famille: 'agir' },
    ],
    issues: [
      {
        cle: 'dire+dire',
        texte:
          'Vous parlez en même temps, vous vous arrêtez en même temps, et vous éclatez de rire, nerveusement. Puis tout sort : le tiroir, la lettre, l’homme à la cicatrice, la grue sur le kunai, la phrase qu’il a murmurée. Les deux moitiés d’une même histoire se rejoignent dans l’herbe.\n\n« Les grues reviennent toujours », répète {un}, tout bas. Ni l’un ni l’autre ne sait encore ce que ça veut dire. Mais vous êtes deux à ne pas savoir.',
        lien: { les2: { confiance: 7, loyaute: 4 } },
        accord: 4,
        souvenir: { id: 'grue_herbe', texte: 'Le soir dans l’herbe, où vous avez mis vos deux moitiés d’histoire ensemble.', poids: 4, tonalite: 'chaud' },
        apres: (c) => {
          transmettre(c, 0, 1);
          transmettre(c, 1, 0);
          clore(c);
        },
      },
      {
        cle: 'dire+taire',
        texte:
          '{un} raconte tout, d’une traite, comme on se débarrasse d’un poids. {deux} écoute, hoche la tête, pose les bonnes questions, et ne rend rien en échange.\n\nPlus tard, sur le chemin du retour, {un} se rend compte que la conversation n’a marché que dans un sens. Ça ne fait pas mal tout de suite. Ça fera mal plus tard.',
        lien: { un: { mefiance: 4 }, deux: { dette: 3 } },
        apres: (c, un) => {
          transmettre(c, un, (1 - un) as IdJoueur);
          clore(c);
        },
      },
      {
        cle: 'questionner+dire',
        texte:
          '{un} ne répond pas tout de suite. « Il ressemblait à quoi ? Il t’a dit autre chose ? Pourquoi toi ? » {deux}, pris{e:deux} de court, déballe tout ce qu’{il:deux} sait, et un peu plus. Quand vient le tour de {un}, il fait déjà nuit, et {deux} est trop fatigué{e:deux} pour remarquer qu’on ne lui a presque rien dit.',
        lien: { un: { respect: 2 }, deux: { confiance: 2 } },
        apres: (c, un) => {
          transmettre(c, (1 - un) as IdJoueur, un);
          clore(c);
        },
      },
      {
        cle: 'chercher+chercher',
        texte:
          '« On le retrouve. » Vous l’avez dit ensemble. Le lendemain avant l’aube, vous êtes tous les deux tapis derrière la palissade de l’Académie. Personne. Juste, sur le poteau où l’homme s’était adossé, une encoche fraîche : trois traits, comme trois arbres.\n\nUn chūnin de garde vous surprend et vous ramène chacun par une oreille. Sur le chemin, vous échangez tout ce que vous savez, à voix basse, entre deux réprimandes.',
        lien: { les2: { confiance: 5, loyaute: 6 } },
        accord: 5,
        effets: { les2: [{ stat: 'social.suspicion', delta: 2 }] },
        souvenir: { id: 'trois_traits', texte: 'Les trois traits sur le poteau de l’Académie, et le chūnin qui vous tenait par l’oreille.', poids: 4, tonalite: 'chaud' },
        promesse: { id: 'retrouver_akihiko', texte: 'Retrouver l’homme à la grue, ensemble.' },
        apres: (c) => {
          transmettre(c, 0, 1);
          transmettre(c, 1, 0);
          clore(c);
        },
      },
      {
        cle: 'chercher+taire',
        texte:
          '« On le retrouve, toi et moi. » {un} est déjà debout. {deux} ne bouge pas. « Laisse tomber. Ce sont des histoires d’adultes. » Le ton est trop sec pour être honnête.\n\n{un} y va seul{e:un}, le lendemain. Il n’y a plus personne devant l’Académie. Juste trois traits sur un poteau, que personne d’autre ne remarque.',
        lien: { un: { mefiance: 3, ressentiment: 2 } },
        effets: { un: [{ stat: 'attributs.perception', delta: 1 }, { drapeau: 'lettre_piste' }] },
        apres: (c) => clore(c),
      },
      {
        cle: 'taire+taire',
        texte:
          '« Rien. Un vieux fou, sûrement. » « Sûrement. » Vous regardez le terrain se vider, chacun avec sa moitié de secret. Le silence est confortable, et c’est ce qui est inquiétant.\n\nDes années plus tard, l’un de vous repensera à ce soir-là en se demandant ce qui se serait passé si quelqu’un avait parlé le premier.',
        lien: { les2: { mefiance: 2 } },
        souvenir: { id: 'grue_herbe', texte: 'Le soir où vous vous êtes tus tous les deux, chacun avec sa moitié de secret.', poids: 3, tonalite: 'amer' },
        apres: (c) => clore(c),
      },
      {
        cle: 'accord',
        texte: 'Vous avez la même réaction, au même moment, et ça vous fait rire malgré vous. Le reste vient tout seul : chacun dit ce qu’il sait, un peu, pas tout. Assez pour savoir que l’autre cherche aussi.',
        lien: { les2: { confiance: 4 } },
        accord: 2,
        apres: (c) => {
          transmettre(c, 0, 1);
          transmettre(c, 1, 0);
          clore(c);
        },
      },
      {
        cle: 'defaut',
        texte: 'Vous parlez, mais pas de la même chose. Quand vous vous séparez, chacun pense que l’autre lui cache quelque chose. Chacun a raison.',
        lien: { les2: { mefiance: 2 } },
        apres: (c) => clore(c),
      },
    ],
  },
];
