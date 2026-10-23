'use client';

// L'écran de l'Affrontement Racine (§22). Il lit l'état et envoie des actions ; il ne tire jamais au hasard
// et ne calcule aucune issue : tout vient de vueAffrontement().

import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../engine/types';
import { accorder } from '../../engine/texte';
import { vueAffrontement } from '../../engine/combat/affrontement';
import type { ActionCombat, DepenseElan, Famille } from '../../engine/combat/types';

const KANJI_NATURE: Record<string, string> = { katon: '火', suiton: '水', fuuton: '風', raiton: '雷', doton: '土' };
const GARDE: Record<string, string> = { ouverte: 'garde ouverte', garde: 'en garde', desequilibre: 'déséquilibré·e' };

export default function Affrontement({ etat, onCombat }: { etat: GameState; onCombat: (a: ActionCombat) => void }) {
  const v = vueAffrontement(etat);
  const p = etat.creation.presentation;
  const [famille, setFamille] = useState<Famille | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [elan, setElan] = useState<DepenseElan | undefined>(undefined);
  const finJournal = useRef<HTMLDivElement>(null);
  const nbEntrees = v?.journal.length ?? 0;

  // Une nouvelle manche : on referme le panneau et on montre la dernière résolution.
  useEffect(() => {
    setChoix(null);
    setElan(undefined);
    finJournal.current?.scrollIntoView({ block: 'nearest' });
  }, [nbEntrees]);

  const confirmer = () => {
    if (!famille || !choix) return;
    onCombat({ famille, choix, ...(elan ? { elan } : {}) });
  };

  // Raccourcis PC (§22.5) : 1-9 ouvrent une famille, Échap ferme, Entrée confirme. Inactifs dans un champ de saisie.
  useEffect(() => {
    if (!v) return;
    const ecoute = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const cible = e.target as HTMLElement | null;
      if (cible && ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) return;
      if (/^[1-9]$/.test(e.key)) {
        const f = v.familles[Number(e.key) - 1];
        if (f) {
          setFamille(f.id);
          setChoix(null);
        }
      } else if (e.key === 'Escape') setFamille(null);
      else if (e.key === 'Enter' && choix) confirmer();
    };
    window.addEventListener('keydown', ecoute);
    return () => window.removeEventListener('keydown', ecoute);
  });

  if (!v) return null;
  const fam = v.familles.find((f) => f.id === famille);
  const act = fam?.actions.find((a) => a.id === choix);
  const offensive = famille === 'taijutsu' || famille === 'ninjutsu';
  const pctJ = Math.round((v.joueur.endurance / v.joueur.enduranceMax) * 100);
  const manches = v.journal.filter((j) => j.manche > 0);
  const derniere = manches[manches.length - 1];
  const anciennes = manches.slice(0, -1);
  // La réplique d'entrée : avant la première manche, puis dans le journal.
  const entree = v.journal.find((j) => j.manche === 0)?.repliques[0];

  return (
    <div className="recit">
      <div className="espace-scene" aria-hidden="true" />
      <article className="recit-texte affrontement">
        <h1 className="titre-scene">{accorder(v.titre, p)}</h1>

        {/* 1. Bandeau : manche, contexte, adversaire */}
        <div className="aff-bandeau">
          <span className="aff-contexte">
            <span className="aff-kanji" aria-hidden="true">
              {v.contexte.kanji}
            </span>
            {v.contexte.libelle}
          </span>
          <span className="aff-manche">{v.manche}</span>
        </div>

        {/* 2. Jauges */}
        <div className="aff-jauges">
          <div className="aff-camp">
            <span className="aff-nom">
              <b>{v.adversaire.nom}</b> <small>· {v.adversaire.niveau}</small>
            </span>
            <span className="aff-jauge" role="meter" aria-label={`Endurance de ${v.adversaire.nom}`} aria-valuenow={v.adversaire.pct} aria-valuemin={0} aria-valuemax={100}>
              <i className="aff-adv" style={{ width: `${v.adversaire.pct}%` }} />
            </span>
            <small className="aff-etat">
              {v.adversaire.pct} % · {GARDE[v.adversaire.garde]}
              {v.adversaire.sonne && ' · le souffle coupé'}
            </small>
          </div>
          <div className="aff-camp">
            <span className="aff-nom">
              <b>{etat.creation.prenom}</b>
            </span>
            <span className="aff-jauge" role="meter" aria-label="Ton endurance" aria-valuenow={pctJ} aria-valuemin={0} aria-valuemax={100}>
              <i className="aff-endurance" style={{ width: `${pctJ}%` }} />
            </span>
            <span className="aff-jauge fine" role="meter" aria-label="Ton chakra" aria-valuenow={v.joueur.chakra} aria-valuemin={0} aria-valuemax={v.joueur.chakraMax}>
              <i className="aff-chakra" style={{ width: `${Math.min(100, (v.joueur.chakra / Math.max(1, v.joueur.chakraMax)) * 100)}%` }} />
            </span>
            <small className="aff-etat">
              Endurance {v.joueur.endurance}/{v.joueur.enduranceMax} · chakra {v.joueur.chakra} · {accorder(GARDE[v.joueur.garde], p)}
              {v.joueur.sonne && accorder(' · sonné·e', p)}
            </small>
            <span className="aff-elan" aria-label={`Élan : ${v.joueur.elan} sur 3`}>
              Élan
              {[0, 1, 2].map((i) => (
                <i key={i} className={i < v.joueur.elan ? 'plein' : ''} aria-hidden="true" />
              ))}
              <span className="visuellement-cache">{v.joueur.elan} sur 3</span>
            </span>
          </div>
        </div>

        {/* La manche qui vient de se jouer, juste sous les jauges : son résultat, puis la suite. */}
        {derniere && <BlocManche j={derniere} nom={v.adversaire.nom} p={p} />}
        {!derniere && entree && (
          <p className="aff-replique aff-entree">
            <b>{v.adversaire.nom} :</b> « {accorder(entree, p)} »
          </p>
        )}
        <div ref={finJournal} />

        {/* 3. L'annonce de cette manche */}
        <div className={`aff-annonce fiab-${v.annonce.fiabilite}${v.annonce.mortelle ? ' mortelle' : ''}`}>
          <span className="aff-etiquette">{v.annonce.mortelle ? 'Danger' : 'Ce que tu lis'}</span>
          <p>{accorder(v.annonce.texte, p)}</p>
          {v.annonce.fiabilite !== 'fiable' && <small>Lecture incertaine : ce n’est peut-être pas ce que {v.adversaire.nom} prépare.</small>}
        </div>

        {v.lecture.length > 0 && (
          <details className="aff-lecture">
            <summary>Fiche de lecture ({v.lecture.length})</summary>
            <ul>
              {v.lecture.map((l, i) => (
                <li key={i}>{accorder(l, p)}</li>
              ))}
            </ul>
          </details>
        )}

        {/* 4. Familles */}
        <div className="aff-familles" role="group" aria-label="Familles d’actions">
          {v.familles.map((f, i) => (
            <button
              key={f.id}
              className={`aff-famille${famille === f.id ? ' active' : ''}`}
              aria-expanded={famille === f.id}
              aria-controls="aff-panneau"
              onClick={() => {
                setFamille(famille === f.id ? null : f.id);
                setChoix(null);
              }}
            >
              <span className="aff-famille-kanji" aria-hidden="true">
                {f.kanji}
              </span>
              <span>{f.nom}</span>
              <kbd className="touche" aria-hidden="true">
                {i + 1}
              </kbd>
            </button>
          ))}
        </div>

        {/* 5. Panneau d'action */}
        {fam && (
          <div id="aff-panneau" className="aff-panneau" role="group" aria-label={`Actions : ${fam.nom}`}>
            {fam.actions.map((a) => (
              <button
                key={a.id}
                className={`aff-action${choix === a.id ? ' choisie' : ''}${a.nature ? ' a-nature' : ''}`}
                style={a.nature ? ({ '--nat': `var(--n-${a.nature}, var(--or))` } as React.CSSProperties) : undefined}
                disabled={!a.disponible}
                aria-pressed={choix === a.id}
                onClick={() => setChoix(a.id)}
              >
                <span className="aff-action-nom">
                  {a.nature && (
                    <span className="badge-nature" aria-hidden="true">
                      {KANJI_NATURE[a.nature] ?? '術'}
                    </span>
                  )}
                  {a.nom}
                  {a.marques.map((m) => (
                    <b key={m} className={`aff-marque m-${m.replace(/\s/g, '-')}`}>
                      {m}
                    </b>
                  ))}
                </span>
                <span className="aff-action-meta">
                  {a.chance !== undefined && `Exécution ${a.chance} %`}
                  {a.chakra !== undefined && ` · ${a.chakra} chakra`}
                </span>
                <span className="aff-action-detail">{accorder(a.raison ?? a.detail, p)}</span>
              </button>
            ))}
            {offensive && v.joueur.elan >= 1 && (
              <div className="aff-elan-choix" role="group" aria-label="Dépenser de l’élan">
                <button aria-pressed={elan === 'puissance'} onClick={() => setElan(elan === 'puissance' ? undefined : 'puissance')}>
                  Puissance <small>· 1 élan, +10</small>
                </button>
                {v.joueur.elan >= 3 && (
                  <button aria-pressed={elan === 'decisif'} onClick={() => setElan(elan === 'decisif' ? undefined : 'decisif')}>
                    Coup décisif <small>· 3 élan</small>
                  </button>
                )}
              </div>
            )}
            <button className="btn-principal aff-confirmer" disabled={!act?.disponible} onClick={confirmer}>
              {act ? `Confirmer : ${act.nom}` : 'Choisis une action'}
            </button>
          </div>
        )}
        {/* 6. Journal : repliable, toutes les manches depuis le début. */}
        {(entree || anciennes.length > 0) && derniere && (
          <details className="aff-journal-replie">
            <summary>Journal du combat ({anciennes.length + 1} manche{anciennes.length ? 's' : ''})</summary>
            <div className="aff-journal">
              {entree && (
                <p className="aff-replique">
                  <b>{v.adversaire.nom} :</b> « {accorder(entree, p)} »
                </p>
              )}
              {[...anciennes, derniere].map((j, i) => (
                <BlocManche key={i} j={j} nom={v.adversaire.nom} p={p} />
              ))}
            </div>
          </details>
        )}
      </article>
    </div>
  );
}

