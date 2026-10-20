'use client';

import type { GameState } from '../engine/types';
import { R } from '../engine/registre';
import { chapitreSuivantDisponible } from '../engine/moteur';
import { age } from '../engine/calendrier';
import { defPnj, nomComplet } from '../engine/etat';
import { accorder } from '../engine/texte';
import { noteFinale, texteFin } from '../engine/fins';
import type { Meta } from '../engine/sauvegarde';
import { ETAT_PNJ, RANG_LIBELLE } from './libelles';

const SCENE_VILLAGE: Record<string, string> = {
  konoha: 'village_feu',
  suna: 'village_vent',
  kiri: 'village_brume',
  kumo: 'village_foudre',
  iwa: 'village_terre',
};

export default function Fin({
  etat,
  meta,
  theme,
  anime,
  onNouvelle,
  onMenu,
  onChapitreSuivant,
}: {
  etat: GameState;
  meta: Meta;
  theme: 'nuit' | 'washi';
  anime: boolean;
  onNouvelle: () => void;
  onMenu: () => void;
  onChapitreSuivant: () => void;
}) {
  const suite = chapitreSuivantDisponible(etat);
  const { titre, texte } = texteFin(etat);
  const note = noteFinale(etat);
  const village = R.villages[etat.creation.village];
  const proches = Object.entries(etat.relations)
    .filter(([id, r]) => etat.pnj[id]?.rencontre && (r.amitie + r.confiance + r.rivalite >= 30 || r.rompue))
    .slice(0, 8);
  const majeures = etat.journal.filter((j) => j.importance === 3);
  const pouvoirs = Object.values(etat.maitrises).filter((m) => m.tier >= 1 && m.awakened && !m.bloquee);
  const total = R.contenu.evenements.length;
  const explore = Math.round((meta.evenementsVus.length / total) * 100);
  const finsInconnues = R.contenu.fins.filter((f) => !meta.finsObtenues.includes(f.id)).length;
  const legendaires = etat.arsenal.filter((a) => ['legendaire', 'maudite'].includes(R.armes[a.defId]?.rarete));

  const P = etat.creation.presentation;
  return (
    <div className="recit">
      <header className="lieu-bandeau">
        <span className="sceau-texte" aria-hidden="true">
          終
        </span>
        <div>
          <strong>{village.nom}</strong>
          <span>{suite ? `Fin du chapitre ${etat.chapitre}` : `Fin de la vie de ${etat.creation.prenom}`}</span>
        </div>
      </header>
      <article className="recit-texte">
      <h1 className="titre-scene">{accorder(titre, P)}</h1>
      <span className="note" aria-label={`Note finale ${note.note}`}>
        {note.note}
      </span>
      <p className="sous-titre">
        {nomComplet(etat)}, {accorder(RANG_LIBELLE[etat.rang], P)}, {age(etat)} ans.
        {etat.fin?.cause ? ` ${etat.fin.cause.charAt(0).toUpperCase()}${etat.fin.cause.slice(1)}.` : ''}
      </p>
      <div className="texte-recit" style={{ marginTop: 14 }}>
        {accorder(texte, P)
          .split(/\n\n+/)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>
      {suite && (
        <div className="actions-bas" style={{ marginTop: 16 }}>
          <button className="btn-principal" onClick={onChapitreSuivant}>
            Continuer : Chapitre {etat.chapitre + 1}
          </button>
        </div>
      )}

      <section className="groupe">
        <h3>{village.nom}</h3>
        <p>
          {etat.statut === 'actif'
            ? `Le village continue sa paix armée. Ta loyauté y pèse ${Math.round(etat.social.loyaute)} sur 100, ta réputation ${Math.round(etat.social.reputation)}.`
            : `Tu n’y appartiens plus. Le village poursuit son chemin sans toi.`}
          {etat.drapeaux['traitre_revele'] ? ' Un traître a été signalé au Kage ; l’enquête est ouverte.' : ''}
          {etat.drapeaux['incident_suna'] ? ' Un incident diplomatique avec Suna porte ton nom.' : ''}
        </p>
      </section>

      {proches.length > 0 && (
        <section className="groupe">
          <h3>Ceux que tu as croisés</h3>
          <ul className="liste-simple">
            {proches.map(([id, r]) => {
              const d = defPnj(etat, id);
              const st = etat.pnj[id];
              return (
                <li key={id}>
                  <strong>{d?.nom}</strong> {st && st.etat !== 'vivant' ? `(${accorder(ETAT_PNJ[st.etat], d?.genre === 'f' ? 'feminin' : 'masculin')})` : ''}
                  <div className="sous-titre">
                    {r.rompue ? 'Lien rompu.' : r.amitie >= 50 ? 'Un lien solide.' : r.rivalite >= 30 ? 'Une rivalité qui n’a pas fini de brûler.' : 'Un lien encore fragile.'}
                    {r.souvenirs.length ? ` « ${r.souvenirs[r.souvenirs.length - 1]} »` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="groupe">
        <h3>Ce qui t’a fait</h3>
        <ul className="liste-simple">
          {majeures.slice(-10).map((j, i) => (
            <li key={i}>{accorder(j.texte, P)}</li>
          ))}
        </ul>
      </section>

      <section className="groupe">
        <h3>Pouvoirs, armes et trophées</h3>
        <ul className="liste-simple">
          {pouvoirs.map((m) => (
            <li key={m.id}>
              {R.maitrises[m.id]?.nom} : palier {m.tier}
              {m.awakenedAtAge !== undefined && R.maitrises[m.id]?.eveil ? `, éveillé à ${m.awakenedAtAge} ans` : ''}
            </li>
          ))}
          {legendaires.map((a) => (
            <li key={a.defId}>Arme : {R.armes[a.defId]?.nom}</li>
          ))}
          {etat.metier.historique.map((h) => (
            <li key={h.id + h.debut}>Métier : {accorder(R.metiers[h.id]?.nom ?? h.id, P)}</li>
          ))}
          {etat.succes.map((s) => (
            <li key={s}>Trophée : {accorder(R.succes[s]?.nom ?? s, P)}</li>
          ))}
        </ul>
      </section>

      {etat.secrets.length > 0 && (
        <section className="groupe">
          <h3>Secrets découverts ({etat.secrets.length})</h3>
          <ul className="liste-simple">
            {etat.secrets.map((s) => (
              <li key={s}>{R.encyclopedie[`secret:${s}`]?.titre ?? s}</li>
            ))}
          </ul>
        </section>
      )}

      {etat.sequences.length > 0 && (
        <section className="groupe">
          <h3>Ta vie, séquence par séquence</h3>
          <ol className="frise">
            {etat.sequences.map((v) => {
              const d = R.contenu.sequences.find((x) => x.id === v.id);
              const finAge = v.fin?.age ?? age(etat);
              return (
                <li key={v.id}>
                  <span className="kanji" aria-hidden="true">
                    {d?.kanji}
                  </span>
                  <span>
                    <strong>{d?.titre}</strong>
                    <small>{v.debut.age === finAge ? `${finAge} ans` : `${v.debut.age} à ${finAge} ans`}</small>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="bourse" style={{ marginTop: 22 }}>
        <span className="bourse-montant">
          +{Math.max(0, Math.round(etat.jauges.ryo))} <span aria-hidden="true">両</span>
        </span>
        <span>versés à ta bourse. Dépense-les à la boutique pour avantager ta prochaine vie.</span>
      </p>

      <section className="groupe">
        <h3>Note finale : {note.note}</h3>
        <ul className="liste-simple">
          {note.detail.map((d) => (
            <li key={d.libelle}>
              {d.libelle} <span className="sous-titre">({d.points >= 0 ? '+' : ''}{d.points})</span>
            </li>
          ))}
        </ul>
        <p className="sous-titre">
          Contenu exploré au fil de tes vies : {explore} %. Fins encore inconnues : {finsInconnues} sur {R.contenu.fins.length}.
        </p>
      </section>

      <div className="actions-bas">
        {suite && (
          <button className="btn-principal" onClick={onChapitreSuivant}>
            Continuer : Chapitre {etat.chapitre + 1}
          </button>
        )}
        <button className={suite ? 'btn-secondaire' : 'btn-principal'} onClick={onNouvelle}>
          Recommencer avec un autre clan ou un autre village
        </button>
        <button className="btn-secondaire" onClick={onMenu}>
          Retour au menu
        </button>
      </div>
      </article>
    </div>
  );
}
