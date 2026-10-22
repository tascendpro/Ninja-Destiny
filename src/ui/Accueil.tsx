'use client';

import { ImageScene } from './SceneArt';
import { ACCUEIL } from './medias';
import type { Sauvegarde } from '../engine/sauvegarde';
import { R } from '../engine/registre';
import { age } from '../engine/calendrier';

const RANGS: Record<string, string> = { eleve: 'Élève', genin: 'Genin', chunin: 'Chūnin', jonin: 'Jōnin', kage: 'Kage' };
/** Pétales d'érable qui tombent : position, durée et délai fixes (aucun hasard), coupés si les animations sont réduites. */
const PETALES = [
  [8, 11, 0], [22, 14, 3], [37, 12, 7], [51, 16, 1], [66, 13, 5], [79, 15, 9], [91, 12, 2], [15, 17, 11], [58, 14, 13], [84, 18, 6],
];

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
      <div className="petales" aria-hidden="true">
        {PETALES.map(([x, d, delai], i) => (
          <i key={i} style={{ left: `${x}%`, animationDuration: `${d}s`, animationDelay: `-${delai}s` }} />
        ))}
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
            <button className="reprise" style={{ '--c': `var(--v-${enCours.creation.village})` } as React.CSSProperties} onClick={onContinuer}>
              <span className="reprise-sceau" aria-hidden="true">
                続
              </span>
              <span className="reprise-texte">
                <strong>Continuer la vie de {enCours.creation.prenom}</strong>
                <small>
                  <span className="reprise-village">{R.villages[enCours.creation.village]?.nom}</span> · {age(enCours.etat)} ans ·{' '}
                  {RANGS[enCours.etat.rang] ?? enCours.etat.rang} · chapitre {enCours.etat.chapitre}
                </small>
              </span>
              <span className="reprise-fleche" aria-hidden="true">
                →
              </span>
            </button>
          )}
          <button className={enCours ? 'btn-secondaire' : 'btn-principal'} onClick={onNouvelle}>
            Commencer mon destin
          </button>
          <div className="accueil-secondaires">
            {aDesSauvegardes && (
              <button className="btn-secondaire" onClick={onCharger}>
                <span className="btn-kanji" aria-hidden="true">読</span>
                Charger
              </button>
            )}
            <button className="btn-secondaire" onClick={onBoutique}>
              <span className="btn-kanji" aria-hidden="true">店</span>
              Boutique · {bourse} 両{heritage ? ' ✓' : ''}
            </button>
            <button className="btn-secondaire" onClick={onEncyclopedie}>
              <span className="btn-kanji" aria-hidden="true">書</span>
              Encyclopédie
            </button>
            <button className="btn-secondaire" onClick={onReglages}>
              <span className="btn-kanji" aria-hidden="true">設</span>
              Réglages
            </button>
          </div>
        </div>
        <p className="accueil-note apparition d3">
          {parties > 0 && `${parties} ${parties > 1 ? 'vies commencées' : 'vie commencée'} sur cet appareil. `}
          Ta partie est gardée sur cet appareil, même si tu fermes le navigateur.
        </p>
        <p className="accueil-signature apparition d3">
          Créé par Tascend <span className="accueil-version">v{R.contenu.version}</span>
        </p>
      </div>
    </main>
  );
}
