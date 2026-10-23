'use client';

import { useState } from 'react';
import type { AttributId, GameState, MasteryState, Presentation, SocialId } from '../engine/types';
import { ATTRIBUTS, STATUTS_ARME_UTILISABLES } from '../engine/types';
import { R } from '../engine/registre';
import { age, libelleDuree } from '../engine/calendrier';
import { accorder } from '../engine/texte';
import { defPnj, estOrphelin, estProdige, nomComplet } from '../engine/etat';
import { blocagePalier, exigence, maxTierForAge, porteurJoueur } from '../engine/maitrise';
import { getWeaponModifiers, idFamille } from '../engine/armes';
import { checkCareerEligibility, nomPalierMetier } from '../engine/metiers';
import { noteFinale } from '../engine/fins';
import { naturesMax } from '../engine/tempsLibre';
import Portrait from './Portrait';
import { ATTRIBUT_LIBELLE, ETAT_PNJ, RANG_LIBELLE, SOCIAL_LIBELLE, STATUT_ARME, STATUT_LIBELLE } from './libelles';
import Repartition from './Repartition';
import { KANJI_GROUPE, groupeTechnique, libelleGroupe } from './combat/GroupesNature';
import { classeMulti, styleNatures } from './natures';
import { naturesMaitrise } from '../engine/tempsLibre';
import { databook, gravite, noteTexte, qualificatif } from './fiche';

const RARETE: Record<string, string> = { commune: 'Commune', qualite: 'De qualité', maitre: 'De maître', legendaire: 'Légendaire', maudite: 'Maudite' };

const ONGLETS = ['Profil', 'Techniques', 'Maîtrise', 'Arsenal', 'Métier', 'Relations', 'Missions', 'Décisions'] as const;
type Onglet = (typeof ONGLETS)[number];

function Piste({ valeur, max = 100, classe = 'c-neutre' }: { valeur: number; max?: number; classe?: string }) {
  return (
    <span className={`piste ${classe}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, (valeur / max) * 100))}%` }} />
    </span>
  );
}

function Jauge({ nom, valeur, max = 100, classe, detail, masquer = false }: { nom: string; valeur: number; max?: number; classe?: string; detail?: string; masquer?: boolean }) {
  return (
    <div className="jauge">
      <span>{nom}</span>
      <span className="val">
        {masquer ? '' : Math.round(valeur)}
        {detail && <small>{detail}</small>}
      </span>
      <Piste valeur={valeur} max={max} classe={classe} />
    </div>
  );
}

export default function Tableau({
  etat,
  enTempsLibre,
  onEquiper,
  onOuvrirPoints,
}: {
  etat: GameState;
  enTempsLibre: boolean;
  onEquiper: (id: string) => void;
  onOuvrirPoints: () => void;
}) {
  const [onglet, setOnglet] = useState<Onglet>('Profil');
  const p = etat.creation.presentation;
  return (
    <div className="page">
      <div className="fiche-tete">
        <div>
          <h1 className="titre-ecran">{nomComplet(etat)}</h1>
          <p className="sous-titre">
            {accorder(RANG_LIBELLE[etat.rang], p)}, {age(etat)} ans, {R.villages[etat.creation.village].nomComplet}.
          </p>
        </div>
      </div>
      <div className="onglets" role="tablist">
        {ONGLETS.map((o) => (
          <button key={o} role="tab" aria-selected={onglet === o} onClick={() => setOnglet(o)}>
            {o}
          </button>
        ))}
      </div>
      {onglet === 'Profil' && <Profil etat={etat} onOuvrirPoints={onOuvrirPoints} onArsenal={() => setOnglet('Arsenal')} />}
      {onglet === 'Techniques' && <Techniques etat={etat} />}
      {onglet === 'Maîtrise' && <Maitrise etat={etat} />}
      {onglet === 'Arsenal' && <Arsenal etat={etat} enTempsLibre={enTempsLibre} onEquiper={onEquiper} />}
      {onglet === 'Métier' && <Metier etat={etat} />}
      {onglet === 'Relations' && <Relations etat={etat} />}
      {onglet === 'Missions' && <Missions etat={etat} />}
      {onglet === 'Décisions' && <Decisions etat={etat} />}
    </div>
  );
}

