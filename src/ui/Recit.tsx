'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameState, LieuDef, Presentation } from '../engine/types';
import { accorder } from '../engine/texte';
import { R } from '../engine/registre';
import { vueCombat, vueEvenement, lieuCourant } from '../engine/moteur';
import { duoPossible, genererActivites, periodeMax } from '../engine/tempsLibre';
import type { Activite } from '../engine/tempsLibre';
import { libelleDuree, libellePeriode, saisonDe } from '../engine/calendrier';
import Portrait from './Portrait';
import Repartition from './Repartition';
import { remonter } from './defilement';
import { ATTRIBUT_LIBELLE, ETAT_PNJ, KANJI_SAISON, vueChangements } from './libelles';
import { defPnj } from '../engine/etat';
import type { AttributId } from '../engine/types';

/** Le lieu et la saison sont déjà dans la barre du haut : la scène commence directement par son titre. */
export function ColonneScene({
  children,
}: {
  lieu?: LieuDef;
  graine?: string;
  theme?: 'nuit' | 'washi';
  anime?: boolean;
  saison?: string;
  etat?: GameState;
  children?: React.ReactNode;
}) {
  return children ? <div className="lieu-bandeau lieu-marques">{children}</div> : <div className="espace-scene" aria-hidden="true" />;
}

