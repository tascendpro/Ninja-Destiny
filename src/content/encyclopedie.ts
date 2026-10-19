import type { EntreeEncyclopedie } from '../engine/types';
import { VILLAGES, ELEMENTS } from './monde';
import { CLANS } from './clans';
import { MAITRISES } from './maitrises';
import { ARMES } from './armes';
import { METIERS } from './metiers';
import { PNJ } from './pnj';
import { LIEUX } from './lieux';
import { BIJUS } from './bijus';

const RARETE: Record<string, string> = {
  commune: 'Commune',
  qualite: 'De qualité',
  maitre: 'De maître',
  legendaire: 'Légendaire',
  maudite: 'Maudite',
};

const generees: EntreeEncyclopedie[] = [
  ...VILLAGES.map((v) => ({
    id: `village:${v.id}`,
    categorie: 'village' as const,
    titre: `${v.nom} — ${v.nomComplet}`,
    resume: v.philosophie,
    details: [
      `${v.pays}. ${v.kage} : ${v.kageNom}.`,
      v.situation,
      `Avantages : ${v.avantages.join(', ')}.`,
      `Contraintes : ${v.contraintes.join(', ')}.`,
      `Tensions : ${v.tensions.join(' ; ')}.`,
      `Alliés : ${v.allies.join(', ') || 'aucun'}. Ennemis : ${v.ennemis.join(', ') || 'aucun déclaré'}.`,
      `Armes traditionnelles : ${v.armesTraditionnelles.join(', ')}.`,
    ],
    publique: true,
  })),
  ...ELEMENTS.map((e) => ({
    id: `element:${e.id}`,
    categorie: 'technique' as const,
    titre: `${e.kanji} ${e.nom}`,
    resume: e.description,
    details: [`Fort contre ${ELEMENTS.find((x) => x.id === e.fortContre)?.nom}, faible contre ${ELEMENTS.find((x) => x.id === e.faibleContre)?.nom}.`],
    publique: true,
  })),
  ...CLANS.map((c) => ({
    id: `clan:${c.id}`,
    categorie: 'clan' as const,
    titre: c.nom,
    resume: c.histoire,
    details: [
      `Villages : ${c.villages.map((v) => VILLAGES.find((x) => x.id === v)?.nom).join(', ')}.`,
      `Avantages : ${c.avantages.join(' ; ')}.`,
      `Faiblesses : ${c.faiblesses.join(' ; ')}.`,
      `Relations : ${c.relations}`,
      `Personnages : ${c.personnages}`,
      `Histoire : ${c.evenementsHistoriques}`,
      `Accès aux techniques avancées : ${c.accesAvance}`,
      `Contreparties : ${c.contreparties}`,
    ],
    publique: true,
  })),
  ...MAITRISES.filter((m) => m.kind === 'clan').map((m) => ({
    id: `pouvoir:${m.id}`,
    categorie: 'pouvoir' as const,
    titre: m.nom,
    resume: m.description,
    details: [
      ...(m.eveil
        ? [
            m.eveil.automatique !== undefined
              ? `Éveil : par l’éducation du clan, vers ${m.eveil.automatique} ans.`
              : `Éveil : sous un déclencheur narratif, entre ${m.eveil.ageMin} et ${m.eveil.ageMax} ans. Tous ne l’éveillent pas.`,
          ]
        : []),
      ...m.paliers.map((p, i) => `Palier ${i} — ${p.nom} : ${p.effet}`),
      `Coût : ${m.cout}`,
    ],
  })),
  ...MAITRISES.filter((m) => m.composantes).map((m) => ({
    id: `pouvoir:${m.id}`,
    categorie: 'pouvoir' as const,
    titre: m.nom,
    resume: m.description,
    details: [
      'Nature de fusion : on naît porteur de la lignée ou non. Elle reste latente jusqu’à l’éveil de ses deux natures, puis s’éveille d’elle-même.',
      `Lignée présente à : ${Object.keys(m.lignee ?? {}).map((v) => VILLAGES.find((x) => x.id === v)?.nom).join(', ')}.`,
      'Elle ne dépasse jamais d’un palier la plus faible de ses deux natures.',
      ...m.paliers.map((p, i) => `Palier ${i} — ${p.nom} : ${p.effet}`),
      `Coût : ${m.cout}`,
    ],
  })),
  ...MAITRISES.filter((m) => m.kind === 'jutsu').map((m) => ({
    id: `technique:${m.id}`,
    categorie: 'technique' as const,
    titre: m.nom,
    resume: m.description,
    details: [`Rang ${m.rang}.`, m.kekkeiGenkai ? 'Technique héréditaire : impossible à copier ou à apprendre hors de sa lignée.' : 'Peut s’apprendre auprès d’un mentor ou d’un parchemin.', `Coût : ${m.cout}`],
  })),
  ...ARMES.map((a) => ({
    id: `arme:${a.id}`,
    categorie: 'arme' as const,
    titre: a.nom,
    resume: a.description,
    details: [
      `Rareté : ${RARETE[a.rarete]}${a.unique ? ' — exemplaire unique' : ''}.`,
      ...(a.histoire ? [a.histoire] : []),
      ...(a.exigences.force || a.exigences.palierFamille
        ? [`Exige : ${[a.exigences.force ? `force ${a.exigences.force}` : '', a.exigences.palierFamille ? `palier ${a.exigences.palierFamille} dans sa famille d’armes` : ''].filter(Boolean).join(', ')}.`]
        : []),
      ...a.capacites.map((c) => `${c.nom} : ${c.description}`),
      ...(a.contreparties.length ? [`Contreparties : ${a.contreparties.join(' ; ')}.`] : []),
      ...(a.licence === 'naruto' ? ['Lame issue de l’univers de référence.'] : []),
    ],
    publique: !a.unique,
  })),
  ...METIERS.map((m) => ({
    id: `metier:${m.id}`,
    categorie: 'metier' as const,
    titre: m.nom,
    resume: m.description,
    details: [
      `Âge minimum : ${m.ageMin} ans${m.ageMinProdige !== undefined ? ` (${m.ageMinProdige} pour un prodige)` : ''}${m.rangMin ? `, rang ${m.rangMin}` : ''}.`,
      `Avantages : ${m.avantages.join(' ; ')}.`,
      `Contraintes : ${m.contraintes.join(' ; ')}.`,
      `Paliers : ${m.paliers.join(' → ')}.`,
      m.canal === 'secret' ? 'Métier de l’ombre : ta réputation publique ne grandit pas.' : 'Réputation publique.',
      ...(m.disponible ? [] : ['Contenu jouable dans un chapitre ultérieur.']),
    ],
    publique: true,
  })),
  ...PNJ.map((p) => ({
    id: `pnj:${p.id}`,
    categorie: 'personnage' as const,
    titre: p.nom,
    resume: p.personnalite,
    details: [p.histoire, `Objectifs : ${p.objectifs}`, `Limites : ${p.limites}`].filter((x) => x && !x.endsWith(': ')),
  })),
  ...LIEUX.map((l) => ({
    id: `lieu:${l.id}`,
    categorie: 'lieu' as const,
    titre: l.nom,
    resume: l.description,
    details: [`${l.pays}.`, l.danger >= 3 ? 'Zone dangereuse.' : l.danger >= 2 ? 'Zone risquée.' : 'Zone sûre.'],
    publique: !!l.village && !l.id.includes('_'),
  })),
];

