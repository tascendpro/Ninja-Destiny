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
import { KANJI_GROUPE, groupeTechnique, libelleGroupe } from './GroupesNature';
import { R } from '../../engine/registre';
import { avecParoles } from '../paroles';
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

/**
 * Quatre grands choix, comme dans un jeu de combat : on n'a jamais plus de quatre actions sous les yeux.
 * Chaque menu regroupe des familles du moteur ; les actions les plus parlantes (enchaînement, synergie, technique
 * inédite) passent devant, et « Autres » fait défiler le reste.
 */
const MENUS: { id: string; nom: string; kanji: string; familles: Famille[]; aide: string }[] = [
  { id: 'attaque', nom: 'Attaquer', kanji: '撃', familles: ['taijutsu', 'arme'], aide: 'Corps à corps, armes' },
  { id: 'jutsu', nom: 'Jutsu', kanji: '術', familles: ['ninjutsu', 'pouvoir'], aide: 'Techniques, pouvoirs' },
  { id: 'defense', nom: 'Défense', kanji: '守', familles: ['defense', 'objet'], aide: 'Parer, esquiver, objets' },
  { id: 'tactique', nom: 'Tactique', kanji: '策', familles: ['observation', 'parole', 'situation', 'fuite'], aide: 'Observer, parler, fuir' },
];
const PAR_PAGE = 4;

/**
 * Sous « Jutsu », on choisit d'abord une nature (Katon, Raiton…), puis la technique : on pense « du feu », puis « laquelle ».
 * Les pouvoirs (transformations, yeux du clan) forment leur propre groupe.
 */
const groupeJutsu = (f: Famille, id: string) => (f === 'pouvoir' ? 'pouvoir' : groupeTechnique(id));
const ORDRE_GROUPES = Object.keys(KANJI_GROUPE);
const rangGroupe = (g: string) => (g === 'pouvoir' ? 900 : ORDRE_GROUPES.includes(g) ? ORDRE_GROUPES.indexOf(g) : 800);
const nomGroupe = (g: string) => (g === 'pouvoir' ? 'Pouvoirs' : libelleGroupe(g));
/** « Katon (Feu) » se lit « Katon », avec « Feu » dessous. */
const sensGroupe = (g: string) => {
  const m = /\(([^)]+)\)/.exec(nomGroupe(g));
  return m ? `${m[1]} · ` : '';
};
const kanjiGroupe = (g: string) => (g === 'pouvoir' ? '力' : (KANJI_GROUPE[g] ?? '術'));

/** La feinte vit dans la famille taijutsu du moteur (c'est un geste du corps), mais c'est une ruse : elle se range sous « Tactique ». */
const RANGEE: Record<string, string> = { feinte: 'tactique' };
const dansMenu = (menuId: string, m: { familles: Famille[] }, f: Famille, actionId: string) => (RANGEE[actionId] ? RANGEE[actionId] === menuId : m.familles.includes(f));

