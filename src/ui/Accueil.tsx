'use client';

import { ImageScene } from './SceneArt';
import { ACCUEIL } from './medias';
import type { Sauvegarde } from '../engine/sauvegarde';

export default function Accueil({
  sauvegardeAuto,
  aDesSauvegardes,
  parties,
  onNouvelle,
  onContinuer,
  onCharger,
  onBoutique,
  bourse,
  heritage,
  onEncyclopedie,
  onReglages,
}: {
  sauvegardeAuto?: Sauvegarde;
  aDesSauvegardes: boolean;
  parties: number;
  onNouvelle: () => void;
  onContinuer: () => void;
  onCharger: () => void;
  onBoutique: () => void;
  bourse: number;
  heritage?: string;
  onEncyclopedie: () => void;
  onReglages: () => void;
}) {
  const enCours = sauvegardeAuto && sauvegardeAuto.etat.scene.type !== 'fin' ? sauvegardeAuto : undefined;
  return (
    <main className="accueil">
      <div className="accueil-fond" aria-hidden="true">
        <ImageScene image={ACCUEIL} priorite />
      </div>
      <div className="accueil-contenu">
        <span className="tategaki" aria-hidden="true">
          忍者の運命
        </span>
        <h1 className="logo apparition">
          <span>Ninja</span>
          <span>
            Destiny<span className="logo-sceau" aria-hidden="true">忍</span>
          </span>
        </h1>
        <p className="accroche apparition d2">
          Naître dans un village caché, hériter d’un clan, éveiller un pouvoir que tu ne contrôles pas encore. Chaque choix laisse une trace.
        </p>
        <div className="accueil-actions apparition d3">
          {enCours && (
            <button className="btn-principal" onClick={onContinuer}>
              Continuer la vie de {enCours.creation.prenom}
            </button>
          )}
          <button className={enCours ? 'btn-secondaire' : 'btn-principal'} onClick={onNouvelle}>
            Commencer mon destin
          </button>
          <div className="accueil-secondaires">
            {aDesSauvegardes && (
              <button className="btn-secondaire" onClick={onCharger}>
                Charger
              </button>
            )}
            <button className="btn-secondaire" onClick={onBoutique}>
              Boutique · {bourse} 両{heritage ? ' ✓' : ''}
            </button>
            <button className="btn-secondaire" onClick={onEncyclopedie}>
              Encyclopédie
            </button>
            <button className="btn-secondaire" onClick={onReglages}>
              Réglages
            </button>
          </div>
        </div>
        <p className="accueil-note apparition d3">
          {parties > 0 && `${parties} ${parties > 1 ? 'vies commencées' : 'vie commencée'} sur cet appareil. `}
          Ta partie est gardée sur cet appareil, même si tu fermes le navigateur.
        </p>
        <p className="accueil-signature apparition d3">Créé par Tascend</p>
      </div>
    </main>
  );
}
