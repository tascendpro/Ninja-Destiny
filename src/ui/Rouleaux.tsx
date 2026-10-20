'use client';

import { useMemo, useState } from 'react';
import type { FicheTechnique, GameState, RangTechnique, TypeTechnique } from '../engine/types';
import { R } from '../engine/registre';

const TYPES: Record<TypeTechnique, string> = {
  ninjutsu: 'Ninjutsu',
  taijutsu: 'Taijutsu',
  genjutsu: 'Genjutsu',
  fuinjutsu: 'Fūinjutsu',
  kuchiyose: 'Kuchiyose',
  dojutsu: 'Dōjutsu',
  iryo: 'Médecine',
  sensoriel: 'Sensoriel',
  marionnette: 'Marionnettes',
  armes: 'Armes',
  clones: 'Clones',
  deplacement: 'Déplacement',
  transformation: 'Transformation',
  biju: 'Bijū',
  sceau_maudit: 'Sceaux maudits',
  dimensionnel: 'Dimensionnel',
  six_chemins: 'Six Chemins',
};
const ORIGINES: Record<FicheTechnique['origine'], string> = { manga: 'Manga', anime: 'Anime', boruto: 'Boruto', jeu: 'Version du jeu', original: 'Création originale' };
const RANGS: RangTechnique[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'];
const NOM_ELEMENT: Record<string, string> = {
  katon: 'Katon',
  suiton: 'Suiton',
  fuuton: 'Fūton',
  raiton: 'Raiton',
  doton: 'Doton',
  futton: 'Futton',
  yoton: 'Yōton',
  hyoton: 'Hyōton',
  ranton: 'Ranton',
  mokuton: 'Mokuton',
  jiton: 'Jiton',
  bakuton: 'Bakuton',
  shakuton: 'Shakuton',
  shoton: 'Shōton',
  jinton: 'Jinton',
};

/** Le catalogue des techniques : filtres par clan, type, élément, rang, origine ; les kinjutsu à part. */
export default function Rouleaux({ etat }: { etat: GameState | null }) {
  const [texte, setTexte] = useState('');
  const [type, setType] = useState('');
  const [element, setElement] = useState('');
  const [rang, setRang] = useState('');
  const [clan, setClan] = useState('');
  const [origine, setOrigine] = useState('');
  const [interdites, setInterdites] = useState(false);
  const toutes = R.contenu.catalogue;
  const clans = useMemo(() => Array.from(new Set(toutes.map((f) => f.clan).filter(Boolean))) as string[], [toutes]);
  const elements = useMemo(() => Array.from(new Set(toutes.flatMap((f) => f.elements ?? []))), [toutes]);
  const q = texte.trim().toLowerCase();
  const fiches = toutes.filter(
    (f) =>
      (!q || `${f.japonais} ${f.francais} ${(f.utilisateurs ?? []).join(' ')}`.toLowerCase().includes(q)) &&
      (!type || f.types.includes(type as TypeTechnique)) &&
      (!element || f.elements?.includes(element)) &&
      (!rang || f.rang === rang) &&
      (!clan || f.clan === clan) &&
      (!origine || f.origine === origine) &&
      (!interdites || !!f.kinjutsu),
  );
  const connue = (f: FicheTechnique) => !!(f.jouable && etat && (etat.maitrises[f.jouable]?.tier ?? 0) >= 1);
  const nomClan = (id: string) => R.clans[id]?.nom ?? id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <div className="rouleaux">
      <p className="sous-titre">
        {toutes.length} techniques répertoriées, du manga, de l’anime, de Boruto, et créées pour le jeu. Celles que tu maîtrises sont marquées ✓.
      </p>
      <div className="rouleaux-filtres">
        <input type="search" placeholder="Chercher un nom, un ninja…" value={texte} onChange={(e) => setTexte(e.target.value)} aria-label="Chercher une technique" />
        <select value={clan} onChange={(e) => setClan(e.target.value)} aria-label="Clan">
          <option value="">Tous les clans</option>
          {clans.map((c) => (
            <option key={c} value={c}>
              {nomClan(c)}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">Tous les types</option>
          {Object.entries(TYPES).map(([id, nom]) => (
            <option key={id} value={id}>
              {nom}
            </option>
          ))}
        </select>
        <select value={element} onChange={(e) => setElement(e.target.value)} aria-label="Élément">
          <option value="">Tous les éléments</option>
          {elements.map((e) => (
            <option key={e} value={e}>
              {NOM_ELEMENT[e] ?? e}
            </option>
          ))}
        </select>
        <select value={rang} onChange={(e) => setRang(e.target.value)} aria-label="Rang">
          <option value="">Tous les rangs</option>
          {RANGS.map((r) => (
            <option key={r} value={r}>
              Rang {r}
            </option>
          ))}
        </select>
        <select value={origine} onChange={(e) => setOrigine(e.target.value)} aria-label="Origine">
          <option value="">Toutes origines</option>
          {Object.entries(ORIGINES).map(([id, nom]) => (
            <option key={id} value={id}>
              {nom}
            </option>
          ))}
        </select>
        <label className="rouleaux-kinjutsu">
          <input type="checkbox" checked={interdites} onChange={(e) => setInterdites(e.target.checked)} /> Kinjutsu seulement
        </label>
      </div>
      <p className="sous-titre">{fiches.length} résultat{fiches.length > 1 ? 's' : ''}.</p>
      {fiches.map((f) => (
        <details key={f.id} className={`entree fiche-technique${f.kinjutsu ? ' interdite' : ''}`}>
          <summary>
            <span>
              <strong>{f.japonais}</strong>
              {connue(f) && <b className="ft-connue"> ✓</b>}
              <small className="ft-francais"> {f.francais}</small>
            </span>
            <span className="ft-badges">
              <span className={`ft-rang rang-${f.rang}`}>
                {f.rang}
                {f.rangEstime ? '*' : ''}
              </span>
              {f.kinjutsu && <span className="ft-kinjutsu">Kinjutsu</span>}
            </span>
          </summary>
          <dl className="ft-details">
            <dt>Type</dt>
            <dd>{f.types.map((t) => TYPES[t]).join(', ')}</dd>
            {f.clan && (
              <>
                <dt>Clan</dt>
                <dd>{nomClan(f.clan)}</dd>
              </>
            )}
            {f.utilisateurs && (
              <>
                <dt>Utilisateurs</dt>
                <dd>{f.utilisateurs.join(', ')}</dd>
              </>
            )}
            {f.elements && f.elements.length > 0 && (
              <>
                <dt>Élément</dt>
                <dd>{f.elements.map((e) => NOM_ELEMENT[e] ?? e).join(', ')}</dd>
              </>
            )}
            <dt>Rang</dt>
            <dd>
              {f.rang}
              {f.rangEstime && ' (estimé pour le jeu)'}
            </dd>
            <dt>Chakra</dt>
            <dd>{f.chakra}</dd>
            <dt>Portée</dt>
            <dd>{f.portee}</dd>
            <dt>Zone</dt>
            <dd>{f.zone}</dd>
            <dt>Effets</dt>
            <dd>{f.effets}</dd>
            <dt>Faiblesses</dt>
            <dd>{f.faiblesses}</dd>
            <dt>Apprentissage</dt>
            <dd>{f.apprentissage}</dd>
            <dt>Maîtrise</dt>
            <dd>{f.maitrise}</dd>
            <dt>Origine</dt>
            <dd>{ORIGINES[f.origine]}</dd>
            {f.kinjutsu && (
              <>
                <dt>Interdite</dt>
                <dd className="ft-alerte">{f.kinjutsu}</dd>
              </>
            )}
            {f.consequences && (
              <>
                <dt>Conséquences</dt>
                <dd className="ft-alerte">{f.consequences}</dd>
              </>
            )}
            <dt>Dans le jeu</dt>
            <dd>{f.jouable ? `Jouable : ${R.maitrises[f.jouable]?.nom ?? f.jouable}` : 'Référence seulement'}</dd>
          </dl>
        </details>
      ))}
    </div>
  );
}
