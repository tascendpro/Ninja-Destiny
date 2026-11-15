'use client';

// Le salon de la partie en ligne : créer une partie et donner le code, ou rejoindre avec un code. Chacun crée son ninja
// sur son téléphone ; quand les deux sont là, l'hôte choisit ce qui vous lie, et la partie commence sur les deux écrans.

import { useEffect, useState } from 'react';
import type { Creation as CreationT } from '../../engine/types';
import type { PasseCommun, TypeLien } from '../../engine/campagne/types';
import { LIBELLES_LIEN, LIBELLES_PASSE, validerLien } from '../../engine/campagne/moteur';
import { R } from '../../engine/registre';
import Creation from '../Creation';
import { formaterCode, nettoyerCode, serviceEnLigne, type PartieDistante } from './enLigne';

type Etape = 'choix' | 'creer' | 'code' | 'rejoindre' | 'attente';

export default function Salon({ onDemarrer, onRetour }: { onDemarrer: (p: PartieDistante) => void; onRetour: () => void }) {
  const service = serviceEnLigne();
  const [etape, setEtape] = useState<Etape>('choix');
  const [partie, setPartie] = useState<PartieDistante | null>(null);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [type, setType] = useState<TypeLien>('amis');
  const [passe, setPasse] = useState<PasseCommun>('rencontre');
  const [copie, setCopie] = useState(false);

  // La partie bouge (l'invité arrive, l'hôte lance) : on suit, et on démarre quand elle est lancée.
  useEffect(() => {
    if (!partie) return;
    if (partie.etat === 'en_cours') return onDemarrer(partie);
    return service.ecouterPartie(partie.id, (p) => (p.etat === 'en_cours' ? onDemarrer(p) : setPartie(p)));
  }, [partie?.id, partie?.etat]); // eslint-disable-line react-hooks/exhaustive-deps

  const essayer = async (f: () => Promise<void>) => {
    setErreur(null);
    setEnvoi(true);
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  if (etape === 'creer')
    return (
      <Creation
        joueur="Partie en ligne · ton ninja"
        libelleFin={envoi ? 'Création…' : 'Créer la partie'}
        onRetour={() => setEtape('choix')}
        onCommencer={(c: CreationT) =>
          void essayer(async () => {
            setPartie(await service.creer(c));
            setEtape('attente');
          })
        }
      />
    );
  if (etape === 'rejoindre')
    return (
      <Creation
        joueur={`Partie ${formaterCode(nettoyerCode(code))} · ton ninja`}
        libelleFin={envoi ? 'Connexion…' : 'Rejoindre la partie'}
        onRetour={() => setEtape('code')}
        onCommencer={(c: CreationT) =>
          void essayer(async () => {
            setPartie(await service.rejoindre(code, c));
            setEtape('attente');
          }).then(() => undefined)
        }
      />
    );

  const hote = partie?.siege === 0;
  const invite = partie?.creationInvite;
  const v = partie && invite ? validerLien(partie.creationHote, invite, type, undefined) : undefined;
  const origine = v?.erreur ? v.suggestion : undefined;
  const lienOk = !!v && (!v.erreur || (!!origine && !validerLien(partie!.creationHote, invite!, type, origine).erreur));

  return (
    <main className="creation salon">
      <p className="creation-joueur">À deux · deux téléphones{service.nom === 'local' ? ' (essai : deux onglets de ce navigateur)' : ''}</p>
      {etape === 'choix' && (
        <>
          <h1 className="titre-ecran">Jouer à deux, chacun sur son téléphone</h1>
          <p className="intro">L’un crée la partie et reçoit un code. L’autre entre ce code. Vos deux vies avancent chacune sur son écran, et se retrouvent aux moments communs : celui qui arrive le premier attend l’autre.</p>
          <div className="options deux">
            <button className="option" onClick={() => setEtape('creer')}>
              <strong>Créer une partie</strong>
              <p>Tu crées ton ninja, puis tu donnes le code à l’autre joueur.</p>
            </button>
            <button className="option" onClick={() => setEtape('code')}>
              <strong>Rejoindre une partie</strong>
              <p>L’autre t’a donné un code de six caractères.</p>
            </button>
          </div>
        </>
      )}

      {etape === 'code' && (
        <>
          <h1 className="titre-ecran">Le code de la partie</h1>
          <div className="champ">
            <label htmlFor="code-partie">Code</label>
            <input
              id="code-partie"
              className="salon-code-saisie"
              value={code}
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              maxLength={7}
              placeholder="K7Q-M4P"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <button className="btn-principal" disabled={nettoyerCode(code).length !== 6} onClick={() => setEtape('rejoindre')}>
            Créer mon ninja
          </button>
        </>
      )}

      {etape === 'attente' && partie && (
        <>
          {partie.etat === 'attente' && (
            <>
              <h1 className="titre-ecran">Donne ce code à l’autre joueur</h1>
              <p className="salon-code" aria-label="Code de la partie">
                {formaterCode(partie.code)}
              </p>
              <button
                className="btn-secondaire"
                onClick={async () => {
                  const texte = `Rejoins ma partie de Ninja Destiny : ${formaterCode(partie.code)}`;
                  try {
                    if (navigator.share) await navigator.share({ text: texte });
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
          {partie.etat === 'lien' && hote && invite && (
            <>
              <h1 className="titre-ecran">
                {partie.creationHote.prenom} et {invite.prenom}
              </h1>
              <p className="sous-titre">
                {invite.prenom} : {R.villages[invite.village]?.nom}, {R.clans[invite.clan]?.nom}
              </p>
              <section className="groupe">
                <h3>Ce qui vous lie</h3>
                <div className="options deux">
                  {(Object.keys(LIBELLES_LIEN) as TypeLien[]).map((t) => {
                    const r = validerLien(partie.creationHote, invite, t, undefined);
                    const possible = !r.erreur || (!!r.suggestion && !validerLien(partie.creationHote, invite, t, r.suggestion).erreur);
                    return (
                      <button key={t} className="option" aria-pressed={type === t} disabled={!possible} onClick={() => setType(t)}>
                        <strong>{LIBELLES_LIEN[t]}</strong>
                        {!possible && <p>Impossible avec vos deux ninjas.</p>}
                      </button>
                    );
                  })}
                </div>
              </section>
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
              <button
                className="btn-principal"
                disabled={!lienOk || envoi}
                onClick={() =>
                  void essayer(async () => {
                    await service.lancer(partie.id, { type, origine, passe, sauveur: passe === 'dette' ? 0 : undefined });
                    setPartie(await service.lire(partie.id));
                  })
                }
              >
                {envoi ? 'Lancement…' : 'Commencer la partie'}
              </button>
            </>
          )}
          {partie.etat === 'lien' && !hote && (
            <>
              <h1 className="titre-ecran">Tu as rejoint la partie</h1>
              <p className="salon-attente">{partie.creationHote.prenom} choisit ce qui vous lie. La partie commencera sur ton écran dès qu’elle sera lancée.</p>
            </>
          )}
        </>
      )}

      {erreur && (
        <p className="salon-erreur" role="alert">
          {erreur}
        </p>
      )}
      <div className="creation-barre">
        <button className="btn-secondaire" onClick={() => (etape === 'choix' ? onRetour() : setEtape('choix'))}>
          {etape === 'choix' ? 'Retour' : 'Annuler'}
        </button>
      </div>
    </main>
  );
}
