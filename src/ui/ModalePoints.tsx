'use client';

// La modale de répartition. Les points sont d'abord un brouillon, gardé par personnage et partagé par toutes les vues :
// fermer la modale, changer d'onglet ou recharger ne perd rien. « Valider » affiche le récapitulatif, et seule la
// confirmation envoie une action « points ». « Annuler » vide le brouillon, et rien d'autre. Un toucher sur le fond ne
// fait rien. L'onglet « Mon plan » enregistre une façon de progresser : à chaque anniversaire, la modale s'ouvre déjà remplie.

import { useEffect, useRef, useState } from 'react';
import type { AttributId, GameState } from '../engine/types';
import { ATTRIBUTS } from '../engine/types';
import { coutPoint, coutRepartition } from '../engine/progression';
import { ajusterBrouillon, commeLaDerniereFois, planVide, proposer } from '../engine/plan';
import type { Plan, Repartition as Brouillon } from '../engine/plan';
import { ATTRIBUT_LIBELLE } from './libelles';
import { USAGE } from './Repartition';
import { clePerso, usePreferencesPoints } from './preferencesPoints';

/** « +4 Contrôle du chakra, +2 Agilité ». */
export function resumeRepartition(rep: Brouillon): string {
  return ATTRIBUTS.filter((a) => (rep[a] ?? 0) > 0)
    .map((a) => `+${rep[a]} ${ATTRIBUT_LIBELLE[a]}`)
    .join(', ');
}

