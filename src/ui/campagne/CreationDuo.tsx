'use client';

// La création à deux : chacun crée son ninja avec le même écran que le solo, puis vous définissez ensemble ce qui vous lie.

import { useState } from 'react';
import type { Creation as CreationT } from '../../engine/types';
import type { IdJoueur, OrigineLien, PasseCommun, TypeLien } from '../../engine/campagne/types';
import { LIBELLES_LIEN, LIBELLES_ORIGINE, LIBELLES_PASSE, validerLien } from '../../engine/campagne/moteur';
import { R } from '../../engine/registre';
import Creation from '../Creation';

const DESCRIPTIONS: Record<TypeLien, string> = {
  freres: 'Même famille, même toit. Protection, jalousie, complicité.',
  clan: 'Le même sang, deux familles. Les attentes du clan pèsent sur vous deux.',
  amis: 'Rencontrés enfants. Les premières promesses, les premières disputes.',
  rivaux: 'Chacun veut dépasser l’autre. Ça ne vous empêche pas de vous entraider.',
  inconnus: 'Vous ne vous connaissez pas encore. Votre rencontre se joue.',
  clans_differents: 'Deux familles qui se méfient l’une de l’autre.',
  villages_differents: 'Deux villages, deux camps. Leur politique pèsera sur vous.',
  improbable: 'Un survivant et celui qui l’a entendu, sous les décombres.',
};

export interface LienChoisi {
  type: TypeLien;
  origine?: OrigineLien;
  passe: PasseCommun;
  sauveur?: IdJoueur;
}

export default function CreationDuo({ onCommencer, onRetour }: { onCommencer: (c1: CreationT, c2: CreationT, lien: LienChoisi) => void; onRetour: () => void }) {
  const [etape, setEtape] = useState<0 | 1 | 2>(0);
  const [c1, setC1] = useState<CreationT | null>(null);
  const [c2, setC2] = useState<CreationT | null>(null);
  const [type, setType] = useState<TypeLien>('amis');
  const [origine, setOrigine] = useState<OrigineLien | undefined>(undefined);
  const [passe, setPasse] = useState<PasseCommun>('rencontre');
  const [sauveur, setSauveur] = useState<IdJoueur>(0);

  if (etape === 0)
    return (
      <Creation
        key="j1"
        joueur="Joueur 1 · crée ton ninja"
        libelleFin="Au joueur 2"
        onRetour={onRetour}
        onCommencer={(c) => {
          setC1(c);
          setEtape(1);
        }}
      />
    );
  if (etape === 1 || !c1 || !c2)
    return (
      // Une clé à part : sans elle, React garderait l'écran du joueur 1, arrivé au récapitulatif.
      <Creation
        key="j2"
        joueur={`Joueur 2 · crée ton ninja${c1 ? ` (aux côtés de ${c1.prenom})` : ''}`}
        libelleFin="Définir votre lien"
        onRetour={() => setEtape(0)}
        onCommencer={(c) => {
          setC2(c);
          setEtape(2);
        }}
      />
    );

  const v = validerLien(c1, c2, type, origine);
  const noms = [c1.prenom, c2.prenom];
  return (
    <main className="creation creation-duo">
      <p className="creation-joueur">À deux · ce qui vous lie</p>
      <h1 className="titre-etape">
        {noms[0]} et {noms[1]}
      </h1>
      <p className="sous-titre">
        {R.villages[c1.village]?.nom}, {R.clans[c1.clan]?.nom} · {R.villages[c2.village]?.nom}, {R.clans[c2.clan]?.nom}
      </p>

      <section className="groupe">
        <h3>Votre lien</h3>
        <div className="options deux">
          {(Object.keys(LIBELLES_LIEN) as TypeLien[]).map((t) => (
            <button
              key={t}
              className="option"
              aria-pressed={type === t}
              onClick={() => {
                setType(t);
                setOrigine(undefined);
              }}
            >
              <strong>{LIBELLES_LIEN[t]}</strong>
              <p>{DESCRIPTIONS[t]}</p>
            </button>
          ))}
        </div>
        {v.erreur && (
          <div className="duo-coherence" role="alert">
            <p>{v.erreur}</p>
            {v.suggestion && (
              <button className="btn-secondaire" onClick={() => setOrigine(v.suggestion)}>
                Choisir l’origine « {LIBELLES_ORIGINE[v.suggestion]} » ?
              </button>
            )}
          </div>
        )}
        {origine && !v.erreur && <p className="duo-origine">Origine : {LIBELLES_ORIGINE[origine]}.</p>}
      </section>

      <section className="groupe">
        <h3>Votre passé commun</h3>
        <div className="options deux">
          {(Object.keys(LIBELLES_PASSE) as PasseCommun[]).map((p) => (
            <button key={p} className="option" aria-pressed={passe === p} onClick={() => setPasse(p)}>
              <strong>{LIBELLES_PASSE[p].nom}</strong>
              <p>{LIBELLES_PASSE[p].texte}</p>
            </button>
          ))}
        </div>
        {passe === 'dette' && (
          <div className="options deux" style={{ marginTop: 10 }} role="group" aria-label="Qui a sauvé l’autre">
            {([0, 1] as IdJoueur[]).map((j) => (
              <button key={j} className="option" aria-pressed={sauveur === j} onClick={() => setSauveur(j)}>
                <strong>{noms[j]} a sauvé {noms[1 - j]}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="creation-barre">
        <button className="btn-secondaire" onClick={() => setEtape(1)}>
          Précédent
        </button>
        <button className="btn-principal" disabled={!!v.erreur} onClick={() => onCommencer(c1, c2, { type, origine, passe, sauveur: passe === 'dette' ? sauveur : undefined })}>
          Commencer la campagne
        </button>
      </div>
    </main>
  );
}
