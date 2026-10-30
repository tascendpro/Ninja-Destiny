'use client';

// Les écrans propres à la campagne à deux : le passage de l'appareil, les scènes communes et privées, leurs résultats,
// le combat à deux (signes, techniques de duo), le lien et ce qu'on peut faire envers l'autre, et la mort d'un joueur.
// Rien ici ne montre à un joueur ce que l'autre a choisi en secret, ni ce que l'autre ressent pour lui.
// Les textes communs ne s'accordent pas au lecteur : leurs accords désignent chacun des deux joueurs, déjà résolus par le moteur.

import { useState } from 'react';
import type { ActionLien, Campagne, IdJoueur, SigneCombat, SuiteMort } from '../../engine/campagne/types';
import { LIBELLES_LIEN, SIGNES, actionsLien, motsDuLien, souvenirsDe, vueCombatDuo, vueCommune, vuePrivee } from '../../engine/campagne/moteur';
import { R } from '../../engine/registre';
import { projeter, type CartePublique } from '../../engine/campagne/projection';

const TON: Record<string, string> = { chaud: 'chaud', amer: 'amer', honteux: 'honteux', fier: 'fier', tragique: 'tragique' };

/** L'écran de passage : il masque tout entre deux joueurs. */
export function EcranPassage({ c, j, message, onConfirmer }: { c: Campagne; j: IdJoueur; message?: string; onConfirmer: () => void }) {
  const prenom = c.creations[j].prenom;
  return (
    <div className={`passage joueur-${j}`} role="dialog" aria-modal="true" aria-labelledby="passage-titre">
      <span className="passage-sceau" aria-hidden="true">
        交
      </span>
      <h1 id="passage-titre">Au tour de {prenom}</h1>
      <p>Passe l’appareil à {prenom}. Personne d’autre ne doit regarder l’écran.</p>
      {message && <p className="passage-message">{message}</p>}
      <button className="btn-principal" onClick={onConfirmer}>
        Je suis {prenom}
      </button>
    </div>
  );
}

function Paragraphes({ texte }: { texte: string }) {
  return (
    <>
      {texte.split('\n\n').map((p, i) => (
        <p key={i} className="narration">
          {p}
        </p>
      ))}
    </>
  );
}

