'use client';

// Le salon de la partie en ligne, dans l'ordre logique :
//   1. créer le groupe (on reçoit un code) ou le rejoindre avec un code ;
//   2. l'hôte choisit ce qui vous lie ;
//   3. chacun crée son ninja sur son téléphone, en même temps : le lien et les choix de l'autre s'imposent en direct
//      (frères et sœurs : même village et même clan, choisis par l'hôte ; clans ou villages différents : ce que l'un
//      a pris est fermé pour l'autre) ;
//   4. quand les deux sont prêts, la partie démarre sur les deux écrans.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Creation as CreationT } from '../../engine/types';
import type { PasseCommun, TypeLien } from '../../engine/campagne/types';
import { LIBELLES_LIEN, LIBELLES_PASSE, validerLien } from '../../engine/campagne/moteur';
import { R } from '../../engine/registre';
import Creation from '../Creation';
import { contraintesDuLien } from '../creationAides';
import { formaterCode, memoriserPartie, nettoyerCode, serviceEnLigne, type PartieDistante } from './enLigne';

const DESCRIPTIONS: Partial<Record<TypeLien, string>> = {
  freres: 'Même famille, même toit. L’hôte choisit le village et le clan de la famille.',
  clan: 'Le même sang, deux familles. L’hôte choisit le clan.',
  amis: 'Rencontrés enfants, dans le même village (ou un déménagement vous a séparés).',
  rivaux: 'Chacun veut dépasser l’autre.',
  inconnus: 'Vous ne vous connaissez pas encore.',
  clans_differents: 'Deux familles qui se méfient : le clan pris par l’un est fermé à l’autre.',
  villages_differents: 'Deux villages, deux camps : le village pris par l’un est fermé à l’autre.',
  improbable: 'Un survivant, et celui qui l’a entendu sous les décombres.',
};

