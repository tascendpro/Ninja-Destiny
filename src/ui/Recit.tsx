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
import { age, libelleDuree, libellePeriode, moisDe, saisonDe } from '../engine/calendrier';
import Portrait from './Portrait';
import Affrontement, { CarteBilan } from './combat/Affrontement';
import GroupesNature from './combat/GroupesNature';
import { classeMulti, styleNatures } from './natures';
import type { ActionCombat } from '../engine/combat/types';
import { cleScene, remonter } from './defilement';
import { ATTRIBUT_LIBELLE, ETAT_PNJ, KANJI_SAISON, vueChangements } from './libelles';
import { defPnj, nomComplet } from '../engine/etat';
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

function Paragraphes({ texte, presentation, lettrine = false }: { texte: string; presentation: Presentation; lettrine?: boolean }) {
  return (
    <div className={`texte-recit${lettrine ? ' lettrine' : ''}`}>
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
/** Le sceau tamponné sur le résultat. */
const SCEAU_ISSUE: Record<string, string> = { critique: '極', succes: '成', partiel: '半', echec: '敗' };
/** Le kanji du talisman : le combat, ou ce que l'épreuve met en jeu ; un choix libre est une décision. */
const KANJI_ATTRIBUT: Record<AttributId, string> = {
  force: '力', agilite: '速', perception: '観', discretion: '隠', intellect: '策', charisme: '話', controleChakra: '気', controleEmotionnel: '心',
};
function kanjiChoix(nature: string | undefined, principal: AttributId | undefined): string {
  if (nature === 'combat') return '戦';
  if (nature === 'epreuve') return principal ? KANJI_ATTRIBUT[principal] : '試';
  return '決';
}

/** Les chances, en cinq points d'encre. */
function PointsEncre({ chance }: { chance: number }) {
  const pleins = Math.max(0, Math.min(5, Math.round(chance / 20)));
  return (
    <span className="points-encre" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < pleins ? 'plein' : ''} />
      ))}
    </span>
  );
}

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
  onCombat,
}: {
  etat: GameState;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onChoisir: (id: string) => void;
  onContinuer: () => void;
  onActivite: (id: string) => void;
  onOuvrirPoints: () => void;
  onManche: (id: string) => void;
  onCombat: (a: ActionCombat) => void;
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
          <Paragraphes texte={vue.texte} presentation={p} lettrine />
          <ol className="choix-liste" aria-label="Choix">
            {vue.choix.map((ch, i) => (
              <li key={ch.id}>
                <button
                  className={`choix fuda fuda-${ch.nature ?? 'libre'}${ch.mortel ? ' fuda-mortel' : ''}${scelle === ch.id ? ' scelle' : ''}`}
                  data-sceau="決"
                  disabled={!ch.disponible || (scelle !== null && scelle !== ch.id)}
                  onClick={() => choisir(ch.id)}
                >
                  <span className="fuda-kanji" aria-hidden="true">
                    {ch.disponible ? kanjiChoix(ch.nature, ch.principal) : '封'}
                  </span>
                  {ch.mortel && ch.disponible && (
                    <span className="fuda-mort" title="On peut y mourir">
                      死
                    </span>
                  )}
                  <span className="choix-texte">{accorder(ch.texte, p)}</span>
                  {i < 9 && (
                    <kbd className="touche" aria-hidden="true">
                      {i + 1}
                    </kbd>
                  )}
                  {(ch.verrou || ch.indice || ch.risque || ch.duree || ch.manches || ch.affrontement) && (
                    <span className="choix-meta">
                      {ch.affrontement && <span>Affrontement · {ch.affrontement.contexte}</span>}
                      {ch.verrou && <span>{accorder(ch.verrou, p)}</span>}
                      {ch.risque && (
                        <span className={RISQUE_CLASSE[ch.risque]}>
                          {ch.chance !== undefined && <PointsEncre chance={ch.chance} />}
                          {precis && ch.chance !== undefined && ch.nature !== 'combat' ? `${ch.chance} % de réussite` : `Risque ${ch.risque}`}
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
                    <GroupesNature
                      items={ch.attaques}
                      techId={(at) => at.technique}
                      titre="Attaques spéciales par nature"
                      rendu={(at) => (
                        <button
                          key={at.id}
                          className={`attaque ${scelle === at.id ? 'scelle' : ''}${at.natures.length ? ' a-nature' : ''}${classeMulti(at.natures)}`}
                          style={styleNatures(at.natures)}
                          data-sceau="技"
                          disabled={scelle !== null && scelle !== at.id}
                          onClick={() => choisir(at.id)}
                        >
                          <span className="attaque-nom">{at.nom}</span>
                          <MetaAttaque at={at} />
                        </button>
                      )}
                    />
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
          {sc.issue && (
            <div className="issue-ligne">
              <span className={`sceau-issue sceau-${sc.issue}`} aria-hidden="true">
                {SCEAU_ISSUE[sc.issue]}
              </span>
              <span className={`issue issue-${sc.issue}`}>{ISSUE[sc.issue]}</span>
            </div>
          )}
          <div aria-live="polite">
            <Paragraphes texte={sc.texte} presentation={p} />
          </div>
          {sc.bilanCombat && <CarteBilan bilan={sc.bilanCombat} presentation={p} />}
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

  if (etat.scene.type === 'affrontement') {
    return <Affrontement etat={etat} onCombat={onCombat} />;
  }

  if (etat.scene.type === 'combat') {
    return <Combat etat={etat} theme={theme} anime={anime} onManche={onManche} />;
  }

  if (etat.scene.type === 'bilan') {
    return <Bilan etat={etat} theme={theme} anime={anime} onContinuer={onContinuer} />;
  }

  return null;
}

// ── Temps libre ────────────────────────────────────────────────

type CategorieTL = 'missions' | 'route' | 'entrainement' | 'techniques' | 'liens' | 'vie';

const CATEGORIES: { id: CategorieTL; nom: string; kanji: string; filtre: (a: Activite) => boolean }[] = [
  { id: 'missions', nom: 'Missions', kanji: '任', filtre: (a) => a.categorie === 'mission' },
  { id: 'route', nom: 'Route', kanji: '道', filtre: (a) => a.categorie === 'route' },
  { id: 'entrainement', nom: 'Disciplines', kanji: '練', filtre: (a) => a.categorie === 'entrainement' },
  { id: 'techniques', nom: 'Techniques', kanji: '術', filtre: (a) => a.categorie === 'technique' },
  { id: 'liens', nom: 'Liens', kanji: '絆', filtre: (a) => a.categorie === 'social' || a.categorie === 'famille' },
  { id: 'vie', nom: 'Vie', kanji: '生', filtre: (a) => ['repos', 'etude', 'travail', 'metier'].includes(a.categorie) },
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
        style={styleNatures(natures, '--cat')}
        className={`activite${choisie ? ' choisie' : ''}${!a.disponible ? ' bloquee' : ''}${classeMulti(natures)}`}
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
          {!a.disponible && (
            <span className="sceau-bloque" aria-hidden="true">
              封
            </span>
          )}
          {accorder((a.disponible ? a.description : a.raison) ?? '', p)}
        </span>
        {a.disponible && a.gain && <span className="act-gain">{a.gain}</span>}
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

  const alertes: string[] = [];
  if (etat.jauges.fatigue >= 60) alertes.push('La fatigue s’accumule : t’entraîner encore expose à la blessure.');
  if (etat.blessures.some((b) => b.gravite >= 3)) alertes.push('Blessure grave : repos obligatoire, aucune mission.');
  else if (etat.blessures.length) alertes.push(`Blessure en cours : ${etat.blessures.map((b) => b.nom.toLowerCase()).join(', ')}.`);

  const liste = parCategorie[cat] ?? [];
  // Achats et réparations sont dans l'onglet Magasin ; l'arme principale se choisit dans Ninja › Arsenal.
  // Ce qui est impossible pour l'instant, ou bute sur un mur (âge, maître, expérience, œil) que l'entraînement
  // seul ne franchira pas, n'est pas proposé : l'onglet Techniques de la fiche Ninja dit où en est chaque maîtrise.
  const bloquees = liste.filter((a) => !a.disponible || !!a.alerte);
  const principales = liste.filter((a) => !bloquees.includes(a));

  return (
    <div className="recit">
      <ColonneScene lieu={lieu} graine={`${lieu.id}-libre`} theme={theme} anime={anime} saison={KANJI_SAISON[saisonDe(etat.jour)]} etat={etat} decor={decorScene(etat, undefined, '$village')} />
      <section className="recit-texte temps-libre" data-cat={cat}>
        <div className="tl-grille">
          <aside className="tl-cote">
            <h1 className="titre-scene tl-titre">
              <span className="tl-titre-kanji" aria-hidden="true">
                修
              </span>
              Temps libre
            </h1>
            <FriseAnnee etat={etat} />
            <CarteHumeur etat={etat} />
            <BilanDernierePeriode etat={etat} />
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
              <button type="button" className="points-bandeau tl-points" onClick={onOuvrirPoints}>
                <strong>{etat.pointsStat}</strong> {etat.pointsStat > 1 ? 'points de stat à répartir' : 'point de stat à répartir'}
                <span>Répartir</span>
              </button>
            )}
          </aside>
          <div className="tl-principal">
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
            {double && (cat === 'techniques' || cat === 'entrainement') && !valides.sort && !valides.discipline && (
              <p className="programme-aide">Coche une discipline et une technique : les deux progressent pendant la même période.</p>
            )}
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
            {principales.length === 0 && <p className="tl-vide">Rien à faire ici pour l’instant.</p>}
            {double && (valides.sort || valides.discipline) && (
              <div className="programme actif" role="region" aria-label="Programme d’entraînement">
                <span className="programme-choix">
                  {[valides.discipline, valides.sort].filter(Boolean).map((a) => (
                    <b key={a!.id}>{accorder(a!.libelle.replace(/^Apprendre /, ''), p)}</b>
                  ))}
                  {!(valides.sort && valides.discipline) && <small>{valides.sort ? '+ une discipline ?' : '+ une technique ?'}</small>}
                </span>
                <button className="btn-principal" onClick={lancer}>
                  Commencer
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Temps libre : frise, humeur, bilan ─────────────────────────

const KANJI_SAISONS = ['春', '夏', '秋', '冬'];
const NOMS_MOIS = ['Mois du réveil', 'Mois des pruniers', 'Mois des cerisiers', 'Mois des pluies', 'Mois des cigales', 'Mois brûlant', 'Mois des lanternes', 'Mois des récoltes', 'Mois des érables', 'Mois du givre', 'Mois des neiges', 'Mois du silence'];

/** La frise de l'année : les quatre saisons, le mois en cours, et un point là où un moment d'histoire approche. */
function FriseAnnee({ etat }: { etat: GameState }) {
  const mois = moisDe(etat.jour);
  const debutAnnee = etat.jour - (((etat.jour % 360) + 360) % 360);
  const marques = new Set(
    etat.planifies.filter((pl) => pl.jour > etat.jour && pl.jour <= debutAnnee + 360).map((pl) => moisDe(pl.jour)),
  );
  const proche = etat.planifies.some((pl) => pl.jour > etat.jour && pl.jour - etat.jour <= 90);
  return (
    <div className="frise" aria-label={`${NOMS_MOIS[mois]}, ${age(etat)} ans`}>
      <div className="frise-ligne">
        {Array.from({ length: 12 }, (_, m) => (
          <span key={m} className={`frise-mois${m < mois ? ' passe' : m === mois ? ' present' : ''}${marques.has(m) ? ' marque' : ''}`}>
            {m % 3 === 0 && <b aria-hidden="true">{KANJI_SAISONS[m / 3]}</b>}
          </span>
        ))}
      </div>
      <p className="frise-legende">
        <span>{NOMS_MOIS[mois]}</span>
        <span>{age(etat)} ans</span>
        {proche && <span className="frise-approche">● un événement approche</span>}
      </p>
    </div>
  );
}

/** Un nombre stable tiré du jour : l'ambiance change d'une période à l'autre sans toucher au hasard de la partie. */
const graineJour = (jour: number, sel: number) => Math.abs(Math.imul(jour + sel, 2654435761) | 0);

const AMBIANCES: Record<string, string[]> = {
  printemps: ['Les cerisiers perdent leurs pétales sur les toits.', 'La boue du dégel colle aux sandales.', 'Les hirondelles sont revenues sous l’auvent.'],
  ete: ['L’air sent la poussière chaude et le cèdre.', 'Les cigales couvrent le bruit des kunai.', 'Même l’ombre est tiède.'],
  automne: ['Les érables rougissent au-dessus du terrain.', 'Le vent apporte l’odeur des feux de feuilles.', 'Les soirées raccourcissent ; on rentre plus tôt.'],
  hiver: ['Le givre craque sous les pas.', 'La neige étouffe tous les bruits du village.', 'On s’entraîne en soufflant sur ses doigts.'],
};

/** La carte d'humeur : saison, phrase d'ambiance, et le personnage du moment. */
function CarteHumeur({ etat }: { etat: GameState }) {
  const saison = saisonDe(etat.jour);
  const phrases = AMBIANCES[saison] ?? AMBIANCES.ete;
  const phrase = phrases[graineJour(etat.jour, 7) % phrases.length];
  const proches = ['coequipierA', 'sensei', 'rival', 'coequipierB']
    .map((r) => etat.roles[r])
    .filter((id): id is string => !!id && (etat.pnj[id]?.etat === 'vivant' || etat.pnj[id]?.etat === 'blesse'));
  const qui = proches.length ? defPnj(etat, proches[graineJour(etat.jour, 13) % proches.length]) : undefined;
  const scenes = ['t’attend au terrain d’entraînement.', 'cherche quelqu’un pour s’entraîner.', 'est rentré de mission, fatigué, et a demandé de tes nouvelles.', 'mange seul au comptoir de ramen.'];
  const scene = scenes[graineJour(etat.jour, 29) % scenes.length];
  return (
    <div className="carte-humeur">
      <p className="humeur-phrase">{phrase}</p>
      {qui && (
        <p className="humeur-pnj">
          <b>{qui.nom}</b> {scene}
        </p>
      )}
      <p className="humeur-duree">Une seule décision : le temps passera jusqu’au prochain moment important, {periodeMax(etat) >= 360 ? 'un an' : 'six mois'} au plus.</p>
    </div>
  );
}

/** Ce que la dernière période a rapporté : paliers franchis, aptitudes gagnées. */
function BilanDernierePeriode({ etat }: { etat: GameState }) {
  const b = etat.bilanPeriode;
  if (!b || etat.jour - b.jour > 400) return null;
  // Plusieurs paliers franchis d'un coup : on ne garde que le plus haut atteint.
  const paliers = new Map<string, number>();
  for (const x of b.paliers) paliers.set(x.maitrise, Math.max(paliers.get(x.maitrise) ?? 0, x.palier));
  const lignes = [
    ...[...paliers].map(([m, pal]) => `${R.maitrises[m]?.nom ?? m} palier ${pal}`),
    ...b.stats.map((x) => `${ATTRIBUT_LIBELLE[x.chemin.slice(10) as AttributId] ?? x.chemin} +${Math.round(x.delta)}`),
  ];
  if (!lignes.length) return null;
  return (
    <p className="bilan-periode">
      <span className="bilan-titre">La dernière période</span>
      {lignes.join(' · ')}
    </p>
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

/** Sous une technique : seulement son coût, l'avantage de nature et un avertissement s'il y a un prix à payer. Ni récit ni chance. */
function MetaAttaque({ at }: { at: { chakra: number; avantage?: 'fort' | 'faible'; kinjutsu?: string; usages?: number; portee?: VueAttaque['portee'] } }) {
  return (
    <span className="attaque-meta">
      {at.chakra > 0 ? `${at.chakra} chakra` : 'sans chakra'}
      {at.portee && ` · ${LIBELLE_PORTEE[at.portee]}`}
      {at.avantage === 'fort' && <b className="risque-faible"> · avantage de nature</b>}
      {at.avantage === 'faible' && <b className="risque-eleve"> · nature défavorable</b>}
      {at.kinjutsu && <b className="risque-eleve"> · kinjutsu{at.usages !== undefined ? ` (${at.usages} usage${at.usages > 1 ? 's' : ''})` : ''}</b>}
    </span>
  );
}

function Combat({ etat, theme, anime, onManche }: { etat: GameState; theme: 'nuit' | 'washi'; anime: boolean; onManche: (id: string) => void }) {
  const v = vueCombat(etat);
  const p = etat.creation.presentation;
  const precis = etat.creation.difficulte !== 'legende';
  if (!v) return null;
  return (
    <div className="recit">
      <ColonneScene
        decor={etat.scene.type === 'combat' ? decorScene(etat, etat.scene.evenementId) : undefined}
        lieu={etat.scene.type === 'combat' && R.evenements[etat.scene.evenementId] ? lieuCourant(etat, R.evenements[etat.scene.evenementId].lieu) : undefined}
        etat={etat}
        theme={theme}
        anime={anime}
      />
      <article className="recit-texte combat">
        <h1 className="titre-scene">{accorder(v.titre, p)}</h1>
        <div className="duel" aria-label="Face-à-face">
          <div className="duel-camp duel-toi">
            <Portrait nom={nomComplet(etat)} genre={p === 'feminin' ? 'f' : p === 'masculin' ? 'm' : undefined} village={etat.creation.village} clan={etat.creation.clan} taille={46} />
            <span className="duel-nom">
              <b>{etat.creation.prenom}</b>
              <span className="duel-jauge">
                <i className="duel-sante" style={{ width: `${Math.max(0, Math.min(100, etat.jauges.sante))}%` }} />
              </span>
              <span className="duel-jauge">
                <i className="duel-chakra" style={{ width: `${Math.max(0, Math.min(100, (etat.jauges.chakra / Math.max(1, etat.jauges.chakraMax)) * 100))}%` }} />
              </span>
            </span>
          </div>
          <span className="duel-vs" aria-hidden="true">
            対
          </span>
          <div className="duel-camp duel-eux">
            <span className="duel-nom">
              <b>{v.forme === 'escouade' ? 'Ennemis' : 'Adversaire'}</b>
              <span className="duel-jauge">
                <i className="duel-ennemi-vie" style={{ width: `${Math.round(((v.total - v.touches) / Math.max(1, v.total)) * 100)}%` }} />
              </span>
              <small>
                {v.touches} coup{v.touches > 1 ? 's' : ''} porté{v.touches > 1 ? 's' : ''}
              </small>
            </span>
            <span className="duel-ennemi" aria-hidden="true">
              敵
            </span>
          </div>
        </div>
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
                  Sûr, mais tu ne touches pas. Réussie, elle ouvre sa garde
                  {v.adversaire.permutation && <b className="risque-faible"> · ta permutation aide</b>}
                </span>
              </button>
              {v.adversaire.permutationChance !== undefined && (
                <button className="attaque transformation" data-sceau="替" onClick={() => onManche('permutation')}>
                  <span className="attaque-nom">Permutation</span>
                  <span className="attaque-meta">
                    Une bûche prend le coup ; réussie, tu surgis dans son dos (gros avantage)
                  </span>
                </button>
              )}
              <button className="attaque" data-sceau="返" onClick={() => onManche('contrer')}>
                <span className="attaque-nom">Contre-attaquer</span>
                <span className="attaque-meta">
                  Frapper dans son attaque : compte comme un coup porté, mais raté, il fait très mal
                  {v.adversaire.natureFavorable && <b className="risque-faible"> · ton {v.adversaire.natureFavorable} domine sa nature</b>}
                </span>
              </button>
              {v.adversaire.contres.length > 0 && <span className="attaques-titre">Ou contrer avec une technique :</span>}
              <GroupesNature
                items={v.adversaire.contres}
                techId={(c) => c.id}
                titre="Contrer, par nature"
                rendu={(c) => (
                  <button
                    key={c.id}
                    className={`attaque${c.natures.length ? ' a-nature' : ''}${classeMulti(c.natures)}`}
                    style={styleNatures(c.natures)}
                    data-sceau="返"
                    onClick={() => onManche(`contrer:${c.id}`)}
                  >
                    <span className="attaque-nom">{c.nom}</span>
                    <MetaAttaque at={c} />
                  </button>
                )}
              />
            </div>
          </div>
        ) : (
          <>
        <p className="combat-aide">
          {v.ouverture ? 'Ton esquive a ouvert sa garde : ta prochaine attaque en profite. ' : 'L’adversaire n’est pas tombé. '}
          Choisis ta prochaine attaque : chaque coup porté compte, chaque riposte encaissée te coûte. <FormeCombat forme={v.forme} allies={v.allies} />
          {v.permutation > 0 && <span className="forme-combat"> · ta permutation peut détourner un coup mortel</span>}
        </p>
        <div className="attaques combat-attaques" role="group" aria-label="Attaques de la manche">
          <button className="attaque" onClick={() => onManche('simple')}>
            <span className="attaque-nom">Attaque simple</span>
            <span className="attaque-meta">sans chakra</span>
          </button>
        </div>
        <GroupesNature
          items={v.attaques}
          techId={(at) => at.id}
          titre="Techniques de la manche, par nature"
          rendu={(at) => (
            <button
              key={at.id}
              className={`attaque${at.enchainement ? ' enchainable' : ''}${at.natures.length ? ' a-nature' : ''}${classeMulti(at.natures)}`}
              style={styleNatures(at.natures)}
              data-sceau="技"
              onClick={() => onManche(at.id)}
            >
              <span className="attaque-nom">
                {at.nom}
                {at.enchainement && <b className="badge-enchainement"> Enchaînement {at.enchainement}</b>}
              </span>
              <MetaAttaque at={at} />
            </button>
          )}
        />
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