export function ModalePoints({ etat, onRepartir, onFermer }: { etat: GameState; onRepartir: (rep: Brouillon) => void; onFermer: () => void }) {
  const prefs = usePreferencesPoints(clePerso(etat));
  const [onglet, setOnglet] = useState<'repartir' | 'plan'>('repartir');
  const [recap, setRecap] = useState(false);
  const [origine, setOrigine] = useState<string | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const { brouillon, coupe } = ajusterBrouillon(etat, prefs.brouillon);
  const cout = coutRepartition(etat, brouillon);
  const reste = etat.pointsStat - cout;
  const choisis = ATTRIBUTS.filter((a) => (brouillon[a] ?? 0) > 0);
  const ajouter = (a: AttributId, d: number) => {
    setOrigine(null);
    prefs.setBrouillon({ ...brouillon, [a]: Math.max(0, (brouillon[a] ?? 0) + d) });
  };
  const precedente = commeLaDerniereFois(etat);
  const planActif = !planVide(prefs.plan);

  // À l'ouverture, un brouillon vide est prérempli par le plan : il ne reste qu'à valider.
  useEffect(() => {
    if (Object.keys(prefs.brouillon).length === 0 && prefs.plan && !planVide(prefs.plan)) {
      const p = proposer(etat, prefs.plan);
      if (Object.keys(p).length) {
        prefs.setBrouillon(p);
        setOrigine('Prérempli selon ton plan. Retouche si tu veux, puis valide.');
      }
    } else if (Object.keys(prefs.brouillon).length > 0) setOrigine('Ton brouillon t’attendait, tel que tu l’avais laissé.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    boite.current?.focus();
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);

  const remplir = (rep: Brouillon | undefined, texte: string) => {
    if (!rep) return;
    prefs.setBrouillon(rep);
    setOrigine(texte);
  };

  return (
    <div className="modale-fond" role="presentation">
      <div ref={boite} className="modale" role="dialog" aria-modal="true" aria-labelledby="modale-points-titre" tabIndex={-1}>
        <header className="modale-tete">
          <h2 id="modale-points-titre">{recap ? 'Confirmer la répartition' : onglet === 'plan' ? 'Mon plan de progression' : 'Répartir tes points'}</h2>
          <p className={`modale-compteur${reste === 0 ? ' fini' : ''}`}>
            <strong>{reste}</strong> {reste > 1 ? 'points restants' : 'point restant'}
          </p>
        </header>
        {!recap && (
          <div className="points-onglets" role="tablist" aria-label="Répartition ou plan">
            <button role="tab" aria-selected={onglet === 'repartir'} onClick={() => setOnglet('repartir')}>
              Répartir
            </button>
            <button role="tab" aria-selected={onglet === 'plan'} onClick={() => setOnglet('plan')}>
              Mon plan
              {planActif && <i className="plan-actif" aria-label="actif" />}
            </button>
          </div>
        )}
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
          ) : onglet === 'plan' ? (
            <EditeurPlan etat={etat} plan={prefs.plan} auto={prefs.auto} onPlan={prefs.setPlan} onAuto={prefs.setAuto} />
          ) : (
            <>
              <div className="points-raccourcis">
                {planActif && (
                  <button type="button" className="raccourci-des" onClick={() => remplir(proposer(etat, prefs.plan!), 'Rempli selon ton plan.')}>
                    <span aria-hidden="true">策</span>
                    <strong>Suivre mon plan</strong>
                  </button>
                )}
                {precedente && (
                  <button type="button" className="raccourci-des" onClick={() => remplir(precedente, 'Mêmes proportions que ta dernière répartition.')}>
                    <span aria-hidden="true">再</span>
                    <strong>Comme la dernière fois</strong>
                  </button>
                )}
                {!planActif && (
                  <button type="button" className="raccourci-des" onClick={() => setOnglet('plan')}>
                    <span aria-hidden="true">策</span>
                    <strong>Créer un plan</strong>
                  </button>
                )}
                {choisis.length > 0 && (
                  <button
                    type="button"
                    className="points-annuler"
                    onClick={() => {
                      prefs.vider();
                      setOrigine(null);
                    }}
                  >
                    Annuler ce brouillon
                  </button>
                )}
              </div>
              {(origine || coupe) && (
                <p className="points-note" role="status">
                  {coupe ? 'Ton brouillon ne tenait plus dans tes points : il a été réduit.' : origine}
                </p>
              )}
              <p className="modale-aide">1 point par niveau jusqu’à 60, 2 jusqu’à 80, 3 au-delà. Ton brouillon est gardé : rien n’est appliqué avant ta confirmation.</p>
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
                  prefs.vider();
                  onFermer();
                }}
              >
                Confirmer
              </button>
            </>
          ) : onglet === 'plan' ? (
            <>
              <button type="button" className="btn-secondaire" onClick={onFermer}>
                Fermer
              </button>
              <button
                type="button"
                className="btn-principal"
                disabled={!planActif || etat.pointsStat === 0}
                onClick={() => {
                  remplir(proposer(etat, prefs.plan!), 'Rempli selon ton plan.');
                  setOnglet('repartir');
                }}
              >
                Remplir avec ce plan
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

/** Le plan : les aptitudes à monter dans l'ordre, ou des valeurs à viser. Avec l'aperçu de ce qu'il donnerait aujourd'hui. */
function EditeurPlan({ etat, plan, auto, onPlan, onAuto }: { etat: GameState; plan?: Plan; auto: boolean; onPlan: (p: Plan | undefined) => void; onAuto: (b: boolean) => void }) {
  const mode = plan?.mode === 'cibles' ? 'cibles' : 'priorites';
  const ordre = plan?.mode === 'priorites' ? plan.ordre : [];
  const cibles = plan?.mode === 'cibles' ? plan.cibles : {};
  const apercu = plan && !planVide(plan) && etat.pointsStat > 0 ? proposer(etat, plan) : {};
  const deplacer = (i: number, d: number) => {
    const o = [...ordre];
    const [x] = o.splice(i, 1);
    o.splice(i + d, 0, x);
    onPlan({ mode: 'priorites', ordre: o });
  };
  return (
    <div className="plan">
      <div className="plan-modes" role="radiogroup" aria-label="Type de plan">
        <button role="radio" aria-checked={mode === 'priorites'} onClick={() => onPlan({ mode: 'priorites', ordre })}>
          <strong>Par priorités</strong>
          <small>Monter dans l’ordre, sans tout mettre au même endroit.</small>
        </button>
        <button role="radio" aria-checked={mode === 'cibles'} onClick={() => onPlan({ mode: 'cibles', cibles })}>
          <strong>Par objectifs</strong>
          <small>Viser une valeur pour chaque aptitude.</small>
        </button>
      </div>

      {mode === 'priorites' ? (
        <>
          {ordre.length > 0 ? (
            <ol className="plan-ordre">
              {ordre.map((a, i) => (
                <li key={a}>
                  <span className="plan-rang">{i + 1}</span>
                  <span className="plan-nom">
                    {ATTRIBUT_LIBELLE[a]} <small>{etat.attributs[a]}</small>
                  </span>
                  <button type="button" className="pl-bouton" disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label={`Monter ${ATTRIBUT_LIBELLE[a]}`}>
                    ↑
                  </button>
                  <button type="button" className="pl-bouton" disabled={i === ordre.length - 1} onClick={() => deplacer(i, 1)} aria-label={`Descendre ${ATTRIBUT_LIBELLE[a]}`}>
                    ↓
                  </button>
                  <button type="button" className="pl-bouton" onClick={() => onPlan({ mode: 'priorites', ordre: ordre.filter((x) => x !== a) })} aria-label={`Retirer ${ATTRIBUT_LIBELLE[a]} du plan`}>
                    ×
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="modale-aide">Touche les aptitudes ci-dessous, de la plus importante à la moins importante.</p>
          )}
          <div className="plan-ajouts">
            {ATTRIBUTS.filter((a) => !ordre.includes(a)).map((a) => (
              <button key={a} type="button" className="plan-ajout" onClick={() => onPlan({ mode: 'priorites', ordre: [...ordre, a] })}>
                + {ATTRIBUT_LIBELLE[a]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <ul className="points-liste plan-cibles">
          {ATTRIBUTS.map((a) => {
            const c = cibles[a] ?? 0;
            const regler = (v: number) => onPlan({ mode: 'cibles', cibles: { ...cibles, [a]: Math.max(0, Math.min(100, v)) } });
            // Le premier « + » part du multiple de 5 au-dessus de la valeur actuelle : un objectif déjà atteint ne sert à rien.
            const plusUn = c > etat.attributs[a] ? c + 5 : Math.floor(etat.attributs[a] / 5) * 5 + 5;
            return (
              <li key={a} className={c > etat.attributs[a] ? 'modifie' : undefined}>
                <span className="pl-nom">
                  {ATTRIBUT_LIBELLE[a]}
                  <small>aujourd’hui {etat.attributs[a]}</small>
                </span>
                <span className="pl-valeur">{c > etat.attributs[a] ? <b>{c}</b> : '—'}</span>
                <span className="pl-boutons">
                  <button
                    type="button"
                    className="pl-bouton"
                    disabled={c <= etat.attributs[a]}
                    onClick={() => regler(c - 5 <= etat.attributs[a] ? 0 : c - 5)}
                    aria-label={`Baisser l’objectif en ${ATTRIBUT_LIBELLE[a]}`}
                  >
                    −
                  </button>
                  <button type="button" className="pl-bouton" disabled={c >= 100 || etat.attributs[a] >= 100} onClick={() => regler(plusUn)} aria-label={`Monter l’objectif en ${ATTRIBUT_LIBELLE[a]}`}>
                    +
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {Object.keys(apercu).length > 0 && (
        <p className="plan-apercu">
          Avec tes {etat.pointsStat} points d’aujourd’hui : <b>{resumeRepartition(apercu)}</b>.
        </p>
      )}

      <label className="plan-auto">
        <input type="checkbox" checked={auto && !planVide(plan)} disabled={planVide(plan)} onChange={(e) => onAuto(e.target.checked)} />
        <span>
          <strong>Appliquer mon plan automatiquement</strong>
          <small>À chaque anniversaire, tes points sont validés selon ce plan. Tu peux annuler juste après, tant que tu n’as rien fait d’autre.</small>
        </span>
      </label>
    </div>
  );
}
