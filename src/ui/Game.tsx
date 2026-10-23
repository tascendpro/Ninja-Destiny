'use client';

import { stockageParDefaut } from './stockage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Creation as CreationT, GameState } from '../engine/types';
import { R } from '../engine/registre';
import { activite, chapitreSuivant, choisir, combattre, continuer, lieuCourant, manche, nouvellePartie, repartir } from '../engine/moteur';
import { age, libelleSaison } from '../engine/calendrier';
import { charger, consommerHeritage, enregistrer, fusionnerMeta, lireMeta, listerSauvegardes, restaurer } from '../engine/sauvegarde';
import type { Meta, Stockage } from '../engine/sauvegarde';
import Accueil from './Accueil';
import Creation from './Creation';
import Recit from './Recit';
import Tableau from './Tableau';
import Magasin from './Magasin';
import { ModalePoints } from './Repartition';
import Journal from './Journal';
import Encyclopedie from './Encyclopedie';
import BingoBook from './BingoBook';
import Fin from './Fin';
import Menu from './Menu';
import type { Reglages } from './Menu';
import { Ambiance } from './audio';
import type { Piste as PisteSon } from './musiques';
import { gravite } from './fiche';
import { remonter } from './defilement';

type Ecran = 'accueil' | 'creation' | 'jeu' | 'savoir';
type Onglet = 'recit' | 'ninja' | 'magasin' | 'journal' | 'bingo' | 'savoir';

const NAV: { id: Onglet; kanji: string; nom: string }[] = [
  { id: 'recit', kanji: '話', nom: 'Récit' },
  { id: 'ninja', kanji: '忍', nom: 'Ninja' },
  { id: 'magasin', kanji: '店', nom: 'Magasin' },
  { id: 'journal', kanji: '記', nom: 'Journal' },
  { id: 'bingo', kanji: '賞', nom: 'Bingo' },
  { id: 'savoir', kanji: '書', nom: 'Savoir' },
];

const REGLAGES_DEFAUT: Reglages = { theme: 'nuit', son: true, volume: 0.5, animations: 'normales' };
const CLE_REGLAGES = 'ninja-destiny:reglages';

