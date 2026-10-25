import type { Contenu } from '../engine/types';
import { MONDE, VILLAGES, ELEMENTS, TRAITS, OBJECTIFS, NOMS } from './monde';
import { CLANS } from './clans';
import { MAITRISES } from './maitrises';
import { ARMES, ARMES_HERITAGE } from './armes';
import { METIERS } from './metiers';
import { PNJ, ROLES } from './pnj';
import { LIEUX } from './lieux';
import { FINS, SUCCES } from './fins';
import { ENCYCLOPEDIE } from './encyclopedie';
import { ORIGINES } from './evenements/origines';
import { EVENEMENTS_CLANS } from './evenements/clans';
import { ACADEMIE } from './evenements/academie';
import { GENIN } from './evenements/genin';
import { MISSIONS, EVENEMENTS_MISSIONS } from './evenements/missions';
import { YUNAGI } from './evenements/yunagi';
import { ALEATOIRES } from './evenements/aleatoires';
import { ENFANCE } from './evenements/enfance';
import { ADOLESCENCE } from './evenements/adolescence';
import { JEUNESSE } from './evenements/jeunesse';
import { MATURITE } from './evenements/maturite';
import { HORS_LA_LOI_EVENEMENTS } from './evenements/horsLaLoi';
import { VIOLENCE } from './evenements/violence';
import { REMORDS } from './evenements/remords';
import { VISAGES } from './evenements/visages';
import { ARCS_CLANS_1 } from './evenements/arcsClans1';
import { ARCS_CLANS_2 } from './evenements/arcsClans2';
import { ARCS_CLANS_3 } from './evenements/arcsClans3';
import { APPRENTISSAGE } from './evenements/apprentissage';
import { DUOS } from './evenements/duos';
import { JINCHURIKI_EVENEMENTS } from './evenements/jinchuriki';
import { EPREUVE_LAMES } from './evenements/epreuveLames';
import { EXIL } from './evenements/exil';
import { VILLAGES_VIVANTS } from './evenements/villages';
import { VOIX_CLANS } from './evenements/voixClans';
import { RACINE } from './combat';
import { MISSIONS_GENIN, EVENEMENTS_MISSIONS_GENIN } from './evenements/missionsGenin';
import { SECRETS } from './evenements/secrets';
import { EVENEMENTS_BIJU } from './evenements/biju';
import { BIJUS } from './bijus';
import { ERRANCE } from './evenements/errance';
import { HERITAGES, SEQUENCES } from './destin';
import { CHAPITRE2, MISSIONS_C2 } from './evenements/chapitre2';
import { CHAPITRE3, MISSIONS_C3 } from './evenements/chapitre3';
import { ALEATOIRES_ADULTES, CHAPITRE4, MISSIONS_C4 } from './evenements/chapitre4';
import { CHAPITRE5 } from './evenements/chapitre5';
import { CHAPITRE5_VOIE } from './evenements/chapitre5_voie';
import { DESTINS } from './evenements/destins';
import { MARGES } from './evenements/marges';
import { AFFRONTEMENTS, RECITS_TECHNIQUES, TECHNIQUES_ADVERSES, TIRS_AMIS } from './recitsTechniques';
import { CONSEQUENCES } from './evenements/consequences';
import { LEGENDES } from './evenements/legendes';
import { ADULTE, MISSIONS_ADULTES } from './evenements/adulte';
import { RENCONTRES } from './evenements/rencontres';
import { BETE } from './evenements/bete';
import { BINGO } from './bingo';
import { CATALOGUE } from './catalogue';
import { DECORS_EVENEMENTS, DECORS_LIEUX, prioriserDecors } from './decors';

const EVENEMENTS = [...ORIGINES, ...EVENEMENTS_CLANS, ...ACADEMIE, ...GENIN, ...EVENEMENTS_MISSIONS, ...YUNAGI, ...ALEATOIRES, ...ENFANCE, ...ADOLESCENCE, ...JEUNESSE, ...MATURITE, ...HORS_LA_LOI_EVENEMENTS, ...VIOLENCE, ...REMORDS, ...VISAGES, ...ARCS_CLANS_1, ...ARCS_CLANS_2, ...ARCS_CLANS_3, ...APPRENTISSAGE, ...DUOS, ...JINCHURIKI_EVENEMENTS, ...EPREUVE_LAMES, ...EXIL, ...EVENEMENTS_MISSIONS_GENIN, ...VILLAGES_VIVANTS, ...VOIX_CLANS, ...SECRETS, ...EVENEMENTS_BIJU, ...ERRANCE, ...CHAPITRE2, ...CHAPITRE3, ...CHAPITRE4, ...ALEATOIRES_ADULTES, ...CHAPITRE5_VOIE, ...CHAPITRE5, ...DESTINS, ...MARGES, ...CONSEQUENCES, ...LEGENDES, ...ADULTE, ...RENCONTRES, ...BETE];

export const CONTENU: Contenu = {
  version: '2.9.1',
  racine: RACINE,
  chapitresPublies: [1, 2, 3, 4, 5, 6],
  monde: MONDE,
  villages: VILLAGES,
  clans: CLANS,
  elements: ELEMENTS,
  traits: TRAITS,
  objectifs: OBJECTIFS,
  maitrises: MAITRISES,
  armes: ARMES,
  metiers: METIERS,
  pnj: PNJ,
  lieux: LIEUX,
  evenements: EVENEMENTS,
  missions: [...MISSIONS, ...MISSIONS_GENIN, ...MISSIONS_C2, ...MISSIONS_C3, ...MISSIONS_C4, ...MISSIONS_ADULTES],
  fins: FINS,
  succes: SUCCES,
  bijus: BIJUS,
  heritages: HERITAGES,
  sequences: SEQUENCES,
  encyclopedie: ENCYCLOPEDIE,
  roles: ROLES,
  noms: NOMS,
  armesHeritage: ARMES_HERITAGE,
  recitsTechniques: RECITS_TECHNIQUES,
  affrontements: AFFRONTEMENTS,
  tirsAmis: TIRS_AMIS,
  techniquesAdverses: TECHNIQUES_ADVERSES,
  bingo: BINGO,
  catalogue: CATALOGUE,
  decors: prioriserDecors(EVENEMENTS),
  decorsLieux: DECORS_LIEUX,
  decorsEvenements: DECORS_EVENEMENTS,
};