function Paragraphes({ texte, presentation }: { texte: string; presentation: Presentation }) {
  return (
    <div className="texte-recit">
      {accorder(texte, presentation)
        .split(/\n\n+/)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

const RISQUE_CLASSE: Record<string, string> = { faible: 'risque-faible', modéré: 'risque-modere', élevé: 'risque-eleve', extrême: 'risque-extreme' };
const ISSUE: Record<string, string> = { critique: 'Réussite éclatante', succes: 'Réussite', partiel: 'Réussite partielle', echec: 'Échec' };

/** Raccourcis clavier : 1 à 9 pour choisir, Entrée pour continuer. */
function useRaccourcis(actif: boolean, onTouche: (k: string) => void) {
  useEffect(() => {
    if (!actif) return;
    const ecoute = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const cible = e.target as HTMLElement | null;
      if (cible && ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) return;
      onTouche(e.key);
    };
    window.addEventListener('keydown', ecoute);
    return () => window.removeEventListener('keydown', ecoute);
  }, [actif, onTouche]);
}

export default function Recit({
  etat,
  theme,
  anime,
  onChoisir,
  onContinuer,
  onActivite,
  onRepartir,
  onManche,
}: {
  etat: GameState;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onChoisir: (id: string) => void;
  onContinuer: () => void;
  onActivite: (id: string) => void;
  onRepartir: (rep: Partial<Record<AttributId, number>>) => void;
  onManche: (id: string) => void;
}) {
  const [scelle, setScelle] = useState<string | null>(null);
  const cle = etat.scene.type === 'evenement' ? etat.scene.id : `${etat.scene.type}-${etat.actions.length}`;
  const p = etat.creation.presentation;
  // En Légende, les chances exactes restent cachées : seul le niveau de risque est affiché.
  const precis = etat.creation.difficulte !== 'legende';

  useEffect(() => {
    setScelle(null);
    remonter();
  }, [cle]);

  const choisir = (id: string) => {
    if (scelle) return;
    setScelle(id);
    window.setTimeout(() => onChoisir(id), anime ? 430 : 0);
  };

  const vue = etat.scene.type === 'evenement' ? vueEvenement(etat) : undefined;
  useRaccourcis(etat.scene.type === 'evenement' || etat.scene.type === 'resultat', (k) => {
    if (etat.scene.type === 'resultat' && k === 'Enter') onContinuer();
    if (vue && /^[1-9]$/.test(k)) {
      const ch = vue.choix[Number(k) - 1];
      if (ch?.disponible) choisir(ch.id);
    }
  });

  const saison = KANJI_SAISON[saisonDe(etat.jour)];

  if (etat.scene.type === 'evenement' && vue) {
    return (
      <div className="recit" key={cle}>
        <ColonneScene lieu={vue.lieu} graine={vue.lieu.id} theme={theme} anime={anime} saison={saison} etat={etat}>
          {vue.rare && <span className="rare-marque">Événement rare</span>}
        </ColonneScene>
        <article className="recit-texte">
          <h1 className="titre-scene">{accorder(vue.titre, p)}</h1>
          {vue.personnages.length > 0 && (
            <div className="portraits">
              {vue.personnages.map((x) => (
                <span className="portrait" key={x.id}>
                  <Portrait nom={x.nom} genre={x.genre} village={x.village} clan={x.clan} taille={34} mort={x.etat === 'mort'} />
                  <span>
                    {x.nom}
                    {ETAT_PNJ[x.etat] ? ` (${accorder(ETAT_PNJ[x.etat], x.genre === 'f' ? 'feminin' : 'masculin')})` : ''}
                  </span>
                </span>
              ))}
            </div>
          )}
          <Paragraphes texte={vue.texte} presentation={p} />
          <ol className="choix-liste" aria-label="Choix">
            {vue.choix.map((ch, i) => (
              <li key={ch.id}>
                <button
                  className={`choix ${scelle === ch.id ? 'scelle' : ''}`}
                  data-sceau="決"
                  disabled={!ch.disponible || (scelle !== null && scelle !== ch.id)}
                  onClick={() => choisir(ch.id)}
                >
                  <span className="choix-texte">{accorder(ch.texte, p)}</span>
                  {i < 9 && (
                    <kbd className="touche" aria-hidden="true">
                      {i + 1}
                    </kbd>
                  )}
                  {(ch.verrou || ch.indice || ch.risque || ch.duree || ch.manches) && (
                    <span className="choix-meta">
                      {ch.verrou && <span>{accorder(ch.verrou, p)}</span>}
                      {ch.risque && (
                        <span className={RISQUE_CLASSE[ch.risque]}>
                          {precis && ch.chance !== undefined ? `${ch.chance} % de réussite` : `Risque ${ch.risque}`}
                          {ch.principal && ` · ${ATTRIBUT_LIBELLE[ch.principal]}`}
                        </span>
                      )}
                      {ch.manches && <span>Combat en {ch.manches} manches</span>}
                      {ch.duree && <span>Durée : {ch.duree}</span>}
                      {ch.indice && <span>{accorder(ch.indice, p)}</span>}
                    </span>
                  )}
                </button>
                {ch.attaques && (
                  <div className="attaques" role="group" aria-label="Attaques spéciales">
                    <span className="attaques-titre">Ou avec une attaque spéciale :</span>
                    {ch.attaques.map((at) => (
                      <button
                        key={at.id}
                        className={`attaque ${scelle === at.id ? 'scelle' : ''}`}
                        data-sceau="技"
                        disabled={scelle !== null && scelle !== at.id}
                        onClick={() => choisir(at.id)}
                      >
                        <span className="attaque-nom">{at.nom}</span>
                        <span className="attaque-meta">
                          {at.chakra > 0 ? `${at.chakra} chakra` : 'sans chakra'}
                          {at.avantage === 'fort' && <b className="risque-faible"> · avantage d’élément</b>}
                          {at.avantage === 'faible' && <b className="risque-eleve"> · élément défavorable</b>}
                          <span className={RISQUE_CLASSE[at.risque]}> · {precis ? `${at.chance} %` : `risque ${at.risque}`}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </article>
      </div>
    );
  }

  if (etat.scene.type === 'resultat') {
    const sc = etat.scene;
    const ev = R.evenements[sc.evenementId];
    const lieu = ev ? lieuCourant(etat, ev.lieu) : lieuCourant(etat, '$village');
    const csq = vueChangements(etat, sc.changements);
    return (
      <div className="recit" key={cle}>
        <ColonneScene lieu={lieu} graine={lieu.id} theme={theme} anime={anime} saison={saison} etat={etat} />
        <article className="recit-texte">
          <h1 className="titre-scene">{accorder(sc.titre, p)}</h1>
          <p className="resultat-choix">{accorder(sc.choix, p)}</p>
          {sc.issue && <span className={`issue issue-${sc.issue}`}>{ISSUE[sc.issue]}</span>}
          <div aria-live="polite">
            <Paragraphes texte={sc.texte} presentation={p} />
          </div>
          {csq.length > 0 && (
            <ul className="consequences" aria-label="Conséquences">
              {csq.map((c, i) => (
                <li key={i} className={`csq ${c.classe}`}>
                  {accorder(c.texte, p)}
                </li>
              ))}
            </ul>
          )}
          <div className="actions-bas">
            <button className="btn-principal" onClick={onContinuer} autoFocus>
              {etat.fin ? 'Voir le bilan' : 'Continuer'}
            </button>
          </div>
        </article>
      </div>
    );
  }

  if (etat.scene.type === 'temps_libre') {
    return <TempsLibre etat={etat} theme={theme} anime={anime} onActivite={onActivite} onRepartir={onRepartir} />;
  }

  if (etat.scene.type === 'combat') {
    return <Combat etat={etat} onManche={onManche} />;
  }

  if (etat.scene.type === 'bilan') {
    return <Bilan etat={etat} theme={theme} anime={anime} onContinuer={onContinuer} />;
  }

  return null;
}

// ── Temps libre ────────────────────────────────────────────────

type CategorieTL = 'missions' | 'route' | 'entrainement' | 'techniques' | 'liens' | 'vie' | 'forge';

const CATEGORIES: { id: CategorieTL; nom: string; filtre: (a: Activite) => boolean }[] = [
  { id: 'missions', nom: 'Missions', filtre: (a) => a.categorie === 'mission' },
  { id: 'route', nom: 'Route', filtre: (a) => a.categorie === 'route' },
  { id: 'entrainement', nom: 'Disciplines', filtre: (a) => a.categorie === 'entrainement' },
  { id: 'techniques', nom: 'Techniques', filtre: (a) => a.categorie === 'technique' },
  { id: 'liens', nom: 'Liens', filtre: (a) => a.categorie === 'social' || a.categorie === 'famille' },
  { id: 'vie', nom: 'Vie', filtre: (a) => ['repos', 'etude', 'travail', 'metier'].includes(a.categorie) },
  { id: 'forge', nom: 'Échoppe', filtre: (a) => a.categorie === 'forge' || a.categorie === 'equipement' },
];

const SOUS_GROUPES_ENTRAINEMENT: { titre: string; filtre: (a: Activite) => boolean }[] = [
  { titre: 'Clan, pouvoirs et natures', filtre: (a) => /^entrainer:(?!famille_|taijutsu|ninjutsu|genjutsu)/.test(a.id) },
  { titre: 'Disciplines', filtre: (a) => /^entrainer:(taijutsu|ninjutsu|genjutsu)$/.test(a.id) },
  { titre: 'Familles d’armes', filtre: (a) => a.id.startsWith('entrainer:famille_') },
  { titre: 'Apprendre une nouvelle nature', filtre: (a) => a.id.startsWith('nature:') },
];

function LigneActivite({
  a,
  p,
  onActivite,
  choisie = false,
  cocher = false,
}: {
  a: Activite;
  p: Presentation;
  onActivite: (id: string) => void;
  choisie?: boolean;
  cocher?: boolean;
}) {
  const prog = a.progression;
  return (
    <li>
      <button
        className={`activite${choisie ? ' choisie' : ''}${!a.disponible ? ' bloquee' : ''}`}
        disabled={!a.disponible}
        aria-pressed={a.groupe && cocher ? choisie : undefined}
        onClick={() => onActivite(a.id)}
      >
        <span className="act-nom">
          {a.groupe && cocher && <span className="act-coche" aria-hidden="true">{choisie ? '✓' : ''}</span>}
          {accorder(a.libelle, p)}
        </span>
        {prog && (
          <span className="act-progression">
            <span className="act-pips" aria-label={`Palier ${prog.tier} sur 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={n <= prog.tier ? 'atteint' : ''} />
              ))}
            </span>
            {prog.prochain && a.disponible && (
              <span className="act-barre" aria-label={`Vers le palier ${prog.prochain} : ${Math.round(prog.pct * 100)} %`}>
                <i style={{ width: `${Math.round(prog.pct * 100)}%` }} />
              </span>
            )}
            {prog.prochain && a.disponible && <small>{Math.round(prog.pct * 100)} % vers le palier {prog.prochain}</small>}
          </span>
        )}
        <span className={`act-detail${!a.disponible ? ' rouge' : ''}`}>{accorder((a.disponible ? a.description : a.raison) ?? '', p)}</span>
        {a.disponible && a.alerte && <span className="act-detail rouge">{accorder(a.alerte, p)}</span>}
        {a.duree > 0 && <span className="act-duree">{libelleDuree(a.duree)}</span>}
      </button>
    </li>
  );
}

function TempsLibre({
  etat,
  theme,
  anime,
  onActivite,
  onRepartir,
}: {
  etat: GameState;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onActivite: (id: string) => void;
  onRepartir: (rep: Partial<Record<AttributId, number>>) => void;
}) {
  const acts = useMemo(() => genererActivites(etat), [etat]);
  const p = etat.creation.presentation;
  const lieu = lieuCourant(etat, '$village');
  const parCategorie = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, acts.filter(c.filtre)])) as Record<CategorieTL, Activite[]>, [acts]);
  const visibles = CATEGORIES.filter((c) => parCategorie[c.id].length > 0);
  const defaut = visibles.find((c) => parCategorie[c.id].some((a) => a.disponible))?.id ?? visibles[0]?.id ?? 'vie';
  const [choisie, setChoisie] = useState<CategorieTL | null>(null);
  const cat = choisie && parCategorie[choisie]?.length ? choisie : defaut;

  // Programme d'entraînement : une technique et une discipline, à combiner sur la même période.
  const [programme, setProgramme] = useState<{ sort?: string; discipline?: string }>({});
  useEffect(() => setProgramme({}), [etat.actions.length]);
  const valides = {
    sort: acts.find((a) => a.id === programme.sort && a.disponible),
    discipline: acts.find((a) => a.id === programme.discipline && a.disponible),
  };
  const double = duoPossible(etat);
  const clic = (id: string) => {
    const a = acts.find((x) => x.id === id);
    // Avant le bandeau : un seul entraînement à la fois, lancé directement.
    if (!a?.groupe || !double) return onActivite(id);
    const g = a.groupe;
    setProgramme((pr) => ({ ...pr, [g]: pr[g] === id ? undefined : id }));
  };
  const lancer = () => {
    const { sort, discipline } = valides;
    if (sort && discipline) onActivite(`duo:${sort.id}+${discipline.id}`);
    else if (sort || discipline) onActivite((sort ?? discipline)!.id);
  };
  const estChoisie = (a: Activite) => !!a.groupe && programme[a.groupe] === a.id;

  const alertes: string[] = [];
  if (etat.jauges.fatigue >= 60) alertes.push('La fatigue s’accumule : t’entraîner encore expose à la blessure.');
  if (etat.blessures.some((b) => b.gravite >= 3)) alertes.push('Blessure grave : repos obligatoire, aucune mission.');
  else if (etat.blessures.length) alertes.push(`Blessure en cours : ${etat.blessures.map((b) => b.nom.toLowerCase()).join(', ')}.`);

  const liste = parCategorie[cat] ?? [];
  const achatsHorsPortee = cat === 'forge' ? liste.filter((a) => a.id.startsWith('forge:acheter:') && !a.disponible) : [];
  const sansAchats = liste.filter((a) => !achatsHorsPortee.includes(a));
  // Ce qui ne peut pas progresser (en rouge) descend tout en bas de la liste.
  const bloquees = cat === 'entrainement' || cat === 'techniques' ? sansAchats.filter((a) => !a.disponible) : [];
  const principales = sansAchats.filter((a) => !bloquees.includes(a));

  return (
    <div className="recit">
      <ColonneScene lieu={lieu} graine={`${lieu.id}-libre`} theme={theme} anime={anime} saison={KANJI_SAISON[saisonDe(etat.jour)]} etat={etat} />
      <section className="recit-texte">
        <h1 className="titre-scene">Temps libre</h1>
        <p className="tl-intro">
          Une seule décision pour les {periodeMax(etat) >= 360 ? 'mois' : 'semaines'} qui viennent : à quoi les consacres-tu ? Le temps passera jusqu’au prochain moment important, {periodeMax(etat) >= 360 ? 'un an' : 'six mois'} au plus.
        </p>
        {alertes.map((a) => (
          <p key={a} className="alerte">
            {accorder(a, p)}
          </p>
        ))}
        {etat.annonce && (
          <p className="annonce" role="status">
            {accorder(etat.annonce, p)}
          </p>
        )}
        {etat.pointsStat > 0 && <Repartition etat={etat} onRepartir={onRepartir} compact />}
        <div className="segments tl-categories" role="tablist" aria-label="Catégories d’activités">
          {visibles.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setChoisie(c.id)}>
              {c.nom}
              <span className="compte">{parCategorie[c.id].filter((a) => a.disponible).length}</span>
            </button>
          ))}
        </div>
        {cat === 'entrainement' ? (
          SOUS_GROUPES_ENTRAINEMENT.map((g) => {
            const l = principales.filter(g.filtre);
            if (!l.length) return null;
            return (
              <div className="sous-groupe" key={g.titre}>
                <h3>{g.titre}</h3>
                <ul className="activites">
                  {l.map((a) => (
                    <LigneActivite key={a.id} a={a} p={p} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <ul className="activites sous-groupe">
            {principales.map((a) => (
              <LigneActivite key={a.id} a={a} p={p} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
            ))}
          </ul>
        )}
        {bloquees.length > 0 && (
          <div className="sous-groupe bloquees">
            <h3>Impossible de progresser pour l’instant</h3>
            <ul className="activites">
              {bloquees.map((a) => (
                <LigneActivite key={a.id} a={a} p={p} onActivite={clic} />
              ))}
            </ul>
          </div>
        )}
        {double && (cat === 'techniques' || cat === 'entrainement') && !valides.sort && !valides.discipline && (
          <p className="programme-aide">Coche une discipline et une technique : les deux progressent pendant la même période.</p>
        )}
        {double && (valides.sort || valides.discipline) && (
          <div className="programme actif" role="region" aria-label="Programme d’entraînement">
            <span className="programme-choix">
              {[valides.discipline, valides.sort].filter(Boolean).map((a) => (
                <b key={a!.id}>{accorder(a!.libelle.replace(/^Apprendre /, ''), p)}</b>
              ))}
              {!(valides.sort && valides.discipline) && <small>{valides.sort ? '+ une discipline ?' : '+ une technique ?'}</small>}
            </span>
            <button className="btn-principal" onClick={lancer}>
              Lancer
            </button>
          </div>
        )}
        {cat === 'forge' && <p className="sous-titre" style={{ marginTop: 12 }}>Achats, réparations et changement d’arme sont instantanés : ils ne comptent pas comme ta décision. Pilules, parchemins et fumigènes s’utilisent pendant les combats en manches.</p>}
        {achatsHorsPortee.length > 0 && (
          <details className="hors-portee">
            <summary>Hors de portée pour l’instant ({achatsHorsPortee.length})</summary>
            <ul className="activites">
              {achatsHorsPortee.map((a) => (
                <LigneActivite key={a.id} a={a} p={p} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

// ── Combat en manches ──────────────────────────────────────────

function Combat({ etat, onManche }: { etat: GameState; onManche: (id: string) => void }) {
  const v = vueCombat(etat);
  const p = etat.creation.presentation;
  const precis = etat.creation.difficulte !== 'legende';
  if (!v) return null;
  return (
    <div className="recit">
      <div className="espace-scene" aria-hidden="true" />
      <article className="recit-texte combat">
        <h1 className="titre-scene">{accorder(v.titre, p)}</h1>
        <div className="combat-etat">
          <span>
            Manche {v.manche + 1} sur {v.total}
          </span>
          <span className="combat-pips" aria-label={`${v.touches} coups portés, ${v.ripostes} ripostes encaissées`}>
            {Array.from({ length: v.total }, (_, i) => {
              const r = v.resultats[i];
              return (
                <i key={i} className={r ?? (i === v.manche ? 'courante' : '')} title={r === 'touche' ? 'Touché' : r === 'esquive' ? 'Esquivé' : r === 'riposte' ? 'Riposte encaissée' : 'À jouer'}>
                  {r === 'touche' ? '●' : r === 'esquive' ? '○' : r === 'riposte' ? '✕' : ''}
                </i>
              );
            })}
          </span>
        </div>
        <div className="texte-recit combat-journal">
          {v.journal.map((l, i) => (
            <p key={i}>{accorder(l, p)}</p>
          ))}
        </div>
        <p className="combat-aide">L’adversaire n’est pas tombé. Choisis ta prochaine attaque : chaque coup porté compte, chaque riposte encaissée te coûte.</p>
        <div className="attaques combat-attaques" role="group" aria-label="Attaques de la manche">
          <button className="attaque" onClick={() => onManche('simple')}>
            <span className="attaque-nom">Attaque simple</span>
            <span className="attaque-meta">sans chakra{precis ? ` · ${v.simple} %` : ''}</span>
          </button>
          {v.attaques.map((at) => (
            <button key={at.id} className={`attaque${at.enchainement ? ' enchainable' : ''}`} data-sceau="技" onClick={() => onManche(at.id)}>
              <span className="attaque-nom">
                {at.nom}
                {at.enchainement && <b className="badge-enchainement"> Enchaînement {at.enchainement}</b>}
              </span>
              <span className="attaque-meta">
                {at.chakra > 0 ? `${at.chakra} chakra` : 'sans chakra'}
                {at.avantage === 'fort' && <b className="risque-faible"> · avantage d’élément</b>}
                {at.avantage === 'faible' && <b className="risque-eleve"> · élément défavorable</b>}
                <span className={RISQUE_CLASSE[at.risque]}> · {precis ? `${at.chance} %` : `risque ${at.risque}`}</span>
              </span>
            </button>
          ))}
        </div>
        {v.objets.length > 0 && (
          <div className="attaques combat-objets" role="group" aria-label="Objets de ta sacoche">
            <span className="attaques-titre">Ta sacoche :</span>
            {v.objets.map((o) => (
              <button key={o.id} className="attaque objet" onClick={() => onManche(`objet:${o.id}`)}>
                <span className="attaque-nom">
                  {o.nom} <small>×{o.stock}</small>
                </span>
                <span className="attaque-meta">
                  {o.effet}
                  {precis ? ` · ${o.chance} %` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

// ── Bilan de séquence ──────────────────────────────────────────

const PORTRAIT: Record<AttributId, string> = {
  force: 'Ces années t’ont endurci·e : ton corps sait maintenant encaisser.',
  agilite: 'Tu es devenu·e rapide, d’une rapidité qui ne se voit qu’après coup.',
  perception: 'Tu as appris à voir ce que les autres ne remarquent pas.',
  discretion: 'Tu as appris à passer sans laisser de trace.',
  intellect: 'Tu as appris à penser avant de frapper.',
  charisme: 'On t’écoute davantage qu’avant. Parfois, on te suit.',
  controleChakra: 'Ton chakra t’obéit mieux, comme une respiration domptée.',
  controleEmotionnel: 'Tu as appris à garder ton calme quand tout brûle.',
};

function Bilan({ etat, theme, anime, onContinuer }: { etat: GameState; theme: 'nuit' | 'washi'; anime: boolean; onContinuer: () => void }) {
  const sc = etat.scene as { type: 'bilan'; sequence: string };
  const v = [...etat.sequences].reverse().find((x) => x.id === sc.sequence && x.fin);
  const def = R.contenu.sequences.find((x) => x.id === sc.sequence);
  const p = etat.creation.presentation;
  useRaccourcis(true, (k) => k === 'Enter' && onContinuer());
  if (!v?.fin || !def) return null;
  const { debut, fin } = v;
  const lieu = lieuCourant(etat, '$village');
  const moments = etat.journal.slice(debut.journal, fin.journal).filter((j) => j.importance >= 3).slice(-6);
  const gains = (Object.keys(fin.attributs) as AttributId[])
    .map((a) => ({ a, d: Math.round(fin.attributs[a] - debut.attributs[a]) }))
    .filter((x) => x.d !== 0)
    .sort((x, y) => y.d - x.d);
  const progres = Object.entries(fin.paliers)
    .filter(([id, t]) => t > (debut.paliers[id] ?? 0) && R.maitrises[id])
    .map(([id, t]) => ({ nom: R.maitrises[id].nom, avant: debut.paliers[id] ?? 0, apres: t }))
    .sort((a, b) => b.apres - a.apres)
    .slice(0, 6);
  const liens = Object.entries(etat.relations)
    .filter(([id, r]) => etat.pnj[id]?.rencontre && !r.rompue && r.amitie + r.confiance >= 60)
    .sort(([, a], [, b]) => b.amitie + b.confiance - (a.amitie + a.confiance))
    .slice(0, 3)
    .map(([id]) => defPnj(etat, id)?.nom)
    .filter(Boolean);
  const rivaux = Object.entries(etat.relations)
    .filter(([id, r]) => etat.pnj[id]?.rencontre && (r.rivalite >= 25 || r.hostilite >= 25))
    .slice(0, 2)
    .map(([id]) => defPnj(etat, id)?.nom)
    .filter(Boolean);
  const ryo = Math.round(fin.ryo - debut.ryo);
  const duree = libelleDuree(fin.jour - debut.jour);
  const portrait = gains[0] && gains[0].d >= 3 ? PORTRAIT[gains[0].a] : 'Peu de choses ont changé en apparence. Le reste se voit de l’intérieur.';

  return (
    <div className="recit">
      <header className="lieu-bandeau">
        <span className="sceau-texte" aria-hidden="true">
          {def.kanji}
        </span>
        <div>
          <strong>Fin de séquence</strong>
          <span>{def.titre}</span>
        </div>
      </header>
      <article className="recit-texte bilan">
        <p className="bilan-surtitre">Fin de séquence</p>
        <h1 className="titre-scene">{def.titre}</h1>
        <p className="sous-titre">
          {debut.age === fin.age ? `À ${fin.age} ans` : `De ${debut.age} à ${fin.age} ans`}, {duree}.
        </p>
        <p className="texte-recit bilan-portrait">{accorder(portrait, p)}</p>

        {moments.length > 0 && (
          <section className="bilan-bloc">
            <h2>Ce qui a compté</h2>
            <ul className="liste-simple">
              {moments.map((m, i) => (
                <li key={i}>{accorder(m.texte, p)}</li>
              ))}
            </ul>
          </section>
        )}

        {(gains.length > 0 || progres.length > 0) && (
          <section className="bilan-bloc">
            <h2>Ce que tu es devenu{p === 'feminin' ? 'e' : p === 'neutre' ? '·e' : ''}</h2>
            <ul className="bilan-gains">
              {gains.slice(0, 4).map((g) => (
                <li key={g.a} className={g.d > 0 ? 'hausse' : 'baisse'}>
                  {ATTRIBUT_LIBELLE[g.a]} <b>{g.d > 0 ? `+${g.d}` : g.d}</b>
                </li>
              ))}
              {fin.chakraMax !== debut.chakraMax && (
                <li className="hausse">
                  Chakra <b>+{Math.round(fin.chakraMax - debut.chakraMax)}</b>
                </li>
              )}
              {ryo !== 0 && (
                <li className={ryo > 0 ? 'hausse' : 'baisse'}>
                  Ryō <b>{ryo > 0 ? `+${ryo}` : ryo}</b>
                </li>
              )}
            </ul>
            {progres.length > 0 && (
              <ul className="liste-simple" style={{ marginTop: 10 }}>
                {progres.map((x) => (
                  <li key={x.nom}>
                    {x.nom} : palier {x.avant} → <b>{x.apres}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(liens.length > 0 || rivaux.length > 0 || fin.missionsReussies > debut.missionsReussies || fin.secrets > debut.secrets) && (
          <section className="bilan-bloc">
            <h2>Autour de toi</h2>
            <ul className="liste-simple">
              {liens.length > 0 && <li>Ceux qui comptent : {liens.join(', ')}.</li>}
              {rivaux.length > 0 && <li>Ceux qui te défient : {rivaux.join(', ')}.</li>}
              {fin.missionsReussies > debut.missionsReussies && <li>Missions réussies : {fin.missionsReussies - debut.missionsReussies}.</li>}
              {fin.secrets > debut.secrets && <li>Secrets découverts : {fin.secrets - debut.secrets}.</li>}
            </ul>
          </section>
        )}

        <div className="actions-bas">
          <button className="btn-principal" onClick={onContinuer} autoFocus>
            Continuer
          </button>
        </div>
      </article>
    </div>
  );
}

