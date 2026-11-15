'use client';

import type { AttributId, GameState } from '../engine/types';
import { ATTRIBUTS } from '../engine/types';
import { gainsAnnuels } from '../engine/progression';
import { age } from '../engine/calendrier';
import { ATTRIBUT_LIBELLE } from './libelles';
import { qualificatif } from './fiche';

/** À quoi sert chaque aptitude, en une ligne : c'est ce qui aide le joueur à choisir où mettre ses points. */
export const USAGE: Record<AttributId, string> = {
  force: 'Combats au corps à corps, efforts, endurance.',
  agilite: 'Esquives, vitesse, taijutsu, armes légères.',
  perception: 'Repérer, pister, deviner un piège ou un mensonge.',
  discretion: 'Infiltration, filatures, se faire oublier.',
  intellect: 'Énigmes, stratégie, examens, sceaux : tout ce qui demande de réfléchir.',
  charisme: 'Convaincre, négocier, mener les autres.',
  controleChakra: 'Ninjutsu, genjutsu, techniques apprises plus tôt.',
  controleEmotionnel: 'Garder son sang-froid, résister à la peur et aux illusions.',
};

/** Les aptitudes, en lecture, avec l'accès à la modale de répartition quand des points attendent. */
export default function Repartition({ etat, onOuvrir }: { etat: GameState; onOuvrir: () => void }) {
  const prochain = gainsAnnuels(etat, age(etat) + 1);
  const dernier = etat.anniversaires.at(-1);
  return (
    <section className="panneau l7 repartition" aria-label="Aptitudes et points de stat">
      <h2>
        Aptitudes <small>sur 100</small>
      </h2>
      {etat.pointsStat > 0 && (
        <button className="btn-principal points-ouvrir" onClick={onOuvrir}>
          Répartir {etat.pointsStat} {etat.pointsStat > 1 ? 'points' : 'point'}
        </button>
      )}
      <ul className="repartition-liste">
        {ATTRIBUTS.map((a) => {
          const v = etat.attributs[a];
          return (
            <li key={a}>
              <div className="r-tete">
                <span className="r-nom">{ATTRIBUT_LIBELLE[a]}</span>
                <span className="r-val">
                  {v}
                  <small>{qualificatif(v)}</small>
                </span>
              </div>
              <span className="piste c-chakra" aria-hidden="true">
                <i style={{ width: `${Math.min(100, v)}%` }} />
              </span>
              <p className="r-usage">{USAGE[a]}</p>
            </li>
          );
        })}
      </ul>
      <details className="r-sources">
        <summary>D’où viennent les points</summary>
        <p>
          À chaque anniversaire, l’année écoulée rapporte des points : la croissance, ton rang, les missions réussies, les combats gagnés, les épreuves
          réussies, l’entraînement et les études. Plus tu vis intensément, plus tu progresses.
        </p>
        <p>
          <b>Si ton anniversaire tombait aujourd’hui :</b> {prochain.length ? prochain.map((g) => `${g.source} +${g.points}`).join(', ') : 'rien encore'}.
        </p>
        {dernier && (
          <p>
            <b>À {dernier.age} ans :</b> {dernier.gains.map((g) => `${g.source} +${g.points}`).join(', ')}.
          </p>
        )}
      </details>
    </section>
  );
}
