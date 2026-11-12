// La mise en page des dialogues : chaque réplique part à la ligne derrière un tiret, comme dans un roman.
// « Tu viens ? » {Il} hésite. « Non. » devient :
//   — Tu viens ?
//   Il hésite.
//   — Non.
// L'incise reste avec sa réplique (« — C'est toi, dit-il. »). Une parole qui suit immédiatement une incise est du même
// personnage (« … », décide le grand. « … ») : elle reste sur la même ligne. Après « tu réponds », c'est l'autre qui
// reprend : nouvelle ligne. Les guillemets qui ne sont pas des paroles (un nom, un titre) restent dans la phrase.

export interface Morceau {
  texte: string;
  parole?: boolean;
}

export interface Ligne {
  replique: boolean;
  morceaux: Morceau[];
}

/** Une incise où c'est toi qui parles (« tu réponds », « dis-tu ») : la parole qui suit est celle de l'autre. */
const INCISE_TOI = /^\s*,\s*(?:tu|toi)\b|-tu\b/i;

/** Ce qui est entre guillemets est-il une parole ? Oui s'il finit comme une phrase, ou s'il est suivi d'une incise. */
function estParole(contenu: string, apres: string): boolean {
  return /[.!?…]$/.test(contenu.trim()) || /^\s*,/.test(apres);
}

export function decouper(paragraphe: string): Ligne[] {
  const morceaux: { t: string; q: boolean }[] = [];
  let dernier = 0;
  for (const m of paragraphe.matchAll(/«([^«»]*)»/g)) {
    morceaux.push({ t: paragraphe.slice(dernier, m.index), q: false });
    morceaux.push({ t: m[1], q: true });
    dernier = (m.index ?? 0) + m[0].length;
  }
  morceaux.push({ t: paragraphe.slice(dernier), q: false });

  // Les guillemets qui ne sont pas des paroles rejoignent le texte qui les entoure.
  const parts: { t: string; q: boolean }[] = [];
  for (let i = 0; i < morceaux.length; i++) {
    const x = morceaux[i];
    if (x.q && !estParole(x.t, morceaux[i + 1]?.t ?? '')) {
      const prec = parts[parts.length - 1];
      const texte = `«${x.t}»`;
      if (prec && !prec.q) prec.t += texte;
      else parts.push({ t: texte, q: false });
      continue;
    }
    const prec = parts[parts.length - 1];
    if (!x.q && prec && !prec.q) prec.t += x.t;
    else parts.push({ ...x });
  }

  const lignes: Ligne[] = [];
  let cur: (Ligne & { incise?: string; suite?: boolean }) | undefined;
  const fermer = () => {
    if (cur && cur.morceaux.some((m) => m.texte.trim())) lignes.push({ replique: cur.replique, morceaux: cur.morceaux });
    cur = undefined;
  };
  for (const p of parts) {
    if (p.q) {
      const contenu = p.t.trim();
      const memeVoix = cur?.replique && cur.incise !== undefined && !cur.suite && !INCISE_TOI.test(cur.incise);
      if (memeVoix && cur) {
        cur.morceaux.push({ texte: ' ' }, { texte: contenu, parole: true });
        cur.incise = undefined;
      } else {
        fermer();
        cur = { replique: true, morceaux: [{ texte: contenu, parole: true }] };
      }
      continue;
    }
    let t = p.t;
    if (!t.trim()) continue;
    if (cur?.replique && /^\s*,/.test(t)) {
      // L'incise : jusqu'à la fin de sa phrase. Le reste est du récit.
      const fin = t.search(/[.!?…](?=\s|$)/);
      const incise = fin >= 0 ? t.slice(0, fin + 1) : t;
      cur.morceaux.push({ texte: incise.replace(/^\s+/, '') });
      cur.incise = incise;
      t = fin >= 0 ? t.slice(fin + 1) : '';
      if (!t.trim()) continue;
      cur.suite = true;
    }
    if (cur && !cur.replique) cur.morceaux.push({ texte: t });
    else {
      fermer();
      cur = { replique: false, morceaux: [{ texte: t.trim() }] };
    }
  }
  fermer();
  // Le récit garde ses espaces internes, mais pas ceux des bords.
  for (const l of lignes) {
    const premier = l.morceaux[0];
    const der = l.morceaux[l.morceaux.length - 1];
    if (premier && !premier.parole) premier.texte = premier.texte.replace(/^\s+/, '');
    if (der && !der.parole) der.texte = der.texte.replace(/\s+$/, '');
  }
  return lignes;
}

/** Le paragraphe contient-il au moins une parole ? */
export function aDesRepliques(paragraphe: string): boolean {
  return decouper(paragraphe).some((l) => l.replique);
}
