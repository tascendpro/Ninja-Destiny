import type { FicheTechnique } from '../../engine/types';
import { CATALOGUE_CLANS } from './clans';
import { CATALOGUE_ELEMENTS } from './elements';
import { CATALOGUE_GENERAL } from './generales';

// Le catalogue des techniques : une référence consultable dans l'encyclopédie (onglet « Rouleaux »).
// Une fiche liée à une technique jouable (champ « jouable ») est marquée comme connue quand le personnage la maîtrise.
// Pour enrichir le catalogue, ajouter une fiche dans le fichier de sa famille, ou un nouveau fichier listé ici.

export const CATALOGUE: FicheTechnique[] = [...CATALOGUE_CLANS, ...CATALOGUE_ELEMENTS, ...CATALOGUE_GENERAL];
