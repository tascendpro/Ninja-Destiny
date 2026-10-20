import type { GameState, Texte } from './types';
import { R } from './registre';
import { evaluer } from './conditions';
import { defPnj, resoudrePnj } from './etat';

export const JETONS_CONNUS = [
  'prenom',
  'biju',
  'causeMort',
  'nom',
  'e',
  'il',
  'Il',
  'village',
  'villageComplet',
  'pays',
  'kage',
  'kageNom',
  'clan',
  'clanOuFamille',
  'parent',
  'Parent',
  'parentNom',
  'parent_e',
  'parent_il',
  'aine',
  'Aine',
  'aineNom',
  'AineNom',
  'aine_il',
  'Aine_il',
  'Parent_il',
  'aine_e',
  'element',
  'arme',
  'age',
  'conjoint',
  'Conjoint',
  'conjointNom',
  'conjoint_il',
  'conjoint_e',
  'enfant',
  'Enfant',
  'enfantNom',
  'enfant_il',
  'Enfant_il',
  'enfant_e',
  'enfant_le',
  'mortRecente',
  'mortRecente_e',
  'mortRecenteCause',
];

/** La famille fondée au chapitre 4 : genres choisis ou tirés (drapeaux), prénoms stables tirés des noms du village. */
function famille(s: GameState): { conjointF: boolean; enfantF: boolean; conjointNom: string; enfantNom: string } {
  const conjointF = s.drapeaux['conjoint_genre'] !== 'm';
  const enfantF = s.drapeaux['enfant_genre'] === 'f';
  const noms = R.contenu.noms[s.creation.village];
  const pick = (l: string[] | undefined, k: number) => (l?.length ? l[Math.abs(k) % l.length] : '');
  return {
    conjointF,
    enfantF,
    conjointNom: pick(conjointF ? noms?.f : noms?.m, s.naissance * 7 + 3),
    enfantNom: pick(enfantF ? noms?.f : noms?.m, s.naissance * 13 + 11),
  };
}

function accord(s: GameState): { e: string; il: string } {
  const p = s.creation.presentation;
  if (p === 'feminin') return { e: 'e', il: 'elle' };
  if (p === 'neutre') return { e: '·e', il: 'iel' };
  return { e: '', il: 'il' };
}