type Entree = NonNullable<ReturnType<typeof vueAffrontement>>['journal'][number];

/** Une manche jouée, en trois temps (§22.4) : exécution, réponse, impact ; puis la cause, puis la réplique. */
function BlocManche({ j, nom, p }: { j: Entree; nom: string; p: GameState['creation']['presentation'] }) {
  return (
    <section className="aff-manche-bloc" aria-label={`Manche ${j.manche}`}>
      <h2>Manche {j.manche}</h2>
      {j.annonce && <p className="aff-annonce-passee">{accorder(j.annonce, p)}</p>}
      <p>
        <span className="aff-etiquette">Exécution</span> {accorder(j.execution, p)}
      </p>
      {j.reponse && (
        <p>
          <span className="aff-etiquette">Réponse</span> {accorder(j.reponse, p)}
        </p>
      )}
      <p>
        <span className="aff-etiquette">Impact</span> {accorder(j.impact, p)}
      </p>
      <p className={`aff-cause issue-${j.issue ?? 'autre'}`}>{accorder(j.lecture, p)}</p>
      {j.repliques.map((r, k) => (
        <p key={k} className="aff-replique">
          <b>{nom} :</b> « {accorder(r, p)} »
        </p>
      ))}
    </section>
  );
}

/** La carte de bilan d'un affrontement (§16.2). */
export function CarteBilan({ bilan, presentation }: { bilan: NonNullable<Extract<GameState['scene'], { type: 'resultat' }>['bilanCombat']>; presentation: GameState['creation']['presentation'] }) {
  const lignes: [string, string[]][] = [
    ['Ce qui a marché', bilan.marche ? [bilan.marche] : []],
    ['Ce qui a échoué', bilan.echoue ? [bilan.echoue] : []],
    ['Ce que tu as appris', bilan.appris],
    ['Ce qu’il a appris', bilan.ilAppris],
    ['Progression', bilan.progression],
    ['À travailler', bilan.travailler ? [bilan.travailler] : []],
  ];
  return (
    <section className="aff-bilan" aria-label="Bilan du combat">
      <h2>Bilan du combat</h2>
      <dl>
        {lignes
          .filter(([, l]) => l.length)
          .map(([t, l]) => (
            <div key={t}>
              <dt>{t}</dt>
              {l.map((x, i) => (
                <dd key={i}>{accorder(x, presentation)}</dd>
              ))}
            </div>
          ))}
      </dl>
    </section>
  );
}