const ELEMENTS_BASE = ['katon', 'suiton', 'fuuton', 'raiton', 'doton'] as const;

function Profil({ etat, onOuvrirPoints, onArsenal }: { etat: GameState; onOuvrirPoints: () => void; onArsenal: () => void }) {
  const c = etat.creation;
  const p = c.presentation;
  const note = noteFinale(etat);
  const masquer = c.difficulte === 'legende';
  const db = databook(etat);
  const arme = etat.armeEquipee ? R.armes[etat.armeEquipee] : undefined;
  const j = etat.jauges;
  const fatigue = gravite(j.fatigue);
  const natures = ELEMENTS_BASE.filter((e) => etat.maitrises[`nature_${e}`]);
  const fusions = Object.values(etat.maitrises).filter((m) => R.maitrises[m.id]?.composantes && m.awakened);
  const biju = etat.secrets.includes('jinchuriki') ? R.contenu.bijus.find((b) => b.id === etat.tirages.biju) : undefined;
  const origine = c.clan === 'sans_clan' ? (estOrphelin(etat) ? 'Orphelin·e, sans clan' : 'Enfant du commun, sans clan') : `Clan ${R.clans[c.clan].nom}`;

  return (
    <div className="fiche">
      <section className="panneau l7">
        <div className="identite">
          <Portrait nom={c.prenom} village={c.village} clan={c.clan} taille={64} />
          <div>
            <h2>{nomComplet(etat)}</h2>
            <p className="sous-titre">
              {accorder(origine, p)}. {accorder(STATUT_LIBELLE[etat.statut], p)}.
            </p>
            <div>
              {estProdige(etat) && <span className="etiquette violet">{R.traits['prodige'].nom}</span>}
              {biju && <span className="etiquette rouge">Jinchūriki</span>}
              {c.traits.map((t) => (
                <span key={t} className="etiquette">
                  {accorder(R.traits[t].nom, p)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <dl className="faits">
          <div>
            <dt>Natures ({natures.length}/{naturesMax(etat)})</dt>
            <dd className="natures">
              {natures.map((e) => (
                <span key={e} className={`nature-pastille ${e === c.element ? 'innee' : ''}`} title={e === c.element ? 'Affinité innée' : 'Nature apprise'}>
                  <span className="kanji">{R.elements[e].kanji}</span>
                  {R.elements[e].nom.split(' ')[0]}
                </span>
              ))}
              {fusions.map((m) => (
                <span key={m.id} className="nature-pastille innee" title="Nature de fusion héritée">
                  <span className="kanji">✦</span>
                  {R.maitrises[m.id].nom.split(' ')[0]}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Arme principale</dt>
            <dd>
              {arme?.nom ?? 'Aucune'}
              {etat.arsenal.length > (arme ? 1 : 0) && (
                <>
                  {' · '}
                  <button type="button" className="lien-discret" onClick={onArsenal}>
                    changer
                  </button>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Métier</dt>
            <dd>{etat.metier.principal ? accorder(R.metiers[etat.metier.principal]?.nom ?? '', p) : 'Aucun'}</dd>
          </div>
          <div>
            <dt>Ryō</dt>
            <dd>{Math.round(j.ryo)}</dd>
          </div>
          <div>
            <dt>Objectif</dt>
            <dd>{R.objectifs[c.objectif].nom}</dd>
          </div>
          <div>
            <dt>Difficulté</dt>
            <dd>{c.difficulte === 'recit' ? 'Récit' : c.difficulte === 'shinobi' ? 'Shinobi' : 'Légende'}</dd>
          </div>
        </dl>
        {biju && <p className="sous-titre" style={{ marginTop: 12 }}>Scellé en toi : {biju.nom}.</p>}
      </section>

      <section className="panneau l5">
        <h2>État</h2>
        <div className="vitaux-grands">
          <Jauge nom="Santé" valeur={j.sante} classe={j.sante < 30 ? 'c-danger' : 'c-sante'} detail="/ 100" />
          <Jauge nom="Chakra" valeur={j.chakra} max={Math.max(1, j.chakraMax)} classe="c-chakra" detail={`/ ${Math.round(j.chakraMax)}`} />
          <Jauge nom="Fatigue" valeur={j.fatigue} classe={fatigue === 'danger' ? 'c-danger' : fatigue === 'alerte' ? 'c-alerte' : 'c-neutre'} detail="/ 100" />
        </div>
        {etat.blessures.length > 0 && <p className="alerte">Blessures : {etat.blessures.map((b) => b.nom.toLowerCase()).join(', ')}.</p>}
      </section>

      <section className="panneau l5">
        <h2>
          Fiche du Databook
          <small>
            Total <span className="total-databook">{noteTexte(db.total)}</span> / 40
          </small>
        </h2>
        <p className="sous-titre">Notes de 0,5 à 5, comme dans les registres du village.</p>
        <ul className="databook">
          {db.lignes.map((l) => (
            <li key={l.id} title={l.explication}>
              <span>{l.nom}</span>
              <span className="pips" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <i key={n} className={l.note >= n ? 'plein' : l.note >= n - 0.5 ? 'moitie' : ''} />
                ))}
              </span>
              <span className="note-db">{masquer ? '' : noteTexte(l.note)}</span>
            </li>
          ))}
        </ul>
      </section>

      {masquer ? (
        <section className="panneau l7">
          <h2>
            Aptitudes <small>sur 100</small>
          </h2>
          <div className="grille-jauges">
            {ATTRIBUTS.map((a: AttributId) => (
              <Jauge key={a} nom={ATTRIBUT_LIBELLE[a]} valeur={etat.attributs[a]} detail={qualificatif(etat.attributs[a])} masquer={masquer} />
            ))}
          </div>
          {etat.pointsStat > 0 && (
            <button type="button" className="btn-principal points-ouvrir" onClick={onOuvrirPoints}>
              Répartir {etat.pointsStat} {etat.pointsStat > 1 ? 'points' : 'point'}
            </button>
          )}
        </section>
      ) : (
        <Repartition etat={etat} onOuvrir={onOuvrirPoints} />
      )}

      <section className="panneau l7">
        <h2>Place dans le monde</h2>
        <div className="grille-jauges">
          {(Object.keys(SOCIAL_LIBELLE) as SocialId[])
            .filter((k) => !(k === 'confianceClan' && c.clan === 'sans_clan') && !(k === 'reputationOmbre' && etat.social.reputationOmbre === 0))
            .map((k) => (
              <Jauge
                key={k}
                nom={SOCIAL_LIBELLE[k]}
                valeur={etat.social[k]}
                masquer={masquer}
                classe={k === 'suspicion' ? (etat.social[k] >= 55 ? 'c-danger' : 'c-alerte') : 'c-or'}
              />
            ))}
        </div>
      </section>

      <section className="panneau l5">
        <h2>Tempérament</h2>
        <div className="poles">
          {(
            [
              ['compassion', 'Dureté', 'Compassion'],
              ['honneur', 'Ruse', 'Honneur'],
              ['ambition', 'Humilité', 'Ambition'],
            ] as const
          ).map(([k, gauche, droite]) => {
            const v = etat.ethique[k];
            return (
              <div className="pole" key={k}>
                <span className={v < -10 ? 'fort' : ''}>{gauche}</span>
                <span className={v > 10 ? 'fort' : ''}>{droite}</span>
                <span className="axe" role="img" aria-label={`${gauche} ou ${droite} : ${v > 10 ? droite : v < -10 ? gauche : 'équilibre'}`}>
                  <b style={{ left: `${50 + v / 2}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {etat.promesses.length > 0 && (
        <section className="panneau l6">
          <h2>Promesses</h2>
          <ul className="liste-simple">
            {etat.promesses.map((pr) => (
              <li key={pr.id}>
                {accorder(pr.texte, p)}{' '}
                <span className={`etiquette ${pr.etat === 'rompue' ? 'rouge' : pr.etat === 'tenue' ? 'or' : ''}`}>{pr.etat === 'en_cours' ? 'en cours' : pr.etat}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className={`panneau ${etat.promesses.length > 0 ? 'l6' : 'l12'}`}>
        <h2>
          Trophées <small>Note provisoire : {note.note}</small>
        </h2>
        {etat.succes.length === 0 ? (
          <p className="vide">Aucun pour l’instant.</p>
        ) : (
          <ul className="liste-simple">
            {etat.succes.map((id) => (
              <li key={id}>
                <strong>{accorder(R.succes[id]?.nom ?? id, p)}</strong> <span className="sous-titre">{R.succes[id]?.description}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function etatMaitrise(etat: GameState, ms: MasteryState): string[] {
  const def = R.maitrises[ms.id];
  if (!def || ms.tier >= 5) return ['Sommet atteint.'];
  if (def.eveil && !ms.awakened) return ['Sommeille : s’éveille sous un déclencheur que tu ne contrôles pas.'];
  if (ms.bloquee) return ['Inexécutable : affinité ou corps pas encore prêt.'];
  const p = porteurJoueur(etat);
  const next = (ms.tier + 1) as 1 | 2 | 3 | 4 | 5;
  const req = exigence(def, next);
  const l: string[] = [`Entraînement ${Math.min(100, Math.round((ms.trainingDays / Math.max(1, req.jours)) * 100))} %`];
  const combats = Math.max(req.combats, next >= 3 ? 1 : 0);
  if (combats > 0) l.push(`combats réels ${Math.min(combats, Math.floor(ms.combatUses))}/${combats}`);
  const b = blocagePalier(p, ms.id);
  if (b === 'age') l.push(req.ageMin && p.age < req.ageMin ? `palier ${next} pas avant ${req.ageMin} ans` : 'plafond de ton âge');
  if (b === 'temps' && req.moisDepuisEveil) l.push(`stabilisation : ${req.moisDepuisEveil} mois après l’éveil`);
  if (b === 'prerequis') l.push(def.composantes ? 'ses deux natures doivent progresser d’abord' : 'une autre maîtrise doit progresser d’abord');
  if (b === 'drapeau') l.push('une condition encore inconnue');
  if (b === 'oeil') l.push('l’illusion ne va pas plus loin sans un dōjutsu qui la comprend');
  return l;
}

function LigneMaitrise({ etat, ms, cap, p }: { etat: GameState; ms: MasteryState; cap: number; p: Presentation }) {
  const def = R.maitrises[ms.id];
  const latent = def.eveil && !ms.awakened;
  const [premier, ...reste] = etatMaitrise(etat, ms);
  const kanji = def.element ? R.elements[def.element]?.kanji : undefined;
  return (
    <li className="maitrise">
      <div className="m-tete">
        <strong>
          {kanji && <span className="kanji">{kanji} </span>}
          {def.nom}
        </strong>
        <span className="m-palier">{latent ? 'Latent' : `Palier ${ms.tier} · ${accorder(def.paliers[ms.tier]?.nom ?? '', p)}`}</span>
      </div>
      <div className="paliers" role="img" aria-label={`Palier ${ms.tier} sur 5, plafond actuel ${cap}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= ms.tier ? 'atteint' : n > cap ? 'plafonne' : ''} />
        ))}
      </div>
      <p className="m-etat">
        <b>{premier}</b>
        {reste.length > 0 && ` · ${reste.join(' · ')}`}
      </p>
      {def.technique?.offensive && !latent && (
        <p className="m-attaque">
          Attaque spéciale · {def.technique.chakra > 0 ? `${def.technique.chakra} chakra` : 'sans chakra'}
          {def.technique.sante ? ` · ${def.technique.sante} santé` : ''} · rang {def.rang}
          {def.technique.elements && ` · ${def.technique.elements.map((e) => R.elements[e]?.kanji ?? e).join(' + ')}`}
        </p>
      )}
      <details>
        <summary>Détails</summary>
        <p>{accorder(def.paliers[ms.tier]?.effet ?? '', p)}</p>
        <p>{def.description}</p>
        {ms.awakenedAtAge !== undefined && def.eveil && <p>Éveillé à {ms.awakenedAtAge} ans.</p>}
        {ms.source === 'copie' && <p>Technique copiée.</p>}
        <p>Coût : {def.cout}</p>
      </details>
    </li>
  );
}

const ORDRE_GROUPES = ['katon', 'suiton', 'fuuton', 'raiton', 'doton', 'combinaison', 'trinite', 'taijutsu', 'genjutsu', 'armes', 'fuinjutsu', 'medical', 'dojutsu', 'biju'];

/** Les techniques apprises, rangées par nature : nom, rang et palier. Le détail reste dans l'onglet Maîtrise. */
function Techniques({ etat }: { etat: GameState }) {
  const p = etat.creation.presentation;
  const apprises = Object.values(etat.maitrises).filter((m) => {
    const def = R.maitrises[m.id];
    return !!def?.technique && (m.awakened || !def.eveil) && !(def.cachee && !m.awakened);
  });
  const groupes = new Map<string, MasteryState[]>();
  for (const m of apprises) {
    const g = groupeTechnique(m.id);
    groupes.set(g, [...(groupes.get(g) ?? []), m]);
  }
  const ids = [...groupes.keys()].sort((a, b) => (ORDRE_GROUPES.indexOf(a) + 1 || 99) - (ORDRE_GROUPES.indexOf(b) + 1 || 99));
  if (!apprises.length) return <p className="plafond">Aucune technique apprise pour l’instant. Un aîné, un sensei ou un parchemin t’en apprendra une.</p>;
  return (
    <>
      <p className="plafond">
        <strong>{apprises.length}</strong>
        <span>
          technique{apprises.length > 1 ? 's' : ''} apprise{apprises.length > 1 ? 's' : ''}, rangée{apprises.length > 1 ? 's' : ''} par nature. Chaque palier se gagne à l’entraînement, puis au combat.
        </span>
      </p>
      {ids.map((g) => (
        <section key={g} className="groupe techniques-nature" style={{ '--nat': `var(--n-${g}, var(--or))` } as React.CSSProperties}>
          <h3>
            <span className="kanji" aria-hidden="true">
              {KANJI_GROUPE[g] ?? '術'}{' '}
            </span>
            {libelleGroupe(g)} <small>· {groupes.get(g)!.length}</small>
          </h3>
          <ul className="techniques-apprises">
            {groupes
              .get(g)!
              .sort((a, b) => b.tier - a.tier || R.maitrises[a.id].nom.localeCompare(R.maitrises[b.id].nom))
              .map((m) => {
                const def = R.maitrises[m.id];
                return (
                  <li key={m.id} className={`technique-apprise${classeMulti(naturesMaitrise(m.id))}`} style={styleNatures(naturesMaitrise(m.id))}>
                    <span className="ta-nom">
                      {def.nom}
                      {def.rang && <small> · rang {def.rang}</small>}
                      {def.kinjutsu && <b className="risque-eleve"> · kinjutsu</b>}
                    </span>
                    <span className="ta-palier">{accorder(def.paliers[m.tier]?.nom ?? '', p) || `Palier ${m.tier}`}</span>
                    <span className="paliers" role="img" aria-label={`Palier ${m.tier} sur 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <i key={n} className={n <= m.tier ? 'atteint' : ''} />
                      ))}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}

function Maitrise({ etat }: { etat: GameState }) {
  const cap = maxTierForAge(age(etat), estProdige(etat));
  const p = etat.creation.presentation;
  const connu = (m: MasteryState) => !(R.maitrises[m.id]?.cachee && !m.awakened) || (m.id === 'chakra_biju' && etat.secrets.includes('jinchuriki'));
  const groupes: { titre: string; aide?: string; filtre: (m: MasteryState) => boolean }[] = [
    { titre: 'Pouvoirs', filtre: (m) => m.kind === 'clan' || m.kind === 'biju' },
    {
      titre: 'Natures',
      aide: `Ton affinité innée progresse le plus vite. Tu peux porter ${naturesMax(etat)} nature${naturesMax(etat) > 1 ? 's' : ''} à ton rang.`,
      filtre: (m) => m.kind === 'element',
    },
    { titre: 'Techniques', filtre: (m) => m.kind === 'jutsu' },
    { titre: 'Disciplines', filtre: (m) => m.kind === 'base' },
    { titre: 'Familles d’armes', filtre: (m) => m.kind === 'weapon_family' },
  ];
  return (
    <>
      <p className="plafond">
        <strong>Palier {cap}</strong>
        <span>
          Plafond de tes {age(etat)} ans pour le chakra et les pouvoirs{estProdige(etat) ? ' (prodige : un palier de plus)' : ''}. Armes et taijutsu n’ont pas de plafond d’âge. Partout, au-delà du palier 2, seule l’expérience réelle fait progresser.
        </span>
      </p>
      {groupes.map((g) => {
        const liste = Object.values(etat.maitrises).filter(g.filtre).filter(connu);
        if (!liste.length) return null;
        return (
          <section key={g.titre} className="groupe">
            <h3>{g.titre}</h3>
            {g.aide && <p>{g.aide}</p>}
            <ul className="maitrises">
              {liste.map((ms) => (
                <LigneMaitrise key={ms.id} etat={etat} ms={ms} cap={R.maitrises[ms.id]?.sansPlafondAge ? 5 : cap} p={p} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function Arsenal({ etat, enTempsLibre, onEquiper }: { etat: GameState; enTempsLibre: boolean; onEquiper: (id: string) => void }) {
  const legendesConnues = R.contenu.armes.filter(
    (a) => (a.rarete === 'legendaire' || a.rarete === 'maudite') && etat.decouvertes.includes(`arme:${a.id}`) && !etat.arsenal.some((i) => i.defId === a.id),
  );
  return (
    <>
      {etat.arsenal.length === 0 && <p className="vide">Tes mains sont vides.</p>}
      <div className="grille-blocs">
        {etat.arsenal.map((inst) => {
          const def = R.armes[inst.defId];
          const utilisable = STATUTS_ARME_UTILISABLES.includes(inst.statut);
          const mod = getWeaponModifiers(etat, inst.defId);
          const palier = etat.maitrises[idFamille(def.famille)]?.tier ?? 0;
          return (
            <div className={`bloc ${def.rarete === 'legendaire' || def.rarete === 'maudite' ? 'legende' : ''}`} key={inst.defId} style={{ opacity: utilisable ? 1 : 0.6 }}>
              <h3>{def.nom}</h3>
              <span className={`etiquette ${def.rarete === 'legendaire' ? 'or' : ''}`}>{RARETE[def.rarete]}</span>
              <span className={`etiquette ${utilisable ? '' : 'rouge'}`}>{STATUT_ARME[inst.statut]}</span>
              {etat.armeEquipee === inst.defId && <span className="etiquette or">Arme principale</span>}
              {inst.lie && <span className="etiquette violet">Liée</span>}
              <p className="sous-titre">{def.description}</p>
              {utilisable && (
                <>
                  <div className="ligne">
                    <span>État</span>
                    <span className="valeur">{inst.etat}/100</span>
                    <Piste valeur={inst.etat} classe={inst.etat < 30 ? 'c-danger' : 'c-neutre'} />
                  </div>
                  {(def.rarete === 'legendaire' || def.rarete === 'maudite') && (
                    <div className="ligne">
                      <span>Lien</span>
                      <span className="valeur">{inst.lien}/100</span>
                      <Piste valeur={inst.lien} classe="c-chakra" />
                    </div>
                  )}
                  <div className="ligne">
                    <span>Maîtrise de la famille</span>
                    <span className="valeur">Palier {palier}</span>
                  </div>
                  {mod.notes.map((n) => (
                    <span className="etiquette rouge" key={n}>
                      {n}
                    </span>
                  ))}
                  {def.capacites.map((cap) => {
                    const ok = mod.capacites.some((x) => x.id === cap.id);
                    return (
                      <p key={cap.id} className="sous-titre" style={{ margin: '6px 0 0' }}>
                        {ok ? 'Débloquée' : 'Scellée'} : {cap.nom}.{' '}
                        {ok ? cap.description : `Exige le palier ${cap.palierMin}${cap.lienMin ? `, un lien de ${cap.lienMin}` : ''}${cap.element ? `, l’affinité ${R.elements[cap.element]?.nom}` : ''}.`}
                      </p>
                    );
                  })}
                  {etat.armeEquipee !== inst.defId && (
                    <div className="actions-bas" style={{ marginTop: 12 }}>
                      <button className="btn-secondaire" disabled={!enTempsLibre} onClick={() => onEquiper(inst.defId)}>
                        En faire mon arme principale
                      </button>
                      {!enTempsLibre && <span className="sous-titre">Possible seulement pendant le temps libre.</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {legendesConnues.length > 0 && (
        <section className="groupe">
          <h3>Lames entendues</h3>
          <p>Des armes dont tu connais l’existence. Elles ne se trouvent pas au hasard.</p>
          <div className="grille-blocs">
            {legendesConnues.map((a) => (
              <div className="bloc silhouette" key={a.id}>
                <h3>{a.nom}</h3>
                <p className="sous-titre">{a.description}</p>
                {a.histoire && <p className="sous-titre">{a.histoire}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Metier({ etat }: { etat: GameState }) {
  const m = etat.metier.principal ? R.metiers[etat.metier.principal] : undefined;
  const p = etat.creation.presentation;
  return (
    <>
      {m ? (
        <div className="bloc">
          <h3>{accorder(m.nom, p)}</h3>
          <span className="etiquette or">{accorder(nomPalierMetier(etat) ?? "", p)}</span>
          {m.canal === 'secret' && <span className="etiquette violet">Métier de l’ombre</span>}
          <p className="sous-titre">{m.description}</p>
          <ul className="liste-simple">
            <li>Salaire : {m.salaireMensuel} ryō par mois.</li>
            <li>Avantages : {m.avantages.join(' ; ')}.</li>
            <li>Contraintes : {m.contraintes.join(' ; ')}.</li>
            {etat.metier.secondaire && <li>Métier secondaire : {accorder(R.metiers[etat.metier.secondaire]?.nom ?? '', p)}.</li>}
          </ul>
        </div>
      ) : (
        <p className="vide">Aucun métier : il se choisit après l’Académie.</p>
      )}
      <section className="groupe">
        <h3>Autres voies</h3>
        <p>Le rang mesure la hiérarchie ; le métier, ce que tu fais.</p>
        <div className="grille-blocs">
          {R.contenu.metiers
            .filter((x) => x.id !== etat.metier.principal && x.id !== etat.metier.secondaire)
            .map((x) => {
              const e = checkCareerEligibility(etat, x.id);
              return (
                <div className="bloc" key={x.id}>
                  <div className="ligne" style={{ padding: 0, border: 0 }}>
                    <strong>{accorder(x.nom, p)}</strong>
                    <span className={`etiquette ${!x.disponible ? '' : e.ok ? 'jade' : 'rouge'}`}>{!x.disponible ? 'Chapitre suivant' : e.ok ? 'Accessible' : 'Fermé'}</span>
                  </div>
                  <p className="sous-titre" style={{ marginTop: 6 }}>
                    {accorder(x.disponible && !e.ok ? e.raisons.join(' ; ') : x.description, p)}
                  </p>
                </div>
              );
            })}
        </div>
      </section>
    </>
  );
}

function Relations({ etat }: { etat: GameState }) {
  const ids = Object.keys(etat.relations).filter((id) => etat.pnj[id]?.rencontre || etat.relations[id].souvenirs.length > 0);
  if (!ids.length) return <p className="vide">Personne ne te connaît encore vraiment.</p>;
  return (
    <div className="grille-blocs">
      {ids.map((id) => {
        const r = etat.relations[id];
        const d = defPnj(etat, id);
        const st = etat.pnj[id];
        if (!d) return null;
        const pd: Presentation = d.genre === 'f' ? 'feminin' : 'masculin';
        return (
          <div className="bloc" key={id}>
            <div className="identite" style={{ gap: 10 }}>
              <Portrait nom={d.nom} village={d.village} clan={d.clan} taille={44} mort={st?.etat === 'mort'} />
              <div>
                <h3 style={{ margin: 0 }}>{d.nom}</h3>
                <span className="sous-titre">{accorder(d.personnalite, pd)}</span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {st && st.etat !== 'vivant' && <span className="etiquette rouge">{accorder(ETAT_PNJ[st.etat], pd)}</span>}
              {r.rompue && <span className="etiquette rouge">Lien rompu</span>}
            </div>
            {(['confiance', 'amitie', 'respect', 'attachement', 'rivalite', 'hostilite'] as const)
              .filter((ax) => r[ax] > 0)
              .map((ax) => (
                <div className="ligne" key={ax}>
                  <span>{ax === 'amitie' ? 'Amitié' : ax === 'rivalite' ? 'Rivalité' : ax === 'hostilite' ? 'Hostilité' : ax.charAt(0).toUpperCase() + ax.slice(1)}</span>
                  <span className="valeur">{etat.creation.difficulte === 'legende' ? '' : r[ax]}</span>
                  <Piste valeur={r[ax]} classe={ax === 'hostilite' || ax === 'rivalite' ? 'c-danger' : 'c-neutre'} />
                </div>
              ))}
            {r.souvenirs.length > 0 && <p className="sous-titre">« {r.souvenirs[r.souvenirs.length - 1]} »</p>}
          </div>
        );
      })}
    </div>
  );
}

function Missions({ etat }: { etat: GameState }) {
  const ids = Object.keys(etat.missions);
  if (!ids.length) return <p className="vide">Aucune mission encore. Le tableau des missions s’ouvre aux genin, pendant le temps libre.</p>;
  return (
    <ul className="liste-simple">
      {ids.map((id) => {
        const m = R.missions[id];
        const st = etat.missions[id];
        return (
          <li key={id}>
            <strong>
              Rang {m?.rang} : {m?.titre}
            </strong>{' '}
            <span className={`etiquette ${st === 'reussie' ? 'or' : st === 'echouee' ? 'rouge' : ''}`}>
              {st === 'reussie' ? 'réussie' : st === 'echouee' ? 'échouée' : st === 'en_cours' ? 'en cours' : st === 'confiee' ? 'prise par un autre' : 'abandonnée'}
            </span>
            <div className="sous-titre">
              {st === 'confiee'
                ? typeof etat.drapeaux[`mission_prise:${id}`] === 'string'
                  ? `Tu l’as laissée au tableau : ${defPnj(etat, etat.drapeaux[`mission_prise:${id}`] as string)?.nom ?? 'un autre'} l’a faite, et en a tiré l’expérience.`
                  : 'Tu l’as laissée au tableau : une autre équipe l’a prise.'
                : m?.description}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Decisions({ etat }: { etat: GameState }) {
  const liste = [...etat.historique].reverse();
  const p = etat.creation.presentation;
  if (!liste.length) return <p className="vide">Aucune décision encore.</p>;
  return (
    <ul className="liste-simple">
      {liste.map((d, i) => (
        <li key={i}>
          <strong>{accorder(d.titre, p)}</strong>
          <div className="sous-titre">
            {accorder(d.choix, p)}
            {d.issue ? ` (${d.issue === 'critique' ? 'réussite éclatante' : d.issue === 'succes' ? 'réussite' : d.issue === 'partiel' ? 'réussite partielle' : 'échec'})` : ''}, à{' '}
            {Math.floor((d.jour - etat.naissance) / 360)} ans.
          </div>
        </li>
      ))}
    </ul>
  );
}

export { libelleDuree };
