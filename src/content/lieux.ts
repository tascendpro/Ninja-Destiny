import type { LieuDef, VillageId } from '../engine/types';

const CENTRES: Record<VillageId, { x: number; y: number; pays: string; scene: string; nom: string }> = {
  konoha: { x: 540, y: 400, pays: 'Pays du Feu', scene: 'village_feu', nom: 'Konoha' },
  suna: { x: 200, y: 470, pays: 'Pays du Vent', scene: 'village_vent', nom: 'Suna' },
  kiri: { x: 880, y: 470, pays: 'Pays de l’Eau', scene: 'village_brume', nom: 'Kiri' },
  kumo: { x: 790, y: 150, pays: 'Pays de la Foudre', scene: 'village_foudre', nom: 'Kumo' },
  iwa: { x: 260, y: 170, pays: 'Pays de la Terre', scene: 'village_terre', nom: 'Iwa' },
};

const DESCRIPTIONS: Record<VillageId, string> = {
  konoha: 'Toits verts au pied de la falaise des Hokage, forêt à perte de vue.',
  suna: 'Dômes d’argile dans un cratère protégé par des falaises de grès.',
  kiri: 'Tours noyées de brume au cœur d’un archipel froid.',
  kumo: 'Pics vertigineux reliés par des ponts, au-dessus d’une mer de nuages.',
  iwa: 'Village taillé dans la roche, entre des pitons et des ponts de pierre.',
};

const SOUS_LIEUX: [string, string, string, string][] = [
  ['academie', 'Académie de', 'academie', 'Les salles où l’on apprend à devenir une arme.'],
  ['terrain', 'Terrains d’entraînement de', 'terrain', 'Poteaux entaillés, cibles criblées, herbe arrachée.'],
  ['maison', 'Maison familiale à', 'maison', 'L’endroit où l’on enlève son bandeau.'],
  ['forge', 'Forge de', 'forge', 'Le feu, l’enclume, l’odeur du métal.'],
  ['porte', 'Grande porte de', 'porte', 'Ceux qui partent en mission la franchissent sans se retourner.'],
];

const villages: LieuDef[] = (Object.keys(CENTRES) as VillageId[]).flatMap((v) => {
  const c = CENTRES[v];
  return [
    { id: v, nom: c.nom, pays: c.pays, scene: c.scene, x: c.x, y: c.y, danger: 0, description: DESCRIPTIONS[v], village: v },
    ...SOUS_LIEUX.map(([suffixe, prefixe, scene, description], i) => ({
      id: `${v}_${suffixe}`,
      nom: `${prefixe} ${c.nom}`,
      pays: c.pays,
      scene: `${scene}:${c.scene}`,
      x: c.x + [12, -14, 8, -10, 0][i],
      y: c.y + [10, 8, -12, -8, 16][i],
      danger: 0,
      description,
      village: v,
    })),
  ];
});

export const LIEUX: LieuDef[] = [
  ...villages,
  { id: 'foret_feu', nom: 'Forêt du Pays du Feu', pays: 'Pays du Feu', scene: 'foret', x: 600, y: 470, danger: 1, description: 'Des arbres si grands que la lumière y arrive verte.' },
  { id: 'frontiere_herbe', nom: 'Frontière du Pays de l’Herbe', pays: 'Pays de l’Herbe', scene: 'frontiere', x: 400, y: 285, danger: 3, description: 'Une plaine disputée où chaque guerre a laissé ses tombes.' },
  { id: 'desert_vent', nom: 'Grand désert du Vent', pays: 'Pays du Vent', scene: 'desert', x: 150, y: 560, danger: 2, description: 'Des dunes qui bougent plus vite que les cartes.' },
  { id: 'cite_ensevelie', nom: 'Shōsa, la cité ensevelie', pays: 'Pays du Vent', scene: 'ruines', x: 90, y: 400, danger: 3, description: 'Une cité de verriers engloutie par le sable il y a soixante ans.' },
  { id: 'cotes_brume', nom: 'Côtes de la Brume', pays: 'Pays de l’Eau', scene: 'cotes', x: 800, y: 540, danger: 2, description: 'Des récifs noirs où dorment des navires et des lames.' },
  { id: 'montagnes_foudre', nom: 'Col de la Foudre', pays: 'Pays de la Foudre', scene: 'montagne', x: 700, y: 210, danger: 3, description: 'Un col où l’orage ne s’arrête jamais.' },
  { id: 'carrieres_terre', nom: 'Carrières de la Terre', pays: 'Pays de la Terre', scene: 'carriere', x: 320, y: 120, danger: 2, description: 'Des galeries à perte de vue ; certaines sont scellées.' },
  { id: 'pays_fer', nom: 'Pays du Fer', pays: 'Pays du Fer', scene: 'neige', x: 540, y: 95, danger: 1, description: 'Terre neutre des samouraïs, où les ninjas n’ont pas de pouvoir.' },
  { id: 'marche_noir', nom: 'Bourg de Kōsai', pays: 'Pays des Champs', scene: 'marche', x: 460, y: 340, danger: 2, description: 'Un bourg marchand à la croisée des pays, où tout s’achète.' },
  { id: 'temple_oublie', nom: 'Temple oublié', pays: 'Pays du Feu', scene: 'temple', x: 650, y: 330, danger: 2, description: 'Un sanctuaire mangé par la mousse, absent de toutes les cartes.' },
  { id: 'route_commerce', nom: 'Route du sel', pays: 'Pays des Champs', scene: 'route', x: 380, y: 430, danger: 1, description: 'La route des caravanes entre le Feu et le Vent.' },
];