function majuscule(x: string): string {
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export function valeurJeton(s: GameState, jeton: string): string | undefined {
  const village = R.villages[s.creation.village];
  const clan = R.clans[s.creation.clan];
  const a = accord(s);
  const parent = defPnj(s, s.roles['parent']);
  const aine = defPnj(s, s.roles['aine']);
  const orphelin = s.creation.origine === 'orphelin';

  if (jeton.startsWith('@')) return defPnj(s, resoudrePnj(s, jeton))?.nom;
  const m = /^(il|Il|e|le):(@?[\w-]+)$/.exec(jeton);
  if (m) {
    const d = defPnj(s, resoudrePnj(s, m[2]));
    if (!d) return undefined;
    const f = d.genre === 'f';
    if (m[1] === 'il') return f ? 'elle' : 'il';
    if (m[1] === 'Il') return f ? 'Elle' : 'Il';
    if (m[1] === 'le') return f ? 'la' : 'le';
    return f ? 'e' : '';
  }

  switch (jeton) {
    case 'prenom':
      return s.creation.prenom;
    case 'nom':
      return s.creation.nom;
    case 'e':
      return a.e;
    case 'il':
      return a.il;
    case 'Il':
      return majuscule(a.il);
    case 'village':
      return village?.nom;
    case 'villageComplet':
      return village?.nomComplet;
    case 'pays':
      return village?.pays;
    case 'kage':
      return village?.kage;
    case 'kageNom':
      return village?.kageNom;
    case 'clan':
      return clan?.nom;
    case 'clanOuFamille':
      return s.creation.clan !== 'sans_clan' ? `le clan ${clan?.nom}` : orphelin ? 'l’orphelinat' : 'ta famille';
    case 'parent':
      return orphelin ? (parent?.genre === 'f' ? 'ta tutrice' : 'ton tuteur') : parent?.genre === 'f' ? 'ta mère' : 'ton père';
    case 'Parent':
      return orphelin ? (parent?.genre === 'f' ? 'Ta tutrice' : 'Ton tuteur') : parent?.genre === 'f' ? 'Ta mère' : 'Ton père';
    case 'parentNom':
      return parent?.nom;
    case 'parent_e':
      return parent?.genre === 'f' ? 'e' : '';
    case 'parent_il':
      return parent?.genre === 'f' ? 'elle' : 'il';
    case 'aine':
      return (aine?.genre === 'f' ? 'ta grande sœur' : 'ton grand frère') + (orphelin ? ' de cœur' : '');
    case 'Aine':
      return (aine?.genre === 'f' ? 'Ta grande sœur' : 'Ton grand frère') + (orphelin ? ' de cœur' : '');
    case 'aineNom':
    case 'AineNom':
      return aine?.nom;
    case 'aine_il':
      return aine?.genre === 'f' ? 'elle' : 'il';
    case 'Aine_il':
      return aine?.genre === 'f' ? 'Elle' : 'Il';
    case 'Parent_il':
      return parent?.genre === 'f' ? 'Elle' : 'Il';
    case 'aine_e':
      return aine?.genre === 'f' ? 'e' : '';
    case 'element':
      return R.elements[s.creation.element]?.nom;
    case 'causeMort':
      return typeof s.drapeaux['cause_mort'] === 'string' ? (s.drapeaux['cause_mort'] as string) : 'mort au combat';
    case 'biju':
      return R.contenu.bijus.find((b) => b.id === s.tirages?.biju)?.nom ?? 'une bête à queues';
    case 'arme':
      return s.armeEquipee ? R.armes[s.armeEquipee]?.nom : 'tes mains nues';
    case 'age':
      return String(Math.floor((s.jour - s.naissance) / 360));
    case 'conjoint':
      return famille(s).conjointF ? 'ta femme' : 'ton mari';
    case 'Conjoint':
      return famille(s).conjointF ? 'Ta femme' : 'Ton mari';
    case 'conjointNom':
      return famille(s).conjointNom;
    case 'conjoint_il':
      return famille(s).conjointF ? 'elle' : 'il';
    case 'conjoint_e':
      return famille(s).conjointF ? 'e' : '';
    case 'enfant':
      return famille(s).enfantF ? 'ta fille' : 'ton fils';
    case 'Enfant':
      return famille(s).enfantF ? 'Ta fille' : 'Ton fils';
    case 'enfantNom':
      return famille(s).enfantNom;
    case 'enfant_il':
      return famille(s).enfantF ? 'elle' : 'il';
    case 'Enfant_il':
      return famille(s).enfantF ? 'Elle' : 'Il';
    case 'enfant_e':
      return famille(s).enfantF ? 'e' : '';
    case 'enfant_le':
      return famille(s).enfantF ? 'la' : 'le';
    case 'mortRecente':
    case 'mortRecente_e':
    case 'mortRecenteCause': {
      const id = s.drapeaux['mort_recente'];
      const d = typeof id === 'string' ? defPnj(s, id) : undefined;
      if (jeton === 'mortRecente_e') return d?.genre === 'f' ? 'e' : '';
      if (jeton === 'mortRecenteCause') return (typeof id === 'string' && s.pnj[id]?.cause) || 'tombé·e au loin';
      return d?.nom ?? 'un proche';
    }
    default:
      return undefined;
  }
}

const FEMININS_IRREGULIERS: Record<string, string> = {
  malin: 'maligne',
  fou: 'folle',
  discret: 'discrète',
  secret: 'secrète',
  complet: 'complète',
  inquiet: 'inquiète',
  muet: 'muette',
  compagnon: 'compagne',
};

/** Féminin d'un mot porteur d'une forme inclusive « base·suffixe ». */
function feminin(base: string, suffixe: string): string {
  const min = base.toLowerCase();
  const maj = base !== min;
  const resultat = (() => {
    if (FEMININS_IRREGULIERS[min]) return FEMININS_IRREGULIERS[min];
    if (suffixe === 'folle') return 'folle';
    if (suffixe === 'ère') return min.replace(/er$/, 'ère');
    if (suffixe === 've') return min.replace(/f$/, 've');
    if (suffixe === 'rice') return min.replace(/eur$/, 'rice');
    if (suffixe === 'se') {
      if (/x$/.test(min)) return min.replace(/x$/, 'se');
      if (/eur$/.test(min)) return min.replace(/eur$/, 'euse');
      return min + 'se';
    }
    if (suffixe === 'ne' && /n$/.test(min)) return min + 'ne';
    return min + suffixe;
  })();
  return maj ? resultat.charAt(0).toUpperCase() + resultat.slice(1) : resultat;
}

/**
 * Accorde les formes inclusives restantes (« seul·e », « fier·ère », « un·e »), qui désignent toujours le joueur,
 * selon sa présentation. La présentation neutre conserve l'écriture inclusive.
 */
export function accorder(texte: string, presentation: GameState['creation']['presentation']): string {
  if (presentation === 'neutre') return texte;
  return texte.replace(/([A-Za-zÀ-ÿ]+)·([a-zÀ-ÿ]+)/g, (_, base: string, suffixe: string) => {
    if (presentation === 'masculin') return base;
    return feminin(base, suffixe);
  });
}

/** Dernier recours si un personnage n'existe pas (pas d'aîné·e, rival disparu…) : jamais d'accolades à l'écran. */
function repli(jeton: string): string | undefined {
  if (jeton === 'aineNom' || jeton === 'AineNom') return jeton[0] === 'A' ? 'Ton aîné·e' : 'ton aîné·e';
  if (/^(aine_e|e|parent_e)$/.test(jeton) || /^e:/.test(jeton)) return '';
  if (/^(il|aine_il|parent_il):?/.test(jeton)) return 'il';
  if (jeton.startsWith('@')) {
    const roles: Record<string, string> = { '@rival': 'ton rival', '@sensei': 'ton sensei', '@coequipierA': 'ton ami·e', '@coequipierB': 'ton coéquipier', '@parent': 'ton parent', '@aine': 'ton aîné·e', '@kage': 'le Kage' };
    return roles[jeton] ?? 'quelqu’un';
  }
  return undefined;
}

export function interpoler(texte: string, s: GameState): string {
  return accorder(
    texte.replace(/\{([^{}]+)\}/g, (brut, jeton: string) => valeurJeton(s, jeton) ?? repli(jeton) ?? brut),
    s.creation.presentation,
  );
}

export function resoudreTexte(t: Texte | undefined, s: GameState): string {
  if (!t) return '';
  if (typeof t === 'string') return interpoler(t, s);
  return t
    .filter((seg) => evaluer(seg.si, s))
    .map((seg) => interpoler(seg.texte, s))
    .join('\n\n');
}

/** Liste brute des jetons d'un texte (pour le diagnostic). */
export function jetonsDe(t: Texte | undefined): string[] {
  if (!t) return [];
  const brut = typeof t === 'string' ? [t] : t.map((x) => x.texte);
  const res: string[] = [];
  for (const x of brut) for (const m of x.matchAll(/\{([^{}]+)\}/g)) res.push(m[1]);
  return res;
}
