'use client';

import { stockageParDefaut } from './stockage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Creation as CreationT, GameState } from '../engine/types';
import { R } from '../engine/registre';
import { activite, chapitreSuivant, choisir, combattre, continuer, lieuCourant, magasin, magasinOuvert, manche, nommer, nouvellePartie, repartir } from '../engine/moteur';
import { age, libelleSaison } from '../engine/calendrier';
import { charger, consommerHeritage, enregistrer, fusionnerMeta, lireMeta, listerSauvegardes, restaurer } from '../engine/sauvegarde';
import type { Meta, Stockage } from '../engine/sauvegarde';
import Accueil from './Accueil';
import Creation from './Creation';
import Recit from './Recit';
import Tableau from './Tableau';
import Magasin from './Magasin';
import NommerEnfant, { doitNommerEnfant } from './NommerEnfant';
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
import CreationDuo from './campagne/CreationDuo';
import { BandeauDuo, ChoixMort, EcranPassage, FinDuo, Nouvelles, Proposition, ResultatCommun, SceneCommune, ScenePrivee, VueLien } from './campagne/Campagne';
import { agir, agirLien, choisirCombat, choisirCommune, choisirMort, choisirPrivee, enAttente, joueurActif, lireNotes, lireResultat, nouvelleCampagne, priveeDue, rafraichir, vueCombatDuo } from '../engine/campagne/moteur';
import type { ActionLien, Campagne, IdJoueur, SigneCombat } from '../engine/campagne/types';
import type { ActionCombat } from '../engine/combat/types';

type Ecran = 'accueil' | 'creation' | 'creation_duo' | 'jeu' | 'savoir';
type Onglet = 'recit' | 'ninja' | 'magasin' | 'journal' | 'bingo' | 'savoir' | 'lien';

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
/** La campagne à deux vit sur l'appareil, à part des sauvegardes solo. */
const CLE_CAMPAGNE = 'ninja-destiny:campagne';

