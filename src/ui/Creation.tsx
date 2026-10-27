'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AttributId, Creation as CreationT, ElementId, Presentation, VillageId } from '../engine/types';
import { R } from '../engine/registre';
import { APTITUDES, CHANCE_JINCHURIKI, CHANCE_PRODIGE, validerCreation } from '../engine/moteur';
import { nomDeFamille } from '../engine/etat';
import { accorder } from '../engine/texte';
import { ATTRIBUT_LIBELLE } from './libelles';

const ETAPES = ['Identité', 'Village', 'Clan', 'Affinité', 'Personnalité', 'Destin', 'Récapitulatif'];
/** L'ordre de présentation : le village, puis le clan (qui donne le nom de famille), et seulement ensuite le prénom. */
const ORDRE = [1, 2, 0, 3, 4, 5, 6];

const INTROS = [
  'Ton prénom est la seule chose que tu choisis vraiment. Le reste, tu en as déjà hérité.',
  'Le village décide de ta langue, de tes ennemis et des natures qu’on t’enseignera.',
  'Le clan te donne ton nom de famille, tes pouvoirs et tes chaînes. Sans clan, tu n’as que ton prénom.',
  'L’affinité innée : la nature de chakra qui te viendra le plus facilement. D’autres s’apprendront plus tard, plus lentement.',
  'Deux traits de caractère : chacun renforce tes aptitudes, et ton point fort en découle. Les dons hors norme, eux, ne se choisissent pas.',
  'Ce que tu poursuis. Le monde, lui, ne te fera pas de cadeau.',
  'Vérifie une dernière fois. Ensuite, le destin tire ses dés.',
];

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

