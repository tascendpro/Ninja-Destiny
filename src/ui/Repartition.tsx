'use client';

import { useState } from 'react';
import type { AttributId, GameState } from '../engine/types';
import { ATTRIBUTS } from '../engine/types';
import { coutPoint, coutRepartition, gainsAnnuels } from '../engine/progression';
import { age } from '../engine/calendrier';
import { ATTRIBUT_LIBELLE } from './libelles';
import { qualificatif } from './fiche';

/** À quoi sert chaque aptitude, en une ligne : c'est ce qui aide le joueur à choisir où mettre ses points. */
const USAGE: Record<AttributId, string> = {
  force: 'Combats au corps à corps, efforts, endurance.',
  agilite: 'Esquives, vitesse, taijutsu, armes légères.',
  perception: 'Repérer, pister, deviner un piège ou un mensonge.',
  discretion: 'Infiltration, filatures, se faire oublier.',
  intellect: 'Énigmes, stratégie, examens, sceaux : tout ce qui demande de réfléchir.',
  charisme: 'Convaincre, négocier, mener les autres.',
  controleChakra: 'Ninjutsu, genjutsu, techniques apprises plus tôt.',
  controleEmotionnel: 'Garder son sang-froid, résister à la peur et aux illusions.',
};

/**
 * Répartition des points de stat gagnés aux anniversaires. Les points s'ajoutent d'abord en brouillon,
 * puis une seule validation les enregistre (une seule décision dans l'historique).
 */
export default function Repartition({ etat, onRepartir, compact = false }: { etat: GameState; onRepartir: (rep: Partial<Record<AttributId, number>>) => void; compact?: boolean }) {
  const [brouillon, setBrouillon] = useState<Partial<Record<AttributId, number>>>({});
  const cout = coutRepartition(etat, brouillon);
  const reste = etat.pointsStat - cout;
  const enCours = Object.values(brouillon).some((n) => (n ?? 0) > 0);
  const valeur = (a: AttributId) => etat.attributs[a] + (brouillon[a] ?? 0);
  const ajouter = (a: AttributId, d: number) => setBrouillon((b) => ({ ...b, [a]: Math.max(0, (b[a] ?? 0) + d) }));
  const prochain = gainsAnnuels(etat, age(etat) + 1);
  const dernier = etat.anniversaires.at(-1);

  return (
    <section className={`panneau l7 repartition${compact ? ' compact' : ''}`} aria-label="Aptitudes et points de stat">
      <h2>
        Aptitudes <small>sur 100</small>
      </h2>
      <p className={`points-bourse${etat.pointsStat > 0 ? ' actif' : ''}`}>
        <strong>{reste}</strong> {reste > 1 ? 'points à répartir' : 'point à répartir'}
        <small> · 1 point par niveau jusqu’à 60, 2 jusqu’à 80, 3 au-delà</small>
      </p>
      <ul className="repartition-liste">
        {ATTRIBUTS.map((a) => {
          const v = valeur(a);
          const plus = brouillon[a] ?? 0;
          const c = coutPoint(v);
          return (
            <li key={a}>
              <div className="r-tete">
                <span className="r-nom">{ATTRIBUT_LIBELLE[a]}</span>
                <span className="r-val">
                  {v}
                  {plus > 0 && <b> +{plus}</b>}
                  <small>{qualificatif(v)}</small>
                </span>
              </div>
              <span className="piste c-chakra" aria-hidden="true">
                <i style={{ width: `${Math.min(100, v)}%` }} />
              </span>
              {!compact && <p className="r-usage">{USAGE[a]}</p>}
              {etat.pointsStat > 0 && (
                <div className="r-boutons">
                  <button className="btn-mini" onClick={() => ajouter(a, -1)} disabled={plus === 0} aria-label={`Retirer un point en ${ATTRIBUT_LIBELLE[a]}`}>
                    −
                  </button>
                  <button className="btn-mini" onClick={() => ajouter(a, 1)} disabled={c > reste || v >= 100} aria-label={`Ajouter un point en ${ATTRIBUT_LIBELLE[a]}`}>
                    +{c > 1 ? ` (${c} pts)` : ''}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {enCours && (
        <div className="rangee r-actions">
          <button className="btn-principal" onClick={() => (onRepartir(brouillon), setBrouillon({}))}>
            Valider ({cout} {cout > 1 ? 'points' : 'point'})
          </button>
          <button className="btn-secondaire" onClick={() => setBrouillon({})}>
            Annuler
          </button>
        </div>
      )}
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
