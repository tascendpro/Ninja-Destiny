'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AttributId, Creation as CreationT, Difficulte, ElementId, Presentation, VillageId } from '../engine/types';
import { R } from '../engine/registre';
import { APTITUDES, CHANCE_JINCHURIKI, CHANCE_PRODIGE, validerCreation } from '../engine/moteur';
import { nomDeFamille } from '../engine/etat';
import { accorder } from '../engine/texte';
import { ATTRIBUT_LIBELLE } from './libelles';

const ETAPES = ['Identité', 'Village', 'Clan', 'Affinité', 'Personnalité', 'Destin', 'Récapitulatif'];

const INTROS = [
  'Ton prénom est la seule chose que tu choisis vraiment. Le reste, tu en hériteras.',
  'Le village décide de ta langue, de tes ennemis et des natures qu’on t’enseignera.',
  'Le clan te donne ton nom de famille, tes pouvoirs et tes chaînes. Sans clan, tu n’as que ton prénom.',
  'L’affinité innée : la nature de chakra qui te viendra le plus facilement. D’autres s’apprendront plus tard, plus lentement.',
  'Deux traits de caractère et une aptitude naturelle. Les dons hors norme, eux, ne se choisissent pas.',
  'Ce que tu poursuis, et la dureté du monde qui t’attend.',
  'Vérifie une dernière fois. Ensuite, le destin tire ses dés.',
];

const DIFFICULTES: { id: Difficulte; nom: string; texte: string }[] = [
  { id: 'recit', nom: 'Récit', texte: 'Les épreuves sont plus clémentes, les blessures guérissent plus vite. Pour découvrir l’histoire.' },
  { id: 'shinobi', nom: 'Shinobi', texte: 'L’équilibre voulu : chaque risque compte, sans être injuste.' },
  { id: 'legende', nom: 'Légende', texte: 'Épreuves plus dures, blessures plus lourdes, valeurs chiffrées masquées.' },
];

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

