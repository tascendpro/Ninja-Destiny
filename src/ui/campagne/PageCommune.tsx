'use client';

// La page commune : une scène vécue à deux sur la même page, au lieu de se passer l'appareil.
// Le récit commun est écrit une seule fois. Chacun a sa carte : sa pensée privée et ses choix, dépliés à la demande
// (sur un seul téléphone, l'autre détourne les yeux ; sur deux appareils, chacun ne recevra que la sienne).
// Puis le résultat, la décision commune (l'un propose, l'autre accepte) et, pour chacun, « ce qui a changé ».

import { useState } from 'react';
import type { AxeLien, Campagne, Changement, IdJoueur } from '../../engine/campagne/types';
import type { VueJoueurPage, VuePageCommune } from '../../engine/campagne/moteur';
import { ATTRIBUT_LIBELLE } from '../libelles';
import type { AttributId } from '../../engine/types';
import { Decor, Paragraphes } from './Campagne';

const AXES: Record<AxeLien, [string, string]> = {
  confiance: ['Tu fais davantage confiance à {x}.', 'Tu fais moins confiance à {x}.'],
  rivalite: ['Ta rivalité avec {x} s’aiguise.', 'Ta rivalité avec {x} s’apaise.'],
  respect: ['Tu respectes davantage {x}.', 'Tu respectes moins {x}.'],
  loyaute: ['Ta loyauté envers {x} grandit.', 'Ta loyauté envers {x} faiblit.'],
  ressentiment: ['Tu en veux davantage à {x}.', 'Tu en veux moins à {x}.'],
  jalousie: ['Tu jalouses un peu plus {x}.', 'Ta jalousie envers {x} retombe.'],
  dependance: ['Tu as davantage besoin de {x}.', 'Tu as moins besoin de {x}.'],
  mefiance: ['Tu te méfies davantage de {x}.', 'Tu te méfies moins de {x}.'],
  admiration: ['Tu admires davantage {x}.', 'Ton admiration pour {x} baisse.'],
  dette: ['Tu te sens redevable envers {x}.', 'Ta dette envers {x} s’allège.'],
  peur_de_perdre: ['Tu as peur de perdre {x}.', 'Tu as moins peur de perdre {x}.'],
};

/** Une trace en mots, du point de vue de celui qui la vit. Jamais de chiffre brut sur la relation. */
export function libelleChangement(x: Changement, autre: string): { texte: string; classe: string } {
  switch (x.t) {
    case 'axe':
      return { texte: AXES[x.axe][x.delta > 0 ? 0 : 1].replace('{x}', autre), classe: 'lien' };
    case 'accord':
      return { texte: x.delta > 0 ? 'Votre accord grandit : vous vous comprenez sans parler.' : 'Votre accord se fissure.', classe: 'lien' };
    case 'souvenir':
      return { texte: `Souvenir : ${x.texte}`, classe: 'souvenir' };
    case 'promesse':
      return { texte: `Promesse : ${x.texte}`, classe: 'promesse' };
    case 'attribut':
      return { texte: `${x.delta > 0 ? '+' : ''}${x.delta} ${ATTRIBUT_LIBELLE[x.id as AttributId] ?? x.id}`, classe: x.delta > 0 ? 'gain' : 'perte' };
    case 'ryo':
      return { texte: `${x.delta > 0 ? '+' : ''}${x.delta} ryō`, classe: x.delta > 0 ? 'gain' : 'perte' };
    case 'reputation':
      return { texte: x.delta > 0 ? 'Ta réputation grandit.' : 'Ta réputation en souffre.', classe: x.delta > 0 ? 'gain' : 'perte' };
    case 'blessure':
      return { texte: `Blessure : ${x.nom}`, classe: 'perte' };
    case 'eveil':
      return { texte: `Éveil : ${x.nom}`, classe: 'souvenir' };
  }
}

