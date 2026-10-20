import type { FicheTechnique, RangTechnique, TypeTechnique } from '../../engine/types';

type Reste = Omit<FicheTechnique, 'id' | 'japonais' | 'francais' | 'types' | 'rang' | 'chakra' | 'origine'> & Partial<Pick<FicheTechnique, 'origine'>>;

/**
 * Une fiche du catalogue. L'origine vaut « manga » par défaut ; tout le reste est explicite.
 * Pour étendre le catalogue, il suffit d'ajouter une ligne dans le fichier de sa famille.
 */
export const fiche = (id: string, japonais: string, francais: string, types: TypeTechnique[], rang: RangTechnique, chakra: FicheTechnique['chakra'], reste: Reste): FicheTechnique => ({
  id,
  japonais,
  francais,
  types,
  rang,
  chakra,
  origine: 'manga',
  ...reste,
});
