'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameState, LieuDef, Presentation } from '../engine/types';
import { accorder } from '../engine/texte';
import { R } from '../engine/registre';
import { vueCombat, vueEvenement, lieuCourant } from '../engine/moteur';
import type { VueAttaque } from '../engine/moteur';
import { decorScene } from '../engine/decors';
import type { VueDecor } from '../engine/decors';
import { duoPossible, genererActivites, naturesActivite, periodeMax } from '../engine/tempsLibre';
import type { Activite } from '../engine/tempsLibre';
import { libelleDuree, libellePeriode, saisonDe } from '../engine/calendrier';
import Portrait from './Portrait';
import { cleScene, remonter } from './defilement';
import { ATTRIBUT_LIBELLE, ETAT_PNJ, KANJI_SAISON, vueChangements } from './libelles';
import { defPnj } from '../engine/etat';
import type { AttributId } from '../engine/types';

/** Le lieu et la saison sont déjà dans la barre du haut : la scène commence directement par son titre. */
export function ColonneScene({
  children,
  decor,
}: {
  lieu?: LieuDef;
  graine?: string;
  theme?: 'nuit' | 'washi';
  anime?: boolean;
  saison?: string;
  etat?: GameState;
  decor?: VueDecor;
  children?: React.ReactNode;
}) {
  const sansImage = children ? <div className="lieu-bandeau lieu-marques">{children}</div> : <div className="espace-scene" aria-hidden="true" />;
  return decor ? (
    <DecorBandeau decor={decor} repli={sansImage}>
      {children}
    </DecorBandeau>
  ) : (
    sansImage
  );
}

/**
 * Le décor illustré d'une scène. Les images sont essayées dans l'ordre (décor précis, puis décor du lieu) ;
 * tant qu'une image n'est pas chargée, elle reste invisible, et si aucune n'existe, la scène garde sa mise en page sans image.
 */
