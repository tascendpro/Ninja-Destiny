'use client';

import { useEffect, useRef, useState } from 'react';
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

type Brouillon = Partial<Record<AttributId, number>>;

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

/**
 * La modale de répartition. Les points sont d'abord un brouillon (« + » et « − » libres, rien n'est envoyé au moteur) ;
 * « Valider » affiche le récapitulatif, et seule la confirmation envoie une action « points » avec toute la répartition.
 * « Plus tard » ferme sans rien appliquer. Un toucher sur le fond ne fait rien.
 */
export function ModalePoints({ etat, onRepartir, onFermer }: { etat: GameState; onRepartir: (rep: Brouillon) => void; onFermer: () => void }) {
  const [brouillon, setBrouillon] = useState<Brouillon>({});
  const [recap, setRecap] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const cout = coutRepartition(etat, brouillon);
  const reste = etat.pointsStat - cout;
  const choisis = ATTRIBUTS.filter((a) => (brouillon[a] ?? 0) > 0);
  const ajouter = (a: AttributId, d: number) => setBrouillon((b) => ({ ...b, [a]: Math.max(0, (b[a] ?? 0) + d) }));

  useEffect(() => {
    boite.current?.focus();
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);

  return (
    <div className="modale-fond" role="presentation">
      <div ref={boite} className="modale" role="dialog" aria-modal="true" aria-labelledby="modale-points-titre" tabIndex={-1}>
        <header className="modale-tete">
          <h2 id="modale-points-titre">{recap ? 'Confirmer la répartition' : 'Répartir tes points'}</h2>
          <p className={`modale-compteur${reste === 0 ? ' fini' : ''}`}>
            <strong>{reste}</strong> {reste > 1 ? 'points restants' : 'point restant'}
          </p>
        </header>
        <div className="modale-corps">
          {recap ? (
            <ul className="recap-liste">
              {choisis.map((a) => (
                <li key={a}>
                  <span>{ATTRIBUT_LIBELLE[a]}</span>
                  <span>
                    {etat.attributs[a]} → <b>{etat.attributs[a] + (brouillon[a] ?? 0)}</b>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="modale-aide">1 point par niveau jusqu’à 60, 2 jusqu’à 80, 3 au-delà. Rien n’est appliqué avant ta confirmation.</p>
              <ul className="points-liste">
                {ATTRIBUTS.map((a) => {
                  const plus = brouillon[a] ?? 0;
                  const v = etat.attributs[a] + plus;
                  const c = coutPoint(v);
                  return (
                    <li key={a} className={plus > 0 ? 'modifie' : undefined}>
                      <span className="pl-nom">
                        {ATTRIBUT_LIBELLE[a]}
                        <small>{USAGE[a]}</small>
                      </span>
                      <span className="pl-valeur">
                        {plus > 0 ? (
                          <>
                            <s>{etat.attributs[a]}</s> <b>{v}</b>
                          </>
                        ) : (
                          v
                        )}
                      </span>
                      <span className="pl-boutons">
                        <button type="button" className="pl-bouton" onClick={() => ajouter(a, -1)} disabled={plus === 0} aria-label={`Retirer un point en ${ATTRIBUT_LIBELLE[a]}`}>
                          −
                        </button>
                        <button
                          type="button"
                          className="pl-bouton"
                          onClick={() => ajouter(a, 1)}
                          disabled={c > reste || v >= 100}
                          aria-label={`Ajouter un point en ${ATTRIBUT_LIBELLE[a]}${c > 1 ? ` (${c} points)` : ''}`}
                        >
                          +{c > 1 && <small>{c}</small>}
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <footer className="modale-pied">
          {recap ? (
            <>
              <button type="button" className="btn-secondaire" onClick={() => setRecap(false)}>
                Retour
              </button>
              <button
                type="button"
                className="btn-principal"
                onClick={() => {
                  onRepartir(brouillon);
                  onFermer();
                }}
              >
                Confirmer
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-secondaire" onClick={onFermer}>
                Plus tard
              </button>
              <button type="button" className="btn-principal" onClick={() => setRecap(true)} disabled={choisis.length === 0}>
                Valider{cout > 0 ? ` (${cout})` : ''}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