export default function Salon({ onDemarrer, onRetour }: { onDemarrer: (p: PartieDistante) => void; onRetour: () => void }) {
  const service = serviceEnLigne();
  const [partie, setPartie] = useState<PartieDistante | null>(null);
  const [saisie, setSaisie] = useState(false);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [type, setType] = useState<TypeLien>('amis');
  const [passe, setPasse] = useState<PasseCommun>('rencontre');
  const [copie, setCopie] = useState(false);
  const brouillon = useRef<number | undefined>(undefined);
  const lancement = useRef(false);

  // La partie bouge (l'autre rejoint, choisit, crée son ninja) : on suit, en direct.
  useEffect(() => {
    if (!partie) return;
    memoriserPartie(partie.id);
    return service.ecouterPartie(partie.id, setPartie);
  }, [partie?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const moi = partie?.siege ?? 0;
  const maFiche = partie ? (moi === 0 ? partie.creationHote : partie.creationInvite) : undefined;
  const saFiche = partie ? (moi === 0 ? partie.creationInvite : partie.creationHote) : undefined;
  const pretMoi = partie ? (moi === 0 ? partie.pretHote : partie.pretInvite) : false;
  const pretLui = partie ? (moi === 0 ? partie.pretInvite : partie.pretHote) : false;
  const sonNom = saFiche?.prenom?.trim() || (moi === 0 ? 'l’invité' : 'l’hôte');
  const contraintes = useMemo(() => (partie?.lien ? contraintesDuLien(partie.lien.type, moi, saFiche, sonNom) : undefined), [partie?.lien?.type, moi, saFiche?.village, saFiche?.clan, sonNom]); // eslint-disable-line react-hooks/exhaustive-deps

  // La partie démarre sur les deux écrans dès qu'elle est lancée.
  useEffect(() => {
    if (partie?.etat === 'en_cours') onDemarrer(partie);
  }, [partie?.etat]); // eslint-disable-line react-hooks/exhaustive-deps

  // L'hôte lance dès que les deux ninjas sont prêts (avec l'origine qui rend le duo cohérent, si besoin).
  const verdict = partie?.lien && partie.creationHote && partie.creationInvite ? validerLien(partie.creationHote, partie.creationInvite, partie.lien.type, undefined) : undefined;
  const origine = verdict?.erreur && verdict.suggestion && partie && !validerLien(partie.creationHote!, partie.creationInvite!, partie.lien!.type, verdict.suggestion).erreur ? verdict.suggestion : undefined;
  const incoherent = !!verdict?.erreur && !origine;
  useEffect(() => {
    if (!partie || moi !== 0 || partie.etat !== 'creation' || !partie.pretHote || !partie.pretInvite || incoherent || lancement.current) return;
    lancement.current = true;
    void essayer(async () => {
      await service.lancer(partie.id, { ...partie.lien!, origine });
      setPartie(await service.lire(partie.id));
    }).finally(() => (lancement.current = false));
  }, [partie?.pretHote, partie?.pretInvite, partie?.etat, incoherent]); // eslint-disable-line react-hooks/exhaustive-deps

  async function essayer(f: () => Promise<void>) {
    setErreur(null);
    setEnvoi(true);
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message || 'Erreur inconnue.');
    } finally {
      setEnvoi(false);
    }
  }

  const Erreur = () =>
    erreur ? (
      <p className="salon-erreur" role="alert">
        {erreur}
      </p>
    ) : null;

  // ── 3. Chacun crée son ninja ──
  if (partie?.etat === 'creation' && !pretMoi)
    return (
      <>
        <Creation
          key={`creation-${partie.id}`}
          joueur={`Partie ${formaterCode(partie.code)} · ${LIBELLES_LIEN[partie.lien!.type]} avec ${sonNom}`}
          libelleFin={envoi ? 'Envoi…' : 'Mon ninja est prêt'}
          initiale={maFiche}
          contraintes={contraintes}
          onRetour={() => setErreur('La partie est lancée : termine ton ninja, l’autre t’attend.')}
          onChange={(c: CreationT) => {
            // Le brouillon part au serveur (sans rien valider) : l'autre voit ce qu'on a pris, en direct.
            window.clearTimeout(brouillon.current);
            brouillon.current = window.setTimeout(() => void service.deposer(partie.id, c, false).catch(() => undefined), 500);
          }}
          onCommencer={(c: CreationT) =>
            void essayer(async () => {
              window.clearTimeout(brouillon.current);
              await service.deposer(partie.id, c, true);
              setPartie(await service.lire(partie.id));
            })
          }
        />
        {erreur && (
          <p className="salon-erreur salon-erreur-flottante" role="alert">
            {erreur}
          </p>
        )}
      </>
    );

  return (
    <main className="creation salon">
      <p className="creation-joueur">À deux · chacun son téléphone{service.nom === 'local' ? ' (essai : deux onglets de ce navigateur)' : ''}</p>

      {!partie && !saisie && (
        <>
          <h1 className="titre-ecran">Jouer à deux, chacun sur son téléphone</h1>
          <p className="intro">L’un crée le groupe et reçoit un code ; l’autre le rejoint. Vous choisissez ce qui vous lie, puis chacun crée son ninja. Ensuite, vos deux vies avancent chacune sur son écran, et se retrouvent aux moments communs : celui qui arrive le premier attend l’autre.</p>
          <div className="options deux">
            <button className="option" disabled={envoi} onClick={() => void essayer(async () => setPartie(await service.creer()))}>
              <strong>{envoi ? 'Création…' : 'Créer le groupe'}</strong>
              <p>Tu reçois un code à donner à l’autre joueur.</p>
            </button>
            <button className="option" onClick={() => setSaisie(true)}>
              <strong>Rejoindre un groupe</strong>
              <p>L’autre t’a donné un code de six caractères.</p>
            </button>
          </div>
        </>
      )}

      {!partie && saisie && (
        <>
          <h1 className="titre-ecran">Le code du groupe</h1>
          <div className="champ">
            <label htmlFor="code-partie">Code</label>
            <input
              id="code-partie"
              className="salon-code-saisie"
              value={code}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={7}
              placeholder="K7Q-M4P"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <button className="btn-principal" disabled={nettoyerCode(code).length !== 6 || envoi} onClick={() => void essayer(async () => setPartie(await service.rejoindre(code)))}>
            {envoi ? 'Connexion…' : 'Rejoindre'}
          </button>
        </>
      )}

      {/* ── 1. Le groupe attend l'autre ── */}
      {partie?.etat === 'attente' && (
        <>
          <h1 className="titre-ecran">Donne ce code à l’autre joueur</h1>
          <p className="salon-code" aria-label="Code du groupe">
            {formaterCode(partie.code)}
          </p>
          <button
            className="btn-secondaire"
            onClick={async () => {
              const texte = `Rejoins mon groupe sur Ninja Destiny : ${formaterCode(partie.code)}`;
              try {
                if (navigator.share) await navigator.share({ text: `${texte}\n${location.origin}` });
                else await navigator.clipboard.writeText(partie.code);
                setCopie(true);
              } catch {
                /* partage annulé */
              }
            }}
          >
            {copie ? 'Code partagé' : 'Partager le code'}
          </button>
          <p className="salon-attente">En attente de l’autre joueur…</p>
        </>
      )}

      {/* ── 2. Le lien, avant les ninjas ── */}
      {partie?.etat === 'lien' && moi === 0 && (
        <>
          <h1 className="titre-ecran">Ce qui vous lie</h1>
          <p className="intro">L’autre joueur est là. Choisis votre lien : il décidera de ce que chacun pourra choisir pour son ninja.</p>
          <div className="options deux">
            {(Object.keys(LIBELLES_LIEN) as TypeLien[]).map((t) => (
              <button key={t} className="option" aria-pressed={type === t} onClick={() => setType(t)}>
                <strong>{LIBELLES_LIEN[t]}</strong>
                <p>{DESCRIPTIONS[t]}</p>
              </button>
            ))}
          </div>
          <section className="groupe">
            <h3>Votre passé commun</h3>
            <div className="options deux">
              {(Object.keys(LIBELLES_PASSE) as PasseCommun[]).map((x) => (
                <button key={x} className="option" aria-pressed={passe === x} onClick={() => setPasse(x)}>
                  <strong>{LIBELLES_PASSE[x].nom}</strong>
                  <p>{LIBELLES_PASSE[x].texte}</p>
                </button>
              ))}
            </div>
          </section>
          <button className="btn-principal" disabled={envoi} onClick={() => void essayer(async () => {
            await service.choisirLien(partie.id, { type, passe, sauveur: passe === 'dette' ? 0 : undefined });
            setPartie(await service.lire(partie.id));
          })}>
            {envoi ? 'Envoi…' : 'Valider le lien : chacun crée son ninja'}
          </button>
        </>
      )}
      {partie?.etat === 'lien' && moi === 1 && (
        <>
          <h1 className="titre-ecran">Tu as rejoint le groupe</h1>
          <p className="salon-attente">L’hôte choisit ce qui vous lie. Tu créeras ton ninja juste après.</p>
        </>
      )}

      {/* ── 3 bis. Mon ninja est prêt, j'attends l'autre ── */}
      {partie?.etat === 'creation' && pretMoi && (
        <>
          <h1 className="titre-ecran">{maFiche?.prenom} est prêt</h1>
          <p className="sous-titre">
            {LIBELLES_LIEN[partie.lien!.type]} · {maFiche && `${R.villages[maFiche.village]?.nom}, ${R.clans[maFiche.clan]?.nom}`}
          </p>
          {pretLui ? (
            incoherent ? (
              <p className="salon-erreur" role="alert">
                Vos deux ninjas ne collent pas avec votre lien : {verdict?.erreur} L’un de vous doit modifier le sien.
              </p>
            ) : (
              <p className="salon-attente">{sonNom} est prêt aussi. La partie commence…</p>
            )
          ) : (
            <p className="salon-attente">{saFiche?.prenom ? `${saFiche.prenom} termine son ninja…` : 'L’autre joueur crée son ninja…'}</p>
          )}
          <button className="btn-secondaire" disabled={envoi} onClick={() => void essayer(async () => {
            await service.deposer(partie.id, maFiche!, false);
            setPartie(await service.lire(partie.id));
          })}>
            Modifier mon ninja
          </button>
        </>
      )}

      <Erreur />
      <div className="creation-barre">
        <button
          className="btn-secondaire"
          onClick={() => {
            if (partie || saisie) {
              memoriserPartie(null);
              setPartie(null);
              setSaisie(false);
              setErreur(null);
            } else onRetour();
          }}
        >
          {partie || saisie ? 'Quitter le groupe' : 'Retour'}
        </button>
      </div>
    </main>
  );
}
