'use client';

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { EMPLACEMENTS, enregistrer, listerSauvegardes, restaurer, supprimer } from '../engine/sauvegarde';
import type { Emplacement, Meta, Stockage } from '../engine/sauvegarde';
import Boutique from './Boutique';

export interface Reglages {
  theme: 'nuit' | 'washi';
  son: boolean;
  volume: number;
  animations: 'normales' | 'reduites';
}

type Section = 'sauvegardes' | 'boutique' | 'reglages';

export default function Menu({
  etat,
  stockage,
  meta,
  onMeta,
  reglages,
  section: sectionInitiale,
  onReglages,
  onCharger,
  onQuitter,
  onFermer,
  onToast,
}: {
  etat: GameState | null;
  stockage: Stockage;
  meta: Meta;
  onMeta: (m: Meta) => void;
  reglages: Reglages;
  section?: Section;
  onReglages: (r: Reglages) => void;
  onCharger: (s: GameState, message?: string) => void;
  onQuitter?: () => void;
  onFermer: () => void;
  onToast: (t: string) => void;
}) {
  const [section, setSection] = useState<Section>(sectionInitiale ?? (etat ? 'sauvegardes' : 'reglages'));
  const [rev, setRev] = useState(0);
  const emplacements = listerSauvegardes(stockage);
  void rev;

  const sauver = (e: Emplacement) => {
    if (!etat) return;
    enregistrer(stockage, e, etat);
    setRev((x) => x + 1);
    onToast('Partie sauvegardée.');
  };
  const charger = (e: Emplacement) => {
    const sv = emplacements.find((x) => x.emplacement === e)?.sauvegarde;
    if (!sv) return;
    const r = restaurer(sv);
    onCharger(r.etat, r.verifiee ? 'Partie chargée et vérifiée.' : r.message);
  };
  const effacer = (e: Emplacement) => {
    supprimer(stockage, e);
    setRev((x) => x + 1);
    onToast('Sauvegarde effacée.');
  };

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label="Menu" onClick={onFermer}>
      <div className="modale" onClick={(e) => e.stopPropagation()}>
        <h2>Menu</h2>
        <div className="onglets" role="tablist" style={{ margin: '0 0 12px' }}>
          <button role="tab" aria-selected={section === 'sauvegardes'} onClick={() => setSection('sauvegardes')}>
            Sauvegardes
          </button>
          <button role="tab" aria-selected={section === 'boutique'} onClick={() => setSection('boutique')}>
            Boutique
          </button>
          <button role="tab" aria-selected={section === 'reglages'} onClick={() => setSection('reglages')}>
            Réglages
          </button>
        </div>

        {section === 'boutique' && <Boutique meta={meta} stockage={stockage} onMeta={onMeta} onToast={onToast} />}

        {section === 'sauvegardes' && (
          <section>
            <p className="sous-titre">
              La partie est enregistrée après chaque décision, dans ce navigateur : elle survit à la fermeture de la page et du navigateur. Seul l’effacement des
              données du site (ou la navigation privée) la fait disparaître.
            </p>
            {EMPLACEMENTS.map((e) => {
              const sv = emplacements.find((x) => x.emplacement === e)?.sauvegarde;
              return (
                <div className="emplacement" key={e}>
                  <div>
                    <strong>{e === 'auto' ? 'Sauvegarde automatique' : `Emplacement ${e.slice(-1)}`}</strong>
                    <small>{sv ? `${sv.resume}, le ${new Date(sv.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Vide'}</small>
                  </div>
                  <div className="rangee">
                    {etat && e !== 'auto' && (
                      <button className="btn-secondaire" onClick={() => sauver(e)}>
                        Sauvegarder
                      </button>
                    )}
                    {sv && (
                      <button className="btn-secondaire" onClick={() => charger(e)}>
                        Charger
                      </button>
                    )}
                    {sv && e !== 'auto' && (
                      <button className="btn-secondaire" onClick={() => effacer(e)} aria-label={`Effacer l’emplacement ${e.slice(-1)}`}>
                        Effacer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {section === 'reglages' && (
          <section>
            <div className="champ">
              <span>Ambiance visuelle</span>
              <div className="rangee">
                <button className="option" aria-pressed={reglages.theme === 'nuit'} onClick={() => onReglages({ ...reglages, theme: 'nuit' })}>
                  Mode nuit
                </button>
                <button className="option" aria-pressed={reglages.theme === 'washi'} onClick={() => onReglages({ ...reglages, theme: 'washi' })}>
                  Papier washi
                </button>
              </div>
            </div>
            <div className="champ">
              <span>Son d’ambiance</span>
              <div className="rangee">
                <button className="option" aria-pressed={reglages.son} onClick={() => onReglages({ ...reglages, son: !reglages.son })}>
                  {reglages.son ? 'Activé' : 'Désactivé'}
                </button>
              </div>
              <label htmlFor="volume">Volume</label>
              <input
                id="volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={reglages.volume}
                onChange={(e) => onReglages({ ...reglages, volume: Number(e.target.value) })}
              />
            </div>
            <div className="champ">
              <span>Animations</span>
              <div className="rangee">
                <button className="option" aria-pressed={reglages.animations === 'normales'} onClick={() => onReglages({ ...reglages, animations: 'normales' })}>
                  Normales
                </button>
                <button className="option" aria-pressed={reglages.animations === 'reduites'} onClick={() => onReglages({ ...reglages, animations: 'reduites' })}>
                  Réduites
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="actions-bas">
          {onQuitter && (
            <button className="btn-secondaire" onClick={onQuitter}>
              Retour au menu principal
            </button>
          )}
          <button className="btn-principal" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