function Presence({ vue }: { vue: VuePageCommune }) {
  return (
    <ul className="page-presence" aria-label="Où en est chacun">
      {vue.joueurs.map((p) => {
        const etat = !p.present
          ? 'absent'
          : vue.etape === 'reactions'
            ? p.aChoisi
              ? 'a choisi'
              : 'choisit…'
            : vue.decision && !vue.decision.prise
              ? vue.decision.proposition?.par === p.j
                ? 'a proposé'
                : 'réfléchit…'
              : p.aLu
                ? 'prêt'
                : 'lit…';
        const fait = ['a choisi', 'prêt', 'a proposé'].includes(etat);
        return (
          <li key={p.j} className={`joueur-${p.j}${fait ? ' fait' : ''}`}>
            <span className="page-sceau" aria-hidden="true">
              {p.prenom.charAt(0)}
            </span>
            <span>
              <strong>{p.prenom}</strong>
              <small>{etat}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** La carte d'un joueur : repliée par défaut, pour que l'autre ne voie ni sa pensée ni ses choix. */
function CarteJoueur({ p, autre, ouverte, distante, onOuvrir, onFermer, onChoisir }: { p: VueJoueurPage; autre: string; ouverte: boolean; distante?: boolean; onOuvrir: () => void; onFermer: () => void; onChoisir: (id: string) => void }) {
  if (!p.present) return null;
  if (p.aChoisi)
    return (
      <div className={`page-carte joueur-${p.j} faite`}>
        <span className="page-carte-coche" aria-hidden="true">
          ✓
        </span>
        <p>
          <strong>{p.prenom}</strong> a choisi, en secret.
        </p>
      </div>
    );
  if (distante)
    return (
      <div className={`page-carte joueur-${p.j}`}>
        <p>
          <strong>{p.prenom}</strong> choisit, sur son téléphone…
        </p>
      </div>
    );
  if (!ouverte)
    return (
      <div className={`page-carte joueur-${p.j}`}>
        <p>
          <strong>{p.prenom}</strong>, à toi de choisir.
        </p>
        <button className="btn-secondaire" onClick={onOuvrir}>
          Afficher mes choix
          <small>{autre}, détourne les yeux</small>
        </button>
      </div>
    );
  return (
    <div className={`page-carte joueur-${p.j} ouverte`}>
      <p className="page-carte-tete">
        <strong>{p.prenom}</strong> · pour toi seul
        <button className="page-cacher" onClick={onFermer}>
          Cacher
        </button>
      </p>
      {p.pensee && (
        <div className="page-pensee">
          <Paragraphes texte={p.pensee} />
        </div>
      )}
      <ol className="choix-liste" aria-label={`Choix de ${p.prenom}`}>
        {p.choix?.map((ch) => (
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
    </div>
  );
}

/** La décision commune : chaque option porte un bouton par joueur. Toucher propose ; toucher la proposition de l'autre l'accepte. */
function Decision({ vue, siege, onDecider }: { vue: VuePageCommune; siege?: IdJoueur; onDecider: (j: IdJoueur, id: string, version: number) => void }) {
  const d = vue.decision!;
  if (d.prise)
    return (
      <section className="page-decision prise">
        <p className="page-decision-tete">Décidé ensemble</p>
        <p className="page-decision-choix">{d.prise.libelle}</p>
        <Paragraphes texte={d.prise.texte} />
      </section>
    );
  const prop = d.proposition;
  // Sur deux appareils, chacun n'a que son bouton ; sur un seul, les deux sont là.
  const presents = vue.joueurs.filter((p) => p.present && (siege === undefined || p.j === siege));
  return (
    <section className="page-decision">
      <p className="page-decision-tete">Décision commune</p>
      <p className="page-decision-question">{d.question}</p>
      <p className="page-decision-aide">
        {prop
          ? `${vue.joueurs[prop.par].prenom} propose. ${vue.joueurs[1 - prop.par].prenom} accepte en touchant la même option, ou propose autre chose.`
          : 'Parlez-en, puis l’un de vous propose : l’autre accepte en touchant la même option.'}
      </p>
      <ul className="page-options">
        {d.choix.map((o) => {
          const proposee = prop?.choix === o.id;
          return (
            <li key={o.id} className={proposee ? 'proposee' : undefined}>
              <span className="page-option-texte">{o.texte}</span>
              <span className="page-option-boutons">
                {presents.map((p) => {
                  const sienne = proposee && prop!.par === p.j;
                  const accepter = proposee && prop!.par !== p.j;
                  return (
                    <button
                      key={p.j}
                      className={`page-vote joueur-${p.j}${sienne ? ' sienne' : ''}${accepter ? ' accepter' : ''}`}
                      disabled={sienne}
                      aria-pressed={sienne}
                      onClick={() => onDecider(p.j, o.id, d.version)}
                    >
                      {sienne ? `${p.prenom} propose` : accepter ? `${p.prenom} : accepter` : p.prenom}
                    </button>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function PageCommune({
  c,
  vue,
  onChoisir,
  onDecider,
  onLire,
  siege,
}: {
  /** Sur deux appareils : le joueur de cet appareil (on ne montre que sa carte et ses boutons). */
  siege?: IdJoueur;
  c: Campagne;
  vue: VuePageCommune;
  onChoisir: (j: IdJoueur, id: string) => void;
  onDecider: (j: IdJoueur, id: string, version: number) => void;
  onLire: (j: IdJoueur) => void;
}) {
  const [ouverte, setOuverte] = useState<IdJoueur | null>(null);
  const [vus, setVus] = useState<[boolean, boolean]>([false, false]);
  const nom = (j: IdJoueur) => vue.joueurs[j].prenom;
  const enAttente = !!vue.decision && !vue.decision.prise;
  return (
    <div className="recit" key={vue.id + vue.etape}>
      <Decor c={c} j={0} />
      <article className="recit-texte scene-commune page-commune">
        <p className="commune-etiquette">Scène commune · sur la même page</p>
        <Presence vue={vue} />
        <h1 className="titre-scene">{vue.titre}</h1>

        {vue.etape === 'reactions' ? (
          <>
            {vue.texte && <Paragraphes texte={vue.texte} />}
            <div className="page-cartes">
              {vue.joueurs.map((p) => (
                <CarteJoueur
                  key={p.j}
                  p={p}
                  autre={nom((1 - p.j) as IdJoueur)}
                  ouverte={siege !== undefined ? p.j === siege : ouverte === p.j}
                  distante={siege !== undefined && p.j !== siege}
                  onOuvrir={() => setOuverte(p.j)}
                  onFermer={() => setOuverte(null)}
                  onChoisir={(id) => {
                    setOuverte(null);
                    onChoisir(p.j, id);
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {!!vue.resultat!.libelles[0] && (
              <ul className="commune-choix">
                {vue.joueurs.map((p) => (
                  <li key={p.j} className={`joueur-${p.j}`}>
                    <b>{p.prenom}</b> {vue.resultat!.libelles[p.j]}
                  </li>
                ))}
              </ul>
            )}
            <Paragraphes texte={vue.resultat!.texte} />
            {vue.decision && <Decision vue={vue} siege={siege} onDecider={onDecider} />}
            {!enAttente && (
              <div className="page-bilans">
                {vue.joueurs
                  .filter((p) => p.present && (siege === undefined || p.j === siege))
                  .map((p) => (
                    <details key={p.j} className={`page-bilan joueur-${p.j}`} open={vus[p.j]} onToggle={(e) => setVus((v) => (p.j === 0 ? [(e.target as HTMLDetailsElement).open, v[1]] : [v[0], (e.target as HTMLDetailsElement).open]))}>
                      <summary>Ce qui a changé pour {p.prenom}</summary>
                      {p.changements.length ? (
                        <ul>
                          {p.changements.map((x, i) => {
                            const l = libelleChangement(x, nom((1 - p.j) as IdJoueur));
                            return (
                              <li key={i} className={`chg-${l.classe}`}>
                                {l.texte}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p>Rien qui se voie. Pas encore.</p>
                      )}
                    </details>
                  ))}
              </div>
            )}
            <div className="page-pret">
              {vue.joueurs
                .filter((p) => p.present && (siege === undefined || p.j === siege))
                .map((p) => (
                  <button key={p.j} className={p.aLu ? 'btn-secondaire fait' : 'btn-principal'} disabled={p.aLu || enAttente} onClick={() => onLire(p.j)}>
                    {p.aLu ? `${p.prenom} ✓ prêt` : `${p.prenom} : continuer`}
                  </button>
                ))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