function DecorBandeau({ decor, repli, children }: { decor: VueDecor; repli: React.ReactNode; children?: React.ReactNode }) {
  const cle = decor.images.join('|');
  const [essai, setEssai] = useState(0);
  const [charge, setCharge] = useState(false);
  useEffect(() => {
    setEssai(0);
    setCharge(false);
  }, [cle]);
  if (essai >= decor.images.length) return <>{repli}</>;
  return (
    <>
      <figure className={`decor-scene${charge ? ' charge' : ''}`}>
        <img
          key={decor.images[essai]}
          src={decor.images[essai]}
          alt={decor.nom}
          decoding="async"
          onLoad={() => setCharge(true)}
          onError={() => {
            setCharge(false);
            setEssai((x) => x + 1);
          }}
        />
      </figure>
      {charge ? children && <div className="lieu-bandeau lieu-marques">{children}</div> : repli}
    </>
  );
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
  onOuvrirPoints,
  onManche,
}: {
  etat: GameState;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onChoisir: (id: string) => void;
  onContinuer: () => void;
  onActivite: (id: string) => void;
  onOuvrirPoints: () => void;
  onManche: (id: string) => void;
}) {
  const [scelle, setScelle] = useState<string | null>(null);
  const cle = cleScene(etat);
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
        <ColonneScene lieu={vue.lieu} graine={vue.lieu.id} theme={theme} anime={anime} saison={saison} etat={etat} decor={decorScene(etat, vue.id)}>
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
                    <span className="attaques-titre">
                      Ou avec une attaque spéciale <FormeCombat forme={ch.forme} allies={ch.allies} /> :
                    </span>
                    {ch.attaques.map((at) => (
                      <button
                        key={at.id}
                        className={`attaque ${scelle === at.id ? 'scelle' : ''}${at.natures.length ? ' a-nature' : ''}`}
                        style={at.natures.length ? ({ '--nat': `var(--n-${at.natures[0]}, var(--or))` } as React.CSSProperties) : undefined}
                        data-sceau="技"
                        disabled={scelle !== null && scelle !== at.id}
                        onClick={() => choisir(at.id)}
                      >
                        <span className="attaque-nom">
                          {at.natures.length > 0 && <BadgesNature natures={at.natures} />}
                          {at.nom}
                        </span>
                        <span className="attaque-meta">
                          {at.chakra > 0 ? `${at.chakra} chakra` : 'sans chakra'}
                          {at.avantage === 'fort' && <b className="risque-faible"> · avantage d’élément</b>}
                          {at.avantage === 'faible' && <b className="risque-eleve"> · élément défavorable</b>}
                          <span className={RISQUE_CLASSE[at.risque]}> · {precis ? `${at.chance} %` : `risque ${at.risque}`}</span>
                        </span>
                        <DetailAttaque at={at} precis={precis} p={p} />
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
        <ColonneScene lieu={lieu} graine={lieu.id} theme={theme} anime={anime} saison={saison} etat={etat} decor={decorScene(etat, ev ? sc.evenementId : undefined)} />
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
    return <TempsLibre etat={etat} theme={theme} anime={anime} onActivite={onActivite} onOuvrirPoints={onOuvrirPoints} />;
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

const CATEGORIES: { id: CategorieTL; nom: string; kanji: string; filtre: (a: Activite) => boolean }[] = [
  { id: 'missions', nom: 'Missions', kanji: '任', filtre: (a) => a.categorie === 'mission' },
  { id: 'route', nom: 'Route', kanji: '道', filtre: (a) => a.categorie === 'route' },
  { id: 'entrainement', nom: 'Disciplines', kanji: '練', filtre: (a) => a.categorie === 'entrainement' },
  { id: 'techniques', nom: 'Techniques', kanji: '術', filtre: (a) => a.categorie === 'technique' },
  { id: 'liens', nom: 'Liens', kanji: '絆', filtre: (a) => a.categorie === 'social' || a.categorie === 'famille' },
  { id: 'vie', nom: 'Vie', kanji: '生', filtre: (a) => ['repos', 'etude', 'travail', 'metier'].includes(a.categorie) },
  { id: 'forge', nom: 'Échoppe', kanji: '鍛', filtre: (a) => a.categorie === 'forge' || a.categorie === 'equipement' },
];
const KANJI_CATEGORIE = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.kanji])) as Record<CategorieTL, string>;

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
  kanji,
}: {
  a: Activite;
  p: Presentation;
  onActivite: (id: string) => void;
  choisie?: boolean;
  cocher?: boolean;
  kanji?: string;
}) {
  const prog = a.progression;
  const natures = naturesActivite(a);
  return (
    <li>
      <button
        data-kanji={natures.length ? KANJI_NATURE[natures[0]] ?? kanji : kanji}
        data-nature={natures[0]}
        style={natures.length ? ({ '--cat': `var(--n-${natures[0]}, var(--or))` } as React.CSSProperties) : undefined}
        className={`activite${choisie ? ' choisie' : ''}${!a.disponible ? ' bloquee' : ''}`}
        disabled={!a.disponible}
        aria-pressed={a.groupe && cocher ? choisie : undefined}
        onClick={() => onActivite(a.id)}
      >
        <span className="act-nom">
          {a.groupe && cocher && <span className="act-coche" aria-hidden="true">{choisie ? '✓' : ''}</span>}
          {natures.length > 0 && <BadgesNature natures={natures} />}
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
        <span className={`act-detail${!a.disponible ? ' rouge' : ''}`}>
          {!a.disponible && <span aria-hidden="true">🔒 </span>}
          {accorder((a.disponible ? a.description : a.raison) ?? '', p)}
        </span>
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
  onOuvrirPoints,
}: {
  etat: GameState;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onActivite: (id: string) => void;
  onOuvrirPoints: () => void;
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
  // Programme double seulement si une technique ET une discipline peuvent encore progresser ; sinon, un seul choix, lancé directement.
  const ameliorable = (g: 'sort' | 'discipline') => acts.some((a) => a.groupe === g && a.disponible && !a.alerte);
  const double = duoPossible(etat) && ameliorable('sort') && ameliorable('discipline');
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
  // Ce qu'on ne peut pas améliorer est masqué ; le choix d'afficher ou non est retenu pour la session.
  const [voirBloquees, setVoirBloquees] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage.getItem('ninja-destiny:voir-bloquees') === '1';
    } catch {
      return false;
    }
  });
  const basculerBloquees = (v: boolean) => {
    setVoirBloquees(v);
    try {
      window.sessionStorage.setItem('ninja-destiny:voir-bloquees', v ? '1' : '0');
    } catch {
      /* stockage indisponible : le choix vaut pour cet écran */
    }
  };

  const alertes: string[] = [];
  if (etat.jauges.fatigue >= 60) alertes.push('La fatigue s’accumule : t’entraîner encore expose à la blessure.');
  if (etat.blessures.some((b) => b.gravite >= 3)) alertes.push('Blessure grave : repos obligatoire, aucune mission.');
  else if (etat.blessures.length) alertes.push(`Blessure en cours : ${etat.blessures.map((b) => b.nom.toLowerCase()).join(', ')}.`);

  const liste = parCategorie[cat] ?? [];
  const achatsHorsPortee = cat === 'forge' ? liste.filter((a) => a.id.startsWith('forge:acheter:') && !a.disponible) : [];
  const sansAchats = liste.filter((a) => !achatsHorsPortee.includes(a));
  // Tout ce qui est en rouge descend en bas, quelle que soit la catégorie : ce qui est impossible pour l'instant,
  // et ce qui bute sur un mur (âge, maître, expérience) que l'entraînement seul ne franchira pas.
  const bloquees = sansAchats.filter((a) => !a.disponible || !!a.alerte);
  const principales = sansAchats.filter((a) => !bloquees.includes(a));

  return (
    <div className="recit">
      <ColonneScene lieu={lieu} graine={`${lieu.id}-libre`} theme={theme} anime={anime} saison={KANJI_SAISON[saisonDe(etat.jour)]} etat={etat} decor={decorScene(etat, undefined, '$village')} />
      <section className="recit-texte temps-libre" data-cat={cat}>
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
        {etat.pointsStat > 0 && (
          <button type="button" className="points-bandeau" onClick={onOuvrirPoints}>
            <strong>{etat.pointsStat}</strong> {etat.pointsStat > 1 ? 'points de stat à répartir' : 'point de stat à répartir'}
            <span>Répartir</span>
          </button>
        )}
        <div className="tl-categories" role="tablist" aria-label="Catégories d’activités">
          {visibles.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setChoisie(c.id)}>
              <span className="tl-kanji" aria-hidden="true">
                {c.kanji}
              </span>
              <span className="tl-nom">{c.nom}</span>
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
                    <LigneActivite key={a.id} a={a} p={p} kanji={KANJI_CATEGORIE[cat]} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <ul className="activites sous-groupe">
            {principales.map((a) => (
              <LigneActivite key={a.id} a={a} p={p} kanji={KANJI_CATEGORIE[cat]} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
            ))}
          </ul>
        )}
        {bloquees.length > 0 && (
          <button type="button" className="lien-bloquees" aria-expanded={voirBloquees} onClick={() => basculerBloquees(!voirBloquees)}>
            {voirBloquees ? 'Masquer' : 'Voir'} {bloquees.length === 1 ? 'l’activité bloquée' : `les ${bloquees.length} activités bloquées`}
          </button>
        )}
        {bloquees.length > 0 && voirBloquees && (
          <div className="sous-groupe bloquees">
            <h3>Bloqué ou impossible à améliorer pour l’instant</h3>
            <ul className="activites">
              {bloquees.map((a) => (
                <LigneActivite key={a.id} a={a} p={p} kanji={KANJI_CATEGORIE[cat]} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
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
                <LigneActivite key={a.id} a={a} p={p} kanji={KANJI_CATEGORIE[cat]} onActivite={clic} choisie={estChoisie(a)} cocher={double} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

// ── Combat en manches ──────────────────────────────────────────

const LIBELLE_PORTEE: Record<VueAttaque['portee'], string> = { cible: 'une cible', zone: 'zone', large: 'tout le terrain' };

/** Chaque nature a son kanji et sa couleur (définie dans styles.css : --n-katon, --n-suiton…). */
const KANJI_NATURE: Record<string, string> = {
  katon: '火',
  suiton: '水',
  fuuton: '風',
  raiton: '雷',
  doton: '土',
  yoton: '溶',
  futton: '沸',
  hyoton: '氷',
  ranton: '嵐',
  mokuton: '木',
  jiton: '磁',
  bakuton: '爆',
  shakuton: '灼',
};

function BadgesNature({ natures }: { natures: string[] }) {
  return (
    <span className="badges-nature" aria-hidden="true">
      {natures.map((n) => (
        <span key={n} className="badge-nature" style={{ '--nat': `var(--n-${n}, var(--or))` } as React.CSSProperties}>
          {KANJI_NATURE[n] ?? '術'}
        </span>
      ))}
    </span>
  );
}

/** Duel ou escouade, et qui se trouve dans la mêlée. */
function FormeCombat({ forme, allies }: { forme?: 'duel' | 'escouade'; allies?: boolean }) {
  if (!forme) return null;
  return (
    <span className="forme-combat">
      {forme === 'duel' ? '· en duel' : '· contre une escouade'}
      {allies && ', des alliés dans la mêlée'}
    </span>
  );
}

/** Ce que fait la technique sur ce terrain, sa portée, et le risque de toucher un des tiens. */
function DetailAttaque({ at, precis, p }: { at: VueAttaque; precis: boolean; p: Presentation }) {
  return (
    <>
      {at.recit && <span className="attaque-recit">{accorder(at.recit, p)}</span>}
      {at.kinjutsu && (
        <span className="attaque-kinjutsu">
          <b>Kinjutsu</b> · {at.kinjutsu}
          {at.usages !== undefined && ` · ${at.usages} usage${at.usages > 1 ? 's' : ''} restant${at.usages > 1 ? 's' : ''}`}
          {at.avertissement && ` · ${at.avertissement}`}
        </span>
      )}
      <span className="attaque-portee">
        {at.rang && `Rang ${at.rang} · `}Portée : {LIBELLE_PORTEE[at.portee]}
        {at.risqueAllie > 0 && <b className="risque-eleve"> · {precis ? `${at.risqueAllie} % de toucher un allié` : 'peut toucher un allié'}</b>}
      </span>
    </>
  );
}

function Combat({ etat, onManche }: { etat: GameState; onManche: (id: string) => void }) {
  const v = vueCombat(etat);
  const p = etat.creation.presentation;
  const precis = etat.creation.difficulte !== 'legende';
  if (!v) return null;
  return (
    <div className="recit">
      <ColonneScene decor={etat.scene.type === 'combat' ? decorScene(etat, etat.scene.evenementId) : undefined} />
      <article className="recit-texte combat">
        <h1 className="titre-scene">{accorder(v.titre, p)}</h1>
        {v.dojutsu
          .filter((d) => d.actif)
          .map((d) => (
            <p key={d.id} className="transformation-active">
              <b>{d.nom}</b> ({d.palier}) · attaque +{d.attaque}, défense +{d.defense} · coûte {d.cout} chakra par manche
            </p>
          ))}
        {v.transformation && (
          <p className="transformation-active">
            <b>{v.transformation.nom}</b> · attaque +{v.transformation.attaque}, défense +{v.transformation.defense}
            {v.transformation.entretien && ` · coûte ${v.transformation.entretien} par manche`}
            {v.transformation.restantes !== undefined && ` · encore ${v.transformation.restantes} manche${v.transformation.restantes > 1 ? 's' : ''}`}
            {v.transformation.speciales.length > 0 && ` · ouvre : ${v.transformation.speciales.join(', ')}`}
          </p>
        )}
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
        {v.adversaire ? (
          <div className="priorite-adverse" role="group" aria-label="L’adversaire attaque">
            <p className="priorite-titre">
              <b>Il prend l’initiative : {v.adversaire.nom}</b>
              {v.adversaire.element && <span className="forme-combat"> · {v.adversaire.element}</span>}
            </p>
            <p className="attaque-recit">{accorder(v.adversaire.recit, p)}</p>
            <div className="attaques combat-attaques">
              <button className="attaque" onClick={() => onManche('esquiver')}>
                <span className="attaque-nom">Esquiver</span>
                <span className="attaque-meta">
                  Sûr, mais tu ne touches pas. Réussie, elle ouvre sa garde{precis ? ` · ${v.adversaire.esquive} %` : ''}
                  {v.adversaire.permutation && <b className="risque-faible"> · ta permutation aide</b>}
                </span>
              </button>
              {v.adversaire.permutationChance !== undefined && (
                <button className="attaque transformation" data-sceau="替" onClick={() => onManche('permutation')}>
                  <span className="attaque-nom">Permutation</span>
                  <span className="attaque-meta">
                    Une bûche prend le coup ; réussie, tu surgis dans son dos (gros avantage){precis ? ` · ${v.adversaire.permutationChance} %` : ''}
                  </span>
                </button>
              )}
              <button className="attaque" data-sceau="返" onClick={() => onManche('contrer')}>
                <span className="attaque-nom">Contre-attaquer</span>
                <span className="attaque-meta">
                  Frapper dans son attaque : compte comme un coup porté, mais raté, il fait très mal{precis ? ` · ${v.adversaire.contre} %` : ''}
                  {v.adversaire.natureFavorable && <b className="risque-faible"> · ton {v.adversaire.natureFavorable} domine sa nature</b>}
                </span>
              </button>
              {v.adversaire.contres.length > 0 && <span className="attaques-titre">Ou contrer avec une technique :</span>}
              {v.adversaire.contres.map((c) => (
                <button
                  key={c.id}
                  className={`attaque${c.natures.length ? ' a-nature' : ''}`}
                  style={c.natures.length ? ({ '--nat': `var(--n-${c.natures[0]}, var(--or))` } as React.CSSProperties) : undefined}
                  data-sceau="返"
                  onClick={() => onManche(`contrer:${c.id}`)}
                >
                  <span className="attaque-nom">
                    {c.natures.length > 0 && <BadgesNature natures={c.natures} />}
                    {c.nom}
                  </span>
                  <span className="attaque-meta">
                    {c.chakra > 0 ? `${c.chakra} chakra` : 'sans chakra'}
                    {c.avantage === 'fort' && <b className="risque-faible"> · ta nature domine la sienne</b>}
                    {c.avantage === 'faible' && <b className="risque-eleve"> · sa nature domine la tienne</b>}
                    {precis ? ` · ${c.chance} %` : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
        <p className="combat-aide">
          {v.ouverture ? 'Ton esquive a ouvert sa garde : ta prochaine attaque en profite. ' : 'L’adversaire n’est pas tombé. '}
          Choisis ta prochaine attaque : chaque coup porté compte, chaque riposte encaissée te coûte. <FormeCombat forme={v.forme} allies={v.allies} />
          {v.permutation > 0 && <span className="forme-combat"> · ta permutation peut détourner un coup mortel{precis ? ` (${v.permutation} %)` : ''}</span>}
        </p>
        <div className="attaques combat-attaques" role="group" aria-label="Attaques de la manche">
          <button className="attaque" onClick={() => onManche('simple')}>
            <span className="attaque-nom">Attaque simple</span>
            <span className="attaque-meta">sans chakra{precis ? ` · ${v.simple} %` : ''}</span>
          </button>
          {v.attaques.map((at) => (
            <button
              key={at.id}
              className={`attaque${at.enchainement ? ' enchainable' : ''}${at.natures.length ? ' a-nature' : ''}`}
              style={at.natures.length ? ({ '--nat': `var(--n-${at.natures[0]}, var(--or))` } as React.CSSProperties) : undefined}
              data-sceau="技"
              onClick={() => onManche(at.id)}
            >
              <span className="attaque-nom">
                {at.natures.length > 0 && <BadgesNature natures={at.natures} />}
                {at.nom}
                {at.enchainement && <b className="badge-enchainement"> Enchaînement {at.enchainement}</b>}
              </span>
              <span className="attaque-meta">
                {at.chakra > 0 ? `${at.chakra} chakra` : 'sans chakra'}
                {at.avantage === 'fort' && <b className="risque-faible"> · avantage d’élément</b>}
                {at.avantage === 'faible' && <b className="risque-eleve"> · élément défavorable</b>}
                <span className={RISQUE_CLASSE[at.risque]}> · {precis ? `${at.chance} %` : `risque ${at.risque}`}</span>
              </span>
              <DetailAttaque at={at} precis={precis} p={p} />
            </button>
          ))}
        </div>
        {v.dojutsu.some((d) => !d.actif) && (
          <div className="attaques combat-transformations" role="group" aria-label="Dōjutsu">
            <span className="attaques-titre">Activer tes yeux (ne coûte pas la manche) :</span>
            {v.dojutsu.map((d) => (
              <button key={d.id} className="attaque transformation" data-sceau="眼" onClick={() => onManche(`dojutsu:${d.id}`)}>
                <span className="attaque-nom">
                  {d.nom} <small>· {d.palier}</small>
                </span>
                <span className="attaque-meta">
                  {d.cout} chakra par manche · attaque +{d.attaque}, défense +{d.defense}
                </span>
              </button>
            ))}
          </div>
        )}
        {v.transformations.length > 0 && (
          <div className="attaques combat-transformations" role="group" aria-label="Transformations">
            <span className="attaques-titre">Te transformer (ne coûte pas la manche) :</span>
            {v.transformations.map((tr) => (
              <button key={tr.id} className="attaque transformation" data-sceau="変" onClick={() => onManche(`transfo:${tr.id}`)}>
                <span className="attaque-nom">{tr.nom}</span>
                <span className="attaque-meta">
                  {tr.chakra > 0 ? `${tr.chakra} chakra` : 'sans chakra'}
                  {tr.sante > 0 && ` · ${tr.sante} de santé`} · attaque +{tr.attaque}, défense +{tr.defense}
                  {tr.entretien && ` · puis ${tr.entretien} par manche`}
                  {tr.restantes !== undefined && ` · ${tr.restantes} manche${tr.restantes > 1 ? 's' : ''} au plus`}
                </span>
                <span className="attaque-recit">{tr.effet}</span>
                {tr.speciales.length > 0 && <span className="attaque-portee">Ouvre : {tr.speciales.join(', ')}</span>}
                {tr.kinjutsu && (
                  <span className="attaque-kinjutsu">
                    <b>Kinjutsu</b> · {tr.kinjutsu}
                    {tr.avertissement && ` · ${tr.avertissement}`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
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
          </>
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