const H = (id: string, titre: string, resume: string, details: string[] = [], publique = false): EntreeEncyclopedie => ({
  id: `histoire:${id}`,
  categorie: 'histoire',
  titre,
  resume,
  details,
  publique,
});
const O = (id: string, titre: string, resume: string, details: string[] = []): EntreeEncyclopedie => ({
  id: `organisation:${id}`,
  categorie: 'organisation',
  titre,
  resume,
  details,
});
const S = (id: string, titre: string, resume: string): EntreeEncyclopedie => ({ id: `secret:${id}`, categorie: 'histoire', titre, resume, details: ['Secret découvert.'] });

export const ENCYCLOPEDIE: EntreeEncyclopedie[] = [
  ...generees,
  H('ere', 'L’ère des Villages', 'Cinquante-deux ans de paix armée entre deux guerres.', ['Fondation des villages en l’an 0.', 'Deux Grandes Guerres : de l’an 17 et de l’an 36 à 44.', 'Chronologie alternative propre à ce jeu.'], true),
  H('fondation', 'La fondation', 'Les clans renoncent aux guerres privées et se rangent sous l’autorité de cinq Kage.', ['À Konoha, le fondateur Senju fit pousser une forêt pour arrêter une guerre de clans.']),
  H('uzushio', 'La chute d’Uzushio', 'En l’an 21, une coalition de villages rase le village des sceaux.', ['Les survivants Uzumaki se dispersent ; beaucoup rejoignent Konoha.', 'Certains sceaux d’Uzushio tiendraient encore.']),
  H('deuxieme_guerre', 'La Deuxième Grande Guerre', 'De l’an 36 à l’an 44, tous les villages s’affrontent.', ['Le pont de Kannabi, la frontière de l’Herbe, le col de la Foudre : autant de noms que les vétérans prononcent à voix basse.']),
  H('traite_vallee', 'Le traité de la Vallée', 'Signé en l’an 44, il met fin à la guerre sans rien régler.', ['Kumo obtient des concessions, Iwa garde ses frontières, Konoha paie le prix fort.']),
  H('purges', 'Les purges de Kiri', 'En l’an 50, le Mizukage place les lignées héréditaires sous surveillance.', ['La moitié du clan Yuki a disparu en une saison.']),
  H('brume_sanglante', 'La Brume sanglante', 'Depuis l’an 29, l’examen de fin d’Académie de Kiri est un combat à mort.', []),
  H('shosa', 'Shōsa, la cité des verriers', 'Une cité du Pays du Vent engloutie par le sable il y a soixante ans.', ['Ses tours de verre chantaient sous le vent d’ouest.', 'On n’en voit les sommets qu’après les grandes tempêtes.']),
  O('police_uchiha', 'La police militaire de Konoha', 'Confiée au clan Uchiha en l’an 44. Un honneur qui ressemble à une mise à l’écart.'),
  O('ombre_konoha', 'Les unités de l’ombre de Konoha', 'Des ninjas masqués qui n’existent dans aucun registre.'),
  O('unites_ombre', 'Les unités d’élimination', 'Chaque village possède les siennes. Elles font ce que le village ne peut pas faire à visage découvert.'),
  O('dissidence_kiri', 'La dissidence de Kiri', 'Ceux qui veulent mettre fin à la Brume sanglante, de l’intérieur ou depuis les marais.'),
  O('navire_noir', 'Le Navire noir', 'Une organisation de déserteurs qui rassemble les lames perdues de Kiri.', ['Son emblème : un navire noir sur fond gris.']),
  S('enfant_cache', 'L’enfant du porche', 'Tu as caché un enfant d’une lignée traquée à Kiri.'),
  S('otages_kumo', 'Les otages de Kumo', 'Kumo « collectionne » les enfants des lignées étrangères.'),
  S('surveillance_uchiha', 'Le clan surveillé', 'Les unités de l’ombre surveillent le clan Uchiha.'),
  S('sceau_oiseau_cage', 'Le sceau de la branche', 'Le sceau de la branche secondaire Hyūga permet à la branche principale de tuer son porteur.'),
  S('chute_uzushio', 'Les responsables de la chute', 'Certains villages de la coalition contre Uzushio sont aujourd’hui des alliés de Konoha.'),
  S('purges_kiri', 'La peur du Mizukage', 'Les purges sont nées de la peur de ce que le Mizukage ne contrôle pas.'),
  S('lignee_yuki', 'Ta lignée', 'Ta famille appartient au clan Yuki. À Kiri, c’est un crime.'),
  S('passe_parent', 'Le coffre du grenier', 'Ton parent a dû abandonner des camarades pendant la guerre.'),
  S('unites_ombre', 'Les masques blancs', 'Il existe des unités qui n’apparaissent dans aucun registre.'),
  S('dissidence_kiri', 'Ceux qui disent non', 'Une dissidence existe à Kiri, jusque parmi les jōnin.'),
  S('frontiere_incidents', 'Les ninjas sans bandeau', 'Les incidents de frontière sont l’œuvre de ninjas de village, pas de bandits.'),
  S('abandon_mission', 'L’ordre de ne pas engager', 'L’équipe de ton aîné·e avait ordre de ne pas engager l’ennemi.'),
  S('mort_aine_trahison', 'L’itinéraire vendu', 'Quelqu’un a vendu l’itinéraire de la mission où ton aîné·e est mort·e.'),
  S('pont_kannabi', 'L’ordre du pont', 'Au pont de Kannabi, une unité alliée a été sacrifiée pour couvrir un membre du Conseil.'),
  S('verite_kannabi', 'La vérité sur Kannabi', 'Ton parent faisait partie des deux survivants du pont de Kannabi.'),
  S('interception_conseil', 'Le pli intercepté', 'Quelqu’un a tenté d’intercepter un pli du Conseil au cœur du village.'),
  S('pli_conseil', 'Le pli du Conseil', 'Le messager de la frontière portait un pli du Conseil, pas du Kage.'),
  S('eventail_sang', 'L’éventail tracé après coup', 'Le meurtre du conseiller de Konoha a été maquillé pour accuser les Uchiha.'),
  S('traitre_frontiere', 'Le contact au village', 'Un traître au village a vendu les itinéraires de la frontière.'),
  S('nom_traitre', 'Le nom', 'Tu connais le nom du traître. C’est un membre du Conseil.'),
  S('traitre_navire_noir', 'Le traître et le Navire noir', 'Le traître du Conseil traite avec le Navire noir.'),
  S('ninjas_sans_bandeau', 'Une formation de village', 'Les ninjas de la frontière ont été formés dans un village.'),
  S('pli_clan', 'Le pli du clan', 'Le messager portait aussi un pli pour ton clan.'),
  S('carriere_scellee', 'La carrière scellée', 'La lame Ganseki repose dans une carrière que le Tsuchikage a fait sceller.'),
  S('histoire_sabure', 'L’histoire de Sabure', 'Sabure a tué son capitaine pour que Yūnagi ne serve pas à raser un village.'),
  S('lame_sans_nom_existe', 'La Lame sans nom', 'Une lame maudite renforce ses porteurs en les rongeant. Tous sont morts jeunes.'),
  S('sceau_ancien', 'Le coffret du temple', 'Un temple oublié garde un coffret scellé par des spirales anciennes.'),
  S('sceau_phare_uzushio', 'Le sceau du phare', 'Un sceau d’Uzushio tient encore, sous le phare de l’archipel.'),
  S('mot_brise_glace', 'Brise-glace', 'Un mot de passe qui ouvre les marais des dissidents de Kiri.'),
  {
    id: 'secret:jinchuriki',
    categorie: 'histoire',
    titre: 'Jinchūriki',
    resume: 'Une bête à queues est scellée en toi depuis ta naissance.',
    details: [
      'Chaque grand village garde une ou plusieurs bêtes à queues, scellées dans des humains appelés jinchūriki.',
      ...BIJUS.map((b) => `${b.nom} (${VILLAGES.find((v) => v.id === b.village)?.nom}) : ${b.description}`),
      'Le chakra de la bête fuit d’abord sous la peur ou la colère. Le maîtriser demande des années, et un accord avec la bête.',
    ],
  },
  S('lignee_fusion', 'Une lignée de fusion', 'Tu portes une nature de fusion héritée. Les villages se battent pour ce genre de sang.'),
  S('clan_guerre', 'Ce qu’on ne raconte pas aux enfants', 'Ton clan a fait pendant la guerre des choses qu’on ne raconte pas.'),
];