export default function Game() {
  const stockage = useMemo<Stockage>(() => stockageParDefaut(), []);
  const [pret, setPret] = useState(false);
  const [ecran, setEcran] = useState<Ecran>('accueil');
  const [onglet, setOnglet] = useState<Onglet>('recit');
  const [etatSolo, setEtat] = useState<GameState | null>(null);
  // La campagne à deux : l'état affiché est celui du joueur qui a la main (ou du dernier à avoir joué).
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [joueurVu, setJoueurVu] = useState<IdJoueur | null>(null);
  const [signe, setSigne] = useState<SigneCombat | undefined>(undefined);
  const actif = campagne ? joueurActif(campagne) : null;
  const etat: GameState | null = campagne ? campagne.joueurs[actif ?? campagne.tour] : etatSolo;
  const [meta, setMeta] = useState<Meta>({ parties: 0, finsObtenues: [], evenementsVus: [], decouvertes: [], succes: [], ryo: 0, viesVersees: [] });
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEFAUT);
  const [menu, setMenu] = useState<null | 'sauvegardes' | 'boutique' | 'reglages'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [campagneSauvee, setCampagneSauvee] = useState<Campagne | null>(null);
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
    try {
      const brut = stockage.lire(CLE_CAMPAGNE);
      if (brut) setCampagneSauvee(JSON.parse(brut) as Campagne);
    } catch {
      /* pas de campagne lisible */
    }
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

  const majCampagne = useCallback(
    (c: Campagne) => {
      setCampagne(c);
      setCampagneSauvee(c);
      stockage.ecrire(CLE_CAMPAGNE, JSON.stringify(c));
    },
    [stockage],
  );

  const appliquer = useCallback(
    (fn: (s: GameState) => GameState) => {
      if (!etat) return;
      // En campagne, l'action passe par le moteur de campagne : il vérifie le tour et la journalise.
      if (campagne) {
        if (actif === null) return;
        try {
          majCampagne(agir(campagne, actif, fn));
        } catch (e) {
          setToast(`Action impossible : ${(e as Error).message}`);
        }
        return;
      }
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
    [etat, stockage, reglages.son, campagne, actif, majCampagne],
  );

  const commencerDuo = (c1: CreationT, c2: CreationT, lien: Parameters<typeof nouvelleCampagne>[2]) => {
    try {
      const c = nouvelleCampagne(c1, c2, lien);
      majCampagne(c);
      setEtat(null);
      setJoueurVu(null);
      setOnglet('recit');
      setEcran('jeu');
    } catch (e) {
      setToast((e as Error).message);
    }
  };
  const reprendreDuo = () => {
    if (!campagneSauvee) return;
    setCampagne(rafraichir(campagneSauvee));
    setEtat(null);
    setJoueurVu(null);
    setOnglet('recit');
    setEcran('jeu');
  };
  /** Une action de campagne (combat, lien, scène) : les erreurs deviennent un message, jamais un plantage. */
  const essayer = (fn: () => Campagne) => {
    try {
      majCampagne(fn());
    } catch (e) {
      setToast(`Action impossible : ${(e as Error).message}`);
    }
  };
  const combatDuo = (a: ActionCombat) => {
    if (!campagne || actif === null) return;
    essayer(() => choisirCombat(campagne, actif, a, signe));
    setSigne(undefined);
  };
  const lienDuo = (x: ActionLien) => campagne && actif !== null && essayer(() => agirLien(campagne, actif, x));
  const quitterDuo = () => {
    setCampagne(null);
    setJoueurVu(null);
    setEcran('accueil');
  };

  const commencer = (c: CreationT) => {
    try {
      // L'héritage réservé à la boutique part avec la nouvelle vie.
      const heritage = lireMeta(stockage).heritage;
      const s = nouvellePartie(heritage ? { ...c, heritage } : c);
      if (heritage) consommerHeritage(stockage);
      setCampagne(null);
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
    setCampagne(null);
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
          onDuo={() => setEcran('creation_duo')}
          campagne={campagneSauvee ?? undefined}
          onReprendreDuo={reprendreDuo}
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

  if (ecran === 'creation_duo') {
    return (
      <div className="coque">
        <CreationDuo onCommencer={commencerDuo} onRetour={() => setEcran('accueil')} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  // La campagne à deux : l'écran de passage masque tout entre deux joueurs ; les scènes communes passent avant le reste.
  if (campagne && ecran === 'jeu') {
    if (actif === null)
      return (
        <div className="coque">
          <main className="contenu">
            {campagne.fin ? (
              <FinDuo c={campagne} onMenu={quitterDuo} />
            ) : (
              <div className="passage">
                <h1>La campagne est terminée</h1>
                <p>
                  {campagne.creations[0].prenom} et {campagne.creations[1].prenom} ont vécu leur destin.
                </p>
                <button className="btn-principal" onClick={quitterDuo}>
                  Retour à l’accueil
                </button>
              </div>
            )}
          </main>
        </div>
      );
    if (joueurVu !== actif) {
      const signeRecu = vueCombatDuo(campagne, actif)?.signeAutre;
      const message = signeRecu ? `${campagne.creations[(1 - actif) as IdJoueur].prenom} te fait signe : « ${signeRecu} »` : enAttente(campagne, (1 - actif) as IdJoueur);
      return (
        <div className="coque">
          <EcranPassage c={campagne} j={actif} message={message} onConfirmer={() => setJoueurVu(actif)} />
        </div>
      );
    }
    if (campagne.morts[actif] === 'a_choisir')
      return (
        <div className="coque">
          <ChoixMort c={campagne} j={actif} onChoisir={(x) => essayer(() => choisirMort(campagne, actif, x))} />
        </div>
      );
    const resultatCommun = !!campagne.resultat && !campagne.resultat.lu[actif];
    const prive = !campagne.combat && !campagne.commune && !resultatCommun && (campagne.resultatPrive[actif] || priveeDue(campagne, actif));
    if (resultatCommun || (campagne.commune && !campagne.combat) || prive)
      return (
        <div className="coque jeu">
          <main className="contenu">
            {resultatCommun ? (
              <ResultatCommun c={campagne} j={actif} onContinuer={() => essayer(() => lireResultat(campagne, actif))} />
            ) : campagne.commune ? (
              <SceneCommune c={campagne} j={actif} onChoisir={(id) => essayer(() => choisirCommune(campagne, actif, id))} />
            ) : campagne.resultatPrive[actif] ? (
              <ResultatCommun c={campagne} j={actif} prive onContinuer={() => essayer(() => lireResultat(campagne, actif))} />
            ) : (
              <ScenePrivee c={campagne} j={actif} onChoisir={(id) => essayer(() => choisirPrivee(campagne, actif, id))} />
            )}
          </main>
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
          {campagne && (
            <button className="duo-pastille" onClick={quitterDuo} title="Quitter la campagne (elle est gardée sur l’appareil)">
              {etat.creation.prenom} <span aria-hidden="true">✕</span>
            </button>
          )}
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
                if (campagne) return quitterDuo();
                setEtat(null);
                setEcran('creation');
              }}
              onMenu={() => {
                if (campagne) return quitterDuo();
                setEtat(null);
                setEcran('accueil');
              }}
              onChapitreSuivant={() => {
                appliquer((s) => chapitreSuivant(s));
                remonter();
              }}
            />
          ) : (
            <>
            {doitNommerEnfant(etat) && <NommerEnfant etat={etat} onNommer={(nom) => appliquer((s) => nommer(s, 'enfant', nom))} />}
            {campagne && actif !== null && (
              <>
                <Nouvelles notes={campagne.notes[actif]} onLu={() => essayer(() => lireNotes(campagne, actif))} />
                {!campagne.combat && <Proposition c={campagne} j={actif} onRepondre={(oui) => lienDuo({ t: 'repondre', accepte: oui })} />}
                {campagne.combat && <BandeauDuo c={campagne} j={actif} signe={signe} onSigne={setSigne} onDuo={(id) => combatDuo({ famille: 'ninjutsu', choix: id })} />}
              </>
            )}
            <Recit
              etat={etat}
              theme={reglages.theme}
              anime={anime}
              onChoisir={(id) => appliquer((s) => choisir(s, id))}
              onContinuer={() => appliquer((s) => continuer(s))}
              onActivite={(id) => appliquer((s) => activite(s, id))}
              onOuvrirPoints={() => setModalePoints(true)}
              onManche={(id) => appliquer((s) => manche(s, id))}
              onCombat={(a) => (campagne?.combat ? combatDuo(a) : appliquer((s) => combattre(s, a)))}
            />
            </>
          ))}
        {onglet === 'ninja' && (
          <Tableau
            etat={etat}
            peutEquiper={magasinOuvert(etat)}
            onEquiper={(id) => {
              appliquer((s) => magasin(s, `equiper:${id}`));
              setToast(`${R.armes[id]?.nom} en main.`);
            }}
            onOuvrirPoints={() => setModalePoints(true)}
          />
        )}
        {onglet === 'magasin' && <Magasin etat={etat} onAcheter={(id) => appliquer((s) => magasin(s, id))} />}
        {onglet === 'journal' && <Journal etat={etat} />}
        {onglet === 'bingo' && <BingoBook etat={etat} />}
        {onglet === 'savoir' && <Encyclopedie etat={etat} meta={meta} />}
        {onglet === 'lien' && campagne && actif !== null && <VueLien c={campagne} j={actif} onLien={lienDuo} />}
      </main>
      {modalePoints && etat.pointsStat > 0 && (
        <ModalePoints etat={etat} onRepartir={(rep) => appliquer((x) => repartir(x, rep))} onFermer={fermerPoints} />
      )}
      <nav className="nav" aria-label="Navigation">
        <span className="nav-sceau" aria-hidden="true">
          忍
        </span>
        {(campagne ? [...NAV.filter((n) => n.id !== 'bingo'), { id: 'lien' as Onglet, kanji: '双', nom: 'À deux' }] : NAV).map((n) => (
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
        <button onClick={() => setMenu(campagne ? 'reglages' : 'sauvegardes')}>
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
            if (campagne) return quitterDuo();
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