export default function Affrontement({ etat, onCombat }: { etat: GameState; onCombat: (a: ActionCombat) => void }) {
  const v = vueAffrontement(etat);
  // La dernière manche déjà jouée quand l'écran s'ouvre : on n'anime que les suivantes.
  const premiereManche = useRef<number | null>(null);
  const p = etat.creation.presentation;
  const [famille, setFamille] = useState<Famille | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  // Sous « Jutsu » : la nature ouverte (null : on choisit d'abord la nature).
  const [nature, setNature] = useState<string | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [elan, setElan] = useState<DepenseElan | undefined>(undefined);
  // Contre une escouade : qui viser. Par défaut, le premier qui barre le chemin.
  const [cible, setCible] = useState<string | undefined>(undefined);
  const haut = useRef<HTMLDivElement>(null);
  const nbEntrees = v?.journal.length ?? 0;

  // Une nouvelle manche : on oublie l'action choisie (la famille reste ouverte) et on remonte à la résolution.
  useEffect(() => {
    setChoix(null);
    setElan(undefined);
    // Chaque manche repart des quatre grands choix.
    setMenu(null);
    setNature(null);
    setFamille(null);
    if (nbEntrees > 1) haut.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [nbEntrees]);

  const membres = v?.adversaire.membres;
  const cibleValide = membres?.find((m) => m.id === cible && !m.horsCombat)?.id ?? membres?.find((m) => !m.horsCombat)?.id;
  const confirmer = (id = choix) => {
    if (!famille || !id) return;
    const viser = membres && (famille === 'taijutsu' || famille === 'ninjutsu' || famille === 'arme') ? cibleValide : undefined;
    onCombat({ famille, choix: id, ...(elan && id !== 'feinte' ? { elan } : {}), ...(viser ? { cible: viser } : {}) });
  };

  // Raccourcis PC (§22.5) : 1-9 ouvrent une famille, Échap ferme, Entrée lance. Inactifs dans un champ de saisie.
  useEffect(() => {
    if (!v) return;
    const ecoute = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const cible = e.target as HTMLElement | null;
      if (cible && ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) return;
      if (/^[1-4]$/.test(e.key) && !menu) {
        setMenu(MENUS[Number(e.key) - 1].id);
        setPage(0);
        setNature(null);
        setChoix(null);
      } else if (e.key === 'Escape') {
        // Un cran en arrière : la technique, puis la nature, puis le menu.
        setChoix(null);
        setFamille(null);
        setPage(0);
        if (menu === 'jutsu' && nature) setNature(null);
        else setMenu(null);
      } else if (e.key === 'Enter' && choix) confirmer();
    };
    window.addEventListener('keydown', ecoute);
    return () => window.removeEventListener('keydown', ecoute);
  });

  if (!v) return null;
  const fam = v.familles.find((f) => f.id === famille);
  const act = fam?.actions.find((a) => a.id === choix);
  const offensive = (famille === 'taijutsu' || famille === 'ninjutsu' || famille === 'arme') && choix !== 'feinte';
  const pctJ = Math.round((v.joueur.endurance / v.joueur.enduranceMax) * 100);
  const pctC = Math.min(100, Math.round((v.joueur.chakra / Math.max(1, v.joueur.chakraMax)) * 100));
  const manches = v.journal.filter((j) => j.manche > 0);
  const derniere = manches[manches.length - 1];
  const anciennes = manches.slice(0, -1);
  // La réplique d'entrée : avant la première manche, puis dans le journal.
  const entree = v.journal.find((j) => j.manche === 0)?.repliques[0];
  const gA = GARDE[v.adversaire.garde];
  const gJ = GARDE[v.joueur.garde];
  const mancheVue = premiereManche.current ?? (premiereManche.current = derniere?.manche ?? 0);
  const transition = derniere && derniere.manche > mancheVue ? derniere : undefined;

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
        {a.disponible && a.detail && <span className="aff-action-detail">{accorder(a.detail, p)}</span>}
        {(a.marques.length > 0 || a.chakra !== undefined || a.chance !== undefined) && (
          <span className="aff-action-meta">
            {a.chance !== undefined && a.disponible && <span className="aff-chance">{a.chance} %</span>}
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

        {transition && <TransitionManche key={transition.manche} j={transition} />}
        {transition?.nature && <EffetNature key={`n${transition.manche}`} nature={transition.nature} />}
        {/* 0. Ce que tu risques, dit avant tout le reste */}
        <p className={`aff-gravite g-${v.gravite.id}`} role="note">
          <b>{v.gravite.nom}</b>
          <span>{v.gravite.detail}</span>
          <span className="aff-gravite-manche">{v.manche}</span>
        </p>
        {/* 1. Face-à-face : toi à gauche, l'adversaire à droite */}
        <div className="aff-duel arene" ref={haut}>
          <div className={`aff-carte joueur${transition?.subi ? ' frappee' : ''}`} key={`cj${transition?.manche ?? 0}`}>
            <div className="aff-carte-corps">
              <span className="aff-carte-nom">{etat.creation.prenom}</span>
              <span className="aff-jauge" role="meter" aria-label="Tes PV" aria-valuenow={pctJ} aria-valuemin={0} aria-valuemax={100}>
                <i className="aff-endurance" style={{ width: `${pctJ}%` }} />
                {v.ko > 0 && <b className="aff-seuil" style={{ left: `${v.ko * 100}%` }} title="Seuil de KO" />}
              </span>
              <span className="aff-jauge fine" role="meter" aria-label="Ton chakra" aria-valuenow={v.joueur.chakra} aria-valuemin={0} aria-valuemax={v.joueur.chakraMax}>
                <i className="aff-chakra" style={{ width: `${pctC}%` }} />
              </span>
              <span className="aff-pastilles">
                <span className="aff-chiffre">
                  {v.joueur.endurance}/{v.joueur.enduranceMax}
                </span>
                {!!derniere?.subi && (
                  <span key={`j${derniere.manche}`} className="aff-delta perte">
                    −{derniere.subi}
                  </span>
                )}
                {gJ && <span className={`aff-pastille ${gJ.classe}`}>{accorder(gJ.mot, p)}</span>}
                {v.joueur.sonne && <span className="aff-pastille sonne">{accorder('sonné·e', p)}</span>}
                {v.concentre && <span className="aff-pastille concentre">{accorder('concentré·e', p)}</span>}
                {v.joueur.etats.map((e) => (
                  <span key={e} className="aff-pastille etat">
                    {accorder(e, p)}
                  </span>
                ))}
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
          <div className={`aff-carte adv${transition?.inflige ? ' frappee' : ''}`} key={`ca${transition?.manche ?? 0}`}>
            <div className="aff-carte-corps">
              <span className="aff-carte-nom">
                {v.adversaire.nom} {v.adversaire.niveau && <small>{v.adversaire.niveau}</small>}
              </span>
              <span className="aff-jauge" role="meter" aria-label={`PV de ${v.adversaire.nom}`} aria-valuenow={v.adversaire.pct} aria-valuemin={0} aria-valuemax={100}>
                <i className="aff-adv" style={{ width: `${v.adversaire.pct}%` }} />
                {v.ko > 0 && <b className="aff-seuil" style={{ left: `${v.ko * 100}%` }} title="Seuil de KO" />}
              </span>
              <span className="aff-pastilles">
                <span className="aff-chiffre">{v.adversaire.pct} %</span>
                {!!derniere?.inflige && (
                  <span key={`a${derniere.manche}`} className="aff-delta gain">
                    −{derniere.inflige}
                  </span>
                )}
                {gA && <span className={`aff-pastille ${gA.classe}`}>{accorder(gA.mot, 'masculin')}</span>}
                {v.adversaire.sonne && <span className="aff-pastille sonne">souffle coupé</span>}
                {v.adversaire.etats.map((e) => (
                  <span key={e} className="aff-pastille etat">
                    {accorder(e, 'masculin')}
                  </span>
                ))}
                {v.adversaire.visage && <span className="aff-pastille visage">{v.adversaire.visage}</span>}
                {v.adversaire.allie && <span className="aff-pastille allie">{v.adversaire.allie} avec toi</span>}
              </span>
            </div>
          </div>
          <p className="aff-sous-duel">{v.contexte.libelle}</p>
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
            {/* L'annonce, puis l'événement de la manche s'il y en a un (§5), dans son propre paragraphe. */}
            {accorder(v.annonce.texte, p)
              .split('\n\n')
              .map((t, i) => (
                <p key={i} className={i > 0 ? 'aff-evenement' : undefined}>
                  {t}
                </p>
              ))}
            {v.annonce.fiabilite !== 'fiable' && <small>Lecture incertaine : ce n’est peut-être pas ce {elide('que', minusculeArticle(v.adversaire.nom))} prépare.</small>}
            <p className={`aff-conseil${v.annonce.fiabilite === 'fiable' ? ' sur' : ''}`}>
              <b>{accorder(v.annonce.conseil.mot, p)}</b> {accorder(v.annonce.conseil.conseil, p)}
            </p>
            {v.lecture.length > 0 && (
              <details className="aff-lecture">
                <summary>Ce que tu sais {elide('de', minusculeArticle(v.adversaire.nom))} ({v.lecture.length})</summary>
                <ul>
                  {v.lecture.map((l, i) => (
                    <li key={i}>{accorder(l, p)}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>

        {/* 3 bis. Le terrain et la chaîne de natures : ce que tes techniques ont préparé */}
        <TerrainEtChaine v={v} />

        {/* 3 ter. Les règles en sept lignes : ouvertes d'office au tout premier combat */}
        <AideCombat ouverte={Object.keys(etat.registresCombat).length === 0 && manches.length === 0} v2={v.regles >= 2} />

        {/* 4. La commande : familles en onglets, puis les actions en cartes */}
        <section className="aff-commande" aria-label="Ton action pour cette manche">
          {(() => {
            const m = MENUS.find((x) => x.id === menu);
            if (!m)
              return (
                <div className="aff-menu" role="group" aria-label="Que fais-tu ?">
                  {MENUS.map((x, i) => {
                    const n = v.familles.reduce((t, f) => t + f.actions.filter((a) => a.disponible && dansMenu(x.id, x, f.id, a.id)).length, 0);
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className={`aff-menu-bouton menu-${x.id}`}
                        disabled={n === 0}
                        onClick={() => {
                          setMenu(x.id);
                          setPage(0);
                          setNature(null);
                          setChoix(null);
                        }}
                      >
                        <span className="aff-menu-kanji" aria-hidden="true">
                          {x.kanji}
                        </span>
                        <span className="aff-menu-nom">{x.nom}</span>
                        <small>{x.aide}</small>
                        <kbd className="touche" aria-hidden="true">
                          {i + 1}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              );
            // Les actions du menu, les plus parlantes d'abord : disponibles, puis marquées (enchaînement, synergie…).
            // Ce qui est impossible maintenant ne prend pas de place : seules les actions jouables occupent les quatre cases.
            const toutes = v.familles.flatMap((f) => f.actions.filter((a) => dansMenu(m.id, m, f.id, a.id)).map((a) => ({ a, f: f.id, g: m.id === 'jutsu' ? groupeJutsu(f.id, a.id) : '' })));
            // Jutsu : d'abord la nature, s'il y en a plusieurs.
            const groupes = m.id === 'jutsu' ? [...new Set(toutes.map((x) => x.g))].sort((x, y) => rangGroupe(x) - rangGroupe(y)) : [];
            const parNature = groupes.length > 1;
            const retour = () => {
              setChoix(null);
              setFamille(null);
              setPage(0);
              if (parNature && nature) setNature(null);
              else setMenu(null);
            };
            if (parNature && !nature)
              return (
                <div id="aff-panneau" className="aff-sous-menu menu-jutsu" role="group" aria-label="Choisis une nature">
                  <div className="aff-sous-tete">
                    <button type="button" className="aff-retour" onClick={retour}>
                      ‹ Jutsu
                    </button>
                    <span className="aff-sous-aide">Quelle nature ?</span>
                  </div>
                  <div className="aff-natures">
                    {groupes.map((g) => {
                      const du = toutes.filter((x) => x.g === g);
                      const jouables = du.filter((x) => x.a.disponible);
                      const lie = jouables.some((x) => x.a.marques.some((k) => k === 'synergie possible' || k === 'terrain favorable'));
                      const raison = jouables.length ? undefined : du.find((x) => x.a.raison)?.a.raison;
                      return (
                        <button
                          key={g}
                          type="button"
                          className={`aff-nature${lie ? ' liee' : ''}`}
                          style={{ '--nat': `var(--n-${g}, var(--nd-primary-hover))` } as React.CSSProperties}
                          disabled={!jouables.length}
                          onClick={() => {
                            setNature(g);
                            setPage(0);
                            setChoix(null);
                          }}
                        >
                          <span className="aff-nature-kanji" aria-hidden="true">
                            {kanjiGroupe(g)}
                          </span>
                          <span className="aff-nature-nom">{nomGroupe(g).split(' (')[0]}</span>
                          <small>
                            {sensGroupe(g)}
                            {jouables.length
                              ? `${jouables.length} technique${jouables.length > 1 ? 's' : ''}${du.length > jouables.length ? ` · ${du.length - jouables.length} hors de portée` : ''}`
                              : accorder(raison ?? 'Hors de portée', p)}
                          </small>
                          {lie && <b className="aff-nature-lien">enchaînement</b>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            const dansLaNature = parNature ? toutes.filter((x) => x.g === nature) : toutes;
            const indisponibles = dansLaNature.filter((x) => !x.a.disponible).length;
            const items = dansLaNature
              .filter((x) => x.a.disponible)
              .map((x, i) => ({ ...x, i }))
              .sort((x, y) => y.a.marques.length - x.a.marques.length || x.i - y.i);
            const pages = Math.max(1, Math.ceil(items.length / PAR_PAGE));
            const visibles = items.slice((page % pages) * PAR_PAGE, (page % pages) * PAR_PAGE + PAR_PAGE);
            const titre = parNature && nature ? nomGroupe(nature) : m.nom;
            return (
              <div
                id="aff-panneau"
                className={`aff-sous-menu menu-${m.id}${parNature ? ' par-nature' : ''}`}
                role="group"
                aria-label={titre}
                style={parNature && nature ? ({ '--nat': `var(--n-${nature}, var(--nd-primary-hover))` } as React.CSSProperties) : undefined}
              >
                <div className="aff-sous-tete">
                  <button type="button" className="aff-retour" onClick={retour}>
                    ‹ {parNature && nature ? `${kanjiGroupe(nature)} ${titre.split(' (')[0]}` : titre}
                  </button>
                  {pages > 1 && (
                    <button type="button" className="aff-autres" onClick={() => setPage((page + 1) % pages)}>
                      Autres ({(page % pages) + 1}/{pages}) ›
                    </button>
                  )}
                </div>
                {indisponibles > 0 && (
                  <p className="aff-indisponibles">
                    {indisponibles} autre{indisponibles > 1 ? 's' : ''} hors de portée pour l’instant (chakra, arme, palier).
                  </p>
                )}
                <div className="aff-cartes aff-grille4">
                  {visibles.map(({ a, f }) => (
                    <span key={`${f}:${a.id}`} className="aff-carte-wrap" onClickCapture={() => setFamille(f)}>
                      {carte(a)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 5. La barre de lancement : toujours à portée du pouce */}
          {fam && (
            <div className="aff-lancer">
              {act && (
                <div className="aff-fiche-action" aria-live="polite">
                  <strong>{act.nom}</strong>
                  <span>{accorder(act.disponible ? (act.effet ?? act.detail) : (act.raison ?? act.detail), p)}</span>
                  <small>
                    {[act.effet ? act.detail : '', act.chance !== undefined ? `Exécution ≈ ${act.chance} %` : '', act.chakra !== undefined ? `${act.chakra} chakra` : 'Sans chakra', ...act.marques].filter(Boolean).join(' · ')}
                  </small>
                </div>
              )}
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
type Vue = NonNullable<ReturnType<typeof vueAffrontement>>;

const nomNature = (n: string) => (n === 'terrain' ? 'Terrain' : (R.elements[n]?.nom ?? n));

/**
 * Le terrain et la chaîne : tes trois dernières natures en sceaux, ce que le terrain garde, et les enchaînements
 * qui s'offrent maintenant. Rien n'y dit l'issue : seulement ce que la prochaine technique trouvera en place.
 */
function TerrainEtChaine({ v }: { v: Vue }) {
  const sceaux = v.sceaux.filter((x, i, l) => x || l.slice(i + 1).some(Boolean));
  if (!v.terrain.length && !sceaux.some(Boolean) && !v.enchainements.length) return null;
  return (
    <div className="aff-terrain">
      {sceaux.some(Boolean) && (
        <div className="aff-sceaux" aria-label="Ta chaîne de natures">
          <span className="aff-etiquette">Chaîne</span>
          {sceaux.map((n, i) => (
            <span key={i} className="aff-sceau-groupe">
              {i > 0 && <span className="aff-fleche" aria-hidden="true">→</span>}
              {n ? (
                <span className="aff-sceau" style={styleNatures([n])} title={nomNature(n)}>
                  {KANJI_GROUPE[n] ?? '術'}
                </span>
              ) : (
                <span className="aff-sceau vide" title="Action sans nature">·</span>
              )}
            </span>
          ))}
        </div>
      )}
      {v.terrain.length > 0 && (
        <ul className="aff-etats" aria-label="État du terrain">
          {v.terrain.map((t) => (
            <li key={t.id} title={t.detail}>
              <span aria-hidden="true">{t.kanji}</span> {t.nom}
              {t.manches !== undefined && <small> · {t.manches} manche{t.manches > 1 ? 's' : ''}</small>}
            </li>
          ))}
        </ul>
      )}
      {v.enchainements.length > 0 && (
        <details className="aff-enchainements">
          <summary>
            Enchaînements possibles <span className="aff-compte">{v.enchainements.length}</span>
          </summary>
          <ul>
            {v.enchainements.map((e) => (
              <li key={`${e.de}>${e.vers}`} style={styleNatures([e.vers])}>
                <strong>
                  {nomNature(e.de)} → {nomNature(e.vers)}
                </strong>{' '}
                · {e.nom} <small>({e.niveau}{e.lue ? ', déjà lu' : ''})</small>
                <span>{e.resume}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** « que Itachi » → « qu’Itachi », « de Itachi » → « d’Itachi ». */
function elide(mot: 'que' | 'de', suite: string): string {
  return /^[aeiouyéèêâîôœāīōū]/i.test(suite) ? `${mot.slice(0, -1)}’${suite}` : `${mot} ${suite}`;
}
/** « Le chien » au milieu d'une phrase devient « le chien » ; un nom propre ne change pas. */
function minusculeArticle(nom: string): string {
  return /^(?:(?:Le|La|Les|Ton|Ta|Tes|Un|Une)\s|L’)/.test(nom) ? nom.charAt(0).toLowerCase() + nom.slice(1) : nom;
}

function Replique({ nom, texte }: { nom: string; texte: string }) {
  // Un geste (« ~ » : une bête qui gronde, qui recule) se raconte sans guillemets ni nom.
  if (texte.startsWith('~')) return <p className="aff-geste">{texte.slice(1)}</p>;
  return (
    <p className="aff-replique">
      <b>{nom}</b>« {texte} »
    </p>
  );
}

/** Le passage d'une manche à l'autre : un coup de pinceau, le numéro, l'issue, l'enchaînement. Il ne bloque rien. */
/** L'effet d'une nature de chakra, le temps d'un éclair : il traverse l'écran sans jamais bloquer un bouton. */
function EffetNature({ nature }: { nature: string }) {
  return (
    <div className={`nature-fx nature-fx-${nature}`} style={{ '--nfx': `var(--n-${nature}, var(--or))` } as React.CSSProperties} aria-hidden="true">
      {nature === 'raiton' && (
        <svg viewBox="0 0 400 800" preserveAspectRatio="none">
          <path className="nfx-trait" d="M250 0 L170 260 L235 270 L120 520 L190 530 L80 800" />
          <path className="nfx-trait nfx-fin" d="M235 270 L320 380 M120 520 L40 600" />
        </svg>
      )}
      {nature === 'katon' && (
        <svg viewBox="0 0 400 400">
          {[0, 1, 2].map((i) => (
            <circle key={i} className="nfx-onde" cx="200" cy="200" r="60" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={`b${i}`} className="nfx-braise" cx="200" cy="200" r="5" style={{ '--a': `${i * 30}deg`, animationDelay: `${(i % 4) * 0.05}s` } as React.CSSProperties} />
          ))}
        </svg>
      )}
      {nature === 'suiton' && (
        <svg viewBox="0 0 800 300" preserveAspectRatio="none">
          <path className="nfx-vague" d="M-50 220 C80 120 180 300 320 200 S560 120 700 200 S900 260 900 260 L900 300 L-50 300 Z" />
          <path className="nfx-vague nfx-vague2" d="M-50 240 C100 170 220 290 360 230 S600 170 760 230 S900 270 900 270 L900 300 L-50 300 Z" />
        </svg>
      )}
      {nature === 'fuuton' && (
        <svg viewBox="0 0 400 400">
          {[0, 1, 2].map((i) => (
            <path key={i} className="nfx-lame" d={`M40 ${120 + i * 80} Q200 ${60 + i * 80} 360 ${140 + i * 80}`} style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </svg>
      )}
      {nature === 'doton' && (
        <svg viewBox="0 0 400 300" preserveAspectRatio="none">
          {[40, 110, 190, 260, 330].map((x, i) => (
            <path key={x} className="nfx-roc" d={`M${x - 30} 300 L${x} ${150 - (i % 2) * 50} L${x + 30} 300 Z`} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </svg>
      )}
      {nature === 'fusion' && (
        <svg viewBox="0 0 400 400">
          <circle className="nfx-onde" cx="200" cy="200" r="80" />
          <circle className="nfx-onde nfx-fusion" cx="200" cy="200" r="40" style={{ animationDelay: '0.1s' }} />
        </svg>
      )}
    </div>
  );
}

function TransitionManche({ j }: { j: Entree }) {
  const issue = j.issue ? ISSUES[j.issue] : undefined;
  const combo = j.geste?.nom ?? j.synergie?.nom;
  return (
    <div className={`aff-transition ton-${issue?.ton ?? 'neutre'}`} aria-hidden="true">
      <svg className="aff-transition-trait" viewBox="0 0 600 80" preserveAspectRatio="none">
        <path d="M8 52 C120 30 260 34 380 40 S560 30 592 22" />
      </svg>
      <span className="aff-transition-manche">Manche {j.manche}</span>
      {issue && <span className="aff-transition-issue">{issue.mot}</span>}
      {combo && (
        <span className="aff-transition-combo">
          {j.geste && <i>{j.geste.kanji}</i>}
          {combo}
        </span>
      )}
    </div>
  );
}

/**
 * Les règles en sept lignes : de quoi comprendre une manche sans lire de manuel.
 * Chaque chiffre est celui du moteur (resolution.ts).
 */
function AideCombat({ ouverte, v2 }: { ouverte: boolean; v2: boolean }) {
  return (
    <details className="aff-aide" open={ouverte || undefined}>
      <summary>Comment se joue une manche</summary>
      <ol>
        <li>
          <b>Vous agissez en même temps.</b> Lis d’abord « Ce que tu lis » : ce qu’il prépare, et si ta lecture est sûre.
        </li>
        <li>
          <b>S’il attaque</b> : tenir la garde (−30 % de dégâts), esquiver (réussie, sa garde s’ouvre), ou frapper plus fort que lui{v2 ? ' (mais vous échangez des coups)' : ''}.
        </li>
        <li>
          <b>S’il se garde ou t’observe</b> : {v2 ? 'feinter, te concentrer, reprendre ton souffle, ' : ''}observer. Frapper une garde fait 30 % de moins.
        </li>
        <li>
          <b>S’il prépare un coup</b> : frappe tout de suite (+25 %), il ne peut pas te lire.
        </li>
        <li>
          <b>Répéter le même geste</b> le rend prévisible : il finit par le lire et l’esquiver. Une technique qu’il n’a jamais vue le surprend.
        </li>
        <li>
          <b>L’élan</b> (●●●) se gagne en touchant : 1 point pour un coup plus puissant, 3 pour tenter le coup décisif.
        </li>
        <li>
          <b>Le chakra</b> paie les jutsu. Sous 10 %, il ne reste que le corps à corps et les techniques simples. Le pourcentage sur chaque action est ta chance de bien l’exécuter.
        </li>
      </ol>
    </details>
  );
}

/** Le résumé d'une manche, en quatre lignes : toi, lui, ce que ça donne, pourquoi ; puis la leçon. */
function Explication({ e, p }: { e: NonNullable<Entree['explication']>; p: GameState['creation']['presentation'] }) {
  return (
    <div className={`aff-explication ton-${e.ton}`}>
      <dl>
        <div>
          <dt>Toi</dt>
          <dd>{e.toi}</dd>
        </div>
        {e.lui && (
          <div>
            <dt>En face</dt>
            <dd>{accorder(e.lui, p)}</dd>
          </div>
        )}
        <div>
          <dt>Résultat</dt>
          <dd className="aff-explication-bilan">{e.bilan}</dd>
        </div>
        {e.pourquoi && (
          <div>
            <dt>Pourquoi</dt>
            <dd>{accorder(e.pourquoi, p)}</dd>
          </div>
        )}
      </dl>
      {e.conseil && (
        <p className="aff-explication-conseil">
          <span aria-hidden="true">策</span> {accorder(e.conseil, p)}
        </p>
      )}
    </div>
  );
}

/** Une manche jouée (§22.4) : son issue, le récit d'un seul tenant, la réplique, puis ce qui s'est passé en clair. */
function BlocManche({ j, nom, p }: { j: Entree; nom: string; p: GameState['creation']['presentation'] }) {
  const issue = j.issue ? ISSUES[j.issue] : undefined;
  return (
    <section className={`aff-manche-bloc ton-${issue?.ton ?? 'neutre'}`} aria-label={`Manche ${j.manche}`}>
      <header className="aff-manche-tete">
        <h2>Manche {j.manche}</h2>
        {issue && <span className={`aff-issue ${issue.ton}`}>{issue.mot}</span>}
      </header>
      {j.annonce && <p className="aff-annonce-passee">{accorder(j.annonce, p).replace(/\n\n/g, ' ')}</p>}
      <p className="aff-recit-manche">
        {accorder(j.execution, p)} {j.reponse && accorder(j.reponse, p)}
      </p>
      <p className="aff-recit-manche impact">{avecParoles(accorder(j.impact, p))}</p>
      {j.geste && (
        <p className="aff-geste-combo">
          <span className="aff-geste-sceau" aria-hidden="true">
            {j.geste.kanji}
          </span>
          <b>Enchaînement</b> {j.geste.nom}
        </p>
      )}
      {j.synergie && (
        <p className="aff-synergie">
          <b>Enchaînement</b> {nomNature(j.synergie.de)} → {nomNature(j.synergie.vers)} · {j.synergie.nom} <small>({j.synergie.niveau})</small>
        </p>
      )}
      {j.repliques.map((r, k) => (
        <Replique key={k} nom={nom} texte={accorder(r, p)} />
      ))}
      {/* Ce qui s'est passé, en clair ; un combat d'avant la 2.51 garde sa seule phrase-cause. */}
      {j.explication ? <Explication e={j.explication} p={p} /> : j.lecture && <p className={`aff-cause issue-${j.issue ?? 'autre'}`}>{accorder(j.lecture, p)}</p>}
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
