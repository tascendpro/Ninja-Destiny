'use client';

// L'écran de l'Affrontement Racine (§22). Il lit l'état et envoie des actions ; il ne tire jamais au hasard
// et ne calcule aucune issue : tout vient de vueAffrontement().
// Disposition : un face-à-face en tête, la manche qui vient de se jouer, ce que tu lis de lui, puis la commande
// (familles en onglets, actions en cartes, barre de lancement toujours à portée du pouce).

import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../engine/types';
import { accorder } from '../../engine/texte';
import { vueAffrontement } from '../../engine/combat/affrontement';
import type { ActionCombat, DepenseElan, Famille } from '../../engine/combat/types';
import GroupesNature from './GroupesNature';
import Portrait from '../Portrait';
import { classeMulti, styleNatures } from '../natures';
import { naturesMaitrise } from '../../engine/tempsLibre';

const GARDE: Record<string, { mot: string; classe: string }> = {
  ouverte: { mot: 'garde ouverte', classe: 'ouverte' },
  garde: { mot: 'en garde', classe: 'garde' },
  desequilibre: { mot: 'déséquilibré·e', classe: 'desequilibre' },
};

/** Ce que l'issue d'une manche veut dire, en un mot, et sa couleur. */
const ISSUES: Record<string, { mot: string; ton: 'bon' | 'mauvais' | 'neutre' }> = {
  touche: { mot: 'Touché', ton: 'bon' },
  surprise: { mot: 'Surprise', ton: 'bon' },
  decisive: { mot: 'Coup décisif', ton: 'bon' },
  predite: { mot: 'Prédit', ton: 'mauvais' },
  dominee: { mot: 'Dominé', ton: 'mauvais' },
  ecrasee: { mot: 'Écrasé', ton: 'mauvais' },
  ratee: { mot: 'Raté', ton: 'mauvais' },
  annulee: { mot: 'Annulé', ton: 'neutre' },
};