function Choix({ choix, onChoisir }: { choix: { id: string; texte: string }[]; onChoisir: (id: string) => void }) {
  return (
    <ol className="choix-liste" aria-label="Choix">
      {choix.map((ch) => (
        <li key={ch.id}>
          <button className="choix fuda fuda-libre" data-sceau="決" onClick={() => onChoisir(ch.id)}>
            <span className="fuda-kanji" aria-hidden="true">
              決
            </span>
            <span className="choix-texte">{ch.texte}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Une scène commune : le récit, ce que tu vois de plus, et tes choix. L'autre choisit de son côté. */
export function SceneCommune({ c, j, onChoisir }: { c: Campagne; j: IdJoueur; onChoisir: (id: string) => void }) {
  const v = vueCommune(c, j);
  if (!v) return null;
  const autre = c.creations[(1 - j) as IdJoueur].prenom;
  return (
    <div className="recit">
      <article className="recit-texte scene-commune">
        <p className="commune-etiquette">
          Scène commune · {c.creations[0].prenom} et {c.creations[1].prenom}
        </p>
        <h1 className="titre-scene">{v.titre}</h1>
        <Paragraphes texte={v.texte} />
        <p className="commune-secret">{v.autreAChoisi ? `${autre} a déjà choisi, en secret.` : `Choisis en secret : ${autre} choisira ensuite, sans voir ton choix.`}</p>
        <Choix choix={v.choix} onChoisir={onChoisir} />
      </article>
    </div>
  );
}

/** Une scène privée : toi seul la vis. */
export function ScenePrivee({ c, j, onChoisir }: { c: Campagne; j: IdJoueur; onChoisir: (id: string) => void }) {
  const v = vuePrivee(c, j);
  if (!v) return null;
  return (
    <div className="recit">
      <article className="recit-texte scene-commune scene-privee">
        <p className="commune-etiquette">Scène privée · {c.creations[(1 - j) as IdJoueur].prenom} n’en saura rien</p>
        <h1 className="titre-scene">{v.titre}</h1>
        <Paragraphes texte={v.texte} />
        <Choix choix={v.choix} onChoisir={onChoisir} />
      </article>
    </div>
  );
}

/** Ce que la scène (ou le combat) a donné : les deux le lisent, chacun à son tour. */
export function ResultatCommun({ c, j, prive = false, onContinuer }: { c: Campagne; j: IdJoueur; prive?: boolean; onContinuer: () => void }) {
  const r = prive ? c.resultatPrive[j] : c.resultat;
  if (!r) return null;
  const derniere = !prive && c.dernierCombat && !r.libelles[0] ? c.dernierCombat[j].filter((e) => e.manche > 0).at(-1) : undefined;
  return (
    <div className="recit">
      <article className={`recit-texte scene-commune${prive ? ' scene-privee' : ''}`}>
        <p className="commune-etiquette">{prive ? 'Scène privée' : 'Scène commune'}</p>
        <h1 className="titre-scene">{r.titre}</h1>
        {prive ? (
          <ul className="commune-choix">
            <li>
              <b>Toi</b> {r.libelles[0]}
            </li>
          </ul>
        ) : (
          !!r.libelles[0] && (
            <ul className="commune-choix">
              {([0, 1] as IdJoueur[]).map((x) => (
                <li key={x}>
                  <b>{c.creations[x].prenom}</b> {r.libelles[x]}
                </li>
              ))}
            </ul>
          )
        )}
        {derniere && (
          <p className="narration combat-derniere">
            {derniere.execution} {derniere.impact}
          </p>
        )}
        <Paragraphes texte={r.texte} />
        <button className="btn-principal" onClick={onContinuer}>
          Continuer
        </button>
      </article>
    </div>
  );
}

/** Ce qui t'est arrivé sans que tu le voies venir : à lire avant de reprendre. */
export function Nouvelles({ notes, onLu }: { notes: string[]; onLu: () => void }) {
  if (!notes.length) return null;
  return (
    <aside className="nouvelles" role="status">
      <h2>Pendant ce temps</h2>
      <ul>
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
      <button className="btn-secondaire" onClick={onLu}>
        Compris
      </button>
    </aside>
  );
}

/** Une proposition de l'autre : un duel d'entraînement, ou la création d'une technique de duo. */
export function Proposition({ c, j, onRepondre }: { c: Campagne; j: IdJoueur; onRepondre: (oui: boolean) => void }) {
  const p = c.proposition;
  if (!p || p.de === j) return null;
  const qui = c.creations[p.de].prenom;
  return (
    <aside className="nouvelles proposition" role="dialog" aria-label="Proposition">
      <h2>{p.type === 'duel' ? `${qui} te propose un duel d’entraînement` : `${qui} veut créer une technique avec toi`}</h2>
      <p>{p.type === 'duel' ? 'Le vainqueur y gagne trois points de stat, le vaincu un. Personne n’y meurt.' : `« ${p.nom} » : il faudra la lancer ensemble, dans la même manche, ou elle ratera.`}</p>
      <div className="proposition-boutons">
        <button className="btn-principal" onClick={() => onRepondre(true)}>
          Accepter
        </button>
        <button className="btn-secondaire" onClick={() => onRepondre(false)}>
          Refuser
        </button>
      </div>
    </aside>
  );
}

/** Le bandeau du combat à deux : le signe de l'autre, ton signe, le risque de le toucher, les techniques de duo. */
export function BandeauDuo({ c, j, signe, onSigne, onDuo }: { c: Campagne; j: IdJoueur; signe?: SigneCombat; onSigne: (s?: SigneCombat) => void; onDuo: (id: string) => void }) {
  const v = vueCombatDuo(c, j);
  if (!v) return null;
  const autre = c.creations[(1 - j) as IdJoueur].prenom;
  if (v.mode === 'duel') return <p className="bandeau-duo">Duel contre {autre} : chacun choisit en secret, puis tout se résout ensemble.</p>;
  return (
    <div className={`bandeau-duo joueur-${j}`}>
      <p className="duo-partenaire">
        <span className={`pastille joueur-${(1 - j) as IdJoueur}`} aria-hidden="true" /> {autre} · {c.joueurs[(1 - j) as IdJoueur].rang} · {v.autreATerre ? 'à terre' : c.combat?.choix[(1 - j) as IdJoueur] ? 'a choisi' : 'réfléchit'}
      </p>
      {v.signeAutre && (
        <p className="duo-signe-recu">
          {autre} te fait signe : <b>« {v.signeAutre} »</b>
        </p>
      )}
      {v.autreATerre && <p className="duo-alerte">{autre} est à terre.</p>}
      {v.risqueTirAmi && <p className="duo-alerte">Risque de toucher {autre} avec une technique de zone : vous ne vous connaissez pas encore assez.</p>}
      <label className="duo-signe">
        Ton signe à {autre} :{' '}
        <select value={signe ?? ''} onChange={(e) => onSigne((e.target.value || undefined) as SigneCombat | undefined)}>
          <option value="">Aucun</option>
          {(Object.keys(SIGNES) as SigneCombat[]).map((s) => (
            <option key={s} value={s}>
              {SIGNES[s]}
            </option>
          ))}
        </select>
      </label>
      {v.duo.length > 0 && (
        <div className="duo-techniques">
          {v.duo.map((t) => (
            <button key={t.id} className="btn-secondaire" onClick={() => onDuo(`duo:${t.id}`)}>
              {t.nom} <small>· à lancer ensemble</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Après la mort : ce que devient le joueur du personnage disparu. */
export function ChoixMort({ c, j, onChoisir }: { c: Campagne; j: IdJoueur; onChoisir: (s: SuiteMort) => void }) {
  const autre = c.creations[(1 - j) as IdJoueur].prenom;
  return (
    <div className="passage">
      <span className="passage-sceau" aria-hidden="true">
        死
      </span>
      <h1>{c.creations[j].prenom} n’est plus</h1>
      <p>{c.joueurs[j].fin?.cause ? `${c.joueurs[j].fin!.cause}.` : ''} Tu ne quittes pas la campagne. Que deviens-tu ?</p>
      <div className="options choix-mort">
        <button className="option" onClick={() => onChoisir('heritier')}>
          <strong>L’héritier</strong>
          <p>Un enfant de ton village et de ton clan entre en scène aujourd’hui, à six ans. Il ne sait rien de ce que tu as vécu avec {autre}.</p>
        </button>
        <button className="option" onClick={() => onChoisir('spectateur')}>
          <strong>Le spectateur</strong>
          <p>Tu suis l’histoire de {autre} jusqu’au bout.</p>
        </button>
        <button className="option" onClick={() => onChoisir('retour')}>
          <strong>Le retour</strong>
          <p>Un jour, une technique interdite te ramènera, contre ton gré, face à {autre}. Tu pourras essayer de résister.</p>
        </button>
      </div>
    </div>
  );
}

const MOTIFS = ['une désobéissance à la passe du nord', 'une rencontre suspecte, la nuit, hors du village', 'une technique qu’on ne lui a jamais enseignée', 'un ennemi épargné'];

/** Le lien vu par un joueur, et ce qu'il peut faire envers l'autre. */
export function VueLien({ c, j, onLien }: { c: Campagne; j: IdJoueur; onLien: (x: ActionLien) => void }) {
  const autre = c.creations[(1 - j) as IdJoueur].prenom;
  const souvenirs = souvenirsDe(c, j);
  const accord = c.lien.accord;
  const a = actionsLien(c, j);
  const [nomDuo, setNomDuo] = useState(a.nomsDuo[0]);
  const [motif, setMotif] = useState(MOTIFS[0]);
  const confirmer = (texte: string, x: ActionLien) => {
    if (typeof window === 'undefined' || window.confirm(texte)) onLien(x);
  };
  const motAccord = accord >= 70 ? 'Vous vous comprenez sans un mot.' : accord >= 45 ? 'Vous savez ce que l’autre va faire, la plupart du temps.' : accord >= 20 ? 'Vous apprenez encore à vous battre ensemble.' : 'Vous vous gênez plus que vous ne vous aidez.';
  const p = projeter(c, j);
  const moi: CartePublique = { ...p.autre, prenom: c.creations[j].prenom, rang: c.joueurs[j].rang, age: Math.floor((c.joueurs[j].jour - c.joueurs[j].naissance) / 360), statut: c.joueurs[j].statut, village: R.villages[c.creations[j].village]?.nom ?? '', clan: R.clans[c.creations[j].clan]?.nom ?? '', presentation: c.creations[j].presentation, chapitre: c.joueurs[j].chapitre, etat: c.joueurs[j].blessures.some((b) => b.gravite >= 3) ? 'grave' : c.joueurs[j].blessures.length ? 'blesse' : 'en_forme' };
  const m = p.monde;
  return (
    <section className="vue-lien">
      <h1 className="titre-scene">Toi et {autre}</h1>
      <p className="sous-titre">{LIBELLES_LIEN[c.lien.type]}</p>
      <div className="cartes-duo">
        <Carte carte={moi} joueur={j} toi />
        <Carte carte={p.autre} joueur={(1 - j) as IdJoueur} />
      </div>
      <div className="panneau">
        <h2>Ce que tu ressens</h2>
        <ul className="lien-mots">
          {motsDuLien(c, j).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="lien-note">Ce que {autre} ressent pour toi, tu ne peux que le deviner.</p>
      </div>
      <div className="panneau">
        <h2>Au combat</h2>
        <p>{motAccord}</p>
        <span className="piste c-or" aria-label={`Accord : ${accord} sur 100`}>
          <i style={{ width: `${accord}%` }} />
        </span>
        <p className="lien-note">
          Duels : {c.creations[0].prenom} {c.lien.duels[0]} · {c.creations[1].prenom} {c.lien.duels[1]}
        </p>
        {c.lien.techniquesDuo.length > 0 && (
          <ul className="lien-promesses">
            {c.lien.techniquesDuo.map((t) => (
              <li key={t.id}>
                {t.nom} <small>· palier {t.palier}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      {c.lien.promesses.length > 0 && (
        <div className="panneau">
          <h2>Vos promesses</h2>
          <ul className="lien-promesses">
            {c.lien.promesses.map((p) => (
              <li key={p.id} className={`promesse-${p.etat}`}>
                {p.texte}
                {p.etat === 'rompue' && <small> · rompue</small>}
                {p.etat === 'tenue' && <small> · tenue</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="panneau">
        <h2>Vos souvenirs</h2>
        {souvenirs.length ? (
          <ul className="lien-souvenirs">
            {souvenirs.map((s) => (
              <li key={`${s.id}-${s.jour}`} className={`ton-${TON[s.tonalite]}`}>
                « {s.texte} »
              </li>
            ))}
          </ul>
        ) : (
          <p className="vide">Rien encore. Ça viendra.</p>
        )}
      </div>

      {(m.titres.length > 0 || m.voix.length > 0) && (
        <div className="panneau">
          <h2>Ce qu’on dit de vous</h2>
          {m.titres.length > 0 && (
            <ul className="lien-titres">
              {m.titres.map((t) => (
                <li key={t.id}>
                  <strong>{t.nom}</strong> <small>· {t.raison}</small>
                </li>
              ))}
            </ul>
          )}
          {m.voix.slice(0, 4).map((v) => (
            <p key={v} className="lien-voix">
              {v}
            </p>
          ))}
          {Object.entries(m.renommee).length > 0 && (
            <p className="lien-note">
              Renommée du binôme :{' '}
              {Object.entries(m.renommee)
                .map(([k, v]) => `${k === 'akatsuki' ? 'auprès de l’Aube' : R.villages[k]?.nom ?? k} ${v > 0 ? '+' : ''}${v}`)
                .join(' · ')}
            </p>
          )}
        </div>
      )}
      {m.chronique.length > 0 && (
        <details className="panneau">
          <summary>La chronique</summary>
          <ul className="lien-chronique">
            {[...m.chronique].reverse().slice(0, 12).map((x, i) => (
              <li key={`${x.jour}-${i}`}>{x.texte}</li>
            ))}
          </ul>
        </details>
      )}
      {(m.akatsuki.binomes || m.akatsuki.moi) && (
        <div className="panneau lien-aube">
          <h2>L’Aube</h2>
          {m.akatsuki.detruite ? (
            <p>L’Akatsuki de votre temps n’est plus.</p>
          ) : (
            m.akatsuki.binomes && (
              <ul className="lien-promesses">
                {m.akatsuki.binomes.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )
          )}
          {m.akatsuki.moi && (
            <p className="lien-secret">
              {m.akatsuki.moi === 'chef' ? 'Tu portes le manteau du chef. Personne ne le sait.' : m.akatsuki.moi === 'infiltre' ? 'Tu es infiltré dans l’Aube, sur ordre de ton Kage.' : 'Tu portes en secret l’anneau de l’Aube.'}
            </p>
          )}
          {m.akatsuki.couverture !== undefined && (
            <>
              <p className="lien-note">Ta couverture</p>
              <span className="piste c-or" aria-label={`Couverture : ${m.akatsuki.couverture} sur 100`}>
                <i style={{ width: `${m.akatsuki.couverture}%` }} />
              </span>
            </>
          )}
        </div>
      )}

      <div className="panneau lien-actions">
        <h2>Ensemble</h2>
        {!a.proche && <p className="lien-note">Pour un duel, une technique de duo ou un enseignement, il faut que vous soyez tous les deux libres, au même moment.</p>}
        <div className="lien-boutons">
          <button className="btn-secondaire" disabled={!a.duel} onClick={() => onLien({ t: 'proposer', type: 'duel' })}>
            Proposer un duel d’entraînement
          </button>
          {a.donner && (
            <>
              <button className="btn-secondaire" onClick={() => onLien({ t: 'donner', ryo: 50 })}>
                Donner 50 ryō
              </button>
              <button className="btn-secondaire" onClick={() => onLien({ t: 'donner', ryo: 200, pret: true })}>
                Prêter 200 ryō
              </button>
            </>
          )}
        </div>
        {a.technique && (
          <div className="lien-ligne">
            <select value={nomDuo} onChange={(e) => setNomDuo(e.target.value)} aria-label="Nom de la technique de duo">
              {a.nomsDuo.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button className="btn-secondaire" onClick={() => onLien({ t: 'proposer', type: 'technique', nom: nomDuo })}>
              Créer cette technique ensemble
            </button>
          </div>
        )}
        {a.enseignables.length > 0 && (
          <div className="lien-ligne">
            {a.enseignables.map((t) => (
              <button key={t} className="btn-secondaire" onClick={() => onLien({ t: 'enseigner', technique: t })}>
                Enseigner {R.maitrises[t]?.nom ?? t}
              </button>
            ))}
          </div>
        )}
      </div>

      {(a.denoncer || a.enqueter) && (
        <details className="panneau lien-actions lien-ombre">
          <summary>Dans l’ombre</summary>
          <p className="lien-note">Tout est possible. Tout a des suites. {autre} ne verra que les effets, jamais la source, à moins de la découvrir.</p>
          {a.denoncer && (
            <div className="lien-ligne">
              <select value={motif} onChange={(e) => setMotif(e.target.value)} aria-label="Motif du rapport">
                {MOTIFS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <button className="btn-secondaire" onClick={() => confirmer(`Faire un rapport sur ${autre} ?`, { t: 'denoncer', motif })}>
                Faire un rapport
              </button>
              <button className="btn-secondaire" onClick={() => confirmer(`Faire un faux rapport sur ${autre} ? S’il est démenti, il retombera sur toi.`, { t: 'denoncer', motif, faux: true })}>
                Un faux rapport
              </button>
              <button className="btn-secondaire" onClick={() => confirmer(`Répandre une rumeur sur ${autre} ?`, { t: 'rumeur' })}>
                Répandre une rumeur
              </button>
            </div>
          )}
          {a.nuire && a.cibles.length > 0 && (
            <div className="lien-ligne">
              {a.cibles.map((cible) => (
                <button
                  key={cible}
                  className="btn-secondaire danger"
                  onClick={() => confirmer(`T’en prendre ${cible === 'parent' ? 'au parent' : cible === 'sensei' ? 'au sensei' : 'à l’ami d’enfance'} de ${autre} ? C’est irréversible.`, { t: 'nuire', cible })}
                >
                  S’en prendre {cible === 'parent' ? (c.lien.type === 'freres' ? 'à votre parent' : 'à son parent') : cible === 'sensei' ? 'à son sensei' : 'à son ami d’enfance'}
                </button>
              ))}
            </div>
          )}
          {a.enqueter && (
            <button className="btn-secondaire" onClick={() => onLien({ t: 'enqueter' })}>
              Enquêter sur ce qui t’arrive (20 ryō, de la fatigue)
            </button>
          )}
        </details>
      )}
    </section>
  );
}

const RANG: Record<string, string> = { eleve: 'Élève', genin: 'Genin', chunin: 'Chūnin', jonin: 'Jōnin', kage: 'Kage' };
const ETAT: Record<CartePublique['etat'], string> = { en_forme: 'en forme', blesse: 'blessé·e', grave: 'gravement blessé·e' };

/** La carte d'un des deux personnages, à sa couleur (vermillon pour le premier, indigo pour le second). */
function Carte({ carte, joueur, toi = false }: { carte: CartePublique; joueur: IdJoueur; toi?: boolean }) {
  const mort = carte.statut === 'mort';
  return (
    <div className={`carte-duo joueur-${joueur}${mort ? ' carte-morte' : ''}`}>
      <strong>
        {carte.prenom}
        {toi && <small> · toi</small>}
      </strong>
      <span>
        {RANG[carte.rang] ?? carte.rang} · {carte.age} ans
      </span>
      <span className="carte-detail">
        {carte.village}
        {carte.clan && carte.clan !== 'Sans clan' ? ` · ${carte.clan}` : ''}
      </span>
      <span className="carte-detail">{mort ? 'mort·e' : carte.statut === 'deserteur' ? 'déserteur' : ETAT[carte.etat]}</span>
    </div>
  );
}

/** La fin de la campagne : le titre, les deux voix (chacun lit enfin celle de l'autre), la chronologie, la note. */
export function FinDuo({ c, onMenu }: { c: Campagne; onMenu: () => void }) {
  const f = c.fin;
  if (!f) return null;
  return (
    <section className="fin-duo">
      <span className="passage-sceau" aria-hidden="true">
        終
      </span>
      <h1 className="titre-scene">{f.titre}</h1>
      <Paragraphes texte={f.texte} />
      <div className="fin-voix">
        {([0, 1] as IdJoueur[]).map((j) => (
          <blockquote key={j} className={`joueur-${j}`}>
            <strong>{c.creations[j].prenom}</strong>
            <p>{f.epilogues[j]}</p>
          </blockquote>
        ))}
      </div>
      <div className="panneau">
        <h2>Votre histoire</h2>
        <ul className="lien-chronique">
          {f.chronologie.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <p className="fin-note">
        Note du binôme : <strong>{f.noteLien}</strong>
      </p>
      <button className="btn-principal" onClick={onMenu}>
        Retour au menu
      </button>
    </section>
  );
}
