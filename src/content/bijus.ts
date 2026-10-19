import type { BijuDef } from '../engine/types';

// Les bêtes à queues gardées par les cinq villages dans cette chronologie.
// Un personnage jinchūriki reçoit l'une des bêtes de son propre village (tirage à la naissance).
export const BIJUS: BijuDef[] = [
  { id: 'ichibi', nom: 'Shukaku, le Tanuki à une queue', queues: 1, village: 'suna', description: 'Une bête de sable, folle de colère et privée de sommeil depuis des siècles.' },
  { id: 'nibi', nom: 'Matatabi, le Chat à deux queues', queues: 2, village: 'kumo', description: 'Une chatte de flammes bleues, plus calme qu’on ne le croit.' },
  { id: 'sanbi', nom: 'Isobu, la Tortue à trois queues', queues: 3, village: 'kiri', description: 'Une tortue couverte de pointes, qui dort au fond des lacs.' },
  { id: 'yonbi', nom: 'Son Gokū, le Singe à quatre queues', queues: 4, village: 'iwa', description: 'Un singe de lave, fier, qui déteste qu’on l’appelle par son titre.' },
  { id: 'gobi', nom: 'Kokuō, le Cheval-dauphin à cinq queues', queues: 5, village: 'iwa', description: 'Une bête de vapeur, docile en apparence, impossible à plier.' },
  { id: 'rokubi', nom: 'Saiken, la Limace à six queues', queues: 6, village: 'kiri', description: 'Une limace d’acide, étrangement bienveillante.' },
  { id: 'hachibi', nom: 'Gyūki, le Bœuf-poulpe à huit queues', queues: 8, village: 'kumo', description: 'Une bête puissante et orgueilleuse, gardée comme un trésor de guerre.' },
  { id: 'kyubi', nom: 'Kurama, le Renard à neuf queues', queues: 9, village: 'konoha', description: 'La plus puissante des bêtes, et la plus haineuse envers les humains.' },
];
