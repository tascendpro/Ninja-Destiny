'use client';

import { R } from '../engine/registre';
import { acheterHeritage, annulerHeritage } from '../engine/sauvegarde';
import type { Meta, Stockage } from '../engine/sauvegarde';

/** Boutique des héritages : on y dépense ta bourse pour avantager la prochaine vie. */
export default function Boutique({ meta, stockage, onMeta, onToast }: { meta: Meta; stockage: Stockage; onMeta: (m: Meta) => void; onToast: (t: string) => void }) {
  const reserve = meta.heritage ? R.contenu.heritages.find((h) => h.id === meta.heritage) : undefined;
  const credit = meta.ryo + (reserve?.prix ?? 0);
  return (
    <section className="boutique">
      <p className="bourse">
        <span className="bourse-montant">
          {meta.ryo} <span aria-hidden="true">両</span>
        </span>
        <span>
          dans ta bourse. Les ryō de chaque vie terminée s’y ajoutent. Un seul héritage par vie : il s’applique à la prochaine.
        </span>
      </p>
      <ul className="heritages">
        {R.contenu.heritages.map((h) => {
          const actif = meta.heritage === h.id;
          const possible = credit >= h.prix;
          return (
            <li key={h.id} className={`heritage ${actif ? 'actif' : ''}`}>
              <div className="heritage-tete">
                <strong>{h.nom}</strong>
                <span className="prix">
                  {h.prix} <span aria-hidden="true">両</span>
                </span>
              </div>
              <p>{h.description}</p>
              {actif ? (
                <button
                  className="btn-secondaire"
                  onClick={() => {
                    onMeta(annulerHeritage(stockage));
                    onToast('Héritage annulé, bourse remboursée.');
                  }}
                >
                  Réservé pour la prochaine vie · Annuler
                </button>
              ) : (
                <button
                  className="btn-secondaire"
                  disabled={!possible}
                  onClick={() => {
                    try {
                      onMeta(acheterHeritage(stockage, h.id));
                      onToast(`${h.nom} : réservé pour ta prochaine vie.`);
                    } catch (e) {
                      onToast((e as Error).message);
                    }
                  }}
                >
                  {possible ? (reserve ? 'Échanger' : 'Acheter') : `Il manque ${h.prix - credit} ryō`}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