export default function Affrontement({ etat, onCombat }: { etat: GameState; onCombat: (a: ActionCombat) => void }) {
  const v = vueAffrontement(etat);
  const p = etat.creation.presentation;
  const [famille, setFamille] = useState<Famille | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [elan, setElan] = useState<DepenseElan | undefined>(undefined);
  const haut = useRef<HTMLDivElement>(null);
  const nbEntrees = v?.journal.length ?? 0;

  // Une nouvelle manche : on oublie l'action choisie (la famille reste ouverte) et on remonte à la résolution.
  useEffect(() => {
    setChoix(null);
    setElan(undefined);
    if (nbEntrees > 1) haut.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [nbEntrees]);

  const confirmer = (id = choix) => {
    if (!famille || !id) return;
    onCombat({ famille, choix: id, ...(elan ? { elan } : {}) });
  };

  // Raccourcis PC (§22.5) : 1-9 ouvrent une famille, Échap ferme, Entrée lance. Inactifs dans un champ de saisie.
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
      } else if (e.key === 'Escape') {
        setChoix(null);
        setFamille(null);
      } else if (e.key === 'Enter' && choix) confirmer();
    };
    window.addEventListener('keydown', ecoute);
    return () => window.removeEventListener('keydown', ecoute);
  });

  if (!v) return null;
  const fam = v.familles.find((f) => f.id === famille);
  const act = fam?.actions.find((a) => a.id === choix);
  const offensive = famille === 'taijutsu' || famille === 'ninjutsu' || famille === 'arme';
  const pctJ = Math.round((v.joueur.endurance / v.joueur.enduranceMax) * 100);
  const pctC = Math.min(100, Math.round((v.joueur.chakra / Math.max(1, v.joueur.chakraMax)) * 100));
  const manches = v.journal.filter((j) => j.manche > 0);
  const derniere = manches[manches.length - 1];
  const anciennes = manches.slice(0, -1);
  // La réplique d'entrée : avant la première manche, puis dans le journal.
  const entree = v.journal.find((j) => j.manche === 0)?.repliques[0];
  const gA = GARDE[v.adversaire.garde];
  const gJ = GARDE[v.joueur.garde];

  type A = NonNullable<typeof fam>['actions'][number];
  // Toucher une carte la choisit ; la toucher de nouveau la lance. Sous une action : son nom, ses marques, son coût. Rien d'autre.
  const carte = (a: A) => {
    const natures = naturesMaitrise(a.id);
    const choisie = choix === a.id;
    return (
      <button
        key={a.id}
        type="button"
        className={`aff-action${choisie ? ' choisie' : ''}${natures.length ? ' a-nature' : ''}${classeMulti(natures)}`}
        style={styleNatures(natures)}
        disabled={!a.disponible}
        aria-pressed={choisie}
        onClick={() => (choisie ? confirmer(a.id) : setChoix(a.id))}
      >
        <span className="aff-action-nom">{a.nom}</span>
        {(a.marques.length > 0 || a.chakra !== undefined) && (
          <span className="aff-action-meta">
            {a.chakra !== undefined && <span className="aff-cout">{a.chakra} chakra</span>}
            {a.marques.map((m) => (
              <b key={m} className={`aff-marque m-${m.replace(/\s/g, '-')}`}>
                {m}
              </b>
            ))}
          </span>
        )}
        {!a.disponible && a.raison && <span className="aff-action-raison">{accorder(a.raison, p)}</span>}
        {choisie && (
          <span className="aff-action-encore" aria-hidden="true">
            Touche encore pour lancer
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="recit">
      <div className="espace-scene" aria-hidden="true" />
      <article className="recit-texte affrontement">
        <h1 className="titre-scene">{accorder(v.titre, p)}</h1>

        {/* 1. Face-à-face : toi à gauche, l'adversaire à droite */}
        <div className="aff-duel" ref={haut}>
          <div className="aff-carte joueur">
            <span className="aff-avatar">
              <Portrait nom={etat.creation.prenom} village={etat.creation.village} clan={etat.creation.clan} taille={40} />
            </span>
            <div className="aff-carte-corps">
              <span className="aff-carte-nom">{etat.creation.prenom}</span>
              <span className="aff-jauge" role="meter" aria-label="Ton endurance" aria-valuenow={pctJ} aria-valuemin={0} aria-valuemax={100}>
                <i className="aff-endurance" style={{ width: `${pctJ}%` }} />
              </span>
              <span className="aff-jauge fine" role="meter" aria-label="Ton chakra" aria-valuenow={v.joueur.chakra} aria-valuemin={0} aria-valuemax={v.joueur.chakraMax}>
                <i className="aff-chakra" style={{ width: `${pctC}%` }} />
              </span>
              <span className="aff-pastilles">
                <span className="aff-chiffre">
                  {v.joueur.endurance}/{v.joueur.enduranceMax}
                </span>
                {gJ && <span className={`aff-pastille ${gJ.classe}`}>{accorder(gJ.mot, p)}</span>}
                {v.joueur.sonne && <span className="aff-pastille sonne">{accorder('sonné·e', p)}</span>}
                <span className="aff-elan" aria-label={`Élan : ${v.joueur.elan} sur 3`}>
                  {[0, 1, 2].map((i) => (
                    <i key={i} className={i < v.joueur.elan ? 'plein' : ''} aria-hidden="true" />
                  ))}
                </span>
              </span>
            </div>
          </div>
          <div className="aff-centre" aria-hidden="true">
            <span className="aff-tai">対</span>
            <span className="aff-contexte" title={v.contexte.libelle}>
              {v.contexte.kanji}
            </span>
          </div>
          <div className="aff-carte adv">
            <span className="aff-avatar adv" aria-hidden="true">
              敵
            </span>
            <div className="aff-carte-corps">
              <span className="aff-carte-nom">
                {v.adversaire.nom} <small>{v.adversaire.niveau}</small>
              </span>
              <span className="aff-jauge" role="meter" aria-label={`Endurance de ${v.adversaire.nom}`} aria-valuenow={v.adversaire.pct} aria-valuemin={0} aria-valuemax={100}>
                <i className="aff-adv" style={{ width: `${v.adversaire.pct}%` }} />
              </span>
              <span className="aff-pastilles">
                <span className="aff-chiffre">{v.adversaire.pct} %</span>
                {gA && <span className={`aff-pastille ${gA.classe}`}>{accorder(gA.mot, 'masculin')}</span>}
                {v.adversaire.sonne && <span className="aff-pastille sonne">souffle coupé</span>}
              </span>
            </div>
          </div>
          <p className="aff-sous-duel">
            {v.contexte.libelle} · {v.manche}
          </p>
        </div>

        {/* 2. Le fil du combat : la manche qui vient de se jouer, puis le journal replié */}
        <div className="aff-fil">
        {derniere && <BlocManche j={derniere} nom={v.adversaire.nom} p={p} />}
        {!derniere && entree && <Replique nom={v.adversaire.nom} texte={accorder(entree, p)} />}
        {(entree || anciennes.length > 0) && derniere && (
          <details className="aff-journal-replie">
            <summary>Journal du combat ({anciennes.length + 1} manche{anciennes.length ? 's' : ''})</summary>
            <div className="aff-journal">
              {entree && <Replique nom={v.adversaire.nom} texte={accorder(entree, p)} />}
              {[...anciennes, derniere].map((j, i) => (
                <BlocManche key={i} j={j} nom={v.adversaire.nom} p={p} />
              ))}
            </div>
          </details>
        )}
        </div>

        <div className="aff-cote">

        {/* 3. Ce que tu lis de lui pour cette manche */}
        <div className={`aff-annonce fiab-${v.annonce.fiabilite}${v.annonce.mortelle ? ' mortelle' : ''}`}>
          <span className="aff-oeil" aria-hidden="true">
            {v.annonce.mortelle ? '危' : '観'}
          </span>
          <div>
            <span className="aff-etiquette">{v.annonce.mortelle ? 'Danger' : 'Ce que tu lis'}</span>
            <p>{accorder(v.annonce.texte, p)}</p>
            {v.annonce.fiabilite !== 'fiable' && <small>Lecture incertaine : ce n’est peut-être pas ce que {v.adversaire.nom} prépare.</small>}
            {v.lecture.length > 0 && (
              <details className="aff-lecture">
                <summary>Ce que tu sais de {accorder(v.adversaire.nom, p)} ({v.lecture.length})</summary>
                <ul>
                  {v.lecture.map((l, i) => (
                    <li key={i}>{accorder(l, p)}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>

        {/* 4. La commande : familles en onglets, puis les actions en cartes */}
        <section className="aff-commande" aria-label="Ton action pour cette manche">
          <div className="aff-familles" role="tablist" aria-label="Familles d’actions">
            {v.familles.map((f, i) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                className={`aff-famille${famille === f.id ? ' active' : ''}`}
                aria-selected={famille === f.id}
                aria-controls="aff-panneau"
                onClick={() => {
                  setFamille(famille === f.id ? null : f.id);
                  setChoix(null);
                }}
              >
                <span className="aff-famille-kanji" aria-hidden="true">
                  {f.kanji}
                </span>
                <span className="aff-famille-nom">{f.nom}</span>
                <kbd className="touche" aria-hidden="true">
                  {i + 1}
                </kbd>
              </button>
            ))}
          </div>

          {fam ? (
            <div id="aff-panneau" className="aff-panneau" role="tabpanel" aria-label={`Actions : ${fam.nom}`}>
              {(() => {
                const gestes = fam.actions.filter((a) => a.chakra === undefined);
                const techniques = fam.actions.filter((a) => a.chakra !== undefined);
                return (
                  <>
                    {gestes.length > 0 && <div className="aff-cartes">{gestes.map(carte)}</div>}
                    {techniques.length > 0 && <GroupesNature items={techniques} techId={(a) => a.id} titre={`${fam.nom} : techniques par nature`} rendu={carte} />}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="aff-invite">Choisis une famille : frapper, composer des signes, te défendre, observer, parler ou fuir.</p>
          )}

          {/* 5. La barre de lancement : toujours à portée du pouce */}
          {fam && (
            <div className="aff-lancer">
              {offensive && v.joueur.elan >= 1 && (
                <div className="aff-elan-choix" role="group" aria-label="Dépenser de l’élan">
                  <button type="button" aria-pressed={elan === 'puissance'} onClick={() => setElan(elan === 'puissance' ? undefined : 'puissance')}>
                    Puissance <small>· 1 élan</small>
                  </button>
                  {v.joueur.elan >= 3 && (
                    <button type="button" aria-pressed={elan === 'decisif'} onClick={() => setElan(elan === 'decisif' ? undefined : 'decisif')}>
                      Coup décisif <small>· 3 élan</small>
                    </button>
                  )}
                </div>
              )}
              <button type="button" className="btn-principal aff-confirmer" disabled={!act?.disponible} onClick={() => confirmer()}>
                {act ? (
                  <>
                    <span className="aff-confirmer-verbe">{offensive ? 'Lancer' : 'Valider'}</span> {act.nom}
                    {elan && <small> · {elan === 'decisif' ? 'coup décisif' : 'puissance'}</small>}
                  </>
                ) : (
                  'Choisis une action'
                )}
              </button>
            </div>
          )}
        </section>
        </div>
      </article>
    </div>
  );
}

type Entree = NonNullable<ReturnType<typeof vueAffrontement>>['journal'][number];

function Replique({ nom, texte }: { nom: string; texte: string }) {
  return (
    <p className="aff-replique">
      <b>{nom}</b>« {texte} »
    </p>
  );
}

/** Une manche jouée (§22.4) : son issue d'abord, puis le récit d'un seul tenant, la cause, et la réplique. */
function BlocManche({ j, nom, p }: { j: Entree; nom: string; p: GameState['creation']['presentation'] }) {
  const issue = j.issue ? ISSUES[j.issue] : undefined;
  return (
    <section className={`aff-manche-bloc ton-${issue?.ton ?? 'neutre'}`} aria-label={`Manche ${j.manche}`}>
      <header className="aff-manche-tete">
        <h2>Manche {j.manche}</h2>
        {issue && <span className={`aff-issue ${issue.ton}`}>{issue.mot}</span>}
      </header>
      {j.annonce && <p className="aff-annonce-passee">{accorder(j.annonce, p)}</p>}
      <p className="aff-recit-manche">
        {accorder(j.execution, p)} {j.reponse && accorder(j.reponse, p)}
      </p>
      <p className="aff-recit-manche impact">{accorder(j.impact, p)}</p>
      {j.lecture && <p className={`aff-cause issue-${j.issue ?? 'autre'}`}>{accorder(j.lecture, p)}</p>}
      {j.repliques.map((r, k) => (
        <Replique key={k} nom={nom} texte={accorder(r, p)} />
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