export default function Creation({ onCommencer, onRetour, heritage }: { onCommencer: (c: CreationT) => void; onRetour: () => void; heritage?: string }) {
  const [etape, setEtape] = useState(0);
  const [c, setC] = useState<CreationT>({
    prenom: '',
    presentation: 'feminin',
    ageDepart: 6,
    village: 'konoha',
    clan: '',
    element: 'katon',
    traits: [],
    aptitude: 'perception',
    objectif: '',
    difficulte: 'shinobi',
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
  const basculerTrait = (id: string) => {
    if (c.traits.includes(id)) maj({ traits: c.traits.filter((t) => t !== id) });
    else if (normaux.length < 2) maj({ traits: [...c.traits, id] });
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
    !!c.objectif && !!c.difficulte,
    validerCreation(c).length === 0,
  ];
  const erreurs = etape === 6 ? validerCreation(c) : [];

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
        {ETAPES[etape]}
      </h1>
      <p className="intro">{INTROS[etape]}</p>

      {etape === 0 && (
        <section>
          <div className="champ">
            <label htmlFor="prenom">Prénom</label>
            <div className="rangee">
              <input id="prenom" value={c.prenom} maxLength={24} autoComplete="off" onChange={(e) => maj({ prenom: e.target.value })} style={{ flex: '1 1 12rem' }} />
              <button className="btn-secondaire" onClick={tirerPrenom}>
                Proposer un prénom
              </button>
            </div>
          </div>
          <div className="champ">
            <span>Présentation</span>
            <div className="segments" role="group" aria-label="Présentation">
              {(
                [
                  ['feminin', 'Féminine'],
                  ['masculin', 'Masculine'],
                  ['neutre', 'Neutre'],
                ] as [Presentation, string][]
              ).map(([id, n]) => (
                <button key={id} aria-pressed={c.presentation === id} onClick={() => maj({ presentation: id })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="champ">
            <span>Âge de départ</span>
            <div className="options deux">
              <button className="option" aria-pressed={c.ageDepart === 6} onClick={() => maj({ ageDepart: 6 })}>
                <strong>6 ans</strong>
                <p>L’enfance complète : le premier jour, le clan, l’entrée à l’Académie.</p>
              </button>
              <button className="option" aria-pressed={c.ageDepart === 10} onClick={() => maj({ ageDepart: 10 })}>
                <strong>10 ans</strong>
                <p>La dernière ligne droite de l’Académie. L’enfance est résumée en un souvenir.</p>
              </button>
            </div>
          </div>
        </section>
      )}

      {etape === 1 && (
        <section>
          <div className="choix-grille cinq">
            {R.contenu.villages.map((v) => (
              <button key={v.id} className="tuile" aria-pressed={c.village === v.id} onClick={() => choisirVillage(v.id)}>
                <span className="kanji" aria-hidden="true">
                  {v.kanji}
                </span>
                <strong>{v.nom}</strong>
                <small>{v.pays}</small>
              </button>
            ))}
          </div>
          <div className="detail-choix">
            <h2>{village.nomComplet}</h2>
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
                <dd>{village.naturesEnseignees.map((e) => R.elements[e].nom).join(', ')}</dd>
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

      {etape === 2 && (
        <section>
          <div className="choix-grille">
            {clansVillage.map((k) => (
              <button key={k.id} className="tuile" aria-pressed={c.clan === k.id} onClick={() => choisirClan(k.id)}>
                <strong>{k.nom}</strong>
                <small>{k.id === 'sans_clan' ? 'Aucun nom de famille' : k.rarete === 'commun' ? 'Lignée connue' : k.rarete === 'rare' ? 'Lignée rare' : 'Lignée très rare'}</small>
              </button>
            ))}
          </div>
          {clan ? (
            <div className="detail-choix">
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

      {etape === 3 && (
        <section>
          <div className="choix-grille cinq">
            {R.contenu.elements.map((e) => {
              const interdit = !!clan?.elementsRequis && !clan.elementsRequis.includes(e.id);
              const lignee = clan?.elementsConseilles?.includes(e.id) || clan?.elementsRequis?.includes(e.id);
              const enseignee = village.naturesEnseignees.includes(e.id);
              return (
                <button key={e.id} className="tuile" aria-pressed={c.element === e.id} disabled={interdit} onClick={() => maj({ element: e.id as ElementId })}>
                  <span className="kanji" aria-hidden="true">
                    {e.kanji}
                  </span>
                  <strong>{e.nom.split(' ')[0]}</strong>
                  <small>{interdit ? 'Incompatible' : lignee ? 'Affinité de ta lignée' : enseignee ? `Enseignée à ${village.nom}` : e.nom.split(' ')[1]?.replace(/[()]/g, '')}</small>
                </button>
              );
            })}
          </div>
          <div className="detail-choix">
            <h2>
              {R.elements[c.element].kanji} {R.elements[c.element].nom}
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

      {etape === 4 && (
        <section>
          <p className="sous-titre" style={{ marginBottom: 10 }}>
            Choisis deux traits ({normaux.length}/2).
          </p>
          <div className="options trois">
            {R.contenu.traits
              .filter((t) => !t.special)
              .map((t) => (
                <button key={t.id} className="option" aria-pressed={c.traits.includes(t.id)} disabled={!c.traits.includes(t.id) && normaux.length >= 2} onClick={() => basculerTrait(t.id)}>
                  <strong>{accorder(t.nom, P)}</strong>
                  <p>{accorder(t.description, P)}</p>
                </button>
              ))}
          </div>
          <div className="champ" style={{ marginTop: 22 }}>
            <span>Aptitude naturelle</span>
            <div className="segments" role="group" aria-label="Aptitude naturelle">
              {APTITUDES.map((a) => (
                <button key={a} aria-pressed={c.aptitude === a} onClick={() => maj({ aptitude: a as AttributId })}>
                  {ATTRIBUT_LIBELLE[a]}
                </button>
              ))}
            </div>
            <small className="sous-titre">Elle oriente vers certains métiers sans en imposer aucun.</small>
          </div>
          <div className="destin-note">
            <strong>Ce qui ne se choisit pas.</strong> À ta naissance, le destin décide seul : un talent de prodige (environ {pourcent(CHANCE_PRODIGE)} des enfants), une bête à queues scellée en
            toi (environ {pourcent(CHANCE_JINCHURIKI)} pour un enfant de clan, bien plus pour un enfant sans nom : le village choisit ceux qu’il ne regrettera pas), ou une lignée de fusion propre à certains villages. Tu le découvriras en chemin, ou jamais.
          </div>
        </section>
      )}

      {etape === 5 && (
        <section>
          <div className="options deux">
            {R.contenu.objectifs.map((o) => (
              <button key={o.id} className="option" aria-pressed={c.objectif === o.id} onClick={() => maj({ objectif: o.id })}>
                <strong>{o.nom}</strong>
                <p>{accorder(o.description, P)}</p>
              </button>
            ))}
          </div>
          <div className="groupe">
            <h3>Difficulté</h3>
            <div className="options trois" style={{ marginTop: 10 }}>
              {DIFFICULTES.map((d) => (
                <button key={d.id} className="option" aria-pressed={c.difficulte === d.id} onClick={() => maj({ difficulte: d.id })}>
                  <strong>{d.nom}</strong>
                  <p>{d.texte}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {etape === 6 && (
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
                {c.ageDepart} ans, difficulté {DIFFICULTES.find((d) => d.id === c.difficulte)?.nom}
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
          <button className="btn-principal" disabled={!valide[etape]} onClick={() => setEtape(etape + 1)}>
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
