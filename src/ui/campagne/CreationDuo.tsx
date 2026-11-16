'use client';

// La création à deux : d'abord ce qui vous lie (le lien décide de ce qui est possible), puis chacun crée son ninja
// avec le même écran que le solo, contraint par ce lien (frères : même famille ; villages différents : l'autre village
// est fermé…), enfin un récapitulatif à deux.

import { useState } from 'react';
import type { Creation as CreationT } from '../../engine/types';
import type { IdJoueur, OrigineLien, PasseCommun, TypeLien } from '../../engine/campagne/types';
import { REGLES_COMBAT } from '../../engine/combat/types';
import { LIBELLES_LIEN, LIBELLES_ORIGINE, LIBELLES_PASSE, passesDuLien, validerLien } from '../../engine/campagne/moteur';
import { R } from '../../engine/registre';
import Creation from '../Creation';
import { contraintesDuLien } from '../creationAides';

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
  regles?: number;
}

export default function CreationDuo({ onCommencer, onRetour }: { onCommencer: (c1: CreationT, c2: CreationT, lien: LienChoisi) => void; onRetour: () => void }) {
  const [etape, setEtape] = useState<'lien' | 'j1' | 'j2' | 'recap'>('lien');
  const [c1, setC1] = useState<CreationT | null>(null);
  const [c2, setC2] = useState<CreationT | null>(null);
  const [type, setType] = useState<TypeLien>('amis');
  const [origine, setOrigine] = useState<OrigineLien | undefined>(undefined);
  const [passeChoisi, setPasse] = useState<PasseCommun>('rencontre');
  // Un passé qui n'existe pas pour le lien choisi (« depuis toujours » pour des inconnus) cède la place au premier possible.
  const passe: PasseCommun = passesDuLien(type).some((x) => x.id === passeChoisi) ? passeChoisi : passesDuLien(type)[0].id;
  const [sauveur, setSauveur] = useState<IdJoueur>(0);

  /** Tire un lien et un passé au hasard (avant les ninjas : tout reste possible). */
  const lienAuHasard = () => {
    const types = Object.keys(LIBELLES_LIEN) as TypeLien[];
    const t = types[Math.floor(Math.random() * types.length)];
    const passes = passesDuLien(t);
    setType(t);
    setOrigine(undefined);
    setPasse(passes[Math.floor(Math.random() * passes.length)].id);
  };

  if (etape === 'lien')
    return (
      <main className="creation creation-duo">
        <p className="creation-joueur">À deux · étape 1 sur 4</p>
        <h1 className="titre-etape">Ce qui vous lie</h1>
        <p className="sous-titre">Le lien se choisit d’abord : il décide de ce que vos deux ninjas peuvent être. Des frères partagent un village et un clan ; des rivaux de villages différents, non.</p>

        <div className="raccourcis-actions duo-hasard">
          <button className="raccourci-des" onClick={lienAuHasard}>
            <span aria-hidden="true">縁</span>
            <strong>Un lien au hasard</strong>
          </button>
        </div>

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
        </section>

        <section className="groupe">
          <h3>Votre passé commun</h3>
          <div className="options deux">
            {passesDuLien(type).map(({ id: p, nom, texte }) => (
              <button key={p} className="option" aria-pressed={passe === p} onClick={() => setPasse(p)}>
                <strong>{nom}</strong>
                <p>{texte}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="creation-barre">
          <button className="btn-secondaire" onClick={onRetour}>
            Retour
          </button>
          <button className="btn-principal" onClick={() => setEtape('j1')}>
            Joueur 1 : créer son ninja
          </button>
        </div>
      </main>
    );

  if (etape === 'j1' || !c1)
    return (
      <Creation
        key="j1"
        joueur={`Joueur 1 · ${LIBELLES_LIEN[type]} · crée ton ninja`}
        libelleFin="Au joueur 2"
        initiale={c1 ?? undefined}
        contraintes={contraintesDuLien(type, 0, undefined, 'le joueur 2')}
        onRetour={() => setEtape('lien')}
        onCommencer={(c) => {
          setC1(c);
          setEtape('j2');
        }}
      />
    );
  if (etape === 'j2' || !c2)
    return (
      // Une clé à part : sans elle, React garderait l'écran du joueur 1, arrivé au récapitulatif.
      <Creation
        key="j2"
        joueur={`Joueur 2 · ${LIBELLES_LIEN[type]} avec ${c1.prenom} · crée ton ninja`}
        libelleFin="Récapitulatif"
        modele={c1}
        initiale={c2 ?? undefined}
        contraintes={contraintesDuLien(type, 1, c1, c1.prenom)}
        onRetour={() => setEtape('j1')}
        onCommencer={(c) => {
          setC2(c);
          setEtape('recap');
        }}
      />
    );

  const v = validerLien(c1, c2, type, origine);
  const noms = [c1.prenom, c2.prenom];
  return (
    <main className="creation creation-duo">
      <p className="creation-joueur">À deux · étape 4 sur 4</p>
      <h1 className="titre-etape">
        {noms[0]} et {noms[1]}
      </h1>
      <p className="sous-titre">
        {LIBELLES_LIEN[type]} · {passesDuLien(type).find((x) => x.id === passe)?.nom ?? LIBELLES_PASSE[passe].nom}
      </p>
      <div className="cartes-duo">
        {([c1, c2] as CreationT[]).map((c, j) => (
          <div key={j} className={`carte-duo joueur-${j}`}>
            <strong>{c.prenom}</strong>
            <span>
              {R.villages[c.village]?.nom} · {R.clans[c.clan]?.nom}
            </span>
            <span className="carte-detail">{R.elements[c.element]?.nom}</span>
          </div>
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

      {passe === 'dette' && (
        <section className="groupe">
          <h3>Qui a sauvé l’autre ?</h3>
          <div className="options deux" role="group" aria-label="Qui a sauvé l’autre">
            {([0, 1] as IdJoueur[]).map((j) => (
              <button key={j} className="option" aria-pressed={sauveur === j} onClick={() => setSauveur(j)}>
                <strong>
                  {noms[j]} a sauvé {noms[1 - j]}
                </strong>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="creation-barre">
        <button className="btn-secondaire" onClick={() => setEtape('j2')}>
          Précédent
        </button>
        <button className="btn-principal" disabled={!!v.erreur} onClick={() => onCommencer(c1, c2, { type, origine, passe, sauveur: passe === 'dette' ? sauveur : undefined, regles: REGLES_COMBAT })}>
          Commencer la campagne
        </button>
      </div>
    </main>
  );
}