export default function Game() {
  const stockage = useMemo<Stockage>(() => stockageParDefaut(), []);
  const [pret, setPret] = useState(false);
  const [ecran, setEcran] = useState<Ecran>('accueil');
  const [onglet, setOnglet] = useState<Onglet>('recit');
  const [etat, setEtat] = useState<GameState | null>(null);
  const [meta, setMeta] = useState<Meta>({ parties: 0, finsObtenues: [], evenementsVus: [], decouvertes: [], succes: [], ryo: 0, viesVersees: [] });
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEFAUT);
  const [menu, setMenu] = useState<null | 'sauvegardes' | 'boutique' | 'reglages'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const ambiance = useRef<Ambiance | null>(null);
  // La modale de points s'ouvre d'elle-même quand de nouveaux points arrivent ; « Plus tard » la referme jusqu'aux suivants.
  const [modalePoints, setModalePoints] = useState(false);
  const pointsVus = useRef<number | null>(null);
  useEffect(() => {
    const n = etat?.pointsStat ?? 0;
    if (pointsVus.current !== null && n > pointsVus.current && !etat?.fin) setModalePoints(true);
    if (n === 0) setModalePoints(false);
    pointsVus.current = n;
  }, [etat?.pointsStat, etat?.fin]);
  const fermerPoints = useCallback(() => setModalePoints(false), []);

  useEffect(() => {
    try {
      const brut = stockage.lire(CLE_REGLAGES);
      if (brut) setReglages({ ...REGLAGES_DEFAUT, ...JSON.parse(brut) });
    } catch {
      /* réglages par défaut */
    }
    setMeta(lireMeta(stockage));
    setPret(true);
  }, [stockage]);

  useEffect(() => {
    document.documentElement.dataset.ambiance = reglages.theme;
    document.documentElement.dataset.animations = reglages.animations;
    stockage.ecrire(CLE_REGLAGES, JSON.stringify(reglages));
  }, [reglages, stockage]);

  // L'accent de l'interface prend la couleur du village du personnage.
  useEffect(() => {
    if (etat?.creation.village) document.documentElement.dataset.village = etat.creation.village;
    else delete document.documentElement.dataset.village;
  }, [etat?.creation.village]);

  useEffect(() => {
    if (!pret) return;
    if (reglages.son) {
      ambiance.current ??= new Ambiance();
      ambiance.current.demarrer(reglages.volume, pisteDe(ecran, etat));
    } else ambiance.current?.arreter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reglages.son, reglages.volume, pret]);

  // La musique suit le moment du jeu (accueil, récit, temps libre, combat, deuil, fin…).
  const piste = pisteDe(ecran, etat);

  // Les navigateurs n'autorisent le son qu'après un premier geste : la musique démarre au premier toucher.
  useEffect(() => {
    if (!reglages.son) return;
    const lancer = () => {
      ambiance.current ??= new Ambiance();
      ambiance.current.demarrer(reglages.volume, pisteDe(ecran, etat));
    };
    window.addEventListener('pointerdown', lancer, { once: true });
    window.addEventListener('keydown', lancer, { once: true });
    return () => {
      window.removeEventListener('pointerdown', lancer);
      window.removeEventListener('keydown', lancer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reglages.son]);
  const basculerSon = () => setReglages((r) => ({ ...r, son: !r.son }));
  useEffect(() => {
    if (reglages.son) ambiance.current?.jouer(piste);
  }, [piste, reglages.son]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const anime = reglages.animations === 'normales';
  const sauvegardes = useMemo(() => (pret ? listerSauvegardes(stockage) : []), [pret, stockage, rev, etat]);
  const sauvegardeAuto = sauvegardes.find((x) => x.emplacement === 'auto')?.sauvegarde;

  const appliquer = useCallback(
    (fn: (s: GameState) => GameState) => {
      if (!etat) return;
      try {
        const n = fn(etat);
        if (reglages.son && n.scene.type === 'resultat') {
          ambiance.current?.effet(n.scene.changements.some((c) => c.t === 'eveil') ? 'eveil' : 'choix');
        }
        if (reglages.son && n.scene.type === 'combat') {
          const dernier = n.scene.resultats?.at(-1);
          if (dernier) ambiance.current?.effet(dernier);
        }
        setEtat(n);
        enregistrer(stockage, 'auto', n);
        setMeta(fusionnerMeta(stockage, n));
      } catch (e) {
        setToast(`Action impossible : ${(e as Error).message}`);
      }
    },
    [etat, stockage, reglages.son],
  );

  const commencer = (c: CreationT) => {
    try {
      // L'héritage réservé à la boutique part avec la nouvelle vie.
      const heritage = lireMeta(stockage).heritage;
      const s = nouvellePartie(heritage ? { ...c, heritage } : c);
      if (heritage) consommerHeritage(stockage);
      setEtat(s);
      enregistrer(stockage, 'auto', s);
      setMeta(fusionnerMeta(stockage, s, true));
      setOnglet('recit');
      setEcran('jeu');
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const chargerEtat = (s: GameState, message?: string) => {
    setEtat(s);
    setMenu(null);
    setOnglet('recit');
    setEcran('jeu');
    if (message) setToast(message);
  };

  const continuerAuto = () => {
    const sv = charger(stockage, 'auto');
    if (!sv) return;
    const r = restaurer(sv);
    chargerEtat(r.etat, r.verifiee ? undefined : r.message);
  };

  if (!pret) return <div className="coque" aria-busy="true" />;

  if (ecran === 'accueil') {
    return (
      <>
        <Accueil
          sauvegardeAuto={sauvegardeAuto}
          aDesSauvegardes={sauvegardes.some((x) => x.sauvegarde)}
          parties={meta.parties}
          onNouvelle={() => setEcran('creation')}
          onContinuer={continuerAuto}
          onCharger={() => setMenu('sauvegardes')}
          onBoutique={() => setMenu('boutique')}
          bourse={meta.ryo}
          heritage={meta.heritage}
          onEncyclopedie={() => setEcran('savoir')}
          onReglages={() => setMenu('reglages')}
        />
        {menu && (
          <Menu
            etat={null}
            stockage={stockage}
            meta={meta}
            onMeta={setMeta}
            reglages={reglages}
            section={menu}
            onReglages={setReglages}
            onCharger={chargerEtat}
            onFermer={() => {
              setMenu(null);
              setRev((x) => x + 1);
            }}
            onToast={setToast}
          />
        )}
        <button className="musique-accueil musique-pastille" aria-pressed={reglages.son} onClick={basculerSon} title={reglages.son ? 'Couper la musique' : 'Remettre la musique'}>
          ♪
          <span className="visuellement-cache">{reglages.son ? ' Couper la musique' : ' Remettre la musique'}</span>
        </button>
        {toast && <div className="toast" role="status">{toast}</div>}
      </>
    );
  }

  if (ecran === 'creation') {
    return (
      <div className="coque">
        <Creation onCommencer={commencer} onRetour={() => setEcran('accueil')} heritage={meta.heritage} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  if (ecran === 'savoir' || !etat) {
    return (
      <div className="coque">
        <header className="entete">
          <div className="entete-lieu">
            <span>Encyclopédie</span>
          </div>
          <div className="entete-actions">
            <button className="btn-icone" onClick={() => setEcran('accueil')}>
              Retour
            </button>
          </div>
        </header>
        <main className="contenu">
          <Encyclopedie etat={null} meta={meta} />
        </main>
      </div>
    );
  }

  const lieu = etat.scene.type === 'evenement' ? lieuCourant(etat, R.evenements[etat.scene.id].lieu) : lieuCourant(etat, '$village');
  const enFin = etat.scene.type === 'fin';
  const enTempsLibre = etat.scene.type === 'temps_libre';
  const j = etat.jauges;
  const fatigue = gravite(j.fatigue);

  return (
    <div className="coque jeu">
      <header className="entete">
        <div className="entete-lieu">
          <span>{lieu.nom}</span>
          <small>{libelleSaison(etat)}</small>
        </div>
        <div className="vitaux" aria-label="État du personnage">
          <span className="vital">
            Santé <strong>{Math.round(j.sante)}</strong>
            <Piste valeur={j.sante} classe={j.sante < 30 ? 'c-danger' : 'c-sante'} />
          </span>
          <span className="vital">
            Chakra <strong>{Math.round(j.chakra)}</strong>
            <Piste valeur={j.chakra} max={Math.max(1, j.chakraMax)} classe="c-chakra" />
          </span>
          <span className="vital">
            Fatigue <strong>{Math.round(j.fatigue)}</strong>
            <Piste valeur={j.fatigue} classe={fatigue === 'danger' ? 'c-danger' : fatigue === 'alerte' ? 'c-alerte' : 'c-neutre'} />
          </span>
        </div>
        <div className="entete-actions">
          {etat.pointsStat > 0 && !enFin && (
            <button
              className="points-pastille"
              title="Points de stat à répartir"
              onClick={() => setModalePoints(true)}
            >
              +{etat.pointsStat} <span className="visuellement-cache">points de stat à répartir</span>
              <span aria-hidden="true">pts</span>
            </button>
          )}
          <span className="ryo-pastille" title="Ryō">
            {Math.round(j.ryo)} <span aria-hidden="true">両</span>
            <span className="visuellement-cache"> ryō</span>
          </span>
          <span className="age-pastille" title="Âge">
            {age(etat)} ans
          </span>
        </div>
      </header>
      <main className="contenu">
        {onglet === 'recit' &&
          (enFin ? (
            <Fin
              etat={etat}
              meta={meta}
              theme={reglages.theme}
              anime={anime}
              onNouvelle={() => {
                setEtat(null);
                setEcran('creation');
              }}
              onMenu={() => {
                setEtat(null);
                setEcran('accueil');
              }}
              onChapitreSuivant={() => {
                appliquer((s) => chapitreSuivant(s));
                remonter();
              }}
            />
          ) : (
            <Recit
              etat={etat}
              theme={reglages.theme}
              anime={anime}
              onChoisir={(id) => appliquer((s) => choisir(s, id))}
              onContinuer={() => appliquer((s) => continuer(s))}
              onActivite={(id) => appliquer((s) => activite(s, id))}
              onOuvrirPoints={() => setModalePoints(true)}
              onManche={(id) => appliquer((s) => manche(s, id))}
              onCombat={(a) => appliquer((s) => combattre(s, a))}
            />
          ))}
        {onglet === 'ninja' && (
          <Tableau
            etat={etat}
            enTempsLibre={enTempsLibre}
            onEquiper={(id) => {
              appliquer((s) => activite(s, `equiper:${id}`));
              setToast(`${R.armes[id]?.nom} en main.`);
            }}
            onOuvrirPoints={() => setModalePoints(true)}
          />
        )}
        {onglet === 'magasin' && <Magasin etat={etat} onAcheter={(id) => appliquer((s) => activite(s, id))} />}
        {onglet === 'journal' && <Journal etat={etat} />}
        {onglet === 'bingo' && <BingoBook etat={etat} />}
        {onglet === 'savoir' && <Encyclopedie etat={etat} meta={meta} />}
      </main>
      {modalePoints && etat.pointsStat > 0 && (
        <ModalePoints etat={etat} onRepartir={(rep) => appliquer((x) => repartir(x, rep))} onFermer={fermerPoints} />
      )}
      <nav className="nav" aria-label="Navigation">
        <span className="nav-sceau" aria-hidden="true">
          忍
        </span>
        {NAV.map((n) => (
          <button
            key={n.id}
            aria-current={onglet === n.id ? 'page' : undefined}
            onClick={() => {
              setOnglet(n.id);
              remonter();
            }}
          >
            <span className="kanji" aria-hidden="true">
              {n.kanji}
            </span>
            {n.nom}
          </button>
        ))}
        <button onClick={basculerSon} aria-pressed={reglages.son} title={reglages.son ? 'Couper la musique' : 'Remettre la musique'}>
          <span className="kanji" aria-hidden="true">
            {reglages.son ? '音' : '静'}
          </span>
          {reglages.son ? 'Son' : 'Muet'}
        </button>
        <button onClick={() => setMenu('sauvegardes')}>
          <span className="kanji" aria-hidden="true">
            設
          </span>
          Menu
        </button>
      </nav>
      {menu && (
        <Menu
          etat={etat}
          stockage={stockage}
          meta={meta}
          onMeta={setMeta}
          reglages={reglages}
          section={menu}
          onReglages={setReglages}
          onCharger={chargerEtat}
          onQuitter={() => {
            setMenu(null);
            setEtat(null);
            setEcran('accueil');
          }}
          onFermer={() => setMenu(null)}
          onToast={setToast}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/** Quelle musique pour quel moment. */
function pisteDe(ecran: Ecran, etat: GameState | null): PisteSon {
  if (ecran !== 'jeu' || !etat) return 'accueil';
  const sc = etat.scene;
  if (sc.type === 'fin') return 'fin';
  if (sc.type === 'bilan') return 'bilan';
  if (sc.type === 'combat') return 'combat';
  if (sc.type === 'temps_libre') return 'temps_libre';
  const ev = R.evenements[sc.type === 'evenement' ? sc.id : sc.evenementId];
  if (!ev) return 'village';
  if (ev.categorie === 'deuil') return 'deuil';
  if (['guerre', 'trahison', 'capture', 'desertion'].includes(ev.categorie)) return 'tension';
  if (sc.type === 'evenement' && ev.choix.some((c) => c.test?.type === 'combat')) return 'combat';
  if (etat.chapitre === 1 && age(etat) < 12) return 'enfance';
  return 'village';
}

function Piste({ valeur, max = 100, classe }: { valeur: number; max?: number; classe: string }) {
  return (
    <span className={`piste ${classe}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, (valeur / max) * 100))}%` }} />
    </span>
  );
}