export default function Creation({ onCommencer, onRetour, heritage }: { onCommencer: (c: CreationT) => void; onRetour: () => void; heritage?: string }) {
  const [etape, setEtape] = useState(0);
  const [c, setC] = useState<CreationT>({
    prenom: '',
    presentation: 'masculin',
    ageDepart: 6,
    village: 'konoha',
    clan: '',
    element: 'katon',
    traits: [],
    aptitude: 'perception',
    objectif: '',
    // Une seule difficulté : la Légende. Le monde ne fait pas de cadeau.
    difficulte: 'legende',
  });
  const maj = (p: Partial<CreationT>) => setC((x) => ({ ...x, ...p }));
  const P = c.presentation;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etape]);

  const village = R.villages[c.village];
  const clan = R.clans[c.clan];
  const clansVillage = useMemo(() => R.contenu.clans.filter((k) => k.villages.includes(c.village)), [c.village]);
  const normaux = c.traits.filter((t) => !R.traits[t]?.special);
  const nom = c.clan ? nomDeFamille(c.clan) : '';
  const nomAffiche = [c.prenom.trim() || 'Ton prénom', nom].filter(Boolean).join(' ');

  const choisirVillage = (v: VillageId) => {
    const garderClan = R.clans[c.clan]?.villages.includes(v);
    maj({ village: v, clan: garderClan ? c.clan : '', origine: garderClan ? c.origine : undefined });
  };
  const choisirClan = (id: string) => {
    const k = R.clans[id];
    const element = k.elementsRequis && !k.elementsRequis.includes(c.element) ? k.elementsRequis[0] : c.element;
    maj({ clan: id, element, origine: id === 'sans_clan' ? (c.origine ?? 'famille') : undefined });
  };
  // L'aptitude naturelle ne se choisit plus : c'est l'attribut que les deux traits renforcent le plus.
  const aptitudeDe = (traits: string[]): AttributId => {
    let meilleur: AttributId | undefined;
    let max = 0;
    for (const a of APTITUDES as AttributId[]) {
      const total = traits.reduce((n, t) => n + (R.traits[t]?.bonus[a] ?? 0), 0);
      if (total > max) {
        max = total;
        meilleur = a;
      }
    }
    return meilleur ?? c.aptitude;
  };
  const basculerTrait = (id: string) => {
    const traits = c.traits.includes(id) ? c.traits.filter((t) => t !== id) : normaux.length < 2 ? [...c.traits, id] : c.traits;
    maj({ traits, aptitude: aptitudeDe(traits) });
  };
  const tirerPrenom = () => {
    const pool = R.contenu.noms[c.village];
    const liste = c.presentation === 'masculin' ? pool.m : c.presentation === 'feminin' ? pool.f : [...pool.m, ...pool.f];
    maj({ prenom: liste[Math.floor(Math.random() * liste.length)] });
  };

  const valide = [
    c.prenom.trim().length > 0,
    !!c.village,
    !!c.clan,
    !!c.element && (!clan?.elementsRequis || clan.elementsRequis.includes(c.element)),
    normaux.length === 2 && !!c.aptitude,
    !!c.objectif,
    validerCreation(c).length === 0,
  ];
  // La position dans le parcours (etape) et le contenu affiché (k) : voir ORDRE.
  const k = ORDRE[etape];
  const erreurs = k === 6 ? validerCreation(c) : [];
  // Dès qu'un village est choisi, toute la création prend sa couleur.
  useEffect(() => {
    document.documentElement.dataset.village = c.village;
  }, [c.village]);

  return (
    <main className="creation">
      <div className="etapes" aria-hidden="true">
        {ETAPES.map((e, i) => (
          <i key={e} className={i <= etape ? 'fait' : ''} />
        ))}
      </div>
      <p className="sous-titre">
        Étape {etape + 1} sur {ETAPES.length}
      </p>
      <h1 className="titre-ecran" style={{ marginTop: 6 }}>
        {ETAPES[k]}
      </h1>
      <p className="intro">{INTROS[k]}</p>

      {k === 0 && (
        <section>
          <div className="champ">
            <label htmlFor="prenom">Prénom</label>
            <div className="rangee">
              <input id="prenom" value={c.prenom} maxLength={24} autoComplete="off" onChange={(e) => maj({ prenom: e.target.value })} style={{ flex: '1 1 12rem' }} />
              <button className="btn-secondaire" onClick={tirerPrenom}>
                Proposer un prénom
              </button>
            </div>
            <p className="apercu-nom identite-nom">
              {c.clan === 'sans_clan' ? 'Sans clan, tu n’auras que ton prénom :' : 'Ton nom complet :'}
              <strong>{nomAffiche}</strong>
            </p>
          </div>
          <div className="champ">
            <span>Présentation</span>
            <div className="identite-choix" role="group" aria-label="Présentation">
              {(
                [
                  ['masculin', 'Masculin', '男', 'Il'],
                  ['feminin', 'Féminin', '女', 'Elle'],
                  ['neutre', 'Neutre', '人', 'Iel'],
                ] as [Presentation, string, string, string][]
              ).map(([id, n, k, pronom]) => (
                <button key={id} className="identite-carte" aria-pressed={c.presentation === id} onClick={() => maj({ presentation: id })}>
                  <span className="identite-kanji" aria-hidden="true">
                    {k}
                  </span>
                  <strong>{n}</strong>
                  <small>{pronom}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="champ">
            <span>Âge de départ</span>
            <div className="options deux">
              <button className="option age-carte" aria-pressed={c.ageDepart === 6} onClick={() => maj({ ageDepart: 6 })}>
                <span className="age-chiffre">6</span>
                <span>
                  <strong>ans</strong>
                  <p>L’enfance complète : le premier jour, le clan, l’entrée à l’Académie.</p>
                </span>
              </button>
              <button className="option age-carte" aria-pressed={c.ageDepart === 10} onClick={() => maj({ ageDepart: 10 })}>
                <span className="age-chiffre">10</span>
                <span>
                  <strong>ans</strong>
                  <p>La dernière ligne droite de l’Académie. L’enfance est résumée en un souvenir.</p>
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {k === 1 && (
        <section>
          <div className="choix-grille cinq">
            {R.contenu.villages.map((v) => (
              <button key={v.id} className="tuile tuile-couleur" style={{ '--c': `var(--v-${v.id})` } as React.CSSProperties} aria-pressed={c.village === v.id} onClick={() => choisirVillage(v.id)}>
                <span className="kanji" aria-hidden="true">
                  {v.kanji}
                </span>
                <strong>{v.nom}</strong>
                <small>{v.pays}</small>
              </button>
            ))}
          </div>
          <div className="detail-choix detail-couleur" style={{ '--c': `var(--v-${village.id})` } as React.CSSProperties}>
            <h2>
              <span className="detail-kanji" aria-hidden="true">
                {village.kanji}
              </span>
              {village.nomComplet.charAt(0).toUpperCase() + village.nomComplet.slice(1)}
            </h2>
            <p>{village.philosophie}</p>
            <dl>
              <div>
                <dt>Situation</dt>
                <dd>{village.situation}</dd>
              </div>
              <div>
                <dt>Gouverné par</dt>
                <dd>
                  {village.kageNom}, {village.kage}
                </dd>
              </div>
              <div>
                <dt>Natures enseignées</dt>
                <dd className="pastilles-natures">
                  {village.naturesEnseignees.map((e) => (
                    <span key={e} className="pastille-nature" style={{ '--c': `var(--n-${e})` } as React.CSSProperties}>
                      {R.elements[e].kanji} {R.elements[e].nom.split(' ')[0]}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Atouts</dt>
                <dd>{village.avantages.join(', ')}.</dd>
              </div>
              <div>
                <dt>Contraintes</dt>
                <dd>{village.contraintes.join(', ')}.</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {k === 2 && (
        <section>
          <div className="choix-grille">
            {clansVillage.map((k) => (
              <button key={k.id} className="tuile tuile-couleur" style={{ '--c': `var(--v-${c.village})` } as React.CSSProperties} aria-pressed={c.clan === k.id} onClick={() => choisirClan(k.id)}>
                <strong>{k.nom}</strong>
                <small>{k.id === 'sans_clan' ? 'Aucun nom de famille' : k.rarete === 'commun' ? 'Lignée connue' : k.rarete === 'rare' ? 'Lignée rare' : 'Lignée très rare'}</small>
              </button>
            ))}
          </div>
          {clan ? (
            <div className="detail-choix detail-couleur" style={{ '--c': `var(--v-${c.village})` } as React.CSSProperties}>
              <h2>{clan.nom}</h2>
              <p>{accorder(clan.histoire, P)}</p>
              {clan.licence === 'originale' && <span className="etiquette">Propre à cette chronologie</span>}
              <dl>
                <div>
                  <dt>Atouts</dt>
                  <dd>{clan.avantages.join(' ; ')}.</dd>
                </div>
                <div>
                  <dt>Faiblesses</dt>
                  <dd>{clan.faiblesses.join(' ; ')}.</dd>
                </div>
                <div>
                  <dt>Contrepartie</dt>
                  <dd>{accorder(clan.contreparties, P)}</dd>
                </div>
              </dl>
              {c.clan === 'sans_clan' && (
                <div className="champ" style={{ marginTop: 16, marginBottom: 0 }}>
                  <span>Ton origine</span>
                  <div className="options deux">
                    <button className="option" aria-pressed={c.origine !== 'orphelin'} onClick={() => maj({ origine: 'famille' })}>
                      <strong>Enfant du commun</strong>
                      <p>Un parent qui travaille dur, un aîné, une petite boutique. Personne n’a jamais été ninja chez toi.</p>
                    </button>
                    <button className="option" aria-pressed={c.origine === 'orphelin'} onClick={() => maj({ origine: 'orphelin' })}>
                      <strong>{accorder('Orphelin·e', P)}</strong>
                      <p>{accorder('Élevé·e à l’orphelinat du village, par un tuteur bourru et un aîné de cœur. Tu ne sais rien de tes parents.', P)}</p>
                    </button>
                  </div>
                </div>
              )}
              <p className="apercu-nom">
                {c.clan === 'sans_clan' ? 'Sans clan, tu n’auras que ton prénom :' : 'Tu porteras le nom de ton clan :'}
                <strong>{nomAffiche}</strong>
              </p>
            </div>
          ) : (
            <p className="sous-titre" style={{ marginTop: 14 }}>
              Choisis un clan pour voir son histoire.
            </p>
          )}
        </section>
      )}

      {k === 3 && (
        <section>
          <div className="choix-grille cinq">
            {R.contenu.elements.map((e) => {
              const interdit = !!clan?.elementsRequis && !clan.elementsRequis.includes(e.id);
              const lignee = clan?.elementsConseilles?.includes(e.id) || clan?.elementsRequis?.includes(e.id);
              const enseignee = village.naturesEnseignees.includes(e.id);
              return (
                <button
                  key={e.id}
                  className="tuile tuile-couleur"
                  style={{ '--c': `var(--n-${e.id})` } as React.CSSProperties}
                  aria-pressed={c.element === e.id}
                  disabled={interdit}
                  onClick={() => maj({ element: e.id as ElementId })}
                >
                  <span className="kanji" aria-hidden="true">
                    {e.kanji}
                  </span>
                  <strong>{e.nom.split(' ')[0]}</strong>
                  <small>{interdit ? 'Incompatible' : lignee ? 'Affinité de ta lignée' : enseignee ? `Enseignée à ${village.nom}` : e.nom.split(' ')[1]?.replace(/[()]/g, '')}</small>
                </button>
              );
            })}
          </div>
          <div className="detail-choix detail-couleur" style={{ '--c': `var(--n-${c.element})` } as React.CSSProperties}>
            <h2>
              <span className="detail-kanji" aria-hidden="true">
                {R.elements[c.element].kanji}
              </span>
              {R.elements[c.element].nom}
            </h2>
            <p>{R.elements[c.element].description}</p>
            <dl>
              <div>
                <dt>Forces et faiblesses</dt>
                <dd>
                  Fort contre {R.elements[R.elements[c.element].fortContre].nom}, faible contre {R.elements[R.elements[c.element].faibleContre].nom}.
                </dd>
              </div>
              <div>
                <dt>Plus tard</dt>
                <dd>
                  {accorder(
                    `Genin à 12 ans, tu pourras apprendre une deuxième nature ; chūnin, une troisième. Celles qu’on enseigne à ${village.nom} (${village.naturesEnseignees
                      .map((e) => R.elements[e].nom.split(' ')[0])
                      .join(', ')}) s’apprennent plus vite.`,
                    P,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {k === 4 && (
        <section>
          <p className="sous-titre" style={{ marginBottom: 10 }}>
            Choisis deux traits ({normaux.length}/2).
          </p>
          <div className="options trois">
            {R.contenu.traits
              .filter((t) => !t.special)
              .map((t) => (
                <button key={t.id} className="option trait-carte" aria-pressed={c.traits.includes(t.id)} disabled={!c.traits.includes(t.id) && normaux.length >= 2} onClick={() => basculerTrait(t.id)}>
                  <strong>{accorder(t.nom, P)}</strong>
                  <span className="trait-gains">
                    {Object.entries(t.bonus).map(([a, v]) => (
                      <span key={a} className={`trait-gain${(v ?? 0) < 0 ? ' perte' : ''}`}>
                        {(v ?? 0) > 0 ? '+' : ''}
                        {v} {ATTRIBUT_LIBELLE[a as AttributId]}
                      </span>
                    ))}
                    {Object.entries(t.social ?? {}).map(([a, v]) => (
                      <span key={a} className="trait-gain">
                        +{v} {a === 'loyaute' ? 'loyauté' : a}
                      </span>
                    ))}
                    {Object.entries(t.ethique ?? {}).map(([a, v]) => (
                      <span key={a} className="trait-gain">
                        +{v} {a}
                      </span>
                    ))}
                  </span>
                  <p>{accorder(t.description, P)}</p>
                </button>
              ))}
          </div>
          {normaux.length === 2 && (
            <p className="point-fort">
              Ton point fort : <strong>{ATTRIBUT_LIBELLE[c.aptitude]} (+20)</strong>. Il découle de tes deux traits, et oriente vers certains métiers sans en imposer aucun.
            </p>
          )}
          <div className="destin-note">
            <strong>Ce qui ne se choisit pas.</strong> À ta naissance, le destin décide seul : un talent de prodige (environ {pourcent(CHANCE_PRODIGE)} des enfants), une bête à queues scellée en
            toi (environ {pourcent(CHANCE_JINCHURIKI)} pour un enfant de clan, bien plus pour un enfant sans nom : le village choisit ceux qu’il ne regrettera pas), ou une lignée de fusion propre à certains villages. Tu le découvriras en chemin, ou jamais.
          </div>
        </section>
      )}

      {k === 5 && (
        <section>
          <div className="options deux">
            {R.contenu.objectifs.map((o) => (
              <button key={o.id} className="option" aria-pressed={c.objectif === o.id} onClick={() => maj({ objectif: o.id })}>
                <strong>{o.nom}</strong>
                <p>{accorder(o.description, P)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {k === 6 && (
        <section className="detail-choix">
          <h2>{nomAffiche}</h2>
          <dl className="recap">
            <div>
              <dt>Village</dt>
              <dd>
                {village.nomComplet}, {village.pays}
              </dd>
            </div>
            <div>
              <dt>Origine</dt>
              <dd>{c.clan === 'sans_clan' ? accorder(c.origine === 'orphelin' ? 'Orphelin·e, sans clan' : 'Enfant du commun, sans clan', P) : `Clan ${clan?.nom}`}</dd>
            </div>
            <div>
              <dt>Affinité</dt>
              <dd>{R.elements[c.element]?.nom}</dd>
            </div>
            <div>
              <dt>Traits</dt>
              <dd>{c.traits.map((t) => accorder(R.traits[t]?.nom ?? t, P)).join(', ')}</dd>
            </div>
            <div>
              <dt>Aptitude</dt>
              <dd>{ATTRIBUT_LIBELLE[c.aptitude]}</dd>
            </div>
            <div>
              <dt>Objectif</dt>
              <dd>{R.objectifs[c.objectif]?.nom}</dd>
            </div>
            {heritage && (
              <div>
                <dt>Héritage</dt>
                <dd>
                  {R.contenu.heritages.find((h) => h.id === heritage)?.nom} <span className="sous-titre">(acheté à la boutique)</span>
                </dd>
              </div>
            )}
            <div>
              <dt>Départ</dt>
              <dd>
                {c.ageDepart} ans
              </dd>
            </div>
          </dl>
          {erreurs.length > 0 && (
            <ul className="erreurs">
              {erreurs.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="creation-barre">
        <button className="btn-secondaire" onClick={() => (etape === 0 ? onRetour() : setEtape(etape - 1))}>
          {etape === 0 ? 'Retour' : 'Précédent'}
        </button>
        {etape < 6 ? (
          <button className="btn-principal" disabled={!valide[k]} onClick={() => setEtape(etape + 1)}>
            Suivant
          </button>
        ) : (
          <button className="btn-principal" disabled={!valide[6]} onClick={() => onCommencer(c)}>
            Entrer dans l’histoire
          </button>
        )}
      </div>
    </main>
  );
}
